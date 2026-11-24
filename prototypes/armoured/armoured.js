// The armoured walkers and the Unsmith in full detail (session 3, Models; from session 8's list, November 21): the Iron
// Sentinel (a veteran construct), the Sentinel-Captain (with Ironwall, his shield), the Ashen Warden (Champion, undead:
// armour, crowned helm, the Ashen Aegis, a burning blade, a core) and the Unsmith (the last foe: Harrow Ironvein, a
// person, with his apron, his Unmaking Hammer and the Worldforge Heart in his chest).
//
// Built the way the wraiths are (prototypes/wraiths/): the heroes' kit, the sculpted masters (plate, pauldron,
// vambrace, lame, rim, forged, shield, cape, strap, braid...), shaped to Chris's sheets; every piece rigid on one moving
// part, so nothing stretches. The Unsmith is a person, built by the heroes' own builder (his face, beard, hands, apron,
// cloak) with his hammer and heart added.
//
//   buildArmoured(key, { detail }) -> the Fight's look (as wraithLook's: group, plan, height, parts, update, pose,
//     moves.MOVES, duration, hit, act, triangles, draws);  armouredLook(key, sprite, opts) -> that look, or null
//   withArmoured(fallback) -> for setBeastLook, chained like withWraiths
import * as THREE from 'three';
import { V, lerp, smooth, clamp01, loft, ellipse, tube, curve, lathe, plate, blade as bladeGeo, mat, fitMaster, add, bake, sph, tor, cone, ico, Q, rngOf } from '../hero-3d/kit.js';
import { buildHero, setPose } from '../hero-3d/model.js';
import { BEASTS } from '../bestiary/beasts.js';
import { C, cloth, solid, glow, ghost, glowless, robeRings, robe, wsh, hemTrim, ringAt, beads, mist, SHAPES, env, rise, face } from '../wraiths/wraiths.js';

export const ARMOURED = ['iron-sentinel', 'sentinel-captain', 'ashen-warden', 'cinder-thrall', 'thrall-overseer', 'forgeborn', 'bellows', 'journeyman', 'forge-warden', 'unsmith'];
export const ARMOURED_INFO = {
  'iron-sentinel': { name: 'Iron Sentinel', act: 'Act Two, Ironspire (veteran)', blurb: 'A dwarven automaton of riveted iron, a castle for a helm with a burning slit, a gear on its breast, a round shield; still keeping the stair.' },
  'sentinel-captain': { name: 'The Sentinel-Captain', act: 'Act Two, Ironspire (Relic-Bearer)', blurb: 'The Sentinels\' captain: a plumed visored helm with bolted cheeks, a fleur on his breast, and Ironwall, his tall shield, brought down like a portcullis.' },
  'ashen-warden': { name: 'The Ashen Warden', act: 'Act One, Scorchgate (Champion)', blurb: 'The last Warden of Scorchgate: blackened armour edged in gold, the Cinder Crown on its helm, the Ashen Aegis on its arm, a sword still hot from the last fire, a cape of ash.' },
  'cinder-thrall': { name: 'Cinder-Thrall', act: 'The Hearth Below (rabble)', blurb: 'One of the Unsmith\'s ash-men: packed ash in flakes, a rag tied over its eyes that burn through it, a coal for a heart, fire in its cracks.' },
  'thrall-overseer': { name: 'Thrall-Overseer', act: 'The Hearth Below (veteran)', blurb: 'The thralls\' driver: a head taller, stone and slag, a smith\'s iron mask set in its chest, burning spikes, one lit eye on a bent stalk, its hot chain.' },
  forgeborn: { name: 'Forgeborn', act: 'Ironspire (veteran)', blurb: 'One of Harrow\'s molten servants: a man-shape of black slag with the heat showing through the cracks, a furnace grille in its chest.' },
  bellows: { name: 'The Bellows', act: 'Ironspire', blurb: 'A forgeborn made into a bellows: a strapped, swollen body, a furnace grate in its chest, a brass pipe curling up into the chimney that is its head.' },
  journeyman: { name: 'Harrow\'s Journeyman', act: 'Ironspire (Relic-Bearer)', blurb: 'Harrow\'s apprentice: masked, wild-haired, in a fur-collared mantle and a torn cloak, with the Runestaff and its compass-star.' },
  'forge-warden': { name: 'Forge-Warden', act: 'The Hearth Below (veteran)', blurb: 'A kiln of firebrick as tall as a door, an anvil for a head, a chimney that burns, a bellows at its side, a hammer for an arm.' },
  unsmith: { name: 'The Unsmith', act: 'The last foe', blurb: 'Harrow Ironvein, Hilda\'s twin: a smith in a leather apron and a ragged black cloak, the Unmaking Hammer cracked with violet fire, the Worldforge Heart burning in his chest.' },
};
for (const k of ARMOURED) ARMOURED_INFO[k].height = BEASTS[k]?.[2] || 1.9;

/* ------------------------------------------------------------------ parts */
// a rounded block (armour plates, fists, boots): a loft of squarish rings, rounded over at top and bottom
function block(w, h, d, { round = 0.25, p = 4, n = 28, y = 0, taper = 1 } = {}) {
  const sq = (a) => { const c = Math.cos(a), s = Math.sin(a); return [Math.sign(c) * Math.pow(Math.abs(c), 2 / p), Math.sign(s) * Math.pow(Math.abs(s), 2 / p)]; };
  const prof = [[-0.5, 0.0], [-0.5, 0.55], [-0.5 + round * 0.25, 0.9], [-0.5 + round * 0.5, 1], [0.5 - round * 0.5, 1], [0.5 - round * 0.25, 0.9], [0.5, 0.55], [0.5, 0.0]];
  const N = Math.round(n * (Q.d > 1 ? 1.4 : 1)), rings = [];
  for (const [ty, k] of prof) { const tt = ty + 0.5, kk = Math.max(0.02, k) * lerp(1, taper, tt), r = []; for (let j = 0; j < N; j++) { const [x, z] = sq(j / N * Math.PI * 2); r.push(V(x * w / 2 * kk, y + ty * h, z * d / 2 * kk)); } rings.push(r); }
  return loft(rings);
}
// a ring of rivets round a squarish band at height y
function rivetRing(parent, m, y, w, d, n, r = 0.012, p = 4) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); add(sph(r, 8, 6), m, parent, Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * w / 2, y, Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * d / 2); }
}
// a band (belt, bracer, rim) round a squarish body
function band(parent, m, y, w, d, h = 0.05, kind = 'rim') { return add(fitMaster(block(w, h, d, { round: 0.1, p: 4 }), kind), m, parent, 0, y, 0); }
// a pauldron: a big rounded cap over the shoulder with a gold rim and rivets
function pauldron(parent, side, iron, gold, r = 0.17) {
  const g = new THREE.Group(); g.position.set(side * 0.03, -0.04, 0); g.rotation.z = -side * 0.45; parent.add(g);
  add(fitMaster(sph(r, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), 'battered'), iron, g).scale.set(1.15, 0.75, 1.0);
  const rr = r * Math.sin(Math.PI * 0.55) * 1.0;
  add(fitMaster(tube(ringAt(r * Math.cos(Math.PI * 0.55) * 0.9, rr * 1.1, rr, 28), r * 0.08, { closed: true, n: 6 }), 'rim'), gold, g);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(sph(r * 0.06, 8, 6), gold, g, Math.cos(a) * rr * 0.86 * 1.1, r * 0.35, Math.sin(a) * rr * 0.86); }
  return g;
}

/* ------------------------------------------------------------------ the rig: hips, chest, head, arms, legs */
function rigOf(group, { hipY, chestY, headY, shX, shY, hipX, legL }) {
  const root = new THREE.Group(); group.add(root);
  const body = new THREE.Group(); body.position.y = hipY; root.add(body);
  const chest = new THREE.Group(); chest.position.y = chestY - hipY; body.add(chest);
  const head = new THREE.Group(); head.position.y = headY - chestY; chest.add(head);
  const arms = [-1, 1].map(side => { const sh = new THREE.Group(); sh.position.set(side * shX, shY - chestY, 0); chest.add(sh); const el = new THREE.Group(); sh.add(el); const hd = new THREE.Group(); el.add(hd); return { side, sh, el, hand: hd }; });
  const legs = [-1, 1].map(side => { const hip = new THREE.Group(); hip.position.set(side * hipX, 0, 0); body.add(hip); const knee = new THREE.Group(); knee.position.y = -legL * 0.5; hip.add(knee); return { side, hip, knee }; });
  return { root, body, chest, head, arms, armR: arms[0], armL: arms[1], legs, props: {}, glows: [], mists: [], base: {}, hipY };
}

