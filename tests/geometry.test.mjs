import test from 'node:test'
import assert from 'node:assert/strict'
import { matchCalls, selectRoute } from '../scripts/geometry.mjs'

test('Ringbahn replacement buses and another operator’s S1 cannot become Berlin trains',()=>{
 const row={agency_id:'1',route_type:'109',route_short_name:'S41'}
 assert.equal(selectRoute(row),'s-bahn')
 assert.equal(selectRoute({...row,route_type:'700'}),undefined)
 assert.equal(selectRoute({agency_id:'108',route_type:'109',route_short_name:'S1'}),undefined)
})
test('a repeated terminal advances around the complete loop',()=>{
 const points=[[13,52],[13.01,52],[13.01,52.01],[13,52.01],[13,52]]
 const matches=matchCalls(points,points)
 assert.ok(matches.at(-1).index>3.99)
 assert.ok(matches.every((m,i)=>!i||m.index>matches[i-1].index))
})
test('station matching projects onto sparse segments rather than snapping to vertices',()=>{
 const matches=matchCalls([[13,52],[13.01,52]],[[13.002,52],[13.008,52]])
 assert.ok(matches.every(m=>m.distance<0.01))
 assert.ok(Math.abs(matches[0].index-0.2)<0.0001)
})
test('a remote stop fails instead of inventing a straight-line connection',()=>{
 assert.throws(()=>matchCalls([[13,52],[13.01,52]],[[14,53]]),/exceeds/)
})
