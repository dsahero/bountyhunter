/**
 * Experience station: the overhead holo star map, laid out as a timeline.
 *
 * Every charge (internship, research, leadership) is a planet node, ordered
 * by start date from left to right along a gently winding path. Animated
 * lanes flow from each node to the next in chronological order, with an
 * arrowhead showing direction. The selected charge (shared with the panel via
 * `useHub.charge`) is enlarged, ringed, and labeled, and its incoming and
 * outgoing lanes light up amber. Click a node to select that charge.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS } from '../../hub/layout';
import { useHub } from '../../state/hub';
import type { Charge } from '../../content/schema';
import { makeHoloMaterial, useHoloFade, HOLO_BLUE } from '../holo/holoMaterial';
import { makeTextSprite } from '../holo/textSprite';
import { seeded } from '../procedural/textures';
import { Projector, useClickable, useFocusScale, useIsActive } from './common';
import { chronological, timelineLocal, TIMELINE } from '../../hub/timeline';
import { orgLabel } from '../../content/derived';
import type { Tier } from '../../lib/quality';

/** Node positions along the winding path, as vectors (see hub/timeline.ts). */
function layout(n: number): THREE.Vector3[] {
  return Array.from({ length: n }, (_, i) => new THREE.Vector3(...timelineLocal(i, n)));
}

const laneVertex = /* glsl */ `
  attribute float lineDistance;
  varying float vDist;
  void main() {
    vDist = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const laneFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying float vDist;
  void main() {
    // Dashes that flow along the lane, forward in time.
    float dash = step(0.45, fract(vDist * 40.0 - uTime * 1.2));
    gl_FragColor = vec4(uColor, (0.25 + dash * 0.75) * uOpacity);
  }
`;

function Lane({
  from,
  to,
  lit,
  visible,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  lit: boolean;
  visible: number;
}) {
  const { line, arrow, material } = useMemo(() => {
    // A shallow arc between the two nodes.
    const mid = from
      .clone()
      .add(to)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0.035, 0.02));
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const material = new THREE.ShaderMaterial({
      vertexShader: laneVertex,
      fragmentShader: laneFragment,
      uniforms: {
        uColor: { value: new THREE.Color(HOLO_BLUE) },
        uOpacity: { value: 0.4 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
      material,
    );
    line.computeLineDistances();
    // Arrowhead at 65% along the lane, pointing along the tangent.
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.008, 0.022, 10),
      new THREE.MeshBasicMaterial({ color: HOLO_BLUE, transparent: true, toneMapped: false }),
    );
    arrow.position.copy(curve.getPoint(0.65));
    arrow.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      curve.getTangent(0.65).normalize(),
    );
    return { line, arrow, material };
  }, [from, to]);

  const amber = useMemo(() => new THREE.Color('#ffb347'), []);
  const blue = useMemo(() => new THREE.Color(HOLO_BLUE), []);
  useFrame(({ clock }, dt) => {
    const u = material.uniforms;
    u.uTime!.value = clock.elapsedTime;
    u.uOpacity!.value = THREE.MathUtils.damp(u.uOpacity!.value, (lit ? 1 : 0.45) * visible, 5, dt);
    (u.uColor!.value as THREE.Color).lerp(lit ? amber : blue, 1 - Math.exp(-dt * 6));
    const am = arrow.material as THREE.MeshBasicMaterial;
    am.color.copy(u.uColor!.value as THREE.Color);
    am.opacity = u.uOpacity!.value;
  });

  return (
    <>
      <primitive object={line} />
      <primitive object={arrow} />
    </>
  );
}

