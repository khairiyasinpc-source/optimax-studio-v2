import assert from 'node:assert/strict'
import {database} from './d1-adapter.mjs'
import worker,{publish} from '../server/worker.js'
import {initialContent} from '../src/siteDefaults.js'
const db=database(),env={DB:db,GITHUB_TOKEN:'test-only',PUBLISH_JOB_TOKEN:'private-test-job',STUDIO_URL:'https://studio.test'},user={username:'designer1'}
await db.prepare('INSERT INTO drafts(id,revision,content,updated_by,updated_at) VALUES(1,1,?,?,?)').bind(JSON.stringify(initialContent),'designer1','now').run()
const originalFetch=globalThis.fetch,calls=[]
try{globalThis.fetch=async(url,options)=>{calls.push([url,options]);return String(url).includes('/dispatches')?new Response(null,{status:204}):Response.json({object:{sha:'a'.repeat(40)}})}
const result=await publish(env,user,1);assert.match(result.job,/^[a-f0-9-]{36}$/);assert.equal(calls.length,2,'Free Worker only reads head and dispatches a job; no large Git blob encoding');const dispatched=JSON.parse(calls[1][1].body);assert.equal(dispatched.inputs.job,result.job);assert.equal(dispatched.inputs.head_sha,'a'.repeat(40))
await assert.rejects(()=>publish(env,user,1),e=>e.status===409,'Concurrent publishing is locked')
const endpoint='https://studio.test/api/publish-job/'+result.job
const request=async(path='',method='GET',value,token=env.PUBLISH_JOB_TOKEN)=>worker.fetch(new Request(endpoint+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:value?JSON.stringify(value):undefined}),env)
assert.equal((await request('','GET',null,'wrong')).status,401)
const snapshot=await (await request()).json();assert.equal(snapshot.revision,1);assert.equal(snapshot.data.hero.title,initialContent.hero.title)
await db.prepare('UPDATE drafts SET revision=2').run();assert.equal((await (await request()).json()).revision,1,'Job snapshot is immutable while designers keep editing')
assert.equal((await request('/complete','POST',{conclusion:'success',commit:'b'.repeat(40)})).status,200);assert.equal(db.sqlite.prepare('SELECT expires FROM publishing').get().expires,0)
const count=calls.length;await publish(env,user,2).catch(()=>{});await db.prepare('UPDATE publishing SET expires=0').run();await db.prepare('UPDATE drafts SET revision=1').run();assert.equal((await publish(env,user,1)).commit,'b'.repeat(40));assert.equal(calls.length,count+2)
await assert.rejects(()=>publish(env,user,0),e=>e.status===409)
console.log('PASS: free-plan-safe job dispatch, atomic immutable snapshot, concurrent publish lock, authenticated job export/callback, idempotency, stale revision rejection')
}finally{globalThis.fetch=originalFetch}
