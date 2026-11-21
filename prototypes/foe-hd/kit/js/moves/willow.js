// Moves for a walking tree (the foe kit, November 21: the willow-wight and Grandfather Willow), posed by bone name:
// root (the feet), trunk, chest, head, crown (its boughs and fronds) and l_/r_ upper, fore, hand (branch arms, pieces of
// their own, so they swing freely). A tree bends little: it leans with its whole body (the root), its crown and fronds
// lag behind and swing, and its arms do the work. Pure poses of u (0..1 through the move) and t (the clock).
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { set() {}, copy() {} }, scale: { set() {} } };

export const MOVES = [['idle', 'Sway'], ['walk', 'Walk'], ['lash', 'Lash'], ['bough', 'Bough-Fall'], ['weep', 'Weep'],
  ['volley', 'Weeping Volley'], ['hurt', 'Hit'], ['ko', 'Fall']];
export const DUR = { lash: 1.2, bough: 1.8, weep: 2.2, volley: 2.0, hurt: 0.9, ko: 2.6 };
export const LUNGE = 'lash';
export const ALIAS = { strike: 'lash', bite: 'lash', swipe: 'lash', cast: 'weep', roar: 'bough' };

function reset(B) {
  for (const b of Object.values(B.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  B.body.position.set(0, 0, 0); B.body.rotation.set(0, 0, 0);
}
function arms(b, t, k = 1) {          // hanging arms, swaying a little
  b.r_upper.rotation.z = 0.04 * Math.sin(t * 0.9) * k; b.l_upper.rotation.z = -0.04 * Math.sin(t * 0.8 + 1) * k;
  b.r_fore.rotation.x = 0.05 * Math.sin(t * 1.1) * k; b.l_fore.rotation.x = 0.05 * Math.sin(t * 1.0 + 2) * k;
}
export function pose(B, move, u, t, step = 0) {
  reset(B);
  const b = new Proxy(B.bones, { get: (o, k) => o[k] || NOOP }), br = Math.sin(t * 1.1);
  b.trunk.rotation.x = 0.008 * br; b.chest.rotation.x = 0.01 * br;            // it creaks as it breathes (bones turn)
  b.crown.rotation.z = 0.03 * Math.sin(t * 0.7); b.crown.rotation.x = 0.02 * Math.sin(t * 0.9);   // the fronds sway
  b.head.rotation.y = 0.04 * Math.sin(t * 0.4);
  if (move === 'idle') { arms(b, t); return; }
  if (move === 'walk') {
    // it lurches on its roots: the whole tree rocks side to side and forward, the crown swinging after
    const s = Math.sin(step);
    b.root.rotation.z = 0.06 * s; b.root.rotation.x = 0.04 * Math.abs(Math.cos(step)) ;
    B.body.position.y = 0.02 * Math.abs(s);
    b.crown.rotation.z += -0.06 * s;
    b.r_upper.rotation.x = 0.18 * s; b.l_upper.rotation.x = -0.18 * s;
    return;
  }
  if (move === 'lash') {
    // its right arm draws back and whips across in front, wrapping round your legs
    const back = seg(u, 0, 0.3) * (1 - seg(u, 0.3, 0.45)), whip = seg(u, 0.33, 0.5) * (1 - seg(u, 0.72, 1));
    b.root.rotation.y = 0.15 * back - 0.25 * whip; b.root.rotation.x = 0.06 * whip;
    b.r_upper.rotation.x = 0.7 * back - 1.1 * whip; b.r_upper.rotation.z = 0.3 * back - 0.6 * whip;
    b.r_fore.rotation.x = -0.4 * back - 0.5 * whip; b.r_hand.rotation.x = -0.3 * whip;
    b.crown.rotation.y = -0.08 * back + 0.12 * whip;
    arms(b, t, 0.5);
    return;
  }
  if (move === 'bough') {
    // it lifts both arms high over you, charging, and brings them down; the whole tree leans into it
    const up = seg(u, 0, 0.4) * (1 - seg(u, 0.55, 0.65)), down = seg(u, 0.55, 0.68) * (1 - seg(u, 0.85, 1));
    for (const s of ['r', 'l']) {
      const sx = s === 'r' ? 1 : -1;
      b[s + '_upper'].rotation.x = -2.0 * up - 0.6 * down; b[s + '_upper'].rotation.z = sx * (0.5 * up + 0.2 * down);
      b[s + '_fore'].rotation.x = -0.4 * up + 0.3 * down;
    }
    b.root.rotation.x = -0.08 * up + 0.2 * down; B.body.position.z = 0.12 * down;
    b.crown.rotation.x = 0.06 * up - 0.12 * down;
    return;
  }
  if (move === 'weep') {
    // it bows its head and weeps; the fronds droop and shiver
    const k = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
    b.root.rotation.x = 0.08 * k; b.head.rotation.x = 0.1 * k; b.crown.rotation.x = 0.08 * k;
    b.crown.rotation.z += 0.02 * Math.sin(u * 40) * k;
    b.r_upper.rotation.x = -0.2 * k; b.l_upper.rotation.x = -0.3 * k; b.l_fore.rotation.x = -0.4 * k;   // hands to its face
    return;
  }
  if (move === 'volley') {
    // he lifts the bow in his left arm and draws with his right, holds, and lets fly over the whole line
    const lift = seg(u, 0, 0.3) * (1 - seg(u, 0.85, 1)), draw = seg(u, 0.25, 0.55) * (1 - seg(u, 0.62, 0.68)), loose = bump((u - 0.62) / 0.25);
    b.l_upper.rotation.x = -0.45 * lift; b.l_upper.rotation.z = -0.15 * lift;
    b.r_upper.rotation.x = -1.1 * lift + 0.3 * loose; b.r_upper.rotation.z = 0.45 * draw;     // the draw is from the shoulder
    b.r_fore.rotation.x = -0.4 * draw;
    b.root.rotation.x = -0.05 * lift + 0.04 * loose; b.root.rotation.y = 0.08 * draw;
    b.crown.rotation.x = 0.06 * loose;
    return;
  }
  if (move === 'hurt') {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1));
    b.root.rotation.x = -0.12 * a; B.body.position.z = -0.08 * a;
    b.crown.rotation.x = 0.12 * a; b.crown.rotation.z = 0.05 * Math.sin(u * 30) * a;
    b.r_upper.rotation.x = 0.3 * a; b.l_upper.rotation.x = 0.3 * a;
    return;
  }
  if (move === 'ko') {
    // it groans and topples over backwards, the crown last
    const tip = seg(u, 0.1, 0.85), late = seg(u, 0.3, 1);
    b.root.rotation.x = -1.35 * tip; B.body.position.y = -0.05 * tip;
    b.crown.rotation.x = 0.15 * late; b.r_upper.rotation.x = -0.6 * tip; b.l_upper.rotation.x = -0.5 * tip;
  }
}
