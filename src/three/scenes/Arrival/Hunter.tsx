/**
 * The hunter: an armored humanoid in the spirit of the animated-series
 * Mandalorian bounty hunters (fan homage, built from primitives): undersuit,
 * segmented chest and back plates, pauldrons, belt and pouches, gauntlets,
 * knee and shin plates, boots, and a jet-pack.
 * The face is never shown (we see them from above and behind).
 *
 * Rig: groups with pivots at the hips, knees, shoulders, and elbows, driven by
 * a few numbers the director tweens:
 *   sit    0..1  hips forward, knees bent, body lowered into the seat
 *   raise  0..1  both hands up to the helmet
 *   reach  0..1  right arm forward-down, to set the helmet on the console
 *   turn   radians, body yaw
 *   nod    0..1  bow the head (to lift the helmet off)
 * `hand` marks the right hand (the helmet is carried by it); `head` is the
 * head pivot (the worn helmet follows its position and bow).
 * Origin is between the feet; the hunter faces -Z.
 */
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface HunterPose {
  sit: number;
  raise: number;
  reach: number;
  turn: number;
  nod: number;
}

export interface HunterHandle {
  root: THREE.Group;
  hand: THREE.Object3D;
  head: THREE.Group;
  pose: HunterPose;
}

/** Head center relative to the hunter's origin (standing). */
export const HEAD_STANDING = new THREE.Vector3(0, 1.66, 0);
export const SIT_DROP = 0.44;

const HIP_Y = 0.9;
const SHOULDER_Y = 1.42;

function useArmor() {
  return useMemo(
    () => ({
      // Real-world colors: olive-brown flight suit, gunmetal armor, brown leather.
      suit: new THREE.MeshStandardMaterial({ color: '#4d4636', roughness: 0.9 }),
      steel: new THREE.MeshStandardMaterial({ color: '#8c949b', metalness: 0.75, roughness: 0.38 }),
      dark: new THREE.MeshStandardMaterial({ color: '#3a3d42', metalness: 0.5, roughness: 0.5 }),
      maroon: new THREE.MeshStandardMaterial({
        color: '#7a2733',
        metalness: 0.45,
        roughness: 0.45,
      }),
      orange: new THREE.MeshStandardMaterial({ color: '#c6602a', metalness: 0.4, roughness: 0.5 }),
      leather: new THREE.MeshStandardMaterial({ color: '#5a4630', roughness: 0.85 }),
      hair: new THREE.MeshStandardMaterial({ color: '#3b2618', roughness: 0.75 }),
      skin: new THREE.MeshStandardMaterial({ color: '#c99878', roughness: 0.6 }),
    }),
    [],
  );
}

type Armor = ReturnType<typeof useArmor>;

/** One leg: hip pivot -> thigh -> knee pivot -> shin and boot. */
function Leg({
  m,
  hip,
  knee,
}: {
  m: Armor;
  hip: React.RefObject<THREE.Group>;
  knee: React.RefObject<THREE.Group>;
}) {
  return (
    <group ref={hip}>
      <mesh position={[0, -0.21, 0]} material={m.suit}>
        <capsuleGeometry args={[0.08, 0.3, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.2, -0.07]} rotation-x={0.05} material={m.steel}>
        <boxGeometry args={[0.13, 0.24, 0.035]} />
      </mesh>
      <group ref={knee} position={[0, -0.43, 0]}>
        <mesh position={[0, 0, -0.06]} material={m.steel}>
          <boxGeometry args={[0.11, 0.08, 0.05]} />
        </mesh>
        <mesh position={[0, -0.2, 0]} material={m.suit}>
          <capsuleGeometry args={[0.065, 0.28, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.2, -0.065]} material={m.steel}>
          <boxGeometry args={[0.1, 0.24, 0.03]} />
        </mesh>
        <mesh position={[0, -0.42, -0.04]} material={m.leather}>
          <boxGeometry args={[0.13, 0.11, 0.26]} />
        </mesh>
      </group>
    </group>
  );
}

