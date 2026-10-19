// Run ONE instance on a different host/failure domain, not the monitored VPS.
// No production database access; fixed health endpoints only. No automatic restarts.
import {readFile, writeFile, rename, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

export function validateUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password || url.hash) throw new Error('HTTPS_URL_REQUIRED');
  return url.href;
}

export async function probe(url, fetcher=fetch) {
  try {
    const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(5000)});
    // Status only; do not log or buffer health response bodies (may contain DB errors).
    await response.body?.cancel();
    return response.ok;
  } catch { return false; }
}

export function transition(old={}, healthy, now=Date.now()) {
  const next={status:old.status||'unknown',fails:healthy?0:Math.min((old.fails||0)+1,3),
    good:healthy?Math.min((old.good||0)+1,2):0,lastAttempt:old.lastAttempt||0,
    pending:old.pending||null};
  if(next.fails>=3 && next.status!=='down') {next.status='down'; next.pending='down';}
  if(next.good>=2 && next.status!=='up') {const wasDown=next.status==='down';next.status='up';next.pending=wasDown?'recovered':null;}
  // At most one alert attempt per service per 15 minutes, including failed delivery.
  const event=next.pending && now-next.lastAttempt>=900000 ? next.pending:null;
  if(event) next.lastAttempt=now;
  return {next,event};
}

export async function sendAlert(url,payload,fetcher=fetch) {
  try {
    const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(5000)});
    await response.body?.cancel(); return response.ok;
  } catch {return false;}
}

export async function tick(config,state,io={probe,sendAlert,persist:async()=>{}}) {
  for(const target of config.targets) {
    const result=transition(state[target.name],await io.probe(target.url));
    state[target.name]=result.next;
    // Persist the attempt BEFORE external side effect; crash cannot cause an immediate alert storm.
    await io.persist(state);
    if(result.event) {
      const sent=await io.sendAlert(config.alertUrl,{service:target.name,event:result.event,time:new Date().toISOString()});
      if(sent) result.next.pending=null;
      console.log(JSON.stringify({service:target.name,event:result.event,alertSent:sent}));
      await io.persist(state);
    }
  }
  return state;
}

async function main() {
  const config={targets:[
    {name:'n8n',url:validateUrl(process.env.N8N_READINESS_URL)},
    {name:'casir-database',url:validateUrl(process.env.CASIR_HEALTH_URL)},
  ],alertUrl:validateUrl(process.env.INDEPENDENT_ALERT_WEBHOOK)};
  if(config.targets.some(t=>new URL(t.url).host===new URL(config.alertUrl).host)) throw new Error('INDEPENDENT_ALERT_ENDPOINT_REQUIRED');
  const file=resolve(process.env.MONITOR_STATE_FILE||'./state/monitor.json');
  await mkdir(dirname(file),{recursive:true});
  let state={};
  try {state=JSON.parse(await readFile(file,'utf8'));}
  catch(error) {if(error.code!=='ENOENT') throw new Error('STATE_UNREADABLE_REQUIRES_OPERATOR');}
  const persist=async(value)=>{await writeFile(file+'.tmp',JSON.stringify(value),{mode:0o600});await rename(file+'.tmp',file);};
  // Serial cycles, bounded requests, no setInterval overlapping executions.
  while(true) {await tick(config,state,{probe,sendAlert,persist});await sleep(60000);}
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main().catch(()=>{console.error('MONITOR_STOPPED: check configuration/state; credentials are not logged.');process.exitCode=1;});
