// The wraiths in full detail (session 3, Models; the lane moved here from session 6 on November 21): the eleven robed
// foes, in Act order: drowned, bell-ringer, drowned-choir, drowned-cantor, drowned-abbess, choir-wraith, rime-wraith,
// the Rime-Abbot, the Lantern Mother, mirage-wisp, wisp-queen.
//
// Each is built from the heroes' kit (prototypes/hero-3d/kit.js: lofts, tubes and lathes in Chris's texture pack) and
// wears the same sculpted masters (robe, skirt, hood, mantle, cape, sleeves, hands, hafts, forged metal...), shaped to
// Chris's model sheets (art-in/3d/sheets/sheet-<key>.webp). Every piece is rigid on one moving node (body, chest, head,
// shoulder, elbow, hand, the hem, a prop), so nothing can stretch: the Fight's "no stretching" rule holds by build.
//
//   buildWraith(key, { detail: 'high' | 'light' }) -> the Fight's look: { group, plan: 'wraith', height, parts, rig,
//     update(t, step), pose(move, u, t, step), moves: { MOVES }, duration(move), hit(), act: { lunge, fall }, triangles }
//   wraithLook(key, sprite, opts) -> that look for the eleven, else null;  withWraiths(fallback) -> fn(key, sprite, opts)
//     for setBeastLook, chained with the foe kit's foeLook: setBeastLook(withWraiths(foeLook(buildBeast)))
//   WRAITHS: the eleven keys in Act order;  WRAITH_INFO[key]: { name, height, act, blurb }
import * as THREE from 'three';
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, plate, mat, fitMaster, withMaster, add, bake, sph, tor, cone, ico, Q, TEXTURES, rngOf } from '../hero-3d/kit.js';
import { BEASTS } from '../bestiary/beasts.js';

export const WRAITHS = ['drowned', 'bell-ringer', 'drowned-choir', 'drowned-cantor', 'drowned-abbess', 'choir-wraith', 'rime-wraith', 'rime-abbot', 'lantern-mother', 'mirage-wisp', 'wisp-queen'];
export const WRAITH_INFO = {
  drowned: { name: 'The Drowned', act: 'Act Two', blurb: 'A torn black coat over sodden trousers and boots; where the head was, a mass of weed lit with drowned lights; a little green bell in its hand.' },
  'bell-ringer': { name: 'The Bell-Ringer', act: 'Act Two', blurb: 'A tall black robe hung from a collar of stones, coral growing where the head should be, its bell hung on an iron crook over its shoulder.' },
  'drowned-choir': { name: 'The Drowned Choir', act: 'Act Two', blurb: 'A red cassock under a lace surplice, a cluster of little skulls and weed for a head, a brass bell held at its breast.' },
  'drowned-cantor': { name: 'The Drowned Cantor', act: 'Act Two', blurb: 'A black hood and a white mask with a sun for an eye, coral through the hood, a pearl collar, a green cope striped in gold, a coral staff.' },
  'drowned-abbess': { name: 'The Drowned Abbess', act: 'Act Two', blurb: 'A long dark veil over a blue drowned face, tier on tier of sea-green habit, a belt of beads, a silver lantern burning blue.' },
  'choir-wraith': { name: 'The Choir-Wraith', act: 'Act Three', blurb: 'A pointed hood, a white mask open in a song that leaves it as blue mist, tiered panels studded with rivets, a hymn book held in both hands.' },
  'rime-wraith': { name: 'The Rime-Wraith', act: 'Act Three', blurb: 'A frozen hooded cloak hung with icicles, a weeping blue face, a rope belt, its hem dissolving into blue water.' },
  'rime-abbot': { name: 'The Rime-Abbot', act: 'Act Three Champion', blurb: 'Brother Aurel: a braided cowl, a grille of ice for a face, a frost-edged cope with tassels, and the Rime Crozier lit blue.' },
  'lantern-mother': { name: 'The Lantern Mother', act: 'Act Three Champion', blurb: 'The last lamplighter of Misthollow: a black dress and coat, a fringed shawl, a crown of flowers on her hood, her lantern high and her hooked lamp-pole with its bell.' },
  'mirage-wisp': { name: 'The Mirage-Wisp', act: 'Act Three', blurb: 'A little figure of living water, a flame for a crown, hollow sad eyes and a blue crystal heart.' },
  'wisp-queen': { name: 'The Wisp-Queen', act: 'Act Three', blurb: 'Tongues of pale fire for a body, a white mask under a silver crown, a great blue jewel at her heart.' },
};
for (const k of WRAITHS) WRAITH_INFO[k].height = BEASTS[k]?.[2] || 1.8;

/* ------------------------------------------------------------------ materials */
const C = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const cloth = (h, o = {}) => mat(o.key || 'wool', { tint: C(h), side: true, ...o });
const solid = (key, h, o = {}) => mat(key, { tint: h ? C(h) : undefined, ...o });
const GLOW = new Map();
function glow(h, k = 2) {
  const id = h + k; if (GLOW.has(id)) return GLOW.get(id);
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(h), emissive: new THREE.Color(h), emissiveIntensity: k, roughness: 0.4 });
  m.userData.kind = 'glow'; m.userData.base = k; GLOW.set(id, m); return m;
}
// ghostly stuff: see-through, lit from inside, wearing the masters (withMaster) like any cloth
function ghost(h, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(h), emissive: new THREE.Color(o.glow || h), emissiveIntensity: o.k ?? 0.45, roughness: 0.25, metalness: 0, transparent: true, opacity: o.opacity ?? 0.78, side: THREE.DoubleSide, depthWrite: o.depthWrite ?? true, clearcoat: 0.6 });
  m.userData.kind = 'ghost'; return withMaster(m);
}

