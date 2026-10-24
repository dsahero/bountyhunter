/**
 * User settings that persist across visits (localStorage, via lib/storage).
 */
import { create } from 'zustand';
import { readJSON, writeJSON } from '../lib/storage';

export type ReducedMotionSetting = 'system' | 'on' | 'off';

export interface SettingsState {
  /** Returning visitors skip straight to the cockpit. */
  skipIntro: boolean;
  soundEnabled: boolean;
  /** 0..1 */
  volume: number;
  reducedMotion: ReducedMotionSetting;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

type Persisted = Omit<SettingsState, 'set'>;

/** Full motion is the default now; drop the old auto-saved 'system' value. */
function migrate(stored: Partial<Persisted>): Partial<Persisted> {
  const { reducedMotion, ...rest } = stored;
  return reducedMotion === 'system' ? rest : stored;
}

const DEFAULTS: Persisted = {
  skipIntro: false,
  soundEnabled: false,
  volume: 0.6,
  reducedMotion: 'off',
};

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  ...migrate(readJSON<Partial<Persisted>>('settings', {})),
  set: (patch) => {
    set(patch);
    const { skipIntro, soundEnabled, volume, reducedMotion } = get();
    writeJSON('settings', { skipIntro, soundEnabled, volume, reducedMotion } satisfies Persisted);
  },
}));

// Reflect the (manual) reduced-motion choice as a class on <html>, so CSS can tone animations down.
if (typeof document !== 'undefined') {
  const apply = () =>
    document.documentElement.classList.toggle(
      'reduced-motion',
      useSettings.getState().reducedMotion === 'on',
    );
  apply();
  useSettings.subscribe(apply);
}
