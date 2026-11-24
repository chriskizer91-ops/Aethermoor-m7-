// Moves for the iron and forge foes in full detail (the foe kit, November 24, the polish pass), posed by bone name:
// hips (the root), spine, chest, neck, head; r_/l_ upper, fore, hand; r_/l_ thigh, shin, foot; and what a foe carries
// (cape). Their plates are rigid pieces on one bone each, so a pose may bend a joint far without stretching anything.
// Each foe's own moves keep M7's names (game/src/data/foes.js, as Models' prototypes/armoured named them), so the
// Fight's moments find them. Pure poses of u (0..1 through the move) and t (the clock).
// three.js axes: +z forward, +x his left, +y up. rotation.x < 0 swings a hanging limb forward (and a raised forearm
// back); rotation.z < 0 swings his right arm out to his right, > 0 his left arm out to his left.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x) => Math.sin(Math.max(0, Math.min(1, x)) * Math.PI);
const seg = (u, a, b) => ease((u - a) / (b - a));
const NOOP = { rotation: { x: 0, y: 0, z: 0, set() {} }, position: { x: 0, y: 0, z: 0, set() {}, copy() {} }, scale: { set() {} }, userData: { p0: { x: 0, y: 0, z: 0 } } };

function reset(F) {
  for (const b of Object.values(F.bones)) { b.rotation.set(0, 0, 0); b.position.copy(b.userData.p0); b.scale.set(1, 1, 1); }
  F.body.position.set(0, 0, 0); F.body.rotation.set(0, 0, 0);
}
// the knees bend, the hips drop, the feet stay (roughly) planted
function crouch(F, b, k) {
  for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -0.5 * k; b[n + '_shin'].rotation.x = 0.95 * k; b[n + '_foot'].rotation.x = -0.45 * k; }
  F.body.position.y = -0.1 * k * (F.height / 2);
  b.hips.rotation.x = 0.06 * k;
}
function legs(b, step, amp = 1) {
  for (const [k, ph0] of [['r', 0], ['l', Math.PI]]) {
    const ph = step + ph0, s = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    b[k + '_thigh'].rotation.x = -0.32 * s * amp - 0.2 * lift * amp;
    b[k + '_shin'].rotation.x = 0.5 * lift * amp;
    b[k + '_foot'].rotation.x = -0.2 * lift * amp + 0.1 * s * amp;
  }
}

