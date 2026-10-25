/**
 * The hunter: an armored human in the spirit of the animated-series
 * Mandalorian bounty hunters.
 *
 * Rig (no skeleton file, just pivots):
 *   body    sits (lowers into the seat) and turns
 *   legs    hip + knee pivots (sitting bends the knees)
 *   spine   pivot at the hips, so they can lean forward
 *   head    neck pivot, so they can bow
 *   arms    two-bone IK: give each hand a target and a weight (0 = rest,
 *           1 = on target) and the elbows bend naturally out and down
 *
 * Pose numbers (tweened by the director): sit, lean, nod, turn.
 * Origin is between the feet; the hunter faces -Z.
 *
 * The primitives below are the fallback and the rig. If public/models/
 * hunter.glb exists (your Blender model; see scripts/import-hunter.mjs),
 * its pieces replace the primitives on the same pivots.
 */
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { aimBone, solveElbow } from './ik';
import { useModeledParts } from './hunterParts';

interface HunterPose {
  sit: number;
  lean: number;
  nod: number;
  turn: number;
}

export interface HunterHandle {
  root: THREE.Group;
  /** Neck pivot; the worn helmet follows its world position and rotation. */
  head: THREE.Group;
  pose: HunterPose;
  /** Hand targets (world) and weights (0 = rest pose, 1 = on target). */
  reach: (left: THREE.Vector3, wl: number, right: THREE.Vector3, wr: number) => void;
  /** Center of the head in world space. */
  headWorld: () => THREE.Vector3;
  /** Hair (anything with the "hair" material): hidden while the helmet is on. */
  hair: { visible: boolean };
}

const SIT_DROP = 0.44;
const HIP_Y = 0.92;
const SHOULDER_Y = 0.5; // above the spine pivot
const NECK_Y = 0.6; // above the spine pivot
const UPPER = 0.29;
const LOWER = 0.3;

function useMaterials() {
  return useMemo(
    () => ({
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
      skin: new THREE.MeshStandardMaterial({ color: '#c99878', roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ name: 'hair', color: '#3b2618', roughness: 0.75 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: '#f2efe9', roughness: 0.3 }),
      iris: new THREE.MeshStandardMaterial({ color: '#3d2a1c', roughness: 0.2 }),
      lips: new THREE.MeshStandardMaterial({ color: '#a8645a', roughness: 0.5 }),
    }),
    [],
  );
}

type Mats = ReturnType<typeof useMaterials>;

/** Which side a limb is on (the hunter's left is -X). Names the rig pivots. */
type Side = 'L' | 'R';
const sideOf = (s: number): Side => (s < 0 ? 'L' : 'R');

