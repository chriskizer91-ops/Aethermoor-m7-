// Moves for a four-legged beast (the foe kit, from Briarmaw, November 20), posed by bone name (kit/rigs/quad.py):
// hips, spine, chest, neck, head, jaw?, tail?, and fl/fr/bl/br _upper, _lower, _paw. Each move is a pure pose of u
// (0..1 through the move) and t (the clock), the way the Fight poses everyone (world3d/battle/moves.js).
// Bones rest unrotated, so rotation.x pitches (negative lifts a head or swings a leg forward), y turns, z rolls.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };

export const MOVES = [['idle', 'Breathe'], ['walk', 'Walk'], ['roar', 'Roar'], ['swipe', 'Swipe'], ['bite', 'Bite'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { roar: 2.2, swipe: 1.4, bite: 1.1, hurt: 0.9, ko: 2.4 };
export const LUNGE = 'bite';

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
function legs(B, step, amp = 1) {
  const bn = (n) => B.bones[n] || NOOP;
  // walk: diagonal pairs together (front left with back right), the foot lifting as it swings forward
  const P = { fl: 0, br: 0, fr: Math.PI, bl: Math.PI };
  for (const k of ['fl', 'fr', 'bl', 'br']) {
    const ph = step + P[k], s = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    bn(k + '_upper').rotation.x = -0.03 * s * amp;     // the upper leg is in the body: it barely swings, the lower leg steps
    bn(k + '_lower').rotation.x = (k[0] === 'f' ? 0.13 : -0.13) * lift * amp;     // a heavy beast's short steps
    bn(k + '_paw').rotation.x = 0.08 * s * amp - (k[0] === 'f' ? 0.18 : -0.12) * lift * amp;
  }
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 1.9);
  // breathing under everything: the chest swells, the head bobs a little, the tail sways
  b.spine.rotation.x = -0.012 * br;     // breathing: the back lifts (bones turn, never scale)
  b.head.rotation.x = 0.015 * br; b.head.rotation.y = 0.04 * Math.sin(t * 0.55);     // his cheeks and beard grow into his shoulders: the head turns little
  b.tail.rotation.y = 0.05 * Math.sin(t * 1.3); b.tail.rotation.x = 0.015 * br;
  b.jaw.rotation.x = 0.03 + 0.02 * br;
  if (move === 'idle') return;
  if (move === 'walk') {
    legs(B, step);
    B.body.position.y = 0.025 * Math.abs(Math.sin(step));
    b.hips.rotation.z = 0.03 * Math.sin(step); b.chest.rotation.z = -0.03 * Math.sin(step);
    b.head.rotation.x += 0.02 * Math.sin(step * 2);
    return;
  }
  if (move === 'roar') {
    // rear back, head up, jaw wide, shake
    const up = seg(u, 0, 0.25), hold = 1 - seg(u, 0.75, 1), k = up * hold, shake = Math.sin(u * 70) * 0.03 * k;
    b.hips.rotation.x = -0.28 * k; b.hips.rotation.y = shake;     // he rears whole and shakes
    b.jaw.rotation.x = 0.05 + 0.38 * k;
    B.body.position.y = 0.05 * k;
    return;
  }
  if (move === 'swipe') {
    // up on the hind legs a little, the right forepaw raised and raked across
    const lift = seg(u, 0, 0.3), rake = seg(u, 0.32, 0.55), back = 1 - seg(u, 0.7, 1), k = back;
    b.hips.rotation.x = -0.24 * lift * k;     // he rears whole
    b.hips.rotation.y = (0.18 * lift - 0.36 * rake) * k;     // he turns whole into the rake
    // a low beast's upper legs are inside his body: the paw comes up and rakes from the elbow down
    b.fr_upper.rotation.z = 0.04 * rake * k;
    b.fr_lower.rotation.x = (-0.08 * lift + 0.05 * rake) * k; b.fr_paw.rotation.x = (-0.3 * lift + 0.18 * rake) * k;
    b.jaw.rotation.x = 0.05 + 0.3 * rake * k;
    B.body.position.y = 0.06 * lift * k;
    return;
  }
  if (move === 'bite') {
    // a lunge: head down and forward, jaw open, snapped shut as he lands
    const go = seg(u, 0, 0.4), snap = seg(u, 0.45, 0.55), back = 1 - seg(u, 0.6, 1);
    b.neck.rotation.x = 0.05 * go * back; b.head.rotation.x += -0.03 * go * back;
    b.jaw.rotation.x = 0.05 + 0.4 * go * (1 - snap) * back;
    b.hips.rotation.x = 0.14 * go * back; B.body.position.z = 0.25 * go * back;     // he dips whole into the bite
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    B.body.position.z = -0.18 * a; b.hips.rotation.x = -0.22 * a; b.hips.rotation.y = 0.1 * a; b.hips.rotation.z = 0.04 * a;     // he reels whole b.jaw.rotation.x = 0.05 + 0.35 * a;
    b.hips.rotation.z = 0.06 * Math.sin(u * 40) * a;
    return;
  }
  if (move === 'ko') {
    // the legs buckle, he rolls onto his side, the head drops last
    const buckle = seg(u, 0, 0.35), roll = seg(u, 0.25, 0.75), drop = seg(u, 0.6, 1);
    for (const k of ['fl', 'fr', 'bl', 'br']) { b[k + '_upper'].rotation.x = (k[0] === 'f' ? 0.04 : -0.04) * buckle; b[k + '_lower'].rotation.x = (k[0] === 'f' ? -0.08 : 0.08) * buckle; }
    B.body.position.y = -0.25 * buckle + 0.1 * roll; B.body.rotation.z = 1.45 * roll; B.body.position.x = -0.55 * roll;
     b.jaw.rotation.x = 0.05 + 0.25 * drop;
    b.tail.rotation.y = 0;
    return;
  }
}

