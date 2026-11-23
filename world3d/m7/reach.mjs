// reach.mjs (Places, November 23): can the party walk to everything in each place? Loads a built m7 page headless, reads
// the 3D walkable ground of every place on it (P.walkable on a 10 px grid), floods it from where the party arrives,
// and lists every M7 thing the party can't reach: ways in and out, chests, foes, people, signs, gates. A thing counts
// as reached when its own tile or one beside it is. Prints a line per place; the full list as JSON in out-dir/reach.json.
//   NODE_PATH=$(npm root -g) node m7/reach.mjs dist/<page>.html out-dir [ids]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [file, out, only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const TX = 50, TY = 40, C = 10;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 640, height: 480 } }); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('file://' + path.resolve(file) + '?test');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 240000 });
const ids = only ? only.split(',') : await page.evaluate(() => Object.keys(window.M7_PLACES));
const report = {};
for (const id of ids) {
  const g = await page.evaluate(async ([id, C]) => {
    const m = window.__m7; if (m.cur !== id) await m.go(id);
    const P = m.W.P, pl = window.M7_PLACES[id], [w, h] = pl.size, nx = Math.ceil(w / C), ny = Math.ceil(h / C);
    let s = ''; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) s += P.walkable(i * C + C / 2, j * C + C / 2) ? '1' : '0';
    const anchors = Object.entries(pl.anchors || {}).map(([k, a]) => [k, a.at[0], a.at[1]]);
    return { nx, ny, s, anchors, start: pl.start };
  }, [id, C]);
  const map = (await import(path.resolve('../game/src/data/maps/' + id + '.js'))).default;
  const ok = (i, j) => i >= 0 && j >= 0 && i < g.nx && j < g.ny && g.s[j * g.nx + i] === '1';
  // flood from every arrival point (they are all ways in); remember which one reached each cell
  const seen = new Int8Array(g.nx * g.ny);
  const starts = g.anchors.length ? g.anchors.map((a) => [a[1], a[2]]) : [g.start];
  const stack = [];
  for (const [x, y] of starts) { let i = Math.floor(x / C), j = Math.floor(y / C); let best = null;
    for (let r = 0; r <= 4 && !best; r++) for (let b2 = -r; b2 <= r; b2++) for (let a = -r; a <= r; a++) if (!best && ok(i + a, j + b2)) best = [i + a, j + b2];
    if (best) stack.push(best); }
  // first, from the first arrival alone: what one way in reaches
  const flood = (seed) => { const s = new Uint8Array(g.nx * g.ny), st = [seed]; s[seed[1] * g.nx + seed[0]] = 1; let n = 0;
    while (st.length) { const [i, j] = st.pop(); n++; for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const p = i + a, q = j + b2; if (ok(p, q) && !s[q * g.nx + p]) { s[q * g.nx + p] = 1; st.push([p, q]); } } }
    return s; };
  const comps = stack.map(flood);
  const any = new Uint8Array(g.nx * g.ny); comps.forEach((s) => s.forEach((v, k) => { if (v) any[k] = 1; }));
  const main = comps[0] || any;
  const tileHit = (S, ti, tj) => { for (let y = tj * TY; y < (tj + 1) * TY; y += C) for (let x = ti * TX; x < (ti + 1) * TX; x += C) { const i = Math.floor((x + C / 2) / C), j = Math.floor((y + C / 2) / C); if (S[j * g.nx + i]) return true; } return false; };
  const near = (S, area) => { const [a, b2, c, d] = area; for (let tj = b2 - 1; tj <= d + 1; tj++) for (let ti = a - 1; ti <= c + 1; ti++) if (tileHit(S, ti, tj)) return true; return false; };
  const things = [];
  for (const e of map.entities || []) things.push([e.kind + ' ' + e.id, e.area || [e.at[0], e.at[1], e.at[0], e.at[1]]]);
  for (const e of map.exits || []) things.push(['exit ' + e.id + ' to ' + e.to, e.area]);
  for (const [k, a] of Object.entries(map.anchors || {})) things.push(['arrival ' + k, [a[0], a[1], a[0], a[1]]]);
  const lost = [], split = [];
  for (const [name, area] of things) { if (!near(any, area)) lost.push(name); else if (!near(main, area)) split.push(name); }
  // walkable ground in M7 the 3D walk cannot reach (counted in tiles): tiles M7 walks and the 3D floods miss
  let open3d = 0, cut = 0; for (let tj = 0; tj < map.h; tj++) for (let ti = 0; ti < map.w; ti++) { const has = tileHit(Uint8Array.from(g.s, (c) => c === '1'), ti, tj); if (has) { open3d++; if (!tileHit(any, ti, tj)) cut++; } }
  report[id] = { lost, split, unreachedTiles: cut, walkTiles: open3d, ways: comps.length };
  console.log(`${id}: ${lost.length ? 'CAN\'T REACH ' + lost.join('; ') : 'everything reached'}${split.length ? ' | only from another way in: ' + split.join('; ') : ''} | ${cut} of ${open3d} walkable tiles cut off`);
}
writeFileSync(path.join(out, 'reach.json'), JSON.stringify(report, null, 1));
console.log('errors', errs.length ? errs.slice(0, 3) : 'none'); await b.close();
