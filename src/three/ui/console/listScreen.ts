/** A list page (contacts): title, back / hang-up controls, and a row per item (two columns when long). */
import { type ConsoleItem } from '../../../hub/consoleModel';
import { type DrawArgs } from '../CanvasScreen';
import { COLOR, FONT, button, fit, roundRect, type Region } from '../canvasKit';
import { H, PAD, W } from './chrome';

export function drawList(
  { ctx, hover, focus }: DrawArgs,
  items: ConsoleItem[],
  title: string,
  callName: string | null,
): Region[] {
  const regions: Region[] = [];
  ctx.font = `700 22px ${FONT.display}`;
  ctx.fillStyle = COLOR.holo;
  ctx.fillText(title.toUpperCase(), PAD, 78);
  const controls = items.filter((i) => i.kind === 'back' || i.kind === 'hangup');
  controls.forEach((item, i) => {
    const r = { id: item.id, x: W - PAD - (i + 1) * 128 + 8, y: 54, w: 120, h: 32 };
    button(ctx, r, item.label, { small: true, hover: hover === item.id, focus: focus === item.id });
    regions.push(r);
  });
  if (callName) {
    ctx.font = `14px ${FONT.mono}`;
    ctx.fillStyle = '#7dff9a';
    ctx.fillText(`● ${callName}`, PAD, 100);
  }
  const people = items.filter((i) => i.kind === 'contact');
  const top = 112;
  // One column for a short list, two when there are more contacts than fit.
  const cols = people.length > 5 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(people.length / cols));
  const gap = 6;
  const rowH = Math.min(46, (H - top - 40) / rows - gap);
  const colW = (W - PAD * 2 - gap * (cols - 1)) / cols;
  people.forEach((item, i) => {
    const r = {
      id: item.id,
      x: PAD + (i % cols) * (colW + gap),
      y: top + Math.floor(i / cols) * (rowH + gap),
      w: colW,
      h: rowH,
    };
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fillStyle = hover === item.id ? 'rgba(95,212,255,0.2)' : 'rgba(95,212,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = focus === item.id ? COLOR.amber : 'rgba(95,212,255,0.4)';
    ctx.lineWidth = focus === item.id ? 3 : 1.5;
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(rowH * 0.55)}px sans-serif`;
    ctx.fillText(item.icon ?? '', r.x + 12, r.y + r.h / 2 + 1);
    ctx.font = `700 ${Math.round(rowH * 0.42)}px ${FONT.ui}`;
    ctx.fillStyle = COLOR.text;
    ctx.fillText(
      fit(ctx, item.label, r.w - 24 - rowH * 0.8),
      r.x + 12 + rowH * 0.8,
      r.y + r.h / 2 + 1,
    );
    ctx.textBaseline = 'alphabetic';
    regions.push(r);
  });
  return regions;
}
