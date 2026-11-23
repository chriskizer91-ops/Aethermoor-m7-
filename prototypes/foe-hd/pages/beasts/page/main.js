// The beasts' gallery (Foes: beasts, session 7): each finished foe on a turning stand, its moves, its numbers, its
// renders beside Chris's sheet, and a pack test with the four heroes. The stage and lights follow session 6's
// Briarmaw page (prototypes/foe-hd/page/main.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HERO_ART } from '../../../../../game/src/art/hero-looks.js';
import { SLOTS } from '../../../../../game/src/art/item-looks.js';
import { buildHero, setPose } from '../../../../hero-3d/model.js';
import { ready, makeShared, buildFoe, cloneFoe, decodeSculpt } from '../kit/foe.js';
import { quad } from '../kit/moves-quad.js';
import { stag } from '../kit/moves-stag.js';
import { boar } from '../kit/moves-boar.js';
import { frog } from '../kit/moves-frog.js';
import { FOES, WITH_HEROES } from 'virtual:foes';

const MOVESETS = { quad, stag, boar, frog };
const $ = (id) => document.getElementById(id);
const phone = Math.min(screen.width, screen.height) < 820 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
const S = { foe: null, turn: true, move: 'idle', moveT: 0, pack: false };
const VIEW = new URLSearchParams(location.search).get('view');

// ---- the stage ---------------------------------------------------------------------------------------------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.45;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1512); scene.fog = new THREE.Fog(0x1a1512, 14, 30);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.4;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.52;
scene.add(new THREE.HemisphereLight(0xd8e0ff, 0x4a3a2a, 1.3));
const key = new THREE.DirectionalLight(0xffe2bc, 2.9); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 30 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.6); rim.position.set(-5, 3, -5); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(18, 72), new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const standG = new THREE.Group(); scene.add(standG);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.06, 0.06, 64), new THREE.MeshStandardMaterial({ color: 0x4a3c2e, roughness: 0.9 }));
disc.position.y = 0.03; disc.receiveShadow = true; standG.add(disc);
const top = new THREE.Group(); top.position.y = 0.06; standG.add(top);

// ---- the foes ----------------------------------------------------------------------------------------------------
const made = {};   // key -> { shared, F }
function foeOf(key) {
  if (made[key]) return made[key];
  const f = FOES.find((x) => x.key === key);
  const shared = makeShared(f.A, { glow: f.glow ?? 0.8 });
  const F = buildFoe(shared, MOVESETS[f.moves || 'quad'], { height: f.height, plan: f.plan });
  return (made[key] = { f, shared, F });
}
function show(key) {
  S.foe = key; S.move = 'idle'; S.moveT = 0;
  while (top.children.length) top.remove(top.children[0]);
  const { f, F } = foeOf(key);
  top.add(F.group); S.sculpt = false;
  $('sculpt').hidden = !f.A.sculptBin;
  const size = Math.max(f.height, f.length || f.height * 1.4);
  disc.scale.set(size * 0.6, 1, size * 0.6);
  $('name').textContent = f.name;
  $('what').textContent = f.what || '';
  $('ntri').textContent = f.lightMeta?.triangles?.toLocaleString() ?? F.triangles.toLocaleString();
  $('nsculpt').textContent = (f.sculptTriangles || 0).toLocaleString();
  $('nsize').textContent = `${(f.size / 1024 / 1024).toFixed(2)} MB`;
  $('nbones').textContent = String(Object.keys(F.bones).length);
  $('about').textContent = f.about || '';
  $('cmp').src = f.A.cmp;
  buttons(); clearPack(); frame(); refresh();
  try { history.replaceState(null, '', '#' + key); } catch (e) { /* previews */ }
}
function roster() {
  const r = $('roster'); r.innerHTML = '';
  for (const f of FOES.filter((x) => x.ready)) {
    const b = document.createElement('button'); b.textContent = f.name; b.dataset.k = f.key;
    b.onclick = () => show(f.key); r.appendChild(b);
  }
  const later = FOES.filter((x) => !x.ready).map((x) => x.name);
  if (later.length) { const p = document.createElement('p'); p.className = 'later'; p.textContent = `Still to come: ${later.join(', ')}.`; r.appendChild(p); }
}

// ---- the pack ----------------------------------------------------------------------------------------------------
const pack = { group: new THREE.Group(), foes: [], heroes: [] };
scene.add(pack.group); pack.group.visible = false;
const HEROES = ['warden', 'pip', 'bryn', 'alondra'];
function starterKit(id) { const st = HERO_ART[id].starter, g = {}; for (const s of SLOTS) g[s] = st[s] ? { ...st[s], starter: true } : null; return g; }
function clearPack() { for (const c of pack.foes) pack.group.remove(c.group); pack.foes = []; S.pack = false; pack.group.visible = false; standG.visible = true; }
function buildPack() {
  const { f, F } = foeOf(S.foe);
  const n = f.pack || 5;
  for (let i = 0; i < n; i++) {
    const c = cloneFoe(F); const a = (i / n) * Math.PI * 2;
    c.ring = { a, r: 2.6 + (i % 2) * 0.7, speed: 0.16 + 0.03 * (i % 3) };
    pack.group.add(c.group); pack.foes.push(c);
  }
  if (WITH_HEROES && !pack.heroes.length) {
    HEROES.forEach((id, i) => {
      const h = buildHero(id, starterKit(id), {}); const r = new THREE.Group(); r.add(h.group); h.group.scale.setScalar(1.72 / 1.22);
      h.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      r.position.set((i - 1.5) * 0.9, 0, (i % 2) * 0.5 - 0.25); r.rotation.y = (i - 1.5) * 0.25;
      pack.group.add(r); pack.heroes.push(h);
    });
  }
}

