// The 3D hero, built from the same data the game's pixel heroes are drawn from, now with real modelling: a sculpted
// body with gripping hands, a painted face, hair in locks, and every piece of gear made from the game's own numbers
// with the kit in kit.js (faceted blades with bevels and fullers, wire-wound grips, curved guards, lathed helms,
// shaped shields with painted heraldry, armour that follows the body).
//   - who the hero is: art/hero-looks.js HERO_ART (skin, hair and its style, eyes, cloak, mantle, tabard, quiver...)
//   - what they wear: art/item-looks.js itemArt() and lookFor(), the same "looks" the battle sprite and walker draw
//   - every colour: the Forge's six-step palettes, art/forge.js MAT
//   - proportions: 'hero' (a taller, storybook hero) or 'pixel' (the pixel rig's own, art/heroes.js BUILD)
// buildHero(heroKey, gear, { build: 'hero' | 'pixel' }) -> { group, rig, fx, looks }
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';
import { HERO_ART } from '../../game/src/art/hero-looks.js';
import { BUILD, GROUND } from '../../game/src/art/heroes.js';
import { itemArt, lookFor, RARITY_LOOK, ASPECT_LOOK, SLOTS, rarityTier } from '../../game/src/art/item-looks.js';
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, wedge, plate, blade, mat, glowColor, isEmit, sRGB, KIND } from './kit.js';

export { glowColor };
const TAU = Math.PI * 2;
const SHOWN_H = 1.22; // every hero is scaled to stand this tall on the plinth

/* ------------------------------------------------------------------ proportions */
function specOf(H, style) {
  const youth = H.build === 'youth';
  if (style === 'pixel') {
    const b = BUILD[H.build] || BUILD.human, PX = 1 / 38, Y = py => (GROUND - py) * PX;
    return {
      unit: PX * 6, headR: b.hr * PX, headY: Y(b.hc[1]), neckY: Y(b.sh - 1.6), neckR: 1.4 * PX,
      shY: Y(b.sh + 0.8), shX: (b.shW - 0.9) * PX,
      keys: [[Y(b.legT + 1), (b.waW + 0.6) * PX, 0.72], [Y(b.wa + 2), (b.waW + 0.3) * PX, 0.72], [Y(b.wa), b.waW * PX, 0.7], [Y((b.wa + b.sh) / 2), (b.waW + 0.7) * PX, 0.72], [Y(b.sh + 1), (b.shW + 0.2) * PX, 0.62], [Y(b.sh - 0.6), b.shW * 0.62 * PX, 0.75], [Y(b.sh - 1.6), 1.7 * PX, 1]],
      waistY: Y(b.wa), hipY: Y(b.legT + 1), hemY: Y(b.sk), hipX: 2.5 * PX, legTop: Y(b.legT), ankleY: Y(b.legB) * 0.6 + 0.012, bootY: Y(b.bootT),
      upper: (b.hR[1] - b.sh) * 0.5 * PX, fore: (b.hR[1] - b.sh) * 0.47 * PX, armR: 1.6 * PX, legR: 2.1 * PX, hand: 1.25, foot: 1.2, total: Y(b.hc[1]) + b.hr * PX,
    };
  }
  const s = youth ? 0.86 : 1, hr = youth ? 0.118 : 0.112;
  return {
    unit: 1, headR: hr, headY: 1.6 * s + (youth ? 0.02 : 0), neckY: 1.43 * s, neckR: 0.058 * s,
    shY: 1.4 * s, shX: 0.175 * s,
    keys: [[0.84 * s, 0.15 * s, 0.7], [0.93 * s, 0.158 * s, 0.68], [1.05 * s, 0.128 * s, 0.7], [1.22 * s, 0.158 * s, 0.66], [1.36 * s, 0.18 * s, 0.58], [1.42 * s, 0.11 * s, 0.7], [1.45 * s, 0.058 * s, 1]],
    waistY: 1.05 * s, hipY: 0.93 * s, hemY: 0.68 * s, hipX: 0.088 * s, legTop: 0.9 * s, ankleY: 0.085 * s, bootY: 0.34 * s,
    upper: 0.29 * s, fore: 0.26 * s, armR: 0.05 * s, legR: 0.083 * s, hand: 1, foot: 1, total: 1.6 * s + hr + (youth ? 0.02 : 0),
  };
}
// the torso's half-width, depth factor at a height, and a point on its front
function torsoAt(S, y) {
  const K = S.keys;
  if (y <= K[0][0]) return [K[0][1], K[0][2]];
  for (let i = 0; i < K.length - 1; i++) if (y <= K[i + 1][0]) { const t = smooth((y - K[i][0]) / (K[i + 1][0] - K[i][0])); return [lerp(K[i][1], K[i + 1][1], t), lerp(K[i][2], K[i + 1][2], t)]; }
  const L = K[K.length - 1]; return [L[1], L[2]];
}
const squarish = t => 1 / Math.pow(Math.pow(Math.abs(Math.cos(t)), 2.25) + Math.pow(Math.abs(Math.sin(t)), 2.25), 1 / 2.25);
function torsoRing(S, y, off, n = 28, fold = 0, flare = 0) {
  const [w, d] = torsoAt(S, y);
  return ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), w + off + flare, w * d + off + flare * 0.8, n, t => squarish(t) * (1 + fold * Math.cos(t * 9) * 0.5 + fold * 0.3 * Math.sin(t * 5 + 1)));
}
function torsoLoft(S, y0, y1, off, { n = 28, steps = 10, flareAt = null } = {}) {
  const rings = [];
  for (let i = 0; i <= steps; i++) { const y = lerp(y0, y1, i / steps); const f = flareAt ? flareAt(i / steps, y) : [0, 0]; rings.push(torsoRing(S, y, off, n, f[1] || 0, f[0] || 0)); }
  return loft(rings);
}