// ---- the knights (the Ashen Warden, the Iron Sentinel, the Sentinel-Captain) -------------------------------------
// At rest the Warden's sword is raised in his right fist (forearm up) and his shield is before him on his left
// forearm (forearm forward), as the sheet draws him.
function knightBase(F, b, t) {
  const br = Math.sin(t * 1.4);
  b.chest.rotation.x = 0.012 * br; b.head.rotation.y = 0.12 * Math.sin(t * 0.4); b.head.rotation.x = 0.02 * br;
  b.r_upper.rotation.x = 0.03 * br; b.l_upper.rotation.x = -0.02 * br; b.cape.rotation.x = 0.02 * Math.sin(t * 0.9);
}
const KNIGHT = {
  walk(F, b, u, t, step) {
    legs(b, step, 0.9); F.body.position.y = 0.025 * Math.abs(Math.cos(step)) * F.height / 2;
    b.hips.rotation.y = 0.06 * Math.sin(step); b.chest.rotation.y = -0.07 * Math.sin(step); b.hips.rotation.z = 0.025 * Math.sin(step);
    b.r_upper.rotation.x = 0.12 * Math.sin(step); b.l_upper.rotation.x = -0.1 * Math.sin(step);
    b.cape.rotation.x = 0.12 + 0.06 * Math.sin(step * 2);
  },
  // a two-handed overhead blow: the sword goes back over his shoulder, then down on you
  strike(F, b, u) {
    const up = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), down = seg(u, 0.38, 0.52) * (1 - seg(u, 0.78, 1));
    b.r_upper.rotation.x = -2.1 * up - 1.0 * down; b.r_fore.rotation.x = 1.15 * up - 1.3 * down; b.r_upper.rotation.z = 0.15 * up;
    b.chest.rotation.x = -0.12 * up + 0.22 * down; b.chest.rotation.y = 0.25 * up - 0.2 * down; b.spine.rotation.x = 0.08 * down;
    b.l_upper.rotation.x = 0.15 * up - 0.2 * down;
    for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -0.25 * down; b[n + '_shin'].rotation.x = 0.35 * down; b[n + '_foot'].rotation.x = -0.1 * down; }
    F.body.position.z = 0.12 * down * F.height / 2; F.body.position.y = -0.04 * down;
  },
  // a wide sweep from his right to his left, the blade level
  sweep(F, b, u) {
    const wind = seg(u, 0, 0.3) * (1 - seg(u, 0.32, 0.45)), cut = seg(u, 0.32, 0.6) * (1 - seg(u, 0.8, 1));
    b.r_upper.rotation.x = -1.1 * wind - 1.2 * cut; b.r_upper.rotation.z = -0.9 * wind + 0.35 * cut; b.r_fore.rotation.x = -1.3 * (wind + cut);
    b.chest.rotation.y = -0.55 * wind + 0.6 * cut; b.spine.rotation.y = -0.2 * wind + 0.25 * cut; b.hips.rotation.y = -0.1 * wind + 0.12 * cut;
    b.l_upper.rotation.x = 0.1 * cut; crouch(F, b, 0.25 * (wind + cut));
  },
  // the shield brought up before his face, braced
  guard(F, b, u) {
    const g = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
    b.l_upper.rotation.x = -0.75 * g; b.l_upper.rotation.z = -0.25 * g; b.l_fore.rotation.x = -0.35 * g;
    b.r_upper.rotation.x = 0.25 * g; b.chest.rotation.x = 0.08 * g; b.head.rotation.x = 0.1 * g; crouch(F, b, 0.35 * g);
  },
  // the sword raised high, calling
  raise(F, b, u) {
    const r = seg(u, 0, 0.35) * (1 - seg(u, 0.82, 1));
    b.r_upper.rotation.x = -1.55 * r; b.r_upper.rotation.z = -0.15 * r; b.r_fore.rotation.x = -1.35 * r;
    b.chest.rotation.x = -0.1 * r; b.head.rotation.x = -0.25 * r; b.l_upper.rotation.x = 0.1 * r;
  },
  hurt(F, b, u) {
    const a = bump(u * 1.6) * (1 - seg(u, 0.6, 1)), sh = Math.sin(u * 40) * a;
    F.body.position.z = -0.12 * a; b.spine.rotation.x = -0.1 * a; b.chest.rotation.x = -0.1 * a; b.head.rotation.x = -0.25 * a;
    b.head.rotation.z = 0.15 * a; b.hips.rotation.z = 0.04 * sh; b.r_upper.rotation.x = -0.3 * a; b.l_upper.rotation.x = -0.35 * a;
    b.cape.rotation.x = 0.2 * a;
  },
  // the knees give, he sinks onto them, then topples forward, the head last
  ko(F, b, u) {
    const knees = seg(u, 0, 0.35), fall = seg(u, 0.38, 0.85), drop = seg(u, 0.7, 1), H = F.height / 2.2;
    for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -0.9 * knees; b[n + '_shin'].rotation.x = 1.5 * knees; b[n + '_foot'].rotation.x = -0.5 * knees; }
    F.body.position.y = -0.36 * knees * H - 0.12 * fall * H; F.body.position.z = 0.1 * knees + 0.62 * fall * H;
    F.body.rotation.x = 1.3 * fall; b.hips.rotation.x = 0.1 * knees;
    b.neck.rotation.x = 0.35 * drop; b.head.rotation.z = 0.25 * drop;
    b.r_upper.rotation.x = -0.9 * fall; b.r_fore.rotation.x = -1.2 * fall; b.l_upper.rotation.x = -0.8 * fall;
    b.cape.rotation.x = -0.4 * fall;
  },
};

// the Ashen Warden's own (M7: ash-blade, ember-sweep, ward-of-ash, call-the-watch, command-of-cinders,
// scorch-the-vault, watch-unbroken)
const WARDEN = {
  MOVES: [['idle', 'Stand Watch'], ['walk', 'March'], ['ash-blade', 'Ash Blade'], ['ember-sweep', 'Ember Sweep'],
    ['ward-of-ash', 'Ward of Ash'], ['call-the-watch', 'Call the Watch'], ['command-of-cinders', 'Command of Cinders'],
    ['scorch-the-vault', 'Scorch the Vault'], ['watch-unbroken', 'Watch Unbroken'], ['hurt', 'Hit'], ['ko', 'Fall']],
  DUR: { 'ash-blade': 1.2, 'ember-sweep': 1.3, 'ward-of-ash': 1.4, 'call-the-watch': 1.6, 'command-of-cinders': 1.5,
    'scorch-the-vault': 1.8, 'watch-unbroken': 1.6, hurt: 0.8, ko: 2.4 },
  LUNGE: 'ash-blade',
  ALIAS: { strike: 'ash-blade', bite: 'ash-blade', swipe: 'ember-sweep', cast: 'command-of-cinders', roar: 'scorch-the-vault' },
  base: knightBase,
  moves: {
    walk: KNIGHT.walk, 'ash-blade': KNIGHT.strike, 'ember-sweep': KNIGHT.sweep, 'ward-of-ash': KNIGHT.guard,
    'command-of-cinders': KNIGHT.raise, hurt: KNIGHT.hurt, ko: KNIGHT.ko,
    // he drives his sword point-down before him and kneels to it: the watch rises
    'call-the-watch'(F, b, u) {
      const k = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1)), plant = seg(u, 0.15, 0.4) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -0.55 * plant; b.r_fore.rotation.x = -2.3 * plant; b.chest.rotation.x = 0.18 * k;
      b.head.rotation.x = 0.2 * k; b.l_upper.rotation.x = 0.2 * k;
      b.l_thigh.rotation.x = -1.1 * k; b.l_shin.rotation.x = 0.7 * k; b.l_foot.rotation.x = 0.3 * k;
      b.r_thigh.rotation.x = 0.35 * k; b.r_shin.rotation.x = 1.25 * k; b.r_foot.rotation.x = -0.55 * k;
      F.body.position.y = -0.3 * k * F.height / 2.2;
    },
    // both arms up, the sword and the Aegis, the vault burning round him
    'scorch-the-vault'(F, b, u) {
      KNIGHT.raise(F, b, u);
      const r = seg(u, 0, 0.4) * (1 - seg(u, 0.85, 1)), slam = seg(u, 0.55, 0.65) * (1 - seg(u, 0.85, 1));
      b.l_upper.rotation.x = -1.3 * r; b.l_upper.rotation.z = -0.3 * r; b.l_fore.rotation.x = 0.2 * r;
      b.head.rotation.x = -0.35 * r + 0.3 * slam; b.chest.rotation.x = -0.15 * r + 0.25 * slam; crouch(F, b, 0.3 * slam);
    },
    // the Aegis set before him and the sword laid over its rim: he will not be moved
    'watch-unbroken'(F, b, u) {
      KNIGHT.guard(F, b, u);
      const g = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -0.75 * g; b.r_upper.rotation.z = 0.25 * g; b.r_fore.rotation.x = -1.2 * g; b.chest.rotation.y = 0.15 * g;
    },
  },
};

