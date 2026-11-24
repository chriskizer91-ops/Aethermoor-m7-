// node docs/project/tools/loadcheck.mjs <page.html> [query]: the hub's start-up check. Opens a built page at phone size (390 x 844),
// waits for __ready (or __err), then for the place and its people to be shown (__g3.shown), then 8 s more, and prints
// every console and page error. Run it from world3d/dist with NODE_PATH=$(npm root -g). Use ?new=1 on Act One and
// ?act2=1 on a region page (robed townsfolk stand at the Ironspire's east postern: that is where a Lite fault showed).
import { createRequire } from 'node:module'; const pw = createRequire(import.meta.url)('playwright');
import { pathToFileURL } from 'node:url';
const [file, q = ''] = process.argv.slice(2);
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const t0 = Date.now();
await page.goto(pathToFileURL(file).href + q, { timeout: 180000 });
const ok = await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 400000 }).then(() => true).catch(() => false);
await page.waitForFunction(() => !window.__g3 || window.__g3.shown, null, { timeout: 120000 }).catch(() => errs.push('place never shown'));
await page.waitForTimeout(+(process.env.WAIT || 8000)); // after ready: townsfolk, followers and the first place are built a little later
console.log(file.split('/').pop(), 'ready:', ok, 'err:', await page.evaluate(() => window.__err || ''), `${((Date.now() - t0) / 1000).toFixed(0)} s`, errs.length, errs.slice(0, 5));
await b.close();
