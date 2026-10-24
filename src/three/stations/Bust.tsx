/**
 * Hologram busts for the "known associates" (skills), one builder per
 * archetype. Every design is original and built from primitives:
 *
 *   trooper   rounded helmet, horizontal visor band, ridged cheek vents
 *             (deliberately not the canon T-visor)
 *   jedi      deep hood with the face lost in shadow, robe collar
 *   droid     domed head, single lens eye, antenna
 *   smuggler  bare head, wide-brim hat, scarf
 *   merc      angular helmet with twin slits, shoulder pauldron
 *   alien     tall head with horns and hanging tendrils
 *
 * Units: the bust is ~1 tall (shoulders at y = 0); scale it down to place it.
 * Faces +Z.
 */
import type { Archetype } from '../../content/schema';
import type { HoloMaterial } from '../holo/holoMaterial';

type Props = { material: HoloMaterial };

function Shoulders({ material }: Props) {
  return (
    <>
      <mesh position={[0, 0.05, 0]} scale={[1.25, 0.42, 0.62]} material={material}>
        <sphereGeometry args={[0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={material}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 14]} />
      </mesh>
    </>
  );
}

function Trooper({ material }: Props) {
  return (
    <>
      <Shoulders material={material} />
      <mesh position={[0, 0.68, 0]} scale={[1, 1.12, 1.05]} material={material}>
        <sphereGeometry args={[0.34, 24, 18]} />
      </mesh>
      <mesh position={[0, 0.72, 0.3]} material={material}>
        <boxGeometry args={[0.5, 0.09, 0.12]} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <group key={x} position={[x, 0.5, 0.24]} rotation-y={x > 0 ? 0.4 : -0.4}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, -i * 0.045, 0]} material={material}>
              <boxGeometry args={[0.12, 0.022, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.04, 0]} material={material}>
        <boxGeometry args={[0.05, 0.08, 0.5]} />
      </mesh>
    </>
  );
}

function Jedi({ material }: Props) {
  return (
    <>
      <Shoulders material={material} />
      {/* Hood: a sphere shell opened at the front */}
      {/* phi = π/2 points at +Z, so start past it and wrap around, leaving the front open */}
      <mesh position={[0, 0.7, -0.03]} scale={[1, 1.2, 1.1]} material={material}>
        <sphereGeometry
          args={[0.38, 24, 18, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.75]}
        />
      </mesh>
      {/* Face in shadow: a dim, smaller head inside the hood */}
      <mesh position={[0, 0.64, 0.05]} scale={0.7} material={material}>
        <sphereGeometry args={[0.28, 16, 12]} />
      </mesh>
      {/* Robe collar folds */}
      <mesh position={[0, 0.3, 0.12]} rotation-x={0.4} material={material}>
        <torusGeometry args={[0.24, 0.05, 8, 20, Math.PI]} />
      </mesh>
    </>
  );
}

function Droid({ material }: Props) {
  return (
    <>
      <mesh position={[0, 0.2, 0]} material={material}>
        <cylinderGeometry args={[0.36, 0.4, 0.5, 20]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={material}>
        <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.62, 0.27]} rotation-x={Math.PI / 2 - 0.5} material={material}>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
      </mesh>
      <mesh position={[0.18, 0.9, 0]} material={material}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
      </mesh>
      {[0.25, 0.1].map((y) => (
        <mesh key={y} position={[0, y, 0.39]} material={material}>
          <boxGeometry args={[0.3, 0.04, 0.02]} />
        </mesh>
      ))}
    </>
  );
}

function Smuggler({ material }: Props) {
  return (
    <>
      <Shoulders material={material} />
      <mesh position={[0, 0.66, 0]} scale={[0.9, 1.1, 0.95]} material={material}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={material}>
        <cylinderGeometry args={[0.62, 0.62, 0.03, 28]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} material={material}>
        <cylinderGeometry args={[0.24, 0.3, 0.2, 20]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation-x={Math.PI / 2} material={material}>
        <torusGeometry args={[0.18, 0.06, 8, 20]} />
      </mesh>
    </>
  );
}

function Merc({ material }: Props) {
  return (
    <>
      <Shoulders material={material} />
      <mesh position={[0, 0.7, 0]} rotation-y={Math.PI / 4} material={material}>
        <cylinderGeometry args={[0.28, 0.33, 0.62, 4]} />
      </mesh>
      {[0.74, 0.62].map((y) => (
        <mesh key={y} position={[0, y, 0.25]} material={material}>
          <boxGeometry args={[0.36, 0.035, 0.05]} />
        </mesh>
      ))}
      <mesh position={[-0.4, 0.18, 0]} rotation-z={0.5} material={material}>
        <boxGeometry args={[0.32, 0.08, 0.4]} />
      </mesh>
      <mesh position={[0.3, 0.95, -0.05]} rotation-z={-0.3} material={material}>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
      </mesh>
    </>
  );
}

function Alien({ material }: Props) {
  return (
    <>
      <Shoulders material={material} />
      <mesh position={[0, 0.72, 0]} scale={[0.85, 1.45, 0.9]} material={material}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.2 * s, 1.08, -0.02]} rotation-z={-0.5 * s} material={material}>
          <coneGeometry args={[0.05, 0.3, 10]} />
        </mesh>
      ))}
      {[-0.18, -0.06, 0.06, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.12]} material={material}>
          <capsuleGeometry args={[0.025, 0.3, 4, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0.25]} material={material}>
        <boxGeometry args={[0.34, 0.05, 0.05]} />
      </mesh>
    </>
  );
}

const BUILDERS: Record<Archetype, (p: Props) => JSX.Element> = {
  trooper: Trooper,
  jedi: Jedi,
  droid: Droid,
  smuggler: Smuggler,
  merc: Merc,
  alien: Alien,
};

export function Bust({ archetype, material }: { archetype: Archetype; material: HoloMaterial }) {
  const Builder = BUILDERS[archetype];
  return <Builder material={material} />;
}
