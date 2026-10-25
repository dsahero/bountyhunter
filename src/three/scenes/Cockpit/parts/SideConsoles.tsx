/** The side consoles: warrant and comms screens, the datapad, and the left button panel. */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { SIDE_TOP } from '../../../../hub/layout';
import { portfolio } from '../../../../content/portfolio';
import { lore } from '../../../../content/lore';
import { fillTokens } from '../../../../content/derived';
import { LEFT_PAD_TOP } from '../Props';
import { makeScreenTexture } from '../../../procedural/screens';
import { ButtonPanel } from '../ButtonPanel';
import { useStationClick } from '../../../stations/common';
import type { Mats } from './materials';
import { Screen, SideScreen } from './screens';

export function SideConsoles({ mats }: { mats: Mats }) {
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
