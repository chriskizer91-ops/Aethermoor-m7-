// The modelling kit for the 3D heroes: smooth lofts and tubes, faceted blades, lathes, wedges, shaped plates, and the
// generated surface pictures (normal maps) that give leather its grain, cloth its weave, mail its rings, wood its grain
// and metal its scratches. Nothing here knows about the game; model.js does.
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PACK, FACES } from './textures/pack.js';
export { mergeGeometries, FACES };

// the detail level: 1 (Light, for phones) or 2 (High): every curve gets this many times the segments, every surface
// picture this many times the pixels, and model.js adds the small parts (stitches, rivets, straps, etching, prongs)
export const Q = { d: 1 };
const D = n => Math.max(3, Math.round(n * Q.d));

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = t => Math.max(0, Math.min(1, t));
export const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ geometry */
// loft(rings): a smooth skin through rings of points (every ring the same count), u round the ring, v along
export function loft(rings, { closed = true, capA = false, capB = false, flat = false } = {}) {
  const n = rings[0].length, m = rings.length, cols = closed ? n + 1 : n;
  const pos = [], uv = [], idx = [];
  const len = [0]; for (let i = 1; i < m; i++) { const a = centroid(rings[i - 1]), b = centroid(rings[i]); len.push(len[i - 1] + a.distanceTo(b)); }
  const L = len[m - 1] || 1;
  for (let i = 0; i < m; i++) for (let j = 0; j < cols; j++) { const p = rings[i][j % n]; pos.push(p.x, p.y, p.z); uv.push(j / n, len[i] / L); }
  for (let i = 0; i < m - 1; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
  const cap = (ring, flip) => { const c = centroid(ring), ci = pos.length / 3; pos.push(c.x, c.y, c.z); uv.push(0.5, flip ? 1 : 0); const s = ci + 1; for (let j = 0; j < n; j++) { const p = ring[j]; pos.push(p.x, p.y, p.z); uv.push(0.5 + 0.5 * Math.cos(j / n * TAU), 0.5 + 0.5 * Math.sin(j / n * TAU)); } for (let j = 0; j < n; j++) { const a = s + j, b = s + (j + 1) % n; if (flip) idx.push(ci, a, b); else idx.push(ci, b, a); } };
  // turn every side face outward (away from its ring's centre), whichever way round the rings were given (November 20:
  // tubes and the body were built inside out before, so the far inside wall was what showed)
  if (closed && m > 1 && n > 2) {
    // summed over every face, so a flat stretch (a brim, a rim) can't decide it alone
    const P = k => V(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); let sum = 0;
    for (let i = 0; i < m - 1; i++) { const ci = centroid(rings[i]); for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols; sum += P(c).sub(P(a)).cross(P(b).sub(P(a))).dot(P(a).sub(ci)); } }
    if (sum < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  }
  const capStart = idx.length;
  if (capA) cap(rings[0], false);
  if (capB) cap(rings[m - 1], true);
  // and each cap outward, away from the ring next to it
  if (m > 1) for (let k = capStart; k < idx.length; k += 3) {
    const P = q => V(pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]), A = P(idx[k]), fnrm = P(idx[k + 1]).sub(A).cross(P(idx[k + 2]).sub(A));
    const isA = capA && k < capStart + n * 3, away = isA ? centroid(rings[0]).sub(centroid(rings[1])) : centroid(rings[m - 1]).sub(centroid(rings[m - 2]));
    if (fnrm.dot(away) < 0) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  if (flat) { g = g.toNonIndexed(); }
  g.computeVertexNormals();
  return g;
}
export const centroid = ring => ring.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / ring.length);
// an ellipse ring about c, in the plane of axes a (x) and b (z)
export function ellipse(c, a, b, rx, rz, n = 16, shape = null) {
  const out = [];
  n = D(n);
  for (let j = 0; j < n; j++) { const t = j / n * TAU; let k = 1; if (shape) k = shape(t); out.push(c.clone().addScaledVector(a, Math.cos(t) * rx * k).addScaledVector(b, Math.sin(t) * rz * k)); }
  return out;
}
// tube(points, radius): a loft along a path. radius: number, [rx, rz], or a function (t) -> number | [rx, rz]
export function tube(points, radius, { n = 12, up = V(0, 0, 1), capA = true, capB = true, closed = false, shape = null, twist = 0 } = {}) {
  const P = closed ? points.concat([points[0]]) : points, m = P.length, rings = [];
  let prevN = null;
  for (let i = 0; i < m; i++) {
    const T = (i === 0 ? P[1].clone().sub(P[0]) : i === m - 1 ? P[m - 1].clone().sub(P[m - 2]) : P[i + 1].clone().sub(P[i - 1])).normalize();
    let N = prevN ? prevN.clone() : up.clone();
    N.addScaledVector(T, -N.dot(T));
    if (N.lengthSq() < 1e-8) N = Math.abs(T.y) < 0.9 ? V(0, 1, 0).addScaledVector(T, -T.y) : V(1, 0, 0).addScaledVector(T, -T.x);
    N.normalize(); prevN = N;
    const B = T.clone().cross(N).normalize();
    if (twist) { const a = twist * i / (m - 1), c = Math.cos(a), s = Math.sin(a); const N2 = N.clone().multiplyScalar(c).addScaledVector(B, s), B2 = B.clone().multiplyScalar(c).addScaledVector(N, -s); N.copy(N2); B.copy(B2); }
    const t = i / (m - 1), r = typeof radius === 'function' ? radius(t) : radius, rx = Array.isArray(r) ? r[0] : r, rz = Array.isArray(r) ? r[1] : r;
    rings.push(ellipse(P[i], N, B, rx, rz, n, shape ? a => shape(a, t) : null));
  }
  return loft(rings, { capA: capA && !closed, capB: capB && !closed });
}
export const curve = (pts, n = 24) => new THREE.CatmullRomCurve3(pts).getPoints(D(n));
// lathe(profile [[r, y], ...]) round the y axis; sx, sz squash it into an oval
export function lathe(profile, { n = 28, sx = 1, sz = 1, phi0 = 0, phiLen = TAU, offset = V() } = {}) {
  n = D(n);
  const rings = profile.map(([r, y]) => { const ring = []; const cnt = phiLen < TAU ? n + 1 : n; for (let j = 0; j < cnt; j++) { const a = phi0 + phiLen * j / (phiLen < TAU ? n : n); ring.push(V(offset.x + Math.sin(a) * r * sx, offset.y + y, offset.z + Math.cos(a) * r * sz)); } return ring; });
  return loft(rings, { closed: phiLen >= TAU });
}
// a flat outline pushed into a slab; thick(x, y) scales the thickness at each point (a wedge toward an edge)
export function wedge(outline, depth, thick = null, { bevel = 0, curveSegments = 8 } = {}) {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 2, curveSegments, steps: 1 });
  g.translate(0, 0, -depth / 2);
  if (thick) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * thick(p.getX(i), p.getY(i))); }
  g.computeVertexNormals();
  return g;
}
// a plate the shape of an outline, bulged by bulge(x, y) toward +z, with planar uvs over its bounding box (shields)
export function plate(outline, bulge, { rings = 14, seg = 64 } = {}) {
  rings = D(rings); seg = D(seg);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of outline) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  // the outline's distance from the centre in every direction (it must be star-shaped about the centre: shields are)
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const reach = a => { const d = [Math.cos(a), Math.sin(a)]; let best = 0; for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) { const [ax, ay] = outline[j], [bx, by] = outline[i]; const ex = bx - ax, ey = by - ay, den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-12) continue; const t = ((ax - cx) * ey - (ay - cy) * ex) / den, s2 = ((ax - cx) * d[1] - (ay - cy) * d[0]) / den; if (t > 0 && s2 >= 0 && s2 <= 1) best = Math.max(best, t); } return best; };
  const pos = [cx, cy, bulge(cx, cy)], uv = [(cx - x0) / (x1 - x0), (cy - y0) / (y1 - y0)], idx = [];
  const R = []; for (let j = 0; j < seg; j++) R.push(reach(j / seg * TAU));
  for (let i = 1; i <= rings; i++) for (let j = 0; j < seg; j++) { const a = j / seg * TAU, t = i / rings, x = cx + Math.cos(a) * R[j] * t, y = cy + Math.sin(a) * R[j] * t; pos.push(x, y, bulge(x, y)); uv.push((x - x0) / (x1 - x0), (y - y0) / (y1 - y0)); }
  const at = (i, j) => (i === 0 ? 0 : 1 + (i - 1) * seg + (j % seg));
  for (let j = 0; j < seg; j++) idx.push(0, at(1, j), at(1, j + 1));
  for (let i = 1; i < rings; i++) for (let j = 0; j < seg; j++) { const a = at(i, j), b = at(i, j + 1), c = at(i + 1, j), d = at(i + 1, j + 1); idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  g.userData.rim = R.map((r, j) => { const a = j / seg * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; return [x, y]; });
  return g;
}
// a blade: a flat diamond in section, with bevels to the edges and a fuller down the middle; w(u), t(u) half-width and
// half-thickness along it (u 0 at the guard, 1 at the point), off(u) bends its centre line (a curved knife)
export function blade(len, w, t, { fuller = 0.35, off = () => 0, rings = 16 } = {}) {
  rings = D(rings);
  const R = [];
  for (let i = 0; i <= rings; i++) {
    const u = i / rings, y = u * len, hw = Math.max(w(u), 1e-5), ht = Math.max(t(u), 1e-5), cx = off(u), f = fuller * (1 - smooth((u - 0.55) / 0.3));
    const pts2 = [[hw, 0], [hw * 0.62, ht * 0.62], [hw * 0.28, ht], [0, ht * (1 - f * 0.45)], [-hw * 0.28, ht], [-hw * 0.62, ht * 0.62], [-hw, 0], [-hw * 0.62, -ht * 0.62], [-hw * 0.28, -ht], [0, -ht * (1 - f * 0.45)], [hw * 0.28, -ht], [hw * 0.62, -ht * 0.62]];
    R.push(pts2.map(([x, z]) => V(cx + x, y, z)));
  }
  return loft(R, { flat: true, capA: true });
}

