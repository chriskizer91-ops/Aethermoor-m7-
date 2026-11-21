// Builds the beasts' gallery page into one file: dist/beasts.html (open it) and dist/beasts.artifact.html (publish it).
//   node build.mjs [--only=thornhound,rotstag] [--out=beasts] [--heroes=0] [--sculpt]   (--sculpt: the laptop page, with each
//   foe's full sculpt inside; use with --only to stay under 16 MB)
// Every foe listed in roster.json whose folder (../../foes/<key>/) has its assets/ made is put in.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, access, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const out = args.out || 'beasts';
const roster = JSON.parse(await readFile(path.join(here, 'roster.json'), 'utf8'));
const only = args.only ? String(args.only).split(',') : null;
const exists = (f) => access(f).then(() => true, () => false);
const foes = [];
let bytes = 0;
for (const r of roster) {
  const dir = path.join(here, '../../foes', r.key, 'assets');
  if ((only && !only.includes(r.key)) || !(await exists(path.join(dir, 'light.json')))) { foes.push({ ...r, ready: false }); continue; }
  const meta = JSON.parse(await readFile(path.join(here, '../../foes', r.key, 'foe.json'), 'utf8'));
  const files = { lightMeta: 'light.json', lightBin: 'light.bin', color: 'color-1024.webp', normal: 'normal-1024.webp', ao: 'ao-512.webp', cmp: 'cmp.webp' };
  if (await exists(path.join(dir, 'emit-256.webp'))) files.emit = 'emit-256.webp';
  if (args.sculpt && await exists(path.join(dir, 'sculpt.bin'))) { files.sculptMeta = 'sculpt.json'; files.sculptBin = 'sculpt.bin'; }
  let size = 0;
  for (const f of Object.values(files)) if (f !== 'cmp.webp' && !f.startsWith('sculpt')) size += (await stat(path.join(dir, f))).size;
  bytes += size;
  foes.push({ ...r, ...meta, ready: true, dir, files, size });
}
const q = (f) => JSON.stringify(f);
let mod = `export const FOES = [];\n`;
foes.forEach((f, i) => {
  if (!f.ready) { mod += `FOES.push(${JSON.stringify({ key: f.key, name: f.name, ready: false })});\n`; return; }
  const imps = Object.entries(f.files).map(([k, file]) => `import f${i}_${k} from ${q(path.join(f.dir, file))};`).join('\n');
  const { dir, files, ...info } = f;
  mod += `${imps}\nFOES.push({ ...${JSON.stringify(info)}, A: { ${Object.keys(f.files).map((k) => `${k}: f${i}_${k}`).join(', ')} } });\n`;
});
mod += `export const WITH_HEROES = ${args.heroes === '0' ? 'false' : 'true'};\n`;
const plugin = { name: 'foes', setup(b) {
  b.onResolve({ filter: /^virtual:foes$/ }, () => ({ path: 'foes', namespace: 'foe-assets' }));
  b.onLoad({ filter: /.*/, namespace: 'foe-assets' }, () => ({ contents: mod, resolveDir: here, loader: 'js' }));
} };
const res = await build({ entryPoints: [path.join(here, 'page/main.js')], bundle: true, format: 'iife', target: 'es2020', write: false,
  minify: true, legalComments: 'none', plugins: [plugin], loader: { '.bin': 'binary', '.webp': 'dataurl' },
  nodePaths: [path.join(here, '../../node_modules')] });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const body = (await readFile(path.join(here, 'page/shell.html'), 'utf8')).replace('/*SCRIPT*/', () => js);
await mkdir(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + body + '</body>\n</html>\n';
await writeFile(path.join(here, `dist/${out}.html`), full);
await writeFile(path.join(here, `dist/${out}.artifact.html`), body);
console.log(`built dist/${out}.html (${(Buffer.byteLength(full) / 1024 / 1024).toFixed(1)} MB; foes' assets ${(bytes / 1024 / 1024).toFixed(1)} MB)`);
