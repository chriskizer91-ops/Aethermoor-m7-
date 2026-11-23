// dressing.mjs (Places, step 5): the small things each painting draws, read off the painting on its tile grid
// (m7/grid.py <id> <w> <h> draws it with the tile numbers on), to be stood up in 3D by the place kit (m7-kit.js dress).
// One entry per thing, in tiles (x across, y down; 16.5 is the middle of tile 16), facing S/E/N/W (or degrees, 0 = S):
//   [kind, x, y, face?, { s: size, load }?]       kinds: barrel barrels crate crates sacks cart stall well bench signpost
//                                                  statue brazier lamppost hay haystack logs woodpile rock bush table
//                                                  shelf trough jars anvil cauldron tent lowwall boat
//   { replace: true } on a thing: the map's little building under it is left out (a stall always replaces)
//   ['fence' | 'pickets', x0, y0, x1, y1]          a wooden fence along a line
// Chests, signs, boards and the Hearthfire stands are the game's own things (m7/convert.mjs things, game3d/props.js).
import { readdirSync, readFileSync } from 'node:fs';
const here = new URL('./dress/', import.meta.url);
// the regions' lists, one JSON file each in m7/dress/ ({ "<id>": [entry, ...] }, same entries as below)
const FILES = (() => { try { return readdirSync(here).filter((f) => f.endsWith('.json')); } catch { return []; } })();
const FROM_FILES = Object.assign({}, ...FILES.map((f) => JSON.parse(readFileSync(new URL(f, here), 'utf8'))));
export const DRESS = {
  ...FROM_FILES,
  keep: [
    // the courtyard well in its ring of stones (its water is the map's own tile)
    ['well', 4.5, 4.55, 'S'],
    // the smithy's anvil and a barrel; the west house's crates; barrels by the south-west house and the south hall
    ['anvil', 26.6, 6.4, 'E'], ['barrel', 27.6, 7.5],
    ['crates', 2.6, 14.15, 'S'], ['barrel', 3.7, 14.15], ['barrel', 5.15, 17.6],
    ['crates', 11.2, 18.9, 'E'], ['barrels', 19.5, 19.2, 'W', { s: 0.6 }],
    ['crates', 19.3, 13.9, 'S'], ['barrel', 21.7, 13.95],
  ],
  // the low mossy walls of the old shrine (the map's three little roofs, H, are walls in the painting)
  fawnrest: [['lowwall', 3.0, 11.5, 'S', { replace: true }], ['lowwall', 5.0, 13.5, 'S', { replace: true }], ['lowwall', 17.0, 11.5, 'S', { replace: true }]],
  // the Worldforge (Together, November 23; a stand-in until Chris's batch 4): the furnace mouth glowing in the east wall at
  // the heart, where the party chooses the ending; the furnace at its prop (32,18); the great anvil at its prop (25,7)
  worldforge: [['furnacemouth', 30.96, 12.0, 'W', { s: 1.0 }], ['furnace', 32.5, 18.6, 'W', { s: 0.75 }], ['anvil', 25.5, 7.5, 'S', { s: 2.4 }]],
  thornhollow: [
    // the two market stalls on the south street (they replace the map's little roofs)
    ['stall', 8.95, 16.5, 'S', { s: 1.5 }], ['stall', 15.0, 16.5, 'S', { s: 1.5 }],
    // Hilda's forge: a barrel by its west wall, barrels under the porch
    ['barrel', 16.55, 13.3], ['barrels', 17.6, 15.2, 'S', { s: 0.6 }], ['barrel', 21.2, 15.15],
    // stones in the grass before the lodge
    ['rock', 7.6, 5.9, 0, { s: 0.3 }], ['rock', 9.1, 5.15, 0, { s: 0.3 }], ['rock', 10.7, 5.5, 0, { s: 0.35 }],
  ],
};