/* ------------------------------------------------------------------ the constructs */
const B = {};
function construct(G, { iron, gold, dark, glowC, emblem, helm, shield, crown, plume, cape, blade }) {
  const R = rigOf(G, { hipY: 0.72, chestY: 1.08, headY: 1.56, shX: 0.36, shY: 1.36, hipX: 0.15, legL: 0.66 }), core = glow(glowC, 2.2);
  // the trunk: a barrel of riveted plate, a gold belt with a boss, the hips' plates
  add(fitMaster(block(0.62, 0.62, 0.44, { round: 0.35, taper: 1.12 }), 'battered'), iron, R.chest, 0, 0.0, 0);
  band(R.chest, gold, 0.24, 0.66, 0.48, 0.05); band(R.body, gold, 0.08, 0.6, 0.44, 0.08);
  rivetRing(R.chest, gold, 0.24, 0.67, 0.49, 22); rivetRing(R.body, gold, 0.08, 0.61, 0.45, 18, 0.014);
  add(sph(0.045, 14, 10), gold, R.body, 0, 0.08, 0.225).scale.set(1, 1, 0.6);
  add(fitMaster(block(0.56, 0.2, 0.42, { round: 0.3 }), 'battered'), iron, R.body, 0, -0.06, 0);
  for (const s of [-1, 1]) { add(fitMaster(block(0.06, 0.4, 0.04, { round: 0.2 }), 'rim'), gold, R.chest, s * 0.1, 0.0, -0.22); }
  if (emblem === 'gear') { add(tor(0.05, 0.016, 8, 16), gold, R.chest, 0, 0.05, 0.225); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.BoxGeometry(0.025, 0.025, 0.02), gold, R.chest, Math.cos(a) * 0.072, 0.05 + Math.sin(a) * 0.072, 0.225).rotation.z = a; } add(sph(0.022, 10, 8), core, R.chest, 0, 0.05, 0.228); }
  if (emblem === 'fleur') { add(cone(0.03, 0.12, 4), gold, R.chest, 0, 0.08, 0.23).rotation.z = 0; for (const s of [-1, 1]) add(tube(curve([V(0, 0.02, 0.23), V(s * 0.05, 0.06, 0.235), V(s * 0.06, 0.12, 0.23)], 8), 0.012, { n: 6 }), gold, R.chest); add(sph(0.02, 10, 8), core, R.chest, 0, 0.0, 0.232); }
  if (emblem === 'warden') { add(fitMaster(plate([[-0.12, -0.15], [0.12, -0.15], [0.12, 0.08], [0, 0.18], [-0.12, 0.08]], () => 0.02), 'forged', { planar: true }), gold, R.chest, 0, 0.02, 0.215); add(new THREE.BoxGeometry(0.06, 0.1, 0.02), core, R.chest, 0, 0.0, 0.24); }
  // the arms: pauldrons, upper arms, bracers, great fists
  for (const a of R.arms) {
    pauldron(a.sh, a.side, iron, gold, 0.15);
    add(fitMaster(block(0.15, 0.26, 0.15, { round: 0.3 }), 'vambrace'), dark, a.sh, 0, -0.16, 0);
    a.el.position.y = -0.3;
    add(fitMaster(block(0.17, 0.24, 0.17, { round: 0.3, taper: 1.1 }), 'battered'), iron, a.el, 0, -0.12, 0);
    band(a.el, gold, -0.03, 0.19, 0.19, 0.035); band(a.el, gold, -0.22, 0.2, 0.2, 0.035);
    a.hand.position.y = -0.26;
    add(fitMaster(block(0.2, 0.2, 0.19, { round: 0.45 }), 'forged'), dark, a.hand, 0, -0.09, 0.0);
    for (let f = 0; f < 4; f++) add(sph(0.032, 10, 8), dark, a.hand, (f - 1.5) * 0.045, -0.19, 0.05);
  }
  // the legs: short, thick, with knee caps and great boots
  for (const l of R.legs) {
    add(fitMaster(block(0.2, 0.32, 0.2, { round: 0.3 }), 'vambrace'), dark, l.hip, 0, -0.17, 0);
    band(l.hip, gold, -0.3, 0.22, 0.22, 0.04);
    add(fitMaster(block(0.22, 0.32, 0.24, { round: 0.35, taper: 1.15 }), 'battered'), iron, l.knee, 0, -0.12, 0);
    add(fitMaster(sph(0.07, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), 'pauldron'), iron, l.knee, 0, 0.0, 0.11).rotation.x = Math.PI / 2;
    add(fitMaster(block(0.26, 0.12, 0.34, { round: 0.4 }), 'forged'), dark, l.knee, 0, -0.33, 0.04);
    band(l.knee, gold, -0.24, 0.25, 0.27, 0.04);
  }
  // the head
  if (helm === 'castle') {
    add(fitMaster(block(0.3, 0.32, 0.3, { round: 0.12, p: 3 }), 'battered'), iron, R.head, 0, 0.0, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.BoxGeometry(0.07, 0.07, 0.04), gold, R.head, Math.cos(a) * 0.15, 0.19, Math.sin(a) * 0.15).rotation.y = -a; }
    band(R.head, gold, 0.15, 0.33, 0.33, 0.04); rivetRing(R.head, gold, -0.12, 0.31, 0.31, 14, 0.01, 3);
    add(new THREE.BoxGeometry(0.2, 0.035, 0.03), core, R.head, 0, 0.03, 0.15); add(new THREE.BoxGeometry(0.22, 0.12, 0.02), glowless('#0a0a0e'), R.head, 0, 0.03, 0.148);
  }
  if (helm === 'visor') {
    add(fitMaster(lathe([[0, 0.2], [0.09, 0.19], [0.15, 0.13], [0.165, 0.0], [0.16, -0.14], [0.13, -0.17]], { n: 30 }), 'helm'), iron, R.head);
    add(fitMaster(lathe([[0.168, 0.09], [0.172, -0.02]], { n: 24, phi0: -1.0, phiLen: 2.0 }), 'rim'), gold, R.head);
    for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.2, 0.012, 0.03), gold, R.head, 0, -0.04 - i * 0.025, 0.16);
    for (const s of [-1, 1]) { add(sph(0.016, 10, 8), core, R.head, s * 0.05, 0.03, 0.163); add(tor(0.035, 0.012, 6, 14), gold, R.head, s * 0.165, 0.0, 0).rotation.y = Math.PI / 2; add(sph(0.02, 8, 6), gold, R.head, s * 0.172, 0.0, 0); }
    add(new THREE.BoxGeometry(0.16, 0.04, 0.02), glowless('#0a0a0e'), R.head, 0, 0.03, 0.158);
  }
  if (helm === 'great') {
    add(fitMaster(block(0.28, 0.36, 0.3, { round: 0.25, p: 3, taper: 0.9 }), 'battered'), iron, R.head, 0, 0.0, 0);
    add(fitMaster(tube([V(0, 0.18, 0.15), V(0, -0.16, 0.16)], [0.008, 0.016], { n: 6 }), 'rim'), gold, R.head);
    add(new THREE.BoxGeometry(0.2, 0.025, 0.02), core, R.head, 0, 0.04, 0.152); add(new THREE.BoxGeometry(0.22, 0.05, 0.015), glowless('#0a0a0e'), R.head, 0, 0.04, 0.148);
  }
  if (crown) { band(R.head, gold, 0.2, 0.31, 0.33, 0.06); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; add(cone(0.026, 0.12 + (i % 2) * 0.05, 4), gold, R.head, Math.sin(a) * 0.15, 0.29 + (i % 2) * 0.025, Math.cos(a) * 0.16); } add(sph(0.025, 10, 8), core, R.head, 0, 0.22, 0.17); }
  if (plume) { const pm = cloth('#e8b020', { key: 'wool' }); for (let i = 0; i < 14; i++) { const ph = i * 0.7, sp = (i / 13 - 0.5) * 0.1, pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V(sp * (1 + t) + Math.sin(ph + t * 3) * 0.02 * t, 0.19 + t * 0.26 - t * t * 0.14, 0.03 - t * 0.26 + Math.cos(ph) * 0.015)); } add(fitMaster(tube(curve(pts, 10), t => [0.016 * (1 - t * 0.5), 0.07 * (1 - t * 0.55)], { n: 6, twist: ph * 0.5 }), 'lock'), pm, R.head); } }
  // the shield on the left arm
  if (shield) {
    const sh = new THREE.Group(); sh.position.set(0.1, -0.14, 0.12); R.armL.el.add(sh); R.props.shield = sh;
    let out;
    if (shield === 'round') { out = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; out.push([Math.cos(a) * 0.24, Math.sin(a) * 0.24]); } }
    if (shield === 'tower') out = [[-0.2, 0.34], [0.2, 0.34], [0.22, 0.3], [0.22, -0.32], [0.16, -0.4], [-0.16, -0.4], [-0.22, -0.32], [-0.22, 0.3]];
    if (shield === 'heater') { out = [[-0.2, 0.28], [0.2, 0.28]]; for (let i = 0; i <= 12; i++) { const t = i / 12; out.push([lerp(0.2, 0, t * t), lerp(0.28, -0.36, Math.sin(t * Math.PI / 2))]); } for (let i = 11; i >= 1; i--) { const t = i / 12; out.push([-lerp(0.2, 0, t * t), lerp(0.28, -0.36, Math.sin(t * Math.PI / 2))]); } }
    const face = plate(out, (x, y) => 0.03 - (x * x + y * y) * 0.12);
    add(fitMaster(face, 'shield'), shield === 'round' ? iron : dark, sh);
    add(fitMaster(tube(face.userData.rim.map(([x, y]) => V(x, y, 0.03 - (x * x + y * y) * 0.12)), 0.016, { closed: true, n: 6 }), 'rim'), gold, sh);
    for (let i = 0; i < face.userData.rim.length; i += 3) { const [x, y] = face.userData.rim[i]; add(sph(0.011, 8, 6), gold, sh, x * 0.9, y * 0.9, 0.04 - (x * x + y * y) * 0.1); }
    if (shield === 'round') { add(fitMaster(lathe([[0, 0.07], [0.04, 0.065], [0.07, 0.04], [0.085, 0.03]], { n: 20 }), 'forged'), gold, sh).rotation.x = Math.PI / 2; }
    if (shield === 'tower') { add(cone(0.08, 0.2, 4), gold, sh, 0, 0, 0.06).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.36, 0.02, 0.02), gold, sh, 0, 0.18, 0.045); add(new THREE.BoxGeometry(0.36, 0.02, 0.02), gold, sh, 0, -0.18, 0.045); }
    if (shield === 'heater') { add(fitMaster(plate([[-0.08, -0.12], [0.08, -0.12], [0.08, 0.06], [0, 0.14], [-0.08, 0.06]], () => 0.01), 'forged', { planar: true }), gold, sh, 0, 0.02, 0.04); add(new THREE.BoxGeometry(0.05, 0.09, 0.02), core, sh, 0, 0.0, 0.06); }
  }
  // the blade in the right hand, its cracks burning
  if (blade) {
    const bl = new THREE.Group(); bl.position.set(0, -0.1, 0.03); R.armR.hand.add(bl); R.props.blade = bl;
    add(fitMaster(tube([V(0, -0.08, 0), V(0, 0.08, 0)], 0.022, { n: 8 }), 'grip'), solid('leather', '#3a2418'), bl);
    add(fitMaster(tube([V(-0.16, 0.09, 0), V(0, 0.1, 0), V(0.16, 0.09, 0)], 0.022, { n: 8 }), 'rim'), gold, bl);
    add(sph(0.035, 10, 8), gold, bl, 0, -0.1, 0);
    const len = 0.95, sword = new THREE.Group(); sword.position.y = 0.11; bl.add(sword);
    add(fitMaster(bladeGeo(len, t => 0.052 * (t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15 * 0.95), t => 0.012 * (1 - t * 0.5), { fuller: 0.3, rings: 22 }), 'blade'), solid('iron', '#3a3430'), sword);
    for (let i = 0; i < 6; i++) { const y0 = 0.08 + i * 0.13; add(tube(curve([V(-0.015, y0, 0.012), V(0.01, y0 + 0.05, 0.013), V(-0.005, y0 + 0.1, 0.012)], 6), 0.004, { n: 4 }), core, sword); add(tube(curve([V(0.015, y0 + 0.03, -0.012), V(-0.01, y0 + 0.07, -0.013), V(0.006, y0 + 0.11, -0.012)], 6), 0.004, { n: 4 }), core, sword); }
  }
  // a cape of ash behind, from the shoulders
  if (cape) { const cm = cloth('#3a332e'); for (const [i, seed] of [[0, 7], [1, 8]]) { const rings = robeRings({ y0: 0.28, y1: -0.92 + i * 0.16, w: t => lerp(0.3, 0.42 + i * 0.02, t), d: 0.55, folds: 0.08, k: 7, tatter: 0.18 + i * 0.06, seed, steps: 12, n: 48 }).map(r => r.slice(Math.floor(r.length / 2) - 1).concat([r[0], r[1]])); add(fitMaster(loft(rings, { closed: false }), 'cape'), cm, R.chest, 0, 0, -0.06); } }
  R.glows.push(core);
  R.base.armR = [-0.05, 0.12, -0.25]; R.base.armL = shield ? [-0.25, 0.1, -1.1] : [-0.05, 0.12, -0.25];
  if (blade) R.base.armR = [-0.35, 0.12, -1.0];
  return R;
}
B['iron-sentinel'] = G => construct(G, { iron: solid('iron', '#56607e'), gold: solid('bronze', '#c8902a'), dark: solid('iron', '#3a3c52'), glowC: '#ffb02a', emblem: 'gear', helm: 'castle', shield: 'round' });
B['sentinel-captain'] = G => construct(G, { iron: solid('iron', '#525e88'), gold: solid('gold', '#d4a030'), dark: solid('iron', '#36385a'), glowC: '#ffc040', emblem: 'fleur', helm: 'visor', shield: 'tower', plume: true });
// the Ashen Warden (second look, November 23): not a construct but a knight, in shaped plate like its sheet: a curved
// cuirass with a keel and gold edging and the gate-and-flame on its breast, faulds and belts, tassets on the thighs,
// pauldrons of three lames, couters and poleyns, greaves and pointed sabatons, a rounded great helm with a burning slit
// under a crown of towers, a long tattered cloak of ash, the Ashen Aegis and the burning sword. Every piece rigid.
const seRing = (y, w, d, z0 = 0, p = 2.6, n = 32) => { const N = Math.round(n * (Q.d > 1 ? 1.5 : 1)), r = []; for (let j = 0; j < N; j++) { const a = j / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); r.push(V(Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * w / 2, y, Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * d / 2 + z0)); } return r; };
const shellOf = (spec, o = {}) => loft(spec.map(([y, w, d, z0, p]) => seRing(y, w, d, z0, p)), o);
const frontZ = (spec, y) => { for (let i = 1; i < spec.length; i++) if (y <= spec[i][0]) { const a = spec[i - 1], b = spec[i], t = (y - a[0]) / (b[0] - a[0]); return lerp(a[2] / 2 + a[3], b[2] / 2 + b[3], t); } return spec.at(-1)[2] / 2; };
function lames(parent, iron, gold, { y0, n, h, w0, w1, d0, d1, z0 = 0, kind = 'lame' }) {   // overlapping bands, each a little wider, gold-edged at its foot
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1), w = lerp(w0, w1, t), d = lerp(d0, d1, t), y = y0 - i * h * 0.8;
    add(fitMaster(shellOf([[y + h * 0.5, w * 0.94, d * 0.94, z0], [y - h * 0.5, w, d, z0]]), kind), iron, parent);
    add(fitMaster(tube(seRing(y - h * 0.5, w * 1.01, d * 1.01, z0, 2.6, 28), 0.008, { closed: true, n: 5 }), 'rim'), gold, parent);
  }
}
function knight(G, { iron, gold, dark, leather, glowC, capeC }) {
  const R = rigOf(G, { hipY: 0.9, chestY: 1.15, headY: 1.62, shX: 0.31, shY: 1.43, hipX: 0.13, legL: 0.84 }), core = glow(glowC, 2.2), slit = glowless('#0a0806');
  // the cuirass
  const cu = [[-0.2, 0.44, 0.29, 0.0], [-0.1, 0.46, 0.31, 0.01], [0.0, 0.52, 0.34, 0.025], [0.1, 0.57, 0.36, 0.03], [0.2, 0.58, 0.35, 0.02], [0.27, 0.48, 0.31, 0.0], [0.31, 0.26, 0.22, 0.0]];
  add(fitMaster(shellOf(cu, { capB: true }), 'battered'), iron, R.chest);
  add(fitMaster(tube([-0.18, -0.05, 0.08, 0.2, 0.27].map(y => V(0, y, frontZ(cu, y) + 0.004)), 0.012, { n: 6 }), 'rim'), gold, R.chest);
  for (const y of [-0.2, 0.27]) add(fitMaster(tube(seRing(y, (y < 0 ? 0.44 : 0.48) * 1.02, (y < 0 ? 0.29 : 0.31) * 1.02, y < 0 ? 0 : 0.0, 2.6, 30), 0.012, { closed: true, n: 5 }), 'rim'), gold, R.chest);
  for (const s of [-1, 1]) {   // gold scrollwork over the breast, rivets down the sides
    add(fitMaster(tube(curve([V(s * 0.04, 0.24, frontZ(cu, 0.24)), V(s * 0.16, 0.2, frontZ(cu, 0.2) - 0.03), V(s * 0.23, 0.1, frontZ(cu, 0.1) - 0.08), V(s * 0.19, 0.02, frontZ(cu, 0.02) - 0.06), V(s * 0.14, 0.06, frontZ(cu, 0.06) - 0.035)], 14), 0.009, { n: 5 }), 'rim'), gold, R.chest);
    for (let i = 0; i < 5; i++) add(sph(0.009, 6, 5), gold, R.chest, s * 0.27, -0.12 + i * 0.07, 0.02);
  }
  const em = new THREE.Group(); em.position.set(0, 0.06, frontZ(cu, 0.06) + 0.004); R.chest.add(em);
  add(fitMaster(plate([[-0.085, -0.1], [0.085, -0.1], [0.085, 0.05], [0.05, 0.09], [0, 0.13], [-0.05, 0.09], [-0.085, 0.05]], () => 0.012), 'forged', { planar: true }), gold, em);
  add(fitMaster(plate([[-0.045, -0.085], [0.045, -0.085], [0.045, 0.02], [0, 0.065], [-0.045, 0.02]], () => 0.016), 'forged', { planar: true }), slit, em);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.022, 0.07, 0.012), gold, em, s * 0.03, -0.045, 0.02);
  add(cone(0.02, 0.07, 6), core, em, 0, -0.02, 0.02);
  // faulds, belts, tassets
  lames(R.body, iron, gold, { y0: 0.0, n: 3, h: 0.07, w0: 0.46, w1: 0.54, d0: 0.31, d1: 0.35, z0: 0.01 });
  add(fitMaster(shellOf([[0.045, 0.475, 0.32, 0.012], [-0.005, 0.475, 0.32, 0.012]]), 'strap'), leather, R.body);
  add(fitMaster(plate([[-0.045, -0.04], [0.045, -0.04], [0.045, 0.04], [-0.045, 0.04]], () => 0.006), 'forged', { planar: true }), gold, R.body, 0, 0.02, 0.175);
  const b2 = add(fitMaster(shellOf([[0.02, 0.55, 0.36, 0.012], [-0.02, 0.55, 0.36, 0.012]]), 'strap'), leather, R.body, 0, -0.12, 0); b2.rotation.z = 0.08;
  add(new THREE.BoxGeometry(0.06, 0.05, 0.012), gold, R.body, 0.02, -0.115, 0.19);
  for (const l of R.legs) {
    for (let i = 0; i < 2; i++) {
      const tp = plate([[-0.1, -0.065], [0.1, -0.065], [0.105, 0.055], [-0.105, 0.055]], (x, y) => 0.025 - x * x * 1.0, { rings: 6, seg: 24 });
      const o = add(fitMaster(tp, 'plate', { planar: true }), iron, l.hip, l.side * 0.015, -0.12 - i * 0.095, 0.13 - i * 0.008); o.rotation.set(-0.12, 0, -l.side * 0.08);
      const rim = add(fitMaster(tube(tp.userData.rim.map(([x, y]) => V(x, y, 0.025 - x * x * 1.0)), 0.006, { closed: true, n: 4 }), 'rim'), gold, l.hip, l.side * 0.015, -0.12 - i * 0.095, 0.13 - i * 0.008); rim.rotation.copy(o.rotation);
    }
    // cuisse, poleyn, greave, sabaton
    add(fitMaster(lathe([[0.095, -0.38], [0.105, -0.28], [0.118, -0.12], [0.115, -0.01]], { n: 22, sz: 1.05 }), 'plate'), iron, l.hip);
    add(fitMaster(tube(ringAt(-0.35, 0.106, 0.112, 22), 0.008, { closed: true, n: 5 }), 'rim'), gold, l.hip);
    l.knee.position.y = -0.42;
    add(fitMaster(sph(0.095, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), 'pauldron'), iron, l.knee, 0, 0.0, 0.045).rotation.x = Math.PI / 2;
    const fan = add(fitMaster(plate([[-0.0, -0.05], [0.06, -0.03], [0.07, 0.03], [0.0, 0.05]], () => 0.005, { rings: 4, seg: 16 }), 'plate', { planar: true }), iron, l.knee, l.side * 0.09, 0, 0.0); fan.rotation.y = l.side * Math.PI / 2; fan.scale.x = l.side;
    add(fitMaster(tube(ringAt(0, 0.097, 0.1, 20).map(p => p.setY(-0.005)), 0.008, { closed: true, n: 4 }), 'rim'), gold, l.knee, 0, 0, 0.045).rotation.x = Math.PI / 2;
    add(fitMaster(lathe([[0.07, -0.4], [0.078, -0.32], [0.1, -0.15], [0.096, -0.05], [0.086, -0.02]], { n: 22, sz: 1.1 }), 'plate'), iron, l.knee);
    add(fitMaster(tube([V(0, -0.05, 0.107), V(0, -0.2, 0.112), V(0, -0.37, 0.082)], 0.007, { n: 5 }), 'rim'), gold, l.knee);
    add(fitMaster(tube(ringAt(-0.37, 0.08, 0.087, 20), 0.008, { closed: true, n: 5 }), 'rim'), gold, l.knee);
    for (let i = 0; i < 4; i++) { const z = 0.0 + i * 0.06, w = 0.15 - i * 0.014, h = 0.08 - i * 0.009; add(fitMaster(block(w, h, 0.11, { round: 0.6, p: 2.4 }), 'lame'), i === 0 ? dark : iron, l.knee, 0, -0.44 - h * 0.1 + i * 0.004, z); add(fitMaster(tube([V(-w * 0.45, -0.44 + h * 0.45, z + 0.04), V(0, -0.44 + h * 0.5, z + 0.046), V(w * 0.45, -0.44 + h * 0.45, z + 0.04)], 0.005, { n: 4 }), 'rim'), gold, l.knee); }
    add(cone(0.045, 0.09, 8), dark, l.knee, 0, -0.465, 0.25).rotation.x = Math.PI / 2;
    add(fitMaster(block(0.16, 0.04, 0.32, { round: 0.5 }), 'forged'), dark, l.knee, 0, -0.485, 0.07);
  }
  // arms: three-lame pauldrons, rerebrace, couter, vambrace, gauntlet
  for (const a of R.arms) {
    const pg = pauldron(a.sh, a.side, iron, gold, 0.22);
    for (let i = 1; i < 3; i++) { const g = new THREE.Group(); g.position.set(a.side * (0.05 + i * 0.015), -0.05 - i * 0.08, 0); g.rotation.z = -a.side * (0.5 + i * 0.1); a.sh.add(g); add(fitMaster(sph(0.205 - i * 0.01, 20, 8, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.2), 'lame'), iron, g).scale.set(1.15, 1, 1); const rr = (0.205 - i * 0.01) * Math.sin(Math.PI * 0.52); add(fitMaster(tube(ringAt((0.205 - i * 0.01) * Math.cos(Math.PI * 0.52), rr * 1.15, rr, 26), 0.008, { closed: true, n: 5 }), 'rim'), gold, g); }
    add(cone(0.03, 0.11, 4), gold, pg, 0, 0.18, 0.0);
    add(fitMaster(lathe([[0.075, -0.27], [0.085, -0.15], [0.09, -0.02]], { n: 20 }), 'vambrace'), iron, a.sh);
    a.el.position.y = -0.3;
    add(fitMaster(sph(0.08, 14, 10), 'pauldron'), iron, a.el, 0, 0, 0);
    const cf = add(fitMaster(plate([[0, -0.05], [0.06, -0.03], [0.065, 0.04], [0, 0.05]], () => 0.004, { rings: 4, seg: 16 }), 'plate', { planar: true }), iron, a.el, a.side * 0.07, 0, -0.01); cf.rotation.y = a.side * Math.PI / 2; cf.scale.x = a.side;
    add(fitMaster(lathe([[0.064, -0.25], [0.074, -0.16], [0.078, -0.04]], { n: 20 }), 'vambrace'), iron, a.el);
    for (const y of [-0.06, -0.23]) add(fitMaster(tube(ringAt(y, 0.078, 0.078, 18), 0.008, { closed: true, n: 5 }), 'rim'), gold, a.el);
    a.hand.position.y = -0.27;
    add(fitMaster(lathe([[0.095, -0.07], [0.086, -0.03], [0.066, 0.02]], { n: 18 }), 'plate'), iron, a.hand);
    add(fitMaster(tube(ringAt(-0.07, 0.096, 0.096, 18), 0.007, { closed: true, n: 4 }), 'rim'), gold, a.hand);
    add(fitMaster(block(0.125, 0.115, 0.095, { round: 0.5 }), 'glove'), dark, a.hand, 0, -0.12, 0.0);
    for (let f = 0; f < 4; f++) add(fitMaster(tube(curve([V((f - 1.5) * 0.03, -0.17, 0.025), V((f - 1.5) * 0.03, -0.215, 0.055), V((f - 1.5) * 0.028, -0.225, 0.09)], 6), 0.016, { n: 6 }), 'lame'), dark, a.hand);
  }
  // the head: gorget, a rounded great helm with a burning slit and a gold ridge, a crown of towers
  add(fitMaster(lathe([[0.2, -0.2], [0.165, -0.15], [0.135, -0.1], [0.13, -0.05]], { n: 24 }), 'lame'), iron, R.head);
  add(fitMaster(lathe([[0.115, -0.15], [0.14, -0.12], [0.152, -0.05], [0.153, 0.06], [0.142, 0.13], [0.1, 0.165], [0, 0.175]], { n: 28, sz: 1.08 }), 'battered'), iron, R.head);
  add(new THREE.BoxGeometry(0.22, 0.03, 0.03), slit, R.head, 0, 0.035, 0.152);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.045, 0.012, 0.01), core, R.head, s * 0.045, 0.035, 0.166);
  add(fitMaster(tube([V(0, 0.17, 0.02), V(0, 0.14, 0.125), V(0, 0.06, 0.166), V(0, -0.06, 0.166), V(0, -0.14, 0.14)], 0.009, { n: 5 }), 'rim'), gold, R.head);
  add(fitMaster(tube([V(-0.15, 0.055, 0.05), V(-0.09, 0.058, 0.148), V(0, 0.06, 0.168), V(0.09, 0.058, 0.148), V(0.15, 0.055, 0.05)], 0.008, { n: 5 }), 'rim'), gold, R.head);
  for (let i = 0; i < 6; i++) add(sph(0.007, 6, 4), slit, R.head, 0.03 + (i % 3) * 0.022, -0.04 - Math.floor(i / 3) * 0.025, 0.16);
  add(fitMaster(tube(ringAt(0.13, 0.146, 0.16, 28), [0.03, 0.008], { closed: true, n: 6, up: V(0, 1, 0) }), 'forged'), gold, R.head);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, tall = 0.08 + 0.06 * Math.max(0, Math.cos(a)) + (i % 2) * 0.02, x = Math.sin(a) * 0.143, z = Math.cos(a) * 0.156;
    const tw = add(fitMaster(block(0.058, tall, 0.03, { round: 0.1, p: 6 }), 'forged'), gold, R.head, x, 0.15 + tall * 0.5, z); tw.rotation.y = a;
    for (const o of [-0.016, 0.016]) { const c = add(new THREE.BoxGeometry(0.014, 0.02, 0.03), gold, R.head, x + Math.cos(a) * o, 0.15 + tall + 0.01, z - Math.sin(a) * o); c.rotation.y = a; }
  }
  add(sph(0.024, 10, 8), core, R.head, 0, 0.165, 0.17);
  // the cloak of ash: long, ragged, from the shoulders
  const cm = cloth(capeC);
  for (const [i, seed] of [[0, 7], [1, 8]]) { const rings = robeRings({ y0: 0.3, y1: -0.98 + i * 0.12, w: t => lerp(0.42, 0.5 + i * 0.03, Math.sqrt(t)), d: 0.6, folds: 0.09, k: 9, tatter: 0.3 + i * 0.08, seed, steps: 14, n: 52 }).map(r => r.slice(Math.floor(r.length / 2) - 3).concat([r[0], r[1], r[2], r[3]])); add(fitMaster(loft(rings, { closed: false }), 'cape'), cm, R.chest, 0, 0, -0.07 - i * 0.012); }
  // the Ashen Aegis: a heater with the gate and the flame
  const sh = new THREE.Group(); sh.position.set(0.1, -0.14, 0.13); R.armL.el.add(sh); R.props.shield = sh;
  const out = [[-0.24, 0.32], [0.24, 0.32]]; for (let i = 0; i <= 12; i++) { const t = i / 12; out.push([lerp(0.24, 0, t * t), lerp(0.32, -0.42, Math.sin(t * Math.PI / 2))]); } for (let i = 11; i >= 1; i--) { const t = i / 12; out.push([-lerp(0.24, 0, t * t), lerp(0.32, -0.42, Math.sin(t * Math.PI / 2))]); }
  const bz = (x, y) => 0.035 - (x * x + y * y) * 0.12, face = plate(out, bz);
  add(fitMaster(face, 'shield'), dark, sh);
  add(fitMaster(tube(face.userData.rim.map(([x, y]) => V(x, y, bz(x, y))), 0.022, { closed: true, n: 6 }), 'rim'), gold, sh);
  add(fitMaster(tube(face.userData.rim.map(([x, y]) => V(x * 0.84, y * 0.84 - 0.01, bz(x, y) + 0.008)), 0.008, { closed: true, n: 5 }), 'rim'), gold, sh);
  for (const s of [-1, 1]) { add(fitMaster(block(0.05, 0.2, 0.02, { round: 0.1, p: 6 }), 'forged'), gold, sh, s * 0.075, -0.06, 0.045); for (const o of [-0.012, 0.012]) add(new THREE.BoxGeometry(0.012, 0.02, 0.02), gold, sh, s * 0.075 + o, 0.05, 0.045); }
  add(fitMaster(lathe([[0.05, 0], [0.05, 0.08], [0.035, 0.12], [0, 0.135]], { n: 14, phiLen: Math.PI, phi0: -Math.PI / 2 }), 'forged'), slit, sh, 0, -0.16, 0.035).rotation.x = -Math.PI / 2;
  add(fitMaster(block(0.13, 0.03, 0.02, { round: 0.2 }), 'forged'), gold, sh, 0, 0.055, 0.045);
  add(cone(0.035, 0.11, 7), core, sh, 0, -0.07, 0.05); add(cone(0.02, 0.07, 6), core, sh, -0.025, -0.09, 0.05); add(cone(0.02, 0.07, 6), core, sh, 0.025, -0.09, 0.05);
  // the burning sword
  const bl = new THREE.Group(); bl.position.set(0, -0.15, 0.06); R.armR.hand.add(bl); R.props.blade = bl;
  add(fitMaster(tube([V(0, -0.1, 0), V(0, 0.08, 0)], 0.02, { n: 8 }), 'grip'), leather, bl);
  add(fitMaster(tube(curve([V(-0.17, 0.12, 0), V(-0.09, 0.09, 0), V(0, 0.095, 0), V(0.09, 0.09, 0), V(0.17, 0.12, 0)], 12), t => 0.02 + 0.012 * Math.abs(t - 0.5), { n: 8 }), 'rim'), gold, bl);
  add(sph(0.038, 12, 10), gold, bl, 0, -0.12, 0);
  const sword = new THREE.Group(); sword.position.y = 0.12; bl.add(sword);
  add(fitMaster(bladeGeo(1.0, t => 0.055 * (t < 0.82 ? 1 - t * 0.15 : (1 - 0.123) * (1 - (t - 0.82) / 0.18 * 0.95)), t => 0.012 * (1 - t * 0.5), { fuller: 0.3, rings: 22 }), 'blade'), solid('iron', '#3a3430'), sword);
  for (let i = 0; i < 7; i++) { const y0 = 0.06 + i * 0.12; for (const s of [-1, 1]) add(tube(curve([V(-0.015 * s, y0 + (s > 0 ? 0 : 0.03), 0.012 * s), V(0.012 * s, y0 + 0.05, 0.013 * s), V(-0.006 * s, y0 + 0.1, 0.012 * s)], 6), 0.0045, { n: 4 }), core, sword); }
  R.glows.push(core);
  R.base.armR = [-0.35, 0.1, -1.0]; R.base.armL = [-0.25, 0.08, -1.1];
  return R;
}
B['ashen-warden'] = G => { const R = knight(G, { iron: solid('bronze', '#5e3e26'), gold: solid('gold', '#c8962e'), dark: solid('iron', '#3a281c'), leather: solid('leather', '#4a2e1c'), glowC: '#ff7a1a', capeC: '#4c4540' });
  const ember = glow('#ff6a1a', 1.2), rnd = rngOf(77);
  for (let i = 0; i < 22; i++) { const y = -0.18 + rnd() * 0.44, a = rnd() * Math.PI * 2, ring = seRing(y, 0.56, 0.35, 0.02, 2.6, 16), p = ring[Math.floor(a / (Math.PI * 2) * ring.length)]; add(sph(0.005 + rnd() * 0.005, 6, 4), ember, R.chest, p.x * 1.01, y, p.z * 1.01); }
  R.glows.push(ember); return R; };

