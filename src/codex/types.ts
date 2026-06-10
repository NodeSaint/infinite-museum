// The Codex is the fictional art history. It is generated FIRST, and every
// artwork is a citation of it. These types are the contract between the canon
// author (Tier 0 fragments / Tier 1 model) and every downstream system.
//
// See SCHEMA.md for the authored documentation of these shapes.

/** The six seeded procedural art systems. An artwork is always one of these. */
export type ArtSystem =
  | 'flowfield'
  | 'constructivist'
  | 'weave'
  | 'erosion'
  | 'glitch'
  | 'inkwash';

export const ART_SYSTEMS: readonly ArtSystem[] = [
  'flowfield',
  'constructivist',
  'weave',
  'erosion',
  'glitch',
  'inkwash',
];

/** A palette is a small set of hex colours plus a background. Drives every system. */
export interface Palette {
  background: string;
  ink: string;
  colours: string[]; // 2–5 accent colours
}

export interface Movement {
  id: string;
  name: string;
  years: [number, number];
  manifesto: string; // one line
  paletteBias: Palette;
  formAffinity: ArtSystem[]; // which art systems this movement favours
  rivalWith?: string; // movement id
}

export interface Artist {
  id: string;
  name: string;
  lifespan: [number, number];
  movementId: string;
  temperament: string; // e.g. "ascetic", "volcanic", "secretive"
  signatureTechnique: string;
  careerArc: string; // one line: how the work changed over a life
  feudWith?: string; // artist id
  scandal?: string; // optional one-line notoriety
}

export interface CodexEvent {
  year: number;
  text: string; // a line of fictional museum/art history
}

export interface Codex {
  seed: number;
  museumName: string;
  epigraph: string;
  founded: number;
  movements: Movement[];
  artists: Artist[];
  timeline: CodexEvent[];
  /** Provenance of this codex — Tier 0 (keyless) or Tier 1 (model). */
  source: 'tier0' | 'tier1';
}

// ---- Artwork ----

/** Bounded, validated parameters for one art system. The union is open; each
 *  system validates/clamps its own shape. We keep it as a record of numbers
 *  plus the seed so the offscreen renderer is fully deterministic. */
export type ArtParams = Record<string, number>;

export interface Artwork {
  id: string;
  seed: number;
  system: ArtSystem;
  params: ArtParams;
  artistId: string;
  movementId: string;
  title: string;
  year: number;
  medium: string; // fictional medium phrase
  placard: string; // the parody-grade critic prose — the product
  dimensions: string; // e.g. "1820 × 1140 mm"
}

/** A room is a node in the impossible graph. It hangs a few artworks. */
export interface RoomSpec {
  id: string;
  seed: number;
  movementId: string;
  title: string; // wing/room name
  artworks: Artwork[];
  doors: string[]; // neighbour room ids (graph edges)
  anomaly?: Anomaly;
  isAtrium?: boolean;
}

export type AnomalyKind = 'sealed-door' | 'restituted-frame' | 'conservation-studio';

export interface Anomaly {
  kind: AnomalyKind;
  placard: string;
}
