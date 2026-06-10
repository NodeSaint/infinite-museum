# CLAUDE.md — The Infinite Museum (project)

Supplements the global master CLAUDE.md. If anything here conflicts with it, flag it; nothing here
is intended to.

## What this is
A zero-backend, procedurally generated, walkable 3D art museum with a self-consistent **fictional**
art history. Read `PRIMER.md` first (one-screen spec + code map), then `SCHEMA.md` for the data
contract. Architectural decisions are fixed in PRIMER §"Architecture spine" — honour them exactly.

## Hard rules
- **British English** everywhere: copy, comments, docs, placards.
- **No framework.** Vanilla TS + Three.js. HUD/panels are plain DOM. One store module (`src/store.ts`).
- **Determinism.** No `Math.random` downstream of generation except the explicit untethered
  random-seed label. Same seed ⇒ identical museum, anywhere, keyless.
- **Everything fictional.** No real artists/movements/museums/works; no "in the style of [named
  artist]". Drama (rivalry, forgery, censorship) yes; sexual content, graphic violence, or
  real-tragedy references no. Sanitise any Tier-1 SVG before rasterising.
- **Tool currency.** Start from the newest stable Vite/Three/TS; pin exact versions.
- **Keyless and dead-network modes must never break.** Tier 1 always falls back to Tier 0 silently.

## Workflow
- Branches: work on `dev`; merge to `main` only when stable (Pages deploys from `main`).
- Log every push in `CHANGELOG.md` (absolute dates). Update `PRIMER.md` before context is lost.
- Use the specialist agents in `.claude/agents/` (`canon-author`, `art-systems`, `engine-dev`,
  `deploy`) — one responsibility each.
- Verify before claiming done: `npm run typecheck`, `npm run build`, and the headless
  `node nav-test.mjs` (boots Chrome, walks 30 rooms, asserts 0 errors + bounded memory).

## Build order (see tasks/todo.md)
1. Walkable shell + live URL ✅  2. Six art systems + /test ✅  3. Tier-0 codex + graph + streaming
✅  4. Dressing (anomalies/bench/guide/postcard/mobile) ✅  5. Tier-1 BYO-key curator (stub → full).
