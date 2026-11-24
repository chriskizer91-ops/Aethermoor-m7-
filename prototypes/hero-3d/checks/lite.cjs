const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/Aethermoor-m7-/prototypes/hero-3d/dist/gear-room-debug.html'); await p.waitForTimeout(3000);
  const out = await p.evaluate(() => { const G = __gear, P = __people, res = [];
    for (const d of ['high', 'light', 'lite']) { G.S.detail = d;
      for (const h of ['warden', 'pip', 'bryn', 'alondra']) { try { G.setHero(h); G.rebuild(); res.push(d + ' ' + h + ' ok ' + G.hero.group.children.length); } catch (e) { res.push(d + ' ' + h + ' FAIL ' + e.message); } }
      let bad = 0, n = 0; for (const k of P.npcs) { n++; try { G.S.who = 'npc:' + k; } catch (e) {} }
    }
    return res; });
  console.log(out.join('\n'));
  // townsfolk and people foes at each level, built through the page's own rebuild with the who picker
  const r2 = await p.evaluate(() => { const G = __gear, P = __people, sel = document.getElementById('who'), res = {};
    for (const d of ['high', 'light', 'lite']) { G.S.detail = d; let fail = 0, n = 0, first = '';
      for (const o of [...sel.options].filter(o => /^(npc|foe):/.test(o.value))) { n++; sel.value = o.value; sel.dispatchEvent(new Event('change')); try { G.rebuild(); } catch (e) { fail++; first = first + ' | ' + o.value + ': ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' <- '); } }
      res[d] = { n, fail, first }; } return res; });
  console.log(JSON.stringify(r2)); console.log('page errors', errs.slice(0, 3)); await b.close(); })();
