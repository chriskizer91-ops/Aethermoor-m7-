// game3d/tools/act-end.mjs: the end of Act One, headless (Together, November 20). Starts from a journey made with M7's
// own rules (game/src/rules: the party levelled to the Heartroot, Briarmaw's Brand already won, standing in the
// Heartroot's depths), put in the 3D game's own save key before the page loads, then played as a player would:
//   "Go on" · the Rotwarden fought in 3D and won · the second Brand (the end of Act One) · back up the roots to the
//   Last Green Coal · travel by Hearthfire to the Keep · the Council sits (the end of Act One's card) · saved.
//   NODE_PATH=$(npm root -g) node game3d/tools/act-end.mjs <page.html> [out-dir]
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
const [file, out = '/tmp/g3-act-end'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const LEVEL = Number(process.env.LEVEL) || 10;

// ---- the journey so far, by M7's rules ----
let g = newGame({ name: 'Wren', starter: 'hearthbrand', seed: 11 });
const rng = createRng('act-end:11');
for (const id of g.party.active) {
  let h = g.party.roster[id];
  const need = xpForLevel(LEVEL) - (h.xp || 0);
  if (need > 0) h = grantXp(h, need, rng).hero;
  const d = deriveHero(h, g.inventory);
  g.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
}
const f = g.progress.flags;
f.story = { ...f.story, 'intro-done': true };
for (const enc of ['keep-vault', 'briarmaw-den']) { f.done[enc] = true; f.cleared[enc] = true; f.beaten = { ...(f.beaten || {}), [enc]: 1 }; }
g.progress.brands = ['brand-of-briars'];
f.kindled = { ...f.kindled, 'last-green-coal': true, thornhollow: true };
g.progress.pos = { map: 'heartroot-2', x: 9, y: 12, face: 'n' };
const exitDown = MAPS['heartroot-2'].exits.find((e) => e.to === 'heartroot-1');

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
const { E, state, settle, walkTo, useThing, playDialogue } = kit(page, log, shot);

await page.addInitScript((save) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('aethermoor.save.3d', save); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(g));
await page.goto('file://' + path.resolve(file) + '?auto=1&speed=4');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
await page.click('#titlebtns .g3-big.primary');
await page.waitForFunction(() => window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await settle();
let s = await state();
check(s.map === 'heartroot-2', `"Go on" stands the party in the Heartroot's depths (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('heartroot');
// the Rotwarden
await useThing('rotwarden-heart');
for (let i = 0; i < 120 && !(await E(() => document.body.classList.contains('fighting'))); i++) {
  if (await page.$('.ov-dialogue')) await playDialogue(/Fight|Draw|Face|Strike|Leave/i);
  else if (await page.$('.ov-prefight')) { await shot('prefight'); await page.click('.pf-fight').catch(() => {}); }
  await page.waitForTimeout(400);
}
check(await E(() => document.body.classList.contains('fighting')), 'the Rotwarden\'s fight starts in 3D, in his lair');
await page.waitForTimeout(5000); await shot('rotwarden-fight');
await page.waitForFunction(() => !!document.querySelector('#fight.spoils') || !document.body.classList.contains('fighting'), null, { timeout: 900000 }).catch(() => {});
check(await E(() => window.__g3.lastResult) === 'victory', `the Rotwarden is beaten (${await E(() => window.__g3.lastResult)})`);
await page.waitForTimeout(1500); await shot('spoils');
await settle();
const brands = await E(() => window.__g3.world.game.progress.brands);
check(brands.includes('brand-of-the-heartroot'), `the second Brand is the party's (${brands.join(', ')})`);
check(await E(() => !!window.__g3.world.game.progress.flags.story['act1-complete']), 'Act One is complete (the story\'s flag)');
await shot('brand');
// back up the roots to the Last Green Coal, and home to the Keep by Hearthfire
await walkTo(exitDown.area[0], exitDown.area[1], { map: 'heartroot-2' });
await page.waitForFunction(() => window.__g3.world.walk.map === 'heartroot-1' && !window.__g3.world.busy, null, { timeout: 60000 }).catch(() => {});
await settle();
s = await state();
check(s.map === 'heartroot-1', `the roots lead back up to the Heartroot (${s.map} ${s.x},${s.y})`);
await useThing('last-green-coal');
await page.waitForSelector('.ov-hearth', { timeout: 15000 }).catch(() => {});
await shot('hearth');
await page.click('.ov-hearth .btn:not(.primary):not(.ghost)').catch(() => {});   // Travel
await page.waitForSelector('.hearth-to[data-hearth="hearthstone-keep"]', { timeout: 10000 }).catch(() => {});
await page.click('.hearth-to[data-hearth="hearthstone-keep"]').catch(() => {});
await page.waitForFunction(() => window.__g3.world.walk.map === 'keep-hall', null, { timeout: 120000 }).catch(() => {});
check(await E(() => window.__g3.world.walk.map === 'keep-hall'), 'the Hearthfire takes the party home to the Great Hall');
// the Council: its card and talk come up by themselves on arriving; play them through
await page.waitForTimeout(2500); await shot('council');
await settle({ max: 800 });
const story = await E(() => window.__g3.world.game.progress.flags.story);
check(!!story['council-done'], `the Council sits (${Object.keys(story).filter((k) => /council|act/.test(k)).join(', ')})`);
const saved = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return g && { brands: g.progress.brands, council: !!g.progress.flags.story['council-done'], m7: localStorage.getItem('aethermoor.save.m7') }; });
check(saved && saved.council && saved.brands.length === 2 && saved.m7 === null, `saved under the 3D game's own key (${JSON.stringify(saved)})`);
await page.waitForTimeout(1500); await shot('after-council');

console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
