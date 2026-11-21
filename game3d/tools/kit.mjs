// game3d/tools/kit.mjs: what the headless checks share (Together, November 20): a player's hands on the built page.
//   const K = kit(page, log); K.settle(), K.walkTo(x, y, o), K.useThing(id, o), K.playDialogue(), K.state()
export function kit(page, log, shot = async () => {}) {
const E = (fn, a) => page.evaluate(fn, a);
const state = () => E(() => { const w = window.__g3.world; return w && w.walk ? { map: w.walk.map, x: w.walk.x, y: w.walk.y, busy: w.busy, fighting: document.body.classList.contains('fighting') && !document.querySelector('#fight.spoils'), away: !document.getElementById('screen').hidden || !!document.querySelector('#fight.spoils') } : null; });
// ---- M7's boxes and screens, as a player taps them ----
async function playDialogue(pick = /Leave|Not yet|Go|Farewell|Done/i) {
  for (let i = 0; i < 60; i++) {
    if (!(await page.$('.ov-dialogue'))) return true;
    const choices = await page.$$('.dlg-choice:not([disabled])');
    if (choices.length) {
      let chosen = null;
      for (const c of choices) if (pick.test(await c.innerText())) { chosen = c; break; }
      await (chosen || choices[choices.length - 1]).click().catch(() => {});
    } else await page.click('.dlg-next').catch(() => {});
    await page.waitForTimeout(200);
  }
  return false;
}
// whatever is up: a talk, a fight's card, a message, the after-fight screen, a card reveal
async function settle({ fight = true, rest = false, max = 400, pick } = {}) {
  let fightT0 = 0;
  for (let i = 0; i < max; i++) {
    const s = await state();
    // a fight runs as long as it runs (a hard one takes many minutes headless): wait it out, up to 45 minutes
    if (s && s.fighting) { if (!fightT0) fightT0 = Date.now(); if (Date.now() - fightT0 < 2700000) i--; await page.waitForTimeout(800); continue; }
    fightT0 = 0;
    if (await page.$('.ov-dialogue')) { await playDialogue(pick); continue; }
    if (await page.$('.ov-reveal .cont')) { await page.click('.ov-reveal .cont').catch(() => {}); await page.waitForTimeout(300); continue; }
    if (await page.$('.ov-prefight')) {
      if (fight) { log('a fight: Fight'); await page.click('.pf-fight').catch(() => {}); await page.waitForTimeout(600); continue; }
      await page.click('.ov-prefight .btn.ghost').catch(() => {}); continue;
    }
    if (await page.$('.ov-hearth')) {
      if (rest) { await page.click('.ov-hearth [data-primary]'); await page.waitForTimeout(500); rest = false; continue; }
      await page.click('.ov-hearth .btn.ghost').catch(() => {}); continue;
    }
    if (s && s.away) {
      const chest = await page.$('.screen-aftermath .af-loot .chest:not(.opened)');
      if (chest) { await chest.click().catch(() => {}); await page.waitForTimeout(800); continue; }
      const nx = await page.$('.screen-aftermath .af-foot .btn.primary');
      if (nx) { await nx.click().catch(() => {}); await page.waitForTimeout(500); continue; }
    }
    const p = await page.$('.ov [data-primary]:not([disabled]), .ov .cont');
    if (p) { await p.click().catch(() => {}); await page.waitForTimeout(250); continue; }
    if (s && !s.busy && !s.away) return true;
    await page.waitForTimeout(250);
  }
  return false;
}
// walk to (x, y) on this map (or next to it): the engine's own path, the leader set down a tile at a time and the
// page's frame left to take each step; anything that comes up on the way is settled, and the path found again
async function walkTo(x, y, { adjacent = false, map = null, fight = true, each = null, pick } = {}) {
  for (let tries = 0; tries < 30; tries++) {
    await settle({ fight, pick });
    const s = await state();
    if (map && s.map !== map) return s;
    if ((s.x === x && s.y === y) || (adjacent && Math.abs(s.x - x) + Math.abs(s.y - y) === 1)) return s;
    const p = await E(([x, y, adjacent]) => window.__g3.world.path(x, y, adjacent), [x, y, adjacent]);
    // a way out (a stair, a door) isn't on M7's paths: walk beside it, then step on, as a player does
    if (!p || !p.length) {
      const q = await E(([x, y]) => window.__g3.world.path(x, y, true), [x, y]);
      if (q && q.length) {
        await walkTo(q[q.length - 1][0], q[q.length - 1][1], { map: s.map, fight, each, pick });
        await E(([x, y]) => window.__g3.world.nudge(x, y), [x, y]);
        await page.waitForTimeout(1500);
        continue;
      }
    }
    if (!p || !p.length) {
      // a road gate stands shut until its guard is beaten (M4.5's roads): walk up to the nearest guard we can reach, fight
      const g = await E(() => window.__g3.world.nearestGuard());
      log('no path to', x, y, 'from', s.x, s.y, g ? '- fighting the guard ' + g.id : '- no guard to fight');
      if (!g) { await page.waitForTimeout(500); continue; }
      await useThing(g.id, { fight, pick });
      await settle({ fight, pick });
      log('  the fight with', g.id, 'ended:', await E(() => window.__g3.lastResult));
      if (each) await each();
      continue;
    }
    for (const [nx, ny] of p) {
      const before = await state();
      if (before.busy || before.fighting || before.away) break;
      await E(([nx, ny]) => window.__g3.world.nudge(nx, ny), [nx, ny]);
      await page.waitForFunction(([nx, ny, m]) => { const w = window.__g3.world; return (w.walk.x === nx && w.walk.y === ny) || w.walk.map !== m || w.busy || document.body.classList.contains('fighting'); }, [nx, ny, before.map], { timeout: 20000 }).catch(() => {});
      const now = await state();
      if (now.map !== before.map || now.busy || now.fighting || now.x !== nx || now.y !== ny) break;
    }
  }
  return state();
}
const nextTo = (id) => E((id) => window.__g3.world.besideOf(id), id);
async function useThing(id, opts) {
  const at = await nextTo(id);
  if (!at) { log('no', id); return false; }
  await walkTo(at.x, at.y, opts);
  await E((d) => window.__g3.world.faceTo(d), at.face);
  await E(() => window.__g3.world.pressA());
  await page.waitForTimeout(600);
  return true;
}

return { E, state, playDialogue, settle, walkTo, useThing, nextTo };
}
