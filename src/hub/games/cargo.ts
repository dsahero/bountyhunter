/**
 * Stage 3, CARGO STABILIZER: a short falling-block game. Pack the loose
 * cargo by clearing 3 rows.
 *
 *   ←/→ move (hold to slide)   ↑ rotate   ↓ soft drop (hold)   Space slam
 *   C or Shift: hold the current piece (swap with the held one, once per piece)
 *
 * Plays like the real thing: held keys auto-repeat after a short delay, a
 * "bag" deals every shape once before repeating, a ghost shows where the
 * piece will land, the next piece is previewed, and a landed piece waits a
 * moment before locking so you can still slide it. Topping out just clears
 * the hold (rows already cleared still count).
 */
import { COLOR, FONT, type Region } from '../../three/ui/canvasKit';
import type { Game, Rand } from './game';

export const CARGO_ROWS_TO_CLEAR = 3;
export const BOARD = { cols: 10, rows: 14 };

/** Seconds: gravity, soft-drop gravity, auto-repeat delay and rate, lock delay. */
const TIMING = { fall: 0.65, softFall: 0.04, das: 0.16, arr: 0.045, lock: 0.45 };
const MAX_LOCK_RESETS = 12;

type Cells = [number, number][];
const SHAPES: Cells[] = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ], // I
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ], // O
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ], // T
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ], // J
  [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ], // L
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ], // S
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ], // Z
];
const COLORS = ['#5fd4ff', '#ffb347', '#ff6a4d', '#7dff9a', '#c9a6ff', '#ffd54a', '#9fb0bd'];

interface Piece {
  cells: Cells;
  x: number;
  y: number;
  shape: number;
}

const HOLD_KEYS = new Set(['c', 'C', 'Shift']);

export class Cargo implements Game {
  done = false;
  board: number[][] = [];
  piece!: Piece;
  held: number | null = null;
  canHold = true;
  queue: number[] = [];
  cleared = 0;
  private fallClock = 0;
  private lockClock = 0;
  private lockResets = 0;
  /** Held movement keys and how long they've been down. */
  private keys = new Map<string, number>();
  private repeatClock = 0;

  constructor(private rand: Rand = Math.random) {
    this.emptyBoard();
    this.spawn();
  }

  emptyBoard() {
    this.board = Array.from({ length: BOARD.rows }, () => Array<number>(BOARD.cols).fill(-1));
  }

  /** The next shape from a shuffled bag of all seven. */
  private deal(): number {
    if (this.queue.length < 2) {
      const bag = SHAPES.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
      this.queue.push(...bag);
    }
    return this.queue.shift()!;
  }

  get next() {
    if (!this.queue.length) this.queue.push(this.deal());
    return this.queue[0]!;
  }

  spawn(shape = this.deal()) {
    const cells = SHAPES[shape]!.map(([x, y]) => [x, y] as [number, number]);
    const width = Math.max(...cells.map(([x]) => x)) + 1;
    this.piece = { cells, x: Math.floor((BOARD.cols - width) / 2), y: 0, shape };
    this.fallClock = 0;
    this.lockClock = 0;
    this.lockResets = 0;
    if (!this.fits(this.piece.cells, this.piece.x, this.piece.y)) this.emptyBoard();
  }

  fits(cells: Cells, px: number, py: number) {
    return cells.every(([cx, cy]) => {
      const x = px + cx;
      const y = py + cy;
      return x >= 0 && x < BOARD.cols && y < BOARD.rows && (y < 0 || this.board[y]![x] === -1);
    });
  }

  private grounded() {
    return !this.fits(this.piece.cells, this.piece.x, this.piece.y + 1);
  }

  /** A successful move or rotation on the ground buys a little more time before locking. */
  private nudgedOnGround() {
    if (this.grounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockClock = 0;
      this.lockResets += 1;
    }
  }

  move(dx: number, dy: number) {
    if (this.fits(this.piece.cells, this.piece.x + dx, this.piece.y + dy)) {
      this.piece.x += dx;
      this.piece.y += dy;
      if (dx) this.nudgedOnGround();
      return true;
    }
    return false;
  }

  rotate() {
    if (this.piece.shape === 1) return; // the square doesn't turn
    const turned: Cells = this.piece.cells.map(([x, y]) => [-y, x]);
    const minX = Math.min(...turned.map(([x]) => x));
    const minY = Math.min(...turned.map(([, y]) => y));
    const normal: Cells = turned.map(([x, y]) => [x - minX, y - minY]);
    // Keep it roughly centered where it was, then try small wall kicks.
    const shift = Math.round(
      (Math.max(...this.piece.cells.map(([x]) => x)) - Math.max(...normal.map(([x]) => x))) / 2,
    );
    for (const kick of [0, -1, 1, -2, 2]) {
      for (const up of [0, -1]) {
        if (this.fits(normal, this.piece.x + shift + kick, this.piece.y + up)) {
          this.piece.cells = normal;
          this.piece.x += shift + kick;
          this.piece.y += up;
          this.nudgedOnGround();
          return;
        }
      }
    }
  }

  /** Swap the current piece into the hold (once per piece). */
  hold() {
    if (!this.canHold) return;
    const current = this.piece.shape;
    if (this.held === null) {
      this.held = current;
      this.spawn();
    } else {
      const swap = this.held;
      this.held = current;
      this.spawn(swap);
    }
    this.canHold = false;
  }

  hardDrop() {
    while (this.move(0, 1));
    this.lock();
  }

