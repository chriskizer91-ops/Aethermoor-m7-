// The arena (November 20): a fight on the very spot where the party met the foes, on the place's own ground. One per
// page. The page (fight.js) hands it the walking world (W, from coven/engine/place/walker.js) and the spot; M7's battle
// screen, given our stage (stage3d.js), hero strip (party3d.js) and tray (tray3d.js), drives it through the same calls
// it makes of its 2D stage. Here:
//   the camera   solved from where M7's screen puts things: the heroes' feet on the line just over their cards, each
//                hero over its own card, the foes' feet on the line just over their plates, the heroes the height of
//                the space above their cards. It swings round from behind the leader to there, and back after.
//   the heroes   the walking actors themselves (world3d/heroes.js), in their gear; whoever acts steps forward
//   the foes     people by the heroes' builder from their sprite's looks, beasts by the bestiary's body plans
//   the moves    moves.js; the effects effects.js
// Screen positions are CSS px of the page; geom()/point() turn them into the stage box's own, as M7's stage gives them.
import * as THREE from 'three';
import { buildHero, setPose } from '../../prototypes/hero-3d/model.js';
import { Q } from '../../prototypes/hero-3d/kit.js';
import { buildBeast, BEASTS } from '../../prototypes/bestiary/beasts.js';
import { FOE_ART, renderFoe, foeLooks } from '../../game/src/art/foes.js';
import { poseHero, poseFoe, strikeStyle, RANGED, foeMover } from './moves.js';
import { Fx } from './effects.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const seg = (u, a, b) => ease((u - a) / (b - a));
let HERO_H = 1.72;
const GAP = 4.2;          // metres between the heroes' line and the foes' (what the camera aims for)

