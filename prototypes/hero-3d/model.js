// The 3D hero, built from the same data the game's pixel heroes are drawn from:
//   - proportions from the pixel rig (art/heroes.js BUILD: head, shoulders, waist, hem, legs, hands, in sprite px),
//   - who the hero is from art/hero-looks.js HERO_ART (skin, hair and its style, eyes, cloak, mantle, tabard, quiver),
//   - what they wear from art/item-looks.js lookFor() (the same "looks" the battle sprite and the walker draw: a
//     helm's shape, crest and plume, armour's kind, trim, pauldrons and runes, a sword's blade, guard and fuller...),
//   - every colour from the Forge's materials (art/forge.js MAT: six-step palettes; metals shine, gems glint, aspect
//     glows give light).
// buildHero(heroKey, gear) -> { group, rig, fx } where gear maps slot -> item (an ItemInstance, a relic id or art).
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';
import { HERO_ART } from '../../game/src/art/hero-looks.js';
import { BUILD, GROUND } from '../../game/src/art/heroes.js';
import { itemArt, lookFor, RARITY_LOOK, ASPECT_LOOK, SLOTS, rarityTier } from '../../game/src/art/item-looks.js';

export const PX = 1 / 38; // metres per sprite pixel: the hero stands about 1.1 m, as the sprite is about 42 px
const Y = py => (GROUND - py) * PX;

/* ------------------------------------------------------------------ materials from the Forge's palettes */
const sRGB = c => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const mixC = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const matCache = new Map();
let mailTex = null, scaleTex = null;
function patternTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 64, 64);
  if (kind === 'mail') {
    g.strokeStyle = '#ffffff'; g.lineWidth = 2;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { g.beginPath(); g.arc(x * 8 + (y % 2) * 4, y * 8 + 4, 3, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#202020'; g.lineWidth = 1;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { g.beginPath(); g.arc(x * 8 + (y % 2) * 4, y * 8 + 5.5, 3, 0.2, Math.PI - 0.2); g.stroke(); }
  } else {
    for (let y = -1; y < 9; y++) for (let x = -1; x < 9; x++) {
      const cx = x * 8 + (y % 2 ? 4 : 0), cy = y * 7;
      const gr = g.createRadialGradient(cx, cy, 1, cx, cy + 2, 7); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#303030');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 5.5, 0, Math.PI); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5);
  return t;
}
export function mat(key, o = {}) {
  key = MAT[key] ? key : (key && MAT[key.split(/[\^~]/)[0]] ? key.split(/[\^~]/)[0] : 'wool');
  const id = key + '|' + (o.tex || '') + '|' + (o.side || '');
  if (matCache.has(id)) return matCache.get(id);
  const M = MAT[key], p = M.pal;
  let m;
  if (M.emit) m = new THREE.MeshStandardMaterial({ color: sRGB(p[3]), emissive: sRGB(p[4]), emissiveIntensity: 1.5, roughness: 0.35 });
  else if (M.gem || M.prism) m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.3)), roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, emissive: sRGB(p[3]), emissiveIntensity: 0.45, flatShading: true });
  else if (M.metal) m = new THREE.MeshStandardMaterial({ color: sRGB(mixC(p[3], p[4], 0.55)), metalness: 0.92, roughness: Math.max(0.16, 0.5 - (M.ks || 1) * 0.15), envMapIntensity: 1.25 });
  else m = new THREE.MeshStandardMaterial({ color: sRGB(mixC(p[3], p[4], 0.3)), roughness: M.ks ? Math.max(0.35, 0.9 - M.ks * 0.4) : 0.95, metalness: 0 });
  // a tempered metal (+7 and up) glows along its body; +10 burns white
  if (M.temper >= 7) { m.emissive = sRGB(p[3]); m.emissiveIntensity = M.temper >= 10 ? 0.9 : 0.35 + (M.temper - 7) * 0.12; }
  if (o.tex === 'mail') { mailTex ??= patternTex('mail'); m.bumpMap = mailTex; m.bumpScale = 1.4; }
  if (o.tex === 'scale') { scaleTex ??= patternTex('scale'); m.bumpMap = scaleTex; m.bumpScale = 1.6; }
  if (o.side) m.side = THREE.DoubleSide;
  matCache.set(id, m);
  return m;
}
export const glowColor = key => sRGB((MAT[key] || MAT.ember).pal[4]);

/* ------------------------------------------------------------------ small geometry helpers */
const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent?.add(o); return o; };
const cyl = (r0, r1, h, seg = 14) => new THREE.CylinderGeometry(r0, r1, h, seg);
const sph = (r, ws = 18, hs = 12) => new THREE.SphereGeometry(r, ws, hs);
const torus = (R, r, seg = 24) => new THREE.TorusGeometry(R, r, 8, seg);
// a lathe round the y axis from [radius, y] points in sprite px, squashed front to back (depth)
// (points are put bottom to top, so the faces look outward whichever way they were listed)
const lathe = (pts, depth = 0.72, seg = 22) => { if (pts[0][1] < pts[pts.length - 1][1]) pts = pts.slice().reverse(); const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * PX, Y(y))), seg); g.scale(1, 1, depth); return g; };
// a flat outline extruded into a blade or a shield, in card px scaled by k
function extrude(points, depth, k, bevel = 0.35) {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x * k, y * k)));
  const g = new THREE.ExtrudeGeometry(s, { depth: depth * k, bevelEnabled: true, bevelThickness: bevel * k, bevelSize: bevel * k * 0.8, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -depth * k / 2);
  return g;
}
const gemOn = (key, r, parent, x, y, z) => key && mesh(new THREE.OctahedronGeometry(r, 0), mat(key), parent, x, y, z);

