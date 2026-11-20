// M7's own dice tray (game/src/ui/battle/tray.js), every word of it as it is, with real dice in it (November 20, the
// suggestion in docs/project/questions.md): the d20s tumble in 3D and land on the very faces M7 rolled (the engine
// decides; the dice only show it). The kept die is lit, a dropped one (advantage, disadvantage) dims, a natural 20
// glows gold and a 1 red. The tray's pixel dice are still laid out under them (fight.css hides them), so the tray's
// size and its words never move. One small renderer serves every fight on the page.
import * as THREE from 'three';
import { Tray as Tray2D } from '../../game/src/ui/battle/tray.js';
import { arena } from './arena.js';

let R = null; // { renderer, scene, cam, dice: [], canvas }
function kit() {
  if (R) return R;
  const canvas = document.createElement('canvas'); canvas.className = 'f3-dice';
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x40281a, 1.4));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.2); key.position.set(-2, 3, 4); scene.add(key);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20); cam.position.set(0, 0, 6);
  R = { renderer, scene, cam, canvas, dice: [], raf: 0 };
  return R;
}

// ---- a d20: an icosahedron with its numbers, opposite faces summing to 21 ----------------------------------------
let D20 = null;
function d20Geometry() {
  if (D20) return D20;
  const g = new THREE.IcosahedronGeometry(1, 0);
  const pos = g.attributes.position, n = pos.count / 3;
  const normals = [], centers = [];
  for (let f = 0; f < n; f++) {
    const a = V(pos, f * 3), b = V(pos, f * 3 + 1), c = V(pos, f * 3 + 2);
    centers.push(a.clone().add(b).add(c).multiplyScalar(1 / 3)); normals.push(centers[f].clone().normalize());
  }
  // pair opposite faces: 1 with 20, 2 with 19...
  const num = new Array(n).fill(0); let k = 1;
  for (let f = 0; f < n; f++) {
    if (num[f]) continue;
    let opp = -1, best = 1; for (let o = 0; o < n; o++) { const d = normals[f].dot(normals[o]); if (d < best) { best = d; opp = o; } }
    num[f] = k; num[opp] = 21 - k; k++;
  }
  // the numbers: a 5 x 4 sheet, one cell to a face, each number upright toward its face's first corner
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 512;
  const x = cv.getContext('2d');
  x.fillStyle = '#efe4c8'; x.fillRect(0, 0, 640, 512);
  const uv = new Float32Array(pos.count * 2);
  for (let f = 0; f < n; f++) {
    const cx = (f % 5) * 128, cy = Math.floor(f / 5) * 128;
    const tri = [[cx + 64, cy + 8], [cx + 8, cy + 118], [cx + 120, cy + 118]];
    for (let i = 0; i < 3; i++) { uv[(f * 3 + i) * 2] = tri[i][0] / 640; uv[(f * 3 + i) * 2 + 1] = 1 - tri[i][1] / 512; }
    x.fillStyle = num[f] === 20 ? '#8a2412' : '#2a1a10';
    x.font = `bold ${num[f] >= 10 ? 40 : 46}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(num[f]), cx + 64, cy + 82);
    if (num[f] === 6 || num[f] === 9) x.fillRect(cx + 50, cy + 104, 28, 4);
    // the face's edge, a darker line
    x.strokeStyle = 'rgba(90,60,30,.5)'; x.lineWidth = 4; x.beginPath(); x.moveTo(...tri[0]); x.lineTo(...tri[1]); x.lineTo(...tri[2]); x.closePath(); x.stroke();
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // the turn that shows face f to the viewer (+z), its first corner up
  const show = {};
  for (let f = 0; f < n; f++) {
    const q1 = new THREE.Quaternion().setFromUnitVectors(normals[f], new THREE.Vector3(0, 0, 1));
    const top = V(pos, f * 3).sub(centers[f]).applyQuaternion(q1);
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(top.x, top.y));
    show[num[f]] = q2.multiply(q1);
  }
  D20 = { g, tex, show };
  return D20;
}
function V(pos, i) { return new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)); }

export class Tray extends Tray2D {
  constructor(host) { super(host); this.box.classList.add('f3-tray'); }
  hide() { super.hide(); stop(); }
  roll(ev, o) {
    arena.lastRoll = ev;
    const p = super.roll(ev, o); // its slots are laid out before it first waits
    try { this.dice3d(ev, o); } catch (e) { console.warn('3D dice', e); }
    return p;
  }
  dice3d(ev, { reduced, clock }) {
    const K = kit(), D = d20Geometry();
    const rolls = ev.rolls && ev.rolls.length ? ev.rolls : [ev.kept], keptIdx = rolls.indexOf(ev.kept);
    const host = this.dice, r = host.getBoundingClientRect();
    if (!r.width) return;
    const w = Math.max(70, r.width + 16), h = Math.max(70, r.height + 12);
    K.canvas.style.width = `${w}px`; K.canvas.style.height = `${h}px`;
    K.renderer.setSize(w, h, false);
    const asp = w / h; K.cam.left = -asp; K.cam.right = asp; K.cam.top = 1; K.cam.bottom = -1; K.cam.zoom = Math.min(1, asp / (rolls.length * 1.25)); K.cam.updateProjectionMatrix();
    host.append(K.canvas);
    for (const d of K.dice) K.scene.remove(d.mesh);
    K.dice = rolls.map((v, i) => {
      const crit = v === 20 && (ev.purpose || 'attack') === 'attack', fum = v === 1;
      const m = new THREE.MeshStandardMaterial({ map: D.tex, roughness: 0.45, metalness: 0.05, emissive: new THREE.Color(crit ? 0xffb030 : fum ? 0xd02010 : 0x000000), emissiveIntensity: 0 });
      const mesh = new THREE.Mesh(D.g, m); mesh.scale.setScalar(0.62);
      const x = (i - (rolls.length - 1) / 2) * 1.3;
      mesh.position.set(x, 0, 0); K.scene.add(mesh);
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      mesh.quaternion.copy(q0);
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return { mesh, m, v, x, axis, spin: 22 + Math.random() * 8, end: D.show[v].clone(), kept: i === keptIdx || rolls.length === 1, crit, fum };
    });
    const T = (reduced ? 60 : 560) / (clock.speed || 1), t0 = performance.now();
    stop();
    const loop = () => {
      const t = performance.now() - t0, u = Math.min(1, t / T);
      for (const d of K.dice) {
        if (u < 0.72) { d.mesh.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(d.axis, d.spin * 0.016 * (1 - u))); d.mesh.position.y = Math.abs(Math.sin(u * 9)) * 0.35 * (1 - u); d.from = d.mesh.quaternion.clone(); }
        else { const k = (u - 0.72) / 0.28, e = 1 - (1 - k) * (1 - k); d.mesh.quaternion.slerpQuaternions(d.from, d.end, e); d.mesh.position.y = 0; }
        if (u >= 1) {
          const s = d.kept ? 0.66 : 0.5; d.mesh.scale.setScalar(s); d.mesh.position.x = d.x;
          d.m.opacity = d.kept ? 1 : 0.5; d.m.transparent = !d.kept; d.m.emissiveIntensity = d.kept && (d.crit || d.fum) ? 0.55 : 0;
        }
      }
      K.renderer.render(K.scene, K.cam);
      if (u < 1) K.raf = requestAnimationFrame(loop); else K.raf = 0;
    };
    loop();
  }
}
function stop() { if (R && R.raf) { cancelAnimationFrame(R.raf); R.raf = 0; } }
