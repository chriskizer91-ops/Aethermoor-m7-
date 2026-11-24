// names.js: the borrowed world under Hearth & Heirloom's names (November 20, provisional: Chris may rename any).
// The borrowed places keep their files and ids unchanged; only what the player reads is renamed, here, once the place
// data has loaded and before anything is built. Every text in the places' data, the zone's roads and regions, and the
// continent map's place and zone names goes through NAMES (longest first, so "Io's cottage" goes before "Io").
//   Wickhollow (Envoi's town)         -> Thornhollow (M7's rangers' town in the Verdant Wilds)
//   Io's cottage                      -> Fawnrest Shrine (M7's shrine of the white deer)
//   the Thornwood                     -> the Thornway (M7's thorn road, with Briarmaw's den in it)
//   Bogmire (the stilt town)          -> Bogmire (M7's own Gloomfen town, the same name)
//   the fen's dark heart              keeps its name: it is M7's Mother's Hollow, the Lantern Mother's drowned grove
//                                     (Chris, November 24: "Use the lore name from Moon Faire and Envoi")
//   the Moon Faire (its camp)         -> the Wayfarers' camp
// These follow the story map (docs/lore/places.json, November 20).
// The continent's four bands take the names of the parts of M7's world they cover.
(function (G) {
  'use strict';
  const NAMES = [
    ['Io\u2019s cottage', 'Fawnrest Shrine'], ["Io's cottage", 'Fawnrest Shrine'],
    ['Wickhollow and the fen', 'The Verdant Wilds and the Gloomfen'],
    ['The Thornwood', 'The Thornway'], ['the Thornwood', 'the Thornway'], ['Thornwood', 'Thornway'],
    ['Wickhollow', 'Thornhollow'], ['Hilde\u2019s forge', 'Hilda\u2019s forge'], ['Nettie\u2019s house', 'the weaver\u2019s house'],
    ['The Moon Faire', 'The Wayfarers\u2019 camp'], ['Moon Faire', 'Wayfarers\u2019 camp'],
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
