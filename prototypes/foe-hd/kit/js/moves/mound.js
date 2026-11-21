// Moves for a heap that moves (the foe kit, November 21: the boglurcher, and any mound-shaped foe), posed by bone name:
// base (the root), body, top, and whatever grows out of the top (cattail_a, cattail_b, sprout; any others named in
// GROWTHS sway the same way). A heap has no limbs: it leans, heaves, rears and falls with its whole body (the base is
// the root, so that never stretches), bends a little at the middle and the top, and sinks into the ground (the whole
// body may move). Pure poses of u (0..1 through the move) and t (the clock).
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
const GROWTHS = ['cattail_a', 'cattail_b', 'sprout'];

export const MOVES = [['idle', 'Lurk'], ['walk', 'Ooze'], ['slam', 'Slam'], ['grab', 'Mire Grab'], ['sink', 'Drag Under'],
  ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { slam: 1.2, grab: 1.3, sink: 2.0, hurt: 0.8, ko: 2.2 };
export const LUNGE = 'slam';
export const ALIAS = { strike: 'slam', bite: 'grab', swipe: 'grab', cast: 'sink', roar: 'sink' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
// what grows out of the top trails the heap's motion, a little behind, and sways on its own
function growths(b, t, lagX = 0, lagZ = 0) {
  GROWTHS.forEach((n, i) => {
    b[n].rotation.x = 0.06 * Math.sin(t * 1.1 + i * 1.7) - lagX;
    b[n].rotation.z = 0.08 * Math.sin(t * 1.4 + i * 2.3) - lagZ;
  });
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 1.3);
  b.body.rotation.x = 0.012 * br; b.top.rotation.x = 0.015 * br;          // it breathes: a slow heave (bones turn)
  b.top.rotation.z = 0.02 * Math.sin(t * 0.5);
  if (move === 'idle') { growths(b, t); return; }
  if (move === 'walk') {
    // an ooze: the heap rocks forward and back as it slides, the top lagging behind
    const s = Math.sin(step);
    b.base.rotation.x = 0.07 * s; b.base.rotation.z = 0.035 * Math.sin(step * 0.5);
    b.top.rotation.x += -0.04 * s; B.body.position.y = 0.015 * Math.abs(s);
    growths(b, t, 0.2 * s);
    return;
  }
  if (move === 'slam') {
    // it rears back, then falls forward onto you, and settles
    const rear = seg(u, 0, 0.35) * (1 - seg(u, 0.35, 0.5)), fall = seg(u, 0.38, 0.52) * (1 - seg(u, 0.72, 1));
    b.base.rotation.x = -0.2 * rear + 0.38 * fall;
    b.body.rotation.x += -0.05 * rear + 0.07 * fall; b.top.rotation.x += -0.06 * rear + 0.08 * fall;
    B.body.position.y = 0.05 * rear; B.body.position.z = 0.18 * fall;
    growths(b, t, -0.35 * rear + 0.5 * fall);
    return;
  }
  if (move === 'grab') {
    // it surges forward low along the ground (the mud-hands at your ankles), and draws back
    const go = seg(u, 0, 0.35) * (1 - seg(u, 0.65, 1)), tug = bump((u - 0.4) / 0.3);
    b.base.rotation.x = 0.16 * go - 0.06 * tug; B.body.position.z = 0.32 * go - 0.08 * tug;
    b.body.rotation.x += 0.05 * go; b.top.rotation.x += -0.06 * go;        // the eyes stay on you
    growths(b, t, 0.3 * go);
    return;
  }
  if (move === 'sink') {
    // it sinks into the ground, charging, then heaves up under you
    const sink = seg(u, 0, 0.4) * (1 - seg(u, 0.55, 0.7)), heave = bump((u - 0.55) / 0.35);
    B.body.position.y = -0.32 * sink + 0.06 * heave; B.body.position.z = 0.28 * heave;
    b.base.rotation.x = 0.06 * sink - 0.12 * heave + 0.25 * heave * seg(u, 0.7, 0.85);
    b.top.rotation.z += 0.03 * Math.sin(u * 50) * sink;                      // a shiver as it goes down
    growths(b, t, -0.3 * heave, 0.1 * Math.sin(u * 30) * sink);
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    b.base.rotation.x = -0.14 * a; B.body.position.z = -0.08 * a;
    b.base.rotation.z = 0.05 * Math.sin(u * 40) * a;                         // it wobbles
    growths(b, t, -0.4 * a);
    return;
  }
  if (move === 'ko') {
    // it slumps over to one side and sinks down into the marsh
    const slump = seg(u, 0, 0.5), down = seg(u, 0.35, 1);
    b.base.rotation.z = 0.4 * slump; B.body.position.x = -0.12 * slump;
    B.body.position.y = -0.3 * down;
    b.top.rotation.z += 0.03 * slump;
    growths(b, t, 0, 0.5 * slump);
  }
}
