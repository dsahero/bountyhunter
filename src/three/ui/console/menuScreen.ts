/** The main menu page: utility buttons, the wanted card, and the station files. */
import { lore } from '../../../content/lore';
import { FILES_PER_PAGE, type ConsoleItem } from '../../../hub/consoleModel';
import { type DrawArgs } from '../CanvasScreen';
import { COLOR, FONT, button, type Region } from '../canvasKit';
import { H, PAD, W, wantedCard } from './chrome';

export function drawMenu(
  { ctx, hover, focus }: DrawArgs,
  items: ConsoleItem[],
  page = 0,
  pages = 1,
  photo: HTMLImageElement | null = null,
): Region[] {
  const regions: Region[] = [];
  // Small utility buttons, top right.
  const utils = items.filter((i) => i.kind === 'util');
  let ux = W - PAD;
  for (const item of [...utils].reverse()) {
    const r = { id: item.id, x: ux - 84, y: 10, w: 84, h: 26 };
    button(ctx, r, item.label, { small: true, hover: hover === item.id, focus: focus === item.id });
    regions.push(r);
    ux -= 90;
  }
  // Wanted card, left.
  const card = { id: 'wanted', x: PAD, y: 54, w: 196, h: H - 54 - 40 };
  wantedCard(ctx, card, hover === 'wanted', focus === 'wanted', photo);
  regions.push(card);
  // Station files, right: a two-column grid that fits however many there are.
  const files = items.filter((i) => i.kind === 'station');
  const pager = items.filter((i) => i.kind === 'pager');
  const gx = PAD + card.w + 16;
  const gy = 72;
  const gw = W - gx - PAD;
  const gh = H - gy - 40 - (pager.length ? 34 : 0);
  ctx.font = `12px ${FONT.mono}`;
  ctx.fillStyle = COLOR.holoDim;
  ctx.fillText(lore.console.files.toUpperCase(), gx, gy - 8);
  const cols = 2;
  // With pages, the grid keeps a fixed size so flipping pages doesn't reflow it.
  const rows = pager.length ? FILES_PER_PAGE / cols : Math.max(1, Math.ceil(files.length / cols));
  const gap = 8;
  const cw = (gw - gap) / cols;
  const ch = Math.min(64, (gh - gap * (rows - 1)) / rows);
  files.forEach((item, i) => {
    const r = {
      id: item.id,
      x: gx + (i % cols) * (cw + gap),
      y: gy + Math.floor(i / cols) * (ch + gap),
      w: cw,
      h: ch,
    };
    button(ctx, r, item.label, {
      sub: item.sub,
      hover: hover === item.id,
      focus: focus === item.id,
      small: ch < 56,
    });
    regions.push(r);
  });
  // Page flipper under the grid: ◂  Page 1 / 2  ▸
  if (pager.length) {
    const py = H - 40 - 28;
    pager.forEach((item, i) => {
      const r = { id: item.id, x: i ? W - PAD - 54 : gx, y: py, w: 54, h: 26 };
      button(ctx, r, item.label, {
        small: true,
        hover: hover === item.id,
        focus: focus === item.id,
      });
      regions.push(r);
    });
    ctx.font = `13px ${FONT.mono}`;
    ctx.fillStyle = COLOR.holoDim;
    ctx.textAlign = 'center';
    ctx.fillText(`${lore.console.page.toUpperCase()} ${page + 1} / ${pages}`, gx + gw / 2, py + 18);
    ctx.textAlign = 'left';
  }
  return regions;
}
