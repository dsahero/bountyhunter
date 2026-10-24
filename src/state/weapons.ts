/**
 * The ship's guns: firing pushes a shot that the 3D scene animates out of the
 * nose (blaster bolts) or from under it (torpedo), with sound and a caption.
 */
import { create } from 'zustand';
import { cue } from '../audio/cues';
import { portfolio } from '../content/portfolio';

export type Weapon = 'blaster' | 'torpedo';

export interface Shot {
  id: number;
  kind: Weapon;
  at: number;
}

let nextId = 1;

export const useWeapons = create<{ shots: Shot[]; fire: (kind: Weapon) => void }>((set, get) => ({
  shots: [],
  fire: (kind) => {
    const shot = { id: nextId++, kind, at: performance.now() };
    set({ shots: [...get().shots, shot] });
    cue(kind, portfolio.site.captions[kind]);
    window.setTimeout(() => set({ shots: get().shots.filter((s) => s.id !== shot.id) }), 4000);
  },
}));
