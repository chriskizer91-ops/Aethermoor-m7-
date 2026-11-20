// The 3D stage (November 20): M7's battle screen (game/src/ui/screens/battle.js) talks to its stage through about 30
// calls; this answers every one of them, as game/src/ui/battle/stage.js does, but on the 3D ground (arena.js). The
// screen's plates, intent dice, grip meters and numbers are placed from geom() and point(), in CSS px of the stage
// box, so they sit over the 3D figures. M7's FoeSprite is still made for each foe: the Initiative Ribbon's portraits,
// the Analyze sheet's picture and the idle-time rasters read it, as they do in 2D.
import { BACKDROPS } from '../../game/src/art/scenes.js';
import { itemIcon, RELIC_ART, ASPECT_LOOK } from '../../game/src/art/item-looks.js';
import { FoeSprite } from '../../game/src/ui/battle/sprites.js';
import { arena } from './arena.js';

export const TOP_CSS = 50;
const BOT_PLAIN = 62, BOT_HELD = 92;
const hex = (c) => (Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : c);

export class Stage {
  constructor(host, { backdrop, reduced, dark = false, fog = false }) {
    this.host = host;
    this.backdropKey = BACKDROPS[backdrop] ? backdrop : 'hearth-road';
    this.reduced = reduced; this.dark = !!dark; this.fog = !!fog;
    this._speed = 1;
    this.foes = new Map(); this.order = []; this.units = new Map();
    this.targets = new Set(); this.focusId = null; this.actorId = null;
    this.s = 1; this.lw = 360; this.lh = 240; this.ox = 0; this.oy = 0; this.cssW = 360; this.cssH = 240;
    this.version = 0; this.dropped = []; this.effects = [];
    this.pts = new Map(); // the last screen points handed out, and the world points they stand for
    // the flash (a sheet of colour over the stage) and the target markers: DOM over the 3D
    this.sheet = document.createElement('div'); this.sheet.className = 'f3-flash'; host.prepend(this.sheet);
    this.marks = document.createElement('div'); this.marks.className = 'f3-marks'; host.prepend(this.marks);
    arena.reduced = !!reduced; arena.stage = this;
    host.classList.add('f3-stage');
  }
  get speed() { return this._speed; }
  set speed(v) { this._speed = v; arena.speed = v; }

  // ---- foes ------------------------------------------------------------------------------------------------------
  addFoe(unit, { spawn = false } = {}) {
    if (this.foes.has(unit.id)) return this.foes.get(unit.id);
    const v = { id: unit.id, sprite: new FoeSprite(unit, this.reduced), x: 0, tx: 0, held: !!(unit.held && unit.held.length), removed: !!(unit.ko || unit.gone), fade: null, depth: 0, slotW: 140 };
    this.foes.set(unit.id, v); this.order.push(unit.id); this.units.set(unit.id, unit);
    arena.addFoe(unit, { spawn });
    return v;
  }
  setLook(id, unit) {
    this.units.set(id, unit);
    arena.foeLook(id, unit);
    const v = this.foes.get(id);
    return !!(v && v.sprite.setUnit(unit));
  }
  visible() { return this.order.map((id) => this.foes.get(id)).filter((v) => !v.removed); }

