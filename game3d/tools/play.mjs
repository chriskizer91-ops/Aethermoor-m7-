// game3d/tools/play.mjs: the headless playthrough (Together, November 20). Plays the built page in Playwright's
// Chromium (software GL) the way a player would, through the real paths: the leader is moved tile by tile in 3D and
// the page's own frame takes M7's engine steps; M7's own boxes, sheets and screens are clicked.
//   a new journey in the Great Hall · the prologue talk · Sneck the Tallyman fought in 3D and won · the Keep · the
//   Hearth Road (its road fights won on the way) · Thornhollow · a chest opened · a rest at a Hearthfire · saved,
//   the page reloaded, and the journey goes on from the same spot.
//   NODE_PATH=$(npm root -g) node game3d/tools/play.mjs <page.html> [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, out = '/tmp/g3-play'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctxB = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctxB.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);
let shots = 0;
const shot = async (n) => { await page.screenshot({ path: path.join(out, String(++shots).padStart(2, '0') + '-' + n + '.png') }); log('shot', n); };
const results = [];
const check = (ok, what) => { results.push([ok, what]); log(ok ? 'PASS' : 'FAIL', what); };
const E = (fn, a) => page.evaluate(fn, a);
const state = () => E(() => { const w = window.__g3.world; return w && w.walk ? { map: w.walk.map, x: w.walk.x, y: w.walk.y, busy: w.busy, fighting: document.body.classList.contains('fighting'), away: !document.getElementById('screen').hidden } : null; });

// ---- M7's boxes and screens, as a player taps them ----
async function playDialogue(pick = /Leave|Not yet|Go|Farewell|Done/i) {
  for (let i = 0; i < 60; i++) {
    if (!(await page.$('.ov-dialogue'))) return true;
    const choices = await page.$$('.dlg-choice:not([disabled])');
    if (choices.length) {
      let chosen = null;
      for (const c of choices) if (pick.test(await c.innerText())) { chosen = c; break; }
      await (chosen || choices[choices.length - 1]).click().catch(() => {});
    } else await page.click('.dlg-next').catch(() => {});
    await page.waitForTimeout(200);
  }
  return false;
}
// whatever is up: a talk, a fight's card, a message, the after-fight screen, a card reveal
async function settle({ fight = true, rest = false, max = 400 } = {}) {
  for (let i = 0; i < max; i++) {
    const s = await state();
    if (s && s.fighting) { await page.waitForTimeout(800); continue; }
    if (await page.$('.ov-dialogue')) { await playDialogue(); continue; }
    if (await page.$('.ov-reveal .cont')) { await page.click('.ov-reveal .cont').catch(() => {}); await page.waitForTimeout(300); continue; }
    if (await page.$('.ov-prefight')) {
      if (fight) { log('a fight: Fight'); await page.click('.pf-fight').catch(() => {}); await page.waitForTimeout(600); continue; }
      await page.click('.ov-prefight .btn.ghost').catch(() => {}); continue;
    }
    if (await page.$('.ov-hearth')) {
      if (rest) { await page.click('.ov-hearth [data-primary]'); await page.waitForTimeout(500); rest = false; continue; }
      await page.click('.ov-hearth .btn.ghost').catch(() => {}); continue;
    }
    if (s && s.away) {
      const chest = await page.$('#screen .af-loot .chest:not(.opened)');
      if (chest) { await chest.click().catch(() => {}); await page.waitForTimeout(800); continue; }
      const nx = await page.$('#screen .af-foot .btn.primary');
      if (nx) { await nx.click().catch(() => {}); await page.waitForTimeout(500); continue; }
    }
    const p = await page.$('.ov [data-primary]:not([disabled]), .ov .cont');
    if (p) { await p.click().catch(() => {}); await page.waitForTimeout(250); continue; }
    if (s && !s.busy && !s.away) return true;
    await page.waitForTimeout(250);
  }
  return false;
}
// walk to (x, y) on this map (or next to it): the engine's own path, the leader set down a tile at a time and the
// page's frame left to take each step; anything that comes up on the way is settled, and the path found again
async function walkTo(x, y, { adjacent = false, map = null, fight = true } = {}) {
  for (let tries = 0; tries < 30; tries++) {
    await settle({ fight });
    const s = await state();
    if (map && s.map !== map) return s;
    if ((s.x === x && s.y === y) || (adjacent && Math.abs(s.x - x) + Math.abs(s.y - y) === 1)) return s;
    const p = await E(([x, y, adjacent]) => window.__g3.world.path(x, y, adjacent), [x, y, adjacent]);
    if (!p || !p.length) { log('no path to', x, y, 'from', s.x, s.y); await page.waitForTimeout(500); continue; }
    for (const [nx, ny] of p) {
      const before = await state();
      if (before.busy || before.fighting || before.away) break;
      await E(([nx, ny]) => window.__g3.world.nudge(nx, ny), [nx, ny]);
      await page.waitForFunction(([nx, ny, m]) => { const w = window.__g3.world; return (w.walk.x === nx && w.walk.y === ny) || w.walk.map !== m || w.busy || document.body.classList.contains('fighting'); }, [nx, ny, before.map], { timeout: 20000 }).catch(() => {});
      const now = await state();
      if (now.map !== before.map || now.busy || now.fighting || now.x !== nx || now.y !== ny) break;
    }
  }
  return state();
}
const nextTo = (id) => E((id) => window.__g3.world.besideOf(id), id);
async function useThing(id, opts) {
  const at = await nextTo(id);
  if (!at) { log('no', id); return false; }
  await walkTo(at.x, at.y, opts);
  await E((d) => window.__g3.world.faceTo(d), at.face);
  await E(() => window.__g3.world.pressA());
  await page.waitForTimeout(600);
  return true;
}

