/**
 * The DOM layer over the cockpit: a small title, the always-available
 * controls, the open station's panel, and keyboard shortcuts.
 * Navigation itself lives on the in-world computer (ConsoleUI).
 */
import { useEffect } from 'react';
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { ConsoleMirror, ObjectsMirror, focusConsole } from './ScreenMirror';
import { LeadershipMirror } from '../hub/LeadershipList';
import { StationPanel } from '../hub/StationPanel';
import { HudControls } from './HudControls';
import { InspectPanel } from './InspectPanel';
import { useAttack } from '../hub/attack';
import { skipStage, terminalKey, terminalKeyUp } from '../hub/games/terminal';
import './hud.css';

const FOCUSABLE = 'button:not([disabled]), a[href], input, textarea';

/** Controls the arrow keys walk through: the open panel's, or the console's. */
function navigables(): HTMLElement[] {
  const { station, inspect } = useHub.getState();
  const root = station || inspect
    ? document.querySelector(station === 'leadership' ? '.leadership-mirror' : '.panel')
    : (document.querySelector('.console-mirror') ?? document.querySelector('.console'));
  return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

/** Move focus to a control and make sure it's visible inside its scrolling panel. */
function focusControl(el: HTMLElement) {
  el.focus({ preventScroll: true });
  if (el.closest('.panel')) el.scrollIntoView({ block: 'nearest' });
}

/**
 * Keyboard, everywhere:
 *   ↑ / ↓      previous / next control; in a long panel, scrolls when the
 *              next control is further than a screenful away
 *   ← / →      previous / next control
 *   Enter      activate (or wake keyboard navigation if nothing is focused)
 *   Backspace  back one step (e.g. transmission -> poster list -> console)
 *   Esc        straight back to the main computer
 * Looking around is drag-only.
 */
export function useHubHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      const typing =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement;
      const hub = useHub.getState();
      // Under attack: the defense terminal gets the keyboard.
      if (useAttack.getState().stage === 'terminal') {
        if (e.key === 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
        if (t instanceof HTMLButtonElement && e.key === 'Enter' && t.closest('.terminal-mirror')) return;
        if (terminalKey(e.key, e.repeat)) e.preventDefault();
        return;
      }
      if (hub.inspect && (e.key === 'Escape' || (e.key === 'Backspace' && !typing))) {
        if (useAttack.getState().stage !== 'idle') return;
        e.preventDefault();
        hub.close();
        focusConsole();
        return;
      }
      if (e.key === 'Escape') {
        const was = hub.station;
        if (was) {
          e.preventDefault();
          hub.close();
          document.getElementById(`console-station:${was}`)?.focus({ preventScroll: true });
        }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        if (!hub.station) return;
        e.preventDefault();
        const was = hub.station;
        hub.back();
        if (!useHub.getState().station) {
          document.getElementById(`console-station:${was}`)?.focus({ preventScroll: true });
        }
        return;
      }
      const isArrow = e.key.startsWith('Arrow');
      // Arrow keys bring the view back onto what you're working with (after a drag or zoom).
      if (isArrow) hub.recenter();
      const list = navigables();
      if (!list.length) return;
      const index = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'Enter' && index < 0) {
        e.preventDefault();
        focusControl(list[0]!);
        return;
      }
      const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
      if (step === undefined) return;
      e.preventDefault();

      // Up/Down in a scrolling panel: if the next control is far away, scroll instead.
      const body = document.querySelector<HTMLElement>('.panel__body');
      if (body && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && hub.station) {
        const view = body.getBoundingClientRect();
        const next = list[index < 0 ? 0 : index + step];
        const far =
          !next ||
          (step > 0
            ? next.getBoundingClientRect().top > view.bottom + view.height * 0.15
            : next.getBoundingClientRect().bottom < view.top - view.height * 0.15);
        const canScroll =
          step > 0
            ? body.scrollTop + body.clientHeight < body.scrollHeight - 1
            : body.scrollTop > 0;
        if (far && canScroll) {
          body.scrollBy({ top: step * view.height * 0.45, behavior: 'smooth' });
          return;
        }
        if (!next) return;
        focusControl(next);
        return;
      }

      const nextIndex = index < 0 ? 0 : (index + step + list.length) % list.length;
      focusControl(list[nextIndex]!);
    };
    // Releases matter to the terminal games (held keys slide and soft-drop).
    const onKeyUp = (e: KeyboardEvent) => terminalKeyUp(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}

export function Hud() {
  useHubHotkeys();
  const station = useHub((s) => s.station);
  const stage = useAttack((s) => s.stage);
  const game = useAttack((s) => s.game);
  const games = lore.attack.games;
  const current = [games.firewall, games.typing, games.cargo][game];

  return (
    <div className="hud">
      <header className="hud__top">
        <h1 className="hud__title">
          <span className="hud__kicker">{lore.hud.kicker}</span>
          {portfolio.identity.name}
        </h1>
        <HudControls className="hud__controls" />
      </header>
      {stage === 'terminal' ? (
        <div className="terminal-mirror sr-only">
          <p role="status">
            {lore.attack.terminalTitle}. {current?.title}: {current?.help}
          </p>
          <button onClick={skipStage}>{lore.attack.skipStage}</button>
        </div>
      ) : (
        <ConsoleMirror />
      )}
      {(stage === 'alert' || stage === 'terminal') && (
        <div className="emergency-dim" aria-hidden="true" />
      )}
      <ObjectsMirror />
      <InspectPanel />
      {station === 'leadership' && <LeadershipMirror />}
      <StationPanel />
    </div>
  );
}