  layout() {
    this.botCss = [...this.foes.values()].some((v) => v.held) ? BOT_HELD : BOT_PLAIN;
    const r = this.host.getBoundingClientRect();
    this.cssW = Math.max(160, Math.round(r.width)); this.cssH = Math.max(140, Math.round(r.height));
    this.lw = this.cssW; this.lh = this.cssH;
    this.relayout();
  }
  // where M7's screen has put things, handed to the arena: it solves the camera from them
  relayout() {
    const r = this.host.getBoundingClientRect(), cv = arena.W && arena.W.renderer.domElement.getBoundingClientRect();
    if (!cv || !r.width) return;
    const shell = this.host.parentElement, party = shell && shell.querySelector('.bt-party');
    const cards = party ? [...party.querySelectorAll('.bt-hero')] : [];
    const heroes = cards.map((c) => { const b = c.getBoundingClientRect(); return { id: arena.byUnit.get(c.dataset.id) || c.dataset.id, x: b.left + b.width / 2 }; });
    const info = party && party.querySelector('.bt-hero-info'), space = party && party.querySelector('.bt-hero-space');
    const yH = info ? info.getBoundingClientRect().top - 2 : cv.bottom - 120;
    const yTop = space ? space.getBoundingClientRect().top + 4 : yH - 110;
    arena.layout({ view: cv, stage: r, yF: r.bottom - this.botCss - 2, heroes, yH, yTop, foes: this.order.slice() });
    this.formation(true);
  }
  formation() {
    this.version = (this.version || 0) + 1;
    arena.formation();
    for (const v of this.foes.values()) { const F = arena.foes.get(v.id); if (F) { v.x = v.tx = F.slot ?? v.x; v.slotW = F.slotW ?? v.slotW; } }
  }
  posed(id) { const F = arena.foes.get(id); return F ? (F.ko ? 'ko' : F.act ? 'attack' : F.hurt ? 'hurt' : F.sunk ? 'dive' : 'idle') : null; }

  // where a foe stands, in CSS px of the stage box (as M7's stage gives it)
  geom(id) {
    const v = this.foes.get(id), b = arena.box(id);
    if (!v || !b) return null;
    const r = this.host.getBoundingClientRect();
    return { cx: b.cx - r.left, left: b.left - r.left, right: b.right - r.left, top: b.top - r.top, bottom: b.floor - r.top, floor: b.floor - r.top, slotW: v.slotW, s: 1, stageH: this.cssH, sunk: !!arena.foes.get(id)?.sunk };
  }
  // a named point on a foe (center, feet, relic, head), in the stage box's px; the world point is kept with it
  point(id, name = 'center') {
    const w = arena.worldPoint(id, name), p = arena.project(w, false), r = this.host.getBoundingClientRect();
    const out = [Math.round(p.x - r.left), Math.round(p.y - r.top)];
    this.pts.set(out.join(','), w);
    if (this.pts.size > 40) this.pts.delete(this.pts.keys().next().value);
    return out;
  }
  world(x, y) { return this.pts.get(`${Math.round(x)},${Math.round(y)}`) || arena.worldPoint(this.focusId || this.order[0], 'center'); }

  // ---- the moves ---------------------------------------------------------------------------------------------------
  now() { return performance.now(); }
  setPose() {}
  attack(id) { arena.foeAttack(id, this.units.get(id)); }
  hurt(id, { big = false } = {}) { arena.foeHurt(id, big); }
  ko(id) {
    const v = this.foes.get(id); if (!v) return;
    arena.foeKo(id);
    v.fade = { kind: 'ko', start: this.now(), dur: 1700 / this.speed };
  }
  escape(id, kind = 'run') {
    const v = this.foes.get(id); if (!v) return;
    arena.foeGone(id, kind === 'wither' ? 'wither' : 'run');
    v.fade = { kind, start: this.now(), dur: 800 / this.speed };
  }
  revive(id) { const v = this.foes.get(id); if (!v) return; v.removed = false; v.fade = null; arena.foeRevive(id); this.formation(); }
  sink(id, down = true) { const F = arena.foes.get(id); if (!F) return; if (!!F.sinkTo === !!down) return; arena.foeSink(id, down); this.version++; }
  flashUnit(id, tint) { const F = arena.foes.get(id); if (F) F.hurt = { t: 0, dur: 0.3 }; }
  finishFades(t) {
    let changed = false;
    for (const v of this.foes.values()) if (v.fade && t >= v.fade.start + v.fade.dur) { v.removed = true; v.fade = null; changed = true; }
    if (changed) this.formation();
    return changed;
  }

