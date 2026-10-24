/**
 * The target's hologram figure.
 *
 * If `identity.scanModel` points at a .glb (e.g. a 3D scan of your head), it's
 * loaded and "hologramified": every mesh gets the jittery blue hologram
 * material. Until then, a detailed procedural head-and-shoulders stands in.
 * Units: ~1 tall with the shoulders at y = 0, facing +Z.
 */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { portfolio } from '../../content/portfolio';
import type { HoloMaterial } from '../holo/holoMaterial';

function Scan({ url, material }: { url: string; material: HoloMaterial }) {
  const { scene } = useGLTF(url);
  const holo = useMemo(() => {
    const copy = scene.clone(true);
    // Fit the scan into the same ~1-unit box as the procedural bust.
    const box = new THREE.Box3().setFromObject(copy);
    const size = box.getSize(new THREE.Vector3());
    const scale = 1 / Math.max(size.y, 1e-6);
    copy.scale.setScalar(scale);
    copy.position.set(
      -((box.min.x + box.max.x) / 2) * scale,
      -box.min.y * scale,
      -((box.min.z + box.max.z) / 2) * scale,
    );
    copy.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material;
    });
    return copy;
  }, [scene, material]);
  return <primitive object={holo} />;
}

/** Procedural stand-in: shoulders, neck, a slightly round face with a smile, and long hair. */
function ProceduralBust({ material }: { material: HoloMaterial }) {
  return (
    <>
      <mesh position={[0, 0.05, 0]} scale={[1.2, 0.42, 0.6]} material={material}>
        <sphereGeometry args={[0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={material}>
        <cylinderGeometry args={[0.11, 0.14, 0.2, 16]} />
      </mesh>
      <group position={[0, 0.66, 0]}>
        {/* A slightly round face, with soft cheeks */}
        <mesh scale={[0.94, 1.04, 0.95]} material={material}>
          <sphereGeometry args={[0.3, 32, 24]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.14 * s, -0.08, 0.2]} scale={[1, 0.8, 0.6]} material={material}>
            <sphereGeometry args={[0.08, 14, 10]} />
          </mesh>
        ))}
        {/* Hair: a cap on top, long hair down the back past the shoulders, and locks framing the face */}
        <mesh position={[0, 0.06, -0.02]} scale={[0.97, 1.04, 1]} material={material}>
          <sphereGeometry args={[0.31, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        </mesh>
        <mesh
          position={[0, -0.24, -0.13]}
          rotation-x={0.12}
          scale={[1, 1, 0.5]}
          material={material}
        >
          <capsuleGeometry args={[0.27, 0.42, 6, 18]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0.26 * s, -0.2, 0.04]}
            rotation-z={0.1 * s}
            scale={[0.7, 1, 1]}
            material={material}
          >
            <capsuleGeometry args={[0.07, 0.36, 4, 12]} />
          </mesh>
        ))}
        {/* Eyes, brows, nose, mouth, ears (face toward +Z) */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0.1 * s, 0.04, 0.26]} scale={[1.3, 0.8, 0.6]} material={material}>
              <sphereGeometry args={[0.035, 12, 8]} />
            </mesh>
            <mesh position={[0.1 * s, 0.1, 0.27]} rotation-z={0.12 * s} material={material}>
              <boxGeometry args={[0.09, 0.015, 0.02]} />
            </mesh>
            <mesh position={[0.27 * s, 0.0, 0]} scale={[0.4, 1, 0.7]} material={material}>
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.03, 0.3]} rotation-x={Math.PI / 2 + 0.3} material={material}>
          <coneGeometry args={[0.035, 0.1, 10]} />
        </mesh>
        {/* A smile: the lower half of a ring, curving up at the corners */}
        <mesh position={[0, -0.12, 0.262]} rotation={[-0.25, 0, Math.PI]} material={material}>
          <torusGeometry args={[0.07, 0.013, 8, 20, Math.PI]} />
        </mesh>
      </group>
    </>
  );
}

export function TargetBust({ material }: { material: HoloMaterial }) {
  const url = portfolio.identity.scanModel;
  return url ? (
    <Suspense fallback={<ProceduralBust material={material} />}>
      <Scan url={url} material={material} />
    </Suspense>
  ) : (
    <ProceduralBust material={material} />
  );
}
