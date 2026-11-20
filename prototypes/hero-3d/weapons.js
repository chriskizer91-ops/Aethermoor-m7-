// Weapons, shields and focuses for the 3D heroes, built from the game's own recipe numbers (art/item-looks.js lookFor
// gives { r, p, k, cls, glow, edge... }; p is the recipe the item card is painted from). Every rolled item goes
// through the shared builders; the named relics' own recipe styles (a fang, a scimitar, a bell, a poker, a runestone,
// an antler bow, a glass bow, a harpoon, an oath shield, a door, wicker...) get their own shapes on top.
// Sizes: k metres per card px, at the size the hand holds it. Up the weapon is +Y; its flats face Z.
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, wedge, plate, blade, mat, glowColor, isEmit, KIND, Q, sph, tor, cone, ico, etchMaterial, stitchGeo, add, gem, rngOf } from './kit.js';

const TAU = Math.PI * 2;
const has = k => !!(k && MAT[k]);

/* ------------------------------------------------------------------ shared parts */
// leather wound round a haft: overlapping flat bands, with a thin core under them
function wrapGrip(inner, a, b, R, key, k) {
  if (!key) return;
  // bands of leather laid edge over edge, each a little tilted, so they read as one strip wound round
  const w = R * 1.25, n = Math.max(3, Math.round((b - a) / w)), step = (b - a) / n, m = mat(key);
  add(tube([V(0, a * k, 0), V(0, b * k, 0)], R * 1.02 * k, { n: 12 }), m, inner);
  for (let i = 0; i < n; i++) {
    const y0 = a + i * step;
    const bandG = new THREE.Group(); bandG.position.y = (y0 + step / 2) * k; bandG.rotation.z = 0.16; bandG.rotation.y = i * 0.7; inner.add(bandG);
    add(lathe([[R * 1.0 * k, -step * 0.55 * k], [R * 1.13 * k, -step * 0.38 * k], [R * 1.16 * k, step * 0.3 * k], [R * 1.04 * k, step * 0.55 * k]], { n: 14 }), m, bandG);
  }
  for (const y of [a, b]) add(tube(ellipse(V(0, y * k, 0), V(1, 0, 0), V(0, 0, 1), R * 1.16 * k, R * 1.16 * k, 14), R * 0.14 * k, { closed: true, n: 5 }), mat('leatherDark'), inner);
}
// fine wire wound tightly round a grip
function wireGrip(inner, len, R, key, k) {
  const turns = Math.max(6, len / 1.1), pts = [];
  for (let i = 0; i <= turns * 12; i++) { const t = i / (turns * 12), a = t * turns * TAU, rr = R * k * (1.08 + Math.sin(t * Math.PI) * 0.12); pts.push(V(Math.cos(a) * rr, t * len * k, Math.sin(a) * rr)); }
  add(tube(pts, R * 0.11 * k, { n: 4 }), mat(key), inner);
}
const band = (inner, y, R, key, k, w = 1.6) => add(lathe([[R * 1.12 * k, (y - w / 2) * k], [R * 1.36 * k, (y - w * 0.3) * k], [R * 1.36 * k, (y + w * 0.3) * k], [R * 1.12 * k, (y + w / 2) * k]], { n: 16 }), mat(key), inner);
const ring = (c, ax, bx, rx, rz, r, key, parent, n = 18) => add(tube(ellipse(c, ax, bx, rx, rz, n), r, { closed: true, n: 5 }), mat(key), parent);
// a chamfered square ring (hammer heads, sockets): flat faces, cut corners
const chamfer = (c, ax, bx, hx, hz, ch) => [[hx, hz - ch], [hx - ch, hz], [-hx + ch, hz], [-hx, hz - ch], [-hx, -hz + ch], [-hx + ch, -hz], [hx - ch, -hz], [hx, -hz + ch]].map(([x, z]) => c.clone().addScaledVector(ax, x).addScaledVector(bx, z));
// a haft, gently tapered (and wobbling for a crooked staff)
function haft(inner, len, R, key, k, wob = 0) {
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(V(Math.sin(i * 1.7) * wob * k, i / 10 * len * k, Math.cos(i * 2.3) * wob * 0.6 * k));
  add(tube(curve(pts, 20), t => R * k * (1.06 - t * 0.12), { n: 12 }), mat(key), inner);
  return pts;
}
const emit = (fx, o, key, power = 1) => { if (key && isEmit(key)) fx.glows.push({ obj: o, color: glowColor(key), power }); return o; };

/* ------------------------------------------------------------------ weapons */
export function buildWeapon(W, art, fx, u) {
  const p = W.p, r = W.r;
  let k = (W.k || 0.36) * u / 40 * 1.55;
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const tip = new THREE.Object3D();
  let hold = 0;
  const out = { inner, k, fx, W, p };
  if (r === 'sword' || r === 'dagger') hold = sword(out, tip);
  else if (r === 'bow') { k *= 0.85; out.k = k; hold = bow(out, tip, g); }
  else hold = hafted(out, tip);
  inner.position.y = -hold * out.k;
  inner.add(tip); g.userData.tip = tip;
  const glowKey = (W.glow && isEmit(W.glow) && W.glow) || (p.fuller && isEmit(p.fuller) && p.fuller) || (p.edge && isEmit(p.edge) && p.edge) || null;
  if (glowKey) g.userData.glow = glowColor(glowKey);
  return g;
}

