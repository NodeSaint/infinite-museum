// Glitch: a latent image torn into channel-shifted scanline blocks, datamosh
// displacement and quantisation bands. Reads as signal decay, censorship.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt, pick } from '../core/prng';

const render: RenderFn = (ctx, size, rng, palette) => {
  // base: soft vertical gradient of two palette colours
  const g = ctx.createLinearGradient(0, 0, 0, size.h);
  g.addColorStop(0, pick(rng, palette.colours));
  g.addColorStop(1, palette.background);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size.w, size.h);

  // quantisation bands
  const bands = randInt(rng, 8, 20);
  for (let i = 0; i < bands; i++) {
    const y = rng() * size.h;
    const h = randFloat(rng, 4, 60);
    ctx.globalAlpha = randFloat(rng, 0.05, 0.3);
    ctx.fillStyle = pick(rng, palette.colours);
    ctx.fillRect(0, y, size.w, h);
  }
  ctx.globalAlpha = 1;

  // channel-shifted block tears
  const tears = randInt(rng, 14, 40);
  for (let i = 0; i < tears; i++) {
    const y = rng() * size.h;
    const h = randFloat(rng, 6, 80);
    const dx = randFloat(rng, -0.12, 0.12) * size.w;
    try {
      ctx.drawImage(ctx.canvas, 0, y, size.w, h, dx, y, size.w, h);
    } catch {
      /* drawImage from same canvas can throw on some engines; skip */
    }
    // RGB split accents
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = pick(rng, palette.colours);
    ctx.fillRect(dx > 0 ? 0 : size.w + dx, y, Math.abs(dx), h);
  }
  ctx.globalAlpha = 1;

  // scanlines
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = palette.background;
  for (let y = 0; y < size.h; y += 3) ctx.fillRect(0, y, size.w, 1);

  // a censored bar
  if (rng() < 0.6) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.ink;
    ctx.fillRect(randFloat(rng, 0.1, 0.5) * size.w, randFloat(rng, 0.2, 0.7) * size.h,
      randFloat(rng, 0.2, 0.45) * size.w, randFloat(rng, 0.02, 0.06) * size.h);
  }
  ctx.globalAlpha = 1;
};

registerSystem('glitch', render);
