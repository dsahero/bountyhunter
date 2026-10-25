/** Your helmet on the shelf: click it to take a look (it turns on the spot). */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HELMET_ON_SHELF } from '../../../../hub/layout';
import { useHub } from '../../../../state/hub';
import { useClickable } from '../../../stations/common';
import { Helmet } from '../Helmet';

export function ShelfHelmet() {
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
