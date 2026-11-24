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
};
