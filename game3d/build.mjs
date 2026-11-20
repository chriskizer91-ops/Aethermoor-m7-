// game3d/build.mjs: builds Hearth & Heirloom in 3D into one page, with world3d's page builder (world3d/build.mjs).
//   node game3d/build.mjs              Act One, phone sizes: world3d/dist/game3d-act1.html (open it) and .artifact.html
//   node game3d/build.mjs --tex=768    other sizes pass through (--tex, --paint, --herotex)
// Needs world3d/node_modules (a link to prototypes/hero-3d/node_modules: npm install there) and Python with Pillow.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ACT_ONE = ['keep', 'keep-hall', 'hearth-road', 'thornhollow', 'thornway', 'briarmaw-den', 'mossfall', 'mosswatch-1', 'mosswatch-2', 'hindwood', 'fawnrest', 'eldergrove', 'heartroot-1', 'heartroot-2'];
const pass = process.argv.slice(2);
const has = (k) => pass.some((a) => a.startsWith('--' + k + '='));
const args = [
  'build.mjs', '--html=../game3d/page.html', '--entry=../game3d/main.js', '--plugin=../game3d/swap.mjs',
  '--places=' + (has('places') ? pass.find((a) => a.startsWith('--places=')).split('=')[1] : ACT_ONE.join(',')),
  '--out=' + (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : 'game3d-act1'),
  ...(has('tex') ? [] : ['--tex=512']), ...(has('paint') ? [] : ['--paint=0.6']), ...(has('herotex') ? [] : ['--herotex=256']),
  ...pass.filter((a) => !/^--(places|out)=/.test(a)),
];
execFileSync('node', args, { cwd: path.join(here, '../world3d'), stdio: 'inherit' });
