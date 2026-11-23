// The fight's effects in 3D (November 20): what M7's 2D stage draws in pixels, made in three.js on the place's ground.
//   sparks   a burst of glowing bits off a hit, falling as they fade
//   slash    a bright arc swept across a foe by a blade (wider and doubled on a Legend Strike)
//   shot     an arrow or a bolt of the Aspect's colour, flying from the hero's hand in a low arc
//   ring     a ring of light going out over the ground (a phase, a Legend Surge, a stolen relic)
//   pillar   a Legend Strike's burst: a column of light and a shock ring
//   relic    the relic flying loose, tumbling, clattering down and lying there glinting
// Everything is additive light (no shadows, no depth writes), so it reads at night and by day.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const col = (c) => new THREE.Color(c);
let dotTex = null;
function dot() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c); dotTex.colorSpace = THREE.SRGBColorSpace;
  return dotTex;
}
const glowMat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: col(c), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

export class Fx {
  constructor(scene) { this.scene = scene; this.list = []; this.speed = 1; this.dropped = []; }
  add(o, dur, step, done) { this.scene.add(o); this.list.push({ o, t: 0, dur, step, done }); return o; } // update() is given the fight's clock, already sped up
  busy() { return this.list.length > 0; }
  // fn after `sec` of the fight's own clock (held with it in the stills' slow mode, sped up with it at 2x)
  later(sec, fn) { this.add(new THREE.Group(), Math.max(0.001, sec), () => {}, fn); }
  update(dt, cam) {
    this.list = this.list.filter((e) => {
      e.t += dt; const u = Math.min(1, e.t / e.dur);
      e.step(u, dt, cam);
      if (u >= 1) { if (!e.keep) this.scene.remove(e.o); if (e.done) e.done(); if (!e.keep) dispose(e.o); return false; }
      return true;
    });
    for (const d of this.dropped) d.glint(dt);
  }
  clear() { for (const e of this.list) { this.scene.remove(e.o); dispose(e.o); } this.list = []; for (const d of this.dropped) { this.scene.remove(d.o); dispose(d.o); } this.dropped = []; }

