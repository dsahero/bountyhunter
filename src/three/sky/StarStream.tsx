/**
 * The sense of motion: a sparse field of distant stars drifting toward the
 * ship as it cruises forward (-Z). They stay far off (never whip past the
 * canopy) and recycle to the far end when they get close.
 * Lives in the camera-following sky group, so it's purely relative motion;
 * the far star field stays fixed as the backdrop.
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../lib/reducedMotion';
import { cruise } from './motion';

const SPEED = 2.5;
const BOX = { x: 160, y: 110, near: -60, far: -420 };

export function StarStream({ count }: { count: number }) {
  const reduced = useReducedMotion();
  const { points, positions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOX.x * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOX.y * 2;
      positions[i * 3 + 2] = BOX.far + Math.random() * (BOX.near - BOX.far);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#dfefff',
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    return { points: new THREE.Points(geometry, material), positions };
  }, [count]);

  useFrame((_, dt) => {
    const step = (reduced ? SPEED * 0.2 : SPEED) * cruise.current * Math.min(dt, 0.1);
    for (let i = 2; i < positions.length; i += 3) {
      positions[i]! += step;
      if (positions[i]! > BOX.near) positions[i] = BOX.far;
    }
    points.geometry.attributes.position!.needsUpdate = true;
  });

  return <primitive object={points} />;
}
