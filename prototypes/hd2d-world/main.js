// Aethermoor in 3D: a try-out (November 20). The game's own maps, paintings and pixel people, stood up in a lit
// three.js diorama ("HD-2D": painted ground, raised buildings, pixel people as cards that stand up in the light).
// Everything the player sees comes from game/src: the map rows say where the buildings, trees and fences are, the
// painting gives every surface its colours, and the walkers and NPCs are drawn by art/walkers.js and
// art/map-sprites.js. Only the drawing is new.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/examples/jsm/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js';

import { tileOf } from '../../game/src/data/tiles.js';
import { NPCS } from '../../game/src/data/npcs.js';
import { walkerSheet, npcSheet, objectSprite } from '../../game/src/art/index.js';
import thornhollow from '../../game/src/data/maps/thornhollow.js';
import sandspire from '../../game/src/data/maps/sandspire.js';
import keep from '../../game/src/data/maps/keep.js';
import hearthRoad from '../../game/src/data/maps/hearth-road.js';
import paintThornhollow from '../../game/src/ui/assets/paint/thornhollow.js';
import paintSandspire from '../../game/src/ui/assets/paint/sandspire.js';
import paintKeep from '../../game/src/ui/assets/paint/keep.js';
import paintHearthRoad from '../../game/src/ui/assets/paint/hearth-road.js';

const MAPS = {
  thornhollow: { map: thornhollow, paint: paintThornhollow, start: [12, 16.5], label: 'Thornhollow' },
  sandspire: { map: sandspire, paint: paintSandspire, label: 'Sandspire' },
  keep: { map: keep, paint: paintKeep, label: 'Hearthstone Keep' },
  'hearth-road': { map: hearthRoad, paint: paintHearthRoad, label: 'The Hearth Road' },
};

const PARTY = [{ id: 'warden', name: 'Wren' }, { id: 'pip' }, { id: 'bryn' }, { id: 'alondra' }];
const coarse = matchMedia('(pointer: coarse)').matches;
const qs = new URLSearchParams(location.hash.slice(1));

/* ------------------------------------------------------------------ renderer, scene, camera */
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x5a4a30, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

const S = {
  detail: qs.get('detail') || (coarse ? 'light' : 'high'),
  time: qs.get('time') || 'morning',
  cam: 'near',
  mapId: MAPS[qs.get('map')] ? qs.get('map') : 'thornhollow',
};

/* ------------------------------------------------------------------ post: tilt-shift, bloom */
let composer, bloom, hts, vts;
function makeComposer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.6, 0.85);
  composer.addPass(bloom);
  hts = new ShaderPass(HorizontalTiltShiftShader);
  vts = new ShaderPass(VerticalTiltShiftShader);
  hts.uniforms.r.value = vts.uniforms.r.value = 0.52;
  composer.addPass(hts);
  composer.addPass(vts);
  composer.addPass(new OutputPass());
}
makeComposer();

/* ------------------------------------------------------------------ helpers */
const textureFrom = (imgData) => {
  const c = document.createElement('canvas');
  c.width = imgData.width; c.height = imgData.height;
  c.getContext('2d').putImageData(imgData, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const rnd = (seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646)(7);
const loadImage = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// a non-indexed geometry built from quads and triangles with explicit uvs (flat shading)
class Builder {
  constructor() { this.p = []; this.uv = []; }
  tri(a, b, c, ua, ub, uc) { this.p.push(...a, ...b, ...c); this.uv.push(...ua, ...ub, ...uc); }
  quad(a, b, c, d, ua, ub, uc, ud) { this.tri(a, b, c, ua, ub, uc); this.tri(a, c, d, ua, uc, ud); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    return g;
  }
}

/* ------------------------------------------------------------------ the world, built from a map */
let world = null; // { group, map, solid(x,y), lights[], fires[], water, actors[] }

function disposeWorld() {
  if (!world) return;
  scene.remove(world.group);
  world.group.traverse(o => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); });
  for (const l of world.lights) scene.remove(l);
  spriteMats.clear();
  world = null;
}

