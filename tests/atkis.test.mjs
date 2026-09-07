import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {gzipSync} from 'node:zlib'

const hash=b=>createHash('sha256').update(b).digest('hex')
test('official bridge retains exact source geometry, Ringbahn relationship and separate height uncertainty',async()=>{
 const root='data/sources/atkis-20260907',receiptBytes=await readFile(`${root}/receipt.json`),receipt=JSON.parse(receiptBytes)
 for(const entry of receipt.files){const bytes=await readFile(`${root}/${entry.file}`);assert.equal(hash(bytes),entry.sha256);assert.equal(bytes.length,entry.bytes)}
 const bytes=await readFile('public/data/ostkreuz-bridge.json'),d=JSON.parse(bytes)
 assert.equal(d.metadata.sourceReceiptSha256,hash(receiptBytes))
 assert.equal(d.metadata.stationSha256,hash(await readFile('public/data/ostkreuz.json')))
 const source=JSON.parse(await readFile(`${root}/c07_ax_bauwerkimverkehrsbereich_f.json`))
 assert.equal(source.numberMatched,source.numberReturned)
 assert.deepEqual(d.bridge,source.features.find(f=>f.properties.uuid==='DEBEATKB10000iKp'))
 assert.equal(d.rail.properties.hdu,d.bridge.properties.uuid)
 assert.equal(d.bridge.properties.bwf,'1800')
 assert.equal(d.rail.properties.nrb,'6020')
 assert.equal(d.metadata.heightMetres,null)
 assert.equal(d.metadata.license,'dl-de-zero-2.0')
 assert.ok(d.bridge.geometry.coordinates.flat(2).every(p=>p.length===2))
 assert.ok(gzipSync(bytes).length<3000)
})
