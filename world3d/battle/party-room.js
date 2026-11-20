// The Party screen (November 20, step 2): M7's own party screen (game/src/ui/screens/party.js: tabs, stats, equipment,
// the bag, skills), every word as it is, over the paused walk; in its hero box the hero stands in 3D in their gear,
// turning slowly (drag to turn them yourself), in place of the 2D figure. Equip a piece and the box is redrawn, so
// the 3D hero is rebuilt in the new gear.
//   await openParty({ host, ctx, input, figure })   figure(heroId) -> a fresh actor (world3d/heroes.js actor())
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as partyScreen from '../../game/src/ui/screens/party.js';

let K = null; // one small renderer for every visit
function kit() {
  if (K) return K;
  const canvas = document.createElement('canvas'); canvas.className = 'f3-turn';
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x2a1a10, 0.7));
  const key = new THREE.DirectionalLight(0xffd6a8, 2.4); key.position.set(2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 1.6); rim.position.set(-3, 2.5, -3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.75, 48), new THREE.MeshStandardMaterial({ color: 0x3a2a1f, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.7, 48), new THREE.MeshBasicMaterial({ color: 0xee8e31, transparent: true, opacity: 0.55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.003; scene.add(ring);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 30);
  K = { canvas, renderer, scene, cam, actor: null, raf: 0, yaw: 0.5, spin: 0.35, drag: null };
  canvas.addEventListener('pointerdown', (e) => { K.drag = { x: e.clientX, yaw: K.yaw }; K.spin = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (K.drag) K.yaw = K.drag.yaw + (e.clientX - K.drag.x) * 0.012; });
  canvas.addEventListener('pointerup', () => { K.drag = null; });
  return K;
}

export function openParty({ host, ctx, input, figure, hero = 'warden' }) {
  return new Promise((resolve) => {
    const k = kit();
    host.replaceChildren(); host.hidden = false; host.classList.add('party-room');
    const main = document.createElement('main'); main.className = 'screen screen-party'; host.append(main);
    let screen = null, off = null, shown = '';
    const pctx = Object.create(ctx, { go: { value: () => close() } });
    // whenever M7 draws the hero box, the 3D hero goes in it (the selected tab says who)
    const mo = new MutationObserver(() => place());
    function place() {
      const view = host.querySelector('.hero-view'); if (!view) return;
      const id = (host.querySelector('.tab[aria-selected="true"]')?.id || '').replace(/^tab-/, '') || hero;
      const key = id + JSON.stringify(ctx.game.party.roster[id]?.gear || {});
      if (k.canvas.parentElement !== view) { view.classList.add('f3-has-turn'); view.append(k.canvas); }
      if (key === shown) return;
      shown = key;
      if (k.actor) k.scene.remove(k.actor.root);
      k.actor = figure(id); k.actor.root.position.set(0, 0, 0); k.scene.add(k.actor.root);
      size();
    }
    function size() {
      const r = k.canvas.parentElement?.getBoundingClientRect(); if (!r || !r.width) return;
      const w = Math.round(r.width), h = Math.round(Math.max(r.height, w * 1.15));
      k.renderer.setSize(w, h, false); k.canvas.style.width = `${w}px`; k.canvas.style.height = `${h}px`;
      k.cam.aspect = w / h; k.cam.updateProjectionMatrix();
    }
    let last = performance.now();
    const loop = (now) => {
      k.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!k.drag) { k.spin = Math.min(0.35, k.spin + dt * 0.1); k.yaw += dt * k.spin; }
      if (k.actor) { k.actor.root.rotation.y = k.yaw; k.actor.animate(0, 0, now / 1000, dt); }
      const box = k.actor && new THREE.Box3().setFromObject(k.actor.root), tall = box ? box.max.y : 1.8;
      k.cam.position.set(0, tall * 0.62, tall * 2.6); k.cam.lookAt(0, tall * 0.48, 0);
      k.renderer.render(k.scene, k.cam);
    };
    function close() {
      mo.disconnect(); cancelAnimationFrame(k.raf); removeEventListener('resize', size);
      if (screen && screen.unmount) screen.unmount(); if (off) off();
      if (k.actor) { k.scene.remove(k.actor.root); k.actor = null; }
      host.hidden = true; host.classList.remove('party-room'); host.replaceChildren(); resolve();
    }
    screen = partyScreen.mount(main, pctx, { hero, from: 'world' }) || {};
    if (screen.onAction && input) off = input.onAction(screen.onAction);
    mo.observe(main, { childList: true, subtree: true });
    addEventListener('resize', size);
    place();
    k.raf = requestAnimationFrame(loop);
  });
}
