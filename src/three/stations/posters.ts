/**
 * Rebel propaganda posters, one per project, painted into canvases.
 *
 * Every poster is a combination of:
 *   layout   the artwork (posterStyle): starburst, diagonal, silhouette, grid,
 *            target, ship, halftone, planet, emblem
 *   palette  the inks (posterPalette, or picked from the project id)
 *   border   none, a star border, ticket perforations, or hazard corners
 *   stamp    an optional rubber stamp (wording from portfolio.site.posterStamps)
 * The border and stamp come from a hash of the project id, so each poster is
 * stable but they rarely repeat. A project with media gets a "screen" window
 * where its image or looping video plays (see PropagandaWall).
 * Classified projects get redaction bars and a stamp until unlocked.
 */
import * as THREE from 'three';
import type { Propaganda } from '../../content/schema';
import { lore } from '../../content/lore';
import { wrap } from '../ui/canvasKit';

export const POSTER_PX = { w: 512, h: 768 };
const W = POSTER_PX.w;
const H = POSTER_PX.h;

/** Where a project's media plays on the poster (canvas px). */
export const MEDIA_RECT = { x: 56, y: 205, w: 400, h: 260 };

type Palette = { bg: string; ink: string; accent: string; title: string };
const PALETTES: Record<NonNullable<Propaganda['posterPalette']>, Palette> = {
  rust: { bg: '#c6602a', ink: '#1b0f0a', accent: '#f2d6a2', title: '#1b0f0a' },
  navy: { bg: '#1d3b4f', ink: '#f2d6a2', accent: '#e0463a', title: '#f2ead8' },
  parchment: { bg: '#e9dcc0', ink: '#1b1410', accent: '#8a1f15', title: '#1b1410' },
  neon: { bg: '#141a22', ink: '#5fd4ff', accent: '#ffb347', title: '#f2ead8' },
  jungle: { bg: '#23412f', ink: '#e8e0b8', accent: '#e8a33a', title: '#f4efd8' },
  violet: { bg: '#3a2552', ink: '#f0d8ff', accent: '#ff7ab8', title: '#fff2f8' },
  crimson: { bg: '#7d1c1c', ink: '#f6e6c8', accent: '#111111', title: '#f6e6c8' },
  sand: { bg: '#d9b77a', ink: '#2a1d10', accent: '#2f5d73', title: '#2a1d10' },
};
const PALETTE_NAMES = Object.keys(PALETTES) as (keyof typeof PALETTES)[];

/** Deterministic hash of a string (FNV-1a). */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function paletteFor(p: Propaganda): Palette {
  return PALETTES[p.posterPalette ?? PALETTE_NAMES[hash(p.id) % PALETTE_NAMES.length]!];
}

const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
};

/* ---------------- Layouts (the artwork) ---------------- */

type Layout = (ctx: CanvasRenderingContext2D, c: Palette) => void;

