import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const root='data/sources/atkis-20260907'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const receipt=JSON.parse(await readFile(`${root}/receipt.json`))
for(const entry of receipt.files){
 const bytes=await readFile(`${root}/${entry.file}`)
 if(hash(bytes)!==entry.sha256||bytes.length!==entry.bytes)throw new Error(`Source receipt mismatch: ${entry.file}`)
}
const layers={}
for(const entry of receipt.files.filter(e=>e.file.endsWith('.json'))){
 const data=JSON.parse(await readFile(`${root}/${entry.file}`))
 if(data.numberMatched!==data.features.length||data.numberReturned!==data.features.length)throw new Error(`Incomplete WFS slice: ${entry.file}`)
 layers[entry.file]=data.features
}
const rail=layers['b11_ax_bahnstrecke_l.json'].find(f=>f.properties.uuid==='DEBEATKB1bq0000X')
const bridge=layers['c07_ax_bauwerkimverkehrsbereich_f.json'].find(f=>f.properties.uuid===rail?.properties.hdu)
if(!rail||rail.properties.nrb!=='6020'||!rail.properties.nrl.split(':').includes('S41')||!rail.properties.nrl.split(':').includes('S42')||bridge?.properties.uuid!=='DEBEATKB10000iKp'||bridge.properties.bwf!=='1800')throw new Error('Reviewed Ringbahn/bridge relationship changed')
if(bridge.geometry.type!=='MultiPolygon'||bridge.geometry.coordinates.flat(2).some(p=>p.length!==2||!p.every(Number.isFinite)||p[0]<13.46||p[0]>13.48||p[1]<52.50||p[1]>52.51))throw new Error('Unexpected bridge geometry or axis order')
const stationBytes=await readFile('public/data/ostkreuz.json'),station=JSON.parse(stationBytes)
const artifact={metadata:{publisher:receipt.publisher,license:receipt.license,licenseUrl:receipt.licenseUrl,sourceUrl:receipt.files.find(e=>e.file==='atkis-licence.html').url,sourceReceiptSha256:hash(await readFile(`${root}/receipt.json`)),stationSha256:hash(stationBytes),stationId:station.metadata.stationId,coordinateModel:'2D longitude/latitude footprint; displayed on the relative upper station level',heightMetres:null,catalogueUpdated:receipt.catalogueUpdated,note:'Bridge outline from ATKIS; no surveyed deck height, thickness, platform boundaries or approach gradients.'},origin:station.origin,bridge,rail}
await writeFile('public/data/ostkreuz-bridge.json',JSON.stringify(artifact)+'\n')
const all=Object.values(layers).flat()
const inventory={bbox:receipt.bbox,layers:Object.fromEntries(Object.entries(layers).map(([name,features])=>[name,features.length])),coordinateDimensions:[...new Set(all.flatMap(f=>f.geometry.coordinates.flat(f.geometry.type==='MultiPolygon'?2:1).map(p=>p.length)))],selectedRailId:rail.id,selectedBridgeId:bridge.id,relation:{field:'hdu',target:rail.properties.hdu},metricRailHeights:'not present in the inspected 2D geometries or attributes',stationPolygons:'Both station polygons are class Bahnhof; neither establishes individual platform extents.'}
await writeFile('docs/atkis-audit.json',JSON.stringify(inventory,null,2)+'\n')
console.log(JSON.stringify(inventory,null,2))
