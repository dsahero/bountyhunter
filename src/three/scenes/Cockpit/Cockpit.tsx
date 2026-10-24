/**
 * The cockpit interior, built from primitives.
 *
 * Layout (see hub/layout.ts): the pilot sits at the origin facing -Z.
 *   Forward   the main computer: big, laid back, with the dossier menu on it,
 *             and the target's hologram projected above it
 *   Overhead  the holo star map: a timeline of experience
 *   Left      homeworld (education) hologram, warrant screen, intel datapad
 *   Right     associates projector, comms screen, helmet shelf
 *   Behind    doorway to the cargo hold, with propaganda posters
 *   Ceiling   maintenance duct + grate (the intro camera enters here)
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CONSOLE, DUCT, HELMET_ON_SHELF, SIDE_TOP, type Vec3 } from '../../../hub/layout';
import { portfolio } from '../../../content/portfolio';
import { lore } from '../../../content/lore';
import { fillTokens } from '../../../content/derived';
import { ConsoleScreen } from '../../ui/ConsoleScreen';
import { HoloCat } from '../../stations/HoloCat';
import { useHub } from '../../../state/hub';
import { Beam } from '../../procedural/Beam';
import { brushedMetalTexture, consoleTexture, diamondPlateTexture } from '../../procedural/textures';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CabinLight, cabinLevel } from './cabinLight';
import { DistressHologram, EmergencyLights, Guitar, LEFT_PAD_TOP, Tchotchkes, WeaponButtons, WeaponShots } from './Props';
import { useClickable } from '../../stations/common';
import { makeScreenTexture } from '../../procedural/screens';
import { Helmet } from './Helmet';
import { ButtonPanel } from './ButtonPanel';
import { Duct } from './Duct';
import { Droid } from './Droid';
import { WantedHologram } from '../../stations/WantedHologram';
import { StarMap } from '../../stations/StarMap';
import { LeadershipHologram } from '../../stations/LeadershipHologram';
import { HomeworldHologram } from '../../stations/HomeworldHologram';
import { AssociatesProjector } from '../../stations/AssociatesProjector';
import { PropagandaWall } from '../../stations/PropagandaWall';
import { useStationClick } from '../../stations/common';
import type { Tier } from '../../../lib/quality';

/**
 * A local reflection environment (three's RoomEnvironment through PMREM, no
 * network), so the metal surfaces have something to shine with.
 */
function RoomEnv({ intensity }: { intensity: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => {
    const before = scene.environment;
    scene.environment = env;
    return () => {
      scene.environment = before;
    };
  }, [env, scene]);
  useFrame(({ clock }) => {
    scene.environmentIntensity = intensity * cabinLevel(clock.elapsedTime);
  });
  return null;
}

function CabinAmbient({ intensity }: { intensity: number }) {
  const light = useRef<THREE.AmbientLight>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = intensity * cabinLevel(clock.elapsedTime);
  });
  return <ambientLight ref={light} intensity={intensity} color="#8090a0" />;
}

/** Your helmet on the shelf: click it to take a look (it turns on the spot). */
function ShelfHelmet() {
  const spin = useRef<THREE.Group>(null);
  const inspecting = useHub((s) => s.inspect === 'helmet');
  const click = useClickable(useMemo(() => () => useHub.getState().inspectItem('helmet'), []));
  useFrame((_, dt) => {
    if (!spin.current) return;
    if (inspecting) spin.current.rotation.y += dt * 0.9;
    else
      spin.current.rotation.y = THREE.MathUtils.damp(
        spin.current.rotation.y,
        Math.round(spin.current.rotation.y / (Math.PI * 2)) * Math.PI * 2,
        3,
        dt,
      );
  });
  return (
    <group position={HELMET_ON_SHELF.position} rotation-y={HELMET_ON_SHELF.rotationY} {...click}>
      <group ref={spin}>
        <Helmet />
      </group>
    </group>
  );
}