/* ------------------------------------------------------------------ the painted face */
function faceTexture(H, skinKey, hairKey, { blind = false } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const P = (MAT[skinKey] || MAT.skin).pal, Hp = (MAT[hairKey] || MAT.hairBrown).pal;
  const rgb = (a, k = 1) => `rgb(${a[0] * k | 0},${a[1] * k | 0},${a[2] * k | 0})`;
  g.fillStyle = rgb(P[3].map((v, i) => v + (P[4][i] - v) * 0.35)); g.fillRect(0, 0, 1024, 512);
  const cx = 256, ey = 268;
  // cheeks
  for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * 70, ey + 46, 2, cx + s * 70, ey + 46, 46); gr.addColorStop(0, 'rgba(225,95,85,.32)'); gr.addColorStop(1, 'rgba(225,95,85,0)'); g.fillStyle = gr; g.fillRect(cx + s * 70 - 50, ey - 4, 100, 100); }
  // nose and mouth
  g.strokeStyle = rgb(P[2], 1); g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - 6, ey + 46); g.quadraticCurveTo(cx, ey + 52, cx + 6, ey + 46); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(cx + 5, ey + 36, 5, 14, 0.2, 0, TAU); g.fill();
  g.strokeStyle = 'rgb(150,62,58)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx - 15, ey + 76); g.quadraticCurveTo(cx, ey + 83, cx + 15, ey + 76); g.stroke();
  g.fillStyle = 'rgba(190,90,85,.5)'; g.beginPath(); g.ellipse(cx, ey + 82, 10, 3.5, 0, 0, TAU); g.fill();
  if (H.freckles) { g.fillStyle = rgb(P[2]); for (let i = 0; i < 18; i++) { const s = i % 2 ? 1 : -1; g.beginPath(); g.arc(cx + s * (44 + (i * 37 % 40)), ey + 30 + (i * 13 % 20), 2, 0, TAU); g.fill(); } }
  if (H.marks === 'bark') { g.strokeStyle = 'rgba(60,90,40,.7)'; g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 52, ey + 18); g.lineTo(cx + s * 70, ey + 52); g.lineTo(cx + s * 62, ey + 70); g.stroke(); } }
  // eyes
  if (!blind) for (const s of [-1, 1]) {
    const x = cx + s * 52, y = ey;
    g.fillStyle = '#f6f2ea'; g.beginPath(); g.ellipse(x, y, 21, 15, 0, 0, TAU); g.fill();
    const ic = new THREE.Color(H.eye || '#1c2a48'), ir = [ic.r * 255, ic.g * 255, ic.b * 255].map(v => Math.min(255, v * 2.4 + 30));
    const gi = g.createRadialGradient(x, y + 2, 2, x, y, 14); gi.addColorStop(0, rgb(ir, 1.2)); gi.addColorStop(0.7, rgb(ir, 0.8)); gi.addColorStop(1, rgb(ir, 0.35));
    g.save(); g.beginPath(); g.ellipse(x, y, 21, 15, 0, 0, TAU); g.clip();
    g.fillStyle = gi; g.beginPath(); g.arc(x - s * 2, y + 1, 13, 0, TAU); g.fill();
    g.fillStyle = '#0b0910'; g.beginPath(); g.arc(x - s * 2, y + 1, 6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 24, y - 16, 48, 9);
    g.restore();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x - s * 2 + 5, y - 4, 4, 0, TAU); g.fill(); g.beginPath(); g.arc(x - s * 2 - 4, y + 5, 2, 0, TAU); g.fill();
    // lashes and lid
    g.strokeStyle = '#1a1014'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y + 1, 22, 16, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(x + s * 20, y - 7); g.lineTo(x + s * 28, y - 11); g.stroke();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(30,16,20,.6)'; g.beginPath(); g.ellipse(x, y, 20, 14, 0, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    g.strokeStyle = rgb(P[2]); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - 6, 22, 14, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  // brows
  g.strokeStyle = rgb(Hp[2]); g.lineWidth = 7;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 30, ey - 34); g.quadraticCurveTo(cx + s * 52, ey - 44, cx + s * 74, ey - 34); g.stroke(); }
  if (blind) { const Bp = (MAT[H.blindfold] || MAT.clothWhite).pal; g.fillStyle = rgb(Bp[4]); g.fillRect(0, ey - 26, 1024, 50); g.fillStyle = rgb(Bp[3]); g.fillRect(0, ey + 18, 1024, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ small helpers */
function add(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
const ring = (R, r, n = 32) => new THREE.TorusGeometry(R, r, 8, n);
function gem(key, r, parent, x, y, z, setting = 'gold', facing = V(0, 0, 1)) {
  if (!key) return null;
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  g.quaternion.setFromUnitVectors(V(0, 0, 1), facing.clone().normalize());
  add(new THREE.OctahedronGeometry(r, 1), mat(key), g).scale.set(1, 1, 0.6);
  if (setting) { add(ring(r * 1.05, r * 0.18, 18), mat(setting), g); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(new THREE.SphereGeometry(r * 0.14, 6, 4), mat(setting), g, Math.cos(a) * r * 1.28, Math.sin(a) * r * 1.28, 0); } }
  return g;
}
const rngOf = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const strHash = str => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/* ------------------------------------------------------------------ the hero */
export function buildHero(heroKey, gear, o = {}) {
  const A = HERO_ART[heroKey] || HERO_ART.warden, H = A.H;
  const S = specOf(H, o.build || 'hero'); S.unit = S.total / 1.72; const u = S.unit; // u: sizes of small details scale with the build
  const L = {}, arts = {};
  for (const s of SLOTS) { const a = gear[s] ? itemArt(gear[s]) : null; arts[s] = a; const l = a ? lookFor(s, a) : null; if (l) L[s] = l; }
  const group = new THREE.Group(), root = new THREE.Group(); group.add(root);
  const rig = { root, S }, fx = { glows: [], aura: null, flame: false };
  const body = L.body, kind = body?.kind, robe = kind === 'robe';
  const skinM = mat(H.skin), tunicKey = H.tunic || 'wool';

  /* ---- legs, trousers, boots */
  rig.legs = [];
  const F = L.feet;
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * S.hipX, S.legTop, 0); root.add(leg); rig.legs.push(leg);
    const ank = S.ankleY - S.legTop, kneeY = ank * 0.52;
    const R = S.legR;
    const legPath = [V(0, 0.02 * u, 0), V(0, kneeY * 0.5, 0.004 * u), V(0, kneeY, 0.008 * u), V(0, (kneeY + ank) * 0.5, 0), V(0, ank, -0.004 * u)];
    const legRad = t => { const thigh = lerp(R * 1.05, R * 0.68, smooth(t / 0.5)), calf = t > 0.5 ? R * 0.68 + Math.sin(clamp01((t - 0.55) / 0.45) * Math.PI) * R * 0.12 - smooth((t - 0.75) / 0.25) * R * 0.22 : thigh; return [calf, calf * 0.95]; };
    add(tube(curve(legPath, 16), legRad, { n: 14, capA: false }), mat(robe ? body.mat : 'pants'), leg);
    // the boot: a shaft up the calf and a foot with a heel, toe and sole
    const bootKey = F ? F.mat : robe ? 'leather' : 'leatherDark', bm = mat(bootKey);
    const top = (S.bootY - S.legTop), gnd = -S.legTop, br = R * 0.92;
    add(tube([V(0, top, 0.002 * u), V(0, lerp(top, ank, 0.5), 0), V(0, ank, -0.004 * u), V(0, gnd + 0.05 * u, -0.006 * u)], t => [br * (1.02 - t * 0.16), br * (0.98 - t * 0.14)], { n: 14, capA: false, capB: false }), bm, leg);
    const fl = 0.24 * u * S.foot, fw = br * 1.05;
    add(tube(curve([V(0, gnd + 0.045 * u, -0.05 * u), V(0, gnd + 0.05 * u, 0), V(0, gnd + 0.035 * u, fl * 0.55), V(0, gnd + 0.025 * u, fl * 0.85)], 12), t => [0.048 * u * (1 - t * 0.45), fw * (1 - smooth((t - 0.75) / 0.25) * 0.45)], { n: 14, up: V(0, 1, 0), shape: a => (Math.cos(a) < 0 ? 0.75 : 1) }), bm, leg);
    add(new THREE.BoxGeometry(fw * 2.05, 0.016 * u, fl * 1.06), mat('leatherDark'), leg, 0, gnd + 0.008 * u, fl * 0.33);
    if (F?.fold) add(tube(ellipse(V(0, top - 0.01 * u, 0), V(1, 0, 0), V(0, 0, 1), br * 1.18, br * 1.14, 20), 0.018 * u, { closed: true, n: 8 }), mat(F.trim || F.mat), leg);
    else if (F?.trim) add(tube(ellipse(V(0, top, 0), V(1, 0, 0), V(0, 0, 1), br * 1.04, br * 1.0, 20), 0.007 * u, { closed: true, n: 6 }), mat(F.trim), leg);
    if (F?.greave) { const gm = mat(F.greave); add(lathe([[br * 1.18, top - 0.01 * u], [br * 1.24, lerp(top, ank, 0.5)], [br * 1.1, ank + 0.02 * u]], { n: 14, phi0: -1.25, phiLen: 2.5 }), mat(F.greave, { side: true }), leg); add(tube([V(0, top - 0.02 * u, br * 1.26), V(0, ank + 0.03 * u, br * 1.12)], 0.005 * u, { n: 6 }), gm, leg); }
  }

  /* ---- the torso, the garment over it and the hem */
  const chest = new THREE.Group(); root.add(chest); rig.chest = chest;
  const skirt = new THREE.Group(); root.add(skirt); rig.skirt = skirt;
  const neckTop = S.neckY + 0.03 * u;
  add(torsoLoft(S, S.hipY - 0.04 * u, neckTop, 0, { steps: 12 }), mat(robe ? body.mat : tunicKey), chest);
  const torsoMat = body ? mat(body.mat, { as: kind === 'mail' ? (body.scale ? 'scale' : 'mail') : null }) : null;
  const hemY = robe ? 0.02 * u : kind === 'mail' ? S.hemY + 0.02 * u : kind === 'leather' ? S.hemY + 0.08 * u : S.hemY + 0.05 * u;
  // the skirt of whatever is worn below the belt: a mail skirt, a jerkin's tail, a tunic, a robe to the floor
  const hemKey = robe ? body.mat : kind === 'mail' ? body.mat : kind === 'leather' ? (body.shirt || tunicKey) : kind === 'plate' ? 'mail' : tunicKey;
  const hemMat = kind === 'mail' ? mat(body.mat, { as: body.scale ? 'scale' : 'mail', side: true }) : kind === 'plate' ? mat('steel', { as: 'mail', side: true }) : mat(hemKey, { side: true });
  {
    const steps = 10, y0 = S.waistY, rings = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, y = lerp(y0, hemY, t), yt = Math.max(y, S.keys[0][0]);
      const [w, d] = torsoAt(S, yt), fl = robe ? t * t * 0.17 * u + t * 0.03 * u : t * (kind === 'mail' ? 0.03 : 0.02) * u, fold = robe ? t * 0.05 : t * 0.02;
      rings.push(ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), w + 0.012 * u + fl, w * d + 0.012 * u + fl * 0.85, 32, a => squarish(a) * (1 + fold * Math.cos(a * 9))));
    }
    add(loft(rings), hemMat, skirt);
    if (body?.trim || robe) { const r = rings[rings.length - 1]; add(tube(r.map(p => p.clone().add(V(0, 0.004 * u, 0))), 0.008 * u, { closed: true, n: 6 }), mat(body?.trim || 'gold'), skirt); }
  }
  // the garment on the chest
  if (kind === 'mail' || kind === 'leather') {
    add(torsoLoft(S, S.waistY - 0.02 * u, neckTop - 0.01 * u, kind === 'mail' ? 0.012 * u : 0.009 * u, { steps: 10 }), torsoMat, chest);
    if (body.trim) add(tube(torsoRing(S, neckTop - 0.015 * u, 0.014 * u, 24), 0.007 * u, { closed: true, n: 6 }), mat(body.trim), chest);
  }
  if (kind === 'leather') {
    if (body.studs) for (let r = 0; r < 4; r++) for (let c = -2; c <= 2; c++) { if (!c) continue; const y = lerp(S.waistY + 0.05 * u, S.shY - 0.08 * u, r / 3), [w, d] = torsoAt(S, y), x = c * w * 0.28, z = Math.sqrt(Math.max(0, 1 - (x / (w + 0.01)) ** 2)) * (w * d + 0.01 * u); add(new THREE.SphereGeometry(0.0055 * u, 8, 6), mat(body.studs), chest, x, y, z); }
    // stitched seams down the front
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const y = lerp(S.waistY, S.shY - 0.05 * u, i / 8), [w, d] = torsoAt(S, y); pts.push(V(s * w * 0.42, y, Math.sqrt(1 - 0.42 ** 2) * w * d + 0.011 * u)); } add(tube(pts, 0.0022 * u, { n: 5 }), mat('leatherDark'), chest); }
  }
  if (kind === 'plate') {
    const pm = torsoMat, rings = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, y = lerp(S.waistY - 0.03 * u, S.shY - 0.01 * u, t), r = torsoRing(S, y, 0.024 * u, 32); r.forEach((p, j) => { const a = j / 32 * TAU, front = Math.max(0, Math.sin(a)); p.z += front * front * 0.022 * u * Math.sin(t * Math.PI) + Math.pow(Math.abs(Math.cos(a)), 40) * 0; }); rings.push(r); }
    add(loft(rings), pm, chest);
    // the ridge down the breastplate, the rolled edges, and the lames below the waist
    const ridge = []; for (let i = 0; i <= 10; i++) { const y = lerp(S.waistY, S.shY - 0.04 * u, i / 10), [w, d] = torsoAt(S, y); ridge.push(V(0, y, w * d + 0.024 * u + 0.022 * u * Math.sin(i / 10 * Math.PI))); }
    add(tube(ridge, [0.004 * u, 0.006 * u], { n: 6 }), mat(body.trim || body.mat), chest);
    add(tube(rings[rings.length - 1].map(p => p.clone()), 0.008 * u, { closed: true, n: 6 }), mat(body.trim || body.mat), chest);
    add(tube(rings[0].map(p => p.clone()), 0.008 * u, { closed: true, n: 6 }), mat(body.trim || body.mat), chest);
    for (let k = 0; k < 3; k++) { const y0 = S.waistY - 0.035 * u - k * 0.045 * u, y1 = y0 - 0.05 * u; const g = loft([torsoRing(S, Math.max(y0, S.keys[0][0]), (0.03 + k * 0.006) * u, 32, 0, k * 0.008 * u), torsoRing(S, Math.max(y1, S.keys[0][0]), (0.034 + k * 0.006) * u, 32, 0, (k + 1) * 0.01 * u)]); add(g, mat(body.mat, { side: true }), skirt); }
  }
  if (body?.belt || kind === 'leather' || kind === 'mail' || robe) {
    const by = S.waistY - 0.005 * u, bk = robe ? (body.sash || body.trim || 'leather') : body?.belt || 'leatherDark';
    add(loft([torsoRing(S, by + 0.018 * u, 0.02 * u, 32), torsoRing(S, by - 0.018 * u, 0.022 * u, 32)]), mat(bk, { side: true }), chest);
    const [w, d] = torsoAt(S, by);
    if (!robe) { const bkl = new THREE.Group(); bkl.position.set(0, by, w * d + 0.024 * u); chest.add(bkl); add(tube(ellipse(V(), V(1, 0, 0), V(0, 1, 0), 0.022 * u, 0.02 * u, 16), 0.0045 * u, { closed: true, n: 6 }), mat('bronze'), bkl); add(new THREE.BoxGeometry(0.004 * u, 0.034 * u, 0.006 * u), mat('bronze'), bkl); }
    if (kind === 'leather') { const pz = w * d; add(tube([V(w * 0.7, by - 0.02 * u, pz * 0.7), V(w * 0.72, by - 0.08 * u, pz * 0.75)], [0.035 * u, 0.018 * u], { n: 10 }), mat(body.belt || 'leatherDark'), chest); }
    if (robe && body.sash) add(tube(curve([V(w * 0.35, by, w * d + 0.02 * u), V(w * 0.42, by - 0.12 * u, w * d + 0.04 * u), V(w * 0.38, by - 0.26 * u, w * d + 0.06 * u)]), [0.004 * u, 0.022 * u], { n: 8 }), mat(body.sash), chest);
  }
  if (robe) {
    // a cowl at the neck and a trim down the front
    add(tube(torsoRing(S, neckTop - 0.025 * u, 0.03 * u, 28), 0.018 * u, { closed: true, n: 10 }), mat(body.trim || body.mat), chest);
    const fr = []; for (let i = 0; i <= 12; i++) { const y = lerp(neckTop - 0.04 * u, 0.05 * u, i / 12), yt = Math.max(y, S.keys[0][0]), [w, d] = torsoAt(S, yt), t = clamp01((S.waistY - y) / (S.waistY - 0.02 * u)), fl = t * t * 0.17 * u + t * 0.03 * u; fr.push(V(0, y, w * d + 0.02 * u + fl * 0.85)); }
    if (body.trim) add(tube(fr, [0.003 * u, 0.016 * u], { n: 8 }), mat(body.trim), chest);
  }
  for (const gk of [body?.runes, body?.glyph].filter(Boolean)) {
    const pts = []; for (let i = 0; i <= 8; i++) { const y = lerp(S.waistY + 0.04 * u, S.shY - 0.1 * u, i / 8), [w, d] = torsoAt(S, y); pts.push(V(0, y, w * d + (kind === 'plate' ? 0.034 + 0.02 * Math.sin(i / 8 * Math.PI) : 0.016) * u)); }
    const r = add(tube(pts, [0.0025 * u, 0.006 * u], { n: 6 }), mat(gk), chest); fx.glows.push({ obj: r, color: glowColor(gk), power: 0.7 });
  }
  if (body?.gem) { const y = S.shY - 0.1 * u, [w, d] = torsoAt(S, y); gem(body.gem, 0.016 * u, chest, 0, y, w * d + (kind === 'plate' ? 0.05 : 0.02) * u, body.trim || 'gold'); }
  // the tabard of the Hearthwarden: a cloth panel hanging down front and back over the armour
  if (H.tabard && !robe) for (const s of [1, -1]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const y = lerp(S.shY - 0.03 * u, hemY + 0.04 * u, i / 12), yt = Math.max(y, S.keys[0][0]), [w, d] = torsoAt(S, yt); const off = kind === 'plate' ? 0.045 : kind === 'mail' ? 0.022 : 0.016; pts.push(V(0, y, s * (w * d + off * u + (y < S.waistY ? (S.waistY - y) * 0.12 : 0)))); }
    add(tube(pts, t => [0.0035 * u, lerp(0.06, 0.078, t) * u * (o.build === 'pixel' ? 1.4 : 1)], { n: 8, up: V(0, 0, 1) }), mat(H.tabard, { side: true }), chest);
  }

  /* ---- arms and hands */
  const sleeveKey = body ? (body.sleeve || (robe ? body.mat : body.shirt || tunicKey)) : tunicKey;
  const gloves = L.hands, gloveKey = gloves ? gloves.mat : H.gloves || H.skin;
  rig.arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * S.shX, S.shY, 0); root.add(sh);
    const ar = S.armR;
    const up = [V(0, 0.02 * u, 0), V(0, -S.upper * 0.5, 0.004 * u), V(0, -S.upper, 0)];
    add(tube(curve(up, 10), t => [lerp(ar * 1.25, ar * 0.85, t) + Math.sin(t * Math.PI) * ar * 0.12, lerp(ar * 1.2, ar * 0.85, t)], { n: 12 }), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh);
    add(new THREE.SphereGeometry(ar * 1.35, 16, 12), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh, -side * ar * 0.25, 0.01 * u, 0).scale.set(1, 1.05, 0.95);
    const elbow = new THREE.Group(); elbow.position.y = -S.upper; sh.add(elbow);
    const fore = [V(0, 0, 0), V(0, -S.fore * 0.5, 0.003 * u), V(0, -S.fore, 0)];
    const foreRad = t => { const r = lerp(ar * 0.9, ar * 0.62, t) + Math.sin(clamp01(t / 0.6) * Math.PI) * ar * 0.1; return [r, r * 0.88]; };
    add(tube(curve(fore, 10), foreRad, { n: 12 }), mat(robe ? body.mat : sleeveKey), elbow);
    if (robe) add(tube([V(0, -S.fore * 0.25, 0), V(0, -S.fore * 0.8, 0.01 * u), V(0, -S.fore * 1.05, 0.02 * u)], t => [lerp(ar * 1.1, ar * 1.7, t * t), lerp(ar * 1.1, ar * 1.6, t * t)], { n: 16, capA: false, capB: false }), mat(body.mat, { side: true }), elbow);
    if (kind === 'plate') { add(tube([V(0, -S.fore * 0.15, 0), V(0, -S.fore * 0.9, 0)], t => [lerp(ar * 1.05, ar * 0.8, t), lerp(ar * 1.0, ar * 0.76, t)], { n: 12 }), torsoMat, elbow); add(new THREE.SphereGeometry(ar * 0.95, 12, 8), torsoMat, elbow); }
    const hand = new THREE.Group(); hand.position.y = -S.fore; elbow.add(hand);
    const grip = buildHand(hand, side, mat(gloveKey), gloves, u * S.hand, fx);
    // pauldrons: three lames over the shoulder
    const pk = body?.pauldrons || (kind === 'plate' ? body.mat : null);
    if (pk) for (let k = 0; k < 3; k++) { const r = ar * (2.0 - k * 0.22); const p = add(new THREE.SphereGeometry(r, 18, 10, 0, TAU, 0, Math.PI * 0.42), mat(pk, { side: true }), sh, side * 0.006 * u, 0.025 * u - k * 0.03 * u, 0); p.rotation.z = -side * (0.35 + k * 0.12); p.scale.set(1.1, 0.75, 1); if (body?.trim && k === 0) add(tube(ellipse(V(0, Math.cos(Math.PI * 0.42) * r, 0), V(1, 0, 0), V(0, 0, 1), Math.sin(Math.PI * 0.42) * r, Math.sin(Math.PI * 0.42) * r, 24), 0.005 * u, { closed: true, n: 6 }), mat(body.trim), p); }
    rig.arms.push({ sh, elbow, hand, grip, side });
  }
  rig.armR = rig.arms[0]; rig.armL = rig.arms[1];

  /* ---- neck, head, face, hair */
  add(tube([V(0, S.neckY - 0.02 * u, 0), V(0, S.headY - S.headR * 0.55, 0.004 * u)], S.neckR, { n: 14 }), skinM, root);
  const head = new THREE.Group(); head.position.set(0, S.headY, 0.006 * u); root.add(head); rig.head = head;
  const r = S.headR;
  const blind = !!H.blindfold;
  const faceM = mat(H.skin).clone(); faceM.map = faceTexture(H, H.skin, H.hairMat, { blind }); faceM.color = new THREE.Color(1, 1, 1);
  const skull = new THREE.SphereGeometry(r, 64, 40);
  { const p = skull.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const low = clamp01(-y / r); const k = 1 - low * low * 0.3 * (z > 0 ? 1 : 0.6); x *= k * 0.94; z *= (z > 0 ? 1 - low * 0.05 : 1.04); if (z > 0) z += low * low * r * 0.08 * (1 - Math.abs(x) / r); y *= 1.06; p.setXYZ(i, x, y, z); } skull.computeVertexNormals(); }
  add(skull, faceM, head);
  for (const s of [-1, 1]) {
    if (H.ears === 'long') { const e = add(tube(curve([V(s * r * 0.86, -r * 0.05, -r * 0.1), V(s * r * 1.2, r * 0.18, -r * 0.25), V(s * r * 1.45, r * 0.42, -r * 0.42)]), t => [lerp(r * 0.16, 0.001, t), lerp(r * 0.06, 0.001, t)], { n: 8 }), skinM, head); }
    else add(new THREE.SphereGeometry(r * 0.17, 10, 8), skinM, head, s * r * 0.9, -r * 0.08, -r * 0.08).scale.set(0.5, 1, 0.8);
  }
  if (blind) add(lathe([[r * 1.0, r * 0.12], [r * 1.03, r * 0.12], [r * 1.03, -r * 0.22], [r * 1.0, -r * 0.22]], { n: 40, sx: 0.96 }), mat(H.blindfold), head, 0, 0, 0.004 * u);
  const HL = L.head, look = HL?.look;
  const covers = look === 'helm' || look === 'coif' || look === 'hood' || look === 'kettle';
  buildHair(head, H, r, covers, look, strHash(heroKey));
  if (H.beard) add(new THREE.SphereGeometry(r * 1.02, 24, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.4), mat(H.hairMat, { side: true }), head).rotation.y = Math.PI;
  if (HL) buildHeadgear(head, root, HL, arts.head, r, S, u, fx);

  /* ---- the identity's cloth: mantle, cloak, quiver */
  if (H.mantle && look !== 'hood' && look !== 'coif') {
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.01 * u, S.shY - 0.085 * u, t); rings.push(torsoRing(S, y, (0.018 + t * 0.022) * u, 32, t * 0.05, 0)); }
    add(loft(rings), mat(H.mantle, { side: true }), chest);
  }
  if (H.cloak && !robe) {
    const cape = new THREE.Group(); cape.position.set(0, S.shY - 0.02 * u, 0); root.add(cape); rig.cape = cape;
    const rows = 12, cols = 14, rings = [], [w0, d0] = torsoAt(S, S.shY - 0.04 * u), drop = S.shY - 0.18 * u;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, y = -drop * t, row = [];
      for (let j = 0; j <= cols; j++) { const a = lerp(-1, 1, j / cols), wide = lerp(w0 + 0.02 * u, w0 + 0.12 * u, t); const x = a * wide, behind = -(Math.sqrt(Math.max(0, 1 - a * a * 0.85)) * (w0 * d0 + 0.04 * u)) - t * 0.08 * u; row.push(V(x, y, behind + Math.sin(a * 7 + 1) * 0.012 * u * t)); }
      rings.push(row);
    }
    add(loft(rings, { closed: false }), mat(H.cloak, { side: true }), cape);
    add(tube(curve([V(-w0 * 0.85, 0.01 * u, 0.02 * u), V(0, -0.02 * u, w0 * d0 + 0.03 * u), V(w0 * 0.85, 0.01 * u, 0.02 * u)], 12), 0.007 * u, { n: 6 }), mat(H.cloak), cape);
  }
  if (H.quiver) {
    const q = new THREE.Group(); const [w, d] = torsoAt(S, S.shY - 0.15 * u); q.position.set(0.02 * u, S.shY - 0.2 * u, -(w * d + 0.05 * u)); q.rotation.z = -0.45; root.add(q);
    add(tube([V(0, -0.2 * u, 0), V(0, 0.16 * u, 0)], t => [lerp(0.032, 0.04, t) * u, lerp(0.03, 0.036, t) * u], { n: 14 }), mat(H.quiver), q);
    add(tube(ellipse(V(0, 0.16 * u, 0), V(1, 0, 0), V(0, 0, 1), 0.04 * u, 0.036 * u, 16), 0.005 * u, { closed: true, n: 6 }), mat('leatherDark'), q);
    for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * 0.018 * u, z = (i < 3 ? -1 : 1) * 0.012 * u; add(tube([V(x, 0.1 * u, z), V(x * 1.3, 0.25 * u, z * 1.2)], 0.003 * u, { n: 5 }), mat('wood'), q); add(wedge([[0, 0], [0.012 * u, 0.02 * u], [0, 0.05 * u], [-0.012 * u, 0.02 * u]], 0.002 * u), mat(H.fletch || 'clothWhite', { side: true }), q, x * 1.3, 0.21 * u, z * 1.2).rotation.y = i; }
  }

  /* ---- the amulet on its chain */
  if (L.amulet) {
    const A2 = L.amulet, cy = S.shY - 0.13 * u, [w, d] = torsoAt(S, cy), off = kind === 'plate' ? 0.05 : kind === 'mail' ? 0.02 : 0.014;
    const pts = []; for (let i = 0; i <= 16; i++) { const a = lerp(-1, 1, i / 16); const yy = lerp(neckTop - 0.02 * u, cy, 1 - a * a); const [ww, dd] = torsoAt(S, yy); pts.push(V(a * ww * 0.55, yy, Math.sqrt(1 - (a * 0.55) ** 2) * ww * dd + off * u + (1 - a * a) * 0.006 * u)); }
    for (let i = 0; i < pts.length - 1; i++) { const m = pts[i].clone().lerp(pts[i + 1], 0.5), l = add(ring(0.006 * u, 0.0016 * u, 10), mat(A2.chain || 'gold'), chest, m.x, m.y, m.z); l.lookAt(chest.localToWorld(pts[i + 1].clone())); l.rotation.z += i % 2 ? Math.PI / 2 : 0; }
    const pd = new THREE.Group(); pd.position.set(0, cy - 0.012 * u, w * d + off * u + 0.01 * u); chest.add(pd);
    add(lathe([[0, 0.004 * u], [0.022 * u, 0.003 * u], [0.024 * u, 0], [0.022 * u, -0.003 * u], [0, -0.004 * u]], { n: 24 }), mat(A2.metal || 'gold'), pd).rotation.x = Math.PI / 2;
    if (A2.style === 'sun') for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const ray = add(wedge([[0, -0.004 * u], [0.014 * u, 0], [0, 0.004 * u]], 0.003 * u), mat(A2.metal || 'gold'), pd, Math.cos(a) * 0.024 * u, Math.sin(a) * 0.024 * u, 0); ray.rotation.z = a; }
    gem(A2.gem, 0.011 * u, pd, 0, 0, 0.005 * u, A2.metal || 'gold');
  }

  /* ---- the weapon and the offhand */
  const W = L.weapon; rig.cls = W?.cls || null;
  if (W) { const w = buildWeapon(W, arts.weapon, fx, u * (S.unit === 1 ? 1 : 1)); const arm = W.cls === 'bow' ? rig.armL : rig.armR; arm.grip.add(w); rig.weapon = w; }
  const O = L.offhand;
  if (O && W?.cls !== 'bow') { const oh = buildOffhand(O, arts.offhand, fx, u); rig.armL.hand.add(oh); oh.position.set(0, -0.06 * u, 0); rig.offhand = oh; }

  /* ---- the outfit's best rarity, a Primal white flame, the weapon's motes */
  let best = null;
  for (const s of SLOTS) { const it = gear[s]; const rr = typeof it === 'object' && it?.rarity ? it.rarity : arts[s]?.relic ? 'heirloom' : null; if (rr && (!best || rarityTier(rr) > rarityTier(best))) best = rr; }
  fx.best = best;
  const RL = best ? RARITY_LOOK[best] : null;
  if (RL?.aura) fx.aura = new THREE.Color(RL.aura);
  fx.flame = !!RL?.flame || SLOTS.some(s => (gear[s]?.temper || 0) >= 10);
  fx.motes = W?.aspect ? ASPECT_LOOK[W.aspect]?.glow : null;

  root.scale.setScalar(SHOWN_H / S.total);
  rig.scale = SHOWN_H / S.total;
  setPose(rig, 'idle', 0);
  return { group, rig, fx, looks: L };
}

