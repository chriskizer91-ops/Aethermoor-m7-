// The heroes for the borrowed world: three.js (this repo's version) as the window.THREE the borrowed scripts expect, and
// the gear-built heroes of prototypes/hero-3d with an actor face the borrowed walker understands.
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildHero, setPose } from '../hero-3d/model.js';
import { Q } from '../hero-3d/kit.js';
import { generateItem, relicItem } from '../../game/src/rules/loot.js';
import { HERO_ART } from '../../game/src/art/hero-looks.js';
import { SLOTS } from '../../game/src/art/item-looks.js';
import { createRng } from '../../game/src/core/rng.js';

// the borrowed scripts were written for an older three.js: a plain, writable THREE with the few old names they use
const THREE = { ...T };
THREE.sRGBEncoding = 3001; THREE.LinearEncoding = 3000;
THREE.BufferGeometryUtils = { mergeBufferGeometries: mergeGeometries, mergeVertices };
window.THREE = THREE;

const TALL = 1.72; // a hero stands this tall in the world (metres); the Gear Room shows them at 1.22 on its plinth
const rng = createRng('walk:' + (Date.now() % 100000));
export function starterKit(id) {
  const st = HERO_ART[id].starter, g = {};
  for (const s of SLOTS) g[s] = st[s] ? { ...st[s], starter: true } : null;
  if (id === 'warden') g.weapon = relicItem('hearthbrand', rng, { from: 'the Keep reliquary' });
  return g;
}
export function rollOutfit(id, rarity) {
  const g = starterKit(id);
  for (const s of ['weapon', 'head', 'body', 'hands', 'feet', 'amulet']) { const it = generateItem(rng, { slot: s, rarity, ilvl: 30 }); delete it.unidentified; g[s] = it; }
  if (!['staff', 'bow', 'spear'].includes(g.weapon?.kind)) { const it = generateItem(rng, { slot: 'offhand', rarity, ilvl: 30 }); delete it.unidentified; g.offhand = it; } else g.offhand = null;
  return g;
}
// actor(id, gear, detail): what the borrowed walker asks of whoever walks: root, walkRun, animate(phase, walking, time, dt)
export function actor(id, gear, detail = 'high') {
  Q.d = detail === 'high' ? 2 : 1;
  const H = buildHero(id, gear, {});
  const root = new T.Group(); root.add(H.group); H.group.scale.setScalar(TALL / 1.22);
  const A = { id, root, hero: H, walkRun: false, camera: null, step: 0, strike: -1,
    animate(phase, walking, t, dt) {
      H.rig.run = A.walkRun;
      if (A.strike >= 0) { A.strike += dt / 0.75; setPose(H.rig, 'strike', t, Math.min(1, A.strike)); if (A.strike >= 1) A.strike = -1; return; }
      if (walking > 0.5) { A.step += dt * (A.walkRun ? 11 : 7.2); setPose(H.rig, 'walk', t, A.step); }
      else setPose(H.rig, 'idle', t, 0);
    } };
  return A;
}
window.M7_HEROES = { actor, starterKit, rollOutfit, HEROES: [['warden', 'Wren'], ['pip', 'Pip'], ['bryn', 'Bryn'], ['alondra', 'Alondra']] };
