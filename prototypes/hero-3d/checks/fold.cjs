const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/Aethermoor-m7-/prototypes/hero-3d/dist/gear-room.html'); await p.waitForTimeout(5000);
  await p.screenshot({ path: (process.argv[2] || '.') + '/fold-closed.png' });
  const sizes = await p.evaluate(() => [...document.querySelectorAll('.fold')].map(b => { const r = b.getBoundingClientRect(); return [b.textContent, Math.round(r.width), Math.round(r.height)]; }));
  for (const el of await p.$$('.fold')) await el.tap();
  await p.waitForTimeout(800); await p.screenshot({ path: (process.argv[2] || '.') + '/fold-open.png' });
  const after = await p.evaluate(() => [...document.querySelectorAll('.fold')].map(b => b.getAttribute('aria-expanded')));
  console.log(JSON.stringify(sizes), JSON.stringify(after), 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth), errs.slice(0, 2));
  await b.close();
})();
