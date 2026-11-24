// measure wing beats per second for every move of every winged foe: count downward zero-crossings of a wing joint's angle
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/Aethermoor-m7-/prototypes/winged/dist/winged.html'); await p.waitForTimeout(3000);
  const out = await p.evaluate(async () => { const W = __w, res = [];
    for (const k of ['lamp-moth', 'gloamwing', 'thunder-roc']) { W.S.key = k; await W.show(); const f = W.figs[0], R = f.rig;
      
      for (const [m] of f.moves.MOVES) { const D = m === 'idle' || m === 'walk' ? 6 : f.duration(m); f.lt = null; f.wph = 0; let beats = 0, lastCyc = null;
        for (let i = 0; i <= D * 120; i++) { const t = i / 120; if (m === 'idle') f.update(t, 0); else if (m === 'walk') f.update(t, t * 5); else f.pose(m, t / D, t, 0); const S = 0; }
        const sh = m === 'wing-gale' ? 1 : f.wph / (Math.PI * 2); res.push([k, m, +(sh / D).toFixed(2)]); } }
    return res; });
  const worst = out.sort((a, b) => b[2] - a[2]); console.log('fastest:', JSON.stringify(worst.slice(0, 6))); console.log(errs.slice(0, 2)); await b.close(); })();
