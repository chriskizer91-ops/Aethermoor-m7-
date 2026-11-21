// The foe kit's loader (November 20): any foe's light model, decoded, skinned, given its moves, and the face the
// Fight asks of a beast (world3d/battle/arena.js setBeastLook): { group, plan, height, parts, update(t, step), hit(),
// act: { lunge, fall }, pose(move, u, t, step) }.
//
//   await ready();
//   const shared = makeShared(A, 2048);            // A: the foe's assets (lightMeta, lightBin, tex, ao, emit), see build.mjs
//   const F = makeFoe(shared, moves);              // moves: kit/js/moves/<plan>.js
//   scene.add(F.group); F.update(t, step) or F.pose('roar', u, t)
//   const G = cloneFoe(F, moves);                  // another of him, sharing the geometry, material and pictures
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

let decoderReady = null;
export function ready() { return (decoderReady ??= MeshoptDecoder.ready); }

// decode the packed light version (tools/pack.mjs) into a skinned geometry and its skeleton's rest joints
export function decodeLight(meta, bin) {
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

// the made pieces, shared by every one of this foe on the page (one geometry, one material, one set of pictures)
export function makeShared(A, res) {
  const tl = new THREE.TextureLoader();
  const tex = (url, srgb) => { const t = tl.load(url); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const geo = decodeLight(A.lightMeta, A.lightBin);
  const mat = new THREE.MeshStandardMaterial({
    map: tex(A.tex[res].color, true), normalMap: tex(A.tex[res].normal, false), aoMap: tex(A.ao, false), aoMapIntensity: 1.0,
    emissiveMap: tex(A.emit, true), emissive: new THREE.Color(A.glow ?? 0xffffff), emissiveIntensity: A.glowIntensity ?? 1.3,
    roughness: 0.82, metalness: 0,
    side: A.lightMeta.split ? THREE.DoubleSide : THREE.FrontSide,     // a cut mouth shows the inside of the head, not the room behind
  });
  // ORM (R shading, G roughness, B metalness; session 8): plate and gold keep their shine
  if (A.orm) { const o = tex(A.orm, false); mat.roughnessMap = o; mat.metalnessMap = o; mat.roughness = 1; mat.metalness = 1; }
  return { geo, mat, meta: A.lightMeta, res };
}

export function buildSkinned(shared) {
  const bones = {}, list = [];
  // two passes: every bone first, then each joined to its parent (a chain may list a child before its parent)
  for (const b of shared.meta.bones) { const bone = new THREE.Bone(); bone.name = b.name; bones[b.name] = bone; list.push(bone); }
  for (const b of shared.meta.bones) {
    const bone = bones[b.name], h = new THREE.Vector3(...b.head);
    if (b.parent) { bone.position.copy(h.clone().sub(new THREE.Vector3(...shared.meta.bones.find((x) => x.name === b.parent).head))); bones[b.parent].add(bone); }
    else bone.position.copy(h);
  }
  const mesh = new THREE.SkinnedMesh(shared.geo, shared.mat);
  for (const b of shared.meta.bones) if (!b.parent) mesh.add(bones[b.name]);     // the root(s), whatever they're called
  mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return { mesh, bones };
}


// The common moves every foe answers to (the Fight picks by M7's move): idle, walk, bite, strike, swipe, cast, roar,
// hurt, ko. A plan that lacks one plays its nearest: its own ALIAS table first, then these.
export const COMMON = ['idle', 'walk', 'bite', 'strike', 'swipe', 'cast', 'roar', 'hurt', 'ko'];
const NEAREST = { bite: ['bite', 'strike', 'lunge'], strike: ['strike', 'bite', 'swing', 'dive', 'bump'],
  swipe: ['swipe', 'swing', 'slam', 'strike'], cast: ['cast', 'spores', 'roar'], roar: ['roar', 'spores', 'cast', 'hop'],
  idle: ['idle'], walk: ['walk'], hurt: ['hurt'], ko: ['ko'] };
export function resolveMove(moves, move) {
  const has = (m) => moves.MOVES.some(([k]) => k === m);
  if (has(move)) return move;
  const alias = moves.ALIAS && moves.ALIAS[move];
  if (alias && has(alias)) return alias;
  for (const m of NEAREST[move] || []) if (has(m)) return m;
  return moves.LUNGE && ['bite', 'strike', 'swipe', 'cast', 'roar'].includes(move) ? moves.LUNGE : 'idle';
}
export function moveDuration(moves, move) { return (moves.DUR || {})[resolveMove(moves, move)] || 1; }

function wrap(group, body, mesh, bones, meta, moves) {
  for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
  const F = { group, body, mesh, bones, key: meta.key, plan: meta.plan || 'quad', height: meta.height || 1.7,
    parts: { head: bones.head, tail: bones.tail, jaw: bones.jaw }, triangles: meta.triangles, moves };
  F.act = { lunge: 0, fall: 0 }; F.hitAt = -9; F.t = 0;
  F.hit = () => { F.hitAt = F.t; };
  F.pose = (move, u, t, step = 0) => moves.pose(F, resolveMove(moves, move), u, t, step);
  F.duration = (move) => moveDuration(moves, move);      // seconds the move takes (its plan's DUR)
  // what the Fight drives: act.fall plays the fall, a hit() a flinch, act.lunge the plan's lunge; else idle or walk
  F.update = (t, step = 0) => {
    F.t = t;
    const fa = F.act.fall || 0, L = F.act.lunge || 0, h = (t - F.hitAt) / 0.9;
    if (fa > 0) moves.pose(F, 'ko', fa, t, 0);
    else if (h >= 0 && h < 1) moves.pose(F, 'hurt', h, t, 0);
    else if (L > 0) moves.pose(F, moves.LUNGE || 'bite', L * 0.55, t, 0);
    else moves.pose(F, step ? 'walk' : 'idle', 0, t, step);
  };
  return F;
}
export function makeFoe(shared, moves) {
  const { mesh, bones } = buildSkinned(shared);
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body); body.add(mesh);
  return wrap(group, body, mesh, bones, shared.meta, moves);
}
export function cloneFoe(F, moves = F.moves) {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const mesh = cloneSkinned(F.mesh); body.add(mesh);
  const bones = {}; mesh.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  return wrap(group, body, mesh, bones, { key: F.key, plan: F.plan, height: F.height, triangles: F.triangles }, moves);
}
