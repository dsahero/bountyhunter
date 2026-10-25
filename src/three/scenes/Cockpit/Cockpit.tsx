/**
 * The cockpit interior, built from primitives (the pieces are in ./parts and
 * ./props).
 *
 * Layout (see hub/layout.ts): the pilot sits at the origin facing -Z.
 *   Forward   the main computer: big, laid back, with the dossier menu on it,
 *             and the target's hologram projected above it
 *   Overhead  the holo projector (star map / leadership / calls)
 *   Left      homeworld (education) hologram, warrant screen, intel datapad
 *   Right     associates projector, comms screen, helmet shelf
 *   Behind    doorway to the cargo hold, with propaganda posters and a door
 *   Ceiling   maintenance duct + grate (the intro camera enters here)
 */
import { RoundedBox } from '@react-three/drei';
import { HoloCat } from '../../stations/HoloCat';
import { useHub } from '../../../state/hub';
import { CabinLight } from './cabinLight';
import {
  DistressHologram,
  EmergencyLights,
  Guitar,
  Tchotchkes,
  WeaponButtons,
  WeaponShots,
} from './Props';
import { ButtonPanel } from './ButtonPanel';
import { Duct } from './Duct';
import { Droid } from './Droid';
import { WantedHologram } from '../../stations/WantedHologram';
import { StarMap } from '../../stations/StarMap';
import { LeadershipHologram } from '../../stations/LeadershipHologram';
import { HomeworldHologram } from '../../stations/HomeworldHologram';
import { AssociatesProjector } from '../../stations/AssociatesProjector';
import { PropagandaWall } from '../../stations/PropagandaWall';
import type { Tier } from '../../../lib/quality';
import { useCockpitMaterials } from './parts/materials';
import { CabinAmbient, RoomEnv } from './parts/environment';
import { ShelfHelmet } from './parts/ShelfHelmet';
import { CanopyFrame, Roof } from './parts/structure';
import { MainComputer } from './parts/MainComputer';
import { SideConsoles } from './parts/SideConsoles';
import { CargoHold } from './parts/CargoHold';
import { StaticBatch } from '../../perf/StaticBatch';
import { ViewCull } from '../../perf/ViewCull';

export function Cockpit({ tier, showHelmet }: { tier: Tier; showHelmet: boolean }) {
  const mats = useCockpitMaterials();
  const catCall = useHub((s) => s.call?.kind === 'cat' && s.call.connected);
  const holosOff = useHub((s) => s.holosOff);

  return (
    <group>
      {/* ---------- Lighting ---------- */}
      <RoomEnv intensity={0.35} />
      <CabinAmbient intensity={0.35} />
      <CabinLight position={[0, 0.45, -0.3]} color="#ffa040" intensity={2.2} distance={2.4} />
      <CabinLight position={[0, 1.75, 1.8]} color="#ffb060" intensity={5} distance={4.5} />
      <CabinLight position={[-1.0, 1.4, -0.4]} color="#ff7a55" intensity={0.8} distance={1.4} />
      <CabinLight position={[1.0, 1.4, -0.4]} color="#5fd4ff" intensity={0.8} distance={1.4} />
      {/* The cargo hold's light, over the poster wall */}
      <CabinLight position={[0, 1.9, 2.2]} color="#ffb060" intensity={5} distance={3.5} />
      <EmergencyLights />

      {/* ---------- Static structure ----------
          Shell, canopy, roof, consoles, seat, bulkhead, and cargo hold never
          move: they're merged into a few meshes (see perf/StaticBatch).
          Anything clickable inside keeps its own mesh. */}
      <StaticBatch>
        {/* ---------- Shell ---------- */}
        <mesh position={[0, -0.025, 0.2]} material={mats.floor}>
          <boxGeometry args={[2.8, 0.05, 3.2]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[1.36 * side, 0.45, -0.1]} material={mats.panel}>
            <boxGeometry args={[0.08, 0.9, 2.2]} />
          </mesh>
        ))}
        <Roof mat={mats.panel} />
        <CanopyFrame mat={mats.frame} />

        {/* ---------- Forward ---------- */}
        <MainComputer mats={mats} />

        {/* ---------- Overhead switch panel (keys face down toward the pilot) ---------- */}
        <group position={[0, 1.97, -0.2]} rotation-x={-0.3}>
          <mesh material={mats.panel}>
            <boxGeometry args={[1.1, 0.06, 0.62]} />
          </mesh>
          <ButtonPanel
            position={[0, -0.034, 0]}
            rotation-x={Math.PI}
            width={1.0}
            depth={0.55}
            cols={28}
            rows={12}
            seed={21}
          />
        </group>

        <SideConsoles mats={mats} />
        {/* ---------- Pilot seat (low back: the pilot can see over it) ---------- */}
        <group position={[0, 0, 0.35]}>
          <mesh position={[0, 0.22, 0]} material={mats.frame}>
            <cylinderGeometry args={[0.08, 0.14, 0.44, 10]} />
          </mesh>
          <RoundedBox
            args={[0.6, 0.12, 0.58]}
            radius={0.04}
            position={[0, 0.46, 0]}
            material={mats.seat}
          />
          <RoundedBox
            args={[0.58, 0.55, 0.1]}
            radius={0.04}
            position={[0, 0.76, 0.3]}
            rotation-x={-0.12}
            material={mats.seat}
          />
        </group>

        {/* ---------- Rear bulkhead, doorway, corridor to the cargo hold ---------- */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[1.0 * side, 1.05, 1.0]} material={mats.panel}>
            <boxGeometry args={[0.9, 2.1, 0.08]} />
          </mesh>
        ))}
        <mesh position={[0, 1.95, 1.0]} material={mats.panel}>
          <boxGeometry args={[1.1, 0.3, 0.08]} />
        </mesh>
        <CargoHold mats={mats} />
      </StaticBatch>
      <Duct material={mats.frame} />

      <WeaponButtons />
      <WeaponShots />

      <Tchotchkes />

      {/* ---------- Stations ---------- */}
      {/* Holo off powers every hologram down until you turn them back on (or open one) */}
      {!holosOff && (
        <>
          {/* Regions you aren't looking at are skipped (see perf/ViewCull) */}
          <ViewCull>
            <WantedHologram />
          </ViewCull>
          <StarMap tier={tier} />
          <LeadershipHologram />
          {catCall && <HoloCat />}
          <ViewCull>
            <HomeworldHologram />
          </ViewCull>
          <ViewCull>
            <AssociatesProjector />
          </ViewCull>
        </>
      )}
      <DistressHologram />
      <Guitar />
      <ViewCull margin={1.1}>
        <PropagandaWall />
      </ViewCull>

      {/* ---------- Ambient life ---------- */}
      <Droid />

      {showHelmet && <ShelfHelmet />}
    </group>
  );
}