/** One arm: shoulder pivot -> upper arm -> elbow pivot -> gauntlet and glove. */
function Arm({
  m,
  shoulder,
  elbow,
  hand,
}: {
  m: Armor;
  shoulder: React.RefObject<THREE.Group>;
  elbow: React.RefObject<THREE.Group>;
  hand?: React.RefObject<THREE.Object3D>;
}) {
  return (
    <group ref={shoulder}>
      <mesh position={[0, -0.14, 0]} material={m.suit}>
        <capsuleGeometry args={[0.055, 0.2, 4, 8]} />
      </mesh>
      <group ref={elbow} position={[0, -0.29, 0]}>
        <mesh position={[0, -0.12, 0]} material={m.suit}>
          <capsuleGeometry args={[0.05, 0.18, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.15, 0]} material={m.steel}>
          <cylinderGeometry args={[0.062, 0.055, 0.16, 8]} />
        </mesh>
        <mesh position={[0, -0.24, 0]} material={m.orange}>
          <cylinderGeometry args={[0.064, 0.064, 0.02, 8]} />
        </mesh>
        {/* Hand: palm, four fingers, thumb */}
        <mesh position={[0, -0.28, 0]} material={m.skin}>
          <boxGeometry args={[0.07, 0.07, 0.03]} />
        </mesh>
        {[-0.024, -0.008, 0.008, 0.024].map((x) => (
          <mesh key={x} position={[x, -0.335, 0]} material={m.skin}>
            <capsuleGeometry args={[0.0075, 0.035, 2, 6]} />
          </mesh>
        ))}
        <mesh position={[0.042, -0.275, -0.012]} rotation-z={0.6} material={m.skin}>
          <capsuleGeometry args={[0.009, 0.03, 2, 6]} />
        </mesh>
        <object3D ref={hand} position={[0, -0.33, 0]} />
      </group>
    </group>
  );
}