function useCockpitMaterials() {
  return useMemo(() => {
    const map = consoleTexture();
    return {
      panel: new THREE.MeshStandardMaterial({
        map,
        color: '#9aa0a8',
        metalness: 0.75,
        roughness: 0.42,
      }),
      frame: new THREE.MeshStandardMaterial({ color: '#2e3237', metalness: 0.85, roughness: 0.38 }),
      shiny: new THREE.MeshStandardMaterial({
        map: brushedMetalTexture(),
        color: '#c9cfd6',
        metalness: 0.9,
        roughness: 0.28,
      }),
      floor: new THREE.MeshStandardMaterial({
        map: diamondPlateTexture(),
        color: '#b0b5bb',
        metalness: 0.8,
        roughness: 0.45,
      }),
      trim: new THREE.MeshStandardMaterial({ color: '#6e1f2c', metalness: 0.3, roughness: 0.6 }),
      seat: new THREE.MeshStandardMaterial({ color: '#3b2a22', roughness: 0.85 }),
    };
  }, []);
}

type Mats = ReturnType<typeof useCockpitMaterials>;

/** A glowing screen with canvas-drawn text and a subtle flicker. */
function Screen({
  size,
  texture,
  ...props
}: { size: [number, number]; texture: THREE.Texture } & JSX.IntrinsicElements['mesh']) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.92 + Math.sin(clock.elapsedTime * 47) * 0.02;
  });
  return (
    <mesh {...props}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={mat} map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/** A framed screen standing on a side console, angled toward the pilot. */
function SideScreen({
  position,
  facing,
  texture,
  mats,
  onClick,
}: {
  position: Vec3;
  facing: number;
  texture: THREE.Texture;
  mats: Mats;
  onClick: ReturnType<typeof useStationClick>;
}) {
  return (
    <group position={position} rotation-y={facing} {...onClick}>
      <mesh position={[0, -0.2, -0.02]} material={mats.frame}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      <mesh position={[0, 0, -0.025]} material={mats.frame}>
        <boxGeometry args={[0.5, 0.33, 0.04]} />
      </mesh>
      <Screen texture={texture} size={[0.46, 0.29]} />
    </group>
  );
}

function CanopyFrame({ mat }: { mat: THREE.Material }) {
  const beams: [Vec3, Vec3, number?][] = [];
  for (const side of [-1, 1]) {
    const s = (v: Vec3): Vec3 => [v[0] * side, v[1], v[2]];
    beams.push(
      [s([1.25, 0.9, -1.2]), s([0.8, 2.0, -0.55]), 0.08], // A-pillar
      [s([1.25, 0.9, -1.2]), s([1.35, 0.9, 0.95])], // side sill
      [s([0.8, 2.0, -0.55]), s([0.95, 2.05, 0.95])], // roof edge
      [s([1.32, 0.9, 0.2]), s([0.9, 2.03, 0.2])], // side window post
      [s([1.35, 0.9, 0.95]), s([0.95, 2.05, 0.95]), 0.08], // rear post
      [s([1.25, 0.9, -1.2]), s([0, 0.9, -1.32])], // forward sill
    );
  }
  beams.push([[-0.8, 2.0, -0.55], [0.8, 2.0, -0.55], 0.08]); // top arch
  return (
    <>
      {beams.map(([a, b, size], i) => (
        <Beam key={i} from={a} to={b} size={size ?? 0.05}>
          <primitive object={mat} attach="material" />
        </Beam>
      ))}
    </>
  );
}

/** Roof panels around the duct opening. */
function Roof({ mat }: { mat: THREE.Material }) {
  const y = DUCT.roofY - 0.04;
  const h = DUCT.size / 2;
  const [x0, x1, z0, z1] = [-0.975, 0.975, -0.6, 1.0];
  const [hx0, hx1, hz0, hz1] = [DUCT.x - h, DUCT.x + h, DUCT.z - h, DUCT.z + h];
  const box = (xa: number, xb: number, za: number, zb: number, key: string) => (
    <mesh key={key} position={[(xa + xb) / 2, y, (za + zb) / 2]} material={mat}>
      <boxGeometry args={[xb - xa, 0.08, zb - za]} />
    </mesh>
  );
  return (
    <>
      {box(x0, x1, z0, hz0, 'front')}
      {box(x0, x1, hz1, z1, 'back')}
      {box(x0, hx0, hz0, hz1, 'left')}
      {box(hx1, x1, hz0, hz1, 'right')}
    </>
  );
}

/**
 * The main computer: a big laid-back screen. Its UI is a canvas texture on the
 * screen mesh (ConsoleScreen), so it's welded to the model and never drifts.
 */
function MainComputer({ mats }: { mats: Mats }) {
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

function SideConsoles({ mats }: { mats: Mats }) {
  const { charges } = portfolio;
  const screens = useMemo(
    () => ({
      warrant: makeScreenTexture({
        lines: lore.screens.warrant.map((t) =>
          fillTokens(t).replace('{CHARGES}', String(charges.length)),
        ),
        color: '#ff8a70',
        background: '#1c0705',
        readout: 'bars',
        seed: 2,
      }),
      comms: makeScreenTexture({
        lines: lore.screens.comms.map(fillTokens),
        color: '#ffb347',
        background: '#1a0d03',
        readout: 'wave',
        seed: 3,
      }),
      datapad: makeScreenTexture({
        lines: lore.screens.datapad.map(fillTokens),
        readout: 'grid',
        width: 384,
        height: 256,
        seed: 4,
      }),
    }),
    [charges.length],
  );
  const experience = useStationClick('experience');
  const contact = useStationClick('contact');
  const resume = useStationClick('resume');

  return (
    <>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.5, SIDE_TOP, 1.2]}
          radius={0.04}
          position={[1.05 * side, SIDE_TOP / 2, -0.3]}
          material={mats.shiny}
        />
      ))}
      {/* Left: warrant screen, datapad, controls */}
      <SideScreen
        position={[-1.2, 1.15, -0.3]}
        facing={1.13}
        texture={screens.warrant}
        mats={mats}
        onClick={experience}
      />
      <group position={[-0.92, SIDE_TOP + 0.01, -0.3]} rotation={[0, 0.5, 0]} {...resume}>
        <mesh material={mats.frame}>
          <boxGeometry args={[0.3, 0.018, 0.21]} />
        </mesh>
        <Screen
          texture={screens.datapad}
          size={[0.27, 0.18]}
          position={[0, 0.0095, 0]}
          rotation-x={-Math.PI / 2}
        />
      </group>
      <ButtonPanel
        position={[-1.04, LEFT_PAD_TOP, 0.12]}
        width={0.38}
        depth={0.28}
        cols={8}
        rows={6}
        seed={13}
      />
      {/* Right: comms screen and controls (the helmet shelf sits behind them) */}
      <SideScreen
        position={[1.2, 1.15, -0.35]}
        facing={-1.13}
        texture={screens.comms}
        mats={mats}
        onClick={contact}
      />
    </>
  );
}

