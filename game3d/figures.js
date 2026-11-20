// game3d/figures.js: who stands in a place besides the party (Together, November 20).
//   person(npcId, detail)     a person of M7's (data/npcs.js), by Models' townsfolk builder (prototypes/hero-3d/people.js)
//   foe(artKey, detail)       a foe: whatever the Fight's figure maker gives (world3d/battle/arena.js foeFigure). Chris is
//                             choosing between 3D models and painted cut-outs (questions.md): this is the one place to switch.
// Each figure: { root (a three.js group, feet at 0), update(t, dt, walking), height, F? (the arena's figure, for a fight) }
import { FOES } from '../game/src/data/foes.js';
import { setPose } from '../prototypes/hero-3d/model.js';
import { foeFigure } from '../world3d/battle/arena.js';

// the townsfolk are Models' (prototypes/hero-3d/people.js personFigure: looks picked as M7's npcSheet does, a standing
// weight shift, a talking gesture while .talking is true)
export { personFigure as person } from '../prototypes/hero-3d/people.js';

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
