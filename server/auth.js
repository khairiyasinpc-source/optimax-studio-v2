const encoder=new TextEncoder()
export const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
export const digest=async value=>hex(await crypto.subtle.digest('SHA-256',typeof value==='string'?encoder.encode(value):value))
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256))}
export function constantEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}
export const sessionCookie=(token,age=28800)=>`__Host-optimax=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`
export function credentials(env){let users;try{users=JSON.parse(env.DESIGNER_CREDENTIALS_JSON)}catch{throw new Error('Designer accounts are not configured')}
  if(!Array.isArray(users)||users.length!==3||new Set(users.map(v=>v.username)).size!==3||users.some(v=>!/^designer[123]$/.test(v.username)||!/^\w{32,}$/.test(v.salt)||!/^[a-f0-9]{64}$/.test(v.hash)))throw new Error('Exactly three valid designer accounts must be configured')
  return users
}
export async function authenticate(request,env){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-optimax=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null
  return env.DB.prepare('SELECT username FROM sessions WHERE token_hash=? AND expires>?').bind(await digest(token),Date.now()).first()
}
