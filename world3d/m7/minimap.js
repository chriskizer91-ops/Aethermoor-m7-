// minimap.js (Places, November 21): the place map. Chris: "a mini map for a more detailed map than the Atlas continent
// map, a mini map that gives you orientation for where you are in a location."
//   the small map   a rounded square in the top left: the place's own M7 painting round the party, the party's mark with
//                   an arrow for the way the leader faces, a faint cone for where the camera looks, the ways out at the
//                   edge, N for north (north stays up). Tap it for the big map.
//   the big map     the whole place: its name, the ways out named for where they lead, doors, stairs, people (named; a
//                   shop's keeper marked), chests (closed or opened), the Hearthfire, and the story's next goal when the
//                   game passes one. A Back button.
// A 2D canvas over the 3D: the painting is drawn once per place, the small map redrawn about 7 times a second on a
// timer (never in the frame loop), nothing added to the 3D.
//
//   const map = M7_MINIMAP.create({ root, W, place })     root: the element to sit in; W: the walker; place: W3D_PLACES['m7-<id>']
//   map.setPlace(place)                                    after the walker moves on to another place
//   map.set({ people, chests, goal, kindled })             live marks from the game (each optional):
//       people:  [npcId, ...] the people shown now (default: everyone in the place's data)
//       chests:  { chestId: true } the ones already opened (drawn open)
//       goal:    { at: [px, py], label } | null           the story's next goal in this place (a star)
//       kindled: [hearthfireId, ...] lit Hearthfires (others drawn cold)
//   map.open(true | false)   the big map;  map.hide(true | false)   hides both (fights, talk, the Atlas)
//   map.destroy()
(function (G) {
  'use strict';
  const CSS = `
.m7mm{position:absolute;left:calc(12px + env(safe-area-inset-left,0px));top:calc(12px + env(safe-area-inset-top,0px));z-index:5;width:clamp(124px,22vmin,150px);height:clamp(124px,22vmin,150px);border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.55);border:1px solid rgba(255,226,170,.55);background:#0c0b18;cursor:pointer;touch-action:manipulation;padding:0;appearance:none}
.m7mm canvas{width:100%;height:100%;display:block}
.m7mm:focus-visible,.m7big button:focus-visible{outline:2px solid #ffd27a;outline-offset:2px}
.m7mm[hidden],.m7big[hidden]{display:none!important}
.m7big{position:fixed;inset:0;z-index:30;background:rgba(8,8,20,.94);display:flex;flex-direction:column;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));box-sizing:border-box;color:#f1eeff;font:14px system-ui,sans-serif}
.m7big header{display:flex;align-items:center;gap:10px;width:100%;max-width:1000px}
.m7big h2{flex:1;margin:0;font:400 22px/1.15 Georgia,"IM Fell English",serif;min-width:0}
.m7big h2 small{display:block;font:13px system-ui,sans-serif;color:#cfc9ef}
.m7big button{appearance:none;min-height:44px;min-width:44px;padding:0 18px;border-radius:22px;border:1px solid rgba(255,214,150,.6);background:rgba(28,20,16,.85);color:#ffe6a8;font:600 15px Georgia,serif;cursor:pointer}
.m7big .m7wrap{flex:1;min-height:0;width:100%;display:grid;place-items:center}
.m7big canvas{max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 4px 30px rgba(0,0,0,.6)}
.m7big .m7key{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;font-size:12.5px;color:#d8d2f4;max-width:1000px}
.m7big .m7key span{display:inline-flex;align-items:center;gap:6px}
.m7big .m7key i{display:inline-block;width:11px;height:11px;border-radius:50%}`;
  let styled = false;
  const TAU = Math.PI * 2;
  const COL = { exit: '#ffd27a', person: '#9fd4ff', shop: '#7dffb0', chest: '#e8b84a', open: '#8a8a8a', fire: '#ff8a3a', cold: '#9aa0b0', door: '#d8a070', stair: '#ffffff', goal: '#fff36a', party: '#ffffff' };

  function create(opt) {
    if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
    const root = opt.root || document.body, W = opt.W;
    let place = opt.place, img = null, marks = { people: null, chests: {}, goal: null, kindled: null }, hidden = false, bigOn = false;
    const small = document.createElement('button'); small.type = 'button'; small.className = 'm7mm'; small.setAttribute('aria-label', 'The map of this place (tap for the whole map)');
    const sc = document.createElement('canvas'); small.appendChild(sc); root.appendChild(small);
    const big = document.createElement('div'); big.className = 'm7big'; big.hidden = true; big.setAttribute('role', 'dialog');
    big.innerHTML = '<header><h2><span class="m7name"></span><small class="m7where"></small></h2><button type="button" class="m7back">Back</button></header><div class="m7wrap"><canvas></canvas></div><div class="m7key"></div>';
    document.body.appendChild(big);
    const bc = big.querySelector('canvas'), key = big.querySelector('.m7key');
    key.innerHTML = [['exit', 'ways out'], ['person', 'people'], ['shop', 'shops'], ['chest', 'chests'], ['fire', 'Hearthfire'], ['door', 'doors'], ['stair', 'stairs'], ['goal', 'goal']].map(([k, w]) => `<span><i style="background:${COL[k]}"></i>${w}</span>`).join('');
    small.addEventListener('click', () => api.open(true));
    big.querySelector('.m7back').addEventListener('click', () => api.open(false));
    big.addEventListener('keydown', (e) => { if (e.key === 'Escape') api.open(false); });

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    function load() {
      img = null; const src = place && (place.paintingSrc || place.painting); if (!src) return;
      const im = new Image(); im.onload = () => { if ((place.paintingSrc || place.painting) === src) { img = im; draw(); if (bigOn) drawBig(); } }; im.src = src;
    }
    const D = () => (G.M7_PLACES || {})[place.m7] || place;
    // the party: where the leader stands, the way it faces, the way the camera looks (all in painting px)
    function party() {
      const io = W && W.io; if (!io) return null;
      let cam = null; if (W.cam) { const v = new THREE.Vector3(); W.cam.getWorldDirection(v); const L = Math.hypot(v.x, v.z); if (L > 1e-3) cam = [v.x / L, v.z / L]; }
      return { x: io.px, y: io.py, face: [Math.sin(io.yaw || 0), Math.cos(io.yaw || 0)], cam };
    }
    function arrow(g, x, y, f, cam, s) {
      if (cam) { const a = Math.atan2(cam[1], cam[0]); g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, s * 5.5, a - 0.5, a + 0.5); g.closePath(); g.fill(); }
      const a = Math.atan2(f[1], f[0]);
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = COL.party; g.strokeStyle = '#1a1420'; g.lineWidth = s * 0.45;
      g.beginPath(); g.moveTo(s * 1.9, 0); g.lineTo(-s * 1.1, s * 1.1); g.lineTo(-s * 0.5, 0); g.lineTo(-s * 1.1, -s * 1.1); g.closePath(); g.stroke(); g.fill(); g.restore();
    }
    function dot(g, x, y, r, col) { g.fillStyle = col; g.strokeStyle = 'rgba(10,8,20,0.85)'; g.lineWidth = Math.max(1, r * 0.4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); }
    function diamond(g, x, y, r, col) { g.fillStyle = col; g.strokeStyle = 'rgba(10,8,20,0.85)'; g.lineWidth = Math.max(1, r * 0.35); g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill(); g.stroke(); }
    function star(g, x, y, r) { g.fillStyle = COL.goal; g.strokeStyle = '#3a2a00'; g.lineWidth = r * 0.25; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); }
    const exitAt = (e) => [(e.rect[0] + e.rect[2]) / 2, (e.rect[1] + e.rect[3]) / 2];

    // ---- the small map: about 18 tiles across, round the party ----
    function draw() {
      if (hidden || !place) return;
      const k = dpr(), Wd = Math.round(small.clientWidth * k) || 280, Hd = Math.round(small.clientHeight * k) || 280;
      if (sc.width !== Wd || sc.height !== Hd) { sc.width = Wd; sc.height = Hd; }
      const g = sc.getContext('2d'), [pw, ph] = place.size, pp = party(); g.fillStyle = '#0c0b18'; g.fillRect(0, 0, Wd, Hd);
      const span = Math.min(Math.max(pw, ph), 900), s = Wd / span, hs = span / 2;
      // keep the window over the painting where it can (Aethermoor, Places)
      const clampC = (v, full) => (full <= span ? full / 2 : Math.max(hs, Math.min(full - hs, v)));
      const cx = clampC(pp ? pp.x : pw / 2, pw), cy = clampC(pp ? pp.y : ph / 2, ph);
      const X = (x) => (x - cx) * s + Wd / 2, Y = (y) => (y - cy) * s + Hd / 2;
      if (img) g.drawImage(img, X(0), Y(0), pw * s, ph * s);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, Wd, Hd);
      for (const e of place.exits || []) { const [x, y] = exitAt(e); const ex = Math.max(8 * k, Math.min(Wd - 8 * k, X(x))), ey = Math.max(8 * k, Math.min(Hd - 8 * k, Y(y))); diamond(g, ex, ey, 5 * k, COL.exit); }
      if (marks.goal && marks.goal.at) { const gx = Math.max(9 * k, Math.min(Wd - 9 * k, X(marks.goal.at[0]))), gy = Math.max(9 * k, Math.min(Hd - 9 * k, Y(marks.goal.at[1]))); star(g, gx, gy, 7 * k); }
      if (pp) arrow(g, X(pp.x), Y(pp.y), pp.face, pp.cam, 4.5 * k);
      g.font = `700 ${11 * k}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(10,8,20,0.7)'; g.beginPath(); g.arc(Wd - 12 * k, 12 * k, 8 * k, 0, TAU); g.fill(); g.fillStyle = '#ffe6a8'; g.fillText('N', Wd - 12 * k, 12.5 * k);
    }
    // ---- the big map: the whole place and everything in it, named ----
    function drawBig() {
      if (!place) return;
      const d = D(), k = dpr(), [pw, ph] = place.size, wrap = big.querySelector('.m7wrap'), aw = wrap.clientWidth, ah = wrap.clientHeight;
      const s = Math.min(aw / pw, ah / ph), cw = Math.max(1, Math.floor(pw * s)), ch = Math.max(1, Math.floor(ph * s));
      bc.style.width = cw + 'px'; bc.style.height = ch + 'px'; bc.width = cw * k; bc.height = ch * k;
      const g = bc.getContext('2d'), S = s * k, X = (x) => x * S, Y = (y) => y * S;
      g.fillStyle = '#0c0b18'; g.fillRect(0, 0, bc.width, bc.height); if (img) g.drawImage(img, 0, 0, bc.width, bc.height);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, bc.width, bc.height);
      const r = 6 * k;   // a mark's size on the screen, whatever the place's size
      const labels = [];
      const label = (text, x, y, col) => labels.push([text, x, y, col]);
      for (const p of d.doors || []) diamond(g, X(p[0]), Y(p[1]), r * 0.6, COL.door);
      for (const p of d.stairs || []) { g.fillStyle = COL.stair; for (let i = 0; i < 3; i++) g.fillRect(X(p[0]) - r * 0.8, Y(p[1]) - r * 0.8 + i * r * 0.6, r * 1.6, r * 0.32); }
      for (const t of d.things || []) if (t[2] === 'chest') { const open = t[4] && marks.chests[t[4]]; g.fillStyle = open ? COL.open : COL.chest; g.strokeStyle = 'rgba(10,8,20,0.9)'; g.lineWidth = k; g.fillRect(X(t[0]) - r * 0.75, Y(t[1]) - r * 0.55, r * 1.5, r * 1.1); g.strokeRect(X(t[0]) - r * 0.75, Y(t[1]) - r * 0.55, r * 1.5, r * 1.1); }
      for (const hf of d.hearthfires || []) { const lit = marks.kindled ? marks.kindled.includes(hf.id) : !hf.cold; dot(g, X(hf.at[0]), Y(hf.at[1]), r * 1.1, lit ? COL.fire : COL.cold); label(hf.name, X(hf.at[0]), Y(hf.at[1]) - r * 2.1, lit ? COL.fire : COL.cold); }
      const showP = marks.people;
      for (const p of place.people || []) {
        if (showP && !showP.includes(p.npc) && !showP.includes(p.id)) continue;
        dot(g, X(p.at[0]), Y(p.at[1]), r * 0.85, p.shop ? COL.shop : COL.person);
        if (p.name) label(p.shop ? p.name + ' · ' + p.shop : p.name, X(p.at[0]), Y(p.at[1]) - r * 1.8, p.shop ? COL.shop : COL.person);
      }
      for (const e of place.exits || []) { const [x, y] = exitAt(e), ex = Math.max(r * 1.4, Math.min(bc.width - r * 1.4, X(x))), ey = Math.max(r * 1.4, Math.min(bc.height - r * 1.4, Y(y))); diamond(g, ex, ey, r * 1.2, COL.exit); label('To ' + e.label, ex, ey + (ey < bc.height / 2 ? r * 2.6 : -r * 2.4), COL.exit); }
      if (marks.goal && marks.goal.at) { star(g, X(marks.goal.at[0]), Y(marks.goal.at[1]), r * 1.6); if (marks.goal.label) label(marks.goal.label, X(marks.goal.at[0]), Y(marks.goal.at[1]) - r * 2.6, COL.goal); }
      const pp = party(); if (pp) arrow(g, X(pp.x), Y(pp.y), pp.face, pp.cam, r * 0.9);
      // the names, over everything, each in a dark outline so it reads on any painting; one that would overlap a name
      // already placed is left off (tap targets stay clear; the key names the kinds)
      g.font = `600 ${Math.round(11.5 * k)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      const taken = [];
      for (const [t, x, y, col] of labels) {
        const w = g.measureText(t).width + 6 * k, h = 15 * k, lx = Math.max(w / 2, Math.min(bc.width - w / 2, x)), ly = Math.max(h / 2, Math.min(bc.height - h / 2, y));
        const box = [lx - w / 2, ly - h / 2, w, h]; if (taken.some((q) => box[0] < q[0] + q[2] && q[0] < box[0] + box[2] && box[1] < q[1] + q[3] && q[1] < box[1] + box[3])) continue; taken.push(box);
        g.strokeStyle = 'rgba(8,6,16,0.92)'; g.lineWidth = 3.5 * k; g.strokeText(t, lx, ly); g.fillStyle = col; g.fillText(t, lx, ly);
      }
    }
    let timer = 0;
    const tick = () => { if (!hidden && !bigOn && !document.hidden) draw(); };
    const api = {
      setPlace(p) { place = p; marks.people = null; marks.goal = null; load(); draw(); if (bigOn) drawBig(); },
      set(m) { Object.assign(marks, m || {}); if (m && m.chests) marks.chests = Object.assign({}, m.chests); draw(); if (bigOn) drawBig(); },
      open(on) {
        bigOn = !!on && !hidden; big.hidden = !bigOn;
        if (bigOn) { big.querySelector('.m7name').textContent = place.name || ''; const d = D(); big.querySelector('.m7where').textContent = [d.region && d.region !== 'verdant' ? d.region[0].toUpperCase() + d.region.slice(1) : 'The Verdant Wilds', (d.interior && (!place.lightName || place.lightName === 'indoor' || place.lightName === 'dark')) ? 'indoors' : ''].filter(Boolean).join(' · '); if (W && W.pause) W.pause(true); requestAnimationFrame(drawBig); big.querySelector('.m7back').focus(); }
        else { if (W && W.pause && W.paused) W.pause(false); small.focus({ preventScroll: true }); }
        return bigOn;
      },
      hide(on) { hidden = !!on; small.hidden = hidden; if (hidden && bigOn) api.open(false); if (!hidden) draw(); return hidden; },
      get isOpen() { return bigOn; }, get hidden() { return hidden; },
      redraw() { draw(); if (bigOn) drawBig(); },
      destroy() { clearInterval(timer); window.removeEventListener('resize', onResize); small.remove(); big.remove(); },
    };
    const onResize = () => { draw(); if (bigOn) drawBig(); };
    window.addEventListener('resize', onResize);
    timer = setInterval(tick, 140);   // about 7 times a second
    load(); draw();
    return api;
  }
  G.M7_MINIMAP = { create };
})(window);
