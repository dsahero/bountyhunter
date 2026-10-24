/**
 * The arrival: one continuous camera move with a single pause.
 *
 *   1. HOLD. The crawl ends looking up into the stars and the camera stays
 *      there. The hunter's ship roars in from behind, low overhead, its belly
 *      filling the frame, and keeps flying until it has cleared us. This is
 *      the only time the camera is still.
 *   2. FLY. The camera eases into motion and never stops again: it chases the
 *      ship, rises behind it, glides along the hull, and dives into the
 *      louvered vent on the spine, all on one constant-speed path.
 *   3. In the black of the vent it carries on into the duct above the cockpit.
 *      Lights flicker on, the ceiling grate opens, and it drops into the room.
 *      The hunter lifts off their helmet, sets it on the console, and sits. The
 *      camera slows smoothly into their eyes, and the visitor is the hunter.
 *
 * How "no cuts" works: the flyby happens far from the cockpit set (FLYBY).
 * The sky follows the camera, so it looks the same from both places. The
 * camera crosses between them at the instant the vent's black opening fills
 * the whole frame.
 *
 * Camera math: during the flight the camera rides a spline in the *ship's*
 * moving frame (so it keeps pace with it), blended in from the static
 * world-space hold. `makePath` samples by distance, so a linear tween is a
 * constant-speed move.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { Ship, VENT } from './Ship';
import { Hunter, HEAD_STANDING, SIT_DROP, type HunterHandle } from './Hunter';
import { Helmet } from '../Cockpit/Helmet';
import { cockpitFx } from '../Cockpit/fx';
import { makePath } from '../../camera/path';
import { cruise } from '../../sky/motion';
import { DUCT, EYE, HELMET_ON_SHELF } from '../../../hub/layout';
import { consoleLook } from '../../../state/hub';
import { useExperience } from '../../../state/experience';
import { useCinema } from '../../../state/cinema';
import { useReducedMotion } from '../../../lib/reducedMotion';
import { cue } from '../../../audio/cues';
import { audio } from '../../../audio/engine';

type V = [number, number, number];

/** Where the flyby happens, far from the cockpit set at the origin. */
const FLYBY = new THREE.Vector3(0, 0, -10000);
/** The ship's straight-line flight (relative to FLYBY): low overhead, front to back of frame. */
const SHIP = { y: 3.6, startZ: 34, speed: 9 };
const HUNTER_START = new THREE.Vector3(0.25, 0, -0.12);
const SEAT = new THREE.Vector3(0, 0, 0.3);

/** Hold: looking up, slightly forward, so the ship crosses the frame overhead. */
const HOLD_TARGET = new THREE.Vector3(0, 12, -3.5);

/** Timeline beats (seconds). */
const T = { roar: 2.2, fly: 6.2, blend: 5.5, path: 13.0, room: 8.0 };
const T_DUCT = T.fly + T.path;

function shipAt(t: number, out: THREE.Vector3) {
  return out.set(0, SHIP.y, SHIP.startZ - SHIP.speed * t);
}

/** The point the camera looks at once it's in the pilot's eyes. */
function consoleTarget(): V {
  const { yaw, pitch } = consoleLook();
  return [
    EYE[0] - Math.sin(yaw) * Math.cos(pitch),
    EYE[1] + Math.sin(pitch),
    EYE[2] - Math.cos(yaw) * Math.cos(pitch),
  ];
}

