// Headless check of the Fight page (November 20): loads dist/m7-fight-512.html in Playwright's Chromium (software GL),
// walks into a fight (?go=1), plays it with Auto, and takes stills: the walk, the swing round, the fight, the end.
//   NODE_PATH=$(npm root -g) node battle/check.mjs [out-dir] [query] [w] [h]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || '/tmp/fight-shots', q = process.argv[3] || 'go=1&auto=1&speed=2', W = +(process.argv[4] || 390), H = +(process.argv[5] || 844);
const file = path.join(here, '..', 'dist', process.env.PAGE || 'm7-fight-512.html');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await p.goto('file://' + file + '?' + q);
await p.waitForFunction(() => window.__ready || window.__err, null, { timeout: 120000 });
const err = await p.evaluate(() => window.__err);
if (err) { console.log('ERR', err); }
const shot = async (n) => { await p.screenshot({ path: path.join(out, n + '.png') }); console.log('shot', n); };
const seq = (process.env.SHOTS || '1500,3500,7000,12000').split(',').map(Number);
let t0 = Date.now();
for (const [i, ms] of seq.entries()) { await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await shot('s' + i); }
const end = await p.waitForFunction(() => window.__fight && window.__fight.result, null, { timeout: +(process.env.WAIT || 240000) }).then(() => true).catch(() => false);
await p.waitForTimeout(1200); await shot('end');
await p.waitForTimeout(3000); await shot('after');
console.log('result', await p.evaluate(() => window.__fight && window.__fight.result), 'ended?', end);
console.log(errs.slice(0, 30).join('\n'));
await b.close();
