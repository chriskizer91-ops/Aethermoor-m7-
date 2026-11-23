// game3d/tools/finale.mjs: the end of the game, headless (Together, November 21). One of M7's three endings
// (data/endings.js: rekindle, release, anew), played on the Act Three page from a journey made with M7's own rules,
// put in the 3D game's own save key before the page loads:
//   from=deep (the default): the party at the foot of the Ash Stair, the Hollow Council freed (level 38): "Go on" ·
//     the Chained Deep's walkway and its chain gate (the unmade fought) · Tamsin's return · the forge door · the
//     Worldforge's bridge (the forge-warden fought) · the Unsmith's word and his fight · the heart.
//   from=heart: the Unsmith already beaten, the party on the smith's place before the heart.
//   Then the heart's choice, its last word, the ending's card (its name and words), the credits, the last card, the party
//   back in the Great Hall, the ending saved (once and for good) and the main quest closed.
//   Kindle Anew's price (Fenwick's Poker, a Masterpiece, every page of the Codex) is put in the journey for `anew`; for
//   the others the check also reads that Kindle Anew is shown shut, with its reasons.
//   NODE_PATH=$(npm root -g) node game3d/tools/finale.mjs <page.html|http url> <rekindle|release|anew> [deep|heart] [out-dir]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { kit } from './kit.mjs';
import { newGame } from '../../game/src/rules/gauntlet.js';
import { grantXp, xpForLevel } from '../../game/src/rules/progression.js';
import { deriveHero } from '../../game/src/rules/stats.js';
import { relicItem } from '../../game/src/rules/loot.js';
import { allPagesDone } from '../../game/src/rules/codex.js';
import { createRng } from '../../game/src/core/rng.js';
import { RELICS } from '../../game/src/data/relics.js';
import { ENDINGS } from '../../game/src/data/endings.js';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, END = 'rekindle', FROM = 'deep', out = `/tmp/g3-finale-${END}-${FROM}`] = process.argv.slice(2);
if (!ENDINGS[END]) throw new Error('no such ending: ' + END);
mkdirSync(out, { recursive: true });
// level 38: M7 tunes the Hearth Below for a party of about 36.5 (data/encounters.js, BELOW_WAKE), its foes climbing
// four levels a Waking; on auto, parties at 24 and 32 lost the chain gate's unmade. M7's own end-to-end check uses 38.
const LEVEL = Number(process.env.LEVEL) || 38;

// ---- the journey so far, by M7's rules: Acts One and Two, the fifth Council, the Hollow Council freed ----
let g = newGame({ name: 'Wren', starter: 'hearthbrand', seed: 21 });
const rng = createRng('finale:' + END);
for (const id of g.party.active) {
  let h = g.party.roster[id];
  const need = xpForLevel(LEVEL) - (h.xp || 0);
  if (need > 0) h = grantXp(h, need, rng).hero;
  const d = deriveHero(h, g.inventory);
  g.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
}
const BRANDS = ['brand-of-briars', 'brand-of-the-heartroot', 'brand-of-glass', 'brand-of-ash', 'brand-of-iron', 'brand-of-frost', 'brand-of-lanterns', 'brand-of-the-deep'];
const f = g.progress.flags;
f.story = { ...f.story, 'intro-done': true };
for (const k of ['act1-complete', 'council-done', 'sunscorch-complete', 'council-2-done', 'ironspire-complete', 'council-3-done', 'gloomfen-complete', 'council-4-done', 'council-5-done']) f.story[k] = true;
for (const b of BRANDS) f.story['letter:' + b] = true;
const won = (ids) => { for (const enc of ids) { f.done[enc] = true; f.cleared[enc] = true; f.beaten = { ...(f.beaten || {}), [enc]: 1 }; } };
won(['keep-vault', 'briarmaw-den', 'rotwarden-heart', 'kharzul-heart', 'ashen-warden', 'mother-anvil', 'rime-abbot', 'lantern-mother', 'blackwater-leviathan',
  'hollow-miravel', 'hollow-qasim', 'hollow-brundar', 'hollow-gretch', 'as-thralls']);
