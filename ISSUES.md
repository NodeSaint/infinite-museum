# ISSUES — The Infinite Museum

Known issues, limitations and ideas. Newest first.

## Open
- **Tier 1 happy path untested in CI.** `codex/tier1.ts` is fully implemented (bespoke Codex on
  entry, strict validation, silent fallback) and the *failure* path is verified, but writing a real
  bespoke museum needs a live Anthropic key, which is intentionally absent from the repo.
- **Tier 1 writes the Codex, not per-room artworks.** The bespoke canon drives the keyless artwork +
  placard generators (so placards cite the model-written manifestos/feuds). A per-room Tier-1 call
  (system + params + placard as strict JSON) plus the SVG sanitiser are the documented next step.
- **No collision with the bench / walls beyond bounds.** Movement is clamped to the room rectangle;
  the bench and frames are not solid. Acceptable (museum pace), revisit if it feels wrong.
- **Placards are read off a single texture.** Long Tier-1 prose may overflow the plaque; the body is
  truncated to fit. Consider a "read closer" overlay for full text.
- **Audio guide voice** depends on the platform's available `speechSynthesis` voices; en-GB is
  preferred but not guaranteed.
- **Favicon 404** in dev console (no `favicon.ico`). Cosmetic; add an icon.
- **Bundle**: Three.js makes the art chunk ~530 kB (135 kB gzip). Fine for now; could lazy-split.

## Resolved
- **Black screen on entry** — camera spawned facing the entrance wall and `spawn.yaw` was never
  applied to the controls. Fixed: `controls.setYaw`, yaw convention (0 = into room), doors moved off
  the front (spawn) wall, plus a 0.8 s entry cooldown so spawning doesn't instantly re-trigger a door.
- **`Cannot access 'registry' before initialization`** — hoisted side-effect imports in `art/index.ts`
  ran `registerSystem` while the `registry` const was in its TDZ. Fixed by moving the registry into
  `art/registry.ts`, which initialises before the systems import it.
