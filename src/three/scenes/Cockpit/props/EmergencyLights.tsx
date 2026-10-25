/** Red emergency lamps while the ship is under attack: a slow glow, never a strobe. */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Vec3 } from '../../../../hub/layout';
import { emergencyPulse } from '../cabinLight';
import { useAttack, isEmergency } from '../../../../hub/attack';
import { useReducedMotion } from '../../../../lib/reducedMotion';

export function EmergencyLights() {
  const stage = useAttack((s) => s.stage);
  const reduced = useReducedMotion();
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(({ clock }) => {
    const glowUp = reduced ? 0.5 : 1 - emergencyPulse(clock.elapsedTime);
    lights.current.forEach((l) => l && (l.intensity = 0.3 + 1.6 * glowUp));
  });
  if (!isEmergency(stage)) return null;
  const spots: Vec3[] = [
    [0, 1.9, -0.4],
    [0, 1.9, 1.8],
  ];
  return (
    <>
      {spots.map((p, i) => (
        <pointLight
          key={i}
          ref={(l) => void (lights.current[i] = l)}
          position={p}
          color="#ff2a1a"
          distance={3.5}
        />
      ))}
    </>
  );
}