/* ------------------------------------------------------------------ the parts */
// a robe from y0 (top) down to y1 (hem), width w(t) and depth ratio d; folds; a tattered or scalloped hem
function robeRings({ y0, y1, w, d = 0.82, n = 40, steps = 14, folds = 0.03, k = 9, tatter = 0, scallop = 0, scallopN = 14, arch = 0, drape = 0, seed = 1, open = 0 }) {
  const N = Math.max(12, Math.round(n * (Q.d > 1 ? 1.4 : 1))), rnd = rngOf(seed), jag = [];
  for (let j = 0; j < N; j++) { const r = rnd(); jag.push(tatter * (0.12 + 0.6 * r * r + (rnd() < 0.14 ? 0.9 + rnd() * 0.6 : 0))); }
  for (let pass = 0; pass < 1; pass++) for (let j = 0; j < N; j++) jag[j] = Math.max(jag[j], (jag[(j + N - 1) % N] + jag[(j + 1) % N]) * 0.35); // points, not single threads
  const rings = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, y = lerp(y0, y1, t), R = w(t), ring = [];
    for (let j = 0; j < N; j++) {
      const a = j / N * Math.PI * 2, fold = 1 + folds * t * Math.cos(a * k + seed) + folds * 0.4 * t * Math.sin(a * (k * 2 + 1)) + drape * (0.3 + 0.7 * t) * Math.pow(Math.abs(Math.cos(a * 2.5 + seed * 0.7)), 3);
      let yy = y;
      if (t > 0.75) { const e = (t - 0.75) / 0.25; yy -= jag[j] * e * e; if (scallop) yy += scallop * e * e * (0.5 - 0.5 * Math.cos(a * scallopN)); if (arch) yy += arch * e * e * Math.sqrt(Math.abs(Math.sin(a * scallopN / 2))); }
      const front = Math.sin(a), gap = open && front > 0.92 ? (front - 0.92) * open : 0;
      ring.push(V(Math.cos(a) * R * fold * (1 - gap), yy, Math.sin(a) * R * d * fold));
    }
    rings.push(ring);
  }
  return rings;
}
// a robe's width from the neck over the shoulders and down: neck, shoulder, bottom (k: how far down the shoulders end)
const wsh = (neck, sh, low, k = 0.14) => t => (t < k ? lerp(neck, sh, Math.sqrt(smooth(t / k))) : lerp(sh, low, (t - k) / (1 - k)));
// a trim along the last ring of a robe (a wave-edged hem, a frost edge)
function hemTrim(parent, robeMesh, m, r = 0.012, lift = 0.004) { const ring = robeMesh.userData.rings.at(-1).map(p => p.clone().multiplyScalar(1.01).setY(p.y + lift)); return add(fitMaster(tube(ring, r, { closed: true, n: 6 }), 'braid'), m, parent); }
function robe(parent, m, o, kind = 'skirt') {
  const rings = robeRings(o), out = add(fitMaster(loft(rings), kind), m, parent); out.userData.rings = rings;
  // rags: shorter, a little wider layers hung over it, each torn deeper, so the hem is rag over rag like the paintings
  for (let i = 1; i <= (o.rags || 0); i++) {
    const lift = (o.y0 - o.y1) * 0.16 * i, grow = 0.012 * i;
    add(fitMaster(loft(robeRings({ ...o, y1: o.y1 + lift, w: t => o.w(t) + grow * t, tatter: (o.tatter || 0.08) * (1.25 + i * 0.25), seed: (o.seed || 1) * 7 + i, steps: Math.max(6, (o.steps || 14) - 3) })), kind), m, parent);
  }
  return out;
}
// a sleeve: an upper tube and a flared, maybe tattered cuff
function sleeve(sh, el, side, m, { L1 = 0.27, L2 = 0.26, r = 0.055, flare = 1.6, tatter = 0 } = {}) {
  add(fitMaster(tube(curve([V(0, 0.03, 0), V(0, -L1 * 0.5, 0.004), V(0, -L1, 0)], 10), t => [r * (1.15 - t * 0.2), r * (1.1 - t * 0.2)], { n: 14 }), 'sleeve'), m, sh);
  add(fitMaster(tube([V(0, 0.02, 0), V(0, -L2 * 0.6, 0.01), V(0, -L2, 0.02)], t => [r * lerp(0.95, flare, t * t), r * lerp(0.9, flare * 0.94, t * t)], { n: 18, capA: false, capB: false, shape: tatter ? ((a, t) => 1 + (t > 0.8 ? Math.sin(a * 7) * tatter * 0.3 : 0)) : null }), 'robesleeve'), m, el);
}
// a thin hand, fingers a little curled (open), or closed round a grip
function hand(h, side, m, { closed = false, len = 1 } = {}) {
  const s = len, med = -side;
  add(fitMaster(tube([V(0, 0.0, 0), V(0, -0.035 * s, 0.003), V(0, -0.07 * s, 0.005)], t => [0.016 * s, 0.03 * s * (0.8 + t * 0.3)], { n: 12, up: V(1, 0, 0) }), 'hand'), m, h);
  for (let f = 0; f < 4; f++) {
    const z = (f - 1.5) * 0.014 * s, pts = [];
    for (let i = 0; i <= 6; i++) { const a = closed ? lerp(0.2, 4.0, i / 6) : lerp(0, 1.1, i / 6) + (f === 3 ? 0.2 : 0); const R = 0.03 * s; pts.push(V(med * (closed ? 0.018 - Math.cos(a) * 0.016 : Math.sin(a) * 0.022 * s), -0.068 * s - (closed ? Math.sin(a) * 0.014 : (1 - Math.cos(a)) * 0.012 + i / 6 * 0.055 * s * (f === 3 ? 0.75 : 1)), z + 0.004)); }
    add(fitMaster(tube(curve(pts, 8), t => 0.0055 * s * (1 - t * 0.35), { n: 7 }), 'finger'), m, h);
  }
  add(fitMaster(tube(curve([V(med * 0.01, -0.02 * s, 0.02 * s), V(med * 0.02, -0.05 * s, 0.03 * s), V(med * 0.014, -0.075 * s, 0.03 * s)], 6), t => 0.007 * s * (1 - t * 0.3), { n: 7 }), 'finger'), m, h);
}
// a hood: a crown of cloth over the head and a drape opening at the front (open: half-width of the face opening)
function hood(head, m, { r = 0.13, k = 1.25, point = 0, open = 0.95, drape = true, inner = '#05070a' } = {}) {
  const prof = [[0, r * (1.12 + point) * k], [r * 0.3 * k, r * (1.09 + point * 0.6) * k], [r * 0.6 * k, r * (0.98 + point * 0.2) * k], [r * 0.85 * k, r * 0.8 * k], [r * 0.98 * k, r * 0.55 * k], [r * 1.0 * k, r * 0.4 * k]];
  add(fitMaster(lathe(prof, { n: 40, sx: 0.95 }), 'hood', { v1: 0.3 }), m, head);
  add(fitMaster(lathe([[r * 1.0 * k, r * 0.4 * k], [r * 1.06 * k, r * 0.0], [r * 1.02 * k, -r * 0.6 * k], [r * 0.98 * k, -r * 1.05 * k]], { n: 32, sx: 0.95, phi0: open, phiLen: Math.PI * 2 - open * 2 }), 'hood', { u0: open / (Math.PI * 2), u1: 1 - open / (Math.PI * 2), v0: 0.3 }), m, head);
  add(sph(r * 0.98, 20, 14), glowless(inner), head, 0, 0, -r * 0.08).scale.set(0.95, 1.05, 0.9);
}
const VOID = new Map();
function glowless(h) { if (VOID.has(h)) return VOID.get(h); const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(h), roughness: 1 }); m.userData.kind = 'void'; VOID.set(h, m); return m; }
// a face (the drowned women, the weeping wraith, the lamplighter): a skull with a brow, a nose, cheekbones, sunk eye sockets,
// eyes (lit or dark), a mouth (shut, or open in a cry) and, if they weep, tear-tracks of light
function face(head, skin, { r = 0.1, eyes = null, iris = '#0a0e12', mouth = 0, tears = null, gaunt = 0.3 } = {}) {
  add(sph(r, 28, 20), skin, head, 0, 0, 0.01).scale.set(0.88, 1.12, 0.95);
  add(sph(r * 0.55, 16, 10), skin, head, 0, r * 0.32, r * 0.55).scale.set(1.35, 0.35, 0.7);                       // the brow
  add(sph(r * 0.2, 12, 8), skin, head, 0, -r * 0.08, r * 0.92).scale.set(0.7, 1.4, 0.9);                         // the nose
  for (const s of [-1, 1]) {
    add(sph(r * 0.28, 12, 8), skin, head, s * r * 0.45, -r * 0.18, r * 0.66).scale.set(1, 0.6, 0.7);                // cheekbones
    add(sph(r * 0.2, 12, 8), glowless('#0d1418'), head, s * r * 0.36, r * 0.12, r * 0.8).scale.set(1.2, 0.85, 0.5); // the socket
    add(sph(r * 0.1, 10, 8), eyes ? glow(eyes, 2.4) : glowless(iris), head, s * r * 0.36, r * 0.12, r * 0.88);       // the eye
    if (tears) add(fitMaster(tube(curve([V(s * r * 0.38, r * 0.02, r * 0.9), V(s * r * 0.42, -r * 0.3, r * 0.86), V(s * r * 0.44, -r * 0.62, r * 0.76)], 6), r * 0.035, { n: 5 }), 'rim'), glow(tears, 1.4), head);
  }
  if (gaunt) for (const s of [-1, 1]) add(sph(r * 0.22, 10, 8), glowless('#202a30'), head, s * r * 0.5, -r * 0.42, r * 0.62).scale.set(0.6, 1.2, 0.3);
  add(sph(r * 0.22, 12, 8), glowless('#120a0c'), head, 0, -r * 0.5, r * 0.82).scale.set(1.1, 0.25 + mouth, 0.45);    // the mouth
}
// a face mask (a plate over the front of the head), with eye holes as dark cups and a mouth
function mask(head, m, { r = 0.12, eyes = '#0a0a0a', mouth = 0, z = 1.02 } = {}) {
  const g = add(fitMaster(lathe([[0, r * 0.95], [r * 0.55, r * 0.85], [r * 0.82, r * 0.35], [r * 0.82, -r * 0.35], [r * 0.6, -r * 0.85], [0, -r * 1.05]], { n: 24, phi0: -1.25, phiLen: 2.5 }), 'forged'), m, head, 0, 0, r * (z - 1) + 0.002);
  for (const s of [-1, 1]) add(sph(r * 0.17, 10, 8), glowless(eyes), head, s * r * 0.34, r * 0.12, r * 0.74).scale.set(1, 1.25, 0.4);
  if (mouth) add(sph(r * 0.2, 10, 8), glowless(eyes), head, 0, -r * 0.42, r * 0.74).scale.set(0.8, mouth, 0.4);
  return g;
}
// weed: flat ribbons rising and waving (the drowned's heads), with small drowned lights in them
function weed(parent, m, { n = 18, len = 0.28, spread = 0.12, seed = 3, lights = null, up = 1, wide = 0.022, lean0 = 0.3 } = {}) {
  const rnd = rngOf(seed), out = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r0 = rnd() * spread * 0.5, L = len * (0.6 + rnd() * 0.6), lean = lean0 + rnd() * 0.6, ph = rnd() * 6, wv = wide > 0.03 ? 0.05 : 0.02;
    const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V(Math.cos(a) * (r0 + t * L * lean) + Math.sin(t * 7 + ph) * wv * t, t * L * up * (1 - t * lean * 0.3), Math.sin(a) * (r0 + t * L * lean) + Math.cos(t * 6 + ph) * wv * t)); }
    out.push(add(fitMaster(tube(curve(pts, 14), t => [0.004, lerp(wide, wide * 0.3, t) * (1 + Math.sin(t * 9 + ph) * 0.25)], { n: 6, twist: rnd() * 3 }), 'strap'), m, parent));
    if (lights && rnd() < 0.6) { const p = pts[3 + Math.floor(rnd() * 4)]; add(sph(0.008, 8, 6), lights, parent, p.x, p.y, p.z); }
  }
  return out;
}
// coral or antler branches (the cantor's and bell-ringer's crowns)
function branches(parent, m, { n = 5, len = 0.32, seed = 5, depth = 3, r = 0.016, spread = 0.9 } = {}) {
  const rnd = rngOf(seed), light = Q.d < 2; if (light) depth = Math.max(1, depth - 1); // (the fight's detail: a level fewer)
  const grow = (p, dir, L, R, d) => {
    const q = p.clone().addScaledVector(dir, L), mid = p.clone().lerp(q, 0.5).add(V((rnd() - 0.5) * L * 0.2, 0, (rnd() - 0.5) * L * 0.2));
    add(fitMaster(tube(curve([p, mid, q], light ? 3 : 6), t => R * (1 - t * 0.45), { n: light ? 5 : 7 }), 'haft'), m, parent);
    if (d <= 0) return;
    const kids = 2 + (rnd() < (light ? 0.15 : 0.4) ? 1 : 0);
    for (let i = 0; i < kids; i++) { const nd = dir.clone().add(V((rnd() - 0.5) * spread, 0.25 + rnd() * 0.3, (rnd() - 0.5) * spread)).normalize(); grow(q, nd, L * (0.55 + rnd() * 0.2), R * 0.62, d - 1); }
  };
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd(); grow(V(Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03), V(Math.cos(a) * 0.45, 1, Math.sin(a) * 0.45).normalize(), len * 0.45, r, depth); }
}
// a bell
function bell(parent, m, { r = 0.05, h = 0.07, clapper = null } = {}) {
  add(fitMaster(lathe([[0, h], [r * 0.35, h * 0.98], [r * 0.6, h * 0.8], [r * 0.7, h * 0.45], [r * 0.85, h * 0.12], [r * 1.0, 0.0], [r * 0.95, -h * 0.03], [r * 0.85, 0.0]], { n: 24 }), 'forged'), m, parent, 0, -h, 0);
  add(tor(r * 0.12, r * 0.04, 6, 12), m, parent, 0, 0.005, 0);
  if (clapper) add(sph(r * 0.2, 10, 8), clapper, parent, 0, -h - r * 0.15, 0);
}
// a lantern: a cap, glass with a light inside, a frame, a ring to hold it by
function lantern(parent, metal, light, { r = 0.06, h = 0.14, style = 'round' } = {}) {
  light = light.clone(); light.userData = { ...light.userData }; // each lantern's light its own (it flares and dims with the moves)
  const g = new THREE.Group(); parent.add(g);
  add(tor(r * 0.35, r * 0.06, 6, 14), metal, g, 0, 0, 0).rotation.x = Math.PI / 2;
  add(fitMaster(lathe([[0, -0.01], [r * 0.4, -0.02], [r * 0.95, -h * 0.22], [r * 1.05, -h * 0.28]], { n: style === 'square' ? 4 : 18, phi0: style === 'square' ? Math.PI / 4 : 0 }), 'forged'), metal, g);
  add(fitMaster(lathe([[r * 0.95, -h * 0.3], [r * 1.0, -h * 0.85], [r * 1.1, -h * 0.9], [r * 0.6, -h * 1.02], [0, -h * 1.05]], { n: style === 'square' ? 4 : 18, phi0: style === 'square' ? Math.PI / 4 : 0 }), 'forged'), metal, g).scale.set(1, 1, 1);
  const core = add(sph(r * 0.62, 14, 10), light, g, 0, -h * 0.58, 0); core.scale.set(1, 1.3, 1);
  const bars = style === 'square' ? 4 : 6;
  for (let i = 0; i < bars; i++) { const a = i / bars * Math.PI * 2 + (style === 'square' ? Math.PI / 4 : 0); add(fitMaster(tube([V(Math.cos(a) * r * 0.98, -h * 0.28, Math.sin(a) * r * 0.98), V(Math.cos(a) * r * 1.02, -h * 0.88, Math.sin(a) * r * 1.02)], r * 0.07, { n: 5 }), 'rim'), metal, g); }
  return { group: g, core };
}
// a staff: a haft, then a head (a crozier's hook, coral, a crystal), held at `grip` along it
function staff(parent, haftM, { len = 1.6, r = 0.016, grip = 0.55, head = null } = {}) {
  const g = new THREE.Group(); parent.add(g); g.position.y = -len * grip;
  add(fitMaster(tube(curve([V(0, 0, 0), V(0.005, len * 0.5, 0), V(0, len, 0)], 10), t => r * (1.05 - t * 0.15), { n: 10 }), 'haft'), haftM, g);
  const top = new THREE.Group(); top.position.y = len; g.add(top);
  if (head) head(top);
  return { group: g, top };
}
// a chain of beads (a belt, a collar, a rosary)
function beads(parent, m, ring, r, every = 1) { for (let i = 0; i < ring.length; i += every) add(sph(r, 10, 8), m, parent, ring[i].x, ring[i].y, ring[i].z); }
const ringAt = (y, rx, rz, n = 32, z0 = 0) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out.push(V(Math.cos(a) * rx, y, Math.sin(a) * rz + z0)); } return out; };
// mist: soft puffs round the hem, rising and fading (updated each frame)
let PUFF = null;
function puffTexture() {
  if (PUFF) return PUFF;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (PUFF = new THREE.CanvasTexture(c));
}
function mist(parent, { color = '#9fd6e6', n = 36, r = 0.32, y = 0.05, rise = 0.35, size = 0.28, opacity = 0.5 } = {}) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seeds = [];
  for (let i = 0; i < n; i++) seeds.push([Math.random() * Math.PI * 2, 0.6 + Math.random() * 0.5, Math.random()]);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: puffTexture(), color: new THREE.Color(color), size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, m); pts.frustumCulled = false; pts.userData.keep = true; parent.add(pts);
  return { pts, update(t) { for (let i = 0; i < n; i++) { const [a, rr, ph] = seeds[i], k = (t * 0.18 + ph) % 1; pos[i * 3] = Math.cos(a + t * 0.2) * r * rr * (1 + k * 0.4); pos[i * 3 + 1] = y + k * rise; pos[i * 3 + 2] = Math.sin(a + t * 0.2) * r * rr * (1 + k * 0.4); } geo.attributes.position.needsUpdate = true; m.opacity = opacity; } };
}

