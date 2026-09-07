import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const bytes=readFileSync('public/data/berlin-morning.json'), data=JSON.parse(bytes), layout=JSON.parse(readFileSync('public/data/ring-layout.json')),lineage=JSON.parse(readFileSync('public/data/lineage.json')),audit=JSON.parse(readFileSync('docs/source-audit.json'))
test('artifact is pinned to the reviewed source and both circulation directions exist',()=>{
 assert.equal(data.metadata.sourceSha256,'be2b1608e038ee1d53b8bfc86974eff37b7af1927a585f5cfcd255a770d84d2b')
 assert.ok(audit.routeCounts.S41>0 && audit.routeCounts.S42>0)
 assert.equal(audit.failedTrips,0)
 assert.equal(new Set(data.trains.map(t=>t.id)).size,data.trains.length)
 assert.equal(createHash('sha256').update(bytes).digest('hex'),audit.artifactSha256)
})
test('every trip retains source identities, monotonic times and a shape for every segment',()=>{
 const ids=new Map(lineage.map(l=>[l.id,l]))
 for(const t of data.trains){
  assert.ok(ids.has(t.id));assert.equal(t.pathSegments.length,t.stops.length-1)
  assert.notEqual(ids.get(t.id).routeType,'700')
  for(let i=0;i<t.stops.length;i++){
   const s=t.stops[i];assert.ok(data.stops[s[0]]);assert.ok(Number.isFinite(s[1])&&s[1]<=s[2])
   if(i){assert.ok(s[1]>=t.stops[i-1][2]);assert.ok(data.paths[t.pathSegments[i-1]].length>=2)}
  }
 }
})
test('the authored diagram covers every source identity and is tied to exact network bytes',()=>{
 assert.equal(layout.metadata.sourceSha256,createHash('sha256').update(bytes).digest('hex'))
 assert.deepEqual(layout.stops.map(s=>s[0]),data.stops.map(s=>s[4]))
 assert.equal(layout.paths.length,data.paths.length)
 assert.ok(layout.paths.flat().every(p=>p.every(Number.isFinite)))
})
test('opening data fits a bounded static payload',()=>{
 assert.ok(audit.gzipBytes<1_500_000,`Opening network ${audit.gzipBytes} bytes gzip`)
})
test('every Ringbahn trip travels in its labelled circulation direction',()=>{
 for(const t of data.trains.filter(t=>['S41','S42'].includes(t.route))){
  let winding=0
  for(const id of t.pathSegments){const points=data.paths[id];for(let i=1;i<points.length;i++){
   const angle=p=>Math.atan2(p[1]-52.509,(p[0]-13.388)*Math.cos(52.509*Math.PI/180))
   const delta=angle(points[i])-angle(points[i-1]);winding+=Math.atan2(Math.sin(delta),Math.cos(delta))
  }}
  assert.ok(t.route==='S41'?winding< -6:winding>6,`${t.id} ${t.route}: ${winding}`)
 }
})
test('direction spacing preserves shared platforms and continuous Ring calls',()=>{
 const routes=new Map()
 for(const t of data.trains.filter(t=>['S41','S42'].includes(t.route)))for(const [i] of t.stops){if(!routes.has(i))routes.set(i,new Set());routes.get(i).add(t.route)}
 const shared=[...routes].filter(([,r])=>r.size===2).map(([i])=>i)
 assert.equal(shared.length,2)
 for(const t of data.trains.filter(t=>['S41','S42'].includes(t.route))){
  let winding=0
  for(let i=0;i<t.pathSegments.length;i++){
   const path=layout.paths[t.pathSegments[i]],from=layout.stops[t.stops[i][0]].slice(1),to=layout.stops[t.stops[i+1][0]].slice(1)
   const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])
   assert.ok(distance(path[0],from)<0.006,`${t.route} departure remains at its platform`)
   assert.ok(distance(path.at(-1),to)<0.006,`${t.route} arrival remains at its platform`)
   for(let j=1;j<path.length;j++){const delta=Math.atan2(path[j][1],path[j][0])-Math.atan2(path[j-1][1],path[j-1][0]);winding+=Math.atan2(Math.sin(delta),Math.cos(delta))}
  }
  assert.ok(t.route==='S41'?winding< -6:winding>6)
 }
 const means=['S41','S42'].map(route=>{const stops=[...routes].filter(([,r])=>r.size===1&&r.has(route)).map(([i])=>layout.stops[i]);return stops.reduce((sum,s)=>sum+Math.hypot(s[1],s[2]),0)/stops.length})
 assert.ok(means[0]-means[1]>0.07,'the two directions are visibly separated in the diagram')
})
