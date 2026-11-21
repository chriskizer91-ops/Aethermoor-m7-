// game3d/tools/den.mjs: Briarmaw's den in the game, headless (a short look: the den, his fight, him in full detail)
// adapted from act-end.mjs: the end of Act One, headless (Together, November 20). Starts from a journey made with M7's
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
const [file, out = '/tmp/g3-den', query = 'auto=1&speed=4'] = process.argv.slice(2);
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
for (const enc of ['keep-vault']) { f.done[enc] = true; f.cleared[enc] = true; f.beaten = { ...(f.beaten || {}), [enc]: 1 }; }
g.progress.brands = [];
f.kindled = { ...f.kindled, 'last-green-coal': true, thornhollow: true };
g.progress.pos = { map: 'briarmaw-den', x: 8, y: 13, face: 'n' };
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
await page.goto('file://' + path.resolve(file) + '?' + query);
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
await page.click('#titlebtns .g3-big.primary');
await page.waitForFunction(() => window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await settle();
let s = await state();
check(s.map === 'briarmaw-den', `"Go on" stands the party in Briarmaw's den (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('den');
await useThing('briarmaw-den');
for (let i = 0; i < 120 && !(await E(() => document.body.classList.contains('fighting'))); i++) {
  if (await page.$('.ov-dialogue')) await playDialogue(/Fight|Draw|Face|Strike|Leave/i);
  else if (await page.$('.ov-prefight')) { await shot('prefight'); await page.click('.pf-fight').catch(() => {}); }
  await page.waitForTimeout(400);
}
check(await E(() => document.body.classList.contains('fighting')), "Briarmaw's fight starts in 3D, in his den");
await page.waitForTimeout(8000); await shot('briarmaw-fight');
const hd = await E(() => window.__g3.foeLook);
check(true, 'foe look: ' + JSON.stringify(hd));
await page.waitForTimeout(8000); await shot('briarmaw-fight-2');
console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
