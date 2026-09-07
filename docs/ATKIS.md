# Ostkreuz official bridge evidence — 7 September 2026

## What this clears

Berlin's official ATKIS WFS supplies a mapped bridge footprint at Ostkreuz. Railway feature `DEBEATKB1bq0000X`, infrastructure route 6020 with source line references S41/S42/S8/S85, carries `hdu: DEBEATKB10000iKp`. That target is a polygon classified `Brücke` (`bwf: 1800`). The selected polygon now appears as a switchable outline on the station's relative upper plane. Its coordinates are preserved exactly; the projection and vertical placement remain illustrative.

The source line references provide an infrastructure cross-check, not a new service calendar. VBB continues to determine all animated journeys. No citywide GTFS-to-ATKIS geometry join or network-wide vertical classification has been performed.

## Acquisition and rights

The [Berlin dataset catalogue](https://daten.berlin.de/datensaetze/atkis-basis-dlm-prasentationsdienst-wfs-d4316e05) explicitly assigns [Germany Zero 2.0](https://www.govdata.de/dl-de/zero-2-0). Catalogue update: 31 July 2026. Four WFS GetFeature requests returned 126 features in total: 103 railway lines, two station polygons, eight transport-structure polygons and thirteen transport-structure lines. All matched rows were returned. Request URLs, timestamps, hashes and retained bytes are in [the receipt](../data/sources/atkis-20260907/receipt.json).

The query box is longitude 13.459–13.480, latitude 52.496–52.511, explicitly supplied as CRS84 longitude/latitude. Returned GeoJSON uses longitude/latitude and two coordinates per vertex. WFS selects intersecting features; it does not clip their geometry to the box. The edition renders the selected bridge and clips only its display at the scene boundary.

Raw responses, capabilities, schema and the licence page are committed in `data/sources/atkis-20260907/`. Run `npm run data:atkis` to reproduce the bridge artifact and [inventory audit](atkis-audit.json) offline. The compiler verifies every retained hash, response completeness, reviewed feature identities, bridge classification, Ringbahn references and coordinate order before writing. Runtime metadata pins both the source receipt and the exact compiled station artifact. No geodata credentials or provider requests are needed in the browser.

## What remains unknown

None of the inspected geometries or attributes supplies measured rail-deck heights. The two station polygons are classified as stations, rather than individual platform extents. Source `beg` fields and response timestamps are retained without treating them as survey dates. In particular, a bridge outline does not establish deck thickness, platform width, rail elevation or an approach gradient. Missing `hdu` is not converted to a claim that a railway is at ground level.

The [AdV Basis-DLM object catalogue](https://www.adv-online.de/sites/default/files/documents/2026-07/Objektartenkatalog__AFIS-ALKIS-ATKIS_Anwendungsschema__0.html) describes `hatDirektUnten` as a layer relationship. It is not a numeric height. The raw relation is preserved; the scene's upper/lower ordering still comes from the separately reviewed station evidence.

Berlin's [DGM catalogue](https://daten.berlin.de/datensaetze/atkis-dgm-digitales-gelandemodell-fa02f9e1) confirms that the one-metre raster excludes buildings and other objects. The [publisher](https://www.berlin.de/sen/stadt/stadtdaten/geoinformation/landesvermessung/geotopographie-atkis/dgm-digitale-gelaendemodelle/) identifies ETRS89/UTM 33N and DHHN2016. Ground elevations cannot substitute for railway deck heights. The older DGM catalogue slug now returns 404 and has been corrected in the series docs. No terrain tile was compiled in this pass.

The next metric gate therefore needs an engineering section or suitably classified survey data with a height datum and observation date. LoD2 roofs or a surface model alone would also need a defensible distinction between roof, platform and track before they could clear rail heights.
