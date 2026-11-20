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
import { buildHero, setPose, glowColor } from './model.js';
import { Q, TEXTURES } from './kit.js';

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
  hero = buildHero(S.hero, S.gear, { build: S.build, lite: S.detail === 'lite' }); hero.face(S.face || 'neutral');
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
function setHero(id) { S.hero = id; S.gear = S.gears[id] || (S.gears[id] = starterKit(id)); rebuild(); }
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
  for (const c of document.querySelectorAll('.hero')) c.setAttribute('aria-pressed', c.dataset.id === S.hero);
  drawSprite(0);
}
// the game's own battle sprite, in the same gear
const spriteBox = $('sprite');
let spriteCanvas = null, spriteT = 0;
function drawSprite(t) {
  const img = renderHero(S.hero, S.gear, { pose: 'idle', t });
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
    setPose(hero.rig, pose, t, u);
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
window.__gear = { renderer, S, rebuild, setHero, rollFor, nextRelic, lookAt: w => lookAt(w), get hero() { return hero; }, camera, controls };
applyDetail();
setHero('warden');
resize();
loop();
$('loading').hidden = true;