function Node({
  charge,
  position,
  index,
  selected,
  active,
}: {
  charge: Charge;
  position: THREE.Vector3;
  index: number;
  selected: boolean;
  active: boolean;
}) {
  const material = useMemo(() => makeHoloMaterial(charge.planet.color, 0.5), [charge.planet.color]);
  useHoloFade([material], active ? (selected ? 1.2 : 0.8) : 0.45);
  const year = charge.start.split(' ')[1] ?? '';
  const short = orgLabel(charge);
  const label = useMemo(
    () => makeTextSprite(`${index + 1}. ${short} '${year.slice(2)}`, { height: 0.016 }),
    [short, year, index],
  );
  const detail = useMemo(
    () =>
      makeTextSprite(`${charge.role.toUpperCase()} // ${charge.planet.name.toUpperCase()}`, {
        height: 0.012,
        color: '#ffd59a',
      }),
    [charge.role, charge.planet.name],
  );
  const node = useRef<THREE.Group>(null);
  const click = useClickable(
    useMemo(
      () => () => {
        useHub.getState().selectCharge(charge.id);
      },
      [charge.id],
    ),
  );
  useFrame((_, dt) => {
    const g = node.current;
    if (g) g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, selected ? 1.7 : 1, 6, dt));
    detail.material.opacity = THREE.MathUtils.damp(
      detail.material.opacity,
      selected && active ? 1 : 0,
      6,
      dt,
    );
  });

  return (
    <group position={position}>
      <group ref={node} {...click}>
        <mesh material={material}>
          <sphereGeometry args={[0.018, 20, 14]} />
        </mesh>
        {selected && (
          <mesh rotation-x={Math.PI / 2} material={material}>
            <torusGeometry args={[0.032, 0.0012, 6, 40]} />
          </mesh>
        )}
      </group>
      <primitive object={label} position={[0, -0.042, 0]} />
      <primitive object={detail} position={[0, 0.048, 0]} />
    </group>
  );
}

/** A dim spiral of points behind the timeline, so it still reads as a star map. */
function Backdrop({ count, active }: { count: number; active: boolean }) {
  const { geometry, material } = useMemo(() => {
    const rand = seeded(77);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const arm = i % 3;
      const r = Math.sqrt(rand()) * 0.42;
      const a = arm * ((Math.PI * 2) / 3) + r * 12 + (rand() - 0.5) * 0.6;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.45;
      pos[i * 3 + 2] = -0.06 + (rand() - 0.5) * 0.02;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const material = new THREE.PointsMaterial({
      color: HOLO_BLUE,
      size: 0.003,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [count]);
  useFrame((_, dt) => {
    material.opacity = THREE.MathUtils.damp(material.opacity, active ? 0.35 : 0.15, 4, dt);
  });
  return <points geometry={geometry} material={material} />;
}

export function StarMap({ tier }: { tier: Tier }) {
  const active = useIsActive('experience');
  // Leadership takes over the overhead projector.
  const hidden = useIsActive('leadership');
  const selectedId = useHub((s) => s.charge);
  const grow = useRef<THREE.Group>(null);
  useFocusScale(grow, active, TIMELINE.focusScale);

  const charges = useMemo(() => chronological(), []);
  const points = useMemo(() => layout(charges.length), [charges.length]);
  const selectedIndex = charges.findIndex((c) => c.id === selectedId);

  const [x, y, z] = ANCHORS.experience;
  return (
    <group visible={!hidden}>
      {/* Emitter in the ceiling, beaming down onto the map */}
      <Projector position={[x, 2.05, z + 0.05]} height={0.34} radius={0.24} active={active} flip />
      {/* Tilted to face the pilot's seat */}
      <group position={[x, y, z]} rotation-x={TIMELINE.tilt}>
        <group ref={grow}>
          <Backdrop count={tier === 'high' ? 2200 : 900} active={active} />
          {points.slice(1).map((to, i) => (
            <Lane
              key={i}
              from={points[i]!}
              to={to}
              lit={i === selectedIndex || i + 1 === selectedIndex}
              visible={active ? 1 : 0.6}
            />
          ))}
          {charges.map((c, i) => (
            <Node
              key={c.id}
              charge={c}
              position={points[i]!}
              index={i}
              selected={c.id === selectedId}
              active={active}
            />
          ))}
        </group>
      </group>
    </group>
  );
}
