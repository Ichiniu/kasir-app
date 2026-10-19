import {test, before, after, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

let db;
before(async()=>{db=new PGlite(); await db.exec(readFileSync(new URL('./control-schema.sql',import.meta.url),'utf8'));});
after(async()=>{await db?.close();});
beforeEach(async()=>{await db.exec('TRUNCATE casir_control.requests; UPDATE casir_control.breaker SET opened_at=NULL,open_until=NULL,blocked_reason=NULL;');});
async function call(name,args=[]) {
  const placeholders=args.map((_,i)=>'$'+(i+1)).join(',');
  return (await db.query(`SELECT casir_control.${name}(${placeholders}) AS result`,args)).rows[0].result;
}
const admit=(id='m1',owner='owner1')=>call('admit',['device',id,owner,'exec-'+id]);
const save=(id='m1',failed=false)=>call('save_reply',['device',id,'exec-'+id,'Laporan tersedia',failed]);
const claim=(id='m1')=>call('claim_delivery',['device',id,'exec-'+id]);
const finish=(id='m1',status='preview')=>call('finish',['device',id,'exec-'+id,status]);

test('schema can be applied again without dropping data',async()=>{
  await admit(); await db.exec(readFileSync(new URL('./control-schema.sql',import.meta.url),'utf8'));
  assert.equal((await admit()).reason,'DUPLICATE');
});
test('duplicate is acknowledged without another admission',async()=>{
  assert.equal((await admit()).allowed,true);
  assert.deepEqual(await admit(),{allowed:false,reason:'DUPLICATE',httpStatus:200});
});
test('one active request per owner and two globally',async()=>{
  await admit(); assert.equal((await admit('m2')).reason,'BUSY');
  assert.equal((await admit('m2','owner2')).allowed,true);
  assert.equal((await admit('m3','owner3')).reason,'BUSY');
});
test('three admitted requests per minute per owner',async()=>{
  for(let i=0;i<3;i++){assert.equal((await admit('m'+i)).allowed,true); await save('m'+i); await finish('m'+i);}
  assert.equal((await admit('m4')).reason,'RATE_LIMIT');
});
test('100 per rolling day and 20 per rolling minute globally',async()=>{
  await db.exec(`INSERT INTO casir_control.requests(device,message_id,owner_id,execution_id,status,created_at,lease_until)
    SELECT 'device',i::text,'owner1',i::text,'sent',now()-interval '2 minutes',now() FROM generate_series(1,100)i;`);
  assert.equal((await admit()).reason,'RATE_LIMIT');
  await db.exec(`TRUNCATE casir_control.requests; INSERT INTO casir_control.requests(device,message_id,owner_id,execution_id,status,lease_until)
    SELECT 'device',i::text,'other-'||i,i::text,'sent',now() FROM generate_series(1,20)i;`);
  assert.equal((await admit()).reason,'RATE_LIMIT');
});
test('dependency failure opens breaker, cooldown admits only one probe, success closes',async()=>{
  await admit(); await save('m1',true); await finish();
  assert.equal((await admit('m2','owner2')).reason,'CIRCUIT_OPEN');
  await db.exec("UPDATE casir_control.breaker SET open_until=now()-interval '1 second';");
  assert.equal((await admit('m2','owner2')).allowed,true);
  assert.equal((await admit('m3','owner3')).reason,'BUSY');
  await save('m2'); await finish('m2');
  assert.equal((await admit('m3','owner3')).allowed,true);
});
test('older concurrent success does not close a newer failure',async()=>{
  await admit(); await admit('m2','owner2');
  await db.exec("UPDATE casir_control.requests SET created_at=now()-interval '1 minute' WHERE message_id='m1';");
  await save('m2',true); await save(); await finish(); await finish('m2');
  assert.equal((await admit('m3','owner3')).reason,'CIRCUIT_OPEN');
});
test('delivery can only be claimed once, ambiguous send cannot retry',async()=>{
  await admit(); assert.equal((await claim()).claimed,false);
  await save(); assert.equal((await claim()).claimed,true); assert.equal((await claim()).claimed,false);
  await finish('m1','unknown'); assert.equal((await claim()).claimed,false);
  assert.equal((await admit()).reason,'DUPLICATE');
  assert.equal((await admit('m2','owner2')).reason,'CIRCUIT_OPEN');
});
test('execution identity guards save and claim; sent clears the report text',async()=>{
  await admit();
  assert.equal((await call('save_reply',['device','m1','wrong-exec','x',false])).saved,false);
  await save(); assert.equal((await call('claim_delivery',['device','m1','wrong-exec'])).claimed,false);
  await claim(); assert.equal((await finish('m1','sent')).updated,true);
  assert.equal((await db.query('SELECT reply FROM casir_control.requests')).rows[0].reply,null);
  assert.equal((await finish('m1','sent')).updated,false);
});
test('crashed executions move to review/unknown and never resume automatically',async()=>{
  await admit(); await admit('m2','owner2'); await save('m2'); await claim('m2');
  await db.exec("UPDATE casir_control.requests SET lease_until=now()-interval '1 second';");
  assert.equal((await save()).saved,false);
  assert.equal((await call('maintenance')).needsReview,2);
  assert.deepEqual((await db.query('SELECT status FROM casir_control.requests ORDER BY message_id')).rows.map(x=>x.status),['review','unknown']);
  assert.equal((await admit()).reason,'DUPLICATE'); assert.equal((await claim('m2')).claimed,false);
  assert.equal((await admit('m3','owner3')).reason,'MANUAL_REVIEW_REQUIRED');
});

test('admission itself blocks new work when a previous execution overstays its lease',async()=>{
  await admit(); await db.exec("UPDATE casir_control.requests SET lease_until=now()-interval '1 second';");
  assert.equal((await admit('m2','owner2')).reason,'MANUAL_REVIEW_REQUIRED');
  const status=await call('maintenance'); assert.equal(status.blocked,true);
});
test('retention clears text after one hour and metadata after seven days',async()=>{
  await admit(); await save();
  await db.exec("UPDATE casir_control.requests SET created_at=now()-interval '2 hours';");
  await call('maintenance'); assert.equal((await db.query('SELECT reply FROM casir_control.requests')).rows[0].reply,null);
  await db.exec("UPDATE casir_control.requests SET created_at=now()-interval '8 days';");
  await call('maintenance'); assert.equal((await db.query('SELECT * FROM casir_control.requests')).rows.length,0);
});
test('invalid admission input, final status and oversized reply fail',async()=>{
  await assert.rejects(call('admit',['','m','o','e'])); await admit();
  await assert.rejects(call('finish',['device','m1','exec-m1','processing']));
  await assert.rejects(call('save_reply',['device','m1','exec-m1','x'.repeat(3501),false]));
});

test('workflow control query rejects unsafe credentials before admission',async()=>{
  const w=JSON.parse(readFileSync(new URL('../workflow-casir.json',import.meta.url),'utf8'));
  const query=w.nodes.find(n=>n.name==='Klaim Pesan dan Batas Beban').parameters.query;
  const args=['device','m1','owner1','exec-m1'];
  assert.equal((await db.query(query,args)).rows[0].gate.reason,'UNSAFE_CONTROL_ROLE');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM casir_control.requests')).rows[0].n,0);
  await db.exec(`CREATE ROLE casir_control_test CONNECTION LIMIT 6;
    GRANT USAGE ON SCHEMA casir_control TO casir_control_test;
    GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA casir_control TO casir_control_test;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA casir_control TO casir_control_test;`);
  try {
    await db.exec("SET ROLE casir_control_test; SET statement_timeout='3s'; SET lock_timeout='1s';");
    assert.equal((await db.query(query,args)).rows[0].gate.allowed,true);
  } finally {await db.exec('RESET ROLE; RESET statement_timeout; RESET lock_timeout;');}
});
