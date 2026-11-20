// game3d/tools/sunscorch.mjs: the Sunscorch's page, headless (Together, November 20). "Begin at the Sunscorch" (?act2=1:
// the journey as Act One leaves it, by M7's rules) · the Keep's south-east gate open onto the Sun Road · down the Sun Road
// (its fights won on the way) to Sandspire · a rest at Sandspire's Hearthfire · saved under the 3D game's own key.
//   NODE_PATH=$(npm root -g) node game3d/tools/sunscorch.mjs <page.html> [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { kit } from './kit.mjs';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, out = '/tmp/g3-sunscorch'] = process.argv.slice(2);
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
check(s.map === 'keep' && s.x === 22 && s.y === 22, `the journey begins at the Keep's south-east gate (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('keep-gate');
await walkTo(22, 23, { map: 'keep' }); await onMap('sun-road'); await settle();
s = await state();
check(s.map === 'sun-road', `the gate opens onto the Sun Road (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('sun-road');
const f0 = await E(() => window.__g3.fights || 0);
for (let i = 0; i < 10; i++) { s = await walkTo(12, 63, { map: 'sun-road' }); if (s.map !== 'sun-road') break; }
await onMap('sandspire'); await settle();
s = await state();
check(s.map === 'sandspire', `the Sun Road leads to Sandspire (${s.map} ${s.x},${s.y}; ${(await E(() => window.__g3.fights || 0)) - f0} fights on the way)`);
await page.waitForTimeout(1500); await shot('sandspire');
const r0 = await E(() => window.__g3.rested || 0);
await useThing('spire-hearth');
if (await page.$('.ov-lock')) { await page.click('.ov [data-primary]:not([disabled])').catch(() => {}); await page.waitForTimeout(600); }
if (await page.$('.ov-hearth')) { await shot('hearth'); await page.click('.ov-hearth [data-primary]'); }
await settle({ rest: true });
check((await E(() => window.__g3.rested || 0)) > r0, 'the party rests at Sandspire\'s Hearthfire');
const saved = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return g && g.progress.pos.map; });
check(saved === 'sandspire', `saved under the 3D game's own key (${saved})`);

console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
