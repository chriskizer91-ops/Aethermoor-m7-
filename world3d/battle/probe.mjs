// A quick look inside the Fight page while it runs (headless): where the camera is, where everyone stands.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2], q = process.argv[3] || 'go=1&speed=2', W = +(process.argv[4] || 390), H = +(process.argv[5] || 844), at = +(process.argv[6] || 6000);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + path.join(here, '..', 'dist', '' + (process.env.PAGE || 'm7-fight-512.html') + '') + '?' + q);
await p.waitForFunction(() => window.__ready || window.__err, null, { timeout: 120000 });
await p.waitForTimeout(at);
const s = await p.evaluate(() => {
  const a = window.__fight.arena, r = (v) => v && [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
  return { center: r(a.center), dir: r(a.dir), want: a.want && { pos: r(a.want.pos), p: a.want.p, h: a.want.h, G: a.want.G, fov: a.want.fov }, cam: r(a.cam.position), L: a.layoutIn && { yH: a.layoutIn.yH, yF: a.layoutIn.yF, yTop: a.layoutIn.yTop, heroes: a.layoutIn.heroes, stage: [a.layoutIn.stage.top, a.layoutIn.stage.bottom] },
    heroes: [...a.heroes.values()].map((h) => ({ id: h.id, home: r(h.home), pos: r(h.pos), vis: h.A.root.visible, inScene: !!h.A.root.parent, scr: a.project(h.pos) })),
    foes: [...a.foes.entries()].map(([id, f]) => ({ id, key: f.key, home: r(f.home), pos: r(f.pos), vis: f.root.visible, removed: f.removed, scr: a.project(f.pos), size: f.size })), byUnit: [...a.byUnit] };
});
console.log(JSON.stringify(s, null, 1));
if (out) await p.screenshot({ path: out });
console.log(errs.join('\n'));
await b.close();
