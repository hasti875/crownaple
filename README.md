# Crownaple: Crowning Brands Online

A scroll-driven 3D particle website built with React + Vite + Tailwind, Three.js (custom `ShaderMaterial` points), GSAP ScrollTrigger and Lenis.

## Run / build
```bash
npm install
npm run dev      # local dev
npm run build    # deploy-ready static build in dist/
```
Upload `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3).

## Change copy
All text lives in **`src/content.ts`**: nav, platforms, solutions, expertise columns, team, process steps and email.

## Change colours
- CSS tokens are at the top of `src/index.css` (`--bg`, `--gold`, …). Tailwind classes in `App.tsx` use the same hex values.
- Particle palette: `palette` in `src/particles/ParticleScene.ts`.
- Social-moment tints: the `tint` field in `SECTION_SHAPES` (`src/content.ts`).

## Change shapes
1. Write a sampler `(n) => Float32Array(n*3)` in `src/particles/shapes.ts` (helpers: `build`, `capsule`, `ellipsoid`, or draw a 2D logo with the canvas `LOGOS` map).
2. Register it in `buildAllShapes`.
3. Use its key in `SECTION_SHAPES` for any section. One section can hold several shapes; they cycle evenly across that section's scroll height. Set the position (`x`, `yo`), scale `s` and `spin` there too.

## How it works
- Every shape is pre-sampled once at load into a Float32Array.
- Scroll position maps to a pair of keyframes. The pair is copied into the `aFrom`/`aTo` attributes, and the vertex shader morphs between them using a `uMorph` uniform. A `sin(π·t)` term scatters the particles into a swirling dust cloud mid-morph.
- Mouse: rotates the cloud and repels particles near the cursor (in world space).
- 40k particles on desktop, 12k on mobile. DPR is capped at 2.
- `prefers-reduced-motion`: Lenis, letter reveals and the scatter swirl are turned off, and shapes swap instantly.
- If WebGL isn't available, a static glowing logo is shown instead.
