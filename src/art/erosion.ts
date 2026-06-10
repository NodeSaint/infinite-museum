// Erosion: stratified bands eaten away by a seeded threshold field, leaving
// coastlines, sediment and rust. Reads as geology, decay, tide-marks.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt } from '../core/prng';

const render: RenderFn = (ctx, size, rng, palette) => {
  const layers = [palette.background, ...palette.colours, palette.ink];
  const strata = randInt(rng, 6, 12);
  const amp = randFloat(rng, 0.02, 0.10) * size.h;
  const freq = randFloat(rng, 2, 6);
  const phase = rng() * Math.PI * 2;
  const grain = randFloat(rng, 0.3, 0.8);

  for (let i = 0; i < strata; i++) {
    const colour = layers[i % layers.length];
    const baseY = (i / strata) * size.h;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, size.h);
    ctx.lineTo(0, baseY);
    const localFreq = freq * randFloat(rng, 0.7, 1.4);
    const localAmp = amp * randFloat(rng, 0.5, 1.5);
    for (let x = 0; x <= size.w; x += 6) {
      const t = x / size.w;
      const y =
        baseY +
        Math.sin(t * localFreq * Math.PI * 2 + phase + i) * localAmp +
        Math.sin(t * localFreq * 6 + i) * localAmp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(size.w, size.h);
    ctx.closePath();
    ctx.fill();
  }

  // pitting / erosion speckle, denser toward the top
  const dots = randInt(rng, 4000, 9000);
  for (let d = 0; d < dots; d++) {
    const x = rng() * size.w;
    const y = rng() * rng() * size.h; // bias upward
    ctx.globalAlpha = grain * 0.5 * rng();
    ctx.fillStyle = rng() < 0.5 ? palette.background : palette.ink;
    const s = rng() * 3;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
};

registerSystem('erosion', render);