// ---- the panel ---------------------------------------------------------------------------------------------------
function buttons() {
  const m = $('moves'); m.innerHTML = '';
  const { F } = foeOf(S.foe);
  for (const [k, label] of F.moves.list) {
    const b = document.createElement('button'); b.textContent = label; b.dataset.k = k;
    b.onclick = () => { S.move = k; S.moveT = 0; refresh(); }; m.appendChild(b);
  }
}
function refresh() {
  for (const b of document.querySelectorAll('#moves button')) b.setAttribute('aria-pressed', b.dataset.k === S.move);
  for (const b of document.querySelectorAll('#roster button')) b.setAttribute('aria-pressed', b.dataset.k === S.foe);
  $('turn').setAttribute('aria-pressed', S.turn); $('sculpt').setAttribute('aria-pressed', !!S.sculpt); $('pack').setAttribute('aria-pressed', S.pack);
}
$('turn').onclick = () => { S.turn = !S.turn; refresh(); };
$('sculpt').onclick = () => {
  const cur = made[S.foe]; if (!cur.f.A.sculptBin) return;
  if (!cur.sculpt) {
    cur.sculpt = new THREE.Mesh(decodeSculpt(cur.f.A.sculptMeta, cur.f.A.sculptBin), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    cur.sculpt.castShadow = cur.sculpt.receiveShadow = true;
  }
  S.sculpt = !S.sculpt;
  top.remove(S.sculpt ? cur.F.group : cur.sculpt); top.add(S.sculpt ? cur.sculpt : cur.F.group);
  $('ntri').textContent = (S.sculpt ? cur.f.A.sculptMeta.triangles : cur.F.triangles).toLocaleString();
  refresh();
};
$('pack').onclick = () => {
  if (S.pack) clearPack(); else { buildPack(); S.pack = true; pack.group.visible = true; standG.visible = false; }
  frame(); refresh();
};

function frame() {
  const w = canvas.clientWidth, h = canvas.clientHeight, ar = w / h;
  camera.aspect = ar; camera.updateProjectionMatrix();
  const f = FOES.find((x) => x.key === S.foe);
  if (!f) return;
  if (S.pack) { controls.target.set(0, 0.6, 0); const d = ar < 1 ? 13 : 9.5; camera.position.set(0, d * 0.5, d); }
  else {
    const H = f.height, L = f.length || H * 1.4, fov = camera.fov * Math.PI / 180;
    const need = Math.max(L * 0.62, H * 0.6);
    const dist = Math.max(need / (Math.tan(fov / 2) * ar), (H * 0.62) / Math.tan(fov / 2)) * 1.12;
    controls.target.set(0, H * 0.42, 0);
    if (VIEW === 'side') camera.position.set(dist, H * 0.45, 0);
    else camera.position.set(dist * 0.5, H * 0.5 + dist * 0.12, dist * 0.87);
  }
  controls.update();
}
function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); frame(); }
addEventListener('resize', resize);

// ---- the loop ----------------------------------------------------------------------------------------------------
const clock = new THREE.Clock(); let t = 0, step = 0, fpsN = 0, fpsT = 0;
function loop() {
  const d = Math.min(0.05, clock.getDelta()); t += d;
  if (S.turn) top.rotation.y = t * 0.4;
  const cur = made[S.foe];
  if (cur) {
    const F = cur.F, dur = F.moves.dur[S.move];
    let u = 0; if (dur) { if (!S.still) S.moveT += d; u = Math.min(1, S.moveT / dur); if (S.moveT > dur + 0.8) S.moveT = 0; }
    if (S.move === 'walk') step += d * 5.0;
    F.pose(S.move, u, t, step);
    if (S.pack) {
      for (const c of pack.foes) {
        c.ring.a += d * c.ring.speed;
        c.group.position.set(Math.cos(c.ring.a) * c.ring.r, 0, Math.sin(c.ring.a) * c.ring.r);
        c.group.rotation.y = -c.ring.a;     // walking round, nose ahead
        c.pose('walk', 0, t + c.ring.a * 3, t * 5.5 + c.ring.a * 5);
      }
      pack.heroes.forEach((h, i) => setPose(h.rig, 'idle', t + i, 0));
    }
  }
  controls.update();
  renderer.render(scene, camera);
  fpsN++; fpsT += d;
  if (fpsT > 0.5) {
    const fps = fpsN / fpsT; fpsN = 0; fpsT = 0;
    $('fps').textContent = `${fps.toFixed(0)} frames a second · ${renderer.info.render.triangles.toLocaleString()} triangles drawn`;
  }
  requestAnimationFrame(loop);
}

// ---- start -------------------------------------------------------------------------------------------------------
(async () => {
  roster();
  await ready();
  const want = location.hash.slice(1), first = FOES.find((f) => f.ready && f.key === want) || FOES.find((f) => f.ready);
  resize();
  show(first.key);
  const qs = new URLSearchParams(location.search);
  if (qs.has('pack')) $('pack').onclick();
  if (qs.get('move')) {
    S.move = qs.get('move'); S.turn = !qs.has('still'); S.still = qs.has('still');
    S.moveT = Number(qs.get('u') || 0) * (made[S.foe].F.moves.dur[S.move] || 1); refresh();
  }
  window.__ready = true;
  loop();
})();
