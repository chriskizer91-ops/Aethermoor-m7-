// The stretch check (Chris, November 21: "when they move their arms they stretch themselves"). Every lane runs it on
// each foe before handing it in (docs/project/jobs/foes.md, "No stretching").
//
//   node kit/tools/stretch.mjs foes/<key> [--frames=48] [--no-pics] [--moves=path.js#name]
//
// It poses each of the foe's moves at many frames, skins the light model exactly as three.js does, and compares every
// triangle's edges with the rest pose. A move fails if any edge grows past 1.3 times (a part may set its own limit in
// foe.json: "stretch": { "limit": 1.3, "parts": { "tail": 1.45 } }, by bone name; say why in your slip). It also fails
// a move that scales a bone or slides one along its length (the root and the whole body may move).
//
// It writes foes/<key>/stretch.json (the results) and foes/<key>/build/stretch/<move>.png (the worst frame of each
// move from the front and side, stretched triangles in yellow to red, past the limit in magenta) to look at by eye.
// The worst edge is named by the two parts it joins ("chest > r_upper"): an edge between two parts that stretches is
// weight bleeding across, which is the fault Chris saw on the Rotwarden.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { decodeLight, buildSkinned, ready, resolveMove, COMMON, applyHelpers } from '../js/loader.js';

const KIT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const dir = path.resolve(args.find((a) => !a.startsWith('--')));
const key = path.basename(dir);
const FRAMES = +opt('frames', 48), PICS = !args.includes('--no-pics');
// --focus=x,y,z,r (sculpt coordinates, metres): draw the pictures close up round that place
const FOCUS = opt('focus') ? opt('focus').split(',').map(Number) : null;
// --parts: also draw build/stretch/parts.png, the rest pose with each point coloured by the bone that moves it most
const PARTS = args.includes('--parts');
const cfg = fs.existsSync(path.join(dir, 'foe.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'foe.json'))) : {};
const LIMIT = cfg.stretch?.limit ?? 1.3, PART_LIMIT = cfg.stretch?.parts ?? {};
const CREASE = cfg.stretch?.crease ?? 3.0, BIG_FRAC = cfg.stretch?.big ?? 0.01;

// --- the light model and its moves
await ready();
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'assets/light.json')));
const bin = new Uint8Array(fs.readFileSync(path.join(dir, 'assets/light.bin')));
const geo = decodeLight(meta, bin);
const { mesh, bones } = buildSkinned({ geo, mat: new THREE.MeshBasicMaterial(), meta });

async function loadMoves() {
  const imp = async (p) => import(pathToFileURL(path.resolve(KIT, p)).href);
  const spec = opt('moves', cfg.stretchMoves);
  if (spec) { const [p, name] = spec.split('#'); const m = await imp(p); return name ? m[name] : m; }
  // the walkers (session 8): each has its own moves in pages/walkers/foes.js
  if (fs.existsSync(path.join(KIT, 'pages/walkers/foes.js'))) {
    const { FOES } = await imp('pages/walkers/foes.js');
    if (FOES[key]) { const { movesFor } = await imp('pages/walkers/walker.js'); return { plan: 'biped', height: FOES[key].height, ...movesFor(FOES[key]) }; }
  }
  // the beasts (session 7): foe.json "moves" names a set in pages/beasts/kit/moves-<name>.js
  const roster = path.join(KIT, 'pages/beasts/roster.json');
  const beast = fs.existsSync(roster) && JSON.parse(fs.readFileSync(roster)).some((f) => f.key === key);
  if (beast && cfg.moves && fs.existsSync(path.join(KIT, `pages/beasts/kit/moves-${cfg.moves}.js`))) {
    const m = (await imp(`pages/beasts/kit/moves-${cfg.moves}.js`))[cfg.moves];
    return { MOVES: m.list, DUR: m.dur, LUNGE: m.lunge, pose: m.pose };
  }
  // a kit set named in foe.json "moves" (Briarmaw's bear, November 23), else the plan's
  if (cfg.moves && fs.existsSync(path.join(KIT, `kit/js/moves/${cfg.moves}.js`))) return imp(`kit/js/moves/${cfg.moves}.js`);
  return imp(`kit/js/moves/${cfg.plan || meta.plan || 'quad'}.js`);
}
const moves = await loadMoves();
const group = new THREE.Group(), body = new THREE.Group(); group.add(body); body.add(mesh);
for (const b of Object.values(bones)) b.userData.p0 = b.position.clone();
const F = { group, body, mesh, bones, key, plan: meta.plan || cfg.plan, height: meta.height || cfg.height || moves.height || 1.7,
  parts: { head: bones.head, tail: bones.tail, jaw: bones.jaw }, act: { lunge: 0, fall: 0 }, moves, helpers: meta.helpers || [] };
