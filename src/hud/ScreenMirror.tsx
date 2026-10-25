/**
 * Keyboard + screen-reader access to the in-world screens.
 *
 * The screens are canvas textures (so they stay welded to the 3D model), which
 * means their "buttons" aren't DOM. This renders the same items as real,
 * visually-hidden buttons. Arrow keys move focus through them (see Hud), the
 * focused one is mirrored into the store, and the canvas draws its focus ring.
 */
import { useEffect } from 'react';
import { activateConsoleItem, consoleItems } from '../hub/consoleModel';
import { useAchievements } from '../state/achievements';
import { useConsoleUi } from '../state/consoleUi';
import { useHub } from '../state/hub';
import { lore } from '../content/lore';

/** Put keyboard focus back on the main computer's first file. */
export function focusConsole() {
  document
    .querySelector<HTMLElement>('.console-mirror button[id^="console-station"]')
    ?.focus({ preventScroll: true });
}

export function ConsoleMirror() {
  const mode = useConsoleUi((s) => s.mode);
  const focus = useConsoleUi((s) => s.focus);
  const call = useHub((s) => s.call);
  const station = useHub((s) => s.station);
  const holosOff = useHub((s) => s.holosOff);
  const page = useConsoleUi((s) => s.page);
  useAchievements((s) => s.unlocked.length); // re-render for the progress label
  const items = consoleItems(mode, !!call, holosOff, page);
  const set = useConsoleUi.getState().set;

  // Restore keyboard focus to the highlighted item whenever the page changes.
  useEffect(() => {
    if (station) return;
    const target = focus ?? items.find((i) => i.kind === 'station')?.id;
    if (target) document.getElementById(`console-${target}`)?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on a page change, not every focus move
  }, [mode, station]);

  return (
    <nav className="console-mirror sr-only" aria-label={lore.console.header}>
      {items.map((item) => (
        <button
          key={item.id}
          id={`console-${item.id}`}
          onFocus={() => set({ focus: item.id })}
          onBlur={() => {
            if (useConsoleUi.getState().focus === item.id) set({ focus: null });
          }}
          onClick={() => activateConsoleItem(item.id)}
        >
          {item.label}
          {item.sub ? ` (${item.sub})` : ''}
        </button>
      ))}
    </nav>
  );
}

/**
 * The cockpit's clickable things (weapons, helmet, guitar, tchotchkes) for
 * keyboard and screen-reader users. Sighted visitors find them by snooping.
 */
export function ObjectsMirror() {
  const c = lore.console;
  const items: { id: string; label: string }[] = [
    { id: 'fire:blaster', label: c.fireBlaster },
    { id: 'fire:torpedo', label: c.fireTorpedo },
    { id: 'inspect:helmet', label: lore.helmet.label },
    { id: 'guitar', label: lore.attack.guitarTitle },
    ...Object.entries(lore.props).map(([id, p]) => ({ id: `inspect:${id}`, label: p.label })),
  ];
  return (
    <nav className="objects-mirror sr-only" aria-label={c.objects}>
      {items.map((i) => (
        <button key={i.id} id={`object-${i.id}`} onClick={() => activateConsoleItem(i.id)}>
          {i.label}
        </button>
      ))}
    </nav>
  );
}
