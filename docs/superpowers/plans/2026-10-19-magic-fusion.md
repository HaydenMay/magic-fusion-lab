# Magic Fusion Laboratory Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. Steps use checkbox syntax for tracking.

**Goal:** Deliver three polished, replayable magic effects with mobile touch controls at a verified public HTTPS URL.

**Architecture:** A small Vite application with one scene and one active cast. Three.quarks supplies instanced particle rendering, while procedural shader meshes, dynamic ribbons, branching bolts and selective bloom establish the spell silhouettes.

**Tech Stack:** TypeScript, Three.js 0.186.1, Three.quarks 0.17.1 (peer Three.js >=0.182.0), Vite 8.3.4, Playwright, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-19-magic-fusion-design.md`

## Global Constraints

- New isolated `magic-fusion-lab` repository only.
- Public HTTPS deployment and correct `/magic-fusion-lab/` base path.
- Fire, Lightning and a distinct Fusion; no game systems.
- Touch controls in portrait and landscape; safe-area insets and no page overflow.
- Mobile and High quality, approximate FPS, camera reset, finite lifetimes and cleanup.
- No claim of actual Safari / iPhone testing without access to that device.

## Review Focus

- Rapid recasts and mid-cast quality switches must not accumulate particle systems or resources.
- Portrait / landscape resizing must preserve framing and usable controls.
- Hidden tabs and delayed frames must not advance particles by an unbounded delta.
- Unsupported WebGL and context loss must show a useful on-screen error.
- Deployed base paths must work independently of a local development server.

### Task 1: Scene, touch interface, finite playback

**Files:** `src/main.ts`, `src/style.css`, `src/scene.ts`, `src/playback.ts`, `tests/playback.test.ts`, `index.html`.
**Interfaces:** `Playback.cast(id)`, `Playback.update(dt)`, `Playback.clear()`; scene exposes renderer, scene, camera, controls, resize and quality setter. Playback emits normalized phase progress and disposes a replaced or finished effect.

- [ ] Write tests for charge / release / impact / decay boundaries and exactly-once cleanup on replay / finish.
- [ ] Run `npm test`; expected: missing behavior fails before implementation.
- [ ] Implement playback, scene and responsive UI with an elevated camera, engraved platform and safe error state.
- [ ] Run `npm test` and `npm run build`; expected: all pass.
- [ ] Run local preview and inspect desktop plus portrait / landscape controls.
- [ ] Commit scene and playback.

### Task 2: Three polished effects

**Files:** `src/particles.ts`, `src/materials.ts`, `src/spells.ts`, `scripts/browser-check.mjs`.
**Interfaces:** `createSpell(scene, batch, id, quality)` returns `{ update(time, dt), dispose() }` consumed by Playback. Particle kits expose move, stop, update and dispose; finite emitters are removed from the batch and their geometry / material / textures disposed or shared intentionally.

- [ ] Add a browser acceptance check for all three visible spells, replay and bounded systems, plus mobile layout / quality / reset interactions.
- [ ] Run before spell implementation; expected: unavailable effects fail.
- [ ] Implement Fire first, inspect rendered flight and impact; then Lightning, then Fusion with a braided helix and nova.
- [ ] Iterate on observed frames, silhouette, environmental lighting and phase timing.
- [ ] Run `npm test`, `npm run build`, browser checks; expected: no runtime/shader errors, distinct screenshots, resources return to baseline.
- [ ] Commit effects and verification script.

### Task 3: Public deployment and handoff

**Files:** `.github/workflows/deploy.yml`, `README.md`, `docs/validation.md`.
**Interfaces:** GitHub Pages workflow consumes `npm run build` output in `dist`, publishes with the Pages API, returns actual URL.

- [ ] Add reproducible Actions workflow and usage / deployment documentation.
- [ ] Run production preview under the real base path and all checks; expected: assets and interactions succeed.
- [ ] Request one independent code review, resolve important findings, and rerun affected checks.
- [ ] Create a fresh public repo, push, enable Pages and deploy; expected: successful workflow.
- [ ] Verify the actual returned HTTPS URL, loaded assets and deployed interactions.
- [ ] Record PASS / FAIL / NOT TESTED, measured browser FPS, visual inspection method and actual device limitations; deliver links and iPhone instructions.