/* ------------------------------------------------------------------ the hero */
export function buildHero(heroKey, gear) {
  const A = HERO_ART[heroKey] || HERO_ART.warden;
  const H = A.H, b = BUILD[H.build] || BUILD.human;
  const L = {}, arts = {};
  for (const s of SLOTS) { const a = gear[s] ? itemArt(gear[s]) : null; arts[s] = a; const l = a ? lookFor(s, a) : null; if (l) L[s] = l; }

  const group = new THREE.Group();
  const rig = {}, fx = { glows: [], glints: [], aura: null, flame: false };
  const root = new THREE.Group(); group.add(root); rig.root = root;
  const cx = 16; // the rig's centre line in sprite px
  const X = px => (px - cx) * PX;
  const body = L.body, kind = body?.kind;
  const robe = kind === 'robe';
  const skin = mat(H.skin), hair = mat(H.hairMat);

  // ---- legs and boots
  const legMat = mat(robe ? body.mat : H.tunic === 'robeBark' || H.tunic === 'clothWhite' ? H.tunic : 'pants');
  const legX = 2.5;
  rig.legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * legX * PX, Y(b.legT), 0); root.add(leg); rig.legs.push(leg);
    const len = (b.legB - b.legT) * PX;
    mesh(cyl(2.0 * PX, 1.7 * PX, len), legMat, leg, 0, -len / 2, 0);
    // the boot: a shaft from its top to the ground and a foot pointing forward
    const F = L.feet, bm = mat(F ? F.mat : robe ? 'leather' : 'leatherDark');
    const top = Y(b.bootT) - Y(b.legT), gnd = -Y(b.legT);
    mesh(cyl(2.25 * PX, 2.1 * PX, top - gnd + 0.01), bm, leg, 0, (top + gnd) / 2, 0);
    const foot = mesh(new THREE.BoxGeometry(4 * PX, 2.4 * PX, 6 * PX), bm, leg, 0, gnd + 1.2 * PX, 1.4 * PX);
    foot.geometry.translate(0, 0, 0);
    if (F?.fold) mesh(torus(2.35 * PX, 0.7 * PX), mat(F.trim || F.mat), leg, 0, top, 0).rotation.x = Math.PI / 2;
    else if (F?.trim) mesh(cyl(2.35 * PX, 2.35 * PX, 0.8 * PX), mat(F.trim), leg, 0, top - 0.3 * PX, 0);
    if (F?.greave) { const g = mesh(cyl(2.5 * PX, 2.3 * PX, (top - gnd) * 0.75, 12, 1), mat(F.greave), leg, 0, (top + gnd) / 2 + 0.6 * PX, 0.5 * PX); g.scale.set(1, 1, 0.9); }
  }

  // ---- hips and the hem (skirt of mail, a jerkin's tail, a robe to the ground)
  const torsoMat = body ? mat(body.mat, { tex: kind === 'mail' ? (body.scale ? 'scale' : 'mail') : null }) : mat(H.tunic || 'wool');
  const hemMat = body ? (kind === 'leather' ? mat(body.shirt || H.tunic || 'gambeson') : torsoMat) : mat(H.tunic || 'wool');
  const hemY = robe ? GROUND - 0.6 : kind === 'plate' ? b.sk - 1.5 : b.sk;
  const hemR = robe ? b.skW * 1.75 : b.skW + (kind === 'mail' ? 0.8 : 0.2);
  const skirt = new THREE.Group(); skirt.position.y = Y(b.wa); root.add(skirt); rig.skirt = skirt;
  const sk = mesh(lathe([[b.waW, b.wa], [b.waW + 0.4, (b.wa + hemY) / 2], [hemR, hemY], [hemR - 0.6, hemY + 0.2]], 0.78), hemMat, skirt);
  sk.geometry.translate(0, -Y(b.wa), 0);
  if (body?.trim) { const t = mesh(torus(hemR * PX, 0.55 * PX, 28), mat(body.trim), skirt, 0, Y(hemY) - Y(b.wa) + 0.3 * PX, 0); t.rotation.x = Math.PI / 2; t.scale.set(1, 0.78, 1); }
  if (kind === 'plate') for (let i = 0; i < 2; i++) { const f = mesh(lathe([[b.waW + 0.8 + i * 0.5, b.wa + 0.4 + i * 2.2], [b.waW + 1.6 + i * 0.6, b.wa + 2.6 + i * 2.2]], 0.8), torsoMat, skirt); f.geometry.translate(0, -Y(b.wa), 0); }
  if (H.tabard && !robe) { const tb = mesh(new THREE.BoxGeometry(5.2 * PX, (hemY - b.sh + 2) * PX, 0.5 * PX), mat(H.tabard), root, 0, Y((b.sh + hemY + 2) / 2), b.waW * 0.78 * PX + 0.6 * PX); tb.scale.z = 1; }

  // ---- the torso: one lathe from the waist to the neck, the armour over it
  const chest = new THREE.Group(); chest.position.y = Y(b.wa); root.add(chest); rig.chest = chest;
  const t0 = mesh(lathe([[b.waW, b.wa], [b.waW + 0.6, (b.wa + b.sh) / 2 + 1], [b.shW * 0.98, b.sh + 0.6], [b.shW * 0.55, b.sh - 1.2], [1.8, b.sh - 2]], 0.7), torsoMat, chest);
  t0.geometry.translate(0, -Y(b.wa), 0);
  const chestZ = b.waW * 0.72 * PX;
  if (kind === 'plate') {
    const bp = mesh(lathe([[b.waW + 0.5, b.wa - 0.2], [b.waW + 1.2, (b.wa + b.sh) / 2], [b.shW * 0.9, b.sh + 1.8]], 0.78, 22), torsoMat, chest);
    bp.geometry.translate(0, -Y(b.wa), 0);
    mesh(new THREE.BoxGeometry(0.6 * PX, (b.wa - b.sh) * 0.8 * PX, 1 * PX), mat(body.trim || body.mat), chest, 0, Y((b.wa + b.sh) / 2 + 1) - Y(b.wa), chestZ + 0.9 * PX);
  }
  if (kind === 'leather' && body.studs) for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c += 2) mesh(sph(0.45 * PX, 8, 6), mat(body.studs), chest, c * 2.2 * PX, Y(b.sh + 3 + r * 2.4) - Y(b.wa), chestZ + 0.35 * PX);
  if (body?.belt || kind === 'leather' || kind === 'mail') {
    const bt = mesh(torus((b.waW + 0.35) * PX, 0.7 * PX, 28), mat(body?.belt || 'leatherDark'), chest, 0, 0.2 * PX, 0); bt.rotation.x = Math.PI / 2; bt.scale.set(1, 0.74, 1);
    mesh(new THREE.BoxGeometry(1.6 * PX, 1.4 * PX, 0.6 * PX), mat('bronze'), chest, 0, 0.2 * PX, (b.waW * 0.74 + 0.6) * PX);
  }
  if (body?.sash) { const sa = mesh(torus((b.waW + 0.5) * PX, 0.9 * PX, 28), mat(body.sash), chest, 0, 0.3 * PX, 0); sa.rotation.x = Math.PI / 2; sa.scale.set(1, 0.76, 1); mesh(new THREE.BoxGeometry(1.4 * PX, 6 * PX, 0.4 * PX), mat(body.sash), chest, 2.2 * PX, -3 * PX, (b.waW * 0.76 + 0.5) * PX).rotation.z = 0.12; }
  if (body?.trim && kind !== 'robe') { const nt = mesh(torus(2.2 * PX, 0.5 * PX), mat(body.trim), chest, 0, Y(b.sh - 1.6) - Y(b.wa), 0); nt.rotation.x = Math.PI / 2; nt.scale.set(1, 0.75, 1); }
  // runes and glyphs glow down the chest in the aspect's light; a set gem sits over the heart
  for (const g of [body?.runes, body?.glyph].filter(Boolean)) { const r = mesh(new THREE.BoxGeometry(0.7 * PX, (b.wa - b.sh) * 0.6 * PX, 0.3 * PX), mat(g), chest, 0, Y((b.wa + b.sh) / 2) - Y(b.wa), chestZ + (kind === 'plate' ? 1.4 : 0.5) * PX); fx.glows.push({ obj: r, color: glowColor(g), power: 0.6 }); }
  if (body?.gem) gemOn(body.gem, 1.1 * PX, chest, 0, Y(b.sh + 3) - Y(b.wa), chestZ + 1.2 * PX);

  // ---- arms (hands hold the weapon and the offhand)
  const sleeveMat = body ? (body.sleeve ? mat(body.sleeve) : robe ? torsoMat : kind === 'leather' ? mat(body.shirt || H.tunic || 'gambeson') : mat(body.shirt || H.tunic || 'gambeson')) : mat(H.tunic || 'wool');
  const upperMat = kind === 'mail' || kind === 'plate' ? torsoMat : sleeveMat;
  const handsL = L.hands, gloveMat = handsL ? mat(handsL.mat) : mat(H.gloves || H.skin);
  rig.arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * (b.shW - 0.6) * PX, Y(b.sh + 0.6), 0); root.add(sh);
    const up = (b.hR[1] - b.sh) * 0.5 * PX;
    mesh(new THREE.CapsuleGeometry(1.55 * PX, up, 4, 10), upperMat, sh, 0, -up / 2, 0);
    const elbow = new THREE.Group(); elbow.position.y = -up; sh.add(elbow);
    const fl = up * 0.95;
    if (robe) mesh(cyl(1.6 * PX, 2.8 * PX, fl, 12), sleeveMat, elbow, 0, -fl / 2, 0);
    else mesh(new THREE.CapsuleGeometry(1.4 * PX, fl, 4, 10), kind === 'plate' ? torsoMat : sleeveMat, elbow, 0, -fl / 2, 0);
    const hand = new THREE.Group(); hand.position.y = -fl - 0.6 * PX; elbow.add(hand);
    if (handsL?.plate) { mesh(new THREE.BoxGeometry(3 * PX, 3.2 * PX, 2.6 * PX), gloveMat, hand, 0, -0.6 * PX, 0); mesh(cyl(1.9 * PX, 2.4 * PX, 2 * PX), gloveMat, hand, 0, 1.6 * PX, 0); }
    else { mesh(sph(1.55 * PX, 12, 10), gloveMat, hand, 0, -0.5 * PX, 0); if (handsL) mesh(cyl(1.6 * PX, 1.8 * PX, 1.6 * PX), gloveMat, hand, 0, 1.4 * PX, 0); }
    if (handsL?.trim) mesh(torus(1.85 * PX, 0.4 * PX), mat(handsL.trim), hand, 0, 2.2 * PX, 0).rotation.x = Math.PI / 2;
    if (handsL?.gem) gemOn(handsL.gem, 0.7 * PX, hand, 0, -0.2 * PX, 1.5 * PX);
    if (side === 1 && L.ring) { mesh(torus(0.75 * PX, 0.28 * PX, 12), mat(L.ring.metal || 'gold'), hand, 0.6 * PX, -1.6 * PX, 0.9 * PX).rotation.y = Math.PI / 2; if (L.ring.gem) gemOn(L.ring.gem, 0.45 * PX, hand, 0.6 * PX, -1.6 * PX, 1.5 * PX); }
    // pauldrons
    const pm = body?.pauldrons || (kind === 'plate' ? body.mat : null);
    if (pm) { const p = mesh(new THREE.SphereGeometry(2.7 * PX, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(pm), sh, side * 0.3 * PX, 0.5 * PX, 0); p.scale.set(1.1, 0.85, 1); if (body?.trim) { const r = mesh(torus(2.45 * PX, 0.35 * PX), mat(body.trim), sh, side * 0.3 * PX, -0.35 * PX, 0); r.rotation.x = Math.PI / 2; } }
    rig.arms.push({ sh, elbow, hand, side });
  }
  // the hero's right hand (on the left as they face you) holds the weapon; the left holds the offhand
  rig.armR = rig.arms[0]; rig.armL = rig.arms[1];

  // ---- the identity's cloth: mantle, cloak, quiver
  if (H.mantle && !L.head?.look?.match?.(/hood|coif/)) { const m = mesh(lathe([[2.4, b.sh - 1.6], [b.shW + 1.2, b.sh + 1.4], [b.shW + 1.6, b.sh + 3.6]], 0.8), mat(H.mantle, { side: true }), root); }
  if (H.cloak && !robe) {
    const cape = new THREE.Group(); cape.position.set(0, Y(b.sh), -b.waW * 0.72 * PX - 0.3 * PX); root.add(cape); rig.cape = cape;
    const ch = (GROUND - b.sh - 4) * PX, cw = (b.shW * 2 + 1.5) * PX;
    const g = new THREE.PlaneGeometry(cw, ch, 6, 8); g.translate(0, -ch / 2, 0);
    const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.pow(Math.abs(x) / (cw / 2), 2) * 0.02 * 0 - (-y) * 0.12 + Math.cos(x * 40) * 0.006); pos.setX(i, x * (1 + (-y / ch) * 0.35)); }
    g.computeVertexNormals();
    mesh(g, mat(H.cloak, { side: true }), cape);
  }
  if (H.quiver) {
    const q = new THREE.Group(); q.position.set(0.5 * PX, Y(b.sh + 6), -b.waW * 0.75 * PX - 1.6 * PX); q.rotation.z = -0.5; root.add(q);
    mesh(cyl(1.5 * PX, 1.3 * PX, 10 * PX, 10), mat(H.quiver), q);
    for (let i = 0; i < 4; i++) mesh(new THREE.ConeGeometry(0.7 * PX, 2.2 * PX, 4), mat(H.fletch || 'clothWhite'), q, (i - 1.5) * 0.7 * PX, 6 * PX, (i % 2) * 0.5 * PX);
  }

  // ---- the head
  const head = new THREE.Group(); head.position.set(0, Y(b.hc[1]), 0.3 * PX); root.add(head); rig.head = head;
  const hr = b.hr * PX;
  mesh(cyl(1.3 * PX, 1.5 * PX, 3 * PX), skin, root, 0, Y(b.sh - 1.5), 0);
  const skull = mesh(sph(hr, 24, 18), skin, head); skull.scale.set(1, 0.98, 0.95);
  const look = L.head?.look;
  const covered = look === 'helm' || look === 'coif' || look === 'hood' || look === 'kettle';
  // face: eyes (or Alondra's blindfold), brows, nose, mouth, freckles
  const fz = hr * 0.92;
  if (H.blindfold) { const bf = mesh(cyl(hr * 1.03, hr * 1.03, 1.6 * PX, 24, 1, true), mat(H.blindfold, { side: true }), head, 0, 0.6 * PX, 0); }
  else for (const s of [-1, 1]) {
    const eye = mesh(sph(0.75 * PX, 10, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color(H.eye || '#1c2a48'), roughness: 0.25 }), head, s * 2.2 * PX, 0.4 * PX, fz - 0.3 * PX);
    eye.scale.set(1, 1.3, 0.6);
    mesh(sph(0.22 * PX, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), head, s * 2.2 * PX + 0.25 * PX, 0.75 * PX, fz + 0.05 * PX);
    if (!covered || look === 'kettle') mesh(new THREE.BoxGeometry(1.8 * PX, 0.45 * PX, 0.5 * PX), hair, head, s * 2.2 * PX, 1.9 * PX, fz - 0.1 * PX).rotation.z = -s * 0.12;
  }
  mesh(sph(0.6 * PX, 8, 6), skin, head, 0, -0.7 * PX, fz + 0.15 * PX);
  mesh(new THREE.BoxGeometry(1.6 * PX, 0.32 * PX, 0.3 * PX), mat('robeRed'), head, 0, -2.6 * PX, fz - 0.45 * PX);
  if (H.freckles) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) mesh(sph(0.16 * PX, 4, 3), mat('hairCopper'), head, s * (1.5 + i * 0.6) * PX, -0.9 * PX - (i % 2) * 0.3 * PX, fz - 0.15 * PX);
  if (H.ears === 'long') for (const s of [-1, 1]) { const e = mesh(new THREE.ConeGeometry(0.9 * PX, 4.5 * PX, 6), skin, head, s * hr * 0.98, 0.6 * PX, -0.6 * PX); e.rotation.z = -s * 1.15; }
  if (H.beard) { const bd = mesh(new THREE.SphereGeometry(hr * 0.86, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), hair, head, 0, -0.2 * PX, 0.5 * PX); }
  // hair, under or beside whatever is on the head
  const style = H.hair || 'short';
  if (style !== 'none') {
    if (!covered) { const cap = mesh(new THREE.SphereGeometry(hr * 1.06, 24, 14, 0, Math.PI * 2, 0, Math.PI * (style === 'crop' ? 0.42 : 0.5)), hair, head, 0, 0.2 * PX, -0.35 * PX); cap.rotation.x = -0.35; const fr = mesh(new THREE.BoxGeometry(hr * 1.5, 1.6 * PX, 1.2 * PX), hair, head, 0, hr * 0.62, hr * 0.62); fr.rotation.x = -0.5; }
    if (style === 'long' || style === 'braid' || style === 'pony') {
      if (style === 'long') { mesh(new THREE.BoxGeometry(hr * 1.75, hr * 1.9, hr * 0.7), hair, head, 0, -hr * 0.55, -hr * 0.62); for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(hr * 0.35, hr * 1.5, hr * 0.6), hair, head, s * hr * 0.88, -hr * 0.45, 0.05 * hr); }
      else if (style === 'pony') { const p = mesh(new THREE.CapsuleGeometry(1.1 * PX, 6 * PX, 4, 8), hair, head, 0, -1.5 * PX, -hr * 1.05); p.rotation.x = 0.35; }
      else for (let i = 0; i < 5; i++) mesh(sph((1.1 - i * 0.1) * PX, 8, 6), hair, head, 0, -hr * 0.4 - i * 1.7 * PX, -hr * 0.95 - i * 0.25 * PX);
    }
  }
  // headgear
  const HL = L.head;
  if (HL) {
    const hm = mat(HL.mat || HL.metal || 'steel', { tex: look === 'coif' ? 'mail' : null, side: look === 'hood' || look === 'coif' });
    const trim = HL.trim ? mat(HL.trim) : null;
    if (look === 'kettle') {
      mesh(new THREE.SphereGeometry(hr * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, head, 0, hr * 0.15, 0);
      mesh(cyl(hr * 1.75, hr * 1.85, 0.7 * PX, 28), hm, head, 0, hr * 0.15, 0);
      if (trim) mesh(torus(hr * 1.12, 0.45 * PX, 28), trim, head, 0, hr * 0.2, 0).rotation.x = Math.PI / 2;
    } else if (look === 'helm') {
      mesh(new THREE.SphereGeometry(hr * 1.12, 24, 16, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI * 0.72), hm, head, 0, 0.2 * PX, 0);
      mesh(new THREE.SphereGeometry(hr * 1.12, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), hm, head, 0, 0.2 * PX, 0);
      mesh(new THREE.BoxGeometry(1 * PX, hr * 0.9, 0.9 * PX), hm, head, 0, 0.3 * PX, hr * 1.1);
      if (trim) mesh(torus(hr * 1.13, 0.45 * PX, 28), trim, head, 0, hr * 0.42, 0).rotation.x = Math.PI / 2;
      if (HL.crest) { const c = mesh(new THREE.CylinderGeometry(hr * 1.0, hr * 1.0, 0.8 * PX, 24, 1, false, 0, Math.PI), mat(HL.crest), head, 0, hr * 0.62, -0.05 * hr); c.rotation.set(0, Math.PI / 2, Math.PI / 2); c.scale.set(0.42, 1, 1); }
      if (HL.plume) { const p = mesh(new THREE.ConeGeometry(1.5 * PX, hr * 1.9, 8), mat(HL.plume), head, 0, hr * 1.55, -hr * 0.55); p.rotation.x = -0.9; }
      if (HL.flaps) for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.8 * PX, hr * 0.9, hr * 0.9), hm, head, s * hr * 1.08, -hr * 0.45, 0.1 * hr);
    } else if (look === 'coif' || look === 'hood') {
      mesh(new THREE.SphereGeometry(hr * 1.08, 28, 16, Math.PI * 0.88, Math.PI * 1.24, 0, Math.PI * 0.74), hm, head, 0, 0.3 * PX, -0.25 * PX);
      mesh(lathe([[2.2, b.sh - 2.6], [b.shW + 0.8, b.sh + 1.2], [b.shW + 1.2, b.sh + 2.8]], 0.82), hm, root);
      if (look === 'hood' && HL.tip) { const tip = mesh(new THREE.ConeGeometry(hr * 0.5, hr * 1.4, 10), hm, head, 0, hr * 0.5, -hr * 1.2); tip.rotation.x = -2.0; }
      if (trim) { const r = mesh(new THREE.TorusGeometry(hr * 0.86, 0.35 * PX, 8, 28, Math.PI * 1.25), trim, head, 0, 0.1 * PX, hr * 0.5); r.rotation.z = -Math.PI * 0.125 + Math.PI * 0.0; r.rotation.x = -0.25; r.scale.set(1, 1.12, 1); }
    } else if (look === 'circlet' || look === 'crown') {
      const cm = mat(HL.mat && MAT[HL.mat]?.metal ? HL.mat : HL.metal || HL.mat || 'gold');
      const band = mesh(torus(hr * 1.02, (look === 'crown' ? 0.75 : 0.4) * PX, 32), cm, head, 0, hr * 0.5, 0); band.rotation.x = Math.PI / 2 - 0.12;
      if (look === 'crown') {
        const n = HL.style === 'regal' ? 7 : 5, tall = HL.style === 'regal' ? 4.4 : 3.2;
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; mesh(new THREE.ConeGeometry(0.7 * PX, tall * PX, 5), cm, head, Math.sin(a) * hr * 1.02, hr * 0.5 + tall * PX / 2 + 0.3 * PX - Math.cos(a) * 0.12 * hr, Math.cos(a) * hr * 1.02); }
      }
      if (HL.gem) gemOn(HL.gem, 0.9 * PX, head, 0, hr * 0.62, hr * 1.03);
    }
    if (HL.gem && (look === 'helm' || look === 'kettle' || look === 'hood')) gemOn(HL.gem, 0.8 * PX, head, 0, hr * 0.62, hr * 1.12);
    if (HL.runes) { const r = mesh(torus(hr * 1.14, 0.3 * PX, 32), mat(HL.runes), head, 0, hr * 0.62, 0); r.rotation.x = Math.PI / 2; fx.glows.push({ obj: r, color: glowColor(HL.runes), power: 0.5 }); }
  }

  // ---- the amulet on its chain
  if (L.amulet) {
    const A2 = L.amulet, ch = mesh(torus(2.6 * PX, 0.22 * PX, 28), mat(A2.chain || 'gold'), chest, 0, Y(b.sh + 1.4) - Y(b.wa), 0.9 * PX);
    ch.rotation.x = Math.PI / 2 - 0.45; ch.scale.set(1, 1.15, 1);
    const pd = mesh(cyl(1.25 * PX, 1.25 * PX, 0.5 * PX, 16), mat(A2.metal || 'gold'), chest, 0, Y(b.sh + 4.6) - Y(b.wa), chestZ + (kind === 'plate' ? 1.9 : 0.9) * PX);
    pd.rotation.x = Math.PI / 2;
    if (A2.style === 'sun') for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = mesh(new THREE.ConeGeometry(0.35 * PX, 1.1 * PX, 4), mat(A2.metal || 'gold'), pd, Math.sin(a) * 1.6 * PX, 0, Math.cos(a) * 1.6 * PX); r.rotation.set(Math.PI / 2, 0, -a); r.rotation.order = 'YXZ'; }
    if (A2.gem) gemOn(A2.gem, 0.85 * PX, pd, 0, 0.35 * PX, 0);
  }

  // ---- the weapon and the offhand
  const W = L.weapon, wArt = arts.weapon;
  rig.cls = W?.cls || null;
  if (W) {
    const w = buildWeapon(W, wArt, fx);
    const bow = W.cls === 'bow';
    const arm = bow ? rig.armL : rig.armR;
    w.userData.cls = W.cls;
    arm.hand.add(w); rig.weapon = w;
  }
  const O = L.offhand, oArt = arts.offhand;
  if (O && !(W?.cls === 'bow')) { const o = buildOffhand(O, oArt, fx); rig.armL.hand.add(o); rig.offhand = o; }

  // ---- the outfit's best rarity gives the aura round the feet; Primal burns with a white flame
  let best = null;
  for (const s of SLOTS) { const it = gear[s]; const r = typeof it === 'object' && it?.rarity ? it.rarity : arts[s]?.relic ? 'heirloom' : null; if (r && (!best || rarityTier(r) > rarityTier(best))) best = r; }
  fx.best = best;
  const RL = best ? RARITY_LOOK[best] : null;
  if (RL?.aura) fx.aura = new THREE.Color(RL.aura);
  fx.flame = !!RL?.flame || SLOTS.some(s => (gear[s]?.temper || 0) >= 10);
  fx.motes = W?.aspect ? ASPECT_LOOK[W.aspect]?.glow : null;

  setPose(rig, 'idle', 0);
  return { group, rig, fx, looks: L };
}

