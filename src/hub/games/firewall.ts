/**
 * Stage 1, FIREWALL: an intruder signature appears; find the matching code in
 * the grid (arrow keys to move, Enter to lock, or click). Five matches wins.
 * Each round has a timer; running out just reshuffles (no fail state).
 */
import { COLOR, FONT, roundRect, type Region } from '../../three/ui/canvasKit';
import type { Game, Rand } from './game';

const COLS = 4;
const ROWS = 3;
export const FIREWALL_ROUNDS = 5;
const ROUND_TIME = 14;

const hex = (rand: Rand) =>
  Array.from({ length: 4 }, () => '0123456789ABCDEF'[Math.floor(rand() * 16)]).join('');

export class Firewall implements Game {
  done = false;
  cells: string[] = [];
  target = '';
  cursor = 0;
  solved = 0;
  timer = ROUND_TIME;
  flash = 0;

  constructor(private rand: Rand = Math.random) {
    this.shuffle();
  }

  shuffle() {
    const set = new Set<string>();
    while (set.size < COLS * ROWS) set.add(hex(this.rand));
    this.cells = [...set];
    this.target = this.cells[Math.floor(this.rand() * this.cells.length)]!;
    this.timer = ROUND_TIME;
  }

  choose(i: number) {
    if (this.cells[i] === this.target) {
      this.solved += 1;
      if (this.solved >= FIREWALL_ROUNDS) this.done = true;
      else this.shuffle();
    } else {
      this.flash = 0.4;
      this.timer = Math.max(1, this.timer - 3);
    }
  }

  update(dt: number) {
    this.flash = Math.max(0, this.flash - dt);
    this.timer -= dt;
    if (this.timer <= 0) this.shuffle();
  }

  key(key: string) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
    if (key in moves) {
      this.cursor = (this.cursor + moves[key]! + this.cells.length) % this.cells.length;
      return true;
    }
    if (key === 'Enter' || key === ' ') {
      this.choose(this.cursor);
      return true;
    }
    return false;
  }

  click(id: string) {
    if (id.startsWith('cell:')) {
      this.cursor = Number(id.slice(5));
      this.choose(this.cursor);
    }
  }

  progress() {
    return `${this.solved} / ${FIREWALL_ROUNDS}`;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Region[] {
    const regions: Region[] = [];
    ctx.font = `16px ${FONT.mono}`;
    ctx.fillStyle = COLOR.muted;
    ctx.fillText('INTRUDER SIGNATURE', x, y + 16);
    ctx.font = `700 34px ${FONT.mono}`;
    ctx.fillStyle = this.flash > 0 ? COLOR.imperial : COLOR.amber;
    ctx.fillText(this.target, x + 190, y + 22);
    // Timer bar
    ctx.fillStyle = 'rgba(95,212,255,0.2)';
    ctx.fillRect(x + 330, y + 6, w - 330, 10);
    ctx.fillStyle = this.timer < 4 ? COLOR.imperial : COLOR.holo;
    ctx.fillRect(x + 330, y + 6, (w - 330) * (this.timer / ROUND_TIME), 10);

    const gy = y + 40;
    const cw = (w - (COLS - 1) * 8) / COLS;
    const ch = (h - 40 - (ROWS - 1) * 8) / ROWS;
    this.cells.forEach((code, i) => {
      const r = { id: `cell:${i}`, x: x + (i % COLS) * (cw + 8), y: gy + Math.floor(i / COLS) * (ch + 8), w: cw, h: ch };
      roundRect(ctx, r.x, r.y, r.w, r.h, 6);
      ctx.fillStyle = i === this.cursor ? 'rgba(255,179,71,0.22)' : 'rgba(95,212,255,0.07)';
      ctx.fill();
      ctx.lineWidth = i === this.cursor ? 3 : 1.5;
      ctx.strokeStyle = i === this.cursor ? COLOR.amber : 'rgba(95,212,255,0.4)';
      ctx.stroke();
      ctx.font = `700 26px ${FONT.mono}`;
      ctx.fillStyle = COLOR.holo;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(code, r.x + r.w / 2, r.y + r.h / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      regions.push(r);
    });
    return regions;
  }
}
