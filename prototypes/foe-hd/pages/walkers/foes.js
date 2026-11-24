// The walkers and their moves (session 8). Each move is named for the M7 move it plays (game/src/data/foes.js);
// `pose(W, u, t, step)` runs after the breathing and resting pose are set, u 0..1 through the move.
import { tools } from './walker.js';
const { ease, bump, seg, crouch, roots } = tools;

// the Rotwarden: his left arm is one great root (bones root1..root4), his right a plated arm with a bark fist
const rotwarden = {
  key: 'rotwarden', name: 'The Rotwarden', tier: 'Champion', act: 'Act One, the Heartroot', height: 2.5, weight: 1.4,
  stiff: 0.45, knees: 0.6,          // plate armour: his trunk barely twists, his knees fold only so far
  limits: { hips: 0.6, spine: 0.4, chest: 0.7, l_shin: 0.36, r_shin: 0.36, l_thigh: 0.55, r_thigh: 0.55, root2: 0.52, root3: 0.8, l_foot: 0.7, r_foot: 0.7 },
  text: "A First-Age warden of the root, bark grown through its plate, wearing a smith's mask that is not its face.",
  lunge: 'rootlash',
  moves: {
    rootlash: { label: 'Rootlash', dur: 1.6, pose(W, u, t) {
      // wind up to his left, then the root whips across in front of him; each joint of it trails the one before
      const b = W.bones, wind = seg(u, 0, 0.3) * (1 - seg(u, 0.3, 0.5)), back = 1 - seg(u, 0.72, 1);
      const sw = (lag) => seg(u, 0.3 + lag, 0.52 + lag) * back;
      b.spine.rotation.y = 0.5 * (0.16 * wind - 0.22 * sw(0)); b.chest.rotation.y = 0.5 * (0.12 * wind - 0.16 * sw(0));
      b.hips.rotation.y = 0.12 * wind - 0.16 * sw(0);
      b.root1.rotation.z += 0.7 * wind + 0.2 * sw(0); b.root1.rotation.x += 0.35 * wind - 1.25 * sw(0);
      b.root2.rotation.x += 0.2 * wind - 0.45 * sw(0.04); b.root2.rotation.z += -0.25 * sw(0.04);
      b.root3.rotation.x += 0.15 * wind - 0.4 * sw(0.08); b.root3.rotation.z += -0.3 * sw(0.08);
      b.root4.rotation.x += -0.3 * sw(0.12); b.root4.rotation.z += -0.35 * sw(0.12);
      b.r_upper.rotation.z -= 0.25 * sw(0); b.r_upper.rotation.x = 0.3 * wind;
      b.head.rotation.y += 0.25 * wind - 0.3 * sw(0);
      crouch(W, 0.25 * (wind + sw(0)));
    } },
    'grasping-roots': { label: 'Grasping Roots', dur: 2.0, pose(W, u, t) {
      // the root rises over his head and is driven into the floor; he follows it down
      const b = W.bones, up = seg(u, 0, 0.35) * (1 - seg(u, 0.4, 0.5)), down = seg(u, 0.4, 0.5) * (1 - seg(u, 0.8, 1));
      b.root1.rotation.x += -2.1 * up - 0.85 * down; b.root1.rotation.z += 0.25 * up - 0.15 * down;
      b.root2.rotation.x += -0.5 * up + 0.2 * down; b.root3.rotation.x += -0.3 * up + 0.35 * down; b.root4.rotation.x += 0.3 * down;
      b.chest.rotation.x = 0.35 * (-0.2 * up + 0.3 * down); b.spine.rotation.x = 0.35 * (-0.1 * up + 0.15 * down);
      b.neck.rotation.x = -0.2 * up + 0.15 * down;
      b.r_upper.rotation.z -= 0.35 * (up + down); b.r_upper.rotation.x = -0.2 * up;
      crouch(W, 0.6 * down);
      W.body.position.y += 0.03 * Math.sin(u * 60) * down * (1 - seg(u, 0.5, 0.65));
    } },
    'bark-hide': { label: 'Bark Hide', dur: 1.8, pose(W, u, t) {
      // he hunkers behind the root, fist to his chest: plate and bark grow together
      const b = W.bones, k = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1)), tremble = Math.sin(u * 80) * 0.01 * k;
      crouch(W, 0.25 * k);
      b.chest.rotation.x = 0.5 * (0.14 * k); b.neck.rotation.x = 0.2 * k; b.head.rotation.x += 0.1 * k;
      b.r_upper.rotation.x = -0.75 * k; b.r_upper.rotation.z -= -0.15 * k; b.r_fore.rotation.x = -0.6 * k;
      b.root1.rotation.x += -0.55 * k; b.root1.rotation.z += -0.35 * k; b.root2.rotation.x += -0.3 * k; b.root2.rotation.z += -0.3 * k;
      b.root3.rotation.z += -0.25 * k;
      W.body.position.x = tremble;
    } },
    blacken: { label: 'Blacken the Sap', dur: 2.2, pose(W, u, t) {
      // the mask weeps: he straightens, head back, root and fist spread wide, shaking
      const b = W.bones, k = seg(u, 0, 0.3) * (1 - seg(u, 0.78, 1)), sh = Math.sin(u * 50) * 0.03 * k;
      b.spine.rotation.x = 0.5 * (-0.1 * k); b.chest.rotation.x = 0.5 * (-0.15 * k); b.neck.rotation.x = -0.3 * k; b.head.rotation.x += -0.25 * k + sh;
      b.r_upper.rotation.z -= 0.8 * k; b.r_fore.rotation.x = -0.4 * k;
      b.root1.rotation.z += 0.65 * k; b.root2.rotation.z += 0.2 * k; b.root3.rotation.z += -0.15 * k;
      W.body.position.y = 0.04 * k;
    } },
    graft: { label: 'Graft', dur: 2.0, pose(W, u, t) {
      // "The First Seed pulses, and a Sapwight tears out of the wall": he drives the root down beside him and wrenches up
      const b = W.bones, down = seg(u, 0, 0.35) * (1 - seg(u, 0.5, 0.65)), pull = seg(u, 0.5, 0.65) * (1 - seg(u, 0.85, 1));
      b.root1.rotation.z += 0.45 * down + 0.2 * pull; b.root1.rotation.x += 0.25 * down - 0.6 * pull;
      b.root2.rotation.x += 0.3 * down - 0.3 * pull; b.root3.rotation.x += 0.25 * down;
      b.r_upper.rotation.x = -0.8 * pull; b.r_fore.rotation.x = -0.5 * pull;
      crouch(W, 0.3 * down); b.chest.rotation.y = 0.05 * down - 0.04 * pull;
    } },
    'ichor-tide': { label: 'Ichor Tide', dur: 2.0, pose(W, u, t) {
      // "Black sap floods the chamber": he sweeps the root low along the floor in a wide arc, leaning into it
      const b = W.bones, sweep = seg(u, 0.15, 0.75), k = seg(u, 0, 0.2) * (1 - seg(u, 0.8, 1));
      b.root1.rotation.x += -0.55 * k; b.root1.rotation.z += (0.5 - 1.0 * sweep) * k;
      b.root2.rotation.z += (0.3 - 0.5 * sweep) * k; b.root3.rotation.x += 0.2 * k;
      b.chest.rotation.y = (0.06 - 0.1 * sweep) * k; b.r_upper.rotation.z -= 0.3 * k;
      crouch(W, 0.3 * k);
    } },
    'heartroot-bloom': { label: 'Heartroot Bloom', dur: 2.2, pose(W, u, t) {
      // "The Seed blooms": he straightens, fist to his chest, the root curling up in front of him like a growing shoot
      const b = W.bones, k = seg(u, 0, 0.4) * (1 - seg(u, 0.8, 1)), pulse = 0.04 * Math.sin(u * 30) * k;
      b.r_upper.rotation.x = -0.85 * k; b.r_fore.rotation.x = -0.55 * k;
      b.root1.rotation.x += -0.7 * k; b.root1.rotation.z += -0.2 * k; b.root2.rotation.x += -0.45 * k + pulse; b.root3.rotation.x += -0.4 * k - pulse;
      b.neck.rotation.x = -0.2 * k; b.head.rotation.x += -0.15 * k;
      W.body.position.y = 0.03 * k;
    } },
    'ichor-rain': { label: 'Ichor Rain', dur: 2.2, pose(W, u, t) {
      // "It rains sap from the roots": the root high over him, shaken so the sap falls
      const b = W.bones, k = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1)), sh = Math.sin(u * 40) * seg(u, 0.35, 0.45) * (1 - seg(u, 0.7, 0.8));
      b.root1.rotation.x += -1.8 * k; b.root1.rotation.z += 0.15 * k;
      b.root2.rotation.x += -0.3 * k + 0.12 * sh; b.root3.rotation.x += -0.2 * k - 0.15 * sh; b.root4.rotation.z += 0.2 * sh;
      b.neck.rotation.x = -0.25 * k; b.r_upper.rotation.z -= 0.3 * k;
    } },
    unmaking: { label: 'Unmaking', dur: 2.0, pose(W, u, t) {
      // "The mask turns to one of you, charging": he leans in, head low, the mask thrust forward, root and fist spread wide
      const b = W.bones, k = seg(u, 0.05, 0.45) * (1 - seg(u, 0.8, 1)), tremble = 0.015 * Math.sin(u * 70) * k;
      W.body.position.z = 0.3 * k; b.hips.rotation.x = 0.12 * k; b.chest.rotation.x = 0.15 * k; b.neck.rotation.x = 0.25 * k + tremble;
      b.r_upper.rotation.z -= 0.6 * k; b.r_upper.rotation.x = 0.2 * k; b.root1.rotation.z += 0.55 * k; b.root1.rotation.x += 0.15 * k;
      crouch(W, 0.3 * k);
    } },
    grief: { label: 'Grief', dur: 2.6, pose(W, u, t) {
      // "It weeps sap. Something under the wood says 'Thank you.'": he slumps, head bowed, root hanging, swaying slowly
      const b = W.bones, k = seg(u, 0, 0.35) * (1 - seg(u, 0.85, 1)), sw = Math.sin(u * 7) * k;
      b.chest.rotation.x = 0.15 * k; b.neck.rotation.x = 0.4 * k; b.head.rotation.x += 0.2 * k; b.head.rotation.z = 0.08 * sw;
      b.r_upper.rotation.x = 0.1 * k; b.r_fore.rotation.x = -0.05 * k; b.root1.rotation.z += 0.08 * sw; b.root1.rotation.x += 0.1 * k;
      crouch(W, 0.2 * k); W.body.rotation.z = 0.03 * sw;
    } },
    devour: { label: 'Devour', dur: 1.8, pose(W, u, t) {
      // the charge: he leans in, takes a long stride and the root sweeps up from below
      const b = W.bones, go = seg(u, 0.1, 0.45), back = 1 - seg(u, 0.65, 1), k = go * back;
      W.body.position.z = 0.55 * k;
      b.r_thigh.rotation.x = -0.55 * k; b.r_shin.rotation.x = 0.35 * k; b.l_thigh.rotation.x = 0.35 * k; b.l_shin.rotation.x = 0.25 * k;
      b.hips.rotation.x = 0.15 * k; b.chest.rotation.x = 0.5 * (0.25 * k); b.neck.rotation.x = 0.1 * k;
      b.root1.rotation.x += -0.9 * k; b.root2.rotation.x += -0.5 * k; b.root3.rotation.x += -0.4 * k;
      b.r_upper.rotation.x = -0.7 * k; b.r_fore.rotation.x = -0.6 * k;
      W.body.position.y = -0.06 * k;
    } },
  },
};

