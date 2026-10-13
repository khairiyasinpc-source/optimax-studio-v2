import assert from 'node:assert/strict'
import {initialContent,deepMerge,setPath,readPath} from '../src/siteDefaults.js'
import {gradientBackground} from '../src/gradient.js'
import fs from 'node:fs'
const old=JSON.parse(fs.readFileSync(new URL('./legacy-content.json',import.meta.url),'utf8'))
const restored=deepMerge(initialContent,old)
assert.equal(restored.hero.overlay.enabled,true,'Old V2 sites get the same gradient')
assert.equal(restored.branding.headerLogo,'','Old V2 sites keep the text logo')
assert.equal(restored.icons.features[0],'ScanEye','Old V2 icons remain by default')
const setLogo=setPath(restored,'branding.headerLogo','data:image/webp;base64,dummy')
assert.equal(readPath(setLogo,'branding.headerLogo'),'data:image/webp;base64,dummy')
const setIcon=setPath(setLogo,'icons.features.1','Eye')
assert.equal(readPath(setIcon,'icons.features.1'),'Eye')
const noOverlay=setPath(setIcon,'hero.overlay.enabled',false)
assert.equal(gradientBackground(noOverlay.hero.overlay),'')
assert.match(gradientBackground(restored.hero.overlay),/linear-gradient\(90deg/)
const radial=setPath(restored,'hero.overlay.type','radial')
assert.match(gradientBackground(radial.hero.overlay),/radial-gradient/)
const extra=setPath(restored,'hero.overlay.stops',[...restored.hero.overlay.stops,{color:'#ff0000',opacity:50,position:100}])
assert.equal(deepMerge(initialContent,JSON.parse(JSON.stringify(extra))).hero.overlay.stops.length,4)
assert.equal(restored.hero.title,old.hero.title,'Content unchanged')
console.log('PASS: old draft compatibility, hero gradient, logo & icon data, JSON roundtrip')