/* ------------------------------------------------------------------ the rig */
// root (where it stands) > body (floats, leans) > chest (shoulders, head) and hem (sways); shoulders > elbows > hands
function rigOf(group, { shY, shX, headY, hover = 0.06, headK = 1 }) {
  const root = new THREE.Group(); group.add(root);
  const body = new THREE.Group(); root.add(body);
  const hem = new THREE.Group(); hem.position.y = shY * 0.62; body.add(hem);
  const chest = new THREE.Group(); chest.position.y = shY * 0.62; body.add(chest);
  const head = new THREE.Group(); head.position.y = headY - shY * 0.62; head.scale.setScalar(headK); chest.add(head);
  const arms = [-1, 1].map(side => {
    const sh = new THREE.Group(); sh.position.set(side * shX, shY - shY * 0.62, 0); chest.add(sh);
    const el = new THREE.Group(); sh.add(el); const hd = new THREE.Group(); el.add(hd);
    return { side, sh, el, hand: hd };
  });
  return { root, body, hem, chest, head, arms, armR: arms[0], armL: arms[1], hover, props: {}, glows: [], mists: [], swing: [], base: {} };
}
// lengths for the arms (set by each wraith), so the elbow and hand sit at the ends of their sleeves
function armLengths(rig, L1, L2) { for (const a of rig.arms) { a.el.position.y = -L1; a.hand.position.y = -L2; } }
// put a piece made in standing coordinates into a moving node (keeps where it is)
const into = (node, o) => { node.updateWorldMatrix(true, false); const inv = node.matrixWorld.clone().invert(); o.applyMatrix4(inv); node.add(o); return o; };

/* ------------------------------------------------------------------ the eleven */
const SKIN = { drowned: '#7d93a0', pale: '#a8c4cc', grey: '#9a9ea4', blue: '#8fb8cc' };
const B = {};

B.drowned = (G, o) => {
  const R = rigOf(G, { shY: 1.36, shX: 0.2, headY: 1.5, hover: 0 }), coat = cloth('#1c1d22'), lin = cloth('#3d2a22'), skin = solid('skin', SKIN.drowned), boot = solid('leather', '#24282a');
  // the legs, trousers and boots (it walks)
  for (const s of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.86, 0); R.body.add(leg); R.base['leg' + s] = leg;
    add(fitMaster(tube(curve([V(0, 0, 0), V(0, -0.35, 0.01), V(0, -0.72, 0)], 10), t => [0.085 - t * 0.02, 0.08 - t * 0.02], { n: 14, capA: false }), 'trousers'), lin, leg);
    add(fitMaster(tube([V(0, -0.6, 0.0), V(0, -0.74, 0), V(0, -0.82, 0.0)], t => [0.065, 0.06], { n: 14, capA: false }), 'boot'), boot, leg);
    add(fitMaster(tube(curve([V(0, -0.83, -0.05), V(0, -0.82, 0.03), V(0, -0.84, 0.12)], 8), t => [0.04 * (1 - t * 0.3), 0.06], { n: 14, up: V(0, 1, 0) }), 'foot'), boot, leg); }
  robe(R.chest, coat, { y0: 1.46 - 0.84, y1: 0.0, w: wsh(0.075, 0.21, 0.27), tatter: 0.14, folds: 0.05, seed: 11 }, 'torso');
  robe(R.hem, coat, { y0: 0.0, y1: 0.6 - 0.84, w: t => lerp(0.27, 0.34, t), tatter: 0.18, folds: 0.07, seed: 12, rags: 2 });
  // the tie with its green diamonds
  add(fitMaster(tube([V(0, 0.52, 0.16), V(0, 0.3, 0.2), V(0, 0.08, 0.21)], t => [0.004, lerp(0.03, 0.045, t)], { n: 8, up: V(0, 0, 1) }), 'tabard'), cloth('#23463e'), R.chest);
  for (let i = 0; i < 3; i++) add(cone(0.016, 0.03, 4), glow('#66c27a', 0.6), R.chest, 0, 0.44 - i * 0.12, 0.215).rotation.x = Math.PI / 2;
  add(fitMaster(tube(ringAt(0.6, 0.085, 0.08, 20), 0.02, { closed: true, n: 8 }), 'braid'), cloth('#20363a'), R.chest);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, coat, { L1: 0.28, L2: 0.27, r: 0.06, flare: 1.5, tatter: 0.5 }); hand(a.hand, a.side, skin, { len: 1.25 }); }
  armLengths(R, 0.28, 0.27);
  weed(R.head, cloth('#3f6a3a', { key: 'wool' }), { n: Q.d > 1 ? 22 : 14, len: 0.42, spread: 0.14, seed: 7, lights: glow('#d8f07a', 2.2), wide: 0.05, lean0: 0.5 });
  add(sph(0.075, 14, 10), cloth('#2c4a30'), R.head, 0, 0.02, 0);
  // the little bell in its right hand
  const bh = new THREE.Group(); bh.position.set(0, -0.12, 0.02); R.armR.hand.add(bh); bell(bh, solid('bronze', '#4c8a6a'), { r: 0.035, h: 0.05, clapper: glow('#a8f0a0', 1.2) }); R.props.bell = bh; R.swing.push(bh);
  R.base.armR = [-0.15, 0.06, -0.25]; R.base.armL = [0.05, 0.05, -0.1];
  R.walker = true; return R;
};

B['bell-ringer'] = (G, o) => {
  const R = rigOf(G, { shY: 1.32, shX: 0.22, headY: 1.42 }), robeM = cloth('#17171f'), weedM = cloth('#2d5a50'), stone = solid('stone', '#77756c');
  robe(R.chest, robeM, { y0: 1.4 - 0.82, y1: 0.0, w: wsh(0.12, 0.25, 0.31), folds: 0.1, k: 5, drape: 0.08, seed: 21 }, 'torso');
  robe(R.hem, robeM, { y0: 0.0, y1: 0.02 - 0.82, w: t => lerp(0.31, 0.46, t), tatter: 0.24, folds: 0.14, k: 5, drape: 0.12, seed: 22, rags: Q.d > 1 ? 2 : 1 });
  // the collar of stones, the weed and little skulls at the hem
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(sph(0.06, 10, 8), stone, R.chest, Math.cos(a) * 0.19, 0.6, Math.sin(a) * 0.16).scale.set(1.3, 0.75, 1.05); }
  weed(R.chest, weedM, { n: Q.d > 1 ? 20 : 12, len: 0.18, spread: 0.36, seed: 23, up: -1 }).forEach(w => w.position.y = 0.6);
  const hemW = new THREE.Group(); hemW.position.y = -0.8; R.hem.add(hemW);
  weed(hemW, weedM, { n: Q.d > 1 ? 30 : 16, len: 0.2, spread: 0.86, seed: 24, wide: 0.05, lean0: 0.6 });
  for (let i = 0; i < 7; i++) { const a = 0.4 + i * 0.8; add(sph(0.032, 10, 8), solid('bone', '#cfc6a8'), hemW, Math.cos(a) * 0.38, 0.03, Math.sin(a) * 0.3); }
  branches(R.head, solid('bone', '#7f9a80'), { n: 5, len: 0.48, seed: 25 });
  add(sph(0.11, 14, 10), glowless('#08090c'), R.head, 0, -0.02, 0).scale.set(1.2, 0.6, 1.1);
  // the iron crook over its right shoulder, and its bell
  const crook = new THREE.Group(); crook.position.set(-0.16, 0.62, -0.02); R.chest.add(crook);
  add(fitMaster(tube(curve([V(0, 0, 0), V(-0.02, 0.18, 0), V(-0.06, 0.3, 0), V(-0.16, 0.34, 0), V(-0.22, 0.28, 0)], 14), 0.014, { n: 8 }), 'rim'), solid('iron', '#2c2a28'), crook);
  const bh = new THREE.Group(); bh.position.set(-0.22, 0.27, 0); crook.add(bh); bell(bh, solid('bronze', '#3e6a5a'), { r: 0.075, h: 0.1, clapper: glow('#a8f07a', 1.6) });
  add(cone(0.012, 0.05, 6), glow('#c8ff6a', 2), bh, 0, -0.12, 0).rotation.x = Math.PI; R.props.bell = bh; R.swing.push(bh);
  for (const a of R.arms) a.sh.visible = false;
  return R;
};

