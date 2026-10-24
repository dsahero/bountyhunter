/**
 * Planet surfaces painted procedurally (no image files):
 *   orangeEarth   continents, oceans, ice caps, in an orange palette
 *   earthClouds   a separate cloud layer (transparent), drawn a bit larger
 *   pluto         beige-brown with the bright "heart", deliberately low-res
 * Uses a small value-noise fBm so continents look natural and wrap at the seam.
 */
import * as THREE from 'three';
import { seeded } from './textures';

function noise2D(seed: number) {
  const rand = seeded(seed);
  const size = 256;
  const grid = new Float32Array(size * size).map(() => rand());
  const at = (x: number, y: number) =>
    grid[((((y % size) + size) % size) * size + (((x % size) + size) % size)) | 0]!;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const value = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = smooth(x - xi);
    const ty = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
  /** Fractal noise; `period` makes it wrap horizontally (for the sphere seam). */
  return (x: number, y: number, octaves = 5) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < octaves; o++) {
      sum += value(x * f, y * f) * amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  };
}

function paint(
  w: number,
  h: number,
  fn: (u: number, v: number) => [number, number, number, number],
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fn(x / w, y / h);
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Sample noise on a cylinder around the sphere so the left/right edges match. */
function wrapped(n: ReturnType<typeof noise2D>, u: number, v: number, scale: number) {
  const a = u * Math.PI * 2;
  return n(Math.cos(a) * scale + 50, v * scale * 1.6 + Math.sin(a) * scale + 50);
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function orangeEarthTexture() {
  const n = noise2D(4);
  return paint(1024, 512, (u, v) => {
    const h = wrapped(n, u, v, 3.2);
    const lat = Math.abs(v - 0.5) * 2;
    if (lat > 0.86 - h * 0.15) return [250, 236, 214, 255]; // ice caps
    if (h > 0.52) {
      // Land: deserts to darker highlands
      const t = Math.min(1, (h - 0.52) * 3.5);
      return [mix(232, 150, t), mix(150, 70, t), mix(70, 30, t), 255];
    }
    // Ocean: deep rust to shallow amber near coasts
    const t = Math.max(0, (h - 0.38) / 0.14);
    return [mix(120, 205, t), mix(36, 96, t), mix(18, 40, t), 255];
  });
}

export function earthCloudsTexture() {
  const n = noise2D(9);
  return paint(512, 256, (u, v) => {
    const c = wrapped(n, u, v, 4.5);
    const a = Math.max(0, (c - 0.55) * 3.2);
    return [255, 238, 220, Math.min(1, a) * 210];
  });
}

/** Low-res on purpose (and sampled with nearest filtering by the caller). */
export function plutoTexture() {
  const n = noise2D(21);
  const tex = paint(96, 48, (u, v) => {
    const base = wrapped(n, u, v, 2.5);
    // The bright heart: two lobes and a point, around u ~ 0.5, v ~ 0.55.
    // Heart curve: (X² + Y² - 1)³ - X²Y³ < 0, scaled to a patch of the globe.
    const X = (u - 0.5) / 0.09;
    const Y = (0.52 - v) / 0.16;
    const heart = (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y < 0;
    if (heart) return [238, 226, 208, 255];
    const t = base;
    return [mix(120, 196, t), mix(84, 150, t), mix(60, 112, t), 255];
  });
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}
