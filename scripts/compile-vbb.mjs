import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { activeServices, rowsFromArchive, parseGtfsTime } from '@motionstudies/data/gtfs'
import { inside, matchCalls, simplify, selectRoute } from './geometry.mjs'

const archive = process.argv[2] ?? 'sources/vbb-20260903.zip'
const serviceDate = process.argv[3] ?? '2026-09-07'
const sourceSha256 = createHash('sha256').update(await readFile(archive)).digest('hex')
const pinnedSha = 'be2b1608e038ee1d53b8bfc86974eff37b7af1927a585f5cfcd255a770d84d2b'
if (sourceSha256 !== pinnedSha) throw new Error('Unreviewed archive: update the source contract before compiling a different release')
const windowStart = 7 * 3600, windowEnd = 9 * 3600
const bounds = { minLongitude: 13.235, minLatitude: 52.435, maxLongitude: 13.525, maxLatitude: 52.60 }
const active = await activeServices(archive, serviceDate)
const routes = new Map(), excludedRoutes = []
for await (const row of rowsFromArchive(archive, 'routes.txt')) {
  const category = selectRoute(row)
  if (category) routes.set(row.route_id, { ...row, category })
  else if (['S41','S42'].includes(row.route_short_name)) excludedRoutes.push(row)
}
const stops = new Map()
for await (const row of rowsFromArchive(archive, 'stops.txt')) stops.set(row.stop_id, { ...row, coordinate: [Number(row.stop_lon), Number(row.stop_lat)] })
const trips = new Map()
for await (const row of rowsFromArchive(archive, 'trips.txt')) {
  if (routes.has(row.route_id) && active.has(row.service_id)) trips.set(row.trip_id, { ...row, calls: [] })
}
console.log(`Selected ${routes.size} route records, ${trips.size} active service-day trips`)
for await (const row of rowsFromArchive(archive, 'stop_times.txt')) {
  const trip = trips.get(row.trip_id)
  if (trip) trip.calls.push({ stopId: row.stop_id, sequence: Number(row.stop_sequence), arrival: parseGtfsTime(row.arrival_time), departure: parseGtfsTime(row.departure_time) })
}
const selected = [...trips.values()].filter(trip => {
  trip.calls.sort((a,b) => a.sequence-b.sequence)
  return trip.calls.length > 1 && trip.calls[0].arrival < windowEnd && trip.calls.at(-1).departure > windowStart
})
const shapeIds = new Set(selected.map(t => t.shape_id)), shapes = new Map()
for await (const row of rowsFromArchive(archive, 'shapes.txt')) {
  if (!shapeIds.has(row.shape_id)) continue
  const points = shapes.get(row.shape_id) ?? []
  points.push([Number(row.shape_pt_lon), Number(row.shape_pt_lat), Number(row.shape_pt_sequence)])
  shapes.set(row.shape_id, points)
}
for (const [id, points] of shapes) shapes.set(id, points.sort((a,b) => a[2]-b[2]).map(p => p.slice(0,2)))
console.log(`Matching ${selected.length} trips against ${shapes.size} directed shapes`)
const outputStops = [], stopIndexes = new Map(), paths = [], edges = [], edgePaths = [], pathIds = new Map(), trains = [], lineage = [], failures = []
let maxSnapMetres = 0
function stopIndex(id) {
  if (!stopIndexes.has(id)) {
    const s = stops.get(id)
    const name = s.stop_name.replace(/^(S\+U |S |U )/, '').replace(/ \(Berlin\)/g, '')
    const rank = /Ostkreuz|Westkreuz|Südkreuz|Gesundbrunnen/.test(name) ? 1 : /Hauptbahnhof|Alexanderplatz|Friedrichstr|Potsdamer|Schönhauser|Warschauer|Hermannstr/.test(name) ? 2 : 3
    stopIndexes.set(id, outputStops.length)
    outputStops.push([...s.coordinate, name, s.platform_code ?? '', id, rank])
  }
  return stopIndexes.get(id)
}
for (const trip of selected) {
  const route = routes.get(trip.route_id), shape = shapes.get(trip.shape_id)
  let matches
  try {
    if (!shape?.length) throw new Error('Missing shape')
    for (let i=0;i<trip.calls.length;i++) {
      const call=trip.calls[i]
      if (!stops.has(call.stopId) || !Number.isFinite(call.arrival) || call.arrival > call.departure || (i && call.arrival < trip.calls[i-1].departure)) throw new Error('Invalid call identity/timing')
    }
    const localCalls = trip.calls.map((call,index)=>({call,index})).filter(({call})=>inside(stops.get(call.stopId).coordinate,bounds))
    const localMatches = matchCalls(shape, localCalls.map(({call}) => stops.get(call.stopId).coordinate))
    matches = new Map(localCalls.map(({index},i)=>[index,localMatches[i]]))
  } catch (error) { failures.push({ tripId: trip.trip_id, route: route.route_short_name, error: error.message }); continue }
  maxSnapMetres = Math.max(maxSnapMetres, ...[...matches.values()].map(m => m.distance))
  // Contiguous in-bounds runs only: never bridge an omitted excursion.
  const runs = []; let run = []
  trip.calls.forEach((call, index) => {
    if (inside(stops.get(call.stopId).coordinate, bounds)) run.push(index)
    else { if (run.length > 1) runs.push(run); run = [] }
  })
  if (run.length > 1) runs.push(run)
  for (const [part, indexes] of runs.entries()) {
    const calls = indexes.map(i => trip.calls[i])
    if (calls[0].arrival >= windowEnd || calls.at(-1).departure <= windowStart) continue
    const segments = []
    for (let j=1;j<indexes.length;j++) {
      const a=indexes[j-1], b=indexes[j]
      const key=`${trip.shape_id}:${matches.get(a).index}:${matches.get(b).index}:${trip.calls[a].stopId}:${trip.calls[b].stopId}`
      if (!pathIds.has(key)) {
        const points = simplify([stops.get(trip.calls[a].stopId).coordinate, ...shape.slice(Math.ceil(matches.get(a).index), Math.floor(matches.get(b).index)+1), stops.get(trip.calls[b].stopId).coordinate]).map(p => p.map(v => Number(v.toFixed(6))))
        pathIds.set(key, paths.length); paths.push(points)
        edges.push([stopIndex(trip.calls[a].stopId), stopIndex(trip.calls[b].stopId)])
        edgePaths.push(paths.length-1)
      }
      segments.push(pathIds.get(key))
    }
    const id=`vbb:${trip.trip_id}:${part}`
    trains.push({ id, route: route.route_short_name, shortName: route.route_short_name, headsign: trip.trip_headsign, category: route.category, mode: route.category === 's-bahn' ? 'rail' : route.category, start: calls[0].arrival, end: calls.at(-1).departure, stops: calls.map(c => [stopIndex(c.stopId),c.arrival,c.departure]), pathSegments: segments })
    lineage.push({ id, tripId: trip.trip_id, routeId: trip.route_id, agencyId: route.agency_id, routeType: route.route_type, serviceId: trip.service_id, shapeId: trip.shape_id, directionId: trip.direction_id, originalStopSequences: indexes.map(i=>trip.calls[i].sequence), cropped: calls.length !== trip.calls.length, verticalState: 'unknown' })
  }
}
if (failures.length) {
  await writeFile('docs/geometry-failures.json', JSON.stringify(failures,null,2)+'\n')
  throw new Error(`${failures.length} shape/timing failures; see docs/geometry-failures.json. No partial artifact emitted.`)
}
const routeCounts = Object.fromEntries([...new Set(trains.map(t=>t.route))].sort().map(r=>[r,trains.filter(t=>t.route===r).length]))
if (!routeCounts.S41 || !routeCounts.S42) throw new Error('Both Ringbahn directions are required')
const metadata = {
  publisher: 'Verkehrsverbund Berlin-Brandenburg (VBB)', feedVersion: 'VBB GTFS generated 2026-09-03', serviceDate,
  windowStart, windowEnd, focusTime: 8*3600, sourceUrl: 'https://unternehmen.vbb.de/gtfs', sourceSha256,
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  model: 'scheduled-stop-time-interpolation',
  note: 'Scheduled journeys interpolated along directed GTFS shapes. Retained archive audited 2026-09-06 and hash-verified 2026-09-07; original retrieval time of day was not recorded. Cropped at consecutive in-bounds stops; no trip stitching. Source route/mode identity is retained in lineage.json. Track heights are unknown; display is plan geometry.',
  modes: ['rail','metro','tram'], localAgencyIds: ['1','796'], localRouteIds: [...routes.keys()],
  geometry: { publisher:'VBB', feedVersion:'2026-09-03',sourceUrl:'https://unternehmen.vbb.de/gtfs',sourceSha256,model:'Directed monotonic stop-to-shape matching; 15m vertex spacing; stop endpoints retained',matchedSegments:paths.length,totalSegments:paths.length,simplificationToleranceMetres:15 }
}
const snapshot={ metadata,bounds,stops:outputStops,edges,paths,edgePaths,trains }
await mkdir('public/data',{recursive:true})
const bytes=JSON.stringify(snapshot)
await writeFile('public/data/berlin-morning.json',bytes+'\n')
await writeFile('public/data/lineage.json',JSON.stringify(lineage)+'\n')
const audit={ serviceDate,timezone:'Europe/Berlin',sourceSha256,selectedRoutes:[...routes.values()],excludedRingRoutes:excludedRoutes,selectedTrips:trains.length,routeCounts,stops:outputStops.length,paths:paths.length,maxSnapMetres:Number(maxSnapMetres.toFixed(2)),failedTrips:failures.length,bytes:Buffer.byteLength(bytes+'\n'),gzipBytes:gzipSync(bytes+'\n').length,artifactSha256:createHash('sha256').update(bytes+'\n').digest('hex'),verticalState:'unknown',scheduled:true }
await writeFile('docs/source-audit.json',JSON.stringify(audit,null,2)+'\n')
console.log(JSON.stringify({routeCounts,stops:audit.stops,paths:audit.paths,maxSnapMetres:audit.maxSnapMetres,bytes:audit.bytes,gzipBytes:audit.gzipBytes},null,2))
