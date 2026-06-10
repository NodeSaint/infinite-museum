// Web Audio ambience: a quiet generative drone (two detuned oscillators through
// a slow filter) and synthesised footsteps triggered by movement. Plus a
// speechSynthesis wrapper for the audio guide reading placards. All optional —
// nothing here is required for the museum to function.

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private started = false;
  private stepCooldown = 0;

  /** Must be called from a user gesture (autoplay policy). */
  start(): void {
    if (this.started) return;
    this.started = true;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    // ---- Drone ----
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.08;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 4;
    this.droneGain.connect(filter);
    filter.connect(this.master);

    const base = 55; // A1
    for (const mult of [1, 1.5, 2.01]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = base * mult;
      const g = this.ctx.createGain();
      g.gain.value = mult === 1 ? 0.6 : 0.25;
      osc.connect(g);
      g.connect(this.droneGain);
      osc.start();
    }

    // slow filter sweep via an LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.03;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  setMuted(muted: boolean): void {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.3);
    }
  }

  /** Call each frame with the player's speed (m/s) to trigger footsteps. */
  updateFootsteps(speed: number, dt: number): void {
    if (!this.ctx || !this.master || speed < 0.4) {
      this.stepCooldown = 0;
      return;
    }
    this.stepCooldown -= dt;
    if (this.stepCooldown <= 0) {
      this.footstep();
      this.stepCooldown = 0.42; // cadence
    }
  }

  private footstep(): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    // soft filtered noise burst
    const dur = 0.12;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320 + Math.random() * 120;
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }
}

// ---- Audio guide (speechSynthesis) ----
export class AudioGuide {
  private speaking = false;

  available(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string): void {
    if (!this.available()) return;
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 0.9;
    u.volume = 0.9;
    // prefer a calm en-GB voice if present
    const voices = window.speechSynthesis.getVoices();
    const gb = voices.find((v) => /en-GB/i.test(v.lang));
    if (gb) u.voice = gb;
    u.onend = () => (this.speaking = false);
    this.speaking = true;
    window.speechSynthesis.speak(u);
  }

  stop(): void {
    if (this.available()) window.speechSynthesis.cancel();
    this.speaking = false;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }
}
