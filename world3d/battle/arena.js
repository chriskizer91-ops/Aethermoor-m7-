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
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildBeast, BEASTS } from '../../prototypes/bestiary/beasts.js';
import { FOE_ART, renderFoe, foeLooks } from '../../game/src/art/foes.js';
import { poseHero, poseFoe, strikeStyle, RANGED, foeMover } from './moves.js';
import { Fx } from './effects.js';
import { aura } from './auras.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const seg = (u, a, b) => ease((u - a) / (b - a));
let HERO_H = 1.72;
const FAST = typeof location !== 'undefined' && /[?&]fast=1\b/.test(location.search);
const RARITY = { worn: '#9a968c', wrought: '#e8e4da', tempered: '#64c85c', runed: '#5299f0', storied: '#b774f4', heirloom: '#f4ad3f', regalia: '#4fd1c0', primal: '#fff6e0' };
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
    this.heroes.clear(); this.foes.clear(); this.byUnit.clear(); this.pending = foes.slice(); this.guests = [];
    for (const [id, A] of Object.entries(heroes)) this.heroes.set(id, heroFigure(id, A, this));
    for (const h of this.heroes.values()) { h.pos.copy(h.A.root.position); h.home.copy(h.pos); h.face = h.A.root.rotation.y; h.aura = aura(h.A.root, HERO_H); }
    // the heroes' height as built (with hats and hair), so their heads come to the top of the space over their cards
    { const hs = [...this.heroes.values()].map((h) => { h.body.rotation.set(0, 0, 0); const b = new THREE.Box3().setFromObject(h.body); return b.max.y - h.A.root.position.y; }).filter((x) => x > 0.5 && x < 3); if (hs.length) HERO_H = Math.min(1.9, hs.reduce((a, b) => a + b, 0) / hs.length); }
    this.from = { pos: this.cam.position.clone(), q: this.cam.quaternion.clone(), fov: this.cam.fov };
    this.swing = null; this.want = null; this.layoutIn = null; this.actor = null; this.close = null;
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
    this.swing = { t: 0, dur: 1.2, from: { pos: this.cam.position.clone(), q: this.cam.quaternion.clone(), fov: this.cam.fov }, to: back, done: () => { this.on = false; cancelAnimationFrame(this.raf); this.fx.clear(); removeBlobs(this.scene, this.blobs); for (const f of this.foes.values()) { this.scene.remove(f.root); f.aura?.dispose(); } for (const h of this.heroes.values()) h.aura?.dispose(); for (const g of this.guests || []) this.scene.remove(g); for (const d of this.drops || []) this.scene.remove(d.g); this.drops = null; done && done(); } };
  },
  // a guest fighting beside the party (M7: Tamsin against the Unsmith): built from her own looks, standing over her card
  addGuest(unit) {
    if (this.heroes.has(unit.id)) return;
    const F = foeFigure(unit); if (!F.fig.hero) return;
    const A = { id: unit.id, root: F.root, hero: F.fig.hero, animate() {} };
    F.root.position.copy(this.center); this.scene.add(F.root); this.guests.push(F.root);
    const h = heroFigure(unit.id, A); h.pos.copy(this.center); h.home.copy(this.center); h.face = this.yaw; h.aura = aura(A.root, HERO_H);
    this.heroes.set(unit.id, h); this.byUnit.set(unit.id, unit.id);
  },
  // the heroes' figures as they stand now (guests aside)
  heroActors() { return [...this.heroes.values()].filter((h) => !this.guests.includes(h.A.root)).map((h) => h.A); },
  // the heroes' figures as they stand now (one may have been re-dressed during the spoils)
  actors() { return [...this.heroes.values()].map((h) => h.A); },
  // a hero re-dressed on the spot (new gear from a card): the new figure takes the old one's place, with a flash of light
  swapHero(id, A) {
    const h = this.heroes.get(id); if (!h || h.A === A) return;
    const old = h.A; A.root.position.copy(old.root.position); A.root.rotation.copy(old.root.rotation);
    this.scene.remove(old.root); this.scene.add(A.root);
    h.aura?.dispose(); h.A = A; h.rig = A.hero.rig; h.body = A.hero.group; h._mats = null; h.aura = aura(A.root, HERO_H);
    this.fx.ring(h.pos.clone(), '#ffe08a', 1.4, 0.8); this.fx.sparks(h.pos.clone().setY(h.pos.y + 1), '#fff4c0', 24, { spread: 0.8, up: 1.3 });
    this.play(h, 'cheer', 1.4);
  },
  // the spoils lying where the foes fell: a small chest for each, lit in its rarity's colour; open() bursts one
  loot(items) {
    // just in front of the party, between them and where the foes fell, so the spoils' view shows both
    const hc = V3(); for (const h of this.heroes.values()) hc.add(h.home); hc.multiplyScalar(1 / Math.max(1, this.heroes.size));
    const side = V3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const spots = items.map((_, i) => hc.clone().addScaledVector(this.dir, 1.5).addScaledVector(side, (i - (items.length - 1) / 2) * 0.8));
    this.drops = items.map((it, i) => {
      const at = spots[i].clone(); at.y = this.heightAt(at.x, at.z, at.y);
      const col = new THREE.Color(RARITY[it.rarity] || '#e8e4da'), g = new THREE.Group(); g.position.copy(at);
      const wood = new THREE.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.35 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.3), wood); box.position.y = 0.13; g.add(box);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 12, 1, false, 0, Math.PI), wood); lid.rotation.z = Math.PI / 2; lid.position.y = 0.26; g.add(lid);
      for (const x of [-0.14, 0.14]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.32), band); b.position.set(x, 0.15, 0); g.add(b); }
      const glow = new THREE.PointLight(col, 1.2, 2.5, 2); glow.position.y = 0.6; g.add(glow);
      g.scale.setScalar(0.01); this.scene.add(g);
      const d = { g, item: it, t: -i * 0.25, glow };
      return d;
    });
    for (const d of this.drops) this.fx.ring(d.g.position.clone(), '#' + new THREE.Color(RARITY[d.item.rarity] || '#e8e4da').getHexString(), 1, 0.7);
  },
  // the Legend Strike close-up (step 3): the camera cuts in low and close on the hero, a little to the side, while they
  // raise the relic and M7's card slams; then back to the fight's camera
  closeUp(h, dur = 2.4) {
    if (this.reduced) return;
    const f = this.facing(h), side = V3(f.z, 0, -f.x), at = h.pos.clone().setY(h.pos.y + 1.05);
    // a little above head height (over low bushes), to one side; the first spot with nothing built in the way
    const P = this.W.P, clear = (p) => { try { return P.sight.hit(p.x, p.y, p.z, at.x, at.y, at.z) > 0.97; } catch (e) { return true; } };
    let pos = null;
    for (const [fw, sd, up] of [[3.9, 1.5, 1.7], [3.9, -1.5, 1.7], [3.2, 2.4, 2.0], [3.2, -2.4, 2.0], [2.6, 0.8, 2.4]]) {
      const p = h.pos.clone().addScaledVector(f, fw).addScaledVector(side, sd); p.y = h.pos.y + up;
      if (clear(p)) { pos = p; break; }
      pos = pos || p;
    }
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, at, UP));
    this.close = { t: 0, dur, pos, q, fov: 38 };
    this.stage?.host.classList.add('f3-close'); // the foes' plates step aside for the moment
  },
  // the spoils' view: round in front of the party, looking back at them over the chests, the party in the screen's
  // upper part (M7's after-fight screen fills the lower part)
  spoilsView(top = 0.2) {
    const hc = V3(); for (const h of this.heroes.values()) hc.add(h.home); hc.multiplyScalar(1 / Math.max(1, this.heroes.size));
    for (const h of this.heroes.values()) h.forward = false;
    const fov = 40, aim = hc.clone(); aim.y += 0.9;
    // from the foes' side, or round about, near or far, high or low: the first spot that sees every hero's head
    const P = this.W.P, heads = [...this.heroes.values()].map((h) => h.home.clone().setY(h.home.y + 1.3));
    const clear = (a, b) => { try { return P.sight.hit(a.x, a.y, a.z, b.x, b.y, b.z) > 0.97; } catch (e) { return true; } };
    let pos = null, bestN = -1, bestPos = null;
    search: for (const [dist, up] of [[10.5, 3.4], [8, 3.2], [6, 3.6], [4.5, 4.2]]) for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6]) {
      const a = this.yaw + off, p = hc.clone().add(V3(Math.sin(a) * dist, up, Math.cos(a) * dist));
      const n = heads.filter((h) => clear(p, h)).length;
      if (n > bestN) { bestN = n; bestPos = p; }
      if (n === heads.length) { pos = p; break search; }
    }
    pos = pos || bestPos;
    // look a little below the party, so they stand in the upper part of the screen
    const v = this.renderer.domElement.getBoundingClientRect(), f = (v.height / 2) / Math.tan(fov * Math.PI / 360);
    const off = Math.atan((0.5 - top) * v.height / f), d = aim.clone().sub(pos), L = d.length();
    const look = aim.clone(); look.y -= L * Math.tan(off) * 1.15;
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, look, UP));
    this.want = { ...this.want, pos, q, fov };
  },
  openLoot(i) { const d = this.drops && this.drops[i]; if (!d || d.open) return; d.open = true; this.fx.sparks(d.g.position.clone().setY(d.g.position.y + 0.3), '#ffe08a', 26, { spread: 0.7, up: 1.6 }); },
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
    if (!this.want) this.pickYaw(L);
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
    const vis = ((this.stage && this.stage.order) || L.foes || []).filter((id) => this.foes.get(id) && !this.foes.get(id).removed);
    const n = vis.length, pad = Math.min(60, L.stage.width * 0.12), w = L.stage.width - pad * 2;
    // each foe's share of the line by its size (a Champion takes more room than a briarling), as M7's stage does by width
    const wt = vis.map((id) => Math.max(0.8, Math.min(3, this.foes.get(id).size.d))), sum = wt.reduce((x, y) => x + y, 0);
    let acc = 0;
    vis.forEach((id, i) => {
      const F = this.foes.get(id);
      const x = L.stage.left + pad + w * (acc + wt[i] / 2) / sum; acc += wt[i];
      const p = this.ground(x, L.yF, cam); if (!p) return;
      if (n >= 3 && i % 2 === 1) p.addScaledVector(this.dir, 0.9);
      p.y = this.heightAt(p.x, p.z, p.y);
      const fresh = !F.placed; F.placed = true;
      if (!fresh && !F.walk && this.want) F.walk = { from: F.pos.clone(), t: 0, dur: 0.6 };
      F.home.copy(p); if (fresh && F.pos.lengthSq() === 0) F.pos.copy(p); F.slot = x - L.stage.left; F.slotW = Math.max(118, Math.min(200, (L.stage.width - 8) * wt[i] / sum - 6));
    });
  },
  // Indoors and among walls (step 3): the way the fight faces is chosen once, at its start. From the way to the foes,
  // then turning left and right by steps, it keeps the first way whose camera sees every hero and foe (nothing built
  // between: the place's own line-of-sight test, W.P.sight) and puts everyone on open ground; failing that, the best.
  pickYaw(L) {
    const yaw0 = this.yaw, P = this.W.P;
    const clear = (a, b) => { try { return P.sight.hit(a.x, a.y, a.z, b.x, b.y, b.z) > 0.97; } catch (e) { return true; } };
    const open = (p) => { try { return P.walkable(P.M.px(p.x), P.M.py(p.z)); } catch (e) { return true; } };
    let best = null;
    for (const off of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0, Math.PI]) {
      this.setYaw(yaw0 + off);
      const cam = this.solve(L); if (!cam) continue;
      const pts = [];
      for (const { x } of L.heroes) { const p = this.ground(x, L.yH, cam); if (p) pts.push([p, 1.3]); }
      const n = Math.max(1, (L.foes || []).length), pad = Math.min(60, L.stage.width * 0.12), w = L.stage.width - pad * 2;
      for (let i = 0; i < n; i++) { const p = this.ground(L.stage.left + pad + w * (i + 0.5) / n, L.yF, cam); if (p) pts.push([p, 0.6]); }
      let score = 0, all = pts.length > 0;
      for (const [p, up] of pts) { const seen = clear(cam.pos, p.clone().setY(p.y + up)), ok = open(p); score += (seen ? 2 : 0) + (ok ? 1 : 0); if (!seen || !ok) all = false; }
      score -= Math.abs(off) * 0.3;
      if (!best || score > best.score) best = { score, yaw: this.yaw };
      if (all) break;
    }
    this.setYaw(best ? best.yaw : yaw0);
  },
  setYaw(y) { this.yaw = y; this.dir.set(Math.sin(y), 0, Math.cos(y)); },
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
    // a foe, or (charmed) a friend
    const target = r && r.target && (this.foes.get(r.target) || this.heroByUnit(r.target)) ? r.target : null;
    this.play(h, 'strike', RANGED.has(style) ? 0.7 : 1.15, { style, target, melee: !RANGED.has(style) && !!target });
    face(h, 'effort', 0.9);
    this.lastAttacker = h.id;
  },
  heroCast(unitId) {
    const h = this.heroByUnit(unitId); if (!h) return;
    const c = this.lastCmd && this.lastCmd.actor === unitId ? this.lastCmd : null;
    face(h, c?.type === 'item' ? 'neutral' : 'effort', 1.1);
    if (c?.type === 'item') this.play(h, 'item', 0.9);
    else if (c?.type === 'surge') { this.play(h, 'legend', 1.6); this.closeUp(h, 2.4); this.fx.pillar(h.pos.clone(), '#ffcb66', 5); }
    else {
      this.play(h, 'cast', 0.9);
      const at = h.pos.clone(); at.y += 0.05; this.fx.ring(at, '#bfa8ff', 1.2, 0.7);
      this.fx.sparks(this.heroPoint(h.id), '#d8c8ff', 14, { spread: 0.6, up: 1.4 });
    }
    this.lastAttacker = h.id;
  },
  heroHurt(unitId, big) {
    const h = this.heroByUnit(unitId); if (!h) return;
    if (!h.down) { this.play(h, 'hurt', big ? 0.55 : 0.42, { big }); face(h, 'hurt', 1.0); }
    this.fx.sparks(h.pos.clone().setY(h.pos.y + 1.1), '#ff8a6a', big ? 16 : 9, { spread: 0.7 });
    // the foe going for this hero bites now, as the blow lands
    for (const F of this.foes.values()) if (F.act && F.act.kind === 'attack' && F.act.target === h.id && !F.act.bit) { F.act.bit = true; F.act.bitT = F.act.t; F.bite = { t: 0, dur: 0.3 }; }
  },
  heroFlash(unitId, tint) { const h = this.heroByUnit(unitId); if (h) h.flash = { t: 0, dur: 0.35, c: new THREE.Color(tint[0] / 255, tint[1] / 255, tint[2] / 255) }; },
  heroState(u) {
    const h = this.heroByUnit(u.id); if (!h) return;
    h.unit = u;
    const down = !!u.ko;
    if (down && !h.down) { h.down = true; h.fall = { t: 0, dur: 0.6, up: false }; face(h, 'asleep'); }
    else if (!down && h.down) { h.down = false; h.fall = { t: 0, dur: 0.7, up: true }; face(h, 'neutral'); }
    // worried when low (a quarter of their health or less), back to themselves when healed
    const low = !down && u.maxHp && u.hp / u.maxHp <= 0.25;
    if (low !== !!h.low && !down) face(h, low ? 'worried' : 'neutral'); h.low = low;
    h.guard = (u.statuses || []).some((s) => s.id === 'guarding');
    // swallowed (M7's one hold, shown as "Held under", "Led away", "In the river"): gone into the foe in a burst, back in a ring
    const held = (u.statuses || []).some((s) => s.id === 'swallowed');
    if (held !== !!h.held && this.fx) { const p = h.pos.clone().setY(h.pos.y + 1); if (held) this.fx.sparks(p, '#7a5a8a', 22, { spread: 0.8 }); else { this.fx.ring(h.pos.clone(), '#c8f0ff', 1.6, 0.7); this.fx.sparks(p, '#e8f8ff', 18, { spread: 0.7, up: 1.3 }); } }
    h.held = held;
    h.aura?.set(u.statuses);
  },
  foeAttack(id, unit) {
    const F = this.foes.get(id); if (!F) return;
    const tgt = unit && (unit.intent?.target || null);
    const h = tgt ? this.heroByUnit(tgt) : null;
    const it = unit && (unit.intent?.played ? unit.intent2 || unit.intent : unit.intent) || {};
    const self = !it.target || it.target === id || !h;
    F.act = { kind: 'attack', t: 0, target: h ? h.id : null, bit: false, bitT: null, self, kmove: kitMove(F, it.move || it.name || '', self) };
  },
  foeHurt(id, big) { const F = this.foes.get(id); if (F && !F.ko) { F.hurt = { t: 0, dur: big ? 0.5 : 0.36 }; F.fig.beast?.hit?.(); } },
  foeKo(id) { const F = this.foes.get(id); if (!F) return; F.ko = { t: 0, dur: 0.6 }; F.act = null; },
  foeGone(id, kind) { const F = this.foes.get(id); if (!F) return; F.gone = { t: 0, dur: 0.8, kind }; F.act = null; },
  foeRevive(id) { const F = this.foes.get(id); if (!F) return; F.ko = null; F.gone = null; F.removed = false; F.root.visible = true; F.sinkOut = 0; },
  // a Champion's new phase (M7's on_phase sets its look): it swells a little each time, and roars (a lunge in place)
  foeLook(id, unit) {
    const F = this.foes.get(id); if (!F || !unit) return;
    F.aura?.set(unit.statuses);
    const ph = unit.phase || 1;
    if (ph > (F.phase || 1)) { F.phase = ph; F.growTo = 1 + 0.08 * (ph - 1); this.fx.ring(F.pos.clone(), '#b4d65a', 3.5, 0.9); const k = kitMove(F, 'roar', true); if (F.fig.beast?.pose && k) F.kpose = { name: k, t: 0, dur: KIT_DUR[k] || 1.6 }; else F.hurt = { t: 0, dur: 0.6 }; }
  },
  foeSink(id, down) { const F = this.foes.get(id); if (F) F.sinkTo = down ? 1 : 0; },
  play(h, kind, dur, o = {}) { h.act = { kind, t: 0, dur, ...o, from: h.pos.clone() }; },
  // the party's cheer, or their fall, once the fight is done
  victory() { for (const h of this.heroes.values()) if (!h.down) { h.forward = false; this.play(h, 'cheer', 2.4); face(h, 'cheer', 3.5); } },
  busy() {
    if (this.swing || this.close || this.fx?.busy()) return true;
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
    } else if (this.close) {
      const C = this.close; C.t += dt;
      const k = 1 - Math.exp(-dt * (C.t < 0.25 ? 18 : 6));
      this.cam.position.lerp(C.pos, k); this.cam.quaternion.slerp(C.q, k);
      this.cam.fov += (C.fov - this.cam.fov) * k; this.cam.updateProjectionMatrix();
      if (C.t >= C.dur) { this.close = null; this.stage?.host.classList.remove('f3-close'); }
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
    for (const h of this.heroes.values()) h.aura?.step(d, this.t);
    for (const F of this.foes.values()) if (!F.removed) F.aura?.step(d, this.t);
    for (const L of this.drops || []) { L.t += dt; const u = Math.max(0, Math.min(1, L.t / 0.5)); const s = L.open ? Math.max(0.01, L.g.scale.x - dt * 3) : 0.01 + (1 - (1 - u) ** 3) * 0.99 * (1 + Math.sin(Math.min(1, u) * Math.PI) * 0.25); L.g.scale.setScalar(s); L.g.rotation.y += dt * 0.6; L.glow.intensity = 1 + Math.sin(this.t * 3 + L.t) * 0.4; }
    this.fx.speed = sp; this.fx.update(d, this.cam);
    if (this.onIdle) this.onIdle(d, t);
    // ?fast=1 (headless checks only): draw a few times a second, so a slow software browser leaves M7's timers their time
    if (FAST) { this._drawT = (this._drawT || 0) + dt; if (this._drawT < 0.3) return; this._drawT = 0; }
    this.renderer.render(this.scene, this.cam);
  },
};

