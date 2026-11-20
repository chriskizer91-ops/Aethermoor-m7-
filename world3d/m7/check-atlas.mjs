// check-atlas.mjs (Places, step 3): opens the atlas page headless, takes stills (whole land, near the party, a card),
// taps a kindled flame and its Travel button, and checks what M7_ATLAS.open sent back; then Back gives null.
//   NODE_PATH=$(npm root -g) node m7/check-atlas.mjs dist/m7-atlas.html out-dir
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [file, out = '.cache/shots/atlas'] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 420, height: 800 } });
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + path.resolve(file));
await page.waitForFunction(() => window.__ready && document.querySelector('#m7atlas .ma-load') && getComputedStyle(document.querySelector('#m7atlas .ma-load')).display === 'none', null, { timeout: 240000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out + '/1-party.jpg', quality: 72 });
await page.click('#m7atlas .ma-top .ma-btn'); // find the party (again)
await page.evaluate(() => window.M7_ATLAS && 0);
// the whole land
await page.evaluate(() => { const r = document.querySelector('#m7atlas'); r && 0; });
const sandspire = await page.evaluateHandle(() => [...document.querySelectorAll('#m7atlas .ma-pin')].find((p) => p.textContent.includes('Sandspire')));
await sandspire.asElement().evaluate((e) => e.click());
await page.waitForTimeout(2500);
await page.screenshot({ path: out + '/2-card.jpg', quality: 72 });
const btn = await page.$('#m7atlas .ma-card .ma-btn.go');
console.log('card:', await page.textContent('#m7atlas .ma-card'));
if (btn) await btn.click();
await page.waitForTimeout(300);
console.log('sent back:', JSON.stringify(await page.evaluate(() => window.__last)));
await page.click('#go'); await page.waitForTimeout(3000);
await page.evaluate(() => window.M7_ATLAS && 0);
await page.screenshot({ path: out + '/3-again.jpg', quality: 72 });
await page.click('#m7atlas .ma-top .ma-btn:last-child'); await page.waitForTimeout(300);
console.log('after Back:', JSON.stringify(await page.evaluate(() => window.__last)), await page.textContent('#out'));
console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 10).join('\n') : 'no errors');
await b.close();
