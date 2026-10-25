/** Three throttle levers on the left console. */
import { useMemo } from 'react';
import { metal, plastic } from './materials';

export function Levers() {
  const m = useMemo(
    () => ({ base: metal('#2c3036'), rod: metal('#b8bec6', 0.25), knob: plastic('#c23a2a') }),
    [],
  );
  return (
    <group rotation-y={0.5}>
      <mesh position={[0, 0.02, 0]} material={m.base}>
        <boxGeometry args={[0.2, 0.04, 0.12]} />
      </mesh>
      {[-0.06, 0, 0.06].map((x, i) => (
        <group key={x} position={[x, 0.04, 0]} rotation-x={-0.3 + i * 0.25}>
          <mesh position={[0, 0.07, 0]} material={m.rod}>
            <cylinderGeometry args={[0.006, 0.006, 0.14, 8]} />
          </mesh>
          <mesh position={[0, 0.15, 0]} material={m.knob}>
            <sphereGeometry args={[0.018, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
