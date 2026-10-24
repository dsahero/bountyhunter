/**
 * Console screen textures: text and simple readouts drawn into a canvas.
 * Uses the self-hosted Share Tech Mono font (drei's <Text> would fetch a font
 * from a CDN, which we avoid).
 */
import * as THREE from 'three';
import { seeded } from './textures';

export interface ScreenOptions {
  lines: string[];
  color?: string;
  background?: string;
  width?: number;
  height?: number;
  /** Draw a faint waveform / bar readout under the text. */
  readout?: 'wave' | 'bars' | 'grid' | 'none';
  seed?: number;
}

export function makeScreenTexture({
  lines,
  color = '#5fd4ff',
  background = '#03141c',
  width = 512,
  height = 288,
  readout = 'none',
  seed = 1,
}: ScreenOptions): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  const rand = seeded(seed);

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Readout layer, drawn dim behind the text.
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  if (readout === 'wave') {
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const y = height * 0.7 + Math.sin(x * 0.05) * 18 * Math.sin(x * 0.011) + (rand() - 0.5) * 8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (readout === 'bars') {
    const n = 16;
    const w = width / n;
    for (let i = 0; i < n; i++) {
      const h = (0.2 + rand() * 0.6) * height * 0.45;
      ctx.fillRect(i * w + 3, height - h - 10, w - 6, h);
    }
  } else if (readout === 'grid') {
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(width * 0.6, height * 0.55, height * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Text.
  ctx.globalAlpha = 1;
  const size = Math.round(height / 9);
  ctx.font = `${size}px "Share Tech Mono", monospace`;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  lines.forEach((line, i) => ctx.fillText(line, size * 0.8, size * 1.6 + i * size * 1.35));

  // Scanlines.
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
