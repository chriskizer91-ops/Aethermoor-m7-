// The moves of a fight (November 20): how a hero or a foe stands, strikes, casts, guards, is hit, falls and gets up.
// Heroes are posed on their rig (prototypes/hero-3d/model.js: setPose, then the arms, legs and body turned on top);
// foes by their body plan (prototypes/bestiary/beasts.js: four legs, two legs, a wraith, a serpent...), moving their
// whole figure and the parts the plan names (head, tail, wings). Pure posing: no timing lives here. Each pose takes
// u, 0..1 through the move, and t, the clock (for breathing).
import { setPose } from '../../prototypes/hero-3d/model.js';

const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));

// ---- heroes ------------------------------------------------------------------------------------------------------
// the strike that suits the weapon: by the item's kind (data/items.js), else the rig's class (art/item-looks.js)
export function strikeStyle(kind, cls, twoHands) {
  if (kind === 'sword') return twoHands ? 'cleave' : 'slash';
  if (kind === 'axe') return 'chop';
  if (kind === 'hammer' || kind === 'mace' || kind === 'maul') return twoHands ? 'slam' : 'bash';
  if (kind === 'dagger') return 'stab';
  if (kind === 'spear') return 'thrust';
  if (kind === 'bow') return 'shoot';
  if (kind === 'staff') return 'swing';
  if (kind === 'wand') return 'flick';
  if (!kind && !cls) return 'punch';
  return { blade: 'slash', blunt: 'bash', spear: 'thrust', bow: 'shoot', staff: 'swing' }[cls] || 'slash';
}
// does the strike close in on the foe (melee), or loose from where the hero stands?
export const RANGED = new Set(['shoot', 'flick']);

