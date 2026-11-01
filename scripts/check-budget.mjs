import {readFile} from 'node:fs/promises'
import {gzipSync} from 'node:zlib'
// Sum compressed first-view assets, including optional water. Lazy station data/code excluded.
// Include entry code/styles and every static module preload. Splitting a vendor
// module must not make it disappear from the opening budget; lazy chunks stay out.
const html=await readFile('dist/index.html','utf8')
const assets=[...new Set([...html.matchAll(/(?:src|href)=["']\.\/(assets\/[^"']+\.(?:js|css))["']/g)].map(match=>`dist/${match[1]}`))]
if(!assets.some(file=>file.endsWith('.js')))throw Error('No opening JavaScript found in built HTML')
const files=['dist/index.html','dist/favicon.svg',...assets,...['berlin-morning.json','ring-layout.json','berlin-water.json'].map(f=>`dist/data/${f}`)]
let total=0
for(const file of files){const gzip=gzipSync(await readFile(file)).length;total+=gzip;console.log(`${file}: ${gzip} bytes gzip`)}
console.log(`Opening total: ${total} / ${575*1024} bytes gzip`)
if(total>575*1024)throw Error('Opening transfer budget exceeded')
