// Moves for a grub (the rotgrub; Foes: beasts, session 7). Bones from the kit's serpent chain: seg0 (the tail end) ...
// seg7 (behind the head, the root), head. The chain is rooted at the head end, so each segment turns relative to the
// one ahead of it, and a turn of seg7 swings the whole body behind it.
// three.js axes: +Z forward, +Y up; rotation.x > 0 pitches a forward bone down (and lifts what hangs behind it).
// Bones only turn (no scale, no slide); the whole body may move. Its moves in M7: Latch, Ichor Spit, Burrow.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
function rx(b, n, v) { if (b[n]) b[n].rotation.x += v; }
function ry(b, n, v) { if (b[n]) b[n].rotation.y += v; }
function rz(b, n, v) { if (b[n]) b[n].rotation.z += v; }
const N = 8;                                         // seg0 ... seg7

function wave(b, ph, ampX, ampY) {                   // a wave running from head to tail along the rings
  for (let i = 0; i < N; i++) {
    const a = ph - (N - 1 - i) * 0.8;
    rx(b, 'seg' + i, ampX * Math.sin(a)); ry(b, 'seg' + i, ampY * Math.sin(a + 0.6));
  }
}

export const grub = {
  list: [['idle', 'Breathe'], ['walk', 'Crawl'], ['latch', 'Latch'], ['spit', 'Ichor Spit'], ['burrow', 'Burrow'], ['hurt', 'Hit'], ['ko', 'Fall']],
  dur: { latch: 1.2, spit: 1.4, burrow: 2.4, hurt: 0.8, ko: 2.0 },
  get MOVES() { return this.list; }, get DUR() { return this.dur; }, LUNGE: 'latch',
  ALIAS: { bite: 'latch', lunge: 'latch', strike: 'latch', swipe: 'latch', cast: 'spit', roar: 'spit' },
  lunge: 'latch',
  pose(F, move, u, t, step) {
    const b = F.bones, B = F.body, H = F.height;
    wave(b, t * 1.6, 0.012, 0.015);                                                // the rings swell and shift
    ry(b, 'head', 0.03 * Math.sin(t * 0.9));
    if (move === 'idle') return;
    if (move === 'walk') {
      // a crawl: the wave runs back along the body, the front reaching
      wave(b, step * 1.5, 0.014, 0.018); rx(b, 'head', 0.03 * Math.sin(step * 1.5));
      B.position.y = 0.01 * H * Math.max(0, Math.sin(step * 1.5));
      return;
    }
    if (move === 'latch') {
      // it rears its front, then throws itself on and clamps the mandibles
      const rear = seg(u, 0, 0.35) * (1 - seg(u, 0.4, 0.55)), go = bump((u - 0.38) / 0.45);
      rx(b, 'seg7', -0.06 * rear + 0.04 * go); rx(b, 'seg6', 0.05 * rear); rx(b, 'seg5', 0.03 * rear);
      rx(b, 'head', -0.07 * rear + 0.07 * go);
      B.position.z = 0.35 * H * go; B.position.y = 0.03 * H * rear;
      return;
    }
    if (move === 'spit') {
      // the front rears up, a heave down the body, and it spits
      const up = seg(u, 0, 0.35) * (1 - seg(u, 0.75, 1)), heave = bump((u - 0.35) / 0.25);
      rx(b, 'seg7', -0.07 * up); rx(b, 'seg6', 0.04 * up); rx(b, 'seg5', 0.03 * up);
      rx(b, 'head', -0.05 * up + 0.07 * heave); B.position.z = -0.04 * H * heave;
      for (let i = 0; i < 5; i++) rx(b, 'seg' + i, 0.02 * heave * Math.sin(i));
      return;
    }
    if (move === 'burrow') {
      // it noses down into the root-mulch and sinks, the tail last
      const k = seg(u, 0, 0.45) * (1 - seg(u, 0.8, 1));
      rx(b, 'seg7', 0.1 * k); rx(b, 'head', 0.1 * k); rx(b, 'seg2', -0.025 * k); rx(b, 'seg1', -0.025 * k);
      B.position.y = -0.12 * H * k; wave(b, u * 20, 0.015 * k, 0.02 * k);
      return;
    }
    if (move === 'hurt') {
      const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
      rx(b, 'seg7', -0.05 * a); rx(b, 'head', -0.05 * a); ry(b, 'seg4', 0.025 * a); ry(b, 'seg2', 0.025 * a);
      B.position.z = -0.05 * H * a;
      return;
    }
    if (move === 'ko') {
      // it curls up and rolls onto its side
      const curl = seg(u, 0, 0.5), roll = seg(u, 0.3, 0.8);
      for (let i = 0; i < N; i++) ry(b, 'seg' + i, 0.025 * curl);
      B.rotation.z = 1.4 * roll; B.position.x = -0.3 * H * roll; B.position.y = 0.05 * H * roll;
      return;
    }
  },
};
