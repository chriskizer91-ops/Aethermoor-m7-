// The walkers' gallery (Foes: walkers, session 8): each finished walker in full detail on a turning stand, Chris's
// sheet beside it with the sculpt's renders under the sheet's three views, its moves, its numbers, and a crowd test
// with the four heroes and the frame rate.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HERO_ART } from '../../../../game/src/art/hero-looks.js';
import { SLOTS } from '../../../../game/src/art/item-looks.js';
import { buildHero, setPose } from '../../../hero-3d/model.js';
import { Q } from '../../../hero-3d/kit.js';
import { ready, makeWalkerShared, buildWalker, cloneWalker } from './walker.js';
import { FOES, COMMON } from './foes.js';
import { ASSETS } from './assets.js';

const $ = (id) => document.getElementById(id);
const phone = Math.min(screen.width, screen.height) < 820 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
const KEYS = Object.keys(ASSETS).filter((k) => FOES[k]);
const S = { key: KEYS[0], turn: true, move: 'idle', moveT: 0, crowd: false };

// ---- the stage ---------------------------------------------------------------------------------------------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x15130f); scene.fog = new THREE.Fog(0x15130f, 16, 34);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.52;
scene.add(new THREE.HemisphereLight(0xc4d4ff, 0x3a2a1a, 0.8));
const key = new THREE.DirectionalLight(0xffe2bc, 2.8); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 30 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.5); rim.position.set(-5, 3, -5); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 72), new THREE.MeshStandardMaterial({ color: 0x34302a, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const stand = new THREE.Group(); scene.add(stand);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x564a3c, roughness: 0.9 }));
disc.position.y = 0.04; disc.receiveShadow = true; stand.add(disc);
const top = new THREE.Group(); top.position.y = 0.08; stand.add(top);

// ---- the walkers -------------------------------------------------------------------------------------------------
const made = {};       // key -> { shared, W }
function get(k) {
  if (made[k]) return made[k];
  const a = ASSETS[k];
  const shared = makeWalkerShared(a);
  const W = buildWalker(shared, FOES[k]);
  return (made[k] = { shared, W });
}
function show(k) {
  S.key = k; S.move = 'idle'; S.moveT = 0;
  top.clear();
  const { W } = get(k); top.add(W.group);
  const f = FOES[k], a = ASSETS[k];
  $('name').textContent = f.name; $('tier').textContent = `${f.tier} · ${f.act}`; $('flavour').textContent = f.text;
  $('tris').textContent = W.triangles.toLocaleString();
  $('sculpt').textContent = a.meta.sculptTriangles.toLocaleString();
  $('shape').textContent = (a.shapeTriangles || 0).toLocaleString();
  $('bones').textContent = a.meta.bones.length;
  $('size').textContent = (a.bytes / 1024 / 1024).toFixed(2) + ' MB';
  $('sheet').src = a.sheet; $('cmp').src = a.cmp; $('outl').src = a.outline;
  buttons(); frame(); refresh();
}

// ---- the crowd ---------------------------------------------------------------------------------------------------
const crowd = { group: new THREE.Group(), foes: [], heroes: [] };
scene.add(crowd.group); crowd.group.visible = false;
const HEROES = ['warden', 'pip', 'bryn', 'alondra'];
function starterKit(id) { const st = HERO_ART[id].starter, g = {}; for (const s of SLOTS) g[s] = st[s] ? { ...st[s], starter: true } : null; return g; }
function buildCrowd() {
  for (const c of crowd.foes) crowd.group.remove(c.group);
  crowd.foes = [];
  // the champion in the middle of the far side, the rest of the walkers round the heroes
  const list = [];
  for (const k of KEYS) { const n = FOES[k].tier === 'Champion' ? 1 : 4; for (let i = 0; i < n; i++) list.push(k); }
  while (list.length < 5) list.push(KEYS[list.length % KEYS.length]);
  list.forEach((k, i) => {
    const c = cloneWalker(get(k).W); const a = (i / list.length) * Math.PI * 2;
    c.ring = { a, r: 5.6 + (i % 2) * 1.0, speed: 0.09 + 0.02 * (i % 3) };
    crowd.group.add(c.group); crowd.foes.push(c);
  });
  if (!crowd.heroes.length) HEROES.forEach((id, i) => {
    const h = buildHero(id, starterKit(id), {}); const r = new THREE.Group(); r.add(h.group); h.group.scale.setScalar(1.72 / 1.22);
    h.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    r.position.set((i - 1.5) * 1.1, 0, (i % 2) * 0.6 - 0.3); r.rotation.y = (i - 1.5) * 0.25;
    crowd.group.add(r); crowd.heroes.push(h);
  });
  $('crowdn').textContent = `${crowd.foes.length} walkers`;
}

