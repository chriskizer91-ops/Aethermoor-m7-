// Headless check that the walkers come through the foe kit's foeLook (the Fight's path): main.js with ?kit.
//   node tools/kitcheck.mjs /abs/path/dist/walkers.html
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const q of ['?kit&foe=rotwarden&move=blacken', '?kit&foe=sapwight&move=grasp', '?kit&crowd']) {
  const p = await b.newPage({ viewport: { width: 700, height: 800 } }); const e = [];
  p.on('pageerror', (x) => e.push(String(x))); p.on('console', (m) => { if (m.type() === 'error') e.push(m.text()); });
  await p.goto('file://' + process.argv[2] + q); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.waitForTimeout(3000); await p.screenshot({ path: `${process.argv[3] || '.'}/kit-${q.replace(/\W/g, '')}.png` });
  console.log(q, e.length ? e : 'no errors'); await p.close();
}
await b.close();
