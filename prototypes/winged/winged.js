// The winged foes in full detail (session 3, Models; from session 7's list, November 23): the Lamp-Moth (rabble, Act Two's
// Lanternfen: a pale-gold moth with a lamp in its tail), the Gloamwing (Act One: a moth the size of a cart with the
// Dawnbell spun into the silk on its thorax) and the Thunder-Roc (Act Two: a storm-blue eagle the size of a barn, a
// shepherd's feather cloak still caught on its talon).
//
// Built the way the wraiths and the armoured ones are: the heroes' kit and the sculpted masters (three new ones for
// these: a flight feather, a moth's scaled wing, a coat of small feathers), shaped to Chris's sheets. Every piece is
// rigid on one moving part, so nothing stretches: a moth's wings are stiff membranes, painted, on their veins, each
// hinged at the root; its body is insect segments, each its own piece; the Roc's wings are three spars (arm, forearm,
// hand) with every feather a rigid blade on the spar it grows from, so the wing folds and spreads by its joints.
//
//   buildWinged(key, { detail }) -> the Fight's look (as armouredLook's: group, plan, height, parts, update, pose,
//     moves.MOVES, duration, hit, act, triangles, draws);  wingedLook(key, sprite, opts) -> that look, or null
//   withWinged(fallback) -> for setBeastLook, chained like withArmoured
// Moves: M7's own (batter, dust, circle; wing-buffet, dreamdust, cocoon, bell-hum; talons, wing-gale, carry-off,
// storm-mantle), the common ones the Fight falls back on, and flight: hover, swoop, dive, land.
import * as THREE from 'three';
import { V, lerp, smooth, clamp01, tube, lathe, plate, fitMaster, withMaster, add, bake, sph, tor, cone, Q } from '../hero-3d/kit.js';
import { BEASTS } from '../bestiary/beasts.js';
import { glow, mist, env, rise } from '../wraiths/wraiths.js';

export const WINGED = ['lamp-moth', 'gloamwing', 'thunder-roc'];
export const WINGED_INFO = {
  'lamp-moth': { name: 'Lamp-Moth', act: 'Act Two, Lanternfen (rabble)', blurb: 'A moth the size of a hand, pale gold and dun with amber eyespots, drawn to the Lantern Mother\'s light; a lamp burns in its tail. Where she walks they come in clouds.' },
  gloamwing: { name: 'The Gloamwing', act: 'Act One, Fawnrest (Relic-Bearer)', blurb: 'A pale moth the size of a cart, lavender-grey with gold eyespots, its fur like snow, the Fawnrest bell (the Dawnbell) spun into the silk on its thorax on braided cords.' },
  'thunder-roc': { name: 'The Thunder-Roc', act: 'Act Two, Highfold (Relic-Bearer)', blurb: 'A storm-blue eagle the size of a barn, nesting on the Highfold crags, sparks in its pinions; a shepherd\'s cloak of its own feathers is still caught on its talon.' },
};
// how high each hovers (its lowest point above the ground, in heights) and lies when down
const AIR = { 'lamp-moth': 0.6, gloamwing: 0.35, 'thunder-roc': 0 };
for (const k of WINGED) { WINGED_INFO[k].h0 = BEASTS[k]?.[2] || 1.2; WINGED_INFO[k].height = WINGED_INFO[k].h0 * (1 + AIR[k]); }

/* ------------------------------------------------------------------ materials */
const Lc = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };   // a colour in the working (linear) space
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const MATS = new Map();
function surf(h, { rough = 0.8, metal = 0, vc = false, side = true, coat = 0, emissive = null, k = 0 } = {}) {
  const id = [h, rough, metal, vc, side, coat, emissive, k, Q.d].join('|'); if (MATS.has(id)) return MATS.get(id);
  const o = { color: new THREE.Color(vc ? '#ffffff' : h), roughness: rough, metalness: metal, vertexColors: vc, side: side ? THREE.DoubleSide : THREE.FrontSide };
  if (emissive) Object.assign(o, { emissive: new THREE.Color(emissive), emissiveIntensity: k });
  const m = withMaster(coat ? new THREE.MeshPhysicalMaterial({ ...o, clearcoat: coat, clearcoatRoughness: 0.08 }) : new THREE.MeshStandardMaterial(o));
  MATS.set(id, m); return m;
}
// a glow this figure owns (it flares and dims with its moves; other figures' stay as they are)
const own = (m, base, gain) => { const c = m.clone(); c.userData = { ...m.userData, base, gain }; return c; };

/* ------------------------------------------------------------------ parts */
const node = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function vnoise(x, y, s = 1) {
  const h = (i, j) => { let n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 982451653); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h(i, j), h(i + 1, j), sx), lerp(h(i, j + 1), h(i + 1, j + 1), sx), sy);
}
const band = (x, a, b, soft = 0.012) => smooth((x - a + soft) / (2 * soft)) * (1 - smooth((x - b + soft) / (2 * soft)));

// a leaf: a feather, a tuft of fur, a scale. A flat blade along +y, its faces toward +z, curling toward +z at the tip;
// wid its half-width, round how soon it reaches full width, tipAt where it starts to close. Wears the feather master.
const LEAVES = new Map();
function leafGeo(len, wid, { curl = 0.12, thick = 0.12, tipAt = 0.55, round = 0.25, bend = 0, kind = 'feather', point = 0 } = {}) {
  const id = [len, wid, curl, thick, tipAt, round, bend, kind, point, Q.d].join('|'); if (LEAVES.has(id)) return LEAVES.get(id);
  const m = Q.d > 1 ? 10 : 6, pts = [];
  for (let i = 0; i <= m; i++) { const t = i / m; pts.push(V(bend * len * t * t, len * t, curl * len * t * t)); }
  const w = t => { const a = t < round ? 0.3 + 0.7 * Math.sqrt(smooth(t / round)) : 1, b = t > tipAt ? Math.pow(Math.max(0, 1 - ((t - tipAt) / (1 - tipAt)) ** 2), point ? 1 : 0.5) : 1; return wid * a * Math.max(0.05, b); };
  const g = fitMaster(tube(pts, t => [w(t) * thick + 0.0015, w(t)], { n: 6, up: V(0, 0, 1) }), kind);
  LEAVES.set(id, g); return g;
}
// put a leaf (or anything built along +y with its face +z) at p, its length along dir, its face toward face
const _mb = new THREE.Matrix4();
function put(geo, m, parent, p, dir, face) {
  const y = dir.clone().normalize(), z = face.clone().addScaledVector(y, -face.dot(y)).normalize(), x = y.clone().cross(z);
  const o = add(geo, m, parent, p.x, p.y, p.z); o.quaternion.setFromRotationMatrix(_mb.makeBasis(x, y, z)); return o;
}
// a ring of leaves round a body (a ruff, a collar of fur): n of them at height y and radius r, pointing out and down
function ruff(parent, mats, { n, y, r, len, wid, down = 0.6, out = 1, z0 = 0, sz = 1, a0 = 0, a1 = Math.PI * 2, curl = 0.2, seed = 1, jitter = 0.25, point = 0 }) {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, a = lerp(a0, a1, t) + (vnoise(i * 3.1, seed, 7) - 0.5) * jitter / n * 6, s = Math.sin(a), c = Math.cos(a);
    const L = len * (0.85 + 0.3 * vnoise(i * 1.7, seed, 9)), p = V(s * r, y, c * r * sz + z0);
    put(leafGeo(Math.round(L * 1000) / 1000, wid, { curl, point }), mats[i % mats.length], parent, p, V(s * out, -down, c * out), V(s, 0.4, c));
  }
}
// a tube that is a vein, a cord, a leg: along points
const rod = (pts, r, kind = 'haft', n = 6) => fitMaster(tube(pts, r, { n }), kind);

