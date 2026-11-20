// The creatures of Hearth & Heirloom in 3D (November 20). Each of M7's 54 beast families is one of a few body plans
// (a four-legged beast, a hulking two-legged one, a robed wraith, a scorpion, a serpent or fish, a winged thing, a frog,
// a mound, a mushroom, a heap of stones, a spark, a willow, an anvil, a sapling), given its own proportions and parts in
// PLANS below. Its colours are read from its own pixel sprite (art/foes.js renderFoe), so the 3D creature wears the
// colours Chris has seen in the fights. The 39 humanoid foes are built by the heroes' own builder instead (bestiary.js).
// buildBeast(key, sprite ImageData, { tier }) -> { group, update(t), height }
import * as THREE from 'three';
import { V, lerp, smooth, tube, curve, lathe, wedge, sph, tor, cone, ico, add, surface, Q } from '../hero-3d/kit.js';

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ colours from the sprite */
// the sprite's opaque pixels, split by brightness: dark, body, light; plus its most saturated bright colour (eyes,
// glow, embers) and its second hue (a different colour that covers a good share of the sprite: moss on a boar, gold on
// a scorpion)
export function paletteOf(img) {
  const px = [], d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { const r = d[i], g = d[i + 1], b = d[i + 2]; px.push([r, g, b]); }
  if (!px.length) px.push([128, 128, 128]);
  const lum = c => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  const sat = c => (Math.max(...c) - Math.min(...c)) / (Math.max(...c) + 1);
  const hue = c => { const [r, g, b] = c.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn; if (!dd) return 0; let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return (h * 60 + 360) % 360; };
  px.sort((a, b) => lum(a) - lum(b));
  const avg = (a, b) => { const s = [0, 0, 0]; const L = px.slice(Math.floor(px.length * a), Math.max(Math.floor(px.length * a) + 1, Math.floor(px.length * b))); for (const c of L) for (let k = 0; k < 3; k++) s[k] += c[k]; return s.map(v => v / L.length); };
  const dark = avg(0.05, 0.25), body = avg(0.3, 0.7), light = avg(0.78, 0.97);
  // hue histogram (12 bins) of the colourful pixels
  const bins = Array.from({ length: 12 }, () => ({ n: 0, s: [0, 0, 0] }));
  for (const c of px) if (sat(c) > 0.25 && lum(c) > 40) { const b = bins[Math.floor(hue(c) / 30) % 12]; b.n++; for (let k = 0; k < 3; k++) b.s[k] += c[k]; }
  const order = bins.map((b, i) => ({ ...b, i })).filter(b => b.n).sort((a, b) => b.n - a.n);
  const bodyHue = hue(body);
  const second = order.find(b => Math.min(Math.abs(b.i * 30 + 15 - bodyHue), 360 - Math.abs(b.i * 30 + 15 - bodyHue)) > 50 && b.n > px.length * 0.04);
  const accent = second ? second.s.map(v => v / second.n) : light;
  let glow = null, best = 0;
  for (const c of px) { const v = sat(c) * lum(c); if (v > best && lum(c) > 150 && sat(c) > 0.45) { best = v; glow = c; } }
  const C = c => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  return { dark: C(dark), body: C(body), light: C(light), accent: C(accent), glow: glow ? C(glow) : null };
}

