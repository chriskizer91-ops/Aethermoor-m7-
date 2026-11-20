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
  const h = buildHero('warden', {}, { H: P.H, looks: P.L, build: o.build });
  return { ...h, name: P.name, role: P.role, id: npcId };
}
// everyone with a name in M7 (data/npcs.js), and the looks with no name entry (gate guards, miners...)
export const PEOPLE = [...new Set([...Object.keys(NPCS), ...Object.keys(NPC_LOOKS)])];
