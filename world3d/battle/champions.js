// The Champions' own moves (step 5, November 21): every named move of a Champion or a Relic-Bearer gets its own moment
// in 3D, built from M7's own words for it (game/src/data/foes.js). Keyed by foe family and move id:
//   move    the body's move: one of the foe kit's common set (bite, strike, swipe, cast, roar), or a foe's own move
//           of that name where its lane made one (F.pose plays it, or its nearest)
//   start   what shows as the move begins (c: { ar, F, fx, heroes: the heroes it is aimed at, all: every hero })
//   land    what shows when it lands (the blow on a hero, or the middle of a move on itself)
//   camera  'close' (in on the foe, as the Legend Strike is on a hero) or 'wide' (back and up, to see the whole field)
// A move missing here plays the kit's pick for M7's words (arena.js kitMove) with no extra effect.
import { GENERATED } from './champion-moves.js';

const head = (c) => c.F.pos.clone().setY(c.F.pos.y + c.F.size.h * 0.95);
// a hero's chest and feet, brought a little towards the camera: the fight's camera stands behind the party, so a blow
// drawn at the middle of a hero would be hidden by the hero's own back (the arena sets the camera with setMomentCam)
let CAM = null;
export function setMomentCam(cam) { CAM = cam; }
const nearer = (h, p, by) => { if (!CAM) return p; const d = CAM.position.clone().sub(h.pos).setY(0); if (d.lengthSq() < 1e-6) return p; return p.addScaledVector(d.normalize(), by); };
const chest = (h) => nearer(h, h.pos.clone().setY(h.pos.y + 1.1), 0.5);
const feet = (h) => nearer(h, h.pos.clone().setY(h.pos.y + 0.02), 0.4);

