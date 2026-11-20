// Any full-detail beast on a three.js page (Foes: beasts, session 7): session 6's Briarmaw loader
// (prototypes/foe-hd/page/briarmaw.js) made general, until the shared kit lands.
//
//   await ready();
//   const shared = makeShared(A);                 // A: one foe's packed light version and pictures (see build.mjs)
//   const F = buildFoe(shared, MOVES.quad, { height: 0.9, plan: 'quad' });
//   scene.add(F.group); F.update(t, step); F.pose('bite', u, t);
//
// It returns the shape of prototypes/bestiary/beasts.js buildBeast, { group, plan, height, parts, update }, plus what
// the Fight asks (world3d/battle/arena.js setBeastLook): hit(), act.lunge / act.fall, and pose(move, u, t, step).
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

let decoderReady = null;
export function ready() { return (decoderReady ??= MeshoptDecoder.ready); }

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

// the made pieces, shared by every copy of one foe on the page (one geometry, one material, one set of pictures)
export function makeShared(A, opts = {}) {
  const tl = new THREE.TextureLoader();
  const tex = (url, srgb) => { const t = tl.load(url); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const geo = decodeLight(A.lightMeta, A.lightBin);
  const mat = new THREE.MeshStandardMaterial({
    map: tex(A.color, true), normalMap: tex(A.normal, false), aoMap: tex(A.ao, false), aoMapIntensity: 1.0,
    emissiveMap: A.emit ? tex(A.emit, true) : null, emissive: new THREE.Color(A.emit ? 0xffffff : 0x000000),
    emissiveIntensity: opts.glow ?? 0.8, roughness: opts.roughness ?? 0.85, metalness: 0,
    side: THREE.DoubleSide,     // leaves and wing membranes are single sheets
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
  const root = shared.meta.bones.find((b) => !b.parent).name;
  const mesh = new THREE.SkinnedMesh(shared.geo, shared.mat);
  mesh.add(bones[root]);
  mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return { mesh, bones };
}

function wrap(mesh, bones, moves, o, triangles) {
  const group = new THREE.Group(), body = new THREE.Group();
  group.add(body); body.add(mesh);
  for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
  const F = { group, body, mesh, bones, plan: o.plan || 'quad', height: o.height || 1, parts: { head: bones.head, tail: bones.tail1 || bones.tail },
    triangles, moves, opts: o };
  F.act = { lunge: 0, fall: 0 }; F.hitAt = -9; F.t = 0;
  F.hit = () => { F.hitAt = F.t; };
  F.pose = (move, u, t, step = 0) => { reset(F); moves.pose(F, move, u, t, step); };
  F.update = (t, step = 0) => {
    F.t = t;
    const fall = F.act.fall || 0, L = F.act.lunge || 0, h = (t - F.hitAt) / 0.9;
    if (fall > 0) F.pose('ko', fall, t, 0);
    else if (h >= 0 && h < 1) F.pose('hurt', h, t, 0);
    else if (L > 0) F.pose(moves.lunge || 'bite', L * 0.55, t, 0);
    else F.pose(step ? 'walk' : 'idle', 0, t, step);
  };
  return F;
}
function reset(F) {
  for (const b of Object.values(F.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  F.body.position.set(0, 0, 0); F.body.rotation.set(0, 0, 0);
}

export function buildFoe(shared, moves, o = {}) {
  const { mesh, bones } = buildSkinned(shared);
  return wrap(mesh, bones, moves, o, shared.meta.triangles);
}

// another copy sharing the geometry, material and pictures (for packs and the crowd)
export function cloneFoe(F) {
  const mesh = cloneSkinned(F.mesh);
  const bones = {}; mesh.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  return wrap(mesh, bones, F.moves, F.opts, F.triangles);
}

// For the Fight (world3d/battle/arena.js setBeastLook): the full-detail foes given, every other beast as before.
//   setBeastLook(fullDetailLook({ thornhound: () => buildFoe(...) }, buildBeast));
export function fullDetailLook(makers, fallback) {
  const first = {};
  return (key, sprite, opts) => {
    if (!makers[key]) return fallback(key, sprite, opts);
    return first[key] ? cloneFoe(first[key]) : (first[key] = makers[key]());
  };
}

// the sculpt itself (export_sculpt.py + pack.mjs), as a plain coloured mesh for the laptop page
export function decodeSculpt(meta, bin) {
  const n = meta.vertices;
  const vb = new Uint8Array(n * 12);
  MeshoptDecoder.decodeVertexBuffer(vb, n, 12, bin.subarray(0, meta.vbytes));
  const ib = new Uint32Array(meta.indices);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), meta.indices, 4, bin.subarray(meta.vbytes, meta.vbytes + meta.ibytes));
  const dv = new DataView(vb.buffer), pos = new Float32Array(n * 3), col = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < 3; a++) pos[i * 3 + a] = meta.lo[a] + dv.getUint16(i * 12 + a * 2, true) / 65535 * (meta.hi[a] - meta.lo[a]);
    for (let a = 0; a < 3; a++) col[i * 3 + a] = vb[i * 12 + 8 + a];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setIndex(new THREE.BufferAttribute(ib, 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
