// game3d/build.mjs: builds Hearth & Heirloom in 3D into one page, with world3d's page builder (world3d/build.mjs).
//   node game3d/build.mjs              Act One, phone sizes: world3d/dist/game3d-act1.html (open it) and .artifact.html
//   node game3d/build.mjs --act=sunscorch   the Sunscorch's page: world3d/dist/game3d-sunscorch-400.html
//   node game3d/build.mjs --tex=768    other sizes pass through (--tex, --paint, --herotex)
// Needs world3d/node_modules (a link to prototypes/hero-3d/node_modules: npm install there) and Python with Pillow.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ACT_ONE = ['keep', 'keep-hall', 'hearth-road', 'thornhollow', 'thornway', 'briarmaw-den', 'mossfall', 'mosswatch-1', 'mosswatch-2', 'hindwood', 'fawnrest', 'eldergrove', 'heartroot-1', 'heartroot-2'];
// a page per act or region (each under 16 MB): --act=act1 (default) or --act=sunscorch (Act Two's first region, with the
// Keep and its Great Hall to start from)
export const ACTS = {
  act1: { places: ACT_ONE, out: 'game3d-act1', name: null, foesHd: null },
  sunscorch: { title: 'Hearth & Heirloom: the Sunscorch', places: ['keep', 'keep-hall', 'sun-road', 'sandspire', 'dust-trail', 'dusthaven', 'deep-shaft-1', 'deep-shaft-2', 'glass-flats', 'miragewell', 'scorchgate', 'scorchgate-vaults'], out: 'game3d-sunscorch', name: 'Act Two, the Sunscorch', foesHd: 'none' },
};
const pass = process.argv.slice(2);
const has = (k) => pass.some((a) => a.startsWith('--' + k + '='));
const ACT = ACTS[(pass.find((a) => a.startsWith('--act=')) || '--act=act1').split('=')[1]] || ACTS.act1;
if (ACT.foesHd && !process.env.GAME3D_FOES_HD) process.env.GAME3D_FOES_HD = ACT.foesHd;
const args = [
  'build.mjs', '--html=../game3d/page.html', '--entry=../game3d/main.js', '--plugin=../game3d/swap.mjs',
  '--places=' + (has('places') ? pass.find((a) => a.startsWith('--places=')).split('=')[1] : ACT.places.join(',')),
  '--out=' + (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : ACT.out),
  ...(ACT.name && !has('name') ? ['--name=' + ACT.name] : []),
  ...(has('tex') ? [] : ['--tex=400']), ...(has('paint') ? [] : ['--paint=0.5']), ...(has('herotex') ? [] : ['--herotex=256']),
  ...pass.filter((a) => !/^--(places|out|act)=/.test(a)),
];
execFileSync('node', args, { cwd: path.join(here, '../world3d'), stdio: 'inherit', env: process.env });
// the page's tab title, per act (the shared builder's --name only rewrites the words "Act One")
if (ACT.title) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const out = (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : ACT.out) + '-' + (has('tex') ? pass.find((a) => a.startsWith('--tex=')).split('=')[1] : '400');
  for (const f of [`${out}.html`, `${out}.artifact.html`]) {
    const p = path.join(here, '../world3d/dist', f);
    writeFileSync(p, readFileSync(p, 'utf8').replace('<title>Hearth &amp; Heirloom in 3D</title>', `<title>${ACT.title.replace(/&/g, '&amp;')}</title>`));
  }
}
