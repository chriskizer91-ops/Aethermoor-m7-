// The walkers in full detail, for any three.js page (Foes: walkers, session 8, November 20).
//
// Each walker is a light model (Champions ~50,000 triangles) baked in Blender from its sculpt, rigged with a biped
// skeleton, its moves posed in code as pure functions of u (0..1 through the move) and t (the clock), the way
// session 6's Briarmaw is (page/briarmaw.js, whose decoder this reuses) and the way the Fight poses everyone.
//
//   await ready();
//   const shared = makeWalkerShared(assets);          // one geometry, one material: shared by every copy
//   const W = buildWalker(shared, FOES.rotwarden);    // { group, plan: 'biped', height, parts, update, hit, act, pose }
//   W.pose('rootlash', u, t)
//
// For the Fight (world3d/battle/arena.js setBeastLook): the foe kit's one foeLook (kit/js/looks.js), see register.js.
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));

let decoderReady = null;
export function ready() { return (decoderReady ??= MeshoptDecoder.ready); }

// the light model as packed by tools/pack.mjs (the same layout as session 6's Briarmaw)
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

// assets: { meta, bin, color, normal, orm, emit? } (urls for the pictures)
export function makeWalkerShared(a, opts = {}) {
  const tl = new THREE.TextureLoader();
  const tex = (url, srgb) => { const t = tl.load(url); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const geo = decodeLight(a.meta, a.bin);
  const orm = tex(a.orm, false);
  const mat = new THREE.MeshStandardMaterial({
    map: tex(a.color, true), normalMap: tex(a.normal, false), aoMap: orm, aoMapIntensity: 1.0,
    roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: opts.env ?? 1,
  });
  if (a.emit) { mat.emissiveMap = tex(a.emit, true); mat.emissive = new THREE.Color(opts.glow ?? 0xffa040); mat.emissiveIntensity = 0.9; }   // the bake's glow mask, tinted
  return { geo, mat, meta: a.meta };
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

function wrap(mesh, bones, foe, triangles) {
  const group = new THREE.Group(), body = new THREE.Group();
  group.add(body); body.add(mesh);
  for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
  const W = { group, body, mesh, bones, foe, plan: 'biped', height: foe.height, parts: { head: bones.head }, triangles };
  return fightFace(W);
}
export function buildWalker(shared, foe) {
  const { mesh, bones } = buildSkinned(shared);
  return wrap(mesh, bones, foe, shared.meta.triangles);
}
// another copy sharing the geometry, material and pictures (for crowds)
export function cloneWalker(W) {
  const mesh = cloneSkinned(W.mesh); const bones = {};
  mesh.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  return wrap(mesh, bones, W.foe, W.triangles);
}

// what the Fight asks of a foe (world3d/battle/arena.js): update(t, step), hit(), act.lunge / act.fall (0..1)
function fightFace(W) {
  W.act = { lunge: 0, fall: 0 }; W.hitAt = -9; W.t = 0;
  W.hit = () => { W.hitAt = W.t; };
  W.pose = (move, u, t, step = 0) => pose(W, move, u, t, step);
  W.update = (t, step = 0) => {
    W.t = t;
    const F = W.act.fall || 0, L = W.act.lunge || 0, h = (t - W.hitAt) / 0.9;
    if (F > 0) pose(W, 'ko', F, t, 0);
    else if (h >= 0 && h < 1) pose(W, 'hurt', h, t, 0);
    else if (L > 0) pose(W, W.foe.lunge || 'strike', L * 0.55, t, 0);
    else pose(W, step ? 'walk' : 'idle', 0, t, step);
  };
  return W;
}

// ---- the moves --------------------------------------------------------------------------------------------------
// Bones (three.js axes: +z forward, +x his left, +y up). rotation.x > 0 swings a hanging limb back and tips an upright
// one forward; rotation.z > 0 swings a hanging limb toward his left; rotation.y > 0 turns toward his left.
function reset(W) {
  for (const b of Object.values(W.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  W.body.position.set(0, 0, 0); W.body.rotation.set(0, 0, 0);
}
const ROOTS = ['root1', 'root2', 'root3', 'root4'];
function roots(W, f) { ROOTS.forEach((n, i) => { const b = W.bones[n]; if (b) f(b, i); }); }
function legs(W, step, amp = 1) {
  for (const [k, ph0] of [['r', 0], ['l', Math.PI]]) {
    const ph = step + ph0, s = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    W.bones[k + '_thigh'].rotation.x = -0.34 * s * amp - 0.25 * lift * amp;
    W.bones[k + '_shin'].rotation.x = 0.55 * lift * amp;
    W.bones[k + '_foot'].rotation.x = -0.2 * lift * amp + 0.1 * s * amp;
  }
}
function crouch(W, k) {
  // bend the knees, keep the feet planted (roughly): hips drop, thighs forward, shins back
  for (const n of ['r', 'l']) { W.bones[n + '_thigh'].rotation.x = -0.45 * k; W.bones[n + '_shin'].rotation.x = 0.8 * k; W.bones[n + '_foot'].rotation.x = -0.35 * k; }
  W.body.position.y = -0.11 * k;
  W.bones.hips.rotation.x = 0.12 * k;
}
function pose(W, move, u, t, step) {
  reset(W);
  const b = W.bones, br = Math.sin(t * 1.6), big = W.foe.weight ?? 1;
  // under everything: breathing, the head looking about, roots stirring
  b.chest.scale.set(1 + 0.012 * br, 1 + 0.01 * br, 1 + 0.015 * br);
  b.head.rotation.y = 0.15 * Math.sin(t * 0.45); b.head.rotation.x = 0.03 * br;
  roots(W, (r, i) => { r.rotation.z = 0.04 * Math.sin(t * 0.9 - i * 0.7); r.rotation.x = 0.03 * Math.sin(t * 0.7 - i * 0.9); });
  if (b.r_upper) { b.r_upper.rotation.z = -0.06 - 0.02 * br; b.r_fore.rotation.x = -0.12; }
  if (b.l_upper) { b.l_upper.rotation.z = 0.06 + 0.02 * br; b.l_fore.rotation.x = -0.12; }
  if (W.foe.idle) W.foe.idle(W, t);
  const P = W.foe.moves?.[move]?.pose;
  if (P) { P(W, u, t, step); return; }
  if (move === 'idle') return;
  if (move === 'walk') {
    legs(W, step);
    W.body.position.y = 0.03 * Math.abs(Math.cos(step)) * big;
    b.hips.rotation.y = 0.08 * Math.sin(step); b.chest.rotation.y = -0.1 * Math.sin(step);
    b.hips.rotation.z = 0.03 * Math.sin(step);
    if (b.r_upper) b.r_upper.rotation.x = 0.3 * Math.sin(step);
    if (b.l_upper) b.l_upper.rotation.x = -0.3 * Math.sin(step);
    roots(W, (r, i) => { r.rotation.x += -0.12 * Math.sin(step - i * 0.6); r.rotation.z += 0.05 * Math.sin(step * 2 - i); });
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)), shake = Math.sin(u * 45) * a;
    W.body.position.z = -0.16 * a; b.spine.rotation.x = -0.15 * a; b.chest.rotation.x = -0.12 * a;
    b.neck.rotation.x = -0.25 * a; b.head.rotation.z = 0.18 * a; b.hips.rotation.z = 0.04 * shake;
    if (b.r_upper) { b.r_upper.rotation.x = -0.4 * a; b.r_upper.rotation.z -= 0.3 * a; }
    if (b.l_upper) { b.l_upper.rotation.x = -0.4 * a; b.l_upper.rotation.z += 0.3 * a; }
    roots(W, (r, i) => { r.rotation.z += 0.25 * a * (i ? 0.6 : 1); r.rotation.x += -0.2 * a; });
    return;
  }
  if (move === 'ko') {
    // the knees give, he sinks onto them, then topples forward; the head drops last
    const knees = seg(u, 0, 0.35), fall = seg(u, 0.38, 0.85), drop = seg(u, 0.7, 1);
    for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -1.35 * knees; b[n + '_shin'].rotation.x = 1.9 * knees; b[n + '_foot'].rotation.x = -0.5 * knees; }
    W.body.position.y = -0.48 * knees * (W.foe.height / 2.5) - 0.05 * fall;
    W.body.position.z = 0.18 * knees + 0.55 * fall * (W.foe.height / 2.5);
    b.hips.rotation.x = 0.2 * knees + 1.15 * fall;
    b.neck.rotation.x = 0.4 * drop; b.head.rotation.z = 0.3 * drop;
    if (b.r_upper) { b.r_upper.rotation.x = -0.9 * fall; b.r_upper.rotation.z -= 0.3 * fall; }
    if (b.l_upper) { b.l_upper.rotation.x = -0.9 * fall; b.l_upper.rotation.z += 0.3 * fall; }
    roots(W, (r, i) => { r.rotation.x += -0.5 * fall * (i ? 0.3 : 1); r.rotation.z += 0.3 * fall; });
    return;
  }
}
export const tools = { ease, bump, seg, legs, crouch, roots };

// The walkers' moves in the foe kit's shape (kit/js/moves/<plan>.js: MOVES, DUR, LUNGE, pose), for kit/js/looks.js.
// The Fight gets the walkers from the kit's one foeLook (see register.js); this file's buildWalker draws them on the
// walkers' gallery with the roughness/metal picture.
export function movesFor(foe) {
  const own = Object.entries(foe.moves).map(([k, m]) => [k, m.label]);
  return {
    MOVES: [['idle', 'Breathe'], ['walk', 'Walk'], ...own, ['hurt', 'Hit'], ['ko', 'Fall']],
    DUR: { ...Object.fromEntries(Object.entries(foe.moves).map(([k, m]) => [k, m.dur])), hurt: 0.9, ko: 2.6 },
    LUNGE: foe.lunge || 'strike',
    pose(F, move, u, t, step = 0) { F.foe ??= foe; return pose(F, move, u, t, step); },
  };
}
