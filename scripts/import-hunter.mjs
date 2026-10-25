/**
 * Turns the hunter you edited in Blender back into a rig-ready model.
 *
 *   node scripts/import-hunter.mjs [exports/hunter.obj]
 *
 * Input: an OBJ (+ .mtl) exported from Blender (Y up), whose objects keep the
 * names from `npm run export:hunter` ("Head_hair_capsule_1", "UpperArm_L_...",
 * "Helmet_..."; Blender's ".001" suffixes are fine). New pieces just need the
 * right prefix: the part before the material says which rig pivot carries it.
 *
 * It finds each piece's pivot in the original export (exports/hunter.glb),
 * undoes any whole-model move you made in Blender, converts every piece into
 * its pivot's own frame, and writes public/models/hunter.glb, which the site
 * loads in place of the procedural model (the animation keeps working).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const OBJ = process.argv[2] ?? 'exports/hunter.obj';
const MTL = OBJ.replace(/\.obj$/i, '.mtl');
const RIG = 'exports/hunter.glb';
const OUT = 'public/models/hunter.glb';

// GLTFExporter wants a FileReader (browsers have one; Node doesn't).
globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    const buf = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
    this.onloadend?.();
  }
};

/* ---------- The rig's rest pose, from the original export ---------- */
const glb = await readFile(RIG);
const jsonLength = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
const restWorld = new Map(); // node name -> world matrix
const restCenter = new Map(); // mesh name -> world-space center (to find the Blender offset)
function walk(index, parent) {
  const n = gltf.nodes[index];
  const local = new THREE.Matrix4();
  if (n.matrix) local.fromArray(n.matrix);
  else
    local.compose(
      new THREE.Vector3(...(n.translation ?? [0, 0, 0])),
      new THREE.Quaternion(...(n.rotation ?? [0, 0, 0, 1])),
      new THREE.Vector3(...(n.scale ?? [1, 1, 1])),
    );
  const world = parent.clone().multiply(local);
  restWorld.set(n.name, world);
  if (n.mesh !== undefined) {
    const acc = gltf.accessors[gltf.meshes[n.mesh].primitives[0].attributes.POSITION];
    const c = new THREE.Vector3(...acc.min).add(new THREE.Vector3(...acc.max)).multiplyScalar(0.5);
    restCenter.set(n.name, c.applyMatrix4(world));
  }
  (n.children ?? []).forEach((c) => walk(c, world));
}
gltf.scenes[0].nodes.forEach((i) => walk(i, new THREE.Matrix4()));
const pivotNames = [...restWorld.keys()].filter((name) => !restCenter.has(name));

/* ---------- Materials: Blender's colors, the site's surface feel ---------- */
const FEEL = {
  suit: { metalness: 0, roughness: 0.9 },
  steel: { metalness: 0.75, roughness: 0.38 },
  dark: { metalness: 0.5, roughness: 0.5 },
  maroon: { metalness: 0.45, roughness: 0.45 },
  orange: { metalness: 0.4, roughness: 0.5 },
  leather: { metalness: 0, roughness: 0.85 },
  skin: { metalness: 0, roughness: 0.6 },
  hair: { metalness: 0, roughness: 0.75 },
  eyeWhite: { metalness: 0, roughness: 0.3 },
  iris: { metalness: 0, roughness: 0.2 },
  lips: { metalness: 0, roughness: 0.5 },
  helmet_shell: { metalness: 0.7, roughness: 0.32 },
  helmet_dark: { metalness: 0.5, roughness: 0.5 },
  helmet_visor: { metalness: 0.9, roughness: 0.12, side: THREE.DoubleSide },
  helmet_stripe: { metalness: 0.4, roughness: 0.5 },
};
const materials = new Map();
let current = null;
for (const line of (await readFile(MTL, 'utf8')).split(/\r?\n/)) {
  const [key, ...rest] = line.trim().split(/\s+/);
  if (key === 'newmtl') {
    const name = rest.join(' ');
    const base = name.split('.')[0];
    current = new THREE.MeshStandardMaterial({ name: base, ...(FEEL[base] ?? { roughness: 0.6 }) });
    materials.set(name, current);
  } else if (key === 'Kd' && current) {
    // Blender writes linear color.
    current.color.setRGB(+rest[0], +rest[1], +rest[2], THREE.LinearSRGBColorSpace);
  } else if (key === 'd' && current && +rest[0] < 1) {
    current.transparent = true;
    current.opacity = +rest[0];
  }
}

/* ---------- The edited model ---------- */
const obj = new OBJLoader().parse(await readFile(OBJ, 'utf8'));
obj.updateMatrixWorld(true);

/** The rig pivot a piece belongs to: the longest pivot name its own name starts with. */
const pivotFor = (name) =>
  pivotNames
    .filter((p) => name === p || name.startsWith(`${p}_`))
    .sort((a, b) => b.length - a.length)[0];

// Any whole-model move made in Blender: the typical offset of unchanged pieces.
const deltas = [];
obj.traverse((m) => {
  if (!m.isMesh || !restCenter.has(m.name)) return;
  m.geometry.computeBoundingBox();
  const c = m.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld);
  deltas.push(c.sub(restCenter.get(m.name)));
});
const median = (k) => {
  const v = deltas.map((d) => d[k]).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
};
const offset = new THREE.Vector3(median('x'), median('y'), median('z'));
console.log(
  `Blender offset undone: ${offset
    .toArray()
    .map((v) => v.toFixed(3))
    .join(', ')}`,
);

const out = new THREE.Group();
const groups = new Map();
const skipped = [];
obj.traverse((m) => {
  if (!m.isMesh) return;
  const pivot = pivotFor(m.name);
  if (!pivot) return skipped.push(m.name);
  // World (Blender) -> undo the offset -> the pivot's rest frame.
  const toPivot = restWorld.get(pivot).clone().invert();
  const geometry = m.geometry.clone().applyMatrix4(m.matrixWorld);
  geometry.translate(-offset.x, -offset.y, -offset.z);
  geometry.applyMatrix4(toPivot);
  // OBJ triangles come unshared; weld identical vertices to shrink the file.
  const welded = mergeVertices(geometry, 1e-5);
  welded.computeBoundingSphere();
  const mats = (Array.isArray(m.material) ? m.material : [m.material]).map(
    (mat) => materials.get(mat.name) ?? new THREE.MeshStandardMaterial({ name: mat.name }),
  );
  const mesh = new THREE.Mesh(welded, mats.length === 1 ? mats[0] : mats);
  mesh.name = m.name.replace(/\./g, '_');
  if (!groups.has(pivot)) {
    const g = new THREE.Group();
    g.name = pivot;
    groups.set(pivot, g);
  }
  groups.get(pivot).add(mesh);
});
// Keep the root names findable: Hunter's pivots under "Hunter", the helmet as "Helmet".
const hunter = new THREE.Group();
hunter.name = 'Hunter';
for (const [name, g] of groups) (name === 'Helmet' ? out : hunter).add(g);
out.add(hunter);
if (skipped.length) console.warn(`No rig pivot for (skipped): ${skipped.join(', ')}`);

const result = await new GLTFExporter().parseAsync(out, { binary: true });
await mkdir('public/models', { recursive: true });
await writeFile(OUT, Buffer.from(result));
console.log(
  `Wrote ${OUT}: ${[...groups.values()].reduce((n, g) => n + g.children.length, 0)} pieces on ${groups.size} pivots`,
);
