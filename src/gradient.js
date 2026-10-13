// Reusable and safe gradient function for the live renderer and editor.
const clamp=(value,low,high,fallback)=>Number.isFinite(Number(value))?Math.min(high,Math.max(low,Number(value))):fallback
const hex=value=>/^#[0-9a-f]{6}$/i.test(value||'')?value:'#f8fcff'
export function gradientBackground(overlay) {
  if(!overlay?.enabled) return ''
  const stops=(Array.isArray(overlay.stops)?overlay.stops:[]).slice(0,8).map(stop=>{
    const h=hex(stop.color),r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16)
    return {position:clamp(stop.position,0,100,0),css:`rgba(${r},${g},${b},${clamp(stop.opacity,0,100,0)/100})`}
  }).sort((a,b)=>a.position-b.position)
  if(!stops.length)return ''
  const cssStops=stops.map(s=>`${s.css} ${s.position}%`).join(',')
  if(overlay.type==='radial') return `radial-gradient(circle at ${clamp(overlay.radialX,0,100,25)}% ${clamp(overlay.radialY,0,100,50)}%,${cssStops}),`
  return `linear-gradient(${clamp(overlay.angle,0,360,90)}deg,${cssStops}),`
}
