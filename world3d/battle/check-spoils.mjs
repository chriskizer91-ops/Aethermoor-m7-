// Headless check of the spoils (November 20): a fight with Auto, then the drops on the ground, M7's after-fight screen,
// a chest opened into M7's card reveal, and (if the card offers it) equipping the piece on a hero.
//   NODE_PATH=$(npm root -g) node battle/check-spoils.mjs out-dir [query]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2], q = process.argv[3] || 'go=1&auto=1&speed=4&quality=phone';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
await p.goto('file://' + path.join(here, '..', 'dist', process.env.PAGE || 'm7-fight-768.html') + '?' + q, { timeout: 180000 });
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await p.waitForFunction(() => window.__fight.result, null, { timeout: 900000 });
console.log('result', await p.evaluate(() => window.__fight.result));
await p.waitForTimeout(3200);
await p.screenshot({ path: path.join(out, 'a-drops.png') });
await p.waitForSelector('.screen-aftermath', { timeout: 60000 });
await p.waitForTimeout(2500);
await p.screenshot({ path: path.join(out, 'b-aftermath.png') });
const chests = await p.$$('button.chest');
console.log('chests', chests.length);
if (chests.length) {
  await chests[0].click();
  await p.waitForTimeout(4000);
  await p.screenshot({ path: path.join(out, 'c-card.png') });
  const btns = await p.$$eval('button', (bs) => bs.filter((x) => x.offsetParent).map((x) => x.textContent.trim()).filter(Boolean).slice(0, 30));
  console.log('buttons', JSON.stringify(btns));
  const before = await p.evaluate(() => { window.__A0 = window.__fight.arena.heroes.get('warden').A; return true; });
  const eq = p.locator('button', { hasText: /^Equip on / }).first();
  if (before && await eq.count()) {
    await eq.click();
    await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(out, 'd-equip.png') });
    const keep = p.locator('button', { hasText: /Continue|Close|Keep it in the bag/ }).first();
    if (await keep.count()) await keep.click();
    await p.waitForTimeout(2500);
    await p.screenshot({ path: path.join(out, 'e-redressed.png') });
    console.log('re-dressed', await p.evaluate(() => window.__fight.arena.heroes.get('warden').A !== window.__A0));
  }
}
console.log(errs.join('\n'));
await b.close();
