/**
 * Tiny 2D-canvas UI toolkit for in-world screens: rounded boxes, wrapped
 * text, and clickable regions. Screens draw in "design pixels" and report the
 * regions they drew so pointer hits can be resolved.
 */

export interface Region {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FONT = {
  mono: '"Share Tech Mono", ui-monospace, monospace',
  display: 'Orbitron, system-ui, sans-serif',
  ui: 'Rajdhani, system-ui, sans-serif',
};

export const COLOR = {
  holo: '#5fd4ff',
  holoDim: '#2b7a99',
  amber: '#ffb347',
  text: '#e8eef2',
  muted: '#9fb0bd',
  imperial: '#e0463a',
  paper: '#e9dcc0',
  ink: '#2b1d10',
  red: '#8a1f15',
};

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Word-wrap `text` into lines no wider than `maxWidth` (using the current font). */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

/** Draw wrapped text; returns the y just below the last line. */
export function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
): number {
  const lines = wrap(ctx, text, maxWidth);
  lines.slice(0, maxLines).forEach((l, i) => {
    const last = i === maxLines - 1 && lines.length > maxLines;
    ctx.fillText(last ? `${l.replace(/\s+\S*$/, '')}…` : l, x, y + i * lineHeight);
  });
  return y + Math.min(lines.length, maxLines) * lineHeight;
}

/** A holo-style button. Hover brightens it; focus draws an amber ring. */
export function button(
  ctx: CanvasRenderingContext2D,
  r: Region,
  label: string,
  opts: { sub?: string; hover?: boolean; focus?: boolean; active?: boolean; small?: boolean } = {},
) {
  roundRect(ctx, r.x, r.y, r.w, r.h, 6);
  ctx.fillStyle = opts.active
    ? 'rgba(95,212,255,0.28)'
    : opts.hover
      ? 'rgba(95,212,255,0.2)'
      : 'rgba(95,212,255,0.07)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = opts.hover || opts.active ? COLOR.holo : 'rgba(95,212,255,0.45)';
  ctx.stroke();
  if (opts.focus) {
    roundRect(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 9);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLOR.amber;
    ctx.stroke();
  }
  ctx.fillStyle = COLOR.holo;
  ctx.textBaseline = 'middle';
  if (opts.sub) {
    ctx.font = `700 ${opts.small ? 18 : 24}px ${FONT.display}`;
    ctx.fillText(fit(ctx, label.toUpperCase(), r.w - 28), r.x + 14, r.y + r.h * 0.38);
    ctx.font = `${opts.small ? 14 : 17}px ${FONT.mono}`;
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(sub(opts.sub), r.x + 14, r.y + r.h * 0.74);
  } else {
    ctx.font = `700 ${opts.small ? 17 : 22}px ${FONT.display}`;
    ctx.textAlign = 'center';
    ctx.fillText(fit(ctx, label, r.w - 16), r.x + r.w / 2, r.y + r.h / 2);
    ctx.textAlign = 'left';
  }
  ctx.textBaseline = 'alphabetic';
}

const sub = (s: string) => s.toUpperCase();

/** Shrink text with an ellipsis to fit a width. */
export function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export function hit(regions: Region[], x: number, y: number): string | null {
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i]!;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id;
  }
  return null;
}

/** Scanlines and a faint vignette, drawn last over a screen. */
export function screenFinish(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
