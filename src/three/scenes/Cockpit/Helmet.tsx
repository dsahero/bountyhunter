/**
 * The hunter's helmet, in the animated-series Mandalorian style (fan homage
 * built from primitives): a rounded steel dome, a dark T-shaped visor, cheek
 * plates, small ear caps, and a thin maroon crest stripe.
 * Origin is the center of the wearer's head; the visor faces -Z.
 */
import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

export const Helmet = forwardRef<THREE.Group, JSX.IntrinsicElements['group']>(
  function Helmet(props, ref) {
    const m = useMemo(
      () => ({
        shell: new THREE.MeshStandardMaterial({
          color: '#a7aeb5',
          metalness: 0.7,
          roughness: 0.32,
        }),
        dark: new THREE.MeshStandardMaterial({ color: '#2b2e33', metalness: 0.5, roughness: 0.5 }),
        visor: new THREE.MeshStandardMaterial({
          color: '#050506',
          metalness: 0.9,
          roughness: 0.12,
          side: THREE.DoubleSide,
        }),
        stripe: new THREE.MeshStandardMaterial({
          color: '#6e1f2c',
          metalness: 0.4,
          roughness: 0.5,
        }),
      }),
      [],
    );

    return (
      <group ref={ref} {...props}>
        {/* Dome */}
        <mesh position={[0, 0.02, 0]} scale={[1, 1.08, 1.05]} material={m.shell}>
          <sphereGeometry args={[0.15, 32, 24]} />
        </mesh>
        {/* Lower face and jaw */}
        <mesh position={[0, -0.075, -0.01]} scale={[1, 1, 1.05]} material={m.shell}>
          <cylinderGeometry args={[0.15, 0.13, 0.11, 32]} />
        </mesh>
        {/* T-visor: a curved horizontal band plus a vertical slot, both following the dome */}
        <mesh position={[0, 0.015, 0]} rotation-y={Math.PI} material={m.visor}>
          <cylinderGeometry args={[0.159, 0.159, 0.034, 32, 1, true, -0.62, 1.24]} />
        </mesh>
        <mesh position={[0, -0.055, 0]} rotation-y={Math.PI} material={m.visor}>
          <cylinderGeometry args={[0.152, 0.14, 0.1, 24, 1, true, -0.12, 0.24]} />
        </mesh>
        {/* Cheek plates */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0.11 * s, -0.07, -0.09]}
            rotation-y={0.55 * s}
            material={m.shell}
          >
            <boxGeometry args={[0.06, 0.08, 0.012]} />
          </mesh>
        ))}
        {/* Ear caps */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0.155 * s, -0.01, 0.01]}
            rotation-z={Math.PI / 2}
            material={m.dark}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.02, 20]} />
          </mesh>
        ))}
        {/* Crest stripe */}
        <mesh position={[0, 0.17, 0.0]} rotation-x={0.1} material={m.stripe}>
          <boxGeometry args={[0.025, 0.012, 0.24]} />
        </mesh>
        {/* Neck seal */}
        <mesh position={[0, -0.15, 0.02]} material={m.dark}>
          <cylinderGeometry args={[0.085, 0.1, 0.05, 20]} />
        </mesh>
      </group>
    );
  },
);
