// Moves for a low lizard (Places' desert-and-deep lane, November 21): the kit's quad moves (kit/js/moves/quad.js) with
// a long tail in several bones (tail, tail2, tail3, tail4) that sways as it walks and lashes in a fight, and a swipe
// made for short sprawled legs (the paw rakes from the elbow, the body twists into it). Bones turn, never grow.
import * as quad from '../../../kit/js/moves/quad.js';
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const seg = (u, a, b) => ease((u - a) / (b - a));
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
export const MOVES = [['idle', 'Bask'], ['walk', 'Scuttle'], ['bite', 'Bite'], ['swipe', 'Claw'], ['roar', 'Hiss'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { ...quad.DUR, roar: 1.6 };
export const LUNGE = 'bite';
const TAIL = ['tail', 'tail2', 'tail3', 'tail4'];
export function pose(B, move, u, t, step = 0) {
  const swipe = move === 'swipe';
  quad.pose(B, swipe ? 'idle' : move, u, t, step);
  const b = (n) => B.bones[n];
  // the tail: a wave down its bones, slow at rest, with the stride when walking, a lash in a fight
  let amp = 0.07, ph = t * 1.4, lift = 0;
  if (move === 'walk') { amp = 0.16; ph = step; }
  if (move === 'bite' || move === 'roar' || swipe) { const k = bump(u); amp = 0.07 + 0.2 * k; ph = t * 1.4 + u * 9; lift = 0.06 * k; }
  if (move === 'hurt') { const k = bump(u * 1.5); amp = 0.07 + 0.22 * k; ph = u * 14; }
  if (move === 'ko') { amp = 0.07 * (1 - u); }
  TAIL.forEach((n, i) => { const bn = b(n); if (!bn) return; bn.rotation.y = amp * Math.sin(ph - i * 0.9) * [0.3, 0.65, 1.0, 1.3][i]; bn.rotation.x = (bn.rotation.x || 0) - lift * (i + 1) * 0.5; });
  if (swipe) {     // a twist of the body toward the foe and a short rake of the near forepaw from the elbow
    const up = seg(u, 0, 0.3), rake = seg(u, 0.32, 0.55), back = 1 - seg(u, 0.7, 1);
    b('hips').rotation.x = -0.12 * up * back; b('hips').rotation.y = (0.12 * up - 0.26 * rake) * back;
    b('fr_lower').rotation.x = (-0.05 * up + 0.03 * rake) * back; b('fr_paw').rotation.x = (-0.14 * up + 0.09 * rake) * back;
    if (b('jaw')) b('jaw').rotation.x = 0.05 + 0.3 * rake * back;
    B.body.position.y = 0.025 * up * back;
  }
  if (move === 'roar' && b('jaw')) { const k = seg(u, 0, 0.2) * (1 - seg(u, 0.8, 1)); b('jaw').rotation.x = 0.05 + 0.5 * k; }
}