B['drowned-choir'] = (G, o) => {
  const R = rigOf(G, { shY: 1.24, shX: 0.18, headY: 1.38 }), red = cloth('#7c2a22'), lace = cloth('#d8d4d8'), cape = cloth('#5a2420'), skin = solid('skin', SKIN.grey);
  robe(R.chest, lace, { y0: 1.34 - 0.77, y1: 0.0, w: wsh(0.07, 0.19, 0.25), folds: 0.04, seed: 31 }, 'torso');
  robe(R.hem, red, { y0: 0.0, y1: 0.02 - 0.77, w: t => lerp(0.24, 0.34, t), tatter: 0.12, folds: 0.07, seed: 32, rags: 1 });
  robe(R.hem, lace, { y0: 0.02, y1: -0.36, w: t => lerp(0.26, 0.38, t), scallop: 0.035, folds: 0.05, seed: 33, steps: 8 }, 'lace');
  add(fitMaster(loft(robeRings({ y0: 0.56, y1: 0.43, w: t => lerp(0.13, 0.24, t), steps: 5, folds: 0.03, seed: 34 })), 'mantle'), cape, R.chest);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, lace, { L1: 0.25, L2: 0.25, r: 0.055, flare: 1.7, tatter: 0.3 }); hand(a.hand, a.side, skin, { closed: true, len: 1.1 }); }
  armLengths(R, 0.25, 0.25);
  // the head: a dark mound grown with weed and a cluster of little skulls
  add(fitMaster(lathe([[0, 0.2], [0.07, 0.17], [0.11, 0.08], [0.1, -0.04], [0.06, -0.08]], { n: 18 }), 'haft'), solid('wood', '#3a2a22'), R.head);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, y = 0.03 + (i % 3) * 0.045; add(sph(0.026, 10, 8), solid('bone', '#d6ccb0'), R.head, Math.cos(a) * 0.1, y, Math.sin(a) * 0.09 + 0.01); add(sph(0.008, 6, 4), glowless('#120c08'), R.head, Math.cos(a) * 0.12, y, Math.sin(a) * 0.11 + 0.012); }
  weed(R.head, cloth('#7a8a3a'), { n: Q.d > 1 ? 18 : 12, len: 0.34, spread: 0.12, seed: 35, wide: 0.045, lean0: 0.45 }).forEach(w => w.position.y = 0.16);
  // the brass bell held at the breast, with its tassel
  const bh = new THREE.Group(); bh.position.set(0.05, -0.09, 0.02); R.armR.hand.add(bh); bell(bh, solid('gold', '#a07a3a'), { r: 0.06, h: 0.08 }); R.swing.push(bh);
  add(fitMaster(tube([V(0, -0.09, 0), V(0, -0.2, 0.01)], t => 0.008 + t * 0.012, { n: 8 }), 'braid'), cloth('#3a6a60'), bh); R.props.bell = bh;
  R.base.armR = [-0.3, -0.28, -1.6]; R.base.armL = [-0.3, -0.28, -1.6];
  return R;
};

B['drowned-cantor'] = (G, o) => {
  const R = rigOf(G, { shY: 1.36, shX: 0.2, headY: 1.5 , headK: 1.45 }), black = cloth('#141419'), green = cloth('#1f5a4c'), gold = cloth('#c89a2a', { key: 'wool' }), skin = solid('skin', SKIN.grey);
  robe(R.chest, black, { y0: 1.46 - 0.84, y1: 0.0, w: wsh(0.07, 0.2, 0.25), seed: 41 }, 'torso');
  robe(R.hem, black, { y0: 0.0, y1: 0.02 - 0.84, w: t => lerp(0.25, 0.33, t), tatter: 0.1, folds: 0.06, seed: 42, rags: 1 });
  // the green cope, open at the front, two gold bands down it
  add(fitMaster(loft(robeRings({ y0: 0.6, y1: -0.74, w: wsh(0.1, 0.25, 0.4, 0.12), open: 6, folds: 0.07, seed: 43, steps: 16, tatter: 0.04 })), 'embroid'), green, R.chest);
  for (const s of [-1, 1]) add(fitMaster(tube(curve([V(s * 0.08, 0.55, 0.17), V(s * 0.12, 0.0, 0.25), V(s * 0.16, -0.7, 0.33)], 12), [0.004, 0.022], { n: 6, up: V(0, 0, 1) }), 'braid'), gold, R.chest);
  beads(R.chest, solid('bone', '#e8e4dc'), ringAt(0.58, 0.19, 0.16, 26), 0.022);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, black, { L1: 0.27, L2: 0.26, r: 0.06, flare: 1.7, tatter: 0.4 }); hand(a.hand, a.side, skin, { closed: a.side === -1, len: 1.15 }); }
  armLengths(R, 0.27, 0.26);
  hood(R.head, black, { r: 0.12, k: 1.32, open: 0.8 });
  mask(R.head, solid('bone', '#e6dccb'), { r: 0.115, z: 1.15 });
  add(sph(0.018, 10, 8), glow('#ffb42a', 1.8), R.head, -0.034, 0.012, 0.115);
  branches(R.head, solid('bone', '#8aa486'), { n: 5, len: 0.62, seed: 44, r: 0.018 });
  // the coral staff with a green orb and pearls
  const S = staff(R.armR.hand, solid('wood', '#2a2420'), { len: 1.2, r: 0.017, grip: 0.5, head: top => { branches(top, solid('bone', '#b8c8a0'), { n: 3, len: 0.18, seed: 45, depth: 2, r: 0.01 }); add(sph(0.035, 14, 10), glow('#3aa88a', 1.4), top, 0, 0.07, 0); for (let i = 0; i < 3; i++) add(sph(0.012, 8, 6), solid('bone', '#f0ece4'), top, Math.cos(i * 2.1) * 0.05, -0.04, Math.sin(i * 2.1) * 0.05); } });
  S.group.position.set(0.02, -0.05, 0.02); R.props.staff = S;
  R.base.armR = [-0.35, -0.05, -0.75]; R.base.armL = [0.05, 0.05, -0.1]; R.base.staffX = 1.1;
  return R;
};

B['drowned-abbess'] = (G, o) => {
  const R = rigOf(G, { shY: 1.36, shX: 0.19, headY: 1.52 , headK: 1.45 }), teal = cloth('#2f5a62'), teal2 = cloth('#3c6c72'), veil = cloth('#1e2230'), skin = solid('skin', SKIN.blue);
  robe(R.chest, teal, { y0: 1.46 - 0.84, y1: 0.0, w: wsh(0.07, 0.2, 0.26), seed: 51 }, 'torso');
  // three tiers, each with a wavy, scalloped hem
  const foam = cloth('#8fb8bc');
  [[0.0, -0.36, 0.27, 0.36], [-0.3, -0.6, 0.33, 0.42], [-0.54, -0.82, 0.39, 0.48]].forEach(([a, b, w0, w1], i) => { const t = robe(R.hem, i % 2 ? teal2 : teal, { y0: a, y1: b, w: t => lerp(w0, w1, t), scallop: 0.06, scallopN: 11, folds: 0.07, k: 8, seed: 52 + i, steps: 10 }); hemTrim(R.hem, t, foam, 0.009); });
  beads(R.hem, solid('bone', '#d8d0b8'), ringAt(0.02, 0.27, 0.23, 28), 0.017);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, teal, { L1: 0.27, L2: 0.26, r: 0.058, flare: 1.6 }); hand(a.hand, a.side, skin, { closed: a.side === -1, len: 1.1 }); }
  armLengths(R, 0.27, 0.26);
  // the face, the veil over it and down the back
  face(R.head, skin, { r: 0.1, eyes: '#a8e8ff', tears: '#5ac8ff', gaunt: 0.4 });
  for (const s of [-1, 1]) add(tor(0.02, 0.006, 6, 16), solid('silver', '#c8ccd0'), R.head, s * 0.1, -0.03, 0.0).rotation.y = Math.PI / 2;
  add(fitMaster(lathe([[0, 0.145], [0.06, 0.142], [0.11, 0.115], [0.14, 0.05], [0.15, -0.05], [0.18, -0.14], [0.22, -0.24], [0.24, -0.36], [0.25, -0.45]], { n: 40, phi0: 0.85, phiLen: Math.PI * 2 - 1.7 }), 'hood'), veil, R.head);
  add(fitMaster(lathe([[0.0, 0.125], [0.09, 0.115], [0.115, 0.05], [0.12, -0.06], [0.14, -0.2]], { n: 30, phi0: 0.7, phiLen: Math.PI * 2 - 1.4 }), 'hood'), cloth('#a8c8cc'), R.head);
  // the lantern in her right hand, burning blue
  const L = lantern(R.armR.hand, solid('silver', '#b8bcc0'), glow('#6ad8ff', 2.6), { r: 0.055, h: 0.16 }); L.group.position.set(0, -0.08, 0.02); R.props.lantern = L; R.swing.push(L.group); R.glows.push(L.core.material);
  R.base.armR = [-0.25, 0.1, -0.2];
  return R;
};

