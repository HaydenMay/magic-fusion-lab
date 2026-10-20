# Validation — 2026-10-19

This record distinguishes real rendering in a desktop browser, desktop mobile emulation, and actual device testing.

**Verified public URL:** https://haydenmay.github.io/magic-fusion-lab/

**Repository:** https://github.com/HaydenMay/magic-fusion-lab

**Successful deployment:** [GitHub Actions run 39380060849](https://github.com/HaydenMay/magic-fusion-lab/actions/runs/39380060849), runtime source commit `31986bb2b326945355103738477d02b78102d952`. Final documentation-only commits do not alter that tested runtime.

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
| Public HTTPS deployment / deployed interactions | PASS | Actual Pages API URL returned HTTP 200; full browser suite repeated against the public site |
| Deployed JavaScript / CSS paths | PASS | `/magic-fusion-lab/assets/index-D93hOJub.js` and `index-DCgc5LiY.css`: HTTP 200, correct MIME types |
| Independent code review | PASS | No Critical, Important, or actionable Minor findings; reviewer independently reran build and tests |
| Actual iPhone / Safari | NOT TESTED | No physical iPhone or Safari session was available |

## Observed performance

Windows, headless Google Chrome 155.0.8059.85, NVIDIA GeForce RTX 4060 through ANGLE / Direct3D 11. The displayed recent FPS estimate held near 144 in the observed desktop High-quality frames at 1440×1000. Public-site spell samples contained 339–448 particles and 77–86 total draw calls including postprocessing. These are observations from this PC and do not predict iPhone performance.

The idle environment uses 49 geometries before particles are first warmed; after all spells have run, the 2 intentionally retained particle batches bring that to 51. Recasts return to 0 live systems and 0 particles. The production replay test returned to 51 geometries and 17 textures, matching its warmed baseline exactly. Shared particle resources remain allocated for reuse.

## Limitations and mitigation

- Actual mobile Safari thermal behavior, safe-area rendering and long-session performance remain unverified. Keep Mobile quality on a phone; test portrait and landscape on the owner's device.
- Desktop touch emulation validates DOM layout and input handling but does not emulate an iPhone GPU or Safari.
- Google Fonts is optional; the page falls back to system sans-serif and Georgia if unavailable.
- One active cast is intentional. Recasting replaces the previous event, and changing quality clears it, bounding resource use.
- WebGL 2 is required; a visible recovery message replaces a blank screen on initialization failure or context loss.

## Result and handoff

The definition of done is met for the implementation, public deployment, available touch emulation, visual inspection and lifecycle validation. No failing checks remain. Actual iPhone / Safari testing is **NOT TESTED**, and no physical-device performance or compatibility claim is made. The remaining acceptance risk is the owner's device; the mitigation is to start in Mobile quality and verify portrait / landscape directly in Safari.

On an iPhone: open the public URL in Safari, choose Fire / Lightning / Fusion and tap Cast spell. Drag the unobstructed scene to orbit, pinch to zoom, use the circular arrow to reset, and use ½ for slow motion. Change Mobile / High with the top-right menu; changing quality clears the active cast.

All three spells' flight / impact images and phone-sized views were inspected from both local and deployed Chrome rendering. The executable check and ignored JSON / PNG artifacts are retained locally in `scripts/browser-check.mjs` and `artifacts/`; no screenshot is offered as a substitute for the live interactive page.