/* ------------------------------------------------------------------ the stone and forge constructs */
function lumpy(geo, amp, seed = 1, freq = 9) {
  geo.computeVertexNormals(); const P = geo.attributes.position, N = geo.attributes.normal, r = rngOf(seed), ph = [0, 0, 0, 0, 0, 0].map(() => r() * 6.28);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const n = Math.sin(x * freq + ph[0]) * Math.sin(y * freq * 1.3 + ph[1]) * Math.sin(z * freq + ph[2]) + 0.5 * Math.sin(x * freq * 2.3 + ph[3]) * Math.sin(y * freq * 2.1 + ph[4]) * Math.sin(z * freq * 2.7 + ph[5]);
    P.setXYZ(i, x + N.getX(i) * n * amp, y + N.getY(i) * n * amp, z + N.getZ(i) * n * amp); }
  P.needsUpdate = true; geo.computeVertexNormals(); return geo;
}
// shingles: small flakes laid over a squarish surface in overlapping rows, each tilted out at its lower edge (packed ash)
function shingles(parent, m, { w, d, y0, y1, rows, per, seed = 1, size = 0.05, p = 3 }) {
  const r = rngOf(seed), flake = plate([[-0.5, 0.5], [0.5, 0.5], [0.42, -0.1], [0.15, -0.5], [-0.2, -0.45], [-0.45, -0.05]], (x, y) => 0.06 - y * 0.08, { rings: 2, seg: 10 }); // a few triangles each: there are hundreds
  for (let i = 0; i < rows; i++) for (let j = 0; j < per; j++) {
    const a = (j + (i % 2) * 0.5 + r() * 0.3) / per * Math.PI * 2, y = lerp(y1, y0, (i + r() * 0.3) / rows), c = Math.cos(a), s2 = Math.sin(a);
    const f = add(fitMaster(flake.clone(), 'ashflake', { planar: true }), m, parent, Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * w / 2 * 1.04, y, Math.sign(s2) * Math.pow(Math.abs(s2), 2 / p) * d / 2 * 1.04);
    f.rotation.set(-0.35 - r() * 0.2, Math.atan2(c, s2), (r() - 0.5) * 0.4); f.scale.setScalar(size * (0.8 + r() * 0.5));
  }
}
// glowing cracks over a body: jagged lines of fire on a squarish surface (w x d, from y0 to y1)
function cracks(parent, m, n, { w, d, y0, y1, p = 3, seed = 1, r = 0.006 }) {
  const rnd = rngOf(seed);
  for (let i = 0; i < n; i++) {
    let a = rnd() * Math.PI * 2, y = lerp(y0, y1, rnd()); const pts = [];
    for (let k = 0; k < 5; k++) { const c = Math.cos(a), s2 = Math.sin(a); pts.push(V(Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * w / 2 * 1.01, y, Math.sign(s2) * Math.pow(Math.abs(s2), 2 / p) * d / 2 * 1.01)); a += (rnd() - 0.5) * 0.35; y += (rnd() - 0.5) * 0.08; }
    add(tube(pts, r, { n: 4 }), m, parent);
  }
}
// a golem's body: trunk, arms and legs of one stuff (stone, slag, ash), on the walkers' rig
function golem(G, { lump = 0.018, stuff, kind, glowC, hipY = 0.82, chestY = 1.14, headY = 1.56, shX = 0.24, shY = 1.36, hipX = 0.12, legL = 0.78, tw = 0.44, th = 0.56, td = 0.3, arm = 0.075, leg = 0.09, fist = 1, crackN = 18 }) {
  const R = rigOf(G, { hipY, chestY, headY, shX, shY, hipX, legL }), fire = glow(glowC, 2.2);
  add(fitMaster(lumpy(block(tw, th, td, { round: 0.4, taper: 1.15 }), lump, 47), kind), stuff, R.chest, 0, 0.0, 0);
  add(fitMaster(lumpy(block(tw * 0.85, 0.24, td * 0.95, { round: 0.4 }), lump, 32), kind), stuff, R.body, 0, 0.0, 0);
  for (const a of R.arms) {
    add(fitMaster(lumpy(block(arm * 2.2, 0.3, arm * 2.1, { round: 0.5, taper: 0.9 }), lump, 68), kind), stuff, a.sh, 0, -0.14, 0);
    a.el.position.y = -0.3; add(fitMaster(lumpy(block(arm * 2, 0.28, arm * 1.9, { round: 0.5, taper: 0.85 }), lump, 73), kind), stuff, a.el, 0, -0.13, 0);
    a.hand.position.y = -0.28; add(fitMaster(lumpy(block(arm * 2.1 * fist, arm * 1.9 * fist, arm * 1.8 * fist, { round: 0.6 }), lump, 38), kind), stuff, a.hand, 0, -0.06, 0);
    for (let f = 0; f < 4; f++) add(sph(arm * 0.42 * fist, 8, 6), stuff, a.hand, (f - 1.5) * arm * 0.5 * fist, -0.06 - arm * 1.1 * fist, arm * 0.4);
  }
  for (const l of R.legs) {
    add(fitMaster(lumpy(block(leg * 2.2, legL * 0.5, leg * 2.2, { round: 0.5 }), lump, 64), kind), stuff, l.hip, 0, -legL * 0.25, 0);
    l.knee.position.y = -legL * 0.5; add(fitMaster(lumpy(block(leg * 2, legL * 0.46, leg * 2, { round: 0.5, taper: 1.1 }), lump, 43), kind), stuff, l.knee, 0, -legL * 0.23, 0);
    add(fitMaster(block(leg * 2.3, 0.1, leg * 3.2, { round: 0.5 }), kind), stuff, l.knee, 0, -legL * 0.48, 0.04);
  }
  if (kind === 'slag') { const rr = rngOf(23); for (const a of R.arms) for (let k = 0; k < 4; k++) add(fitMaster(lumpy(ico(arm * (0.7 + rr() * 0.5), 1), arm * 0.15, k), 'slag'), stuff, k < 2 ? a.sh : a.el, a.side * arm * (0.6 + rr() * 0.4), -0.05 - rr() * 0.2, (rr() - 0.5) * arm * 1.4).scale.set(1, 0.7, 0.9); }
  cracks(R.chest, fire, crackN, { w: tw, d: td, y0: -th * 0.4, y1: th * 0.4, seed: 5 });
  cracks(R.body, fire, Math.round(crackN * 0.3), { w: tw * 0.85, d: td * 0.95, y0: -0.1, y1: 0.1, seed: 6 });
  for (const a of R.arms) cracks(a.el, fire, 3, { w: arm * 2, d: arm * 1.9, y0: -0.25, y1: -0.02, seed: 7 + a.side });
  for (const l of R.legs) cracks(l.knee, fire, 3, { w: leg * 2, d: leg * 2, y0: -legL * 0.42, y1: -legL * 0.05, seed: 9 + l.side });
  R.glows.push(fire); R.fire = fire;
  R.base.armR = [0.0, 0.12, -0.2]; R.base.armL = [0.0, 0.12, -0.2];
  return R;
}
B['cinder-thrall'] = G => {
  const R = golem(G, { stuff: solid('stone', '#4a4440'), kind: 'ashflake', glowC: '#ff7a2a', tw: 0.36, th: 0.5, td: 0.22, shX: 0.21, arm: 0.06, leg: 0.075, crackN: 14, lump: 0.01 });
  const ash = solid('stone', '#6a625a'), hi = Q.d > 1;
  shingles(R.chest, ash, { w: 0.36, d: 0.22, y0: 0.24, y1: -0.24, rows: hi ? 7 : 4, per: hi ? 16 : 10, seed: 3, size: 0.07 });
  shingles(R.body, ash, { w: 0.31, d: 0.21, y0: 0.1, y1: -0.1, rows: hi ? 3 : 2, per: hi ? 14 : 8, seed: 4, size: 0.06 });
  for (const a of R.arms) { shingles(a.sh, ash, { w: 0.13, d: 0.13, y0: -0.02, y1: -0.28, rows: hi ? 4 : 2, per: hi ? 7 : 5, seed: 5 + a.side, size: 0.045 }); shingles(a.el, ash, { w: 0.12, d: 0.12, y0: -0.02, y1: -0.26, rows: hi ? 4 : 2, per: hi ? 7 : 5, seed: 7 + a.side, size: 0.04 }); }
  for (const l of R.legs) { shingles(l.hip, ash, { w: 0.16, d: 0.16, y0: -0.02, y1: -0.38, rows: hi ? 4 : 2, per: hi ? 8 : 5, seed: 9 + l.side, size: 0.05 }); shingles(l.knee, ash, { w: 0.15, d: 0.15, y0: -0.02, y1: -0.34, rows: hi ? 4 : 2, per: hi ? 8 : 5, seed: 11 + l.side, size: 0.05 }); }
  R.head.scale.setScalar(1.25); add(fitMaster(sph(0.11, 18, 14), 'ashflake'), solid('stone', '#46403c'), R.head, 0, 0, 0).scale.set(0.95, 1.1, 1);
  const rag = cloth('#a89a80'); add(fitMaster(lathe([[0.112, -0.03], [0.122, -0.015], [0.124, 0.03], [0.114, 0.05]], { n: 28, sx: 0.96 }), 'strap'), rag, R.head);
  for (const s2 of [-1, 1]) add(fitMaster(tube(curve([V(s2 * 0.02, 0.02, -0.11), V(s2 * 0.08, -0.03, -0.17), V(s2 * 0.1, -0.08, -0.2)], 8), t => [0.004, 0.02 * (1 - t * 0.5)], { n: 6, up: V(0, 0, 1) }), 'strap'), rag, R.head);
  for (const s2 of [-1, 1]) add(sph(0.016, 10, 8), glow('#ffb03a', 2.6), R.head, s2 * 0.038, 0.012, 0.122);
  add(sph(0.04, 12, 10), glow('#ff5a1a', 2.4), R.chest, -0.06, 0.08, 0.105).scale.set(1, 0.9, 0.5);
  return R;
};
B['thrall-overseer'] = G => {
  const R = golem(G, { stuff: solid('stone', '#5a5450'), kind: 'slag', glowC: '#ff8a2a', tw: 0.5, th: 0.56, td: 0.32, shX: 0.27, arm: 0.075, leg: 0.085, crackN: 10 }), iron = solid('iron', '#4a4a4c'), ember = glow('#ff8a2a', 2.2);
  // the smith's iron mask set in its chest, three holes, and the burning spikes
  add(fitMaster(plate([[-0.13, -0.12], [0.13, -0.12], [0.15, 0.06], [0, 0.16], [-0.15, 0.06]], () => 0.03), 'battered', { planar: true }), iron, R.chest, 0, 0.06, 0.155);
  for (const [x, y] of [[-0.06, 0.04], [0.06, 0.04], [0, -0.04]]) add(sph(0.025, 10, 8), glowless('#120e0c'), R.chest, x, 0.06 + y, 0.182).scale.set(1, 1, 0.4);
  const rnd = rngOf(41);
  for (let i = 0; i < 12; i++) { const a = R.arms[i % 2], c = add(cone(0.018, 0.07, 5), ember, i < 6 ? a.sh : a.el, (rnd() - 0.5) * 0.1, -0.05 - rnd() * 0.2, 0.06 + rnd() * 0.04); c.rotation.set(1.2 + rnd() * 0.4, 0, (rnd() - 0.5)); }
  // the head: a stone ball with one lit eye, on a bent stalk from behind the shoulders
  R.head.position.set(0, 0.48, 0.06);
  add(fitMaster(tube(curve([V(0, -0.36, -0.14), V(0, -0.14, -0.2), V(0, 0.0, -0.1), V(0, 0.0, 0)], 12), t => 0.05 * (1 - t * 0.3), { n: 10 }), 'slag'), solid('stone', '#5a5450'), R.head);
  add(fitMaster(sph(0.1, 20, 14), 'slag'), solid('stone', '#5a5450'), R.head);
  add(sph(0.032, 12, 10), glow('#ff9a2a', 2.8), R.head, 0.0, 0.01, 0.088);
  // a loincloth, and glowing cuffs at the ankles
  add(fitMaster(tube([V(0, 0.08, 0.17), V(0, -0.12, 0.19), V(0, -0.3, 0.17)], t => [0.004, lerp(0.12, 0.09, t)], { n: 8, up: V(0, 0, 1) }), 'tabard'), cloth('#8a7a62'), R.body);
  for (const l of R.legs) { band(l.knee, iron, -0.68, 0.2, 0.2, 0.06); add(new THREE.BoxGeometry(0.1, 0.02, 0.01), ember, l.knee, 0, -0.68, 0.1); }
  // the hot chain in its right hand
  const ch = new THREE.Group(); ch.position.set(0, -0.1, 0.03); R.armR.hand.add(ch); R.props.chain = ch;
  for (let i = 0; i < 10; i++) add(tor(0.018, 0.005, 6, 12), ember, ch, 0, -i * 0.03, 0).rotation.y = i % 2 ? Math.PI / 2 : 0;
  return R;
};
B.forgeborn = G => {
  const R = golem(G, { stuff: solid('stone', '#2e2420'), kind: 'slag', glowC: '#ff8a1a', hipY: 0.78, chestY: 1.16, headY: 1.5, shX: 0.36, shY: 1.36, tw: 0.66, th: 0.6, td: 0.44, arm: 0.1, leg: 0.11, fist: 1.2, crackN: 26 }), leather = solid('leather', '#5a3a24'), bronze = solid('bronze', '#a0782a');
  // the furnace grille in its chest
  add(new THREE.BoxGeometry(0.22, 0.16, 0.02), glow('#ffb03a', 2.6), R.chest, 0, 0.02, 0.215);
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.016, 0.17, 0.03), solid('iron', '#2a2422'), R.chest, (i - 2.5) * 0.04, 0.02, 0.225);
  // great rock shoulders with glowing slits
  for (const a of R.arms) { add(fitMaster(sph(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), 'slag'), solid('stone', '#2e2420'), a.sh, a.side * 0.02, -0.05, 0).scale.set(1.1, 0.8, 1.0); for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.1, 0.014, 0.02), R.fire, a.sh, a.side * 0.06, 0.07 - k * 0.035, 0.15); }
  // a head sunk between the shoulders, burning on top
  add(fitMaster(sph(0.11, 18, 14), 'slag'), solid('stone', '#2e2420'), R.head).scale.set(1, 0.9, 1);
  for (const s2 of [-1, 1]) add(sph(0.014, 8, 6), glow('#ffb03a', 2.6), R.head, s2 * 0.04, 0.0, 0.1);
  for (let i = 0; i < 3; i++) add(cone(0.02, 0.07, 6), glow('#ffa02a', 2.4), R.head, (i - 1) * 0.04, 0.11, -0.02);
  // the belt and buckle, a ragged loincloth, boots
  band(R.body, leather, 0.1, 0.62, 0.44, 0.08, 'strap'); add(new THREE.BoxGeometry(0.08, 0.07, 0.02), bronze, R.body, 0, 0.1, 0.225);
  add(fitMaster(tube([V(0, 0.06, 0.2), V(0, -0.14, 0.22), V(0, -0.32, 0.2)], t => [0.004, lerp(0.14, 0.11, t)], { n: 8, up: V(0, 0, 1), shape: (a, t) => 1 + (t > 0.8 ? Math.sin(a * 9) * 0.1 : 0) }), 'tabard'), solid('leather', '#4a3020'), R.body);
  return R;
};
B.bellows = G => {
  const R = golem(G, { stuff: solid('leather', '#2e2624'), kind: 'battered', glowC: '#ffb03a', hipY: 0.8, chestY: 1.12, headY: 1.62, shX: 0.36, tw: 0.7, th: 0.66, td: 0.56, arm: 0.1, leg: 0.12, crackN: 0 }), leather = solid('leather', '#6a4228'), brass = solid('gold', '#c8a040'), fire = glow('#ffb03a', 2.4);
  // the round furnace grate in its chest, its harness of straps and buckles
  add(fitMaster(tube(ringAt(0, 0.1, 0.1, 28).map(p => V(p.x, p.z + 0.04, 0.29)), 0.02, { closed: true, n: 8 }), 'rim'), brass, R.chest);
  add(new THREE.CircleGeometry(0.1, 24), fire, R.chest, 0, 0.04, 0.285);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.018, 0.17, 0.02), solid('iron', '#3a3230'), R.chest, (i - 2) * 0.035, 0.04, 0.295);
  for (const s2 of [-1, 1]) add(fitMaster(tube(curve([V(s2 * 0.26, 0.32, 0.2), V(s2 * 0.1, 0.1, 0.3), V(-s2 * 0.12, -0.18, 0.29), V(-s2 * 0.26, -0.3, 0.2)], 12), [0.008, 0.035], { n: 6, up: V(0, 0, 1) }), 'strap'), leather, R.chest);
  band(R.body, leather, 0.06, 0.66, 0.54, 0.07, 'strap');
  // the harness: straps over each shoulder crossing in a Y down the back, buckles and brass rings where they meet
  for (const s2 of [-1, 1]) { add(fitMaster(tube(curve([V(s2 * 0.16, 0.34, 0.22), V(s2 * 0.2, 0.36, 0.0), V(s2 * 0.14, 0.3, -0.24), V(0, 0.08, -0.29)], 12), [0.008, 0.032], { n: 6, up: V(0, 1, 0) }), 'strap'), leather, R.chest); add(tor(0.028, 0.007, 6, 14), brass, R.chest, s2 * 0.16, 0.3, 0.25); add(new THREE.BoxGeometry(0.05, 0.04, 0.012), brass, R.chest, s2 * 0.22, -0.28, 0.25); }
  add(fitMaster(tube([V(0, 0.08, -0.29), V(0, -0.3, -0.27)], [0.008, 0.04], { n: 6, up: V(0, 0, 1) }), 'strap'), leather, R.chest);
  add(fitMaster(plate([[-0.12, -0.08], [0.12, -0.08], [0.1, 0.06], [-0.1, 0.06]], () => 0.01), 'battered', { planar: true }), brass, R.chest, 0, -0.12, -0.29).rotation.y = Math.PI;
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.012, 0.09, 0.01), fire, R.chest, (i - 1) * 0.04, -0.12, -0.302);
  add(new THREE.BoxGeometry(0.07, 0.06, 0.015), brass, R.body, 0.0, 0.06, 0.28);
  for (const l of R.legs) { band(l.hip, leather, -0.22, 0.27, 0.27, 0.05, 'strap'); add(new THREE.BoxGeometry(0.03, 0.035, 0.01), brass, l.hip, 0.0, -0.22, 0.14); add(new THREE.BoxGeometry(0.07, 0.012, 0.01), fire, l.knee, 0, -0.12, 0.125); }
  for (const a of R.arms) { add(fitMaster(lumpy(sph(0.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), 0.01, 3), 'battered'), leather, a.sh, a.side * 0.02, 0.02, 0).scale.set(1.1, 0.7, 1); add(tor(0.025, 0.006, 6, 12), brass, a.sh, a.side * 0.1, -0.02, 0.1); }
  for (const a of R.arms) { band(a.sh, leather, -0.06, 0.24, 0.24, 0.05, 'strap'); band(a.el, leather, -0.08, 0.22, 0.22, 0.04, 'strap'); for (let k = 0; k < 2; k++) add(new THREE.BoxGeometry(0.06, 0.012, 0.01), fire, a.el, 0, -0.14 - k * 0.04, 0.11); }
  // the brass pipe up its back and over, and the chimney that is its head
  add(fitMaster(tube(curve([V(0, 0.2, -0.26), V(0, 0.42, -0.26), V(0, 0.56, -0.12), V(0, 0.56, 0.0)], 16), 0.035, { n: 10 }), 'rim'), brass, R.chest);
  R.head.position.y = 0.56; R.head.position.z = 0.0;
  add(fitMaster(lathe([[0.05, -0.14], [0.06, -0.02], [0.075, 0.0], [0.07, 0.08], [0.05, 0.12], [0.02, 0.15], [0, 0.16]], { n: 18 }), 'forged'), solid('bronze', '#8a5a2a'), R.head, 0, 0.12, 0);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), glow('#ff9a2a', 2.6), R.head, 0, 0.15, 0);
  return R;
};
B['forge-warden'] = G => {
  const R = rigOf(G, { hipY: 0.5, chestY: 1.05, headY: 1.78, shX: 0.42, shY: 1.3, hipX: 0.16, legL: 0.48 }), brick = solid('stone', '#9a4a30'), iron = solid('iron', '#2e2c34'), fire = glow('#ffa02a', 2.4);
  // the kiln: a block of firebrick, a fire-door with its grate
  add(fitMaster(block(0.8, 0.9, 0.62, { round: 0.08, p: 10 }), 'brick'), brick, R.chest, 0, 0.0, 0);
  add(fitMaster(block(0.82, 0.06, 0.64, { round: 0.2, p: 10 }), 'battered'), iron, R.chest, 0, 0.46, 0);
  add(new THREE.BoxGeometry(0.22, 0.18, 0.02), fire, R.chest, 0, -0.08, 0.31);
  add(fitMaster(block(0.26, 0.22, 0.03, { round: 0.2, p: 10 }), 'battered'), iron, R.chest, 0, -0.08, 0.31).scale.set(1, 1, 0.6);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.016, 0.18, 0.03), iron, R.chest, (i - 2) * 0.045, -0.08, 0.33);
  // the anvil for a head, and the chimney that burns
  add(fitMaster(block(0.36, 0.14, 0.2, { round: 0.2, p: 8 }), 'battered'), iron, R.head, 0, 0.05, 0);
  add(fitMaster(block(0.22, 0.1, 0.14, { round: 0.2, p: 8, taper: 0.7 }), 'battered'), iron, R.head, 0, -0.06, 0);
  add(fitMaster(cone(0.07, 0.24, 10), 'battered'), iron, R.head, 0.29, 0.06, 0).rotation.z = -Math.PI / 2;
  add(new THREE.BoxGeometry(0.14, 0.012, 0.21), fire, R.head, -0.04, 0.05, 0.0);
  const chim = new THREE.Group(); chim.position.set(-0.24, 0.5, -0.12); R.chest.add(chim);
  add(fitMaster(tube([V(0, 0, 0), V(0, 0.32, 0)], 0.05, { n: 12 }), 'battered'), iron, chim); add(tor(0.055, 0.012, 6, 14), iron, chim, 0, 0.31, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) add(cone(0.035 - i * 0.006, 0.12 + i * 0.03, 7), glow(i % 2 ? '#ffd060' : '#ff8a2a', 2.6), chim, (i - 1.5) * 0.012, 0.38 + i * 0.03, 0);
  R.mists.push(mist(chim, { color: '#8a8078', r: 0.04, y: 0.42, rise: 0.6, size: 0.14, opacity: 0.4, n: 18 }));
  // the bellows at its left side: two boards and the leather folds between
  const bel = new THREE.Group(); bel.position.set(0.44, 0.15, -0.02); bel.rotation.z = -0.4; R.chest.add(bel); R.props.bellows = bel;
  for (const z of [-0.14, 0.14]) add(fitMaster(plate([[-0.06, -0.2], [0.06, -0.2], [0.14, 0.2], [-0.14, 0.2]], () => 0.01), 'haft', { planar: true }), solid('wood', '#8a5a30'), bel, 0, 0, z).rotation.y = Math.PI / 2;
  for (let k = 0; k < 5; k++) add(fitMaster(block(0.03, 0.36 - k * 0.02, 0.26, { round: 0.3, p: 4 }), 'strap'), solid('leather', '#4a3020'), bel, 0.0, 0.0, -0.1 + k * 0.05).rotation.y = Math.PI / 2;
  // the arms: iron pipes with joints; a hammer for the right hand, a fist for the left
  for (const a of R.arms) {
    a.sh.position.y = 0.12; add(sph(0.09, 14, 10), iron, a.sh);
    add(fitMaster(tube([V(0, 0, 0), V(0, -0.3, 0)], 0.055, { n: 12 }), 'battered'), iron, a.sh); a.el.position.y = -0.32; add(sph(0.075, 12, 10), iron, a.el);
    add(fitMaster(tube([V(0, 0, 0), V(0, -0.28, 0)], 0.05, { n: 12 }), 'battered'), iron, a.el); a.hand.position.y = -0.3;
    band(a.el, solid('bronze', '#a0782a'), -0.05, 0.12, 0.12, 0.03);
    if (a.side === -1) { add(fitMaster(block(0.12, 0.16, 0.12, { round: 0.3 }), 'battered'), iron, a.hand, 0, -0.06, 0); add(fitMaster(block(0.24, 0.14, 0.14, { round: 0.2, p: 8 }), 'battered'), iron, a.hand, 0, -0.2, 0); add(new THREE.BoxGeometry(0.025, 0.1, 0.1), fire, a.hand, 0.12, -0.2, 0); }
    else { add(fitMaster(block(0.16, 0.16, 0.15, { round: 0.5 }), 'battered'), iron, a.hand, 0, -0.08, 0); }
  }
  // stubby iron legs and great boots
  for (const l of R.legs) { add(fitMaster(tube([V(0, 0, 0), V(0, -0.24, 0)], 0.07, { n: 12 }), 'battered'), iron, l.hip); l.knee.position.y = -0.24; add(sph(0.08, 12, 10), iron, l.knee); add(fitMaster(tube([V(0, 0, 0), V(0, -0.16, 0)], 0.065, { n: 12 }), 'battered'), iron, l.knee); add(fitMaster(block(0.2, 0.1, 0.3, { round: 0.4 }), 'battered'), iron, l.knee, 0, -0.2, 0.04); }
  R.glows.push(fire); R.base.armR = [0.0, 0.25, -0.2]; R.base.armL = [0.0, 0.25, -0.2];
  return R;
};

