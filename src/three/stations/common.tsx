/**
 * Shared pieces for the cockpit stations: click handling (with a hover
 * outline) for 3D objects and the holo-projector emitter (a glowing disc plus a faint light cone).
 */
import { useContext, useMemo, useRef } from 'react';
import { selectionContext } from '@react-three/postprocessing';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useHub } from '../../state/hub';
import { useAttack } from '../../hub/attack';
import { useExperience } from '../../state/experience';
import type { StationId } from '../../hub/layout';
import { HOLO_BLUE } from '../holo/holoMaterial';
import { makeTextSprite } from '../holo/textSprite';

/**
 * Pointer handlers that open a station (or run `onSelect`) when a 3D object
 * is clicked. Ignores clicks that were really the end of a drag-to-look.
 */
export function useClickable(onSelect: () => void) {
  // Hovering a clickable thing outlines it (see Effects: Outline reads this selection).
  const selection = useContext(selectionContext);
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
        if (!selection) return;
        const meshes: THREE.Object3D[] = [];
        e.eventObject.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && o.visible) meshes.push(o);
        });
        selection.select(meshes);
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
        selection?.select([]);
      },
    }),
    [onSelect, selection],
  );
}

export function useStationClick(id: StationId) {
  return useClickable(useMemo(() => () => useHub.getState().open(id), [id]));
}

/** True while this station is the one being looked at. */
export function useIsActive(id: StationId) {
  return useHub((s) => s.station === id);
}

/**
 * Whether an overhead hologram is up: it's the projector's current one, and
 * nothing is borrowing the projector (a holocall with the cat, or the
 * distress call during the attack).
 */
export function useOverheadShown(id: 'experience' | 'leadership') {
  const mine = useHub((s) => s.overhead === id && !(s.call?.kind === 'cat' && s.call.connected));
  const borrowed = useAttack((s) => s.stage === 'incoming' || s.stage === 'alert');
  return mine && !borrowed;
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

/**
 * A clickable holo arrow with a label, for stepping between linked stations
 * (education -> first experience, and back). Points +X by default; `dir`
 * -1 points -X. Only shown (and clickable) when `visible`.
 */
export function HoloArrow({
  label,
  dir = 1,
  visible,
  onSelect,
  ...props
}: {
  label: string;
  dir?: 1 | -1;
  visible: boolean;
  onSelect: () => void;
} & JSX.IntrinsicElements['group']) {
  const click = useClickable(onSelect);
  const sprite = useMemo(() => makeTextSprite(label, { height: 0.016, color: '#ffd9a0' }), [label]);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffb347',
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      }),
    [],
  );
  const cone = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cone.current)
      cone.current.position.x = dir * (0.02 + Math.sin(clock.elapsedTime * 3) * 0.006);
  });
  return (
    <group {...props} visible={visible}>
      {visible && (
        <group {...click}>
          <mesh ref={cone} rotation-z={-dir * (Math.PI / 2)} material={mat}>
            <coneGeometry args={[0.018, 0.04, 3]} />
          </mesh>
          {/* Generous invisible hit area */}
          <mesh visible={false}>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
          </mesh>
          <primitive object={sprite} position={[dir * -0.02, -0.035, 0]} />
        </group>
      )}
    </group>
  );
}
