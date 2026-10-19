import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
let db,seq=0;
const root='6289649261851',member='628000000001',catalog=[{id:'solo',name:'Solo'},{id:'jogja',name:'Jogja'}];
before(async()=>{
 db=new PGlite();await db.exec('CREATE ROLE casir_automation_worker LOGIN;');
 await db.exec(readFileSync(new URL('./control-schema.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('./whitelist-schema.sql',import.meta.url),'utf8'));
});
after(async()=>await db?.close());
beforeEach(async()=>{await db.exec('TRUNCATE casir_control.requests,casir_control.whitelist_members,casir_control.whitelist_pending,casir_control.whitelist_audit,casir_control.whitelist_commands;');});
async function command(action,overrides={}){
 const a={owner:'owner-casir',device:'bot',actor:root,message:'m'+(++seq),execution:'e'+seq,target:member,outlets:['solo'],code:'',catalog,...overrides};
 await db.query(`INSERT INTO casir_control.requests(device,message_id,owner_id,execution_id,status,lease_until)
  VALUES($1,$2,$3,$4,'processing',now()+interval '180 seconds') ON CONFLICT DO NOTHING`,[a.device,a.message,a.owner,a.execution]);
 return (await db.query('SELECT casir_control.whitelist_command($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) AS result',
  [a.owner,a.device,a.actor,a.message,a.execution,action,a.target,a.outlets,a.code,JSON.stringify(a.catalog)])).rows[0].result;
}
const lookup=async(phone=member,device='bot')=>(await db.query('SELECT casir_control.whitelist_lookup($1,$2,$3) AS result',['owner-casir',device,phone])).rows[0].result;
async function register(outlets=['solo']) {const p=await command('add',{outlets});return command('confirm',{code:p.code});}

test('adding requires confirmation; only selected outlets are granted',async()=>{
 const p=await command('add');assert.equal(p.pending,true);assert.equal((await lookup()).authorized,false);
 assert.equal((await command('confirm',{code:p.code})).ok,true);
 assert.deepEqual(await lookup(),{authorized:true,isOwner:false,outletIds:['solo']});
 assert.equal((await lookup(member,'another-bot')).authorized,false);
 assert.equal((await db.query('SELECT * FROM casir_control.whitelist_audit')).rows.length,1);
});
test('delegated sender cannot add, remove, list, confirm or cancel',async()=>{
 await register();
 for(const action of ['add','remove','list','confirm','cancel']) assert.equal((await command(action,{actor:member})).ok,false);
 assert.deepEqual((await lookup()).outletIds,['solo']);
});
test('primary owner cannot be added or removed via chat',async()=>{
 for(const action of ['add','remove']) assert.equal((await command(action,{target:root})).ok,false);
 assert.equal((await lookup(root)).isOwner,true);
});
test('confirmation is bound to owner/device, expires and cannot be replayed',async()=>{
 const p=await command('add');
 assert.equal((await command('confirm',{actor:member,code:p.code})).ok,false);
 assert.equal((await command('confirm',{device:'other',code:p.code})).ok,false);
 await command('confirm',{code:p.code});assert.equal((await command('confirm',{code:p.code})).ok,false);
 const p2=await command('remove');await db.exec("UPDATE casir_control.whitelist_pending SET expires_at=now()-interval '1 second';");
 assert.equal((await command('confirm',{code:p2.code})).ok,false);assert.equal((await lookup()).authorized,true);
});
test('cancel and a newer proposal invalidate older confirmation',async()=>{
 const a=await command('add'),b=await command('add',{outlets:['jogja']});
 assert.equal((await command('confirm',{code:a.code})).ok,false);
 await command('cancel',{code:b.code});assert.equal((await command('confirm',{code:b.code})).ok,false);
 assert.equal((await lookup()).authorized,false);
});
test('unknown outlet and changed catalogue cannot grant access',async()=>{
 assert.equal((await command('add',{outlets:['foreign']})).ok,false);
 assert.equal((await command('add',{outlets:[]})).ok,false);
 const p=await command('add');assert.equal((await command('confirm',{code:p.code,catalog:[catalog[1]]})).ok,false);
 assert.equal((await lookup()).authorized,false);
});
test('re-adding replaces access; removing revokes future lookups',async()=>{
 await register(['solo','jogja']);await register(['jogja']);assert.deepEqual((await lookup()).outletIds,['jogja']);
 const p=await command('remove');assert.equal((await lookup()).authorized,true);
 await command('confirm',{code:p.code});assert.equal((await lookup()).authorized,false);
});
test('duplicate command does not generate a second pending change',async()=>{
 const a={message:'same',execution:'same'};
 const first=await command('add',a), second=await command('add',a);
 assert.equal(first.code,second.code);assert.equal((await db.query('SELECT * FROM casir_control.whitelist_pending')).rows.length,1);
});
test('runtime login cannot directly edit ACL or owner phone',async()=>{
 await db.exec('GRANT USAGE ON SCHEMA casir_control TO casir_automation_worker; SET ROLE casir_automation_worker;');
 try {
  await assert.rejects(db.exec("UPDATE casir_control.whitelist_owners SET phone='628000000009';"));
  await assert.rejects(db.exec('DELETE FROM casir_control.whitelist_members;'));
  assert.equal((await lookup(root)).isOwner,true);
 } finally {await db.exec('RESET ROLE;');}
});

const workflow=JSON.parse(readFileSync(new URL('../workflow-casir.json',import.meta.url),'utf8'));
async function run(name,json,refs){
 const js=workflow.nodes.find(n=>n.name===name).parameters.jsCode;
 const sandbox={$json:json,$:ref=>({first:()=>({json:refs[ref]})})};
 return JSON.parse(JSON.stringify(await new vm.Script('(async()=>{'+js+'})()').runInNewContext(sandbox,{timeout:1000})))[0].json;
}
test('command parser restricts administration to root and leaves reports alone',async()=>{
 for(const text of ['tambah whitelist '+member+' untuk outlet Solo','hapus whitelist '+member,'lihat whitelist','KONFIRMASI ABCDEF123456']){
  const r=await run('Baca Perintah Whitelist',{}, {'Otorisasi Owner':{question:text,isOwner:false}});assert.equal(r.denied,true);
 }
 const r=await run('Baca Perintah Whitelist',{}, {'Otorisasi Owner':{question:'Penjualan hari ini',isOwner:false}});assert.equal(r.isManagement,false);
});
test('name resolution rejects ambiguous names and accepts explicit ID',async()=>{
 const duplicate=[catalog[0],{id:'solo2',name:'Solo'}];
 const refs={'Otorisasi Owner':{isOwner:true,allowedOutletIds:['solo','solo2']},'Baca Perintah Whitelist':{command:{action:'add',target:member,outletSelectors:['Solo'],code:''}}};
 assert.equal((await run('Siapkan Aksi Whitelist',{outlets:duplicate},refs)).action,'help');
 refs['Baca Perintah Whitelist'].command.outletSelectors=['solo2'];
 assert.deepEqual((await run('Siapkan Aksi Whitelist',{outlets:duplicate},refs)).outletIds,['solo2']);
});
test('delegated report scope is intersection, payload cannot claim owner',async()=>{
 const context={knownDevice:true,owner:{phone:root,ownerId:'owner-casir',deviceId:'bot',gowaDeviceId:'bot',outletIds:['solo']},message:{sender:member,question:'x'}};
 const refs={'Pilih Owner Perangkat':context};
 const r=await run('Otorisasi Owner',{access:{authorized:true,isOwner:false,outletIds:['solo','foreign']},isOwner:true},refs);
 assert.equal(r.isOwner,false);assert.deepEqual(r.allowedOutletIds,['solo']);
 assert.equal((await run('Otorisasi Owner',{access:{authorized:true,isOwner:true}},refs)).authorized,false);
});

test('Code node sources match importable workflow and management never reaches AI directly',()=>{
 const mappings={'identify':'Pilih Owner Perangkat','authorize':'Otorisasi Owner','parse':'Baca Perintah Whitelist','prepare':'Siapkan Aksi Whitelist','format':'Balasan Hasil Whitelist'};
 for(const [file,name] of Object.entries(mappings))
  assert.equal(workflow.nodes.find(n=>n.name===name).parameters.jsCode.trim(),readFileSync(new URL('../whitelist/'+file+'.code.txt',import.meta.url),'utf8').trim());
 const seen=new Set(),queue=['Daftar Outlet untuk Whitelist'];
 while(queue.length){const name=queue.shift();if(seen.has(name))continue;seen.add(name);
  assert.notEqual(name,'AI Agent Laporan Casir');
  for(const output of workflow.connections[name]?.main || [])for(const edge of output)queue.push(edge.node);
 }
});

test('owner must confirm within the admitted execution, not using a saved message id',async()=>{
 const p=await command('add');
 const result=(await db.query('SELECT casir_control.whitelist_command($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) AS r',
  ['owner-casir','bot',root,'missing','wrong','confirm',member,['solo'],p.code,JSON.stringify(catalog)])).rows[0].r;
 assert.equal(result.ok,false);assert.equal((await lookup()).authorized,false);
});
