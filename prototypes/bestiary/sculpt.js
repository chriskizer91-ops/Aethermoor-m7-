// The creatures of Act One, each shaped by hand to Chris's model sheet (art-in/3d/sheets/sheet-<name>.webp, front, side
// and back) and made of his creature skins (art-in/3d/skins/, web copies in skins/pack.js, laid on by position like
// the heroes' gear). Colours are read off the sheets; patches, stripes and spots are painted onto the shapes.
// Each builder makes the creature facing +z, standing on y = 0, and returns { g, parts }: the parts that move, named as
// beasts.js names them (legs, head, tail, torso, arms, wings, body, float, core), so buildBeast animates them the same.
// SCULPT[key]() -> { g, parts }
import * as THREE from 'three';
import { V, lerp, smooth, clamp01, tube, curve, lathe, wedge, sph, tor, cone, ico, add, bake, grainMaterial, addGrains } from '../hero-3d/kit.js';
import { SKINS } from './skins/pack.js';
addGrains(SKINS);

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ noise and paint */
function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440662683); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const fbm3 = (x, y, z, o = 3) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * noise3(x * f + i * 17, y * f, z * f); a *= 0.5; f *= 2.03; } return v / (1 - Math.pow(0.5, o)); };
const COL = {}; const col = hex => COL[hex] || (COL[hex] = new THREE.Color(hex));
const _c = new THREE.Color();
// paint(geometry, fn(x, y, z) -> a colour): vertex colours, in the geometry's own space plus an offset
function paint(g, fn, off = V()) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i) + off.x, p.getY(i) + off.y, p.getZ(i) + off.z); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  return g;
}
const mix = (a, b, t) => _c.copy(col(a)).lerp(col(b), clamp01(t)).clone();
const mix3 = (base, pairs) => { const c = col(base).clone(); for (const [hex, t] of pairs) c.lerp(col(hex), clamp01(t)); return c; };

/* ------------------------------------------------------------------ materials */
const soft = o => ({ ...o, bump: (o.bump ?? 1) * 0.45 });
const skinMat = (hex, skin, o = {}) => grainMaterial(col(hex).clone(), skin ? 'beast-' + skin : null, soft(o));
const paintMat = (skin, o = {}, fn = null) => { const m = grainMaterial(new THREE.Color(1, 1, 1), skin ? 'beast-' + skin : null, soft({ vertexColors: true, ...o })); m.userData.paint = fn; return m; };
const glowMat = (hex, k = 2.2) => new THREE.MeshStandardMaterial({ color: col(hex), emissive: col(hex), emissiveIntensity: k, roughness: 0.3 });
const plain = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: col(hex), roughness: 0.6, ...o });

/* ------------------------------------------------------------------ small parts */
const UP = V(0, 1, 0);
function orient(o, dir, twist = 0) { o.quaternion.setFromUnitVectors(UP, dir.clone().normalize()); if (twist) o.rotateY(twist); return o; }
const LEAF = {};
function leafGeo(len, w, cup = 0) {
  const key = `${len.toFixed(3)}|${w.toFixed(3)}|${cup}`; if (LEAF[key]) return LEAF[key];
  const N = 8, L = [], R = [];
  for (let i = 0; i <= N; i++) { const t = i / N, hw = w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * (1 - t * 0.25); L.push([-hw, t * len]); R.unshift([hw, t * len]); }
  const g = wedge(L.concat(R.slice(1, -1)), Math.max(0.003, w * 0.06));
  if (cup) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + x * x * cup / w); } g.computeVertexNormals(); }
  return (LEAF[key] = g);
}
const leaf = (parent, m, pos, dir, len, w, twist = 0, cup = 0) => orient(add(leafGeo(len, w, cup), m, parent, pos.x, pos.y, pos.z), dir, twist);
// a curved thorn or claw from pos along dir, bending toward `bend`
function thorn(parent, m, pos, dir, len, r, bend = V(0, 0, 0), n = 6) {
  const d = dir.clone().normalize(), b = bend.clone();
  const pts = [pos.clone(), pos.clone().addScaledVector(d, len * 0.5).addScaledVector(b, len * 0.12), pos.clone().addScaledVector(d, len).addScaledVector(b, len * 0.4)];
  return add(tube(curve(pts, 8), t => r * Math.pow(1 - t, 1.1) + r * 0.04, { n }), m, parent);
}
const tuft = (parent, m, pos, dir, len, r) => orient(add(cone(r, len, 5), m, parent, pos.x, pos.y, pos.z).translateY(0), dir).translateY(len * 0.45);
function eye(parent, pos, r, hex, slit = null, pupilHex = '#120a06') {
  const e = add(sph(r, 12, 10), glowMat(hex, 1.6), parent, pos.x, pos.y, pos.z);
  if (slit) { const pm = plain(pupilHex, { roughness: 0.2 }); const p = add(new THREE.BoxGeometry(slit === 'v' ? r * 0.3 : r * 1.3, slit === 'v' ? r * 1.4 : r * 0.3, r * 0.4), pm, parent, pos.x, pos.y, pos.z + r * 0.82); p.userData.pupil = 1; }
  return e;
}
const fib = (i, N) => { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.399963; return V(Math.cos(a) * r, y, Math.sin(a) * r); };
// a shaggy outline for tubes: the ring wobbles round and along
const shag = (amp, k = 7, kt = 13) => { k = Math.min(k, 5); kt = Math.min(kt, 6); return (a, t) => 1 + amp * 0.6 * (Math.sin(a * k + t * kt) * 0.6 + Math.sin(a * (k + 2) - t * kt * 1.7 + 1.3) * 0.4); };
function cattail(parent, base, h, mStalk, mHead, lean = V()) {
  const top = base.clone().add(V(lean.x, h, lean.z));
  add(tube(curve([base, base.clone().lerp(top, 0.5).add(V(lean.x * 0.2, 0, lean.z * 0.2)), top], 8), h * 0.018, { n: 6 }), mStalk, parent);
  const head = top.clone().add(V(0, -h * 0.28, 0));
  add(lathe([[0, 0], [h * 0.04, h * 0.02], [h * 0.05, h * 0.08], [h * 0.05, h * 0.18], [h * 0.04, h * 0.23], [0, h * 0.25]], { n: 12 }), mHead, parent, head.x, head.y, head.z);
  add(tube([top.clone().add(V(0, -h * 0.03, 0)), top.clone().add(V(0, h * 0.08, 0))], h * 0.008, { n: 5 }), mStalk, parent);
}
// a leg along points, with a radius that tapers
const limb = (parent, m, pts, r0, r1, o = {}) => add(tube(curve(pts, o.n || 12), t => { const r = lerp(r0, r1, Math.pow(t, o.p || 1)); return o.flat ? [r, r * o.flat] : r; }, { n: o.ring || 12, shape: o.shape }), m, parent);
// a body along a spine, rounded at both ends (a sphere at each end the size of the tube there)
function bodyTube(parent, m, spine, rad, o = {}) {
  const pts = curve(spine, o.seg || 18), g = tube(pts, rad, { n: o.n || 18, shape: o.shape, capA: false, capB: false });
  if (o.paint) paint(g, o.paint);
  add(g, m, parent);
  for (const [t, p, q] of [[0, pts[0], pts[1]], [1, pts[pts.length - 1], pts[pts.length - 2]]]) {
    const r = rad(t), rx = Array.isArray(r) ? r[0] : r, ry = Array.isArray(r) ? r[1] : r;
    const e = sph(1, 18, 14); if (o.paint) paint(e, (x, y, z) => o.paint(x * rx + p.x, y * ry + p.y, z * rx + p.z));
    const s = add(e, m, parent, p.x, p.y, p.z); s.scale.set(rx, ry, Math.max(rx, ry) * (o.round ?? 1.1)); s.lookAt(parent.localToWorld(p.clone().add(p.clone().sub(q))));
    s.scale.set(rx, ry, Math.max(rx, ry) * (o.round ?? 1.1));
  }
  return pts;
}
// a ball where a leg meets the body, so the leg grows out of it
function joint(parent, m, pos, r, paintFn) { r *= 0.62; pos = V(pos.x * 0.55, pos.y, pos.z); const e = sph(r, 14, 10); if (paintFn) paint(e, (x, y, z) => paintFn(x + pos.x, y + pos.y, z + pos.z)); return add(e, m, parent, pos.x, pos.y, pos.z); }
// the parts that move, kept as their own nodes; everything else is joined by material into them
function finish(g, parts) {
  // tufts and small pieces in a painted material take its colouring at the place they stand
  g.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  g.traverse(o => { if (!o.isMesh || !o.material.vertexColors || o.geometry.attributes.color) return; const fn = o.material.userData.paint; const geo = o.geometry = o.geometry.clone(); const p = geo.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); const k = fn ? fn(v.x, v.y, v.z) : col('#ffffff'); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; } geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); });
  const keep = new Set([g]);
  const walk = v => { if (!v) return; if (v.isObject3D) { if (!v.isMesh) keep.add(v); } else if (Array.isArray(v)) v.forEach(walk); };
  for (const k of Object.keys(parts)) if (!['core', 'lamp'].includes(k)) walk(parts[k]);
  bake(g, keep);
  return { g, parts };
}

/* ================================================================== the creatures */
export const SCULPT = {};