/* ------------------------------------------------------------------ a hand closed round a grip */
// The fist's grip runs along the hand's local z (the weapon's +Y is turned onto it), across the palm, which faces in
// toward the body; the fingers curl round it and the thumb closes over them.
function buildHand(hand, side, m, gloves, u, fx) {
  const med = -side; // toward the middle of the body
  const pw = 0.042 * u, pl = 0.06 * u, pd = 0.018 * u;
  const gc = V(med * 0.012 * u, -0.072 * u, 0.004 * u); // the grip's centre
  // palm and back of the hand
  add(tube([V(0, 0.005 * u, 0), V(0, -pl * 0.5, 0.002 * u), V(0, -pl, 0.004 * u)], t => [pd * (1.05 - t * 0.1), pw * (0.62 + t * 0.4)], { n: 14, up: V(1, 0, 0) }), m, hand);
  // fingers: four curls round the grip, stacked along z
  for (let f = 0; f < 4; f++) {
    const z = (f - 1.5) * 0.0175 * u, R = 0.019 * u, rad = (0.0068 - f * 0.0004) * u;
    const pts = []; for (let i = 0; i <= 8; i++) { const a = lerp(0.2, 4.2, i / 8); pts.push(V(gc.x - med * Math.cos(a) * R, gc.y + Math.sin(a) * R * 0.95 - 0.004 * u, z * (1 + i * 0.01) + gc.z)); }
    add(tube(curve(pts, 12), t => rad * (1 - t * 0.2), { n: 8 }), m, hand);
  }
  // thumb over the fingers
  add(tube(curve([V(med * 0.004 * u, -0.022 * u, 0.026 * u), V(med * 0.02 * u, -0.05 * u, 0.034 * u), V(med * 0.03 * u, -0.07 * u, 0.026 * u), V(med * 0.028 * u, -0.082 * u, 0.012 * u)], 10), t => 0.0085 * u * (1 - t * 0.25), { n: 8 }), m, hand);
  if (gloves) {
    // a cuff at the wrist; gauntlets get plates over the back of the hand and knuckles
    add(lathe([[0.03 * u, 0.03 * u], [0.034 * u, 0.012 * u], [0.026 * u, -0.004 * u]], { n: 16 }), m, hand);
    if (gloves.plate) { add(tube([V(-med * 0.012 * u, 0, 0), V(-med * 0.016 * u, -pl * 0.9, 0)], [0.008 * u, pw * 0.75], { n: 10, up: V(1, 0, 0) }), m, hand); for (let k = 0; k < 2; k++) add(tube([V(-med * 0.012 * u, -pl * (0.95 + k * 0.18), -0.034 * u), V(-med * 0.012 * u, -pl * (0.95 + k * 0.18), 0.034 * u)], 0.008 * u, { n: 8 }), m, hand); }
    if (gloves.trim) add(tube(ellipse(V(0, 0.03 * u, 0), V(1, 0, 0), V(0, 0, 1), 0.031 * u, 0.031 * u, 18), 0.004 * u, { closed: true, n: 6 }), mat(gloves.trim), hand);
    if (gloves.gem) gem(gloves.gem, 0.008 * u, hand, -med * 0.022 * u, -0.03 * u, 0, gloves.trim || 'gold', V(-med, 0, 0));
  }
  const grip = new THREE.Group(); grip.position.copy(gc); grip.rotation.x = Math.PI / 2; hand.add(grip);
  return grip;
}

