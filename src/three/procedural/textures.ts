/**
 * Procedural textures, painted into 2D canvases at runtime.
 *
 * Zero bytes to download, fully original, and easy to tweak. Each function is
 * memoized so the textures are only painted once per page load.
 */
import * as THREE from 'three';

/** Small deterministic PRNG (mulberry32) so textures look the same every visit. */
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function toTexture(c: HTMLCanvasElement, repeat = 1, color = true) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function memo<T>(fn: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= fn());
}

/** Speckle noise over the whole canvas. */
function noise(ctx: CanvasRenderingContext2D, size: number, rand: () => number, alpha: number) {
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 255 * alpha;
    img.data[i] = img.data[i]! + n;
    img.data[i + 1] = img.data[i + 1]! + n;
    img.data[i + 2] = img.data[i + 2]! + n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Worn hull plating: panel seams, rivets, grime streaks. Used on the ship. */
export const hullTexture = memo(() => {
  const size = 512;
  const [c, ctx] = canvas(size);
  const rand = seeded(7);
  ctx.fillStyle = '#8d9298';
  ctx.fillRect(0, 0, size, size);

  // Panels of varied size and slightly different tone.
  for (let i = 0; i < 70; i++) {
    const w = 40 + rand() * 160;
    const h = 30 + rand() * 120;
    const x = rand() * size;
    const y = rand() * size;
    const shade = 120 + rand() * 40;
    ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(30,32,36,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }
  // Rivet rows.
  ctx.fillStyle = 'rgba(40,40,44,0.7)';
  for (let i = 0; i < 400; i++) ctx.fillRect(rand() * size, rand() * size, 2, 2);
  // Grime streaks running "down".
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const g = ctx.createLinearGradient(x, 0, x, 120 + rand() * 200);
    g.addColorStop(0, 'rgba(60,45,30,0.35)');
    g.addColorStop(1, 'rgba(60,45,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, rand() * size, 3 + rand() * 8, 300);
  }
  noise(ctx, size, rand, 0.12);
  return toTexture(c, 1);
});

/** Landing pad: scuffed concrete, hazard ring, guide lines. */
export const padTexture = memo(() => {
  const size = 1024;
  const [c, ctx] = canvas(size);
  const rand = seeded(11);
  const mid = size / 2;
  ctx.fillStyle = '#5b544c';
  ctx.fillRect(0, 0, size, size);
  noise(ctx, size, rand, 0.2);

  // Scorch mark under the engines.
  const scorch = ctx.createRadialGradient(mid, mid, 10, mid, mid, 380);
  scorch.addColorStop(0, 'rgba(15,12,10,0.75)');
  scorch.addColorStop(1, 'rgba(15,12,10,0)');
  ctx.fillStyle = scorch;
  ctx.fillRect(0, 0, size, size);

  // Hazard ring: alternating amber/black dashes.
  const r = size * 0.46;
  const dashes = 64;
  ctx.lineWidth = 26;
  for (let i = 0; i < dashes; i++) {
    ctx.strokeStyle = i % 2 ? '#1a1714' : '#d9962b';
    ctx.beginPath();
    ctx.arc(mid, mid, r, (i / dashes) * Math.PI * 2, ((i + 1) / dashes) * Math.PI * 2);
    ctx.stroke();
  }
  // Guide lines and an inner circle.
  ctx.strokeStyle = 'rgba(230,220,200,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(mid, mid, size * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(mid + Math.cos(a) * size * 0.32, mid + Math.sin(a) * size * 0.32);
    ctx.lineTo(mid + Math.cos(a) * size * 0.43, mid + Math.sin(a) * size * 0.43);
    ctx.stroke();
  }
  return toTexture(c, 1);
});

/** Wind-swept sand for the ground around the pad. */
export const sandTexture = memo(() => {
  const size = 512;
  const [c, ctx] = canvas(size);
  const rand = seeded(23);
  ctx.fillStyle = '#7a5a3e';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? '150,110,75' : '90,62,40'},0.25)`;
    ctx.lineWidth = 1 + rand() * 3;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + 10, size * 0.6, y - 10, size, y);
    ctx.stroke();
  }
  noise(ctx, size, rand, 0.15);
  return toTexture(c, 24);
});

/** Soft round sprite for steam, dust, and glows. */
export const softDotTexture = memo(() => {
  const size = 128;
  const [c, ctx] = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c, 1, false);
});

/** Console surface: dark plating with faint grid. Used inside the cockpit. */
export const consoleTexture = memo(() => {
  const size = 256;
  const [c, ctx] = canvas(size);
  const rand = seeded(5);
  ctx.fillStyle = '#2a2d31';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  noise(ctx, size, rand, 0.15);
  return toTexture(c, 2);
});
