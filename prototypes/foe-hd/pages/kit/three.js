// A foe three ways (the foe kit, from Briarmaw, November 20): the code-built model (Models' buildBeast), the painted
// cut-out of Chris's sheet (Models' standee) and the full-detail light model baked from the sculpt, side by side on
// turning stands under the same light; its moves; a crowd test (six of it with the four heroes) with the frame rate.
// Built by: node build.mjs --foe=<key> --page=three
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FOE_ART, renderFoe } from '../../../../game/src/art/foes.js';
import { HERO_ART } from '../../../../game/src/art/hero-looks.js';
import { SLOTS } from '../../../../game/src/art/item-looks.js';
import { buildHero, setPose } from '../../../hero-3d/model.js';
import { Q } from '../../../hero-3d/kit.js';
import { buildBeast, BEASTS } from '../../../bestiary/beasts.js';
import { buildStandee } from '../../../bestiary/standee.js';
import { STANDEES } from '../../../bestiary/standees/pack.js';
import { ready, makeShared, makeFoe, cloneFoe } from '../../kit/js/loader.js';
import { PLANS } from '../../kit/js/looks.js';
import { A } from './assets.js';
const KEY = A.lightMeta.key, MV = PLANS[A.lightMeta.moves] || PLANS[A.lightMeta.plan] || PLANS.quad;   // its own named set first (Briarmaw's bear)
// the stands and the camera scale with the foe (Briarmaw, 1.7 m, is 1); small ones not below 0.45
const SZ = Math.max(0.3, Math.min(1.6, (A.lightMeta.height || 1.7) / 1.7));

const $ = (id) => document.getElementById(id);
const phone = Math.min(screen.width, screen.height) < 820 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
const S = { res: Math.max(...Object.keys(A.tex).map(Number)), turn: true, move: 'idle', moveT: 0, crowd: false, sculpt: false };

// ---- the stage ---------------------------------------------------------------------------------------------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1512); scene.fog = new THREE.Fog(0x1a1512, 14, 30);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.52;
scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x3a2a1a, 0.9));
const key = new THREE.DirectionalLight(0xffe2bc, 2.8); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, far: 30 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.6); rim.position.set(-5, 3, -5); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(18, 72), new THREE.MeshStandardMaterial({ color: 0x3a3024, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

function stand(x) {
  const g = new THREE.Group(); g.position.x = x;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.45 * SZ, 1.55 * SZ, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.9 }));
  disc.position.y = 0.04; disc.receiveShadow = true; g.add(disc);
  const top = new THREE.Group(); top.position.y = 0.08; g.add(top);
  scene.add(g); return { g, top };
}
const SPACING = 3.3 * SZ;
const stands = [stand(-SPACING), stand(0), stand(SPACING)];
const triCount = (o) => { let n = 0; o.traverse((m) => { if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); return Math.round(n); };

// 1. the code-built model (prototypes/bestiary, buildBeast), coloured from his own pixel sprite
Q.d = 2;
const sprite = renderFoe(KEY, { tier: FOE_ART[KEY].defaultTier, gearTier: 0, t: 0.2 });
const code = buildBeast(KEY, sprite);
code.group.rotation.y = 0; stands[0].top.add(code.group);
code.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

// 2. the painted cut-out (Models' standee, prototypes/bestiary/standee.js): Chris's sheet, the view facing the camera
const cut = STANDEES[KEY] ? buildStandee(KEY, { tall: BEASTS[KEY][2] }) : { group: new THREE.Group(), update() {} };
stands[1].top.add(cut.group);

// 3. the full-detail light version
let shared, hd;
const hdNote = { tris: 0 };

// ---- the crowd ---------------------------------------------------------------------------------------------------
const crowd = { group: new THREE.Group(), foes: [], heroes: [] };
scene.add(crowd.group); crowd.group.visible = false;
const HEROES = [['warden', 'Wren'], ['pip', 'Pip'], ['bryn', 'Bryn'], ['alondra', 'Alondra']];
function starterKit(id) { const st = HERO_ART[id].starter, g = {}; for (const s of SLOTS) g[s] = st[s] ? { ...st[s], starter: true } : null; return g; }
function buildCrowd() {
  if (crowd.foes.length) return;
  for (let i = 0; i < 6; i++) {
    const c = cloneFoe(hd, MV); const a = (i / 6) * Math.PI * 2;
    c.ring = { a, r: (5.2 + (i % 2) * 1.1) * Math.max(0.6, SZ), speed: 0.11 + 0.02 * (i % 3) };
    crowd.group.add(c.group); crowd.foes.push(c);
  }
  HEROES.forEach(([id], i) => {
    const h = buildHero(id, starterKit(id), {}); const r = new THREE.Group(); r.add(h.group); h.group.scale.setScalar(1.72 / 1.22);
    h.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    r.position.set((i - 1.5) * 1.1, 0, (i % 2) * 0.6 - 0.3); r.rotation.y = (i - 1.5) * 0.25;
    crowd.group.add(r); crowd.heroes.push(h);
  });
}

// ---- the panel ---------------------------------------------------------------------------------------------------
const MOVES = MV.MOVES, DUR = MV.DUR;
function buttons() {
  const m = $('moves'); m.innerHTML = '';
  for (const [k, label] of MOVES) {
    const b = document.createElement('button'); b.textContent = label; b.dataset.k = k;
    b.onclick = () => { S.move = k; S.moveT = 0; refresh(); }; m.appendChild(b);
  }
}
function refresh() {
  for (const b of document.querySelectorAll('#moves button')) b.setAttribute('aria-pressed', b.dataset.k === S.move);
  $('turn').setAttribute('aria-pressed', S.turn); $('crowd').setAttribute('aria-pressed', S.crowd);
  $('stands').hidden = S.crowd; $('crowdnote').hidden = !S.crowd;
}
$('turn').onclick = () => { S.turn = !S.turn; refresh(); };
$('crowd').onclick = () => {
  S.crowd = !S.crowd;
  if (S.crowd) buildCrowd();
  crowd.group.visible = S.crowd; for (const s of stands) s.g.visible = !S.crowd;
  frame(); refresh();
};

function frame() {
  const w = canvas.clientWidth, h = canvas.clientHeight; const ar = w / h;
  camera.aspect = ar; camera.updateProjectionMatrix();
  if (S.crowd) { const k = Math.max(0.6, SZ); controls.target.set(0, 0.9, 0); const d = (ar < 1 ? 19 : 14) * k; camera.position.set(0, d * 0.5, d); }
  else {
    // all three stands in view: further back on a narrow (phone) screen
    const need = (SPACING * 2 + 3.4 * SZ) / 2, fov = camera.fov * Math.PI / 180;
    let dist = Math.max(need / (Math.tan(fov / 2) * ar), 1.3 * SZ / Math.tan(fov / 2)) * 1.04;
    let cx = 0;
    if (ar < 1 && A.phoneClose) {   // a wide foe on a phone (foe.json "phoneClose"): the painted one and the full-detail one only, closer
      cx = SPACING / 2; dist = Math.max((SPACING + 3.4 * SZ) / 2 / (Math.tan(fov / 2) * ar) * 1.04, 1.3 * SZ / Math.tan(fov / 2));
    }
    controls.target.set(cx, 0.8 * SZ, 0); camera.position.set(cx, (1.2 + dist * 0.16) * Math.sqrt(SZ), dist);
  }
  controls.update();
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); frame();
}
addEventListener('resize', resize);

