// Builds the physical room: dark walls, walnut floor, a top light, hung
// artworks with placards, a deliberately useless bench, door portals to graph
// neighbours, and any anomaly. Returns everything needed to walk, read, snap a
// postcard, and dispose without leaks.

import * as THREE from 'three';
import type { Codex, RoomSpec, Palette } from '../codex/types';
import type { RoomBounds } from '../core/controls';
import { hangArtwork, setPaletteResolver, type Hung } from './frame';
import { makePlacard, type Placard } from './placard';
import { buildAnomaly, type BuiltAnomaly } from './anomaly';

export interface DoorPortal {
  toRoomId: string;
  /** World position of the door threshold trigger. */
  trigger: THREE.Vector3;
  /** Facing yaw the player should adopt entering the next room. */
  yaw: number;
}

export interface BuiltRoom {
  group: THREE.Group;
  spec: RoomSpec;
  bounds: RoomBounds;
  doors: DoorPortal[];
  hung: Hung[];
  /** Spawn point + yaw when entering this room. */
  spawn: { x: number; z: number; yaw: number };
  dispose(): void;
}

const ROOM_H = 4.2;

function paletteForMovement(codex: Codex, movementId: string): Palette {
  return codex.movements.find((m) => m.id === movementId)?.paletteBias ?? {
    background: '#14110d', ink: '#e7dcc8', colours: ['#c9622e', '#d8a24a', '#7d3b1f'],
  };
}

interface Slot {
  pos: THREE.Vector3;
  yaw: number; // facing into the room (artwork normal)
}

/** Distribute N hanging slots across the back wall and two side walls. */
function wallSlots(halfX: number, halfZ: number, count: number): Slot[] {
  const slots: Slot[] = [];
  const y = 1.6;
  // back wall (z = -halfZ), facing +z
  const back = Math.min(count, 3);
  for (let i = 0; i < back; i++) {
    const t = (i + 1) / (back + 1);
    slots.push({ pos: new THREE.Vector3((t - 0.5) * 2 * (halfX - 0.6), y, -halfZ + 0.07), yaw: 0 });
  }
  // left wall (x = -halfX), facing +x
  const remaining = count - back;
  const perSide = Math.ceil(remaining / 2);
  for (let i = 0; i < perSide; i++) {
    const t = (i + 1) / (perSide + 1);
    slots.push({ pos: new THREE.Vector3(-halfX + 0.07, y, (t - 0.5) * 2 * (halfZ - 0.6)), yaw: Math.PI / 2 });
  }
  // right wall (x = +halfX), facing -x
  for (let i = 0; i < remaining - perSide; i++) {
    const t = (i + 1) / (remaining - perSide + 1);
    slots.push({ pos: new THREE.Vector3(halfX - 0.07, y, (t - 0.5) * 2 * (halfZ - 0.6)), yaw: -Math.PI / 2 });
  }
  return slots;
}

