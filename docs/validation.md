# Validation — 2026-10-19

This record distinguishes real rendering in a desktop browser, desktop mobile emulation, and actual device testing.

## Current evidence

| Check | Status | Evidence |
| --- | --- | --- |
| TypeScript + Vite production build | PASS | `npm run build`; approximately 756 kB JavaScript / 188 kB gzip |
| Playback, phase order, cleanup and delta bounds | PASS | `npm test`, 3/3 tests |
| Live Three.quarks rendering | PASS | Captured all spells with 4 live systems and hundreds of live particles; 2 shared render batches |
| All spells, replay, quality, slow motion and reset | PASS | Chrome automated interaction suite |
| 36 rapid recasts + quality changes | PASS | 0 systems afterward; 51 geometries before/after; 2 batches before/after |
| Touch layout | PASS | Desktop Chrome emulation at 390×844, 844×390 and 320×568; Cast stays in bounds; no horizontal overflow |
| Touch orbit then first-tap reset | PASS | Regression reproduced and fixed; focused check plus full suite |
| Visual inspection | PASS | Author inspected real WebGL PNGs for Fire, Lightning, Fusion and phone-sized views; revised brightness, framing and color separation |
| Production preview | PASS | Full browser suite at `http://127.0.0.1:4173/magic-fusion-lab/`; production JS and CSS both HTTP 200 |
| Touch pinch / first-tap cast after pinch | PASS | Native touch event simulation; camera distance changes, page does not scroll, next tap casts |
| Unsupported WebGL / context-loss recovery | PASS | Simulated missing WebGL 2 and `WEBGL_lose_context`; recovery messages appeared |
| Public HTTPS deployment / deployed interactions | PENDING | Must be verified after GitHub Pages returns its URL |
| Actual iPhone / Safari | NOT TESTED | No physical iPhone or Safari session was available |

## Observed performance

Windows, headless Google Chrome 155.0.8059.85, NVIDIA GeForce RTX 4060 through ANGLE / Direct3D 11. The displayed recent FPS estimate held near 144 in the observed desktop High-quality frames at 1440×1000. Recorded spell samples contained 331–458 particles and 77–86 total draw calls including postprocessing. These are observations from this PC and do not predict iPhone performance.

The idle environment uses 49 geometries before particles are first warmed; after all spells have run, the 2 intentionally retained particle batches bring that to 51. Recasts return to 0 live systems and 0 particles. The production replay test returned to 51 geometries and 17 textures, matching its warmed baseline exactly. Shared particle resources remain allocated for reuse.

## Limitations and mitigation

- Actual mobile Safari thermal behavior, safe-area rendering and long-session performance remain unverified. Keep Mobile quality on a phone; test portrait and landscape on the owner's device.
- Desktop touch emulation validates DOM layout and input handling but does not emulate an iPhone GPU or Safari.
- Google Fonts is optional; the page falls back to system sans-serif and Georgia if unavailable.
- One active cast is intentional. Recasting replaces the previous event, and changing quality clears it, bounding resource use.
- WebGL 2 is required; a visible recovery message replaces a blank screen on initialization failure or context loss.

Definition of done remains pending until public deployment, asset paths and deployed interactions are verified. Actual iPhone testing is reported as not tested, as required by the brief.
