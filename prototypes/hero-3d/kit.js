// The modelling kit for the 3D heroes: smooth lofts and tubes, faceted blades, lathes, wedges, shaped plates, and the
// generated surface pictures (normal maps) that give leather its grain, cloth its weave, mail its rings, wood its grain
// and metal its scratches. Nothing here knows about the game; model.js does.
import * as THREE from 'three';
import { MAT } from '../../game/src/art/forge.js';

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
  if (capA) cap(rings[0], false);
  if (capB) cap(rings[m - 1], true);
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
export const curve = (pts, n = 24) => new THREE.CatmullRomCurve3(pts).getPoints(n);
// lathe(profile [[r, y], ...]) round the y axis; sx, sz squash it into an oval
export function lathe(profile, { n = 28, sx = 1, sz = 1, phi0 = 0, phiLen = TAU, offset = V() } = {}) {
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
  if (TEX[kind]) return TEX[kind];
  const N = 256;
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
  TEX[kind] = normalMap(N, H, strength);
  return TEX[kind];
}

/* ------------------------------------------------------------------ materials from the Forge's palettes */
export const sRGB = c => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const mixC = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const KIND = key => {
  const M = MAT[key]; if (!M) return 'cloth';
  if (M.emit) return 'glow'; if (M.gem || M.prism) return 'gem'; if (M.metal) return 'metal';
  const k = (M.of || key).toLowerCase();
  if (/robe|cloth|hood|cloak|gambeson|wool|rags|pants|tunic|paint|parchment|moss|seaweed/.test(k)) return 'cloth';
  if (/skin|flesh/.test(k)) return 'skin'; if (/hair|fur|grizzle/.test(k)) return 'hair';
  if (/leather|hide|boar/.test(k)) return 'leather'; if (/wood|bark|bogwood|rotwood/.test(k)) return 'wood';
  if (/bone|claw|pearl|granite|stone|rime/.test(k)) return 'bone';
  return 'cloth';
};
const cache = new Map();
const baseKey = key => (MAT[key] ? key : key && MAT[String(key).split(/[\^~]/)[0]] ? String(key).split(/[\^~]/)[0] : 'wool');
// mat(key, { as, rep, side }): as forces a surface (mail, scale); rep scales its picture
export function mat(key, o = {}) {
  key = baseKey(key);
  const kind = o.as || KIND(key), id = `${key}|${kind}|${o.rep || 1}|${o.side ? 2 : 1}`;
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
    case 'bone': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.4)), roughness: 0.45, clearcoat: 0.3, normalMap: nm(surface('stone'), 2), normalScale: new THREE.Vector2(0.3, 0.3) }); break;
    case 'skin': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.35)), roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: sRGB(mixC(p[4], [255, 120, 90], 0.3)), normalMap: nm(surface('skin'), 4), normalScale: new THREE.Vector2(0.25, 0.25) }); break;
    case 'hair': m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[2], p[3], 0.8)), roughness: 0.42, sheen: 0.8, sheenRoughness: 0.35, sheenColor: sRGB(p[5]), normalMap: nm(surface('hair'), 1), normalScale: new THREE.Vector2(0.9, 0.9) }); break;
    default: m = new THREE.MeshPhysicalMaterial({ color: sRGB(mixC(p[3], p[4], 0.3)), roughness: 0.85, sheen: 0.6, sheenRoughness: 0.6, sheenColor: sRGB(p[5]), normalMap: nm(surface('cloth'), 10), normalScale: new THREE.Vector2(0.45, 0.45) });
  }
  // a tempered metal glows from +7 and burns white at +10
  if (M.temper >= 7) { m.emissive = sRGB(p[3]); m.emissiveIntensity = M.temper >= 10 ? 0.9 : 0.3 + (M.temper - 7) * 0.12; }
  if (o.side) m.side = THREE.DoubleSide;
  cache.set(id, m);
  return m;
}
export const glowColor = key => sRGB((MAT[baseKey(key)] || MAT.ember).pal[4]);
export const isEmit = key => !!MAT[baseKey(key)]?.emit;
