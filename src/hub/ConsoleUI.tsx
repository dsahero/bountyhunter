/**
 * The main computer's screen: the contract briefing, the wanted card, and
 * the menu of dossier files.
 *
 * This is ordinary DOM. In the 3D cockpit it's projected onto the console
 * screen with drei's <Html transform>, so the buttons stay real, focusable,
 * and screen-reader friendly. In portrait/2D it renders as a flat overlay.
 *
 * Note: drei renders <Html> children in a separate React root, so this
 * component avoids router context (plain <a> links only).
 */
import { useEffect, useState } from 'react';
import { portfolio } from '../content/portfolio';
import { lore, type SectionKey } from '../content/lore';
import { useHub } from '../state/hub';
import { useExperience } from '../state/experience';
import { useReducedMotion } from '../lib/reducedMotion';
import { audio } from '../audio/engine';
import './console.css';

export const STATION_ORDER = Object.keys(lore.sections) as SectionKey[];

function useTypewriter(lines: readonly string[], enabled: boolean, onDone: () => void) {
  const full = lines.join('\n');
  const [count, setCount] = useState(enabled ? 0 : full.length);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          window.clearInterval(id);
          window.setTimeout(onDone, 900);
          return c;
        }
        if (c % 3 === 0) audio.play('tick');
        return c + 1;
      });
    }, 32);
    return () => window.clearInterval(id);
  }, [enabled, full, onDone]);
  return full.slice(0, count);
}

const finishBriefing = () => useHub.getState().set({ contractShown: true });

function Briefing() {
  const reduced = useReducedMotion();
  const text = useTypewriter(lore.contract, !reduced, finishBriefing);
  return (
    <div className="console__briefing">
      <p className="console__typed" aria-live="polite">
        {text}
        <span className="console__cursor" aria-hidden="true">
          █
        </span>
      </p>
      <button className="console__skip" onClick={finishBriefing}>
        Show target ▸
      </button>
    </div>
  );
}

function Menu() {
  const { identity } = portfolio;
  const open = useHub((s) => s.open);
  const station = useHub((s) => s.station);
  // Ready for the keyboard: focus the first file when the menu appears.
  useEffect(() => {
    if (!useHub.getState().station)
      document.getElementById(`console-${STATION_ORDER[0]}`)?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="console__main">
      <button
        className="console__wanted"
        onClick={() => open('about')}
        aria-label={`Wanted poster: ${identity.name}. Open file.`}
      >
        <span className="console__wanted-title">WANTED</span>
        <span className="console__wanted-name">{identity.name}</span>
        <span className="console__wanted-alias">“{identity.alias}”</span>
        <span className="console__wanted-for">For: {identity.wantedFor}</span>
        <span className="console__wanted-reward">
          {identity.reward.amount.toLocaleString('en-US')} credits
        </span>
      </button>
      <nav className="console__files" aria-label="Dossier files">
        <p className="console__files-title">Dossier files</p>
        <ol>
          {STATION_ORDER.map((key) => (
            <li key={key}>
              <button
                id={`console-${key}`}
                className="console__file"
                aria-current={station === key ? 'true' : undefined}
                onClick={() => open(key)}
              >
                <span className="console__file-key" aria-hidden="true">
                  ▸
                </span>
                <span className="console__file-lore">{lore.sections[key].lore}</span>
                <span className="console__file-real">{lore.sections[key].real}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

export function ConsoleUI({ mode }: { mode: 'world' | 'overlay' | 'flat' }) {
  const phase = useExperience((s) => s.phase);
  const contractShown = useHub((s) => s.contractShown);

  return (
    <div className={`console console--${mode}`}>
      <header className="console__header">
        <span>Bounty Guild // Contract Terminal</span>
        <span className="console__status">● Secure link</span>
      </header>
      {phase !== 'hub' ? (
        <p className="console__incoming">Incoming contract…</p>
      ) : contractShown ? (
        <Menu />
      ) : (
        <Briefing />
      )}
      <footer className="console__footer">
        Arrow keys + Enter choose a file · Drag to look around · Esc returns here
      </footer>
    </div>
  );
}