/* ------------------------------------------------------------------ weapons, from the recipe's own numbers */
function buildWeapon(W, art, fx) {
  const p = W.p;
  let k = (W.k || 0.36) * PX; // card px -> metres, at the size the hand holds it
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const r = W.r;
  const glowKey = W.glow && MAT[W.glow]?.emit ? W.glow : null;
  const addGlow = (o, key, power = 1) => { if (key && MAT[key]?.emit) fx.glows.push({ obj: o, color: glowColor(key), power }); };
  let hold = 0, tip = new THREE.Object3D();
  const haft = (len, R, m) => mesh(cyl(R * k, R * k * 1.05, len * k, 10), mat(m), inner, 0, len * k / 2, 0);
  const bands = (list, R, m) => (list || []).forEach(t => mesh(cyl(R * 1.35 * k, R * 1.35 * k, 1.6 * k, 10), mat(m), inner, 0, t * k, 0));
  if (r === 'sword' || r === 'dagger') {
    const grip = p.gripEnd || 12, gT = p.guardT || 3, bl = p.bladeL || 40, bw = p.bladeW || 4, tl = p.tipL || 7, tp = p.taper || 0.9;
    mesh(sph((p.pommelR || 3) * k, 12, 8), mat(p.pommel || p.guardMat || 'iron'), inner, 0, -(p.pommelR || 3) * k * 0.6, 0);
    if (p.pommelGem) gemOn(p.pommelGem, (p.pommelR || 3) * 0.55 * k, inner, 0, -(p.pommelR || 3) * k * 0.6, (p.pommelR || 3) * 0.8 * k);
    mesh(cyl((p.gripR || 2) * k, (p.gripR || 2) * k, grip * k, 10), mat(p.grip || 'leather'), inner, 0, grip * k / 2, 0);
    const gw = p.guardW || 9, gm = mat(p.guardMat || 'iron');
    if (p.guard === 'flame') for (const s of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(gT * 0.55 * k, gw * k, 6), gm, inner, s * gw * 0.45 * k, (grip + gT / 2 + 1) * k, 0); c.rotation.z = s * 1.2; }
    else if (p.guard === 'coin') { const c = mesh(cyl(gw * 0.5 * k, gw * 0.5 * k, gT * k, 16), gm, inner, 0, (grip + gT / 2) * k, 0); }
    else mesh(new THREE.BoxGeometry(gw * 2 * k, gT * k, gT * 1.1 * k), gm, inner, 0, (grip + gT / 2) * k, 0);
    if (p.gem) gemOn(p.gem, gT * 0.6 * k, inner, 0, (grip + gT / 2) * k, gT * 0.7 * k);
    const b0 = grip + gT, hw = bw / 2;
    const curve = p.shape === 'knife' ? (p.curve || 2) : 0;
    const blade = extrude([[-hw, 0], [hw, 0], [hw * tp + curve * 0.3, bl], [curve, bl + tl], [-hw * tp, bl - 1]], 0.7, k, 0.45);
    const bm = mesh(blade, mat(p.blade || 'steel'), inner, 0, b0 * k, 0);
    if (p.fuller) { const f = mesh(new THREE.BoxGeometry((p.fullerR || 0.9) * 1.4 * k, bl * 0.82 * k, 1.5 * k), mat(p.fuller), inner, 0, (b0 + bl * 0.45) * k, 0); addGlow(f, p.fuller, 0.8); }
    if (W.edge) { const e = mesh(new THREE.BoxGeometry(bw * 1.15 * k, bl * k, 0.4 * k), new THREE.MeshBasicMaterial({ color: new THREE.Color(W.edge), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), inner, 0, (b0 + bl / 2) * k, 0); fx.glows.push({ obj: e, color: new THREE.Color(W.edge), power: 0.7 }); }
    tip.position.set(curve * k, (b0 + bl + tl) * k, 0);
    hold = grip * 0.55;
  } else {
    // a hafted weapon: axe, hammer, mace, spear, staff
    const len = r === 'staff' ? (p.headT || 62) + 2 : r === 'spear' ? (p.headT || 60) : (p.headT || 50) + 4;
    const R = p.haftR || 2;
    if (r === 'staff' && p.wobble) {
      const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(Math.sin(i * 1.7) * p.wobble * 0.6 * k, i / 8 * len * k, Math.cos(i * 2.3) * p.wobble * 0.4 * k));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, R * k, 8), mat(p.haft || 'wood'), inner);
    } else haft(len, R, p.haft || 'wood');
    if (p.wrap) { const a = p.wrapA ?? 0, z = p.wrapB ?? p.wrapEnd ?? 16; mesh(cyl(R * 1.18 * k, R * 1.18 * k, (z - a) * k, 10), mat(p.wrap), inner, 0, (a + z) / 2 * k, 0); }
    bands(p.bands, R, p.bandMat || 'iron');
    const foot = p.foot || p.butt || p.pommelMat;
    if (foot) mesh(sph(R * 1.4 * k, 10, 8), mat(foot), inner, 0, 0, 0);
    const hT = p.headT || len;
    if (r === 'axe') {
      const lo = p.bladeLo || 12, hi = p.bladeHi || 8, bw = p.bladeW || 16, bu = p.bulge || 3;
      const s = new THREE.Shape();
      s.moveTo(0, -3 * k); s.lineTo(bw * 0.55 * k, -lo * 0.55 * k); s.quadraticCurveTo((bw + bu) * k, -lo * 0.3 * k, bw * k, -lo * k * 0.2 + 0.0001);
      s.lineTo(bw * k, hi * k); s.quadraticCurveTo((bw * 0.7) * k, hi * 0.4 * k, 0, 3 * k); s.lineTo(0, -3 * k);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 1.1 * k, bevelEnabled: true, bevelThickness: 0.5 * k, bevelSize: 0.4 * k, bevelSegments: 1 }); geo.translate(0, 0, -0.55 * k);
      mesh(geo, mat(p.blade || 'steel'), inner, R * 0.6 * k, hT * k, 0);
      mesh(new THREE.BoxGeometry(R * 2.8 * k, 6 * k, R * 2.8 * k), mat(p.socket || p.blade || 'iron'), inner, 0, hT * k, 0);
      if (p.back === 'poll') mesh(new THREE.BoxGeometry(4 * k, 4 * k, 3 * k), mat(p.blade || 'steel'), inner, -R * 2.2 * k, hT * k, 0);
      else if (p.spikeL) { const c = mesh(new THREE.ConeGeometry(1.4 * k, p.spikeL * k, 6), mat(p.blade || 'steel'), inner, -(R + p.spikeL / 2) * k, hT * k, 0); c.rotation.z = Math.PI / 2; }
      if (p.runes) { const ru = mesh(new THREE.BoxGeometry(bw * 0.5 * k, 1 * k, 1.6 * k), mat(p.runes), inner, (R + bw * 0.45) * k, hT * k, 0); addGlow(ru, p.runes, 0.8); }
      if (p.edge) { const e = mesh(new THREE.BoxGeometry(1 * k, (hi + lo * 0.4) * k, 1.4 * k), mat(p.edge), inner, (bw + R * 0.6) * k, (hT + (hi - lo * 0.2) / 2) * k, 0); addGlow(e, p.edge, 0.8); }
      if (p.gem) gemOn(p.gem, 1.6 * k, inner, 0, hT * k, R * 1.6 * k);
      tip.position.set((bw * 0.8) * k, hT * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'hammer') {
      const hw = p.headW || 14, hh = p.headH || 13;
      mesh(new THREE.BoxGeometry(hw * 2 * k, hh * k, hh * 0.85 * k), mat(p.headMat || 'iron'), inner, 0, hT * k, 0);
      if (p.faces) for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(1.4 * k, hh * 1.1 * k, hh * 0.95 * k), mat(p.trim || p.headMat || 'steel'), inner, s * hw * k, hT * k, 0);
      if (p.trim) mesh(new THREE.BoxGeometry(hw * 2.02 * k, 1.4 * k, hh * 0.9 * k), mat(p.trim), inner, 0, hT * k, 0);
      if (p.spike) mesh(new THREE.ConeGeometry(1.8 * k, p.spike * k, 6), mat(p.headMat || 'iron'), inner, 0, (hT + hh / 2 + p.spike / 2) * k, 0);
      if (p.runes) { const ru = mesh(new THREE.BoxGeometry(hw * 1.2 * k, 1.2 * k, hh * 0.9 * k), mat(p.runes), inner, 0, hT * k, 0); ru.scale.z = 1.02; addGlow(ru, p.runes, 0.9); }
      tip.position.set(hw * k, hT * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'mace') {
      const hw = p.headW || 7, hm = mat(p.headMat || 'iron');
      mesh(sph(hw * 0.75 * k, 14, 10), hm, inner, 0, hT * k, 0);
      if (p.style === 'flanged') for (let i = 0; i < 6; i++) { const f = mesh(new THREE.BoxGeometry(hw * 1.9 * k, hw * 1.4 * k, 0.9 * k), hm, inner, 0, hT * k, 0); f.rotation.y = i / 6 * Math.PI; }
      if (p.trim) mesh(torus(hw * 0.55 * k, 0.8 * k, 16), mat(p.trim), inner, 0, (hT - hw * 0.6) * k, 0).rotation.x = Math.PI / 2;
      if (p.spike) mesh(new THREE.ConeGeometry(1.4 * k, p.spike * 1.4 * k, 6), hm, inner, 0, (hT + hw * 0.7 + p.spike * 0.6) * k, 0);
      if (p.style === 'bell') { mesh(new THREE.CylinderGeometry(hw * 0.5 * k, hw * 1.1 * k, hw * 1.6 * k, 16, 1, true), mat(p.headMat || 'bronze', { side: true }), inner, 0, hT * k, 0); }
      if (p.gem) gemOn(p.gem, 1.6 * k, inner, 0, hT * k, hw * 0.75 * k);
      tip.position.set(0, (hT + hw) * k, 0);
      hold = (p.wrapEnd || 16) * 0.5;
    } else if (r === 'spear') {
      const hl = p.headL || 17, hw = p.headW || 5;
      const head = extrude([[0, 0], [hw, hl * 0.35], [0, hl], [-hw, hl * 0.35]], 0.9, k, 0.4);
      mesh(head, mat(p.head || 'steel'), inner, 0, hT * k, 0);
      mesh(new THREE.ConeGeometry(R * 1.6 * k, 6 * k, 8), mat(p.socket || p.head || 'iron'), inner, 0, (hT - 2) * k, 0).rotation.x = Math.PI;
      if (p.wings) for (const s of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.9 * k, p.wings * 2 * k, 5), mat(p.head || 'steel'), inner, s * 2.6 * k, (hT - 1) * k, 0); c.rotation.z = s * 1.9; }
      if (p.fuller) { const f = mesh(new THREE.BoxGeometry(1 * k, hl * 0.6 * k, 1.6 * k), mat(p.fuller), inner, 0, (hT + hl * 0.4) * k, 0); addGlow(f, p.fuller, 0.8); }
      if (p.ribbon) { const rb = mesh(new THREE.PlaneGeometry(3 * k, 12 * k), mat(p.ribbon, { side: true }), inner, 1.8 * k, (hT - 9) * k, 0); rb.rotation.z = 0.25; }
      if (p.gem) gemOn(p.gem, 1.4 * k, inner, 0, (hT + 1) * k, R * 1.3 * k);
      tip.position.set(0, (hT + hl) * k, 0);
      hold = 30;
    } else { // staff
      const top = new THREE.Group(); top.position.y = hT * k; inner.add(top);
      const metal = mat(p.metal || p.bandMat || 'bronze'), st = p.style;
      if (st === 'crook' || st === 'crozier') { const c = mesh(new THREE.TorusGeometry(5 * k, R * 0.9 * k, 8, 20, Math.PI * 1.3), st === 'crozier' ? metal : mat(p.haft || 'wood'), top, -5 * k, 0, 0); c.rotation.z = 0; }
      else if (st === 'gnarl' || st === 'song') { for (let i = 0; i < 3; i++) { const c = mesh(new THREE.TorusGeometry(4 * k, R * 0.7 * k, 6, 12, Math.PI * 1.1), mat(p.haft || 'wood'), top, 0, 2 * k, 0); c.rotation.set(Math.PI / 2, i * 2.1, Math.PI / 2); } }
      else { for (let i = 0; i < 2; i++) { const c = mesh(torus((p.ringR || 7) * (1 - i * 0.25) * k, 0.8 * k, 24), metal, top, 0, (3 + i * 2) * k, 0); c.rotation.y = i * 0.8; } }
      const orbKey = p.orb || p.crystal || p.gem || (p.glow ? p.glow : null);
      if (orbKey) {
        const crystal = p.crystal && !p.orb;
        const o = mesh(crystal ? new THREE.OctahedronGeometry(3.4 * k, 0) : sph(3.2 * k, 16, 12), mat(orbKey), top, 0, 4 * k, 0);
        if (crystal) o.scale.set(0.8, 1.5, 0.8);
        addGlow(o, MAT[orbKey]?.emit ? orbKey : (p.glow || null), 1.2);
        if (!MAT[orbKey]?.emit && p.glow) addGlow(o, p.glow, 1.2);
      }
      if (p.leaves) for (let i = 0; i < 5; i++) { const l = mesh(new THREE.ConeGeometry(1.1 * k, 4 * k, 4), mat(p.leaves), top, Math.sin(i * 1.3) * 3 * k, -2 * k - i * 1.2 * k, Math.cos(i * 1.3) * 3 * k); l.rotation.z = Math.sin(i) * 1.2; }
      if (p.wrap) mesh(cyl(R * 1.2 * k, R * 1.2 * k, 8 * k, 10), mat(p.wrap), inner, 0, (hT - 10) * k, 0);
      tip.position.set(0, (hT + 5) * k, 0);
      hold = p.headT ? p.headT * 0.55 : 34;
    }
  }
  if (r === 'bow') {
    inner.clear();
    const kb = k * 0.8, len = p.len || 60, bu = p.bulge || 9, lr = (p.limbR || 3) * 0.7;
    k = kb;
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, -len / 2 * k, -bu * 0.4 * k), new THREE.Vector3(0, -len * 0.3 * k, bu * 3.2 * k), new THREE.Vector3(0, len * 0.3 * k, bu * 3.2 * k), new THREE.Vector3(0, len / 2 * k, -bu * 0.4 * k));
    mesh(new THREE.TubeGeometry(curve, 30, lr * k, 8), mat(p.limb || 'wood'), inner);
    const sg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -len / 2 * k, -bu * 0.4 * k), new THREE.Vector3(0, len / 2 * k, -bu * 0.4 * k)]);
    const string = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: 0xe8e0c4 })); inner.add(string); g.userData.string = string;
    mesh(cyl(lr * 1.5 * k, lr * 1.5 * k, 8 * k, 10), mat(p.grip || 'leather'), inner, 0, 0, bu * 2.4 * k);
    for (const s of [-1, 1]) mesh(sph(lr * 1.3 * k, 8, 6), mat(p.nock || 'bone'), inner, 0, s * len / 2 * k, -bu * 0.4 * k);
    if (p.gem) gemOn(p.gem, 1.5 * k, inner, 0, 0, bu * 2.4 * k + lr * 1.4 * k);
    if (p.tassel) mesh(new THREE.ConeGeometry(0.8 * k, 6 * k, 5), mat(p.tassel), inner, 0, -len / 2 * k - 3 * k, 0).rotation.x = Math.PI;
    tip.position.set(0, len / 2 * k, 0);
    hold = 0;
    inner.position.z = -bu * 2.4 * k;
  }
  inner.position.y = -hold * k;
  inner.add(tip); g.userData.tip = tip;
  if (glowKey) g.userData.glow = glowColor(glowKey);
  return g;
}