/* ------------------------------------------------------------------ the Unsmith: a person, by the heroes' builder */
function buildUnsmith(o) {
  const H = { build: 'brute', skin: 'skinTan', hairMat: 'hairCopper', hair: 'none', eye: '#3a2a20', tunic: 'leatherDark', pants: 'leather', pantsTint: C('#4e3626'), boots: 'leather', bootsTint: C('#5e3c22'), gloves: 'skinTan', apron: 'leatherDark', apronTint: C('#3a2014'), apronW: 1.9, apronDrop: 0.22, cloak: 'wool', cloakTint: C('#1e1c22'), buckle: 'bronze' };
  const h = buildHero('warden', {}, { H, looks: {} });
  const R = h.rig, S = R.S, r = S.headR;
  // broad shoulders: a wider chest, the arms set further out (set once, as built: nothing scales as he moves)
  R.chest.scale.set(1.2, 1, 1.12); for (const a of R.arms) a.sh.position.x *= 1.16;
  // his own face, sculpted: older and heavier than the builder's painted one (that is hidden)
  R.head.traverse(o => { if (o.isMesh && o.material?.userData?.face) o.visible = false; });
  const skin = solid('skin', '#b98264'), hairM = mat('hairCopper', { side: true }), fg = new THREE.Group(); fg.scale.setScalar(r / 0.1); R.head.add(fg);
  face(fg, skin, { r: 0.1, iris: '#1a2a34', gaunt: 0, socket: '#6a4232' });
  add(sph(0.017, 12, 8), skin, fg, 0, -0.01, 0.097).scale.set(0.9, 1.5, 0.9);                                        // a broad bridge to the nose
  for (const sd of [-1, 1]) {
    add(fitMaster(tube(curve([V(sd * 0.012, 0.048, 0.093), V(sd * 0.04, 0.058, 0.09), V(sd * 0.07, 0.05, 0.075)], 8), t => [0.007 * (1 - t * 0.4), 0.005], { n: 6 }), 'lock'), hairM, fg);   // brows
    add(fitMaster(tube(curve([V(sd * 0.005, -0.04, 0.105), V(sd * 0.04, -0.045, 0.098), V(sd * 0.065, -0.07, 0.085)], 8), t => 0.011 * (1 - t * 0.5), { n: 6 }), 'lock'), hairM, fg);       // the moustache
    for (let k = 0; k < 4; k++) add(sph(0.01, 8, 6), solid('gold', '#c89a3a'), fg, sd * 0.03, -0.13 - k * 0.022, 0.1);  // beads plaited in
  }
  // the beard: a great mass under the jaw, and locks hanging from it
  add(sph(0.075, 18, 12), hairM, fg, 0, -0.085, 0.055).scale.set(1.05, 1.15, 0.85);
  const rnd = rngOf(19);
  for (let i = 0; i < (Q.d > 1 ? 26 : 14); i++) { const a = (rnd() - 0.5) * 2.4, x0 = Math.sin(a) * 0.07, z0 = 0.05 + Math.cos(a) * 0.05, L = 0.12 + rnd() * 0.1; add(fitMaster(tube(curve([V(x0, -0.06, z0), V(x0 * 1.1, -0.06 - L * 0.5, z0 + 0.012), V(x0 * 0.8 + (rnd() - 0.5) * 0.02, -0.06 - L, z0 - 0.01)], 8), t => [0.016 * (1 - t * 0.7), 0.012 * (1 - t * 0.6)], { n: 6, twist: rnd() * 2 }), 'lock'), hairM, fg); }
  // a full head of hair, and wild locks lying along it, swept back and out
  add(sph(0.118, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), hairM, fg, 0, 0.004, -0.01).scale.set(0.95, 1.02, 1.04);               // the crown
  add(sph(0.118, 22, 14, Math.PI, Math.PI, 0, Math.PI * 0.64), hairM, fg, 0, 0.004, -0.012).scale.set(0.97, 1.02, 1.04);         // the back of the head
  for (let i = 0; i < (Q.d > 1 ? 34 : 18); i++) {
    const sgn = rnd() < 0.5 ? -1 : 1, a0 = sgn * (0.55 + rnd() * 1.5), e0 = 0.3 + rnd() * 1.05, L = 0.5 + rnd() * 0.7, pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, az = a0 + sgn * L * t * 1.3, el = e0 - L * t * 0.7, rr = 0.124 + t * 0.03 + Math.sin(t * Math.PI) * 0.012; pts.push(V(Math.sin(az) * Math.cos(el) * rr, Math.sin(el) * rr, Math.cos(az) * Math.cos(el) * rr - 0.01)); }
    add(fitMaster(tube(curve(pts, 10), t => [0.02 * (1 - t * 0.7), 0.009 * (1 - t * 0.5)], { n: 6, twist: rnd() }), 'lock'), hairM, fg);
  }
  bake(fg, new Set([fg]));
  // a heavy ragged mantle over the shoulders (the sheet's cloak), torn in layers
  { const u = S.unit, w0 = S.shX * 1.05, cm = cloth('#26242a');
    // open at the front (like the sheet's cloak, so the apron shows): each ring without its front arc
    const openRings = o => robeRings(o).map(r => { const n = r.length, c = Math.round(n * 0.13), st = Math.round(n / 4) + c; const out = []; for (let j = 0; j <= n - 2 * c; j++) out.push(r[(st + j) % n]); return out; });
    const base = { y0: S.neckY + 0.02 * u, y1: S.shY - 0.34 * u, w: t => lerp(w0 * 0.45, w0 * 1.65, Math.sqrt(t)), d: 0.8, folds: 0.1, k: 9, tatter: 0.12 * u, seed: 31, steps: 9 };
    add(fitMaster(loft(openRings(base), { closed: false }), 'mantle'), cm, R.chest);
    for (let i = 1; i <= 3; i++) { const lift = (base.y0 - base.y1) * 0.16 * i; add(fitMaster(loft(openRings({ ...base, y1: base.y1 + lift, w: t => base.w(t) + 0.012 * i * t, tatter: base.tatter * (1.25 + i * 0.25), seed: 31 * 7 + i, steps: 7 }), { closed: false }), 'mantle'), cm, R.chest); } }
  // his apron (the builder's, made full: a bib to below the knee): the gold anvil on the bib, a pocket, rivets
  { const pts = R.chest.userData.apron, u = S.unit, gm = solid('gold', '#c8962e'), am = solid('leather', '#3e2414'), at = i => pts[i].clone().add(V(0, 0, 0.008 * u));
    const an = new THREE.Group(); an.position.copy(at(1)).add(V(0, -0.01 * u, 0)); R.chest.add(an);
    add(fitMaster(block(0.11 * u, 0.026 * u, 0.012 * u, { round: 0.3 }), 'forged'), gm, an, 0, 0.02 * u, 0); add(cone(0.016 * u, 0.04 * u, 4), gm, an, -0.07 * u, 0.02 * u, 0).rotation.z = Math.PI / 2;
    add(fitMaster(block(0.035 * u, 0.03 * u, 0.012 * u, { round: 0.2 }), 'forged'), gm, an, 0, -0.008 * u, 0); add(fitMaster(block(0.08 * u, 0.02 * u, 0.012 * u, { round: 0.3 }), 'forged'), gm, an, 0, -0.03 * u, 0);
    for (const sd of [-1, 1]) { add(sph(0.012 * u, 8, 6), gm, R.chest, at(0).x + sd * 0.12 * u, at(0).y + 0.005 * u, at(0).z); add(sph(0.012 * u, 8, 6), gm, R.chest, at(0).x + sd * 0.07 * u, at(0).y - 0.05 * u, at(0).z); }
    const pk = at(5); add(fitMaster(block(0.12 * u, 0.09 * u, 0.012 * u, { round: 0.2 }), 'strap'), am, R.chest, pk.x, pk.y, pk.z + 0.004 * u); add(new THREE.BoxGeometry(0.03 * u, 0.02 * u, 0.006 * u), gm, R.chest, pk.x, pk.y + 0.03 * u, pk.z + 0.012 * u); }
  // the Unmaking Hammer, a great stone-iron head across the haft, cracked with violet fire, in his right hand
  const vio = glow('#b060ff', 2.2), ham = new THREE.Group(); R.armR.grip.add(ham);
  add(fitMaster(tube([V(0, -0.14, 0), V(0, 0.46, 0)], 0.021, { n: 8 }), 'haft'), solid('iron', '#3a2e4a'), ham);
  for (const y of [-0.12, 0.0, 0.16, 0.3]) add(tor(0.026, 0.008, 6, 12), solid('bronze', '#a0782a'), ham, 0, y, 0).rotation.x = Math.PI / 2;
  add(fitMaster(lumpy(block(0.3, 0.17, 0.17, { round: 0.22, p: 4 }), 0.007, 5, 7), 'slag'), solid('stone', '#6a6078'), ham, 0, 0.5, 0);
  for (const sd of [-1, 1]) add(fitMaster(block(0.045, 0.185, 0.185, { round: 0.2, p: 4 }), 'battered'), solid('iron', '#4a4258'), ham, sd * 0.155, 0.5, 0);
  { const rc = rngOf(91); for (const z of [-0.09, 0.09]) for (let i = 0; i < 4; i++) { let p = V(-0.12 + i * 0.07 + rc() * 0.02, 0.43 + rc() * 0.03, z); const pts = [p.clone()]; for (let k = 0; k < 4; k++) { p = p.clone().add(V((rc() - 0.5) * 0.05, 0.028 + rc() * 0.012, 0)); pts.push(p.clone()); } add(tube(pts, 0.005, { n: 4 }), vio, ham); } }
  for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) add(tube([V(sd * 0.18, 0.45 + i * 0.06, -0.05), V(sd * 0.181, 0.48 + i * 0.045, 0.0), V(sd * 0.18, 0.46 + i * 0.06, 0.05)], 0.005, { n: 4 }), vio, ham);
  bake(ham, new Set([ham]));
  // the Worldforge Heart burning through his shirt
  const core = glow('#ff7a2a', 2.4); add(sph(0.03, 12, 10), core, R.chest, 0, R.S.shY - 0.12 * R.S.unit, 0.12 * R.S.unit).scale.set(1, 1, 0.5);
  h.extra = { core, vio };
  return h;
}