async function buildWorld(id) {
  disposeWorld();
  const { map, paint } = MAPS[id];
  const W = map.w, H = map.h, rows = map.rows;
  const ch = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] : 'x');
  const group = new THREE.Group();
  const img = await loadImage(paint.src);
  const PX = img.width / W; // painting px per tile (32)

  // the painting's pixels, to colour trees and fences by what is painted under them
  const pc = document.createElement('canvas'); pc.width = img.width; pc.height = img.height;
  const pctx = pc.getContext('2d', { willReadFrequently: true }); pctx.drawImage(img, 0, 0);
  const pdata = pctx.getImageData(0, 0, pc.width, pc.height).data;
  const sample = (x0, y0, x1, y1) => {
    let r = 0, g = 0, b = 0, n = 0;
    const X0 = Math.max(0, Math.floor(x0 * PX)), X1 = Math.min(pc.width - 1, Math.floor(x1 * PX)), Y0 = Math.max(0, Math.floor(y0 * PX)), Y1 = Math.min(pc.height - 1, Math.floor(y1 * PX));
    for (let y = Y0; y <= Y1; y += 2) for (let x = X0; x <= X1; x += 2) { const i = (y * pc.width + x) * 4; r += pdata[i]; g += pdata[i + 1]; b += pdata[i + 2]; n++; }
    return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
  };

  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  const paintMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
  const uvOf = (tx, ty) => [tx / W, 1 - ty / H];

  // ground: the painting, and a wide skirt of its edge colour under the forest round it
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, H), paintMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true;
  group.add(ground);
  const edge = sample(0, 0, W, 1).lerp(sample(0, H - 1, W, H), 0.5).multiplyScalar(0.8);
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(W + 120, H + 120), new THREE.MeshStandardMaterial({ color: edge, roughness: 1 }));
  skirt.rotation.x = -Math.PI / 2; skirt.position.set(W / 2, -0.02, H / 2); skirt.receiveShadow = true;
  group.add(skirt);

  // ---- buildings: each connected block of roof (H) and wall (#, *) tiles stands up as a house
  const isB = c => c === 'H' || c === '#' || c === '*';
  const seen = new Uint8Array(W * H);
  const houses = new Builder(), blocks = new Builder();
  const posts = [];
  const lightsAt = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (seen[y * W + x] || !isB(ch(x, y))) continue;
    const cells = [], q = [[x, y]]; seen[y * W + x] = 1;
    while (q.length) {
      const [cx, cy] = q.pop(); cells.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || !isB(ch(nx, ny))) continue;
        seen[ny * W + nx] = 1; q.push([nx, ny]);
      }
    }
    let c0 = W, c1 = 0, r0 = H, r1 = 0;
    for (const [cx, cy] of cells) { c0 = Math.min(c0, cx); c1 = Math.max(c1, cx); r0 = Math.min(r0, cy); r1 = Math.max(r1, cy); }
    const roofRows = [], wallRows = [];
    for (let r = r0; r <= r1; r++) { const s = rows[r].slice(c0, c1 + 1); if (s.includes('H')) roofRows.push(r); else wallRows.push(r); }
    for (const [cx, cy] of cells) if (ch(cx, cy) === '*') lightsAt.push([cx + 0.5, cy + 1.05, 0xff8a2a]);
    const full = cells.length === (c1 - c0 + 1) * (r1 - r0 + 1);
    const wallsBelow = wallRows.length && wallRows[0] > roofRows[roofRows.length - 1];
    if (full && roofRows.length && wallsBelow) house(houses, c0, c1 + 1, roofRows[0], roofRows[roofRows.length - 1] + 1, wallRows[0], wallRows[wallRows.length - 1] + 1);
    else if (full && roofRows.length && !wallRows.length) awning(houses, c0, c1 + 1, r0, r1 + 1);
    else for (const [cx, cy] of cells) cellBlock(blocks, cx, cy, ch(cx, cy) === 'H' ? 1.35 : 0.95);
  }

  // a house: front wall from the painted wall rows, a gabled roof from the painted roof rows
  function house(B, x0, x1, zN, zR, zW, zS) {
    const hw = 0.95 * (zS - zW), depth = zS - zN, rh = Math.min(1.6, depth * 0.42), zM = (zN + zR) / 2;
    const zMid = zN + depth / 2, o = 0.14;
    const yE = hw, yR = hw + rh;
    // front wall (faces +z) and back wall
    B.quad([x0, 0, zS], [x1, 0, zS], [x1, yE, zS], [x0, yE, zS], uvOf(x0, zS), uvOf(x1, zS), uvOf(x1, zW), uvOf(x0, zW));
    B.quad([x1, 0, zN], [x0, 0, zN], [x0, yE, zN], [x1, yE, zN], uvOf(x1, zW + 0.9), uvOf(x0, zW + 0.9), uvOf(x0, zW), uvOf(x1, zW));
    // side walls and gables, from a band of the painted wall near each end
    for (const [sx, a, b] of [[x0, x0 + 0.1, x0 + 0.45], [x1, x1 - 0.1, x1 - 0.45]]) {
      const west = sx === x0;
      const P = (z, yy) => [sx, yy, z];
      const U = (z, yy) => [(a + (b - a) * ((z - zN) / depth)) / W, 1 - (zS - (yy / Math.max(yE, 0.01)) * (zS - zW)) / H];
      const quadArgs = [P(zN, 0), P(zS, 0), P(zS, yE), P(zN, yE)];
      const uvs = [U(zN, 0), U(zS, 0), U(zS, yE), U(zN, yE)];
      if (west) B.quad(...quadArgs, ...uvs); else B.quad(quadArgs[1], quadArgs[0], quadArgs[3], quadArgs[2], uvs[1], uvs[0], uvs[3], uvs[2]);
      const g = [P(zN, yE), P(zS, yE), P(zMid, yR)], gu = [U(zN, yE * 0.98), U(zS, yE * 0.98), U(zMid, yE * 0.6)];
      if (west) B.tri(g[0], g[1], g[2], gu[0], gu[1], gu[2]); else B.tri(g[1], g[0], g[2], gu[1], gu[0], gu[2]);
    }
    // roof: front slope from the lower half of the painted roof, back slope from the upper half
    const ux0 = x0, ux1 = x1;
    B.quad([x0 - o, yE - 0.06, zS + o], [x1 + o, yE - 0.06, zS + o], [x1 + o, yR, zMid], [x0 - o, yR, zMid], uvOf(ux0, zR), uvOf(ux1, zR), uvOf(ux1, zM), uvOf(ux0, zM));
    B.quad([x1 + o, yE - 0.06, zN - o], [x0 - o, yE - 0.06, zN - o], [x0 - o, yR, zMid], [x1 + o, yR, zMid], uvOf(ux1, zN), uvOf(ux0, zN), uvOf(ux0, zM), uvOf(ux1, zM));
  }
  // a market stall's awning on posts
  function awning(B, x0, x1, z0, z1) {
    const y = 1.15, d = z1 - z0;
    B.quad([x0, y - 0.25, z1 + 0.1], [x1, y - 0.25, z1 + 0.1], [x1, y + 0.2, z0 + d * 0.3], [x0, y + 0.2, z0 + d * 0.3], uvOf(x0, z1), uvOf(x1, z1), uvOf(x1, z0), uvOf(x0, z0));
    B.quad([x1, y - 0.25, z1 + 0.1], [x0, y - 0.25, z1 + 0.1], [x0, y + 0.2, z0 + d * 0.3], [x1, y + 0.2, z0 + d * 0.3], uvOf(x1, z1), uvOf(x0, z1), uvOf(x0, z0), uvOf(x1, z0));
    for (const px of [x0 + 0.08, x1 - 0.08]) posts.push([px, z1 - 0.05, y - 0.2]);
  }
  // any other solid: a block whose top and front are its own painted tile
  function cellBlock(B, x, y, hgt) {
    const x1 = x + 1, y1 = y + 1;
    B.quad([x, hgt, y1], [x1, hgt, y1], [x1, hgt, y], [x, hgt, y], uvOf(x, y1), uvOf(x1, y1), uvOf(x1, y), uvOf(x, y));
    B.quad([x, 0, y1], [x1, 0, y1], [x1, hgt, y1], [x, hgt, y1], uvOf(x, y1), uvOf(x1, y1), uvOf(x1, y + 0.4), uvOf(x, y + 0.4));
    B.quad([x1, 0, y1], [x1, 0, y], [x1, hgt, y], [x1, hgt, y1], uvOf(x1 - 0.2, y1), uvOf(x1 - 0.2, y), uvOf(x1 - 0.05, y), uvOf(x1 - 0.05, y1));
    B.quad([x, 0, y], [x, 0, y1], [x, hgt, y1], [x, hgt, y], uvOf(x + 0.2, y), uvOf(x + 0.2, y1), uvOf(x + 0.05, y1), uvOf(x + 0.05, y));
    B.quad([x1, 0, y], [x, 0, y], [x, hgt, y], [x1, hgt, y], uvOf(x1, y + 0.6), uvOf(x, y + 0.6), uvOf(x, y), uvOf(x1, y));
  }

  // cliffs, root walls and rocks rise a little from their own painted tiles
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = ch(x, y);
    if (c === '^' || c === 'R' || c === 'Y') cellBlock(blocks, x, y, c === '^' ? 0.9 : 1.1);
  }
  for (const B of [houses, blocks]) {
    if (!B.p.length) continue;
    const m = new THREE.Mesh(B.geometry(), paintMat);
    m.castShadow = m.receiveShadow = true; group.add(m);
  }

  // ---- trees, bushes, rocks, fences: instanced and coloured from the painting under them
  const isDesert = /desert/.test(map.biome), isSnow = /frozen|frost|snow|scree/.test(map.biome);
  const trees = [], bushes = [], stones = [], stakes = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = ch(x, y);
    if (c === 'T') trees.push({ x: x + 0.5 + (rnd() - 0.5) * 0.2, z: y + 0.75, s: 0.85 + rnd() * 0.35, col: sample(x, y - 1, x + 1, y + 0.6) });
    else if (c === 't') bushes.push({ x: x + 0.5, z: y + 0.55, s: 0.8 + rnd() * 0.3, col: sample(x + 0.15, y + 0.15, x + 0.85, y + 0.85) });
    else if (c === 'o') stones.push({ x: x + 0.5, z: y + 0.55, s: 0.7 + rnd() * 0.3, col: sample(x + 0.2, y + 0.2, x + 0.8, y + 0.8) });
    else if (c === '|') {
      const horiz = ch(x - 1, y) === '|' || ch(x + 1, y) === '|';
      for (let k = 0; k < 3; k++) {
        const t = (k + 0.5) / 3;
        stakes.push({ x: horiz ? x + t : x + 0.5, z: horiz ? y + 0.55 : y + t, h: 1.15 + rnd() * 0.3 });
      }
    }
  }
  // a forest round the map's edge, so the world doesn't stop at a painted border
  const forestCol = trees.length ? trees.reduce((a, t) => a.add(t.col), new THREE.Color(0, 0, 0)).multiplyScalar(1 / trees.length) : sample(0, 0, W, H).multiplyScalar(0.7);
  for (let i = 0; i < (isDesert ? 70 : 260); i++) {
    const side = rnd() * 4 | 0, d = 0.8 + Math.pow(rnd(), 0.7) * 16;
    let x, z;
    if (side === 0) { x = rnd() * (W + 30) - 15; z = -d; } else if (side === 1) { x = rnd() * (W + 30) - 15; z = H + d; } else if (side === 2) { x = -d; z = rnd() * H; } else { x = W + d; z = rnd() * H; }
    trees.push({ x, z, s: 0.9 + rnd() * 0.6, col: forestCol.clone().multiplyScalar(0.75 + rnd() * 0.35) });
  }
  const dummy = new THREE.Object3D();
  const instanced = (geo, mat, list, place) => {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => { place(t, dummy); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (t.col) m.setColorAt(i, t.col); });
    m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  };
  const leaf = new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true });
  const bark = new THREE.MeshStandardMaterial({ color: 0x5b3b22, roughness: 1 });
  const tune = (col, k) => col.clone().offsetHSL(0, 0.08, k);
  if (isDesert) {
    // palms: a leaning trunk and a crown of fronds
    instanced(new THREE.CylinderGeometry(0.07, 0.12, 2.2, 6).translate(0, 1.1, 0), bark, trees, (t, d) => { d.position.set(t.x, 0, t.z); d.scale.setScalar(t.s); d.rotation.set(0.12, rnd() * 6, 0.08); });
    const frond = new THREE.ConeGeometry(0.2, 1.3, 4).rotateZ(Math.PI / 2).translate(0.6, 0, 0).scale(1, 0.25, 1);
    const fronds = [];
    for (const t of trees) for (let k = 0; k < 7; k++) fronds.push({ ...t, a: (k / 7) * Math.PI * 2 + rnd() * 0.3, col: tune(t.col.clone().lerp(new THREE.Color(0x3f7a2a), 0.5), -0.02) });
    instanced(frond, leaf, fronds, (t, d) => { d.position.set(t.x + 0.12 * t.s, 2.15 * t.s, t.z + 0.15 * t.s); d.scale.setScalar(t.s); d.rotation.set(0, t.a, -0.35); });
  } else {
    // pines: three stacked cones on a trunk
    instanced(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 6).translate(0, 0.35, 0), bark, trees, (t, d) => { d.position.set(t.x, 0, t.z); d.scale.setScalar(t.s); d.rotation.set(0, 0, 0); });
    const tiers = [[0.85, 1.1, 0.55], [0.66, 0.95, 1.05], [0.44, 0.8, 1.5]];
    tiers.forEach(([r, h, y], k) => {
      const list = trees.map(t => ({ ...t, col: tune(isSnow ? t.col.clone().lerp(new THREE.Color(0xe8f0f6), 0.25 + k * 0.15) : t.col, -0.06 + k * 0.05) }));
      instanced(new THREE.ConeGeometry(r, h, 7).translate(0, h / 2, 0), leaf, list, (t, d) => { d.position.set(t.x, y * t.s, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.x * 3.1, 0); });
    });
  }
  instanced(new THREE.IcosahedronGeometry(0.42, 1).translate(0, 0.32, 0), leaf, bushes, (t, d) => { d.position.set(t.x, 0, t.z); d.scale.set(t.s, t.s * 0.85, t.s); d.rotation.set(0, t.x, 0); });
  instanced(new THREE.DodecahedronGeometry(0.4, 0).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), stones, (t, d) => { d.position.set(t.x, 0, t.z); d.scale.set(t.s, t.s * 0.7, t.s); d.rotation.set(t.x, t.z, 0); });
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5434, roughness: 1, flatShading: true });
  instanced(new THREE.CylinderGeometry(0.13, 0.15, 1, 6).translate(0, 0.5, 0), wood, stakes, (t, d) => { d.position.set(t.x, 0, t.z); d.scale.set(1, t.h, 1); d.rotation.set(0, t.x, 0); });
  instanced(new THREE.ConeGeometry(0.13, 0.3, 6).translate(0, 0.15, 0), wood, stakes, (t, d) => { d.position.set(t.x, t.h, t.z); d.scale.set(1, 1, 1); d.rotation.set(0, t.x, 0); });
  instanced(new THREE.CylinderGeometry(0.05, 0.05, 1, 5).translate(0, 0.5, 0), wood, posts, (t, d) => { d.position.set(t[0], 0, t[1]); d.scale.set(1, t[2], 1); d.rotation.set(0, 0, 0); });

  // ---- water: the painted water, rippling and catching the light
  const waterB = new Builder();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ch(x, y) === '~' || ch(x, y) === 'w') {
    waterB.quad([x, 0.03, y + 1], [x + 1, 0.03, y + 1], [x + 1, 0.03, y], [x, 0.03, y], uvOf(x, y + 1), uvOf(x + 1, y + 1), uvOf(x + 1, y), uvOf(x, y));
  }
  let water = null;
  if (waterB.p.length) {
    water = new THREE.Mesh(waterB.geometry(), new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, time: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) }, glint: { value: new THREE.Color(1, 1, 1) }, size: { value: new THREE.Vector2(W, H) } },
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform sampler2D map; uniform float time; uniform vec3 tint; uniform vec3 glint; uniform vec2 size; varying vec2 vUv; varying vec3 vW;
        void main(){
          vec2 p = vW.xz;
          float a = sin(p.x*2.1 + time*1.3) + sin(p.y*2.7 - time*1.1) + sin((p.x+p.y)*1.4 + time*.7);
          vec2 off = vec2(sin(p.y*3.0 + time*1.6), cos(p.x*2.6 + time*1.2)) * 0.06 / size;
          vec3 c = texture2D(map, vUv + off).rgb;
          float s = smoothstep(2.2, 2.9, a);
          gl_FragColor = vec4(c * tint + glint * s * .35, 1.);
          #include <colorspace_fragment>
        }`,
    }));
    group.add(water);
  }

  // ---- things the game puts on the map: the hearthfire, boards, chests, gates (their own pixel sprites)
  const actors = [], lights = [], fires = [];
  const spriteCard = (imgData, fw, fh, scale = 1 / 16) => {
    const t = textureFrom(imgData);
    t.repeat.set(fw / imgData.width, fh / imgData.height);
    const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, roughness: 1, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: spriteGlow });
    spriteMats.add(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(fw * scale, fh * scale).translate(0, fh * scale / 2, 0), mat);
    m.castShadow = true; m.receiveShadow = false;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
    return { mesh: m, tex: t };
  };
  const objectOf = e => {
    switch (e.kind) {
      case 'hearthfire': return ['hearth', 'lit', e.id];
      case 'board': return ['board', e.opens === 'ladder' ? 'ladder' : 'bounties'];
      case 'lookout': case 'table': return [e.kind, null];
      case 'chest': return e.hidden ? null : ['chest', e.lock ? 'locked' : 'closed'];
      case 'gate': return [e.look || 'gate', 'closed'];
      case 'lock': return e.lock === 'barred-gate' ? ['barred-gate', 'closed'] : null;
      case 'sign': return e.look === 'painted' ? null : ['sign', e.look || null];
      case 'prop': return e.prop && e.prop !== 'deer' ? [e.prop, null] : null;
      default: return null;
    }
  };
  for (const e of map.entities || []) {
    if (e.kind === 'npc') {
      if (e.if && !e.if.not) continue; // someone who only turns up later in the story
      const n = NPCS[e.npc];
      const sheet = npcSheet(n?.art || e.npc);
      actors.push(makeWalker(sheet, e.at[0] + 0.5, e.at[1] + 0.8, e.face || 's', n?.name || e.npc));
      continue;
    }
    const o = objectOf(e);
    if (!o) continue;
    let spr = null;
    try { spr = objectSprite(o[0], o[1], { id: o[2] }); } catch { spr = null; }
    const [ax0, ay0, ax1, ay1] = e.area || [e.at[0], e.at[1], e.at[0], e.at[1]];
    for (let ty = ay0; ty <= ay1; ty++) for (let tx = ax0; tx <= ax1; tx++) {
      if (spr && spr.width) {
        const c = spriteCard(spr, spr.width, spr.frames > 1 ? spr.height : spr.height);
        c.mesh.position.set(tx + 0.5, 0, ty + 0.8);
        c.mesh.userData.face = true;
        group.add(c.mesh);
      }
      if (e.kind === 'hearthfire') { fires.push([tx + 0.5, ty + 0.75]); lightsAt.push([tx + 0.5, ty + 0.75, 0xffa040, true]); }
    }
  }
  // the lights: the hearthfire and the forge glow (a phone gets fewer)
  const maxLights = S.detail === 'high' ? 4 : 2;
  lightsAt.sort((a, b) => (b[3] ? 1 : 0) - (a[3] ? 1 : 0));
  for (const [lx, lz, col, main] of lightsAt.slice(0, maxLights)) {
    const L = new THREE.PointLight(col, main ? 6 : 3, main ? 9 : 6, 1.6);
    L.position.set(lx, main ? 0.7 : 0.9, lz);
    L.userData = { base: main ? 6 : 3, main };
    scene.add(L); lights.push(L);
  }

  // ---- the party, from the hero walkers
  const sp = MAPS[id].start || startOf(map);
  PARTY.forEach((p, i) => actors.push(makeWalker(walkerSheet(p.id), sp[0], sp[1] + i * 0.8, 'n', p.name || null, true)));
  for (const a of actors) group.add(a.mesh);

  scene.add(group);
  const solid = (x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
    return tileOf(rows[ty][tx]).solid;
  };
  world = { group, map, W, H, solid, lights, fires, water, actors, party: actors.filter(a => a.party), trail: [] };
  makeFire();
  applyTime(true);
  document.getElementById('place').textContent = MAPS[id].label;
}

function startOf(map) {
  const hf = (map.entities || []).find(e => e.kind === 'hearthfire' && e.stand);
  if (hf) return [hf.stand[0] + 0.5, hf.stand[1] + 0.8];
  const a = Object.values(map.anchors || {})[0];
  return a ? [a[0] + 0.5, a[1] + 0.8] : [map.w / 2, map.h / 2];
}

/* ------------------------------------------------------------------ walkers (the party and the NPCs) */
const ROW = { s: 0, n: 1, e: 2, w: 3 };
const spriteMats = new Set();
let spriteGlow = 0.12;
function makeWalker(sheet, x, z, face, name, party = false) {
  const t = textureFrom(sheet.img);
  t.repeat.set(1 / 3, 1 / 4);
  const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: spriteGlow });
  spriteMats.add(mat);
  const geo = new THREE.PlaneGeometry(1, 1.5).translate(0, 0.75, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
  mesh.userData.face = true;
  const a = { mesh, tex: t, x, z, face, name, party, step: 0, moving: false };
  setFrame(a, 0);
  mesh.position.set(x, 0, z);
  return a;
}
function setFrame(a, f) {
  a.tex.offset.set(f / 3, 1 - (ROW[a.face] + 1) / 4);
}

/* ------------------------------------------------------------------ fire: flames over the hearth */
let fireMesh = null;
function makeFire() {
  if (fireMesh) { scene.remove(fireMesh); fireMesh.geometry.dispose(); }
  if (!world.fires.length) { fireMesh = null; return; }
  const N = 40 * world.fires.length;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { const f = world.fires[i % world.fires.length]; pos.set([f[0], 0, f[1]], i * 3); seed[i] = rnd(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  fireMesh = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, px: { value: 1 } },
    vertexShader: `attribute float seed; uniform float time; uniform float px; varying float vT;
      void main(){ float t = fract(seed*7.3 + time*(0.9+seed*.6)); vT = t;
        vec3 p = position + vec3(sin(seed*40.+time*3.)*.12*(1.-t), .25 + t*.9, cos(seed*23.+time*2.)*.08*(1.-t));
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = px*(1.-t)*90./-mv.z; }`,
    fragmentShader: `varying float vT; void main(){ vec2 c = gl_PointCoord-.5; if (max(abs(c.x),abs(c.y))>.5) discard;
      vec3 col = mix(vec3(1.,.95,.6), vec3(1.,.35,.05), vT); gl_FragColor = vec4(col*2.2, 1.-vT); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(fireMesh);
}

