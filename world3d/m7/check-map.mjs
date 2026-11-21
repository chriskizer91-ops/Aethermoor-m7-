// check-map.mjs (Places, the place map): the small map and the big map in a place, on a phone-sized page (and errors).
//   NODE_PATH=$(npm root -g) node m7/check-map.mjs dist/<page>.html out-dir id,id
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [file, out, ids] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext(Object.assign({}, devices['Pixel 7'], { deviceScaleFactor: 2 }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('file://' + path.resolve(file) + '?test'); await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
for (const id of ids.split(',')) {
  await p.evaluate(async (id) => { const m = window.__m7; if (m.cur !== id) await m.go(id); m.W.step(0.5, 30); }, id);
  await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${id}-small.jpg`, quality: 72 });
  await p.click('.m7mm'); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/${id}-big.jpg`, quality: 72 });
  await p.click('.m7back'); await p.waitForTimeout(200);
  console.log(id, await p.evaluate(() => ({ open: window.__m7.mm.isOpen, paused: window.__m7.W.paused })));
}
console.log(errs.length ? errs : 'no errors'); await b.close();
