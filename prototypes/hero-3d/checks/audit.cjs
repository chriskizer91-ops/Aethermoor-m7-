const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(3000);
  const n = await p.evaluate(() => __audit.list().length); let flags = [];
  for (let i = 0; i < n; i += 60) flags = flags.concat(await p.evaluate(([a, z]) => __audit.run(a, z), [i, i + 60]));
  console.log(n, 'items', flags.length, 'flagged', JSON.stringify(flags.slice(0, 10)));
  await b.close();
})();
