/**
 * Small text labels for holograms (planet names etc.), drawn into a canvas
 * and shown as a camera-facing sprite. Self-hosted font, no network fetch.
 */
import * as THREE from 'three';

export function makeTextSprite(
  text: string,
  { color = '#bff0ff', height = 0.03, font = '"Share Tech Mono", monospace' } = {},
) {
  const px = 64;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  ctx.font = `${px}px ${font}`;
  c.width = Math.ceil(ctx.measureText(text).width) + 16;
  c.height = px + 16;
  ctx.font = `${px}px ${font}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(text, 8, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  sprite.scale.set((height * c.width) / c.height, height, 1);
  return sprite;
}
