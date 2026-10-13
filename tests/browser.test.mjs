import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true})
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
const poll=async(check)=>{const end=Date.now()+10000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,50))}throw Error('Browser state did not settle before the assertion')}
const base=process.env.TEST_URL||'http://127.0.0.1:5173/'
const editor=()=>page.frameLocator('iframe[title="OPTIMAX website preview"]')
try{
await page.goto(base+'?edit=1');await editor().locator('[data-edit-path="hero.title"]').waitFor();
await editor().locator('[data-edit-path="hero.title"]').click();await page.locator('.studio-v2-inspector textarea').fill('Browser regression heading')
await editor().getByRole('heading',{name:'Browser regression heading'}).waitFor()
await page.getByRole('button',{name:'Full Screen Website Preview',exact:true}).click();await page.frameLocator('iframe[title="Full website preview"]').getByRole('heading',{name:'Browser regression heading'}).waitFor();await page.getByRole('button',{name:'Exit Preview',exact:true}).click()
await page.reload();await editor().getByRole('heading',{name:'Browser regression heading'}).waitFor()
await page.getByRole('button',{name:'Dark editor mode',exact:true}).click();assert.equal(await page.locator('.studio-v2').getAttribute('data-studio-theme'),'dark')
await page.getByRole('button',{name:'Add Section',exact:true}).click();await page.getByRole('button',{name:'Blank section',exact:true}).click();await page.locator('.v2-palette-toggle').click();await page.locator('.v2-palette-grid').getByRole('button',{name:'Text',exact:true}).click()
await page.locator('.studio-v2-inspector textarea').fill('Custom drag text');await editor().getByText('Custom drag text',{exact:true}).waitFor()
await page.locator('.v2-palette-grid').getByRole('button',{name:'Image',exact:true}).click()
const fixture=process.env.TEST_FIXTURE||new URL('../tests/fixture.webp',import.meta.url).pathname
await editor().locator('.v2-drop-placeholder input[type=file]').setInputFiles(fixture);await editor().locator('.v2-builder-image img').waitFor();assert.match(await editor().locator('.v2-builder-image img').getAttribute('src'),/^blob:/)
await editor().locator('.v2-builder-block').nth(1).click();await page.locator('.v2-quick-actions').getByRole('button',{name:'Up',exact:true}).click();await poll(async()=>await editor().locator('.v2-builder-block').first().getAttribute('data-edit-kind')==='image')
await page.locator('.v2-quick-actions').getByRole('button',{name:'Down',exact:true}).click();await poll(async()=>await editor().locator('.v2-builder-block').last().getAttribute('data-edit-kind')==='image')
await page.getByRole('button',{name:'Section',exact:true}).click();await page.getByLabel('Columns',{exact:true}).selectOption('2');await poll(async()=>/repeat\(2/.test(await editor().locator('.v2-editable-layout').getAttribute('style')))
// Real HTML drag across the editor iframe into a custom section.
const palette=page.locator('.v2-palette-grid').getByRole('button',{name:'Button',exact:true}),target=editor().locator('.v2-editable-layout');await palette.dragTo(target);await poll(async()=>await editor().locator('.v2-builder-block').count()===3)
await editor().locator('.v2-builder-block').last().dragTo(editor().locator('.v2-builder-block').first(),{targetPosition:{x:10,y:10}});await poll(async()=>await editor().locator('.v2-builder-block').first().getAttribute('data-edit-kind')==='button')
await editor().locator('.v2-builder-block').first().click();await page.getByLabel('Enable gradient',{exact:true}).check();await poll(async()=>/gradient/.test(await editor().locator('.v2-builder-block>.btn').first().getAttribute('style')))
await page.getByRole('button',{name:'Mobile',exact:true}).click();await editor().locator('.v2-builder-block').first().click();await page.getByLabel('mobile width (px)',{exact:true}).fill('250');await poll(async()=>await editor().locator('.v2-builder-block').first().evaluate(e=>Math.round(e.getBoundingClientRect().width))===250)
await page.getByRole('button',{name:'Desktop',exact:true}).click();await poll(async()=>await editor().locator('.v2-builder-block').first().evaluate(e=>Math.round(e.getBoundingClientRect().width))!==250)
// Resize uses native pointer events and is undoable.
await editor().locator('.v2-builder-block').last().click();const handle=editor().locator('.v2-resize-corner').last(),box=await handle.boundingBox();await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(box.x-50,box.y+50,{steps:8});await page.mouse.up();await page.getByLabel('Height (px)',{exact:true}).waitFor();await poll(async()=>Number(await page.getByLabel('Height (px)',{exact:true}).inputValue())>0)
await page.getByRole('button',{name:'Undo (Cmd/Ctrl+Z)',exact:true}).click()
page.once('dialog',d=>d.accept('Regression Page'));await page.getByRole('button',{name:'Add new page',exact:true}).click();await page.getByRole('button',{name:'Add Section',exact:true}).click();await page.getByRole('button',{name:'Call to Action',exact:true}).click();await editor().getByText('Your heading goes here',{exact:true}).waitFor();assert.equal(await editor().getByRole('heading',{name:'Browser regression heading'}).count(),0)
await page.getByRole('button',{name:'Export backup',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download Publish Package (ZIP)',exact:true}).click();const download=await downloadPromise;assert.ok(fs.statSync(await download.path()).size>1000)
assert.deepEqual(errors,[])
if(process.env.SCREENSHOT_PATH){await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.screenshot({path:process.env.SCREENSHOT_PATH})}
console.log('PASS: real Chromium selection, draft updates, full preview, reload persistence, dark mode, sections, direct upload, up/down, cross-frame drag, reorder, gradients, responsive width, resize, undo, pages, ZIP export, zero page exceptions')
}catch(error){await page.screenshot({path:'browser-test.png'}).catch(()=>{});console.log('Browser failures:',errors);throw error}finally{await browser.close()}
