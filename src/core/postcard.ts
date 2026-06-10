// Postcard export: composite the nearest artwork, its placard text and the
// museum branding into a single PNG the visitor can keep. The only thing they
// can take from a museum that will not exist again.

import type { Artwork, Artist } from '../codex/types';

export function makePostcard(
  source: HTMLCanvasElement,
  artwork: Artwork,
  artist: Artist,
  museumName: string,
  seedLabel: string,
): void {
  const W = 1400;
  const H = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // card ground
  ctx.fillStyle = '#100d0a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#15110c';
  ctx.fillRect(40, 40, W - 80, H - 80);

  // artwork, framed, on the left
  const artMaxW = 720;
  const artMaxH = 760;
  const aspect = source.width / source.height;
  let aw = artMaxW;
  let ah = aw / aspect;
  if (ah > artMaxH) {
    ah = artMaxH;
    aw = ah * aspect;
  }
  const ax = 90;
  const ay = (H - ah) / 2;
  // walnut frame
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(ax - 22, ay - 22, aw + 44, ah + 44);
  ctx.fillStyle = '#b08d4c';
  ctx.fillRect(ax - 6, ay - 6, aw + 12, ah + 12);
  ctx.drawImage(source, ax, ay, aw, ah);

  // text column on the right
  const tx = ax + aw + 70;
  const tw = W - tx - 80;
  let ty = ay + 8;
  ctx.fillStyle = '#e7dcc8';
  ctx.textBaseline = 'top';

  ctx.font = '600 30px Georgia, serif';
  ty = drawWrapped(ctx, artist.name.toUpperCase(), tx, ty, tw, 38);
  ty += 6;
  ctx.font = 'italic 26px Georgia, serif';
  ty = drawWrapped(ctx, `${artwork.title}, ${artwork.year}`, tx, ty, tw, 32);
  ty += 4;
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#b6a98f';
  ty = drawWrapped(ctx, `${artwork.medium}. ${artwork.dimensions}.`, tx, ty, tw, 24);
  ty += 18;
  ctx.fillStyle = '#cdc2a8';
  ctx.font = '19px Georgia, serif';
  ty = drawWrapped(ctx, artwork.placard, tx, ty, tw, 26, 18);

  // branding footer
  ctx.fillStyle = '#8a7d62';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText(museumName, tx, H - 130);
  ctx.font = '15px ui-monospace, monospace';
  ctx.fillStyle = '#6a6048';
  ctx.fillText(`seed ${seedLabel} · this museum will not exist again`, tx, H - 96);

  // download
  const a = document.createElement('a');
  a.download = `infinite-museum-${seedLabel}-${artwork.id}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines = 99,
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      lines++;
      if (lines >= maxLines) return y;
      line = w;
    } else line = test;
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}