// pose the rig: move is one of ready, step, strike (with style), cast, defend, item, hurt, cheer, legend; u 0..1
export function poseHero(rig, move, u, t, style = 'slash') {
  const R = rig.armR, L = rig.armL;
  if (move === 'strike' && (style === 'thrust' || style === 'shoot' || style === 'swing' || style === 'slash')) {
    setPose(rig, 'strike', t, u);
    if (style === 'slash') { rig.root.rotation.x += 0.12 * bump(u); }
    return;
  }
  setPose(rig, 'idle', t, 0);
  // a fighting crouch under everything: knees a little bent, weight forward
  rig.root.position.y -= 0.012; rig.root.rotation.x += 0.05;
  if (move === 'ready' || move === 'step') {
    if (rig.cls !== 'bow') { R.sh.rotation.x -= 0.25; R.elbow.rotation.x -= 0.15; }
    L.sh.rotation.x -= 0.12;
    if (move === 'step') { rig.root.rotation.x += 0.05; }
    return;
  }
  if (move === 'strike') {
    const wind = seg(u, 0, 0.3), cut = seg(u, 0.3, 0.5), back = seg(u, 0.62, 1), k = 1 - back;
    if (style === 'chop' || style === 'cleave') {
      // the axe goes up over the shoulder and comes straight down; the body bends into it
      R.sh.rotation.x = -0.28 + (-2.9 * wind + 3.4 * cut) * k;
      R.sh.rotation.z = -0.16 - 0.15 * wind * k;
      R.elbow.rotation.x = -1.15 + (0.6 * wind - 0.4 * cut) * k;
      if (style === 'cleave') { L.sh.rotation.x = R.sh.rotation.x + 0.2; L.elbow.rotation.x = R.elbow.rotation.x; }
      rig.root.rotation.x += (-0.12 * wind + 0.35 * cut) * k;
      rig.root.position.z += 0.06 * cut * k;
    } else if (style === 'slam' || style === 'bash') {
      // a heavy head: a long wind-up behind, a hop, and down with the whole body
      const two = style === 'slam';
      R.sh.rotation.x = -0.28 + (-3.1 * wind + 3.7 * cut) * k;
      R.sh.rotation.z = -0.16 + 0.3 * wind * k;
      R.elbow.rotation.x = -1.15 + (0.9 * wind - 0.6 * cut) * k;
      if (two) { L.sh.rotation.x = R.sh.rotation.x; L.sh.rotation.z = 0.1; L.elbow.rotation.x = R.elbow.rotation.x - 0.2; }
      rig.root.rotation.x += (-0.2 * wind + 0.45 * cut) * k;
      rig.root.rotation.y += 0.3 * wind * (1 - cut) * k;
      rig.root.position.y += (0.05 * bump(u / 0.42) - 0.05 * cut * k);
      for (const leg of rig.legs) leg.rotation.x = -0.2 * cut * k;
    } else if (style === 'stab') {
      // two quick jabs low and forward
      const j = Math.max(bump((u - 0.08) / 0.28), bump((u - 0.38) / 0.28)) * k;
      R.sh.rotation.x = -0.6 - 0.9 * j; R.elbow.rotation.x = -1.4 + 1.2 * j; R.hand.rotation.x = 0.3 + 0.9 * j;
      rig.root.rotation.y = -0.35 * j; rig.root.position.z += 0.08 * j; rig.root.rotation.x += 0.15 * j;
    } else if (style === 'flick') {
      const a = bump(u * 1.2) * k; R.sh.rotation.x = -0.28 - 1.5 * a; R.elbow.rotation.x = -1.15 + 1.0 * a; R.hand.rotation.x = 0.2 + 0.6 * a;
    } else { // punch
      const a = bump(u * 1.3) * k; R.sh.rotation.x = -0.4 - 1.1 * a; R.elbow.rotation.x = -1.8 + 1.7 * a; rig.root.rotation.y = -0.4 * a; rig.root.position.z += 0.07 * a;
    }
    return;
  }
  if (move === 'cast' || move === 'legend') {
    // both hands up and out, the body lifting, then thrown forward
    const up = seg(u, 0, 0.45), go = seg(u, 0.45, 0.65), back = seg(u, 0.75, 1), k = 1 - back, big = move === 'legend' ? 1.3 : 1;
    R.sh.rotation.x = -0.28 + (-1.6 * up * big + 0.5 * go) * k; R.sh.rotation.z = -0.16 - 0.5 * up * k;
    L.sh.rotation.x = -0.25 + (-1.6 * up * big + 0.5 * go) * k; L.sh.rotation.z = 0.2 + 0.5 * up * k;
    R.elbow.rotation.x = -1.15 + 0.9 * up * k; L.elbow.rotation.x = -1.0 + 0.8 * up * k;
    rig.root.position.y += 0.04 * up * k * big; rig.root.rotation.x += (-0.12 * up + 0.2 * go) * k;
    rig.head.rotation.x -= 0.25 * up * k;
    return;
  }
  if (move === 'defend') {
    // the guard: the weapon across, the off hand (its shield) forward, low on the knees
    const a = ease(u * 3);
    R.sh.rotation.x = -0.28 - 0.9 * a; R.sh.rotation.z = -0.16 + 0.55 * a; R.elbow.rotation.x = -1.15 - 0.5 * a;
    L.sh.rotation.x = -0.25 - 1.0 * a; L.elbow.rotation.x = -1.0 - 0.3 * a; L.sh.rotation.z = 0.2 - 0.2 * a;
    rig.root.position.y -= 0.03 * a; rig.root.rotation.x += 0.12 * a;
    for (const leg of rig.legs) leg.rotation.x = -0.1 * a;
    return;
  }
  if (move === 'item') {
    // a flask from the belt to the lips and down
    const a = bump(u);
    L.sh.rotation.x = -0.25 - 1.5 * a; L.elbow.rotation.x = -1.0 - 1.1 * a; L.sh.rotation.z = 0.2 - 0.3 * a;
    rig.head.rotation.x -= 0.4 * seg(u, 0.25, 0.5) * (1 - seg(u, 0.7, 0.95));
    return;
  }
  if (move === 'hurt') {
    // the blow knocks the body back and the arms out
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)) + bump(u * 1.6) * 0.0;
    rig.root.rotation.x -= 0.35 * a; rig.head.rotation.x -= 0.3 * a;
    R.sh.rotation.z -= 0.4 * a; L.sh.rotation.z += 0.4 * a;
    return;
  }
  if (move === 'cheer') {
    // the weapon up high, a little hop
    const a = ease(u * 2.5), hop = Math.abs(Math.sin(u * Math.PI * 2)) * (1 - seg(u, 0.5, 1));
    R.sh.rotation.x = -0.28 - 2.7 * a; R.sh.rotation.z = -0.16 - 0.25 * a; R.elbow.rotation.x = -1.15 + 0.9 * a;
    L.sh.rotation.z = 0.2 + 0.4 * a;
    rig.root.position.y += 0.08 * hop; rig.head.rotation.x -= 0.25 * a;
  }
}

