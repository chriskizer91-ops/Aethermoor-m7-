// The spoils camera, room by room (Together, November 21: indoors it slipped behind the wall): opens each fight, holds
// it at its start, swings to the spoils view (arena.spoilsView) and takes a still, then checks the camera stands over
// open floor and sees every hero's head.
//   NODE_PATH=$(npm root -g) node battle/check-spoils-view.mjs <page.html> <out-dir> <enc> [enc...]
import { createRequire } from 'node:module';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [page, out, ...encs] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
for (const enc of encs) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { globalThis.__btHooks = { log() {}, peak(ev) { if (!window.__held && ['intent', 'round', 'turn', 'move'].includes(ev.t)) { window.__held = 1; return new Promise(() => {}); } return null; } }; });
  await p.goto('file://' + path.resolve(page) + `?enc=${enc}&go=1&auto=1&quality=phone`, { timeout: 180000 });
  await p.waitForFunction(() => window.__held && window.__fight?.battle, null, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const a = window.__fight.arena; a.manual = true; a.stepBy(1.0); a.spoilsView(); a.stepBy(3.0);
    const P = a.W.P, c = a.cam.position, open = (() => { try { return P.walkable(P.M.px(c.x), P.M.py(c.z)); } catch (e) { return null; } })();
    const seen = [...a.heroes.values()].filter((h) => { try { return P.sight.hit(c.x, c.y, c.z, h.home.x, h.home.y + 1.3, h.home.z) > 0.97; } catch (e) { return true; } }).length;
    return { open, seen, heroes: a.heroes.size };
  });
  await p.screenshot({ path: path.join(out, `${enc}.png`), timeout: 180000 });
  const ok = r.open !== false && r.seen === r.heroes && !errs.length; if (!ok) bad++;
  console.log(`${enc}: camera over open floor ${r.open}, sees ${r.seen} of ${r.heroes} heroes${errs.length ? ', errors: ' + errs.join(' | ') : ''} ${ok ? 'ok' : 'BAD'}`);
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
