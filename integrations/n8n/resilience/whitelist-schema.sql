-- Run as database administrator in n8n_kasir, AFTER control-schema.sql.
-- Adds access control only; never run this migration in the POS database.
BEGIN;
CREATE TABLE IF NOT EXISTS casir_control.whitelist_owners (
  owner_id text PRIMARY KEY,
  phone text UNIQUE NOT NULL CHECK(phone ~ '^[1-9][0-9]{7,14}$'),
  active boolean NOT NULL DEFAULT true
);
INSERT INTO casir_control.whitelist_owners(owner_id,phone)
VALUES('owner-casir','6289649261851') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS casir_control.whitelist_members (
  owner_id text NOT NULL REFERENCES casir_control.whitelist_owners(owner_id),
  device text NOT NULL,
  phone text NOT NULL CHECK(phone ~ '^[1-9][0-9]{7,14}$'),
  outlet_ids text[] NOT NULL CHECK(cardinality(outlet_ids) BETWEEN 1 AND 20),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,device,phone)
);
CREATE TABLE IF NOT EXISTS casir_control.whitelist_pending (
  code text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES casir_control.whitelist_owners(owner_id),
  device text NOT NULL,
  actor text NOT NULL,
  action text NOT NULL CHECK(action IN ('add','remove')),
  target text NOT NULL,
  outlet_ids text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes',
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS casir_whitelist_pending_owner ON casir_control.whitelist_pending(owner_id,device,expires_at);
CREATE TABLE IF NOT EXISTS casir_control.whitelist_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id text NOT NULL,
  device text NOT NULL,
  actor text NOT NULL,
  target text NOT NULL,
  action text NOT NULL,
  outlet_ids text[] NOT NULL,
  message_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS casir_whitelist_audit_time ON casir_control.whitelist_audit(created_at);
CREATE TABLE IF NOT EXISTS casir_control.whitelist_commands (
  owner_id text NOT NULL,
  device text NOT NULL,
  message_id text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,device,message_id)
);