// a hero's face (Models' living faces, prototypes/hero-3d/model.js rig.faceCtl): an expression, for a while or until the next
function face(h, expr, seconds) { try { h.rig.faceCtl?.set(expr, seconds); } catch (e) { /* a figure without a living face */ } }

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
      const F = a.target && (ar.foes.get(a.target) || ar.heroByUnit(a.target));
      if (a.melee && F) {
        const tp = F.pos.clone(), dv = h.home.clone().sub(tp).setY(0).normalize();
        tp.addScaledVector(dv, 0.7 + (F.size?.d ?? 0.5) * 0.5); tp.y = ar.heightAt(tp.x, tp.z, tp.y);
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
  F.baseScale = big; F.grow = 1; F.phase = 1;
  if (big !== 1) { root.scale.setScalar(big); F.size.w *= big; F.size.d *= big; F.size.h *= big; }
  root.traverse((c) => { if (c.isMesh) { c.castShadow = false; } });
  F.draws = fewerDraws(root);
  F.aura = aura(root, F.size.h / big);
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
    a.t += d;
    const h = a.target && ar.heroes.get(a.target);
    // gather and close on the hero, hold at the top of the move until the blow lands (the hero's hurt) or a miss is
    // plain (2 s), then finish it and go back to its place; a spell or a call stays where it is
    if (!a.bit && a.t > 2.0) { a.bit = true; a.bitT = a.t; if (!a.self) F.bite = { t: 0, dur: 0.3 }; }
    const after = a.bit ? a.t - a.bitT : 0;
    move = 'attack'; mu = Math.min(0.45, a.t / 0.42 * 0.45) + (a.bit ? Math.min(0.55, after / 0.55 * 0.55) : 0);
    a.ku = mu;
    if (a.bit && after > 0.9) F.act = null;
    if (h && !a.self) {
      const tp = h.pos.clone(), dv = F.home.clone().sub(tp).setY(0).normalize(); tp.addScaledVector(dv, 0.8 + F.size.d * 0.5);
      const go = seg(a.t, 0.18, 0.42), ret = a.bit ? seg(after, 0.35, 0.85) : 0;
      F.pos.copy(F.home).lerp(tp, go * (1 - ret)); F.pos.y = ar.heightAt(F.pos.x, F.pos.z, F.pos.y);
      walking = (go > 0 && go < 1) || (ret > 0 && ret < 1);
      face = ret > 0.05 && ret < 1 ? Math.atan2(F.home.x - F.pos.x, F.home.z - F.pos.z) + Math.PI * 0 : Math.atan2(h.pos.x - F.pos.x, h.pos.z - F.pos.z);
      if (ret > 0.05 && ret < 0.95) face = Math.atan2(F.home.x - F.pos.x, F.home.z - F.pos.z);
    }
  } else if (!F.walk) F.pos.lerp(want, 1 - Math.exp(-d * 5));
  if (F.bite) { F.bite.t += d; move = 'bite'; mu = F.bite.t / F.bite.dur; if (F.bite.t >= F.bite.dur) F.bite = null; }
  if (F.hurt) { F.hurt.t += d; move = 'hurt'; mu = F.hurt.t / F.hurt.dur; if (F.hurt.t >= F.hurt.dur) F.hurt = null; }
  if (F.ko) {
    F.ko.t += d; move = 'ko'; mu = Math.min(1, F.ko.t / F.ko.dur);
    // lying a moment, then down into the ground
    const lie = F.fig.beast?.pose ? 2.3 : 1.1;
    if (F.ko.t > lie) { F.sinkOut = Math.min(1, (F.ko.t - lie) / 0.6); if (F.sinkOut >= 1) { F.removed = true; F.root.visible = false; } }
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
  if (F.growTo && Math.abs(F.grow - F.growTo) > 1e-3) { F.grow += (F.growTo - F.grow) * Math.min(1, d * 3); F.root.scale.setScalar(F.baseScale * F.grow); }
  F.root.position.copy(F.pos); F.root.position.y += o.rise - down; F.root.rotation.set(0, F.face, 0);
  F.body.position.z = o.fwd; F.body.rotation.set(o.lean, 0, o.roll); F.body.scale.set(1, o.sq, 1);
  // the figure's own moving parts: a person's rig, a beast's legs and tail
  if (F.fig.rig) { if (walking) { F.step += d * 11; setPose(F.fig.rig, 'walk', t, F.step); } else poseHero(F.fig.rig, move === 'attack' || move === 'bite' ? 'strike' : move === 'hurt' ? 'hurt' : 'ready', move === 'bite' ? 0.45 : mu, t + F.ph, 'slash'); }
  else if (F.fig.beast) {
    if (walking) F.step += d * 12;
    const B = F.fig.beast;
    // a beast with its own moves (One Foe's full-detail Briarmaw: pose(move, u, t)) makes them itself, the figure only
    // carried where it goes; every other beast is leaned and turned whole, as moves.js poses it
    if (F.kpose) { F.kpose.t += d; if (F.kpose.t >= F.kpose.dur) F.kpose = null; }
    let km = null, ku = 0;
    if (B.pose) {
      if (F.ko) { km = 'ko'; ku = Math.min(1, F.ko.t / (KIT_DUR.ko || 2)); }
      else if (F.hurt) { km = 'hurt'; ku = F.hurt.t / F.hurt.dur; }
      else if (F.kpose) { km = F.kpose.name; ku = F.kpose.t / F.kpose.dur; }
      else if (F.act && F.act.kmove) { km = F.act.kmove; ku = F.act.ku || 0; }
    }
    if (km) { B.pose(km, ku, t + F.ph, walking ? F.step : 0); F.body.rotation.set(0, 0, 0); F.body.scale.set(1, 1, 1); F.body.position.z = 0; }
    else B.update(t + F.ph, walking ? F.step : 0);
  }
  F.root.visible = true;
}

