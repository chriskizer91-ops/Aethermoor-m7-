const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(3000);
  const rows = await p.evaluate(async () => { const out = []; for (const k of ['iron-sentinel','sentinel-captain','ashen-warden','unsmith']) { const W = __w; W.S.key = k; W.S.detail = 'high'; await W.show(); const hi = W.figs[0]; W.S.detail = 'light'; await W.show(); const lo = W.figs[0];
    const moves = lo.moves.MOVES.map(([m]) => m); for (const m of moves) lo.pose(m, 0.5, 1, 0); out.push([k, hi.triangles, hi.draws, lo.triangles, lo.draws, moves.length]); } return out; });
  for (const r of rows) console.log(r.join('\t'));
  const sc = await p.evaluate(async () => { const W = __w; W.S.key = 'ashen-warden'; W.S.detail = 'high'; W.S.sculpt = true; await W.show(); const a = W.figs[0].sculpt; W.S.key = 'unsmith'; await W.show(); return [a, W.figs[0].sculpt]; });
  console.log('sculpt', JSON.stringify(sc), 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth), errs.slice(0, 3));
  await b.close();
})();