/* ------------------------------------------------------------------ materials */
function mats(pal, skin) {
  const nm = (k, r) => { const t = surface(k).clone(); t.repeat.set(r, r); t.needsUpdate = true; return t; };
  const kind = { hide: ['leather', 4, 0.8, 0], fur: ['hair', 3, 0.85, 0], stone: ['stone', 2, 0.95, 0], metal: ['metal', 2, 0.4, 0.85], cloth: ['cloth', 8, 0.9, 0], bark: ['wood', 2, 0.9, 0], glass: ['metal', 1, 0.08, 0.1], slime: ['skin', 3, 0.35, 0], ghost: ['cloth', 4, 0.6, 0] }[skin] || ['leather', 4, 0.8, 0];
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: kind[2], metalness: kind[3], normalMap: nm(kind[0], kind[1]), normalScale: new THREE.Vector2(0.7, 0.7), ...extra });
  const m = {
    body: std(pal.body), dark: std(pal.dark), light: std(pal.light), accent: std(pal.accent),
    horn: new THREE.MeshStandardMaterial({ color: pal.light.clone().lerp(new THREE.Color(0.9, 0.85, 0.7), 0.5), roughness: 0.5 }),
    eye: new THREE.MeshStandardMaterial({ color: pal.glow || new THREE.Color(1, 0.8, 0.3), emissive: pal.glow || new THREE.Color(1, 0.7, 0.2), emissiveIntensity: 2 }),
    glow: new THREE.MeshStandardMaterial({ color: pal.glow || pal.light, emissive: pal.glow || pal.light, emissiveIntensity: 1.6, roughness: 0.3 }),
  };
  if (skin === 'glass') for (const k of ['body', 'light', 'accent']) Object.assign(m[k], { transparent: true, opacity: 0.82, roughness: 0.08, metalness: 0.2 });
  if (skin === 'ghost') for (const k of ['body', 'light', 'dark']) Object.assign(m[k], { transparent: true, opacity: 0.78, emissive: m[k].color.clone(), emissiveIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  if (skin === 'slime') for (const k of ['body', 'light']) Object.assign(m[k], { roughness: 0.25 });
  return m;
}

/* ------------------------------------------------------------------ the plans */
// Every plan builds facing +z, standing on y = 0, about 1 unit tall (the size comes after), and returns parts to move.
const P = {};
const eyes = (g, m, x, y, z, r) => { for (const s of [-1, 1]) add(sph(r, 10, 8), m.eye, g, s * x, y, z); };

// a four-legged beast: wolf, deer, boar, lizard, the thorny Briarmaw, a stone sentinel hound
P.quad = (m, o) => {
  const g = new THREE.Group(), parts = { legs: [] };
  const L = o.len || 1.3, H = o.h || 0.7, low = o.low ? 0.45 : 1, R = (o.girth || 0.18);
  const hipY = H * 0.62 * low, sh = L * 0.36;
  // the body: a tube from rump to chest, deepest at the chest
  const spine = curve([V(0, hipY, -sh), V(0, hipY + R * 0.3, -sh * 0.1), V(0, hipY + R * 0.15, sh * 0.7), V(0, hipY * 1.02, sh)], 16);
  add(tube(spine, t => [R * (0.85 + Math.sin(t * Math.PI) * 0.35) * (o.belly ? 1.35 : 1), R * (0.95 + Math.sin(t * Math.PI) * 0.45) * (o.belly ? 1.25 : 1)], { n: 16 }), m.body, g);
  // the neck and head
  const head = new THREE.Group(); head.position.set(0, hipY + (o.headUp ?? R * 1.1), sh + R * 0.6); g.add(head); parts.head = head;
  add(tube([V(0, -R * 1.1, -R * 0.6), V(0, 0, 0)], R * 0.55, { n: 10 }), m.body, head);
  const hl = o.snout || R * 2.2;
  add(tube(curve([V(0, 0.02, -R * 0.2), V(0, 0, R * 0.5), V(0, -R * 0.15, hl)], 10), t => [R * (0.62 - t * 0.35), R * (0.58 - t * 0.28)], { n: 12 }), m.body, head);
  add(sph(R * 0.14, 8, 6), m.dark, head, 0, -R * 0.12, hl + R * 0.02);
  eyes(head, m, R * 0.36, R * 0.22, R * 0.55, R * 0.09);
  if (o.ears) for (const s of [-1, 1]) { const e = add(cone(R * 0.16, R * 0.5, 5), m.dark, head, s * R * 0.32, R * 0.48, R * 0.05); e.rotation.z = -s * 0.25; }
  if (o.antlers) for (const s of [-1, 1]) { const pts = curve([V(s * R * 0.2, R * 0.4, 0), V(s * R * 0.7, R * 1.3, -R * 0.3), V(s * R * 1.2, R * 2.0, -R * 0.1), V(s * R * 1.0, R * 2.6, R * 0.3)], 12); add(tube(pts, t => R * 0.08 * (1 - t * 0.6), { n: 6 }), m.horn, head); for (let k = 3; k < 12; k += 3) add(tube([pts[k], pts[k].clone().add(V(s * R * 0.3, R * 0.5, R * 0.2))], R * 0.04, { n: 5 }), m.horn, head); if (o.vines) add(tube(pts.map((p, i) => p.clone().add(V(Math.sin(i) * R * 0.08, 0, Math.cos(i) * R * 0.08))), R * 0.03, { n: 4 }), m.accent, head); }
  if (o.tusks) for (const s of [-1, 1]) add(tube(curve([V(s * R * 0.3, -R * 0.2, hl * 0.8), V(s * R * 0.45, R * 0.1, hl * 0.95), V(s * R * 0.35, R * 0.35, hl * 0.85)], 8), t => R * 0.08 * (1 - t * 0.7), { n: 6 }), m.horn, head);
  if (o.fangs) for (const s of [-1, 1]) add(cone(R * 0.06, R * 0.35, 5), m.horn, head, s * R * 0.2, -R * 0.35, hl * 0.8).rotation.x = Math.PI;
  // legs: thigh, shin, a foot; hooves or paws
  const lx = R * 0.7, legs = [[lx, sh * 0.9], [-lx, sh * 0.9], [lx, -sh * 0.9], [-lx, -sh * 0.9]];
  legs.forEach(([x, z], i) => {
    const leg = new THREE.Group(); leg.position.set(x, hipY, z); g.add(leg); parts.legs.push(leg);
    const top = R * (i < 2 ? 0.42 : 0.5), up = o.low ? [V(x > 0 ? R * 0.4 : -R * 0.4, -hipY * 0.5, 0)] : [];
    add(tube(curve([V(0, 0, 0), ...up, V(0, -hipY * 0.5, (i < 2 ? 0.02 : -0.06)), V(0, -hipY + 0.03, 0)], 10), t => top * (1 - t * 0.6), { n: 10 }), i < 2 ? m.body : m.body, leg);
    add(sph(top * 0.55, 8, 6), o.hooves ? m.dark : m.body, leg, 0, -hipY + 0.03, 0.02).scale.set(1, 0.6, 1.3);
  });
  // a tail
  if (o.tail !== false) { const tl = o.tail || L * 0.35; const tg = new THREE.Group(); tg.position.set(0, hipY + R * 0.3, -sh - R * 0.5); g.add(tg); parts.tail = tg; add(tube(curve([V(0, 0, 0), V(0, -tl * 0.2, -tl * 0.5), V(0, -tl * 0.5, -tl)], 10), t => R * (o.fatTail ? 0.4 : 0.18) * (1 - t * 0.8), { n: 8 }), o.tailMat === 'dark' ? m.dark : m.body, tg); }
  // spines and thorns along the back, moss in patches
  if (o.spines) for (let i = 0; i < o.spines; i++) { const t = i / (o.spines - 1), p = spine[Math.floor(t * (spine.length - 1))]; for (const s of o.thornRows ? [-1, 0, 1] : [0]) { const c = add(cone(R * 0.08, R * (0.35 + Math.sin(t * Math.PI) * 0.4), 5), o.spineMat === 'accent' ? m.accent : m.dark, g, p.x + s * R * 0.5, p.y + R * (0.9 - Math.abs(s) * 0.25), p.z); c.rotation.z = -s * 0.6; c.rotation.x = -0.4; } }
  if (o.moss) for (let i = 0; i < 6; i++) add(ico(R * 0.35, 1), m.accent, g, Math.sin(i * 2.1) * R * 0.5, hipY + R * 0.85, lerp(-sh, sh, i / 5)).scale.set(1, 0.4, 1);
  if (o.relicInBack) { const r = add(tube([V(0, 0, 0), V(R * 0.4, R * 1.4, -R * 0.3)], R * 0.06, { n: 6 }), m.horn, g, 0, hipY + R * 0.8, 0); add(wedge([[0, 0], [R * 0.5, R * 0.2], [R * 0.4, R * 0.7]], R * 0.06), m.glow, g, R * 0.4, hipY + R * 2.1, -R * 0.3); }
  return { g, parts, height: hipY + R * 2 + (o.antlers ? R * 2.6 : 0) };
};

// a hulking thing on two legs: trolls, sap-wights, armoured sentinels, forge-born, cinder-thralls, the unmade
P.biped = (m, o) => {
  const g = new THREE.Group(), parts = { legs: [], arms: [] };
  const H = o.h || 1, b = o.bulk || 1, hunch = o.hunch || 0;
  const hip = H * (o.shortLegs ? 0.36 : 0.45), shY = H * 0.78;
  const torso = new THREE.Group(); torso.position.y = hip; torso.rotation.x = hunch * 0.5; g.add(torso); parts.torso = torso;
  const tm = o.armor ? m.light : m.body;
  add(lathe([[0.13 * b, 0], [0.17 * b, 0.1], [0.2 * b, (shY - hip) * 0.6], [0.23 * b, (shY - hip) * 0.92], [0.1 * b, shY - hip + 0.03]], { n: 14, sz: 0.8 }), tm, torso);
  if (o.armor) { for (const f of [0.3, 0.75]) { const ring = add(tor(0.205 * b, 0.012, 6, 24), m.dark, torso, 0, (shY - hip) * f, 0); ring.rotation.x = Math.PI / 2; ring.scale.set(1, 0.82, 1); }
    for (const sd of [-1, 1]) add(sph(0.085 * b, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.light, torso, sd * 0.2 * b, shY - hip - 0.03, 0).scale.set(1, 0.7, 1); add(new THREE.BoxGeometry(0.14 * b, 0.14 * b, 0.05), m.accent, torso, 0, (shY - hip) * 0.6, 0.17 * b); }
  if (o.core) { const c = add(sph(0.07 * b, 12, 10), m.glow, torso, 0, (shY - hip) * 0.55, 0.16 * b); parts.core = c; }
  if (o.cracks) for (let i = 0; i < 8; i++) add(tube([V(Math.sin(i * 2.3) * 0.14 * b, (shY - hip) * (0.15 + (i % 4) * 0.2), 0.16 * b), V(Math.sin(i * 2.3 + 1) * 0.1 * b, (shY - hip) * (0.25 + (i % 4) * 0.2), 0.17 * b)], 0.008, { n: 4 }), m.glow, torso);
  if (o.apron) add(lathe([[0.2 * b, (shY - hip) * 0.7], [0.24 * b, 0], [0.26 * b, -hip * 0.6]], { n: 12, phi0: -1, phiLen: 2, sz: 0.85 }), m.dark, torso);
  if (o.moss) for (let i = 0; i < 5; i++) add(ico(0.06 * b, 1), m.accent, torso, Math.sin(i * 1.7) * 0.15 * b, (shY - hip) * (0.3 + i * 0.13), -0.08 * b).scale.set(1, 0.5, 1);
  // the head, low between the shoulders when it hunches
  const head = new THREE.Group(); head.position.set(0, shY - hip + 0.08 * b, hunch * 0.08); torso.add(head); parts.head = head;
  if (o.helm) { add(lathe([[0, 0.14], [0.09, 0.13], [0.1, 0.04], [0.1, -0.06]], { n: 12 }), m.dark, head); add(new THREE.BoxGeometry(0.14, 0.015, 0.02), m.eye, head, 0, 0.04, 0.1); }
  else if (o.sack) { add(sph(0.1, 14, 10), m.light, head).scale.set(0.9, 1.1, 0.9); for (const s of [-1, 1]) add(sph(0.016, 6, 4), m.dark, head, s * 0.035, 0.02, 0.09); }
  else { add(sph(0.1 * b * (o.bigHead ? 1.3 : 1), 14, 10), m.body, head).scale.set(1, 0.95, 1.05); eyes(head, m, 0.035 * b, 0.02, 0.085 * b, 0.016 * b); if (o.jaw) add(new THREE.BoxGeometry(0.12 * b, 0.05, 0.08 * b), m.body, head, 0, -0.07, 0.04); }
  if (o.horns) for (const s of [-1, 1]) add(tube(curve([V(s * 0.07, 0.05, 0), V(s * 0.17, 0.12, -0.02), V(s * 0.2, 0.22, 0.05)], 8), t => 0.025 * (1 - t * 0.8), { n: 6 }), m.horn, head);
  if (o.twigs) for (let i = 0; i < 5; i++) add(tube([V(0, 0.06, 0), V(Math.sin(i * 1.3) * 0.1, 0.2 + i * 0.02, Math.cos(i * 1.3) * 0.06)], 0.008, { n: 4 }), m.dark, head);
  // arms (long and heavy for a troll), legs
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.22 * b, shY - hip - 0.03, 0); torso.add(arm); parts.arms.push(arm);
    const al = (o.longArms ? 0.62 : 0.45) * H;
    add(tube(curve([V(0, 0, 0), V(s * 0.03, -al * 0.5, 0.03), V(0, -al, 0.06)], 10), t => 0.06 * b * (1 - t * 0.35) * (o.longArms ? 1.2 : 1), { n: 10 }), o.armor ? m.light : m.body, arm);
    add(sph(0.045 * b * (o.longArms ? 1.25 : 1), 10, 8), o.armor ? m.dark : m.body, arm, 0, -al, 0.06).scale.set(0.9, 1.1, 1.2);
    if (o.club && s === 1) add(tube(curve([V(0, -al, 0.06), V(0.02, -al - 0.15, 0.25), V(0.03, -al - 0.12, 0.45)], 8), t => 0.03 + t * 0.05, { n: 8 }), m.dark, arm);
    if (o.tool && s === 1) { add(tube([V(0, -al, 0.06), V(0, -al + 0.05, 0.4)], 0.015, { n: 6 }), m.dark, arm); add(new THREE.BoxGeometry(0.07, 0.07, 0.14), m.light, arm, 0, -al + 0.06, 0.42); }
    if (o.shield && s === -1) add(new THREE.BoxGeometry(0.04, 0.32, 0.24), m.accent, arm, -0.06, -al * 0.7, 0.1);
    if (o.blade && s === 1) add(wedge([[-0.02, 0], [0.02, 0], [0.01, 0.45], [0, 0.5]], 0.012), m.glow, arm, 0, -al, 0.08).rotation.x = Math.PI / 2;
    const leg = new THREE.Group(); leg.position.set(s * 0.09 * b, 0, 0); torso.add(leg); parts.legs.push(leg);
    add(tube([V(0, 0, 0), V(0, -hip * 0.5, 0.02), V(0, -hip + 0.03, 0)], t => 0.075 * b * (1 - t * 0.3), { n: 10 }), o.armor ? m.light : m.body, leg);
    add(new THREE.BoxGeometry(0.1 * b, 0.05, 0.16 * b), m.dark, leg, 0, -hip + 0.025, 0.03);
  }
  return { g, parts, height: H + 0.1 };
};

