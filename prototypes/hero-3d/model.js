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
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, wedge, plate, blade, mat, glowColor, isEmit, sRGB, KIND, Q, sph, tor, cone, ico, bake, etchMaterial, stitchGeo, add, gem, rngOf, ring, FACES, TEXTURES, mergeGeometries, fitMaster, MASTER_ON, withMaster } from './kit.js';
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


/* ------------------------------------------------------------------ faces that live (November 20) */
// Eyelids and a mouth drawn in the face's own shader over its picture (painted by Chris or by faceTexture), so a blink
// or an expression costs a few numbers a frame, never a new picture, and works the same in High, Light and Lite.
//   rig.faceCtl.set(expr, seconds): 'neutral', 'hurt' (a wince), 'effort' (gritted, on a strike), 'cheer', 'worried',
//   'asleep' (a fallen hero), 'talk'; seconds omitted = until the next set. It blinks by itself, and talks while the
//   pose is 'talk' (or faceCtl.talking is true). setPose drives it; buildHero's result has face(expr, seconds).
// Where the eyes and mouth are on Chris's four faces, as fractions of his pictures
const FACE_MARKS = {
  wren: { eyes: [[0.32, 0.45], [0.66, 0.45]], eye: [0.062, 0.032], mouth: [0.5, 0.705], mw: 0.11 },
  pip: { eyes: [[0.32, 0.43], [0.66, 0.43]], eye: [0.062, 0.032], mouth: [0.53, 0.68], mw: 0.12 },
  bryn: { eyes: [[0.33, 0.44], [0.66, 0.44]], eye: [0.056, 0.028], mouth: [0.5, 0.68], mw: 0.085 },
  alondra: { eyes: null, mouth: [0.5, 0.67], mw: 0.09 },
};
// a point on Chris's picture -> where it falls on the head's canvas (1024 x 512 units), through paintedFace's projection
function picToCanvas(X, Y) {
  const { k, y0 } = FACE_FIT, x = (X - 0.5) * 2 * k, y = y0 + (0.5 - Y) * 2 * k, z = Math.sqrt(Math.max(0.01, 1 - x * x - y * y));
  const th = Math.acos(Math.max(-1, Math.min(1, y))), ph = Math.atan2(z, -x);
  return [ph / TAU * 1024, th / Math.PI * 512];
}
function faceMarksOf(faceName, big) {
  if (faceName) {
    const F = FACE_MARKS[faceName], c = picToCanvas(...F.mouth), cw = picToCanvas(F.mouth[0] + F.mw, F.mouth[1]);
    const eyes = F.eyes ? F.eyes.map(e => picToCanvas(...e)) : null, ew = F.eyes ? picToCanvas(F.eyes[0][0] + F.eye[0], F.eyes[0][1] + F.eye[1]) : null;
    return { eyes, eye: eyes ? [Math.abs(ew[0] - eyes[0][0]) * 1.3, Math.abs(ew[1] - eyes[0][1]) * 1.45] : [1, 1], mouth: c, mouthSize: [Math.abs(cw[0] - c[0]), Math.abs(cw[0] - c[0]) * 0.42] };
  }
  // faceTexture's own layout: eyes at cx +/- 52, ey; mouth at ey + 79; all scaled 1.45 about (cx, ey + 30) unless big
  const F = big ? 1 : 1.45, at = (x, y) => [256 + (x - 256) * F, 298 + (y - 298) * F], eyY = big ? 274 : 268;
  return { eyes: [at(256 - (big ? 50 : 52), eyY), at(256 + (big ? 50 : 52), eyY)], eye: [25 * F * (big ? 1.3 : 1), 19 * F * (big ? 1.38 : 1)], mouth: at(256, 347), mouthSize: [20 * F, 9 * F] };
}
const FACE_EXPR = {
  neutral: {}, talk: {},
  hurt: { lid: 0.62, low: 0.35, tilt: 0.5, open: 0.34, smile: -0.45, teeth: 1 },
  effort: { lid: 0.45, tilt: 0.85, open: 0.24, smile: -0.1, teeth: 1 },
  cheer: { low: 0.6, open: 0.6, smile: 1 },
  worried: { lid: 0.22, tilt: -0.9, open: 0.06, smile: -0.75 },
  asleep: { lid: 1, open: 0.05 },
};
const FACE_KEYS = ['lid', 'low', 'tilt', 'open', 'smile', 'teeth'];
export function applyFaceShader(m, U) {
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', `uniform vec2 fEyeL, fEyeR, fEyeSize, fMouth, fMouthSize; uniform vec3 fSkin;
uniform float fLid, fLow, fTilt, fOpen, fSmile, fTeeth, fPatch, fNoEyes;
void main() {`).replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 fp = vec2(vMapUv.x, 1.0 - vMapUv.y) * vec2(1024.0, 512.0);
  vec3 fc = diffuseColor.rgb, lash = vec3(0.07, 0.045, 0.05);
  if (fNoEyes < 0.5) for (int i = 0; i < 2; i++) {
    vec2 e = i == 0 ? fEyeL : fEyeR; float side = i == 0 ? -1.0 : 1.0;
    vec2 q = (fp - e) / fEyeSize;
    float inside = 1.0 - smoothstep(0.95, 1.12, length(q));
    float edge = -1.08 + fLid * 2.2 - fTilt * q.x * side * 0.55;
    float up = inside * (1.0 - smoothstep(edge - 0.07, edge + 0.07, q.y)) * step(0.02, fLid);
    float lowE = 1.08 - fLow * 1.7 + q.x * q.x * fLow * 0.9;
    float dn = inside * smoothstep(lowE - 0.07, lowE + 0.07, q.y) * step(0.02, fLow);
    fc = mix(fc, fSkin * 0.92, max(up, dn));
    fc = mix(fc, lash, inside * (1.0 - smoothstep(0.0, 0.14, abs(q.y - edge))) * step(0.04, fLid) * 0.9);
    float shut = smoothstep(0.82, 0.98, fLid), arc = 0.25 + 0.3 * q.x * q.x * (1.0 - fLow) - fLow * 0.35;
    fc = mix(fc, lash, shut * (1.0 - smoothstep(0.75, 0.95, abs(q.x))) * (1.0 - smoothstep(0.0, 0.16, abs(q.y - arc))));
    fc = mix(fc, lash, inside * (1.0 - smoothstep(0.0, 0.12, abs(q.y - lowE))) * step(0.04, fLow) * 0.7);
  }
  if (fPatch > 0.01) {
    vec2 q = (fp - fMouth) / fMouthSize;
    fc = mix(fc, fSkin, fPatch * (1.0 - smoothstep(0.85, 1.25, length(q * vec2(0.85, 0.5)))));
    float yc = -fSmile * 0.55 * q.x * q.x + fSmile * 0.2, h = fOpen * 1.1 * (1.0 - q.x * q.x), d = q.y - yc, inX = step(abs(q.x), 1.0);
    float mouthIn = inX * (1.0 - smoothstep(h - 0.08, h + 0.04, abs(d))) * step(0.02, fOpen);
    vec3 inner = mix(vec3(0.22, 0.04, 0.05), vec3(0.93, 0.9, 0.84), fTeeth * (1.0 - smoothstep(0.08, 0.16, abs(d) - h * 0.55 + 0.08)) );
    inner = mix(inner, vec3(0.93, 0.9, 0.84), (1.0 - fTeeth) * step(d, -h * 0.45));
    fc = mix(fc, inner, mouthIn * fPatch);
    float lip = inX * (1.0 - smoothstep(0.1, 0.24, abs(abs(d) - h))) * (1.0 - smoothstep(0.85, 1.0, abs(q.x)));
    fc = mix(fc, vec3(0.42, 0.13, 0.13), lip * fPatch * 0.9);
    fc = mix(fc, fTeeth > 0.5 ? vec3(0.25, 0.2, 0.18) : fc, mouthIn * fPatch * fTeeth * (1.0 - smoothstep(0.0, 0.07, abs(d))) );
  }
  diffuseColor.rgb = fc;
}`);
  };
  m.customProgramCacheKey = () => 'aeth-face';
  m.userData.faceU = U;
  return m;
}
function faceRig(faceM, marks, skin, noEyes) {
  const V2 = (a) => new THREE.Vector2(a[0], a[1]);
  const U = { fEyeL: { value: V2(marks.eyes ? marks.eyes[0] : [0, 0]) }, fEyeR: { value: V2(marks.eyes ? marks.eyes[1] : [0, 0]) }, fEyeSize: { value: V2(marks.eye) },
    fMouth: { value: V2(marks.mouth) }, fMouthSize: { value: V2(marks.mouthSize) }, fSkin: { value: skin }, fNoEyes: { value: noEyes || !marks.eyes ? 1 : 0 },
    fLid: { value: 0 }, fLow: { value: 0 }, fTilt: { value: 0 }, fOpen: { value: 0 }, fSmile: { value: 0 }, fTeeth: { value: 0 }, fPatch: { value: 0 } };
  applyFaceShader(faceM, U);
  const C = { U, expr: 'neutral', until: Infinity, pending: null, talking: false, cur: {}, last: null, nextBlink: 2 + Math.random() * 3, blinkAt: -9 };
  for (const k of FACE_KEYS) C.cur[k] = 0;
  C.set = (expr, seconds) => { C.pending = { expr: FACE_EXPR[expr] ? expr : 'neutral', seconds }; };
  C.update = (t, pose) => {
    const dt = C.last == null ? 0 : Math.min(0.1, Math.max(0, t - C.last)); C.last = t;
    if (C.pending) { C.expr = C.pending.expr; C.until = C.pending.seconds ? t + C.pending.seconds : Infinity; C.pending = null; }
    if (t > C.until) { C.expr = 'neutral'; C.until = Infinity; }
    const E = FACE_EXPR[C.expr], k = 1 - Math.exp(-dt * 14);
    for (const key of FACE_KEYS) C.cur[key] += ((E[key] || 0) - C.cur[key]) * k;
    // a blink every few seconds (not while asleep)
    if (t > C.nextBlink) { C.blinkAt = t; C.nextBlink = t + 2.2 + Math.random() * 3.5; }
    const b = t - C.blinkAt, blink = b < 0.16 ? Math.sin(b / 0.16 * Math.PI) : 0;
    const talking = C.talking || pose === 'talk' || C.expr === 'talk';
    const open = talking ? Math.max(C.cur.open, 0.12 + 0.38 * Math.abs(Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1))) : C.cur.open;
    U.fLid.value = Math.max(C.cur.lid, blink); U.fLow.value = C.cur.low; U.fTilt.value = C.cur.tilt; U.fOpen.value = open; U.fSmile.value = C.cur.smile; U.fTeeth.value = C.cur.teeth;
    U.fPatch.value = Math.min(1, Math.max(open * 6, Math.abs(C.cur.smile) * 2, C.cur.teeth * 2, talking ? 1 : 0));
  };
  return C;
}


