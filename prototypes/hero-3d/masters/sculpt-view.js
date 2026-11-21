// The sculpt itself, to look at (November 21): the hero's real pieces, each fitted to its kind's master (kit.js fitMaster),
// cut into fine triangles and raised by the master's height (masters/sculpt.py), the shape the bake in the game comes from.
//   sculptify(group, budget = 900000) -> { triangles, pieces }: changes the hero's meshes in place (Gear Room only; the
//     game never does this: it uses the bake)
import * as THREE from 'three';
import { HEIGHTS } from './heights.js';
import { KINDS, COLS, ROWS } from './pack.js';

let H = null;
const SCULPTED = new Set();
// back to the bake: the materials' baked master on again (call when the sculpt is taken away)
export function unsculpt() { for (const m of SCULPTED) m.userData.tri.triMK.value = 1; SCULPTED.clear(); } // the heights: { data (0..1), size }
export function loadHeights() {
  if (H) return Promise.resolve(H);
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, img.width, img.height).data, data = new Float32Array(img.width * img.height);
      for (let i = 0; i < data.length; i++) data[i] = px[i * 4] / 255;
      ok(H = { data, w: img.width, h: img.height });
    };
    img.onerror = fail; img.src = HEIGHTS;
  });
}
const BY_CELL = {}; for (const [k, v] of Object.entries(KINDS)) BY_CELL[v.cell] = { kind: k, ...v };
// the height (hero units) at atlas coordinates mu (0..1 each)
function heightAt(mu, mv) {
  const n = H.w, m = H.h, x = mu * n - 0.5, y = mv * m - 0.5, x0 = Math.max(0, Math.min(n - 2, Math.floor(x))), y0 = Math.max(0, Math.min(m - 2, Math.floor(y))), fx = Math.min(1, Math.max(0, x - x0)), fy = Math.min(1, Math.max(0, y - y0));
  const d = H.data, a = d[y0 * n + x0], b = d[y0 * n + x0 + 1], c = d[(y0 + 1) * n + x0], e = d[(y0 + 1) * n + x0 + 1];
  const h = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
  const K = BY_CELL[Math.floor(mu * COLS) + COLS * Math.floor(mv * ROWS)];
  return K ? K.lo + h * (K.hi - K.lo) : 0;
}

