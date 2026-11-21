// game3d/foes-hd.mjs: the full-detail foes for the game (Together, November 20), as one module the page imports
// ('game3d:foes-hd' -> { FOES_HD: [assets, ...] }), made at build time from session 6's foe kit: every foe with a
// finished kit folder (prototypes/foe-hd/foes/<key>/foe.json and assets/color-<phone>.webp), at its phone size.
// Which foes: GAME3D_FOES_HD=briarmaw,rotwarden (default: every finished one; 'none' for none).
import path from 'node:path';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', 'prototypes', 'foe-hd', 'foes');
export function finished() {
  if (!existsSync(ROOT)) return [];
  return readdirSync(ROOT).filter((k) => {
    const d = path.join(ROOT, k); if (!existsSync(path.join(d, 'foe.json'))) return false;
    const cfg = JSON.parse(readFileSync(path.join(d, 'foe.json'), 'utf8')), res = cfg.bake?.phone || 1024;
    return ['light.json', 'light.bin', `color-${res}.webp`, `normal-${res}.webp`, 'ao-1024.webp'].every((f) => existsSync(path.join(d, 'assets', f)));
  });
}
const want = process.env.GAME3D_FOES_HD;
const KEYS = want === 'none' ? [] : want ? want.split(',').filter((k) => finished().includes(k)) : finished();
function source() {
  const lines = [], names = [];
  KEYS.forEach((key, i) => {
    const d = path.join(ROOT, key), cfg = JSON.parse(readFileSync(path.join(d, 'foe.json'), 'utf8')), res = cfg.bake?.phone || 1024;
    const a = (f) => JSON.stringify(path.join(d, 'assets', f));
    const emit = existsSync(path.join(d, 'assets', 'emit-256.webp'));
    lines.push(`import c${i} from ${a(`color-${res}.webp`)}; import n${i} from ${a(`normal-${res}.webp`)}; import m${i} from ${a('light.json')}; import b${i} from ${a('light.bin')}; import ao${i} from ${a('ao-1024.webp')};${emit ? ` import e${i} from ${a('emit-256.webp')};` : ` const e${i} = null;`}`);
    lines.push(`const F${i} = { key: ${JSON.stringify(key)}, name: ${JSON.stringify(cfg.name || key)}, lightMeta: m${i}, lightBin: b${i}, tex: { ${res}: { color: c${i}, normal: n${i} } }, ao: ao${i}, emit: e${i} };`);
    names.push(`F${i}`);
  });
  lines.push(`export const FOES_HD = [${names.join(', ')}];`);
  return lines.join('\n');
}
export default {
  name: 'game3d-foes-hd',
  setup(b) {
    b.onResolve({ filter: /^game3d:foes-hd$/ }, () => ({ path: 'foes-hd', namespace: 'game3d-foes-hd' }));
    b.onLoad({ filter: /.*/, namespace: 'game3d-foes-hd' }, () => ({ contents: source(), resolveDir: here, loader: 'js' }));
    b.onLoad({ filter: /foe-hd[\\/]foes[\\/].*\.bin$/ }, (a) => ({ contents: readFileSync(a.path), loader: 'binary' }));
  },
};
