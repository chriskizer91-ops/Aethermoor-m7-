// The 3D hero, built from the same data the game's pixel heroes are drawn from, now with real modelling: a sculpted
// body with gripping hands, a painted face, hair in locks, and every piece of gear made from the game's own numbers
// with the kit in kit.js (faceted blades with bevels and fullers, wire-wound grips, curved guards, lathed helms,
// shaped shields with painted heraldry, armour that follows the body).
//   - who the hero is: art/hero-looks.js HERO_ART (skin, hair and its style, eyes, cloak, mantle, tabard, quiver...)
//   - what they wear: art/item-looks.js itemArt() and lookFor(), the same "looks" the battle sprite and walker draw
//   - every colour: the Forge's six-step palettes, art/forge.js MAT
//   - proportions: 'hero' (a taller, storybook hero) or 'chibi' (a big head and short legs, halfway to the sprite)
// buildHero(heroKey, gear, { build: 'hero' | 'chibi' }) -> { group, rig, fx, looks }
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';
import { HERO_ART } from '../../game/src/art/hero-looks.js';
import { itemArt, lookFor, RARITY_LOOK, ASPECT_LOOK, SLOTS, rarityTier } from '../../game/src/art/item-looks.js';
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, wedge, plate, blade, mat, glowColor, isEmit, sRGB, KIND, Q, sph, tor, cone, ico, bake, etchMaterial, stitchGeo, add, gem, rngOf, ring, FACES, TEXTURES } from './kit.js';
import { buildWeapon, buildOffhand } from './weapons.js';

export { glowColor };
const TAU = Math.PI * 2;
const SHOWN_H = 1.22; // every hero is scaled to stand this tall on the plinth

/* ------------------------------------------------------------------ proportions */
function specOf(H, style) {
  const youth = H.build === 'youth';
  if (style === 'chibi') {
    // halfway between the storybook hero and the sprite: a big head (about a quarter of the height), short sturdy
    // legs, a compact body, hands and feet a little big
    const s = youth ? 0.92 : 1, hr = (youth ? 0.17 : 0.163);
    const neck = 1.02 * s, sh = 1.0 * s;
    return {
      unit: 1, headR: hr, headY: neck + hr * 1.02, neckY: neck - 0.02 * s, neckR: 0.062 * s,
      shY: sh, shX: 0.165 * s,
      keys: [[0.5 * s, 0.15 * s, 0.74], [0.58 * s, 0.158 * s, 0.72], [0.68 * s, 0.14 * s, 0.74], [0.84 * s, 0.158 * s, 0.7], [0.96 * s, 0.172 * s, 0.62], [1.01 * s, 0.11 * s, 0.72], [1.03 * s, 0.064 * s, 1]],
      waistY: 0.68 * s, hipY: 0.58 * s, hemY: 0.42 * s, hipX: 0.085 * s, legTop: 0.56 * s, ankleY: 0.075 * s, bootY: 0.25 * s,
      upper: 0.2 * s, fore: 0.18 * s, armR: 0.052 * s, legR: 0.088 * s, hand: 1.12, foot: 1.12, total: neck + hr * 2.05,
      chibi: true,
    };
  }
  const dwarf = H.build === 'dwarf', s = youth ? 0.86 : dwarf ? 0.8 : 1, hr = youth ? 0.118 : dwarf ? 0.116 : 0.112;
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
function faceTexture(H, skinKey, hairKey, { blind = false, big = false } = {}) {
  const R = Q.d > 1 ? 2 : 1, c = document.createElement('canvas'); c.width = 1024 * R; c.height = 512 * R;
  const g = c.getContext('2d'); g.scale(R, R);
  const P = (MAT[skinKey] || MAT.skin).pal, Hp = (MAT[hairKey] || MAT.hairBrown).pal;
  const rgb = (a, k = 1) => `rgb(${a[0] * k | 0},${a[1] * k | 0},${a[2] * k | 0})`;
  g.fillStyle = rgb(P[3].map((v, i) => v + (P[4][i] - v) * 0.35)); g.fillRect(0, 0, 1024, 512);
  const cx = 256, ey = 268;
  // the features drawn 1.45x their old size, so a face reads from across a fight (November 20); the chibi build keeps
  // its own big eyes
  const FEAT = big ? 1 : 1.45; g.save(); g.translate(cx, ey + 30); g.scale(FEAT, FEAT); g.translate(-cx, -(ey + 30));
  // a shadowed face (under a hood, a curse): the skin darkened toward the brow
  if (H.shade) { const sh = g.createLinearGradient(0, ey - 120, 0, ey + 120); sh.addColorStop(0, 'rgba(8,6,10,.92)'); sh.addColorStop(0.55, 'rgba(8,6,10,.75)'); sh.addColorStop(1, 'rgba(8,6,10,.35)'); g.fillStyle = sh; g.fillRect(cx - 200, ey - 200, 400, 400); }
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
  // stubble on the jaw and lip
  if (H.stubble || H.beard) { g.fillStyle = 'rgba(30,22,18,.28)'; for (let i = 0; i < 420; i++) { const a = (i * 2.399) % TAU, rr = 40 + (i * 37 % 60); const x = cx + Math.cos(a) * rr * 1.2, y = ey + 78 + Math.sin(a) * rr * 0.55; if (y > ey + 48) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } } }
  // face paint: stripes under the eyes
  if (H.marks && H.marks !== 'bark') { const Mp = (MAT[H.marks] || MAT.moss).pal; g.strokeStyle = rgb(Mp[3]); g.lineWidth = 6; for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx + s * 34, ey + 26 + k * 12); g.lineTo(cx + s * 72, ey + 22 + k * 12); g.stroke(); } }
  // eyes
  if (!blind && !H.shade) for (const s of [-1, 1]) {
    const x = cx + s * (big ? 50 : 52), y = ey + (big ? 6 : 0);
    g.save(); if (big) { g.translate(x, y); g.scale(1.3, 1.38); g.translate(-x, -y); }
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
    if (!(H.build === 'brute' || H.build === 'dwarf' || H.stubble)) { g.lineWidth = 3; g.beginPath(); g.moveTo(x + s * 20, y - 7); g.lineTo(x + s * 28, y - 11); g.stroke(); }
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(30,16,20,.6)'; g.beginPath(); g.ellipse(x, y, 20, 14, 0, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    g.strokeStyle = rgb(P[2]); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - 6, 22, 14, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.restore();
  }
  // brows: a hard man's sit low and slope in (a scowl)
  const scowl = H.build === 'brute' || H.build === 'dwarf' || H.stubble ? 1 : 0;
  g.strokeStyle = rgb(Hp[2]); g.lineWidth = 7 + scowl * 2;
  if (!H.shade) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 28, ey - 34 + scowl * 10); g.quadraticCurveTo(cx + s * 52, ey - 44 + scowl * 2, cx + s * 74, ey - 34 - scowl * 4); g.stroke(); }
  g.restore();
  if (blind) { const Bp = (MAT[H.blindfold] || MAT.clothWhite).pal; g.fillStyle = rgb(Bp[4]); g.fillRect(0, ey - 26, 1024, 50); g.fillStyle = rgb(Bp[3]); g.fillRect(0, ey + 18, 1024, 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}


/* ------------------------------------------------------------------ Chris's painted faces (November 20) */
// The four heroes wear the faces Chris painted (art-in/3d/gear/face-*.webp, web copies in textures/pack.js). Each is
// laid on the front of the head like a mask, straight on (each point of the head takes the picture's colour at the
// point in front of it), and fades into the plain skin round it, which Chris painted to fill the square.
// FACE_FIT: k is how much wider than the head the picture is, y0 how far below the middle of the head its centre sits.
export const HERO_FACE = { warden: 'wren', pip: 'pip', bryn: 'bryn', alondra: 'alondra' };
export const FACE_FIT = { k: 1.42, y0: -0.2 };
const FACE_IMG = {};
function faceImage(name) {
  if (FACE_IMG[name]) return FACE_IMG[name];
  const img = new Image(); img.src = FACES[name].url;
  const rec = { img, px: null, waiting: [] };
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); rec.px = g.getImageData(0, 0, c.width, c.height); for (const f of rec.waiting.splice(0)) f(); };
  return (FACE_IMG[name] = rec);
}
function paintedFace(name) {
  const R = Q.d > 1 ? 2 : 1, W = 1024 * R, Hh = 512 * R, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'), skin = FACES[name].skin;
  g.fillStyle = `rgb(${skin[0]},${skin[1]},${skin[2]})`; g.fillRect(0, 0, W, Hh);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const rec = faceImage(name);
  const draw = () => {
    const P = rec.px, pw = P.width, ph = P.height, src = P.data, img = g.getImageData(0, 0, W, Hh), d = img.data, { k, y0 } = FACE_FIT;
    // only the front half of the head (u from 0 to 0.5 on the sphere) can see the picture
    for (let py = 0; py < Hh; py++) {
      const th = (py + 0.5) / Hh * Math.PI, st = Math.sin(th), y = Math.cos(th);
      for (let px = 0; px < W / 2; px++) {
        const ph2 = (px + 0.5) / W * TAU, x = -Math.cos(ph2) * st, z = Math.sin(ph2) * st;
        if (z <= 0.05) continue;
        const X = 0.5 + x / (2 * k), Y = 0.5 - (y - y0) / (2 * k);
        if (X < 0 || X >= 1 || Y < 0 || Y >= 1) continue;
        const edge = Math.min(X, 1 - X, Y, 1 - Y), w = smooth((z - 0.05) / 0.4) * smooth(edge / 0.06);
        if (w <= 0) continue;
        const si = ((Y * ph | 0) * pw + (X * pw | 0)) * 4, di = (py * W + px) * 4;
        for (let ch = 0; ch < 3; ch++) d[di + ch] = d[di + ch] + (src[si + ch] - d[di + ch]) * w;
      }
    }
    g.putImageData(img, 0, 0); t.needsUpdate = true;
  };
  if (rec.px) draw(); else rec.waiting.push(draw);
  return t;
}

