// The Gear Room: a hero in 3D whose outfit is built by the game's own gear code. Roll an item for any slot (the
// same generator the game's loot uses), put on a named relic, temper the weapon at Hilda's, and watch the model and
// the game's own pixel sprite change together.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

import { HERO_ART, renderHero } from '../../game/src/art/hero-looks.js';
import { itemIcon, itemPortrait, RARITY_LOOK, RARITY_ORDER, SLOTS, ASPECT_LOOK } from '../../game/src/art/item-looks.js';
import { MAT } from '../../game/src/art/forge.js';
import { generateItem, relicItem } from '../../game/src/rules/loot.js';
import { RELICS } from '../../game/src/data/relics.js';
import { createRng } from '../../game/src/core/rng.js';
import { buildHero, setPose, glowColor, SWING_ON, SCULPT } from './model.js';
import { MACRO_ON, MASTER_ON, ADD_LOG } from './kit.js';
import { loadHeights, sculptify, unsculpt } from './masters/sculpt-view.js';
import { ready as foeReady, makeShared, makeFoe } from '../foe-hd/kit/js/loader.js';
import * as QUAD from '../foe-hd/kit/js/moves/quad.js';
import bmMeta from '../foe-hd/foes/briarmaw/assets/light.json';
import bmBin from '../foe-hd/foes/briarmaw/assets/light.bin';
import bmColor from '../foe-hd/foes/briarmaw/assets/color-1024.webp';
import bmNormal from '../foe-hd/foes/briarmaw/assets/normal-1024.webp';
import bmAo from '../foe-hd/foes/briarmaw/assets/ao-1024.webp';
import bmEmit from '../foe-hd/foes/briarmaw/assets/emit-256.webp';
import { Q, TEXTURES } from './kit.js';
import { auditList, gearFor, checkBuilt, HERO_NAMES } from './audit.js';
import { FOE_ART, foeLooks, renderFoe } from '../../game/src/art/foes.js';
import { buildPerson, PEOPLE, personLook } from './people.js';
import { npcSheet } from '../../game/src/art/map-sprites.js';

const HEROES = [{ id: 'warden', name: 'Wren' }, { id: 'pip', name: 'Pip' }, { id: 'bryn', name: 'Bryn' }, { id: 'alondra', name: 'Alondra' }];
const SLOT_NAME = { weapon: 'Weapon', offhand: 'Off hand', head: 'Head', body: 'Body', hands: 'Hands', feet: 'Feet', amulet: 'Amulet', ring: 'Ring' };
const rng = createRng(`gear-room:${Date.now() % 100000}`);
const relicsFor = slot => Object.values(RELICS).filter(r => r.slot === slot).sort((a, b) => a.codex - b.codex);

const coarse = matchMedia('(pointer: coarse)').matches;
// the detail levels: High (laptops), Light (phones), Lite (phones, each hero one mesh: the walkers far off)
const QD = { high: 2, light: 1, lite: 0.6 };
const S = { hero: 'warden', gear: {}, slot: 'weapon', rarity: 'any', relicAt: {}, pixel: false, strike: -1, build: 'hero', detail: 'high', pxSize: 5, look: 'whole', goal: null, gears: {}, party: false };
Q.d = QD[S.detail];

/* ------------------------------------------------------------------ scene */
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120e0c);
scene.fog = new THREE.Fog(0x120e0c, 6, 14);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
camera.position.set(0.9, 1.0, 3.1);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.66, 0);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 0.3; controls.maxDistance = 5; controls.maxPolarAngle = Math.PI * 0.55; controls.minPolarAngle = Math.PI * 0.18;
controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; clearTimeout(S.spin); });
canvas.addEventListener('pointerup', () => { clearTimeout(S.spin); S.spin = setTimeout(() => { controls.autoRotate = true; }, 5000); });

// light: the forge-fire key, a cool rim from behind, and the room
scene.add(new THREE.HemisphereLight(0x8a9cc8, 0x2a1a10, 0.55));
const key = new THREE.DirectionalLight(0xffc890, 2.6);
key.position.set(1.6, 2.6, 2.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -1.2; key.shadow.camera.right = key.shadow.camera.top = 1.2; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb4ff, 2.2); rim.position.set(-1.8, 1.8, -2.2); scene.add(rim);
const fill = new THREE.PointLight(0xff8a3a, 1.2, 6, 1.5); fill.position.set(-1.5, 0.5, 1.2); scene.add(fill);
const weaponLight = new THREE.PointLight(0xffffff, 0, 1.6, 1.6); scene.add(weaponLight);

// the plinth: a forge-stone with an iron ring, and a rune circle that takes the outfit's rarity colour
const stoneTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#5a4c40'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { const v = 60 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v + 30},${v + 18},${v},.35)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 2 + Math.random() * 4); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.18, 48), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }));
plinth.position.y = -0.09; plinth.receiveShadow = true; scene.add(plinth);
const ringIron = new THREE.Mesh(new THREE.TorusGeometry(0.645, 0.025, 8, 64), new THREE.MeshStandardMaterial({ color: 0x5a5f70, metalness: 0.9, roughness: 0.35 }));
ringIron.rotation.x = Math.PI / 2; ringIron.position.y = 0.0; scene.add(ringIron);
const runeCircle = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
runeCircle.rotation.x = -Math.PI / 2; runeCircle.position.y = 0.004; scene.add(runeCircle);
const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.18; floor.receiveShadow = true; scene.add(floor);