function sword({ inner, k, fx, W, p }, tip) {
  const r = W.r, grip = p.gripEnd || 12, gT = p.guardT || 3, bl = p.bladeL || 40, bw = p.bladeW || 4, tl = p.tipL || 7, tp = p.taper || 0.9, gr = p.gripR || 2;
  const shape = p.shape || (r === 'dagger' ? 'straight' : 'sword');
  // pommel, by its shape
  const pr = p.pommelR || 3, pm = mat(p.pommel && has(p.pommel) ? p.pommel : p.guardMat || 'iron');
  if (p.pommelShape === 'coin') add(lathe([[0, -pr * 0.5 * k], [pr * 1.1 * k, -pr * 0.42 * k], [pr * 1.18 * k, 0], [pr * 1.1 * k, pr * 0.42 * k], [0, pr * 0.5 * k]], { n: 24, sz: 0.45 }), pm, inner, 0, -pr * 1.0 * k, 0).rotation.x = 0;
  else if (p.pommelShape === 'knot') { add(ico(pr * 0.95 * k, 1), pm, inner, 0, -pr * 0.9 * k, 0).scale.set(1, 1.2, 0.9); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(sph(pr * 0.35 * k, 8, 6), pm, inner, Math.cos(a) * pr * 0.8 * k, -pr * (0.9 + Math.sin(i * 2.1) * 0.4) * k, Math.sin(a) * pr * 0.7 * k); } }
  else if (p.pommelShape === 'hook' || p.pommel === 'claw') { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 1.3; pts.push(V(Math.sin(a) * pr * 1.3 * k - pr * 0.0 * k, -Math.cos(a) * pr * 1.0 * k - pr * 1.1 * k + pr * k, 0)); } add(tube(pts, t => [gr * 0.9 * k * (1 - t * 0.75), gr * 0.7 * k * (1 - t * 0.75)], { n: 8 }), mat(p.pommel === 'claw' ? 'claw' : p.guardMat || 'bronze'), inner, 0, -pr * 0.6 * k, 0); }
  else add(lathe([[0, -pr * 1.9 * k], [pr * 0.55 * k, -pr * 1.85 * k], [pr * k, -pr * 1.3 * k], [pr * 1.05 * k, -pr * 0.8 * k], [pr * 0.7 * k, -pr * 0.25 * k], [gr * 0.8 * k, 0]], { n: 18, sz: 0.6 }), pm, inner);
  if (p.pommelGem) gem(p.pommelGem, pr * 0.45 * k, inner, 0, -pr * 1.05 * k, pr * (p.pommelShape === 'coin' ? 0.3 : 0.62) * k, has(p.pommel) ? p.pommel : 'gold');
  // grip: leather or cloth under a wound wire (a bramble grip is a twist of thorny vine)
  add(tube([V(0, 0, 0), V(0, grip * 0.5 * k, 0), V(0, grip * k, 0)], t => gr * k * (1 + Math.sin(t * Math.PI) * 0.12), { n: 12 }), mat(p.grip || 'leather'), inner);
  if (p.grip === 'bramble') for (let i = 0; i < 6; i++) add(cone(0.35 * k, 1.4 * k, 4), mat('thorn'), inner, Math.cos(i * 2.3) * gr * 1.1 * k, (i + 0.5) / 6 * grip * k, Math.sin(i * 2.3) * gr * 1.1 * k).rotation.z = Math.cos(i * 2.3) * -1.4;
  else if (p.binding) wrapGrip(inner, 0.5, grip - 0.5, gr, p.binding, k);
  else wireGrip(inner, grip, gr, p.guardMat === 'gold' || p.guardMat === 'bronze' ? p.guardMat : 'silver', k);
  // guard
  const gw = (p.guardW || 9) * 1.1, gy = (grip + gT / 2) * k, gm = mat(has(p.guardMat) ? p.guardMat : 'iron'), guard = p.guard || 'bar';
  if (guard === 'coin') add(lathe([[0, -gT * 0.5 * k], [gw * 0.5 * k, -gT * 0.4 * k], [gw * 0.55 * k, 0], [gw * 0.5 * k, gT * 0.4 * k], [0, gT * 0.5 * k]], { n: 24, sz: 0.5 }), gm, inner, 0, gy, 0);
  else if (guard === 'scale') for (let i = 0; i < 7; i++) { const a = (i / 7 - 0.5) * 2.4; add(lathe([[0, 0.5 * k], [gw * 0.32 * k, 0], [0, -0.5 * k]], { n: 10 }), gm, inner, Math.sin(a) * gw * 0.42 * k, gy - Math.cos(a) * 0.8 * k + 0.8 * k, 0).rotation.set(Math.PI / 2, 0, a); }
  else if (guard === 'thorn') { for (const s of [-1, 1]) { const pts = curve([V(0, gy, 0), V(s * gw * 0.45 * k, gy + 0.8 * k, 0.4 * k), V(s * gw * 0.9 * k, gy + 2.5 * k, -0.3 * k)], 10); add(tube(pts, t => gT * 0.42 * k * (1 - t * 0.6), { n: 7 }), gm, inner); for (let j = 1; j < 4; j++) { const q = pts[j * 2]; add(cone(0.4 * k, 1.8 * k, 4), mat(p.thornMat || 'thorn'), inner, q.x, q.y + 0.6 * k, q.z).rotation.z = -s * 0.5; } } add(ico(gT * 0.7 * k, 1), gm, inner, 0, gy, 0); }
  else if (guard === 'oath') { for (const s of [-1, 1]) { const pts = curve([V(0, gy, 0), V(s * gw * 0.5 * k, gy + 0.2 * k, 0), V(s * gw * 0.95 * k, gy + gw * 0.42 * k, 0)], 14); add(tube(pts, t => [gT * 0.35 * k * (1.2 - t * 0.5), gT * 0.75 * k * (1.1 - t * 0.6)], { n: 8, up: V(0, 0, 1) }), gm, inner); add(sph(gT * 0.38 * k, 10, 8), gm, inner, pts[pts.length - 1].x, pts[pts.length - 1].y, 0); } add(wedge([[0, -gT * 1.1 * k], [gT * 1.1 * k, 0], [0, gT * 1.6 * k], [-gT * 1.1 * k, 0]], gT * 0.7 * k, null, { bevel: 0.2 * k }), gm, inner, 0, gy, 0); }
  else {
    const flame = guard === 'flame', sq = guard === 'quillon', hook = guard === 'hook';
    const pts = []; for (let i = 0; i <= 24; i++) { const t = lerp(-1, 1, i / 24); pts.push(V(t * gw * k, gy + (flame ? Math.abs(t) ** 2 * gw * 0.5 * k + Math.sin(t * 9) * 0.6 * k : sq ? t * Math.abs(t) * gw * 0.35 * k : hook ? (t > 0 ? t * t * gw * 0.5 * k : -t * t * gw * 0.55 * k) : Math.abs(t) ** 2.2 * gw * 0.22 * k), 0)); }
    add(tube(pts, t => { const e = Math.abs(t * 2 - 1); return [gT * 0.45 * k * (1.25 - e * 0.55), gT * 0.6 * k * (1.2 - e * 0.5)]; }, { n: 8, up: V(0, 0, 1) }), gm, inner);
    for (const s of [0, 24]) add(sph(gT * 0.5 * k, 10, 8), gm, inner, pts[s].x, pts[s].y, 0);
    add(sph(gT * 0.7 * k, 14, 10), gm, inner, 0, gy, 0).scale.set(1.3, 0.8, 0.75);
  }
  if (p.gem) gem(p.gem, gT * 0.5 * k, inner, 0, gy, gT * 0.6 * k, has(p.guardMat) ? p.guardMat : 'gold');
  if (p.ribbon) for (const s of [-1, 1]) add(tube(curve([V(s * 0.8 * k, gy - 0.5 * k, 0.6 * k), V(s * 2.5 * k, gy - 5 * k, 1.2 * k), V(s * 1.5 * k, gy - 12 * k, 1.8 * k)], 10), [0.15 * k, 1.2 * k], { n: 6, up: V(0, 0, 1) }), mat(p.ribbon, { side: true }), inner);
  // blade, by its shape: straight, a knife, a scimitar widening toward the tip, a curved fang, a tooth
  const b0 = (grip + gT) * k, L = (bl + tl) * k, tS = bl / (bl + tl), hw = bw * 0.5 * k * 1.15;
  const curved = shape === 'scimitar' || shape === 'fang' || shape === 'tooth' || shape === 'knife';
  const cv = (p.curve || (shape === 'knife' ? 2 : 0)) * k;
  let wf, tf, off;
  if (shape === 'fang' || shape === 'tooth') { wf = u => hw * 1.1 * Math.pow(1 - u, 0.8) + 0.05 * k; tf = u => hw * (shape === 'fang' ? 0.55 : 0.45) * Math.pow(1 - u, 0.7) + 0.05 * k; off = u => -cv * (u * u) * 1.6; }
  else if (shape === 'scimitar') { wf = u => (u < 0.82 ? hw * (0.9 + u * 0.45) : hw * 1.27 * Math.sqrt(Math.max(0, 1 - ((u - 0.82) / 0.18) ** 1.6))); tf = u => (0.5 + bw * 0.04) * k * (1 - u * 0.4); off = u => -cv * u * u * 1.3; }
  else { wf = u => (u < tS ? hw * (1 - (1 - tp) * u / tS) : hw * tp * Math.sqrt(Math.max(0, 1 - ((u - tS) / (1 - tS)) ** 2.2))); tf = u => (0.55 + bw * 0.05) * k * (1 - u * 0.45); off = u => -cv * u * u * 2.5; }
  const bm = mat(has(p.blade) ? p.blade : 'steel');
  add(blade(L, wf, tf, { fuller: shape === 'fang' || shape === 'tooth' ? 0 : r === 'dagger' ? 0.15 : 0.4, off, rings: curved ? 26 : 22 }), bm, inner, 0, b0, 0);
  add(lathe([[hw * 0.7, -0.6 * k], [hw * 0.9, 0], [hw * 0.7, 0.8 * k]], { n: 12, sz: 0.35 }), gm, inner, 0, b0, 0);
  const th = tf(0.2);
  // the fuller's glow, a vein down a fang, a tally of notches, an edge of fire
  const along = (u0, u1, z, n = 10) => { const pts = []; for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n); pts.push(V(off(u), b0 + u * L, z * tf(u) / th)); } return pts; };
  if (p.fuller && shape !== 'fang') for (const s of [-1, 1]) emit(fx, add(tube(along(0.03, 0.72, s * th * 0.62), [0.15 * k, hw * 0.12], { n: 6, up: V(0, 0, 1) }), mat(p.fuller), inner), p.fuller, 0.8);
  if (p.vein) for (const s of [-1, 1]) emit(fx, add(tube(along(0.05, 0.85, s * th * 0.98), t => 0.28 * k * (1 - t * 0.7), { n: 5 }), mat(p.vein), inner), p.vein, 0.9);
  if (p.tally) for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.1; emit(fx, add(new THREE.BoxGeometry(0.4 * k, 0.4 * k, tf(u) * 2.3), mat(p.tally), inner, off(u) - wf(u) * 0.92, b0 + u * L, 0), p.tally, 0.7); }
  const edgeKey = p.edge && has(p.edge) ? p.edge : null;
  if (edgeKey || W.edge) for (const s of (shape === 'scimitar' || shape === 'knife' ? [1] : [-1, 1])) { const pts = []; for (let i = 0; i <= 14; i++) { const u = lerp(0.02, 0.97, i / 14); pts.push(V(off(u) + s * wf(u) * 0.99, b0 + u * L, 0)); } const e = add(tube(pts, 0.22 * k, { n: 5 }), edgeKey ? mat(edgeKey) : new THREE.MeshBasicMaterial({ color: new THREE.Color(W.edge), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), inner); if (edgeKey) emit(fx, e, edgeKey, 0.9); else fx.glows.push({ obj: e, color: new THREE.Color(W.edge), power: 0.7 }); }
  if (p.binding && (shape === 'tooth' || shape === 'fang')) wrapGrip(inner, grip + gT + 0.2, grip + gT + 4, hw / k * 0.75, p.binding, k);
  if (Q.d > 1 && !curved && (W.glint || p.fuller || W.relic)) for (const s of [-1, 1]) { const e = add(new THREE.PlaneGeometry(hw * 0.95, bl * 0.34 * k), etchMaterial(), inner, 0, b0 + bl * 0.2 * k, s * th * 1.02); e.rotation.y = s < 0 ? Math.PI : 0; e.userData.keep = true; e.castShadow = false; }
  tip.position.set(off(1), b0 + L, 0);
  return grip * 0.5;
}