// a robed wraith, drowned monk or ghost: a long robe with no feet, a hood, thin hands, and what it carries
P.wraith = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const H = o.h || 1, ghost = o.ghost;
  const body = new THREE.Group(); body.position.y = ghost ? 0.12 : 0; g.add(body); parts.float = body;
  const rings = [[ghost ? 0.06 : 0.24, ghost ? 0.05 : 0], [0.2, H * 0.2], [0.16, H * 0.5], [0.15, H * 0.68], [0.1, H * 0.78]];
  add(lathe(rings, { n: 20, sz: 0.85 }), m.body, body);
  if (!ghost) add(lathe([[0.245, 0.0], [0.25, 0.02], [0.24, 0.05]], { n: 20, sz: 0.85 }), m.dark, body);
  if (o.sash) add(tor(0.155, 0.015, 6, 20), m.accent, body, 0, H * 0.48, 0).rotation.x = Math.PI / 2;
  // the hood, with darkness in it and two eyes
  const head = new THREE.Group(); head.position.y = H * 0.83; body.add(head); parts.head = head;
  add(sph(0.11, 16, 12, 0, TAU, 0, Math.PI * 0.75), m.body, head).scale.set(1, 1.2, 1);
  add(sph(0.085, 12, 10), new THREE.MeshBasicMaterial({ color: 0x050508 }), head, 0, -0.01, 0.03);
  eyes(head, m, 0.028, 0, 0.1, 0.012);
  if (o.mask) add(sph(0.06, 12, 8, 0, TAU, 0, Math.PI / 2), m.light, head, 0, -0.01, 0.07).rotation.x = Math.PI / 2;
  if (o.crown) for (let i = 0; i < 5; i++) add(cone(0.012, 0.07, 4), m.glow, head, Math.sin(i / 5 * TAU) * 0.09, 0.13, Math.cos(i / 5 * TAU) * 0.08);
  if (o.weeds) for (let i = 0; i < 7; i++) add(tube(curve([V(Math.sin(i) * 0.08, 0.08, Math.cos(i) * 0.06), V(Math.sin(i) * 0.12, -0.05, Math.cos(i) * 0.1), V(Math.sin(i) * 0.1, -0.2, Math.cos(i) * 0.08)], 6), 0.008, { n: 4 }), m.accent, head);
  // the arms come out of wide sleeves
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.14, H * 0.66, 0.02); body.add(arm);
    add(tube([V(0, 0, 0), V(s * 0.05, -0.18, 0.1)], t => 0.04 + t * 0.03, { n: 10, capB: false }), m.body, arm);
    add(sph(0.025, 8, 6), m.light, arm, s * 0.055, -0.2, 0.11);
    if (o.lantern && s === 1) { add(tube([V(s * 0.055, -0.2, 0.11), V(s * 0.06, -0.3, 0.12)], 0.004, { n: 4 }), m.dark, arm); const l = add(sph(0.04, 10, 8), m.glow, arm, s * 0.06, -0.34, 0.12); parts.lamp = l; }
    if (o.staff && s === -1) { add(tube([V(s * 0.055, 0.25, 0.12), V(s * 0.055, -H * 0.66, 0.12)], 0.012, { n: 6 }), m.dark, arm); add(sph(0.035, 10, 8), m.glow, arm, s * 0.055, 0.28, 0.12); }
    if (o.bell && s === 1) add(lathe([[0.01, 0.03], [0.04, 0.0], [0.06, -0.06]], { n: 14 }), m.accent, arm, s * 0.06, -0.24, 0.12);
    if (o.book && s === -1) add(new THREE.BoxGeometry(0.1, 0.13, 0.03), m.accent, arm, s * 0.06, -0.22, 0.13);
  }
  if (o.mist) for (let i = 0; i < 8; i++) add(sph(0.06, 8, 6), m.light, g, Math.sin(i * 0.8) * 0.2, 0.02, Math.cos(i * 0.8) * 0.18).scale.set(1.6, 0.35, 1.6);
  return { g, parts, height: H + 0.15 };
};

