// The Infinite Museum — entry point. Wires the codex, engine, controls, audio,
// HUD and the impossible room graph together. Codex-first: we generate the
// fictional art history before a single wall is built.

import './style.css';
import * as THREE from 'three';
import { createEngine, installBaseLighting } from './core/engine';
import { createControls } from './core/controls';
import { Ambience, AudioGuide } from './core/audio';
import { makePostcard } from './core/postcard';
import { hashSeed, deriveSeed } from './core/prng';
import { generateCodex, roomId } from './codex/generate';
import { RoomManager } from './world/graph';
import type { BuiltRoom } from './world/room';
import { Hud } from './hud/hud';
import { showTitleWall, showKeyPanel } from './hud/panels';
import {
  getState, setState, readHash, writeHash, getApiKey, setApiKey,
} from './store';
import type { Hung } from './world/frame';
import { maybeUpgradeWithCurator } from './codex/tier1';

const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

/** A memorable, shareable random seed label for untethered mode. */
function randomSeedLabel(): string {
  const a = ['pale', 'tidal', 'severed', 'posthumous', 'vellum', 'quiet', 'amber', 'salt', 'grey', 'last'];
  const b = ['antechamber', 'estuary', 'lacuna', 'threnody', 'reliquary', 'archive', 'foyer', 'rotunda', 'annexe'];
  const r = (n: number) => Math.floor(Math.random() * n);
  return `${a[r(a.length)]}-${b[r(b.length)]}-${r(9000) + 1000}`;
}

const app = document.getElementById('app')!;
const engine = createEngine(app);
installBaseLighting(engine.scene);

const controls = createControls(engine.camera, engine.renderer.domElement, isTouch);
const hud = new Hud(document.body);
hud.bindStick(controls.stick);
const ambience = new Ambience();
const guide = new AudioGuide();

// ---- Seed resolution ----
const hash = readHash();
let seedLabel = hash.seedLabel ?? 'first-light';
let seed = hashSeed(seedLabel);

let codex = generateCodex(seed);
setState({ seed, seedLabel, codex, hasApiKey: !!getApiKey() });

let rooms = new RoomManager(engine.scene, codex);
let current: BuiltRoom | null = null;
let started = false;
let transitioning = false;
let entryCooldown = 0; // seconds; blocks door triggers right after entering
let focused: Hung | null = null;

// ---- Title wall ----
let removeTitle = showTitleWall(codex, {
  hasKey: !!getApiKey(),
  onEnter: () => beginVisit(false),
  onUntethered: () => beginVisit(true),
  onKeyPanel: openKeyPanel,
});

function openKeyPanel(): void {
  showKeyPanel({
    current: getApiKey(),
    onSave: (k) => {
      setApiKey(k);
      hud.toast(k ? 'Curator key saved (this browser only).' : 'Curator key removed.');
      // refresh title wall key label
      removeTitle();
      removeTitle = showTitleWall(getState().codex!, {
        hasKey: !!getApiKey(),
        onEnter: () => beginVisit(false),
        onUntethered: () => beginVisit(true),
        onKeyPanel: openKeyPanel,
      });
    },
    onClose: () => {},
  });
}

async function beginVisit(unteth: boolean): Promise<void> {
  if (started) return;
  started = true;

  if (unteth) {
    // Random seed; warn that it will not recur.
    seedLabel = randomSeedLabel();
    seed = hashSeed(seedLabel);
    codex = generateCodex(seed);
    rooms.disposeAll();
    rooms = new RoomManager(engine.scene, codex);
    setState({ seed, seedLabel, codex, untethered: true });
    hud.toast('This museum will not exist again.', 4200);
  }

  removeTitle();
  ambience.start();

  // Optional Tier 1 upgrade — silently falls back to Tier 0 on any failure.
  if (getApiKey()) {
    hud.toast('Consulting the curator…', 2000);
    const result = await maybeUpgradeWithCurator(codex, getApiKey()!);
    if (result.ok) {
      codex = result.codex;
      rooms.disposeAll();
      rooms = new RoomManager(engine.scene, codex);
      setState({ codex });
      hud.toast('The curator has written this museum.', 2600);
    } else {
      // Clear, friendly guidance — never a raw stack trace.
      hud.toast(result.reason, 3600);
    }
  }

  // Enter the atrium (or the room named in the URL).
  const startRoomId = hash.roomId ?? roomId(deriveSeed(seed, 'atrium'));
  enterRoom(startRoomId, hash.roomId == null);
  engine.start();
}

function enterRoom(id: string, isAtrium: boolean): void {
  current = rooms.enter(id, isAtrium);
  controls.setBounds(current.bounds);
  controls.setPosition(current.spawn.x, current.spawn.z);
  controls.setYaw(current.spawn.yaw);
  entryCooldown = 0.8;
  setState({ currentRoomId: id });
  const movement = codex.movements.find((m) => m.id === current!.spec.movementId);
  hud.setRoomLabel(`${codex.museumName} · ${current.spec.title}${movement ? ` · ${movement.years[0]}–${movement.years[1]}` : ''}`);
  writeHash(seedLabel, id);
}