/* ---- Thornhound: a lean dark wolf, a vine of leaves, tan thorns and small flowers down its back, amber eyes */
SCULPT.thornhound = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const furCol = (x, y, z) => { const n = fbm3(x * 6, y * 6, z * 6); return mix3('#4a3e38', [['#2a221f', smooth((y - 0.8) / 0.12) * 0.8 + (n - 0.5) * 0.6], ['#6e5c50', smooth((0.66 - y) / 0.12) * 0.7]]); };
  const fur = paintMat('wolf-fur', { tile: 0.18, bump: 1.6 }, furCol), furDark = skinMat('#2c2420', 'wolf-fur', { tile: 0.18, bump: 1.6 });
  const spine = [V(0, 0.8, -0.55), V(0, 0.78, -0.25), V(0, 0.77, 0.12), V(0, 0.76, 0.44)];
  bodyTube(g, fur, spine, t => { const chest = smooth((t - 0.45) / 0.4); return [0.13 + chest * 0.04 + Math.sin(t * Math.PI) * 0.01, 0.17 - Math.sin(t * Math.PI * 0.9) * 0.03 + chest * 0.09]; }, { shape: shag(0.05), paint: furCol, round: 0.9 });
  // the chest hangs deep: a second loft under the front
  add(paint(tube(curve([V(0, 0.7, 0.05), V(0, 0.66, 0.3), V(0, 0.72, 0.5)], 10), t => [0.12 * Math.sin(Math.PI * t) + 0.03, 0.12 * Math.sin(Math.PI * t) + 0.03], { n: 14, shape: shag(0.08) }), furCol), fur, g);
  // neck and head
  add(paint(tube(curve([V(0, 0.8, 0.38), V(0, 0.9, 0.55), V(0, 0.99, 0.66)], 10), t => [lerp(0.15, 0.09, t), lerp(0.17, 0.1, t)], { n: 16, shape: shag(0.09) }), furCol), fur, g);
  const head = new THREE.Group(); head.position.set(0, 1.0, 0.68); g.add(head); parts.head = head;
  const hc = (x, y, z) => furCol(x, y + 1.0, z + 0.68);
  add(paint(sph(0.105, 18, 14), hc), fur, head).scale.set(1, 0.88, 1.12);
  add(paint(tube(curve([V(0, -0.005, 0.04), V(0, -0.03, 0.17), V(0, -0.05, 0.27)], 10), t => [lerp(0.065, 0.03, t), lerp(0.055, 0.026, t)], { n: 14 }), (x, y, z) => mix('#4a3e38', '#6a5a50', 0.4 + (z - 0.1) * 2)), fur, head);
  add(paint(tube(curve([V(0, -0.055, 0.05), V(0, -0.07, 0.15), V(0, -0.068, 0.24)], 8), t => [lerp(0.05, 0.022, t), lerp(0.02, 0.012, t)], { n: 10 }), () => col('#5a4a42')), fur, head);
  add(sph(0.022, 10, 8), plain('#0e0a09', { roughness: 0.25 }), head, 0, -0.045, 0.28).scale.set(1.2, 0.9, 1);
  for (const s of [-1, 1]) {
    eye(head, V(s * 0.052, 0.025, 0.085), 0.016, '#ffb02a', 'v');
    add(tube(curve([V(s * 0.035, 0.045, 0.09), V(s * 0.06, 0.05, 0.08), V(s * 0.08, 0.04, 0.06)], 6), 0.007, { n: 5 }), furDark, head);
    const ear = add(cone(0.042, 0.15, 6), furDark, head, s * 0.058, 0.11, -0.03); ear.rotation.set(-0.2, 0, -s * 0.28); ear.scale.set(1, 1, 0.55);
    for (let k = 0; k < 4; k++) tuft(head, fur, V(s * (0.08 + k * 0.01), -0.03 - k * 0.02, 0.02 - k * 0.02), V(s * 0.8, -0.3, -0.4), 0.06, 0.018);
    add(cone(0.008, 0.028, 5), plain('#e8dcc4'), head, s * 0.02, -0.075, 0.2).rotation.x = Math.PI;
  }
  // a ruff of fur round the neck and down the chest
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, s = Math.sin(a), c = Math.cos(a); tuft(g, fur, V(s * 0.13, 0.86 + c * 0.1, 0.56 + c * 0.03), V(s * 0.6, c * 0.4 - 0.5, 0.5), 0.12, 0.035); }
  // legs: long, the hind ones bent back at the hock; paws with claws
  const claw = plain('#1a1412', { roughness: 0.3 });
  [[0.1, 0.72, 0.36, 1], [-0.1, 0.72, 0.36, 1], [0.1, 0.76, -0.48, 0], [-0.1, 0.76, -0.48, 0]].forEach(([x, y, z, front]) => {
    joint(g, fur, V(x * 0.9, y + 0.02, z), front ? 0.1 : 0.12, furCol).scale.set(0.8, 1.2, 1);
    const leg = new THREE.Group(); leg.position.set(x, y, z); g.add(leg); parts.legs.push(leg);
    const pts = front ? [V(0, 0.05, 0), V(0, -0.28, 0.02), V(0, -0.52, -0.01), V(0, -0.69, 0.03)] : [V(0, 0.06, 0), V(0, -0.24, 0.1), V(0, -0.46, -0.1), V(0, -0.73, -0.02)];
    const lc = (px, py, pz) => furCol(px + x, py + y, pz + z);
    add(paint(tube(curve(pts, 14), t => { const r = lerp(front ? 0.085 : 0.11, 0.032, Math.pow(t, 0.7)); return [r * 0.85, r]; }, { n: 12, shape: shag(0.07) }), lc), fur, leg);
    const foot = pts[3].clone();
    add(paint(sph(0.04, 12, 8), () => col('#3a302b')), fur, leg, foot.x, foot.y - 0.015, foot.z + 0.03).scale.set(1, 0.55, 1.45);
    for (const k of [-1, -0.33, 0.33, 1]) thorn(leg, claw, V(foot.x + k * 0.02, foot.y - 0.02, foot.z + 0.075), V(0, -0.5, 1), 0.03, 0.006, V(0, -1, 0));
  });
  // the tail, thick and bushy
  const tail = new THREE.Group(); tail.position.set(0, 0.82, -0.6); g.add(tail); parts.tail = tail;
  add(paint(tube(curve([V(0, 0, 0), V(0, -0.1, -0.18), V(0, -0.32, -0.3), V(0, -0.56, -0.28)], 16), t => 0.035 + Math.sin(Math.PI * Math.pow(t, 0.6)) * 0.08 * (1 - t * 0.3), { n: 14, shape: shag(0.14, 6, 18) }), (x, y, z) => mix('#3e342f', '#6a5a50', smooth((-0.4 - y) / 0.2))), fur, tail);
  // the vine down the back: leaves, tan thorns curving back, small orange flowers
  const vine = plain('#3a3a1e', { roughness: 0.8 }), leafM = skinMat('#4c6a2c', null, { roughness: 0.6, side: THREE.DoubleSide }), leafM2 = skinMat('#6a7f34', null, { roughness: 0.6, side: THREE.DoubleSide });
  const thornM = skinMat('#a87a48', 'bark-sap', { roughness: 0.45, tile: 0.1 }), flower = plain('#d88a34', { roughness: 0.5 }), flowerC = plain('#5a3a14');
  const vp = curve([V(0, 1.02, 0.6), V(0.01, 0.98, 0.42), V(-0.01, 0.97, 0.15), V(0.01, 0.96, -0.15), V(0, 0.95, -0.45), V(0, 0.86, -0.62)], 40);
  add(tube(vp, 0.014, { n: 6 }), vine, g);
  vp.forEach((p, i) => {
    const t = i / (vp.length - 1);
    if (i % 2 === 0) for (const s of [-1, 1]) leaf(g, (i / 2) % 2 ? leafM : leafM2, p, V(s * 0.9, 0.5, -0.3 + Math.sin(i) * 0.3), 0.07 + Math.sin(i * 1.7) * 0.015, 0.03, i, 0.4);
    if (i % 6 === 3 && t > 0.05 && t < 0.92) thorn(g, thornM, p.clone().add(V(0, 0.005, 0)), V(0, 1, -0.5), 0.06 + Math.sin(Math.PI * t) * 0.07, 0.02, V(0, 0, -1), 7);
    if (i % 6 === 4) { const f = new THREE.Group(); f.position.copy(p).add(V(Math.sin(i) * 0.04, 0.03, 0)); g.add(f); for (let k = 0; k < 6; k++) leaf(f, flower, V(), V(Math.cos(k / 6 * TAU), 0.5, Math.sin(k / 6 * TAU)), 0.03, 0.014); add(sph(0.011, 8, 6), flowerC, f); }
  });
  return finish(g, parts);
};

/* ---- Briarling: a ball of leaves round a dark hollow with one amber eye, vines wound round, orange berries, a sprout
   on top, two twisted root legs */
SCULPT.briarling = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const body = new THREE.Group(); body.position.y = 0.56; g.add(body); parts.body = body;
  const bark = skinMat('#5a4128', 'bark-sap', { tile: 0.12, bump: 1.6 }), core = skinMat('#1e2a12', null, { roughness: 0.9 });
  const lm = ['#3e6a26', '#4f7e2e', '#2f5520', '#5e8a34'].map(h => skinMat(h, null, { roughness: 0.55, side: THREE.DoubleSide }));
  add(ico(0.26, 3), core, body);
  const R = 0.29, N = 170;
  for (let i = 0; i < N; i++) {
    const d = fib(i, N);
    if (d.z > 0.72 && Math.abs(d.y) < 0.42 && Math.abs(d.x) < 0.5) continue; // the hollow
    const p = d.clone().multiplyScalar(R * (0.92 + hash3(i, 1, 2) * 0.12));
    const dir = d.clone().add(V(0, 0.45, 0)).add(V(hash3(i, 3, 1) - 0.5, 0, hash3(i, 4, 1) - 0.5).multiplyScalar(0.6));
    leaf(body, lm[i % 4], p, dir, 0.11 + hash3(i, 5, 5) * 0.04, 0.045, hash3(i, 9, 9) * TAU, 0.5);
  }
  // the hollow and the eye in it
  add(sph(0.13, 16, 12), plain('#0c0a06', { roughness: 1 }), body, 0, 0, 0.17).scale.set(1, 0.95, 0.5);
  eye(body, V(0, 0.0, 0.215), 0.05, '#ffa21e', 'v');
  add(tor(0.13, 0.02, 8, 24), bark, body, 0, 0, 0.21);
  // vines wound round the ball
  for (let k = 0; k < 3; k++) {
    const pts = []; const tilt = [0.5, -0.7, 1.2][k], yaw = [0.3, 1.9, 3.6][k];
    for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; let p = V(Math.cos(a) * (R + 0.015), Math.sin(a) * (R + 0.015), 0); p.applyAxisAngle(V(1, 0, 0), tilt).applyAxisAngle(UP, yaw); if (p.z > 0.18 && Math.abs(p.y) < 0.15) p.multiplyScalar(1.12); pts.push(p); }
    add(tube(pts, 0.018, { n: 6, closed: true }), bark, body);
  }
  // berries
  const berry = plain('#e88a22', { roughness: 0.3 }), stalk = plain('#3a2a14');
  for (let i = 0; i < 26; i++) { const d = fib(i * 7 % 170, 170); if (d.z > 0.6 && Math.abs(d.y) < 0.4) continue; const p = d.clone().multiplyScalar(R + 0.04); add(sph(0.018, 10, 8), berry, body, p.x, p.y, p.z); }
  // the sprout on top
  add(tube(curve([V(0, R - 0.02, 0), V(0.02, R + 0.08, -0.01), V(-0.01, R + 0.16, 0.01), V(0.01, R + 0.22, 0)], 10), t => 0.014 * (1 - t * 0.5), { n: 6 }), bark, body);
  for (const s of [-1, 1]) leaf(body, lm[1], V(0.01, R + 0.21, 0), V(s, 0.65, 0.1), 0.12, 0.05, 0, 0.6);
  // twisted root legs with spreading toes
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.34, 0); g.add(leg); parts.legs.push(leg);
    for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = t * TAU * 1.2 + k * Math.PI; pts.push(V(Math.cos(a) * 0.016 + s * t * 0.02, -t * 0.32, Math.sin(a) * 0.016)); } add(tube(pts, t => lerp(0.022, 0.015, t), { n: 6 }), bark, leg); }
    for (const a of [-0.9, -0.2, 0.5, 2.6]) { const d = V(Math.sin(a) * (a > 2 ? -1 : 1) * 0.6 + s * 0.2, -0.25, Math.cos(a)); thorn(leg, bark, V(0, -0.31, 0), V(d.x, 0, d.z), 0.08, 0.014, V(0, -0.6, 0)); }
  }
  return finish(g, parts);
};

