/** A row of flip switches with status LEDs on the right console. */
import { useMemo } from 'react';
import { glow, metal } from './materials';

export function FlipSwitches() {
  const m = useMemo(
    () => ({ plate: metal('#3a3f46'), toggle: metal('#d0d4da', 0.2), led: glow('#7dff9a') }),
    [],
  );
  return (
    <group rotation-y={-0.5}>
      <mesh position={[0, 0.006, 0]} material={m.plate}>
        <boxGeometry args={[0.26, 0.012, 0.09]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[-0.105 + i * 0.042, 0.012, 0]}>
          <mesh position={[0, 0.018, 0]} rotation-x={i % 3 ? 0.4 : -0.4} material={m.toggle}>
            <cylinderGeometry args={[0.004, 0.004, 0.04, 6]} />
          </mesh>
          <mesh position={[0, 0.002, -0.03]} material={m.led}>
            <boxGeometry args={[0.008, 0.004, 0.008]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
