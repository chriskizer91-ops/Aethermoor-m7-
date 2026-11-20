// fight.js: the Fight's page (November 20, step 1). The party walks Act One's Thornhollow in 3D (as on the Act One
// page); a pack of thornhounds and briarlings is out on the road. Walk up to it and the camera swings round, and M7's
// own battle plays out on that spot: M7's rules, M7's battle screen (its ribbon, cards, commands, dice tray, Analyze,
// log, Legend Surge), over the 3D land, with our stage (battle/stage3d.js) under it. When it ends the camera swings
// back behind the leader and the party walks on; another pack comes out on the road.
//   ?pack=0|1 which of Thornhollow's patrols (M7's PATROLS.thornhollow); ?lose=1 a pack far too strong (to see a defeat)
//   ?auto=1 the party fights on its own; ?speed=2|4; ?go=1 the fight starts at once (headless checks)
import './heroes.js';
import '../game/src/ui/theme.css';
import './battle/fight.css';
import { installCardServices } from '../game/src/ui/card.js';
import { setReducedGetter } from '../game/src/ui/lib/anim.js';
import { createAudio } from '../game/src/core/audio.js';
import { createInput } from '../game/src/core/input.js';
import { newGame, startBattle } from '../game/src/rules/gauntlet.js';
import { escalateSpawn } from '../game/src/rules/foe.js';
import { grantXp, xpForLevel } from '../game/src/rules/progression.js';
import { deriveHero } from '../game/src/rules/stats.js';
import { createRng } from '../game/src/core/rng.js';
import { PATROLS } from '../game/src/data/encounters.js';
import { heroGear } from '../game/src/ui/battle/sprites.js';
import { arena, foeFigure } from './battle/arena.js';
import { runFight } from './battle/run.js';

const Q = new URLSearchParams(location.search);
const PLACE = 'm7-thornhollow';
const PACK_AT = [[12, 14.2], [11.2, 13.6], [12.9, 13.5]]; // where the pack waits on the road (Thornhollow's tiles)
const tilePx = (c, r) => [c * 50 + 25, r * 40 + 20];       // a tile to the walking map's px (m7-kit.js: 50 x 40)

window.addEventListener('DOMContentLoaded', () => { main().catch((e) => { console.error(e); window.__err = String(e && e.stack || e); const m = document.getElementById('loadmsg'); if (m) m.textContent = 'Something went wrong: ' + e.message; }); });

