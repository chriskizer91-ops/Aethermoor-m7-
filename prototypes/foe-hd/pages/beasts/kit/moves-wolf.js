// Moves for a wolf (the rime wolf; Foes: beasts, session 7). Bones from the kit's quad rig: hips, spine, chest, neck
// (neck_base is a helper the loader drives), head, jaw, tail, and per leg fl/fr/bl/br _upper, _lower, _paw.
// three.js axes: +Z forward, +Y up; rotation.x > 0 pitches a forward bone down and swings a hanging leg back.
// Bones only turn (no scale, no slide); the whole body may move. Its moves in M7: Rime Bite, Lunge, Circle.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const LEGS = ['fl', 'fr', 'bl', 'br'];
function rx(b, n, v) { if (b[n]) b[n].rotation.x += v; }
function ry(b, n, v) { if (b[n]) b[n].rotation.y += v; }
function rz(b, n, v) { if (b[n]) b[n].rotation.z += v; }

function gait(b, step, amp = 1) {          // a trot: diagonal pairs together
  const P = { fl: 0, br: 0, fr: Math.PI, bl: Math.PI };
  for (const k of LEGS) {
    const ph = step + P[k], s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)), front = k[0] === 'f';
    rx(b, k + '_upper', (front ? -0.16 : -0.2) * s * amp);
    if (front) { rx(b, k + '_lower', -0.4 * lift * amp); rx(b, k + '_paw', 0.3 * lift * amp); }
    else { rx(b, k + '_lower', 0.35 * lift * amp); rx(b, k + '_paw', -0.25 * lift * amp); }
  }
}

export const wolf = {
  list: [['idle', 'Breathe'], ['walk', 'Trot'], ['bite', 'Rime Bite'], ['lunge', 'Lunge'], ['circle', 'Circle'], ['hurt', 'Hit'], ['ko', 'Fall']],
  dur: { bite: 1.0, lunge: 2.2, circle: 2.8, hurt: 0.9, ko: 2.4 },
  get MOVES() { return this.list; }, get DUR() { return this.dur; }, LUNGE: 'lunge',
  ALIAS: { strike: 'lunge', swipe: 'bite', roar: 'circle', cast: 'circle' },
  lunge: 'lunge',
  pose(F, move, u, t, step) {
    const b = F.bones, B = F.body, br = Math.sin(t * 2.0), H = F.height;
    rx(b, 'spine', -0.008 * br); rx(b, 'chest', 0.01 * br);           // breathing: a small turn
    ry(b, 'neck', 0.04 * Math.sin(t * 0.7));
    ry(b, 'tail', 0.12 * Math.sin(t * 1.7));
    if (move === 'idle') return;
    if (move === 'walk') {
      gait(b, step);
      B.position.y = 0.012 * H * Math.abs(Math.sin(step));
      rz(b, 'hips', 0.025 * Math.sin(step)); rx(b, 'neck', 0.03 * Math.sin(step * 2));
      return;
    }
    if (move === 'bite') {
      // teeth rimed with frost: a snap forward, the jaw wide, and back
      const go = bump(u / 0.6), back = 1 - seg(u, 0.6, 1);
      B.position.z = 0.15 * H * go; rx(b, 'neck', 0.1 * go); rx(b, 'head', 0.06 * go);
      rx(b, 'jaw', 0.32 * bump((u - 0.1) / 0.4)); rx(b, 'fl_upper', -0.12 * go); rx(b, 'fr_upper', -0.12 * go);
      return;
    }
    if (move === 'lunge') {
      // it drops low in the snow, trembling, then springs for the throat
      const low = seg(u, 0, 0.45) * (1 - seg(u, 0.5, 0.58)), fly = bump((u - 0.52) / 0.3), back = 1 - seg(u, 0.8, 1);
      const shiver = Math.sin(u * 70) * 0.01 * low;
      B.position.y = -0.07 * H * low + 0.18 * H * fly; B.position.z = 0.7 * H * seg(u, 0.52, 0.8) * back;
      B.rotation.x = 0.04 * low - 0.12 * fly;
      for (const l of LEGS) {
        if (l[0] === 'f') { rx(b, l + '_upper', 0.16 * low - 0.25 * fly); rx(b, l + '_lower', -0.28 * low); }
        else { rx(b, l + '_upper', -0.14 * low + 0.25 * fly); rx(b, l + '_lower', 0.25 * low); }
      }
      rx(b, 'neck', 0.08 * low + shiver - 0.05 * fly); rx(b, 'jaw', 0.3 * fly); rz(b, 'tail', 0.2 * low);
      return;
    }
    if (move === 'circle') {
      // quick and light on the crust: it trots a ring round where it stood
      const a = u * Math.PI * 2, R = 0.35 * H;
      B.position.x = R * Math.sin(a); B.position.z = R * (1 - Math.cos(a)) * 0.6; B.rotation.y = a * 0.999;
      gait(b, u * 26, 0.85); rz(b, 'spine', -0.03); ry(b, 'neck', 0.06);
      return;
    }
    if (move === 'hurt') {
      const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
      B.position.z = -0.08 * H * a; rx(b, 'chest', -0.04 * a); rx(b, 'neck', -0.08 * a); rx(b, 'head', -0.08 * a);
      rx(b, 'jaw', 0.18 * a); rz(b, 'hips', 0.05 * Math.sin(u * 40) * a); rz(b, 'tail', 0.3 * a);
      return;
    }
    if (move === 'ko') {
      const buckle = seg(u, 0, 0.35), roll = seg(u, 0.3, 0.75), drop = seg(u, 0.6, 1);
      for (const l of LEGS) {
        if (l[0] === 'f') { rx(b, l + '_upper', 0.2 * buckle); rx(b, l + '_lower', -0.35 * buckle); }
        else { rx(b, l + '_upper', -0.15 * buckle); rx(b, l + '_lower', 0.25 * buckle); }
      }
      B.position.y = -0.2 * H * buckle + 0.04 * H * roll; B.rotation.z = 1.4 * roll; B.position.x = -0.2 * H * roll;
      rx(b, 'neck', 0.09 * drop); rx(b, 'jaw', 0.12 * drop);
      return;
    }
  },
};
