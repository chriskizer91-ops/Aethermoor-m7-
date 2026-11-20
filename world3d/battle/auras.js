// Statuses you can see (step 3): each figure on the field carries a few glowing motes for the worst status it has
// (M7's statuses, data/statuses.js): burning flickers up orange, bleeding drips red, rotting and poison rise green, a
// hex circles purple, chill and frost drift blue, a charm glows pink, regeneration rises softly green, a guard holds a
// faint ring at the feet. M7's own chips on the cards and plates still name them; this only shows them on the body.
import * as THREE from 'three';

const KINDS = {
  burning: { c: '#ff9a3c', rise: 1.6, spread: 0.22, flick: 1 },
  bleeding: { c: '#e0402e', rise: -0.9, spread: 0.18 },
  poisoned: { c: '#8ad872', rise: 0.5, spread: 0.25 },
  rotting: { c: '#a8c860', rise: 0.35, spread: 0.3 },
  hexed: { c: '#c89aff', orbit: 1, spread: 0.45 },
  frozen: { c: '#bfe8ff', rise: 0.15, spread: 0.3 },
  chilled: { c: '#8fd3f4', rise: 0.25, spread: 0.3 },
  charmed: { c: '#ff82c8', orbit: 1, spread: 0.35 },
  regenerating: { c: '#8ad872', rise: 0.7, spread: 0.3 },
  frightened: { c: '#d8d0ff', orbit: 1, spread: 0.3 },
  marked: { c: '#ffcb66', orbit: 1, spread: 0.25 },
};
// the order they win in, worst first
const ORDER = ['burning', 'bleeding', 'hexed', 'charmed', 'rotting', 'poisoned', 'frozen', 'chilled', 'frightened', 'marked', 'regenerating'];
let tex = null;
function dot() {
  if (tex) return tex;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  tex = new THREE.CanvasTexture(c); return tex;
}

// one figure's aura: set(statuses) whenever they change, step(dt, t) each frame; height: the figure's height (m)
export function aura(parent, height) {
  const N = 18, pos = new Float32Array(N * 3), seed = Array.from({ length: N }, () => Math.random());
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: 0.09, map: dot(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const pts = new THREE.Points(g, m); pts.visible = false; pts.frustumCulled = false; parent.add(pts);
  let kind = null;
  return {
    set(statuses) {
      const ids = new Set((statuses || []).map((s) => s.id || s));
      kind = ORDER.find((k) => ids.has(k)) || null;
      pts.visible = !!kind; if (kind) m.color.set(KINDS[kind].c);
    },
    step(dt, t) {
      if (!kind) return;
      const K = KINDS[kind], h = height;
      for (let i = 0; i < N; i++) {
        const s = seed[i], ph = (t * 0.6 + s) % 1;
        let x, y, z;
        if (K.orbit) { const a = t * 1.6 + s * 6.283; x = Math.cos(a) * K.spread; z = Math.sin(a) * K.spread; y = h * (0.75 + Math.sin(t * 2 + s * 9) * 0.06); }
        else { const a = s * 6.283; x = Math.cos(a) * K.spread * (0.4 + s * 0.6); z = Math.sin(a) * K.spread * (0.4 + s * 0.6); y = K.rise > 0 ? h * (0.15 + ph * 0.8 * Math.min(1, K.rise)) : h * (0.7 - ph * 0.6); }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      }
      g.attributes.position.needsUpdate = true;
      m.opacity = K.flick ? 0.6 + Math.random() * 0.4 : 0.85; m.size = K.flick ? 0.17 : 0.14;
    },
    dispose() { parent.remove(pts); g.dispose(); m.dispose(); },
  };
}
