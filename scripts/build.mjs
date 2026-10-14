import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const project = resolve(import.meta.dirname, '..');
const read = path => readFileSync(join(project,path),'utf8');
const groups = ['settings','hero','stats','treatments','why','doctors','awards','partners','reviews','journey','contact'];
const content = Object.fromEntries(groups.map(group => [group,JSON.parse(read(`content/${group}.json`))]));
const escapeHtml = text => String(text ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const validMedia = value => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https:\/\//i.test(raw)) return raw;
  const rel = raw.replace(/^\/+/, '');
  if (/^media\/[a-zA-Z0-9_./%\-]+$/.test(rel) && !rel.split('/').includes('..')) return rel;
  throw new Error(`Unsafe/unsupported media path: ${raw.slice(0,100)}`);
};
const escAttr = escapeHtml;
// Inline small uploaded logos so they render reliably on GitHub Pages subpaths
// and in the final self-contained IT handoff HTML. Keep source files in /media.
const logoSource = raw => {
  const path = validMedia(raw);
  if (!path.startsWith('media/')) return path;
  const extension = path.split('.').pop()?.toLowerCase();
  const mime = {svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[extension];
  if (!mime) return path;
  const file = join(project,path);
  if (!existsSync(file)) throw new Error(`Uploaded logo asset missing: ${path}`);
  const bytes = readFileSync(file);
  // Very large images stay as separate assets instead of bloating every HTML page.
  return bytes.length <= 2 * 1024 * 1024 ? `data:${mime};base64,${bytes.toString('base64')}` : path;
};
const cssImage = raw => {
  const value = validMedia(raw);
  const href = value.startsWith('media/') ? `../${value}` : value;
  return href.replaceAll('\\','%5C').replaceAll("'",'%27').replaceAll('"','%22').replaceAll('(','%28').replaceAll(')','%29');
};
const token = /__CMS_([A-Z]+)_([A-Z0-9_]+)__/g;
const fieldMap = JSON.parse(read('scripts/fields.json'));
const originalMedia = JSON.parse(read('scripts/original-media.json'));
function transform(template,isCss=false) {
  return template.replace(token, (match,groupUpper,keyUpper) => {
    const group=groupUpper.toLowerCase(), key=keyUpper.toLowerCase();
    const field = fieldMap[group]?.[key];
    if (!field || !Object.hasOwn(content[group]||{},key)) throw new Error(`Missing field definition: ${match}`);
    const value = field.type==='image' && !content[group][key] ? (originalMedia[`${group}.${key}`] || '') : content[group][key];
    if (field.type==='image'||field.type==='file') return isCss?cssImage(value):escAttr(validMedia(value));
    if (field.type==='string'||field.type==='text') return escapeHtml(value);
    throw new Error(`Unsupported CMS field ${group}.${key}`);
  });
}
let html = transform(read('templates/index.html'));
let css = transform(read('templates/style.css'),true);
// Put CMS-uploaded Hero image in the HTML element too, not only external CSS.
// This wins over a previously cached stylesheet and works under a GitHub Pages subpath.
const uploadedHero=validMedia(content.hero.image || '');
if(uploadedHero.startsWith('media/')){
  const mark='<div class="hero-photo" role="img"';
  if(!html.includes(mark)) throw new Error('Hero background element missing');
  html=html.replace(mark,`<div class="hero-photo" style="background-image:url('${uploadedHero}')" role="img"`);
}
// Responsive mobile Hero controls: CSS only below 650px; desktop stays untouched.
const mh=content.hero;
const bounded=(v,def,min,max)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):def;};
if(mh.mobile_use_default!==true){
  const x=bounded(mh.mobile_position_x,62,0,100),y=bounded(mh.mobile_position_y,43,0,100);
  const zoom=bounded(mh.mobile_zoom,100,100,180);
  const height=bounded(mh.mobile_height,0,0,700);
  const mobileImage=mh.mobile_image?validMedia(mh.mobile_image):'';
  if(mobileImage){
    // Validate uploads before publishing, including image paths under GitHub Pages.
    const mobileSrc=mobileImage.startsWith('media/')?mobileImage:mobileImage;
    const safeCss=mobileSrc.replaceAll('\\\\','%5C').replaceAll("'",'%27').replaceAll('"','%22').replaceAll('(','%28').replaceAll(')','%29');
    css+=`\n@media(max-width:650px){.hero .hero-photo{background-image:url('${mobileSrc.startsWith('media/')?'../':''}${safeCss}')!important}}\n`;
  }
  const configuredHeight=height===0?'clamp(230px,64vw,320px)':`${Math.max(180,height)}px`;
  // Background zoom uses CSS background-size. It does not resize the text/section.
  css+=`\n@media(max-width:650px){.hero{--mobile-hero-image-height:${configuredHeight}}.hero .hero-photo{background-position:${x}% ${y}% !important;${zoom===100?'':`background-size:${zoom}% auto;`}}}\n`;
}
// Optional logos: leave original brand wordmarks byte-for-byte unless user uploads a logo.
for (const [key,cls] of [['header_logo','logo'],['footer_logo','logo inverse']]) {
  if (!content.settings[key]) continue;
  const safe=escAttr(logoSource(content.settings[key]));
  const selector = key==='header_logo' ? /(<a class="logo"[^>]+>)<span>OPTIMAX<sup>®<\/sup><\/span><small>EYE SPECIALIST<\/small>/ : /(<a class="logo inverse"[^>]+>)<span>OPTIMAX<sup>®<\/sup><\/span><small>EYE SPECIALIST<\/small>/;
  if (!selector.test(html)) throw new Error(`Cannot locate original ${key}`);
  html=html.replace(selector,`$1<img class="brand-upload" width="165" height="54" alt="OPTIMAX Eye Specialist" src="${safe}" />`);
}
const logoSize=(value,fallback,min,max)=>{const n=Number(value);return value==null||String(value).trim()===''||!Number.isFinite(n)?fallback:Math.round(Math.min(max,Math.max(min,n)))};
if(content.settings.header_logo){
 const w=logoSize(content.settings.header_logo_width,165,60,300),h=logoSize(content.settings.header_logo_max_height,54,24,68),m=logoSize(content.settings.header_logo_mobile_width,165,50,190);
 css+=`\n.header .logo:has(.brand-upload){width:${w}px;min-width:${w}px;height:${h}px}.header .logo .brand-upload{display:block;width:100%;height:100%;object-fit:contain;object-position:left center}\n@media(max-width:650px){.header .logo:has(.brand-upload){width:${m}px;min-width:${m}px}}\n`;
}
if(content.settings.footer_logo){
 const w=logoSize(content.settings.footer_logo_width,165,60,300),h=logoSize(content.settings.footer_logo_max_height,54,24,90);
 css+=`\n.footer .logo:has(.brand-upload){width:${w}px;min-width:${w}px;height:${h}px}.footer .logo .brand-upload{display:block;width:100%;height:100%;object-fit:contain;object-position:left center}\n`;
}
if (content.hero.video) {
  const video=escAttr(validMedia(content.hero.video));
  const heroEnd=/<div class="hero-photo"[^>]*><\/div>/;
  if (!heroEnd.test(html)) throw new Error('Cannot locate hero image backdrop for optional video');
  html=html.replace(heroEnd,anchor=>`${anchor}\n    <video class="hero-video" src="${video}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`);
  css+='\n.hero .hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;pointer-events:none}@media (prefers-reduced-motion:reduce){.hero .hero-video{display:none}}\n';
}
if (token.test(html)||token.test(css)) throw new Error('Unexpanded CMS placeholder');
// Content-hashed CSS eliminates stale cached Hero images after CMS saves.
const cssName='style-'+createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';
const htmlForSite=html.replace('href="assets/style.css"',`href="assets/${cssName}"`);
if(htmlForSite===html) throw new Error('Cannot locate stylesheet link');
mkdirSync(join(project,'dist/assets'),{recursive:true});
writeFileSync(join(project,'dist/index.html'),htmlForSite);
writeFileSync(join(project,'dist/assets/style.css'),css);
writeFileSync(join(project,'dist/assets',cssName),css);
cpSync(join(project,'assets/site.js'),join(project,'dist/assets/site.js'));
if(existsSync(join(project,'media')))cpSync(join(project,'media'),join(project,'dist/media'),{recursive:true});
writeFileSync(join(project,'dist/.nojekyll'),'');
// Local preview convenience; root index/CSS are compiled samples, not data source.
writeFileSync(join(project,'index.html'),html);
writeFileSync(join(project,'assets/style.css'),css);
console.log('CMS content compiled into dist/.');
