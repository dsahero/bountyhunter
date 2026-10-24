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
      {/* Visor lenses, mouth grille, chin vent */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.72, 0.36]} rotation-x={Math.PI / 2} material={material}>
          <torusGeometry args={[0.045, 0.008, 6, 20]} />
        </mesh>
      ))}
      {[-0.05, 0, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.33]} material={material}>
          <boxGeometry args={[0.018, 0.08, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0.3]} material={material}>
        <boxGeometry args={[0.14, 0.02, 0.03]} />
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
      {/* Eyes catching the light inside the hood, and a short beard */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.68, 0.22]} material={material}>
          <sphereGeometry args={[0.022, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.2]} scale={[1, 1.3, 0.7]} material={material}>
        <sphereGeometry args={[0.1, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
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
      {/* Secondary sensor and vent slats */}
      <mesh position={[0.17, 0.56, 0.26]} rotation-x={Math.PI / 2 - 0.4} material={material}>
        <torusGeometry args={[0.035, 0.008, 6, 16]} />
      </mesh>
      {[-0.12, -0.06, 0, 0.06, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.4]} material={material}>
          <boxGeometry args={[0.025, 0.07, 0.01]} />
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
      {/* Face: eyes, brows, nose, mouth, stubble beard */}
      {[-0.09, 0.09].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.7, 0.26]} material={material}>
            <sphereGeometry args={[0.025, 10, 8]} />
          </mesh>
          <mesh position={[x, 0.76, 0.26]} rotation-z={x > 0 ? -0.15 : 0.15} material={material}>
            <boxGeometry args={[0.08, 0.014, 0.02]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.63, 0.29]} rotation-x={Math.PI / 2 + 0.3} material={material}>
        <coneGeometry args={[0.03, 0.08, 8]} />
      </mesh>
      <mesh position={[0, 0.54, 0.25]} material={material}>
        <boxGeometry args={[0.1, 0.012, 0.02]} />
      </mesh>
      <mesh position={[0, 0.5, 0.16]} scale={[1, 0.9, 0.8]} material={material}>
        <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} />
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
      {/* Breather vents and cheek rivets */}
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.27]} material={material}>
          <boxGeometry args={[0.03, 0.06, 0.02]} />
        </mesh>
      ))}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.58, 0.22]} material={material}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      ))}
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
      {/* Large eyes, nostril slits, mouth */}
      {[-0.1, 0.1].map((x) => (
        <mesh
          key={x}
          position={[x, 0.86, 0.22]}
          rotation-z={x > 0 ? -0.4 : 0.4}
          scale={[1.4, 0.8, 0.5]}
          material={material}
        >
          <sphereGeometry args={[0.05, 14, 10]} />
        </mesh>
      ))}
      {[-0.025, 0.025].map((x) => (
        <mesh key={x} position={[x, 0.72, 0.27]} material={material}>
          <boxGeometry args={[0.01, 0.04, 0.01]} />
        </mesh>
      ))}
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
