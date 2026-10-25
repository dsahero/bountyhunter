/** The main computer: the big laid-back screen with the dossier menu. */
import { CONSOLE } from '../../../../hub/layout';
import { ConsoleScreen } from '../../../ui/ConsoleScreen';
import { CabinLight } from '../cabinLight';
import type { Mats } from './materials';

/**
 * The main computer: a big laid-back screen. Its UI is a canvas texture on the
 * screen mesh (ConsoleScreen), so it's welded to the model and never drifts.
 */
export function MainComputer({ mats }: { mats: Mats }) {
  return (
    <>
      <group position={CONSOLE.center} rotation-x={CONSOLE.tilt}>
        <mesh position={[0, 0, -0.26]} material={mats.panel}>
          <boxGeometry args={[1.52, 0.92, 0.4]} />
        </mesh>
        <mesh position={[0, 0, -0.035]} material={mats.frame}>
          <boxGeometry args={[1.42, 0.84, 0.06]} />
        </mesh>
        <mesh position={[0, -0.44, 0]} material={mats.trim}>
          <boxGeometry args={[1.42, 0.03, 0.04]} />
        </mesh>
        <ConsoleScreen />
      </group>
      {/* Skirt under the console; leaves knee room for the pilot */}
      <mesh position={[0, 0.32, -0.92]} material={mats.panel}>
        <boxGeometry args={[1.52, 0.64, 0.1]} />
      </mesh>
      <CabinLight position={[0, 1.05, -0.35]} color="#5fd4ff" intensity={0.9} distance={1.6} />
    </>
  );
}