/* ------------------------------------------------------------------ things that swing (November 20) */
// Capes, long hair and tails, skirts and robes, quivers, scarves, pouches, satchels, lanterns and charms hang from pivots
// of their own (they stay separate moving parts through bake, and Lite's bones). Each frame setPose ends with swing():
// every pivot springs toward where gravity, its own speed (air) and its acceleration (it lags) would point it, within
// limits that keep it out of the body and the legs. A few sums per piece; every page that calls setPose has it.
let SWING = null; // the rig being built, so builders can hang pieces on it
// swingBlock(parent, pivot, opts, build): what build() adds to parent is hung from a pivot at `pivot` (parent space)
// opts: x [min, max] (forward swing is negative, back is positive), z [min, max] (toward +x is positive), k stiffness,
// damp (0..1 of critical), drag (air), acc (lag), posed (setPose sets this node's own turn each frame)
function swingBlock(parent, pivot, opts, build) {
  const before = new Set(parent.children); build();
  const added = parent.children.filter(c => !before.has(c)); if (!added.length || !SWING) return null;
  const P = new THREE.Group(); P.position.copy(pivot); parent.add(P);
  for (const c of added) { c.position.sub(pivot); P.add(c); }
  SWING.danglers.push({ node: P, ...opts });
  return P;
}
const _sw = new THREE.Vector3(), _sd = new THREE.Vector3(), _sq = new THREE.Quaternion(), _sv = new THREE.Vector3();
export const SWING_ON = { on: true };
function swing(rig, t) {
  const D = rig.danglers; if (!D || !D.length || !SWING_ON.on) return;
  const dt = rig._swT == null ? 0 : Math.min(0.05, Math.max(0, t - rig._swT)); rig._swT = t;
  rig.root.updateMatrixWorld(true);
  for (const d of D) {
    const n = d.node;
    if (!d.posed) n.rotation.set(0, 0, 0);
    n.updateMatrixWorld(true);
    n.getWorldPosition(_sw);
    if (!d.p) { d.p = _sw.clone(); d.v = new THREE.Vector3(); d.a = new THREE.Vector3(); d.ang = [0, 0]; d.vel = [0, 0]; }
    if (dt > 0) {
      _sv.copy(_sw).sub(d.p).divideScalar(dt); d.p.copy(_sw);
      const f = 1 - Math.exp(-dt * 10), ax = d.v.x, ay = d.v.y, az = d.v.z;
      d.v.lerp(_sv, f); d.a.lerp(_sd.set((d.v.x - ax) / dt, (d.v.y - ay) / dt, (d.v.z - az) / dt), f);
      // where it wants to hang: down, against its acceleration, against its speed
      _sd.set(0, -9.8, 0).addScaledVector(d.a, -(d.acc ?? 0.5)).addScaledVector(d.v, -(d.drag ?? 1));
      n.getWorldQuaternion(_sq); _sd.applyQuaternion(_sq.invert()).normalize();
      const L = [d.x || [-0.3, 0.3], d.z || [-0.3, 0.3]], tgt = [Math.atan2(-_sd.z, -_sd.y), Math.atan2(_sd.x, -_sd.y)];
      const k = d.k ?? 40, c = 2 * (d.damp ?? 0.35) * Math.sqrt(k);
      for (let i = 0; i < 2; i++) {
        const g = Math.max(L[i][0], Math.min(L[i][1], tgt[i]));
        d.vel[i] += (k * (g - d.ang[i]) - c * d.vel[i]) * dt; d.ang[i] += d.vel[i] * dt;
        if (d.ang[i] < L[i][0]) { d.ang[i] = L[i][0]; d.vel[i] = Math.max(0, d.vel[i]); } else if (d.ang[i] > L[i][1]) { d.ang[i] = L[i][1]; d.vel[i] = Math.min(0, d.vel[i]); }
      }
    }
    n.rotation.x += d.ang[0]; n.rotation.z += d.ang[1];
    n.updateMatrixWorld(true);
  }
}