// A full-detail foe's own move for M7's move (the foe kit's moves by plan, prototypes/foe-hd/kit/js/moves/<plan>.js):
// a spell, a call or a cry its roar or cast; claws and blades its swipe or swing; a crushing blow its slam; else its lunge
const KIT_MOVES = { quad: { cast: 'roar', claw: 'swipe', slam: 'swipe', lunge: 'bite' }, biped: { cast: 'cast', claw: 'swing', slam: 'slam', lunge: 'swing' },
  sapling: { cast: 'hop', claw: 'bite', slam: 'hop', lunge: 'bite' }, serpent: { lunge: 'strike' }, frog: { lunge: 'bite' }, winged: { lunge: 'dive' } };
const KIT_DUR = { roar: 2.2, swipe: 1.4, bite: 1.1, swing: 1.2, slam: 1.5, cast: 1.6, hop: 0.9, strike: 1.1, dive: 1.2, hurt: 0.9, ko: 2.2 };
function kitMove(F, move, self) {
  if (!F.fig.beast?.pose) return null;
  const M = KIT_MOVES[F.fig.beast.plan || F.plan] || KIT_MOVES.quad, m = String(move).toLowerCase();
  const kind = self || /call|cry|howl|roar|sing|hymn|cast|spell|hex|graft|seed|spit|curse|summon|hush|lure|beguile/.test(m) ? 'cast'
    : /claw|swipe|rake|maul|slash|cut|lash|whip|scythe|thorn/.test(m) ? 'claw' : /slam|stomp|crush|hammer|smash|bash|charge|gore|butt/.test(m) ? 'slam' : 'lunge';
  return M[kind] || M.lunge;
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

// ---- fewer draws (step 3, the phone's frame rate) ------------------------------------------------------------------
// The pieces of a figure that hang from the same joint and share a material are drawn as one: their shapes are joined
// in the joint's own space, so the figure looks and moves exactly as before (a leg's pieces still swing with the leg).
// Skinned meshes, glowing parts the moves flicker (a beast's core, a lamp) and anything with a pose hook stay alone.
function fewerDraws(root) {
  const keep = new Set();
  root.traverse((o) => { if (o.isMesh && (o.isSkinnedMesh || o.morphTargetInfluences || o.onBeforeRender?.length || (o.material && o.material.emissiveIntensity > 1.2))) keep.add(o); });
  const groups = [];
  root.traverse((node) => {
    const by = new Map();
    for (const c of node.children) {
      if (!c.isMesh || keep.has(c) || c.children.length || !c.geometry?.attributes?.position || Array.isArray(c.material)) continue;
      const k = c.material.uuid + '|' + Object.keys(c.geometry.attributes).sort().join(',') + '|' + !!c.geometry.index;
      (by.get(k) || by.set(k, []).get(k)).push(c);
    }
    for (const list of by.values()) if (list.length > 1) groups.push([node, list]);
  });
  let saved = 0;
  for (const [node, list] of groups) {
    const geos = list.map((m) => { m.updateMatrix(); const g = m.geometry.clone(); g.applyMatrix4(m.matrix); return g; });
    let merged = null; try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
    for (const g of geos) if (g !== merged) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, list[0].material); mesh.castShadow = false; mesh.receiveShadow = true;
    for (const m of list) node.remove(m);
    node.add(mesh); saved += list.length - 1;
  }
  return saved;
}
