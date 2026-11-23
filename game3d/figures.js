// game3d/figures.js: who stands in a place besides the party (Together, November 20).
//   person(npcId, detail)     a person of M7's (data/npcs.js), by Models' townsfolk builder (prototypes/hero-3d/people.js)
//   foe(artKey, detail)       a foe: whatever the Fight's figure maker gives (world3d/battle/arena.js foeFigure). Chris is
//                             choosing between 3D models and painted cut-outs (questions.md): this is the one place to switch.
// Each figure: { root (a three.js group, feet at 0), update(t, dt, walking), height, F? (the arena's figure, for a fight) }
import { FOES } from '../game/src/data/foes.js';
import { setPose } from '../prototypes/hero-3d/model.js';
import { foeFigure, setBeastLook } from '../world3d/battle/arena.js';
import { buildBeast } from '../prototypes/bestiary/beasts.js';
import { standeeLook } from '../prototypes/bestiary/standee.js';
import { ready as hdReady } from '../prototypes/foe-hd/kit/js/loader.js';
import { register, foeLook, addMoves } from '../prototypes/foe-hd/kit/js/looks.js';
// the lanes' own move sets, added before registering (session 6): the desert lane's scorpion, lizard, wyrm (the Sand
// Wyrm's swallow) and Kharzul's
import * as scorpionMoves from '../prototypes/foe-hd/pages/desert-deep/moves/scorpion.js';
import * as lizardMoves from '../prototypes/foe-hd/pages/desert-deep/moves/lizard.js';
import * as wyrmMoves from '../prototypes/foe-hd/pages/desert-deep/moves/wyrm.js';
import * as kharzulMoves from '../prototypes/foe-hd/pages/desert-deep/moves/kharzul.js';
import { FOES_HD, WALKERS } from 'game3d:foes-hd';
import { registerWalkers } from '../prototypes/foe-hd/pages/walkers/register.js';
import { withWraiths, WRAITHS } from '../prototypes/wraiths/wraiths.js';
import { withArmoured, ARMOURED } from '../prototypes/armoured/armoured.js';
import { withWinged, WINGED } from '../prototypes/winged/winged.js';

// the foes' look (Chris is choosing; questions.md): 'hd' full detail where a foe has one (session 6's kit: Briarmaw;
// session 8's walkers: the Rotwarden and the sapwight; Models' eleven wraiths), the sculpted beasts for the rest (the default); 'hd-cutout' full detail, else Chris's painted cut-outs;
// '3d' the sculpted beasts only; 'cutout' the painted cut-outs only. ?foes=<look> on the address.
export const LOOKS = ['hd', 'hd-cutout', '3d', 'cutout'];
let hdDone = false;
export async function setFoeLook(look = 'hd') {
  if (look.startsWith('hd') && !hdDone) { try { await hdReady(); addMoves('scorpion', scorpionMoves); addMoves('lizard', lizardMoves); addMoves('wyrm', wyrmMoves); addMoves('kharzul', kharzulMoves); for (const A of FOES_HD) register(A); registerWalkers(WALKERS, register); hdDone = true; } catch (e) { console.warn('full-detail foes', e); } }
  const fall = look.endsWith('cutout') ? standeeLook : buildBeast;
  // Models' winged foes (lamp-moth, Gloamwing, Thunder-Roc), armoured and forge foes (the sentinels, the Ashen Warden, the
  // thralls, the forge-warden, the Unsmith...) and the eleven wraiths, rigid so always
  // allowed, come first in a full-detail look, as on the Fight's page
  setBeastLook(look.startsWith('hd') ? withWinged(withArmoured(withWraiths(hdDone ? foeLook(fall) : fall))) : look === 'cutout' ? standeeLook : null);
  return look;
}
export const hdFoes = () => [...FOES_HD.map((A) => A.key), ...Object.keys(WALKERS), ...WRAITHS, ...ARMOURED, ...WINGED];

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
