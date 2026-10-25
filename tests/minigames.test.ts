import { Firewall, FIREWALL_ROUNDS } from '../src/hub/games/firewall';
import { Typing, TYPING_WAVES } from '../src/hub/games/typing';
import { Cargo, BOARD, CARGO_ROWS_TO_CLEAR } from '../src/hub/games/cargo';
import { GAMES, useAttack } from '../src/hub/attack';
import { skipStage, terminalGame } from '../src/hub/games/terminal';
import { useUnlocks } from '../src/state/unlocks';

/** A small seeded generator so the games are reproducible. */
const rng =
  (seed = 1) =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

describe('firewall', () => {
  it('wins after picking the matching code each round', () => {
    const g = new Firewall(rng(3));
    for (let i = 0; i < FIREWALL_ROUNDS; i++) g.choose(g.cells.indexOf(g.target));
    expect(g.done).toBe(true);
  });

  it('a wrong pick costs time but never ends the game', () => {
    const g = new Firewall(rng(4));
    const wrong = g.cells.findIndex((c) => c !== g.target);
    g.choose(wrong);
    expect(g.solved).toBe(0);
    expect(g.done).toBe(false);
  });

  it('arrow keys wrap around the grid', () => {
    const g = new Firewall(rng(5));
    g.key('ArrowLeft');
    expect(g.cursor).toBe(g.cells.length - 1);
  });
});

describe('typing defense', () => {
  it('typing a torpedo word jams it; clearing all waves wins', () => {
    const g = new Typing(['alpha', 'beta', 'gamma'], rng(6));
    for (let wave = 0; wave < TYPING_WAVES; wave++) {
      while (g.torpedoes.length) for (const ch of g.torpedoes[0]!.word) g.key(ch);
      g.update(0.016);
    }
    expect(g.done).toBe(true);
  });

  it('losing every shield restarts the wave instead of failing', () => {
    const g = new Typing(['alpha', 'beta', 'gamma'], rng(7));
    for (let i = 0; i < 400; i++) g.update(0.1);
    expect(g.done).toBe(false);
    expect(g.torpedoes.length).toBeGreaterThan(0);
  });
});

describe('cargo stack', () => {
  it('clears rows and wins after enough lines', () => {
    const g = new Cargo(rng(8));
    // Fill the bottom rows except one gap, then drop a vertical I into it.
    for (let r = BOARD.rows - CARGO_ROWS_TO_CLEAR - 1; r < BOARD.rows; r++) {
      g.board[r] = Array.from({ length: BOARD.cols }, (_, c) => (c === 0 ? -1 : 1));
    }
    g.piece = {
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      x: 0,
      y: 0,
      shape: 0,
    };
    g.key(' ');
    expect(g.cleared).toBeGreaterThanOrEqual(CARGO_ROWS_TO_CLEAR);
    expect(g.done).toBe(true);
  });

  it('pieces stay inside the hold', () => {
    const g = new Cargo(rng(9));
    for (let i = 0; i < 20; i++) g.key('ArrowLeft');
    expect(Math.min(...g.piece.cells.map(([x]) => x + g.piece.x))).toBe(0);
    for (let i = 0; i < 20; i++) g.key('ArrowRight');
    expect(Math.max(...g.piece.cells.map(([x]) => x + g.piece.x))).toBe(BOARD.cols - 1);
  });
});

describe('cargo stack controls', () => {
  it('holding an arrow slides the piece all the way after a short delay', () => {
    const g = new Cargo(rng(10));
    const start = g.piece.x;
    g.key('ArrowLeft');
    expect(g.piece.x).toBe(start - 1);
    for (let i = 0; i < 30; i++) g.update(0.02); // held 0.6 s, no repeat events needed
    expect(Math.min(...g.piece.cells.map(([x]) => x + g.piece.x))).toBe(0);
    g.keyUp('ArrowLeft');
  });

  it('hold swaps the piece once per drop', () => {
    const g = new Cargo(rng(11));
    const first = g.piece.shape;
    g.key('c');
    expect(g.held).toBe(first);
    const second = g.piece.shape;
    g.key('c'); // not allowed again until the piece lands
    expect(g.piece.shape).toBe(second);
    g.key(' '); // lands; holding is allowed again
    g.key('c');
    expect(g.piece.shape).toBe(first); // the held piece comes back out
  });
});

describe('attack sequence', () => {
  it('skipping every terminal stage wins and unlocks the classified poster', () => {
    useAttack.setState({ stage: 'terminal', game: 0 });
    for (let i = 0; i < GAMES.length; i++) {
      expect(terminalGame()?.id).toBe(GAMES[i]);
      skipStage();
    }
    expect(useAttack.getState().stage).toBe('won');
    expect(useUnlocks.getState().classified).toBe(true);
    useAttack.getState().reset();
  });
});
