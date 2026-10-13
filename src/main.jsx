import React, { useContext, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, ArrowUpRight, Menu, X, Search, ShieldCheck, Microscope, HeartHandshake, ScanEye, Users, Settings, Instagram, Facebook, Youtube, CheckCircle2 } from 'lucide-react'
import { initialContent, deepMerge, readPath } from './siteDefaults'
import Editor from './Editor'
import {IconVisual} from './iconCatalog'
import {gradientBackground} from './gradient'
import './style.css'
import './editor.css'

const params = new URLSearchParams(location.search)
const preview = params.has('preview')
const previewMessaging=preview||params.has('siteview')
const edit = params.has('edit') && !preview
const rootUrl = import.meta.env.BASE_URL || './'
const jsonUrl = rootUrl + 'site-content.json'
const benefits = ['Advanced Technology','Experienced Specialists','Personalised Care','Comprehensive Solutions']
function EditableIcon({path,defaultName,size=24,strokeWidth=1.7}) {
  const d=useContext(DesignContext)
  const name=readPath(d,path)||defaultName
  return <span className={preview?'editable-content editable-icon':''} data-edit-path={preview?path:undefined} data-edit-kind={preview?'icon':undefined} aria-label={preview?`Edit icon ${path}`:undefined}>
    <IconVisual value={name} size={size} strokeWidth={strokeWidth}/>
  </span>
}

