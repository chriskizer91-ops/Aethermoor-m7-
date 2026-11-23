// Moves for a heap of stones that stood up (the foe kit, November 23: the rockling), posed by bone name: hips (the
// root), body, head, r_arm / l_arm (a shoulder stone, an upper stone and a fist, all one bone), r_leg / l_leg (a foot
// stone). Every stone moves whole with its part, so nothing stretches; the root may move and turn (it rolls).
// Pure poses of u (0..1 through the move) and t (the clock). three.js: x to its left, y up, z forward.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };

export const MOVES = [['idle', 'Stand'], ['walk', 'Trudge'], ['slam', 'Slam'], ['roll', 'Roll In'], ['hunker', 'Hunker'],
  ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { slam: 1.2, roll: 1.6, hunker: 1.6, hurt: 0.8, ko: 1.8 };
export const LUNGE = 'slam';
export const ALIAS = { strike: 'slam', bite: 'slam', swipe: 'slam', 'roll-in': 'roll', cast: 'hunker', roar: 'hunker' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
// turn the root about a point c above it (rolling about its middle, tipping over at its edge): x, z the turn,
// (cy, cz) where the point is from the root's rest, (dy, dz) moved on
function pivot(h, rx, rz, cy, cz, dy = 0, dz = 0, cx = 0) {
  h.rotation.x = rx; h.rotation.z = rz;
  const p = h.userData.p0;
  // three's Euler order XYZ turns a point by Rz first, then Ry, then Rx
  const x1 = cx * Math.cos(rz) - cy * Math.sin(rz), y1 = cx * Math.sin(rz) + cy * Math.cos(rz);
  const y2 = y1 * Math.cos(rx) - cz * Math.sin(rx), z = y1 * Math.sin(rx) + cz * Math.cos(rx), x2 = x1;
  h.position.set(p.x + cx - x2, p.y + cy - y2 + dy, p.z + cz - z + dz);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), H = B.height || 0.6, br = Math.sin(t * 1.2);
  // it settles: the body grinds a little on the hips, the head turns, the fists hang
  b.body.rotation.x = 0.015 * br; b.head.rotation.y = 0.12 * Math.sin(t * 0.45); b.head.rotation.x = 0.02 * br;
  b.r_arm.rotation.x = 0.03 * Math.sin(t * 1.2 + 1); b.l_arm.rotation.x = 0.03 * Math.sin(t * 1.2 + 2.2);
  if (move === 'idle') return;
  if (move === 'walk') {
    // a heavy trudge: it rocks onto each foot, swings the other forward, fists swinging against the feet
    const s = Math.sin(step), c = Math.cos(step);
    pivot(b.hips, 0.03, 0.07 * s, 0, 0, 0.012 * H * Math.abs(c));
    b.r_leg.rotation.x = -0.35 * s; b.l_leg.rotation.x = 0.35 * s;
    b.r_leg.rotation.z = -0.06 * Math.max(0, s); b.l_leg.rotation.z = 0.06 * Math.max(0, -s);
    b.r_arm.rotation.x = 0.3 * s; b.l_arm.rotation.x = -0.3 * s;
    b.body.rotation.y = 0.08 * s; b.head.rotation.z = -0.05 * s;
    return;
  }
  if (move === 'slam') {
    // it heaves its right fist up over its head, leaning back, and brings it down on you
    const up = seg(u, 0, 0.4) * (1 - seg(u, 0.42, 0.55)), down = seg(u, 0.42, 0.56) * (1 - seg(u, 0.75, 1));
    b.r_arm.rotation.x = -2.5 * up - 1.1 * down; b.r_arm.rotation.z = 0.25 * up;
    b.l_arm.rotation.x = 0.25 * up - 0.3 * down; b.l_arm.rotation.z = 0.15 * up;
    b.body.rotation.x += -0.18 * up + 0.32 * down; b.body.rotation.y = 0.2 * up - 0.15 * down;
    b.head.rotation.x += -0.1 * up + 0.12 * down;
    pivot(b.hips, -0.05 * up + 0.08 * down, 0, 0, 0, 0, 0.12 * H * down);
    b.r_leg.rotation.x = 0.05 * up - 0.08 * down; b.l_leg.rotation.x = 0.05 * up - 0.08 * down;
    return;
  }
  if (move === 'roll') {
    // it tucks into a boulder, rolls into you once over, and stands up again
    const tuck = seg(u, 0, 0.2) * (1 - seg(u, 0.82, 1)), roll = seg(u, 0.18, 0.78), lift = bump((u - 0.18) / 0.6);
    b.head.rotation.x = 0.35 * tuck; b.body.rotation.x += 0.25 * tuck;
    b.r_arm.rotation.x = -0.6 * tuck; b.l_arm.rotation.x = -0.6 * tuck;
    b.r_arm.rotation.z = -0.25 * tuck; b.l_arm.rotation.z = 0.25 * tuck;            // fists in front, hugged in
    b.r_leg.rotation.x = 0.5 * tuck; b.l_leg.rotation.x = 0.5 * tuck;                  // feet drawn up behind
    const p0 = b.hips.userData.p0.y;
    pivot(b.hips, roll * 2 * Math.PI, 0, 0.3 * H - p0, 0, 0.06 * H * lift, 0.9 * H * bump(u * 1.0) * (1 - 0.4 * seg(u, 0.7, 1)));
    return;
  }
  if (move === 'hunker') {
    // it settles into the scree: sinks, draws its head down, fists in, feet out (Guarding)
    const k = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1));
    pivot(b.hips, 0.04 * k, 0, 0, 0, -0.03 * H * k);
    b.head.rotation.x += 0.3 * k; b.body.rotation.x += 0.08 * k;
    b.r_arm.rotation.z = 0.22 * k; b.l_arm.rotation.z = -0.22 * k; b.r_arm.rotation.x = -0.25 * k; b.l_arm.rotation.x = -0.25 * k;
    b.r_leg.rotation.z = -0.25 * k; b.l_leg.rotation.z = 0.25 * k;
    b.body.rotation.z = 0.02 * Math.sin(u * 40) * k;                                   // a grinding shiver
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    pivot(b.hips, -0.12 * a, 0, 0, 0, 0, -0.06 * H * a);
    b.head.rotation.x += -0.25 * a; b.head.rotation.z = 0.08 * Math.sin(u * 30) * a;
    b.r_arm.rotation.x = 0.3 * a; b.l_arm.rotation.x = 0.3 * a; b.r_arm.rotation.z = -0.2 * a; b.l_arm.rotation.z = 0.2 * a;
    return;
  }
  if (move === 'ko') {
    // it topples back over its heels and lands in a heap, the head rolling forward off its shoulders
    const k = seg(u, 0.05, 0.6), land = seg(u, 0.55, 0.75);
    pivot(b.hips, -1.35 * k, 0, 0, -0.1 * H, -0.04 * H * land);
    b.head.rotation.x = 0.6 * k + 0.2 * land; b.head.rotation.z = 0.3 * land;
    b.r_arm.rotation.z = -0.9 * k; b.l_arm.rotation.z = 0.9 * k; b.r_arm.rotation.x = -0.5 * k; b.l_arm.rotation.x = -0.4 * k;
    b.r_leg.rotation.x = -0.5 * k; b.l_leg.rotation.x = -0.3 * k;
  }
}
