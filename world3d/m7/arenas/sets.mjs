// sets.mjs (Places, step 6): the arena sets, one kind of land each, made by m7/arenas/make.mjs. Each names the places it
// is painted from (sources: their tiles and paintings; the first gives its region, biome and light) and what stands
// where, in M7's own tile letters for that land:
//   ground          the floor of the round (walkable)
//   near {p, k}     between the clear middle and the edge: small walkable things, k as [[tile, weight], ...]
//   edge {p, k}     the ring round the edge (8 to 9 m out from the middle): the land's trees, rocks, walls
//   outer           all beyond: the wood, the cliffs, the walls (solid)
//   path            a road or boardwalk across the round {c, axis, half, through}
//   paintAs         a tile letter painted as another when no source painting has it ({ '*': fallbacks })
export const SETS = {
  'road-wood': {
    name: 'The Road and the Wood', sources: ['hearth-road', 'thornhollow', 'hindwood'],
    ground: '.', near: { p: 0.14, k: [[',', 3], ['"', 2]] },
    edge: { p: 0.62, k: [['T', 6], ['t', 3], ['o', 1]] }, outer: 'T', outerMix: { p: 0.08, k: [['t', 1]] },
    path: { c: '=', axis: 'x', half: 0.6, through: true },
  },
  thorns: {
    name: 'The Thorns', sources: ['thornway', 'hindwood'],
    ground: '.', near: { p: 0.16, k: [[',', 2], ['m', 2], ['"', 1]] },
    edge: { p: 0.7, k: [['t', 6], ['T', 3], ['o', 1]] }, outer: 'T', outerMix: { p: 0.3, k: [['t', 1]] },
    path: { c: '=', axis: 'y', half: 0.6, through: true },
  },
  'deep-wood': {
    name: 'The Deep Wood', sources: ['hindwood', 'eldergrove', 'thornway'], light: 'dusk',
    ground: '.', near: { p: 0.2, k: [[',', 4], ['"', 2], ['f', 1]] },
    edge: { p: 0.72, k: [['T', 7], ['o', 1], ['t', 1]] }, outer: 'T',
  },
  heartroot: {
    name: 'The Heartroot', sources: ['heartroot-1', 'heartroot-2'], light: 'night',
    ground: 'r', near: { p: 0.22, k: [['k', 3], ['f', 2], ['i', 1]] },
    edge: { p: 0.75, k: [['R', 6], ['Y', 1]] }, outer: 'R',
  },
  fen: {
    name: 'The Fen', sources: ['lanternfen', 'willowmurk'],
    ground: '.', near: { p: 0.22, k: [['"', 3], ['m', 2], [',', 1]] },
    edge: { p: 0.7, k: [['~', 3], ['t', 3], ['T', 2], ['o', 1]] }, outer: 'T', outerMix: { p: 0.4, k: [['~', 2], ['t', 1]] },
    path: { c: '=', axis: 'x', half: 0.6, through: true },
  },
  desert: {
    name: 'The Desert Sands', sources: ['sun-road'],
    ground: '.', near: { p: 0.12, k: [[',', 1]] },
    edge: { p: 0.6, k: [['^', 3], ['o', 3], ['T', 2]] }, outer: '^', outerMix: { p: 0.15, k: [['o', 1]] },
    path: { c: '=', axis: 'x', half: 0.6, through: true },
  },
  'glass-flats': {
    name: 'The Glass Flats', sources: ['glass-flats'],
    ground: '.', near: { p: 0.12, k: [[',', 1]] },
    edge: { p: 0.6, k: [['^', 4], ['o', 2]] }, outer: '^',
    path: { c: '=', axis: 'y', half: 0.6, through: true },
  },
  canyon: {
    name: 'The Canyon', sources: ['dust-trail'],
    ground: '.', near: { p: 0.15, k: [[',', 3], ['m', 1]] },
    edge: { p: 0.8, k: [['^', 6], ['o', 2]] }, outer: '^',
    path: { c: '=', axis: 'y', half: 0.6, through: true },
  },
  vaults: {
    name: 'The Vaults', sources: ['scorchgate-vaults'],
    ground: ':', near: { p: 0.2, k: [['k', 3], ['m', 1]] },
    edge: { p: 0.8, k: [['#', 5], ['*', 1], ['o', 1]] }, outer: '#',
  },
  'snow-road': {
    name: 'The Snow Road', sources: ['frost-road'],
    ground: '.', near: { p: 0.15, k: [[',', 2], ['"', 1]] },
    edge: { p: 0.65, k: [['^', 3], ['T', 3], ['o', 1]] }, outer: '^', outerMix: { p: 0.35, k: [['T', 1]] },
    path: { c: '=', axis: 'x', half: 0.6, through: true },
  },
  'frozen-lake': {
    name: 'The Frozen Lake', sources: ['frostmere'],
    ground: '.', near: { p: 0.22, k: [[':', 2], [',', 2]] },
    edge: { p: 0.6, k: [['^', 3], ['o', 2], ['T', 2]] }, outer: '^', outerMix: { p: 0.3, k: [['T', 1]] },
  },
  'dwarf-halls': {
    name: 'The Dwarf Halls', sources: ['ironhold'],
    ground: ':',
    edge: { p: 0.8, k: [['#', 3], ['R', 3], ['Y', 1], ['*', 1]] }, outer: 'R',
  },
  forge: {
    name: 'The Forge', sources: ['harrows-forge', 'ironhold-deeps'],
    ground: 'k', near: { p: 0.15, k: [['f', 2], ['m', 1], [':', 1]] },
    edge: { p: 0.8, k: [['#', 3], ['R', 3], ['*', 1], ['Y', 1]] }, outer: 'R',
  },
  'keep-halls': {
    name: 'The Keep\'s Halls', sources: ['keep-hall', 'keep-gallery'],
    ground: ':', edge: { p: 0.85, k: [['#', 5], ['*', 1]] }, outer: '#',
    path: { c: '_', axis: 'y', half: 1.1, through: false },
  },
  'hollow-hall': {
    name: 'The Hollow Hall', sources: ['hollow-hall'],
    ground: ':', near: { p: 0.15, k: [[',', 2], ['k', 1]] },
    edge: { p: 0.8, k: [['#', 4], ['Y', 2], ['*', 1]] }, outer: '#',
  },
  'ash-stair': {
    name: 'The Ash Stair', sources: ['ash-stair'],
    ground: '.', near: { p: 0.2, k: [[',', 3], ['m', 1], ['i', 1]] },
    edge: { p: 0.8, k: [['#', 3], ['x', 3], ['^', 1], ['o', 1]] }, outer: '#', outerMix: { p: 0.35, k: [['x', 1]] },
  },
  'chained-deep': {
    name: 'The Chained Deep', sources: ['chained-deep'],
    ground: 'k', near: { p: 0.15, k: [['f', 2], [':', 1]] },
    edge: { p: 0.8, k: [['x', 3], ['o', 2], ['^', 1], ['Y', 1]] }, outer: '#', outerMix: { p: 0.3, k: [['x', 1], ['R', 1]] },
    path: { c: '=', axis: 'x', half: 0.6, through: false },
  },
  worldforge: {
    name: 'The Worldforge', sources: ['worldforge'],
    ground: '_', near: { p: 0.15, k: [[':', 1], [',', 2]] },
    edge: { p: 0.8, k: [['#', 3], ['~', 2], ['*', 1], ['t', 1]] }, outer: '#',
  },
};
