// Inkwash: layered translucent blooms and dry-brush drags on a pale ground,
// with a few decisive dark strokes. Reads as sumi-e, weather, breath.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt, pick, type Rng } from '../core/prng';

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, rng: Rng) {
  // irregular soft blob via many overlapping low-alpha arcs
  const blobs = randInt(rng, 14, 30);
  for (let i = 0; i < blobs; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * r;
    const rr = r * randFloat(rng, 0.2, 0.6);
    const grad = ctx.createRadialGradient(x + Math.cos(a) * d, y + Math.sin(a) * d, 0,
      x + Math.cos(a) * d, y + Math.sin(a) * d, rr);
    grad.addColorStop(0, colour);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = randFloat(rng, 0.04, 0.12);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, Math.PI * 2);
    ctx.fill();
  }
}

const render: RenderFn = (ctx, size, rng, palette) => {
  // pale ground — lift toward ink so washes read
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.w, size.h);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = palette.ink;
  ctx.fillRect(0, 0, size.w, size.h);
  ctx.globalAlpha = 1;

  const blooms = randInt(rng, 4, 9);
  for (let i = 0; i < blooms; i++) {
    bloom(ctx, rng() * size.w, rng() * size.h,
      randFloat(rng, 0.1, 0.32) * Math.min(size.w, size.h),
      pick(rng, palette.colours), rng);
  }

  // dry-brush drags
  ctx.globalCompositeOperation = 'source-over';
  const drags = randInt(rng, 3, 8);
  for (let i = 0; i < drags; i++) {
    const x0 = rng() * size.w, y0 = rng() * size.h;
    const ang = randFloat(rng, -1, 1);
    const len = randFloat(rng, 0.15, 0.5) * size.w;
    const bristles = randInt(rng, 8, 20);
    ctx.strokeStyle = palette.ink;
    for (let b = 0; b < bristles; b++) {
      ctx.globalAlpha = randFloat(rng, 0.02, 0.12);
      ctx.lineWidth = randFloat(rng, 0.5, 2);
      const off = (b - bristles / 2) * randFloat(rng, 1, 3);
      ctx.beginPath();
      let x = x0 + Math.cos(ang + Math.PI / 2) * off;
      let y = y0 + Math.sin(ang + Math.PI / 2) * off;
      ctx.moveTo(x, y);
      const segs = 18;
      for (let s = 0; s < segs; s++) {
        x += Math.cos(ang) * (len / segs) + randFloat(rng, -2, 2);
        y += Math.sin(ang) * (len / segs) + randFloat(rng, -2, 2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // one decisive dark accent
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.ellipse(randFloat(rng, 0.3, 0.7) * size.w, randFloat(rng, 0.3, 0.7) * size.h,
    randFloat(rng, 0.01, 0.04) * size.w, randFloat(rng, 0.05, 0.14) * size.h,
    randFloat(rng, -1, 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

registerSystem('inkwash', render);
