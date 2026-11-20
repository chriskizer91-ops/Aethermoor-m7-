// convert.mjs: turns Hearth & Heirloom's own maps (game/src/data/maps/<id>.js: the tile rows, entities, exits and anchors)
// and their paintings (game/src/ui/assets/paint/<id>.js) into 3D places for Coven of the Moon Faire's engine (copied into
// world3d/coven/). Nothing in another repository is read or changed: the maps and paintings are this repo's own.
//
//   node m7/convert.mjs keep keep-hall hearth-road      writes coven/places/m7-<id>.js and coven/art/m7/<id>.webp
//
// How a map becomes a place (Coven's places are laid out in painting pixels: 4 cm across, 5 cm down):
//   one tile = 50 x 40 px = 2 m x 2 m. The painting is laid over the ground as its colour (core.js, ground.paint), so the
//   floor looks like M7's own map; everything that stands is built from the tiles:
//   ~ water (lakes, moats, rivers: traced into outlines with their islands as holes; the ground drops under them)
//   # * walls (curtain walls with crenels, towers where they turn, a torch on every *)
//   H roofs: with the wall row under them (# * +), houses and halls; a + in that row is the door
//   T trees, t bushes, o rocks, , flowers, b bridges and causeways (decks), + gaps in walls (doorways)
//   every walkable tile is where the party can walk, exactly as in the 2D game
// Past the map's edges the land goes on for 9 tiles: water where the edge is water, a bridge where a bridge leaves, woods
// elsewhere, with the road out kept clear.
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, '..', '..');
const GAME = path.join(ROOT, 'game/src');
const { LEGEND } = await import(pathToFileURL(path.join(GAME, 'data/tiles.js')));
const { MAPS } = await import(pathToFileURL(path.join(GAME, 'data/maps/index.js')));
const TX = 50, TY = 40, PAD = 9;
const cl0 = (v, a, b) => Math.max(a, Math.min(b, v));
// (Places) Chris's textures each region's places wear (web copies of art-in/3d/world/), written into each place's file so a
// page carries only its own region's (the build puts every picture in once)
const AW = (id) => [id, `./../texture-packs/aeth-web/${id}.webp`];
const REGION_TEX = {
  sunscorch: ['sun_sand_ground', 'sun_sandstone_wall', 'sun_adobe_plaster', 'sun_awning_canvas', 'sun_glass_flats'],
  ironspire: ['iron_dwarf_stone', 'iron_forge_brick', 'iron_ice_lake', 'iron_snow_ground', 'shared_stone_wall_frosted_b', 'sun_awning_canvas', 'shared_bough_birch'],
  gloomfen: ['gloom_boardwalk_old', 'gloom_bog_water', 'gloom_stilt_wood', 'shared_bough_birch'],
  below: ['iron_forge_brick', 'iron_dwarf_stone', 'keep_floor_flags', 'keep_wall_hearthstone'],
};

// per-tile average colours of a painting (python: Pillow is here, sharp isn't)
function tileColours(webp, w, h) {
  const py = `import sys,json\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB').resize((${w},${h}),Image.BOX)\nprint(json.dumps([[list(im.getpixel((i,j))) for i in range(${w})] for j in range(${h})]))`;
  return JSON.parse(execFileSync('python3', ['-I', '-c', py, webp]).toString());
}

