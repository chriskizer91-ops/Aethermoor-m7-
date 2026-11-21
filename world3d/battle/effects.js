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
  add(o, dur, step, done) { this.scene.add(o); this.list.push({ o, t: 0, dur: dur / this.speed, step, done }); return o; }
  busy() { return this.list.length > 0; }
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
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.32, 5), new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.7 }));
    spike.rotation.x = Math.PI / 2; grp.add(spike);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.08, 4), glowMat('#d8f0a0', 0.9)); tip.rotation.x = Math.PI / 2; tip.position.z = 0.18; grp.add(tip);
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
    const grp = new THREE.Group(); grp.position.copy(at);
    const m = new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.9 });
    const parts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Math.random() * 0.4, r = 0.35 + Math.random() * 0.15;
      const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new THREE.Vector3(Math.cos(a) * r * (1 - t * 0.6), t * (0.9 + Math.random() * 0.3), Math.sin(a) * r * (1 - t * 0.6)).add(new THREE.Vector3(Math.cos(a + 1.6) * t * t * 0.25, 0, Math.sin(a + 1.6) * t * t * 0.25))); }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.035, 5, false);
      const mesh = new THREE.Mesh(geo, m); grp.add(mesh); parts.push(mesh);
    }
    this.add(grp, dur, (u) => { const up = Math.min(1, u / 0.18), down = u > 0.75 ? (u - 0.75) / 0.25 : 0; grp.scale.set(1, Math.max(0.01, up * (1 - down)), 1); });
    this.sparks(at.clone().setY(at.y + 0.1), '#8a6a44', 12, { spread: 0.8, up: 0.6 });
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
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: col(color), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); grp.add(sp);
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
    this.list.push({ o: grp, t: 0, dur: 0.9 / this.speed, keep: true, done: () => { this.dropped.push(drop); },
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
