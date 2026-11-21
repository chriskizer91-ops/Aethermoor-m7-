// The stretch check (Chris, November 21: "when they move their arms they stretch themselves"): every move of a foe,
// posed at several moments, its light model skinned on the CPU, and each edge's length compared with its rest length.
// An edge longer than 1.3x its rest length is a stretch (weights bleeding from a moving bone into the body).
//   node stretch.mjs <foe key> [limit=1.3]
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readFileSync } from 'node:fs';
import { quad } from './kit/moves-quad.js';
const [key, lim = '1.3'] = process.argv.slice(2); const LIMIT = Number(lim);
const dir = new URL(`../../foes/${key}/assets/`, import.meta.url);
const meta = JSON.parse(readFileSync(new URL('light.json', dir))), bin = new Uint8Array(readFileSync(new URL('light.bin', dir)));
const foe = JSON.parse(readFileSync(new URL('../foe.json', dir)));
await MeshoptDecoder.ready;
const n = meta.vertices, S = meta.stride, vb = new Uint8Array(n * S);
MeshoptDecoder.decodeVertexBuffer(vb, n, S, bin.subarray(0, meta.vbytes));
const ib = new Uint32Array(meta.indices);
MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), meta.indices, 4, bin.subarray(meta.vbytes, meta.vbytes + meta.ibytes));
const dv = new DataView(vb.buffer), pos = new Float32Array(n * 3), ji = new Uint8Array(n * 4), jw = new Uint8Array(n * 4);
for (let i = 0; i < n; i++) {
  for (let a = 0; a < 3; a++) pos[i * 3 + a] = meta.lo[a] + dv.getUint16(i * S + a * 2, true) / 65535 * (meta.hi[a] - meta.lo[a]);
  for (let a = 0; a < 4; a++) { ji[i * 4 + a] = vb[i * S + 20 + a]; jw[i * 4 + a] = vb[i * S + 24 + a]; }
}
const g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
g.setAttribute('skinIndex', new THREE.BufferAttribute(ji, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(jw, 4, true));
g.setIndex(new THREE.BufferAttribute(ib, 1));
const bones = {}, list = [];
for (const b of meta.bones) {
  const bone = new THREE.Bone(); bone.name = b.name; const h = new THREE.Vector3(...b.head);
  if (b.parent) { bone.position.copy(h.clone().sub(new THREE.Vector3(...meta.bones.find((x) => x.name === b.parent).head))); bones[b.parent].add(bone); }
  else bone.position.copy(h);
  bones[b.name] = bone; list.push(bone);
}
const mesh = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
mesh.add(bones[meta.bones.find((b) => !b.parent).name]); mesh.bind(new THREE.Skeleton(list));
for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
const body = new THREE.Group(); body.add(mesh);
const F = { bones, body, height: foe.height };
// unique edges, skipping each rigid part's own (they move as one, so they can't stretch)
const E = new Set();
for (let t = 0; t < ib.length; t += 3) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
  const p = ib[t + a], q = ib[t + b]; E.add(p < q ? p * n + q : q * n + p);
}
const edges = Uint32Array.from([...E].flatMap((k) => [Math.floor(k / n), k % n]));
const rest = new Float32Array(edges.length / 2);
for (let e = 0; e < rest.length; e++) {
  const a = edges[e * 2], b = edges[e * 2 + 1];
  rest[e] = Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2]);
}
const v = new THREE.Vector3(), P = new Float32Array(n * 3);
const boneOf = (i) => meta.bones[ji[i * 4]].name;
let worst = 0, visWorst = 0, ruleWorst = 0; const report = [];
for (const [move] of quad.list) for (const u of [0, 0.2, 0.4, 0.5, 0.6, 0.8, 1]) {
  for (const b of Object.values(bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  quad.pose(F, move, u, 1.3, move === 'walk' ? u * Math.PI * 2 : 0);
  mesh.updateMatrixWorld(true);
  for (let i = 0; i < n; i++) { v.fromArray(pos, i * 3); mesh.applyBoneTransform(i, v); v.toArray(P, i * 3); }
  let bad = 0, vis = 0, ruleBad = 0, max = 0, at = -1; const MM = foe.height * 0.01;
  for (let e = 0; e < rest.length; e++) {
    if (rest[e] < 1e-5) continue;
    const a = edges[e * 2], b = edges[e * 2 + 1];
    const r = Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]) / rest[e];
    if (r > LIMIT) { bad++; if ((r - 1) * rest[e] > MM) vis++; }
    if ((rest[e] > MM && r > LIMIT) || r > 3) ruleBad++;
    if (r > max) { max = r; at = e; }
  }
  worst = Math.max(worst, max);
  if (process.env.WHERE === `${move}:${u}`) {
    const rs = [];
    for (let e = 0; e < rest.length; e++) { const a = edges[e * 2], b = edges[e * 2 + 1];
      const r = Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]) / rest[e];
      if (r > LIMIT) rs.push([r, a, b, rest[e]]); }
    rs.sort((x, y) => y[0] - x[0]);
    for (const [r, a, b, l] of rs.slice(0, 12)) console.log(r.toFixed(2), 'rest mm', (l * 1000).toFixed(1), 'at three xyz', [0, 1, 2].map((k) => pos[a * 3 + k].toFixed(3)).join(','),
      'w', [0, 1, 2, 3].map((k) => meta.bones[ji[a * 4 + k]].name + ':' + jw[a * 4 + k]).join(' '), '|', [0, 1, 2, 3].map((k) => meta.bones[ji[b * 4 + k]].name + ':' + jw[b * 4 + k]).join(' '));
  }
  visWorst = Math.max(visWorst, vis); ruleWorst = Math.max(ruleWorst, ruleBad);
  if (bad) report.push(`${move} u=${u}: ${bad} edges over ${LIMIT}x (${vis} also longer by over 1% of his height), worst ${max.toFixed(2)}x between ${boneOf(edges[at * 2])} and ${boneOf(edges[at * 2 + 1])}`);
}
console.log(report.length ? report.join('\n') : `no edge stretches past ${LIMIT}x in any move`);
console.log(`worst stretch: ${worst.toFixed(2)}x over ${rest.length.toLocaleString()} edges; most visibly stretched edges in one pose: ${visWorst}`);
console.log(`the lanes' rule (edges longer than 1% of the height under ${LIMIT}x, crease edges under 3x): ${ruleWorst ? 'FAIL, ' + ruleWorst + ' edges in the worst pose' : 'PASS'}`);
process.exit(ruleWorst ? 1 : 0);
