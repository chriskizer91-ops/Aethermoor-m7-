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
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SWAP = { '../battle/stage.js': 'stage3d.js', '../battle/party.js': 'party3d.js', '../battle/tray.js': 'tray3d.js', '../../rules/battle.js': 'rules-tap.js' };
const SCREEN = path.join('game', 'src', 'ui', 'screens', 'battle.js');

// Chris's painted standees (Models' prototypes/bestiary/standees/pack.js holds every creature, 5 MB): only the ones
// this page meets go in. FIGHT_STANDEES=thornhound,briarling,... names them (all: every one).
const KEEP = (process.env.FIGHT_STANDEES || 'thornhound,briarling,briarmaw').split(',');
const trimPack = {
  name: 'aethermoor-fight-standees',
  setup(b) {
    b.onLoad({ filter: /bestiary[\\/]standees[\\/]pack\.js$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (KEEP.includes('all')) return { contents: src, loader: 'js' };
      const at = src.indexOf('{'), all = JSON.parse(src.slice(at).replace(/;\s*$/, ''));
      const kept = Object.fromEntries(Object.entries(all).filter(([k]) => KEEP.includes(k)));
      return { contents: 'export const STANDEES = ' + JSON.stringify(kept) + ';\n', loader: 'js' };
    });
  },
};

// One Foe's full-detail Briarmaw (prototypes/foe-hd, session 6): its assets as one module, 'fight-briarmaw-assets',
// shaped as its page/assets.js A. His colour and surface pictures go in at 1024 px (shrunk once into .cache) to keep
// the page under 16 MB; the sculpt (the laptop-only high version) stays out.
const HD = path.join(here, '..', '..', 'prototypes', 'foe-hd', 'assets'), CACHE = path.join(here, '..', '.cache', 'foe-hd');
function shrink(name, px) {
  const out = path.join(CACHE, `${px}-${name}`);
  if (!existsSync(out)) { mkdirSync(CACHE, { recursive: true }); execFileSync('python3', ['-I', '-c', `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]);im.load();im=im.resize((${px},${px}),Image.LANCZOS);im.save(sys.argv[2],quality=82,method=6)`, path.join(HD, name), out]); }
  return out;
}
const uri = (f) => 'data:image/webp;base64,' + readFileSync(f).toString('base64');
const briarmawAssets = {
  name: 'aethermoor-fight-briarmaw',
  setup(b) {
    b.onResolve({ filter: /^fight-briarmaw-assets$/ }, () => ({ path: 'fight-briarmaw-assets', namespace: 'fight-hd' }));
    b.onLoad({ filter: /.*/, namespace: 'fight-hd' }, () => {
      const meta = readFileSync(path.join(HD, 'light.json'), 'utf8'), bin = readFileSync(path.join(HD, 'light.bin')).toString('base64');
      return { loader: 'js', contents: `const b = atob(${JSON.stringify(bin)}), lightBin = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) lightBin[i] = b.charCodeAt(i);
export const A = { lightMeta: ${meta}, lightBin, tex: { 1024: { color: ${JSON.stringify(uri(shrink('color-2048.webp', 1024)))}, normal: ${JSON.stringify(uri(shrink('normal-2048.webp', 1024)))} } },
  ao: ${JSON.stringify(uri(path.join(HD, 'ao-1024.webp')))}, emit: ${JSON.stringify(uri(path.join(HD, 'emit-256.webp')))}, sculptMeta: null, sculptBin: null };` };
    });
  },
};

export default [trimPack, briarmawAssets, {
  name: 'aethermoor-fight-swap',
  setup(b) {
    b.onResolve({ filter: /^(\.\.\/battle\/(stage|party|tray)|\.\.\/\.\.\/rules\/battle)\.js$/ }, (a) => {
      if (!a.importer.endsWith(SCREEN)) return undefined;
      return { path: path.join(here, SWAP[a.path]) };
    });
  },
}];
