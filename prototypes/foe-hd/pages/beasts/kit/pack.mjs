// Copied from session 6 (prototypes/foe-hd/tools/pack.mjs) for the beasts until the shared kit lands.
// Packs the light version (from bake.py's low.json/low.bin) and the sculpt (from export_sculpt.py) for the page:
// quantized and compressed with meshoptimizer, so the page can decode them in a few milliseconds.
//   node tools/pack.mjs BAKE_DIR SCULPT_PREFIX ASSETS_DIR
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { MeshoptEncoder } from 'meshoptimizer';
await MeshoptEncoder.ready;
const [bakeDir, sculptPre, out] = process.argv.slice(2);
await mkdir(out, { recursive: true });

// ---- the light version ----
const meta = JSON.parse(await readFile(`${bakeDir}/low.json`, 'utf8'));
const bin = await readFile(`${bakeDir}/low.bin`);
const arr = (k) => { const L = meta.layout[k]; const T = L.type === 'uint32' ? Uint32Array : Float32Array;
  return new T(bin.buffer.slice(bin.byteOffset + L.offset, bin.byteOffset + L.offset + L.count * L.size * 4)); };
const P = arr('position'), N = arr('normal'), Tn = arr('tangent'), UV = arr('uv'), J = arr('skinIndex'), W = arr('skinWeight'), I = arr('index');
const n = meta.layout.position.count;
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P[i * 3 + a]); hi[a] = Math.max(hi[a], P[i * 3 + a]); }
const STRIDE = 28, vb = new ArrayBuffer(n * STRIDE), dv = new DataView(vb);
const s8 = (x) => Math.max(-127, Math.min(127, Math.round(x * 127)));
for (let i = 0; i < n; i++) {
  const o = i * STRIDE;
  for (let a = 0; a < 3; a++) dv.setUint16(o + a * 2, Math.round((P[i * 3 + a] - lo[a]) / (hi[a] - lo[a]) * 65535), true);
  for (let a = 0; a < 3; a++) dv.setInt8(o + 8 + a, s8(N[i * 3 + a]));
  for (let a = 0; a < 4; a++) dv.setInt8(o + 12 + a, s8(Tn[i * 4 + a]));
  for (let a = 0; a < 2; a++) dv.setUint16(o + 16 + a * 2, Math.round(Math.min(1, Math.max(0, UV[i * 2 + a])) * 65535), true);
  // weights to bytes, the biggest takes the rounding so they still sum to 255
  const w = [0, 1, 2, 3].map((a) => Math.round(W[i * 4 + a] * 255)); w[0] += 255 - (w[0] + w[1] + w[2] + w[3]);
  for (let a = 0; a < 4; a++) { dv.setUint8(o + 20 + a, J[i * 4 + a]); dv.setUint8(o + 24 + a, Math.max(0, w[a])); }
}
const idx = new Uint32Array(I);
const encV = MeshoptEncoder.encodeVertexBuffer(new Uint8Array(vb), n, STRIDE);
const encI = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(idx.buffer), idx.length, 4);
await writeFile(`${out}/light.bin`, Buffer.concat([Buffer.from(encV), Buffer.from(encI)]));
await writeFile(`${out}/light.json`, JSON.stringify({ vertices: n, indices: idx.length, stride: STRIDE, lo, hi, vbytes: encV.length, ibytes: encI.length,
  bones: meta.bones, triangles: meta.triangles, sculptTriangles: meta.sculptTriangles }));
console.log(`light: ${meta.triangles} triangles, ${n} vertices -> ${((encV.length + encI.length) / 1024).toFixed(0)} KB`);

// ---- the sculpt ----
if (sculptPre) {
  const sm = JSON.parse(await readFile(`${sculptPre}.json`, 'utf8'));
  const sb = await readFile(`${sculptPre}.bin`);
  const nv = sm.vertices, nt = sm.triangles;
  const pos = new Uint8Array(sb.buffer, sb.byteOffset, nv * 8), col = new Uint8Array(sb.buffer, sb.byteOffset + nv * 8, nv * 4);
  const ind = new Uint32Array(sb.buffer.slice(sb.byteOffset + nv * 12, sb.byteOffset + nv * 12 + nt * 12));
  const v12 = new Uint8Array(nv * 12);
  for (let i = 0; i < nv; i++) { v12.set(pos.subarray(i * 8, i * 8 + 8), i * 12); v12.set(col.subarray(i * 4, i * 4 + 4), i * 12 + 8); }
  const eV = MeshoptEncoder.encodeVertexBuffer(v12, nv, 12);
  const eI = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(ind.buffer), ind.length, 4);
  await writeFile(`${out}/sculpt.bin`, Buffer.concat([Buffer.from(eV), Buffer.from(eI)]));
  await writeFile(`${out}/sculpt.json`, JSON.stringify({ ...sm, indices: ind.length, vbytes: eV.length, ibytes: eI.length }));
  console.log(`sculpt: ${nt} triangles -> ${((eV.length + eI.length) / 1024 / 1024).toFixed(1)} MB`);
}