// a moth's wing: a stiff membrane the shape of `ctrl` (a closed outline in its own plane: x out along the span, y along
// the body), scalloped on its outer edge, cupped back toward the tip, painted by paint(x, y, t, a) (t 0 at the middle to
// 1 at the rim, a round the rim), on its veins (rigid with it). Built on the wing's own hinge node.
function mothWing(parent, side, ctrl, paint, m, veinM, veins, { cup = 0.07, scallops = 18, depth = 0.025 } = {}) {
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, y]) => V(x, y, 0)), true, 'centripetal');
  const N = 180, raw = curve.getSpacedPoints(N).slice(0, N);
  const c = raw.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / N);
  const outline = raw.map((p, i) => { const far = smooth((p.length() - 0.4) / 0.35), k = 1 - depth * far * (0.5 + 0.5 * Math.cos(i / N * Math.PI * 2 * scallops)); return [side * (c.x + (p.x - c.x) * k), c.y + (p.y - c.y) * k]; });
  const bulge = (x, y) => -cup * (x * x + y * y);
  const g = plate(outline, bulge, { rings: 16, seg: 64 });
  const P = g.attributes.position, seg = g.userData.rim.length, rings = Math.round((P.count - 1) / seg), col = new Float32Array(P.count * 3);
  for (let k = 0; k < P.count; k++) { const i = k === 0 ? 0 : Math.floor((k - 1) / seg) + 1, j = k === 0 ? 0 : (k - 1) % seg; col.set(paint(Math.abs(P.getX(k)), P.getY(k), i / rings, j / seg), k * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  add(fitMaster(g, 'mothwing', { planar: true }), m, parent);
  for (const [ex, ey, r] of veins) {
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, x = side * ex * t, y = ey * t + Math.sin(t * Math.PI) * 0.03 * ey; pts.push(V(x, y, bulge(x, y))); }
    add(rod(pts, t => (r || 0.005) * (1 - 0.7 * t), 'haft', 4), veinM, parent);
  }
}
// a feathered antenna: a curved shaft from the head with barbs down both sides (rigid, on the head)
function antenna(head, side, base, L, shaftM, barbM, { n = 14, barb = 0.16, comb = false } = {}) {
  const pts = [base, base.clone().add(V(side * 0.12 * L, 0.55 * L, 0.06 * L)), base.clone().add(V(side * 0.32 * L, 0.92 * L, -0.08 * L)), base.clone().add(V(side * 0.5 * L, 1.05 * L, -0.28 * L))];
  const cv = new THREE.CatmullRomCurve3(pts);
  add(rod(cv.getPoints(10), t => 0.014 * L * (1 - 0.6 * t), 'haft', 5), shaftM, head);
  for (let i = 0; i < n; i++) {
    const t = 0.1 + 0.86 * i / (n - 1), p = cv.getPoint(t), T = cv.getTangent(t), S = T.clone().cross(V(0, 0, 1)).normalize();
    const len = L * barb * (comb ? 0.8 : Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 0.6)) + 0.004;
    for (const s of [-1, 1]) put(leafGeo(Math.round(len * 1000) / 1000, comb ? 0.008 * L : 0.03 * L, { curl: 0.05, thick: comb ? 0.6 : 0.2, tipAt: comb ? 0.8 : 0.5 }), barbM, head, p, S.clone().multiplyScalar(s).addScaledVector(T, 0.7), V(0, 0, 1));
  }
}