const LAYOUTS: Record<Propaganda['posterStyle'], Layout> = {
  starburst: (ctx, { accent, ink }) => {
    ctx.fillStyle = accent;
    for (let i = 0; i < 18; i++) {
      const a0 = (i / 18) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.55);
      ctx.lineTo(W / 2 + Math.cos(a0) * 900, H * 0.55 + Math.sin(a0) * 900);
      ctx.lineTo(W / 2 + Math.cos(a0 + 0.17) * 900, H * 0.55 + Math.sin(a0 + 0.17) * 900);
      ctx.fill();
    }
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.55, 70, 0, Math.PI * 2);
    ctx.fill();
  },
  diagonal: (ctx, { accent }) => {
    ctx.fillStyle = accent;
    for (let i = -4; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 90, H);
      ctx.lineTo(i * 90 + 45, H);
      ctx.lineTo(i * 90 + 45 + 400, H * 0.35);
      ctx.lineTo(i * 90 + 400, H * 0.35);
      ctx.fill();
    }
  },
  silhouette: (ctx, { accent, ink }) => {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.52, 170, 0, Math.PI * 2);
    ctx.fill();
    // A lone figure with a raised fist, in front of the sun.
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.43, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(W / 2 - 50, H * 0.47, 100, 210);
    ctx.fillRect(W / 2 + 30, H * 0.3, 26, 130);
    ctx.fillRect(0, H * 0.74, W, H * 0.26);
  },
  grid: (ctx, { ink }) => {
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.4);
      ctx.lineTo((i / 12) * W * 2 - W / 2, H);
      ctx.stroke();
      const y = H * 0.4 + H * 0.6 * (i / 12) ** 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  target: (ctx, { accent, ink }) => {
    // Concentric rings and a crosshair: the bounty is in sight.
    for (let r = 230, i = 0; r > 20; r -= 38, i++) {
      ctx.fillStyle = i % 2 ? accent : ink;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.52, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.2);
    ctx.lineTo(W / 2, H * 0.84);
    ctx.moveTo(10, H * 0.52);
    ctx.lineTo(W - 10, H * 0.52);
    ctx.stroke();
  },
  ship: (ctx, { accent, ink }) => {
    // A starfighter climbing past a big sun, with speed lines.
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(W * 0.7, H * 0.4, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + i * 12, H * 0.84 - i * 26);
      ctx.lineTo(160 + i * 12, H * 0.62 - i * 26);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(W * 0.5, H * 0.56);
    ctx.rotate(-0.7);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, -120);
    ctx.lineTo(28, 40);
    ctx.lineTo(110, 70);
    ctx.lineTo(110, 92);
    ctx.lineTo(22, 80);
    ctx.lineTo(0, 110);
    ctx.lineTo(-22, 80);
    ctx.lineTo(-110, 92);
    ctx.lineTo(-110, 70);
    ctx.lineTo(-28, 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  halftone: (ctx, { accent }) => {
    // Comic-press dots, bigger toward the bottom.
    ctx.fillStyle = accent;
    for (let y = 150; y < H; y += 22) {
      const r = 1 + ((y - 150) / (H - 150)) * 9;
      for (let x = (y / 22) % 2 ? 11 : 0; x < W + 22; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  planet: (ctx, { accent, ink }) => {
    // A ringed world rising over a horizon, with a scatter of stars.
    ctx.fillStyle = ink;
    for (let i = 0; i < 40; i++) star(ctx, (i * 97) % W, 140 + ((i * 61) % 260), 2 + (i % 3));
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.5, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.5, 230, 48, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
  },
  emblem: (ctx, { accent, ink }) => {
    // A winged crest: the cell's insignia.
    ctx.fillStyle = accent;
    ctx.save();
    ctx.translate(W / 2, H * 0.5);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -10 + i * 22);
        ctx.lineTo(s * (230 - i * 34), -80 + i * 30);
        ctx.lineTo(s * (210 - i * 34), -52 + i * 30);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, -120);
    ctx.lineTo(70, -60);
    ctx.lineTo(50, 90);
    ctx.lineTo(0, 130);
    ctx.lineTo(-50, 90);
    ctx.lineTo(-70, -60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    star(ctx, 0, 0, 44);
    ctx.restore();
  },
};

/* ---------------- Borders and stamps ---------------- */

function border(ctx: CanvasRenderingContext2D, kind: number, c: Palette) {
  ctx.save();
  if (kind === 1) {
    ctx.fillStyle = c.accent;
    for (let x = 18; x < W; x += 36) {
      star(ctx, x, 14, 7);
      star(ctx, x, H - 14, 7);
    }
  } else if (kind === 2) {
    // Ticket stub: perforations down one side, notches on the corners.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    for (let y = 12; y < H; y += 18) {
      ctx.beginPath();
      ctx.arc(22, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [x, y] of [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 3) {
    // Hazard stripes in two corners.
    ctx.fillStyle = c.accent;
    for (const [cx, cy, s] of [
      [0, 0, 1],
      [W, H, -1],
    ] as const) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * i * 34, cy);
        ctx.lineTo(cx + s * (i * 34 + 17), cy);
        ctx.lineTo(cx, cy + s * (i * 34 + 17));
        ctx.lineTo(cx, cy + s * i * 34);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function stamp(ctx: CanvasRenderingContext2D, text: string, seed: number) {
  ctx.save();
  ctx.translate(W * (0.7 - (seed % 3) * 0.2), H * 0.66);
  ctx.rotate(-0.25 + (seed % 5) * 0.08);
  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = '#b3241c';
  ctx.fillStyle = '#b3241c';
  ctx.lineWidth = 4;
  ctx.font = '700 22px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 28;
  ctx.strokeRect(-w / 2, -24, w, 38);
  ctx.fillText(text, 0, 3);
  ctx.restore();
}

export function makePosterTexture(p: Propaganda, locked: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const pal = paletteFor(p);
  const seed = hash(p.id);
  const hasMedia = p.media.length > 0 && !locked;

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  // ---------- Artwork, border, and a window for media ----------
  ctx.save();
  LAYOUTS[p.posterStyle](ctx, pal);
  ctx.restore();
  border(ctx, (seed >> 3) % 4, pal);
  if (hasMedia) {
    const { x, y, w, h } = MEDIA_RECT;
    ctx.fillStyle = pal.ink;
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    ctx.fillStyle = '#05080b';
    ctx.fillRect(x, y, w, h);
  }

  // ---------- Text ----------
  ctx.textAlign = 'center';
  ctx.font = '900 54px Orbitron, sans-serif';
  const slogan = wrap(ctx, p.slogan, W - 70);
  slogan.forEach((line, i) => {
    ctx.fillStyle = p.posterStyle === 'starburst' ? pal.ink : pal.accent;
    ctx.fillText(line, W / 2, 90 + i * 60);
  });

  ctx.fillStyle = p.posterStyle === 'silhouette' || p.posterStyle === 'planet' ? pal.bg : pal.title;
  const title = locked ? '██████' : p.title.toUpperCase();
  // Long titles shrink to fit.
  let size = 40;
  ctx.font = `700 ${size}px Orbitron, sans-serif`;
  while (ctx.measureText(title).width > W - 50 && size > 22) {
    size -= 2;
    ctx.font = `700 ${size}px Orbitron, sans-serif`;
  }
  ctx.fillText(title, W / 2, H - 92);
  ctx.font = '26px "Share Tech Mono", monospace';
  ctx.fillText(
    `${lore.labels.bountyValue.toUpperCase()} ${p.bountyValue.toLocaleString('en-US')} ${lore.holograms.currency}`,
    W / 2,
    H - 44,
  );

  // ---------- A rubber stamp on some posters ----------
  const stamps = lore.posterStamps;
  if (!locked && stamps.length && seed % 3 !== 0) stamp(ctx, stamps[seed % stamps.length]!, seed);

  // ---------- Classified overlay ----------
  if (locked) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.35);
    ctx.strokeStyle = '#e0463a';
    ctx.lineWidth = 8;
    ctx.strokeRect(-200, -50, 400, 100);
    ctx.fillStyle = '#e0463a';
    ctx.font = '900 56px Orbitron, sans-serif';
    ctx.fillText(lore.labels.classified, 0, 20);
    ctx.restore();
  }

  // Wear: border and a little grime.
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
