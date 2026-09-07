# Ostkreuz: the Ring meets the city

## Implemented scene

The third composition separates upper Ringbahn platforms 11/12 from lower east–west platforms 3–6. The same retained timetable drives the network and station views. Selecting a platform filters upcoming calls; selecting a call pauses at its exact scheduled arrival. A slider collapses or separates the source-relative levels without changing geographic position or time. Connection filters distinguish stairs/escalators from lifts.

The scene is an edition-specific SVG projection consuming shared Motion Studies journey timing. It adds no unpublished package imports. Its data loads on demand and adds 27,200 bytes gzip when opened. The complete source artifact is 310,956 bytes before compression.

## Source package

`scripts/compile-ostkreuz.mjs` joins `stops`, `levels` and `pathways` in the same reviewed VBB ZIP used by the opening. The exact parent station is `de:11000:900120003`; similarly named Beeskow stops and unparented replacement stops are excluded.

- 122 family nodes, including the parent, and 12 platform records.
- Level ID `9`: index 0, `Straßenebene`; platforms 1–8.
- Level ID `179`: index 1, `Zwischengeschoss/Übergang`.
- Level ID `31`: index 2, `Bahnsteig`; platforms 11–14.
- 1,818 internal directed pathway rows: 1,704 walking, 42 stairs, 26 escalator and 46 lift records. These counts are source rows, not counts of physical facilities or passengers.
- 201 retained calls from the selected opening journeys, including calls outside the visible time window. **153 arrivals fall within 07:00 inclusive to 09:00 exclusive.** S41 uses platform 11, S42 uses platform 12; the selected S3/S5/S7 calls use platforms 3–6. Other station services and regional platforms remain outside the animated scope.

The artifact records the VBB source hash and exact compiled-network hash. Every call retains its train ID, call index, platform ID and original arrival/departure times. Source IDs, pathway directionality and supplied traversal times/lengths remain available in `public/data/ostkreuz.json`. Its source is VBB under CC BY 4.0; it does not inherit rights from the DB plan.

## Geometry and meaning

Platform points and local rail paths derive from VBB coordinates. Scheduled positions use the shared `positionForTrain` contract, then sample the corresponding directed geographic path by distance. A train appears only near its station call and within the local scene radius. Station dots represent journeys, not people.

Level indexes are ordinal. Their display separation, the perspective projection and the small platform symbols are authored. They do not provide metre heights, surveyed platform widths/lengths or track deck geometry. The rails are shown at their station platform level locally; this does not establish approach gradients beyond the station.

Connector strokes join supplied endpoint nodes on different levels. They are schematic chords, not measured stair shafts or walkable polylines. Reciprocal records with the same endpoints and mode share one display stroke while retaining all source IDs. Walking edges are retained in data but suppressed in the vertical display to avoid implying a dense forest of physical structures. No passenger flow is inferred, and no shortest-path or live accessibility recommendation is made. Lift availability is unknown.

## Independent cross-check

DB's [official station plan](https://www.bahnhof.de/downloads/station-plans/4809.pdf) was downloaded and its complete single page rendered and visually inspected on 7 September 2026. It confirms the upper Ringbahn platform crossing the lower east–west platforms. No metric deck heights or clear observation date were established from the plan. [Reference receipt](ostkreuz-reference.json).

The PDF is retained locally in ignored `sources/ostkreuz-station-plan.pdf`. Its artwork, geometry, logos and icons are not traced into the app; runtime geometry and topology come from the licensed VBB data. The [operator station page](https://sbahn.berlin/fahren/bahnhofsuebersicht/ostkreuz/) also describes lifts connecting lower tracks with Ringbahn platforms 11/12. Current lift status is not copied into this dated study.

## Next gate

The relative section is implemented and testable. Measured rail heights, platform extents, building structure and approaches need additional authoritative engineering or geodata before the scene can claim a metric physical section. This work does not clear those fields by assigning heights to ordinal levels.