function hafted({ inner, k, fx, W, p }, tip) {
  const r = W.r, st = p.style;
  // Fenwick's Poker: an iron rod with a hook, its end glowing from the hearth
  if (r === 'mace' && st === 'poker') {
    const len = p.headT || 64, R = p.rodR || 1.5, rod = mat(p.rod || 'iron');
    add(tube([V(0, 0, 0), V(0, len * k, 0)], R * k, { n: 10 }), rod, inner);
    add(tor(R * 2.4 * k, R * 0.6 * k, 6, 16), mat(p.collar || 'iron'), inner, 0, 2 * k, 0).rotation.x = Math.PI / 2;
    add(tube(curve([V(0, -1 * k, 0), V(-3 * k, -4 * k, 0), V(-5.5 * k, -1.5 * k, 0), V(-4 * k, 1.5 * k, 0)], 12), R * k, { n: 8 }), rod, inner);
    const hookPts = curve([V(0, len * k, 0), V(0, (len + 3) * k, 0), V(3 * k, (len + 6) * k, 0), V(5.5 * k, (len + 4) * k, 0)], 12);
    add(tube(hookPts, t => R * k * (1 - t * 0.35), { n: 8 }), rod, inner);
    add(tube([V(0, (len - 12) * k, 0), V(0, len * k, 0)], R * 1.04 * k, { n: 10 }), mat(p.soot || 'dark'), inner);
    emit(fx, add(tube(hookPts.slice(-6), R * 1.06 * k, { n: 8 }), mat(p.glow || 'ember'), inner), p.glow || 'ember', 1.2);
    tip.position.set(5.5 * k, (len + 4) * k, 0);
    return len * 0.4;
  }
  const len = r === 'staff' ? (p.headT || 62) + 2 : r === 'spear' ? (p.headT || 60) : (p.headT || 50) + 4;
  const R = (p.haftR || 2) * 0.9, hT = p.headT || len;
  const haftKey = has(p.haft) ? p.haft : 'wood';
  haft(inner, len, R, haftKey, k, r === 'staff' ? (p.wobble || 0) * 0.5 : 0);
  wrapGrip(inner, p.wrapA ?? 0, p.wrapB ?? p.wrapEnd ?? 16, R, p.wrap, k);
  (p.bands || []).forEach(y => band(inner, y, R, p.bandMat || 'iron', k));
  const foot = p.foot || p.butt || p.pommelMat || p.pommel;
  if (foot && has(foot)) add(lathe([[0, -2.5 * k], [R * 1.2 * k, -2 * k], [R * 1.4 * k, 0], [R * 1.1 * k, 2 * k]], { n: 14 }), mat(foot), inner);
  if (p.vine) { const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 4.5; pts.push(V(Math.cos(a) * R * 1.25 * k, lerp(3, hT - 4, t) * k, Math.sin(a) * R * 1.25 * k)); } add(tube(pts, 0.45 * k, { n: 5 }), mat(p.vine), inner); for (let i = 3; i < 60; i += 5) { const q = pts[i]; add(cone(0.4 * k, 1.6 * k, 4), mat(p.thorn || 'thorn'), inner, q.x * 1.1, q.y, q.z * 1.1).rotation.z = -Math.sign(q.x) * 1.2; } }
  if (r === 'axe') axeHead(inner, k, fx, p, R, hT, tip);
  else if (r === 'hammer') hammerHead(inner, k, fx, p, R, hT, tip);
  else if (r === 'mace') maceHead(inner, k, fx, p, R, hT, tip);
  else if (r === 'spear') spearHead(inner, k, fx, p, R, hT, tip);
  else staffHead(inner, k, fx, p, R, hT, tip, haftKey);
  return r === 'spear' ? 30 : r === 'staff' ? (p.headT ? p.headT * 0.55 : 34) : (p.wrapEnd || 16) * 0.5;
}

function socket(inner, k, R, hT, key, h = 8) {
  // a chamfered socket with langets down the haft and a rivet through each side
  const rings = [chamfer(V(0, (hT - h / 2) * k, 0), V(1, 0, 0), V(0, 0, 1), R * 1.5 * k, R * 1.5 * k, R * 0.4 * k), chamfer(V(0, (hT + h / 2) * k, 0), V(1, 0, 0), V(0, 0, 1), R * 1.5 * k, R * 1.5 * k, R * 0.4 * k)];
  add(loft(rings, { capA: true, capB: true, flat: true }), mat(key), inner);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(R * 0.9 * k, 9 * k, 0.5 * k), mat(key), inner, 0, (hT - h / 2 - 4.5) * k, s * R * 1.05 * k); add(sph(0.6 * k, 8, 6), mat('iron'), inner, 0, (hT - h / 2 - 2) * k, s * R * 1.35 * k); }
}

function axeHead(inner, k, fx, p, R, hT, tip) {
  const bm = mat(has(p.blade) ? p.blade : 'steel'), sk = has(p.socket) ? p.socket : has(p.blade) ? p.blade : 'iron';
  socket(inner, k, R, hT, sk, 9);
  if (p.pick) {
    // a pick: a long square spike forward, a short hammer behind
    const L = p.pickL || 22, pts = curve([V(R * k, hT * k, 0), V(L * 0.5 * k, (hT + 1) * k, 0), V(L * k, (hT - 2.5) * k, 0)], 12);
    add(tube(pts, t => [lerp(2.2, 0.2, t) * k, lerp(2.2, 0.2, t) * k], { n: 4, up: V(0, 1, 0) }), bm, inner);
    add(loft([chamfer(V(-R * 1.4 * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), 2.6 * k, 2.6 * k, 0.6 * k), chamfer(V(-(R + 5) * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), 2.8 * k, 2.8 * k, 0.6 * k)], { capA: true, capB: true, flat: true }), bm, inner);
    if (p.tally) for (let i = 0; i < 4; i++) emit(fx, add(new THREE.BoxGeometry(0.4 * k, 1.6 * k, 4.6 * k), mat(p.tally), inner, (R + 3 + i * 2.2) * k, (hT + 0.2) * k, 0), p.tally, 0.7);
    if (p.rime) for (let i = 0; i < 7; i++) add(ico((0.7 + (i % 3) * 0.3) * k, 0), mat(p.rime), inner, (R + 2 + i * 2.6) * k, (hT + 1.6 - i * 0.25) * k, ((i % 2) - 0.5) * 2.2 * k);
    if (p.edge) emit(fx, add(tube(pts.slice(-6), 0.35 * k, { n: 4 }), mat(p.edge), inner), p.edge, 0.9);
    if (p.gem) gem(p.gem, 1.5 * k, inner, 0, hT * k, R * 1.6 * k, sk);
    tip.position.copy(pts[pts.length - 1]);
    return;
  }
  const lo = (p.bladeLo || 12) * 0.82, hi = (p.bladeHi || 8) * 0.82, bw = (p.bladeW || 16) * 0.8, bu = (p.bulge || 3) * 0.8;
  // the head: a bearded blade that thins to its edge, a brighter bevel along the edge
  const outl = [[R * 0.8, -3.5], [bw * 0.35, -lo * 0.35], [bw * 0.62, -lo * 0.95], [bw * 0.86, -lo * 1.05], [bw + bu * 0.3, -lo * 0.6], [bw + bu, 0], [bw + bu * 0.3, hi * 0.7], [bw * 0.86, hi * 1.02], [bw * 0.5, hi * 0.62], [R * 0.8, 3.5]].map(([x, y]) => [x * k, y * k]);
  add(wedge(outl, 3.2 * k, x => lerp(1, 0.14, smooth((x / k - bw * 0.3) / (bw * 0.72))), { bevel: 0.3 * k }), bm, inner, 0, hT * k, 0);
  const edgePts = curve([V(bw * 0.86 * k, (hT - lo * 1.05) * k, 0), V((bw + bu * 0.35) * k, (hT - lo * 0.6) * k, 0), V((bw + bu) * k, hT * k, 0), V((bw + bu * 0.35) * k, (hT + hi * 0.7) * k, 0), V(bw * 0.86 * k, (hT + hi * 1.02) * k, 0)], 18);
  add(tube(edgePts, [0.5 * k, 0.12 * k], { n: 6, up: V(0, 0, 1) }), mat('silver'), inner);
  if (p.edge) emit(fx, add(tube(edgePts, 0.3 * k, { n: 5 }), mat(p.edge), inner), p.edge, 0.9);
  if (p.back === 'poll') add(loft([chamfer(V(-R * 1.4 * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), 2.8 * k, 1.8 * k, 0.5 * k), chamfer(V(-(R + 4.5) * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), 3 * k, 2 * k, 0.6 * k)], { capA: true, capB: true, flat: true }), bm, inner);
  else if (p.spikeL || p.back === 'spike') { const L = p.spikeL || 6; add(tube(curve([V(-R * k, hT * k, 0), V(-(R + L * 0.6) * k, (hT - 0.6) * k, 0), V(-(R + L) * k, (hT - 2) * k, 0)], 8), t => [lerp(1.6, 0.1, t) * k, lerp(1.2, 0.1, t) * k], { n: 4, up: V(0, 1, 0) }), bm, inner); }
  if (p.runes) emit(fx, add(tube(curve([V(bw * 0.3 * k, (hT - 3) * k, 1.55 * k), V(bw * 0.5 * k, (hT - 0.5) * k, 1.3 * k), V(bw * 0.7 * k, (hT + 1.5) * k, 0.9 * k)], 8), 0.3 * k, { n: 5 }), mat(p.runes), inner), p.runes, 0.8);
  if (p.leaves) for (let i = 0; i < 5; i++) { const lf = add(wedge([[0, 0], [1 * k, 1.5 * k], [0, 3.6 * k], [-1 * k, 1.5 * k]], 0.25 * k), mat(p.leaves, { side: true }), inner, (Math.sin(i * 1.9) * 2) * k, (hT - 6 - i * 1.6) * k, (R + 0.6) * k * (i % 2 ? 1 : -1)); lf.rotation.set(0.5, i * 1.3, Math.sin(i) * 0.8); }
  if (p.gem) gem(p.gem, 1.5 * k, inner, R * 2.4 * k, hT * k, 1.7 * k, sk);
  tip.position.set((bw + bu) * k, hT * k, 0);
}

