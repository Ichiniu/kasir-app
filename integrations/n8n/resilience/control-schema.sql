-- Install ONLY in a separate automation database (for example casir_automation).
-- Do not run in the POS database or modify n8n's internal tables.
BEGIN;
CREATE SCHEMA IF NOT EXISTS casir_control;
REVOKE ALL ON SCHEMA casir_control FROM PUBLIC;

CREATE TABLE IF NOT EXISTS casir_control.breaker (
  id integer PRIMARY KEY CHECK (id=1),
  opened_at timestamptz,
  open_until timestamptz
);
ALTER TABLE casir_control.breaker ADD COLUMN IF NOT EXISTS blocked_reason text;
INSERT INTO casir_control.breaker(id) VALUES(1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS casir_control.requests (
  device text NOT NULL,
  message_id text NOT NULL,
  owner_id text NOT NULL,
  execution_id text NOT NULL,
  status text NOT NULL CHECK(status IN ('processing','ready','sending','sent','preview','unknown','review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz NOT NULL,
  reply text,
  failure_code text,
  PRIMARY KEY(device,message_id),
  CHECK(length(device) <= 150 AND length(message_id) <= 128),
  CHECK(reply IS NULL OR length(reply) <= 3500)
);
CREATE INDEX IF NOT EXISTS casir_requests_owner_time ON casir_control.requests(owner_id,created_at);
CREATE INDEX IF NOT EXISTS casir_requests_created ON casir_control.requests(created_at);
CREATE INDEX IF NOT EXISTS casir_requests_status ON casir_control.requests(status,lease_until);

CREATE OR REPLACE FUNCTION casir_control.admit(p_device text,p_message text,p_owner text,p_execution text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,casir_control SET statement_timeout='3s' SET lock_timeout='1s' AS $$
DECLARE b casir_control.breaker%ROWTYPE; active_count integer;
BEGIN
  -- Serialize admission across ALL executions/workers using a single row lock.
  SELECT * INTO b FROM casir_control.breaker WHERE id=1 FOR UPDATE;
  IF p_owner IS NULL OR length(p_owner) NOT BETWEEN 1 AND 150 OR
     p_device IS NULL OR length(p_device) NOT BETWEEN 1 AND 150 OR
     p_message IS NULL OR length(p_message) NOT BETWEEN 1 AND 128 OR
     p_execution IS NULL OR length(p_execution) NOT BETWEEN 1 AND 150 THEN
    RAISE EXCEPTION 'INVALID_ADMISSION_INPUT';
  END IF;
  IF EXISTS(SELECT 1 FROM casir_control.requests WHERE device=p_device AND message_id=p_message) THEN
    RETURN jsonb_build_object('allowed',false,'reason','DUPLICATE','httpStatus',200);
  END IF;
  -- Expired work is held for review, NEVER automatically retried.
  UPDATE casir_control.requests SET status=CASE WHEN status='sending' THEN 'unknown' ELSE 'review' END,
    failure_code='LEASE_EXPIRED'
    WHERE status IN ('processing','ready','sending') AND lease_until < now();
  IF FOUND THEN
    UPDATE casir_control.breaker SET blocked_reason='STALE_EXECUTION' WHERE id=1;
    b.blocked_reason := 'STALE_EXECUTION';
  END IF;
  IF b.blocked_reason IS NOT NULL THEN
    RETURN jsonb_build_object('allowed',false,'reason','MANUAL_REVIEW_REQUIRED','httpStatus',503);
  END IF;
  IF b.open_until > now() THEN
    RETURN jsonb_build_object('allowed',false,'reason','CIRCUIT_OPEN','httpStatus',503);
  END IF;
  SELECT count(*) INTO active_count FROM casir_control.requests WHERE status IN ('processing','ready','sending');
  IF active_count >= 2 OR (b.open_until IS NOT NULL AND active_count > 0) OR
     EXISTS(SELECT 1 FROM casir_control.requests WHERE owner_id=p_owner AND status IN ('processing','ready','sending')) THEN
    RETURN jsonb_build_object('allowed',false,'reason','BUSY','httpStatus',429);
  END IF;
  IF (SELECT count(*) FROM casir_control.requests WHERE created_at > now()-interval '1 minute') >= 20 OR
     (SELECT count(*) FROM casir_control.requests WHERE owner_id=p_owner AND created_at > now()-interval '1 minute') >= 3 OR
     (SELECT count(*) FROM casir_control.requests WHERE owner_id=p_owner AND created_at > now()-interval '24 hours') >= 100 THEN
    RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMIT','httpStatus',429);
  END IF;
  INSERT INTO casir_control.requests(device,message_id,owner_id,execution_id,status,lease_until)
    VALUES(p_device,p_message,p_owner,p_execution,'processing',now()+interval '180 seconds');
  RETURN jsonb_build_object('allowed',true,'httpStatus',200);
END $$;

CREATE OR REPLACE FUNCTION casir_control.save_reply(p_device text,p_message text,p_execution text,p_reply text,p_failed boolean)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,casir_control SET statement_timeout='3s' SET lock_timeout='1s' AS $$
DECLARE admitted_at timestamptz;
BEGIN
  PERFORM 1 FROM casir_control.breaker WHERE id=1 FOR UPDATE;
  UPDATE casir_control.requests SET status='ready',reply=p_reply,
    failure_code=CASE WHEN p_failed THEN 'DEPENDENCY_FAILURE' ELSE NULL END
    WHERE device=p_device AND message_id=p_message AND execution_id=p_execution
      AND status='processing' AND lease_until>now()
    RETURNING created_at INTO admitted_at;
  IF NOT FOUND THEN RETURN jsonb_build_object('saved',false); END IF;
  IF p_failed THEN
    UPDATE casir_control.breaker SET opened_at=now(),open_until=now()+interval '60 seconds' WHERE id=1;
  ELSE
    -- An older concurrent success must not close a newer outage.
    UPDATE casir_control.breaker SET opened_at=NULL,open_until=NULL
      WHERE id=1 AND (opened_at IS NULL OR opened_at<=admitted_at);
  END IF;
  RETURN jsonb_build_object('saved',true);
END $$;

CREATE OR REPLACE FUNCTION casir_control.claim_delivery(p_device text,p_message text,p_execution text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,casir_control SET statement_timeout='3s' SET lock_timeout='1s' AS $$
DECLARE body text;
BEGIN
  UPDATE casir_control.requests SET status='sending'
    WHERE device=p_device AND message_id=p_message AND execution_id=p_execution
      AND status='ready' AND lease_until>now() RETURNING reply INTO body;
  IF NOT FOUND THEN RETURN jsonb_build_object('claimed',false); END IF;
  RETURN jsonb_build_object('claimed',true,'message',body);
END $$;

CREATE OR REPLACE FUNCTION casir_control.finish(p_device text,p_message text,p_execution text,p_status text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,casir_control SET statement_timeout='3s' SET lock_timeout='1s' AS $$
BEGIN
  IF p_status NOT IN ('sent','unknown','preview') THEN RAISE EXCEPTION 'INVALID_FINAL_STATUS'; END IF;
  PERFORM 1 FROM casir_control.breaker WHERE id=1 FOR UPDATE;
  UPDATE casir_control.requests SET status=p_status,
    failure_code=CASE WHEN p_status='unknown' THEN 'DELIVERY_UNCERTAIN' ELSE failure_code END,
    reply=CASE WHEN p_status IN ('sent','preview') THEN NULL ELSE reply END
    WHERE device=p_device AND message_id=p_message AND execution_id=p_execution
      AND ((p_status='preview' AND status='ready') OR (p_status IN ('sent','unknown') AND status='sending'));
  IF NOT FOUND THEN RETURN jsonb_build_object('updated',false); END IF;
  IF p_status='unknown' THEN
    UPDATE casir_control.breaker SET opened_at=now(),open_until=now()+interval '60 seconds' WHERE id=1;
  END IF;
  RETURN jsonb_build_object('updated',true);
END $$;

CREATE OR REPLACE FUNCTION casir_control.maintenance()
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,casir_control SET statement_timeout='3s' SET lock_timeout='1s' AS $$
DECLARE stalled integer;
BEGIN
  PERFORM 1 FROM casir_control.breaker WHERE id=1 FOR UPDATE;
  UPDATE casir_control.requests SET status=CASE WHEN status='sending' THEN 'unknown' ELSE 'review' END,
    failure_code='LEASE_EXPIRED'
    WHERE status IN ('processing','ready','sending') AND lease_until<now();
  IF FOUND THEN
    UPDATE casir_control.breaker SET blocked_reason='STALE_EXECUTION' WHERE id=1;
  END IF;
  -- Brief retention of report text; retain dedup/audit metadata longer.
  UPDATE casir_control.requests SET reply=NULL WHERE reply IS NOT NULL AND created_at<now()-interval '1 hour';
  DELETE FROM casir_control.requests WHERE created_at<now()-interval '7 days';
  SELECT count(*) INTO stalled FROM casir_control.requests WHERE status IN ('review','unknown')
    AND failure_code IS DISTINCT FROM 'OPERATOR_REVIEWED';
  RETURN jsonb_build_object('needsReview',stalled,'checkedAt',now(),
    'blocked',(SELECT blocked_reason IS NOT NULL FROM casir_control.breaker WHERE id=1));
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA casir_control FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA casir_control FROM PUBLIC;
COMMIT;

-- Administrator: grant a dedicated automation login access to this schema only.
-- These functions are SECURITY INVOKER; its role needs SELECT/INSERT/UPDATE/DELETE
-- on these two control tables and EXECUTE on these functions (no POS access).
-- Set statement_timeout=3s, lock_timeout=1s on THAT role too (function SET alone
-- must not be treated as an absolute statement timer on every PostgreSQL version).
