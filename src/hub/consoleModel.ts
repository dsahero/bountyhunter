/**
 * What the main computer offers, as data: the menu (Call, Holo off, the
 * wanted card, one file per station) and the contacts page. The in-world
 * canvas screen, its hidden keyboard/screen-reader mirror, and the 2D
 * fallback all render this same list, so they can never disagree.
 */
import { lore } from '../content/lore';
import { SECTION_KEYS, type SectionKey } from '../content/schema';
import { useHub, type Inspectable } from '../state/hub';
import { useConsoleUi, type ConsoleMode } from '../state/consoleUi';
import { useWeapons } from '../state/weapons';
import { useAttack } from './attack';

export interface ConsoleItem {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  kind: 'util' | 'wanted' | 'station' | 'contact' | 'back' | 'hangup';
}

export const STATION_ORDER: readonly SectionKey[] = SECTION_KEYS;

export function consoleItems(mode: ConsoleMode, onCall: boolean, holosOff = false): ConsoleItem[] {
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
    ...STATION_ORDER.map((key) => ({
      id: `station:${key}`,
      label: lore.sections[key].lore,
      sub: lore.sections[key].real,
      kind: 'station' as const,
    })),
  ];
}

export function activateConsoleItem(id: string) {
  const hub = useHub.getState();
  const ui = useConsoleUi.getState();
  if (id === 'call') return ui.set({ mode: 'contacts', focus: 'contacts-back' });
  if (id === 'contacts-back') return ui.set({ mode: 'menu', focus: 'call' });
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