B['choir-wraith'] = (G, o) => {
  const R = rigOf(G, { shY: 1.32, shX: 0.19, headY: 1.48 , headK: 1.45 }), teal = cloth('#2c4a4a'), dark = cloth('#1c2c2e'), skin = solid('skin', SKIN.blue);
  robe(R.chest, teal, { y0: 1.42 - 0.82, y1: 0.0, w: wsh(0.07, 0.2, 0.27), tatter: 0.04, seed: 61 }, 'torso');
  const tiers = [[0.0, -0.42, 0.27, 0.38], [-0.36, -0.8, 0.34, 0.46]].map(([a, b, w0, w1], i) => robe(R.hem, i ? dark : teal, { y0: a, y1: b, w: t => lerp(w0, w1, t), arch: 0.09, scallopN: 12, tatter: i ? 0.12 : 0.05, folds: 0.05, k: 12, seed: 62 + i, steps: 10, rags: i }));
  // the seams between the panels, running down to where two arches meet
  tiers.forEach((t, ti) => { const rs = t.userData.rings, N = rs[0].length; for (let k = 0; k < 12; k++) { const j = Math.round(k / 12 * N) % N, pts = rs.filter((_, i) => i % 2 === 0).map(r => r[j].clone().multiplyScalar(1.015)); add(fitMaster(tube(pts, 0.006, { n: 5 }), 'braid'), dark, R.hem); } });
  // studs round the tiers, and tags at the sides
  for (const y of [-0.3, -0.66]) beads(R.hem, solid('bronze', '#8a6a3a'), ringAt(y, y < -0.5 ? 0.43 : 0.36, y < -0.5 ? 0.36 : 0.3, 24), 0.012);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.09, 0.06), solid('bronze', '#9a7a3a'), R.hem, s * 0.3, -0.14, 0);
  add(fitMaster(loft(robeRings({ y0: 0.6, y1: 0.36, w: t => lerp(0.14, 0.3, t), steps: 6, tatter: 0.06, seed: 64 })), 'mantle'), teal, R.chest);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, teal, { L1: 0.26, L2: 0.25, r: 0.058, flare: 1.4, tatter: 0.4 }); hand(a.hand, a.side, skin, { closed: true, len: 1.1 }); }
  armLengths(R, 0.26, 0.25);
  hood(R.head, teal, { r: 0.12, k: 1.25, point: 0.35, open: 0.8 });
  mask(R.head, solid('bone', '#dcd8cc'), { r: 0.1, z: 1.1, mouth: 1.6 });
  // the song leaving as blue mist
  const song = add(tube(curve([V(0.0, -0.04, 0.13), V(0.08, -0.02, 0.2), V(0.16, 0.03, 0.18), V(0.24, 0.05, 0.24), V(0.3, 0.1, 0.2)], 16), t => [0.012 + t * 0.02, 0.006 + t * 0.01], { n: 8 }), ghost('#4aa8ff', { glow: '#6ac0ff', k: 1.4, opacity: 0.6, depthWrite: false }), R.head); R.props.song = song;
  // the hymn book in both hands
  const bk = new THREE.Group(); bk.position.set(0.1, -0.08, 0.04); R.armR.hand.add(bk); bk.rotation.set(1.2, -0.3, 0);
  add(fitMaster(plate([[-0.07, -0.09], [0.07, -0.09], [0.07, 0.09], [-0.07, 0.09]], () => 0.022), 'forged', { planar: true }), solid('leather', '#4a3a2a'), bk);
  add(new THREE.BoxGeometry(0.13, 0.17, 0.02), solid('wool', '#d8ccb0'), bk, 0, 0, 0.0);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.022, 0.05, 0.004), solid('silver', '#c8c4b8'), bk, (i - 1) * 0.035, 0.0, 0.024);
  R.props.book = bk;
  R.base.armR = [-0.35, -0.3, -1.55]; R.base.armL = [-0.35, -0.3, -1.55];
  return R;
};

B['rime-wraith'] = (G, o) => {
  const R = rigOf(G, { shY: 1.32, shX: 0.19, headY: 1.48 , headK: 1.45 }), frost = cloth('#4a6a6e'), dark = cloth('#2a3e44'), skin = solid('skin', SKIN.blue), ice = ghost('#cfefff', { glow: '#9adfff', k: 0.5, opacity: 0.85 });
  robe(R.chest, frost, { y0: 1.42 - 0.82, y1: 0.0, w: wsh(0.07, 0.2, 0.26), tatter: 0.04, seed: 71 }, 'torso');
  robe(R.hem, dark, { y0: 0.0, y1: 0.04 - 0.82, w: t => lerp(0.26, 0.36, t), tatter: 0.2, folds: 0.07, seed: 72, rags: 2 });
  robe(R.chest, frost, { y0: 0.62, y1: 0.18, w: t => lerp(0.15, 0.36, t), steps: 8, tatter: 0.16, folds: 0.06, seed: 73, rags: 1 }, 'mantle');
  add(fitMaster(tube(ringAt(0.0, 0.2, 0.17, 24), 0.018, { closed: true, n: 8 }), 'braid'), cloth('#bfae84'), R.chest);
  add(fitMaster(tube(curve([V(0.05, 0.0, 0.17), V(0.07, -0.15, 0.2), V(0.06, -0.32, 0.22)], 8), 0.012, { n: 6 }), 'braid'), cloth('#bfae84'), R.chest);
  add(fitMaster(tube([V(0, 0.3, 0.19), V(0, -0.1, 0.24), V(0, -0.6, 0.3)], t => [0.004, 0.05], { n: 8, up: V(0, 0, 1) }), 'tabard'), cloth('#5a7a7c'), R.chest);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, frost, { L1: 0.27, L2: 0.26, r: 0.06, flare: 1.7, tatter: 0.5 }); hand(a.hand, a.side, skin, { len: 1.2 }); }
  armLengths(R, 0.27, 0.26);
  face(R.head, skin, { r: 0.1, iris: '#203038', mouth: 0.7, tears: '#8adcff', gaunt: 0.5 });
  hood(R.head, frost, { r: 0.12, k: 1.25, point: 0.2, open: 0.9, inner: '#0c1418' });
  // icicles from the hood's edge and the sleeves, blue water at the hem
  const rnd = rngOf(74);
  for (let i = 0; i < 9; i++) { const a = 0.9 + i / 8 * (Math.PI * 2 - 1.8); add(cone(0.007, 0.04 + rnd() * 0.05, 5), ice, R.head, Math.sin(a) * 0.15, -0.13, Math.cos(a) * 0.15).rotation.x = Math.PI; }
  for (const a of R.arms) for (let i = 0; i < 4; i++) add(cone(0.006, 0.05, 5), ice, a.el, (i - 1.5) * 0.03, -0.29, 0.03).rotation.x = Math.PI;
  const wr = ringAt(-0.8, 0.36, 0.31, 48).map((p, i) => p.add(V(0, Math.sin(i * 0.9) * 0.025 + Math.sin(i * 2.3) * 0.012, 0)));
  const water = add(fitMaster(tube(wr, t => 0.03, { closed: true, n: 8 }), 'rim'), ghost('#3a9ad8', { glow: '#3ab8f0', k: 0.8, opacity: 0.65 }), R.hem);
  R.glows.push(water.material);
  R.base.armR = [-0.5, 0.15, -0.35]; R.base.armL = [-0.15, -0.05, -0.2];
  return R;
};

B['rime-abbot'] = (G, o) => {
  const R = rigOf(G, { shY: 1.64, shX: 0.23, headY: 1.82 , headK: 1.45 }), navy = cloth('#1e2640'), teal = cloth('#3c5a64'), cowl = cloth('#4a4466'), frost = cloth('#c8e0ec'), skin = solid('skin', SKIN.blue), iceM = ghost('#bfe0f0', { glow: '#7fc0e0', k: 0.22, opacity: 0.95 });
  robe(R.chest, teal, { y0: 1.76 - 1.02, y1: 0.0, w: wsh(0.08, 0.24, 0.3), seed: 81 }, 'torso');
  robe(R.hem, teal, { y0: 0.0, y1: 0.03 - 1.02, w: t => lerp(0.3, 0.42, t), folds: 0.05, k: 18, seed: 82 });
  // the cope over the shoulders to near the ground, edged with frost, tasselled
  add(fitMaster(loft(robeRings({ y0: 0.76, y1: -0.85, w: wsh(0.11, 0.3, 0.5, 0.12), open: 4, folds: 0.08, seed: 83, steps: 16 })), 'embroid'), navy, R.chest);
  add(fitMaster(tube(ringAt(-0.85, 0.5, 0.41, 40), 0.016, { closed: true, n: 6 }), 'braid'), frost, R.chest);
  // the frosty capelet over it, to the elbows, edged in rime and hung with tassels
  const cap = robe(R.chest, navy, { y0: 0.78, y1: 0.18, w: wsh(0.12, 0.31, 0.44, 0.2), folds: 0.06, k: 7, drape: 0.05, scallop: 0.03, scallopN: 9, seed: 84, steps: 9 }, 'embroid');
  hemTrim(R.chest, cap, frost, 0.014);
  { const ring = cap.userData.rings.at(-1); for (let i = 0; i < ring.length; i += 4) { const p = ring[i].clone().multiplyScalar(1.02); add(fitMaster(tube([p, p.clone().add(V(0, -0.09, 0))], t => 0.005 + t * 0.011, { n: 6 }), 'braid'), frost, R.chest); } }
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(cone(0.012, 0.05, 5), iceM, R.chest, Math.cos(a) * 0.5, -0.85, Math.sin(a) * 0.41).rotation.x = Math.PI; }
  for (let i = 0; i < 7; i++) { const a = Math.PI * 0.62 + i / 6 * Math.PI * 0.76; const p = V(Math.cos(a) * 0.36, 0.25, Math.sin(a) * 0.3); add(fitMaster(tube([p, p.clone().add(V(0, -0.12, 0))], t => 0.006 + t * 0.012, { n: 6 }), 'braid'), frost, R.chest); }
  for (const s of [-1, 1]) add(fitMaster(tube(curve([V(s * 0.05, 0.62, 0.21), V(s * 0.06, 0.4, 0.25), V(s * 0.05, 0.2, 0.27)], 8), 0.01, { n: 6 }), 'braid'), frost, R.chest);
  add(ico(0.03, 1), glow('#7fd8ff', 1.6), R.chest, 0, 0.6, 0.23);
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, navy, { L1: 0.32, L2: 0.31, r: 0.07, flare: 1.6 }); hand(a.hand, a.side, skin, { closed: a.side === -1, len: 1.35 }); }
  armLengths(R, 0.32, 0.31);
  // the braided cowl, and the grille of ice where a face should be
  hood(R.head, cowl, { r: 0.14, k: 1.3, open: 0.8, inner: '#04080e' });
  // the cowl's braids: thick plaits round the face and back over the crown (two strands twisted round each other)
  const plait = (pts, rr) => { const c = new THREE.CatmullRomCurve3(pts), L = 60; for (const ph of [0, Math.PI]) { const q = []; for (let i = 0; i <= L; i++) { const t = i / L, p = c.getPoint(t), tg = c.getTangent(t), side = new THREE.Vector3(0, 1, 0).cross(tg).normalize(), up = tg.clone().cross(side).normalize(), a = t * 22 + ph; q.push(p.clone().addScaledVector(side, Math.cos(a) * rr * 0.6).addScaledVector(up, Math.sin(a) * rr * 0.6)); } add(fitMaster(tube(q, rr * 0.75, { n: 6 }), 'braid'), cowl, R.head); } };
  const hr = 0.14 * 1.3;
  for (const k of [0.98, 1.05]) plait([0.95, 0.6, 0.25, 0, -0.25, -0.6, -0.95].map(t => V(Math.sin(t * 1.2) * hr * k * 0.95, hr * (0.35 + Math.cos(t * 1.4) * 0.45), Math.cos(t * 1.2) * hr * k)), 0.022);
  for (const x of [-0.5, 0, 0.5]) plait([V(x * hr * 0.5, hr * 1.05, hr * 0.55), V(x * hr * 0.55, hr * 1.12, 0), V(x * hr * 0.6, hr * 0.9, -hr * 0.65), V(x * hr * 0.6, hr * 0.4, -hr * 0.95)], 0.02);
  const grille = solid('silver', '#b8d4e4');
  for (let i = 0; i < 5; i++) add(fitMaster(tube([V((i - 2) * 0.03, 0.07, 0.16), V((i - 2) * 0.028, -0.09, 0.15)], 0.007, { n: 6 }), 'rim'), grille, R.head);
  add(fitMaster(tube(curve([V(-0.08, 0.08, 0.14), V(0, 0.11, 0.17), V(0.08, 0.08, 0.14)], 10), 0.008, { n: 6 }), 'rim'), grille, R.head);
  add(sph(0.05, 12, 8), glow('#4ab0ff', 0.7), R.head, 0, 0, 0.08).scale.set(1.4, 1.2, 0.4);
  // the Rime Crozier, lit blue
  const iceMetal = solid('silver', '#9cc0d8');
  const S = staff(R.armR.hand, iceMetal, { len: 1.85, r: 0.022, grip: 0.45, head: top => {
    add(fitMaster(tube(curve([V(0, 0, 0), V(0, 0.12, 0), V(0.06, 0.22, 0), V(0.16, 0.22, 0), V(0.18, 0.12, 0)], 14), 0.016, { n: 8 }), 'rim'), iceMetal, top);
    const L = lantern(top, solid('silver', '#b8c8d8'), glow('#6ad0ff', 2.8), { r: 0.04, h: 0.1 }); L.group.position.set(0.18, 0.11, 0); R.glows.push(L.core.material);
    for (let i = 0; i < 6; i++) add(cone(0.012, 0.05, 5), iceM, top, Math.cos(i) * 0.05, 0.25, Math.sin(i) * 0.05).rotation.z = (i - 2.5) * 0.3; } });
  for (let i = 0; i < 4; i++) add(fitMaster(tube(ringAt(0.25 + i * 0.4, 0.026, 0.026, 12), 0.008, { closed: true, n: 5 }), 'rim'), solid('silver', '#c8d4e0'), S.group);
  S.group.position.set(0.02, -0.06, 0.02); R.props.staff = S;
  R.base.armR = [-0.3, -0.05, -0.8]; R.base.armL = [0.05, 0.05, -0.1];
  return R;
};

