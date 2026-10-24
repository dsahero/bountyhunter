/**
 * Leadership station: replaces the overhead star map with a hologram listing
 * the "rebel cells" I've run (real HTML projected into 3D, so it stays
 * readable and keyboard accessible). No side panel: everything is here.
 */
import { Html } from '@react-three/drei';
import { ANCHORS } from '../../hub/layout';
import { TIMELINE } from '../../hub/timeline';
import { LeadershipList } from '../../hub/LeadershipList';
import { Projector, useIsActive } from './common';

/** 760 CSS px across ≈ 0.7 m overhead. drei: 1px = distanceFactor / 400 m. */
const PX_TO_M = 0.7 / 760;

export function LeadershipHologram() {
  const active = useIsActive('leadership');
  const [x, y, z] = ANCHORS.leadership;
  if (!active) return null;
  return (
    <group>
      <Projector position={[x, 2.05, z + 0.05]} height={0.34} radius={0.3} active flip />
      <group position={[x, y, z]} rotation-x={TIMELINE.tilt}>
        <Html
          transform
          distanceFactor={PX_TO_M * 400}
          zIndexRange={[12, 0]}
          className="leadership-html"
        >
          <LeadershipList inWorld />
        </Html>
      </group>
    </group>
  );
}