/* ------------------------------------------------------------------ the moths */
const MOTH = {
  gloamwing: {
    t: 0.22, span: 1.0, head: 0.13, ant: 0.6, legs: 0.16, abd: [4, 0.17, 0.14],
    fur: '#bcb6c6', fur2: '#8e889e', belly: '#857f99', leg: '#7e7890', vein: '#7c7694', eye: '#16141c', antC: '#c8aa62',
    fore: [[0.02, 0.06], [0.32, 0.28], [0.66, 0.47], [0.95, 0.57], [1.09, 0.5], [1.12, 0.32], [1.04, 0.12], [0.88, -0.03], [0.6, -0.09], [0.3, -0.09], [0.06, -0.04]],
    hind: [[0.04, -0.03], [0.34, -0.07], [0.64, -0.14], [0.86, -0.32], [0.9, -0.55], [0.76, -0.74], [0.54, -0.82], [0.32, -0.74], [0.16, -0.52], [0.05, -0.26]],
    foreV: [[1.02, 0.53, 0.008], [1.08, 0.34], [1.0, 0.15], [0.84, 0.0], [0.55, -0.07]], hindV: [[0.84, -0.3], [0.86, -0.54], [0.68, -0.74], [0.42, -0.77], [0.18, -0.54]],
    paintF: (x, y, t, a) => {
      const n = vnoise(x * 8, y * 8, 3), n2 = vnoise(x * 2.5, y * 2.5, 5), d = Math.hypot(x, y);
      let c = mixc(Lc('#7c7698'), Lc('#aca6c2'), clamp01(0.25 + 0.6 * n2 + 0.25 * n));
      c = mixc(c, Lc('#ddd8e6'), band(Math.abs(t - 0.45 - 0.04 * Math.sin(a * 6.28 * 7)), -1, 0.03, 0.015) * smooth((d - 0.3) / 0.2) * 0.8);   // a pale wavy band
      const e = Math.hypot(x - 0.66, y - 0.3);                                                                                  // the gold eyespot
      c = mixc(c, Lc('#d6d0e2'), 1 - smooth((e - 0.145) / 0.012)); c = mixc(c, Lc('#ae9168'), 1 - smooth((e - 0.115) / 0.01));
      c = mixc(c, Lc('#6e5a3c'), 1 - smooth((e - 0.085) / 0.01)); c = mixc(c, Lc('#d8b23a'), 1 - smooth((e - 0.055) / 0.01));
      const edge = 0.8 + 0.035 * Math.cos(a * Math.PI * 2 * 16), far = smooth((d - 0.3) / 0.25);
      c = mixc(c, Lc('#e2dcea'), band(t, edge - 0.1, edge - 0.065) * far);
      return mixc(c, Lc('#38314c'), smooth((t - edge) / 0.02) * far);
    },
    paintH: (x, y, t, a) => {
      const n = vnoise(x * 7, y * 7, 11), d = Math.hypot(x, y);
      let c = mixc(Lc('#8680a2'), Lc('#aaa4c0'), clamp01(0.3 + 0.6 * n));
      c = mixc(c, Lc('#a68a56'), band(t, 0.55 + 0.035 * Math.cos(a * 6.28 * 9), 0.6 + 0.035 * Math.cos(a * 6.28 * 9)) * smooth((d - 0.25) / 0.2));
      const edge = 0.8 + 0.035 * Math.cos(a * Math.PI * 2 * 14), far = smooth((d - 0.25) / 0.25);
      c = mixc(c, Lc('#d8d2e4'), band(t, edge - 0.09, edge - 0.06) * far);
      return mixc(c, Lc('#38314c'), smooth((t - edge) / 0.02) * far);
    },
  },
  'lamp-moth': {
    t: 0.2, span: 0.95, head: 0.13, ant: 0.42, legs: 0.42, abd: [5, 0.15, 0.12],
    fur: '#a08c68', fur2: '#6e5c42', belly: '#6a5640', leg: '#4a3a28', vein: '#7a6a54', eye: '#b87a1c', antC: '#a87a30', lamp: '#ffbe50',
    fore: [[0.02, 0.05], [0.18, 0.4], [0.36, 0.76], [0.56, 0.98], [0.78, 1.0], [0.92, 0.84], [0.92, 0.55], [0.78, 0.25], [0.56, 0.06], [0.3, -0.04], [0.08, -0.04]],
    hind: [[0.04, -0.02], [0.34, -0.05], [0.64, -0.12], [0.8, -0.3], [0.78, -0.52], [0.6, -0.64], [0.4, -0.62], [0.2, -0.46], [0.06, -0.22]],
    foreV: [[0.8, 0.98, 0.008], [0.92, 0.7], [0.82, 0.32], [0.56, 0.05]], hindV: [[0.76, -0.28], [0.74, -0.52], [0.5, -0.64], [0.22, -0.46]],
    paintF: (x, y, t, a) => {
      const n = vnoise(x * 5, y * 5, 21), n2 = vnoise(x * 11, y * 11, 22), d = Math.hypot(x, y);
      let c = mixc(Lc('#b8a888'), Lc('#9a8a6c'), n2 * 0.7);
      c = mixc(c, Lc('#5a4a3a'), smooth((n - 0.47) / 0.07) * 0.9);                                                              // dun mottles
      c = mixc(c, Lc('#d2c6a6'), smooth((0.3 - n) / 0.06) * 0.7);
      c = mixc(c, Lc('#7a6a54'), band(t, 0.62, 0.7, 0.03) * smooth((d - 0.4) / 0.2) * 0.6);
      const e = Math.hypot((x - 0.66) * 1.1, y - 0.84);                                                                         // the amber eyespot
      c = mixc(c, Lc('#3e3226'), 1 - smooth((e - 0.14) / 0.012)); c = mixc(c, Lc('#d08c2a'), 1 - smooth((e - 0.11) / 0.012));
      return mixc(c, Lc('#54463a'), smooth((t - 0.87) / 0.02) * smooth((d - 0.35) / 0.2));
    },
    paintH: (x, y, t, a) => {
      const n = vnoise(x * 5, y * 5, 31), n2 = vnoise(x * 11, y * 11, 32), d = Math.hypot(x, y);
      let c = mixc(Lc('#b4a484'), Lc('#968668'), n2 * 0.7);
      c = mixc(c, Lc('#5a4a3a'), smooth((n - 0.46) / 0.07) * 0.9);
      c = mixc(c, Lc('#d0c4a4'), smooth((0.3 - n) / 0.06) * 0.7);
      return mixc(c, Lc('#54463a'), smooth((t - 0.85) / 0.02) * smooth((d - 0.3) / 0.2));
    },
  },
};
function moth(G, key) {
  const o = MOTH[key], t = o.t;
  const R = { kind: 'moth', glows: [], mists: [], props: {}, wings: [], legs: [], abd: [] };
  const body = node(G, 0, 0, 0); R.body = body; R.bodyY = 0;
  const fur = surf(o.fur), fur2 = surf(o.fur2), belly = surf(o.belly), legM = surf(o.leg, { rough: 0.55, coat: 0.3 }), veinM = surf(o.vein, { rough: 0.6 }), wingM = surf('#ffffff', { vc: true, rough: 0.85 });
  // the thorax: a furred egg, a ruff of fur at the neck, tufts down the chest and over the shoulders
  add(fitMaster(lathe([[0, -t], [t * 0.7, -t * 0.88], [t * 0.98, -t * 0.35], [t, t * 0.15], [t * 0.85, t * 0.68], [t * 0.5, t * 0.98], [0, t * 1.05]], { n: 18, sz: 0.95 }), 'plumage'), fur, body);
  ruff(body, [fur, fur, fur2], { n: 16, y: t * 0.72, r: t * 0.72, len: t * 0.75, wid: t * 0.2, down: 0.7, seed: 2 });
  ruff(body, [fur, fur2], { n: 13, y: t * 0.35, r: t * 0.92, len: t * 0.7, wid: t * 0.2, down: 1.1, seed: 3, a0: -1.25, a1: 1.25 });
  ruff(body, [fur2, fur], { n: 11, y: -t * 0.1, r: t * 0.96, len: t * 0.65, wid: t * 0.19, down: 1.6, seed: 4, a0: -1.0, a1: 1.0 });
  ruff(body, [fur, fur2], { n: 10, y: t * 0.25, r: t * 0.9, len: t * 0.7, wid: t * 0.22, down: 1.0, seed: 5, a0: 1.9, a1: 4.4 });
  // the head: furred, big glossy eyes, a ring of fur round the face, a small hooked mouth, plumed antennae
  const head = node(body, 0, t * 1.08, t * 0.32); R.head = head;
  const hr = o.head;
  add(fitMaster(lathe([[0, -hr], [hr * 0.75, -hr * 0.75], [hr, 0], [hr * 0.8, hr * 0.65], [0, hr * 0.95]], { n: 16, sz: 1.05 }), 'plumage'), fur, head);
  const eyeM = surf(o.eye, { rough: 0.15, coat: 1, side: false, emissive: key === 'lamp-moth' ? o.eye : null, k: 0.25 });
  for (const s of [-1, 1]) { const e = add(sph(hr * 0.36, 16, 12), eyeM, head, s * hr * 0.48, hr * 0.12, hr * 0.68); e.scale.set(1, 1.05, 0.85); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, d = V(Math.cos(a), Math.sin(a) * 0.9, 0.35); put(leafGeo(Math.round(hr * 0.6 * 1000) / 1000, hr * 0.2, { curl: 0.2 }), i % 2 ? fur : fur2, head, V(Math.cos(a) * hr * 0.78, Math.sin(a) * hr * 0.72, hr * 0.38), d, V(0, 0, 1)); }
  const beak = add(fitMaster(tube([V(0, -hr * 0.25, hr * 0.8), V(0, -hr * 0.36, hr * 1.02), V(0, -hr * 0.55, hr * 1.06)], t2 => hr * 0.11 * (1 - 0.8 * t2), { n: 6 }), 'forged'), surf(o.belly, { rough: 0.5 }), head);
  antenna(head, -1, V(-hr * 0.3, hr * 0.75, hr * 0.35), o.ant, surf(o.antC, { rough: 0.5 }), surf(o.antC, { rough: 0.6 }), { n: key === 'lamp-moth' ? 9 : 13, comb: key === 'lamp-moth' });
  antenna(head, 1, V(hr * 0.3, hr * 0.75, hr * 0.35), o.ant, surf(o.antC, { rough: 0.5 }), surf(o.antC, { rough: 0.6 }), { n: key === 'lamp-moth' ? 9 : 13, comb: key === 'lamp-moth' });
  // the abdomen: segments, each its own piece hung from the one before (they curl, never bend); the lamp-moth's last ones lit
  const [nA, rA, lA] = o.abd; let prev = body, y0 = -t * 0.8;
  for (let i = 0; i < nA; i++) {
    const seg = node(prev, 0, i === 0 ? y0 : -lA, i === 0 ? -t * 0.18 : -lA * 0.12); R.abd.push(seg); prev = seg;
    const r = rA * Math.pow(1 - i / (nA + 0.4), 0.75), r2 = rA * Math.pow(1 - (i + 1) / (nA + 0.4), 0.75), last = i === nA - 1;
    const lit = o.lamp && i >= nA - 2;
    const m = lit ? own(glow(o.lamp, 1.6), 1.6, 1.4) : i % 2 ? belly : fur2;
    if (lit) R.glows.push(m);
    add(fitMaster(lathe(last ? [[0, -lA * 1.25], [r2 * 0.6, -lA * 1.05], [r * 0.95, -lA * 0.5], [r * 1.05, -lA * 0.05], [r * 0.8, lA * 0.15]] : [[r2 * 0.85, -lA * 1.05], [r2 * 1.02, -lA * 0.8], [r * 1.05, -lA * 0.35], [r * 1.0, lA * 0.05], [r * 0.8, lA * 0.18]], { n: 16 }), lit ? 'mothwing' : 'plumage'), m, seg);
    if (!lit && i < (o.lamp ? 1 : 2)) ruff(seg, [fur2, belly, fur], { n: 9, y: -lA * 0.1, r: r * 0.9, len: lA * 0.9, wid: r * 0.3, down: 2.2, seed: 10 + i, a0: -1.6, a1: 1.6 });
  }
  if (o.lamp) R.props.lamp = R.abd[nA - 1];
  // legs: three pairs under the thorax, each a thigh and a shin, rigid, with a hooked foot
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const femur = node(body, s * t * 0.4, -t * 0.55 + i * 0.02, t * 0.35 - i * t * 0.32), L1 = o.legs * 0.5, L2 = o.legs * 0.62;
    add(rod([V(0, 0, 0), V(0, -L1 * 0.5, 0.01), V(0, -L1, 0)], t2 => t * 0.075 * (1 - 0.3 * t2), 'lame', 6), legM, femur);
    const tib = node(femur, 0, -L1, 0);
    add(rod([V(0, 0, 0), V(0, -L2 * 0.55, -0.005), V(0, -L2, 0.01)], t2 => t * 0.055 * (1 - 0.5 * t2), 'lame', 6), legM, tib);
    add(rod([V(0, -L2, 0.01), V(0, -L2 - t * 0.12, t * 0.06), V(0, -L2 - t * 0.14, t * 0.14)], t2 => t * 0.03 * (1 - 0.7 * t2), 'rim', 5), legM, tib);
    R.legs.push({ femur, tib, side: s, i });
  }
  // wings: a forewing and a hindwing each side, each hinged at the root
  for (const s of [-1, 1]) {
    const fw = node(body, s * t * 0.55, t * 0.32, -t * 0.25), hw = node(body, s * t * 0.5, -t * 0.25, -t * 0.32);
    const sc = (pts) => pts.map(([x, y]) => [x * o.span, y * o.span]);
    mothWing(fw, s, sc(o.fore), (x, y, tt, a) => o.paintF(x / o.span, y / o.span, tt, a), wingM, veinM, o.foreV.map(([x, y, r]) => [x * o.span, y * o.span, r]));
    mothWing(hw, s, sc(o.hind), (x, y, tt, a) => o.paintH(x / o.span, y / o.span, tt, a), wingM, veinM, o.hindV.map(([x, y, r]) => [x * o.span, y * o.span, r]));
    R.wings.push({ fore: fw, hind: hw, side: s });
  }
  // wing-dust: a few glittering scales always falling; Dreamdust and Dust in the Eyes throw it in clouds
  R.mists.push(mist(body, { color: key === 'gloamwing' ? '#f2eeff' : '#ffd890', n: 40, r: 0.5, y: -0.3, rise: -0.4, size: key === 'gloamwing' ? 0.07 : 0.05, opacity: 0.35 }));
  R.base = { pitch: 0.42, sweep: 0.3, amp: key === 'gloamwing' ? 0.55 : 0.7, rate: key === 'gloamwing' ? 1.6 : 5.5, A: AIR[key] };
  if (key === 'gloamwing') dawnbell(body, R, t);
  // a silk shell, spun when it cocoons (only seen then)
  const silkM = new THREE.MeshStandardMaterial({ color: '#cfc9bc', roughness: 0.9, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const shell = add(fitMaster(lathe([[0, -t * 4.6], [t * 0.8, -t * 4.2], [t * 1.55, -t * 2.8], [t * 1.75, -t * 1.0], [t * 1.6, t * 0.6], [t * 1.1, t * 1.6], [0, t * 2.0]], { n: 24 }), 'braid'), withMaster(silkM), body);
  shell.userData.keep = true; shell.visible = false; R.silk = shell;
  return R;
}
// the Dawnbell, the Fawnrest bell, hung on braided cords from the moth's chest: a ring at the front, the cords crossed
// over the chest and knotted in a gold quatrefoil on its back, the bell on its own pendulum with tassels either side
function dawnbell(body, R, t) {
  const gold = surf('#d6a63a', { rough: 0.3, metal: 1, side: false }), cord = surf('#c88a3a', { rough: 0.7 }), cord2 = surf('#a8762e', { rough: 0.7 });
  const bellGold = own(new THREE.MeshStandardMaterial({ color: new THREE.Color('#d8aa3c'), metalness: 1, roughness: 0.28, emissive: new THREE.Color('#ffd068'), emissiveIntensity: 0.0 }), 0.0, 0.9);
  withMaster(bellGold); R.glows.push(bellGold);
  const ringP = V(0, -t * 0.62, t * 0.92);
  for (const s of [-1, 1]) {
    add(rod(new THREE.CatmullRomCurve3([V(s * t * 0.75, t * 0.75, t * 0.45), V(s * t * 0.55, t * 0.5, t * 0.98), V(-s * t * 0.1, -t * 0.1, t * 1.08), ringP.clone().add(V(-s * t * 0.08, t * 0.06, 0))]).getPoints(14), t * 0.065, 'braid', 6), s > 0 ? cord : cord2, body);
    add(rod(new THREE.CatmullRomCurve3([V(s * t * 0.75, t * 0.75, t * 0.45), V(s * t * 0.85, t * 0.6, -t * 0.4), V(s * t * 0.3, t * 0.25, -t * 0.98), V(0, t * 0.1, -t * 1.02)]).getPoints(12), t * 0.065, 'braid', 6), s > 0 ? cord : cord2, body);
  }
  // the clasp on the chest and the knot on the back
  const clasp = add(fitMaster(lathe([[0, -t * 0.14], [t * 0.1, -t * 0.06], [t * 0.12, t * 0.04], [t * 0.05, t * 0.16], [0, t * 0.2]], { n: 4, phi0: Math.PI / 4 }), 'forged'), gold, body, 0, t * 0.55, t * 0.98); clasp.rotation.x = 0.3;
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; add(sph(t * 0.09, 10, 8), gold, body, Math.cos(a) * t * 0.12, t * 0.1 + Math.sin(a) * t * 0.12, -t * 1.06); }
  add(sph(t * 0.08, 10, 8), gold, body, 0, t * 0.1, -t * 1.1);
  add(tor(t * 0.13, t * 0.035, 8, 20), gold, body, ringP.x, ringP.y, ringP.z);
  // the bell's pendulum: it hangs straight down whatever the moth does (the pose counter-turns it)
  const P = node(body, ringP.x, ringP.y - t * 0.12, ringP.z); R.props.bell = P;
  add(rod([V(-t * 0.03, 0, 0), V(t * 0.02, -t * 0.25, 0), V(-t * 0.01, -t * 0.5, 0)], t * 0.035, 'braid', 6), cord, P);
  add(rod([V(t * 0.03, 0, 0), V(-t * 0.02, -t * 0.25, 0), V(t * 0.01, -t * 0.5, 0)], t * 0.035, 'braid', 6), cord2, P);
  const r = t * 0.72, h = t * 1.25, top = -t * 0.55;
  add(tor(t * 0.09, t * 0.03, 8, 16), gold, P, 0, top + t * 0.02, 0).rotation.y = Math.PI / 2;
  const bg = lathe([[0, h], [r * 0.3, h * 0.99], [r * 0.52, h * 0.9], [r * 0.6, h * 0.7], [r * 0.66, h * 0.45], [r * 0.8, h * 0.18], [r * 0.98, h * 0.04], [r * 1.02, 0], [r * 0.9, -h * 0.02], [r * 0.8, 0.0]], { n: 32 });
  { const p = bg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < h * 0.06) { const a = Math.atan2(p.getX(i), p.getZ(i)), k = 1 + 0.07 * Math.max(0, Math.cos(a * 8)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y - 0.06 * h * Math.max(0, Math.cos(a * 8))); } } bg.computeVertexNormals(); }
  add(fitMaster(bg, 'embroid'), bellGold, P, 0, top - h, 0);
  add(tor(r * 0.62, t * 0.035, 8, 28), bellGold, P, 0, top - h * 0.35, 0).rotation.x = Math.PI / 2;
  add(tor(r * 0.92, t * 0.04, 8, 28), bellGold, P, 0, top - h * 0.9, 0).rotation.x = Math.PI / 2;
  add(sph(t * 0.13, 12, 10), bellGold, P, 0, top - h * 1.12, 0);
  add(sph(t * 0.07, 10, 8), gold, P, 0, top - h * 1.28, 0);
  // tassels on cords either side of the bell
  for (const s of [-1, 1]) {
    add(rod([V(s * t * 0.08, top + t * 0.02, 0), V(s * r * 1.05, top - h * 0.25, 0), V(s * r * 1.2, top - h * 0.55, 0)], t * 0.03, 'braid', 5), cord, P);
    add(fitMaster(lathe([[0, 0], [t * 0.07, -t * 0.03], [t * 0.11, -t * 0.25], [t * 0.13, -t * 0.42], [0, -t * 0.44]], { n: 12 }), 'braid'), cord, P, s * r * 1.2, top - h * 0.55, 0);
  }
}

