/**
 * Naming the hunter's rig, and swapping in a modeled version of it.
 *
 * The procedural hunter (Hunter.tsx) is a tree of pivot groups (Body, Spine,
 * Neck, Head, UpperArm_L, Forearm_L, Hand_L, Hip_L, Knee_L, ...) holding
 * primitive meshes. `nameRig` gives those pivots stable names. The modeled
 * hunter (public/models/hunter.glb, made by scripts/import-hunter.mjs from a
 * Blender export) is the same set of pivot names, each holding its meshes in
 * that pivot's own frame. `useModeledParts` moves those meshes onto the live
 * pivots, replacing the primitives, so the animation drives the new model.
 * If the file is missing, the procedural model simply stays.
 */
import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const MODEL_URL = '/models/hunter.glb';

/** Material colors in Hunter.tsx / Helmet.tsx -> names (for Blender's material list). */
const MATERIAL_NAMES: Record<string, string> = {
  '4d4636': 'suit',
  '8c949b': 'steel',
  '3a3d42': 'dark',
  '7a2733': 'maroon',
  c6602a: 'orange',
  '5a4630': 'leather',
  c99878: 'skin',
  '3b2618': 'hair',
  f2efe9: 'eyeWhite',
  '3d2a1c': 'iris',
  a8645a: 'lips',
  a7aeb5: 'helmet_shell',
  '2b2e33': 'helmet_dark',
  '050506': 'helmet_visor',
  '6e1f2c': 'helmet_stripe',
};

const near = (a: number, b: number) => Math.abs(a - b) < 2e-3;
const side = (x: number) => (x < 0 ? 'L' : 'R');

/** A body-part name for a pivot group, from where it sits under its parent. */
function groupName(g: THREE.Object3D, parent: string, index: number) {
  const { x, y } = g.position;
  if (parent === 'Hunter' && index === 0) return 'Body';
  if (parent === 'Body' && near(Math.abs(x), 0.11)) return `Leg_${side(x)}`;
  if (parent.startsWith('Leg_')) return `Hip_${parent.slice(-1)}`;
  if (parent.startsWith('Hip_') && near(y, -0.43)) return `Knee_${parent.slice(-1)}`;
  if (parent === 'Body' && near(y, 0.98)) return 'Spine';
  if (parent === 'Spine' && near(Math.abs(x), 0.24)) return `Shoulder_${side(x)}`;
  if (parent.startsWith('Shoulder_')) return `UpperArm_${parent.slice(-1)}`;
  if (parent.startsWith('UpperArm_')) return `Forearm_${parent.slice(-1)}`;
  if (parent.startsWith('Forearm_')) return `Hand_${parent.slice(-1)}`;
  if (parent === 'Spine' && near(y, 0.6)) return 'Neck';
  if (parent === 'Neck' && near(y, 0.12)) return 'Head';
  if (parent === 'Spine' && near(y, 0.29)) return `Jetpack_${side(x)}`;
  if (parent === 'Head' && near(Math.abs(x), 0.036)) return `Eye_${side(x)}`;
  return `${parent}_group${index}`;
}

/**
 * Name every pivot group under `root` (and, with `meshes`, every mesh and
 * material too, e.g. "Head_hair_capsule_2" with material "hair").
 */
export function nameRig(root: THREE.Object3D, rootName: string, meshes = false) {
  root.name = rootName;
  const counts = new Map<string, number>();
  const visit = (o: THREE.Object3D) => {
    o.children.forEach((c, i) => {
      if ((c as THREE.Mesh).isMesh) {
        if (!meshes || c.name) return;
        const mesh = c as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const matName = MATERIAL_NAMES[mat.color?.getHexString() ?? ''] ?? 'material';
        mat.name = matName;
        const shape = mesh.geometry.type.replace('Geometry', '').toLowerCase();
        const key = `${o.name}_${matName}_${shape}`;
        const n = (counts.get(key) ?? 0) + 1;
        counts.set(key, n);
        mesh.name = `${key}_${n}`;
      } else {
        c.name = groupName(c, o.name, i);
        visit(c);
      }
    });
  };
  visit(root);
}

let model: Promise<THREE.Object3D | null> | null = null;

/** The modeled parts (loaded once, shared). Resolves to null if there's no file. */
export function loadModel() {
  model ??= new GLTFLoader()
    .loadAsync(MODEL_URL)
    .then((gltf) => gltf.scene)
    .catch(() => null);
  return model;
}

/**
 * Swap a rig's primitive meshes for the modeled ones, pivot by pivot.
 * `rootName` is 'Hunter' for the body or 'Helmet' for the helmet.
 */
export function useModeledParts(
  ref: React.RefObject<THREE.Object3D | null> | (() => THREE.Object3D | null | undefined),
  rootName: 'Hunter' | 'Helmet',
) {
  useEffect(() => {
    let cancelled = false;
    void loadModel().then((scene) => {
      const root = typeof ref === 'function' ? ref() : ref.current;
      if (cancelled || !scene || !root) return;
      const source = scene.getObjectByName(rootName);
      if (!source) return;
      if (rootName === 'Hunter') nameRig(root, 'Hunter');
      else root.name = 'Helmet';
      const pivots = new Map<string, THREE.Object3D>();
      root.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) pivots.set(o.name, o);
      });
      // Primitives off; modeled parts on (each already in its pivot's frame).
      for (const pivot of pivots.values())
        pivot.children.filter((c) => (c as THREE.Mesh).isMesh).forEach((m) => pivot.remove(m));
      source.traverse((part) => {
        if (!(part as THREE.Mesh).isMesh) return;
        const pivot = pivots.get(part.parent?.name ?? '');
        if (pivot) pivot.add(part.clone());
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ref, rootName]);
}
