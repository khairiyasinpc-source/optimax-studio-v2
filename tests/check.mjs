import assert from 'node:assert/strict';
import { readFileSync, cpSync, mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const cwd=process.cwd();
const read = file => readFileSync(join(cwd,file),'utf8');
const html=read('dist/index.html'),css=read('dist/assets/style.css'),js=read('dist/assets/site.js');
const config=read('.pages.yml');
assert(html.startsWith('<!DOCTYPE html>'));
assert(!html.includes('__CMS_'),'All homepage fields must compile');
assert(!css.includes('__CMS_'),'All image fields must compile');
assert(html.includes('Trusted in<br>Vision Correction<br><span>Since 1995.</span>'));
for (const id of ['main-nav','treatments','why-optimax','doctors','awards','reviews','contact'])assert(html.includes(`id="${id}"`),`Missing section ${id}`);
for (const forbidden of ['src/Editor.jsx','Save Draft','Add Section','contentEditable'])assert(!html.includes(forbidden),`Old editor residue ${forbidden}`);
for (const x of ['hero','treatments','why','doctors','contact'])assert(config.includes(`name: ${x}`),'Pages CMS config missing '+x);
assert(css.includes('.hero-gradient'));
assert(js.includes('setOpen(false)'));
assert(existsSync('dist/.nojekyll'));
// The logo uploaded via Pages CMS must be embedded in the deployed HTML,
// avoiding broken /media links when the site lives under /optimax-studio-v2/.
const configuredLogo=JSON.parse(read('content/settings.json')).header_logo || '';
if (configuredLogo.startsWith('/media/') && ['svg','png','jpg','jpeg','webp','gif'].includes(configuredLogo.split('.').pop().toLowerCase())) {
  const actualFile=join(cwd,configuredLogo.slice(1));
  if(existsSync(actualFile) && readFileSync(actualFile).length <= 2*1024*1024) {
    const match=html.match(/class="brand-upload"[^>]*src="data:[^;"]+;base64,([^"]+)"/);
    assert(match, 'The CMS header logo must be embedded in the published homepage');
    assert.deepEqual(Buffer.from(match[1], 'base64'),readFileSync(actualFile), 'Published header logo bytes must match uploaded media');
  }
}
// Verify changing CMS fields edits output and respects uploaded media in project subpaths.
const temp=mkdtempSync(join(tmpdir(),'optimax-cms-test-'));
try {
 for(const name of ['content','assets','templates','scripts'])cpSync(join(cwd,name),join(temp,name),{recursive:true});
 if(existsSync(join(cwd,'media')))cpSync(join(cwd,'media'),join(temp,'media'),{recursive:true});
 else mkdirSync(join(temp,'media'),{recursive:true});
 const p=join(temp,'content/hero.json');const hero=JSON.parse(readFileSync(p,'utf8'));
 hero.description='CMS UPDATE TEST: <script>alert("XSS")</script>';
 hero.image='/media/new-hero.webp';
 writeFileSync(p,JSON.stringify(hero));
 const run=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.equal(run.status,0,`Build test failed: ${run.stderr}`);
 const changed=readFileSync(join(temp,'dist/index.html'),'utf8');
 const changedCss=readFileSync(join(temp,'dist/assets/style.css'),'utf8');
 assert(changed.includes('CMS UPDATE TEST: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'));
 assert(!changed.includes('<script>alert("XSS")</script>'));
 assert(changedCss.includes("url('../media/new-hero.webp')"),'CMS media path not resolved correctly');
 assert(changedCss.includes('.hero-gradient'),'The original hero overlay must remain');
 // Optional video allowed, loaded in-place only if uploaded.
 hero.video='/media/test-video.mp4';writeFileSync(p,JSON.stringify(hero));
 const testVideo=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.equal(testVideo.status,0,testVideo.stderr);
 assert(readFileSync(join(temp,'dist/index.html'),'utf8').includes('autoplay muted loop playsinline'));
 // Mobile framing: custom mobile image, crop and height must modify mobile CSS only.
 hero.video=''; hero.mobile_image='/media/new-hero.webp'; hero.mobile_position_x=18; hero.mobile_position_y=81; hero.mobile_zoom=135; hero.mobile_height=420; hero.mobile_use_default=false;
 writeFileSync(p,JSON.stringify(hero));
 const mobileRun=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.equal(mobileRun.status,0,mobileRun.stderr);
 const mobileCss=readFileSync(join(temp,'dist/assets/style.css'),'utf8');
 assert(mobileCss.includes("background-image:url('../media/new-hero.webp')!important"));
 assert(mobileCss.includes('background-position:18% 81% !important'));
 assert(mobileCss.includes('background-size:135% auto'));
 assert(mobileCss.includes('--mobile-hero-image-height:420px'));
 assert(mobileCss.indexOf('@media(max-width:650px){.hero .hero-photo{background-image:')>=0);
 // Reset must ignore all mobile custom fields and restore original behavior.
 hero.mobile_use_default=true;writeFileSync(p,JSON.stringify(hero));
 const resetRun=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.equal(resetRun.status,0,resetRun.stderr);
 const resetCss=readFileSync(join(temp,'dist/assets/style.css'),'utf8');
 assert(!resetCss.includes('background-position:18% 81% !important'));
 assert(!resetCss.includes('background-size:135% auto'));
 assert(!resetCss.includes("background-image:url('../media/new-hero.webp')!important"));
 // Invalid custom image path must not compile.
 hero.mobile_use_default=false;hero.mobile_image='javascript:alert(1)';writeFileSync(p,JSON.stringify(hero));
 const badMobile=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.notEqual(badMobile.status,0,'Reject unsafe mobile image path');
 hero.mobile_image=''; hero.mobile_use_default=true;
 writeFileSync(p,JSON.stringify(hero));
 // Reject unsafe file paths.
 hero.video='javascript:alert(1)';writeFileSync(p,JSON.stringify(hero));
 const bad=spawnSync(process.execPath,[join(temp,'scripts/build.mjs')],{encoding:'utf8'});
 assert.notEqual(bad.status,0,'Reject invalid/untrusted media URLs');
} finally {rmSync(temp,{recursive:true,force:true});}
console.log('PASS: CMS structured content, original layout, no editor, media paths, text escaping, hero video & path protection.');
