/**
 * Only spend time on what's in view.
 *
 * <ViewCull> wraps a region of the cockpit (a hologram, the poster wall).
 * Every few frames it checks whether the region's bounding sphere is inside
 * the camera's view; when it isn't, the whole region is hidden, so the
 * renderer skips it entirely, and components inside can skip their
 * per-frame animation with `useInView()`. Turn your head back and it's
 * there, mid-animation, exactly as before.
 *
 * Lights must stay outside a ViewCull (hiding a light would change the
 * lighting of things you *can* see).
 */
import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Visibility {
  current: boolean;
}

const ALWAYS: Visibility = { current: true };
const InView = createContext<Visibility>(ALWAYS);

/** Whether the enclosing ViewCull region is on screen (always true outside one). */
export const useInView = () => useContext(InView);

/** Check every few frames: plenty for head turns, cheaper than every frame. */
const EVERY = 3;

export function ViewCull({
  margin = 1.6,
  children,
  ...props
}: {
  /** Grow the bounding sphere by this factor (holograms grow when focused). */
  margin?: number;
} & JSX.IntrinsicElements['group']) {
  const group = useRef<THREE.Group>(null);
  /** The group this component owns and toggles (children may set their own visibility). */
  const inner = useRef<THREE.Group>(null);
  const visible = useRef<Visibility>({ current: true }).current;
  const local = useRef(new THREE.Sphere()).current;
  const world = useRef(new THREE.Sphere()).current;
  const frustum = useRef(new THREE.Frustum()).current;
  const matrix = useRef(new THREE.Matrix4()).current;
  const frame = useRef(0);

  /** Measure the region (in its own space) once its content exists. */
  const measure = () => {
    const g = group.current;
    if (!g) return false;
    g.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(g, true);
    if (box.isEmpty()) return false;
    box.getBoundingSphere(local);
    local.applyMatrix4(matrix.copy(g.matrixWorld).invert());
    local.radius *= margin;
    return true;
  };
  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured once, at mount
  }, []);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g || frame.current++ % EVERY) return;
    if (local.radius <= 0 && !measure()) return;
    world.copy(local).applyMatrix4(g.matrixWorld);
    frustum.setFromProjectionMatrix(
      matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
    const now = frustum.intersectsSphere(world);
    if (now !== visible.current && inner.current) {
      visible.current = now;
      inner.current.visible = now;
    }
  });

  return (
    <group ref={group} {...props}>
      <group ref={inner}>
        <InView.Provider value={visible}>{children}</InView.Provider>
      </group>
    </group>
  );
}
