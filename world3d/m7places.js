// m7places.js: the page (November 20). Hearth & Heirloom's own places in 3D, built from M7's maps and paintings
// (m7/convert.mjs, coven/places/m7-kit.js), walked by the party in their gear (heroes.js). The ways out of a place lead
// on to the next one where it is built (the Keep's north gate to the Hearth Road and back); "Places" jumps to any of them.
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const H = window.M7_HEROES, PL = window.W3D_PLACES;
  const ORDER = Object.keys(window.M7_PLACES || {});
  const want = (location.search.match(/[?&]place=([\w-]+)/) || [])[1];
  let cur = ORDER.includes(want) ? want : ORDER[0];
  const PHONE = window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  let toastT = 0;
  const toast = (s, name) => { const t = $('toast'); t.textContent = s; t.classList.toggle('name', !!name); t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, name ? 3200 : 2600); };
  const gear = {}; for (const [id] of H.HEROES) gear[id] = H.starterKit(id);
  const made = {}, lead = { id: 'warden' };
  const get = (id, detail) => { const k = id + detail; return made[k] || (made[k] = H.actor(id, gear[id], detail)); };
  W3D.witch = (id) => get(id, PHONE ? 'light' : 'high');
  let W, armed = false, said = null;
  // a way out: on to the next place where it's built (once the party has stepped off the doorstep they arrived on)
  function onFrame(dt, ex) {
    if (!ex) { armed = true; said = null; return; }
    if (!armed || W.isBusy()) return;
    if (ex.to && PL['m7-' + ex.to]) { armed = false; go(ex.to, ex.anchor); }
    else if (said !== ex) { said = ex; toast('The way to ' + ex.label + ' (not built in 3D yet)'); }
  }
  try {
    W = await W3D.walk({
      place: PL['m7-' + cur], root: $('world'), canvas: $('cv'), ring: $('ring'), dot: $('dot'), toast, who: 'warden', onFrame,
      say: (s) => { $('loadmsg').textContent = s.replace(/\bIo\b/g, 'the party'); },
      onStats: (n) => { $('fps').textContent = n.fps; $('more').textContent = Math.round(n.triangles / 1000) + ' thousand triangles · ' + n.calls + ' draw calls · ' + (PHONE ? 'phone detail' : 'laptop detail'); },
    });
  } catch (e) { console.error(e); $('loadmsg').textContent = 'Something went wrong: ' + e.message; window.__err = String(e && e.stack || e); return; }

  // ---- the party: the leader walks; the other three keep loose spots round them (party.js), not in single file ----
  let followers = [], leader = W3D.witch('warden');
  const party = window.M7_PARTY.create(W);
  function setFollowers() {
    for (const f of followers) W.P.scene.remove(f.root);
    followers = H.HEROES.filter(([id]) => id !== lead.id).map(([id]) => get(id, 'light'));
    for (const f of followers) W.P.scene.add(f.root);
    party.set(leader, followers);
  }
  setFollowers();
  let last = performance.now();
  (function follow() {
    requestAnimationFrame(follow);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
    if (W.paused || W.isBusy()) return;
    party.step(dt, t);
  })();
  const bar = $('party');
  (function draw() {
    bar.innerHTML = '';
    for (const [id, name] of H.HEROES) { const b = document.createElement('button'); b.textContent = name; b.className = id === lead.id ? 'on' : ''; b.setAttribute('aria-pressed', id === lead.id); b.onclick = () => { if (id === lead.id) return; lead.id = id; W.setWho(id); leader = W3D.witch(id); setFollowers(); draw(); toast(name + ' leads'); }; bar.append(b); }
    const ro = document.createElement('button'); ro.textContent = 'Gear'; ro.onclick = () => {
      const r = ['runed', 'storied', 'heirloom', 'regalia', 'primal'][Math.floor(Math.random() * 5)];
      for (const [id] of H.HEROES) { gear[id] = H.rollOutfit(id, r); for (const k of Object.keys(made)) if (k.startsWith(id)) delete made[k]; }
      const other = lead.id === 'warden' ? 'pip' : 'warden'; W.setWho(other); W.setWho(lead.id); leader = W3D.witch(lead.id);
      setFollowers(); toast('New ' + r + ' gear for everyone');
    }; bar.append(ro);
  })();

  // ---- going from place to place ----
  async function go(to, anchor) {
    const next = PL['m7-' + to]; if (!next || W.isBusy()) return;
    const a = (anchor && next.anchors[anchor]) || { at: next.start, face: next.startFace };
    $('load').style.display = 'grid'; $('load').style.opacity = 1; $('load').querySelector('h1').textContent = next.name; $('loadmsg').textContent = 'Walking on…';
    await new Promise((r) => setTimeout(r, 40));
    await W.switchTo(next, a.at[0], a.at[1], a.face);
    cur = to; leader = W3D.witch(lead.id); setFollowers(); list(); setLight();
    $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 600);
    toast(next.name, true);
  }
  const box = $('places');
  function list() {
    box.innerHTML = '';
    for (const id of ORDER) { const b = document.createElement('button'); b.textContent = PL['m7-' + id].name; b.className = id === cur ? 'on' : ''; b.onclick = () => { box.classList.remove('on'); if (id !== cur) { armed = false; go(id); } }; box.append(b); }
  }
  list();
  $('where').addEventListener('click', () => box.classList.toggle('on'));
  let guide = false;
  $('guide').addEventListener('click', () => { guide = !guide; W.guide(guide); $('guide').textContent = guide ? 'Back to 3D' : 'The painting'; });
  // ---- (Places, step 3) the light: the place's own (from its data), or day, dusk or night laid over it to compare ----
  const LIGHT_ORDER = ['own', 'day', 'dusk', 'night'], LIGHT_WORD = { own: 'its own', day: 'day', dusk: 'dusk', night: 'night', dark: 'dark', indoor: 'indoors' };
  let lightPick = 'own';
  function setLight() {
    const U = W.P.U, pl = PL['m7-' + cur], o = lightPick === 'own' ? pl.night : window.M7_GAINED(window.M7_LIGHTS[lightPick], pl.lightGain || 1);
    const rgb = (c, v) => { if (v) c.setRGB(v[0], v[1], v[2]); };
    rgb(U.uSky.value, o.sky); rgb(U.uMoon.value, o.moon); rgb(U.uGround.value, o.ground); rgb(U.uFog.value, o.fog);
    if (o.fogNear) U.uFogNear.value = o.fogNear; if (o.fogFar) U.uFogFar.value = o.fogFar; if (U.uDay) U.uDay.value = o.day || 0;
    $('light').textContent = 'Light: ' + (lightPick === 'own' ? (LIGHT_WORD[pl.lightName] || '') + ' (its own)' : LIGHT_WORD[lightPick]);
  }
  $('light').addEventListener('click', () => { lightPick = LIGHT_ORDER[(LIGHT_ORDER.indexOf(lightPick) + 1) % LIGHT_ORDER.length]; setLight(); toast(lightPick === 'own' ? 'Each place in its own light' : 'Every place at ' + LIGHT_WORD[lightPick]); });
  setLight();
  $('nums').addEventListener('click', () => { const on = $('numbers').classList.toggle('more'); $('nums').classList.toggle('on', on); });
  $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 700);
  setTimeout(() => toast(PL['m7-' + cur].name, true), 800);
  setTimeout(() => toast(PHONE ? 'Drag on the left to walk · Places to jump' : 'W A S D walk · Shift runs · Places to jump'), 4200);
  window.__m7 = { W, go, setLightPick: (k) => { lightPick = k; setLight(); }, get cur() { return cur; }, get leader() { return leader; } };
  window.__ready = true;
})();