/** The cargo hold behind the cockpit: crates, and the propaganda wall at the back. */
function CargoHold({ mats }: { mats: Mats }) {
  const crate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5a4a36', roughness: 0.9 }),
    [],
  );
  const crates: [number, number, number, number][] = [
    [-0.85, 0.22, 1.5, 0.44],
    [-0.85, 0.58, 1.5, 0.28],
    [0.9, 0.25, 2.2, 0.5],
    [0.55, 0.17, 2.35, 0.34],
  ];
  return (
    <group>
      <mesh position={[0, -0.02, 2.02]} material={mats.floor}>
        <boxGeometry args={[2.4, 0.04, 2.0]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[1.2 * side, 1.1, 2.02]} material={mats.panel}>
          <boxGeometry args={[0.05, 2.2, 2.0]} />
        </mesh>
      ))}
      <mesh position={[0, 2.18, 2.02]} material={mats.panel}>
        <boxGeometry args={[2.4, 0.05, 2.0]} />
      </mesh>
      <mesh position={[0, 1.1, 3.02]} material={mats.frame}>
        <boxGeometry args={[2.4, 2.2, 0.05]} />
      </mesh>
      {crates.map(([x, y, z, s]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]} rotation-y={x * 0.3} material={crate}>
          <boxGeometry args={[s, s, s]} />
        </mesh>
      ))}
    </group>
  );
}

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
      <EmergencyLights />

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
      <Duct material={mats.frame} />

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

      <WeaponButtons />
      <WeaponShots />

      <SideConsoles mats={mats} />
      <Tchotchkes />

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

      {/* ---------- Stations ---------- */}
      {/* Holo off powers every hologram down until you turn them back on (or open one) */}
      {!holosOff && (
        <>
          <WantedHologram />
          <StarMap tier={tier} />
          <LeadershipHologram />
          {catCall && <HoloCat />}
          <HomeworldHologram />
          <AssociatesProjector />
        </>
      )}
      <DistressHologram />
      <Guitar />
      <PropagandaWall />

      {/* ---------- Ambient life ---------- */}
      <Droid />

      {showHelmet && <ShelfHelmet />}
    </group>
  );
}
