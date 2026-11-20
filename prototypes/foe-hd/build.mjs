// Builds the side-by-side page into one file: dist/briarmaw.html (open it) and dist/briarmaw.artifact.html (publish it).
//   node build.mjs                 the three-way page
//   node build.mjs --page=sculpt   the sculpt beside its light version (for a laptop)
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const page = args.page || 'main';
const out = args.out || (page === 'sculpt' ? 'briarmaw-sculpt' : 'briarmaw');
const withSculpt = !!args.sculpt;
const a = (f) => JSON.stringify(path.join(here, 'assets', f));
const assetsModule = `
import lightMeta from ${a('light.json')}; import lightBin from ${a('light.bin')};
import c2 from ${a('color-2048.webp')}; import n2 from ${a('normal-2048.webp')};
import ao from ${a('ao-1024.webp')}; import emit from ${a('emit-256.webp')};
${page === 'sculpt' ? `import sculptGlb from ${a('briarmaw-sculpt.glb')};` : 'const sculptGlb = null;'}
const sculptMeta = null, sculptBin = null;
export const A = { lightMeta, lightBin, tex: { 2048: { color: c2, normal: n2 } }, ao, emit, sculptMeta, sculptBin, sculptGlb };`;
const plugin = { name: 'assets', setup(b) {
  b.onResolve({ filter: /^\.\/assets\.js$/ }, () => ({ path: 'assets', namespace: 'foe-assets' }));
  b.onLoad({ filter: /.*/, namespace: 'foe-assets' }, () => ({ contents: assetsModule, resolveDir: here, loader: 'js' }));
} };
const res = await build({ entryPoints: [path.join(here, page === 'sculpt' ? 'page/sculpt.js' : 'page/main.js')], bundle: true, format: 'iife', target: 'es2020', write: false,
  minify: true, legalComments: 'none', plugins: [plugin], loader: { '.bin': 'binary', '.webp': 'dataurl', '.glb': 'binary' },
  nodePaths: [path.join(here, 'node_modules')] });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = (await readFile(path.join(here, page === 'sculpt' ? 'page/sculpt-shell.html' : 'page/shell.html'), 'utf8')).replace('/*SCRIPT*/', () => js);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
await writeFile(path.join(here, `dist/${out}.html`), full);
await writeFile(path.join(here, `dist/${out}.artifact.html`), body);
console.log(`built dist/${out}.html (${(Buffer.byteLength(full) / 1024 / 1024).toFixed(1)} MB)`);
