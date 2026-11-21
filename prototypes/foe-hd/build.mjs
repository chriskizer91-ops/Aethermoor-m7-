// Builds a foe's pages with the kit (November 20), each one file:
//   node build.mjs --foe=<key> [--page=three|sculpt]        dist/<key>.html, dist/<key>-sculpt.html (+ .artifact.html)
//   node build.mjs --foes=a,b,c --entry=pages/<lane>/main.js --shell=pages/<lane>/shell.html --out=<name>
//       a lane's own gallery: its entry imports { FOES } (every listed foe's assets) from './assets.js'
// A foe's assets come from foes/<key>/assets (made by kit/make.sh) and foes/<key>/foe.json.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const page = args.page || 'three';
const keys = (args.foes || args.foe || 'briarmaw').split(',');
const entry = args.entry ? path.resolve(here, args.entry) : path.join(here, page === 'sculpt' ? 'kit/js/viewer.js' : 'pages/kit/three.js');
const shell = args.shell ? path.resolve(here, args.shell) : path.join(here, page === 'sculpt' ? 'pages/kit/sculpt.html' : 'pages/kit/three.html');
const out = args.out || (page === 'sculpt' ? `${keys[0]}-sculpt` : keys[0]);

// one assets module: every foe's light model, pictures and notes (and, for the sculpt page, its sculpt)
const lines = [], names = [];
for (const [i, key] of keys.entries()) {
  const dir = path.join(here, 'foes', key), cfg = JSON.parse(await readFile(path.join(dir, 'foe.json'), 'utf8'));
  const a = (f) => JSON.stringify(path.join(dir, 'assets', f)), tex = [];
  for (const res of [...new Set([cfg.bake?.res || 2048, cfg.bake?.phone || 1024])]) {
    if (existsSync(path.join(dir, 'assets', `color-${res}.webp`)) && !(args.phone && res > (cfg.bake?.phone || 1024)) && !(res !== (cfg.bake?.res || 2048) && !args.phone)) {
      lines.push(`import c${i}_${res} from ${a(`color-${res}.webp`)}; import n${i}_${res} from ${a(`normal-${res}.webp`)};`);
      tex.push(`${res}: { color: c${i}_${res}, normal: n${i}_${res} }`);
    }
  }
  lines.push(`import m${i} from ${a('light.json')}; import b${i} from ${a('light.bin')}; import ao${i} from ${a('ao-1024.webp')}; import e${i} from ${a('emit-256.webp')};`);
  const hasOrm = existsSync(path.join(dir, 'assets', 'orm-1024.webp'));
  lines.push(hasOrm ? `import o${i} from ${a('orm-1024.webp')};` : `const o${i} = null;`);
  const sculpt = page === 'sculpt' && i === 0 ? `import s${i} from ${a(`${key}-sculpt.glb`)};` : `const s${i} = null;`;
  lines.push(sculpt);
  lines.push(`const F${i} = { key: ${JSON.stringify(key)}, name: ${JSON.stringify(cfg.name || key)}, lightMeta: m${i}, lightBin: b${i}, tex: { ${tex.join(', ')} }, ao: ao${i}, emit: e${i}, orm: o${i}, glow: ${cfg.glow ? Number(cfg.glow) : 'undefined'}, glowIntensity: ${cfg.glowIntensity ?? 'undefined'},
  sculptGlb: s${i}, sculptUrl: ${JSON.stringify(cfg.pages?.sculpt || null)}, blurb: ${JSON.stringify(cfg.blurb || '')}, next: ${JSON.stringify(cfg.next || '')} };`);
  names.push(`F${i}`);
}
lines.push(`export const FOES = [${names.join(', ')}]; export const A = F0;`);
const plugin = { name: 'foe-assets', setup(b) {
  b.onResolve({ filter: /^\.\/assets\.js$/ }, () => ({ path: 'assets', namespace: 'foe-assets' }));
  b.onLoad({ filter: /.*/, namespace: 'foe-assets' }, () => ({ contents: lines.join('\n'), resolveDir: here, loader: 'js' }));
} };
const res = await build({ entryPoints: [entry], bundle: true, format: 'iife', target: 'es2020', write: false, minify: true,
  legalComments: 'none', plugins: [plugin], loader: { '.bin': 'binary', '.webp': 'dataurl', '.glb': 'binary' },
  nodePaths: [path.join(here, 'node_modules')] });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
// the page's title names the foe (one foe's page), e.g. "Boglurcher Three Ways"
const foeName = args.foe ? JSON.parse(await readFile(path.join(here, 'foes', args.foe, 'foe.json'), 'utf8')).name : null;
const body = (await readFile(shell, 'utf8')).replace('/*SCRIPT*/', () => js)
  .replace(/<title>Foe (Three Ways|Sculpt)<\/title>/, (m, w) => foeName ? `<title>${foeName} ${w}</title>` : m);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
await writeFile(path.join(here, `dist/${out}.html`), full);
await writeFile(path.join(here, `dist/${out}.artifact.html`), body);
console.log(`built dist/${out}.html (${(Buffer.byteLength(full) / 1024 / 1024).toFixed(1)} MB)`);
