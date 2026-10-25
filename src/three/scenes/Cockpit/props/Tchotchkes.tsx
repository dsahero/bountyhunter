/**
 * The tchotchkes, each at its spot (hub/layout.ts PROPS), clickable for its
 * flavor text, and rattling when the hull rumbles; plus the black pad under
 * the left console's buttons.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PROPS, SIDE_TOP, type PropId } from '../../../../hub/layout';
import { useHub } from '../../../../state/hub';
import { rumbleAt } from '../../../../hub/rumble';
import { useReducedMotion } from '../../../../lib/reducedMotion';
import { useClickable } from '../../../stations/common';
import { metal } from './materials';
import { Levers } from './Levers';
import { FlipSwitches } from './FlipSwitches';
import { HangingDice } from './HangingDice';
import { Mug } from './Mug';
import { Plant } from './Plant';
import { BobbleDroid } from './BobbleDroid';
import { PictureFrame } from './PictureFrame';

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
