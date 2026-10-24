/**
 * The DOM layer over the cockpit: a small title, the always-available
 * controls, the open station's panel, and keyboard shortcuts.
 * Navigation itself lives on the in-world computer (ConsoleUI).
 */
import { useEffect } from 'react';
import { portfolio } from '../content/portfolio';
import { useHub } from '../state/hub';
import { usePortrait } from '../lib/useMediaQuery';
import { ConsoleUI } from '../hub/ConsoleUI';
import { StationPanel } from '../hub/StationPanel';
import { HudControls } from './HudControls';
import './hud.css';

const FOCUSABLE = 'button:not([disabled]), a[href], input, textarea';

/** Controls the arrow keys walk through: the open panel's, or the console's. */
function navigables(): HTMLElement[] {
  const station = useHub.getState().station;
  const root = document.querySelector(
    station === 'leadership' ? '.leadership--world' : station ? '.panel' : '.console',
  );
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
      if (e.key === 'Escape') {
        const was = hub.station;
        if (was) {
          e.preventDefault();
          hub.close();
          document.getElementById(`console-${was}`)?.focus({ preventScroll: true });
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
          document.getElementById(`console-${was}`)?.focus({ preventScroll: true });
        }
        return;
      }
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
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function Hud() {
  useHubHotkeys();
  const portrait = usePortrait();
  const station = useHub((s) => s.station);

  return (
    <div className="hud">
      <header className="hud__top">
        <h1 className="hud__title">
          <span className="hud__kicker">Bounty Guild // Target</span>
          {portfolio.identity.name}
        </h1>
        <HudControls className="hud__controls" />
      </header>
      {portrait && !station && <ConsoleUI mode="overlay" />}
      <StationPanel />
    </div>
  );
}
