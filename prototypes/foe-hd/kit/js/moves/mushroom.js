// Moves for a walking mushroom (the foe kit, November 20: the glowcap), by bone name: hips, body, head (face and cap),
// r_/l_ arm, r_/l_ thigh, foot. It bobs with its cap wobbling, waddles, shakes out a puff of spores (its attack),
// flinches and topples. Pure poses of u (0..1) and t (the clock).
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
export const MOVES = [['idle', 'Bob'], ['walk', 'Waddle'], ['spores', 'Spores'], ['bump', 'Headbutt'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { spores: 1.6, bump: 1.0, hurt: 0.8, ko: 1.8 };
export const LUNGE = 'bump';
function reset(B) { for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); } B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0); }
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 2.2);
  b.body.rotation.x = 0.015 * br;     // breathing: a slow nod (bones turn, never scale)
  b.head.rotation.z = 0.05 * Math.sin(t * 1.3); b.head.rotation.x = 0.03 * Math.sin(t * 1.7);
  b.r_arm.rotation.z = -0.1 - 0.05 * br; b.l_arm.rotation.z = 0.1 + 0.05 * br;
  if (move === 'idle') return;
  if (move === 'walk') {
    const s = Math.sin(step);
    b.l_thigh.rotation.x = -0.45 * s; b.r_thigh.rotation.x = 0.45 * s;
    b.hips.rotation.z = 0.1 * s; b.head.rotation.z += -0.12 * s; B.body.position.y = 0.012 * Math.abs(Math.cos(step));
    b.r_arm.rotation.x = 0.3 * s; b.l_arm.rotation.x = -0.3 * s;
    return;
  }
  if (move === 'spores') {
    // it squats, then shakes its cap hard (the spores fly), arms out
    const sq = seg(u, 0, 0.25), shake = seg(u, 0.25, 0.35) * (1 - seg(u, 0.75, 0.9)), back = 1 - seg(u, 0.8, 1);
    B.body.position.y = -0.03 * sq * back; b.body.rotation.x = 0.18 * sq * back;     // it ducks into the bump (no squash: bones never scale)
    b.head.rotation.z += 0.25 * Math.sin(u * 60) * shake; b.head.rotation.x += -0.2 * shake;
    b.r_arm.rotation.z = -0.1 - 0.9 * shake; b.l_arm.rotation.z = 0.1 + 0.9 * shake;
    return;
  }
  if (move === 'bump') {
    const crouch = seg(u, 0, 0.3) * (1 - seg(u, 0.3, 0.4)), go = bump((u - 0.3) / 0.5);
    b.l_thigh.rotation.x = b.r_thigh.rotation.x = -0.4 * crouch;
    B.body.position.y = -0.03 * crouch + 0.06 * go; B.body.position.z = 0.2 * go; b.head.rotation.x = 0.5 * go;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    b.body.rotation.x = -0.25 * a; b.head.rotation.x = -0.35 * a; B.body.position.z = -0.06 * a;
    b.r_arm.rotation.z = -0.6 * a; b.l_arm.rotation.z = 0.6 * a;
    return;
  }
  if (move === 'ko') {
    const give = seg(u, 0, 0.35), over = seg(u, 0.3, 0.85);
    B.body.position.y = -0.05 * give; B.body.rotation.x = -1.45 * over; b.head.rotation.x = 0.3 * over;
    b.r_arm.rotation.z = -1.0 * over; b.l_arm.rotation.z = 1.0 * over;
  }
}
