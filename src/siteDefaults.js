export const initialContent = {
  hero: {
    eyebrow: 'TRUSTED SINCE 1995',
    title: 'See Life\nClearly.',
    body: 'Professional eye care for every stage of life.\nFrom advanced technology to experienced specialists,\nwe’re with you on your journey to a brighter tomorrow.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&q=85&fit=crop',
    overlay: {
      enabled: true, type: 'linear', angle: 90, radialX: 25, radialY: 50,
      stops: [
        {color:'#f8fcff',opacity:96,position:0},
        {color:'#f8fcff',opacity:84,position:31},
        {color:'#f8fcff',opacity:8,position:62}
      ]
    }
  },
  branding: {headerLogo:'',footerLogo:'',headerWidth:165,footerWidth:165},
  icons: {
    headerSearch:'Search', headerMenu:'Menu', buttonArrow:'ArrowRight', cardArrow:'ArrowRight', submitArrow:'ArrowRight',
    features:['ScanEye','Microscope','HeartHandshake','ShieldCheck'],
    benefits:['ScanEye','Users','HeartHandshake','Settings'],
    social:{facebook:'Facebook',instagram:'Instagram',youtube:'Youtube'}
  },
  features: [
    { title: 'Experienced Eye Specialists', detail: 'Guiding you at every stage' },
    { title: 'Advanced Technology', detail: 'For precise and safer solutions' },
    { title: 'Comprehensive Range of Care', detail: 'From prevention to treatment' },
    { title: 'Nationwide Locations', detail: 'Easier access to quality care' }
  ],
  treatmentSection: { eyebrow: 'OUR TREATMENTS', title: 'Complete Eye Care\nfor Every Stage of Life', body: 'From clearer vision to healthier eyes, we offer a comprehensive range of treatments backed by experience, technology and a team you can trust.' },
  treatments: [
    { title: 'Laser Vision Correction', desc: 'Freedom from glasses and contact lenses.', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=700&q=85&fit=crop' },
    { title: 'Cataract Surgery', desc: 'Clearer vision for a brighter tomorrow.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&q=85&fit=crop' },
    { title: 'Children’s Eye Care', desc: 'Supporting your child’s vision for a brighter future.', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=700&q=85&fit=crop' },
    { title: 'Eye Disease Management', desc: 'Early detection for healthier eyes.', image: 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=700&q=85&fit=crop' }
  ],
  about: { eyebrow: 'TRUSTED BY MALAYSIANS', title: 'for Over 20 Years', body: 'With over 31 years of expertise, we combine advanced technology with experienced specialists to provide eye care you can trust.', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1100&q=85&fit=crop' },
  solutions: {
    title: 'Solutions for Clearer Vision',
    cards: [
      { title: 'Laser Vision Correction', desc: 'Minimally invasive, and tailored for your lifestyle.', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&q=85&fit=crop' },
      { title: 'Cataract Surgery', desc: 'Restore clearer, sharper and brighter vision with advanced technology.', image: 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=700&q=85&fit=crop' },
      { title: 'Children’s Eye Care', desc: 'Early detection and personalised care for your child’s future.', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&q=85&fit=crop' }
    ]
  },
  appointment: { title: 'Book Your Eye Check Today', body: 'Take the first step towards clearer vision with a free eye check. Whether it’s for you or your loved ones, our team is here to provide personalised care and trusted advice.', image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&q=85&fit=crop' },
  news: {
    title: 'What’s New At Optimax',
    cards: [
      { title: 'Government & Corporate Initiatives', desc: 'Bringing quality eye care to Malaysians through nationwide programmes.', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=85&fit=crop' },
      { title: 'Advancements in Eye Care Technology', desc: 'Staying at the forefront of innovation for clearer, safer and better vision.', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&q=85&fit=crop' },
      { title: 'Patient Success Stories', desc: 'Real stories of brighter futures from our patients.', image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900&q=85&fit=crop' }
    ]
  },
  partners: {eyebrow:'TRUSTED BY MALAYSIANS', names:['SME CORP','PERKESO','KEMENTERIAN KESIHATAN MALAYSIA','HEALTHCARE PARTNERS','COMMUNITY PARTNERS']},
  enquiry: { eyebrow: 'GET IN TOUCH', title: 'Enquire With Us', body: 'Have questions or would like to make an appointment?\nFill in the form and our team will get back to you soon.' },
  buttons: {
    headerBook: { width: null, height: null, radius: null, fontSize: null, label: 'Book Free Eye Check', href: '#enquiry', bg:'', color:'' },
    heroBook: { width: null, height: null, radius: null, fontSize: null, label: 'Book Free Eye Check', href: '#enquiry', bg:'', color:'' },
    heroExplore: { width: null, height: null, radius: null, fontSize: null, label: 'Explore Treatments', href: '#treatments', bg:'', color:'' },
    treatmentView: { width: null, height: null, radius: null, fontSize: null, label: 'View All Treatments', href: '#solutions', bg:'', color:'' },
    solutionsView: { width: null, height: null, radius: null, fontSize: null, label: 'View All Treatments', href: '#treatments', bg:'', color:'' },
    appointmentBook: { width: null, height: null, radius: null, fontSize: null, label: 'Book Free Eye Check', href: '#enquiry', bg:'', color:'' },
    newsView: { width: null, height: null, radius: null, fontSize: null, label: 'View All', href: '#enquiry', bg:'', color:'' },
    footerBook: { width: null, height: null, radius: null, fontSize: null, label: 'Book Free Eye Check', href: '#enquiry', bg:'', color:'' }
  },
  theme: { primary: '#08294b', text: '#102b4e', background: '#ffffff', buttonHeight: 48, buttonWidth: 0, buttonRadius: 40, buttonFontSize: 12, sectionPadding: 70, mobileSectionPadding: 44, cardRadius: 12, headingFont: 'Manrope', bodyFont: 'DM Sans' },
  sections: [
    {id:'hero',label:'Hero',visible:true,locked:false},
    {id:'features',label:'Trust points',visible:true,locked:false},
    {id:'treatments',label:'Treatments',visible:true,locked:false},
    {id:'about',label:'About us',visible:true,locked:false},
    {id:'solutions',label:'Solutions',visible:true,locked:false},
    {id:'appointment',label:'Eye check CTA',visible:true,locked:false},
    {id:'partners',label:'Partners',visible:true,locked:false},
    {id:'news',label:'News',visible:true,locked:false},
    {id:'enquiry',label:'Enquiry',visible:true,locked:false}
  ],
  elementStyles: {},
  mediaSettings: {},
  sectionStyles: {},
  library: []
}

/** Preserve existing schema while allowing safely editable maps and variable-length card collections. */
export function deepMerge(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return structuredClone(base)
  const result = structuredClone(base)
  for (const key of Object.keys(saved)) {
    if (!Object.hasOwn(base,key) || key==='__proto__'||key==='constructor'||key==='prototype') continue
    const value=saved[key],template=base[key]
    if (key==='sections' && Array.isArray(value)) {
      const known=new Map(template.map(s=>[s.id,s]));const seen=new Set()
      const list=value.filter(v=>v && typeof v.id==='string' && known.has(v.id) && !seen.has(v.id) && seen.add(v.id)).map(v=>({ ...known.get(v.id), visible:v.visible!==false,locked:v.locked===true }))
      result[key]=[...list,...template.filter(s=>!seen.has(s.id))]
    } else if(key==='library' && Array.isArray(value)) {
      result[key]=value.filter(v=>v&&typeof v.id==='string'&&typeof v.url==='string'&&typeof v.name==='string').slice(0,80).map(v=>({id:v.id,name:v.name.slice(0,120),url:v.url}))
    } else if ((key==='elementStyles'||key==='mediaSettings'||key==='sectionStyles') && value && typeof value==='object' && !Array.isArray(value)) {
      const permitted=key==='elementStyles'?['fontSize','fontWeight','color','textAlign','lineHeight','letterSpacing','fontFamily']:key==='mediaSettings'?['positionX','positionY','fit','height']:['background','paddingTop','paddingBottom']
      const map=Object.create(null)
      for (const [path,attrs] of Object.entries(value)) {
        if (!/^[a-zA-Z0-9.]+$/.test(path)||!attrs||typeof attrs!=='object') continue
        map[path]={};for(const [attribute,raw] of Object.entries(attrs))if(permitted.includes(attribute)&& (typeof raw==='string'||typeof raw==='number'))map[path][attribute]=raw
      }
      result[key]=map
    } else if (Array.isArray(template) && Array.isArray(value)) {
      // Lists of editable cards may grow or shrink. Use the first default card as template.
      result[key]=value.slice(0,24).map((item,i)=>typeof template[0]==='object'?deepMerge(template[i]||template[0],item):item)
    } else if(template && typeof template==='object' && !Array.isArray(template)) result[key]=deepMerge(template,value)
    else if(template===null && (typeof value==='number'||value===null||typeof value==='string')) result[key]=value
    else if(typeof value===typeof template) result[key]=value
  }
  return result
}

const keyedMaps=['elementStyles','mediaSettings','sectionStyles']
export function readPath(obj,path) {
  const parts=String(path).split('.')
  if(keyedMaps.includes(parts[0])&&parts.length>2){
    const last=parts.at(-1),lookup=parts.slice(1,-1).join('.')
    if(obj?.[parts[0]]?.[lookup]&&Object.hasOwn(obj[parts[0]][lookup],last))return obj[parts[0]][lookup][last]
    return obj?.[parts[0]]?.[parts.slice(1).join('.')]
  }
  return parts.reduce((o,k)=>o?.[k],obj)
}
export function setPath(obj,path,value) {
  const next=structuredClone(obj),parts=String(path).split('.')
  if(!parts.every(k=>/^[a-zA-Z0-9_-]+$/.test(k))||parts.some(k=>['__proto__','constructor','prototype'].includes(k)))return next
  if(keyedMaps.includes(parts[0])&&parts.length>=3){
    const key=parts.slice(1,-1).join('.'),attribute=parts.at(-1)
    const allowed=parts[0]==='elementStyles'?['fontSize','fontWeight','color','textAlign','lineHeight','letterSpacing','fontFamily']:parts[0]==='mediaSettings'?['positionX','positionY','fit','height']:['background','paddingTop','paddingBottom']
    if(!allowed.includes(attribute))return next
    next[parts[0]]??={};next[parts[0]][key]??={};next[parts[0]][key][attribute]=value
    return next
  }
  let target=next
  for(let i=0;i<parts.length-1;i++){
    if(target[parts[i]]==null||typeof target[parts[i]]!=='object')target[parts[i]]={}
    target=target[parts[i]]
  }
  target[parts.at(-1)]=value
  return next
}
