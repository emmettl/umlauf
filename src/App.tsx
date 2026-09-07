import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildStationIndex, formatServiceTime, type NetworkSnapshot, type NetworkTrain, type StationIndexEntry } from '@motionstudies/core/domain/network'
import type { SpatialLayoutSnapshot } from '@motionstudies/core/domain/spatial-layout'
import { NationalNetworkScene, type MapCameraCommand } from '@motionstudies/three/NationalNetworkScene'
import { useInterchangeTravel, travelStage } from './useInterchangeTravel'
import { lazy, Suspense } from 'react'
import type { MapWaterBodies } from '@motionstudies/core/domain/lakes'
const OstkreuzScene=lazy(()=>import('./OstkreuzScene').then(module=>({default:module.OstkreuzScene})))

const COLORS: Record<string,string> = { S41:'#ffb36b',S42:'#82e5c5',S1:'#8373ac',S2:'#8373ac',S3:'#557d98',S5:'#557d98',S7:'#557d98',S9:'#557d98',U2:'#855f63',U6:'#796486',U8:'#59768e',M10:'#8c915e' }
const desktopFraming={homeDistanceScale:0.96,minimumDistanceScale:0.08,portraitMinimumDistanceScale:0.15,stationLabelHeightScale:0.8}
function isRing(t:NetworkTrain) { return t.route==='S41' || t.route==='S42' }
const FAMILIES={all:[],north:['S1','S2'],east:['S3','S5','S7','S9'],local:['U2','U6','U8','M10']} as const
type Family=keyof typeof FAMILIES
type Direction='both'|'S41'|'S42'
function subset(data:NetworkSnapshot, crossings:boolean, family:Family, direction:Direction):NetworkSnapshot {
  const trains=data.trains.filter(t=>(isRing(t) && (direction==='both'||t.route===direction)) || (!isRing(t) && crossings && (family==='all' || (FAMILIES[family] as readonly string[]).includes(t.route))))
  const ids=new Set(trains.flatMap(t=>t.pathSegments??[]))
  const indexes=data.edges.map((_,i)=>i).filter(i=>ids.has(data.edgePaths?.[i]??null))
  return {...data,trains,edges:indexes.map(i=>data.edges[i]),edgePaths:indexes.map(i=>data.edgePaths![i])}
}

export function App() {
  const [data,setData]=useState<NetworkSnapshot>(),[layout,setLayout]=useState<SpatialLayoutSnapshot>(),[error,setError]=useState('')
  useEffect(()=>{
    const abort=new AbortController()
    Promise.all(['berlin-morning.json','ring-layout.json'].map(async file=>{
      const r=await fetch(`${import.meta.env.BASE_URL}data/${file}`,{signal:abort.signal})
      if (!r.ok) throw new Error(`Unable to load ${file}`)
      return r.json()
    })).then(([network,diagram])=>{setData(network);setLayout(diagram)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)})
    return ()=>abort.abort()
  },[])
  if(error) return <main className="loading"><h1>Umlauf</h1><p>{error}</p><button onClick={()=>location.reload()}>Try again</button></main>
  if(!data || !layout) return <main className="loading"><h1>Umlauf</h1><p>Preparing Berlin’s morning…</p></main>
  return <Study data={data} layout={layout}/>
}

