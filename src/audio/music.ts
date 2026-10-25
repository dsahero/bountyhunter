/**
 * The music player: cross-fades between tracks, which are either files
 * (portfolio.site.audio) or, where no file is set, a placeholder synthesized
 * live (original composition, no samples):
 *
 *   journey  a calm arpeggiated theme for the arrival (until you set
 *            site.audio.arrival)
 *
 * Synth tracks loop with a small look-ahead scheduler.
 */
export type TrackName = 'crawl' | 'journey' | 'cockpit' | 'alarm';

type Voice = 'lead' | 'bass' | 'pad' | 'pluck';
interface Note {
  at: number; // seconds into the loop
  dur: number;
  midi: number;
  voice: Voice;
}
interface Track {
  length: number;
  notes: Note[];
}

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Build a track from bars of beats. */
function compose(
  beat: number,
  bars: number,
  write: (add: (bar: number, b: number, len: number, midi: number, voice: Voice) => void) => void,
): Track {
  const notes: Note[] = [];
  write((bar, b, len, midi, voice) =>
    notes.push({ at: (bar * 4 + b) * beat, dur: len * beat, midi, voice }),
  );
  return { length: bars * 4 * beat, notes };
}

const CHORDS: Record<string, number[]> = {
  C: [60, 64, 67],
  Am: [57, 60, 64],
  F: [53, 57, 60],
  G: [55, 59, 62],
  Em: [52, 55, 59],
};

const JOURNEY = compose(0.75, 8, (add) => {
  const prog = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Em', 'G'];
  prog.forEach((name, bar) => {
    const chord = CHORDS[name]!;
    chord.forEach((m) => add(bar, 0, 4, m - 12, 'pad'));
    add(bar, 0, 3.6, chord[0]! - 24, 'bass');
    const arp = [
      chord[0]!,
      chord[1]!,
      chord[2]!,
      chord[0]! + 12,
      chord[2]!,
      chord[1]!,
      chord[0]!,
      chord[1]!,
    ];
    arp.forEach((m, i) => add(bar, i * 0.5, 0.5, m + 12, 'pluck'));
  });
  const melody: [number, number, number, number][] = [
    [4, 0, 2, 76],
    [4, 2, 2, 72],
    [5, 0, 3, 77],
    [6, 0, 2, 79],
    [6, 2, 2, 76],
    [7, 0, 4, 74],
  ];
  melody.forEach(([bar, b, len, m]) => add(bar, b, len, m, 'lead'));
});

/** Synth placeholders, for tracks with no file set. */
const SYNTH: Partial<Record<TrackName, Track>> = { journey: JOURNEY };

interface Playing {
  name: TrackName;
  url: string;
  out: GainNode;
  stop: () => void;
}

/** Cross-fade length (seconds) unless a player asks for another. */
const FADE = 2.5;

export class MusicPlayer {
  private current: Playing | null = null;

  constructor(
    private ctx: AudioContext,
    private master: AudioNode,
    private fade = FADE,
  ) {}

  /** Cross-fade to a track (or to silence with null). `url` plays a file instead of the synth. */
  play(name: TrackName | null, url = '') {
    if (this.current && name && this.current.name === name && this.current.url === url) return;
    this.fadeOut();
    if (!name) return;
    const synth = SYNTH[name];
    if (!url && !synth) return; // nothing to play for this slot
    const out = this.ctx.createGain();
    out.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + this.fade);
    out.connect(this.master);
    const stop = url ? this.playFile(url, out) : this.playSynth(synth!, out);
    this.current = { name, url, out, stop };
  }

  private fadeOut() {
    const c = this.current;
    if (!c) return;
    const t = this.ctx.currentTime;
    c.out.gain.cancelScheduledValues(t);
    c.out.gain.setValueAtTime(Math.max(c.out.gain.value, 0.0001), t);
    c.out.gain.exponentialRampToValueAtTime(0.0001, t + this.fade);
    window.setTimeout(c.stop, this.fade * 1000 + 200);
    this.current = null;
  }

  private playFile(url: string, out: GainNode) {
    const el = new Audio(url);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    this.ctx.createMediaElementSource(el).connect(out);
    void el.play().catch(() => undefined);
    return () => el.pause();
  }

  /** Loop a synth track with a look-ahead scheduler. */
  private playSynth(track: Track, out: GainNode) {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.5;
    bus.connect(out);
    const start = ctx.currentTime + 0.1;
    let scheduledUntil = start;
    const tick = () => {
      const horizon = ctx.currentTime + 0.6;
      while (scheduledUntil < horizon) {
        const from = scheduledUntil;
        const to = Math.min(horizon, from + 0.25);
        const loopStart = start + Math.floor((from - start) / track.length) * track.length;
        for (const offset of [loopStart, loopStart + track.length]) {
          for (const n of track.notes) {
            const at = offset + n.at;
            if (at >= from && at < to) this.note(n, at, bus);
          }
        }
        scheduledUntil = to;
      }
    };
    tick();
    const timer = window.setInterval(tick, 150);
    return () => {
      window.clearInterval(timer);
      bus.disconnect();
    };
  }

  private note(n: Note, at: number, bus: AudioNode) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const end = at + n.dur;
    const f = freq(n.midi);
    const peak = { lead: 0.07, bass: 0.13, pad: 0.025, pluck: 0.05 }[n.voice];
    g.gain.setValueAtTime(0.0001, at);
    if (n.voice === 'pluck') {
      g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + Math.min(n.dur, 0.45) + 0.2);
    } else {
      const attack = n.voice === 'pad' ? 0.6 : 0.04;
      g.gain.exponentialRampToValueAtTime(peak, at + attack);
      g.gain.setValueAtTime(peak, Math.max(at + attack, end - 0.08));
      g.gain.exponentialRampToValueAtTime(0.0001, end + (n.voice === 'pad' ? 0.6 : 0.12));
    }
    let to: AudioNode = g;
    if (n.voice === 'lead') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;
      lp.connect(g);
      to = lp;
    }
    g.connect(bus);
    const types: Record<Voice, OscillatorType[]> = {
      lead: ['sawtooth', 'sawtooth'],
      bass: ['triangle'],
      pad: ['triangle'],
      pluck: ['sine'],
    };
    types[n.voice].forEach((type, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = i ? 7 : n.voice === 'lead' ? -7 : 0;
      o.connect(to);
      o.start(at);
      o.stop(end + 0.8);
    });
  }
}
