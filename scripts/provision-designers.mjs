// Produces an encrypted-service secret through stdout, and a private credentials handover file.
// Run only in a trusted terminal; pipe stdout to `wrangler secret put DESIGNER_CREDENTIALS_JSON`.
import fs from 'node:fs'
import {passwordHash,hex} from '../server/auth.js'
const output=process.argv[2];if(!output)throw Error('Provide a private credentials output path. Do not put this file in the source repository or release ZIP.')
const users=[],lines=['OPTIMAX Studio designer access','Store securely; share each password only with its assigned designer.','']
for(let n=1;n<=3;n++){const username='designer'+n,password=hex(crypto.getRandomValues(new Uint8Array(20))),salt=hex(crypto.getRandomValues(new Uint8Array(24)));users.push({username,salt,hash:await passwordHash(password,salt)});lines.push(username+' : '+password)}
fs.writeFileSync(output,lines.join('\n')+'\n',{mode:0o600,flag:'wx'})
process.stdout.write(JSON.stringify(users)+'\n')
