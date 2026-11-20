// game3d/walk.js: walking the 3D places with M7's world engine running underneath (Together, November 20).
//
// The party walks freely in 3D (Coven's walker, world3d/coven/engine/place/walker.js). Under it, M7's own world engine
// (game/src/rules/world.js) keeps the Walk on M7's tile grid (one tile = 2 m = 50 x 40 of a place's painting px):
//   - each time the leader crosses into a new tile, one step: move(game, walk, dir). Crossing corner-wise is two steps.
//     If the engine refuses (a closed gate, a person, a lock, a chest: things the 3D floor alone lets you walk on),
//     the leader is held at the edge of the tile they are in, as a wall would.
//   - every 400 ms without a step, tick(game, walk): the packs roam, notice, chase and give up.
//   - the A button (Enter, E or Space): interact(game, walk) with what stands next to the leader, the way they face.
//   - every event the engine returns is played as M7's world screen plays it (game/src/ui/screens/world.js, whose flows
//     are followed here closely): ways out to the next place, sealed roads, gates, locks, chests, signs, triggers, talk,
//     Hearthfires, hazards, packs (contact starts a fight), using M7's own dialogue box, sheets and cards over the 3D.
//   - the game is saved (ctx.setGame, the 3D game's own key) on every place change, before a fight, after anything that
//     changes the game, every 20 steps, and when the page goes away.
// createWorld(o) -> world: { start(params), back(params), fightSetup(info), afterFight(), W, game, walk, ... }
import * as W from '../game/src/rules/world.js';
import * as G from '../game/src/rules/gauntlet.js';
import * as Story from '../game/src/rules/story.js';
import { check } from '../game/src/rules/cond.js';
import { DIRS, dirTo } from '../game/src/rules/path.js';
import { START_AT, HEARTHS, ZONES, REGIONS } from '../game/src/data/world.js';
import { ENCOUNTERS } from '../game/src/data/encounters.js';
import { tierAs, FOES } from '../game/src/data/foes.js';
import { DIALOGUE } from '../game/src/data/dialogue.js';
import { NPCS } from '../game/src/data/npcs.js';
import { LOCKS, CROWNWALL } from '../game/src/data/locks.js';
import { RELICS } from '../game/src/data/relics.js';
import { GEMS, MATERIALS } from '../game/src/data/gems.js';
import { PAGES } from '../game/src/data/codex.js';
import { TUNING } from '../game/src/data/tuning.js';
import { overlayOpen } from '../game/src/ui/lib/overlay.js';
import { openDialogue, openMessage, priceText } from '../game/src/ui/world/dialogue.js';
import { openPrefight, openLockPrompt, openHearthMenu, openPauseMenu, openShop, openForge } from '../game/src/ui/world/sheets.js';
import { playBrandBanner, playCrownwalls, showLetter, playCouncil, showToBeContinued, showRegionCard, hasRegionCard, showOpening, playEnding } from '../game/src/ui/world/story-fx.js';
import { reliquaryLine } from '../game/src/ui/screens/codex.js';
import { person, foe, artOf } from './figures.js';