// the sapwight: gaunt, hunched, long arms; it shambles, reaches, grips, drinks
const sapwight = {
  key: 'sapwight', name: 'Sapwight', tier: 'Veteran', act: 'Act One, the Heartroot', height: 2.0, weight: 0.8,
  stiff: 0.8, knees: 0.7,           // wound in bark: it bends, but stiffly
  limits: { neck: 0.24, head: 0.4, l_fore: 0.52, r_fore: 0.52, l_shin: 0.55, r_shin: 0.55, spine: 0.8, l_hand: 0.6, r_hand: 0.6 },
  text: 'A ghoul of bark and black sap. It used to be someone the Heartroot drank.',
  lunge: 'sap-leech',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.8);
    b.spine.rotation.x = 0.06; b.chest.rotation.x = 0.08 + 0.02 * Math.sin(t * 1.6); b.neck.rotation.x = 0.1;
    b.r_upper.rotation.x = 0.06 * sw; b.l_upper.rotation.x = -0.06 * sw; b.r_fore.rotation.x = -0.2; b.l_fore.rotation.x = -0.2;
    b.r_hand.rotation.x = 0.1 * Math.sin(t * 1.3); b.l_hand.rotation.x = 0.1 * Math.sin(t * 1.1 + 1);
    W.body.rotation.z = 0.02 * sw;
  },
  moves: {
    'sap-leech': { label: 'Sap Leech', dur: 1.9, pose(W, u, t) {
      // a lurch forward, both hands clamp on, the head dips to drink, then it draws back
      const b = W.bones, go = seg(u, 0.05, 0.3), hold = 1 - seg(u, 0.7, 1), k = go * hold, drink = seg(u, 0.35, 0.5) * hold;
      W.body.position.z = 0.35 * k;
      b.r_thigh.rotation.x = -0.4 * k; b.r_shin.rotation.x = 0.3 * k; b.l_thigh.rotation.x = 0.25 * k;
      b.spine.rotation.x = 0.15 * k; b.chest.rotation.x = 0.2 * k + 0.08 * drink; b.neck.rotation.x = 0.15 * k + 0.25 * drink;
      for (const [n, s] of [['r', -1], ['l', 1]]) {
        b[n + '_upper'].rotation.x = -1.25 * k; b[n + '_upper'].rotation.z = s * -0.25 * k;
        b[n + '_fore'].rotation.x = -0.35 * k - 0.4 * drink; b[n + '_hand'].rotation.x = -0.4 * drink;
      }
      W.body.position.y = -0.04 * k + 0.01 * Math.sin(u * 50) * drink;
    } },
    grasp: { label: 'Grasp', dur: 1.6, pose(W, u, t) {
      // the long arms swing wide and close round you
      const b = W.bones, open = seg(u, 0, 0.3) * (1 - seg(u, 0.3, 0.5)), close = seg(u, 0.32, 0.5) * (1 - seg(u, 0.8, 1));
      for (const [n, s] of [['r', -1], ['l', 1]]) {
        b[n + '_upper'].rotation.x = -0.9 * (open + close); b[n + '_upper'].rotation.z = s * (0.9 * open - 0.3 * close);
        b[n + '_fore'].rotation.x = -0.3 * open - 0.9 * close; b[n + '_fore'].rotation.y = s * 0.5 * close;
        b[n + '_hand'].rotation.x = -0.6 * close;
      }
      b.chest.rotation.x = -0.1 * open + 0.2 * close; b.neck.rotation.x = -0.15 * open + 0.1 * close;
      W.body.position.z = 0.15 * close;
    } },
    'bark-hide': { label: 'Bark Hide', dur: 1.8, pose(W, u, t) {
      // it curls up behind its arms; the bark thickens
      const b = W.bones, k = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
      crouch(W, 0.5 * k);
      b.spine.rotation.x = 0.25 * k; b.chest.rotation.x = 0.25 * k; b.neck.rotation.x = 0.3 * k;
      for (const [n, s] of [['r', -1], ['l', 1]]) {
        b[n + '_upper'].rotation.x = -0.9 * k; b[n + '_upper'].rotation.z = s * -0.35 * k;
        b[n + '_fore'].rotation.x = -1.15 * k; b[n + '_fore'].rotation.y = s * 0.2 * k;
      }
      W.body.position.x = Math.sin(u * 70) * 0.006 * k;
    } },
  },
};