/* ------------------------------------------------------------------ sculpted detail (November 20) */
// The code-built figures sculpted, so they stand beside the full-detail foes: the head shaped (a nose, a brow, eye
// sockets, cheekbones, lips and a chin, placed from where each face's own eyes and mouth are, so it fits the picture),
// cloth in deeper folds, hair in grooved locks, metal and leather with a second, larger scale of relief (dents, creases),
// rolled rims. SCULPT.on = false gives the figures as they were, to compare.
export const SCULPT = { on: true };
// the head's relief for a face: unit-sphere x, y on its front -> how far the surface comes out (in head radii)
function faceRelief(marks, k = 1) {
  const toXY = ([cu, row]) => { const th = row / 512 * Math.PI, ph = cu / 1024 * TAU; return [-Math.cos(ph) * Math.sin(th), Math.cos(th)]; };
  const eye = marks.eyes ? toXY(marks.eyes[1]) : [0.33, -0.05], mouth = toXY(marks.mouth);
  const ey = eye[1], ex = Math.abs(eye[0]), my = mouth[1], nt = ey + (my - ey) * 0.62, g = (a, b) => Math.exp(-(a * a + b * b)), sq = v => v * v;
  return (x, y) => {
    const ax = Math.abs(x);
    let d = 0;
    // the nose: from the bridge between the eyes to its tip, wider toward the tip, then back in under it
    const t = clamp01((ey + 0.02 - y) / (ey + 0.02 - nt)), under = y < nt ? Math.exp(-sq((nt - y) / 0.045)) : 1;
    d += (0.018 + 0.1 * t * t) * under * Math.exp(-sq(x / (0.06 + 0.06 * t)));
    // the brow, the sockets under it, the cheekbones
    d += 0.035 * Math.exp(-sq((y - (ey + 0.17)) / 0.065)) * (1 - smooth((ax - 0.55) / 0.18)) * (1 - 0.35 * Math.exp(-sq(x / 0.08)));
    d -= 0.032 * g((ax - ex) / 0.15, (y - ey) / 0.09);
    d += 0.032 * g((ax - ex - 0.06) / 0.13, (y - (ey - 0.19)) / 0.1);
    // the lips, the line between them, the chin
    d += 0.028 * g(x / 0.17, (y - my) / 0.055) - 0.012 * g(x / 0.15, (y - my) / 0.014);
    d += 0.036 * g(x / 0.2, (y - (my - 0.18)) / 0.08);
    return d * k;
  };
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
  const rig = { root, S, danglers: [] }, fx = { glows: [], aura: null, flame: false };
  SWING = rig;
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
    add(fitMaster(tube(curve(legPath, 16), legRad, { n: 14, capA: false }), 'trousers'), mat(robe ? body.mat : H.pants || 'pants'), leg);
    // the boot: a shaft up the calf and a foot with a heel, toe and sole
    const bootKey = F ? F.mat : H.boots || (robe ? 'leather' : 'leatherDark'), bm = mat(bootKey);
    const top = (S.bootY - S.legTop), gnd = -S.legTop, br = R * 0.92;
    add(fitMaster(tube([V(0, top, 0.002 * u), V(0, lerp(top, ank, 0.5), 0), V(0, ank, -0.004 * u), V(0, gnd + 0.05 * u, -0.006 * u)], t => [br * (1.02 - t * 0.16), br * (0.98 - t * 0.14)], { n: 14, capA: false, capB: false }), 'boot'), bm, leg);
    const fl = 0.24 * u * S.foot, fw = br * 1.05;
    add(fitMaster(tube(curve([V(0, gnd + 0.045 * u, -0.05 * u), V(0, gnd + 0.05 * u, 0), V(0, gnd + 0.035 * u, fl * 0.55), V(0, gnd + 0.025 * u, fl * 0.85)], 12), t => [0.048 * u * (1 - t * 0.45), fw * (1 - smooth((t - 0.75) / 0.25) * 0.45)], { n: 14, up: V(0, 1, 0), shape: a => (Math.cos(a) < 0 ? 0.75 : 1) }), 'foot'), bm, leg);
    add(new THREE.BoxGeometry(fw * 2.05, 0.016 * u, fl * 1.06), mat('leatherDark'), leg, 0, gnd + 0.008 * u, fl * 0.33);
    if (F?.fold) add(tube(ellipse(V(0, top - 0.01 * u, 0), V(1, 0, 0), V(0, 0, 1), br * 1.18, br * 1.14, 20), 0.018 * u, { closed: true, n: 8 }), mat(F.trim || F.mat), leg);
    else if (F?.trim) add(tube(ellipse(V(0, top, 0), V(1, 0, 0), V(0, 0, 1), br * 1.04, br * 1.0, 20), 0.007 * u, { closed: true, n: 6 }), mat(F.trim), leg);
    if (F?.greave) { const gm = mat(F.greave); add(fitMaster(lathe([[br * 1.18, top - 0.01 * u], [br * 1.24, lerp(top, ank, 0.5)], [br * 1.1, ank + 0.02 * u]], { n: 14, phi0: -1.25, phiLen: 2.5 }), 'vambrace'), mat(F.greave, { side: true }), leg); add(tube([V(0, top - 0.02 * u, br * 1.26), V(0, ank + 0.03 * u, br * 1.12)], 0.005 * u, { n: 6 }), gm, leg); }
  }

  /* ---- the torso, the garment over it and the hem */
  const chest = new THREE.Group(); root.add(chest); rig.chest = chest;
  const skirt = new THREE.Group(); root.add(skirt); rig.skirt = skirt;
  const neckTop = S.neckY + 0.03 * u;
  add(fitMaster(torsoLoft(S, S.hipY - 0.04 * u, neckTop, 0, { steps: 12 }), 'torso'), mat(robe ? body.mat : tunicKey), chest);
  const torsoMat = body ? mat(body.mat, { as: kind === 'mail' ? (body.scale ? 'scale' : 'mail') : null, ...(kind === 'leather' && TEXTURES.on ? { tex: body.studs ? 'mail-brigandine' : 'leather-stitched' } : {}) }) : null;
  const hemY = robe ? 0.02 * u : kind === 'mail' ? S.hemY + 0.02 * u : kind === 'leather' ? S.hemY + 0.08 * u : S.hemY + 0.05 * u;
  // the skirt of whatever is worn below the belt: a mail skirt, a jerkin's tail, a tunic, a robe to the floor
  const hemKey = robe ? body.mat : kind === 'mail' ? body.mat : kind === 'leather' ? (body.shirt || tunicKey) : kind === 'plate' ? 'mail' : tunicKey;
  const hemMat = kind === 'mail' ? mat(body.mat, { as: body.scale ? 'scale' : 'mail', side: true }) : kind === 'plate' ? mat('steel', { as: 'mail', side: true }) : mat(hemKey, { side: true });
  {
    const steps = 10, y0 = S.waistY, rings = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, y = lerp(y0, hemY, t), yt = Math.max(y, S.keys[0][0]);
      const [w, d] = torsoAt(S, yt), fl = robe ? t * t * 0.17 * u + t * 0.03 * u : t * (kind === 'mail' ? 0.03 : 0.02) * u, fold = (robe ? t * 0.05 : t * 0.02) * (SCULPT.on && kind !== 'mail' ? 1.9 : 1);
      rings.push(ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), w + 0.012 * u + fl, w * d + 0.012 * u + fl * 0.85, 32, a => squarish(a) * (1 + fold * Math.cos(a * 9))));
    }
    add(fitMaster(loft(rings), 'skirt'), hemMat, skirt);
    if (body?.trim || robe) { const r = rings[rings.length - 1]; add(tube(r.map(p => p.clone().add(V(0, 0.004 * u, 0))), 0.008 * u, { closed: true, n: 6 }), mat(body?.trim || 'gold'), skirt); }
  }
  // the garment on the chest
  if (kind === 'mail' || kind === 'leather') {
    add(fitMaster(torsoLoft(S, S.waistY - 0.02 * u, neckTop - 0.01 * u, kind === 'mail' ? 0.012 * u : 0.009 * u, { steps: 10 }), 'torso'), torsoMat, chest);
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
    add(fitMaster(loft(rings), 'plate'), pm, chest);
    // the ridge down the breastplate, the rolled edges, and the lames below the waist
    const ridge = []; for (let i = 0; i <= 10; i++) { const y = lerp(S.waistY, S.shY - 0.04 * u, i / 10), [w, d] = torsoAt(S, y); ridge.push(V(0, y, w * d + 0.024 * u + 0.022 * u * Math.sin(i / 10 * Math.PI))); }
    add(tube(ridge, [0.004 * u, 0.006 * u], { n: 6 }), mat(body.trim || body.mat), chest);
    add(tube(rings[rings.length - 1].map(p => p.clone()), 0.008 * u, { closed: true, n: 6 }), mat(body.trim || body.mat), chest);
    add(tube(rings[0].map(p => p.clone()), 0.008 * u, { closed: true, n: 6 }), mat(body.trim || body.mat), chest);
    for (let k = 0; k < 3; k++) { const y0 = S.waistY - 0.035 * u - k * 0.045 * u, y1 = y0 - 0.05 * u; const g = loft([torsoRing(S, Math.max(y0, S.keys[0][0]), (0.03 + k * 0.006) * u, 32, 0, k * 0.008 * u), torsoRing(S, Math.max(y1, S.keys[0][0]), (0.034 + k * 0.006) * u, 32, 0, (k + 1) * 0.01 * u)]); add(fitMaster(g, 'lame'), mat(body.mat, { side: true }), skirt); }
  }
  if (body?.belt || kind === 'leather' || kind === 'mail' || robe) {
    const by = S.waistY - 0.005 * u, bk = robe ? (body.sash || body.trim || 'leather') : body?.belt || 'leatherDark';
    add(fitMaster(loft([torsoRing(S, by + 0.018 * u, 0.02 * u, 32), torsoRing(S, by - 0.018 * u, 0.022 * u, 32)]), 'belt'), mat(bk, { side: true }), chest);
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
    add(fitMaster(tube(pts, t => [0.0035 * u, lerp(0.06, 0.078, t) * u * 1], { n: 8, up: V(0, 0, 1) }), 'tabard'), mat(H.tabard, { side: true }), chest);
  }

  /* ---- arms and hands */
  const sleeveKey = body ? (body.sleeve || (robe ? body.mat : body.shirt || tunicKey)) : tunicKey;
  const gloves = L.hands, gloveKey = gloves ? gloves.mat : H.gloves || H.skin, bareTint = !gloves && KIND(gloveKey) === 'skin' ? skinTint : null;
  rig.arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * S.shX, S.shY, 0); root.add(sh);
    const ar = S.armR;
    const up = [V(0, 0.02 * u, 0), V(0, -S.upper * 0.5, 0.004 * u), V(0, -S.upper, 0)];
    add(fitMaster(tube(curve(up, 10), t => [lerp(ar * 1.25, ar * 0.85, t) + Math.sin(t * Math.PI) * ar * 0.12, lerp(ar * 1.2, ar * 0.85, t)], { n: 12 }), 'sleeve'), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh);
    add(sph(ar * 1.35, 16, 12), mat(kind === 'mail' || kind === 'plate' ? 'steel' : sleeveKey, kind === 'mail' || kind === 'plate' ? { as: 'mail' } : {}), sh, -side * ar * 0.25, 0.01 * u, 0).scale.set(1, 1.05, 0.95);
    const elbow = new THREE.Group(); elbow.position.y = -S.upper; sh.add(elbow);
    const fore = [V(0, 0, 0), V(0, -S.fore * 0.5, 0.003 * u), V(0, -S.fore, 0)];
    const foreRad = t => { const r = lerp(ar * 0.9, ar * 0.62, t) + Math.sin(clamp01(t / 0.6) * Math.PI) * ar * 0.1; return [r, r * 0.88]; };
    add(fitMaster(tube(curve(fore, 10), foreRad, { n: 12 }), 'forearm'), mat(robe ? body.mat : sleeveKey), elbow);
    if (robe) add(fitMaster(tube([V(0, -S.fore * 0.25, 0), V(0, -S.fore * 0.8, 0.01 * u), V(0, -S.fore * 1.05, 0.02 * u)], t => [lerp(ar * 1.1, ar * 1.7, t * t), lerp(ar * 1.1, ar * 1.6, t * t)], { n: 16, capA: false, capB: false }), 'robesleeve'), mat(body.mat, { side: true }), elbow);
    if (kind === 'plate') { add(fitMaster(tube([V(0, -S.fore * 0.15, 0), V(0, -S.fore * 0.9, 0)], t => [lerp(ar * 1.05, ar * 0.8, t), lerp(ar * 1.0, ar * 0.76, t)], { n: 12 }), 'vambrace'), torsoMat, elbow); add(sph(ar * 0.95, 12, 8), torsoMat, elbow); }
    const hand = new THREE.Group(); hand.position.y = -S.fore; elbow.add(hand);
    const grip = buildHand(hand, side, mat(gloveKey, { tint: bareTint }), gloves, u * S.hand, fx, gripRadius(L, side, uw), side === 1 ? L.ring : null);
    if (side === 1 && L.ring) rig.ring = true;
    // pauldrons: three lames over the shoulder
    const pk = body?.pauldrons || (kind === 'plate' ? body.mat : null);
    if (pk) for (let k = 0; k < 3; k++) { const r = ar * (2.0 - k * 0.22); const p = add(fitMaster(sph(r, 18, 10, 0, TAU, 0, Math.PI * 0.42), 'pauldron'), mat(pk, { side: true }), sh, side * 0.006 * u, 0.025 * u - k * 0.03 * u, 0); p.rotation.z = -side * (0.35 + k * 0.12); p.scale.set(1.1, 0.75, 1); if (body?.trim && k === 0) add(tube(ellipse(V(0, Math.cos(Math.PI * 0.42) * r, 0), V(1, 0, 0), V(0, 0, 1), Math.sin(Math.PI * 0.42) * r, Math.sin(Math.PI * 0.42) * r, 24), 0.005 * u, { closed: true, n: 6 }), mat(body.trim), p); }
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
  faceM.userData.face = true;
  // the face lives: blinks, a talking mouth, expressions (faceRig)
  { const P0 = (MAT[H.skin] || MAT.skin).pal, sk = faceName ? FACES[faceName].skin : P0[3].map((v, i) => v + (P0[4][i] - v) * 0.35);
    rig.faceCtl = faceRig(faceM, faceMarksOf(faceName, S.chibi), new THREE.Color().setRGB(sk[0] / 255, sk[1] / 255, sk[2] / 255, THREE.SRGBColorSpace), !!H.shade || (blind && !faceName)); }
  const skull = sph(r, 64, 40);
  const relief = SCULPT.on ? faceRelief(faceMarksOf(faceName, S.chibi), S.chibi ? 0.6 : 1) : null;
  { const p = skull.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (relief) { const ux = x / r, uy = y / r, uz = z / r; if (uz > 0) { const d = relief(ux, uy) * uz; x += ux * d * r * 0.3; y += uy * d * r * 0.3; z += d * r; } } const low = clamp01(-y / r); const k = 1 - low * low * 0.3 * (z > 0 ? 1 : 0.6); x *= k * 0.94; z *= (z > 0 ? 1 - low * 0.05 : 1.04); if (z > 0) z += low * low * r * 0.08 * (1 - Math.abs(x) / r); y *= 1.06; p.setXYZ(i, x, y, z); } skull.computeVertexNormals(); }
  add(skull, faceM, head);
  for (const s of [-1, 1]) {
    if (H.ears === 'long') { const e = add(tube(curve([V(s * r * 0.86, -r * 0.05, -r * 0.1), V(s * r * 1.2, r * 0.18, -r * 0.25), V(s * r * 1.45, r * 0.42, -r * 0.42)]), t => [lerp(r * 0.16, 0.001, t), lerp(r * 0.06, 0.001, t)], { n: 8 }), skinM, head); }
    else add(sph(r * 0.17, 10, 8), skinM, head, s * r * 0.9, -r * 0.08, -r * 0.08).scale.set(0.5, 1, 0.8);
  }
  // the cloth band round the head (with Chris's face it sits over the blindfold he painted, a little higher)
  if (blind) { const b0 = faceName ? 0.27 : 0.12, b1 = faceName ? -0.06 : -0.22; add(lathe([[r * 1.0, r * b0], [r * 1.03, r * b0], [r * 1.03, r * b1], [r * 1.0, r * b1]], { n: 40, sx: 0.96 }), mat(H.blindfold), head, 0, 0, 0.004 * u); }
  const HL = L.head, look = HL?.look;
  const wrap = !HL && (H.headwrap || H.turban);
  // the townsfolk's hats cover the hair as a hood (wrap, fez, veil) or as a brimmed hat (cap, hat) does
  const hairLook = wrap || look === 'wrap' || look === 'fez' || look === 'veil' ? 'hood' : look === 'cap' || look === 'hat' ? 'kettle' : look;
  const covers = hairLook === 'helm' || hairLook === 'coif' || hairLook === 'hood' || hairLook === 'kettle';
  buildHair(head, H, r, covers, hairLook, strHash(heroKey));
  if (H.beard) add(sph(r * 1.02, 24, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.4), mat(H.hairMat, { side: true }), head).rotation.y = Math.PI;
  if (HL) buildHeadgear(head, root, HL, arts.head, r, S, u, fx);
  buildFoeLooks({ H, rig, S, u, r, head, chest, root, look, wrap, kind, robe, fx, faceName, L });

  /* ---- the identity's cloth: mantle, cloak, quiver */
  if ((H.mantle || H.pelt) && look !== 'hood' && look !== 'coif') {
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.01 * u, S.shY - 0.085 * u, t); rings.push(torsoRing(S, y, (0.018 + t * 0.022) * u, 32, t * 0.05, 0)); }
    add(fitMaster(loft(rings), 'mantle'), mat(H.mantle || H.pelt, { side: true }), chest);
  }
  if (H.cloak && !robe) {
    const cape = new THREE.Group(); cape.position.set(0, S.shY - 0.02 * u, 0); root.add(cape); rig.cape = cape;
    const rows = 12, cols = SCULPT.on ? (Q.d > 1 ? 40 : 24) : 14, rings = [], [w0, d0] = torsoAt(S, S.shY - 0.04 * u), drop = S.shY - 0.18 * u;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, y = -drop * t, row = [];
      for (let j = 0; j <= cols; j++) { const a = lerp(-1, 1, j / cols), wide = lerp(w0 + 0.02 * u, w0 + 0.12 * u, t), deep = SCULPT.on ? (Math.sin(a * 9 + 0.7) * 0.022 + Math.sin(a * 17 + t * 3) * 0.008) * u * t * t : 0; const x = a * wide, behind = -(Math.sqrt(Math.max(0, 1 - a * a * 0.85)) * (w0 * d0 + 0.04 * u)) - t * 0.08 * u; row.push(V(x, y, behind + Math.sin(a * 7 + 1) * 0.012 * u * t + deep)); }
      rings.push(row);
    }
    // two halves, hinged, so the hem swings further than the shoulders
    add(fitMaster(loft(rings.slice(0, 7), { closed: false }), 'cape', { v0: 0, v1: 0.5 }), mat(H.cloak, { side: true }), cape);
    const mid = rings[6].reduce((a, p) => a.add(p), V()).multiplyScalar(1 / rings[6].length), capeLow = new THREE.Group(); capeLow.position.copy(mid); cape.add(capeLow); rig.capeLow = capeLow;
    add(fitMaster(loft(rings.slice(5).map(row => row.map(p => p.clone().sub(mid))), { closed: false }), 'cape', { v0: 5 / 12, v1: 1 }), mat(H.cloak, { side: true }), capeLow); // one row of overlap hides the hinge
    rig.danglers.push({ node: cape, posed: true, x: [0, 1.25], z: [-0.4, 0.4], k: 22, damp: 0.3, drag: 3, acc: 0.6 }, { node: capeLow, x: [-0.05, 0.6], z: [-0.3, 0.3], k: 30, damp: 0.3, drag: 1.5, acc: 0.4 });
    add(tube(curve([V(-w0 * 0.85, 0.01 * u, 0.02 * u), V(0, -0.02 * u, w0 * d0 + 0.03 * u), V(w0 * 0.85, 0.01 * u, 0.02 * u)], 12), 0.007 * u, { n: 6 }), mat(H.cloak), cape);
  }
  if (H.quiver) swingBlock(root, V(0.09 * u, S.shY - 0.06 * u, -(torsoAt(S, S.shY - 0.15 * u)[0] * torsoAt(S, S.shY - 0.15 * u)[1] + 0.05 * u)), { x: [-0.12, 0.35], z: [-0.25, 0.25], k: 55, damp: 0.3, drag: 0.6 }, () => {
    const q = new THREE.Group(); const [w, d] = torsoAt(S, S.shY - 0.15 * u); q.position.set(0.02 * u, S.shY - 0.2 * u, -(w * d + 0.05 * u)); q.rotation.z = -0.45; root.add(q);
    add(tube([V(0, -0.2 * u, 0), V(0, 0.16 * u, 0)], t => [lerp(0.032, 0.04, t) * u, lerp(0.03, 0.036, t) * u], { n: 14 }), mat(H.quiver), q);
    add(tube(ellipse(V(0, 0.16 * u, 0), V(1, 0, 0), V(0, 0, 1), 0.04 * u, 0.036 * u, 16), 0.005 * u, { closed: true, n: 6 }), mat('leatherDark'), q);
    for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * 0.018 * u, z = (i < 3 ? -1 : 1) * 0.012 * u; add(tube([V(x, 0.1 * u, z), V(x * 1.3, 0.25 * u, z * 1.2)], 0.003 * u, { n: 5 }), mat('wood'), q); add(wedge([[0, 0], [0.012 * u, 0.02 * u], [0, 0.05 * u], [-0.012 * u, 0.02 * u]], 0.002 * u), mat(H.fletch || 'clothWhite', { side: true }), q, x * 1.3, 0.21 * u, z * 1.2).rotation.y = i; }
  });

  /* ---- the amulet on its chain */
  if (L.amulet) {
    const A2 = L.amulet, cy = S.shY - 0.13 * u, [w, d] = torsoAt(S, cy), off = kind === 'plate' ? 0.05 : kind === 'mail' ? 0.02 : 0.014;
    // over a mantle or pelt, not under it (November 20 audit: the chain vanished under Alondra's mantle)
    const mantled = (H.mantle || H.pelt) && look !== 'hood' && look !== 'coif', mTop = S.neckY + 0.01 * u, mBot = S.shY - 0.085 * u;
    const overM = yy => (mantled && yy > mBot - 0.01 * u ? (0.018 + 0.022 * clamp01((mTop - yy) / (mTop - mBot))) * u + 0.006 * u : 0);
    const pts = []; for (let i = 0; i <= 16; i++) { const a = lerp(-1, 1, i / 16); const yy = lerp(neckTop - 0.02 * u, cy, 1 - a * a); const [ww, dd] = torsoAt(S, yy); pts.push(V(a * ww * 0.55, yy, Math.sqrt(1 - (a * 0.55) ** 2) * ww * dd + Math.max(off * u, overM(yy)) + (1 - a * a) * 0.006 * u)); }
    for (let i = 0; i < pts.length - 1; i++) { const m = pts[i].clone().lerp(pts[i + 1], 0.5), l = add(ring((A2.style === 'office' ? 0.009 : 0.006) * u, (A2.style === 'office' ? 0.0028 : 0.0016) * u, 10), mat(A2.chain || 'gold'), chest, m.x, m.y, m.z); l.lookAt(chest.localToWorld(pts[i + 1].clone())); l.rotation.z += i % 2 ? Math.PI / 2 : 0; }
    const pd = new THREE.Group(); pd.position.set(0, cy - 0.016 * u, Math.max(w * d + off * u, w * d + overM(cy)) + 0.012 * u); chest.add(pd);
    buildPendant(pd, { ...(arts.amulet?.p || {}), ...A2 }, u, fx);
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
      const pouch = new THREE.Group(); pouch.position.set(0, -0.012 * u, 0); pouch.rotation.y = -0.7; const pp = new THREE.Group(); pp.position.set(px, by + 0.012 * u, pz); chest.add(pp); pp.add(pouch);
      rig.danglers.push({ node: pp, x: [-0.45, 0.2], z: [-0.4, 0.05], k: 70, damp: 0.3, drag: 0.5 });
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
  // the skirt turns about the waist (it turned about the feet), and swings a little
  skirt.position.y = S.waistY; for (const c of skirt.children) c.position.y -= S.waistY;
  rig.danglers.unshift({ node: skirt, posed: true, x: [-0.1, 0.12], z: [-0.07, 0.07], k: 80, damp: 0.45, drag: 0.5, acc: 0.3 });
  const keep = new Set([group, root, chest, skirt, head, ...rig.legs, ...rig.arms.flatMap(a => [a.sh, a.elbow, a.hand, a.grip]), ...rig.danglers.map(d => d.node)]);
  if (rig.cape) keep.add(rig.cape);
  if (rig.weapon) keep.add(rig.weapon);
  if (rig.offhand) { keep.add(rig.offhand); if (rig.offhand.userData.float) keep.add(rig.offhand.userData.float); }
  rig.draws = bake(group, keep);
  SWING = null;
  if (o.lite) rig.draws = liteFigure(group, rig);
  root.scale.setScalar(SHOWN_H / S.total);
  rig.scale = SHOWN_H / S.total;
  setPose(rig, 'idle', 0);
  return { group, rig, fx, looks: L, face: (expr, seconds) => rig.faceCtl?.set(expr, seconds) };
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
    else swingBlock(chest, V(0.03 * u, y, front(y, 0.03 * u)), { x: [-0.6, 0.02], z: [-0.25, 0.25], k: 50, damp: 0.3, drag: 0.8 }, () => add(tube(curve([V(0.03 * u, y, front(y, 0.03 * u)), V(0.05 * u, y - 0.08 * u, front(y - 0.08 * u, 0.035 * u)), V(0.045 * u, y - 0.16 * u, front(y - 0.16 * u, 0.04 * u))], 8), [0.004 * u, 0.022 * u], { n: 6, up: V(0, 0, 1) }), m, chest));
  }
  if (H.wrapTail) swingBlock(root, V(0, S.neckY, -front(S.neckY, 0.03 * u)), { x: [-0.02, 0.7], z: [-0.3, 0.3], k: 35, damp: 0.3, drag: 1.4 }, () => add(tube(curve([V(0, S.neckY, -front(S.neckY, 0.03 * u)), V(0.02 * u, S.neckY - 0.15 * u, -front(S.neckY - 0.15 * u, 0.06 * u)), V(-0.01 * u, S.neckY - 0.35 * u, -front(S.neckY - 0.35 * u, 0.08 * u))], 10), [0.005 * u, 0.03 * u], { n: 6, up: V(0, 0, 1) }), mat(H.wrapTail, { side: true }), root));
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
  if (H.satchel) { strap(-1, H.satchel); const y = S.waistY - 0.06 * u, [w, d] = torsoAt(S, y); swingBlock(chest, V(w * 0.85, y + 0.04 * u, w * d * 0.35), { x: [-0.4, 0.15], z: [-0.05, 0.4], k: 60, damp: 0.3, drag: 0.5 }, () => { add(new THREE.BoxGeometry(0.1 * u, 0.08 * u, 0.04 * u), mat(H.satchel), chest, w * 0.85, y, w * d * 0.35).rotation.y = 0.9; }); }
  if (H.sack) { const [w, d] = torsoAt(S, S.shY - 0.15 * u); swingBlock(chest, V(0.02 * u, S.shY - 0.07 * u, -(w * d + 0.06 * u)), { x: [-0.05, 0.3], z: [-0.2, 0.2], k: 60, damp: 0.35, drag: 0.4 }, () => add(sph(0.11 * u, 14, 10), mat(H.sack), chest, 0.02 * u, S.shY - 0.18 * u, -(w * d + 0.08 * u)).scale.set(1, 1.2, 0.8)); add(tube(torsoRing(S, S.shY - 0.05 * u, 0.012 * u, 20), 0.004 * u, { closed: true, n: 5 }), mat('string'), chest); }
  // at the belt: a ledger, a coin purse, a lantern, bone charms
  const by = S.waistY - 0.04 * u, [bw, bd] = torsoAt(S, by);
  const hang = (g, top, side = 1) => { const P = new THREE.Group(); P.position.copy(g.position).add(V(0, top, 0)); chest.add(P); g.position.set(0, -top, 0); P.add(g); rig.danglers.push({ node: P, x: [-0.45, 0.2], z: side > 0 ? [-0.05, 0.45] : [-0.45, 0.05], k: 65, damp: 0.3, drag: 0.5 }); };
  if (H.ledger) { const g = new THREE.Group(); g.position.set(bw * 0.8, by - 0.03 * u, bd * bw * 0.5); g.rotation.y = 1.1; chest.add(g); hang(g, 0.05 * u); add(new THREE.BoxGeometry(0.075 * u, 0.1 * u, 0.025 * u), mat(H.ledger), g); add(new THREE.BoxGeometry(0.068 * u, 0.092 * u, 0.027 * u), mat('parchment'), g, 0.004 * u, 0, 0); }
  if (H.coins) { add(sph(0.025 * u, 10, 8), mat('leather'), chest, -bw * 0.55, by - 0.04 * u, bd * bw * 0.85).scale.set(1, 1.2, 0.8); for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.009 * u, 0.009 * u, 0.002 * u, 12), mat('gold'), chest, -bw * 0.5 + k * 0.006 * u, by - 0.075 * u - k * 0.004 * u, bd * bw * 0.95); }
  if (H.lantern && !L.offhand) { const g = new THREE.Group(); g.position.set(-bw * 0.95, by - 0.08 * u, 0.02 * u); chest.add(g); hang(g, 0.07 * u, -1); add(new THREE.BoxGeometry(0.04 * u, 0.06 * u, 0.04 * u), glow('amber', 1.6), g); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(tube([V(x * 0.022 * u, -0.032 * u, z * 0.022 * u), V(x * 0.022 * u, 0.032 * u, z * 0.022 * u)], 0.003 * u, { n: 4 }), mat('iron'), g); add(cone(0.032 * u, 0.025 * u, 8), mat('iron'), g, 0, 0.044 * u, 0); fx.glows.push({ obj: g.children[0], color: glowColor('amber'), power: 0.5 }); }
  if (H.charms) for (let k = 0; k < 4; k++) { const a = -0.6 + k * 0.4, x = Math.sin(a) * bw * 1.05, z = Math.cos(a) * bw * bd * 1.05; swingBlock(chest, V(x, by, z), { x: [-0.7, 0.1], z: [-0.4, 0.4], k: 90, damp: 0.2, drag: 0.4 }, () => { add(tube([V(x, by, z), V(x, by - 0.05 * u, z + 0.004 * u)], 0.0015 * u, { n: 3 }), mat('string'), chest); add(new THREE.OctahedronGeometry(0.01 * u, 0), mat(H.charms), chest, x, by - 0.058 * u, z + 0.004 * u).scale.set(0.7, 1.4, 0.5); }); }
  // the townsfolk's own looks (art/map-sprites.js NPC_LOOKS): an apron, a trinket at the hip, goggles or spectacles, a
  // row of bottles at the belt, a coil of rope over the shoulder, a clasp at the throat, a braided beard, icicles
  if (H.apron) { const pts = []; for (let i = 0; i <= 8; i++) { const y = lerp(S.shY - 0.12 * u, S.hemY - 0.1 * u, i / 8); pts.push(V(0, y, front(y, armour * u + 0.014 * u) + (y < S.waistY ? (S.waistY - y) * 0.15 : 0))); } add(tube(pts, t => [0.004 * u, lerp(0.075, 0.11, t) * u], { n: 8, up: V(0, 0, 1) }), mat(H.apron, { side: true }), chest); }
  const tk = H.trinket; if (tk) { const g = new THREE.Group(); g.position.set(bw * 0.85, by - 0.05 * u, bd * bw * 0.45); g.rotation.y = 1.0; chest.add(g); hang(g, 0.04 * u); const m = mat(tk.mat || 'leather');
    if (tk.kind === 'ledger' || tk.kind === 'book') { add(new THREE.BoxGeometry(0.075 * u, 0.1 * u, 0.025 * u), m, g); add(new THREE.BoxGeometry(0.068 * u, 0.092 * u, 0.027 * u), mat('parchment'), g, 0.004 * u, 0, 0); }
    else if (tk.kind === 'gourd' || tk.kind === 'bottle') { add(sph(0.035 * u, 12, 10), m, g).scale.set(1, 1.2, 1); add(tube([V(0, 0.035 * u, 0), V(0, 0.07 * u, 0)], 0.012 * u, { n: 8 }), m, g); add(sph(0.012 * u, 8, 6), mat('wood'), g, 0, 0.075 * u, 0); }
    else if (tk.kind === 'basket') { add(lathe([[0.035 * u, -0.045 * u], [0.05 * u, 0.02 * u], [0.052 * u, 0.03 * u]], { n: 16 }), mat(tk.mat || 'wood', { side: true, tex: 'wood-wicker' }), g); for (let k = 0; k < 6; k++) add(cone(0.008 * u, 0.06 * u, 5), mat(tk.herbs || 'moss'), g, Math.sin(k) * 0.025 * u, 0.05 * u, Math.cos(k) * 0.025 * u); }
    else if (tk.kind === 'key') { add(tor(0.012 * u, 0.003 * u, 6, 12), m, g); add(tube([V(0, -0.012 * u, 0), V(0, -0.05 * u, 0)], 0.003 * u, { n: 5 }), m, g); add(new THREE.BoxGeometry(0.012 * u, 0.006 * u, 0.004 * u), m, g, 0.006 * u, -0.046 * u, 0); }
    else add(sph(0.032 * u, 12, 10), m, g).scale.set(1, 1.25, 0.75); }
  if (H.bottleRow) H.bottleRow.forEach((k, i) => { const a = 0.5 + i * 0.35, x = Math.sin(a) * bw * 1.08, z = Math.cos(a) * bw * bd * 1.08; add(tube([V(x, by - 0.07 * u, z), V(x, by - 0.02 * u, z)], 0.011 * u, { n: 8 }), mat(k), chest); add(sph(0.006 * u, 6, 4), mat('wood'), chest, x, by - 0.012 * u, z); });
  if (H.goggles) for (const s of [-1, 1]) { const g2 = add(tor(r * 0.16, r * 0.04, 6, 16), mat(H.goggles), head, s * r * 0.3, r * 0.55, r * 0.86); g2.rotation.x = -0.5; add(new THREE.CircleGeometry(r * 0.15, 16), mat(H.lens || 'seaglass'), head, s * r * 0.3, r * 0.55, r * 0.865).rotation.x = -0.5; }
  if (H.spectacles) for (const s of [-1, 1]) { const p = V(Math.sin(s * 0.45) * r * 0.97, -r * 0.06, Math.cos(s * 0.45) * r * 1.06); add(tor(r * 0.14, r * 0.02, 6, 16), mat('bronze'), head, p.x, p.y, p.z).rotation.y = s * 0.45; }
  if (H.slungChain) { const c = add(tor(0.12 * u, 0.012 * u, 8, 24), mat(H.slungChain), chest, 0, S.shY - 0.12 * u, 0); c.rotation.set(Math.PI / 2, 0.75, 0); c.scale.set(1.25, 0.9, 1); }
  if (H.clasp) add(lathe([[0, 0.003 * u], [0.014 * u, 0.002 * u], [0.015 * u, 0], [0, -0.002 * u]], { n: 16 }), mat(H.clasp), chest, 0, S.neckY - 0.01 * u, front(S.neckY - 0.01 * u, 0.04 * u)).rotation.x = Math.PI / 2;
  if (H.beard === 'braid') add(tube(curve([V(0, -r * 0.9, r * 0.7), V(0, -r * 1.3, r * 0.8), V(0, -r * 1.75, r * 0.75)], 8), t => r * 0.14 * (1 - t * 0.5), { n: 8, shape: (a, t) => 1 + 0.12 * Math.sin(t * 40) }), mat(H.hairMat), head);
  if (H.icicles) for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.22; add(cone(r * 0.04, r * 0.35, 5), mat(H.icicles), head, Math.sin(a) * r * 0.8, -r * 1.0, Math.cos(a) * r * 0.7).rotation.x = Math.PI; }
  // the Hollow Council hold the gift: a light in the off hand
  if (H.giftHeld && !L.offhand) { const o = add(sph(0.035 * u, 16, 12), glow('arcane', 2.2), rig.armL.hand, 0, -0.08 * u, 0.02 * u); fx.glows.push({ obj: o, color: glowColor('arcane'), power: 0.9 }); }
}

