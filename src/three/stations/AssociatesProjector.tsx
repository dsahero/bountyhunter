/**
 * Skills station: a holo-projector on the right console with a ring of
 * "known associates" (skills as characters) from the selected unit. The ring
 * turns so the selected associate faces the pilot, enlarged and labeled.
 * Click any bust to select it.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS, EYE, SIDE_TOP } from '../../hub/layout';
import { portfolio } from '../../content/portfolio';
import { useHub } from '../../state/hub';
import type { Associate } from '../../content/schema';
import { makeHoloMaterial, useHoloFade, HOLO_BLUE } from '../holo/holoMaterial';
import { makeTextSprite } from '../holo/textSprite';
import { Bust } from './Bust';
import { StaticBatch } from '../perf/StaticBatch';
import { useInView } from '../perf/ViewCull';
import { Projector, useClickable, useFocusScale, useIsActive } from './common';

const RING_RADIUS = 0.16;

function AssociateBust({
  associate,
  angle,
  selected,
  active,
}: {
  associate: Associate;
  angle: number;
  selected: boolean;
  active: boolean;
}) {
  const material = useMemo(() => makeHoloMaterial(HOLO_BLUE, 0.3), []);
  useHoloFade([material], active ? (selected ? 1.1 : 0.45) : selected ? 0.5 : 0.25);
  const group = useRef<THREE.Group>(null);
  const inView = useInView();
  const click = useClickable(
    useMemo(
      () => () => {
        useHub.getState().set({ associate: associate.skill });
        useHub.getState().open('skills');
      },
      [associate.skill],
    ),
  );
  useFrame((_, dt) => {
    if (!inView.current) return; // off screen: nothing to animate
    const g = group.current;
    if (!g) return;
    const s = THREE.MathUtils.damp(g.scale.x, selected ? 0.13 : 0.08, 6, dt);
    g.scale.setScalar(s);
  });

  return (
    <group
      position={[Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS]}
      rotation-y={angle}
    >
      <group ref={group} scale={0.08} {...click}>
        <StaticBatch>
          <Bust archetype={associate.archetype} material={material} />
        </StaticBatch>
        {/* Generous invisible hit area */}
        <mesh visible={false} position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1.2, 1]} />
        </mesh>
      </group>
    </group>
  );
}

export function AssociatesProjector() {
  const active = useIsActive('skills');
  const unit = useHub((s) => s.unit);
  const selectedSkill = useHub((s) => s.associate);
  const ring = useRef<THREE.Group>(null);
  const grow = useRef<THREE.Group>(null);
  useFocusScale(grow, active, 2.2);
  const [x, y, z] = ANCHORS.skills;

  const members = useMemo(() => portfolio.associates.filter((a) => a.unit === unit), [unit]);
  const selectedIndex = Math.max(
    0,
    members.findIndex((a) => a.skill === selectedSkill),
  );
  const selected = members[selectedIndex];
  const label = useMemo(
    () => (selected ? makeTextSprite(selected.callsign.toUpperCase(), { height: 0.024 }) : null),
    [selected],
  );

  // Angle (around Y) from the ring's center toward the pilot's eye.
  const towardPilot = Math.atan2(EYE[0] - x, EYE[2] - z);
  const step = (Math.PI * 2) / Math.max(members.length, 1);

  useFrame((_, dt) => {
    const r = ring.current;
    if (!r) return;
    // Rotate so the selected bust's slot (selectedIndex * step) points at the pilot.
    let target = towardPilot - selectedIndex * step;
    // Take the short way around.
    target =
      r.rotation.y + Math.atan2(Math.sin(target - r.rotation.y), Math.cos(target - r.rotation.y));
    r.rotation.y = THREE.MathUtils.damp(r.rotation.y, target, 4, dt);
  });

  return (
    <group>
      <Projector
        position={[x, SIDE_TOP, z]}
        height={y - SIDE_TOP - 0.06}
        radius={0.2}
        active={active}
      />
      <group position={[x, y - 0.07, z]}>
        <group ref={grow}>
          <group ref={ring}>
            {members.map((a, i) => (
              <AssociateBust
                key={a.skill}
                associate={a}
                angle={i * step}
                selected={i === selectedIndex}
                active={active}
              />
            ))}
          </group>
          {label && <primitive object={label} position={[0, 0.2, 0]} />}
        </group>
      </group>
    </group>
  );
}