function hammerHead(inner, k, fx, p, R, hT, tip) {
  const hw = (p.headW || 14) * 0.72, hh = (p.headH || 13) * 0.72, hk = has(p.headMat) ? p.headMat : 'iron', hm = mat(hk);
  socket(inner, k, R, hT, has(p.pommelMat) ? p.pommelMat : 'iron', hh + 3);
  // an octagonal head with chamfered corners, wider at the faces; a peen behind instead of a second face
  const ch = hh * 0.22, rings = [];
  const xs = p.peen ? [-hw * 0.95, -hw * 0.6, 0, hw * 0.75, hw * 0.92, hw] : [-hw, -hw * 0.92, -hw * 0.75, 0, hw * 0.75, hw * 0.92, hw];
  for (const x of xs) { const swell = Math.abs(x) > hw * 0.8 ? 1.06 : 1, pe = p.peen && x < 0 ? lerp(1, 0.35, -x / hw) : 1; rings.push(chamfer(V(x * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.5 * k * swell, hh * 0.45 * k * swell * pe, ch * k * pe)); }
  add(loft(rings, { capA: true, capB: true, flat: true }), hm, inner);
  const faceKey = has(p.trim) ? p.trim : hk;
  for (const s of p.peen ? [1] : [-1, 1]) add(loft([chamfer(V(s * hw * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.53 * k, hh * 0.48 * k, ch * k), chamfer(V(s * (hw + 1.2) * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.46 * k, hh * 0.41 * k, ch * 0.9 * k)], { capA: true, capB: true, flat: true }), mat(faceKey), inner);
  // straps or trim bands round the head, rivets at their corners
  const bandsKey = has(p.straps) ? p.straps : has(p.trim) ? p.trim : null;
  if (bandsKey) for (const x of [-hw * 0.42, hw * 0.42]) { add(loft([chamfer(V((x - 0.8) * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.52 * k, hh * 0.47 * k, ch * k), chamfer(V((x + 0.8) * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.52 * k, hh * 0.47 * k, ch * k)], { capA: true, capB: true, flat: true }), mat(bandsKey), inner); for (const [y, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(sph(0.55 * k, 6, 4), mat(bandsKey), inner, x * k, (hT + y * hh * 0.36) * k, z * hh * 0.49 * k); }
  if (p.seam) emit(fx, add(loft([chamfer(V(-0.3 * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.505 * k, hh * 0.455 * k, ch * k), chamfer(V(0.3 * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.505 * k, hh * 0.455 * k, ch * k)], { capA: true, capB: true, flat: true }), mat(p.seam), inner), p.seam, 1);
  if (p.runes) for (const s of [-1, 1]) emit(fx, add(tube(curve([V(-hw * 0.3 * k, (hT - hh * 0.2) * k, s * hh * 0.46 * k), V(0, (hT + hh * 0.2) * k, s * hh * 0.46 * k), V(hw * 0.3 * k, (hT - hh * 0.2) * k, s * hh * 0.46 * k)], 10), 0.35 * k, { n: 5 }), mat(p.runes), inner), p.runes, 0.9);
  if (p.mark) for (const s of [-1, 1]) { const m = add(wedge([[0, -2.2 * k], [1.6 * k, 0], [0, 2.2 * k], [-1.6 * k, 0]], 0.5 * k, null, { bevel: 0.15 * k }), mat(p.mark), inner, hw * 0.15 * k, hT * k, s * hh * 0.47 * k); }
  if (p.shards) for (let i = 0; i < 6; i++) { const a = i * 2.1; add(new THREE.OctahedronGeometry((0.9 + (i % 3) * 0.4) * k, 0), mat(p.shards), inner, Math.cos(a) * hw * 0.6 * k, (hT + Math.sin(a * 1.3) * hh * 0.35) * k, (i % 2 ? 1 : -1) * hh * 0.46 * k).scale.set(0.7, 1.6, 0.7); }
  if (p.spike) add(cone(2 * k, p.spike * k, 4), hm, inner, 0, (hT + hh * 0.5 + p.spike * 0.5) * k, 0);
  if (p.langets) for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.2 * k, 12 * k, 0.6 * k), mat(has(p.pommelMat) ? p.pommelMat : 'iron'), inner, 0, (hT - hh * 0.5 - 6) * k, s * R * 1.05 * k);
  tip.position.set(hw * k, hT * k, 0);
}

function maceHead(inner, k, fx, p, R, hT, tip) {
  const hw = p.headW || 7, hk = has(p.headMat) ? p.headMat : 'iron', hm = mat(hk);
  if (p.style === 'bell') {
    // Dawnbell: a bronze bell, mouth down, on a gold crown; a sun on its side, a clapper under it
    const bl = (p.bellL || 26) * 0.7, br = (p.bellR || 12) * 0.85, y0 = hT + bl * 0.15;
    add(lathe([[R * 1.2 * k, (y0 + bl) * k], [br * 0.45 * k, (y0 + bl * 0.98) * k], [br * 0.55 * k, (y0 + bl * 0.75) * k], [br * 0.58 * k, (y0 + bl * 0.45) * k], [br * 0.72 * k, (y0 + bl * 0.18) * k], [br * 0.98 * k, (y0 + 0.4) * k], [br * 1.02 * k, y0 * k], [br * 0.9 * k, (y0 + 0.4) * k], [br * 0.5 * k, (y0 + bl * 0.6) * k]], { n: 32 }), mat(p.bell || 'bronze', { side: true }), inner);
    ring(V(0, (y0 + 0.3) * k, 0), V(1, 0, 0), V(0, 0, 1), br * 1.0 * k, br * 1.0 * k, 0.5 * k, p.trim || 'gold', inner, 28);
    ring(V(0, (y0 + bl * 0.72) * k, 0), V(1, 0, 0), V(0, 0, 1), br * 0.56 * k, br * 0.56 * k, 0.4 * k, p.trim || 'gold', inner, 24);
    add(tube([V(0, (y0 + bl * 0.6) * k, 0), V(0, (y0 - 1.5) * k, 0)], 0.5 * k, { n: 6 }), mat(p.clapper || 'gold'), inner);
    add(sph(1.5 * k, 12, 10), mat(p.clapper || 'gold'), inner, 0, (y0 - 1.8) * k, 0);
    const sun = new THREE.Group(); sun.position.set(0, (y0 + bl * 0.4) * k, br * 0.66 * k); sun.rotation.x = -0.18; inner.add(sun);
    emit(fx, add(sph(1.6 * k, 12, 8), mat(p.sun || p.glow || 'radiant'), sun), p.sun || p.glow || 'radiant', 0.8);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(wedge([[0, -0.5 * k], [3 * k, 0], [0, 0.5 * k]], 0.3 * k), mat(p.trim || 'gold'), sun, Math.cos(a) * 1.8 * k, Math.sin(a) * 1.8 * k, 0).rotation.z = a; }
    tip.position.set(0, (y0 + bl) * k, 0);
    return;
  }
  // a knob with ridges, or flanges with chamfered edges; a spike on top
  add(lathe([[0, (hT + hw * 0.85) * k], [hw * 0.45 * k, (hT + hw * 0.75) * k], [hw * 0.72 * k, hT * k], [hw * 0.45 * k, (hT - hw * 0.75) * k], [R * 1.3 * k, (hT - hw) * k]], { n: 20 }), hm, inner);
  if (p.style === 'flanged') for (let i = 0; i < 7; i++) { const f = add(wedge([[0, -hw * 0.95 * k], [hw * 0.75 * k, -hw * 0.6 * k], [hw * 1.08 * k, -hw * 0.1 * k], [hw * 1.08 * k, hw * 0.25 * k], [hw * 0.6 * k, hw * 0.8 * k], [0, hw * 0.95 * k]], 1.1 * k, x => lerp(1, 0.3, x / (hw * k)), { bevel: 0.2 * k }), hm, inner, 0, hT * k, 0); f.rotation.y = i / 7 * TAU; }
  else for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, b = i % 2 ? 0.4 : -0.4; const dir = V(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)); const st = add(cone(1.1 * k, 3.4 * k, 6), hm, inner, dir.x * hw * 0.66 * k, hT * k + dir.y * hw * 0.66 * k, dir.z * hw * 0.66 * k); st.quaternion.setFromUnitVectors(V(0, 1, 0), dir); }
  ring(V(0, (hT - hw * 0.8) * k, 0), V(1, 0, 0), V(0, 0, 1), hw * 0.42 * k, hw * 0.42 * k, 0.6 * k, has(p.trim) ? p.trim : hk, inner, 18);
  ring(V(0, (hT + hw * 0.62) * k, 0), V(1, 0, 0), V(0, 0, 1), hw * 0.5 * k, hw * 0.5 * k, 0.5 * k, has(p.trim) ? p.trim : hk, inner, 18);
  if (p.spike) add(cone(1.3 * k, p.spike * 1.5 * k, 6), hm, inner, 0, (hT + hw * 0.85 + p.spike * 0.7) * k, 0);
  if (p.gem) gem(p.gem, 1.5 * k, inner, 0, hT * k, hw * 0.74 * k, has(p.trim) ? p.trim : 'gold');
  tip.position.set(0, (hT + hw) * k, 0);
}

function spearHead(inner, k, fx, p, R, hT, tip) {
  const hl = (p.headL || 17) * 1.1, hw = (p.headW || 5), hm = mat(has(p.head) ? p.head : 'steel');
  // a leaf blade that thins to its edges, a raised midrib, a lathed socket
  const leaf = []; for (let i = 0; i <= 16; i++) { const t = i / 16, w = Math.sin(Math.pow(t, 0.7) * Math.PI) * hw * (1 - t * 0.35); leaf.push([w * k, t * hl * k]); } for (let i = 15; i > 0; i--) leaf.push([-leaf[i][0], leaf[i][1]]);
  add(wedge(leaf, 1.6 * k, x => lerp(1, 0.12, Math.abs(x) / (hw * k)), { bevel: 0.15 * k }), hm, inner, 0, hT * k, 0);
  add(tube([V(0, hT * k, 0), V(0, (hT + hl * 0.92) * k, 0)], t => [0.55 * k * (1 - t * 0.8), 0.95 * k * (1 - t * 0.8)], { n: 6, up: V(1, 0, 0) }), hm, inner);
  add(lathe([[R * 1.1 * k, (hT - 9) * k], [R * 1.55 * k, (hT - 7) * k], [R * 1.25 * k, (hT - 3) * k], [R * 1.3 * k, (hT - 1.5) * k], [0.6 * k, (hT + 1) * k]], { n: 14 }), mat(p.socket || p.head || 'iron'), inner);
  ring(V(0, (hT - 7) * k, 0), V(1, 0, 0), V(0, 0, 1), R * 1.6 * k, R * 1.6 * k, 0.35 * k, p.socket || 'iron', inner, 16);
  if (p.wings) for (const s of [-1, 1]) add(wedge([[0, -1 * k], [s * p.wings * 1.6 * k, 0.2 * k], [s * p.wings * 1.4 * k, 1 * k], [0, 1.6 * k]], 0.9 * k, null, { bevel: 0.1 * k }), hm, inner, 0, (hT - 4) * k, 0);
  if (p.barbs) for (const s of [-1, 1]) add(wedge([[0, 0], [s * (hw + p.barbs) * k, -p.barbs * 1.6 * k], [s * hw * 0.6 * k, 1.6 * k]], 1 * k, x => lerp(1, 0.2, Math.abs(x) / ((hw + p.barbs) * k))), hm, inner, 0, (hT + 1.5) * k, 0);
  if (p.fuller) emit(fx, add(tube([V(0, (hT + 1.5) * k, 0.72 * k), V(0, (hT + hl * 0.6) * k, 0.62 * k)], [0.5 * k, 0.15 * k], { n: 5, up: V(1, 0, 0) }), mat(p.fuller), inner), p.fuller, 0.8);
  if (p.ribbon) add(tube(curve([V(0, (hT - 8) * k, 0), V(1.5 * k, (hT - 13) * k, 1 * k), V(0.5 * k, (hT - 22) * k, 2 * k)]), [0.12 * k, 1.6 * k], { n: 6, up: V(0, 0, 1) }), mat(p.ribbon, { side: true }), inner);
  if (p.line) { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 5; pts.push(V(Math.cos(a) * R * 1.5 * k, (hT - 14 + t * 4) * k, Math.sin(a) * R * 1.5 * k)); } add(tube(pts, 0.4 * k, { n: 5 }), mat(p.line), inner); }
  if (p.feathers) for (let i = 0; i < 5; i++) { const f = add(wedge([[0, 0], [0.9 * k, 2.5 * k], [0, 6 * k], [-0.9 * k, 2.5 * k]], 0.2 * k), mat(p.crow || p.feathers, { side: true }), inner, 0, (hT - 10) * k, 0); f.rotation.set(2.6, i * 1.25, 0.3); }
  if (p.gem) gem(p.gem, 1.3 * k, inner, 0, (hT - 4.5) * k, R * 1.6 * k, p.socket || 'gold');
  tip.position.set(0, (hT + hl) * k, 0);
}

function staffHead(inner, k, fx, p, R, hT, tip, haftKey) {
  const top = new THREE.Group(); top.position.y = hT * k; inner.add(top);
  const metal = mat(has(p.metal) ? p.metal : has(p.bandMat) ? p.bandMat : 'bronze'), st = p.style, wood = mat(haftKey);
  const orb = (key, rr = 3.1, y = 4.5) => { if (!key) return null; const gk = isEmit(key) ? key : p.glow; const o = add(ico(rr * k, 3), mat(key), top, 0, y * k, 0); if (gk) { emit(fx, o, gk, 1.2); emit(fx, add(sph(rr * 0.45 * k, 12, 8), mat(gk), top, 0, y * k, 0), gk, 1.4); } return o; };
  if (st === 'rune') {
    // a runestone set in iron claws, its runes glowing
    const stoneKey = has(p.stone) ? p.stone : 'granite';
    const sx = 4.2, sy = 8;
    add(loft([chamfer(V(0, 0.5 * k, 0), V(1, 0, 0), V(0, 0, 1), sx * 0.8 * k, sx * 0.7 * k, 0.8 * k), chamfer(V(0, sy * 0.5 * k, 0), V(1, 0, 0), V(0, 0, 1), sx * k, sx * 0.85 * k, 1 * k), chamfer(V(0, sy * k, 0), V(1, 0, 0), V(0, 0, 1), sx * 0.55 * k, sx * 0.5 * k, 0.6 * k)], { capA: true, capB: true, flat: true }), mat(stoneKey), top);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; add(tube(curve([V(Math.cos(a) * R * k, -1 * k, Math.sin(a) * R * k), V(Math.cos(a) * sx * 1.1 * k, 2 * k, Math.sin(a) * sx * 0.95 * k), V(Math.cos(a) * sx * 0.95 * k, 5 * k, Math.sin(a) * sx * 0.8 * k)], 10), t => 0.55 * k * (1 - t * 0.6), { n: 6 }), metal, top); }
    for (const s of [-1, 1]) { const rp = [V(-1.5 * k, 1.8 * k, s * sx * 0.86 * k), V(0, 3.2 * k, s * sx * 0.88 * k), V(1.2 * k, 2.4 * k, s * sx * 0.87 * k), V(0.2 * k, 5.5 * k, s * sx * 0.8 * k), V(-1 * k, 6.6 * k, s * sx * 0.66 * k)]; emit(fx, add(tube(rp, 0.32 * k, { n: 5 }), mat(p.runes || p.glow || 'ember'), top), p.runes || p.glow || 'ember', 1); }
    if (p.gem) gem(p.gem, 1.4 * k, top, 0, (sy + 0.6) * k, 0, has(p.metal) ? p.metal : 'gold', V(0, 1, 0));
    tip.position.set(0, (hT + sy + 1) * k, 0);
    return;
  }
  if (st === 'crook' || st === 'crozier') {
    const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI * 1.6; pts.push(V(-(1 - Math.cos(a)) * 5.5 * k * (1 - t * 0.2), Math.sin(a) * 6 * k + t * 2.5 * k, 0)); }
    add(tube(pts, t => R * k * (1 - t * 0.45), { n: 10 }), st === 'crozier' ? metal : wood, top);
    if (st === 'crozier') { for (let i = 1; i < 6; i++) { const q = pts[i * 4]; add(wedge([[0, 0], [0.9 * k, 1.4 * k], [0, 3 * k], [-0.9 * k, 1.4 * k]], 0.5 * k), metal, top, q.x * 1.18, q.y + 1 * k, 0).rotation.z = -0.3 - i * 0.35; } if (p.ice) for (let i = 0; i < 6; i++) { const q = pts[4 + i * 3]; add(new THREE.OctahedronGeometry((0.9 + (i % 2) * 0.5) * k, 0), mat(has(p.ice) ? p.ice : 'frost'), top, q.x, q.y + 1 * k, (i % 2 - 0.5) * 1.2 * k).scale.set(0.6, 1.8, 0.6); } }
    orb(p.orb || p.gem, 2.4, 6);
    if (p.orb || p.gem) top.children[top.children.length - 1].position.x = -5 * k;
    tip.position.set(-5 * k, (hT + 8) * k, 0);
    return;
  }
  if (st === 'song') {
    // Rootsong: roots climb from the haft and cradle a water orb; finger holes down the haft, berries and leaves
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(tube(curve([V(Math.cos(a) * R * 0.8 * k, -4 * k, Math.sin(a) * R * 0.8 * k), V(Math.cos(a) * 4 * k, 3 * k, Math.sin(a) * 4 * k), V(Math.cos(a + 0.6) * 5.2 * k, 8 * k, Math.sin(a + 0.6) * 5.2 * k), V(Math.cos(a + 1.3) * 2.2 * k, 12 * k, Math.sin(a + 1.3) * 2.2 * k)], 16), t => R * 0.65 * k * (1 - t * 0.7), { n: 7 }), mat(p.roots || haftKey), top); }
    orb(p.orb || 'water', (p.orbR || 6) * 0.6, 7);
    for (let i = 0; i < 5; i++) { const y = -10 - i * 5; add(tor(R * 0.45 * k, 0.25 * k, 5, 12), mat(p.holeRim || 'thorn'), top, 0, y * k, R * 1.02 * k); add(sph(R * 0.4 * k, 8, 6), mat(p.holes || 'dark'), top, 0, y * k, R * 0.9 * k).scale.set(1, 1, 0.4); }
    if (p.berries) for (let i = 0; i < 6; i++) add(sph(0.7 * k, 8, 6), mat(p.berries), top, Math.cos(i * 1.7) * 4 * k, (2 + (i % 3)) * k, Math.sin(i * 1.7) * 4 * k);
    if (p.leaves) for (let i = 0; i < 8; i++) { const lf = add(wedge([[0, 0], [1.2 * k, 1.8 * k], [0, 4.2 * k], [-1.2 * k, 1.8 * k]], 0.3 * k), mat(p.leaves, { side: true }), top, Math.sin(i * 1.3) * 4.5 * k, (1 + (i % 3) * 2) * k, Math.cos(i * 1.3) * 4.5 * k); lf.rotation.set(0.6, i * 0.9, Math.sin(i) * 0.9); }
    tip.position.set(0, (hT + 12) * k, 0);
    return;
  }
  if (st === 'cantor') {
    // the cantor's staff: a crossbar with a small bell hanging under it, a pearl on top, barnacles and weed
    add(tube([V(-6 * k, 4 * k, 0), V(6 * k, 4 * k, 0)], 0.6 * k, { n: 8 }), metal, top);
    add(lathe([[0.6 * k, 2.6 * k], [1.8 * k, 2.2 * k], [2.2 * k, 0.4 * k], [2.8 * k, -0.6 * k], [2.4 * k, -0.4 * k]], { n: 20 }), mat(p.bell || 'bronze', { side: true }), top, 4.5 * k, -1 * k, 0);
    add(tube([V(4.5 * k, 3.6 * k, 0), V(4.5 * k, 1.6 * k, 0)], 0.2 * k, { n: 5 }), metal, top);
    gem(p.pearl || p.gem || 'pearl', 2 * k, top, 0, 7 * k, 0, has(p.metal) ? p.metal : 'silver', V(0, 1, 0));
    if (p.barnacles) for (let i = 0; i < 8; i++) add(lathe([[0.7 * k, 0], [0.5 * k, 0.6 * k], [0.25 * k, 0.6 * k]], { n: 8 }), mat(has(p.barnacles) ? p.barnacles : 'bone'), top, Math.cos(i * 2.3) * R * 1.0 * k, (-3 - i * 1.6) * k, Math.sin(i * 2.3) * R * 1.0 * k).rotation.z = Math.cos(i * 2.3) * -1.5;
    if (p.weed) for (let i = 0; i < 4; i++) add(tube(curve([V(Math.cos(i * 1.6) * R * k, -2 * k, Math.sin(i * 1.6) * R * k), V(Math.cos(i * 1.6) * 2.5 * k, -7 * k, Math.sin(i * 1.6) * 2 * k), V(Math.cos(i * 1.6) * 1.8 * k, -12 * k, Math.sin(i * 1.6) * 2.6 * k)], 10), [0.12 * k, 0.6 * k], { n: 5 }), mat(has(p.weed) ? p.weed : 'seaweed', { side: true }), top);
    if (p.ribbon) add(tube(curve([V(-5.5 * k, 3.6 * k, 0), V(-6.5 * k, -2 * k, 1 * k), V(-5.5 * k, -9 * k, 2 * k)]), [0.12 * k, 1.3 * k], { n: 6, up: V(0, 0, 1) }), mat(p.ribbon, { side: true }), top);
    tip.position.set(0, (hT + 9) * k, 0);
    return;
  }
  if (st === 'gnarl' || p.leaves && st !== 'rings') { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; add(tube(curve([V(0, -1 * k, 0), V(Math.cos(a) * 3.5 * k, 3 * k, Math.sin(a) * 3.5 * k), V(Math.cos(a + 0.8) * 3.8 * k, 7 * k, Math.sin(a + 0.8) * 3.8 * k), V(Math.cos(a + 1.4) * 1.5 * k, 9.5 * k, Math.sin(a + 1.4) * 1.5 * k)], 14), t => R * 0.75 * k * (1 - t * 0.6), { n: 8 }), wood, top); } }
  else for (let i = 0; i < 3; i++) { const rr = (p.ringR || 7) * (1 - i * 0.22) * 0.75; const t = add(tube(ellipse(V(0, (4 + i * 0.6) * k, 0), V(1, 0, 0), V(0, 1, 0), rr * k, rr * k, 32), 0.55 * k, { closed: true, n: 6 }), metal, top); t.rotation.y = i * 1.05; }
  const orbKey = p.orb || p.crystal || p.gem || (p.glow ? p.glow : null);
  if (orbKey) { if (p.crystal && !p.orb) { const gk = isEmit(p.crystal) ? p.crystal : p.glow; const c = add(new THREE.OctahedronGeometry(3.2 * k, 0), mat(p.crystal), top, 0, 4.5 * k, 0); c.scale.set(0.75, 1.6, 0.75); if (gk) emit(fx, c, gk, 1.2); } else orb(orbKey); }
  if (p.leaves) for (let i = 0; i < 7; i++) { const lf = add(wedge([[0, 0], [1.2 * k, 1.8 * k], [0, 4.2 * k], [-1.2 * k, 1.8 * k]], 0.3 * k), mat(p.leaves, { side: true }), top, Math.sin(i * 1.3) * 2.6 * k, -1.5 * k - (i % 3) * 1.4 * k, Math.cos(i * 1.3) * 2.6 * k); lf.rotation.set(0.6, i * 0.9, Math.sin(i) * 0.9); }
  tip.position.set(0, (hT + 8) * k, 0);
}