/* ------------------------------------------------------------------ surface pictures */
// value noise, and a height field turned into a normal map
function hashN(x, y, s) { let h = Math.imul(x * 374761393 + y * 668265263 + s * 2147483647, 1274126177); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s, P) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const w = (a) => ((a % P) + P) % P; const a = hashN(w(xi), w(yi), s), b = hashN(w(xi + 1), w(yi), s), c = hashN(w(xi), w(yi + 1), s), d = hashN(w(xi + 1), w(yi + 1), s); const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }
const fbm = (x, y, s, P, o = 4) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f, s + i, P * f); a *= 0.5; f *= 2; } return v; };
function normalMap(N, height, strength) {
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) H[y * N + x] = height(x, y);
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const l = H[y * N + (x + N - 1) % N], r = H[y * N + (x + 1) % N], u = H[((y + N - 1) % N) * N + x], dn = H[((y + 1) % N) * N + x];
    let nx = (l - r) * strength, ny = (dn - u) * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz);
    const i = (y * N + x) * 4; d[i] = (nx * k * 0.5 + 0.5) * 255; d[i + 1] = (ny * k * 0.5 + 0.5) * 255; d[i + 2] = (nz * k * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
const TEX = {};
export function surface(kind) {
  const N = 256 * Q.d, key = kind + N;
  if (TEX[key]) return TEX[key];
  const sx = 256 / N; // the patterns are drawn in 256-px units, at any resolution
  const H = {
    leather: (x, y) => { const v = fbm(x / 9, y / 9, 3, 256 / 9 | 0, 3); const cell = Math.abs(vnoise(x / 5, y / 5, 9, 256 / 5 | 0) - 0.5); return v * 0.6 + cell * 0.8; },
    cloth: (x, y) => { const a = Math.sin(x * Math.PI / 2) * 0.5 + 0.5, b = Math.sin(y * Math.PI / 2) * 0.5 + 0.5; return ((x >> 1) + (y >> 1)) % 2 ? a : b; },
    mail: (x, y) => { const s = 16, cy = Math.floor(y / s), ox = cy % 2 ? s / 2 : 0, cx = Math.floor((x + ox) / s); const px = (x + ox) - cx * s - s / 2, py = y - cy * s - s / 2; const r = Math.hypot(px, py * 1.15); return Math.max(0, 1 - Math.abs(r - 5.2) / 2.2) + (py > 0 ? 0.15 : 0); },
    wood: (x, y) => { const v = fbm(x / 64, y / 4, 5, 4, 3); return Math.sin((x / 6 + v * 7) * 1.0) * 0.5 + v * 0.6; },
    metal: (x, y) => { let v = fbm(x / 3, y / 60, 7, 85, 2) * 0.25; const s = hashN(Math.floor(x / 23), Math.floor(y / 31), 4); if (s > 0.86 && Math.abs(((x * 0.7 + y * 0.3) % 23) - 11) < 0.6) v += 0.5; return v; },
    hair: (x, y) => fbm(x / 1.5, y / 40, 11, 170, 3),
    skin: (x, y) => fbm(x / 6, y / 6, 13, 42, 2) * 0.4,
    stone: (x, y) => fbm(x / 20, y / 20, 17, 12, 5),
    scale: (x, y) => { const s = 16, cy = Math.floor(y / 12), ox = cy % 2 ? s / 2 : 0, cx = Math.floor((x + ox) / s); const px = (x + ox) - cx * s - s / 2, py = y - cy * 12; const r = Math.hypot(px, py * 0.9); return r < 9 ? (1 - r / 9) * (py / 12) : 0; },
  }[kind];
  const strength = { leather: 3, cloth: 1.6, mail: 5, wood: 2.2, metal: 2.4, hair: 3, skin: 1.2, stone: 3, scale: 6 }[kind];
  TEX[key] = normalMap(N, (x, y) => H(x * sx, y * sx), strength * (Q.d > 1 ? 0.75 : 1));
  return TEX[key];
}

/* ------------------------------------------------------------------ materials from the Forge's palettes */
export const sRGB = c => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const mixC = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const KIND = key => {
  const M = MAT[key]; if (!M) return 'cloth';
  if (M.emit) return 'glow'; if (M.gem || M.prism) return 'gem'; if (M.metal) return 'metal';
  const k = (M.of || key).toLowerCase();
  if (/glass/.test(k)) return 'glass';
  if (/stone|granite|sand|scree|brick|cinder|^ash$|char|husk/.test(k)) return 'stone';
  if (/robe|cloth|hood|cloak|gambeson|wool|rags|pants|tunic|paint|parchment|moss|seaweed|weed|leaf|feather/.test(k)) return 'cloth';
  if (/skin|flesh/.test(k)) return 'skin'; if (/hair|fur|grizzle/.test(k)) return 'hair';
  if (/leather|hide|boar/.test(k)) return 'leather'; if (/wood|bark|bogwood|rotwood/.test(k)) return 'wood';
  if (/bone|claw|pearl|granite|stone|rime/.test(k)) return 'bone';
  return 'cloth';
};

/* ------------------------------------------------------------------ Chris's texture pack (November 20) */
// Every item's surface comes from Chris's gear pictures (textures/pack.js, made by textures/make.py): a grey grain
// tinted by the item's own palette colour, so the colour is still the Forge's and the picture gives the detail. The
// grain is laid on by position, from three sides at once (triplanar), so it has the same size on a ring and on a robe
// and no seams; its light and dark also raise the surface a little (a bump worked out as it draws). TEXTURES.on turns
// the whole pack off (the generated surfaces come back), to compare.
export const TEXTURES = { on: true };
const GRAIN_BY_KEY = {
  steel: 'metal-steel', heat: 'metal-steel', iron: 'metal-iron', gold: 'metal-gold', bronze: 'metal-bronze', brass: 'metal-brass',
  silver: 'metal-silver', blackiron: 'metal-blackiron', verdigris: 'metal-bronze',
  leather: 'leather-smooth', leatherDark: 'leather-worn', leatherRed: 'leather-tooled', boarHide: 'hide-fur', wolfFur: 'hide-fur',
  wolfPale: 'hide-fur', grizzle: 'hide-fur', stagWhite: 'hide-fur', drake: 'hide-scaled', snout: 'leather-smooth',
  wool: 'cloth-wool', gambeson: 'cloth-gambeson', robe: 'cloth-linen', robeRed: 'cloth-velvet', robeBark: 'cloth-rough-sack',
  rags: 'cloth-rough-sack', clothWhite: 'cloth-linen', clothGrey: 'cloth-wool', clothBlue: 'cloth-canvas', clothTeal: 'cloth-canvas',
  cloakRed: 'cloth-wool', cloakGreen: 'cloth-wool', hoodGreen: 'cloth-felt', pants: 'cloth-canvas', parchment: 'cloth-linen',
  string: 'cloth-linen', dark: 'cloth-felt', moss: 'cloth-felt',
  wood: 'wood-oak', bogwood: 'wood-bogwood', bark: 'wood-bark', rotwood: 'wood-bogwood', bramble: 'wood-bark', thorn: 'horn-antler',
  bone: 'bone-ivory', claw: 'horn-antler', pearl: 'bone-ivory', rime: 'stone-granite', granite: 'stone-granite', flesh: 'skin-soft',
};
// how big one tile of each kind of picture is, in the hero's own units (a hero stands about 1.7 of them)
const TILE = { metal: 0.34, mail: 0.11, leather: 0.2, hide: 0.22, cloth: 0.16, wood: 0.3, stone: 0.32, bone: 0.26, horn: 0.26, skin: 0.3, hair: 0.22 };
// how much each kind's light and dark raises its surface, and how much it roughens a metal's shine
const BUMP = { metal: 0.6, mail: 1.3, leather: 1.2, hide: 1.6, cloth: 1.0, wood: 1.4, stone: 1.6, bone: 0.8, horn: 1.2, skin: 0.25, hair: 1.2 };
export function grainFor(key, kind, o = {}) {
  if (!TEXTURES.on) return null;
  if (o.tex !== undefined) return PACK[o.tex] ? o.tex : null;
  if (kind === 'glow' || kind === 'gem' || kind === 'glass') return null;
  if (kind === 'mail') return 'mail-riveted';
  if (kind === 'scale') return 'mail-scale';
  if (kind === 'skin') return 'skin-soft';
  if (kind === 'hair') return 'hair-strands';
  const of = String(MAT[key]?.of || key);
  const name = GRAIN_BY_KEY[key] || GRAIN_BY_KEY[of] || (() => {
    const k = (key + ' ' + of).toLowerCase();
    if (/void/.test(k)) return 'metal-voidiron'; if (/brass/.test(k)) return 'metal-brass'; if (/blackiron|scorch/.test(k)) return 'metal-blackiron';
    if (kind === 'metal') return /gold/.test(k) ? 'metal-gold' : /silver/.test(k) ? 'metal-silver' : /bronze|copper/.test(k) ? 'metal-bronze' : /iron/.test(k) ? 'metal-iron' : 'metal-steel';
    if (kind === 'leather') return /wyrm|scale|drake/.test(k) ? 'hide-scaled' : /hide|fur/.test(k) ? 'hide-fur' : 'leather-smooth';
    if (kind === 'wood') return /bark|dead/.test(k) ? 'wood-bark' : /bog|rot/.test(k) ? 'wood-bogwood' : 'wood-oak';
    if (kind === 'stone') return /sand/.test(k) ? 'stone-sandstone' : /obsid|char|cinder|ash|slag|husk/.test(k) ? 'stone-obsidian' : 'stone-granite';
    if (kind === 'bone') return /horn|antler|claw|thorn/.test(k) ? 'horn-antler' : 'bone-ivory';
    if (kind === 'cloth') return /velvet|indigo|royal/.test(k) ? 'cloth-velvet' : /saffron|silk|brocade/.test(k) ? 'cloth-brocade' : /robe|cloth|hood|cloak|gambeson|wool|rags|pants|tunic|parchment|string/.test(k) ? 'cloth-wool' : null;
    return null;
  })();
  return name && PACK[name] ? name : null;
}
const GRAIN_TEX = {};
function grainTexture(name) {
  if (GRAIN_TEX[name]) return GRAIN_TEX[name];
  const t = new THREE.TextureLoader().load(PACK[name].url);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return (GRAIN_TEX[name] = t);
}
const TRI_VERT = ['varying vec3 vTriP;\nvarying vec3 vTriN;\nvoid main() {', 'vTriP = position; vTriN = normal;\n#include <begin_vertex>'];
const TRI_FRAG_HEAD = `uniform sampler2D triMap; uniform float triScale; uniform float triGain; uniform float triBump; uniform float triRough;
varying vec3 vTriP; varying vec3 vTriN; float triH = 0.5; float triFade = 1.0;
vec3 triSample() {
  vec3 w = pow(abs(normalize(vTriN)), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-5);
  vec3 p = vTriP * triScale;
  // the bump fades out where one pixel on screen covers several of the picture's (far away it would only sparkle)
  vec3 fw = fwidth(p) * 512.0; triFade = clamp(1.5 - max(max(fw.x, fw.y), fw.z) * 0.5, 0.0, 1.0);
  return texture2D(triMap, p.zy).rgb * w.x + texture2D(triMap, p.xz).rgb * w.y + texture2D(triMap, vec2(-p.x, p.y)).rgb * w.z;
}
vec3 triPerturb(vec3 sp, vec3 n, vec2 dH, float fd) {
  vec3 sx = dFdx(sp), sy = dFdy(sp), r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
}
void main() {`;
function triplanar(m, name, kind, opt = {}) {
  const fam = name.split('-')[0], tile = opt.tile || TILE[kind === 'mail' || kind === 'scale' ? 'mail' : fam] || 0.25;
  const U = { triMap: { value: grainTexture(name) }, triScale: { value: 1 / tile }, triGain: { value: 0.9 / PACK[name].mean },
    triBump: { value: (opt.bump ?? BUMP[kind === 'mail' || kind === 'scale' ? 'mail' : fam] ?? 1) * 0.0012 * (Q.d > 1 ? 1 : 0.8) }, triRough: { value: opt.rough ?? (kind === 'metal' ? 0.6 : 0.25) } };
  m.userData.grain = name; m.userData.tri = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('void main() {', TRI_VERT[0]).replace('#include <begin_vertex>', TRI_VERT[1]);
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', TRI_FRAG_HEAD)
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 tt = triSample(); triH = tt.r; diffuseColor.rgb *= tt * triGain; }')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * mix(1.0, 1.5 - triH, triRough), 0.04, 1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = triPerturb(-vViewPosition, normal, vec2(dFdx(triH), dFdy(triH)) * triBump * triFade, faceDirection);');
  };
  m.customProgramCacheKey = () => 'aeth-tri';
  m.normalMap = null;
  return m;
}

