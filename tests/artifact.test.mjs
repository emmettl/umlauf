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
