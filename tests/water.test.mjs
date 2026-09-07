import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {gzipSync} from 'node:zlib'
const hash=b=>createHash('sha256').update(b).digest('hex')
test('water retains complete source receipts, bounded polygons and island holes',async()=>{
 const receiptBytes=await readFile('docs/water-receipt.json'),receipt=JSON.parse(receiptBytes)
 const bytes=await readFile('public/data/berlin-water.json'),water=JSON.parse(bytes)
 assert.equal(water.metadata.receiptSha256,hash(receiptBytes))
 const ids=new Set()
 for(const source of receipt.sources){const bytes=await readFile(source.file);assert.equal(hash(bytes),source.sha256);const collection=JSON.parse(bytes);assert.equal(collection.numberMatched,collection.features.length);collection.features.forEach(f=>ids.add(f.id))}
 assert.ok(water.lakes.length>0)
 assert.ok(water.lakes.some(l=>l.polygons.some(p=>p.length>1)),'island holes survive')
 for(const lake of water.lakes){assert.ok(ids.has(lake.id));assert.ok(lake.areaSquareKilometres>0);for(const polygon of lake.polygons)for(const ring of polygon){assert.deepEqual(ring[0],ring.at(-1));for(const [lon,lat]of ring){assert.ok(lon>=13.235&&lon<=13.525);assert.ok(lat>=52.435&&lat<=52.600)}}}
 assert.ok(gzipSync(bytes).length<65*1024)
})
