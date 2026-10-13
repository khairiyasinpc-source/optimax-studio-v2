import React,{useEffect,useState} from 'react'
import Editor from './Editor.jsx'
import {api} from './teamService.js'
import {deepMerge,initialContent} from './siteDefaults.js'
export default function TeamGate({published,loaded}){
  const [state,setState]=useState({loading:true}),[username,setUsername]=useState('designer1'),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const open=async()=>{const user=await api('session'),draft=await api('draft');setState({user,draft})}
  useEffect(()=>{open().catch(e=>{setError(e.status===401?'':e.message);setState({loading:false})})},[])
  const login=async e=>{e.preventDefault();setBusy(true);setError('');try{await api('login','POST',{username,password});setPassword('');await open()}catch(e){setError(e.message)}finally{setBusy(false)}}
  if(state.user&&loaded)return <Editor key={state.user.username} published={state.draft.data?deepMerge(initialContent,state.draft.data):published} loaded={true} team={{username:state.user.username,revision:state.draft.revision,logout:async()=>{await api('logout','POST');setState({loading:false})}}}/>
  return <div className="studio-v2"><div className="studio-v2-overlay"><form className="studio-v2-dialog" onSubmit={login}><div className="studio-v2-brand"><span className="studio-v2-mark">O</span><div><b>OPTIMAX Studio</b><small>Visual Editor V2</small></div></div><h2>Designer sign in</h2><p>Sign in to edit the shared draft and publish the OPTIMAX demo.</p>{state.loading?<p role="status">Checking your session…</p>:<><label className="studio-v2-field"><span>Designer account</span><select aria-label="Designer account" value={username} onChange={e=>setUsername(e.target.value)}>{['designer1','designer2','designer3'].map(v=><option key={v}>{v}</option>)}</select></label><label className="studio-v2-field"><span>Password</span><input aria-label="Password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" className="studio-v2-cta" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></>}{error&&<p role="alert">{error}</p>}</form></div></div>
}