/* ------------------------------------------------------------------ small helpers */
const strHash = str => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/* ------------------------------------------------------------------ the hero */
export function buildHero(heroKey, gear, o = {}) {
  // o.H: anyone's identity (a foe's, art/foes.js foeLooks); o.looks: gear already turned into looks (foeLooks gives these)
  const A = HERO_ART[heroKey] || HERO_ART.warden, H = o.H || A.H;
  const S = specOf(H, o.build || 'hero'); S.unit = S.total / 1.72; const u = S.unit, uw = S.chibi ? 0.95 : u; // u: sizes of small details scale with the build
  if (H.build === 'brute' || H.build === 'dwarf') { S.keys = S.keys.map(([y, w, d]) => [y, w * 1.16, d]); S.shX *= 1.14; S.armR *= 1.2; S.legR *= 1.12; S.neckR *= 1.2; }
  const L = {}, arts = {};
  if (o.looks) for (const s of SLOTS) { const l = o.looks[s]; if (l && typeof l === 'object') { L[s] = l; arts[s] = { p: l.p || l, r: l.r }; } }
  else for (const s of SLOTS) { const a = gear[s] ? itemArt(gear[s]) : null; arts[s] = a; const l = a ? lookFor(s, a) : null; if (l) L[s] = l; }
  const group = new THREE.Group(), root = new THREE.Group(); group.add(root);
  const rig = { root, S }, fx = { glows: [], aura: null, flame: false };
  const body = L.body, kind = body?.kind, robe = kind === 'robe';
  // a hero with a face Chris painted: the skin everywhere takes that picture's skin, so the neck and hands match it
  const faceName = !o.H && TEXTURES.on ? HERO_FACE[heroKey] : null, skinTint = faceName ? FACES[faceName].skin : null;
  const skinM = mat(H.skin, { tint: skinTint }), tunicKey = H.tunic || 'wool';

  /* ---- legs, trousers, boots */
  rig.legs = [];
  const F = L.feet;
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * S.hipX, S.legTop, 0); root.add(leg); rig.legs.push(leg);
    const ank = S.ankleY - S.legTop, kneeY = ank * 0.52;
    const R = S.legR;
    const legPath = [V(0, 0.02 * u, 0), V(0, kneeY * 0.5, 0.004 * u), V(0, kneeY, 0.008 * u), V(0, (kneeY + ank) * 0.5, 0), V(0, ank, -0.004 * u)];
    const legRad = t => { const thigh = lerp(R * 1.05, R * 0.68, smooth(t / 0.5)), calf = t > 0.5 ? R * 0.68 + Math.sin(clamp01((t - 0.55) / 0.45) * Math.PI) * R * 0.12 - smooth((t - 0.75) / 0.25) * R * 0.22 : thigh; return [calf, calf * 0.95]; };
    add(tube(curve(legPath, 16), legRad, { n: 14, capA: false }), mat(robe ? body.mat : H.pants || 'pants'), leg);
    // the boot: a shaft up the calf and a foot with a heel, toe and sole
    const bootKey = F ? F.mat : H.boots || (robe ? 'leather' : 'leatherDark'), bm = mat(bootKey);
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
  const torsoMat = body ? mat(body.mat, { as: kind === 'mail' ? (body.scale ? 'scale' : 'mail') : null, ...(kind === 'leather' && TEXTURES.on ? { tex: body.studs ? 'mail-brigandine' : 'leather-stitched' } : {}) }) : null;
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
    if (body.studs) for (let r = 0; r < 4; r++) for (let c = -2; c <= 2; c++) { if (!c) continue; const y = lerp(S.waistY + 0.05 * u, S.shY - 0.08 * u, r / 3), [w, d] = torsoAt(S, y), x = c * w * 0.28, z = Math.sqrt(Math.max(0, 1 - (x / (w + 0.01)) ** 2)) * (w * d + 0.01 * u); add(sph(0.0055 * u, 8, 6), mat(body.studs), chest, x, y, z); }
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
    if (!robe) { const bkl = new THREE.Group(); bkl.position.set(0, by, w * d + 0.024 * u); chest.add(bkl); add(tube(ellipse(V(), V(1, 0, 0), V(0, 1, 0), 0.022 * u, 0.02 * u, 16), 0.0045 * u, { closed: true, n: 6 }), mat(H.buckle || 'bronze'), bkl); add(new THREE.BoxGeometry(0.004 * u, 0.034 * u, 0.006 * u), mat(H.buckle || 'bronze'), bkl); }
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
    add(tube(pts, t => [0.0035 * u, lerp(0.06, 0.078, t) * u * 1], { n: 8, up: V(0, 0, 1) }), mat(H.tabard, { side: true }), chest);
  }

  /* ---- arms and hands */
  const sleeveKey = body ? (body.sleeve || (robe ? body.mat : body.shirt || tunicKey)) : tunicKey;
  const gloves = L.hands, gloveKey = gloves ? gloves.mat : H.gloves || H.skin, bareTint = !gloves && KIND(gloveKey) === 'skin' ? skinTint : null;
  rig.arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * S.shX, S.shY, 0); root.add(sh);
    const ar = S.armR;
    const up = [V(0, 0.02 * u, 0), V(0, -S.upper * 0.5, 0.004 * u), V(0, -S.upper, 0)];
    add(tube(curve(up, 10), t => [lerp(ar * 1.25, ar * 0.85, t) + Math.sin(t * Math.PI) * ar * 0.12, lerp(ar * 1.2, ar * 0.85, t)], { n: 12 }), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh);
    add(sph(ar * 1.35, 16, 12), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh, -side * ar * 0.25, 0.01 * u, 0).scale.set(1, 1.05, 0.95);
    const elbow = new THREE.Group(); elbow.position.y = -S.upper; sh.add(elbow);
    const fore = [V(0, 0, 0), V(0, -S.fore * 0.5, 0.003 * u), V(0, -S.fore, 0)];
    const foreRad = t => { const r = lerp(ar * 0.9, ar * 0.62, t) + Math.sin(clamp01(t / 0.6) * Math.PI) * ar * 0.1; return [r, r * 0.88]; };
    add(tube(curve(fore, 10), foreRad, { n: 12 }), mat(robe ? body.mat : sleeveKey), elbow);
    if (robe) add(tube([V(0, -S.fore * 0.25, 0), V(0, -S.fore * 0.8, 0.01 * u), V(0, -S.fore * 1.05, 0.02 * u)], t => [lerp(ar * 1.1, ar * 1.7, t * t), lerp(ar * 1.1, ar * 1.6, t * t)], { n: 16, capA: false, capB: false }), mat(body.mat, { side: true }), elbow);
    if (kind === 'plate') { add(tube([V(0, -S.fore * 0.15, 0), V(0, -S.fore * 0.9, 0)], t => [lerp(ar * 1.05, ar * 0.8, t), lerp(ar * 1.0, ar * 0.76, t)], { n: 12 }), torsoMat, elbow); add(sph(ar * 0.95, 12, 8), torsoMat, elbow); }
    const hand = new THREE.Group(); hand.position.y = -S.fore; elbow.add(hand);
    const grip = buildHand(hand, side, mat(gloveKey, { tint: bareTint }), gloves, u * S.hand, fx, gripRadius(L, side, uw));
    // pauldrons: three lames over the shoulder
    const pk = body?.pauldrons || (kind === 'plate' ? body.mat : null);
    if (pk) for (let k = 0; k < 3; k++) { const r = ar * (2.0 - k * 0.22); const p = add(sph(r, 18, 10, 0, TAU, 0, Math.PI * 0.42), mat(pk, { side: true }), sh, side * 0.006 * u, 0.025 * u - k * 0.03 * u, 0); p.rotation.z = -side * (0.35 + k * 0.12); p.scale.set(1.1, 0.75, 1); if (body?.trim && k === 0) add(tube(ellipse(V(0, Math.cos(Math.PI * 0.42) * r, 0), V(1, 0, 0), V(0, 0, 1), Math.sin(Math.PI * 0.42) * r, Math.sin(Math.PI * 0.42) * r, 24), 0.005 * u, { closed: true, n: 6 }), mat(body.trim), p); }
    rig.arms.push({ sh, elbow, hand, grip, side });
  }
  rig.armR = rig.arms[0]; rig.armL = rig.arms[1];

  /* ---- neck, head, face, hair */
  add(tube([V(0, S.neckY - 0.02 * u, 0), V(0, S.headY - S.headR * 0.55, 0.004 * u)], S.neckR, { n: 14 }), skinM, root);
  const head = new THREE.Group(); head.position.set(0, S.headY, 0.006 * u); root.add(head); rig.head = head;
  const r = S.headR;
  const blind = !!H.blindfold;
  const faceM = new THREE.MeshPhysicalMaterial({ roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: skinM.sheenColor });
  faceM.map = faceName ? paintedFace(faceName) : faceTexture(H, H.skin, H.hairMat, { blind, big: S.chibi });
  const skull = sph(r, 64, 40);
  { const p = skull.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const low = clamp01(-y / r); const k = 1 - low * low * 0.3 * (z > 0 ? 1 : 0.6); x *= k * 0.94; z *= (z > 0 ? 1 - low * 0.05 : 1.04); if (z > 0) z += low * low * r * 0.08 * (1 - Math.abs(x) / r); y *= 1.06; p.setXYZ(i, x, y, z); } skull.computeVertexNormals(); }
  add(skull, faceM, head);
  for (const s of [-1, 1]) {
    if (H.ears === 'long') { const e = add(tube(curve([V(s * r * 0.86, -r * 0.05, -r * 0.1), V(s * r * 1.2, r * 0.18, -r * 0.25), V(s * r * 1.45, r * 0.42, -r * 0.42)]), t => [lerp(r * 0.16, 0.001, t), lerp(r * 0.06, 0.001, t)], { n: 8 }), skinM, head); }
    else add(sph(r * 0.17, 10, 8), skinM, head, s * r * 0.9, -r * 0.08, -r * 0.08).scale.set(0.5, 1, 0.8);
  }
  // the cloth band round the head (with Chris's face it sits over the blindfold he painted, a little higher)
  if (blind) { const b0 = faceName ? 0.27 : 0.12, b1 = faceName ? -0.06 : -0.22; add(lathe([[r * 1.0, r * b0], [r * 1.03, r * b0], [r * 1.03, r * b1], [r * 1.0, r * b1]], { n: 40, sx: 0.96 }), mat(H.blindfold), head, 0, 0, 0.004 * u); }
  const HL = L.head, look = HL?.look;
  const wrap = !HL && (H.headwrap || H.turban);
  const covers = look === 'helm' || look === 'coif' || look === 'hood' || look === 'kettle' || !!wrap;
  buildHair(head, H, r, covers, wrap ? 'hood' : look, strHash(heroKey));
  if (H.beard) add(sph(r * 1.02, 24, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.4), mat(H.hairMat, { side: true }), head).rotation.y = Math.PI;
  if (HL) buildHeadgear(head, root, HL, arts.head, r, S, u, fx);
  buildFoeLooks({ H, rig, S, u, r, head, chest, root, look, wrap, kind, robe, fx, faceName, L });

  /* ---- the identity's cloth: mantle, cloak, quiver */
  if ((H.mantle || H.pelt) && look !== 'hood' && look !== 'coif') {
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.01 * u, S.shY - 0.085 * u, t); rings.push(torsoRing(S, y, (0.018 + t * 0.022) * u, 32, t * 0.05, 0)); }
    add(loft(rings), mat(H.mantle || H.pelt, { side: true }), chest);
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

  /* ---- High detail: stitches, rivets, straps and a pouch */
  if (Q.d > 1) {
    const thread = mat('string');
    const sew = (pts, step = 0.012 * u, r = 0.0013 * u, m = thread, parent = chest) => { const g = stitchGeo(pts, step, r); if (g) add(g, m, parent); };
    if (kind === 'leather') {
      for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const y = lerp(S.waistY, S.shY - 0.05 * u, i / 8), [w, d] = torsoAt(S, y); pts.push(V(sx * w * 0.36, y, Math.sqrt(1 - 0.36 ** 2) * w * d + 0.0125 * u)); } sew(pts); }
      sew(torsoRing(S, S.waistY - 0.015 * u, 0.013 * u, 40).concat([torsoRing(S, S.waistY - 0.015 * u, 0.013 * u, 40)[0]]));
    }
    if (kind === 'plate') for (let k2 = 0; k2 < 3; k2++) { const y = S.waistY - 0.04 * u - k2 * 0.045 * u; const rr = torsoRing(S, Math.max(y, S.keys[0][0]), (0.033 + k2 * 0.006) * u, 18, 0, k2 * 0.009 * u); for (const pnt of rr) add(sph(0.0035 * u, 6, 4), mat(body.trim || body.mat), skirt, pnt.x, y - 0.006 * u, pnt.z); }
    if (body && !robe) {
      // a pouch on the belt, with a flap and a buckle
      const by = S.waistY - 0.03 * u, [w, d] = torsoAt(S, by), px = -w * 0.72, pz = w * d * 0.62 + 0.03 * u;
      const pouch = new THREE.Group(); pouch.position.set(px, by, pz); pouch.rotation.y = -0.7; chest.add(pouch);
      const lm = mat(body.belt || 'leatherDark');
      add(tube([V(0, 0.01 * u, 0), V(0, -0.06 * u, 0)], t => [0.016 * u * (1 + Math.sin(t * Math.PI) * 0.15), 0.034 * u], { n: 12, up: V(0, 0, 1) }), lm, pouch);
      add(tube(curve([V(0, 0.012 * u, -0.012 * u), V(0, 0.016 * u, 0.012 * u), V(0, -0.02 * u, 0.019 * u)], 8), [0.0025 * u, 0.036 * u], { n: 6, up: V(0, 0, 1) }), lm, pouch);
      add(tor(0.006 * u, 0.0015 * u, 6, 12), mat('bronze'), pouch, 0, -0.02 * u, 0.021 * u);
    }
    // boot straps with buckles, and a stitched seam up the back of each boot
    for (const leg of rig.legs) {
      const top = S.bootY - S.legTop, ank = S.ankleY - S.legTop, br = S.legR * 0.92;
      for (const t of [0.3, 0.68]) { const y = lerp(ank, top, t), rr = br * (1.0 + (1 - t) * 0.06) + 0.004 * u; add(tube(ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), rr, rr * 0.97, 20), [0.0025 * u, 0.007 * u], { closed: true, n: 6, up: V(0, 1, 0) }), mat('leatherDark'), leg); const bk = new THREE.Group(); bk.position.set(rr * 0.75, y, rr * 0.66); bk.rotation.y = 0.85; leg.add(bk); add(tube(ellipse(V(), V(1, 0, 0), V(0, 1, 0), 0.008 * u, 0.007 * u, 12), 0.0016 * u, { closed: true, n: 5 }), mat(F?.trim && KIND(F.trim) === 'metal' ? F.trim : 'iron'), bk); }
      const seam = []; for (let i = 0; i <= 6; i++) seam.push(V(0, lerp(top - 0.01 * u, ank, i / 6), -(br + 0.002 * u))); sew(seam, 0.012 * u, 0.0012 * u, thread, leg);
    }
    // rivets round the pauldrons' lames
    if (body?.pauldrons || kind === 'plate') for (const a of rig.arms) for (let i = 0; i < 6; i++) { const t = i / 5, ang = lerp(-1.1, 1.1, t); add(sph(0.004 * u, 6, 4), mat(body.trim || body.pauldrons || body.mat), a.sh, a.side * (0.006 * u) + Math.sin(ang) * S.armR * 1.75, 0.012 * u, Math.cos(ang) * S.armR * 1.75); }
  }

  /* ---- the weapon and the offhand */
  const W = L.weapon; rig.cls = W?.cls || null;
  if (W) { const w = buildWeapon(W, arts.weapon, fx, uw); const arm = W.cls === 'bow' ? rig.armL : rig.armR; arm.grip.add(w); rig.weapon = w; }
  const O = L.offhand;
  if (O && W?.cls !== 'bow') { const oh = buildOffhand(O, arts.offhand, fx, uw); rig.armL.hand.add(oh); oh.position.set(0, -0.06 * u, 0); rig.offhand = oh; }

  /* ---- the outfit's best rarity, a Primal white flame, the weapon's motes */
  let best = null;
  for (const s of SLOTS) { const it = gear[s]; const rr = typeof it === 'object' && it?.rarity ? it.rarity : arts[s]?.relic ? 'heirloom' : null; if (rr && (!best || rarityTier(rr) > rarityTier(best))) best = rr; }
  fx.best = best;
  const RL = best ? RARITY_LOOK[best] : null;
  if (RL?.aura) fx.aura = new THREE.Color(RL.aura);
  fx.flame = !!RL?.flame || SLOTS.some(s => (gear[s]?.temper || 0) >= 10);
  fx.motes = W?.aspect ? ASPECT_LOOK[W.aspect]?.glow : null;

  // join every piece into the nodes that move, by material: a few dozen draws instead of a few hundred
  const keep = new Set([group, root, chest, skirt, head, ...rig.legs, ...rig.arms.flatMap(a => [a.sh, a.elbow, a.hand, a.grip])]);
  if (rig.cape) keep.add(rig.cape);
  if (rig.weapon) keep.add(rig.weapon);
  if (rig.offhand) { keep.add(rig.offhand); if (rig.offhand.userData.float) keep.add(rig.offhand.userData.float); }
  rig.draws = bake(group, keep);
  root.scale.setScalar(SHOWN_H / S.total);
  rig.scale = SHOWN_H / S.total;
  setPose(rig, 'idle', 0);
  return { group, rig, fx, looks: L };
}


