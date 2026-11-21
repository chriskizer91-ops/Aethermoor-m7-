// game3d/tools/codebox.mjs: the title's "Bring a journey by its save code" on a built page, headless (Together,
// November 21). A journey made by M7's rules (Act One done, level 9, at Thornhollow, carrying gear), turned into M7's own
// AETH6 save code (core/save.js exportCode, as the 2D game's Settings makes it), pasted into the title's box: the party,
// its levels and gear arrive under the 3D game's own key, the 3D save there before is backed up, M7's key never written.
// A bad code shows M7's own words and changes nothing.
//   NODE_PATH=$(npm root -g) node game3d/tools/codebox.mjs <page.html|http url> [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { newGame } from '../../game/src/rules/gauntlet.js';
import { grantXp, xpForLevel } from '../../game/src/rules/progression.js';
import { deriveHero } from '../../game/src/rules/stats.js';
import { relicItem } from '../../game/src/rules/loot.js';
import { exportCode } from '../../game/src/core/save.js';
import { createRng } from '../../game/src/core/rng.js';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, out = '/tmp/g3-codebox'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

let g = newGame({ name: 'Brannoch', starter: 'hearthbrand', seed: 5 });
const rng = createRng('codebox');
for (const id of g.party.active) {
  let h = g.party.roster[id];
  h = grantXp(h, xpForLevel(9) - (h.xp || 0), rng).hero;
  const d = deriveHero(h, g.inventory);
  g.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
}
g.progress.flags.story = { ...g.progress.flags.story, 'intro-done': true };
g.progress.flags.day = 6;
g.inventory.push(relicItem('fenwicks-poker', createRng('cb-poker'), { from: 'Fenwick', where: 'Hearthstone Keep', day: 6 }));
g.progress.pos = { map: 'thornhollow', x: 20, y: 20, face: 's' };
const code = exportCode(g);
const lead = g.party.roster[g.party.active[0]];

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const results = [];
const check = (ok, what) => { results.push([ok, what]); console.log(ok ? 'PASS' : 'FAIL', what); };
const E = (fn, a) => page.evaluate(fn, a);
// a 3D save already there (a new journey), to be backed up, and a stand-in for M7's own save, to stay as it is
const before = JSON.stringify({ ...newGame({ name: 'Old', starter: 'hearthbrand', seed: 1 }) });
await page.addInitScript((before) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('aethermoor.save.3d', before); sessionStorage.setItem('seeded', '1'); } }, before);
const url = /^https?:/.test(file) ? file : 'file://' + path.resolve(file);
await page.goto(url);
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
const btn = await page.$('#titlebtns .g3-big:has-text("Bring a journey by its save code")');
check(!!btn, 'the title offers "Bring a journey by its save code"');
await btn.click();
await page.waitForSelector('.g3-code textarea');
const fit = await E(() => { const r = [...document.querySelectorAll('.g3-code button')].map((x) => x.getBoundingClientRect().height); return { min: Math.min(...r), scroll: document.documentElement.scrollWidth <= innerWidth }; });
check(fit.min >= 44 && fit.scroll, `the box at 360 px: buttons ${fit.min} px tall, no sideways scroll`);
await page.fill('.g3-code textarea', 'AETH6.notacode!!');
await page.click('.g3-code .g3-big.primary');
await page.waitForTimeout(300);
const bad = await E(() => document.querySelector('.g3-code-err').textContent);
check(!!bad && (await E(() => JSON.parse(localStorage.getItem('aethermoor.save.3d')).party.roster[JSON.parse(localStorage.getItem('aethermoor.save.3d')).party.active[0]].name)) === 'Old', `a bad code shows M7's words and changes nothing ("${bad}")`);
await page.screenshot({ path: path.join(out, '01-box.png') });
await page.fill('.g3-code textarea', code);
await page.click('.g3-code .g3-big.primary');
await page.waitForFunction(() => window.__g3 && window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await page.waitForTimeout(2500);
const got = await E(() => { const s = JSON.parse(localStorage.getItem('aethermoor.save.3d')); const bak = JSON.parse(localStorage.getItem('aethermoor.save.3d.bak') || 'null'); const w = window.__g3.world.walk; return { name: s.party.roster[s.party.active[0]].name, level: s.party.roster[s.party.active[0]].level, poker: s.inventory.some((i) => i.base === 'fenwicks-poker'), day: s.progress.flags.day, bak: bak && bak.party.roster[bak.party.active[0]].name, map: w.map, m7: localStorage.getItem('aethermoor.save.m7') }; });
check(got.name === lead.name && got.level === lead.level && got.poker && got.day === 6, `the party arrives with its levels and gear (${got.name}, level ${got.level}, day ${got.day}, the Poker ${got.poker ? 'carried' : 'missing'})`);
check(got.map === 'thornhollow', `standing where the code left them (${got.map})`);
check(got.bak === 'Old', 'the 3D save there before is backed up');
check(got.m7 === null, "M7's own key never written");
await page.screenshot({ path: path.join(out, '02-arrived.png') });
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
