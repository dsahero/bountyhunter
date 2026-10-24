/**
 * The defense terminal: owns the running minigame for the current attack
 * stage, advances it each frame, routes keys to it, and reports wins back to
 * the attack state machine.
 */
import { portfolio } from '../../content/portfolio';
import { useAttack, GAMES, type GameId } from '../attack';
import { Cargo } from './cargo';
import { Firewall } from './firewall';
import type { Game } from './game';
import { Typing } from './typing';

const make = (id: GameId): Game => {
  if (id === 'firewall') return new Firewall();
  if (id === 'typing') return new Typing(portfolio.site.attack.games.typing.words);
  return new Cargo();
};

let current: { index: number; game: Game } | null = null;

/** The game for the attack's current stage (created on first use). */
export function terminalGame(): { id: GameId; game: Game } | null {
  const { stage, game: index } = useAttack.getState();
  if (stage !== 'terminal') {
    current = null;
    return null;
  }
  if (!current || current.index !== index) current = { index, game: make(GAMES[index]!) };
  return { id: GAMES[index]!, game: current.game };
}

/** Step the game; hands off to the next stage when it's beaten. */
export function stepTerminal(dt: number) {
  const t = terminalGame();
  if (!t || t.game.done) return;
  t.game.update(Math.min(dt, 0.1));
  if (t.game.done) useAttack.getState().completeGame();
}

export function terminalKeyUp(key: string) {
  terminalGame()?.game.keyUp?.(key);
}

export function terminalKey(key: string, repeat = false): boolean {
  const t = terminalGame();
  if (!t) return false;
  const used = t.game.key(key, repeat);
  if (t.game.done) useAttack.getState().completeGame();
  return used;
}

export function terminalClick(id: string) {
  if (id === 'skip') return skipStage();
  const t = terminalGame();
  t?.game.click?.(id);
  if (t?.game.done) useAttack.getState().completeGame();
}

/** Accessibility escape hatch: skip the current minigame. */
export function skipStage() {
  if (terminalGame()) {
    current = null;
    useAttack.getState().completeGame();
  }
}
