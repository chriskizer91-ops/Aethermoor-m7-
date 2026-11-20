// Headless check of the Legend Strike close-up (step 3): every hero's surge full, Auto, and stills when the first Legend
// Strike begins (M7's battle screen pauses on its 'legend' event through its test hook) and a moment later.
//   NODE_PATH=$(npm root -g) node battle/check-legend.mjs <page.html> <out-dir> [query]
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, out, q = 'go=1&auto=1&speed=1&quality=phone&surge=100'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => {
  window.__legend = 0;
  globalThis.__btHooks = { log() {}, peak(ev) { if (ev.t === 'legend' && !window.__legend) { window.__legend = 1; return new Promise((r) => { window.__go = r; }); } return null; } };
});
await p.goto('file://' + path.resolve(page) + '?' + q, { timeout: 180000 });
await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
await p.waitForFunction(() => window.__legend, null, { timeout: 600000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: path.join(out, 'legend-1.png') });
await p.evaluate(() => window.__go && window.__go());
await p.waitForTimeout(2500);
await p.screenshot({ path: path.join(out, 'legend-2.png') });
console.log('legend seen', errs.join('\n'));
await b.close();