function buildJourneyman(o) {
  const H = { build: 'human', skin: 'skinTan', hairMat: 'hairBlack', hair: 'crop', eye: '#c89a3a', tunic: 'leatherDark', pants: 'wool', boots: 'leatherDark', gloves: 'leather', mask: 'leatherDark', mantle: 'hide', cloak: 'leatherDark', buckle: 'bronze', satchel: 'leather' };
  const h = buildHero('warden', {}, { H, looks: {} });
  const R = h.rig, brass = solid('gold', '#c8a040'), S = R.S, u = S.unit;
  // a fur collar round the neck and over the shoulders: tufts laid outward and down
  const fur = solid('wool', '#5a4636'), fr = rngOf(51), furG = new THREE.Group(); R.chest.add(furG);
  for (let i = 0; i < (Q.d > 1 ? 44 : 22); i++) { const a = i / (Q.d > 1 ? 44 : 22) * Math.PI * 2 + fr() * 0.1, rr = S.shX * (0.75 + fr() * 0.25), y = S.shY + 0.03 * u + fr() * 0.04 * u, x = Math.cos(a) * rr, z = Math.sin(a) * rr * 0.75, out = V(Math.cos(a), 0, Math.sin(a) * 0.75).normalize();
    add(fitMaster(tube(curve([V(x, y, z), V(x + out.x * 0.04 * u, y - 0.02 * u, z + out.z * 0.04 * u), V(x + out.x * 0.07 * u, y - 0.08 * u - fr() * 0.04 * u, z + out.z * 0.07 * u)], 6), t => [0.022 * u * (1 - t * 0.7), 0.012 * u * (1 - t * 0.6)], { n: 6, twist: fr() }), 'lock'), fur, furG); }
  bake(furG, new Set([furG]));
  // wild dark hair over the head (as the Unsmith's: locks along the scalp, swept back and out)
  const hairM = mat('hairBlack', { side: true }), hg = new THREE.Group(); hg.scale.setScalar(S.headR / 0.1); R.head.add(hg);
  for (let i = 0; i < (Q.d > 1 ? 30 : 16); i++) { const sgn = fr() < 0.5 ? -1 : 1, a0 = sgn * (0.2 + fr() * 1.6), e0 = 0.45 + fr() * 1.0, L = 0.4 + fr() * 0.6, pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, az = a0 + sgn * L * t * 1.2, el = e0 - L * t * 0.9, rr2 = 0.115 + t * 0.035 + Math.sin(t * Math.PI) * 0.015; pts.push(V(Math.sin(az) * Math.cos(el) * rr2, Math.sin(el) * rr2, Math.cos(az) * Math.cos(el) * rr2 - 0.005)); }
    add(fitMaster(tube(curve(pts, 10), t => [0.018 * (1 - t * 0.7), 0.009 * (1 - t * 0.5)], { n: 6, twist: fr() }), 'lock'), hairM, hg); }
  bake(hg, new Set([hg]));
  // the Runestaff, its compass-star and the tags tied to it
  const st = new THREE.Group(); R.armR.grip.add(st);
  add(fitMaster(tube([V(0, -0.5, 0), V(0, 0.55, 0)], 0.013, { n: 8 }), 'haft'), solid('wood', '#3a2a1e'), st);
  for (const y of [-0.45, 0.1, 0.4]) add(tor(0.016, 0.005, 6, 12), brass, st, 0, y, 0).rotation.x = Math.PI / 2;
  add(tor(0.06, 0.007, 6, 20), brass, st, 0, 0.66, 0);
  for (let i = 0; i < 4; i++) add(cone(0.012, 0.07, 4), brass, st, Math.cos(i * Math.PI / 2) * 0.05, 0.66 + Math.sin(i * Math.PI / 2) * 0.05, 0).rotation.z = i * Math.PI / 2 - Math.PI / 2;
  const rune = glow('#ffb03a', 2.0); add(sph(0.016, 10, 8), rune, st, 0, 0.66, 0);
  for (const s2 of [-1, 1]) add(fitMaster(plate([[-0.012, -0.04], [0.012, -0.04], [0.012, 0.04], [-0.012, 0.04]], () => 0.002), 'strap', { planar: true }), cloth('#c8b890'), st, s2 * 0.025, 0.52, 0.01);
  bake(st, new Set([st]));
  h.extra = { core: rune, vio: rune };
  return h;
}

