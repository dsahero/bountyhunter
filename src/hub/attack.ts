/**
 * The guitar easter egg, as a small state machine:
 *
 *   idle -> guitar   you pick up the guitar; its blurb starts loading
 *        -> incoming a comm cuts in: another hunter appears on the overhead
 *                    projector, "We're being attacked!!"
 *        -> alert    alarms blare and the cockpit lights fail
 *        -> terminal the main computer becomes a defense terminal: three
 *                    minigames back to back
 *        -> won      lights come back; the classified poster is unlocked
 *
 * All text comes from portfolio.site.attack / captions.
 */
import { create } from 'zustand';
import { portfolio } from '../content/portfolio';
import { caption, cue } from '../audio/cues';
import { audio } from '../audio/engine';
import { useHub } from '../state/hub';
import { useLook } from '../state/look';
import { useUnlocks } from '../state/unlocks';
import { unlockAchievement } from '../state/achievements';
import { ANCHORS, lookAtPoint } from './layout';
import { startRumbles, stopRumbles } from './rumble';

type AttackStage = 'idle' | 'guitar' | 'incoming' | 'alert' | 'terminal' | 'won';
export const GAMES = ['firewall', 'typing', 'cargo'] as const;
export type GameId = (typeof GAMES)[number];

interface AttackState {
  stage: AttackStage;
  /** Index into GAMES while the terminal is up. */
  game: number;
  start: () => void;
  completeGame: () => void;
  reset: () => void;
}

const timers: number[] = [];
const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
let alarmLoop = 0;

export const useAttack = create<AttackState>((set, get) => ({
  stage: 'idle',
  game: 0,

  start: () => {
    if (get().stage !== 'idle') return;
    const site = portfolio.site;
    set({ stage: 'guitar', game: 0 });
    useHub.getState().inspectItem('guitar');

    // The guitar's blurb "loads" for a few seconds, then a comm cuts in.
    later(5500, () => {
      set({ stage: 'incoming' });
      const hub = useHub.getState();
      if (hub.holosOff) useHub.setState({ holosOff: false });
      hub.set({ station: null });
      if (hub.inspect) useHub.setState({ inspect: null });
      const { yaw, pitch } = lookAtPoint(ANCHORS.experience);
      useLook.getState().focusOn(yaw, pitch);
      cue('ring', site.captions.ring);
      later(1400, () => caption(`${site.attack.caller}: ${site.attack.alert}`, 4200));
    });

    // Before anyone can ask questions: alarms, lights out.
    later(9500, () => {
      set({ stage: 'alert' });
      cue('alarm', site.captions.alarm);
      later(400, () => cue('powerDown', site.captions.lightsOut));
      startRumbles();
      if (!site.audio.alarm) alarmLoop = window.setInterval(() => audio.play('alarm'), 6000);
    });

    // The main computer becomes a defense terminal.
    later(12500, () => {
      set({ stage: 'terminal', game: 0 });
      useHub.getState().close();
    });
  },

  completeGame: () => {
    const next = get().game + 1;
    if (next < GAMES.length) {
      audio.play('chime');
      set({ game: next });
      return;
    }
    const site = portfolio.site;
    window.clearInterval(alarmLoop);
    stopRumbles();
    set({ stage: 'won' });
    cue('powerUp', site.captions.lightsOn);
    later(600, () => cue('chime', site.captions.win));
    caption(site.attack.won, 6000);
    useUnlocks.getState().unlock('classified');
    unlockAchievement('defender');
    later(6500, () => set({ stage: 'idle', game: 0 }));
  },

  reset: () => {
    timers.splice(0).forEach((t) => window.clearTimeout(t));
    window.clearInterval(alarmLoop);
    stopRumbles();
    set({ stage: 'idle', game: 0 });
  },
}));

/** True while the cockpit is under attack (emergency lighting, alarms). */
export const isEmergency = (stage: AttackStage) => stage === 'alert' || stage === 'terminal';
