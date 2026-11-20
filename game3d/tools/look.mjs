// game3d/tools/look.mjs: open the built page headless and take stills (a quick look while building).
//   node game3d/tools/look.mjs <page.html> <out-dir> [query] [w] [h]
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)(path.join(process.env.NODE_PATH || '/usr/local/lib/node_modules', 'playwright'));
const [file, out, q = 'new=1', W = 390, H = 844] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await p.goto('file://' + path.resolve(file) + '?' + q);
await p.waitForFunction(() => window.__ready || window.__err, null, { timeout: 240000 }).catch(() => console.log('timeout'));
console.log('err', await p.evaluate(() => window.__err));
for (const [i, ms] of [2500, 6000].entries()) { await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, 'a' + i + '.png') }); }
console.log(await p.evaluate(() => { const w = window.__g3?.world; return w && w.walk ? JSON.stringify({ map: w.walk.map, x: w.walk.x, y: w.walk.y, io: [w.W.io.px, w.W.io.py] }) : 'no walk'; }));
console.log(errs.slice(0, 20).join('\n'));
await b.close();
