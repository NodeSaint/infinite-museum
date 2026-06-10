// Weave: interlaced warp/weft bands with slight jitter, reading as textile,
// tartan, or a corrupted loom. Over/under is decided per crossing.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt, pick } from '../core/prng';

const render: RenderFn = (ctx, size, rng, palette) => {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.w, size.h);

  const cols = randInt(rng, 10, 22);
  const rows = randInt(rng, 10, 22);
  const cw = size.w / cols;
  const ch = size.h / rows;
  const jitter = randFloat(rng, 0, 0.18);

  // assign each warp/weft a colour
  const warpCols = Array.from({ length: cols }, () => pick(rng, palette.colours));
  const weftCols = Array.from({ length: rows }, () => pick(rng, palette.colours));

  const band = (x: number, y: number, w: number, h: number, colour: string, a: number) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const over = (r + c + (rng() < jitter ? 1 : 0)) % 2 === 0;
      const x = c * cw, y = r * ch;
      const jx = (rng() - 0.5) * cw * jitter;
      const jy = (rng() - 0.5) * ch * jitter;
      if (over) {
        band(x + jx, y, cw, ch * 0.92, warpCols[c], 0.9);
        band(x, y + jy, cw * 0.42, ch, weftCols[r], 0.55);
      } else {
        band(x, y + jy, cw, ch * 0.42, weftCols[r], 0.9);
        band(x + jx, y, cw * 0.92, ch, warpCols[c], 0.55);
      }
    }
  }

  // selvedge shading
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.background;
  for (let r = 0; r < rows; r++) {
    if (rng() < 0.3) ctx.fillRect(0, r * ch, size.w, ch * 0.3);
  }
  ctx.globalAlpha = 1;
};

registerSystem('weave', render);