// a scorpion: plated body, eight legs, two claws, a tail curled over its back with a stinger (and a relic in it)
P.scorpion = (m, o) => {
  const g = new THREE.Group(), parts = { legs: [] }, s0 = o.size || 1;
  const segs = 5, body = [];
  for (let i = 0; i < segs; i++) { const z = lerp(0.25, -0.2, i / (segs - 1)) * s0, w = (0.16 - i * 0.012) * s0; add(sph(w, 14, 10), i % 2 ? m.body : m.light, g, 0, 0.12 * s0, z).scale.set(1.2, 0.55, 0.75); body.push(z); }
  add(sph(0.12 * s0, 14, 10), m.body, g, 0, 0.13 * s0, 0.36 * s0).scale.set(1.1, 0.6, 0.8);
  eyes(g, m, 0.04 * s0, 0.18 * s0, 0.44 * s0, 0.014 * s0);
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const z = lerp(0.2, -0.12, i / 3) * s0, leg = new THREE.Group(); leg.position.set(s * 0.14 * s0, 0.12 * s0, z); g.add(leg); parts.legs.push(leg); add(tube(curve([V(0, 0, 0), V(s * 0.16 * s0, 0.08 * s0, 0), V(s * 0.26 * s0, -0.12 * s0, 0.02 * s0)], 8), t => 0.022 * s0 * (1 - t * 0.6), { n: 6 }), m.dark, leg); }
  for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(s * 0.12 * s0, 0.13 * s0, 0.42 * s0); g.add(arm); add(tube(curve([V(0, 0, 0), V(s * 0.12 * s0, 0.04 * s0, 0.12 * s0), V(s * 0.08 * s0, 0.04 * s0, 0.3 * s0)], 8), 0.03 * s0, { n: 8 }), m.body, arm); add(sph(0.07 * s0, 12, 8), m.light, arm, s * 0.08 * s0, 0.04 * s0, 0.36 * s0).scale.set(0.8, 0.6, 1.3); for (const k of [-1, 1]) add(cone(0.025 * s0, 0.12 * s0, 6), m.light, arm, s * 0.08 * s0 + k * 0.025 * s0, 0.04 * s0, 0.46 * s0).rotation.x = Math.PI / 2; }
  const tail = new THREE.Group(); tail.position.set(0, 0.14 * s0, -0.24 * s0); g.add(tail); parts.tail = tail;
  const tp = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 1.15; tp.push(V(0, Math.sin(a) * 0.45 * s0, -Math.cos(a) * 0.22 * s0 - 0.08 * s0 + Math.sin(a) * 0.05)); }
  add(tube(curve([V(0, 0, 0.06 * s0), ...tp], 24), t => (0.07 - t * 0.04) * s0, { n: 10 }), m.body, tail);
  const st = tp[tp.length - 1]; add(cone(0.035 * s0, 0.14 * s0, 6), m.dark, tail, st.x, st.y, st.z + 0.05 * s0).rotation.x = 1.8;
  if (o.relic) { add(wedge([[0, 0], [0.04 * s0, 0.02 * s0], [0.02 * s0, 0.35 * s0], [0, 0.4 * s0]], 0.01 * s0), m.glow, tail, st.x, st.y + 0.02, st.z); }
  if (o.carapace) add(sph(0.2 * s0, 16, 8, 0, TAU, 0, Math.PI / 2), m.accent, g, 0, 0.15 * s0, 0.05 * s0).scale.set(1.1, 0.4, 1.4);
  return { g, parts, height: 0.6 * s0 };
};

