// Builds the walkers' gallery into one file (session 8): dist/walkers.html (open it) and dist/walkers.artifact.html
// (publish it). Adapted from prototypes/foe-hd/build.mjs (session 6). Every foe with made assets in
// prototypes/foe-hd/foes/<key>/assets/ goes in (or only those named: --foes=rotwarden,sapwight).
//   node build.mjs [--foes=a,b] [--out=name] [--sculpt]   --sculpt: the laptop page of the sculpts themselves
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir, stat, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const sculptPage = !!args.sculpt;
const out = args.out || (sculptPage ? 'walkers-sculpt' : 'walkers');
const exists = (p) => access(p).then(() => true, () => false);
let keys = args.foes ? args.foes.split(',') : [];
if (!keys.length) for (const k of await readdir(path.join(root, 'foes'))) if (await exists(path.join(root, 'foes', k, 'assets', 'light.json'))) keys.push(k);
const FILES = ['light.bin', 'color.webp', 'normal.webp', 'orm.webp'];
let mod = '', entries = [];
for (const [i, k] of keys.entries()) {
  const d = path.join(root, 'foes', k, 'assets'); const j = (f) => JSON.stringify(path.join(d, f));
  const info = JSON.parse(await readFile(path.join(d, 'info.json'), 'utf8'));
  let bytes = 0; for (const f of FILES) bytes += (await stat(path.join(d, f))).size;
  const glow = await exists(path.join(d, 'emit.webp'));
  if (glow) bytes += (await stat(path.join(d, 'emit.webp'))).size;
  mod += `import m${i} from ${j('light.json')}; import b${i} from ${j('light.bin')}; import c${i} from ${j('color.webp')};
import n${i} from ${j('normal.webp')}; import o${i} from ${j('orm.webp')}; import k${i} from ${j('cmp.webp')}; import l${i} from ${j('outline.webp')};
import s${i} from ${JSON.stringify(path.resolve(root, '../../art-in/3d/sheets', `sheet-${k}.webp`))};
${glow ? `import e${i} from ${j('emit.webp')};` : `const e${i} = null;`}\n`;
  entries.push(`${JSON.stringify(k)}: { meta: m${i}, bin: b${i}, color: c${i}, normal: n${i}, orm: o${i}, cmp: k${i}, outline: l${i}, sheet: s${i}, emit: e${i}, bytes: ${bytes}, shapeTriangles: ${info.shapeTriangles} }`);
}
if (sculptPage) {
  mod = ''; entries = [];
  for (const [i, k] of keys.entries()) {
    const d = path.join(root, 'foes', k, 'sculpt');
    if (!(await exists(path.join(d, 'sculpt.json')))) continue;
    mod += `import m${i} from ${JSON.stringify(path.join(d, 'sculpt.json'))}; import b${i} from ${JSON.stringify(path.join(d, 'sculpt.bin'))};
import s${i} from ${JSON.stringify(path.resolve(root, '../../art-in/3d/sheets', `sheet-${k}.webp`))};\n`;
    entries.push(`${JSON.stringify(k)}: { meta: m${i}, bin: b${i}, sheet: s${i} }`);
  }
  mod += `export const SCULPTS = { ${entries.join(',\n')} };`;
} else mod += `export const ASSETS = { ${entries.join(',\n')} };`;
const plugin = { name: 'assets', setup(b) {
  b.onResolve({ filter: /^\.\/assets\.js$/ }, () => ({ path: 'assets', namespace: 'walker-assets' }));
  b.onLoad({ filter: /.*/, namespace: 'walker-assets' }, () => ({ contents: mod, resolveDir: here, loader: 'js' }));
} };
const res = await build({ entryPoints: [path.join(here, sculptPage ? 'sculpt.js' : 'main.js')], bundle: true, format: 'iife', target: 'es2020', write: false,
  minify: true, legalComments: 'none', plugins: [plugin], loader: { '.bin': 'binary', '.webp': 'dataurl', '.png': 'dataurl' },
  nodePaths: [path.join(root, 'node_modules')] });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = (await readFile(path.join(here, sculptPage ? 'sculpt-shell.html' : 'shell.html'), 'utf8')).replace('/*SCRIPT*/', () => js);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
await writeFile(path.join(here, `dist/${out}.html`), full);
await writeFile(path.join(here, `dist/${out}.artifact.html`), body);
console.log(`built dist/${out}.html with ${keys.join(', ')} (${(Buffer.byteLength(full) / 1024 / 1024).toFixed(1)} MB)`);
