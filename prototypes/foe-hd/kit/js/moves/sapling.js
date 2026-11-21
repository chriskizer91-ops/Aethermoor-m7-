// Moves for a little walking plant (the foe kit, November 20: the briarling, and others on the bestiary's 'sapling'
// plan), posed by bone name: hips, body, sprout, and l_/r_ thigh, shin, foot. It bobs, waddles, hops in to bite, and
// topples. Pure poses of u (0..1 through the move) and t (the clock).
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };

export const MOVES = [['idle', 'Bob'], ['walk', 'Waddle'], ['hop', 'Hop'], ['bite', 'Lunge'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { hop: 0.9, bite: 1.0, hurt: 0.8, ko: 1.8 };
export const LUNGE = 'bite';

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 2.6);
  b.hips.rotation.x = 0.02 * br;     // breathing: a slow rock (bones turn, never scale)
  b.sprout.rotation.z = 0.12 * Math.sin(t * 1.7); b.sprout.rotation.x = 0.06 * Math.sin(t * 1.3);
  if (move === 'idle') { B.body.position.y = 0.006 * Math.abs(br); return; }
  if (move === 'walk') {
    const s = Math.sin(step);
    b.l_thigh.rotation.x = -0.4 * s; b.r_thigh.rotation.x = 0.4 * s;
    b.l_shin.rotation.x = 0.3 * Math.max(0, Math.cos(step)); b.r_shin.rotation.x = 0.3 * Math.max(0, -Math.cos(step));
    b.hips.rotation.z = 0.12 * s; B.body.position.y = 0.012 * Math.abs(Math.cos(step));      // a waddle
    b.sprout.rotation.z += -0.2 * s;
    return;
  }
  if (move === 'hop' || move === 'bite') {
    // crouch, spring, (lunge forward and snap the ball shut), land
    const crouch = seg(u, 0, 0.25) * (1 - seg(u, 0.25, 0.35)), air = bump((u - 0.3) / 0.45), land = bump((u - 0.75) / 0.25);
    for (const s of ['l', 'r']) { b[s + '_thigh'].rotation.x = -0.6 * (crouch + land * 0.6); b[s + '_shin'].rotation.x = 1.1 * (crouch + land * 0.6); b[s + '_foot'].rotation.x = -0.5 * (crouch + land * 0.6); }
    B.body.position.y = -0.05 * (crouch + land * 0.5) + 0.12 * air;
    b.hips.rotation.x = 0.2 * crouch - 0.1 * air;     // it tips into the crouch (no squash: bones never scale)
    if (move === 'bite') { B.body.position.z = 0.22 * air; b.hips.rotation.x = 0.5 * air; }     // the whole of it pitches, legs and all
    b.sprout.rotation.x += -0.3 * air + 0.25 * land;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    b.hips.rotation.x = -0.35 * a; B.body.position.z = -0.06 * a;
    b.sprout.rotation.x = 0.6 * a;
    return;
  }
  if (move === 'ko') {
    // the legs give, and over it rolls
    const give = seg(u, 0, 0.4), roll = seg(u, 0.3, 0.8);
    for (const s of ['l', 'r']) { b[s + '_thigh'].rotation.x = -0.55 * give; b[s + '_shin'].rotation.x = 0.95 * give; }     // knees bend no further than the root tubes can
    B.body.position.y = -0.1 * give; B.body.rotation.z = 1.5 * roll; B.body.position.x = -0.15 * roll;
    b.sprout.rotation.z = 0.35 * roll;
  }
}
