// game3d/main.js: Hearth & Heirloom in 3D, the page (Together, November 20).
// One game: M7's rules and M7's own screens, the 3D places of world3d/ under them.
//   - ctx is the toolkit every M7 screen is handed (game/src/ui/app.js has M7's): the game, saving (to the 3D game's own
//     key, game3d/save.js), settings, sound, keys, the card services, go(screen).
//   - 'world' is the 3D walk (walk.js), built once and kept; every other screen M7 has (the party, the journal, the
//     codex, the atlas, the after-fight, the new game) is mounted over it, as it is, and the walk waits underneath.
//   - 'battle' is the Fight's: M7's battle screen with the 3D stage swapped in at build time (world3d/battle/swap.mjs),
//     on the spot where the party met the foes (world3d/battle/arena.js).
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
import * as battleScreen from '../game/src/ui/screens/battle.js';
import * as aftermath from '../game/src/ui/screens/aftermath.js';
import * as partyScreen from '../game/src/ui/screens/party.js';
import * as journal from '../game/src/ui/screens/journal.js';
import * as codex from '../game/src/ui/screens/codex.js';
import * as newgame from '../game/src/ui/screens/newgame.js';
import * as settingsScreen from '../game/src/ui/screens/settings.js';
import { arena } from '../world3d/battle/arena.js';
import { loadLive, hasLive, saveLive, backupLive, clearLive, readM7, loadSettings, saveSettings } from './save.js';
import { createWorld } from './walk.js';

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
    setGame(g) { game = g || null; if (g && !held) saveLive(g); },
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
    const S = SCREENS[name];
    if (!S) { toast(name === 'atlas' ? 'The Atlas opens on the 3D continent in the next step.' : 'Not in the 3D game yet.'); go('world'); return; }
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

  // ---- a fight on the spot (the Fight's arena and M7's battle screen, as world3d/fight.js runs them) ----
  let screen = null, offAction = null;
  function fightOn(info) {
    if (fighting) return;
    if (!info.battle) return;
    fighting = true; world.pause(true); document.body.classList.add('fighting');
    arena.speed = settings.battleSpeed || 1;
    arena.begin(world.fightSetup(info));
    fhost.replaceChildren(); fhost.hidden = false;
    const main = document.createElement('main'); main.className = 'screen screen-battle'; fhost.append(main);
    const fctx = Object.create(ctx, { go: { value: (name, p) => { if (name === 'aftermath') fightOff(p); else go(name, p); } } });
    screen = battleScreen.mount(main, fctx, { battle: info.battle, returnTo: 'world', auto: Q.get('auto') === '1' }) || {};
    if (screen.onAction) offAction = input.onAction(screen.onAction);
    window.__g3.battle = info.battle; window.__g3.fights = (window.__g3.fights || 0) + 1;
  }
  function fightOff(p) {
    if (screen && screen.unmount) screen.unmount(); if (offAction) offAction(); screen = null; offAction = null;
    fhost.hidden = true; fhost.replaceChildren();
    const res = p?.result?.result || 'victory';
    window.__g3.lastResult = res;
    if (res === 'victory') arena.victory();
    setTimeout(() => {
      arena.end(() => {
        fighting = false; document.body.classList.remove('fighting');
        world.afterFight();
        // M7's own after-fight screen (XP, level-ups, gold, the chests and their cards), over the 3D
        go('aftermath', { battle: p.battle, returnTo: 'world' });
      });
    }, res === 'victory' ? 2200 : 1400);
  }

  // ---- the title: go on, start again, or bring M7's party ----
  function title() {
    const T = $('title'); T.hidden = false;
    $('load').style.display = 'none';
    const box = $('titlebtns'); box.replaceChildren();
    const b = (label, sub, fn, cls = '') => { const x = document.createElement('button'); x.className = 'g3-big ' + cls; x.innerHTML = label + (sub ? `<small>${sub}</small>` : ''); x.onclick = fn; box.append(x); return x; };
    const live = hasLive() ? loadLive() : null;
    const m7 = readM7();
    const begin = () => { T.hidden = true; if (world) { world.start(); } else { $('load').style.display = 'grid'; $('load').style.opacity = 1; startWorld(); } };
    if (live) b('Go on', `${live.party.roster[live.party.active[0]]?.name || 'The party'} · day ${live.progress.flags.day || 1}`, () => { game = live; held = false; begin(); }, 'primary');
    b('A new journey', 'The prologue, then the Great Hall', () => { T.hidden = true; go('newgame', {}); }, live ? '' : 'primary');
    if (m7) b('Bring the party from the 2D game', `Your M7 save, read only: ${m7.party.roster[m7.party.active[0]]?.name || 'the party'}, day ${m7.progress.flags.day || 1}. The 2D game's save is never changed.`, () => { backupLive(); game = structuredClone(m7); held = true; begin(); });
    window.__ready = true;
  }

  // ?new=1: straight into a new journey (the headless checks)
  if (Q.get('new') === '1') {
    clearLive();
    game = newGame({ name: Q.get('name') || 'Wren', starter: 'hearthbrand', seed: Number(Q.get('seed')) || 7 });
    saveLive(game);
    startWorld();
  } else title();
}