// ---- foes --------------------------------------------------------------------------------------------------------
// what kind of mover a body plan is
export function foeMover(plan, humanoid) {
  if (humanoid) return 'person';
  return { quad: 'beast', biped: 'brute', wraith: 'float', spark: 'float', winged: 'flier', serpent: 'serpent', frog: 'hopper', mound: 'hopper', sapling: 'hopper', mushroom: 'hopper', rocks: 'hopper', willow: 'brute', anvil: 'hopper', scorpion: 'beast' }[plan] || 'hopper';
}
// a foe's whole figure, posed: returns { lean, rise, fwd, roll, sq } (lean forward radians, rise metres, forward metres,
// roll sideways radians, squash) and moves the parts its plan names
export function poseFoe(F, move, u, t) {
  const o = { lean: 0, rise: 0, fwd: 0, roll: 0, sq: 1, yaw: 0 };
  const m = F.mover, P = F.parts || {};
  if (P.head && P.head.userData.rx0 == null) P.head.userData.rx0 = P.head.rotation.x;
  if (P.head) P.head.rotation.x = P.head.userData.rx0;
  if (move === 'idle' || move === 'run') {
    if (m === 'float' || m === 'flier') o.rise = 0.08 + Math.sin(t * 1.7 + F.ph) * 0.06;
    if (m === 'hopper') o.sq = 1 + Math.sin(t * 3 + F.ph) * 0.03;
    if (m === 'beast') o.lean = Math.sin(t * 2 + F.ph) * 0.02;
    return o;
  }
  if (move === 'attack') {
    // gather, spring, bite or slam, and settle back
    const gather = seg(u, 0, 0.3), go = seg(u, 0.3, 0.5), back = seg(u, 0.7, 1), k = 1 - back;
    if (m === 'beast') {
      o.lean = (0.25 * gather - 0.45 * go) * k; o.rise = 0.25 * bump((u - 0.3) / 0.25) * k; o.sq = 1 - 0.12 * gather * (1 - go);
      if (P.head) P.head.rotation.x = P.head.userData.rx0 + (-0.4 * gather + 0.7 * go) * k;
    } else if (m === 'brute' || m === 'person') {
      o.lean = (-0.25 * gather + 0.5 * go) * k; o.rise = 0.05 * bump((u - 0.2) / 0.3) * k;
    } else if (m === 'float' || m === 'flier') {
      o.rise = 0.15 + 0.5 * gather * (1 - go) * k; o.lean = 0.5 * go * k;
    } else if (m === 'serpent') {
      o.rise = (0.35 * gather) * k; o.lean = (-0.4 * gather + 0.9 * go) * k;
    } else { // hopper
      o.rise = 0.45 * bump((u - 0.15) / 0.4) * k; o.sq = 1 + (-0.2 * gather + 0.25 * go) * k * (1 - seg(u, 0.5, 0.6));
    }
    return o;
  }
  if (move === 'bite') {
    const a = bump(u);
    o.lean = 0.35 * a; o.fwd = 0.2 * a;
    if (P.head) P.head.rotation.x = P.head.userData.rx0 + 0.6 * a;
    if (m === 'hopper') { o.sq = 1 - 0.2 * a; o.rise = 0.1 * a; }
    return o;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.5) * (1 - seg(u, 0.6, 1));
    o.lean = -0.3 * a; o.fwd = -0.25 * a; o.sq = 1 - 0.08 * a;
    return o;
  }
  if (move === 'ko') {
    // over it goes: a beast on its side, a person on its back, a floater sinking down
    const a = ease(u);
    if (m === 'float' || m === 'flier') { o.rise = -0.3 * a; o.lean = 0.6 * a; o.sq = 1 - 0.5 * a; }
    else if (m === 'person' || m === 'brute') { o.lean = -1.45 * a; o.rise = -0.05 * a; }
    else if (m === 'hopper') { o.sq = 1 - 0.55 * a; o.roll = 0.3 * a; }
    else { o.roll = 1.45 * a; o.rise = 0.05 * bump(u) - 0.02 * a; }
    return o;
  }
  return o;
}
