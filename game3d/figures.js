// game3d/figures.js: who stands in a place besides the party (Together, November 20).
//   person(npcId, detail)     a person of M7's (data/npcs.js), dressed by the heroes' builder from M7's own looks for them
//                             (art/map-sprites.js NPC_LOOKS; a person with a foe's look, art/foes.js foeLooks)
//   foe(artKey, detail)       a foe: whatever the Fight's figure maker gives (world3d/battle/arena.js foeFigure). Chris is
//                             choosing between 3D models and painted cut-outs (questions.md): this is the one place to switch.
// Each figure: { root (a three.js group, feet at 0), update(t, dt, walking), height, F? (the arena's figure, for a fight) }
import * as THREE from 'three';
import { buildHero, setPose } from '../prototypes/hero-3d/model.js';
import { Q } from '../prototypes/hero-3d/kit.js';
import { NPC_LOOKS } from '../game/src/art/map-sprites.js';
import { foeLooks, FOE_ART } from '../game/src/art/foes.js';
import { gearLooks } from '../game/src/art/item-looks.js';
import { NPCS } from '../game/src/data/npcs.js';
import { FOES } from '../game/src/data/foes.js';
import { foeFigure } from '../world3d/battle/arena.js';

const TALL = 1.72;   // as world3d/heroes.js: a grown person in the world, in metres

function lookOf(art) {
  if (NPC_LOOKS[art]) return { H: NPC_LOOKS[art].H, looks: gearLooks(NPC_LOOKS[art].gear || {}) };
  if (FOE_ART[art] && FOE_ART[art].kind === 'humanoid') { const f = foeLooks(art, { gearTier: 0 }); if (f.H) return { H: f.H, looks: f.gear }; }
  return { H: NPC_LOOKS.refugee.H, looks: gearLooks(NPC_LOOKS.refugee.gear || {}) };
}

export function person(npcId, detail = 'light') {
  const art = NPCS[npcId]?.art || npcId;
  Q.d = detail === 'high' ? 2 : 1;
  const { H, looks } = lookOf(art);
  const h = buildHero('warden', {}, { H, looks });
  const root = new THREE.Group(); root.add(h.group); h.group.scale.setScalar(TALL / 1.22);
  const ph = Math.random() * 10;
  let step = 0;
  return {
    root, height: TALL, rig: h.rig,
    update(t, dt, walking) { if (walking) { step += dt * 7.2; setPose(h.rig, 'walk', t, step); } else setPose(h.rig, 'idle', t + ph, 0); },
  };
}

// the art a foe family wears (data/foes.js FOES[family].art)
export const artOf = (familyOrArt) => FOES[familyOrArt]?.art || familyOrArt;

export function foe(artKey, detail = 'light') {
  const F = foeFigure(artOf(artKey), { detail });
  let step = 0;
  return {
    root: F.root, height: F.size.h, F,
    update(t, dt, walking) {
      if (F.fig.beast) { if (walking) step += dt * 12; F.fig.beast.update(t + F.ph, walking ? step : 0); }
      else if (F.fig.rig) { if (walking) { step += dt * 11; setPose(F.fig.rig, 'walk', t, step); } else setPose(F.fig.rig, 'idle', t + F.ph, 0); }
    },
  };
}