export const arena = {
  on: false, W: null, speed: 1, reduced: false, heroes: new Map(), foes: new Map(), byUnit: new Map(), fx: null,
  lastRoll: null, lastCmd: null, actor: null, cam: null, want: null, swing: null, t: 0,
  onIdle: null, // the page's own frame while the fight is up (the party's figures it still moves)

  // ---- the page -----------------------------------------------------------------------------------------------
  // begin a fight: W the walking world, center the ground where the heroes stand, yaw the way to the foes;
  // heroes: { heroId: actor } (the walking actors, already in the scene); foes: figures from foeFigure(), in M7's order
  begin({ W, center, yaw, heroes, foes = [] }) {
    this.W = W; this.on = true; this.center = center.clone(); this.yaw = yaw;
    this.dir = V3(Math.sin(yaw), 0, Math.cos(yaw));
    this.scene = W.P.scene; this.cam = W.cam; this.renderer = W.renderer;
    this.fx = new Fx(this.scene); this.fx.speed = this.speed;
    this.heroes.clear(); this.foes.clear(); this.byUnit.clear(); this.pending = foes.slice();
    for (const [id, A] of Object.entries(heroes)) this.heroes.set(id, heroFigure(id, A, this));
    for (const h of this.heroes.values()) { h.pos.copy(h.A.root.position); h.home.copy(h.pos); h.face = h.A.root.rotation.y; }
    // the heroes' height as built (with hats and hair), so their heads come to the top of the space over their cards
    { const hs = [...this.heroes.values()].map((h) => { h.body.rotation.set(0, 0, 0); const b = new THREE.Box3().setFromObject(h.body); return b.max.y - h.A.root.position.y; }).filter((x) => x > 0.5 && x < 3); if (hs.length) HERO_H = Math.min(1.9, hs.reduce((a, b) => a + b, 0) / hs.length); }
    this.from = { pos: this.cam.position.clone(), q: this.cam.quaternion.clone(), fov: this.cam.fov };
    this.swing = null; this.want = null; this.layoutIn = null; this.actor = null;
    this.blobs = makeBlobs(this.scene, 12);
    const last = { t: performance.now() };
    const loop = (now) => {
      if (!this.on) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.12, (now - last.t) / 1000); last.t = now; this.t += dt;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  },
  // the fight is over: the camera swings back behind `leader` and the page walks again (done() once it has)
  end(done) {
    const back = this.from;
    this.swing = { t: 0, dur: 1.2, from: { pos: this.cam.position.clone(), q: this.cam.quaternion.clone(), fov: this.cam.fov }, to: back, done: () => { this.on = false; cancelAnimationFrame(this.raf); this.fx.clear(); removeBlobs(this.scene, this.blobs); for (const f of this.foes.values()) this.scene.remove(f.root); done && done(); } };
  },
  // a foe stands where M7's unit `id` does (the stage's addFoe): the pack's own figure if one was handed over
  addFoe(unit, { spawn = false } = {}) {
    let F = this.pending.find((f) => f.key === (FOE_ART[unit.art] ? unit.art : 'cutpurse') && !f.unit) || null;
    if (F) this.pending.splice(this.pending.indexOf(F), 1); else { F = foeFigure(unit); this.scene.add(F.root); }
    F.unit = unit.id; F.removed = !!(unit.ko || unit.gone); F.root.visible = !F.removed;
    if (spawn) { F.rising = 0; }
    this.foes.set(unit.id, F);
    return F;
  },

  // ---- layout: the camera, and where everyone stands ----------------------------------------------------------
  // L: { view (the canvas's rect), stage (the stage box's rect), yF (the foes' feet line), heroes: [{ id, x }],
  //      yH (the heroes' feet line), yTop (their heads' line), foes: [ids in the order they stand] } (CSS px)
  layout(L) {
    this.layoutIn = L;
    const cam = this.solve(L);
    if (!cam) return;
    const first = !this.want;
    this.want = cam;
    // where each stands: on the ground under its line, through the screen point it should be at
    const at = (x, y) => this.ground(x, y, cam);
    for (const { id, x } of L.heroes) { const h = this.heroes.get(id); if (h) { const p = at(x, L.yH); if (p) { h.home.copy(p); h.home.y = this.heightAt(p.x, p.z, p.y); } } }
    this.formation(L, cam);
    if (first) {
      // the swing round: from behind the leader to the fight's camera, the party walking to their places
      this.swing = { t: 0, dur: this.reduced ? 0.01 : 1.5, from: { pos: this.cam.position.clone(), q: this.cam.quaternion.clone(), fov: this.cam.fov }, to: cam };
      for (const h of this.heroes.values()) { h.walk = { from: h.pos.clone(), t: 0, dur: 1.1 }; }
      for (const f of this.foes.values()) { f.walk = { from: f.pos.clone(), t: 0, dur: 1.0 }; }
    } else if (!this.swing) Object.assign(this.camState = this.camState || {}, cam);
  },
  // the foes' places along their line (again after one falls or another joins)
  formation(L = this.layoutIn, cam = this.want) {
    if (!L || !cam) return;
    const vis = (L.foes || []).filter((id) => this.foes.get(id) && !this.foes.get(id).removed);
    const n = vis.length, pad = Math.min(60, L.stage.width * 0.12), w = L.stage.width - pad * 2;
    vis.forEach((id, i) => {
      const F = this.foes.get(id);
      const x = L.stage.left + pad + w * (i + 0.5) / n;
      const p = this.ground(x, L.yF, cam); if (!p) return;
      if (n >= 3 && i % 2 === 1) p.addScaledVector(this.dir, 0.9);
      p.y = this.heightAt(p.x, p.z, p.y);
      if (F.home.lengthSq() > 0 && !F.walk && this.want) F.walk = { from: F.pos.clone(), t: 0, dur: 0.6 };
      F.home.copy(p); F.slot = x - L.stage.left; F.slotW = Math.max(110, Math.min(200, L.stage.width / Math.max(1, n)));
    });
  },
  // the camera that puts the heroes' feet at yH, their heads at yTop and the foes' feet at yF, looking down `dir`
  solve(L) {
    const Wc = L.view.width, Hc = L.view.height; if (!Wc || !Hc) return null;
    const fov = Wc / Hc < 0.8 ? 44 : Wc / Hc < 1.3 ? 38 : 32;
    const f = (Hc / 2) / Math.tan(fov * Math.PI / 360), cy = Hc / 2;
    const yH = L.yH - L.view.top, yF = L.yF - L.view.top, yTop = L.yTop - L.view.top;
    let best = null;
    for (let p = 0.18; p <= 1.15; p += 0.01) {
      const aH = p + Math.atan((yH - cy) / f), aF = p + Math.atan((yF - cy) / f);
      if (aF < 0.04 || aH < 0.05) continue;
      const headY = (h) => { const DH = h / Math.tan(aH), a = Math.atan((h - HERO_H) / DH); return cy + f * Math.tan(a - p); };
      let lo = HERO_H + 0.01, hi = 60;
      if (headY(hi) < yTop) continue;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (headY(m) < yTop) lo = m; else hi = m; }
      const h = (lo + hi) / 2, DH = h / Math.tan(aH), DF = h / Math.tan(aF), G = DF - DH;
      const score = Math.abs(G - GAP) + Math.max(0, h - 12) * 0.5;
      if (!best || score < best.score) best = { score, p, h, DH, G };
    }
    if (!best) { const p = 0.5, h = 6; best = { p, h, DH: h / Math.tan(p), G: GAP }; }
    const c = this.center, pos = c.clone().addScaledVector(this.dir, -best.DH); pos.y = c.y + best.h;
    const look = pos.clone().addScaledVector(this.dir, Math.cos(best.p)).addScaledVector(UP, -Math.sin(best.p));
    const m = new THREE.Matrix4().lookAt(pos, look, UP), q = new THREE.Quaternion().setFromRotationMatrix(m);
    return { pos, q, fov, f, cy, p: best.p, h: best.h, G: best.G, view: L.view };
  },
  // the ground point (on the battle's flat, at the heroes' height) under screen point (x, y) for camera `cam`
  ground(x, y, cam) {
    const v = cam.view, ndc = V3(((x - v.left) / v.width) * 2 - 1, -(((y - v.top) / v.height) * 2 - 1), 0.5);
    const C = this._pc || (this._pc = new THREE.PerspectiveCamera());
    C.fov = cam.fov; C.aspect = v.width / v.height; C.near = 0.1; C.far = 500; C.updateProjectionMatrix();
    C.position.copy(cam.pos); C.quaternion.copy(cam.q); C.updateMatrixWorld(true);
    ndc.unproject(C);
    const d = ndc.sub(cam.pos).normalize(); if (d.y > -1e-3) return null;
    const t = (this.center.y - cam.pos.y) / d.y;
    return cam.pos.clone().addScaledVector(d, t);
  },
  heightAt(x, z, y0) { const W = this.W; try { const M = W.P.M, h = W.P.walkH(M.px(x), M.py(z)); return Number.isFinite(h) ? h : y0; } catch (e) { return y0; } },
  // a world point to page CSS px, by the fight's camera (as it will stand, so plates sit where foes will be)
  project(p, useWant = true) {
    const cam = useWant && this.want ? this.want : null, v = (this.want || {}).view || this.layoutIn?.view || this.renderer.domElement.getBoundingClientRect();
    const C = this._pc2 || (this._pc2 = new THREE.PerspectiveCamera());
    if (cam) { C.fov = cam.fov; C.aspect = v.width / v.height; C.position.copy(cam.pos); C.quaternion.copy(cam.q); } else { C.fov = this.cam.fov; C.aspect = this.cam.aspect; C.position.copy(this.cam.position); C.quaternion.copy(this.cam.quaternion); }
    C.near = 0.1; C.far = 500; C.updateProjectionMatrix(); C.updateMatrixWorld(true);
    const q = p.clone().project(C);
    return { x: v.left + (q.x + 1) / 2 * v.width, y: v.top + (1 - q.y) / 2 * v.height };
  },
  // a foe's box on the page, at its place (CSS px): { cx, left, right, top, floor }
  box(id, live = false) {
    const F = this.foes.get(id); if (!F || !this.want) return null;
    const base = live ? F.pos : F.home, s = F.size;
    let l = 1e9, r = -1e9, t = 1e9;
    for (const [dx, dy, dz] of [[-1, 1, -1], [1, 1, -1], [-1, 1, 1], [1, 1, 1], [-1, 0.5, 0], [1, 0.5, 0]]) {
      const q = this.project(base.clone().add(V3(dx * s.w / 2, dy * s.h * (F.sunk ? 0.25 : 1), dz * s.d / 2)), !live);
      l = Math.min(l, q.x); r = Math.max(r, q.x); t = Math.min(t, q.y);
    }
    const ft = this.project(base, !live);
    return { cx: ft.x, left: l, right: r, top: t, floor: ft.y };
  },
  // a named point on a foe, in the world: center, head, feet, relic
  worldPoint(id, name = 'center') {
    const F = this.foes.get(id); if (!F) return this.center.clone().addScaledVector(this.dir, GAP);
    const p = F.pos.clone(), h = F.size.h * (F.sunk ? 0.25 : 1);
    if (name === 'feet') return p;
    if (name === 'head') return p.setY(p.y + h * 0.9);
    if (name === 'relic') return p.setY(p.y + h * 0.7).addScaledVector(F.side, 0.25);
    return p.setY(p.y + h * 0.55);
  },
  heroPoint(id, name = 'hand') {
    const h = this.heroes.get(id); if (!h) return this.center.clone().setY(this.center.y + 1.2);
    const p = h.pos.clone(); p.y += name === 'hand' ? 1.25 : 1.0; return p.addScaledVector(this.facing(h), 0.3);
  },
  facing(o) { return V3(Math.sin(o.face), 0, Math.cos(o.face)); },

  // ---- what M7's screen says ------------------------------------------------------------------------------------
  heard(cmd) { this.lastCmd = cmd; if (cmd?.type === 'defend') this.hero(cmd.actor, (h) => this.play(h, 'defend', 0.5)); },
  hero(unitId, fn) { const h = this.heroByUnit(unitId); if (h) fn(h); },
  heroByUnit(unitId) { return this.heroes.get(this.byUnit.get(unitId) || unitId) || null; },
  setActor(unitId) {
    const h = unitId && this.heroByUnit(unitId);
    for (const o of this.heroes.values()) o.forward = o === h;
    this.actor = h ? h.id : null;
  },
  heroAttack(unitId) {
    const h = this.heroByUnit(unitId); if (!h) return;
    const r = this.lastRoll && this.lastRoll.actor === unitId ? this.lastRoll : null;
    const style = h.style();
    const target = r && r.target && this.foes.get(r.target) ? r.target : null;
    this.play(h, 'strike', RANGED.has(style) ? 0.7 : 1.15, { style, target, melee: !RANGED.has(style) && !!target });
    this.lastAttacker = h.id;
  },
  heroCast(unitId) {
    const h = this.heroByUnit(unitId); if (!h) return;
    const c = this.lastCmd && this.lastCmd.actor === unitId ? this.lastCmd : null;
    if (c?.type === 'item') this.play(h, 'item', 0.9);
    else if (c?.type === 'surge') { this.play(h, 'legend', 1.2); this.fx.pillar(h.pos.clone(), '#ffcb66', 5); }
    else {
      this.play(h, 'cast', 0.9);
      const at = h.pos.clone(); at.y += 0.05; this.fx.ring(at, '#bfa8ff', 1.2, 0.7);
      this.fx.sparks(this.heroPoint(h.id), '#d8c8ff', 14, { spread: 0.6, up: 1.4 });
    }
    this.lastAttacker = h.id;
  },
  heroHurt(unitId, big) {
    const h = this.heroByUnit(unitId); if (!h) return;
    if (!h.down) this.play(h, 'hurt', big ? 0.55 : 0.42, { big });
    this.fx.sparks(h.pos.clone().setY(h.pos.y + 1.1), '#ff8a6a', big ? 16 : 9, { spread: 0.7 });
    // the foe going for this hero bites now, as the blow lands
    for (const F of this.foes.values()) if (F.act && F.act.kind === 'attack' && F.act.target === h.id && !F.act.bit) { F.act.bit = true; F.bite = { t: 0, dur: 0.3 }; }
  },
  heroFlash(unitId, tint) { const h = this.heroByUnit(unitId); if (h) h.flash = { t: 0, dur: 0.35, c: new THREE.Color(tint[0] / 255, tint[1] / 255, tint[2] / 255) }; },
  heroState(u) {
    const h = this.heroByUnit(u.id); if (!h) return;
    h.unit = u;
    const down = !!u.ko;
    if (down && !h.down) { h.down = true; h.fall = { t: 0, dur: 0.6, up: false }; }
    else if (!down && h.down) { h.down = false; h.fall = { t: 0, dur: 0.7, up: true }; }
    h.guard = (u.statuses || []).some((s) => s.id === 'guarding');
    h.held = (u.statuses || []).some((s) => /swallow|held|carried|led|river/.test(s.id));
  },
  foeAttack(id, unit) {
    const F = this.foes.get(id); if (!F) return;
    const tgt = unit && (unit.intent?.target || null);
    const h = tgt ? this.heroByUnit(tgt) : null;
    F.act = { kind: 'attack', t: 0, dur: 2.0, target: h ? h.id : null, bit: false };
  },
  foeHurt(id, big) { const F = this.foes.get(id); if (F && !F.ko) F.hurt = { t: 0, dur: big ? 0.5 : 0.36 }; },
  foeKo(id) { const F = this.foes.get(id); if (!F) return; F.ko = { t: 0, dur: 0.6 }; F.act = null; },
  foeGone(id, kind) { const F = this.foes.get(id); if (!F) return; F.gone = { t: 0, dur: 0.8, kind }; F.act = null; },
  foeRevive(id) { const F = this.foes.get(id); if (!F) return; F.ko = null; F.gone = null; F.removed = false; F.root.visible = true; F.sinkOut = 0; },
  foeSink(id, down) { const F = this.foes.get(id); if (F) F.sinkTo = down ? 1 : 0; },
  play(h, kind, dur, o = {}) { h.act = { kind, t: 0, dur, ...o, from: h.pos.clone() }; },
  // the party's cheer, or their fall, once the fight is done
  victory() { for (const h of this.heroes.values()) if (!h.down) { h.forward = false; this.play(h, 'cheer', 2.4); } },
  busy() {
    if (this.swing || this.fx?.busy()) return true;
    for (const h of this.heroes.values()) if (h.act || h.fall || h.walk) return true;
    for (const f of this.foes.values()) if (f.act || f.hurt || (f.ko && !f.removed) || f.gone || f.walk) return true;
    return false;
  },

  // ---- every frame --------------------------------------------------------------------------------------------
  frame(dt) {
    const sp = this.speed, d = dt * sp, t = this.t;
    // the camera
    if (this.swing) {
      const S = this.swing; S.t += dt; const u = ease(S.t / S.dur);
      const to = S.to.pos ? S.to : this.want;
      this.cam.position.lerpVectors(S.from.pos, to.pos, u);
      // swinging round: a little lift on the way
      this.cam.position.y += Math.sin(u * Math.PI) * 1.2;
      this.cam.quaternion.slerpQuaternions(S.from.q, to.q, u);
      this.cam.fov = S.from.fov + (to.fov - S.from.fov) * u; this.cam.updateProjectionMatrix();
      if (S.t >= S.dur) { this.swing = null; if (S.done) S.done(); }
    } else if (this.want) {
      const k = 1 - Math.exp(-dt * 6);
      this.cam.position.lerp(this.want.pos, k); this.cam.quaternion.slerp(this.want.q, k);
      if (Math.abs(this.cam.fov - this.want.fov) > 0.01) { this.cam.fov += (this.want.fov - this.cam.fov) * k; this.cam.updateProjectionMatrix(); }
    }
    if (!this.on) return;
    let bi = 0;
    const foeCenter = V3(); let nf = 0;
    for (const F of this.foes.values()) if (!F.removed) { foeCenter.add(F.home); nf++; }
    if (nf) foeCenter.multiplyScalar(1 / nf); else foeCenter.copy(this.center).addScaledVector(this.dir, GAP);
    const heroCenter = V3(); for (const h of this.heroes.values()) heroCenter.add(h.home); heroCenter.multiplyScalar(1 / Math.max(1, this.heroes.size));
    for (const h of this.heroes.values()) { stepHero(this, h, d, t, foeCenter); if (h.A.root.visible) placeBlob(this.blobs[bi++], h.pos, 0.9); }
    for (const F of this.foes.values()) { stepFoe(this, F, d, t, heroCenter); if (F.root.visible && !F.sunk) placeBlob(this.blobs[bi++], F.pos, Math.max(0.6, F.size.w * 1.3)); }
    for (; bi < this.blobs.length; bi++) this.blobs[bi].visible = false;
    this.fx.speed = sp; this.fx.update(d, this.cam);
    if (this.onIdle) this.onIdle(d, t);
    this.renderer.render(this.scene, this.cam);
  },
};

