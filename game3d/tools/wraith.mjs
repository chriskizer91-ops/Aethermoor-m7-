// game3d/tools/wraith.mjs: a fight with Models' wraiths on a built page, headless (Together, November 21). A journey made
// by M7's rules on the Gloomfen (level 18), at the Long Boardwalk: the drowned standing on its broken middle (lb-drowned,
// three of them) fought in 3D, in their full-detail look, to the end, with no page errors.
//   NODE_PATH=$(npm root -g) node game3d/tools/wraith.mjs <gloomfen page.html|http url> [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { kit } from './kit.mjs';
import { newGame } from '../../game/src/rules/gauntlet.js';
import { grantXp, xpForLevel } from '../../game/src/rules/progression.js';
import { deriveHero } from '../../game/src/rules/stats.js';
import { createRng } from '../../game/src/core/rng.js';
import { MAPS } from '../../game/src/data/maps/index.js';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, out = '/tmp/g3-wraith'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

let g = newGame({ name: 'Wren', starter: 'hearthbrand', seed: 21 });
const rng = createRng('wraith');
for (const id of g.party.active) {
  let h = g.party.roster[id];
  h = grantXp(h, xpForLevel(18) - (h.xp || 0), rng).hero;
  const d = deriveHero(h, g.inventory);
  g.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
}
const f = g.progress.flags;
f.story = { ...f.story, 'intro-done': true };
for (const k of ['act1-complete', 'council-done', 'sunscorch-complete', 'council-2-done', 'ironspire-complete', 'council-3-done']) f.story[k] = true;
for (const enc of ['keep-vault', 'briarmaw-den', 'rotwarden-heart', 'kharzul-heart', 'ashen-warden', 'mother-anvil', 'rime-abbot']) { f.done[enc] = true; f.cleared[enc] = true; f.beaten = { ...(f.beaten || {}), [enc]: 1 }; }
g.progress.brands = ['brand-of-briars', 'brand-of-the-heartroot', 'brand-of-glass', 'brand-of-ash', 'brand-of-iron', 'brand-of-frost'];
f.seen = { ...(f.seen || {}), 'card:gloomfen': true };
const [ax, ay, af] = Object.values(MAPS['long-boardwalk'].anchors)[0];
g.progress.pos = { map: 'long-boardwalk', x: ax, y: ay, face: af || 's' };

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
const { E, state, settle, useThing } = kit(page, log, shot);
await page.addInitScript((save) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('aethermoor.save.3d', save); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(g));
const url = /^https?:/.test(file) ? file : 'file://' + path.resolve(file);
await page.goto(url + (url.includes('?') ? '&' : '?') + 'auto=1&speed=4');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
await page.click('#titlebtns .g3-big.primary');
await page.waitForFunction(() => window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await settle();
const look = await E(() => window.__g3.foeLook);
check(look.look === 'hd' && look.full.includes('drowned'), `the full-detail look carries the wraiths (${look.full.filter((k) => /drowned|rime|lantern|wisp|choir|bell/.test(k)).join(', ')})`);
const s = await state();
check(s.map === 'long-boardwalk', `"Go on" stands the party on the Long Boardwalk (${s.x},${s.y})`);
const f0 = await E(() => window.__g3.fights || 0);
await useThing('lb-drowned');
await page.waitForFunction(() => document.body.classList.contains('fighting') || document.querySelector('.ov-prefight'), null, { timeout: 120000 }).catch(() => {});
if (await page.$('.ov-prefight')) await page.click('.pf-fight');
await page.waitForFunction(() => document.body.classList.contains('fighting'), null, { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(6000); await shot('the-drowned');
await settle();
check((await E(() => window.__g3.fights || 0)) > f0 && (await E(() => window.__g3.lastResult)) === 'victory', `the drowned fought in 3D, to the end (${await E(() => window.__g3.lastResult)})`);
await shot('after');
console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
