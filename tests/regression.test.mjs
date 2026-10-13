import assert from 'node:assert/strict'
import {initialContent,deepMerge,setPath,readPath} from '../src/siteDefaults.js'
import {newSection,newBlock} from '../src/builder.js'
import {moveBlock,duplicateBlock,deleteBlock,copySection} from '../src/editorModel.js'
let d=structuredClone(initialContent);for(const id of ['sectionone','sectiontwo'])d.builderBlocks[id]=newSection('blank',id)
d.builderBlocks.sectionone.blocks=[newBlock('text'),newBlock('image'),newBlock('button')]
const a='builderBlocks.sectionone.blocks.1.value';d=setPath(d,'elementStyles.'+a+'.paddingLeft',30);d=setPath(d,'mediaSettings.'+a+'.positionX',15);d=setPath(d,'gradients.elements.'+a,{enabled:true,stops:[{color:'#000000',opacity:100,position:0},{color:'#ffffff',opacity:100,position:100}]});d.responsiveStyles.mobile[a]={width:220}
const moved=moveBlock(d,'sectionone',1,'sectiontwo',0);assert.equal(moved.data.builderBlocks.sectiontwo.blocks[0].kind,'image');const b=moved.path;assert.equal(moved.data.elementStyles[b].paddingLeft,30);assert.equal(moved.data.mediaSettings[b].positionX,15);assert.equal(moved.data.responsiveStyles.mobile[b].width,220);assert.equal(readPath(moved.data,'gradients.elements.'+b).enabled,true)
const copy=duplicateBlock(moved.data,'sectiontwo',0);assert.equal(copy.builderBlocks.sectiontwo.blocks.length,2);assert.notEqual(copy.builderBlocks.sectiontwo.blocks[0].id,copy.builderBlocks.sectiontwo.blocks[1].id);assert.equal(copy.mediaSettings['builderBlocks.sectiontwo.blocks.1.value'].positionX,15)
const deleted=deleteBlock(copy,'sectiontwo',0);assert.equal(deleted.mediaSettings[b].positionX,15);assert.equal(deleted.builderBlocks.sectiontwo.blocks.length,1)
const section=copySection(deleted,'sectiontwo','sectionthree');assert.equal(section.mediaSettings['builderBlocks.sectionthree.blocks.0.value'].positionX,15)
section.builderBlocks.sectionthree.locked=true;assert.equal(moveBlock(section,'sectiontwo',0,'sectionthree',0),null)
const down=moveBlock(d,'sectionone',0,'sectionone',1,true);assert.equal(down.data.builderBlocks.sectionone.blocks[1].id,d.builderBlocks.sectionone.blocks[0].id)
const restored=deepMerge(initialContent,JSON.parse(JSON.stringify(section)));assert.equal(restored.responsiveStyles.mobile[b].width,220)
console.log('PASS: cross-section moves, down reorder, style/gradient/media reindex, duplicate/delete, section duplication, locking, responsive roundtrip')
