// Moves for a two-legged walker (the foe kit, November 20; a first pass for session 8 to take on), posed by bone name
// (kit/rigs/biped.py): hips, spine, chest, neck, head, jaw?, and l_/r_ upperarm, forearm, hand, thigh, shin, foot
// (r_ is his right). Bones rest unrotated with the arms hanging: rotation.x negative swings a limb forward (or lifts a
// head), z swings it out to the side (positive toward three.js +x, which is his left), y twists.
// Each move is a pure pose of u (0..1 through the move) and t (the clock).
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };

export const MOVES = [['idle', 'Stand'], ['walk', 'Walk'], ['swing', 'Swing'], ['slam', 'Slam'], ['cast', 'Cast'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { swing: 1.2, slam: 1.5, cast: 1.6, hurt: 0.9, ko: 2.0 };
export const LUNGE = 'swing';

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 1.8);
  // breathing, and arms a little out from the body
  b.chest.scale.set(1 + 0.01 * br, 1 + 0.012 * br, 1);
  b.head.rotation.y = 0.1 * Math.sin(t * 0.5);
  b.l_upperarm.rotation.z = 0.12; b.r_upperarm.rotation.z = -0.12;
  b.l_forearm.rotation.x = b.r_forearm.rotation.x = -0.25 - 0.03 * br;
  if (move === 'idle') return;
  if (move === 'walk') {
    const s = Math.sin(step), lift = (x) => Math.max(0, x);
    b.l_thigh.rotation.x = -0.45 * s; b.r_thigh.rotation.x = 0.45 * s;
    b.l_shin.rotation.x = 0.7 * lift(Math.cos(step)); b.r_shin.rotation.x = 0.7 * lift(-Math.cos(step));
    b.l_upperarm.rotation.x = 0.35 * s; b.r_upperarm.rotation.x = -0.35 * s;
    b.hips.rotation.y = 0.08 * s; b.chest.rotation.y = -0.12 * s;
    B.body.position.y = 0.03 * Math.abs(Math.cos(step));
    return;
  }
  if (move === 'swing') {
    // his right arm up and back, then down across, the body turning into it
    const wind = seg(u, 0, 0.35), cut = seg(u, 0.35, 0.55), back = 1 - seg(u, 0.7, 1);
    b.r_upperarm.rotation.x = (-2.6 * wind + 2.9 * cut) * back; b.r_upperarm.rotation.z = (-0.5 * wind + 0.4 * cut) * back;
    b.r_forearm.rotation.x = (-0.9 * wind + 0.6 * cut) * back - 0.25;
    b.chest.rotation.y = (0.45 * wind - 0.8 * cut) * back; b.spine.rotation.x = (-0.1 * wind + 0.25 * cut) * back;
    B.body.position.z = 0.15 * cut * back;
    return;
  }
  if (move === 'slam') {
    // both arms high, a rise, then down with the whole body
    const up = seg(u, 0, 0.4), down = seg(u, 0.4, 0.55), back = 1 - seg(u, 0.72, 1);
    for (const s of ['l', 'r']) { b[s + '_upperarm'].rotation.x = (-2.9 * up + 3.3 * down) * back; b[s + '_forearm'].rotation.x = (-0.6 * up + 0.3 * down) * back - 0.25; }
    b.spine.rotation.x = (-0.2 * up + 0.5 * down) * back; b.neck.rotation.x = 0.2 * down * back;
    B.body.position.y = (0.06 * bump(u / 0.45) - 0.08 * down) * back;
    b.l_thigh.rotation.x = b.r_thigh.rotation.x = -0.25 * down * back; b.l_shin.rotation.x = b.r_shin.rotation.x = 0.5 * down * back;
    return;
  }
  if (move === 'cast') {
    // both hands up and out, the head back, then thrown forward
    const raise = seg(u, 0, 0.45), throwF = seg(u, 0.5, 0.65), back = 1 - seg(u, 0.75, 1);
    for (const [s, sx] of [['l', 1], ['r', -1]]) {
      b[s + '_upperarm'].rotation.x = (-1.8 * raise + 0.6 * throwF) * back; b[s + '_upperarm'].rotation.z = sx * (0.12 + 0.5 * raise * (1 - throwF)) * back;
    }
    b.head.rotation.x = (-0.3 * raise + 0.35 * throwF) * back; b.spine.rotation.x = (-0.15 * raise + 0.2 * throwF) * back;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    b.spine.rotation.x = -0.25 * a; b.neck.rotation.x = -0.3 * a; b.head.rotation.z = 0.2 * a;
    b.l_upperarm.rotation.z = 0.12 + 0.4 * a; b.r_upperarm.rotation.z = -0.12 - 0.4 * a; B.body.position.z = -0.15 * a;
    return;
  }
  if (move === 'ko') {
    // the knees go, then over backwards
    const buckle = seg(u, 0, 0.35), fall = seg(u, 0.3, 0.85);
    b.l_thigh.rotation.x = b.r_thigh.rotation.x = -0.9 * buckle * (1 - fall);
    b.l_shin.rotation.x = b.r_shin.rotation.x = 1.4 * buckle * (1 - fall);
    B.body.position.y = -0.25 * buckle * (1 - fall);
    B.body.rotation.x = -1.45 * fall; b.head.rotation.x = 0.3 * fall;
    b.l_upperarm.rotation.z = 0.12 + 1.0 * fall; b.r_upperarm.rotation.z = -0.12 - 1.0 * fall;
  }
}
