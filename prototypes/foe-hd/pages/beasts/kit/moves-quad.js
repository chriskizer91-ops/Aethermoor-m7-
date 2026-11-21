// Moves for a beast on four legs (Foes: beasts, session 7), posed in code the way the Fight poses everyone
// (world3d/battle/moves.js): each move is a pure pose of u (0..1 through the move) and t (the clock, for breathing).
// Bones (any that are missing are skipped): hips, spine, chest, neck, head, jaw, ear_l, ear_r, tail1..tail4, and for
// each leg fl / fr / bl / br: _upper, _lower, _foot, _paw. three.js axes: +Z forward, +Y up; rotation.x > 0 pitches
// a forward-pointing bone down and swings a hanging leg back.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const LEGS = ['fl', 'fr', 'bl', 'br'];

function rx(b, n, v) { if (b[n]) b[n].rotation.x += v; }
function ry(b, n, v) { if (b[n]) b[n].rotation.y += v; }
function rz(b, n, v) { if (b[n]) b[n].rotation.z += v; }
function tail(b, yaw, pitch) { for (let i = 1; i <= 4; i++) { ry(b, 'tail' + i, yaw * (0.6 + i * 0.2)); rx(b, 'tail' + i, pitch); } }

function gait(b, step, amp = 1, trot = 1) {
  // diagonal pairs together (front left with back right), the foot lifting as it swings forward
  const P = { fl: 0, br: 0, fr: Math.PI, bl: Math.PI };
  for (const k of LEGS) {
    const ph = step + P[k], s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * trot, front = k[0] === 'f';
    rx(b, k + '_upper', -0.34 * s * amp);
    if (front) { rx(b, k + '_lower', -0.55 * lift * amp); rx(b, k + '_foot', 0.75 * lift * amp); rx(b, k + '_paw', -0.2 * s * amp); }
    else { rx(b, k + '_lower', 0.5 * lift * amp); rx(b, k + '_foot', -0.55 * lift * amp + 0.1 * s * amp); rx(b, k + '_paw', 0.35 * lift * amp); }
  }
}
function crouch(b, k) {
  // all four legs folded, the body lowered (the caller lowers the body)
  for (const l of LEGS) {
    if (l[0] === 'f') { rx(b, l + '_upper', 0.35 * k); rx(b, l + '_lower', -0.6 * k); rx(b, l + '_foot', 0.3 * k); }
    else { rx(b, l + '_upper', -0.35 * k); rx(b, l + '_lower', 0.55 * k); rx(b, l + '_foot', -0.35 * k); }
  }
}