/* ---- Boglurcher: a heap of bog mud with moss dripping off it, stones round the foot, two cattails and a curled sprout,
   amber eyes peering out of the front */
SCULPT.boglurcher = () => {
  const g = new THREE.Group(), parts = {};
  const body = new THREE.Group(); g.add(body); parts.body = body;
  const prof = [[0.6, 0], [0.62, 0.05], [0.58, 0.2], [0.5, 0.4], [0.38, 0.58], [0.22, 0.72], [0.08, 0.8], [0, 0.81]];
  const m = lathe(prof, { n: 56 }), p = m.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z) || 1e-6, n = fbm3(x * 3.2, y * 3.2, z * 3.2, 4) - 0.5, lump = 1 + n * 0.45 * smooth(y / 0.1); p.setXYZ(i, x * lump, y * (1 + n * 0.25) * (z > 0 ? 0.95 : 1.02), z * lump); }
  m.computeVertexNormals();
  paint(m, (x, y, z) => { const a = Math.atan2(x, z), n = fbm3(x * 5, y * 5, z * 5), drip = Math.max(0, Math.sin(a * 11 + n * 4)) * 0.16 + n * 0.12; const moss = smooth((y - 0.44 + drip) / 0.06); return mix3('#3c2a1a', [['#5a4028', n * 0.7], ['#4d6a24', moss], ['#7a8a34', moss * smooth((y - 0.65) / 0.1) * 0.6]]); });
  add(m, paintMat('mossy-stone', { tile: 0.3, bump: 1.8, roughness: 0.75 }), body);
  // moss hanging in strands
  const moss = skinMat('#4d6a24', 'river-weed', { tile: 0.2 });
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + hash3(i, 2, 2) * 0.2, y = 0.46 + hash3(i, 1, 1) * 0.14, r = 0.47 - (y - 0.46) * 0.75; const top = V(Math.sin(a) * r, y, Math.cos(a) * r); add(tube(curve([top, top.clone().add(V(Math.sin(a) * 0.04, -0.06, Math.cos(a) * 0.04)), top.clone().add(V(Math.sin(a) * 0.06, -0.12 - hash3(i, 3, 3) * 0.1, Math.cos(a) * 0.06))], 6), t => 0.02 * (1 - t * 0.85), { n: 5 }), moss, body); }
  // stones round the foot
  const stone = skinMat('#5a5048', 'mossy-stone', { tile: 0.2 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + hash3(i, 7, 7), r = 0.62 + hash3(i, 8, 8) * 0.08; add(ico(0.06 + hash3(i, 9, 9) * 0.05, 1), stone, g, Math.sin(a) * r, 0.03, Math.cos(a) * r).scale.set(1, 0.6, 1.2); }
  // the eyes in the front, in dark hollows
  const hollow = plain('#120c08', { roughness: 1 });
  for (const [x, y, s] of [[-0.13, 0.4, 1.25], [0.1, 0.43, 1.15], [0.27, 0.34, 0.9]]) { const z = Math.sqrt(Math.max(0, 0.27 - x * x * 0.9)) * (1 - (y - 0.3) * 0.5) + 0.04; add(sph(0.05 * s, 12, 8), hollow, body, x, y, z - 0.035).scale.set(1.3, 0.75, 0.45); const e = eye(body, V(x, y, z), 0.03 * s, '#ffa82a', 'v'); e.scale.set(1.25, 0.7, 0.8); }
  // cattails and a curled sprout on top
  const stalk = plain('#5a6a2a'), head = skinMat('#6a3e1c', 'boar-hide', { tile: 0.06 });
  cattail(body, V(0.06, 0.76, -0.05), 0.5, stalk, head, V(0.02, 0, 0));
  cattail(body, V(-0.08, 0.75, -0.1), 0.44, stalk, head, V(-0.04, 0, -0.01));
  add(tube(curve([V(0.12, 0.72, 0.04), V(0.16, 0.86, 0.05), V(0.22, 0.94, 0.06), V(0.27, 0.92, 0.06), V(0.26, 0.87, 0.06)], 16), t => 0.016 * (1 - t * 0.7), { n: 6 }), plain('#6e9a2e'), body);
  return finish(g, parts);
};

/* ---- Glowcap: a little mushroom folk: a plum cap with pale warts over gills that glow green, a pale bumpy body, a
   collar of leaves, leaf arms, stubby dark legs */
SCULPT.glowcap = () => {
  const g = new THREE.Group(), parts = { legs: [], arms: [] };
  const flesh = skinMat('#d9cdb0', 'mossy-stone', { tile: 0.3, bump: 0.6 }), stem = plain('#5a4434', { roughness: 0.8 });
  const body = new THREE.Group(); g.add(body); parts.body = body;
  add(lathe([[0, 0.1], [0.12, 0.11], [0.19, 0.2], [0.21, 0.33], [0.19, 0.46], [0.15, 0.56], [0.12, 0.66], [0, 0.7]], { n: 32 }), flesh, body);
  for (let i = 0; i < 16; i++) { const a = i * 2.4, y = 0.16 + (i % 6) * 0.06, r = [0.19, 0.205, 0.21, 0.205, 0.19, 0.17][i % 6]; add(sph(0.022, 8, 6), flesh, body, Math.sin(a) * r, y, Math.cos(a) * r).scale.set(1, 1, 0.6); }
  // a face under the cap: two dark eyes
  for (const s of [-1, 1]) add(sph(0.022, 10, 8), plain('#120c0a', { roughness: 0.2 }), body, s * 0.05, 0.62, 0.115).scale.set(0.8, 1.15, 0.5);
  // the collar of leaves
  const leafM = skinMat('#b8ae84', null, { roughness: 0.7, side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; leaf(body, leafM, V(Math.sin(a) * 0.14, 0.55, Math.cos(a) * 0.14), V(Math.sin(a), -0.45, Math.cos(a)), 0.1, 0.05, a, 0.4); }
  // leaf arms
  for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(s * 0.19, 0.42, 0.02); body.add(arm); parts.arms.push(arm); for (let k = 0; k < 3; k++) leaf(arm, leafM, V(), V(s, -0.5 - k * 0.3, 0.2 - k * 0.2), 0.12 - k * 0.02, 0.04, 0, 0.4); }
  // stubby legs
  for (const s of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(s * 0.08, 0.13, 0); g.add(leg); parts.legs.push(leg); add(tube([V(0, 0, 0), V(0, -0.1, 0.01)], t => lerp(0.05, 0.055, t), { n: 10 }), stem, leg); add(sph(0.055, 10, 8), stem, leg, 0, -0.11, 0.02).scale.set(1, 0.55, 1.3); }
  // the cap, the warts on it, the glowing gills under it
  const cap = new THREE.Group(); cap.position.y = 0.68; body.add(cap); parts.head = cap;
  const capG = lathe([[0.44, -0.02], [0.45, 0.02], [0.42, 0.1], [0.34, 0.2], [0.22, 0.27], [0.08, 0.3], [0, 0.305]], { n: 48 });
  paint(capG, (x, y, z) => mix3('#7a3646', [['#5a2434', smooth((0.05 - y) / 0.06) * 0.7], ['#93505e', fbm3(x * 8, y * 8, z * 8) * 0.5]]));
  add(capG, paintMat('mushroom-cap', { tile: 0.3, bump: 1.4, roughness: 0.55 }), cap);
  const wart = skinMat('#d8c6a4', 'mossy-stone', { tile: 0.1 });
  for (let i = 0; i < 22; i++) { const d = fib(i, 44); if (d.y < 0.2) continue; const r = 0.42 * Math.sqrt(1 - d.y * d.y) / Math.max(0.3, Math.hypot(d.x, d.z)) * Math.hypot(d.x, d.z); const yy = 0.02 + d.y * 0.28; add(ico(0.022 + hash3(i, 2, 2) * 0.016, 1), wart, cap, d.x / Math.hypot(d.x, d.z) * r * 0.98, yy, d.z / Math.hypot(d.x, d.z) * r * 0.98).scale.set(1.3, 0.55, 1.3); }
  const gill = glowMat('#8cff3c', 0.9);
  add(lathe([[0.43, -0.015], [0.3, 0.02], [0.13, 0.04]], { n: 48 }), new THREE.MeshStandardMaterial({ color: col('#5ec42a'), emissive: col('#4fd424'), emissiveIntensity: 0.6, side: THREE.DoubleSide }), cap);
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; const w = add(wedge([[0.13, 0.03], [0.43, -0.02], [0.43, -0.008], [0.13, 0.045]], 0.006), gill, cap); w.rotation.set(0, a, 0); }
  parts.core = null;
  return finish(g, parts);
};

