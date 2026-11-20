// runFight (November 20): one fight, start to end, on the spot where it happens. The way in for any page (the Fight's
// own page, fight.js; Together's game when a roaming pack meets the party).
//
//   const { result, battle, outcome } = await runFight({
//     W,        // the walking world (coven/engine/place/walker.js W3D.walk): its scene, camera and renderer are used
//     battle,   // M7's battle state (rules/gauntlet.js startBattle(...).battle)
//     center,   // THREE.Vector3: the ground where the heroes stand (the leader's spot)
//     yaw,      // the way from the heroes to the foes (radians, the walker's own: forward is (sin yaw, cos yaw))
//     heroes,   // { heroId: actor } the walking actors (world3d/heroes.js actor()), already in the scene
//     foes,     // optional: figures already standing there (arena.js foeFigure()), used for M7's foes of the same art
//     ctx,      // M7's screen toolkit: { game, setGame, settings, setSettings, audio, input, services, reduced, toast }
//               // (installCardServices(ctx) for the Legend Surge's card); its go() is not used
//     host,     // an element over the canvas for M7's battle screen (position: fixed; inset: 0; see battle/fight.css)
//     auto,     // optional: the party fights on its own
//     resume,   // optional, default true: the walk starts again once the camera is back behind the leader
//   });
//   result: 'victory' | 'defeat' | 'fled'; battle: the finished state (hand it to M7's aftermath screen, or
//   rules/gauntlet.js resolveBattle); outcome: rules/battle.js outcome(battle) (xp, gold, drops, claimed...).
//
// Pausing the walk, the swing round and back, the party's cheer or fall: all here. What the fight means for the game
// (XP, loot, waking at the hearth after a defeat) is the caller's.
import * as battleScreen from '../../game/src/ui/screens/battle.js';
import { arena } from './arena.js';

export function runFight({ W, battle, center, yaw, heroes, foes = [], ctx, host, auto = false, resume = true }) {
  return new Promise((resolve, reject) => {
    let screen = null, off = null;
    W.pause(true); document.body.classList.add('fighting');
    arena.begin({ W, center, yaw, heroes, foes });
    const fctx = Object.create(ctx, { go: { value: (name, p = {}) => { if (name === 'aftermath') done(p); } } });
    host.replaceChildren(); host.hidden = false;
    const main = document.createElement('main'); main.className = 'screen screen-battle'; host.append(main);
    try {
      screen = battleScreen.mount(main, fctx, { battle, returnTo: 'world', auto }) || {};
      if (screen.onAction && ctx.input) off = ctx.input.onAction(screen.onAction);
    } catch (e) { cleanup(); reject(e); return; }
    function cleanup() { if (screen && screen.unmount) screen.unmount(); if (off) off(); screen = null; off = null; host.hidden = true; host.replaceChildren(); }
    function done(p) {
      cleanup();
      const result = p.result?.result || 'victory';
      if (result === 'victory') arena.victory();
      setTimeout(() => arena.end(() => {
        for (const A of Object.values(heroes)) { A.hero.group.rotation.set(0, 0, 0); A.hero.group.position.set(0, 0, 0); A.root.visible = true; }
        document.body.classList.remove('fighting');
        if (resume) W.pause(false);
        resolve({ result, battle: p.battle, outcome: p.result });
      }), result === 'victory' ? 2600 : 1600);
    }
  });
}