// a serpent, worm, leech or fish: a long body of rings, eyes, jaws or fins
P.serpent = (m, o) => {
  const g = new THREE.Group(), parts = {}, L = o.len || 1.2, R = o.r || 0.1, rise = o.rise || 0;
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(V(Math.sin(t * Math.PI * 2) * L * 0.08 * (o.fish ? 0.3 : 1), R + Math.pow(Math.max(0, t - 0.55) / 0.45, 1.6) * rise, lerp(-L * 0.5, L * 0.5, t))); }
  const body = add(tube(curve(pts, 30), t => { const w = o.fish ? R * Math.sin(Math.max(0.08, Math.min(1, t * 1.2)) * Math.PI) * (t > 0.85 ? 1.4 : 1) : R * (0.4 + Math.sin(Math.min(1, t * 1.1) * Math.PI * 0.9) * 0.7); return [w, w * (o.fish ? 1.3 : 0.9)]; }, { n: 14 }), m.body, g);
  parts.body = body;
  const hp = pts[20];
  // (rings round a grub or leech are its own pale bands, painted by its sprite's colours: the light material every other segment)
  if (o.rings) for (let i = 3; i < 19; i += 3) add(sph(R * 0.5, 10, 8), m.light, g, pts[i].x, pts[i].y + R * 0.75, pts[i].z).scale.set(1.4, 0.25, 0.5);
  eyes(g, m, R * 0.5, hp.y + R * 0.4, hp.z - R * 0.3, R * 0.14);
  if (o.jaws) { add(cone(R * 0.55, R * 2.2, 8), m.body, g, hp.x, hp.y - R * 0.1, hp.z + R * 1.2).rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) add(cone(R * 0.06, R * 0.25, 4), m.horn, g, hp.x + (i % 2 ? 1 : -1) * R * 0.3, hp.y - R * 0.25, hp.z + R * (0.5 + i * 0.25)).rotation.x = Math.PI; }
  if (o.mouth) add(tor(R * 0.45, R * 0.12, 6, 14), m.dark, g, hp.x, hp.y, hp.z + R * 0.4);
  if (o.fish) { for (const s of [-1, 1]) add(wedge([[0, 0], [s * R * 1.4, -R * 0.8], [0, -R * 1.2]], R * 0.04), m.dark, g, s * R * 0.6, R * 0.6, L * 0.15).rotation.y = s * 0.3; add(wedge([[0, 0], [0, R * 1.6], [-R * 2.2, R * 0.2]], R * 0.04), m.dark, g, 0, R * 1.6, -L * 0.05).rotation.y = Math.PI / 2; add(wedge([[0, 0], [R * 1.4, R * 1.4], [R * 1.4, -R * 1.4]], R * 0.05), m.dark, g, 0, pts[0].y, pts[0].z - R * 0.6).rotation.y = Math.PI / 2; }
  if (o.mane) for (let i = 10; i < 20; i++) add(cone(R * 0.12, R * 0.9, 5), m.accent, g, pts[i].x, pts[i].y + R * 0.9, pts[i].z).rotation.x = -0.5;
  if (o.spikes) for (let i = 3; i < 19; i += 2) add(cone(R * 0.1, R * 0.6, 5), m.dark, g, pts[i].x, pts[i].y + R * 0.9, pts[i].z);
  if (o.chains) for (let i = 0; i < 4; i++) add(tor(R * 0.95, R * 0.07, 5, 16), m.light, g, pts[6 + i * 3].x, pts[6 + i * 3].y, pts[6 + i * 3].z);
  if (o.water) add(new THREE.CircleGeometry(L * 0.7, 32), new THREE.MeshStandardMaterial({ color: m.dark.color, transparent: true, opacity: 0.5, roughness: 0.1 }), g, 0, 0.005, 0).rotation.x = -Math.PI / 2;
  return { g, parts, height: R * 2 + rise };
};

// a winged thing: a moth (soft wings, feelers) or a great bird (feathered wings, beak, talons)
P.winged = (m, o) => {
  const g = new THREE.Group(), parts = { wings: [] }, S = o.span || 1, bird = o.bird;
  const fly = new THREE.Group(); fly.position.y = o.perch ? 0.3 * S : 0.4 * S; g.add(fly); parts.float = fly;
  if (bird) { add(sph(0.16 * S, 16, 12), m.body, fly).scale.set(0.9, 0.9, 1.6); add(sph(0.09 * S, 12, 10), m.body, fly, 0, 0.08 * S, 0.24 * S); add(cone(0.03 * S, 0.1 * S, 6), m.horn, fly, 0, 0.06 * S, 0.34 * S).rotation.x = Math.PI / 2; eyes(fly, m, 0.04 * S, 0.1 * S, 0.3 * S, 0.012 * S); add(wedge([[0, 0], [0.15 * S, -0.3 * S], [-0.15 * S, -0.3 * S]], 0.01 * S), m.dark, fly, 0, 0, -0.26 * S).rotation.x = -Math.PI / 2 + 0.2; for (const s of [-1, 1]) add(tube(curve([V(s * 0.06 * S, -0.1 * S, 0.05 * S), V(s * 0.07 * S, -0.25 * S, 0.1 * S), V(s * 0.06 * S, -0.3 * S, 0.16 * S)], 6), 0.012 * S, { n: 5 }), m.horn, fly); if (o.sparks) for (let i = 0; i < 5; i++) add(sph(0.015 * S, 6, 4), m.glow, fly, Math.sin(i) * 0.2 * S, Math.cos(i * 2) * 0.1 * S, 0); }
  else { add(sph(0.06 * S, 12, 10), m.body, fly).scale.set(1, 1, 2.4); add(sph(0.05 * S, 10, 8), m.light, fly, 0, 0.01, 0.15 * S); eyes(fly, m, 0.03 * S, 0.02 * S, 0.19 * S, 0.016 * S); for (const s of [-1, 1]) add(tube(curve([V(s * 0.02 * S, 0.04 * S, 0.18 * S), V(s * 0.08 * S, 0.14 * S, 0.26 * S), V(s * 0.12 * S, 0.16 * S, 0.22 * S)], 8), 0.004 * S, { n: 4 }), m.dark, fly); if (o.lamp) parts.lamp = add(sph(0.05 * S, 10, 8), m.glow, fly, 0, -0.03, -0.14 * S); }
  for (const s of [-1, 1]) for (const k of bird ? [0] : [0, 1]) {
    const w = new THREE.Group(); w.position.set(s * 0.06 * S, bird ? 0.06 * S : 0.02 * S, (k ? -0.05 : 0.04) * S); fly.add(w); parts.wings.push([w, s]);
    const shape = bird ? [[0, 0.08], [0.25, 0.12], [0.55, 0.02], [0.7, -0.05], [0.45, -0.14], [0.15, -0.12], [0, -0.05]] : k ? [[0, 0], [0.22, -0.05], [0.3, -0.2], [0.15, -0.26], [0, -0.08]] : [[0, 0], [0.18, 0.18], [0.42, 0.16], [0.4, -0.02], [0.18, -0.06]];
    const geo = wedge(shape.map(([x, y]) => [s * x * S, y * S]), 0.006 * S); geo.rotateX(-Math.PI / 2);
    add(geo, k ? m.accent : m.light, w);
    if (!bird) add(sph(0.035 * S, 10, 6), m.dark, w, s * 0.24 * S, 0.004 * S, (k ? 0.17 : -0.08) * S).scale.set(1, 0.15, 1);
  }
  return { g, parts, height: (o.perch ? 0.45 : 0.75) * S };
};

// a frog: squat body, wide mouth, big eyes on top, folded legs (the Mire Lord wears a crown of reeds)
P.frog = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const body = add(sph(0.38, 20, 14), m.body, g, 0, 0.32, 0); body.scale.set(1.15, 0.8, 1.05); parts.body = body;
  add(sph(0.3, 18, 12), m.light, g, 0, 0.25, 0.12).scale.set(1, 0.7, 1);
  for (const s of [-1, 1]) { add(sph(0.1, 12, 10), m.body, g, s * 0.2, 0.58, 0.2); add(sph(0.06, 12, 10), m.eye, g, s * 0.21, 0.61, 0.27); add(sph(0.16, 12, 10), m.body, g, s * 0.36, 0.12, -0.1).scale.set(0.8, 0.6, 1.4); add(sph(0.08, 10, 8), m.body, g, s * 0.26, 0.08, 0.3).scale.set(1, 0.5, 1.4); }
  add(tor(0.26, 0.015, 6, 24, Math.PI), m.dark, g, 0, 0.3, 0.32).rotation.set(Math.PI / 2 + 0.3, 0, Math.PI);
  if (o.crown) for (let i = 0; i < 7; i++) add(tube([V(0, 0, 0), V(0, 0.18, 0)], 0.012, { n: 4 }), m.accent, g, Math.sin(i - 3) * 0.14, 0.6, 0.02 - Math.abs(i - 3) * 0.02);
  if (o.warts) for (let i = 0; i < 14; i++) add(sph(0.03, 6, 4), m.dark, g, Math.sin(i * 2.4) * 0.3, 0.48 + Math.cos(i * 1.7) * 0.06, Math.cos(i * 2.4) * 0.25);
  return { g, parts, height: 0.75 };
};