// The transition is driven by the render loop (requestAnimationFrame), not by
// setTimeout. rAF is reliable whenever the page is actually drawing and pauses
// when the tab is hidden (when nobody is navigating anyway), so a transition can
// never stall and latch `transitioning` true. The 300 ms dip masks the rebuild.
interface Transition {
  toRoomId: string;
  remaining: number;
  done?: () => void;
}
let transition: Transition | null = null;

function navigate(toRoomId: string): Promise<void> {
  if (transitioning) return Promise.resolve();
  transitioning = true;
  focused = null;
  hud.setHint(null);
  hud.dipOn();
  return new Promise<void>((resolve) => {
    transition = { toRoomId, remaining: 0.3, done: resolve };
  });
}

/** Advance the active transition by the frame's dt; swap the room at full black. */
function tickTransition(dt: number): boolean {
  if (!transition) return false;
  transition.remaining -= dt;
  if (transition.remaining <= 0) {
    const t = transition;
    transition = null;
    enterRoom(t.toRoomId, false);
    hud.dipOff();
    transitioning = false;
    t.done?.();
  }
  return true; // a transition is (or was just) in progress this frame
}

// ---- Interaction: keys ----
window.addEventListener('keydown', (e) => {
  if (!started) return;
  if (e.code === 'KeyG') toggleGuide();
  else if (e.code === 'KeyP') snapPostcard();
  else if (e.code === 'KeyM') {
    const muted = !getState().ambienceOn;
    setState({ ambienceOn: !muted });
    ambience.setMuted(muted);
    hud.toast(muted ? 'Sound off' : 'Sound on');
  }
});

function toggleGuide(): void {
  if (guide.isSpeaking) {
    guide.stop();
    return;
  }
  if (focused) {
    const artist = codex.artists.find((a) => a.id === focused!.artwork.artistId);
    const intro = artist ? `${focused.artwork.title}, by ${artist.name}. ` : '';
    guide.speak(intro + focused.artwork.placard);
    setState({ audioGuideOn: true });
  } else {
    hud.toast('Stand before a work, then press G.');
  }
}

function snapPostcard(): void {
  if (!focused) {
    hud.toast('Stand before a work, then press P for a postcard.');
    return;
  }
  const artist = codex.artists.find((a) => a.id === focused!.artwork.artistId)!;
  makePostcard(focused.texture.image as HTMLCanvasElement, focused.artwork, artist, codex.museumName, seedLabel);
  hud.toast('Postcard saved.');
}

// ---- Per-frame: movement, footsteps, door triggers, focus ----
const tmp = new THREE.Vector3();
const camDir = new THREE.Vector3();
let lastPos = new THREE.Vector3();

engine.onFrame((dt) => {
  if (!started || !current) return;

  // While transitioning, advance the dip/swap and freeze movement & triggers.
  if (tickTransition(dt)) return;

  controls.update(dt);

  const pos = controls.getPosition();
  const speed = pos.distanceTo(lastPos) / Math.max(dt, 0.0001);
  lastPos.copy(pos);
  ambience.updateFootsteps(speed, dt);

  // Door triggers — walk into a threshold to teleport.
  if (entryCooldown > 0) entryCooldown -= dt;
  if (!transitioning && entryCooldown <= 0) {
    for (const door of current.doors) {
      tmp.copy(door.trigger);
      tmp.y = pos.y;
      if (pos.distanceTo(tmp) < 0.85) {
        navigate(door.toRoomId);
        break;
      }
    }
  }

  // Focus: the hung work the camera is closest to and roughly facing.
  engine.camera.getWorldDirection(camDir);
  let best: Hung | null = null;
  let bestScore = Infinity;
  for (const h of current.hung) {
    const c = h.centre;
    const toArt = tmp.copy(c).sub(pos);
    const dist = toArt.length();
    if (dist > 3.2) continue;
    toArt.normalize();
    const facing = toArt.dot(camDir); // 1 = looking straight at it
    if (facing < 0.55) continue;
    const score = dist * (1.4 - facing);
    if (score < bestScore) {
      bestScore = score;
      best = h;
    }
  }
  if (best !== focused) {
    focused = best;
    if (focused) {
      hud.setHint(`${focused.artwork.title} — G to listen · P for a postcard`);
    } else {
      hud.setHint(null);
    }
  }
  hud.crosshairActive(!!focused);
});

// ---- Control prompt ----
hud.setPrompt(isTouch
  ? 'left stick to walk · drag to look · tap a work, then read'
  : 'click to look · WASD to walk · G guide · P postcard · M sound');

controls.onLockChange((locked) => {
  hud.setPrompt(locked
    ? 'WASD to walk · G guide · P postcard · M sound · Esc to release'
    : 'click to look · WASD to walk · G guide · P postcard · M sound');
});

// Debug hook for the headless smoke/memory test (harmless in production).
(window as unknown as { __museum: unknown }).__museum = {
  get live() { return rooms.liveCount; },
  get room() { return getState().currentRoomId; },
  get doors() { return current?.doors.map((d) => d.toRoomId) ?? []; },
  go(id: string) { return navigate(id); },
  // Instant room swap (no dip) — exercises the build/dispose path deterministically
  // for the headless memory test, independent of rAF/timer scheduling.
  teleport(id: string) { enterRoom(id, false); },
};
