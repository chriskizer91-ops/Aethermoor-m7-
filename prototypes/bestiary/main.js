// The Bestiary: every foe of Hearth & Heirloom in 3D (November 20). The people (bandits, cultists, the Hollow Council...)
// are built by the heroes' own builder from the same looks the game's sprites wear (art/foes.js foeLooks); the beasts
// by beasts.js, coloured from their own sprites. The game's own sprite stands beside each, to compare.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FOE_ART, renderFoe, foeLooks } from '../../game/src/art/foes.js';
import { buildHero, setPose } from '../hero-3d/model.js';
import { buildPerson, PEOPLE, personLook } from '../hero-3d/people.js';
import { npcSheet } from '../../game/src/art/map-sprites.js';
import { Q, TEXTURES } from '../hero-3d/kit.js';
window.__T = TEXTURES;
import { buildBeast, BEASTS } from './beasts.js';
import { buildStandee, hasStandee } from './standee.js';

Q.d = 2;
const TIER = { rabble: 'Rabble', veteran: 'Veterans', 'relic-bearer': 'Relic-Bearers', champion: 'Champions', hollow: 'The Hollow Council', unsmith: 'The Unsmith' };
const keys = Object.keys(FOE_ART);
// painted: the beasts as standees cut from Chris's sheets (true) or built in 3D (false), for Chris to compare
const S = { key: 'briarmaw', gearTier: 0, walk: false, filter: 'all', painted: true, lunge: -1, fall: -1 };
const $ = id => document.getElementById(id);

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x100c0a); scene.fog = new THREE.Fog(0x100c0a, 8, 20);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.2; controls.maxPolarAngle = Math.PI * 0.55;
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
scene.add(new THREE.HemisphereLight(0x8a9cc8, 0x2a1a10, 0.6));
const key = new THREE.DirectionalLight(0xffd6a8, 2.6); key.position.set(2, 4, 3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); key.shadow.bias = -0.0004; scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb4ff, 2); rim.position.set(-3, 2.5, -3); scene.add(rim);
const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.16, 64), new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.4 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.003; scene.add(ring);

let cur = null;
function show(k) {
  S.key = k;
  if (cur) { scene.remove(cur.group); cur.group.traverse(o => o.geometry?.dispose?.()); }
  if (S.filter === 'town' || k.startsWith('npc:')) return showPerson(k.replace(/^npc:/, ''));
  const def = FOE_ART[k], t0 = performance.now();
  const sprite = renderFoe(k, { tier: def.defaultTier, gearTier: S.gearTier, t: 0.2 });
  if (def.kind === 'humanoid') {
    const { H, gear } = foeLooks(k, { gearTier: S.gearTier });
    const h = buildHero('warden', {}, { H, looks: gear });
    cur = { group: h.group, height: 1.22, update: (t, step) => setPose(h.rig, step ? 'walk' : 'idle', t, step), hero: h };
    h.group.scale.setScalar(1.7 / 1.22); cur.height = 1.75;
  } else if (S.painted && hasStandee(k)) cur = buildStandee(k, { tall: BEASTS[k]?.[2] || 1 });
  else cur = buildBeast(k, sprite);
  S.lunge = S.fall = -1;
  scene.add(cur.group);
  let tris = 0; cur.group.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  // frame it: the camera stands back far enough for the creature's height and length
  const box = new THREE.Box3().setFromObject(cur.group), size = box.getSize(new THREE.Vector3()), r = Math.max(size.y, size.x, size.z) * 0.62 + 0.2;
  controls.target.set(0, size.y * 0.48, 0); camera.position.set(r * 1.1, size.y * 0.7 + r * 0.35, r * 2.5); controls.minDistance = r * 0.6; controls.maxDistance = r * 6;
  ring.scale.setScalar(Math.max(0.6, Math.max(size.x, size.z) * 0.7));
  key.shadow.camera.left = key.shadow.camera.bottom = -Math.max(3, r * 2); key.shadow.camera.right = key.shadow.camera.top = Math.max(3, r * 2); key.shadow.camera.updateProjectionMatrix();
  // the panel
  const c = $('sprite'); c.width = sprite.width; c.height = sprite.height; c.getContext('2d').putImageData(sprite, 0, 0);
  $('name').textContent = def.name || k;
  $('what').textContent = `${TIER[def.defaultTier] || def.defaultTier} · ${def.kind === 'humanoid' ? 'a person, dressed by the gear builder' : cur.standee ? 'painted, from Chris\'s sheet' : cur.sculpted ? 'built in 3D to Chris\'s sheet' : 'built in 3D (first pass)'} · ${Math.round(cur.height * 10) / 10} m tall`;
  $('nums').textContent = `${Math.round(tris / 1000)}k triangles · built in ${Math.round(performance.now() - t0)} ms`;
  for (const b of document.querySelectorAll('.foe')) b.setAttribute('aria-pressed', b.dataset.k === k);
  $('gear').hidden = def.kind !== 'humanoid'; $('talk').hidden = true;
  for (const id of ['a-lunge', 'a-hit', 'a-fall']) $(id).hidden = !cur.standee;
  $('m-painted').parentElement.hidden = def.kind === 'humanoid';
}