/* ------------------------------------------------------------------ the foes' own looks (November 20) */
// The people foes (art/foes.js foeLooks) carry looks the heroes don't: a scarf, a mask, glowing eyes in a shadowed face,
// a head-wrap, antlers, an emblem, a bandolier of vials, a satchel, a sack, a ledger and coins, a lantern at the belt,
// bone charms, a feather, a held gift. Each is built here from its own material; a hero has none of them.
function buildFoeLooks({ H, rig, S, u, r, head, chest, root, look, wrap, kind, robe, fx, faceName, L }) {
  const front = (y, off = 0) => { const [w, d] = torsoAt(S, Math.max(y, S.keys[0][0])); return w * d + off; };
  const glow = (key, k = 1.8) => { const c = glowColor(key || 'ember'); return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k }); };
  const armour = kind === 'plate' ? 0.045 : kind === 'mail' ? 0.022 : 0.012;
  // a scarf or neckerchief round the neck, its end hanging at the front (or a long tail behind)
  const sc = H.scarf || H.neckerchief;
  if (sc) {
    const y = S.neckY - 0.005 * u, m = mat(sc, { side: true });
    add(tube(torsoRing(S, y, 0.03 * u, 24), 0.016 * u, { closed: true, n: 8 }), m, chest);
    if (H.neckerchief) add(wedge([[-0.05 * u, 0], [0.05 * u, 0], [0, -0.075 * u]], 0.004 * u), m, chest, 0, y - 0.01 * u, front(y, 0.035 * u)).rotation.x = -0.25;
    else add(tube(curve([V(0.03 * u, y, front(y, 0.03 * u)), V(0.05 * u, y - 0.08 * u, front(y - 0.08 * u, 0.035 * u)), V(0.045 * u, y - 0.16 * u, front(y - 0.16 * u, 0.04 * u))], 8), [0.004 * u, 0.022 * u], { n: 6, up: V(0, 0, 1) }), m, chest);
  }
  if (H.wrapTail) add(tube(curve([V(0, S.neckY, -front(S.neckY, 0.03 * u)), V(0.02 * u, S.neckY - 0.15 * u, -front(S.neckY - 0.15 * u, 0.06 * u)), V(-0.01 * u, S.neckY - 0.35 * u, -front(S.neckY - 0.35 * u, 0.08 * u))], 10), [0.005 * u, 0.03 * u], { n: 6, up: V(0, 0, 1) }), mat(H.wrapTail, { side: true }), root);
  // a head-wrap or turban: bands wound round the head, a little dome on top
  if (wrap) { const m = mat(wrap, { side: true }); for (let k = 0; k < 4; k++) { const y = r * (0.12 + k * 0.17), rr = r * (1.06 - k * 0.12); const b = add(tor(rr, r * 0.16, 8, 32), m, head, 0, y, -r * 0.02); b.rotation.x = Math.PI / 2 + (k % 2 ? 0.1 : -0.06); b.scale.set(0.97, 1, 1); } add(sph(r * 0.95, 20, 10, 0, TAU, 0, Math.PI / 2), m, head, 0, r * 0.35, -r * 0.02).scale.set(1, 0.85, 1); }
  // eyes that glow from a shadowed face, or behind a mask
  const eyeAt = s => { const lon = s * 0.45, lat = -0.06; return V(Math.sin(lon) * Math.cos(lat) * r * 0.94, Math.sin(lat) * r * 1.06, Math.cos(lon) * Math.cos(lat) * r * 1.01); };
  if (H.mask) { const m = mat(H.mask, { side: true }); add(sph(r * 1.05, 28, 16, Math.PI / 2 - 1.15, 2.3, Math.PI * 0.28, Math.PI * 0.5), m, head); for (const s of [-1, 1]) add(new THREE.BoxGeometry(r * 0.28, r * 0.06, r * 0.08), H.maskEyes ? glow(H.maskEyes) : mat('dark'), head, eyeAt(s).x, eyeAt(s).y, eyeAt(s).z + r * 0.06).rotation.y = s * 0.45; }
  if (H.shade && !H.mask) for (const s of [-1, 1]) { const p = eyeAt(s); add(sph(r * 0.07, 10, 8), glow(H.shadeEyes || 'amber', 2.2), head, p.x, p.y, p.z).scale.set(1.3, 0.7, 0.6); }
  // antlers from the brow
  if (H.antlers) { const am = mat('bone'), size = H.antlers > 1 ? 1.3 : 1; for (const s of [-1, 1]) { const pts = curve([V(s * r * 0.35, r * 0.75, -r * 0.1), V(s * r * 0.8, r * 1.4 * size, -r * 0.3), V(s * r * 1.3, r * 2.0 * size, -r * 0.2), V(s * r * 1.2, r * 2.5 * size, r * 0.2)], 12); add(tube(pts, t => r * 0.09 * (1 - t * 0.6), { n: 6 }), am, head); for (const k of [4, 7, 10]) add(tube([pts[k], pts[k].clone().add(V(s * r * 0.15, r * 0.45, r * 0.25))], r * 0.04, { n: 5 }), am, head); } }
  // a feather in the hat or the hair
  if (H.feather) add(wedge([[0, 0], [r * 0.12, r * 0.4], [0, r * 1.1], [-r * 0.1, r * 0.45]], 0.003 * u), mat(H.feather, { side: true }), head, r * 0.8, r * 0.7, -r * 0.3).rotation.set(-0.5, 0.4, -0.5);
  // an emblem on the chest
  if (H.emblem) { const y = S.shY - 0.1 * u; add(lathe([[0, 0.004 * u], [0.026 * u, 0.003 * u], [0.028 * u, 0], [0, -0.002 * u]], { n: 24 }), mat(H.emblem), chest, -0.05 * u, y, front(y, armour * u + 0.012 * u)).rotation.x = Math.PI / 2; }
  // a strap across the body (a bandolier of vials, a satchel's strap)
  const strap = (from, key, items) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, y = lerp(S.shY - 0.01 * u, S.waistY - 0.03 * u, t), x = lerp(from * 0.13, -from * 0.13, t) * u; const [w, d] = torsoAt(S, y); pts.push(V(x, y, Math.sqrt(Math.max(0, 1 - (x / (w + 0.02)) ** 2)) * (w * d + 0.02 * u) + armour * u)); } add(tube(pts, [0.004 * u, 0.012 * u], { n: 6, up: V(0, 0, 1) }), mat(key), chest); if (items) pts.slice(2, 9).forEach(p => { add(tube([p.clone().add(V(0, -0.012 * u, 0.006 * u)), p.clone().add(V(0, 0.016 * u, 0.006 * u))], 0.006 * u, { n: 8 }), glow(items, 1.2), chest); }); return pts; };
  if (H.bandolier) strap(1, H.bandolier, H.vials);
  if (H.satchel) { strap(-1, H.satchel); const y = S.waistY - 0.06 * u, [w, d] = torsoAt(S, y); add(new THREE.BoxGeometry(0.1 * u, 0.08 * u, 0.04 * u), mat(H.satchel), chest, w * 0.85, y, w * d * 0.35).rotation.y = 0.9; }
  if (H.sack) { const [w, d] = torsoAt(S, S.shY - 0.15 * u); add(sph(0.11 * u, 14, 10), mat(H.sack), chest, 0.02 * u, S.shY - 0.18 * u, -(w * d + 0.08 * u)).scale.set(1, 1.2, 0.8); add(tube(torsoRing(S, S.shY - 0.05 * u, 0.012 * u, 20), 0.004 * u, { closed: true, n: 5 }), mat('string'), chest); }
  // at the belt: a ledger, a coin purse, a lantern, bone charms
  const by = S.waistY - 0.04 * u, [bw, bd] = torsoAt(S, by);
  if (H.ledger) { const g = new THREE.Group(); g.position.set(bw * 0.8, by - 0.03 * u, bd * bw * 0.5); g.rotation.y = 1.1; chest.add(g); add(new THREE.BoxGeometry(0.075 * u, 0.1 * u, 0.025 * u), mat(H.ledger), g); add(new THREE.BoxGeometry(0.068 * u, 0.092 * u, 0.027 * u), mat('parchment'), g, 0.004 * u, 0, 0); }
  if (H.coins) { add(sph(0.025 * u, 10, 8), mat('leather'), chest, -bw * 0.55, by - 0.04 * u, bd * bw * 0.85).scale.set(1, 1.2, 0.8); for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.009 * u, 0.009 * u, 0.002 * u, 12), mat('gold'), chest, -bw * 0.5 + k * 0.006 * u, by - 0.075 * u - k * 0.004 * u, bd * bw * 0.95); }
  if (H.lantern && !L.offhand) { const g = new THREE.Group(); g.position.set(-bw * 0.95, by - 0.08 * u, 0.02 * u); chest.add(g); add(new THREE.BoxGeometry(0.04 * u, 0.06 * u, 0.04 * u), glow('amber', 1.6), g); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(tube([V(x * 0.022 * u, -0.032 * u, z * 0.022 * u), V(x * 0.022 * u, 0.032 * u, z * 0.022 * u)], 0.003 * u, { n: 4 }), mat('iron'), g); add(cone(0.032 * u, 0.025 * u, 8), mat('iron'), g, 0, 0.044 * u, 0); fx.glows.push({ obj: g.children[0], color: glowColor('amber'), power: 0.5 }); }
  if (H.charms) for (let k = 0; k < 4; k++) { const a = -0.6 + k * 0.4, x = Math.sin(a) * bw * 1.05, z = Math.cos(a) * bw * bd * 1.05; add(tube([V(x, by, z), V(x, by - 0.05 * u, z + 0.004 * u)], 0.0015 * u, { n: 3 }), mat('string'), chest); add(new THREE.OctahedronGeometry(0.01 * u, 0), mat(H.charms), chest, x, by - 0.058 * u, z + 0.004 * u).scale.set(0.7, 1.4, 0.5); }
  // the Hollow Council hold the gift: a light in the off hand
  if (H.giftHeld && !L.offhand) { const o = add(sph(0.035 * u, 16, 12), glow('arcane', 2.2), rig.armL.hand, 0, -0.08 * u, 0.02 * u); fx.glows.push({ obj: o, color: glowColor('arcane'), power: 0.9 }); }
}

