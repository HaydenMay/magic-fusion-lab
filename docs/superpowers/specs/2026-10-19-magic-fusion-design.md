# Magic Fusion Laboratory

The supplied owner brief is the binding specification. Build an isolated TypeScript / Three.js / Three.quarks VFX experiment, publicly hosted on GitHub Pages and usable by touch on an iPhone. The owner explicitly delegates artistic decisions and requests approval only for external access or a material scope change.

## Direction

A deserted obsidian observatory: a circular engraved testing floor, floating monoliths, a restrained blue-black atmosphere, and warm brass details. An elevated orbit camera frames a casting seal on the left and receiving seal on the right. Portrait framing fits both points above the controls.

Fire / Pyroclasm: a compact molten sun gathers flame, launches a comet with curling ember trails, then bursts into a rolling fire crown and shock rings.

Lightning / Thunderstrike: conductive rings gather at the origin, then a flickering branching lance connects to the target, with radial ground forks and ion sparks.

Fusion / Helios: a counter-rotating orange and cyan double helix winds around a violet-white plasma seed. It travels as one braided phenomenon, then compresses and opens into an electric solar nova. This changes the silhouette and timing instead of overlaying the parent effects.

## Implementation

`scene.ts` owns environment, camera, resize, renderer, and quality. `particles.ts` owns reusable Three.quarks emitters and procedural textures. `spells.ts` owns custom shader cores, ribbon and bolt geometry, animation, and cleanup. `playback.ts` defines finite spell phases. `main.ts` binds touch UI, errors, FPS and diagnostics. A single active cast replaces the previous cast so emitter/resource count is bounded. Shared resources survive replay; per-cast resources are disposed after decay.

Mobile defaults cap DPR at 1.25 and lower particles / bloom resolution. High caps DPR at 1.75, increases particle density and bloom. No shadows or external image assets. Touch orbit and pinch use OrbitControls on the canvas only; controls remain separate DOM targets. Safe-area-aware portrait and landscape layouts, no body scrolling.

## Acceptance and evidence

Unit checks cover phase boundaries, long gaps, invalid delta and replacement/cleanup. Browser checks cover actual rendering, replay, all spells, both quality modes, reset, portrait and landscape overflow and touch orbit, WebGL failure messaging, and renderer resource plateau. Screenshot the charge, flight and climax of each effect. Test a production build under `/magic-fusion-lab/` and then the real Pages URL, including assets and interactions. Record actual browser / hardware constraints; desktop emulation is not iPhone testing.

## Hosting

Create a new public repository named `magic-fusion-lab` using the existing authenticated GitHub CLI if permitted. Deploy through an Actions workflow, then verify the URL returned by GitHub Pages. Never infer deployment from local success. If rights are missing, retain the complete project and explicitly report deployment as not met.
