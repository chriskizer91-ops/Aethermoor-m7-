// names.js: the borrowed world under Hearth & Heirloom's names (November 20, provisional: Chris may rename any).
// The borrowed places keep their files and ids unchanged; only what the player reads is renamed, here, once the place
// data has loaded and before anything is built. Every text in the places' data, the zone's roads and regions, and the
// continent map's place and zone names goes through NAMES (longest first, so "Io's cottage" goes before "Io").
//   Wickhollow (Envoi's town)         -> Thornhollow (M7's rangers' town in the Verdant Wilds)
//   Io's cottage                      -> Fawnrest (M7's glade in the Wilds)
//   the Thornwood                     -> the Thornway (M7's thorn road north of Thornhollow)
//   Bogmire (the stilt town)          -> Mossfall (M7's fen village in the Wilds)
//   the fen's dark heart              -> the Heartroot (M7's root-cave in the Wilds)
//   the Moon Faire (its camp)         -> the Wayfarers' camp
// The continent's four bands take the names of the parts of M7's world they cover.
(function (G) {
  'use strict';
  const NAMES = [
    ['Io’s cottage', 'Fawnrest'], ["Io's cottage", 'Fawnrest'],
    ['The fen’s dark heart', 'The Heartroot'], ['the fen’s dark heart', 'the Heartroot'], ["The fen's dark heart", 'The Heartroot'],
    ['Wickhollow and the fen', 'The Verdant Wilds'],
    ['The Thornwood', 'The Thornway'], ['the Thornwood', 'the Thornway'], ['Thornwood', 'Thornway'],
    ['Wickhollow', 'Thornhollow'], ['Bogmire', 'Mossfall'], ['Hilde\u2019s forge', 'Hilda\u2019s forge'], ['Nettie\u2019s house', 'the weaver\u2019s house'],
    ['The Moon Faire', 'The Wayfarers’ camp'], ['Moon Faire', 'Wayfarers’ camp'],
  ];
  const ZONES = { 1: ['The Verdant Wilds', 'the south-west, toward the Gloomfen'], 2: ['The Verdant Wilds', 'the western forests'], 3: ['The Ironspire’s foothills', 'the north-west'], 4: ['The Ironspire', 'the north-east peaks'] };
  const fix = (s) => { if (typeof s !== 'string' || s.startsWith('data:') || s.length > 400) return s; for (const [a, b] of NAMES) if (s.includes(a)) s = s.split(a).join(b); return s; };
  const KEYS = new Set(['name', 'to', 'label', 'title', 'region', 'says', 'text']);
  function walk(o, seen) {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'string') { if (KEYS.has(k)) o[k] = fix(v); } else if (Array.isArray(v)) { v.forEach((x, i) => { if (typeof x === 'string' && v.length <= 4 && KEYS.has(k)) v[i] = fix(x); else walk(x, seen); }); } else walk(v, seen); }
  }
  G.AETH_NAMES = {
    fix,
    apply() {
      const seen = new Set();
      walk(G.W3D_PLACES, seen);
      const P = G.MapPlaces;
      // the continent names only the Wilds' own places for now: Envoi's other landings (the Warm Roads, Dawnroost...) are not M7's
      if (P && P.LANDINGS) for (const [id, l] of Object.entries(P.LANDINGS)) if (l.zone !== 1) delete P.LANDINGS[id];
      if (P) { for (const p of Object.values(P.PLACES)) p.name = fix(p.name); for (const l of Object.values(P.LANDINGS || {})) l.name = fix(l.name); for (const [z, Z] of Object.entries(P.ZONES)) { Z.name = ZONES[z][0]; Z.land = ZONES[z][1]; } }
    },
  };
})(window);
