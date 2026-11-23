// fight.js: the Fight's page (November 20, step 1). The party walks Act One's Thornhollow in 3D (as on the Act One
// page); a pack of thornhounds and briarlings is out on the road. Walk up to it and the camera swings round, and M7's
// own battle plays out on that spot: M7's rules, M7's battle screen (its ribbon, cards, commands, dice tray, Analyze,
// log, Legend Surge), over the 3D land, with our stage (battle/stage3d.js) under it. When it ends the camera swings
// back behind the leader and the party walks on; another pack comes out on the road.
//   ?pack=0|1 which of Thornhollow's patrols (M7's PATROLS.thornhollow); ?lose=1 a pack far too strong (to see a defeat)
//   ?foes=cutout the beasts as Chris's painted standees (Models' prototypes/bestiary/standee.js); the Foes button switches
//   ?toll=1 Wren wears Hodge's Unfair Toll (M7's toll); ?omen=twinned the road's pack with M7's Twinned omen
//   ?level=N the party's level (to see a Champion's later phases)
//   ?surge=100 every hero's Legend Surge full (to see a Legend Strike); ?enc=<id> any M7 fight on this page's places
//   ?auto=1 the party fights on its own; ?speed=2|4; ?go=1 the fight starts at once (headless checks)
import './heroes.js';
import '../game/src/ui/theme.css';
import '../game/src/ui/screens.css';
import * as aftermathScreen from '../game/src/ui/screens/aftermath.js';
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
import { relicItem } from '../game/src/rules/loot.js';
import { PATROLS, ENCOUNTERS } from '../game/src/data/encounters.js';
import { MAPS } from '../game/src/data/maps/index.js';
import { FOES } from '../game/src/data/foes.js';
import { heroGear } from '../game/src/ui/battle/sprites.js';
import { arena, foeFigure, setBeastLook } from './battle/arena.js';
import { standeeLook } from '../prototypes/bestiary/standee.js';
import { buildBeast } from '../prototypes/bestiary/beasts.js';
import { ready as hdReady } from '../prototypes/foe-hd/kit/js/loader.js';
import { register as hdRegister, foeLook as hdFoeLook, addMoves } from '../prototypes/foe-hd/kit/js/looks.js';
// the lanes' own move sets, added before registering (session 6, November 23): the desert lane's scorpion and lizard
import * as scorpionMoves from '../prototypes/foe-hd/pages/desert-deep/moves/scorpion.js';
import * as lizardMoves from '../prototypes/foe-hd/pages/desert-deep/moves/lizard.js';
import * as wyrmMoves from '../prototypes/foe-hd/pages/desert-deep/moves/wyrm.js';
import * as kharzulMoves from '../prototypes/foe-hd/pages/desert-deep/moves/kharzul.js';
// a foe whose own set its files don't name (Kharzul's say 'scorpion'): registered with it by key
const OWN_MOVES = { kharzul: kharzulMoves };
import { FOES as HD_FOES, WALKERS as HD_WALKERS } from 'fight-foe-assets';
// session 8's walkers (the Rotwarden, the sapwight) go in with their own bones and moves, as Together's game does
import { registerWalkers } from '../prototypes/foe-hd/pages/walkers/register.js';
// Models' eleven wraiths (rigid pieces, so they never stretch): first in line for their keys, the kit for the rest
import { withWraiths } from '../prototypes/wraiths/wraiths.js';
// Models' armoured walkers and the Unsmith (rigid pieces too): the iron sentinels, their captain, the Ashen Warden
import { withArmoured } from '../prototypes/armoured/armoured.js';
// Models' winged (the lamp-moth, Gloamwing, the Thunder-Roc): hovering moths, the Roc's flight moves
import { withWinged } from '../prototypes/winged/winged.js';
import { runFight } from './battle/run.js';
import { openParty } from './battle/party-room.js';