function reset() {
  for (const b of Object.values(bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); body.scale.set(1, 1, 1);
}

// --- the skin, as three.js does it
const n = meta.vertices, P0 = geo.attributes.position.array, IDX = geo.index.array, T = IDX.length / 3;
const SI = geo.attributes.skinIndex.array, SWr = geo.attributes.skinWeight.array, SW = new Float32Array(n * 4);
const names = meta.bones.map((b) => b.name), roots = new Set(meta.bones.filter((b) => !b.parent).map((b) => b.name));
const main = new Uint16Array(n);                          // each point's part: the bone with most weight
for (let i = 0; i < n; i++) {
  let s = 0, best = 0;
  for (let a = 0; a < 4; a++) { s += SWr[i * 4 + a]; if (SWr[i * 4 + a] > SWr[i * 4 + best]) best = a; }
  for (let a = 0; a < 4; a++) SW[i * 4 + a] = SWr[i * 4 + a] / (s || 1);
  main[i] = SI[i * 4 + best];
}
const skel = mesh.skeleton, Pp = new Float32Array(n * 3);
function skin() {
  group.updateMatrixWorld(true); skel.update();
  const M = skel.boneMatrices, bi = mesh.bindMatrixInverse.elements, bm = mesh.bindMatrix.elements;
  // the bind and bind-inverse matrices are folded into each bone's matrix once
  const K = new Float32Array(names.length * 12), m = new THREE.Matrix4(), A = new THREE.Matrix4(), B = new THREE.Matrix4();
  A.fromArray(bi); B.fromArray(bm);
  for (let j = 0; j < names.length; j++) {
    m.fromArray(M, j * 16).premultiply(A).multiply(B); const e = m.elements;
    K.set([e[0], e[4], e[8], e[12], e[1], e[5], e[9], e[13], e[2], e[6], e[10], e[14]], j * 12);
  }
  for (let i = 0; i < n; i++) {
    const x = P0[i * 3], y = P0[i * 3 + 1], z = P0[i * 3 + 2]; let X = 0, Y = 0, Z = 0;
    for (let a = 0; a < 4; a++) {
      const w = SW[i * 4 + a]; if (!w) continue; const k = SI[i * 4 + a] * 12;
      X += w * (K[k] * x + K[k + 1] * y + K[k + 2] * z + K[k + 3]);
      Y += w * (K[k + 4] * x + K[k + 5] * y + K[k + 6] * z + K[k + 7]);
      Z += w * (K[k + 8] * x + K[k + 9] * y + K[k + 10] * z + K[k + 11]);
    }
    Pp[i * 3] = X; Pp[i * 3 + 1] = Y; Pp[i * 3 + 2] = Z;
  }
}
const len = (Q, a, b) => Math.hypot(Q[a * 3] - Q[b * 3], Q[a * 3 + 1] - Q[b * 3 + 1], Q[a * 3 + 2] - Q[b * 3 + 2]);
const E0 = new Float32Array(T * 3);
const tiny = 1e-4 * F.height;                             // edges shorter than this are left out (they're noise)
const BIG = BIG_FRAC * F.height;                          // a big edge, at rest; shorter ones are crease edges
for (let t = 0; t < T; t++) for (let e = 0; e < 3; e++) E0[t * 3 + e] = len(P0, IDX[t * 3 + e], IDX[t * 3 + (e + 1) % 3]);
const limitOf = (a, b) => Math.max(PART_LIMIT[names[main[a]]] ?? LIMIT, PART_LIMIT[names[main[b]]] ?? LIMIT);
const over = new Float32Array(T);       // each triangle's worst edge growth over its limit (1 = at the limit)
function measure() {
  // the worst big edge and the worst crease edge, each against its own limit; each triangle's worst (ratio / limit)
  const W = { big: { r: 0, over: 0, bad: 0 }, crease: { r: 0, over: 0, bad: 0 } };
  for (let t = 0; t < T; t++) {
    let ot = 0;
    const seen = { big: false, crease: false };
    for (let e = 0; e < 3; e++) {
      const l0 = E0[t * 3 + e]; if (l0 < tiny) continue;
      const a = IDX[t * 3 + e], b = IDX[t * 3 + (e + 1) % 3], r = len(Pp, a, b) / l0;
      const cls = l0 >= BIG ? 'big' : 'crease', lim = cls === 'big' ? limitOf(a, b) : CREASE, o = r / lim;
      if (o > ot) ot = o;
      if (o > 1 && !seen[cls]) { W[cls].bad++; seen[cls] = true; }
      if (o > W[cls].over) {
        const pa = names[main[a]], pb = names[main[b]];
        // where (sculpt coordinates: x his right, y forward, z up), to find it in rig.py
        const at = [-(P0[a * 3] + P0[b * 3]) / 2, (P0[a * 3 + 2] + P0[b * 3 + 2]) / 2, (P0[a * 3 + 1] + P0[b * 3 + 1]) / 2].map((x) => +x.toFixed(3));
        W[cls] = { ...W[cls], r, over: o, part: pa === pb ? pa : [pa, pb].sort().join(' > '), limit: lim, where: at, rest: +l0.toFixed(4) };
      }
    }
    over[t] = ot;
  }
  return { ...W, over: Math.max(W.big.over, W.crease.over) };
}
// the bone rules: no bone grows, none slides along its length (roots may move)
function boneRules() {
  const out = [];
  for (const [nm, b] of Object.entries(bones)) {
    if (Math.abs(b.scale.x - 1) > 1e-4 || Math.abs(b.scale.y - 1) > 1e-4 || Math.abs(b.scale.z - 1) > 1e-4) out.push(`${nm} scaled`);
    if (!roots.has(nm) && b.position.distanceTo(b.userData.p0) > 1e-5) out.push(`${nm} moved`);
  }
  return out;
}

// --- each move at many frames (idle and walk over a few seconds of the clock and a full stride)
const list = [...new Set([...(moves.MOVES || []).map(([k]) => k), ...COMMON.map((m) => resolveMove(moves, m))])];
const report = { key, limit: LIMIT, parts: PART_LIMIT, frames: FRAMES, triangles: T, moves: {}, ok: true };
const outDir = path.join(dir, 'build/stretch');
if (PICS) fs.mkdirSync(outDir, { recursive: true });
for (const mv of list) {
  const dur = (moves.DUR || {})[mv] || 1, loop = mv === 'idle' || mv === 'walk';
  const W = { big: { over: 0 }, crease: { over: 0 } }; let worstOver = 0, worstP = null, worstO = null, rules = new Set(), badFrames = 0;
  for (let f = 0; f < FRAMES; f++) {
    const u = loop ? 0 : f / (FRAMES - 1), t = loop ? (f / FRAMES) * 4 : 1.3 + u * dur, step = mv === 'walk' ? (f / FRAMES) * Math.PI * 4 : 0;
    reset(); moves.pose(F, mv, u, t, step); applyHelpers(F);     // as the loader does
    for (const r of boneRules()) rules.add(r);
    skin(); const m = measure();
    if (m.over > 1) badFrames++;
    for (const c of ['big', 'crease']) if (m[c].over > W[c].over || W[c].r === undefined) W[c] = { ...m[c], u: +u.toFixed(3) };
    if (m.over > worstOver || !worstP) { worstOver = m.over; worstP = Pp.slice(); worstO = over.slice(); }
  }
  const ok = W.big.over <= 1 && W.crease.over <= 1 && rules.size === 0;
  report.ok &&= ok;
  const sum = (w) => ({ worst: +(w.r || 0).toFixed(3), limit: w.limit, part: w.part, where: w.where, restEdge: w.rest, u: w.u, trianglesOver: w.bad });
  report.moves[mv] = { ok, big: sum(W.big), crease: sum(W.crease), framesOver: `${badFrames}/${FRAMES}`, bones: [...rules] };
  if (PICS) writePng(path.join(outDir, `${mv}.png`), picture(worstP, worstO, `${key} ${mv}`));
}
if (PARTS) {
  reset(); skin();
  const pal = names.map((_, i) => [80 + (i * 97) % 170, 80 + (i * 57 + 40) % 170, 80 + (i * 141 + 90) % 170]);
  const tri = new Float32Array(T).fill(1), col = new Array(T);
  for (let t = 0; t < T; t++) col[t] = pal[main[IDX[t * 3]]];
  writePng(path.join(outDir, 'parts.png'), picture(Pp, tri, 'parts', col));
  console.log('  parts: ' + names.map((nm, i) => `${nm} rgb(${pal[i].join(',')})`).join(', '));
}
let worstMove = null;
const score = (v) => Math.max(v.big.worst / (v.big.limit || LIMIT), v.crease.worst / CREASE);
for (const [k, v] of Object.entries(report.moves)) if (!worstMove || score(v) > score(report.moves[worstMove])) worstMove = k;
report.worstMove = worstMove; report.bigEdge = +BIG.toFixed(4); report.crease = CREASE;
fs.writeFileSync(path.join(dir, 'stretch.json'), JSON.stringify(report, null, 1) + '\n');

console.log(`${key}: ${report.ok ? 'PASS' : 'FAIL'} (big edges, over ${(BIG * 1000).toFixed(0)} mm, under ${LIMIT}x${Object.keys(PART_LIMIT).length ? ' ' + JSON.stringify(PART_LIMIT) : ''}; crease edges under ${CREASE}x)`);
const line = (w) => `${w.worst.toFixed(2)}x${w.part ? ` in ${w.part} at ${JSON.stringify(w.where)} u=${w.u}` : ''}${w.trianglesOver ? ` (${w.trianglesOver} over)` : ''}`;
for (const [k, v] of Object.entries(report.moves))
  console.log(`  ${v.ok ? 'ok  ' : 'FAIL'} ${k.padEnd(16)} big ${line(v.big)} · crease ${line(v.crease)}${v.bones.length ? '  bones: ' + v.bones.join(', ') : ''}`);
console.log(`  worst move: ${worstMove}${PICS ? `; pictures in ${path.relative(process.cwd(), outDir)}/` : ''}`);
process.exitCode = report.ok ? 0 : 1;

// --- the worst frame, front and side, drawn in software (flat shaded, stretch in colour)
function picture(P, R, label, cols = null) {     // R: each triangle's growth over its limit
  const S = 360, Wd = S * 2, img = new Uint8Array(Wd * S * 3).fill(28), zb = new Float32Array(Wd * S).fill(-1e9);
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P0[i * 3 + a], P[i * 3 + a]); hi[a] = Math.max(hi[a], P0[i * 3 + a], P[i * 3 + a]); }
  let span = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 1.08, cy = (lo[1] + hi[1]) / 2, cx = 0, cz = 0;
  if (FOCUS) { span = FOCUS[3] * 2; cx = -FOCUS[0]; cy = FOCUS[2]; cz = FOCUS[1]; }     // sculpt -> three.js
  const colour = (o) => {                       // grey well under the limit, yellow to red nearing it, magenta past it
    if (o > 1) return [230, 40, 220];
    if (o < 0.85) return [190, 186, 178];
    const k = (o - 0.85) / 0.15; return [235, 220 - 180 * k, 60 - 40 * k];
  };
  // three.js frame: x left of the foe, y up, z forward (the foe faces +z). Front view looks down -z; side view down -x.
  for (const [ox, view] of [[0, 'front'], [S, 'side']]) {
    for (let t = 0; t < T; t++) {
      const v = [0, 1, 2].map((e) => IDX[t * 3 + e]);
      const pr = v.map((i) => {
        const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
        const sx = view === 'front' ? -x : z, sz = view === 'front' ? z : x;    // screen x, depth toward the viewer
        return [ox + S / 2 + (sx - (view === 'front' ? -cx : cz)) / span * S, S / 2 - (y - cy) / span * S, sz];
      });
      const ax = pr[1][0] - pr[0][0], ay = pr[1][1] - pr[0][1], bx = pr[2][0] - pr[0][0], by = pr[2][1] - pr[0][1];
      const area = ax * by - ay * bx; if (Math.abs(area) < 1e-9) continue;
      // light from the normal (works for either winding)
      const [p, q, r3] = v.map((i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]);
      const u1 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], u2 = [r3[0] - p[0], r3[1] - p[1], r3[2] - p[2]];
      const nn = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]];
      const nl = Math.hypot(...nn) || 1, L = view === 'front' ? [-0.3, 0.6, 0.75] : [0.75, 0.6, 0.3];
      const sh = 0.35 + 0.65 * Math.abs((nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]) / nl / Math.hypot(...L));
      const c = cols ? cols[t] : colour(R[t]);
      const x0 = Math.max(ox, Math.floor(Math.min(pr[0][0], pr[1][0], pr[2][0]))), x1 = Math.min(ox + S - 1, Math.ceil(Math.max(pr[0][0], pr[1][0], pr[2][0])));
      const y0 = Math.max(0, Math.floor(Math.min(pr[0][1], pr[1][1], pr[2][1]))), y1 = Math.min(S - 1, Math.ceil(Math.max(pr[0][1], pr[1][1], pr[2][1])));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const px = xx + 0.5 - pr[0][0], py = yy + 0.5 - pr[0][1];
        const s = (px * by - py * bx) / area, w = (ax * py - ay * px) / area;
        if (s < 0 || w < 0 || s + w > 1) continue;
        const d = pr[0][2] + s * (pr[1][2] - pr[0][2]) + w * (pr[2][2] - pr[0][2]), o = yy * Wd + xx;
        if (d <= zb[o]) continue; zb[o] = d;
        img[o * 3] = c[0] * sh; img[o * 3 + 1] = c[1] * sh; img[o * 3 + 2] = c[2] * sh;
      }
    }
  }
  return { w: Wd, h: S, data: img };
}
function writePng(file, { w, h, data }) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; Buffer.from(data.buffer, y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1); }
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(type), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
