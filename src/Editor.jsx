import {api,saveShared} from './teamService.js'
import React, {useEffect,useMemo,useRef,useState} from 'react'
import {ArrowDown,ArrowUp,Check,ChevronDown,ChevronRight,Copy,Download,Eye,EyeOff,ExternalLink,FileJson,GripVertical,Image as ImageIcon,Info,Layers,LayoutGrid,Square,AlignLeft,Move,Columns2,Grip,Lock,LockOpen,Monitor,MousePointer2,Palette,Plus,Redo2,RotateCcw,Save,Settings2,Smartphone,Tablet,Trash2,Type,Undo2,Upload,X,Sun,Moon,Maximize2,FilePlus2,Film,FolderOpen,PlusCircle,Link2} from 'lucide-react'
import {initialContent,deepMerge,readPath,setPath} from './siteDefaults'
import {iconNames,IconVisual} from './iconCatalog'
import {gradientBackground} from './gradient'
import {sectionTemplates,newSection,newBlock,validSlug,gradientPreset,siteHref} from './builder'
import {moveBlock,duplicateBlock,deleteBlock,copySection,insertBlock} from './editorModel.js'
import {saveBlob,loadBlob,deleteBlob,kindFor,supportedFile,assetPath,makeZip,downloadBlob} from './mediaStore'

