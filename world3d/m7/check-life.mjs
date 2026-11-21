// check-life.mjs (Places, step 4): what comes alive in each place (m7/life.js kinds), page errors, a still from the walk
// and one from high behind after a few seconds of the world's clock, so the particles are mid-flight.
//   NODE_PATH=$(npm root -g) node m7/check-life.mjs dist/<page>.html out-dir [ids]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [file, out = '.cache/shots/life', only] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 560 } }); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + path.resolve(file) + '?test'); await p.waitForFunction(() => window.__ready || window.__err, null, { timeout: 240000 });
const ids = only ? only.split(',') : await p.evaluate(() => Object.keys(window.M7_PLACES));
for (const id of ids) {
  const r = await p.evaluate(async (id) => { const m = window.__m7; if (m.cur !== id) await m.go(id); m.W.step(4, 30); return m.life ? m.life.kinds : []; }, id);
  await p.screenshot({ path: `${out}/${id}-walk.jpg`, quality: 72 });
  await p.evaluate(() => { const W = window.__m7.W; W.setCam(null, 0.6, 16); W.step(0.5, 30); });
  await p.screenshot({ path: `${out}/${id}-over.jpg`, quality: 72 });
  await p.evaluate(() => { window.__m7.W.setCam(null, null, null); });
  console.log(id + ':', r.join(', ') || '(nothing)');
}
console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 10).join('\n') : 'no errors'); await b.close();