B['lantern-mother'] = (G, o) => {
  const R = rigOf(G, { shY: 1.62, shX: 0.2, headY: 1.8 , headK: 1.45 }), black = cloth('#1e1a1c'), coat = cloth('#262024'), shawl = cloth('#3a3236'), apron = cloth('#5a5650'), brass = solid('bronze', '#b08a3a'), skin = solid('skin', '#9ea2a6');
  robe(R.chest, coat, { y0: 1.74 - 1.0, y1: 0.0, w: wsh(0.065, 0.19, 0.19), d: 0.8, seed: 91 }, 'torso');
  robe(R.hem, black, { y0: 0.0, y1: 0.0 - 1.0, w: t => lerp(0.2, 0.5, smooth(t)), folds: 0.08, k: 11, seed: 92 });
  // the coat's buttons, the belt and pouch, the apron
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(sph(0.012, 8, 6), brass, R.chest, s * 0.05, 0.42 - i * 0.1, 0.165 + i * 0.002);
  add(fitMaster(loft([ringAt(0.04, 0.205, 0.17, 32), ringAt(-0.01, 0.21, 0.175, 32)]), 'belt'), solid('leather', '#5a3e28'), R.chest);
  add(new THREE.BoxGeometry(0.04, 0.032, 0.012), brass, R.chest, 0, 0.015, 0.18);
  add(fitMaster(tube([V(0.15, 0.0, 0.1), V(0.16, -0.08, 0.12)], [0.035, 0.03], { n: 10 }), 'strap'), solid('leather', '#5a3e28'), R.chest);
  add(fitMaster(tube([V(0, -0.02, 0.19), V(0, -0.35, 0.26), V(0, -0.62, 0.36)], t => [0.004, lerp(0.09, 0.13, t)], { n: 8, up: V(0, 0, 1) }), 'tabard'), apron, R.hem);
  // the fringed shawl
  add(fitMaster(loft(robeRings({ y0: 0.72, y1: 0.38, w: t => lerp(0.15, 0.3, t), steps: 6, folds: 0.04, seed: 93 })), 'mantle'), shawl, R.chest);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const p = V(Math.cos(a) * 0.3, 0.37, Math.sin(a) * 0.26); add(fitMaster(tube([p, p.clone().add(V(0, -0.06, 0))], t => 0.005 + t * 0.008, { n: 5 }), 'braid'), shawl, R.chest); }
  for (const a of R.arms) { sleeve(a.sh, a.el, a.side, coat, { L1: 0.3, L2: 0.29, r: 0.052, flare: 1.25 }); hand(a.hand, a.side, skin, { closed: true, len: 1.2 }); }
  armLengths(R, 0.3, 0.29);
  // her face, white hair, hood and crown of flowers
  face(R.head, skin, { r: 0.095, eyes: '#ffb03a', gaunt: 0.25 });
  for (const s of [-1, 1]) add(fitMaster(tube(curve([V(s * 0.07, 0.05, 0.04), V(s * 0.09, -0.06, 0.05), V(s * 0.08, -0.16, 0.06)], 8), t => [0.012, 0.02], { n: 8 }), 'lock'), solid('wool', '#d8d8dc'), R.head);
  hood(R.head, black, { r: 0.12, k: 1.18, open: 1.0, inner: '#0a0808' });
  for (let i = 0; i < 9; i++) { const a = -1.3 + i / 8 * 2.6; add(sph(0.016, 8, 6), solid('bone', '#efe8d6'), R.head, Math.sin(a) * 0.14, 0.11 + Math.cos(a) * 0.01, Math.cos(a) * 0.12); add(sph(0.006, 6, 4), glow('#f0c860', 0.8), R.head, Math.sin(a) * 0.15, 0.115, Math.cos(a) * 0.13); }
  // the lantern in her left hand, the hooked lamp-pole with its bell in her right
  const L = lantern(R.armL.hand, brass, glow('#ffb43a', 2.8), { r: 0.085, h: 0.24, style: 'square' }); L.group.position.set(0, -0.06, 0.02); R.props.lantern = L; R.swing.push(L.group); R.glows.push(L.core.material);
  const S = staff(R.armR.hand, brass, { len: 2.1, r: 0.014, grip: 0.55, head: top => {
    add(fitMaster(tube(curve([V(0, 0, 0), V(0, 0.08, 0), V(0.03, 0.16, 0), V(0.1, 0.17, 0), V(0.13, 0.1, 0)], 14), 0.013, { n: 8 }), 'rim'), brass, top);
    const bh = new THREE.Group(); bh.position.set(0.13, 0.09, 0); top.add(bh); bell(bh, brass, { r: 0.03, h: 0.045 }); R.props.bell = bh; R.swing.push(bh); } });
  S.group.position.set(0.02, -0.06, 0.02); R.props.staff = S;
  R.base.armL = [-0.75, -0.2, -0.9]; R.base.armR = [-0.3, -0.05, -0.75];
  return R;
};

B['mirage-wisp'] = (G, o) => {
  const R = rigOf(G, { shY: 0.8, shX: 0.17, headY: 0.98, hover: 0.08 }), water = ghost('#4ad0d8', { glow: '#3ab8c8', k: 0.4, opacity: 0.78 });
  // a body of living water (chest at 0.5): a soft, swirling lathe from the neck to the hips, two stubby legs
  add(fitMaster(lathe([[0.0, 0.42], [0.1, 0.4], [0.17, 0.3], [0.2, 0.12], [0.19, -0.1], [0.15, -0.3], [0.08, -0.4], [0, -0.42]], { n: 30 }), 'lock'), water, R.chest).scale.set(1, 1, 0.82);
  for (const s of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(s * 0.08, -0.36, 0); R.chest.add(leg); add(fitMaster(tube(curve([V(0, 0.04, 0), V(0, -0.06, 0.01), V(0, -0.13, 0)], 8), t => 0.065 * (1 - t * 0.15), { n: 12 }), 'lock'), water, leg); R.base['leg' + s] = leg; }
  for (const a of R.arms) add(fitMaster(tube(curve([V(-a.side * 0.03, 0.02, 0), V(0, -0.1, 0.01), V(a.side * 0.04, -0.22, 0.02), V(a.side * 0.06, -0.28, 0.0)], 10), t => 0.055 * (1 - t * 0.55), { n: 12 }), 'lock'), water, a.sh);
  armLengths(R, 0.14, 0.12);
  // the head: a drop drawn up into a flame, a pale face, hollow eyes, a crystal heart
  add(fitMaster(lathe([[0, -0.1], [0.12, -0.07], [0.16, 0.04], [0.13, 0.14], [0.08, 0.24], [0.04, 0.33], [0.012, 0.4], [0, 0.42]], { n: 30 }), 'lock'), water, R.head).scale.set(1, 1, 0.72);
  add(sph(0.11, 18, 14), ghost('#e6faff', { glow: '#cff4ff', k: 0.5, opacity: 0.92 }), R.head, 0, 0.0, 0.07).scale.set(0.95, 0.8, 0.55);
  for (const s of [-1, 1]) add(sph(0.026, 10, 8), glowless('#0c2a34'), R.head, s * 0.045, 0.01, 0.115).scale.set(1, 1.35, 0.5);
  add(sph(0.012, 8, 6), glowless('#0c2a34'), R.head, 0, -0.045, 0.118).scale.set(1.4, 0.5, 0.5);
  add(ico(0.045, 0), glow('#6ab8ff', 1.6), R.chest, 0, 0.18, 0.16).scale.set(0.8, 1.2, 0.5);
  R.base.armR = [0.0, 0.3, 0]; R.base.armL = [0.0, 0.3, 0];
  return R;
};

