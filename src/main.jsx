import TeamGate from './TeamGate.jsx'
import {teamMode} from './teamService.js'
import {elementCSS,useBreakpoint,responsiveValues,cssProps} from './responsive.js'
import React, { useContext, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, Menu, X, Search, ShieldCheck, Microscope, HeartHandshake, ScanEye, Users, Settings, Instagram, Facebook, Youtube, CheckCircle2 } from 'lucide-react'
import { initialContent, deepMerge, readPath } from './siteDefaults'
import Editor from './Editor'
import {IconVisual} from './iconCatalog'
import {gradientBackground} from './gradient'
import {siteHref,validSlug,pathSlug} from './builder'
import {resolveAsset} from './mediaStore'
import './style.css'
import './editor.css'

const params = new URLSearchParams(location.search)
const preview = params.has('preview')
const previewMessaging=preview||params.has('siteview')
const edit = params.has('edit') && !preview
const rootUrl = new URL(import.meta.env.BASE_URL || './',location.href).pathname
const baseUrl=new URL(rootUrl,location.href).pathname
const jsonUrl = rootUrl + 'site-content.json'
const routeSlug=()=>validSlug(new URLSearchParams(location.search).get('page')||pathSlug(location.pathname,rootUrl))
const toHref=(href,slug='')=>href?.startsWith('#')&&slug?baseUrl+href:siteHref(href,baseUrl)
const overlayCss=overlay=>gradientBackground(overlay).replace(/,$/,'')
const benefits = ['Advanced Technology','Experienced Specialists','Personalised Care','Comprehensive Solutions']
function GradientDefs({overlay,id}){
  if(!overlay?.enabled)return null
  const stops=(overlay.stops||[]).map((stop,i)=><stop key={i} offset={`${stop.position}%`} stopColor={stop.color} stopOpacity={(stop.opacity??100)/100}/>)
  if(overlay.type==='radial')return <defs><radialGradient id={id} cx={`${overlay.radialX??50}%`} cy={`${overlay.radialY??50}%`} r="80%">{stops}</radialGradient></defs>
  return <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${overlay.angle??90} .5 .5)`}>{stops}</linearGradient></defs>
}
function EditableIcon({path,defaultName,size=24,strokeWidth=1.7}) {
  const d=useContext(DesignContext),id=React.useId().replace(/:/g,'')
  const name=resolveAsset(readPath(d,path)||defaultName,d.previewAssets,rootUrl),gradient=readPath(d,`gradients.elements.${path}`)
  const active=gradient?.enabled&&Array.isArray(gradient.stops)&&gradient.stops.length
  return <span className={preview?'editable-content editable-icon':''} data-edit-path={preview?path:undefined} data-edit-kind={preview?'icon':undefined} style={elementCSS(d,path)} aria-label={preview?`Edit icon ${path}`:undefined}>
    <IconVisual value={name} size={size} strokeWidth={strokeWidth} stroke={active?`url(#${id})`:'currentColor'}>{active&&<GradientDefs overlay={gradient} id={id}/>}</IconVisual>
  </span>
}

