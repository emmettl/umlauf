import { useEffect, useMemo, useRef, useState } from 'react'
import { BridgeOutline } from './BridgeOutline'
import { PlatformFacts } from './PlatformFacts'
import { formatServiceTime, type NetworkSnapshot } from '@motionstudies/core/domain/network'
import { localPoint, localTrainPoint, screenPoint, verticalConnections, type Point, type StationData } from './ostkreuz-model'

const COLORS:Record<string,string>={S41:'#ffb36b',S42:'#82e5c5',S3:'#9dbce9',S5:'#c2a8ea',S7:'#9dbce9'}
export function OstkreuzScene({network,time,playing,rate,onTime,onInspectCall}:{network:NetworkSnapshot;time:number;playing:boolean;rate:number;onTime:(time:number)=>void;onInspectCall:(time:number)=>void}){
 const [data,setData]=useState<StationData>(),[error,setError]=useState(''),[separation,setSeparation]=useState(1),[mode,setMode]=useState<'all'|'stairs'|'lifts'>('all'),[selected,setSelected]=useState<string>()
 useEffect(()=>{const controller=new AbortController();fetch(`${import.meta.env.BASE_URL}data/ostkreuz.json`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('Unable to load Ostkreuz');return r.json()}).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>controller.abort()},[])
 const [bridgeVisible,setBridgeVisible]=useState(true),[bridgeStatus,setBridgeStatus]=useState<'loading'|'ready'|'unavailable'>('loading')
 const [zoom,setZoom]=useState(1)
 const clock=useRef(time);useEffect(()=>{clock.current=time},[time])
 useEffect(()=>{
  if(!playing)return
  let handle=0,last=0
  const tick=(now:number)=>{if(last){clock.current+=Math.min(0.1,(now-last)/1000)*rate;if(clock.current>network.metadata.windowEnd)clock.current=network.metadata.windowStart+(clock.current-network.metadata.windowEnd);onTime(clock.current)}last=now;handle=requestAnimationFrame(tick)}
  handle=requestAnimationFrame(tick);return()=>cancelAnimationFrame(handle)
 },[playing,rate,onTime,network.metadata.windowStart,network.metadata.windowEnd])
 const scene=useMemo(()=>{
  if(!data)return
  const levels=new Map(data.levels.map(l=>[l.id,l.index]))
  const platforms=data.platforms.filter(p=>p.routes.length)
  const points=new Map(data.nodes.map(n=>[n.id,localPoint([n.longitude,n.latitude],data.origin)]))
  const trains=new Map(network.trains.map(t=>[t.id,t]))
  const tracks=new Map<string,{level:number;route:string;points:Point[]}>()
  for(const call of data.calls){
   const train=trains.get(call.trainId)!,platform=platforms.find(p=>p.id===call.platformId)!
   for(const segment of [call.callIndex-1,call.callIndex]){
    const id=train.pathSegments?.[segment];if(id===undefined||id===null)continue
    const key=`${id}:${platform.levelId}`
    tracks.set(key,{level:levels.get(platform.levelId!)!,route:call.route,points:network.paths![id].map(p=>localPoint(p,data.origin))})
   }
  }
  return {levels,platforms,points,trains,tracks:[...tracks.values()]}
 },[data,network])
 if(error)return <div className="section-loading" role="alert">{error}</div>
 if(!data||!scene)return <div className="section-loading" role="status">Preparing Ostkreuz…</div>
 if(data.metadata.sourceSha256!==network.metadata.sourceSha256||data.metadata.serviceDate!==network.metadata.serviceDate)return <div className="section-loading" role="alert">Station data does not match this timetable.</div>
 const project=(point:Point,level:number)=>screenPoint(point,level,separation)
 const line=(points:readonly Point[],level:number)=>points.map((p,i)=>`${i?'L':'M'}${project(p,level).join(',')}`).join(' ')
 const selectedPlatform=scene.platforms.find(p=>p.id===selected)
 const focus=zoom>1&&selectedPlatform?project(scene.points.get(selectedPlatform.id)!,scene.levels.get(selectedPlatform.levelId!)!):[450,340]
 const connectors=verticalConnections(data,mode)
 const upcoming=data.calls.filter(c=>(!selected||c.platformId===selected)&&c.departure>=time&&c.arrival<=network.metadata.windowEnd).slice(0,4)
 const present=data.calls.filter(c=>time>=c.arrival-150&&time<=c.departure+150).flatMap(call=>{
  const train=scene.trains.get(call.trainId)!,platform=scene.platforms.find(p=>p.id===call.platformId)!,point=localTrainPoint(train,time,network,data.origin)
  return point&&Math.hypot(...point)<260?[{call,platform,point}]:[]
 })
 return <div className="ostkreuz-view" data-testid="ostkreuz-scene">
  <div className="section-intro"><p>THE RING MEETS THE CITY</p><h2>Ostkreuz</h2><span>Above, the Ring. Below, the east–west railway.</span><div className="section-view-tools"><label className="bridge-control"><input type="checkbox" checked={bridgeVisible} disabled={bridgeStatus!=='ready'} onChange={e=>setBridgeVisible(e.target.checked)}/> Official bridge outline{bridgeStatus==='unavailable'?' · unavailable':''}</label><div className="section-zoom" aria-label="Station view"><button aria-label="Zoom into station" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+0.5))}>+</button><output aria-label="Station zoom">{zoom.toFixed(1)}×</output><button aria-label="Zoom out of station" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-0.5))}>−</button><button aria-label="Reset station view" onClick={()=>setZoom(1)}>↺</button></div></div></div>
  <svg className="station-section" viewBox="50 105 800 480" role="img" aria-labelledby="ostkreuz-title ostkreuz-description">
   <title id="ostkreuz-title">Ostkreuz relative platform levels</title><desc id="ostkreuz-description">Selected scheduled S-Bahn calls on lower platforms 3 to 6 and upper platforms 11 and 12. Level separation and platform glyphs are illustrative. Connector lines join GTFS pathway endpoints.</desc>
   <defs><clipPath id="station-crop"><rect x="85" y="115" width="730" height="425" rx="30"/></clipPath><filter id="train-glow"><feGaussianBlur stdDeviation="3"/></filter></defs>
   <g clipPath="url(#station-crop)"><g data-testid="station-camera" transform={`translate(450 340) scale(${zoom}) translate(${-focus[0]} ${-focus[1]})`}>
    {[0,2].map(level=><g key={level}><path d={line([[-220,-130],[220,-130],[220,130],[-220,130],[-220,-130]],level)} fill={level?'#192521':'#15212c'} fillOpacity=".28" stroke="#8ca99e" strokeOpacity=".1"/>{scene.tracks.filter(t=>t.level===level).map((t,i)=><path key={i} d={line(t.points,level)} fill="none" stroke={COLORS[t.route]} strokeWidth="1" opacity=".35"/>)}</g>)}
    <BridgeOutline separation={separation} visible={bridgeVisible} onStatus={setBridgeStatus}/>
    {connectors.map((c,i)=><path key={i} data-connector-mode={c.mode} d={`M${project(scene.points.get(c.from.id)!,scene.levels.get(c.from.levelId!)!).join(',')}L${project(scene.points.get(c.to.id)!,scene.levels.get(c.to.levelId!)!).join(',')}`} stroke={c.mode===5?'#b2efd8':'#c8c0a7'} strokeWidth={c.mode===5?1.7:1} strokeOpacity={separation?0.5:0.15} strokeDasharray={c.mode===5?undefined:'3 4'}><title>{c.mode===5?'Lift':c.mode===4?'Escalator':'Stairs'} · {c.sourceIds.length} source direction record(s)</title></path>)}
    {scene.platforms.map(p=>{
     const point=scene.points.get(p.id)!,level=scene.levels.get(p.levelId!)!,[x,y]=project(point,level)
     const active=present.some(c=>c.platform.id===p.id&&c.call.arrival<=time&&c.call.departure>=time)
     const color=level===2?'#b6d9c1':'#a5b8dc'
     return <g key={p.id} className="platform-glyph" role="button" tabIndex={0} aria-label={`Platform ${p.platform}: ${p.routes.join(', ')}`} aria-pressed={selected===p.id} onClick={()=>setSelected(selected===p.id?undefined:p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(selected===p.id?undefined:p.id)}}}>
      <circle cx={x} cy={y} r="21" fill="transparent"/>
      <rect x={x-10} y={y-8} width="20" height="16" rx="3" fill={active?'#e9e9da':'#142029'} stroke={selected===p.id?'#ffffff':color} strokeWidth={selected===p.id?2.5:1}/>
      <text x={x} y={y+3.5} textAnchor="middle" fill={active?'#101b18':color} fontSize="10">{p.platform}</text>
     </g>
    })}
    {present.map(({call,platform,point})=>{const [x,y]=project(point,scene.levels.get(platform.levelId!)!),color=COLORS[call.route];return <g key={call.id}><circle cx={x} cy={y} r="7" fill={color} opacity=".65" filter="url(#train-glow)"/><circle cx={x} cy={y} r="3" fill={color}/><text x={x+10} y={y-9} fill={color} fontSize="11">{call.route}</text></g>})}
   </g></g>
   {zoom===1&&<g className="level-labels"><text x="94" y={238-100*separation}>UPPER · 11 / 12</text><text x="94" y="492">LOWER · 3 / 4 / 5 / 6</text></g>}
   <text x="450" y="572" textAnchor="middle" className="section-caption">RELATIVE LEVELS · SPACING IS ILLUSTRATIVE</text>
  </svg>
  <div className="section-controls"><label>Separate levels <input aria-label="Separate platform levels" type="range" min="0" max="1" step="0.01" value={separation} onChange={e=>setSeparation(Number(e.target.value))}/></label><div className="connection-controls" aria-label="Station connections">{(['all','stairs','lifts'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='all'?'All links':m==='stairs'?'Stairs / escalators':'Lifts'}</button>)}</div></div>
  <div className="station-departures"><div><h3>Scheduled calls</h3><label className="platform-select"><span className="sr-only">Choose platform</span><select aria-label="Choose platform" value={selected??''} onChange={e=>setSelected(e.target.value||undefined)}><option value="">All platforms</option>{scene.platforms.map(p=><option value={p.id} key={p.id}>Platform {p.platform}</option>)}</select></label><span>{formatServiceTime(time)}</span></div>{upcoming.map(call=><button className="section-call" key={call.id} aria-label={`${call.route} at ${formatServiceTime(call.arrival)}, platform ${scene.platforms.find(p=>p.id===call.platformId)?.platform}`} onClick={()=>onInspectCall(call.arrival)}><span style={{color:COLORS[call.route]}}>{call.route}</span><span>Platform {scene.platforms.find(p=>p.id===call.platformId)?.platform}</span><time>{formatServiceTime(call.arrival)}</time></button>)}{!upcoming.length&&<p>No further calls in this opening.</p>}</div>
  <PlatformFacts platform={selectedPlatform?.platform}/>
  <p className="section-note">Bridge outline: Berlin ATKIS. Vertical spacing is illustrative. Selected scheduled S-Bahn services; lift availability is unknown.</p>
 </div>
}
