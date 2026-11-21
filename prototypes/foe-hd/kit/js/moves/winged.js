// Moves for a winged beast (the foe kit, November 20, a first pass), by bone name: body, neck, head, jaw?, tail?,
// r_/l_ wing1, wing2, wing3, thigh, shin, foot. It hovers flapping (rotation.z raises a wing), dives, flinches, falls.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
export const MOVES = [['idle', 'Hover'], ['walk', 'Fly'], ['dive', 'Dive'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { dive: 1.2, hurt: 0.9, ko: 2.0 };
export const LUNGE = 'dive';
function reset(B) { for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); } B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0); }
function flap(b, a, fold = 0) {
  // three.js +x is his left: his right wing (r_) rises with negative z
  b.r_wing1.rotation.z = -a; b.l_wing1.rotation.z = a;
  b.r_wing2.rotation.z = -a * 0.5 - fold; b.l_wing2.rotation.z = a * 0.5 + fold;
  b.r_wing3.rotation.z = -a * 0.3 - fold; b.l_wing3.rotation.z = a * 0.3 + fold;
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), h = B.height || 1;
  const rate = move === 'walk' ? 9 : 6, s = Math.sin(t * rate);
  flap(b, 0.7 * s); B.body.position.y = h * (0.25 + 0.04 * Math.cos(t * rate)); b.tail.rotation.x = 0.1 * s;
  for (const sd of ['l', 'r']) { b[sd + '_thigh'].rotation.x = 0.6; b[sd + '_shin'].rotation.x = -0.9; }
  if (move === 'idle' || move === 'walk') { if (move === 'walk') b.body.rotation.x = 0.25; return; }
  if (move === 'dive') {
    const up = seg(u, 0, 0.3), down = seg(u, 0.3, 0.55), back = 1 - seg(u, 0.7, 1);
    flap(b, (0.9 * up - 1.2 * down) * back + 0.3 * s * (1 - down), 0.5 * down * back);
    B.body.position.y += h * (0.2 * up - 0.3 * down) * back; B.body.position.z = 0.6 * h * down * back; b.body.rotation.x = 0.6 * down * back;
    b.jaw.rotation.x = 0.6 * down * back; for (const sd of ['l', 'r']) b[sd + '_thigh'].rotation.x = 0.6 - 1.2 * down * back; return;
  }
  if (move === 'hurt') { const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)); b.body.rotation.x = -0.4 * a; flap(b, 1.0 * a); return; }
  if (move === 'ko') { const a = ease(u); flap(b, 0.2 * (1 - a), 0.8 * a); B.body.position.y = h * 0.25 * (1 - a); B.body.rotation.z = 1.4 * a; }
}
