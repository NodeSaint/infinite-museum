// Constructivist: hard-edged geometry — bars, wedges, discs and rules on a flat
// ground. Diagonal tension, a single dominant angle, generous negative space.

import { registerSystem, type RenderFn } from './registry';
import { randFloat, randInt, pick, type Rng } from '../core/prng';

function shape(ctx: CanvasRenderingContext2D, rng: Rng, size: { w: number; h: number }, colour: string) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.translate(rng() * size.w, rng() * size.h);
  ctx.rotate(randFloat(rng, -0.9, 0.9));
  const kind = randInt(rng, 0, 3);
  const s = randFloat(rng, 0.1, 0.55) * Math.min(size.w, size.h);
  if (kind === 0) {
    ctx.fillRect(-s, -randFloat(rng, 0.02, 0.12) * size.h, s * 2, randFloat(rng, 0.02, 0.12) * size.h);
  } else if (kind === 1) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 2) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s);
    ctx.lineTo(-s, s);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.6, 0, randFloat(rng, 0.6, 2.4) * Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
  }
  ctx.restore();
}

const render: RenderFn = (ctx, size, rng, palette) => {
  // textured ground
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, size.w, size.h);

  const dominant = randFloat(rng, -0.6, 0.6);
  const count = randInt(rng, 6, 14);
  for (let i = 0; i < count; i++) {
    shape(ctx, rng, size, pick(rng, palette.colours));
  }

  // long ruling lines along the dominant angle
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.5;
  const lines = randInt(rng, 2, 5);
  for (let i = 0; i < lines; i++) {
    ctx.lineWidth = randFloat(rng, 1, 5);
    ctx.beginPath();
    const cx = rng() * size.w, cy = rng() * size.h;
    const L = size.w + size.h;
    ctx.moveTo(cx - Math.cos(dominant) * L, cy - Math.sin(dominant) * L);
    ctx.lineTo(cx + Math.cos(dominant) * L, cy + Math.sin(dominant) * L);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // a single emphatic disc
  ctx.fillStyle = pick(rng, palette.colours);
  ctx.beginPath();
  ctx.arc(randFloat(rng, 0.2, 0.8) * size.w, randFloat(rng, 0.2, 0.8) * size.h,
    randFloat(rng, 0.05, 0.13) * Math.min(size.w, size.h), 0, Math.PI * 2);
  ctx.fill();
};

registerSystem('constructivist', render);
