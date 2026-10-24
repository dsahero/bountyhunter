/**
 * The hunter's ship: a sleek, mirror-symmetric interceptor built from
 * primitives. Inspired by classic chrome starfighters (long needle nose,
 * bubble canopy, wingtip engines with tail spikes) without copying any one
 * design. Polished silver with maroon and burnt-orange trim (a quiet Virginia
 * Tech nod). Nose points to -Z.
 *
 * Symmetry by construction: one wing/engine assembly is built once and
 * rendered twice, the second mirrored with scale-x = -1.
 *
 * The opening shot sees the ship from below, so the belly gets detail. A
 * louvered maintenance vent on the dorsal spine is how the camera gets in.
 */
import { forwardRef, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { hullTexture, softDotTexture } from '../../procedural/textures';
import { Louvers } from '../../procedural/Louvers';

/** The spine vent the camera dives into (ship-local). */
export const VENT = { position: [0, 0.86, 1.0] as [number, number, number], size: 0.5 };

/** Fuselage profile (radius, z) from nose tip to tail; revolved into a smooth body. */
const PROFILE: [number, number][] = [
  [0.0, -7.2],
  [0.12, -6.4],
  [0.32, -5.2],
  [0.6, -3.6],
  [0.85, -2.0],
  [0.98, -0.4],
  [0.95, 1.4],
  [0.75, 3.0],
  [0.45, 4.1],
  [0.0, 4.5],
];

function useMaterials() {
  return useMemo(() => {
    const map = hullTexture();
    // Double-sided: the mirrored wing (scale-x = -1) has reversed face winding.
    const side = THREE.DoubleSide;
    return {
      hull: new THREE.MeshStandardMaterial({
        map,
        color: '#dfe3e8',
        metalness: 0.6,
        roughness: 0.32,
        side,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: '#2b2e33',
        metalness: 0.6,
        roughness: 0.45,
        side,
      }),
      maroon: new THREE.MeshStandardMaterial({
        color: '#6e1f2c',
        metalness: 0.4,
        roughness: 0.5,
        side,
      }),
      orange: new THREE.MeshStandardMaterial({
        color: '#c6602a',
        metalness: 0.4,
        roughness: 0.5,
        side,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#0b0d10',
        emissive: '#ff9a40',
        emissiveIntensity: 0.18,
        metalness: 0.95,
        roughness: 0.08,
      }),
      void: new THREE.MeshBasicMaterial({ color: '#000000' }),
    };
  }, []);
}

type Mats = ReturnType<typeof useMaterials>;

function Blinker({
  position,
  color,
  offset = 0,
}: {
  position: [number, number, number];
  color: string;
  offset?: number;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.opacity = ((clock.elapsedTime + offset) % 1.2) / 1.2 < 0.15 ? 1 : 0.15;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.07, 10, 8]} />
      <meshBasicMaterial ref={mat} color={color} transparent toneMapped={false} />
    </mesh>
  );
}

/** Swept wing + wingtip engine + tail spike: the starboard side (+X). */
function WingAssembly({ mats, mirrored }: { mats: Mats; mirrored?: boolean }) {
  const wing = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.6, -0.6); // root leading edge
    shape.lineTo(2.9, 0.9); // tip leading edge (swept back)
    shape.lineTo(2.9, 2.0); // tip trailing edge
    shape.lineTo(0.6, 2.6); // root trailing edge
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 2,
    });
    g.rotateX(Math.PI / 2); // shape Y -> world Z
    g.translate(0, 0.06, 0);
    return g;
  }, []);
  const glow = useMemo(() => softDotTexture(), []);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (core.current) core.current.opacity = 0.85 + Math.sin(clock.elapsedTime * 30) * 0.08;
  });

  return (
    <group scale-x={mirrored ? -1 : 1}>
      <mesh geometry={wing} material={mats.hull} />
      {/* Orange stripe near the wingtip */}
      <mesh position={[2.55, 0.0, 1.45]} rotation-x={Math.PI / 2} material={mats.orange}>
        <planeGeometry args={[0.18, 1.1]} />
      </mesh>
      {/* Engine nacelle */}
      <group position={[3.0, 0, 1.5]}>
        <mesh rotation-x={Math.PI / 2} material={mats.hull}>
          <cylinderGeometry args={[0.36, 0.42, 3.4, 24]} />
        </mesh>
        <mesh position={[0, 0, -1.75]} rotation-x={Math.PI / 2} material={mats.maroon}>
          <torusGeometry args={[0.36, 0.06, 8, 24]} />
        </mesh>
        <mesh position={[0, 0, -1.72]} rotation-x={-Math.PI / 2} material={mats.dark}>
          <circleGeometry args={[0.32, 24]} />
        </mesh>
        <mesh position={[0, 0, 1.75]} rotation-x={Math.PI / 2} material={mats.dark}>
          <cylinderGeometry args={[0.34, 0.42, 0.2, 24, 1, true]} />
        </mesh>
        <mesh position={[0, 0, 1.8]}>
          <circleGeometry args={[0.3, 24]} />
          <meshBasicMaterial ref={core} color="#9fe6ff" transparent toneMapped={false} />
        </mesh>
        <sprite position={[0, 0, 2.2]} scale={[1.6, 1.6, 1]}>
          <spriteMaterial
            map={glow}
            color="#4fc3ff"
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
        <pointLight position={[0, 0, 2.4]} color="#5fc8ff" intensity={4} distance={5} />
        {/* Long tail spike */}
        <mesh position={[0, 0, 3.6]} rotation-x={Math.PI / 2} material={mats.hull}>
          <coneGeometry args={[0.09, 3.6, 12]} />
        </mesh>
        <Blinker
          position={[0.45, 0, -0.6]}
          color={mirrored ? '#ff3b30' : '#39ff88'}
          offset={mirrored ? 0.6 : 0}
        />
      </group>
      {/* Belly detail under this side: intake and gear door */}
      <mesh position={[0.55, -0.62, -0.8]} material={mats.dark}>
        <boxGeometry args={[0.32, 0.18, 1.2]} />
      </mesh>
      <mesh position={[0.5, -0.82, 1.4]} material={mats.maroon}>
        <boxGeometry args={[0.36, 0.03, 0.8]} />
      </mesh>
    </group>
  );
}

