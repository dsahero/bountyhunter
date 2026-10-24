/**
 * The sound engine: every sound is synthesized live with the Web Audio API.
 * No audio files, no licensing questions, ~0 KB to download.
 *
 * Browsers only allow audio after a user gesture, so nothing is created until
 * `unlock()` is called from a click/keypress. All sounds route through one
 * master gain, which handles mute and volume.
 */
import { MusicPlayer, type TrackName } from './music';

export type Sfx =
  | 'click'
  | 'beep'
  | 'boot'
  | 'whoosh'
  | 'hyperspace'
  | 'roar'
  | 'blaster'
  | 'clank'
  | 'tick'
  | 'meow'
  | 'voicemail'
  | 'ring'
  | 'holoOff'
  | 'alarm'
  | 'torpedo'
  | 'powerDown'
  | 'powerUp'
  | 'chime'
  | 'rumble'
  | 'screech';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambience: { stop: () => void } | null = null;
  private wantAmbience = false;
  private enabled = false;
  private volume = 0.6;

  /** Create/resume the context. Must run inside a user gesture handler. */
  unlock() {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise();
      this.applyGain();
      if (this.wantAmbience) this.startAmbience();
      this.player = new MusicPlayer(this.ctx, this.master);
      if (this.wantMusic) this.player.play(...this.wantMusic);
    }
    void this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.applyGain();
  }

  setVolume(v: number) {
    this.volume = v;
    this.applyGain();
  }

  private applyGain() {
    if (!this.ctx || !this.master) return;
    const target = this.enabled ? this.volume : 0;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  private makeNoise() {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** A gain envelope: quick attack, exponential decay. */
  private env(peak: number, attack: number, decay: number, at = 0) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const t = ctx.currentTime + at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.master!);
    return { g, t, end: t + attack + decay };
  }

  private osc(type: OscillatorType, freq: number, to: AudioNode, t: number, end: number) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(to);
    o.start(t);
    o.stop(end + 0.05);
    return o;
  }

  private noiseSource(to: AudioNode, t: number, end: number, loop = false) {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = loop || end - t > 0.9;
    s.connect(to);
    s.start(t);
    s.stop(end + 0.05);
    return s;
  }

  private filter(type: BiquadFilterType, freq: number, q = 1) {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  play(name: Sfx) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx!;
    switch (name) {
      case 'click': {
        const { g, t, end } = this.env(0.25, 0.002, 0.04);
        const f = this.filter('highpass', 2500);
        f.connect(g);
        this.noiseSource(f, t, end);
        break;
      }
      case 'tick': {
        const { g, t, end } = this.env(0.05, 0.001, 0.025);
        this.osc('square', 1800, g, t, end);
        break;
      }
      case 'beep': {
        const { g, t, end } = this.env(0.12, 0.005, 0.12);
        const o = this.osc('sine', 880, g, t, end);
        o.frequency.setValueAtTime(1320, t + 0.06);
        break;
      }
      case 'boot': {
        // Hologram boot-up: a rising shimmer.
        const { g, t, end } = this.env(0.1, 0.03, 0.4);
        const o = this.osc('triangle', 220, g, t, end);
        o.frequency.exponentialRampToValueAtTime(1100, end);
        // Fast vibrato for the "shimmer".
        const depth = ctx.createGain();
        depth.gain.value = 40;
        depth.connect(o.frequency);
        this.osc('sine', 28, depth, t, end);
        break;
      }
      case 'whoosh': {
        const { g, t, end } = this.env(0.35, 0.12, 0.45);
        const f = this.filter('bandpass', 300, 1.2);
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(2600, end);
        f.connect(g);
        this.noiseSource(f, t, end);
        break;
      }
      case 'hyperspace': {
        const { g, t, end } = this.env(0.3, 0.5, 0.7);
        const lp = this.filter('lowpass', 1600);
        lp.connect(g);
        const o = this.osc('sawtooth', 70, lp, t, end);
        o.frequency.exponentialRampToValueAtTime(900, t + 0.55);
        const nf = this.filter('highpass', 1200);
        nf.connect(g);
        this.noiseSource(nf, t, end);
        break;
      }
      case 'roar': {
        // A ship passing overhead: low engine growl with a doppler drop and a noise swell.
        const { g, t } = this.env(0.55, 1.4, 2.8);
        const end = t + 4.2;
        const lp = this.filter('lowpass', 300);
        lp.frequency.setValueAtTime(300, t);
        lp.frequency.linearRampToValueAtTime(1400, t + 1.4);
        lp.frequency.linearRampToValueAtTime(250, end);
        lp.connect(g);
        for (const [type, f] of [
          ['sawtooth', 48],
          ['sawtooth', 48.7],
          ['square', 96],
        ] as const) {
          const o = this.osc(type, f, lp, t, end);
          o.frequency.setValueAtTime(f * 1.15, t);
          o.frequency.linearRampToValueAtTime(f * 0.82, end);
        }
        this.noiseSource(lp, t, end, true);
        break;
      }
      case 'blaster': {
        const { g, t, end } = this.env(0.18, 0.004, 0.22);
        const lp = this.filter('lowpass', 2600);
        lp.connect(g);
        const o = this.osc('square', 1500, lp, t, end);
        o.frequency.exponentialRampToValueAtTime(160, end);
        break;
      }
      case 'meow': {
        // A cat: a rising-then-falling glide through a vowel-ish band-pass.
        const { g, t, end } = this.env(0.22, 0.05, 0.55);
        const bp = this.filter('bandpass', 1100, 3);
        bp.connect(g);
        const o = this.osc('sawtooth', 520, bp, t, end);
        o.frequency.linearRampToValueAtTime(820, t + 0.18);
        o.frequency.linearRampToValueAtTime(480, end);
        bp.frequency.linearRampToValueAtTime(1600, t + 0.2);
        bp.frequency.linearRampToValueAtTime(900, end);
        break;
      }
      case 'voicemail': {
        // Two short tones, then the long "after the tone" beep.
        for (const [f, at, len] of [
          [620, 0, 0.12],
          [620, 0.2, 0.12],
          [950, 0.6, 0.8],
        ] as const) {
          const { g, t, end } = this.env(0.12, 0.01, len, at);
          this.osc('sine', f, g, t, end);
        }
        break;
      }
      case 'ring': {
        for (let i = 0; i < 3; i++) {
          const { g, t, end } = this.env(0.12, 0.01, 0.35, i * 0.6);
          const lp = this.filter('lowpass', 1800);
          lp.connect(g);
          this.osc('square', 880, lp, t, end);
          this.osc('square', 1175, lp, t, end);
        }
        break;
      }
      case 'holoOff':
      case 'powerDown': {
        const { g, t, end } = this.env(0.16, 0.01, name === 'powerDown' ? 1.2 : 0.4);
        const o = this.osc('triangle', name === 'powerDown' ? 600 : 900, g, t, end);
        o.frequency.exponentialRampToValueAtTime(name === 'powerDown' ? 40 : 160, end);
        break;
      }
      case 'powerUp': {
        const { g, t, end } = this.env(0.14, 0.4, 0.5);
        const o = this.osc('triangle', 80, g, t, end);
        o.frequency.exponentialRampToValueAtTime(900, end);
        break;
      }
      case 'rumble': {
        // A deep hull groan: low noise swelling and fading.
        const { g, t, end } = this.env(0.6, 0.25, 1.6);
        const lp = this.filter('lowpass', 90);
        lp.connect(g);
        this.noiseSource(lp, t, end);
        const o = this.osc('sine', 38, g, t, end);
        o.frequency.linearRampToValueAtTime(30, end);
        break;
      }
      case 'screech': {
        // Metal on metal: a narrow, wavering, falling squeal over grit.
        const { g, t, end } = this.env(0.12, 0.05, 1.1);
        const bp = this.filter('bandpass', 2400, 18);
        bp.frequency.linearRampToValueAtTime(1500, end);
        bp.connect(g);
        this.noiseSource(bp, t, end);
        const o = this.osc('sawtooth', 1900, bp, t, end);
        for (let i = 0; i < 10; i++) o.frequency.setValueAtTime(1700 + Math.random() * 600, t + i * 0.1);
        break;
      }
      case 'alarm': {
        // A calm, low warning: two soft falling tones, like a ship's chime
        // rather than a klaxon (rounded sine, gentle attack, lowpassed).
        [0, 0.55].forEach((at, i) => {
          const { g, t, end } = this.env(0.07, 0.12, 0.7, at);
          const lp = this.filter('lowpass', 900);
          lp.connect(g);
          const o = this.osc('sine', i ? 294 : 392, lp, t, end);
          o.frequency.exponentialRampToValueAtTime(i ? 262 : 349, end);
        });
        break;
      }
      case 'torpedo': {
        const { g, t, end } = this.env(0.4, 0.05, 1.3);
        const lp = this.filter('lowpass', 600);
        lp.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
        lp.frequency.exponentialRampToValueAtTime(200, end);
        lp.connect(g);
        this.noiseSource(lp, t, end);
        const o = this.osc('sine', 220, g, t, end);
        o.frequency.exponentialRampToValueAtTime(60, end);
        break;
      }
      case 'chime': {
        [660, 880, 1320].forEach((f, i) => {
          const { g, t, end } = this.env(0.1, 0.01, 0.6, i * 0.12);
          this.osc('sine', f, g, t, end);
        });
        break;
      }
      case 'clank': {
        const { g, t, end } = this.env(0.4, 0.003, 0.3);
        const lp = this.filter('lowpass', 700);
        lp.connect(g);
        this.noiseSource(lp, t, end);
        this.osc('sine', 110, g, t, end);
        break;
      }
    }
  }

  /** Cockpit ambience: an engine hum, a little air noise, and a slow minor-key pad. */
  startAmbience() {
    this.wantAmbience = true;
    if (!this.ctx || this.ambience) return;
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, ctx.currentTime);
    out.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    out.connect(this.master!);
    const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
    const start = (n: OscillatorNode | AudioBufferSourceNode) => {
      n.start();
      nodes.push(n);
    };

    // Engine hum
    const humLp = this.filter('lowpass', 160);
    const humGain = ctx.createGain();
    humGain.gain.value = 0.09;
    humLp.connect(humGain).connect(out);
    for (const f of [55, 55.6, 110.3]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(humLp);
      start(o);
    }
    // Air
    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    air.loop = true;
    const airLp = this.filter('lowpass', 500);
    const airGain = ctx.createGain();
    airGain.gain.value = 0.025;
    air.connect(airLp).connect(airGain).connect(out);
    start(air);
    // Pad: A minor, breathing slowly
    const padGain = ctx.createGain();
    padGain.gain.value = 0.018;
    padGain.connect(out);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.012;
    lfo.connect(lfoDepth).connect(padGain.gain);
    start(lfo);
    for (const f of [110, 130.81, 164.81, 220.5]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(padGain);
      start(o);
    }

    this.ambience = {
      stop: () => {
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        window.setTimeout(() => nodes.forEach((n) => n.stop()), 2000);
      },
    };
  }

  stopAmbience() {
    this.wantAmbience = false;
    this.ambience?.stop();
    this.ambience = null;
  }

  /**
   * Looping music from a file (see portfolio.site.audio), on a named channel,
   * routed through the master gain so mute and volume apply. An empty url
   * (or null) stops that channel.
   */
  loop(channel: string, url: string | null) {
    const current = this.tracks.get(channel);
    if (url && current?.src.endsWith(url)) return;
    if (current) {
      current.pause();
      this.tracks.delete(channel);
    }
    if (!url || !this.ctx) return;
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    this.ctx.createMediaElementSource(el).connect(this.master!);
    this.tracks.set(channel, el);
    void el.play().catch(() => this.tracks.delete(channel));
  }

  private tracks = new Map<string, HTMLAudioElement>();
  private player: MusicPlayer | null = null;
  private wantMusic: [TrackName | null, string] | null = null;

  /** Cross-fade the music to a track (placeholder synth unless `url` names a file). */
  music(name: TrackName | null, url = '') {
    this.wantMusic = [name, url];
    this.player?.play(name, url);
  }
}

export const audio = new AudioEngine();
