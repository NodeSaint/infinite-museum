// The impossible floor plan. Rooms are nodes; doors teleport to graph
// neighbours with no global spatial consistency. To guarantee bounded memory
// (acceptance: 30 rooms, no growth) we keep only the current room's geometry
// live and rebuild on transition — the 300 ms luminance dip masks the rebuild.
// A tiny LRU keeps the immediately-previous room for an instant "back".

import * as THREE from 'three';
import type { Codex } from '../codex/types';
import { generateRoomSpec, seedFromRoomId } from '../codex/generate';
import { buildRoom, type BuiltRoom } from './room';

export class RoomManager {
  private scene: THREE.Scene;
  private codex: Codex;
  private cache = new Map<string, BuiltRoom>();
  private order: string[] = []; // LRU of cached room ids
  private maxLive = 2; // current + at most one previous
  current: BuiltRoom | null = null;

  constructor(scene: THREE.Scene, codex: Codex) {
    this.scene = scene;
    this.codex = codex;
  }

  /** Build (or reuse) a room and make it the only one in the scene. */
  enter(roomId: string, isAtrium = false): BuiltRoom {
    // Detach the current room from the scene (keep briefly in cache).
    if (this.current) {
      this.scene.remove(this.current.group);
    }

    let room = this.cache.get(roomId);
    if (!room) {
      const seed = seedFromRoomId(roomId);
      const spec = generateRoomSpec(this.codex, seed, isAtrium);
      room = buildRoom(this.codex, spec);
      this.cache.set(roomId, room);
      this.order.push(roomId);
    } else {
      // refresh LRU position
      this.order = this.order.filter((id) => id !== roomId);
      this.order.push(roomId);
    }

    this.scene.add(room.group);
    this.current = room;
    this.evict();
    return room;
  }

  /** Dispose rooms beyond the liveness budget (two steps behind). */
  private evict(): void {
    while (this.order.length > this.maxLive) {
      const victim = this.order.shift()!;
      if (victim === this.current?.spec.id) {
        // never evict the current room; push it back
        this.order.push(victim);
        break;
      }
      const room = this.cache.get(victim);
      if (room) {
        this.scene.remove(room.group);
        room.dispose();
        this.cache.delete(victim);
      }
    }
  }

  /** Count of live (built) rooms — used by the memory test/HUD. */
  get liveCount(): number {
    return this.cache.size;
  }

  disposeAll(): void {
    for (const room of this.cache.values()) {
      this.scene.remove(room.group);
      room.dispose();
    }
    this.cache.clear();
    this.order = [];
    this.current = null;
  }
}
