/**
 * An in-world screen: a plane whose texture is a 2D canvas we draw UI into.
 *
 * Why not drei's <Html transform>? Html is a DOM layer floating over the
 * canvas and re-positioned with CSS every frame, so it can drift, lag, and
 * "dip" when the camera moves or the lens changes. A canvas texture is part
 * of the mesh: it can't move relative to the model, ever.
 *
 * Interaction: the pointer ray hits the plane, the hit's UV becomes canvas
 * pixels, and the regions the draw function reported decide what's under it.
 * Keyboard and screen-reader access go through a hidden DOM mirror (see
 * hud/ScreenMirror.tsx), which sets `focusId` so the canvas draws the ring.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { hit, type Region } from './canvasKit';
import { useExperience } from '../../state/experience';

export interface DrawArgs {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  hover: string | null;
  focus: string | null;
  time: number;
}

export function CanvasScreen({
  width,
  height,
  worldWidth,
  draw,
  version,
  animate = false,
  focusId = null,
  onActivate,
  overlay = false,
  ...props
}: {
  /** Design size in px (the canvas is drawn at 2x for sharpness). */
  width: number;
  height: number;
  /** Physical width of the screen in meters (height follows the aspect). */
  worldWidth: number;
  draw: (args: DrawArgs) => Region[];
  /** Bump to redraw (state changes). */
  version: unknown;
  /** Redraw every frame (animated screens like games). */
  animate?: boolean;
  focusId?: string | null;
  onActivate?: (id: string) => void;
  /** Draw on top of everything (for holograms that must never be hidden by cockpit hardware). */
  overlay?: boolean;
} & JSX.IntrinsicElements['group']) {
  const SCALE = 2;
  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { ctx, texture };
  }, [width, height]);
  const regions = useRef<Region[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const clock = useRef(0);

  const paint = (time: number) => {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, width, height);
    regions.current = draw({ ctx, w: width, h: height, hover, focus: focusId, time });
    texture.needsUpdate = true;
  };

  // Redraw on state changes (and once fonts are ready, so text renders in the right face).
  useEffect(() => {
    paint(clock.current);
    void document.fonts?.ready.then(() => paint(clock.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, hover, focusId, width, height]);

  useFrame((_, dt) => {
    clock.current += dt;
    if (animate) paint(clock.current);
  });

  useEffect(() => () => texture.dispose(), [texture]);

  const toPx = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    e.uv ? { x: e.uv.x * width, y: (1 - e.uv.y) * height } : null;

  const handlers = {
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      const p = toPx(e);
      const id = p ? hit(regions.current, p.x, p.y) : null;
      if (id !== hover) setHover(id);
      document.body.style.cursor = id ? 'pointer' : '';
    },
    onPointerOut: () => {
      setHover(null);
      document.body.style.cursor = '';
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 6 || useExperience.getState().phase !== 'hub') return;
      const p = toPx(e);
      const id = p ? hit(regions.current, p.x, p.y) : null;
      if (id) {
        e.stopPropagation();
        onActivate?.(id);
      }
    },
  };

  const worldHeight = (worldWidth * height) / width;
  return (
    <group {...props}>
      <mesh {...handlers} renderOrder={overlay ? 20 : 0}>
        <planeGeometry args={[worldWidth, worldHeight]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          transparent
          depthTest={!overlay}
          depthWrite={!overlay}
        />
      </mesh>
    </group>
  );
}
