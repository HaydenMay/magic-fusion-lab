# Magic Fusion Laboratory

An interactive Three.js + Three.quarks spell-weaving experiment. A small suspended obsidian observatory hosts three finite spell events, with procedural artwork and no game systems.

## The experiments

- **Fire / Pyroclasm:** a turbulent molten seed, curling flame wake, ember burst, fire crown and expanding ground rings.
- **Lightning / Thunderstrike:** an electrical charge, rapidly branching lance, secondary forks, radial ground arcs and ion sparks.
- **Fusion / Helios:** orange and cyan strands counter-rotate around a violet-cyan plasma seed, travel as a braided helix, compress and unfold into a two-color solar nova. It has its own timing, path and silhouette.

All three use live Three.quarks billboard particles for charge, travel and impact. Custom GLSL cores and dynamic mesh ribbons provide structure; bloom, point lights and shock-ring shaders integrate the spell with the chamber.

## On an iPhone

Open the deployed URL in Safari. Select **Fire**, **Lightning**, or **Fusion**, then tap **Cast spell**. Tap again to replay. Drag the open scene to orbit, pinch to zoom, and use the circular arrow to reset the view. The **½** button toggles half-speed playback. Mobile quality is the default on touch devices; switch quality using the top-right menu. Portrait and landscape are supported.

Requires WebGL 2 and a recent browser. Actual iPhone / Safari hardware testing has not been performed. Desktop touch emulation is recorded separately in [validation](docs/validation.md). If a phone runs hot or drops frames, keep Mobile quality and close other graphics-heavy tabs.

## Run and check

Use Node.js 24 (Vite requires Node >=22.12 or compatible Node 20).

```sh
npm ci
npm test
npm run dev
npm run build
npm run preview
```

Open the URL printed by Vite, including `/magic-fusion-lab/`.

Browser checks require installed Google Chrome. With the dev or production preview server running:

```sh
npm run test:browser
```

Set `LAB_URL` to test another URL, including the public deployment. The check captures real WebGL frames, exercises all spells, 36 rapid recasts, both quality settings, touch orbit / pinch, camera reset, three mobile layouts, and graphics failure states. It writes PNGs and a JSON report to ignored `artifacts/`.

Read-only diagnostics are available in the browser console as `window.__lab.stats()` (FPS, particles, systems, render batches, GPU resources, draw calls and GPU identity). FPS is an approximate recent average, not a device benchmark.

## Lifecycle and quality

Only one spell is active. Recasting disposes the previous spell; changing quality clears it. Finite timelines finish with explicit cleanup. Particle systems share two materials, two textures and one geometry, allowing Three.quarks to reuse two render batches. Per-cast cores, ribbon geometry, lights and shader materials are released after decay. Context loss displays a recovery message.

Mobile caps DPR at 1.25, uses 55% particle density and a reduced bloom buffer. High caps DPR at 1.75 and uses full density and bloom resolution. Neither setting uses shadow maps or downloaded 3D models.

## Deploy to GitHub Pages

The repository includes `.github/workflows/deploy.yml`. Enable Pages with **GitHub Actions** as its source, then push to `main` or run the workflow manually. It installs from the lockfile, runs unit tests, builds and publishes `dist/` with the official Pages actions. `vite.config.ts` sets the production base to `/magic-fusion-lab/`.

For a different repository name, change `base` before deploying. Verify the URL returned by the Pages API and check the deployed JavaScript and CSS paths, rather than assuming the default address.

## Dependency verification

Checked the current registry and package declarations before implementation: `three.quarks@0.17.1` declares peer `three >=0.182.0`; this project pins `three@0.186.1`. The implementation uses `BatchedRenderer`, `ParticleSystem`, `SphereEmitter`, lifetime behaviors and value generators from the installed API. Three.quarks uses its own vector types in value generators.

References: [Three.quarks source and API example](https://github.com/Alchemist0823/three.quarks), [renderer documentation](https://docs.quarks.art/docs/core-components/renderers).
