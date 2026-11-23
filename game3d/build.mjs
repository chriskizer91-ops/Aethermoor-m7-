// game3d/build.mjs: builds Hearth & Heirloom in 3D into one page, with world3d's page builder (world3d/build.mjs).
//   node game3d/build.mjs              Act One, phone sizes: world3d/dist/game3d-act1.html (open it) and .artifact.html
//   node game3d/build.mjs --act=sunscorch   the Sunscorch's page: world3d/dist/game3d-sunscorch-400.html
//   node game3d/build.mjs --tex=768    other sizes pass through (--tex, --paint, --herotex)
//   node game3d/build.mjs --full --files --out=game3d-act1-full   every picture at full size, as files beside the page
//                                      (publish with world3d/dist/<out>.files.json as the files map)
// Needs world3d/node_modules (a link to prototypes/hero-3d/node_modules: npm install there) and Python with Pillow.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ACT_ONE = ['keep', 'keep-hall', 'hearth-road', 'thornhollow', 'thornway', 'briarmaw-den', 'mossfall', 'mosswatch-1', 'mosswatch-2', 'hindwood', 'fawnrest', 'eldergrove', 'heartroot-1', 'heartroot-2'];
// a page per act or region (each under 16 MB): --act=act1 (default) or --act=sunscorch (Act Two's first region, with the
// Keep and its Great Hall to start from)
export const ACTS = {
  act1: { places: ACT_ONE, out: 'game3d-act1', name: null, foesHd: 'briarmaw,rotwarden', fullHd: 'briarmaw,briarling,glowcap,rotwarden,sapwight,boglurcher,rotstag', paint: '0.4', herotex: '160', tex: '320' },   // the single file: Act One's two bosses in full detail (all that fits under 16 MB with the heroes' masters); --full: every Act One foe that passes
  ironspire: { title: 'Hearth & Heirloom: the Ironspire', places: ['keep', 'keep-hall', 'old-bridge', 'drystone-lea', 'plankford', 'shrinewood', 'silverfall', 'last-camp', 'rockslide-pass', 'peaks-veil', 'highfold', 'iron-stair', 'ironhold', 'ironhold-deeps', 'harrows-forge', 'stormwatch', 'frost-road', 'frostmere', 'frostmere-below'], out: 'game3d-ironspire', name: 'Act Two, the Ironspire', foesHd: 'none', fullHd: 'old-horn,peak-troll,rockling,mother-anvil,forge-spark', paint: '0.4' },   // the single file has no room for one (Mother Anvil alone is 1.3 MB)
  gloomfen: { title: 'Hearth & Heirloom: the Gloomfen', places: ['keep', 'keep-hall', 'mossfall', 'murkway', 'willowmurk', 'rotbridge', 'bogmire', 'lanternfen', 'mothers-hollow', 'long-boardwalk', 'misthollow', 'drowned-belfry', 'blackwater-reach', 'tidal-flats', 'causeway'], out: 'game3d-gloomfen', name: 'Act Two, the Gloomfen', foesHd: 'mire-leech', fullHd: 'mire-leech,marsh-light,willow-wight,grandfather-willow,oldsnag,boglurcher', paint: '0.4' },
  act3: { title: 'Hearth & Heirloom: Act Three', places: ['keep', 'keep-hall', 'keep-gallery', 'keep-gallery-2', 'keep-gallery-3', 'hollow-hall', 'ash-stair', 'chained-deep', 'worldforge'], out: 'game3d-act3', name: 'Act Three, the Hollow Council', foesHd: 'none', fullHd: 'none' },   // its foes are Models' (armoured, wraiths, winged), always in
  sunscorch: { title: 'Hearth & Heirloom: the Sunscorch', places: ['keep', 'keep-hall', 'sun-road', 'sandspire', 'dust-trail', 'dusthaven', 'deep-shaft-1', 'deep-shaft-2', 'glass-flats', 'miragewell', 'scorchgate', 'scorchgate-vaults'], out: 'game3d-sunscorch', name: 'Act Two, the Sunscorch', foesHd: 'sand-wyrm', fullHd: 'sand-wyrm,glass-scorpion,sand-skink,glass-matriarch' },
};
const pass = process.argv.slice(2);
const has = (k) => pass.some((a) => a.startsWith('--' + k + '='));
const FULL = pass.includes('--full');
const ACT = ACTS[(pass.find((a) => a.startsWith('--act=')) || '--act=act1').split('=')[1]] || ACTS.act1;
// the kit's full-detail foes (those whose stretch check passes): the single file carries what fits, --full the act's own
const HD = FULL ? ACT.fullHd : ACT.foesHd;
if (HD && !process.env.GAME3D_FOES_HD) process.env.GAME3D_FOES_HD = HD;
const args = [
  'build.mjs', '--html=../game3d/page.html', '--entry=../game3d/main.js', '--plugin=../game3d/swap.mjs',
  '--places=' + (has('places') ? pass.find((a) => a.startsWith('--places=')).split('=')[1] : ACT.places.join(',')),
  '--out=' + (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : ACT.out),
  ...(ACT.name && !has('name') ? ['--name=' + ACT.name] : []),
  // --full: every picture at its own size (no --tex, --paint or --herotex); meant with --files, the pictures beside the page
  ...(FULL || has('tex') ? [] : ['--tex=' + (ACT.tex || '400')]), ...(FULL || has('paint') ? [] : ['--paint=' + (ACT.paint || '0.5')]), ...(FULL || has('herotex') ? [] : ['--herotex=' + (ACT.herotex || '256')]),
  ...pass.filter((a) => !/^--(places|out|act)=/.test(a) && a !== '--full'),
];
execFileSync('node', args, { cwd: path.join(here, '../world3d'), stdio: 'inherit', env: process.env });
// the page's tab title, per act (the shared builder's --name only rewrites the words "Act One")
if (ACT.title) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const out = (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : ACT.out) + (FULL ? '' : '-' + (has('tex') ? pass.find((a) => a.startsWith('--tex=')).split('=')[1] : (ACT.tex || '400')));
  for (const f of [`${out}.html`, `${out}.artifact.html`]) {
    const p = path.join(here, '../world3d/dist', f);
    writeFileSync(p, readFileSync(p, 'utf8').replace('<title>Hearth &amp; Heirloom in 3D</title>', `<title>${ACT.title.replace(/&/g, '&amp;')}</title>`));
  }
}