/* ---- Rotgrub: a fat pale grub in rings, dark freckles, a tan pointed tail, little dark claws under its front */
SCULPT.rotgrub = () => {
  const g = new THREE.Group(), parts = { segments: [] };
  const body = new THREE.Group(); g.add(body); parts.body = body;
  const gm = paintMat('leech-grub', { tile: 0.3, bump: 0.7, roughness: 0.45 }), claw = plain('#3a2416', { roughness: 0.35 });
  const N = 9;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), r = lerp(0.2, 0.09, Math.pow(t, 1.3)), z = lerp(0.52, -0.6, t), y = r * 0.95 + Math.sin(t * Math.PI) * 0.02;
    const seg = new THREE.Group(); seg.position.set(0, y, z); body.add(seg); parts.segments.push(seg);
    const sg = sph(r, 22, 16);
    paint(sg, (x, yy, zz) => { const edge = Math.abs(zz) / r, n = fbm3(x * 14 + i * 3, yy * 14, zz * 14 + i); return mix3('#ddd6b4', [['#8e8460', smooth((edge - 0.5) / 0.4) * 0.9], ['#c8c49a', (yy < -r * 0.3) ? 0.4 : 0], ['#3a2c1e', n > 0.78 ? 0.85 : 0]]); });
    add(sg, gm, seg).scale.set(1.05, 0.95, 0.66);
  }
  // the tail tip
  const tip = new THREE.Group(); tip.position.set(0, 0.09, -0.64); body.add(tip); parts.tail = tip;
  add(paint(lathe([[0.075, 0], [0.065, -0.05], [0.045, -0.1], [0.02, -0.14], [0, -0.16]], { n: 18 }), (x, y) => mix('#c99a5e', '#a87a40', Math.sin(y * 120) * 0.5 + 0.5)), paintMat('leech-grub', { tile: 0.1 }), tip).rotation.x = Math.PI / 2;
  // the head end: a dark mouth with mandibles
  const head = new THREE.Group(); head.position.set(0, 0.17, 0.65); body.add(head); parts.head = head;
  add(sph(0.08, 14, 10), plain('#3a2416', { roughness: 0.4 }), head).scale.set(1.1, 0.8, 0.4);
  for (const s of [-1, 1]) { thorn(head, claw, V(s * 0.05, -0.03, 0.02), V(s * 0.3, -0.2, 1), 0.08, 0.014, V(-s, 0, 0)); add(sph(0.012, 8, 6), plain('#0a0806', { roughness: 0.2 }), head, s * 0.07, 0.04, 0.0); }
  // little legs under the front rings, stubs under the rest
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const seg = parts.segments[i]; const r = lerp(0.2, 0.09, Math.pow(i / (N - 1), 1.3)); thorn(seg, claw, V(s * r * 0.55, -r * 0.6, 0.02), V(s * 0.5, -1, 0.3), 0.07, 0.014, V(0, 0, 1)); }
  for (let i = 4; i < N - 1; i++) for (const s of [-1, 1]) { const seg = parts.segments[i]; const r = lerp(0.2, 0.09, Math.pow(i / (N - 1), 1.3)); add(sph(r * 0.18, 8, 6), claw, seg, s * r * 0.5, -r * 0.82, 0); }
  return finish(g, parts);
};

/* ---- Sapwight: a tall thin walker of twisted bark strips, moss in patches, amber eyes weeping sap, branches on its
   head with glowing buds, long twig fingers */
SCULPT.sapwight = () => {
  const g = new THREE.Group(), parts = { legs: [], arms: [] };
  const bark = skinMat('#6a4a2c', 'bark-sap', { tile: 0.14, bump: 2 }), strip = skinMat('#8a6640', 'bark-sap', { tile: 0.14, bump: 2 }), moss = skinMat('#6c7a2c', 'mossy-stone', { tile: 0.12 });
  const sap = new THREE.MeshPhysicalMaterial({ color: col('#24150a'), roughness: 0.12, clearcoat: 1 }), bud = glowMat('#ffc23a', 1.8);
  // strips twisted round a core between two heights, following a centre line
  const strips = (parent, from, to, r0, r1, n, turn, m1, m2, seed) => { for (let k = 0; k < n; k++) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = k / n * TAU + t * turn + Math.sin(seed + k) * 0.3, c = from.clone().lerp(to, t), r = lerp(r0, r1, t); pts.push(c.add(V(Math.cos(a) * r, 0, Math.sin(a) * r * 0.8))); } add(tube(curve(pts, 16), [lerp(r0, r1, 0.5) * 0.32, lerp(r0, r1, 0.5) * 0.46], { n: 7, up: V(0, 0, 1), shape: shag(0.15, 3, 9) }), k % 2 ? m1 : m2, parent); } };
  const torso = new THREE.Group(); torso.position.y = 0.5; g.add(torso); parts.torso = torso;
  add(lathe([[0.07, 0], [0.085, 0.1], [0.095, 0.22], [0.11, 0.3], [0.05, 0.36]], { n: 12, sz: 0.75 }), bark, torso);
  strips(torso, V(0, -0.02, 0), V(0, 0.33, 0), 0.085, 0.11, 7, 1.6, bark, strip, 1);
  for (const [x, y, z, s] of [[0.07, 0.3, 0.04, 1], [-0.08, 0.28, -0.02, 1.1], [0.02, 0.12, 0.08, 0.9], [-0.05, 0.02, -0.06, 0.8]]) add(ico(0.04 * s, 1), moss, torso, x, y, z).scale.set(1.2, 0.5, 1);
  // the head: long, low between the shoulders, two eyes deep in it, sap running down
  const head = new THREE.Group(); head.position.set(0, 0.4, 0.03); torso.add(head); parts.head = head;
  add(sph(0.06, 14, 12), bark, head).scale.set(0.85, 1.35, 0.95);
  strips(head, V(0, -0.07, 0), V(0, 0.08, 0), 0.05, 0.04, 5, 1.2, bark, strip, 4);
  for (const s of [-1, 1]) { eye(head, V(s * 0.022, 0.015, 0.05), 0.011, '#ffb622'); add(tube(curve([V(s * 0.022, 0.0, 0.055), V(s * 0.026, -0.04, 0.058), V(s * 0.02, -0.08, 0.05)], 8), t => 0.005 * (1 - t * 0.5), { n: 5 }), sap, head); add(sph(0.007, 6, 4), sap, head, s * 0.02, -0.085, 0.05); }
  // branches like antlers, buds glowing at the tips
  const branch = (parent, base, dir, len, r, depth) => { const end = base.clone().addScaledVector(dir.clone().normalize(), len); add(tube(curve([base, base.clone().lerp(end, 0.5).add(V(0, len * 0.08, 0)), end], 6), t => r * (1 - t * 0.6), { n: 5 }), bark, parent); if (depth <= 0) { add(sph(r * 1.2, 8, 6), bud, parent, end.x, end.y, end.z); return; } branch(parent, end, dir.clone().add(V(0.35, 0.2, 0)), len * 0.7, r * 0.6, depth - 1); branch(parent, end, dir.clone().add(V(-0.35, 0.25, 0.1)), len * 0.65, r * 0.6, depth - 1); };
  branch(head, V(0.02, 0.07, 0), V(0.25, 1, -0.1), 0.07, 0.008, 2); branch(head, V(-0.02, 0.07, 0), V(-0.25, 1, -0.1), 0.07, 0.008, 2);
  // arms: long, strips, hands of long twig fingers
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.12, 0.31, 0); torso.add(arm); parts.arms.push(arm);
    add(sph(0.045, 10, 8), strip, arm);
    strips(arm, V(0, 0, 0), V(s * 0.03, -0.44, 0.04), 0.035, 0.022, 4, 1.4, bark, strip, s * 3);
    add(tube(curve([V(0, 0, 0), V(s * 0.02, -0.22, 0.02), V(s * 0.03, -0.44, 0.04)], 10), t => lerp(0.03, 0.018, t), { n: 8 }), bark, arm);
    for (let f = 0; f < 4; f++) { const a = (f - 1.5) * 0.35; thorn(arm, bark, V(s * 0.03, -0.45, 0.04), V(Math.sin(a) * 0.5 + s * 0.15, -1, Math.cos(a) * 0.4), 0.11, 0.008, V(0, 0, 0.6), 5); }
    add(ico(0.03, 1), moss, arm, s * 0.01, -0.04, 0.02).scale.set(1.2, 0.6, 1);
  }
  // legs: long, rooty feet
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.055, 0.5, 0); g.add(leg); parts.legs.push(leg);
    strips(leg, V(0, 0, 0), V(s * 0.01, -0.47, 0.01), 0.04, 0.026, 5, 1.2, bark, strip, s * 7);
    add(tube(curve([V(0, 0, 0), V(0, -0.25, 0.015), V(s * 0.01, -0.47, 0.01)], 10), t => lerp(0.038, 0.022, t), { n: 8 }), bark, leg);
    for (const a of [-0.6, 0, 0.6, Math.PI]) thorn(leg, bark, V(s * 0.01, -0.47, 0.01), V(Math.sin(a), -0.35, Math.cos(a)), 0.07, 0.012, V(0, -0.5, 0), 5);
    add(ico(0.03, 1), moss, leg, 0, -0.2, 0.025).scale.set(1, 0.5, 0.8);
  }
  return finish(g, parts);
};

/* ---- Gloamwing: a great pale moth, wings of dusk lilac with dark scalloped edges and golden eyes, feathered gold
   antennae, a golden bell hung from a harness under it */
