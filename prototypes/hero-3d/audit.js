// The item audit (November 20, Chris: "make sure all of the weapons they could have are perfectly epic"): everything M7
// can roll or hand out, each built on the hero it suits and checked.
//   auditList() -> [{ key, label, hero, slot, item }]: every base (data/items.js) at every rarity, every weapon tempered
//     +7 and +10, every Codex relic (data/relics.js), every starter piece
//   checkBuilt(built, entry) -> flags [{ level: 'broken' | 'warn', text }]: missing, empty, floating (not in the hand),
//     hair through headgear, plain (a rare piece with little to it), not shown at all
import * as THREE from 'three';
import { ITEMS, SLOTS } from '../../game/src/data/items.js';
import { RELICS } from '../../game/src/data/relics.js';
import { RARITY_ORDER, itemArt, lookFor, rarityTier } from '../../game/src/art/item-looks.js';
import { HERO_ART } from '../../game/src/art/hero-looks.js';
import { generateItem, relicItem } from '../../game/src/rules/loot.js';
import { createRng } from '../../game/src/core/rng.js';

// who wears what: the hero each kind of thing suits
const HERO_FOR = {
  dagger: 'pip', bow: 'pip', sword: 'warden', axe: 'warden', hammer: 'warden', mace: 'alondra', spear: 'warden', staff: 'bryn',
  shield: 'warden', focus: 'alondra', hood: 'pip', coif: 'warden', kettle: 'warden', helm: 'warden', circlet: 'bryn', crown: 'alondra',
  robe: 'bryn', leather: 'pip', mail: 'warden', plate: 'warden', gloves: 'pip', gauntlets: 'warden', boots: 'pip', amulet: 'alondra', ring: 'bryn',
};
export const HERO_NAMES = { warden: 'Wren', pip: 'Pip', bryn: 'Bryn', alondra: 'Alondra' };
const heroForItem = (slot, kind) => HERO_FOR[kind] || { weapon: 'warden', offhand: 'warden', head: 'warden', body: 'warden', hands: 'warden', feet: 'pip', amulet: 'alondra', ring: 'bryn' }[slot] || 'warden';

export function auditList() {
  const out = [], rng = createRng('audit');
  for (const b of Object.values(ITEMS)) {
    if (!SLOTS.includes(b.slot)) continue;
    for (const r of RARITY_ORDER) {
      let it; try { it = generateItem(createRng(`audit:${b.id}:${r}`), { base: b.id, rarity: r, ilvl: 30 }); } catch (e) { it = null; }
      if (it) delete it.unidentified;
      out.push({ key: `${b.id}|${r}`, label: `${b.name}`, sub: r, hero: heroForItem(b.slot, b.kind), slot: b.slot, kind: b.kind, item: it });
    }
    if (b.slot === 'weapon') for (const t of [7, 10]) {
      const it = generateItem(createRng(`audit:${b.id}:t${t}`), { base: b.id, rarity: 'heirloom', ilvl: 30 }); delete it.unidentified; it.temper = t;
      out.push({ key: `${b.id}|+${t}`, label: `${b.name} +${t}`, sub: 'tempered at Hilda\'s', hero: heroForItem(b.slot, b.kind), slot: b.slot, kind: b.kind, item: it });
    }
  }
  for (const R of Object.values(RELICS)) {
    let it; try { it = relicItem(R.id, rng, { from: R.holder || 'the Codex' }); } catch (e) { it = null; }
    out.push({ key: `relic|${R.id}`, label: R.name, sub: 'Codex relic', hero: R.holder && HERO_ART[R.holder] ? R.holder : heroForItem(R.slot, R.kind), slot: R.slot, kind: R.kind, item: it, relic: true });
  }
  for (const h of Object.keys(HERO_NAMES)) for (const [slot, v] of Object.entries(HERO_ART[h].starter || {})) if (v) out.push({ key: `starter|${h}|${slot}`, label: `${HERO_NAMES[h]}'s starter ${slot}`, sub: 'starter', hero: h, slot, item: { ...v, starter: true } });
  return out;
}
// the gear an entry is shown in: the hero's starter kit with the piece put on (a two-handed weapon takes the off hand)
export function gearFor(entry) {
  const st = HERO_ART[entry.hero].starter || {}, g = {};
  for (const s of SLOTS) g[s] = st[s] ? { ...st[s], starter: true } : null;
  g[entry.slot] = entry.item;
  if (entry.slot === 'weapon' && entry.item && (ITEMS[entry.item.base]?.hands === 2 || ['bow', 'staff', 'spear'].includes(entry.item.kind))) g.offhand = null;
  if (entry.slot === 'offhand' && ['bow', 'staff', 'spear'].includes(g.weapon?.kind || g.weapon?.r)) g.weapon = { r: 'sword', p: st.weapon?.r === 'sword' ? st.weapon.p : HERO_ART.warden.starter.weapon.p };
  return g;
}

