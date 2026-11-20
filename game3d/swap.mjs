// game3d/swap.mjs: the build-time swaps for the 3D game (world3d/build.mjs --plugin=../game3d/swap.mjs). game/ is never
// edited; instead, by the very paths they import them by:
//   - M7's battle screen gets the Fight's 3D stage, hero strip and dice (world3d/battle/swap.mjs, unchanged)
//   - M7's Settings screen gets the 3D game's own save (game3d/save-codes.js) in place of core/save.js
// Every other importer of those files gets M7's own.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fight from '../world3d/battle/swap.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS = path.join('game', 'src', 'ui', 'screens', 'settings.js');
export default [...fight, {
  name: 'game3d-save-swap',
  setup(b) {
    b.onResolve({ filter: /^\.\.\/\.\.\/core\/save\.js$/ }, (a) => (a.importer.endsWith(SETTINGS) ? { path: path.join(here, 'save-codes.js') } : undefined));
  },
}];