function wingTexture(fore) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#c4bccf'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(${90 + (i * 37) % 60},${80 + (i * 53) % 50},${110 + (i * 29) % 50},0.12)`; x.beginPath(); x.ellipse((i * 97) % 512, (i * 61) % 512, 40, 14, (i % 7) * 0.4, 0, TAU); x.fill(); }
  // veins from the root (0, 256 in picture space: the root is at the left, the wing tip at the right)
  x.strokeStyle = 'rgba(70,60,80,.55)'; x.lineWidth = 3; for (let k = -4; k <= 4; k++) { x.beginPath(); x.moveTo(0, 256); x.quadraticCurveTo(220, 256 + k * 30, 500, 256 + k * 62); x.stroke(); }
  // the dark scalloped edge with pale dots
  x.fillStyle = '#4a3f58'; x.beginPath(); x.arc(256, 256, 256, 0, TAU); x.arc(256, 256, 218, 0, TAU, true); x.fill();
  x.fillStyle = '#4a3f58'; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; x.beginPath(); x.arc(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214, 22, 0, TAU); x.fill(); }
  x.fillStyle = '#e8e2ec'; for (let i = 0; i < 18; i++) { const a = (i + 0.5) / 18 * TAU; x.beginPath(); x.arc(256 + Math.cos(a) * 236, 256 + Math.sin(a) * 236, 6, 0, TAU); x.fill(); }
  // the golden eye
  const ex = fore ? 330 : 300, ey = 256, R = fore ? 62 : 44;
  for (const [r, c2] of [[R, '#3a3046'], [R * 0.82, '#d8b04a'], [R * 0.62, '#8a6a26'], [R * 0.45, '#e8cf7a'], [R * 0.2, '#2a2030']]) { x.fillStyle = c2; x.beginPath(); x.arc(ex, ey, r, 0, TAU); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
SCULPT.gloamwing = () => {
  const g = new THREE.Group(), parts = { wings: [] };
  const float = new THREE.Group(); float.position.y = 0.42; g.add(float); parts.float = float;
  const fluff = skinMat('#ece6dc', 'feathers', { tile: 0.08, bump: 1.4 }), fluff2 = skinMat('#cfc6bc', 'feathers', { tile: 0.08, bump: 1.4 }), gold = new THREE.MeshPhysicalMaterial({ color: col('#d8a83a'), metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  // body: a furry thorax, a smaller head, a hanging abdomen
  const body = new THREE.Group(); float.add(body); parts.body = body;
  add(sph(0.13, 18, 14), fluff, body, 0, 0.2, 0).scale.set(1, 1.1, 0.95);
  add(lathe([[0, 0.1], [0.09, 0.08], [0.1, 0.0], [0.08, -0.12], [0.04, -0.2], [0, -0.22]], { n: 16 }), fluff2, body, 0, 0.12, -0.04);
  for (let i = 0; i < 70; i++) { const d = fib(i, 70); tuft(body, i % 2 ? fluff : fluff2, d.clone().multiplyScalar(0.115).add(V(0, 0.2, 0)), d.clone().add(V(0, -0.8, 0)), 0.045, 0.03); }
  const head = new THREE.Group(); head.position.set(0, 0.33, 0.08); float.add(head); parts.head = head;
  add(sph(0.07, 14, 10), fluff, head);
  for (const s of [-1, 1]) {
    add(sph(0.032, 12, 10), new THREE.MeshPhysicalMaterial({ color: col('#140e1a'), roughness: 0.1, clearcoat: 1 }), head, s * 0.045, 0.0, 0.04);
    // a feathered antenna
    const pts = curve([V(s * 0.02, 0.05, 0.04), V(s * 0.08, 0.2, 0.0), V(s * 0.17, 0.3, -0.08), V(s * 0.24, 0.33, -0.16)], 18);
    add(tube(pts, t => 0.006 * (1 - t * 0.5), { n: 5 }), gold, head);
    pts.forEach((p, i) => { if (i % 1 === 0 && i > 1) for (const k of [-1, 1]) add(tube([p, p.clone().add(V(k * 0.012, 0.025 * (1 - i / 20) + 0.01, k * 0.02))], 0.002, { n: 3 }), gold, head); });
  }
  // the wings: fore and hind on each side, on their own hinges
  const shapeOf = (pts) => { const sh = new THREE.Shape(pts.map(([px, py]) => new THREE.Vector2(px, py))); const geo = new THREE.ShapeGeometry(sh, 24); const p = geo.attributes.position, uv = geo.attributes.uv; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < p.count; i++) { x0 = Math.min(x0, p.getX(i)); x1 = Math.max(x1, p.getX(i)); y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); } const s = Math.max(x1 - x0, y1 - y0); for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / s, 0.5 + (p.getY(i) - (y0 + y1) / 2) / s); return geo; };
  const lobe = (len, h, up) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; const r = 1 + 0.06 * Math.sin(i * 1.7); pts.push([Math.sin(a) * len * r, (Math.cos(a) * h + up * Math.sin(a) * h * 0.6) * r]); } pts.push([0, -h * 0.1]); return pts; };
  const foreM = new THREE.MeshStandardMaterial({ map: wingTexture(true), side: THREE.DoubleSide, roughness: 0.7 }), hindM = new THREE.MeshStandardMaterial({ map: wingTexture(false), side: THREE.DoubleSide, roughness: 0.7 });
  const foreG = shapeOf(lobe(0.62, 0.3, 0.5)), hindG = shapeOf(lobe(0.44, 0.24, -0.6));
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.08, 0.22, -0.02); w.rotation.y = s * 0.15; float.add(w); parts.wings.push([w, s]);
    const f = add(foreG, foreM, w, 0, 0.04, 0); f.scale.x = s; f.rotation.z = s * 0.35;
    const h = add(hindG, hindM, w, 0, -0.05, -0.01); h.scale.x = s; h.rotation.z = -s * 0.45;
  }
  // the harness and the bell under it
  for (const s of [-1, 1]) add(tube(curve([V(s * 0.1, 0.32, 0.06), V(0, 0.2, 0.13), V(-s * 0.09, 0.08, 0.08)], 12), 0.007, { n: 5 }), gold, float);
  add(lathe([[0, 0.02], [0.035, 0.015], [0.04, 0], [0.035, -0.015], [0, -0.02]], { n: 16 }), gold, float, 0, 0.2, 0.13).rotation.x = Math.PI / 2;
  add(tube(curve([V(0, 0.08, 0.06), V(0, -0.05, 0.05), V(0, -0.2, 0.03)], 8), 0.006, { n: 5 }), gold, float);
  const bell = new THREE.Group(); bell.position.set(0, -0.2, 0.03); float.add(bell);
  add(lathe([[0, 0], [0.02, -0.005], [0.04, -0.03], [0.05, -0.08], [0.065, -0.14], [0.085, -0.17], [0.085, -0.18], [0.0, -0.17]], { n: 32 }), gold, bell);
  add(tor(0.02, 0.006, 6, 14), gold, bell, 0, 0.012, 0);
  add(tor(0.07, 0.006, 6, 24), gold, bell, 0, -0.12, 0).rotation.x = Math.PI / 2;
  add(sph(0.02, 10, 8), gold, bell, 0, -0.19, 0);
  for (const s of [-1, 1]) add(cone(0.015, 0.07, 6), skinMat('#c8962e', null), bell, s * 0.05, -0.03, 0).rotation.z = s * 0.1;
  return finish(g, parts);
};

/* ---- Mirelord: a huge toad, green with gold-ringed blotches and a pale belly, great orange eyes, a crown of reeds
   and cattails with a pale stone at its front */
SCULPT.mirelord = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const body = new THREE.Group(); g.add(body); parts.body = body;
  const skinCol = (x, y, z) => { const n = fbm3(x * 4.5, y * 4.5, z * 4.5, 3), ring = Math.abs(n - 0.62), belly = smooth((0.42 - y + z * 0.25) / 0.08) * (z > -0.05 ? 1 : 0); return mix3('#3c7a2c', [['#2a5a20', fbm3(x * 12, y * 12, z * 12) * 0.5], ['#d8a432', (ring < 0.035 ? 1 : 0) * (1 - belly)], ['#6a8a2c', (n > 0.62 ? 0.5 : 0) * (1 - belly)], ['#d8d290', belly]]); };
  const frog = paintMat('frog', { tile: 0.3, bump: 1.6, roughness: 0.45, physical: true, clearcoat: 0.3 });
  const bg = sph(0.48, 40, 30), p = bg.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const front = smooth(z / 0.48); y *= y < 0 ? 0.55 : 0.78 - front * 0.12; z *= 0.92; x *= 1.05 + (y < 0 ? 0.08 : 0); if (y < -0.2) y = -0.2 - (y + 0.2) * 0.2; p.setXYZ(i, x, y + 0.42, z); }
  bg.computeVertexNormals(); add(paint(bg, skinCol), frog, body);
  // the mouth line
  add(tube(curve([V(-0.42, 0.42, 0.15), V(-0.25, 0.37, 0.38), V(0, 0.35, 0.44), V(0.25, 0.37, 0.38), V(0.42, 0.42, 0.15)], 20), 0.012, { n: 6 }), plain('#1a2a10'), body);
  // eyes: great orange domes with level slit pupils under heavy lids
  for (const s of [-1, 1]) {
    add(paint(sph(0.12, 16, 12), skinCol, V(s * 0.21, 0.66, 0.24)), frog, body, s * 0.21, 0.66, 0.24).scale.set(1, 0.85, 1);
    const e = eye(body, V(s * 0.22, 0.68, 0.31), 0.085, '#f0a028', 'h'); e.material.emissiveIntensity = 0.5;
    add(sph(0.095, 16, 10, 0, TAU, 0, Math.PI * 0.4), skinMat('#3c7a2c', 'frog', { tile: 0.3 }), body, s * 0.22, 0.69, 0.3).rotation.x = 0.5;
  }
  // legs: front arms with splayed fingers, folded hind legs
  const limbM = paintMat('frog', { tile: 0.3, bump: 1.6, roughness: 0.45 });
  for (const s of [-1, 1]) {
    const fl = new THREE.Group(); fl.position.set(s * 0.32, 0.28, 0.25); g.add(fl); parts.legs.push(fl);
    add(paint(tube(curve([V(0, 0, 0), V(s * 0.06, -0.12, 0.06), V(s * 0.08, -0.25, 0.12)], 10), t => lerp(0.09, 0.055, t), { n: 12 }), skinCol, V(s * 0.32, 0.28, 0.25)), limbM, fl);
    for (let f = 0; f < 4; f++) { const a = (f - 1.5) * 0.45; const base = V(s * 0.08, -0.27, 0.13), tip = base.clone().add(V(Math.sin(a) * 0.11 + s * 0.03, -0.01, Math.cos(a) * 0.11)); add(tube([base, tip], 0.018, { n: 6 }), limbM, fl); add(sph(0.022, 8, 6), skinMat('#d8a432', null), fl, tip.x, tip.y, tip.z); }
    const hl = new THREE.Group(); hl.position.set(s * 0.4, 0.22, -0.18); g.add(hl); parts.legs.push(hl);
    add(paint(sph(0.2, 18, 14), skinCol, V(s * 0.4, 0.22, -0.18)), limbM, hl).scale.set(0.8, 0.95, 1.35);
    add(paint(tube(curve([V(s * 0.05, -0.12, 0.15), V(s * 0.12, -0.18, 0.3), V(s * 0.12, -0.21, 0.38)], 8), t => lerp(0.07, 0.04, t), { n: 10 }), skinCol, V(s * 0.4, 0.22, -0.18)), limbM, hl);
    for (let f = 0; f < 4; f++) { const a = (f - 1.5) * 0.4 + s * 0.3; const base = V(s * 0.12, -0.21, 0.38), tip = base.clone().add(V(Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12)); add(tube([base, tip], 0.017, { n: 6 }), limbM, hl); add(sph(0.02, 8, 6), skinMat('#d8a432', null), hl, tip.x, tip.y, tip.z); }
  }
  // the crown: a woven ring, reeds, cattails, a pale stone at the front
  const crown = new THREE.Group(); crown.position.set(0, 0.74, 0.12); body.add(crown); parts.head = crown;
  const weave = skinMat('#7a8a3a', 'river-weed', { tile: 0.08 }), reed = skinMat('#5e8a2e', null, { side: THREE.DoubleSide }), gold = new THREE.MeshPhysicalMaterial({ color: col('#c8a03a'), metalness: 0.8, roughness: 0.35 });
  add(tor(0.13, 0.025, 8, 28), weave, crown).rotation.x = Math.PI / 2;
  add(tor(0.135, 0.008, 6, 28), gold, crown, 0, 0.02, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, h = 0.12 + hash3(i, 1, 1) * 0.14; leaf(crown, reed, V(Math.sin(a) * 0.12, 0.01, Math.cos(a) * 0.12), V(Math.sin(a) * 0.25, 1, Math.cos(a) * 0.25), h, 0.014, a); }
  const stalk = plain('#5a6a2a'), cat = skinMat('#7a4a1e', 'boar-hide', { tile: 0.05 });
  for (const [x, z, h] of [[-0.06, -0.06, 0.32], [0.05, -0.08, 0.36], [0.1, 0.0, 0.28], [-0.1, 0.03, 0.26]]) cattail(crown, V(x, 0, z), h, stalk, cat, V(x * 0.3, 0, 0));
  add(sph(0.05, 14, 10), skinMat('#ece4cc', 'mossy-stone', { tile: 0.1, roughness: 0.4 }), crown, 0, 0.04, 0.13);
  return finish(g, parts);
};