// ---- the panel ---------------------------------------------------------------------------------------------------
function moveList() {
  const f = FOES[S.key];
  return [COMMON[0], COMMON[1], ...Object.entries(f.moves).map(([k, m]) => [k, m.label, m.dur]), COMMON[2], COMMON[3]];
}
function buttons() {
  const m = $('moves'); m.innerHTML = '';
  for (const [k, label] of moveList()) {
    const b = document.createElement('button'); b.textContent = label; b.dataset.k = k;
    b.onclick = () => { S.move = k; S.moveT = 0; refresh(); }; m.appendChild(b);
  }
  const t = $('foes'); t.innerHTML = '';
  for (const k of KEYS) {
    const b = document.createElement('button'); b.textContent = FOES[k].name; b.dataset.k = k;
    b.onclick = () => { if (S.crowd) $('crowd').onclick(); show(k); }; t.appendChild(b);
  }
}
function refresh() {
  for (const b of document.querySelectorAll('#moves button')) b.setAttribute('aria-pressed', b.dataset.k === S.move);
  for (const b of document.querySelectorAll('#foes button')) b.setAttribute('aria-pressed', b.dataset.k === S.key);
  $('turn').setAttribute('aria-pressed', S.turn); $('crowd').setAttribute('aria-pressed', S.crowd);
  $('crowdnote').hidden = !S.crowd; $('moves').hidden = S.crowd;
}
$('turn').onclick = () => { S.turn = !S.turn; refresh(); };
$('crowd').onclick = () => {
  S.crowd = !S.crowd;
  if (S.crowd) buildCrowd();
  crowd.group.visible = S.crowd; stand.visible = !S.crowd;
  frame(); refresh();
};
const dur = (k) => (moveList().find((m) => m[0] === k) || [])[2] || 0;

function frame() {
  const w = canvas.clientWidth, h = canvas.clientHeight; const ar = w / h;
  camera.aspect = ar; camera.updateProjectionMatrix();
  if (S.crowd) { controls.target.set(0, 1.0, 0); const d = ar < 1 ? 21 : 15; camera.position.set(0, d * 0.5, d); }
  else {
    const H = FOES[S.key].height + 0.3, fov = camera.fov * Math.PI / 180;
    const need = Math.max(H / 2 / Math.tan(fov / 2), 1.6 / (Math.tan(fov / 2) * ar)) * 1.12;
    controls.target.set(0, H * 0.46, 0); camera.position.set(0, H * 0.55 + need * 0.1, need);
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
  const W = made[S.key]?.W;
  if (W && !S.crowd) {
    const D = dur(S.move); let u = 0;
    if (D) { S.moveT += d; u = Math.min(1, S.moveT / D); if (S.moveT > D + 0.9) S.moveT = 0; }
    if (S.move === 'walk') step += d * 3.4;
    W.pose(S.move, u, t, step);
  }
  if (S.crowd) {
    for (const c of crowd.foes) {
      c.ring.a += d * c.ring.speed;
      c.group.position.set(Math.cos(c.ring.a) * c.ring.r, 0, Math.sin(c.ring.a) * c.ring.r);
      c.group.rotation.y = -c.ring.a;      // walking round, facing ahead
      c.pose('walk', 0, t + c.ring.a * 3, t * 3.4 + c.ring.a * 5);
    }
    crowd.heroes.forEach((h, i) => setPose(h.rig, 'idle', t + i, 0));
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
  Q.d = 2;
  await ready();
  const q = new URLSearchParams(location.search);
  show(q.get('foe') && FOES[q.get('foe')] ? q.get('foe') : S.key);
  resize();
  if (q.get('move')) { S.move = q.get('move'); S.turn = false; top.rotation.y = +(q.get('yaw') || 0); refresh(); }
  if (q.has('crowd')) $('crowd').onclick();
  window.__ready = true;
  loop();
})();