// ---- go ----
await page.goto('file://' + path.resolve(file) + '?new=1&auto=1&speed=4');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
const err0 = await E(() => window.__err);
check(!err0, 'the page loads' + (err0 ? ': ' + err0 : ''));
await page.waitForTimeout(1500);
await shot('great-hall');
let s = await state();
check(s && s.map === 'keep-hall', `a new journey starts in the Great Hall (${s && s.map} ${s && s.x},${s && s.y})`);
// the prologue: Fenwick's talk opens by itself
await page.waitForSelector('.ov-dialogue', { timeout: 20000 }).catch(() => {});
check(!!(await page.$('.ov-dialogue')), 'the prologue talk opens over the 3D (M7\'s own dialogue box)');
await shot('prologue');
await playDialogue();
await settle();
// Sneck the Tallyman at the vault: fight him (the 3D fight, Auto)
const fights0 = await E(() => window.__g3.fights || 0);
await useThing('keep-vault', { fight: true });
if (await page.$('.ov-prefight')) { await shot('prefight'); await page.click('.pf-fight'); }
await page.waitForFunction(() => document.body.classList.contains('fighting'), null, { timeout: 30000 }).catch(() => {});
check(await E(() => document.body.classList.contains('fighting')), 'Sneck\'s fight starts in 3D, in the hall');
await page.waitForTimeout(4000); await shot('fight');
await page.waitForFunction(() => !document.body.classList.contains('fighting'), null, { timeout: 400000 }).catch(() => {});
const res1 = await E(() => window.__g3.lastResult);
check(res1 === 'victory', `the fight is won (${res1})`);
await page.waitForTimeout(1500); await shot('after-fight');
check(await E(() => !document.getElementById('screen').hidden && !!document.querySelector('#screen .screen-aftermath')), 'M7\'s after-fight screen comes up over the 3D');
await settle();
s = await state();
check(s.map === 'keep-hall' && !s.away, `back walking in the hall (${s.map} ${s.x},${s.y})`);
await shot('hall-after');
// out to the Keep's yard, through the north gate, up the Hearth Road to Thornhollow
await walkTo(12, 13, { map: 'keep-hall' });
await page.waitForFunction(() => window.__g3.world.walk.map === 'keep' && !window.__g3.world.busy, null, { timeout: 60000 }).catch(() => {});
s = await state();
check(s.map === 'keep', `the hall's door leads out to the Keep (${s.map} ${s.x},${s.y})`);
await settle(); await shot('keep');
await walkTo(15, 0, { map: 'keep' });
await page.waitForFunction(() => window.__g3.world.walk.map === 'hearth-road' && !window.__g3.world.busy, null, { timeout: 60000 }).catch(() => {});
s = await state();
check(s.map === 'hearth-road', `the north gate leads to the Hearth Road (${s.map} ${s.x},${s.y})`);
await settle(); await shot('hearth-road');
const fightsRoad = await E(() => window.__g3.fights || 0);
for (let i = 0; i < 12; i++) { s = await walkTo(12, 0, { map: 'hearth-road' }); if (s.map !== 'hearth-road') break; }
await page.waitForFunction(() => window.__g3.world.walk.map === 'thornhollow' && !window.__g3.world.busy, null, { timeout: 60000 }).catch(() => {});
await settle();
s = await state();
check(s.map === 'thornhollow', `the Hearth Road leads to Thornhollow (${s.map} ${s.x},${s.y}; ${(await E(() => window.__g3.fights || 0)) - fightsRoad} road fights on the way)`);
await shot('thornhollow');
// a chest: Thornhollow's cache
const gold0 = await E(() => window.__g3.world.game.gold);
const opened0 = await E(() => window.__g3.chests || 0);
await useThing('th-cache');
await settle();
check((await E(() => window.__g3.chests || 0)) > opened0 && (await E(() => !!window.__g3.world.game.progress.flags.opened['th-cache'])), `a chest is opened (gold ${gold0} -> ${await E(() => window.__g3.world.game.gold)})`);
await shot('chest');
// a rest at Thornhollow's Hearthfire (lit first if it is cold)
const rested0 = await E(() => window.__g3.rested || 0);
await useThing('thornhollow');
if (await page.$('.ov-lock')) { await page.click('.ov [data-primary]:not([disabled])').catch(() => {}); await page.waitForTimeout(600); }
if (await page.$('.ov-hearth')) { await shot('hearth'); await page.click('.ov-hearth [data-primary]'); }
await settle();
check((await E(() => window.__g3.rested || 0)) > rested0, `the party rests at a Hearthfire (day ${await E(() => window.__g3.world.game.progress.flags.day)})`);
// saved under the 3D game's own key, and nothing written to M7's
const saved = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return g && { map: g.progress.pos.map, x: g.progress.pos.x, y: g.progress.pos.y, m7: localStorage.getItem('aethermoor.save.m7') }; });
s = await state();
check(saved && saved.map === s.map && saved.x === s.x && saved.y === s.y, `saved under aethermoor.save.3d (${JSON.stringify(saved && { map: saved.map, x: saved.x, y: saved.y })})`);
check(saved && saved.m7 === null, 'M7\'s own save key is never written');
// reload: the title offers to go on, and the party stands where it was
await page.goto('file://' + path.resolve(file) + '?auto=1');
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await shot('title');
const goOn = await page.$('#titlebtns .g3-big.primary');
check(!!goOn && /Go on/.test(await goOn.innerText()), 'after a reload the title offers "Go on"');
await goOn.click();
await page.waitForFunction(() => window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await settle();
const s2 = await state();
check(s2.map === s.map && s2.x === s.x && s2.y === s.y, `the journey goes on from the same spot (${s2.map} ${s2.x},${s2.y})`);
await page.waitForTimeout(1500); await shot('reloaded');

console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
