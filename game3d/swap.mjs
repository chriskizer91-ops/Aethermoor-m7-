// game3d/swap.mjs: the build-time swaps for the 3D game (world3d/build.mjs --plugin=../game3d/swap.mjs). game/ is never
// edited; instead, by the very paths they import them by:
//   - M7's battle screen gets the Fight's 3D stage, hero strip and dice (world3d/battle/swap.mjs, unchanged)
//   - M7's Settings screen gets the 3D game's own save (game3d/save-codes.js) in place of core/save.js
//   - 'game3d:foes-hd' is the full-detail foes' assets (game3d/foes-hd.mjs)
//   - the lore's names over M7's where Chris chose them (Chris, November 24: "Use the lore name from Moon Faire and Envoi"):
//     M7's "Mother's Hollow" reads "the fen's dark heart", in what the player reads only (the game's own text, as it is
//     bundled); ids, saves and game/ itself are untouched
// Every other importer of those files gets M7's own.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fight from '../world3d/battle/swap.mjs';
import foesHd from './foes-hd.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS = path.join('game', 'src', 'ui', 'screens', 'settings.js');
// the display names (game3d/lore.js), over M7's own text as it is bundled
import { loreName } from './lore.js';
export { loreName };
const LORE_FILES = /game[\\/]src[\\/](data|art|ui)[\\/].*\.js$/;
export default [...fight, foesHd, {
  name: 'game3d-lore-names',
  setup(b) {
    b.onLoad({ filter: LORE_FILES }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (!src.includes('Mother') || !src.includes('Hollow')) return undefined;
      const out = loreName(src);
      return out === src ? undefined : { contents: out, loader: 'js' };
    });
  },
}, {
  name: 'game3d-save-swap',
  setup(b) {
    b.onResolve({ filter: /^\.\.\/\.\.\/core\/save\.js$/ }, (a) => (a.importer.endsWith(SETTINGS) ? { path: path.join(here, 'save-codes.js') } : undefined));
  },
}];