const Q = new URLSearchParams(location.search);
// the two fights: where, who waits there (at which tiles), M7's battle for it, and the party's level for it
// ?pack=6: six on the road (three thornhounds, three briarlings), to measure a crowded fight on a phone
const ROAD_SET = () => Q.get('pack') === '6' ? [...PATROLS.thornhollow[1], PATROLS.thornhollow[1][0], PATROLS.thornhollow[1][0], PATROLS.thornhollow[1][1]] : PATROLS.thornhollow[Q.get('pack') === '0' ? 0 : 1];
const SCENES = {
  road: { place: 'm7-thornhollow', name: 'Thornhollow', anchor: 'from-road', level: 4, near: 'A pack on the road!', again: 'Another pack comes down the road',
    hint: 'walk up the road', foes: () => ROAD_SET().map((s) => s.family),
    at: [[12, 14.2], [11.2, 13.6], [12.9, 13.5], [10.6, 14.4], [13.4, 14.3], [12, 13.2]], trigger: 5.2,
    battle: (game, keys) => startBattle(game, { patrol: { spawns: ROAD_SET().map((sp, i) => escalateSpawn({ ...sp, level: Number(Q.get('lose')) ? 12 : 4, ...(Q.get('omen') ? { omens: [Q.get('omen')] } : {}) }, game.progress.waking, `fight3d#${i}`)), where: 'Thornhollow', backdrop: 'thornhollow' } }) },
};
// any of M7's placed fights (step 3), from M7's own data: the map it is on (its 3D place), where the foes stand and which
// way they face (the map's encounter entity), the party's level (the strongest spawn's, one more for a lair)
const FACE = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const ENC_AT = {};
for (const m of Object.values(MAPS)) for (const e of m.entities || []) if (e.kind === 'encounter' && ENCOUNTERS[e.enc]) ENC_AT[e.enc] = { map: m, e };
// where the party comes in, for a fight whose spot from M7's facing isn't open ground in 3D (agreed with Places):
// the Thunder-Roc's eyrie: 4.5 tiles east of the nest is inside the crevasse, so the party stands on the plateau's east
// lip where the crossing comes in, facing the nest
const START = { 'roc-eyrie': [6.3, 15] };
function encScene(id) {
  const { map, e } = ENC_AT[id] || {}; if (!map) return null;
  const E = ENCOUNTERS[id], sp = E.spawns || [], n = Math.max(1, sp.length);
  let f = FACE[e.face || 's'];
  if (START[id]) { const d = [START[id][0] - e.at[0], START[id][1] - e.at[1]], L = Math.hypot(...d); f = [d[0] / L, d[1] / L]; }
  const st = START[id] || [e.at[0] + f[0] * 4.5, e.at[1] + f[1] * 4.5];
  const across = (i) => (i - (n - 1) / 2) * 0.9;
  return { id, enc: true, place: 'm7-' + map.id, name: E.name, where: map.name, level: Math.max(1, ...sp.map((s) => s.level || 1)) + (e.mode === 'lair' ? 1 : 0),
    near: E.name, again: `${E.name}: back for another go`, hint: 'walk up to them', trigger: 5.5,
    foes: () => sp.map((s) => s.family), at: sp.map((_, i) => [e.at[0] + across(i) * Math.abs(f[1]), e.at[1] + across(i) * Math.abs(f[0])]),
    start: st, face: Math.atan2(-f[0], -f[1]),
    battle: (game) => startBattle(game, { nodeId: id }) };
}
SCENES.den = encScene('briarmaw-den');
// the beasts' look: 'hd' (the default: every finished full-detail foe, the foe kit's of sessions 6-8 and Models' wraiths;
// the rest as sculpted), '3d' (all sculpted) or 'cutout' (Chris's painted standees)
const LOOKS = ['hd', '3d', 'cutout'];
let look = LOOKS.includes(Q.get('foes')) ? Q.get('foes') : 'hd', hdLook = null;
async function useLook(k) {
  if (k === 'hd' && !hdLook) { await hdReady(); addMoves('scorpion', scorpionMoves); addMoves('lizard', lizardMoves); addMoves('wyrm', wyrmMoves); addMoves('kharzul', kharzulMoves); for (const A of HD_FOES) hdRegister(A, { res: Number(Object.keys(A.tex)[0]), moves: OWN_MOVES[A.key] }); registerWalkers(HD_WALKERS, hdRegister); hdLook = withWinged(withArmoured(withWraiths(hdFoeLook(buildBeast)))); }
  setBeastLook(k === 'cutout' ? standeeLook : k === 'hd' ? hdLook : null);
}
let SC = Q.get('enc') && encScene(Q.get('enc')) || SCENES[Q.get('fight') === 'briarmaw' ? 'den' : 'road'];
const tilePx = (c, r) => [c * 50 + 25, r * 40 + 20];       // a tile to the walking map's px (m7-kit.js: 50 x 40)
const familyArt = (family) => FOES[family]?.art || family;

