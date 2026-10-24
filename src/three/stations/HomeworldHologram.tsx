/**
 * Education station: on the left console, a projector shows the homeworld
 * (the university) as a spinning hologram, with its moons (key courses)
 * orbiting. Moon names appear while the station is open, and the whole
 * hologram grows to fill the view.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS, SIDE_TOP } from '../../hub/layout';
import { portfolio } from '../../content/portfolio';
import { makeHoloMaterial, useHoloFade, HOLO_BLUE } from '../holo/holoMaterial';
import { makeTextSprite } from '../holo/textSprite';
import { HoloArrow, Projector, useFocusScale, useIsActive, useStationClick } from './common';
import { chronological } from '../../hub/timeline';
import { orgLabel } from '../../content/derived';
import { useHub } from '../../state/hub';

const PLANET_R = 0.06;

export function HomeworldHologram() {
  const active = useIsActive('education');
  const click = useStationClick('education');
  const { planet, courses } = portfolio.education;
  const grow = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  useFocusScale(grow, active, 1.8);

  const mats = useMemo(
    () => [makeHoloMaterial(planet.color, 0.45), makeHoloMaterial(HOLO_BLUE, 0.45)],
    [planet.color],
  );
  useHoloFade(mats, active ? 1 : 0.45);
  const [planetMat, moonMat] = mats as [THREE.ShaderMaterial, THREE.ShaderMaterial];
  const title = useMemo(
    () => makeTextSprite(planet.name.toUpperCase(), { height: 0.02 }),
    [planet.name],
  );
  const moonLabels = useMemo(
    () => courses.map((c) => makeTextSprite(c.moonName, { height: 0.011 })),
    [courses],
  );

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.35;
    if (orbit.current) orbit.current.rotation.y += dt * 0.25;
    for (const l of moonLabels)
      l.material.opacity = THREE.MathUtils.damp(l.material.opacity, active ? 1 : 0, 4, dt);
  });

  const first = chronological()[0];
  const toExperience = useMemo(
    () => () => first && useHub.getState().selectCharge(first.id),
    [first],
  );

  const [x, y, z] = ANCHORS.education;
  return (
    <group>
      <Projector
        position={[x, SIDE_TOP, z]}
        height={y - SIDE_TOP - 0.08}
        radius={0.1}
        active={active}
      />
      {first && (
        <HoloArrow
          label={`${orgLabel(first)} ▸`}
          visible={active}
          onSelect={toExperience}
          position={[x + 0.07, y - 0.13, z + 0.12]}
          rotation-y={Math.atan2(-x, 0.28 - z)}
        />
      )}
      <group position={[x, y, z]} {...click}>
        <group ref={grow}>
          <group ref={spin}>
            <mesh material={planetMat}>
              <sphereGeometry args={[PLANET_R, 32, 24]} />
            </mesh>
            {[-0.035, 0, 0.035].map((ly) => (
              <mesh key={ly} position={[0, ly, 0]} rotation-x={Math.PI / 2} material={planetMat}>
                <torusGeometry args={[Math.sqrt(PLANET_R ** 2 - ly ** 2), 0.001, 4, 40]} />
              </mesh>
            ))}
          </group>
          {/* Course moons on tilted orbits */}
          <group ref={orbit} rotation-x={0.3}>
            {courses.map((c, i) => {
              const a = (i / courses.length) * Math.PI * 2;
              const r = PLANET_R * 1.9 + (i % 2) * 0.018;
              return (
                <group key={c.code} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
                  <mesh material={moonMat}>
                    <sphereGeometry args={[0.009, 12, 10]} />
                  </mesh>
                  <primitive object={moonLabels[i]!} position={[0, 0.018, 0]} />
                </group>
              );
            })}
            <mesh rotation-x={Math.PI / 2} material={moonMat}>
              <torusGeometry args={[PLANET_R * 1.9, 0.0008, 4, 64]} />
            </mesh>
          </group>
          <primitive object={title} position={[0, PLANET_R + 0.05, 0]} />
        </group>
      </group>
    </group>
  );
}
