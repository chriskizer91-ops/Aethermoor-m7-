// The sculpt viewer (the foe kit, November 20): a foe's full-detail sculpt (its asset foes/<key>/assets/<key>-sculpt.glb)
// beside the light model baked from it, on turning stands under the same light. For a laptop.
// Built by: node build.mjs --foe=<key> --page=sculpt
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ready, makeShared, makeFoe } from './loader.js';
import { PLANS } from './looks.js';
import { A } from './assets.js';

const $ = (id) => document.getElementById(id);
const S = { turn: true, wire: false, only: 'both' };
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1512);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.55;
scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x3a2a1a, 0.9));
const key = new THREE.DirectionalLight(0xffe2bc, 2.8); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, far: 30 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.6); rim.position.set(-5, 3, -5); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const SZ = Math.max(0.3, Math.min(1.6, (A.lightMeta.height || 1.7) / 1.7));   // Briarmaw (1.7 m) is 1
const X = 1.75 * SZ;
function stand(x) {
  const g = new THREE.Group(); g.position.x = x;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * SZ, 1.6 * SZ, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.9 }));
  disc.position.y = 0.04; disc.receiveShadow = true; g.add(disc);
  const top = new THREE.Group(); top.position.y = 0.08; g.add(top); scene.add(g); return { g, top };
}
const L = stand(-X), R = stand(X);
let sculpt, light;
function frame() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const both = S.only === 'both', fov = camera.fov * Math.PI / 180;
  const halfW = (both ? X + 1.7 * SZ : 1.7 * SZ), dist = Math.max(halfW / (Math.tan(fov / 2) * camera.aspect), 1.2 * SZ / Math.tan(fov / 2)) * 1.05;
  const cx = S.only === 'sculpt' ? -X : S.only === 'light' ? X : 0;
  controls.target.set(cx, 0.8 * SZ, 0); camera.position.set(cx, (1.3 + dist * 0.15) * Math.sqrt(SZ), dist); controls.update();
}
addEventListener('resize', frame);
function refresh() {
  $('turn').setAttribute('aria-pressed', S.turn); $('wire').setAttribute('aria-pressed', S.wire);
  for (const b of document.querySelectorAll('[data-only]')) b.setAttribute('aria-pressed', b.dataset.only === S.only);
}
$('turn').onclick = () => { S.turn = !S.turn; refresh(); };
$('wire').onclick = () => { S.wire = !S.wire; sculpt.material.wireframe = S.wire; light.mesh.material.wireframe = S.wire; refresh(); };
for (const b of document.querySelectorAll('[data-only]')) b.onclick = () => { S.only = b.dataset.only; L.g.visible = S.only !== 'light'; R.g.visible = S.only !== 'sculpt'; frame(); refresh(); };
const clock = new THREE.Clock(); let t = 0, n = 0, ft = 0;
function loop() {
  const d = Math.min(0.05, clock.getDelta()); t += d;
  const yaw = S.turn ? t * 0.4 : L.top.rotation.y; L.top.rotation.y = R.top.rotation.y = yaw;
  light.pose('idle', 0, 0, 0);
  controls.update(); renderer.render(scene, camera);
  n++; ft += d; if (ft > 0.5) { $('fps').textContent = `${(n / ft).toFixed(0)} frames a second · ${renderer.info.render.triangles.toLocaleString()} triangles drawn`; n = 0; ft = 0; }
  requestAnimationFrame(loop);
}
(async () => {
  await MeshoptDecoder.ready; await ready();
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const buf = A.sculptGlb.buffer.slice(A.sculptGlb.byteOffset, A.sculptGlb.byteOffset + A.sculptGlb.byteLength);
  const gltf = await loader.parseAsync(buf, '');
  gltf.scene.traverse((o) => { if (o.isMesh) { sculpt = o; o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }); o.castShadow = o.receiveShadow = true; } });
  L.top.add(gltf.scene);
  light = makeFoe(makeShared(A, Number(Object.keys(A.tex).sort((a, b) => b - a)[0])), PLANS[A.lightMeta.plan] || PLANS.quad); R.top.add(light.group);
  for (const e of document.querySelectorAll('[data-name]')) e.textContent = A.name;
  document.title = `${A.name} Sculpt`;
  const tri = sculpt.geometry.index.count / 3;
  $('stris').textContent = `${Math.round(tri).toLocaleString()} triangles`;
  $('ltris').textContent = `${light.triangles.toLocaleString()} triangles`;
  refresh(); frame(); window.__ready = true; loop();
})();