/* ------------------------------------------------------------------ fireflies at night */
const flies = (() => {
  const N = 90, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) seed[i] = rnd();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, center: { value: new THREE.Vector3() }, px: { value: 1 } },
    vertexShader: `attribute float seed; uniform float time; uniform vec3 center; uniform float px; varying float vA;
      void main(){ vec3 p = center + vec3(sin(seed*91.)*9. + sin(time*.3+seed*9.)*1.5, .4+fract(seed*13.)*1.6 + sin(time+seed*20.)*.25, cos(seed*57.)*7. + cos(time*.25+seed*5.)*1.5);
        vA = .5+.5*sin(time*2.+seed*30.); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = px*40./-mv.z; }`,
    fragmentShader: 'varying float vA; void main(){ vec2 c=gl_PointCoord-.5; if(max(abs(c.x),abs(c.y))>.5) discard; gl_FragColor = vec4(vec3(1.,.9,.45)*2.*vA, vA); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  m.frustumCulled = false; m.visible = false; scene.add(m);
  return m;
})();

/* ------------------------------------------------------------------ time of day */
const TIMES = {
  morning: { glow: 0.08, sky: 0xa9cbe6, fog: 0xb9d2e4, hemiSky: 0xdbe9ff, hemiGround: 0x6b5a3a, hemi: 1.1, sun: 0xfff1d6, sunI: 2.6, dir: [-0.55, 1, 0.65], fire: 0.35, exp: 1.0, water: [1, 1, 1], glint: [1, 1, 0.95], flies: false, bloom: 0.25 },
  dusk: { glow: 0.18, sky: 0xe39a6a, fog: 0xc98a72, hemiSky: 0xffb68a, hemiGround: 0x3a2a40, hemi: 0.7, sun: 0xff9a52, sunI: 2.4, dir: [0.9, 0.38, 0.45], fire: 0.8, exp: 1.0, water: [1, 0.85, 0.75], glint: [1, 0.7, 0.4], flies: false, bloom: 0.45 },
  night: { sky: 0x121a33, fog: 0x18203a, hemiSky: 0x5a6fb0, hemiGround: 0x15121c, hemi: 0.5, sun: 0x9fb4ff, sunI: 0.6, dir: [-0.45, 1, 0.5], glow: 0.32, fire: 1.6, exp: 1.15, water: [0.45, 0.5, 0.75], glint: [0.6, 0.7, 1], flies: true, bloom: 0.9 },
};
function applyTime() {
  const T = TIMES[S.time];
  scene.background = new THREE.Color(T.sky);
  scene.fog = new THREE.Fog(T.fog, 30, 70);
  hemi.color.set(T.hemiSky); hemi.groundColor.set(T.hemiGround); hemi.intensity = T.hemi;
  sun.color.set(T.sun); sun.intensity = T.sunI;
  sun.userData.dir = new THREE.Vector3(...T.dir).normalize();
  renderer.toneMappingExposure = T.exp;
  if (world) {
    for (const L of world.lights) L.userData.k = T.fire;
    if (world.water) { world.water.material.uniforms.tint.value.setRGB(...T.water); world.water.material.uniforms.glint.value.setRGB(...T.glint); }
  }
  flies.visible = T.flies;
  spriteGlow = T.glow;
  for (const m of spriteMats) m.emissiveIntensity = spriteGlow;
  bloom.strength = T.bloom;
  document.getElementById('b-time').textContent = { morning: 'Morning', dusk: 'Dusk', night: 'Night' }[S.time];
}

