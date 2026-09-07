import test from 'node:test'
import assert from 'node:assert/strict'
import {advanceTravel} from '../src/useInterchangeTravel.ts'
test('travel follows elapsed time even when rendering drops frames',()=>{
 let progress=advanceTravel(0,1,800)
 assert.ok(progress>0.2&&progress<0.8)
 assert.equal(advanceTravel(progress,1,2000),1)
 assert.equal(advanceTravel(progress,0,800),0)
 assert.equal(advanceTravel(1,0,5000),0)
 assert.equal(advanceTravel(0,1,5000),1)
})
