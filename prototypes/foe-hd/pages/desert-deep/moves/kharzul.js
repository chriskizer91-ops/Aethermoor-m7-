// Kharzul's moves (Places' desert-and-deep lane, November 23): the scorpion's (moves/scorpion.js) under M7's own ids, as
// the Fight's champions.js names them, plus Kharzul's own. Cinderfang hangs from the tail's end (the `sting` bone).
//   tail-lash      "The tail comes over like a thrown spear."          the tail whips over and down past the head
//   glass-sting    the scorpion's Glass Sting
//   glasscutter    "Cinderfang comes round in one long arc"             the tail sweeps the blade across the whole front
//   burrow         "It goes down into the glass floor as if it were water"   sinks right under (SINKS), `surface` back up
//   erupt          "The glass floor bursts under you"                    it bursts up out of the floor and strikes
//   carapace-brace the scorpion's Carapace;  glass-rain  the scorpion's Shell Rain;  molten-tail  a slow, high stab
import * as sc from './scorpion.js';
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
export const MOVES = [['idle', 'Wait'], ['walk', 'Walk'], ['tail-lash', 'Tail Lash'], ['glass-sting', 'Glass Sting'], ['glasscutter', 'Glasscutter'],
  ['burrow', 'Burrow'], ['surface', 'Surface'], ['erupt', 'Erupt'], ['carapace-brace', 'Carapace Brace'], ['glass-rain', 'Glass Rain'],
  ['molten-tail', 'Molten Tail'], ['pincer', 'Pincer'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { ...sc.DUR, 'tail-lash': 1.1, 'glass-sting': sc.DUR.sting, glasscutter: 1.8, burrow: 1.4, surface: 1.4, erupt: 1.6,
  'carapace-brace': sc.DUR.guard, 'glass-rain': sc.DUR.rain, 'molten-tail': 1.6 };
export const LUNGE = 'tail-lash';
export const ALIAS = { bite: 'glass-sting', strike: 'tail-lash', swipe: 'glasscutter', cast: 'carapace-brace', roar: 'glass-rain', sting: 'glass-sting', guard: 'carapace-brace', rain: 'glass-rain' };
export const SINKS = { burrow: true };
const TAIL = ['tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6', 'sting'];
export function pose(B, move, u, t, step = 0) {
  const map = { 'glass-sting': 'sting', 'carapace-brace': 'guard', 'glass-rain': 'rain' };
  if (map[move]) return sc.pose(B, map[move], u, t, step);
  if (['idle', 'walk', 'pincer', 'hurt', 'ko', 'sting', 'guard', 'rain'].includes(move)) return sc.pose(B, move, u, t, step);
  sc.pose(B, 'idle', 0, t, 0);
  const b = (n) => B.bones[n] || { rotation: { x: 0, y: 0, z: 0 } }, h = B.height || 1.5;
  if (move === 'tail-lash' || move === 'molten-tail') {
    // the tail draws back and comes over like a thrown spear (Molten Tail: slower, higher, the blade held up first)
    const slow = move === 'molten-tail';
    const draw = seg(u, 0, slow ? 0.45 : 0.3), go = seg(u, slow ? 0.45 : 0.3, slow ? 0.6 : 0.45), back = 1 - seg(u, slow ? 0.75 : 0.62, 1);
    const k = go * back, r = draw * (1 - go) * back;
    const TS = [1.5, -0.35, -0.6, -0.6, -0.3, -0.2, 0.25];
    TAIL.forEach((n, i) => { b(n).rotation.x += -0.25 * r * (i < 3 ? 1 : 0.6) + TS[i] * k; });
    B.body.rotation.x = (-0.06 * r + 0.14 * k) * 1; B.body.position.z = 0.18 * h * k;
    return;
  }
  if (move === 'glasscutter') {
    // Cinderfang comes round in one long arc: the tail lifts the blade high, then sweeps it from one side to the other
    const lift = seg(u, 0, 0.25), sweep = seg(u, 0.3, 0.75), back = 1 - seg(u, 0.8, 1);
    const side = (-1 + 2 * sweep) * lift * back;
    const TS = [1.2, -0.3, -0.5, -0.5, -0.25, -0.15, 0.3];     // the tail curled over, so the blade sweeps in front of it
    TAIL.forEach((n, i) => { b(n).rotation.x += TS[i] * lift * back; });
    b('tail1').rotation.y += 0.45 * side; b('tail2').rotation.y += 0.25 * side; b('tail3').rotation.y += 0.15 * side;
    B.body.rotation.y = 0.35 * side; B.body.position.z = 0.08 * h * bump(sweep) * back;
    return;
  }
  if (move === 'burrow' || move === 'surface') {
    const k = move === 'burrow' ? seg(u, 0, 1) : 1 - seg(u, 0, 1);
    B.body.position.y = -1.4 * h * k; B.body.rotation.x = 0.15 * k;     // deep enough that the raised blade goes under too
    return;
  }
  if (move === 'erupt') {
    // up out of the floor in a burst, then the tail's blade comes down on whoever stood there
    const up = seg(u, 0, 0.3), go = seg(u, 0.35, 0.5), back = 1 - seg(u, 0.7, 1);
    B.body.position.y = -1.4 * h * (1 - up) + 0.12 * h * bump(u / 0.4); B.body.rotation.x = -0.25 * bump(u / 0.4) + 0.12 * go * back;
    const TS = [1.4, -0.3, -0.55, -0.55, -0.3, -0.2, 0.2];
    TAIL.forEach((n, i) => { b(n).rotation.x += TS[i] * go * back; });
  }
}
