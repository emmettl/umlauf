import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { localPoint, localTrainPoint, samplePath, screenPoint, verticalConnections } from '../src/ostkreuz-model.ts'
const bytes=readFileSync('public/data/berlin-morning.json'),network=JSON.parse(bytes),stationBytes=readFileSync('public/data/ostkreuz.json'),station=JSON.parse(stationBytes)
test('station levels and calls are pinned to the exact opening network',()=>{
 assert.equal(station.metadata.networkSha256,createHash('sha256').update(bytes).digest('hex'))
 assert.equal(station.metadata.sourceSha256,network.metadata.sourceSha256)
 assert.equal(station.nodes.length,122);assert.equal(station.platforms.length,12);assert.equal(station.calls.length,201)
 const levels=new Map(station.levels.map(l=>[l.id,l.index]))
 for(const p of station.platforms)assert.equal(levels.get(p.levelId),Number(p.platform)>=11?2:0)
 for(const c of station.calls){
  const t=network.trains.find(t=>t.id===c.trainId),call=t.stops[c.callIndex]
  assert.equal(network.stops[call[0]][4],c.platformId);assert.equal(call[1],c.arrival);assert.equal(call[2],c.departure)
  const p=station.platforms.find(p=>p.id===c.platformId)
  if(c.route==='S41')assert.equal(p.platform,'11')
  if(c.route==='S42')assert.equal(p.platform,'12')
 }
 assert.ok(gzipSync(stationBytes).length<40_000)
})
test('connector groups preserve raw source identities and filter by mode',()=>{
 const ids=new Set(station.nodes.map(n=>n.id)),sources=new Set(station.pathways.map(p=>p.id))
 for(const p of station.pathways){assert.ok(ids.has(p.from)&&ids.has(p.to))}
 const lifts=verticalConnections(station,'lifts'),stairs=verticalConnections(station,'stairs')
 assert.ok(lifts.length>0&&stairs.length>0)
 for(const link of lifts){assert.equal(link.mode,5);assert.ok(link.sourceIds.every(id=>sources.has(id)));assert.notEqual(link.from.levelId,link.to.levelId)}
 assert.ok(stairs.every(p=>[2,4].includes(p.mode)))
 assert.ok(new Set(lifts.flatMap(l=>l.sourceIds)).size===lifts.reduce((sum,l)=>sum+l.sourceIds.length,0))
})
test('level separation changes only display height, not geography or timetable position',()=>{
 const call=station.calls.find(c=>c.route==='S41'),t=network.trains.find(t=>t.id===call.trainId),p=station.platforms.find(p=>p.id===call.platformId)
 const point=localTrainPoint(t,call.arrival,network,station.origin)
 const expected=localPoint([p.longitude,p.latitude],station.origin)
 assert.ok(Math.hypot(point[0]-expected[0],point[1]-expected[1])<0.001)
 assert.deepEqual(screenPoint(point,0,0),screenPoint(point,0,1))
 assert.equal(screenPoint(point,2,0)[0],screenPoint(point,2,1)[0])
 assert.equal(screenPoint(point,2,0)[1]-screenPoint(point,2,1)[1],144)
 assert.deepEqual(samplePath([[0,0],[10,0],[10,30]],.5),[10,10])
})
test('station arrival tilts the same geography before exposing relative levels',()=>{
 const point=[70,-35]
 assert.deepEqual(screenPoint(point,0,0,0),[544.5,387.25])
 assert.deepEqual(screenPoint(point,2,0,0),screenPoint(point,0,0,0))
 for(let i=0;i<=10;i++){
  const t=i/10,lower=screenPoint(point,0,t,t),upper=screenPoint(point,2,t,t)
  assert.ok(lower.every(Number.isFinite)&&upper.every(Number.isFinite))
  assert.equal(lower[0],upper[0]);assert.ok(Math.abs(lower[1]-upper[1]-144*t)<1e-10)
 }
 assert.deepEqual(screenPoint(point,2,1,1),screenPoint(point,2,1))
})