function bow({ inner, k, fx, W, p }, tip, g) {
  const len = p.len || 60, bu = (p.bulge || 9) * 1.3, lr = (p.limbR || 3) * 0.55;
  const limbKey = has(p.limb) ? p.limb : 'wood';
  // recurved limbs: thick at the grip, thin at the tips, which curl forward
  const pts = []; for (let i = 0; i <= 28; i++) { const t = lerp(-1, 1, i / 28), y = t * len * 0.5 * k, z = (1 - t * t) * bu * k - Math.pow(Math.abs(t), 6) * bu * 1.1 * k; pts.push(V(0, y, z)); }
  const limb = add(tube(pts, t => { const e = Math.abs(t * 2 - 1); return [lr * k * (1.35 - e * 0.8), lr * k * (0.9 - e * 0.52)]; }, { n: 10, up: V(1, 0, 0) }), mat(limbKey), inner);
  if (KIND(limbKey) === 'glass' || limbKey === 'glass') emit(fx, limb, p.spark || 'storm', 0.5);
  const e0 = pts[0], e1 = pts[28];
  const sKey = has(p.stringMat) ? p.stringMat : null;
  const sg = new THREE.BufferGeometry().setFromPoints([e0, e1]);
  const string = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: sKey ? glowColor(sKey) : 0xe8e0c4 })); inner.add(string); g.userData.string = string;
  for (const e of [e0, e1]) add(sph(lr * 0.8 * k, 8, 6), mat(p.nock || 'bone'), inner, e.x, e.y, e.z);
  // a grip of wrapped leather with an arrow shelf
  const gripG = new THREE.Group(); gripG.position.z = bu * k; inner.add(gripG);
  wrapGrip(gripG, -4.5, 4.5, lr * 1.45, p.grip || 'leather', k);
  add(new THREE.BoxGeometry(1.4 * k, 0.6 * k, 1.6 * k), mat('leatherDark'), gripG, lr * 1.2 * k, 4.2 * k, 0);
  (p.bindings || []).forEach(b => { const t = b * 2 - 1, y = t * len * 0.5 * k, z = (1 - t * t) * bu * k; ring(V(0, y, z), V(1, 0, 0), V(0, 0, 1), lr * 1.4 * k, lr * 1.0 * k, 0.35 * k, p.bindMat || 'string', inner, 12); });
  // an antler bow grows tines; a weeping bow trails fronds and tears
  if (p.antler) for (const s of [-1, 1]) for (let j = 0; j < 2; j++) { const t = s * (0.45 + j * 0.25), y = t * len * 0.5 * k, z = (1 - t * t) * bu * k; add(tube(curve([V(0, y, z), V(0, y + s * 2 * k, z + 3 * k), V(0, y + s * 4.5 * k, z + 4 * k)], 8), q => lr * 0.7 * k * (1 - q * 0.85), { n: 6 }), mat(p.antler), inner); }
  if (p.fronds) for (let i = 0; i < 8; i++) { const t = lerp(-0.8, 0.8, i / 7), y = t * len * 0.5 * k, z = (1 - t * t) * bu * k; add(tube(curve([V(0, y, z), V(1.2 * k, y - 3 * k, z + 0.5 * k), V(0.5 * k, y - 8 * k, z + 1 * k)], 8), [0.1 * k, 0.7 * k], { n: 5, up: V(0, 0, 1) }), mat(has(p.fronds) ? p.fronds : 'moss', { side: true }), inner); if (p.tears && i % 2) { const d = add(sph(0.5 * k, 8, 6), mat(p.tears), inner, 0.5 * k, y - 8.5 * k, z + 1 * k); d.scale.set(1, 1.5, 1); emit(fx, d, p.tears, 0.6); } }
  if (p.spark && p.antler) emit(fx, add(sph(0.8 * k, 8, 6), mat(p.spark), inner, 0, e1.y + 1 * k, e1.z), p.spark, 1);
  if (p.gem) gem(p.gem, 1.4 * k, gripG, 0, 0, lr * 1.4 * k, p.gemMat || 'gold');
  if (p.tassel) add(tube(curve([V(0, -4.5 * k, lr * k), V(0, -8 * k, lr * 2 * k), V(0, -14 * k, lr * 3 * k)]), t => [lerp(0.6, 1.4, t) * k, lerp(0.6, 1.4, t) * k], { n: 8 }), mat(p.tassel), gripG);
  tip.position.copy(e1);
  inner.position.z = -bu * k;
  return 0;
}

