// Move content and its presentation together. Numeric paths are reindexed by stable block ID.
import {readPath,setPath} from './siteDefaults.js'
const prefix=id=>`builderBlocks.${id}.blocks.`
function remap(data,before,after){
  const mapping=new Map()
  for(const [id,blocks] of Object.entries(before))blocks.forEach((b,i)=>{
    let dest
    for(const [sid,list] of Object.entries(after)){const j=list.findIndex(x=>x.id===b.id);if(j>=0){dest=prefix(sid)+j+'.value';break}}
    mapping.set(prefix(id)+i+'.value',dest)
  })
  const rename=path=>{for(const [a,b] of mapping)if(path===a||path.startsWith(a+'.'))return b?b+path.slice(a.length):null;return path}
  for(const name of ['elementStyles','mediaSettings'])data[name]=Object.fromEntries(Object.entries(data[name]||{}).flatMap(([k,v])=>{const n=rename(k);return n?[[n,v]]:[]}))
  for(const size of ['tablet','mobile'])data.responsiveStyles[size]=Object.fromEntries(Object.entries(data.responsiveStyles[size]||{}).flatMap(([k,v])=>{const n=rename(k);return n?[[n,v]]:[]}))
  const old=structuredClone(data.gradients.elements)
  for(const id of Object.keys(before))if(data.gradients.elements.builderBlocks?.[id])delete data.gradients.elements.builderBlocks[id]
  for(const [a,b] of mapping)if(b){const g=readPath(old,a);if(g)data=setPath(data,'gradients.elements.'+b,g)}
  return data
}
export function moveBlock(input,fromId,from,toId,to,after=false){
  const source=input.builderBlocks[fromId],target=input.builderBlocks[toId]
  if(!source||!target||source.locked||target.locked||!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=source.blocks.length||to<0||to>target.blocks.length||fromId!==toId&&target.blocks.length>=40)return null
  const data=structuredClone(input),ids=[...new Set([fromId,toId])],before=Object.fromEntries(ids.map(id=>[id,input.builderBlocks[id].blocks]))
  let index=Math.min(target.blocks.length,to+(after?1:0));if(fromId===toId&&index>from)index--;if(fromId===toId&&index===from)return null
  const [item]=data.builderBlocks[fromId].blocks.splice(from,1);data.builderBlocks[toId].blocks.splice(index,0,item)
  return {data:remap(data,before,Object.fromEntries(ids.map(id=>[id,data.builderBlocks[id].blocks]))),path:prefix(toId)+index+'.value',kind:item.kind==='video'?'image':item.kind}
}
export function duplicateBlock(input,id,index){
  if(input.builderBlocks[id]?.locked||input.builderBlocks[id]?.blocks.length>=40)return input
  let data=structuredClone(input),before={[id]:input.builderBlocks[id].blocks},copy=structuredClone(data.builderBlocks[id].blocks[index]);copy.id='b'+crypto.randomUUID().replaceAll('-','');data.builderBlocks[id].blocks.splice(index+1,0,copy)
  data=remap(data,before,{[id]:data.builderBlocks[id].blocks})
  const a=prefix(id)+index+'.value',b=prefix(id)+(index+1)+'.value'
  for(const name of ['elementStyles','mediaSettings'])if(data[name][a])data[name][b]=structuredClone(data[name][a])
  for(const size of ['tablet','mobile'])if(data.responsiveStyles[size][a])data.responsiveStyles[size][b]=structuredClone(data.responsiveStyles[size][a])
  const g=readPath(data,'gradients.elements.'+a);if(g)data=setPath(data,'gradients.elements.'+b,g)
  return data
}
export function deleteBlock(input,id,index){
  if(input.builderBlocks[id]?.locked)return input
  const data=structuredClone(input);data.builderBlocks[id].blocks.splice(index,1)
  return remap(data,{[id]:input.builderBlocks[id].blocks},{[id]:data.builderBlocks[id].blocks})
}
export function copySection(input,id,newId){
  const data=structuredClone(input);data.builderBlocks[newId]={...structuredClone(data.builderBlocks[id]),id:newId,label:data.builderBlocks[id].label+' Copy'}
  data.builderBlocks[newId].blocks.forEach(b=>b.id='b'+crypto.randomUUID().replaceAll('-',''))
  if(data.sectionStyles[id])data.sectionStyles[newId]=structuredClone(data.sectionStyles[id])
  if(data.gradients.sections[id])data.gradients.sections[newId]=structuredClone(data.gradients.sections[id])
  if(data.gradients.elements.builderBlocks?.[id])data.gradients.elements.builderBlocks[newId]=structuredClone(data.gradients.elements.builderBlocks[id])
  for(const name of ['elementStyles','mediaSettings'])for(const [path,value] of Object.entries(data[name]))if(path.startsWith(`builderBlocks.${id}.`))data[name][path.replace(`builderBlocks.${id}.`,`builderBlocks.${newId}.`)]=structuredClone(value)
  for(const size of ['tablet','mobile'])for(const [path,value] of Object.entries(data.responsiveStyles[size]))if(path===id||path.startsWith(`builderBlocks.${id}.`))data.responsiveStyles[size][path===id?newId:path.replace(`builderBlocks.${id}.`,`builderBlocks.${newId}.`)]=structuredClone(value)
  return data
}

export function insertBlock(input,id,kind,index){
  if(!input.builderBlocks[id]||input.builderBlocks[id].locked||input.builderBlocks[id].blocks.length>=40)return input
  const data=structuredClone(input),item={id:'b'+crypto.randomUUID().replaceAll('-',''),kind,label:{text:'Text',image:'Image',video:'Video',button:'Button',icon:'Icon',spacer:'Spacer'}[kind],value:{text:'Double-click to edit this text',image:'',video:'',button:{label:'Learn More',href:'#enquiry'},icon:'Eye',spacer:''}[kind],style:{}}
  data.builderBlocks[id].blocks.splice(index,0,item)
  return remap(data,{[id]:input.builderBlocks[id].blocks},{[id]:data.builderBlocks[id].blocks})
}
