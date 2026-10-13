import assert from 'node:assert/strict'
import {initialContent,deepMerge,readPath,setPath} from '../src/siteDefaults.js'

const saved={
  hero:{title:'V2 Title'},
  treatments:[...initialContent.treatments,{title:'New treatment',desc:'Test',image:'photo.png'}],
  sections:[{id:'news',visible:false,locked:true},{id:'hero',visible:true,locked:false}],
  elementStyles:{'hero.title':{fontSize:64,color:'#102030'}},
  mediaSettings:{'hero.image':{positionX:37,positionY:48,fit:'contain'}},
  library:[{id:'test',name:'test.webp',url:'data:image/webp;base64,AA'}]
}
const merged=deepMerge(initialContent,saved)
assert.equal(merged.hero.title,'V2 Title')
assert.equal(merged.hero.body,initialContent.hero.body)
assert.equal(merged.treatments.length,5)
assert.equal(merged.sections[0].id,'news')
assert.equal(merged.sections[0].visible,false)
assert.equal(merged.sections.length,9)
assert.equal(merged.elementStyles['hero.title'].fontSize,64)
assert.equal(merged.mediaSettings['hero.image'].positionX,37)
assert.equal(merged.library[0].name,'test.webp')
const patched=setPath(merged,'buttons.heroBook.width',255)
assert.equal(readPath(patched,'buttons.heroBook.width'),255)
assert.equal(readPath(merged,'buttons.heroBook.width'),null)
const roundTrip=deepMerge(initialContent,JSON.parse(JSON.stringify(patched)))
assert.equal(roundTrip.treatments.length,5)
assert.equal(roundTrip.elementStyles['hero.title'].fontSize,64)
assert.equal(roundTrip.buttons.heroBook.width,255)
const styled=setPath(merged,'elementStyles.hero.title.fontSize',78)
assert.equal(styled.elementStyles['hero.title'].fontSize,78)
const media=setPath(merged,'mediaSettings.hero.image.positionX',19)
assert.equal(media.mediaSettings['hero.image'].positionX,19)
assert.equal(readPath(media,'mediaSettings.hero.image.positionX'),19)
assert.equal(deepMerge(initialContent,JSON.parse(JSON.stringify(media))).mediaSettings['hero.image'].positionX,19)
assert.equal(({}).polluted,undefined)
const malicious=JSON.parse('{"__proto__":{"polluted":true},"hero":{"__proto__":{"polluted":true}}}')
deepMerge(initialContent,malicious)
assert.equal(({}).polluted,undefined)
console.log('PASS: data merge, custom styles, media, card counts, section order, edit paths, roundtrip, prototype guard')
