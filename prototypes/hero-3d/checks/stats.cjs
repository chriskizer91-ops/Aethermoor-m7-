const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(3000);
  for (const on of [true, false]) {
    if (!on) { await p.click('#b-sculpt'); await p.waitForTimeout(1500); }
    for (const d of ['high', 'light', 'lite']) { await p.waitForTimeout(2200); const r = await p.evaluate(() => ({ tris: __gear.S.tris, meshes: __gear.S.meshes, calls: __gear.S.calls })); console.log(on ? 'sculpted' : 'plain', d, JSON.stringify(r)); await p.click('#b-detail'); }
  }
  await b.close();
})();