/* ------------------------------------------------------------------ the Thunder-Roc */
function roc(G) {
  const R = { kind: 'bird', glows: [], mists: [], props: {}, wings: [], legs: [] };
  const navy = surf('#27345e'), navy2 = surf('#1d2648'), blue = surf('#33447a'), sky = surf('#7b98d4'), breast = surf('#7e84a0'), breast2 = surf('#696f8e');
  const gold = surf('#d9a23c', { rough: 0.45, coat: 0.4, side: false }), claw = surf('#16161a', { rough: 0.3, coat: 0.6, side: false });
  const spark = own(glow('#a8d8ff', 2.2), 2.2, 1.2); R.glows.push(spark); R.flicker = true;
  const Y0 = 0.66, body = node(G, 0, Y0, 0); R.body = body; R.bodyY = Y0;
  // the body: an upright egg in a coat of small feathers; a pale scalloped breast; a mantle of feathers over the shoulders
  const prof = [[0, -0.25], [0.14, -0.23], [0.21, -0.12], [0.245, 0.02], [0.25, 0.14], [0.22, 0.27], [0.16, 0.37], [0.11, 0.44], [0, 0.47]];
  add(fitMaster(lathe(prof, { n: 22, sz: 1.05 }), 'plumage'), navy, body);
  const rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return lerp(r0, r1, (y - y0) / (y1 - y0)); } return 0.05; };
  for (let row = 0; row < 7; row++) { const y = 0.33 - row * 0.055, n = 8 - (row > 4 ? 2 : 0); ruff(body, [breast, breast2], { n, y, r: rAt(y) * 0.99, sz: 1.05, len: 0.075, wid: 0.026, down: 4, a0: -0.7 + row * 0.04, a1: 0.7 - row * 0.04, seed: 40 + row, curl: 0.35, jitter: 0.1 }); }
  ruff(body, [navy, navy2, blue], { n: 16, y: 0.38, r: 0.15, len: 0.18, wid: 0.05, down: 2.4, seed: 50, a0: 0.9, a1: 5.4 });
  ruff(body, [navy2, navy], { n: 16, y: 0.24, r: 0.22, len: 0.18, wid: 0.055, down: 3, seed: 51, a0: 1.0, a1: 5.3 });
  ruff(body, [navy, blue, navy2], { n: 16, y: 0.04, r: 0.245, len: 0.18, wid: 0.055, down: 3.2, seed: 52, a0: 1.1, a1: 5.2 });
  ruff(body, [navy2, navy], { n: 16, y: -0.13, r: 0.21, len: 0.17, wid: 0.055, down: 3.2, seed: 53, a0: 0.6, a1: 5.7 });
  // the neck and head: a shaggy ruff, a crest of spikes, a hooked gold beak, a pale fierce eye under a heavy brow
  const neck = node(body, 0, 0.42, 0.05); R.neck = neck;
  add(fitMaster(lathe([[0.1, -0.04], [0.09, 0.06], [0.075, 0.14]], { n: 16 }), 'plumage'), navy, neck);
  ruff(neck, [navy, navy2, blue], { n: 12, y: 0.06, r: 0.08, len: 0.15, wid: 0.04, down: 1.2, seed: 54, curl: 0.3 });
  const head = node(neck, 0, 0.19, 0.03); R.head = head;
  add(fitMaster(lathe([[0, -0.085], [0.07, -0.065], [0.095, 0.0], [0.085, 0.06], [0.05, 0.095], [0, 0.105]], { n: 18, sz: 1.2 }), 'plumage'), navy, head);
  for (let i = 0; i < 13; i++) { const k = i / 12, a = lerp(-1.0, 1.0, k); put(leafGeo(0.13 + 0.09 * Math.sin(k * Math.PI), 0.032, { curl: -0.1, point: 1 }), i % 2 ? navy2 : navy, head, V(Math.sin(a) * 0.06, 0.06 + 0.02 * Math.cos(a), -0.03 - 0.03 * Math.cos(a)), V(Math.sin(a) * 0.8, 0.9, -0.9), V(0, 1, 0.4)); }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) put(leafGeo(0.09, 0.028, { curl: 0.1, point: 1 }), i % 2 ? navy : blue, head, V(s * 0.085, 0.02 - i * 0.025, -0.01), V(s * 0.4, -0.25, -1), V(s, 0, 0));
  add(fitMaster(lathe([[0.042, -0.02], [0.05, 0.0], [0.044, 0.025]], { n: 14, sz: 1.1 }), 'forged'), gold, head, 0, -0.012, 0.085).rotation.x = Math.PI / 2;
  add(fitMaster(tube([V(0, 0.0, 0.1), V(0, 0.002, 0.15), V(0, -0.012, 0.19), V(0, -0.045, 0.215), V(0, -0.08, 0.205)], t2 => [0.032 * (1 - t2 * 0.8) + 0.003, 0.042 * (1 - t2 * 0.85) + 0.004], { n: 8, up: V(1, 0, 0) }), 'forged'), gold, head);
  add(fitMaster(tube([V(0, -0.03, 0.1), V(0, -0.035, 0.14), V(0, -0.045, 0.17)], t2 => [0.022 * (1 - t2 * 0.7), 0.026 * (1 - t2 * 0.7)], { n: 8, up: V(1, 0, 0) }), 'forged'), gold, head);
  const eyeM = surf('#d6e2f2', { rough: 0.12, coat: 1, side: false, emissive: '#9ac4ff', k: 0.25 }), pup = surf('#0c0e14', { rough: 0.1, coat: 1, side: false });
  for (const s of [-1, 1]) {
    add(sph(0.018, 14, 10), eyeM, head, s * 0.064, 0.022, 0.072); add(sph(0.01, 10, 8), pup, head, s * 0.07, 0.022, 0.085);
    put(leafGeo(0.08, 0.026, { curl: -0.2, thick: 0.5 }), navy2, head, V(s * 0.045, 0.048, 0.1), V(s * 0.55, 0.12, -1), V(0, 1, 0.25));
  }
  for (const c of head.children) { c.position.multiplyScalar(1.3); c.scale.multiplyScalar(1.3); }   // (a bigger head, baked into its pieces)
  // the wings: three spars (arm, forearm, hand), each feather a rigid blade on the spar it grows from
  for (const s of [-1, 1]) R.wings.push(birdWing(body, s, { navy, navy2, blue, sky, spark }));
  // the tail: a fan of long feathers on its own joint
  const tail = node(body, 0, -0.17, -0.15); R.tail = tail;
  for (let i = 0; i < 12; i++) { const k = i / 11 - 0.5, d = V(k * 1.3, -0.6, -0.8); put(leafGeo(0.52 - Math.abs(k) * 0.12, 0.08, { curl: 0.05, tipAt: 0.75 }), i % 3 === 1 ? blue : i % 2 ? navy2 : navy, tail, V(k * 0.12, -0.01 * Math.abs(k), 0.002 * (i % 2)), d, V(0, 0.85, -0.55)); }
  ruff(tail, [navy, navy2], { n: 9, y: 0.03, r: 0.05, len: 0.2, wid: 0.05, down: 1.6, seed: 60, a0: 2.2, a1: 4.1 });
  // legs: feathered thighs ("trousers"), scaled gold shins, four-toed feet with black claws; the left foot holds the cloak
  for (const s of [-1, 1]) {
    const hip = node(body, s * 0.1, -0.13, 0.04);
    add(fitMaster(lathe([[0.055, -0.22], [0.075, -0.15], [0.08, -0.05], [0.065, 0.03]], { n: 14 }), 'plumage'), navy, hip);
    for (let row = 0; row < 3; row++) ruff(hip, [navy, navy2, blue], { n: 9, y: -0.03 - row * 0.065, r: 0.07, len: 0.12 + row * 0.02, wid: 0.035, down: 2.8, seed: 70 + row + s * 5, curl: 0.15 });
    const knee = node(hip, 0, -0.22, 0);
    add(rod([V(0, 0.02, 0), V(0, -0.12, 0.01), V(0, -0.25, 0.02)], t2 => 0.024 - t2 * 0.004, 'lame', 8), gold, knee);
    const foot = node(knee, 0, -0.26, 0.02);
    for (const [a, L] of [[-0.5, 0.11], [0, 0.13], [0.5, 0.11], [Math.PI, 0.08]]) {
      const d = V(Math.sin(a), 0, Math.cos(a)), p1 = d.clone().multiplyScalar(L * 0.55).setY(-0.02), p2 = d.clone().multiplyScalar(L).setY(-0.035);
      add(rod([V(0, 0, 0), p1, p2], t2 => 0.016 * (1 - 0.35 * t2), 'lame', 6), gold, foot);
      add(rod([p2, p2.clone().addScaledVector(d, 0.025).setY(-0.04), p2.clone().addScaledVector(d, 0.04).setY(-0.07)], t2 => 0.009 * (1 - 0.85 * t2) + 0.001, 'rim', 5), claw, foot);
    }
    R.legs.push({ hip, knee, foot, side: s });
    if (s > 0) R.props.cloak = cloak(foot, { navy, navy2, blue, sky, spark, gold });
  }
  R.base = { pitch: 0.2, A: 0, raise: 0.95, twist: -1.2, rate: 1.1, amp: 1 };
  return R;
}
// one wing: sh (the shoulder; the arm), el (the elbow; the forearm), wr (the wrist; the hand). In each spar's frame x runs
// out along the bone (mirrored by side), the feathers trail back (-z), the top of the wing is +y.
function birdWing(body, s, M) {
  const a1 = 0.34, a2 = 0.38, a3 = 0.3;
  const sh = node(body, s * 0.15, 0.3, -0.06), el = node(sh, s * a1, 0, 0), wr = node(el, s * a2, 0, 0);
  for (const n of [sh, el, wr]) n.rotation.order = 'ZYX';
  const up = V(0, 1, 0), X = x => s * x;
  // the bones under their coat
  add(rod([V(0, 0, 0), V(X(a1 * 0.5), 0.01, 0.01), V(X(a1), 0, 0)], t => 0.05 - 0.015 * t, 'plumage', 10), M.navy, sh);
  add(rod([V(0, 0, 0), V(X(a2 * 0.5), 0.005, 0.01), V(X(a2), 0, 0)], t => 0.038 - 0.012 * t, 'plumage', 10), M.navy, el);
  add(rod([V(0, 0, 0), V(X(a3 * 0.6), 0, 0.005), V(X(a3), 0, 0)], t => 0.028 - 0.012 * t, 'plumage', 8), M.navy, wr);
  add(sph(0.04, 10, 8), M.navy, el); add(sph(0.03, 10, 8), M.navy, wr);
  // primaries on the hand: fanned from along the bone at the tip to back at the wrist
  for (let i = 0; i < 10; i++) { const k = i / 9, th = lerp(0.35, 1.3, k), L = 0.6 + 0.1 * Math.sin(k * 2.6); put(leafGeo(+L.toFixed(3), 0.05, { curl: -0.04, tipAt: 0.7, bend: 0.02 }), i % 3 === 2 ? M.blue : i % 2 ? M.navy2 : M.navy, wr, V(X(a3 * (0.1 + 0.85 * k)), -0.004 * i, -0.012), V(X(Math.sin(th)), 0, -Math.cos(th)), up); }
  // secondaries on the forearm, tertials on the arm
  for (let i = 0; i < 12; i++) { const k = i / 11, th = lerp(-0.05, 0.3, k); put(leafGeo(0.5, 0.055, { curl: -0.03, tipAt: 0.75 }), i % 2 ? M.navy2 : M.navy, el, V(X(a2 * (0.04 + 0.94 * k)), -0.003 * (i % 2), -0.015), V(X(Math.sin(th)), 0, -Math.cos(th)), up); }
  for (let i = 0; i < 5; i++) { const k = i / 4; put(leafGeo(0.42 - 0.06 * (1 - k), 0.055, { curl: -0.03, tipAt: 0.75 }), i % 2 ? M.navy : M.blue, sh, V(X(a1 * (0.3 + 0.68 * k)), -0.003 * (i % 2), -0.02), V(X(-0.12 + 0.1 * k), 0, -1), up); }
  // coverts in rows over the flight feathers' roots; the leading edge in pale sky-blue
  for (let i = 0; i < 12; i++) { const k = i / 11; put(leafGeo(0.24, 0.05, { curl: -0.05, tipAt: 0.65 }), i % 2 ? M.navy : M.blue, el, V(X(a2 * (0.02 + 0.96 * k)), 0.018, 0.0), V(X(0.12), 0, -1), up); }
  for (let i = 0; i < 10; i++) { const k = i / 9; put(leafGeo(0.14, 0.045, { curl: -0.05, tipAt: 0.6 }), i % 2 ? M.navy2 : M.navy, el, V(X(a2 * (0.02 + 0.96 * k)), 0.032, 0.02), V(X(0.15), 0, -1), up); }
  for (let i = 0; i < 8; i++) { const k = i / 7; put(leafGeo(0.22, 0.045, { curl: -0.05, tipAt: 0.65 }), i % 2 ? M.navy : M.blue, wr, V(X(a3 * (0.05 + 0.8 * k)), 0.016, 0.0), V(X(Math.sin(lerp(0.3, 1.0, k))), 0, -Math.cos(lerp(0.3, 1.0, k))), up); }
  for (let i = 0; i < 6; i++) { const k = i / 5; put(leafGeo(0.2, 0.05, { curl: -0.05, tipAt: 0.65 }), i % 2 ? M.navy2 : M.navy, sh, V(X(a1 * (0.15 + 0.8 * k)), 0.02, 0.0), V(X(-0.05), 0, -1), up); }
  for (const [n, L, cnt] of [[sh, a1, 7], [el, a2, 8], [wr, a3, 6]]) for (let i = 0; i < cnt; i++) { const k = (i + 0.5) / cnt; put(leafGeo(0.1, 0.035, { curl: -0.1, tipAt: 0.55 }), M.sky, n, V(X(L * k), 0.04, 0.035), V(X(0.35), -0.05, -1), up); }
  // sparks: forks of light caught in the pinions
  for (let i = 0; i < 3; i++) { const pts = []; let p = V(X(a3 * (0.3 + 0.3 * i)), 0.02, -0.1 - i * 0.05); for (let k = 0; k < 6; k++) { pts.push(p.clone()); p = p.clone().add(V(X(0.03 + 0.02 * vnoise(i, k, 3)), (vnoise(k, i, 5) - 0.5) * 0.06, -0.05 - 0.03 * vnoise(i, k, 8))); } add(rod(pts, 0.005, 'rim', 4), M.spark, wr); }
  return { sh, el, wr, side: s };
}
// the shepherd's cloak, caught on the Roc's talon: long feathers of its own, bound with pale woven bands and beads
function cloak(foot, M) {
  const C = node(foot, 0.0, -0.02, 0.1), band = surf('#b4ac9a', { rough: 0.85 }), dark = surf('#283050', { rough: 0.8 });
  for (let i = 0; i < 9; i++) {
    const k = i / 8 - 0.5, L = 0.5 - Math.abs(k) * 0.12, p = V(k * 0.16, 0, 0.02 * Math.cos(k * 3)), d = V(k * 0.35, -1, 0.15);
    put(leafGeo(+L.toFixed(3), 0.05, { curl: 0.08, tipAt: 0.72 }), i % 3 === 0 ? M.blue : i % 2 ? M.navy2 : M.navy, C, p, d, V(0, 0, 1));
    if (i % 2 === 0) { put(leafGeo(+(L * 0.75).toFixed(3), 0.018, { curl: 0.08, tipAt: 0.9, round: 0.05, thick: 0.3, kind: 'embroid' }), band, C, p.clone().add(V(0, -0.03, 0.012)), d, V(0, 0, 1)); for (let j = 0; j < 4; j++) add(sph(0.006, 6, 4), dark, C, p.x + d.x * (0.08 + j * 0.07) / 1.06, p.y - (0.06 + j * 0.07 * 0.94), p.z + 0.03); }
  }
  for (let j = 0; j < 3; j++) {
    const y = -0.04 - j * 0.07, pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10 - 0.5; pts.push(V(k * 0.24 * (1 + j * 0.25), y - Math.abs(k) * 0.03, 0.05 + 0.02 * Math.cos(k * 3))); }
    add(fitMaster(tube(pts, [0.022 - j * 0.003, 0.006], { n: 6, up: V(0, 1, 0) }), 'embroid'), j === 1 ? dark : band, C);
  }
  for (const k of [-0.32, -0.12, 0.1, 0.3]) { add(rod([V(k * 0.3, -0.17, 0.06), V(k * 0.32, -0.25, 0.07)], 0.002, 'braid', 4), band, C); add(sph(0.012, 8, 6), M.gold, C, k * 0.32, -0.26, 0.07); }
  const sp = []; let p = V(-0.08, -0.05, 0.1); for (let k = 0; k < 6; k++) { sp.push(p.clone()); p = p.clone().add(V(0.035, -0.04 + (vnoise(k, 2, 4) - 0.5) * 0.05, 0.01)); } add(rod(sp, 0.004, 'rim', 4), M.spark, C);
  return C;
}

