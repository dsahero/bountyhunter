/** The red/blue weapon buttons on their plate, and the blaster bolts and torpedoes they fire. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WEAPON_PLATE } from '../../../../hub/layout';
import { lore } from '../../../../content/lore';
import { useWeapons, type Shot } from '../../../../state/weapons';
import { useClickable } from '../../../stations/common';
import { glow, metal, plastic } from './materials';

function BigButton({
  color,
  label,
  onPress,
  x,
}: {
  color: string;
  label: string;
  onPress: () => void;
  x: number;
}) {
  const cap = useRef<THREE.Mesh>(null);
  const pressedAt = useRef(-10);
  const press = useMemo(
    () => () => {
      pressedAt.current = performance.now() / 1000;
      onPress();
    },
    [onPress],
  );
  const click = useClickable(press);
  const m = useMemo(() => ({ guard: metal('#c8a030', 0.3), cap: glow(color) }), [color]);
  useFrame(() => {
    if (!cap.current) return;
    const since = performance.now() / 1000 - pressedAt.current;
    cap.current.position.y = -0.03 + (since < 0.25 ? 0.012 : 0);
  });
  return (
    <group position={[x, 0, 0]} {...click} name={label}>
      <mesh position={[0, -0.012, 0]} material={m.guard}>
        <cylinderGeometry args={[0.06, 0.065, 0.024, 24, 1, true]} />
      </mesh>
      <mesh ref={cap} position={[0, -0.03, 0]} material={m.cap}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 24]} />
      </mesh>
    </group>
  );
}

export function WeaponButtons() {
  const fire = useWeapons((s) => s.fire);
  const blaster = useMemo(() => () => fire('blaster'), [fire]);
  const torpedo = useMemo(() => () => fire('torpedo'), [fire]);
  const plate = useMemo(() => metal('#2b2f35'), []);
  const stripe = useMemo(() => plastic('#d9a020'), []);
  return (
    <group position={WEAPON_PLATE.position} rotation-x={WEAPON_PLATE.tilt}>
      <mesh material={plate}>
        <boxGeometry args={[0.42, 0.03, 0.18]} />
      </mesh>
      <mesh position={[0, -0.016, 0.075]} material={stripe}>
        <boxGeometry args={[0.4, 0.004, 0.02]} />
      </mesh>
      {/* Struts up to the canopy's top arch */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.016, 0.13]} material={plate}>
          <boxGeometry args={[0.02, 0.02, 0.1]} />
        </mesh>
      ))}
      <BigButton x={-0.1} color="#ff3b30" label={lore.console.fireBlaster} onPress={blaster} />
      <BigButton x={0.1} color="#3fa8ff" label={lore.console.fireTorpedo} onPress={torpedo} />
    </group>
  );
}

const BOLT_SPEED = 140;
const TORPEDO_SPEED = 45;

function ShotFx({ shot }: { shot: Shot }) {
  const group = useRef<THREE.Group>(null);
  const flash = useRef<THREE.PointLight>(null);
  const blaster = shot.kind === 'blaster';
  const m = useMemo(
    () => ({ bolt: glow('#ff2a1a'), core: glow('#ffd0c0'), torp: glow('#7fd0ff') }),
    [],
  );
  useFrame(() => {
    const t = (performance.now() - shot.at) / 1000;
    if (group.current) {
      group.current.position.z = -(blaster ? BOLT_SPEED : TORPEDO_SPEED) * t;
      group.current.visible = t < (blaster ? 1.6 : 3.5);
      if (!blaster) group.current.scale.setScalar(1 + Math.sin(t * 30) * 0.15);
    }
    if (flash.current) flash.current.intensity = Math.max(0, 6 - t * 30);
  });
  return (
    <>
      <pointLight
        ref={flash}
        position={[0, 1.0, -1.6]}
        color={blaster ? '#ff4a30' : '#6fc8ff'}
        intensity={6}
        distance={4}
      />
      <group ref={group}>
        {blaster ? (
          [-1.5, 1.5].map((x) => (
            <group key={x} position={[x, 1.0, -2.5]} rotation-x={Math.PI / 2}>
              <mesh material={m.bolt}>
                <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
              </mesh>
              <mesh material={m.core}>
                <cylinderGeometry args={[0.02, 0.02, 2.5, 6]} />
              </mesh>
            </group>
          ))
        ) : (
          <group position={[0, 1.05, -2.6]}>
            <mesh material={m.torp}>
              <sphereGeometry args={[0.16, 16, 12]} />
            </mesh>
            <mesh material={m.core}>
              <sphereGeometry args={[0.08, 12, 10]} />
            </mesh>
          </group>
        )}
      </group>
    </>
  );
}

export function WeaponShots() {
  const shots = useWeapons((s) => s.shots);
  return (
    <>
      {shots.map((s) => (
        <ShotFx key={s.id} shot={s} />
      ))}
    </>
  );
}