// ---- the loop ----------------------------------------------------------------------------------------------------
const clock = new THREE.Clock(); let t = 0, step = 0, fpsN = 0, fpsT = 0;
function loop() {
  const d = Math.min(0.05, clock.getDelta()); t += d;
  // the stands turn together, so all three are seen from the same side at once
  const yaw = S.turn ? t * 0.45 : stands[0].top.rotation.y;
  for (const s of stands) s.top.rotation.y = yaw;
  // moves
  if (hd) {
    let u = 0; if (DUR[S.move]) { S.moveT += d; u = Math.min(1, S.moveT / DUR[S.move]); if (S.moveT > DUR[S.move] + 0.8) S.moveT = 0; }
    if (S.move === 'walk') step += d * 4.2;
    hd.pose(S.move, u, t, step);
    code.update(t, S.move === 'walk' ? step * 2 : 0);
    cut.update(t, S.move === 'walk' ? step * 2 : 0);
    if (S.crowd) {
      for (const c of crowd.foes) {
        c.ring.a += d * c.ring.speed;
        c.group.position.set(Math.cos(c.ring.a) * c.ring.r, 0, Math.sin(c.ring.a) * c.ring.r);
        c.group.rotation.y = -c.ring.a;     // walking round, nose ahead
        c.pose('walk', 0, t + c.ring.a * 3, t * 4.2 + c.ring.a * 5);
      }
      crowd.heroes.forEach((h, i) => setPose(h.rig, 'idle', t + i, 0));
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
  buttons();
  await ready();
  shared = makeShared(A, S.res);
  hd = makeFoe(shared, MV);
  stands[2].top.add(hd.group);
  hdNote.tris = hd.triangles;
  $('codetris').textContent = `${triCount(code.group).toLocaleString()} triangles`;
  $('cuttris').textContent = `${triCount(cut.group).toLocaleString()} triangles (flat cards)`;
  $('hdtris').textContent = `${hdNote.tris.toLocaleString()} triangles`;
  $('sculptfrom').textContent = `${A.lightMeta.sculptTriangles.toLocaleString()}`;
  for (const e of document.querySelectorAll('[data-name]')) e.textContent = A.name;
  $('lighttris').textContent = hd.triangles.toLocaleString(); $('bonecount').textContent = A.lightMeta.bones.length;
  if (A.blurb) $('blurb').textContent = A.blurb; else $('blurb').hidden = true;
  if (A.next) $('next').innerHTML = '<b>Still to come:</b> ' + A.next.replace(/</g, '&lt;'); else $('next').hidden = true;
  if (A.sculptUrl) $('sculptlink').href = A.sculptUrl; else $('sculptlink').hidden = true;
  document.title = `${A.name} Three Ways`;
  refresh(); resize();
  if (new URLSearchParams(location.search).has('crowd')) $('crowd').onclick();
  window.__ready = true;
  loop();
})();
