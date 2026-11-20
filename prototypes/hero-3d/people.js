// The townsfolk in 3D (November 20, for Together): any of M7's people, made by the heroes' builder from the very look
// their map sprite wears (art/map-sprites.js NPC_LOOKS, the same way npcSheet picks it), so Marta, Hilda, the gate
// guards, the refugees and the rest stand in the places as themselves. Tamsin and Vesper wear their battle looks, as on
// the map; anyone without a look gets the map's own made-up villager from their name.
//   personLook(npcId) -> { id, art, name, role, H, L }
//   buildPerson(npcId, { build }) -> buildHero's result ({ group, rig, fx, looks }) plus name and role; pose it with
//   setPose(rig, 'stand' | 'talk' | 'walk', t, step)
import { NPCS } from '../../game/src/data/npcs.js';
import { NPC_LOOKS } from '../../game/src/art/map-sprites.js';
import { foeLooks, FOE_ART } from '../../game/src/art/foes.js';
import { resolveGear } from '../../game/src/art/walkers.js';
import { buildHero } from './model.js';

const FOE_FIRST = new Set(['tamsin', 'vesper']);
// the map's villager for a name with no look of its own (a copy of art/map-sprites.js villager(), which isn't exported)
const strHash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const SKINS = ['skin', 'skinPale', 'skinTan', 'skinDeep'], HAIRS = ['hairBrown', 'hairBlack', 'hairAuburn', 'hairBlond', 'hairSilver', 'hairCopper'], STYLES = ['short', 'crop', 'long', 'pony', 'bun'];
const TUNICS = ['wool', 'gambeson', 'rags', 'clothBlue', 'hoodGreen', 'robeRed'];
function villager(key) {
  const h = strHash(key), pick = (a, s) => a[(h >>> s) % a.length];
  return { H: { build: (h & 3) === 3 ? 'brute' : 'human', skin: pick(SKINS, 2), hairMat: pick(HAIRS, 5), hair: pick(STYLES, 9), eye: '#2a2030', tunic: pick(TUNICS, 13), gloves: pick(SKINS, 2), boots: 'leather' }, gear: {} };
}
export function personLook(npcId) {
  const N = NPCS[npcId], art = N?.art || npcId;
  let look = FOE_FIRST.has(art) ? null : NPC_LOOKS[art];
  if (!look && FOE_ART[art]?.kind === 'humanoid') { const f = foeLooks(art, { gearTier: 0 }); if (f.H) return { id: npcId, art, name: N?.name || FOE_ART[art].name || art, role: N?.role || '', H: f.H, L: f.gear }; }
  if (!look) look = NPC_LOOKS[art] || villager(art);
  return { id: npcId, art, name: N?.name || art, role: N?.role || '', H: look.H, L: resolveGear(look.gear).L };
}
export function buildPerson(npcId, o = {}) {
  const P = personLook(npcId);
  const h = buildHero('warden', {}, { H: P.H, looks: P.L, build: o.build, lite: o.lite });
  return { ...h, name: P.name, role: P.role, id: npcId };
}
// everyone with a name in M7 (data/npcs.js), and the looks with no name entry (gate guards, miners...)
export const PEOPLE = [...new Set([...Object.keys(NPCS), ...Object.keys(NPC_LOOKS)])];

// personFigure(npcId, detail = 'light'): the same shape as Together's game3d/figures.js person() ({ root, height, rig,
// update(t, dt, walking) }), so it can be switched in by name; standing it stands about, fig.talking = true makes it
// talk, walking it walks. (world3d/heroes.js person() is the same person in actor()'s walker shape.)
import * as THREE from 'three';
import { setPose } from './model.js';
import { Q } from './kit.js';
export function personFigure(npcId, detail = 'light') {
  const L = buildLod(lite => buildPerson(npcId, { lite }), detail), h = L.hero, TALL = 1.72;
  const ph = Math.random() * 20; let step = 0;
  const F = { root: L.root, height: TALL, rig: h.rig, hero: h, lod: L, name: h.name, role: h.role, talking: false,
    update(t, dt, walking) { const c = L.pick(); F.rig = c.rig; if (walking) { step += dt * 7.2; setPose(c.rig, 'walk', t, step); } else setPose(c.rig, F.talking ? 'talk' : 'stand', t + ph, 0); } };
  return F;
}

/* ---- detail for walkers in the world (November 20, for phones) */
// buildLod(make, detail): make(lite) builds one figure (buildHero's result); detail is 'high' (laptops), 'light'
// (phones), 'lite' (phones, the figure in two draws: liteFigure), 'auto' (Light within LOD.near metres of the camera,
// Lite beyond; only the one showing is posed) or 'auto-high' (the same with High close up, for laptops). Returns { root, hero, lite, current, pick() } with every figure already
// scaled to a grown person's height (1.72 m) inside root; call pick() each frame (it returns the figure showing).
export const LOD = { near: 6, liteQ: 0.6 };
export function buildLod(make, detail = 'light') {
  const root = new THREE.Group(), TALL = 1.72;
  const mk = (q, lite) => { const keep = Q.d; Q.d = q; const h = make(lite); Q.d = keep; h.group.scale.setScalar(TALL / 1.22); root.add(h.group); return h; };
  if (detail !== 'auto' && detail !== 'auto-high') { const h = mk(detail === 'high' ? 2 : detail === 'lite' ? LOD.liteQ : 1, detail === 'lite'); return { root, hero: h, lite: null, current: h, pick: () => h }; }
  const full = mk(detail === 'auto-high' ? 2 : 1, false), lite = mk(LOD.liteQ, true);
  let cam = null; const seen = (r, s, c) => { if (c.isPerspectiveCamera) cam = c; };
  for (const h of [full, lite]) h.group.traverse(o => { if (o.isMesh) o.onBeforeRender = seen; });
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const L = { root, hero: full, lite, current: lite, pick() {
    let near = false; if (cam) { root.getWorldPosition(p); cam.getWorldPosition(q); near = p.distanceTo(q) < LOD.near; }
    full.group.visible = near; lite.group.visible = !near; return (L.current = near ? full : lite); } };
  lite.group.visible = true; full.group.visible = false;
  return L;
}
