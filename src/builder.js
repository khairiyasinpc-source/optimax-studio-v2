// OPTIMAX V2: incremental builder model. Legacy homepage fields remain untouched.
export const sectionTemplates=[
  {type:'blank',label:'Blank section'}, {type:'hero',label:'Hero / Banner'},
  {type:'split',label:'Image + Text'}, {type:'cards',label:'Cards & Grid'},
  {type:'cta',label:'Call to Action'}, {type:'gallery',label:'Image Gallery'},
  {type:'faq',label:'FAQ'}
]
export const defaultPages=[{id:'home',slug:'',title:'Homepage',sections:[]}]
export const defaultNavigation=[{label:'Treatments',href:'#treatments'},{label:'Our Doctors',href:'#about'},{label:'Patient Care',href:'#solutions'},{label:'About Us',href:'#about'},{label:'Locations',href:'#enquiry'}]
export const validSlug=s=>String(s||'').toLowerCase().trim().normalize('NFKD').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,64)
export const pageURL=slug=>slug?`/${slug}/`:'/'
export const siteHref=(href,base)=>{
  const value=String(href||'')
  if(!value || value[0]==='#' || /^(https?:|mailto:|tel:)/i.test(value))return value||'#'
  const path=value.replace(/^\/+|\/+$/g,'')
  return base+(path?path+'/':'')
}
export const pathSlug=(pathname,base)=>{
  const basePath=new URL(base,location.origin).pathname
  const part=pathname.startsWith(basePath)?pathname.slice(basePath.length):''
  return validSlug(part.split('/')[0])
}
export const newSection=(type='blank',id=`section${crypto.randomUUID().replaceAll('-','')}`)=>{
  const block=(kind,label,value)=>({id:`b${Math.random().toString(36).slice(2,9)}`,kind,label,value})
  const heading=()=>block('text','Heading','Your heading goes here')
  const body=()=>block('text','Description','Add your content here. Click any element to edit.')
  const button=()=>block('button','Button',{label:'Learn More',href:'#enquiry'})
  const image=()=>block('image','Image','')
  const icon=()=>block('icon','Icon','Eye')
  const blocks={blank:[],hero:[heading(),body(),button()],split:[image(),heading(),body(),button()],cards:[heading(),body(),image(),block('text','Card 1 title','Personalised eye care'),block('text','Card 1 description','Discover more about our services'),image(),block('text','Card 2 title','Experienced specialists'),block('text','Card 2 description','Care you can trust'),image(),block('text','Card 3 title','Advanced technology'),block('text','Card 3 description','Modern treatment options')],cta:[heading(),body(),button()],gallery:[heading(),image(),image(),image()],faq:[heading(),body(),body()]}[type]||[]
  return {id,type,label:sectionTemplates.find(t=>t.type===type)?.label||'Section',visible:true,locked:false,blocks}
}
export const newBlock=(kind='text')=>({id:`b${Math.random().toString(36).slice(2,9)}`,kind,label:{text:'Text',image:'Image',video:'Video',icon:'Icon',button:'Button',spacer:'Spacer'}[kind]||'Element',value:{text:'Double-click to edit this text',image:'',video:'',icon:'Eye',button:{label:'Learn More',href:'#enquiry'},spacer:''}[kind],style:{}})
// Per-element presentation survives JSON exports and GitHub Pages reloads.
// Only known CSS-safe properties are accepted; no arbitrary code or HTML is stored.
const BLOCK_STYLE_KEYS=['width','height','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','background','color','borderColor','borderWidth','radius','shadow','opacity','textAlign','fontSize','fontWeight','alignSelf','gridColumn','objectFit']
export function cleanBlockStyle(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return {}
  const out={}
  for(const key of BLOCK_STYLE_KEYS){const v=input[key];if(v===undefined||v===null||v==='')continue
    if(['background','color','borderColor'].includes(key)){if(typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v))out[key]=v;continue}
    if(['textAlign','alignSelf','objectFit'].includes(key)){if(typeof v==='string'&&['left','center','right','start','end','stretch','cover','contain'].includes(v))out[key]=v;continue}
    if(key==='shadow'){if(typeof v==='boolean')out[key]=v;continue}
    if(typeof v==='number'&&Number.isFinite(v))out[key]=Math.max(key==='opacity'?0:-200,Math.min(key==='opacity'?100:2000,v))
  }
  return out
}

