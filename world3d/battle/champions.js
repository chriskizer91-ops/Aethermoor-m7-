// The Champions' own moves (step 5, November 21): every named move of a Champion or a Relic-Bearer gets its own moment
// in 3D, built from M7's own words for it (game/src/data/foes.js). Keyed by foe family and move id:
//   move    the body's move: one of the foe kit's common set (bite, strike, swipe, cast, roar), or a foe's own move
//           of that name where its lane made one (F.pose plays it, or its nearest)
//   start   what shows as the move begins (c: { ar, F, fx, heroes: the heroes it is aimed at, all: every hero })
//   land    what shows when it lands (the blow on a hero, or the middle of a move on itself)
//   camera  'close' (in on the foe, as the Legend Strike is on a hero) or 'wide' (back and up, to see the whole field)
// A move missing here plays the kit's pick for M7's words (arena.js kitMove) with no extra effect.
import { GENERATED } from './champion-moves.js';

const head = (c) => c.F.pos.clone().setY(c.F.pos.y + c.F.size.h * 0.85);
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
};
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
  song: { start: (c, col) => { for (let k = 0; k < 3; k++) setTimeout(() => c.fx.ring(c.F.pos.clone(), col === '#e8d8b0' ? '#d8c8ff' : col, 7, 1.2, c.F.size.h * 0.6), k * 260); } },
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