g.progress.brands = BRANDS.slice();
g.progress.waking = 8;
g.progress.act = 3;
f.seen = { ...(f.seen || {}), 'card:below': true };
f.kindled = { ...f.kindled, 'under-coal': true };
if (FROM === 'heart') {
  won(['cd-unmade', 'wf-warden', 'unsmith']);
  for (const k of ['tamsin-returned', 'met-tamsin-below']) f.story[k] = true;
  f.kindled['chain-fire'] = true;
  g.progress.pos = { map: 'worldforge', x: 28, y: 11, face: 'e' };
} else g.progress.pos = { map: 'chained-deep', x: 2, y: 3, face: 's' };
if (END === 'anew') {
  // the price of Kindle Anew: Fenwick's Poker, a Masterpiece (as M7's own end-to-end check makes one) and every page
  const poker = relicItem('fenwicks-poker', createRng('finale-poker'), { from: 'Fenwick', where: 'Hearthstone Keep', day: 30 });
  g.inventory.push(poker);
  g.inventory.push({ ...poker, uid: 'mp-finale', base: 'longsword', kind: 'sword', slot: 'weapon', rarity: 'primal', name: "Wren's Answer", masterpiece: true, power: 'masterpiece-kindle', affixes: [] });
  const passed = Object.keys(RELICS).filter((id) => RELICS[id].starter && !g.codex[id]?.claimed);
  for (const id of Object.keys(RELICS)) if (!passed.includes(id)) g.codex[id] = { sighted: true, claimed: true, awakened: false };
  if (!allPagesDone(g)) throw new Error('the Codex is not full');
}

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
const onMap = (m) => page.waitForFunction((m) => window.__g3.world.walk.map === m && !window.__g3.world.busy, m, { timeout: 120000 }).catch(() => {});

// every story card that opens (the ending's, the credits, the last), kept with its words, as it comes
await page.addInitScript((save) => {
  if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('aethermoor.save.3d', save); sessionStorage.setItem('seeded', '1'); }
  window.__cards = [];
  new MutationObserver(() => {
    for (const n of document.querySelectorAll('.ov-story:not([data-seen])')) { n.setAttribute('data-seen', ''); setTimeout(() => window.__cards.push({ cls: n.className, text: n.innerText }), 400); }
  }).observe(document, { childList: true, subtree: true });
}, JSON.stringify(g));
const url = /^https?:/.test(file) ? file : 'file://' + path.resolve(file);
await page.goto(url + (url.includes('?') ? '&' : '?') + 'auto=1&speed=4');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
check(!(await E(() => window.__err)), 'the page loads');
await page.click('#titlebtns .g3-big.primary');
await page.waitForFunction(() => window.__g3.world && window.__g3.world.walk && window.__g3.shown, null, { timeout: 300000 });
await settle();
let s = await state();
check(s.map === g.progress.pos.map, `"Go on" stands the party in ${g.progress.pos.map} (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('start');

if (FROM === 'deep') {
  const f0 = await E(() => window.__g3.fights || 0);
  for (let i = 0; i < 8; i++) { s = await walkTo(41, 13, { map: 'chained-deep', pick: /Stand with us|Go|Leave/i }); if (s.map !== 'chained-deep') break; }
  await onMap('worldforge'); await settle();
  s = await state();
  const tamsin = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return !!(g && g.progress.flags.story['tamsin-returned']); });
  check(s.map === 'worldforge' && tamsin, `the Chained Deep crossed: the chain gate, Tamsin back with the party, the forge door (${s.map} ${s.x},${s.y}; ${(await E(() => window.__g3.fights || 0)) - f0} fights)`);
  await page.waitForTimeout(1500); await shot('worldforge');
  // the bridge's grate stands until its warden is beaten (walkTo fights the guard), then the Unsmith's word: "Face him."
  for (let i = 0; i < 6; i++) { s = await walkTo(25, 11, { map: 'worldforge' }); if (s.x === 25 && s.y === 11) break; }
  check(s.x === 25 && s.y === 11, `over the bridge to the smith's place (${s.x},${s.y})`);
  const before = await E(() => window.__g3.fights || 0);
  await useThing('unsmith', { pick: /Face him/ });
  await settle({ pick: /Face him/ });
  const beaten = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return !!(g && g.progress.flags.beaten && g.progress.flags.beaten.unsmith); });
  check(beaten && (await E(() => window.__g3.fights || 0)) > before, `the Unsmith fought in 3D and won (${await E(() => window.__g3.lastResult)})`);
  await page.waitForTimeout(1500); await shot('unsmith-beaten');
}

