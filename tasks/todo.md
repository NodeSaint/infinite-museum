# tasks/todo.md — The Infinite Museum

## Build order (from the spec)
- [x] **1. Walkable shell + live URL** — scaffold, 3+ rooms, lighting, movement, placards, audio →
  push, deploy, confirm live URL.
- [x] **2. Six art systems + /test tuning page** — flowfield, constructivist, weave, erosion,
  glitch, inkwash; bounded params → 2048px canvas → texture; `/test.html` renders 50/system.
- [x] **3. Tier 0 Codex + room graph + streaming + seed-in-URL** — fragments → PRNG codex; impossible
  graph; current-room-only liveness; seed + room in URL hash.
- [x] **4. Dressing** — anomalies (sealed door / restituted frame / conservation studio), sittable
  bench, audio guide (G), postcard PNG export (P), mobile thumb-stick + drag-look.
- [x] **5. Tier 1 BYO-key living curator** — paste Anthropic key (localStorage); one call on entry →
  bespoke Codex JSON; validate/clamp; silent Tier-0 fallback; in-interface guidance for
  missing-key/network errors. Model id in ONE constant (`CURATOR_MODEL`). The keyless Tier-0 artwork
  + placard generators run against the Tier-1 codex (coherence preserved).

## Now
- [x] Create repo `NodeSaint/infinite-museum`, push `main` + `dev`, enable Pages, confirm live URL.
- [x] Implement Tier 1 in `codex/tier1.ts` (model id in ONE editable constant).

## Follow-ups (optional)
- [ ] Per-room Tier-1 artwork calls (system + params + placard prose as strict JSON) — currently the
  Tier-1 codex drives the keyless generators, which already cite the bespoke canon. Add the SVG
  sanitiser (strip scripts/event-attrs/external-refs/foreignObject) if/when the model returns raw SVG.
- [ ] Exercise the Tier-1 happy path with a real Anthropic key (untestable in CI).
- [ ] fps confirmation on real mid-range mobile hardware.

## Review
See CHANGELOG.md (2026-06-10). Shell verified headless: codex generates, atrium renders, WebGL live,
0 console errors; 30-room nav/memory test in `nav-test.mjs`.

## Acceptance criteria (track to green)
- [x] Same seed URL reproduces the identical museum, keyless. (Determinism by construction; URL hash.)
- [ ] 30 consecutive rooms, no memory growth, 60 fps desktop / 30 fps mobile. (Memory test added;
  confirm fps on devices.)
- [x] Coherence: after ten placards a visitor can name which two artists feuded. (feudWith → placard
  'rival' token, consistent across the museum.)
- [x] Postcard PNG export works. (P key.)
- [x] Keyless and dead-network modes never break. (Tier 0 is the default path.)
