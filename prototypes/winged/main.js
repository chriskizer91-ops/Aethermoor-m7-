// The winged foes' gallery (November 23): each on a turning stand beside Chris's sheet, its moves, its full
// sculpt, a crowd test at the fight's detail, and its triangle and draw counts.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildWinged as buildWraith, WINGED as WRAITHS, WINGED_INFO as WRAITH_INFO } from './winged.js';
import { loadHeights, sculptify, unsculpt } from '../hero-3d/masters/sculpt-view.js';
import { SHEETS } from './sheets/pack.js';

const $ = id => document.getElementById(id);
const S = { key: new URLSearchParams(location.search).get('w') || 'gloamwing', detail: 'high', sculpt: false, crowd: false, move: null, mt: 0, turn: true };

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e1018); scene.fog = new THREE.Fog(0x0e1018, 7, 18);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.56; controls.minDistance = 0.4; controls.maxDistance = 14;
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
scene.add(new THREE.HemisphereLight(0x9ab8d8, 0x18120e, 0.6));
const key = new THREE.DirectionalLight(0xdfe8ff, 2.4); key.position.set(1.8, 3.2, 2.4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; scene.add(key);
const rim = new THREE.DirectionalLight(0x6ad0ff, 2.0); rim.position.set(-2, 2, -2.4); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: 0x1a2428, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0x2a363c, roughness: 0.8 })); stand.position.y = -0.026; stand.receiveShadow = true; scene.add(stand);
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.45, 0.88); composer.addPass(bloom); composer.addPass(new OutputPass());

let figs = [];
function clear() { for (const f of figs) { scene.remove(f.group); f.group.traverse(o => o.geometry?.dispose?.()); } figs = []; unsculpt(); }
async function show() {
  clear();
  const t0 = performance.now();
  if (S.crowd) {
    for (let i = 0; i < 12; i++) { const f = buildWraith(S.key, { detail: 'light' }); const sp = Math.max(1.1, WRAITH_INFO[S.key].h0 * 1.25); f.group.position.set((i % 4 - 1.5) * sp, 0, -Math.floor(i / 4) * sp + 1); f.ph = i * 0.7; scene.add(f.group); figs.push(f); }
  } else {
    const f = buildWraith(S.key, { detail: S.detail }); scene.add(f.group); figs.push(f);
    if (S.sculpt) { await loadHeights(); f.sculpt = sculptify(f.group, 900000); }
  }
  for (const f of figs) f.group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const f = figs[0], I = WRAITH_INFO[S.key];
  S.ms = Math.round(performance.now() - t0);
  frame(f, I);
  $('name').textContent = I.name; $('title2').textContent = I.name; $('blurb').textContent = `${I.act}. ${I.blurb}`;
  $('sheet').src = SHEETS[S.key];
  drawMoves(f);
  for (const b of document.querySelectorAll('#who button')) b.setAttribute('aria-pressed', b.dataset.k === S.key);
  history.replaceState(null, '', '?w=' + S.key);
}
function frame(f, I) {
  const h = I.height, d = S.crowd ? 7 : h * 2.4 + 0.8;
  controls.target.set(0, S.crowd ? 0.9 : h * 0.55, S.crowd ? 0 : 0); camera.position.set(d * 0.35, h * 0.7 + (S.crowd ? 2 : 0), d); controls.update();
  controls.autoRotate = S.turn && !S.crowd; controls.autoRotateSpeed = 1.2;
}
function drawMoves(f) {
  const box = $('moves'); box.innerHTML = '';
  for (const [m] of f.moves.MOVES) { if (m === 'idle' || m === 'walk') continue; const b = document.createElement('button'); b.textContent = m.replace(/-/g, ' '); b.onclick = () => { S.move = m; S.mt = 0; }; box.append(b); }
  const w = document.createElement('button'); w.textContent = 'walk'; w.onclick = () => { S.walk = !S.walk; w.setAttribute('aria-pressed', S.walk); }; box.append(w);
}
for (const k of WRAITHS) { const b = document.createElement('button'); b.dataset.k = k; b.innerHTML = `${WRAITH_INFO[k].name.replace(/^The /, '')}<small>${WRAITH_INFO[k].act}</small>`; b.onclick = () => { S.key = k; S.move = null; show(); }; $('who').append(b); }
$('b-detail').onclick = () => { S.detail = S.detail === 'high' ? 'light' : 'high'; $('b-detail').textContent = S.detail === 'high' ? 'High detail' : 'Light (the fight)'; show(); };
$('b-sculpt').onclick = () => { S.sculpt = !S.sculpt; if (S.sculpt) { S.crowd = false; S.detail = 'high'; $('b-detail').textContent = 'High detail'; $('b-crowd').setAttribute('aria-pressed', false); } $('b-sculpt').setAttribute('aria-pressed', S.sculpt); show(); };
$('b-crowd').onclick = () => { S.crowd = !S.crowd; if (S.crowd) { S.sculpt = false; $('b-sculpt').setAttribute('aria-pressed', false); } $('b-crowd').setAttribute('aria-pressed', S.crowd); show(); };
$('b-turn').onclick = () => { S.turn = !S.turn; $('b-turn').setAttribute('aria-pressed', S.turn); controls.autoRotate = S.turn && !S.crowd; };

function resize() { const r = canvas.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas); resize();
const clock = new THREE.Clock(); let fpsN = 0, fpsT = 0, step = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (S.walk) step += dt * 5;
  for (const f of figs) {
    const tt = t + (f.ph || 0);
    if (S.move) { const d = f.duration(S.move); f.pose(S.move, Math.min(1, S.mt / d), tt, 0); }
    else f.update(tt, S.walk ? step : 0);
  }
  if (S.move) { S.mt += dt; if (S.mt > figs[0].duration(S.move) + 0.4) S.move = null; }
  controls.update(); composer.render();
  fpsN++; fpsT += dt;
  if (fpsT > 1) { const f = figs[0], i = renderer.info.render; $('stats').textContent = `${Math.round(fpsN / fpsT)} fps · ${S.crowd ? '12 at the fight\'s detail' : (f.sculpt ? 'the sculpt' : S.detail === 'high' ? 'high detail' : 'light (the fight)')} · ${Math.round((f.sculpt ? f.sculpt.triangles : f.triangles * figs.length) / 1000)}k triangles · ${f.draws * figs.length} pieces · built in ${S.ms} ms`; fpsN = 0; fpsT = 0; }
  requestAnimationFrame(loop);
}
window.__w = { S, show, get figs() { return figs; }, renderer, camera, controls, scene };
show().then(loop);
