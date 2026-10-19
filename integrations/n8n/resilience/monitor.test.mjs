import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateUrl,probe,transition,sendAlert,tick} from './monitor.mjs';

test('health URL is HTTPS only and has no inline credentials',()=>{
  assert.equal(validateUrl('https://example.test/health'),'https://example.test/health');
  for(const value of ['http://example.test','https://u:p@example.test','file:///tmp/a']) assert.throws(()=>validateUrl(value));
});
test('three failures trigger one event, two recoveries trigger recovery',()=>{
  let s={},r;const now=2000000;
  for(let i=0;i<2;i++){r=transition(s,false,now+i);s=r.next;assert.equal(r.event,null);}
  r=transition(s,false,now+2); assert.equal(r.event,'down');s=r.next;s.pending=null;
  assert.equal(transition(s,false,now+900001).event,null);
  s=transition(s,true,now+900002).next;
  assert.equal(transition(s,true,now+900003).event,'recovered');
});
test('failed alert retries are rate limited even across restarts',()=>{
  const r=transition({status:'down',pending:'down',lastAttempt:2000000},false,2000100);
  assert.equal(r.event,null);
  assert.equal(transition(JSON.parse(JSON.stringify(r.next)),false,2900001).event,'down');
});
test('probe and alert reject network failure without exposing server response',async()=>{
  const fail=async()=>{throw new Error('contains secret');};
  assert.equal(await probe('https://example.test',fail),false);
  assert.equal(await sendAlert('https://example.test',{},fail),false);
  assert.equal(await probe('https://example.test',async(_u,opts)=>{
    assert.equal(opts.redirect,'error');assert.ok(opts.signal);return {ok:false};
  }),false);
});
test('attempt is persisted before delivery and unchanged outage stays quiet',async()=>{
  const calls=[];const state={n8n:{status:'unknown',fails:2}};
  const config={targets:[{name:'n8n',url:'https://example.test'}],alertUrl:'https://alert.test'};
  const io={probe:async()=>false,persist:async()=>calls.push('save'),sendAlert:async()=>{calls.push('send');return true;}};
  await tick(config,state,io);assert.deepEqual(calls,['save','send','save']);
  calls.length=0;await tick(config,state,io);assert.deepEqual(calls,['save']);
});