function buildOffhand(O, art, fx) {
  const p = art?.p || {}, k = 0.36 * PX;
  const g = new THREE.Group();
  const look = O.look === 'sigil' && p.style === 'lantern' ? 'lantern' : O.look;
  if (look === 'buckler' || look === 'round' || look === 'heater' || look === 'tower') {
    const shield = new THREE.Group(); g.add(shield); shield.position.set(0.04, 0, 0.05); shield.rotation.y = -Math.PI / 2 + 0.35;
    let geo, rim;
    const face = mat(O.face || 'wood'), rimM = mat(O.rim || 'iron');
    if (look === 'buckler' || look === 'round') {
      const r = (look === 'buckler' ? 13 : 19) * k;
      geo = cyl(r, r, 2 * k, 28); geo.rotateX(Math.PI / 2);
      rim = torus(r, 1.2 * k, 32);
    } else {
      const w = look === 'tower' ? 15 : 16, h = look === 'tower' ? 30 : 22;
      const pts = look === 'tower' ? [[-w, h / 2], [w, h / 2], [w, -h / 2 + 3], [0, -h / 2 - 2], [-w, -h / 2 + 3]] : [[-w, h / 2], [w, h / 2], [w, 0], [0, -h], [-w, 0]];
      geo = extrude(pts, 2, k, 0.6);
      rim = null;
    }
    mesh(geo, face, shield);
    if (rim) mesh(rim, rimM, shield, 0, 0, 0);
    else { const e = mesh(geo.clone(), rimM, shield, 0, 0, -0.4 * k); e.scale.set(1.08, 1.08, 0.7); }
    if (O.paint) {
      const pm = mat(O.paint2 || 'paintRed');
      if (O.paint === 'chevron') mesh(extrude([[-12, 2], [0, -8], [12, 2], [12, 7], [0, -3], [-12, 7]], 0.5, k, 0.1), pm, shield, 0, 0, 1.4 * k);
      else if (O.paint === 'quarter') { mesh(new THREE.BoxGeometry(12 * k, 10 * k, 0.6 * k), pm, shield, -6 * k, 5 * k, 1.3 * k); mesh(new THREE.BoxGeometry(12 * k, 10 * k, 0.6 * k), pm, shield, 6 * k, -5 * k, 1.3 * k); }
      else for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = mesh(new THREE.ConeGeometry(1 * k, 4 * k, 4), pm, shield, Math.sin(a) * 9 * k, Math.cos(a) * 9 * k, 1.3 * k); c.rotation.z = -a; }
    }
    if (O.boss) mesh(new THREE.SphereGeometry(4 * k, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(O.boss), shield, 0, 0, 1 * k).rotation.x = Math.PI / 2;
    if (O.gem) gemOn(O.gem, 2.2 * k, shield, 0, 0, 4.4 * k);
  } else if (look === 'tome') {
    const book = mesh(new THREE.BoxGeometry(12 * k, 15 * k, 4 * k), mat(O.cover || 'leather'), g, 0, 0, 0.06);
    mesh(new THREE.BoxGeometry(11 * k, 14 * k, 4.2 * k), mat('parchment'), g, 0.6 * k, 0, 0.06);
    if (O.gem) gemOn(O.gem, 2 * k, g, 0, 0, 0.06 + 2.6 * k);
    if (O.glow) fx.glows.push({ obj: book, color: glowColor(O.glow), power: 0.6 });
  } else if (look === 'lantern') {
    const l = new THREE.Group(); l.position.set(0, -0.06, 0.05); g.add(l);
    mesh(torus(2.5 * k, 0.5 * k, 12), mat(O.metal || 'iron'), l, 0, 7 * k, 0);
    mesh(cyl(4 * k, 4.6 * k, 1.4 * k, 6), mat(O.metal || 'iron'), l, 0, 4 * k, 0);
    mesh(cyl(4.6 * k, 4 * k, 1.4 * k, 6), mat(O.metal || 'iron'), l, 0, -5 * k, 0);
    const core = mesh(sph(2.8 * k, 12, 10), mat(O.glow || 'ember'), l, 0, -0.5 * k, 0);
    const glass = mesh(cyl(4 * k, 4 * k, 8 * k, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xfff2d0, transparent: true, opacity: 0.25, roughness: 0.05, side: THREE.DoubleSide }), l, 0, -0.5 * k, 0);
    fx.glows.push({ obj: core, color: glowColor(O.glow || 'ember'), power: 1.4 });
  } else {
    // an orb, or a ring-sigil, floating over the open hand
    const f = new THREE.Group(); f.position.set(0, 0.03, 0.08); g.add(f); g.userData.float = f;
    if (look === 'orb') { const o = mesh(sph(4.2 * k, 18, 14), mat(O.gem || O.glow || 'sapphire'), f); if (O.glow) fx.glows.push({ obj: o, color: glowColor(O.glow), power: 1.2 }); mesh(torus(4.6 * k, 0.6 * k, 24), mat(O.metal || 'silver'), f).rotation.x = Math.PI / 2; }
    else { for (let i = 0; i < (look === 'rings' ? 3 : 2); i++) { const t = mesh(torus((5 - i * 1.3) * k, 0.6 * k, 24), mat(O.metal || 'gold'), f); t.rotation.set(i * 0.9, i * 0.6, 0); } if (O.gem) gemOn(O.gem, 1.8 * k, f, 0, 0, 0); const c = O.glow ? mesh(sph(1.6 * k, 10, 8), mat(O.glow), f) : null; if (c) fx.glows.push({ obj: c, color: glowColor(O.glow), power: 1 }); }
  }
  return g;
}