// Old Horn: a troll of the high passes, hunched, his club in his left hand (bones l_hand carries it), one great horn
const oldHorn = {
  key: 'old-horn', name: 'Old Horn', tier: 'Relic-Bearer', act: 'Act Two, the high passes', height: 2.7, weight: 1.6,
  stiff: 0.6, knees: 0.6,
  limits: { neck: 0.12, head: 0.7, spine: 0.35, chest: 0.4, l_shin: 0.3, r_shin: 0.3, l_thigh: 0.5, r_thigh: 0.5, l_fore: 0.55, r_fore: 0.55 },
  text: 'A troll of the high passes, grey-green and mossed like a boulder. Cut it and it grows back; the old ones wear the hides of the young.',
  lunge: 'club',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.7);
    b.spine.rotation.x = 0.05; b.neck.rotation.x = 0.06 + 0.03 * Math.sin(t * 1.4);
    b.r_upper.rotation.x = 0.05 * sw; b.l_upper.rotation.x = -0.04 * sw;
    W.body.rotation.z = 0.015 * sw;
  },
  moves: {
    club: { label: 'Club', dur: 1.6, pose(W, u, t) {
      // the club up over his left shoulder, then down in a great overhead blow
      const b = W.bones, up = seg(u, 0, 0.38) * (1 - seg(u, 0.4, 0.55)), down = seg(u, 0.42, 0.56) * (1 - seg(u, 0.75, 1));
      b.l_upper.rotation.x = -2.0 * up - 0.9 * down; b.l_upper.rotation.z = 0.45 * up + 0.1 * down;
      b.l_fore.rotation.x = -0.9 * up - 0.2 * down;
      b.chest.rotation.x = -0.12 * up + 0.18 * down; b.spine.rotation.x = -0.05 * up + 0.08 * down;
      b.chest.rotation.y = 0.25 * up - 0.2 * down; b.neck.rotation.x = -0.1 * up + 0.1 * down;
      crouch(W, 0.4 * down);
    } },
    pummel: { label: 'Pummel', dur: 1.5, pose(W, u, t) {
      // both fists, one after the other
      const b = W.bones, one = bump(seg(u, 0.05, 0.45)), two = bump(seg(u, 0.4, 0.85));
      b.r_upper.rotation.x = -1.5 * one; b.r_fore.rotation.x = -0.5 * one; b.l_upper.rotation.x = -1.3 * two; b.l_fore.rotation.x = -0.5 * two;
      b.chest.rotation.y = -0.25 * one + 0.25 * two; b.chest.rotation.x = 0.15 * (one + two);
      W.body.position.z = 0.12 * (one + two);
    } },
    'hurl-boulder': { label: 'Hurl Boulder', dur: 2.2, pose(W, u, t) {
      // he heaves both arms overhead, leans back, and throws
      const b = W.bones, lift = seg(u, 0, 0.45) * (1 - seg(u, 0.55, 0.65)), throw_ = seg(u, 0.55, 0.65) * (1 - seg(u, 0.85, 1));
      for (const [n, s] of [['r', -1], ['l', 1]]) { b[n + '_upper'].rotation.x = -2.15 * lift - 1.1 * throw_; b[n + '_upper'].rotation.z = s * 0.35 * lift; b[n + '_fore'].rotation.x = -0.8 * lift; }
      b.spine.rotation.x = -0.25 * lift + 0.3 * throw_; b.chest.rotation.x = -0.2 * lift + 0.25 * throw_;
      crouch(W, 0.3 * lift);
    } },
    'horn-toss': { label: 'Horn Toss', dur: 1.5, pose(W, u, t) {
      // head down, a lunge, and the horn hooks up
      const b = W.bones, dip = seg(u, 0, 0.35) * (1 - seg(u, 0.4, 0.55)), hook = seg(u, 0.4, 0.55) * (1 - seg(u, 0.75, 1));
      b.neck.rotation.x = 0.2 * dip - 0.15 * hook; b.head.rotation.x += 0.55 * dip - 0.6 * hook;     // the head is its own piece: it does the turning
      b.chest.rotation.x = 0.15 * dip - 0.05 * hook; W.body.position.z = 0.3 * (dip + hook);
      b.r_upper.rotation.z -= 0.3 * dip; b.l_upper.rotation.z += 0.3 * dip;
      crouch(W, 0.35 * dip);
    } },
    'mantle-of-trolls': { label: 'Mantle of Trolls', dur: 2.2, pose(W, u, t) {
      // the hides knit over his wounds: he hunches into his cape, then rises and beats his chest
      const b = W.bones, k = seg(u, 0, 0.35) * (1 - seg(u, 0.45, 0.6)), beat = seg(u, 0.5, 0.6) * (1 - seg(u, 0.85, 1));
      crouch(W, 0.5 * k); b.spine.rotation.x = 0.3 * k; b.chest.rotation.x = 0.25 * k; b.neck.rotation.x = 0.1 * k - 0.15 * beat; b.head.rotation.x = 0.15 * k - 0.25 * beat;
      b.r_upper.rotation.x = -0.8 * k - 1.0 * beat; b.r_fore.rotation.x = -0.9 * k - 0.85 * beat;
      b.l_upper.rotation.x = -0.6 * k; b.l_fore.rotation.x = -0.8 * k;
      W.body.position.y += 0.02 * Math.sin(u * 60) * beat;
    } },
  },
};