export const quad = {
  lunge: 'bite',
  list: [['idle', 'Breathe'], ['walk', 'Walk'], ['bite', 'Bite'], ['lunge', 'Lunge'], ['howl', 'Howl'], ['hurt', 'Hit'], ['ko', 'Fall']],
  dur: { bite: 1.0, lunge: 2.2, howl: 2.6, hurt: 0.9, ko: 2.4 },
  pose(F, move, u, t, step) {
    const b = F.bones, B = F.body, br = Math.sin(t * 2.4), H = F.height;
    // breathing under everything: the chest swells, the head bobs, the tail sways, the ears flick now and then
    if (b.spine) b.spine.scale.set(1 + 0.015 * br, 1 + 0.02 * br, 1);
    rx(b, 'head', 0.03 * br); ry(b, 'head', 0.14 * Math.sin(t * 0.6));
    tail(b, 0.16 * Math.sin(t * 1.6), 0.02 * br);
    const flick = Math.max(0, Math.sin(t * 0.9) - 0.94) * 8;
    rz(b, 'ear_l', 0.25 * flick); rz(b, 'ear_r', -0.25 * Math.max(0, Math.sin(t * 0.9 + 2) - 0.94) * 8);
    rx(b, 'jaw', 0.02 + 0.015 * br);
    if (move === 'idle') return;
    if (move === 'walk') {
      gait(b, step);
      B.position.y = 0.02 * H * Math.abs(Math.sin(step));
      rz(b, 'hips', 0.04 * Math.sin(step)); rz(b, 'chest', -0.04 * Math.sin(step));
      rx(b, 'neck', 0.05 * Math.sin(step * 2)); tail(b, 0.1 * Math.sin(step), 0.08);
      return;
    }
    if (move === 'bite') {
      // a snap: head down and forward, jaw open, shut as he lands
      const go = seg(u, 0, 0.4), snap = seg(u, 0.42, 0.52), back = 1 - seg(u, 0.6, 1);
      rx(b, 'neck', 0.4 * go * back); rx(b, 'head', -0.25 * go * back);
      rx(b, 'jaw', 0.75 * go * (1 - snap) * back);
      rx(b, 'hips', 0.05 * go * back); B.position.z = 0.22 * H * go * back;
      rx(b, 'fl_upper', -0.25 * go * back); rx(b, 'fr_upper', -0.25 * go * back);
      rz(b, 'ear_l', -0.4 * go * back); rz(b, 'ear_r', 0.4 * go * back);    // ears back
      tail(b, 0, -0.15 * go * back);
      return;
    }
    if (move === 'lunge') {
      // the charge: a long crouch, trembling, then the leap for the throat
      const low = seg(u, 0, 0.35) * (1 - seg(u, 0.55, 0.62)), leap = bump((u - 0.55) / 0.3), land = seg(u, 0.85, 1);
      const tremble = Math.sin(t * 60) * 0.01 * low;
      crouch(b, low); B.position.y = -0.14 * H * low + 0.32 * H * leap;
      B.position.z = 0.75 * H * leap * (1 - land) + 0.1 * H * low;
      rx(b, 'neck', 0.25 * low - 0.2 * leap); rx(b, 'head', -0.1 * low + 0.1 * leap + tremble);
      rx(b, 'jaw', 0.8 * leap);
      // in the air: forelegs reach forward, hind legs kick back
      for (const k of ['fl', 'fr']) { rx(b, k + '_upper', -0.7 * leap); rx(b, k + '_lower', 0.25 * leap); }
      for (const k of ['bl', 'br']) { rx(b, k + '_upper', 0.9 * leap); rx(b, k + '_foot', 0.4 * leap); }
      rz(b, 'ear_l', -0.5 * low); rz(b, 'ear_r', 0.5 * low);
      tail(b, 0.05 * Math.sin(t * 20) * low, -0.2 * low + 0.3 * leap);
      return;
    }
    if (move === 'howl') {
      // sit back on the haunches, muzzle to the sky, the jaw open, the throat working
      const up = seg(u, 0, 0.25), hold = 1 - seg(u, 0.8, 1), k = up * hold, quaver = Math.sin(u * 40) * 0.03 * k;
      rx(b, 'hips', -0.18 * k); rx(b, 'spine', -0.08 * k); rx(b, 'chest', -0.1 * k);
      rx(b, 'neck', -0.5 * k); rx(b, 'head', -0.55 * k + quaver);
      rx(b, 'jaw', 0.42 * k + quaver);
      for (const l of ['bl', 'br']) { rx(b, l + '_upper', -0.25 * k); rx(b, l + '_lower', 0.45 * k); rx(b, l + '_foot', -0.25 * k); }
      for (const l of ['fl', 'fr']) rx(b, l + '_upper', 0.12 * k);
      B.position.y = -0.04 * H * k;
      rz(b, 'ear_l', -0.2 * k); rz(b, 'ear_r', 0.2 * k);
      return;
    }
    if (move === 'hurt') {
      const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
      B.position.z = -0.16 * H * a; rx(b, 'chest', -0.2 * a); rx(b, 'neck', -0.35 * a); rx(b, 'head', -0.25 * a);
      rz(b, 'head', 0.25 * a); rx(b, 'jaw', 0.4 * a);
      rz(b, 'hips', 0.08 * Math.sin(u * 40) * a);
      rz(b, 'ear_l', -0.5 * a); rz(b, 'ear_r', 0.5 * a); tail(b, 0, -0.4 * a);
      return;
    }
    if (move === 'ko') {
      // the legs buckle, he rolls onto his side, the head drops last
      const buckle = seg(u, 0, 0.35), roll = seg(u, 0.25, 0.75), drop = seg(u, 0.6, 1);
      crouch(b, buckle);
      B.position.y = -0.2 * H * buckle + 0.06 * H * roll; B.rotation.z = 1.45 * roll; B.position.x = -0.3 * H * roll;
      rx(b, 'neck', 0.35 * drop); rz(b, 'head', -0.3 * drop); rx(b, 'jaw', 0.25 * drop);
      tail(b, 0, -0.2 * drop);
      return;
    }
  },
};
