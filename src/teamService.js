import {loadBlob} from './mediaStore.js'
export const teamMode=import.meta.env.VITE_TEAM_MODE==='true'
export async function api(path,method='GET',value){const response=await fetch('/api/'+path,{method,credentials:'same-origin',headers:value instanceof Blob?{}:{'Content-Type':'application/json'},body:value===undefined?undefined:value instanceof Blob?value:JSON.stringify(value),cache:'no-store'});let result;try{result=await response.json()}catch{throw Error('Team service did not respond. Your local draft is safe.')};if(!response.ok){const e=Error(result.error||'Team service request failed');e.status=response.status;throw e}return result}
const digest=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('')
const uploaded=new Set()
export async function uploadAssets(data,notify){for(const asset of data.mediaAssets||[]){if(uploaded.has(asset.path))continue;const blob=await loadBlob(asset.id);if(!blob){const response=await fetch('/'+asset.path,{credentials:'same-origin'});if(!response.ok)throw Error(`Missing media: ${asset.name}. Re-upload it before saving.`);uploaded.add(asset.path);continue}
  notify?.('Uploading '+asset.name);const sha=await digest(await blob.arrayBuffer()),mime=blob.type||(/\.mp4$/.test(asset.path)?'video/mp4':/\.webm$/.test(asset.path)?'video/webm':/\.gif$/.test(asset.path)?'image/gif':'image/webp');const start=await api('media/init','POST',{path:asset.path,size:blob.size,mime,sha})
  if(!start.complete){for(let i=0;i<Math.ceil(blob.size/(512*1024));i++)await api(`media/chunk/${asset.path}/${i}`,'PUT',blob.slice(i*512*1024,(i+1)*512*1024));await api('media/complete','POST',{path:asset.path})}uploaded.add(asset.path)
}}
export async function saveShared(data,revision,notify){await uploadAssets(data,notify);return api('draft','PUT',{revision,data:{...data,previewAssets:{}}})}
