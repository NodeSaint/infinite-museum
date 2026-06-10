# THE INFINITE MUSEUM
*A procedurally generated art museum with a fictional art history that has never existed — different for every visitor.*

---

## 1. The idea, sharpened

The throwaway version of this idea is "random AI images on gallery walls." That is a screensaver, and it would be boring within four rooms.

The serious version rests on one design decision: **the museum generates a coherent fictional art history first, and artworks second.** On entry, the engine produces a *Codex* — an invented canon: six or so art movements with dates, manifestos and rivalries; fifteen to twenty fictional artists with lifespans, allegiances, feuds and late-career betrayals. Every artwork you encounter is then generated *as a citation of that canon*. The placard beside a painting doesn't just describe the image — it situates it: who the artist studied under, which movement expelled them, what the (fictional) critics said in 1962, why this piece scandalised the (fictional) Biennale.

The result is that walking the museum produces the sensation of *learning* a history — picking up recurring names, recognising a movement's fingerprints in a new room, spotting a reference to a feud you read about three galleries ago. That coherence is what no slideshow of random images can fake, and it is the thing visitors will screenshot and talk about.

Second decision: **the artworks are code, not image files.** Each piece is generated as parameters into one of a family of procedural art systems (flow fields, constructivist geometry, weaving lattices, erosion fields, glitch tapestries, ink-wash simulations) or as sanitised SVG composed live. This means zero image hosting, zero generation cost in the free tier, instant render, infinite variety — and it makes the optional AI tier (below) cheap, because the model returns a few hundred tokens of parameters and prose rather than megabytes of pixels.

Third decision: **the floor plan is impossible, on purpose.** Rooms are nodes in a graph, not positions in space. Door A in Room 3 can lead to a room that physically overlaps Room 1. Walk in a circle and you will not return to where you started. This is both a performance strategy (only the current room and its neighbours exist in memory) and the museum's signature unease — visitors gradually realise the architecture cannot exist, which is exactly the right feeling for a museum of art that doesn't either.

## 2. The experience, walked through

You arrive at a URL. A title wall: the museum's generated name (*The Vehrling Collection*, *Museum of the Second Tide* — generated per seed), founding date, a one-line epigraph from its fictional founder. You click to enter; pointer-lock engages (on mobile, a thumb-stick).

The atrium is tall, dim, top-lit. Ambient sound: a low generative drone, your own footsteps, the occasional distant murmur. Artworks hang lit on dark walls. Approach one and the placard text resolves at reading distance; press **G** and an audio guide (browser speech synthesis, free and offline) reads it to you in measured tones. A bench in each room. You can sit. Nothing happens. That is the point.

Doorways glow faintly at the edges. Pass through one and the next gallery streams in — its artworks generated in the seconds you spent in the previous room, so nothing visibly loads. Wing by wing, the Codex's movements get their own architecture: the Brutalist wing for the *Concrete Lyricists*, a low warm-wood gallery for the *Domestic Mystics*. Every twelfth room or so: an anomaly — a sealed door with only a placard; a room containing a single empty frame "restituted, 1977"; the conservation studio, glimpsed through glass.

In the corner of every room: a small **Postcard** control. It frames the nearest artwork with its placard and museum branding and exports a PNG. That postcard is the viral object.

The URL hash carries the seed. Share it and someone else walks *your* museum — same canon, same rooms, same scandals. Strip the hash and you get a fresh universe. An optional "untethered" mode generates with no seed and shows a quiet warning: *this museum will not exist again*.

## 3. Architecture

### 3.1 Tiered generation (the hybrid pattern, again)

| Tier | Requires | What generates the content |
|---|---|---|
| **0 — Offline canon** | Nothing | A hand-authored library of canon *fragments* (movement templates, artist name-grammar, feud archetypes, placard grammars) recombined by a seeded PRNG into a coherent Codex. Fully deterministic per seed. This must be good enough to ship alone. |
| **1 — Living curator** | Visitor's own Anthropic API key (BYO-key, browser-only) | One API call on entry generates a bespoke Codex as JSON; per-room calls generate artworks-as-parameters + placard prose that cite it. Falls back to Tier 0 per-call on any failure. |

The BYO-key pattern is the same as War Games: key pasted into a settings panel, stored only in `localStorage`, direct browser call with the `anthropic-dangerous-direct-browser-access: true` header, model name in one editable constant, graceful keyless behaviour everywhere. No backend. Safe in a public repo.

### 3.2 The Codex (single source of truth)

```ts
interface Codex {
  museumName: string; epigraph: string; founded: number;
  movements: Movement[];   // 5–8: name, years, manifesto line, palette bias,
                           // formAffinity (which procedural systems it favours), rivalWith
  artists: Artist[];       // 12–20: name, lifespan, movementId, temperament,
                           // signatureTechnique, careerArc, feudWith?, scandal?
  timeline: Event[];       // exhibitions, expulsions, fires, forgeries
}
```

