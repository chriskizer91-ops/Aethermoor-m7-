// rows.mjs (Places, step 5): a map's tile rows and its things (not people or foes), to read beside m7/grid.py's picture
//   node m7/rows.mjs <id>
const id = process.argv[2], d = (await import('../../game/src/data/maps/' + id + '.js')).default;
console.log(id, d.w + 'x' + d.h, d.region, d.biome);
d.rows.forEach((r, j) => console.log(String(j).padStart(2), r));
console.log(JSON.stringify((d.entities || []).filter((e) => !['npc', 'encounter', 'trigger'].includes(e.kind)).map((e) => [e.kind, (e.at || e.area || []).join(',')])));
