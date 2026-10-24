/**
 * The arrival: one continuous camera move.
 *
 *   1. The crawl ends looking up into the stars. The camera makes one smooth
 *      tilt down to the horizon (planet low in frame), and holds.
 *   2. The hunter's ship roars in from directly behind and overhead, angled
 *      and banked so its underside fills most of the screen, and flies on
 *      toward the horizon (never touching the bottom of the frame).
 *   3. A few seconds after it's clear, the camera eases into motion and never
 *      stops: it chases the ship, rises behind it, glides along the hull and
 *      dives into the vent. In the black of the vent it carries on into the
 *      duct above the cockpit, drops through the ceiling, and comes to rest
 *      behind the hunter's shoulder.
 *   4. The hunter leans in, takes the helmet off with both hands, carries it
 *      to the shelf, and sits. Then the camera eases into their eyes.
 *
 * No cuts: the flyby happens far from the cockpit set (FLYBY); the sky follows
 * the camera, so it looks the same from both. The camera crosses over at the
 * instant the vent's black opening fills the frame.
 *
 * The camera rides splines sampled by distance (constant speed); during the
 * flight it rides in the ship's own frame, blended in from the static hold.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { Ship, VENT } from './Ship';
import { Hunter, type HunterHandle } from './Hunter';
import { Helmet } from '../Cockpit/Helmet';
import { cockpitFx } from '../Cockpit/fx';
import { makePath } from '../../camera/path';
import { cruise } from '../../sky/motion';
import { DUCT, EYE, HELMET_ON_SHELF } from '../../../hub/layout';
import { ARRIVAL, T_DUCT, T_EYES, T_SHOULDER } from '../../../hub/arrivalTiming';
import { consoleLook } from '../../../state/hub';
import { useExperience } from '../../../state/experience';
import { useCinema } from '../../../state/cinema';
import { useReducedMotion } from '../../../lib/reducedMotion';
import { cue } from '../../../audio/cues';
import { audio } from '../../../audio/engine';
import { lore } from '../../../content/lore';

/** How far the shot had got, so a remount continues instead of restarting. */
let resumeAt = 0;

// Keep the intro in real time even on slow machines: GSAP normally treats any
// frame slower than 0.5 s as a 33 ms one (so a 4 fps device would play the
// shot several times slower). Only truly long stalls (a hidden tab) are capped.
gsap.ticker.lagSmoothing(1500, 100);

type V = [number, number, number];

/** Where the flyby happens, far from the cockpit set at the origin. */
const FLYBY = new THREE.Vector3(0, 0, -10000);
/** The pass: from behind/above/left of the camera to far ahead/right, down near the horizon. */
const PASS_FROM = new THREE.Vector3(-4, 5.2, 12);
const PASS_TO = new THREE.Vector3(7, -10, -170);
const PASS_VELOCITY = PASS_TO.clone().sub(PASS_FROM).divideScalar(ARRIVAL.shipPass);
/** Heading from the velocity (the ship flies nose-first), with a bank that levels out before the chase. */
const HEADING = new THREE.Euler(
  Math.atan2(PASS_VELOCITY.y, Math.hypot(PASS_VELOCITY.x, PASS_VELOCITY.z)),
  Math.atan2(-PASS_VELOCITY.x, -PASS_VELOCITY.z),
  0,
  'YXZ',
);
const BANK = 0.45;

/** Looking up during the crawl, then down to the horizon for the pass. */
const CRAWL_TARGET = new THREE.Vector3(0, 14, -4);
const HOLD_TARGET = new THREE.Vector3(0.6, -1.4, -20);

const HUNTER_START = new THREE.Vector3(0.25, 0, -0.12);
const SEAT = new THREE.Vector3(0, 0, 0.3);
/** Helmet grip points (helmet-local): the sides of the helmet, a little low. */
const GRIP_L = new THREE.Vector3(-0.15, -0.04, 0.01);
const GRIP_R = new THREE.Vector3(0.15, -0.04, 0.01);

