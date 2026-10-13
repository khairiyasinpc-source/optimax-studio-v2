import fs from 'node:fs'
import path from 'node:path'
const root=new URL('../',import.meta.url)
const dist=new URL('../dist/',import.meta.url)
const index=new URL('../dist/index.html',import.meta.url)
const content=new URL('../public/site-content.json',import.meta.url)
const html=fs.readFileSync(index,'utf8')
const data=JSON.parse(fs.readFileSync(content,'utf8'))
const pages=(Array.isArray(data.pages)?data.pages:[]).filter(p=>p&&p.id!=='home'&&/^[a-z0-9-]{1,64}$/.test(p.slug||''))
for(const page of pages){const folder=new URL(`${page.slug}/`,dist);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(new URL('index.html',folder),html)}
fs.writeFileSync(new URL('404.html',dist),html)
console.log(`OPTIMAX V2: built ${pages.length} extra page route(s)`)