export const MOMENTS = {
  // ---- Briarmaw, Act One's Champion (his den) ----
  'briarmaw:maul': { // "Bark-clad claws the size of shovels."
    move: 'swipe',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#d8c090', true); c.fx.sparks(chest(h), '#c9a878', 16); } },
  },
  'briarmaw:thorn-volley': { // "It shakes, and thorns fly like arrows."
    move: 'roar',
    start: (c) => { const from = head(c); c.all.forEach((h, i) => { for (let k = 0; k < 3; k++) c.fx.thorn(from.clone().add(rand(0.4)), chest(h).add(rand(0.25)), '#3f5a26', 0.34, 0.35 + i * 0.06 + k * 0.08); }); },
    land: (c) => { for (const h of c.all) c.fx.sparks(chest(h), '#8ad872', 8); },
  },
  'briarmaw:call-the-briars': { // "The thorn-crown pulses and a Briarling tears up out of the floor."
    move: 'roar', camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#8ad872', 2.2, 1.0); c.fx.ring(c.F.pos.clone(), '#8ad872', 2.5, 0.9); },
    land: (c) => { c.fx.pulse(head(c), '#c8ff90', 1.6, 0.6); },
  },
  'briarmaw:fang-rake': { // "The great fang opens you up: Bleeding."
    move: 'bite',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ff5040', true); c.fx.sparks(chest(h), '#e0402e', 22, { spread: 0.9 }); } },
  },
  'briarmaw:bramble-wall': { // "Bramble knits over its hide: Warded."
    move: 'cast',
    land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.1, Math.max(0.6, c.F.size.d * 0.45), '#3f7a2a', 1.4); },
  },
  'briarmaw:rootquake': { // "The den floor heaves: ... and you are Rooted."
    move: 'strike', camera: 'wide',
    start: (c) => { c.shake(2); c.fx.ring(c.F.pos.clone(), '#a07a48', 6, 1.1); },
    land: (c) => { c.shake(3); for (const h of c.all) c.fx.roots(feet(h), '#5a3a1e', 6, 1.8); },
  },
  'briarmaw:devour': { // "It opens its whole bramble-maw, charging."
    move: 'bite', camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#5a7a2a', 1.4, 0.9); },
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#7a1a10', true); c.fx.sparks(chest(h), '#5a1a10', 30, { spread: 1.2 }); } c.shake(2); },
  },
  'briarmaw:thornstorm': { // "A storm of thorns: everyone Bleeds."
    move: 'roar', camera: 'wide',
    start: (c) => { c.fx.pulse(head(c), '#8ad872', 2.6, 1.2); for (const h of c.all) for (let k = 0; k < 6; k++) { const to = chest(h).add(rand(0.5)); c.fx.thorn(to.clone().add(rand(1.5)).setY(to.y + 4 + Math.random() * 2), to, '#2f4a1e', 0.4, 0.3 + Math.random() * 0.6); } },
    land: (c) => { for (const h of c.all) c.fx.sparks(chest(h), '#e0402e', 12); },
  },

  // ---- the Rotwarden, Act One's second Champion (the Heartroot's heart). Session 8's walker names some of its moves
  // for M7's (rootlash, grasping-roots, bark-hide, blacken, devour): those play where it has them, else the common one
  'rotwarden:rootlash': { // "A root as thick as a mast lashes out."
    move: ['rootlash', 'swipe'],
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#8a6a44', true); c.fx.roots(feet(h), '#4a3018', 3, 1.0); } },
  },
  'rotwarden:bark-hide': { // "Plate and bark grow together: Warded."
    move: ['bark-hide', 'cast'],
    land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.05, Math.max(0.5, c.F.size.w * 0.7), '#5a4426', 1.4); },
  },
  'rotwarden:graft': { // "The First Seed pulses, and a Sapwight tears out of the wall."
    move: ['graft', 'roar'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#b4d65a', 2.0, 1.0); },
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#b4d65a', 3, 0.9); },
  },
  'rotwarden:blacken': { // "The mask weeps black: 2d8 blight to all, and it drinks."
    move: ['blacken', 'cast'], camera: 'wide',
    start: (c) => { c.fx.pulse(head(c), '#3a2a4a', 2.0, 1.2); },
    land: (c) => { for (const h of c.all) { c.fx.sparks(chest(h), '#2a1a30', 16, { spread: 0.7, up: -0.5 }); c.fx.thorn(chest(h), head(c), '#4a2a5a', 0.5, 0.4); } },
  },
  'rotwarden:grasping-roots': { // "The floor reaches up. STR save or Rooted."
    move: ['grasping-roots', 'roar'], camera: 'wide',
    start: (c) => { c.shake(2); },
    land: (c) => { for (const h of c.all) c.fx.roots(feet(h), '#4a3018', 7, 1.9); },
  },
  'rotwarden:ichor-tide': { // "Black sap floods the chamber: 2 stacks of Poisoned."
    move: ['ichor-tide', 'swipe'],
    start: (c) => { c.fx.ring(c.F.pos.clone(), '#1a1420', 7, 1.4); },
    land: (c) => { for (const h of c.all) c.fx.sparks(feet(h).setY(h.pos.y + 0.3), '#3a5a20', 14, { spread: 0.9, up: 0.5 }); },
  },
  'rotwarden:heartroot-bloom': { // "The Seed blooms: Regenerating."
    move: ['heartroot-bloom', 'cast'],
    land: (c) => { c.fx.pulse(head(c), '#8ad872', 1.8, 1.2); c.fx.sparks(head(c), '#c8ff90', 24, { spread: 0.8, up: 1.4 }); },
  },
  'rotwarden:ichor-rain': { // "It rains sap from the roots: 2d6 blight and Poisoned."
    move: ['ichor-rain', 'roar'], camera: 'wide',
    start: (c) => { for (const h of c.all) for (let k = 0; k < 5; k++) { const to = chest(h).add(rand(0.6)); c.fx.thorn(to.clone().setY(to.y + 4), to, '#1a1a10', 0.45, 0.2 + Math.random() * 0.6); } },
  },
  'rotwarden:devour': { // "The bark splits into a maw, charging."
    move: ['devour', 'bite'], camera: 'close',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#5a3a1e', true); c.fx.sparks(chest(h), '#3a2a18', 28, { spread: 1.1 }); } c.shake(2); },
  },
  'rotwarden:unmaking': { // "The mask turns to one of you, charging."
    move: ['unmaking', 'cast'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#c89aff', 1.6, 1.4); },
    land: (c) => { for (const h of c.heroes) { c.fx.pillar(feet(h), '#6a3cae', 4); } c.shake(3); },
  },
  'rotwarden:grief': { // "It weeps sap. Something under the wood says 'Thank you.'"
    move: ['grief', 'cast'],
    start: (c) => { c.fx.sparks(head(c), '#3a2a18', 18, { spread: 0.4, up: -0.6 }); },
  },

  // ---- the rest of Act One's Champions and Relic-Bearers, in the order they're met (hand-made November 21 from M7's
  // words; each looked at in slow-mode stills). People (Haskett, Mags, Hollis, Dun, the Sergeant, the Thornmother)
  // fight with the heroes' body moves, so their moments are all in the effects
  ...TALLY('tallyman/signalmaster'), ...TALLY('tallyman/counter'),
  'bandit/poacher:hack': { // "A workmanlike chop."
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e0d0'); c.fx.sparks(chest(h), '#c8b8a0', 10); } },
  },
  'bandit/poacher:shield-bash': { // "Rim to the jaw: Staggers."
    land: (c) => { for (const h of c.heroes) { c.fx.ring(chest(h), '#d8c8a8', 0.9, 0.4, 0); c.fx.sparks(head1(h), '#fff0c0', 16, { spread: 0.6 }); } c.shake(1); },
  },
  'bandit/poacher:dirty-trick': { // "A knee where it counts. Frightened."
    land: (c) => { for (const h of c.heroes) { c.fx.sparks(chest(h).setY(h.pos.y + 0.7), '#e8e0d0', 10, { spread: 0.4 }); c.fx.mark(head1(h), '#c8a8ff', 0.28, 1.2); } },
  },
  'bandit/poacher:heavy-swing': { // "Winds up a two-handed swing."
    camera: 'close',
    start: (c) => { c.fx.sparks(mid(c), '#e8e0d0', 6, { spread: 0.3, up: 0.6 }); },
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff', true); c.fx.sparks(chest(h), '#ffe0a0', 24, { spread: 1 }); } c.shake(2); },
  },
  'bandit/poacher:second-wind': { // "Spits, steadies, keeps coming."
    land: (c) => { c.fx.pulse(mid(c), '#e8d8b0', 1.2, 0.7); c.fx.ring(c.F.pos.clone(), '#e8d8b0', 1.3, 0.7); },
  },
  'bandit/poacher:longshot': { // "Hartshorn draws to the ear, charging a shot that crackles."
    camera: 'close',
    start: (c) => { c.fx.pulse(mid(c), '#cfe0ff', 0.9, 1.4); c.fx.sparks(mid(c), '#e8f0ff', 10, { spread: 0.3, up: 0.3 }); },
    land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), chest(h), 'arrow', '#cfe0ff', 0.22); c.fx.later(0.2, () => { c.fx.pillar(feet(h), '#d8e8ff', 3); c.fx.sparks(chest(h), '#e8f0ff', 22, { spread: 1 }); }); } c.shake(2); },
  },

  'smuggler/queen:cut': { // "A smuggler's knife, quick and low."
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h).setY(h.pos.y + 0.8), c.ar.cam, '#e0e8f0'); c.fx.sparks(chest(h), '#c8d0d8', 8); } },
  },
  'smuggler/queen:caltrops': { // "Iron burrs across the path. DEX save or Rooted."
    land: (c) => { for (const h of c.all) c.fx.scatter(feet(h), '#5a5a62', 10, 0.9, 2.0); },
  },
  'smuggler/queen:bolt': { // "Gone into the reeds."
    land: (c) => { c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#9a9480', 9, 1.0, 1.4); c.fx.sparks(c.F.pos.clone().setY(c.F.pos.y + 0.4), '#7a8a5a', 14, { spread: 0.8, up: 0.5 }); },
  },
  'smuggler/queen:sleight': { // "Lightfingers finds your purse and your ribs: 2d6, Marked, and Mags is Hasted."
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffe8a0'); c.fx.sparks(chest(h), '#ffd860', 12, { spread: 0.5, up: 0.8 }); c.fx.mark(head1(h), '#ffe8a0'); } c.fx.ring(c.F.pos.clone(), '#ffe8a0', 1.2, 0.5); },
  },

  'mirelord:belly-flop': { // "The Mire-King lands on everyone at once."
    move: 'strike', camera: 'wide',
    land: (c) => { c.shake(3); c.fx.splash(c.F.pos.clone(), '#6a7a40', 28, 1.4); for (const h of c.all) c.fx.splash(feet(h), '#7a8a48', 12, 1); },
  },
  'mirelord:drag-under': { // "A tongue like a hawser, charging to drag you under."
    move: 'bite', camera: 'close',
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mouth(c, h), chest(h), '#c0606a', 0.13, 1.0, { wrap: true }); c.fx.later(0.4, () => c.fx.splash(feet(h), '#6a7a40', 16, 1.1)); } },
  },
  'mirelord:wallow': { // "It settles into the mire: Regenerating."
    move: 'cast',
    land: (c) => { c.fx.splash(c.F.pos.clone(), '#5a6a38', 14, 0.6); c.fx.pulse(mid(c), '#8ad872', 1.4, 1.0); },
  },
  'mirelord:undertow': { // "The pearl glows in its reed crown: 2d6 tide to all, and you are Chilled."
    move: 'roar', camera: 'wide',
    start: (c) => { c.fx.pulse(head(c), '#e8f4ff', 1.4, 1.2); },
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#4aa0c0', 7, 1.2); for (const h of c.all) { c.fx.splash(feet(h), '#8ad0e8', 14, 1.2); c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); } },
  },

  'hollowed-ranger/sergeant:rot-arrow': { // "A black-fletched arrow: Poisoned."
    land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), chest(h), 'arrow', '#7a9a30', 0.24); c.fx.later(0.22, () => c.fx.sparks(chest(h), '#5a7a20', 16, { spread: 0.6, up: -0.3 })); } },
  },
  'hollowed-ranger/sergeant:knife': { // "A ranger's knife, from habit."
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#d8d8d0'); c.fx.sparks(chest(h), '#c8c8c0', 8); } },
  },
  'hollowed-ranger/sergeant:remember': { // "It says a name. Its own."
    land: (c) => { c.fx.pulse(head(c), '#ffe8b0', 0.8, 1.6); c.fx.sparks(head(c), '#fff4d0', 8, { spread: 0.3, up: 0.6 }); },
  },
  'hollowed-ranger/sergeant:hold-the-line': { // "The Oathshield comes up and the patrol closes ranks: Warded."
    land: (c) => { for (const F of c.ar.foes.values()) if (!F.removed && !F.ko) { c.fx.ring(F.pos.clone(), '#a8c8ff', Math.max(1, F.size.w), 0.9, F.size.h * 0.5); } c.fx.pulse(mid(c), '#c8d8ff', 1.4, 0.8); },
  },

  'feral-druid/thornmother:thorn-lash': { // "A staff wrapped in living thorn."
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#3f5a26', 0.05, 0.55, { bulb: false, gloss: false }); c.fx.later(0.2, () => { c.fx.slash(chest(h), c.ar.cam, '#8ad872'); c.fx.sparks(chest(h), '#3f5a26', 12); }); } },
  },
  'feral-druid/thornmother:barkskin': { // "Bark creeps over the druid's skin: Warded."
    land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.05, Math.max(0.4, c.F.size.w * 0.6), '#5a4426', 1.4); },
  },
  'feral-druid/thornmother:call-the-briars': { // "The druid sings and a Briarling tears up out of the ground."
    camera: 'close',
    start: (c) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.26, () => c.fx.ring(c.F.pos.clone(), '#8ad872', 3, 1.0)); c.fx.pulse(head(c), '#8ad872', 1.2, 1.2); },
    land: (c) => { const at = c.F.pos.clone().addScaledVector(c.ar.dir, -1.2); c.fx.roots(at, '#4a3018', 7, 1.4); },
  },
  'feral-druid/thornmother:rising-sap': { // "Rootsong hums: every foe heals 2d6 and Regenerates."
    land: (c) => { for (const F of c.ar.foes.values()) if (!F.removed && !F.ko) { c.fx.pulse(F.pos.clone().setY(F.pos.y + F.size.h * 0.6), '#8ad872', 1.2, 1.1); c.fx.sparks(F.pos.clone().setY(F.pos.y + 0.2), '#c8ff90', 14, { spread: 0.5, up: 1.4 }); } },
  },

  'gloamwing:wing-buffet': { // "Pale wings hit like a door slammed in a gale."
    move: ['wing-buffet', 'swipe'],
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#f0ecf8', true); c.fx.smoke(feet(h), '#d8d0c8', 6, 1.0, 0.9); } c.shake(1); },
  },
  'gloamwing:dreamdust': { // "Scales like snow. WIS save or Frightened."
    move: ['dreamdust', 'cast'],
    land: (c) => { for (const h of c.heroes) { c.fx.sparks(head1(h).setY(h.pos.y + 2.4), '#f4f0ff', 30, { spread: 0.9, up: -0.8 }); c.fx.mark(head1(h), '#c8a8ff', 0.28, 1.2); } },
  },
  'gloamwing:cocoon': { // "It wraps itself in silk: Regenerating."
    move: ['cocoon', 'cast'],
    land: (c) => { if (!c.F.fig.beast?.pose) c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.0, Math.max(0.5, c.F.size.w * 0.55), '#f0ece0', 1.5); c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); }, // (Models' Gloamwing spins its own silk shell)
  },
  'gloamwing:bell-hum': { // "The Dawnbell hums on its thorax: 2d6 radiant to all, and you Stagger."
    move: ['bell-hum', 'roar'], camera: 'wide',
    start: (c) => { c.fx.pulse(mid(c), '#ffe8a0', 1.6, 1.4); for (let k = 0; k < 3; k++) c.fx.later(k * 0.25, () => c.fx.ring(c.F.pos.clone(), '#ffe8a0', 6, 1.1, 0.06)); },
    land: (c) => { for (const h of c.all) c.fx.sparks(chest(h), '#fff0b0', 14, { spread: 0.8 }); c.shake(1); },
  },

  'rotstag:gore': { // "Black antlers, low and fast."
    move: 'strike',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#2a2018', true); c.fx.sparks(chest(h), '#7a1a10', 18); } },
  },
  'rotstag:trample': { // "It goes through the party like a falling tree."
    move: 'strike', camera: 'wide',
    land: (c) => { c.shake(3); for (const h of c.all) { c.fx.smoke(feet(h), '#7a6a50', 5, 0.9, 1.0); c.fx.sparks(chest(h), '#c9a878', 10); } },
  },
  'rotstag:rot-bellow': { // "A bellow that smells of grave-sap. CON save or Poisoned."
    move: 'roar',
    start: (c) => { c.fx.smoke(head(c), '#4a5a28', 10, 1.6, 1.6); },
    land: (c) => { for (const h of c.heroes) c.fx.sparks(chest(h), '#5a7a20', 14, { spread: 0.7, up: -0.3 }); },
  },
  'rotstag:antler-charge': { // "It lowers its head, charging."
    move: 'strike', camera: 'close',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#2a2018', true); c.fx.sparks(chest(h), '#7a1a10', 28, { spread: 1.2 }); c.fx.smoke(feet(h), '#7a6a50', 6, 1, 1); } c.shake(2); },
  },
  'rotstag:rotwood-crown': { // "Black sap weeps from the circlet: 2d6 blight to all, CON save for half, and the Stag drinks it."
    move: 'roar', camera: 'wide',
    start: (c) => { c.fx.sparks(head(c), '#1a1408', 20, { spread: 0.4, up: -0.6 }); c.fx.pulse(head(c), '#3a4a1a', 1.4, 1.2); },
    land: (c) => { for (const h of c.all) { c.fx.sparks(chest(h), '#2a2a10', 16, { spread: 0.7, up: -0.5 }); c.fx.thorn(chest(h), head(c), '#3a4a1a', 0.5, 0.35); } },
  },

  'oldsnag:tusk': { // "A hooking rip of yellow tusk."
    move: 'bite',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h).setY(h.pos.y + 0.8), c.ar.cam, '#e8d890', true); c.fx.sparks(chest(h), '#8a1a10', 16); } },
  },
  'oldsnag:trample': { // "Four hundredweight of boar, going through."
    move: 'strike', camera: 'wide',
    land: (c) => { c.shake(3); for (const h of c.all) { c.fx.smoke(feet(h), '#3a2a18', 6, 1.0, 1.0); c.fx.sparks(feet(h).setY(h.pos.y + 0.3), '#4a3420', 12, { spread: 0.8, up: 0.8 }); } },
  },
  'oldsnag:bristle': { // "Hackles up, head down: it Guards."
    move: 'roar',
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#c8b890', Math.max(1.2, c.F.size.d * 0.8), 0.7, c.F.size.h * 0.6); c.fx.sparks(head(c), '#2a2018', 12, { spread: 0.5, up: 0.8 }); },
  },
  'oldsnag:wallow': { // "It rolls in the black mud and the wounds close: Regenerating."
    move: 'cast',
    land: (c) => { c.fx.splash(c.F.pos.clone(), '#2a2018', 16, 0.6); c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); },
  },
  'oldsnag:splitting-charge': { // "The hatchet in its hide catches the light. It is charging."
    move: 'strike', camera: 'close',
    start: (c) => { c.fx.flare(mid(c), '#fff4d0', 0.8, 0.6); },
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff', true); c.fx.sparks(chest(h), '#8a1a10', 26, { spread: 1.2 }); c.fx.smoke(feet(h), '#3a2a18', 6, 1, 1); } c.shake(2); },
  },

  // ---- Act Two's Champions (hand-made November 21 from M7's words): the Sunscorch, the Ironspire, the Gloomfen ----
  'ashen-warden:ash-blade': { // "Scorchgate's last sword, still hot from the last fire."
    move: ['ash-blade', 'swipe'],
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffb060', true); c.fx.flames(feet(h), 0.3, 0.9, 8, 0.7); c.fx.sparks(chest(h), '#ff8a3a', 14); } },
  },
  'ashen-warden:ember-sweep': { // "One wide, burning cut across the whole line."
    move: ['ember-sweep', 'swipe'], camera: 'wide',
    land: (c) => { c.all.forEach((h, i) => c.fx.later(i * 0.06, () => { c.fx.slash(chest(h), c.ar.cam, '#ff9a40', true); c.fx.flames(feet(h), 0.35, 1.0, 10, 0.8); })); },
  },
  'ashen-warden:ward-of-ash': { // "The Aegis comes up and the ash settles on it... (Warded)."
    move: ['ward-of-ash', 'cast'],
    land: (c) => { c.fx.smoke(mid(c), '#6a6460', 8, 0.8, 1.4); c.fx.ring(c.F.pos.clone(), '#c8b8a8', Math.max(1.2, c.F.size.w), 0.9, c.F.size.h * 0.5); },
  },
  'ashen-warden:call-the-watch': { // "It strikes the floor with the Aegis rim, and a wight climbs out of the ash."
    move: ['call-the-watch', 'strike'], camera: 'close',
    land: (c) => { const at = c.F.pos.clone().addScaledVector(c.ar.dir, -1.3); c.shake(1); c.fx.ring(c.F.pos.clone(), '#ff8a3a', 2.4, 0.7); c.fx.smoke(at, '#5a524c', 10, 0.9, 1.6); c.fx.flames(at, 0.5, 1.6, 14, 1.0); },
  },
  'ashen-warden:command-of-cinders': { // "The Cinder Crown flares and every soldier of Scorchgate answers at the double: every foe is Hasted."
    move: ['command-of-cinders', 'roar'],
    start: (c) => { c.fx.flare(head(c), '#ffb060', 1.4, 0.9); },
    land: (c) => { for (const F of c.ar.foes.values()) if (!F.removed && !F.ko) c.fx.sparks(F.pos.clone().setY(F.pos.y + F.size.h * 0.5), '#ffb060', 12, { spread: 0.6, up: 1.2 }); },
  },
  'ashen-warden:scorch-the-vault': { // "It lifts its sword and the Vault fills with fire, charging: 3d8 ember to every hero."
    move: ['scorch-the-vault', 'cast'], camera: 'wide',
    start: (c) => { c.fx.flare(head(c), '#ffd27a', 1.2, 1.2); c.fx.flames(c.F.pos.clone(), 0.6, 1.8, 14, 1.2); },
    land: (c) => { c.shake(2); for (const h of c.all) c.fx.flames(feet(h), 0.6, 2.0, 18, 1.2); c.fx.flames(c.ar.center.clone().addScaledVector(c.ar.dir, 2.2), 2.2, 1.4, 30, 1.2); },
  },
  'ashen-warden:watch-unbroken': { // "The embers in the Crown drink the fire off you: 1d6 ember to every hero, and the Warden heals."
    move: ['watch-unbroken', 'cast'], camera: 'wide',
    land: (c) => { for (const h of c.all) { c.fx.flames(feet(h), 0.3, 0.8, 6, 0.6); c.fx.thorn(chest(h), head(c), '#ff8a3a', 0.5, 0.25); } c.fx.later(0.5, () => c.fx.pulse(head(c), '#8ad872', 1.3, 0.9)); },
  },

  'kharzul:tail-lash': { // "The tail comes over like a thrown spear."
    move: ['tail-lash', 'swipe'],
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#3a3028', 0.12, 0.5, { bulb: false, gloss: false }); c.fx.later(0.17, () => { c.fx.slash(chest(h), c.ar.cam, '#ffc080', true); c.fx.sparks(chest(h), '#ff8a3a', 14); }); } },
  },
  'kharzul:glass-sting': { // "The stinger punches through plate and snaps off in the wound: 2 stacks of Bleeding."
    move: ['glass-sting', 'bite'],
    land: (c) => { for (const h of c.heroes) { c.fx.thorn(head(c), chest(h), '#c8f0ff', 0.2, 0); c.fx.later(0.2, () => { c.fx.sparks(chest(h), '#e0f8ff', 14, { spread: 0.6 }); c.fx.sparks(chest(h), '#c01a10', 18); }); } },
  },
  'kharzul:glasscutter': { // "Cinderfang comes round in one long arc, charging: a cut at every hero, and every cut Burns."
    move: ['glasscutter', 'swipe'], camera: 'wide',
    land: (c) => { c.all.forEach((h, i) => c.fx.later(i * 0.07, () => { c.fx.slash(chest(h), c.ar.cam, '#fff0c0', true); c.fx.flames(feet(h), 0.3, 1.0, 8, 0.8); })); c.shake(1); },
  },
  'kharzul:burrow': { // "It goes down into the glass floor as if it were water."
    move: ['burrow', 'cast'],
    start: (c) => { c.fx.ring(c.F.pos.clone(), '#c8f0ff', 2.6, 0.8); c.fx.sparks(c.F.pos.clone().setY(c.F.pos.y + 0.2), '#e0f8ff', 30, { spread: 1.3, up: 0.9 }); },
  },
  'kharzul:erupt': { // "The glass floor bursts under you, charging: a spray of glass that Bleeds, and you Stagger."
    move: ['erupt', 'strike'], camera: 'close',
    land: (c) => { c.shake(3); for (const h of c.heroes) { for (let k = 0; k < 10; k++) { const to = chest(h).add(rand(1.2)); to.y += 1.5 + Math.random(); c.fx.thorn(feet(h), to, '#c8f0ff', 0.35, k * 0.02); } c.fx.sparks(chest(h), '#c01a10', 22, { spread: 1 }); c.fx.smoke(feet(h), '#c8c0b0', 6, 0.8, 1.0); } },
  },
  'kharzul:carapace-brace': { // "The Glass Carapace locks plate over plate: Guarding, and Warded."
    move: ['carapace-brace', 'cast'],
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#c8f0ff', Math.max(1.6, c.F.size.d * 0.7), 0.9, c.F.size.h * 0.5); c.fx.sparks(mid(c), '#e8fcff', 20, { spread: 0.9, up: 0.4 }); },
  },
  'kharzul:glass-rain': { // "The ceiling of the Glass Heart comes down in needles."
    move: ['glass-rain', 'roar'], camera: 'wide',
    land: (c) => { for (const h of c.all) for (let k = 0; k < 7; k++) { const to = chest(h).add(rand(0.6)); c.fx.thorn(to.clone().add(rand(1.2)).setY(to.y + 5 + Math.random() * 2), to, '#d8f4ff', 0.4, Math.random() * 0.5); } },
  },
  'kharzul:molten-tail': { // "Cinderfang glows white in the tail: 3d8 ember, and you Burn."
    move: ['molten-tail', 'swipe'],
    start: (c) => { c.fx.pulse(mid(c), '#fff4d0', 1.0, 0.9); },
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#fff4d0', true); c.fx.flames(feet(h), 0.45, 1.6, 16, 1.1); } },
  },

  'mother-anvil:hammerfall': { // "The anvil rears up on its iron legs and comes down on you: 2d10 crushing."
    move: ['hammerfall', 'strike'],
    land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.ring(feet(h), '#c8c0b0', 1.4, 0.5); c.fx.sparks(chest(h), '#ffd27a', 18, { spread: 0.9 }); c.fx.smoke(feet(h), '#7a7068', 5, 0.8, 0.9); } },
  },
  'mother-anvil:sparks': { // "She strikes her own back with the hammer, and the sparks go everywhere."
    move: ['sparks', 'strike'], camera: 'wide',
    start: (c) => { c.fx.sparks(head(c), '#ffd27a', 60, { spread: 2.4, up: 1.4 }); c.shake(1); },
    land: (c) => { for (const h of c.all) { c.fx.sparks(chest(h).setY(h.pos.y + 2), '#ffb060', 14, { spread: 0.6, up: -0.8 }); c.fx.flames(feet(h), 0.25, 0.7, 5, 0.6); } },
  },
  'mother-anvil:temper': { // "The Anvil Heart glows white and the iron of her plates goes blue with temper: Guarding, and Warded."
    move: ['temper', 'cast'],
    land: (c) => { c.fx.pulse(mid(c), '#ffffff', 1.4, 0.8); c.fx.later(0.3, () => c.fx.ring(c.F.pos.clone(), '#7ab8ff', Math.max(1.4, c.F.size.w), 1.0, c.F.size.h * 0.5)); },
  },
  'mother-anvil:steam-burst': { // "She plunges her hammer-arm into the quench-trough and the forge fills with steam."
    move: ['steam-burst', 'cast'], camera: 'wide',
    land: (c) => { c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.4), '#e8ecf0', 14, 2.4, 1.8); for (const h of c.all) c.fx.smoke(feet(h).setY(h.pos.y + 0.5), '#f0f4f8', 6, 1.0, 1.4); },
  },
  'mother-anvil:anvil-strike': { // "The Worldforge Hammer comes down on you as if you were iron on the anvil: 3d8 crushing, and you Stagger."
    move: ['anvil-strike', 'strike'],
    land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.flare(chest(h), '#ffd27a', 0.8, 0.5); c.fx.sparks(chest(h), '#ffb060', 30, { spread: 1.2 }); c.fx.ring(feet(h), '#ff8a3a', 1.6, 0.5); } },
  },
  'mother-anvil:bellows': { // "Harrow's great bellows breathe once, and a forgeborn climbs out of the fire-pit to stand at her side."
    move: ['bellows', 'roar'], camera: 'close',
    start: (c) => { c.fx.smoke(mid(c), '#4a4440', 8, 1.2, 1.2); },
    land: (c) => { const at = c.F.pos.clone().addScaledVector(c.ar.dir, -1.4); c.fx.flames(at, 0.7, 2.2, 22, 1.3); c.fx.sparks(at.clone().setY(at.y + 0.5), '#ffb060', 30, { spread: 1, up: 1.6 }); },
  },
  'mother-anvil:heart-flare': { // "The Anvil Heart flares through her ribs like a furnace door flung open: 3d6 ember to every hero, and you Burn."
    move: ['heart-flare', 'roar'], camera: 'wide',
    start: (c) => { c.fx.flare(mid(c), '#ffb060', 2.4, 1.1); },
    land: (c) => { for (const h of c.all) c.fx.flames(feet(h), 0.45, 1.5, 14, 1.0); },
  },
  'mother-anvil:worldforge-blow': { // "She lifts the Worldforge Hammer as high as the forge roof, charging: 4d10 crushing, for one of you."
    move: ['worldforge-blow', 'strike'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c).setY(c.F.pos.y + c.F.size.h * 1.4), '#fff0b0', 1.2, 1.4); },
    land: (c) => { c.shake(3); for (const h of c.heroes) { c.fx.pillar(feet(h), '#ffb060', 4); c.fx.sparks(chest(h), '#ffd27a', 40, { spread: 1.5 }); c.fx.smoke(feet(h), '#6a6058', 8, 1.2, 1.2); } },
  },

  'rime-abbot:crozier-strike': { // "The Rime Crozier comes down like a bell-clapper: 2d8 frost, and you are Chilled."
    move: ['crozier-strike', 'strike'],
    land: (c) => { for (const h of c.heroes) { c.fx.ring(chest(h), '#c8e8ff', 1.0, 0.5, 0); c.fx.sparks(chest(h), '#e0f4ff', 20, { spread: 0.7 }); c.fx.ring(feet(h), '#a8e0ff', 1, 1.0); } },
  },
  'rime-abbot:toll': { // "He tolls the drowned bell under the ice. Every hero: WIS save or Frightened."
    move: ['toll', 'cast'],
    start: (c) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.32, () => c.fx.ring(c.F.pos.clone(), '#a8d8ff', 6, 1.2, 0.06)); },
    land: (c) => { for (const h of c.all) c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.2); },
  },
  'rime-abbot:rime-ward': { // "He plants the Crozier, and the rime grows over him like a second habit: Warded."
    move: ['rime-ward', 'cast'],
    land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.0, Math.max(0.45, c.F.size.w * 0.55), '#d8f0ff', 1.4); c.fx.sparks(mid(c), '#ffffff', 16, { spread: 0.6, up: 0.4 }); },
  },
  'rime-abbot:drown': { // "He takes one of you by the collar and walks you down under the ice, charging: held under, for two turns."
    move: ['drown', 'bite'], camera: 'close',
    land: (c) => { for (const h of c.heroes) { c.fx.splash(feet(h), '#a8d8f0', 20, 1.2); c.fx.ring(feet(h), '#a8e0ff', 1.3, 1.2); } },
  },
  'rime-abbot:call-the-choir': { // "He lifts the Crozier, and one of his drowned choir rises through the ice, singing."
    move: ['call-the-choir', 'roar'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#a8d8ff', 1.2, 1.2); },
    land: (c) => { const at = c.F.pos.clone().addScaledVector(c.ar.dir, -1.3); c.fx.splash(at, '#a8d8f0', 18, 1.4); c.fx.ring(at, '#a8e0ff', 2, 1.0); for (let k = 0; k < 3; k++) c.fx.later(k * 0.3, () => c.fx.ring(at, '#d8c8ff', 3, 1.0, 0.06)); },
  },
  'rime-abbot:hushing': { // "The Hushweave Cowl breathes out a silence, and one of you hears nothing but Hush."
    move: ['hushing', 'cast'],
    land: (c) => { for (const h of c.heroes) { c.fx.smoke(chest(h), '#d8e0f0', 6, 0.6, 1.4); c.fx.mark(head1(h), '#b878ff', 0.3, 1.4); } },
  },
  'rime-abbot:heartbeat': { // "Under the floor, Hush's heart beats once. The Abbot heals 2d8, and every hero is Chilled."
    move: ['heartbeat', 'cast'],
    land: (c) => { c.shake(1); c.fx.ring(c.ar.center.clone().addScaledVector(c.ar.dir, 2), '#c06080', 8, 1.0); c.fx.pulse(mid(c), '#8ad872', 1.2, 0.9); for (const h of c.all) c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); },
  },
  'rime-abbot:rime-nova': { // "The whole cave of ice answers him at once: 3d8 frost to every hero."
    move: ['rime-nova', 'roar'], camera: 'wide',
    start: (c) => { c.fx.flare(mid(c), '#d8f0ff', 2.2, 1.0); },
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#e0f4ff', 9, 1.0); for (const h of c.all) { for (let k = 0; k < 5; k++) { const to = chest(h).add(rand(0.5)); c.fx.thorn(to.clone().add(rand(1)).setY(to.y + 4), to, '#e8f8ff', 0.35, Math.random() * 0.3); } c.fx.sparks(chest(h), '#ffffff', 18, { spread: 0.8 }); } },
  },

  'lantern-mother:lamp-pole': { // "The long hooked pole she lit Misthollow's lamps with, swung like a scythe."
    move: ['lamp-pole', 'swipe'],
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffe8a0', true); c.fx.sparks(chest(h), '#ffd27a', 12); } },
  },
  'lantern-mother:lure': { // "She lifts the lantern and smiles at one of you, the way she smiled at the children."
    move: ['lure', 'cast'],
    start: (c) => { c.fx.pulse(head(c), '#ffe8a0', 1.0, 1.4); },
    land: (c) => { for (const h of c.heroes) { c.fx.thorn(head(c), chest(h), '#ffe8a0', 0.8, 0); c.fx.mark(head1(h), '#ff9ad0', 0.3, 1.6); } },
  },
  'lantern-mother:lantern-flare': { // "Every lamp in the Hollow flares at once: 3d8 radiant to every hero."
    move: ['lantern-flare', 'roar'], camera: 'wide',
    start: (c) => { c.fx.flare(head(c), '#ffe8a0', 2.6, 1.1); },
    land: (c) => { for (const h of c.all) c.fx.sparks(chest(h), '#fff0b0', 16, { spread: 0.8 }); },
  },
  'lantern-mother:hush-now': { // "\"Hush now,\" she says, \"hush,\" and it is very hard not to. Every hero: WIS save or Hexed."
    move: ['hush-now', 'cast'],
    start: (c) => { for (let k = 0; k < 2; k++) c.fx.later(k * 0.4, () => c.fx.ring(c.F.pos.clone(), '#d8c8ff', 5, 1.4, 0.06)); },
    land: (c) => { for (const h of c.all) c.fx.mark(head1(h), '#b878ff', 0.26, 1.4); },
  },
  'lantern-mother:lead-them-down': { // "She takes one of you by the hand, charging: she means to lead you down under the water."
    move: ['lead-them-down', 'bite'], camera: 'close',
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#e8e0d0', 0.04, 1.0, { bulb: false, gloss: false }); c.fx.later(0.5, () => { c.fx.splash(feet(h), '#3a5a6a', 18, 1.0); c.fx.ring(feet(h), '#ffe8a0', 1.2, 1.0); }); } },
  },
  'lantern-mother:moths': { // "She holds up the lantern, and a lamp-moth comes to it out of the dark."
    move: ['moths', 'roar'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#ffe8a0', 1.4, 1.2); },
    land: (c) => { c.fx.sparks(head(c), '#fff4d0', 40, { spread: 1.6, up: 0.3 }); },
  },
  'lantern-mother:mourning': { // "She lifts the veil, and you see her grief. Every hero is Frightened, and Rotting."
    move: ['mourning', 'cast'],
    land: (c) => { for (const h of c.all) { c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.4); c.fx.sparks(chest(h), '#4a5a20', 14, { spread: 0.6, up: -0.4 }); } },
  },
  'lantern-mother:snuff': { // "She pinches out the lamps one by one, and the dark comes in close. Every hero is Exposed."
    move: ['snuff', 'cast'],
    land: (c) => { c.all.forEach((h, i) => c.fx.later(i * 0.15, () => { c.fx.smoke(head1(h), '#1a1820', 5, 0.5, 1.2); c.fx.mark(head1(h), '#f0e6c8', 0.26, 1.2); })); },
  },
  'lantern-mother:lantern-nova': { // "The lantern burns white, and so does everything it shines on: 3d8 radiant to every hero, and you Burn."
    move: ['lantern-nova', 'roar'], camera: 'wide',
    start: (c) => { c.fx.flare(head(c), '#ffffff', 3, 1.2); },
    land: (c) => { for (const h of c.all) { c.fx.flames(feet(h), 0.4, 1.4, 12, 1.0); c.fx.sparks(chest(h), '#ffffff', 16, { spread: 0.8 }); } },
  },
  'lantern-mother:drown-the-light': { // "She plunges the lantern into the black water, and the water comes up out of it at one of you, charging: 4d10 tide."
    move: ['drown-the-light', 'bite'], camera: 'close',
    start: (c) => { c.fx.splash(c.F.pos.clone(), '#2a3a48', 18, 1); },
    land: (c) => { for (const h of c.heroes) { c.fx.splash(feet(h), '#3a5a6a', 30, 2.2); c.fx.pillar(feet(h), '#4aa0c0', 3.5); } c.shake(2); },
  },

  'blackwater-leviathan:coil': { // "A loop of it comes up out of the water and closes on one of you: 2d10 crushing, and you are Rooted."
    move: ['coil', 'bite'],
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#1a2a28', 0.22, 1.0, { wrap: true, bulb: false }); c.fx.splash(feet(h), '#3a5a5a', 14, 1); } },
  },
  'blackwater-leviathan:tail-slap': { // "Its tail comes down across the flats: 2d6 tide to every hero."
    move: ['tail-slap', 'strike'], camera: 'wide',
    land: (c) => { c.shake(2); for (const h of c.all) c.fx.splash(feet(h), '#4a7a80', 20, 1.6); },
  },
  'blackwater-leviathan:sound': { // "It sounds: it goes down into the deep, and the great chain runs out after it."
    move: ['sound', 'cast'],
    start: (c) => { c.fx.splash(c.F.pos.clone(), '#3a5a6a', 30, 2.0); c.fx.ring(c.F.pos.clone(), '#4aa0c0', 4, 1.2); },
  },
  'blackwater-leviathan:breach': { // "The water heaves under one of you, charging: it comes up out of the deep underneath you, 4d10 tide, and you Stagger."
    move: ['breach', 'strike'], camera: 'close',
    land: (c) => { c.shake(3); for (const h of c.heroes) { c.fx.splash(feet(h), '#6aa0a8', 40, 3); c.fx.pillar(feet(h), '#4aa0c0', 5); } },
  },
  'blackwater-leviathan:swallow': { // "Its jaws open over one of you, charging: it means to swallow you whole."
    move: ['swallow', 'bite'], camera: 'close',
    start: (c) => { c.fx.pulse(head(c), '#1a2a28', 1.8, 1.0); },
    land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.splash(feet(h), '#3a5a5a', 24, 1.6); c.fx.sparks(chest(h), '#1a2a28', 20, { spread: 1 }); } },
  },
  'blackwater-leviathan:undertow': { // "It rolls, and the flats run out from under your feet: whoever fails is Rooted and Chilled."
    move: ['undertow', 'cast'], camera: 'wide',
    land: (c) => { c.fx.ring(c.F.pos.clone(), '#4aa0c0', 8, 1.4); for (const h of c.all) { c.fx.splash(feet(h), '#6aa0a8', 12, 0.8); c.fx.ring(feet(h), '#a8e0ff', 1, 1.0); } },
  },
  'blackwater-leviathan:harpoon-rage': { // "The harpoon in its side twists, and the pain drives it mad: it coils on one of you twice in one breath."
    move: ['harpoon-rage', 'bite'],
    start: (c) => { c.fx.sparks(mid(c), '#c01a10', 18, { spread: 0.6 }); },
    land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#1a2a28', 0.2, 0.7, { wrap: true, bulb: false }); c.fx.later(0.35, () => c.fx.lash(mid(c), chest(h), '#1a2a28', 0.2, 0.7, { wrap: true, bulb: false })); } },
  },
  'blackwater-leviathan:pearl-light': { // "The pearl in its brow lights the water green, and its wounds close: it heals 2d8, and is Warded."
    move: ['pearl-light', 'cast'],
    land: (c) => { c.fx.flare(head(c), '#a8ffc8', 1.4, 1.0); c.fx.ring(c.F.pos.clone(), '#6ad8a0', 4, 1.2); },
  },
  'blackwater-leviathan:flood': { // "The whole channel comes up over the flats: 3d8 tide to every hero."
    move: ['flood', 'roar'], camera: 'wide',
    start: (c) => { c.fx.ring(c.F.pos.clone(), '#4aa0c0', 10, 1.4); },
    land: (c) => { c.shake(2); for (const h of c.all) { c.fx.splash(feet(h), '#6aa0a8', 30, 2.4); c.fx.ring(feet(h), '#4aa0c0', 2, 1.0); } },
  },

  // ---- Act Two's Relic-Bearers: the Sunscorch (hand-made November 23) ----
  ...TALLY('tallyman/foreman'),
  'tallyman/foreman:pick': { // "A miner's pick, swung by someone who has swung ten thousand of them."
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#d8d0c0', true); c.fx.sparks(chest(h), '#ffd27a', 14); } c.shake(1); },
  },
  'tallyman/foreman:dig-faster': { // "Brask cracks the tally-whip: every digger is Hasted."
    land: (c) => { const F2 = [...c.ar.foes.values()].find((G) => G !== c.F && !G.removed && !G.ko); if (F2) c.fx.lash(mid(c), F2.pos.clone().setY(F2.pos.y + F2.size.h * 0.6), '#5a3a20', 0.03, 0.5, { bulb: false, gloss: false }); for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.sparks(G.pos.clone().setY(G.pos.y + G.size.h * 0.5), '#ffe08a', 10, { spread: 0.5, up: 1.2 }); },
  },
  'tallyman/foreman:noon-flare': { // "Brask unshutters the Sunstone Lantern and it is noon underground."
    camera: 'wide',
    start: (c) => { c.fx.flare(mid(c), '#fff4c0', 3.2, 1.3); },
    land: (c) => { for (const h of c.all) { c.fx.flames(feet(h), 0.3, 0.8, 6, 0.6); c.fx.mark(head1(h), '#fff4c0', 0.26, 1.2); } },
  },

  'smuggler/sharpshooter:cut': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h).setY(h.pos.y + 0.8), c.ar.cam, '#e0e8f0'); c.fx.sparks(chest(h), '#c8d0d8', 8); } } }, // "A smuggler's knife, quick and low."
  'smuggler/sharpshooter:caltrops': { land: (c) => { for (const h of c.all) c.fx.scatter(feet(h), '#5a5a62', 10, 0.9, 2.0); } }, // "Iron burrs across the path."
  'smuggler/sharpshooter:bolt': { land: (c) => { c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#c8b898', 9, 1.0, 1.4); } }, // "Gone into the reeds."
  'smuggler/sharpshooter:pin-down': { // "An arrow through your bootlace and into the sand: Rooted."
    land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), feet(h).setY(h.pos.y + 0.1), 'arrow', '#f4e2b8', 0.24); c.fx.later(0.24, () => { c.fx.smoke(feet(h), '#c8b898', 4, 0.5, 0.8); c.fx.ring(feet(h), '#e8d8b0', 0.8, 0.8); }); } },
  },
  'smuggler/sharpshooter:singing-shot': { // "Saltglass sings as Vell draws it to the ear, charging: 3d8 storm, and you Stagger."
    camera: 'close',
    start: (c) => { c.fx.pulse(mid(c), '#e8f4ff', 0.9, 1.4); for (let k = 0; k < 3; k++) c.fx.later(k * 0.3, () => c.fx.ring(c.F.pos.clone(), '#e8f4ff', 2, 0.9, c.F.size.h * 0.6)); },
    land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), chest(h), 'orb', '#e8f4ff', 0.2); c.fx.later(0.2, () => { c.fx.pillar(feet(h), '#d8e8ff', 3.5); c.fx.sparks(chest(h), '#ffffff', 24, { spread: 1 }); }); } c.shake(2); },
  },

  'ash-wight/captain:ash-blade': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffb060', true); c.fx.flames(feet(h), 0.3, 0.8, 7, 0.6); } } }, // "A blade still hot from the fire..."
  'ash-wight/captain:cinder-grasp': { // "A burnt hand closes on yours and drinks the warmth out of it. It heals."
    land: (c) => { for (const h of c.heroes) { c.fx.smoke(chest(h), '#4a4440', 5, 0.5, 1.0); c.fx.thorn(chest(h), mid(c), '#ff8a3a', 0.5, 0.2); } c.fx.later(0.6, () => c.fx.pulse(mid(c), '#8ad872', 1.0, 0.8)); },
  },
  'ash-wight/captain:ember-breath': { // "It breathes on you, and three hundred years of ember breathe with it."
    land: (c) => { for (const h of c.heroes) { for (let k = 0; k < 8; k++) c.fx.thorn(head(c), chest(h).add(rand(0.5)), '#ff8a3a', 0.35, k * 0.04); c.fx.later(0.3, () => c.fx.flames(feet(h), 0.45, 1.4, 14, 1.0)); } },
  },
  'ash-wight/captain:fall-in': { // "Three hundred years dead and still barking orders: every wight is Warded."
    land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.ring(G.pos.clone(), '#c8b8a8', Math.max(1, G.size.w), 0.9, G.size.h * 0.5); },
  },
  'ash-wight/captain:keyless-turn': { // "He turns the ring that has no key on it, and every lock in Scorchgate answers: 2d6 ember to every hero."
    camera: 'wide',
    start: (c) => { c.fx.pulse(mid(c), '#ffb060', 1.0, 1.0); for (let k = 0; k < 3; k++) c.fx.later(k * 0.25, () => c.fx.ring(c.F.pos.clone(), '#ffb060', 5, 1.0, 0.06)); },
    land: (c) => { for (const h of c.all) c.fx.flames(feet(h), 0.4, 1.3, 12, 1.0); c.shake(1); },
  },

  ...RAIDER('dune-raider/raider-king'), ...RAIDER('dune-raider/rider'),
  'dune-raider/raider-king:kings-blow': { // "Whatever is in his hands, he swings it like a door."
    land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff', true); c.fx.sparks(chest(h), '#ffd27a', 26, { spread: 1.2 }); } },
  },
  'dune-raider/raider-king:dunefall': { // "Gnash hefts Dunebreaker over his head, charging: the whole dune comes down on every hero, and you Stagger."
    camera: 'wide',
    start: (c) => { c.fx.pulse(head(c).setY(c.F.pos.y + c.F.size.h * 1.3), '#ffe0a0', 1.0, 1.2); },
    land: (c) => { c.shake(3); for (const h of c.all) { c.fx.smoke(feet(h).setY(h.pos.y + 0.6), '#d8b880', 10, 1.2, 1.6); c.fx.sparks(chest(h).setY(h.pos.y + 2.5), '#c8a070', 20, { spread: 1, up: -1 }); } },
  },
  'dune-raider/rider:dune-step': { // "Sandwalkers skim the dune and she is behind you before you turn: 2d8 slashing, you Stagger, and Rasa is Hasted."
    land: (c) => { c.fx.smoke(c.F.home.clone().setY(c.F.home.y + 0.3), '#d8b880', 6, 0.8, 1.0); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffe0a0', true); c.fx.smoke(feet(h), '#d8b880', 6, 0.8, 1.0); } },
  },

  'glass-scorpion/matriarch:pincer': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#c8f0ff', true); c.fx.sparks(chest(h), '#e0f8ff', 14); } } }, // "A glass claw closes on you like a vice."
  'glass-scorpion/matriarch:glass-sting': { land: (c) => { for (const h of c.heroes) { c.fx.thorn(head(c), chest(h), '#c8f0ff', 0.2, 0); c.fx.later(0.2, () => c.fx.sparks(chest(h), '#c01a10', 18)); } } }, // "...snaps off in the wound: Bleeding."
  'glass-scorpion/matriarch:carapace': { land: (c) => c.fx.ring(c.F.pos.clone(), '#c8f0ff', Math.max(1.4, c.F.size.d * 0.7), 0.9, c.F.size.h * 0.5) }, // "It hunkers down under its glassy shell: Guarding."
  'glass-scorpion/matriarch:moult': { land: (c) => { c.fx.sparks(mid(c), '#e8fcff', 30, { spread: 1, up: 0.6 }); c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); } }, // "She splits her cracked shell and steps out of it: Regenerating."
  'glass-scorpion/matriarch:shell-rain': { // "She shakes the aqueduct, and a season of shed shells comes down on everyone: Bleeding."
    camera: 'wide',
    land: (c) => { c.shake(2); for (const h of c.all) for (let k = 0; k < 6; k++) { const to = chest(h).add(rand(0.6)); c.fx.thorn(to.clone().add(rand(1)).setY(to.y + 5), to, '#d8f4ff', 0.45, Math.random() * 0.5); } },
  },

  'mirage-wisp/queen:cold-touch': { land: (c) => { for (const h of c.heroes) { c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); c.fx.sparks(chest(h), '#e0f4ff', 14, { spread: 0.5 }); } } }, // "A touch like well-water at midnight: Chilled."
  'mirage-wisp/queen:blink': { start: (c) => { c.fx.pulse(mid(c), '#fff4d0', 1.0, 0.5); }, land: (c) => c.fx.sparks(mid(c), '#fff4d0', 20, { spread: 0.6 }) }, // "It blinks out and back a step to the left..."
  'mirage-wisp/queen:beguile': { land: (c) => { for (const h of c.heroes) { c.fx.thorn(mid(c), chest(h), '#9ad8ff', 0.7, 0); c.fx.mark(head1(h), '#ff9ad0', 0.3, 1.4); } } }, // "WIS save or Charmed."
  'mirage-wisp/queen:drink-the-well': { land: (c) => { c.fx.splash(c.F.pos.clone(), '#8ad0e8', 14, 0.8); c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); } }, // "...2d8 healing."
  'mirage-wisp/queen:hall-of-mirrors': { // "The Mirage Glass flashes and there are a hundred queens: 2d8 frost to every hero."
    camera: 'wide',
    start: (c) => { c.fx.flare(mid(c), '#e8f8ff', 2.0, 0.9); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; c.fx.pulse(c.F.pos.clone().add({ x: Math.cos(a) * 2.5, y: c.F.size.h * 0.6, z: Math.sin(a) * 2.5, isVector3: true }), '#c8f0ff', 0.9, 1.2); } },
    land: (c) => { for (const h of c.all) { c.fx.ring(feet(h), '#a8e0ff', 1, 1.0); c.fx.sparks(chest(h), '#ffffff', 12, { spread: 0.7 }); } },
  },

  'sand-wyrm:maw': { // "A mouth like a well, lined with glass teeth."
    move: ['maw', 'bite'],
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e0d0', true); c.fx.sparks(chest(h), '#c01a10', 22, { spread: 0.9 }); } },
  },
  'sand-wyrm:thrash': { // "It thrashes, and the sinkhole walls come down on everyone."
    move: ['thrash', 'swipe'], camera: 'wide',
    land: (c) => { c.shake(3); for (const h of c.all) { c.fx.smoke(feet(h).setY(h.pos.y + 0.5), '#d8b880', 8, 1.1, 1.4); c.fx.sparks(chest(h).setY(h.pos.y + 2.4), '#c8a070', 16, { spread: 1, up: -1 }); } },
  },
  'sand-wyrm:sand-dive': { // "It pours itself back into the sand, and blows glance off: Guarding."
    move: ['dive', 'cast'],
    start: (c) => { c.fx.ring(c.F.pos.clone(), '#d8b880', 3, 0.9); c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#d8b880', 12, 1.6, 1.4); },
  },
  'sand-wyrm:swallow': { // "The sand opens underneath you. It is charging to swallow you whole."
    move: ['swallow', 'bite'], camera: 'close',
    start: (c) => { for (const h of c.heroes) { c.fx.ring(feet(h), '#d8b880', 2.2, 1.2); c.fx.smoke(feet(h), '#d8b880', 8, 1.2, 1.4); } },
    land: (c) => { c.shake(3); for (const h of c.heroes) c.fx.smoke(feet(h).setY(h.pos.y + 0.6), '#d8b880', 12, 1.4, 1.6); },
  },
  'sand-wyrm:scale-grind': { // "It grinds the great scale in its hide against the sinkhole wall: ... the sand has you to the knees (Rooted)."
    move: ['scale-grind', 'grind', 'swipe'], camera: 'wide',
    start: (c) => { c.fx.sparks(mid(c), '#ffd27a', 40, { spread: 1.6, up: 0.6 }); },
    land: (c) => { for (const h of c.all) { c.fx.smoke(feet(h), '#d8b880', 6, 0.8, 1.6); c.fx.ring(feet(h), '#c8a070', 1.1, 1.4); } },
  },

  'tamsin:riposte': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff'); c.fx.later(0.12, () => c.fx.slash(chest(h), c.ar.cam, '#ffe8a0', true)); } } }, // "Two cuts, one breath."
  'tamsin:cheap-shot': { land: (c) => { for (const h of c.heroes) { c.fx.sparks(chest(h), '#ffffff', 10, { spread: 0.4 }); c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.2); } } }, // "A pommel where it hurts. Frightened."
  'tamsin:showboat': { land: (c) => { c.fx.sparks(head(c), '#ffe08a', 24, { spread: 0.8, up: 1.4 }); c.fx.ring(c.F.pos.clone(), '#ffe08a', 1.4, 0.7); } }, // "She takes a bow mid-fight: Hasted."
  'tamsin:parry': { land: (c) => c.fx.ring(c.F.pos.clone(), '#e8e8f0', 1.1, 0.8, c.F.size.h * 0.5) }, // "She waits for you to try: Guarding."
  'tamsin:not-like-this': { land: (c) => { c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); c.fx.ring(c.F.pos.clone(), '#a8c8ff', 1.2, 0.9, c.F.size.h * 0.5); } }, // "Not like this. She steadies."

  // ---- Act Two's Relic-Bearers: the Ironspire (hand-made November 23) ----
  'brigand/warden:hack': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e0d0', true); c.fx.sparks(chest(h), '#c8b8a0', 12); } } }, // "An army blade..."
  'brigand/warden:crossbow': { land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), chest(h), 'arrow', '#e8e0d0', 0.22); c.fx.later(0.22, () => c.fx.sparks(chest(h), '#c8b8a0', 14)); } } }, // "A Stormwatch crossbow, stolen along with the deserter."
  'brigand/warden:desert': { land: (c) => { c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#a8a098', 8, 1.0, 1.2); c.fx.sparks(c.F.pos.clone().setY(c.F.pos.y + 0.2), '#8a8078', 14, { spread: 1, up: 0.4 }); } }, // "He does it again, down the scree."
  'brigand/warden:toll-chain': { land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), feet(h).setY(h.pos.y + 0.4), '#6a6a72', 0.04, 0.6, { bulb: false, gloss: true }); c.fx.later(0.22, () => { c.fx.sparks(feet(h).setY(h.pos.y + 0.4), '#ffffff', 14); }); } c.shake(1); } }, // "He cracks the toll-chain across your shins."
  'brigand/warden:gale-step': { // "The Windstep Boots take him up onto the wind and along the whole line: a cut at every hero, and he is Hasted."
    camera: 'wide',
    start: (c) => { for (let k = 0; k < 2; k++) c.fx.later(k * 0.2, () => c.fx.ring(c.F.pos.clone(), '#e8f4ff', 2.5, 0.8, 0.3 + k * 0.5)); },
    land: (c) => { c.all.forEach((h, i) => c.fx.later(i * 0.08, () => { c.fx.slash(chest(h), c.ar.cam, '#e8f4ff', true); c.fx.smoke(feet(h), '#e8f0f8', 4, 0.6, 0.8); })); },
  },

  'forgeborn/journeyman:molten-fist': { move: ['molten-fist', 'strike'], land: (c) => { for (const h of c.heroes) { c.fx.sparks(chest(h), '#ffb060', 22, { spread: 0.9 }); c.fx.flames(feet(h), 0.35, 1.0, 9, 0.8); } c.shake(1); } }, // "A fist of half-cooled slag."
  'forgeborn/journeyman:slag-spit': { move: ['slag-spit', 'bite'], land: (c) => { for (const h of c.heroes) { c.fx.shot(head(c), chest(h), 'orb', '#ff8a2a', 0.3); c.fx.later(0.3, () => c.fx.flames(feet(h), 0.4, 1.2, 12, 0.9)); } } }, // "It spits a gob of molten slag."
  'forgeborn/journeyman:stoke': { move: ['stoke', 'cast'], land: (c) => { c.fx.flare(mid(c), '#fff0c0', 1.4, 0.9); c.fx.flames(c.F.pos.clone(), 0.5, 1.6, 12, 1.0); } }, // "It rakes its own furnace hotter... Hasted."
  'forgeborn/journeyman:smiths-hammer': { move: ['smiths-hammer', 'strike'], land: (c) => { c.shake(1); for (const h of c.heroes) { c.fx.sparks(chest(h), '#ffd27a', 26, { spread: 1 }); c.fx.ring(feet(h), '#ffb060', 1.2, 0.5); } } }, // "A smith's hammer, swung by a smith."
  'forgeborn/journeyman:temper-kin': { move: ['temper-kin', 'cast'], land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) { c.fx.pulse(G.pos.clone().setY(G.pos.y + G.size.h * 0.6), '#ffffff', 0.9, 0.7); c.fx.later(0.25, () => c.fx.ring(G.pos.clone(), '#7ab8ff', Math.max(1, G.size.w), 0.9, G.size.h * 0.5)); } } }, // "...every one of them is Warded."
  'forgeborn/journeyman:rune-fire': { move: ['rune-fire', 'cast'], camera: 'wide', start: (c) => { for (let k = 0; k < 4; k++) c.fx.later(k * 0.12, () => c.fx.pulse(c.F.pos.clone().setY(c.F.pos.y + 0.4 + k * 0.45), '#ff9a40', 0.6, 0.6)); }, land: (c) => { for (const h of c.all) c.fx.flames(feet(h), 0.45, 1.5, 14, 1.0); } }, // "Harrow's runes flare down the Runestaff."
  'forgeborn/journeyman:white-heat': { move: ['white-heat', 'strike'], camera: 'close', start: (c) => { c.fx.flames(mid(c), 0.3, 0.8, 10, 1.4); c.fx.pulse(mid(c), '#ffffff', 0.9, 1.4); }, land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.flare(chest(h), '#fff4d0', 0.9, 0.5); c.fx.flames(feet(h), 0.5, 1.6, 16, 1.0); } } }, // "He thrusts his hammer into the forge-coals until it glows white, charging."

  'iron-sentinel/captain:iron-fist': { move: ['iron-fist', 'strike'], land: (c) => { for (const h of c.heroes) { c.fx.sparks(chest(h), '#ffe0a0', 20, { spread: 0.9 }); c.fx.ring(chest(h), '#c8c8d0', 0.9, 0.4, 0); } c.shake(1); } }, // "A riveted fist, swung like a smith's hammer."
  'iron-sentinel/captain:gate-slam': { move: ['gate-slam', 'strike'], camera: 'close', land: (c) => { c.shake(3); for (const h of c.heroes) { c.fx.ring(feet(h), '#c8c8d0', 1.8, 0.5); c.fx.smoke(feet(h), '#8a8890', 6, 0.9, 1.0); c.fx.sparks(chest(h), '#ffe0a0', 24, { spread: 1.2 }); } } }, // "It sets its feet and shoulders the gate shut on you."
  'iron-sentinel/captain:lock-shields': { move: ['lock-shields', 'cast'], land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.ring(G.pos.clone(), '#c8c8d0', Math.max(1, G.size.w), 0.8, G.size.h * 0.45); c.fx.sparks(mid(c), '#ffffff', 12, { spread: 1.2 }); } }, // "...every one of them Guards."
  'iron-sentinel/captain:ironwall': { move: ['ironwall', 'strike'], land: (c) => { c.shake(2); for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.ring(G.pos.clone(), '#a8c8ff', Math.max(1.2, G.size.w), 1.0, G.size.h * 0.5); c.fx.smoke(c.F.pos.clone(), '#8a8890', 8, 1.2, 1.0); } }, // "...brings Ironwall down like a portcullis... every Sentinel is Warded."
  'iron-sentinel/captain:shield-rush': { move: ['shield-rush', 'strike'], camera: 'close', land: (c) => { c.shake(3); for (const h of c.heroes) { c.fx.sparks(chest(h), '#ffe0a0', 30, { spread: 1.3 }); c.fx.smoke(feet(h), '#8a8890', 6, 0.9, 1.0); } } }, // "Ironwall first and the Captain behind it, charging."

  'peak-troll/old-horn:club': { move: ['club', 'strike'], land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.sparks(chest(h), '#c8a878', 18, { spread: 1 }); c.fx.smoke(feet(h), '#a8a098', 5, 0.8, 0.9); } } }, // "A pine trunk with the branches knocked off."
  'peak-troll/old-horn:pummel': { move: ['pummel', 'strike'], land: (c) => { for (const h of c.heroes) { c.fx.ring(chest(h), '#e8e0d0', 0.8, 0.3, 0); c.fx.later(0.18, () => { c.fx.ring(chest(h), '#e8e0d0', 0.8, 0.3, 0); c.fx.sparks(chest(h), '#fff0c0', 14); }); } c.shake(1); } }, // "Both fists, one after the other."
  'peak-troll/old-horn:hurl-boulder': { move: ['hurl-boulder', 'strike'], camera: 'close', land: (c) => { for (const h of c.heroes) { c.fx.shot(head(c), chest(h), 'orb', '#8a8078', 0.4); c.fx.later(0.4, () => { c.shake(3); c.fx.smoke(feet(h), '#a8a098', 10, 1.2, 1.2); c.fx.sparks(chest(h), '#c8b8a0', 26, { spread: 1.3 }); }); } } }, // "It prises a boulder out of the scree and heaves it overhead."
  'peak-troll/old-horn:regrow': { move: ['regrow', 'cast'], land: (c) => { c.fx.pulse(mid(c), '#8ad872', 1.4, 1.0); c.fx.sparks(mid(c), '#c8ff90', 18, { spread: 0.6, up: 1 }); } }, // "The wound closes while you watch."
  'peak-troll/old-horn:horn-toss': { move: ['horn-toss', 'bite'], land: (c) => { c.shake(1); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e0c0', true); c.fx.sparks(chest(h), '#c01a10', 16); } } }, // "He gets his one horn under you and throws."
  'peak-troll/old-horn:mantle-of-trolls': { move: ['mantle-of-trolls', 'cast'], land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.0, Math.max(0.5, c.F.size.w * 0.6), '#7a6a50', 1.4); c.fx.pulse(mid(c), '#8ad872', 1.4, 1.0); } }, // "The hides of every troll he ever beat knit over his wounds."

  'rime-wraith/abbess:drowned-grasp': { move: ['drowned-grasp', 'bite'], land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#c8d8e8', 0.05, 0.8, { bulb: false, gloss: true }); c.fx.later(0.3, () => c.fx.ring(feet(h), '#a8e0ff', 1, 1.0)); } } }, // "A hand as cold as the lake-bed closes on yours."
  'rime-wraith/abbess:dirge': { move: ['dirge', 'cast'], start: (c) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.3, () => c.fx.ring(c.F.pos.clone(), '#a8d8ff', 5, 1.2, 0.06)); }, land: (c) => { for (const h of c.heroes) c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.2); } }, // "It sings the office for the drowned."
  'rime-wraith/abbess:pull-under': { move: ['pull-under', 'bite'], camera: 'close', land: (c) => { for (const h of c.heroes) { c.fx.splash(feet(h), '#c8e8f8', 18, 1.0); c.fx.ring(feet(h), '#a8e0ff', 1.4, 1.2); c.fx.sparks(chest(h), '#e0f4ff', 16, { spread: 0.6 }); } } }, // "It reaches up out of the ice for your ankles."
  'rime-wraith/abbess:last-rites': { move: ['last-rites', 'cast'], land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.pulse(G.pos.clone().setY(G.pos.y + G.size.h * 0.6), '#a8e0ff', 1.0, 1.1); } }, // "...every drowned monk heals 2d6."
  'rime-wraith/abbess:censer-swing': { move: ['censer-swing', 'swipe'], camera: 'wide', start: (c) => c.fx.smoke(mid(c), '#c8d0d8', 6, 0.8, 1.2), land: (c) => { for (const h of c.all) { c.fx.smoke(chest(h), '#c8d8e0', 5, 0.7, 1.4); c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); } } }, // "The Drowned Censer swings, and the smoke smells of lake-water."

  ...TALLY('tallyman/ice-cutter'),
  'tallyman/ice-cutter:ice-pick': { land: (c) => { for (const h of c.heroes) { c.fx.thorn(mid(c), chest(h), '#c8e8ff', 0.18, 0); c.fx.later(0.18, () => c.fx.sparks(chest(h), '#e0f4ff', 16, { spread: 0.6 })); } } }, // "A Tallyman ice-pick, for cutting blocks and bargains."
  'tallyman/ice-cutter:split-the-ice': { camera: 'wide', land: (c) => { c.shake(2); c.fx.ring(c.ar.center.clone().addScaledVector(c.ar.dir, 1.5), '#e0f4ff', 6, 0.9); for (const h of c.all) { c.fx.splash(feet(h), '#c8e8f8', 12, 0.9); c.fx.ring(feet(h), '#a8e0ff', 1, 1.0); } } }, // "The Cutter's Pick bites into the road-ice and the floe splits under the whole line."

  'thunder-roc:talons': { move: ['talons', 'bite'], land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffe8a0', true); c.fx.later(0.08, () => c.fx.slash(chest(h), c.ar.cam, '#ffffff')); c.fx.sparks(chest(h), '#c01a10', 14); } } }, // "Talons like a harrow's tines."
  'thunder-roc:wing-gale': { move: ['wing-gale', 'roar'], camera: 'wide', land: (c) => { c.shake(2); for (const h of c.all) { c.fx.smoke(feet(h).setY(h.pos.y + 0.6), '#f0f4f8', 10, 1.2, 1.4); c.fx.sparks(chest(h), '#ffffff', 16, { spread: 1.2, up: 0.2 }); } } }, // "It beats its wings and the eyrie's snow comes off the crag in a wall."
  'thunder-roc:carry-off': { move: ['carry-off', 'bite'], camera: 'close', start: (c) => c.fx.flare(head(c), '#fff4d0', 1.6, 0.8), land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.smoke(feet(h), '#f0f4f8', 8, 1.2, 1.0); c.fx.sparks(chest(h), '#e8f0ff', 20, { spread: 1 }); } } }, // "It drops on you out of the sun, charging."
  'thunder-roc:storm-mantle': { move: ['storm-mantle', 'roar'], camera: 'wide', start: (c) => { c.fx.sparks(mid(c), '#d8e8ff', 30, { spread: 1.2, up: 0.6 }); }, land: (c) => { c.shake(2); for (const h of c.all) c.fx.pillar(feet(h), '#d8e8ff', 6); } }, // "...lightning runs down the crag: 2d8 storm to every hero."

  // ---- Act Two's Relic-Bearers: the Gloomfen (hand-made November 23) ----
  'blackwater-gar/old-jaws:bite': { move: ['bite'], land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e8d8', true); c.fx.sparks(chest(h), '#8a1a10', 16); } } }, // "A long jaw like a pike's, lined with needles."
  'blackwater-gar/old-jaws:leap': { move: ['leap', 'strike'], camera: 'close', start: (c) => c.fx.splash(c.F.pos.clone(), '#3a5a5a', 18, 1.2), land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.splash(feet(h), '#4a7a80', 22, 1.6); c.fx.slash(chest(h), c.ar.cam, '#e8e8d8', true); } } }, // "It sinks under the black water, charging, and comes out of the channel at you like a thrown spear."
  'blackwater-gar/old-jaws:dive': { move: ['dive', 'cast'], start: (c) => { c.fx.splash(c.F.pos.clone(), '#3a5a5a', 20, 1); c.fx.ring(c.F.pos.clone(), '#4aa0c0', 2.5, 1.0); } }, // "It slides under the surface... Guarding."
  'blackwater-gar/old-jaws:death-roll': { move: ['death-roll', 'bite'], camera: 'close', land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.splash(feet(h), '#3a4a30', 26, 1.4); c.fx.ring(feet(h), '#5a4a30', 1.3, 1.2); c.fx.sparks(chest(h), '#8a1a10', 22, { spread: 1 }); } } }, // "He takes you in his jaws and rolls... Rooted in the mud of the channel bed."
  'blackwater-gar/old-jaws:the-tooth': { move: ['the-tooth', 'bite'], land: (c) => { for (const h of c.heroes) { c.fx.thorn(mouth(c, h), chest(h), '#f0e8c8', 0.18, 0); c.fx.later(0.18, () => c.fx.sparks(chest(h), '#c01a10', 26, { spread: 0.9 })); } } }, // "The great hooked tooth goes in and stays in."

  'bog-hag/grue:ladle': { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#c8b890'); c.fx.splash(chest(h), '#6a7a30', 8, 0.4); } } }, // "Whatever is in her hand, and it is usually the ladle."
  'bog-hag/grue:hex': { land: (c) => { for (const h of c.heroes) { c.fx.thorn(mid(c), head1(h), '#b878ff', 0.6, 0); c.fx.later(0.5, () => c.fx.mark(head1(h), '#b878ff', 0.3, 1.6)); } } }, // "She spits in her palm and says your name backwards."
  'bog-hag/grue:rot': { land: (c) => { for (const h of c.heroes) { c.fx.shot(mid(c), chest(h), 'orb', '#6a7a20', 0.3); c.fx.later(0.3, () => { c.fx.splash(chest(h), '#5a6a20', 14, 0.6); c.fx.sparks(chest(h), '#3a4a10', 14, { spread: 0.6, up: -0.4 }); }); } } }, // "A handful of pot-scum, flung."
  'bog-hag/grue:stir-the-pot': { land: (c) => { c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.5), '#8a9a60', 8, 0.7, 1.4); let low = null; for (const G of c.ar.foes.values()) if (!G.removed && !G.ko && G !== c.F) low = low || G; c.fx.pulse((low || c.F).pos.clone().setY((low || c.F).pos.y + (low || c.F).size.h * 0.6), '#8ad872', 1.2, 1.0); } }, // "...gives whichever of her kin is worst hurt a ladleful."
  'bog-hag/grue:evil-eye': { camera: 'wide', start: (c) => c.fx.pulse(head(c), '#b878ff', 0.9, 1.4), land: (c) => { c.all.forEach((h, i) => c.fx.later(i * 0.15, () => { c.fx.mark(head1(h), '#b878ff', 0.3, 1.4); c.fx.sparks(chest(h), '#4a5a20', 12, { spread: 0.6, up: -0.4 }); })); } }, // "She looks at each of you in turn through the holed stone on her finger."

  'drowned/cantor:cold-hands': { move: ['cold-hands', 'strike'], land: (c) => { for (const h of c.heroes) { c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); c.fx.sparks(chest(h), '#e0f4ff', 14, { spread: 0.5 }); } } }, // "Hands that have been under the water for a thousand years close on yours."
  'drowned/cantor:drag-down': { move: ['drag-down', 'bite'], land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), feet(h).setY(h.pos.y + 0.2), '#c8d8e0', 0.05, 0.9, { bulb: false }); c.fx.later(0.35, () => { c.fx.splash(feet(h), '#3a5a6a', 14, 0.8); c.fx.ring(feet(h), '#a8e0ff', 1.1, 1.0); }); } } }, // "It takes you by the ankles and pulls you toward the water."
  'drowned/cantor:toll': { move: ['toll', 'cast'], start: (c) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.35, () => c.fx.ring(c.F.pos.clone(), '#8ab0c8', 6, 1.3, 0.06)); }, land: (c) => { for (const h of c.all) c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.2); } }, // "Somewhere under the water a bell tolls for the drowned."
  'drowned/cantor:black-water': { move: ['black-water', 'cast'], land: (c) => { for (const h of c.heroes) { c.fx.splash(chest(h), '#1a2a28', 22, 0.8); c.fx.sparks(chest(h), '#3a4a20', 12, { spread: 0.6, up: -0.4 }); } } }, // "It coughs the channel up all over you."
  'drowned/cantor:the-hymn': { move: ['the-hymn', 'cast'], start: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.ring(G.pos.clone(), '#d8c8ff', 2.5, 1.4, 0.06); }, land: (c) => { for (const h of c.all) c.fx.mark(head1(h), '#b878ff', 0.26, 1.4); } }, // "They sing the hymn that has kept something asleep under Misthollow."
  'drowned/cantor:beat-time': { move: ['beat-time', 'strike'], land: (c) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.2, () => c.fx.ring(c.F.pos.clone(), '#c8c8d8', 1.6, 0.4)); for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.sparks(G.pos.clone().setY(G.pos.y + G.size.h * 0.5), '#e8e8ff', 8, { spread: 0.4, up: 1 }); } }, // "He beats time on the flagstones with his staff... Hasted."
  'drowned/cantor:downbeat': { move: ['downbeat', 'strike'], camera: 'wide', land: (c) => { c.shake(3); c.fx.ring(c.F.pos.clone(), '#8ab0c8', 9, 1.2); for (const h of c.all) { c.fx.splash(feet(h), '#3a5a6a', 16, 1.2); c.fx.mark(head1(h), '#b878ff', 0.26, 1.2); } } }, // "He brings the Cantor's Staff down on the downbeat, and the whole drowned hall rings with it."

  'hodge:toll-is-due': { start: (c) => c.fx.pulse(mid(c), '#ffe8a0', 0.8, 1.0), land: (c) => { let best = null; for (const h of c.all) best = best || h; if (best) { c.fx.mark(head1(best), '#ffd27a', 0.36, 2.0); c.fx.sparks(head1(best), '#ffd27a', 16, { spread: 0.5, up: 0.6 }); } } }, // "...finds the biggest name in it. The toll is due."
  'hodge:old-mans-cane': { land: (c) => { c.shake(1); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#c8b890', true); c.fx.sparks(chest(h), '#ffe0a0', 18, { spread: 0.9 }); } } }, // "...a cudgel with a lead core: 2d10 crushing, and you Stagger."
  'hodge:bridge-troll': { camera: 'close', land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.splash(feet(h), '#2a3a40', 28, 2.0); c.fx.ring(feet(h), '#4a7080', 1.6, 1.0); } } }, // "...he means to shove you off the bridge and into the Blackwater."
  'hodge:clipped-coin': { land: (c) => { const coin = mid(c).setY(c.F.pos.y + c.F.size.h * 1.3); c.fx.sparks(coin, '#ffd27a', 10, { spread: 0.2, up: 1.4 }); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff'); c.fx.later(0.15, () => c.fx.slash(chest(h), c.ar.cam, '#ffe0a0')); } } }, // "Heads, he hits you twice. It is always heads."

  ...TALLY('tallyman/bargemaster'), ...TALLY('tallyman/salvage-master'),
  'tallyman/bargemaster:boat-hook': { land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#6a5a40', 0.04, 0.55, { bulb: false, gloss: false }); c.fx.later(0.2, () => c.fx.sparks(chest(h), '#c01a10', 12)); } } }, // "A barge-pole with an iron hook on the end."
  'tallyman/bargemaster:make-fast': { land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.ring(G.pos.clone(), '#c8c8d0', Math.max(1, G.size.w), 0.8, G.size.h * 0.45); } }, // "...his bargehands close up behind the chain-post: every one of them Guards."
  'tallyman/bargemaster:haul-away': { camera: 'close', land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.lash(mid(c), chest(h), '#5a5a62', 0.08, 0.8, { bulb: false, gloss: true }); c.fx.later(0.3, () => { c.fx.sparks(chest(h), '#ffe0a0', 26, { spread: 1.2 }); c.fx.splash(feet(h), '#4a6a70', 12, 0.8); }); } } }, // "...the chain comes across the flats at one of you."
  'tallyman/salvage-master:salvage-hook': { land: (c) => { for (const h of c.heroes) { c.fx.lash(head(c), chest(h), '#5a5a62', 0.05, 0.6, { bulb: false, gloss: true }); c.fx.later(0.25, () => c.fx.sparks(chest(h), '#ffe0a0', 14)); } } }, // "A crane-hook on a short chain, swung round his head."
  'tallyman/salvage-master:diving-bell': { camera: 'wide', land: (c) => { c.shake(3); const at = c.ar.center.clone().addScaledVector(c.ar.dir, 1.2); c.fx.splash(at, '#4a7a80', 40, 2.6); c.fx.ring(at, '#4aa0c0', 6, 1.2); for (const h of c.all) c.fx.splash(feet(h), '#6aa0a8', 12, 1.2); } }, // "...the diving bell comes down on the jetty, and the channel comes up."

  'willow-wight/grandfather:lash': { move: ['lash', 'swipe'], land: (c) => { for (const h of c.heroes) { c.fx.lash(mid(c), feet(h).setY(h.pos.y + 0.4), '#5a6a2a', 0.06, 0.9, { wrap: true, bulb: false, gloss: false }); c.fx.later(0.35, () => c.fx.roots(feet(h), '#4a5a20', 4, 1.4)); } } }, // "A switch of willow as thick as your arm, and it wraps round your legs: Rooted."
  'willow-wight/grandfather:bough-fall': { move: ['bough-fall', 'strike'], camera: 'close', land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.sparks(chest(h).setY(h.pos.y + 2.2), '#5a6a2a', 30, { spread: 1, up: -1 }); c.fx.smoke(feet(h), '#6a6a50', 6, 0.9, 1.0); } } }, // "It lifts a whole bough over you, charging."
  'willow-wight/grandfather:weep': { move: ['weep', 'cast'], land: (c) => { c.fx.sparks(head(c), '#8ad872', 30, { spread: 0.8, up: -0.8 }); c.fx.pulse(mid(c), '#8ad872', 1.3, 1.1); } }, // "It weeps, long and green, and the cuts in its bark close."
  'willow-wight/grandfather:weeping-volley': { move: ['weeping-volley', 'cast'], camera: 'wide', land: (c) => { for (const h of c.all) for (let k = 0; k < 4; k++) { const to = chest(h).add(rand(0.5)); c.fx.thorn(head(c), to, '#5a6a2a', 0.5, k * 0.08 + Math.random() * 0.1); } } }, // "He draws the bow strung with his own hair, and it weeps arrows over the whole line."
};
// the Tallymen's chiefs (Hollis Fairweight, Dun the Counter) share their moves; only the chiefs have these moments,
// so the plain tallymen with the same move names keep the kit's
function TALLY(k) {
  return {
    [`${k}:cut`]: { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#e8e8f0'); c.fx.sparks(chest(h), '#d0d0d8', 8); } } }, // "A clerk's neat, nasty cut."
    [`${k}:tally-mark`]: { land: (c) => { for (const h of c.heroes) { c.fx.mark(head1(h), '#f4f0e0', 0.34, 1.8); c.fx.sparks(head1(h), '#ffffff', 8, { spread: 0.3, up: 0.3 }); } } }, // "Chalks your name in the ledger. You are Marked."
    [`${k}:smoke-pot`]: { land: (c) => { for (const h of c.heroes) c.fx.smoke(feet(h).setY(h.pos.y + 0.3), '#7a7860', 8, 1.1, 1.8); } }, // "Stinking smoke. WIS save or Frightened."
    [`${k}:cheats-cut`]: { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#9ad040'); c.fx.sparks(chest(h), '#5a7a20', 16, { spread: 0.6, up: -0.3 }); } } }, // "The Tallyknife collects: 2 stacks of Poisoned."
    [`${k}:seal-flash`]: { camera: 'wide', start: (c) => c.fx.flare(mid(c), '#fff0b0', 1.6, 0.9), land: (c) => { for (const h of c.all) c.fx.sparks(chest(h), '#ffe8a0', 12, { spread: 0.7 }); } }, // "The stolen Seal blazes. 1d6 radiant, DEX save for half."
    [`${k}:signal-flare`]: { camera: 'wide', start: (c) => { c.fx.shot(mid(c), mid(c).setY(c.F.pos.y + 6), 'orb', '#ff9a40', 0.5); c.fx.later(0.5, () => c.fx.flare(c.ar.center.clone().addScaledVector(c.ar.dir, 2).setY(c.ar.center.y + 6), '#ffb060', 3, 1.2)); }, land: (c) => { for (const h of c.all) { c.fx.sparks(chest(h), '#ff8a3a', 14, { spread: 0.8, up: -0.6 }); c.fx.mark(head1(h), '#ffb060', 0.3, 1.4); } } }, // "The Lantern flares: 2d6 ember to all, and everyone is Marked."
    [`${k}:oath-cut`]: { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#c8e8ff', true); c.fx.ring(feet(h), '#a8e0ff', 1, 0.9); c.fx.sparks(chest(h), '#e0f4ff', 18, { spread: 0.6, up: 0.4 }); } } }, // "A borrowed oath, badly kept: 2d8 frost and 2 stacks of Chilled."
  };
}
// the dune-raiders' chiefs (Gnash, Rasa) share their moves; only the chiefs have these moments
function RAIDER(k) {
  return {
    [`${k}:scimitar-cut`]: { land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffe0a0', true); c.fx.sparks(chest(h), '#ffd27a', 12); } } }, // "A curved blade, drawn and swung in the same breath."
    [`${k}:sand-in-the-eyes`]: { land: (c) => { for (const h of c.heroes) { c.fx.thorn(mid(c), head1(h), '#d8b880', 0.3, 0); c.fx.later(0.28, () => { c.fx.smoke(head1(h), '#d8b880', 6, 0.5, 1.0); c.fx.mark(head1(h), '#c8a8ff', 0.26, 1.2); }); } } }, // "A fistful of hot sand flung from the saddle."
    [`${k}:dune-charge`]: { camera: 'close', start: (c) => c.fx.smoke(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#d8b880', 8, 1.0, 1.2), land: (c) => { c.shake(2); for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#ffffff', true); c.fx.smoke(feet(h), '#d8b880', 8, 1.0, 1.2); } } }, // "It wheels back up the dune and comes down at you, charging."
    [`${k}:war-cry`]: { start: (c) => { for (let i = 0; i < 3; i++) c.fx.later(i * 0.22, () => c.fx.ring(c.F.pos.clone(), '#ffe0a0', 5, 1.0, 0.06)); }, land: (c) => { for (const G of c.ar.foes.values()) if (!G.removed && !G.ko) c.fx.sparks(G.pos.clone().setY(G.pos.y + G.size.h * 0.5), '#ffe08a', 10, { spread: 0.5, up: 1.2 }); } }, // "A cry like thunder rolling off the dunes: every raider is Hasted."
  };
}
const mid = (c) => c.F.pos.clone().setY(c.F.pos.y + c.F.size.h * 0.6);
const head1 = (h) => nearer(h, h.pos.clone().setY(h.pos.y + 2.05), 0.3);
// the front of a beast's face, turned towards hero h (a tongue, a breath, a bite)
const mouth = (c, h) => { const d = h.pos.clone().sub(c.F.pos).setY(0).normalize(); return c.F.pos.clone().addScaledVector(d, c.F.size.d * 0.45).setY(c.F.pos.y + c.F.size.h * 0.5); };
function rand(r) { return { x: (Math.random() - 0.5) * 2 * r, y: (Math.random() - 0.5) * r, z: (Math.random() - 0.5) * 2 * r, isVector3: true }; }

// ---- every other Champion's and Relic-Bearer's move: made from M7's words (champion-moves.js, make-moments.mjs), its
// effects played by these recipes. A recipe's colour comes from what the move is (fire, frost, blight...) ----
const TINT = { fire: '#ff8a3a', frost: '#a8e0ff', storm: '#e8f0ff', blight: '#7a9a30', tide: '#4aa0c0', light: '#ffe8a0', hex: '#b878ff' };
const tint = (fx) => TINT[fx.find((f) => TINT[f])] || '#e8d8b0';
export const RECIPES = {
  thorns: { start: (c, col) => { const from = head(c); c.heroes.forEach((h, i) => { for (let k = 0; k < 3; k++) c.fx.thorn(from.clone().add(rand(0.4)), chest(h).add(rand(0.25)), col, 0.34, 0.3 + i * 0.06 + k * 0.08); }); } },
  rain: { start: (c, col) => { for (const h of c.heroes) for (let k = 0; k < 5; k++) { const to = chest(h).add(rand(0.5)); c.fx.thorn(to.clone().add(rand(1.2)).setY(to.y + 4 + Math.random() * 2), to, col, 0.4, 0.25 + Math.random() * 0.6); } } },
  roots: { land: (c) => { for (const h of c.heroes) c.fx.roots(feet(h), '#4a3018', 6, 1.7); } },
  quake: { start: (c) => { c.shake(2); c.fx.ring(c.F.pos.clone(), '#a07a48', 6, 1.0); }, land: (c) => c.shake(2) },
  vines: { land: (c) => c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.05, Math.max(0.5, c.F.size.w * 0.7), '#3f7a2a', 1.3) },
  ward: { land: (c, col) => { c.fx.ring(c.F.pos.clone(), col === '#e8d8b0' ? '#a8c8ff' : col, Math.max(1.4, c.F.size.d), 0.9, c.F.size.h * 0.5); c.fx.pulse(c.F.pos.clone().setY(c.F.pos.y + c.F.size.h * 0.5), '#c8d8ff', c.F.size.h, 0.8); } },
  summon: { start: (c, col) => { c.fx.pulse(head(c), col === '#e8d8b0' ? '#b4d65a' : col, 2, 1); c.fx.ring(c.F.pos.clone(), '#b4d65a', 2.6, 0.9); } },
  heal: { land: (c) => { c.fx.pulse(head(c), '#8ad872', 1.6, 1.1); c.fx.sparks(head(c), '#c8ff90', 20, { spread: 0.7, up: 1.4 }); } },
  fire: { land: (c) => { for (const h of c.heroes) c.fx.sparks(chest(h), '#ff8a3a', 22, { spread: 1, up: 1.3 }); } },
  frost: { land: (c) => { for (const h of c.heroes) { c.fx.ring(feet(h), '#a8e0ff', 1.1, 0.9); c.fx.sparks(chest(h), '#e0f4ff', 16, { spread: 0.6, up: 0.4 }); } } },
  storm: { land: (c) => { for (const h of c.heroes) c.fx.pillar(feet(h), '#d8e8ff', 5); c.shake(1); } },
  blight: { land: (c) => { for (const h of c.heroes) c.fx.sparks(chest(h), '#5a7a20', 18, { spread: 0.8, up: -0.4 }); } },
  tide: { start: (c) => c.fx.ring(c.F.pos.clone(), '#4aa0c0', 5, 1.2), land: (c) => { for (const h of c.heroes) c.fx.sparks(feet(h).setY(h.pos.y + 0.4), '#8ad0e8', 20, { spread: 1, up: 1.2 }); } },
  light: { start: (c) => c.fx.pulse(head(c), '#ffe8a0', 2.2, 0.9), land: (c) => { for (const h of c.heroes) c.fx.sparks(chest(h), '#fff4c0', 16); } },
  hex: { start: (c) => c.fx.pulse(head(c), '#b878ff', 1.4, 0.9), land: (c) => { for (const h of c.heroes) c.fx.ring(feet(h), '#b878ff', 1.0, 1.1, 0.06); } },
  // a call, bell or hymn: three waves rolling out along the floor (on the fight's own clock, so they keep its speed)
  song: { start: (c, col) => { for (let k = 0; k < 3; k++) c.fx.later(k * 0.26, () => c.fx.ring(c.F.pos.clone(), col === '#e8d8b0' ? '#d8c8ff' : col, 5.5, 1.2, 0.06)); } },
  slash: { land: (c, col) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, col === '#e8d8b0' ? '#ffffff' : col, true); c.fx.sparks(chest(h), col, 12); } } },
  maw: { start: (c) => c.fx.pulse(head(c), '#3a2a2a', 1.6, 1.0), land: (c) => { c.shake(2); for (const h of c.heroes) c.fx.sparks(chest(h), '#5a1a10', 24, { spread: 1.1 }); } },
  dig: { start: (c) => { c.fx.ring(c.F.pos.clone(), '#a07a48', 2.5, 0.8); c.fx.sparks(c.F.pos.clone().setY(c.F.pos.y + 0.2), '#c9a878', 24, { spread: 1.2, up: 0.8 }); } },
  dive: { start: (c) => { c.fx.ring(c.F.pos.clone(), '#8ad0e8', 3, 1.0); c.fx.sparks(c.F.pos.clone().setY(c.F.pos.y + 0.3), '#d8f0ff', 26, { spread: 1, up: 1.4 }); } },
};
function fromWords(G) {
  const col = tint(G.fx), parts = G.fx.map((f) => RECIPES[f]).filter(Boolean);
  return { move: G.move, camera: G.camera, made: true,
    start: (c) => { for (const r of parts) r.start?.(c, col); },
    land: (c) => { for (const r of parts) r.land?.(c, col); } };
}
const made = new Map();
// the moment for a foe's move: a hand-made one first, then one made from M7's words (a variant's own, then its family's)
export function momentFor(family, move, variant = null) {
  const keys = [variant && `${family}/${variant}:${move}`, `${family}:${move}`].filter(Boolean);
  for (const k of keys) if (MOMENTS[k]) return MOMENTS[k];
  for (const k of keys) if (GENERATED[k]) { if (!made.has(k)) made.set(k, fromWords(GENERATED[k])); return made.get(k); }
  return null;
}