// the peak-troll (session 8, November 23): Old Horn's troll at 0.9 of his size, grey as stone and mossed; his moves are
// Old Horn's club, pummel and hurl-boulder, and his own Regrow ("The wound closes while you watch: Regenerating.")
const peakTroll = {
  key: 'peak-troll', name: 'Peak-Troll', tier: 'Veteran', act: 'Act Two, the high passes', height: 2.2, weight: 1.5,
  stiff: 0.6, knees: 0.6,
  limits: { ...oldHorn.limits, spine: 0.22, chest: 0.26 },       // his moss mantle is all of a piece down his back: his spine bends less
  text: 'A troll of the high passes, grey-green and mossed like a boulder. Cut it and it grows back.',
  lunge: 'club',
  idle: oldHorn.idle,
  moves: {
    club: oldHorn.moves.club, pummel: oldHorn.moves.pummel, 'hurl-boulder': oldHorn.moves['hurl-boulder'],
    regrow: { label: 'Regrow', dur: 2.0, pose(W, u, t) {
      // he hunches over the wound, shudders as it knits, then straightens and rolls his shoulders
      const b = W.bones, k = seg(u, 0, 0.3) * (1 - seg(u, 0.6, 0.85)), sh = seg(u, 0.2, 0.3) * (1 - seg(u, 0.55, 0.65));
      crouch(W, 0.35 * k); b.spine.rotation.x = 0.25 * k; b.chest.rotation.x = 0.2 * k; b.head.rotation.x = 0.35 * k;
      b.r_upper.rotation.x = -0.5 * k; b.r_fore.rotation.x = -0.9 * k; b.r_upper.rotation.z = 0.25 * k;      // a hand pressed to the wound
      b.chest.rotation.z = 0.04 * Math.sin(u * 70) * sh; W.body.position.x += 0.012 * Math.sin(u * 90) * sh;
      const roll = seg(u, 0.7, 1) * (1 - seg(u, 0.9, 1));
      b.chest.rotation.y = 0.12 * Math.sin(u * 18) * roll; b.head.rotation.y += 0.2 * roll;
    } },
  },
};