const DesignContext=React.createContext(initialContent)
function textStyle(content,path){const value={...content.elementStyles?.[path],...responsiveValues(content,path,window.innerWidth<=760?'mobile':window.innerWidth<=1100?'tablet':'desktop')};const style={};for(const k of ['fontSize','fontWeight','color','textAlign','lineHeight','letterSpacing','fontFamily','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','background','borderRadius','borderColor','borderWidth','width','height','opacity']){if(value[k]!==undefined && value[k]!==null && value[k]!=='')style[k]=(['fontSize','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderRadius','borderWidth','width','height'].includes(k)&&typeof value[k]==='number')?value[k]+'px':k==='opacity'&&typeof value[k]==='number'?value[k]/100:value[k]}const gradient=overlayCss(readPath(content,`gradients.elements.${path}`));if(gradient){style.backgroundImage=gradient;style.backgroundClip='text';style.WebkitBackgroundClip='text';style.color='transparent';style.WebkitTextFillColor='transparent'}if(value.mobileFontSize)style['--v2-mobile-font-size']=`${value.mobileFontSize}px`;if(value.tabletFontSize)style['--v2-tablet-font-size']=`${value.tabletFontSize}px`;return style}
function Editable({as:Tag='span',path,children,className='',style={},...rest}){
  const d=useContext(DesignContext)
  return <Tag {...rest} data-edit-path={preview?path:undefined} className={(className||'')+(preview?' editable-content':'')+(d.elementStyles?.[path]?.mobileFontSize?' v2-mobile-font':'')+(d.elementStyles?.[path]?.tabletFontSize?' v2-tablet-font':'')} style={{...style,...textStyle(d,path)}} onDoubleClick={preview?(e=>{e.stopPropagation();e.currentTarget.contentEditable='true';e.currentTarget.focus()}):undefined} onBlur={preview?(e=>{if(e.currentTarget.contentEditable==='true'){e.currentTarget.contentEditable='false';window.parent.postMessage({type:'OPTIMAX_TEXT_CHANGE',path,value:e.currentTarget.innerText},location.origin)}}):undefined}>{children}</Tag>
}
function useMobile(){const [mobile,setMobile]=useState(()=>matchMedia('(max-width:760px)').matches);useEffect(()=>{const q=matchMedia('(max-width:760px)');const update=()=>setMobile(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[]);return mobile}
function SmartMedia({path,src,alt='',className='',background=false,...rest}){
  const d=useContext(DesignContext),m=d.mediaSettings?.[path]||{},mobile=useMobile()
  const picked=mobile&&m.mobileSrc?m.mobileSrc:src
  const url=resolveAsset(picked,d.previewAssets,rootUrl)
  const isVideo=/\.(mp4|webm)(?:[?#]|$)/i.test(picked||'')||String(url).startsWith('blob:')&&(d.mediaAssets||[]).some(a=>a.path===picked&&a.kind==='video')
  const gradient=overlayCss(readPath(d,`gradients.elements.${path}`));const [controls,setControls]=useState(false)
  const wrapperClass='v2-media-shell '+(background?'v2-media-background ':'')+className
  const wrapStyle=elementCSS(d,path)
  return <span {...rest} style={wrapStyle} className={wrapperClass} data-edit-path={preview?path:undefined} data-edit-kind={preview?'image':undefined}>
    {!picked&&preview&&<label className="v2-drop-placeholder" data-action="upload" data-media-path={path}><span>＋ Upload image / video</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.gif,.mp4,.webm" onChange={e=>{const file=e.target.files?.[0];if(file)window.parent.postMessage({type:'OPTIMAX_MEDIA_FILE',path,file},location.origin);e.currentTarget.value=''}}/></label>}
    {!picked?null:isVideo?<video className="v2-media-video" key={url} src={url} poster={resolveAsset(m.poster||'',d.previewAssets,rootUrl)||undefined} autoPlay muted loop={m.videoLoop!==false} playsInline preload="metadata" controls={controls} onClick={()=>m.showControls!==false&&setControls(true)} aria-label={alt||'OPTIMAX video'} style={{objectFit:m.fit||'cover',objectPosition:`${mobile?(m.mobilePositionX??m.positionX??50):(m.positionX??50)}% ${mobile?(m.mobilePositionY??m.positionY??50):(m.positionY??50)}%`}}/>:
    <img src={url} alt={alt} loading={background?'eager':'lazy'} style={{objectPosition:`${mobile?(m.mobilePositionX??m.positionX??50):(m.positionX??50)}% ${mobile?(m.mobilePositionY??m.positionY??50):(m.positionY??50)}%`,objectFit:m.fit||'cover',...(m.height?{height:m.height+'px'}:{})}}/>}
    {picked&&preview&&<label className="v2-media-quickreplace" data-action="upload" data-media-path={path}><span>Replace ↗</span><input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.gif,.mp4,.webm" onChange={e=>{const file=e.target.files?.[0];if(file)window.parent.postMessage({type:'OPTIMAX_MEDIA_FILE',path,file},location.origin);e.currentTarget.value=''}}/></label>}
    {gradient&&<span aria-hidden className="v2-media-shade" style={{backgroundImage:gradient}}/>}
  </span>
}
function Image({path,src,alt,...rest}){return <SmartMedia path={path} src={src} alt={alt} {...rest}/>}

function Btn({d,id,light=false,outline=false}){
  const data=d.buttons[id],styles={}
  if(data.width!=null)styles.width=data.width+'px'
  if(data.height!=null)styles.height=data.height+'px'
  if(data.radius!=null)styles.borderRadius=data.radius+'px'
  if(data.fontSize!=null)styles.fontSize=data.fontSize+'px'
  if(data.bg)styles.backgroundColor=data.bg
  if(data.color)styles.color=data.color
  Object.assign(styles,elementCSS(d,`buttons.${id}`))
  const overlay=overlayCss(readPath(d,`gradients.elements.buttons.${id}`));if(overlay)styles.backgroundImage=overlay
  return <a data-edit-path={preview?`buttons.${id}`:undefined} data-edit-kind={preview?'button':undefined} href={toHref(data.href||'#enquiry',routeSlug())} style={styles} className={'btn '+(light?'light ':'')+(outline?'outline ':'')+(preview?'editable-content':'')}><span>{data.label}</span><EditableIcon path="icons.buttonArrow" defaultName="ArrowRight" size={16}/></a>
}
function Logo({inverse=false}) {
  const d=useContext(DesignContext),key=inverse?'footerLogo':'headerLogo',src=d.branding?.[key]
  const width=d.branding?.[inverse?'footerWidth':'headerWidth']||165
  return <a style={elementCSS(d,`branding.${key}`)} href={baseUrl} data-edit-path={preview?`branding.${key}`:undefined} data-edit-kind={preview?'logo':undefined} className={'logo '+(inverse?'inverse':'')+(preview?' editable-content':'')} aria-label="OPTIMAX Home">
    {src?<img className="brand-logo-image" src={resolveAsset(src,d.previewAssets,rootUrl)} alt="OPTIMAX Eye Specialist" style={{width:`${width}px`,maxWidth:'100%',height:'auto',objectFit:'contain'}}/>:<><span>OPTIMAX<sup>®</sup></span><small>EYE SPECIALIST</small></>}
  </a>
}
function Header({d}) {
  const [open,setOpen] = useState(false), [search,setSearch] = useState(false)
  return <header className="header" style={{backgroundImage:overlayCss(readPath(d,"gradients.sections.header"))||undefined}}><div className="header-inner"><Logo/>
    <nav className={open?'nav open':'nav'} aria-label="Main navigation">{(d.navigation||[]).map((item,i)=><a key={i} href={toHref(item.href,typeof window!=='undefined'?routeSlug():'' )} onClick={()=>setOpen(false)}>{item.label}</a>)}</nav>
    <div className="header-actions"><button className="icon-btn" aria-label="Search" onClick={()=>setSearch(!search)}><EditableIcon path="icons.headerSearch" defaultName="Search" size={19}/></button><Btn d={d} id="headerBook"/><button className="mobile-menu icon-btn" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<EditableIcon path="icons.headerMenu" defaultName="Menu" size={24}/>}</button></div>
  </div>{search && <div className="searchbar"><input autoFocus type="search" placeholder="Search treatments..." onChange={e=>{ const term = e.target.value.toLowerCase(); document.querySelectorAll('[data-search]').forEach(el=>el.style.opacity=(!term||el.dataset.search.includes(term))?'1':'.3') }}/><button onClick={()=>setSearch(false)}>Close</button></div>}</header>
}
function ArrowCircle(){return <span className="arrow-circle"><EditableIcon path="icons.cardArrow" defaultName="ArrowRight" size={15}/></span>}
function Site({d,activePage='home'}) {
  const size=useBreakpoint()
  const [sent,setSent]=useState(false),[captcha,setCaptcha]=useState(false)
  const sectionStyle=id=>{const nativeIndex=d.sections?.findIndex(s=>s.id===id)??-1;const position=d.homepageOrder?.indexOf(id)??-1;const index=position>=0?position:nativeIndex;const row=d.sections?.[nativeIndex];const design=d.sectionStyles?.[id]||{};const g=overlayCss(readPath(d,`gradients.sections.${id}`));return {order:index<0?99:index,display:row?.visible===false?'none':undefined,...(design.background?{backgroundColor:design.background}:{}),...(design.paddingTop!==undefined?{paddingTop:design.paddingTop+'px'}:{}),...(design.paddingBottom!==undefined?{paddingBottom:design.paddingBottom+'px'}:{}),...(design.paddingLeft!==undefined?{paddingLeft:design.paddingLeft+'px'}:{}),...(design.paddingRight!==undefined?{paddingRight:design.paddingRight+'px'}:{}),...(g?{backgroundImage:g}:{}),...cssProps(responsiveValues(d,id,size))}}
  const mediaPos=id=>{const m=d.mediaSettings?.[id]||{};return `${m.positionX??50}% ${m.positionY??45}%`}
  const mediaSize=id=>(d.mediaSettings?.[id]?.fit==='contain'?'cover, contain':'cover, cover')
  const heroLayers=gradientBackground(readPath(d,'gradients.sections.hero'))+gradientBackground(readPath(d,'gradients.elements.hero.image')?.enabled?readPath(d,'gradients.elements.hero.image'):d.hero.overlay)
  const appointmentLayers=gradientBackground(readPath(d,'gradients.sections.appointment'))+gradientBackground(readPath(d,'gradients.elements.appointment.image'))
  const designRef=React.useRef(d);designRef.current=d
  useEffect(() => {
    if (!preview) return
    const onClick = e => {
      const d=designRef.current
      const target = e.target.closest('[data-edit-path]')
      if (!target) return
      const section=target.closest('[data-section]')?.getAttribute('data-section')
      if(section&&(d.sections?.find(s=>s.id===section)?.locked||d.builderBlocks?.[section]?.locked)){e.preventDefault();e.stopPropagation();return}
      if(e.target.closest('.v2-resize-corner')||e.target.isContentEditable)return
      const upload=e.target.closest('[data-action="upload"]')
      if(upload){window.parent.postMessage({type:'OPTIMAX_SELECT',path:upload.dataset.mediaPath,kind:'image'},location.origin);return}
      e.preventDefault()
      document.querySelectorAll('.edit-selected').forEach(el=>el.classList.remove('edit-selected'))
      target.classList.add('edit-selected')
      target.closest('[data-builder-block]')?.classList.add('edit-selected')
      window.parent.postMessage({type:'OPTIMAX_SELECT',path:target.dataset.editPath,kind:target.dataset.editKind || (target.tagName.toLowerCase()==='img' || target.dataset.editPath.endsWith('.image') ? 'image':'text')},location.origin)
    }
    document.addEventListener('click',onClick,true)
    return ()=>document.removeEventListener('click',onClick,true)
  },[])
  useEffect(()=>{if(!preview)return;const onFocus=e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='OPTIMAX_FOCUS')return;document.querySelectorAll('.edit-selected').forEach(el=>el.classList.remove('edit-selected'));const path=e.data.path;const node=[...document.querySelectorAll('[data-edit-path]')].find(el=>el.dataset.editPath===path);if(node){node.classList.add('edit-selected');node.scrollIntoView({behavior:'smooth',block:'center'})}};window.addEventListener('message',onFocus);return()=>window.removeEventListener('message',onFocus)},[])
  const submit=e=>{e.preventDefault();if(previewMessaging){alert('Preview only. Form has not been submitted.');return} if(!captcha){alert('Please tick the demo checkbox.');return}const data=new FormData(e.currentTarget); const body=encodeURIComponent([...data.entries()].map(([k,v])=>`${k}: ${v}`).join('\n')); window.location.href='mailto:?subject=OPTIMAX%20Eye%20Check%20Enquiry&body='+body;setSent(true)}
  const varStyle={'--primary':d.theme.primary,'--ink':d.theme.text,'--button-height':d.theme.buttonHeight+'px','--button-width':d.theme.buttonWidth?d.theme.buttonWidth+'px':'auto','--button-radius':d.theme.buttonRadius+'px','--button-font-size':d.theme.buttonFontSize+'px','--section-padding':d.theme.sectionPadding+'px','--card-radius':d.theme.cardRadius+'px','--mobile-section-padding':d.theme.mobileSectionPadding+'px','--body-font':`'${d.theme.bodyFont}',sans-serif`,'--heading-font':`'${d.theme.headingFont}',sans-serif`,'--site-background':d.theme.background}
  return <DesignContext.Provider value={d}><div className="public-site" style={varStyle}><Header d={d}/><main id="top" className="site-sections">{activePage==='home'&&<>
    <section className="hero" data-section="hero" data-edit-path={preview?'hero.image':undefined} style={{...sectionStyle('hero'),backgroundSize:mediaSize('hero.image'),backgroundPosition:mediaPos('hero.image'),backgroundImage:/\.(mp4|webm)$/i.test(d.hero.image)?'none':`${heroLayers}url('${resolveAsset(d.hero.image,d.previewAssets,rootUrl)}')`}}>{/\.(mp4|webm)$/i.test(d.hero.image)&&<><SmartMedia background path="hero.image" src={d.hero.image} alt="Hero video"/><span className="v2-hero-overlay" style={{backgroundImage:heroLayers.replace(/,$/,'')}}/></>}{! /\.(mp4|webm)$/i.test(d.hero.image)&&d.mediaSettings?.['hero.image']?.mobileSrc&&<><span className="v2-only-mobile-background"><SmartMedia background path="hero.image" src={d.hero.image} alt="Mobile hero media"/></span><span className="v2-hero-overlay v2-only-mobile-overlay" style={{backgroundImage:heroLayers.replace(/,$/,'')}}/></>}<div className="container hero-content"><Editable as="div" className="eyebrow" path="hero.eyebrow">{d.hero.eyebrow}</Editable><Editable as="h1" path="hero.title">{d.hero.title}</Editable><Editable as="p" path="hero.body">{d.hero.body}</Editable><div className="hero-buttons"><Btn d={d} id="heroBook"/><Btn d={d} id="heroExplore" light/></div></div></section>
    <div className="featurebar" data-section="features" style={sectionStyle('features')}><div className="container features">{d.features.map((f,i)=>{return <div className="feature" key={i}><EditableIcon path={`icons.features.${i}`} defaultName="Eye" size={34} strokeWidth={1.4}/><div><Editable as="strong" path={`features.${i}.title`}>{f.title}</Editable><Editable as="small" path={`features.${i}.detail`}>{f.detail}</Editable></div></div>})}</div></div>
    <section id="treatments" className="section treatment-section" data-section="treatments" style={sectionStyle('treatments')}><div className="container treatment-layout"><div className="treatment-copy"><div className="section-intro"><Editable as="div" path="treatmentSection.eyebrow" className="eyebrow">{d.treatmentSection.eyebrow}</Editable><Editable as="h2" path="treatmentSection.title">{d.treatmentSection.title}</Editable><Editable as="p" path="treatmentSection.body">{d.treatmentSection.body}</Editable></div><Btn d={d} id="treatmentView" outline/></div><div className="treatment-grid">{d.treatments.map((t,i)=><a className="treatment-card" href={toHref('#enquiry',routeSlug())} key={i} style={{backgroundImage:overlayCss(readPath(d,`gradients.elements.treatments.${i}`))||undefined}} data-search={t.title.toLowerCase()}><Image src={t.image} alt={t.title} path={`treatments.${i}.image`}/><div className="treatment-card-body"><Editable as="h3" path={`treatments.${i}.title`}>{t.title}</Editable><Editable as="p" path={`treatments.${i}.desc`}>{t.desc}</Editable><ArrowCircle/></div></a>)}</div></div></section>
    <section id="about" className="about" data-section="about" style={sectionStyle('about')}><div className="about-photo"><Image src={d.about.image} alt="Eye care specialist" path="about.image"/></div><div className="about-copy"><Editable as="div" className="eyebrow" path="about.eyebrow">{d.about.eyebrow}</Editable><Editable as="h2" path="about.title">{d.about.title}</Editable><Editable as="p" path="about.body">{d.about.body}</Editable><div className="benefit-grid">{benefits.map((label,i)=><div className="benefit" key={label}><EditableIcon path={`icons.benefits.${i}`} defaultName="Eye" size={28} strokeWidth={1.5}/><span>{label}</span></div>)}</div></div></section>
    <section id="solutions" className="section solutions" data-section="solutions" style={sectionStyle('solutions')}><div className="container"><div className="section-head"><Editable as="h2" path="solutions.title">{d.solutions.title}</Editable><Btn d={d} id="solutionsView" outline/></div><div className="solution-grid">{d.solutions.cards.map((c,i)=><a className="solution-card" href={toHref('#enquiry',routeSlug())} key={i} style={{backgroundImage:overlayCss(readPath(d,`gradients.elements.solutions.cards.${i}`))||undefined}}><Image src={c.image} alt={c.title} path={`solutions.cards.${i}.image`}/><div className="solution-body"><div><Editable as="h3" path={`solutions.cards.${i}.title`}>{c.title}</Editable><Editable as="p" path={`solutions.cards.${i}.desc`}>{c.desc}</Editable></div><ArrowCircle/></div></a>)}</div></div></section>
    <section className="appointment" data-section="appointment" data-edit-path={preview?'appointment.image':undefined} style={{...sectionStyle('appointment'),backgroundPosition:mediaPos('appointment.image'),backgroundImage:/\.(mp4|webm)$/i.test(d.appointment.image)?'none':`${appointmentLayers}linear-gradient(90deg,#052342 0%,#052342 36%,rgba(5,35,66,.74) 53%,rgba(5,35,66,0) 78%),url('${resolveAsset(d.appointment.image,d.previewAssets,rootUrl)}')`}}>{/\.(mp4|webm)$/i.test(d.appointment.image)&&<><SmartMedia background path="appointment.image" src={d.appointment.image} alt="Appointment background video"/><span className="v2-hero-overlay" style={{backgroundImage:appointmentLayers.replace(/,$/,'')||'linear-gradient(90deg,#052342 0%,rgba(5,35,66,.78) 48%,transparent 85%)'}}/></>}<div className="container appointment-content"><Editable as="h2" path="appointment.title">{d.appointment.title}</Editable><Editable as="p" path="appointment.body">{d.appointment.body}</Editable><Btn d={d} id="appointmentBook" light/></div></section>
    <section className="partners" data-section="partners" style={sectionStyle('partners')}><div className="container"><Editable as="div" className="eyebrow" path="partners.eyebrow">{d.partners.eyebrow}</Editable><div className="partner-list">{d.partners.names.map((name,i)=>(/^data:image\/|^media\/|^https?:.*\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(name)?<Image key={i} path={`partners.names.${i}`} src={name} alt={`Partner ${i+1}`}/>:<Editable key={i} as="span" path={`partners.names.${i}`}>{name}</Editable>))}</div><p className="partner-note">Partner names above are text placeholders. Replace with approved official logos before launch.</p></div></section>
    <section id="news" className="section news" data-section="news" style={sectionStyle('news')}><div className="container"><div className="section-head"><Editable as="h2" path="news.title">{d.news.title}</Editable><Btn d={d} id="newsView" outline/></div><div className="news-grid">{d.news.cards.map((n,i)=><a className="news-card" href={toHref('#enquiry',routeSlug())} key={i} style={{backgroundImage:overlayCss(readPath(d,`gradients.elements.news.cards.${i}`))||undefined}}><Image src={n.image} alt={n.title} path={`news.cards.${i}.image`}/><div className="news-body"><div><Editable as="h3" path={`news.cards.${i}.title`}>{n.title}</Editable><Editable as="p" path={`news.cards.${i}.desc`}>{n.desc}</Editable></div><ArrowCircle/></div></a>)}</div></div></section>
    <section id="enquiry" className="section enquiry" data-section="enquiry" style={sectionStyle('enquiry')}><div className="container enquiry-grid"><div><Editable as="div" className="eyebrow" path="enquiry.eyebrow">{d.enquiry.eyebrow}</Editable><Editable as="h2" path="enquiry.title">{d.enquiry.title}</Editable><Editable as="p" path="enquiry.body">{d.enquiry.body}</Editable></div><form onSubmit={submit} className="enquiry-form"><div className="fields"><label>Full Name <b>*</b><input name="Full Name" required placeholder="Your full name"/></label><label>Phone <b>*</b><input name="Phone" required type="tel" placeholder="+60"/></label><label>Email <b>*</b><input name="Email" required type="email" placeholder="you@example.com"/></label><label>Preferred Location <b>*</b><select name="Preferred Location" required defaultValue=""><option value="" disabled>Please Select</option><option>Kuala Lumpur</option><option>Petaling Jaya</option><option>Other / Please contact me</option></select></label><label>Country of Residence <b>*</b><input name="Country of Residence" defaultValue="Malaysia" required/></label><label>Best time to call <b>*</b><select name="Best time to call" required defaultValue=""><option value="" disabled>Please Select</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Reason for Enquiry <textarea name="Reason for Enquiry" placeholder="E.g. Laser Vision Correction" rows="3"/></label><label className="human"><input type="checkbox" checked={captcha} onChange={e=>setCaptcha(e.target.checked)}/> I'm not a robot (demo checkbox, not a security verification)</label><button className="btn submit" type="submit">SUBMIT ENQUIRY REQUEST <EditableIcon path="icons.submitArrow" defaultName="ArrowRight" size={16}/></button><small className="form-note">Demo form opens your email app. Connect a form service or backend to receive submissions automatically.</small>{sent&&<p className="success"><CheckCircle2 size={17}/> Your email app should open with the enquiry details.</p>}</form></div></section>
  </>}{<CustomSections d={d} activePage={activePage}/>}</main><footer className="footer" style={{backgroundImage:overlayCss(readPath(d,"gradients.sections.footer"))||undefined}}><div className="container"><div className="footer-grid"><div><Logo inverse/><p>Trusted Since 1995</p></div><div><h4>Treatments</h4><a href={toHref('#treatments',routeSlug())}>Laser Vision Correction</a><a href={toHref('#treatments',routeSlug())}>Cataract Surgery</a><a href={toHref('#treatments',routeSlug())}>Eye Screening</a><a href={toHref('#treatments',routeSlug())}>Children’s Eye Care</a><a href={toHref('#treatments',routeSlug())}>All Treatments</a></div><div><h4>Our Doctors</h4><a href={toHref('#about',routeSlug())}>Meet Our Specialists</a><a href={toHref('#about',routeSlug())}>Our Approach</a><a href={toHref('#solutions',routeSlug())}>Technology</a><a href={toHref('#news',routeSlug())}>Patient Stories</a></div><div><h4>About Us</h4><a href={toHref('#about',routeSlug())}>Our Story</a><a href={toHref('#enquiry',routeSlug())}>Our Centres</a><a href={toHref('#news',routeSlug())}>News & Media</a></div><div><h4>Patient Info</h4><a href={toHref('#enquiry',routeSlug())}>Insurance & Panels</a><a href={toHref('#enquiry',routeSlug())}>FAQs</a><a href={toHref('#enquiry',routeSlug())}>Preparation Guide</a><a href={toHref('#enquiry',routeSlug())}>Aftercare</a><a href={toHref('#enquiry',routeSlug())}>Contact Us</a></div><div className="footer-last"><Btn d={d} id="footerBook" light/><div className="socials"><a aria-label="Facebook" href="https://www.facebook.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.facebook" defaultName="Facebook" size={16}/></a><a aria-label="Instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.instagram" defaultName="Instagram" size={16}/></a><a aria-label="YouTube" href="https://www.youtube.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.youtube" defaultName="Youtube" size={16}/></a></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} OPTIMAX Eye Specialist Centre. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Use</span></div></div></footer></div></DesignContext.Provider>
}

// Converts safe, stored design properties into real browser layout.
export function blockCSS(s={}){
  const css={}
  for(const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','width','height','borderWidth','fontSize'])if(typeof s[k]==='number')css[k]=`${s[k]}px`
  if(typeof s.radius==='number')css.borderRadius=`${s.radius}px`
  if(typeof s.opacity==='number')css.opacity=s.opacity/100
  if(s.background)css.backgroundColor=s.background
  if(s.color)css.color=s.color
  if(s.borderColor)css.borderColor=s.borderColor
  if(s.borderWidth)css.borderStyle='solid'
  if(s.shadow)css.boxShadow='0 10px 32px rgba(8,41,75,.14)'
  if(s.textAlign)css.textAlign=s.textAlign
  if(s.alignSelf)css.alignSelf=s.alignSelf
  if(s.gridColumn)css.gridColumn=`span ${Math.max(1,Math.min(3,Number(s.gridColumn)||1))}`
  if(s.fontWeight)css.fontWeight=s.fontWeight
  return css
}
function BuilderBlock({part,sectionId,index,d}){
  useBreakpoint()
  const path=`builderBlocks.${sectionId}.blocks.${index}.value`,kind=part.kind,style=part.style||{}
  const [activeDrop,setActiveDrop]=useState(false)
  const dragResize=React.useRef(null)
  const beginResize=e=>{e.preventDefault();e.stopPropagation();const node=e.currentTarget.closest('.v2-builder-block');if(!node)return;const box=node.getBoundingClientRect();dragResize.current={node,startX:e.clientX,startY:e.clientY,width:box.width,height:box.height};e.currentTarget.setPointerCapture(e.pointerId)}
  const resizing=e=>{if(!dragResize.current)return;const {node,startX,startY,width,height}=dragResize.current;node.style.width=Math.round(Math.max(65,Math.min(1600,width+e.clientX-startX)))+'px';node.style.height=Math.round(Math.max(28,Math.min(1600,height+e.clientY-startY)))+'px'}
  const endResize=e=>{if(!dragResize.current)return;e.stopPropagation();const {node}=dragResize.current;dragResize.current=null;window.parent.postMessage({type:'OPTIMAX_RESIZE_BLOCK',path,width:Math.round(node.getBoundingClientRect().width),height:Math.round(node.getBoundingClientRect().height)},location.origin)}
  const makeMove=(e)=>{e.preventDefault();e.stopPropagation();const from=e.dataTransfer.getData('application/x-optimax-move'),newKind=(e.dataTransfer.getData('application/x-optimax-kind')||e.dataTransfer.getData('text/plain').replace(/^optimax-kind:/,''));if(!from&&!newKind)return
    const rect=e.currentTarget.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2||(Math.abs(e.clientY-rect.top-rect.height/2)<rect.height/3&&e.clientX>rect.left+rect.width/2)
    if(from){const [oldId,oldIndex]=from.split(':');window.parent.postMessage({type:'OPTIMAX_MOVE_BLOCK',sectionId,fromSection:oldId,from:Number(oldIndex),to:index,after},location.origin)}
    else if(newKind)window.parent.postMessage({type:'OPTIMAX_ADD_BLOCK',sectionId,kind:newKind,index:index+(after?1:0)},location.origin)
    setActiveDrop(false)
  }
  const moveStart=e=>{e.dataTransfer.setData('application/x-optimax-move',`${sectionId}:${index}`);e.dataTransfer.effectAllowed='move'}
  let content
  if(kind==='image'||kind==='video')content=<div className="v2-builder-image"><SmartMedia path={path} src={part.value} alt={part.label}/></div>
  else if(kind==='button')content=<a className="btn" style={{width:part.value.width??undefined,height:part.value.height??undefined,fontSize:part.value.fontSize??undefined,backgroundColor:part.value.bg||style.background||undefined,color:part.value.color||style.color||undefined,...elementCSS(d,path),backgroundImage:overlayCss(readPath(d,`gradients.elements.${path}`))||undefined,borderRadius:part.value.radius??style.radius??undefined}} data-edit-path={preview?path:undefined} data-edit-kind="button" href={toHref(part.value.href||'#enquiry',routeSlug())}>{part.value.label||'Learn More'} <IconVisual value={d.icons.buttonArrow} size={16}/></a>
  else if(kind==='icon')content=<EditableIcon path={path} defaultName="Eye" size={42}/>
  else if(kind==='spacer')content=<div className="v2-builder-spacer" aria-label="Spacing block"/>
  else content=<Editable as={part.label==='Heading'?'h2':'p'} style={{color:style.color||undefined,fontSize:style.fontSize?style.fontSize+'px':undefined,fontWeight:style.fontWeight||undefined,textAlign:style.textAlign||undefined}} path={path}>{part.value}</Editable>
  return <div data-builder-block={part.id} data-edit-path={preview?path:undefined} data-edit-kind={preview?kind==='video'?'image':kind:undefined} className={'v2-builder-block'+(activeDrop?' v2-drop-active':'')} style={{...blockCSS(style),...elementCSS(d,path),backgroundImage:kind==='text'||kind==='icon'||kind==='image'||kind==='video'?undefined:overlayCss(readPath(d,`gradients.elements.${path}`))||undefined}} draggable={preview&&!d.builderBlocks[sectionId].locked} onDragStart={preview?moveStart:undefined} onDragOver={preview&&!d.builderBlocks[sectionId].locked?(e=>{e.preventDefault();e.stopPropagation();setActiveDrop(true)}):undefined} onDragLeave={preview?(()=>setActiveDrop(false)):undefined} onDrop={preview&&!d.builderBlocks[sectionId].locked?makeMove:undefined} >{content}{preview&&!d.builderBlocks[sectionId].locked&&<span className="v2-resize-corner" title="Drag to resize" onPointerDown={beginResize} onPointerMove={resizing} onPointerUp={endResize} onPointerCancel={()=>{dragResize.current=null}} aria-label="Drag to resize element">◢</span>}</div>
}
function CustomSections({d,activePage}){
  const size=useBreakpoint()
  const page=d.pages?.find(p=>p.id===activePage)||d.pages?.[0]
  return (page?.sections||[]).map((id,index)=>{
    const block=d.builderBlocks?.[id];if(!block||block.visible===false)return null
    const design={...d.sectionStyles?.[id],...(size==='mobile'?{columns:1}:{}),...responsiveValues(d,id,size)},gradient=overlayCss(readPath(d,`gradients.sections.${id}`))
    const all=(block.blocks||[]).map((part,i)=><BuilderBlock key={part.id} part={part} sectionId={id} index={i} d={d}/>)
    const takeDrop=e=>{e.preventDefault();const kind=(e.dataTransfer.getData('application/x-optimax-kind')||e.dataTransfer.getData('text/plain').replace(/^optimax-kind:/,'')),from=e.dataTransfer.getData('application/x-optimax-move');if(kind)window.parent.postMessage({type:'OPTIMAX_ADD_BLOCK',sectionId:id,kind,index:block.blocks.length},location.origin);else if(from){const [oldId,oldIndex]=from.split(':');window.parent.postMessage({type:'OPTIMAX_MOVE_BLOCK',sectionId:id,fromSection:oldId,from:Number(oldIndex),to:block.blocks.length,after:false},location.origin)}}
    const columns=Math.max(1,Math.min(3,Number(design.columns)||1))
    return <section key={id} data-section={id} className={`v2-builder-section v2-builder-${block.type} v2-builder-custom-layout`} style={{order:activePage==='home'?(d.homepageOrder?.includes(id)?d.homepageOrder.indexOf(id):100+index):index,backgroundColor:design.background||undefined,backgroundImage:gradient||undefined,paddingTop:design.paddingTop??undefined,paddingBottom:design.paddingBottom??undefined,paddingLeft:design.paddingLeft??undefined,paddingRight:design.paddingRight??undefined,display:design.display}}>
      <div className="container v2-builder-content v2-editable-layout" style={{display:'grid',gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`,gap:`${design.gap??20}px`,alignItems:design.alignItems||'start'}} onDragOver={preview&&!block.locked?(e=>e.preventDefault()):undefined} onDrop={preview&&!block.locked?takeDrop:undefined}>
        {all.length?all:<div className="v2-builder-blank" data-edit-path={preview?`builderBlocks.${id}.label`:undefined} data-edit-kind="text">{preview?'Drag elements here or click + Add Element':' '}</div>}
      </div>
    </section>
  })
}

function Page() {
  const [data,setData] = useState(initialContent)
  const [loaded,setLoaded] = useState(false)
  const [slug,setSlug]=useState(routeSlug())
  useEffect(()=>{if(previewMessaging&&window.parent!==window){setLoaded(true);return}const controller=new AbortController();fetch(jsonUrl,{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(saved=>{if(saved)setData(deepMerge(initialContent,saved))}).catch(()=>{}).finally(()=>setLoaded(true));return()=>controller.abort()},[])
  useEffect(()=>{if(!previewMessaging)return;const receive=e=>{if(e.origin!==location.origin||e.source!==window.parent)return;if(e.data?.type==='OPTIMAX_STATE')setData(deepMerge(initialContent,e.data.data))};window.addEventListener('message',receive);window.parent.postMessage({type:'OPTIMAX_READY'},location.origin);return()=>window.removeEventListener('message',receive)},[])
  useEffect(()=>{const update=()=>setSlug(routeSlug());window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update)},[])
  useEffect(()=>{if(!previewMessaging)return;const click=e=>{if(preview||e.defaultPrevented){if(preview&&e.target.closest('a[href]'))e.preventDefault();return}const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||!url.pathname.startsWith(baseUrl))return;const next=pathSlug(url.pathname,rootUrl);if(!data.pages.some(p=>p.slug===next))return;e.preventDefault();history.pushState(null,'',`${location.pathname}?${preview?'preview':'siteview'}=1&page=${next}${url.hash}`);setSlug(next);if(url.hash)setTimeout(()=>document.getElementById(url.hash.slice(1))?.scrollIntoView(),0);else window.scrollTo(0,0)};document.addEventListener('click',click);return()=>document.removeEventListener('click',click)},[data.pages])
  const currentPage=data.pages?.find(p=>p.slug===slug)||data.pages?.[0]
  if(edit&&import.meta.env.VITE_STUDIO_URL&&!teamMode){location.replace(import.meta.env.VITE_STUDIO_URL+'/?edit=1');return <p>Opening designer sign in…</p>}
  if(edit&&teamMode)return <TeamGate published={data} loaded={loaded}/>
  if (edit) return <Editor published={data} loaded={loaded}/>
  return <Site d={data} activePage={currentPage?.id||'home'}/>
}

createRoot(document.getElementById('root')).render(<Page/>)
