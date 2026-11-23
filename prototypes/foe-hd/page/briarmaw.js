// Kept so earlier callers keep working (November 20): Briarmaw now comes from the foe kit. New code should use
// kit/js/looks.js (register each foe's assets, then setBeastLook(foeLook(buildBeast))) and kit/js/loader.js.
import { ready, makeShared, makeFoe, cloneFoe, decodeLight } from '../kit/js/loader.js';
import * as quad from '../kit/js/moves/bear.js';     // his own lively set (November 23)
export { ready, makeShared, decodeLight };
export const buildBriarmawHD = (shared) => makeFoe(shared, quad);
export const cloneBriarmaw = (B) => cloneFoe(B, quad);
export function briarmawLook(shared, fallback) {
  let first = null;
  return (key, sprite, opts) => {
    if (key !== 'briarmaw') return fallback(key, sprite, opts);
    return first ? cloneFoe(first, quad) : (first = makeFoe(shared, quad));
  };
}
export const beastLookWithBriarmaw = briarmawLook;
