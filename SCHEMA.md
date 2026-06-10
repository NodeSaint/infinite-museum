# SCHEMA — Codex & Artwork

The contract between the canon author (Tier 0 fragments or Tier 1 model) and every downstream
system. Authoritative types live in `src/codex/types.ts`; this document explains them so others can
author canon fragments (`src/codex/fragments.ts`) or implement a Tier-1 prompt.

Everything is **fictional by construction**. No real artists, movements, museums or works; no
"in the style of [named artist]".

## Palette
```ts
Palette { background: string; ink: string; colours: string[] }  // hex; 2–5 accent colours
```
Drives both the wall tint of a movement's wing and every artwork rendered for it.

## ArtSystem
```ts
type ArtSystem = 'flowfield' | 'constructivist' | 'weave' | 'erosion' | 'glitch' | 'inkwash'
```
The six procedural systems. An artwork is always exactly one. A movement's `formAffinity` lists the
systems it favours; an artwork's system is drawn only from its artist's movement — this is how
form coherence is enforced.

## Movement
```ts
Movement {
  id: string                 // 'm0', 'm1', …
  name: string               // e.g. 'Neo-Lacunism'
  years: [number, number]    // active span
  manifesto: string          // one line
  paletteBias: Palette
  formAffinity: ArtSystem[]  // 2–3 systems
  rivalWith?: string         // movement id
}
```

## Artist
```ts
Artist {
  id: string                 // 'a0', 'a1', …
  name: string
  lifespan: [number, number] // [birth, death]; death 0 ⇒ living
  movementId: string
  temperament: string        // 'ascetic', 'volcanic', …
  signatureTechnique: string
  careerArc: string          // one line
  feudWith?: string          // artist id  ← drives placard 'rival' token
  scandal?: string           // optional one-line notoriety
}
```

## Codex
```ts
Codex {
  seed: number
  museumName: string
  epigraph: string
  founded: number
  movements: Movement[]      // 5–8
  artists: Artist[]          // 12–20
  timeline: { year: number; text: string }[]
  source: 'tier0' | 'tier1'
}
```

## Artwork
```ts
Artwork {
  id: string
  seed: number               // reproduces the canvas exactly
  system: ArtSystem
  params: Record<string, number>  // reserved; systems derive bounded params from `seed`
  artistId: string
  movementId: string
  title: string
  year: number
  medium: string             // fictional medium phrase
  dimensions: string         // e.g. '1820 × 1140 mm'
  placard: string            // the parody-grade critic prose — the product
}
```

## RoomSpec (graph node)
```ts
RoomSpec {
  id: string                 // = its seed in hex; ids ARE seeds
  seed: number
  movementId: string
  title: string              // wing/room name
  artworks: Artwork[]
  doors: string[]            // neighbour room ids (graph edges; not spatially consistent)
  anomaly?: { kind: 'sealed-door'|'restituted-frame'|'conservation-studio'; placard: string }
  isAtrium?: boolean
}
```

## Determinism contract
- One root seed (`hashSeed(seedLabel)`) → the entire Codex via `deriveSeed(seed, 'codex')`.
- Room seed → its RoomSpec; `deriveSeed(roomSeed, 'door:i')` → neighbour seeds (the graph).
- `deriveSeed(roomSeed, 'art:<artistId>:<i>')` → each artwork's seed → its canvas.
- No `Math.random` anywhere downstream of generation. Same URL = same museum, anywhere, keyless.

## Tier-1 authoring notes
A Tier-1 model must return JSON matching `Codex` (and, per room, `Artwork[]` with `system` + numeric
`params` + `placard`). Validate and clamp every number; reject unknown `system`; on any failure fall
back to the Tier-0 object silently. If raw SVG is ever returned, strip scripts / event attrs /
external refs / `foreignObject` before rasterising.