// a mound of bog that walks (a lurcher), with reeds growing out of it and eyes in the muck
P.mound = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const geo = sph(0.45, 24, 16); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + Math.sin(x * 9) * Math.cos(z * 7) * 0.08 + Math.sin(y * 11) * 0.05; p.setXYZ(i, x * n, Math.max(-0.05, y) * n * 0.9, z * n); }
  geo.computeVertexNormals(); parts.body = add(geo, m.body, g, 0, 0.05, 0);
  for (let i = 0; i < 8; i++) add(ico(0.12, 1), m.accent, g, Math.sin(i * 1.9) * 0.3, 0.3 + Math.cos(i * 1.3) * 0.1, Math.cos(i * 1.9) * 0.3).scale.set(1, 0.4, 1);
  for (let i = 0; i < 6; i++) { add(tube([V(0, 0, 0), V(Math.sin(i) * 0.04, 0.45, Math.cos(i) * 0.04)], 0.01, { n: 4 }), m.accent, g, Math.sin(i * 2.2) * 0.2, 0.35, Math.cos(i * 2.2) * 0.15 - 0.1); add(sph(0.025, 6, 6), m.dark, g, Math.sin(i * 2.2) * 0.2 + Math.sin(i) * 0.04, 0.8, Math.cos(i * 2.2) * 0.15 - 0.1 + Math.cos(i) * 0.04).scale.set(1, 2.4, 1); }
  eyes(g, m, 0.1, 0.32, 0.4, 0.04);
  for (const s of [-1, 1]) add(tube(curve([V(s * 0.38, 0.25, 0.1), V(s * 0.55, 0.1, 0.25), V(s * 0.5, 0.02, 0.4)], 8), t => 0.07 * (1 - t * 0.5), { n: 8 }), m.body, g);
  return { g, parts, height: 0.9 };
};

// a walking toadstool
P.mushroom = (m, o) => {
  const g = new THREE.Group(), parts = {};
  add(lathe([[0.12, 0], [0.1, 0.25], [0.09, 0.45], [0.14, 0.5]], { n: 18 }), m.light, g);
  const cap = new THREE.Group(); cap.position.y = 0.5; g.add(cap); parts.head = cap;
  add(lathe([[0.04, 0.22], [0.25, 0.18], [0.42, 0.06], [0.46, -0.02], [0.13, 0.0]], { n: 28 }), m.body, cap);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 0.18 + (i % 3) * 0.08; add(sph(0.04, 8, 6), m.glow, cap, Math.cos(a) * r, 0.2 - r * 0.32, Math.sin(a) * r).scale.set(1, 0.4, 1); }
  for (let i = 0; i < 18; i++) add(new THREE.BoxGeometry(0.004, 0.02, 0.3), m.dark, cap, 0, 0.005, 0).rotation.y = i / 18 * Math.PI;
  eyes(g, m, 0.04, 0.38, 0.1, 0.02);
  for (const s of [-1, 1]) add(tube(curve([V(s * 0.06, 0.02, 0), V(s * 0.16, -0.02, 0.05), V(s * 0.22, 0.0, 0.1)], 6), 0.025, { n: 6 }), m.light, g);
  return { g, parts, height: 0.8 };
};

// a heap of stones that moves: rocklings
P.rocks = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const pts = [[0, 0.22, 0, 0.24], [0.2, 0.16, 0.05, 0.16], [-0.2, 0.15, 0.02, 0.17], [0.05, 0.42, -0.02, 0.17], [-0.12, 0.08, 0.15, 0.12], [0.14, 0.07, -0.16, 0.12]];
  for (const [x, y, z, r] of pts) { const s = add(new THREE.DodecahedronGeometry(r, 1), m.body, g, x, y, z); s.rotation.set(x * 9, y * 7, z * 5); }
  for (let i = 0; i < 5; i++) add(ico(0.04, 0), m.light, g, Math.sin(i * 1.4) * 0.2, 0.3 + (i % 2) * 0.1, Math.cos(i * 1.4) * 0.18);
  eyes(g, m, 0.06, 0.44, 0.15, 0.025); parts.head = g.children[3];
  return { g, parts, height: 0.6 };
};

// a spark or marsh-light: a glowing core with a halo and drifting embers
P.spark = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const f = new THREE.Group(); f.position.y = 0.45; g.add(f); parts.float = f;
  add(ico(0.12, 2), m.glow, f); add(sph(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: m.glow.color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), f);
  if (o.face) { for (const s of [-1, 1]) add(sph(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0x101010 }), f, s * 0.04, 0.02, 0.11); add(tor(0.025, 0.006, 4, 10, Math.PI), new THREE.MeshBasicMaterial({ color: 0x101010 }), f, 0, -0.03, 0.11).rotation.z = Math.PI; }
  parts.embers = []; for (let i = 0; i < 8; i++) parts.embers.push(add(sph(0.015, 6, 4), m.glow, g, Math.sin(i) * 0.2, 0.2 + i * 0.05, Math.cos(i) * 0.2));
  return { g, parts, height: 0.7 };
};

// a willow that walks: a trunk with a face in the bark, roots for feet, curtains of hanging fronds
P.willow = (m, o) => {
  const g = new THREE.Group(), parts = {}, H = o.h || 1.4;
  add(tube(curve([V(0, 0, 0), V(0.04, H * 0.3, 0), V(-0.03, H * 0.6, 0.02), V(0, H * 0.75, 0)], 12), t => 0.16 * (1.1 - t * 0.5), { n: 14 }), m.dark, g);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(tube(curve([V(0, 0.15, 0), V(Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.2), V(Math.cos(a) * 0.34, 0.0, Math.sin(a) * 0.34)], 8), t => 0.05 * (1 - t * 0.7), { n: 6 }), m.dark, g); }
  for (const s of [-1, 1]) { add(sph(0.035, 8, 6), m.eye, g, s * 0.06, H * 0.55, 0.13); }
  add(tor(0.05, 0.012, 5, 10, Math.PI), new THREE.MeshBasicMaterial({ color: 0x080604 }), g, 0, H * 0.46, 0.14).rotation.z = Math.PI;
  const crown = new THREE.Group(); crown.position.y = H * 0.78; g.add(crown); parts.head = crown;
  add(sph(0.38, 18, 10, 0, TAU, 0, Math.PI / 2), m.body, crown).scale.set(1, 0.5, 1);
  parts.fronds = [];
  const n = Math.round(30 * (Q.d > 1 ? 1.6 : 1));
  for (let i = 0; i < n; i++) { const a = i / n * TAU + (i % 3) * 0.2, r = 0.3 + (i % 4) * 0.04, len = H * (0.45 + (i % 5) * 0.06); const fr = add(tube(curve([V(Math.cos(a) * r, 0.04, Math.sin(a) * r), V(Math.cos(a) * (r + 0.05), -len * 0.5, Math.sin(a) * (r + 0.05)), V(Math.cos(a) * (r + 0.03), -len, Math.sin(a) * (r + 0.03))], 8), t => [0.03 * (1 - t * 0.5), 0.006], { n: 4, up: V(Math.cos(a), 0, Math.sin(a)) }), i % 2 ? m.body : m.accent, crown); parts.fronds.push(fr); }
  if (o.arms) for (const s of [-1, 1]) add(tube(curve([V(s * 0.12, H * 0.55, 0), V(s * 0.35, H * 0.5, 0.1), V(s * 0.45, H * 0.3, 0.2)], 10), t => 0.04 * (1 - t * 0.6), { n: 6 }), m.dark, g);
  return { g, parts, height: H + 0.25 };
};

