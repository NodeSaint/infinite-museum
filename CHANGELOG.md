# Changelog

All notable changes to The Infinite Museum. Dates are absolute (ISO).

## [Unreleased] — branch `dev`

### 2026-06-10 — Tier 1 BYO-key living curator (build-order step 5)
- `codex/tier1.ts`: optional Anthropic call on entry (model id in the single constant
  `CURATOR_MODEL = 'claude-opus-4-8'`), direct browser `fetch` with header
  `anthropic-dangerous-direct-browser-access: true`. Returns a bespoke Codex (museum name, epigraph,
  movements, artists) which the keyless Tier-0 artwork + placard generators then run against, so the
  model-written canon flows through to every placard. Strict JSON extraction + hard validation +
  clamping; dangling feud/rival references dropped. Any failure (bad key, network, malformed reply)
  falls back to Tier 0 silently with clear in-interface guidance — never a raw stack trace.
- Verified the fallback path headlessly: an invalid key yields "That API key was not accepted.
  Showing the keyless museum." and the keyless museum renders unaffected.

### 2026-06-10 — Push: `main` → live
- Created public repo `NodeSaint/infinite-museum`; pushed `main` and `dev`. (The brief's
  "nuvixstudio" namespace does not exist on GitHub; the authenticated account is NodeSaint, so the
  repo and Pages URL use NodeSaint.)
- Enabled GitHub Pages (build type: GitHub Actions). Live: https://nodesaint.github.io/infinite-museum/

### 2026-06-10 — Initial build (walkable shell → generation)
- **Scaffold**: Vite 8 + vanilla TypeScript 6 + Three.js 0.184, no framework. `base:
  /infinite-museum/` for Pages, `/` for dev. Dual entry (`index.html`, `test.html`).
- **Spine**: seeded PRNG (`core/prng.ts`, mulberry32 + derive/hash helpers); single store with
  URL-hash sync (`#seed=…&room=…`) and localStorage API-key handling.
- **Codex-first generation** (Tier 0, keyless): `codex/fragments.ts` (hand-authored canon —
  movement/artist/placard grammars, palettes, feud archetypes) recombined by PRNG in
  `codex/generate.ts` into museum name, epigraph, 5–8 movements, 12–20 artists, timeline; plus
  per-room artwork + parody-grade critic placards. Coherence enforced via movement palette/form bias.
- **Six art systems** (`art/`): flowfield, constructivist, weave, erosion, glitch, inkwash — each
  bounded, seed-derived, drawn to a 2048px offscreen canvas → `CanvasTexture`. Registry split into
  `art/registry.ts` to avoid an import-order TDZ. Hidden `/test.html` renders 50/system for tuning.
- **World**: framed planes with warm spotlights + walnut/brass frames (`world/frame.ts`), reading-
  distance placards (`world/placard.ts`), room builder with dim top-lit shell + sittable bench
  (`world/room.ts`), anomalies — sealed door / restituted-1977 frame / conservation studio
  (`world/anomaly.ts`).
- **Impossible floor plan** (`world/graph.ts`): rooms are graph nodes, room ids are seeds, doors
  teleport to derived neighbours; only the current room is kept live (rebuild on transition, masked
  by a 300 ms luminance dip) → bounded memory.
- **Experience**: title wall (name + epigraph), atrium spawn, pointer-lock + WASD desktop controls,
  mobile thumb-stick + drag-look, Web-Audio drone + footsteps, speechSynthesis audio guide (G),
  postcard PNG export (P), sound toggle (M), untethered random-seed mode.
- **Tier 1**: `codex/tier1.ts` present as a safe stub (always falls back to Tier 0) — full BYO-key
  curator is the next step.
- **Verification**: typecheck + production build clean; headless Chrome smoke test (codex generates,
  atrium renders, WebGL live, 0 console errors); 30-room navigation/memory test (`nav-test.mjs`).
- **CI**: GitHub Actions workflow deploys `main` → Pages.
