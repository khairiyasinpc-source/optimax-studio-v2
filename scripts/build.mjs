import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

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
// Optional logos: leave original brand wordmarks byte-for-byte unless user uploads a logo.
for (const [key,cls] of [['header_logo','logo'],['footer_logo','logo inverse']]) {
  if (!content.settings[key]) continue;
  const safe=escAttr(logoSource(content.settings[key]));
  const selector = key==='header_logo' ? /(<a class="logo"[^>]+>)<span>OPTIMAX<sup>®<\/sup><\/span><small>EYE SPECIALIST<\/small>/ : /(<a class="logo inverse"[^>]+>)<span>OPTIMAX<sup>®<\/sup><\/span><small>EYE SPECIALIST<\/small>/;
  if (!selector.test(html)) throw new Error(`Cannot locate original ${key}`);
  html=html.replace(selector,`$1<img class="brand-upload" width="165" height="54" alt="OPTIMAX Eye Specialist" src="${safe}" />`);
}
if (content.settings.header_logo || content.settings.footer_logo) css += '\n.logo:has(.brand-upload){width:165px;min-width:165px;height:54px}.logo .brand-upload{display:block;width:165px;height:54px;max-width:100%;object-fit:contain}.footer .logo .brand-upload{height:54px}\n';
if (content.hero.video) {
  const video=escAttr(validMedia(content.hero.video));
  const anchor='<div class="hero-photo" role="img" aria-label="Editorial portrait representing a vision-care patient"></div>';
  if (!html.includes(anchor)) throw new Error('Cannot locate hero image backdrop for optional video');
  html=html.replace(anchor,`${anchor}\n    <video class="hero-video" src="${video}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`);
  css+='\n.hero .hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;pointer-events:none}@media (prefers-reduced-motion:reduce){.hero .hero-video{display:none}}\n';
}
if (token.test(html)||token.test(css)) throw new Error('Unexpanded CMS placeholder');
mkdirSync(join(project,'dist/assets'),{recursive:true});
writeFileSync(join(project,'dist/index.html'),html);
writeFileSync(join(project,'dist/assets/style.css'),css);
cpSync(join(project,'assets/site.js'),join(project,'dist/assets/site.js'));
if(existsSync(join(project,'media')))cpSync(join(project,'media'),join(project,'dist/media'),{recursive:true});
writeFileSync(join(project,'dist/.nojekyll'),'');
// Local preview convenience; root index/CSS are compiled samples, not data source.
writeFileSync(join(project,'index.html'),html);
writeFileSync(join(project,'assets/style.css'),css);
console.log('CMS content compiled into dist/.');
