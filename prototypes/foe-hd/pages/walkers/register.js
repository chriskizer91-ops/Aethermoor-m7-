// The walkers for the foe kit's one setBeastLook (kit/js/looks.js), session 8. Each walker is registered with its own
// moves (foes.js, named for its M7 moves), so the Fight gets it from the same foeLook as every other finished foe:
//
//   import { ready } from '../../kit/js/loader.js'; import { register, foeLook } from '../../kit/js/looks.js';
//   import { registerWalkers } from './register.js'; import { ASSETS } from './assets.js';   // built by build.mjs
//   await ready(); registerWalkers(ASSETS, register); setBeastLook(foeLook(buildBeast));
//
// Until the kit's material reads the roughness/metal picture (asked of session 6), the kit draws the walkers with
// the shading picture only (the plate and gold less shiny than on the walkers' gallery, which uses walker.js).
import { FOES } from './foes.js';
import { movesFor } from './walker.js';

const BLACK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
export function kitAssets(key, a) {
  const f = FOES[key], res = a.res || 2048;
  return {
    key, name: f.name,
    lightMeta: { ...a.meta, key, plan: 'biped', height: f.height },
    lightBin: a.bin, tex: { [res]: { color: a.color, normal: a.normal } },
    ao: a.orm,                     // R is the shading in the folds (G roughness, B metal for a material that reads them)
    orm: a.orm, emit: a.emit || BLACK,
  };
}
// { phone: true } registers the phone versions (fewer triangles, smaller pictures) where a walker has one
export function registerWalkers(ASSETS, register, { phone = false } = {}) {
  return Object.keys(ASSETS).filter((k) => FOES[k]).map((k) => {
    const p = phone && ASSETS[k].phone, a = p ? { ...ASSETS[k], ...p, res: p.res || (ASSETS[k].res || 2048) / 2 } : ASSETS[k];
    return register(kitAssets(k, a), { res: a.res || 2048, moves: movesFor(FOES[k]) });
  });
}
