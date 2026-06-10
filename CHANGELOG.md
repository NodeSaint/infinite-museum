# Changelog

All notable changes to The Infinite Museum. Dates are absolute (ISO).

## [Unreleased] — branch `dev`

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
