// Moves for a boar (Old Snag; Foes: beasts, session 7). Bones from the kit's quad rig: hips, spine, chest, neck
// (neck_base is a helper the loader drives), head, jaw, tail, and per leg fl/fr/bl/br _upper, _lower, _paw.
// three.js axes: +Z forward, +Y up; rotation.x > 0 pitches a forward bone down and swings a hanging leg back.
// Bones only turn (no scale, no slide); the whole body may move. Gentle bends: big turns stretch the skin.
// His moves in M7: Tusk, Trample, Bristle, Wallow, Splitting Charge.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const LEGS = ['fl', 'fr', 'bl', 'br'];
function rx(b, n, v) { if (b[n]) b[n].rotation.x += v; }
function ry(b, n, v) { if (b[n]) b[n].rotation.y += v; }
function rz(b, n, v) { if (b[n]) b[n].rotation.z += v; }

function gait(b, step, amp = 1) {          // short legs: quick, small steps
  const P = { fl: 0, br: 0, fr: Math.PI, bl: Math.PI };
  for (const k of LEGS) {
    const ph = step + P[k], s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)), front = k[0] === 'f';
    rx(b, k + '_upper', -0.2 * s * amp);
    if (front) { rx(b, k + '_lower', -0.4 * lift * amp); rx(b, k + '_paw', 0.3 * lift * amp); }
    else { rx(b, k + '_lower', 0.35 * lift * amp); rx(b, k + '_paw', -0.25 * lift * amp); }
  }
}

