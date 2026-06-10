// The HUD: nearly invisible. Crosshair, a faint control prompt, a reading hint
// when looking at a placard, the room label, the transition dip, a toast, and
// the mobile thumb-stick. Plain DOM — no framework.

import type { Vector2 } from 'three';

export class Hud {
  root: HTMLElement;
  private crosshair: HTMLElement;
  private prompt: HTMLElement;
  private hint: HTMLElement;
  private roomLabel: HTMLElement;
  private dipEl: HTMLElement;
  private toastEl: HTMLElement;
  private stick: HTMLElement;
  private toastTimer = 0;

  constructor(parent: HTMLElement) {
    this.root = el('div', { id: 'hud' });
    this.crosshair = el('div', { id: 'crosshair' });
    this.prompt = el('div', { id: 'prompt' });
    this.hint = el('div', { id: 'hint' });
    this.roomLabel = el('div', { id: 'roomlabel' });
    this.root.append(this.crosshair, this.prompt, this.hint, this.roomLabel);
    parent.append(this.root);

    this.dipEl = el('div', { id: 'dip' });
    this.toastEl = el('div', { id: 'toast' });
    this.stick = el('div', { id: 'stick' });
    this.stick.append(el('div', { class: 'nub' }));
    parent.append(this.dipEl, this.toastEl, this.stick);
  }

  setPrompt(text: string): void {
    this.prompt.textContent = text;
  }

  setRoomLabel(text: string): void {
    this.roomLabel.textContent = text;
  }

  setHint(text: string | null): void {
    if (text) {
      this.hint.textContent = text;
      this.hint.classList.add('show');
    } else {
      this.hint.classList.remove('show');
    }
  }

  crosshairActive(active: boolean): void {
    this.crosshair.classList.toggle('active', active);
  }

  dipOn(): void {
    this.dipEl.classList.add('on');
  }

  dipOff(): void {
    this.dipEl.classList.remove('on');
  }

  toast(message: string, ms = 2600): void {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  /** Wire the on-screen stick to a movement vector (x = strafe, y = forward). */
  bindStick(move: Vector2): void {
    const nub = this.stick.querySelector('.nub') as HTMLElement;
    let id = -1;
    const radius = 50;
    const centre = { x: 0, y: 0 };
    const reset = () => {
      move.set(0, 0);
      nub.style.transform = 'translate(-50%, -50%)';
    };
    this.stick.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      id = t.identifier;
      const r = this.stick.getBoundingClientRect();
      centre.x = r.left + r.width / 2;
      centre.y = r.top + r.height / 2;
    }, { passive: true });
    this.stick.addEventListener('touchmove', (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== id) continue;
        let dx = t.clientX - centre.x;
        let dy = t.clientY - centre.y;
        const len = Math.hypot(dx, dy);
        if (len > radius) { dx = (dx / len) * radius; dy = (dy / len) * radius; }
        nub.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        move.set(dx / radius, -dy / radius); // up = forward
      }
    }, { passive: true });
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === id) { id = -1; reset(); }
      }
    };
    this.stick.addEventListener('touchend', end, { passive: true });
    this.stick.addEventListener('touchcancel', end, { passive: true });
  }
}

function el(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  return node;
}
