// Painted standees (November 20, Chris's comparison): each creature stood in 3D as the painting from his model sheet,
// the HD-2D way. The sheet's three views (front, side, back; cut by standees/cut.py) stand on the ground facing the
// camera; which one shows depends on where the camera is round the creature (the side view is mirrored for the other
// side). A normal map worked out from each painting (its outline rounded, its light and dark raised a little) lets the
// scene's lights fall on it, and a soft shadow sits under its feet. It breathes, bobs as it walks, leans into a lunge,
// shakes and flashes when hit, and tips over and fades when it falls.
//
// buildStandee(key, { tall }) returns the same shape as buildBeast ({ group, g, plan, height, parts, update(t, step) }),
// plus: act (set act.lunge and act.fall, each 0..1, and update() poses them), hit() (shake and flash now), view (the
// view showing: 'front', 'side' or 'back').
import * as THREE from 'three';
import { STANDEES } from './standees/pack.js';
import { BEASTS, buildBeast } from './beasts.js';

export const hasStandee = key => !!STANDEES[key];
// creatures that hover above the ground
const FLY = new Set(['gloamwing', 'lamp-moth', 'thunder-roc', 'mirage-wisp', 'wisp-queen', 'marsh-light', 'forge-spark']);
// side views painted facing left (the rest face right)
const FACES_LEFT = new Set([]);

/* ------------------------------------------------------------------ pictures and their normal maps */
const TEX = {};
function viewTextures(key, view) {
  const id = key + '/' + view; if (TEX[id]) return TEX[id];
  const V = STANDEES[key][view], img = new Image();
  const map = new THREE.Texture(img); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const nc = document.createElement('canvas'); nc.width = V.w; nc.height = V.h;
  const normal = new THREE.CanvasTexture(nc);
  img.onload = () => { map.needsUpdate = true; normalFrom(img, nc); normal.needsUpdate = true; };
  img.src = V.url;
  return (TEX[id] = { map, normal, w: V.w, h: V.h });
}
// a height field: the outline blurred (so the edges round over like a pillow) plus a little of the painting's own light
// and dark; its slopes make the normal map
function normalFrom(img, canvas) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h), d = src.data, A = new Float32Array(w * h), L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { A[i] = d[i * 4 + 3] / 255; L[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255; }
  const blur = (a, r) => { const t = new Float32Array(w * h), o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { o[y * w + x] = s / (2 * r + 1); s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; } }
    return o; };
  const r = Math.max(2, Math.round(h / 22));
  let B = blur(blur(A, r), r);
  const Ls = blur(L, 1);
  const H = new Float32Array(w * h); for (let i = 0; i < w * h; i++) H[i] = Math.sqrt(Math.max(0, B[i])) * 1.0 + Ls[i] * 0.22 * A[i];
  const out = g.createImageData(w, h), o = out.data, k = h / 40;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, l = H[y * w + Math.max(0, x - 1)], rr = H[y * w + Math.min(w - 1, x + 1)], u = H[Math.max(0, y - 1) * w + x], dn = H[Math.min(h - 1, y + 1) * w + x];
    let nx = -(rr - l) * k, ny = (dn - u) * k, nz = 1; const s = 1 / Math.hypot(nx, ny, nz);
    o[i * 4] = (nx * s * 0.5 + 0.5) * 255; o[i * 4 + 1] = (ny * s * 0.5 + 0.5) * 255; o[i * 4 + 2] = (nz * s * 0.5 + 0.5) * 255; o[i * 4 + 3] = 255;
  }
  g.putImageData(out, 0, 0);
}
let SHADOW = null;
function shadowTexture() {
  if (SHADOW) return SHADOW;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return (SHADOW = new THREE.CanvasTexture(c));
}

