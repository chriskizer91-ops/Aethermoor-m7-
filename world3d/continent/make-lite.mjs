// make-lite.mjs (Aethermoor, Places, step 4): lighter copies of the continent's two biggest files, for a page that
// must stay under 16 MB (Together's game page, which opens the Atlas):
//   map/tree-models-lite.js   Chris's eight trees with their mid model standing in for the near one (the far one kept)
//   map/place-models-lite.js  the walking places' 3D models for the places M7's story names on the map (names.js keeps
//                             the zone-1 places), the rest dropped (the map shows its own plain buildings there)
// The originals are kept as they are (world3d/aethermoor.js uses them). Defines the same globals, so a page loads
// either file in the same spot.
//   node continent/make-lite.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
const here = path.join(path.dirname(fileURLToPath(import.meta.url)), 'map');
const load = (f) => { const w = {}; vm.runInNewContext(readFileSync(path.join(here, f), 'utf8'), { window: w }); return w; };

// ---- trees: mid in place of near ----
const T = load('tree-models.js').MAP_TREES;
const LT = Object.fromEntries(Object.entries(T).map(([id, t]) => [id, Object.assign({}, t, { near: 'mid' })]));
const treeOut = `// tree-models-lite.js: made by continent/make-lite.mjs from tree-models.js (do not edit): the same eight trees, each with
// its mid model standing in for the near one, for a page that has to be light.\nwindow.MAP_TREES = ${JSON.stringify(LT)};\n`;
writeFileSync(path.join(here, 'tree-models-lite.js'), treeOut);

// ---- places: only the ones kept, their pieces of the packed buffer copied and their offsets moved ----
const KEEP = ['wickhollow', 'cottage', 'jetty', 'thornwood', 'bogmire', 'bogmire-heart'];
const P = load('place-models.js').MAP_PLACE_MODELS;
const raw = zlib.gunzipSync(Buffer.from(P.packed, 'base64'));
// every offset in the buffer, from every place: a piece runs from its offset to the next one (or the end)
const offs = new Set([raw.length]);
const each = (m, f) => { f(m, 'h'); for (const g of m.groups || []) { f(g, 'v'); f(g, 'i'); } };
for (const m of Object.values(P.places)) each(m, (o, k) => { if (typeof o[k] === 'number') offs.add(o[k]); });
const sorted = [...offs].sort((a, b) => a - b), end = (o) => sorted[sorted.indexOf(o) + 1];
const parts = []; let at = 0; const moved = new Map();
const places = {};
for (const id of KEEP) {
  const m = JSON.parse(JSON.stringify(P.places[id])); if (!m) continue;
  each(m, (o, k) => {
    const from = o[k]; if (typeof from !== 'number') return;
    if (!moved.has(from)) { const piece = raw.subarray(from, end(from)); const pad = (4 - (at % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); at += pad; } moved.set(from, at); parts.push(piece); at += piece.length; }
    o[k] = moved.get(from);
  });
  places[id] = m;
}
const buf = Buffer.concat(parts);
const LP = Object.assign({}, P, { places, bytes: buf.length, packed: zlib.gzipSync(buf, { level: 9 }).toString('base64') });
const placeOut = `// place-models-lite.js: made by continent/make-lite.mjs from place-models.js (do not edit): the walking places' models for
// ${KEEP.join(', ')} only (the places M7's story names on the map); elsewhere the map shows its own plain buildings.\nwindow.MAP_PLACE_MODELS = ${JSON.stringify(LP)};\n`;
writeFileSync(path.join(here, 'place-models-lite.js'), placeOut);
const kb = (s) => Math.round(Buffer.byteLength(s) / 1024) + ' KB';
console.log('tree-models-lite.js', kb(treeOut), '(was', kb(readFileSync(path.join(here, 'tree-models.js'), 'utf8')) + ')');
console.log('place-models-lite.js', kb(placeOut), '(was', kb(readFileSync(path.join(here, 'place-models.js'), 'utf8')) + ')');