// ---- heroes ------------------------------------------------------------------------------------------------------
function heroFigure(id, A) {
  const H = A.hero;
  return {
    id, A, rig: H.rig, body: H.group, pos: V3(), home: V3(), face: 0, act: null, fall: null, down: false, forward: false, guard: false,
    flash: null, unit: null,
    style() { const w = this.unit?.weaponItem; const two = !!(w && (w.hands === 2 || /great|maul|boar/.test(w.base || ''))); return strikeStyle(w?.kind || null, this.rig.cls, two); },
  };
}
function stepHero(ar, h, d, t, foeCenter) {
  const A = h.A, rig = h.rig;
  // where they stand: home, a step forward on their turn, at the foe for a blow
  const want = h.home.clone();
  if (h.forward && !h.down) want.addScaledVector(ar.dir, 0.9);
  if (h.walk) { h.walk.t += d; const u = ease(h.walk.t / h.walk.dur); h.pos.lerpVectors(h.walk.from, want, u); if (h.walk.t >= h.walk.dur) h.walk = null; }
  let face = Math.atan2(foeCenter.x - h.pos.x, foeCenter.z - h.pos.z);
  let pose = h.guard ? 'defend' : 'ready', pu = h.guard ? 1 : 0, walking = !!h.walk;
  const a = h.act;
  if (a) {
    a.t += d; const u = Math.min(1, a.t / a.dur);
    if (a.kind === 'strike') {
      const F = a.target && ar.foes.get(a.target);
      if (a.melee && F) {
        const tp = F.pos.clone(), dv = h.home.clone().sub(tp).setY(0).normalize();
        tp.addScaledVector(dv, 0.7 + F.size.d * 0.5); tp.y = ar.heightAt(tp.x, tp.z, tp.y);
        const go = seg(u, 0, 0.16), ret = seg(u, 0.66, 1);
        h.pos.lerpVectors(a.from, tp, go).lerp(want, ret);
        walking = (go > 0 && go < 1) || (ret > 0 && ret < 1);
        face = Math.atan2(F.pos.x - h.pos.x, F.pos.z - h.pos.z);
        if (ret > 0.02) face = Math.atan2(want.x - h.pos.x, want.z - h.pos.z) + (ret > 0.9 ? 0 : 0);
        pose = walking ? 'step' : 'strike'; pu = seg(u, 0.12, 0.62);
        if (ret > 0.95) face = Math.atan2(foeCenter.x - h.pos.x, foeCenter.z - h.pos.z);
      } else {
        if (F) face = Math.atan2(F.pos.x - h.pos.x, F.pos.z - h.pos.z);
        pose = 'strike'; pu = u;
      }
    } else { pose = a.kind; pu = u; }
    if (a.t >= a.dur) h.act = null;
  }
  if (!a || a.kind !== 'strike' || !a.melee) h.pos.lerp(want, h.walk ? 0 : 1 - Math.exp(-d * 6));
  // turning
  let df = face - h.face; df = Math.atan2(Math.sin(df), Math.cos(df)); h.face += df * Math.min(1, d * 10);
  A.root.position.copy(h.pos); A.root.rotation.set(0, h.face, 0);
  // the pose
  if (walking && pose !== 'strike') { A.walkRun = true; A.step = (A.step || 0) + d * 11; poseWalk(rig, t, A.step); }
  else poseHero(rig, pose, pu, t, pose === 'strike' ? h.style() : undefined);
  // falling and getting up: the whole figure tips back about its feet
  let tip = h.down ? 1 : 0;
  if (h.fall) { h.fall.t += d; const u = ease(h.fall.t / h.fall.dur); tip = h.fall.up ? 1 - u : u; if (h.fall.t >= h.fall.dur) h.fall = null; }
  h.body.rotation.x = -1.42 * tip; h.body.position.y = 0.05 * tip;
  A.root.visible = !h.held;
  // a hit, a heal, a charm: the figure lit in a colour a moment
  tint(h, d);
}
function poseWalk(rig, t, step) { setPose(rig, 'walk', t, step); }
function tint(h, d) {
  const want = h.flash ? h.flash.c : null;
  if (h.flash) { h.flash.t += d; if (h.flash.t >= h.flash.dur) h.flash = null; }
  const k = h.flash ? 1 - h.flash.t / h.flash.dur : 0;
  if (!h._mats) { h._mats = []; h.body.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) { const m0 = o.material, m = m0.clone(); m.onBeforeCompile = m0.onBeforeCompile; if (m0.customProgramCacheKey) m.customProgramCacheKey = m0.customProgramCacheKey; m.userData = { ...m0.userData }; o.material = m; h._mats.push([m, m.emissive.clone(), m.emissiveIntensity]); } }); }
  if (!want && !h._lit) return;
  h._lit = !!want;
  for (const [m, e0, i0] of h._mats) { if (want) { m.emissive.copy(e0).lerp(want, k * 0.8); m.emissiveIntensity = i0 + k * 0.9; } else { m.emissive.copy(e0); m.emissiveIntensity = i0; } }
}

