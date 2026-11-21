// Every move of a fight's Champion or Relic-Bearer, played one after another on the real arena (step 5): loads a fight,
// holds it at its first event, then for each of the big foe's moves (M7's own list, game/src/data/foes.js) sets it as
// the foe's intent, starts it as the battle screen would (arena.foeAttack), and with the arena's clock held takes three
// stills: as it bursts out (-a), half a second in, its shots in the air (-b), and as it lands (-c). Fails on any page error.
//   NODE_PATH=$(npm root -g) node battle/check-moments.mjs <page.html> <out-dir> <encounter> [family[/variant]] [query]
// (the foe defaults to the encounter's first Champion or Relic-Bearer)
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { FOES } from '../../game/src/data/foes.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, out, enc, who, q = 'quality=phone'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const BIG = new Set(['champion', 'relic-bearer', 'hollow', 'unsmith']);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'warning' && /moment|fx|effects|champions/i.test(m.text())) errs.push('warn: ' + m.text()); });
await p.addInitScript(() => { globalThis.__btHooks = { log() {}, peak(ev) { if (!window.__held && (ev.t === 'intent' || ev.t === 'round' || ev.t === 'turn' || ev.t === 'move')) { window.__held = 1; return new Promise(() => {}); } return null; } }; });
await p.goto('file://' + path.resolve(page) + `?enc=${enc}&go=1&auto=1&speed=1&${q}`, { timeout: 180000 });
await p.waitForFunction(() => window.__held && window.__fight?.battle, null, { timeout: 600000 });
// the big foe on the field, and its moves in M7
const units = await p.evaluate(() => Object.values(window.__fight.battle.units).map((u) => ({ id: u.id, side: u.side, family: u.family, variant: u.variant || null })));
const tierOf = (u) => { const f = FOES[u.family]; return f && ((u.variant && f.variants?.[u.variant]?.tier) || f.tier); };
const foe = units.find((u) => u.side === 'foe' && (who ? `${u.family}${u.variant ? '/' + u.variant : ''}` === who || u.family === who : BIG.has(tierOf(u))));
if (!foe) { console.log('no such foe in', enc, JSON.stringify(units)); await b.close(); process.exit(1); }
const F = FOES[foe.family], mv = (foe.variant && F.variants?.[foe.variant]?.moves) || F.moves;
const hero = units.find((u) => u.side === 'hero')?.id;
console.log(`${enc}: ${foe.family}${foe.variant ? '/' + foe.variant : ''}, ${Object.keys(mv).length} moves`);
await p.evaluate(() => { const a = window.__fight.arena; a.manual = true; a.stepBy(1.2); });
let n = 0;
for (const [id, m] of Object.entries(mv)) {
  const tag = `${String(++n).padStart(2, '0')}-${id}`;
  const self = m.target === 'self' || m.target === 'all-allies' || m.target === 'ally';
  const r = await p.evaluate(({ fid, id, name, tgt }) => {
    const a = window.__fight.arena, u = window.__fight.battle.units[fid];
    u.intent = { move: id, name, target: tgt }; u.intent2 = null;
    a.foeAttack(fid, u);
    const G = a.foes.get(fid); return { moment: !!G?.act?.moment, cam: G?.act?.moment?.camera || null, kmove: G?.act?.kmove };
  }, { fid: foe.id, id, name: m.name, tgt: self ? foe.id : hero });
  await p.evaluate(() => window.__fight.arena.stepBy(0.15)); await p.screenshot({ path: path.join(out, `${tag}-a.png`) });
  await p.evaluate(() => window.__fight.arena.stepBy(0.35)); await p.screenshot({ path: path.join(out, `${tag}-b.png`) });
  await p.evaluate(() => { const a = window.__fight.arena, G = a.movingFoe(); if (G) { G.act.bit = true; G.act.bitT = G.act.t; a.landed(G); } a.stepBy(0.25); });
  await p.screenshot({ path: path.join(out, `${tag}-c.png`) });
  // done: the foe home, the effects cleared, the camera back
  await p.evaluate(() => { const a = window.__fight.arena; for (const G of a.foes.values()) G.act = null; a.fx.clear(); a.close = null; a.stage?.host.classList.remove('f3-close'); a.stepBy(1.0); });
  console.log(`  ${m.name} (${id}): ${r.moment ? 'moment' : 'NO MOMENT'}, body ${r.kmove}${r.cam ? ', camera ' + r.cam : ''}`);
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
await b.close();
process.exit(errs.length ? 1 : 0);
