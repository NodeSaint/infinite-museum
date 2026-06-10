// A framed artwork on the wall: the CanvasTexture plane, a walnut/brass frame,
// and a warm spotlight that does the aesthetic heavy lifting. Everything is
// tracked for explicit disposal (textures, geometries, materials, lights).

import * as THREE from 'three';
import type { Artwork } from '../codex/types';
import { renderArtwork } from '../art/index';

export interface Hung {
  group: THREE.Group;
  artwork: Artwork;
  /** World-space centre of the canvas (for audio-guide focus / postcard). */
  centre: THREE.Vector3;
  texture: THREE.CanvasTexture;
  dispose(): void;
}

const FRAME_DEPTH = 0.06;
const FRAME_BORDER = 0.08;

const walnut = new THREE.MeshStandardMaterial({ color: '#3a2417', roughness: 0.55, metalness: 0.15 });
const brass = new THREE.MeshStandardMaterial({ color: '#b08d4c', roughness: 0.35, metalness: 0.85 });

/** Hang an artwork. `maxH` caps the canvas height in metres. */
export function hangArtwork(artwork: Artwork, maxW = 1.7, maxH = 1.25): Hung {
  const group = new THREE.Group();
  const texture = renderArtwork(artwork.system, artwork.seed, paletteFor(artwork));

  const img = texture.image as HTMLCanvasElement;
  const aspect = img.width / img.height;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  // canvas plane
  const planeGeo = new THREE.PlaneGeometry(w, h);
  const planeMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.0,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.z = FRAME_DEPTH * 0.5 + 0.001;
  group.add(plane);

  // frame: four walnut bars, with a thin brass inner lip around the canvas
  const barGeos: THREE.BufferGeometry[] = [];
  const mkBar = (bw: number, bh: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const geo = new THREE.BoxGeometry(bw, bh, FRAME_DEPTH);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    barGeos.push(geo);
  };
  const ow = w + FRAME_BORDER * 2;
  const oh = h + FRAME_BORDER * 2;
  mkBar(ow, FRAME_BORDER, 0, h / 2 + FRAME_BORDER / 2, 0, walnut);
  mkBar(ow, FRAME_BORDER, 0, -h / 2 - FRAME_BORDER / 2, 0, walnut);
  mkBar(FRAME_BORDER, oh, -w / 2 - FRAME_BORDER / 2, 0, 0, walnut);
  mkBar(FRAME_BORDER, oh, w / 2 + FRAME_BORDER / 2, 0, 0, walnut);
  // brass inner lip (thin bars hugging the canvas edge)
  const lip = 0.015;
  mkBar(w + lip * 2, lip, 0, h / 2 + lip / 2, FRAME_DEPTH * 0.5, brass);
  mkBar(w + lip * 2, lip, 0, -h / 2 - lip / 2, FRAME_DEPTH * 0.5, brass);
  mkBar(lip, h, -w / 2 - lip / 2, 0, FRAME_DEPTH * 0.5, brass);
  mkBar(lip, h, w / 2 + lip / 2, 0, FRAME_DEPTH * 0.5, brass);

  // warm spotlight aimed at the canvas centre
  const spot = new THREE.SpotLight('#ffd9a0', 7.5, 6, Math.PI / 7, 0.5, 1.4);
  spot.position.set(0, 1.4, 1.6);
  spot.castShadow = false;
  const target = new THREE.Object3D();
  target.position.set(0, 0, 0);
  group.add(target);
  spot.target = target;
  group.add(spot);

  const centre = new THREE.Vector3();

  return {
    group,
    artwork,
    texture,
    get centre() {
      return group.getWorldPosition(centre);
    },
    dispose() {
      planeGeo.dispose();
      planeMat.dispose();
      texture.dispose();
      for (const g of barGeos) g.dispose();
      spot.dispose();
      group.clear();
    },
  };
}

// Materials are shared module-level; dispose them only at teardown of the app.
export function disposeFrameMaterials(): void {
  walnut.dispose();
  brass.dispose();
}

// The artwork carries its movement; the room builder injects the palette via a
// closure. To keep frame.ts independent we accept it through a side channel.
let paletteResolver: (a: Artwork) => import('../codex/types').Palette = () => ({
  background: '#14110d',
  ink: '#e7dcc8',
  colours: ['#c9622e', '#d8a24a', '#7d3b1f'],
});

export function setPaletteResolver(fn: (a: Artwork) => import('../codex/types').Palette): void {
  paletteResolver = fn;
}

function paletteFor(a: Artwork): import('../codex/types').Palette {
  return paletteResolver(a);
}
