import React, {useEffect,useMemo,useRef,useState} from 'react'
import {ArrowDown,ArrowUp,Check,ChevronDown,ChevronRight,Copy,Download,Eye,EyeOff,ExternalLink,FileJson,GripVertical,Image as ImageIcon,Info,Layers,LayoutGrid,Lock,LockOpen,Monitor,MousePointer2,Palette,Plus,Redo2,RotateCcw,Save,Settings2,Smartphone,Tablet,Trash2,Type,Undo2,Upload,X} from 'lucide-react'
import {initialContent,deepMerge,readPath,setPath} from './siteDefaults'
import {iconNames,IconVisual} from './iconCatalog'
import {gradientBackground} from './gradient'

const DRAFT_KEY=`optimax-studio-v2-draft:${import.meta.env.BASE_URL||'./'}`
const OLD_KEY=`optimax-studio-old-draft:${import.meta.env.BASE_URL||'./'}`
const MAX_HISTORY=55
const repo=import.meta.env.VITE_GITHUB_REPOSITORY?`https://github.com/${import.meta.env.VITE_GITHUB_REPOSITORY}/tree/main/public`:''
const getSection=path=>{
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
  const field=(label,path,kind='text')=>({label,path,kind})
  if(section==='hero')return [field('Eyebrow','hero.eyebrow'),field('Headline','hero.title'),field('Description','hero.body'),field('Hero image','hero.image','image'),field('Hero gradient','hero.overlay','gradient'),field('Primary button','buttons.heroBook','button'),field('Secondary button','buttons.heroExplore','button')]
  if(section==='features')return d.features.flatMap((f,i)=>[field(`Point ${i+1} • Icon`,`icons.features.${i}`,'icon'),field(`Point ${i+1} • Title`,`features.${i}.title`),field(`Point ${i+1} • Detail`,`features.${i}.detail`)])
  if(section==='treatments')return [field('Eyebrow','treatmentSection.eyebrow'),field('Heading','treatmentSection.title'),field('Description','treatmentSection.body'),field('View button','buttons.treatmentView','button'),...d.treatments.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`treatments.${i}.image`,'image'),field(`Card ${i+1} • Title`,`treatments.${i}.title`),field(`Card ${i+1} • Description`,`treatments.${i}.desc`)])]
  if(section==='about')return [field('Eyebrow','about.eyebrow'),field('Heading','about.title'),field('Description','about.body'),field('Photo','about.image','image'),...['Advanced Technology','Experienced Specialists','Personalised Care','Comprehensive Solutions'].map((name,i)=>field(`${name} icon`,`icons.benefits.${i}`,'icon'))]
  if(section==='solutions')return [field('Heading','solutions.title'),field('View button','buttons.solutionsView','button'),...d.solutions.cards.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`solutions.cards.${i}.image`,'image'),field(`Card ${i+1} • Title`,`solutions.cards.${i}.title`),field(`Card ${i+1} • Description`,`solutions.cards.${i}.desc`)])]
  if(section==='appointment')return [field('Heading','appointment.title'),field('Description','appointment.body'),field('Background','appointment.image','image'),field('CTA button','buttons.appointmentBook','button')]
  if(section==='partners')return [field('Eyebrow','partners.eyebrow'),...d.partners.names.map((_,i)=>field(`Partner ${i+1}`,`partners.names.${i}`))]
  if(section==='news')return [field('Heading','news.title'),field('View button','buttons.newsView','button'),...d.news.cards.flatMap((c,i)=>[field(`Card ${i+1} • Photo`,`news.cards.${i}.image`,'image'),field(`Card ${i+1} • Title`,`news.cards.${i}.title`),field(`Card ${i+1} • Description`,`news.cards.${i}.desc`)])]
  if(section==='enquiry')return [field('Eyebrow','enquiry.eyebrow'),field('Heading','enquiry.title'),field('Description','enquiry.body')]
  return []
}
const controlIcon=kind=>kind==='image'||kind==='logo'?<ImageIcon size={15}/>:kind==='icon'?<Palette size={15}/>:kind==='gradient'?<Palette size={15}/>:kind==='button'?<MousePointer2 size={15}/>:<Type size={15}/>
function ToolButton({children,icon:Icon,onClick,disabled,title,active=false,className=''}){return <button type="button" title={title} aria-label={title||undefined} disabled={disabled} className={`studio-v2-iconbtn ${active?'v2-active':''} ${className}`} onClick={onClick}>{Icon&&<Icon size={17}/>} {children}</button>}
function Range({label,value=0,min=0,max=100,step=1,suffix='px',onChange}){return <label className="studio-v2-range"><span>{label}<b>{value}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function Field({label,children,hint}){return <label className="studio-v2-field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
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
function useEditorHistory(published,loaded){
  const hadDraft=useRef(false)
  const [timeline,setTimeline]=useState(()=>{
    let present=initialContent
    try{const raw=localStorage.getItem(DRAFT_KEY)||localStorage.getItem(OLD_KEY);if(raw){present=deepMerge(initialContent,JSON.parse(raw));hadDraft.current=true}}catch{}
    return {past:[],present,future:[]}
  })
  useEffect(()=>{if(loaded&&!hadDraft.current)setTimeline(v=>({...v,present:published}))},[loaded,published])
  const commit=fn=>{hadDraft.current=true;setTimeline(t=>{const next=fn(structuredClone(t.present));return {past:[...t.past,t.present].slice(-MAX_HISTORY),present:next,future:[]}})}
  const undo=()=>setTimeline(t=>t.past.length?{past:t.past.slice(0,-1),present:t.past.at(-1),future:[t.present,...t.future].slice(0,MAX_HISTORY)}:t)
  const redo=()=>setTimeline(t=>t.future.length?{past:[...t.past,t.present].slice(-MAX_HISTORY),present:t.future[0],future:t.future.slice(1)}:t)
  const replace=(next)=>{hadDraft.current=true;setTimeline(t=>({past:[...t.past,t.present].slice(-MAX_HISTORY),present:next,future:[]}))}
  const reset=()=>{hadDraft.current=false;localStorage.removeItem(DRAFT_KEY);localStorage.removeItem(OLD_KEY);setTimeline({past:[],present:published,future:[]})}
  return {timeline,commit,undo,redo,replace,reset}
}

export default function Editor({published,loaded}){
  const {timeline,commit,undo,redo,replace,reset}=useEditorHistory(published,loaded),data=timeline.present
  const [selection,setSelection]=useState({path:'hero.title',kind:'text'}),[tab,setTab]=useState('properties'),[viewport,setViewport]=useState('desktop'),[expanded,setExpanded]=useState(['hero']),[showPublish,setShowPublish]=useState(false),[isPreview,setIsPreview]=useState(false),[showSidebar,setShowSidebar]=useState(false),[mobilePanel,setMobilePanel]=useState(false),[status,setStatus]=useState('Ready'),[search,setSearch]=useState('')
  const iframe=useRef(null),assetUploadRef=useRef(null),photoRef=useRef(null),iconRef=useRef(null),importRef=useRef(null),draggedSection=useRef(null)
  const selectedValue=readPath(data,selection.path)
  const lightButton=['heroExplore','treatmentView','solutionsView','appointmentBook','newsView','footerBook'].includes(selection.path.split('.').at(-1))
  const selectionSection=getSection(selection.path)
  const locked=data.sections.find(s=>s.id===selectionSection)?.locked
  const library=data.library||[]
  const imageMeta=data.mediaSettings?.[selection.path]||{}
  const elementMeta=data.elementStyles?.[selection.path]||{}
  const notify=(value)=>setStatus(value)
  const patch=(path,value)=>commit(d=>setPath(d,path,value))
  const patchMany=(updates)=>commit(d=>updates.reduce((acc,[path,value])=>setPath(acc,path,value),d))
  const select=(path,kind,focus=true)=>{setSelection({path,kind});setTab('properties');setMobilePanel(true);if(focus)iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_FOCUS',path},location.origin)}
  const changeSection=(id,updates)=>commit(d=>({...d,sections:d.sections.map(s=>s.id===id?{...s,...updates}:s)}))
  const reorder=(from,to)=>{if(!from||!to||from===to)return;commit(d=>{const sections=[...d.sections];const src=sections.findIndex(s=>s.id===from),dest=sections.findIndex(s=>s.id===to);if(src<0||dest<0)return d;sections.splice(dest,0,sections.splice(src,1)[0]);return {...d,sections}})}
  const shift=(id,amount)=>{const i=data.sections.findIndex(s=>s.id===id),j=i+amount;if(i<0||j<0||j>=data.sections.length)return;reorder(id,data.sections[j].id)}
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
  const createLibrary=async(files,assign=false)=>{try{const incoming=Array.from(files||[]).slice(0,10);if(!incoming.length)return;notify('Compressing images...');const assets=[];for(const file of incoming){assets.push({id:'media-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:file.name,url:await imageToDataUrl(file)})}commit(d=>{const copy=structuredClone(d);copy.library=[...copy.library,...assets].slice(-80);if(assign&&['image','logo','icon'].includes(selection.kind))return setPath(copy,selection.path,assets[0].url);return copy});notify(`${assets.length} gambar ditambah ke media library. Export JSON untuk publish.`)}catch(e){notify(e.message)}finally{if(assetUploadRef.current)assetUploadRef.current.value='';if(photoRef.current)photoRef.current.value='';if(iconRef.current)iconRef.current.value=''}}
  const removeAsset=id=>commit(d=>({...d,library:d.library.filter(a=>a.id!==id)}))
  const importJSON=async file=>{if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||typeof parsed!=='object'||!parsed.hero||!parsed.buttons)throw Error('Fail bukan site-content.json.');replace(deepMerge(initialContent,parsed));notify('JSON berjaya import. Review sebelum publish.')}catch(e){notify('Import gagal: '+e.message)}finally{if(importRef.current)importRef.current.value=''}}
  const saveDraft=()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(data));notify('Draft berjaya disimpan pada browser ini.')}catch{notify('Storage penuh. Download JSON sekarang sebagai backup.')}}
  useEffect(()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(data));setStatus('Draft saved locally')}catch{setStatus('Browser storage penuh. Export JSON untuk backup.')}},[data])
  useEffect(()=>{const receiver=e=>{if(e.origin!==location.origin||e.source!==iframe.current?.contentWindow)return;if(e.data?.type==='OPTIMAX_READY')iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data},location.origin);if(e.data?.type==='OPTIMAX_SELECT')select(e.data.path,e.data.kind,false)};window.addEventListener('message',receiver);return()=>window.removeEventListener('message',receiver)},[data])
  useEffect(()=>{iframe.current?.contentWindow?.postMessage({type:'OPTIMAX_STATE',data},location.origin)},[data])
  useEffect(()=>{const keyboard=e=>{if(!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=='z'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;e.preventDefault();if(e.shiftKey)redo();else undo()};window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard)},[undo,redo])
  const toggleExpanded=id=>setExpanded(v=>v.includes(id)?v.filter(s=>s!==id):[...v,id])
  const settingsUpdate=(name,value)=>patch(`elementStyles.${selection.path}.${name}`,value)
  const mediaUpdate=(name,value)=>patch(`mediaSettings.${selection.path}.${name}`,value)
  const resetSelectedStyle=()=>commit(d=>{const next=structuredClone(d);delete next.elementStyles[selection.path];return next})
  const resetSelectedMedia=()=>commit(d=>{const next=structuredClone(d);delete next.mediaSettings[selection.path];return next})
  const overlay=data.hero.overlay||initialContent.hero.overlay
  const patchOverlay=(key,value)=>patch('hero.overlay.'+key,value)
  const setStop=(index,key,value)=>{
    const stops=structuredClone(overlay.stops)
    stops[index]={...stops[index],[key]:value}
    patchOverlay('stops',stops)
  }
  const gradientControls=()=> <>
    <div className="studio-v2-separator"/><h3>Hero gradient overlay</h3>
    <label className="studio-v2-check"><input type="checkbox" checked={overlay.enabled} onChange={e=>patchOverlay('enabled',e.target.checked)}/> Enable gradient</label>
    <Field label="Gradient type"><select value={overlay.type} onChange={e=>patchOverlay('type',e.target.value)}><option value="linear">Linear</option><option value="radial">Radial</option></select></Field>
    {overlay.type==='linear'?<Range label="Angle" value={overlay.angle??90} min={0} max={360} suffix="°" onChange={v=>patchOverlay('angle',v)}/>:<>
      <Range label="Radial centre X" value={overlay.radialX??25} min={0} max={100} suffix="%" onChange={v=>patchOverlay('radialX',v)}/>
      <Range label="Radial centre Y" value={overlay.radialY??50} min={0} max={100} suffix="%" onChange={v=>patchOverlay('radialY',v)}/>
    </>}
    <div className="studio-v2-gradient-preview" style={{backgroundImage:gradientBackground(overlay)+'linear-gradient(130deg,#afcbe6,#315d8b)'}}/>

    <h3>Colour stops</h3>
    {(overlay.stops||[]).map((stop,i)=><div className="studio-v2-gradientstop" key={i}>
      <div className="studio-v2-stophead"><b>Stop {i+1}</b><button type="button" disabled={overlay.stops.length<=2} onClick={()=>patchOverlay('stops',overlay.stops.filter((_,j)=>j!==i))} title="Remove stop"><Trash2 size={14}/></button></div>
      <Color label="Colour" value={stop.color} onChange={v=>setStop(i,'color',v)}/>
      <Range label="Position" suffix="%" value={stop.position} min={0} max={100} onChange={v=>setStop(i,'position',v)}/>
      <Range label="Opacity" suffix="%" value={stop.opacity} min={0} max={100} onChange={v=>setStop(i,'opacity',v)}/>
    </div>)}
    <AccentButton secondary disabled={overlay.stops.length>=8} onClick={()=>patchOverlay('stops',[...overlay.stops,{color:'#ffffff',opacity:0,position:100}])}><Plus size={14}/> Add gradient stop</AccentButton>
    <AccentButton secondary onClick={()=>patch('hero.overlay',structuredClone(initialContent.hero.overlay))}><RotateCcw size={14}/> Restore original hero gradient</AccentButton>
  </>

  return <div className="studio-v2">
    <header className="studio-v2-top">
      <div className="studio-v2-brand"><span className="studio-v2-mark">O</span><div><b>OPTIMAX Studio</b><small>Visual Editor V2</small></div></div>
      <div className="studio-v2-headcenter"><span className="studio-v2-indicator"/><span className="studio-v2-desktop-only">{status}</span></div>
      <div className="studio-v2-toptools">
        <ToolButton icon={Undo2} title="Undo (Cmd/Ctrl+Z)" disabled={!timeline.past.length} onClick={undo}/>
        <ToolButton icon={Redo2} title="Redo (Cmd/Ctrl+Shift+Z)" disabled={!timeline.future.length} onClick={redo}/>
        <span className="studio-v2-divider-vertical"/>
        <ToolButton icon={Upload} title="Import JSON" onClick={()=>importRef.current?.click()}/>
        <ToolButton icon={Save} title="Save browser draft" onClick={saveDraft}/>
        <button className="studio-v2-publish" onClick={()=>setShowPublish(true)}><Download size={16}/> <span>Export for GitHub</span></button>
        <input hidden ref={importRef} type="file" accept=".json,application/json" onChange={e=>importJSON(e.target.files?.[0])}/>
      </div>
    </header>
    <div className="studio-v2-layout">
      <aside className={'studio-v2-sidebar '+(showSidebar?'studio-v2-open':'')}>
        <div className="studio-v2-sidehead"><div><b>Layers</b><small>Website structure</small></div><Layers size={18}/></div>
        <div className="studio-v2-search"><input placeholder="Search elements..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="studio-v2-layerlist">
          {data.sections.map((section,i)=>{
            const fields=editableFields(data,section.id).filter(item=>`${item.label} ${item.path}`.toLowerCase().includes(search.toLowerCase()))
            if(search&&!fields.length&&!section.label.toLowerCase().includes(search.toLowerCase()))return null
            const open=expanded.includes(section.id)||!!search
            return <div className="studio-v2-sectiongroup" key={section.id} draggable onDragStart={e=>{draggedSection.current=section.id;e.dataTransfer.effectAllowed='move'}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();reorder(draggedSection.current,section.id);draggedSection.current=null}}>
              <div className={'studio-v2-sectionhead '+(!section.visible?'studio-v2-hidden':'')}>
                <GripVertical size={14} className="studio-v2-grip"/><button type="button" className="studio-v2-sectiontitle" onClick={()=>toggleExpanded(section.id)}>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>} <span>{section.label}</span></button>
                <button title="Move up" disabled={!i} onClick={()=>shift(section.id,-1)}><ArrowUp size={13}/></button>
                <button title="Move down" disabled={i===data.sections.length-1} onClick={()=>shift(section.id,1)}><ArrowDown size={13}/></button>
                <button title={section.locked?'Unlock section':'Lock section'} onClick={()=>changeSection(section.id,{locked:!section.locked})}>{section.locked?<Lock size={14}/>:<LockOpen size={14}/>}</button>
                <button title={section.visible?'Hide section':'Show section'} onClick={()=>changeSection(section.id,{visible:!section.visible})}>{section.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button>
              </div>
              {open&&<div className="studio-v2-sectionfields">{fields.map(item=><button key={item.path} type="button" className={'studio-v2-layer '+(selection.path===item.path?'studio-v2-layer-selected':'')} onClick={()=>{select(item.path,item.kind);setShowSidebar(false)}}><span>{controlIcon(item.kind)}</span><span>{item.label}</span></button>)}
                {section.id==='treatments'&&<button className="studio-v2-add" onClick={()=>addCard('treatments')}><Plus size={13}/> Add treatment card</button>}
                {section.id==='solutions'&&<button className="studio-v2-add" onClick={()=>addCard('solutions.cards')}><Plus size={13}/> Add solution card</button>}
                {section.id==='news'&&<button className="studio-v2-add" onClick={()=>addCard('news.cards')}><Plus size={13}/> Add news card</button>}
              </div>}
            </div>
          })}
          <div className="studio-v2-buttons-group"><b>Global components</b>
            {[['branding.headerLogo','Header logo','logo'],['branding.footerLogo','Footer logo','logo'],['icons.headerSearch','Search icon','icon'],['icons.headerMenu','Mobile menu icon','icon'],['icons.buttonArrow','All button arrows','icon'],['icons.cardArrow','Card arrows','icon'],['icons.submitArrow','Submit arrow','icon'],['icons.social.facebook','Facebook icon','icon'],['icons.social.instagram','Instagram icon','icon'],['icons.social.youtube','YouTube icon','icon']].map(([path,label,kind])=><button key={path} className={'studio-v2-layer '+(selection.path===path?'studio-v2-layer-selected':'')} onClick={()=>select(path,kind)}>{controlIcon(kind)} {label}</button>)}
            {['headerBook','footerBook'].map(id=><button key={id} className={'studio-v2-layer '+(selection.path===`buttons.${id}`?'studio-v2-layer-selected':'')} onClick={()=>select(`buttons.${id}`,'button')}><MousePointer2 size={14}/> {id==='headerBook'?'Header button':'Footer button'}</button>)}
          </div>
        </div>
        <div className="studio-v2-sidefoot"><Info size={14}/> Drag sections to reorder. Lock to prevent accidental editing.</div>
      </aside>
      <main className="studio-v2-canvas">
        <div className="studio-v2-canvasbar">
          <div className="studio-v2-canvaslabel"><button className="studio-v2-sidebar-toggle" onClick={()=>setShowSidebar(v=>!v)} title="Toggle layers"><Layers size={18}/></button><b>Homepage</b><span>/</span><span>{isPreview?'Preview mode':'Design mode'}</span></div>
          <div className="studio-v2-switches">
            {[['desktop',Monitor,'Desktop'],['tablet',Tablet,'Tablet'],['mobile',Smartphone,'Mobile']].map(([id,Icon,title])=><button title={title} key={id} className={viewport===id?'active':''} onClick={()=>setViewport(id)}><Icon size={17}/><span>{title}</span></button>)}
          </div>
          <button className={'studio-v2-viewtoggle '+(isPreview?'active':'')} onClick={()=>setIsPreview(v=>!v)}><Eye size={17}/><span>{isPreview?'Editing':'Preview'}</span></button>
        </div>
        <div className="studio-v2-stage"><div className={'studio-v2-frame studio-v2-'+viewport} style={{width:viewport==='desktop'?1280:viewport==='tablet'?768:390}}><iframe key={isPreview?'plain':'editable'} ref={iframe} title="OPTIMAX website preview" src={`${location.pathname}${isPreview?'?siteview=1':'?preview=1'}`}/></div></div>
        <div className="studio-v2-canvasfoot"><MousePointer2 size={14}/> {isPreview?'Preview mode: links and forms behave normally.':'Click any editable element in the preview. Drag section headers in Layers to reorder.'}</div>
      </main>
      <aside className={'studio-v2-inspector '+(mobilePanel?'studio-v2-panelopen':'')}>
        <div className="studio-v2-inspecttabs"><button className={tab==='properties'?'active':''} onClick={()=>setTab('properties')}><Settings2 size={15}/> Properties</button><button className={tab==='media'?'active':''} onClick={()=>setTab('media')}><ImageIcon size={15}/> Media</button><button className={tab==='section'?'active':''} onClick={()=>setTab('section')}><LayoutGrid size={15}/> Section</button><button className={tab==='theme'?'active':''} onClick={()=>setTab('theme')}><Palette size={15}/> Theme</button></div>
        <div className="studio-v2-inspectscroll">
          {tab==='properties'&&<>
            <div className="studio-v2-paneltitle"><span>{controlIcon(selection.kind)}</span><div><b>{selection.kind==='image'?'Image':selection.kind==='logo'?'Logo':selection.kind==='icon'?'Icon':selection.kind==='gradient'?'Gradient':selection.kind==='button'?'Button':'Text'} properties</b><small>{selection.path}</small></div></div>
            {locked?<div className="studio-v2-warning"><Lock size={17}/> This section is locked. Unlock in Layers first.</div>:<>
              {selection.kind==='text'&&<>
                <Field label="Content"><textarea rows={selection.path.endsWith('body')||selection.path.endsWith('desc')?6:3} value={selectedValue??''} onChange={e=>patch(selection.path,e.target.value)}/></Field>
                <div className="studio-v2-separator"/><h3>Typography</h3>
                <Field label="Font family"><select value={elementMeta.fontFamily||''} onChange={e=>settingsUpdate('fontFamily',e.target.value)}><option value="">Use website font</option><option>Manrope</option><option>DM Sans</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option></select></Field>
                <div className="studio-v2-half"><Field label="Font size (px)"><input type="number" min="8" max="160" placeholder="Auto" value={elementMeta.fontSize??''} onChange={e=>settingsUpdate('fontSize',e.target.value===''?'':Math.max(8,Math.min(160,Number(e.target.value))))}/></Field><Field label="Weight"><select value={elementMeta.fontWeight||''} onChange={e=>settingsUpdate('fontWeight',e.target.value)}><option value="">Default</option>{[300,400,500,600,700,800].map(weight=><option key={weight} value={weight}>{weight}</option>)}</select></Field></div>
                <Field label="Alignment"><div className="studio-v2-segment">{['left','center','right'].map(t=><button key={t} className={(elementMeta.textAlign||'left')===t?'active':''} onClick={()=>settingsUpdate('textAlign',t)}>{t}</button>)}</div></Field>
                <Range label="Line height" min={0.8} max={2.5} step={0.05} suffix="×" value={Number(elementMeta.lineHeight)||1.3} onChange={v=>settingsUpdate('lineHeight',v)}/>
                <Range label="Letter spacing" min={-3} max={8} suffix="px" value={Number(elementMeta.letterSpacing)||0} onChange={v=>settingsUpdate('letterSpacing',v)}/>
                <Color label="Text color" value={elementMeta.color??data.theme.text} onChange={v=>settingsUpdate('color',v)}/>
                <AccentButton secondary onClick={resetSelectedStyle}><RotateCcw size={15}/> Reset typography</AccentButton>
              </>}
              {selection.kind==='image'&&<>
                <Field label="Image URL or public/images path"><input value={typeof selectedValue==='string'&&selectedValue.startsWith('data:')?'':selectedValue||''} onChange={e=>patch(selection.path,e.target.value)} placeholder="https://... or /images/photo.webp"/></Field>
                <div className="studio-v2-photo">{selectedValue&&<img src={selectedValue} alt="Selected image"/>}</div>
                <AccentButton onClick={()=>photoRef.current?.click()}><Upload size={16}/> Upload / Replace</AccentButton>
                <input hidden type="file" accept="image/png,image/jpeg,image/webp" ref={photoRef} onChange={e=>createLibrary(e.target.files,true)}/>
                <AccentButton secondary onClick={()=>setTab('media')}><ImageIcon size={16}/> Choose from Media Library</AccentButton>
                <div className="studio-v2-separator"/><h3>Crop and positioning</h3>
                <Range label="Horizontal position" value={imageMeta.positionX??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('positionX',v)}/>
                <Range label="Vertical position" value={imageMeta.positionY??50} min={0} max={100} suffix="%" onChange={v=>mediaUpdate('positionY',v)}/>
                <Field label="Image fit"><select value={imageMeta.fit||'cover'} onChange={e=>mediaUpdate('fit',e.target.value)}><option value="cover">Cover (fill area)</option><option value="contain">Contain (show all)</option></select></Field>
                {!['hero.image','appointment.image'].includes(selection.path)&&<Field label="Image height (px, blank = default)"><input type="number" min="80" max="800" placeholder="Default" value={imageMeta.height??''} onChange={e=>mediaUpdate('height',e.target.value?Math.max(80,Math.min(800,Number(e.target.value))):'')}/></Field>}
                <AccentButton secondary onClick={()=>{patch(selection.path,readPath(initialContent,selection.path)||'');resetSelectedMedia()}}><RotateCcw size={15}/> Restore original image</AccentButton>
                {selection.path==='hero.image'&&gradientControls()}
              </>}
              {selection.kind==='gradient'&&gradientControls()}
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
                <div className="studio-v2-separator"/><h3>Dimensions</h3>
                <Range label="Width" value={selectedValue?.width??data.theme.buttonWidth} min={0} max={420} step={5} onChange={v=>patch(selection.path+'.width',v||null)}/>
                <small className="studio-v2-hint">Set width to 0 for auto.</small>
                <Range label="Height" value={selectedValue?.height??data.theme.buttonHeight} min={30} max={100} onChange={v=>patch(selection.path+'.height',v)}/>
                <Range label="Corner radius" value={selectedValue?.radius??data.theme.buttonRadius} min={0} max={55} onChange={v=>patch(selection.path+'.radius',v)}/>
                <Range label="Font size" value={selectedValue?.fontSize??data.theme.buttonFontSize} min={10} max={28} onChange={v=>patch(selection.path+'.fontSize',v)}/>
                <Color label="Button background" value={selectedValue?.bg||(lightButton?'#ffffff':data.theme.primary)} onChange={v=>patch(selection.path+'.bg',v)}/>
                <Color label="Button text color" value={selectedValue?.color||(lightButton?data.theme.primary:'#ffffff')} onChange={v=>patch(selection.path+'.color',v)}/>
                <AccentButton secondary onClick={()=>patchMany([['buttons.'+selection.path.split('.').at(-1)+'.width',null],[selection.path+'.height',null],[selection.path+'.radius',null],[selection.path+'.fontSize',null],[selection.path+'.bg',''],[selection.path+'.color','']])}><RotateCcw size={15}/> Reset to global button style</AccentButton>
              </>}
              {cardRoot&&<><div className="studio-v2-separator"/><h3>Card actions</h3><div className="studio-v2-cardactions"><ToolButton icon={ArrowUp} title="Move card up" disabled={cardIndex===0} onClick={()=>cardOperation('up')}/><ToolButton icon={ArrowDown} title="Move card down" disabled={cardIndex===readPath(data,cardRoot).length-1} onClick={()=>cardOperation('down')}/><ToolButton icon={Copy} title="Duplicate card" onClick={()=>cardOperation('duplicate')}/><ToolButton icon={Trash2} title="Delete card" onClick={()=>cardOperation('delete')}/></div></>}
            </>}
          </>}
          {tab==='media'&&<><div className="studio-v2-paneltitle"><span><ImageIcon size={17}/></span><div><b>Media Library</b><small>{library.length} images · local draft</small></div></div><p className="studio-v2-muted">Upload photos, logos or icons, then select an image, logo or icon element in Layers. Your exported JSON includes these assets.</p>
            <AccentButton onClick={()=>assetUploadRef.current?.click()}><Plus size={15}/> Add images</AccentButton><input hidden type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" multiple ref={assetUploadRef} onChange={e=>createLibrary(e.target.files,false)}/>
            <div className="studio-v2-gallery">{library.map(item=><div className="studio-v2-asset" key={item.id}><img src={item.url} alt={item.name}/><div><small title={item.name}>{item.name}</small><button title="Remove from library" onClick={()=>removeAsset(item.id)}><Trash2 size={13}/></button></div><button disabled={!['image','logo','icon'].includes(selection.kind)||locked} onClick={()=>{patch(selection.path,item.url);setTab('properties')}}>Use this image</button></div>)}</div>
            {!library.length&&<div className="studio-v2-empty"><ImageIcon size={27}/><p>No uploaded media yet.</p></div>}
            <div className="studio-v2-warning"><Info size={15}/> Images are compressed and stored inside the export JSON. A lot of large photos will increase file size and browser storage usage.</div>
          </>}
          {tab==='section'&&<><div className="studio-v2-paneltitle"><span><LayoutGrid size={17}/></span><div><b>Section layout</b><small>{data.sections.find(v=>v.id===selectionSection)?.label||'Global element'}</small></div></div>
            {data.sections.some(s=>s.id===selectionSection)?<>
              <div className="studio-v2-sectioncontrols"><AccentButton secondary onClick={()=>changeSection(selectionSection,{visible:!data.sections.find(s=>s.id===selectionSection).visible})}>{data.sections.find(s=>s.id===selectionSection).visible?<EyeOff size={14}/>:<Eye size={14}/>} {data.sections.find(s=>s.id===selectionSection).visible?'Hide':'Show'} section</AccentButton><AccentButton secondary onClick={()=>changeSection(selectionSection,{locked:!locked})}>{locked?<LockOpen size={14}/>:<Lock size={14}/>} {locked?'Unlock':'Lock'} section</AccentButton></div>
              <div className="studio-v2-separator"/><h3>Spacing</h3>
              <Range label="Top padding" min={0} max={180} value={data.sectionStyles?.[selectionSection]?.paddingTop??data.theme.sectionPadding} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingTop`,v)}/>
              <Range label="Bottom padding" min={0} max={180} value={data.sectionStyles?.[selectionSection]?.paddingBottom??data.theme.sectionPadding} onChange={v=>patch(`sectionStyles.${selectionSection}.paddingBottom`,v)}/>
              <Color label="Section background" value={data.sectionStyles?.[selectionSection]?.background||'#ffffff'} onChange={v=>patch(`sectionStyles.${selectionSection}.background`,v)}/>
              <small className="studio-v2-hint">Background color is most visible on sections without a full background image. Section padding overrides the global desktop value.</small>
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
        <div className="studio-v2-inspectbottom"><span><Check size={13}/> Browser draft</span><button onClick={()=>setMobilePanel(false)}>Close</button></div>
      </aside>
    </div>
    <button type="button" className="studio-v2-mobileproperties" onClick={()=>{setMobilePanel(v=>!v);setShowSidebar(false)}}><Settings2 size={16}/> {mobilePanel?'Hide':'Edit properties'}</button>
    {showPublish&&<div className="studio-v2-overlay" onClick={()=>setShowPublish(false)}><div className="studio-v2-dialog" role="dialog" aria-modal="true" aria-label="Export website content" onClick={e=>e.stopPropagation()}><div className="studio-v2-dialogtop"><span><FileJson size={25}/></span><button onClick={()=>setShowPublish(false)} aria-label="Close dialog"><X size={20}/></button></div><h2>Publish changes to GitHub</h2><p>This editor saves a draft in your browser. GitHub Pages doesn't allow direct public uploads. Export your content and replace the JSON file in your repository.</p><ol><li>Download the updated <b>site-content.json</b>.</li><li>Open your GitHub repository at <code>public/</code>.</li><li>Upload the JSON file to the same folder, replacing the old file. Commit changes.</li><li>Wait until GitHub Actions shows a green check. Refresh the public website.</li></ol><AccentButton onClick={()=>{downloadJSON(data);notify('JSON downloaded. Commit it to GitHub to publish.')}}><Download size={17}/> Download site-content.json</AccentButton>{repo&&<a href={repo} target="_blank" rel="noreferrer" className="studio-v2-github">Open GitHub public folder <ExternalLink size={16}/></a>}<div className="studio-v2-warning"><Info size={15}/> Your preview is not password protected. No GitHub token is stored. Anyone with the editor URL can make local drafts, but only repository collaborators can publish.</div></div></div>}
  </div>
}
