// First-person controller. Desktop: pointer-lock mouse look + WASD. Mobile:
// left virtual thumb-stick to move, right-half drag to look. Movement is
// clamped to the current room's rectangular bounds (doors are handled by the
// graph as trigger zones). Deliberately no jumping — this is a museum.

import * as THREE from 'three';

export interface RoomBounds {
  halfX: number;
  halfZ: number;
  margin: number;
}

export interface Controls {
  update(dt: number): void;
  setBounds(b: RoomBounds): void;
  setPosition(x: number, z: number): void;
  getPosition(): THREE.Vector3;
  setYaw(y: number): void;
  getYaw(): number;
  /** Mobile thumb-stick writes movement intent here: x = strafe, y = forward. */
  readonly stick: THREE.Vector2;
  /** True while the player is actively looking (pointer locked or touching). */
  readonly engaged: boolean;
  dispose(): void;
  onLockChange(cb: (locked: boolean) => void): void;
}

const SPEED = 2.6; // m/s, an unhurried museum pace
const EYE = 1.65;

export function createControls(
  camera: THREE.PerspectiveCamera,
  dom: HTMLElement,
  isTouch: boolean,
): Controls {
  let yaw = 0; // yaw 0 faces -z, i.e. into the room toward the back wall
  let pitch = 0;
  let bounds: RoomBounds = { halfX: 5, halfZ: 5, margin: 0.5 };
  let locked = false;
  const lockCbs = new Set<(b: boolean) => void>();

  const keys = new Set<string>();
  const move = new THREE.Vector2(); // x = strafe, y = forward (from stick)

  // ---- Desktop pointer lock ----
  function onClick() {
    if (!isTouch && !locked) dom.requestPointerLock();
  }
  function onLockChange() {
    locked = document.pointerLockElement === dom;
    for (const cb of lockCbs) cb(locked);
  }
  function onMouseMove(e: MouseEvent) {
    if (!locked) return;
    yaw -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0022;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }
  function onKeyDown(e: KeyboardEvent) {
    keys.add(e.code);
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  if (!isTouch) {
    dom.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ---- Touch look (right half) ----
  let lookId = -1;
  let lastTouch = { x: 0, y: 0 };
  function onTouchStart(e: TouchEvent) {
    for (const t of Array.from(e.changedTouches)) {
      if (t.clientX > window.innerWidth / 2 && lookId === -1) {
        lookId = t.identifier;
        lastTouch = { x: t.clientX, y: t.clientY };
      }
    }
  }
  function onTouchMove(e: TouchEvent) {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === lookId) {
        yaw -= (t.clientX - lastTouch.x) * 0.005;
        pitch -= (t.clientY - lastTouch.y) * 0.005;
        pitch = Math.max(-1.2, Math.min(1.2, pitch));
        lastTouch = { x: t.clientX, y: t.clientY };
      }
    }
  }
  function onTouchEnd(e: TouchEvent) {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === lookId) lookId = -1;
    }
  }
  if (isTouch) {
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });
    dom.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  const pos = new THREE.Vector3(0, EYE, 4);

  return {
    stick: move,
    get engaged() {
      return locked || lookId !== -1;
    },
    setBounds(b) {
      bounds = b;
    },
    setPosition(x, z) {
      pos.set(x, EYE, z);
    },
    getPosition() {
      return pos.clone();
    },
    setYaw(y) {
      yaw = y;
    },
    getYaw() {
      return yaw;
    },
    onLockChange(cb) {
      lockCbs.add(cb);
    },
    update(dt) {
      // Assemble movement intent from keys (desktop) and stick (mobile).
      let fwd = move.y;
      let strafe = move.x;
      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;

      const len = Math.hypot(fwd, strafe);
      if (len > 1) {
        fwd /= len;
        strafe /= len;
      }

      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      // forward is -z when yaw=0; account for yaw rotation
      pos.x += (strafe * cos - fwd * sin) * SPEED * dt;
      pos.z += (strafe * sin + fwd * cos) * SPEED * dt * -1;

      // Clamp to room bounds.
      const mx = bounds.halfX - bounds.margin;
      const mz = bounds.halfZ - bounds.margin;
      pos.x = Math.max(-mx, Math.min(mx, pos.x));
      pos.z = Math.max(-mz, Math.min(mz, pos.z));

      camera.position.copy(pos);
      const dir = new THREE.Vector3(
        -Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch),
      );
      camera.lookAt(pos.clone().add(dir));
    },
    dispose() {
      dom.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
    },
  };
}