/* ------------------------------------------------------------------ hair, in locks */
function buildHair(head, H, r, covers, look, seed) {
  const style = H.hair || 'short'; if (style === 'none') return;
  const hm = mat(H.hairMat, { side: true }), rnd = rngOf(seed);
  const onSkull = (lat, lon, k = 1.04) => V(Math.sin(lon) * Math.cos(lat) * r * k * 0.95, Math.sin(lat) * r * k * 1.06, Math.cos(lon) * Math.cos(lat) * r * k);
  if (!covers) {
    // the cap of hair over the crown, set back from the brow
    const cap = new THREE.SphereGeometry(r * 1.07, 40, 20, 0, TAU, 0, Math.PI * (style === 'crop' ? 0.4 : 0.47));
    const p = cap.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * 0.95), p.setY(i, p.getY(i) * 1.06);
    cap.computeVertexNormals();
    add(cap, hm, head, 0, r * 0.05, -r * 0.06).rotation.x = -0.32;
    // a fringe of locks over the brow
    const nF = style === 'crop' ? 5 : 7;
    for (let i = 0; i < nF; i++) { const lon = lerp(-0.95, 0.95, i / (nF - 1)) + (rnd() - 0.5) * 0.1, len = (style === 'crop' ? 0.25 : 0.42) + rnd() * 0.15; const a = onSkull(0.95, lon * 0.8, 1.06), b = onSkull(0.62, lon * 0.95, 1.1), c = onSkull(0.62 - len, lon * 1.05 + (lon > 0 ? 0.15 : -0.15), 1.07); add(tube(curve([a, b, c], 10), t => [lerp(r * 0.2, r * 0.02, t), lerp(r * 0.07, r * 0.01, t)], { n: 8, up: b.clone().normalize() }), hm, head); }
  }
  // locks round the sides and back: to the jaw, or to the shoulders for long hair
  const long = style === 'long', fall = long ? r * 2.6 : style === 'short' || style === 'crop' ? r * 0.75 : r * 0.9;
  const nB = long ? 22 : 14;
  for (let i = 0; i < nB; i++) {
    const lon = lerp(0.9, TAU - 0.9, i / (nB - 1)) + (rnd() - 0.5) * 0.12;
    if (covers && !long && Math.cos(lon) > -0.2) continue;
    const a = onSkull(0.55, lon, 1.04), b = onSkull(-0.15, lon, 1.12), out = V(Math.sin(lon), 0, Math.cos(lon));
    const c = b.clone().add(V(0, -fall * (0.7 + rnd() * 0.35), 0)).addScaledVector(out, r * (long ? 0.25 : 0.06)).add(V(0, 0, long && Math.cos(lon) < 0 ? -r * 0.25 : 0));
    add(tube(curve([a, b, c], 12), t => [lerp(r * 0.24, r * 0.02, t * t), lerp(r * 0.08, r * 0.015, t)], { n: 8, up: out }), hm, head);
  }
  if (style === 'pony' || style === 'braid') {
    const base = onSkull(0.1, Math.PI, 1.08);
    add(new THREE.TorusGeometry(r * 0.12, r * 0.04, 6, 14), mat('leatherDark'), head, base.x, base.y, base.z - r * 0.04);
    if (style === 'pony') add(tube(curve([base, base.clone().add(V(0, -r * 0.4, -r * 0.35)), base.clone().add(V(0, -r * 1.5, -r * 0.3)), base.clone().add(V(0, -r * 2.2, -r * 0.1))], 16), t => [r * 0.22 * (1 - t * 0.7) * (1 + Math.sin(t * Math.PI) * 0.3), r * 0.16 * (1 - t * 0.7)], { n: 10 }), hm, head);
    else for (let i = 0; i < 9; i++) { const t = i / 8; add(new THREE.SphereGeometry(r * 0.15 * (1 - t * 0.4), 10, 8), hm, head, base.x + (i % 2 ? 0.03 : -0.03) * r, base.y - r * 0.25 - i * r * 0.24, base.z - r * 0.25 + t * r * 0.1).scale.set(1.2, 0.9, 1); }
  }
}

