// make.mjs (Places, step 6, November 24): the arena sets. Chris: fights "in arenas that look like the land you are in".
// Each set is a small map in M7's own format (an open round about 30 m across, nothing in its middle 20 m, the land's
// own trees, rocks, walls or cliffs only round the edge) and a painting patched together, tile by tile, from the
// paintings of the places it stands for. m7/convert.mjs then makes it a place like any other (arena-<set>), so it wears
// the same textures, painting light, sky and life as those places.
//   node m7/arenas/make.mjs road-wood desert ...      (no names: every set)   then   node m7/convert.mjs arena-road-wood ...
// One tile is 2 m: the round is 15 tiles across (radius 7.5), the clear middle 10 (radius 5), the map 21 x 21 tiles.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { SETS } from './sets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, '..', '..', '..');
const N = 21, C = (N - 1) / 2, R_CLEAR = 5, R_ROUND = 7.5, R_WALL = 8.7;
// a fixed random sequence per set, so a set comes out the same every time
const rng = (seed) => { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };
const pick = (r, list) => { let x = r() * list.reduce((s, [, w]) => s + w, 0); for (const [c, w] of list) { x -= w; if (x <= 0) return c; } return list[list.length - 1][0]; };

async function make(key) {
  const S = SETS[key]; if (!S) throw new Error('no set ' + key);
  const r = rng(1009 + [...key].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 100000);
  const rows = [];
  for (let j = 0; j < N; j++) {
    let row = '';
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(i - C, j - C);
      const onPath = S.path && (S.path.axis === 'x' ? Math.abs(j - C) <= (S.path.half ?? 0.6) : Math.abs(i - C) <= (S.path.half ?? 0.6));
      let c;
      if (d < R_CLEAR) c = onPath ? S.path.c : S.ground;
      else if (d < R_ROUND) c = onPath ? S.path.c : (S.near && r() < S.near.p ? pick(r, S.near.k) : S.ground);
      else if (d < R_WALL) c = onPath && S.path.through ? S.path.c : (r() < S.edge.p ? pick(r, S.edge.k) : S.ground);
      else c = onPath && S.path.through ? S.path.c : (S.outerMix && r() < S.outerMix.p ? pick(r, S.outerMix.k) : S.outer);
      row += c;
    }
    rows.push(row);
  }
  const src = S.sources[0];
  const first = (await import(pathToFileURL(path.join(ROOT, 'game/src/data/maps', src + '.js')))).default;
  const map = {
    id: 'arena-' + key, name: S.name, region: S.region || first.region, biome: S.biome || first.biome, dark: S.dark ?? first.dark,
    ...(S.light ? { light: S.light } : {}), w: N, h: N, rows, entities: [], exits: [],
    // the party stands south of the middle facing north; the foes come in from the north
    anchors: { 'from-road': [C, C + 3, 'n'], party: [C, C + 3, 'n'], foes: [C, C - 3, 's'] },
    arena: { set: key, sources: S.sources, clear: R_CLEAR * 2, round: R_ROUND * 2 },
  };
  mkdirSync(path.join(here, 'maps'), { recursive: true }); mkdirSync(path.join(here, 'paint'), { recursive: true });
  writeFileSync(path.join(here, 'maps', map.id + '.js'),
    `// ${map.id}.js: the ${S.name} arena (made by m7/arenas/make.mjs from m7/arenas/sets.mjs: do not edit by hand)\nexport default ${JSON.stringify(map, null, 1)};\n`);
  // the painting: every tile copied from a tile of the same kind in the sources' paintings (one deep inside a patch of
  // that kind where there is one), laid with soft edges so the patches run together
  const srcMaps = [];
  for (const id of S.sources) { const m = (await import(pathToFileURL(path.join(ROOT, 'game/src/data/maps', id + '.js')))).default; srcMaps.push({ id, rows: m.rows, w: m.w, h: m.h, paint: path.join(ROOT, 'world3d/coven/art/m7', id + '.webp') }); }
  const job = { N, rows, sources: srcMaps, alias: S.paintAs || {}, seed: 77 + rows.length, out: path.join(here, 'paint', map.id + '.webp') };
  execFileSync('python3', ['-I', path.join(here, 'paint.py')], { input: JSON.stringify(job) });
  console.log(`${map.id}: ${S.name}, from ${S.sources.join(', ')}`);
}

const want = process.argv.slice(2);
for (const k of want.length ? want : Object.keys(SETS)) await make(k);