export const Ship = forwardRef<
  THREE.Group,
  JSX.IntrinsicElements['group'] & { ventOpen: MutableRefObject<number> }
>(function Ship({ ventOpen, ...props }, ref) {
  const mats = useMaterials();
  const bob = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!bob.current) return;
    bob.current.position.y = Math.sin(t * 0.9) * 0.07;
    bob.current.rotation.z = Math.sin(t * 0.6) * 0.025;
    bob.current.rotation.x = Math.sin(t * 0.75 + 1) * 0.012;
  });
  const body = useMemo(() => {
    const g = new THREE.LatheGeometry(
      PROFILE.map(([r, z]) => new THREE.Vector2(r, z)),
      40,
    );
    g.rotateX(Math.PI / 2); // lathe axis Y -> Z
    return g;
  }, []);

  return (
    <group ref={ref} {...props}>
      {/* Inner group bobs gently; the outer group is the flight frame the camera follows. */}
      <group ref={bob}>
        {/* Fuselage: slightly flattened so it reads as a fighter, not a tube */}
        <mesh geometry={body} scale={[1, 0.82, 1]} material={mats.hull} />
        {/* Trim bands */}
        <mesh
          position={[0, 0, -3.6]}
          rotation-x={Math.PI / 2}
          scale={[1, 1, 0.82]}
          material={mats.orange}
        >
          <cylinderGeometry args={[0.605, 0.605, 0.14, 40, 1, true]} />
        </mesh>
        <mesh
          position={[0, 0, 0.3]}
          rotation-x={Math.PI / 2}
          scale={[1, 1, 0.82]}
          material={mats.maroon}
        >
          <cylinderGeometry args={[0.985, 0.985, 0.3, 40, 1, true]} />
        </mesh>

        {/* Bubble canopy */}
        <mesh position={[0, 0.5, -1.9]} scale={[0.62, 0.42, 1.25]} material={mats.glass}>
          <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh
          position={[0, 0.5, -1.9]}
          rotation-x={-Math.PI / 2}
          scale={[0.64, 1.27, 1]}
          material={mats.dark}
        >
          <ringGeometry args={[0.95, 1.0, 32]} />
        </mesh>

        {/* Dorsal spine with the maintenance vent */}
        <RoundedBox
          args={[0.8, 0.28, 3.2]}
          radius={0.1}
          position={[0, 0.72, 1.2]}
          material={mats.hull}
        />
        <group position={VENT.position}>
          <mesh position={[0, 0.006, 0]} rotation-x={-Math.PI / 2} material={mats.void}>
            <planeGeometry args={[VENT.size, VENT.size]} />
          </mesh>
          <Louvers size={VENT.size} open={ventOpen} material={mats.dark} position={[0, 0.03, 0]} />
        </group>
        <Blinker position={[0, 0.9, 2.7]} color="#ffb020" offset={0.3} />

        {/* Wings + engines, mirrored */}
        <WingAssembly mats={mats} />
        <WingAssembly mats={mats} mirrored />

        {/* Belly: keel, panel strips, landing lights */}
        <mesh position={[0, -0.78, 0.2]} material={mats.dark}>
          <boxGeometry args={[0.28, 0.12, 4.6]} />
        </mesh>
        {[-1.8, -0.6, 0.6, 1.8].map((z) => (
          <mesh key={z} position={[0, -0.8, z]} material={mats.maroon}>
            <boxGeometry args={[1.2, 0.02, 0.06]} />
          </mesh>
        ))}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, -0.76, -2.6]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
});