/* ------------------------------------------------------------------ helms, hoods, crowns */
function buildHeadgear(head, root, HL, art, r, S, u, fx) {
  const look = HL.look, metalKey = HL.mat || HL.metal || 'steel';
  const trim = HL.trim ? mat(HL.trim) : null;
  const T = (y, k = 1.13) => tube(ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), r * k * 0.97, r * k, 40), 0.008 * u, { closed: true, n: 6 });
  if (look === 'kettle') {
    const m = mat(metalKey, { side: true });
    add(lathe([[0, r * 1.2], [r * 0.45, r * 1.15], [r * 0.82, r * 0.98], [r * 1.06, r * 0.62], [r * 1.12, r * 0.28], [r * 1.14, r * 0.2], [r * 1.5, r * 0.12], [r * 1.78, r * 0.0], [r * 1.82, -r * 0.03], [r * 1.76, -r * 0.01], [r * 1.12, r * 0.13]], { n: 40, sx: 0.97 }), m, head);
    add(tube(curve([V(0, r * 0.3, r * 1.13), V(0, r * 1.2, 0), V(0, r * 0.3, -r * 1.13)], 20), [r * 0.04, r * 0.07], { n: 6, up: V(1, 0, 0) }), mat(metalKey), head);
    if (trim) add(T(r * 0.24, 1.15), trim, head);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(new THREE.SphereGeometry(0.0045 * u, 6, 4), mat(HL.trim || metalKey), head, Math.sin(a) * r * 1.1, r * 0.34, Math.cos(a) * r * 1.13); }
  } else if (look === 'helm') {
    const m = mat(metalKey, { side: true });
    add(lathe([[0, r * 1.2], [r * 0.55, r * 1.13], [r * 0.93, r * 0.86], [r * 1.12, r * 0.42], [r * 1.14, r * 0.3]], { n: 40, sx: 0.97 }), m, head);
    add(lathe([[r * 1.14, r * 0.3], [r * 1.16, -r * 0.2], [r * 1.08, -r * 0.72], [r * 0.95, -r * 1.02]], { n: 32, sx: 0.97, phi0: 0.62, phiLen: TAU - 1.24 }), m, head);
    add(tube([V(0, r * 0.42, r * 1.16), V(0, -r * 0.35, r * 1.22)], [r * 0.08, r * 0.035], { n: 6, up: V(0, 0, 1) }), mat(metalKey), head);
    add(T(r * 0.3, 1.16), trim || mat(metalKey), head);
    if (HL.crest) add(wedge([[-r * 1.05, 0], [-r * 0.6, r * 0.32], [0, r * 0.42], [r * 0.6, r * 0.32], [r * 1.0, 0]], 0.006 * u, null, { bevel: 0.002 * u }), mat(HL.crest), head, 0, r * 1.05, 0).rotation.y = Math.PI / 2;
    if (HL.plume) for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.09; add(tube(curve([V(0, r * 1.15, -r * 0.2), V(a * r, r * 1.6, -r * 0.7), V(a * r * 1.5, r * 1.2, -r * 1.6 - Math.abs(a) * r)], 14), t => [r * 0.12 * Math.sin(Math.PI * Math.max(0.12, t)), r * 0.02], { n: 6, up: V(0, 1, 0) }), mat(HL.plume, { side: true }), head); }
  } else if (look === 'coif' || look === 'hood') {
    const cloth = look === 'hood', m = cloth ? mat(HL.mat || 'hoodGreen', { side: true }) : mat(metalKey, { as: 'mail', side: true, rep: 1.5 });
    const k = cloth ? 1.2 : 1.12;
    add(lathe([[0, r * 1.1 * k], [r * 0.6 * k, r * 1.0 * k], [r * 1.0 * k, r * 0.62 * k]], { n: 40, sx: 0.97 }), m, head);
    add(lathe([[r * 1.0 * k, r * 0.62 * k], [r * 1.05 * k, r * 0.1], [r * 0.95 * k, -r * 0.6], [r * 0.86 * k, -r * 0.98]], { n: 32, sx: 0.97, phi0: 0.95, phiLen: TAU - 1.9 }), m, head);
    // the drape over the shoulders
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.04 * u, S.shY - 0.13 * u, t); rings.push(torsoRing(S, y, (0.02 + t * 0.025) * u, 32, cloth ? t * 0.06 : 0, 0)); }
    add(loft(rings), m, root);
    if (cloth && HL.tip) add(tube(curve([V(0, r * 0.9, -r * 0.8), V(0, r * 0.75, -r * 1.35), V(0, r * 0.2, -r * 1.8)], 12), t => [lerp(r * 0.45, 0.002, t), lerp(r * 0.35, 0.002, t)], { n: 12 }), m, head);
    if (trim) add(tube(curve([V(-r * 0.9, -r * 0.7, r * 0.6), V(-r * 0.95, r * 0.2, r * 0.85), V(0, r * 0.82, r * 0.98), V(r * 0.95, r * 0.2, r * 0.85), V(r * 0.9, -r * 0.7, r * 0.6)], 24), 0.007 * u, { n: 6 }), trim, head);
  } else if (look === 'circlet' || look === 'crown') {
    const mk = MAT[HL.mat]?.metal ? HL.mat : HL.metal || (MAT[HL.mat]?.metal ? HL.mat : 'gold'), m = mat(mk);
    const band = new THREE.Group(); band.position.y = r * 0.42; band.rotation.x = -0.12; head.add(band);
    const h = look === 'crown' ? r * 0.28 : r * 0.08;
    add(lathe([[r * 1.0, -h / 2], [r * 1.04, -h / 2], [r * 1.05, h / 2], [r * 1.01, h / 2], [r * 1.0, -h / 2]], { n: 48, sx: 0.97 }), m, band);
    if (look === 'crown') {
      const n = HL.style === 'regal' ? 8 : 6, tall = HL.style === 'regal' ? r * 0.55 : r * 0.38;
      for (let i = 0; i < n; i++) { const a = i / n * TAU; const pt = new THREE.Group(); pt.position.set(Math.sin(a) * r * 1.03 * 0.97, h / 2, Math.cos(a) * r * 1.03); pt.rotation.y = a; band.add(pt); add(wedge([[-r * 0.13, 0], [r * 0.13, 0], [r * 0.03, tall * 0.7], [0, tall], [-r * 0.03, tall * 0.7]], 0.006 * u, null, { bevel: 0.002 * u }), m, pt); add(new THREE.SphereGeometry(r * 0.05, 10, 8), m, pt, 0, tall, 0); }
      for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; gem(['ruby', 'sapphire', 'emerald'][i % 3], r * 0.06, band, Math.sin(a) * r * 1.06 * 0.97, 0, Math.cos(a) * r * 1.06, null, V(Math.sin(a), 0, Math.cos(a))); }
    }
    if (HL.gem) gem(HL.gem, r * 0.09, band, 0, look === 'crown' ? 0 : r * 0.02, r * 1.08, mk);
    else if (look === 'circlet') add(wedge([[0, -r * 0.12], [r * 0.1, 0], [0, r * 0.16], [-r * 0.1, 0]], 0.005 * u), m, band, 0, 0, r * 1.06);
  }
  if (HL.gem && (look === 'helm' || look === 'kettle' || look === 'hood')) gem(HL.gem, r * 0.08, head, 0, r * 0.55, r * (look === 'kettle' ? 1.1 : 1.18), HL.trim || 'gold');
  if (HL.runes) { const g = add(T(r * 0.62, look === 'kettle' ? 0.88 : 1.07), mat(HL.runes), head); fx.glows.push({ obj: g, color: glowColor(HL.runes), power: 0.6 }); }
}

