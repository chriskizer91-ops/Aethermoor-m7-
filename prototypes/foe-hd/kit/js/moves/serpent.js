// Moves for a serpent or grub (the foe kit, November 20, a first pass), by bone name: seg0 (tail end) ... segN, head,
// jaw?. The chain is rooted at the head end, so each segment turns relative to the one ahead of it.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };
export const MOVES = [['idle', 'Coil'], ['walk', 'Slither'], ['strike', 'Strike'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { strike: 1.1, hurt: 0.9, ko: 2.0 };
export const LUNGE = 'strike';
function reset(B) { for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); } B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0); }
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP });
  const segs = Object.keys(B.bones).filter((n) => /^seg\d+$/.test(n)).sort((a, c) => +a.slice(3) - +c.slice(3));
  const wave = (amp, freq, speed, up = 0) => segs.forEach((n, i) => { b[n].rotation.y = amp * Math.sin(i * freq - speed); b[n].rotation.x = up * Math.sin(i * freq * 0.5 - speed * 0.5); });
  if (move === 'idle') { wave(0.06, 0.9, t * 1.5, 0.02); b.head.rotation.y = 0.15 * Math.sin(t * 0.7); return; }
  if (move === 'walk') { wave(0.28, 1.0, step * 1.5); return; }
  if (move === 'strike') {
    const coil = seg(u, 0, 0.35), go = seg(u, 0.35, 0.55), back = 1 - seg(u, 0.7, 1);
    segs.slice(-3).forEach((n) => { b[n].rotation.x = (-0.35 * coil + 0.5 * go) * back; });
    b.head.rotation.x = (0.3 * coil - 0.4 * go) * back; b.jaw.rotation.x = 0.7 * go * back;
    B.body.position.z = 0.3 * go * back; return;
  }
  if (move === 'hurt') { const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)); wave(0.3 * a, 1.4, u * 20); b.head.rotation.x = -0.4 * a; return; }
  if (move === 'ko') { const a = ease(u); wave(0.15 * (1 - a), 1.0, u * 6); B.body.rotation.z = 1.2 * a; b.head.rotation.x = 0.4 * a; }
}
