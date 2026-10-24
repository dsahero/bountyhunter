/**
 * Lived-in details and the interactive extras around the cockpit:
 *   - tchotchkes (click one for its story): throttle levers, flip switches, hanging dice, a mug, a
 *     plant, a bobble-head droid, a framed picture of the hunter and his cat
 *   - the overhead weapon buttons (main blaster, torpedo) and their shots
 *   - the guitar in the cargo hold (starts the attack sequence)
 *   - the other hunter's distress hologram and the emergency lighting
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ANCHORS,
  EYE,
  GUITAR,
  PROPS,
  WEAPON_PLATE,
  SIDE_TOP,
  type PropId,
  type Vec3,
} from '../../../hub/layout';
import { useHub } from '../../../state/hub';
import { rumbleAt } from '../../../hub/rumble';
import { CabinLight, emergencyPulse } from './cabinLight';
import { lore } from '../../../content/lore';
import { useWeapons, type Shot } from '../../../state/weapons';
import { useAttack, isEmergency } from '../../../hub/attack';
import { useReducedMotion } from '../../../lib/reducedMotion';
import { makeHoloMaterial } from '../../holo/holoMaterial';
import { Projector, useClickable } from '../../stations/common';

const metal = (color: string, roughness = 0.35) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness });
const plastic = (color: string, roughness = 0.6) =>
  new THREE.MeshStandardMaterial({ color, roughness });
const glow = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

/** Rotation around Y that turns local +Z toward the pilot's eye. */
const facePilot = ([x, , z]: Vec3) => Math.atan2(EYE[0] - x, EYE[2] - z);

/* ------------------------------------------------------------------ */
/* Tchotchkes                                                          */
/* ------------------------------------------------------------------ */