async function main() {
  const $ = (id) => document.getElementById(id);
  const H = window.M7_HEROES, PL = window.W3D_PLACES, W3D = window.W3D;
  // a phone (a touch screen with no mouse) gets the lighter heroes and foes; ?quality=phone|high forces either (as the walk does)
  const QP = (location.search.match(/[?&]quality=(high|phone)/) || [])[1];
  const PHONE = QP ? QP === 'phone' : matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  let toastT = 0;
  const toast = (s, name) => { const t = $('toast'); t.textContent = s; t.classList.toggle('name', !!name); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, name ? 3200 : 2800); };

  // ---- M7's game, in memory only (this page never saves: M7's save is never written) ----
  let seed = Number(Q.get('seed')) || 7;
  let game = makeGame(seed);
  const gearOf = (id) => { const g = H.starterKit(id), m = heroGear(game, id) || {}; for (const [s, it] of Object.entries(m)) if (it) g[s] = it; if (m.weapon) g.offhand = m.offhand || null; return g; };
  const made = {};
  const get = (id, detail) => { const k = id + detail; return made[k] || (made[k] = H.actor(id, gearOf(id), detail)); };
  W3D.witch = (id) => get(id, PHONE ? 'light' : 'high');

  // ---- the walk (as on the Act One page) ----
  let W;
  W = await W3D.walk({
    place: PL[PLACE], root: $('world'), canvas: $('cv'), ring: $('ring'), dot: $('dot'), toast, who: 'warden',
    say: (s) => { $('loadmsg').textContent = s.replace(/\bIo\b/g, 'the party'); },
    onStats: (n) => { $('fps').textContent = n.fps; },
  });
  let leader = W3D.witch('warden'), followers = [];
  const party = window.M7_PARTY.create(W);
  const setFollowers = () => {
    for (const f of followers) W.P.scene.remove(f.root);
    followers = H.HEROES.filter(([id]) => id !== 'warden').map(([id]) => get(id, 'light'));
    for (const f of followers) W.P.scene.add(f.root);
    party.set(leader, followers);
  };
  setFollowers();

  // ---- the pack on the road ----
  let pack = null;
  function spawnPack() {
    const set = PATROLS.thornhollow[Q.get('pack') === '0' ? 0 : 1];
    const keys = set.map((s) => familyArt(s.family));
    const figs = keys.map((k) => foeFigure(k, { detail: PHONE ? 'light' : 'high' }));
    const M = W.P.M;
    figs.forEach((F, i) => {
      const [px, py] = tilePx(...PACK_AT[i % PACK_AT.length]);
      F.pos.set(M.x(px), W.P.walkH(px, py), M.z(py)); F.home.copy(F.pos); F.face = 0; F.wander = Math.random() * 6;
      F.root.position.copy(F.pos); W.P.scene.add(F.root);
    });
    pack = { set, figs, near: false };
  }
  spawnPack();
  let last = performance.now(), fighting = false;
  (function tick() {
    requestAnimationFrame(tick);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
    if (fighting || W.paused || W.isBusy()) return;
    party.step(dt, t);
    if (!pack) return;
    // the pack mills about, watching the party; close enough, and it comes at them
    const L = leader.root.position;
    let dmin = 1e9;
    for (const F of pack.figs) {
      F.wander += dt;
      const look = Math.atan2(L.x - F.pos.x, L.z - F.pos.z);
      let df = look - F.face; df = Math.atan2(Math.sin(df), Math.cos(df)); F.face += df * Math.min(1, dt * 2);
      F.root.position.set(F.pos.x + Math.sin(F.wander * 0.7) * 0.25, F.pos.y, F.pos.z + Math.cos(F.wander * 0.5) * 0.2);
      F.root.rotation.y = F.face;
      if (F.fig.beast) F.fig.beast.update(t + F.ph, 0);
      dmin = Math.min(dmin, Math.hypot(L.x - F.pos.x, L.z - F.pos.z));
    }
    if (dmin < 7.5 && !pack.near) { pack.near = true; toast('A pack on the road!'); }
    if (dmin < 5.2) fight();
  })();

  // ---- the fight ----
  const audio = createAudio(), input = createInput();
  addEventListener('pointerdown', () => { try { audio.unlock(); } catch (e) { /* no audio */ } }, { once: true });
  let settings = { sound: true, music: true, battleSpeed: Number(Q.get('speed')) || 1, reducedMotion: false };
  const reduced = () => !!settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = $('fight');
  const ctx = {
    get game() { return game; }, setGame(g) { if (g) game = g; },
    get settings() { return settings; }, setSettings(p) { settings = { ...settings, ...p }; },
    audio, input, services: {}, reduced, toast: (s) => toast(s), go() {},
  };
  installCardServices(ctx);
  setReducedGetter(reduced);

  async function fight() {
    if (fighting || !pack) return;
    fighting = true;
    // M7's own battle: the party (levelled to Thornhollow) against this pack, at the road's level
    const level = Number(Q.get('lose')) ? 12 : 4;
    const spawns = pack.set.map((sp, i) => escalateSpawn({ ...sp, level }, game.progress.waking, `fight3d#${i}`));
    const { battle } = startBattle(game, { patrol: { spawns, where: 'Thornhollow', backdrop: 'thornhollow' } });
    window.__fight.battle = battle;
    // the spot: where the leader stands, facing the pack
    const L = leader.root.position.clone(), c = pack.figs.reduce((a, F) => a.add(F.pos), new window.THREE.Vector3()).multiplyScalar(1 / pack.figs.length);
    const yaw = Math.atan2(c.x - L.x, c.z - L.z);
    const heroes = { warden: leader }; for (const f of followers) heroes[f.id] = f;
    for (const F of pack.figs) F.pos.copy(F.root.position);
    const resP = runFight({ W, battle, center: L, yaw, heroes, foes: pack.figs, ctx, host, auto: Q.get('auto') === '1', resume: false });
    const { result, outcome } = await resP;
    window.__fight.result = result;
    pack = null; fighting = false;
    if (result === 'defeat') {
      // the hearth wakes you: back at the gate, on your feet
      game = makeGame(++seed); for (const k of Object.keys(made)) delete made[k];
      W.setWho('pip'); W.setWho('warden'); leader = W3D.witch('warden'); setFollowers();
      const a = PL[PLACE].anchors['from-road']; W.setIo(a.at[0], a.at[1], a.face);
      toast('The hearth wakes you at the gate');
    } else if (result === 'victory') toast(`Victory: +${outcome?.xp || 0} XP, +${outcome?.gold || 0} gold`);
    else toast('You break away from the fight.');
    W.pause(false); party.set(leader, followers);
    window.__fight.ended = (window.__fight.ended || 0) + 1;
    setTimeout(() => { if (!pack && !fighting) { spawnPack(); toast('Another pack comes down the road'); } }, 6000);
  }

  $('fightbtn').addEventListener('click', () => { if (!pack) spawnPack(); fight(); });
  $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 700);
  setTimeout(() => toast('Thornhollow', true), 800);
  setTimeout(() => toast(PHONE ? 'Drag on the left to walk up the road' : 'W A S D to walk up the road'), 4200);
  window.__fight = { W, arena, start: fight, get pack() { return pack; }, get fighting() { return fighting; } };
  window.__ready = true;
  if (Q.get('go') === '1') setTimeout(fight, 300);
}

// M7's party, levelled to Thornhollow's road (level 4), in their starting gear
function makeGame(seed) {
  let game = newGame({ name: 'Wren', starter: 'hearthbrand', seed });
  const rng = createRng(`fight3d:${seed}`);
  for (const id of game.party.active) {
    let h = game.party.roster[id];
    const need = xpForLevel(4) - (h.xp || 0);
    if (need > 0) h = grantXp(h, need, rng).hero;
    const d = deriveHero(h, game.inventory);
    game.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
  }
  return game;
}
// the art a foe family wears (data/foes.js: family -> FOE_ART key; they share names)
function familyArt(family) { return family; }