// Mother Anvil: an anvil on four iron legs with a forge-fire in its belly, a hammer raised over it
P.anvil = (m, o) => {
  const g = new THREE.Group(), parts = {};
  add(new THREE.BoxGeometry(0.9, 0.18, 0.4), m.dark, g, 0, 0.72, 0);
  add(cone(0.12, 0.45, 4), m.dark, g, 0.65, 0.74, 0).rotation.z = -Math.PI / 2;
  add(new THREE.BoxGeometry(0.55, 0.32, 0.36), m.body, g, 0, 0.48, 0);
  const fire = add(new THREE.BoxGeometry(0.3, 0.14, 0.02), m.glow, g, 0, 0.47, 0.19); parts.core = fire;
  for (const [x, z] of [[0.3, 0.15], [-0.3, 0.15], [0.3, -0.15], [-0.3, -0.15]]) add(tube(curve([V(x * 0.7, 0.35, z * 0.7), V(x * 1.2, 0.2, z * 1.3), V(x * 1.3, 0.0, z * 1.4)], 6), 0.04, { n: 6 }), m.dark, g);
  eyes(g, m, 0.12, 0.6, 0.19, 0.03);
  const ham = new THREE.Group(); ham.position.set(-0.2, 1.0, 0); g.add(ham); parts.head = ham;
  add(tube([V(0, -0.2, 0), V(0, 0.4, 0)], 0.025, { n: 6 }), m.light, ham); add(new THREE.BoxGeometry(0.3, 0.12, 0.12), m.dark, ham, 0, 0.42, 0);
  return { g, parts, height: 1.5 };
};

// a briarling: a little bramble creature, a ball of thorny vines with a sprout on its head
P.sapling = (m, o) => {
  const g = new THREE.Group(), parts = {};
  const body = add(ico(0.2, 2), m.body, g, 0, 0.26, 0); parts.body = body;
  for (let i = 0; i < 12; i++) { const a = i * 2.39, y = Math.cos(i * 1.1) * 0.15; add(tube(curve([V(Math.sin(a) * 0.12, 0.26 + y, Math.cos(a) * 0.12), V(Math.sin(a) * 0.24, 0.3 + y * 1.2, Math.cos(a) * 0.24), V(Math.sin(a + 0.6) * 0.22, 0.32 + y, Math.cos(a + 0.6) * 0.22)], 6), 0.012, { n: 4 }), m.dark, g); add(cone(0.012, 0.05, 4), m.dark, g, Math.sin(a) * 0.22, 0.3 + y * 1.2, Math.cos(a) * 0.22); }
  add(tube([V(0, 0.42, 0), V(0.02, 0.56, 0)], 0.01, { n: 4 }), m.accent, g); for (const s of [-1, 1]) add(sph(0.04, 8, 6), m.accent, g, s * 0.04, 0.58, 0).scale.set(1.4, 0.4, 0.8);
  eyes(g, m, 0.06, 0.3, 0.17, 0.025);
  for (const s of [-1, 1]) add(tube([V(s * 0.08, 0.12, 0), V(s * 0.1, 0.0, 0.03)], 0.025, { n: 6 }), m.dark, g);
  return { g, parts, height: 0.62 };
};

