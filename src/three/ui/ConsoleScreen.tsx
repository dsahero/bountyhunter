/**
 * The main computer's screen, drawn into a canvas texture on the screen mesh
 * (so it's welded to the 3D model). Pages (in ./console): the menu, the
 * contacts list, and the defense terminal. During the intro it shows
 * "incoming contract". Layouts adapt to however much the content file defines.
 */
import { useMemo, useRef } from 'react';
import { CONSOLE } from '../../hub/layout';
import { lore } from '../../content/lore';
import { activateConsoleItem, consoleItems, menuPageCount } from '../../hub/consoleModel';
import { useAchievements } from '../../state/achievements';
import { useConsoleUi } from '../../state/consoleUi';
import { useHub } from '../../state/hub';
import { useExperience } from '../../state/experience';
import { useAttack } from '../../hub/attack';
import { stepTerminal, terminalClick } from '../../hub/games/terminal';
import { CanvasScreen, type DrawArgs } from './CanvasScreen';
import { COLOR, FONT, screenFinish, type Region } from './canvasKit';
import { H, W, background, footer, header } from './console/chrome';
import { drawMenu } from './console/menuScreen';
import { drawList } from './console/listScreen';
import { drawTerminal } from './console/terminalScreen';

export function ConsoleScreen() {
  const phase = useExperience((s) => s.phase);
  const mode = useConsoleUi((s) => s.mode);
  const focus = useConsoleUi((s) => s.focus);
  const call = useHub((s) => s.call);
  const holosOff = useHub((s) => s.holosOff);
  const page = useConsoleUi((s) => s.page);
  const achieved = useAchievements((s) => s.unlocked.length);
  const items = useMemo(
    () => consoleItems(mode, !!call, holosOff, page),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- achieved: the app's progress label
    [mode, call, holosOff, page, achieved],
  );
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
      regions = drawMenu(args, items, page % menuPageCount(), menuPageCount());
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
      version={`${phase}|${mode}|${callName}|${items.length}|${stage}|${gameIndex}|${holosOff}|${page}|${achieved}`}
      animate={phase !== 'hub' || stage === 'terminal'}
      focusId={stage === 'terminal' ? null : focus}
      onActivate={stage === 'terminal' ? terminalClick : activateConsoleItem}
      position={[0, 0, 0.002]}
    />
  );
}