/* ---- Old Snag: a great shaggy boar, brown with pale bands, a bristling dark mane, curling tusks, an old axe still in
   its back with a green rag tied to it */
SCULPT.oldsnag = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const hc = (x, y, z) => { const n = fbm3(x * 5, y * 5, z * 5), band = smooth((Math.sin(z * 16 + y * 5 + n * 3) - 0.55) / 0.2) * smooth((0.78 - y) / 0.15) * smooth((y - 0.38) / 0.1); return mix3('#5c3b22', [['#3a2414', smooth((y - 0.82) / 0.1) + (n - 0.5) * 0.5], ['#8e6c48', band * 0.85], ['#3a2618', smooth((0.42 - y) / 0.1)]]); };
  const hide = paintMat('boar-hide', { tile: 0.2, bump: 1.8 }, hc), dark = skinMat('#2a1a10', 'boar-hide', { tile: 0.2, bump: 1.8 });
  const spine = [V(0, 0.56, -0.48), V(0, 0.62, -0.2), V(0, 0.7, 0.12), V(0, 0.64, 0.42)];
  bodyTube(g, hide, spine, t => [0.24 + Math.sin(t * Math.PI) * 0.05, 0.25 + Math.sin(t * Math.PI) * 0.06 + smooth((t - 0.5) / 0.4) * 0.04], { shape: shag(0.05), paint: hc, round: 0.8 });
  // the bristling mane down the back
  for (let i = 0; i < 46; i++) { const t = i / 45, p = curve(spine, 45)[i], h = 0.1 + Math.sin(Math.PI * (1 - t) * 0.9) * 0.12; for (const s of [-1, 0, 1]) tuft(g, dark, p.clone().add(V(s * 0.06, 0.26 + Math.sin(t * Math.PI) * 0.06 - Math.abs(s) * 0.03, 0)), V(s * 0.4, 1, -0.5), h * (s ? 0.75 : 1), 0.025); }
  // flank tufts
  for (let i = 0; i < 30; i++) { const d = fib(i, 30); if (Math.abs(d.x) < 0.5) continue; tuft(g, hide, V(d.x * 0.26, 0.6 + d.y * 0.2, d.z * 0.4), V(d.x, -0.6, -0.2), 0.1, 0.03); }
  // the head: a long wedge, the pink snout disc, tusks, little eyes, pointed ears
  const head = new THREE.Group(); head.position.set(0, 0.58, 0.55); g.add(head); parts.head = head;
  const hcH = (x, y, z) => hc(x, y + 0.58, z + 0.55);
  add(paint(tube(curve([V(0, 0.06, -0.12), V(0, 0.0, 0.08), V(0, -0.06, 0.3)], 12), t => [lerp(0.17, 0.085, t), lerp(0.18, 0.08, t)], { n: 16, shape: shag(0.04) }), hcH), hide, head);
  add(paint(tube(curve([V(0, -0.1, -0.05), V(0, -0.12, 0.12), V(0, -0.1, 0.26)], 10), t => [lerp(0.13, 0.06, t), lerp(0.06, 0.035, t)], { n: 12 }), () => col('#4a3020')), hide, head);
  const snout = plain('#c48478', { roughness: 0.5 });
  add(new THREE.CylinderGeometry(0.075, 0.08, 0.04, 20), snout, head, 0, -0.065, 0.31).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) add(sph(0.015, 8, 6), plain('#2a1410'), head, s * 0.028, -0.065, 0.335).scale.set(1, 1.3, 0.5);
  const ivory = skinMat('#efe4c8', null, { roughness: 0.35 });
  for (const s of [-1, 1]) {
    add(tube(curve([V(s * 0.06, -0.11, 0.2), V(s * 0.13, -0.08, 0.25), V(s * 0.15, 0.0, 0.22), V(s * 0.11, 0.05, 0.17)], 12), t => 0.022 * Math.pow(1 - t, 0.8) + 0.002, { n: 8 }), ivory, head);
    eye(head, V(s * 0.1, 0.06, 0.1), 0.014, '#e88a24');
    const ear = add(cone(0.06, 0.14, 6), dark, head, s * 0.12, 0.14, -0.08); ear.rotation.set(-0.6, 0, -s * 0.7); ear.scale.set(1, 1, 0.4);
    for (let k = 0; k < 6; k++) tuft(head, hide, V(s * 0.14, -0.02 - k * 0.02, -0.02 + k * 0.02), V(s, -0.4, -0.3), 0.08, 0.025);
  }
  // legs, short and thick; split hooves
  const hoof = plain('#1a1210', { roughness: 0.35 });
  [[0.15, 0.5, 0.32], [-0.15, 0.5, 0.32], [0.15, 0.5, -0.36], [-0.15, 0.5, -0.36]].forEach(([x, y, z]) => {
    joint(g, hide, V(x * 0.8, y + 0.05, z), 0.13, hc).scale.set(0.8, 1.1, 1);
    const leg = new THREE.Group(); leg.position.set(x, y, z); g.add(leg); parts.legs.push(leg);
    add(paint(tube(curve([V(0, 0.05, 0), V(0, -0.22, 0.02), V(0, -0.44, 0)], 10), t => lerp(0.1, 0.045, Math.pow(t, 0.8)), { n: 12, shape: shag(0.08) }), (px, py, pz) => mix('#3a2618', '#24160e', smooth((-0.25 - py) / 0.15))), hide, leg);
    for (const s of [-1, 1]) add(cone(0.028, 0.07, 6), hoof, leg, s * 0.02, -0.46, 0.015).rotation.x = Math.PI;
  });
  // a thin tail with a dark tuft
  const tail = new THREE.Group(); tail.position.set(0, 0.68, -0.68); g.add(tail); parts.tail = tail;
  add(tube(curve([V(0, 0, 0), V(0, -0.1, -0.06), V(0, -0.24, -0.05)], 8), 0.015, { n: 6 }), dark, tail);
  for (let k = 0; k < 8; k++) tuft(tail, dark, V(0, -0.24, -0.05), V(Math.sin(k) * 0.4, -1, Math.cos(k) * 0.4), 0.09, 0.015);
  // the old axe in its back, a wound round it, a green rag tied on the haft
  const axe = new THREE.Group(); axe.position.set(0.05, 0.93, 0.05); axe.rotation.set(-0.5, 0, -0.35); g.add(axe);
  add(tube([V(0, -0.02, 0), V(0, 0.42, 0)], 0.018, { n: 8 }), skinMat('#7a5432', null, { roughness: 0.7 }), axe);
  add(wedge([[-0.01, -0.03], [0.12, -0.08], [0.15, 0.0], [0.12, 0.07], [-0.01, 0.03]], 0.012, (x) => 1 - x * 4), new THREE.MeshPhysicalMaterial({ color: col('#7c8590'), metalness: 0.9, roughness: 0.45 }), axe, -0.01, 0.06, 0).rotation.y = Math.PI / 2;
  add(tube([V(0, 0.38, 0), V(0, 0.44, 0)], 0.022, { n: 8 }), plain('#3a2a1a'), axe);
  for (let k = 0; k < 3; k++) leaf(axe, skinMat('#6aa040', null, { side: THREE.DoubleSide }), V(0.02, 0.32, 0), V(0.4 + k * 0.2, -1, 0.3), 0.11, 0.025, k);
  add(sph(0.06, 12, 8), new THREE.MeshPhysicalMaterial({ color: col('#5a1810'), roughness: 0.2, clearcoat: 1 }), g, 0.04, 0.9, 0.03).scale.set(1, 0.3, 1.2);
  return finish(g, parts);
};

/* ---- Rotstag: a white stag blotched with the rot's purple-grey, dark legs, great antlers with a golden crown of
   points caught among them, a ruff at its throat */
