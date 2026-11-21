// Headless check of the walkers' page (session 8; adapted from prototypes/foe-hd/tools/check.mjs, session 6): it loads
// with no errors on a laptop and a phone screen; screenshots of a foe standing, mid-move, and the crowd, with the frame rate.
//   node tools/check.mjs dist/walkers.html OUT_DIR [foe] [move:u ...]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const [file, out, foe = '', ...moves] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const f = foe ? `foe=${foe}&` : '';
const shots = [['laptop', { width: 1280, height: 800 }, `?${f}`], ['phone', { width: 390, height: 844 }, `?${f}`], ['crowd', { width: 1280, height: 800 }, `?${f}crowd`]];
for (const m of moves) { const [mv, yaw, u] = m.split(':'); shots.push([`move-${mv}`, { width: 700, height: 800 }, `?${f}move=${mv}&yaw=${yaw || 0.5}${u ? `&u=${u}` : ''}`]); }   // move:yaw:u
for (const [name, vp, q] of shots) {
  const page = await browser.newPage({ viewport: vp });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(file) + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.waitForTimeout(name === 'crowd' ? 8000 : name.startsWith('move') ? 2500 : 5000);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: name === 'phone' });
  console.log(name, 'fps:', await page.textContent('#fps'), 'errors:', errs.length ? errs.slice(0, 5) : 'none');
  await page.close();
}
await browser.close();
