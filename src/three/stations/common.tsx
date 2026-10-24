/**
 * Shared pieces for the cockpit stations: click handling for 3D objects
 * and the holo-projector emitter (a glowing disc plus a faint light cone).
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useHub } from '../../state/hub';
import { useExperience } from '../../state/experience';
import type { StationId } from '../../hub/layout';
import { HOLO_BLUE } from '../holo/holoMaterial';

/**
 * Pointer handlers that open a station (or run `onSelect`) when a 3D object
 * is clicked. Ignores clicks that were really the end of a drag-to-look.
 */
export function useClickable(onSelect: () => void) {
  return useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6 || useExperience.getState().phase !== 'hub') return;
        e.stopPropagation();
        onSelect();
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
      },
    }),
    [onSelect],
  );
}

export function useStationClick(id: StationId) {
  return useClickable(useMemo(() => () => useHub.getState().open(id), [id]));
}

/** True while this station is the one being looked at. */
export function useIsActive(id: StationId) {
  return useHub((s) => s.station === id);
}

const beamVertex = /* glsl */ `
  varying float vY;
  void main() {
    vY = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vY;
  void main() {
    gl_FragColor = vec4(uColor, (1.0 - vY) * 0.22 * uOpacity);
  }
`;

/**
 * A holo-projector: an emitter disc and a light cone pointing up (or down
 * with `flip`) toward the hologram. Brightens when `active`.
 */
export function Projector({
  height,
  radius,
  active,
  flip = false,
  color = HOLO_BLUE,
  ...props
}: {
  height: number;
  radius: number;
  active: boolean;
  flip?: boolean;
  color?: string;
} & JSX.IntrinsicElements['group']) {
  const beam = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.3 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [color],
  );
  const disc = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    const u = beam.uniforms.uOpacity!;
    u.value = THREE.MathUtils.damp(u.value, active ? 1 : 0.3, 5, dt);
    if (disc.current) disc.current.opacity = 0.4 + u.value * 0.6;
  });

  return (
    <group {...props} rotation-x={flip ? Math.PI : 0}>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.01, 24]} />
        <meshStandardMaterial color="#22272d" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.03, 24]} />
        <meshBasicMaterial ref={disc} color={color} transparent toneMapped={false} />
      </mesh>
      {/* Cone: narrow at the emitter, widening up to the hologram. uv.y = 0 at the base. */}
      <mesh position={[0, height / 2 + 0.01, 0]} material={beam}>
        <cylinderGeometry args={[radius, 0.025, height, 32, 1, true]} />
      </mesh>
    </group>
  );
}

/** Eases a group's scale up while its station is open, so the focused hologram fills the view. */
export function useFocusScale(
  ref: React.RefObject<THREE.Object3D>,
  active: boolean,
  factor: number,
) {
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, active ? factor : 1, 3, dt));
  });
}
