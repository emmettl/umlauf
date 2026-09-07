import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const bytes=await readFile('public/data/berlin-morning.json'), data=JSON.parse(bytes)
const origin=[13.388,52.509], cos=Math.cos(origin[1]*Math.PI/180)
const polar=([lon,lat])=>{const x=(lon-origin[0])*cos,y=lat-origin[1];return {angle:Math.atan2(y,x),radius:Math.hypot(x,y)}}
const ringIds=new Set(data.trains.filter(t=>['S41','S42'].includes(t.route)).flatMap(t=>t.pathSegments))
const samples=[...ringIds].flatMap(i=>data.paths[i]).map(polar).filter(p=>p.radius>0.02).sort((a,b)=>a.angle-b.angle)
const tau=Math.PI*2
function ringRadius(angle) {
  // Median of the closest angular samples balances opposite platform/track geometry.
  const close=samples.map(s=>({distance:Math.abs(Math.atan2(Math.sin(s.angle-angle),Math.cos(s.angle-angle))),radius:s.radius})).sort((a,b)=>a.distance-b.distance).slice(0,9).map(s=>s.radius).sort((a,b)=>a-b)
  return close[Math.floor(close.length/2)]
}
const profile=Array.from({length:720},(_,i)=>ringRadius(i/720*tau-Math.PI))
function project(point){
 const {angle,radius}=polar(point),f=(angle+Math.PI)/tau*720,a=Math.floor(f)%720,b=(a+1)%720,t=f-Math.floor(f)
 const reference=profile[a]*(1-t)+profile[b]*t,r=radius/reference
 return [Number((Math.cos(angle)*r).toFixed(6)),Number((Math.sin(angle)*r).toFixed(6))]
}
// Direction spacing belongs only to this authored layout. Shared source platforms
// keep one position; offset paths return to them over the end fifth of a segment.
const stopRoutes=new Map(),pathRoutes=new Map(),pathStops=new Map()
for(const train of data.trains.filter(t=>['S41','S42'].includes(t.route))){
 for(const [id] of train.stops){if(!stopRoutes.has(id))stopRoutes.set(id,new Set());stopRoutes.get(id).add(train.route)}
 train.pathSegments.forEach((id,i)=>{pathRoutes.set(id,train.route);pathStops.set(id,[train.stops[i][0],train.stops[i+1][0]])})
}
const spacing={S41:0.045,S42:-0.045}
function offset(point,amount){
 const p=project(point),r=Math.hypot(...p)
 return p.map(v=>Number((v*(1+amount/r)).toFixed(6)))
}
const stops=data.stops.map((s,i)=>{const routes=stopRoutes.get(i);return [s[4],...(routes?.size===1?offset(s,spacing[[...routes][0]]):project(s))]})
const paths=data.paths.map((path,id)=>{
 const route=pathRoutes.get(id)
 if(!route)return path.map(project)
 const ends=pathStops.get(id),distance=(a,b)=>Math.hypot((a[0]-b[0])*cos,a[1]-b[1])
 if(distance(path[0],data.stops[ends[0]])>distance(path[0],data.stops[ends[1]]))ends.reverse()
 const shared=ends.map(i=>stopRoutes.get(i).size>1)
 const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+distance(path[i-1],path[i]))
 const smooth=t=>{const c=Math.min(1,Math.max(0,t));return c*c*(3-2*c)}
 return path.map((point,i)=>{const progress=lengths[i]/lengths.at(-1),weight=Math.min(shared[0]?smooth(progress/0.2):1,shared[1]?smooth((1-progress)/0.2):1);return offset(point,spacing[route]*weight)})
})
// A square extent around the authored origin keeps the whole Ring in view.
const points=paths.flat(),extent=Math.max(...points.flat().map(Math.abs))
const result={metadata:{id:'umlauf-circulation',label:'Circulation',kind:'topological',coordinateSpace:'normalized',sourceNetwork:'berlin-morning.json',sourceSha256:createHash('sha256').update(bytes).digest('hex'),feedVersion:data.metadata.feedVersion,model:'Continuous radial normalization by Ringbahn angular radius profile',note:'Authored diagram, not surveyed geography. Same stops, path indexes and timetable progress. All layers use the same radial warp. Ring direction spacing is authored: S41 +0.045 radius, S42 -0.045; shared source platforms remain common, with offsets tapered over the end fifth of each adjoining path. This is not physical track separation. Does not model elevation or social boundaries.'},bounds:{minX:-extent,maxX:extent,minY:-extent,maxY:extent},stops,paths}
await writeFile('public/data/ring-layout.json',JSON.stringify(result)+'\n')
console.log(`Authored layout: ${stops.length} stops, ${paths.length} matching paths`)
