# Umlauf

**A Berlin motion study.** A railway draws an inside. The city keeps crossing it.

First source-pinned interactive proof, 7 September 2026. An independent, unnumbered [Motion Studies](https://github.com/emmettl/motionstudies) edition consuming exact published `@motionstudies/*` version `0.1.0-alpha.2`. Umlauf remains a working title.

## What works

- A real VBB scheduled morning: 07:00–09:00 on 7 September 2026, Europe/Berlin.
- Ring view: S41 clockwise and S42 counter-clockwise, with 36 timetable trips per direction across the opening and overlapping trips at its edges.
- Ring & Crossings: S1/S2, S3/S5/S7/S9, U2/U6/U8 and M10, cropped to the central field. 585 retained journeys across 12 line names, 397 platform/stop records and 1,170 directed path segments.
- Continuous geography-to-circulation diagram, preserving the source stop/path identities and timetable clock. A radial transformation makes the Ring approximately circular and applies the same transformation to the crossing network.
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
npm run test:browser
```

Browser checks require Playwright Chromium (`npx playwright install chromium`). The current suite exercises desktop and phone viewports. Device emulation is not physical-device performance certification.

## Sources and reproducibility

See [data contract](docs/DATA.md), [machine-readable audit](docs/source-audit.json), [licence receipt](docs/licence-receipt.json) and [next work](docs/ROADMAP.md). The derived timetable/geometry carries **VBB attribution and CC BY 4.0**; code licensing does not replace source-data rights.

Full source copies live in ignored `sources/`. With the exact archive restored:

```sh
npm run data:compile
```

The compiler refuses an archive with a different SHA-256. Review new releases before updating that pin. Public deployment is not configured in this first proof.
