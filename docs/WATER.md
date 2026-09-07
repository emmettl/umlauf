# Berlin water context

The official [Berlin ATKIS WFS catalogue](https://daten.berlin.de/datensaetze/atkis-basis-dlm-prasentationsdienst-wfs-d4316e05) identifies the publisher and Germany Zero 2.0 licence. The retained catalogue/licence evidence for the earlier ATKIS audit also applies to these layers; the catalogue was rechecked on 7 September 2026.

`docs/water-receipt.json` records the exact WFS requests, retrieval timestamps, byte sizes and hashes. Raw responses are committed under `data/sources/water-20260907/`: 86 flowing-water and 18 harbour-basin features. Both responses report complete matched/returned counts. The bbox query returns intersecting full geometries, so it is not itself a crop.

`npm run data:water` verifies those hashes and intersects each polygon with 13.235–13.525° E, 52.435–52.600° N using pinned polygon-clipping 0.15.7. The output retains 102 feature records after two boundary-only intersections disappear. Polygon holes and all supplied vertices are retained, with coordinates rounded to six decimals after clipping. There is no geometric simplification or minimum-area exclusion. Source feature IDs remain attached. Areas are approximate local planar calculations, not survey measurements.

The service accepts an explicit CRS84 bbox and EPSG:4326 output; returned GeoJSON is longitude, latitude. Retrieval and catalogue dates are not survey dates. No water-level elevation is inferred.

The 47,718-byte gzip browser artifact is optional and loads on demand. It opens enabled on desktop and disabled on phones, where it can be enabled explicitly. Failure leaves the railway usable. It fades while the geographic railway transforms, and is omitted entirely at full circulation; the water is not warped into an asserted diagram. Standing-water/lake coverage is not comprehensive: this bounded first layer is flowing water and harbour basins. Terrain is deferred because it does not currently strengthen the Ring argument enough to justify another payload and height interpretation.