/* ------------------------------------------------------------------ the lite figure, for phones (November 20) */
// liteFigure(group, rig): the whole figure in two draws. Every piece (already joined by material into the nodes that
// move) is merged into one skinned mesh whose "bones" are those same nodes, so setPose moves it exactly as before; each
// piece keeps its own colour, shine, roughness and glow per vertex (one material for everything), and the face keeps its
// picture in a second mesh. The grain pictures and small see-through decals are left off. Returns the draw count.
const LITE_MAT = (() => {
  let m = null;
  return () => {
    if (m) return m;
    m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, metalness: 1 });
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec2 mr; attribute vec3 em; varying vec2 vMr; varying vec3 vEm;\nvoid main() {\nvMr = mr; vEm = em;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec2 vMr; varying vec3 vEm;\nvoid main() {')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = vMr.x;')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vMr.y;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = vEm;');
    };
    m.customProgramCacheKey = () => 'aeth-lite';
    return m;
  };
})();
const AVG = new WeakMap();
function averageOf(tex) {
  if (AVG.has(tex)) return AVG.get(tex);
  const src = tex.image, c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(src, 0, 0, 8, 8);
  const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
  const col = new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
  AVG.set(tex, col); return col;
}
export function liteFigure(group, rig) {
  group.updateMatrixWorld(true);
  const G = group.matrixWorld.clone(), Gi = G.clone().invert();
  const bones = [], index = new Map(), main = [], face = [];
  const meshes = []; group.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
  const c = new THREE.Color();
  for (const o of meshes) {
    const m = o.material, owner = o.parent || group; // the node it moved with
    owner.remove(o);
    if (m.transparent && !m.userData.face) continue; // etched runes, glass glints: left off
    let bi = index.get(owner);
    if (bi === undefined) { bi = bones.length; bones.push(owner); index.set(owner, bi); }
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(Gi, o.matrixWorld));
    const n = g.attributes.position.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = bi; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    if (m.userData.face) { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k); face.push({ g, m }); continue; }
    const grain = m.userData.grain ? 0.9 : 1;
    c.copy(m.color || new THREE.Color(1, 1, 1)).multiplyScalar(grain);
    if (m.map?.image?.getContext) c.multiply(averageOf(m.map)); // a painted face (a shield's heraldry): its average colour
    const col = new Float32Array(n * 3), mr = new Float32Array(n * 2), em = new Float32Array(n * 3);
    const e = m.emissive ? m.emissive.clone().multiplyScalar(m.emissiveIntensity ?? 1) : new THREE.Color(0, 0, 0);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; mr[i * 2] = m.metalness ?? 0; mr[i * 2 + 1] = m.roughness ?? 0.8; em[i * 3] = e.r; em[i * 3 + 1] = e.g; em[i * 3 + 2] = e.b; }
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('mr', new THREE.Float32BufferAttribute(mr, 2)); g.setAttribute('em', new THREE.Float32BufferAttribute(em, 3));
    main.push(g);
  }
  // the bones are the nodes that move; their inverses are taken now, in the same pose the pieces were laid in
  group.updateMatrixWorld(true);
  const inverses = bones.map(b => new THREE.Matrix4().multiplyMatrices(Gi, b.matrixWorld).invert());
  const skeleton = new THREE.Skeleton(bones, inverses);
  let draws = 0;
  const skinned = (geo, mat) => { const sm = new THREE.SkinnedMesh(geo, mat); sm.bind(skeleton, new THREE.Matrix4()); sm.castShadow = sm.receiveShadow = true; sm.frustumCulled = false; group.add(sm); draws++; return sm; };
  if (main.length) skinned(mergeGeometries(main, false), LITE_MAT());
  if (face.length) { const fm = face[0].m, mat = new THREE.MeshStandardMaterial({ map: fm.map, roughness: 0.6 }); if (fm.userData.faceU) applyFaceShader(mat, fm.userData.faceU); skinned(mergeGeometries(face.map(f => f.g), false), mat); }
  rig.lite = true;
  return draws;
}


