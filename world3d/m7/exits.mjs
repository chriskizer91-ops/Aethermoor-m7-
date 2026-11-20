// exits.mjs (Places, November 20): checks every way out of the given places: where it leads is a place, the anchor it
// names is there, and the anchor stands inside the walk boxes (so the party arrives on walkable ground). Node only.
//   node m7/exits.mjs sun-road sandspire ...      (no ids: every converted place)
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
const dir = new URL('../coven/places/', import.meta.url);
const all = readdirSync(dir).filter((f) => /^m7-.*\.js$/.test(f) && f !== 'm7-kit.js').map((f) => f.slice(3, -3));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;
const win = {}; vm.runInNewContext(all.map((id) => readFileSync(new URL(`m7-${id}.js`, dir), 'utf8')).join('\n'), { window: win });
const inWalk = (id, [x, y]) => win.MAPS['m7-' + id].walk.some((q) => x >= q[0][0] && x <= q[1][0] && y >= q[0][1] && y <= q[2][1]);
let bad = 0, n = 0;
for (const id of ids) {
  const p = win.M7_PLACES[id];
  for (const [k, a] of Object.entries(p.anchors)) if (!inWalk(id, a.at)) { bad++; console.log(`${id}: anchor ${k} is not on walkable ground`); }
  for (const e of p.exits) {
    n++;
    const t = win.M7_PLACES[e.to];
    if (!t) { console.log(`${id} -> ${e.to}: not converted (yet)`); continue; }
    if (!t.anchors[e.anchor]) { bad++; console.log(`${id} -> ${e.to}: no anchor ${e.anchor}`); }
    const back = t.exits.find((x) => x.to === id);
    if (!back) console.log(`${id} -> ${e.to}: no way back`);
  }
}
console.log(`${n} ways out checked, ${bad} problems`);