// the unmade (session 8, November 23): a thin husk of torn strips, its left hand still closed round the ghost of its
// relic; it moves slowly, as if it has forgotten how, and its moves are M7's own
const unmade = {
  key: 'unmade', name: 'The Unmade', tier: 'Veteran', act: 'Act Three, the Hearth Below', height: 1.8, weight: 0.7,
  stiff: 0.7, knees: 0.7,
  limits: { neck: 0.5, head: 0.8, spine: 0.5, chest: 0.5, l_shin: 0.42, r_shin: 0.42, l_fore: 0.7, r_fore: 0.7 },
  text: 'A relic-bearer the Worldforge unmade: a grey husk still carrying the shape of the thing it held, and still reaching for it.',
  lunge: 'empty-grip',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.5);
    b.spine.rotation.z = 0.03 * sw; b.head.rotation.z = 0.08 * Math.sin(t * 0.37); b.neck.rotation.x = 0.05;
    b.r_upper.rotation.x = 0.04 * Math.sin(t * 0.8); b.r_fore.rotation.x = -0.08 - 0.05 * Math.sin(t * 1.1);   // its empty hand, flexing
    b.l_upper.rotation.x = -0.03 * sw;
  },
  moves: {
    'empty-grip': { label: 'Empty Grip', dur: 1.5, pose(W, u, t) {
      // its right hand comes up and out, open, and closes on you as it closed on the relic
      const b = W.bones, out = seg(u, 0.05, 0.45) * (1 - seg(u, 0.75, 1)), close = seg(u, 0.42, 0.55) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -1.25 * out; b.r_upper.rotation.z = 0.15 * out; b.r_fore.rotation.x = -0.25 * out - 0.6 * close;
      b.spine.rotation.x = 0.12 * out; b.chest.rotation.y = -0.2 * out; b.head.rotation.x = 0.15 * out;
      W.body.position.z = 0.18 * out;
    } },
    'phantom-art': { label: 'Phantom Art', dur: 1.8, pose(W, u, t) {
      // it raises the relic it no longer holds and swings it down across, as it used to
      const b = W.bones, up = seg(u, 0.05, 0.4) * (1 - seg(u, 0.5, 0.65)), swing = seg(u, 0.5, 0.65) * (1 - seg(u, 0.85, 1));
      b.l_upper.rotation.x = -1.6 * up - 0.5 * swing; b.l_upper.rotation.z = -0.3 * up + 0.2 * swing; b.l_fore.rotation.x = 0.3 * up - 0.2 * swing;
      b.chest.rotation.y = 0.25 * up - 0.3 * swing; b.spine.rotation.x = -0.08 * up + 0.15 * swing; b.head.rotation.x = -0.2 * up + 0.15 * swing;
      W.body.position.z = 0.1 * swing;
    } },
    'grey-touch': { label: 'Grey Touch', dur: 1.7, pose(W, u, t) {
      // a slow reach, the palm laid flat on you, its head tilting as if it were listening
      const b = W.bones, k = seg(u, 0.1, 0.55) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -0.95 * k; b.r_upper.rotation.z = -0.15 * k; b.r_fore.rotation.x = -0.35 * k; b.r_hand.rotation.x = 0.5 * k;
      b.head.rotation.z = 0.35 * k; b.head.rotation.x = 0.1 * k; b.spine.rotation.x = 0.08 * k;
      W.body.position.z = 0.1 * k;
    } },
    husk: { label: 'Husk', dur: 1.8, pose(W, u, t) {
      // it goes slack, folds in on itself, nothing in it to hurt, then draws itself up again
      const b = W.bones, k = seg(u, 0, 0.3) * (1 - seg(u, 0.65, 1));
      crouch(W, 0.3 * k); b.spine.rotation.x = 0.3 * k; b.chest.rotation.x = 0.2 * k; b.neck.rotation.x = 0.3 * k; b.head.rotation.x = 0.4 * k;
      b.r_upper.rotation.x = 0.1 * k; b.r_upper.rotation.z = -0.1 * k; b.l_upper.rotation.x = 0.15 * k;
      b.spine.rotation.z = 0.06 * Math.sin(u * 9) * k;
    } },
  },
};

// ---- the wraiths (session 8's polish pass, November 24): each its M7 moves, cloth that hangs and sways on the trunk ----
// the drowned: a coat and a bell, weed for a head; it moves as if under water, slow and swaying
const drowned = {
  key: 'drowned', name: 'The Drowned', tier: 'Veteran', act: 'Act Two, Misthollow', height: 2.0, weight: 0.8,
  stiff: 0.7, knees: 0.6,
  limits: { neck: 0.4, head: 0.8, spine: 0.45, chest: 0.45, l_shin: 0.45, r_shin: 0.45, l_fore: 0.65, r_fore: 0.65, l_hand: 0.6, r_hand: 0.6 },
  text: 'Drowned a thousand years, and still in its coat; where its head was, weed, and lights in the weed.',
  lunge: 'cold-hands',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.6);
    W.body.rotation.z = 0.025 * sw; b.spine.rotation.z = -0.02 * sw; b.head.rotation.z = 0.06 * Math.sin(t * 0.45 + 1);
    b.head.rotation.x = 0.05 * Math.sin(t * 0.7);                                      // the weed drifting as if in a current
    b.l_hand.rotation.z = 0.12 * Math.sin(t * 1.3);                                    // the bell swinging a little
    b.r_upper.rotation.x = 0.05 * Math.sin(t * 0.8 + 2);
  },
  moves: {
    'cold-hands': { label: 'Cold Hands', dur: 1.5, pose(W, u, t) {
      // both hands come up and close on yours
      const b = W.bones, k = seg(u, 0.05, 0.45) * (1 - seg(u, 0.75, 1)), grip = seg(u, 0.4, 0.55) * (1 - seg(u, 0.75, 1));
      b.r_upper.rotation.x = -1.2 * k; b.r_fore.rotation.x = -0.2 * k - 0.4 * grip; b.l_upper.rotation.x = -0.5 * k; b.l_fore.rotation.x = -0.3 * grip;
      b.spine.rotation.x = 0.15 * k; b.head.rotation.x = 0.2 * k; W.body.position.z = 0.15 * k;
    } },
    'drag-down': { label: 'Drag Down', dur: 1.8, pose(W, u, t) {
      // it stoops, takes you by the ankles, and hauls back toward the water
      const b = W.bones, low = seg(u, 0.05, 0.4) * (1 - seg(u, 0.55, 0.8)), haul = seg(u, 0.45, 0.65) * (1 - seg(u, 0.85, 1));
      crouch(W, 0.45 * low); b.spine.rotation.x = 0.4 * low - 0.1 * haul; b.chest.rotation.x = 0.3 * low;
      b.r_upper.rotation.x = -0.7 * low - 0.2 * haul; b.r_fore.rotation.x = -0.5 * haul; b.head.rotation.x = 0.3 * low;
      W.body.position.z = 0.12 * low - 0.15 * haul;
    } },
    toll: { label: 'Toll', dur: 1.7, pose(W, u, t) {
      // it lifts the bell and rings it: under the water a bell tolls for the drowned
      const b = W.bones, up = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), ring = up * Math.sin(u * 40) * seg(u, 0.25, 0.4) * (1 - seg(u, 0.7, 0.8));
      b.l_upper.rotation.x = -0.9 * up; b.l_upper.rotation.z = -0.25 * up; b.l_hand.rotation.z = 0.28 * ring; b.l_fore.rotation.x = -0.3 * up;
      b.head.rotation.x = -0.15 * up; b.head.rotation.z = 0.1 * ring;
    } },
    'black-water': { label: 'Black Water', dur: 1.6, pose(W, u, t) {
      // it doubles over and coughs the channel up all over you
      const b = W.bones, wind = seg(u, 0, 0.3) * (1 - seg(u, 0.35, 0.45)), heave = seg(u, 0.35, 0.5) * (1 - seg(u, 0.8, 1));
      b.spine.rotation.x = -0.12 * wind + 0.4 * heave; b.chest.rotation.x = -0.1 * wind + 0.3 * heave; b.neck.rotation.x = 0.35 * heave;
      b.head.rotation.x = -0.2 * wind + 0.4 * heave; b.r_upper.rotation.x = -0.3 * heave; b.r_upper.rotation.z = 0.2 * heave;
      W.body.position.z = 0.08 * heave;
    } },
  },
};