/* ------------------------------------------------------------------ shields, tomes, lanterns, censers, orbs */
const HER = new Map();
function heraldry(face, paint, paint2, style) {
  const key = [face, paint, paint2, style, Q.d].join('|'); if (HER.has(key)) return HER.get(key);
  const N = 256 * Q.d, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.scale(Q.d, Q.d);
  const P = (MAT[face] || MAT.wood).pal, Qp = (MAT[paint2] || MAT.paintRed || MAT.robeRed).pal, rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  g.fillStyle = rgb(P[3]); g.fillRect(0, 0, 256, 256);
  const kd = KIND(face);
  if (kd === 'wood' || style === 'door') { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; g.fillRect(i * 43, 0, 43, 256); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 43, 0, 2, 256); for (let j = 0; j < 9; j++) { g.strokeStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(i * 43 + 6 + j * 4, 0); g.bezierCurveTo(i * 43 + 10 + j * 4, 80, i * 43 + j * 4, 170, i * 43 + 8 + j * 4, 256); g.stroke(); } } }
  if (style === 'wicker') {
    // willow withies woven over and under: each strand shaded round, the crossing ones darker where they dip under
    g.fillStyle = rgb(P[1]); g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 10) for (let x = 0; x < 256; x += 20) { const over = ((x / 20) + (y / 10)) % 2 === 0; const gr2 = g.createLinearGradient(0, y, 0, y + 9); gr2.addColorStop(0, rgb(P[over ? 4 : 2])); gr2.addColorStop(0.5, rgb(P[over ? 5 : 3])); gr2.addColorStop(1, rgb(P[over ? 3 : 1])); g.fillStyle = gr2; g.beginPath(); g.ellipse(x + 10, y + 4.5, 10.5, 4.6, 0, 0, TAU); g.fill(); }
    for (let x = 0; x < 256; x += 20) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 1, 0, 2, 256); }
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 1 + Math.random() * 3); }
  g.fillStyle = rgb(Qp[3]);
  if (paint === 'chevron') { g.beginPath(); g.moveTo(0, 150); g.lineTo(128, 70); g.lineTo(256, 150); g.lineTo(256, 200); g.lineTo(128, 120); g.lineTo(0, 200); g.fill(); }
  else if (paint === 'quarter') { g.fillRect(0, 128, 128, 128); g.fillRect(128, 0, 128, 128); }
  else if (paint === 'thorn') { g.strokeStyle = rgb(Qp[3]); g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 80, 0, TAU); g.stroke(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80); g.lineTo(128 + Math.cos(a + 0.12) * 100, 128 + Math.sin(a + 0.12) * 100); g.lineTo(128 + Math.cos(a + 0.2) * 80, 128 + Math.sin(a + 0.2) * 80); g.fill(); } }
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 180); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const metal = kd === 'metal';
  const m = new THREE.MeshPhysicalMaterial({ map: t, roughness: metal ? 0.35 : kd === 'stone' ? 0.9 : 0.72, metalness: metal ? 0.85 : 0, normalMap: mat(face).normalMap || null, normalScale: new THREE.Vector2(0.4, 0.4) });
  HER.set(key, m); return m;
}