  sparks(at, color = '#fff4c0', n = 14, { spread = 1, up = 1 } = {}) {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
    const c = col(color), cs = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p.set([at.x, at.y, at.z], i * 3);
      const a = Math.random() * TAU, e = (Math.random() - 0.2) * 1.2, s = (1.6 + Math.random() * 2.6) * spread;
      v.push(new THREE.Vector3(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 1.2 * up, Math.sin(a) * Math.cos(e) * s));
      const w = Math.random() < 0.3 ? new THREE.Color(1, 1, 1) : c; cs.set([w.r, w.g, w.b], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(cs, 3));
    const m = new THREE.PointsMaterial({ size: 0.13, map: dot(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pts = new THREE.Points(g, m);
    this.add(pts, 0.55, (u, dt) => {
      for (let i = 0; i < n; i++) { v[i].y -= 7 * dt; p[i * 3] += v[i].x * dt; p[i * 3 + 1] += v[i].y * dt; p[i * 3 + 2] += v[i].z * dt; }
      g.attributes.position.needsUpdate = true; m.opacity = 1 - u * u; m.size = 0.13 * (1 - u * 0.5);
    });
  }

  // a curved blade-light across `at`, facing the camera, swept from one end to the other
  slash(at, cam, color = '#ffffff', crit = false) {
    const grp = new THREE.Group(); grp.position.copy(at);
    const arcs = crit ? [0, 0.5] : [0];
    const ms = [];
    for (const off of arcs) {
      const geo = new THREE.TorusGeometry(crit ? 0.75 : 0.55, crit ? 0.035 : 0.025, 4, 32, Math.PI * 0.9);
      const m = glowMat(color, 1); ms.push(m);
      const mesh = new THREE.Mesh(geo, m); mesh.rotation.z = Math.PI * 0.6 + off * 1.6; mesh.scale.set(1, 0.55, 1); grp.add(mesh);
      const core = new THREE.Mesh(new THREE.TorusGeometry(crit ? 0.75 : 0.55, 0.01, 3, 32, Math.PI * 0.9), glowMat('#ffffff', 1)); core.rotation.copy(mesh.rotation); core.scale.copy(mesh.scale); grp.add(core); ms.push(core.material);
    }
    grp.quaternion.copy(cam.quaternion);
    this.add(grp, 0.3, (u) => {
      const k = Math.min(1, u * 2.2);
      grp.children.forEach((c, i) => { c.geometry.setDrawRange(0, Math.floor(c.geometry.index.count * k / 6) * 6); });
      for (const m of ms) m.opacity = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
      grp.scale.setScalar(1 + u * 0.15);
    });
  }

  // an arrow (shaft and head) or a bolt (a glowing ball with a tail) from `from` to `to` in a low arc
  shot(from, to, kind = 'arrow', color = '#f4e2b8', dur = 0.26) {
    const grp = new THREE.Group();
    if (kind === 'arrow') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.8 }));
      shaft.rotation.x = Math.PI / 2; grp.add(shaft);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), new THREE.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.8, roughness: 0.3 }));
      head.rotation.x = Math.PI / 2; head.position.z = 0.38; grp.add(head);
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.9), glowMat(color, 0.5)); trail.rotation.x = Math.PI / 2; trail.position.z = -0.5; grp.add(trail);
    } else {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), glowMat(color, 1)); grp.add(ball);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); halo.scale.setScalar(0.7); grp.add(halo);
      for (let i = 1; i <= 5; i++) { const s = new THREE.Sprite(halo.material.clone()); s.material.opacity = 0.5 * (1 - i / 6); s.scale.setScalar(0.4 * (1 - i / 7)); s.position.z = -i * 0.14; grp.add(s); }
    }
    const d = to.clone().sub(from), L = d.length(), lift = Math.min(0.9, L * 0.12);
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    const at = (u, out) => out.copy(from).addScaledVector(d, u).setY(from.y + d.y * u + Math.sin(u * Math.PI) * lift);
    at(0, grp.position);
    this.add(grp, dur, (u) => { at(u, grp.position); at(Math.min(1, u + 0.02), q); if (q.distanceToSquared(grp.position) > 1e-8) grp.lookAt(q); p.copy(grp.position); });
  }

  // a cloud of smoke puffs rolling out round `at` (a smoke-pot, a powder flash, a mire's breath)
  smoke(at, color = '#8a8478', n = 8, r = 1.2, dur = 1.6) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: dot(), color: col(color), transparent: true, depthWrite: false, opacity: 0 });
      const sp = new THREE.Sprite(m), a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), o = at.clone();
      const to = new THREE.Vector3(Math.cos(a) * d, 0.4 + Math.random() * 0.8, Math.sin(a) * d), s0 = 0.5 + Math.random() * 0.4, dl = Math.random() * 0.25;
      this.add(sp, dur, (u) => { const k = Math.max(0, (u - dl) / (1 - dl)); sp.position.copy(o).addScaledVector(to, 1 - (1 - k) ** 2); sp.scale.setScalar(s0 + k * 1.6); m.opacity = 0.75 * Math.sin(Math.min(1, k * 1.3) * Math.PI) ** 0.7; });
    }
  }

  // water thrown up at `at`: a ring on the surface and drops arcing out and falling back
  splash(at, color = '#8ad0e8', n = 22, h = 1.6) {
    this.ring(at, color, 1.6, 0.7, 0.06);
    const m = new THREE.MeshBasicMaterial({ color: col(color), transparent: true, opacity: 0.85, depthWrite: false });
    for (let i = 0; i < n; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 4), m);
      const a = Math.random() * TAU, sp = 0.6 + Math.random() * 1.4, vy = h * (1.6 + Math.random() * 1.6), o = at.clone();
      this.add(drop, 0.8, (u) => { const t = u * 0.8; drop.position.set(o.x + Math.cos(a) * sp * t, o.y + Math.max(0, vy * t - 6 * t * t), o.z + Math.sin(a) * sp * t); });
    }
  }

  // small iron burrs (caltrops) skittering out over the ground round `at`, and lying there a while
  scatter(at, color = '#5a5a60', n = 12, r = 1.1, dur = 2.2) {
    const m = new THREE.MeshStandardMaterial({ color: col(color), metalness: 0.7, roughness: 0.45 });
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.TetrahedronGeometry(0.07, 0), m), a = Math.random() * TAU, d = r * Math.sqrt(Math.random()), o = at.clone();
      const to = new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d), spin = (Math.random() - 0.5) * 20;
      this.add(b, dur, (u) => { const k = Math.min(1, u * dur / 0.35); b.position.copy(o).addScaledVector(to, 1 - (1 - k) ** 2); b.position.y = o.y + 0.05 + Math.sin(k * Math.PI) * 0.25; b.rotation.set(k * spin, k * spin * 0.7, 0); b.scale.setScalar(u > 0.85 ? (1 - u) / 0.15 : 1); });
    }
  }

  // a mark chalked over a hero's head (Marked, a tally, a curse): a glowing cross drawn in, hanging, then fading
  mark(at, color = '#f0e6c8', size = 0.32, dur = 1.6) {
    const grp = new THREE.Group(); grp.position.copy(at); const m = glowMat(color, 0.95);
    for (const r of [Math.PI / 4, -Math.PI / 4]) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.16), m); bar.rotation.z = r; grp.add(bar); }
    const ringM = glowMat(color, 0.6), ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.62, size * 0.72, 28), ringM); grp.add(ring);
    this.add(grp, dur, (u, dt, cam) => { if (cam) grp.quaternion.copy(cam.quaternion); const k = Math.min(1, u / 0.15); grp.scale.setScalar(0.4 + k * 0.6); grp.position.y = at.y + u * 0.15; m.opacity = 0.95 * (u > 0.7 ? (1 - u) / 0.3 : 1); ringM.opacity = m.opacity * 0.6; });
  }

  // something long shot out from `from` to `to` and pulled back (a tongue, a rope, a whip, a vine): thick at the root,
  // tapering to a bulb at the tip, glistening; it curves and whips as it flies, and with { wrap: true } it coils round
  // the one it catches before it pulls back
  lash(from, to, color = '#a04a50', thick = 0.07, dur = 0.7, { wrap = false, bulb = true, gloss = true } = {}) {
    const m = new THREE.MeshPhysicalMaterial({ color: col(color), roughness: gloss ? 0.22 : 0.7, clearcoat: gloss ? 1 : 0, clearcoatRoughness: 0.15, sheen: 0 });
    const grp = new THREE.Group(), SEG = 22, RAD = 8;
    const d = to.clone().sub(from), L = d.length(), dir = d.clone().normalize();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const up = new THREE.Vector3().crossVectors(side, dir).normalize(), phase = Math.random() * TAU;
    let mesh = null;
    const tip = bulb ? new THREE.Mesh(new THREE.SphereGeometry(thick * 1.7, 12, 10), m) : null; if (tip) grp.add(tip);
    // the coil round the caught one: a ring of the same flesh that tightens
    const coil = wrap ? new THREE.Mesh(new THREE.TorusGeometry(0.42, thick * 0.75, 8, 28), m) : null; if (coil) { coil.rotation.x = Math.PI / 2; coil.position.copy(to); coil.visible = false; grp.add(coil); }
    const pts = Array.from({ length: 9 }, () => new THREE.Vector3());
    const shape = (k, t) => {
      // out along the line to fraction k of the way, a soft arc up and a sideways whip that settles as it reaches
      for (let i = 0; i < pts.length; i++) {
        const u = i / (pts.length - 1), s = u * k, wob = Math.sin(u * Math.PI) * (1 - k * 0.7);
        pts[i].copy(from).addScaledVector(d, s).addScaledVector(up, Math.sin(s * Math.PI) * L * 0.08)
          .addScaledVector(side, Math.sin(u * 5 + t * 18 + phase) * 0.18 * wob * L * 0.25);
      }
      return new THREE.CatmullRomCurve3(pts);
    };
    const build = (curve) => {
      const geo = new THREE.TubeGeometry(curve, SEG, thick, RAD, false), P = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (let ring = 0; ring <= SEG; ring++) { const u = ring / SEG, w = 1 - u * 0.62; curve.getPointAt(u, c); for (let j = 0; j <= RAD; j++) { const ix = ring * (RAD + 1) + j; v.fromBufferAttribute(P, ix).sub(c).multiplyScalar(w).add(c); P.setXYZ(ix, v.x, v.y, v.z); } }
      geo.computeVertexNormals(); return geo;
    };
    this.add(grp, dur, (u) => {
      const k = u < 0.35 ? 1 - (1 - u / 0.35) ** 2 : u < 0.65 ? 1 : 1 - ((u - 0.65) / 0.35) ** 2;
      const curve = shape(Math.max(0.02, k), u * dur);
      if (mesh) { grp.remove(mesh); mesh.geometry.dispose(); }
      mesh = new THREE.Mesh(build(curve), m); grp.add(mesh);
      if (tip) curve.getPointAt(1, tip.position);
      if (coil) { const caught = u >= 0.33 && u < 0.7; coil.visible = caught; if (caught) { const c = (u - 0.33) / 0.37; coil.scale.setScalar(1.25 - Math.min(1, c * 2.5) * 0.4); coil.position.copy(to); } }
    }, () => { if (mesh) mesh.geometry.dispose(); });
  }

  // a flare bursting overhead at `at` and lighting the field (a signal lantern, a seal blazing): a bright core, rays of
  // sparks and a light that floods everything for a moment
  flare(at, color = '#ffd27a', size = 2.4, dur = 1.0) {
    this.pulse(at, color, size, dur);
    this.sparks(at, color, 30, { spread: 1.8, up: 0.6 });
    const light = new THREE.PointLight(col(color), 0, 18, 1.4); light.position.copy(at); 
    this.add(light, dur, (u) => { light.intensity = 14 * Math.sin(Math.min(1, u * 1.6) * Math.PI); });
  }

  // a ring of light out over the ground at `at`
  ring(at, color = '#ffcb66', r1 = 2, dur = 0.6, y = 0.05) {
    const m = glowMat(color, 0.9);
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), m); mesh.rotation.x = -Math.PI / 2; mesh.position.copy(at); mesh.position.y += y;
    this.add(mesh, dur, (u) => { const r = 0.1 + (1 - (1 - u) * (1 - u)) * r1; mesh.scale.setScalar(r); m.opacity = 0.9 * (1 - u); });
  }

  // a Legend Strike's burst: a column of light from the ground, a bright core and a shock ring
  pillar(at, color = '#ffcb66', h = 6) {
    const m = glowMat(color, 0.8), c = glowMat('#ffffff', 0.9);
    const grp = new THREE.Group(); grp.position.copy(at);
    const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, h, 24, 1, true), m); col1.position.y = h / 2; grp.add(col1);
    const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h, 16, 1, true), c); col2.position.y = h / 2; grp.add(col2);
    this.add(grp, 0.9, (u) => { const k = u < 0.2 ? u / 0.2 : 1; grp.scale.set(k * (1 + u), 1, k * (1 + u)); m.opacity = 0.8 * (1 - u); c.opacity = 0.9 * (1 - u); });
    this.ring(at, color, 4, 0.8);
    this.sparks(at.clone().setY(at.y + 1), color, 30, { spread: 1.8, up: 1.4 });
  }

  // a thorn (a dark barbed spike) flying from `from` to `to`, a little arc, spinning
  thorn(from, to, color = '#3f5a26', dur = 0.32, delay = 0) {
    const grp = new THREE.Group();
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.6, 6), new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.7 }));
    spike.rotation.x = Math.PI / 2; grp.add(spike);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 5), glowMat('#e8ffb0', 0.95)); tip.rotation.x = Math.PI / 2; tip.position.z = 0.34; grp.add(tip);
    // a faint pale streak behind it, so it reads in flight on any floor
    const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.005, 0.9, 5, 1, true), glowMat('#e8f0c0', 0.35)); trail.rotation.x = Math.PI / 2; trail.position.z = -0.7; grp.add(trail);
    const d = to.clone().sub(from), lift = Math.min(1.2, d.length() * 0.18), q = new THREE.Vector3();
    const at = (u, out) => out.copy(from).addScaledVector(d, u).setY(from.y + d.y * u + Math.sin(u * Math.PI) * lift);
    grp.visible = false;
    this.add(grp, dur + delay, (u2) => {
      const u = Math.max(0, (u2 * (dur + delay) - delay) / dur); grp.visible = u > 0;
      at(Math.min(1, u), grp.position); at(Math.min(1, u + 0.03), q); if (q.distanceToSquared(grp.position) > 1e-8) grp.lookAt(q); spike.rotation.z = u * 20;
    });
  }

  // roots bursting up out of the ground round `at`, curling, holding a moment and sinking back
  roots(at, color = '#5a3a1e', n = 6, dur = 1.6) {
    // thick roots tearing up through the floor round `at`: heavy and dark at the base, tapering to pale tips that catch
    // the light, with clods of earth and a puff of dust thrown up where they break the ground (read on a brown floor)
    const grp = new THREE.Group(); grp.position.copy(at);
    const base = col(color), tip = col('#cdb38a');
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, emissive: col('#3a2a14'), emissiveIntensity: 0.35 });
    const SEG = 14, RAD = 7;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Math.random() * 0.4, r = 0.32 + Math.random() * 0.2, h = 1.0 + Math.random() * 0.45;
      const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new THREE.Vector3(Math.cos(a) * r * (1 - t * 0.55), t * h, Math.sin(a) * r * (1 - t * 0.55)).add(new THREE.Vector3(Math.cos(a + 1.6) * t * t * 0.3, 0, Math.sin(a + 1.6) * t * t * 0.3))); }
      const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, SEG, 0.11, RAD, false);
      // taper each ring towards the tip, and colour it from the dark base to the pale tip
      const P = geo.attributes.position, cols = new Float32Array(P.count * 3), c = new THREE.Color(), ctr = new THREE.Vector3(), v = new THREE.Vector3();
      for (let ring = 0; ring <= SEG; ring++) {
        const u = ring / SEG, w = Math.max(0.08, (1 - u) ** 0.8); curve.getPointAt(u, ctr); c.copy(base).lerp(tip, u ** 2.4);
        for (let j = 0; j <= RAD; j++) { const ix = ring * (RAD + 1) + j; v.fromBufferAttribute(P, ix).sub(ctr).multiplyScalar(w).add(ctr); P.setXYZ(ix, v.x, v.y, v.z); cols.set([c.r, c.g, c.b], ix * 3); }
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
      grp.add(new THREE.Mesh(geo, m));
    }
    // the broken ground: a dark crack ring under them
    const crackM = new THREE.MeshBasicMaterial({ color: col('#2a1a0c'), transparent: true, opacity: 0.7, depthWrite: false });
    const crack = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.62, 20), crackM); crack.rotation.x = -Math.PI / 2; crack.position.y = 0.03; grp.add(crack);
    this.add(grp, dur, (u) => { const up = Math.min(1, u / 0.18), down = u > 0.75 ? (u - 0.75) / 0.25 : 0; for (const o of grp.children) if (o !== crack) o.scale.set(1, Math.max(0.01, (1 - (1 - up) ** 2) * (1 - down)), 1); crackM.opacity = 0.7 * (1 - down); });
    // clods of earth thrown up and falling back
    for (let k = 0; k < 7; k++) {
      const clod = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.05, 0), new THREE.MeshStandardMaterial({ color: col('#4a3420'), roughness: 1 }));
      const a = Math.random() * TAU, sp = 0.8 + Math.random() * 1.2, vy = 2.2 + Math.random() * 1.6, o = at.clone().setY(at.y + 0.05);
      clod.position.copy(o);
      this.add(clod, 0.7, (u) => { const t = u * 0.7; clod.position.set(o.x + Math.cos(a) * sp * t, o.y + Math.max(0, vy * t - 4.9 * t * t), o.z + Math.sin(a) * sp * t); clod.rotation.x += 0.2; clod.rotation.z += 0.15; });
    }
    // a puff of dust rolling out low
    const dm = new THREE.SpriteMaterial({ map: dot(), color: col('#b49a72'), transparent: true, depthWrite: false, opacity: 0.6 });
    const dust = new THREE.Sprite(dm); dust.position.copy(at).setY(at.y + 0.3);
    this.add(dust, 0.9, (u) => { dust.scale.setScalar(0.6 + u * 1.8); dust.position.y = at.y + 0.3 + u * 0.35; dm.opacity = 0.6 * (1 - u) ** 1.5; });
    this.sparks(at.clone().setY(at.y + 0.1), '#c8a878', 12, { spread: 0.8, up: 0.6 });
  }

  // bramble knitting over a body: green vines winding up round it, then a glow
  vines(at, h = 1.2, r = 0.7, color = '#3f7a2a', dur = 1.3) {
    const grp = new THREE.Group(); grp.position.copy(at);
    const m = new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.8, emissive: col('#1a3a10'), emissiveIntensity: 0.4 });
    for (let k = 0; k < 3; k++) {
      const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = t * TAU * 1.6 + k * TAU / 3; pts.push(new THREE.Vector3(Math.cos(a) * r, t * h, Math.sin(a) * r)); }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.03, 5, false);
      grp.add(new THREE.Mesh(geo, m));
    }
    this.add(grp, dur, (u) => { const k = Math.min(1, u / 0.6); grp.children.forEach((c) => c.geometry.setDrawRange(0, Math.floor(c.geometry.index.count * k / 3) * 3)); grp.rotation.y = u * 0.8; m.opacity = 1; if (u > 0.8) grp.scale.setScalar(1 + (u - 0.8) * 0.5); });
    this.ring(at, '#8ad872', r * 1.6, dur * 0.8, 0.05);
  }

  // a pulse of light at `at` (the thorn-crown blazing): a bright sprite swelling and a light flaring
  pulse(at, color = '#8ad872', size = 1.4, dur = 0.8) {
    const grp = new THREE.Group(); grp.position.copy(at);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col(color), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); grp.add(sp);
    sp.renderOrder = 10; // a glow over the body it bursts from, never hidden inside it
    const light = new THREE.PointLight(col(color), 3, 6, 2); grp.add(light);
    this.add(grp, dur, (u) => { const b = Math.sin(Math.min(1, u * 1.4) * Math.PI); sp.scale.setScalar(size * (0.4 + b)); sp.material.opacity = b; light.intensity = 3 * b; });
  }

  // the relic flying loose off `from`, tumbling, landing at `to` on the ground and lying there glinting. icon: a canvas
  relic(from, to, icon, size = 0.55) {
    const tex = new THREE.CanvasTexture(icon); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    const grp = new THREE.Group(), card = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); grp.add(card);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col('#ffe8a0'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); glow.scale.setScalar(size * 1.6); grp.add(glow);
    grp.position.copy(from);
    const d = to.clone().sub(from);
    let spin = 0;
    this.scene.add(grp);
    const drop = { o: grp, at: to.clone(), ph: Math.random() * 3, glint: (dt) => { drop.ph += dt; const g = (drop.ph % 2.2) / 2.2; glow.material.opacity = g < 0.15 ? 1 - Math.abs(g - 0.075) / 0.075 * 0.8 : 0.2; } };
    this.list.push({ o: grp, t: 0, dur: 0.9, keep: true, done: () => { this.dropped.push(drop); },
      step: (u, dt) => {
        spin += dt * 14 * (1 - u);
        grp.position.copy(from).addScaledVector(d, u); grp.position.y = from.y + d.y * u + Math.sin(u * Math.PI) * 1.4 + (u > 0.85 ? Math.sin((u - 0.85) / 0.15 * Math.PI) * 0.12 : 0);
        card.rotation.set(spin, spin * 0.6, 0);
        if (u >= 1) { card.rotation.set(-Math.PI / 2, 0, 0.4); grp.position.y = to.y + 0.03; }
      } });
    return drop;
  }
}

function dispose(o) { o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) { const ms = Array.isArray(c.material) ? c.material : [c.material]; for (const m of ms) { if (m.map && m.map !== dotTex) m.map.dispose(); m.dispose(); } } }); }
