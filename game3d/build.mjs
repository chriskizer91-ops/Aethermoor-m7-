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
import { ARENA_SET } from '../world3d/m7/arenas/table.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ACT_ONE = ['keep', 'keep-hall', 'hearth-road', 'thornhollow', 'thornway', 'briarmaw-den', 'mossfall', 'mosswatch-1', 'mosswatch-2', 'hindwood', 'fawnrest', 'eldergrove', 'heartroot-1', 'heartroot-2'];
// a page per act or region (each under 16 MB): --act=act1 (default) or --act=sunscorch (Act Two's first region, with the
// Keep and its Great Hall to start from)
export const ACTS = {
  act1: { places: ACT_ONE, out: 'game3d-act1', name: null, foesHd: 'briarmaw,rotwarden,sapwight,briarling,glowcap,thornhound,rotstag', fullHd: 'briarmaw,briarling,glowcap,rotwarden,sapwight,boglurcher,rotstag,thornhound,rotgrub', paint: '0.4', herotex: '256', tex: '320' },   // the single file (lean): seven of Act One's eight full-detail foes (not the boglurcher) and the heroes at 256 px; --full: every Act One foe that passes
  ironspire: { title: 'Hearth & Heirloom: the Ironspire', places: ['keep', 'keep-hall', 'old-bridge', 'drystone-lea', 'plankford', 'shrinewood', 'silverfall', 'last-camp', 'rockslide-pass', 'peaks-veil', 'highfold', 'iron-stair', 'ironhold', 'ironhold-deeps', 'harrows-forge', 'stormwatch', 'frost-road', 'frostmere', 'frostmere-below'], out: 'game3d-ironspire', name: 'Act Two, the Ironspire', foesHd: 'old-horn,mother-anvil,rime-wolf,iron-sentinel,sentinel-captain', fullHd: 'old-horn,peak-troll,rockling,mother-anvil,forge-spark,rime-wolf,iron-sentinel,sentinel-captain', paint: '0.4' },   // the single file (lean): four of its six (not the peak-troll or the forge-spark)
  gloomfen: { title: 'Hearth & Heirloom: the Gloomfen', places: ['keep', 'keep-hall', 'mossfall', 'murkway', 'willowmurk', 'rotbridge', 'bogmire', 'lanternfen', 'mothers-hollow', 'long-boardwalk', 'misthollow', 'drowned-belfry', 'blackwater-reach', 'tidal-flats', 'causeway'], out: 'game3d-gloomfen', name: 'Act Two, the Gloomfen', foesHd: 'mire-leech,willow-wight,grandfather-willow,oldsnag,mirelord,drowned', fullHd: 'mire-leech,marsh-light,willow-wight,grandfather-willow,oldsnag,boglurcher,mirelord,old-jaws,blackwater-gar,blackwater-leviathan,drowned,bell-ringer', paint: '0.4' },
  act3: { title: 'Hearth & Heirloom: Act Three', places: ['keep', 'keep-hall', 'keep-gallery', 'keep-gallery-2', 'keep-gallery-3', 'hollow-hall', 'ash-stair', 'chained-deep', 'worldforge'], out: 'game3d-act3', name: 'Act Three, the Hollow Council', foesHd: 'unmade', fullHd: 'unmade' },   // the unmade (session 8's walker); the rest of its foes are Models' (armoured, wraiths, winged), always in
  sunscorch: { title: 'Hearth & Heirloom: the Sunscorch', places: ['keep', 'keep-hall', 'sun-road', 'sandspire', 'dust-trail', 'dusthaven', 'deep-shaft-1', 'deep-shaft-2', 'glass-flats', 'miragewell', 'scorchgate', 'scorchgate-vaults'], out: 'game3d-sunscorch', name: 'Act Two, the Sunscorch', foesHd: 'sand-wyrm,glass-scorpion,sand-skink,glass-matriarch,kharzul,ashen-warden', fullHd: 'sand-wyrm,glass-scorpion,sand-skink,glass-matriarch,kharzul,ashen-warden' },
};
const pass = process.argv.slice(2);
const has = (k) => pass.some((a) => a.startsWith('--' + k + '='));
const FULL = pass.includes('--full');
const ACT = ACTS[(pass.find((a) => a.startsWith('--act=')) || '--act=act1').split('=')[1]] || ACTS.act1;
// the kit's full-detail foes (those whose stretch check passes): the single file carries what fits, --full the act's own
const HD = FULL ? ACT.fullHd : ACT.foesHd;
if (HD && !process.env.GAME3D_FOES_HD) process.env.GAME3D_FOES_HD = HD;
// the arena sets (the Fight's step 6, Places' sets; world3d/m7/arenas/table.js): each page carries only the sets its own
// places use, named among its places (arena-<set>: world3d/coven/places/m7-arena-<set>.js); --no-arenas leaves them out
const withArenas = (places) => pass.includes('--no-arenas') ? places : [...places, ...new Set(places.map((p) => ARENA_SET['m7-' + p]).filter(Boolean))];
const args = [
  'build.mjs', '--html=../game3d/page.html', '--entry=../game3d/main.js', '--plugin=../game3d/swap.mjs',
  '--places=' + withArenas(has('places') ? pass.find((a) => a.startsWith('--places=')).split('=')[1].split(',') : ACT.places).join(','),
  '--out=' + (has('out') ? pass.find((a) => a.startsWith('--out=')).split('=')[1] : ACT.out),
  ...(ACT.name && !has('name') ? ['--name=' + ACT.name] : []),
  // --full: every picture at its own size (no --tex, --paint or --herotex); meant with --files, the pictures beside the page
  ...(FULL || has('tex') ? [] : ['--tex=' + (ACT.tex || '400')]), ...(FULL || has('paint') ? [] : ['--paint=' + (ACT.paint || '0.5')]), ...(FULL || has('herotex') ? [] : ['--herotex=' + (ACT.herotex || '256')]),
  // the single file is packed (Places' --lean: scripts deflated, the continent's ground at phone size, data maps as
  // lossless WebP; nothing changes on screen), which frees room for sharper heroes and more full-detail foes
  ...(FULL || pass.includes('--no-lean') ? [] : ['--lean']),
  ...pass.filter((a) => !/^--(places|out|act)=/.test(a) && a !== '--full' && a !== '--no-lean' && a !== '--no-arenas'),
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