// the Iron Sentinels (M7: iron-fist, gate-slam, lock-shields; the Captain also ironwall, shield-rush). At rest the
// Sentinel's fists hang and its round shield is on its left forearm; the Captain's right fist is raised before his
// chest (forearm up) and Ironwall stands before him on his left.
function sentinelSet(captain) {
  const punch = (F, b, u) => {
    const back = seg(u, 0, 0.3) * (1 - seg(u, 0.32, 0.42)), hit = seg(u, 0.34, 0.48) * (1 - seg(u, 0.75, 1));
    if (captain) { b.r_upper.rotation.x = 0.35 * back - 1.35 * hit; b.r_fore.rotation.x = -0.3 * back + 2.6 * hit; }
    else { b.r_upper.rotation.x = 0.45 * back - 1.45 * hit; b.r_fore.rotation.x = -0.9 * back - 0.05 * hit; }
    b.chest.rotation.y = 0.3 * back - 0.35 * hit; b.spine.rotation.y = 0.1 * back - 0.12 * hit; b.chest.rotation.x = 0.12 * hit;
    for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -0.2 * hit; b[n + '_shin'].rotation.x = 0.3 * hit; b[n + '_foot'].rotation.x = -0.1 * hit; }
    F.body.position.z = 0.15 * hit * F.height / 2;
  };
  // the shield driven into you, the whole body behind it
  const slam = (F, b, u) => {
    const wind = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), hit = seg(u, 0.38, 0.55) * (1 - seg(u, 0.8, 1));
    b.l_upper.rotation.x = 0.2 * wind - 0.75 * hit; b.l_upper.rotation.z = -0.15 * hit; b.l_fore.rotation.x = -0.3 * hit;
    b.chest.rotation.y = 0.35 * wind - 0.45 * hit; b.spine.rotation.y = 0.12 * wind - 0.15 * hit; b.chest.rotation.x = 0.15 * hit;
    crouch(F, b, 0.3 * wind + 0.2 * hit); F.body.position.z = 0.22 * hit * F.height / 2;
  };
  // shield up before it and set: it braces behind it
  const lock = (F, b, u) => {
    const g = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
    b.l_upper.rotation.x = -0.6 * g; b.l_upper.rotation.z = -0.35 * g; b.l_fore.rotation.x = -0.4 * g;
    b.chest.rotation.x = 0.1 * g; b.head.rotation.x = 0.08 * g; crouch(F, b, 0.45 * g);
    if (!captain) { b.r_upper.rotation.x = -0.3 * g; b.r_fore.rotation.x = -0.7 * g; }
  };
  const S = {
    MOVES: [['idle', 'Keep the Stair'], ['walk', 'March'], ['iron-fist', 'Iron Fist'], ['gate-slam', 'Gate Slam'], ['lock-shields', 'Lock Shields']],
    DUR: { 'iron-fist': 1.0, 'gate-slam': 1.3, 'lock-shields': 1.4, hurt: 0.8, ko: 2.4 },
    LUNGE: 'iron-fist',
    ALIAS: { strike: 'iron-fist', bite: 'iron-fist', swipe: 'gate-slam', cast: 'lock-shields', roar: 'lock-shields' },
    base(F, b, t) {
      const br = Math.sin(t * 1.3);
      b.chest.rotation.x = 0.01 * br; b.head.rotation.y = 0.1 * Math.sin(t * 0.35); b.head.rotation.x = 0.015 * br;
      b.r_upper.rotation.x = 0.02 * br; b.l_upper.rotation.x = -0.02 * br;
    },
    moves: { walk: KNIGHT.walk, 'iron-fist': punch, 'gate-slam': slam, 'lock-shields': lock, hurt: KNIGHT.hurt, ko: KNIGHT.ko },
  };
  if (captain) {
    S.MOVES = [...S.MOVES, ['ironwall', 'Ironwall'], ['shield-rush', 'Shield Rush']];
    Object.assign(S.DUR, { ironwall: 1.6, 'shield-rush': 1.4 });
    S.ALIAS.roar = 'ironwall';
    // Ironwall raised high, then brought down before him like a portcullis, and he sets behind it
    S.moves.ironwall = (F, b, u) => {
      const up = seg(u, 0, 0.4) * (1 - seg(u, 0.45, 0.58)), down = seg(u, 0.45, 0.6) * (1 - seg(u, 0.85, 1));
      b.l_upper.rotation.x = -1.5 * up - 0.45 * down; b.l_upper.rotation.z = -0.25 * (up + down); b.l_fore.rotation.x = -0.2 * up - 0.35 * down;
      b.chest.rotation.x = -0.1 * up + 0.18 * down; b.head.rotation.x = -0.15 * up + 0.1 * down; crouch(F, b, 0.55 * down);
    };
    // head down behind Ironwall, he charges
    S.moves['shield-rush'] = (F, b, u) => {
      const go = seg(u, 0.1, 0.45) * (1 - seg(u, 0.8, 1)), run = Math.sin(u * Math.PI * 4) * go;
      b.l_upper.rotation.x = -0.6 * go; b.l_upper.rotation.z = -0.3 * go; b.l_fore.rotation.x = -0.35 * go;
      b.chest.rotation.x = 0.22 * go; b.spine.rotation.x = 0.1 * go; b.head.rotation.x = 0.12 * go;
      legs(b, u * Math.PI * 4, 0.9 * go); F.body.position.z = 0.6 * go * F.height / 2;
    };
  }
  S.MOVES = [...S.MOVES, ['hurt', 'Hit'], ['ko', 'Fall']];
  return S;
}

