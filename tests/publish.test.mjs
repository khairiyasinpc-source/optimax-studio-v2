import assert from 'node:assert/strict'
import {database} from './d1-adapter.mjs'
import {publish} from '../server/worker.js'
import {initialContent} from '../src/siteDefaults.js'
const db=database(),env={DB:db,GITHUB_TOKEN:'test-only'},user={username:'designer1'}
await db.prepare('INSERT INTO drafts(id,revision,content,updated_by,updated_at) VALUES(1,1,?,?,?)').bind(JSON.stringify(initialContent),'designer1','now').run()
const originalFetch=globalThis.fetch,calls=[];let changed=false
try{globalThis.fetch=async(url,options)=>{calls.push([url,options]);let data;if(url.includes('git/ref/'))data={object:{sha:changed&&calls.filter(c=>c[0].includes('git/ref/')).length>1?'external':'head'}};else if(url.includes('git/commits/head'))data={tree:{sha:'tree'}};else if(url.includes('git/trees/tree?'))data={tree:[]};else if(url.endsWith('git/trees'))data={sha:'newtree'};else if(url.endsWith('git/commits'))data={sha:'newcommit'};else if(url.includes('git/refs/')){assert.equal(JSON.parse(options.body).force,false);data={object:{sha:'newcommit'}}}else throw Error(url);return Response.json(data)}
const result=await publish(env,user,1);assert.equal(result.commit,'newcommit');assert.equal(calls.filter(c=>c[0].endsWith('git/trees')).length,1);const entries=JSON.parse(calls.find(c=>c[0].endsWith('git/trees'))[1].body).tree;assert.equal(entries.length,1);assert.equal(entries[0].path,'public/site-content.json')
const count=calls.length;await publish(env,user,1);assert.equal(calls.length,count,'Already published revision must be idempotent')
await assert.rejects(()=>publish(env,user,0),e=>e.status===409)
await db.prepare('UPDATE publishing SET expires=?').bind(Date.now()+10000).run();await assert.rejects(()=>publish(env,user,1),e=>e.status===409);await db.prepare('UPDATE publishing SET expires=0,revision=NULL').run()
calls.length=0;changed=true;await assert.rejects(()=>publish(env,user,1),e=>e.status===409);assert.equal(calls.some(c=>c[0].includes('git/refs/')),false,'No ref update when repository changes');assert.equal(db.sqlite.prepare('SELECT expires FROM publishing').get().expires,0)
console.log('PASS: atomic tree/commit publish, no force push, idempotency, stale draft rejection, publish lock, repository change detection, lock cleanup')
}finally{globalThis.fetch=originalFetch}
