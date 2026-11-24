// Is anyone standing in a wall? (Chris, November 24: the leftmost hero inside the Hollow Hall's wall.) Loads each
// fight, holds it at its first event, and tests every fighter's stand, and a ring round it (their body's width), against
// the place's walkable floor. Prints the stands that aren't clear. Fails on any page error.
//   NODE_PATH=$(npm root -g) node battle/check-stands.mjs <page.html> <encounter> [<encounter> ...]
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, ...encs] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
await Promise.all(encs.map(async (enc) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { globalThis.__btHooks = { log() {}, peak(ev) { if (!window.__held && (ev.t === 'intent' || ev.t === 'round' || ev.t === 'turn' || ev.t === 'move')) { window.__held = 1; return new Promise(() => {}); } return null; } }; });
  await p.goto('file://' + path.resolve(page) + `?enc=${enc}&go=1&auto=1&speed=1&quality=phone`, { timeout: 180000 });
  await p.waitForFunction(() => window.__held && window.__fight?.battle, null, { timeout: 600000 });
  const r0 = await p.evaluate(() => {
    const a = window.__fight.arena, P = a.W.P, M = P.M; a.manual = true; a.stepBy(1.5, 5);
    const ok = (x, z) => { try { return !!P.walkable(M.px(x), M.py(z)); } catch (e) { return true; } };
    const test = (who, pos, r) => { const miss = []; if (!ok(pos.x, pos.z)) miss.push('centre'); for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; if (!ok(pos.x + Math.cos(t) * r, pos.z + Math.sin(t) * r)) miss.push(k); } return miss.length ? `${who} at ${pos.x.toFixed(1)},${pos.z.toFixed(1)}: ${miss.join(' ')}` : null; };
    const out = [];
    for (const h of a.heroes.values()) out.push(test('hero ' + h.id, h.home, 0.35));
    for (const F of a.foes.values()) out.push(test('foe ' + F.key, F.home, Math.max(0.3, (F.size?.w || 0.6) * 0.5)));
    out.push("place " + P.place?.id + " " + (P.place?.name || "")); return out.filter(Boolean);
  });
  const where = r0.pop(), r = r0; console.log(`${enc} [${where}]: ${r.length ? r.length + ' not clear\n  ' + r.join('\n  ') : 'all clear'}${errs.length ? '\n  ERRORS: ' + errs.join('; ') : ''}`);
  bad += r.length + errs.length; await p.close();
}));
await b.close();
process.exit(bad ? 1 : 0);