-- These functions have fixed SQL and a locked search_path. The runtime login gets
-- EXECUTE only on these functions; it cannot directly edit owner/member tables.
CREATE OR REPLACE FUNCTION casir_control.whitelist_lookup(p_owner text,p_device text,p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,casir_control AS $$
DECLARE root casir_control.whitelist_owners%ROWTYPE; ids text[];
BEGIN
 SELECT * INTO root FROM casir_control.whitelist_owners WHERE owner_id=p_owner AND active;
 IF NOT FOUND THEN RETURN jsonb_build_object('authorized',false); END IF;
 IF root.phone=p_phone THEN RETURN jsonb_build_object('authorized',true,'isOwner',true); END IF;
 SELECT outlet_ids INTO ids FROM casir_control.whitelist_members
   WHERE owner_id=p_owner AND device=p_device AND phone=p_phone AND active;
 RETURN jsonb_build_object('authorized',FOUND,'isOwner',false,'outletIds',COALESCE(ids,ARRAY[]::text[]));
END $$;

CREATE OR REPLACE FUNCTION casir_control.whitelist_command(
 p_owner text,p_device text,p_actor text,p_message text,p_execution text,
 p_action text,p_target text,p_outlets text[],p_code text,p_catalog jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,casir_control AS $$
DECLARE root casir_control.whitelist_owners%ROWTYPE;
 pending casir_control.whitelist_pending%ROWTYPE;
 result jsonb; token text; labels text; members jsonb; catalog_ids text[];
BEGIN
 SELECT * INTO root FROM casir_control.whitelist_owners WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND OR NOT root.active OR root.phone IS DISTINCT FROM p_actor THEN
   RETURN jsonb_build_object('ok',false,'message','Hanya owner utama yang boleh mengelola whitelist.');
 END IF;
 -- Must be an admitted, unexpired request, not a standalone/replayed tool call.
 IF NOT EXISTS(SELECT 1 FROM casir_control.requests WHERE owner_id=p_owner AND device=p_device
   AND message_id=p_message AND execution_id=p_execution AND status='processing' AND lease_until>now()) THEN
   RETURN jsonb_build_object('ok',false,'message','Permintaan tidak aktif. Kirim pesan baru.');
 END IF;
 SELECT c.result INTO result FROM casir_control.whitelist_commands c
   WHERE owner_id=p_owner AND device=p_device AND message_id=p_message;
 IF FOUND THEN RETURN result; END IF;
 -- Bounded cleanup; maximum admitted traffic is already controlled by admit().
 DELETE FROM casir_control.whitelist_pending WHERE owner_id=p_owner AND expires_at<now()-interval '1 day';
 DELETE FROM casir_control.whitelist_commands WHERE owner_id=p_owner AND created_at<now()-interval '7 days';
 DELETE FROM casir_control.whitelist_audit WHERE owner_id=p_owner AND created_at<now()-interval '90 days';
 IF jsonb_typeof(p_catalog) IS DISTINCT FROM 'array' OR jsonb_array_length(p_catalog)>20 THEN
   RAISE EXCEPTION 'INVALID_OUTLET_CATALOG';
 END IF;
 SELECT COALESCE(array_agg(v->>'id'),ARRAY[]::text[]) INTO catalog_ids FROM jsonb_array_elements(p_catalog)v;

 IF p_action IN ('add','remove') THEN
   IF p_target IS NULL OR p_target !~ '^[1-9][0-9]{7,14}$' THEN
     result:=jsonb_build_object('ok',false,'message','Nomor harus memakai format internasional, contoh 628123456789.');
   ELSIF EXISTS(SELECT 1 FROM casir_control.whitelist_owners WHERE phone=p_target) THEN
     result:=jsonb_build_object('ok',false,'message','Nomor owner utama tidak dapat diubah melalui whitelist.');
   ELSIF p_action='add' AND (COALESCE(cardinality(p_outlets),0) NOT BETWEEN 1 AND 20 OR NOT p_outlets <@ catalog_ids) THEN
     result:=jsonb_build_object('ok',false,'message','Pilih outlet yang ada pada daftar outlet owner.');
   ELSIF p_action='remove' AND NOT EXISTS(SELECT 1 FROM casir_control.whitelist_members
       WHERE owner_id=p_owner AND device=p_device AND phone=p_target AND active) THEN
     result:=jsonb_build_object('ok',false,'message','Nomor tersebut belum aktif di whitelist.');
   ELSIF p_action='add' AND (SELECT count(*) FROM casir_control.whitelist_members WHERE owner_id=p_owner AND device=p_device)>=100
     AND NOT EXISTS(SELECT 1 FROM casir_control.whitelist_members WHERE owner_id=p_owner AND device=p_device AND phone=p_target) THEN
     result:=jsonb_build_object('ok',false,'message','Batas 100 nomor tercapai. Hubungi operator.');
   ELSE
     -- One pending change per owner/device; a newer proposal cancels the older one.
     UPDATE casir_control.whitelist_pending SET used_at=now()
       WHERE owner_id=p_owner AND device=p_device AND used_at IS NULL;
     token:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
     SELECT string_agg((v->>'name')||' ['||(v->>'id')||']',', ' ORDER BY v->>'name') INTO labels
       FROM jsonb_array_elements(p_catalog)v WHERE v->>'id'=ANY(p_outlets);
     INSERT INTO casir_control.whitelist_pending(code,owner_id,device,actor,action,target,outlet_ids)
       VALUES(token,p_owner,p_device,p_actor,p_action,p_target,COALESCE(p_outlets,ARRAY[]::text[]));
     result:=jsonb_build_object('ok',true,'pending',true,'code',token,'message',
       CASE WHEN p_action='add' THEN 'Simpan akses laporan untuk '||p_target||' ke outlet: '||labels||
         '. Daftar ini mengganti akses sebelumnya untuk nomor tersebut.'
       ELSE 'Hapus akses laporan nomor '||p_target||'.' END||
       E'\nBelum disimpan. Balas KONFIRMASI '||token||' dalam 5 menit, atau BATAL '||token||'.');
   END IF;
 ELSIF p_action IN ('confirm','cancel') THEN
   SELECT * INTO pending FROM casir_control.whitelist_pending
     WHERE code=upper(p_code) AND owner_id=p_owner AND device=p_device AND actor=p_actor
       AND used_at IS NULL AND expires_at>now() FOR UPDATE;
   IF NOT FOUND THEN result:=jsonb_build_object('ok',false,'message','Kode tidak valid, sudah dipakai, atau kedaluwarsa. Buat permintaan baru.');
   ELSIF p_action='cancel' THEN
     UPDATE casir_control.whitelist_pending SET used_at=now() WHERE code=pending.code;
     result:=jsonb_build_object('ok',true,'message','Perubahan whitelist dibatalkan.');
   ELSIF pending.action='add' AND NOT pending.outlet_ids <@ catalog_ids THEN
     UPDATE casir_control.whitelist_pending SET used_at=now() WHERE code=pending.code;
     result:=jsonb_build_object('ok',false,'message','Daftar outlet berubah. Buat permintaan baru dengan outlet yang tersedia.');
   ELSE
     IF pending.action='add' THEN
       INSERT INTO casir_control.whitelist_members(owner_id,device,phone,outlet_ids)
         VALUES(p_owner,p_device,pending.target,pending.outlet_ids)
       ON CONFLICT(owner_id,device,phone) DO UPDATE SET outlet_ids=EXCLUDED.outlet_ids,active=true,updated_at=now();
     ELSE
       UPDATE casir_control.whitelist_members SET active=false,updated_at=now()
         WHERE owner_id=p_owner AND device=p_device AND phone=pending.target;
     END IF;
     UPDATE casir_control.whitelist_pending SET used_at=now() WHERE code=pending.code;
     INSERT INTO casir_control.whitelist_audit(owner_id,device,actor,target,action,outlet_ids,message_id)
       VALUES(p_owner,p_device,p_actor,pending.target,pending.action,pending.outlet_ids,p_message);
     result:=jsonb_build_object('ok',true,'message',CASE WHEN pending.action='add'
       THEN 'Whitelist tersimpan. '||pending.target||' hanya boleh membaca laporan outlet yang dipilih, tanpa hak mengelola whitelist.'
       ELSE 'Akses whitelist '||pending.target||' sudah dicabut untuk permintaan berikutnya.' END);
   END IF;
 ELSIF p_action='list' THEN
   SELECT COALESCE(jsonb_agg(to_jsonb(m)),'[]'::jsonb) INTO members FROM
     (SELECT phone,outlet_ids FROM casir_control.whitelist_members WHERE owner_id=p_owner AND device=p_device AND active ORDER BY phone LIMIT 100)m;
   result:=jsonb_build_object('ok',true,'members',members);
 ELSIF p_action='outlets' THEN result:=jsonb_build_object('ok',true,'outlets',p_catalog);
 ELSE result:=jsonb_build_object('ok',false,'message','Format: tambah whitelist 628... untuk outlet Nama A, Nama B; hapus whitelist 628...; lihat whitelist; daftar outlet; KONFIRMASI kode; BATAL kode.');
 END IF;
 INSERT INTO casir_control.whitelist_commands(owner_id,device,message_id,result) VALUES(p_owner,p_device,p_message,result);
 RETURN result;
END $$;

REVOKE ALL ON casir_control.whitelist_owners,casir_control.whitelist_members,
 casir_control.whitelist_pending,casir_control.whitelist_audit,casir_control.whitelist_commands
 FROM PUBLIC,casir_automation_worker;
REVOKE ALL ON FUNCTION casir_control.whitelist_lookup(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION casir_control.whitelist_command(text,text,text,text,text,text,text,text[],text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION casir_control.whitelist_lookup(text,text,text) TO casir_automation_worker;
GRANT EXECUTE ON FUNCTION casir_control.whitelist_command(text,text,text,text,text,text,text,text[],text,jsonb) TO casir_automation_worker;
COMMIT;
-- Do not grant ALL TABLES access again: whitelist tables intentionally allow only
-- controlled functions. Owner phone cannot be changed by the runtime login.