/* ------------------------------------------------------------------ poses */
// idle: the weapon held ready; strike (0..1): a swing that suits the weapon's class
export function setPose(rig, pose, t, u = 0) {
  const R = rig.armR, Lf = rig.armL, cls = rig.cls;
  const breathe = Math.sin(t * 2.1);
  rig.root.position.y = 0;
  rig.chest.scale.set(1 + breathe * 0.012, 1 + breathe * 0.018, 1 + breathe * 0.012);
  rig.head.rotation.set(Math.sin(t * 0.7) * 0.05, Math.sin(t * 0.45) * 0.18, 0);
  if (rig.cape) rig.cape.rotation.x = 0.12 + Math.sin(t * 1.6) * 0.05 + (pose === 'strike' ? Math.sin(u * Math.PI) * 0.35 : 0);
  if (rig.skirt) rig.skirt.rotation.z = Math.sin(t * 1.3) * 0.015;
  // rest
  const pole = cls === 'spear' || cls === 'staff';
  R.sh.rotation.set(pole ? -0.15 : -0.35, 0, -0.18);
  R.elbow.rotation.set(pole ? -0.35 : -1.05, 0, 0);
  R.hand.rotation.set(pole ? 0.5 : 1.0, 0, 0.15);
  Lf.sh.rotation.set(-0.3, 0, 0.22);
  Lf.elbow.rotation.set(-0.95, 0, 0);
  Lf.hand.rotation.set(0.25, 0, -0.2);
  if (cls === 'bow') { Lf.sh.rotation.set(-0.6, 0, 0.35); Lf.elbow.rotation.set(-0.6, 0, 0); Lf.hand.rotation.set(0.9, -0.3, 0); R.sh.rotation.set(-0.15, 0, -0.12); R.elbow.rotation.set(-0.35, 0, 0); }
  if (rig.weapon) rig.weapon.rotation.set(0, 0, 0);
  // idle sway
  R.sh.rotation.x += Math.sin(t * 2.1 + 1) * 0.03;
  Lf.sh.rotation.x += Math.sin(t * 2.1) * 0.03;
  if (rig.offhand?.userData.float) { rig.offhand.userData.float.position.y = 0.03 + Math.sin(t * 2.4) * 0.012; rig.offhand.userData.float.rotation.y = t * 0.8; }
  if (pose !== 'strike') return;
  const e = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65; // wind up, then release
  const ease = x => x * x * (3 - 2 * x);
  if (cls === 'spear') { const a = u < 0.4 ? -ease(u / 0.4) : ease(Math.min(1, (u - 0.4) / 0.2)) * (1 - Math.max(0, (u - 0.6) / 0.4)); R.sh.rotation.x += -1.2 * Math.max(0, a); R.elbow.rotation.x += 0.4 * a; rig.weapon.rotation.x = -1.35 * Math.max(0, a) + 0.25 * Math.min(0, a); rig.root.position.z = 0.08 * Math.max(0, a); }
  else if (cls === 'staff') { const a = Math.sin(u * Math.PI); R.sh.rotation.x += -1.6 * a; R.elbow.rotation.x += 0.7 * a; Lf.sh.rotation.x += -1.0 * a; rig.root.position.y = 0.04 * a; }
  else if (cls === 'bow') { const a = Math.min(1, u / 0.45), rel = u > 0.55; R.sh.rotation.set(-1.5, 0, -0.1 + (rel ? 0 : -0.2 * a)); R.elbow.rotation.set(rel ? -0.3 : -1.6 * a, 0, 0); if (rig.weapon?.userData.string) rig.weapon.userData.string.scale.z = 1; }
  else {
    // blades and blunt weapons: back over the shoulder, then a cut across and down
    const wind = u < 0.32 ? ease(u / 0.32) : 0, cut = u >= 0.32 ? ease(Math.min(1, (u - 0.32) / 0.22)) : 0, back = u > 0.6 ? ease((u - 0.6) / 0.4) : 0;
    const k = 1 - back;
    // the arm goes up and back over the shoulder, then comes down across the body
    R.sh.rotation.x = -0.35 + (-2.3 * wind + (cut > 0 ? -2.3 + 3.1 * cut : 0) * (cut > 0 ? 1 : 0) + (cut > 0 ? 2.3 * wind : 0)) * k;
    R.sh.rotation.z = -0.18 - 0.35 * wind * k + 0.25 * cut * k;
    R.elbow.rotation.x = -1.05 + 0.75 * (wind * (1 - cut)) * k;
    rig.root.rotation.y = (0.35 * wind * (1 - cut) - 0.45 * cut) * k;
    rig.root.position.z = 0.06 * cut * k;
  }
}
