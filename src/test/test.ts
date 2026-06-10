// Hidden tuning page: renders 50 outputs per art system across the movement
// palettes so each system can be judged and tuned in bulk. Not linked from the
// museum; reachable at /test.html.

import '../art/index';
import { renderArtwork } from '../art/index';
import { ART_SYSTEMS } from '../codex/types';
import { PALETTES } from '../codex/fragments';
import { hashSeed } from '../core/prng';

const root = document.body;
const PER_SYSTEM = 50;

const style = document.createElement('style');
style.textContent = `
  h2 { margin: 28px 16px 8px; color: #e7dcc8; font: 600 18px Georgia, serif; letter-spacing: 0.08em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding: 0 16px; }
  .cell { background: #000; border: 1px solid #2a2114; }
  .cell img { width: 100%; display: block; }
  .cap { font: 10px ui-monospace, monospace; color: #6a6048; padding: 2px 4px; }
`;
document.head.append(style);

for (const system of ART_SYSTEMS) {
  const h = document.createElement('h2');
  h.textContent = system;
  root.append(h);
  const grid = document.createElement('div');
  grid.className = 'grid';
  root.append(grid);

  for (let i = 0; i < PER_SYSTEM; i++) {
    const seed = hashSeed(`${system}:${i}`);
    const palette = PALETTES[i % PALETTES.length];
    const tex = renderArtwork(system, seed, palette);
    const canvas = tex.image as HTMLCanvasElement;

    const cell = document.createElement('div');
    cell.className = 'cell';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/jpeg', 0.7);
    const cap = document.createElement('div');
    cap.className = 'cap';
    cap.textContent = `${system} · seed ${seed.toString(16)}`;
    cell.append(img, cap);
    grid.append(cell);
    tex.dispose();
  }
}
