// How much a fight costs to draw (step 4): the fight's own frame, at phone settings, with renderer.info's draws and
// triangles, and each figure's share (meshes, triangles).
//   NODE_PATH=$(npm root -g) node battle/check-perf.mjs <page.html> [query]
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, q = 'go=1&quality=phone&foes=hd&pack=6'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('file://' + path.resolve(page) + '?' + q, { timeout: 180000 });
await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
await p.waitForTimeout(14000);
const r = await p.evaluate(() => {
  const a = window.__fight.arena, R = a.renderer;
  R.info.autoReset = false; R.info.reset(); R.render(a.scene, a.cam);
  const all = { draws: R.info.render.calls, triangles: R.info.render.triangles };
  const count = (root) => { let n = 0, c = 0; root.traverse((o) => { if (o.isMesh && o.visible) { c++; n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return [c, Math.round(n)]; };
  const figs = {}; for (const h of a.heroes.values()) figs['hero ' + h.id] = count(h.A.root);
  for (const [id, f] of a.foes) figs[`foe ${f.key} ${id}`] = count(f.root);
  // the place alone: everything else
  let rest = 0; for (const v of Object.values(figs)) rest += v[0];
  R.info.autoReset = true;
  return { ...all, figures: figs, figureDraws: rest };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