export const TX = 50, TY = 40;          // a tile in a place's painting px (world3d/m7/convert.mjs)
const IDLE_TICK_MS = 400, SAVE_EVERY = 20;
const YAW = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
const tileAt = (px, py) => [Math.floor(px / TX), Math.floor(py / TY)];
const centre = (x, y) => [x * TX + TX / 2, y * TY + TY / 2];
const areaOf = (e) => e.area || [e.at[0], e.at[1], e.at[0], e.at[1]];
const covers = (e, x, y) => { const [x0, y0, x1, y1] = areaOf(e); return x >= x0 && x <= x1 && y >= y0 && y <= y1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withFlags = (g, patch) => ({ ...g, progress: { ...g.progress, flags: { ...g.progress.flags, ...patch } } });
const RATING = { easy: 'Easy', fair: 'Fair', hard: 'Hard', deadly: 'Deadly' };
const LOCK_VERB = {
  thornwall: 'Cut', bramble: 'Part', stream: 'Cross', boulder: 'Break', 'cold-hearth': 'Light', 'tally-seal': 'Break', 'barred-gate': 'Open', 'rot-knot': 'Untie', 'rope-ledge': 'Climb', darkness: 'Look', ichor: 'Look',
  'dune-glass': 'Break', mirage: 'Look', quicksand: 'Cross', 'vault-seal': 'Open', chasm: 'Cross', ice: 'Melt', 'rune-seal': 'Read', drift: 'Cross',
  bog: 'Cross', fog: 'Look', blackwater: 'Cross', 'witch-ward': 'Pass',
};
const HAZARD_LINE = { drift: 'The cold bites through the snow', bog: 'The bog sucks at your boots', ichor: 'The ichor burns' };
function lootWords({ gold = 0, bag = {}, materials = {}, gems = {} } = {}) {
  const bits = [];
  if (gold) bits.push(`+${gold} gold`);
  for (const [id, n] of Object.entries(materials || {})) if (n > 0) bits.push(`${n} ${(MATERIALS[id]?.name || id.replace(/-/g, ' ')).toLowerCase()}`);
  for (const [id, n] of Object.entries(gems || {})) if (n > 0) bits.push(`${GEMS[id]?.name || id.replace(/-/g, ' ')} ×${n}`);
  for (const [id, n] of Object.entries(bag || {})) if (n > 0) bits.push(`${id.replace(/-/g, ' ')} ×${n}`);
  return bits.join(' · ');
}
function pageWords(id) { const P = PAGES.find((p) => p.id === id); return P ? `Codex Page ${P.no} complete${P.reward ? `: ${P.reward.name}. ${P.reward.text}` : '.'}` : ''; }

// o: { ctx, places (W3D_PLACES), heroes (M7_HEROES), dom: { world, cv, ring, dot, load, loadTitle, loadMsg, abtn, prompt, menu,
//      marks }, toast(text, name?), leave(screen, params), fight(info), phone }
export function createWorld(o) {
  const { ctx, places: PL, heroes: H, dom } = o;
  const W3D = window.W3D;
  let game = ctx.game, walk = null, Wk = null;   // Wk: the 3D walker's api
  let lock = 0, dead = false, steps = 0, sinceSave = 0, idleMs = 0, blocked = null, firstStep = false;
  let pending = null;       // a fight started from the walk: { roamerId, enc, boss, pos }
  let leader = null, followers = [], party = null;
  const made = {};
  const placeOf = (mapId) => PL['m7-' + mapId] || null;

  // ---- the heroes, in their M7 gear ----
  // what each hero wears, as M7's game holds it (inventory ids to items); empty slots keep the starting look
  function gearOf(id) {
    const h = game.party.roster[id], g = {};
    for (const [slot, iid] of Object.entries(h?.gear || {})) g[slot] = iid ? (game.inventory || []).find((it) => it.id === iid) || null : null;
    return g;
  }
  const gearKey = (id) => JSON.stringify(game.party.roster[id]?.gear || {});
  function actor(id, detail) {
    const k = id + ':' + detail + ':' + gearKey(id);
    return made[k] || (made[k] = H.actor(id, gearOf(id), detail));
  }
  const leadId = () => game.party.active[0] || 'warden';
  W3D.witch = (id) => actor(id, o.phone ? 'light' : 'high');
  function dressParty() {
    if (!Wk) return;
    for (const f of followers) Wk.P.scene.remove(f.root);
    Wk.setWho(leadId()); leader = W3D.witch(leadId());
    followers = game.party.active.slice(1).map((id) => actor(id, 'light'));
    for (const f of followers) Wk.P.scene.add(f.root);
    party.set(leader, followers);
  }

  // ---- saving ----
  function save() {
    if (dead || !walk) return;
    game = W.commit(game, walk);
    ctx.setGame(game);
    sinceSave = 0;
  }
  function apply(r) { if (r.game) game = r.game; if (r.walk) walk = r.walk; }

  // ---- the place: build it, or walk on to the next ----
  async function showPlace(mapId, x, y, face, first) {
    const pl = placeOf(mapId);
    const [px, py] = centre(x, y);
    dom.load.style.display = 'grid'; dom.load.style.opacity = 1; dom.loadTitle.textContent = pl.name;
    if (first) {
      Wk = await W3D.walk({
        place: pl, root: dom.world, canvas: dom.cv, ring: dom.ring, dot: dom.dot, toast: o.toast, who: leadId(), onFrame,
        say: (s) => { dom.loadMsg.textContent = s.replace(/\bIo\b/g, 'the party'); },
        onStats: (n) => { if (dom.fps) dom.fps.textContent = n.fps; },
      });
      party = window.M7_PARTY.create(Wk);
      Wk.setIo(px, py, YAW[face] ?? 0);
      Wk.C.yaw = Wk.io.yaw + Math.PI; Wk.setIo(px, py, YAW[face] ?? 0);
      (function follow() {
        requestAnimationFrame(follow);
        const now = performance.now(), dt = Math.min(0.05, (now - (follow.last || now)) / 1000); follow.last = now;
        if (dead || !Wk || Wk.paused || Wk.isBusy() || o.fighting()) return;
        party.step(dt, now / 1000);
        animate(dt, now / 1000);
      })();
    } else {
      dom.loadMsg.textContent = 'Walking on…';
      await sleep(30);
      await Wk.switchTo(pl, px, py, YAW[face] ?? 0);
      Wk.setIo(px, py, YAW[face] ?? 0);
    }
    if (hold) hold = { px: Wk.io.px, py: Wk.io.py };   // a new place mid-flow: hold the leader where they now stand
    dressParty();
    stand();
    dom.load.style.opacity = 0; setTimeout(() => { dom.load.style.display = 'none'; }, 600);
    o.toast(pl.name, true);
    window.__g3.shown = (window.__g3.shown || 0) + 1; window.__ready = true;
  }

  // ---- people, standing foes and roaming packs, as the engine has them ----
  let standing = new Map();   // entity id -> { fig, e }
  let roamers = new Map();    // roamer id -> { figs: [fig], r, x, z, face }
  function placeFig(fig, x, y, face) {
    const M = Wk.P.M, [px, py] = centre(x, y);
    fig.root.position.set(M.x(px), Wk.P.walkH(px, py), M.z(py)); fig.root.rotation.y = YAW[face] ?? 0;
  }
  // everyone the engine says is here (W.present: people come and go with the story)
  function stand() {
    if (!Wk) return;
    const here = W.present(game, walk.map), want = new Set();
    for (const e of here) {
      const ok = (e.kind === 'npc' && e.at) || (e.kind === 'encounter' && e.mode !== 'pack' && e.at && !e.talkOnly);
      if (!ok) continue;
      want.add(e.id);
      if (standing.has(e.id)) continue;
      let fig = null;
      try {
        if (e.kind === 'npc') fig = person(e.npc, 'light');
        else { const sp = ENCOUNTERS[e.enc]?.spawns?.[0]; fig = foe(sp ? artOf(sp.family) : 'cutpurse', 'light'); }
      } catch (err) { console.error(err); continue; }
      placeFig(fig, e.at[0], e.at[1], e.face || 's');
      Wk.P.scene.add(fig.root); standing.set(e.id, { fig, e });
    }
    for (const [id, s] of standing) if (!want.has(id) || !Wk.P.scene.children.includes(s.fig.root)) { Wk.P.scene.remove(s.fig.root); standing.delete(id); }
    syncRoamers(true);
  }
  function syncRoamers(snap) {
    if (!Wk) return;
    const want = new Set();
    for (const r of walk.roamers || []) {
      want.add(r.id);
      let R = roamers.get(r.id);
      if (!R || !Wk.P.scene.children.includes(R.figs[0].root)) {
        const arts = (r.spawns || []).slice(0, 3).map((s) => artOf(s.family));
        if (!arts.length) arts.push(r.lead?.art || artOf(r.lead?.family) || 'thornhound');
        const figs = [];
        for (const a of arts) { try { const f = foe(a, 'light'); Wk.P.scene.add(f.root); figs.push(f); } catch (err) { console.error(err); } }
        if (!figs.length) continue;
        const [px, py] = centre(r.x, r.y);
        R = { figs, r, px, py, face: YAW[r.face] ?? 0 };
        roamers.set(r.id, R); snap = true;
      }
      R.r = r;
      if (snap) { const [px, py] = centre(r.x, r.y); R.px = px; R.py = py; }
    }
    for (const [id, R] of roamers) if (!want.has(id)) { for (const f of R.figs) Wk.P.scene.remove(f.root); roamers.delete(id); }
  }
  function dropRoamers() { for (const R of roamers.values()) for (const f of R.figs) Wk.P.scene.remove(f.root); roamers.clear(); }
  const OFFS = [[0, 0], [-0.9, -0.8], [0.9, -0.9]];
  function animate(dt, t) {
    const M = Wk.P.M;
    for (const s of standing.values()) s.fig.update(t, dt, false);
    const L = leader?.root.position;
    for (const R of roamers.values()) {
      const [tx, ty] = centre(R.r.x, R.r.y);
      const dx = tx - R.px, dy = ty - R.py, d = Math.hypot(dx, dy), sp = (R.r.mood === 'chase' ? 150 : 110) * dt;
      const moving = d > 1;
      if (moving) { const k = Math.min(1, sp / d); R.px += dx * k; R.py += dy * k; }
      const x = M.x(R.px), z = M.z(R.py);
      let want = moving ? Math.atan2(M.x(tx) - x, M.z(ty) - z) : R.face;
      if (!moving && L && (R.r.mood === 'alert' || R.r.mood === 'chase')) want = Math.atan2(L.x - x, L.z - z);
      let a = want - R.face; a = Math.atan2(Math.sin(a), Math.cos(a)); R.face += a * Math.min(1, dt * 8);
      R.figs.forEach((f, i) => {
        const [ox, oz] = OFFS[i % OFFS.length], c = Math.cos(R.face), s = Math.sin(R.face);
        const fx = x + ox * c + oz * s, fz = z - ox * s + oz * c;
        f.root.position.set(fx, Wk.P.walkH(M.px(fx), M.py(fz)), fz); f.root.rotation.y = R.face;
        f.update(t + i * 0.3, dt, moving);
      });
    }
    marks(t);
  }
  // the "!" over a pack that has seen you (M7's emote), drawn in CSS where the 3D puts its head
  const bangs = new Map();
  function marks() {
    const now = performance.now();
    dom.marks.replaceChildren();
    for (const [id, until] of bangs) {
      if (now > until) { bangs.delete(id); continue; }
      const R = roamers.get(id); if (!R) continue;
      const f = R.figs[0], p = f.root.position.clone(); p.y += (f.height || 1.2) * 1.15 + 0.3;
      p.project(Wk.cam);
      if (p.z > 1) continue;
      const m = document.createElement('div'); m.className = 'g3-bang' + (R.r.hunter ? ' hunt' : '');
      m.textContent = '!';
      m.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; m.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
      dom.marks.append(m);
    }
  }

  // ---- each frame: the leader's tile, and the engine's step ----
  let hold = null;
  function onFrame(dt) {
    if (hold && Wk) { Wk.io.px = hold.px; Wk.io.py = hold.py; Wk.io.speed = 0; }
    if (dead || !walk || lock || overlayOpen() || o.fighting() || Wk.isBusy()) return;
    const io = Wk.io;
    const [tx, ty] = tileAt(io.px, io.py);
    if (tx !== walk.x || ty !== walk.y) crossed(tx, ty);
    else { blocked = null; }
    idleMs += dt * 1000;
    if (!lock && idleMs >= IDLE_TICK_MS) { idleMs = 0; idle(); }
    face();
  }
  // hold the leader inside the tile the engine has them on (the engine said no to the next one)
  function holdIn() {
    const io = Wk.io, x0 = walk.x * TX + 3, x1 = (walk.x + 1) * TX - 3, y0 = walk.y * TY + 3, y1 = (walk.y + 1) * TY - 3;
    io.px = Math.min(x1, Math.max(x0, io.px)); io.py = Math.min(y1, Math.max(y0, io.py));
  }
  const STOPS = { exit: 1, sealed: 1, encounter: 1, gate: 1, lock: 1, contact: 1 };
  function crossed(tx, ty) {
    // pushing on into the tile that just said no: held there quietly until the leader turns away
    if (blocked && blocked.x === tx && blocked.y === ty) { holdIn(); return; }
    const run = !!Wk.io.jog;
    for (let guard = 0; guard < 4 && (tx !== walk.x || ty !== walk.y); guard++) {
      const dx = tx - walk.x, dy = ty - walk.y, order = [];
      const ex = dx ? (dx > 0 ? 'e' : 'w') : null, ey = dy ? (dy > 0 ? 's' : 'n') : null;
      // corner-wise: the way the leader is more across first
      if (ex && ey) { const fx = Math.abs((Wk.io.px - centre(walk.x, walk.y)[0]) / TX), fy = Math.abs((Wk.io.py - centre(walk.x, walk.y)[1]) / TY); if (fx >= fy) order.push(ex, ey); else order.push(ey, ex); } else order.push(ex || ey);
      let stepped = false, stop = false;
      const before = walk;
      for (const d of order) {
        let r;
        try { r = W.move(game, walk, d, { run }); } catch (err) { console.error(err); holdIn(); return; }
        apply(r);
        if (r.events.some((e) => e.t === 'step')) { stepped = true; onStepped(); runEvents(r.events, before); break; }
        if (r.events.some((e) => STOPS[e.t])) { stop = true; blocked = { x: walk.x + DIRS[d][0], y: walk.y + DIRS[d][1] }; holdIn(); runEvents(r.events, before); break; }
        runEvents(r.events, before);
      }
      if (!stepped) { if (!stop) blocked = { x: tx, y: ty }; holdIn(); return; }
      if (lock) return;
    }
  }
  function onStepped() {
    steps++; sinceSave++; idleMs = 0; blocked = null;
    if (!firstStep) { firstStep = true; save(); if (ctx.commitAdopted) ctx.commitAdopted(); }
    else if (sinceSave >= SAVE_EVERY) save();
    syncRoamers(false);
  }
  function idle() {
    if (!(walk.roamers || []).length) { walk = { ...walk, tick: walk.tick + 1, grace: Math.max(0, walk.grace - 1) }; return; }
    let r;
    try { r = W.tick(game, walk); } catch (err) { console.error(err); return; }
    apply(r);
    syncRoamers(false);
    if (r.events.length) runEvents(r.events, null);
  }

  // ---- what the leader faces, and the A button ----
  const SKIP = { trigger: 1, light: 1, prop: 1 };
  function usable(e) {
    if (SKIP[e.kind] || (e.kind === 'encounter' && e.mode === 'pack')) return false;
    if (e.kind === 'chest' && e.hidden) return false;
    if ((e.kind === 'gate' || e.kind === 'lock') && e.state === 'open') return false;
    return true;
  }
  // the thing next to the leader (one tile away, square on) most in front of them, or a pack
  function target() {
    const yaw = Wk.io.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw);
    let best = null;
    const here = W.present(game, walk.map).filter(usable);
    for (const [d, [ddx, ddy]] of Object.entries(DIRS)) {
      const x = walk.x + ddx, y = walk.y + ddy, score = ddx * fx + ddy * fz;
      const e = here.find((q) => covers(q, x, y));
      const rm = (walk.roamers || []).find((r) => r.x === x && r.y === y);
      if ((e || rm) && score > -0.2 && (!best || score > best.score)) best = { e, rm, d, score };
    }
    return best;
  }
  function keyLine(lockType) {
    const L = LOCKS[lockType]; let st = null;
    try { st = W.lockStatus(game, lockType); } catch (e) { st = null; }
    if (!L || !st) return '';
    return `${L.name} · ${st.keys.map((k) => `${k.have ? '✓' : '✗'} ${k.label}${k.kind === 'domain' && k.detail ? ` (${k.detail})` : ''}`).join(' · ')}`;
  }
  function describe(e) {
    switch (e.kind) {
      case 'npc': return { a: 'Talk', label: `Talk to ${NPCS[e.npc]?.name || e.npc}` };
      case 'chest': if (e.state === 'opened') return { a: '', label: 'An empty chest' }; return e.lock ? { a: 'Open', label: 'A locked chest', p: keyLine(e.lock) } : { a: 'Open', label: 'Open the chest' };
      case 'sign': return e.look === 'painted' ? { a: 'Look', label: e.name || 'Look' } : { a: 'Read', label: 'Read the sign' };
      case 'board': return { a: 'Read', label: e.opens === 'ladder' ? 'The Ladder' : 'The bounty board' };
      case 'table': return { a: 'Look', label: 'The war table' };
      case 'pedestal': { const r = RELICS[e.relic], seen = game.codex?.[e.relic]?.sighted || game.codex?.[e.relic]?.claimed; return { a: 'Look', label: seen ? `Pedestal: ${r?.name}` : 'An empty pedestal' }; }
      case 'lookout': return { a: 'Look', label: 'Look out' };
      case 'bellframe': return { a: 'Look', label: 'The bell-frame' };
      case 'hearthfire': { const Hf = HEARTHS[e.id]; return e.state === 'cold' ? { a: 'Light', label: `${Hf?.name || 'Hearthfire'} (cold)`, p: keyLine('cold-hearth') } : { a: 'Rest', label: `Rest at ${Hf?.name || 'the fire'}` }; }
      case 'lock': return { a: LOCK_VERB[e.lock] || 'Look', label: LOCKS[e.lock]?.name || 'A lock', p: keyLine(e.lock) };
      case 'gate': return e.look === 'crownwall' ? { a: 'Look', label: 'Crownwall', p: 'A story seal' } : { a: 'Look', label: 'A shut gate' };
      case 'encounter': { let T = null; try { T = W.threat(game, e.enc); } catch (err) { T = null; } return { a: e.talk ? 'Talk' : 'Fight', label: e.name || ENCOUNTERS[e.enc]?.name || e.enc, p: T ? `Lv ${T.level} · ${RATING[T.rating]}` : '' }; }
      default: return { a: '', label: '' };
    }
  }
  let shownA = '';
  function face() {
    const t = target();
    let a = '', p = '';
    if (t?.rm) { a = 'Fight'; p = `${FOES[t.rm.lead?.family]?.name || 'A pack'}`; }
    else if (t?.e) { const d = describe(t.e); if (d.a) { a = d.a; p = d.label + (d.p ? ' · ' + d.p : ''); } else p = d.label; }
    const key = a + '|' + p;
    if (key === shownA) return;
    shownA = key;
    dom.abtn.hidden = !a; dom.abtn.textContent = a ? `${a}` : '';
    dom.prompt.textContent = p; dom.prompt.hidden = !p;
  }
  function pressA() {
    if (dead || lock || overlayOpen() || o.fighting() || !walk) return;
    const t = target();
    if (!t) return;
    if (walk.face !== t.d) walk = { ...walk, face: t.d };
    let r;
    try { r = W.interact(game, walk); } catch (err) { console.error(err); return; }
    apply(r);
    if (r.events.length) runEvents(r.events, null);
  }

  // ---- events, as M7's world screen plays them ----
  const SYNC = { turn: 1, step: 1, bump: 1, alert: 1, roam: 1, sighted: 1, hazard: 1, enter: 1 };
  function runEvents(events, before) {
    const later = [];
    let changed = false;
    for (const e of events) {
      if (!SYNC[e.t]) { later.push(e); continue; }
      if (e.t === 'alert') { bangs.set(e.id, performance.now() + 1100); ctx.audio.sfx('alert'); }
      else if (e.t === 'sighted') { changed = true; const r = RELICS[e.relic]; if (r) o.toast(`Sighted: ${r.name}`); ctx.audio.sfx('stamp'); }
      else if (e.t === 'hazard') { changed = true; o.toast(`${HAZARD_LINE[e.lock] || HAZARD_LINE.ichor}: ${Math.round((e.pct || 0.04) * 100)}% HP each`); }
      else if (e.t === 'bump') ctx.audio.sfx('bump');
    }
    if (changed) save();
    if (!later.length) return Promise.resolve();
    return flow(async () => {
      for (const e of later) {
        if (dead) return;
        const res = await handle(e, before);
        if (res === 'battle' || res === 'stop' || dead) return;
      }
    });
  }
  // a flow: the walk stops (the land is still) while M7's boxes and sheets are up; errors never leave it stuck
  async function flow(fn) {
    // the land keeps drawing (people talk, packs idle) but the party stays put: the leader is held where they stand
    if (!lock && Wk) hold = { px: Wk.io.px, py: Wk.io.py };
    lock++; document.body.classList.add('g3-busy');
    try { return await fn(); } catch (err) { console.error(err); } finally {
      lock = Math.max(0, lock - 1);
      if (!lock) hold = null;
      if (!lock && !dead && Wk && !o.fighting() && !o.away()) { Wk.pause(false); document.body.classList.remove('g3-busy'); idleMs = 0; shownA = ''; stand(); }
    }
  }
  async function handle(e, before) {
    switch (e.t) {
      case 'exit': return transition({ map: e.to, anchor: e.anchor });
      case 'sealed': {
        const gated = !!REGIONS[e.region]?.open;
        const tail = e.hint ? ` ${e.hint}` : gated ? ' The gate opens once both Brands of the Wilds are yours.' : e.nextChapter || check(game, { flag: 'act1-complete' }) ? ' The way opens in the next chapter.' : '';
        await openMessage(ctx, { text: `${e.text || 'The way is shut.'}${tail}` });
        return null;
      }
      case 'encounter': return encounterFlow(e.id);
      case 'gate': return gateFlow(e);
      case 'lock': return lockFlow(e);
      case 'trigger': return dialogueFlow(e.dialogue);
      case 'talk': {
        // the one spoken to turns to the party and talks (Models' townsfolk gesture while .talking is true)
        const who = e.npc && [...standing.values()].find((q) => q.e.npc === e.npc);
        if (who) { who.fig.talking = true; if (leader) { const p = who.fig.root.position, L = leader.root.position; who.fig.root.rotation.y = Math.atan2(L.x - p.x, L.z - p.z); } }
        try { return await dialogueFlow(e.dialogue, { enc: e.enc }); } finally { if (who) who.fig.talking = false; }
      }
      case 'sign': await openMessage(ctx, { text: e.text }); return null;
      case 'use': return useFlow(e);
      case 'chest': return chestFlow(e);
      case 'hearthfire': return hearthFlow(e.id);
      case 'contact': return contactFlow(e, before);
      default: return null;
    }
  }
  async function transition(target, { first = false } = {}) {
    const next = W.mapOf(target.map);
    if (!next) return 'stop';
    if (!placeOf(target.map)) {
      // a way out to a place that isn't on this page yet: say so, and stay
      await openMessage(ctx, { text: `The way to ${next.name} goes on in the next part of the 3D game. Not built on this page yet.` });
      return null;
    }
    const fromRegion = W.mapOf(walk?.map)?.region || null;
    let r;
    try { r = W.enterMap(game, target); } catch (err) { console.error(err); return 'stop'; }
    apply(r);
    dropRoamers(); for (const s of standing.values()) Wk?.P.scene.remove(s.fig.root); standing.clear();
    await showPlace(walk.map, walk.x, walk.y, walk.face, first);
    ctx.audio.music(next.music || 'wilds');
    save();
    blocked = null; idleMs = 0;
    await regionCard(fromRegion);
    const more = r.events.filter((x) => x.t !== 'enter');
    for (const x of more) { const res = await handle(x, null); if (res === 'battle' || res === 'stop' || dead) return 'stop'; }
    return 'stop';
  }
  async function regionCard(fromRegion) {
    const region = W.mapOf(walk.map)?.region;
    if (!region || region === fromRegion || !hasRegionCard(region)) return;
    const key = `card:${region}`;
    if (game.progress.flags.seen?.[key]) return;
    game = withFlags(game, { seen: { ...(game.progress.flags.seen || {}), [key]: true } });
    save();
    await showRegionCard(ctx, region);
  }
  async function dialogueFlow(id, { enc = null } = {}) {
    if (!id || !DIALOGUE[id]) return null;
    if (id === 'council' || id === 'council-2' || id === 'council-3' || id === 'council-4') await playCouncil(ctx, { second: id === 'council-2', third: id === 'council-3', fourth: id === 'council-4' });
    const r = await openDialogue(ctx, { game, id });
    if (dead) return 'stop';
    if (r.game !== game) { game = r.game; save(); }
    return storyEvents(r.events, { enc });
  }
  async function storyEvents(events) {
    const sum = (t) => { const out = {}; for (const e of events) if (e.t === t) for (const [id, n] of Object.entries(e[t] || {})) out[id] = (out[id] || 0) + (Number(n) || 0); return out; };
    const gold = events.filter((e) => e.t === 'gold').reduce((a, e) => a + (e.n || 0), 0);
    const words = lootWords({ gold, materials: sum('materials'), gems: sum('gems') });
    if (words) { ctx.audio.sfx('coin'); o.toast(words); }
    const paid = events.filter((e) => e.t === 'paid' && e.price).map((e) => priceText(e.price)).filter(Boolean).join(', ');
    if (paid) { ctx.audio.sfx('coin'); o.toast(`Paid ${paid}`); }
    let ending = null;
    for (const e of events) {
      if (dead) return 'stop';
      if (e.t === 'ending') { ending = e.id; continue; }
      if (e.t === 'fight') return encounterFlow(e.enc, { skipTalk: true });
      if (e.t === 'open') { const r = await openFlow(e.screen); if (r) return r; }
      else if (e.t === 'item') await cards(() => ctx.services.cardReveal(e.item, { source: RELICS[e.item.base] ? 'claimed' : 'drop', backdrop: W.mapOf(walk.map)?.backdrop }));
      else if (e.t === 'letter') await showLetter(ctx, e.id);
      else if (e.t === 'page') { const line = pageWords(e.id); if (line) { ctx.audio.sfx('stamp'); o.toast(line); } }
      else if (e.t === 'end' && e.act === 'act3-open') await showOpening(ctx, game);
      else if (e.t === 'end' && e.act === 'act3') { await playEnding(ctx, game, ending || game.ending); return transition({ map: START_AT.map, at: [START_AT.x, START_AT.y], face: START_AT.face || 'n' }); }
      else if (e.t === 'end') await showToBeContinued(ctx, game, { act: e.act });
    }
    return null;
  }
  // card overlays can change ctx.game (equip, identify): take it back, and dress the party in what they now wear
  async function cards(fn) {
    save();
    const r = await fn();
    if (!dead && ctx.game && ctx.game !== game) { game = ctx.game; dressParty(); }
    return r;
  }
  async function openFlow(screen) {
    const s = String(screen || '');
    if (s.startsWith('shop:')) { const g = await openShop(ctx, { game, shopId: s.slice(5) }); if (g !== game) { game = g; save(); } return null; }
    if (s === 'forge' || s === 'masterpiece') { const g = await openForge(ctx, { game, ...(s === 'masterpiece' ? { tab: 'masterpiece' } : {}) }); if (g !== game) { game = g; save(); dressParty(); } return null; }
    if (s === 'atlas') { leave('atlas', { mode: 'view' }); return 'stop'; }
    if (s === 'journal') { leave('journal', { tab: 'quests' }); return 'stop'; }
    if (s === 'ladder') { leave('journal', { tab: 'ladder' }); return 'stop'; }
    if (s === 'bounties') { leave('journal', { tab: 'bounties' }); return 'stop'; }
    return null;
  }
  async function encounterFlow(encId, { skipTalk = false } = {}) {
    const enc = ENCOUNTERS[encId];
    if (!enc) return null;
    if (enc.talk && !skipTalk && DIALOGUE[enc.talk]) return dialogueFlow(enc.talk, { enc: encId });
    const choice = await openPrefight(ctx, { game, encId });
    if (dead || choice !== 'fight') return null;
    return battle({ nodeId: encId }, { enc: encId, duel: !!enc.duel });
  }
  const entityById = (id) => W.present(game, walk.map).find((q) => q.id === id) || (W.mapOf(walk.map)?.entities || []).find((q) => q.id === id) || null;
  async function gateFlow(e) {
    const g = entityById(e.id);
    if (g?.look === 'crownwall') { let st = null; try { st = W.lockStatus(game, 'thornwall'); } catch (err) { st = null; } await openLockPrompt(ctx, { game, crownwall: true, status: st }); return null; }
    if (e.guard && W.present(game, walk.map).some((q) => q.kind === 'encounter' && q.enc === e.guard)) return encounterFlow(e.guard);
    await openMessage(ctx, { text: e.text || 'The way is shut.' });
    return null;
  }
  async function lockFlow(e) {
    const ent = entityById(e.id);
    const type = e.lock || (ent?.kind === 'hearthfire' ? 'cold-hearth' : ent?.lock);
    let st = e.status;
    try { st = W.lockStatus(game, type); } catch (err) { /* keep the event's */ }
    const choice = await openLockPrompt(ctx, { game, entity: ent, lockType: type, status: st });
    if (dead || choice !== 'use') return null;
    const r = W.openLock(game, e.id);
    if (!r.ok) { ctx.audio.sfx('error'); return null; }
    game = r.game; blocked = null;
    ctx.audio.sfx(ent?.kind === 'hearthfire' ? 'hearth' : 'unlock');
    o.toast(LOCKS[type]?.useText || 'Open.');
    save();
    if (ent?.kind === 'hearthfire') return hearthFlow(ent.id);
    return null;
  }
  async function chestFlow(e) {
    if (e.lock) { let st = null; try { st = W.lockStatus(game, e.lock); } catch (err) { st = null; } if (!st?.open) { await openLockPrompt(ctx, { game, lockType: e.lock, status: st }); return null; } }
    const r = W.openChest(game, e.id);
    if (!r.ok) { ctx.audio.sfx('error'); return null; }
    game = r.game;
    ctx.audio.sfx('chest');
    save();
    const words = lootWords({ gold: r.gold, materials: r.materials, gems: r.gems, bag: r.bag });
    if (words) o.toast(words);
    for (const it of r.items || []) { if (dead) return 'stop'; await cards(() => ctx.services.cardReveal(it, { source: 'drop', backdrop: W.mapOf(walk.map)?.backdrop })); }
    window.__g3.chests = (window.__g3.chests || 0) + 1;
    return null;
  }
  async function useFlow(e) {
    if (DIALOGUE[e.id]) return dialogueFlow(e.id);
    const ent = entityById(e.id), kind = e.kind || ent?.kind;
    if (kind === 'board' || kind === 'table') {
      const op = ent?.opens || (kind === 'table' ? 'atlas' : 'bounties');
      if (op === 'atlas') { leave('atlas', { mode: 'view' }); return 'stop'; }
      leave('journal', { tab: op === 'ladder' ? 'ladder' : 'bounties' }); return 'stop';
    }
    if (kind === 'pedestal') {
      const item = (game.inventory || []).find((i) => i.base === ent?.relic && !i.shattered);
      if (item) { await cards(() => ctx.services.cardInspect(item, {})); return null; }
      const r = RELICS[ent?.relic], seen = game.codex?.[ent?.relic]?.sighted;
      await openMessage(ctx, { text: seen ? `An empty pedestal. ${r?.name} belongs here. ${r?.holder ? `Last seen with ${r.holder}.` : ''}` : 'An empty pedestal, waiting for a relic you have not seen yet.' });
      return null;
    }
    if (kind === 'lookout') { await openMessage(ctx, { text: W.mapOf(walk.map)?.region === 'sunscorch' ? 'A long view over the sand, shimmering to the edge of the world.' : 'A long view over the trees.' }); return null; }
    if (kind === 'bellframe') { await openMessage(ctx, { text: 'An empty bell-frame. Something with wings took the bell.' }); return null; }
    return null;
  }
  async function hearthFlow(hfId) {
    const r = await openHearthMenu(ctx, { game, hfId });
    if (dead) return 'stop';
    if (r?.act === 'rest') {
      try { game = G.rest(game, hfId); } catch (err) { console.error(err); return null; }
      ctx.audio.sfx('hearth');
      save();
      o.toast(`Rested at ${HEARTHS[hfId]?.name || 'the fire'}. Day ${game.progress.flags.day}. Saved.`);
      window.__g3.rested = (window.__g3.rested || 0) + 1;
      const dream = Story.restDialogue ? Story.restDialogue(game, hfId) : null;
      if (dream && DIALOGUE[dream]) return dialogueFlow(dream);
      return null;
    }
    if (r?.act === 'travel' && r.to) {
      const g2 = G.travel(game, r.to);
      if (g2 === game || !g2.progress.pos) { ctx.audio.sfx('error'); return null; }
      game = g2; const p = game.progress.pos; ctx.audio.sfx('confirm');
      return transition({ map: p.map, at: [p.x, p.y], face: p.face });
    }
    if (r?.act === 'atlas') { leave('atlas', { mode: 'travel' }); return 'stop'; }
    if (r?.act === 'party') { leave('party'); return 'stop'; }
    return null;
  }
  async function contactFlow(e, before) {
    const r0 = (walk.roamers || []).find((r) => r.id === e.id) || (before?.roamers || []).find((r) => r.id === e.id);
    if (!r0) return null;
    bangs.set(e.id, performance.now() + 700); ctx.audio.sfx('alert');
    await sleep(ctx.reduced() ? 0 : 280);
    if (dead) return 'stop';
    const map = W.mapOf(walk.map), zone = ZONES[map?.zone];
    const tgt = r0.enc ? { nodeId: r0.enc } : { patrol: { spawns: r0.spawns || [], where: map?.name || 'The Wilds', backdrop: zone?.backdrop || map?.backdrop || 'verdant-wood', dark: !!map?.dark } };
    return battle(tgt, { enc: r0.enc || null, roamerId: e.id }, { ambush: !!e.ambush, firstStrike: !!e.firstStrike, caught: !!e.weak });
  }
  // the hand-off to a fight: M7's startBattle, saved, then the page's fight on this spot (o.fight)
  function battle(tgt, info, opts = {}) {
    let r;
    try { r = G.startBattle(game, tgt, opts); } catch (err) { console.error(err); o.toast('That fight would not start.'); return null; }
    const boss = Object.values(r.battle.units || {}).some((u) => u.side === 'foe' && tierAs(u.tier) === 'champion');
    game = r.game;
    save();
    pending = { ...info, boss, pos: { map: walk.map, x: walk.x, y: walk.y } };
    ctx.audio.music(boss ? 'boss' : 'battle');
    o.fight({ battle: r.battle, roamerId: info.roamerId || null, enc: info.enc || null });
    return 'battle';
  }
  function leave(name, p = {}) { save(); ctx.audio.sfx('confirm'); o.leave(name, { from: 'world', ...p }); }
  async function openMenu() {
    if (lock || overlayOpen() || dead || o.fighting()) return;
    const pick = await flow(() => openPauseMenu(ctx));
    if (dead || !pick) return;
    if (pick === 'title') { save(); o.leave('title'); return; }
    if (pick === 'journal') leave('journal', { tab: 'quests' });
    else if (pick === 'atlas') leave('atlas', { mode: 'view' });
    else leave(pick);
  }

  // ---- the page's own hooks ----
  dom.abtn.addEventListener('click', () => pressA());
  dom.menu.addEventListener('click', () => openMenu());
  addEventListener('keydown', (e) => {
    if (o.fighting() || o.away() || overlayOpen()) return;
    const k = e.key.toLowerCase();
    if (k === 'enter' || k === 'e' || k === ' ' || k === 'z') { e.preventDefault(); pressA(); }
    else if (k === 'escape' || k === 'm') { e.preventDefault(); openMenu(); }
  });
  const onHide = () => { if (document.visibilityState === 'hidden' && walk && !o.fighting()) save(); };
  document.addEventListener('visibilitychange', onHide);
  addEventListener('pagehide', () => { if (walk && !o.fighting()) save(); });

  const api = {
    get W() { return Wk; }, get game() { return game; }, get walk() { return walk; }, get leader() { return leader; }, get followers() { return followers; },
    get busy() { return lock > 0; }, get steps() { return steps; },
    // the first time the world is shown: a new, loaded or carried-over game, at its saved spot
    async start() {
      game = ctx.game;
      const pos = game.progress.pos || START_AT;
      const ok = W.mapOf(pos.map) && placeOf(pos.map);
      const tgt = ok ? { map: pos.map, at: [pos.x, pos.y], face: pos.face || 's' } : { map: START_AT.map, at: [START_AT.x, START_AT.y], face: START_AT.face };
      await flow(() => transition(tgt, { first: !Wk }));
    },
    // back from another screen (the party, the journal, a fight's aftermath): take the game back, and play what follows
    async back(params = {}) {
      game = ctx.game;
      const was = pending; pending = null;
      const pos = game.progress.pos;
      const same = walk && pos && pos.map === walk.map && pos.x === walk.x && pos.y === walk.y;
      document.body.classList.remove('g3-busy');
      await flow(async () => {
        if (!same) {
          // a wipe wakes the party at the Hearthfire (aftermath moved progress.pos), or the Atlas travelled
          await transition({ map: pos.map, at: [pos.x, pos.y], face: pos.face || 's' });
          if (was) walk = { ...walk, grace: Math.max(walk.grace || 0, TUNING.world?.grace ?? 6) };
        } else if (was) {
          walk = W.afterBattle(game, walk, { roamerId: was.roamerId, result: params.result || 'fled' });
        }
        dressParty();
        save();
        await afterReturn(params, was);
      });
    },
    // the figures a fight on this spot takes: the leader's spot, the way to the foes, the four heroes, the pack's figures
    fightSetup(info) {
      const L = leader.root.position.clone();
      let foes = [], c = null;
      const R = info.roamerId && roamers.get(info.roamerId);
      if (R) { foes = R.figs.map((f) => f.F); c = R.figs[0].root.position.clone(); roamers.delete(info.roamerId); }
      else if (info.enc) {
        const s = [...standing.values()].find((q) => q.e.enc === info.enc);
        if (s) { foes = [s.fig.F]; c = s.fig.root.position.clone(); standing.delete(s.e.id); }
      }
      for (const F of foes) F.pos.copy(F.root.position);
      const yaw = c ? Math.atan2(c.x - L.x, c.z - L.z) : Wk.io.yaw;
      const heroes = { [leadId()]: leader }; game.party.active.slice(1).forEach((id, i) => { if (followers[i]) heroes[id] = followers[i]; });
      return { W: Wk, center: L, yaw, heroes, foes };
    },
    // after the arena hands the land back: the heroes stand up straight, the leftover figures go
    afterFight() {
      for (const A of [leader, ...followers]) { if (!A) continue; A.hero.group.rotation.set(0, 0, 0); A.hero.group.position.set(0, 0, 0); A.root.visible = true; }
      dropRoamers();
      for (const s of [...standing.values()]) { if (!Wk.P.scene.children.includes(s.fig.root)) standing.delete(s.e.id); }
    },
    pause(on) { if (Wk) Wk.pause(on); },
    // the spoils: a hero who put something on is re-dressed on the field there and then (arena.swapHero)
    redress(g, arena) {
      const before = {}; for (const id of game.party.active) before[id] = gearKey(id);
      game = g;
      for (const id of game.party.active) {
        if (before[id] === gearKey(id)) continue;
        const A = id === leadId() ? W3D.witch(id) : actor(id, 'light');
        if (arena && arena.on) arena.swapHero(id, A);
        if (id === leadId()) leader = A; else { const i = game.party.active.indexOf(id) - 1; if (i >= 0) followers[i] = A; }
        o.toast(`${game.party.roster[id]?.name?.split(' ')[0] || id} puts it on`);
      }
    },
    pressA, openMenu, save, target,
    // the headless playthrough's hooks (tools/play.mjs)
    teleport(x, y, face) { const [px, py] = centre(x, y); walk = { ...walk, x, y, face: face || walk.face }; Wk.setIo(px, py, YAW[face] ?? Wk.io.yaw); blocked = null; },
    setGame(g) { game = g; ctx.setGame(g); stand(); },
    // the playthrough's: the standing foe (a road's guard) nearest by path, with a tile beside it to stand on
    nearestChest() {
      let best = null;
      for (const e of W.present(game, walk.map)) {
        if (e.kind !== 'chest' || e.state === 'opened' || e.hidden || e.lock) continue;
        const b = api.besideOf(e.id);
        if (b && (!best || b.n < best.n)) best = { id: e.id, n: b.n };
      }
      return best;
    },
    nearestGuard() {
      let best = null;
      for (const e of W.present(game, walk.map)) {
        if (e.kind !== 'encounter' || e.mode === 'pack' || e.talk) continue;
        const b = api.besideOf(e.id);
        if (b && (!best || b.n < best.n)) best = { id: e.id, n: b.n };
      }
      return best;
    },
    path(x, y, adjacent = false) { return W.findPath(game, walk, [x, y], { max: 400, adjacent }); },
    // set the leader down on a tile next to theirs (the page's own frame then takes the engine's step)
    nudge(x, y) { const [px, py] = centre(x, y), io = Wk.io; io.yaw = Math.atan2(px - io.px, py - io.py); io.px = px; io.py = py; },
    faceTo(d) { Wk.io.yaw = YAW[d] ?? Wk.io.yaw; shownA = ''; },
    // a walkable tile beside an entity, and the way to face it (e2e-world.mjs standBy, M7's)
    besideOf(id) {
      const e = W.present(game, walk.map).find((q) => q.id === id) || (W.mapOf(walk.map)?.entities || []).find((q) => q.id === id);
      if (!e) return null;
      const [x0, y0, x1, y1] = areaOf(e), mx = Math.round((x0 + x1) / 2), my = Math.round((y0 + y1) / 2);
      const spots = [[mx, y1 + 1, 'n'], [x0 - 1, my, 'e'], [x1 + 1, my, 'w'], [mx, y0 - 1, 's']];
      let best = null;
      for (const [x, y, f] of spots) { if (!W.canWalk(game, walk.map, x, y)) continue; const p = W.findPath(game, walk, [x, y], { max: 400 }); const n = p ? p.length : (x === walk.x && y === walk.y ? 0 : null); if (n != null && (!best || n < best.n)) best = { x, y, face: f, n }; }
      return best;
    },
  };

  async function afterReturn(params, was) {
    const brand = params.brand;
    if (brand) { await playBrandBanner(ctx, brand, game); if (brand.first !== false && CROWNWALL.open?.brand === brand.id) await playCrownwalls(ctx); }
    if (params.rematch) o.toast('A rematch: the Brand is already yours.');
    if (params.wokeAt) o.toast(`You wake at ${HEARTHS[params.wokeAt]?.name || ENCOUNTERS[params.wokeAt]?.name || 'the Hearthfire'}.`);
    const enc = was?.enc || params.enc, res = params.yield ? 'yield' : params.result;
    if (enc && res && Story.afterDialogue) { const d = Story.afterDialogue(game, enc, res); if (d && DIALOGUE[d]) await dialogueFlow(d); }
    const letter = Story.pendingLetter ? Story.pendingLetter(game) : null;
    if (letter) { await showLetter(ctx, letter); game = Story.readLetter(game, letter); save(); }
  }
  window.__g3 = Object.assign(window.__g3 || {}, { world: api });
  return api;
}
