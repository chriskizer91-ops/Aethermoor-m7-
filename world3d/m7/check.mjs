// check.mjs (Places, November 20): loads a built m7 page headless, visits every place on it, and takes a still from above
// and one from the walker's own camera for each, plus any page errors. Prints a line per place.
//   NODE_PATH=$(npm root -g) node m7/check.mjs dist/m7-sunscorch-512.html out-dir [ids]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const [file, out = '.cache/shots', only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + path.resolve(file) + '?test');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 180000 });
const ids = only ? only.split(',') : await page.evaluate(() => Object.keys(window.M7_PLACES));
for (const id of ids) {
  const t0 = Date.now();
  await page.evaluate(async (id) => { if (window.__m7.cur !== id) await window.__m7.go(id); }, id);
  await page.waitForTimeout(300);
  const n = await page.evaluate(() => { const W = window.__m7.W; W.step(0.5, 30); W.guide(true, false); W.render(); return W.numbers(); });
  await page.screenshot({ path: `${out}/${id}-top.jpg`, quality: 70 });
  await page.evaluate(() => { const W = window.__m7.W; W.guide(false); W.step(0.3, 30); });
  await page.screenshot({ path: `${out}/${id}-walk.jpg`, quality: 70 });
  await page.evaluate(() => { const W = window.__m7.W; W.setCam(null, 0.75, 30); W.step(0.1, 30); });
  await page.screenshot({ path: `${out}/${id}-over.jpg`, quality: 70 });
  await page.evaluate(() => { const W = window.__m7.W; W.setCam(null, null, null); });
  console.log(id, (Date.now() - t0) + ' ms', Math.round(n.triangles / 1000) + 'k tris', n.calls + ' calls');
}
// every way out, taken in the page: the party lands at the anchor, on ground it can walk
if (process.env.EXITS) for (const id of ids) {
  const ex = await page.evaluate((id) => window.W3D_PLACES['m7-' + id].exits.filter((e) => window.W3D_PLACES['m7-' + e.to]).map((e) => [e.to, e.anchor]), id);
  for (const [to, anchor] of ex) {
    const r = await page.evaluate(async ([id, to, anchor]) => { const m = window.__m7; if (m.cur !== id) await m.go(id); await m.go(to, anchor); const io = m.W.io; return { cur: m.cur, ok: m.W.P.walkable(io.px, io.py) }; }, [id, to, anchor]);
    console.log(`  ${id} -> ${to} (${anchor}): ${r.cur === to && r.ok ? 'ok' : 'PROBLEM ' + JSON.stringify(r)}`);
  }
}
console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 20).join('\n') : 'no errors');
await browser.close();