// the townsfolk (for Together): made by the heroes' builder from their map sprites' looks (people.js), standing about;
// Talk makes them talk with their hands
function npcCanvas(id) { const sh = npcSheet(personLook(id).art), c = document.createElement('canvas'); c.width = 16; c.height = 24; const tmp = document.createElement('canvas'); tmp.width = sh.img.width; tmp.height = sh.img.height; tmp.getContext('2d').putImageData(sh.img, 0, 0); c.getContext('2d').drawImage(tmp, 0, 0, 16, 24, 0, 0, 16, 24); return c; }
function showPerson(id) {
  S.key = 'npc:' + id;
  if (cur) { scene.remove(cur.group); cur.group.traverse(o => o.geometry?.dispose?.()); }
  const t0 = performance.now(), h = buildPerson(id);
  cur = { group: h.group, height: 1.75, update: (t, step) => setPose(h.rig, step ? 'walk' : S.talk ? 'talk' : 'stand', t, step), hero: h };
  h.group.scale.setScalar(1.7 / 1.22); scene.add(cur.group);
  let tris = 0; cur.group.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  controls.target.set(0, 0.9, 0); camera.position.set(1.0, 1.5, 3.4); ring.scale.setScalar(0.6);
  const c = $('sprite'), src = npcCanvas(id); c.width = 16; c.height = 24; c.getContext('2d').drawImage(src, 0, 0);
  $('name').textContent = h.name; $('what').textContent = `${h.role ? h.role + ' · ' : ''}one of the townsfolk, dressed by the gear builder from their map sprite`;
  $('nums').textContent = `${Math.round(tris / 1000)}k triangles · built in ${Math.round(performance.now() - t0)} ms`;
  for (const b of document.querySelectorAll('.foe')) b.setAttribute('aria-pressed', b.dataset.k === S.key);
  $('gear').hidden = true; for (const id2 of ['a-lunge', 'a-hit', 'a-fall']) $(id2).hidden = true; $('m-painted').parentElement.hidden = true; $('talk').hidden = false;
}

// the list, by tier
const list = $('list');
function drawList() {
  list.innerHTML = '';
  if (S.filter === 'town') {
    const h = document.createElement('h3'); h.textContent = `The townsfolk (${PEOPLE.length})`; list.append(h);
    const row = document.createElement('div'); row.className = 'row'; list.append(row);
    for (const id of PEOPLE) { const b = document.createElement('button'); b.className = 'foe'; b.dataset.k = 'npc:' + id; b.append(npcCanvas(id)); const s2 = document.createElement('span'); s2.textContent = personLook(id).name; b.append(s2); b.onclick = () => showPerson(id); row.append(b); }
    return;
  }
  for (const [t, label] of Object.entries(TIER)) {
    const ks = keys.filter(k => (FOE_ART[k].defaultTier || 'rabble') === t && (S.filter === 'all' || (S.filter === 'beasts') === (FOE_ART[k].kind !== 'humanoid')));
    if (!ks.length) continue;
    const h = document.createElement('h3'); h.textContent = `${label} (${ks.length})`; list.append(h);
    const row = document.createElement('div'); row.className = 'row'; list.append(row);
    for (const k of ks) {
      const b = document.createElement('button'); b.className = 'foe'; b.dataset.k = k;
      const im = renderFoe(k, { tier: FOE_ART[k].defaultTier, t: 0.2 }), c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').putImageData(im, 0, 0);
      b.append(c); const s = document.createElement('span'); s.textContent = FOE_ART[k].name || k; b.append(s);
      b.onclick = () => show(k); row.append(b);
    }
  }
}
for (const f of ['all', 'beasts', 'people', 'town']) $('f-' + f).onclick = () => { S.filter = f; for (const g of ['all', 'beasts', 'people', 'town']) $('f-' + g).setAttribute('aria-pressed', g === f); drawList(); if (f === 'town') showPerson(PEOPLE[0]); };
$('talk').onclick = () => { S.talk = !S.talk; $('talk').setAttribute('aria-pressed', S.talk); };
const setMode = p => { S.painted = p; $('m-painted').setAttribute('aria-pressed', p); $('m-3d').setAttribute('aria-pressed', !p); show(S.key); };
$('m-painted').onclick = () => setMode(true); $('m-3d').onclick = () => setMode(false);
$('a-lunge').onclick = () => { S.lunge = 0; }; $('a-fall').onclick = () => { S.fall = 0; }; $('a-hit').onclick = () => cur?.hit?.();
$('walk').onclick = () => { S.walk = !S.walk; $('walk').setAttribute('aria-pressed', S.walk); };
$('gear').onclick = () => { S.gearTier = (S.gearTier + 1) % 4; $('gear').textContent = 'The Waking: ' + S.gearTier; show(S.key); };

function resize() { const r = canvas.parentElement.getBoundingClientRect(); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas.parentElement);
const clock = new THREE.Clock(); let step = 0;
(function loop() { requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; if (S.walk) step += dt * 7;
  if (cur?.act) { if (S.lunge >= 0) { S.lunge += dt / 0.7; if (S.lunge >= 1) S.lunge = -1; } if (S.fall >= 0) { S.fall += dt / 1.1; if (S.fall >= 2.2) S.fall = -1; } cur.act.lunge = Math.max(0, S.lunge); cur.act.fall = S.fall < 0 ? 0 : Math.min(1, S.fall); }
  if (cur) cur.update(t, S.walk ? step : 0); controls.update(); renderer.render(scene, camera); })();
window.__best = { show, keys, S, controls, camera, get cur() { return cur; } };
drawList(); show('briarmaw'); resize();
$('loading').hidden = true;