export function Arrival({ started }: { started: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const reduced = useReducedMotion();
  const ship = useRef<THREE.Group>(null);
  const hunter = useRef<HunterHandle>(null);
  const helmet = useRef<THREE.Group>(null);
  const ventOpen = useRef(0);
  const timeline = useRef<gsap.core.Timeline>();

  // Flight path in the ship's frame: behind and below, rise, along the hull, into the vent.
  const [vx, vy, vz] = VENT.position;
  const flight = useMemo(
    () =>
      makePath(
        [
          [0, -2.5, 24],
          [0, 2.8, 10],
          [0, 1.9, 3.8],
          [vx, vy + 0.3, vz + 0.12],
          [vx, vy + 0.05, vz],
        ],
        [
          [0, 0.3, 0],
          [0, 0.8, 1.5],
          [vx, vy, vz - 0.3],
          [vx, vy - 1, vz - 0.03],
          [vx, vy - 2, vz - 0.02],
        ],
      ),
    [vx, vy, vz],
  );
  // Through the duct, out of the ceiling, over the shoulder, into the eyes.
  const room = useMemo(
    () =>
      makePath(
        [
          [DUCT.x, DUCT.roofY + 1.0, DUCT.z],
          [DUCT.x, DUCT.roofY + 0.2, DUCT.z],
          [0, 1.92, 0.66],
          [0.4, 1.6, 0.95],
          [...EYE],
        ],
        [
          [DUCT.x, 0, DUCT.z - 0.02],
          [DUCT.x, 0, DUCT.z - 0.05],
          [0.25, 1.35, -0.12],
          [0.2, 1.05, -0.4],
          consoleTarget(),
        ],
      ),
    [],
  );

  const rig = useRef({
    mode: 'flyby' as 'flyby' | 'cockpit',
    blend: { value: 0 },
    flight: { u: 0 },
    room: { u: 0 },
    fov: { value: 55 },
    helmet: { state: 'worn' as 'worn' | 'held' | 'placed', lift: 0, offset: new THREE.Vector3() },
    shipTimeOverride: null as number | null,
  }).current;

  const tmp = useMemo(
    () => ({
      shipPos: new THREE.Vector3(),
      holdPos: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      hand: new THREE.Vector3(),
      head: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      forwardUp: new THREE.Vector3(0, 0, -1),
    }),
    [],
  );

  // ---------- Per-frame: place ship, camera, and helmet ----------
  useFrame(() => {
    const time = rig.shipTimeOverride ?? timeline.current?.time() ?? 0;
    shipAt(time, tmp.shipPos);
    ship.current?.position.copy(tmp.shipPos);

    const { pos, tgt } = tmp;
    if (rig.mode === 'flyby') {
      flight.sample(rig.flight.u, tmp.a, tmp.b);
      tmp.a.add(tmp.shipPos);
      tmp.b.add(tmp.shipPos);
      pos.lerpVectors(tmp.holdPos.set(0, 0, 0), tmp.a, rig.blend.value);
      tgt.lerpVectors(HOLD_TARGET, tmp.b, rig.blend.value);
      pos.add(FLYBY);
      tgt.add(FLYBY);
    } else {
      room.sample(rig.room.u, pos, tgt);
    }
    // Looking straight down makes "up" ambiguous; lean up toward forward (-Z) as we tip over.
    tmp.dir.subVectors(tgt, pos).normalize();
    const steep = THREE.MathUtils.smoothstep(Math.abs(tmp.dir.y), 0.8, 0.98);
    camera.up.copy(tmp.up).lerp(tmp.forwardUp, steep).normalize();
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateMatrixWorld();
    if (camera.fov !== rig.fov.value) {
      camera.fov = rig.fov.value;
      camera.updateProjectionMatrix();
    }

    // Helmet follows the head, or the hand while carried.
    const h = hunter.current;
    const hm = helmet.current;
    if (h && hm) {
      h.root.updateMatrixWorld(true);
      tmp.head.copy(HEAD_STANDING).add(h.root.position);
      tmp.head.y -= SIT_DROP * h.pose.sit;
      if (rig.helmet.state === 'worn') {
        h.head.getWorldPosition(tmp.head);
        hm.position.copy(tmp.head);
        hm.rotation.x = h.head.rotation.x;
      } else if (rig.helmet.state === 'held') {
        h.hand.getWorldPosition(tmp.hand);
        hm.position.copy(tmp.hand).add(rig.helmet.offset);
        hm.position.y += rig.helmet.lift;
      }
      // Hide the body the moment the camera is inside the head.
      if (rig.mode === 'cockpit' && camera.position.distanceTo(tmp.head) < 0.2)
        h.root.visible = false;
    }
  }, -1);

  // ---------- The timeline ----------
  useLayoutEffect(() => {
    const h = hunter.current!;
    const hm = helmet.current!;
    Object.assign(rig, { mode: 'flyby', shipTimeOverride: null });
    rig.blend.value = 0;
    rig.flight.u = 0;
    rig.room.u = 0;
    rig.fov.value = 55;
    Object.assign(rig.helmet, { state: 'worn', lift: 0 });
    h.root.position.copy(HUNTER_START);
    h.root.visible = true;
    Object.assign(h.pose, { sit: 0, raise: 0, reach: 0, turn: 0, nod: 0 });
    hm.rotation.set(0, 0, 0);
    ventOpen.current = 0;
    cockpitFx.ductLights.current = 1;
    cockpitFx.grateOpen.current = 0;
    cruise.current = 0;

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => useExperience.getState().advance(),
    });
    // Everything is authored in seconds, then played slower for a calmer, filmic pace.
    tl.timeScale(0.65);
    timeline.current = tl;
    const toCockpit = () => {
      rig.mode = 'cockpit';
      audio.startAmbience();
    };
    // Helmet off: both hands up (elbows bent), head bows, the helmet lifts clear,
    // the head comes back up, then the right arm carries it down to the shelf.
    const helmetOff = (at: number) => {
      tl.to(h.pose, { raise: 1, duration: 0.8, ease: 'power2.inOut' }, at);
      tl.to(h.pose, { nod: 1, duration: 0.6, ease: 'sine.inOut' }, at + 0.5);
      tl.call(
        () => {
          h.hand.getWorldPosition(tmp.hand);
          rig.helmet.offset.copy(hm.position).sub(tmp.hand);
          rig.helmet.state = 'held';
        },
        [],
        at + 1.1,
      );
      tl.to(rig.helmet, { lift: 0.2, duration: 0.7, ease: 'power2.inOut' }, at + 1.1);
      tl.to(h.pose, { nod: 0, duration: 0.6, ease: 'sine.inOut' }, at + 1.5);
      tl.to(h.pose, { turn: -1.2, reach: 1, duration: 1.2, ease: 'power2.inOut' }, at + 1.9);
      tl.to(rig.helmet, { lift: 0, duration: 1.2, ease: 'power2.inOut' }, at + 1.9);
      tl.to(
        hm.rotation,
        { x: 0, y: HELMET_ON_SHELF.rotationY, duration: 1.2, ease: 'power2.inOut' },
        at + 1.9,
      );
      tl.call(() => void (rig.helmet.state = 'placed'), [], at + 3.1);
      const [hx, hy, hz] = HELMET_ON_SHELF.position;
      tl.to(hm.position, { x: hx, y: hy, z: hz, duration: 0.4, ease: 'power2.out' }, at + 3.1);
      tl.to(h.pose, { reach: 0, raise: 0, turn: 0, duration: 0.8, ease: 'power2.inOut' }, at + 3.5);
      tl.to(
        h.root.position,
        { x: SEAT.x, z: SEAT.z, duration: 1.4, ease: 'power2.inOut' },
        at + 4.1,
      );
      tl.to(h.pose, { sit: 1, duration: 1.4, ease: 'power2.inOut' }, at + 4.1);
    };

    if (reduced) {
      // Reduced motion: still frames joined by fades, no camera movement.
      const fade = (on: boolean, at: number) =>
        tl.call(() => useCinema.getState().setBlackout(on), [], at);
      tl.call(() => void (rig.shipTimeOverride = SHIP.startZ / SHIP.speed), [], 0);
      fade(true, 3.0);
      tl.call(
        () => {
          toCockpit();
          rig.fov.value = 62;
          h.root.position.copy(SEAT);
          h.pose.sit = 1;
          rig.helmet.state = 'placed';
          hm.position.set(...HELMET_ON_SHELF.position);
          hm.rotation.y = HELMET_ON_SHELF.rotationY;
          rig.room.u = room.knotU(3);
        },
        [],
        3.7,
      );
      fade(false, 3.8);
      fade(true, 6.4);
      tl.call(
        () => {
          h.root.visible = false;
          rig.room.u = 1;
        },
        [],
        7.1,
      );
      fade(false, 7.2);
      tl.to({}, { duration: 0.6 }, 7.2);
    } else {
      // 1. Hold, looking up, while the ship roars over and clears.
      tl.call(() => cue('roar', '[Engines roar overhead]'), [], T.roar);
      // 2. Ease into flight (from rest, so no jolt), then one constant-speed path to the vent.
      tl.to(rig.blend, { value: 1, duration: T.blend, ease: 'sine.inOut' }, T.fly);
      tl.to(rig.flight, { u: 1, duration: T.path, ease: 'none' }, T.fly);
      tl.to(cruise, { current: 1, duration: T.blend, ease: 'sine.inOut' }, T.fly);
      const ventAt = T.fly + T.path * flight.knotU(2);
      tl.to(ventOpen, { current: 1, duration: 0.8, ease: 'power2.out' }, ventAt);
      tl.call(() => cue('clank', '[Vent hatch opens]'), [], ventAt);
      // 3. Black frame inside the vent: carry on into the cockpit duct, decelerating into the eyes.
      tl.call(toCockpit, [], T_DUCT);
      tl.call(() => void (cockpitFx.ductLights.current = 0), [], T_DUCT);
      tl.to(cockpitFx.ductLights, { current: 1, duration: 0.6, ease: 'steps(6)' }, T_DUCT + 0.05);
      tl.to(cockpitFx.grateOpen, { current: 1, duration: 0.6, ease: 'power2.out' }, T_DUCT + 0.4);
      tl.call(() => cue('clank', '[Ceiling grate opens]'), [], T_DUCT + 0.4);
      tl.to(rig.room, { u: 1, duration: T.room, ease: 'power2.out' }, T_DUCT);
      tl.to(rig.fov, { value: 62, duration: T.room, ease: 'sine.inOut' }, T_DUCT);
      helmetOff(T_DUCT + 1.1);
    }

    return () => {
      tl.kill();
      useCinema.getState().setBlackout(false);
      cockpitFx.ductLights.current = 1;
      cockpitFx.grateOpen.current = 0;
      cruise.current = 1;
      camera.up.set(0, 1, 0);
    };
  }, [camera, reduced, rig, tmp, flight, room]);

  useEffect(() => {
    if (!started) return;
    const shot = Number(new URLSearchParams(location.search).get('shot'));
    if (shot > 0) timeline.current?.pause(shot);
    else timeline.current?.play();
  }, [started]);

  return (
    <>
      {/* Planet bounce on the ship's belly */}
      <hemisphereLight args={['#1a2440', '#c0573a', 0.7]} />
      <group position={FLYBY}>
        <Ship ref={ship} ventOpen={ventOpen} />
      </group>
      <Hunter ref={hunter} />
      <Helmet ref={helmet} />
    </>
  );
}
