// Moves for a frog or toad (the foe kit, November 20, a first pass), by bone name: hips, chest, head, jaw, r_/l_ arm,
// forearm, hand, thigh, shin, foot. It squats and breathes (the throat), hops, lunges with the jaw, flinches, flops.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
export const MOVES = [['idle', 'Squat'], ['walk', 'Hop'], ['bite', 'Lunge'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { bite: 1.1, hurt: 0.9, ko: 1.8 };
export const LUNGE = 'bite';
function reset(B) { for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); } B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0); }
function hop(B, b, h) {
  for (const s of ['l', 'r']) { b[s + '_thigh'].rotation.x = 0.9 * h; b[s + '_shin'].rotation.x = -1.2 * h; b[s + '_foot'].rotation.x = 0.6 * h; b[s + '_arm'].rotation.x = -0.6 * h; }
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 3);
  b.jaw.rotation.x = 0.02 + 0.02 * br; b.chest.rotation.x = -0.02 * br;     // breathing (bones turn, never scale)
  if (move === 'idle') return;
  if (move === 'walk') { const ph = (step / (2 * Math.PI)) % 1, air = bump(ph); hop(B, b, air); B.body.position.y = 0.2 * air * (B.height || 1); B.body.position.z = 0.1 * air; return; }
  if (move === 'bite') {
    const crouch = seg(u, 0, 0.3) * (1 - seg(u, 0.3, 0.4)), go = bump((u - 0.3) / 0.5);
    hop(B, b, go); B.body.position.z = 0.4 * go; B.body.position.y = -0.05 * crouch + 0.1 * go; b.jaw.rotation.x = 0.8 * go; b.head.rotation.x = -0.2 * go; return;
  }
  if (move === 'hurt') { const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)); b.chest.rotation.x = -0.3 * a; b.head.rotation.x = -0.3 * a; B.body.position.z = -0.1 * a; return; }
  if (move === 'ko') { const a = ease(u); B.body.rotation.z = 1.6 * a; for (const s of ['l', 'r']) b[s + '_thigh'].rotation.x = -0.5 * a; b.jaw.rotation.x = 0.4 * a; }
}