// motes: the weapon's aspect (rising embers, falling frost...), or a Primal outfit's white flame
const MOTES = 70;
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
moteGeo.setAttribute('seed', new THREE.BufferAttribute(Float32Array.from({ length: MOTES }, Math.random), 1));
const moteMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, color: { value: new THREE.Color(1, 0.6, 0.2) }, dir: { value: 1 }, px: { value: 1 }, on: { value: 0 } },
  vertexShader: `attribute float seed; uniform float time; uniform float dir; uniform float px; varying float vA;
    void main(){ float t = fract(seed*13.7 + time*(0.12+seed*0.1)); float y = dir > 0. ? t*1.6 : 1.6 - t*1.6;
      float a = seed*40.0 + time*0.6; float r = 0.32 + fract(seed*7.1)*0.3;
      vec3 p = vec3(cos(a)*r, y, sin(a)*r); vA = sin(t*3.1416);
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = px*(1.5+fract(seed*3.)*2.0)*4.0/-mv.z; }`,
  fragmentShader: 'uniform vec3 color; uniform float on; varying float vA; void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard; gl_FragColor=vec4(color*1.6, vA*on*(1.-d*2.)); }',
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const motes = new THREE.Points(moteGeo, moteMat); motes.frustumCulled = false; scene.add(motes);

