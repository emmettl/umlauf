# Performance and review protocol

## Changes informed by All Change

Reviewed All Change commits c2f93fb (stable search/observation work), fa6dce4 (flat ribbons in one pass), and dbc41d7 (zero-opacity culling). Berlin has no search or observation projection; its network, station index and call tables already have stable memo dependencies. No London-specific marker, track-lane or label adapters are copied.

The reusable renderer fixes are published as Motion Studies alpha.3: two-sided flat route ribbons with forceSinglePass, single-pass water fills, culling fully transparent context and line-map backing layers, and an optional quiet ground style. The review now uses flat routes and quiet ground. Berlin consumes exact registry packages through public APIs. Ostkreuz scene code is lazy, alongside its existing lazy source files. Water is removed from the scene at full diagram mix. Timetable counts remain clock-dependent; source-derived geometry is not rebuilt on each tick.

## Reproducible checks

`npm run build && npm run check:budget` enforces 575 KiB gzip for the whole opening: HTML, icon, main JS/CSS, timetable, layout and optional water. This is compressed asset accounting, not an HTTP cold-load timing claim. Station code and station/bridge artifacts are separately loaded.

`npm run profile:frames -- --url http://127.0.0.1:4183 --headless --width 390 --height 844 --dpr 3 --duration 5000 --output /tmp/berlin-frames.json` profiles opening, crossings, circulation and Ostkreuz. The command is adapted from All Change's diagnostic. Omit `--headless` and optionally supply `--channel chrome` or `--channel msedge` for installed browsers. It records browser/GPU identity, actual canvas size, frame percentiles, missed frames, JS heap and main-thread work. Run scenarios sequentially without competing browser suites.

Targets for physical-device review: p95 frame interval at or below 33.4 ms (30 fps minimum), fewer than 5% intervals above 50 ms, no repeated pause/scrub stalls above 100 ms, no progressive heap growth after repeated view switches. Record phone model, OS, browser, refresh rate, thermal/battery state, cold-load network and a 60-second sample in each composition. These are acceptance targets, not already-certified results. Browser emulation on macOS does not certify an iPhone, Android phone or Windows Edge.

The shared renderer's large uncompressed JS chunk and Three.Clock deprecation remain visible warnings. There is no realtime polling or provider request in the client.

## Local measurements, 7 September 2026

Reports in `docs/performance/` identify Chromium 151 on macOS using ANGLE/SwiftShader software rendering, 390×844 CSS pixels, DPR requested 3 and an actual renderer canvas of 643×869. The baseline is a rebuilt `0db7617` production bundle. These five-second samples are diagnostics, not physical-device acceptance.

The first water-enabled review sample fell to 23.44 fps in crossings, p95 50.1 ms (baseline 32.29 fps, p95 33.4 ms). Therefore water and map labels are opt-in on phones; desktop retains water. This is a deliberate quality/performance tradeoff, not a claim that the full water scene became faster. The final phone-default report is retained separately. JS heap snapshots are reported, but the samples do not establish a leak or stable long-run memory behavior. Physical phone, Windows Edge and thermal-duration checks remain open.

Previous alpha.2 phone-default sample: opening 59.01 fps / p95 16.8 ms; crossings 28.61 fps / p95 50.0 ms; circulation 32.69 fps / p95 33.4 ms; Ostkreuz 60 fps / p95 16.7 ms. Crossings do not meet the proposed 30 fps/p95 target in this software-rendered environment. This edition is ready for review, not performance-certified. No cross-platform speedup is claimed; physical-device measurements remain open. The alpha.3 follow-up appears below.

## Published alpha.3 follow-up

`alpha3-phone-emulation.json` uses the same diagnostic settings after the exact registry upgrade and flat-route/quiet-ground change. Opening and Ostkreuz average 60 fps; crossings 33.97 fps (p95 34.1 ms); circulation 32.37 fps (p95 43.4 ms). The earlier alpha.2 crossing sample averaged 28.61 fps. These short software-rendered runs show improvement in the crossing sample but variable frame tails, not physical-device certification or an isolated causal benchmark. Both crossing/circulation p95 values still exceed the proposed 33.4 ms target. Real-phone and longer-duration review remain required.
