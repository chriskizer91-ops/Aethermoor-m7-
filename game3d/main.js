// game3d/main.js: Hearth & Heirloom in 3D, the page (Together, November 20).
// One game: M7's rules and M7's own screens, the 3D places of world3d/ under them.
//   - ctx is the toolkit every M7 screen is handed (game/src/ui/app.js has M7's): the game, saving (to the 3D game's own
//     key, game3d/save.js), settings, sound, keys, the card services, go(screen).
//   - 'world' is the 3D walk (walk.js), built once and kept; every other screen M7 has (the party, the journal, the
//     codex, the atlas, the after-fight, the new game) is mounted over it, as it is, and the walk waits underneath.
//   - a fight is the Fight's (world3d/battle/run.js runFight): M7's battle screen with the 3D stage swapped in at build
//     time (world3d/battle/swap.mjs), on the spot where the party met the foes.
// Address flags: ?new=1 a new journey at once (skips the title, keeps no name screen); ?auto=1 fights play themselves;
//   ?speed=2|4; ?test=1 the headless checks (the walker's clock only moves when told).
import '../world3d/heroes.js';
import '../game/src/ui/theme.css';
import '../game/src/ui/screens.css';
import '../game/src/ui/world.css';
import '../world3d/battle/fight.css';
import './game3d.css';
import { installCardServices } from '../game/src/ui/card.js';
import { setReducedGetter } from '../game/src/ui/lib/anim.js';
import { closeOverlays } from '../game/src/ui/lib/overlay.js';
import { createAudio } from '../game/src/core/audio.js';
import { createInput } from '../game/src/core/input.js';
import { migrate } from '../game/src/rules/migrate.js';
import { newGame } from '../game/src/rules/gauntlet.js';
import { grantXp, xpForLevel } from '../game/src/rules/progression.js';
import { deriveHero } from '../game/src/rules/stats.js';
import { createRng } from '../game/src/core/rng.js';
import * as aftermath from '../game/src/ui/screens/aftermath.js';
import * as partyScreen from '../game/src/ui/screens/party.js';
import * as journal from '../game/src/ui/screens/journal.js';
import * as codex from '../game/src/ui/screens/codex.js';
import * as newgame from '../game/src/ui/screens/newgame.js';
import * as settingsScreen from '../game/src/ui/screens/settings.js';
import { travel } from '../game/src/rules/gauntlet.js';
import { HEARTHS } from '../game/src/data/world.js';
import { arena } from '../world3d/battle/arena.js';
import { runFight } from '../world3d/battle/run.js';
import { loadLive, hasLive, saveLive, backupLive, clearLive, readM7, loadSettings, saveSettings } from './save.js';
import { createWorld, gearFor } from './walk.js';
import { setFoeLook, LOOKS, hdFoes } from './figures.js';
import { openParty } from '../world3d/battle/party-room.js';

const Q = new URLSearchParams(location.search);
window.__g3 = window.__g3 || {};
window.addEventListener('DOMContentLoaded', () => { main().catch((e) => { console.error(e); window.__err = String(e && e.stack || e); const m = document.getElementById('loadmsg'); if (m) m.textContent = 'Something went wrong: ' + e.message; }); });

const DEFAULTS = { sound: true, music: true, battleSpeed: Number(Q.get('speed')) || 1, reducedMotion: false, touchControls: 'auto', alwaysRun: false, mapZoom: 'normal' };
// M7's screens that lie over the 3D (the walk waits under them)
const SCREENS = { aftermath, party: partyScreen, journal, codex, newgame, settings: settingsScreen };