/* ------------------------------------------------------------------ detail */
function applyDetail() {
  const high = S.detail === 'high';
  renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 2 : 1.25));
  sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  bloom.enabled = high; hts.enabled = vts.enabled = true;
  document.getElementById('b-detail').textContent = high ? 'High' : 'Light';
  resize();
}

/* ------------------------------------------------------------------ input: keys, touch stick, zoom */
const keys = new Set();
addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT') return;
  keys.add(e.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const stick = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 };
const knob = document.getElementById('knob'), base = document.getElementById('stick');
canvas.addEventListener('pointerdown', e => {
  if (stick.id !== null) return;
  stick.id = e.pointerId; stick.x0 = e.clientX; stick.y0 = e.clientY; stick.dx = stick.dy = 0;
  canvas.setPointerCapture(e.pointerId);
  base.style.left = `${e.clientX}px`; base.style.top = `${e.clientY}px`; base.hidden = false;
  knob.style.transform = 'translate(-50%,-50%)';
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== stick.id) return;
  let dx = e.clientX - stick.x0, dy = e.clientY - stick.y0;
  const len = Math.hypot(dx, dy), max = 46;
  if (len > max) { dx *= max / len; dy *= max / len; }
  stick.dx = dx / max; stick.dy = dy / max;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
});
const endStick = e => { if (e.pointerId === stick.id) { stick.id = null; stick.dx = stick.dy = 0; base.hidden = true; } };
canvas.addEventListener('pointerup', endStick);
canvas.addEventListener('pointercancel', endStick);
const CAMS = { near: { dist: 17, elev: 44 }, far: { dist: 28, elev: 50 }, top: { dist: 30, elev: 89 } };
let camDist = CAMS.near.dist, camElev = CAMS.near.elev, wantDist = camDist, wantElev = camElev;
canvas.addEventListener('wheel', e => { e.preventDefault(); wantDist = THREE.MathUtils.clamp(wantDist * (e.deltaY > 0 ? 1.1 : 0.9), 8, 45); }, { passive: false });

