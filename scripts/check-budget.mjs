import {readFile,readdir} from 'node:fs/promises'
import {gzipSync} from 'node:zlib'
// Sum compressed first-view assets, including optional water. Lazy station data/code excluded.
const assets=(await readdir('dist/assets')).filter(f=>/^index-.*\.(js|css)$/.test(f)).map(f=>`dist/assets/${f}`)
const files=['dist/index.html','dist/favicon.svg',...assets,...['berlin-morning.json','ring-layout.json','berlin-water.json'].map(f=>`dist/data/${f}`)]
let total=0
for(const file of files){const gzip=gzipSync(await readFile(file)).length;total+=gzip;console.log(`${file}: ${gzip} bytes gzip`)}
console.log(`Opening total: ${total} / ${575*1024} bytes gzip`)
if(total>575*1024)throw Error('Opening transfer budget exceeded')
