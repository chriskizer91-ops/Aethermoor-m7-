// Briarmaw in full detail, for any three.js page (One Foe, November 20).
//
// The light version (about 50,000 triangles) baked from the sculpt in Blender, rigged with 19 bones, and his moves
// posed in code the way the Fight poses everyone (world3d/battle/moves.js): each move is a pure pose of u (0..1 through
// the move) and t (the clock, for breathing).
//
//   const B = buildBriarmawHD(assets, { tex: 2048 })    // assets: see page/assets.js
//   scene.add(B.group)
//   B.update(t, step)                // idle breathing, or walking when step > 0 (the bestiary/Fight beast interface)
//   B.pose(move, u, t)               // 'idle' | 'walk' | 'roar' | 'swipe' | 'bite' | 'hurt' | 'ko', u 0..1
//
// It returns the same shape as prototypes/bestiary/beasts.js buildBeast: { group, plan, height, parts, update }, so
// it drops into the Fight's foeFigure; parts.head is the head bone (the Fight turns it to bite).
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));

let decoderReady = null;
export function ready() { return (decoderReady ??= MeshoptDecoder.ready); }

// decode the packed light version (tools/pack.mjs) into a skinned geometry and its skeleton's rest joints
function decodeLight(meta, bin) {
  const n = meta.vertices, S = meta.stride;
  const vb = new Uint8Array(n * S);
  MeshoptDecoder.decodeVertexBuffer(vb, n, S, bin.subarray(0, meta.vbytes));
  const ib = new Uint32Array(meta.indices);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), meta.indices, 4, bin.subarray(meta.vbytes, meta.vbytes + meta.ibytes));
  const dv = new DataView(vb.buffer);
  const pos = new Float32Array(n * 3), nrm = new Int8Array(n * 3), tan = new Int8Array(n * 4), uv = new Uint16Array(n * 2),
    ji = new Uint8Array(n * 4), jw = new Uint8Array(n * 4);
  const { lo, hi } = meta;
  for (let i = 0; i < n; i++) {
    const o = i * S;
    for (let a = 0; a < 3; a++) pos[i * 3 + a] = lo[a] + dv.getUint16(o + a * 2, true) / 65535 * (hi[a] - lo[a]);
    for (let a = 0; a < 3; a++) nrm[i * 3 + a] = dv.getInt8(o + 8 + a);
    for (let a = 0; a < 4; a++) tan[i * 4 + a] = dv.getInt8(o + 12 + a);
    for (let a = 0; a < 2; a++) uv[i * 2 + a] = dv.getUint16(o + 16 + a * 2, true);
    for (let a = 0; a < 4; a++) { ji[i * 4 + a] = vb[o + 20 + a]; jw[i * 4 + a] = vb[o + 24 + a]; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3, true));
  g.setAttribute('tangent', new THREE.BufferAttribute(tan, 4, true));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2, true));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(ji, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(jw, 4, true));
  g.setIndex(new THREE.BufferAttribute(ib, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

export function decodeSculpt(meta, bin) {
  const n = meta.vertices;
  const vb = new Uint8Array(n * 12);
  MeshoptDecoder.decodeVertexBuffer(vb, n, 12, bin.subarray(0, meta.vbytes));
  const ib = new Uint32Array(meta.indices);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), meta.indices, 4, bin.subarray(meta.vbytes, meta.vbytes + meta.ibytes));
  const dv = new DataView(vb.buffer), pos = new Float32Array(n * 3), col = new Uint8Array(n * 3), emit = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < 3; a++) pos[i * 3 + a] = meta.lo[a] + dv.getUint16(i * 12 + a * 2, true) / 65535 * (meta.hi[a] - meta.lo[a]);
    for (let a = 0; a < 3; a++) col[i * 3 + a] = vb[i * 12 + 8 + a];
    emit[i] = vb[i * 12 + 11] === 7 ? 255 : 0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setIndex(new THREE.BufferAttribute(ib, 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// the made pieces, shared by every Briarmaw on the page (one geometry, one material, one set of pictures)
export function makeShared(A, res) {
  const tl = new THREE.TextureLoader();
  const tex = (url, srgb) => { const t = tl.load(url); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const geo = decodeLight(A.lightMeta, A.lightBin);
  const mat = new THREE.MeshStandardMaterial({
    map: tex(A.tex[res].color, true), normalMap: tex(A.tex[res].normal, false), aoMap: tex(A.ao, false), aoMapIntensity: 1.0,
    emissiveMap: tex(A.emit, true), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.9, roughness: 0.82, metalness: 0,
  });
  return { geo, mat, meta: A.lightMeta };
}

function buildSkinned(shared) {
  const bones = {}, list = [];
  for (const b of shared.meta.bones) {
    const bone = new THREE.Bone(); bone.name = b.name;
    const h = new THREE.Vector3(...b.head);
    if (b.parent) { bone.position.copy(h.clone().sub(new THREE.Vector3(...shared.meta.bones.find((x) => x.name === b.parent).head))); bones[b.parent].add(bone); }
    else bone.position.copy(h);
    bones[b.name] = bone; list.push(bone);
  }
  const mesh = new THREE.SkinnedMesh(shared.geo, shared.mat);
  mesh.add(bones.hips);
  mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return { mesh, bones };
}

export function buildBriarmawHD(shared) {
  const { mesh, bones } = buildSkinned(shared);
  const group = new THREE.Group(), body = new THREE.Group();
  group.add(body); body.add(mesh);
  for (const b of Object.values(bones)) { b.userData.p0 = b.position.clone(); }
  const B = {
    group, body, mesh, bones, plan: 'quad', height: 1.7, parts: { head: bones.head, tail: bones.tail },
    triangles: shared.meta.triangles,
    update(t, step = 0) { pose(B, step ? 'walk' : 'idle', 0, t, step); },
    pose(move, u, t, step = 0) { pose(B, move, u, t, step); },
  };
  return B;
}

// ---- his moves -----------------------------------------------------------------------------------------------
function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
function legs(B, step, amp = 1) {
  // walk: diagonal pairs together (front left with back right), the foot lifting as it swings forward
  const P = { fl: 0, br: 0, fr: Math.PI, bl: Math.PI };
  for (const k of ['fl', 'fr', 'bl', 'br']) {
    const ph = step + P[k], s = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    B.bones[k + '_upper'].rotation.x = -0.32 * s * amp;
    B.bones[k + '_lower'].rotation.x = (k[0] === 'f' ? 0.45 : -0.45) * lift * amp;
    B.bones[k + '_paw'].rotation.x = 0.25 * s * amp - (k[0] === 'f' ? 0.3 : -0.2) * lift * amp;
  }
}
function pose(B, move, u, t, step) {
  reset(B);
  const b = B.bones, br = Math.sin(t * 1.9);
  // breathing under everything: the chest swells, the head bobs a little, the tail sways
  b.spine.scale.set(1 + 0.012 * br, 1 + 0.018 * br, 1);
  b.head.rotation.x = 0.03 * br; b.head.rotation.y = 0.12 * Math.sin(t * 0.55);
  b.tail.rotation.y = 0.18 * Math.sin(t * 1.3); b.tail.rotation.x = 0.04 * br;
  b.jaw.rotation.x = 0.03 + 0.02 * br;
  if (move === 'idle') return;
  if (move === 'walk') {
    legs(B, step);
    B.body.position.y = 0.025 * Math.abs(Math.sin(step));
    b.hips.rotation.z = 0.03 * Math.sin(step); b.chest.rotation.z = -0.03 * Math.sin(step);
    b.head.rotation.x += 0.05 * Math.sin(step * 2);
    return;
  }
  if (move === 'roar') {
    // rear back, head up, jaw wide, shake
    const up = seg(u, 0, 0.25), hold = 1 - seg(u, 0.75, 1), k = up * hold, shake = Math.sin(u * 70) * 0.03 * k;
    b.hips.rotation.x = -0.12 * k; b.chest.rotation.x = -0.18 * k; b.neck.rotation.x = -0.35 * k;
    b.head.rotation.x += -0.35 * k + shake; b.head.rotation.y = shake;
    b.jaw.rotation.x = 0.05 + 0.55 * k;
    b.fl_upper.rotation.x = b.fr_upper.rotation.x = 0.12 * k;
    B.body.position.y = 0.05 * k;
    return;
  }
  if (move === 'swipe') {
    // up on the hind legs a little, the right forepaw raised and raked across
    const lift = seg(u, 0, 0.3), rake = seg(u, 0.32, 0.55), back = 1 - seg(u, 0.7, 1), k = back;
    b.hips.rotation.x = -0.18 * lift * k; b.chest.rotation.x = -0.12 * lift * k;
    b.chest.rotation.y = (0.25 * lift - 0.55 * rake) * k;
    b.fr_upper.rotation.x = (-1.25 * lift + 0.9 * rake) * k; b.fr_upper.rotation.z = (-0.35 * lift + 0.6 * rake) * k;
    b.fr_lower.rotation.x = (0.6 * lift - 0.4 * rake) * k; b.fr_paw.rotation.x = -0.4 * lift * k;
    b.head.rotation.y += (0.3 * lift - 0.5 * rake) * k; b.jaw.rotation.x = 0.05 + 0.3 * rake * k;
    B.body.position.y = 0.06 * lift * k;
    return;
  }
  if (move === 'bite') {
    // a lunge: head down and forward, jaw open, snapped shut as he lands
    const go = seg(u, 0, 0.4), snap = seg(u, 0.45, 0.55), back = 1 - seg(u, 0.6, 1);
    b.neck.rotation.x = 0.35 * go * back; b.head.rotation.x += -0.15 * go * back;
    b.jaw.rotation.x = 0.05 + 0.6 * go * (1 - snap) * back;
    b.hips.rotation.x = 0.06 * go * back; B.body.position.z = 0.25 * go * back;
    b.fl_upper.rotation.x = b.fr_upper.rotation.x = -0.2 * go * back;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    B.body.position.z = -0.18 * a; b.chest.rotation.x = -0.22 * a; b.neck.rotation.x = -0.3 * a; b.head.rotation.x -= 0.25 * a;
    b.head.rotation.z = 0.2 * a; b.jaw.rotation.x = 0.05 + 0.35 * a;
    b.hips.rotation.z = 0.06 * Math.sin(u * 40) * a;
    return;
  }
  if (move === 'ko') {
    // the legs buckle, he rolls onto his side, the head drops last
    const buckle = seg(u, 0, 0.35), roll = seg(u, 0.25, 0.75), drop = seg(u, 0.6, 1);
    for (const k of ['fl', 'fr', 'bl', 'br']) { b[k + '_upper'].rotation.x = (k[0] === 'f' ? 0.5 : -0.5) * buckle; b[k + '_lower'].rotation.x = (k[0] === 'f' ? -0.6 : 0.6) * buckle; }
    B.body.position.y = -0.25 * buckle + 0.1 * roll; B.body.rotation.z = 1.45 * roll; B.body.position.x = -0.55 * roll;
    b.neck.rotation.x = 0.3 * drop; b.head.rotation.z = -0.3 * drop; b.jaw.rotation.x = 0.05 + 0.25 * drop;
    b.tail.rotation.y = 0;
    return;
  }
}

// a second, third... Briarmaw that shares the geometry, material and pictures (for the crowd)
export function cloneBriarmaw(B) {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const mesh = cloneSkinned(B.mesh); body.add(mesh);
  const bones = {}; mesh.traverse((o) => { if (o.isBone) { bones[o.name] = o; o.userData.p0 = o.position.clone(); } });
  const C = { group, body, mesh, bones, plan: 'quad', height: 1.7, parts: { head: bones.head, tail: bones.tail }, triangles: B.triangles,
    update(t, step = 0) { pose(C, step ? 'walk' : 'idle', 0, t, step); }, pose(move, u, t, step = 0) { pose(C, move, u, t, step); } };
  return C;
}