  // ---- effects -----------------------------------------------------------------------------------------------------
  sparks(x, y, color = '#fff4c0', n = 12, o = {}) { arena.fx.sparks(this.world(x, y), hex(color), Math.min(this.reduced ? 4 : 40, n), o); }
  slash(id, color = '#ffffff', crit = false) { const F = arena.foes.get(id); if (F) arena.fx.slash(arena.worldPoint(id, 'center'), arena.cam, color, crit); }
  projectile(fromX, id, kind = 'arrow', color = '#f4e2b8') { arena.fx.shot(arena.heroPoint(arena.lastAttacker || arena.actor), arena.worldPoint(id, 'center'), kind, color); }
  ring(x, y, color = '#ffcb66', r1 = 40, dur = 600) {
    const w = this.world(x, y).clone(), F = [...arena.foes.values()].find((f) => f.pos.distanceTo(w) < 2.5);
    if (F) w.y = F.pos.y;
    arena.fx.ring(w, color, Math.max(1.2, r1 / 22), dur / 1000);
    if (r1 >= 50) arena.fx.pillar(w, color, 4);
  }
  flash(color = '#ffffff', dur = 260, alpha = 0.7) {
    if (this.reduced) return;
    const s = this.sheet; s.style.transition = 'none'; s.style.background = color; s.style.opacity = String(alpha * 0.8);
    void s.offsetWidth; s.style.transition = `opacity ${Math.round(dur / this.speed)}ms ease-out`; s.style.opacity = '0';
  }
  // the relic flies off the holder, tumbles and lands glinting on the ground beside it
  relicFly(id, relicId, item) {
    const art = item || RELIC_ART[relicId];
    let icon = null;
    try { icon = itemIcon(art, { size: 16 }); } catch { icon = null; }
    const F = arena.foes.get(id);
    if (!icon || !F) return null;
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; cv.getContext('2d').putImageData(icon, 0, 0);
    const big = document.createElement('canvas'); big.width = big.height = 64; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, 64, 64);
    const from = arena.worldPoint(id, 'relic'), to = F.pos.clone().addScaledVector(F.side, (F.size.w * 0.5 + 0.7) * (Math.random() < 0.5 ? -1 : 1)).addScaledVector(arena.dir, -0.6);
    to.y = arena.heightAt(to.x, to.z, F.pos.y);
    const drop = arena.fx.relic(from, to, big, 0.5);
    drop.id = id; this.dropped.push(drop);
    return drop;
  }
  star() {}

  // ---- drawing -----------------------------------------------------------------------------------------------------
  busy(t) {
    for (const v of this.foes.values()) if (v.fade) return true;
    return arena.busy();
  }
  draw(t) {
    this.finishFades(t);
    // a marker over each foe that can be picked, and over the one whose turn it is (CSS, over the 3D)
    const want = [];
    for (const v of this.visible()) {
      if (this.targets.has(v.id)) want.push([v.id, v.id === this.focusId ? 'focus' : 'aim']);
      else if (v.id === this.actorId && !this.targets.size) want.push([v.id, 'turn']);
    }
    const key = want.map((w) => w.join(':')).join('|') + this.version;
    if (key === this.markKey) return;
    this.markKey = key;
    this.marks.replaceChildren(...want.map(([id, k]) => {
      const g = this.geom(id); const d = document.createElement('i'); d.className = `f3-mark ${k}`;
      if (g) { d.style.left = `${Math.round(g.cx)}px`; d.style.top = `${Math.round(g.top - 4)}px`; }
      if (g && k === 'focus') { const b = document.createElement('b'); b.className = 'f3-ring'; b.style.left = `${Math.round(g.cx)}px`; b.style.top = `${Math.round(g.floor)}px`; b.style.width = `${Math.round(Math.max(60, g.right - g.left) * 1.1)}px`; return [d, b]; }
      return [d];
    }).flat());
  }
}

export function aspectColor(aspect) {
  const L = aspect && ASPECT_LOOK[aspect];
  return L ? L.light || L.color : '#fff4c0';
}