/* ------------------------------------------------------------------ pendants (November 20 audit: every style its own) */
// The amulet's own shape from its art (art/item-looks.js): a sun, a seal, a seed, an orrery, a lens, a heart, a bell, a
// cage of ribs, a coin, a deep-sea pearl, a chain of office; anything else a disc with its gem. Faces +z, hangs at 0.
function buildPendant(pd, P, u, fx) {
  const metal = P.metal || 'gold', M = mat(metal), s = u * (P.scale || 1), st = P.style;
  const glowM = key => { const c = glowColor(key || 'ember'); const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6 }); return m; };
  const glowOn = (o, key, power = 0.6) => fx.glows.push({ obj: o, color: glowColor(key || 'ember'), power });
  const disc = (r, t = 0.004, m = M) => add(lathe([[0, t * s], [r * 0.92 * s, t * 0.8 * s], [r * s, 0], [r * 0.92 * s, -t * 0.8 * s], [0, -t * s]], { n: 28 }), m, pd).rotation.x = Math.PI / 2;
  const ringAt = (r, t, m = M, z = 0) => add(tor(r * s, t * s, 6, 28), m, pd, 0, 0, z * s);
  if (st === 'sun') {
    disc(0.024); ringAt(0.024, 0.003, mat(P.frame || metal));
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, long = i % 2 === 0; add(wedge([[0, -0.004 * s], [(long ? 0.018 : 0.011) * s, 0], [0, 0.004 * s]], 0.003 * s), mat(P.rays || metal), pd, Math.cos(a) * 0.024 * s, Math.sin(a) * 0.024 * s, 0).rotation.z = a; }
    if (P.core && isEmit(P.core)) glowOn(add(sph(0.006 * s, 10, 8), glowM(P.core), pd, 0, 0, 0.004 * s), P.core);
    if (P.glyph) glowOn(ringAt(0.017, 0.0012, glowM(P.glyph), 0.004), P.glyph, 0.4);
    gem(P.gem, 0.011 * s, pd, 0, 0, 0.006 * s, metal);
  } else if (st === 'seal') {
    disc(0.026, 0.006); ringAt(0.026, 0.003, mat(P.frame || metal));
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(new THREE.BoxGeometry(0.004 * s, 0.009 * s, 0.002 * s), mat(P.frame || metal), pd, Math.cos(a) * 0.019 * s, Math.sin(a) * 0.019 * s, 0.006 * s).rotation.z = a; }
    if (P.glyph) glowOn(ringAt(0.014, 0.0013, glowM(P.glyph), 0.006), P.glyph, 0.4);
    gem(P.gem, 0.01 * s, pd, 0, 0, 0.007 * s, metal);
  } else if (st === 'seed') {
    // a seed like a teardrop of thorn-wood, veins of light, a leaf and a bud at its stem
    const sd = add(lathe([[0, -0.034 * s], [0.012 * s, -0.026 * s], [0.017 * s, -0.012 * s], [0.015 * s, 0.002 * s], [0.007 * s, 0.012 * s], [0, 0.016 * s]], { n: 20 }), mat(P.seed || 'thorn'), pd, 0, -0.01 * s, 0); sd.scale.z = 0.7;
    if (P.veins && P.glow) for (let i = 0; i < 3; i++) glowOn(add(tube(curve([V((i - 1) * 0.006 * s, 0.004 * s, 0.011 * s), V((i - 1) * 0.008 * s, -0.016 * s, 0.012 * s), V((i - 1) * 0.004 * s, -0.036 * s, 0.006 * s)], 8), 0.0012 * s, { n: 4 }), glowM(P.glow), pd), P.glow, 0.3);
    add(tube(curve([V(0, 0.006 * s, 0), V(0.002 * s, 0.016 * s, 0), V(-0.002 * s, 0.024 * s, 0)], 6), 0.0018 * s, { n: 5 }), mat(P.stem || 'moss'), pd);
    add(wedge([[0, 0], [0.008 * s, 0.006 * s], [0.016 * s, 0.004 * s], [0.008 * s, -0.002 * s]], 0.0015 * s), mat(P.leaf || 'moss', { side: true }), pd, 0.001 * s, 0.018 * s, 0.002 * s).rotation.z = 0.3;
    if (P.bud) glowOn(add(sph(0.004 * s, 8, 6), glowM(P.bud), pd, -0.003 * s, 0.025 * s, 0), P.bud, 0.3);
    gem(P.gem, 0.006 * s, pd, 0, 0.004 * s, 0.012 * s, metal);
  } else if (st === 'orrery') {
    // an armillary: a storm-glass core, rings at three tilts, a planet riding one of them
    glowOn(add(sph(0.009 * s, 14, 10), P.core ? glowM(P.core) : mat(P.gem || 'stormglass'), pd), P.core || 'storm', 0.6);
    for (const [rx, ry] of [[0, 0], [1.1, 0.3], [0.5, 1.2]]) { const r = add(tor(0.022 * s, 0.0016 * s, 6, 32), M, pd); r.rotation.set(rx, ry, 0); }
    add(sph(0.004 * s, 10, 8), mat(P.planet || 'topaz'), pd, 0.022 * s, 0, 0);
    add(tube([V(0, 0.022 * s, 0), V(0, 0.03 * s, 0)], 0.0015 * s, { n: 5 }), M, pd);
  } else if (st === 'lens') {
    ringAt(0.022, 0.0035); add(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.003 * s, 28), mat(P.lens || 'glass'), pd).rotation.x = Math.PI / 2;
    if (P.water) glowOn(add(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.0035 * s, 20), glowM(P.water), pd), P.water, 0.4);
    if (P.runes) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(new THREE.BoxGeometry(0.002 * s, 0.005 * s, 0.002 * s), glowM(P.runes), pd, Math.cos(a) * 0.027 * s, Math.sin(a) * 0.027 * s, 0).rotation.z = a; }
  } else if (st === 'heart') {
    const hs = new THREE.Shape(); hs.moveTo(0, -0.026 * s); hs.bezierCurveTo(0.03 * s, -0.006 * s, 0.018 * s, 0.02 * s, 0, 0.008 * s); hs.bezierCurveTo(-0.018 * s, 0.02 * s, -0.03 * s, -0.006 * s, 0, -0.026 * s);
    const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.01 * s, bevelEnabled: true, bevelThickness: 0.003 * s, bevelSize: 0.003 * s, bevelSegments: 3, curveSegments: 16 }); hg.translate(0, 0, -0.005 * s);
    add(hg, mat(P.stone || 'amber'), pd);
    if (P.core) glowOn(add(sph(0.006 * s, 10, 8), glowM(P.core), pd, 0, -0.004 * s, 0.006 * s), P.core, 0.7);
    add(tube([V(-0.012 * s, 0.012 * s, 0.002 * s), V(0, 0.004 * s, 0.009 * s), V(0.012 * s, 0.012 * s, 0.002 * s)], 0.0016 * s, { n: 5 }), M, pd);
  } else if (st === 'bell') {
    add(lathe([[0, 0.018 * s], [0.006 * s, 0.016 * s], [0.01 * s, 0.006 * s], [0.013 * s, -0.008 * s], [0.017 * s, -0.016 * s], [0, -0.014 * s]], { n: 24 }), mat(metal, { side: true }), pd);
    add(tor(0.017 * s, 0.0015 * s, 6, 24), mat(P.trim || 'silver'), pd, 0, -0.016 * s, 0).rotation.x = Math.PI / 2;
    add(sph(0.004 * s, 8, 6), mat(P.clapper || 'silver'), pd, 0, -0.019 * s, 0);
    if (P.crack) glowOn(add(tube([V(0.004 * s, 0.012 * s, 0.008 * s), V(0.002 * s, 0.002 * s, 0.011 * s), V(0.006 * s, -0.01 * s, 0.014 * s)], 0.0009 * s, { n: 4 }), glowM(P.crack), pd), P.crack, 0.3);
    gem(P.gem, 0.004 * s, pd, 0, 0.012 * s, 0.006 * s, P.trim || metal);
  } else if (st === 'ribs') {
    // a cage of black iron ribs round a burning stone
    glowOn(add(sph(0.012 * s, 14, 10), mat(P.stone || 'ruby'), pd), P.core || 'ember', 0.7);
    if (P.core) add(sph(0.007 * s, 10, 8), glowM(P.core), pd);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; const r = add(tor(0.016 * s, 0.0018 * s, 6, 20, Math.PI * 1.6), M, pd); r.rotation.set(0, a, Math.PI * 0.7); }
    add(tube([V(0, 0.016 * s, 0), V(0, 0.026 * s, 0)], 0.0022 * s, { n: 5 }), M, pd);
  } else if (st === 'coin') {
    add(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.004 * s, 28), M, pd).rotation.x = Math.PI / 2; ringAt(0.019, 0.0015);
    for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.0015 * s, 0.012 * s, 0.002 * s), mat('dark'), pd, (i - 2) * 0.004 * s, 0, 0.002 * s).rotation.z = i === 4 ? 1.1 : 0;
  } else if (st === 'deep') {
    // a pearl in a nest of coral and barnacles, its light from the deep
    add(sph(0.012 * s, 16, 12), mat(P.pearl || 'pearl'), pd);
    if (P.glow && isEmit(P.glow)) glowOn(add(sph(0.014 * s, 12, 8), Object.assign(glowM(P.glow), { transparent: true, opacity: 0.35 }), pd), P.glow, 0.5);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(tube(curve([V(Math.cos(a) * 0.01 * s, Math.sin(a) * 0.01 * s, -0.004 * s), V(Math.cos(a) * 0.02 * s, Math.sin(a) * 0.02 * s, 0), V(Math.cos(a + 0.3) * 0.024 * s, Math.sin(a + 0.3) * 0.024 * s, 0.006 * s)], 6), t => 0.0025 * s * (1 - t * 0.6), { n: 5 }), mat(P.coral || 'rotwood'), pd); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; add(cone(0.003 * s, 0.004 * s, 6), mat(P.barnacles && MAT[P.barnacles] ? P.barnacles : 'bone'), pd, Math.cos(a) * 0.016 * s, Math.sin(a) * 0.016 * s, 0.004 * s).rotation.x = Math.PI / 2; }
  } else if (st === 'office') {
    // a mayor's badge: a heavy medallion, a stone of violet-black glass, a ring of tally cuts that glow
    disc(0.03, 0.006); ringAt(0.03, 0.004);
    if (P.tally) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; glowOn(add(new THREE.BoxGeometry(0.0016 * s, 0.006 * s, 0.002 * s), glowM(P.tally), pd, Math.cos(a) * 0.023 * s, Math.sin(a) * 0.023 * s, 0.006 * s), P.tally, 0.05); }
    gem(P.gem, 0.013 * s, pd, 0, 0, 0.008 * s, metal);
    if (P.glow) glowOn(add(sph(0.006 * s, 10, 8), glowM(P.glow), pd, 0, 0, 0.01 * s), P.glow, 0.5);
  } else {
    disc(0.024); ringAt(0.024, 0.0025, mat(P.frame || metal));
    gem(P.gem, 0.011 * s, pd, 0, 0, 0.006 * s, metal);
  }
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
function buildHand(hand, side, m, gloves, u, fx, gr = 0.012, ring = null) {
  const med = -side; // toward the middle of the body
  const pw = 0.042 * u, pl = 0.06 * u, pd = 0.018 * u;
  // the grip's centre: against the palm, as far out as the grip is thick (the fist opens round a thick haft)
  const gc = V(med * (pd * 0.55 + gr * 0.85), -0.07 * u - gr * 0.25, 0.004 * u);
  // palm and back of the hand
  add(fitMaster(tube([V(0, 0.005 * u, 0), V(0, -pl * 0.5, 0.002 * u), V(0, -pl, 0.004 * u)], t => [pd * (1.05 - t * 0.1), pw * (0.62 + t * 0.4)], { n: 14, up: V(1, 0, 0) }), 'glove'), m, hand);
  // fingers: four curls round the grip, stacked along z
  for (let f = 0; f < 4; f++) {
    const rad = (0.0068 - f * 0.0004) * u, z = (f - 1.5) * 0.0175 * u, R = gr + rad * 0.95;
    const pts = []; for (let i = 0; i <= 8; i++) { const a = lerp(0.2, 4.2, i / 8); pts.push(V(gc.x - med * Math.cos(a) * R, gc.y + Math.sin(a) * R * 0.95 - 0.004 * u, z * (1 + i * 0.01) + gc.z)); }
    add(fitMaster(tube(curve(pts, 12), t => rad * (1 - t * 0.2), { n: 8 }), 'finger'), m, hand);
  }
  // a ring on the ring finger (November 20: rings were never shown): a band round the finger where it leaves the palm,
  // its gem facing out
  if (ring) {
    const f = 2, rad = (0.0068 - f * 0.0004) * u, z = (f - 1.5) * 0.0175 * u + gc.z, R = gr + rad * 0.95, a = 0.55;
    const p = V(gc.x - med * Math.cos(a) * R, gc.y + Math.sin(a) * R * 0.95 - 0.004 * u, z), along = V(med * Math.sin(a), Math.cos(a) * 0.95, 0).normalize(), out = V(-med * Math.cos(a), Math.sin(a), 0).normalize();
    const metal = ring.metal || ring.mat || ring.p?.metal || 'gold', band = add(tor(rad * 1.2, rad * 0.32, 6, 16), mat(metal), hand, p.x, p.y, p.z);
    band.quaternion.setFromUnitVectors(V(0, 0, 1), along);
    const g = ring.gem || ring.p?.gem; if (g) gem(g, rad * 0.75, hand, p.x + out.x * rad * 1.4, p.y + out.y * rad * 1.4, p.z, metal, out);
  }
  // thumb over the fingers
  { const tr = 0.0085 * u, Rt = gr + tr * 0.9, pts = [V(-med * 0.004 * u, -0.022 * u, 0.026 * u)]; for (let i = 0; i <= 6; i++) { const a = lerp(-0.2, 2.1, i / 6); pts.push(V(gc.x - med * Math.cos(a) * Rt, gc.y + Math.sin(a) * Rt, gc.z + 0.034 * u - i * 0.002 * u)); } add(fitMaster(tube(curve(pts, 12), t => tr * (1 - t * 0.25), { n: 8 }), 'finger'), m, hand); }
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
  const groove = SCULPT.on && !covers ? (a => 1 + 0.16 * Math.cos(a * 4)) : null; // strands in clumps: a lock grooved along its length (not under headgear: the grooves would come through it)
  const lock = (pts, w0, d0, up, n = 12) => add(tube(curve(pts, n), t => [lerp(w0, r * 0.02, t * t) / thin, lerp(d0, r * 0.012, t)], { n: groove ? 12 : 8, up, shape: groove }), hm, head);
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
    const backPivot = V(0, r * 0.1, -r * 0.55), backLocks = [];
    for (let i = 0; i < nB; i++) {
      const lon = lerp(0.9, TAU - 0.9, i / (nB - 1)) + (rnd() - 0.5) * 0.12;
      const a = onSkull(latA, lon, kA), b = onSkull(-0.15, lon, 1.1), out = V(Math.sin(lon), 0, Math.cos(lon));
      const c = b.clone().add(V(0, -fall * (0.7 + rnd() * 0.35), 0)).addScaledVector(out, r * (long ? 0.25 : 0.06)).add(V(0, 0, long && Math.cos(lon) < 0 ? -r * 0.25 : 0));
      if (long && Math.cos(lon) < -0.15) backLocks.push([[a, b, c], out]); else lock([a, b, c], r * 0.24, r * 0.08, out);
    }
    // long hair down the back swings (the locks framing the face stay put)
    if (backLocks.length) swingBlock(head, backPivot, { x: [-0.05, 0.55], z: [-0.3, 0.3], k: 45, damp: 0.3, drag: 1.2, acc: 0.4 }, () => { for (const [pts, out] of backLocks) lock(pts, r * 0.24, r * 0.08, out); });
  } else if (long) {
    // under a helm: long hair falls from below its back rim
    const nB = Math.round(12 * (Q.d > 1 ? 1.6 : 1));
    swingBlock(head, onSkull(-0.8, Math.PI, 0.98), { x: [-0.05, 0.6], z: [-0.3, 0.3], k: 45, damp: 0.3, drag: 1.2, acc: 0.4 }, () => { for (let i = 0; i < nB; i++) {
      const lon = lerp(2.0, TAU - 2.0, i / (nB - 1)) + (rnd() - 0.5) * 0.1, out = V(Math.sin(lon), 0, Math.cos(lon));
      const a = onSkull(-0.86, lon, 0.98), b = a.clone().addScaledVector(out, r * 0.18).add(V(0, -r * 0.35, 0)), c = b.clone().add(V(0, -r * 1.6 * (0.8 + rnd() * 0.3), -r * 0.2));
      lock([a, b, c], r * 0.22, r * 0.08, out);
    } });
  }
  if (tail) {
    const base = helm ? onSkull(-0.85, Math.PI, 1.02) : kettle ? onSkull(0.02, Math.PI, 1.05) : onSkull(0.1, Math.PI, 1.08);
    add(tor(r * 0.12, r * 0.04, 6, 14), mat('leatherDark'), head, base.x, base.y, base.z - r * 0.04);
    swingBlock(head, base, { x: [-0.1, 0.9], z: [-0.5, 0.5], k: 38, damp: 0.25, drag: 1.4, acc: 0.5 }, () => { if (style === 'pony') add(tube(curve([base, base.clone().add(V(0, -r * 0.4, -r * 0.35)), base.clone().add(V(0, -r * 1.5, -r * 0.3)), base.clone().add(V(0, -r * 2.2, -r * 0.1))], 16), t => [r * 0.22 * (1 - t * 0.7) * (1 + Math.sin(t * Math.PI) * 0.3), r * 0.16 * (1 - t * 0.7)], { n: 10 }), hm, head);
    else for (let i = 0; i < 9; i++) { const t = i / 8; add(sph(r * 0.15 * (1 - t * 0.4), 10, 8), hm, head, base.x + (i % 2 ? 0.03 : -0.03) * r, base.y - r * 0.25 - i * r * 0.24, base.z - r * 0.25 + t * r * 0.1).scale.set(1.2, 0.9, 1); } });
  }
}