// more grain pictures (the creatures' skins: prototypes/bestiary/skins/pack.js), and a material made straight from one:
// grainMaterial(colour, name, { tile, bump, rough, ...MeshStandardMaterial options }); name null gives a plain one
export function addGrains(more) { Object.assign(PACK, more); }
export function grainMaterial(color, name, o = {}) {
  const { tile, bump, rough, physical, ...rest } = o;
  const m = new (physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color, roughness: 0.8, ...rest });
  if (name && PACK[name] && TEXTURES.on) triplanar(m, name, rest.metalness > 0.5 ? 'metal' : 'beast', { tile, bump, rough });
  return m;
}
const cache = new Map();
const baseKey = key => (MAT[key] ? key : key && MAT[String(key).split(/[\^~]/)[0]] ? String(key).split(/[\^~]/)[0] : 'wool');
// mat(key, { as, rep, side }): as forces a surface (mail, scale); rep scales its picture
export function mat(key, o = {}) {
  key = baseKey(key);
  const kind = o.as || KIND(key), grain = grainFor(key, kind, o), id = `${key}|${kind}|${o.rep || 1}|${o.side ? 2 : 1}|${Q.d}|${grain}|${o.tint || ''}`;
  if (cache.has(id)) return cache.get(id);
  const M = MAT[key], p = M.pal, rep = o.rep || 1;
  const nm = (t, r) => { const c = t.clone(); c.repeat.set(r * rep, r * rep); c.needsUpdate = true; return c; };
  let m;
  switch (kind) {
    case 'glow': m = new THREE.MeshStandardMaterial({ color: sRGB(p[3]), emissive: sRGB(p[4]), emissiveIntensity: 1.5, roughness: 0.3 }); break;
    case 'gem': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.35)), roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, ior: 2.1, specularIntensity: 1, emissive: sRGB(p[2]), emissiveIntensity: 0.55, flatShading: true }); break;
    case 'metal': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.6)), metalness: 1, roughness: Math.max(0.18, 0.46 - (M.ks || 1) * 0.12), normalMap: nm(surface('metal'), 2), normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 1.4 }); break;
    case 'mail': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.45)), metalness: 1, roughness: 0.35, normalMap: nm(surface('mail'), 7), normalScale: new THREE.Vector2(1.2, 1.2), envMapIntensity: 1.3 }); break;
    case 'scale': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.45)), metalness: M.metal ? 1 : 0.2, roughness: 0.35, normalMap: nm(surface('scale'), 6), normalScale: new THREE.Vector2(1.3, 1.3) }); break;
    case 'leather': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[2], p[3], 0.75)), roughness: 0.62, normalMap: nm(surface('leather'), 3), normalScale: new THREE.Vector2(0.6, 0.6), clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.2, sheenColor: sRGB(p[4]) }); break;
    case 'wood': m = new THREE.MeshStandardMaterial({ color: sRGB(mixC(p[2], p[3], 0.8)), roughness: 0.7, normalMap: nm(surface('wood'), 1), normalScale: new THREE.Vector2(0.8, 0.8) }); break;
    case 'glass': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.5)), roughness: 0.05, metalness: 0, transmission: 0.6, thickness: 0.02, ior: 1.5, transparent: true, opacity: 0.85, emissive: sRGB(p[3]), emissiveIntensity: 0.25, clearcoat: 1 }); break;
    case 'stone': m = new THREE.MeshStandardMaterial({ color: sRGB(mixC(p[2], p[3], 0.7)), roughness: 0.92, normalMap: nm(surface('stone'), 2), normalScale: new THREE.Vector2(1.2, 1.2) }); break;
    case 'bone': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.4)), roughness: 0.45, clearcoat: 0.3, normalMap: nm(surface('stone'), 2), normalScale: new THREE.Vector2(0.3, 0.3) }); break;
    case 'skin': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.35)), roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: sRGB(mixC(p[4], [255, 120, 90], 0.3)), normalMap: nm(surface('skin'), 4), normalScale: new THREE.Vector2(0.25, 0.25) }); break;
    case 'hair': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[2], p[3], 0.8)), roughness: 0.42, sheen: 0.8, sheenRoughness: 0.35, sheenColor: sRGB(p[5]), normalMap: nm(surface('hair'), 1), normalScale: new THREE.Vector2(0.9, 0.9) }); break;
    default: m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.3)), roughness: 0.85, sheen: 0.6, sheenRoughness: 0.6, sheenColor: sRGB(p[5]), normalMap: nm(surface('cloth'), 10), normalScale: new THREE.Vector2(0.45, 0.45) });
  }
  // a tempered metal glows from +7 and burns white at +10
  if (M.temper >= 7) { m.emissive = sRGB(p[3]); m.emissiveIntensity = M.temper >= 10 ? 0.9 : 0.3 + (M.temper - 7) * 0.12; }
  if (o.tint) m.color = sRGB(o.tint);
  if (grain) triplanar(m, grain, kind);
  if (o.side) m.side = THREE.DoubleSide;
  cache.set(id, m);
  return m;
}
export const glowColor = key => sRGB((MAT[baseKey(key)] || MAT.ember).pal[4]);
export const isEmit = key => !!MAT[baseKey(key)]?.emit;