async function main() {
  const $ = (id) => document.getElementById(id);
  const PHONE = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  let toastT = 0;
  const toast = (s, name) => { const t = $('toast'); t.textContent = s; t.classList.toggle('name', !!name); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, name ? 3200 : 2800); };

  // ---- ctx: what M7's screens are handed ----
  const audio = createAudio(), input = createInput();
  let settings = loadSettings(DEFAULTS);
  if (Q.get('speed')) settings.battleSpeed = Number(Q.get('speed'));
  const reduced = () => !!settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let game = null, held = false;   // held: a carried-over game, kept in memory until the first step
  let current = null, currentName = null, fighting = false, world = null;
  const host = $('screen'), fhost = $('fight');
  const ctx = {
    get game() { return game; },
    setGame(g) { game = g || null; if (g && !held) saveLive(g); if (g && spoils && world) { try { world.redress(g, arena); } catch (e) { console.warn(e); } } },
    get carry() { return null; }, get carryFrom() { return null; }, get adopting() { return held; },
    adopt(g) { if (g) { game = g; held = true; } },
    commitAdopted() { if (!held || !game) return false; held = false; return saveLive(game); },
    replaceGame(g, { backup = true } = {}) { if (!g) return false; if (backup) backupLive(); held = false; game = g; return saveLive(g); },
    clearGame() { clearLive(); held = false; game = null; },
    migrate,
    get settings() { return settings; },
    setSettings(p) { settings = { ...settings, ...p }; saveSettings(settings); audio.setEnabled(settings.sound); if (audio.setMusicEnabled) audio.setMusicEnabled(settings.music !== false); },
    audio, input, services: { applySettings() {} }, reduced,
    toast: (s) => toast(s),
    go(name, params = {}) { go(name, params); },
    get screen() { return currentName; },
  };
  installCardServices(ctx);
  setReducedGetter(reduced);
  audio.setEnabled(settings.sound);
  addEventListener('pointerdown', () => { try { audio.unlock(); } catch (e) { /* no audio */ } }, { once: true });
  addEventListener('keydown', () => { try { audio.unlock(); } catch (e) { /* no audio */ } }, { once: true });

  function unmountScreen() {
    if (current && current.unmount) current.unmount();
    if (current && current.off) current.off();
    current = null; currentName = null;
    closeOverlays();
    host.replaceChildren(); host.hidden = true; document.body.classList.remove('g3-away');
  }
  function go(name, params = {}) {
    if (name === 'road') name = 'world';
    if (name === 'world') {
      const from = currentName;
      unmountScreen();
      if (!world) { startWorld(); return; }
      if (params.arrive === 'new' || params.arrive === 'load' || params.arrive === 'carry') { world.start(); return; }
      world.back(from === 'aftermath' ? params : {});
      return;
    }
    if (name === 'title') { unmountScreen(); if (world) world.pause(true); title(); return; }
    if (name === 'battle') { fightOn(params); return; }
    if (name === 'party' && world) { partyRoom(params); return; }
    if (name === 'atlas' && window.M7_ATLAS && window.M7_ATLAS.open) { atlas3d(); return; }
    const S = SCREENS[name];
    if (!S) { toast('Not in the 3D game yet.'); go('world'); return; }
    unmountScreen();
    if (world) world.pause(true);
    document.body.classList.add('g3-away');
    host.hidden = false;
    const main = document.createElement('main'); main.className = `screen screen-${name}`; host.append(main);
    currentName = name;
    current = S.mount(main, ctx, params) || {};
    if (current.onAction) current.off = input.onAction(current.onAction);
    host.scrollTop = 0;
  }

  // ---- the walk ----
  async function startWorld() {
    window.__g3.foeLook = { look: await setFoeLook(LOOKS.includes(Q.get('foes')) ? Q.get('foes') : 'hd'), full: hdFoes() };
    $('title').hidden = true;
    world = createWorld({
      ctx, places: window.W3D_PLACES, heroes: window.M7_HEROES, phone: PHONE, toast,
      dom: { world: $('world'), cv: $('cv'), ring: $('ring'), dot: $('dot'), load: $('load'), loadTitle: $('loadtitle'), loadMsg: $('loadmsg'), abtn: $('abtn'), prompt: $('prompt'), menu: $('menubtn'), marks: $('marks'), fps: $('fps') },
      leave: (name, p) => go(name, p),
      fight: (info) => fightOn(info),
      fighting: () => fighting,
      away: () => !!currentName,
    });
    window.__g3.world = world;
    await world.start();
    setTimeout(() => toast(PHONE ? 'Drag on the left to walk · A to talk and open' : 'W A S D walk · Shift runs · E or Enter is A'), 3800);
  }

  // ---- a fight on the spot: the Fight's own way in (world3d/battle/run.js runFight, keep: true), then the spoils on the
  // field (the drops lie as chests where the foes fell) with M7's own after-fight screen over it; equipping from a card
  // re-dresses that hero on the spot (ctx.setGame -> redress). Then the camera swings back and the walk goes on.
  let spoils = false;
  async function fightOn(info) {
    if (fighting || !info.battle) return;
    fighting = true;
    arena.speed = settings.battleSpeed || 1;
    window.__g3.battle = info.battle; window.__g3.fights = (window.__g3.fights || 0) + 1;
    let r;
    try { r = await runFight({ ...world.fightSetup(info), battle: info.battle, ctx, host: fhost, auto: Q.get('auto') === '1', resume: false, keep: true }); }
    catch (e) { console.error(e); fighting = false; world.afterFight(); go('world'); return; }
    window.__g3.lastResult = r.result;
    const items = r.result === 'victory' ? [...(r.outcome?.claimed || []), ...(r.outcome?.drops || [])] : [];
    let params = {};
    try {
      if (arena.spoilsView) arena.spoilsView();
      if (items.length && arena.loot) arena.loot(items);
      await new Promise((res) => setTimeout(res, items.length ? 1600 : 700));
      params = await afterOnField(r.battle);
    } catch (e) { console.error(e); }
    if (r.end) await r.end();
    fighting = false;
    world.afterFight();
    world.back(params);
  }
  // M7's after-fight screen over the field; it resolves with what it hands the world (result, brand, wokeAt...)
  function afterOnField(battle) {
    return new Promise((resolve) => {
      spoils = true;
      fhost.replaceChildren(); fhost.hidden = false; fhost.classList.add('spoils');
      const main = document.createElement('main'); main.className = 'screen screen-aftermath'; fhost.append(main);
      let screen = null, off = null;
      const onChest = (e) => { const b = e.target.closest && e.target.closest('button.chest'); if (b && arena.openLoot) arena.openLoot(+b.dataset.pick - 1); };
      const actx = Object.create(ctx, { go: { value: (name, p = {}) => {
        if (screen && screen.unmount) screen.unmount(); if (off) off();
        fhost.removeEventListener('click', onChest, true); fhost.hidden = true; fhost.classList.remove('spoils'); fhost.replaceChildren();
        spoils = false; window.__g3.aftermaths = (window.__g3.aftermaths || 0) + 1; resolve(p || {});
      } } });
      fhost.addEventListener('click', onChest, true);
      screen = aftermath.mount(main, actx, { battle, returnTo: 'world' }) || {};
      if (screen.onAction) off = input.onAction(screen.onAction);
    });
  }

  // ---- the Party: the Fight's party room (world3d/battle/party-room.js): M7's own Party screen with the hero turning in
  // 3D in their gear; equipping rebuilds them. Back on the walk, the party is dressed in what they now wear.
  async function partyRoom(params = {}) {
    unmountScreen(); world.pause(true); document.body.classList.add('g3-away'); currentName = 'party';
    const H = window.M7_HEROES;
    try { await openParty({ host: fhost, ctx, input, figure: (id) => H.actor(id, gearFor(game, id), PHONE ? 'light' : 'high'), hero: params.hero || game.party.active[0] }); }
    catch (e) { console.error(e); }
    fhost.hidden = true; fhost.replaceChildren(); fhost.classList.remove('party-room'); document.body.classList.remove('g3-away'); currentName = null;
    world.back({});
  }

  // ---- the Atlas on the 3D continent: the Places job's piece (world3d/m7/atlas.js), M7_ATLAS.open({ at, kindled }) ->
  // { place, hearthfire } | null. A kindled Hearthfire chosen there is travelled to by M7's own rule (gauntlet.js travel),
  // from the menu's Atlas as from a Hearthfire's. Without the piece on the page, M7's own Atlas screen stands in.
  async function atlas3d() {
    world.pause(true);
    const g = game;
    let pick = null;
    try { pick = await window.M7_ATLAS.open({ at: g.progress.pos?.map, kindled: Object.keys(g.progress.flags.kindled || {}).filter((id) => g.progress.flags.kindled[id]) }); } catch (e) { console.error(e); }
    const hf = pick && pick.hearthfire;
    if (hf && HEARTHS[hf]) { const g2 = travel(g, hf); if (g2 && g2 !== g) { ctx.setGame(g2); toast(`You travel to ${HEARTHS[hf].name}.`); } }
    world.back({});
  }

  // ---- the title: go on, start again, or bring M7's party ----
  function title() {
    const T = $('title'); T.hidden = false;
    $('load').style.display = 'none';
    const box = $('titlebtns'); box.replaceChildren();
    const b = (label, sub, fn, cls = '') => { const x = document.createElement('button'); x.className = 'g3-big ' + cls; x.innerHTML = label + (sub ? `<small>${sub}</small>` : ''); x.onclick = fn; box.append(x); return x; };
    const live = hasLive() ? loadLive() : null;
    const m7 = readM7();
    // a page without the Wilds (the Sunscorch's): a journey can begin where this page does, or come by its save code
    const PL = window.W3D_PLACES || {}, here = (m) => !!PL['m7-' + m];
    const actTwo = !here('thornhollow') && here('sun-road');
    const begin = () => { T.hidden = true; if (world) { world.start(); } else { $('load').style.display = 'grid'; $('load').style.opacity = 1; startWorld(); } };
    if (live && !here(live.progress.pos?.map)) {
      b('Go on (from the Keep)', `${live.party.roster[live.party.active[0]]?.name || 'The party'} · day ${live.progress.flags.day || 1}. Where you stood isn't on this page; you start in the Great Hall.`, () => { game = live; held = false; begin(); }, 'primary');
    } else if (live) b('Go on', `${live.party.roster[live.party.active[0]]?.name || 'The party'} · day ${live.progress.flags.day || 1}`, () => { game = live; held = false; begin(); }, 'primary');
    if (actTwo) {
      b('Begin at the Sunscorch', 'Act One done (both Brands of the Wilds, the Council sat), the party at level 8, at the Keep\'s south-east gate', () => { backupLive(); game = actTwoStart(); held = false; saveLive(game); begin(); }, live ? '' : 'primary');
      b('Bring a journey by its save code', 'From the Act One page: Menu, Settings, copy the code; paste it here in Settings', () => { T.hidden = true; go('settings', { from: 'title' }); });
    } else b('A new journey', 'The prologue, then the Great Hall', () => { T.hidden = true; go('newgame', {}); }, live ? '' : 'primary');
    if (m7) b('Bring the party from the 2D game', `Your M7 save, read only: ${m7.party.roster[m7.party.active[0]]?.name || 'the party'}, day ${m7.progress.flags.day || 1}. The 2D game's save is never changed.`, () => { backupLive(); game = structuredClone(m7); held = true; begin(); });
    window.__ready = true;
  }

  // the journey as Act One leaves it, made by M7's own rules: level 8, both Brands of the Wilds, the Council sat, standing
  // at the Keep's south-east gate (which the end of Act One opens onto the Sun Road)
  function actTwoStart() {
    const g = newGame({ name: 'Wren', starter: 'hearthbrand', seed: Number(Q.get('seed')) || 21 });
    const rng = createRng('sunscorch-start');
    for (const id of g.party.active) {
      let h = g.party.roster[id];
      const need = xpForLevel(8) - (h.xp || 0);
      if (need > 0) h = grantXp(h, need, rng).hero;
      const d = deriveHero(h, g.inventory);
      g.party.roster[id] = { ...h, hp: d.maxHp, mp: d.maxMp };
    }
    const f = g.progress.flags;
    f.story = { ...f.story, 'intro-done': true, 'act1-complete': true, 'council-done': true };
    for (const enc of ['keep-vault', 'briarmaw-den', 'rotwarden-heart']) { f.done[enc] = true; f.cleared[enc] = true; f.beaten = { ...(f.beaten || {}), [enc]: 1 }; }
    g.progress.brands = ['brand-of-briars', 'brand-of-the-heartroot'];
    g.progress.act = 2;
    g.progress.pos = { map: 'keep', x: 22, y: 22, face: 's' };
    return g;
  }

  // ?new=1: straight into a new journey (the headless checks)
  if (Q.get('act2') === '1') { clearLive(); game = actTwoStart(); saveLive(game); startWorld(); }
  else if (Q.get('new') === '1') {
    clearLive();
    game = newGame({ name: Q.get('name') || 'Wren', starter: 'hearthbrand', seed: Number(Q.get('seed')) || 7 });
    saveLive(game);
    startWorld();
  } else title();
}
