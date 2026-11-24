// table.js (Places, step 6, November 24): which arena set suits each of M7's places, for the Fight. A fight in an M7
// place is fought in the arena set named here (window.M7_ARENA_FOR[place] -> 'arena-<set>', a place like any other in
// world3d/coven/places/). By region and kind of land, with a call per place; ARENA_DEFAULT covers anything not listed.
(function (G) {
  const T = {
    // Act One, the Verdant Wilds
    keep: 'road-wood', 'keep-hall': 'keep-halls', 'keep-gallery': 'keep-halls', 'keep-gallery-2': 'keep-halls', 'keep-gallery-3': 'keep-halls',
    'hearth-road': 'road-wood', thornhollow: 'road-wood', fawnrest: 'road-wood',
    thornway: 'thorns', 'briarmaw-den': 'thorns',
    hindwood: 'deep-wood', eldergrove: 'deep-wood', mossfall: 'deep-wood',
    'mosswatch-1': 'keep-halls', 'mosswatch-2': 'keep-halls',
    'heartroot-1': 'heartroot', 'heartroot-2': 'heartroot',
    // Act Two, the Sunscorch
    'sun-road': 'desert', sandspire: 'desert', miragewell: 'desert',
    'glass-flats': 'glass-flats', 'deep-shaft-2': 'glass-flats',
    'dust-trail': 'canyon', dusthaven: 'canyon', scorchgate: 'canyon',
    'deep-shaft-1': 'vaults', 'scorchgate-vaults': 'vaults',
    // Act Two, the Ironspire
    'old-bridge': 'road-wood', 'drystone-lea': 'road-wood', plankford: 'road-wood',
    shrinewood: 'deep-wood', silverfall: 'deep-wood', 'last-camp': 'deep-wood',
    'rockslide-pass': 'snow-road', 'peaks-veil': 'snow-road', highfold: 'snow-road', 'iron-stair': 'snow-road', stormwatch: 'snow-road', 'frost-road': 'snow-road',
    frostmere: 'frozen-lake', 'frostmere-below': 'frozen-lake',
    ironhold: 'dwarf-halls', 'ironhold-deeps': 'forge', 'harrows-forge': 'forge',
    // Act Two, the Gloomfen
    murkway: 'fen', willowmurk: 'fen', rotbridge: 'fen', bogmire: 'fen', lanternfen: 'fen', 'mothers-hollow': 'fen',
    'long-boardwalk': 'fen', misthollow: 'fen', 'drowned-belfry': 'fen', 'blackwater-reach': 'fen', 'tidal-flats': 'fen', causeway: 'fen',
    // Act Three, the Hearth Below
    'hollow-hall': 'hollow-hall', 'ash-stair': 'ash-stair', 'chained-deep': 'chained-deep', worldforge: 'worldforge',
  };
  G.M7_ARENA_FOR = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, 'arena-' + v]));
  // by region, for a place not in the table
  G.M7_ARENA_DEFAULT = { verdant: 'arena-road-wood', sunscorch: 'arena-desert', ironspire: 'arena-snow-road', gloomfen: 'arena-fen', below: 'arena-hollow-hall' };
})(typeof window !== 'undefined' ? window : globalThis);