/* ------------------------------------------------------------------ moves */
// a move's shape over u (0..1): alt, fwd, side (in the foe's heights), ground (0..1: down to the ground), pitch, roll,
// yaw (the whole body, about its middle), flap (beat size), rate (beats), beat (a set beat, not the running one), sweep
// (a moth's wings: back +, wrapped forward -), raise (a bird's wings up), fold, fly (a bird: 0 perched, 1 flying), legs
// (a moth's reaching down), talon (a bird's foot forward), head [x, y], curl, glow, dust, silk, swing (the bell), shake
const COMMON = { idle: 2.4, walk: 1.0, bite: 1.0, strike: 1.2, swipe: 1.1, cast: 1.4, roar: 1.6, hurt: 0.6, ko: 1.6, hover: 2.0, swoop: 1.6, dive: 1.8, land: 2.6 };
const OWN = {
  'lamp-moth': { batter: 1.0, dust: 1.3, circle: 1.8 },
  gloamwing: { 'wing-buffet': 1.2, dreamdust: 1.6, cocoon: 2.0, 'bell-hum': 1.8 },
  'thunder-roc': { talons: 1.3, 'wing-gale': 1.6, 'carry-off': 2.4, 'storm-mantle': 1.7 },
};
const plateau = (u, a, b) => (u < a ? smooth(u / a) : u < b ? 1 : 1 - smooth((u - b) / (1 - b)));
const MS = {
  idle: () => ({}),
  bite: u => { const r = rise(u, 0.45); return { fwd: 0.35 * r, pitch: 0.4 * r, head: [0.35 * r, 0], rate: 1 + 0.6 * r, talon: 0.7 * r, fly: 0.6 * r, alt: 0.08 * r }; },
  strike: u => { const r = rise(u, 0.5); return { fwd: 0.45 * r, pitch: 0.5 * r - 0.2 * env(u * 2), sweep: -0.4 * r, talon: r, fly: r, alt: 0.15 * r, rate: 1.4 }; },
  swipe: u => { const w = rise(u, 0.5); return { yaw: 0.7 * Math.sin(u * Math.PI * 1.5) * w, fwd: 0.2 * w, sweep: -0.5 * w, flap: 1 + 0.5 * w, fly: w, alt: 0.1 * w }; },
  cast: u => { const w = rise(u, 0.4); return { alt: 0.15 * w, head: [-0.3 * w, 0], flap: 1 + 0.3 * w, glow: 1 + 1.5 * w, dust: 1 + 3 * w, raise: 0.25 * w, pitch: -0.15 * w }; },
  roar: u => { const w = rise(u, 0.3); return { pitch: -0.35 * w, head: [-0.5 * w, 0], raise: 0.3 * w, flap: 1 + 0.6 * w, sweep: -0.25 * w, glow: 1 + w, rate: 1 + 0.5 * w }; },
  hurt: u => { const e = env(u); return { fwd: -0.15 * e, pitch: -0.4 * e, roll: 0.25 * e, flap: 1 + e, head: [0.4 * e, 0.3 * e], rate: 1 + e, alt: -0.05 * e }; },
  ko: u => { const s = smooth(u); return { ground: s, ko: s, pitch: 1.1 * s, roll: 0.35 * s, flap: 1 - s, sweep: -0.2 * s, rate: 1 - 0.7 * s, glow: 1 - 0.9 * s, legs: -s, raise: -0.9 * s, fold: 0.2 * s, head: [0.5 * s, 0.4 * s] }; },
  // flight
  hover: u => { const w = plateau(u, 0.25, 0.75); return { alt: 0.3 * w, flap: 1 + 0.25 * w, rate: 1 + 0.2 * w, fly: w, legs: -0.5 * w }; },
  swoop: u => { const e = env(u); return { fwd: 0.9 * e, ground: 0.65 * e, alt: 0.15 * e, pitch: 0.45 * Math.sin(Math.PI * 2 * u) + 0.15 * e, sweep: 0.6 * e, fold: 0.35 * e, flap: 1 - 0.6 * e, fly: plateau(u, 0.12, 0.88), talon: 0.4 * e }; },
  dive: u => { const up = u < 0.4 ? smooth(u / 0.4) : 1 - smooth((u - 0.4) / 0.2), down = u < 0.4 ? 0 : Math.sin(Math.PI * clamp01((u - 0.4) / 0.6)); return { alt: 0.7 * up, ground: 0.9 * down, fwd: 1.0 * down, pitch: -0.35 * up + 1.0 * down, sweep: 1.0 * down, fold: 0.85 * down, flap: 1 + 0.4 * up - 0.85 * down, rate: 1 + 0.3 * up, fly: plateau(u, 0.1, 0.9), talon: 0.6 * down }; },
  land: u => { const d = plateau(u, 0.3, 0.7); return { ground: d, legs: d, flap: 1 - 0.85 * d, rate: 1 - 0.5 * d, sweep: 1.0 * d, pitch: -0.3 * d }; },
  // the Lamp-Moth
  batter: u => { const r = rise(u, 0.45); return { fwd: 0.8 * r, alt: 0.05 * r, side: Math.sin(u * 55) * 0.05 * r, pitch: 0.5 * r, rate: 1.8, flap: 1.2, head: [0.3 * r, 0], legs: 0.5 * r }; },
  dust: u => { const w = rise(u, 0.35); return { alt: 0.12 * w, fwd: 0.2 * w, sweep: -0.6 * Math.max(0, Math.sin(u * Math.PI * 3)) * w, flap: 1.4, rate: 0.7, dust: 1 + 6 * w, glow: 1 + 0.6 * w }; },
  circle: u => { const a = Math.PI * 4 * smooth(u), r = 0.55 * env(u); return { fwd: r * (1 - Math.cos(a)) * 0.6, side: r * Math.sin(a), yaw: a, rate: 1.6, roll: -0.45 * env(u), glow: 1 + 1.2 * env(u), dust: 1 + 2 * env(u) }; },
  // the Gloamwing
  'wing-buffet': u => { const wind = u < 0.45 ? smooth(u / 0.45) : 1 - smooth((u - 0.45) / 0.08), slam = u > 0.45 ? Math.sin(Math.PI * clamp01((u - 0.45) / 0.5)) : 0; return { sweep: 1.1 * wind - 1.0 * slam, flap: 0.25, pitch: -0.3 * wind + 0.35 * slam, fwd: 0.4 * slam, alt: 0.12 * wind, dust: 1 + 2 * slam }; },
  dreamdust: u => { const w = rise(u, 0.3); return { alt: 0.18 * w, sweep: -0.1 * w, flap: 1 + 0.5 * w, rate: 0.6, dust: 1 + 9 * w, head: [-0.2 * w, 0], pitch: -0.15 * w, glow: 1 + 0.4 * w }; },
  cocoon: u => { const w = plateau(u, 0.3, 0.75); return { sweep: -1.45 * w, flap: 1 - 0.95 * w, curl: 0.8 * w, silk: 0.7 * w, alt: -0.08 * w, head: [0.4 * w, 0] }; },
  'bell-hum': u => { const w = rise(u, 0.3); return { sweep: -0.25 * w, flap: 1 + 0.2 * w, rate: 1 + 2 * w, pitch: -0.25 * w, head: [-0.3 * w, 0], swing: 0.3 * w, glow: 1 + 5 * w, alt: 0.1 * w, shake: w }; },
  // the Thunder-Roc
  talons: u => { const r = rise(u, 0.5); return { fly: r, alt: 0.25 * r, fwd: 0.55 * r, talon: smooth((u - 0.2) / 0.3) * (1 - smooth((u - 0.7) / 0.3)), pitch: -0.3 * r, flap: 1.2, rate: 1.3 }; },
  'wing-gale': u => { const w = plateau(u, 0.12, 0.85); return { fly: w, beat: Math.PI / 2 + u * Math.PI * 4, flap: 1.4, alt: 0.06 * w, pitch: -0.45 * w, glow: 1 + 0.6 * w, head: [-0.2 * w, 0] }; },
  'carry-off': u => {
    const up = u < 0.35 ? smooth(u / 0.35) : 1 - smooth((u - 0.35) / 0.2), drop = env(clamp01((u - 0.3) / 0.35)), lift = env(clamp01((u - 0.55) / 0.45));
    const fwd = u < 0.35 ? 0.2 * smooth(u / 0.35) : u < 0.6 ? lerp(0.2, 1.1, smooth((u - 0.35) / 0.25)) : 1.1 * (1 - smooth((u - 0.65) / 0.35));
    return { fly: plateau(u, 0.1, 0.9), alt: 0.9 * up + 0.5 * lift - 0.1 * drop, fwd, talon: drop, pitch: 0.6 * drop - 0.3 * lift, flap: 1 + 0.4 * lift, rate: 1 + 0.3 * lift };
  },
  'storm-mantle': u => { const w = rise(u, 0.35); return { raise: 0.35 * w, head: [-0.35 * w, 0], talon: 0.5 * w, glow: 1 + 5 * w, pitch: -0.2 * w }; },
};
// the Roc takes off to hover and to land (it stands on the crag; the moths are always in the air)
const BIRD = {
  hover: u => { const w = plateau(u, 0.25, 0.75); return { fly: w, alt: 0.45 * w, flap: 1.1, rate: 1.1 }; },
  land: u => { const up = env(u), down = smooth((u - 0.5) / 0.35) * (1 - smooth((u - 0.85) / 0.15)); return { fly: plateau(u, 0.15, 0.8), alt: 0.45 * up, fwd: 0.3 * up, flap: 1.2, talon: 0.7 * down, pitch: -0.3 * down }; },
};
const shapeOf = (key, m, u) => ((key === 'thunder-roc' && BIRD[m]) ? BIRD[m](u) : MS[m] ? MS[m](u) : {});

