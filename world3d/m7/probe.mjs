// probe.mjs (Places, step 4): what a page draws, on phone and on laptop detail: for each place asked, the draw calls and
// triangles from the walker's own view, and which parts of the scene take the most calls.
//   NODE_PATH=$(npm root -g) node m7/probe.mjs dist/m7-places-768.html thornhollow,keep [--phone] [--detail]
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [file, ids] = process.argv.slice(2), PHONE = process.argv.includes('--phone'), DETAIL = process.argv.includes('--detail');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext(PHONE ? Object.assign({}, devices['Pixel 7'], { deviceScaleFactor: 1 }) : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('file://' + path.resolve(file) + '?test');
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 240000 });
for (const id of ids.split(',')) {
  const r = await page.evaluate(async ([id, detail]) => {
    const m = window.__m7; if (m.cur !== id) await m.go(id);
    const W = m.W; W.step(1, 30); const n = W.numbers();
    // the same view with the party hidden: what the place alone costs
    const heroes = W.P.scene.children.filter((o) => o.type === 'Group' && o.name !== 'world');
    const vis = heroes.map((h) => h.visible); heroes.forEach((h) => { h.visible = false; }); W.render(); const pl = W.renderer.info.render; const placeOnly = { calls: pl.calls, tris: Math.round(pl.triangles / 1000) }; heroes.forEach((h, i) => { h.visible = vis[i]; }); W.render();
    let parts = null;
    if (detail) {
      // calls by what they are: count visible meshes in front of the camera, grouped by name / material key
      const cam = W.cam, fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
      const by = {};
      W.P.scene.traverseVisible((o) => { if (!o.isMesh && !o.isInstancedMesh) return; if (o.frustumCulled !== false && o.geometry && o.geometry.boundingSphere) { const s = o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(s)) return; } let top = o; while (top.parent && top.parent !== W.P.scene) top = top.parent; const k = top === o ? (o.name || 'mesh') : (top.name || 'group:' + top.type); by[k] = (by[k] || 0) + 1; });
      parts = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14);
    }
    return { calls: n.calls, tris: Math.round(n.triangles / 1000), world: n.world, io: n.io, parts, placeOnly };
  }, [id, DETAIL]);
  console.log(id, (PHONE ? 'phone' : 'laptop') + ':', r.calls, 'calls,', r.tris + 'k tris; the place alone', r.placeOnly.calls, 'calls,', r.placeOnly.tris + 'k tris', r.parts ? '\n  ' + r.parts.map((p) => p.join(' ')).join(', ') : '');
}
if (errs.length) console.log('ERRORS', errs.slice(0, 5));
await b.close();