Every artwork generator receives `(codex, artistId, roomTheme, seed)` and must produce output consistent with the artist's movement (palette bias, form affinity) — this is what makes coherence *enforceable* rather than hoped-for.

### 3.3 Artworks as parameters

```ts
interface Artwork {
  id: string; artistId: string; title: string; year: number; medium: string;
  system: 'flowfield'|'constructivist'|'weave'|'erosion'|'glitch'|'inkwash'|'svg';
  params: Record<string, number|string>;   // bounded, validated per system
  svg?: string;                            // Tier 1 only; sanitised before render
  placard: { body: string; provenance: string; controversy?: string };
  aspect: [number, number];
}
```

Render path: parameters → offscreen canvas (2048px long edge) → `CanvasTexture` → framed plane in Three.js. SVG path: sanitise hard (strip `<script>`, event attributes, external refs, `<foreignObject>`) → rasterise → same pipeline. Frames and lighting do enormous aesthetic work: a mediocre generative image in a walnut frame under a warm spotlight at 2.4 m reads as art.

### 3.4 Room graph and streaming

- Rooms are graph nodes: `{ id, wingId (movement), layoutTemplate, doorways[], artworks[], anomaly? }`.
- Layout templates (8–10 hand-built): atrium, long gallery, octagon, corridor, double-height hall, cabinet room. Procedural variation in dimensions, wall colour, light temperature within each.
- **Liveness budget: 3 rooms** (current + adjacent through any door). Generate neighbours when the visitor enters a room; dispose geometry, textures and materials of rooms two steps behind. Doorway transitions mask the swap with a 300 ms luminance dip.
- Non-Euclidean by construction: doors carry the visitor to graph neighbours with no global coordinate consistency. No portal rendering needed in MVP — the door frame simply occludes the join.

### 3.5 Stack

Vite + **vanilla TypeScript** + Three.js. No React — the UI is a HUD, two panels and a settings drawer; a framework would be dead weight in a pointer-locked walking sim. Zustand-style state is replaced by one plain store module. `PointerLockControls` desktop, nipple-style virtual stick mobile. Web Audio for ambience and footsteps; `speechSynthesis` for the audio guide. GitHub Pages via Actions, HashRouter-equivalent (seed and room live in the URL hash). British English throughout.

## 4. Content safety rails (non-negotiable)

- All artists, critics, institutions and quotes are **fictional**. Generation prompts must forbid real people's names, real museums, real artworks, and pastiche of named living artists ("in the style of X" is banned).
- Placard themes: scandal, rivalry, forgery, censorship — yes. No sexual content, no graphic violence, no real-world tragedy cosplay.
- SVG sanitisation as in §3.3; parameter validation clamps every numeric input.

## 5. Build phases

1. **Walkable shell** — three hand-authored rooms, lighting, movement, placards, deploy to Pages. *Prove the feeling first.*
2. **Procedural art systems** — the six generators, seeded, with a test page rendering 50 artworks per system for tuning.
3. **Codex Tier 0 + room graph** — seeded canon, streaming rooms, disposal, seed-in-URL.
4. **Dressing** — audio, anomaly rooms, postcard export, mobile controls.
5. **Tier 1 living curator** — BYO-key panel, Codex generation call, per-room artwork calls, fallbacks.

## 6. Acceptance criteria

- A seed URL reproduces the identical museum (name, canon, rooms, artworks) on any machine, keyless.
- 30 consecutive rooms on a mid-range laptop with no memory growth (disposal verified) and 60 fps desktop / 30 fps mobile.
- A visitor can read ten placards and correctly answer "which two artists hated each other?" — coherence test.
- Postcard export produces a shareable PNG with artwork, placard and museum name.
- With a key set, generation visibly improves; with no key or a dead network, nothing breaks.

## 7. Risks and honest answers

- **"Procedural art looks samey."** Mitigated by movement-biased palettes/forms, six distinct systems, and ruthless tuning in Phase 2's test page. Frames and lighting carry the rest.
- **Placard prose quality is the product.** Tier 0 grammar must be written like a parody-grade art critic. Budget real authoring time; this is where the museum lives or dies.
- **Scope creep into a game.** No collectibles, no map, no objectives. It is a museum. Wandering *is* the mechanic.

---

## 8. Claude Code kickoff prompt

````markdown
# Build: The Infinite Museum — procedurally generated art museum with a fictional canon

You are building a public, zero-backend, walkable 3D museum that generates a coherent FICTIONAL art
history (a "Codex") and then generates every artwork as a citation of it. Deploys to GitHub Pages.
British English throughout — copy, comments, docs, placards.

Work end-to-end; ask only if genuinely blocked. Build the walkable shell first and get it live,
then layer generation on. A real URL early beats completeness.

## Stack
- Vite + vanilla TypeScript + Three.js. NO React — HUD and panels are plain DOM. One store module.
- PointerLockControls (desktop) + virtual thumb-stick (mobile). Web Audio ambience + footsteps.
  speechSynthesis audio guide reading placards.
