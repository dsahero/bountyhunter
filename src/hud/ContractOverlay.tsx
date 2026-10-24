/**
 * The contract briefing, typed over the arrival shot like a caption: it
 * starts 5 seconds in, types each line in turn, and fades out just as the
 * camera settles in the pilot's seat and the menu appears.
 * Lines come from portfolio.site.contract.
 */
import { useEffect, useState } from 'react';
import { lore } from '../content/lore';
import { ARRIVAL_SECONDS } from '../hub/arrivalTiming';
import { audio } from '../audio/engine';
import { useReducedMotion } from '../lib/reducedMotion';

const START = 5;
const CHAR_MS = 45;

export function ContractOverlay() {
  const reduced = useReducedMotion();
  const lines = lore.contract;
  const [shown, setShown] = useState<string[]>([]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const end = ARRIVAL_SECONDS - 2;
    const span = Math.max(4, end - START - 2);
    lines.forEach((line, i) => {
      const at = (START + (span * i) / lines.length) * 1000;
      if (reduced) {
        timers.push(window.setTimeout(() => setShown((s) => [...s.slice(0, i), line]), at));
        return;
      }
      for (let c = 1; c <= line.length; c++) {
        timers.push(
          window.setTimeout(
            () => {
              setShown((s) => [...s.slice(0, i), line.slice(0, c)]);
              if (c % 3 === 0) audio.play('tick');
            },
            at + c * CHAR_MS,
          ),
        );
      }
    });
    timers.push(window.setTimeout(() => setFading(true), end * 1000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [lines, reduced]);

  return (
    <div className={`contract${fading ? ' contract--fade' : ''}`} aria-live="polite">
      {shown.map((l, i) => (
        <p key={i} className="contract__line">
          {l}
          {i === shown.length - 1 && !fading && (
            <span className="contract__cursor" aria-hidden="true">
              █
            </span>
          )}
        </p>
      ))}
    </div>
  );
}
