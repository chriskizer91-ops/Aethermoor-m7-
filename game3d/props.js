// game3d/props.js: the things in a place that show M7's live state (Together, November 21). The places themselves
// (world3d/coven/places/m7-kit.js) already stand signposts, chests, boards and pedestals where the painting shows them;
// those are fixed. What changes as you play is drawn here, from M7's own state (rules/world.js present):
//   hearth(lit)    a Hearthfire: a fire bowl on the stone pillar the place stands there (Places' m7/convert.mjs: 1.1 m); lit,
//                  a flame that moves and a warm light, cold, grey ash (a Hearthfire you light takes fire then and there)
//   glint()        a soft glint over a chest not yet opened (it goes when the chest is opened)
// Each returns { root, update(t, dt), set?(state) }.
import * as THREE from 'three';

const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.95 });
const ashMat = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 1 });
const emberMat = new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff5a1a, emissiveIntensity: 1.2, roughness: 1 });
function flameTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 92, 4, 32, 80, 60);
  r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.25, 'rgba(255,190,80,.95)'); r.addColorStop(0.6, 'rgba(255,90,20,.55)'); r.addColorStop(1, 'rgba(255,40,0,0)');
  g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(62, 60, 60, 124, 32, 124); g.bezierCurveTo(4, 124, 2, 60, 32, 4); g.fill();
  return new THREE.CanvasTexture(c);
}
let FLAME = null;
const TOP = 1.1;   // the pillar's height (world3d/m7/convert.mjs lamps: hearthfire, h 1.1)

export function hearth(lit) {
  const outer = new THREE.Group(), root = new THREE.Group(); outer.add(root); root.position.y = TOP;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.22, 14, 1, true), stoneMat); bowl.position.y = 0.11; root.add(bowl);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 16), stoneMat); lip.rotation.x = Math.PI / 2; lip.position.y = 0.22; root.add(lip);
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.05, 14), ashMat); bed.position.y = 0.14; root.add(bed);
  const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.05, 12), emberMat); embers.position.y = 0.17; root.add(embers);
  FLAME = FLAME || flameTexture();
  const flames = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75 - i * 0.15, 1.25 - i * 0.2), new THREE.MeshBasicMaterial({ map: FLAME, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.position.y = 0.75 - i * 0.05; m.rotation.y = i * Math.PI / 3; root.add(m); return m;
  });
  const light = new THREE.PointLight(0xffa050, 0, 10, 2); light.position.y = 0.8; root.add(light);
  let on = !!lit;
  function set(v) { on = !!v; embers.visible = on; for (const f of flames) f.visible = on; light.intensity = on ? 2.2 : 0; }
  set(on);
  return {
    root: outer, set,
    update(t) {
      if (!on) return;
      flames.forEach((f, i) => { const k = 1 + Math.sin(t * (7 + i * 2.3) + i) * 0.12 + Math.sin(t * 13.1 + i * 4) * 0.06; f.scale.set(1 + Math.sin(t * 5 + i) * 0.06, k, 1); f.position.y = 0.2 + (0.55 - i * 0.05) * k; });
      light.intensity = 2.0 + Math.sin(t * 9) * 0.25 + Math.sin(t * 23) * 0.15;
      embers.material.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.2;
    },
  };
}

let GLINT = null;
export function glint() {
  if (!GLINT) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,248,210,1)'); r.addColorStop(0.3, 'rgba(255,220,120,.6)'); r.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,240,.9)'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2);
    GLINT = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLINT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(0.5); s.position.y = 0.95;
  const root = new THREE.Group(); root.add(s);
  const ph = Math.random() * 6;
  return { root, update(t) { const k = 0.5 + 0.5 * Math.sin(t * 2.4 + ph); s.material.opacity = 0.35 + 0.65 * k * k; s.scale.setScalar(0.35 + 0.25 * k); s.position.y = 0.9 + Math.sin(t * 1.3 + ph) * 0.06; } };
}
