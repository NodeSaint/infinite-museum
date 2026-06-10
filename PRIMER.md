# PRIMER — The Infinite Museum

A public, zero-backend, walkable 3D art museum that generates a coherent **fictional** art
history (the *Codex*) and then generates every artwork as a citation of it. Deploys to GitHub
Pages. British English throughout. Everything — people, movements, museums, quotes — is fictional
by construction.

**Live:** https://nodesaint.github.io/infinite-museum/ · **Repo:** NodeSaint/infinite-museum
**Dev branch:** `dev` · **Deploy branch:** `main` (Actions → Pages)

## The one-paragraph idea
On entry we generate a Codex (museum name, epigraph, 5–8 movements, 12–20 artists, a timeline of
fictional events). Then every artwork generator takes `(codex, artistId, roomTheme, seed)` and is
forced to respect its artist's movement palette and form bias — so coherence is *enforced, not
hoped for*. The same seed reproduces the entire museum anywhere, keyless. A separate, optional
"living curator" (paste-your-own Anthropic key) can write a bespoke Codex and placards in the
browser, falling back silently to the keyless path on any error.

## Architecture spine (do not violate)
1. **Codex-first.** `src/codex/` — `generate.ts` builds the Codex and artworks from `fragments.ts`
   via a seeded PRNG (`core/prng.ts`, mulberry32). Seed reproduces EVERYTHING.
2. **Artworks are code.** `src/art/` — six seeded systems (flowfield, constructivist, weave,
   erosion, glitch, inkwash) draw to a 2048px offscreen canvas → `CanvasTexture`. Registry lives in
   `art/registry.ts` (separate module to avoid an import-order TDZ). Tune at `/test.html`.
3. **Impossible floor plan.** `src/world/graph.ts` — rooms are graph nodes; room ids *are* seeds;
   doors teleport to derived neighbours with no global spatial consistency. Only the current room's
   geometry is kept live (rebuild on transition, masked by a 300 ms luminance dip) → bounded memory.
4. **Hybrid generation.** Tier 0 keyless (always works). Tier 1 optional BYO-key (`codex/tier1.ts`,
   localStorage only, `anthropic-dangerous-direct-browser-access`, validate+clamp, silent fallback).
5. **Safety rails.** All content fictional; prompts forbid real artists/museums/works and
   "in the style of [named artist]"; any Tier-1 SVG is sanitised before rasterising.

## Code map
- `src/main.ts` — orchestrator: codex → engine → controls → audio → HUD → room graph, interactions.
- `src/store.ts` — the single store + URL-hash (`#seed=…&room=…`) + API-key (localStorage).
- `src/core/` — `engine` (Three scene/loop), `controls` (FP desktop+mobile), `audio` (drone+steps+
  speechSynthesis guide), `postcard` (PNG export), `prng`.
- `src/world/` — `room` (box, lights, hangs), `frame` (framed plane + spotlight), `placard`,
  `anomaly` (sealed door / restituted 1977 frame / conservation studio), `graph` (streaming).
- `src/hud/` — `hud` (crosshair, prompt, hint, dip, toast, thumb-stick), `panels` (title wall,
  key panel).

## Controls
Desktop: click to look (pointer lock), WASD walk, **G** audio guide, **P** postcard, **M** sound.
Mobile: left thumb-stick walk, right-half drag look. Walk into a lit doorway to change rooms.

## Run / verify
- `npm run dev` → http://localhost:5173 · `/test.html` for art tuning.
- `npm run build` (tsc + vite, base `/infinite-museum/`). `npm run typecheck`.
- Headless smoke + 30-room memory test: `node nav-test.mjs` (needs dev server + system Chrome).

## Status (see CHANGELOG.md / tasks/todo.md)
All five build-order steps implemented and live. Walkable shell, six art systems + `/test`, Tier-0
codex + impossible room graph + bounded-memory streaming + seed-in-URL, the full dressing layer
(anomalies, bench, audio guide, postcard, mobile), and the Tier-1 BYO-key curator
(`codex/tier1.ts` — one Anthropic call on entry writes a bespoke Codex that the keyless artwork +
placard generators then run against; model id in the single constant `CURATOR_MODEL`). The Tier-1
fallback path is verified (invalid key → friendly toast → keyless museum). The Tier-1 *happy* path
needs a real Anthropic key to exercise end-to-end — untested in CI by design (no key in the repo).
