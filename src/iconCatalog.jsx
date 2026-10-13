import React from 'react'
import {Activity, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, CheckCircle2, CircleHelp, Clock3, Eye, Facebook, Heart, HeartHandshake, House, Instagram, MapPin, Menu, Microscope, Phone, ScanEye, Search, Settings, ShieldCheck, ShieldPlus, Sparkles, Stethoscope, Target, Users, Youtube} from 'lucide-react'

// Restrict user-selected icons to known safe React icon components.
export const iconCatalog = {Activity,ArrowRight,ArrowUpRight,BadgeCheck,CalendarDays,CheckCircle2,CircleHelp,Clock3,Eye,Facebook,Heart,HeartHandshake,House,Instagram,MapPin,Menu,Microscope,Phone,ScanEye,Search,Settings,ShieldCheck,ShieldPlus,Sparkles,Stethoscope,Target,Users,Youtube}
export const iconNames = Object.keys(iconCatalog).sort()
export function IconVisual({value='Eye',size=24,strokeWidth=1.7,children,...props}) {
  if (typeof value==='string' && /^(data:image\/(webp|png|jpeg);base64,|blob:|media\/|\/|https?:)/.test(value)) {
    return <img src={value} alt="" aria-hidden="true" {...props} style={{width:size,height:size,objectFit:'contain',...props.style}} />
  }
  const Component=iconCatalog[value]||Eye
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props}>{children}</Component>
}
