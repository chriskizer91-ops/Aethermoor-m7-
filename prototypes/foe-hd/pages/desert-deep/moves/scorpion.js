// Moves for a scorpion (Places' desert-and-deep lane, November 21), by bone name (pages/desert-deep/py/scorpion_rig.py):
// body (root), head, tail1..tail4, sting, r_/l_ arm, fore, claw, finger, r1..r4 / l1..l4 _upper, _lower, _foot.
// Every piece is rigid on its bone, so moves only turn bones (the body may move and tip whole).
// M7's moves: Pincer, Glass Sting, Carapace (it hunkers behind its claws), and the Matriarch's Moult and Shell Rain.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
export const MOVES = [['idle', 'Wait'], ['walk', 'Walk'], ['pincer', 'Pincer'], ['sting', 'Glass Sting'], ['guard', 'Carapace'],
  ['moult', 'Moult'], ['rain', 'Shell Rain'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { pincer: 1.2, sting: 1.3, guard: 1.6, moult: 2.2, rain: 2.0, hurt: 0.9, ko: 2.2 };
export const LUNGE = 'sting';
const STING = { default: [1.7, -0.4, -0.7, -0.7, 0.15], 'glass-matriarch': [1.8, -0.6, -0.8, -0.6, 0.1] };
export const ALIAS = { bite: 'pincer', swipe: 'pincer', strike: 'sting', cast: 'rain', roar: 'rain' };
function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
const SIDES = ['r', 'l'];
function legs(b, step, amp) {
  // an alternating tetrapod: legs 1 and 3 of one side with 2 and 4 of the other
  for (const sd of SIDES) for (let i = 1; i <= 4; i++) {
    const ph = step + ((i % 2) ^ (sd === 'r' ? 1 : 0)) * Math.PI, s = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    const k = `${sd}${i}`, sgn = sd === 'r' ? 1 : -1;
    b[k + '_upper'].rotation.z = sgn * 0.12 * lift * amp;       // lift the leg out and up
    b[k + '_upper'].rotation.x = -0.22 * s * amp;                // swing it fore and aft
    b[k + '_lower'].rotation.z = -sgn * 0.08 * lift * amp;
  }
}
function claws(b, open, raise = 0, reach = 0) {
  for (const sd of SIDES) {
    const sgn = sd === 'r' ? 1 : -1;
    b[sd + '_arm'].rotation.x = -0.3 * raise; b[sd + '_arm'].rotation.z = sgn * 0.15 * reach;
    b[sd + '_fore'].rotation.z = -sgn * 0.35 * reach; b[sd + '_fore'].rotation.x = -0.2 * raise;
    b[sd + '_finger'].rotation.x = 0.45 * open;
  }
}
function tail(b, curl, sway = 0) {
  // curl > 0 brings the sting forward over the back (each segment turns a little more)
  ['tail1', 'tail2', 'tail3', 'tail4', 'sting'].forEach((n, i) => { b[n].rotation.x = curl * [0.12, 0.18, 0.22, 0.25, 0.3][i]; b[n].rotation.y = sway * (0.3 + i * 0.15); });
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP });
  // under everything: the tail sways a little, the claws click open and shut now and then
  const click = Math.max(0, Math.sin(t * 2.3)) ** 6;
  tail(b, 0.05 * Math.sin(t * 0.9), 0.06 * Math.sin(t * 0.7)); claws(b, 0.3 * click);
  if (move === 'idle') return;
  if (move === 'walk') { legs(b, step, 1); tail(b, 0.04 * Math.sin(step), 0.08 * Math.sin(step * 0.5)); B.body.position.y = 0.006 * Math.abs(Math.sin(step * 2)); return; }
  if (move === 'pincer') {
    // the near claw reaches forward wide open and snaps shut
    const go = seg(u, 0, 0.35), snap = seg(u, 0.4, 0.5), back = 1 - seg(u, 0.65, 1);
    claws(b, (0.9 * go * (1 - snap) + 0.15) * back, 0.25 * go * back, 0.9 * go * back);
    B.body.position.z = 0.06 * go * back; B.body.rotation.x = 0.06 * go * back;
    return;
  }
  if (move === 'sting') {
    // the tail draws back, then swings forward from its root and straightens, so the sting stabs down well out in
    // front of the claws (not into its own head); the body pitches nose-down and lunges into it
    const draw = seg(u, 0, 0.3), stab = seg(u, 0.3, 0.45), back = 1 - seg(u, 0.6, 1), h = B.height || 1;
    tail(b, -0.5 * draw * (1 - stab) * back);
    const k = stab * back;
    // the tail's turns at the stab, found by pages/desert-deep/tools/reach.mjs (the furthest the sting reaches past the
    // face at face height; each foe's tail is a little different)
    const TS = STING[B.key] || STING.default;
    ['tail1', 'tail2', 'tail3', 'tail4', 'sting'].forEach((n, i) => { b[n].rotation.x += TS[i] * k; });
    claws(b, (0.5 * draw + 0.3 * stab) * back, 0.2 * draw * back, (0.4 * draw + 0.6 * stab) * back);
    B.body.rotation.x = (-0.05 * draw + 0.16 * stab) * back; B.body.position.z = 0.22 * h * stab * back; B.body.position.y = -0.02 * h * stab * back;
    return;
  }
  if (move === 'guard') {
    // Carapace: it hunkers low, claws drawn up before its face
    const k = seg(u, 0, 0.25) * (1 - seg(u, 0.8, 1));
    claws(b, 0.1, 0.8 * k, -0.6 * k);
    for (const sd of SIDES) for (let i = 1; i <= 4; i++) b[`${sd}${i}_upper`].rotation.z = (sd === 'r' ? -1 : 1) * 0.18 * k;
    B.body.position.y = -0.02 * k; tail(b, 0.4 * k);
    return;
  }
  if (move === 'moult') {
    // Moult: it shudders and arches, tail high, claws flung wide
    const k = bump(u), sh = Math.sin(u * 60) * 0.03 * k;
    B.body.rotation.x = -0.12 * k; B.body.rotation.z = sh; tail(b, -0.35 * k, sh * 3);
    claws(b, 0.9 * k, 0.4 * k, 0.8 * k);
    return;
  }
  if (move === 'rain') {
    // Shell Rain: it rears and drums its claws down, shaking the ground
    const up = seg(u, 0, 0.3), drum = Math.max(0, Math.sin((u - 0.3) * 30)) * seg(u, 0.3, 0.4) * (1 - seg(u, 0.8, 1)), back = 1 - seg(u, 0.85, 1);
    B.body.rotation.x = -0.22 * up * back; B.body.position.y = 0.03 * up * back;
    claws(b, 0.6 * up * back, (0.9 * up - 0.7 * drum) * back, 0.3 * up * back);
    tail(b, 0.5 * up * back);
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    B.body.position.z = -0.05 * a; B.body.rotation.x = -0.1 * a; B.body.rotation.z = 0.05 * Math.sin(u * 40) * a;
    claws(b, 0.7 * a, 0.3 * a, -0.3 * a); tail(b, -0.3 * a);
    return;
  }
  if (move === 'ko') {
    // it rolls onto its back, legs curling in
    const roll = seg(u, 0.1, 0.7), curl = seg(u, 0.3, 1);
    B.body.rotation.z = Math.PI * 0.95 * roll; B.body.position.y = 0.15 * bump(roll);
    for (const sd of SIDES) for (let i = 1; i <= 4; i++) { const sg = sd === 'r' ? 1 : -1; b[`${sd}${i}_upper`].rotation.z = sg * 0.4 * curl; b[`${sd}${i}_lower`].rotation.z = sg * 0.5 * curl; }
    tail(b, -0.4 * curl); claws(b, 0.2, -0.3 * curl, -0.5 * curl);
  }
}
