/**
 * The main computer's screen, drawn into a canvas texture on the screen mesh
 * (so it's welded to the 3D model). Pages: menu and contacts. During the
 * intro it shows "incoming contract". Layout adapts to however many stations
 * and contacts the content file defines.
 */
import { useMemo, useRef } from 'react';
import { CONSOLE } from '../../hub/layout';
import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { rewardText } from '../../content/derived';
import { activateConsoleItem, consoleItems, type ConsoleItem } from '../../hub/consoleModel';
import { useConsoleUi } from '../../state/consoleUi';
import { useHub } from '../../state/hub';
import { useExperience } from '../../state/experience';
import { GAMES, useAttack } from '../../hub/attack';
import { stepTerminal, terminalClick, terminalGame } from '../../hub/games/terminal';
import { CanvasScreen, type DrawArgs } from './CanvasScreen';
import { COLOR, FONT, button, fit, roundRect, screenFinish, type Region } from './canvasKit';

const W = CONSOLE.uiWidth;
const H = CONSOLE.uiHeight;
const PAD = 18;

function background(ctx: CanvasRenderingContext2D, alarm = false) {
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, W * 0.7);
  g.addColorStop(0, alarm ? '#2a0b0b' : '#082634');
  g.addColorStop(1, alarm ? '#120404' : '#03121a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function header(ctx: CanvasRenderingContext2D) {
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

function footer(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(95,212,255,0.15)';
  ctx.fillRect(PAD, H - 30, W - PAD * 2, 1);
  ctx.font = `12px ${FONT.mono}`;
  ctx.fillStyle = COLOR.holoDim;
  ctx.textAlign = 'center';
  ctx.fillText(fit(ctx, lore.console.footer, W - PAD * 2), W / 2, H - 12);
  ctx.textAlign = 'left';
}

/** The wanted card, with a photo slot (grey square + silhouette until a portrait is set). */
function wantedCard(ctx: CanvasRenderingContext2D, r: Region, hover: boolean, focus: boolean) {
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
  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(px, py, ps, ps);
  ctx.fillStyle = '#6f6f6f';
  ctx.beginPath();
  ctx.arc(cx, py + ps * 0.38, ps * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, py + ps, ps * 0.34, ps * 0.3, 0, Math.PI, 0);
  ctx.fill();
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

/** The defense terminal: title, stage tabs, the running minigame, a skip button. */
function drawTerminal({ ctx, hover }: DrawArgs, won: boolean): Region[] {
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

function centeredLines(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * 34));
}

function drawMenu({ ctx, hover, focus }: DrawArgs, items: ConsoleItem[]): Region[] {
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
  wantedCard(ctx, card, hover === 'wanted', focus === 'wanted');
  regions.push(card);
  // Station files, right: a two-column grid that fits however many there are.
  const files = items.filter((i) => i.kind === 'station');
  const gx = PAD + card.w + 16;
  const gy = 72;
  const gw = W - gx - PAD;
  const gh = H - gy - 40;
  ctx.font = `12px ${FONT.mono}`;
  ctx.fillStyle = COLOR.holoDim;
  ctx.fillText(lore.console.files.toUpperCase(), gx, gy - 8);
  const cols = 2;
  const rows = Math.max(1, Math.ceil(files.length / cols));
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
  return regions;
}

function drawList(
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
  const rowH = Math.min(46, (H - top - 40) / Math.max(people.length, 1) - 6);
  people.forEach((item, i) => {
    const r = { id: item.id, x: PAD, y: top + i * (rowH + 6), w: W - PAD * 2, h: rowH };
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
    ctx.fillText(item.label, r.x + 12 + rowH * 0.8, r.y + r.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    regions.push(r);
  });
  return regions;
}

export function ConsoleScreen() {
  const phase = useExperience((s) => s.phase);
  const mode = useConsoleUi((s) => s.mode);
  const focus = useConsoleUi((s) => s.focus);
  const call = useHub((s) => s.call);
  const holosOff = useHub((s) => s.holosOff);
  const items = useMemo(() => consoleItems(mode, !!call, holosOff), [mode, call, holosOff]);
  const callName = call ? (lore.contacts[call.index]?.name ?? null) : null;
  const stage = useAttack((s) => s.stage);
  const gameIndex = useAttack((s) => s.game);
  const last = useRef(0);

  const draw = (args: DrawArgs): Region[] => {
    const { ctx, time } = args;
    if (stage === 'terminal') stepTerminal(time - last.current);
    last.current = time;
    background(ctx, stage === 'terminal');
    header(ctx);
    let regions: Region[] = [];
    if (phase !== 'hub') {
      if (Math.floor(time * 1.6) % 2 === 0) {
        ctx.font = `24px ${FONT.mono}`;
        ctx.fillStyle = COLOR.holo;
        ctx.textAlign = 'center';
        ctx.fillText(lore.console.incoming.toUpperCase(), W / 2, H / 2);
        ctx.textAlign = 'left';
      }
    } else if (stage === 'terminal' || stage === 'won') {
      regions = drawTerminal(args, stage === 'won');
    } else if (mode === 'contacts') {
      regions = drawList(args, items, lore.console.contactsTitle, callName);

    } else {
      regions = drawMenu(args, items);
    }
    footer(ctx);
    screenFinish(ctx, W, H);
    return regions;
  };

  return (
    <CanvasScreen
      width={W}
      height={H}
      worldWidth={CONSOLE.width}
      draw={draw}
      version={`${phase}|${mode}|${callName}|${items.length}|${stage}|${gameIndex}|${holosOff}`}
      animate={phase !== 'hub' || stage === 'terminal'}
      focusId={stage === 'terminal' ? null : focus}
      onActivate={stage === 'terminal' ? terminalClick : activateConsoleItem}
      position={[0, 0, 0.002]}
    />
  );
}
