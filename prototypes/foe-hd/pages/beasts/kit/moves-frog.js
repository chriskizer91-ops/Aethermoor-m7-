// Moves for a great toad (Gorrow the Mire-King; Foes: beasts, session 7). Bones from the kit's frog rig: hips, chest,
// head, jaw, and per side (r_, l_) arm, forearm, hand, thigh, shin, foot.
// three.js axes: +Z forward, +Y up; rotation.x > 0 pitches a forward bone down and swings a hanging limb back.
// Bones only turn (no scale, no slide); the whole body may move. His hind legs are folded to his sides as a toad's
// are, so they barely turn; he moves as a whole, and with his arms, head and jaw.
// His moves in M7: Belly-Flop, Drag Under, Wallow, Undertow.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
function rx(b, n, v) { if (b[n]) b[n].rotation.x += v; }
function ry(b, n, v) { if (b[n]) b[n].rotation.y += v; }
function rz(b, n, v) { if (b[n]) b[n].rotation.z += v; }
// the jaw hangs from the chest (see foes/mirelord/rig.py), so it turns with the head as well as on its own
const HEAD = { x: (b, v) => { rx(b, 'head', v); rx(b, 'jaw', v); }, y: (b, v) => { ry(b, 'head', v); ry(b, 'jaw', v); }, z: (b, v) => { rz(b, 'head', v); rz(b, 'jaw', v); } };
const SIDES = ['r', 'l'];

function push(b, k) {          // the arms push off the ground (a small turn), the feet press
  for (const s of SIDES) { rx(b, s + '_arm', -0.05 * k); rx(b, s + '_forearm', 0.04 * k); rx(b, s + '_thigh', 0.04 * k); }
}

export const frog = {
  list: [['idle', 'Breathe'], ['walk', 'Hop'], ['flop', 'Belly-Flop'], ['drag', 'Drag Under'], ['wallow', 'Wallow'], ['undertow', 'Undertow'], ['hurt', 'Hit'], ['ko', 'Fall']],
  dur: { flop: 2.0, drag: 1.8, wallow: 3.0, undertow: 2.6, hurt: 0.9, ko: 2.4 },
  get MOVES() { return this.list; }, get DUR() { return this.dur; }, LUNGE: 'drag',
  ALIAS: { bite: 'drag', lunge: 'drag', strike: 'flop', swipe: 'flop', roar: 'undertow', cast: 'undertow' },
  lunge: 'drag',
  pose(F, move, u, t, step) {
    const b = F.bones, B = F.body, br = Math.sin(t * 2.2), H = F.height;
    rx(b, 'chest', -0.012 * br); rx(b, 'jaw', 0.012 + 0.012 * br); HEAD.x(b, 0.01 * br);   // the throat breathes
    if (move === 'idle') return;
    if (move === 'walk') {
      // a heavy toad's hop: a push, a short flight, a thump
      const ph = (step / (2 * Math.PI)) % 1, air = bump(ph / 0.6), land = bump((ph - 0.55) / 0.3);
      push(b, air); B.position.y = 0.08 * H * air; B.position.z = 0.05 * H * air;
      B.rotation.x = -0.08 * air + 0.04 * land; HEAD.x(b, 0.04 * land);
      return;
    }
    if (move === 'flop') {
      // he heaves up off the ground and lands on everyone at once
      const crouch = seg(u, 0, 0.25) * (1 - seg(u, 0.25, 0.35)), up = bump((u - 0.3) / 0.35), land = bump((u - 0.62) / 0.3);
      B.position.y = -0.03 * H * crouch + 0.32 * H * up - 0.03 * H * land; B.position.z = 0.4 * H * seg(u, 0.3, 0.65) * (1 - seg(u, 0.8, 1));
      B.rotation.x = -0.18 * up + 0.08 * land; push(b, up);
      HEAD.x(b, -0.06 * up + 0.08 * land); rx(b, 'jaw', 0.08 * land);
      return;
    }
    if (move === 'drag') {
      // a lunge with the mouth wide, the tongue lashing out to drag you under
      const wind = seg(u, 0, 0.3), go = bump((u - 0.3) / 0.45), back = 1 - seg(u, 0.75, 1);
      B.position.z = 0.25 * H * go - 0.04 * H * wind * (1 - go); B.rotation.x = 0.06 * go - 0.04 * wind * (1 - go);
      HEAD.x(b, -0.12 * go * back); rx(b, 'jaw', 0.16 * go * back);
      push(b, 0.5 * go);
      return;
    }
    if (move === 'wallow') {
      // he settles down into the mire, eyes half shut, and sways
      const k = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1)), sw = Math.sin(u * 9) * k;
      B.position.y = -0.06 * H * k; B.rotation.z = 0.06 * sw; B.rotation.x = 0.03 * k;
      HEAD.x(b, 0.05 * k); HEAD.z(b, -0.04 * sw);
      for (const s of SIDES) { rz(b, s + '_arm', (s === 'r' ? 0.04 : -0.04) * k); }
      return;
    }
    if (move === 'undertow') {
      // the pearl glows in his crown: he rears up, throat swelling, and croaks the tide out
      const up = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1)), q = Math.sin(u * 40) * 0.02 * up;
      B.rotation.x = -0.07 * up; B.position.y = 0.02 * H * up;
      HEAD.x(b, -0.12 * up + q); rx(b, 'jaw', 0.1 * up + q); rx(b, 'chest', -0.04 * up);
      for (const s of SIDES) { rx(b, s + '_arm', 0.04 * up); }
      return;
    }
    if (move === 'hurt') {
      const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
      B.position.z = -0.06 * H * a; B.rotation.x = -0.06 * a; HEAD.x(b, -0.1 * a); HEAD.z(b, 0.05 * a); rx(b, 'jaw', 0.15 * a);
      B.rotation.z = 0.03 * Math.sin(u * 40) * a;
      return;
    }
    if (move === 'ko') {
      // he sags, slumps, and rolls slowly onto his side, mouth open
      const sag = seg(u, 0, 0.35), roll = seg(u, 0.3, 0.8);
      B.position.y = -0.05 * H * sag; B.rotation.z = 1.2 * roll; B.position.x = -0.25 * H * roll;
      HEAD.x(b, 0.04 * sag); rx(b, 'jaw', 0.1 * roll);
      for (const s of SIDES) { rx(b, s + '_arm', -0.05 * roll); }
      return;
    }
  },
};