const DRAFT_KEY=`optimax-studio-v2-draft:${import.meta.env.BASE_URL||'./'}`
const OLD_KEY=`optimax-studio-old-draft:${import.meta.env.BASE_URL||'./'}`
const MAX_HISTORY=55
const MB=1024*1024
// Designer-friendly limits. These are our own upload guardrails, NOT provider quotas.
function mediaRule(file){
  const kind=kindFor(file.name)
  if(kind==='video')return {recommended:5*MB,max:20*MB,label:'MP4/WebM video'}
  if(kind==='gif')return {recommended:MB,max:5*MB,label:'Animated GIF'}
  if(kind==='icon')return {recommended:100*1024,max:500*1024,label:'SVG icon'}
  return {recommended:/hero/i.test(file.name)?500*1024:300*1024,max:2*MB,label:'Image'}
}
const niceSize=size=>size>=MB?`${(size/MB).toFixed(1)} MB`:`${Math.ceil(size/1024)} KB`
const repo=import.meta.env.VITE_GITHUB_REPOSITORY?`https://github.com/${import.meta.env.VITE_GITHUB_REPOSITORY}/tree/main/public`:'https://github.com/khairiyasinpc-source/optimax-studio-v2/tree/main/public'
const getSection=path=>{
  if(path.startsWith('builderBlocks.'))return path.split('.')[1]
  if(path.startsWith('gradients.sections.'))return path.split('.')[2]
  if(path.startsWith('gradients.elements.'))return getSection(path.slice('gradients.elements.'.length))
  if(path.startsWith('branding.') || ['icons.headerSearch','icons.headerMenu','icons.buttonArrow','icons.cardArrow','icons.submitArrow'].includes(path) || path.startsWith('icons.social.'))return 'global'
  if(path.startsWith('icons.features.'))return 'features'
  if(path.startsWith('icons.benefits.'))return 'about'
  if(path==='buttons.headerBook'||path==='buttons.footerBook')return 'global'
  if(path.startsWith('buttons.')){const name=path.split('.')[1];return name.startsWith('treatment')?'treatments':name.startsWith('solutions')?'solutions':name.startsWith('appointment')?'appointment':name.startsWith('news')?'news':'hero'}
  if(path.startsWith('treatmentSection')||path.startsWith('treatments.'))return 'treatments'
  if(path.startsWith('solutions.'))return 'solutions'
  if(path.startsWith('features.'))return 'features'
  return path.split('.')[0]
}
function editableFields(d,section){
  if(d.builderBlocks?.[section])return [{label:'Section name',path:`builderBlocks.${section}.label`,kind:'text'},...d.builderBlocks[section].blocks.map((b,i)=>({label:`${b.label} · ${b.kind}`,path:`builderBlocks.${section}.blocks.${i}.value`,kind:b.kind==='video'?'image':b.kind}))]
  const field=(label,path,kind='text')=>({label,path,kind})
  if(section==='hero')return [field('Eyebrow','hero.eyebrow'),field('Headline','hero.title'),field('Description','hero.body'),field('Hero image','hero.image','image'),field('Hero gradient','hero.overlay','gradient'),field('Primary button','buttons.heroBook','button'),field('Secondary button','buttons.heroExplore','button')]
  if(section==='features')return d.features.flatMap((f,i)=>[field(`Point ${i+1} • Icon`,`icons.features.${i}`,'icon'),field(`Point ${i+1} • Title`,`features.${i}.title`),field(`Point ${i+1} • Detail`,`features.${i}.detail`)])
  if(section==='treatments')return [field('Eyebrow','treatmentSection.eyebrow'),field('Heading','treatmentSection.title'),field('Description','treatmentSection.body'),field('View button','buttons.treatmentView','button'),...d.treatments.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`treatments.${i}.image`,'image'),field(`Card ${i+1} • Title`,`treatments.${i}.title`),field(`Card ${i+1} • Description`,`treatments.${i}.desc`),field(`Card ${i+1} • Background gradient`,`gradients.elements.treatments.${i}`,'gradient')])]
  if(section==='about')return [field('Eyebrow','about.eyebrow'),field('Heading','about.title'),field('Description','about.body'),field('Photo','about.image','image'),...['Advanced Technology','Experienced Specialists','Personalised Care','Comprehensive Solutions'].map((name,i)=>field(`${name} icon`,`icons.benefits.${i}`,'icon'))]
  if(section==='solutions')return [field('Heading','solutions.title'),field('View button','buttons.solutionsView','button'),...d.solutions.cards.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`solutions.cards.${i}.image`,'image'),field(`Card ${i+1} • Title`,`solutions.cards.${i}.title`),field(`Card ${i+1} • Description`,`solutions.cards.${i}.desc`),field(`Card ${i+1} • Background gradient`,`gradients.elements.solutions.cards.${i}`,'gradient')])]
  if(section==='appointment')return [field('Heading','appointment.title'),field('Description','appointment.body'),field('Background','appointment.image','image'),field('CTA button','buttons.appointmentBook','button')]
  if(section==='partners')return [field('Eyebrow','partners.eyebrow'),...d.partners.names.map((value,i)=>field(`Partner ${i+1}`,`partners.names.${i}`,/^data:image\/|^media\/|^https?:.*\.(png|jpe?g|svg|webp|gif)(\?|$)/i.test(value)?'image':'text'))]
  if(section==='news')return [field('Heading','news.title'),field('View button','buttons.newsView','button'),...d.news.cards.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`news.cards.${i}.image`,'image'),field(`Card ${i+1} • Title`,`news.cards.${i}.title`),field(`Card ${i+1} • Description`,`news.cards.${i}.desc`),field(`Card ${i+1} • Background gradient`,`gradients.elements.news.cards.${i}`,'gradient')])]
  if(section==='enquiry')return [field('Eyebrow','enquiry.eyebrow'),field('Heading','enquiry.title'),field('Description','enquiry.body')]
  return []
}
const controlIcon=kind=>kind==='image'||kind==='logo'?<ImageIcon size={15}/>:kind==='icon'?<Palette size={15}/>:kind==='gradient'?<Palette size={15}/>:kind==='button'?<MousePointer2 size={15}/>:<Type size={15}/>
function ToolButton({children,icon:Icon,onClick,disabled,title,active=false,className=''}){return <button type="button" title={title} aria-label={title||undefined} disabled={disabled} className={`studio-v2-iconbtn ${active?'v2-active':''} ${className}`} onClick={onClick}>{Icon&&<Icon size={17}/>} {children}</button>}
function Range({label,value=0,min=0,max=100,step=1,suffix='px',onChange}){return <label className="studio-v2-range"><span>{label}<b>{value}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function Field({label,children,hint}){return <label className="studio-v2-field"><span>{label}</span>{React.Children.map(children,child=>React.isValidElement(child)&&['input','select','textarea'].includes(child.type)?React.cloneElement(child,{'aria-label':label}):child)}{hint&&<small>{hint}</small>}</label>}
function AccentButton({onClick,children,secondary=false,disabled=false}){return <button type="button" className={'studio-v2-cta '+(secondary?'alt':'')} onClick={onClick} disabled={disabled}>{children}</button>}
function Color({label,value,onChange}){const hex=/^#[0-9a-f]{6}$/i.test(value||'')?value:'#08294b';return <Field label={label}><div className="studio-v2-color"><input type="color" aria-label={label+' picker'} value={hex} onChange={e=>onChange(e.target.value)}/><input spellCheck={false} value={value??''} onChange={e=>onChange(e.target.value)} /></div></Field>}
function downloadJSON(data){const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='site-content.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function imageToDataUrl(file){
  if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type))throw new Error('Pilih JPG, PNG, WebP atau SVG.')
  if(file.size>18*1024*1024)throw new Error('Saiz fail melebihi 18 MB.')
  const raw=await new Promise((res,rej)=>{const reader=new FileReader;reader.onload=()=>res(reader.result);reader.onerror=()=>rej(Error('Gagal baca gambar.'));reader.readAsDataURL(file)})
  const picture=await new Promise((res,rej)=>{const img=new window.Image;img.onload=()=>res(img);img.onerror=()=>rej(Error('Format gambar tak disokong.'));img.src=raw})
  const scale=Math.min(1,1600/Math.max(picture.naturalWidth,picture.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(picture.naturalWidth*scale));canvas.height=Math.max(1,Math.round(picture.naturalHeight*scale))
  canvas.getContext('2d').drawImage(picture,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',0.78)
}
function useEditorHistory(published,loaded,team,draftKey){
  const hadDraft=useRef(false)
  const [timeline,setTimeline]=useState(()=>{
    let present=team?published:initialContent
    try{const raw=localStorage.getItem(draftKey)||(!team&&localStorage.getItem(OLD_KEY));if(raw){const recovered=JSON.parse(raw);if(!team||recovered.revision===team.revision){present=deepMerge(initialContent,team?recovered.data:recovered);hadDraft.current=true}}}catch{}
    return {past:[],present,future:[]}
  })
  useEffect(()=>{if(loaded&&!hadDraft.current)setTimeline(v=>({...v,present:published}))},[loaded,published])
  const commit=fn=>{hadDraft.current=true;setTimeline(t=>{const next=fn(structuredClone(t.present));return {past:[...t.past,t.present].slice(-MAX_HISTORY),present:next,future:[]}})}
  const undo=()=>setTimeline(t=>t.past.length?{past:t.past.slice(0,-1),present:t.past.at(-1),future:[t.present,...t.future].slice(0,MAX_HISTORY)}:t)
  const redo=()=>setTimeline(t=>t.future.length?{past:[...t.past,t.present].slice(-MAX_HISTORY),present:t.future[0],future:t.future.slice(1)}:t)
  const replace=(next)=>{hadDraft.current=true;setTimeline(t=>({past:[...t.past,t.present].slice(-MAX_HISTORY),present:next,future:[]}))}
  const reset=()=>{hadDraft.current=false;try{localStorage.removeItem(draftKey);if(!team)localStorage.removeItem(OLD_KEY)}catch{};setTimeline({past:[],present:published,future:[]})}
  return {timeline,commit,undo,redo,replace,reset}
}

export default function Editor({published,loaded,team}){
  const draftKey=team?DRAFT_KEY+':'+team.username:DRAFT_KEY
  const [recoveryBackup,setRecoveryBackup]=useState(()=>{if(!team)return null;try{const prior=JSON.parse(localStorage.getItem(draftKey)||'null');if(prior?.data&&prior.revision!==team.revision&&JSON.stringify(prior.data)!==JSON.stringify(published)){localStorage.setItem(draftKey+':recovery',JSON.stringify(prior));return prior}return JSON.parse(localStorage.getItem(draftKey+':recovery')||'null')}catch{return null}})
  const [cloudRevision,setCloudRevision]=useState(team?.revision||0),[cloudConflict,setCloudConflict]=useState(false),[cloudBusy,setCloudBusy]=useState(false),[cloudMessage,setCloudMessage]=useState(''),[deployment,setDeployment]=useState(null)
  const cloudRef=useRef({revision:team?.revision||0,busy:false,conflict:false,last:JSON.stringify(published)})
  const {timeline,commit,undo,redo,replace,reset}=useEditorHistory(published,loaded,team,draftKey),data=timeline.present
  const [selection,setSelection]=useState({path:'hero.title',kind:'text'}),[tab,setTab]=useState('properties'),[viewport,setViewport]=useState('desktop'),[expanded,setExpanded]=useState(['hero']),[showPublish,setShowPublish]=useState(false),[isPreview,setIsPreview]=useState(false),[showSidebar,setShowSidebar]=useState(false),[mobilePanel,setMobilePanel]=useState(false),[status,setStatus]=useState('Ready'),[search,setSearch]=useState('')
  const [styleClipboard,setStyleClipboard]=useState(null)
  const [elementPanel,setElementPanel]=useState(false)
  const pendingMediaPath=useRef(null),directMediaInputRef=useRef(null)
  const [pageId,setPageId]=useState('home'),[pagesOpen,setPagesOpen]=useState(false),[sectionMenu,setSectionMenu]=useState(false),[addElementMenu,setAddElementMenu]=useState(''),[editorTheme,setEditorTheme]=useState(()=>{try{return localStorage.getItem('optimax-v2-editor-theme')==='dark'?'dark':'light'}catch{return 'light'}}),[fullPreview,setFullPreview]=useState(false),[assetUrls,setAssetUrls]=useState({})
  const stageRef=useRef(null),[canvasFit,setCanvasFit]=useState({scale:1,height:700})
  useEffect(()=>{const stage=stageRef.current;if(!stage)return;const fit=()=>{const css=getComputedStyle(stage),width=stage.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),height=stage.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom),target=viewport==='desktop'?1280:viewport==='tablet'?768:390,scale=Math.min(1,Math.max(.2,width/target));setCanvasFit(prev=>prev.scale===scale&&prev.height===height?prev:{scale,height})};const observer=new ResizeObserver(fit);observer.observe(stage);fit();return()=>observer.disconnect()},[viewport])
  const iframe=useRef(null),fullFrame=useRef(null),assetUploadRef=useRef(null),photoRef=useRef(null),iconRef=useRef(null),importRef=useRef(null),draggedSection=useRef(null)
  const selectedValue=readPath(data,selection.path)
  const selectedBlockMatch=selection.path.match(/^builderBlocks\.(section[a-zA-Z0-9_-]+)\.blocks\.(\d+)\.value$/)
  const selectedBlock=selectedBlockMatch?data.builderBlocks?.[selectedBlockMatch[1]]?.blocks?.[Number(selectedBlockMatch[2])]:null
  const blockStyle=selectedBlock?.style||{}
  const lightButton=['heroExplore','treatmentView','solutionsView','appointmentBook','newsView','footerBook'].includes(selection.path.split('.').at(-1))
  const selectionSection=getSection(selection.path)
  const locked=data.sections.find(s=>s.id===selectionSection)?.locked||data.builderBlocks?.[selectionSection]?.locked
  const library=data.library||[]
  const mediaAssets=data.mediaAssets||[]
  const allMedia=[...library.map(a=>({...a,kind:'image',path:a.url})),...mediaAssets.map(a=>({...a,url:assetUrls[a.path]||`${location.pathname.replace(/\/[^/]*$/,'/')}${a.path}`}))]
  const activePage=(data.pages||[]).find(p=>p.id===pageId)||data.pages?.[0]||{id:'home',title:'Homepage',slug:'',sections:[]}
  const currentSections=pageId==='home'?((all)=>[...all].sort((a,b)=>{const x=data.homepageOrder?.indexOf(a.id)??-1,y=data.homepageOrder?.indexOf(b.id)??-1;return (x>=0?x:1000+all.indexOf(a))-(y>=0?y:1000+all.indexOf(b))}))([...(data.sections||[]),...(activePage.sections||[]).map(id=>data.builderBlocks?.[id]).filter(Boolean)]):activePage.sections.map(id=>data.builderBlocks?.[id]).filter(Boolean)
  const previewPayload=useMemo(()=>({...data,previewAssets:assetUrls}),[data,assetUrls])
  const imageMeta=data.mediaSettings?.[selection.path]||{}
  const elementMeta=data.elementStyles?.[selection.path]||{}
  const notify=(value)=>setStatus(value)
  const patch=(path,value)=>{const section=getSection(path);if(data.builderBlocks?.[section]?.locked||data.sections.find(s=>s.id===section)?.locked)return;commit(d=>setPath(d,path,value))}
  const patchMany=(updates)=>{if(updates.some(([path])=>data.builderBlocks?.[getSection(path)]?.locked||data.sections.find(s=>s.id===getSection(path))?.locked))return;commit(d=>updates.reduce((acc,[path,value])=>setPath(acc,path,value),d))}
  const select=(path,kind,focus=true)=>{setSelection({path,kind});setTab('properties');setMobilePanel(true);if(focus)iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_FOCUS',path},location.origin)}
  const changeSection=(id,updates)=>commit(d=>d.builderBlocks?.[id]?{...d,builderBlocks:{...d.builderBlocks,[id]:{...d.builderBlocks[id],...updates}}}:{...d,sections:d.sections.map(s=>s.id===id?{...s,...updates}:s)} )
  const reorder=(from,to)=>{if(!from||!to||from===to)return;if(pageId==='home'){const current=currentSections.map(x=>x.id),i=current.indexOf(from),j=current.indexOf(to);if(i<0||j<0)return;current.splice(j,0,current.splice(i,1)[0]);commit(d=>({...d,homepageOrder:current}));return}if(data.builderBlocks?.[from]&&data.builderBlocks?.[to]){commit(d=>({...d,pages:d.pages.map(p=>p.id===pageId?{...p,sections:(()=>{const list=[...p.sections],i=list.indexOf(from),j=list.indexOf(to);if(i>=0&&j>=0)list.splice(j,0,list.splice(i,1)[0]);return list})()}:p)}));return}commit(d=>{const sections=[...d.sections];const src=sections.findIndex(s=>s.id===from),dest=sections.findIndex(s=>s.id===to);if(src<0||dest<0)return d;sections.splice(dest,0,sections.splice(src,1)[0]);return {...d,sections}})}
  const shift=(id,amount)=>{const list=currentSections.map(s=>s.id);const i=list.findIndex(v=>(typeof v==='string'?v:v.id)===id),j=i+amount;if(i<0||j<0||j>=list.length)return;reorder(id,typeof list[j]==='string'?list[j]:list[j].id)}
  const cardRoot=(selection.path.match(/^(treatments|solutions\.cards|news\.cards)\.\d+\./)||[])[1]
  const cardIndex=cardRoot?Number(selection.path.split('.')[cardRoot==='treatments'?1:2]):null
  const cardOperation=kind=>{if(!cardRoot)return;const source=readPath(data,cardRoot),index=cardIndex;if(!Array.isArray(source))return
    if(kind==='delete'&&source.length<=1){notify('Sekurang-kurangnya satu card diperlukan.');return}
    if(kind==='duplicate'&&source.length>=12){notify('Had 12 cards untuk satu section.');return}
    const cards=structuredClone(source)
    if(kind==='duplicate')cards.splice(index+1,0,structuredClone(cards[index]))
    if(kind==='delete')cards.splice(index,1)
    if(kind==='up'&&index>0)[cards[index-1],cards[index]]=[cards[index],cards[index-1]]
    if(kind==='down'&&index<cards.length-1)[cards[index],cards[index+1]]=[cards[index+1],cards[index]]
    patch(cardRoot,cards)
    const newIndex=kind==='delete'?Math.min(index,cards.length-1):kind==='duplicate'?index+1:kind==='up'?Math.max(0,index-1):kind==='down'?Math.min(cards.length-1,index+1):index
    const suffix=selection.path.slice((cardRoot+'.'+index+'.').length);select(`${cardRoot}.${newIndex}.${suffix}`,selection.kind,false)
  }
  const addCard=root=>{const arr=readPath(data,root);if(!Array.isArray(arr)||arr.length>=12){notify('Had 12 cards setiap section.');return}const newCard={...structuredClone(arr.at(-1)||{title:'New card',desc:'Add description',image:''}),title:'New card',desc:'Edit this description'};patch(root,[...arr,newCard]);const path=`${root}.${arr.length}.title`;select(path,'text',false)}
  const createLibrary=async(files,assign=false,targetOverride=null)=>{try{
    const targetPath=targetOverride||pendingMediaPath.current||selection.path
    const targetKind=targetOverride||pendingMediaPath.current?'image':selection.kind
    const incoming=Array.from(files||[]).slice(0,10);if(!incoming.length)return
    if(assign&&(data.sections.find(s=>s.id===getSection(targetPath))?.locked||data.builderBlocks?.[getSection(targetPath)]?.locked))throw Error('Unlock this section before replacing media.')
    const addedImages=[],addedMedia=[],urls={},warnings=[];notify('Preparing media...')
    for(const file of incoming){if(!supportedFile(file))throw Error(`Unsupported format: ${file.name}`)
      const rule=mediaRule(file);if(file.size>rule.max)throw Error(`${file.name}: ${niceSize(file.size)} terlalu besar. Maximum ${niceSize(rule.max)}.`)
      if(file.size>rule.recommended)warnings.push(`${file.name}: compress ke bawah ${niceSize(rule.recommended)} jika boleh`)
      const kind=kindFor(file.name)
      if(kind!=='icon'&&targetKind!=='logo'&&targetKind!=='icon'){
        const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),path=assetPath(id,kind==='image'?'image.webp':file.name)
        const stored=kind==='image'?await (await fetch(await imageToDataUrl(file))).blob():file
        await saveBlob(id,stored);addedMedia.push({id,path,name:file.name,kind,size:stored.size});urls[path]=URL.createObjectURL(stored)
      }else{
        const url=await imageToDataUrl(file);addedImages.push({id:'img'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:file.name,url,size:Math.ceil(url.length*0.75)})
      }
    }
    setAssetUrls(prev=>({...prev,...urls}))
    const first=(targetKind==='icon'||targetKind==='logo'?addedImages[0]?.url:addedMedia[0]?.path||addedImages[0]?.url)
    commit(d=>{const next={...d,library:[...(d.library||[]),...addedImages].slice(-80),mediaAssets:[...(d.mediaAssets||[]),...addedMedia].slice(-100)}
      return assign&&first&&['image','logo','icon'].includes(targetKind)?setPath(next,targetPath,first):next})
    notify(warnings.length?`${incoming.length} media ready. Tip: ${warnings[0]}`:`${incoming.length} media ready. Export ZIP untuk publish termasuk video/GIF.`)
  }catch(e){notify('Upload gagal: '+e.message)}finally{pendingMediaPath.current=null;for(const ref of [assetUploadRef,photoRef,iconRef,directMediaInputRef])if(ref.current)ref.current.value=''}}

  const removeAsset=id=>{const found=mediaAssets.find(a=>a.id===id);if(found&&JSON.stringify({...data,mediaAssets:[],library:[]}).includes(found.path)){notify('Media is in use. Replace it before removing.');return}if(found){commit(d=>({...d,mediaAssets:d.mediaAssets.filter(a=>a.id!==id)}));setAssetUrls(v=>{const next={...v};URL.revokeObjectURL(next[found.path]);delete next[found.path];return next})}else commit(d=>({...d,library:d.library.filter(a=>a.id!==id)}))}
  const importJSON=async file=>{if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||typeof parsed!=='object'||!parsed.hero||!parsed.buttons)throw Error('Fail bukan site-content.json.');replace(deepMerge(initialContent,parsed));notify('JSON berjaya import. Review sebelum publish.')}catch(e){notify('Import gagal: '+e.message)}finally{if(importRef.current)importRef.current.value=''}}
  const saveDraft=()=>{if(team){saveTeam();return}try{localStorage.setItem(draftKey,JSON.stringify(data));notify('Draft saved on this browser.')}catch{notify('Storage full. Export a backup.')}}
  const saveTeam=async(snapshot=latestData.current)=>{const state=cloudRef.current;if(state.busy||state.conflict)return null;state.busy=true;setCloudBusy(true);setCloudMessage('Saving shared draft…');try{const result=await saveShared(snapshot,state.revision,setCloudMessage);state.revision=result.revision;state.last=JSON.stringify(snapshot);setCloudRevision(result.revision);setCloudMessage('Shared draft saved · r'+result.revision);return result}catch(e){setCloudMessage(e.message);if(e.status===409){state.conflict=true;setCloudConflict(true)}return null}finally{state.busy=false;setCloudBusy(false)}}
  const reloadShared=async()=>{try{const remote=await api('draft');if(!remote.data)return;const n=deepMerge(initialContent,remote.data);cloudRef.current={revision:remote.revision,busy:false,conflict:false,last:JSON.stringify(n)};setCloudRevision(remote.revision);setCloudConflict(false);replace(n);setCloudMessage('Loaded shared draft · r'+remote.revision)}catch(e){setCloudMessage(e.message)}}
  const publishTeam=async()=>{const saved=await saveTeam();if(!saved)return;setCloudBusy(true);setCloudMessage('Publishing…');try{const result=await api('publish','POST',{revision:saved.revision});setDeployment({state:'queued',job:result.job,commit:result.commit});setCloudMessage('Publishing job queued. Waiting for GitHub Pages build.')}catch(e){setCloudMessage(e.message)}finally{setCloudBusy(false)}}

  useEffect(()=>{const timer=setTimeout(()=>{try{localStorage.setItem(draftKey,JSON.stringify(team?{revision:cloudRef.current.revision,data}:data));setStatus('Draft saved locally')}catch{setStatus('Browser storage full. Export a backup.')}},650);return()=>clearTimeout(timer)},[data,cloudRevision])
  useEffect(()=>{if(!team||cloudRef.current.conflict||JSON.stringify(data)===cloudRef.current.last)return;const timer=setTimeout(()=>saveTeam(data),2000);return()=>clearTimeout(timer)},[data,cloudRevision,cloudBusy])
  useEffect(()=>{if(!team)return;const poll=setInterval(async()=>{try{const remote=await api('draft');if(remote.revision>cloudRef.current.revision){cloudRef.current.conflict=true;setCloudConflict(true);setCloudMessage('A newer shared draft was saved by '+remote.updatedBy+'. Export your local copy before reloading.')}}catch{}},30000);return()=>clearInterval(poll)},[])
  useEffect(()=>{if(!deployment||deployment.state==='completed')return;const poll=setInterval(async()=>{try{const result=await api('publish-status');setDeployment(result);if(result.state==='completed')setCloudMessage(result.conclusion==='success'?'Published successfully to GitHub Pages':'Publishing build failed. Shared draft is safe.')}catch(e){setCloudMessage(e.message)}},5000);return()=>clearInterval(poll)},[deployment?.state])
  const latestData=useRef(data);latestData.current=data
  useEffect(()=>{const flush=()=>{try{localStorage.setItem(draftKey,JSON.stringify(team?{revision:cloudRef.current.revision,data:latestData.current}:latestData.current))}catch{}};window.addEventListener('pagehide',flush);return()=>{flush();window.removeEventListener('pagehide',flush)}},[])
  const requestMedia=(path)=>{pendingMediaPath.current=path;setSelection({path,kind:'image'});setTab('properties');directMediaInputRef.current?.click()}
  const applyElementMove=(sectionId,from,to,after=false,targetSection=sectionId)=>{
    const result=moveBlock(data,sectionId,from,targetSection,to,after);if(!result)return
    commit(()=>result.data);setSelection({path:result.path,kind:result.kind});notify('Element moved')
  }
  const insertElement=(id,kind,index=null)=>{if(!data.builderBlocks?.[id]||data.builderBlocks[id].locked||data.builderBlocks[id].blocks.length>=40)return
    const item=newBlock(kind),i=index===null?data.builderBlocks[id].blocks.length:Math.max(0,Math.min(data.builderBlocks[id].blocks.length,index))
    commit(d=>{return insertBlock(d,id,kind,i)});setSelection({path:`builderBlocks.${id}.blocks.${i}.value`,kind:kind==='video'?'image':kind});setTab('properties');setExpanded(v=>v.includes(id)?v:[...v,id]);setAddElementMenu('');notify(`${kind} added. Edit on canvas or Properties.`)}
  const addFromPalette=(kind)=>{const id=selectedBlockMatch?.[1]||selectionSection;if(data.builderBlocks?.[id]){insertElement(id,kind);return}
    const item=newSection('blank');const first=newBlock(kind);item.blocks=[first]
    commit(d=>({...d,builderBlocks:{...d.builderBlocks,[item.id]:item},pages:d.pages.map(p=>p.id===pageId?{...p,sections:[...p.sections,item.id]}:p)}));setExpanded(v=>[...v,item.id]);setSelection({path:`builderBlocks.${item.id}.blocks.0.value`,kind:kind==='video'?'image':kind});setTab('properties');notify('New custom section + '+kind+' added')}
  const messageHandlers=useRef({});messageHandlers.current={data,previewPayload,createLibrary,insertElement,applyElementMove,patchMany,select,patch}
  useEffect(()=>{const receiver=e=>{const {data,previewPayload,createLibrary,insertElement,applyElementMove,patchMany,select,patch}=messageHandlers.current;if(e.origin!==location.origin||e.source!==iframe.current?.contentWindow&&e.source!==fullFrame.current?.contentWindow)return;if(e.data?.type==='OPTIMAX_READY'){e.source.postMessage({type:'OPTIMAX_STATE',data:previewPayload},location.origin);return}if(e.data?.type==='OPTIMAX_MEDIA_FILE'&&typeof e.data.path==='string'&&e.data.file instanceof File)createLibrary([e.data.file],true,e.data.path)
    if(e.data?.type==='OPTIMAX_ADD_BLOCK'&&data.builderBlocks?.[e.data.sectionId]&&['text','image','video','icon','button','spacer'].includes(e.data.kind))insertElement(e.data.sectionId,e.data.kind,Number.isInteger(e.data.index)?e.data.index:null)
    if(e.data?.type==='OPTIMAX_MOVE_BLOCK'&&data.builderBlocks?.[e.data.sectionId])applyElementMove(e.data.fromSection||e.data.sectionId,e.data.from,e.data.to,e.data.after,e.data.sectionId)
    if(e.data?.type==='OPTIMAX_RESIZE_BLOCK'&&/^builderBlocks\.section[a-zA-Z0-9_-]+\.blocks\.\d+\.value$/.test(e.data.path)){if(data.builderBlocks[getSection(e.data.path)]?.locked)return;const base=e.data.path.replace(/\.value$/,'.style');const w=Math.round(Number(e.data.width)),h=Math.round(Number(e.data.height));if(w>45&&w<=2000&&h>=12&&h<=2000)patchMany([[base+'.width',w],[base+'.height',h]])}
    if(e.data?.type==='OPTIMAX_SELECT'&&typeof e.data.path==='string'&&readPath(data,e.data.path)!==undefined)select(e.data.path,e.data.kind,false);if(e.data?.type==='OPTIMAX_TEXT_CHANGE'&&typeof e.data.value==='string'&&typeof readPath(data,e.data.path)==='string')patch(e.data.path,e.data.value.slice(0,300000))};window.addEventListener('message',receiver);return()=>window.removeEventListener('message',receiver)},[])
  useEffect(()=>{iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data:previewPayload},location.origin);fullFrame.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data:previewPayload},location.origin)},[data,assetUrls,fullPreview,pageId])
  useEffect(()=>{const keyboard=e=>{if(!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=='z'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;e.preventDefault();if(e.shiftKey)redo();else undo()};window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard)},[undo,redo])
  const toggleExpanded=id=>setExpanded(v=>v.includes(id)?v.filter(s=>s!==id):[...v,id])
  const settingsUpdate=(name,value)=>patch(`elementStyles.${selection.path}.${name}`,value)
  const mediaUpdate=(name,value)=>patch(`mediaSettings.${selection.path}.${name}`,value)
  const resetSelectedStyle=()=>commit(d=>{const next=structuredClone(d);delete next.elementStyles[selection.path];return next})
  const resetSelectedMedia=()=>commit(d=>{const next=structuredClone(d);delete next.mediaSettings[selection.path];return next})
  const gradientControls=(target='hero.overlay',title='Gradient overlay')=>{
    const current=readPath(data,target)
    const overlay=current?.stops?.length?current:target==='hero.overlay'?initialContent.hero.overlay:gradientPreset()
    const patchOverlay=(key,value)=>patch(target+'.'+key,value)
    const setStop=(index,key,value)=>{const stops=structuredClone(overlay.stops);stops[index]={...stops[index],[key]:value};patchOverlay('stops',stops)}
    return <><div className="studio-v2-separator"/><h3>{title}</h3>
      <label className="studio-v2-check"><input type="checkbox" checked={Boolean(overlay.enabled)} onChange={e=>patch(target,{...overlay,enabled:e.target.checked})}/> Enable gradient</label>
      <Field label="Gradient type"><select value={overlay.type} onChange={e=>patchOverlay('type',e.target.value)}><option value="linear">Linear</option><option value="radial">Radial</option></select></Field>
      {overlay.type==='linear'?<Range label="Angle" value={overlay.angle??90} min={0} max={360} suffix="°" onChange={v=>patchOverlay('angle',v)}/>:<><Range label="Radial centre X" value={overlay.radialX??25} min={0} max={100} suffix="%" onChange={v=>patchOverlay('radialX',v)}/><Range label="Radial centre Y" value={overlay.radialY??50} min={0} max={100} suffix="%" onChange={v=>patchOverlay('radialY',v)}/></>}
      <div className="studio-v2-gradient-preview" style={{backgroundImage:gradientBackground(overlay)+'linear-gradient(130deg,#afcbe6,#315d8b)'}}/>
      <h3>Colour stops</h3>
      {overlay.stops.map((stop,i)=><div className="studio-v2-gradientstop" key={i}><div className="studio-v2-stophead"><b>Stop {i+1}</b><button type="button" disabled={overlay.stops.length<=2} onClick={()=>patchOverlay('stops',overlay.stops.filter((_,j)=>j!==i))} title="Remove stop"><Trash2 size={14}/></button></div><Color label="Colour" value={stop.color} onChange={v=>setStop(i,'color',v)}/><Range label="Position" suffix="%" value={stop.position} min={0} max={100} onChange={v=>setStop(i,'position',v)}/><Range label="Opacity" suffix="%" value={stop.opacity} min={0} max={100} onChange={v=>setStop(i,'opacity',v)}/></div>)}
      <AccentButton secondary disabled={overlay.stops.length>=8} onClick={()=>patchOverlay('stops',[...overlay.stops,{color:'#ffffff',opacity:0,position:100}])}><Plus size={14}/> Add gradient stop</AccentButton>
      <AccentButton secondary onClick={()=>patch(target,target==='hero.overlay'?structuredClone(initialContent.hero.overlay):gradientPreset())}><RotateCcw size={14}/> Reset gradient</AccentButton>
    </>
  }
  const addPage=()=>{const title=window.prompt('New page name (example: Treatments)');if(!title?.trim())return;const slug=validSlug(title);if(!slug||data.pages.some(p=>p.slug===slug)){notify('Page name or URL already exists.');return}const id='page'+Date.now().toString(36);commit(d=>({...d,pages:[...d.pages,{id,title:title.trim().slice(0,100),slug,sections:[]}]}));setPageId(id);setSelection({path:`pages.${data.pages.length}.title`,kind:'text'});setPagesOpen(true);setExpanded([]);notify('Page added. Use Add Section to design.')}
  const renamePage=()=>{if(pageId==='home')return;const title=window.prompt('Page name:',activePage.title);if(!title?.trim())return;const slug=validSlug(window.prompt('Page URL slug:',activePage.slug)||'');if(!slug){notify('Page URL cannot be empty.');return}if(data.pages.some(p=>p.id!==pageId&&p.slug===slug)){notify('This page URL already exists.');return}commit(d=>({...d,pages:d.pages.map(p=>p.id===pageId?{...p,title:title.trim().slice(0,100),slug}:p)}));notify('Page updated. Check links if the URL changed.')}
  const duplicatePage=()=>{if(activePage.id==='home')return;const title=window.prompt('Duplicate page as:',activePage.title+' Copy');if(!title?.trim())return;const slug=validSlug(title);if(!slug||data.pages.some(p=>p.slug===slug)){notify('URL already exists.');return}const id='page'+Date.now().toString(36);const newIds=[];let next=structuredClone(data);for(const old of activePage.sections){const key='section'+crypto.randomUUID().replaceAll('-','');next=copySection(next,old,key);newIds.push(key)}commit(()=>({...next,pages:[...next.pages,{id,title:title.trim(),slug,sections:newIds}]}));setPageId(id)}
  const deletePage=()=>{if(activePage.id==='home'||!window.confirm(`Delete ${activePage.title}?`))return;const id=activePage.id;commit(d=>({...d,pages:d.pages.filter(p=>p.id!==id)}));setPageId('home')}
  const addSection=type=>{const newItem=newSection(type);commit(d=>({...d,builderBlocks:{...d.builderBlocks,[newItem.id]:newItem},sectionStyles:{...d.sectionStyles,[newItem.id]:{columns:({split:2,cards:3,gallery:3})[type]||1,gap:20}},pages:d.pages.map(p=>p.id===pageId?{...p,sections:[...p.sections,newItem.id]}:p)}));setExpanded(e=>[...e,newItem.id]);setSelection({path:`builderBlocks.${newItem.id}.label`,kind:'text'});setTab('section');setSectionMenu(false);notify('Section added to '+activePage.title)}
  const duplicateSection=id=>{if(!data.builderBlocks[id])return;const newId='section'+crypto.randomUUID().replaceAll('-','');commit(d=>{const next=copySection(d,id,newId);next.pages=next.pages.map(p=>p.id===pageId?{...p,sections:p.sections.flatMap(s=>s===id?[s,newId]:[s])}:p);if(pageId==='home')next.homepageOrder=currentSections.flatMap(s=>s.id===id?[id,newId]:[s.id]);return next});setExpanded(v=>[...v,newId]);notify('Section duplicated')}
  const removeSection=id=>{if(!window.confirm('Delete this section?'))return;commit(d=>({...d,pages:d.pages.map(p=>({...p,sections:p.sections.filter(s=>s!==id)})),builderBlocks:Object.fromEntries(Object.entries(d.builderBlocks).filter(([k])=>k!==id)),homepageOrder:(d.homepageOrder||[]).filter(k=>k!==id)}));setSelection({path:'hero.title',kind:'text'})}
  const addElement=(id,kind)=>insertElement(id,kind)
  const removeElement=()=>{const match=selection.path.match(/^builderBlocks\.(section[^.]+)\.blocks\.(\d+)\.value$/);if(!match)return;const [,id,index]=match;commit(d=>{return deleteBlock(d,id,Number(index))});setSelection({path:`builderBlocks.${id}.label`,kind:'text'})}
  const exportPackage=async(snapshot=data)=>{try{notify('Preparing export package...');const entries=[{name:'site-content.json',data:new TextEncoder().encode(JSON.stringify({...snapshot,previewAssets:{}},null,2)+'\n')}];for(const asset of snapshot.mediaAssets||[]){let blob=await loadBlob(asset.id);if(!blob){const response=await fetch((team?'/':import.meta.env.BASE_URL)+asset.path);if(response.ok)blob=await response.blob()}if(!blob){notify(`Missing ${asset.name} on this browser. Re-upload or import backup on the original device.`);return}entries.push({name:asset.path,data:blob})}entries.push({name:'README-UPLOAD.txt',data:new TextEncoder().encode('OPTIMAX V2\nUpload site-content.json to the repository public/ folder.\nUpload media/ files to repository public/media/ (create folder if needed).\nCommit all. GitHub Actions will build new pages and media URLs.\nKeep a backup ZIP before any changes.\n')});const zip=await makeZip(entries);downloadBlob(zip,'OPTIMAX-V2-PUBLISH-PACKAGE.zip');notify('ZIP downloaded. Upload contents to public/ and commit.')}
    catch(e){notify('Export failed: '+e.message)}}
  useEffect(()=>{let cancelled=false;const urls={};Promise.all(mediaAssets.map(async a=>{const blob=await loadBlob(a.id);if(blob)urls[a.path]=URL.createObjectURL(blob)})).then(()=>{if(!cancelled)setAssetUrls(urls);else Object.values(urls).forEach(URL.revokeObjectURL)}).catch(()=>{});return()=>{cancelled=true;Object.values(urls).forEach(URL.revokeObjectURL)}},[mediaAssets.map(a=>a.id).join('|')])
  useEffect(()=>{try{localStorage.setItem('optimax-v2-editor-theme',editorTheme)}catch{}},[editorTheme])

  return <div className="studio-v2" data-studio-theme={editorTheme}>
    <header className="studio-v2-top">
      <div className="studio-v2-brand"><span className="studio-v2-mark">O</span><div><b>OPTIMAX Studio</b><small>Visual Editor V2</small></div></div>
      <div className="studio-v2-headcenter"><span className="studio-v2-indicator"/><span className="studio-v2-desktop-only">{status}</span></div>
      <div className="studio-v2-toptools">
        <ToolButton icon={Undo2} title="Undo (Cmd/Ctrl+Z)" disabled={!timeline.past.length} onClick={undo}/>
        <ToolButton icon={Redo2} title="Redo (Cmd/Ctrl+Shift+Z)" disabled={!timeline.future.length} onClick={redo}/>
        <span className="studio-v2-divider-vertical"/>
        <ToolButton icon={Upload} title="Import JSON" onClick={()=>importRef.current?.click()}/>
        <ToolButton icon={Save} title={team?"Save shared draft":"Save browser draft"} onClick={saveDraft}/>
        <ToolButton icon={editorTheme==='dark'?Sun:Moon} title={editorTheme==='dark'?'Light editor mode':'Dark editor mode'} onClick={()=>setEditorTheme(v=>v==='dark'?'light':'dark')}/>
        <ToolButton icon={Download} title="Export backup" onClick={()=>setShowPublish(true)}/>{team&&<ToolButton icon={Lock} title="Sign out" onClick={()=>{if(cloudRef.current.last!==JSON.stringify(data)&&!window.confirm("Your changes are saved locally. Sign out before saving them to the team?"))return;team.logout()}}/>}<button className="studio-v2-publish" disabled={team&&(cloudBusy||cloudConflict)} onClick={team?publishTeam:()=>setShowPublish(true)}><Save size={16}/> <span>{team?"Publish":"Export for GitHub"}</span></button>
        <input hidden ref={importRef} type="file" accept=".json,application/json" onChange={e=>importJSON(e.target.files?.[0])}/>
        <input hidden ref={directMediaInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.gif,.mp4,.webm" onChange={e=>createLibrary(e.target.files,true)}/>
      </div>
    </header>
    {(team||recoveryBackup)&&<div className="studio-v2-teamstatus" role="status">{team?<><span>{team.username} · Shared r{cloudRevision} · {cloudMessage||"Connected"}</span>{cloudConflict&&<><button onClick={()=>downloadJSON(data)}>Export local backup</button><button disabled={cloudBusy} onClick={reloadShared}>Reload shared draft</button></>}</>:<span>Local workspace · Team login and publishing require the configured team service.</span>}{recoveryBackup&&<><span>Older local draft preserved.</span><button onClick={()=>exportPackage(recoveryBackup.data)}>Download recovery ZIP</button><button onClick={()=>{localStorage.removeItem(draftKey+':recovery');setRecoveryBackup(null)}}>Dismiss recovery</button></>}</div>}<div className="studio-v2-layout">
      <aside className={'studio-v2-sidebar '+(showSidebar?'studio-v2-open':'')}>
        <div className="studio-v2-sidehead"><div><b>Layers</b><small>Website structure</small></div><Layers size={18}/></div>
        <div className="studio-v2-pagesbar"><button type="button" onClick={()=>setPagesOpen(v=>!v)}><FolderOpen size={15}/> Pages <ChevronDown size={13}/></button><button type="button" title="Add new page" onClick={addPage}><FilePlus2 size={16}/></button></div>
        {pagesOpen&&<div className="studio-v2-pagesmenu">{data.pages.map(page=><button key={page.id} className={pageId===page.id?'active':''} onClick={()=>{setPageId(page.id);setSelection({path:page.id==='home'?'hero.title':(page.sections.length?`builderBlocks.${page.sections[0]}.label`:`pages.${data.pages.indexOf(page)}.title`),kind:'text'});setMobilePanel(false);setExpanded(page.sections)}}>{page.title}<small>/{page.slug?`${page.slug}/`:''}</small></button>)}<button className="studio-v2-add" onClick={addPage}><Plus size={14}/> Add New Page</button>{pageId!=='home'&&<div className="studio-v2-pageactions"><button onClick={renamePage}><Type size={13}/> Rename</button><button onClick={duplicatePage}><Copy size={13}/> Duplicate</button><button onClick={deletePage}><Trash2 size={13}/> Delete</button></div>}</div>}
        <div className="v2-palette"><button className="v2-palette-toggle" onClick={()=>setElementPanel(v=>!v)}><Square size={15}/> Elements <span>＋</span></button>
        {elementPanel&&<><div className="v2-palette-grid">{[['text',Type,'Text'],['image',ImageIcon,'Image'],['video',Film,'Video'],['button',MousePointer2,'Button'],['icon',Palette,'Icon'],['spacer',Move,'Spacer']].map(([kind,Icon,title])=><button key={kind} type="button" draggable onDragStart={e=>{e.dataTransfer.setData('application/x-optimax-kind',kind);e.dataTransfer.setData('text/plain','optimax-kind:'+kind);e.dataTransfer.effectAllowed='copy'}} onClick={()=>addFromPalette(kind)} title={'Drag '+title+' onto a custom section, or click to add'}><Icon size={17}/><span>{title}</span></button>)}</div><small className="v2-palette-tip">Drag to custom sections, or click to add. Images upload directly from the placeholder.</small></>}
        </div>
        <div className="studio-v2-search"><input placeholder="Search elements..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="studio-v2-layerlist">
          {currentSections.map((section,i)=>{
            const fields=editableFields(data,section.id).filter(item=>`${item.label} ${item.path}`.toLowerCase().includes(search.toLowerCase()))
            if(search&&!fields.length&&!section.label.toLowerCase().includes(search.toLowerCase()))return null
            const open=expanded.includes(section.id)||!!search
            return <div className="studio-v2-sectiongroup" key={section.id} draggable onDragStart={e=>{draggedSection.current=section.id;e.dataTransfer.effectAllowed='move'}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();reorder(draggedSection.current,section.id);draggedSection.current=null}}>
              <div className={'studio-v2-sectionhead '+(!section.visible?'studio-v2-hidden':'')}>
                <GripVertical size={14} className="studio-v2-grip"/><button type="button" className="studio-v2-sectiontitle" onClick={()=>toggleExpanded(section.id)}>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>} <span>{section.label}</span></button>
                <button title="Move up" disabled={!i} onClick={()=>shift(section.id,-1)}><ArrowUp size={13}/></button>
                <button title="Move down" disabled={i===currentSections.length-1} onClick={()=>shift(section.id,1)}><ArrowDown size={13}/></button>
                <button title={section.locked?'Unlock section':'Lock section'} onClick={()=>changeSection(section.id,{locked:!section.locked})}>{section.locked?<Lock size={14}/>:<LockOpen size={14}/>}</button>
                <button title={section.visible?'Hide section':'Show section'} onClick={()=>changeSection(section.id,{visible:!section.visible})}>{section.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button>
              </div>
              {open&&<div className="studio-v2-sectionfields">{fields.map(item=><button key={item.path} type="button" className={'studio-v2-layer '+(selection.path===item.path?'studio-v2-layer-selected':'')} onClick={()=>{select(item.path,item.kind);setShowSidebar(false)}}><span>{controlIcon(item.kind)}</span><span>{item.label}</span></button>)}
                {section.id==='treatments'&&<button className="studio-v2-add" onClick={()=>addCard('treatments')}><Plus size={13}/> Add treatment card</button>}
                {section.id==='solutions'&&<button className="studio-v2-add" onClick={()=>addCard('solutions.cards')}><Plus size={13}/> Add solution card</button>}
                {section.id==='news'&&<button className="studio-v2-add" onClick={()=>addCard('news.cards')}><Plus size={13}/> Add news card</button>}
                {data.builderBlocks?.[section.id]&&<><button className="studio-v2-add" onClick={()=>setAddElementMenu(addElementMenu===section.id?'':section.id)}><Plus size={13}/> Add Element</button>{addElementMenu===section.id&&<div className="studio-v2-addoptions">{['text','image','video','icon','button','spacer'].map(kind=><button key={kind} onClick={()=>addElement(section.id,kind)}>{kind}</button>)}</div>}<button className="studio-v2-add" onClick={()=>duplicateSection(section.id)}><Copy size={13}/> Duplicate Section</button><button className="studio-v2-add" onClick={()=>removeSection(section.id)}><Trash2 size={13}/> Delete Section</button></>}
              </div>}
            </div>
          })}
          <div className="studio-v2-addsection"><button onClick={()=>setSectionMenu(v=>!v)}><PlusCircle size={16}/> Add Section</button>{sectionMenu&&<div className="studio-v2-template-options">{sectionTemplates.map(t=><button key={t.type} onClick={()=>addSection(t.type)}><LayoutGrid size={14}/> {t.label}</button>)}</div>}</div>
          <div className="studio-v2-buttons-group"><b>Global components</b>
            {[['branding.headerLogo','Header logo','logo'],['branding.footerLogo','Footer logo','logo'],['gradients.sections.header','Header background gradient','gradient'],['gradients.sections.footer','Footer background gradient','gradient'],['icons.headerSearch','Search icon','icon'],['icons.headerMenu','Mobile menu icon','icon'],['icons.buttonArrow','All button arrows','icon'],['icons.cardArrow','Card arrows','icon'],['icons.submitArrow','Submit arrow','icon'],['icons.social.facebook','Facebook icon','icon'],['icons.social.instagram','Instagram icon','icon'],['icons.social.youtube','YouTube icon','icon']].map(([path,label,kind])=><button key={path} className={'studio-v2-layer '+(selection.path===path?'studio-v2-layer-selected':'')} onClick={()=>select(path,kind)}>{controlIcon(kind)} {label}</button>)}
            {['headerBook','footerBook'].map(id=><button key={id} className={'studio-v2-layer '+(selection.path===`buttons.${id}`?'studio-v2-layer-selected':'')} onClick={()=>select(`buttons.${id}`,'button')}><MousePointer2 size={14}/> {id==='headerBook'?'Header button':'Footer button'}</button>)}
          </div>
        </div>
        <div className="studio-v2-sidefoot"><Info size={14}/> Drag sections to reorder. Lock to prevent accidental editing.</div>
      </aside>
      <main className="studio-v2-canvas">
        <div className="studio-v2-canvasbar">
          <div className="studio-v2-canvaslabel"><button className="studio-v2-sidebar-toggle" onClick={()=>setShowSidebar(v=>!v)} title="Toggle layers"><Layers size={18}/></button><b>{activePage.title}</b><span>/{activePage.slug}</span><span>{isPreview?'Preview mode':'Design mode'}</span></div>
          <div className="studio-v2-switches">
            {[['desktop',Monitor,'Desktop'],['tablet',Tablet,'Tablet'],['mobile',Smartphone,'Mobile']].map(([id,Icon,title])=><button title={title} key={id} className={viewport===id?'active':''} onClick={()=>setViewport(id)}><Icon size={17}/><span>{title}</span></button>)}
          </div>
          <button className={'studio-v2-viewtoggle '+(isPreview?'active':'')} onClick={()=>setIsPreview(v=>!v)}><Eye size={17}/><span>{isPreview?'Editing':'Preview'}</span></button>
          <ToolButton icon={Maximize2} title="Full Screen Website Preview" onClick={()=>setFullPreview(true)}/>
        </div>
        <div ref={stageRef} className="studio-v2-stage"><div className="studio-v2-framefit" style={{width:(viewport==='desktop'?1280:viewport==='tablet'?768:390)*canvasFit.scale,height:canvasFit.height}}><div className={'studio-v2-frame studio-v2-'+viewport} style={{width:viewport==='desktop'?1280:viewport==='tablet'?768:390,transform:`scale(${canvasFit.scale})`,transformOrigin:'top left',height:canvasFit.height/canvasFit.scale}}><iframe onLoad={()=>iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data:previewPayload},location.origin)} key={isPreview?'plain':'editable'} ref={iframe} title="OPTIMAX website preview" src={`${location.pathname}${isPreview?'?siteview=1':'?preview=1'}&page=${activePage.slug}`} /></div></div></div>
        <div className="studio-v2-canvasfoot"><MousePointer2 size={14}/> {isPreview?'Preview mode: links and forms behave normally.':'Click any editable element in the preview. Drag section headers in Layers to reorder.'}</div>
      </main>
      <aside className={'studio-v2-inspector '+(mobilePanel?'studio-v2-panelopen':'')}>
        <div className="studio-v2-inspecttabs"><button className={tab==='properties'?'active':''} onClick={()=>setTab('properties')}><Settings2 size={15}/> Properties</button><button className={tab==='media'?'active':''} onClick={()=>setTab('media')}><ImageIcon size={15}/> Media</button><button className={tab==='section'?'active':''} onClick={()=>setTab('section')}><LayoutGrid size={15}/> Section</button><button className={tab==='theme'?'active':''} onClick={()=>setTab('theme')}><Palette size={15}/> Theme</button></div>
        <div className="studio-v2-inspectscroll">
          {tab==='properties'&&<>
            <div className="studio-v2-paneltitle"><span>{controlIcon(selection.kind)}</span><div><b>{selection.kind==='image'?'Image':selection.kind==='logo'?'Logo':selection.kind==='icon'?'Icon':selection.kind==='gradient'?'Gradient':selection.kind==='button'?'Button':'Text'} properties</b><small>{selection.path}</small></div></div>
            {locked?<div className="studio-v2-warning"><Lock size={17}/> This section is locked. Unlock in Layers first.</div>:<>
              {viewport!=='desktop'&&<><div className="v2-edit-bar"><b>{viewport==='mobile'?'Mobile':'Tablet'} overrides</b><span>Blank inherits desktop. Content is shared.</span></div>
                {['width','height','fontSize','paddingTop','paddingRight','paddingBottom','paddingLeft'].map(prop=><Field key={prop} label={viewport+' '+prop+' (px)'}><input type="number" min="0" max="2000" value={data.responsiveStyles?.[viewport]?.[selection.path]?.[prop]??''} placeholder="Inherit" onChange={e=>commit(d=>{d.responsiveStyles[viewport][selection.path]??={};if(e.target.value==='')delete d.responsiveStyles[viewport][selection.path][prop];else d.responsiveStyles[viewport][selection.path][prop]=Math.max(0,Math.min(2000,Number(e.target.value)));return d})}/></Field>)}
              </>}
              {selectedBlock&&<><div className="v2-edit-bar"><b>Canvas element</b><span>{selectedBlock.label}</span></div>
                <div className="v2-quick-actions"><button title="Move up" disabled={Number(selectedBlockMatch[2])===0} onClick={()=>applyElementMove(selectedBlockMatch[1],Number(selectedBlockMatch[2]),Number(selectedBlockMatch[2])-1)}><ArrowUp size={14}/> Up</button><button title="Move down" disabled={Number(selectedBlockMatch[2])===data.builderBlocks[selectedBlockMatch[1]].blocks.length-1} onClick={()=>applyElementMove(selectedBlockMatch[1],Number(selectedBlockMatch[2]),Number(selectedBlockMatch[2])+1,true)}><ArrowDown size={14}/> Down</button><button title="Duplicate" onClick={()=>{const id=selectedBlockMatch[1],idx=Number(selectedBlockMatch[2]);commit(d=>{return duplicateBlock(d,id,idx)});select(`builderBlocks.${id}.blocks.${idx+1}.value`,selection.kind,false)}}><Copy size={14}/> Copy</button></div>
                <div className="studio-v2-separator"/><h3>Size & appearance</h3>
                <div className="studio-v2-half"><Field label="Width (px)"><input type="number" min="48" max="2000" placeholder="Auto" value={blockStyle.width??''} onChange={e=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.width`,e.target.value===''?'':Number(e.target.value))}/></Field><Field label="Height (px)"><input type="number" min="20" max="2000" placeholder="Auto" value={blockStyle.height??''} onChange={e=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.height`,e.target.value===''?'':Number(e.target.value))}/></Field></div>
                <Color label="Element background" value={blockStyle.background||'#ffffff'} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.background`,v)}/>
                <Color label="Element text colour" value={blockStyle.color||'#102b4e'} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.color`,v)}/>
                <Range label="Corner radius" min={0} max={80} value={blockStyle.radius??0} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.radius`,v)}/>
                <Range label="Opacity" min={0} max={100} suffix="%" value={blockStyle.opacity??100} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.opacity`,v)}/>
                <label className="studio-v2-check"><input type="checkbox" checked={!!blockStyle.shadow} onChange={e=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.shadow`,e.target.checked)}/> Drop shadow</label>
                <div className="studio-v2-separator"/><h3>Padding (individual sides)</h3>
                {['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(side=><Range key={side} label={side.replace('padding','')} min={0} max={160} value={blockStyle[side]??0} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.${side}`,v)}/>)}
                <h3>Margin (individual sides)</h3>
                {['marginTop','marginRight','marginBottom','marginLeft'].map(side=><Range key={side} label={side.replace('margin','')} min={-100} max={160} value={blockStyle[side]??0} onChange={v=>patch(`builderBlocks.${selectedBlockMatch[1]}.blocks.${selectedBlockMatch[2]}.style.${side}`,v)}/>)}
                <div className="studio-v2-separator"/>
              </>}
              {selection.kind==='text'&&<>
                {selection.path.startsWith('partners.names.')&&<AccentButton secondary onClick={()=>requestMedia(selection.path)}><ImageIcon size={14}/> Replace partner text with image/logo</AccentButton>}
                <Field label="Content"><textarea rows={selection.path.endsWith('body')||selection.path.endsWith('desc')?6:3} value={selectedValue??''} onChange={e=>patch(selection.path,e.target.value)}/></Field>
                <div className="studio-v2-separator"/><h3>Typography</h3>
                <Field label="Font family"><select value={elementMeta.fontFamily||''} onChange={e=>settingsUpdate('fontFamily',e.target.value)}><option value="">Use website font</option><option>Manrope</option><option>DM Sans</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option></select></Field>
                <div className="studio-v2-half"><Field label="Font size (px)"><input type="number" min="8" max="160" placeholder="Auto" value={elementMeta.fontSize??''} onChange={e=>settingsUpdate('fontSize',e.target.value===''?'':Math.max(8,Math.min(160,Number(e.target.value))))}/></Field><Field label="Weight"><select value={elementMeta.fontWeight||''} onChange={e=>settingsUpdate('fontWeight',e.target.value)}><option value="">Default</option>{[300,400,500,600,700,800].map(weight=><option key={weight} value={weight}>{weight}</option>)}</select></Field></div>
                <div className="studio-v2-half"><Field label="Mobile font (px)"><input type="number" min="8" max="120" placeholder="Auto" value={elementMeta.mobileFontSize??''} onChange={e=>settingsUpdate('mobileFontSize',e.target.value?Number(e.target.value):'')}/></Field><Field label="Tablet font (px)"><input type="number" min="8" max="140" placeholder="Auto" value={elementMeta.tabletFontSize??''} onChange={e=>settingsUpdate('tabletFontSize',e.target.value?Number(e.target.value):'')}/></Field></div>
                <Field label="Alignment"><div className="studio-v2-segment">{['left','center','right'].map(t=><button key={t} className={(elementMeta.textAlign||'left')===t?'active':''} onClick={()=>settingsUpdate('textAlign',t)}>{t}</button>)}</div></Field>
                <Range label="Line height" min={0.8} max={2.5} step={0.05} suffix="×" value={Number(elementMeta.lineHeight)||1.3} onChange={v=>settingsUpdate('lineHeight',v)}/>
                <Range label="Letter spacing" min={-3} max={8} suffix="px" value={Number(elementMeta.letterSpacing)||0} onChange={v=>settingsUpdate('letterSpacing',v)}/>
                <Color label="Text color" value={elementMeta.color??data.theme.text} onChange={v=>settingsUpdate('color',v)}/>
                <AccentButton secondary onClick={resetSelectedStyle}><RotateCcw size={15}/> Reset typography</AccentButton>
              </>}
              {selection.kind==='image'&&<>
                <Field label="Image URL or public/images path"><input value={typeof selectedValue==='string'&&selectedValue.startsWith('data:')?'':selectedValue||''} onChange={e=>patch(selection.path,e.target.value)} placeholder="https://... or /images/photo.webp"/></Field>
                <div className="studio-v2-photo">{selectedValue&&(/\.(mp4|webm)$/.test(selectedValue)?<video src={assetUrls[selectedValue]||selectedValue} muted autoPlay loop playsInline/>:<img src={assetUrls[selectedValue]||selectedValue} alt="Selected media"/>)}</div>
                <AccentButton onClick={()=>requestMedia(selection.path)}><Upload size={16}/> Upload / Replace</AccentButton>
                <input hidden type="file" accept="image/*,video/mp4,video/webm,.gif" ref={photoRef} onChange={e=>createLibrary(e.target.files,true)}/>
                <AccentButton secondary onClick={()=>setTab('media')}><ImageIcon size={16}/> Choose from Media Library</AccentButton>
                <div className="studio-v2-separator"/><h3>Crop and positioning</h3>
                <Range label="Horizontal position" value={imageMeta.positionX??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('positionX',v)}/>
                <Range label="Vertical position" value={imageMeta.positionY??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('positionY',v)}/>
                <h3>Mobile focal point</h3><Range label="Mobile horizontal" value={imageMeta.mobilePositionX??imageMeta.positionX??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('mobilePositionX',v)}/><Range label="Mobile vertical" value={imageMeta.mobilePositionY??imageMeta.positionY??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('mobilePositionY',v)}/>
                <Field label="Image fit"><select value={imageMeta.fit||'cover'} onChange={e=>mediaUpdate('fit',e.target.value)}><option value="cover">Cover (fill area)</option><option value="contain">Contain (show all)</option></select></Field>
                {!['hero.image','appointment.image'].includes(selection.path)&&<Field label="Image height (px, blank = default)"><input type="number" min="80" max="800" placeholder="Default" value={imageMeta.height??''} onChange={e=>mediaUpdate('height',e.target.value?Math.max(80,Math.min(800,Number(e.target.value))):'')}/></Field>}
                <AccentButton secondary onClick={()=>{patch(selection.path,readPath(initialContent,selection.path)||'');resetSelectedMedia()}}><RotateCcw size={15}/> Restore original image</AccentButton>
                <div className="studio-v2-separator"/><h3>Video playback</h3><label className="studio-v2-check"><input type="checkbox" checked={imageMeta.videoLoop!==false} onChange={e=>mediaUpdate('videoLoop',e.target.checked)}/> Loop video (autoplay muted)</label><label className="studio-v2-check"><input type="checkbox" checked={imageMeta.showControls!==false} onChange={e=>mediaUpdate('showControls',e.target.checked)}/> Reveal player controls on tap</label>
                <Field label="Video poster image (optional)"><select value={imageMeta.poster||''} onChange={e=>mediaUpdate('poster',e.target.value)}><option value="">None</option>{allMedia.filter(a=>a.kind!=='video').map(a=><option key={a.id} value={a.path}>{a.name}</option>)}</select></Field>
                <Field label="Mobile alternative media (optional)"><select value={imageMeta.mobileSrc||''} onChange={e=>mediaUpdate('mobileSrc',e.target.value)}><option value="">Same as desktop</option>{allMedia.map(a=><option key={a.id} value={a.path}>{a.name}</option>)}</select></Field>
                {gradientControls(selection.path==='hero.image'?'hero.overlay':`gradients.elements.${selection.path}`,'Media gradient overlay')}
              </>}
              {selection.kind==='gradient'&&gradientControls(selection.path,selection.path==='hero.overlay'?'Hero gradient overlay':'Universal gradient')}
              {selection.kind==='logo'&&<>
                <p className="studio-v2-muted">Choose a logo for this location. Header and footer can use different versions.</p>
                {selectedValue?<div className="studio-v2-logo-preview"><img src={selectedValue} alt="Selected OPTIMAX logo"/></div>:<div className="studio-v2-empty">Original V2 text logo is active.</div>}
                <Field label="Image URL"><input value={selectedValue?.startsWith('data:')?'':selectedValue||''} onChange={e=>patch(selection.path,e.target.value)} placeholder="https://... or image path"/></Field>
                <AccentButton onClick={()=>photoRef.current?.click()}><Upload size={15}/> Upload / Replace Logo</AccentButton>
                <input hidden ref={photoRef} type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" onChange={e=>createLibrary(e.target.files,true)}/>
                <AccentButton secondary onClick={()=>setTab('media')}><ImageIcon size={15}/> Choose from Media Library</AccentButton>
                <Range label="Logo width" min={65} max={360} value={data.branding[selection.path==='branding.footerLogo'?'footerWidth':'headerWidth']} onChange={v=>patch(`branding.${selection.path==='branding.footerLogo'?'footerWidth':'headerWidth'}`,v)}/>
                <AccentButton secondary onClick={()=>patch(selection.path,'')}><RotateCcw size={15}/> Restore original text logo</AccentButton>
              </>}
              {selection.kind==='icon'&&<>
                <p className="studio-v2-muted">Choose a Lucide icon or upload your own PNG, WebP or SVG (converted to WebP).</p>
                <div className="studio-v2-icon-preview"><IconVisual value={selectedValue} size={42}/></div>
                <Field label="Icon library"><select value={typeof selectedValue==='string'&&selectedValue.startsWith('data:')?'':selectedValue||''} onChange={e=>patch(selection.path,e.target.value)}><option value="">Select an icon</option>{iconNames.map(name=><option key={name} value={name}>{name}</option>)}</select></Field>
                <div className="studio-v2-icon-grid">{iconNames.map(name=><button type="button" title={name} aria-label={name} key={name} className={selectedValue===name?'active':''} onClick={()=>patch(selection.path,name)}><IconVisual value={name} size={20}/></button>)}</div>
                <AccentButton secondary onClick={()=>iconRef.current?.click()}><Upload size={15}/> Upload custom icon</AccentButton>
                <input hidden ref={iconRef} type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" onChange={e=>createLibrary(e.target.files,true)}/>
                <AccentButton secondary onClick={()=>patch(selection.path,readPath(initialContent,selection.path))}><RotateCcw size={15}/> Restore original icon</AccentButton>
              </>}
              
              {selection.kind==='button'&&<>
                <Field label="Button label"><input value={selectedValue?.label||''} onChange={e=>patch(selection.path+'.label',e.target.value)}/></Field>
                <Field label="Link / anchor"><input value={selectedValue?.href||''} onChange={e=>patch(selection.path+'.href',e.target.value)}/></Field>
                <Field label="Link to page"><select value={data.pages.some(p=>('/'+p.slug+(p.slug?'/':'') )===(selectedValue?.href||''))?selectedValue.href:''} onChange={e=>{if(e.target.value)patch(selection.path+'.href',e.target.value)}}><option value="">Choose a page (optional)</option>{data.pages.map(p=><option key={p.id} value={'/'+(p.slug?p.slug+'/':'')}>{p.title}</option>)}</select></Field>
                <div className="studio-v2-separator"/><h3>Dimensions</h3>
                <Range label="Width" value={selectedValue?.width??data.theme.buttonWidth} min={0} max={420} step={5} onChange={v=>patch(selection.path+'.width',v||null)}/>
                <small className="studio-v2-hint">Set width to 0 for auto.</small>
                <Range label="Height" value={selectedValue?.height??data.theme.buttonHeight} min={30} max={100} onChange={v=>patch(selection.path+'.height',v)}/>
                <Range label="Corner radius" value={selectedValue?.radius??data.theme.buttonRadius} min={0} max={55} onChange={v=>patch(selection.path+'.radius',v)}/>
                <Range label="Font size" value={selectedValue?.fontSize??data.theme.buttonFontSize} min={10} max={28} onChange={v=>patch(selection.path+'.fontSize',v)}/>
                <Color label="Button background" value={selectedValue?.bg||(lightButton?'#ffffff':data.theme.primary)} onChange={v=>patch(selection.path+'.bg',v)}/>
                <Color label="Button text color" value={selectedValue?.color||(lightButton?data.theme.primary:'#ffffff')} onChange={v=>patch(selection.path+'.color',v)}/>
                <AccentButton secondary onClick={()=>patch(selection.path,{...selectedValue,width:null,height:null,radius:null,fontSize:null,bg:'',color:''})}><RotateCcw size={15}/> Reset to global button style</AccentButton>
              </>}
              {['text','button','icon'].includes(selection.kind)&&gradientControls(`gradients.elements.${selection.path}`,selection.kind==='text'?'Text gradient':selection.kind==='button'?'Button gradient':'Icon gradient')}
              {!selectedBlock&&['text','button','image','icon','logo'].includes(selection.kind)&&<><div className="studio-v2-separator"/><h3>Element spacing</h3>
                {['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(side=><Range key={side} label={'Padding '+side.slice(7)} min={0} max={120} value={elementMeta[side]??0} onChange={v=>settingsUpdate(side,v)}/>)}
                <h3>Element margin</h3>{['marginTop','marginRight','marginBottom','marginLeft'].map(side=><Range key={side} label={'Margin '+side.slice(6)} min={-60} max={120} value={elementMeta[side]??0} onChange={v=>settingsUpdate(side,v)}/>)}
                <Color label="Background colour" value={elementMeta.background||'#ffffff'} onChange={v=>settingsUpdate('background',v)}/>
                <Range label="Corner radius" min={0} max={80} value={elementMeta.borderRadius??0} onChange={v=>settingsUpdate('borderRadius',v)}/>
              </>}
              <div className="studio-v2-separator"/><h3>Copy / Paste Style</h3><div className="studio-v2-half"><AccentButton secondary onClick={()=>{setStyleClipboard({kind:selection.kind,block:structuredClone(selectedBlock?.style||{}),element:structuredClone(data.elementStyles?.[selection.path]||{}),media:structuredClone(data.mediaSettings?.[selection.path]||{}),gradient:structuredClone(readPath(data,`gradients.elements.${selection.path}`)||gradientPreset())});notify('Style copied')}}><Copy size={14}/> Copy</AccentButton><AccentButton secondary disabled={!styleClipboard||selection.kind!==styleClipboard.kind} onClick={()=>{commit(d=>{let next=structuredClone(d);next.elementStyles[selection.path]=structuredClone(styleClipboard.element);next.mediaSettings[selection.path]=structuredClone(styleClipboard.media);if(selectedBlock)next=setPath(next,selection.path.replace(/\.value$/,'.style'),styleClipboard.block);return setPath(next,`gradients.elements.${selection.path}`,styleClipboard.gradient)});notify('Style pasted')}}><Copy size={14}/> Paste</AccentButton></div>
              {selection.path.startsWith('builderBlocks.')&&selection.path.includes('.blocks.')&&<AccentButton secondary onClick={removeElement}><Trash2 size={14}/> Delete selected element</AccentButton>}
              {cardRoot&&<><div className="studio-v2-separator"/><h3>Card actions</h3><div className="studio-v2-cardactions"><ToolButton icon={ArrowUp} title="Move card up" disabled={cardIndex===0} onClick={()=>cardOperation('up')}/><ToolButton icon={ArrowDown} title="Move card down" disabled={cardIndex===readPath(data,cardRoot).length-1} onClick={()=>cardOperation('down')}/><ToolButton icon={Copy} title="Duplicate card" onClick={()=>cardOperation('duplicate')}/><ToolButton icon={Trash2} title="Delete card" onClick={()=>cardOperation('delete')}/></div></>}
            </>}
          </>}
          {tab==='media'&&<><div className="studio-v2-paneltitle"><span><ImageIcon size={17}/></span><div><b>Media Library</b><small>{allMedia.length} media files · {team?"shared draft":"local draft"}</small></div></div><p className="studio-v2-muted">Upload images, videos, GIF or icons. Uploads are included when saving the shared draft. Keep a ZIP backup of your work.</p><div className="studio-v2-warning"><Info size={15}/> Recommended: images 100–500 KB (max 2 MB); SVG 100 KB (max 500 KB); GIF 1 MB (max 5 MB); video 3–5 MB (max 20 MB). These are editor guidelines, not free-plan quotas.</div><p className="studio-v2-muted">Current browser library: {allMedia.length} files, approx. {niceSize([...library,...mediaAssets].reduce((total,a)=>total+(a.size||0),0))}. This is not your GitHub/Cloudflare storage balance.</p>
            <AccentButton onClick={()=>assetUploadRef.current?.click()}><Plus size={15}/> Upload media</AccentButton><input hidden type="file" accept="image/*,video/mp4,video/webm,.svg,.gif" multiple ref={assetUploadRef} onChange={e=>createLibrary(e.target.files,false)}/>
            <div className="studio-v2-gallery">{allMedia.map(item=><div className="studio-v2-asset" key={item.id}>{item.kind==='video'?<video src={assetUrls[item.path]||item.url} muted playsInline controls/>:<img src={item.url} alt={item.name}/>} <div><small title={item.name}>{item.name}</small><button title="Remove from library" onClick={()=>removeAsset(item.id)}><Trash2 size={13}/></button></div><button disabled={!['image','logo','icon'].includes(selection.kind)||locked||((selection.kind==='logo'||selection.kind==='icon')&&['video','gif'].includes(item.kind))} onClick={()=>{if((selection.kind==='icon'||selection.kind==='logo')&&(item.kind==='video'||item.kind==='gif')){notify('Video hanya boleh digunakan pada image/background elements.');return}patch(selection.path,item.path||item.url);setTab('properties')}}>Use this media</button></div>)}</div>
            {!allMedia.length&&<div className="studio-v2-empty"><ImageIcon size={27}/><p>No uploaded media yet.</p></div>}
            <div className="studio-v2-warning"><Info size={15}/> Images are compressed into JSON. Videos/GIF are stored in browser IndexedDB and must be exported as ZIP before publishing.</div>
          </>}
          {tab==='section'&&<><div className="studio-v2-paneltitle"><span><LayoutGrid size={17}/></span><div><b>Section layout</b><small>{data.sections.find(v=>v.id===selectionSection)?.label||data.builderBlocks?.[selectionSection]?.label||'Global element'}</small></div></div>
            {(data.sections.some(s=>s.id===selectionSection)||data.builderBlocks?.[selectionSection])?<>
              <div className="studio-v2-sectioncontrols"><AccentButton secondary onClick={()=>changeSection(selectionSection,{visible:!(data.sections.find(s=>s.id===selectionSection)||data.builderBlocks[selectionSection]).visible})}>{(data.sections.find(s=>s.id===selectionSection)||data.builderBlocks[selectionSection]).visible?<EyeOff size={14}/>:<Eye size={14}/>} {(data.sections.find(s=>s.id===selectionSection)||data.builderBlocks[selectionSection]).visible?'Hide':'Show'} section</AccentButton><AccentButton secondary onClick={()=>changeSection(selectionSection,{locked:!locked})}>{locked?<LockOpen size={14}/>:<Lock size={14}/>} {locked?'Unlock':'Lock'} section</AccentButton></div>
              <div className="studio-v2-separator"/><h3>Spacing</h3>
              <Range label="Top padding" min={0} max={180} value={data.sectionStyles?.[selectionSection]?.paddingTop??data.theme.sectionPadding} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingTop`,v)}/>
              <Range label="Bottom padding" min={0} max={180} value={data.sectionStyles?.[selectionSection]?.paddingBottom??data.theme.sectionPadding} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingBottom`,v)}/>
              <Range label="Left padding" min={0} max={160} value={data.sectionStyles?.[selectionSection]?.paddingLeft??0} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingLeft`,v)}/>
              <Range label="Right padding" min={0} max={160} value={data.sectionStyles?.[selectionSection]?.paddingRight??0} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingRight`,v)}/>
              {data.builderBlocks?.[selectionSection]&&<><div className="studio-v2-separator"/><h3>Custom layout</h3><Field label="Columns"><select value={data.sectionStyles?.[selectionSection]?.columns??1} onChange={e=>patch(`sectionStyles.${selectionSection}.columns`,Number(e.target.value))}><option value={1}>1 column (stacked)</option><option value={2}>2 columns</option><option value={3}>3 columns</option></select></Field><Range label="Gap between elements" min={0} max={100} value={data.sectionStyles?.[selectionSection]?.gap??20} onChange={v=>patch(`sectionStyles.${selectionSection}.gap`,v)}/><Field label="Align elements"><select value={data.sectionStyles?.[selectionSection]?.alignItems||'start'} onChange={e=>patch(`sectionStyles.${selectionSection}.alignItems`,e.target.value)}><option value="start">Top</option><option value="center">Middle</option><option value="end">Bottom</option><option value="stretch">Stretch</option></select></Field></>}

              {viewport!=='desktop'&&<Field label={viewport+' columns (blank inherits)'}><select value={data.responsiveStyles?.[viewport]?.[selectionSection]?.columns??''} onChange={e=>commit(d=>{d.responsiveStyles[viewport][selectionSection]??={};if(e.target.value==='')delete d.responsiveStyles[viewport][selectionSection].columns;else d.responsiveStyles[viewport][selectionSection].columns=Number(e.target.value);return d})}><option value="">Default</option>{[1,2,3].map(n=><option key={n} value={n}>{n} columns</option>)}</select></Field>}
              <Color label="Section background" value={data.sectionStyles?.[selectionSection]?.background||'#ffffff'} onChange={v=>patch(`sectionStyles.${selectionSection}.background`,v)}/>
              <small className="studio-v2-hint">Section background and gradient can be edited independently.</small>
              {gradientControls(`gradients.sections.${selectionSection}`,'Section background gradient')}
              <AccentButton secondary onClick={()=>commit(d=>{const next=structuredClone(d);delete next.sectionStyles[selectionSection];return next})}><RotateCcw size={14}/> Reset section styling</AccentButton>
            </>:<p className="studio-v2-muted">Select a homepage section element in Layers to edit its spacing.</p>}
          </>}
          {tab==='theme'&&<><div className="studio-v2-paneltitle"><span><Palette size={17}/></span><div><b>Website theme</b><small>Global controls</small></div></div>
            <Color label="Primary brand color" value={data.theme.primary} onChange={v=>patch('theme.primary',v)}/>
            <Color label="Text color" value={data.theme.text} onChange={v=>patch('theme.text',v)}/>
            <Color label="Page background" value={data.theme.background} onChange={v=>patch('theme.background',v)}/>
            <Field label="Heading font"><select value={data.theme.headingFont} onChange={e=>patch('theme.headingFont',e.target.value)}><option>Manrope</option><option>DM Sans</option><option>Arial</option><option>Georgia</option></select></Field>
            <Field label="Body font"><select value={data.theme.bodyFont} onChange={e=>patch('theme.bodyFont',e.target.value)}><option>DM Sans</option><option>Manrope</option><option>Arial</option><option>Georgia</option></select></Field>
            <div className="studio-v2-separator"/><h3>All buttons</h3>
            <Range label="Button width" value={data.theme.buttonWidth} min={0} max={400} step={5} onChange={v=>patch('theme.buttonWidth',v)}/>
            <Range label="Button height" value={data.theme.buttonHeight} min={30} max={100} onChange={v=>patch('theme.buttonHeight',v)}/>
            <Range label="Button radius" value={data.theme.buttonRadius} min={0} max={55} onChange={v=>patch('theme.buttonRadius',v)}/>
            <Range label="Button font size" value={data.theme.buttonFontSize} min={10} max={26} onChange={v=>patch('theme.buttonFontSize',v)}/>
            <div className="studio-v2-separator"/><h3>Spacing and cards</h3>
            <Range label="Desktop section spacing" value={data.theme.sectionPadding} min={24} max={140} onChange={v=>patch('theme.sectionPadding',v)}/>
            <Range label="Mobile section spacing" value={data.theme.mobileSectionPadding} min={20} max={100} onChange={v=>patch('theme.mobileSectionPadding',v)}/>
            <Range label="Card corner radius" value={data.theme.cardRadius} min={0} max={35} onChange={v=>patch('theme.cardRadius',v)}/>
          </>}
        </div>
        <div className="studio-v2-inspectbottom"><span><Check size={13}/> {team?cloudBusy?"Saving…":"Shared r"+cloudRevision:"Browser draft"}</span><button onClick={()=>setMobilePanel(false)}>Close</button></div>
      </aside>
    </div>
    <button type="button" className="studio-v2-mobileproperties" onClick={()=>{setMobilePanel(v=>!v);setShowSidebar(false)}}><Settings2 size={16}/> {mobilePanel?'Hide':'Edit properties'}</button>
    {fullPreview&&<div className="studio-v2-fullpreview" role="dialog" aria-modal="true" aria-label="Full-screen website preview"><div className="studio-v2-fullhead"><span><Eye size={17}/> Website Preview · {activePage.title} · Draft only</span><button onClick={()=>setFullPreview(false)}><X size={17}/> Exit Preview</button></div><iframe ref={fullFrame} title="Full website preview" src={`${location.pathname}?siteview=1&page=${activePage.slug}`} onLoad={()=>fullFrame.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data:previewPayload},location.origin)}/></div>}
    {showPublish&&<div className="studio-v2-overlay" onClick={()=>setShowPublish(false)}><div className="studio-v2-dialog" role="dialog" aria-modal="true" aria-label="Export website content" onClick={e=>e.stopPropagation()}><div className="studio-v2-dialogtop"><span><FileJson size={25}/></span><button onClick={()=>setShowPublish(false)} aria-label="Close dialog"><X size={20}/></button></div><h2>Publish changes to GitHub</h2><p>This editor saves a draft in your browser. GitHub Pages doesn't allow direct public uploads. Export your website package and upload the JSON plus any media files into the public folder. New pages are built on the next GitHub Actions deployment.</p><ol><li>Download and extract the publish ZIP.</li><li>Open your GitHub repository at <code>public/</code>.</li><li>Upload <b>site-content.json</b> and any files in the <b>media/</b> folder. Commit changes.</li><li>Wait until GitHub Actions shows a green check. Refresh the public website.</li></ol><AccentButton onClick={()=>exportPackage()}><Download size={17}/> Download Publish Package (ZIP)</AccentButton><AccentButton secondary onClick={()=>{downloadJSON(data);notify('JSON downloaded. Use the ZIP to include media bytes.')}}><FileJson size={16}/> JSON only (no media files)</AccentButton><a href={repo} target="_blank" rel="noreferrer" className="studio-v2-github">Open GitHub public folder <ExternalLink size={16}/></a><div className="studio-v2-warning"><Info size={15}/> Your preview is not password protected. No GitHub token is stored. Anyone with the editor URL can make local drafts, but only repository collaborators can publish.</div></div></div>}
  </div>
}