// the bell-ringer: a shroud on a ring of stones, coral for a head, a crook holding the bell; no hands show, so it moves
// with its whole shroud, gliding, and works the crook
const bellRinger = {
  key: 'bell-ringer', name: 'The Bell-Ringer', tier: 'Veteran', act: 'Act Two, Misthollow', height: 2.1, weight: 0.9,
  stiff: 0.6, knees: 0.3,
  limits: { neck: 0.2, head: 0.5, spine: 0.35, chest: 0.35, hips: 0.5, l_upper: 0.7, l_fore: 0.5, l_hand: 0.6 },
  text: 'A shroud on a ring of stones, coral where its head was, and a bell that answers from under the water.',
  lunge: 'cold-hands',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.5);
    W.body.rotation.z = 0.02 * sw; W.body.position.z = 0.012 * Math.sin(t * 0.9);       // drifting, a little off the ground
    b.head.rotation.z = 0.05 * Math.sin(t * 0.4 + 1); b.l_hand.rotation.x = 0.15 * Math.sin(t * 1.1);   // the bell swinging
  },
  moves: {
    'cold-hands': { label: 'Cold Hands', dur: 1.5, pose(W, u, t) {
      // it surges at you, the shroud bowing forward over you
      const b = W.bones, k = seg(u, 0.05, 0.4) * (1 - seg(u, 0.7, 1));
      b.spine.rotation.x = 0.25 * k; b.chest.rotation.x = 0.25 * k; b.head.rotation.x = 0.3 * k; W.body.position.z = 0.25 * k;
      b.l_upper.rotation.x = -0.3 * k;
    } },
    'drag-down': { label: 'Drag Down', dur: 1.8, pose(W, u, t) {
      // it sinks, and the cloth closes round your feet and pulls
      const b = W.bones, low = seg(u, 0.05, 0.45) * (1 - seg(u, 0.6, 0.9)), pull = seg(u, 0.45, 0.65) * (1 - seg(u, 0.85, 1));
      W.body.position.y -= 0.18 * low; b.spine.rotation.x = 0.2 * low - 0.15 * pull; b.head.rotation.x = 0.25 * low;
      W.body.position.z = 0.1 * low - 0.12 * pull;
    } },
    peal: { label: 'Peal', dur: 1.8, pose(W, u, t) {
      // it hauls on the crook and the bell answers, swinging hard
      const b = W.bones, haul = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), ring = Math.sin(u * 30) * seg(u, 0.25, 0.4) * (1 - seg(u, 0.75, 0.85));
      b.l_upper.rotation.z = 0.35 * haul; b.l_upper.rotation.x = -0.25 * haul; b.l_hand.rotation.x = 0.55 * ring;
      b.chest.rotation.z = -0.1 * haul; b.head.rotation.z = 0.12 * ring;
    } },
    'black-water': { label: 'Black Water', dur: 1.6, pose(W, u, t) {
      // it heaves, and the channel pours out of the ring
      const b = W.bones, wind = seg(u, 0, 0.3) * (1 - seg(u, 0.35, 0.45)), heave = seg(u, 0.35, 0.5) * (1 - seg(u, 0.8, 1));
      b.spine.rotation.x = -0.1 * wind + 0.3 * heave; b.chest.rotation.x = -0.08 * wind + 0.25 * heave; b.head.rotation.x = 0.4 * heave;
      W.body.position.z = 0.1 * heave;
    } },
  },
};

// the drowned choir: a chorister, its hands clasped round the bell; both arms always move together (the hands never part)
const both = (b, ax, v) => { b.r_upper.rotation[ax] = v; b.l_upper.rotation[ax] = ax === 'x' ? v : -v; };
const both2 = (b, ax, v) => { b.r_fore.rotation[ax] = v; b.l_fore.rotation[ax] = ax === 'x' ? v : -v; };
const drownedChoir = {
  key: 'drowned-choir', name: 'The Drowned Choir', tier: 'Veteran', act: 'Act Two, Misthollow', height: 1.95, weight: 0.8,
  stiff: 0.7, knees: 0.5, clasped: true,
  limits: { neck: 0.35, head: 0.7, spine: 0.3, chest: 0.35, l_shin: 0.45, r_shin: 0.45, l_fore: 0.5, r_fore: 0.5, l_upper: 0.6, r_upper: 0.6 },
  text: 'They sing the hymn that has kept something asleep under Misthollow for a thousand years.',
  lunge: 'cold-hands',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.55);
    W.body.rotation.z = 0.02 * sw; b.head.rotation.z = 0.06 * Math.sin(t * 0.4); b.head.rotation.x = -0.04 + 0.04 * Math.sin(t * 0.7);
    both(b, 'x', 0.03 * Math.sin(t * 1.1));                                         // the bell rising and falling with its breath
  },
  moves: {
    'cold-hands': { label: 'Cold Hands', dur: 1.5, pose(W, u, t) {
      // its clasped hands thrust out at you
      const b = W.bones, k = seg(u, 0.05, 0.4) * (1 - seg(u, 0.7, 1));
      both(b, 'x', -0.6 * k); both2(b, 'x', 0.35 * k); b.spine.rotation.x = 0.15 * k; b.head.rotation.x = 0.2 * k; W.body.position.z = 0.2 * k;
    } },
    'the-hymn': { label: 'The Hymn', dur: 2.4, pose(W, u, t) {
      // it lifts its head and sings, swaying, the bell held up before it
      const b = W.bones, k = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), sway = Math.sin(u * 12) * k;
      b.head.rotation.x = -0.35 * k; b.neck.rotation.x = -0.2 * k; b.chest.rotation.x = -0.1 * k;
      both(b, 'x', -0.35 * k); W.body.rotation.z = 0.05 * sway; b.head.rotation.z = 0.08 * sway;
    } },
    toll: { label: 'Toll', dur: 1.7, pose(W, u, t) {
      // it raises the bell and rings it
      const b = W.bones, up = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), ring = up * Math.sin(u * 40) * seg(u, 0.25, 0.4) * (1 - seg(u, 0.7, 0.8));
      both(b, 'x', -0.7 * up); both2(b, 'x', -0.2 * up + 0.12 * ring); b.head.rotation.x = -0.15 * up;
    } },
    'black-water': { label: 'Black Water', dur: 1.6, pose(W, u, t) {
      const b = W.bones, wind = seg(u, 0, 0.3) * (1 - seg(u, 0.35, 0.45)), heave = seg(u, 0.35, 0.5) * (1 - seg(u, 0.8, 1));
      b.spine.rotation.x = -0.1 * wind + 0.35 * heave; b.chest.rotation.x = -0.08 * wind + 0.25 * heave; b.neck.rotation.x = 0.3 * heave;
      b.head.rotation.x = -0.2 * wind + 0.4 * heave; W.body.position.z = 0.08 * heave;
    } },
  },
};