/* ------------------------------------------------------------------ the 54 families */
// plan, skin (the material), size (metres tall in the world), and the plan's options
export const BEASTS = {
  briarling: ['sapling', 'bark', 0.6], thornhound: ['quad', 'fur', 0.9, { ears: 1, fangs: 1, spines: 9, len: 1.4, girth: 0.17, tail: 0.5 }],
  rotstag: ['quad', 'fur', 2.0, { antlers: 1, vines: 1, len: 1.3, h: 1.0, girth: 0.16, hooves: 1, tail: 0.15, headUp: 0.35, snout: 0.3 }],
  oldsnag: ['quad', 'hide', 1.3, { tusks: 1, ears: 1, belly: 1, len: 1.5, h: 0.62, girth: 0.24, hooves: 1, moss: 1, relicInBack: 1, tail: 0.2 }],
  briarmaw: ['quad', 'hide', 1.7, { fangs: 1, spines: 12, thornRows: 1, spineMat: 'accent', moss: 1, len: 1.6, h: 0.75, girth: 0.25, tail: 0.6, fatTail: 1 }],
  boglurcher: ['mound', 'slime', 1.0], glowcap: ['mushroom', 'cloth', 0.8], rotgrub: ['serpent', 'slime', 0.35, { len: 1.0, r: 0.12, rings: 1, mouth: 1 }],
  sapwight: ['biped', 'bark', 1.6, { h: 1.0, bulk: 0.8, twigs: 1, moss: 1, longArms: 1 }], gloamwing: ['winged', 'cloth', 1.2, { span: 1.4 }],
  mirelord: ['frog', 'slime', 1.1, { crown: 1, warts: 1 }], rotwarden: ['biped', 'bark', 2.1, { h: 1.0, bulk: 1.15, armor: 0, twigs: 1, moss: 1, horns: 1, club: 1 }],
  'sand-skink': ['quad', 'hide', 0.35, { low: 1, len: 1.4, h: 0.45, girth: 0.12, tail: 0.8, snout: 0.25 }],
  'glass-scorpion': ['scorpion', 'glass', 0.6, { size: 1 }], 'glass-matriarch': ['scorpion', 'glass', 1.0, { size: 1.3, carapace: 1 }],
  'mirage-wisp': ['wraith', 'ghost', 1.3, { ghost: 1, h: 0.9 }], 'wisp-queen': ['wraith', 'ghost', 1.8, { ghost: 1, h: 0.95, crown: 1 }],
  'sand-wyrm': ['serpent', 'hide', 1.6, { len: 2.0, r: 0.22, rise: 0.9, mouth: 1, rings: 1, spikes: 1 }], kharzul: ['scorpion', 'glass', 1.5, { size: 1.6, relic: 1, carapace: 1 }],
  'ashen-warden': ['biped', 'metal', 2.2, { h: 1.0, bulk: 1.1, armor: 1, helm: 1, shield: 1, blade: 1, core: 1 }],
  'rime-wolf': ['quad', 'fur', 0.95, { ears: 1, fangs: 1, len: 1.4, girth: 0.17, tail: 0.5 }], rockling: ['rocks', 'stone', 0.6],
  'forge-spark': ['spark', 'metal', 0.5, {}], 'iron-sentinel': ['biped', 'metal', 1.9, { h: 1.0, bulk: 1.3, armor: 1, helm: 1, core: 1, shortLegs: 1 }],
  'sentinel-captain': ['biped', 'metal', 2.1, { h: 1.0, bulk: 1.3, armor: 1, helm: 1, core: 1, shield: 1, shortLegs: 1 }],
  forgeborn: ['biped', 'stone', 1.9, { h: 1.0, bulk: 1.3, cracks: 1, core: 1, longArms: 1, hunch: 0.3 }], bellows: ['biped', 'stone', 2.0, { h: 1.0, bulk: 1.4, cracks: 1, core: 1, longArms: 1, hunch: 0.4 }],
  journeyman: ['biped', 'stone', 1.8, { h: 1.0, bulk: 1.1, cracks: 1, core: 1, apron: 1, tool: 1 }],
  'peak-troll': ['biped', 'hide', 2.4, { h: 1.0, bulk: 1.4, hunch: 0.6, longArms: 1, club: 1, jaw: 1, moss: 1 }], 'old-horn': ['biped', 'hide', 2.7, { h: 1.0, bulk: 1.5, hunch: 0.6, longArms: 1, club: 1, horns: 1, jaw: 1 }],
  'rime-wraith': ['wraith', 'cloth', 1.8, { h: 1.0, mist: 1 }], 'drowned-abbess': ['wraith', 'cloth', 1.8, { h: 1.0, mist: 1, lantern: 1, sash: 1 }],
  'choir-wraith': ['wraith', 'cloth', 1.8, { h: 1.0, mist: 1, book: 1 }], 'thunder-roc': ['winged', 'fur', 2.0, { bird: 1, span: 1.5, sparks: 1 }],
  'mother-anvil': ['anvil', 'metal', 1.6], 'rime-abbot': ['wraith', 'cloth', 2.2, { h: 1.0, mist: 1, staff: 1, crown: 1, sash: 1 }],
  'mire-leech': ['serpent', 'slime', 0.3, { len: 0.9, r: 0.1, rings: 1, mouth: 1 }], 'marsh-light': ['spark', 'ghost', 0.6, { face: 1 }],
  'lamp-moth': ['winged', 'cloth', 0.8, { span: 1, lamp: 1 }], 'blackwater-gar': ['serpent', 'hide', 0.4, { len: 1.3, r: 0.1, fish: 1, jaws: 1, water: 1 }],
  'old-jaws': ['serpent', 'hide', 0.6, { len: 1.8, r: 0.15, fish: 1, jaws: 1, water: 1 }], 'willow-wight': ['willow', 'bark', 1.8, { h: 1.4 }],
  'grandfather-willow': ['willow', 'bark', 2.8, { h: 1.6, arms: 1 }], drowned: ['wraith', 'cloth', 1.7, { h: 1.0, weeds: 1 }],
  'bell-ringer': ['wraith', 'cloth', 1.7, { h: 1.0, weeds: 1, bell: 1 }], 'drowned-choir': ['wraith', 'cloth', 1.6, { h: 1.0, weeds: 1, book: 1 }],
  'drowned-cantor': ['wraith', 'cloth', 1.8, { h: 1.0, weeds: 1, staff: 1, sash: 1 }], 'lantern-mother': ['wraith', 'cloth', 2.1, { h: 1.0, mask: 1, lantern: 1, staff: 1 }],
  'blackwater-leviathan': ['serpent', 'hide', 2.2, { len: 3.0, r: 0.3, rise: 1.4, jaws: 1, mane: 1, chains: 1, water: 1 }],
  unsmith: ['biped', 'cloth', 1.9, { h: 1.0, bulk: 1.1, apron: 1, tool: 1, core: 1 }], 'cinder-thrall': ['biped', 'stone', 1.7, { h: 1.0, bulk: 0.85, cracks: 1 }],
  'thrall-overseer': ['biped', 'stone', 1.9, { h: 1.0, bulk: 1.0, cracks: 1, core: 1, tool: 1 }], unmade: ['biped', 'cloth', 1.7, { h: 1.0, bulk: 0.8, sack: 1, blade: 1 }],
  'forge-warden': ['biped', 'stone', 2.3, { h: 1.0, bulk: 1.5, armor: 1, core: 1, helm: 1, shortLegs: 1 }],
};

export function buildBeast(key, sprite) {
  const [plan, skin, tall, opts = {}] = BEASTS[key] || ['mound', 'hide', 1];
  const pal = paletteOf(sprite), m = mats(pal, skin);
  const b = P[plan](m, opts);
  const group = new THREE.Group(); group.add(b.g);
  b.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  b.g.scale.setScalar(tall / b.height);
  const parts = b.parts;
  return {
    group, plan, height: tall, palette: pal,
    update(t, step = 0) {
      const br = Math.sin(t * 2);
      if (parts.legs) parts.legs.forEach((l, i) => { l.rotation.x = Math.sin(step + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * (step ? 0.4 : 0); });
      if (parts.head) parts.head.rotation.y = Math.sin(t * 0.6) * 0.15;
      if (parts.tail) parts.tail.rotation.y = Math.sin(t * 1.4) * 0.25;
      if (parts.torso) parts.torso.scale.setScalar(1 + br * 0.012);
      if (parts.float) parts.float.position.y = (parts.float.userData.y0 ??= parts.float.position.y) + Math.sin(t * 1.8) * 0.04;
      if (parts.wings) parts.wings.forEach(([w, s]) => { w.rotation.z = s * Math.sin(t * (plan === 'winged' && opts.bird ? 3 : 9)) * 0.5; });
      if (parts.body) parts.body.scale.y = (parts.body.userData.sy ??= parts.body.scale.y) * (1 + br * 0.03);
      if (parts.core) parts.core.material.emissiveIntensity = 1.4 + Math.sin(t * 5) * 0.5;
      if (parts.lamp) parts.lamp.material.emissiveIntensity = 1.6 + Math.sin(t * 3) * 0.4;
      if (parts.embers) parts.embers.forEach((e, i) => { const a = t * 0.8 + i; e.position.set(Math.sin(a) * 0.22, 0.25 + ((t * 0.2 + i * 0.13) % 1) * 0.5, Math.cos(a) * 0.22); });
      if (parts.fronds) parts.fronds.forEach((f, i) => { f.rotation.x = Math.sin(t * 1.2 + i) * 0.04; });
      if (parts.arms) parts.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 1.5 + i * Math.PI) * 0.08; });
    },
  };
}
