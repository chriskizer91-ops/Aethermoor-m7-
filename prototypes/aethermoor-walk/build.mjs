// Builds the walk into one file: dist/aethermoor-walk.html (open it) and dist/aethermoor-walk.artifact.html (publish it).
// Like Coven of the Moon Faire's tools/build.py: every local <script src> goes inside the page, and every picture path in
// double quotes inside those scripts ("./..." from the page's folder, then the script's own; "art/..." from world/art/)
// becomes the picture itself. The heroes (hero-entry.js, with three.js) are bundled and go in at <!--HEROES-->.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)), W = path.join(here, 'world'), PAGES = path.join(W, 'pages');
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif' };
const PIC = /"((?:art\/|\.\/)[^"\n]+\.(webp|png|jpe?g|avif))"/g;
let pics = 0, bytes = 0; const left = [];
const inline = (code, dir) => code.replace(PIC, (m, p, ext) => {
  let f = p.startsWith('./') ? path.normalize(path.join(PAGES, p)) : path.join(W, p);
  if (p.startsWith('./') && !existsSync(f)) f = path.normalize(path.join(dir, p));
  if (!existsSync(f)) { left.push(p); return m; }
  const d = readFileSync(f); pics++; bytes += d.length;
  return `"data:${MIME[ext.toLowerCase()]};base64,${d.toString('base64')}"`;
});
const res = await build({ entryPoints: [path.join(here, 'hero-entry.js')], bundle: true, format: 'iife', target: 'es2020', write: false, minify: true, legalComments: 'none' });
const heroes = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
let html = readFileSync(path.join(PAGES, 'walk.html'), 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const f = path.normalize(path.join(PAGES, src)); return '<script>' + inline(readFileSync(f, 'utf8'), path.dirname(f)).replace(/<\/script/gi, '<\\/script') + '</script>'; });
html = html.replace('<!--HEROES-->', () => '<script>' + heroes + '</script>');
if (/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/data:[^"]+/g, ''))) console.log('note: the page names a web address');
mkdirSync(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n</head>\n<body>\n' + html + '</body>\n</html>\n';
writeFileSync(path.join(here, 'dist/aethermoor-walk.html'), full);
writeFileSync(path.join(here, 'dist/aethermoor-walk.artifact.html'), html);
console.log(`built dist/aethermoor-walk.html (${(Buffer.byteLength(full) / 1048576).toFixed(1)} MB, ${pics} pictures, ${(bytes / 1048576).toFixed(1)} MB of pictures${left.length ? `; ${left.length} paths left as they are, such as ${left[0]}` : ''})`);