function Leg({
  m,
  side,
  hip,
  knee,
}: {
  m: Mats;
  side: Side;
  hip: React.RefObject<THREE.Group>;
  knee: React.RefObject<THREE.Group>;
}) {
  return (
    <group ref={hip} name={`Hip_${side}`}>
      <mesh position={[0, -0.21, 0]} material={m.suit}>
        <capsuleGeometry args={[0.08, 0.3, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.2, -0.07]} rotation-x={0.05} material={m.steel}>
        <boxGeometry args={[0.13, 0.24, 0.035]} />
      </mesh>
      <group ref={knee} name={`Knee_${side}`} position={[0, -0.43, 0]}>
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

/** Upper arm (pivot at the shoulder) with the forearm (pivot at the elbow) and hand. */
function Arm({
  m,
  side,
  upper,
  lower,
}: {
  m: Mats;
  side: Side;
  upper: React.RefObject<THREE.Group>;
  lower: React.RefObject<THREE.Group>;
}) {
  return (
    <group ref={upper} name={`UpperArm_${side}`}>
      <mesh position={[0, -UPPER / 2, 0]} material={m.suit}>
        <capsuleGeometry args={[0.056, UPPER - 0.08, 4, 8]} />
      </mesh>
      <mesh position={[0, -UPPER * 0.35, 0]} material={m.steel}>
        <cylinderGeometry args={[0.064, 0.06, 0.1, 10]} />
      </mesh>
      <group ref={lower} name={`Forearm_${side}`} position={[0, -UPPER, 0]}>
        <mesh position={[0, -LOWER * 0.45, 0]} material={m.suit}>
          <capsuleGeometry args={[0.05, LOWER - 0.12, 4, 8]} />
        </mesh>
        <mesh position={[0, -LOWER * 0.55, 0]} material={m.steel}>
          <cylinderGeometry args={[0.06, 0.054, 0.15, 10]} />
        </mesh>
        <mesh position={[0, -LOWER * 0.85, 0]} material={m.orange}>
          <cylinderGeometry args={[0.058, 0.058, 0.018, 10]} />
        </mesh>
        {/* Hand: palm, four fingers, thumb */}
        <group name={`Hand_${side}`} position={[0, -LOWER, 0]}>
          <mesh position={[0, -0.03, 0]} material={m.skin}>
            <boxGeometry args={[0.07, 0.07, 0.03]} />
          </mesh>
          {[-0.024, -0.008, 0.008, 0.024].map((x) => (
            <mesh key={x} position={[x, -0.085, 0.004]} rotation-x={0.25} material={m.skin}>
              <capsuleGeometry args={[0.0075, 0.035, 2, 6]} />
            </mesh>
          ))}
          <mesh position={[0.04, -0.03, -0.014]} rotation-z={0.7} material={m.skin}>
            <capsuleGeometry args={[0.009, 0.03, 2, 6]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** A face, with real proportions: eyes, brows, nose, lips, ears, long hair. Faces -Z. */
function Head({ m }: { m: Mats }) {
  return (
    <group name="Head" position={[0, 0.12, 0]}>
      <mesh scale={[0.9, 1.1, 1]} material={m.skin}>
        <sphereGeometry args={[0.105, 32, 24]} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, -0.06, -0.02]} scale={[0.85, 0.6, 0.9]} material={m.skin}>
        <sphereGeometry args={[0.085, 20, 14]} />
      </mesh>
      {/* Hair: cap over the top and back, with a hairline */}
      <mesh position={[0, 0.02, 0.014]} scale={[0.93, 1.06, 1.0]} material={m.hair}>
        <sphereGeometry args={[0.108, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      <mesh position={[0, -0.005, 0.035]} scale={[0.92, 1.05, 0.9]} material={m.hair}>
        <sphereGeometry
          args={[0.107, 28, 18, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.3, Math.PI * 0.45]}
        />
      </mesh>
      {/* Long hair: a curtain down the back past the shoulders, and locks framing the face */}
      <mesh position={[0, -0.14, 0.07]} rotation-x={-0.15} scale={[1, 1, 0.45]} material={m.hair}>
        <capsuleGeometry args={[0.088, 0.26, 6, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0.088 * s, -0.1, 0.02]}
          rotation-z={0.08 * s}
          scale={[0.75, 1, 1.3]}
          material={m.hair}
        >
          <capsuleGeometry args={[0.026, 0.17, 4, 10]} />
        </mesh>
      ))}
      {/* Eyes: white, iris; brows */}
      {[-1, 1].map((s) => (
        <group key={s} name={`Eye_${sideOf(s)}`} position={[0.036 * s, 0.012, -0.09]}>
          <mesh material={m.eyeWhite}>
            <sphereGeometry args={[0.014, 14, 10]} />
          </mesh>
          <mesh position={[0, 0, -0.011]} material={m.iris}>
            <sphereGeometry args={[0.0068, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.022, -0.004]} rotation-z={-0.12 * s} material={m.hair}>
            <boxGeometry args={[0.03, 0.006, 0.008]} />
          </mesh>
        </group>
      ))}
      {/* Nose */}
      <mesh position={[0, -0.012, -0.105]} rotation-x={-0.35} material={m.skin}>
        <coneGeometry args={[0.012, 0.035, 10]} />
      </mesh>
      {/* Lips */}
      <mesh position={[0, -0.05, -0.088]} scale={[1, 0.45, 0.6]} material={m.lips}>
        <sphereGeometry args={[0.018, 12, 8]} />
      </mesh>
      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0.096 * s, -0.005, 0.005]}
          scale={[0.35, 1, 0.7]}
          material={m.skin}
        >
          <sphereGeometry args={[0.026, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export const Hunter = forwardRef<HunterHandle, JSX.IntrinsicElements['group']>(
  function Hunter(props, ref) {
    const m = useMaterials();
    const root = useRef<THREE.Group>(null);
    const hair = useMemo(() => ({ visible: true }), []);
    // The modeled hunter (public/models/hunter.glb) replaces these primitives once loaded.
    useModeledParts(root, 'Hunter');
    const body = useRef<THREE.Group>(null);
    const spine = useRef<THREE.Group>(null);
    const head = useRef<THREE.Group>(null);
    const hipL = useRef<THREE.Group>(null);
    const hipR = useRef<THREE.Group>(null);
    const kneeL = useRef<THREE.Group>(null);
    const kneeR = useRef<THREE.Group>(null);
    const upperL = useRef<THREE.Group>(null);
    const upperR = useRef<THREE.Group>(null);
    const lowerL = useRef<THREE.Group>(null);
    const lowerR = useRef<THREE.Group>(null);
    const pose = useRef<HunterPose>({ sit: 0, lean: 0, nod: 0, turn: 0 }).current;
    const hands = useRef({
      left: new THREE.Vector3(),
      right: new THREE.Vector3(),
      wl: 0,
      wr: 0,
    }).current;
    const v = useMemo(
      () => ({
        shoulder: new THREE.Vector3(),
        rest: new THREE.Vector3(),
        goal: new THREE.Vector3(),
        elbow: new THREE.Vector3(),
        pole: new THREE.Vector3(),
        head: new THREE.Vector3(),
        q: new THREE.Quaternion(),
      }),
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        root: root.current!,
        head: head.current!,
        pose,
        reach: (l, wl, r, wr) => {
          hands.left.copy(l);
          hands.right.copy(r);
          hands.wl = wl;
          hands.wr = wr;
        },
        headWorld: () => {
          head.current!.updateWorldMatrix(true, false);
          return head.current!.localToWorld(v.head.set(0, 0.12, 0));
        },
        hair,
      }),
      [pose, hands, v, hair],
    );

    useFrame(() => {
      // Hair on/off (also catches modeled parts that load later).
      root.current?.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (mat && !Array.isArray(mat) && mat.name.startsWith('hair')) o.visible = hair.visible;
      });
      const parts = [
        body,
        spine,
        head,
        hipL,
        hipR,
        kneeL,
        kneeR,
        upperL,
        upperR,
        lowerL,
        lowerR,
      ].map((r) => r.current);
      if (parts.some((p) => !p)) return;
      type G = THREE.Group;
      const [b, sp, hd, hl, hr, kl, kr, ul, ur, ll, lr] = parts as [
        G,
        G,
        G,
        G,
        G,
        G,
        G,
        G,
        G,
        G,
        G,
      ];

      // Body: sit (lower, thighs forward, knees bent), turn, lean, bow.
      b.position.y = -SIT_DROP * pose.sit;
      b.rotation.y = pose.turn;
      hl.rotation.x = hr.rotation.x = 1.5 * pose.sit;
      kl.rotation.x = kr.rotation.x = -1.45 * pose.sit;
      sp.rotation.x = -pose.lean; // negative X tips the chest forward (toward -Z)
      hd.rotation.x = -0.45 * pose.nod;
      root.current!.updateMatrixWorld(true);

      // Arms: blend each hand between its rest spot and its target, then solve the elbow.
      for (const [side, upper, lower, target, w] of [
        [-1, ul, ll, hands.left, hands.wl],
        [1, ur, lr, hands.right, hands.wr],
      ] as const) {
        upper.getWorldPosition(v.shoulder);
        // Rest: hanging at the side when standing; on the thigh when seated (spine space).
        v.rest
          .set(side * (0.04 - 0.14 * pose.sit), -0.55 + 0.13 * pose.sit, -0.07 - 0.25 * pose.sit)
          .applyQuaternion(sp.getWorldQuaternion(v.q))
          .add(v.shoulder);
        v.goal.lerpVectors(v.rest, target, THREE.MathUtils.clamp(w, 0, 1));
        // Elbows bend out to the side and down (and slightly back), like a person's.
        v.pole.set(side * 0.9, -0.7, 0.35).applyQuaternion(b.getWorldQuaternion(v.q));
        solveElbow(v.shoulder, v.goal, UPPER, LOWER, v.pole, v.elbow);
        aimBone(upper, v.shoulder, v.elbow);
        upper.updateMatrixWorld(true);
        aimBone(lower, v.elbow, v.goal);
      }
    });

    return (
      <group ref={root} name="Hunter" {...props}>
        <group ref={body} name="Body">
          <group name="Leg_L" position={[-0.11, HIP_Y, 0]}>
            <Leg m={m} side="L" hip={hipL} knee={kneeL} />
          </group>
          <group name="Leg_R" position={[0.11, HIP_Y, 0]}>
            <Leg m={m} side="R" hip={hipR} knee={kneeR} />
          </group>
          {/* Belt, buckle, pouches, hip plates */}
          <mesh position={[0, 0.96, 0]} material={m.leather}>
            <cylinderGeometry args={[0.175, 0.17, 0.08, 16]} />
          </mesh>
          <mesh position={[0, 0.96, -0.17]} material={m.orange}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
          </mesh>
          {[-0.14, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.94, -0.1]} material={m.leather}>
              <boxGeometry args={[0.06, 0.07, 0.05]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.17 * s, 0.85, 0]} rotation-z={0.15 * s} material={m.maroon}>
              <boxGeometry args={[0.05, 0.16, 0.18]} />
            </mesh>
          ))}

          {/* Spine: everything from the waist up leans together */}
          <group ref={spine} name="Spine" position={[0, 0.98, 0]}>
            <mesh position={[0, 0.22, 0]} scale={[1.15, 1, 0.8]} material={m.suit}>
              <capsuleGeometry args={[0.17, 0.28, 4, 12]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[0.085 * s, 0.33, -0.135]}
                rotation={[0.1, 0.28 * s, 0]}
                material={m.steel}
              >
                <boxGeometry args={[0.15, 0.17, 0.04]} />
              </mesh>
            ))}
            {[0.16, 0.08].map((y) => (
              <mesh key={y} position={[0, y, -0.135]} material={m.steel}>
                <boxGeometry args={[0.16, 0.06, 0.035]} />
              </mesh>
            ))}
            {/* Jet-pack */}
            <mesh position={[0, 0.29, 0.2]} material={m.dark}>
              <boxGeometry args={[0.24, 0.28, 0.1]} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s} name={`Jetpack_${sideOf(s)}`} position={[0.09 * s, 0.29, 0.25]}>
                <mesh material={m.steel}>
                  <cylinderGeometry args={[0.042, 0.042, 0.26, 12]} />
                </mesh>
                <mesh position={[0, 0.17, 0]} material={m.maroon}>
                  <coneGeometry args={[0.042, 0.08, 12]} />
                </mesh>
              </group>
            ))}
            {/* Pauldrons (left one maroon) */}
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[0.25 * s, SHOULDER_Y - 0.02, 0]}
                rotation-z={-0.35 * s}
                scale={[0.12, 0.07, 0.13]}
                material={s < 0 ? m.maroon : m.steel}
              >
                <sphereGeometry args={[1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
            ))}
            <group name="Shoulder_L" position={[-0.24, SHOULDER_Y - 0.06, 0]}>
              <Arm m={m} side="L" upper={upperL} lower={lowerL} />
            </group>
            <group name="Shoulder_R" position={[0.24, SHOULDER_Y - 0.06, 0]}>
              <Arm m={m} side="R" upper={upperR} lower={lowerR} />
            </group>
            {/* Neck and head */}
            <mesh position={[0, NECK_Y - 0.06, 0]} material={m.skin}>
              <cylinderGeometry args={[0.045, 0.05, 0.08, 12]} />
            </mesh>
            <group ref={head} name="Neck" position={[0, NECK_Y, 0]}>
              <Head m={m} />
            </group>
          </group>
        </group>
      </group>
    );
  },
);