/* ------------------------------------------------------------------ moves */
const COMMON = { idle: 2.4, walk: 1.0, bite: 1.0, strike: 1.2, swipe: 1.1, cast: 1.4, roar: 1.6, hurt: 0.6, ko: 1.6 };
const OWN = {
  'iron-sentinel': { 'iron-fist': 1.0, 'gate-slam': 1.3, 'lock-shields': 1.2 },
  'sentinel-captain': { 'iron-fist': 1.0, 'gate-slam': 1.3, 'lock-shields': 1.2, ironwall: 1.4, 'shield-rush': 1.4 },
  'ashen-warden': { 'ash-blade': 1.2, 'ember-sweep': 1.3, 'ward-of-ash': 1.4, 'call-the-watch': 1.5, 'command-of-cinders': 1.5, 'scorch-the-vault': 1.7, 'watch-unbroken': 1.6 },
  'cinder-thrall': { 'cinder-fist': 1.0, 'ash-in-the-eyes': 1.2, reform: 1.8 },
  'thrall-overseer': { 'cinder-fist': 1.0, 'ash-in-the-eyes': 1.2, reform: 1.8, 'hot-chain': 1.1, 'drive-them': 1.3 },
  forgeborn: { 'molten-fist': 1.0, 'slag-spit': 1.2, stoke: 1.3 },
  bellows: { 'molten-fist': 1.0, 'slag-spit': 1.2, stoke: 1.3, 'bellows-blast': 1.4, 'blow-sparks': 1.3 },
  journeyman: { 'molten-fist': 1.0, 'slag-spit': 1.2, stoke: 1.3, 'smiths-hammer': 1.2, 'temper-kin': 1.4, 'rune-fire': 1.5, 'white-heat': 1.4 },
  'forge-warden': { 'hammer-arm': 1.2, 'bellows-breath': 1.5, 'hold-the-bridge': 1.4, stoke: 1.3 },
  unsmith: { 'hammer-blow': 1.2, 'ring-the-anvil': 1.5, unmake: 1.4, 'forge-apron': 1.3, 'nothing-left': 1.6, worldfire: 1.7, 'hearts-pull': 1.5, 'heart-flare': 1.4 },
};
const MS = {
  'iron-fist': u => { const r = rise(u, 0.45); return { armR: [-1.5 * r, 0.1, -0.2 * (1 - r)], forward: 0.15 * r, turn: -0.25 * r, lean: 0.1 * r }; },
  'gate-slam': u => { const r = rise(u, 0.5); return { forward: 0.4 * r, turn: 0.5 * r, lean: 0.25 * r, armL: [-0.6 * r, 0.3, -1.2], stance: r }; },
  'lock-shields': u => { const w = rise(u, 0.4); return { armL: [-1.2 * w, -0.1, -0.6], sink: 0.08 * w, stance: w, glow: 1 + 0.5 * w }; },
  ironwall: u => { const w = u < 0.5 ? smooth(u / 0.5) : 1, d = u < 0.5 ? 0 : smooth((u - 0.5) / 0.2) * (1 - smooth((u - 0.75) / 0.25)); return { armL: [-2.4 * w * (1 - d) - 0.8 * d, 0.0, -0.4], sink: 0.12 * d, stance: d, glow: 1 + d }; },
  'shield-rush': u => { const r = rise(u, 0.5); return { forward: 0.55 * r, lean: 0.3 * r, armL: [-1.3 * r, -0.1, -0.8], stance: r }; },
  'ash-blade': u => SHAPES.strike(u),
  'ember-sweep': u => ({ ...SHAPES.swipe(u), glow: 1 + 1.5 * env(u) }),
  'ward-of-ash': u => { const w = rise(u, 0.35); return { armL: [-1.5 * w, -0.2, -0.9], sink: 0.08 * w, glow: 1 + 0.8 * w }; },
  'call-the-watch': u => { const d = rise(u, 0.5); return { armL: [-0.2 + 0.4 * d, 0.1, -0.2], sink: 0.2 * d, lean: 0.25 * d, glow: 1 + d }; },
  'command-of-cinders': u => { const w = rise(u, 0.35); return { armR: [-2.9 * w, 0.1, -0.1], head: [-0.3 * w, 0], glow: 1 + 2.5 * w }; },
  'scorch-the-vault': u => { const w = rise(u, 0.6); return { armR: [-3.0 * w, 0.2, 0], armL: [-1.0 * w, 0.6 * w, -0.4], head: [-0.4 * w, 0], lift: 0.05 * w, glow: 1 + 3.5 * w }; },
  'watch-unbroken': u => { const w = rise(u, 0.4); return { armR: [-0.8 * w, 1.2 * w, -0.2], armL: [-0.8 * w, 1.2 * w, -0.2], glow: 1 + 2.5 * w }; },
  'hammer-blow': u => SHAPES.strike(u),
  'ring-the-anvil': u => { const s = SHAPES.strike(u); return { ...s, sink: 0.12 * env(u), stance: env(u), glow: 1 + env(u) }; },
  unmake: u => ({ ...SHAPES.strike(u), glow: 1 + 2 * env(u) }),
  'forge-apron': u => { const w = rise(u, 0.35); return { armR: [-1.2 * w, -0.5, -1.4 * w], armL: [-1.2 * w, -0.5, -1.4 * w], sink: 0.06 * w }; },
  'nothing-left': u => { const w = rise(u, 0.4); return { armR: [-0.5 * w, 0.7 * w, -0.3], armL: [-0.5 * w, 0.7 * w, -0.3], head: [0.2 * w, 0] }; },
  worldfire: u => ({ ...SHAPES.roar(u), glow: 1 + 3 * env(u) }),
  'hearts-pull': u => { const r = rise(u, 0.45); return { lean: -0.25 * r, armR: [-0.4 * r, 0.9 * r, 0], armL: [-0.4 * r, 0.9 * r, 0], glow: 1 + 2 * r }; },
  'heart-flare': u => { const b = Math.max(0, Math.sin(u * Math.PI * 2)) * (1 - u * 0.5); return { lean: -0.12 * b, glow: 1 + 3 * b }; },
};
Object.assign(MS, {
  'cinder-fist': u => ({ ...MS['iron-fist'](u), glow: 1 + env(u) }),
  'molten-fist': u => ({ ...MS['iron-fist'](u), glow: 1 + env(u) }),
  'hammer-arm': u => ({ ...SHAPES.strike(u), glow: 1 + 0.5 * env(u) }),
  'smiths-hammer': u => SHAPES.strike(u),
  'white-heat': u => ({ ...SHAPES.strike(u), glow: 1 + 2.5 * env(u) }),
  'hot-chain': u => ({ ...SHAPES.swipe(u), glow: 1 + env(u) }),
  'ash-in-the-eyes': u => { const r = rise(u, 0.4); return { lean: 0.25 * r, forward: 0.1 * r, armR: [-1.2 * r, 0.3, -0.2], armL: [-1.2 * r, 0.3, -0.2], glow: 1 + 2 * r }; },
  reform: u => { const d = u < 0.45 ? smooth(u / 0.45) : 1 - smooth((u - 0.55) / 0.45); return { sink: 0.35 * d, lean: 0.3 * d, armR: [0.3 * d, 0.6 * d, 0], armL: [0.3 * d, 0.6 * d, 0], glow: 1 + 2 * d }; },
  'drive-them': u => ({ ...SHAPES.roar(u), armR: [-2.4 * rise(u, 0.3), 0.3, -0.2] }),
  'slag-spit': u => { const r = rise(u, 0.4); return { lean: -0.2 * r + 0.3 * (u > 0.5 ? env((u - 0.5) * 2) : 0), head: [-0.3 * r, 0], glow: 1 + 2 * r }; },
  stoke: u => ({ ...SHAPES.cast(u), glow: 1 + 3 * env(u) }),
  'bellows-blast': u => ({ ...SHAPES.roar(u), glow: 1 + 3.5 * env(u) }),
  'bellows-breath': u => ({ ...SHAPES.roar(u), glow: 1 + 3.5 * env(u) }),
  'blow-sparks': u => ({ ...SHAPES.cast(u), glow: 1 + 2.5 * env(u) }),
  'temper-kin': u => SHAPES.cast(u),
  'rune-fire': u => { const w = rise(u, 0.4); return { armR: [-2.6 * w, 0.2, -0.1], head: [-0.3 * w, 0], glow: 1 + 3 * w }; },
  'hold-the-bridge': u => MS['gate-slam'](u),
});
const shapeOf = (m, u) => (MS[m] ? MS[m](u) : SHAPES[m] ? SHAPES[m](u) : {});