// the forgeborn and their kin (M7: molten-fist, slag-spit, stoke; the Bellows also bellows-blast, blow-sparks).
// At rest their fists hang.
function forgeSet(extra = {}) {
  const fist = (F, b, u) => {
    const back = seg(u, 0, 0.3) * (1 - seg(u, 0.32, 0.42)), hit = seg(u, 0.34, 0.48) * (1 - seg(u, 0.75, 1));
    b.r_upper.rotation.x = 0.5 * back - 1.5 * hit; b.r_fore.rotation.x = -1.0 * back - 0.1 * hit; b.r_upper.rotation.z = -0.1 * back;
    b.chest.rotation.y = 0.35 * back - 0.4 * hit; b.spine.rotation.y = 0.1 * back - 0.12 * hit; b.chest.rotation.x = 0.15 * hit;
    b.l_upper.rotation.x = 0.3 * hit;
    for (const n of ['r', 'l']) { b[n + '_thigh'].rotation.x = -0.22 * hit; b[n + '_shin'].rotation.x = 0.32 * hit; b[n + '_foot'].rotation.x = -0.1 * hit; }
    F.body.position.z = 0.16 * hit * F.height / 2;
  };
  // it rears back, then heaves forward and spits slag from its head
  const spit = (F, b, u) => {
    const rear = seg(u, 0, 0.4) * (1 - seg(u, 0.42, 0.55)), out = seg(u, 0.42, 0.56) * (1 - seg(u, 0.82, 1));
    b.chest.rotation.x = -0.2 * rear + 0.3 * out; b.spine.rotation.x = -0.08 * rear + 0.12 * out;
    b.neck.rotation.x = -0.25 * rear + 0.3 * out; b.head.rotation.x = -0.2 * rear + 0.2 * out;
    b.r_upper.rotation.z = -0.25 * rear; b.l_upper.rotation.z = 0.25 * rear; b.r_upper.rotation.x = 0.3 * out; b.l_upper.rotation.x = 0.3 * out;
    crouch(F, b, 0.2 * out);
  };
  // fists brought to its chest, hunched: the fire inside it stoked
  const stoke = (F, b, u) => {
    const g = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1)), throb = Math.sin(u * Math.PI * 6) * g;
    for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.x = -0.75 * g; b[k + '_upper'].rotation.z = s * 0.25 * g; b[k + '_fore'].rotation.x = -1.4 * g; }
    b.chest.rotation.x = 0.18 * g + 0.03 * throb; b.head.rotation.x = 0.2 * g; crouch(F, b, 0.3 * g);
  };
  const S = {
    MOVES: [['idle', 'Smoulder'], ['walk', 'Trudge'], ['molten-fist', 'Molten Fist'], ['slag-spit', 'Slag Spit'], ['stoke', 'Stoke'], ...(extra.MOVES || [])],
    DUR: { 'molten-fist': 1.0, 'slag-spit': 1.2, stoke: 1.4, hurt: 0.8, ko: 2.4, ...(extra.DUR || {}) },
    LUNGE: 'molten-fist',
    ALIAS: { strike: 'molten-fist', bite: 'molten-fist', swipe: 'molten-fist', cast: 'stoke', roar: 'slag-spit', ...(extra.ALIAS || {}) },
    base(F, b, t) {
      const br = Math.sin(t * 1.2);
      b.chest.rotation.x = 0.015 * br; b.head.rotation.y = 0.12 * Math.sin(t * 0.4); b.head.rotation.x = 0.02 * br;
      b.r_upper.rotation.x = 0.03 * br; b.l_upper.rotation.x = -0.03 * br; b.r_upper.rotation.z = -0.03; b.l_upper.rotation.z = 0.03;
      if (extra.base) extra.base(F, b, t);
    },
    moves: { walk: KNIGHT.walk, 'molten-fist': fist, 'slag-spit': spit, stoke, hurt: KNIGHT.hurt, ko: KNIGHT.ko, ...(extra.moves || {}) },
  };
  S.MOVES = [...S.MOVES, ['hurt', 'Hit'], ['ko', 'Fall']];
  return S;
}

