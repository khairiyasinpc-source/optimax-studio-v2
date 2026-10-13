// Video and animated GIF bytes stay in IndexedDB until exported; never put large blobs in localStorage JSON.
const DB='optimax-v2-media-store';const STORE='blobs'
const openDB=()=>new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})
export async function saveBlob(id,blob){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
export async function loadBlob(id){const db=await openDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}finally{db.close()}}
export async function deleteBlob(id){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
export const kindFor=name=>/\.(mp4|webm)$/i.test(name)?'video':/\.gif$/i.test(name)?'gif':/\.svg$/i.test(name)?'icon':'image'
export const supportedFile=f=>/\.(mp4|webm|gif|svg|png|jpe?g|webp)$/i.test(f.name)
export const assetPath=(id,name)=>`media/${id}.${(name.match(/\.([a-z\d]+)$/i)||[])[1]?.toLowerCase().replace('jpeg','jpg')||'dat'}`
export const resolveAsset=(raw,urls={},base='/')=>{
  const src=String(raw||'');return src.startsWith('media/')?urls[src]||base+src:src
}
// Small zero-dependency ZIP writer, using ZIP stored entries for videos and already compressed images.
const u16=(a,p,n)=>{a[p]=n&255;a[p+1]=(n>>>8)&255};const u32=(a,p,n)=>{a[p]=n&255;a[p+1]=(n>>>8)&255;a[p+2]=(n>>>16)&255;a[p+3]=(n>>>24)&255}
const encoder=new TextEncoder();const TABLE=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0})
const crc32=b=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=TABLE[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
export async function makeZip(entries){
  const parts=[],central=[];let offset=0
  for(const {name,data} of entries){const path=encoder.encode(name),bytes=data instanceof Uint8Array?data:new Uint8Array(await data.arrayBuffer()),crc=crc32(bytes);const local=new Uint8Array(30+path.length);u32(local,0,0x04034b50);u16(local,4,20);u16(local,8,0);u32(local,14,crc);u32(local,18,bytes.length);u32(local,22,bytes.length);u16(local,26,path.length);local.set(path,30);parts.push(local,bytes)
    const c=new Uint8Array(46+path.length);u32(c,0,0x02014b50);u16(c,4,20);u16(c,6,20);u32(c,16,crc);u32(c,20,bytes.length);u32(c,24,bytes.length);u16(c,28,path.length);u32(c,42,offset);c.set(path,46);central.push(c);offset+=local.length+bytes.length
  }
  const end=new Uint8Array(22);u32(end,0,0x06054b50);u16(end,8,central.length);u16(end,10,central.length);u32(end,12,central.reduce((n,b)=>n+b.length,0));u32(end,16,offset)
  return new Blob([...parts,...central,end],{type:'application/zip'})
}
export const downloadBlob=(blob,name)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