- GitHub Pages via Actions from `main`; `dev` is the working branch. Vite `base: '/infinite-museum/'`.
  Seed + current room live in the URL hash (shareable, reproducible).

## Core architecture — these decisions are the spine, implement exactly
1. CODEX-FIRST. On entry, generate a Codex: museumName, epigraph, founded; 5–8 Movements (name,
   years, one-line manifesto, paletteBias, formAffinity → which art systems they favour, rivalWith);
   12–20 Artists (name, lifespan, movementId, temperament, signatureTechnique, careerArc, optional
   feudWith/scandal); a timeline of fictional events. Every artwork generator takes
   (codex, artistId, roomTheme, seed) and MUST respect the artist's movement palette/form bias.
   Coherence is enforced, not hoped for.
2. ARTWORKS ARE CODE. Six seeded procedural systems: flowfield, constructivist, weave, erosion,
   glitch, inkwash. Each: bounded validated params → offscreen canvas (2048px long edge) →
   CanvasTexture on a framed plane. Build a hidden /test page that renders 50 outputs per system
   for tuning. Frames + warm spotlights do the aesthetic heavy lifting.
3. IMPOSSIBLE FLOOR PLAN. Rooms are nodes in a graph, not positions in space; doors teleport to
   graph neighbours with no global consistency. Liveness budget: 3 rooms (current + neighbours).
   Generate neighbours on room entry; fully dispose geometry/materials/textures two steps behind
   (verify no memory growth). Mask transitions with a 300 ms luminance dip.
4. HYBRID GENERATION.
   - Tier 0 (always works, keyless): hand-authored canon fragments (movement templates, artist
     name-grammar, feud archetypes, placard grammars) recombined by a seeded PRNG (mulberry32 or
     similar; seed reproduces EVERYTHING). Write the placard grammar like a parody-grade art critic
     — this prose is the product.
   - Tier 1 (optional): user pastes their own Anthropic API key (localStorage only, never committed);
     direct browser calls with header `anthropic-dangerous-direct-browser-access: true`; model name
     in ONE editable constant. One call on entry → bespoke Codex JSON; one call per room → artworks
     (system + params + placard prose citing the codex) as strict JSON. Validate and clamp all
     params; on any failure fall back to Tier 0 silently. Clear in-interface guidance for
     missing-key/network errors; never a raw stack trace.
5. SAFETY RAILS. All people/institutions/quotes fictional; generation prompts forbid real artists,
   real museums, real artworks, and "in the style of [named artist]". Placard drama (rivalry,
   forgery, censorship) yes; sexual content, graphic violence, real-tragedy references no.
   If Tier 1 ever returns raw SVG, sanitise hard (strip scripts/event attrs/external refs/
   foreignObject) before rasterising.

## Experience requirements
Title wall (generated museum name + epigraph) → atrium → galleries themed per movement wing.
Placards resolve at reading distance; G = audio guide. A bench per room (sittable, does nothing —
deliberately). Every ~12th room an anomaly: sealed door with placard, empty "restituted 1977" frame,
conservation studio behind glass. Postcard button: composites nearest artwork + placard + museum
branding to a PNG download. Untethered mode: random seed + warning "this museum will not exist again".

## Aesthetic
Dim, top-lit, dark walls, warm artwork spotlights, walnut/brass frames. Quiet generative drone,
soft footsteps. The HUD nearly invisible. The signature feeling: reverence + slow unease as the
visitor realises the architecture cannot exist.

## Repo & workflow (my standards)
Public repo `infinite-museum` under `nuvixstudio`. Create CLAUDE.md, PRIMER.md (one-screen spec),
CHANGELOG.md, ISSUES.md, tasks/todo.md, tasks/lessons.md, and .claude/agents/: `canon-author`,
`art-systems`, `engine-dev`, `deploy`. Document the Codex + Artwork schemas in SCHEMA.md so others
can author canon fragments. Dev server locally; log decisions in CHANGELOG.

## Build order
1. Walkable shell: 3 hand-authored rooms, lighting, movement, placards, audio → push, deploy,
   confirm live URL.
2. Six art systems + /test tuning page.
3. Tier 0 Codex + room graph + streaming/disposal + seed-in-URL.
4. Dressing: anomalies, benches, audio guide, postcard export, mobile controls.
5. Tier 1 BYO-key living curator with fallbacks.

## Acceptance criteria
- Same seed URL reproduces the identical museum anywhere, keyless.
- 30 consecutive rooms, no memory growth, 60 fps desktop / 30 fps mobile mid-range.
- Coherence test: after ten placards a visitor can say which two artists feuded.
- Postcard PNG export works. Keyless and dead-network modes never break.

Start now: scaffold, write PRIMER.md, then proceed through the build order. Flag blockers; otherwise keep going.
````
