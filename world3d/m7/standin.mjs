// standin.mjs (Places, November 20): a stand-in painting for a map that has none yet (the Hearth Below's four, until
// Chris's batch 4 comes), drawn from M7's own tile art (game/src/art/tiles.js tileAtlas, the 2D game's tiles for the
// map's biome, overhead pass included), with no markers. Writes m7/standins/<id>.webp, 32 px a tile; convert.mjs uses it
// when game/src/ui/assets/paint/<id>.js doesn't exist.
//   NODE_PATH=$(npm root -g) node m7/standin.mjs hollow-hall ash-stair chained-deep worldforge
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url)), GAME = path.join(here, '../../game');
const { build } = await import(pathToFileURL(path.join(here, '../node_modules/esbuild/lib/main.js')).href).catch(() => require('esbuild'));
const bundle = (await build({ stdin: { contents: "import { tileAtlas } from './src/art/tiles.js'; window.__tileAtlas = tileAtlas;", resolveDir: GAME, sourcefile: 'standin.js' }, bundle: true, format: 'iife', write: false, logLevel: 'silent' })).outputFiles[0].text;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: bundle });
mkdirSync(path.join(here, 'standins'), { recursive: true });
for (const id of process.argv.slice(2)) {
  const m = (await import(pathToFileURL(path.join(GAME, 'src/data/maps', id + '.js')).href)).default;
  const url = await page.evaluate(({ rows, w, h, biome }) => {
    const A = window.__tileAtlas(biome), T = 16, Z = 2;
    const src = document.createElement('canvas'); src.width = A.img.width; src.height = A.img.height; src.getContext('2d').putImageData(A.img, 0, 0);
    const c = document.createElement('canvas'); c.width = w * T * Z; c.height = h * T * Z; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(Z, Z);
    const blit = (ops, x, y) => { for (const [sx, sy, ow, oh, dx, dy] of ops) g.drawImage(src, sx, sy, ow, oh, x * T + dx, y * T + dy, ow, oh); };
    const cells = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = A.cell(rows, x, y, 0); cells.push([x, y, k]); blit(k.ground, x, y); }
    for (const [x, y, k] of cells) blit(k.over, x, y);
    return c.toDataURL('image/png');
  }, { rows: m.rows, w: m.w, h: m.h, biome: m.biome });
  const png = path.join(here, 'standins', id + '.png');
  writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'));
  // a little softened, so from above it reads as a painting rather than pixels, then WebP
  const { execFileSync } = await import('node:child_process');
  execFileSync('python3', ['-I', '-c', 'import sys,os\nfrom PIL import Image, ImageFilter\nim=Image.open(sys.argv[1]).convert("RGB").filter(ImageFilter.GaussianBlur(0.6))\nim.save(sys.argv[2],quality=86,method=6)\nos.remove(sys.argv[1])', png, png.replace('.png', '.webp')]);
  console.log(id, m.biome, m.w + 'x' + m.h);
}
await browser.close();