export function cleanPages(pages){
  if(!Array.isArray(pages))return structuredClone(defaultPages)
  const ids=new Set(['home']),slugs=new Set([''])
  const cleaned=pages.slice(0,40).filter(v=>v&&typeof v==='object').map(p=>({id:String(p.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90),title:String(p.title||'Untitled').slice(0,100),slug:validSlug(p.slug),sections:Array.isArray(p.sections)?p.sections.filter(s=>typeof s==='string'&&/^section[a-zA-Z0-9_-]+$/.test(s)).slice(0,80):[]})).filter(p=>{
    if(p.id==='home')return true
    if(!p.id||!p.slug||ids.has(p.id)||slugs.has(p.slug))return false
    ids.add(p.id);slugs.add(p.slug);return true
  })
  const home=cleaned.find(p=>p.id==='home')||structuredClone(defaultPages[0])
  return [{...home,title:'Homepage',slug:''},...cleaned.filter(p=>p.id!=='home')]
}
export function cleanBuilders(blocks){
  const result={};if(!blocks||typeof blocks!=='object'||Array.isArray(blocks))return result
  for(const [id,b] of Object.entries(blocks).slice(0,180)){
    if(!/^section[a-zA-Z0-9_-]+$/.test(id)||!b||typeof b!=='object')continue
    const type=sectionTemplates.some(t=>t.type===b.type)?b.type:'blank'
    result[id]={id,type,label:String(b.label||'Section').slice(0,100),visible:b.visible!==false,locked:b.locked===true,
      blocks:Array.isArray(b.blocks)?b.blocks.slice(0,40).filter(x=>x&&['text','image','video','icon','button','spacer'].includes(x.kind)).map(x=>({id:String(x.id||'b').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50),kind:x.kind,label:String(x.label||x.kind).slice(0,80),value:x.kind==='button'?{label:String(x.value?.label||'Learn More').slice(0,160),href:String(x.value?.href||'#').slice(0,250),...Object.fromEntries(['width','height','radius','fontSize'].filter(k=>typeof x.value?.[k]==='number'&&Number.isFinite(x.value[k])).map(k=>[k,Math.max(0,Math.min(2000,x.value[k]))])),...Object.fromEntries(['bg','color'].filter(k=>/^#[a-f0-9]{6}$/i.test(x.value?.[k]||'')).map(k=>[k,x.value[k]]))}:String(x.value||'').slice(0,300000),style:cleanBlockStyle(x.style)})):[]}
  }
  return result
}
export function cleanGradients(map){
  const overlay=(g)=>({enabled:g.enabled===true,type:g.type==='radial'?'radial':'linear',angle:Number(g.angle??90),radialX:Number(g.radialX??50),radialY:Number(g.radialY??50),stops:(Array.isArray(g.stops)?g.stops:[]).slice(0,8).map(v=>({color:/^#[a-f\d]{6}$/i.test(v.color)?v.color:'#ffffff',opacity:Number(v.opacity??0),position:Number(v.position??0)}))})
  const visit=(obj,depth=0)=>{if(!obj||typeof obj!=='object'||Array.isArray(obj)||depth>9)return {};const result={};for(const [key,value] of Object.entries(obj).slice(0,250)){if(!/^[a-zA-Z0-9_-]+$/.test(key)||['__proto__','constructor','prototype'].includes(key))continue;result[key]=value&&typeof value==='object'&&Array.isArray(value.stops)?overlay(value):visit(value,depth+1)}return result}
  return {sections:visit(map?.sections),elements:visit(map?.elements)}
}

export const gradientPreset=()=>({enabled:false,type:'linear',angle:90,radialX:50,radialY:50,stops:[{color:'#ffffff',opacity:85,position:0},{color:'#ffffff',opacity:0,position:100}]})