// the drowned cantor: the choir's master, its staff in its left hand; it beats time, and brings the staff down
const drownedCantor = {
  key: 'drowned-cantor', name: 'The Drowned Cantor', tier: 'Relic-Bearer', act: 'Act Two, Misthollow', height: 2.1, weight: 0.9,
  stiff: 0.65, knees: 0.5,
  limits: { neck: 0.35, head: 0.7, spine: 0.3, chest: 0.35, l_shin: 0.45, r_shin: 0.45, l_fore: 0.55, r_fore: 0.5, l_upper: 0.7, r_upper: 0.6, l_hand: 0.6 },
  text: 'The choir\'s master, drowned with it; it still beats time on the flagstones with its staff.',
  lunge: 'cold-hands',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.5);
    W.body.rotation.z = 0.02 * sw; b.head.rotation.z = 0.05 * Math.sin(t * 0.4); b.l_upper.rotation.x = 0.04 * Math.sin(t * 0.9);
  },
  moves: {
    'cold-hands': { label: 'Cold Hands', dur: 1.5, pose(W, u, t) {
      // its free hand comes out of the cope and closes on yours
      const b = W.bones, k = seg(u, 0.05, 0.45) * (1 - seg(u, 0.75, 1)), grip = seg(u, 0.4, 0.55) * (1 - seg(u, 0.75, 1));
      b.r_upper.rotation.x = -1.1 * k; b.r_fore.rotation.x = -0.25 * k - 0.35 * grip; b.spine.rotation.x = 0.12 * k; b.head.rotation.x = 0.15 * k;
      W.body.position.z = 0.15 * k;
    } },
    'drag-down': { label: 'Drag Down', dur: 1.8, pose(W, u, t) {
      const b = W.bones, low = seg(u, 0.05, 0.4) * (1 - seg(u, 0.55, 0.8)), haul = seg(u, 0.45, 0.65) * (1 - seg(u, 0.85, 1));
      crouch(W, 0.35 * low); b.spine.rotation.x = 0.18 * low - 0.06 * haul; b.chest.rotation.x = 0.22 * low;
      b.r_upper.rotation.x = -0.7 * low - 0.2 * haul; b.r_fore.rotation.x = -0.5 * haul; b.head.rotation.x = 0.25 * low;
      W.body.position.z = 0.1 * low - 0.12 * haul;
    } },
    'the-hymn': { label: 'The Hymn', dur: 2.4, pose(W, u, t) {
      // it lifts its masked face and leads the hymn, the staff held up
      const b = W.bones, k = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), sway = Math.sin(u * 12) * k;
      b.head.rotation.x = -0.3 * k; b.neck.rotation.x = -0.15 * k; b.l_upper.rotation.x = -0.35 * k; b.r_upper.rotation.x = -0.3 * k; b.r_upper.rotation.z = 0.25 * k;
      W.body.rotation.z = 0.04 * sway; b.head.rotation.z = 0.07 * sway;
    } },
    'beat-time': { label: 'Beat Time', dur: 2.0, pose(W, u, t) {
      // it beats time on the flagstones with the staff, and the choir sings faster
      const b = W.bones, k = seg(u, 0.05, 0.2) * (1 - seg(u, 0.85, 1)), beat = Math.max(0, Math.sin(u * 26)) * k;
      b.l_upper.rotation.x = -0.25 * k + 0.2 * beat; b.l_fore.rotation.x = 0.15 * beat; b.head.rotation.x = 0.1 * beat; W.body.position.y -= 0.015 * beat;
    } },
    downbeat: { label: 'Downbeat', dur: 1.8, pose(W, u, t) {
      // it lifts the Cantor's Staff high and brings it down on the downbeat: the whole drowned hall rings with it
      const b = W.bones, up = seg(u, 0.05, 0.4) * (1 - seg(u, 0.45, 0.55)), down = seg(u, 0.45, 0.55) * (1 - seg(u, 0.8, 1));
      b.l_upper.rotation.x = -1.1 * up + 0.25 * down; b.l_upper.rotation.z = -0.25 * up; b.l_fore.rotation.x = -0.4 * up;
      b.chest.rotation.x = -0.12 * up + 0.2 * down; b.spine.rotation.x = 0.12 * down; b.head.rotation.x = -0.2 * up + 0.2 * down;
      crouch(W, 0.25 * down);
    } },
  },
};