export function buildRoom(codex: Codex, spec: RoomSpec): BuiltRoom {
  setPaletteResolver((a) => paletteForMovement(codex, a.movementId));
  const palette = paletteForMovement(codex, spec.movementId);

  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  // Room size scales gently with artwork count.
  const halfX = 4.5 + Math.min(spec.artworks.length, 6) * 0.25;
  const halfZ = 3.6 + Math.min(spec.artworks.length, 6) * 0.2;
  const bounds: RoomBounds = { halfX, halfZ, margin: 0.5 };

  // ---- Shell: floor, ceiling, walls ----
  const floorGeo = track(new THREE.PlaneGeometry(halfX * 2, halfZ * 2));
  const floorMat = track(new THREE.MeshStandardMaterial({ color: '#2a211a', roughness: 0.75, metalness: 0.05 }));
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ceilGeo = track(new THREE.PlaneGeometry(halfX * 2, halfZ * 2));
  const ceilMat = track(new THREE.MeshStandardMaterial({ color: '#0c0a08', roughness: 1 }));
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = ROOM_H;
  group.add(ceil);

  // wall colour: a very dark tint pulled toward the movement background
  const wallColour = new THREE.Color(palette.background).lerp(new THREE.Color('#000000'), 0.35);
  const wallMat = track(new THREE.MeshStandardMaterial({ color: wallColour, roughness: 0.9, metalness: 0.0, side: THREE.FrontSide }));
  const mkWall = (w: number, x: number, z: number, ry: number) => {
    const geo = track(new THREE.PlaneGeometry(w, ROOM_H));
    const m = new THREE.Mesh(geo, wallMat);
    m.position.set(x, ROOM_H / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    group.add(m);
  };
  mkWall(halfX * 2, 0, -halfZ, 0); // back
  mkWall(halfX * 2, 0, halfZ, Math.PI); // front
  mkWall(halfZ * 2, -halfX, 0, Math.PI / 2); // left
  mkWall(halfZ * 2, halfX, 0, -Math.PI / 2); // right

  // ---- Top light + soft skylight glow ----
  // Emissive ceiling panel reads as a skylight; the point light does the work.
  const panelGeo = track(new THREE.PlaneGeometry(halfX * 1.1, halfZ * 1.1));
  const panelMat = track(new THREE.MeshBasicMaterial({ color: '#3a3024' }));
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.rotation.x = Math.PI / 2;
  panel.position.y = ROOM_H - 0.04;
  group.add(panel);
  const point = new THREE.PointLight('#ffe6bf', 6, 16, 1.6);
  point.position.set(0, ROOM_H - 0.6, 0);
  group.add(point);

  // ---- Hang artworks ----
  const slots = wallSlots(halfX, halfZ, spec.artworks.length);
  const hung: Hung[] = [];
  spec.artworks.forEach((art, i) => {
    const slot = slots[i];
    if (!slot) return;
    const h = hangArtwork(art);
    h.group.position.copy(slot.pos);
    h.group.rotation.y = slot.yaw;
    group.add(h.group);
    hung.push(h);
    disposables.push(h);

    // placard to the right of each piece, at ~1.45 m
    const placard = makePlacard(art, codex.artists.find((a) => a.id === art.artistId)!);
    const off = new THREE.Vector3(1.05, -0.15, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), slot.yaw);
    placard.mesh.position.copy(slot.pos).add(off);
    placard.mesh.position.y = 1.45;
    placard.mesh.rotation.y = slot.yaw;
    group.add(placard.mesh);
    disposables.push(placard as Placard);
  });

  // ---- Bench (sittable, does nothing — deliberately) ----
  const benchGeo = track(new THREE.BoxGeometry(1.4, 0.45, 0.45));
  const benchMat = track(new THREE.MeshStandardMaterial({ color: '#241a12', roughness: 0.6 }));
  const bench = new THREE.Mesh(benchGeo, benchMat);
  bench.position.set(0, 0.225, 0);
  bench.castShadow = true;
  group.add(bench);

  // ---- Doors to neighbours ----
  const doors: DoorPortal[] = layoutDoors(spec, halfX, halfZ, group, track);

  // ---- Anomaly ----
  if (spec.anomaly) {
    const anom: BuiltAnomaly = buildAnomaly(spec.anomaly, halfX, halfZ);
    group.add(anom.group);
    disposables.push(anom);
  }

  return {
    group,
    spec,
    bounds,
    doors,
    hung,
    spawn: { x: 0, z: halfZ - 1.2, yaw: 0 }, // near the front wall, facing the back wall art
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}

/** Place door portals on free walls (front first, then left/right/back). */
function layoutDoors(
  spec: RoomSpec,
  halfX: number,
  halfZ: number,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(d: T) => T,
): DoorPortal[] {
  // Doors fill the back and side walls first; the front wall (the entrance,
  // where the visitor spawns) is used only if a fourth door is needed.
  const positions: { pos: THREE.Vector3; yaw: number }[] = [
    { pos: new THREE.Vector3(0, 0, -halfZ), yaw: Math.PI }, // back
    { pos: new THREE.Vector3(-halfX, 0, 0), yaw: Math.PI / 2 }, // left
    { pos: new THREE.Vector3(halfX, 0, 0), yaw: -Math.PI / 2 }, // right
    { pos: new THREE.Vector3(0, 0, halfZ), yaw: 0 }, // front (entrance)
  ];

  const doorMat = track(new THREE.MeshStandardMaterial({ color: '#05040a', roughness: 1, metalness: 0 }));
  const jambMat = track(new THREE.MeshStandardMaterial({ color: '#1a130d', roughness: 0.5, metalness: 0.3 }));
  const doors: DoorPortal[] = [];

  spec.doors.slice(0, 4).forEach((toRoomId, i) => {
    const slot = positions[i];
    const dw = 1.3, dh = 2.6;
    // dark portal plane (the "next room" we never see consistently)
    const portalGeo = track(new THREE.PlaneGeometry(dw, dh));
    const portal = new THREE.Mesh(portalGeo, doorMat);
    portal.position.copy(slot.pos).setY(dh / 2);
    // nudge slightly inside the wall plane
    portal.position.add(new THREE.Vector3(0, 0, -0.02).applyAxisAngle(new THREE.Vector3(0, 1, 0), slot.yaw));
    portal.rotation.y = slot.yaw;
    group.add(portal);

    // brass jamb
    const jambGeo = track(new THREE.BoxGeometry(dw + 0.2, dh + 0.12, 0.12));
    const jamb = new THREE.Mesh(jambGeo, jambMat);
    jamb.position.copy(portal.position);
    jamb.rotation.y = portal.rotation.y;
    group.add(jamb);

    const trigger = slot.pos.clone();
    // pull the trigger 0.6 m inside the room
    trigger.add(new THREE.Vector3(0, 0, -0.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), slot.yaw + Math.PI));
    trigger.y = 0;
    doors.push({ toRoomId, trigger, yaw: slot.yaw });
  });

  return doors;
}
