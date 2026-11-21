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
const chest = (h) => h.pos.clone().setY(h.pos.y + 1.1);
const feet = (h) => h.pos.clone().setY(h.pos.y + 0.02);

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
    move: 'swipe',
    land: (c) => { for (const h of c.heroes) { c.fx.slash(chest(h), c.ar.cam, '#f0ecf8', true); c.fx.smoke(feet(h), '#d8d0c8', 6, 1.0, 0.9); } c.shake(1); },
  },
  'gloamwing:dreamdust': { // "Scales like snow. WIS save or Frightened."
    move: 'cast',
    land: (c) => { for (const h of c.heroes) { c.fx.sparks(head1(h).setY(h.pos.y + 2.4), '#f4f0ff', 30, { spread: 0.9, up: -0.8 }); c.fx.mark(head1(h), '#c8a8ff', 0.28, 1.2); } },
  },
  'gloamwing:cocoon': { // "It wraps itself in silk: Regenerating."
    move: 'cast',
    land: (c) => { c.fx.vines(c.F.pos.clone(), c.F.size.h * 1.0, Math.max(0.5, c.F.size.w * 0.55), '#f0ece0', 1.5); c.fx.pulse(mid(c), '#8ad872', 1.2, 1.0); },
  },
  'gloamwing:bell-hum': { // "The Dawnbell hums on its thorax: 2d6 radiant to all, and you Stagger."
    move: 'roar', camera: 'wide',
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
const mid = (c) => c.F.pos.clone().setY(c.F.pos.y + c.F.size.h * 0.6);
const head1 = (h) => h.pos.clone().setY(h.pos.y + 2.05);
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
