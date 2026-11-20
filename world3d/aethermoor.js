// aethermoor.js: the page (November 20). Hearth & Heirloom's party walks the Verdant Wilds in 3D (Coven of the Moon
// Faire's zone 1, borrowed, under M7's names: names.js). The small map in the corner follows the party; tap it for the
// big map of the Wilds; on the big map, "The whole of Aethermoor" opens the continent in 3D (Envoi's 3D map, borrowed)
// with the party's pin where they stand; "Back to walking" returns. One hero leads, the other three follow in their
// steps, each in their own gear (window.M7_HEROES, heroes.js).
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  window.AETH_NAMES.apply();
  const place = window.W3D_PLACES['zone-1'], town = window.W3D_PLACES.wickhollow, H = window.M7_HEROES;
  place.paintingSrc = town.painting;
  const PHONE = window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  let toastT = 0;
  const toast = (s, name) => { const t = $('toast'); t.textContent = s; t.classList.toggle('name', !!name); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, name ? 3200 : 2600); };
  W3D.landEvents = { region(now, was) { if (was !== null) toast(window.AETH_NAMES.fix(now), true); }, herb() {} };
  W3D.zoneSay = (s) => { $('loadmsg').textContent = s.replace(/\bIo\b/g, 'the party'); };
  const gear = {}; for (const [id] of H.HEROES) gear[id] = H.starterKit(id);
  const made = {}, lead = { id: 'warden' };
  const get = (id, detail) => { const k = id + detail; return made[k] || (made[k] = H.actor(id, gear[id], detail)); };
  W3D.witch = (id) => get(id, PHONE ? 'light' : 'high');
  let W;
  try {
    W = await W3D.walk({
      place, root: $('world'), canvas: $('cv'), ring: $('ring'), dot: $('dot'), toast, who: 'warden',
      say: (s) => { $('loadmsg').textContent = window.AETH_NAMES.fix(s).replace(/\bIo\b/g, 'the party'); },
      onStats: (n) => { $('fps').textContent = n.fps; $('more').textContent = Math.round(n.triangles / 1000) + ' thousand triangles · ' + n.calls + ' draw calls · ' + (PHONE ? 'phone detail' : 'laptop detail'); },
    });
  } catch (e) { console.error(e); $('loadmsg').textContent = 'Something went wrong: ' + e.message; window.__err = String(e && e.stack || e); return; }
  const scene = W.P.scene;

  // ---- the party: the leader walks; the other three follow the leader's steps ----
  let followers = [], trail = [], leader = W3D.witch('warden');
  function setFollowers() {
    for (const f of followers) scene.remove(f.root);
    followers = H.HEROES.filter(([id]) => id !== lead.id).map(([id]) => get(id, 'light'));
    const p = leader.root.position, ry = leader.root.rotation.y;
    followers.forEach((f, i) => { f.root.position.set(p.x - (i + 1) * 1.1 * Math.sin(ry), p.y, p.z - (i + 1) * 1.1 * Math.cos(ry)); f.root.rotation.y = ry; scene.add(f.root); });
    trail = [];
  }
  setFollowers();
  let last = performance.now();
  (function follow() {
    requestAnimationFrame(follow);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
    if (W.paused) return;
    const p = leader.root.position, l0 = trail[0];
    if (!l0 || l0.distanceTo(p) > 0.05) { trail.unshift(p.clone()); if (trail.length > 400) trail.length = 400; }
    if (l0 && l0.distanceTo(p) > 6) trail = [p.clone()];   // the leader jumped (a teleport): start the trail again
    followers.forEach((f, i) => {
      let need = (i + 1) * 1.1, q = p.clone();
      for (let k = 0; k < trail.length - 1 && need > 0; k++) { const d = trail[k].distanceTo(trail[k + 1]); if (d >= need) { q = trail[k].clone().lerp(trail[k + 1], need / d); need = 0; break; } need -= d; q = trail[k + 1].clone(); }
      if (need > 0) { const ry = leader.root.rotation.y; q.x -= Math.sin(ry) * need; q.z -= Math.cos(ry) * need; }
      const fp = f.root.position, dx = q.x - fp.x, dz = q.z - fp.z, d = Math.hypot(dx, dz), moving = d > 0.04;
      if (d > 8) { fp.copy(q); } else { fp.x += dx * Math.min(1, dt * 8); fp.z += dz * Math.min(1, dt * 8); fp.y += (q.y - fp.y) * Math.min(1, dt * 10); }
      if (moving) { let a = Math.atan2(dx, dz) - f.root.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); f.root.rotation.y += a * Math.min(1, dt * 10); }
      f.walkRun = leader.walkRun; f.animate(0, moving ? 1 : 0, t + i, dt * (moving ? Math.min(2.3, Math.max(0.6, d * 6)) : 1));
    });
  })();
  const bar = $('party');
  (function draw() {
    bar.innerHTML = '';
    for (const [id, name] of H.HEROES) { const b = document.createElement('button'); b.textContent = name; b.className = id === lead.id ? 'on' : ''; b.setAttribute('aria-pressed', id === lead.id); b.onclick = () => { if (id === lead.id) return; lead.id = id; W.setWho(id); leader = W3D.witch(id); setFollowers(); draw(); toast(name + ' leads'); }; bar.append(b); }
    const sw = document.createElement('button'); sw.textContent = 'Swing'; sw.onclick = () => { leader.strike = 0; }; bar.append(sw);
    const ro = document.createElement('button'); ro.textContent = 'Gear'; ro.onclick = () => {
      const r = ['runed', 'storied', 'heirloom', 'regalia', 'primal'][Math.floor(Math.random() * 5)];
      for (const [id] of H.HEROES) { gear[id] = H.rollOutfit(id, r); for (const k of Object.keys(made)) if (k.startsWith(id)) delete made[k]; }
      const other = lead.id === 'warden' ? 'pip' : 'warden'; W.setWho(other); W.setWho(lead.id); leader = W3D.witch(lead.id);
      setFollowers(); toast('New ' + r + ' gear for everyone');
    }; bar.append(ro);
  })();

  // ---- the maps: the small one in the corner, the big one of the Wilds, then the continent ----
  const mm = W3D.miniMap({ root: $('world'), land: W.P.land, walker: W, words: { walked: 'walked', toGo: 'to go', km: 'km', m: 'm', north: 'N' } });
  window.__map = mm;
  // the big map shows the way to the whole of Aethermoor (watching its display, as minimap.js opens and closes it itself)
  new MutationObserver(() => { const on = mm.big.style.display === 'block'; $('toWorld').style.display = on ? 'block' : 'none'; $('party').style.visibility = on ? 'hidden' : 'visible'; }).observe(mm.big, { attributes: true, attributeFilter: ['style'] });
  // where the party stands on the continent: this land is the map of Aethermoor at a third of its size, with Thornhollow's
  // square (0, 0) at atlas pixel (1348, 1838); an atlas pixel is 10 m on the map, 3.33 m here (places/zone-1.js)
  const K = 10 / 3, PIN0 = [1348, 1838];
  const NEAR = { wickhollow: [1348, 1838], thornwood: [1530, 2160], bogmire: [1752, 2512], 'bogmire-heart': [1800, 2385], cottage: [1352, 1948], jetty: [1446, 1806] };
  let worldMap = null;
  async function openWorld() {
    mm.open(false); W.pause(true); $('continent').classList.add('on');
    const p = leader.root.position, ax = PIN0[0] + p.x / K, ay = PIN0[1] + p.z / K;
    let near = 'wickhollow', best = 1e9; for (const [id, [x, y]] of Object.entries(NEAR)) { const d = (x - ax) ** 2 + (y - ay) ** 2; if (d < best) { best = d; near = id; } }
    const name = window.MapPlaces.PLACES[near].name;
    $('chip-place').textContent = 'Near ' + name; $('chip-zone').textContent = window.MapPlaces.ZONES[1].name; $('chip').hidden = false;
    if (!worldMap) {
      $('cload').style.display = 'grid'; $('cload').style.opacity = 1;
      await new Promise((r) => setTimeout(r, 30));
      const big = Math.min(screen.width, screen.height) >= 700 && matchMedia('(pointer: fine)').matches;
      worldMap = WorldMap.create($('map'), { art: window.MAP_ART, detail: big ? 'laptop' : 'phone', open: [1, 2, 3, 4], pinName: 'The party' });
      await worldMap.ready;
      $('cload').style.opacity = 0; setTimeout(() => { $('cload').style.display = 'none'; }, 600);
    } else worldMap.start();
    worldMap.setIoAt(ax, ay, name, 1, near);
    await new Promise((r) => setTimeout(r, 900));
    worldMap.findIo();
  }
  function closeWorld() { if (worldMap) worldMap.stop(); $('continent').classList.remove('on'); W.pause(false); }
  $('toWorld').addEventListener('click', openWorld);
  $('back').addEventListener('click', closeWorld);
  $('find').addEventListener('click', () => worldMap && worldMap.findIo());

  $('nums').addEventListener('click', () => { const on = $('numbers').classList.toggle('more'); $('nums').classList.toggle('on', on); });
  $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 700);
  setTimeout(() => toast(PHONE ? 'Drag on the left to walk · tap the little map for the big one' : 'W A S D walk · Shift runs · tap the little map for the big one'), 900);
  window.__aeth = { W, mm, openWorld, closeWorld, get leader() { return leader; }, get worldMap() { return worldMap; } };
  window.__ready = true;
})();
