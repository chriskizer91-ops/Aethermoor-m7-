// The Fight (November 20): M7's battle screen, untouched, drawn on the 3D land. game/ is never edited: at build time
// (world3d/build.mjs --plugin=battle/swap.mjs) this plugin hands M7's battle screen (game/src/ui/screens/battle.js) our
// pieces in place of three of its own, by the very paths it imports them by:
//   ../battle/stage.js  -> stage3d.js   the stage: the same calls, answered in three.js on the place's own ground
//   ../battle/party.js  -> party3d.js   M7's own hero strip, whose moves also play on the heroes standing on the field
//   ../battle/tray.js   -> tray3d.js    M7's own dice tray, with real dice tumbling in it
//   ../../rules/battle.js -> rules-tap.js  M7's own rules, every one as it is; act() and foeTurn() are only watched, so
//                                       the field knows a command (a drink, a guard) before its events play
// Nothing else is swapped, and only for the battle screen: every other importer of those files gets M7's own.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SWAP = { '../battle/stage.js': 'stage3d.js', '../battle/party.js': 'party3d.js', '../battle/tray.js': 'tray3d.js', '../../rules/battle.js': 'rules-tap.js' };
const SCREEN = path.join('game', 'src', 'ui', 'screens', 'battle.js');

export default [{
  name: 'aethermoor-fight-swap',
  setup(b) {
    b.onResolve({ filter: /^(\.\.\/battle\/(stage|party|tray)|\.\.\/\.\.\/rules\/battle)\.js$/ }, (a) => {
      if (!a.importer.endsWith(SCREEN)) return undefined;
      return { path: path.join(here, SWAP[a.path]) };
    });
  },
}];