// the Bellows: it heaves, swells and blasts fire from its grate; it throws its arms up and sparks fly from its pipe
const BELLOWS = forgeSet({
  MOVES: [['bellows-blast', 'Bellows Blast'], ['blow-sparks', 'Blow Sparks']],
  DUR: { 'bellows-blast': 1.4, 'blow-sparks': 1.3 }, ALIAS: { roar: 'bellows-blast', cast: 'blow-sparks' },
  moves: {
    'bellows-blast'(F, b, u) {
      const draw = seg(u, 0, 0.4) * (1 - seg(u, 0.42, 0.55)), blast = seg(u, 0.42, 0.55) * (1 - seg(u, 0.85, 1)), shake = Math.sin(u * 60) * blast;
      b.chest.rotation.x = -0.22 * draw + 0.25 * blast + 0.02 * shake; b.spine.rotation.x = -0.1 * draw + 0.1 * blast;
      for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.z = -s * (0.45 * draw + 0.2 * blast); b[k + '_upper'].rotation.x = 0.25 * blast; b[k + '_fore'].rotation.x = -0.5 * draw; }
      b.head.rotation.x = -0.2 * draw + 0.15 * blast; crouch(F, b, 0.15 * draw + 0.3 * blast); F.body.position.z = 0.08 * blast;
    },
    'blow-sparks'(F, b, u) {
      const r = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1)), puff = Math.max(0, Math.sin(u * Math.PI * 5)) * r;
      for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.x = -1.6 * r; b[k + '_upper'].rotation.z = -s * 0.35 * r; b[k + '_fore'].rotation.x = -0.6 * r; }
      b.chest.rotation.x = -0.15 * r + 0.06 * puff; b.head.rotation.x = -0.3 * r + 0.1 * puff;
    },
  },
});

// Harrow's Journeyman: the Runestaff in his left fist (forearm forward, the staff upright). The staff turns with
// the forearm: upper + fore rotation 0 keeps it upright, -1.57 points it forward
const JOURNEYMAN = forgeSet({
  MOVES: [['smiths-hammer', "Smith's Hammer"], ['temper-kin', 'Temper Kin'], ['rune-fire', 'Rune-Fire'], ['white-heat', 'White Heat']],
  DUR: { 'smiths-hammer': 1.2, 'temper-kin': 1.5, 'rune-fire': 1.5, 'white-heat': 1.4 },
  ALIAS: { strike: 'smiths-hammer', cast: 'rune-fire', roar: 'white-heat' },
  moves: {
    // the staff swung up over his shoulder and down like a hammer
    'smiths-hammer'(F, b, u) {
      const up = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), down = seg(u, 0.38, 0.52) * (1 - seg(u, 0.8, 1));
      b.l_upper.rotation.x = -2.0 * up - 0.9 * down; b.l_fore.rotation.x = 0.9 * up - 0.75 * down; b.l_upper.rotation.z = -0.15 * up;
      b.chest.rotation.y = -0.25 * up + 0.25 * down; b.chest.rotation.x = -0.1 * up + 0.2 * down;
      crouch(F, b, 0.3 * down); F.body.position.z = 0.1 * down * F.height / 2;
    },
    // the staff lifted high and upright, the star burning: his kin take heart
    'temper-kin'(F, b, u) {
      const r = seg(u, 0, 0.35) * (1 - seg(u, 0.8, 1));
      b.l_upper.rotation.x = -1.25 * r; b.l_upper.rotation.z = -0.2 * r; b.l_fore.rotation.x = 1.15 * r;
      b.r_upper.rotation.x = -0.5 * r; b.r_upper.rotation.z = -0.4 * r; b.r_fore.rotation.x = -0.6 * r;
      b.chest.rotation.x = -0.1 * r; b.head.rotation.x = -0.25 * r;
    },
    // the star levelled at you: fire along the runes
    'rune-fire'(F, b, u) {
      const r = seg(u, 0, 0.35) * (1 - seg(u, 0.85, 1)), kick = seg(u, 0.4, 0.5) * (1 - seg(u, 0.6, 0.8));
      b.l_upper.rotation.x = -1.05 * r; b.l_fore.rotation.x = -0.55 * r + 0.15 * kick; b.chest.rotation.y = -0.3 * r;
      b.r_upper.rotation.x = -0.9 * r; b.r_upper.rotation.z = 0.35 * r; b.r_fore.rotation.x = -0.9 * r;
      b.chest.rotation.x = 0.08 * r - 0.08 * kick; crouch(F, b, 0.2 * r);
    },
    // the staff's foot driven down: white heat bursts round him
    'white-heat'(F, b, u) {
      const up = seg(u, 0, 0.35) * (1 - seg(u, 0.4, 0.5)), down = seg(u, 0.4, 0.52) * (1 - seg(u, 0.85, 1));
      b.l_upper.rotation.x = -0.6 * up + 0.15 * down; b.l_fore.rotation.x = 0.35 * up - 0.2 * down;
      b.r_upper.rotation.z = -0.5 * down; b.l_upper.rotation.z = -0.1 * down; b.head.rotation.x = -0.2 * up + 0.2 * down;
      crouch(F, b, 0.15 * up + 0.55 * down); b.chest.rotation.x = 0.2 * down;
    },
  },
});

