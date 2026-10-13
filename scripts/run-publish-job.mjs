// Runs in GitHub Actions. Large media transfer/base64 never consumes a free Worker's CPU budget.
import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
const {STUDIO_URL,PUBLISH_JOB,PUBLISH_JOB_TOKEN,EXPECTED_HEAD}=process.env
if(!/^https:\/\//.test(STUDIO_URL||'')||!/[a-f0-9-]{36}/.test(PUBLISH_JOB||'')||!PUBLISH_JOB_TOKEN)throw Error('Publishing job configuration missing')
const endpoint=STUDIO_URL.replace(/\/$/,'')+'/api/publish-job/'+PUBLISH_JOB
const read=async suffix=>{const response=await fetch(endpoint+suffix,{headers:{Authorization:'Bearer '+PUBLISH_JOB_TOKEN}});if(!response.ok)throw Error('Publishing snapshot request failed');return response}
const snapshot=await (await read('')).json()
if(snapshot.head!==EXPECTED_HEAD)throw Error('Publishing snapshot/repository mismatch')
const current=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();if(current!==EXPECTED_HEAD)throw Error('Repository changed before the publishing job started')
await fs.writeFile('public/site-content.json',JSON.stringify(snapshot.data,null,2)+'\n')
await fs.mkdir('public/media',{recursive:true})
for(const asset of snapshot.data.mediaAssets||[]){if(!/^media\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|gif|mp4|webm)$/.test(asset.path))throw Error('Invalid media path');const response=await read('/'+asset.path);await fs.writeFile('public/'+asset.path,new Uint8Array(await response.arrayBuffer()))}
