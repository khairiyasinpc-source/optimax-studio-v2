import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import {database} from './d1-adapter.mjs'
import worker from '../server/worker.js'
import {passwordHash} from '../server/auth.js'
export async function startTeamHost(port=0){
  const creds=await Promise.all([1,2,3].map(async n=>({username:'designer'+n,salt:'b'.repeat(32)+n,hash:await passwordHash('local-test-password-'+n,'b'.repeat(32)+n)}))),root=path.resolve('dist-team')
  const env={DB:database(),DESIGNER_CREDENTIALS_JSON:JSON.stringify(creds),GITHUB_TOKEN:'test-only-not-a-real-token',ASSETS:{async fetch(req){let file=path.join(root,new URL(req.url).pathname);if(!file.startsWith(root+'/'))return new Response('',{status:404});if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';return new Response(fs.readFileSync(file),{headers:{'Content-Type':type}})}}}
  const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const buffer=Buffer.concat(chunks),request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:{...req.headers,'CF-Connecting-IP':req.headers['x-test-client']||'127.0.0.1'},body:['GET','HEAD'].includes(req.method)?undefined:buffer});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500);res.end(e.message)}})
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return {server,env,url:`http://localhost:${server.address().port}/`,close:()=>new Promise(resolve=>server.close(resolve))}
}
if(process.argv[1]===new URL(import.meta.url).pathname){const host=await startTeamHost(5180);console.log('Local test team studio: '+host.url+'?edit=1');}
