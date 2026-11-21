// The walkers and their moves (session 8). Each move is named for the M7 move it plays (game/src/data/foes.js);
// `pose(W, u, t, step)` runs after the breathing and resting pose are set, u 0..1 through the move.
import { tools } from './walker.js';
const { ease, bump, seg, crouch, roots } = tools;

// the Rotwarden: his left arm is one great root (bones root1..root4), his right a plated arm with a bark fist
const rotwarden = {
  key: 'rotwarden', name: 'The Rotwarden', tier: 'Champion', act: 'Act One, the Heartroot', height: 2.5, weight: 1.4,
  stiff: 0.45, knees: 0.6,          // plate armour: his trunk barely twists, his knees fold only so far
  limits: { hips: 0.6, spine: 0.4, chest: 0.7, l_shin: 0.36, r_shin: 0.36, l_thigh: 0.55, r_thigh: 0.55, root2: 0.7, root3: 0.8, l_foot: 0.7, r_foot: 0.7 },
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
  limits: { neck: 0.24, head: 0.4, l_fore: 0.52, r_fore: 0.52, l_shin: 0.55, r_shin: 0.55, spine: 0.8 },
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
      b.chest.rotation.x = -0.18 * up + 0.3 * down; b.spine.rotation.x = -0.08 * up + 0.15 * down;
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
      b.neck.rotation.x = 0.5 * dip - 0.45 * hook; b.head.rotation.x += 0.3 * dip - 0.3 * hook;
      b.chest.rotation.x = 0.3 * dip - 0.1 * hook; W.body.position.z = 0.3 * (dip + hook);
      b.r_upper.rotation.z -= 0.3 * dip; b.l_upper.rotation.z += 0.3 * dip;
      crouch(W, 0.35 * dip);
    } },
    'mantle-of-trolls': { label: 'Mantle of Trolls', dur: 2.2, pose(W, u, t) {
      // the hides knit over his wounds: he hunches into his cape, then rises and beats his chest
      const b = W.bones, k = seg(u, 0, 0.35) * (1 - seg(u, 0.45, 0.6)), beat = seg(u, 0.5, 0.6) * (1 - seg(u, 0.85, 1));
      crouch(W, 0.5 * k); b.spine.rotation.x = 0.3 * k; b.chest.rotation.x = 0.25 * k; b.neck.rotation.x = 0.2 * k - 0.35 * beat;
      b.r_upper.rotation.x = -0.8 * k - 1.0 * beat; b.r_fore.rotation.x = -1.2 * k - 1.4 * beat;
      b.l_upper.rotation.x = -0.6 * k; b.l_fore.rotation.x = -0.8 * k;
      W.body.position.y += 0.02 * Math.sin(u * 60) * beat;
    } },
  },
};

export const FOES = { rotwarden, sapwight, 'old-horn': oldHorn };
export const COMMON = [['idle', 'Breathe', 0], ['walk', 'Walk', 0], ['hurt', 'Hit', 0.9], ['ko', 'Fall', 2.6]];