// the swing's trail
const TRAIL = 24, trailPts = [];
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 2 * 3), 3));
const idx = []; for (let i = 0; i < TRAIL - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } trailGeo.setIndex(idx);
const trailMat = new THREE.MeshBasicMaterial({ color: 0xffd090, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const trail = new THREE.Mesh(trailGeo, trailMat); trail.frustumCulled = false; trail.visible = false; scene.add(trail);

// High: the picture is drawn with 4x smoothing on the edges and soft shadow in the creases (ambient occlusion)
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: S.detail === 'high' ? 4 : 0 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 2, 2);
gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.85;
gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.34, 0.45, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ the hero */
let hero = null;
function rebuild() {
  if (hero) { scene.remove(hero.group); hero.group.traverse(o => { o.geometry?.dispose?.(); }); }
  Q.d = QD[S.detail];
  const t0 = performance.now();
  hero = whoBuild() || buildHero(S.hero, S.gear, { build: S.build, lite: S.detail === 'lite' }); hero.face?.(S.face || 'neutral');
  S.lastBuild = Math.round(performance.now() - t0);
  hero.group.position.x = S.party ? SLOT_X[S.hero] : 0;
  runeCircle.position.x = hero.group.position.x;
  scene.add(hero.group);
  syncParty();
  S.tris = 0; S.meshes = 0;
  for (const h of [hero, ...Object.values(others)]) h.group.traverse(o => { if (o.isMesh) { S.meshes++; const g = o.geometry; S.tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  const fx = hero.fx;
  runeCircle.material.color.copy(fx.aura || new THREE.Color(0xffb04a));
  runeCircle.userData.on = fx.aura ? 0.75 : 0.18;
  const glow = hero.rig.weapon?.userData.glow || (fx.glows[0]?.color ?? null);
  weaponLight.color.copy(glow || new THREE.Color(1, 1, 1));
  weaponLight.userData.on = glow ? 1.6 : 0;
  if (fx.flame) { moteMat.uniforms.color.value.set(0xeef4ff); moteMat.uniforms.dir.value = 1; moteMat.uniforms.on.value = 1; }
  else if (fx.motes) { const asp = Object.values(ASPECT_LOOK).find(a => a.glow === fx.motes); moteMat.uniforms.color.value.copy(glowColor(fx.motes)); moteMat.uniforms.dir.value = asp?.mote === 'fall' ? -1 : 1; moteMat.uniforms.on.value = fx.best && RARITY_LOOK[fx.best].tier >= 3 ? 0.9 : 0.45; }
  else moteMat.uniforms.on.value = 0;
  trailMat.color.copy(glow || new THREE.Color(0xffe2b0));
  if (S.sculptView) showSculpt();
  drawPanel();
  if (S.look !== 'whole') lookAt(S.look === 'offhand' && !hero.rig.offhand ? 'whole' : S.look === 'weapon' && !hero.rig.weapon ? 'whole' : S.look);
}

/* ------------------------------------------------------------------ gear */
function starterKit(heroId) {
  const st = HERO_ART[heroId].starter, g = {};
  for (const s of SLOTS) g[s] = st[s] ? { ...st[s], name: null, starter: true } : null;
  // the Warden's starter heirloom
  if (heroId === 'warden') g.weapon = relicItem('hearthbrand', rng, { from: 'the Keep reliquary' });
  return g;
}
function rollFor(slot) {
  let rarity = S.rarity;
  if (rarity === 'any') { const r = rng.next(); rarity = r < 0.15 ? 'wrought' : r < 0.35 ? 'tempered' : r < 0.58 ? 'runed' : r < 0.78 ? 'storied' : r < 0.92 ? 'heirloom' : r < 0.97 ? 'regalia' : 'primal'; }
  const it = generateItem(rng, { slot, rarity, ilvl: 30 });
  delete it.unidentified;
  return it;
}
function nextRelic(slot) {
  const list = relicsFor(slot); if (!list.length) return null;
  const i = ((S.relicAt[slot] ?? -1) + 1) % list.length; S.relicAt[slot] = i;
  return relicItem(list[i].id, rng, { from: list[i].holder });
}
function setHero(id) { S.who = null; const ws = document.getElementById('who'); if (ws && ws.options.length) ws.value = 'hero:' + id; $('gearPanel').classList.remove('who'); S.hero = id; S.gear = S.gears[id] || (S.gears[id] = starterKit(id)); rebuild(); }
// the party: all four on the stage at once, each in their own gear; the panel dresses the chosen one
const SLOT_X = { warden: -0.38, pip: -1.14, bryn: 0.38, alondra: 1.14 };
const others = {};
function dropHero(h) { scene.remove(h.group); h.group.traverse(o => o.geometry?.dispose?.()); }
function syncParty() {
  for (const id of Object.keys(others)) if (!S.party || id === S.hero || others[id].detail !== S.detail + TEXTURES.on) { dropHero(others[id]); delete others[id]; }
  if (!S.party) return;
  for (const h of HEROES) {
    if (h.id === S.hero || others[h.id]) continue;
    const gear = S.gears[h.id] || (S.gears[h.id] = starterKit(h.id));
    const b = buildHero(h.id, gear, { build: S.build, lite: S.detail === 'lite' }); b.detail = S.detail + TEXTURES.on; b.group.position.x = SLOT_X[h.id]; b.phase = h.id.length * 1.7;
    scene.add(b.group); others[h.id] = b;
  }
}
function setParty(on) {
  S.party = on; $('b-party').setAttribute('aria-pressed', on); $('b-party').textContent = on ? 'Party ✓' : 'Party';
  plinth.scale.set(on ? 2.55 : 1, 1, on ? 1.25 : 1); ringIron.scale.set(on ? 2.55 : 1, on ? 1.25 : 1, 1);
  key.shadow.camera.left = key.shadow.camera.bottom = on ? -2 : -1.2; key.shadow.camera.right = key.shadow.camera.top = on ? 2 : 1.2; key.shadow.camera.updateProjectionMatrix();
  if (on) others.__keep = null, delete others.__keep;
  rebuild();
  S.goal = { c: new THREE.Vector3(on ? 0 : 0, 0.66, 0), dist: on ? 6.2 : 3.25 }; S.look = 'whole'; $('b-look').textContent = 'Look: whole';
}

/* ------------------------------------------------------------------ panel */
const $ = id => document.getElementById(id);
const pxCanvas = (img, scale) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); c.style.width = `${img.width * scale}px`; c.style.height = `${img.height * scale}px`; c.className = 'px'; return c; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nameOf = (slot, it) => !it ? 'Nothing' : it.name || (it.starter ? `Starter ${SLOT_NAME[slot].toLowerCase()}` : 'Unnamed');
const rarOf = it => (it && it.rarity) || (it?.starter ? 'worn' : null);
function drawPanel() {
  const list = $('slots'); list.innerHTML = '';
  for (const s of SLOTS) {
    const it = S.gear[s], r = rarOf(it), L = r ? RARITY_LOOK[r] : null;
    const b = document.createElement('button');
    b.className = 'slot' + (s === S.slot ? ' on' : ''); b.setAttribute('aria-pressed', s === S.slot);
    const ic = document.createElement('span'); ic.className = 'ic';
    const icon = it ? itemIcon(it, { size: 16 }) : null;
    if (icon) ic.append(pxCanvas(icon, 2));
    b.append(ic);
    const t = document.createElement('span'); t.className = 'tx';
    t.innerHTML = `<span class="sl">${SLOT_NAME[s]}</span><span class="nm" style="color:${L ? L.color : 'var(--ash)'}">${esc(nameOf(s, it))}${it?.temper ? ` +${it.temper}` : ''}</span>`;
    b.append(t);
    b.onclick = () => { S.slot = s; drawPanel(); };
    list.append(b);
  }
  // the chosen slot's card
  const it = S.gear[S.slot], r = rarOf(it), L = r ? RARITY_LOOK[r] : null;
  const card = $('card'); card.innerHTML = '';
  const pic = document.createElement('div'); pic.className = 'pic';
  const portrait = it ? itemPortrait(it, { size: 64, t: 0.3 }) : null;
  if (portrait) pic.append(pxCanvas(portrait, 1.5));
  card.append(pic);
  const info = document.createElement('div'); info.className = 'info';
  const relic = it?.base && RELICS[it.base];
  info.innerHTML = `<div class="sl">${SLOT_NAME[S.slot]}</div><div class="cn" style="color:${L ? L.color : 'var(--ash)'}">${esc(nameOf(S.slot, it))}${it?.temper ? ` +${it.temper}` : ''}</div>`
    + `<div class="cr">${L ? L.name : 'Empty'}${it?.aspect ? ` · ${it.aspect}` : ''}${relic ? ` · Codex No. ${relic.codex}` : ''}</div>`
    + (relic?.holder ? `<div class="ch">${esc(relic.holder)}</div>` : '');
  card.append(info);
  $('b-temper').disabled = !it || it.starter;
  $('b-temper').textContent = it?.temper >= 10 ? 'Temper: +10 (most)' : `Temper +1 at Hilda's`;
  $('b-relic').disabled = !relicsFor(S.slot).length;
  $('b-off').disabled = !it;
  for (const c of document.querySelectorAll('.hero')) c.setAttribute('aria-pressed', !S.who && c.dataset.id === S.hero);
  drawSprite(0);
}
// the game's own battle sprite, in the same gear
const spriteBox = $('sprite');
let spriteCanvas = null, spriteT = 0;
function drawSprite(t) {
  const img = S.who ? whoSprite(t) : renderHero(S.hero, S.gear, { pose: 'idle', t });
  if (!spriteCanvas) { spriteCanvas = document.createElement('canvas'); spriteCanvas.className = 'px'; spriteBox.append(spriteCanvas); }
  spriteCanvas.width = img.width; spriteCanvas.height = img.height;
  spriteCanvas.getContext('2d').putImageData(img, 0, 0);
}

const heroBar = $('heroes');
for (const h of HEROES) { const b = document.createElement('button'); b.className = 'hero'; b.dataset.id = h.id; b.textContent = h.name; b.onclick = () => setHero(h.id); heroBar.append(b); }
const rsel = $('rarity');
rsel.add(new Option('Any rarity', 'any'));
for (const r of RARITY_ORDER) rsel.add(new Option(RARITY_LOOK[r].name, r));
rsel.onchange = () => { S.rarity = rsel.value; };
$('b-roll').onclick = () => { S.gear[S.slot] = rollFor(S.slot); rebuild(); };
$('b-relic').onclick = () => { const it = nextRelic(S.slot); if (it) { S.gear[S.slot] = it; rebuild(); } };
$('b-temper').onclick = () => { const it = S.gear[S.slot]; if (!it || it.starter) return; S.gear[S.slot] = { ...it, temper: Math.min(10, (it.temper || 0) + 1) }; rebuild(); };
$('b-off').onclick = () => { S.gear[S.slot] = null; rebuild(); };
$('b-all').onclick = () => { for (const s of SLOTS) if (s !== 'offhand' || !['staff', 'bow', 'spear'].includes(S.gear.weapon?.kind)) S.gear[s] = rollFor(s); rebuild(); };
$('b-starter').onclick = () => { S.gears[S.hero] = starterKit(S.hero); setHero(S.hero); };
$('b-party').onclick = () => setParty(!S.party);
$('b-strike').onclick = () => { S.strike = 0; trailPts.length = 0; };
$('b-detail').onclick = () => { S.detail = S.detail === 'high' ? 'light' : S.detail === 'light' ? 'lite' : 'high'; applyDetail(); rebuild(); };
window.__party = () => setParty(true);
// Walk about: walk, run, stop (a dead stop, to watch things swing on and settle), back to the plinth
S.roam = null; S.roamT = 0; S.step = 0;
$('b-roam').onclick = () => { S.roam = S.roam === null ? 'walk' : S.roam === 'walk' ? 'run' : S.roam === 'run' ? 'stop' : null; $('b-roam').textContent = { walk: 'Walking', run: 'Running', stop: 'Stopped' }[S.roam] || 'Walk about'; $('b-roam').setAttribute('aria-pressed', !!S.roam);
  if (!S.roam) { hero.group.position.set(S.party ? SLOT_X[S.hero] : 0, 0, 0); hero.group.rotation.y = 0; } else { S.goal = { c: new THREE.Vector3(0, 0.6, 0), dist: 4.2 }; } };
// faces that live: step through the expressions (the party makes the same face)
const FACES_ = ['neutral', 'talk', 'cheer', 'effort', 'hurt', 'worried', 'asleep'], FACE_NAMES = { neutral: 'Face: calm', talk: 'Face: talking', cheer: 'Face: cheer', effort: 'Face: effort', hurt: 'Face: hurt', worried: 'Face: worried', asleep: 'Face: asleep' };
S.face = 'neutral';
$('b-face').onclick = () => { S.face = FACES_[(FACES_.indexOf(S.face) + 1) % FACES_.length]; $('b-face').textContent = FACE_NAMES[S.face]; for (const h of [hero, ...Object.values(others)]) h?.face?.(S.face); if (S.look === 'whole') lookAt('face'); };
// Chris's textures on or off (off: the surfaces generated in code, as before November 20), to compare
$('b-tex').onclick = () => { TEXTURES.on = !TEXTURES.on; $('b-tex').setAttribute('aria-pressed', TEXTURES.on); $('b-tex').textContent = TEXTURES.on ? 'Textures ✓' : 'Textures'; rebuild(); };
function applyDetail() {
  const high = S.detail === 'high';
  $('b-detail').textContent = high ? 'High detail' : S.detail === 'lite' ? 'Lite (1 mesh)' : 'Light detail';
  gtao.enabled = high;
  composer.renderTarget1.samples = composer.renderTarget2.samples = high ? 4 : 0;
  key.shadow.mapSize.set(high ? 4096 : 1024, high ? 4096 : 1024); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
  resize();
}
$('b-pixel').onclick = () => { S.pixel = !S.pixel; $('b-pixel').setAttribute('aria-pressed', S.pixel); $('pxrow').hidden = !S.pixel; resize(); };
// the pixel size: how many screen points each pixel of the picture covers
$('px').oninput = () => { S.pxSize = +$('px').value; $('pxval').textContent = `${S.pxSize}`; resize(); };
// Look closer: the whole hero, the face, the weapon, the shield or focus
const LOOKS = [['whole', 'Look: whole'], ['face', 'Look: face'], ['weapon', 'Look: weapon'], ['offhand', 'Look: off hand']];
function lookAt(which) {
  S.look = which; $('b-look').textContent = LOOKS.find(l => l[0] === which)[1];
  const obj = which === 'face' ? hero?.rig.head : which === 'weapon' ? hero?.rig.weapon : which === 'offhand' ? hero?.rig.offhand : null;
  if (!obj) { S.goal = { c: new THREE.Vector3(S.party ? 0 : 0, 0.66, 0), dist: S.party ? 6.2 : 3.25 }; return; }
  hero.group.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
  if (box.isEmpty()) { obj.getWorldPosition(c); r = which === 'face' ? 0.12 : 0.3; } // a lite hero's parts are one mesh: look at the node itself
  S.goal = { c, dist: Math.max(0.35, r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.05) };
}
$('b-look').onclick = () => {
  let i = LOOKS.findIndex(l => l[0] === S.look);
  for (let k = 0; k < LOOKS.length; k++) { i = (i + 1) % LOOKS.length; const w = LOOKS[i][0]; if (w === 'weapon' && !hero?.rig.weapon) continue; if (w === 'offhand' && !hero?.rig.offhand) continue; break; }
  lookAt(LOOKS[i][0]);
};

/* ------------------------------------------------------------------ loop */
function resize() {
  const box = canvas.parentElement.getBoundingClientRect();
  const w = Math.max(1, box.width), h = Math.max(1, box.height);
  const pr = S.pixel ? 1 / S.pxSize : Math.min(devicePixelRatio, S.detail === 'high' ? 2 : 1.5);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(pr); composer.setSize(w, h); gtao.setSize(w * pr, h * pr);
  canvas.style.imageRendering = S.pixel ? 'pixelated' : 'auto';
  camera.aspect = w / h;
  // a tall phone stage: a wider view, and the hero nudged down out from under the buttons
  const tall = w / h < 1.1 || innerWidth <= 820;
  camera.fov = tall ? 48 : 30;
  if (tall) camera.setViewOffset(w, h, 0, -h * 0.05, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  moteMat.uniforms.px.value = pr * h / 700;
}
new ResizeObserver(resize).observe(canvas.parentElement);

const clock = new THREE.Clock();
const tipW = new THREE.Vector3(), baseW = new THREE.Vector3();
let frames = 0, fpsT = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (hero) {
    let u = 0, pose = 'idle';
    if (S.strike >= 0) { S.strike += dt / 0.75; u = Math.min(1, S.strike); pose = 'strike'; if (S.strike >= 1) S.strike = -1; }
    // walking about (to judge what swings): a figure of eight round the plinth, walking, running, then a dead stop
    if (S.roam) {
      const run = S.roam === 'run', sp = run ? 1.9 : 0.9;
      if (S.roam !== 'stop') { S.roamT += dt * sp / 1.6; S.step += dt * (run ? 11 : 7.2); }
      const a = S.roamT, R0 = 0.75, x = Math.sin(a) * R0, z = Math.sin(2 * a) * R0 * 0.5, dx = Math.cos(a), dz = Math.cos(2 * a);
      hero.group.position.set(x, 0, z); hero.group.rotation.y = Math.atan2(dx, dz);
      hero.rig.run = run;
      if (S.roam === 'stop') setPose(hero.rig, pose === 'strike' ? 'strike' : 'idle', t, u); else setPose(hero.rig, 'walk', t, S.step);
    } else setPose(hero.rig, pose, t, u);
    for (const o of Object.values(others)) { setPose(o.rig, 'idle', t + o.phase, 0); for (const g of o.fx.glows) if (g.obj?.material && g.obj.material.emissiveIntensity !== undefined) g.obj.material.emissiveIntensity = 1.3 + Math.sin(t * 3 + g.power * 5) * 0.3; }
    hero.group.updateMatrixWorld(true);
    // the weapon's light and its trail
    const w = hero.rig.weapon;
    if (w) {
      w.userData.tip.getWorldPosition(tipW); w.getWorldPosition(baseW);
      weaponLight.position.lerpVectors(baseW, tipW, 0.75);
      weaponLight.intensity = weaponLight.userData.on * (0.85 + 0.15 * Math.sin(t * 9));
      if (pose === 'strike' && hero.rig.cls !== 'bow') { trailPts.unshift([tipW.clone(), baseW.clone().lerp(tipW, 0.55)]); if (trailPts.length > TRAIL) trailPts.length = TRAIL; }
      else if (trailPts.length) trailPts.pop();
    } else weaponLight.intensity = 0;
    trail.visible = trailPts.length > 2;
    if (trail.visible) {
      const pa = trailGeo.attributes.position;
      for (let i = 0; i < TRAIL; i++) { const p = trailPts[Math.min(i, trailPts.length - 1)]; pa.setXYZ(i * 2, p[0].x, p[0].y, p[0].z); pa.setXYZ(i * 2 + 1, p[1].x, p[1].y, p[1].z); }
      pa.needsUpdate = true;
      trailMat.opacity = 0.55;
    }
    for (const g of hero.fx.glows) if (g.obj?.material && g.obj.material.emissiveIntensity !== undefined && MAT) g.obj.material.emissiveIntensity = 1.3 + Math.sin(t * 3 + g.power * 5) * 0.3;
  }
  if (bm && S.beside) bm.update(t, 0);
  runeCircle.material.opacity = (runeCircle.userData.on || 0) * (0.75 + 0.25 * Math.sin(t * 2));
  runeCircle.rotation.z = t * 0.2;
  moteMat.uniforms.time.value = t;
  if (S.goal) {
    const k = Math.min(1, dt * 4), off = camera.position.clone().sub(controls.target);
    controls.target.lerp(S.goal.c, k);
    const len = THREE.MathUtils.lerp(off.length(), S.goal.dist, k);
    camera.position.copy(controls.target).addScaledVector(off.normalize(), len);
    if (controls.target.distanceTo(S.goal.c) < 0.002 && Math.abs(len - S.goal.dist) < 0.002) S.goal = null;
  }
  controls.update();
  renderer.info.autoReset = false; renderer.info.reset(); composer.render(); S.calls = renderer.info.render.calls;
  spriteT += dt; if (spriteT > 0.31) { spriteT = 0; drawSprite(t); }
  frames++; fpsT += dt; if (fpsT > 1) { $('fps').textContent = `${Math.round(frames / fpsT)} fps · ${Math.round(S.tris / 1000)}k triangles · ${S.meshes} pieces · ${S.calls} draws · built in ${S.lastBuild} ms`; frames = 0; fpsT = 0; }
}
/* ------------------------------------------------------------------ the item audit */
// Every item M7 can roll or hand out, built on the hero it suits and checked (audit.js); a small picture of each is made
// as it scrolls into view; tap one to put it on the hero above for a close look.
const AUD = { list: null, filter: 'all', res: new Map(), queue: [], busy: false };
let tR = null, tScene, tCam;
function thumbSetup() {
  tR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); tR.setSize(150, 150); tR.setPixelRatio(1); tR.toneMapping = renderer.toneMapping;
  tScene = new THREE.Scene(); tScene.environment = new THREE.PMREMGenerator(tR).fromScene(new RoomEnvironment(), 0.04).texture; tScene.environmentIntensity = 0.6;
  tScene.add(new THREE.HemisphereLight(0xffe8d0, 0x302018, 1.3)); const d = new THREE.DirectionalLight(0xfff0e0, 2.6); d.position.set(1, 2, 2.2); tScene.add(d);
  tCam = new THREE.PerspectiveCamera(30, 1, 0.005, 30);
}
function auditOne(e, picture = true) {
  const keepQ = Q.d; Q.d = 1; let B, flags;
  try { B = buildHero(e.hero, gearFor(e), {}); setPose(B.rig, 'idle', 0); flags = checkBuilt(B, e); }
  catch (err) { Q.d = keepQ; return { flags: [{ level: 'broken', text: 'error building it: ' + err.message }], img: null }; }
  Q.d = keepQ;
  let img = null;
  if (picture) {
    if (!tR) thumbSetup();
    const R = B.rig, node = e.slot === 'weapon' ? R.weapon : e.slot === 'offhand' ? R.offhand : e.slot === 'head' ? R.head : e.slot === 'hands' || e.slot === 'ring' ? R.armL.hand : e.slot === 'feet' ? R.legs[0] : e.slot === 'amulet' ? R.chest : null;
    tScene.add(B.group); B.group.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(node || B.group); if (box.isEmpty() || e.slot === 'body') box = new THREE.Box3().setFromObject(B.group);
    if (e.slot === 'amulet') { const c0 = R.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.2, 0.04)); box = new THREE.Box3().setFromCenterAndSize(c0, new THREE.Vector3(0.22, 0.22, 0.22)); }
    const c = box.getCenter(new THREE.Vector3()), r = Math.max(0.06, box.getSize(new THREE.Vector3()).length() / 2);
    const dist = r / Math.tan(THREE.MathUtils.degToRad(15)) * 1.05; tCam.position.copy(c).add(new THREE.Vector3(0.32, 0.14, 0.94).normalize().multiplyScalar(dist)); tCam.lookAt(c);
    tR.render(tScene, tCam); img = tR.domElement.toDataURL('image/webp', 0.82);
    tScene.remove(B.group);
  }
  B.group.traverse(o => o.geometry?.dispose?.());
  return { flags, img };
}
const AF = [['all', 'All'], ['flagged', 'Flagged'], ['weapon', 'Weapons'], ['offhand', 'Off hand'], ['head', 'Head'], ['body', 'Body'], ['hands', 'Hands'], ['feet', 'Feet'], ['jewel', 'Amulets, rings'], ['relic', 'Relics']];
function auditShown() {
  return AUD.list.filter(e => AUD.filter === 'all' || (AUD.filter === 'flagged' ? (AUD.res.get(e.key)?.flags.length) : AUD.filter === 'relic' ? e.relic : AUD.filter === 'jewel' ? (e.slot === 'amulet' || e.slot === 'ring') : e.slot === AUD.filter));
}
function auditSummary() { const done = [...AUD.res.values()], bad = done.filter(r => r.flags.some(f => f.level === 'broken')).length, warn = done.filter(r => r.flags.length && !r.flags.some(f => f.level === 'broken')).length; $('audit-sum').textContent = `${AUD.list.length} items · ${done.length} checked so far · ${bad} broken · ${warn} to look at · tap one for a close look`; }
function auditCard(e) {
  const b = document.createElement('button'); b.className = 'acard'; b.dataset.k = e.key;
  b.innerHTML = `<div class="ph"></div><span class="an"></span><span class="as"></span><span class="af"></span>`;
  b.querySelector('.an').textContent = e.label; b.querySelector('.as').textContent = `${e.sub} · on ${HERO_NAMES[e.hero]}`;
  b.onclick = () => { S.gears[e.hero] = gearFor(e); setHero(e.hero); lookAt(e.slot === 'weapon' ? 'weapon' : e.slot === 'offhand' && hero.rig.offhand ? 'offhand' : e.slot === 'head' ? 'face' : 'whole'); };
  const fill = r => { const ph = b.querySelector('.ph'); if (r.img && ph.tagName !== 'IMG') { const im = new Image(); im.src = r.img; im.alt = e.label; ph.replaceWith(im); } const af = b.querySelector('.af'); af.innerHTML = r.flags.length ? r.flags.map(f => (f.level === 'broken' ? '<b>' : '<i>') + f.text.replace(/</g, '&lt;') + (f.level === 'broken' ? '</b>' : '</i>')).join('<br>') : '<span class="ok">looks right</span>'; };
  b._fill = fill; if (AUD.res.has(e.key)) fill(AUD.res.get(e.key)); else { b._entry = e; io.observe(b); }
  return b;
}
const io = new IntersectionObserver(es => { for (const x of es) if (x.isIntersecting) { io.unobserve(x.target); AUD.queue.push(x.target); } pump(); }, { rootMargin: '200px' });
function pump() {
  if (AUD.busy || !AUD.queue.length) return; AUD.busy = true;
  setTimeout(() => { const b = AUD.queue.shift(); const e = b._entry; if (e && !AUD.res.has(e.key)) AUD.res.set(e.key, auditOne(e)); if (e) b._fill(AUD.res.get(e.key)); auditSummary(); AUD.busy = false; pump(); }, 16);
}
function drawAudit() {
  if (!AUD.list) AUD.list = auditList();
  const fl = $('audit-filters'); fl.innerHTML = '';
  for (const [k, n] of AF) { const b = document.createElement('button'); b.textContent = n; b.setAttribute('aria-pressed', AUD.filter === k); b.onclick = () => { AUD.filter = k; drawAudit(); }; fl.append(b); }
  const g = $('audit-grid'); g.innerHTML = ''; io.disconnect(); AUD.queue.length = 0;
  for (const e of auditShown()) g.append(auditCard(e));
  auditSummary();
}
$('b-audit').onclick = () => { $('auditPanel').hidden = false; $('gearPanel').hidden = true; $('b-audit').hidden = true; drawAudit(); };
$('b-audit-back').onclick = () => { $('auditPanel').hidden = true; $('gearPanel').hidden = false; $('b-audit').hidden = false; };
// for checks without pictures (headless): every item, flags only
window.__audit = { thumbs(from, to) { return window.__audit.list().slice(from, to).map(e => ({ key: e.key, label: e.label, sub: e.sub, img: auditOne(e, true).img })); }, list: () => (AUD.list ||= auditList()), run(from = 0, to = 1e9) { const L = window.__audit.list().slice(from, to); return L.map(e => ({ key: e.key, hero: e.hero, flags: auditOne(e, false).flags })).filter(r => r.flags.length); } };
// the cost of what swings: setPose n times with and without it (ms per call)
window.__swingCost = (n = 2000) => { const rig = hero.rig, time = on => { SWING_ON.on = on; const t0 = performance.now(); for (let i = 0; i < n; i++) setPose(rig, 'walk', i / 60, i * 0.12); return (performance.now() - t0) / n; }; const off = time(false), on = time(true); SWING_ON.on = true; return { pieces: rig.danglers.length, off: +off.toFixed(4), on: +on.toFixed(4) }; };
/* ------------------------------------------------------------------ beside Briarmaw (November 20) */
// The full-detail Briarmaw (session 6's sculpt baked onto his light model, prototypes/foe-hd) stands beside the hero at
// his true size, to judge the hero's detail against him; Sculpted on/off shows the hero before and after.
let bm = null;
async function besideBriarmaw(on) {
  if (on && !bm) { await foeReady(); const shared = makeShared({ key: 'briarmaw', lightMeta: bmMeta, lightBin: bmBin, tex: { 1024: { color: bmColor, normal: bmNormal } }, ao: bmAo, emit: bmEmit }, 1024); bm = makeFoe(shared, QUAD); }
  if (!bm) return;
  if (on) { scene.add(bm.group); const k = 1.22 / 1.72; bm.group.scale.setScalar(k); bm.group.position.set(1.35, 0, -0.75); bm.group.rotation.y = -1.05; S.goal = { c: new THREE.Vector3(0.85, 0.5, -0.35), dist: 5.2 }; }
  else scene.remove(bm.group);
}
S.beside = false;
$('b-beside').onclick = async () => { S.beside = !S.beside; $('b-beside').setAttribute('aria-pressed', S.beside); $('b-beside').textContent = S.beside ? 'Beside Briarmaw ✓' : 'Beside Briarmaw'; if (S.beside && S.party) setParty(false);
  if (S.beside) { S.gears.warden = starterKit('warden'); setHero('warden'); }  // Wren in her starter kit, as asked
  await besideBriarmaw(S.beside); };
