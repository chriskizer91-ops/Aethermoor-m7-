// probe-life.mjs (Places, step 4): what the life (m7/life.js) costs in each place, on phone detail: draw calls with and
// without it, and the time to draw a frame with and without it (headless SwiftShader: compare them, not a phone).
//   NODE_PATH=$(npm root -g) node m7/probe-life.mjs dist/<page>.html id,id,...
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [file, ids] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext(Object.assign({}, devices['Pixel 7'], { deviceScaleFactor: 1 }));
const p = await ctx.newPage();
await p.goto('file://' + path.resolve(file) + '?test'); await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
for (const id of ids.split(',')) {
  const r = await p.evaluate(async (id) => {
    const m = window.__m7; if (m.cur !== id) await m.go(id); const W = m.W; W.step(1, 30);
    const life = W.P.scene.children.filter((o) => /^life:/.test(o.name)), gl = W.renderer.getContext();
    const time = () => { const px = new Uint8Array(4); W.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now(); for (let i = 0; i < 12; i++) { W.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } return (performance.now() - t0) / 12; };
    const on = { calls: (W.render(), W.renderer.info.render.calls), ms: time() };
    life.forEach((o) => (o.visible = false)); const off = { calls: (W.render(), W.renderer.info.render.calls), ms: time() }; life.forEach((o) => (o.visible = true));
    return { kinds: life.map((o) => o.name.slice(5)).join(' '), on, off };
  }, id);
  console.log(`${id}: ${r.off.calls} -> ${r.on.calls} calls, ${r.off.ms.toFixed(1)} -> ${r.on.ms.toFixed(1)} ms a frame (${r.kinds})`);
}
await b.close();