export const Hunter = forwardRef<HunterHandle, JSX.IntrinsicElements['group']>(
  function Hunter(props, ref) {
    const m = useArmor();
    const root = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const hipL = useRef<THREE.Group>(null);
    const hipR = useRef<THREE.Group>(null);
    const kneeL = useRef<THREE.Group>(null);
    const kneeR = useRef<THREE.Group>(null);
    const shoulderL = useRef<THREE.Group>(null);
    const shoulderR = useRef<THREE.Group>(null);
    const elbowL = useRef<THREE.Group>(null);
    const elbowR = useRef<THREE.Group>(null);
    const hand = useRef<THREE.Object3D>(null);
    const head = useRef<THREE.Group>(null);
    const pose = useRef<HunterPose>({ sit: 0, raise: 0, reach: 0, turn: 0, nod: 0 }).current;

    useImperativeHandle(
      ref,
      () => ({ root: root.current!, hand: hand.current!, head: head.current!, pose }),
      [pose],
    );

    useFrame(() => {
      const parts = [body, hipL, hipR, kneeL, kneeR, shoulderL, shoulderR, elbowL, elbowR].map(
        (r) => r.current,
      );
      if (parts.some((p) => !p)) return;
      type G = THREE.Group;
      const [b, hl, hr, kl, kr, sl, sr, el, er] = parts as [G, G, G, G, G, G, G, G, G];
      // Sitting: thighs swing forward, shins hang down, body lowers into the seat.
      b.position.y = -SIT_DROP * pose.sit;
      b.rotation.y = pose.turn;
      if (head.current) head.current.rotation.x = -0.4 * pose.nod;
      hl.rotation.x = hr.rotation.x = 1.5 * pose.sit;
      kl.rotation.x = kr.rotation.x = -1.45 * pose.sit;
      // Hands to the helmet (both), then the right arm reaches forward to set it down.
      const raised = pose.raise * (1 - pose.reach);
      sr.rotation.set(1.1 * pose.reach + 0.35 * raised, 0, -2.3 * raised - 0.2 * pose.reach - 0.08);
      er.rotation.x = 1.0 * raised + 0.35 * pose.reach + 0.15;
      sl.rotation.set(
        0.35 * pose.raise * (1 - pose.reach),
        0,
        2.3 * pose.raise * (1 - pose.reach) + 0.08,
      );
      el.rotation.x = 1.0 * pose.raise * (1 - pose.reach) + 0.15;
    });

    return (
      <group ref={root} {...props}>
        <group ref={body}>
          {/* Legs */}
          <group position={[-0.11, HIP_Y, 0]}>
            <Leg m={m} hip={hipL} knee={kneeL} />
          </group>
          <group position={[0.11, HIP_Y, 0]}>
            <Leg m={m} hip={hipR} knee={kneeR} />
          </group>

          {/* Belt, buckle, pouches, hip plates */}
          <mesh position={[0, 0.95, 0]} material={m.leather}>
            <cylinderGeometry args={[0.175, 0.17, 0.08, 16]} />
          </mesh>
          <mesh position={[0, 0.95, -0.17]} material={m.orange}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
          </mesh>
          {[-0.14, 0.14, 0.07].map((x) => (
            <mesh key={x} position={[x, 0.93, x === 0.07 ? 0.16 : -0.1]} material={m.leather}>
              <boxGeometry args={[0.06, 0.07, 0.05]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.17 * s, 0.84, 0]} rotation-z={0.15 * s} material={m.maroon}>
              <boxGeometry args={[0.05, 0.16, 0.18]} />
            </mesh>
          ))}

          {/* Torso: undersuit, chest plates, abdomen plates */}
          <mesh position={[0, 1.2, 0]} scale={[1.15, 1, 0.8]} material={m.suit}>
            <capsuleGeometry args={[0.17, 0.28, 4, 12]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[0.085 * s, 1.31, -0.135]}
              rotation={[0.1, 0.28 * s, 0]}
              material={m.steel}
            >
              <boxGeometry args={[0.15, 0.17, 0.04]} />
            </mesh>
          ))}
          {[1.14, 1.06].map((y) => (
            <mesh key={y} position={[0, y, -0.135]} material={m.steel}>
              <boxGeometry args={[0.16, 0.06, 0.035]} />
            </mesh>
          ))}
          <mesh position={[0, 1.5, 0]} material={m.suit}>
            <cylinderGeometry args={[0.075, 0.09, 0.1, 12]} />
          </mesh>

          {/* Jet-pack */}
          <mesh position={[0, 1.27, 0.2]} material={m.dark}>
            <boxGeometry args={[0.24, 0.28, 0.1]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[0.09 * s, 1.27, 0.25]}>
              <mesh material={m.steel}>
                <cylinderGeometry args={[0.042, 0.042, 0.26, 12]} />
              </mesh>
              <mesh position={[0, 0.17, 0]} material={m.maroon}>
                <coneGeometry args={[0.042, 0.08, 12]} />
              </mesh>
              <mesh position={[0, -0.15, 0]} material={m.dark}>
                <cylinderGeometry args={[0.03, 0.042, 0.04, 12]} />
              </mesh>
            </group>
          ))}

          {/* Pauldrons (left one maroon) */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[0.25 * s, SHOULDER_Y + 0.03, 0]}
              rotation-z={-0.35 * s}
              scale={[0.12, 0.07, 0.13]}
              material={s < 0 ? m.maroon : m.steel}
            >
              <sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          ))}

          {/* Arms */}
          <group position={[-0.25, SHOULDER_Y, 0]}>
            <Arm m={m} shoulder={shoulderL} elbow={elbowL} />
          </group>
          <group position={[0.25, SHOULDER_Y, 0]}>
            <Arm m={m} shoulder={shoulderR} elbow={elbowR} hand={hand} />
          </group>

          {/* Neck, then the head on a pivot so it can bow. Skin-toned face, brown hair. */}
          <mesh position={[0, 1.53, 0]} material={m.skin}>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 12]} />
          </mesh>
          <group ref={head} position={[0, 1.54, 0]}>
            <group position={[0, HEAD_STANDING.y - 1.54, 0]}>
              <mesh scale={[0.92, 1.08, 1]} material={m.skin}>
                <sphereGeometry args={[0.105, 24, 18]} />
              </mesh>
              {/* Hair: cap over the top and back */}
              <mesh position={[0, 0.018, 0.012]} material={m.hair}>
                <sphereGeometry args={[0.108, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              </mesh>
              <mesh position={[0, -0.01, 0.03]} rotation-x={Math.PI / 2} material={m.hair}>
                <cylinderGeometry args={[0.1, 0.09, 0.09, 20, 1, true, -Math.PI / 2, Math.PI]} />
              </mesh>
              {/* Ears and nose */}
              {[-1, 1].map((sx) => (
                <mesh
                  key={sx}
                  position={[0.098 * sx, -0.005, 0.005]}
                  scale={[0.4, 1, 0.7]}
                  material={m.skin}
                >
                  <sphereGeometry args={[0.025, 10, 8]} />
                </mesh>
              ))}
              <mesh position={[0, -0.01, -0.1]} rotation-x={-Math.PI / 2} material={m.skin}>
                <coneGeometry args={[0.014, 0.03, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    );
  },
);
