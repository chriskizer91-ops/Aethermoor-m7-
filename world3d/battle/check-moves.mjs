// The Champions' moves, each seen (step 5): plays a fight with Auto and, at every foe move it has not yet seen, waits
// for the move's effects to show and takes a still (out-dir/<move>.png), then lets the fight go on. Prints the moves
// seen, in order, and the result.
//   NODE_PATH=$(npm root -g) node battle/check-moves.mjs <page.html> <out-dir> [query]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, out, q = 'enc=briarmaw-den&go=1&auto=1&speed=1&quality=phone&foes=hd&level=10'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => {
  window.__moves = []; window.__wait = null;
  globalThis.__btHooks = { log() {}, peak(ev) {
    // the blow of a move just seen landing (its first damage or status): a second still, as its effects show
    if (window.__landing && (ev.t === 'damage' || ev.t === 'status')) { const n = window.__landing; window.__landing = null; window.__land = n; return new Promise((r) => { window.__wait = r; }); }
    if (ev.t !== 'move' || !ev.name || window.__moves.includes(ev.name)) return null;
    const u = window.__fight?.battle?.units?.[ev.actor]; if (u && u.side !== 'foe') return null;
    window.__moves.push(ev.name); window.__landing = ev.name; return new Promise((r) => { window.__wait = r; });
  } };
});
await p.goto('file://' + path.resolve(page) + '?' + q, { timeout: 180000 });
await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
let shot = 0;
for (;;) {
  const s = await p.waitForFunction(() => (window.__wait && 'move') || (window.__fight.result && 'end'), null, { polling: 300, timeout: 1800000 }).then((h) => h.jsonValue()).catch(() => 'timeout');
  if (s !== 'move') break;
  // the move began a little before its event peaked: give its effects a moment, then a still
  await p.waitForTimeout(900);
  const land = await p.evaluate(() => { const n = window.__land; window.__land = null; return n; });
  const name = land ? land + '-lands' : await p.evaluate(() => window.__moves[window.__moves.length - 1]);
  if (land) await p.waitForTimeout(-400 + 700);
  await p.screenshot({ path: path.join(out, `${String(++shot).padStart(2, '0')}-${name.replace(/[^\w]+/g, '-')}.png`) });
  await p.evaluate(() => { const r = window.__wait; window.__wait = null; r && r(); });
}
console.log('moves', JSON.stringify(await p.evaluate(() => window.__moves)), 'result', await p.evaluate(() => window.__fight.result));
console.log(errs.join('\n'));
await b.close();
