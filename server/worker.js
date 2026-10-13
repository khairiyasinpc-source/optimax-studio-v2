import {authenticate,credentials,passwordHash,constantEqual,digest,hex,sessionCookie} from './auth.js'
import {deepMerge,initialContent} from '../src/siteDefaults.js'
const CHUNK=512*1024,MAX_MEDIA=20*1024*1024,MAX_STORAGE=200*1024*1024
export class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
const fail=(status,message)=>{throw new HttpError(status,message)}
const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}})
async function body(request,limit=3*1024*1024){if(Number(request.headers.get('Content-Length'))>limit)fail(413,'Request is too large');const bytes=await request.arrayBuffer();if(bytes.byteLength>limit)fail(413,'Request is too large');try{return JSON.parse(new TextDecoder().decode(bytes))}catch{fail(400,'Invalid JSON')}}
function cleanContent(value){if(!value?.hero||!value?.buttons||!Array.isArray(value.pages)||typeof value.builderBlocks!=='object')fail(400,'Invalid website content');const data=deepMerge(initialContent,value);data.previewAssets={};return data}
export async function mediaBytes(env,path){const media=await env.DB.prepare('SELECT * FROM media WHERE path=? AND complete=1').bind(path).first();if(!media)fail(422,`Upload is missing or incomplete: ${path}`);const parts=[];for(let i=0;i<Math.ceil(media.size/CHUNK);i++){const chunk=await env.DB.prepare('SELECT bytes FROM chunks WHERE path=? AND idx=?').bind(path,i).first();if(!chunk)fail(422,'Media chunk is missing');parts.push(new Uint8Array(chunk.bytes))}return {blob:new Blob(parts,{type:media.mime}),media}}
async function github(env,path,method='GET',value){if(!env.GITHUB_TOKEN)fail(503,'Publishing credential is not configured');const response=await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY||'khairiyasinpc-source/optimax-studio-v2'}/${path}`,{method,headers:{Authorization:`Bearer ${env.GITHUB_TOKEN}`,'User-Agent':'OPTIMAX-Studio','Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:value?JSON.stringify(value):undefined});if(!response.ok)fail(response.status===422?409:502,'GitHub rejected the request. Your shared draft is safe.');return response.json()}
function base64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)}
export async function publish(env,user,revision){
  const lease=crypto.randomUUID();const lock=await env.DB.prepare('UPDATE publishing SET lease=?,expires=? WHERE id=1 AND expires<?').bind(lease,Date.now()+600000,Date.now()).run();if(!lock.meta.changes)fail(409,'Another publish is running. Try again after it finishes.')
  try{const draft=await env.DB.prepare('SELECT * FROM drafts WHERE id=1').first();if(!draft||draft.revision!==revision)fail(409,'The shared draft changed. Reload before publishing.')
    const last=await env.DB.prepare('SELECT commit_sha,revision FROM publishing WHERE id=1').first();if(last.revision===revision&&last.commit_sha)return {commit:last.commit_sha,revision}
    const data=cleanContent(JSON.parse(draft.content)),branch=env.GITHUB_BRANCH||'main',head=await github(env,`git/ref/heads/${branch}`),commit=await github(env,`git/commits/${head.object.sha}`),tree=[]
    // Each media path is immutable. Existing shared objects need no duplicate Git blob.
    const oldTree=await github(env,`git/trees/${commit.tree.sha}?recursive=1`),existing=new Set(oldTree.tree.filter(e=>e.type==='blob').map(e=>e.path))
    for(const asset of data.mediaAssets){if(existing.has('public/'+asset.path))continue;const {blob}=await mediaBytes(env,asset.path);const uploaded=await github(env,'git/blobs','POST',{content:base64(new Uint8Array(await blob.arrayBuffer())),encoding:'base64'});tree.push({path:'public/'+asset.path,mode:'100644',type:'blob',sha:uploaded.sha})}
    tree.push({path:'public/site-content.json',mode:'100644',type:'blob',content:JSON.stringify(data,null,2)+'\n'})
    const nextTree=await github(env,'git/trees','POST',{base_tree:commit.tree.sha,tree}),next=await github(env,'git/commits','POST',{message:`Publish OPTIMAX shared draft r${revision} by ${user.username}`,tree:nextTree.sha,parents:[head.object.sha]})
    const fresh=await github(env,`git/ref/heads/${branch}`);if(fresh.object.sha!==head.object.sha)fail(409,'Repository changed during publishing. Retry to preserve the newer changes.')
    await github(env,`git/refs/heads/${branch}`,'PATCH',{sha:next.sha,force:false})
    await env.DB.prepare('UPDATE publishing SET commit_sha=?,revision=?,username=? WHERE id=1 AND lease=?').bind(next.sha,revision,user.username,lease).run()
    return {commit:next.sha,revision,url:env.PUBLIC_URL||'https://khairiyasinpc-source.github.io/optimax-studio-v2/'}
  }finally{await env.DB.prepare('UPDATE publishing SET lease=NULL,expires=0 WHERE id=1 AND lease=?').bind(lease).run()}
}
async function api(request,env){const url=new URL(request.url),path=url.pathname,method=request.method
  if(!['GET','HEAD'].includes(method)&&request.headers.get('Origin')!==url.origin)fail(403,'Request origin is not allowed')
  if(path==='/api/login'&&method==='POST'){
    const input=await body(request,2048),users=credentials(env);if(typeof input.username!=='string'||typeof input.password!=='string'||input.password.length>256)fail(401,'Incorrect username or password')
    const bucket=await digest(`${request.headers.get('CF-Connecting-IP')||'unknown'}:${Math.floor(Date.now()/900000)}`)
    const attempt=await env.DB.prepare('INSERT INTO attempts(bucket,count,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,Date.now()+900000).first();if(attempt.count>6)fail(429,'Too many login attempts. Try again in 15 minutes.')
    const user=users.find(v=>v.username===input.username)||users[0],hash=await passwordHash(input.password,user.salt);if(user.username!==input.username||!constantEqual(hash,user.hash))fail(401,'Incorrect username or password')
    const token=hex(crypto.getRandomValues(new Uint8Array(32)));await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM attempts WHERE expires<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions(token_hash,username,expires) VALUES(?,?,?)').bind(await digest(token),user.username,Date.now()+28800000)])
    return json({username:user.username},200,{'Set-Cookie':sessionCookie(token)})
  }
  const user=await authenticate(request,env);if(!user)fail(401,'Sign in to OPTIMAX Studio')
  if(path==='/api/session'&&method==='GET')return json(user)
  if(path==='/api/logout'&&method==='POST'){const token=request.headers.get('Cookie')?.match(/__Host-optimax=([a-f0-9]{64})/)?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)})}
  if(path==='/api/draft'&&method==='GET'){const draft=await env.DB.prepare('SELECT * FROM drafts WHERE id=1').first();return json(draft?{revision:draft.revision,data:JSON.parse(draft.content),updatedBy:draft.updated_by,updatedAt:draft.updated_at}:{revision:0,data:null})}
  if(path==='/api/draft'&&method==='PUT'){
    const input=await body(request),data=cleanContent(input.data);if(!Number.isInteger(input.revision)||input.revision<0)fail(400,'Invalid draft revision')
    // Never save device-only paths into a shared draft.
    for(const asset of data.mediaAssets){const row=await env.DB.prepare('SELECT complete FROM media WHERE path=?').bind(asset.path).first();if(!row?.complete)fail(422,`Upload ${asset.name} before saving this draft`)}
    const now=new Date().toISOString(),content=JSON.stringify(data);if(new TextEncoder().encode(content).length>1800000)fail(413,'Draft exceeds 1.8 MB. Move large inline images into the media library.')
    const result=input.revision===0?await env.DB.prepare('INSERT OR IGNORE INTO drafts(id,revision,content,updated_by,updated_at) VALUES(1,1,?,?,?)').bind(content,user.username,now).run():await env.DB.prepare('UPDATE drafts SET revision=revision+1,content=?,updated_by=?,updated_at=? WHERE id=1 AND revision=?').bind(content,user.username,now,input.revision).run()
    if(!result.meta.changes)fail(409,'Another designer saved a newer draft. Export your local backup and reload the shared draft before continuing.')
    return json({revision:input.revision+1,updatedBy:user.username,updatedAt:now})
  }
  if(path==='/api/media/init'&&method==='POST'){
    const {path:mediaPath,size,mime,sha}=await body(request,2048)
    if(!/^media\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|gif|mp4|webm)$/.test(mediaPath)||!Number.isInteger(size)||size<1||size>MAX_MEDIA||!['image/webp','image/png','image/jpeg','image/gif','video/mp4','video/webm'].includes(mime)||!/^[a-f0-9]{64}$/.test(sha))fail(400,'Invalid media metadata')
    const old=await env.DB.prepare('SELECT * FROM media WHERE path=?').bind(mediaPath).first();if(old){if(old.sha!==sha||old.size!==size)fail(409,'Media path already has different content');return json({complete:!!old.complete})}
    const inserted=await env.DB.prepare('INSERT INTO media(path,size,mime,sha) SELECT ?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM media)+?<=? AND (SELECT COUNT(*) FROM media)<100').bind(mediaPath,size,mime,sha,size,MAX_STORAGE).run();if(!inserted.meta.changes)fail(413,'Free storage safety limit reached. Contact IT to archive unused media; no paid upgrade was enabled.')
    return json({complete:false})
  }
  const chunkMatch=path.match(/^\/api\/media\/chunk\/(media\/[\w.-]+)\/(\d+)$/)
  if(chunkMatch&&method==='PUT'){
    const row=await env.DB.prepare('SELECT * FROM media WHERE path=?').bind(chunkMatch[1]).first(),idx=Number(chunkMatch[2]);if(!row||row.complete)fail(409,'Upload is not open');if(idx>=Math.ceil(row.size/CHUNK))fail(400,'Invalid chunk index');const bytes=await request.arrayBuffer(),expected=Math.min(CHUNK,row.size-idx*CHUNK);if(bytes.byteLength!==expected)fail(400,'Incorrect chunk length');await env.DB.prepare('INSERT INTO chunks(path,idx,bytes) VALUES(?,?,?) ON CONFLICT(path,idx) DO UPDATE SET bytes=excluded.bytes').bind(row.path,idx,bytes).run();return json({ok:true})
  }
  if(path==='/api/media/complete'&&method==='POST'){
    const {path:mediaPath}=await body(request,2048),row=await env.DB.prepare('SELECT * FROM media WHERE path=?').bind(mediaPath).first();if(!row)fail(404,'Upload not found');if(row.complete)return json({ok:true});const parts=[]
    for(let i=0;i<Math.ceil(row.size/CHUNK);i++){const chunk=await env.DB.prepare('SELECT bytes FROM chunks WHERE path=? AND idx=?').bind(row.path,i).first();if(!chunk)fail(422,'Upload is incomplete');parts.push(new Uint8Array(chunk.bytes))}
    const bytes=await new Blob(parts).arrayBuffer();if(bytes.byteLength!==row.size||await digest(bytes)!==row.sha)fail(422,'Upload checksum failed. Retry the upload.')
    await env.DB.prepare('UPDATE media SET complete=1 WHERE path=?').bind(row.path).run();return json({ok:true})
  }
  if(path==='/api/publish'&&method==='POST'){const input=await body(request,2048);return json(await publish(env,user,input.revision))}
  if(path==='/api/publish-status'&&method==='GET'){const last=await env.DB.prepare('SELECT commit_sha,revision FROM publishing WHERE id=1').first();if(!last?.commit_sha)return json({state:'idle'});const runs=await github(env,`actions/runs?head_sha=${last.commit_sha}&per_page=10`);const run=runs.workflow_runs.find(r=>r.path==='.github/workflows/deploy.yml');return json({commit:last.commit_sha,revision:last.revision,state:run?.status||'queued',conclusion:run?.conclusion||null,url:run?.html_url||null})}
  fail(404,'API route not found')
}
export default {async fetch(request,env){try{const url=new URL(request.url);let response
  if(url.pathname.startsWith('/api/'))response=await api(request,env)
  else if(url.pathname.startsWith('/media/')){if(!await authenticate(request,env))fail(401,'Sign in');const {blob}=await mediaBytes(env,url.pathname.slice(1));response=new Response(blob,{headers:{'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}})}
  else response=await env.ASSETS.fetch(request)
  const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");return new Response(response.body,{status:response.status,headers})
}catch(error){return json({error:error instanceof HttpError?error.message:'Service unavailable. Your browser draft is safe.'},error.status||503)}}}
