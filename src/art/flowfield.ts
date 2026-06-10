// Flowfield: thousands of fine particles advected through a seeded noise field,
// laid down as translucent strokes. Reads as wind, sediment, contour maps.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt, type Rng } from '../core/prng';

// Cheap value-noise from the rng-seeded gradient grid.
function makeNoise(rng: Rng) {
  const grid = 16;
  const g: number[] = [];
  for (let i = 0; i < (grid + 1) * (grid + 1); i++) g.push(rng() * Math.PI * 2);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = x * grid, gy = y * grid;
    const x0 = Math.floor(gx) % grid, y0 = Math.floor(gy) % grid;
    const x1 = (x0 + 1) % grid, y1 = (y0 + 1) % grid;
    const fx = smooth(gx - Math.floor(gx)), fy = smooth(gy - Math.floor(gy));
    const a = g[y0 * (grid + 1) + x0], b = g[y0 * (grid + 1) + x1];
    const c = g[y1 * (grid + 1) + x0], d = g[y1 * (grid + 1) + x1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  };
}

const render: RenderFn = (ctx, size, rng, palette) => {
  const noise = makeNoise(rng);
  const particles = randInt(rng, 1400, 2600);
  const steps = randInt(rng, 60, 140);
  const stepLen = randFloat(rng, 1.4, 3.0);
  const lineW = randFloat(rng, 0.5, 1.6);
  const swirl = randFloat(rng, 1.2, 3.2);

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = lineW;

  for (let p = 0; p < particles; p++) {
    let x = rng() * size.w;
    let y = rng() * size.h;
    const colour = palette.colours[Math.floor(rng() * palette.colours.length)];
    ctx.strokeStyle = colour;
    ctx.globalAlpha = randFloat(rng, 0.02, 0.10);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++) {
      const ang = noise(x / size.w, y / size.h) * swirl;
      x += Math.cos(ang) * stepLen;
      y += Math.sin(ang) * stepLen;
      if (x < 0 || x > size.w || y < 0 || y > size.h) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // A faint settling of ink at the base to ground the image.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.16;
  const grad = ctx.createLinearGradient(0, size.h * 0.6, 0, size.h);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, palette.background);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.w, size.h);
  ctx.globalAlpha = 1;
};

registerSystem('flowfield', render);