SCULPT.rotstag = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const cc = (x, y, z) => { const n = fbm3(x * 5 + 3, y * 5, z * 5, 4); return mix3('#e8e4ec', [['#c8c2d2', fbm3(x * 14, y * 14, z * 14) * 0.6], ['#6a5a7c', smooth((n - 0.6) / 0.05) * 0.85], ['#4a3c5a', smooth((0.3 - y) / 0.12)]]); };
  const coat = paintMat('wolf-fur', { tile: 0.14, bump: 1.3 }, cc);
  const spine = [V(0, 0.56, -0.32), V(0, 0.57, -0.08), V(0, 0.58, 0.14), V(0, 0.6, 0.3)];
  bodyTube(g, coat, spine, t => [0.11 + Math.sin(t * Math.PI) * 0.025, 0.13 + Math.sin(t * Math.PI) * 0.02 + smooth((t - 0.6) / 0.4) * 0.03], { shape: shag(0.05), paint: cc, round: 0.9 });
  // neck rising to the head, a ruff at the throat
  add(paint(tube(curve([V(0, 0.62, 0.26), V(0, 0.76, 0.36), V(0, 0.9, 0.42)], 10), t => [lerp(0.09, 0.055, t), lerp(0.1, 0.06, t)], { n: 14, shape: shag(0.06) }), cc), coat, g);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI - Math.PI / 2; tuft(g, coat, V(Math.sin(a) * 0.08, 0.68 - Math.abs(Math.sin(a)) * 0.02, 0.38 + Math.cos(a) * 0.04), V(Math.sin(a) * 0.4, -0.8, 0.6), 0.1, 0.03); }
  const head = new THREE.Group(); head.position.set(0, 0.93, 0.44); g.add(head); parts.head = head;
  const hcc = (x, y, z) => cc(x, y + 0.93, z + 0.44);
  add(paint(sph(0.065, 14, 12), hcc), coat, head).scale.set(0.95, 0.95, 1.1);
  add(paint(tube(curve([V(0, -0.01, 0.03), V(0, -0.035, 0.12), V(0, -0.05, 0.18)], 8), t => [lerp(0.045, 0.025, t), lerp(0.045, 0.024, t)], { n: 12 }), hcc), coat, head);
  add(sph(0.016, 8, 6), plain('#2a2030', { roughness: 0.25 }), head, 0, -0.045, 0.19);
  for (const s of [-1, 1]) {
    add(sph(0.012, 10, 8), new THREE.MeshPhysicalMaterial({ color: col('#140c18'), roughness: 0.1, clearcoat: 1 }), head, s * 0.045, 0.012, 0.05);
    const ear = add(sph(0.04, 10, 8), coat, head, s * 0.07, 0.05, -0.02); ear.scale.set(1.4, 0.45, 0.6); ear.rotation.z = s * 0.4;
  }
  // antlers: branching, pale horn darkening to the tips
  const horn = skinMat('#bab098', 'bark-sap', { tile: 0.06, bump: 1.2, roughness: 0.6 });
  const tine = (base, dir, len, r, depth, s) => { const end = base.clone().addScaledVector(dir.clone().normalize(), len); add(tube(curve([base, base.clone().lerp(end, 0.5).add(V(s * len * 0.06, 0, -len * 0.04)), end], 6), t => r * (1 - t * 0.55), { n: 6 }), horn, head); if (depth <= 0) return; tine(end, dir.clone().add(V(s * 0.25, 0.3, -0.15)), len * 0.82, r * 0.72, depth - 1, s); tine(end, dir.clone().add(V(s * 0.05, 0.6, 0.45)), len * 0.5, r * 0.6, depth - 2, s); };
  for (const s of [-1, 1]) tine(V(s * 0.035, 0.05, -0.01), V(s * 0.6, 1, -0.15), 0.1, 0.012, 4, s);
  // the golden crown of points among the antlers
  const gold = new THREE.MeshPhysicalMaterial({ color: col('#d4a840'), metalness: 1, roughness: 0.28, clearcoat: 0.4 });
  const crown = new THREE.Group(); crown.position.set(0, 0.27, -0.02); crown.rotation.x = -0.1; head.add(crown);
  add(tor(0.15, 0.007, 6, 40), gold, crown).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; const big = i % 2 === 0; const p = V(Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15); add(cone(0.008, big ? 0.07 : 0.035, 5), gold, crown, p.x, (big ? 0.035 : 0.018), p.z); if (big) add(tube([p.clone().add(V(-Math.cos(a) * 0.015, 0.045, Math.sin(a) * 0.015)), p.clone().add(V(Math.cos(a) * 0.015, 0.045, -Math.sin(a) * 0.015))], 0.004, { n: 4 }), gold, crown); }
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU; add(cone(0.004, 0.02, 4), gold, crown, Math.sin(a) * 0.15, -0.012, Math.cos(a) * 0.15).rotation.x = Math.PI; }
  // legs: long and thin, knees, dark below, small hooves
  const hoof = plain('#201820', { roughness: 0.3 });
  [[0.07, 0.5, 0.24, 1], [-0.07, 0.5, 0.24, 1], [0.07, 0.52, -0.26, 0], [-0.07, 0.52, -0.26, 0]].forEach(([x, y, z, f]) => {
    joint(g, coat, V(x * 0.9, y + 0.04, z), f ? 0.075 : 0.095, cc).scale.set(0.8, 1.2, 1);
    const leg = new THREE.Group(); leg.position.set(x, y, z); g.add(leg); parts.legs.push(leg);
    const pts = f ? [V(0, 0.04, 0), V(0, -0.22, 0.01), V(0, -0.36, -0.01), V(0, -0.49, 0.01)] : [V(0, 0.05, 0), V(0, -0.16, 0.06), V(0, -0.32, -0.06), V(0, -0.51, -0.01)];
    add(paint(tube(curve(pts, 12), t => lerp(f ? 0.06 : 0.075, 0.018, Math.pow(t, 0.55)), { n: 10, shape: shag(0.04) }), (px, py, pz) => cc(px + x, py + y, pz + z)), coat, leg);
    add(cone(0.022, 0.04, 6), hoof, leg, pts[3].x, pts[3].y - 0.01, pts[3].z + 0.005).rotation.x = Math.PI;
  });
  // a fluffy white tail held up
  const tail = new THREE.Group(); tail.position.set(0, 0.64, -0.4); g.add(tail); parts.tail = tail;
  for (let i = 0; i < 12; i++) tuft(tail, coat, V(0, 0, 0), V(Math.sin(i) * 0.5, 0.6 + (i % 3) * 0.2, -0.6 + Math.cos(i) * 0.3), 0.1, 0.03);
  return finish(g, parts);
};

/* ---- Briarmaw: a hulking beast of moss and briar, golden thorns along its back, gilded briar wound round it, long
   tusks hanging from its jaw, green eyes */
SCULPT.briarmaw = () => {
  const g = new THREE.Group(), parts = { legs: [] };
  const hc = (x, y, z) => { const n = fbm3(x * 4, y * 4, z * 4, 4); return mix3('#4a6a26', [['#2e4618', smooth((0.5 - y) / 0.2) * 0.8 + (n - 0.5) * 0.5], ['#7a8a3a', smooth((n - 0.62) / 0.08) * 0.6], ['#5a4a22', fbm3(x * 10, y * 10, z * 10) > 0.7 ? 0.5 : 0]]); };
  const hide = paintMat('thorn-hide', { tile: 0.24, bump: 2 }, hc);
  const spine = [V(0, 0.52, -0.55), V(0, 0.62, -0.22), V(0, 0.68, 0.12), V(0, 0.58, 0.42)];
  bodyTube(g, hide, spine, t => [0.3 + Math.sin(t * Math.PI) * 0.06, 0.3 + Math.sin(t * Math.PI) * 0.07], { shape: shag(0.06, 9, 17), paint: hc, round: 0.85 });
  // gilded briar wound round the body and legs
  const briar = new THREE.MeshPhysicalMaterial({ color: col('#b48a34'), metalness: 0.55, roughness: 0.4 });
  for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = t * TAU * (0.9 + k * 0.25) + k * 1.7 + Math.sin(t * 9 + k) * 0.4, c = curve(spine, 30)[i], rr = 0.31 + Math.sin(t * 7 + k * 2) * 0.03; pts.push(c.clone().add(V(Math.cos(a) * rr, Math.sin(a) * rr, 0))); } add(tube(curve(pts, 60), 0.013, { n: 6 }), briar, g); pts.forEach((p, i) => { if (i % 3 === 0 && p.y > 0.35) thorn(g, briar, p, p.clone().sub(curve(spine, 30)[i]).normalize(), 0.05, 0.008, V(0, 1, 0), 5); }); }
  // the golden spikes down the back, and smaller ones on the flanks
  const spike = skinMat('#d4a654', 'bark-sap', { tile: 0.1, roughness: 0.4 });
  const top = curve(spine, 14);
  top.forEach((p, i) => { if (i % 2) return; const t = i / 13, h = 0.06 + Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.09; thorn(g, spike, p.clone().add(V(0, 0.31, 0)), V(0, 1, -0.3), h, 0.045, V(0, 0, -0.4), 7); for (const s of [-1, 1]) thorn(g, spike, p.clone().add(V(s * 0.22, 0.24, 0.03)), V(s * 0.8, 0.8, -0.2), h * 0.55, 0.03, V(0, 0, -0.4), 6); });
  // the head: low and broad, spiked brow, tusks hanging down, green eyes
  const head = new THREE.Group(); head.position.set(0, 0.46, 0.66); g.add(head); parts.head = head;
  const hcH = (x, y, z) => hc(x, y + 0.46, z + 0.66);
  add(paint(sph(0.2, 20, 16), hcH), hide, head).scale.set(1.15, 0.85, 1);
  add(paint(tube(curve([V(0, -0.04, 0.05), V(0, -0.07, 0.18), V(0, -0.09, 0.26)], 8), t => [lerp(0.15, 0.1, t), lerp(0.1, 0.07, t)], { n: 14 }), hcH), hide, head);
  const jaw = plain('#1a120c', { roughness: 0.9 }); add(sph(0.11, 12, 8), jaw, head, 0, -0.15, 0.2).scale.set(1.1, 0.35, 0.8);
  const ivory = skinMat('#ece0c0', null, { roughness: 0.3 });
  for (const s of [-1, 1]) {
    add(tube(curve([V(s * 0.08, -0.1, 0.24), V(s * 0.09, -0.25, 0.27), V(s * 0.07, -0.38, 0.22), V(s * 0.05, -0.43, 0.15)], 14), t => 0.03 * Math.pow(1 - t, 0.7) + 0.003, { n: 10 }), ivory, head);
    eye(head, V(s * 0.1, 0.03, 0.17), 0.022, '#9cff3a', 'v');
    add(tube(curve([V(s * 0.04, 0.07, 0.18), V(s * 0.12, 0.08, 0.15), V(s * 0.19, 0.04, 0.08)], 8), 0.025, { n: 6 }), hide, head);
    for (let k = 0; k < 3; k++) thorn(head, spike, V(s * (0.06 + k * 0.06), 0.12 - k * 0.02, 0.1 - k * 0.04), V(s * 0.5, 1, -0.4), 0.09 - k * 0.015, 0.02, V(0, 0, -1));
    for (let k = 0; k < 4; k++) add(cone(0.01, 0.04, 5), ivory, head, s * (0.02 + k * 0.025), -0.12, 0.28 - k * 0.01).rotation.x = Math.PI;
  }
  // legs: thick pillars, the front ones bigger, claws
  const claw = skinMat('#d8c6a0', null, { roughness: 0.35 });
  [[0.22, 0.52, 0.32, 1], [-0.22, 0.52, 0.32, 1], [0.22, 0.48, -0.4, 0], [-0.22, 0.48, -0.4, 0]].forEach(([x, y, z, f]) => {
    joint(g, hide, V(x * 0.85, y + 0.06, z), 0.19, hc).scale.set(0.85, 1.1, 1);
    const leg = new THREE.Group(); leg.position.set(x, y, z); g.add(leg); parts.legs.push(leg);
    add(paint(tube(curve([V(0, 0.08, 0), V(x * 0.15, -0.22, 0.03), V(x * 0.1, -0.46, 0.02)], 10), t => lerp(f ? 0.15 : 0.14, 0.09, t), { n: 14, shape: shag(0.07) }), (px, py, pz) => hc(px + x, py + y, pz + z)), hide, leg);
    for (const k of [-1, 0, 1]) thorn(leg, claw, V(x * 0.1 + k * 0.05, -0.45, 0.08), V(k * 0.2, -0.4, 1), 0.06, 0.016, V(0, -1, 0));
    for (let i = 0; i <= 0; i++) { const pts = []; for (let j = 0; j <= 16; j++) { const t = j / 16, a = t * TAU * 1.5; pts.push(V(Math.cos(a) * 0.15, 0.02 - t * 0.4, Math.sin(a) * 0.15)); } add(tube(curve(pts, 24), 0.01, { n: 5 }), briar, leg); }
  });
  // a short thick tail with spikes
  const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.82); g.add(tail); parts.tail = tail;
  add(paint(tube(curve([V(0, 0, 0.05), V(0, -0.06, -0.15), V(0, -0.14, -0.3)], 8), t => 0.14 * (1 - t * 0.85), { n: 12, shape: shag(0.06) }), (x, y, z) => hc(x, y + 0.5, z - 0.82)), hide, tail);
  for (let k = 0; k < 3; k++) thorn(tail, spike, V(0, 0.08 - k * 0.07, -0.02 - k * 0.1), V(0, 1, -0.6), 0.08, 0.02, V(0, 0, -1));
  // moss on the shoulders
  for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1; add(ico(0.06, 1), skinMat('#6e8a34', 'mossy-stone', { tile: 0.12 }), g, s * (0.25 + hash3(i, 1, 1) * 0.08), 0.8 + hash3(i, 2, 2) * 0.1, 0.25 - (i >> 1) * 0.08).scale.set(1.2, 0.5, 1); }
  return finish(g, parts);
};

