/**
 * Rebel propaganda posters, one per project, painted into canvases.
 * Four original layouts (starburst, diagonal, silhouette, grid) in a bold
 * poster style: big slogan, project title, and the bounty value.
 * Classified projects get redaction bars and a stamp until unlocked.
 */
import * as THREE from 'three';
import type { Propaganda } from '../../content/schema';
import { lore } from '../../content/lore';

const W = 512;
const H = 768;

const PALETTES: Record<Propaganda['posterStyle'], { bg: string; ink: string; accent: string }> = {
  starburst: { bg: '#c6602a', ink: '#1b0f0a', accent: '#f2d6a2' },
  diagonal: { bg: '#1d3b4f', ink: '#f2d6a2', accent: '#e0463a' },
  silhouette: { bg: '#e9dcc0', ink: '#1b1410', accent: '#8a1f15' },
  grid: { bg: '#141a22', ink: '#5fd4ff', accent: '#ffb347' },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  lines.push(line);
  return lines;
}

export function makePosterTexture(p: Propaganda, locked: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const { bg, ink, accent } = PALETTES[p.posterStyle];

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ---------- Artwork ----------
  ctx.save();
  if (p.posterStyle === 'starburst') {
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
  } else if (p.posterStyle === 'diagonal') {
    ctx.fillStyle = accent;
    for (let i = -4; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 90, H);
      ctx.lineTo(i * 90 + 45, H);
      ctx.lineTo(i * 90 + 45 + 400, H * 0.35);
      ctx.lineTo(i * 90 + 400, H * 0.35);
      ctx.fill();
    }
  } else if (p.posterStyle === 'silhouette') {
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
  } else {
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
  }
  ctx.restore();

  // ---------- Text ----------
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = '900 54px Orbitron, sans-serif';
  const slogan = wrap(ctx, p.slogan, W - 70);
  slogan.forEach((line, i) => {
    ctx.fillStyle = p.posterStyle === 'starburst' ? ink : accent;
    ctx.fillText(line, W / 2, 90 + i * 60);
  });

  ctx.fillStyle = p.posterStyle === 'silhouette' ? bg : ink;
  if (p.posterStyle === 'grid' || p.posterStyle === 'diagonal') ctx.fillStyle = '#f2ead8';
  ctx.font = '700 40px Orbitron, sans-serif';
  ctx.fillText(locked ? '██████' : p.title.toUpperCase(), W / 2, H - 92);
  ctx.font = '26px "Share Tech Mono", monospace';
  ctx.fillText(
    `${lore.labels.bountyValue.toUpperCase()} ${p.bountyValue.toLocaleString('en-US')} ${lore.holograms.currency}`,
    W / 2,
    H - 44,
  );

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