/* ------------------------------------------------------------------ helms, hoods, crowns */
function buildHeadgear(head, root, HL, art, r, S, u, fx) {
  const look = HL.look, metalKey = HL.mat || HL.metal || 'steel';
  const trim = HL.trim ? mat(HL.trim) : null;
  const T = (y, k = 1.13) => tube(ellipse(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), r * k * 0.97, r * k, 40), 0.008 * u, { closed: true, n: 6 });
  if (look === 'kettle') {
    const m = mat(metalKey, { side: true });
    add(fitMaster(lathe([[0, r * 1.2], [r * 0.45, r * 1.15], [r * 0.82, r * 0.98], [r * 1.06, r * 0.62], [r * 1.12, r * 0.28], [r * 1.14, r * 0.2], [r * 1.5, r * 0.12], [r * 1.78, r * 0.0], [r * 1.82, -r * 0.03], [r * 1.76, -r * 0.01], [r * 1.12, r * 0.13]], { n: 40, sx: 0.97 }), 'kettle'), m, head);
    add(tube(curve([V(0, r * 0.3, r * 1.13), V(0, r * 1.2, 0), V(0, r * 0.3, -r * 1.13)], 20), [r * 0.04, r * 0.07], { n: 6, up: V(1, 0, 0) }), mat(metalKey), head);
    if (trim) add(T(r * 0.24, 1.15), trim, head);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(sph(0.0045 * u, 6, 4), mat(HL.trim || metalKey), head, Math.sin(a) * r * 1.1, r * 0.34, Math.cos(a) * r * 1.13); }
  } else if (look === 'helm') {
    const m = mat(metalKey, { side: true });
    add(fitMaster(lathe([[0, r * 1.2], [r * 0.55, r * 1.13], [r * 0.93, r * 0.86], [r * 1.12, r * 0.42], [r * 1.15, r * 0.24]], { n: 40, sx: 0.97 }), 'helm', { v1: 0.432 }), m, head);
    // the eye slit runs wide across the face; below it a narrow opening for the nose and mouth (a T)
    add(fitMaster(lathe([[r * 1.15, r * 0.24], [r * 1.16, -r * 0.05]], { n: 32, sx: 0.97, phi0: 1.05, phiLen: TAU - 2.1 }), 'helm', { u0: 1.05 / TAU, u1: 1 - 1.05 / TAU, v0: 0.432, v1: 0.563 }), m, head);
    add(fitMaster(lathe([[r * 1.16, -r * 0.05], [r * 1.14, -r * 0.45], [r * 1.06, -r * 0.8], [r * 0.95, -r * 1.02]], { n: 32, sx: 0.97, phi0: 0.32, phiLen: TAU - 0.64 }), 'helm', { u0: 0.32 / TAU, u1: 1 - 0.32 / TAU, v0: 0.563 }), m, head);
    // a brow ridge over the slit and a rim round the opening
    add(tube(curve([V(-Math.sin(1.05) * r * 1.16 * 0.97, r * 0.26, Math.cos(1.05) * r * 1.16), V(0, r * 0.3, r * 1.2), V(Math.sin(1.05) * r * 1.16 * 0.97, r * 0.26, Math.cos(1.05) * r * 1.16)], 20), [0.007 * u, 0.012 * u], { n: 6 }), mat(HL.trim || metalKey), head);
    for (const sd of [-1, 1]) add(tube(curve([V(sd * Math.sin(0.32) * r * 1.17 * 0.97, -r * 0.05, Math.cos(0.32) * r * 1.17), V(sd * Math.sin(0.32) * r * 1.13 * 0.97, -r * 0.5, Math.cos(0.32) * r * 1.13), V(sd * Math.sin(0.32) * r * 0.97 * 0.97, -r * 1.0, Math.cos(0.32) * r * 0.97)], 12), 0.006 * u, { n: 6 }), mat(HL.trim || metalKey), head);
    add(T(r * 0.3, 1.16), trim || mat(metalKey), head);
    if (HL.crest) add(wedge([[-r * 0.95, 0], [-r * 0.55, r * 0.2], [0, r * 0.26], [r * 0.55, r * 0.2], [r * 0.85, 0]], 0.006 * u, null, { bevel: 0.002 * u }), mat(HL.crest), head, 0, r * 1.08, -r * 0.05).rotation.y = Math.PI / 2;
    if (HL.plume) for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.09; add(tube(curve([V(0, r * 1.15, -r * 0.2), V(a * r, r * 1.6, -r * 0.7), V(a * r * 1.5, r * 1.2, -r * 1.6 - Math.abs(a) * r)], 14), t => [r * 0.12 * Math.sin(Math.PI * Math.max(0.12, t)), r * 0.02], { n: 6, up: V(0, 1, 0) }), mat(HL.plume, { side: true }), head); }
  } else if (look === 'coif' || look === 'hood') {
    const cloth = look === 'hood' || (look === 'coif' && HL.mat && !MAT[HL.mat]?.metal), m = cloth ? mat(HL.mat || 'hoodGreen', { side: true }) : mat(metalKey, { as: 'mail', side: true, rep: 1.5 });
    const k = cloth ? 1.2 : 1.12;
    const hv = (1.1 * k - 0.62 * k) / (1.1 * k + 0.98); // where the crown ends along the hood's master (by height)
    add(fitMaster(lathe([[0, r * 1.1 * k], [r * 0.6 * k, r * 1.0 * k], [r * 1.0 * k, r * 0.62 * k]], { n: 40, sx: 0.97 }), 'hood', { v1: hv }), m, head);
    add(fitMaster(lathe([[r * 1.0 * k, r * 0.62 * k], [r * 1.05 * k, r * 0.1], [r * 0.95 * k, -r * 0.6], [r * 0.86 * k, -r * 0.98]], { n: 32, sx: 0.97, phi0: 0.95, phiLen: TAU - 1.9 }), 'hood', { u0: 0.95 / TAU, u1: 1 - 0.95 / TAU, v0: hv }), m, head);
    // the drape over the shoulders
    const rings = []; for (let i = 0; i <= 6; i++) { const t = i / 6, y = lerp(S.neckY + 0.04 * u, S.shY - 0.13 * u, t); rings.push(torsoRing(S, y, (0.02 + t * 0.025) * u, 32, cloth ? t * 0.06 : 0, 0)); }
    add(fitMaster(loft(rings), 'mantle'), m, root);
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
  if (look === 'wrap') { const m = mat(HL.mat || 'clothWhite', { side: true }), tall = HL.tall ? 1.25 : 1; for (let k = 0; k < 4; k++) { const b = add(tor(r * (1.06 - k * 0.12), r * 0.16, 8, 32), m, head, 0, r * (0.12 + k * 0.17 * tall), -r * 0.02); b.rotation.x = Math.PI / 2 + (k % 2 ? 0.1 : -0.06); b.scale.set(0.97, 1, 1); } add(sph(r * 0.95, 20, 10, 0, TAU, 0, Math.PI / 2), m, head, 0, r * 0.35 * tall, -r * 0.02).scale.set(1, 0.85 * tall, 1);
    if (HL.band) add(T(r * 0.3, 1.12), mat(HL.band), head); if (HL.gem) gem(HL.gem, r * 0.09, head, 0, r * 0.45, r * 1.12, 'gold'); if (HL.tail) add(tube(curve([V(0, r * 0.4, -r * 1.0), V(r * 0.1, -r * 0.4, -r * 1.25), V(-r * 0.05, -r * 1.6, -r * 1.2)], 10), [r * 0.04, r * 0.22], { n: 6, up: V(0, 0, 1) }), mat(HL.tail, { side: true }), head);
    if (HL.style === 'helm') add(lathe([[0, r * 1.35], [r * 0.5, r * 1.3], [r * 0.9, r * 1.0], [r * 1.0, r * 0.75]], { n: 32 }), mat(HL.metal || 'steel', { side: true }), head); }
  if (look === 'fez') { const m = mat(HL.mat || 'robeRed'); add(lathe([[r * 0.85, r * 0.35], [r * 0.72, r * 1.05], [0, r * 1.07]], { n: 28 }), m, head); if (HL.trim) add(T(r * 0.4, 0.88), mat(HL.trim), head); add(tube(curve([V(0, r * 1.07, 0), V(r * 0.3, r * 1.0, -r * 0.2), V(r * 0.45, r * 0.6, -r * 0.3)], 8), r * 0.025, { n: 4 }), mat('gold'), head); }
  if (look === 'cap') { const m = mat(HL.mat || 'leather', { side: true }); add(sph(r * 1.1, 24, 12, 0, TAU, 0, Math.PI * 0.45), m, head, 0, r * 0.05, -r * 0.03); add(lathe([[r * 0.9, 0], [r * 1.35, -r * 0.05]], { n: 24, phi0: -1.0, phiLen: 2.0 }), m, head, 0, r * 0.25, 0); if (HL.glow) { const lamp = add(sph(r * 0.16, 12, 8), new THREE.MeshStandardMaterial({ color: glowColor(HL.glow), emissive: glowColor(HL.glow), emissiveIntensity: 2 }), head, 0, r * 0.75, r * 0.95); fx.glows.push({ obj: lamp, color: glowColor(HL.glow), power: 0.6 }); add(tor(r * 0.17, r * 0.04, 6, 14), mat(HL.metal || 'bronze'), head, 0, r * 0.75, r * 0.95); } }
  if (look === 'hat') { const m = mat(HL.mat || 'parchment', { side: true }), witch = HL.style === 'witch';
    add(lathe([[r * (witch ? 1.6 : 2.0), -r * 0.02], [r * 1.5, r * 0.03], [r * 1.05, r * 0.25], [r * 1.0, r * 0.32]], { n: 40 }), m, head, 0, r * 0.25, 0);
    if (witch) add(tube(curve([V(0, r * 0.5, 0), V(0, r * 1.2, -r * 0.1), V(r * 0.15, r * 1.9, -r * 0.4), V(r * 0.35, r * 2.2, -r * 0.7)], 14), t => r * 0.95 * Math.pow(1 - t, 1.2) + r * 0.03, { n: 20 }), m, head);
    else add(lathe([[r * 1.02, 0], [r * 0.95, r * 0.45], [r * 0.6, r * 0.62], [0, r * 0.66]], { n: 32 }), m, head, 0, r * 0.52, 0);
    if (HL.band) add(T(r * 0.62, 1.0), mat(HL.band), head); }
  if (look === 'veil') { const m = mat(HL.mat || 'dark', { side: true }); add(lathe([[0, r * 1.18], [r * 0.7, r * 1.08], [r * 1.12, r * 0.6], [r * 1.18, 0], [r * 1.25, -r * 0.8], [r * 1.4, -r * 1.6]], { n: 40, phi0: 0.85, phiLen: TAU - 1.7 }), m, head); if (HL.trim) add(T(r * 0.62, 1.12), mat(HL.trim), head); }
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
  rig.faceCtl?.update(t, pose);
  if (rig.danglers) for (const d of rig.danglers) if (d.posed) d.node.rotation.set(0, 0, 0);
  poseBody(rig, pose, t, u);
  swing(rig, t);
}
function poseBody(rig, pose, t, u = 0) {
  const R = rig.armR, Lf = rig.armL, cls = rig.cls;
  const breathe = Math.sin(t * 2.1);
  rig.root.position.set(0, 0, 0); rig.root.rotation.set(0, 0, 0);
  rig.chest.scale.set(1 + breathe * 0.01, 1 + breathe * 0.006, 1 + breathe * 0.012);
  rig.head.rotation.set(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.45) * 0.16, 0);
  if (rig.cape) rig.cape.rotation.x = 0.04 + Math.sin(t * 1.6) * 0.02 + (pose === 'strike' ? Math.sin(u * Math.PI) * 0.15 : 0);
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
    if (rig.cape) rig.cape.rotation.x = 0.04 + Math.abs(s) * 0.03;
    if (rig.skirt) rig.skirt.rotation.x = -rig.root.rotation.x * 0.6;
  }
  // standing about (the townsfolk): arms easy, the weight shifting from foot to foot, a look round now and then;
  // talking: the same, with a hand that speaks and a nod
  if (pose === 'stand' || pose === 'talk') {
    const w = Math.sin(t * 0.8), k = rig.scale ? 1 / rig.scale : 1, talk = pose === 'talk';
    rig.root.position.x = w * 0.01 * k * 0.6; rig.root.rotation.z = w * 0.022;
    rig.legs[0].rotation.z = -0.03 + Math.max(0, w) * 0.05; rig.legs[1].rotation.z = 0.03 + Math.min(0, w) * 0.05;
    rig.legs[0].rotation.x = Math.max(0, -w) * 0.08; rig.legs[1].rotation.x = Math.max(0, w) * 0.08;
    const look = talk ? Math.sin(t * 0.5) * 0.12 : Math.sin(t * 0.37) * 0.45 + Math.sin(t * 0.13 + 1) * 0.3;
    rig.head.rotation.set(Math.sin(t * 0.7) * 0.04 + (talk ? Math.sin(t * 5.2) * 0.05 : 0), look, -w * 0.03);
    const pole = cls === 'spear' || cls === 'staff', holdsR = !!rig.weapon && !pole, holdsL = !!rig.offhand || cls === 'bow';
    if (!rig.weapon) { R.sh.rotation.set(-0.06, 0, -0.1); R.elbow.rotation.set(-0.3, 0, 0); R.hand.rotation.set(0.1, 0, 0); }
    else if (holdsR) { R.sh.rotation.set(-0.1, 0, -0.16); R.elbow.rotation.set(-0.4, 0, 0); R.hand.rotation.set(1.25, 0, 0); } // the blade or head hangs down by the leg
    if (!holdsL) { Lf.sh.rotation.set(-0.06, 0, 0.1); Lf.elbow.rotation.set(-0.3, 0, 0); Lf.hand.rotation.set(0.1, 0, 0); }
    if (talk) { const A = holdsR || pole ? (holdsL ? R : Lf) : R, sd = A === R ? 1 : -1; A.sh.rotation.set(-0.45 + Math.sin(t * 3.1) * 0.08, 0, -sd * 0.2); A.elbow.rotation.set(-1.25 + Math.sin(t * 4.3) * 0.25, 0, 0); A.hand.rotation.set(0.3, 0, sd * Math.sin(t * 2.7) * 0.4); }
    keepUpright(rig); return;
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