$('b-sculpt').onclick = () => { SCULPT.on = MACRO_ON.on = MASTER_ON.on = !SCULPT.on; $('b-sculpt').setAttribute('aria-pressed', SCULPT.on); $('b-sculpt').textContent = SCULPT.on ? 'Sculpted ✓' : 'Sculpted'; rebuild(); };
/* ------------------------------------------------------------------ the sculpt (November 21) */
// Sculpt: the hero's pieces cut fine and raised by their kinds' masters (masters/sculpt.py), the full-detail shape the
// game's bake comes from (about a million triangles: for looking at, not for the game)
S.sculptView = false;
async function showSculpt() {
  unsculpt(); await loadHeights();
  const t0 = performance.now(), r = sculptify(hero.group, 900000);
  S.tris = 0; for (const h of [hero, ...Object.values(others)]) h.group.traverse(o => { if (o.isMesh) { const g = o.geometry; S.tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  S.sculptInfo = { ...r, ms: Math.round(performance.now() - t0) };
}
$('b-sculptview').onclick = async () => {
  S.sculptView = !S.sculptView; $('b-sculptview').setAttribute('aria-pressed', S.sculptView); $('b-sculptview').textContent = S.sculptView ? 'The sculpt ✓' : 'The sculpt';
  if (S.sculptView) { if (S.detail !== 'high') { S.detail = 'high'; applyDetail(); } if (!SCULPT.on) $('b-sculpt').click(); rebuild(); }
  else { unsculpt(); rebuild(); }
};
window.__addLog = ADD_LOG;
window.__build = (e) => { const keepQ = Q.d; Q.d = 2; try { return buildHero(e.hero, gearFor(e), {}); } finally { Q.d = keepQ; } };
// everyone else built by the same builder: the people foes (art/foes.js) and the townsfolk (people.js)
const FOE_PEOPLE = Object.keys(FOE_ART).filter(k => FOE_ART[k].kind === 'humanoid');
/* ------------------------------------------------------------------ everyone (November 21) */
// Who: any hero, townsperson or people foe, in full detail (their own outfits from the game's looks, wearing the same
// sculpted masters); "The sculpt" then shows the whole sculpt of whoever is chosen
function whoBuild() {
  if (!S.who) return null;
  const [t, k] = S.who.split(':'), lite = S.detail === 'lite';
  if (t === 'npc') return buildPerson(k, { lite });
  const { H, gear } = foeLooks(k, {}); return buildHero('warden', {}, { H, looks: gear, lite });
}
const NPC_SPRITE = {};
function whoSprite(t) {
  const [k0, k] = S.who.split(':');
  if (k0 === 'foe') return renderFoe(k, { tier: FOE_ART[k].defaultTier, t });
  if (!NPC_SPRITE[k]) { const sh = npcSheet(personLook(k).art), c = document.createElement('canvas'); c.width = sh.img.width; c.height = sh.img.height; c.getContext('2d').putImageData(sh.img, 0, 0); NPC_SPRITE[k] = c.getContext('2d').getImageData(0, 0, 16, 24); }
  return NPC_SPRITE[k];
}
const whoSel = $('who');
{ const add = (label, items) => { const g = document.createElement('optgroup'); g.label = label; for (const [v, n] of items) g.append(new Option(n, v)); whoSel.append(g); };
  add('Heroes', HEROES.map(h => ['hero:' + h.id, h.name]));
  add(`The townsfolk (${PEOPLE.length})`, PEOPLE.map(id => { let n = id; try { n = personLook(id).name || id; } catch (e) {} return ['npc:' + id, n]; }).sort((a, b) => a[1].localeCompare(b[1])));
  add(`People foes (${FOE_PEOPLE.length})`, FOE_PEOPLE.map(k => ['foe:' + k, FOE_ART[k].name || k]).sort((a, b) => a[1].localeCompare(b[1])));
  whoSel.onchange = () => { const v = whoSel.value; if (v.startsWith('hero:')) return setHero(v.slice(5)); if (S.party) setParty(false); S.who = v; $('gearPanel').classList.add('who'); rebuild(); };
}
window.__people = { foes: FOE_PEOPLE, npcs: PEOPLE, foe: k => { const { H, gear } = foeLooks(k, {}); return buildHero('warden', {}, { H, looks: gear }); }, npc: id => buildPerson(id) };
window.__flags = { SCULPT, MACRO_ON, MASTER_ON };
window.__gear = { renderer, scene, S, rebuild, setHero, rollFor, nextRelic, lookAt: w => lookAt(w), get hero() { return hero; }, camera, controls };
applyDetail();
setHero('warden');
resize();
loop();
$('loading').hidden = true;
