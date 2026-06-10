// Artworks are code. Each of the six systems draws onto a 2048px-long-edge
// offscreen canvas from bounded, seed-derived params. The room builder wraps
// the result in a CanvasTexture on a framed plane.
//
// The registry itself lives in ./registry so it initialises before the
// side-effect imports below register into it.

import * as THREE from 'three';
import { mulberry32, type Rng } from '../core/prng';
import type { ArtSystem, Palette } from '../codex/types';
import { getSystem, type ArtSize } from './registry';

export { registerSystem, hasSystem } from './registry';
export type { RenderFn, ArtSize } from './registry';

const LONG_EDGE = 2048;

/** Derive a portrait/landscape canvas size with the long edge at 2048. */
export function canvasSize(rng: Rng): ArtSize {
  const portrait = rng() < 0.55;
  const ratio = 0.62 + rng() * 0.25; // short/long edge ∈ [0.62, 0.87]
  const short = Math.round(LONG_EDGE * ratio);
  return portrait ? { w: short, h: LONG_EDGE } : { w: LONG_EDGE, h: short };
}

/** Render an artwork to a CanvasTexture. Falls back to a calm fill if the
 *  requested system is not registered (keeps the shell rendering). */
export function renderArtwork(
  system: ArtSystem,
  seed: number,
  palette: Palette,
): THREE.CanvasTexture {
  const rng = mulberry32(seed);
  const size = canvasSize(rng);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.w, size.h);

  const fn = getSystem(system);
  if (fn) {
    try {
      fn(ctx, size, rng, palette);
    } catch {
      drawFallback(ctx, size, palette);
    }
  } else {
    drawFallback(ctx, size, palette);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawFallback(ctx: CanvasRenderingContext2D, size: ArtSize, palette: Palette): void {
  const g = ctx.createLinearGradient(0, 0, size.w, size.h);
  g.addColorStop(0, palette.colours[0]);
  g.addColorStop(1, palette.background);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size.w, size.h);
}

// Side-effect imports register each system. Adding a new system = one import.
import './flowfield';
import './constructivist';
import './weave';
import './erosion';
import './glitch';
import './inkwash';
