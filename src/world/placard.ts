// A wall placard: title / artist / dates, then the critic prose. Rendered to a
// canvas texture sized so the body resolves only at reading distance — which is
// the intended experience. Brass plaque, dark engraving.

import * as THREE from 'three';
import type { Artwork, Artist } from '../codex/types';

export interface Placard {
  mesh: THREE.Mesh;
  dispose(): void;
}

const PLAQUE_W = 0.34; // metres
const PLAQUE_H = 0.26;
const PX = 1024;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function makePlacard(artwork: Artwork, artist: Artist): Placard {
  const canvas = document.createElement('canvas');
  canvas.width = PX;
  canvas.height = Math.round(PX * (PLAQUE_H / PLAQUE_W));
  const ctx = canvas.getContext('2d')!;

  // brass ground with a faint vignette
  ctx.fillStyle = '#cdae72';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
  vg.addColorStop(0, 'rgba(255,245,220,0.25)');
  vg.addColorStop(1, 'rgba(40,28,10,0.25)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pad = 46;
  const maxW = canvas.width - pad * 2;
  const ink = '#241a0c';
  ctx.fillStyle = ink;
  ctx.textBaseline = 'top';

  let y = pad;
  // artist name (small caps feel)
  ctx.font = '600 34px Georgia, "Times New Roman", serif';
  ctx.fillText(artist.name.toUpperCase(), pad, y);
  y += 44;

  // dates
  ctx.font = 'italic 26px Georgia, serif';
  const death = artist.lifespan[1] ? artist.lifespan[1] : '';
  ctx.fillText(`${artist.lifespan[0]}–${death}`, pad, y);
  y += 40;

  // title, year
  ctx.font = 'italic 30px Georgia, serif';
  for (const l of wrap(ctx, `${artwork.title}, ${artwork.year}`, maxW)) {
    ctx.fillText(l, pad, y);
    y += 36;
  }
  y += 6;

  // medium
  ctx.font = '22px Georgia, serif';
  for (const l of wrap(ctx, `${artwork.medium}. ${artwork.dimensions}.`, maxW)) {
    ctx.fillText(l, pad, y);
    y += 28;
  }
  y += 10;

  // body prose (smaller; resolves at reading distance)
  ctx.font = '21px Georgia, serif';
  for (const l of wrap(ctx, artwork.placard, maxW)) {
    if (y > canvas.height - pad) break;
    ctx.fillText(l, pad, y);
    y += 26;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const geo = new THREE.PlaneGeometry(PLAQUE_W, PLAQUE_H);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);

  return {
    mesh,
    dispose() {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}
