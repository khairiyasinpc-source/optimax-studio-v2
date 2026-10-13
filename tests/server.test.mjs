import assert from 'node:assert/strict'
import worker from '../server/worker.js'
import {database} from './d1-adapter.mjs'
import {passwordHash,digest,credentials} from '../server/auth.js'
import {initialContent} from '../src/siteDefaults.js'
const users=await Promise.all([1,2,3].map(async n=>({username:'designer'+n,salt:'a'.repeat(32)+n,hash:await passwordHash('test-only-strong-password-'+n,'a'.repeat(32)+n)})))
const env={DB:database(),DESIGNER_CREDENTIALS_JSON:JSON.stringify(users),ASSETS:{fetch:async()=>new Response('asset')}}
const origin='https://studio.test';let cookie=''
async function call(path,method='GET',value,extra={}){return worker.fetch(new Request(origin+path,{method,headers:{Origin:origin,Cookie:cookie,...(value instanceof Blob?{}:{'Content-Type':'application/json'}),...extra},body:value===undefined?undefined:value instanceof Blob?value:JSON.stringify(value)}),env)}
assert.throws(()=>credentials({DESIGNER_CREDENTIALS_JSON:'[]'}))
assert.equal((await call('/api/draft')).status,401)
assert.equal((await call('/api/login','POST',{username:'designer1',password:'wrong'})).status,401)
assert.equal((await call('/api/login','POST',{username:'designer1',password:'test-only-strong-password-1'},{Origin:'https://evil.test'})).status,403)
for(const n of [1,2,3]){const response=await call('/api/login','POST',{username:'designer'+n,password:'test-only-strong-password-'+n},{'CF-Connecting-IP':'10.0.0.'+n});assert.equal(response.status,200);assert.match(response.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict/);cookie=response.headers.get('Set-Cookie').split(';')[0];assert.equal((await (await call('/api/session')).json()).username,'designer'+n)}
assert.equal((await call('/api/draft','PUT',{revision:0,data:initialContent})).status,200)
const changed=structuredClone(initialContent);changed.hero.title='Shared designer change'
assert.equal((await call('/api/draft','PUT',{revision:1,data:changed})).status,200)
assert.equal((await call('/api/draft','PUT',{revision:1,data:initialContent})).status,409)
assert.equal((await (await call('/api/draft')).json()).data.hero.title,changed.hero.title)
assert.equal((await call('/api/draft','PUT',{revision:2,data:changed},{Origin:'https://evil.test'})).status,403)
const file=new Blob(['test media bytes'],{type:'image/webp'}),path='media/test.webp',sha=await digest(await file.arrayBuffer())
assert.equal((await call('/api/media/init','POST',{path,size:file.size,mime:file.type,sha})).status,200)
assert.equal((await call('/api/media/complete','POST',{path})).status,422)
assert.equal((await call('/api/media/chunk/'+path+'/0','PUT',file)).status,200)
assert.equal((await call('/api/media/complete','POST',{path})).status,200)
assert.equal(await (await call('/'+path)).text(),'test media bytes')
assert.equal((await call('/api/media/chunk/'+path+'/0','PUT',file)).status,409)
assert.equal((await call('/api/media/init','POST',{path,size:file.size,mime:file.type,sha:'0'.repeat(64)})).status,409)
const missing=structuredClone(changed);missing.mediaAssets=[{id:'missing',path:'media/missing.mp4',kind:'video'}];assert.equal((await call('/api/draft','PUT',{revision:2,data:missing})).status,422)
assert.equal((await call('/api/publish','POST',{revision:2})).status,503)
assert.equal(env.DB.sqlite.prepare('SELECT expires FROM publishing').get().expires,0)
assert.equal((await call('/api/logout','POST',{})).status,200)
assert.equal((await call('/api/session')).status,401)
assert.equal((await call('/'+path)).status,401)
for(let i=0;i<6;i++)assert.equal((await call('/api/login','POST',{username:'designer1',password:'wrong'},{'CF-Connecting-IP':'10.2.0.1'})).status,401)
assert.equal((await call('/api/login','POST',{username:'designer1',password:'wrong'},{'CF-Connecting-IP':'10.2.0.1'})).status,429)
console.log('PASS: three designer logins, authentication, secure cookies, CSRF, shared revision conflicts, media lifecycle, missing-media guard, logout, rate limit, publish cleanup')
