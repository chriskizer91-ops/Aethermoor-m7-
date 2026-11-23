// track.mjs (Places' desert-and-deep lane): where a bone is through a move, in the model's own frame (x right, y up,
// z forward as the loader builds it), every tenth of the move.
//   node pages/desert-deep/tools/track.mjs foes/<key> <move> <bone> <moves.js>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { decodeLight, buildSkinned, ready, applyHelpers } from '../../../kit/js/loader.js';
const [dirA, move, boneName, movesPath] = process.argv.slice(2);
const dir = path.resolve(dirA);
await ready();
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'assets/light.json')));
const geo = decodeLight(meta, new Uint8Array(fs.readFileSync(path.join(dir, 'assets/light.bin'))));
const { mesh, bones } = buildSkinned({ geo, mat: new THREE.MeshBasicMaterial(), meta });
const group = new THREE.Group(), body = new THREE.Group(); group.add(body); body.add(mesh);
for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
const moves = await import(pathToFileURL(path.resolve(movesPath)).href);
const F = { group, body, mesh, bones, key: meta.key, height: meta.height, helpers: meta.helpers || [] };
const reset = () => { for (const b of Object.values(bones)) { b.rotation.set(0, 0, 0); b.quaternion.identity(); b.position.copy(b.userData.p0); } body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); };
if (process.env.LEANS) {
  for (const lo of [0.2, 0.4, 0.6, 0.8, 1.0]) for (const hi of [-1.2, -0.9, -0.6, -0.3, 0, 0.3]) {
    globalThis.__LEAN = [lo, hi]; reset(); moves.pose(F, 'idle', 0, 0, 0); group.updateMatrixWorld(true);
    const q = new THREE.Vector3().setFromMatrixPosition(bones[boneName].matrixWorld);
    console.log('low', lo, 'high', hi, 'up', q.y.toFixed(2), 'fwd', q.z.toFixed(2));
  }
  process.exit(0);
}
for (let i = 0; i <= 10; i++) {
  const u = i / 10; reset(); moves.pose(F, move, u, 0, 0); applyHelpers(F); group.updateMatrixWorld(true);
  const q = new THREE.Vector3().setFromMatrixPosition(bones[boneName].matrixWorld);
  console.log(u.toFixed(1), 'x', q.x.toFixed(3), 'up', q.y.toFixed(3), 'fwd', q.z.toFixed(3));
}
