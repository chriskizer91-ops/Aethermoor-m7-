// Moves for a sea-serpent rising out of the water (the foe kit, November 23: the Blackwater Leviathan), posed by bone
// name: base (a root, under the water), n0..n5 (his neck, from the water up), head, jaw, r_coil and l_coil (roots: his
// coils), ground (a root: the water, staying put). Bones only turn; the roots may move. His game moves by their own
// ids: coil, tail-slap, sound (he dives under), breach, swallow, undertow, harpoon-rage, pearl-light, flood.
// EVENTS: the moment in a move the Fight can hang something on (the swallow's gulp, when the jaw is widest).
// Pure poses of u (0..1 through the move) and t (the clock). three.js: x to his left, y up, z forward.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };
const N = ['n0', 'n1', 'n2', 'n3', 'n4', 'n5'];

export const MOVES = [['idle', 'Loom'], ['walk', 'Swim'], ['coil', 'Coil'], ['tail-slap', 'Tail Slap'], ['sound', 'Sound'],
  ['breach', 'Breach'], ['swallow', 'Swallow'], ['undertow', 'Undertow'], ['harpoon-rage', 'Harpoon Rage'],
  ['pearl-light', 'Pearl Light'], ['flood', 'Flood'], ['full', 'Full'], ['spit', 'Spit Out'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { coil: 1.6, 'tail-slap': 1.4, sound: 2.2, breach: 1.8, swallow: 2.4, undertow: 2.4, 'harpoon-rage': 1.8,
  'pearl-light': 2.2, flood: 2.2, spit: 1.2, hurt: 0.9, ko: 2.6 };
export const LUNGE = 'swallow';
export const ALIAS = { bite: 'swallow', strike: 'flood', swipe: 'tail-slap', cast: 'pearl-light', roar: 'harpoon-rage', dive: 'sound' };
// for the Fight: the swallow's moment (jaw widest over the hero at u 0.45; reach: metres from his root to the hero
// then, his root staying in the water); his sound takes him wholly under by itself, and his breach brings him up
export const EVENTS = { swallow: { gulp: 0.45, reach: 1.05 }, sound: { under: 0.55 }, breach: { out: 0.4 } };
export const SINKS = { sound: true, breach: true };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), H = B.height || 2.2;
  // bend the neck: x (+ forward), y (turn), z (lean), shared along it; lo..hi which part (0 low .. 1 high)
  const neck = (x, y = 0, z = 0, lo = 0, hi = 1) => N.forEach((n, i) => {
    const f = i / 5, w = f >= lo && f <= hi ? 1 : 0.3;
    b[n].rotation.x += x * w; b[n].rotation.y += y * w; b[n].rotation.z += z * w;
  });
  const lift = (bone, y, z = 0) => { const p = bone.userData.p0; bone.position.set(p.x, p.y + y, p.z + z); };
  const all = (y, z = 0) => { lift(b.base, y, z); lift(b.r_coil, y, z); lift(b.l_coil, y, z); };
  // he looms: his neck sways slow as the water, his head turns to look, his coils roll in the swell
  neck(0.012 * Math.sin(t * 0.6), 0.025 * Math.sin(t * 0.45), 0.012 * Math.sin(t * 0.5));
  b.head.rotation.y = 0.08 * Math.sin(t * 0.35); b.head.rotation.x = 0.03 * Math.sin(t * 0.7);
  b.jaw.rotation.x = 0.03 + 0.02 * Math.sin(t * 0.9);
  lift(b.r_coil, 0.025 * H * Math.sin(t * 0.8)); lift(b.l_coil, 0.025 * H * Math.sin(t * 0.8 + 2));
  if (move === 'idle') return;
  if (move === 'walk') { neck(0.03 * Math.sin(step), 0.05 * Math.sin(step * 0.5)); lift(b.r_coil, 0.05 * H * Math.sin(step)); lift(b.l_coil, 0.05 * H * Math.sin(step + Math.PI)); return; }
  if (move === 'coil') {
    // he draws his neck back into a tight S, coils heaving, ready
    const k = seg(u, 0, 0.4) * (1 - seg(u, 0.8, 1));
    neck(0.1 * k, 0, 0, 0, 0.4); neck(-0.13 * k, 0, 0, 0.6, 1); b.head.rotation.x += 0.14 * k;
    lift(b.r_coil, 0.08 * H * k); lift(b.l_coil, 0.08 * H * k); b.jaw.rotation.x += 0.15 * k;
    return;
  }
  if (move === 'tail-slap') {
    // a coil rears out of the water and slams down on you
    const up = seg(u, 0, 0.4) * (1 - seg(u, 0.45, 0.55)), slam = seg(u, 0.45, 0.55) * (1 - seg(u, 0.8, 1));
    lift(b.r_coil, 0.35 * H * up - 0.05 * H * slam, 0.25 * H * (up + slam)); b.r_coil.rotation.x = -0.5 * up + 0.4 * slam;
    neck(0, 0, 0.06 * up - 0.04 * slam); b.head.rotation.y += -0.15 * up;
    return;
  }
  if (move === 'sound') {
    // he goes under: the neck tips forward and the whole of him sinks out of sight
    const tip = seg(u, 0, 0.3), down = seg(u, 0.15, 0.6);
    neck(0.08 * tip); b.head.rotation.x += 0.15 * tip; all(-1.25 * H * down, 0.1 * H * down);
    return;
  }
  if (move === 'breach') {
    // he bursts up out of the water under you, high, and settles
    const up = seg(u, 0, 0.4), settle = seg(u, 0.5, 1);
    all(-1.25 * H * (1 - up) + 0.12 * H * bump((u - 0.3) / 0.4), 0);
    neck(-0.06 * bump((u - 0.2) / 0.5)); b.head.rotation.x += -0.13 * bump((u - 0.25) / 0.45) * (1 - settle * 0.5);
    b.jaw.rotation.x += 0.5 * bump((u - 0.3) / 0.3);
    return;
  }
  if (move === 'swallow') {
    // the neck draws back, the jaw opens wide (widest at u 0.45: the gulp), he lunges down on you, snaps shut, swallows
    const back = seg(u, 0, 0.3) * (1 - seg(u, 0.35, 0.45)), go = seg(u, 0.35, 0.5) * (1 - seg(u, 0.75, 1));
    const open = seg(u, 0.15, 0.42) * (1 - seg(u, 0.48, 0.55));
    neck(-0.07 * back + 0.13 * go, 0, 0, 0.35, 1); b.head.rotation.x += -0.12 * back + 0.14 * go;
    b.jaw.rotation.x += 0.85 * open;
    lift(b.base, 0, 0.05 * H * go);
    // the gulp goes down his neck: a swell travelling from the head to the water
    const g = seg(u, 0.6, 0.95);
    N.forEach((n, i) => { b[n].rotation.x += 0.03 * bump((g * 7 - (5 - i)) / 2); });
    return;
  }
  if (move === 'undertow') {
    // he sweeps his neck slow from side to side, his coils circling: the water drags you
    const k = seg(u, 0, 0.2) * (1 - seg(u, 0.85, 1)), w = Math.sin(u * Math.PI * 3);
    neck(0.02 * k, 0.07 * k * w, 0.03 * k * w); b.head.rotation.y += 0.12 * k * w;
    b.r_coil.rotation.y = 0.6 * k * u; b.l_coil.rotation.y = -0.6 * k * u;
    lift(b.r_coil, 0.05 * H * k * w); lift(b.l_coil, -0.05 * H * k * w);
    return;
  }
  if (move === 'harpoon-rage') {
    // the harpoon in him: he thrashes, his head flung side to side, jaw wide
    const k = seg(u, 0, 0.15) * (1 - seg(u, 0.85, 1)), w = Math.sin(u * 22);
    neck(-0.03 * k, 0.05 * k * w, 0.04 * k * Math.sin(u * 17)); b.head.rotation.y += 0.12 * k * w; b.head.rotation.z = 0.05 * k * w;
    b.jaw.rotation.x += 0.45 * k; lift(b.r_coil, 0.06 * H * k * Math.abs(w)); lift(b.l_coil, 0.06 * H * k * Math.abs(Math.sin(u * 22 + 1)));
    return;
  }
  if (move === 'pearl-light') {
    // he rises tall and still, his head up, and the pearl shines
    const k = seg(u, 0, 0.35) * (1 - seg(u, 0.85, 1));
    neck(0.05 * k, 0, 0, 0.5, 1); neck(-0.03 * k, 0, 0, 0, 0.4); b.head.rotation.x += -0.15 * k;
    all(0.06 * H * k); b.head.rotation.z = 0.02 * Math.sin(u * 40) * k;
    return;
  }
  if (move === 'flood') {
    // he rears back high and crashes down into the water before you: the wave
    const up = seg(u, 0, 0.35) * (1 - seg(u, 0.4, 0.55)), down = seg(u, 0.42, 0.58) * (1 - seg(u, 0.8, 1));
    neck(-0.08 * up + 0.16 * down, 0, 0, 0.35, 1); b.head.rotation.x += -0.12 * up + 0.15 * down; b.jaw.rotation.x += 0.4 * up;
    lift(b.base, 0.06 * H * up - 0.08 * H * down, 0.05 * H * down);
    lift(b.r_coil, 0.15 * H * up - 0.05 * H * down); lift(b.l_coil, 0.15 * H * up - 0.05 * H * down);
    return;
  }
  if (move === 'full') {
    // someone is inside him: jaw shut, he sways heavy, and a slow swallow goes down his neck, again and again
    const g = (t * 0.35) % 1;
    b.jaw.rotation.x = 0.0; b.head.rotation.x += 0.04;
    N.forEach((n, i) => { b[n].rotation.x += 0.035 * bump((g * 8 - (5 - i)) / 2); });
    return;
  }
  if (move === 'spit') {
    // his jaw flares wide and he throws you out, his neck snapping forward
    const back = seg(u, 0, 0.25) * (1 - seg(u, 0.3, 0.45)), go = seg(u, 0.3, 0.45) * (1 - seg(u, 0.7, 1));
    neck(-0.05 * back + 0.08 * go, 0, 0, 0.35, 1); b.head.rotation.x += -0.1 * back + 0.1 * go;
    b.jaw.rotation.x += 0.75 * bump((u - 0.2) / 0.45);
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    neck(-0.06 * a, 0, 0.03 * Math.sin(u * 30) * a); b.head.rotation.x += -0.12 * a; b.head.rotation.z = 0.06 * a;
    b.jaw.rotation.x += 0.3 * a;
    return;
  }
  if (move === 'ko') {
    // he topples slowly over onto his side into the water, and sinks
    const k = seg(u, 0, 0.6), down = seg(u, 0.4, 1);
    b.base.rotation.z = 1.1 * k; neck(0.03 * k, 0, 0.04 * k); b.head.rotation.x += 0.1 * k;
    all(-0.7 * H * down); lift(b.base, -0.7 * H * down, 0); b.base.position.x = b.base.userData.p0.x - 0.15 * H * k;
  }
}
