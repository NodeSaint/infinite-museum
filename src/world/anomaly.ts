// Anomalies seed the slow unease: a sealed door that goes nowhere, an empty
// frame whose work was "restituted 1977", a conservation studio behind glass.
// Each carries its own small placard. Purely atmospheric — never walkable.

import * as THREE from 'three';
import type { Anomaly } from '../codex/types';

export interface BuiltAnomaly {
  group: THREE.Group;
  dispose(): void;
}

function placardTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#cdae72';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#241a0c';
  ctx.font = 'italic 30px Georgia, serif';
  const words = text.split(/\s+/);
  let line = '', y = 60;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > canvas.width - 80 && line) {
      ctx.fillText(line, 40, y);
      y += 40;
      line = w;
    } else line = test;
  }
  if (line) ctx.fillText(line, 40, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildAnomaly(anomaly: Anomaly, halfX: number, _halfZ: number): BuiltAnomaly {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  // Mount anomalies on the right wall by convention.
  const wallX = halfX - 0.06;

  if (anomaly.kind === 'sealed-door') {
    const geo = track(new THREE.BoxGeometry(1.3, 2.6, 0.16));
    const mat = track(new THREE.MeshStandardMaterial({ color: '#120c08', roughness: 0.7, metalness: 0.4 }));
    const door = new THREE.Mesh(geo, mat);
    door.position.set(wallX, 1.3, 0);
    door.rotation.y = -Math.PI / 2;
    group.add(door);
    // brick infill hint: a slightly proud panel
    const infillGeo = track(new THREE.BoxGeometry(1.0, 2.2, 0.05));
    const infillMat = track(new THREE.MeshStandardMaterial({ color: '#1c140d', roughness: 1 }));
    const infill = new THREE.Mesh(infillGeo, infillMat);
    infill.position.set(wallX - 0.1, 1.3, 0);
    infill.rotation.y = -Math.PI / 2;
    group.add(infill);
  } else if (anomaly.kind === 'restituted-frame') {
    // empty walnut frame, dark void where the canvas should be
    const frameMat = track(new THREE.MeshStandardMaterial({ color: '#3a2417', roughness: 0.55, metalness: 0.15 }));
    const voidMat = track(new THREE.MeshStandardMaterial({ color: '#070605', roughness: 1 }));
    const w = 1.2, h = 1.6, b = 0.1;
    const voidGeo = track(new THREE.PlaneGeometry(w, h));
    const voidPlane = new THREE.Mesh(voidGeo, voidMat);
    voidPlane.position.set(wallX - 0.04, 1.6, 0);
    voidPlane.rotation.y = -Math.PI / 2;
    group.add(voidPlane);
    // outline frame as four bars
    const bars: Array<[number, number, number, number]> = [
      [w + b, b, h / 2, 0], [w + b, b, -h / 2, 0], [b, h, 0, w / 2], [b, h, 0, -w / 2],
    ];
    for (const [bw, bh, dy, dz] of bars) {
      const g = track(new THREE.BoxGeometry(0.07, bh, bw));
      const m = new THREE.Mesh(g, frameMat);
      m.position.set(wallX, 1.6 + dy, dz);
      m.rotation.y = -Math.PI / 2;
      group.add(m);
    }
  } else {
    // conservation-studio: a glass panel with a lit, half-worked easel behind
    const glassGeo = track(new THREE.PlaneGeometry(2.4, 2.4));
    const glassMat = track(new THREE.MeshPhysicalMaterial({
      color: '#aac4cc', roughness: 0.1, metalness: 0, transmission: 0.6,
      transparent: true, opacity: 0.35,
    }));
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(wallX, 1.4, 0);
    glass.rotation.y = -Math.PI / 2;
    group.add(glass);
    const easelGeo = track(new THREE.BoxGeometry(0.06, 1.6, 0.06));
    const easelMat = track(new THREE.MeshStandardMaterial({ color: '#2a1d12', roughness: 0.6 }));
    const easel = new THREE.Mesh(easelGeo, easelMat);
    easel.position.set(wallX + 0.5, 0.9, 0);
    group.add(easel);
    const lamp = new THREE.PointLight('#cfe0ff', 3, 4, 2);
    lamp.position.set(wallX + 0.6, 1.8, 0.3);
    group.add(lamp);
  }

  // anomaly placard
  const tex = track(placardTexture(anomaly.placard));
  const pgeo = track(new THREE.PlaneGeometry(0.4, 0.2));
  const pmat = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.6 }));
  const plaque = new THREE.Mesh(pgeo, pmat);
  plaque.position.set(wallX - 0.04, 0.7, 0.9);
  plaque.rotation.y = -Math.PI / 2;
  group.add(plaque);

  return {
    group,
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
