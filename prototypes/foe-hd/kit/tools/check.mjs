// Headless check: the page loads with no errors; screenshots of the stands and the crowd, with the frame rate.
//   node kit/tools/check.mjs dist/<page>.html OUT_DIR [sculpt]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
const [file, out, only] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const RUNS = only === 'sculpt' ? [['sculpt', { width: 1280, height: 800 }, '']] : [['laptop', { width: 1280, height: 800 }, ''], ['phone', { width: 390, height: 844 }, ''], ['crowd', { width: 1280, height: 800 }, '?crowd']];
for (const [name, vp, q] of RUNS) {
  const page = await browser.newPage({ viewport: vp });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(file) + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.waitForTimeout(name === 'crowd' ? 9000 : 5000);
  if (name === 'laptop' && (await page.$('#moves button[data-k="roar"]'))) { await page.click('#moves button[data-k="roar"]'); await page.waitForTimeout(800); }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: name === 'phone' });
  console.log(name, 'fps:', await page.textContent('#fps'), 'errors:', errs.length ? errs.slice(0, 5) : 'none');
  await page.close();
}
await browser.close();
