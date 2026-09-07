import { useEffect, useMemo, useRef, useState } from 'react'
import { buildStationIndex, formatServiceTime, type NetworkSnapshot, type NetworkTrain, type StationIndexEntry } from '@motionstudies/core/domain/network'
import type { SpatialLayoutSnapshot } from '@motionstudies/core/domain/spatial-layout'
import { NationalNetworkScene, type MapCameraCommand } from '@motionstudies/three/NationalNetworkScene'
import { OstkreuzScene } from './OstkreuzScene'

const COLORS: Record<string,string> = { S41:'#ffb36b',S42:'#82e5c5',S1:'#aca2dc',S2:'#aca2dc',S3:'#859fc3',S5:'#859fc3',S7:'#859fc3',S9:'#859fc3',U2:'#c2918e',U6:'#9f91bb',U8:'#7b99bf',M10:'#b9be80' }
const framing={homeDistanceScale:1.18,minimumDistanceScale:0.08,portraitMinimumDistanceScale:0.15,stationLabelHeightScale:0.8}
function isRing(t:NetworkTrain) { return t.route==='S41' || t.route==='S42' }
function subset(data:NetworkSnapshot, crossings:boolean):NetworkSnapshot {
  const trains=data.trains.filter(t=>crossings || isRing(t))
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
  const [time,setTime]=useState(data.metadata.focusTime),[playing,setPlaying]=useState(!matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [rate,setRate]=useState(30),[crossings,setCrossings]=useState(false),[mix,setMix]=useState(0),[section,setSection]=useState(false)
  const [sources,setSources]=useState(false),[labels,setLabels]=useState(false),[station,setStation]=useState<StationIndexEntry>(),[train,setTrain]=useState<NetworkTrain>()
  const [camera,setCamera]=useState<MapCameraCommand>(), cameraId=useRef(0), closeSources=useRef<HTMLButtonElement>(null), sourceTrigger=useRef<HTMLButtonElement>(null)
  const network=useMemo(()=>subset(data,crossings||section),[data,crossings,section])
  const stations=useMemo(()=>buildStationIndex(network),[network])
  const active=network.trains.filter(t=>t.start<=time && t.end>=time)
  const ringCounts=['S41','S42'].map(route=>active.filter(t=>t.route===route).length)
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
  function reset(){setTrain(undefined);setStation(undefined);setCamera({id:++cameraId.current,action:'reset'})}
  return <main className="study">
    <aside className="sidebar">
      <a className="series" href="https://emmettl.github.io/motionstudies/">MOTION STUDIES <span>↗</span></a>
      <header><p className="eyebrow">BERLIN · FIRST STUDY</p><h1>Umlauf<span>↻</span></h1><p className="descriptor">A Berlin motion study</p></header>
      <p className="thesis">A railway draws an inside.<br/>The city keeps crossing it.</p>
      <div className="composition" aria-label="Composition">
        <button aria-pressed={!crossings&&!section} onClick={()=>{setSection(false);setCrossings(false);reset()}}><span>01</span> The ring <i>↻ ↺</i></button>
        <button aria-pressed={crossings&&!section} onClick={()=>{setSection(false);setCrossings(true);reset()}}><span>02</span> Ring & crossings <i>↗</i></button>
        <button aria-pressed={section} onClick={()=>{setSection(true);reset()}}><span>03</span> Ostkreuz <i>↟</i></button>
      </div>
      <div className="direction-grid" aria-label="Active scheduled Ringbahn journeys">
        <div><span className="route amber">S41 <b>↻</b></span><strong data-testid="s41-count">{ringCounts[0]}</strong><small>clockwise</small></div>
        <div><span className="route mint">S42 <b>↺</b></span><strong data-testid="s42-count">{ringCounts[1]}</strong><small>counter-clockwise</small></div>
      </div>
      <p className="count-note">Scheduled journeys in motion now</p>
      {!section && <section className="layout-control"><div><label htmlFor="layout">Geography → circulation</label><output>{Math.round(mix*100)}%</output></div><input id="layout" aria-label="Geography to circulation" type="range" min="0" max="1" step="0.01" value={mix} onChange={e=>setMix(Number(e.target.value))}/><p>{mix>0?'An authored diagram: the Ring becomes a circle.':'The shape of the railway, as supplied by VBB.'}</p></section>}
      <div className="sidebar-foot"><p>07 SEPTEMBER 2026<br/><span>07:00–09:00 · Europe/Berlin</span></p><button ref={sourceTrigger} className="text-button" onClick={()=>setSources(!sources)} aria-expanded={sources} aria-controls="source-panel">About the data <span>↗</span></button></div>
    </aside>
    <section className="field" aria-label="Animated Berlin railway study">
      <div className="field-caption"><span>{section?'OSTKREUZ · INTERCHANGE':crossings?'RING & CROSSINGS':'TWO DIRECTIONS. ONE INSIDE.'}</span><span className="evidence">SCHEDULED</span></div>
      {section ? <OstkreuzScene network={data} time={time} playing={playing} rate={rate} onTime={setTime} onInspectCall={next=>{setTime(next);setPlaying(false)}}/> : <><div className="canvas" data-testid="network-scene"><NationalNetworkScene snapshot={network} referenceSnapshot={network} isPlaying={playing} time={time} onTime={setTime} playbackRate={rate} stations={stations} trainLabelMode={labels?'on':'off'} cameraFraming={framing} cameraCommand={camera} selectedStation={station} selectedTrain={train} onSelectStation={s=>{setStation(s);setTrain(undefined)}} spatialLayout={layout} spatialLayoutMix={mix} routeColors={COLORS} routeColorMix={1} stationLabelTierLimit={2}/></div>
      <div className="map-tools"><button aria-label="Zoom in" onClick={()=>setCamera({id:++cameraId.current,action:'zoom-in'})}>+</button><button aria-label="Zoom out" onClick={()=>setCamera({id:++cameraId.current,action:'zoom-out'})}>−</button><button aria-label="Reset view" onClick={reset}>↺</button><button aria-label="Journey labels" aria-pressed={labels} onClick={()=>setLabels(!labels)}>Aa</button></div>
      {station && <section className="station-card" aria-label="Selected station"><div><h2>{station.name}</h2><button aria-label="Close station" onClick={()=>{setStation(undefined);setTrain(undefined)}}>×</button></div><p>Next scheduled calls · {formatServiceTime(time)}</p>{upcoming.length?upcoming.map((c,i)=><button className="call" key={`${c.train.id}:${i}`} onClick={()=>setTrain(c.train)}><span style={{color:COLORS[c.train.route]}}>{c.train.route}</span><span>{c.train.headsign}</span><time>{formatServiceTime(c.arrival)}</time></button>):<p>No further calls in this opening.</p>}</section>}
      <div className="field-foot"><span>{mix>0?'AUTHORED CIRCULATION DIAGRAM':'GEOGRAPHIC PLAN'} · HEIGHTS UNRESOLVED</span><span>{active.length} active journeys</span></div>
      </>}
    </section>
    <footer className="transport"><button className="play" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause playback':'Play playback'}>{playing?'Ⅱ':'▶'}</button><time data-testid="clock">{formatServiceTime(time)}</time><label className="scrubber"><span className="sr-only">Study time</span><input aria-label="Study time" type="range" min={data.metadata.windowStart} max={data.metadata.windowEnd} step="1" value={time} onChange={e=>setTime(Number(e.target.value))}/><span><small>07:00</small><small>09:00</small></span></label><label className="speed"><span className="sr-only">Playback speed</span><select aria-label="Playback speed" value={rate} onChange={e=>setRate(Number(e.target.value))}>{[1,10,30,60].map(v=><option value={v} key={v}>{v}×</option>)}</select></label></footer>
    {sources && <section id="source-panel" className="source-panel" aria-labelledby="source-title"><div className="source-heading"><h2 id="source-title">A dated morning.</h2><button ref={closeSources} aria-label="Close data panel" onClick={()=>{setSources(false);sourceTrigger.current?.focus()}}>×</button></div><p>This first Umlauf study replays scheduled service on 7 September 2026, between 07:00 and 09:00 in Berlin.</p><p>Data © VBB, licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The retained timetable was generated on 3 September. We selected services, cropped their extent and simplified their supplied paths.</p><p>Moving marks interpolate between timetable calls. They represent scheduled journeys; vehicle positions, passenger volumes and physical track heights have not been measured here.</p><p>The Ostkreuz view uses VBB platform levels and pathway endpoints. Its level spacing, platform symbols and straight connector lines are illustrative. It shows selected S-Bahn services and source connections, not live accessibility advice or passenger movement.</p><p>The optional Ostkreuz bridge outline comes from Berlin’s official ATKIS mapping under <a href="https://www.govdata.de/dl-de/zero-2-0">Germany Zero 2.0</a>. Its footprint is supplied geometry; its vertical position is illustrative. The source contains no measured rail-deck heights.</p><p>Selected platform dimensions are cited from DB InfraGO’s station record dated 31 August 2026. Platform height is above the adjacent rail, not above sea level; net built length does not establish usable train length or mapped platform endpoints. These facts do not set the scene geometry.</p><p>The circle is an authored spatial transformation of the same journeys. Time, stop identities and service order stay fixed as the geometry changes.</p><p>The opening covers S41/S42. Crossings add S1/S2, S3/S5/S7/S9, U2/U6/U8 and M10 within a bounded central field. Replacement buses are excluded by operator and mode. Separate timetable trips are never stitched into an asserted vehicle identity.</p><p><a href="https://unternehmen.vbb.de/digitale-services/datensaetze/">Official VBB source ↗</a> · <a href={`${import.meta.env.BASE_URL}data/lineage.json`}>Journey provenance ↗</a></p><p className="hash">SOURCE SHA-256<br/>{data.metadata.sourceSha256}</p></section>}
  </main>
}