async function convert(id) {
  const map = (await import(pathToFileURL(path.join(GAME, 'data/maps', id + '.js')))).default;
  // (Places) a map with no painting yet (the Hearth Below's four, Chris's batch 4) uses its stand-in, m7/standin.mjs
  const paintFile = path.join(GAME, 'ui/assets/paint', id + '.js');
  const paint = existsSync(paintFile) ? (await import(pathToFileURL(paintFile))).default : { src: 'data:image/webp;base64,' + readFileSync(path.join(here, 'standins', id + '.webp')).toString('base64'), standin: true };
  const { w, h, rows } = map;
  const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? null : rows[j][i];
  const solid = (c) => (LEGEND[c] || LEGEND.x).solid;
  // the painting, copied in as it is
  mkdirSync(path.join(ROOT, 'world3d/coven/art/m7'), { recursive: true });
  const webp = path.join(ROOT, 'world3d/coven/art/m7', id + '.webp');
  writeFileSync(webp, Buffer.from(paint.src.split(',')[1], 'base64'));
  const COL = tileColours(webp, w, h);
  // ---- (Places, November 20) Acts Two and Three: each region's own things. Act One (verdant) is made exactly as before ----
  const ACT2 = (map.region || 'verdant') !== 'verdant', BIO = map.biome || '';
  // the land's masses: cliffs, scarps, dune crests, a mine's rock. Where they are thick the ground itself rises (the kit's
  // tileH '4'); a lone tile of them is a boulder, as in Act One
  const BELOW = map.region === 'below';
  const MASSC = !ACT2 ? '' : BELOW ? (BIO === 'council' ? '' : BIO === 'chains' ? '#R*' : '#*') : /^(mine|crystal|ice-cave|dwarf-hall|forge)$/.test(BIO) ? '^R' : '^';
  const isMass = (i, j) => MASSC.includes(rows[cl0(j, 0, h - 1)][cl0(i, 0, w - 1)]);
  const cornerMass = (i, j) => isMass(i - 1, j - 1) && isMass(i, j - 1) && isMass(i - 1, j) && isMass(i, j);
  const RAISED = rows.map((r, j) => [...r].map((c, i) => MASSC.includes(c) && (cornerMass(i, j) || cornerMass(i + 1, j) || cornerMass(i, j + 1) || cornerMass(i + 1, j + 1))));
  // what a 'T', a 't' and an 'f' are in each biome (the 2D game's art/tiles.js and the maps' headers)
  const TREEK = { desert: 'cactus', 'desert-town': 'palm', oasis: 'palm', canyon: 'palm', 'mine-camp': 'dead', mine: 'prop', crystal: 'spire', dunes: 'spire', ash: 'charred', vault: 'column', tundra: 'frostdead' }[BIO];
  const YK = { monastery: 'column', mountain: 'statue', 'dwarf-hall': 'column', forge: 'anvil', 'ice-cave': 'icecol', 'sunken-city': 'column', belfry: 'column', council: 'column', 'hearth-roots': 'ironroot', chains: 'chain', worldforge: 'hook' }[BIO];
  const SMALLK = { desert: 'shrub', oasis: 'shrub', canyon: 'shrub', 'desert-town': 'jar', 'mine-camp': 'crate', mine: 'cart', crystal: 'cluster', dunes: 'shard', ash: 'stump', vault: 'urn', tundra: 'sledge', 'frozen-lake': 'sledge', outpost: 'crate', 'dwarf-hall': 'barrel', forge: 'barrel', monastery: 'shrub', mountain: 'shrub', scree: 'shrub', fen: 'reedbed', bog: 'reedbed', causeway: 'reedbed', channel: 'shrub', 'stilt-town': 'crate', 'willow-village': 'crate', boardwalk: 'crate', mudflat: 'crate', 'sunken-city': 'crate', 'drowned-grove': 'stump', worldforge: 'rack' }[BIO];
  const GLOWK = { mine: 'amber', 'mine-camp': 'amber', canyon: 'amber', crystal: 'frost', dunes: 'glint', desert: 'glint', ash: 'ember', vault: 'ember', oasis: 'wisp', 'dwarf-hall': 'rune', forge: 'ember', 'ice-cave': 'frost', belfry: 'wisp', bog: 'wisp', chains: 'ember', worldforge: 'ember', 'hearth-roots': 'ember' }[BIO];
  const PADK = map.region === 'sunscorch' ? 'rocks' : 'woods';
  // the Gloomfen: plank streets, piers and porches stand on stilts over the water ('_', and ':' in a stilt town, near
  // water); 'x' there is broken planks over water, not a drop; '|' are rails and fences, not palisades; '*' a lantern on a pole
  const GLOOM = map.region === 'gloomfen' || (map.region === 'below' && BIO === 'chains');   // the chain rail is a rail too
  const nearWet = (i, j) => { for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const c = at(i + a, j + b); if (c === '~' || c === 'w' || c === 'x') return true; } return false; };

  // an indoor map: walls nearly all round its edge (the Great Hall, a vault, a mine's gallery). Indoors the walls are low
  // (a doll's house seen from above, as the 2D game shows it), pillars stand full height, and there's nothing outside
  const edge = [...rows[0], ...rows[h - 1], ...rows.map((r) => r[0]), ...rows.map((r) => r[w - 1])];
  const interior = edge.filter((c) => '#*+R^xY'.includes(c)).length / edge.length > 0.85;
  const DECK = rows.map((r, j) => [...r].map((c, i) => GLOOM && !interior && (c === '_' || (c === ':' && BIO === 'stilt-town')) && nearWet(i, j)));
  // ---- which tiles are wet: water, bridges over it, rocks standing in it ----
  const isW = (c) => c === '~' || (GLOOM && !interior && c === 'x');
  const wetAt = (i, j) => { const c = at(i, j); if (c === null) return true; return isW(c); };
  const WET = rows.map((r, j) => [...r].map((c, i) => {
    if (c === '~' || c === 'b' || c === 'w' || isW(c) || DECK[j][i]) return true;
    if (c === 'o') return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => wetAt(i + a, j + b)).length >= 2;
    return false;
  }));
  // the padded grid: past the edge, the nearest edge tile's wetness (and its bridge)
  const PW = w + PAD * 2, PH = h + PAD * 2;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const padChar = (I, J) => { const i = I - PAD, j = J - PAD; return at(i, j) ?? rows[cl(j, 0, h - 1)][cl(i, 0, w - 1)]; };
  const padWet = (I, J) => { const i = I - PAD, j = J - PAD; return WET[cl(j, 0, h - 1)][cl(i, 0, w - 1)] && (interior ? at(i, j) !== null : true); };

  // ---- the water's outlines: boundary edges with the water on their left, chained into loops ----
  const loops = [];
  {
    const edges = new Map(); const key = (x, y) => x + ',' + y;
    const add = (ax, ay, bx, by) => { const k = key(ax, ay); (edges.get(k) || edges.set(k, []).get(k)).push([bx, by]); };
    const wet = (I, J) => I >= 0 && J >= 0 && I < PW && J < PH && padWet(I, J);
    for (let J = 0; J < PH; J++) for (let I = 0; I < PW; I++) {
      if (!wet(I, J)) continue;
      // corners in padded-tile units; y grows south. Walk each wet cell's border clockwise on screen, keep the sides that face dry
      if (!wet(I, J - 1)) add(I, J, I + 1, J);
      if (!wet(I + 1, J)) add(I + 1, J, I + 1, J + 1);
      if (!wet(I, J + 1)) add(I + 1, J + 1, I, J + 1);
      if (!wet(I - 1, J)) add(I, J + 1, I, J);
    }
    while (edges.size) {
      const [k0, outs] = edges.entries().next().value; let [x, y] = k0.split(',').map(Number); const start = [x, y], loop = [[x, y]];
      let prev = null;
      for (let guard = 0; guard < 100000; guard++) {
        const k = key(x, y), list = edges.get(k); if (!list || !list.length) break;
        // at a pinch (two ways on), turn right first, so diagonal pools stay apart
        let pick = 0;
        if (list.length > 1 && prev) { const d = [x - prev[0], y - prev[1]]; const right = [-d[1], d[0]]; const idx = list.findIndex(([nx, ny]) => nx - x === right[0] && ny - y === right[1]); if (idx >= 0) pick = idx; }
        const [nx, ny] = list.splice(pick, 1)[0]; if (!list.length) edges.delete(k);
        prev = [x, y]; x = nx; y = ny;
        if (x === start[0] && y === start[1]) break;
        loop.push([x, y]);
      }
      // drop the points along straight runs
      const simp = loop.filter((p, i) => { const a = loop[(i - 1 + loop.length) % loop.length], b = loop[(i + 1) % loop.length]; return (b[0] - a[0]) * (p[1] - a[1]) !== (b[1] - a[1]) * (p[0] - a[0]); });
      if (simp.length >= 3) loops.push(simp.map(([X, Y]) => [(X - PAD) * TX, (Y - PAD) * TY]));
    }
  }
  const area = (p) => p.reduce((s, [x, y], i) => { const [u, v] = p[(i + 1) % p.length]; return s + x * v - u * y; }, 0) / 2;
  const inside = (p, x, y) => { let c = false; for (let i = 0, k = p.length - 1; i < p.length; k = i++) { const [xi, yi] = p[i], [xk, yk] = p[k]; if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) c = !c; } return c; };
  // outer loops run clockwise on screen (positive area with y down); holes the other way. Each hole joins the outer that
  // holds it by a there-and-back seam, so one outline (read even-odd) is the water with its islands
  const outers = loops.filter((l) => area(l) > 0).map((l) => ({ p: l, holes: [] }));
  for (const l of loops.filter((l) => area(l) < 0)) { const o = outers.find((o) => inside(o.p, l[0][0] + 0.5, l[0][1] + 0.5)); if (o) o.holes.push(l); }
  const water = outers.map((o) => {
    let p = o.p.slice();
    for (const hole of o.holes) {
      let best = [1e18, 0, 0];
      for (let a = 0; a < p.length; a++) for (let b = 0; b < hole.length; b++) { const d = (p[a][0] - hole[b][0]) ** 2 + (p[a][1] - hole[b][1]) ** 2; if (d < best[0]) best = [d, a, b]; }
      const [, a, b] = best, hr = hole.slice(b).concat(hole.slice(0, b));
      p = p.slice(0, a + 1).concat(hr, [hole[b], p[a]], p.slice(a + 1));
    }
    return p;
  });

  // ---- the buildings: roofs (H), with the wall row under a roof as their front ----
  const BLD = rows.map((r) => [...r].map((c) => c === 'H'));
  for (let j = 1; j < h; j++) for (let i = 0; i < w; i++) if ('#*+'.includes(rows[j][i]) && rows[j - 1][i] === 'H') BLD[j][i] = true;
  const rects = (mask) => {   // greedy: across as far as it goes, then down while the whole row is there
    const used = mask.map((r) => r.map(() => false)), out = [];
    for (let j = 0; j < mask.length; j++) for (let i = 0; i < mask[0].length; i++) {
      if (!mask[j][i] || used[j][i]) continue;
      let i1 = i; while (i1 + 1 < mask[0].length && mask[j][i1 + 1] && !used[j][i1 + 1]) i1++;
      let j1 = j; while (j1 + 1 < mask.length && [...Array(i1 - i + 1)].every((_, k) => mask[j1 + 1][i + k] && !used[j1 + 1][i + k])) j1++;
      for (let b = j; b <= j1; b++) for (let a = i; a <= i1; a++) used[b][a] = true;
      out.push([i, j, i1, j1]);
    }
    return out;
  };
  function roofKind([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    let hue = 0; if (mx !== mn) { if (mx === r) hue = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) hue = 60 * ((b - r) / (mx - mn) + 2); else hue = 60 * ((r - g) / (mx - mn) + 4); } if (hue < 0) hue += 360;
    if (sat < 0.16 || (hue >= 170 && hue < 290)) return 'slate';
    if (hue < 28 || hue >= 320) return 'red';
    if (hue < 70) return 'thatch';
    return 'moss';
  }
  const hallDoor = new Set((map.exits || []).filter((e) => e.to && /hall|gallery|vault|inside/.test(e.to)).map((e) => e.area[0] + ',' + e.area[1]));
  const buildings = rects(BLD).map(([i0, j0, i1, j1], n) => {
    const tw = i1 - i0 + 1, td = j1 - j0 + 1, big = tw * td >= 18;
    const doors = [], windows = [];
    // the roof's kind, by a vote of its painted tiles' colours: slate, red tiles, thatch or moss
    const votes = { slate: 0, red: 0, thatch: 0, moss: 0 };
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (rows[j][i] === 'H') votes[roofKind(COL[j][i])]++;
    const roofK = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    let grand = big;
    for (let i = i0; i <= i1; i++) {
      const c = rows[j1][i];
      if (c === '+') { doors.push({ side: 's', x: (i + 0.5) * TX, w: big ? 1.6 : 1.2, h: big ? 2.8 : 2.3, arch: big, double: big }); if (hallDoor.has(i + ',' + j1)) grand = true; }
    }
    const wallH = grand ? 5.2 : 3.2;
    // windows along the front between the doors, and on the ends of a deep house
    for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * TX; if (doors.some((d) => Math.abs(d.x - x) < TX * 0.9)) continue;
      if (tw > 1 && (i - i0) % 2 === 0) windows.push({ side: 's', x, y: 1.3, w: 0.8, h: 1.1 });
      if (grand && (i - i0) % 2 === 1) windows.push({ side: 's', x, y: 3.4, w: 0.7, h: 1.0, dark: (i * 7) % 3 === 0 });
    }
    const wpx = tw * 2, dpx = td * 2;
    return {
      id: (grand ? 'hall-' : 'house-') + n, fp: [i0 * TX, j0 * TY, (i1 + 1) * TX, (j1 + 1) * TY],
      walls: [{ t: 'stone', h: wallH }], roof: { ridge: wpx >= dpx ? 'ew' : 'ns', rise: Math.max(1.6, Math.min(4.2, Math.min(wpx, dpx) * (grand ? 0.62 : 0.55))), over: 0.45, kind: roofK },
      doors, windows, wear: grand ? { stone: 'stone~ashlar' } : undefined,
    };
  });

  // ---- the walls: runs of # and * that aren't a house's front ----
  let WALL = rows.map((r, j) => [...r].map((c, i) => (GLOOM ? '#' : '#*').includes(c) && !MASSC.includes(c) && !BLD[j][i]));
  // a wall piece of four tiles or fewer, on its own (a fire pit's kerb, a well's wall), is a low wall with no crenels
  const LOW = rows.map((r) => [...r].map(() => false));
  { const seen = rows.map((r) => [...r].map(() => false));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!WALL[j][i] || seen[j][i]) continue;
      const q = [[i, j]], got = []; seen[j][i] = true;
      while (q.length) { const [a, b] = q.pop(); got.push([a, b]); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = a + da, y = b + db; if (x >= 0 && y >= 0 && x < w && y < h && WALL[y][x] && !seen[y][x]) { seen[y][x] = true; q.push([x, y]); } } }
      if (got.length <= 4) for (const [a, b] of got) LOW[b][a] = interior ? 'pillar' : true;
    } }
  const pillars = [];
  if (interior) WALL = WALL.map((r, j) => r.map((v, i) => { if (v && LOW[j][i] === 'pillar') { pillars.push([(i + 0.5) * TX, (j + 0.5) * TY]); return false; } return v; }));
  const segs = [], inH = rows.map((r) => [...r].map(() => false));
  // a keep's or a town's walls are curtain walls (crenels, towers); out in the wilds they are old dry-stone ruins
  const FORT = /^(keep|town|outpost|tower|monastery|dwarf-hall|desert-town|stilt-town|vault|forge)$/.test(map.biome || '');
  const WH = interior ? 2.6 : FORT ? 3.6 : 1.7, WT = interior ? 2.0 : FORT ? 1.7 : 1.5;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!WALL[j][i] || (i > 0 && WALL[j][i - 1])) continue;
    let i1 = i; while (i1 + 1 < w && WALL[j][i1 + 1]) i1++;
    if (i1 > i) { segs.push(LOW[j][i] ? { pts: [[i * TX, (j + 0.5) * TY], [(i1 + 1) * TX, (j + 0.5) * TY]], h: 0.9, t: 1.4, tex: 'dry', low: true } : { pts: [[i * TX, (j + 0.5) * TY], [(i1 + 1) * TX, (j + 0.5) * TY]], h: WH, t: WT, tex: FORT || interior ? 'stone' : 'dry', indoor: interior || undefined, ruin: !FORT && !interior || undefined }); for (let a = i; a <= i1; a++) inH[j][a] = true; }
  }
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    if (!WALL[j][i] || (j > 0 && WALL[j - 1][i])) continue;
    let j1 = j; while (j1 + 1 < h && WALL[j1 + 1][i]) j1++;
    const fresh = [...Array(j1 - j + 1)].some((_, k) => !inH[j + k][i]);
    if (j1 > j && fresh) segs.push(LOW[j][i] ? { pts: [[(i + 0.5) * TX, j * TY], [(i + 0.5) * TX, (j1 + 1) * TY]], h: 0.9, t: 1.4, tex: 'dry', low: true } : { pts: [[(i + 0.5) * TX, j * TY], [(i + 0.5) * TX, (j1 + 1) * TY]], h: WH, t: WT, tex: FORT || interior ? 'stone' : 'dry', indoor: interior || undefined, ruin: !FORT && !interior || undefined });
    else if (j1 === j && !inH[j][i]) segs.push({ pts: [[i * TX, (j + 0.5) * TY], [(i + 1) * TX, (j + 0.5) * TY]], h: LOW[j][i] ? 0.9 : WH, t: LOW[j][i] ? 1.4 : WT, tex: LOW[j][i] || !FORT ? 'dry' : 'stone', low: LOW[j][i] || undefined, indoor: interior || undefined, ruin: !FORT && !interior || undefined });
  }
  // palisades: runs of stakes
  const PAL = rows.map((r) => [...r].map((c) => c === '|'));
  const palisades = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!PAL[j][i]) continue;
    if (!(i > 0 && PAL[j][i - 1])) { let i1 = i; while (i1 + 1 < w && PAL[j][i1 + 1]) i1++; if (i1 > i) palisades.push([[i * TX, (j + 0.5) * TY], [(i1 + 1) * TX, (j + 0.5) * TY]]); }
    if (!(j > 0 && PAL[j - 1][i])) { let j1 = j; while (j1 + 1 < h && PAL[j1 + 1][i]) j1++; if (j1 > j) palisades.push([[(i + 0.5) * TX, j * TY], [(i + 0.5) * TX, (j1 + 1) * TY]]); }
    const lone = !(PAL[j][i - 1] || PAL[j][i + 1] || PAL[j - 1]?.[i] || PAL[j + 1]?.[i]);
    if (lone) palisades.push([[i * TX + 5, (j + 0.5) * TY], [(i + 1) * TX - 5, (j + 0.5) * TY]]);
  }
  // towers where a wall turns or ends against water, and every torch
  const towers = [], torches = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!WALL[j][i]) continue;
    const hz = (i > 0 && WALL[j][i - 1]) || (i < w - 1 && WALL[j][i + 1]), vt = (j > 0 && WALL[j - 1][i]) || (j < h - 1 && WALL[j + 1][i]);
    if (hz && vt && !LOW[j][i] && !interior && FORT) towers.push([(i + 0.5) * TX, (j + 0.5) * TY]);
    if (rows[j][i] === '*' && interior) torches.push([(i + 0.5) * TX, (j + 0.5) * TY, 'sconce', [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([a, b]) => { const c = at(i + a, j + b); return c !== null && !solid(c); }).map(([a, b]) => a + ',' + b)[0] || '0,1']);
    else if (rows[j][i] === '*' && LOW[j][i]) torches.push([(i + 0.5) * TX, (j + 0.5) * TY, 'bowl']);
    else if (rows[j][i] === '*') torches.push([(i + 0.5) * TX, (j + 0.5) * TY, !WALL[j + 1]?.[i] && !BLD[j + 1]?.[i] ? 's' : !WALL[j - 1]?.[i] ? 'n' : !WALL[j]?.[i + 1] ? 'e' : 'w']);
  }
  // a torch on a house front (the hall's door lamps)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (rows[j][i] === '*' && BLD[j][i]) torches.push([(i + 0.5) * TX, (j + 1) * TY + 2, 'front']);

  // ---- where the party can walk: every walkable tile that isn't under a house ----
  const WALK = rows.map((r, j) => [...r].map((c, i) => !solid(c) && !BLD[j][i]));
  const walk = rects(WALK).map(([i0, j0, i1, j1]) => [[i0 * TX - 1, j0 * TY - 1], [(i1 + 1) * TX + 1, j0 * TY - 1], [(i1 + 1) * TX + 1, (j1 + 1) * TY + 1], [i0 * TX - 1, (j1 + 1) * TY + 1]]);
  // a road out at the map's edge carries on into the padding, so the party can walk to the exit and a little past
  for (const e of map.exits || []) {
    const [a, b, c, d] = e.area;
    if (b === 0) walk.push([[a * TX, -TY * 1.5], [(c + 1) * TX, -TY * 1.5], [(c + 1) * TX, 2], [a * TX, 2]]);
    if (d === h - 1) walk.push([[a * TX, h * TY - 2], [(c + 1) * TX, h * TY - 2], [(c + 1) * TX, (h + 1.5) * TY], [a * TX, (h + 1.5) * TY]]);
    if (a === 0) walk.push([[-TX * 1.5, b * TY], [2, b * TY], [2, (d + 1) * TY], [-TX * 1.5, (d + 1) * TY]]);
    if (c === w - 1) walk.push([[w * TX - 2, b * TY], [(w + 1.5) * TX, b * TY], [(w + 1.5) * TX, (d + 1) * TY], [w * TX - 2, (d + 1) * TY]]);
  }

  // ---- the ground's kinds (the painting colours it; these choose the texture's grain under the colour) ----
  const kindOf = (c) => ({ ':': 'cob', '+': 'cob', s: 'pave', _: 'pave', '=': 'dirt', m: 'dirt', r: 'dirt', k: 'dirt', f: 'dirt', v: 'dirt', i: 'dirt' }[c] || 'grass');
  const lawns = [], groundPatches = [];
  for (const kind of ['grass', 'dirt', 'pave']) {
    const mask = rows.map((r, j) => [...r].map((c, i) => WALK[j][i] && kindOf(c) === kind && c !== 'b'));
    for (const [i0, j0, i1, j1] of rects(mask)) {
      const p = [[i0 * TX, j0 * TY], [(i1 + 1) * TX, j0 * TY], [(i1 + 1) * TX, (j1 + 1) * TY], [i0 * TX, (j1 + 1) * TY]];
      if (kind === 'grass') lawns.push(p); else groundPatches.push({ kind, poly: p });
    }
  }

  // ---- bridges: a deck over each run of bridge tiles, carried on past the edge ----
  const BR = rows.map((r) => [...r].map((c) => c === 'b'));
  const decks = rects(BR).map(([i0, j0, i1, j1]) => {
    let x0 = i0 * TX, y0 = j0 * TY, x1 = (i1 + 1) * TX, y1 = (j1 + 1) * TY;
    if (j0 === 0) y0 -= PAD * TY; if (j1 === h - 1) y1 += PAD * TY; if (i0 === 0) x0 -= PAD * TX; if (i1 === w - 1) x1 += PAD * TX;
    const ns = (y1 - y0) >= (x1 - x0);
    return { r: [x0, y0, x1, y1], y: 0.08, boards: ns ? 'ns' : 'ew', rails: { kind: 'wood', sides: ns ? 'ew' : 'ns' }, stilts: true };
  });

  // (Places) the Gloomfen's plank streets and piers, on stilts, no rails
  for (const [i0, j0, i1, j1] of rects(DECK)) {
    let x0 = i0 * TX, y0 = j0 * TY, x1 = (i1 + 1) * TX, y1 = (j1 + 1) * TY;
    if (j0 === 0) y0 -= PAD * TY; if (j1 === h - 1) y1 += PAD * TY; if (i0 === 0) x0 -= PAD * TX; if (i1 === w - 1) x1 += PAD * TX;
    decks.push({ r: [x0, y0, x1, y1], y: 0.08, boards: (y1 - y0) >= (x1 - x0) ? 'ns' : 'ew', stilts: true, spacing: 3 });
  }
  // ---- trees, bushes, rocks, flowers ----
  const region = map.region || 'verdant';
  const treeKind = ACT2 && /^(wilds|willow-village|causeway|channel)$/.test(BIO) ? 0 : /iron|frost|peak/.test(region) ? 1 : /gloom|fen/.test(region) ? 2 : 0;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lamps = [];
  const extraTrees = [], props = [], flowers = [], cliffs = [], roots = [], firsts = [], glows = [], stand = [], smalls = [], faces = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const c = rows[j][i], x = (i + 0.5) * TX, y = (j + 0.5) * TY;
    if (BELOW && c === '*') glows.push([x, y, 'ember']);   // ember seams and fire-vents in the rock
    if (BELOW && ((c === '~' && (i + j) % 2 === 0) || (c === 'x' && BIO !== 'council' && (i * 7 + j * 3) % 4 === 0))) glows.push([x, y, 'lava']);   // molten metal, and the red glow far down a drop
    if (BELOW && c === 'R' && BIO === 'council') { stand.push([x, y, 'table', 0, 1]); continue; }
    if (ACT2 && MASSC.includes(c)) {
      if (!RAISED[j][i]) { if (BIO !== 'dunes') cliffs.push([x, y, +(1.5 + rnd() * 0.7).toFixed(2)]); }
      else if (BIO !== 'dunes') for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = at(i + a, j + b); if (n !== null && !MASSC.includes(n) && rnd() < 0.16) faces.push([Math.round(x + a * TX * 0.42), Math.round(y + b * TY * 0.42), +(0.9 + rnd() * 0.6).toFixed(2)]); }
      continue;
    }
    if (ACT2 && c === 'T' && TREEK) stand.push([Math.round(x + (rnd() - 0.5) * 12), Math.round(y + (rnd() - 0.5) * 10), TREEK, Math.floor(rnd() * 900), +(0.85 + rnd() * 0.35).toFixed(2)]);
    else if (ACT2 && c === 't' && SMALLK === 'crate') props.push({ k: 'crates', at: [x, y] });
    else if (ACT2 && c === 't' && SMALLK === 'barrel') props.push({ k: 'barrel', at: [x, y] });
    else if (ACT2 && c === 'Y' && YK) stand.push([x, y, YK, Math.floor(rnd() * 900), 1]);
    else if (ACT2 && c === 't' && SMALLK) smalls.push([Math.round(x + (rnd() - 0.5) * 10), Math.round(y + (rnd() - 0.5) * 8), SMALLK, Math.floor(rnd() * 900)]);
    else if (ACT2 && c === 'f' && GLOWK) glows.push([x, y, GLOWK]);
    else if (GLOOM && c === '"' && rnd() < 0.7) smalls.push([Math.round(x + (rnd() - 0.5) * 12), Math.round(y + (rnd() - 0.5) * 10), 'reeds', Math.floor(rnd() * 900)]);
    else if (GLOOM && c === '*' && !BLD[j][i]) lamps.push({ at: [x, y], kind: 'wood' });
    else if (c === 'T') extraTrees.push([Math.round(x + (rnd() - 0.5) * 10), Math.round(y + (rnd() - 0.5) * 8), +(([[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => at(i + a, j + b) === 'T') ? 0.92 : 1.5) + rnd() * 0.25).toFixed(2), treeKind, Math.floor(rnd() * 900)]);
    else if (c === 't') flowers.push([x, y, 0.95, 'mix']);
    else if (c === '^') cliffs.push([x, y, +(1.7 + rnd() * 0.8).toFixed(2)]);
    else if (c === 'R') roots.push([x, y, Math.floor(rnd() * 900)]);
    else if (c === 'Y') firsts.push([x, y, Math.floor(rnd() * 900)]);
    else if (c === 'f') glows.push([x, y]);
    else if (c === 'i') glows.push([x, y, BELOW ? 'ember' : 'ichor']);
    else if (c === 'o') props.push({ k: 'rock', at: [x, y], size: +(1.1 + rnd() * 0.6).toFixed(2), y: WET[j][i] ? -0.9 : undefined });
    else if (c === ',' && false) flowers.push([Math.round(x + (rnd() - 0.5) * 20), Math.round(y + (rnd() - 0.5) * 16), +(0.35 + rnd() * 0.3).toFixed(2), ['mix', 'white', 'violet'][Math.floor(rnd() * 3)]]);
  }
  // the woods past the edges: dry padding tiles, but not in front of a road out or over a bridge's line
  const clear = (I, J) => (map.exits || []).some((e) => { const [a, b, c, d] = e.area; const i = I - PAD, j = J - PAD; return i >= a - 2 && i <= c + 2 && j >= b - 2 && j <= d + 2 || ((b === 0 || d === h - 1) && i >= a - 1 && i <= c + 1) || ((a === 0 || c === w - 1) && j >= b - 1 && j <= d + 1); });
  for (let J = 0; J < PH; J++) for (let I = 0; I < PW; I++) {
    const i = I - PAD, j = J - PAD; if (i >= 0 && j >= 0 && i < w && j < h) continue;
    if (interior || padWet(I, J) || clear(I, J)) continue;
    if (PADK === 'rocks') { if (!isMass(i, j) && rnd() < 0.05) props.push({ k: 'rock', at: [Math.round((i + rnd()) * TX), Math.round((j + rnd()) * TY)], size: +(0.9 + rnd() * 0.9).toFixed(2) }); continue; }
    if (rnd() < 0.55) extraTrees.push([Math.round((i + rnd()) * TX), Math.round((j + rnd()) * TY), +(0.95 + rnd() * 0.4).toFixed(2), treeKind === 0 && rnd() < 0.25 ? 1 : treeKind, Math.floor(rnd() * 900)]);
  }

  // ---- lamps: light entities, hearthfires ----
  for (const e of map.entities || []) {
    if (!e.at) continue; const [x, y] = [(e.at[0] + 0.5) * TX, (e.at[1] + 0.5) * TY];
    if (e.kind === 'light' || e.kind === 'hearthfire') lamps.push({ at: [x, y], kind: 'pillar', h: 1.1 });
    else if (e.kind === 'chest') props.push({ k: 'crates', at: [x, y] });
    else if (e.kind === 'sign' || e.kind === 'board') props.push({ k: 'post', at: [x, y], h: 1.3 });
  }

  // ---- where the party starts, the ways out, and the people standing about (shown later; kept for the page) ----
  const FACE = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
  const anchors = {};
  for (const [k, [i, j, f]] of Object.entries(map.anchors || {})) anchors[k] = { at: [(i + 0.5) * TX, (j + 0.5) * TY], face: FACE[f] ?? 0 };
  const first = anchors['from-road'] || anchors[Object.keys(anchors)[0]] || { at: [w * TX / 2, h * TY / 2], face: 0 };
  const names = {}; if (MAPS) for (const m of Object.values(MAPS)) if (m && m.id) names[m.id] = m.name;
  const exits = (map.exits || []).filter((e) => e.to).map((e) => {
    let [a, b, c, d] = e.area;
    let r = [a * TX, b * TY, (c + 1) * TX, (d + 1) * TY];
    if (BLD[d]?.[a]) r = [a * TX, (d + 1) * TY, (c + 1) * TX, (d + 1) * TY + 12];   // a door in a house front: its doorstep
    if (b === 0) r[1] = -TY; if (d === h - 1) r[3] = (h + 1) * TY; if (a === 0) r[0] = -TX; if (c === w - 1) r[2] = (w + 1) * TX;
    return { rect: r.map(Math.round), label: names[e.to] || e.to, to: e.to, anchor: e.anchor };
  });
  const people = (map.entities || []).filter((e) => e.kind === 'npc' && e.at).map((e) => ({ id: e.id, npc: e.npc, at: [(e.at[0] + 0.5) * TX, (e.at[1] + 0.5) * TY], face: FACE[e.face] ?? 0 }));

  const place = {
    id: 'm7-' + id, m7: id, name: map.name, region, biome: map.biome, interior, dark: !!map.dark || undefined,
    ...(ACT2 ? { stand, smalls, faces, texFiles: Object.fromEntries((REGION_TEX[region] || []).map(AW)) } : {}), pillars, palisades, cliffs, roots, firsts, glows, size: [w * TX, h * TY], tiles: [w, h],
    painting: `art/m7/${id}.webp`, standin: paint.standin || undefined, extent: [-PAD * TX, -PAD * TY, (w + PAD) * TX, (h + PAD) * TY],
    start: first.at, startFace: first.face, anchors, exits, people,
    water: water.map((p) => ({ poly: p })), decks, buildings, walls: segs, towers, torches, lamps, props, flowers, extraTrees, lawns, groundPatches,
    fence: GLOOM || undefined,
    tileH: rows.map((r, j) => [...r].map((c, i) => c === 'x' && !(GLOOM && !interior) ? 3 : c === 'w' ? 2 : WET[j][i] ? 1 : ACT2 && MASSC.includes(c) ? 4 : 0).join('')),
  };
  const mapsEntry = { walk, block: [] };
  // pictures are written as "art/..." in double quotes so the build puts them inside the page
  const json = JSON.stringify(place);
  const out = `// m7-${id}.js: ${map.name} in 3D, made by world3d/m7/convert.mjs from game/src/data/maps/${id}.js and its painting (do not edit
// by hand: change the converter or the map, and run it again). The engine's place is put together by places/m7-kit.js.
(function (G) {
  (G.MAPS = G.MAPS || {})['m7-${id}'] = ${JSON.stringify(mapsEntry)};
  (G.M7_PLACES = G.M7_PLACES || {})['${id}'] = ${json};
})(window);
`;
  writeFileSync(path.join(ROOT, 'world3d/coven/places', `m7-${id}.js`), out);
  console.log(`${id}: ${w}x${h} tiles, ${buildings.length} buildings, ${segs.length} wall runs, ${towers.length} towers, ${water.length} waters, ${decks.length} bridges, ${extraTrees.length} trees, ${walk.length} walk boxes, ${exits.length} exits (${(out.length / 1024).toFixed(0)} KB)`);
}

for (const id of process.argv.slice(2)) await convert(id);
