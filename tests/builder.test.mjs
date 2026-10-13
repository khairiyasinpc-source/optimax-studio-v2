import assert from 'node:assert/strict'
import {initialContent,deepMerge,setPath,readPath} from '../src/siteDefaults.js'
import {newSection,validSlug,cleanPages,cleanBuilders,cleanGradients,siteHref,gradientPreset} from '../src/builder.js'
import {makeZip,kindFor,assetPath,resolveAsset} from '../src/mediaStore.js'
import {gradientBackground} from '../src/gradient.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const original=JSON.parse(fs.readFileSync(new URL('../public/site-content.json',import.meta.url),'utf8'))
const old=deepMerge(initialContent,original)
assert.equal(old.pages[0].id,'home')
assert.equal(old.hero.title,original.hero.title)
const sid='sectiontest123'
const section={...newSection('split',sid)}
assert.ok(section.blocks.some(x=>x.kind==='image'))
const updated={...old,builderBlocks:{[sid]:section},pages:[{id:'home',title:'Homepage',slug:'',sections:[]},{id:'pagetreatments',title:'Treatments',slug:'treatments',sections:[sid]}]}
const merged=deepMerge(initialContent,JSON.parse(JSON.stringify(updated)))
assert.equal(merged.pages[1].slug,'treatments')
assert.equal(merged.builderBlocks[sid].blocks.length,section.blocks.length)
assert.equal(validSlug('Eye Check & More!'),'eye-check-more')
assert.equal(siteHref('/treatments/','/Optimax/'),'/Optimax/treatments/')
assert.equal(siteHref('#enquiry','/Optimax/'),'#enquiry')
assert.equal(cleanPages([{id:'home',slug:''},{id:'pageA',title:'A',slug:'abc',sections:[]},{id:'pageB',title:'B',slug:'abc',sections:[]}]).length,2)
const g=gradientPreset();g.enabled=true;g.stops[0].opacity=70
const withGradient=setPath(merged,'gradients.elements.treatments.0.image',g)
assert.match(gradientBackground(readPath(withGradient,'gradients.elements.treatments.0.image')),/linear-gradient/)
const roundtrip=deepMerge(initialContent,JSON.parse(JSON.stringify(withGradient)))
assert.equal(readPath(roundtrip,'gradients.elements.treatments.0.image').stops[0].opacity,70)
assert.equal(kindFor('video.mp4'),'video')
assert.equal(kindFor('animation.gif'),'gif')
assert.match(assetPath('media1','Video.MP4'),/media\/media1.mp4$/)
assert.equal(resolveAsset('media/test.mp4',{'media/test.mp4':'blob:abc'},'/Optimax/'),'blob:abc')
assert.equal(resolveAsset('media/test.mp4',{},'/Optimax/'),'/Optimax/media/test.mp4')
const zip=await makeZip([{name:'site-content.json',data:new TextEncoder().encode('{"ok":true}')},{name:'media/demo.gif',data:new Uint8Array([71,73,70,56,57,97])}])
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'optimax-zip-'))
const file=path.join(tmp,'publish.zip');fs.writeFileSync(file,new Uint8Array(await zip.arrayBuffer()))
const listed=execFileSync('unzip',['-l',file],{encoding:'utf8'})
assert.match(listed,/site-content.json/)
assert.match(listed,/media\/demo.gif/)
assert.match(execFileSync('unzip',['-t',file],{encoding:'utf8'}),/No errors detected/)
fs.rmSync(tmp,{recursive:true,force:true})
console.log('PASS: page builder, clean imports, gradient any element, media routing, ZIP export integrity')