// the drowned abbess: tier on tier of habit, the Drowned Censer in her left hand; her long veil rides her head, so her head
// turns only a little
const drownedAbbess = {
  key: 'drowned-abbess', name: 'The Drowned Abbess', tier: 'Relic-Bearer', act: 'Act Three, Frostmere', height: 1.9, weight: 1.0,
  stiff: 0.6, knees: 0.35,
  limits: { neck: 0.25, head: 0.3, spine: 0.3, chest: 0.35, l_shin: 0.4, r_shin: 0.4, l_fore: 0.5, r_fore: 0.5, l_upper: 0.6, r_upper: 0.6, l_hand: 0.28 },
  text: 'She says the last rites over her choir, as she did every night for thirty years.',
  lunge: 'drowned-grasp',
  idle(W, t) {
    const b = W.bones, sw = Math.sin(t * 0.5);
    W.body.rotation.z = 0.015 * sw; W.body.position.z = 0.01 * Math.sin(t * 0.8);
    b.l_hand.rotation.x = 0.12 * Math.sin(t * 1.0); b.l_hand.rotation.z = 0.06 * Math.sin(t * 0.7);   // the censer swaying on its chain
  },
  moves: {
    'drowned-grasp': { label: 'Drowned Grasp', dur: 1.6, pose(W, u, t) {
      // a hand as cold as the lake-bed comes out of her sleeve and closes on yours
      const b = W.bones, k = seg(u, 0.05, 0.45) * (1 - seg(u, 0.75, 1)), grip = seg(u, 0.4, 0.55) * (1 - seg(u, 0.75, 1));
      b.r_upper.rotation.x = -1.1 * k; b.r_fore.rotation.x = -0.2 * k - 0.35 * grip; b.spine.rotation.x = 0.12 * k; W.body.position.z = 0.18 * k;
    } },
    dirge: { label: 'Dirge', dur: 2.4, pose(W, u, t) {
      // she lifts her weeping face and sings the office for the drowned, the censer swinging slow
      const b = W.bones, k = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1));
      b.head.rotation.x = -0.35 * k; b.neck.rotation.x = -0.2 * k; b.chest.rotation.x = -0.1 * k;
      b.l_hand.rotation.x = 0.3 * Math.sin(u * 9) * k; W.body.rotation.z = 0.03 * Math.sin(u * 7) * k;
    } },
    'pull-under': { label: 'Pull Under', dur: 1.9, pose(W, u, t) {
      // she sinks, and reaches up out of the ice for your ankles
      const b = W.bones, low = seg(u, 0.05, 0.4) * (1 - seg(u, 0.55, 0.85)), pull = seg(u, 0.45, 0.65) * (1 - seg(u, 0.85, 1));
      W.body.position.y -= 0.16 * low; b.spine.rotation.x = 0.2 * low; b.chest.rotation.x = 0.2 * low; b.r_upper.rotation.x = -0.8 * low - 0.2 * pull;
      b.r_fore.rotation.x = -0.5 * pull; W.body.position.z = 0.15 * low - 0.15 * pull;
    } },
    'last-rites': { label: 'Last Rites', dur: 2.4, pose(W, u, t) {
      // she raises the censer over her drowned choir and swings it in blessing
      const b = W.bones, up = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), sw = Math.sin(u * 14) * up;
      b.l_upper.rotation.x = -0.75 * up; b.l_upper.rotation.z = -0.15 * up; b.l_fore.rotation.x = -0.2 * up; b.l_hand.rotation.z = 0.35 * sw;
      b.r_upper.rotation.x = -0.4 * up; b.head.rotation.x = 0.2 * up;
    } },
    'censer-swing': { label: 'Censer Swing', dur: 1.8, pose(W, u, t) {
      // the Drowned Censer swings out at you in a great arc, and the smoke smells of lake-water
      const b = W.bones, back = seg(u, 0.05, 0.35) * (1 - seg(u, 0.4, 0.55)), out = seg(u, 0.42, 0.58) * (1 - seg(u, 0.8, 1));
      b.l_upper.rotation.x = 0.35 * back - 1.0 * out; b.l_upper.rotation.z = -0.2 * out; b.l_hand.rotation.x = 0.22 * back - 0.28 * out;
      b.chest.rotation.y = -0.2 * back + 0.25 * out; b.spine.rotation.y = -0.08 * back + 0.1 * out; W.body.position.z = 0.12 * out;
    } },
  },
};

// the choir-wraith: a chorister of Frostmere, still singing; it floats, and holds its hymnal in both hands
const choirWraith = {
  key: 'choir-wraith', name: 'The Choir-Wraith', tier: 'Veteran', act: 'Act Three, Frostmere', height: 1.95, weight: 0.7,
  stiff: 0.7, knees: 0.2, clasped: true,
  limits: { neck: 0.22, head: 0.5, spine: 0.3, chest: 0.35, hips: 0.4, l_fore: 0.5, r_fore: 0.5, l_upper: 0.6, r_upper: 0.6 },
  text: 'It sings one long note under the ice, and the cold gets into you.',
  lunge: 'drowned-grasp',
  idle(W, t) {
    const b = W.bones;
    W.body.position.y = 0.04 * Math.sin(t * 0.9); W.body.rotation.z = 0.02 * Math.sin(t * 0.5);      // floating, bobbing
    b.head.rotation.x = -0.05 + 0.04 * Math.sin(t * 0.7); b.r_upper.rotation.x = 0.03 * Math.sin(t * 1.1);
  },
  moves: {
    'drowned-grasp': { label: 'Drowned Grasp', dur: 1.6, pose(W, u, t) {
      // it lunges, the hymnal thrust out, and the cold closes on you
      const b = W.bones, k = seg(u, 0.05, 0.4) * (1 - seg(u, 0.7, 1));
      b.r_upper.rotation.x = -0.5 * k; b.r_fore.rotation.x = 0.3 * k; b.spine.rotation.x = 0.2 * k; b.head.rotation.x = 0.2 * k;
      W.body.position.z = 0.25 * k;
    } },
    'the-note': { label: 'The Note', dur: 2.4, pose(W, u, t) {
      // it lifts its face and sings one long note under the ice
      const b = W.bones, k = seg(u, 0.05, 0.3) * (1 - seg(u, 0.8, 1)), q = Math.sin(u * 40) * k;
      b.head.rotation.x = -0.4 * k; b.neck.rotation.x = -0.2 * k; b.chest.rotation.x = -0.12 * k; b.r_upper.rotation.x = -0.3 * k;
      W.body.position.y += 0.06 * k; b.head.rotation.z = 0.02 * q;
    } },
    dirge: { label: 'Dirge', dur: 2.4, pose(W, u, t) {
      // it sings the office for the drowned, swaying over the hymnal
      const b = W.bones, k = seg(u, 0.05, 0.25) * (1 - seg(u, 0.85, 1)), sw = Math.sin(u * 10) * k;
      b.head.rotation.x = 0.2 * k; b.spine.rotation.x = 0.1 * k; W.body.rotation.z = 0.05 * sw; b.head.rotation.z = 0.08 * sw;
    } },
  },
};

export const FOES = { rotwarden, sapwight, 'old-horn': oldHorn, 'peak-troll': peakTroll, unmade, drowned, 'bell-ringer': bellRinger, 'drowned-choir': drownedChoir, 'drowned-cantor': drownedCantor, 'drowned-abbess': drownedAbbess, 'choir-wraith': choirWraith };
export const COMMON = [['idle', 'Breathe', 0], ['walk', 'Walk', 0], ['hurt', 'Hit', 0.9], ['ko', 'Fall', 2.6]];
