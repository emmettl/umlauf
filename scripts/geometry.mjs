export function metres(a, b) {
  const x = (a[0] - b[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360) * 111320
  const y = (a[1] - b[1]) * 111320
  return Math.hypot(x, y)
}

// Advance through a directed GTFS shape: repeated Ringbahn stations must match
// their later occurrence, never jump backwards to the start of a circuit.
export function matchCalls(points, stops, limit = 120) {
  let cursor = 0
  const matches = []
  for (const stop of stops) {
    let best = -1, distance = Infinity
    for (let i = Math.floor(cursor); i < points.length-1; i++) {
      const a=points[i], b=points[i+1], scale=Math.cos(stop[1]*Math.PI/180)
      const dx=(b[0]-a[0])*scale, dy=b[1]-a[1]
      const denominator=dx*dx+dy*dy
      const t=Math.max(Math.max(0,cursor-i),Math.min(1,denominator ? (((stop[0]-a[0])*scale*dx+(stop[1]-a[1])*dy)/denominator) : 0))
      if (t>1) continue
      const d = metres([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t], stop)
      if (d < distance - 0.01) { best = i+t; distance = d }
      // First close local minimum avoids choosing a later circuit's near-identical point.
      if (distance < 30 && d > distance + 70) break
    }
    if (best < 0 || distance > limit) throw new Error(`Shape match ${distance.toFixed(1)}m exceeds ${limit}m`)
    matches.push({ index: best, distance })
    cursor = best + 0.000001
  }
  return matches
}

export function simplify(points, spacing = 15) {
  if (points.length < 3) return points
  const result = [points[0]]
  for (const point of points.slice(1, -1)) if (metres(result.at(-1), point) >= spacing) result.push(point)
  result.push(points.at(-1))
  return result
}

export function inside([lon, lat], bounds) {
  return lon >= bounds.minLongitude && lon <= bounds.maxLongitude && lat >= bounds.minLatitude && lat <= bounds.maxLatitude
}

export function selectRoute(row) {
  if (row.agency_id === '1' && row.route_type === '109' && ['S41','S42','S1','S2','S3','S5','S7','S9'].includes(row.route_short_name)) return 's-bahn'
  if (row.agency_id === '796' && row.route_type === '400' && ['U2','U6','U8'].includes(row.route_short_name)) return 'metro'
  if (row.agency_id === '796' && row.route_type === '900' && row.route_short_name === 'M10') return 'tram'
}