/* ---- the Rotwarden: a knight gone to root: dark green plate trimmed in gold, roots wound through every joint, an
   iron helm with branches growing from it, a golden face on a chain, a great root of a club dragging from one hand */
SCULPT.rotwarden = () => {
  const g = new THREE.Group(), parts = { legs: [], arms: [] };
  const plate = skinMat('#1f4a46', 'riveted-iron', { tile: 0.16, bump: 1.4, metalness: 0.65, roughness: 0.42, physical: true, clearcoat: 0.3 });
  const plate2 = skinMat('#173a38', 'riveted-iron', { tile: 0.16, bump: 1.4, metalness: 0.65, roughness: 0.48 });
  const gold = new THREE.MeshPhysicalMaterial({ color: col('#c8a040'), metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const iron = new THREE.MeshPhysicalMaterial({ color: col('#7a8088'), metalness: 0.9, roughness: 0.4 });
  const root = skinMat('#7a5a34', 'bark-sap', { tile: 0.1, bump: 1.8 }), moss = skinMat('#5e7a2c', 'mossy-stone', { tile: 0.1 }), leafM = skinMat('#8aa04a', null, { side: THREE.DoubleSide });
  const band = (parent, y, r, sz = 0.85, t = 0.01) => { const b = add(tor(r, t, 6, 32), gold, parent, 0, y, 0); b.rotation.x = Math.PI / 2; b.scale.set(1, sz, 1); return b; };
  // roots wound round a limb or the body, from a to b
  const roots = (parent, a, b, r, n, turns, seed) => { for (let k = 0; k < n; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, ang = t * TAU * turns * 0.6 + k * TAU / n + seed + Math.sin(t * 7 + k * 3 + seed) * 0.6, rr = r * (1 + Math.sin(t * 11 + k) * 0.06); pts.push(a.clone().lerp(b, t).add(V(Math.cos(ang) * rr, Math.sin(t * 13 + k) * r * 0.08, Math.sin(ang) * rr))); } add(tube(curve(pts, 24), t => 0.011 * (1 - t * 0.4) + 0.004, { n: 5 }), root, parent); } };
  const torso = new THREE.Group(); torso.position.y = 0.5; g.add(torso); parts.torso = torso;
  add(lathe([[0.15, 0], [0.17, 0.08], [0.2, 0.2], [0.21, 0.28], [0.16, 0.34], [0.07, 0.36]], { n: 28, sz: 0.72 }), plate, torso);
  add(lathe([[0.215, 0.12], [0.225, 0.22], [0.2, 0.31]], { n: 28, sz: 0.74, phi0: -1.2, phiLen: 2.4 }), plate2, torso);
  for (const y of [0.02, 0.07, 0.12]) band(torso, y, 0.17 + y * 0.15, 0.73, 0.009);
  // tassets: a skirt of plates
  for (let k = 0; k < 3; k++) { const s = add(lathe([[0.17 + k * 0.012, 0], [0.19 + k * 0.014, -0.06]], { n: 28, sz: 0.78 }), plate2, torso, 0, -0.01 - k * 0.055, 0); band(torso, -0.065 - k * 0.055, 0.19 + k * 0.014, 0.78, 0.006); }
  roots(torso, V(0, -0.1, 0), V(0, 0.33, 0), 0.2, 3, 0.9, 0.4);
  for (const [x, y, z] of [[0.12, 0.3, 0.08], [-0.1, 0.05, 0.12], [0.15, 0.1, -0.1]]) add(ico(0.035, 1), moss, torso, x, y, z).scale.set(1.3, 0.5, 1);
  // the golden face on its chain
  const chain = []; for (let i = 0; i <= 14; i++) { const a = lerp(-1, 1, i / 14); chain.push(V(a * 0.1, 0.34 - (1 - a * a) * 0.12, 0.13 + (1 - a * a) * 0.03)); }
  for (let i = 0; i < chain.length - 1; i++) { const m = chain[i].clone().lerp(chain[i + 1], 0.5); const l = add(tor(0.008, 0.0025, 4, 8), gold, torso, m.x, m.y, m.z); l.rotation.y = i % 2 ? Math.PI / 2 : 0; }
  const mask = add(sph(0.035, 14, 10), gold, torso, 0, 0.2, 0.17); mask.scale.set(0.8, 1.1, 0.4);
  for (const s of [-1, 1]) add(sph(0.007, 6, 4), plain('#2a1a08'), torso, s * 0.012, 0.21, 0.183);
  // the helm: iron, a barred visor, branches with leaves growing out of the top
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.01); torso.add(head); parts.head = head;
  add(lathe([[0, 0.12], [0.05, 0.115], [0.075, 0.09], [0.08, 0.02], [0.078, -0.05], [0.06, -0.07]], { n: 24 }), iron, head);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.06, 0.005, 0.01), plain('#0c0c0e'), head, 0, 0.02 - i * 0.014, 0.077);
  band(head, 0.04, 0.081, 1, 0.006);
  add(tube(curve([V(0, 0.12, 0.05), V(0, 0.06, 0.085), V(0, -0.06, 0.07)], 10), 0.006, { n: 5 }), gold, head);
  const branch = (base, dir, len, r, depth) => { const end = base.clone().addScaledVector(dir.clone().normalize(), len); add(tube(curve([base, base.clone().lerp(end, 0.5).add(V(0, 0, len * 0.06)), end], 6), t => r * (1 - t * 0.5), { n: 5 }), root, head); if (depth <= 0) { for (let k = 0; k < 3; k++) leaf(head, leafM, end, V(Math.sin(k * 2.1), 0.8, Math.cos(k * 2.1)), 0.035, 0.016, k); return; } branch(end, dir.clone().add(V(0.4, 0.3, 0)), len * 0.75, r * 0.65, depth - 1); branch(end, dir.clone().add(V(-0.4, 0.3, 0.1)), len * 0.7, r * 0.65, depth - 1); };
  branch(V(0.02, 0.11, 0), V(0.3, 1, 0), 0.08, 0.012, 3); branch(V(-0.02, 0.11, 0), V(-0.3, 1, 0), 0.08, 0.012, 3);
  // arms: pauldrons in layers, plate arms, gauntlets
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.23, 0.3, 0); torso.add(arm); parts.arms.push(arm);
    for (let k = 0; k < 3; k++) { const p = add(sph(0.1 - k * 0.012, 16, 10, 0, TAU, 0, Math.PI * 0.45), plate, arm, s * 0.01, 0.03 - k * 0.035, 0); p.rotation.z = -s * (0.35 + k * 0.15); p.scale.set(1.1, 0.6, 1); band(p, Math.cos(Math.PI * 0.45) * (0.1 - k * 0.012), Math.sin(Math.PI * 0.45) * (0.1 - k * 0.012), 1, 0.006); }
    add(tube(curve([V(0, 0, 0), V(s * 0.02, -0.17, 0.01), V(s * 0.03, -0.32, 0.04)], 10), t => lerp(0.06, 0.05, t), { n: 12 }), plate2, arm);
    add(sph(0.055, 12, 8), plate, arm, s * 0.02, -0.17, 0.01);
    band(arm, -0.1, 0.06, 1, 0.006); band(arm, -0.25, 0.055, 1, 0.006);
    add(sph(0.055, 12, 10), plate2, arm, s * 0.03, -0.36, 0.05).scale.set(1, 1.2, 1.1);
    roots(arm, V(0, 0, 0), V(s * 0.03, -0.33, 0.04), 0.065, 2, 1.3, s);
    add(ico(0.03, 1), moss, arm, s * 0.06, 0.02, 0.05).scale.set(1.2, 0.5, 1);
  }
  // the great root club in the left hand, dragging behind
  const club = new THREE.Group(); club.position.set(0.03, -0.38, 0.05); club.rotation.set(0.5, 0, -0.15); parts.arms[1].add(club);
  const cpts = curve([V(0, 0.06, 0), V(0.01, -0.15, 0.0), V(0.03, -0.35, -0.03), V(0.02, -0.55, -0.02)], 16);
  add(tube(cpts, t => 0.03 + t * t * 0.07, { n: 10, shape: shag(0.12, 5, 11) }), root, club);
  cpts.forEach((p, i) => { if (i > 4 && i % 2 === 0) for (let k = 0; k < 2; k++) { const a = i * 1.3 + k * Math.PI; thorn(club, root, p, V(Math.cos(a), -0.3, Math.sin(a)), 0.05 + i * 0.004, 0.012, V(0, -1, 0), 5); } });
  roots(club, V(0, 0.04, 0), V(0, -0.1, 0), 0.032, 2, 1.5, 0);
  // legs: plate, knee cops, sabatons, roots up them
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.47, 0); g.add(leg); parts.legs.push(leg);
    add(tube(curve([V(0, 0, 0), V(0, -0.22, 0.01), V(0, -0.43, 0)], 10), t => lerp(0.085, 0.06, t), { n: 14 }), plate2, leg);
    add(sph(0.06, 12, 10), plate, leg, 0, -0.22, 0.035).scale.set(1, 0.9, 0.8);
    band(leg, -0.12, 0.08, 1, 0.006); band(leg, -0.33, 0.066, 1, 0.006);
    add(sph(0.065, 12, 8), plate, leg, 0, -0.45, 0.04).scale.set(0.95, 0.55, 1.6);
    roots(leg, V(0, 0, 0), V(0, -0.42, 0), 0.075, 2, 1.1, s * 2);
  }
  return finish(g, parts);
};