/* ------------------------------------------------------------------ buttons */
const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
document.getElementById('b-time').onclick = () => { S.time = cycle(['morning', 'dusk', 'night'], S.time); applyTime(); };
document.getElementById('b-cam').onclick = () => {
  S.cam = cycle(['near', 'far', 'top'], S.cam);
  wantDist = CAMS[S.cam].dist; wantElev = CAMS[S.cam].elev;
  document.getElementById('b-cam').textContent = { near: 'Close', far: 'Far', top: 'From above' }[S.cam];
};
document.getElementById('b-detail').onclick = () => { S.detail = S.detail === 'high' ? 'light' : 'high'; applyDetail(); buildWorld(S.mapId); };
const pick = document.getElementById('b-map');
for (const [id, m] of Object.entries(MAPS)) pick.add(new Option(m.label, id, false, id === S.mapId));
pick.onchange = () => { S.mapId = pick.value; buildWorld(S.mapId); pick.blur(); };
document.getElementById('hint').textContent = coarse ? 'Drag anywhere to walk' : 'WASD or arrows to walk, Shift to run, mouse wheel to zoom';

/* ------------------------------------------------------------------ nameplates */
const plates = document.getElementById('plates');
const v3 = new THREE.Vector3();
function drawPlates() {
  if (!world) return;
  const lead = world.party[0];
  let html = '';
  for (const a of world.actors) {
    if (a.party || !a.name) continue;
    if (Math.hypot(a.x - lead.x, a.z - lead.z) > 3.2) continue;
    v3.set(a.x, 1.75, a.z).project(camera);
    if (v3.z > 1) continue;
    const x = (v3.x * 0.5 + 0.5) * innerWidth, y = (-v3.y * 0.5 + 0.5) * innerHeight;
    html += `<div class="plate" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px">${a.name}</div>`;
  }
  if (plates.innerHTML !== html) plates.innerHTML = html;
}