  /** Where the piece would land. */
  ghostY() {
    let y = this.piece.y;
    while (this.fits(this.piece.cells, this.piece.x, y + 1)) y++;
    return y;
  }

  lock() {
    for (const [cx, cy] of this.piece.cells) {
      const y = this.piece.y + cy;
      if (y >= 0) this.board[y]![this.piece.x + cx] = this.piece.shape;
    }
    const kept = this.board.filter((row) => row.some((c) => c === -1));
    const lines = BOARD.rows - kept.length;
    if (lines) {
      this.cleared += lines;
      this.board = [
        ...Array.from({ length: lines }, () => Array<number>(BOARD.cols).fill(-1)),
        ...kept,
      ];
      if (this.cleared >= CARGO_ROWS_TO_CLEAR) {
        this.done = true;
        return;
      }
    }
    this.canHold = true;
    this.spawn();
  }

  update(dt: number) {
    if (this.done) return;
    // Held left/right: slide after the auto-repeat delay.
    for (const [key, t] of this.keys) this.keys.set(key, t + dt);
    const dir = (this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('ArrowLeft') ? 1 : 0);
    const heldFor = Math.max(this.keys.get('ArrowLeft') ?? 0, this.keys.get('ArrowRight') ?? 0);
    if (dir && heldFor > TIMING.das) {
      this.repeatClock += dt;
      while (this.repeatClock >= TIMING.arr) {
        this.repeatClock -= TIMING.arr;
        this.move(dir, 0);
      }
    }
    // Gravity (faster while ↓ is held), then the lock delay once it's landed.
    const fall = this.keys.has('ArrowDown') ? TIMING.softFall : TIMING.fall;
    this.fallClock += dt;
    while (this.fallClock >= fall) {
      this.fallClock -= fall;
      this.move(0, 1);
    }
    if (this.grounded()) {
      this.lockClock += dt;
      if (this.lockClock >= TIMING.lock) this.lock();
    } else this.lockClock = 0;
  }

  key(key: string, repeat = false) {
    if (this.done) return false;
    if (repeat) return ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(key);
    if (HOLD_KEYS.has(key)) {
      this.hold();
      return true;
    }
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        // The newest direction wins; the slide restarts its delay.
        this.keys.delete(key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft');
        this.keys.set(key, 0);
        this.repeatClock = 0;
        this.move(key === 'ArrowLeft' ? -1 : 1, 0);
        return true;
      case 'ArrowDown':
        this.keys.set(key, 0);
        this.move(0, 1);
        this.fallClock = 0;
        return true;
      case 'ArrowUp':
        this.rotate();
        return true;
      case ' ':
        this.hardDrop();
        return true;
    }
    return false;
  }

  keyUp(key: string) {
    this.keys.delete(key);
  }

  progress() {
    return `${Math.min(this.cleared, CARGO_ROWS_TO_CLEAR)} / ${CARGO_ROWS_TO_CLEAR}`;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Region[] {
    const size = Math.floor(Math.min(h / BOARD.rows, (w * 0.5) / BOARD.cols));
    const bw = size * BOARD.cols;
    const bx = x + Math.round((w - bw) / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(bx, y, bw, size * BOARD.rows);
    ctx.strokeStyle = 'rgba(95,212,255,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 2, y - 2, bw + 4, size * BOARD.rows + 4);
    const cell = (
      px: number,
      py: number,
      cx: number,
      cy: number,
      s: number,
      shape: number,
      alpha = 1,
    ) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[shape]!;
      ctx.fillRect(px + cx * s + 1, py + cy * s + 1, s - 2, s - 2);
      ctx.globalAlpha = 1;
    };
    this.board.forEach((row, ry) => row.forEach((c, rx) => c >= 0 && cell(bx, y, rx, ry, size, c)));
    if (!this.done) {
      const gy = this.ghostY();
      for (const [cx, cy] of this.piece.cells) {
        if (gy + cy >= 0) cell(bx, y, this.piece.x + cx, gy + cy, size, this.piece.shape, 0.22);
      }
      for (const [cx, cy] of this.piece.cells) {
        if (this.piece.y + cy >= 0)
          cell(bx, y, this.piece.x + cx, this.piece.y + cy, size, this.piece.shape);
      }
    }
    // Hold (left) and next (right) boxes.
    const mini = Math.max(6, Math.floor(size * 0.6));
    const box = (label: string, shape: number | null, px: number, dim: boolean) => {
      ctx.font = `13px ${FONT.mono}`;
      ctx.fillStyle = COLOR.muted;
      ctx.fillText(label, px, y + 14);
      ctx.strokeStyle = 'rgba(95,212,255,0.3)';
      ctx.strokeRect(px, y + 22, mini * 4 + 8, mini * 3 + 8);
      if (shape === null) return;
      for (const [cx, cy] of SHAPES[shape]!)
        cell(px + 4, y + 26, cx, cy, mini, shape, dim ? 0.35 : 1);
    };
    box('HOLD [C]', this.held, bx - mini * 4 - 30, !this.canHold);
    box('NEXT', this.next, bx + bw + 22, false);
    ctx.font = `12px ${FONT.mono}`;
    ctx.fillStyle = COLOR.muted;
    const help = ['←/→ MOVE', '↑ ROTATE', '↓ DROP', 'SPACE SLAM'];
    help.forEach((t, i) => ctx.fillText(t, x, y + mini * 3 + 52 + i * 17));
    return [];
  }
}
