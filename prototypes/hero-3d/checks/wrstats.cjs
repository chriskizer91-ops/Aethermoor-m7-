const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(3000);
  const rows = await p.evaluate(async () => { const out = []; for (const k of ['drowned','bell-ringer','drowned-choir','drowned-cantor','drowned-abbess','choir-wraith','rime-wraith','rime-abbot','lantern-mother','mirage-wisp','wisp-queen']) {
    const { buildWraith } = window.__wr || {}; const W = __w; W.S.key = k; W.S.detail = 'high'; await W.show(); const hi = W.figs[0]; W.S.detail = 'light'; await W.show(); const lo = W.figs[0]; out.push([k, hi.triangles, hi.draws, lo.triangles, lo.draws]); } return out; });
  for (const r of rows) console.log(r.join('\t'));
  await p.screenshot({ path: process.argv[3] + '/wr-phone.png' });
  console.log('scrollW', await p.evaluate(() => document.documentElement.scrollWidth), errs.slice(0, 3));
  await b.close();
})();