/* ------------------------------------------------------------------ the loop */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  composer.setPixelRatio(renderer.getPixelRatio());
  camera.aspect = w / h; camera.updateProjectionMatrix();
  hts.uniforms.h.value = 1.6 / (w * renderer.getPixelRatio());
  vts.uniforms.v.value = 1.6 / (h * renderer.getPixelRatio());
  const px = renderer.getPixelRatio() * h / 800;
  flies.material.uniforms.px.value = px;
  if (fireMesh) fireMesh.material.uniforms.px.value = px;
}
addEventListener('resize', resize);

const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();
let frames = 0, fpsT = 0;
function step(dt, t) {
  if (!world) return;
  const lead = world.party[0];
  // walking
  let ix = 0, iz = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
  ix += stick.dx; iz += stick.dy;
  const mag = Math.min(1, Math.hypot(ix, iz));
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || mag > 0.95 && stick.id !== null;
  if (mag > 0.15) {
    const sp = (run ? 6 : 3.4) * dt * mag / Math.hypot(ix, iz);
    const r = 0.28;
    const free = (x, z) => !world.solid(x - r, z - 0.1) && !world.solid(x + r, z - 0.1) && !world.solid(x - r, z + 0.15) && !world.solid(x + r, z + 0.15)
      && !world.actors.some(a => !a.party && Math.abs(a.x - x) < 0.6 && Math.abs(a.z - z) < 0.45);
    const nx = lead.x + ix * sp, nz = lead.z + iz * sp;
    if (free(nx, lead.z)) lead.x = nx;
    if (free(lead.x, nz)) lead.z = nz;
    lead.face = Math.abs(ix) > Math.abs(iz) ? (ix > 0 ? 'e' : 'w') : (iz > 0 ? 's' : 'n');
    lead.moving = true;
    const last = world.trail[0];
    if (!last || Math.hypot(last[0] - lead.x, last[1] - lead.z) > 0.08) world.trail.unshift([lead.x, lead.z]);
    if (world.trail.length > 200) world.trail.length = 200;
  } else lead.moving = false;
  // the others follow along the leader's trail
  world.party.forEach((a, i) => {
    if (i === 0) return;
    const want = world.trail[Math.min(world.trail.length - 1, i * 8)];
    if (!want) return;
    const dx = want[0] - a.x, dz = want[1] - a.z, d = Math.hypot(dx, dz);
    a.moving = d > 0.02 && lead.moving;
    if (d > 0.01) { a.x += dx * Math.min(1, dt * 12); a.z += dz * Math.min(1, dt * 12); if (d > 0.04) a.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'e' : 'w') : (dz > 0 ? 's' : 'n'); }
  });
  // frames and cards that turn to the camera
  const camYaw = Math.atan2(camera.position.x - camTarget.x, camera.position.z - camTarget.z);
  for (const a of world.actors) {
    a.step += dt * (run ? 11 : 7);
    setFrame(a, a.moving ? [1, 0, 2, 0][Math.floor(a.step) % 4] : 0);
    a.mesh.position.set(a.x, 0, a.z);
  }
  // cards lean back toward the camera (more as it rises), so people read from any height
  const lean = THREE.MathUtils.degToRad(Math.max(0, camElev - 30) * 0.9);
  world.group.traverse(o => { if (o.userData.face) o.rotation.set(-lean, camYaw, 0, 'YXZ'); });
  // camera
  camDist += (wantDist - camDist) * Math.min(1, dt * 5);
  camElev += (wantElev - camElev) * Math.min(1, dt * 5);
  const top = S.cam === 'top';
  const tx = top ? world.W / 2 : lead.x, tz = top ? world.H / 2 : lead.z;
  camTarget.x += (tx - camTarget.x) * Math.min(1, dt * 6);
  camTarget.z += (tz - camTarget.z) * Math.min(1, dt * 6);
  camTarget.y = 0.6;
  const el = THREE.MathUtils.degToRad(camElev);
  // a tall phone screen sees less across, so the camera stands further back
  const narrow = THREE.MathUtils.clamp(1.25 / camera.aspect, 1, 2.2);
  const dist = (top ? Math.max(world.W, world.H) * 1.9 : camDist) * narrow;
  camera.position.set(camTarget.x, camTarget.y + Math.sin(el) * dist, camTarget.z + Math.cos(el) * dist + 0.001);
  camera.lookAt(camTarget);
  if (scene.fog) { scene.fog.near = dist * 1.6; scene.fog.far = dist * 4.2; }
  // the sun follows the view so its shadow map stays sharp where you look
  const span = top ? Math.max(world.W, world.H) * 0.75 : camDist * 1.1 * narrow;
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -span; sc.right = sc.top = span; sc.near = 0.5; sc.far = 120; sc.updateProjectionMatrix();
  sun.target.position.copy(camTarget);
  sun.position.copy(camTarget).addScaledVector(sun.userData.dir, 50);
  // fire, lights, water, fireflies
  for (const L of world.lights) L.intensity = L.userData.base * (L.userData.k ?? 1) * (0.85 + 0.15 * Math.sin(t * 13 + L.position.x) * Math.sin(t * 7.3));
  if (fireMesh) fireMesh.material.uniforms.time.value = t;
  if (world.water) world.water.material.uniforms.time.value = t;
  flies.material.uniforms.time.value = t;
  flies.material.uniforms.center.value.set(lead.x, 0, lead.z);
  // tilt-shift focus follows where the party stands on screen
  hts.uniforms.r.value = vts.uniforms.r.value = top ? 0.5 : 0.47;
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  step(dt, t);
  composer.render();
  drawPlates();
  frames++; fpsT += dt;
  if (fpsT > 1) { document.getElementById('fps').textContent = `${Math.round(frames / fpsT)} fps`; frames = 0; fpsT = 0; }
}

window.__hd2d = { S, get world() { return world; }, buildWorld, applyTime, renderer, camera, keys };
applyDetail();
applyTime();
buildWorld(S.mapId).then(() => { document.getElementById('loading').hidden = true; loop(); });
