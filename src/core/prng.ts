// Seeded deterministic randomness. The same seed must reproduce EVERYTHING:
// codex, room graph, artwork params, placard prose. No Math.random anywhere
// downstream of generation.

export type Rng = () => number;

/** mulberry32 — fast, tiny, good enough for procedural art. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string to a 32-bit seed (xfnv1a). */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Derive a stable child seed from a parent seed and a label. */
export function deriveSeed(parent: number, label: string): number {
  return (hashSeed(label) ^ Math.imul(parent, 2654435761)) >>> 0;
}

// ---- Helpers bound to an Rng ----

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Fisher–Yates, returns a new shuffled array. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick `n` distinct items. If n >= length, returns a full shuffle. */
export function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(rng, arr).slice(0, Math.min(n, arr.length));
}

/** Weighted boolean. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Clamp helper used widely when validating params. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
