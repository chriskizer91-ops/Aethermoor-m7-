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
//   node build.mjs --page=m7-places --places=keep,hearth-road   Hearth & Heirloom's own places (m7/convert.mjs makes them)
//   --herotex=256                  the heroes' textures smaller, for a heavy page
const arg = (k) => (process.argv.find((a) => a.startsWith('--' + k + '=')) || '').split('=')[1];
const PAGE_ID = arg('page') || 'aethermoor';
const here = path.dirname(fileURLToPath(import.meta.url)), PAGE = path.join(here, 'coven/pages', PAGE_ID + '.html'), PAGES = path.dirname(PAGE);
const M7 = (arg('places') || '').split(',').filter(Boolean);
// (Places, November 20) --name="the Sunscorch" puts that name where the page says "Act One"; --out=m7-sunscorch names the file
const NAME = arg('name'), OUT = arg('out'), PAINTK = +(arg('paint') || 0);
const TEX = +((process.argv.find((a) => a.startsWith('--tex=')) || '').split('=')[1] || 0);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif' };
const PIC = /"((?:art\/|\.\/)[^"\n]+\.(webp|png|jpe?g|avif))"/g;
let pics = 0, bytes = 0; const left = new Set();
// a smaller copy of a texture (never of the land's data pictures), made once into .cache/
// (Places, November 20) --paint=0.75: the game's paintings (coven/art/m7/) at that scale and quality 70, for a page with many
function sized(f) {
  if (PAINTK && /\/art\/m7\//.test(f)) {
    const out = path.join(here, '.cache', 'paint' + PAINTK, path.basename(f));
    if (!existsSync(out)) { mkdirSync(path.dirname(out), { recursive: true }); execFileSync('python3', ['-I', '-c', `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]);im.load();w,h=im.size;k=${PAINTK}\nif k<1: im=im.resize((round(w*k),round(h*k)),Image.LANCZOS)\nim.save(sys.argv[2],quality=70,method=6)`, f, out]); }
    return out;
  }
  if (!TEX || /\/m7\/|terrain|height|kinds|grounds|place-layers|building-layers|ground-layers/.test(f) || f.endsWith('.png')) return f;
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
//   --entry=fight.js            bundle that module at <!--HEROES--> in place of heroes.js (it imports heroes.js itself); the
//                               CSS it imports goes in a <style> there too, and its pictures (png, webp) inside it
//   --plugin=battle/swap.mjs    esbuild plugins for that bundle (the module's default export: a list of plugins)
// (the Fight, November 20: both flags are new; without them the build is as it was)
const ENTRY = arg('entry'), PLUG = arg('plugin');
const plugins = PLUG ? (await import(path.join(here, PLUG))).default : [];
const res = await build({ entryPoints: [path.join(here, ENTRY || 'heroes.js')], bundle: true, format: 'iife', target: 'es2020', write: false, minify: true, legalComments: 'none',
  ...(ENTRY ? { outdir: path.join(here, '.cache/entry'), nodePaths: [path.join(here, 'node_modules')], loader: { '.png': 'dataurl', '.webp': 'dataurl' }, plugins } : {}) });
let heroes = res.outputFiles.filter((f) => !f.path.endsWith('.css')).map((f) => f.text).join('\n').replace(/<\/script/gi, '<\\/script');
const entryCss = res.outputFiles.filter((f) => f.path.endsWith('.css')).map((f) => f.text).join('\n');
// --herotex=N (hub, November 20): the heroes' own texture pictures (prototypes/hero-3d/textures/pack.js, inside the
// heroes' bundle) shrunk to N px for a page that would otherwise pass 16 MB. The pack itself is left as it is.
const HEROTEX = +(arg('herotex') || 0);
if (HEROTEX) {
  const tmp = path.join(here, '.cache', 'herotex'); mkdirSync(tmp, { recursive: true });
  const found = [...new Set(heroes.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) || [])];
  found.forEach((u, i) => writeFileSync(path.join(tmp, i + '.webp'), Buffer.from(u.split(',')[1], 'base64')));
  execFileSync('python3', ['-I', '-c', `import sys,os\nfrom PIL import Image\nd=sys.argv[1]\nfor f in os.listdir(d):\n  if not f.endswith('.webp') or f.startswith('s'): continue\n  im=Image.open(os.path.join(d,f));im.load();w,h=im.size;k=min(1,${HEROTEX}/max(w,h))\n  if k<1: im=im.resize((round(w*k),round(h*k)),Image.LANCZOS)\n  im.save(os.path.join(d,'s'+f),quality=80,method=6)`, tmp]);
  let before = heroes.length;
  found.forEach((u, i) => { heroes = heroes.split(u).join('data:image/webp;base64,' + readFileSync(path.join(tmp, 's' + i + '.webp')).toString('base64')); });
  console.log(`heroes' textures at ${HEROTEX} px: ${found.length} pictures, ${((before - heroes.length) / 1048576).toFixed(1)} MB lighter`);
}
let html = readFileSync(PAGE, 'utf8');
if (NAME) html = html.replace(/Act One/g, () => NAME.replace(/&/g, '&amp;'));
html = html.replace('<!--M7PLACES-->', () => M7.map((id) => `<script src="../places/m7-${id}.js"></script>`).join('\n'));
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const f = path.normalize(path.join(PAGES, src)); return '<script>' + inline(readFileSync(f, 'utf8'), path.dirname(f)).replace(/<\/script/gi, '<\\/script') + '</script>'; });
html = html.replace('<!--HEROES-->', () => (entryCss ? '<style>' + entryCss.replace(/<\/style/gi, '<\\/style') + '</style>' : '') + '<script>window.__PIC=[' + table.join(',') + '];</script><script>' + heroes + '</script>');
mkdirSync(path.join(here, 'dist'), { recursive: true });
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n</head>\n<body>\n' + html + '</body>\n</html>\n';
const base = OUT || (PAGE_ID === 'aethermoor' ? 'aethermoor-3d' : PAGE_ID), name = TEX ? `${base}-${TEX}` : base;
writeFileSync(path.join(here, `dist/${name}.html`), full);
writeFileSync(path.join(here, `dist/${name}.artifact.html`), html);
console.log(`built dist/${name}.html (${(Buffer.byteLength(full) / 1048576).toFixed(1)} MB, ${pics} pictures, ${(bytes / 1048576).toFixed(1)} MB of pictures; ${left.size} stand-in paths left as they are)`);
