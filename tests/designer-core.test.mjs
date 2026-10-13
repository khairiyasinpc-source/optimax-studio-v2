import assert from 'node:assert/strict'
import { initialContent, deepMerge, readPath, setPath } from '../src/siteDefaults.js'
import { newSection, newBlock, cleanBuilders, cleanBlockStyle } from '../src/builder.js'

const custom=newSection('blank','sectiondemo101')
for(const kind of ['text','image','video','button','icon','spacer']){
  const element=newBlock(kind)
  assert.equal(element.kind,kind)
  assert.equal(typeof element.style,'object')
  custom.blocks.push(element)
}
assert.equal(custom.blocks[1].value,'','Image should begin as direct-upload placeholder')
assert.equal(custom.blocks[2].value,'','Video should begin as direct-upload placeholder')
const page={id:'pagetwo',title:'Treatments',slug:'treatments',sections:[custom.id]}
let data=structuredClone(initialContent)
data.builderBlocks={[custom.id]:custom}
data.pages.push(page)
data.homepageOrder=['hero',custom.id,'treatments','news']
data=setPath(data,`builderBlocks.${custom.id}.blocks.1.style.paddingLeft`,32)
data=setPath(data,`builderBlocks.${custom.id}.blocks.1.style.width`,430)
data=setPath(data,`builderBlocks.${custom.id}.blocks.1.value`,'media/custom-hero.mp4')
data=setPath(data,`sectionStyles.${custom.id}.columns`,2)
data=setPath(data,`sectionStyles.${custom.id}.paddingLeft`,36)
data=setPath(data,`elementStyles.hero.title.paddingTop`,20)
const restored=deepMerge(initialContent,JSON.parse(JSON.stringify(data)))
assert.equal(readPath(restored,`builderBlocks.${custom.id}.blocks.1.style.paddingLeft`),32)
assert.equal(readPath(restored,`builderBlocks.${custom.id}.blocks.1.style.width`),430)
assert.equal(readPath(restored,`builderBlocks.${custom.id}.blocks.1.value`),'media/custom-hero.mp4')
assert.equal(readPath(restored,`sectionStyles.${custom.id}.columns`),2)
assert.equal(readPath(restored,`sectionStyles.${custom.id}.paddingLeft`),36)
assert.equal(readPath(restored,`elementStyles.hero.title.paddingTop`),20)
assert.deepEqual(restored.homepageOrder,['hero',custom.id,'treatments','news'])
assert.equal(restored.builderBlocks[custom.id].blocks.length,6)
assert.equal(cleanBlockStyle({paddingTop:20,background:'javascript:alert(1)',width:500,shadow:true,borderColor:'#114477'}).background,undefined)
assert.equal(cleanBlockStyle({paddingTop:20,background:'#ff9933',width:500,shadow:true}).background,'#ff9933')
assert.equal(cleanBlockStyle({width:'calc(100vw)',paddingTop:'15px'}).width,undefined)
const clean=cleanBuilders({[custom.id]:custom})
assert.equal(clean[custom.id].blocks[2].kind,'video')
console.log('PASS: visual builder blocks, placeholders, padding, resizing sizes, media paths, section columns, homepage reorder, JSON roundtrip')
