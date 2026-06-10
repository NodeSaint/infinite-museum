// The one store module. Plain observable state — no framework. The HUD and
// panels subscribe; the engine reads. Seed + current room live in the URL hash
// so any state is shareable and reproducible.

import type { Codex, RoomSpec } from './codex/types';

export interface State {
  seed: number;
  /** Stable string the user sees / shares. Hash of this is `seed`. */
  seedLabel: string;
  codex: Codex | null;
  currentRoomId: string | null;
  /** Live room cache (current + neighbours). Disposal happens in the graph. */
  rooms: Map<string, RoomSpec>;
  audioGuideOn: boolean;
  ambienceOn: boolean;
  pointerLocked: boolean;
  untethered: boolean; // random-seed mode ("will not exist again")
  hasApiKey: boolean;
  ready: boolean;
}

type Listener = (s: State) => void;

const state: State = {
  seed: 0,
  seedLabel: '',
  codex: null,
  currentRoomId: null,
  rooms: new Map(),
  audioGuideOn: false,
  ambienceOn: true,
  pointerLocked: false,
  untethered: false,
  hasApiKey: false,
  ready: false,
};

const listeners = new Set<Listener>();

export function getState(): Readonly<State> {
  return state;
}

export function setState(patch: Partial<State>): void {
  Object.assign(state, patch);
  for (const l of listeners) l(state);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ---- URL hash <-> state ----
// Format: #seed=<label>&room=<roomId>

export interface HashState {
  seedLabel: string | null;
  roomId: string | null;
}

export function readHash(): HashState {
  const h = new URLSearchParams(location.hash.slice(1));
  return {
    seedLabel: h.get('seed'),
    roomId: h.get('room'),
  };
}

let writingHash = false;

export function writeHash(seedLabel: string, roomId: string | null): void {
  const h = new URLSearchParams();
  h.set('seed', seedLabel);
  if (roomId) h.set('room', roomId);
  writingHash = true;
  location.hash = h.toString();
  // Allow the resulting hashchange event to be ignored.
  queueMicrotask(() => (writingHash = false));
}

export function onHashChange(cb: (h: HashState) => void): void {
  window.addEventListener('hashchange', () => {
    if (writingHash) return;
    cb(readHash());
  });
}

// ---- API key (localStorage only, never committed) ----

const KEY_STORAGE = 'im_anthropic_key';

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage may be blocked; Tier 0 still works */
  }
  setState({ hasApiKey: !!key });
}
