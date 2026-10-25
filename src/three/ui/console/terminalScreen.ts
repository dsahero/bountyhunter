/** The defense terminal page: title, stage tabs, the running minigame, a skip button. */
import { lore } from '../../../content/lore';
import { GAMES } from '../../../hub/attack';
import { terminalGame } from '../../../hub/games/terminal';
import { type DrawArgs } from '../CanvasScreen';
import { COLOR, FONT, button, fit, wrap, type Region } from '../canvasKit';
import { H, PAD, W } from './chrome';

export function drawTerminal({ ctx, hover }: DrawArgs, won: boolean): Region[] {
  const a = lore.attack;
  const regions: Region[] = [];
  ctx.font = `700 18px ${FONT.mono}`;
  ctx.fillStyle = COLOR.imperial;
  ctx.fillText(fit(ctx, a.terminalTitle, W - PAD * 2 - 130), PAD, 70);
  if (won) {
    ctx.font = `700 26px ${FONT.display}`;
    ctx.fillStyle = '#7dff9a';
    ctx.textAlign = 'center';
    centeredLines(ctx, a.won, W / 2, H / 2, W - PAD * 4);
    ctx.textAlign = 'left';
    return regions;
  }
  const t = terminalGame();
  if (!t) return regions;
  const g = a.games[t.id];
  const index = GAMES.indexOf(t.id);
  GAMES.forEach((id, i) => {
    ctx.font = `13px ${FONT.mono}`;
    ctx.fillStyle = i < index ? '#7dff9a' : i === index ? COLOR.amber : COLOR.holoDim;
    ctx.fillText(fit(ctx, `${i + 1}. ${a.games[id].title.toUpperCase()}`, 195), PAD + i * 205, 92);
  });
  ctx.font = `14px ${FONT.mono}`;
  ctx.fillStyle = COLOR.muted;
  ctx.fillText(fit(ctx, g.help, W - PAD * 2 - 150), PAD, 112);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLOR.amber;
  ctx.fillText(`${a.progress} ${t.game.progress()}`, W - PAD, 112);
  ctx.textAlign = 'left';
  const skip = { id: 'skip', x: W - PAD - 120, y: 52, w: 120, h: 26 };
  button(ctx, skip, a.skipStage, { small: true, hover: hover === 'skip' });
  regions.push(skip);
  regions.push(...t.game.draw(ctx, PAD, 124, W - PAD * 2, H - 124 - 40));
  return regions;
}

function centeredLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  max: number,
) {
  const lines = wrap(ctx, text, max);
  lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * 34));
}