/* ------------------------------------------------------------------ a hand closed round a grip */
// how thick the grip is that this hand closes round (the right holds the weapon, the left a bow or a shield's handle)
function gripRadius(L, side, uw) {
  const W = L.weapon, k = (W?.k || 0.36) * uw / 40 * 1.55, p = W?.p || {};
  const holdsWeapon = W && (W.cls === 'bow' ? side === 1 : side === -1);
  if (!holdsWeapon) return 0.011 * uw;
  if (W.r === 'sword' || W.r === 'dagger') return (p.gripR || 2) * k * 1.12;
  if (W.r === 'bow') return (p.limbR || 3) * 0.55 * 1.45 * 1.16 * k * 0.85;
  if (W.p?.style === 'poker') return (p.rodR || 1.5) * k;
  return (p.haftR || 2) * 0.9 * k * (p.wrap ? 1.16 : 1.04);
}

// The fist's grip runs along the hand's local z (the weapon's +Y is turned onto it), across the palm, which faces in
// toward the body; the fingers curl round it and the thumb closes over them.
function buildHand(hand, side, m, gloves, u, fx, gr = 0.012) {
  const med = -side; // toward the middle of the body
  const pw = 0.042 * u, pl = 0.06 * u, pd = 0.018 * u;
  // the grip's centre: against the palm, as far out as the grip is thick (the fist opens round a thick haft)
  const gc = V(med * (pd * 0.55 + gr * 0.85), -0.07 * u - gr * 0.25, 0.004 * u);
  // palm and back of the hand
  add(tube([V(0, 0.005 * u, 0), V(0, -pl * 0.5, 0.002 * u), V(0, -pl, 0.004 * u)], t => [pd * (1.05 - t * 0.1), pw * (0.62 + t * 0.4)], { n: 14, up: V(1, 0, 0) }), m, hand);
  // fingers: four curls round the grip, stacked along z
  for (let f = 0; f < 4; f++) {
    const rad = (0.0068 - f * 0.0004) * u, z = (f - 1.5) * 0.0175 * u, R = gr + rad * 0.95;
    const pts = []; for (let i = 0; i <= 8; i++) { const a = lerp(0.2, 4.2, i / 8); pts.push(V(gc.x - med * Math.cos(a) * R, gc.y + Math.sin(a) * R * 0.95 - 0.004 * u, z * (1 + i * 0.01) + gc.z)); }
    add(tube(curve(pts, 12), t => rad * (1 - t * 0.2), { n: 8 }), m, hand);
  }
  // thumb over the fingers
  { const tr = 0.0085 * u, Rt = gr + tr * 0.9, pts = [V(-med * 0.004 * u, -0.022 * u, 0.026 * u)]; for (let i = 0; i <= 6; i++) { const a = lerp(-0.2, 2.1, i / 6); pts.push(V(gc.x - med * Math.cos(a) * Rt, gc.y + Math.sin(a) * Rt, gc.z + 0.034 * u - i * 0.002 * u)); } add(tube(curve(pts, 12), t => tr * (1 - t * 0.25), { n: 8 }), m, hand); }
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
// Hair knows what is on the head, so it never comes through it:
//   nothing / circlet / crown: the full head of hair (the band sits over it);
//   kettle hat: no crown of hair; locks and a short fringe come out from under the brim;
//   helm: no hair on the head; long hair, a ponytail or a braid falls from under the back of the helm;
//   hood / coif: the hair is inside; long hair shows as two locks in the face opening.
function buildHair(head, H, r, covers, look, seed) {
  let style = H.hair || 'short'; if (style === 'none') return;
  // a bun: short hair round the sides and a knot at the back of the crown
  if (style === 'bun') { style = 'short'; if (!covers) add(sph(r * 0.3, 14, 10), mat(H.hairMat, { side: true }), head, 0, r * 0.62, -r * 0.82).scale.set(1, 0.85, 1); }
  const hm = mat(H.hairMat, { side: true }), rnd = rngOf(seed);
  const onSkull = (lat, lon, k = 1.04) => V(Math.sin(lon) * Math.cos(lat) * r * k * 0.95, Math.sin(lat) * r * k * 1.06, Math.cos(lon) * Math.cos(lat) * r * k);
  const thin = Q.d > 1 ? 1.32 : 1;
  const lock = (pts, w0, d0, up, n = 12) => add(tube(curve(pts, n), t => [lerp(w0, r * 0.02, t * t) / thin, lerp(d0, r * 0.012, t)], { n: 8, up }), hm, head);
  const hood = look === 'hood' || look === 'coif', helm = look === 'helm', kettle = look === 'kettle';
  const long = style === 'long', tail = style === 'pony' || style === 'braid';
  if (!covers) {
    // the cap of hair over the crown, set back from the brow
    const cap = sph(r * 1.07, 40, 20, 0, TAU, 0, Math.PI * (style === 'crop' ? 0.4 : 0.47));
    const p = cap.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * 0.95), p.setY(i, p.getY(i) * 1.06);
    cap.computeVertexNormals();
    add(cap, hm, head, 0, r * 0.05, -r * 0.06).rotation.x = -0.32;
    const nF = Math.round((style === 'crop' ? 5 : 7) * (Q.d > 1 ? 1.6 : 1));
    for (let i = 0; i < nF; i++) { const lon = lerp(-0.95, 0.95, i / (nF - 1)) + (rnd() - 0.5) * 0.1, len = (style === 'crop' ? 0.25 : 0.42) + rnd() * 0.15; const a = onSkull(0.95, lon * 0.8, 1.06), b = onSkull(0.62, lon * 0.95, 1.1), c = onSkull(0.62 - len, lon * 1.05 + (lon > 0 ? 0.15 : -0.15), 1.07); lock([a, b, c], r * 0.2, r * 0.07, b.clone().normalize(), 10); }
  } else if (kettle) {
    // a short fringe peeking out under the brim
    const nF = Math.round(6 * (Q.d > 1 ? 1.5 : 1));
    for (let i = 0; i < nF; i++) { const lon = lerp(-0.8, 0.8, i / (nF - 1)) + (rnd() - 0.5) * 0.1; const a = onSkull(0.2, lon, 1.02), b = onSkull(0.08, lon * 1.05, 1.07), c = onSkull(-0.05 - rnd() * 0.08, lon * 1.1, 1.05); lock([a, b, c], r * 0.18, r * 0.06, b.clone().normalize(), 8); }
  }
  if (hood) {
    if (long || tail) for (const sd of [-1, 1]) { const a = onSkull(0.35, sd * 0.62, 0.98), b = onSkull(-0.2, sd * 0.68, 1.0), c = onSkull(-0.75, sd * 0.6, 0.96); lock([a, b, c], r * 0.16, r * 0.06, V(sd, 0, 0.4).normalize(), 10); }
    return;
  }
  // locks round the sides and back: to the jaw, or to the shoulders for long hair
  if (!helm) {
    const fall = long ? r * 2.6 : style === 'short' || style === 'crop' ? r * 0.75 : r * 0.9;
    const nB = Math.round((long ? 22 : 14) * (Q.d > 1 ? 1.7 : 1));
    const latA = kettle ? 0.12 : 0.55, kA = kettle ? 1.02 : 1.04;
    for (let i = 0; i < nB; i++) {
      const lon = lerp(0.9, TAU - 0.9, i / (nB - 1)) + (rnd() - 0.5) * 0.12;
      const a = onSkull(latA, lon, kA), b = onSkull(-0.15, lon, 1.1), out = V(Math.sin(lon), 0, Math.cos(lon));
      const c = b.clone().add(V(0, -fall * (0.7 + rnd() * 0.35), 0)).addScaledVector(out, r * (long ? 0.25 : 0.06)).add(V(0, 0, long && Math.cos(lon) < 0 ? -r * 0.25 : 0));
      lock([a, b, c], r * 0.24, r * 0.08, out);
    }
  } else if (long) {
    // under a helm: long hair falls from below its back rim
    const nB = Math.round(12 * (Q.d > 1 ? 1.6 : 1));
    for (let i = 0; i < nB; i++) {
      const lon = lerp(2.0, TAU - 2.0, i / (nB - 1)) + (rnd() - 0.5) * 0.1, out = V(Math.sin(lon), 0, Math.cos(lon));
      const a = onSkull(-0.86, lon, 0.98), b = a.clone().addScaledVector(out, r * 0.18).add(V(0, -r * 0.35, 0)), c = b.clone().add(V(0, -r * 1.6 * (0.8 + rnd() * 0.3), -r * 0.2));
      lock([a, b, c], r * 0.22, r * 0.08, out);
    }
  }
  if (tail) {
    const base = helm ? onSkull(-0.85, Math.PI, 1.02) : kettle ? onSkull(0.02, Math.PI, 1.05) : onSkull(0.1, Math.PI, 1.08);
    add(tor(r * 0.12, r * 0.04, 6, 14), mat('leatherDark'), head, base.x, base.y, base.z - r * 0.04);
    if (style === 'pony') add(tube(curve([base, base.clone().add(V(0, -r * 0.4, -r * 0.35)), base.clone().add(V(0, -r * 1.5, -r * 0.3)), base.clone().add(V(0, -r * 2.2, -r * 0.1))], 16), t => [r * 0.22 * (1 - t * 0.7) * (1 + Math.sin(t * Math.PI) * 0.3), r * 0.16 * (1 - t * 0.7)], { n: 10 }), hm, head);
    else for (let i = 0; i < 9; i++) { const t = i / 8; add(sph(r * 0.15 * (1 - t * 0.4), 10, 8), hm, head, base.x + (i % 2 ? 0.03 : -0.03) * r, base.y - r * 0.25 - i * r * 0.24, base.z - r * 0.25 + t * r * 0.1).scale.set(1.2, 0.9, 1); }
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
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(sph(0.0045 * u, 6, 4), mat(HL.trim || metalKey), head, Math.sin(a) * r * 1.1, r * 0.34, Math.cos(a) * r * 1.13); }
  } else if (look === 'helm') {
    const m = mat(metalKey, { side: true });
    add(lathe([[0, r * 1.2], [r * 0.55, r * 1.13], [r * 0.93, r * 0.86], [r * 1.12, r * 0.42], [r * 1.15, r * 0.24]], { n: 40, sx: 0.97 }), m, head);
    // the eye slit runs wide across the face; below it a narrow opening for the nose and mouth (a T)
    add(lathe([[r * 1.15, r * 0.24], [r * 1.16, -r * 0.05]], { n: 32, sx: 0.97, phi0: 1.05, phiLen: TAU - 2.1 }), m, head);
    add(lathe([[r * 1.16, -r * 0.05], [r * 1.14, -r * 0.45], [r * 1.06, -r * 0.8], [r * 0.95, -r * 1.02]], { n: 32, sx: 0.97, phi0: 0.32, phiLen: TAU - 0.64 }), m, head);
    // a brow ridge over the slit and a rim round the opening
    add(tube(curve([V(-Math.sin(1.05) * r * 1.16 * 0.97, r * 0.26, Math.cos(1.05) * r * 1.16), V(0, r * 0.3, r * 1.2), V(Math.sin(1.05) * r * 1.16 * 0.97, r * 0.26, Math.cos(1.05) * r * 1.16)], 20), [0.007 * u, 0.012 * u], { n: 6 }), mat(HL.trim || metalKey), head);
    for (const sd of [-1, 1]) add(tube(curve([V(sd * Math.sin(0.32) * r * 1.17 * 0.97, -r * 0.05, Math.cos(0.32) * r * 1.17), V(sd * Math.sin(0.32) * r * 1.13 * 0.97, -r * 0.5, Math.cos(0.32) * r * 1.13), V(sd * Math.sin(0.32) * r * 0.97 * 0.97, -r * 1.0, Math.cos(0.32) * r * 0.97)], 12), 0.006 * u, { n: 6 }), mat(HL.trim || metalKey), head);
    add(T(r * 0.3, 1.16), trim || mat(metalKey), head);
    if (HL.crest) add(wedge([[-r * 0.95, 0], [-r * 0.55, r * 0.2], [0, r * 0.26], [r * 0.55, r * 0.2], [r * 0.85, 0]], 0.006 * u, null, { bevel: 0.002 * u }), mat(HL.crest), head, 0, r * 1.08, -r * 0.05).rotation.y = Math.PI / 2;
    if (HL.plume) for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.09; add(tube(curve([V(0, r * 1.15, -r * 0.2), V(a * r, r * 1.6, -r * 0.7), V(a * r * 1.5, r * 1.2, -r * 1.6 - Math.abs(a) * r)], 14), t => [r * 0.12 * Math.sin(Math.PI * Math.max(0.12, t)), r * 0.02], { n: 6, up: V(0, 1, 0) }), mat(HL.plume, { side: true }), head); }
  } else if (look === 'coif' || look === 'hood') {
    const cloth = look === 'hood' || (look === 'coif' && HL.mat && !MAT[HL.mat]?.metal), m = cloth ? mat(HL.mat || 'hoodGreen', { side: true }) : mat(metalKey, { as: 'mail', side: true, rep: 1.5 });
    const k = cloth ? 1.2 : 1.12;
    add(lathe([[0, r * 1.1 * k], [r * 0.6 * k, r * 1.0 * k], [r * 1.0 * k, r * 0.62 * k]], { n: 40, sx: 0.97 }), m, head);
    add(lathe([[r * 1.0 * k, r * 0.62 * k], [r * 1.05 * k, r * 0.1], [r * 0.95 * k, -r * 0.6], [r * 0.86 * k, -r * 0.98]], { n: 32, sx: 0.97, phi0: 0.95, phiLen: TAU - 1.9 }), m, head);
    // the drape over the shoulders
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.04 * u, S.shY - 0.13 * u, t); rings.push(torsoRing(S, y, (0.02 + t * 0.025) * u, 32, cloth ? t * 0.06 : 0, 0)); }
    add(loft(rings), m, root);
    if (cloth && HL.tip) add(tube(curve([V(0, r * 0.9, -r * 0.8), V(0, r * 0.75, -r * 1.35), V(0, r * 0.2, -r * 1.8)], 12), t => [lerp(r * 0.45, 0.002, t), lerp(r * 0.35, 0.002, t)], { n: 12 }), m, head);
    if (trim) { const ed = (rad, y, sd) => V(sd * Math.sin(0.95) * rad * 0.97, y, Math.cos(0.95) * rad); const pts = [ed(r * 0.86 * k, -r * 0.98, -1), ed(r * 0.95 * k, -r * 0.6, -1), ed(r * 1.05 * k, r * 0.1, -1), ed(r * 1.0 * k, r * 0.62 * k, -1), V(0, r * 0.66 * k, r * 1.02 * k), ed(r * 1.0 * k, r * 0.62 * k, 1), ed(r * 1.05 * k, r * 0.1, 1), ed(r * 0.95 * k, -r * 0.6, 1), ed(r * 0.86 * k, -r * 0.98, 1)]; add(tube(curve(pts, 30), 0.007 * u, { n: 6 }), trim, head, 0, 0, 0.002 * u); }
  } else if (look === 'circlet' || look === 'crown') {
    const mk = MAT[HL.mat]?.metal ? HL.mat : HL.metal || (MAT[HL.mat]?.metal ? HL.mat : 'gold'), m = mat(mk, look === 'crown' && /gold/.test(mk) && TEXTURES.on ? { tex: 'metal-filigree' } : {});
    const band = new THREE.Group(); band.position.y = r * 0.42; band.rotation.x = -0.12; head.add(band);
    const h = look === 'crown' ? r * 0.28 : r * 0.08;
    const bR = r * 1.12; // over the hair, not through it
    add(lathe([[bR, -h / 2], [bR * 1.04, -h / 2], [bR * 1.05, h / 2], [bR * 1.01, h / 2], [bR, -h / 2]], { n: 48, sx: 0.97 }), m, band);
    if (look === 'crown') {
      const n = HL.style === 'regal' ? 8 : 6, tall = HL.style === 'regal' ? r * 0.55 : r * 0.38;
      for (let i = 0; i < n; i++) { const a = i / n * TAU; const pt = new THREE.Group(); pt.position.set(Math.sin(a) * bR * 1.03 * 0.97, h / 2, Math.cos(a) * bR * 1.03); pt.rotation.y = a; band.add(pt); add(wedge([[-r * 0.13, 0], [r * 0.13, 0], [r * 0.03, tall * 0.7], [0, tall], [-r * 0.03, tall * 0.7]], 0.006 * u, null, { bevel: 0.002 * u }), m, pt); add(sph(r * 0.05, 10, 8), m, pt, 0, tall, 0); }
      for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; gem(['ruby', 'sapphire', 'emerald'][i % 3], r * 0.06, band, Math.sin(a) * bR * 1.06 * 0.97, 0, Math.cos(a) * bR * 1.06, null, V(Math.sin(a), 0, Math.cos(a))); }
    }
    if (HL.gem) gem(HL.gem, r * 0.09, band, 0, look === 'crown' ? 0 : r * 0.02, bR * 1.08, mk);
    else if (look === 'circlet') add(wedge([[0, -r * 0.12], [r * 0.1, 0], [0, r * 0.16], [-r * 0.1, 0]], 0.005 * u), m, band, 0, 0, bR * 1.06);
  }
  if (HL.gem && (look === 'helm' || look === 'kettle' || look === 'hood')) gem(HL.gem, r * 0.08, head, 0, r * 0.55, r * (look === 'kettle' ? 1.1 : 1.18), HL.trim || 'gold');
  if (HL.runes) { const g = add(T(r * 0.62, look === 'kettle' ? 0.88 : 1.07), mat(HL.runes), head); fx.glows.push({ obj: g, color: glowColor(HL.runes), power: 0.6 }); }
}

