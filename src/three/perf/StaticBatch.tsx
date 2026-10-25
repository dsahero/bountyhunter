/**
 * Fewer draw calls for things built from many small primitives.
 *
 * Wrap content that never moves relative to the wrapper. After it mounts,
 * meshes that share a material are merged into one mesh per material (in the
 * wrapper's own space, so the wrapper itself can still move, scale, or
 * hide), and the originals are hidden. It looks exactly the same; the GPU
 * just draws a handful of meshes instead of dozens.
 *
 * Left alone (drawn as they are):
 *   - meshes with their own pointer handlers, or under a group with handlers
 *     inside the wrapper (so clicks and hover outlines keep working)
 *   - instanced, skinned, mirrored (negative scale), invisible, or
 *     multi-material meshes, and anything marked `userData.noBatch`
 *
 * Don't wrap anything that animates its parts (moving pieces stay frozen
 * where they were at mount).
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface R3FNode {
  __r3f?: { handlers?: Record<string, unknown> };
}

const hasHandlers = (o: THREE.Object3D) =>
  Object.keys((o as unknown as R3FNode).__r3f?.handlers ?? {}).length > 0;

/** Whether a mesh can be merged: plain, visible, and nothing between it and the root reacts to the pointer. */
function batchable(mesh: THREE.Mesh, root: THREE.Object3D) {
  if ((mesh as THREE.InstancedMesh).isInstancedMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh)
    return false;
  if (Array.isArray(mesh.material) || !mesh.geometry.isBufferGeometry) return false;
  if (mesh.matrixWorld.determinant() < 0) return false;
  for (let o: THREE.Object3D | null = mesh; o && o !== root; o = o.parent) {
    if (!o.visible || o.userData.noBatch || hasHandlers(o)) return false;
  }
  return true;
}

/** Meshes can only merge if their geometry has the same attributes (and indexing). */
const signature = (g: THREE.BufferGeometry) =>
  `${Object.keys(g.attributes).sort().join(',')}|${g.index ? 'i' : 'n'}|${Object.keys(g.morphAttributes).length}`;

/** Merge a root's static meshes; returns an undo function. */
export function batchStatic(root: THREE.Object3D): () => void {
  root.updateWorldMatrix(true, true);
  const toRoot = root.matrixWorld.clone().invert();
  const groups = new Map<string, THREE.Mesh[]>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !batchable(mesh, root)) return;
    const key = `${(mesh.material as THREE.Material).uuid}|${signature(mesh.geometry)}`;
    groups.set(key, [...(groups.get(key) ?? []), mesh]);
  });

  const added: THREE.Mesh[] = [];
  const hidden: THREE.Mesh[] = [];
  const local = new THREE.Matrix4();
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map((m) =>
      m.geometry.clone().applyMatrix4(local.multiplyMatrices(toRoot, m.matrixWorld)),
    );
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, meshes[0]!.material);
    mesh.name = 'static-batch';
    root.add(mesh);
    added.push(mesh);
    for (const m of meshes) {
      m.visible = false;
      hidden.push(m);
    }
  }

  return () => {
    for (const m of added) {
      root.remove(m);
      m.geometry.dispose();
    }
    for (const m of hidden) m.visible = true;
  };
}

export function StaticBatch({ children, ...props }: JSX.IntrinsicElements['group']) {
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => (root.current ? batchStatic(root.current) : undefined), []);
  return (
    <group ref={root} {...props}>
      {children}
    </group>
  );
}
