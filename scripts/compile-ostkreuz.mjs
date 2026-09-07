import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { rowsFromArchive } from '@motionstudies/data/gtfs'

const archive='sources/vbb-20260903.zip'
const sourceSha256=createHash('sha256').update(await readFile(archive)).digest('hex')
const networkBytes=await readFile('public/data/berlin-morning.json'),network=JSON.parse(networkBytes)
if(sourceSha256!==network.metadata.sourceSha256)throw new Error('Station and timetable must use the same reviewed source archive')
const stationId='de:11000:900120003',nodes=[],levels=[]
for await(const row of rowsFromArchive(archive,'stops.txt')){
  if(row.stop_id!==stationId && row.parent_station!==stationId)continue
  nodes.push({id:row.stop_id,name:row.stop_name,description:row.stop_desc,longitude:Number(row.stop_lon),latitude:Number(row.stop_lat),locationType:row.location_type,parentId:row.parent_station,levelId:row.level_id||null,platform:row.platform_code||null})
}
const ids=new Set(nodes.map(n=>n.id)),levelIds=new Set(nodes.map(n=>n.levelId))
for await(const row of rowsFromArchive(archive,'levels.txt'))if(levelIds.has(row.level_id))levels.push({id:row.level_id,index:Number(row.level_index),name:row.level_name})
const pathways=[]
for await(const row of rowsFromArchive(archive,'pathways.txt')){
  if(!ids.has(row.from_stop_id)||!ids.has(row.to_stop_id))continue
  pathways.push({id:row.pathway_id,from:row.from_stop_id,to:row.to_stop_id,mode:Number(row.pathway_mode),bidirectional:row.is_bidirectional==='1',traversalSeconds:row.traversal_time?Number(row.traversal_time):null,lengthMetres:row.length?Number(row.length):null})
}
const platforms=nodes.filter(n=>n.platform).map(n=>({...n,routes:[...new Set(network.trains.filter(t=>t.stops.some(c=>network.stops[c[0]][4]===n.id)).map(t=>t.route))].sort()})).sort((a,b)=>Number(a.platform)-Number(b.platform))
const calls=network.trains.flatMap(t=>t.stops.flatMap((call,callIndex)=>{
  const id=network.stops[call[0]][4]
  return ids.has(id)?[{id:`${t.id}:${callIndex}`,trainId:t.id,route:t.route,headsign:t.headsign,platformId:id,arrival:call[1],departure:call[2],callIndex}]:[]
})).sort((a,b)=>a.arrival-b.arrival||a.id.localeCompare(b.id))
if(nodes.length!==122 || !calls.length || levels.some(l=>!Number.isFinite(l.index)))throw new Error('Unexpected station inventory; review the source contract')
const artifact={metadata:{stationId,name:'Ostkreuz',sourceSha256,sourceUrl:network.metadata.sourceUrl,networkSha256:createHash('sha256').update(networkBytes).digest('hex'),license:'CC BY 4.0',publisher:'VBB',serviceDate:network.metadata.serviceDate,model:'GTFS relative levels and endpoint connections; selected scheduled calls',note:'Level indexes are ordinal, not metres. Connector segments and platform glyphs are symbolic. No measured platform dimensions, rail-deck heights, live lift status or passenger paths.'},origin:[13.4692,52.5033],levels,nodes,platforms,pathways,calls}
await writeFile('public/data/ostkreuz.json',JSON.stringify(artifact)+'\n')
const counts=Object.fromEntries([1,2,4,5].map(mode=>[mode,pathways.filter(p=>p.mode===mode).length]))
console.log(JSON.stringify({nodes:nodes.length,platforms:platforms.length,levels,calls:calls.length,pathways:pathways.length,pathwayModes:counts},null,2))
