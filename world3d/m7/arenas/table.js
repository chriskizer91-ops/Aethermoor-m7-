// table.js (Places, step 6, November 24): which arena set suits each of M7's places, for the Fight (an ES module).
//   ARENA_SET['m7-<place>'] -> 'arena-<set>', for all 60 places (each set is a place: W3D_PLACES['arena-<set>'], also
//   'm7-arena-<set>'; its file world3d/coven/places/m7-arena-<set>.js); ARENA_DEFAULT by region for anything else;
//   ARENA_LOOK: the sets whose light is kept whatever the place's (the rest take their land's own, as their places do).
const BY_PLACE = {
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
export const ARENA_SET = Object.fromEntries(Object.entries(BY_PLACE).map(([k, v]) => ['m7-' + k, 'arena-' + v]));
export const ARENA_DEFAULT = { verdant: 'arena-road-wood', sunscorch: 'arena-desert', ironspire: 'arena-snow-road', gloomfen: 'arena-fen', below: 'arena-hollow-hall' };
export const ARENA_LOOK = { 'arena-deep-wood': { light: 'dusk' }, 'arena-heartroot': { light: 'night' } };
export const ARENA_SETS = [...new Set(Object.values(ARENA_SET))];
