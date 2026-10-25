/**
 * Stage 2, TORPEDO JAMMER: torpedoes fall toward the shields, each tagged with
 * a guidance code (a word). Type a word to jam that torpedo. Three waves of
 * three; a torpedo that gets through costs a shield; losing all shields
 * restarts the wave. Words come from portfolio.site.attack.games.typing.words.
 */
import { COLOR, FONT, type Region } from '../../three/ui/canvasKit';
import { pick, type Game, type Rand } from './game';

export const TYPING_WAVES = 3;
const PER_WAVE = 3;
const SHIELDS = 3;

interface Torpedo {
  word: string;
  x: number; // 0..1 across
  y: number; // 0..1 down
  speed: number;
}

export class Typing implements Game {
  done = false;
  wave = 0;
  shields = SHIELDS;
  buffer = '';
  torpedoes: Torpedo[] = [];
  flash = 0;

  constructor(
    private words: readonly string[],
    private rand: Rand = Math.random,
  ) {
    this.launchWave();
  }

  launchWave() {
    this.shields = SHIELDS;
    this.buffer = '';
    this.torpedoes = Array.from({ length: PER_WAVE }, (_, i) => ({
      word: pick(this.rand, this.words),
      x: 0.12 + (i / PER_WAVE) * 0.76 + this.rand() * 0.06,
      y: -0.15 - i * 0.28,
      speed: 0.08 + this.wave * 0.016 + this.rand() * 0.02,
    }));
  }

  update(dt: number) {
    this.flash = Math.max(0, this.flash - dt);
    for (const t of this.torpedoes) t.y += t.speed * dt;
    const hits = this.torpedoes.filter((t) => t.y >= 1);
    if (hits.length) {
      this.shields -= hits.length;
      this.flash = 0.5;
      this.torpedoes = this.torpedoes.filter((t) => t.y < 1);
      if (this.shields <= 0) this.launchWave();
    }
    if (!this.torpedoes.length && !this.done) {
      this.wave += 1;
      if (this.wave >= TYPING_WAVES) this.done = true;
      else this.launchWave();
    }
  }

  key(key: string) {
    if (key === 'Backspace') {
      this.buffer = this.buffer.slice(0, -1);
      return true;
    }
    if (key.length !== 1 || !/[a-z0-9]/i.test(key)) return false;
    const next = this.buffer + key.toLowerCase();
    const target = this.torpedoes.find((t) => t.word.startsWith(next));
    if (!target) {
      this.buffer = '';
      this.flash = 0.25;
      return true;
    }
    this.buffer = next;
    if (target.word === next) {
      this.torpedoes = this.torpedoes.filter((t) => t !== target);
      this.buffer = '';
    }
    return true;
  }

  progress() {
    return `${Math.min(this.wave + 1, TYPING_WAVES)} / ${TYPING_WAVES}`;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Region[] {
    // Shields line at the bottom
    ctx.fillStyle = this.flash > 0 ? COLOR.imperial : 'rgba(95,212,255,0.5)';
    ctx.fillRect(x, y + h - 6, w, 3);
    for (const t of this.torpedoes) {
      const tx = x + t.x * w;
      const ty = y + Math.max(0, t.y) * (h - 30);
      ctx.fillStyle = COLOR.imperial;
      ctx.beginPath();
      ctx.moveTo(tx, ty + 14);
      ctx.lineTo(tx - 7, ty);
      ctx.lineTo(tx + 7, ty);
      ctx.fill();
      ctx.font = `700 20px ${FONT.mono}`;
      ctx.textAlign = 'center';
      const typed = t.word.startsWith(this.buffer) ? this.buffer : '';
      ctx.fillStyle = COLOR.amber;
      ctx.fillText(
        typed,
        tx - ctx.measureText(t.word).width / 2 + ctx.measureText(typed).width / 2,
        ty - 6,
      );
      ctx.fillStyle = COLOR.holo;
      ctx.fillText(t.word, tx, ty - 6);
      ctx.textAlign = 'left';
    }
    ctx.font = `16px ${FONT.mono}`;
    ctx.fillStyle = COLOR.amber;
    ctx.fillText(`> ${this.buffer}_`, x, y + h - 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR.muted;
    ctx.fillText('◆'.repeat(Math.max(0, this.shields)), x + w, y + h - 14);
    ctx.textAlign = 'left';
    return [];
  }
}
