/**
 * Easter-egg unlocks, remembered across visits.
 * `classified`: the classified project poster, unlocked by beating the defense terminal.
 */
import { create } from 'zustand';
import { readJSON, writeJSON } from '../lib/storage';

interface Unlocks {
  classified: boolean;
  unlock: (key: 'classified') => void;
}

export const useUnlocks = create<Unlocks>((set) => ({
  classified: readJSON('unlocks', { classified: false }).classified,
  unlock: (key) => {
    set({ [key]: true });
    writeJSON('unlocks', { classified: true });
  },
}));