export function buildOffhand(O, art, fx, u) {
  const p = art?.p || {}, k = 0.36 * u / 40 * 1.55;
  const g = new THREE.Group();
  const look = O.look === 'sigil' && /lantern|lamplighter/.test(p.style || '') ? 'lantern' : O.look === 'sigil' && p.style === 'censer' ? 'censer' : O.look === 'sigil' && p.style === 'chalice' ? 'chalice' : O.look;
  if (look === 'buckler' || look === 'round' || look === 'heater' || look === 'tower') {
    const sh = new THREE.Group(); g.add(sh); sh.position.set(0.05 * u, 0, 0.03 * u); sh.rotation.y = Math.PI / 2 - 0.3;
    let outline;
    const R0 = (look === 'buckler' ? 13 : p.r ? p.r * 0.72 : 19) * k;
    if (look === 'buckler' || look === 'round') { outline = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; outline.push([Math.cos(a) * R0, Math.sin(a) * R0]); } }
    else if (look === 'heater') { const w = 17 * k, h = 24 * k; outline = [[w, h * 0.45]]; for (let i = 0; i <= 16; i++) { const t = i / 16; outline.push([lerp(w, 0, t * t), lerp(h * 0.45, -h * 0.7, Math.sin(t * Math.PI / 2))]); } for (let i = 15; i >= 0; i--) outline.push([-outline[i + 1][0], outline[i + 1][1]]); }
    else { const w = 15 * k, h = 32 * k; outline = [[-w, h * 0.5], [w, h * 0.5]]; for (let i = 0; i <= 12; i++) { const a = lerp(0, Math.PI, i / 12); outline.push([Math.cos(a) * w, -h * 0.38 - Math.sin(a) * h * 0.14]); } }
    const bulge = (x, y) => -((x * x) + (y * y)) * (look === 'tower' ? 0.4 : 0.8) / (k * 40);
    const front = plate(outline, (x, y) => 2.5 * k + bulge(x, y));
    const faceKey = O.face || p.face || 'wood';
    const faceMat = p.style === 'scale' ? mat(has(faceKey) ? faceKey : 'bronze', { as: 'scale', rep: 2 }) : heraldry(faceKey, O.paint, O.paint2, p.style);
    add(front, faceMat, sh);
    add(plate(outline, (x, y) => -0.5 * k + bulge(x, y)), mat('leatherDark', { side: true }), sh);
    const rim = front.userData.rim.map(([x, y]) => V(x, y, bulge(x, y) + 1.2 * k));
    add(tube(rim, (p.style === 'wicker' ? 2 : 1.3) * k, { closed: true, n: 8 }), mat(has(O.rim) ? O.rim : has(p.rim) ? p.rim : 'iron'), sh);
    const rivetKey = has(p.rivets) ? p.rivets : has(O.rim) ? O.rim : 'iron';
    for (let i = 0; i < rim.length; i += Math.max(2, Math.round(rim.length / 18))) add(sph(0.7 * k, 6, 4), mat(rivetKey), sh, rim[i].x * 0.9, rim[i].y * 0.9, rim[i].z + 1.6 * k);
    // the relic shields' own marks
    if (p.style === 'door') { for (const y of [0.3, -0.25]) { add(new THREE.BoxGeometry(30 * k, 2.4 * k, 1 * k), mat(p.rim || 'iron'), sh, 0, y * 32 * k, 3 * k); for (const x of [-11, 0, 11]) add(sph(0.8 * k, 8, 6), mat(rivetKey), sh, x * k, y * 32 * k, 3.6 * k); } for (const y of [0.3, -0.25]) add(tube([V(-15 * k, y * 32 * k, 3 * k), V(-19 * k, y * 32 * k, 1 * k)], 1.1 * k, { n: 8 }), mat(p.hinge || 'bronze'), sh); add(tor(3 * k, 0.6 * k, 6, 18), mat(p.ringMat || 'iron'), sh, 6 * k, 0, 3.8 * k); }
    if (p.chief) { const top = outline.reduce((m, [, y]) => Math.max(m, y), -1e9), y = top - 3.2 * k, pts = []; for (let i = 0; i <= 16; i++) { const x = lerp(-15, 15, i / 16) * k; pts.push(V(x, y, 2.5 * k + bulge(x, y) + 0.4 * k)); } add(tube(pts, [0.45 * k, 2.4 * k], { n: 6, up: V(0, 0, 1) }), mat(p.chief), sh); }
    if (p.inscribe) emit(fx, add(tube(curve([V(-10 * k, -6 * k, 3 * k), V(0, -8 * k, 3.4 * k), V(10 * k, -6 * k, 3 * k)], 12), 0.35 * k, { n: 5 }), mat(p.inscribe), sh), p.inscribe, 0.7);
    if (p.wreath) for (const s of [-1, 1]) { const pts = curve([V(s * 2 * k, -12 * k, 3 * k), V(s * 9 * k, -6 * k, 3.4 * k), V(s * 9 * k, 4 * k, 3.4 * k)], 12); add(tube(pts, 0.4 * k, { n: 5 }), mat(p.wreath), sh); for (let i = 1; i < 12; i += 2) { const lf = add(wedge([[0, 0], [0.7 * k, 1 * k], [0, 2.4 * k], [-0.7 * k, 1 * k]], 0.2 * k), mat(p.wreath), sh, pts[i].x, pts[i].y, pts[i].z + 0.2 * k); lf.rotation.z = s * (0.6 + i * 0.12); } }
    if (p.fire || p.emblem) { const fl = add(wedge([[0, 7 * k], [3 * k, 1 * k], [2 * k, -4 * k], [0, -2 * k], [-2 * k, -4 * k], [-3 * k, 1 * k]], 0.8 * k, null, { bevel: 0.3 * k }), mat(p.fire || p.emblem), sh, 0, 2 * k, 3.6 * k); if (p.fire) emit(fx, fl, p.fire, 1); }
    if (p.runes) emit(fx, add(tube(front.userData.rim.map(([x, y]) => V(x * 0.78, y * 0.78, bulge(x * 0.78, y * 0.78) + 2.9 * k)), 0.3 * k, { closed: true, n: 5 }), mat(p.runes), sh), p.runes, 0.7);
    if (p.charms) for (let i = 0; i < 3; i++) { const x = (i - 1) * 6 * k, y = -R0 * 0.95; add(tube([V(x, y, 2 * k), V(x, y - 4 * k, 2.4 * k)], 0.15 * k, { n: 4 }), mat('string'), sh); add(cone(0.8 * k, 2.6 * k, 5), mat(p.charms), sh, x, y - 5.4 * k, 2.4 * k).rotation.x = Math.PI; }
    const bossKey = O.boss || p.boss;
    if (bossKey && p.style !== 'door') { add(lathe([[0, 4.6 * k], [2.6 * k, 4.1 * k], [4.2 * k, 2.8 * k], [5 * k, 2.5 * k], [5.6 * k, 2.4 * k]], { n: 24 }), mat(bossKey), sh).rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(sph(0.55 * k, 6, 4), mat(bossKey), sh, Math.cos(a) * 5 * k, Math.sin(a) * 5 * k, 2.8 * k); } }
    if (O.gem) gem(O.gem, 1.8 * k, sh, 0, p.fire || p.emblem ? -6 * k : 0, bossKey ? 4.8 * k : 3 * k, has(bossKey) ? bossKey : 'gold');
  } else if (look === 'tome') {
    const b = new THREE.Group(); b.position.set(0.04 * u, 0, 0.05 * u); b.rotation.set(0.2, 0.6, 0); g.add(b);
    add(new THREE.BoxGeometry(12 * k, 16 * k, 1 * k), mat(O.cover || 'leather'), b, 0, 0, 2.6 * k); add(new THREE.BoxGeometry(12 * k, 16 * k, 1 * k), mat(O.cover || 'leather'), b, 0, 0, -2.6 * k);
    add(new THREE.BoxGeometry(11.2 * k, 15.2 * k, 4.4 * k), mat('parchment'), b, 0.5 * k, 0, 0);
    add(tube([V(-6 * k, -8 * k, 0), V(-6 * k, 8 * k, 0)], 3 * k, { n: 10 }), mat(O.cover || 'leather'), b);
    for (const [x, y] of [[5, 7], [5, -7]]) add(new THREE.BoxGeometry(2.5 * k, 2.5 * k, 6.4 * k), mat(O.metal || 'gold'), b, x * k, y * k, 0);
    if (O.gem) gem(O.gem, 1.8 * k, b, 0, 0, 3.4 * k, O.metal || 'gold');
  } else if (look === 'lantern' || look === 'censer' || look === 'chalice') {
    g.userData.upright = true;
    const l = new THREE.Group(); l.position.set(0.03 * u, -0.06 * u, 0.04 * u); g.add(l);
    const m = mat(has(p.metal) ? p.metal : O.metal || 'iron'), fr = mat(has(p.frame) ? p.frame : has(p.metal) ? p.metal : 'iron');
    const glowKey = p.glow || p.core || p.flame || O.glow || 'ember';
    if (look === 'chalice') {
      add(lathe([[0, -6 * k], [3.5 * k, -6 * k], [3.6 * k, -5.4 * k], [0.8 * k, -4.6 * k], [0.7 * k, -0.5 * k], [1.6 * k, 0], [4 * k, 2 * k], [4.6 * k, 5 * k], [4.2 * k, 5.2 * k], [3.6 * k, 2.4 * k], [0.4 * k, 0.6 * k]], { n: 28 }), mat(has(p.metal) ? p.metal : 'silver', { side: true }), l);
      { const wine = add(sph(3.3 * k, 16, 8, 0, TAU, 0, Math.PI / 2), mat(has(p.glow) ? p.glow : 'arcane'), l, 0, 3.2 * k, 0); wine.scale.set(1, 0.2, 1); emit(fx, wine, has(p.glow) ? p.glow : 'arcane', 1.3); }
      if (p.gem) gem(p.gem, 1.1 * k, l, 0, -2.6 * k, 0.9 * k, has(p.metal) ? p.metal : 'silver');
    } else if (look === 'censer') {
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; for (let j = 0; j < 6; j++) add(tor(0.5 * k, 0.15 * k, 4, 8), m, l, Math.cos(a) * 3 * k * (1 - j / 6) , (6 + j * 1.6) * k, Math.sin(a) * 3 * k * (1 - j / 6)).rotation.set(j % 2 ? Math.PI / 2 : 0, a, 0); }
      add(sph(4 * k, 18, 12, 0, TAU, Math.PI / 2, Math.PI / 2), mat(has(p.metal) ? p.metal : 'silver', { side: true }), l, 0, 2 * k, 0);
      add(lathe([[4 * k, 2 * k], [3.6 * k, 4.4 * k], [1.6 * k, 6 * k], [0.4 * k, 6.4 * k]], { n: 18 }), mat(has(p.trim) ? p.trim : 'bronze'), l);
      emit(fx, add(sph(2.4 * k, 12, 8), mat(glowKey), l, 0, 2.4 * k, 0), glowKey, 1.2);
      if (p.gem) gem(p.gem, 1 * k, l, 0, 0, 4 * k, has(p.trim) ? p.trim : 'silver');
    } else {
      add(tube(ellipse(V(0, 9 * k, 0), V(1, 0, 0), V(0, 1, 0), 2.6 * k, 2.6 * k, 16), 0.5 * k, { closed: true, n: 6 }), m, l);
      add(lathe([[0.5 * k, 6.5 * k], [4.5 * k, 4.5 * k], [5 * k, 3.6 * k], [4.2 * k, 3.4 * k]], { n: 6 }), m, l);
      add(lathe([[4.2 * k, -4.6 * k], [5 * k, -5 * k], [4.6 * k, -6 * k], [0, -6.5 * k]], { n: 6 }), m, l);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; add(tube([V(Math.cos(a) * 4.3 * k, -4.8 * k, Math.sin(a) * 4.3 * k), V(Math.cos(a) * 4.3 * k, 3.6 * k, Math.sin(a) * 4.3 * k)], 0.45 * k, { n: 5 }), fr, l); }
      emit(fx, add(ico(2.4 * k, 2), mat(glowKey), l, 0, -0.5 * k, 0), glowKey, 1.4);
      if (p.candle) add(tube([V(0, -4.5 * k, 0), V(0, -1.8 * k, 0)], 0.9 * k, { n: 10 }), mat(p.candle), l);
      if (p.capGem) gem(p.capGem, 0.9 * k, l, 0, 5.8 * k, 0, has(p.metal) ? p.metal : 'gold', V(0, 1, 0));
      if (p.moss) for (let i = 0; i < 5; i++) add(sph(0.9 * k, 8, 6), mat(p.moss), l, Math.cos(i * 1.3) * 4.4 * k, 4 * k, Math.sin(i * 1.3) * 4.4 * k).scale.set(1, 0.5, 1);
      add(new THREE.CylinderGeometry(4.1 * k, 4.1 * k, 8.2 * k, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: has(p.glass) ? glowColor(p.glass) : 0xfff2d0, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide }), l, 0, -0.6 * k, 0);
    }
  } else {
    const f = new THREE.Group(); f.position.set(0.03 * u, 0.05 * u, 0.1 * u); g.add(f); g.userData.float = f;
    if (look === 'orb') { add(ico(4 * k, 3), mat(O.gem || O.glow || 'sapphire'), f); if (O.glow) emit(fx, add(sph(2 * k, 12, 8), mat(O.glow), f), O.glow, 1.3); for (let i = 0; i < 2; i++) add(tube(ellipse(V(), V(1, 0, 0), V(0, 0, 1), 5 * k, 5 * k, 32), 0.4 * k, { closed: true, n: 6 }), mat(O.metal || 'silver'), f).rotation.set(0.4 + i * 1.2, i, 0); }
    else { for (let i = 0; i < (look === 'rings' ? 3 : 2); i++) add(tube(ellipse(V(), V(1, 0, 0), V(0, 1, 0), (5 - i * 1.2) * k, (5 - i * 1.2) * k, 32), 0.5 * k, { closed: true, n: 6 }), mat(O.metal || 'gold'), f).rotation.set(i * 0.9, i * 0.6, 0); if (O.gem) gem(O.gem, 1.6 * k, f, 0, 0, 0, null); if (O.glow) emit(fx, add(sph(1.4 * k, 10, 8), mat(O.glow), f), O.glow, 1); }
  }
  return g;
}