/* ------------------------------------------------------------------ poses */
// a lantern, censer or chalice stays upright in the hand: undo the arm's turn above it
const _q = new THREE.Quaternion(), _r = new THREE.Quaternion();
function keepUpright(rig) {
  const o = rig.offhand; if (!o?.userData.upright) return;
  rig.root.updateMatrixWorld(true);
  o.parent.getWorldQuaternion(_q); rig.root.getWorldQuaternion(_r);
  o.quaternion.copy(_q.invert().multiply(_r));
}
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
  if (pose === 'walk') {
    // walking (u is the step's phase, radians; rig.run for a jog): legs swing, the free arm swings against them, the body
    // bobs and leans a little into the step; the weapon arm keeps its hold and only sways
    const run = !!rig.run, sw = run ? 0.62 : 0.42, s = Math.sin(u), c = Math.cos(u);
    rig.legs[0].rotation.x = -s * sw; rig.legs[1].rotation.x = s * sw;
    rig.root.position.y = Math.abs(c) * (run ? 0.035 : 0.018) * (rig.scale ? 1 / rig.scale : 1) * 0.6;
    rig.root.rotation.x = run ? 0.1 : 0.03; rig.root.rotation.y = s * 0.05;
    if (cls !== 'bow') { Lf.sh.rotation.x = -0.25 + s * sw * 0.9; Lf.elbow.rotation.x = -0.6 - Math.max(0, s) * 0.4; } else { Lf.sh.rotation.x += s * 0.08; }
    R.sh.rotation.x += -s * 0.08;
    if (rig.cape) rig.cape.rotation.x = (run ? 0.38 : 0.16) + Math.abs(s) * 0.05;
    if (rig.skirt) rig.skirt.rotation.x = -rig.root.rotation.x * 0.6;
  }
  keepUpright(rig);
  if (pose !== 'strike') { return; }
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
  keepUpright(rig);
}
