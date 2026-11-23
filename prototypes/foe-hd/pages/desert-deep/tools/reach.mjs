// reach.mjs (Places' desert-and-deep lane, November 23): how far forward a bone's tip reaches during a move, measured
// along the foe's own forward line (its body bone toward its head), in metres ahead of the head's front.
//   node pages/desert-deep/tools/reach.mjs foes/<key> <move> <bone> [moves.js]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { decodeLight, buildSkinned, ready, applyHelpers } from '../../../kit/js/loader.js';
const [dirA, move, boneName, movesPath = 'pages/desert-deep/moves/scorpion.js'] = process.argv.slice(2);
const dir = path.resolve(dirA);
await ready();
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'assets/light.json')));
const geo = decodeLight(meta, new Uint8Array(fs.readFileSync(path.join(dir, 'assets/light.bin'))));
const { mesh, bones } = buildSkinned({ geo, mat: new THREE.MeshBasicMaterial(), meta });
const group = new THREE.Group(), body = new THREE.Group(); group.add(body); body.add(mesh);
for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
const moves = await import(pathToFileURL(path.resolve(movesPath)).href);
const F = { group, body, mesh, bones, key: meta.key, height: meta.height, helpers: meta.helpers || [] };
const reset = () => { for (const b of Object.values(bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); } body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); };
// rest: the bone's tip (its child's head, or the meta's tail point), the head's front, the forward line
reset(); group.updateMatrixWorld(true);
const mb = (n) => meta.bones.find((b) => b.name === n);
const wpos = (o) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
const tipRest = new THREE.Vector3(...(mb(boneName).tail || mb(boneName).t || [0, 0, 0]));
const B = bones[boneName], inv = B.matrixWorld.clone().invert();
// the tip in the bone's own frame: from the meta's tail if given (sculpt coordinates are the model's), else 1 bone-length
let local = tipRest.clone().applyMatrix4(inv);
if (!mb(boneName).tail) local = new THREE.Vector3(0, 0.1, 0);
const fwd = wpos(bones.head).sub(wpos(bones.body)).setY(0).normalize();
const HB = bones.head, hinv = HB.matrixWorld.clone().invert();
const faceLocal = new THREE.Vector3(...mb('head').tail).applyMatrix4(hinv);     // the face: the head bone's tip
if (process.env.SEARCH) {     // search the tail's turns for the furthest reach ahead of the face at about face height
  const T = ['tail1', 'tail2', 'tail3', 'tail4', 'sting'], R = (a, b, st) => { const o = []; for (let x = a; x <= b + 1e-9; x += st) o.push(+x.toFixed(2)); return o; };
  let top = null;
  for (const a of R(0, 2.0, 0.2)) for (const b2 of R(-1.2, 0.6, 0.2)) for (const c of R(-1.2, 0.6, 0.2)) for (const d of R(-1.2, 0.6, 0.2)) for (const e of [0, 0.4, 0.8]) {
    reset(); [a, b2, c, d, e].forEach((v, j) => { bones[T[j]].rotation.x = v; }); group.updateMatrixWorld(true);
    const tip = local.clone().applyMatrix4(B.matrixWorld), face = faceLocal.clone().applyMatrix4(HB.matrixWorld);
    const ahead = tip.clone().sub(face).dot(fwd), up = tip.y - face.y;
    if (up < (+process.env.UPLO || -0.12) * meta.height / 0.6 || up > (+process.env.UPHI || 0.06) * meta.height / 0.6) continue;
    const score = ahead - 0.05 * (Math.abs(b2) + Math.abs(c) + Math.abs(d));     // the least bending that reaches
    if (!top || score > top.score) top = { score, ahead, up, v: [a, b2, c, d, e] };
  }
  console.log(meta.key, 'best turns tail1..4, sting:', top.v.join(', '), 'ahead', top.ahead.toFixed(3), 'up', top.up.toFixed(3)); process.exit(0);
}
let best = -1e9, bu = 0;
for (let i = 0; i <= 60; i++) {
  const u = i / 60; reset();
  if (process.env.TUNE) { const v = process.env.TUNE.split(',').map(Number); ['tail1', 'tail2', 'tail3', 'tail4', 'sting'].forEach((n, j) => { bones[n].rotation.x = v[j] || 0; }); if (i) continue; }
  else moves.pose(F, move, u, 0, 0);
  applyHelpers(F); group.updateMatrixWorld(true);
  const tip = local.clone().applyMatrix4(B.matrixWorld);
  const face = faceLocal.clone().applyMatrix4(HB.matrixWorld);
  const ahead = tip.clone().sub(face).dot(fwd), headFront = face;
  if (ahead > best) { best = ahead; bu = u; }
  if (process.env.CURVE && i % 5 === 0) console.log(u.toFixed(2), 'ahead', ahead.toFixed(3), 'up', (tip.y - headFront.y).toFixed(3));
}
console.log(`${meta.key} ${move}: ${boneName} tip reaches ${best.toFixed(3)} m ahead of its face (as posed) (u=${bu.toFixed(2)}); height ${meta.height} m`);
console.log('bone meta keys:', Object.keys(mb(boneName)).join(','));
