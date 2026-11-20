// The heroes for the borrowed world: three.js (this repo's version) as the window.THREE the borrowed scripts expect, and
// the gear-built heroes of prototypes/hero-3d with an actor face the borrowed walker understands.
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildHero, setPose } from '../prototypes/hero-3d/model.js';
import { buildPerson, PEOPLE, buildLod, LOD } from '../prototypes/hero-3d/people.js';
import { Q } from '../prototypes/hero-3d/kit.js';
import { generateItem, relicItem } from '../game/src/rules/loot.js';
import { HERO_ART } from '../game/src/art/hero-looks.js';
import { SLOTS } from '../game/src/art/item-looks.js';
import { createRng } from '../game/src/core/rng.js';

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
// detail: 'high' (laptops), 'light' (phones), 'lite' (phones: the hero in two draws) or 'auto' (Light near the camera,
// Lite beyond LOD.near metres; only the one showing is posed). A.hero is the Light/High figure; A.lod.current is the one
// showing.
export function actor(id, gear, detail = 'high') {
  const Ld = buildLod(lite => buildHero(id, gear, { lite }), detail), H = Ld.hero, root = Ld.root;
  const A = { id, root, hero: H, lod: Ld, walkRun: false, camera: null, step: 0, strike: -1,
    animate(phase, walking, t, dt) {
      const H = { rig: Ld.pick().rig };
      H.rig.run = A.walkRun;
      if (A.strike >= 0) { A.strike += dt / 0.75; setPose(H.rig, 'strike', t, Math.min(1, A.strike)); if (A.strike >= 1) A.strike = -1; return; }
      if (walking > 0.5) { A.step += dt * (A.walkRun ? 11 : 7.2); setPose(H.rig, 'walk', t, A.step); }
      else setPose(H.rig, 'idle', t, 0);
    } };
  return A;
}
// person(npcId, detail): one of M7's townsfolk as a walker, the same shape as actor(); standing it shifts its weight and
// looks round, A.talking = true makes it talk with its hands, walking it walks
export function person(npcId, detail = 'high') {
  const Ld = buildLod(lite => buildPerson(npcId, { lite }), detail), H = Ld.hero, root = Ld.root;
  const A = { lod: Ld, id: npcId, name: H.name, role: H.role, root, hero: H, rig: H.rig, height: TALL, walkRun: false, talking: false, step: 0, phase: Math.random() * 20,
    update(t, dt, walking) { A.animate(0, walking ? 1 : 0, t, dt); },
    animate(phase, walking, t, dt) {
      const R = Ld.pick().rig; A.rig = R;
      R.run = A.walkRun;
      if (walking > 0.5) { A.step += dt * (A.walkRun ? 11 : 7.2); setPose(R, 'walk', t, A.step); }
      else setPose(R, A.talking ? 'talk' : 'stand', t + A.phase, 0);
    } };
  return A;
}
window.M7_HEROES = { actor, person, PEOPLE, LOD, starterKit, rollOutfit, HEROES: [['warden', 'Wren'], ['pip', 'Pip'], ['bryn', 'Bryn'], ['alondra', 'Alondra']] };