/* ------------------------------------------------------------------ build */
export function buildWinged(key, o = {}) {
  const keepQ = Q.d; Q.d = o.detail === 'light' ? 1 : 2;
  try {
    const group = new THREE.Group(), fly = node(group), inner = node(fly);
    const I = WINGED_INFO[key], H = I.h0;
    const R = key === 'thunder-roc' ? roc(inner) : moth(inner, key);
    const keep = new Set([group, fly, inner, R.body, R.head, R.neck, R.tail, ...R.abd || [], ...R.legs.flatMap(l => [l.femur, l.tib, l.hip, l.knee, l.foot]), ...R.wings.flatMap(w => [w.fore, w.hind, w.sh, w.el, w.wr]), ...Object.values(R.props)].filter(Boolean));
    bake(group, keep);
    const look = makeLook(key, group, fly, inner, R, I);
    // stand it on its height (Chris's sheets and the Bestiary's sizes), at rest, its lowest point on the ground
    look.pose('idle', 0, 0, 0); fly.position.set(0, 0, 0);
    group.updateMatrixWorld(true);
    const box = new THREE.Box3(); inner.traverseVisible(x => { if (x.isMesh) box.expandByObject(x); });
    const k = H / Math.max(0.05, box.max.y - box.min.y); inner.scale.setScalar(k); inner.position.y = -box.min.y * k;
    look.pose('idle', 0, 0, 0);
    let tris = 0, draws = 0; group.traverse(x => { if (x.isMesh) { draws++; const g = x.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    look.triangles = Math.round(tris); look.draws = draws;
    return look;
  } finally { Q.d = keepQ; }
}
function makeLook(key, group, fly, inner, R, I) {
  const D = { ...COMMON, ...(OWN[key] || {}) };
  const look = { group, g: group, plan: 'winged', key, height: I.height, act: { lunge: 0, fall: 0 }, hitAt: -9, t: 0, ph: 0, lt: null, moves: { MOVES: Object.entries(D), DUR: D }, duration: m => D[m] || 1.2, hit() { look.hitAt = look.t; },
    update(t, step = 0) { look.t = t; const L = look.act.lunge || 0, F = look.act.fall || 0, h = (t - look.hitAt) / 0.6; if (F > 0) return look.pose('ko', F, t, 0); if (h >= 0 && h < 1) return look.pose('hurt', h, t, 0); if (L > 0) return look.pose('bite', L, t, 0); return look.pose(step ? 'walk' : 'idle', 0, t, step); } };
  look.rig = R; look.parts = { head: R.head, body: R.body, wingL: R.wings[1]?.fore || R.wings[1]?.sh, wingR: R.wings[0]?.fore || R.wings[0]?.sh, ...R.props };
  look.pose = (move, u, t, step = 0) => { look.t = t; poseWinged(look, R, fly, I, shapeOf(key, move, u), t, step); };
  return look;
}
function poseWinged(L, R, fly, I, S, t, step) {
  const B = R.base, H = I.h0, dt = L.lt == null ? 0 : Math.max(0, Math.min(0.1, t - L.lt)); L.lt = t;
  const bird = R.kind === 'bird', walking = !!step;
  const rate = B.rate * (S.rate ?? 1) * (walking && !bird ? 1.35 : 1);
  L.ph += dt * rate * Math.PI * 2; const ph = S.beat ?? L.ph;
  const shake = (S.shake || 0) * Math.sin(t * 70) * 0.012;
  // where it is: hovering (or perched), moved by the move; down on the ground when it lands or falls
  const bob = bird ? 0 : Math.sin(ph) * 0.025 + Math.sin(t * 0.9) * 0.02;
  const hop = bird && walking ? Math.abs(Math.sin(step * 0.5)) * 0.06 : 0;
  const alt = lerp(B.A + (S.alt || 0) + bob, bird ? -0.12 : 0, S.ground || 0) + hop;
  fly.position.set((S.side || 0) * H + shake * H, alt * H, (S.fwd || 0) * H);
  fly.rotation.set(0, S.yaw || 0, 0);
  const pitch = B.pitch + (S.pitch || 0) + (walking && !bird ? 0.25 : 0) + (bird ? 0.5 * (S.fly || 0) * (1 - (S.ground || 0)) : 0);
  R.body.rotation.set(pitch, 0, (S.roll || 0) + shake * 4);
  R.body.position.y = R.bodyY;
  const hx = S.head?.[0] || 0, hy = (S.head?.[1] || 0) + Math.sin(t * 0.5) * 0.12;
  if (bird) { R.neck.rotation.set(-pitch * 0.5, hy * 0.5, 0); R.head.rotation.set(-pitch * 0.5 + hx, hy * 0.5, 0); }
  else R.head.rotation.set(-pitch * 0.8 + hx, hy, 0);
  if (!bird) {
    const amp = B.amp * (S.flap ?? 1), sweep = B.sweep + (S.sweep || 0);
    for (const w of R.wings) {
      const s = w.side, th = sweep + amp * Math.sin(ph), th2 = sweep * 0.92 + amp * 0.9 * Math.sin(ph - 0.4);
      w.fore.rotation.set(0, s * th, s * (0.02 + 0.2 * amp * Math.cos(ph)));
      w.hind.rotation.set(0, s * th2, s * (0.0 + 0.16 * amp * Math.cos(ph - 0.4)));
    }
    for (let i = 0; i < R.abd.length; i++) R.abd[i].rotation.set((S.curl || 0) * 0.35 + 0.04 * Math.sin(t * 1.3 + i) - (S.ko || 0) * 0.1, 0, 0);
    const lg = S.legs || 0;
    for (const l of R.legs) {
      const wig = Math.sin(t * 3 + l.i * 1.3 + l.side) * 0.06;
      l.femur.rotation.set(0.25 * (l.i - 1) - pitch * 0.6 * clamp01(lg) + wig, 0, l.side * (0.45 - 0.2 * lg));
      l.tib.rotation.set(lg < 0 ? 0.9 * -lg + 0.4 : 0.5 - 0.35 * lg, 0, -l.side * 0.35);
    }
    if (R.props.bell) { const P = R.props.bell; P.rotation.set(-pitch + 0.08 * Math.sin(t * 2.1) + (S.swing || 0) * Math.sin(t * 13), 0, -(S.roll || 0) + 0.05 * Math.sin(t * 1.7) + (S.swing || 0) * 0.5 * Math.cos(t * 11)); }
    R.silk.visible = (S.silk || 0) > 0.02; R.silk.material.opacity = S.silk || 0;
  } else {
    const f = clamp01(S.fly || 0), amp = S.flap ?? 1, fold = S.fold || 0;
    for (const w of R.wings) {
      const s = w.side;
      const rest = B.raise + (S.raise || 0) + 0.05 * Math.sin(t * 1.2 + s) - (walking ? 0.25 : 0);
      const rz = lerp(rest, (0.15 + 0.9 * Math.sin(ph)) * amp + (S.raise || 0) * 0.5, f) - fold * 0.6 * f;
      const tw = lerp(B.twist, -0.25 + 0.3 * Math.cos(ph), f);
      const flex = f * Math.max(0, Math.cos(ph)) * 0.4;
      w.sh.rotation.set(tw, s * (0.05 + fold * 0.9), s * rz);
      w.el.rotation.set(0, -s * (fold * 2.0 + flex * 0.6 + (1 - f) * 0.15), 0);
      w.wr.rotation.set(0, s * (fold * 2.2 + flex + (1 - f) * 0.1), 0);
    }
    R.tail.rotation.set(-0.15 * (S.fly || 0) + 0.04 * Math.sin(t * 1.1), 0, 0);
    const tal = S.talon || 0, tuck = f * (1 - tal) * (1 - (S.ground || 0));
    for (const l of R.legs) {
      const s = l.side, cloak = s > 0, sw = walking ? Math.sin(step + (s > 0 ? Math.PI : 0)) * 0.5 : 0;
      const standH = -pitch, standK = 0, liftH = -pitch - 1.25, liftK = 1.7;
      let hx = cloak ? liftH : standH + sw, kx = cloak ? liftK : standK + Math.max(0, -sw) * 0.8;
      hx = lerp(hx, 0.9, tuck); kx = lerp(kx, 1.2, tuck);
      hx = lerp(hx, -pitch - 1.2, tal); kx = lerp(kx, 0.35, tal);
      if (S.ko) { hx = lerp(hx, -pitch + 0.6, S.ko); kx = lerp(kx, 1.6, S.ko); }
      l.hip.rotation.set(hx, 0, s * 0.05); l.knee.rotation.set(kx, 0, 0);
      l.foot.rotation.set(-(hx + kx + pitch) * (cloak ? 1 : 0.85) + tal * 0.6, 0, 0);
    }
    if (R.props.cloak) R.props.cloak.rotation.set(-0.6 * tal, 0, 0);
  }
  // glows (the lamp, the bell, the sparks; the sparks flicker like lightning) and the wing-dust
  let gl = S.glow ?? 1; if (R.flicker) gl *= 0.55 + 0.45 * vnoise(Math.floor(t * 14), 1, 77) + 0.3 * Math.max(0, gl - 1);
  for (const m of R.glows) { const b = m.userData.base, g = m.userData.gain; m.emissiveIntensity = gl >= 1 ? b + g * (gl - 1) : b * gl; }
  for (const mi of R.mists) { mi.update(t); mi.pts.material.opacity = 0.35 * Math.min(4, S.dust ?? 1) * (1 - (S.ground || 0) * 0.7); }
}

/* ------------------------------------------------------------------ for the Fight */
export function wingedLook(key, sprite, opts = {}) { if (!WINGED_INFO[key]) return null; return buildWinged(key, { detail: opts.detail === 'high' ? 'high' : 'light' }); }
export const withWinged = fallback => (key, sprite, opts) => wingedLook(key, sprite, opts) || fallback(key, sprite, opts);
