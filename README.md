# Umlauf

**A Berlin motion study.** A railway draws an inside. The city keeps crossing it.

First source-pinned interactive proof, 7 September 2026. An independent, unnumbered [Motion Studies](https://github.com/emmettl/motionstudies) edition consuming exact published `@motionstudies/*` version `0.1.0-alpha.3`. Umlauf remains a working title.

## What works

- A real VBB scheduled morning: 07:00–09:00 on 7 September 2026, Europe/Berlin.
- Ring view: S41 clockwise and S42 counter-clockwise, with 36 timetable trips per direction across the opening and overlapping trips at its edges.
- Crossing-family controls isolate north–south, east–west, or U-Bahn/tram routes while retaining both Ring directions and the same clock.
- Official Spree/canal/harbour polygons retain source receipts and island boundaries; water fades out of the authored circulation view.
- Ring & Crossings: S1/S2, S3/S5/S7/S9, U2/U6/U8 and M10, cropped to the central field. 585 retained journeys across 12 line names, 397 platform/stop records and 1,170 directed path segments.
- Continuous geography-to-circulation diagram, preserving the source stop/path identities and timetable clock. A radial transformation makes the Ring approximately circular and applies the same transformation to the crossing network.
- Ostkreuz relative interchange view: upper Ringbahn and lower east–west S-Bahn platforms, adjustable level separation, source connector filters, platform selection and scheduled-call jumps on the same clock. Station data loads only when this view is opened.
- Optional official Ostkreuz bridge outline from Berlin ATKIS, linked to its retained Ringbahn source record. Footprint coordinates are supplied; vertical placement remains illustrative.
- Station inspection zoom, with selected-platform focus and cited DB platform dimensions. Height above rail remains distinct from station elevation.
- Play/pause, time scrubbing, playback speed, pan/zoom/reset, station selection and upcoming calls, journey following, labels and source disclosure. Reduced-motion preferences open paused.

## Run

Use Node 24 LTS or later and npm 11.19.0:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4177`. Committed compiled data is sufficient; the browser makes no provider requests and needs no credentials.

```sh
npm run typecheck
npm run lint
npm test
npm run check:boundary
npm run build
npm run check:budget
npm run test:browser
```

Browser checks require Playwright Chromium (`npx playwright install chromium`). The current suite exercises desktop and phone viewports. Device emulation is not physical-device performance certification.

## Sources and reproducibility

See [data contract](docs/DATA.md), [machine-readable audit](docs/source-audit.json), [licence receipt](docs/licence-receipt.json) and [next work](docs/ROADMAP.md). The derived timetable/geometry carries **VBB attribution and CC BY 4.0**; code licensing does not replace source-data rights.

The [Ostkreuz source contract](docs/OSTKREUZ.md) describes relative levels, connector semantics and the limits of the station view. It is a source-based artwork, not live wayfinding.

The small [ATKIS source package](docs/ATKIS.md) is committed and rebuilds offline with `npm run data:atkis`. It uses Germany Zero 2.0. The full VBB archive and DB reference plan live in ignored `sources/`. With the exact VBB archive restored:

```sh
npm run data:compile
```

The compiler refuses an archive with a different SHA-256. Review new releases before updating that pin. The approved static build is published by this repository’s manual Pages workflow; see [publication record](docs/PUBLISHING.md).

## Review preview and performance

[Open Umlauf on GitHub Pages](https://emmettl.github.io/umlauf/). The [owner-only Sites review](https://umlauf-berlin-review.vndh2vk2v4.chatgpt.site) remains available separately.

The owner-only Sites review uses the checked static build; source upload and private deployment were explicitly approved on 7 September 2026. Public Pages publication was approved on 7 September 2026. Pages initially used the separate [umlauf-pages](https://github.com/emmettl/umlauf-pages) deployment repository while the source was private. The canonical site now publishes directly from this repository at `/umlauf/`. The user subsequently approved making this source repository and its full Git history public on 7 September 2026; that visibility change is complete. Publication is deliberate; source pushes do not automatically update Pages. The page is unnumbered, uses a working title, and requests no search indexing. See [water provenance](docs/WATER.md), [performance protocol](docs/PERFORMANCE.md), and [publication review](docs/REVIEW.md).
