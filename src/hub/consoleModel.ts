/**
 * What the main computer offers, as data: the menu (Call, Holo off, the
 * wanted card, one file per station) and the contacts page. The in-world
 * canvas screen, its hidden keyboard/screen-reader mirror, and the 2D
 * fallback all render this same list, so they can never disagree.
 */
import { lore } from '../content/lore';
import { SECTION_KEYS, type SectionKey } from '../content/schema';
import { useHub } from '../state/hub';
import type { HubApp, Inspectable } from '../state/hubView';
import { ACHIEVEMENT_IDS, useAchievements } from '../state/achievements';
import { useConsoleUi, type ConsoleMode } from '../state/consoleUi';
import { useWeapons } from '../state/weapons';
import { useAttack } from './attack';

export interface ConsoleItem {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  kind: 'util' | 'wanted' | 'station' | 'contact' | 'back' | 'hangup' | 'pager';
}

/** Files per menu page on the in-world screen (two columns of four). */
export const FILES_PER_PAGE = 8;

/** Every file on the menu: one per station, then the console apps. */
function menuFiles(): ConsoleItem[] {
  const c = lore.console;
  const { unlocked } = useAchievements.getState();
  return [
    ...STATION_ORDER.map((key) => ({
      id: `station:${key}`,
      label: lore.sections[key].real,
      sub: lore.sections[key].lore,
      kind: 'station' as const,
    })),
    {
      id: 'app:achievements',
      label: c.achievements,
      sub: `${unlocked.length} / ${ACHIEVEMENT_IDS.length}`,
      kind: 'station',
    },
    { id: 'app:guestbook', label: c.guestbook, sub: c.guestbookSub, kind: 'station' },
  ];
}

export const menuPageCount = () => Math.max(1, Math.ceil(menuFiles().length / FILES_PER_PAGE));

const STATION_ORDER: readonly SectionKey[] = SECTION_KEYS;

/**
 * The items on the current page. `page` picks the menu page (the in-world
 * screen flips pages); `paged: false` lists every file at once (the 2D
 * fallback, which scrolls instead).
 */
export function consoleItems(
  mode: ConsoleMode,
  onCall: boolean,
  holosOff = false,
  page = 0,
  paged = true,
): ConsoleItem[] {
  const c = lore.console;
  if (mode === 'contacts') {
    return [
      { id: 'contacts-back', label: lore.panel.back, kind: 'back' },
      ...(onCall ? [{ id: 'hang-up', label: c.hangUp, kind: 'hangup' as const }] : []),
      ...lore.contacts.map((p, i) => ({
        id: `contact:${i}`,
        label: p.name,
        icon: p.icon,
        kind: 'contact' as const,
      })),
    ];
  }
  return [
    { id: 'call', label: c.call, kind: 'util' },
    { id: 'holo-off', label: holosOff ? c.holoOn : c.holoOff, kind: 'util' },
    { id: 'wanted', label: c.wanted, kind: 'wanted' },
    ...pageOf(menuFiles(), page, paged),
  ];
}

function pageOf(files: ConsoleItem[], page: number, paged: boolean): ConsoleItem[] {
  if (!paged || files.length <= FILES_PER_PAGE) return files;
  const c = lore.console;
  const count = Math.ceil(files.length / FILES_PER_PAGE);
  const p = ((page % count) + count) % count;
  return [
    ...files.slice(p * FILES_PER_PAGE, (p + 1) * FILES_PER_PAGE),
    { id: 'page:prev', label: c.prevPage, kind: 'pager' },
    { id: 'page:next', label: c.nextPage, kind: 'pager' },
  ];
}

export function activateConsoleItem(id: string) {
  const hub = useHub.getState();
  const ui = useConsoleUi.getState();
  if (id === 'call') return ui.set({ mode: 'contacts', focus: 'contacts-back' });
  if (id === 'contacts-back') return ui.set({ mode: 'menu', focus: 'call' });
  if (id === 'page:prev' || id === 'page:next') {
    const count = menuPageCount();
    const page = (ui.page + (id === 'page:next' ? 1 : -1) + count) % count;
    return ui.set({ page, focus: id });
  }
  if (id.startsWith('app:')) return hub.openApp(id.slice(4) as HubApp);
  if (id === 'fire:blaster' || id === 'fire:torpedo') {
    return useWeapons.getState().fire(id === 'fire:blaster' ? 'blaster' : 'torpedo');
  }
  if (id.startsWith('inspect:')) return hub.inspectItem(id.slice(8) as Inspectable);
  if (id === 'guitar') return useAttack.getState().start();
  if (id === 'holo-off') return hub.holoShutdown();
  if (id === 'hang-up') return hub.hangUp();
  if (id === 'wanted') return hub.open('about');
  if (id.startsWith('station:')) return hub.open(id.slice(8) as SectionKey);
  if (id.startsWith('contact:')) return hub.startCall(Number(id.slice(8)));
}