/* ------------------------------------------------------------------ segment-scaled primitives */
export const sph = (r, w = 16, h = 12, ...a) => new THREE.SphereGeometry(r, D(w), D(h), ...a);
export const tor = (R, r, rs = 8, ts = 24, ...a) => new THREE.TorusGeometry(R, r, D(rs), D(ts), ...a);
export const cone = (r, h, s = 8, ...a) => new THREE.ConeGeometry(r, h, D(s), ...a);
export const cylg = (r0, r1, h, s = 12, ...a) => new THREE.CylinderGeometry(r0, r1, h, D(s), ...a);
export const ico = (r, n = 1) => new THREE.IcosahedronGeometry(r, n + (Q.d > 1 ? 1 : 0));

/* ------------------------------------------------------------------ joining the pieces */
// bake(root, keep): every mesh is joined, by material, into the nearest node of `keep` above it (the nodes that move
// on their own: the chest, the head, each arm's joints, the weapon...). A hero of 200 pieces is drawn in about 30.
export function bake(root, keep) {
  const jobs = new Map(); // keep node -> material -> [geometry in that node's space]
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4(), m = new THREE.Matrix4();
  const owner = o => { let p = o.parent; while (p && !keep.has(p)) p = p.parent; return p; };
  const meshes = []; root.traverse(o => { if (o.isMesh && !o.userData.keep) meshes.push(o); });
  for (const o of meshes) {
    const k = owner(o); if (!k) continue;
    inv.copy(k.matrixWorld).invert(); m.multiplyMatrices(inv, o.matrixWorld);
    let g = o.geometry.clone(); g.applyMatrix4(m);
    const keepC = o.material.vertexColors;
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', ...(keepC ? ['color'] : [])].includes(name)) g.deleteAttribute(name);
    if (keepC && !g.attributes.color) g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    if (!jobs.has(k)) jobs.set(k, new Map());
    const byMat = jobs.get(k); if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g);
    o.parent.remove(o); o.geometry.dispose();
  }
  let made = 0;
  for (const [k, byMat] of jobs) for (const [mt, list] of byMat) {
    const any = list.some(g => !g.index), all = any ? list.map(g => (g.index ? g.toNonIndexed() : g)) : list;
    const merged = mergeGeometries(all, false); if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mt); mesh.castShadow = mesh.receiveShadow = true; k.add(mesh); made++;
  }
  // empty groups left behind (gem settings, shields' inner groups) are harmless; drop the ones with nothing at all
  const empty = []; root.traverse(o => { if (o.type === 'Group' && !keep.has(o) && o.children.length === 0) empty.push(o); });
  for (const o of empty) o.parent?.remove(o);
  return made;
}

