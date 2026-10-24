/**
 * Leadership station: replaces the overhead star map with a hologram listing
 * the "rebel cells" I've run: the planet on the left, the role and its
 * description beside it. Drawn into a canvas texture (welded to the scene),
 * two roles per page; Back / Console / page buttons are on the hologram and
 * mirrored for the keyboard (see LeadershipMirror).
 */
import { ANCHORS } from '../../hub/layout';
import { TIMELINE } from '../../hub/timeline';
import {
  leadershipRoles,
  useLeadershipPage,
  LEADERSHIP_PER_PAGE,
  activateLeadership,
} from '../../hub/LeadershipList';
import { lore } from '../../content/lore';
import { CanvasScreen, type DrawArgs } from '../ui/CanvasScreen';
import {
  COLOR,
  FONT,
  button,
  paragraph,
  roundRect,
  screenFinish,
  type Region,
} from '../ui/canvasKit';
import { Projector, useOverheadShown } from './common';

const W = 760;
const H = 560;

function planet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.25, color);
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function LeadershipHologram() {
  // Stays up after the panel closes, until Holo off or the star map replaces it.
  const active = useOverheadShown('leadership');
  const page = useLeadershipPage((s) => s.page);
  const focus = useLeadershipPage((s) => s.focus);
  const [x, y, z] = ANCHORS.leadership;
  if (!active) return null;

  const roles = leadershipRoles();
  const pages = Math.max(1, Math.ceil(roles.length / LEADERSHIP_PER_PAGE));

  const draw = ({ ctx, hover }: DrawArgs): Region[] => {
    const regions: Region[] = [];
    roundRect(ctx, 0, 0, W, H, 12);
    ctx.fillStyle = 'rgba(3,18,28,0.88)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(95,212,255,0.6)';
    ctx.stroke();

    ctx.font = `700 28px ${FONT.display}`;
    ctx.fillStyle = COLOR.holo;
    ctx.fillText(lore.sections.leadership.lore.toUpperCase(), 24, 46);
    ctx.font = `14px ${FONT.mono}`;
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(lore.sections.leadership.real.toUpperCase(), 26, 68);

    const nav = [
      { id: 'back', label: lore.panel.back },
      { id: 'console', label: lore.panel.console },
    ];
    nav.forEach((b, i) => {
      const r = { id: b.id, x: W - 24 - (2 - i) * 132 + 8, y: 24, w: 124, h: 34 };
      button(ctx, r, b.label, { small: true, hover: hover === b.id, focus: focus === b.id });
      regions.push(r);
    });
    ctx.fillStyle = 'rgba(95,212,255,0.3)';
    ctx.fillRect(24, 84, W - 48, 1);

    const shown = roles.slice(page * LEADERSHIP_PER_PAGE, (page + 1) * LEADERSHIP_PER_PAGE);
    const rowH = (H - 84 - 70) / LEADERSHIP_PER_PAGE;
    shown.forEach((r, i) => {
      const top = 100 + i * rowH;
      planet(ctx, 90, top + 56, 48, r.planet.color);
      ctx.textAlign = 'center';
      ctx.font = `700 15px ${FONT.display}`;
      ctx.fillStyle = COLOR.holo;
      ctx.fillText(r.planet.name.toUpperCase(), 90, top + 128);
      ctx.font = `13px ${FONT.mono}`;
      ctx.fillStyle = COLOR.muted;
      ctx.fillText(r.realLocation, 90, top + 146);
      ctx.textAlign = 'left';

      const bx = 180;
      const bw = W - bx - 28;
      ctx.font = `700 21px ${FONT.display}`;
      ctx.fillStyle = '#ffffff';
      let ty = paragraph(ctx, `${r.role}, ${r.org}`, bx, top + 26, bw, 26, 2);
      ctx.font = `14px ${FONT.mono}`;
      ctx.fillStyle = COLOR.amber;
      ty = paragraph(ctx, `${r.start} – ${r.end} · ${r.chargeTitle}`, bx, ty + 4, bw, 18, 2);
      ctx.font = `16px ${FONT.ui}`;
      ctx.fillStyle = '#d8f4ff';
      const room = top + rowH - 16;
      for (const e of r.evidence) {
        if (ty + 20 > room) break;
        ctx.fillText('•', bx, ty + 18);
        ty = paragraph(
          ctx,
          e,
          bx + 14,
          ty + 18,
          bw - 14,
          19,
          Math.max(1, Math.floor((room - ty) / 19)),
        );
      }
    });

    if (pages > 1) {
      const pr = [
        { id: 'prev', label: '◂', x: W / 2 - 110 },
        { id: 'next', label: '▸', x: W / 2 + 60 },
      ];
      pr.forEach((b) => {
        const r = { id: b.id, x: b.x, y: H - 54, w: 50, h: 34 };
        button(ctx, r, b.label, { small: true, hover: hover === b.id, focus: focus === b.id });
        regions.push(r);
      });
      ctx.font = `14px ${FONT.mono}`;
      ctx.fillStyle = COLOR.muted;
      ctx.textAlign = 'center';
      ctx.fillText(`${page + 1} / ${pages}`, W / 2, H - 32);
      ctx.textAlign = 'left';
    }
    screenFinish(ctx, W, H);
    return regions;
  };

  return (
    <group>
      <Projector position={[x, 2.05, z + 0.05]} height={0.34} radius={0.3} active flip />
      <CanvasScreen
        position={[x, y, z]}
        rotation-x={TIMELINE.tilt}
        width={W}
        height={H}
        worldWidth={0.7}
        draw={draw}
        version={`${page}|${roles.length}`}
        focusId={focus}
        onActivate={activateLeadership}
        overlay
      />
    </group>
  );
}
