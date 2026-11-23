// Moves for the Sand Wyrm (Places' desert-and-deep lane, November 23), by bone name (foes/sand-wyrm/rig.py): w0 (the
// root, in the sand) .. w10, head, mouth, lip0..lip4. The body bends a little at every joint (never much at one, so the
// plates don't stretch); the mouth opens by turning its five lip pieces outward on their hinges.
// M7's moves: Maw, Thrash, Sand-Dive (Guarding), Swallow (a charge: it swallows a hero whole) and Scale-Grind; Spit
// when it has had enough of the one inside. For the Fight: parts.mouth is the `mouth` bone (its +z looks out of the
// mouth); SWALLOW_AT says when in Swallow the mouth is down over its target, and how far ahead of the root.
import * as THREE from 'three';
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
export const MOVES = [['idle', 'Wait'], ['walk', 'Sway'], ['maw', 'Maw'], ['thrash', 'Thrash'], ['dive', 'Sand-Dive'],
  ['swallow', 'Swallow'], ['spit', 'Spit'], ['grind', 'Scale-Grind'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { maw: 1.3, thrash: 1.8, dive: 2.2, swallow: 2.6, spit: 1.4, grind: 2.0, hurt: 0.9, ko: 2.6 };
export const LUNGE = 'maw';
export const ALIAS = { bite: 'maw', strike: 'maw', swipe: 'thrash', roar: 'grind', cast: 'grind' };
export const SWALLOW_AT = { u: 0.52, ahead: 1.6, up: 0.54 };     // metres from its root, measured (tools/track.mjs)
const SEGS = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10', 'head'];
const _ax = new THREE.Vector3(), _q = new THREE.Quaternion(), _n = new THREE.Vector3(), _r = new THREE.Vector3(), _r2 = new THREE.Vector3();
function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
// bend: forward (+ brings the mouth forward and down, over its target), side (turns the arch), each spread along the
// body with a weight per joint (more toward the head)
function bend(B, fwd, side = 0, from = 0) {
  SEGS.forEach((n, i) => { const b = B.bones[n]; if (!b || i < from) return; const w = 0.4 + 0.6 * (i / (SEGS.length - 1));
    b.rotation.x += fwd * w / SEGS.length * 2; b.rotation.y += side * w / SEGS.length * 2; });
}
// tip: the whole worm leans from where it leaves the sand (w0 turns; nothing stretches)
function tip(B, a, side = 0) { const b = B.bones.w0; if (b) { b.rotation.x += a; b.rotation.y += side; } }
// lean: the lower body (w1..w5) leans by `low`, the arch above (w6..head) uncurls or curls by `high`: a forward strike is
// low > 0 with high < 0, so the mouth goes out and down instead of curling back under the arch
function lean(B, low, high) {
  SEGS.forEach((n, i) => { const b = B.bones[n]; if (!b) return; b.rotation.x += i < 5 ? low / 5 : high / 6; });
}
// the mouth: open 0 (shut, the teeth meeting) .. 1 (wide: the lips thrown back)
function mouth(B, open) {
  const lips = [0, 1, 2, 3, 4].map((k) => B.bones['lip' + k]).filter(Boolean);
  if (!lips.length) return;
  _n.set(0, 0, 0);
  for (let k = 0; k < lips.length; k++) { _r.copy(lips[k].userData.p0); _r2.copy(lips[(k + 1) % lips.length].userData.p0); _n.add(_ax.crossVectors(_r, _r2)); }
  _n.normalize();
  for (const L of lips) {
    _r.copy(L.userData.p0).normalize();
    _ax.crossVectors(_n, _r).normalize();
    L.quaternion.setFromAxisAngle(_ax, -1.0 * open);
  }
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  if (globalThis.__LEAN) { lean(B, ...globalThis.__LEAN); return; }
  const br = Math.sin(t * 1.2);
  bend(B, 0.06 * br, 0.08 * Math.sin(t * 0.5)); mouth(B, 0.12 + 0.08 * Math.max(0, Math.sin(t * 2.1)));
  if (move === 'idle') return;
  if (move === 'walk') { bend(B, 0.04 * Math.sin(step), 0.25 * Math.sin(step * 0.7)); return; }
  if (move === 'maw') {
    // rear back, the mouth opening; then lean out from the lower body and uncurl the arch, so the mouth strikes out and
    // down in front of it (not curling back under itself), snapping shut
    const rear = seg(u, 0, 0.35), go = seg(u, 0.35, 0.5), back = 1 - seg(u, 0.65, 1), k = go * back, r = rear * (1 - go) * back;
    tip(B, -0.12 * r + 0.3 * k); lean(B, -0.2 * r + 0.25 * k, 0.15 * r - 0.5 * k); mouth(B, (0.9 * rear * (1 - seg(u, 0.48, 0.55)) + 0.1) * back);
    return;
  }
  if (move === 'thrash') {
    const k = bump(u) , sw = Math.sin(u * Math.PI * 4);
    bend(B, 0.1 * k, 0.35 * sw * k); B.body.rotation.y = 0.35 * sw * k; mouth(B, 0.5 * k); B.body.rotation.z = 0.04 * sw * k;
    return;
  }
  if (move === 'dive') {
    // it pours itself back into the sand (the body sinks; the Fight's sand hides it) and rises again
    const down = seg(u, 0, 0.4), up = seg(u, 0.6, 1), k = down * (1 - up);
    tip(B, 0.2 * k); lean(B, 0.1 * k, 0.35 * k); B.body.position.y = -0.85 * (B.height || 1.6) * k; mouth(B, 0.05);
    return;
  }
  if (move === 'swallow') {
    // the sand opens: it rears up high with its mouth wide, plunges out and down over the one it wants (SWALLOW_AT: the
    // mouth is 1.55 m ahead of its root, 0.55 m up, at u 0.52), shuts and swallows, a gulp running down its body
    const rear = seg(u, 0, 0.35), plunge = seg(u, 0.38, SWALLOW_AT.u), shut = seg(u, 0.58, 0.68), gulp = seg(u, 0.7, 0.95), back = 1 - seg(u, 0.8, 1);
    const r = rear * (1 - plunge), k = plunge * back;
    tip(B, -0.15 * r + 0.3 * k); lean(B, -0.2 * r + 0.22 * k, 0.15 * r - 0.42 * k);
    mouth(B, 1.0 * rear * (1 - shut) + 0.05);
    if (gulp > 0 && gulp < 1) SEGS.forEach((n, i) => { const b = B.bones[n]; if (b) b.rotation.z += 0.06 * Math.exp(-(((1 - gulp) * SEGS.length - i) ** 2) / 2); });
    return;
  }
  if (move === 'spit') {
    const k = bump(u * 1.5), j = Math.sin(u * 30) * 0.08 * k;
    tip(B, -0.12 * k); lean(B, -0.12 * k + j, 0.1 * k); mouth(B, 1.0 * seg(u, 0.15, 0.3) * (1 - seg(u, 0.6, 0.9)));
    return;
  }
  if (move === 'grind') {
    // Scale-Grind: it twists and grinds the great scale against the walls
    const k = bump(u), tw = Math.sin(u * Math.PI * 3);
    bend(B, 0.15 * k, 0.3 * tw * k); B.body.rotation.y = 0.4 * tw * k; mouth(B, 0.6 * k);
    return;
  }
  if (move === 'hurt') { const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)); lean(B, -0.25 * a, 0.2 * a); bend(B, 0, 0.2 * a); mouth(B, 0.8 * a); return; }
  if (move === 'ko') { const a = seg(u, 0, 0.8); lean(B, 0.25 * a, -0.25 * a); B.body.rotation.x = 0.95 * a; B.body.position.y = -0.25 * a; mouth(B, 0.4 * (1 - a) + 0.1); }
}
