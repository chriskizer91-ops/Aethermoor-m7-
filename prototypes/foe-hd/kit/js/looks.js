// One setBeastLook for every finished foe (the foe kit, November 20). The Fight (world3d/battle/arena.js) calls
// fn(key, sprite, opts) and wants { group, height, plan, parts, update(t, step) } (plus hit, act, pose here).
//
//   import { ready } from 'kit/js/loader.js'; import { register, foeLook } from 'kit/js/looks.js';
//   await ready();
//   register(briarmawAssets); register(thornhoundAssets); ...      // each foe's assets module (see build.mjs)
//   setBeastLook(foeLook(buildBeast));                              // every other key falls back to buildBeast
import { makeShared, makeFoe, cloneFoe } from './loader.js';
import * as quad from './moves/quad.js';
import * as biped from './moves/biped.js';
import * as sapling from './moves/sapling.js';
import * as serpent from './moves/serpent.js';
import * as frog from './moves/frog.js';
import * as winged from './moves/winged.js';
import * as mushroom from './moves/mushroom.js';
import * as mound from './moves/mound.js';
import * as willow from './moves/willow.js';

export const PLANS = { quad, biped, sapling, serpent, frog, winged, mushroom, mound, willow };          // more as the lanes add them (serpent, frog, winged, wraith...)
const reg = new Map();

export function register(A, { res = A.tex[2048] ? 2048 : Number(Object.keys(A.tex)[0]), moves } = {}) {
  const key = A.lightMeta.key, plan = A.lightMeta.plan || 'quad';
  reg.set(key, { A, res, moves: moves || PLANS[plan] || quad, shared: null, first: null });
  return key;
}
export function registered(key) { return reg.has(key); }
export function makeRegistered(key) {
  const r = reg.get(key);
  r.shared ??= makeShared(r.A, r.res);
  if (!r.first) return (r.first = makeFoe(r.shared, r.moves));
  return cloneFoe(r.first, r.moves);
}
export function foeLook(fallback) {
  return (key, sprite, opts) => (reg.has(key) ? makeRegistered(key) : fallback(key, sprite, opts));
}
