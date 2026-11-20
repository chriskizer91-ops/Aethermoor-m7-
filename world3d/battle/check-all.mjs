// Every fight on a page, played headless with Auto (step 3): for each encounter id, the result, the battle's event
// kinds and statuses seen (from M7's own log hooks), page errors, and two stills (mid-fight, the spoils).
//   NODE_PATH=$(npm root -g) node battle/check-all.mjs <page.html> <out-dir> <enc,enc,...> [extra query]
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [page, out, list, extra = ''] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
for (const enc of list.split(',')) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  // M7's battle screen reports every event to __btHooks.peak, and every log line to __btHooks.log
  await p.addInitScript(() => {
    window.__seen = { events: {}, statuses: {}, log: [] };
    globalThis.__btHooks = {
      log(line) { window.__seen.log.push(line.text); if (window.__seen.log.length > 400) window.__seen.log.shift(); },
      peak(ev) { const s = window.__seen; s.events[ev.t] = (s.events[ev.t] || 0) + 1; if (ev.t === 'status' && ev.status) s.statuses[ev.status + ':' + ev.op] = 1; return null; },
    };
  });
  const t0 = Date.now();
  let r = { enc };
  try {
    await p.goto('file://' + path.resolve(page) + `?enc=${enc}&go=1&auto=1&speed=4&quality=phone${extra}`, { timeout: 180000 });
    await p.waitForFunction(() => window.__ready || window.__err, null, { timeout: 180000 });
    await p.waitForTimeout(9000);
    await p.screenshot({ path: path.join(out, `${enc}-fight.png`) });
    await p.waitForFunction(() => window.__fight.result, null, { timeout: +(process.env.WAIT || 900000) });
    await p.waitForTimeout(5000);
    await p.screenshot({ path: path.join(out, `${enc}-after.png`) });
    r = { enc, result: await p.evaluate(() => window.__fight.result), ...(await p.evaluate(() => ({ events: window.__seen.events, statuses: Object.keys(window.__seen.statuses) }))) };
  } catch (e) { r.fail = String(e.message).slice(0, 200); }
  r.secs = Math.round((Date.now() - t0) / 1000); r.errors = errs.slice(0, 5);
  results.push(r); console.log(JSON.stringify(r));
  writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1));
  await p.close();
}
await b.close();
