// game3d/tools/region.mjs: a region's page, headless (Together, November 20). "Begin at <region>" (?act2=1: the journey
// as the page's start makes it, by M7's rules) · the way in · the first road, its fights won on the way, to the next place
// · a rest at a Hearthfire where the route has one · saved under the 3D game's own key.
//   NODE_PATH=$(npm root -g) node game3d/tools/region.mjs <page.html> <sunscorch|ironspire|gloomfen|act3> [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { kit } from './kit.mjs';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, region = 'sunscorch', out = '/tmp/g3-' + region] = process.argv.slice(2);
// each region: where the journey begins, the way in (a tile to step on), the first road's far end, the place it reaches, a fire
const R = {
  sunscorch: { start: ['keep', 22, 22], in: ['keep', 22, 23, 'sun-road'], road: [12, 63, 'sandspire'], fire: 'spire-hearth' },
  ironspire: { start: ['keep', 28, 11], in: ['keep', 29, 11, 'old-bridge'], road: [23, 0, 'drystone-lea'], fire: null },
  act3: { start: ['keep-hall', 12, 6], in: ['keep-hall', 21, 8, 'hollow-hall'], road: [33, 12, 'ash-stair'], fire: 'under-coal' },
  gloomfen: { start: ['mossfall', 20, 20], in: ['mossfall', 20, 21, 'murkway'], road: [44, 32, 'willowmurk'], fire: 'willow-hearth' },
}[region];
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);
let shots = 0;
const shot = async (n) => { await page.screenshot({ path: path.join(out, String(++shots).padStart(2, '0') + '-' + n + '.png') }); log('shot', n); };
const results = [];
const check = (ok, what) => { results.push([ok, what]); log(ok ? 'PASS' : 'FAIL', what); };
const { E, state, settle, walkTo, useThing } = kit(page, log, shot);
const onMap = (m) => page.waitForFunction((m) => window.__g3.world.walk.map === m && !window.__g3.world.busy, m, { timeout: 120000 }).catch(() => {});

await page.goto('file://' + path.resolve(file) + '?act2=1&auto=1&speed=4');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
check(!(await E(() => window.__err)), 'the page loads');
await settle();
let s = await state();
check(s.map === R.start[0] && Math.abs(s.x - R.start[1]) + Math.abs(s.y - R.start[2]) <= 2, `the journey begins by the way in (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('start');
await walkTo(R.in[1], R.in[2], { map: R.in[0] }); await onMap(R.in[3]); await settle();
s = await state();
check(s.map === R.in[3], `the way in leads to ${R.in[3]} (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot(R.in[3]);
async function rest() {
  const r0 = await E(() => window.__g3.rested || 0);
  await useThing(R.fire);
  if (await page.$('.ov-lock')) { await page.click('.ov [data-primary]:not([disabled])').catch(() => {}); await page.waitForTimeout(600); }
  if (await page.$('.ov-hearth')) { await shot('hearth'); await page.click('.ov-hearth [data-primary]'); }
  await settle({ rest: true });
  check((await E(() => window.__g3.rested || 0)) > r0, `the party rests at a Hearthfire (${R.fire})`);
}
if (R.fire && R.fireFirst) await rest();
const f0 = await E(() => window.__g3.fights || 0), from = s.map;
for (let i = 0; i < 10; i++) { s = await walkTo(R.road[0], R.road[1], { map: from }); if (s.map !== from) break; }
await onMap(R.road[2]); await settle();
s = await state();
check(s.map === R.road[2], `the road leads on to ${R.road[2]} (${s.map} ${s.x},${s.y}; ${(await E(() => window.__g3.fights || 0)) - f0} fights on the way)`);
await page.waitForTimeout(1500); await shot(R.road[2]);
if (R.fire && !R.fireFirst) await rest();
const saved = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return g && g.progress.pos.map; });
check(saved === s.map, `saved under the 3D game's own key (${saved})`);

console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
