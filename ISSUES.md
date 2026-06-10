# ISSUES — The Infinite Museum

Known issues, limitations and ideas. Newest first.

## Open
- **Tier 1 is a stub.** `codex/tier1.ts` always returns `null` (→ Tier 0). Full BYO-key curator
  (Codex on entry, artworks per room, validation/clamp, SVG sanitisation) is build-order step 5.
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
