// Builds Aethermoor in 3D into one file: dist/aethermoor-3d.html (open it) and dist/aethermoor-3d.artifact.html
// (publish it). Like Coven of the Moon Faire's tools/build.py: every local <script src> goes inside the page, and every
// picture path in double quotes inside those scripts becomes the picture itself ("./x" read from the page's folder, then
// the script's, then the script's parent; "art/x" from coven/art/). The heroes (heroes.js, with three.js) are bundled
// and go in at <!--HEROES-->.
//   node build.mjs              textures as kept (1024 px): a laptop file
//   node build.mjs --tex=512    textures shrunk to 512 px for a page a phone opens from a link (16 MB at most)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)), PAGE = path.join(here, 'coven/pages/aethermoor.html'), PAGES = path.dirname(PAGE);
const TEX = +((process.argv.find((a) => a.startsWith('--tex=')) || '').split('=')[1] || 0);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif' };
const PIC = /"((?:art\/|\.\/)[^"\n]+\.(webp|png|jpe?g|avif))"/g;
let pics = 0, bytes = 0; const left = new Set();
// a smaller copy of a texture (never of the land's data pictures), made once into .cache/
function sized(f) {
  if (!TEX || /terrain|height|kinds|grounds|place-layers|building-layers|ground-layers/.test(f) || f.endsWith('.png')) return f;
  const out = path.join(here, '.cache', 'tex' + TEX, path.relative(here, f));
  if (!existsSync(out)) { mkdirSync(path.dirname(out), { recursive: true }); execFileSync('python3', ['-I', '-c', `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]);im.load();w,h=im.size;k=min(1,${TEX}/max(w,h))\nif k<1: im=im.resize((round(w*k),round(h*k)),Image.LANCZOS)\nim.save(sys.argv[2],quality=78,method=6)`, f, out]); }
  return out;
}
const inline = (code, dir) => code.replace(PIC, (m, p, ext) => {
  const tries = p.startsWith('./') ? [path.join(PAGES, p), path.join(dir, p), path.join(dir, '..', p)] : [path.join(here, 'coven', p)];
  const f = tries.map((q) => path.normalize(q)).find(existsSync);
  if (!f) { left.add(p); return m; }
  // each picture goes into the page once (window.__PIC, before every script) and is named by its number where it is used
  const key = sized(f);
  if (!seen.has(key)) { const d = readFileSync(key); seen.set(key, table.length); table.push(`"data:${MIME[ext.toLowerCase()]};base64,${d.toString('base64')}"`); pics++; bytes += d.length; }
  return `(window.__PIC[${seen.get(key)}])`;
});
const seen = new Map(), table = [];
const res = await build({ entryPoints: [path.join(here, 'heroes.js')], bundle: true, format: 'iife', target: 'es2020', write: false, minify: true, legalComments: 'none' });
const heroes = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
let html = readFileSync(PAGE, 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const f = path.normalize(path.join(PAGES, src)); return '<script>' + inline(readFileSync(f, 'utf8'), path.dirname(f)).replace(/<\/script/gi, '<\\/script') + '</script>'; });
html = html.replace('<!--HEROES-->', () => '<script>window.__PIC=[' + table.join(',') + '];</script><script>' + heroes + '</script>');
mkdirSync(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n</head>\n<body>\n' + html + '</body>\n</html>\n';
const name = TEX ? `aethermoor-3d-${TEX}` : 'aethermoor-3d';
writeFileSync(path.join(here, `dist/${name}.html`), full);
writeFileSync(path.join(here, `dist/${name}.artifact.html`), html);
console.log(`built dist/${name}.html (${(Buffer.byteLength(full) / 1048576).toFixed(1)} MB, ${pics} pictures, ${(bytes / 1048576).toFixed(1)} MB of pictures; ${left.size} stand-in paths left as they are)`);
