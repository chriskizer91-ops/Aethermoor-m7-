// Moves for a fish swimming just above the ground (the foe kit, November 23: the blackwater-gar and Old Jaws), posed
// by bone name: body (the root), head, jaw, t0..t2 (the tail, its fan on t2), r_fin, l_fin, and ground (a root: the
// ripple under it, staying put). Bones only turn; the roots may move. Their game moves: bite, leap, dive, death-roll,
// the-tooth. Pure poses of u (0..1 through the move) and t (the clock). three.js: x to its left, y up, z forward;
// rotation.y turns it left and right (a fish's tail beats in y), rotation.z rolls it about its length.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };

export const MOVES = [['idle', 'Hover'], ['walk', 'Swim'], ['bite', 'Bite'], ['leap', 'Leap'], ['dive', 'Dive'],
  ['death-roll', 'Death Roll'], ['the-tooth', 'The Tooth'], ['hurt', 'Hit'], ['ko', 'Belly Up']];
export const DUR = { bite: 1.0, leap: 1.6, dive: 1.8, 'death-roll': 2.0, 'the-tooth': 1.3, hurt: 0.8, ko: 2.2 };
export const LUNGE = 'bite';
export const ALIAS = { strike: 'bite', swipe: 'bite', cast: 'leap', roar: 'leap' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), L = (B.height || 0.55) * 2.4;     // its length
  const at = (x, y, z) => { const p = b.body.userData.p0; b.body.position.set(p.x + x, p.y + y, p.z + z); };
  const tail = (a, ph) => { b.t0.rotation.y = a * 0.5 * Math.sin(ph); b.t1.rotation.y = a * 0.8 * Math.sin(ph - 0.9); b.t2.rotation.y = a * Math.sin(ph - 1.8); b.body.rotation.y = -a * 0.25 * Math.sin(ph + 0.6); };
  const fins = (a, ph) => { b.r_fin.rotation.z = a * Math.sin(ph); b.l_fin.rotation.z = -a * Math.sin(ph); };
  // it holds still in the water: the tail barely moving, the fins sculling, a slow bob
  tail(0.06, t * 2.2); fins(0.12, t * 3.1); at(0, 0.012 * L * Math.sin(t * 1.3), 0); b.jaw.rotation.x = 0.015 + 0.01 * Math.sin(t * 0.9);
  if (move === 'idle') return;
  if (move === 'walk') { tail(0.18, step * 2); fins(0.2, step * 2); return; }
  if (move === 'bite') {
    // still, then a burst: it strikes sideways-on with its jaws wide and snaps them shut
    const go = seg(u, 0.15, 0.4) * (1 - seg(u, 0.6, 1)), open = seg(u, 0.1, 0.35) * (1 - seg(u, 0.4, 0.46));
    tail(0.08 + 0.18 * bump((u - 0.1) / 0.3), u * 30); at(0, 0, 0.35 * L * go);
    b.jaw.rotation.x = 0.015 + 0.38 * open; b.head.rotation.x = -0.05 * open; b.head.rotation.y = 0.08 * go;
    return;
  }
  if (move === 'leap') {
    // it leaps out of the water at you, nose up, over, and down again
    const k = seg(u, 0.1, 0.9), arc = bump(k);
    at(0, 0.55 * L * arc, 0.45 * L * k * (1 - seg(u, 0.85, 1)));
    b.body.rotation.x = -0.6 * Math.cos(k * Math.PI) * arc; tail(0.2 * arc, u * 25);
    b.jaw.rotation.x = 0.015 + 0.3 * bump((k - 0.35) / 0.3);
    return;
  }
  if (move === 'dive') {
    // it noses down and goes under, out of sight, and comes back up
    const down = seg(u, 0, 0.45) * (1 - seg(u, 0.6, 1));
    b.body.rotation.x = 0.4 * bump(u * 1.1) * (1 - seg(u, 0.5, 0.7)); at(0, -1.0 * L * down, 0.1 * L * down);
    tail(0.2, u * 25);
    return;
  }
  if (move === 'death-roll') {
    // it takes you in its jaws and rolls, twice round, charging
    const bite = seg(u, 0, 0.2), roll = seg(u, 0.2, 0.85), back = 1 - seg(u, 0.85, 1);
    at(0, -0.05 * L * roll * back, 0.3 * L * bite * back);
    b.body.rotation.z = roll * Math.PI * 4 * back; b.jaw.rotation.x = 0.015 + 0.3 * bite * (1 - seg(u, 0.2, 0.28));
    tail(0.15 * roll * back, u * 30);
    return;
  }
  if (move === 'the-tooth') {
    // it drives in with the great hooked tooth and wrenches its head side to side
    const go = seg(u, 0, 0.3) * (1 - seg(u, 0.75, 1)), wrench = Math.sin(u * 28) * go * seg(u, 0.3, 0.4);
    at(0, -0.03 * L * go, 0.35 * L * go); b.head.rotation.x = 0.06 * go; b.head.rotation.y = 0.08 * wrench;
    b.body.rotation.y = -0.1 * wrench; tail(0.2 * go, u * 30);
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    at(0, 0.03 * L * a, -0.12 * L * a); b.body.rotation.z = 0.35 * Math.sin(u * 25) * a; tail(0.25 * a, u * 40);
    return;
  }
  if (move === 'ko') {
    // it rolls belly up and drifts down to the ground
    const k = seg(u, 0, 0.6), down = seg(u, 0.3, 1);
    b.body.rotation.z = Math.PI * k; at(0, -0.45 * L * down * 0.5, 0); tail(0.05 * (1 - k), u * 10);
  }
}