// ---- foes ----
// Another look for the beasts (Models' painted cut-outs, November 20): fn(key, sprite, opts) returning the bestiary's
// shape, { group or g, height, plan?, parts?, update?(t, step) }. Moves only ever turn, lift and lean the whole figure
// and call its update(), so either look fights the same. null puts the code-built beasts back.
let beastLook = null;
export function setBeastLook(fn) { beastLook = fn || null; }
function norm(b, key) {
  const group = b.group || b.g;
  return { ...b, group, height: b.height || 1, plan: b.plan || (BEAST_PLAN[key] || 'mound'), update: b.update || (() => {}) };
}
const BEAST_PLAN = Object.fromEntries(Object.entries(BEASTS).map(([k, v]) => [k, v[0]]));
// a foe's figure from its art key: a person dressed by the heroes' builder from its sprite's own looks, or a beast by
// its body plan, coloured from its sprite
export function foeFigure(unitOrKey, o = {}) {
  const key = typeof unitOrKey === 'string' ? unitOrKey : (FOE_ART[unitOrKey.art] ? unitOrKey.art : 'cutpurse');
  const def = FOE_ART[key];
  const gearTier = o.gearTier ?? (typeof unitOrKey === 'object' ? unitOrKey.artTier ?? unitOrKey.gearTier ?? 0 : 0);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  let fig, height, humanoid = def.kind === 'humanoid', plan = 'person';
  Q.d = o.detail === 'light' ? 1 : 2;
  if (humanoid) {
    const { H, gear } = foeLooks(key, { gearTier });
    const h = buildHero('warden', {}, { H, looks: gear });
    h.group.scale.setScalar(HERO_H / 1.22); body.add(h.group); height = HERO_H; fig = { hero: h, rig: h.rig };
  } else {
    const sprite = renderFoe(key, { tier: def.defaultTier, gearTier, t: 0.2 });
    // the beast's look: the bestiary's code-built one, or another builder put in its place (setBeastLook)
    const b = norm((beastLook || buildBeast)(key, sprite, o), key); body.add(b.group); height = b.height; plan = b.plan; fig = { beast: b };
  }
  const box = new THREE.Box3().setFromObject(body), sz = box.getSize(V3());
  const F = {
    key, root, body, fig, humanoid, plan, mover: foeMover(plan, humanoid), height, parts: (fig.beast && fig.beast.parts) || {},
    size: { w: Math.max(0.35, Math.min(sz.x, sz.z) || 0.5), d: Math.max(0.35, Math.max(sz.x, sz.z) || 0.5), h: Math.max(0.3, sz.y || height) },
    pos: V3(), home: V3(), face: 0, side: V3(1, 0, 0), ph: Math.random() * 6, step: 0,
    act: null, hurt: null, ko: null, gone: null, bite: null, removed: false, sinkTo: 0, sink: 0, sunk: false, sinkOut: 0,
  };
  // small beasts stand a little larger on the field than life, so a briarling reads beside a hero
  const big = F.size.h < 1.1 && !humanoid ? 1.3 : 1;
  if (big !== 1) { root.scale.setScalar(big); F.size.w *= big; F.size.d *= big; F.size.h *= big; }
  root.traverse((c) => { if (c.isMesh) { c.castShadow = false; } });
  return F;
}
function stepFoe(ar, F, d, t, heroCenter) {
  if (F.removed) { F.root.visible = false; return; }
  const want = F.home.clone();
  let move = 'idle', mu = 0, walking = false;
  if (F.walk) { F.walk.t += d; const u = ease(F.walk.t / F.walk.dur); F.pos.lerpVectors(F.walk.from, want, u); walking = u < 1; if (F.walk.t >= F.walk.dur) F.walk = null; }
  // a long beast turns a little side-on, so it is seen whole rather than nose first
  const side = F.size.d > 1.2 ? (F.slot != null && ar.layoutIn && F.slot < ar.layoutIn.stage.width / 2 ? 0.75 : -0.75) : 0;
  let face = Math.atan2(heroCenter.x - F.pos.x, heroCenter.z - F.pos.z) + (F.act || F.gone ? 0 : side);
  const a = F.act;
  if (a) {
    a.t += d; const u = a.t / a.dur;
    const h = a.target && ar.heroes.get(a.target);
    // gather, close on the hero, bite as the blow lands (or by 0.55 s), back to its place
    move = 'attack'; mu = Math.min(1, u * 2.4);
    if (h) {
      const tp = h.pos.clone(), dv = F.home.clone().sub(tp).setY(0).normalize(); tp.addScaledVector(dv, 0.8 + F.size.d * 0.5);
      const go = seg(a.t, 0.18, 0.42), ret = seg(a.t, 1.25, 1.75);
      F.pos.copy(F.home).lerp(tp, go * (1 - ret)); F.pos.y = ar.heightAt(F.pos.x, F.pos.z, F.pos.y);
      walking = (go > 0 && go < 1) || (ret > 0 && ret < 1);
      face = ret > 0.05 && ret < 1 ? Math.atan2(F.home.x - F.pos.x, F.home.z - F.pos.z) + Math.PI * 0 : Math.atan2(h.pos.x - F.pos.x, h.pos.z - F.pos.z);
      if (ret > 0.05 && ret < 0.95) face = Math.atan2(F.home.x - F.pos.x, F.home.z - F.pos.z);
      if (!a.bit && a.t > 0.5) { a.bit = true; F.bite = { t: 0, dur: 0.3 }; }
    }
    if (a.t >= a.dur) F.act = null;
  } else if (!F.walk) F.pos.lerp(want, 1 - Math.exp(-d * 5));
  if (F.bite) { F.bite.t += d; move = 'bite'; mu = F.bite.t / F.bite.dur; if (F.bite.t >= F.bite.dur) F.bite = null; }
  if (F.hurt) { F.hurt.t += d; move = 'hurt'; mu = F.hurt.t / F.hurt.dur; if (F.hurt.t >= F.hurt.dur) F.hurt = null; }
  if (F.ko) {
    F.ko.t += d; move = 'ko'; mu = Math.min(1, F.ko.t / F.ko.dur);
    // lying a moment, then down into the ground
    if (F.ko.t > 1.1) { F.sinkOut = Math.min(1, (F.ko.t - 1.1) / 0.6); if (F.sinkOut >= 1) { F.removed = true; F.root.visible = false; } }
  }
  if (F.gone) {
    F.gone.t += d; const u = Math.min(1, F.gone.t / F.gone.dur);
    if (F.gone.kind === 'wither') { F.sinkOut = u; move = 'hurt'; mu = 0.3; }
    else { const away = F.home.clone().addScaledVector(ar.dir, 7 * u); F.pos.copy(away); face = ar.yaw; walking = true; }
    if (u >= 1) { F.removed = true; F.root.visible = false; F.gone = null; }
  }
  if (F.rising != null) { F.rising = Math.min(1, F.rising + d / 0.65); if (F.rising >= 1) F.rising = null; }
  F.sink += ((F.sinkTo || 0) - F.sink) * Math.min(1, d * 6); F.sunk = F.sink > 0.5;
  let df = face - F.face; df = Math.atan2(Math.sin(df), Math.cos(df)); F.face += df * Math.min(1, d * 8);
  F.side.set(Math.cos(F.face), 0, -Math.sin(F.face));
  const o = poseFoe(F, move, mu, t + F.ph);
  const down = (F.sink * 0.78 + F.sinkOut * 1.05 + (F.rising != null ? 1 - F.rising : 0)) * F.size.h;
  F.root.position.copy(F.pos); F.root.position.y += o.rise - down; F.root.rotation.set(0, F.face, 0);
  F.body.position.z = o.fwd; F.body.rotation.set(o.lean, 0, o.roll); F.body.scale.set(1, o.sq, 1);
  // the figure's own moving parts: a person's rig, a beast's legs and tail
  if (F.fig.rig) { if (walking) { F.step += d * 11; setPose(F.fig.rig, 'walk', t, F.step); } else poseHero(F.fig.rig, move === 'attack' || move === 'bite' ? 'strike' : move === 'hurt' ? 'hurt' : 'ready', move === 'bite' ? 0.45 : mu, t + F.ph, 'slash'); }
  else if (F.fig.beast) { if (walking) F.step += d * 12; F.fig.beast.update(t + F.ph, walking ? F.step : 0); }
  F.root.visible = true;
}

// ---- soft shadows under everyone ---------------------------------------------------------------------------------
function makeBlobs(scene, n) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c), out = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.visible = false; scene.add(m); out.push(m);
  }
  return out;
}
function placeBlob(b, p, s) { if (!b) return; b.visible = true; b.position.set(p.x, p.y + 0.03, p.z); b.scale.setScalar(s); }
function removeBlobs(scene, bs) { for (const b of bs || []) { scene.remove(b); b.geometry.dispose(); b.material.dispose(); } }