/* ------------------------------------------------------------------ weapons, from the recipe's own numbers */
function buildWeapon(W, art, fx, u) {
  const p = W.p, r = W.r;
  let k = (W.k || 0.36) * u / 40 * 1.55; // card px -> metres at the size the hand holds it (a 64 px card, a 1.6 m hero)
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const glowKey = W.glow && isEmit(W.glow) ? W.glow : null;
  const glow = (o, key, power = 1) => { if (key && isEmit(key)) fx.glows.push({ obj: o, color: glowColor(key), power }); };
  let hold = 0; const tip = new THREE.Object3D();
  // a haft, with a wrap of leather wound round it and metal bands
  const haft = (len, R, key, wob = 0) => { const pts = []; for (let i = 0; i <= 10; i++) pts.push(V(Math.sin(i * 1.7) * wob * k, i / 10 * len * k, Math.cos(i * 2.3) * wob * 0.6 * k)); add(tube(curve(pts, 20), t => R * k * (1.06 - t * 0.12), { n: 12 }), mat(key), inner); return pts; };
  const wrap = (a, b, R, key) => { if (!key) return; const turns = Math.max(3, (b - a) / 3.2), pts = []; for (let i = 0; i <= turns * 12; i++) { const t = i / (turns * 12), ang = t * turns * TAU; pts.push(V(Math.cos(ang) * R * 1.12 * k, lerp(a, b, t) * k, Math.sin(ang) * R * 1.12 * k)); } add(tube(pts, R * 0.32 * k, { n: 6 }), mat(key), inner); add(tube([V(0, a * k, 0), V(0, b * k, 0)], R * 1.08 * k, { n: 12 }), mat(key), inner); };
  const bands = (list, R, key) => (list || []).forEach(t => add(lathe([[R * 1.15 * k, (t - 1) * k], [R * 1.4 * k, (t - 0.6) * k], [R * 1.4 * k, (t + 0.6) * k], [R * 1.15 * k, (t + 1) * k]], { n: 14 }), mat(key), inner));
  if (r === 'sword' || r === 'dagger') {
    const grip = p.gripEnd || 12, gT = p.guardT || 3, bl = p.bladeL || 40, bw = p.bladeW || 4, tl = p.tipL || 7, tp = p.taper || 0.9, gr = p.gripR || 2;
    // pommel: a wheel, with a gem set in it
    const pr = (p.pommelR || 3);
    add(lathe([[0, -pr * 1.9 * k], [pr * 0.55 * k, -pr * 1.85 * k], [pr * k, -pr * 1.3 * k], [pr * 1.05 * k, -pr * 0.8 * k], [pr * 0.7 * k, -pr * 0.25 * k], [gr * 0.8 * k, 0]], { n: 18, sz: 0.6 }), mat(p.pommel || p.guardMat || 'iron'), inner);
    if (p.pommelGem) gem(p.pommelGem, pr * 0.45 * k, inner, 0, -pr * 1.05 * k, pr * 0.62 * k, p.pommel || 'gold');
    // grip: leather with wire wound round it
    add(tube([V(0, 0, 0), V(0, grip * 0.5 * k, 0), V(0, grip * k, 0)], t => gr * k * (1 + Math.sin(t * Math.PI) * 0.12), { n: 12 }), mat(p.grip || 'leather'), inner);
    { const pts = [], turns = Math.max(4, grip / 2.2); for (let i = 0; i <= turns * 14; i++) { const t = i / (turns * 14), a = t * turns * TAU, rr = gr * k * (1.06 + Math.sin(t * Math.PI) * 0.12); pts.push(V(Math.cos(a) * rr, t * grip * k, Math.sin(a) * rr)); } add(tube(pts, gr * 0.18 * k, { n: 5 }), mat(p.guardMat === 'gold' ? 'gold' : 'silver'), inner); }
    // guard: a bar with quillons turned toward the blade, a flame, a coin or an s-quillon
    const gw = (p.guardW || 9) * 1.1, gy = (grip + gT / 2) * k, gm = mat(p.guardMat || 'iron');
    if (p.guard === 'coin') add(lathe([[0, -gT * 0.5 * k], [gw * 0.5 * k, -gT * 0.4 * k], [gw * 0.55 * k, 0], [gw * 0.5 * k, gT * 0.4 * k], [0, gT * 0.5 * k]], { n: 24, sz: 0.5 }), gm, inner, 0, gy, 0);
    else {
      const flame = p.guard === 'flame', sq = p.guard === 'quillon';
      const pts = []; for (let i = 0; i <= 20; i++) { const t = lerp(-1, 1, i / 20); pts.push(V(t * gw * k, gy + (flame ? Math.abs(t) ** 2 * gw * 0.5 * k + Math.sin(t * 9) * 0.6 * k : sq ? t * Math.abs(t) * gw * 0.35 * k : Math.abs(t) ** 2.2 * gw * 0.22 * k), 0)); }
      add(tube(pts, t => { const e = Math.abs(t * 2 - 1); return [gT * 0.45 * k * (1.25 - e * 0.55), gT * 0.6 * k * (1.2 - e * 0.5)]; }, { n: 8, up: V(0, 0, 1) }), gm, inner);
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(gT * 0.5 * k, 10, 8), gm, inner, s * gw * k, pts[s < 0 ? 0 : 20].y, 0);
      add(new THREE.SphereGeometry(gT * 0.7 * k, 14, 10), gm, inner, 0, gy, 0).scale.set(1.3, 0.8, 0.75);
    }
    if (p.gem) gem(p.gem, gT * 0.5 * k, inner, 0, gy, gT * 0.55 * k, p.guardMat || 'gold');
    // blade: faceted, beveled, with a fuller, a taper and a point; a knife may curve
    const b0 = (grip + gT) * k, L = (bl + tl) * k, tS = bl / (bl + tl), hw = bw * 0.5 * k * 1.15, th = 0.55 * k + bw * 0.05 * k;
    const curv = p.shape === 'knife' ? (p.curve || 2) : 0;
    const wf = uu => uu < tS ? hw * (1 - (1 - tp) * uu / tS) : hw * tp * Math.sqrt(Math.max(0, 1 - ((uu - tS) / (1 - tS)) ** 2.2));
    const bg = blade(L, wf, uu => th * (1 - uu * 0.45), { fuller: r === 'dagger' ? 0.15 : 0.4, off: uu => -curv * k * uu * uu * 2.5, rings: 22 });
    add(bg, mat(p.blade || 'steel'), inner, 0, b0, 0);
    // a ricasso collar where blade meets guard
    add(lathe([[hw * 0.7, -0.6 * k], [hw * 0.9, 0], [hw * 0.7, 0.8 * k]], { n: 12, sz: 0.35 }), mat(p.guardMat || 'iron'), inner, 0, b0, 0);
    if (p.fuller) for (const s of [-1, 1]) { const f = add(tube([V(0, b0 + 1 * k, s * th * 0.62), V(0, b0 + bl * 0.75 * k, s * th * 0.62)], [hw * 0.12, 0.15 * k], { n: 6, up: V(1, 0, 0) }), mat(p.fuller), inner); glow(f, p.fuller, 0.8); }
    if (W.edge) for (const s of [-1, 1]) { const e = add(tube([V(s * hw * 0.98, b0, 0), V(s * hw * tp * 0.95, b0 + bl * k * 0.98, 0)], 0.25 * k, { n: 5 }), new THREE.MeshBasicMaterial({ color: new THREE.Color(W.edge), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), inner); fx.glows.push({ obj: e, color: new THREE.Color(W.edge), power: 0.7 }); }
    tip.position.set(-curv * k * 2.5, b0 + L, 0);
    hold = grip * 0.5;
  } else if (r === 'bow') {
    k *= 0.85;
    const len = p.len || 60, bu = (p.bulge || 9) * 1.3, lr = (p.limbR || 3) * 0.55;
    const pts = []; for (let i = 0; i <= 24; i++) { const t = lerp(-1, 1, i / 24), y = t * len * 0.5 * k, z = (1 - t * t) * bu * k - Math.pow(Math.abs(t), 6) * bu * 0.9 * k; pts.push(V(0, y, z)); }
    add(tube(pts, t => { const e = Math.abs(t * 2 - 1); return [lr * k * (1.3 - e * 0.75), lr * k * (0.9 - e * 0.5)]; }, { n: 10, up: V(1, 0, 0) }), mat(p.limb || 'wood'), inner);
    const e0 = pts[0], e1 = pts[24];
    const sg = new THREE.BufferGeometry().setFromPoints([e0, e1]); const string = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: 0xe8e0c4 })); inner.add(string); g.userData.string = string;
    for (const e of [e0, e1]) add(new THREE.SphereGeometry(lr * 0.8 * k, 8, 6), mat(p.nock || 'bone'), inner, e.x, e.y, e.z);
    wrap(-4, 4, lr * 1.4, p.grip || 'leather'); inner.children[inner.children.length - 1].position.z = bu * k; inner.children[inner.children.length - 2].position.z = bu * k;
    (p.bindings || []).forEach(b => { const t = b * 2 - 1, y = t * len * 0.5 * k, z = (1 - t * t) * bu * k; add(tube(ellipse(V(0, y, z), V(1, 0, 0), V(0, 0, 1), lr * 1.3 * k, lr * 1.0 * k, 12), 0.35 * k, { closed: true, n: 5 }), mat(p.bindMat || 'string'), inner); });
    if (p.gem) gem(p.gem, 1.4 * k, inner, 0, 0, bu * k + lr * 1.2 * k, p.gemMat || 'gold');
    if (p.tassel) add(tube(curve([V(0, 0, bu * k), V(0, -4 * k, bu * k + 1 * k), V(0, -10 * k, bu * k + 2 * k)]), t => [lerp(0.6, 1.4, t) * k, lerp(0.6, 1.4, t) * k], { n: 8 }), mat(p.tassel), inner);
    tip.position.copy(e1);
    inner.position.z = -bu * k;
    hold = 0;
  } else {
    const len = r === 'staff' ? (p.headT || 62) + 2 : r === 'spear' ? (p.headT || 60) : (p.headT || 50) + 4;
    const R = (p.haftR || 2) * 0.9, hT = p.headT || len;
    haft(len, R, p.haft || 'wood', r === 'staff' ? (p.wobble || 0) * 0.5 : 0);
    wrap(p.wrapA ?? 0, p.wrapB ?? p.wrapEnd ?? 16, R, p.wrap);
    bands(p.bands, R, p.bandMat || 'iron');
    const foot = p.foot || p.butt || p.pommelMat;
    if (foot) add(lathe([[0, -2.5 * k], [R * 1.2 * k, -2 * k], [R * 1.35 * k, 0], [R * 1.1 * k, 2 * k]], { n: 14 }), mat(foot), inner);
    if (r === 'axe') {
      const lo = (p.bladeLo || 12) * 0.82, hi = (p.bladeHi || 8) * 0.82, bw = (p.bladeW || 16) * 0.8, bu = (p.bulge || 3) * 0.8;
      const out = [[R * 0.8, -3.5], [bw * 0.45, -lo * 0.55], [bw * 0.85, -lo * 0.95], [bw + bu * 0.3, -lo * 0.6], [bw + bu, 0], [bw + bu * 0.3, hi * 0.7], [bw * 0.85, hi], [bw * 0.45, hi * 0.5], [R * 0.8, 3.5]].map(([x, y]) => [x * k, y * k]);
      const geo = wedge(out, 3.2 * k, (x) => lerp(1, 0.12, smooth((x / k - bw * 0.35) / (bw * 0.75))), { bevel: 0.3 * k });
      add(geo, mat(p.blade || 'steel'), inner, 0, hT * k, 0);
      add(lathe([[R * 1.3 * k, -4 * k], [R * 1.7 * k, -3 * k], [R * 1.7 * k, 3 * k], [R * 1.3 * k, 4 * k]], { n: 10 }), mat(p.socket || p.blade || 'iron'), inner, 0, hT * k, 0);
      if (p.back === 'poll') add(wedge([[-R * k, -3 * k], [-R * k - 4.5 * k, -2.5 * k], [-R * k - 4.5 * k, 2.5 * k], [-R * k, 3 * k]], 3.6 * k, null, { bevel: 0.3 * k }), mat(p.blade || 'steel'), inner, 0, hT * k, 0);
      else if (p.spikeL) add(wedge([[-R * k, -2 * k], [-R * k - p.spikeL * k, 0], [-R * k, 2 * k]], 2.2 * k, x => lerp(1, 0.2, clamp01((-x / k - R) / p.spikeL))), mat(p.blade || 'steel'), inner, 0, hT * k, 0);
      if (p.runes) { const ru = add(tube([V(bw * 0.35 * k, (hT - 2) * k, 1.5 * k), V(bw * 0.75 * k, (hT + 1) * k, 0.9 * k)], 0.35 * k, { n: 5 }), mat(p.runes), inner); glow(ru, p.runes, 0.8); }
      if (p.edge) { const e = add(tube(curve([V((bw * 0.85) * k, (hT - lo * 0.95) * k, 0), V((bw + bu) * k, hT * k, 0), V((bw * 0.85) * k, (hT + hi) * k, 0)], 10), 0.3 * k, { n: 5 }), mat(p.edge), inner); glow(e, p.edge, 0.9); }
      if (p.gem) gem(p.gem, 1.5 * k, inner, R * 2.2 * k, hT * k, 1.7 * k, p.socket || 'gold');
      tip.position.set((bw + bu) * k, hT * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'hammer') {
      const hw = (p.headW || 14) * 0.72, hh = (p.headH || 13) * 0.72, hm = mat(p.headMat || 'iron');
      const box = []; for (let i = 0; i <= 6; i++) { const t = lerp(-1, 1, i / 6), x = t * hw * k, sc = 1 - Math.pow(Math.abs(t), 6) * 0.12; box.push(ellipse(V(x, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.5 * k * sc, hh * 0.45 * k * sc, 16, squarish)); }
      add(loft(box, { capA: true, capB: true }), hm, inner);
      for (const s of [-1, 1]) add(lathe([[0, 0], [hh * 0.45 * k, 0], [hh * 0.5 * k, 1.2 * k], [hh * 0.4 * k, 2 * k], [0, 2 * k]], { n: 16 }), mat(p.trim || p.headMat || 'steel'), inner, s * hw * k, hT * k, 0).rotation.z = -s * Math.PI / 2;
      if (p.trim) for (const s of [-1, 1]) add(tube(ellipse(V(s * hw * 0.55 * k, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.52 * k, hh * 0.47 * k, 16, squarish), 0.6 * k, { closed: true, n: 5 }), mat(p.trim), inner);
      if (p.spike) add(new THREE.ConeGeometry(2 * k, p.spike * k, 4), hm, inner, 0, (hT + hh * 0.5 + p.spike * 0.5) * k, 0);
      if (p.langets) for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.2 * k, 12 * k, 0.6 * k), hm, inner, 0, (hT - hh * 0.5 - 6) * k, s * R * 1.05 * k);
      if (p.runes) { const ru = add(tube(ellipse(V(0, hT * k, 0), V(0, 1, 0), V(0, 0, 1), hh * 0.51 * k, hh * 0.46 * k, 16, squarish), 0.4 * k, { closed: true, n: 5 }), mat(p.runes), inner); glow(ru, p.runes, 0.9); }
      tip.position.set(hw * k, hT * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'mace') {
      const hw = p.headW || 7, hm = mat(p.headMat || 'iron');
      if (p.style === 'bell') add(lathe([[R * 1.4 * k, (hT + hw) * k], [hw * 0.6 * k, (hT + hw * 0.6) * k], [hw * 1.0 * k, (hT - hw * 0.4) * k], [hw * 1.15 * k, (hT - hw * 0.8) * k]], { n: 24 }), mat(p.headMat || 'bronze', { side: true }), inner);
      else {
        add(lathe([[0, (hT + hw * 0.85) * k], [hw * 0.45 * k, (hT + hw * 0.75) * k], [hw * 0.72 * k, hT * k], [hw * 0.45 * k, (hT - hw * 0.75) * k], [R * 1.3 * k, (hT - hw) * k]], { n: 18 }), hm, inner);
        if (p.style === 'flanged') for (let i = 0; i < 7; i++) { const f = add(wedge([[0, -hw * 0.9 * k], [hw * 0.95 * k, -hw * 0.3 * k], [hw * 1.05 * k, hw * 0.3 * k], [0, hw * 0.95 * k]], 1.1 * k, x => lerp(1, 0.25, x / (hw * k)), { bevel: 0.2 * k }), hm, inner, 0, hT * k, 0); f.rotation.y = i / 7 * TAU; }
        else for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, b = (i % 2 ? 0.35 : -0.35); const dir = V(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)); const st = add(new THREE.ConeGeometry(1.2 * k, 3 * k, 5), hm, inner, dir.x * hw * 0.68 * k, hT * k + dir.y * hw * 0.68 * k, dir.z * hw * 0.68 * k); st.quaternion.setFromUnitVectors(V(0, 1, 0), dir); }
      }
      if (p.trim) add(tube(ellipse(V(0, (hT - hw * 0.8) * k, 0), V(1, 0, 0), V(0, 0, 1), hw * 0.4 * k, hw * 0.4 * k, 16), 0.6 * k, { closed: true, n: 5 }), mat(p.trim), inner);
      if (p.spike) add(new THREE.ConeGeometry(1.3 * k, p.spike * 1.5 * k, 6), hm, inner, 0, (hT + hw * 0.85 + p.spike * 0.7) * k, 0);
      if (p.gem) gem(p.gem, 1.5 * k, inner, 0, hT * k, hw * 0.74 * k, p.trim || 'gold');
      tip.position.set(0, (hT + hw) * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'spear') {
      const hl = (p.headL || 17) * 1.1, hw = (p.headW || 5);
      const leaf = []; for (let i = 0; i <= 14; i++) { const t = i / 14, w = Math.sin(Math.pow(t, 0.7) * Math.PI) * hw * (1 - t * 0.35); leaf.push([w * k, t * hl * k]); } for (let i = 13; i > 0; i--) leaf.push([-leaf[i][0], leaf[i][1]]);
      add(wedge(leaf, 1.6 * k, x => lerp(1, 0.15, Math.abs(x) / (hw * k)), { bevel: 0.15 * k }), mat(p.head || 'steel'), inner, 0, hT * k, 0);
      add(lathe([[R * 1.1 * k, (hT - 8) * k], [R * 1.5 * k, (hT - 6) * k], [R * 1.2 * k, (hT - 1) * k], [0.6 * k, (hT + 1) * k]], { n: 12 }), mat(p.socket || p.head || 'iron'), inner);
      if (p.wings) for (const s of [-1, 1]) add(wedge([[0, -1 * k], [s * p.wings * 1.4 * k, 0.5 * k], [0, 1.4 * k]], 0.9 * k), mat(p.head || 'steel'), inner, 0, (hT - 3) * k, 0);
      if (p.fuller) { const f = add(tube([V(0, (hT + 1.5) * k, 0.72 * k), V(0, (hT + hl * 0.6) * k, 0.62 * k)], [0.5 * k, 0.15 * k], { n: 5, up: V(1, 0, 0) }), mat(p.fuller), inner); glow(f, p.fuller, 0.8); }
      if (p.ribbon) add(tube(curve([V(0, (hT - 7) * k, 0), V(1.5 * k, (hT - 12) * k, 1 * k), V(0.5 * k, (hT - 20) * k, 2 * k)]), [1.6 * k, 0.12 * k], { n: 6, up: V(0, 0, 1) }), mat(p.ribbon, { side: true }), inner);
      if (p.gem) gem(p.gem, 1.3 * k, inner, 0, (hT - 4) * k, R * 1.5 * k, p.socket || 'gold');
      tip.position.set(0, (hT + hl) * k, 0);
      hold = 30;
    } else { // staff
      const top = new THREE.Group(); top.position.y = hT * k; inner.add(top);
      const metal = mat(p.metal || p.bandMat || 'bronze'), st = p.style, wood = mat(p.haft || 'wood');
      if (st === 'crook' || st === 'crozier') { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, a = t * Math.PI * 1.55; pts.push(V(-(1 - Math.cos(a)) * 5.5 * k * (1 - t * 0.25), Math.sin(a) * 6 * k + t * 2 * k, 0)); } add(tube(pts, t => R * k * (1 - t * 0.45), { n: 10 }), st === 'crozier' ? metal : wood, top); if (st === 'crozier') for (let i = 1; i < 5; i++) add(new THREE.ConeGeometry(0.8 * k, 2.2 * k, 5), metal, top, pts[i * 4].x * 1.12, pts[i * 4].y + 1 * k, 0); }
      else if (st === 'gnarl' || st === 'song' || st === 'rings' && p.leaves) { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; add(tube(curve([V(0, -1 * k, 0), V(Math.cos(a) * 3.5 * k, 3 * k, Math.sin(a) * 3.5 * k), V(Math.cos(a + 0.8) * 3.8 * k, 7 * k, Math.sin(a + 0.8) * 3.8 * k), V(Math.cos(a + 1.4) * 1.5 * k, 9.5 * k, Math.sin(a + 1.4) * 1.5 * k)], 14), t => R * 0.75 * k * (1 - t * 0.6), { n: 8 }), wood, top); } }
      else { for (let i = 0; i < 3; i++) { const rr = (p.ringR || 7) * (1 - i * 0.22) * 0.75; const t = add(tube(ellipse(V(0, (4 + i * 0.6) * k, 0), V(1, 0, 0), V(0, 1, 0), rr * k, rr * k, 32), 0.55 * k, { closed: true, n: 6 }), metal, top); t.rotation.y = i * 1.05; } }
      const orbKey = p.orb || p.crystal || p.gem || (p.glow ? p.glow : null);
      if (orbKey) {
        const crystal = p.crystal && !p.orb;
        const om = mat(orbKey);
        const o = add(crystal ? new THREE.OctahedronGeometry(3.2 * k, 0) : new THREE.IcosahedronGeometry(3.1 * k, 3), om, top, 0, 4.5 * k, 0);
        if (crystal) o.scale.set(0.75, 1.6, 0.75);
        const gk = isEmit(orbKey) ? orbKey : p.glow;
        if (gk) { glow(o, gk, 1.2); const core = add(new THREE.SphereGeometry(1.4 * k, 12, 8), mat(gk), top, 0, 4.5 * k, 0); glow(core, gk, 1.4); }
      }
      if (p.leaves) for (let i = 0; i < 7; i++) { const lf = add(wedge([[0, 0], [1.2 * k, 1.8 * k], [0, 4.2 * k], [-1.2 * k, 1.8 * k]], 0.3 * k), mat(p.leaves, { side: true }), top, Math.sin(i * 1.3) * 2.6 * k, -1.5 * k - (i % 3) * 1.4 * k, Math.cos(i * 1.3) * 2.6 * k); lf.rotation.set(0.6, i * 0.9, Math.sin(i) * 0.9); }
      tip.position.set(0, (hT + 8) * k, 0);
      hold = p.headT ? p.headT * 0.55 : 34;
    }
  }
  inner.position.y = -hold * k;
  inner.add(tip); g.userData.tip = tip;
  if (glowKey) g.userData.glow = glowColor(glowKey);
  return g;
}

