// near.mjs (Places, step 4): stills close up: stands the party at a spot in a place and looks at it from behind.
//   NODE_PATH=$(npm root -g) node m7/near.mjs dist/<page>.html out-dir '[["thornhollow",475,300,3.14], ...]'   (place, x, y in painting px, facing)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [file, out, list] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 700, height: 500 } }); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('file://' + path.resolve(file) + '?test'); await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
for (const [id, x, y, yaw] of JSON.parse(list)) {
  await p.evaluate(async ([id, x, y, yaw]) => { const m = window.__m7; if (m.cur !== id) await m.go(id); m.W.setIo(x, y, yaw); m.W.setCam(yaw + Math.PI, 0.35, 7); m.W.step(0.3, 30); }, [id, x, y, yaw]);
  await p.screenshot({ path: `${out}/${id}-${x}-${y}.jpg`, quality: 72 });
}
console.log(errs.length ? errs : 'no errors'); await b.close();