export function sculptify(group, budget = 900000) {
  const meshes = []; let area = 0, other = 0;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  group.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || !o.geometry.attributes.mUv) return;
    const g = o.geometry, uv = g.attributes.mUv, p = g.attributes.position, ix = g.index, n = ix ? ix.count : p.count;
    let a = 0, fitted = 0;
    for (let i = 0; i < n; i += 3) {
      const i0 = ix ? ix.getX(i) : i, i1 = ix ? ix.getX(i + 1) : i + 1, i2 = ix ? ix.getX(i + 2) : i + 2;
      if (uv.getX(i0) > 1.5 && uv.getX(i1) > 1.5 && uv.getX(i2) > 1.5) { fitted++; a += _b.fromBufferAttribute(p, i1).sub(_a.fromBufferAttribute(p, i0)).cross(_c.fromBufferAttribute(p, i2).sub(_a)).length() / 2; }
    }
    if (fitted) { meshes.push({ o, a, fitted }); area += a; }
    other += n / 3 - fitted;
  });
  let tris = other;
  for (const M of meshes) {
    const g = M.o.geometry, share = Math.max(0, budget - other) * M.a / area, s = Math.max(1, Math.min(48, Math.round(Math.sqrt(share / M.fitted))));
    const P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.mUv, ix = g.index, n = ix ? ix.count : P.count;
    const pos = [], uvs = [], uv0 = [], idx = [], weld = new Map(), T = g.attributes.uv; // T: the piece's own uv (a painted face needs it)
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), q = new THREE.Vector3(), m = new THREE.Vector3();
    const newV = (x, y, z, uu, vv, tu = 0, tv = 0) => { pos.push(x, y, z); uvs.push(uu, vv); uv0.push(tu, tv); return pos.length / 3 - 1; };
    for (let i = 0; i < n; i += 3) {
      const i0 = ix ? ix.getX(i) : i, i1 = ix ? ix.getX(i + 1) : i + 1, i2 = ix ? ix.getX(i + 2) : i + 2;
      const fit = U.getX(i0) > 1.5 && U.getX(i1) > 1.5 && U.getX(i2) > 1.5;
      if (!fit) { for (const k of [i0, i1, i2]) idx.push(newV(P.getX(k), P.getY(k), P.getZ(k), U.getX(k), U.getY(k), T ? T.getX(k) : 0, T ? T.getY(k) : 0)); continue; }
      p0.fromBufferAttribute(P, i0); p1.fromBufferAttribute(P, i1); p2.fromBufferAttribute(P, i2);
      n0.fromBufferAttribute(Nn, i0); n1.fromBufferAttribute(Nn, i1); n2.fromBufferAttribute(Nn, i2);
      const u0 = [U.getX(i0), U.getY(i0)], u1 = [U.getX(i1), U.getY(i1)], u2 = [U.getX(i2), U.getY(i2)];
      const t0 = T ? [T.getX(i0), T.getY(i0)] : [0, 0], t1 = T ? [T.getX(i1), T.getY(i1)] : [0, 0], t2 = T ? [T.getX(i2), T.getY(i2)] : [0, 0];
      // a grid of s x s across the triangle; each point raised along its normal by the master's height; the points on the
      // triangle's edges are shared with the next triangle (welded by place), so the surface stays closed and smooth
      const vert = (a, b) => { const c = s - a - b, wa = a / s, wb = b / s, wc = c / s;
        q.set(0, 0, 0).addScaledVector(p1, wa).addScaledVector(p2, wb).addScaledVector(p0, wc);
        m.set(0, 0, 0).addScaledVector(n1, wa).addScaledVector(n2, wb).addScaledVector(n0, wc).normalize();
        const uu = u1[0] * wa + u2[0] * wb + u0[0] * wc, vv = u1[1] * wa + u2[1] * wb + u0[1] * wc;
        const edge = a === 0 || b === 0 || c === 0;
        const key = edge ? `${Math.round(q.x * 1e5)},${Math.round(q.y * 1e5)},${Math.round(q.z * 1e5)}` : null;
        if (key && weld.has(key)) return weld.get(key);
        q.addScaledVector(m, heightAt(uu - 2, vv));
        const id = newV(q.x, q.y, q.z, uu, vv, t1[0] * wa + t2[0] * wb + t0[0] * wc, t1[1] * wa + t2[1] * wb + t0[1] * wc); if (key) weld.set(key, id); return id; };
      const row = []; for (let a = 0; a <= s; a++) { row.push([]); for (let b = 0; b <= s - a; b++) row[a].push(vert(a, b)); }
      for (let a = 0; a < s; a++) for (let b = 0; b < s - a; b++) {
        idx.push(row[a][b], row[a + 1][b], row[a][b + 1]);
        if (b < s - a - 1) idx.push(row[a + 1][b], row[a + 1][b + 1], row[a][b + 1]);
      }
      tris += s * s;
    }
    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    ng.setAttribute('mUv', new THREE.Float32BufferAttribute(uvs, 2));
    ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv0, 2));
    ng.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    ng.computeVertexNormals(); // the raised shape's own normals: the folds are in the geometry now
    // the baked master would bend the light a second time: off for these materials while the sculpt shows
    const mats = Array.isArray(M.o.material) ? M.o.material : [M.o.material];
    for (const mt of mats) if (mt.userData.tri?.triMK) { mt.userData.tri.triMK.value = 0; SCULPTED.add(mt); }
    g.dispose(); M.o.geometry = ng;
  }
  return { triangles: Math.round(tris), pieces: meshes.length };
}