function shipAt(t: number, out: THREE.Vector3) {
  const k = Math.max(0, t - ARRIVAL.shipStart);
  return out.copy(PASS_FROM).addScaledVector(PASS_VELOCITY, k);
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
  // Down the duct, out of the ceiling, to rest behind the shoulder (knot 3), then into the eyes.
  const room = useMemo(
    () =>
      makePath(
        [
          [DUCT.x, DUCT.roofY + 1.0, DUCT.z],
          [DUCT.x, DUCT.roofY + 0.2, DUCT.z],
          [0.1, 1.9, 0.75],
          [0.5, 1.72, 0.95],
          [...EYE],
        ],
        [
          [DUCT.x, 0, DUCT.z - 0.02],
          [DUCT.x, 0, DUCT.z - 0.05],
          [0.25, 1.35, -0.12],
          [0.35, 1.2, -0.35],
          consoleTarget(),
        ],
      ),
    [],
  );

  const rig = useRef({
    mode: 'flyby' as 'flyby' | 'cockpit',
    look: { tilt: 0 },
    blend: { value: 0 },
    bank: { value: BANK },
    flight: { u: 0 },
    room: { u: 0 },
    fov: { value: 55 },
    helmet: {
      state: 'worn' as 'worn' | 'carried' | 'placed',
      u: 0,
      path: null as THREE.CatmullRomCurve3 | null,
      from: new THREE.Quaternion(),
    },
    hands: { left: 0, right: 0 },
    shipTimeOverride: null as number | null,
    /** Next frame, jump straight to the wanted orientation (start, and the hidden cut). */
    snap: true,
  }).current;

  const tmp = useMemo(
    () => ({
      shipPos: new THREE.Vector3(),
      shipQuat: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, 'YXZ'),
      hold: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      forwardUp: new THREE.Vector3(0, 0, -1),
      upHint: new THREE.Vector3(),
      shipUp: new THREE.Vector3(),
      shipForward: new THREE.Vector3(),
      look: new THREE.Matrix4(),
      wantQuat: new THREE.Quaternion(),
      shelfQuat: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, HELMET_ON_SHELF.rotationY, 0),
      ),
      gripL: new THREE.Vector3(),
      gripR: new THREE.Vector3(),
    }),
    [],
  );

  // ---------- Per frame: ship, camera, helmet, and the hunter's hands ----------
  useFrame((_, dt) => {
    const time = rig.shipTimeOverride ?? timeline.current?.time() ?? 0;
    if (started && timeline.current?.isActive()) resumeAt = timeline.current.time();
    shipAt(time, tmp.shipPos);
    tmp.euler.set(HEADING.x, HEADING.y, rig.bank.value, 'YXZ');
    tmp.shipQuat.setFromEuler(tmp.euler);
    if (ship.current) {
      ship.current.position.copy(tmp.shipPos);
      ship.current.quaternion.copy(tmp.shipQuat);
    }

    const { pos, tgt } = tmp;
    if (rig.mode === 'flyby') {
      flight.sample(rig.flight.u, tmp.a, tmp.b);
      // Ship-frame points -> world (relative to FLYBY).
      tmp.a.applyQuaternion(tmp.shipQuat).add(tmp.shipPos);
      tmp.b.applyQuaternion(tmp.shipQuat).add(tmp.shipPos);
      tmp.hold.lerpVectors(CRAWL_TARGET, HOLD_TARGET, rig.look.tilt);
      pos.set(0, 0, 0).lerp(tmp.a, rig.blend.value);
      tgt.copy(tmp.hold).lerp(tmp.b, rig.blend.value);
      pos.add(FLYBY);
      tgt.add(FLYBY);
    } else {
      room.sample(rig.room.u, pos, tgt);
    }
    // "Up": the world's up, or once riding the ship, the ship's up. Looking
    // straight down makes up ambiguous, so it leans toward forward as we tip over.
    tmp.dir.subVectors(tgt, pos).normalize();
    const flying = rig.mode === 'flyby' ? rig.blend.value : 0;
    tmp.shipUp.set(0, 1, 0).applyQuaternion(tmp.shipQuat);
    tmp.shipForward.set(0, 0, -1).applyQuaternion(tmp.shipQuat);
    tmp.upHint.copy(tmp.up).lerp(tmp.shipUp, flying);
    const forward = rig.mode === 'flyby' ? tmp.shipForward : tmp.forwardUp;
    const steep = THREE.MathUtils.smoothstep(Math.abs(tmp.dir.dot(tmp.upHint)), 0.75, 0.97);
    tmp.upHint.lerp(forward, steep).normalize();
    tmp.look.lookAt(pos, tgt, tmp.upHint);
    tmp.wantQuat.setFromRotationMatrix(tmp.look);
    // Turn gradually: the camera's orientation eases toward where it should
    // point, so a swing in the path never becomes a jerk. Position is exact.
    if (rig.snap || reduced) {
      camera.quaternion.copy(tmp.wantQuat);
      rig.snap = false;
    } else {
      // Turn gently while flying, but lock on during the final dive into the
      // vent, so its black opening fills the frame exactly at the hidden cut.
      const dive = THREE.MathUtils.smoothstep(rig.flight.u, 0.55, 0.8);
      const rate = rig.mode === 'flyby' ? THREE.MathUtils.lerp(3.2, 40, dive) : 6;
      camera.quaternion.slerp(tmp.wantQuat, 1 - Math.exp(-rate * Math.min(dt, 0.1)));
    }
    camera.up.copy(tmp.upHint);
    camera.position.copy(pos);
    camera.updateMatrixWorld();
    if (camera.fov !== rig.fov.value) {
      camera.fov = rig.fov.value;
      camera.updateProjectionMatrix();
    }

    // Helmet: on the head, carried along its path, or set down.
    const h = hunter.current;
    const hm = helmet.current;
    if (!h || !hm) return;
    const hs = rig.helmet;
    if (hs.state === 'worn') {
      hm.position.copy(h.headWorld());
      h.head.getWorldQuaternion(hm.quaternion);
    } else if (hs.state === 'carried' && hs.path) {
      hs.path.getPoint(Math.min(1, hs.u), hm.position);
      hm.quaternion.slerpQuaternions(
        hs.from,
        tmp.shelfQuat,
        THREE.MathUtils.smoothstep(hs.u, 0.35, 1),
      );
    }
    // The hair only shows once the helmet has lifted clear of the head.
    if (hunter.current)
      hunter.current.hair.visible =
        rig.helmet.state === 'placed' || (rig.helmet.state === 'carried' && rig.helmet.u > 0.18);
    // Hands follow the helmet's grips (weights blend between rest and grip).
    hm.updateMatrixWorld();
    tmp.gripL.copy(GRIP_L).applyMatrix4(hm.matrixWorld);
    tmp.gripR.copy(GRIP_R).applyMatrix4(hm.matrixWorld);
    h.reach(tmp.gripL, rig.hands.left, tmp.gripR, rig.hands.right);
    // Hide the body the moment the camera is inside the head.
    if (rig.mode === 'cockpit' && camera.position.distanceTo(h.headWorld()) < 0.2)
      h.root.visible = false;
  }, -1);

  // ---------- The timeline ----------
  useLayoutEffect(() => {
    const h = hunter.current!;
    const hm = helmet.current!;
    Object.assign(rig, { mode: 'flyby', shipTimeOverride: null, snap: true });
    rig.look.tilt = 0;
    rig.blend.value = 0;
    rig.bank.value = BANK;
    rig.flight.u = 0;
    rig.room.u = 0;
    rig.fov.value = 55;
    Object.assign(rig.helmet, { state: 'worn', u: 0, path: null });
    h.hair.visible = false;
    Object.assign(rig.hands, { left: 0, right: 0 });
    h.root.position.copy(HUNTER_START);
    h.root.visible = true;
    Object.assign(h.pose, { sit: 0, lean: 0, nod: 0, turn: 0 });
    ventOpen.current = 0;
    cockpitFx.ductLights.current = 1;
    cockpitFx.grateOpen.current = 0;
    cruise.current = 0;

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        resumeAt = 0;
        useExperience.getState().advance();
      },
    });
    tl.timeScale(ARRIVAL.timeScale);
    timeline.current = tl;
    const toCockpit = () => {
      rig.mode = 'cockpit';
      rig.snap = true;
      audio.startAmbience();
    };

    /** Lift the helmet off, carry it to the shelf, release, sit. Starts at `at`. */
    const helmetOff = (at: number) => {
      // Lean in a little, bow the head, both hands up to the helmet.
      tl.to(h.pose, { lean: 0.22, duration: 0.8, ease: 'sine.inOut' }, at);
      tl.to(rig.hands, { left: 1, right: 1, duration: 0.9, ease: 'power2.inOut' }, at);
      tl.to(h.pose, { nod: 1, duration: 0.7, ease: 'sine.inOut' }, at + 0.4);
      // Lift it off: up and a touch forward, then down in front, then to the shelf.
      tl.call(
        () => {
          const start = hm.position.clone();
          const lifted = start.clone().add(new THREE.Vector3(0, 0.26, -0.06));
          const chest = h.root.position.clone().add(new THREE.Vector3(0.12, 1.2, -0.36));
          const shelf = new THREE.Vector3(...HELMET_ON_SHELF.position);
          const overShelf = shelf.clone().add(new THREE.Vector3(-0.05, 0.12, -0.05));
          rig.helmet.path = new THREE.CatmullRomCurve3([start, lifted, chest, overShelf, shelf]);
          rig.helmet.from.copy(hm.quaternion);
          rig.helmet.state = 'carried';
          cue('clank', lore.captions.helmet);
        },
        [],
        at + 1.1,
      );
      tl.to(rig.helmet, { u: 0.3, duration: 0.8, ease: 'power2.out' }, at + 1.1);
      tl.to(h.pose, { nod: 0, lean: 0.12, duration: 0.6, ease: 'sine.inOut' }, at + 1.7);
      // Turn toward the shelf; the left hand lets go as the right carries it over.
      tl.to(h.pose, { turn: -0.85, duration: 1.2, ease: 'sine.inOut' }, at + 2.1);
      tl.to(rig.hands, { left: 0, duration: 0.7, ease: 'sine.inOut' }, at + 2.6);
      tl.to(rig.helmet, { u: 1, duration: 1.3, ease: 'sine.inOut' }, at + 2.1);
      tl.call(() => void (rig.helmet.state = 'placed'), [], at + 3.4);
      // Let go, straighten, turn back, and sit.
      tl.to(rig.hands, { right: 0, duration: 0.6, ease: 'sine.inOut' }, at + 3.4);
      tl.to(h.pose, { turn: 0, lean: 0, duration: 0.9, ease: 'sine.inOut' }, at + 3.7);
      tl.to(
        h.root.position,
        { x: SEAT.x, z: SEAT.z, duration: 1.4, ease: 'power2.inOut' },
        at + 4.2,
      );
      tl.to(h.pose, { sit: 1, duration: 1.4, ease: 'power2.inOut' }, at + 4.2);
    };

    if (reduced) {
      // Reduced motion: still frames joined by fades, no camera movement.
      const fade = (on: boolean, at: number) =>
        tl.call(() => useCinema.getState().setBlackout(on), [], at);
      tl.call(
        () => {
          rig.look.tilt = 1;
          rig.shipTimeOverride = ARRIVAL.shipStart + ARRIVAL.shipPass * 0.12;
        },
        [],
        0,
      );
      fade(true, 3.0);
      tl.call(
        () => {
          toCockpit();
          rig.fov.value = 62;
          h.root.position.copy(SEAT);
          h.pose.sit = 1;
          rig.helmet.state = 'placed';
          hm.position.set(...HELMET_ON_SHELF.position);
          hm.quaternion.copy(tmp.shelfQuat);
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
      // 1. One smooth tilt down from the stars to the horizon; then hold.
      tl.to(rig.look, { tilt: 1, duration: ARRIVAL.tiltDown, ease: 'sine.inOut' }, 0);
      tl.call(() => cue('roar', lore.captions.roar), [], ARRIVAL.roar);
      // The bank levels out once the ship is far away (before the chase uses its frame).
      tl.to(rig.bank, { value: 0, duration: 2.5, ease: 'sine.inOut' }, ARRIVAL.fly - 2.5);
      // 2. Ease from rest into flight, then one constant-speed path to the vent.
      tl.to(rig.blend, { value: 1, duration: ARRIVAL.blend, ease: 'sine.inOut' }, ARRIVAL.fly);
      tl.to(rig.flight, { u: 1, duration: ARRIVAL.path, ease: 'sine.in' }, ARRIVAL.fly);
      tl.to(cruise, { current: 1, duration: ARRIVAL.blend, ease: 'sine.inOut' }, ARRIVAL.fly);
      const ventAt = ARRIVAL.fly + ARRIVAL.path * 0.75;
      tl.to(ventOpen, { current: 1, duration: 0.8, ease: 'power2.out' }, ventAt);
      tl.call(() => cue('clank', lore.captions.ventOpen), [], ventAt);
      // 3. Black frame in the vent: carry on into the cockpit duct, down to behind the shoulder.
      tl.call(toCockpit, [], T_DUCT);
      tl.call(() => void (cockpitFx.ductLights.current = 0), [], T_DUCT);
      tl.to(cockpitFx.ductLights, { current: 1, duration: 0.6, ease: 'steps(6)' }, T_DUCT + 0.05);
      tl.to(cockpitFx.grateOpen, { current: 1, duration: 0.6, ease: 'power2.out' }, T_DUCT + 0.4);
      tl.call(() => cue('clank', lore.captions.grateOpen), [], T_DUCT + 0.4);
      tl.to(rig.room, { u: room.knotU(3), duration: ARRIVAL.roomIn, ease: 'power2.out' }, T_DUCT);
      tl.to(rig.fov, { value: 62, duration: ARRIVAL.roomIn, ease: 'sine.inOut' }, T_DUCT);
      // 4. The helmet comes off while the camera waits behind the shoulder; then into the eyes.
      helmetOff(T_SHOULDER - 0.4);
      tl.to(rig.room, { u: 1, duration: ARRIVAL.roomOut, ease: 'sine.inOut' }, T_EYES);
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
    if (!started) {
      resumeAt = 0; // a fresh run (e.g. replaying the intro) starts at the top
      return;
    }
    const shot = Number(new URLSearchParams(location.search).get('shot'));
    const tl = timeline.current;
    if (!tl) return;
    if (shot > 0) tl.pause(shot);
    else {
      // Remounted mid-shot (e.g. a hot reload): carry on from where it was,
      // firing the beats in between, instead of playing it all again.
      if (resumeAt > 0) tl.seek(resumeAt, false);
      tl.play();
    }
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
