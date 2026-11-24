const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 300)));
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(3000);
  const keys = (process.argv[4] || '').split(',').filter(Boolean);
  for (const k of keys) {
    const info = await p.evaluate(async k => { const W = __w; W.S.key = k; W.S.turn = false; await W.show(); W.controls.autoRotate = false; const f = W.figs[0]; document.querySelectorAll('.acts,.top').forEach(e => e.style.visibility = 'hidden'); return { tris: f.triangles, draws: f.draws, h: f.height }; }, k);
    console.log(k, JSON.stringify(info));
    for (const [v, ang] of [['front', 0], ['side', Math.PI / 2], ['back', Math.PI]]) {
      await p.evaluate(([ang, h]) => { const W = __w, d = h * 2.3 + 0.6; W.controls.target.set(0, h * 0.5, 0); W.camera.position.set(Math.sin(ang) * d, h * 0.55, Math.cos(ang) * d); W.controls.update(); }, [ang, info.h]);
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => { const c = document.getElementById('view').getBoundingClientRect(); return { x: c.x, y: c.y, width: Math.min(c.width, 1100 - c.x), height: Math.min(c.height, 700 - c.y) }; });
      await p.screenshot({ path: `${process.argv[3]}/wr-${k}-${v}.png`, clip: r });
    }
  }
  console.log(errs.slice(0, 5)); await b.close();
})();
