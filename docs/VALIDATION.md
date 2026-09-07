# First proof validation — 7 September 2026

## Platform inspection

Thirteen source/model tests and fourteen desktop/phone Chromium checks pass locally, alongside typecheck, lint, independent-package boundary validation and production build. The added browser test checks selected-platform dimensions, zoom/reset, platform focus and unchanged clock while the display separates levels. Production JavaScript is 327.66 KB gzip. Measurements are small cited facts; the network, station and bridge artifact bytes are unchanged. Final desktop and phone renders were visually inspected, with the phone view cropped more tightly to make the close view readable. Hosted CI is separate evidence.

## Official bridge outline

Thirteen source/model tests and twelve desktop/phone Chromium checks pass locally, together with typecheck, lint, package-boundary validation and production build. The bridge check verifies exact retained source hashes and polygon geometry, the reviewed railway-to-bridge relation, the station artifact digest and explicit absence of metric height. Browser coverage adds outline switching and station usability when its optional source fails.

The 2,605-byte bridge artifact compresses to 1,234 bytes and loads only with Ostkreuz. Production JavaScript is 327.07 KB gzip. Final 1440×1000 and 390×844 screenshots were visually inspected with no document overflow. Recompiling ATKIS offline produced identical bytes: SHA-256 `498c89f83dd4bf55094d582736a0fec9b50c3dca2a6862c0321c27d1eecdea3c`. The earlier renderer warnings and physical-device validation limits still apply. [Hosted Node 24 CI run 34139406252](https://github.com/emmettl/umlauf/actions/runs/34139406252) passed the build, source checks and all twelve Chromium checks at code commit `46c7dcb`.

## Ostkreuz extension

Twelve source/model tests and ten Chromium desktop/phone browser checks now pass locally, along with typecheck, lint, package-boundary validation and production build. New checks cover exact station/network provenance, platform/route assignments, connector identity and mode filtering, display-only level separation, on-demand station loading, platform selection, call-time jumps and shared-clock continuity when switching scenes. Both rendered station layouts were visually inspected. Production JavaScript is approximately 327 KB gzip; the lazy station artifact is 27.2 KB gzip.

[Hosted CI run 34138194955](https://github.com/emmettl/umlauf/actions/runs/34138194955) passed on Node 24 at code commit `00ff0cd`: typecheck, lint, package-boundary validation, twelve source/model tests, production build and all ten Chromium desktop/phone checks. Final screenshots at 1440×1000 and 390×844 were inspected; neither layout overflowed. A second station compilation was byte-identical, SHA-256 `a96e20cd5bd3a3a22a07f1a399bfcee326a5cd061981bf98126b2ccfa0b2e73e`.

The initial CI run passed its Node 24 build/source checks but spent over thirteen minutes downloading optional fonts from a slow Ubuntu mirror. It was cancelled for diagnosis. CI now installs Chromium without the redundant OS/font bundle (runtime libraries were already present in the job log), with five-minute installer and twelve-minute job timeouts. The next run completed installation and passed nine browser checks; the longer desktop Ring/crossing test exhausted its total thirty-second budget. Hosted browser checks now use one worker to avoid competing WebGL scenes and a sixty-second total test budget. Assertions and local limits are unchanged; this is functional coverage, not a performance claim. Local success and subsequent hosted CI results remain separate evidence.

## Original opening

- Nine Node tests passed: source pin and artifact digest, exact source lineage and monotonic calls, complete layout identities, network payload budget, clockwise/counter-clockwise winding for every Ringbahn trip, replacement-bus exclusion, repeated-station loop matching, sparse-segment projection and refusal of unmatched stops.
- Six Chromium browser checks passed across desktop and phone emulation: rendered canvas, nonzero Ringbahn counts, pause/scrub, composition switching, diagram transition with the same clock, source disclosure and focus return, reduced-motion pause. Screenshots of ring and crossing views were visually reviewed; the camera was adjusted to fit the complete Ring.
- Typecheck, lint, independent-package boundary check and production build passed. All four shared packages are exact registry installs at `0.1.0-alpha.2`; no workspace links or unpublished source imports.
- A second source compilation produced byte-identical network and layout artifacts.
- Network SHA-256: `d7952463be860883043bce038f9d246f14b8e26c4f3c46ee1ee6a4239b7a59e8`.
- Layout SHA-256: `39644f74a4bbc7e56ebcb561063f834a3f12a099ec8e8b0e3284dc518e425c79`.

Local toolchain: Node 26.8.1 and npm 11.19.0 on macOS. CI is configured for Node 24; its result is separate from these local checks. Production JavaScript is approximately 323 KB gzip, with a Vite warning for the uncompressed renderer chunk exceeding 500 KB. The shared renderer also emits a Three.js Clock deprecation warning. No browser page errors occurred. Neither warning establishes a failed function, but renderer modernization and physical phone frame/memory budgets remain follow-up work.
