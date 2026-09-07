# First proof validation — 7 September 2026

- Nine Node tests passed: source pin and artifact digest, exact source lineage and monotonic calls, complete layout identities, network payload budget, clockwise/counter-clockwise winding for every Ringbahn trip, replacement-bus exclusion, repeated-station loop matching, sparse-segment projection and refusal of unmatched stops.
- Six Chromium browser checks passed across desktop and phone emulation: rendered canvas, nonzero Ringbahn counts, pause/scrub, composition switching, diagram transition with the same clock, source disclosure and focus return, reduced-motion pause. Screenshots of ring and crossing views were visually reviewed; the camera was adjusted to fit the complete Ring.
- Typecheck, lint, independent-package boundary check and production build passed. All four shared packages are exact registry installs at `0.1.0-alpha.2`; no workspace links or unpublished source imports.
- A second source compilation produced byte-identical network and layout artifacts.
- Network SHA-256: `d7952463be860883043bce038f9d246f14b8e26c4f3c46ee1ee6a4239b7a59e8`.
- Layout SHA-256: `39644f74a4bbc7e56ebcb561063f834a3f12a099ec8e8b0e3284dc518e425c79`.

Local toolchain: Node 26.8.1 and npm 11.19.0 on macOS. CI is configured for Node 24; its result is separate from these local checks. Production JavaScript is approximately 323 KB gzip, with a Vite warning for the uncompressed renderer chunk exceeding 500 KB. The shared renderer also emits a Three.js Clock deprecation warning. No browser page errors occurred. Neither warning establishes a failed function, but renderer modernization and physical phone frame/memory budgets remain follow-up work.
