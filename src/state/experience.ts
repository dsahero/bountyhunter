/**
 * The experience state machine.
 *
 * The cinematic is a linear sequence of phases ending in the hub. Each phase
 * calls `advance()` when it finishes; "Skip intro" calls `skip()`, which
 * simply jumps to the hub. Because every path converges on one state,
 * skipping needs no special-case logic anywhere else.
 *
 * `arrival` is one continuous, uncut 3D shot: the ship flies overhead, the
 * camera follows it in through a vent, and settles into the pilot's eyes.
 * Devices without WebGL route around it.
 */
import { create } from 'zustand';
import { useSettings } from './settings';

export type Phase = 'gate' | 'title' | 'crawl' | 'arrival' | 'hub';

export const PHASE_ORDER_3D: readonly Phase[] = ['gate', 'title', 'crawl', 'arrival', 'hub'];
export const PHASE_ORDER_2D: readonly Phase[] = ['gate', 'title', 'crawl', 'hub'];

export interface ExperienceState {
  phase: Phase;
  order: readonly Phase[];
  /** Call once at startup with whether the device can render the 3D scenes. */
  configure: (opts: { webgl: boolean }) => void;
  advance: () => void;
  skip: () => void;
  /** Replay the intro from the beginning (and stop auto-skipping). */
  replay: () => void;
}

export function nextPhase(current: Phase, order: readonly Phase[]): Phase {
  const i = order.indexOf(current);
  return order[Math.min(i + 1, order.length - 1)] ?? 'hub';
}

export const useExperience = create<ExperienceState>((set, get) => ({
  phase: useSettings.getState().skipIntro ? 'hub' : 'gate',
  order: PHASE_ORDER_3D,
  configure: ({ webgl }) => set({ order: webgl ? PHASE_ORDER_3D : PHASE_ORDER_2D }),
  advance: () => {
    const next = nextPhase(get().phase, get().order);
    if (next === 'hub') useSettings.getState().set({ skipIntro: true });
    set({ phase: next });
  },
  skip: () => {
    useSettings.getState().set({ skipIntro: true });
    set({ phase: 'hub' });
  },
  replay: () => {
    useSettings.getState().set({ skipIntro: false });
    set({ phase: 'gate' });
  },
}));
