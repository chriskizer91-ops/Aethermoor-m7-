// atlas-data.mjs (Places, step 3): the Atlas's data, from the story map (docs/lore/places.json: the stops, where each sits
// on the atlas, the regions) and M7's own maps (game/src/data/maps/: which maps make each stop, their Hearthfires; their
// names from game/src/data/encounters.js). Writes m7/atlas-data.js (window.M7_ATLAS_DATA). Run it after either changes.
//   node m7/atlas-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, '../..');
const lore = JSON.parse(readFileSync(path.join(ROOT, 'docs/lore/places.json'), 'utf8'));
const { MAPS, MAP_IDS } = await import(pathToFileURL(path.join(ROOT, 'game/src/data/maps/index.js')));
const { ENCOUNTERS } = await import(pathToFileURL(path.join(ROOT, 'game/src/data/encounters.js')));
// which of the story map's stops each M7 map belongs to (a stop with the map's own id needs no line here)
const STOP_OF = {
  'keep-hall': 'keep', 'keep-gallery': 'keep', 'keep-gallery-2': 'keep', 'keep-gallery-3': 'keep',
  'hollow-hall': 'below', 'ash-stair': 'below', 'chained-deep': 'below', worldforge: 'below',
  'heartroot-1': 'eldergrove', 'heartroot-2': 'eldergrove', 'mosswatch-1': 'mossfall', 'mosswatch-2': 'mossfall', 'briarmaw-den': 'thornway',
  'blackwater-reach': 'blackwater', 'tidal-flats': 'blackwater', 'drowned-belfry': 'misthollow', 'mothers-hollow': 'lanternfen',
  'drystone-lea': 'drystone', plankford: 'drystone', shrinewood: 'silverfall', 'frostmere-below': 'frostmere', 'frost-road': 'frostmere',
  'rockslide-pass': 'rockslide', highfold: 'peaks-veil', 'iron-stair': 'ironhold', 'ironhold-deeps': 'ironhold', 'harrows-forge': 'ironhold',
  'dust-trail': 'dusthaven', 'deep-shaft-1': 'dusthaven', 'deep-shaft-2': 'dusthaven', miragewell: 'glass-flats', 'scorchgate-vaults': 'scorchgate',
};
const stops = lore.places.map((p) => ({ id: p.id, name: p.name, region: p.region, at: p.at, maps: [] }));
const byId = Object.fromEntries(stops.map((s) => [s.id, s]));
const left = [];
for (const id of MAP_IDS) {
  const m = MAPS[id], s = byId[STOP_OF[id] || id];
  if (!s) { left.push(id); continue; }
  const hearthfires = m.entities.filter((e) => e.kind === 'hearthfire').map((e) => ({ id: e.id, name: (ENCOUNTERS[e.id] && ENCOUNTERS[e.id].name) || e.id, cold: !!e.cold || undefined }));
  s.maps.push({ id, name: m.name, region: m.region, hearthfires });
}
if (left.length) { console.error('maps with no stop on the atlas: ' + left.join(', ')); process.exit(1); }
const regions = Object.fromEntries(Object.entries(lore.regions).map(([k, r]) => [k, { name: r.name, color: r.color, act: r.act }]));
const out = `// atlas-data.js: made by m7/atlas-data.mjs from docs/lore/places.json and M7's maps (do not edit by hand).
// stops: the story map's stops on the atlas (at: atlas pixels, 4608 x 3072, north up), each with the M7 maps it holds and
// their Hearthfires (cold: lit only once the party kindles it in the game).
window.M7_ATLAS_DATA = ${JSON.stringify({ regions, stops })};
`;
writeFileSync(path.join(here, 'atlas-data.js'), out);
console.log(`${stops.length} stops, ${MAP_IDS.length} maps, ${stops.reduce((n, s) => n + s.maps.reduce((k, m) => k + m.hearthfires.length, 0), 0)} Hearthfires`);
