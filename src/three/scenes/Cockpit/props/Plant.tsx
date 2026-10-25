/** A small potted succulent from the homeworld. */
import { useMemo } from 'react';
import { plastic } from './materials';

export function Plant() {
  const m = useMemo(() => ({ pot: plastic('#8a4a2c', 0.8), leaf: plastic('#4f8a3a', 0.7) }), []);
  return (
    <group>
      <mesh position={[0, 0.04, 0]} material={m.pot}>
        <cylinderGeometry args={[0.045, 0.035, 0.08, 14]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.02, 0.12, Math.sin(a) * 0.02]}
            rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}
            scale={[1, 2.6, 0.3]}
            material={m.leaf}
          >
            <sphereGeometry args={[0.02, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}