/* ------------------------------------------------------------------ shields, tomes, lanterns, orbs */
const HER = new Map();
function heraldry(face, paint, paint2, shape) {
  const key = [face, paint, paint2, shape].join('|'); if (HER.has(key)) return HER.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const P = (MAT[face] || MAT.wood).pal, Q = (MAT[paint2] || MAT.paintRed || MAT.robeRed).pal, rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  g.fillStyle = rgb(P[3]); g.fillRect(0, 0, 256, 256);
  if (KIND(face) === 'wood') { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; g.fillRect(i * 43, 0, 43, 256); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 43, 0, 2, 256); } }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 1 + Math.random() * 3); }
  g.fillStyle = rgb(Q[3]);
  if (paint === 'chevron') { g.beginPath(); g.moveTo(0, 150); g.lineTo(128, 70); g.lineTo(256, 150); g.lineTo(256, 200); g.lineTo(128, 120); g.lineTo(0, 200); g.fill(); }
  else if (paint === 'quarter') { g.fillRect(0, 128, 128, 128); g.fillRect(128, 0, 128, 128); }
  else if (paint === 'thorn') { g.strokeStyle = rgb(Q[3]); g.lineWidth = 9; g.beginPath(); g.arc(128, 128, 80, 0, TAU); g.stroke(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80); g.lineTo(128 + Math.cos(a + 0.12) * 100, 128 + Math.sin(a + 0.12) * 100); g.lineTo(128 + Math.cos(a + 0.2) * 80, 128 + Math.sin(a + 0.2) * 80); g.fill(); } }
  // worn edges
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 180); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: KIND(face) === 'metal' ? 0.35 : 0.75, metalness: KIND(face) === 'metal' ? 0.85 : 0 });
  HER.set(key, m); return m;
}
function buildOffhand(O, art, fx, u) {
  const p = art?.p || {}, k = 0.36 * u / 40 * 1.55;
  const g = new THREE.Group();
  const look = O.look === 'sigil' && p.style === 'lantern' ? 'lantern' : O.look;
  if (look === 'buckler' || look === 'round' || look === 'heater' || look === 'tower') {
    const sh = new THREE.Group(); g.add(sh); sh.position.set(0.05 * u, 0, 0.03 * u); sh.rotation.y = Math.PI / 2 - 0.3; // its face looks outward and a little forward
    let outline;
    if (look === 'buckler' || look === 'round') { const R = (look === 'buckler' ? 13 : 19) * k; outline = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; outline.push([Math.cos(a) * R, Math.sin(a) * R]); } }
    else if (look === 'heater') { const w = 17 * k, h = 24 * k; outline = []; for (let i = 0; i <= 16; i++) { const t = i / 16; outline.push([lerp(w, 0, t * t) * (1 - t * 0.05), lerp(h * 0.45, -h * 0.7, Math.sin(t * Math.PI / 2))]); } for (let i = 15; i > 0; i--) outline.push([-outline[i][0], outline[i][1]]); outline.push([-w, h * 0.45]); outline.unshift([w, h * 0.45]); }
    else { const w = 15 * k, h = 32 * k; outline = [[-w, h * 0.5], [w, h * 0.5]]; for (let i = 0; i <= 12; i++) { const a = lerp(0, Math.PI, i / 12); outline.push([Math.cos(a) * w * 1.0 * (i === 0 ? 1 : 1), -h * 0.38 - Math.sin(a) * h * 0.14]); } outline.splice(2, 0); }
    const bulge = (x, y) => -((x * x) + (y * y)) * (look === 'tower' ? 0.4 : 0.8) / (k * 40);
    const front = plate(outline, (x, y) => 2.5 * k + bulge(x, y));
    add(front, heraldry(O.face || 'wood', O.paint, O.paint2, look), sh);
    const back = plate(outline, (x, y) => -0.5 * k + bulge(x, y)); back.scale(1, 1, 1);
    const bk = add(back, mat('leatherDark', { side: true }), sh);
    const rim = front.userData.rim.map(([x, y]) => V(x, y, bulge(x, y) + 1.2 * k));
    add(tube(rim, 1.3 * k, { closed: true, n: 8 }), mat(O.rim || 'iron'), sh);
    for (let i = 0; i < rim.length; i += 4) add(new THREE.SphereGeometry(0.7 * k, 6, 4), mat(O.rim || 'iron'), sh, rim[i].x * 0.9, rim[i].y * 0.9, rim[i].z + 1.6 * k);
    if (O.boss) { add(lathe([[0, 4.6 * k], [2.6 * k, 4.1 * k], [4.2 * k, 2.8 * k], [5 * k, 2.5 * k], [5.6 * k, 2.4 * k]], { n: 24 }), mat(O.boss), sh).rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(new THREE.SphereGeometry(0.55 * k, 6, 4), mat(O.boss), sh, Math.cos(a) * 5 * k, Math.sin(a) * 5 * k, 2.8 * k); } }
    if (O.gem) gem(O.gem, 1.8 * k, sh, 0, 0, O.boss ? 4.8 * k : 3 * k, O.boss || 'gold');
  } else if (look === 'tome') {
    const b = new THREE.Group(); b.position.set(0.04 * u, 0, 0.05 * u); b.rotation.set(0.2, 0.6, 0); g.add(b);
    add(new THREE.BoxGeometry(12 * k, 16 * k, 1 * k), mat(O.cover || 'leather'), b, 0, 0, 2.6 * k); add(new THREE.BoxGeometry(12 * k, 16 * k, 1 * k), mat(O.cover || 'leather'), b, 0, 0, -2.6 * k);
    add(new THREE.BoxGeometry(11.2 * k, 15.2 * k, 4.4 * k), mat('parchment'), b, 0.5 * k, 0, 0);
    add(tube([V(-6 * k, -8 * k, 0), V(-6 * k, 8 * k, 0)], 3 * k, { n: 10 }), mat(O.cover || 'leather'), b);
    for (const [x, y] of [[5, 7], [5, -7]]) add(new THREE.BoxGeometry(2.5 * k, 2.5 * k, 6.4 * k), mat(O.metal || 'gold'), b, x * k, y * k, 0);
    if (O.gem) gem(O.gem, 1.8 * k, b, 0, 0, 3.4 * k, O.metal || 'gold');
    if (O.glow) fx.glows.push({ obj: b.children[2], color: glowColor(O.glow), power: 0.6 });
  } else if (look === 'lantern') {
    const l = new THREE.Group(); l.position.set(0.03 * u, -0.06 * u, 0.04 * u); g.add(l);
    const m = mat(O.metal || 'iron');
    add(tube(ellipse(V(0, 9 * k, 0), V(1, 0, 0), V(0, 1, 0), 2.6 * k, 2.6 * k, 16), 0.5 * k, { closed: true, n: 6 }), m, l);
    add(lathe([[0.5 * k, 6.5 * k], [4.5 * k, 4.5 * k], [5 * k, 3.6 * k], [4.2 * k, 3.4 * k]], { n: 6 }), m, l);
    add(lathe([[4.2 * k, -4.6 * k], [5 * k, -5 * k], [4.6 * k, -6 * k], [0, -6.5 * k]], { n: 6 }), m, l);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; add(tube([V(Math.cos(a) * 4.3 * k, -4.8 * k, Math.sin(a) * 4.3 * k), V(Math.cos(a) * 4.3 * k, 3.6 * k, Math.sin(a) * 4.3 * k)], 0.45 * k, { n: 5 }), m, l); }
    const core = add(new THREE.IcosahedronGeometry(2.4 * k, 2), mat(O.glow || 'ember'), l, 0, -0.5 * k, 0);
    add(new THREE.CylinderGeometry(4.1 * k, 4.1 * k, 8.2 * k, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xfff2d0, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide }), l, 0, -0.6 * k, 0);
    fx.glows.push({ obj: core, color: glowColor(O.glow || 'ember'), power: 1.4 });
  } else {
    const f = new THREE.Group(); f.position.set(0.03 * u, 0.05 * u, 0.1 * u); g.add(f); g.userData.float = f;
    if (look === 'orb') { const om = mat(O.gem || O.glow || 'sapphire'); add(new THREE.IcosahedronGeometry(4 * k, 3), om, f); if (O.glow) { const c = add(new THREE.SphereGeometry(2 * k, 12, 8), mat(O.glow), f); fx.glows.push({ obj: c, color: glowColor(O.glow), power: 1.3 }); } for (let i = 0; i < 2; i++) add(tube(ellipse(V(), V(1, 0, 0), V(0, 0, 1), 5 * k, 5 * k, 32), 0.4 * k, { closed: true, n: 6 }), mat(O.metal || 'silver'), f).rotation.set(0.4 + i * 1.2, i, 0); }
    else { for (let i = 0; i < (look === 'rings' ? 3 : 2); i++) add(tube(ellipse(V(), V(1, 0, 0), V(0, 1, 0), (5 - i * 1.2) * k, (5 - i * 1.2) * k, 32), 0.5 * k, { closed: true, n: 6 }), mat(O.metal || 'gold'), f).rotation.set(i * 0.9, i * 0.6, 0); if (O.gem) gem(O.gem, 1.6 * k, f, 0, 0, 0, null); if (O.glow) { const c = add(new THREE.SphereGeometry(1.4 * k, 10, 8), mat(O.glow), f); fx.glows.push({ obj: c, color: glowColor(O.glow), power: 1 }); } }
  }
  return g;
}

