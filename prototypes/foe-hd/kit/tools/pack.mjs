// Packs a foe's light model (from kit/blender/bake.py) for the page: quantized and compressed with meshoptimizer, so
// the page decodes it in a few milliseconds. The foe kit, November 20.
//   node kit/tools/pack.mjs foes/<key>          -> foes/<key>/assets/light.bin, light.json
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { MeshoptEncoder } from 'meshoptimizer';
await MeshoptEncoder.ready;
const foe = process.argv[2]; const bakeDir = `${foe}/build/bake`, out = `${foe}/assets`, sculptPre = null;
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
  bones: meta.bones, triangles: meta.triangles, sculptTriangles: meta.sculptTriangles, key: meta.key, plan: meta.plan, height: meta.height, split: meta.split || undefined }));
console.log(`light: ${meta.triangles} triangles, ${n} vertices -> ${((encV.length + encI.length) / 1024).toFixed(0)} KB`);