// the cinder-thralls (M7: cinder-fist, ash-in-the-eyes, reform; the Overseer also hot-chain, drive-them)
function thrallSet(overseer) {
  const S = forgeSet({
    moves: {
      'cinder-fist'(F, b, u) { SETS_FORGE_FIST(F, b, u); },
      // it flings ash into your eyes with both hands
      'ash-in-the-eyes'(F, b, u) {
        const wind = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), fling = seg(u, 0.38, 0.52) * (1 - seg(u, 0.8, 1));
        for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.x = 0.5 * wind - 1.3 * fling; b[k + '_upper'].rotation.z = -s * 0.25 * wind; b[k + '_fore'].rotation.x = -1.2 * wind - 0.2 * fling; }
        b.chest.rotation.x = -0.15 * wind + 0.25 * fling; b.head.rotation.x = 0.15 * fling; crouch(F, b, 0.3 * wind); F.body.position.z = 0.08 * fling;
      },
      // it crumbles to a heap and stands up again out of its own ash
      reform(F, b, u) {
        const d = u < 0.45 ? seg(u, 0, 0.45) : 1 - seg(u, 0.55, 1);
        crouch(F, b, 0.9 * d); b.chest.rotation.x = 0.5 * d; b.spine.rotation.x = 0.3 * d; b.head.rotation.x = 0.4 * d;
        for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.x = 0.2 * d; b[k + '_upper'].rotation.z = -s * 0.5 * d; b[k + '_fore'].rotation.x = -0.4 * d; }
        F.body.position.y -= 0.12 * d * F.height / 2;
      },
    },
  });
  S.MOVES = [['idle', 'Smoulder'], ['walk', 'Shamble'], ['cinder-fist', 'Cinder Fist'], ['ash-in-the-eyes', 'Ash in the Eyes'], ['reform', 'Re-form']];
  S.DUR = { 'cinder-fist': 1.0, 'ash-in-the-eyes': 1.2, reform: 1.8, hurt: 0.8, ko: 2.4 };
  S.LUNGE = 'cinder-fist'; S.ALIAS = { strike: 'cinder-fist', bite: 'cinder-fist', swipe: 'cinder-fist', cast: 'ash-in-the-eyes', roar: 'reform' };
  for (const k of ['molten-fist', 'slag-spit', 'stoke']) delete S.moves[k];
  if (overseer) {
    S.MOVES.push(['hot-chain', 'Hot Chain'], ['drive-them', 'Drive Them']);
    Object.assign(S.DUR, { 'hot-chain': 1.1, 'drive-them': 1.3 }); S.ALIAS.swipe = 'hot-chain'; S.ALIAS.roar = 'drive-them';
    // a backhand lash across you
    S.moves['hot-chain'] = (F, b, u) => {
      const wind = seg(u, 0, 0.3) * (1 - seg(u, 0.32, 0.45)), lash = seg(u, 0.32, 0.55) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -0.9 * wind - 1.1 * lash; b.r_upper.rotation.z = 0.5 * wind - 0.8 * lash; b.r_fore.rotation.x = -1.1 * wind - 0.3 * lash;
      b.chest.rotation.y = 0.5 * wind - 0.55 * lash; b.spine.rotation.y = 0.15 * wind - 0.2 * lash; crouch(F, b, 0.2 * lash);
    };
    // an arm flung up and forward, driving the thralls on; the stalk of its eye swings
    S.moves['drive-them'] = (F, b, u) => {
      const r = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1)), beat = Math.sin(u * Math.PI * 4) * r;
      b.r_upper.rotation.x = -2.2 * r + 0.25 * beat; b.r_upper.rotation.z = -0.2 * r; b.r_fore.rotation.x = -0.3 * r;
      b.chest.rotation.x = -0.12 * r; b.neck.rotation.x = -0.2 * r + 0.1 * beat; b.head.rotation.x = -0.2 * r;
    };
  }
  S.MOVES.push(['hurt', 'Hit'], ['ko', 'Fall']);
  return S;
}
// the Forge-Warden (M7: hammer-arm, bellows-breath, hold-the-bridge, stoke): its left hand is the hammer
function kilnSet() {
  const S = forgeSet({
    moves: {
      'hammer-arm'(F, b, u) {
        const up = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), down = seg(u, 0.38, 0.52) * (1 - seg(u, 0.8, 1));
        b.l_upper.rotation.x = -2.3 * up - 1.0 * down; b.l_fore.rotation.x = -0.3 * up - 0.5 * down; b.l_upper.rotation.z = -0.15 * up;
        b.chest.rotation.y = -0.18 * up + 0.2 * down; b.chest.rotation.x = -0.06 * up + 0.12 * down; crouch(F, b, 0.3 * down);
      },
      // it rocks back and the bellows blows: fire from the chimney and the door
      'bellows-breath'(F, b, u) {
        const draw = seg(u, 0, 0.4) * (1 - seg(u, 0.42, 0.55)), blow = seg(u, 0.42, 0.55) * (1 - seg(u, 0.85, 1));
        b.chest.rotation.x = -0.12 * draw + 0.14 * blow; b.head.rotation.x = -0.15 * draw + 0.1 * blow;
        for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.z = -s * (0.35 * draw + 0.15 * blow); b[k + '_upper'].rotation.x = 0.2 * blow; }
        crouch(F, b, 0.15 * draw + 0.25 * blow);
      },
      // feet set wide, arms out: nothing gets past
      'hold-the-bridge'(F, b, u) {
        const g = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
        for (const [k, s] of [['r', 1], ['l', -1]]) { b[k + '_upper'].rotation.z = -s * 0.7 * g; b[k + '_upper'].rotation.x = -0.4 * g; b[k + '_fore'].rotation.x = -0.5 * g; b[k + '_thigh'].rotation.z = -s * 0.12 * g; }
        crouch(F, b, 0.4 * g); b.head.rotation.x = 0.1 * g;
      },
    },
  });
  S.MOVES = [['idle', 'Smoulder'], ['walk', 'Stomp'], ['hammer-arm', 'Hammer Arm'], ['bellows-breath', 'Bellows Breath'], ['hold-the-bridge', 'Hold the Bridge'], ['stoke', 'Stoke'], ['hurt', 'Hit'], ['ko', 'Fall']];
  S.DUR = { 'hammer-arm': 1.2, 'bellows-breath': 1.5, 'hold-the-bridge': 1.4, stoke: 1.3, hurt: 0.8, ko: 2.4 };
  S.LUNGE = 'hammer-arm'; S.ALIAS = { strike: 'hammer-arm', bite: 'hammer-arm', swipe: 'hammer-arm', cast: 'stoke', roar: 'bellows-breath' };
  for (const k of ['molten-fist', 'slag-spit']) delete S.moves[k];
  return S;
}
// the Unsmith (M7: hammer-blow, ring-the-anvil, unmake, forge-apron, nothing-left, worldfire, hearts-pull,
// heart-flare): the Unmaking Hammer upright in his left fist (forearm forward); the haft turns with the forearm
const UNSMITH = {
  MOVES: [['idle', 'Wait'], ['walk', 'Stride'], ['hammer-blow', 'Hammer Blow'], ['ring-the-anvil', 'Ring the Anvil'], ['unmake', 'Unmake'],
    ['forge-apron', 'Forge Apron'], ['nothing-left', 'Nothing Left'], ['worldfire', 'Worldfire'], ['hearts-pull', "Heart's Pull"], ['heart-flare', 'Heart Flare'],
    ['hurt', 'Hit'], ['ko', 'Fall']],
  DUR: { 'hammer-blow': 1.2, 'ring-the-anvil': 1.5, unmake: 1.4, 'forge-apron': 1.3, 'nothing-left': 1.6, worldfire: 1.7, 'hearts-pull': 1.5, 'heart-flare': 1.4, hurt: 0.8, ko: 2.4 },
  LUNGE: 'hammer-blow',
  ALIAS: { strike: 'hammer-blow', bite: 'hammer-blow', swipe: 'unmake', cast: 'hearts-pull', roar: 'worldfire' },
  base: knightBase,
  moves: {
    walk: KNIGHT.walk, hurt: KNIGHT.hurt, ko: KNIGHT.ko,
    // the hammer up over his shoulder, both hands, and down
    'hammer-blow'(F, b, u) {
      const up = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), down = seg(u, 0.38, 0.52) * (1 - seg(u, 0.8, 1));
      b.l_upper.rotation.x = -2.1 * up - 1.0 * down; b.l_fore.rotation.x = 1.0 * up - 0.9 * down; b.l_upper.rotation.z = -0.25 * up;
      b.r_upper.rotation.x = -1.8 * up - 1.0 * down; b.r_upper.rotation.z = 0.35 * (up + down); b.r_fore.rotation.x = -0.9 * (up + down);
      b.chest.rotation.x = -0.12 * up + 0.22 * down; b.chest.rotation.y = -0.2 * up + 0.15 * down; crouch(F, b, 0.3 * down); F.body.position.z = 0.1 * down;
    },
    // the hammer brought down on the ground before him, hard, twice
    'ring-the-anvil'(F, b, u) {
      const k = seg(u, 0, 0.25) * (1 - seg(u, 0.85, 1)), beat = Math.max(0, Math.sin(u * Math.PI * 4)) * k;
      b.l_upper.rotation.x = -1.6 * k + 0.9 * beat; b.l_fore.rotation.x = 0.6 * k - 1.3 * beat; b.r_upper.rotation.x = -0.9 * k + 0.5 * beat; b.r_upper.rotation.z = 0.3 * k; b.r_fore.rotation.x = -0.8 * k;
      b.chest.rotation.x = 0.1 * k + 0.15 * beat; crouch(F, b, 0.2 * k + 0.3 * beat);
    },
    // a great sideways swing that breaks what it touches
    unmake(F, b, u) {
      const wind = seg(u, 0, 0.35) * (1 - seg(u, 0.38, 0.5)), swing = seg(u, 0.38, 0.6) * (1 - seg(u, 0.82, 1));
      b.l_upper.rotation.x = -1.2 * (wind + swing); b.l_upper.rotation.z = 0.7 * wind - 0.6 * swing; b.l_fore.rotation.x = -0.5 * (wind + swing);
      b.r_upper.rotation.x = -0.9 * (wind + swing); b.r_upper.rotation.z = 0.5 * (wind + swing); b.r_fore.rotation.x = -0.9 * (wind + swing);
      b.chest.rotation.y = 0.6 * wind - 0.7 * swing; b.spine.rotation.y = 0.2 * wind - 0.25 * swing; crouch(F, b, 0.3 * swing);
    },
    // he sets himself behind his apron, arms crossed, the hammer across them
    'forge-apron'(F, b, u) {
      const g = seg(u, 0, 0.3) * (1 - seg(u, 0.8, 1));
      b.r_upper.rotation.x = -0.9 * g; b.r_upper.rotation.z = 0.45 * g; b.r_fore.rotation.x = -1.4 * g; b.r_fore.rotation.y = 0.6 * g;
      b.l_upper.rotation.x = -0.5 * g; b.l_upper.rotation.z = -0.3 * g; b.l_fore.rotation.x = -0.7 * g; b.head.rotation.x = 0.12 * g; crouch(F, b, 0.35 * g);
    },
    // arms spread: there is nothing left to save
    'nothing-left'(F, b, u) {
      const r = seg(u, 0, 0.35) * (1 - seg(u, 0.85, 1));
      b.r_upper.rotation.z = -0.9 * r; b.r_upper.rotation.x = -0.3 * r; b.r_fore.rotation.x = -0.3 * r;
      b.l_upper.rotation.z = 0.6 * r; b.l_upper.rotation.x = -0.3 * r; b.head.rotation.x = 0.25 * r; b.chest.rotation.x = 0.05 * r;
    },
    // the hammer raised high, his head back: the world catches fire
    worldfire(F, b, u) {
      const r = seg(u, 0, 0.4) * (1 - seg(u, 0.85, 1)), shake = Math.sin(u * 50) * r;
      b.l_upper.rotation.x = -1.4 * r; b.l_upper.rotation.z = -0.3 * r; b.l_fore.rotation.x = 1.25 * r;
      b.r_upper.rotation.z = -0.7 * r; b.r_upper.rotation.x = -0.6 * r; b.r_fore.rotation.x = -0.5 * r;
      b.chest.rotation.x = -0.22 * r + 0.01 * shake; b.head.rotation.x = -0.4 * r; b.neck.rotation.x = -0.15 * r;
    },
    // he leans back, his free hand out and clawing, drawing the heart's fire to him
    'hearts-pull'(F, b, u) {
      const r = seg(u, 0, 0.4) * (1 - seg(u, 0.85, 1)), pull = Math.sin(u * Math.PI * 3) * r;
      b.r_upper.rotation.x = -1.4 * r + 0.25 * pull; b.r_fore.rotation.x = -0.5 * r - 0.3 * pull; b.chest.rotation.x = -0.18 * r; b.spine.rotation.x = -0.08 * r;
      b.head.rotation.x = -0.12 * r; crouch(F, b, 0.15 * r);
    },
    // the heart in his chest flares: he throws his chest out, arms back
    'heart-flare'(F, b, u) {
      const f = Math.max(0, Math.sin(u * Math.PI * 2)) * (1 - u * 0.5);
      b.chest.rotation.x = -0.25 * f; b.head.rotation.x = -0.2 * f; b.r_upper.rotation.x = 0.4 * f; b.r_upper.rotation.z = -0.3 * f; b.l_upper.rotation.x = 0.25 * f;
    },
  },
};
const SETS_FORGE_FIST = (F, b, u) => forgeSet().moves['molten-fist'](F, b, u);

export const SETS = { 'ashen-warden': WARDEN, 'iron-sentinel': sentinelSet(false), 'sentinel-captain': sentinelSet(true), forgeborn: forgeSet(), bellows: BELLOWS, journeyman: JOURNEYMAN, 'cinder-thrall': thrallSet(false), 'thrall-overseer': thrallSet(true), 'forge-warden': kilnSet(), unsmith: UNSMITH };
export { forgeSet, KNIGHT, crouch, legs, seg, bump };
export function movesOf(key) {
  const S = SETS[key];
  return {
    MOVES: S.MOVES, DUR: S.DUR, LUNGE: S.LUNGE, ALIAS: S.ALIAS,
    pose(F, move, u, t, step = 0) {
      reset(F);
      const b = new Proxy(F.bones, { get: (o, k) => o[k] || NOOP });
      S.base(F, b, t);
      const m = S.moves[move];
      if (m) m(F, b, u, t, step);
    },
  };
}
