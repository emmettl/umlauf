# Berlin source contract

## Retained evidence

VBB GTFS, generated 3 September 2026; source URL `https://unternehmen.vbb.de/gtfs`; SHA-256 `be2b1608e038ee1d53b8bfc86974eff37b7af1927a585f5cfcd255a770d84d2b`. The archive was acquired during the Motion Studies audit on 6 September; its original acquisition time of day was not retained. The same bytes were verified on 7 September and copied into this edition's local source archive. This is a retained release, not a claim that a fresh current feed was downloaded.

The [official VBB page](https://unternehmen.vbb.de/digitale-services/datensaetze/) was freshly retained with timestamp, byte count and hash in [the licence receipt](licence-receipt.json). It assigns CC BY 4.0. The full source page and GTFS remain locally in ignored `sources/`; preserve those files in durable source storage before cleaning that folder. Attribution and modifications appear in the app and every runtime network's metadata. No operator logos, network-map artwork or live services are used.

## Compilation

`scripts/compile-vbb.mjs` uses the published Motion Studies GTFS reader and active-service calendar resolution, including calendar exceptions. The pinned release's frequency table is empty. The opening is Monday 7 September 2026, 07:00–09:00 Europe/Berlin. Source GTFS times remain seconds from the service-day origin, including hours beyond 24 where present.

Operator and extended route type are selected together: S-Bahn Berlin agency `1`, rail type `109`; BVG agency `796`, metro type `400` or tram type `900`. Another operator's S1 and replacement buses named S41/S42 are excluded. The complete selected/excluded route records are in [the audit](source-audit.json).

The geographic bounds are longitude 13.235–13.525, latitude 52.435–52.600. Trips retain consecutive in-bounds stops and their original call times; an outside excursion splits a run rather than being bridged. Runs not overlapping the opening are excluded. The initial time-overlap selection had 618 trips; 585 contain a usable in-bounds run overlapping the opening. Lineage retains trip, route, agency, service, shape, direction and original stop sequence. Trips are not stitched into physical vehicles. Counts displayed by the app count active scheduled journeys, including timetable dwell, not passengers.

Retained stops are projected onto directed shape segments monotonically. The order constraint matters when a Ringbahn trip returns to its starting station. All retained calls pass a 120m matching ceiling; the observed maximum offset is 27.5m. The limit is a compiler validation threshold, not an assertion of survey accuracy. Vertices are reduced by 15m spacing and rounded to six decimal places; stop endpoints are retained. That spacing is not a measured Hausdorff error bound. Each path is keyed by its shape section and endpoint identities. Missing or invalid selected geometry/timing aborts compilation rather than substituting straight lines.

The first pass found a 223.8m S2 mismatch at Lichtenrade, outside the opening. Restricting shape matching to retained in-bounds calls resolved that irrelevant gate; it does not repair or certify the excluded southern geometry. Temporal ordering is still checked across all calls of each selected source trip.

`scripts/compile-layout.mjs` generates an authored radial transformation using the Ringbahn's angular radius profile around an explicit origin. All modes pass through the same radial transformation. In the authored diagram, S41 receives a +0.045 normalized radial offset and S42 −0.045, making amber the outer direction and mint the inner. Shared source platforms at Halensee and Hohenzollerndamm keep their common position; adjoining offsets taper smoothly to zero over the end fifth of the path. Dedicated platform positions receive the same offset as their paths. This is diagram spacing, not physical track separation. Geographic source coordinates and timetable bytes are unchanged. Paths and stops maintain exactly matching indexes/identities; the layout records the exact runtime-network hash. A square display extent centred on the authored origin frames the complete Ring; this changes framing, not source coordinates. Geographic distance and metric scale change. The diagram is not an operator map or measured physical geometry.

## Evidence limits

Motion is timetable interpolation, not observed position. Count panels are scheduled journeys, not vehicle occupancy or passenger demand. The network ground plane does not encode rail elevation: network track vertical states remain unknown in lineage. The separate [Ostkreuz relative section](OSTKREUZ.md) adds source platform levels and endpoint connections with illustrative separation. Absolute rail elevations, terrain, buildings and water geometry remain unestablished. The [engineering review](ENGINEERING.md) now supplies cited net built lengths and platform heights above rail as explanatory facts; these do not set geometry. Realtime corrections remain outside the source contract until a matched, measured recording is available.

The [ATKIS bridge layer](ATKIS.md) adds an official two-dimensional footprint to the relative station scene. Its independent Germany Zero 2.0 source package is committed in `data/sources/atkis-20260907/`; it does not alter VBB lineage or establish metre heights.

The complete compiled network is 836,314 bytes, about 123,483 bytes gzip. Its diagram is about 49,056 bytes gzip. The production JavaScript includes the shared Three.js renderer; see the build output for its separate transfer cost. These sizes do not prove a physical phone frame budget.
