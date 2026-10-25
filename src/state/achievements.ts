/**
 * Achievements: little goals for snooping around the cockpit. Unlocks are
 * remembered on this device (localStorage). The list and wording live in
 * portfolio.site.achievements; this store tracks progress and announces
 * each unlock (a chime and a caption).
 *
 * Some achievements are counters ("press 10 mystery buttons", "inspect every
 * tchotchke"); `progress` keeps the sets/counts they need.
 */
import { create } from 'zustand';
import { readJSON, writeJSON } from '../lib/storage';
import { portfolio } from '../content/portfolio';
import { cue } from '../audio/cues';
import { track } from '../lib/analytics';

/** Every achievement the code can award (the wording is in portfolio.site.achievements). */
export const ACHIEVEMENT_IDS = [
  'arrived',
  'all-stations',
  'all-posters',
  'six',
  'cat',
  'voicemail',
  'all-voicemails',
  'blaster',
  'torpedo',
  'helmet',
  'tchotchkes',
  'buttons',
  'holo-off',
  'defender',
  'resume',
  'guestbook',
  'completionist',
] as const;
type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

interface Saved {
  unlocked: string[];
  /** Named sets (e.g. stations visited) and counters, by achievement. */
  seen: Record<string, string[]>;
  counts: Record<string, number>;
}

interface AchievementsState extends Saved {
  unlock: (id: AchievementId) => void;
  /** Add `item` to a named set; unlock `id` once the set holds every item in `all`. */
  see: (id: AchievementId, item: string, all: readonly string[]) => void;
  /** Bump a counter; unlock `id` when it reaches `goal`. */
  count: (id: AchievementId, goal: number) => void;
  reset: () => void;
}

const KEY = 'achievements';
const EMPTY: Saved = { unlocked: [], seen: {}, counts: {} };

export const useAchievements = create<AchievementsState>((set, get) => {
  const save = () => {
    const { unlocked, seen, counts } = get();
    writeJSON(KEY, { unlocked, seen, counts } satisfies Saved);
  };
  return {
    ...EMPTY,
    ...readJSON<Partial<Saved>>(KEY, {}),
    unlock: (id) => {
      if (get().unlocked.includes(id)) return;
      set({ unlocked: [...get().unlocked, id] });
      save();
      const a = portfolio.site.achievements.find((x) => x.id === id);
      if (a) cue('chime', `${portfolio.site.achievementsText.toast}: ${a.title}`);
      track('achievement', { id });
      // Everything else done: the big one.
      const rest = ACHIEVEMENT_IDS.filter((x) => x !== 'completionist');
      if (rest.every((x) => get().unlocked.includes(x))) get().unlock('completionist');
    },
    see: (id, item, all) => {
      const list = get().seen[id] ?? [];
      if (!list.includes(item)) {
        set({ seen: { ...get().seen, [id]: [...list, item] } });
        save();
      }
      const now = get().seen[id] ?? [];
      if (all.every((x) => now.includes(x))) get().unlock(id);
    },
    count: (id, goal) => {
      const n = (get().counts[id] ?? 0) + 1;
      set({ counts: { ...get().counts, [id]: n } });
      save();
      if (n >= goal) get().unlock(id);
    },
    reset: () => {
      set(EMPTY);
      save();
    },
  };
});

export const unlockAchievement = (id: AchievementId) => useAchievements.getState().unlock(id);
