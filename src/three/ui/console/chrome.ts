/** The console screen's frame: size, background, header, footer, and the wanted card. */
import { CONSOLE } from '../../../hub/layout';
import { portfolio } from '../../../content/portfolio';
import { lore } from '../../../content/lore';
import { rewardText } from '../../../content/derived';
import { COLOR, FONT, fit, roundRect, type Region } from '../canvasKit';

export const W = CONSOLE.uiWidth;
export const H = CONSOLE.uiHeight;
export const PAD = 18;

export function background(ctx: CanvasRenderingContext2D, alarm = false) {
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, W * 0.7);
  g.addColorStop(0, alarm ? '#2a0b0b' : '#082634');
  g.addColorStop(1, alarm ? '#120404' : '#03121a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function header(ctx: CanvasRenderingContext2D) {
  ctx.font = `13px ${FONT.mono}`;
  ctx.fillStyle = COLOR.holoDim;
  ctx.fillText(lore.console.header.toUpperCase(), PAD, 28);
  ctx.fillStyle = '#7dff9a';
  ctx.fillText(
    lore.console.status.toUpperCase(),
    PAD + ctx.measureText(lore.console.header.toUpperCase()).width + 16,
    28,
  );
  ctx.fillStyle = 'rgba(95,212,255,0.25)';
  ctx.fillRect(PAD, 42, W - PAD * 2, 1);
}

export function footer(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(95,212,255,0.15)';
  ctx.fillRect(PAD, H - 30, W - PAD * 2, 1);
  ctx.font = `12px ${FONT.mono}`;
  ctx.fillStyle = COLOR.holoDim;
  ctx.textAlign = 'center';
  ctx.fillText(fit(ctx, lore.console.footer, W - PAD * 2), W / 2, H - 12);
  ctx.textAlign = 'left';
}

/** The wanted card, with your photo (or a grey square + silhouette until it loads). */
export function wantedCard(
  ctx: CanvasRenderingContext2D,
  r: Region,
  hover: boolean,
  focus: boolean,
  photo: HTMLImageElement | null = null,
) {
  const { identity } = portfolio;
  roundRect(ctx, r.x, r.y, r.w, r.h, 6);
  ctx.fillStyle = hover ? '#f3e8cf' : COLOR.paper;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a6a3a';
  ctx.stroke();
  if (focus) {
    roundRect(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 9);
    ctx.strokeStyle = COLOR.amber;
    ctx.stroke();
  }
  const cx = r.x + r.w / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR.red;
  ctx.font = `900 30px ${FONT.display}`;
  ctx.fillText(lore.console.wanted, cx, r.y + 38);
  // Photo slot
  const ps = 86;
  const px = cx - ps / 2;
  const py = r.y + 50;
  if (photo) {
    // Center-crop the photo to the square slot.
    const s = Math.min(photo.naturalWidth, photo.naturalHeight);
    const sx = (photo.naturalWidth - s) / 2;
    const sy = (photo.naturalHeight - s) / 2;
    ctx.drawImage(photo, sx, sy, s, s, px, py, ps, ps);
  } else {
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(px, py, ps, ps);
    ctx.fillStyle = '#6f6f6f';
    ctx.beginPath();
    ctx.arc(cx, py + ps * 0.38, ps * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, py + ps, ps * 0.34, ps * 0.3, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.strokeStyle = '#5a4630';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, ps, ps);

  ctx.fillStyle = COLOR.ink;
  ctx.font = `700 18px ${FONT.display}`;
  ctx.fillText(fit(ctx, identity.name, r.w - 16), cx, py + ps + 26);
  ctx.font = `13px ${FONT.mono}`;
  ctx.fillText(fit(ctx, `“${identity.alias}”`, r.w - 16), cx, py + ps + 44);
  ctx.fillStyle = COLOR.red;
  ctx.font = `700 15px ${FONT.display}`;
  ctx.fillText(`${rewardText()} ${lore.labels.credits}`, cx, py + ps + 66);
  ctx.textAlign = 'left';
}