/* ------------------------------------------------------------------ poses */
// idle: the weapon held ready; strike (0..1): a move that suits the weapon's class
export function setPose(rig, pose, t, u = 0) {
  const R = rig.armR, Lf = rig.armL, cls = rig.cls;
  const breathe = Math.sin(t * 2.1);
  rig.root.position.set(0, 0, 0); rig.root.rotation.set(0, 0, 0);
  rig.chest.scale.set(1 + breathe * 0.01, 1 + breathe * 0.006, 1 + breathe * 0.012);
  rig.head.rotation.set(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.45) * 0.16, 0);
  if (rig.cape) rig.cape.rotation.x = 0.06 + Math.sin(t * 1.6) * 0.04 + (pose === 'strike' ? Math.sin(u * Math.PI) * 0.3 : 0);
  if (rig.skirt) rig.skirt.rotation.z = Math.sin(t * 1.3) * 0.012;
  const pole = cls === 'spear' || cls === 'staff';
  // rest: upper arms a little out, forearms forward, the weapon upright in the fist
  R.sh.rotation.set(pole ? -0.12 : -0.28, 0, -0.16);
  R.elbow.rotation.set(pole ? -0.55 : -1.15, 0, 0);
  R.hand.rotation.set(pole ? -0.88 : 0.12, 0, 0);
  Lf.sh.rotation.set(-0.25, 0, 0.2);
  Lf.elbow.rotation.set(-1.0, 0, 0);
  Lf.hand.rotation.set(0.3, 0, 0);
  if (cls === 'bow') { Lf.sh.rotation.set(-0.5, 0, 0.3); Lf.elbow.rotation.set(-0.7, 0, 0); Lf.hand.rotation.set(-0.35, 0, 0); R.sh.rotation.set(-0.12, 0, -0.12); R.elbow.rotation.set(-0.4, 0, 0); }
  if (rig.weapon) rig.weapon.rotation.set(0, 0, 0);
  for (const leg of rig.legs) leg.rotation.set(0, 0, 0);
  rig.legs[0].rotation.z = -0.03; rig.legs[1].rotation.z = 0.03;
  R.sh.rotation.x += Math.sin(t * 2.1 + 1) * 0.025;
  Lf.sh.rotation.x += Math.sin(t * 2.1) * 0.025;
  if (rig.offhand?.userData.float) { rig.offhand.userData.float.position.y = 0.05 + Math.sin(t * 2.4) * 0.012; rig.offhand.userData.float.rotation.y = t * 0.8; }
  if (pose !== 'strike') return;
  const ease = x => x * x * (3 - 2 * x);
  if (cls === 'spear') { const a = u < 0.4 ? -ease(u / 0.4) : ease(Math.min(1, (u - 0.4) / 0.2)) * (1 - Math.max(0, (u - 0.6) / 0.4)); R.sh.rotation.x += -1.1 * Math.max(0, a); R.elbow.rotation.x += 0.45 * a; rig.weapon.rotation.x = -1.3 * Math.max(0, a) + 0.25 * Math.min(0, a); rig.root.position.z = 0.08 * Math.max(0, a); }
  else if (cls === 'staff') { const a = Math.sin(u * Math.PI); R.sh.rotation.x += -1.5 * a; R.elbow.rotation.x += 0.6 * a; Lf.sh.rotation.x += -1.0 * a; rig.root.position.y = 0.03 * a; }
  else if (cls === 'bow') { const a = Math.min(1, u / 0.45), rel = u > 0.55; Lf.sh.rotation.set(-1.45, 0, 0.15); Lf.elbow.rotation.set(-0.1, 0, 0); Lf.hand.rotation.set(0.0, 0, 0); R.sh.rotation.set(-1.45, 0, -0.1 + (rel ? 0 : -0.25 * a)); R.elbow.rotation.set(rel ? -0.4 : -1.9 * a, 0, 0); }
  else {
    const wind = u < 0.32 ? ease(u / 0.32) : 0, cut = u >= 0.32 ? ease(Math.min(1, (u - 0.32) / 0.22)) : 0, back = u > 0.6 ? ease((u - 0.6) / 0.4) : 0, k = 1 - back;
    R.sh.rotation.x = -0.28 + (cut > 0 ? -2.3 + 3.0 * cut : -2.3 * wind) * k;
    R.sh.rotation.z = -0.16 - 0.35 * wind * k + 0.25 * cut * k;
    R.elbow.rotation.x = -1.15 + 0.8 * wind * (1 - cut) * k;
    R.hand.rotation.x = 0.12 + 0.5 * cut * k;
    rig.root.rotation.y = (0.35 * wind * (1 - cut) - 0.45 * cut) * k;
    rig.root.position.z = 0.05 * cut * k;
  }
}