/* ------------------------------------------------------------------ the standee */
export function buildStandee(key, { tall = 1 } = {}) {
  const S = STANDEES[key];
  const group = new THREE.Group(), g = new THREE.Group(); group.add(g);   // g: the creature, facing +z, feet at 0
  const body = new THREE.Group(); g.add(body);                            // body: moved as a whole (bob, hover, lunge)
  const face = new THREE.Group(); body.add(face);                         // face: turned to the camera
  const pose = new THREE.Group(); face.add(pose);                         // pose: leans and squashes in the picture's plane
  const views = {}, mats = {};
  for (const v of ['front', 'side', 'back']) {
    const T = viewTextures(key, v);
    mats[v] = new THREE.MeshStandardMaterial({ map: T.map, normalMap: T.normal, normalScale: new THREE.Vector2(1, 1), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.82, metalness: 0, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 0 });
    const W = tall * T.w / T.h, geo = new THREE.PlaneGeometry(W, tall); geo.translate(0, tall / 2, 0);
    const m = new THREE.Mesh(geo, mats[v]); m.castShadow = true; m.visible = v === 'front';
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: T.map, alphaTest: 0.45 });
    pose.add(m); views[v] = { mesh: m, w: W };
  }
  // the soft shadow under it, as long as the side view and as wide as the front
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.004; shadow.scale.set(views.front.w * 1.05, views.side.w * 0.95, 1); shadow.renderOrder = -1; g.add(shadow);
  const fly = FLY.has(key), lift = fly ? tall * 0.18 : 0;
  const self = {
    group, g, plan: 'standee', standee: true, height: tall + lift, palette: null, sculpted: false,
    parts: { body, face, pose, shadow, views }, act: { lunge: 0, fall: 0 }, view: 'front', mirror: false, hitAt: -1, t: 0,
    hit() { self.hitAt = self.t; },
    update(t, step = 0) {
      self.t = t;
      const br = Math.sin(t * 2.1), walk = step ? Math.abs(Math.sin(step)) : 0, L = self.act.lunge || 0, F = self.act.fall || 0;
      // hover and bob
      body.position.set(0, lift + (fly ? Math.sin(t * 1.8) * tall * 0.04 : 0) + walk * tall * 0.035, 0);
      // a lunge: crouch, then spring forward along the way it faces, then back
      const crouch = L < 0.3 ? Math.sin(L / 0.3 * Math.PI / 2) : 0, spring = L >= 0.3 ? Math.sin((L - 0.3) / 0.7 * Math.PI) : 0;
      body.position.z = spring * tall * 0.35;
      // squash and stretch: breathing, the crouch, the spring
      const sy = 1 + br * 0.018 - crouch * 0.1 + spring * 0.06, sx = 1 - br * 0.01 + crouch * 0.07 - spring * 0.03;
      pose.scale.set(sx, sy, 1);
      // lean into the step, the lunge (toward the way it faces in the picture), the fall (over backward)
      const fwd = self.view === 'side' ? (self.mirror ? 1 : -1) : 0;
      pose.rotation.z = (step ? Math.sin(step) * 0.035 : 0) + fwd * (spring * 0.18 - crouch * 0.05) - (fwd || 1) * F * F * 1.45;
      // hit: a shake and a white flash
      const since = self.hitAt >= 0 ? t - self.hitAt : 9, flash = since < 0.6 ? Math.exp(-since * 7) : 0;
      pose.position.x = flash * Math.sin(t * 70) * tall * 0.035;
      // fading as it falls
      const fade = F > 0.45 ? 1 - (F - 0.45) / 0.55 : 1;
      for (const v of Object.keys(mats)) { const m = mats[v]; m.emissiveIntensity = flash * 1.2; m.emissive.setRGB(1, 0.85 + flash * 0.15, 0.8); if (fade < 1 !== m.transparent) { m.transparent = fade < 1; m.needsUpdate = true; } m.opacity = fade; }
      shadow.material.opacity = fade * (fly ? 0.55 : 1) * (1 - F * 0.5);
      // the page decides whether it casts a shadow (the arena turns them off); a fading standee stops casting
      for (const v of Object.values(views)) { const m = v.mesh; if (m.userData.cast === undefined) m.userData.cast = m.castShadow; m.castShadow = m.userData.cast && fade > 0.5; }
      const ss = fly ? 0.75 + Math.sin(t * 1.8) * 0.05 : 1; shadow.scale.set(views.front.w * 1.05 * ss, views.side.w * 0.95 * ss, 1);
    },
  };
  // before each draw: turn to the camera, and show the view for where the camera stands round the creature
  const cam = new THREE.Vector3();
  const onBefore = (renderer, scene, camera) => {
    if (!camera.isPerspectiveCamera) return; // the shadow's own camera keeps the last frame's turn
    cam.setFromMatrixPosition(camera.matrixWorld); g.worldToLocal(cam);
    const yaw = Math.atan2(cam.x, cam.z), a = Math.abs(yaw), h = 0.1;
    let v = self.view;
    if (v === 'front' ? a > Math.PI / 4 + h : v === 'back' ? a < Math.PI * 3 / 4 - h : (a < Math.PI / 4 - h || a > Math.PI * 3 / 4 + h)) v = a < Math.PI / 4 ? 'front' : a > Math.PI * 3 / 4 ? 'back' : 'side';
    if (v !== self.view) { views[self.view].mesh.visible = false; views[v].mesh.visible = true; self.view = v; }
    self.mirror = v === 'side' && ((yaw > 0) !== FACES_LEFT.has(key));
    face.rotation.y = yaw; pose.scale.x = Math.abs(pose.scale.x) * (self.mirror ? -1 : 1);
    face.updateMatrixWorld(true);
  };
  for (const v of Object.values(views)) v.mesh.onBeforeRender = onBefore;
  return self;
}

// For the Fight (world3d/battle/arena.js setBeastLook): fn(key, sprite, opts) -> the painted standee, at the beast's own
// size, or the code-built beast if a creature has no sheet.  setBeastLook(standeeLook)
export function standeeLook(key, sprite, opts = {}) {
  return hasStandee(key) ? buildStandee(key, { tall: BEASTS[key]?.[2] || 1 }) : buildBeast(key, sprite, opts);
}
