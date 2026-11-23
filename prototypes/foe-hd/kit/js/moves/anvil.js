// Moves for a walking anvil (the foe kit, November 23: Mother Anvil), posed by bone name: body (the root), arm (the
// hinged arm on her top) and hammer (from its collar), and four legs, fr_/fl_/br_/bl_ thigh and shin. Every plate
// moves whole with its part, so nothing stretches; the root may move and turn (she rears up on her hind legs).
// Her own moves by name (the game's ids): hammerfall, sparks, temper, steam-burst, anvil-strike, bellows, heart-flare,
// worldforge-blow. Pure poses of u (0..1 through the move) and t (the clock). three.js: x to her left, y up, z forward.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };
const LEGS = ['fr', 'fl', 'br', 'bl'];

export const MOVES = [['idle', 'Stand'], ['walk', 'Stomp'], ['hammerfall', 'Hammerfall'], ['anvil-strike', 'Anvil Strike'],
  ['worldforge-blow', 'Worldforge Blow'], ['sparks', 'Sparks'], ['steam-burst', 'Steam Burst'], ['temper', 'Temper'],
  ['heart-flare', 'Heart Flare'], ['bellows', 'Bellows'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { hammerfall: 1.5, 'anvil-strike': 1.3, 'worldforge-blow': 2.2, sparks: 1.4, 'steam-burst': 1.8,
  temper: 1.6, 'heart-flare': 1.5, bellows: 1.8, hurt: 0.8, ko: 2.2 };
export const LUNGE = 'hammerfall';
export const ALIAS = { strike: 'anvil-strike', bite: 'hammerfall', swipe: 'anvil-strike', slam: 'hammerfall', cast: 'bellows',
  roar: 'heart-flare' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
// turn the root by rx (about x) about a point (0, cy, cz) from its rest, then move it by (dy, dz)
function pivot(h, rx, cy, cz, dy = 0, dz = 0) {
  h.rotation.x = rx;
  const p = h.userData.p0, y = cy * Math.cos(rx) - cz * Math.sin(rx), z = cy * Math.sin(rx) + cz * Math.cos(rx);
  h.position.set(p.x, p.y + cy - y + dy, p.z + cz - z + dz);
}
// bend every leg by a at the knee (feet stay near where they were), the body coming down to match
function crouch(b, a, which = LEGS) {
  for (const k of which) { b[`${k}_thigh`].rotation.x += a; b[`${k}_shin`].rotation.x += -2 * a; }
  return 0.45 * (1 - Math.cos(a));
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), H = (B.height || 1.6) / 1.6, br = Math.sin(t * 0.9);
  const shake = (k, f = 60) => 0.012 * Math.sin(u * f) * k;
  // she breathes like a forge: a slow heave on her knees; the hammer-arm sways a little
  let down = crouch(b, 0.04 + 0.03 * br);
  b.arm.rotation.x = 0.04 * Math.sin(t * 0.6); b.hammer.rotation.x = 0.06 * Math.sin(t * 0.6 + 0.8);
  const root = (rx = 0, cy = 0, cz = 0, dy = 0, dz = 0) => pivot(b.body, rx, cy, cz, dy - down * H, dz);
  if (move === 'idle') { root(); return; }
  if (move === 'walk') {
    // a heavy stomp: the legs go in diagonal pairs, the body rocking with them
    const s = Math.sin(step), lift = (x) => Math.max(0, x);
    for (const [k, sg] of [['fr', 1], ['bl', 1], ['fl', -1], ['br', -1]]) {
      b[`${k}_thigh`].rotation.x += -0.3 * sg * s - 0.25 * lift(sg * Math.cos(step));
      b[`${k}_shin`].rotation.x += 0.45 * lift(sg * Math.cos(step));
    }
    b.body.rotation.z = 0.03 * s; root(0, 0, 0, 0.015 * Math.abs(Math.cos(step)));
    b.arm.rotation.x += 0.08 * s; b.hammer.rotation.x += 0.1 * s;
    b.body.rotation.z = 0.03 * s;
    return;
  }
  if (move === 'hammerfall') {
    // she rears up on her hind legs and comes down on you
    const rear = seg(u, 0, 0.4) * (1 - seg(u, 0.45, 0.58)), fall = seg(u, 0.48, 0.6) * (1 - seg(u, 0.8, 1));
    root(-0.42 * rear + 0.06 * fall, -0.45, -0.36, 0, 0.35 * fall);
    for (const k of ['fr', 'fl']) { b[`${k}_thigh`].rotation.x += -0.5 * rear; b[`${k}_shin`].rotation.x += 0.6 * rear; }
    down = crouch(b, 0.12 * fall, ['br', 'bl']);
    b.arm.rotation.x += -0.3 * rear + 0.4 * fall; b.hammer.rotation.x += -0.3 * rear + 0.3 * fall;
    b.body.rotation.z = shake(fall);
    return;
  }
  if (move === 'anvil-strike' || move === 'worldforge-blow') {
    // the hammer goes back (as high as the forge roof, charging, for the Worldforge Blow), and comes down before her
    const big = move === 'worldforge-blow';
    const a = big ? 0.55 : 0.35, up = seg(u, 0, a) * (1 - seg(u, a + 0.05, a + 0.14)), hit = seg(u, a + 0.06, a + 0.15) * (1 - seg(u, 0.8, 1));
    b.arm.rotation.x += (big ? -1.0 : -0.6) * up + 1.0 * hit; b.hammer.rotation.x += (big ? -1.1 : -0.7) * up + 1.15 * hit;
    if (big) b.arm.rotation.z = 0.05 * Math.sin(u * 50) * up;                              // straining
    down = crouch(b, (big ? 0.12 : 0.06) * up + 0.15 * hit);
    root(-(big ? 0.12 : 0.06) * up + 0.1 * hit, 0, 0, 0, 0.12 * hit);
    for (const k of ['br', 'bl']) b[`${k}_thigh`].rotation.x += -0.1 * hit;
    b.body.rotation.z = shake(hit);
    return;
  }
  if (move === 'sparks') {
    // she swings the hammer over onto her own back, twice, and the sparks fly
    const over = seg(u, 0, 0.25) * (1 - seg(u, 0.85, 1)), tap = bump((u - 0.3) / 0.22) + bump((u - 0.55) / 0.22);
    b.arm.rotation.x += -1.0 * over; b.hammer.rotation.x += -1.0 * over - 0.45 * tap;
    down = crouch(b, 0.05 * tap); root(0.04 * tap); b.body.rotation.z = shake(tap, 80);
    return;
  }
  if (move === 'steam-burst') {
    // she plunges her hammer-arm down beside her into the quench, crouching, and heaves up out of the steam
    const plunge = seg(u, 0, 0.3) * (1 - seg(u, 0.6, 0.85)), heave = bump((u - 0.55) / 0.35);
    b.arm.rotation.z = -1.0 * plunge; b.arm.rotation.x += 0.3 * plunge; b.hammer.rotation.x += 0.6 * plunge;
    down = crouch(b, 0.3 * plunge - 0.05 * heave);
    root(0, 0, 0, 0.04 * heave); b.body.rotation.z = 0.06 * plunge;
    return;
  }
  if (move === 'temper' || move === 'heart-flare') {
    // her heart flares: she braces down, shudders, and stands tall (Temper holds it; Heart Flare throws it out)
    const flare = move === 'heart-flare';
    const brace = seg(u, 0, 0.3) * (1 - seg(u, 0.45, 0.6)), tall = seg(u, 0.45, 0.6) * (1 - seg(u, 0.85, 1));
    down = crouch(b, 0.25 * brace - 0.04 * tall);
    root(-(flare ? 0.12 : 0.05) * tall, -0.45, -0.36, 0.02 * tall);
    b.body.rotation.z = shake(brace + tall, flare ? 90 : 50);
    b.arm.rotation.x += -0.4 * tall; b.hammer.rotation.x += -0.3 * tall;
    return;
  }
  if (move === 'bellows') {
    // she bows to the fire-pit, breathes out like a great bellows, and rises: something climbs out
    const bow = seg(u, 0, 0.35) * (1 - seg(u, 0.7, 1)), breath = bump((u - 0.3) / 0.45);
    for (const k of ['fr', 'fl']) { b[`${k}_thigh`].rotation.x += 0.3 * bow; b[`${k}_shin`].rotation.x += -0.6 * bow; }
    root(0.14 * bow, 0, 0, -0.03 * bow + 0.02 * breath); b.arm.rotation.x += 0.35 * bow; b.hammer.rotation.x += 0.4 * bow;
    b.body.rotation.z = shake(breath, 30);
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    root(-0.08 * a, -0.45, -0.36, 0, -0.05 * a); b.arm.rotation.x += -0.3 * a; b.hammer.rotation.x += -0.35 * a;
    b.body.rotation.z = shake(a, 40) * 2;
    return;
  }
  if (move === 'ko') {
    // her legs give way and she settles to the floor, the hammer-arm falling forward over her horn
    const k = seg(u, 0, 0.7), tip = seg(u, 0.4, 0.9);
    for (const l of LEGS) {
      const sx = l[1] === 'r' ? -1 : 1;
      b[`${l}_thigh`].rotation.z += sx * 0.9 * k; b[`${l}_shin`].rotation.z += -sx * 0.6 * k;
    }
    down = 0; root(0.06 * tip, 0, 0, -0.3 * k);
    b.body.rotation.z = 0.08 * tip; b.arm.rotation.x += 0.8 * tip; b.hammer.rotation.x += 0.9 * tip;
  }
}