B['wisp-queen'] = (G, o) => {
  const R = rigOf(G, { shY: 1.36, shX: 0.2, headY: 1.55, hover: 0.12 }), fire = ghost('#7ae8d8', { glow: '#4ac8b8', k: 0.32, opacity: 0.82 }), silver = solid('silver', '#d0d8dc');
  // tongues of pale fire, hanging and curling from the shoulders to below where feet would be
  const rnd = rngOf(101), tongues = new THREE.Group(); R.hem.add(tongues);
  // in rows, shoulders to below the hem, each a broad flat lock that swells and curls out at its tip (like the sheet)
  const rows = Q.d > 1 ? 5 : 4, per = Q.d > 1 ? 11 : 8;
  for (let rI = 0; rI < rows; rI++) for (let i = 0; i < per; i++) {
    const a = (i + rnd() * 0.6) / per * Math.PI * 2, y0 = 0.42 - rI * 0.24, L = 0.42 + rnd() * 0.3, r0 = 0.15 + rI * 0.035, ph = rnd() * 6, curl = (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd());
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; const rr = r0 + t * (0.1 + rI * 0.02) + Math.sin(t * Math.PI) * 0.04; const ca = a + Math.sin(t * 3 + ph) * 0.15 + (t > 0.7 ? (t - 0.7) * curl : 0); pts.push(V(Math.cos(ca) * rr, y0 - t * L + (t > 0.75 ? (t - 0.75) * 0.25 : 0), Math.sin(ca) * rr * 0.85)); }
    add(fitMaster(tube(curve(pts, 16), t => [0.014 * (1 - t * 0.6), (0.045 + Math.sin(t * Math.PI) * 0.05) * (1 - t * 0.5)], { n: 6, twist: rnd() * 1.5 }), 'lock'), fire, tongues);
  }
  add(fitMaster(lathe([[0, 0.66], [0.15, 0.6], [0.2, 0.35], [0.19, 0.0], [0.12, -0.3], [0, -0.42]], { n: 28 }), 'cape'), fire, R.chest).scale.set(1, 1, 0.8);
  // her arms: bunches of flame locks
  for (const a of R.arms) for (let i = 0; i < (Q.d > 1 ? 5 : 3); i++) { const ph = i * 1.3; add(fitMaster(tube(curve([V(0, 0.02, 0), V(a.side * 0.02, -0.18, 0.02 + i * 0.01), V(a.side * (0.08 + i * 0.015), -0.38, 0.03), V(a.side * (0.16 + Math.sin(ph) * 0.04), -0.5 - i * 0.03, 0.0)], 12), t => [0.012, (0.04 + Math.sin(t * Math.PI) * 0.03) * (1 - t * 0.5)], { n: 6, twist: ph }), 'lock'), fire, a.sh); }
  armLengths(R, 0.28, 0.27);
  // the mask, the crown, the flame above it, the jewel at her heart
  add(sph(0.11, 18, 14), fire, R.head, 0, 0, -0.01).scale.set(0.95, 1.1, 0.9);
  mask(R.head, solid('bone', '#f2f4f4'), { r: 0.1, z: 1.05, eyes: '#0a2a34' });
  for (const s of [-1, 1]) add(sph(0.01, 8, 6), glow('#8af0ff', 2), R.head, s * 0.034, 0.012, 0.11);
  add(fitMaster(lathe([[0.1, 0.0], [0.105, 0.0], [0.108, 0.035], [0.102, 0.035], [0.1, 0.0]], { n: 32 }), 'rim'), silver, R.head, 0, 0.09, 0);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; add(cone(0.016, 0.06 + (i === 0 ? 0.05 : 0), 5), silver, R.head, Math.sin(a) * 0.104, 0.15 + (i === 0 ? 0.025 : 0), Math.cos(a) * 0.104); }
  add(ico(0.02, 0), glow('#8ad8ff', 1.6), R.head, 0, 0.18, 0.11);
  for (let i = 0; i < 6; i++) { const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(V(Math.sin(t * 5 + i) * 0.03, 0.14 + t * 0.3, -0.02 + Math.cos(t * 4 + i) * 0.03)); } add(fitMaster(tube(curve(pts, 10), t => [0.02 * (1 - t), 0.03 * (1 - t)], { n: 6 }), 'lock'), fire, R.head); }
  add(fitMaster(lathe([[0, 0.02], [0.05, 0.015], [0.058, 0], [0.05, -0.015], [0, -0.02]], { n: 20, sz: 0.5 }), 'rim'), silver, R.chest, 0, 0.44, 0.15).rotation.x = Math.PI / 2;
  add(ico(0.042, 1), glow('#7ac8ff', 2), R.chest, 0, 0.44, 0.17).scale.set(0.8, 1.1, 0.5);
  R.base.armR = [0.0, 0.3, 0]; R.base.armL = [0.0, 0.3, 0];
  return R;
};

/* ------------------------------------------------------------------ moves */
// the kit's common set, and the two Champions' own moves (named for M7's: game/src/data/foes.js)
const COMMON = { idle: 2.4, walk: 1.2, bite: 1.1, strike: 1.2, swipe: 1.1, cast: 1.4, roar: 1.6, hurt: 0.6, ko: 1.6 };
const OWN = {
  'rime-abbot': { 'crozier-strike': 1.2, toll: 1.4, 'rime-ward': 1.5, drown: 1.6, 'call-the-choir': 1.6, hushing: 1.4, heartbeat: 1.4, 'rime-nova': 1.6 },
  'lantern-mother': { 'lamp-pole': 1.2, lure: 1.4, 'lantern-flare': 1.3, 'hush-now': 1.4, 'lead-them-down': 1.6, moths: 1.4, mourning: 1.5, snuff: 1.4, 'lantern-nova': 1.5, 'drown-the-light': 1.5 },
};
// a move's shape over u (0..1): { lean, lift, turn, armR: [x, z, elbow], armL, head: [x, y], glow, mist, spin }
const env = u => Math.sin(Math.PI * clamp01(u));
const rise = (u, a = 0.35) => (u < a ? smooth(u / a) : 1 - smooth((u - a) / (1 - a)));
const SHAPES = {
  bite: u => ({ lean: 0.35 * rise(u), lift: 0.04 * env(u), forward: 0.3 * rise(u, 0.45), armR: [-1.3 * rise(u), 0.1, -0.2], armL: [-1.3 * rise(u), 0.1, -0.2] }),
  strike: u => { const w = u < 0.4 ? smooth(u / 0.4) : 1, d = u < 0.4 ? 0 : smooth((u - 0.4) / 0.25) * (1 - smooth((u - 0.7) / 0.3)); return { lean: -0.12 * w * (1 - d) + 0.3 * d, armR: [-2.6 * w * (1 - d) - 0.5 * d, 0.1, -0.4 * (1 - d)], forward: 0.15 * d }; },
  swipe: u => { const w = rise(u, 0.5); return { turn: 0.6 * Math.sin(u * Math.PI * 1.5) * w, armR: [-1.2 * w, 0.9 * Math.cos(u * Math.PI), -0.2], lean: 0.1 * w }; },
  cast: u => { const w = rise(u, 0.4); return { armR: [-2.2 * w, 0.4 * w, -0.3], armL: [-2.2 * w, 0.4 * w, -0.3], head: [-0.25 * w, 0], lift: 0.08 * w, glow: 1 + 1.5 * w, mist: 1 + w }; },
  roar: u => { const w = rise(u, 0.3); return { armR: [-0.6 * w, 1.3 * w, -0.2], armL: [-0.6 * w, 1.3 * w, -0.2], head: [-0.45 * w, 0], lean: -0.15 * w, glow: 1 + w, mist: 1 + 1.5 * w }; },
  hurt: u => ({ lean: -0.35 * env(u), forward: -0.12 * env(u), armR: [-0.4 * env(u), 0.4 * env(u), -0.3], armL: [-0.4 * env(u), 0.4 * env(u), -0.3], head: [0.3 * env(u), 0.2 * env(u)] }),
  ko: u => ({ lean: -1.3 * smooth(u), sink: 0.5 * smooth(u), armR: [-0.4 * smooth(u), 0.8 * smooth(u), 0], armL: [-0.4 * smooth(u), 0.8 * smooth(u), 0], glow: 1 - smooth(u), mist: 1 + 2 * smooth(u) }),
  // the Rime-Abbot (Brother Aurel)
  'crozier-strike': u => { const s = SHAPES.strike(u); return { ...s, glow: 1 + (u > 0.4 && u < 0.7 ? 2 : 0) }; },
  toll: u => { const w = rise(u, 0.3), k = u > 0.45 ? Math.sin((u - 0.45) * 40) * (1 - u) * 0.12 : 0; return { armR: [-1.6 * w, 0.2, -0.6 * w], lift: 0.1 * w - (u > 0.45 && u < 0.55 ? 0.08 : 0), turn: k, glow: 1 + w, mist: 1 + w * 2 }; },
  'rime-ward': u => { const w = rise(u, 0.3); return { armR: [-0.8 * w, 0, -0.9 * w], armL: [-1.4 * w, -0.2, -1.6 * w], lean: 0.2 * w, sink: 0.12 * w, glow: 1 + 1.2 * w, mist: 1 + 2 * w }; },
  drown: u => { const r = rise(u, 0.4); return { forward: 0.45 * r, armL: [-1.4 * r, 0.1, -0.1], armR: [-0.5 * r, 0, -0.6], lean: 0.25 * r, sink: 0.25 * smooth((u - 0.5) / 0.5) * r }; },
  'call-the-choir': u => { const w = rise(u, 0.35); return { armR: [-2.8 * w, 0.2, -0.1], armL: [-0.8 * w, 0.8 * w, -0.4], head: [-0.4 * w, 0], lift: 0.12 * w, glow: 1 + 2 * w, mist: 1 + 2 * w }; },
  hushing: u => { const w = rise(u, 0.4); return { lean: 0.3 * w, forward: 0.15 * w, armL: [-1.7 * w, 0.4, -1.9 * w], head: [0.25 * w, -0.2 * w], glow: 1 + 0.8 * w }; },
  heartbeat: u => { const b = Math.max(0, Math.sin(u * Math.PI * 4)) * (1 - u); return { lean: 0.15 * b, sink: 0.05 * b, armR: [-0.4 * b, 0.6 * b, -0.3], armL: [-0.4 * b, 0.6 * b, -0.3], glow: 1 + 2.5 * b, mist: 1 + 2 * b }; },
  'rime-nova': u => { const w = rise(u, 0.5); return { armR: [-1.5 * w, 1.6 * w, 0], armL: [-1.5 * w, 1.6 * w, 0], head: [-0.4 * w, 0], lift: 0.18 * w, glow: 1 + 3 * w, mist: 1 + 3 * w }; },
  // the Lantern Mother
  'lamp-pole': u => { const w = rise(u, 0.5); return { turn: -0.7 * Math.sin(u * Math.PI * 1.4) * w, armR: [-1.4 * w, 1.1 * Math.cos(u * Math.PI), -0.3], lean: 0.15 * w, forward: 0.1 * w }; },
  lure: u => { const w = rise(u, 0.4); return { armL: [-2.4 * w, -0.2, -0.3], head: [0.1 * w, 0.3 * w], lean: 0.1 * w, glow: 1 + 1.2 * w }; },
  'lantern-flare': u => { const w = rise(u, 0.3); return { armL: [-2.8 * w, -0.1, -0.1], head: [-0.3 * w, 0], lift: 0.06 * w, glow: 1 + 3 * w }; },
  'hush-now': u => { const w = rise(u, 0.4); return { armR: [-0.6 * w, 0, -0.4], armL: [-1.2 * w, 0.3, -1.6 * w], lean: 0.2 * w, head: [0.2 * w, 0], glow: 1 - 0.3 * w }; },
  'lead-them-down': u => { const r = rise(u, 0.45); return { forward: 0.4 * r, armL: [-1.3 * r, 0.2, -0.1], lean: 0.2 * r, sink: 0.2 * smooth((u - 0.5) / 0.5) * r, glow: 1 + 0.6 * r }; },
  moths: u => { const w = rise(u, 0.35); return { armL: [-2.3 * w, -0.4 * w, -0.4], head: [-0.25 * w, 0], glow: 1 + 1.8 * w }; },
  mourning: u => { const w = rise(u, 0.4); return { armR: [-2.0 * w, -0.3, -1.4 * w], armL: [-2.0 * w, -0.3, -1.4 * w], head: [-0.3 * w, 0], lean: -0.1 * w, mist: 1 + 1.5 * w }; },
  snuff: u => { const w = rise(u, 0.4); return { armL: [-1.4 * w, -0.1, -0.6], armR: [-1.0 * w, 0.4 * w, -1.4 * w], glow: 1 - 0.85 * smooth((u - 0.3) / 0.4) * (1 - smooth((u - 0.85) / 0.15)) }; },
  'lantern-nova': u => { const w = rise(u, 0.5); return { armL: [-2.9 * w, 0, 0], armR: [-0.6 * w, 1.2 * w, -0.2], head: [-0.4 * w, 0], lift: 0.14 * w, glow: 1 + 4 * w }; },
  'drown-the-light': u => { const d = u < 0.45 ? smooth(u / 0.45) : 1 - smooth((u - 0.65) / 0.35); return { armL: [u < 0.3 ? -2.4 * smooth(u / 0.3) : lerp(-2.4, 0.3, smooth((u - 0.3) / 0.2)), -0.1, -0.2], lean: 0.35 * d, forward: 0.2 * d, glow: u > 0.5 ? 0.3 + smooth((u - 0.5) / 0.4) * 2 : 1 + d, mist: 1 + 2 * d }; },
};
// M7's other moves (summon, toll, charm...) find their nearest common move by the Fight's own words (arena.js kitMove)

