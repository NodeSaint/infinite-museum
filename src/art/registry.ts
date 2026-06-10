// The art-system registry, in its own module so it initialises before any
// system registers into it. (If this lived in index.ts, the hoisted side-effect
// imports of the systems would run registerSystem() while `registry` was still
// in its temporal dead zone.)

import type { Rng } from '../core/prng';
import type { ArtSystem, Palette } from '../codex/types';

export interface ArtSize {
  w: number;
  h: number;
}

export type RenderFn = (
  ctx: CanvasRenderingContext2D,
  size: ArtSize,
  rng: Rng,
  palette: Palette,
) => void;

const registry = new Map<ArtSystem, RenderFn>();

export function registerSystem(name: ArtSystem, fn: RenderFn): void {
  registry.set(name, fn);
}

export function getSystem(name: ArtSystem): RenderFn | undefined {
  return registry.get(name);
}

export function hasSystem(name: ArtSystem): boolean {
  return registry.has(name);
}
