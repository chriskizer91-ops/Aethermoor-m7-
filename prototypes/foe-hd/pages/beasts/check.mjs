// Headless check of the gallery: loads with no errors (laptop and phone sizes), screenshots of each foe, its moves and
// the pack, with the frame rate.   node check.mjs dist/beasts.html OUT_DIR [foe,foe] [moves]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const [file, out, foesArg, movesArg] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const url = 'file://' + path.resolve(file);
const foes = (foesArg || 'thornhound').split(',');
const shots = [];
for (const k of foes) {
  shots.push([`${k}-laptop`, { width: 1280, height: 800 }, `#${k}`, 5000, false]);
  shots.push([`${k}-phone`, { width: 390, height: 844 }, `#${k}`, 5000, true]);
  for (const m of (movesArg || '').split(',').filter(Boolean)) {
    const [mv, u] = m.split(':');
    shots.push([`${k}-${mv}`, { width: 900, height: 700 }, `?move=${mv}&u=${u || 0.5}&still#${k}`, 600, false]);
  }
  shots.push([`${k}-pack`, { width: 1280, height: 800 }, `?pack#${k}`, 8000, false]);
}
for (const [name, vp, q, wait, full] of shots) {
  const page = await browser.newPage({ viewport: vp });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(url + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(name, '|', await page.textContent('#fps'), '| errors:', errs.length ? errs.slice(0, 4) : 'none', sw ? '| SIDEWAYS SCROLL' : '');
  await page.close();
}
await browser.close();
