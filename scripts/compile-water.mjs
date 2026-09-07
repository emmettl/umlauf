import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import clipping from 'polygon-clipping'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const receipt=JSON.parse(await readFile('docs/water-receipt.json','utf8'))
const [west,south,east,north]=receipt.bbox
const crop=[[[west,south],[east,south],[east,north],[west,north],[west,south]]]
const lakes=[]
for(const source of receipt.sources){
 const bytes=await readFile(source.file)
 if(hash(bytes)!==source.sha256)throw Error(`Source changed: ${source.file}`)
 const collection=JSON.parse(bytes)
 if(collection.numberMatched!==collection.features.length)throw Error('Truncated water source')
 for(const feature of collection.features){
  if(!['Polygon','MultiPolygon'].includes(feature.geometry.type))throw Error('Unexpected water geometry')
  const polygons=clipping.intersection(feature.geometry.coordinates,crop)
  if(!polygons.length)continue
  // Preserve all supplied vertices and island rings. Round only after clipping.
  const rounded=polygons.map(p=>p.map(r=>r.map(c=>c.map(v=>Number(v.toFixed(6))))))
  const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+(p[0]-west)*(q[1]-south)-(q[0]-west)*(p[1]-south)},0)/2)*111.195**2*Math.cos(52.5175*Math.PI/180)
  lakes.push({id:feature.id,name:feature.properties.nam??'Unnamed mapped water',areaSquareKilometres:rounded.reduce((sum,[outer,...holes])=>sum+area(outer)-holes.reduce((s,r)=>s+area(r),0),0),polygons:rounded})
 }
}
const result={metadata:{source:receipt.provider,sourceUrl:'https://gdi.berlin.de/services/wfs/atkis',productUrl:receipt.catalogue,edition:'Retrieved 7 September 2026; not a survey date',attribution:'Berlin ATKIS · Germany Zero 2.0',sourceCrs:receipt.crs,outputCrs:'WGS84 longitude, latitude',simplificationToleranceMetres:0,minimumAreaSquareKilometres:0,processing:'Polygon intersection with opening bounds; island rings preserved; six decimal coordinates; approximate local planar areas. No vertex simplification.',receiptSha256:hash(await readFile('docs/water-receipt.json')),bbox:receipt.bbox},lakes}
await writeFile('public/data/berlin-water.json',JSON.stringify(result)+'\n')
console.log(`${lakes.length} water records; ${lakes.flatMap(l=>l.polygons).length} polygons`)