// the heart: its choices as M7 shows them, then the ending's own choice and its last word
const heartAt = await E(() => window.__g3.world.besideOf('wf-heart'));
await walkTo(heartAt.x, heartAt.y, { map: 'worldforge' });
await E((d) => window.__g3.world.faceTo(d), heartAt.face);
await E(() => window.__g3.world.pressA());
await page.waitForSelector('.dlg-choice', { timeout: 60000 }).catch(() => {});
for (let i = 0; i < 20 && !(await page.$('.dlg-choice')); i++) { await page.click('.dlg-next').catch(() => {}); await page.waitForTimeout(250); }
const shown = await E(() => [...document.querySelectorAll('.dlg-choice')].map((c) => ({ text: (c.querySelector('.dlg-choice-t') || c).textContent.trim(), off: c.disabled, why: [...c.querySelectorAll('.dlg-why-r')].map((r) => r.textContent.trim()).join(' / ') })));
log('the heart offers:', JSON.stringify(shown));
await shot('heart');
const anew = shown.find((c) => /Kindle Anew/.test(c.text));
check(shown.some((c) => /^Rekindle/.test(c.text) && !c.off) && shown.some((c) => /^Release/.test(c.text) && !c.off), 'the heart offers Rekindle and Release');
if (END === 'anew') check(anew && !anew.off, 'Kindle Anew can be chosen (the Poker, the Masterpiece, every page)');
else check(anew && anew.off && !!anew.why, `Kindle Anew is shown shut, with its reasons (${anew ? anew.why : 'not shown'})`);
const PICK = { rekindle: /Rekindle/, release: /Release/, anew: /Kindle Anew/ }[END];
await playDialogue(PICK);
await settle({ pick: PICK });
for (let i = 0; i < 40 && (await E(() => window.__cards.length)) < 3; i++) { await settle({ pick: PICK }); await page.waitForTimeout(500); }
await page.waitForTimeout(800);
const cards = await E(() => window.__cards);
log('cards:', cards.map((c) => c.cls.replace('ov-story', '').trim()).join(' · '));
const card = cards.find((c) => /\bending\b/.test(c.cls));
const W = ENDINGS[END];
check(!!card && card.text.includes(W.name) && card.text.includes(W.text), `the ending's card: ${W.name} ("${card ? card.text.replace(/\s+/g, ' ').slice(0, 140) : 'none'}")`);
if (END === 'anew') check(!!card && card.text.includes("Wren's Answer"), 'Kindle Anew names the Masterpiece');
check(cards.some((c) => /credits/.test(c.cls)) && cards.some((c) => /last-card/.test(c.cls)), 'the credits and the last card');
await onMap('keep-hall'); await settle();
s = await state();
check(s.map === 'keep-hall', `back in the Great Hall, where the game goes on (${s.map} ${s.x},${s.y})`);
await page.waitForTimeout(1500); await shot('great-hall');
const saved = await E(() => { const g = JSON.parse(localStorage.getItem('aethermoor.save.3d') || 'null'); return g && { ending: g.ending, quest: !!(g.progress.flags.story['claimed:hollow-council'] || (g.quests && g.quests['hollow-council'] && g.quests['hollow-council'].done)), map: g.progress.pos.map }; });
check(saved && saved.ending === END, `the ending saved for good under the 3D game's own key (${JSON.stringify(saved)})`);
check(!(await E(() => localStorage.getItem('aethermoor.save.m7'))), "M7's own key never written");

console.log('\n' + results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
console.log(`${results.filter((r) => r[0]).length} of ${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(errs.length ? 'page errors:\n' + errs.slice(0, 20).join('\n') : 'no page errors');
await b.close();
process.exit(results.every((r) => r[0]) && !errs.length ? 0 : 1);