function Study({data,layout}:{data:NetworkSnapshot;layout:SpatialLayoutSnapshot}) {
  const [phone,setPhone]=useState(()=>matchMedia('(max-width:760px)').matches)
  useEffect(()=>{const query=matchMedia('(max-width:760px)'),update=()=>setPhone(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[])
  const framing=useMemo(()=>({...desktopFraming,homeDistanceScale:phone?1.18:0.96,stationLabelHeightScale:phone?1.1:1}),[phone])
  const [time,setTime]=useState(data.metadata.focusTime),[playing,setPlaying]=useState(!matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [direction,setDirection]=useState<Direction>('both')
  const [family,setFamily]=useState<Family>('all'),[water,setWater]=useState<MapWaterBodies>(),[waterFailed,setWaterFailed]=useState(false),[waterEnabled,setWaterEnabled]=useState(!phone)
  useEffect(()=>{if(!waterEnabled||water)return;const abort=new AbortController();fetch(`${import.meta.env.BASE_URL}data/berlin-water.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Water unavailable');return r.json()}).then(setWater).catch(e=>{if(e.name!=='AbortError')setWaterFailed(true)});return()=>abort.abort()},[waterEnabled,water])
  const [rate,setRate]=useState(30),[crossings,setCrossings]=useState(false),[mix,setMix]=useState(0),[section,setSection]=useState(false)
  const [sources,setSources]=useState(false),[labels,setLabels]=useState(false),[station,setStation]=useState<StationIndexEntry>(),[train,setTrain]=useState<NetworkTrain>()
  const [camera,setCamera]=useState<MapCameraCommand>(), cameraId=useRef(0), closeSources=useRef<HTMLButtonElement>(null), sourceTrigger=useRef<HTMLButtonElement>(null)
  const [stationOrigin,setStationOrigin]=useState<readonly[number,number]>(),[stationError,setStationError]=useState(''),[stationAttempt,setStationAttempt]=useState(0)
  const onStationReady=useCallback((origin:readonly[number,number])=>{setStationOrigin(origin);setStationError('')},[])
  const travel=useInterchangeTravel(section,!!stationOrigin&&!stationError)
  useEffect(()=>{if(!section&&travel===0)setStationOrigin(undefined)},[section,travel])
  const blend=travelStage(travel,0.48,0.72),cityMix=mix*(1-travelStage(travel,0,0.2))
  const cameraDestination=section?travel>=0.2:travel>0.55
  useEffect(()=>{
    if(cameraDestination&&stationOrigin)setCamera({id:++cameraId.current,action:'focus-location',focus:stationOrigin,distanceScale:0.22})
    else setCamera({id:++cameraId.current,action:'reset'})
  },[cameraDestination,stationOrigin])
  const network=useMemo(()=>subset(data,crossings,family,direction),[data,crossings,family,direction])
  const reference=useMemo(()=>({...network,bounds:{...network.bounds,minLongitude:network.bounds.minLongitude-(phone?0.04:0),maxLongitude:network.bounds.maxLongitude+(phone?0.04:0)}}),[network,phone])
  const stations=useMemo(()=>buildStationIndex(network),[network])
  const countableTrains=useMemo(()=>{
    const stationTrainIds=station?new Set(stations.find(s=>s.name===station.name)?.trainIds??[]):undefined
    return network.trains.filter(t=>!stationTrainIds||stationTrainIds.has(t.id))
  },[network,station,stations])
  const active=countableTrains.filter(t=>t.realtime?.status!=='cancelled' && t.start<=time && t.end>=time)
  const ringCounts=['S41','S42'].map(route=>data.trains.filter(t=>t.route===route&&t.start<=time&&t.end>=time).length)
  const calls=useMemo(()=>{
    if(!station)return []
    const ids=new Set(station.stopIndexes)
    return network.trains.flatMap(t=>t.stops.filter(s=>ids.has(s[0])).map(s=>({train:t,arrival:s[1],departure:s[2]}))).sort((a,b)=>a.arrival-b.arrival)
  },[network,station])
  const upcoming=calls.filter(c=>c.departure>=time).slice(0,4)
  useEffect(()=>{
    if(!sources)return
    closeSources.current?.focus()
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSources(false);sourceTrigger.current?.focus()}}
    window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)
  },[sources])
  function inspectDirection(next:Direction){setDirection(next);setTrain(undefined);setStation(undefined)}
  function reset(){setTrain(undefined);setStation(undefined);setCamera({id:++cameraId.current,action:'reset'})}
  return <main className="study">
    <aside className="sidebar">
      <a className="series" href="https://emmettl.github.io/motionstudies/">MOTION STUDIES <span>↗</span></a>
      <header><p className="eyebrow">BERLIN · FIRST STUDY</p><h1>Umlauf<span>↻</span></h1><p className="descriptor">A Berlin motion study</p></header>
      <p className="thesis">A railway draws an inside.<br/>The city keeps crossing it.</p>
      <div className="composition" aria-label="Composition">
        <button aria-pressed={!crossings&&!section} onClick={()=>{setSection(false);setCrossings(false);if(travel===0)reset()}}><span>01</span> The ring <i>↻ ↺</i></button>
        <button aria-pressed={crossings&&!section} onClick={()=>{setSection(false);setCrossings(true);if(travel===0)reset()}}><span>02</span> Ring & crossings <i>↗</i></button>
        <button aria-pressed={section} onClick={()=>{setSection(true);setStation(undefined);setTrain(undefined)}}><span>03</span> Ostkreuz <i>↟</i></button>
      </div>
      <div className="direction-grid" aria-label="Active scheduled Ringbahn journeys">
        <button className="direction-card" aria-label="S41 clockwise only" aria-pressed={direction==='S41'} disabled={section||travel>0} onClick={()=>inspectDirection(direction==='S41'?'both':'S41')}><span className="route amber">S41 <b>↻</b></span><strong data-testid="s41-count">{ringCounts[0]}</strong><small>clockwise</small></button>
        <button className="direction-card" aria-label="S42 counter-clockwise only" aria-pressed={direction==='S42'} disabled={section||travel>0} onClick={()=>inspectDirection(direction==='S42'?'both':'S42')}><span className="route mint">S42 <b>↺</b></span><strong data-testid="s42-count">{ringCounts[1]}</strong><small>counter-clockwise</small></button>
        <button className="both-directions" aria-pressed={direction==='both'} disabled={section||travel>0} onClick={()=>inspectDirection('both')}>Both directions</button>
      </div>
      <p className="count-note">Active scheduled journeys · includes dwell</p>
      <section className="layout-control"><div><label htmlFor="layout">Geography → circulation</label><output>{Math.round(cityMix*100)}%</output></div><input id="layout" aria-label="Geography to circulation" disabled={section||travel>0} type="range" min="0" max="1" step="0.01" value={cityMix} onChange={e=>setMix(Number(e.target.value))}/><p>{cityMix>0?'An authored diagram: the Ring becomes a circle.':'The shape of the railway, as supplied by VBB.'}</p></section>
      <div className="sidebar-foot"><p>07 SEPTEMBER 2026<br/><span>07:00–09:00 · Europe/Berlin</span></p><button ref={sourceTrigger} className="text-button" onClick={()=>setSources(!sources)} aria-expanded={sources} aria-controls="source-panel">About the data <span>↗</span></button></div>
    </aside>
    <section className="field" aria-label="Animated Berlin railway study">
      <div className="field-caption"><span>{section?'OSTKREUZ · INTERCHANGE':crossings?`RING & CROSSINGS${direction==='both'?'':` · ${direction}`}`:direction==='both'?'TWO DIRECTIONS. ONE INSIDE.':direction==='S41'?'S41 · CLOCKWISE':'S42 · COUNTER-CLOCKWISE'}</span><span className="evidence">SCHEDULED</span></div>
      {(section||travel>0)&&<div className="interchange-layer" data-testid="interchange-travel" data-progress={travel.toFixed(3)} style={{opacity:blend}} inert={travel<1} aria-hidden={travel<1}><Suspense fallback={null}><OstkreuzScene key={stationAttempt} network={data} time={time} playing={playing&&travel===1} rate={rate} onTime={setTime} onReady={onStationReady} onError={setStationError} entrance={travelStage(travel,0.65,1)} onInspectCall={next=>{setTime(next);setPlaying(false)}}/></Suspense></div>}
      {section&&travel===0&&<div className="travel-status" role={stationError?'alert':'status'}>{stationError?<>{stationError} <button onClick={()=>{setStationError('');setStationOrigin(undefined);setStationAttempt(n=>n+1)}}>Try again</button></>:'Preparing Ostkreuz…'}</div>}
      {travel<1&&<div className="city-layer" style={{opacity:1-blend}} inert={section||travel>0} aria-hidden={section||travel>0}><div className="canvas" data-testid="network-scene"><NationalNetworkScene lakes={waterEnabled&&cityMix<1?water:undefined} snapshot={network} referenceSnapshot={reference} isPlaying={playing} time={time} onTime={setTime} playbackRate={rate} stations={stations} trainLabelMode={labels?'on':'off'} cameraFraming={framing} cameraCommand={camera} selectedStation={station} selectedTrain={train} onSelectStation={s=>{setStation(s);setTrain(undefined)}} spatialLayout={layout} spatialLayoutMix={cityMix} layoutTransitioning={travel>0&&travel<1} routeColors={COLORS} routeColorMix={1} topologicalStyle="line-map" groundStyle="quiet"/></div>
      {!section&&travel===0&&<>
      {crossings && <div className="crossing-families" aria-label="Crossing routes">{([['all','All crossings'],['north','North–south'],['east','East–west'],['local','U-Bahn + tram']] as const).map(([id,label])=><button key={id} aria-pressed={family===id} onClick={()=>{setFamily(id);reset()}}>{label}</button>)}</div>}
      {mix>0&&<p className="direction-note"><span className="amber">S41 outer</span> · <span className="mint">S42 inner</span> · diagram spacing</p>}
      <div className="map-context"><label><input type="checkbox" checked={waterEnabled} disabled={waterFailed} onChange={e=>setWaterEnabled(e.target.checked)}/> {waterFailed?'Water unavailable':'Spree & canals'}</label>{waterEnabled&&!waterFailed&&<span>{mix>0?'Fades as geography becomes a diagram':'Berlin ATKIS · geographic water'}</span>}</div>
      <div className="map-tools"><button aria-label="Zoom in" onClick={()=>setCamera({id:++cameraId.current,action:'zoom-in'})}>+</button><button aria-label="Zoom out" onClick={()=>setCamera({id:++cameraId.current,action:'zoom-out'})}>−</button><button aria-label="Reset view" onClick={reset}>↺</button><button aria-label="Train labels" title="Train labels · station names appear as you zoom" aria-pressed={labels} onClick={()=>setLabels(!labels)}>Aa</button></div>
      {station && <section className="station-card" aria-label="Selected station"><div><h2>{station.name}</h2><button aria-label="Close station" onClick={()=>{setStation(undefined);setTrain(undefined)}}>×</button></div><p>Next scheduled calls · {formatServiceTime(time)}</p>{upcoming.length?upcoming.map((c,i)=><button className="call" key={`${c.train.id}:${i}`} onClick={()=>setTrain(c.train)}><span style={{color:COLORS[c.train.route]}}>{c.train.route}</span><span>{c.train.headsign}</span><time>{formatServiceTime(c.arrival)}</time></button>):<p>No further calls in this opening.</p>}</section>}
      <div className="field-foot"><span>{mix>0?'AUTHORED CIRCULATION DIAGRAM':'GEOGRAPHIC PLAN'} · HEIGHTS UNRESOLVED</span><span>{active.length} active journeys</span></div>
      </>}
      </div>}
    </section>
    <footer className="transport"><button className="play" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause playback':'Play playback'}>{playing?'Ⅱ':'▶'}</button><time data-testid="clock">{formatServiceTime(time)}</time><label className="scrubber"><span className="sr-only">Study time</span><input aria-label="Study time" type="range" min={data.metadata.windowStart} max={data.metadata.windowEnd} step="1" value={time} onChange={e=>setTime(Number(e.target.value))}/><span><small>07:00</small><small>09:00</small></span></label><label className="speed"><span className="sr-only">Playback speed</span><select aria-label="Playback speed" value={rate} onChange={e=>setRate(Number(e.target.value))}>{[1,10,30,60].map(v=><option value={v} key={v}>{v}×</option>)}</select></label></footer>
    {sources && <section id="source-panel" className="source-panel" aria-labelledby="source-title"><div className="source-heading"><h2 id="source-title">A dated morning.</h2><button ref={closeSources} aria-label="Close data panel" onClick={()=>{setSources(false);sourceTrigger.current?.focus()}}>×</button></div><p>This first Umlauf study replays scheduled service on 7 September 2026, between 07:00 and 09:00 in Berlin.</p><p>Data © VBB, licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The retained timetable was generated on 3 September. We selected services, cropped their extent and simplified their supplied paths.</p><p>Moving marks interpolate between timetable calls. They represent scheduled journeys; vehicle positions, passenger volumes and physical track heights have not been measured here.</p><p>The move into Ostkreuz follows its geographic position before tilting into an authored relative-level view. The Ostkreuz view uses VBB platform levels and pathway endpoints. Its level spacing, platform symbols and straight connector lines are illustrative. It shows selected S-Bahn services and source connections, not live accessibility advice or passenger movement.</p><p>The Spree, canals and harbour basins use a bounded crop of official Berlin ATKIS water polygons, retrieved on 7 September 2026 under Germany Zero 2.0. Island boundaries are retained. Water fades out during the circulation transformation; it is geographic context, not a diagram or a measured water level.</p><p>The optional Ostkreuz bridge outline comes from Berlin’s official ATKIS mapping under <a href="https://www.govdata.de/dl-de/zero-2-0">Germany Zero 2.0</a>. Its footprint is supplied geometry; its vertical position is illustrative. The source contains no measured rail-deck heights.</p><p>Selected platform dimensions are cited from DB InfraGO’s station record dated 31 August 2026. Platform height is above the adjacent rail, not above sea level; net built length does not establish usable train length or mapped platform endpoints. These facts do not set the scene geometry.</p><p>The circle is an authored spatial transformation of the same journeys. Time, stop identities and service order stay fixed as the geometry changes. Amber S41 is spaced outside mint S42 in the diagram so both directions can be read. Shared source platforms remain shared. This spacing is illustrative, not measured track separation. Direction controls isolate scheduled services without changing the clock.</p><p>The opening covers S41/S42. Crossings add S1/S2, S3/S5/S7/S9, U2/U6/U8 and M10 within a bounded central field. Replacement buses are excluded by operator and mode. Separate timetable trips are never stitched into an asserted vehicle identity.</p><p><a href="https://unternehmen.vbb.de/digitale-services/datensaetze/">Official VBB source ↗</a> · <a href={`${import.meta.env.BASE_URL}data/lineage.json`}>Journey provenance ↗</a></p><p className="hash">SOURCE SHA-256<br/>{data.metadata.sourceSha256}</p></section>}
  </main>
}
