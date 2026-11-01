# Stable renderer API adoption

The adoption branch consumes all four exact published Motion Studies alpha.50
packages. Their registry archives match the retained artifacts from the
[successful trusted publication](https://github.com/emmettl/motionstudies/actions/runs/41356252074),
and all lockfile integrities match that release. Fiber remains exact 9.8.2,
React 19.3.1 and Three 0.186.1. This source update does not claim a deployed revision.

## Ownership and scope

Umlauf uses the public `NationalNetworkScene` and has no edition-owned Fiber
Canvas or hooks to rewrite. The shared renderer owns the WebGL/frame boundaries
and runtime GLSL guards. Ostkreuz remains SVG with its own foreground playback
timer. The app, authored geometry, source-pinned data, study clock and current
rendering backend are retained.
The captures use the existing VBB scheduled data and Berlin ATKIS context;
attribution and receipts remain in [data](DATA.md), [water](WATER.md) and
[bridge provenance](ATKIS.md).

Desktop and phone WebKit projects join the existing Chromium projects. Test
servers are fresh by default; explicitly set `PLAYWRIGHT_REUSE_SERVER=1` when
reusing a deliberately selected server. CI installs both browser engines and
their runtime libraries. Its job ceiling accommodates the expanded suite; test
timeouts and the transfer budget are unchanged.

## Published alpha.43 baseline

The clean baseline at `7e6728a` passes 20 source/model tests, typechecking, lint,
boundary, build and budget checks. Introducing WebKit exposed two failures in
the existing visibility-clock test. A normal one-second timer run can end between
animation frames while the HTML range input quantizes to whole study seconds.
The test now delivers a known one-second frame after visibility resumption,
retains the greater-than-29 lower bound and adds a less-than-31 upper bound. No
application timer change was needed. All four focused cases pass, followed by
[all 68 hosted browser checks](https://github.com/emmettl/umlauf/actions/runs/41354574226)
on the alpha.43 readiness commit `9d1142c`.

The old budget script omitted preloaded React/runtime modules. Counting every
static script/style reference in the built HTML adds 3,576 bytes gzip to that
baseline: **580,664 / 588,800 bytes**. Lazy station code/data remain separate.
The limit stays at 575 KiB. This corrected accounting must also be used for the
alpha.50 comparison.

[Baseline evidence](renderer-readiness/alpha43/validation.json) records source and
lock identities and all six public-data hashes. [Capture provenance](renderer-readiness/alpha43/captures.json)
identifies six paused production-build views, including geographic/circulation
maps and the SVG station at desktop/phone layouts. The
[short frame diagnostic](renderer-readiness/alpha43/performance.json) uses the
existing sequential profiler with five-second samples at a 390×844 viewport.
These laptop/headless observations are not physical-phone, thermal, leak or
causal performance acceptance. Existing physical-device review remains open.
