// atlas.js (Places, step 3, November 20): the Atlas. The 3D continent (continent/map/map3d.js, Envoi's map, copied)
// as Hearth & Heirloom's atlas: every stop of M7's story pinned where the story map puts it (m7/atlas-data.js, made from
// docs/lore/places.json and M7's maps), the six regions under M7's names, the party's pin where it stands, and the
// Hearthfires: a kindled one can be tapped to travel to it.
//
//   M7_ATLAS.open({ at, kindled, title }) -> Promise<{ place, hearthfire } | null>
//     at        the M7 map id the party is in ('thornhollow'); its stop gets the party's pin. Optional.
//     kindled   the Hearthfire ids the party has lit (M7's flags), or 'all'. Those are the ones it can travel to.
//     title     the words at the top (default: 'The atlas of Aethermoor').
//   Resolves with the chosen Hearthfire ({ place: the M7 map it's in, hearthfire: its id; the game stands the party on
//   its stand, as M7's own travel does }), or null when the player goes back without choosing.
//   M7_ATLAS.close()   closes it (resolving null). M7_ATLAS.isOpen.
//
// Needs on the page: THREE (heroes.js), continent/world.js, continent/map/{places,art,moods,tree-models,buildings,
// place-models,map3d}.js, names.js and m7/atlas-data.js. It makes its own layer over the page (z-index 60) and its own
// styles; the map is made the first time it opens and kept (it stops drawing while closed).
(function (G) {
  'use strict';
  const D = G.M7_ATLAS_DATA, AW = 4608, AH = 3072;
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const CSS = `
#m7atlas{position:fixed;inset:0;z-index:60;display:none;background:#0b0d22;color:#f1eeff;font:15px/1.35 "Atkinson Hyperlegible",system-ui,sans-serif;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#m7atlas.on{display:block}
#m7atlas .ma-map{position:absolute;inset:0}
#m7atlas .ma-map canvas{position:absolute;inset:0;display:block;touch-action:none}
#m7atlas .map-tag:not(.io){display:none!important}
#m7atlas .map-tag.io{translate:-50% -100%;margin-top:-26px;display:flex;flex-direction:column;align-items:center;padding:5px 12px 6px;border-radius:14px;background:rgba(18,15,44,.8);border:1px solid rgba(214,206,255,.55);position:absolute;left:0;top:0;white-space:nowrap}
#m7atlas .map-tag.io b{font:700 14px/1 system-ui,sans-serif;color:#fff}
#m7atlas .map-tag.io span{font:13px/1.15 Georgia,serif;color:#e7e2ff}
#m7atlas .map-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#m7atlas .ma-pins{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#m7atlas .ma-pin{position:absolute;left:0;top:0;pointer-events:auto;appearance:none;border:0;background:none;padding:0;min-width:44px;min-height:44px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;translate:-50% -100%;cursor:pointer;color:#f3eedc}
#m7atlas .ma-dot{width:12px;height:12px;border-radius:50%;border:2px solid rgba(10,10,24,.85);box-shadow:0 0 8px rgba(0,0,0,.6)}
#m7atlas .ma-fire{font-size:20px;line-height:1;filter:drop-shadow(0 0 6px rgba(255,170,60,.9))}
#m7atlas .ma-pin.cold .ma-fire{filter:grayscale(1) brightness(.7);opacity:.75}
#m7atlas .ma-name{font:13px Georgia,"IM Fell English",serif;text-shadow:0 0 4px #000,0 1px 3px #000;white-space:nowrap;margin-bottom:3px}
#m7atlas .ma-pin.far .ma-name{display:none}
#m7atlas .ma-region{position:absolute;left:0;top:0;translate:-50% -50%;font:22px Georgia,"IM Fell English",serif;letter-spacing:.05em;white-space:nowrap;text-shadow:0 0 6px #000,0 0 14px rgba(0,0,0,.9);pointer-events:none}
#m7atlas .ma-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:10px;align-items:center;padding:calc(10px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 10px max(12px,env(safe-area-inset-left,0px));background:linear-gradient(rgba(8,8,22,.85),rgba(8,8,22,0))}
#m7atlas .ma-title{flex:1;min-width:0;font:20px/1.15 Georgia,"IM Fell English",serif}
#m7atlas .ma-title small{display:block;font:13px system-ui,sans-serif;color:#cfc9ef}
#m7atlas .ma-btn{appearance:none;min-height:44px;padding:0 16px;border-radius:22px;border:1px solid rgba(214,222,255,.45);background:rgba(14,14,36,.72);color:#eee8ff;font:15px system-ui,sans-serif;cursor:pointer}
#m7atlas .ma-btn:focus-visible,#m7atlas .ma-pin:focus-visible{outline:2px solid #ffd27a;outline-offset:2px}
#m7atlas .ma-btn.go{background:rgba(150,104,30,.85);border-color:rgba(255,220,150,.75);color:#fff}
#m7atlas .ma-card{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));translate:-50% 0;z-index:3;width:min(440px,calc(100% - 24px));box-sizing:border-box;padding:14px 16px 16px;border-radius:18px;background:rgba(14,13,36,.92);border:1px solid rgba(214,222,255,.3);box-shadow:0 8px 30px rgba(0,0,0,.5)}
#m7atlas .ma-card[hidden]{display:none}
#m7atlas .ma-card h3{margin:0 40px 2px 0;font:22px/1.15 Georgia,"IM Fell English",serif;font-weight:400}
#m7atlas .ma-card .ma-sub{font-size:13px;color:#cfc9ef;margin-bottom:10px}
#m7atlas .ma-card .ma-maps{font-size:13px;color:#dcd6f6;margin-bottom:10px}
#m7atlas .ma-card .ma-fires{display:flex;flex-direction:column;gap:8px}
#m7atlas .ma-card .ma-cold{font-size:14px;color:#a9a3cc;min-height:30px;display:flex;align-items:center}
#m7atlas .ma-x{position:absolute;right:8px;top:8px;width:44px;height:44px;border-radius:22px;border:0;background:none;color:#cfc9ef;font:22px system-ui;cursor:pointer}
#m7atlas .ma-load{position:absolute;inset:0;z-index:4;display:grid;place-items:center;background:#0b0d22;font:italic 20px Georgia,serif;color:#d9d4f5;transition:opacity .6s;text-align:center;padding:0 24px}
@media (prefers-reduced-motion:reduce){#m7atlas .ma-load{transition:none}}`;

  let root = null, map = null, mapReady = null, pins = [], regions = [], resolveOpen = null, raf = 0, want = null;
  const stopOf = (mapId) => D.stops.find((s) => s.maps.some((m) => m.id === mapId)) || null;

  function build() {
    const st = el('style', null, document.head); st.textContent = CSS;
    root = el('div', null, document.body); root.id = 'm7atlas'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'The atlas of Aethermoor');
    const host = el('div', 'ma-map', root);
    const pinLayer = el('div', 'ma-pins', root);
    const top = el('div', 'ma-top', root);
    const title = el('div', 'ma-title', top); root._title = el('span', null, title); root._sub = el('small', null, title);
    const find = el('button', 'ma-btn', top, 'Find the party'); find.type = 'button';
    find.onclick = () => { if (map && want && want.at) map.findIo(); else if (map) overview(); };
    const back = el('button', 'ma-btn', top, 'Back'); back.type = 'button'; back.onclick = () => finish(null);
    const card = el('div', 'ma-card', root); card.hidden = true; root._card = card;
    root._load = el('div', 'ma-load', root, 'Unrolling the atlas of Aethermoor…');
    // the regions' names, over the middle of their stops
    for (const [k, r] of Object.entries(D.regions)) {
      const ss = D.stops.filter((s) => s.region === k); if (!ss.length) continue;
      const cx = ss.reduce((a, s) => a + s.at[0], 0) / ss.length, cy = ss.reduce((a, s) => a + s.at[1], 0) / ss.length;
      const d = el('div', 'ma-region', pinLayer, r.name); d.style.color = r.color;
      regions.push({ d, at: k === 'below' ? [cx, cy + 120] : k === 'keep' ? [cx, cy - 110] : [cx, cy - 90] });
    }
    // a pin for every stop: a flame where it has a Hearthfire, a dot coloured by its region otherwise
    for (const s of D.stops) {
      const fires = s.maps.flatMap((m) => m.hearthfires.map((h) => Object.assign({ place: m.id }, h)));
      const b = el('button', 'ma-pin', pinLayer); b.type = 'button';
      el('span', 'ma-name', b, s.name);
      if (fires.length) el('span', 'ma-fire', b, '\u{1F525}'); else { const dot = el('span', 'ma-dot', b); dot.style.background = (D.regions[s.region] || {}).color || '#ccc'; }
      b.onclick = (e) => { e.stopPropagation(); showCard(s, fires); };
      pins.push({ s, b, fires });
    }
    WorldMapReady(host);
  }
  function WorldMapReady(host) {
    const big = Math.min(screen.width, screen.height) >= 700 && matchMedia('(pointer: fine)').matches;
    map = G.WorldMap.create(host, { art: G.MAP_ART, detail: big ? 'laptop' : 'phone', open: [1, 2, 3, 4], pinName: 'The party' });
    mapReady = map.ready.then(() => { map.mist(0); root._load.style.opacity = 0; setTimeout(() => { root._load.style.display = 'none'; }, 650); });
  }
  function overview() { return map.flyTo(AW * 0.56, AH * 0.52, 5200, undefined, 0, 1.05); }

  function showCard(s, fires) {
    const c = root._card; c.innerHTML = ''; c.hidden = false;
    const x = el('button', 'ma-x', c, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = () => { c.hidden = true; };
    el('h3', null, c, s.name);
    const r = D.regions[s.region] || {}; el('div', 'ma-sub', c, [r.name, r.act].filter(Boolean).join(' · '));
    if (s.maps.length > 1) el('div', 'ma-maps', c, s.maps.map((m) => m.name).join(', '));
    const box = el('div', 'ma-fires', c);
    if (!fires.length) el('div', 'ma-cold', box, 'No Hearthfire here.');
    for (const f of fires) {
      if (isKindled(f.id)) { const b = el('button', 'ma-btn go', box, 'Travel to ' + f.name); b.type = 'button'; b.onclick = () => finish({ place: f.place, hearthfire: f.id }); }
      else el('div', 'ma-cold', box, f.name + ': not kindled yet');
    }
    map.flyTo(s.at[0], s.at[1] + 140, Math.min(map.view.dist, 1800), undefined, map.view.yaw, 0.8);
  }
  const isKindled = (id) => want && (want.kindled === 'all' || (want.kindled || []).includes(id));

  // the pins and the regions' names follow the land each frame (the map draws itself; this only places the labels)
  const v = { x: 0, y: 0, z: 0 };
  function project(ax, ay, lift, cam, W, H) {
    const h = Math.max(0, map.heightAt(ax, ay)) + lift;
    const vec = new THREE.Vector3(ax - AW / 2, h, ay - AH / 2).project(cam);
    if (vec.z > 1 || Math.abs(vec.x) > 1.2 || Math.abs(vec.y) > 1.2) return null;
    v.x = (vec.x + 1) / 2 * W; v.y = (1 - vec.y) / 2 * H; return v;
  }
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!map || !map.P) return;
    const cam = map.P.camera, W = root.clientWidth, H = root.clientHeight, dist = map.view.dist, near = dist < 2300;
    for (const p of pins) {
      const q = project(p.s.at[0], p.s.at[1], 10, cam, W, H);
      if (!q) { p.b.style.display = 'none'; continue; }
      p.b.style.display = ''; p.b.style.transform = `translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;
      p.b.classList.toggle('far', !near && !(p.fires.length && p.fires.some((f) => isKindled(f.id))));
      p.b.classList.toggle('cold', !!p.fires.length && !p.fires.some((f) => isKindled(f.id)));
    }
    for (const r of regions) {
      const q = project(r.at[0], r.at[1], 60, cam, W, H);
      if (!q || dist < 1400) { r.d.style.display = 'none'; continue; }
      r.d.style.display = ''; r.d.style.transform = `translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;
    }
  }

  function finish(choice) {
    if (!root || !root.classList.contains('on')) return;
    root.classList.remove('on'); root._card.hidden = true; cancelAnimationFrame(raf); if (map) map.stop();
    const r = resolveOpen; resolveOpen = null; if (r) r(choice);
  }

  async function open(opts) {
    if (resolveOpen) finish(null);
    want = Object.assign({ kindled: [] }, opts || {});
    if (!root) build();
    root.classList.add('on');   // shown first, so the map measures the screen when it starts again
    if (map && mapReady) { await mapReady; map.start(); }
    root._title.textContent = want.title || 'The atlas of Aethermoor';
    const here = want.at && stopOf(want.at), hereMap = here && here.maps.find((m) => m.id === want.at);
    root._sub.textContent = here ? 'The party is at ' + (hereMap ? hereMap.name : here.name) : 'Tap a flame to travel';
    const done = new Promise((r) => { resolveOpen = r; });
    cancelAnimationFrame(raf); tick();
    await mapReady;
    if (here) { map.setIoAt(here.at[0], here.at[1], hereMap ? hereMap.name : here.name, 0, null); map.findIo(); }
    else overview();
    return done;
  }
  G.M7_ATLAS = { open, close: () => finish(null), get isOpen() { return !!(root && root.classList.contains('on')); }, stopOf, data: D };
})(window);
