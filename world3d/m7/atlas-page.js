// atlas-page.js (Places, step 3): the atlas page's own few lines. It fills the two lists, opens the atlas (M7_ATLAS.open)
// and shows what came back, as the game would get it.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id), D = window.M7_ATLAS_DATA;
  const at = $('at');
  for (const [k, r] of Object.entries(D.regions)) {
    const g = document.createElement('optgroup'); g.label = r.name;
    for (const s of D.stops.filter((q) => q.region === k)) for (const m of s.maps) { const o = document.createElement('option'); o.value = m.id; o.textContent = m.name; g.append(o); }
    at.append(g);
  }
  at.value = 'thornhollow';
  const fires = D.stops.flatMap((s) => s.maps.flatMap((m) => m.hearthfires));
  const kindled = () => ({ all: 'all', warm: fires.filter((f) => !f.cold).map((f) => f.id), few: ['hearthstone-keep', 'thornhollow'] })[$('lit').value];
  async function go() {
    const k = kindled();
    const got = await window.M7_ATLAS.open({ at: at.value, kindled: k });
    $('out').textContent = 'M7_ATLAS.open({ at: ' + JSON.stringify(at.value) + ', kindled: ' + (k === 'all' ? "'all'" : '[' + k.length + ' ids]') + ' })\n-> ' + JSON.stringify(got);
    if (got) at.value = got.place;
    window.__last = got;
  }
  $('go').addEventListener('click', go);
  window.__atlasPage = { go };
  window.__ready = true;
  go();
})();