/* ------------------------------------------------------------------ build */
export function buildArmoured(key, o = {}) {
  const keepQ = Q.d; Q.d = o.detail === 'light' ? 1 : 2;
  try {
    const group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
    const H = ARMOURED_INFO[key].height;
    let look;
    if (key === 'unsmith' || key === 'journeyman') {
      const h = key === 'unsmith' ? buildUnsmith(o) : buildJourneyman(o); inner.add(h.group); inner.scale.setScalar(H / 1.22);
      look = heroLook(key, group, h, H);
    } else {
      const R = B[key](inner);
      const tall = [R.props.blade].filter(Boolean); for (const x of tall) x.visible = false;
      inner.updateMatrixWorld(true);
      const box = new THREE.Box3(); inner.traverseVisible(x => { if (x.isMesh) box.expandByObject(x); });
      for (const x of tall) x.visible = true;
      inner.scale.setScalar(H / Math.max(0.2, box.max.y - Math.min(0, box.min.y)));
      if (key === 'cinder-thrall' || key === 'forgeborn') R.mists.push(mist(R.body, { color: '#5a4e48', r: 0.3, y: -0.7, rise: 0.6, size: 0.24, opacity: 0.22 }));
      if (key === 'ashen-warden') R.mists.push(mist(R.body, { color: '#6a5a50', r: 0.4, y: -0.66, rise: 0.5, size: 0.3, opacity: 0.3 }));
      const keep = new Set([group, inner, R.root, R.body, R.chest, R.head, ...R.arms.flatMap(a => [a.sh, a.el, a.hand]), ...R.legs.flatMap(l => [l.hip, l.knee]), ...Object.values(R.props)]);
      bake(group, keep);
      look = rigLook(key, group, R, H);
    }
    let tris = 0, draws = 0; group.traverse(x => { if (x.isMesh) { draws++; const g = x.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    look.triangles = Math.round(tris); look.draws = draws;
    return look;
  } finally { Q.d = keepQ; }
}
function baseLook(key, group, height) {
  const D = { ...COMMON, ...(OWN[key] || {}) };
  const look = { group, g: group, plan: 'walker', key, height, act: { lunge: 0, fall: 0 }, hitAt: -9, t: 0, moves: { MOVES: Object.entries(D), DUR: D }, duration: m => D[m] || 1.2, hit() { look.hitAt = look.t; },
    update(t, step = 0) { look.t = t; const L = look.act.lunge || 0, F = look.act.fall || 0, h = (t - look.hitAt) / 0.6; if (F > 0) return look.pose('ko', F, t, 0); if (h >= 0 && h < 1) return look.pose('hurt', h, t, 0); if (L > 0) return look.pose('bite', L, t, 0); return look.pose(step ? 'walk' : 'idle', 0, t, step); } };
  return look;
}
function rigLook(key, group, R, height) {
  const look = baseLook(key, group, height);
  look.rig = R; look.parts = { head: R.head, body: R.body, chest: R.chest, armL: R.armL.sh, armR: R.armR.sh, legL: R.legs[1].hip, legR: R.legs[0].hip, ...R.props };
  look.pose = (move, u, t, step = 0) => { look.t = t; poseConstruct(R, shapeOf(move, u), t, step, move); };
  look.pose('idle', 0, 0, 0);
  return look;
}
function poseConstruct(R, S, t, step) {
  const br = Math.sin(t * 1.5) * 0.008, sink = S.sink || 0, stance = S.stance || 0, ko = S.lean < -0.8 ? 1 : 0;
  R.body.position.set(0, R.hipY + br - sink + (S.lift || 0) - (step ? Math.abs(Math.sin(step)) * 0 : 0), S.forward || 0);
  R.body.rotation.set((S.lean || 0) * 0.5, (S.turn || 0), step ? Math.sin(step) * 0.04 : 0);
  R.chest.rotation.set((S.lean || 0) * 0.5 + br, (S.turn || 0) * 0.4, 0);
  R.head.rotation.set(S.head?.[0] || 0, (S.head?.[1] || 0) + Math.sin(t * 0.4) * 0.05, 0);
  for (const a of R.arms) {
    const base = (a.side === -1 ? R.base.armR : R.base.armL) || [0, 0.12, -0.2], mv = a.side === -1 ? S.armR : S.armL;
    a.sh.rotation.set(base[0] + (mv ? mv[0] : 0) + (step ? Math.sin(step + (a.side > 0 ? 0 : Math.PI)) * 0.3 : 0), 0, (base[1] + (mv ? mv[1] : 0)) * a.side);
    a.el.rotation.set(base[2] + (mv ? mv[2] : 0), 0, 0);
  }
  // a shield and a sword stay upright and facing forward in the hand (they turn with the arm only as far as the move swings them)
  if (R.props.shield) R.props.shield.rotation.set(-(R.armL.sh.rotation.x + R.armL.el.rotation.x) * 0.9, -0.25, -R.armL.sh.rotation.z * 0.8);
  if (R.props.blade) R.props.blade.rotation.set(-(R.armR.sh.rotation.x + R.armR.el.rotation.x) * 0.75 - 0.1, 0, -R.armR.sh.rotation.z * 0.8);
  for (const l of R.legs) {
    const sw = step ? Math.sin(step + (l.side > 0 ? Math.PI : 0)) * 0.45 : 0;
    l.hip.rotation.set(-sw - sink * 1.8 - (S.lean || 0) * 0.3, 0, l.side * 0.06 * stance);
    l.knee.rotation.set(Math.max(0, sw) * 0.5 + sink * 3.2, 0, 0);
  }
  if (ko) R.root.position.y = -0.1 * clamp01(-S.lean - 0.8); else R.root.position.y = 0;
  const gl = S.glow ?? 1; for (const m of R.glows) { m.userData.base ??= m.emissiveIntensity; m.emissiveIntensity = m.userData.base * Math.max(0.05, gl); }
  for (const mi of R.mists) { mi.update(t); }
}
// the Unsmith moves by the heroes' poses, with each move's own arms and lean laid over them
function heroLook(key, group, h, height) {
  const look = baseLook(key, group, height), R = h.rig, inner = group.children[0];
  look.rig = R; look.hero = h; look.parts = { head: R.head, body: R.root, chest: R.chest, armL: R.armL.sh, armR: R.armR.sh };
  const glows = [h.extra.core, h.extra.vio];
  look.pose = (move, u, t, step = 0) => {
    look.t = t; const S = shapeOf(move, u);
    const strikeLike = /strike|blow|unmake|anvil|ash-blade|smiths-hammer|white-heat/.test(move);
    setPose(R, step ? 'walk' : strikeLike ? 'strike' : 'idle', t, strikeLike ? u : step || 0);
    if (!strikeLike) for (const a of R.arms) { const mv = a.side === -1 ? S.armR : S.armL; if (mv) { a.sh.rotation.x += mv[0]; a.sh.rotation.z += mv[1] * a.side; a.elbow.rotation.x += mv[2]; } }
    inner.rotation.x = (S.lean || 0) * (S.lean < -0.8 ? 1 : 0.4); inner.position.set(0, -(S.sink || 0) - (S.lean < -0.8 ? 0.2 * clamp01(-S.lean - 0.8) : 0), S.forward || 0); inner.rotation.y = S.turn || 0;
    const gl = S.glow ?? 1; for (const m of glows) { m.userData.base ??= m.emissiveIntensity; m.emissiveIntensity = m.userData.base * Math.max(0.05, gl); }
  };
  look.pose('idle', 0, 0, 0);
  return look;
}

/* ------------------------------------------------------------------ for the Fight */
export function armouredLook(key, sprite, opts = {}) { if (!ARMOURED_INFO[key]) return null; return buildArmoured(key, { detail: opts.detail === 'high' ? 'high' : 'light' }); }
export const withArmoured = fallback => (key, sprite, opts) => armouredLook(key, sprite, opts) || fallback(key, sprite, opts);
