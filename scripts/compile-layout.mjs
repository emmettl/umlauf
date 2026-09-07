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
const stops=data.stops.map(s=>[s[4],...project(s)])
const paths=data.paths.map(path=>path.map(project))
const points=paths.flat()
const result={metadata:{id:'umlauf-circulation',label:'Circulation',kind:'topological',coordinateSpace:'normalized',sourceNetwork:'berlin-morning.json',sourceSha256:createHash('sha256').update(bytes).digest('hex'),feedVersion:data.metadata.feedVersion,model:'Continuous radial normalization by Ringbahn angular radius profile',note:'Authored diagram, not surveyed geography. Same stops, path indexes and timetable progress. All layers use the same spatial warp. Does not model elevation or social boundaries.'},bounds:{minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))},stops,paths}
await writeFile('public/data/ring-layout.json',JSON.stringify(result)+'\n')
console.log(`Authored layout: ${stops.length} stops, ${paths.length} matching paths`)