/* ------------------------------------------------------------------ etched runes on a blade (High) */
let ETCH = null;
export function etchMaterial() {
  if (ETCH) return ETCH;
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 512); g.strokeStyle = 'rgba(40,26,10,.85)'; g.lineWidth = 5; g.lineCap = 'round';
  let r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let y = 30; y < 490; y += 46) { g.beginPath(); const x = 64; g.moveTo(x, y); for (let k = 0; k < 3; k++) g.lineTo(28 + rnd() * 72, y + rnd() * 34); g.stroke(); g.beginPath(); g.arc(x + (rnd() - 0.5) * 30, y + 18, 6 + rnd() * 6, 0, Math.PI * (1 + rnd())); g.stroke(); }
  g.lineWidth = 3; g.strokeRect(14, 12, 100, 488);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  ETCH = new THREE.MeshStandardMaterial({ map: t, transparent: true, metalness: 0.6, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
  return ETCH;
}
// short stitches along a path (High): little dashes of thread, every `step` metres
export function stitchGeo(pts, step, r) {
  const geos = [], c = new THREE.CatmullRomCurve3(pts), L = c.getLength(), n = Math.floor(L / step);
  for (let i = 0; i < n; i++) { const a = c.getPointAt(i / n), b = c.getPointAt(Math.min(1, (i + 0.55) / n)); const g = new THREE.CapsuleGeometry(r, Math.max(1e-4, a.distanceTo(b) - r * 2), 2, 4); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.applyQuaternion(q); const mid = a.clone().lerp(b, 0.5); g.translate(mid.x, mid.y, mid.z); geos.push(g); }
  return geos.length ? mergeGeometries(geos.map(g => { g.deleteAttribute('uv'); return g; })) : null;
}

/* ------------------------------------------------------------------ placing parts */
export function add(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
export function gem(key, r, parent, x, y, z, setting = 'gold', facing = V(0, 0, 1)) {
  if (!key) return null;
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  g.quaternion.setFromUnitVectors(V(0, 0, 1), facing.clone().normalize());
  add(new THREE.OctahedronGeometry(r, 1), mat(key), g).scale.set(1, 1, 0.6);
  if (setting && Q.d > 1) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; const pr = add(cone(r * 0.16, r * 0.7, 5), mat(setting), g, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.25); pr.rotation.set(0, 0, a - Math.PI / 2); pr.rotateX(-0.6); }
  if (setting) { add(ring(r * 1.05, r * 0.18, 18), mat(setting), g); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(sph(r * 0.14, 6, 4), mat(setting), g, Math.cos(a) * r * 1.28, Math.sin(a) * r * 1.28, 0); } }
  return g;
}
export const rngOf = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
export const ring = (R, r, n = 32) => tor(R, r, 8, n);