/* ------------------------------------------------------------------ build */
export function buildWraith(key, o = {}) {
  const keepQ = Q.d; Q.d = o.detail === 'light' ? 1 : 2;
  try {
    const group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
    const R = B[key](inner, o);
    // stand it on its height (Chris's sheets and the Bestiary's sizes)
    const H = WRAITH_INFO[key].height;
    // (measured without what it holds above its head: a staff, a crook)
    const tall = [R.props.staff?.group].filter(Boolean); for (const x of tall) x.visible = false;
    inner.updateMatrixWorld(true);
    const box = new THREE.Box3(); inner.traverseVisible(x => { if (x.isMesh) box.expandByObject(x); });
    for (const x of tall) x.visible = true;
    const h = box.max.y - Math.min(0, box.min.y);
    inner.scale.setScalar(H / Math.max(0.2, h));
    // mist round the hem, where the sheet shows it
    const m = BEASTS[key]?.[3] || {};
    if (m.mist || /rime|abbess|choir-wraith/.test(key)) R.mists.push(mist(R.body, { color: /rime/.test(key) ? '#bfe8ff' : '#9fd6e6', r: 0.34, opacity: 0.38 }));
    if (/wisp/.test(key)) R.mists.push(mist(R.body, { color: '#9ff0e8', r: 0.25, y: 0.1, rise: 0.5, size: 0.2, opacity: 0.32 }));
    // join pieces on each moving node by material: a few draws
    const keep = new Set([group, inner, R.root, R.body, R.hem, R.chest, R.head, ...R.arms.flatMap(a => [a.sh, a.el, a.hand]), ...R.swing, ...Object.values(R.base).filter(x => x && x.isObject3D)]);
    for (const p of Object.values(R.props)) { if (p?.group) keep.add(p.group); if (p?.top) keep.add(p.top); if (p?.isObject3D) keep.add(p); }
    bake(group, keep);
    let tris = 0, draws = 0; group.traverse(x => { if (x.isMesh) { draws++; const g = x.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    return makeLook(key, group, R, { height: H, triangles: Math.round(tris), draws });
  } finally { Q.d = keepQ; }
}

function makeLook(key, group, R, info) {
  const own = OWN[key] || {}, D = { ...COMMON, ...own };
  const MOVES = Object.entries(D).map(([k, d]) => [k, d]);
  const look = {
    group, g: group, plan: 'wraith', key, height: info.height, rig: R, triangles: info.triangles, draws: info.draws,
    parts: { head: R.head, body: R.body, chest: R.chest, armL: R.armL.sh, armR: R.armR.sh, hem: R.hem, ...R.props },
    act: { lunge: 0, fall: 0 }, hitAt: -9, t: 0,
    moves: { MOVES, DUR: D }, duration: m => D[m] || 1.2,
    hit() { look.hitAt = look.t; },
    update(t, step = 0) {
      look.t = t;
      const L = look.act.lunge || 0, F = look.act.fall || 0, h = (t - look.hitAt) / 0.6;
      if (F > 0) return look.pose('ko', F, t, 0);
      if (h >= 0 && h < 1) return look.pose('hurt', h, t, 0);
      if (L > 0) return look.pose('bite', L, t, 0);
      return look.pose(step ? 'walk' : 'idle', 0, t, step);
    },
    pose(move, u, t, step = 0) { look.t = t; poseRig(R, SHAPES[move] ? SHAPES[move](u) : {}, t, step, move); },
  };
  look.pose('idle', 0, 0, 0);
  return look;
}

const _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
function poseRig(R, S, t, step, move) {
  const walker = R.walker, bob = walker ? 0 : Math.sin(t * 1.6) * 0.025 + R.hover, sway = Math.sin(t * 0.9) * 0.04;
  const walkLean = step ? 0.12 : 0, sink = S.sink || 0;
  R.body.position.set(0, bob + (S.lift || 0) - sink * 0.6, (S.forward || 0));
  R.body.rotation.set((S.lean || 0) + walkLean, (S.turn || 0), sway * 0.4);
  // the hem lags behind the body (rigid: it turns, it does not stretch)
  R.hem.rotation.set(-(S.lean || 0) * 0.45 - walkLean * 0.6 + Math.sin(t * 1.3) * 0.03, -(S.turn || 0) * 0.3, -sway * 0.5);
  R.head.rotation.set((S.head?.[0] || 0) + Math.sin(t * 0.7) * 0.03, (S.head?.[1] || 0) + Math.sin(t * 0.5) * 0.08, 0);
  for (const a of R.arms) {
    const base = (a.side === -1 ? R.base.armR : R.base.armL) || [0, 0.12, -0.15];
    const mv = a.side === -1 ? S.armR : S.armL;
    const idle = Math.sin(t * 1.4 + a.side) * 0.05;
    a.sh.rotation.set((mv ? mv[0] : 0) + base[0] + idle + (step ? Math.sin(step + (a.side > 0 ? Math.PI : 0)) * 0.25 : 0), 0, (base[1] + (mv ? mv[1] : 0)) * a.side); // [1]: outward (+) or inward (-), either arm
    a.el.rotation.set(base[2] + (mv ? mv[2] : 0), 0, 0);
  }
  if (walker) for (const s of [-1, 1]) { const leg = R.base['leg' + s]; if (leg) leg.rotation.x = step ? Math.sin(step + (s > 0 ? Math.PI : 0)) * 0.4 : 0; }
  // a staff stays upright in the hand (it turns with the hand only as far as the move swings it)
  const st = R.props.staff; if (st) { st.group.rotation.x = -(R.armR.sh.rotation.x + R.armR.el.rotation.x) * 0.85; st.group.rotation.z = -R.armR.sh.rotation.z * 0.9; }
  // lanterns and bells hang: they turn back toward straight down, with a swing
  R.root.updateMatrixWorld(true);
  for (const s of R.swing) {
    s.rotation.set(0, 0, 0); s.updateMatrixWorld(true);
    _q.setFromRotationMatrix(_m.copy(R.root.matrixWorld).invert().multiply(s.matrixWorld));
    s.quaternion.copy(_q.invert()); s.rotateZ(Math.sin(t * 2.2 + s.id) * 0.1); s.rotateX(Math.sin(t * 1.7 + s.id) * 0.08);
  }
  // glow and mist with the move
  const gl = S.glow ?? 1;
  for (const m of R.glows) { m.userData.base ??= m.emissiveIntensity; m.emissiveIntensity = m.userData.base * Math.max(0.05, gl); }
  for (const mi of R.mists) { mi.update(t); mi.pts.material.opacity = 0.38 * (S.mist ?? 1); }
  if (S.spin) R.root.rotation.y = S.spin;
}

/* ------------------------------------------------------------------ for the Fight */
export function wraithLook(key, sprite, opts = {}) {
  if (!B[key]) return null;
  return buildWraith(key, { detail: opts.detail === 'high' ? 'high' : 'light' });
}
export const withWraiths = fallback => (key, sprite, opts) => wraithLook(key, sprite, opts) || fallback(key, sprite, opts);
