// Headless check of the Party screen (November 20): open it from the walk, look at Wren turning in 3D, switch to Pip,
// and go back to walking.   NODE_PATH=$(npm root -g) node battle/check-party.mjs out-dir
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
await p.goto('file://' + path.join(here, '..', 'dist', process.env.PAGE || 'm7-fight-768.html') + '?quality=phone', { timeout: 180000 });
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await p.waitForTimeout(4000);
await p.click('#partybtn');
await p.waitForTimeout(5000);
await p.screenshot({ path: path.join(out, 'p1-wren.png') });
await p.click('#tab-pip');
await p.waitForTimeout(4000);
await p.screenshot({ path: path.join(out, 'p2-pip.png') });
await p.click('.screen-party .back');
await p.waitForTimeout(3000);
console.log('walking again', await p.evaluate(() => !window.__fight.W.paused && document.getElementById('fight').hidden));
await p.screenshot({ path: path.join(out, 'p3-back.png') });
console.log(errs.join('\n'));
await b.close();
