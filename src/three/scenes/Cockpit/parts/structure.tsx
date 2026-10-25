/** The canopy frame and the roof panels around the duct opening. */
import * as THREE from 'three';
import { DUCT, type Vec3 } from '../../../../hub/layout';
import { Beam } from '../../../procedural/Beam';

export function CanopyFrame({ mat }: { mat: THREE.Material }) {
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
export function Roof({ mat }: { mat: THREE.Material }) {
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
