/**
 * Touch controls for the defense-terminal minigames (phones and tablets),
 * shown under the screen while a game is running:
 *
 *   firewall  tap the codes on the screen (no extra controls needed)
 *   typing    a text box that brings up the keyboard; letters go to the game
 *   cargo     ◀ ▶ (hold to slide), ⟳ rotate, ▼ (hold to drop), slam, hold
 *
 * Buttons press on pointer-down and release on pointer-up, so holding works
 * just like holding a key.
 */
import { useEffect, useRef } from 'react';
import { useAttack, GAMES } from '../hub/attack';
import { terminalKey, terminalKeyUp } from '../hub/games/terminal';
import { lore } from '../content/lore';

const t = lore.terminalUi.touch;
const CARGO_BUTTONS: { key: string; label: string; aria: string }[] = [
  { key: 'c', label: t.hold, aria: t.holdAria },
  { key: 'ArrowLeft', label: '◀', aria: t.leftAria },
  { key: 'ArrowUp', label: '⟳', aria: t.rotateAria },
  { key: 'ArrowRight', label: '▶', aria: t.rightAria },
  { key: 'ArrowDown', label: '▼', aria: t.dropAria },
  { key: ' ', label: t.slam, aria: t.slamAria },
];

export function TerminalTouch() {
  const stage = useAttack((s) => s.stage);
  const game = useAttack((s) => s.game);
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const id = GAMES[game];
  const typing = useRef<HTMLInputElement>(null);

  // Lift the captions above the controls while they're showing.
  const showing = stage === 'terminal' && coarse && id !== 'firewall';
  useEffect(() => {
    document.body.classList.toggle('has-touch-controls', showing);
    return () => document.body.classList.remove('has-touch-controls');
  }, [showing]);
  useEffect(() => {
    if (showing && id === 'typing') typing.current?.focus();
  }, [showing, id]);

  if (!showing) return null;

  if (id === 'typing') {
    return (
      <div className="terminal-touch">
        <input
          ref={typing}
          className="terminal-touch__type"
          aria-label={lore.a11y.typeCodes}
          placeholder={lore.terminalUi.typePlaceholder}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            for (const ch of e.target.value) terminalKey(ch.toLowerCase());
            e.target.value = '';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') terminalKey('Backspace');
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="terminal-touch terminal-touch--pad"
      role="group"
      aria-label={lore.a11y.cargoControls}
    >
      {CARGO_BUTTONS.map((b) => (
        <button
          key={b.key}
          className="terminal-touch__btn"
          aria-label={b.aria}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            terminalKey(b.key);
          }}
          onPointerUp={() => terminalKeyUp(b.key)}
          onPointerCancel={() => terminalKeyUp(b.key)}
          onLostPointerCapture={() => terminalKeyUp(b.key)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