window.addEventListener('DOMContentLoaded', () => { main().catch((e) => { console.error(e); window.__err = String(e && e.stack || e); const m = document.getElementById('loadmsg'); if (m) m.textContent = 'Something went wrong: ' + e.message; }); });

async function main() {
  const $ = (id) => document.getElementById(id);
  const H = window.M7_HEROES, PL = window.W3D_PLACES, W3D = window.W3D;
  // a page without Thornhollow starts on the first fight whose place it carries
  if (!PL[SC.place]) SC = encScene(Object.keys(ENC_AT).find((id) => PL['m7-' + ENC_AT[id].map.id])) || SC;
  // a phone (a touch screen with no mouse) gets the lighter heroes and foes; ?quality=phone|high forces either (as the walk does)
  const QP = (location.search.match(/[?&]quality=(high|phone)/) || [])[1];
  const PHONE = QP ? QP === 'phone' : matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  let toastT = 0;
  const toast = (s, name) => { const t = $('toast'); t.textContent = s; t.classList.toggle('name', !!name); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, name ? 3200 : 2800); };

  // ---- M7's game, in memory only (this page never saves: M7's save is never written) ----
  let seed = Number(Q.get('seed')) || 7;
  let game = makeGame(seed, SC.level);
  const gearOf = (id) => { const g = H.starterKit(id), m = heroGear(game, id) || {}; for (const [s, it] of Object.entries(m)) if (it) g[s] = it; if (m.weapon) g.offhand = m.offhand || null; return g; };
  const made = {};
  const get = (id, detail) => { const k = id + detail; return made[k] || (made[k] = H.actor(id, gearOf(id), detail)); };
  W3D.witch = (id) => get(id, PHONE ? 'light' : 'high');

  // ---- the walk (as on the Act One page) ----
  let W;
  W = await W3D.walk({
    place: PL[SC.place], root: $('world'), canvas: $('cv'), ring: $('ring'), dot: $('dot'), toast, who: 'warden',
    say: (s) => { $('loadmsg').textContent = s.replace(/\bIo\b/g, 'the party'); },
    onStats: (n) => { $('fps').textContent = n.fps; },
  });
  window.__fight = {};
  // where the party comes in: the place's way in (the road), or a few tiles before the foes, facing them
  const startOf = (S) => { if (S.anchor) { const a = PL[S.place].anchors[S.anchor]; return [a.at[0], a.at[1], a.face]; } const [x, y] = W.nearestFit(...tilePx(...S.start)); return [x, y, S.face]; };
  W.setIo(...startOf(SC));
  let leader = W3D.witch('warden'), followers = [];
  const party = window.M7_PARTY.create(W);
  const setFollowers = () => {
    for (const f of followers) W.P.scene.remove(f.root);
    followers = H.HEROES.filter(([id]) => id !== 'warden').map(([id]) => get(id, PHONE ? 'lite' : 'light'));
    for (const f of followers) W.P.scene.add(f.root);
    party.set(leader, followers);
  };
  setFollowers();

  // ---- the pack on the road ----
  let pack = null;
  function spawnPack() {
    const keys = SC.foes().map(familyArt);
    const figs = keys.map((k) => foeFigure(k, { detail: PHONE ? 'light' : 'high' }));
    const M = W.P.M;
    figs.forEach((F, i) => {
      const [px, py] = tilePx(...SC.at[i % SC.at.length]);
      F.pos.set(M.x(px), W.P.walkH(px, py), M.z(py)); F.home.copy(F.pos); F.face = 0; F.wander = Math.random() * 6;
      F.root.position.copy(F.pos); W.P.scene.add(F.root);
    });
    pack = { keys, figs, near: false };
  }
  await useLook(look);
  spawnPack();
  let last = performance.now(), fighting = false;
  (function tick() {
    requestAnimationFrame(tick);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
    if (fighting || W.paused || W.isBusy() || !window.__ready) return;
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
    if (dmin < SC.trigger + 2.3 && !pack.near) { pack.near = true; toast(SC.near); }
    if (dmin < SC.trigger) fight();
  })();

  // ---- the fight ----
  const audio = createAudio(), input = createInput();
  addEventListener('pointerdown', () => { try { audio.unlock(); } catch (e) { /* no audio */ } }, { once: true });
  let settings = { sound: true, music: true, battleSpeed: Number(Q.get('speed')) || 1, reducedMotion: false };
  const reduced = () => !!settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = $('fight');
  // the gear each hero wears, as M7 has it: when a card is equipped in the spoils, that hero is re-dressed on the spot
  const gearKey = (id) => JSON.stringify(game.party.roster[id]?.gear || {});
  let worn = {};
  for (const [id] of H.HEROES) worn[id] = gearKey(id);
  const redress = () => {
    for (const [id] of H.HEROES) {
      const k = gearKey(id); if (worn[id] === k) continue;
      const first = worn[id] === undefined; worn[id] = k; if (first) continue;
      for (const m of Object.keys(made)) if (m.startsWith(id)) delete made[m];
      const A = get(id, id === 'warden' ? (PHONE ? 'light' : 'high') : (PHONE ? 'lite' : 'light'));
      if (arena.on) arena.swapHero(id, A);
      toast(`${H.HEROES.find((h) => h[0] === id)[1]} puts it on`);
    }
  };
  const ctx = {
    get game() { return game; }, setGame(g) { if (g) { game = g; try { redress(); } catch (e) { console.warn(e); } } },
    get settings() { return settings; }, setSettings(p) { settings = { ...settings, ...p }; },
    audio, input, services: {}, reduced, toast: (s) => toast(s), go() {},
  };
  installCardServices(ctx);
  setReducedGetter(reduced);

  async function fight() {
    if (fighting || !pack) return;
    fighting = true;
    // M7's own battle for this place: the road's patrol, or Briarmaw's den
    let battle;
    try { battle = SC.battle(game, pack.keys).battle; } catch (e) { console.error(e); fighting = false; return; }
    window.__fight.battle = battle;
    // the spot: where the leader stands, facing the pack
    const L = leader.root.position.clone(), c = pack.figs.reduce((a, F) => a.add(F.pos), new window.THREE.Vector3()).multiplyScalar(1 / pack.figs.length);
    const yaw = Math.atan2(c.x - L.x, c.z - L.z);
    // on a phone the leader fights as a lite figure (two draws, not forty) standing in for the walking one
    let stand = null;
    if (PHONE) { stand = get('warden', 'lite'); stand.root.position.copy(leader.root.position); stand.root.rotation.copy(leader.root.rotation); W.P.scene.add(stand.root); leader.root.visible = false; }
    const heroes = { warden: stand || leader }; for (const f of followers) heroes[f.id] = f;
    for (const F of pack.figs) F.pos.copy(F.root.position);
    let resP;
    for (const [id] of H.HEROES) worn[id] = gearKey(id);
    try { resP = runFight({ W, battle, center: L, yaw, heroes, foes: pack.figs, ctx, host, auto: Q.get('auto') === '1', resume: false, keep: true }); } catch (e) { console.error(e); fighting = false; W.pause(false); return; }
    const { result, outcome, battle: done, end } = await resP;
    window.__fight.result = result;
    // the spoils: what the foes dropped lies where they fell, then M7's own after-fight screen over the field (XP and
    // levels, gold, a chest for each drop opening into M7's card reveal; equipping re-dresses the hero there and then)
    const items = result === 'victory' ? [...(outcome?.claimed || []), ...(outcome?.drops || [])] : [];
    arena.spoilsView();
    if (items.length) { arena.loot(items); }
    await new Promise((r) => setTimeout(r, items.length ? 1800 : 900));
    await spoils(done);
    window.__fight.spoiled = (window.__fight.spoiled || 0) + 1;
    await end();
    // the stand-in (or whoever the spoils re-dressed in its place) leaves; the walking leader comes back
    if (stand) { const fw = arena.heroes.get('warden')?.A; for (const r of [stand.root, fw?.root]) if (r && r !== leader.root) W.P.scene.remove(r); leader.root.visible = true; }
    pack = null; fighting = false;
    W.setWho('pip'); W.setWho('warden'); leader = W3D.witch('warden'); setFollowers();
    if (result === 'defeat') {
      // the hearth wakes you (M7's aftermath has already put the party on its feet): back at the way in
      W.setIo(...startOf(SC));
    }
    W.pause(false); party.set(leader, followers);
    window.__fight.ended = (window.__fight.ended || 0) + 1;
    setTimeout(() => { if (!pack && !fighting) { spawnPack(); toast(SC.again); } }, 6000);
  }

  // M7's after-fight screen, over the field; it hands back when the player taps on (its own button)
  function spoils(battle) {
    return new Promise((resolve) => {
      host.replaceChildren(); host.hidden = false; host.classList.add('spoils');
      const main = document.createElement('main'); main.className = 'screen screen-aftermath'; host.append(main);
      let screen = null, off = null;
      const actx = Object.create(ctx, { go: { value: () => { if (screen && screen.unmount) screen.unmount(); if (off) off(); host.removeEventListener('click', onChest, true); host.hidden = true; host.classList.remove('spoils'); host.replaceChildren(); resolve(); } } });
      // a chest opened in the screen bursts its chest on the ground
      const onChest = (e) => { const b = e.target.closest && e.target.closest('button.chest'); if (b) arena.openLoot(+b.dataset.pick - 1); };
      host.addEventListener('click', onChest, true);
      screen = aftermathScreen.mount(main, actx, { battle, returnTo: 'world' }) || {};
      if (screen.onAction) off = input.onAction(screen.onAction);
    });
  }

  // M7's Party screen over the walk, the hero turning in 3D in their gear; back to walking in whatever they put on
  $('partybtn').addEventListener('click', async () => {
    if (fighting || W.isBusy() || W.paused) return;
    W.pause(true); document.body.classList.add('fighting');
    await openParty({ host, ctx, input, figure: (id) => H.actor(id, gearOf(id), PHONE ? 'light' : 'high') });
    W.setWho('pip'); W.setWho('warden'); leader = W3D.witch('warden'); setFollowers();
    document.body.classList.remove('fighting'); W.pause(false);
  });

  $('fightbtn').addEventListener('click', () => { if (!pack) spawnPack(); fight(); });
  $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 700);
  // the other fight: Briarmaw's den from the road, the road from the den
  async function goScene(key) {
    if (fighting || W.isBusy()) return;
    const next = SCENES[key] || encScene(key); if (!next || !PL[next.place]) return;
    SC = next;
    if (pack) for (const F of pack.figs) W.P.scene.remove(F.root);
    pack = null;
    $('load').style.display = 'grid'; $('load').style.opacity = 1; $('load').querySelector('h1').textContent = SC.name; $('loadmsg').textContent = 'Walking on…';
    await new Promise((r) => setTimeout(r, 40));
    game = makeGame(++seed, SC.level); for (const k of Object.keys(made)) delete made[k];
    if (W.P.place !== PL[SC.place]) await W.switchTo(PL[SC.place], ...tilePx(0, 0), 0);
    W.setIo(...startOf(SC));
    W.setWho('pip'); W.setWho('warden'); leader = W3D.witch('warden'); setFollowers();
    spawnPack(); label(); drawList();
    $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 600);
    hello();
  }
  const label = () => { $('fightbtn').textContent = SC === SCENES.road ? 'Meet the pack' : 'Fight'; $('scenebtn').textContent = 'Fights'; };
  // the Fights list: every M7 fight whose place this page carries, by place (the road's pack first)
  const list = $('fights');
  function drawList() {
    list.replaceChildren();
    const add = (key, label, sub) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `${label}<small>${sub}</small>`; b.className = (SC.id || 'road') === key ? 'on' : ''; b.onclick = () => { list.classList.remove('on'); goScene(key); }; list.append(b); };
    if (PL[SCENES.road.place]) add('road', 'A pack on Thornhollow\'s road', 'Thornhollow · thornhounds and briarlings');
    for (const [id, { map }] of Object.entries(ENC_AT)) if (PL['m7-' + map.id]) { const E = ENCOUNTERS[id]; add(id, E.name, `${map.name} · ${[...new Set((E.spawns || []).map((x) => FOES[x.family]?.name || x.family))].join(', ')}`); }
  }
  drawList();
  // the beasts' look, for Chris to choose: the painted standees from his sheets, or the sculpted ones
  const looks = () => { $('looksbtn').textContent = { '3d': 'Foes: 3D', cutout: 'Foes: Painted', hd: 'Foes: Full detail' }[look]; };
  $('looksbtn').addEventListener('click', async () => {
    if (fighting) return;
    look = LOOKS[(LOOKS.indexOf(look) + 1) % LOOKS.length]; await useLook(look); looks();
    if (pack) for (const F of pack.figs) W.P.scene.remove(F.root);
    pack = null; spawnPack();
    toast({ '3d': 'The foes as 3D models', cutout: 'The foes as Chris painted them', hd: `In full detail: ${[...HD_FOES.map((A) => A.key), ...Object.keys(HD_WALKERS), 'the wraiths', 'the armoured walkers', 'the Unsmith', 'the winged'].join(', ')}` }[look]);
  });
  looks();
  $('scenebtn').addEventListener('click', () => { drawList(); list.classList.toggle('on'); });
  label();
  const hello = () => { setTimeout(() => toast(SC.name, true), 300); setTimeout(() => toast(PHONE ? `Drag on the left to ${SC.hint}` : `W A S D to ${SC.hint}`), 3600); };
  setTimeout(hello, 500);
  Object.assign(window.__fight, { W, arena, start: fight, goScene, get pack() { return pack; }, get fighting() { return fighting; } });
  window.__ready = true;
  if (Q.get('go') === '1') setTimeout(fight, 300);
}

// M7's party, levelled for the fight (the road 4, the den 7, as M7's maps are), in their starting gear
function makeGame(seed, level = 4) {
  if (Q.get('level')) level = Number(Q.get('level')); // ?level=N: the party at level N (a test switch, to see a long fight through)
  let game = newGame({ name: 'Wren', starter: 'hearthbrand', seed });
  const rng = createRng(`fight3d:${seed}`);
  for (const id of game.party.active) {
    let h = game.party.roster[id];
    const need = xpForLevel(level) - (h.xp || 0);
    if (need > 0) h = grantXp(h, need, rng).hero;
    const d = deriveHero(h, game.inventory);
    game.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp, ...(Q.get('surge') ? { surge: Number(Q.get('surge')) } : {}) };
  }
  // ?toll=1: Wren wears Hodge's Unfair Toll, so M7's toll is due at the fight's start (the strongest foe's CHA save)
  if (Q.get('toll')) { const it = relicItem('unfair-toll', rng, { from: 'Hodge' }); game.inventory = [...game.inventory, it]; game.party.roster.warden = { ...game.party.roster.warden, gear: { ...game.party.roster.warden.gear, amulet: it.uid } }; }
  return game;
}