export const boar = {
  list: [['idle', 'Breathe'], ['walk', 'Walk'], ['tusk', 'Tusk'], ['trample', 'Trample'], ['bristle', 'Bristle'], ['wallow', 'Wallow'], ['charge', 'Splitting Charge'], ['hurt', 'Hit'], ['ko', 'Fall']],
  dur: { tusk: 1.1, trample: 2.0, bristle: 2.2, wallow: 3.2, charge: 2.6, hurt: 0.9, ko: 2.6 },
  get MOVES() { return this.list; }, get DUR() { return this.dur; }, LUNGE: 'tusk',
  ALIAS: { bite: 'tusk', strike: 'charge', swipe: 'trample', roar: 'bristle', cast: 'wallow', lunge: 'charge' },
  lunge: 'tusk',
  pose(F, move, u, t, step) {
    const b = F.bones, B = F.body, br = Math.sin(t * 1.4), H = F.height;
    rx(b, 'spine', -0.008 * br); rx(b, 'chest', 0.01 * br);           // breathing: a small turn
    rx(b, 'neck', 0.02 * br); ry(b, 'neck', 0.04 * Math.sin(t * 0.6));
    ry(b, 'tail', 0.25 * Math.sin(t * 3.1));                          // the tail flicks
    if (move === 'idle') return;
    if (move === 'walk') {
      gait(b, step);
      B.position.y = 0.01 * H * Math.abs(Math.sin(step));
      rz(b, 'hips', 0.03 * Math.sin(step)); ry(b, 'neck', 0.02 * Math.sin(step));
      return;
    }
    if (move === 'tusk') {
      // a hooking rip of yellow tusk: head down and in, then a twist up and to the side
      const down = seg(u, 0, 0.35), hook = seg(u, 0.38, 0.55), back = 1 - seg(u, 0.65, 1);
      rx(b, 'neck', 0.08 * down * back - 0.07 * hook * back); rx(b, 'head', 0.12 * down * back - 0.14 * hook * back);
      rz(b, 'head', 0.04 * hook * back); ry(b, 'neck', 0.035 * hook * back);
      B.position.z = 0.15 * H * down * back;
      rx(b, 'fl_upper', -0.12 * down * back); rx(b, 'fr_upper', -0.12 * down * back);
      rx(b, 'bl_upper', 0.1 * down * back); rx(b, 'br_upper', 0.1 * down * back);
      return;
    }
    if (move === 'trample') {
      // four hundredweight of boar, going through: a run forward, head low, and back
      const go = seg(u, 0.1, 0.55), back = 1 - seg(u, 0.7, 1), k = go * back;
      B.position.z = 0.9 * H * k; B.position.y = -0.02 * H * k;
      rx(b, 'neck', 0.08 * k); rx(b, 'head', 0.12 * k);
      gait(b, u * 46, Math.min(1, 3 * k));
      return;
    }
    if (move === 'bristle') {
      // hackles up, head down: he sets his feet wide and Guards
      const k = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1)), q = Math.sin(u * 60) * 0.015 * k;
      B.position.y = -0.04 * H * k;
      rx(b, 'chest', -0.03 * k); rx(b, 'neck', 0.075 * k + q); rx(b, 'head', 0.13 * k);
      rz(b, 'fl_upper', -0.08 * k); rz(b, 'fr_upper', 0.08 * k); rz(b, 'bl_upper', -0.06 * k); rz(b, 'br_upper', 0.06 * k);
      rz(b, 'spine', q);
      return;
    }
    if (move === 'wallow') {
      // down into the black mud, a roll onto his side and back, and up again
      const sink = seg(u, 0, 0.25) * (1 - seg(u, 0.8, 1)), roll = bump((u - 0.25) / 0.5);
      for (const l of LEGS) {
        if (l[0] === 'f') { rx(b, l + '_upper', 0.15 * sink); rx(b, l + '_lower', -0.3 * sink); }
        else { rx(b, l + '_upper', -0.12 * sink); rx(b, l + '_lower', 0.22 * sink); }
      }
      B.position.y = -0.15 * H * sink; B.rotation.z = 0.9 * roll; B.position.x = -0.12 * H * roll;
      rx(b, 'neck', 0.06 * sink); rz(b, 'head', -0.05 * roll);
      for (const l of LEGS) rz(b, l + '_upper', 0.06 * roll * Math.sin(u * 30));
      return;
    }
    if (move === 'charge') {
      // the hatchet in his hide catches the light: he paws the ground, then charges
      const low = seg(u, 0, 0.3), go = seg(u, 0.5, 0.72), back = 1 - seg(u, 0.85, 1);
      const paw = Math.max(0, Math.sin(u * 28)) * (1 - seg(u, 0.42, 0.5));
      rx(b, 'neck', 0.08 * low * back); rx(b, 'head', 0.12 * low * back);
      rx(b, 'fr_upper', 0.22 * paw * low); rx(b, 'fr_lower', 0.15 * paw * low);
      B.position.z = 0.9 * H * go * back; B.position.y = -0.02 * H * low * back;
      if (go > 0 && back > 0) gait(b, u * 50, 0.9 * go);
      return;
    }
    if (move === 'hurt') {
      const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
      B.position.z = -0.06 * H * a; rx(b, 'chest', -0.06 * a); rx(b, 'neck', -0.12 * a); rx(b, 'head', -0.1 * a);
      rz(b, 'head', 0.04 * a); rx(b, 'jaw', 0.18 * a); rz(b, 'hips', 0.05 * Math.sin(u * 40) * a);
      return;
    }
    if (move === 'ko') {
      // the legs go, he sinks and rolls onto his side, the head last
      const buckle = seg(u, 0, 0.35), roll = seg(u, 0.3, 0.75), drop = seg(u, 0.6, 1);
      for (const l of LEGS) {
        if (l[0] === 'f') { rx(b, l + '_upper', 0.2 * buckle); rx(b, l + '_lower', -0.35 * buckle); }
        else { rx(b, l + '_upper', -0.15 * buckle); rx(b, l + '_lower', 0.25 * buckle); }
      }
      B.position.y = -0.15 * H * buckle + 0.05 * H * roll; B.rotation.z = 1.35 * roll; B.position.x = -0.25 * H * roll;
      rx(b, 'neck', 0.12 * drop); rz(b, 'head', -0.06 * drop); rx(b, 'jaw', 0.12 * drop);
      return;
    }
  },
};