const _v = new THREE.Vector3(), _b = new THREE.Box3();
const meshesOf = o => { const m = []; o?.traverse(c => { if (c.isMesh) m.push(c); }); return m; };
function boxOf(o) { _b.makeEmpty(); for (const m of meshesOf(o)) { m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); _b.union(bb); } return _b.clone(); }
// the closest any vertex of `o` comes to the point p (world)
// (to the surface, not just the corners: a long rod has corners only at its ends)
const _t = new THREE.Triangle(), _a = new THREE.Vector3(), _bb = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Vector3();
function nearest(o, p) {
  let best = Infinity;
  for (const m of meshesOf(o)) {
    const pa = m.geometry.attributes.position, ix = m.geometry.index, n = ix ? ix.count : pa.count, inv = m.matrixWorld.clone().invert(), lp = p.clone().applyMatrix4(inv);
    const sc = new THREE.Vector3().setFromMatrixScale(m.matrixWorld).x;
    for (let i = 0; i < n; i += 3) { const ia = ix ? ix.getX(i) : i, ib = ix ? ix.getX(i + 1) : i + 1, ic = ix ? ix.getX(i + 2) : i + 2; _t.set(_a.fromBufferAttribute(pa, ia), _bb.fromBufferAttribute(pa, ib), _c.fromBufferAttribute(pa, ic)); _t.closestPointToPoint(lp, _q); best = Math.min(best, _q.distanceTo(lp) * sc); }
  }
  return best;
}
export function checkBuilt(B, entry) {
  const flags = [], { rig, looks } = B, S = rig.S, sc = rig.scale || 1, unit = S.total * sc; // unit: the hero's height on the stage
  const add = (level, text) => flags.push({ level, text });
  if (!entry.item) { add('broken', 'the game could not make this item'); return flags; }
  let art = null; try { art = itemArt(entry.item); } catch (e) { add('broken', 'no art: ' + e.message); }
  const look = looks?.[entry.slot];
  if (!look) add('broken', 'no look for this slot (nothing is drawn)');
  B.group.updateMatrixWorld(true);
  if (entry.slot === 'weapon' && look) {
    const w = rig.weapon;
    if (!w || !meshesOf(w).length) add('broken', 'the weapon has no shape');
    else {
      const bb = boxOf(w), size = bb.getSize(new THREE.Vector3()).length() / unit;
      if (size < 0.12) add('warn', 'the weapon is tiny');
      const arm = look.cls === 'bow' ? rig.armL : rig.armR, gp = arm.grip.getWorldPosition(new THREE.Vector3());
      const d = nearest(w, gp) / unit;
      if (d > 0.03) add('warn', `not in the hand (${Math.round(d * 172)} cm from the fist)`);
    }
  }
  if (entry.slot === 'offhand' && look) {
    const o = rig.offhand;
    if (!o || !meshesOf(o).length) add(B.looks.weapon?.cls === 'bow' ? 'warn' : 'broken', 'the off hand piece has no shape');
    else { const d = nearest(o, rig.armL.hand.getWorldPosition(new THREE.Vector3())) / unit; if (d > 0.06 && !o.userData.float) add('warn', `not held (${Math.round(d * 172)} cm from the hand)`); }
  }
  if (entry.slot === 'head' && look && ['helm', 'kettle', 'coif', 'hood'].includes(look.look)) {
    // hair poking through: a hair vertex outside the headgear at its own height, above the face
    const head = rig.head, K = m => m.material.userData?.kind, hairM = meshesOf(head).filter(m => K(m) === 'hair'), hatM = meshesOf(head).filter(m => !['hair', 'skin', 'glow', 'gem'].includes(K(m)) && !m.material.userData?.face);
    if (hairM.length && hatM.length) {
      const inv = head.matrixWorld.clone().invert(), bands = new Map(), r = S.headR;
      for (const m of hatM) { const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { _v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); const k = Math.round(_v.y / (r * 0.1)); bands.set(k, Math.max(bands.get(k) || 0, Math.hypot(_v.x, _v.z))); } }
      let out = 0, n = 0;
      for (const m of hairM) { const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i += 2) { _v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (_v.y < r * 0.25) continue; n++; const lim = bands.get(Math.round(_v.y / (r * 0.1))); if (lim === undefined || Math.hypot(_v.x, _v.z) > lim * 1.01) out++; } }
      if (n && out / n > 0.04) add('warn', `hair through the ${look.look} (${Math.round(out / n * 100)}% of the hair above the brow)`);
    }
  }
  // a rare piece with little to it: few materials, no gem, no glow
  const node = { weapon: rig.weapon, offhand: rig.offhand }[entry.slot];
  const tier = rarityTier(entry.item.rarity || (entry.relic ? 'heirloom' : 'worn'));
  if (node && tier >= 4) { const mats = new Set(meshesOf(node).map(m => m.material)); const glow = [...mats].some(m => m.emissiveIntensity > 0.4 || m.userData?.kind === 'gem' || m.userData?.kind === 'glow'); if (mats.size < 3 && !glow) add('warn', `plain for a ${entry.item.rarity || 'relic'} (${mats.size} materials, no gem or glow)`); }
  if (entry.slot === 'ring' && !rig.ring) add('broken', 'rings are not shown on the 3D hero');
  return flags;
}
