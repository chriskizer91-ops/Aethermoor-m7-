// Moves for a leech (the foe kit, November 23: the mire-leech), posed by bone name: base (the root: its foot on the
// ground), tail1, tail0 behind, neck0..neck3 rising ahead, head (the sucker). Bones only turn; the root may move.
// Its game moves: latch, drink, sink. Pure poses of u (0..1 through the move) and t (the clock).
// three.js: rotation.x positive tips forward (toward z), y turns, z rolls.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };
const NECK = ['neck0', 'neck1', 'neck2', 'neck3'];

export const MOVES = [['idle', 'Sway'], ['walk', 'Crawl'], ['latch', 'Latch On'], ['drink', 'Drink'], ['sink', 'Sink'],
  ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { latch: 1.2, drink: 2.0, sink: 1.8, hurt: 0.8, ko: 1.8 };
export const LUNGE = 'latch';
export const ALIAS = { bite: 'latch', strike: 'latch', swipe: 'latch', cast: 'drink', roar: 'drink' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), H = B.height || 0.45;
  const neck = (x, y = 0, z = 0) => NECK.forEach((n, i) => { const f = i ? 1 : 0.5; b[n].rotation.x += x * (i ? 0.6 + 0.2 * i : 0.4); b[n].rotation.y += y * f; b[n].rotation.z += z * f; });   // neck0, by the wide foot, bends least
  // it sways, patient, the neck weaving and the sucker searching; the tail stirs
  neck(0.02 * Math.sin(t * 1.1), 0.07 * Math.sin(t * 0.7), 0.03 * Math.sin(t * 0.9));
  b.head.rotation.x = 0.04 * Math.sin(t * 1.3); b.head.rotation.y = 0.07 * Math.sin(t * 0.5);
  b.tail1.rotation.y = 0.03 * Math.sin(t * 0.8); b.tail0.rotation.y = 0.05 * Math.sin(t * 0.8 - 0.7);
  if (move === 'idle') return;
  if (move === 'walk') {
    // it crawls: the neck reaches and the tail draws up behind, the body sliding on its foot
    const s = Math.sin(step);
    neck(0.05 * s); b.head.rotation.x += -0.06 * s;
    b.base.rotation.y = 0.04 * s; b.base.position.z = b.base.userData.p0.z + 0.03 * H * s;
    return;
  }
  if (move === 'latch') {
    // it draws back, comes up out of the water at you, and fastens on
    const back = seg(u, 0, 0.3) * (1 - seg(u, 0.32, 0.45)), go = seg(u, 0.35, 0.5) * (1 - seg(u, 0.8, 1));
    neck(-0.08 * back + 0.12 * go); b.head.rotation.x += 0.12 * back + 0.12 * go;
    b.base.position.z = b.base.userData.p0.z + 0.35 * H * go;
    return;
  }
  if (move === 'drink') {
    // fastened on, it drinks: the neck pumps in slow swallows, the tail curling with each
    const on = seg(u, 0, 0.2) * (1 - seg(u, 0.85, 1)), gulp = on * (0.5 + 0.5 * Math.sin(u * 22));
    neck(0.09 * on + 0.025 * gulp); b.head.rotation.x += 0.14 * on - 0.06 * gulp;
    b.base.position.z = b.base.userData.p0.z + 0.3 * H * on;
    return;
  }
  if (move === 'sink') {
    // it lets go, lies down, and sinks back into the black water
    const lie = seg(u, 0, 0.4), down = seg(u, 0.35, 1);
    neck(0.1 * lie); b.head.rotation.x += 0.12 * lie;
    b.base.position.y = b.base.userData.p0.y - 0.9 * H * down;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    neck(-0.07 * a, 0, 0.04 * Math.sin(u * 30) * a); b.head.rotation.x += -0.08 * a;
    b.base.position.z = b.base.userData.p0.z - 0.1 * H * a;
    return;
  }
  if (move === 'ko') {
    // it flops over onto its side and lies still
    const k = seg(u, 0, 0.6);
    neck(0.1 * k); b.head.rotation.x += 0.12 * k;
    b.base.rotation.z = 1.2 * seg(u, 0.2, 0.8); b.base.position.y = b.base.userData.p0.y + 0.05 * H * bump(u * 1.3);
  }
}