const DesignContext=React.createContext(initialContent)
function textStyle(content,path){const value=content.elementStyles?.[path]||{};const style={};for(const k of ['fontSize','fontWeight','color','textAlign','lineHeight','letterSpacing','fontFamily']){if(value[k]!==undefined && value[k]!==null && value[k]!=='')style[k]=(['fontSize','letterSpacing'].includes(k)&&typeof value[k]==='number')?value[k]+'px':value[k]}return style}
function Editable({as:Tag='span',path,children,className='',style={},...rest}){
  const d=useContext(DesignContext)
  return <Tag {...rest} data-edit-path={preview?path:undefined} className={(className||'')+(preview?' editable-content':'')} style={{...style,...textStyle(d,path)}}>{children}</Tag>
}
function Image({path,src,alt,...rest}){
  const d=useContext(DesignContext);const m=d.mediaSettings?.[path]||{}
  return <img {...rest} data-edit-path={preview?path:undefined} className={preview?'editable-content':''} style={{objectPosition:`${m.positionX??50}% ${m.positionY??50}%`,objectFit:m.fit||'cover',...(m.height?{height:m.height+'px'}:{})}} src={src} alt={alt} loading="lazy"/>
}
function Btn({d,id,light=false,outline=false}){
  const data=d.buttons[id],styles={}
  if(data.width!=null)styles.width=data.width+'px'
  if(data.height!=null)styles.height=data.height+'px'
  if(data.radius!=null)styles.borderRadius=data.radius+'px'
  if(data.fontSize!=null)styles.fontSize=data.fontSize+'px'
  if(data.bg)styles.backgroundColor=data.bg
  if(data.color)styles.color=data.color
  return <a data-edit-path={preview?`buttons.${id}`:undefined} data-edit-kind={preview?'button':undefined} href={data.href||'#enquiry'} style={styles} className={'btn '+(light?'light ':'')+(outline?'outline ':'')+(preview?'editable-content':'')}><span>{data.label}</span><EditableIcon path="icons.buttonArrow" defaultName="ArrowRight" size={16}/></a>
}
function Logo({inverse=false}) {
  const d=useContext(DesignContext),key=inverse?'footerLogo':'headerLogo',src=d.branding?.[key]
  const width=d.branding?.[inverse?'footerWidth':'headerWidth']||165
  return <a href="#top" data-edit-path={preview?`branding.${key}`:undefined} data-edit-kind={preview?'logo':undefined} className={'logo '+(inverse?'inverse':'')+(preview?' editable-content':'')} aria-label="OPTIMAX Home">
    {src?<img className="brand-logo-image" src={src} alt="OPTIMAX Eye Specialist" style={{width:`${width}px`,maxWidth:'100%',height:'auto',objectFit:'contain'}}/>:<><span>OPTIMAX<sup>®</sup></span><small>EYE SPECIALIST</small></>}
  </a>
}
function Header({d}) {
  const [open,setOpen] = useState(false), [search,setSearch] = useState(false)
  return <header className="header"><div className="header-inner"><Logo/>
    <nav className={open?'nav open':'nav'} aria-label="Main navigation">{[['Treatments','#treatments'],['Our Doctors','#about'],['Patient Care','#solutions'],['About Us','#about'],['Locations','#enquiry']].map(([t,href])=><a key={t} href={href} onClick={()=>setOpen(false)}>{t}</a>)}</nav>
    <div className="header-actions"><button className="icon-btn" aria-label="Search" onClick={()=>setSearch(!search)}><EditableIcon path="icons.headerSearch" defaultName="Search" size={19}/></button><Btn d={d} id="headerBook"/><button className="mobile-menu icon-btn" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<EditableIcon path="icons.headerMenu" defaultName="Menu" size={24}/>}</button></div>
  </div>{search && <div className="searchbar"><input autoFocus type="search" placeholder="Search treatments..." onChange={e=>{ const term = e.target.value.toLowerCase(); document.querySelectorAll('[data-search]').forEach(el=>el.style.opacity=(!term||el.dataset.search.includes(term))?'1':'.3') }}/><button onClick={()=>setSearch(false)}>Close</button></div>}</header>
}
function ArrowCircle(){return <span className="arrow-circle"><EditableIcon path="icons.cardArrow" defaultName="ArrowRight" size={15}/></span>}
function Site({d}) {
  const [sent,setSent]=useState(false),[captcha,setCaptcha]=useState(false)
  const sectionStyle=id=>{const index=d.sections?.findIndex(s=>s.id===id)??-1;const row=d.sections?.[index];const design=d.sectionStyles?.[id]||{};return {order:index<0?99:index,display:row?.visible===false?'none':undefined,...(design.background?{backgroundColor:design.background}:{}),...(design.paddingTop!==undefined?{paddingTop:design.paddingTop+'px'}:{}),...(design.paddingBottom!==undefined?{paddingBottom:design.paddingBottom+'px'}:{})}}
  const mediaPos=id=>{const m=d.mediaSettings?.[id]||{};return `${m.positionX??50}% ${m.positionY??45}%`}
  const mediaSize=id=>(d.mediaSettings?.[id]?.fit==='contain'?'cover, contain':'cover, cover')
  useEffect(() => {
    if (!preview) return
    const onClick = e => {
      const target = e.target.closest('[data-edit-path]')
      if (!target) return
      const section=target.closest('[data-section]')?.getAttribute('data-section')
      if(section&&d.sections?.find(s=>s.id===section)?.locked)return
      e.preventDefault(); e.stopPropagation()
      document.querySelectorAll('.edit-selected').forEach(el=>el.classList.remove('edit-selected'))
      target.classList.add('edit-selected')
      window.parent.postMessage({type:'OPTIMAX_SELECT',path:target.dataset.editPath,kind:target.dataset.editKind || (target.tagName.toLowerCase()==='img' || target.dataset.editPath.endsWith('.image') ? 'image':'text')},location.origin)
    }
    document.addEventListener('click',onClick,true)
    return ()=>document.removeEventListener('click',onClick,true)
  },[d.sections])
  useEffect(()=>{if(!preview)return;const onFocus=e=>{if(e.origin!==location.origin||e.data?.type!=='OPTIMAX_FOCUS')return;document.querySelectorAll('.edit-selected').forEach(el=>el.classList.remove('edit-selected'));const path=e.data.path;const node=[...document.querySelectorAll('[data-edit-path]')].find(el=>el.dataset.editPath===path);if(node){node.classList.add('edit-selected');node.scrollIntoView({behavior:'smooth',block:'center'})}};window.addEventListener('message',onFocus);return()=>window.removeEventListener('message',onFocus)},[])
  const submit=e=>{e.preventDefault(); if(!captcha){alert('Please tick the demo checkbox.');return}const data=new FormData(e.currentTarget); const body=encodeURIComponent([...data.entries()].map(([k,v])=>`${k}: ${v}`).join('\n')); window.location.href='mailto:?subject=OPTIMAX%20Eye%20Check%20Enquiry&body='+body;setSent(true)}
  const varStyle={'--primary':d.theme.primary,'--ink':d.theme.text,'--button-height':d.theme.buttonHeight+'px','--button-width':d.theme.buttonWidth?d.theme.buttonWidth+'px':'auto','--button-radius':d.theme.buttonRadius+'px','--button-font-size':d.theme.buttonFontSize+'px','--section-padding':d.theme.sectionPadding+'px','--card-radius':d.theme.cardRadius+'px','--mobile-section-padding':d.theme.mobileSectionPadding+'px','--body-font':`'${d.theme.bodyFont}',sans-serif`,'--heading-font':`'${d.theme.headingFont}',sans-serif`,'--site-background':d.theme.background}
  return <DesignContext.Provider value={d}><div className="public-site" style={varStyle}><Header d={d}/><main id="top" className="site-sections">
    <section className="hero" data-section="hero" data-edit-path={preview?'hero.image':undefined} style={{...sectionStyle('hero'),backgroundSize:mediaSize('hero.image'),backgroundPosition:mediaPos('hero.image'),backgroundImage:`${gradientBackground(d.hero.overlay)}url('${d.hero.image}')`}}><div className="container hero-content"><Editable as="div" className="eyebrow" path="hero.eyebrow">{d.hero.eyebrow}</Editable><Editable as="h1" path="hero.title">{d.hero.title}</Editable><Editable as="p" path="hero.body">{d.hero.body}</Editable><div className="hero-buttons"><Btn d={d} id="heroBook"/><Btn d={d} id="heroExplore" light/></div></div></section>
    <div className="featurebar" data-section="features" style={sectionStyle('features')}><div className="container features">{d.features.map((f,i)=>{return <div className="feature" key={i}><EditableIcon path={`icons.features.${i}`} defaultName="Eye" size={34} strokeWidth={1.4}/><div><Editable as="strong" path={`features.${i}.title`}>{f.title}</Editable><Editable as="small" path={`features.${i}.detail`}>{f.detail}</Editable></div></div>})}</div></div>
    <section id="treatments" className="section treatment-section" data-section="treatments" style={sectionStyle('treatments')}><div className="container treatment-layout"><div className="treatment-copy"><div className="section-intro"><Editable as="div" path="treatmentSection.eyebrow" className="eyebrow">{d.treatmentSection.eyebrow}</Editable><Editable as="h2" path="treatmentSection.title">{d.treatmentSection.title}</Editable><Editable as="p" path="treatmentSection.body">{d.treatmentSection.body}</Editable></div><Btn d={d} id="treatmentView" outline/></div><div className="treatment-grid">{d.treatments.map((t,i)=><a className="treatment-card" href="#enquiry" key={i} data-search={t.title.toLowerCase()}><Image src={t.image} alt={t.title} path={`treatments.${i}.image`}/><div className="treatment-card-body"><Editable as="h3" path={`treatments.${i}.title`}>{t.title}</Editable><Editable as="p" path={`treatments.${i}.desc`}>{t.desc}</Editable><ArrowCircle/></div></a>)}</div></div></section>
    <section id="about" className="about" data-section="about" style={sectionStyle('about')}><div className="about-photo"><Image src={d.about.image} alt="Eye care specialist" path="about.image"/></div><div className="about-copy"><Editable as="div" className="eyebrow" path="about.eyebrow">{d.about.eyebrow}</Editable><Editable as="h2" path="about.title">{d.about.title}</Editable><Editable as="p" path="about.body">{d.about.body}</Editable><div className="benefit-grid">{benefits.map((label,i)=><div className="benefit" key={label}><EditableIcon path={`icons.benefits.${i}`} defaultName="Eye" size={28} strokeWidth={1.5}/><span>{label}</span></div>)}</div></div></section>
    <section id="solutions" className="section solutions" data-section="solutions" style={sectionStyle('solutions')}><div className="container"><div className="section-head"><Editable as="h2" path="solutions.title">{d.solutions.title}</Editable><Btn d={d} id="solutionsView" outline/></div><div className="solution-grid">{d.solutions.cards.map((c,i)=><a className="solution-card" href="#enquiry" key={i}><Image src={c.image} alt={c.title} path={`solutions.cards.${i}.image`}/><div className="solution-body"><div><Editable as="h3" path={`solutions.cards.${i}.title`}>{c.title}</Editable><Editable as="p" path={`solutions.cards.${i}.desc`}>{c.desc}</Editable></div><ArrowCircle/></div></a>)}</div></div></section>
    <section className="appointment" data-section="appointment" data-edit-path={preview?'appointment.image':undefined} style={{...sectionStyle('appointment'),backgroundPosition:mediaPos('appointment.image'),backgroundImage:`linear-gradient(90deg,#052342 0%,#052342 36%,rgba(5,35,66,.74) 53%,rgba(5,35,66,0) 78%),url('${d.appointment.image}')`}}><div className="container appointment-content"><Editable as="h2" path="appointment.title">{d.appointment.title}</Editable><Editable as="p" path="appointment.body">{d.appointment.body}</Editable><Btn d={d} id="appointmentBook" light/></div></section>
    <section className="partners" data-section="partners" style={sectionStyle('partners')}><div className="container"><Editable as="div" className="eyebrow" path="partners.eyebrow">{d.partners.eyebrow}</Editable><div className="partner-list">{d.partners.names.map((name,i)=><Editable key={i} as="span" path={`partners.names.${i}`}>{name}</Editable>)}</div><p className="partner-note">Partner names above are text placeholders. Replace with approved official logos before launch.</p></div></section>
    <section id="news" className="section news" data-section="news" style={sectionStyle('news')}><div className="container"><div className="section-head"><Editable as="h2" path="news.title">{d.news.title}</Editable><Btn d={d} id="newsView" outline/></div><div className="news-grid">{d.news.cards.map((n,i)=><a className="news-card" href="#enquiry" key={i}><Image src={n.image} alt={n.title} path={`news.cards.${i}.image`}/><div className="news-body"><div><Editable as="h3" path={`news.cards.${i}.title`}>{n.title}</Editable><Editable as="p" path={`news.cards.${i}.desc`}>{n.desc}</Editable></div><ArrowCircle/></div></a>)}</div></div></section>
    <section id="enquiry" className="section enquiry" data-section="enquiry" style={sectionStyle('enquiry')}><div className="container enquiry-grid"><div><Editable as="div" className="eyebrow" path="enquiry.eyebrow">{d.enquiry.eyebrow}</Editable><Editable as="h2" path="enquiry.title">{d.enquiry.title}</Editable><Editable as="p" path="enquiry.body">{d.enquiry.body}</Editable></div><form onSubmit={submit} className="enquiry-form"><div className="fields"><label>Full Name <b>*</b><input name="Full Name" required placeholder="Your full name"/></label><label>Phone <b>*</b><input name="Phone" required type="tel" placeholder="+60"/></label><label>Email <b>*</b><input name="Email" required type="email" placeholder="you@example.com"/></label><label>Preferred Location <b>*</b><select name="Preferred Location" required defaultValue=""><option value="" disabled>Please Select</option><option>Kuala Lumpur</option><option>Petaling Jaya</option><option>Other / Please contact me</option></select></label><label>Country of Residence <b>*</b><input name="Country of Residence" defaultValue="Malaysia" required/></label><label>Best time to call <b>*</b><select name="Best time to call" required defaultValue=""><option value="" disabled>Please Select</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Reason for Enquiry <textarea name="Reason for Enquiry" placeholder="E.g. Laser Vision Correction" rows="3"/></label><label className="human"><input type="checkbox" checked={captcha} onChange={e=>setCaptcha(e.target.checked)}/> I'm not a robot (demo checkbox, not a security verification)</label><button className="btn submit" type="submit">SUBMIT ENQUIRY REQUEST <EditableIcon path="icons.submitArrow" defaultName="ArrowRight" size={16}/></button><small className="form-note">Demo form opens your email app. Connect a form service or backend to receive submissions automatically.</small>{sent&&<p className="success"><CheckCircle2 size={17}/> Your email app should open with the enquiry details.</p>}</form></div></section>
  </main><footer className="footer"><div className="container"><div className="footer-grid"><div><Logo inverse/><p>Trusted Since 1995</p></div><div><h4>Treatments</h4><a href="#treatments">Laser Vision Correction</a><a href="#treatments">Cataract Surgery</a><a href="#treatments">Eye Screening</a><a href="#treatments">Children’s Eye Care</a><a href="#treatments">All Treatments</a></div><div><h4>Our Doctors</h4><a href="#about">Meet Our Specialists</a><a href="#about">Our Approach</a><a href="#solutions">Technology</a><a href="#news">Patient Stories</a></div><div><h4>About Us</h4><a href="#about">Our Story</a><a href="#enquiry">Our Centres</a><a href="#news">News & Media</a></div><div><h4>Patient Info</h4><a href="#enquiry">Insurance & Panels</a><a href="#enquiry">FAQs</a><a href="#enquiry">Preparation Guide</a><a href="#enquiry">Aftercare</a><a href="#enquiry">Contact Us</a></div><div className="footer-last"><Btn d={d} id="footerBook" light/><div className="socials"><a aria-label="Facebook" href="https://www.facebook.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.facebook" defaultName="Facebook" size={16}/></a><a aria-label="Instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.instagram" defaultName="Instagram" size={16}/></a><a aria-label="YouTube" href="https://www.youtube.com/" target="_blank" rel="noreferrer"><EditableIcon path="icons.social.youtube" defaultName="Youtube" size={16}/></a></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} OPTIMAX Eye Specialist Centre. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Use</span></div></div></footer></div></DesignContext.Provider>
}

function Page() {
  const [data,setData] = useState(initialContent)
  const [loaded,setLoaded] = useState(false)
  useEffect(()=>{fetch(jsonUrl,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(saved=>{if(saved)setData(deepMerge(initialContent,saved))}).catch(()=>{}).finally(()=>setLoaded(true))},[])
  useEffect(()=>{if(!previewMessaging)return;const receive=e=>{if(e.origin!==location.origin)return;if(e.data?.type==='OPTIMAX_STATE')setData(deepMerge(initialContent,e.data.data))};window.addEventListener('message',receive);window.parent.postMessage({type:'OPTIMAX_READY'},location.origin);return()=>window.removeEventListener('message',receive)},[])
  if (edit) return <Editor published={data} loaded={loaded}/>
  return <Site d={data}/>
}

createRoot(document.getElementById('root')).render(<Page/>)
