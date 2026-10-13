import {execFileSync} from 'node:child_process'
execFileSync(process.execPath,[new URL('../node_modules/vite/bin/vite.js',import.meta.url).pathname,'build',...process.argv.slice(2)],{stdio:'inherit'})
await import('./create-page-routes.mjs')