function Levers() {
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

function FlipSwitches() {
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

/** Fuzzy dice hanging from the canopy frame, swaying with the ship. */
function HangingDice() {
  const swing = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const m = useMemo(
    () => ({ die: plastic('#e8e2d0', 0.9), pip: plastic('#1a1a1a'), cord: plastic('#333') }),
    [],
  );
  useFrame(({ clock }) => {
    if (!swing.current) return;
    const t = clock.elapsedTime;
    const shake = rumbleAt() * 0.5;
    swing.current.rotation.z = reduced ? 0 : Math.sin(t * 1.3) * (0.12 + shake);
    swing.current.rotation.x = reduced ? 0 : Math.sin(t * 0.9 + 1) * (0.06 + shake);
  });
  return (
    <group ref={swing}>
      {[-0.03, 0.035].map((x, i) => (
        <group key={x}>
          <mesh position={[x, -0.08 - i * 0.03, 0]} material={m.cord}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.16 + i * 0.06, 4]} />
          </mesh>
          <mesh position={[x, -0.18 - i * 0.06, 0]} rotation={[0.4 + i, 0.6, 0.2]} material={m.die}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A caf mug: a lathed cup with real wall thickness, coffee inside, and an upright handle. */
function Mug() {
  const m = useMemo(
    () => ({
      cup: new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.45, side: THREE.DoubleSide }),
      coffee: plastic('#2a160b', 0.15),
    }),
    [],
  );
  const profile = useMemo(
    () =>
      [
        [0, 0],
        [0.029, 0],
        [0.032, 0.004],
        [0.033, 0.09],
        [0.0295, 0.09],
        [0.0285, 0.01],
        [0, 0.01],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  return (
    <group>
      <mesh material={m.cup}>
        <latheGeometry args={[profile, 32]} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2} material={m.coffee}>
        <circleGeometry args={[0.0288, 32]} />
      </mesh>
      {/* Handle: the right half of a ring, standing upright against the side */}
      <mesh position={[0.033, 0.047, 0]} rotation-z={-Math.PI / 2} material={m.cup}>
        <torusGeometry args={[0.022, 0.006, 10, 20, Math.PI]} />
      </mesh>
    </group>
  );
}

function Plant() {
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

/** A bobble-head astromech on the dash: its dome wobbles. */
function BobbleDroid() {
  const head = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const m = useMemo(
    () => ({ body: plastic('#e8ecf0', 0.4), blue: plastic('#2e5fa8', 0.4), eye: glow('#ff3b30') }),
    [],
  );
  useFrame(({ clock }) => {
    if (head.current && !reduced)
      head.current.rotation.z = Math.sin(clock.elapsedTime * 3.1) * 0.12;
  });
  return (
    <group rotation-y={facePilot(PROPS.bobble)}>
      <mesh position={[0, 0.03, 0]} material={m.body}>
        <cylinderGeometry args={[0.022, 0.024, 0.05, 14]} />
      </mesh>
      <mesh position={[0, 0.03, 0.022]} material={m.blue}>
        <boxGeometry args={[0.02, 0.025, 0.003]} />
      </mesh>
      <group ref={head} position={[0, 0.056, 0]}>
        <mesh position={[0, 0.006, 0]} material={m.body}>
          <sphereGeometry args={[0.03, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.02, 0.022]} material={m.eye}>
          <sphereGeometry args={[0.006, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/** A framed snapshot of the hunter and his cat, drawn in a canvas. */
function PictureFrame() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const g = c.getContext('2d')!;
    const sky = g.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, '#f2a65a');
    sky.addColorStop(1, '#f6d9a8');
    g.fillStyle = sky;
    g.fillRect(0, 0, 256, 240);
    g.fillStyle = '#7a5a3a';
    g.fillRect(0, 196, 256, 44);
    // The hunter: long dark hair over the shoulders, steel armor, maroon trim.
    g.fillStyle = '#2a1d16';
    g.beginPath();
    g.ellipse(100, 112, 30, 52, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#3b3f45';
    g.fillRect(66, 128, 70, 72); // flight suit
    g.fillStyle = '#a7aeb5';
    g.fillRect(74, 132, 54, 34); // chest plate
    g.fillStyle = '#8d949b';
    g.fillRect(74, 168, 54, 12); // belt plate
    g.fillStyle = '#6e1f2c';
    g.fillRect(74, 158, 54, 5); // maroon trim
    g.fillStyle = '#a7aeb5';
    g.beginPath();
    g.ellipse(64, 136, 13, 9, -0.4, 0, Math.PI * 2); // pauldrons
    g.ellipse(138, 136, 13, 9, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c99a78';
    g.beginPath();
    g.ellipse(101, 92, 19, 23, 0, 0, Math.PI * 2); // face
    g.fill();
    g.fillStyle = '#2a1d16';
    g.beginPath();
    g.ellipse(101, 76, 22, 13, 0, Math.PI, 0); // hairline
    g.fill();
    g.fillRect(80, 76, 7, 62); // hair falling either side
    g.fillRect(115, 76, 7, 62);
    g.fillStyle = '#1b1b1b';
    g.fillRect(93, 90, 4, 4); // eyes
    g.fillRect(106, 90, 4, 4);
    g.fillStyle = '#8a4a3a';
    g.fillRect(96, 103, 11, 3); // smile
    // The helmet under one arm.
    g.fillStyle = '#a7aeb5';
    g.beginPath();
    g.arc(52, 176, 19, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.fillRect(40, 170, 24, 5);
    g.fillRect(49, 170, 6, 16);
    // Sniffles: a black-and-white (tuxedo) cat.
    g.fillStyle = '#141414';
    g.beginPath();
    g.ellipse(184, 180, 32, 22, 0, 0, Math.PI * 2); // body
    g.fill();
    g.beginPath();
    g.arc(186, 146, 19, 0, Math.PI * 2); // head
    g.fill();
    g.beginPath();
    g.moveTo(170, 136);
    g.lineTo(173, 116);
    g.lineTo(183, 131);
    g.moveTo(189, 131);
    g.lineTo(199, 116);
    g.lineTo(202, 137);
    g.fill();
    g.beginPath();
    g.moveTo(214, 188);
    g.quadraticCurveTo(238, 176, 230, 150); // tail
    g.lineWidth = 7;
    g.strokeStyle = '#141414';
    g.stroke();
    g.fillStyle = '#f4f4f0';
    g.beginPath();
    g.moveTo(186, 146);
    g.lineTo(176, 166);
    g.lineTo(196, 166);
    g.fill(); // white muzzle blaze
    g.beginPath();
    g.ellipse(184, 186, 14, 14, 0, 0, Math.PI * 2); // white chest
    g.fill();
    g.fillRect(166, 196, 9, 6); // white paws
    g.fillRect(192, 196, 9, 6);
    g.fillStyle = '#c8e05a';
    g.fillRect(177, 141, 5, 4); // eyes
    g.fillRect(190, 141, 5, 4);
    // Caption
    g.fillStyle = '#f5efe0';
    g.fillRect(0, 240, 256, 80);
    g.fillStyle = '#3a2a1e';
    g.font = '22px "Share Tech Mono", monospace';
    g.textAlign = 'center';
    g.fillText(lore.picture.caption, 128, 288, 236);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const frame = useMemo(() => metal('#6a4a2a', 0.5), []);
  return (
    <group rotation-y={facePilot(PROPS.picture)}>
      <group position={[0, 0.085, 0]} rotation-x={-0.18}>
        <mesh material={frame}>
          <boxGeometry args={[0.13, 0.16, 0.01]} />
        </mesh>
        <mesh position={[0, 0, 0.0055]}>
          <planeGeometry args={[0.11, 0.14]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
      </group>
      <mesh position={[0, 0.04, -0.03]} rotation-x={0.5} material={frame}>
        <boxGeometry args={[0.02, 0.09, 0.005]} />
      </mesh>
    </group>
  );
}

/** A black pad the left console's button panel sits on (raised clear of the table). */
const PAD = { bottom: SIDE_TOP + 0.003, height: 0.012 };
function LeftPad() {
  const m = useMemo(() => metal('#0d0e10', 0.5), []);
  return (
    <mesh position={[-1.04, PAD.bottom + PAD.height / 2, 0.12]} material={m}>
      <boxGeometry args={[0.46, PAD.height, 0.36]} />
    </mesh>
  );
}

/** A tchotchke: placed at its spot, clickable (flavor text), and rattles when the hull rumbles. */
function Prop({ id, children }: { id: PropId; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const click = useClickable(useMemo(() => () => useHub.getState().inspectItem(id), [id]));
  const [x, y, z] = PROPS[id];
  useFrame(({ clock }) => {
    if (!group.current || reduced) return;
    const shake = rumbleAt();
    const t = clock.elapsedTime * 45;
    group.current.position.set(
      x + Math.sin(t + x * 9) * 0.004 * shake,
      y + Math.abs(Math.sin(t * 1.3 + z * 7)) * 0.006 * shake,
      z + Math.sin(t * 0.8 + y) * 0.004 * shake,
    );
    group.current.rotation.z = Math.sin(t * 1.1) * 0.05 * shake;
  });
  return (
    <group ref={group} position={[x, y, z]} {...click}>
      {children}
    </group>
  );
}

export function Tchotchkes() {
  return (
    <>
      <Prop id="levers">
        <Levers />
      </Prop>
      <Prop id="switches">
        <FlipSwitches />
      </Prop>
      <Prop id="dice">
        <HangingDice />
      </Prop>
      <Prop id="mug">
        <Mug />
      </Prop>
      <Prop id="plant">
        <Plant />
      </Prop>
      <Prop id="bobble">
        <BobbleDroid />
      </Prop>
      <Prop id="picture">
        <PictureFrame />
      </Prop>
      <LeftPad />
    </>
  );
}

/** Where the left button panel goes: its bezel (3.5 cm below its top) rests just above the pad. */
export const LEFT_PAD_TOP = PAD.bottom + PAD.height + 0.036;

/* ------------------------------------------------------------------ */
/* Weapons                                                             */
/* ------------------------------------------------------------------ */

function BigButton({
  color,
  label,
  onPress,
  x,
}: {
  color: string;
  label: string;
  onPress: () => void;
  x: number;
}) {
  const cap = useRef<THREE.Mesh>(null);
  const pressedAt = useRef(-10);
  const press = useMemo(
    () => () => {
      pressedAt.current = performance.now() / 1000;
      onPress();
    },
    [onPress],
  );
  const click = useClickable(press);
  const m = useMemo(() => ({ guard: metal('#c8a030', 0.3), cap: glow(color) }), [color]);
  useFrame(() => {
    if (!cap.current) return;
    const since = performance.now() / 1000 - pressedAt.current;
    cap.current.position.y = -0.03 + (since < 0.25 ? 0.012 : 0);
  });
  return (
    <group position={[x, 0, 0]} {...click} name={label}>
      <mesh position={[0, -0.012, 0]} material={m.guard}>
        <cylinderGeometry args={[0.06, 0.065, 0.024, 24, 1, true]} />
      </mesh>
      <mesh ref={cap} position={[0, -0.03, 0]} material={m.cap}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 24]} />
      </mesh>
    </group>
  );
}

export function WeaponButtons() {
  const fire = useWeapons((s) => s.fire);
  const blaster = useMemo(() => () => fire('blaster'), [fire]);
  const torpedo = useMemo(() => () => fire('torpedo'), [fire]);
  const plate = useMemo(() => metal('#2b2f35'), []);
  const stripe = useMemo(() => plastic('#d9a020'), []);
  return (
    <group position={WEAPON_PLATE.position} rotation-x={WEAPON_PLATE.tilt}>
      <mesh material={plate}>
        <boxGeometry args={[0.42, 0.03, 0.18]} />
      </mesh>
      <mesh position={[0, -0.016, 0.075]} material={stripe}>
        <boxGeometry args={[0.4, 0.004, 0.02]} />
      </mesh>
      {/* Struts up to the canopy's top arch */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.016, 0.13]} material={plate}>
          <boxGeometry args={[0.02, 0.02, 0.1]} />
        </mesh>
      ))}
      <BigButton x={-0.1} color="#ff3b30" label={lore.console.fireBlaster} onPress={blaster} />
      <BigButton x={0.1} color="#3fa8ff" label={lore.console.fireTorpedo} onPress={torpedo} />
    </group>
  );
}

const BOLT_SPEED = 140;
const TORPEDO_SPEED = 45;

function ShotFx({ shot }: { shot: Shot }) {
  const group = useRef<THREE.Group>(null);
  const flash = useRef<THREE.PointLight>(null);
  const blaster = shot.kind === 'blaster';
  const m = useMemo(
    () => ({ bolt: glow('#ff2a1a'), core: glow('#ffd0c0'), torp: glow('#7fd0ff') }),
    [],
  );
  useFrame(() => {
    const t = (performance.now() - shot.at) / 1000;
    if (group.current) {
      group.current.position.z = -(blaster ? BOLT_SPEED : TORPEDO_SPEED) * t;
      group.current.visible = t < (blaster ? 1.6 : 3.5);
      if (!blaster) group.current.scale.setScalar(1 + Math.sin(t * 30) * 0.15);
    }
    if (flash.current) flash.current.intensity = Math.max(0, 6 - t * 30);
  });
  return (
    <>
      <pointLight
        ref={flash}
        position={[0, 1.0, -1.6]}
        color={blaster ? '#ff4a30' : '#6fc8ff'}
        intensity={6}
        distance={4}
      />
      <group ref={group}>
        {blaster ? (
          [-1.5, 1.5].map((x) => (
            <group key={x} position={[x, 1.0, -2.5]} rotation-x={Math.PI / 2}>
              <mesh material={m.bolt}>
                <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
              </mesh>
              <mesh material={m.core}>
                <cylinderGeometry args={[0.02, 0.02, 2.5, 6]} />
              </mesh>
            </group>
          ))
        ) : (
          <group position={[0, 1.05, -2.6]}>
            <mesh material={m.torp}>
              <sphereGeometry args={[0.16, 16, 12]} />
            </mesh>
            <mesh material={m.core}>
              <sphereGeometry args={[0.08, 12, 10]} />
            </mesh>
          </group>
        )}
      </group>
    </>
  );
}

export function WeaponShots() {
  const shots = useWeapons((s) => s.shots);
  return (
    <>
      {shots.map((s) => (
        <ShotFx key={s.id} shot={s} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The guitar and the attack                                           */
/* ------------------------------------------------------------------ */

export function Guitar() {
  const start = useMemo(() => () => useAttack.getState().start(), []);
  const click = useClickable(start);
  const m = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color: '#b0301c',
        roughness: 0.3,
        metalness: 0.1,
        emissive: '#3a0a04',
      }),
      top: new THREE.MeshStandardMaterial({
        color: '#f0b45a',
        roughness: 0.35,
        emissive: '#3a2008',
      }),
      neck: plastic('#4a2a14', 0.5),
      hole: plastic('#120a05', 0.9),
      string: metal('#f0f0f0', 0.2),
    }),
    [],
  );
  const [x, y, z] = GUITAR.position;
  return (
    <group position={[x, y, z]} rotation-y={GUITAR.rotationY}>
      {/* Its own warm spotlight, so it catches the eye from the seat */}
      <CabinLight position={[0, 1.1, 0]} color="#ffc070" intensity={2.4} distance={1.8} />
      {/* Lying on its back on the floor, centered on its spot */}
      <group {...click} scale={1.35} position={[0, 0.055, 0]} rotation-x={-Math.PI / 2}>
        <group position={[0, -0.36, 0]}>
          {(
            [
              [0.17, 0.16],
              [0.37, 0.13],
            ] as const
          ).map(([py, r]) => (
            <group key={py} position={[0, py, 0]}>
              <mesh rotation-x={Math.PI / 2} material={m.body}>
                <cylinderGeometry args={[r, r, 0.08, 28]} />
              </mesh>
              <mesh position={[0, 0, 0.041]} material={m.top}>
                <circleGeometry args={[r - 0.008, 28]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.27, 0.043]} material={m.hole}>
            <circleGeometry args={[0.045, 20]} />
          </mesh>
          {/* A short neck and headstock */}
          <mesh position={[0, 0.63, 0.03]} material={m.neck}>
            <boxGeometry args={[0.05, 0.3, 0.025]} />
          </mesh>
          <mesh position={[0, 0.83, 0.025]} rotation-x={0.15} material={m.neck}>
            <boxGeometry args={[0.07, 0.11, 0.02]} />
          </mesh>
          {[-0.015, -0.005, 0.005, 0.015].map((sx) => (
            <mesh key={sx} position={[sx, 0.53, 0.046]} material={m.string}>
              <boxGeometry args={[0.0015, 0.56, 0.0015]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Another hunter on the overhead projector, mid-firefight, calling for help. */
export function DistressHologram() {
  const stage = useAttack((s) => s.stage);
  const material = useMemo(() => makeHoloMaterial('#ff7a5a', 1, 0.8), []);
  const visor = useMemo(() => glow('#ffd0c0'), []);
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.x = -1.3 + Math.sin(clock.elapsedTime * 7) * 0.08;
  });
  if (stage !== 'incoming' && stage !== 'alert') return null;
  const [x, y, z] = ANCHORS.experience;
  return (
    <group>
      <Projector
        position={[x, 2.05, z + 0.05]}
        height={0.34}
        radius={0.24}
        active
        flip
        color="#ff7a5a"
      />
      <group position={[x, y - 0.3, z]} rotation-y={facePilot(ANCHORS.experience)} scale={0.5}>
        <mesh position={[0, 0.35, 0]} scale={[1, 1.2, 0.6]} material={material}>
          <sphereGeometry args={[0.22, 20, 14]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} material={material}>
          <sphereGeometry args={[0.13, 20, 16]} />
        </mesh>
        <mesh position={[0, 0.73, 0.11]} material={visor}>
          <boxGeometry args={[0.14, 0.025, 0.02]} />
        </mesh>
        <mesh position={[0, 0.68, 0.115]} material={visor}>
          <boxGeometry args={[0.025, 0.08, 0.02]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.25 * s, 0.52, 0]} material={material}>
            <sphereGeometry args={[0.08, 12, 10]} />
          </mesh>
        ))}
        <mesh position={[-0.27, 0.3, 0]} rotation-z={0.15} material={material}>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
        </mesh>
        {/* Blaster arm, firing off-frame */}
        <group ref={arm} position={[0.27, 0.52, 0]}>
          <mesh position={[0, -0.17, 0]} material={material}>
            <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.38, 0.03]} material={material}>
            <boxGeometry args={[0.05, 0.16, 0.08]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Red emergency lamps while the ship is under attack: a slow glow, never a strobe. */
export function EmergencyLights() {
  const stage = useAttack((s) => s.stage);
  const reduced = useReducedMotion();
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(({ clock }) => {
    const glowUp = reduced ? 0.5 : 1 - emergencyPulse(clock.elapsedTime);
    lights.current.forEach((l) => l && (l.intensity = 0.3 + 1.6 * glowUp));
  });
  if (!isEmergency(stage)) return null;
  const spots: Vec3[] = [
    [0, 1.9, -0.4],
    [0, 1.9, 1.8],
  ];
  return (
    <>
      {spots.map((p, i) => (
        <pointLight
          key={i}
          ref={(l) => void (lights.current[i] = l)}
          position={p}
          color="#ff2a1a"
          distance={3.5}
        />
      ))}
    </>
  );
}
