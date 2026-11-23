// The walkers' sculpts themselves, for a laptop (session 8): each full-detail sculpt (500,000 to 1,000,000 triangles)
// that the light models are baked from, on a turning stand, with Chris's sheet beside it. decodeSculpt below is copied
// from session 6's (it moved from prototypes/foe-hd/page/briarmaw.js to pages/beasts/kit/foe.js), unchanged.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ready } from './walker.js';
import { FOES } from './foes.js';
import { SCULPTS } from './assets.js';

// the sculpt itself (export_sculpt.py + pack.mjs), as a plain coloured mesh
function decodeSculpt(meta, bin) {
  const n = meta.vertices;
  const vb = new Uint8Array(n * 12);
  MeshoptDecoder.decodeVertexBuffer(vb, n, 12, bin.subarray(0, meta.vbytes));
  const ib = new Uint32Array(meta.indices);
  MeshoptDecoder.decodeIndexBuffer(new Uint8Array(ib.buffer), meta.indices, 4, bin.subarray(meta.vbytes, meta.vbytes + meta.ibytes));
  const dv = new DataView(vb.buffer), pos = new Float32Array(n * 3), col = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < 3; a++) pos[i * 3 + a] = meta.lo[a] + dv.getUint16(i * 12 + a * 2, true) / 65535 * (meta.hi[a] - meta.lo[a]);
    for (let a = 0; a < 3; a++) col[i * 3 + a] = vb[i * 12 + 8 + a];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setIndex(new THREE.BufferAttribute(ib, 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

const $ = (id) => document.getElementById(id);
const KEYS = Object.keys(SCULPTS);
const S = { key: KEYS[0], turn: true };
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x15130f);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.4;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas); controls.enablePan = true; controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xc4d4ff, 0x3a2a1a, 0.8));
const key = new THREE.DirectionalLight(0xffe2bc, 2.8); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); key.shadow.normalBias = 0.02;
scene.add(key); const rim = new THREE.DirectionalLight(0x9fc0ff, 1.4); rim.position.set(-5, 3, -5); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x34302a, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const top = new THREE.Group(); scene.add(top);
const made = {};
function show(k) {
  S.key = k; top.clear();
  if (!made[k]) {
    const g = decodeSculpt(SCULPTS[k].meta, SCULPTS[k].bin);
    // the stored colours are sRGB bytes; three.js wants linear vertex colours
    const c = g.attributes.color, lin = new Float32Array(c.count * 3);
    for (let i = 0; i < c.count * 3; i++) lin[i] = Math.pow(c.array[i] / 255, 2.2);
    g.setAttribute('color', new THREE.BufferAttribute(lin, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.08 }));
    m.castShadow = m.receiveShadow = true; made[k] = m;
  }
  top.add(made[k]);
  const f = FOES[k]; $('name').textContent = f.name;
  $('tris').textContent = SCULPTS[k].meta.triangles.toLocaleString();
  $('sheet').src = SCULPTS[k].sheet;
  for (const b of document.querySelectorAll('#foes button')) b.setAttribute('aria-pressed', b.dataset.k === k);
  const H = f.height; controls.target.set(0, H * 0.5, 0); camera.position.set(0, H * 0.6, H * 2.4); controls.update();
}
const bar = $('foes');
for (const k of KEYS) { const b = document.createElement('button'); b.textContent = FOES[k].name; b.dataset.k = k; b.onclick = () => show(k); bar.appendChild(b); }
$('turn').onclick = () => { S.turn = !S.turn; $('turn').setAttribute('aria-pressed', S.turn); };
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
const clock = new THREE.Clock(); let n = 0, acc = 0;
function loop() {
  const d = clock.getDelta(); if (S.turn) top.rotation.y += d * 0.35;
  controls.update(); renderer.render(scene, camera);
  n++; acc += d; if (acc > 0.5) { $('fps').textContent = `${(n / acc).toFixed(0)} frames a second`; n = 0; acc = 0; }
  requestAnimationFrame(loop);
}
(async () => { await ready(); resize(); show(new URLSearchParams(location.search).get('foe') || S.key); $('turn').setAttribute('aria-pressed', true); window.__ready = true; loop(); })();
