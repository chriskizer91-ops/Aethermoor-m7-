// The Fight (November 20): M7's battle screen, untouched, drawn on the 3D land. game/ is never edited: at build time
// (world3d/build.mjs --plugin=battle/swap.mjs) this plugin hands M7's battle screen (game/src/ui/screens/battle.js) our
// pieces in place of three of its own, by the very paths it imports them by:
//   ../battle/stage.js  -> stage3d.js   the stage: the same calls, answered in three.js on the place's own ground
//   ../battle/party.js  -> party3d.js   M7's own hero strip, whose moves also play on the heroes standing on the field
//   ../battle/tray.js   -> tray3d.js    M7's own dice tray, with real dice tumbling in it
//   ../../rules/battle.js -> rules-tap.js  M7's own rules, every one as it is; act() and foeTurn() are only watched, so
//                                       the field knows a command (a drink, a guard) before its events play
//   ../../rules/autoplay.js -> auto-tap.js  M7's Auto as it is; ?land=1 (a test switch) has it use plain attacks only
// Nothing else is swapped, and only for the battle screen: every other importer of those files gets M7's own.
import path from 'node:path';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SWAP = { '../battle/stage.js': 'stage3d.js', '../battle/party.js': 'party3d.js', '../battle/tray.js': 'tray3d.js', '../../rules/battle.js': 'rules-tap.js', '../../rules/autoplay.js': 'auto-tap.js' };
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

// The finished full-detail foes (the foe kit, prototypes/foe-hd, sessions 6-8): one module, 'fight-foe-assets', giving
// FOES, each foe's assets shaped as the kit's register() wants them. Only the foes this page names go in
// (FIGHT_HD=briarmaw,thornhound,...; default briarmaw), each at its phone size (its smallest colour picture of 512 px
// or more, its surface picture the same), and only foes in the kit's standard form (foes/<key>/assets: color-N.webp,
// normal-N.webp, light.json, light.bin, ao-N.webp, emit-256.webp); others are left to the sculpted or painted look.
const KIT = path.join(here, '..', '..', 'prototypes', 'foe-hd', 'foes');
const HD_KEYS = (process.env.FIGHT_HD || 'briarmaw').split(',').filter(Boolean);
const uri = (f) => 'data:image/webp;base64,' + readFileSync(f).toString('base64');
function foeModule(key, i) {
  const dir = path.join(KIT, key, 'assets');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir), res = files.map((f) => +(f.match(/^color-(\d+)\.webp$/) || [])[1]).filter((n) => n >= 512).sort((a, b) => a - b)[0];
  const ao = files.find((f) => /^ao-\d+\.webp$/.test(f)), emit = files.find((f) => /^emit-\d+\.webp$/.test(f));
  if (!res || !ao || !emit || !files.includes('light.json') || !files.includes(`normal-${res}.webp`)) return null;
  const meta = JSON.parse(readFileSync(path.join(dir, 'light.json'), 'utf8')); meta.key ??= key;
  return `const b${i} = atob(${JSON.stringify(readFileSync(path.join(dir, 'light.bin')).toString('base64'))}), l${i} = new Uint8Array(b${i}.length); for (let k = 0; k < b${i}.length; k++) l${i}[k] = b${i}.charCodeAt(k);
const F${i} = { key: ${JSON.stringify(key)}, lightMeta: ${JSON.stringify(meta)}, lightBin: l${i}, tex: { ${res}: { color: ${JSON.stringify(uri(path.join(dir, `color-${res}.webp`)))}, normal: ${JSON.stringify(uri(path.join(dir, `normal-${res}.webp`)))} } }, ao: ${JSON.stringify(uri(path.join(dir, ao)))}, emit: ${JSON.stringify(uri(path.join(dir, emit)))} };`;
}
const foeAssets = {
  name: 'aethermoor-fight-foes',
  setup(b) {
    b.onResolve({ filter: /^fight-foe-assets$/ }, () => ({ path: 'fight-foe-assets', namespace: 'fight-hd' }));
    b.onLoad({ filter: /.*/, namespace: 'fight-hd' }, () => {
      const mods = HD_KEYS.map((k, i) => [i, foeModule(k, i)]).filter(([, m]) => m);
      return { loader: 'js', contents: mods.map(([, m]) => m).join('\n') + `\nexport const FOES = [${mods.map(([i]) => 'F' + i).join(', ')}];` };
    });
  },
};
// one three.js for the whole page: every 'three' import, wherever it comes from (the foe kit has its own copy), is the
// heroes' (prototypes/hero-3d/node_modules/three, which world3d/node_modules points at)
const HERO3D = path.join(here, '..', '..', 'prototypes', 'hero-3d');
const oneThree = {
  name: 'aethermoor-one-three',
  setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, async (a) => {
      if (a.pluginData === 'one-three') return undefined;
      const r = await b.resolve(a.path, { resolveDir: HERO3D, kind: a.kind, pluginData: 'one-three' });
      return r.errors.length ? undefined : { path: r.path };
    });
  },
};

export default [oneThree, trimPack, foeAssets, {
  name: 'aethermoor-fight-swap',
  setup(b) {
    b.onResolve({ filter: /^(\.\.\/battle\/(stage|party|tray)|\.\.\/\.\.\/rules\/(battle|autoplay))\.js$/ }, (a) => {
      if (!a.importer.endsWith(SCREEN)) return undefined;
      return { path: path.join(here, SWAP[a.path]) };
    });
  },
}];
