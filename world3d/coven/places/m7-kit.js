// m7-kit.js (Aethermoor, November 20): Hearth & Heirloom's own maps as places for Coven of the Moon Faire's engine.
// world3d/m7/convert.mjs reads each M7 map and its painting into window.M7_PLACES[id] (plain data: the tiles' walls,
// houses, water, bridges, trees, ways out); this file makes that data into an engine place, W3D_PLACES['m7-<id>']:
// the textures (Coven's, the same ones Thornhollow wears), the ground's height from the tiles (dropping under the water),
// the painting laid over the ground as its colour, a roof material per house in the painting's own roof colour, and in
// extra(K) what the engine has no field for: crenels along the walls, towers where they turn, torches.
(function (G) {
  'use strict';
  const TX = 50, TY = 40;
  // every texture the M7 places use, written out in full so the build finds them and puts them inside the page
  const LIST = {
    shared_cobbles_town: "./../texture-packs/made-web/shared_cobbles_town.webp",
    shared_grass_meadow: "./../texture-packs/made-web/shared_grass_meadow.webp",
    shared_dirt_track: "./../texture-packs/made-web/shared_dirt_track.webp",
    wick_bridge_paving: "./../texture-packs/made-web/wick_bridge_paving.webp",
    shared_roof_shingle: "./../texture-packs/made-web/shared_roof_shingle.webp",
    shared_roof_tiles_red: "./../texture-packs/made-web/shared_roof_tiles_red.webp",
    shared_roof_thatch: "./../texture-packs/made-web/shared_roof_thatch.webp",
    cottage_roof_moss: "./../texture-packs/made-web/cottage_roof_moss.webp",
    shared_stone_wall_rough: "./../texture-packs/made-web/shared_stone_wall_rough.webp",
    shared_stone_ashlar: "./../texture-packs/made-web/shared_stone_ashlar.webp",
    shared_drystone: "./../texture-packs/made-web/shared_drystone.webp",
    wick_wall_timber_plaster: "./../texture-packs/made-web/wick_wall_timber_plaster.webp",
    shared_boardwalk_planks: "./../texture-packs/made-web/shared_boardwalk_planks.webp",
    shared_water_dark: "./../texture-packs/made-web/shared_water_dark.webp",
    wick_leaf_canopy: "./../texture-packs/made-web/wick_leaf_canopy.webp",
    shared_bark_oak: "./../texture-packs/made-web/shared_bark_oak.webp",
    thorn_rock_mossy: "./../texture-packs/made-web/thorn_rock_mossy.webp",
    thorn_bark_black: "./../texture-packs/made-web/thorn_bark_black.webp",
    // Chris's own world textures for Hearth & Heirloom (art-requests, section E; web copies of art-in/3d/world/)
    keep_wall_hearthstone: "./../texture-packs/aeth-web/keep_wall_hearthstone.webp",
    keep_roof_slate: "./../texture-packs/aeth-web/keep_roof_slate.webp",
    keep_banner_red: "./../texture-packs/aeth-web/keep_banner_red.webp",
    // (Places, step 5) the set dressing: Coven's barrel, crate, canvas and produce pictures (Chris's)
    shared_barrel_side: "./../texture-packs/made-web/shared_barrel_side.webp",
    shared_awning_stripes: "./../texture-packs/made-web/shared_awning_stripes.webp",
    shared_crate_side: "./../texture-packs/made-web/shared_crate_side.webp",
    shared_market_produce: "./../texture-packs/made-web/shared_market_produce.webp",
    camp_tent_canvas: "./../texture-packs/made-web/camp_tent_canvas.webp",
    shared_plaster_plain: "./../texture-packs/made-web/shared_plaster_plain.webp",
  };
  // (Places, November 20) Acts Two and Three: Chris's regional textures come in each place's own file (d.texFiles), so a
  // page carries only its own region's
  // ---- each region's look (Places). A biome may change any of it (BIOMES). Day: the 2D game is by day, so these places
  // are lit by a sun (core.js W3D.night, opt.day); a mine or a vault stays dark ----
  const DAY = { day: 1, sky: [1.0, 0.95, 0.86], moon: [0.62, 0.55, 0.44], ground: [0.42, 0.36, 0.3], fog: [0.86, 0.76, 0.62], fogNear: 70, fogFar: 260, hills: false };
  const CAVE = { day: 0, sky: [0.62, 0.52, 0.5], moon: [0.3, 0.26, 0.26], ground: [0.12, 0.08, 0.06], fog: [0.02, 0.018, 0.03], fogNear: 30, fogFar: 90, hills: false };
  const COLD = { day: 1, sky: [0.92, 0.95, 1.0], moon: [0.6, 0.6, 0.62], ground: [0.44, 0.46, 0.5], fog: [0.8, 0.85, 0.92], fogNear: 60, fogFar: 230, hills: false };
  const FORGE = { day: 0, sky: [0.7, 0.55, 0.5], moon: [0.32, 0.24, 0.2], ground: [0.14, 0.08, 0.05], fog: [0.06, 0.03, 0.02], fogNear: 30, fogFar: 90, hills: false };
  const LOOKS = {
    ironspire: {
      ground: { cob: 'iron_dwarf_stone', pave: 'iron_dwarf_stone', rep: [2.6, 3.6, 3.6, 3.0] },
      surfaces: { stone: 'iron_dwarf_stone', dry: 'shared_stone_wall_frosted_b', rock: 'shared_stone_wall_frosted_b' },
      rock: ['shared_stone_wall_frosted_b', 0xd8dce4], mass: 6, roofs: {}, tints: { stone: 0xe0e0e6, firs: 0xdce8e4 }, light: COLD, water: 0x8ca0b4,
    },
    below: {   // Act Three: the Hearth Below, under the Keep (council, hearth-roots, chains, worldforge)
      ground: { grass: 'iron_dwarf_stone', dirt: 'iron_dwarf_stone', cob: 'keep_floor_flags', pave: 'keep_floor_flags', rep: [2.6, 3.2, 3.2, 2.6] },
      surfaces: { stone: 'iron_dwarf_stone', dry: 'iron_dwarf_stone', rock: 'iron_dwarf_stone' },
      rock: ['iron_dwarf_stone', 0x948a84], mass: 5, roofs: {}, tints: { stone: 0xb8b0b0, dry: 0xb8b0b0 },
      light: { day: 0, sky: [0.95, 0.8, 0.74], moon: [0.5, 0.38, 0.32], ground: [0.22, 0.14, 0.1], fog: [0.07, 0.035, 0.025], fogNear: 34, fogFar: 110, hills: false, glowK: 2.2 },
      water: 0x502818, molten: 0xff6a1c,
    },
    gloomfen: {
      ground: { pave: 'gloom_boardwalk_old', grassTint: [0.42, 0.48, 0.4] },
      surfaces: { deck: 'gloom_boardwalk_old', planks: 'gloom_boardwalk_old', wood: 'gloom_boardwalk_old', timber: 'gloom_stilt_wood', rock: 'thorn_rock_mossy' },
      houses: 'timber', rock: ['thorn_rock_mossy', 0xd0d8c8], mass: 4, roofs: {}, tints: { deck: 0xffffff, wood: 0xffffff },
      light: { day: 0.75, sky: [0.8, 0.86, 0.8], moon: [0.4, 0.42, 0.38], ground: [0.26, 0.28, 0.24], fog: [0.55, 0.61, 0.57], fogNear: 16, fogFar: 95, hills: false },
      water: 0xa8b8a0, waterTex: 'gloom_bog_water',
    },
    sunscorch: {
      ground: { grass: 'sun_sand_ground', dirt: 'shared_dirt_track', cob: 'shared_cobbles_town', pave: 'sun_sandstone_wall', rep: [2.6, 4.2, 3.6, 3.0] },
      surfaces: { stone: 'sun_sandstone_wall', dry: 'sun_sandstone_wall', timber: 'sun_adobe_plaster', rock: 'sun_sandstone_wall' },
      houses: 'timber', rock: ['sun_sandstone_wall', 0xb88a70], mass: 5.5,
      roofs: { slate: ['sun_adobe_plaster', 0xf0e0cc, 0.4], red: ['sun_adobe_plaster', 0xd88868, 1.3], thatch: ['sun_awning_canvas', 0xffffff], moss: ['sun_awning_canvas', 0xffffff] },
      tints: { stone: 0xe8d8c8, dry: 0xe8d8c8 }, light: DAY, water: 0x9fd0c8,
    },
  };
  const SNOW = { grass: 'iron_snow_ground', dirt: 'iron_snow_ground' };
  const BIOMES = {
    // the Ironspire
    wilds: { alias: { wilds_birch_leaves: 'wick_leaf_canopy', shared_bough_birch: 'shared_bough_birch' }, surfaces: { firs: undefined, leaves: 'wilds_birch_leaves', dry: 'shared_drystone', rock: 'thorn_rock_mossy' }, rock: ['thorn_rock_mossy', 0xffffff], mass: 4, tints: {}, light: DAY },
    mountain: { mass: 7 },
    scree: { mass: 6, ground: SNOW },
    monastery: { mass: 6, ground: SNOW, houses: 'timber', surfaces: { timber: 'shared_stone_wall_frosted_b', stone: 'shared_stone_wall_frosted_b' }, tints: { timber: 0xffffff, stone: 0xffffff } },
    outpost: { mass: 5, ground: SNOW },
    tundra: { mass: 5, ground: SNOW, roofs: { slate: ['sun_awning_canvas', 0xc8c4bc], red: ['sun_awning_canvas', 0xc8a898], thatch: ['sun_awning_canvas', 0xd8c8b0], moss: ['sun_awning_canvas', 0xd0d0c0] } },
    'frozen-lake': { mass: 4, ground: Object.assign({ cob: 'iron_ice_lake' }, SNOW), water: 0x607888 },
    'dwarf-hall': { mass: 4, ground: { grass: 'iron_dwarf_stone', dirt: 'iron_dwarf_stone' }, rock: ['iron_dwarf_stone', 0x9a9690], light: FORGE },
    forge: { mass: 4, ground: { grass: 'iron_dwarf_stone', dirt: 'iron_dwarf_stone', cob: 'iron_forge_brick' }, surfaces: { stone: 'iron_forge_brick', dry: 'iron_forge_brick' }, rock: ['iron_dwarf_stone', 0x6a625e], light: FORGE },
    'ice-cave': { mass: 4, ground: { grass: 'iron_ice_lake', dirt: 'iron_ice_lake' }, rock: ['iron_ice_lake', 0xa8c4e0], light: Object.assign({}, CAVE, { sky: [0.5, 0.6, 0.75], fog: [0.02, 0.03, 0.06] }) },
    // the Hearth Below
    council: { surfaces: { stone: 'keep_wall_hearthstone' }, tints: { stone: 0x9890a8 }, light: Object.assign({}, CAVE, { sky: [0.78, 0.72, 0.88], moon: [0.4, 0.36, 0.44], fog: [0.03, 0.02, 0.05] }) },
    worldforge: { surfaces: { stone: 'iron_forge_brick', dry: 'iron_forge_brick' }, tints: { stone: 0xb0a0a0 } },
    // the Gloomfen (the two dark maps: the Mother's Hollow and the drowned belfry, by night in a green mist)
    'drowned-grove': { light: { day: 0, sky: [0.6, 0.66, 0.62], moon: [0.36, 0.4, 0.42], ground: [0.12, 0.14, 0.12], fog: [0.1, 0.14, 0.12], fogNear: 14, fogFar: 70, hills: false } },
    belfry: { light: Object.assign({}, CAVE, { sky: [0.5, 0.62, 0.56], fog: [0.03, 0.06, 0.05] }) },
    // the Sunscorch
    dunes: { mass: 2.6, mound: 1.3, ground: { cob: 'sun_glass_flats' }, roofs: { slate: ['sun_awning_canvas', 0xffffff], red: ['sun_awning_canvas', 0xffd0c0] } },
    canyon: { mass: 6.5, rock: ['sun_sandstone_wall', 0xb87860] },
    desert: { mass: 4.5 },
    'desert-town': { mass: 7 },
    'mine-camp': { mass: 5, light: { fog: [0.7, 0.6, 0.5] } },
    mine: { mass: 3.4, rock: ['sun_sandstone_wall', 0x9a7a66], light: CAVE },
    crystal: { mass: 3.4, rock: ['sun_glass_flats', 0x8090a8], light: CAVE },
    ash: { mass: 5, rock: ['sun_sandstone_wall', 0x6a5a56], surfaces: { stone: 'sun_sandstone_wall', dry: 'sun_sandstone_wall' }, tints: { stone: 0x8a7a76, dry: 0x8a7a76 }, light: { day: 0.6, sky: [0.86, 0.72, 0.62], moon: [0.5, 0.36, 0.28], fog: [0.36, 0.26, 0.22], fogNear: 40, fogFar: 160 } },
    vault: { mass: 3.4, tints: { stone: 0x9a8a80 }, light: CAVE },
  };
  // (Places, step 3) the lights a place can be in, by name: a place's data names one (d.light), and the pages' switch tries
  // the others. Act One's old look is 'night'
  const LIGHTS = {
    day: Object.assign({}, DAY, { fog: [0.8, 0.84, 0.86] }),
    dusk: { day: 0.5, sky: [0.95, 0.74, 0.64], moon: [0.72, 0.46, 0.32], ground: [0.24, 0.17, 0.17], fog: [0.5, 0.36, 0.36], fogNear: 40, fogFar: 170, hills: false },
    night: { day: 0, sky: [0.86, 0.8, 0.84], moon: [0.62, 0.56, 0.6], ground: [0.16, 0.13, 0.14], fog: [0.16, 0.15, 0.24], fogNear: 40, fogFar: 140 },
    indoor: { day: 0, sky: [0.84, 0.74, 0.66], moon: [0.42, 0.36, 0.32], ground: [0.16, 0.12, 0.1], fog: [0.04, 0.03, 0.03], fogNear: 30, fogFar: 100, hills: false },
  };
  G.M7_LIGHTS = LIGHTS;
  // a light made brighter by k by day and at dusk (sky and sun only; night and indoors stay as they are)
  const gained = (L, k) => (!L.day || k === 1) ? L : Object.assign({}, L, { sky: L.sky.map((v) => v * k), moon: L.moon.map((v) => v * k) });
  G.M7_GAINED = gained;
  const lookOf = (d) => {
    const L = LOOKS[d.region]; if (!L) return null;
    const B = BIOMES[d.biome] || {}, out = Object.assign({}, L, B);
    for (const k of ['ground', 'surfaces', 'roofs', 'tints', 'alias']) out[k] = Object.assign({}, L[k], B[k]);
    for (const k of Object.keys(out.surfaces)) if (out.surfaces[k] === undefined) delete out.surfaces[k];
    out.light = Object.assign({}, L.light, B.light);
    return out;
  };
  const mul32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  function make(d) {
    const [w, h] = d.tiles;
    // ---- the ground's height: 0 on dry land, down under the water; each corner of the tile grid is dry if any tile
    // touching it is, so dry tiles stay flat and the banks slope down inside the water's own tiles ----
    // each tile's own floor: dry 0, water -1.9, a ford -0.65 (ankle deep), the void -9; a corner takes the highest of the
    // four tiles round it, so dry tiles stay flat
    const LV = { 0: 0, 1: -1.9, 2: -0.65, 3: -9, 4: 0 };
    const LOOK = lookOf(d); let MOUND = 0;
    const lv = (i, j) => { i = Math.max(0, Math.min(w - 1, i)); j = Math.max(0, Math.min(h - 1, j)); return LV[d.tileH[j][i]]; };
    const CH = new Float32Array((w + 1) * (h + 1));
    for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) CH[j * (w + 1) + i] = Math.max(lv(i - 1, j - 1), lv(i, j - 1), lv(i - 1, j), lv(i, j));
    // (Places) the land's masses ('4': cliffs, scarps, dune crests, a mine's rock) rise where a corner is wholly among them;
    // a little lumpy, so a mesa's top isn't a table. Past the map's edge they carry on as its edge tiles do
    if (LOOK) {
      const ms = (i, j) => { i = Math.max(0, Math.min(w - 1, i)); j = Math.max(0, Math.min(h - 1, j)); return d.tileH[j][i] === '4'; };
      const R0 = mul32(w * 977 + h * 13), H0 = LOOK.mass || 5;
      MOUND = LOOK.mound || 0;
      for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) if (ms(i - 1, j - 1) && ms(i, j - 1) && ms(i - 1, j) && ms(i, j)) CH[j * (w + 1) + i] += H0 * (0.7 + R0() * 0.55);
    }
    const corner = (i, j) => CH[Math.max(0, Math.min(h, j)) * (w + 1) + Math.max(0, Math.min(w, i))];
    function ground(x, y) {
      // indoors there is nothing past the walls: the ground falls away into the dark
      if (d.interior && (x < -4 || y < -4 || x > w * TX + 4 || y > h * TY + 4)) return -9;
      const u = x / TX, v = y / TY, i = Math.floor(u), j = Math.floor(v), fu = ss(0, 1, u - i), fv = ss(0, 1, v - j);
      const a = corner(i, j), b = corner(i + 1, j), c = corner(i, j + 1), e = corner(i + 1, j + 1);
      let base = (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + e * fu) * fv;
      // (Places) past the map's edge a cliff's top slopes away, so the world doesn't end in a wall
      if (LOOK && base > 0) { const out = Math.max(-u, u - w, -v, v - h, 0); if (out > 0) base *= 1 - ss(3, 8.5, out); }
      // (Places) a dune crest standing alone: a soft hump inside its own tile, so the sand round it stays flat
      if (MOUND && i >= 0 && j >= 0 && i < w && j < h && d.tileH[j][i] === '4') return base + MOUND * Math.sin(Math.PI * (u - i)) * Math.sin(Math.PI * (v - j));
      return base;
    }
    // the roofs: the painting's kind for each house (slate, red tiles, thatch or moss), from Coven's roof pictures
    // Chris's textures are painted by day; the borrowed ones by night, so his are tinted down to sit with them
    const ROOF = Object.assign({ slate: ['keep_roof_slate', 0xb4b8c4], red: ['shared_roof_tiles_red', 0xffffff], thatch: ['shared_roof_thatch', 0xffffff], moss: ['cottage_roof_moss', 0xffffff] }, LOOK ? LOOK.roofs : {});
    const extraMats = {};
    // (Places, step 4) every roof wears the painting where it looks up: from above it is the roof the painting shows
    for (const [k, [tex, tint]] of Object.entries(ROOF)) extraMats['roof_' + k] = { tex, rep: 2.6, shade: 0.15, tint, side: 'double', paint: d.roofPainting ? 'm7_roofs' : null, paintMix: 0.7 };
    if (LOOK) Object.assign(extraMats, {
      rockL: { tex: LOOK.rock[0], rep: 2.2, tint: LOOK.rock[1], shade: 0.5, paint: 'm7_paint', paintMix: 0.6 },
      palmBark: { tex: 'shared_bark_oak', rep: 1.4, tint: 0xd8b890, shade: 0.5 },
      frond: { tex: 'wick_leaf_canopy', rep: 1.2, tint: 0xc8e070, shade: 0.4, side: 'double' },
      cactus: { tex: 'shared_grass_meadow', rep: 1.5, tint: 0x9ab070, shade: 0.4 },
      shrub: { tex: 'wick_leaf_canopy', rep: 1.5, tint: 0xb8b070, shade: 0.4 },
      clay: { tex: 'sun_adobe_plaster', rep: 1, tint: 0xd08860, shade: 0.4 },
      charred: { tex: 'thorn_bark_black', rep: 1.4, tint: 0x8a7a70, shade: 0.5 },
      crystalG: { emis: 0x88ccff, lit: 0, tint: 0x9fd8ff, cut: false },
      glassL: { tex: 'sun_glass_flats', rep: 1, tint: 0xc0e8f0, spec: 1, shade: 0.3 },
      glowA: { emis: 0xffb050, lit: 0, tint: 0xffb050, cut: false },
      glowE: { emis: 0xff6a30, lit: 0, tint: 0xff6a30, cut: false },
      glowR: { emis: 0x70b8ff, lit: 0, tint: 0x70b8ff, cut: false },
      iceL: { tex: 'shared_water_dark', rep: 1, tint: 0xd8ecff, spec: 1, shade: 0.3 },
      frosted: { tex: 'thorn_bark_black', rep: 1.4, tint: 0xc8ccd4, shade: 0.5 },
      ironL: { tex: 'iron_forge_brick', rep: 1, tint: 0x504848, spec: 0.6, shade: 0.5 },
      reed: { tex: 'shared_grass_meadow', rep: 1, tint: 0xc8c088, shade: 0.4 },
    });
    extraMats.roots = { tex: 'shared_bark_oak', rep: 1.6, tint: 0xd8c0a8, shade: 0.5 };
    extraMats.rockM = { tex: 'thorn_rock_mossy', rep: 2.2, tint: 0xffffff, shade: 0.5, paint: 'm7_paint', paintMix: 0.6 };
    extraMats.stake = { tex: 'shared_bark_oak', rep: 1.2, tint: 0xe0d0c0, shade: 0.5 };
    extraMats.glowF = { emis: 0x66ffcc, lit: 0, tint: 0x66ffcc, cut: false };
    extraMats.glowI = { emis: 0xc070ff, lit: 0, tint: 0xc070ff, cut: false };
    extraMats.paper = { tint: 0xeee2c4, shade: 0.4, cut: false };   // (Places) notices, a map on a table
    // (step 5) the set dressing's own surfaces
    // (the dressing's beams and planks share the place's own wood, its awnings the engine's striped cloth: no extra draws)
    extraMats.dSack = { tex: 'camp_tent_canvas', rep: 1.5, tint: 0xd0c8b8, shade: 0.5, side: 'double' };
    extraMats.dHay = { tex: 'shared_roof_thatch', rep: 1.2, tint: 0xfff0b0, shade: 0.35 };
    extraMats.dFood = { tex: 'shared_market_produce', rep: 1, tint: 0xffffff, shade: 0.35 };
    extraMats.dLog = { tex: 'shared_bark_oak', rep: 1.2, tint: 0xd8c8b8, shade: 0.5 };
    extraMats.dClay = { tex: 'shared_plaster_plain', rep: 1, tint: 0xc88860, shade: 0.4 };
    extraMats.dCoal = { emis: 0xff7a30, lit: 0, tint: 0xff8a40, cut: false };
    extraMats.banner = { tex: 'keep_banner_red', rep: 1, tint: 0x9a9090, side: 'double', shade: 0.3, cloth: true, wind: d.interior ? 0.05 : 0.12 };   // (step 4) they sway
    // the Keep's own stone (Hearthstone Keep, the Great Hall and the Keep's galleries)
    const KEEP = d.biome === 'keep';
    d.buildings.forEach((b) => { b.roof = Object.assign({}, b.roof, { mat: 'roof_' + (b.roof.kind || 'slate') }); if (KEEP) delete b.wear; });
    const textures = Object.entries(LIST).map(([id, src]) => ({ id, made: src, stand: src }));
    if (LOOK) {
      const FILES = d.texFiles || {};
      for (const [id, src] of Object.entries(FILES)) if (!textures.some((t) => t.id === id)) textures.push({ id, made: src, stand: src });
      for (const [id, file] of Object.entries(LOOK.alias)) if (!textures.some((t) => t.id === id)) { const src = FILES[file] || LIST[file]; textures.push({ id, made: src, stand: src }); }
      // a region's houses: their walls in its own plaster or stone; a flat roof where the painting's roof is pale
      d.buildings.forEach((b) => { b.walls = b.walls.map((wl) => Object.assign({}, wl, { t: LOOK.houses || wl.t })); delete b.wear; if (ROOF[b.roof.kind] && ROOF[b.roof.kind][2]) b.roof.rise = ROOF[b.roof.kind][2]; });
    }
    textures.push({ id: 'm7_paint', made: d.painting, stand: d.painting, clamp: true });
    if (d.roofPainting) textures.push({ id: 'm7_roofs', made: d.roofPainting, stand: d.roofPainting, clamp: true });   // (Places) the roofs' own painting
    const place = Object.assign({}, d, {
      mapId: d.id, pathsOnly: true, thicket: false, noRocks: [[-1e5, -1e5, 1e5, 1e5]],
      ground: Object.assign({ cob: 'shared_cobbles_town', grass: 'shared_grass_meadow', dirt: 'shared_dirt_track', pave: 'wick_bridge_paving', rep: [2.6, 3.6, 3.6, 2.4], paint: 'm7_paint', paintGain: 0.62 }, LOOK ? Object.assign({ rock: LOOK.rock[0], rockTint: LOOK.rock[1], rockRep: 4 }, LOOK.ground) : {}),
      surfaces: { stone: KEEP ? 'keep_wall_hearthstone' : 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'wick_wall_timber_plaster', planks: 'shared_boardwalk_planks', roof: 'shared_roof_shingle',
        wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'wick_bridge_paving', soil: 'shared_dirt_track', rock: 'thorn_rock_mossy', leaves: 'wick_leaf_canopy', bark: 'shared_bark_oak', ...(LOOK ? LOOK.surfaces : {}) },
      textures, extraMats, waterMerge: true, wind: d.interior ? 0 : 0.014, paintOn: { keys: ['deck', 'rock'], paint: 'm7_paint', mix: 0.75 },
      // the M7 places are by day in the 2D game: their leaves a little lighter than the borrowed night woods
      tints: Object.assign({ leaves: 0xf0fff4, bough: 0xc4d6c4, boughFir: 0xb0c4bc, bush: 0xf0fff0 }, KEEP ? { stone: 0x9c9ca8 } : {}, LOOK ? LOOK.tints : {}),
      ground_h: ground, walk_h: ground,
      water: d.water.map((wt) => ({ poly: wt.poly, level: () => -0.5, tex: 'shared_water_dark', rep: 6, flow: [0.004, 0.002], bed: -2.3, paint: 'm7_paint', paintMix: LOOK && LOOK.molten ? 0.25 : 0.55, tint: LOOK && LOOK.water, ...(LOOK && LOOK.waterTex ? { tex: LOOK.waterTex, rep: 8 } : {}), ...(LOOK && LOOK.molten ? { emis: LOOK.molten, flow: [0.02, 0.008], level: () => -0.25 } : {}) })),
      lightName: d.light || (LOOK ? (d.interior && !LOOK.light.day ? 'dark' : LOOK.light.day >= 1 ? 'day' : LOOK.light.day > 0 ? 'dusk' : 'dark') : 'night'),
      // the borrowed textures are painted at night, so a place built only from them takes a brighter sun (lightGain)
      lightGain: LOOK ? 1 : 1.3,
      night: d.light && LIGHTS[d.light] ? Object.assign({}, gained(LIGHTS[d.light], LOOK ? 1 : 1.3), d.night || {}) : LOOK ? Object.assign({}, d.interior && !LOOK.light.day ? CAVE : LOOK.light, d.night || {}) : Object.assign(d.interior ? { sky: [0.62, 0.52, 0.5], moon: [0.3, 0.26, 0.26], ground: [0.12, 0.08, 0.06], fog: [0.02, 0.018, 0.03], fogNear: 30, fogFar: 90, hills: false } : {}, { sky: [0.86, 0.8, 0.84], moon: [0.62, 0.56, 0.6], ground: [0.16, 0.13, 0.14], fog: [0.16, 0.15, 0.24], fogNear: 40, fogFar: 140 }, d.night || {}),
      paintingSrc: d.painting,
      extra: (K) => extra(K, d),
    });
    // (Places, step 4) on a phone: the trees deep inside a wood (the ones with trees on all four sides, which the outer ones
    // hide) and many of the woods past the map's edge are left out, and trees are drawn in bigger patches (fewer draws).
    // W3D.quality is known only when the walker starts, so this is decided when the place is built
    const ALL = place.extraTrees || [];
    Object.defineProperty(place, 'extraTrees', { configurable: true, enumerable: true, get() { return G.W3D && W3D.quality === 'phone' ? phoneTrees(ALL, d) : ALL; } });
    Object.defineProperty(place, 'lightTrees', { configurable: true, enumerable: true, get() { return G.W3D && W3D.quality === 'phone'; } });
    Object.defineProperty(place, 'groundPatch', { configurable: true, enumerable: true, get() { return G.W3D && W3D.quality === 'phone' ? 64 : 48; } });
    Object.defineProperty(place, 'treePatch', { configurable: true, enumerable: true, get() { return G.W3D && W3D.quality === 'phone' ? 48 : 40; } });
    return place;
  }
  const PHONE_TREES = new Map();
  function phoneTrees(all, d) {
    if (PHONE_TREES.has(d.id)) return PHONE_TREES.get(d.id);
    const [w, h] = d.tiles, at = new Set(), key = (i, j) => i + ',' + j;
    for (const t of all) at.add(key(Math.floor(t[0] / TX), Math.floor(t[1] / TY)));
    // the woods past the edge take the kind of tree the place itself mostly grows (one fewer set of materials per batch)
    const cnt = {}; for (const t of all) { const i = Math.floor(t[0] / TX), j = Math.floor(t[1] / TY); if (i >= 0 && j >= 0 && i < w && j < h) cnt[t[3]] = (cnt[t[3]] || 0) + 1; }
    const main = +(Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [0])[0];
    const R = mul32(w * 7 + h * 911), out0 = all.filter((t) => {
      const i = Math.floor(t[0] / TX), j = Math.floor(t[1] / TY), outside = i < 0 || j < 0 || i >= w || j >= h;
      if (outside) return R() < 0.45;
      const deep = at.has(key(i + 1, j)) && at.has(key(i - 1, j)) && at.has(key(i, j + 1)) && at.has(key(i, j - 1));
      return !deep || R() < 0.4;
    });
    const out = out0.map((t) => { const i = Math.floor(t[0] / TX), j = Math.floor(t[1] / TY); return (i < 0 || j < 0 || i >= w || j >= h) && t[3] !== main ? [t[0], t[1], t[2], main, t[4]] : t; });
    PHONE_TREES.set(d.id, out); return out;
  }

  // ---- crenels, towers and torches ----
  function extra(K, d) {
    const { B, X, Z, gh } = K, NS = { solid: false };
    // (Places, step 4: the places come alive) where the flames, the chimney tops and the embers are, in world metres, for
    // m7/life.js: every lantern the kit hangs, every lamp and Hearthfire, every chimney, every glowing ember
    const FX = d.__fx = { flames: [], smoke: [], sparks: [] }, lan = K.lantern;
    K.lantern = (x, y, z, n, s, h) => { FX.flames.push([x, y + 0.05, z, s || 1]); return lan(x, y, z, n, s, h); };
    for (const l of d.lamps || []) {
      const x = X(l.at[0]), z = Z(l.at[1]), g = gh(l.at[0], l.at[1]);
      if (l.kind === 'wood') FX.flames.push([x + 0.48, g + (l.h || 2.6) - 0.5, z, 0.9]);
      else if (l.kind === 'pillar') { if (!l.noLantern) FX.flames.push([x, g + (l.h || 1.45) + 0.3, z, 1.1]); }
      else FX.flames.push([x, g + (l.h || 3.0) + 0.1, z, 1.1]);
    }
    for (const wl of d.walls) {
      if (wl.low || wl.ruin) continue;
      if (wl.indoor) {   // a moulding along an indoor wall's top
        const [[ax, ay], [bx, by]] = wl.pts, A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)], ry = Math.atan2(-(Bp[1] - A[1]), Bp[0] - A[0]);
        B.box('stone', (A[0] + Bp[0]) / 2, gh((ax + bx) / 2, (ay + by) / 2) + wl.h, (A[1] + Bp[1]) / 2, Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) + 0.2, 0.2, wl.t + 0.2, ry, [0.8, 0.78, 0.84], NS);
        continue;
      }
      const [[ax, ay], [bx, by]] = wl.pts, A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)];
      const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
      const n = Math.max(1, Math.round(L / 1.0));
      for (let i = 0; i < n; i++) {
        if (i % 2) continue;
        const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, top = gh(ax + (bx - ax) * f, ay + (by - ay) * f) + wl.h;
        // a merlon at each face of the wall walk
        for (const s of [-1, 1]) B.box('stone', x + Math.sin(ry) * s * (wl.t / 2 - 0.18), top, z + Math.cos(ry) * s * (wl.t / 2 - 0.18), L / n * 0.9, 0.62, 0.36, ry, null, NS);
      }
      // a coping course along the top
      B.box('stone', (A[0] + Bp[0]) / 2, gh((ax + bx) / 2, (ay + by) / 2) + wl.h - 0.16, (A[1] + Bp[1]) / 2, L + 0.1, 0.18, wl.t + 0.16, ry, [0.86, 0.85, 0.9], NS);
    }
    // ---- the wild things: palisades, cliffs, root walls, the First-Age roots, glowing fungus and ichor ----
    const R = mul32(d.tiles[0] * 131 + d.tiles[1]);
    const UP = new THREE.Vector3(0, 1, 0);
    const rod = (k, a, b, r0, r1) => { const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = dir.length(); const g = new THREE.CylinderGeometry(r1, r0, L, 7, 1, false); g.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()); B.geom(k, g, new THREE.Matrix4().compose(new THREE.Vector3(...a), q, new THREE.Vector3(1, 1, 1)), null, [Math.PI * (r0 + r1), L]); g.dispose(); };
    for (const [[ax, ay], [bx, by]] of d.palisades || []) {
      if (d.fence) {   // (Places) the Gloomfen's rails and fences: posts with two rails, waist high
        const A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.max(1, Math.round(L / 1.4)), ry = Math.atan2(-(Bp[1] - A[1]), Bp[0] - A[0]);
        for (let i = 0; i <= n; i++) { const f = i / n, x = A[0] + (Bp[0] - A[0]) * f, z = A[1] + (Bp[1] - A[1]) * f; B.box(d.region === 'below' ? 'iron' : 'wood', x, gh(ax + (bx - ax) * f, ay + (by - ay) * f) - 0.4, z, 0.14, 1.45, 0.14, ry, [0.7, 0.6, 0.5]); }
        const g = gh((ax + bx) / 2, (ay + by) / 2); for (const hy of [0.45, 0.9]) B.box(d.region === 'below' ? 'iron' : 'wood', (A[0] + Bp[0]) / 2, Math.max(g, 0.08) + hy, (A[1] + Bp[1]) / 2, L, 0.08, 0.08, ry, [0.72, 0.62, 0.52], NS);
        continue;
      }
      const A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.max(2, Math.round(L / 0.34));
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, x = A[0] + (Bp[0] - A[0]) * f, z = A[1] + (Bp[1] - A[1]) * f, g = gh(ax + (bx - ax) * f, ay + (by - ay) * f), hh = 2.3 + R() * 0.5;
        B.cyl('stake', x, g - 0.3, z, 0.15, 0.15, hh + 0.3, 6);
        B.cyl('stake', x, g + hh, z, 0.15, 0.01, 0.4, 6, null, null, true);
      }
      const ry = Math.atan2(-(Bp[1] - A[1]), Bp[0] - A[0]);
      B.box('wood', (A[0] + Bp[0]) / 2, gh((ax + bx) / 2, (ay + by) / 2) + 1.5, (A[1] + Bp[1]) / 2, L, 0.14, 0.42, ry, [0.6, 0.48, 0.4], NS);
    }
    const RG = K.rockG;
    const rock = (k, x, y, z, s) => B.geom(k, RG[Math.floor(R() * RG.length)], new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 0.3, R() * 6.28, R() * 0.3)), new THREE.Vector3(s, s * (0.8 + R() * 0.6), s)), null, 1.2);
    const RK = lookOf(d) ? 'rockL' : 'rockM';
    for (const [px, py, s] of d.cliffs || []) { const x = X(px), z = Z(py), g = gh(px, py); rock(RK, x, g - 0.2, z, s); rock(RK, x + (R() - 0.5) * 1.2, g + s * 0.5, z + (R() - 0.5) * 1.2, s * 0.7); }
    if (lookOf(d)) regional(K, d, R, rod, rock);
    things(K, d, R);
    dress(K, d, R, rod);
    chimneys(K, d, R);
    // a root wall: an earth bank with thick roots twisting up out of it and over into the next tile
    for (const [px, py] of d.roots || []) {
      const x = X(px), z = Z(py), g = gh(px, py);
      if (R() < 0.6) rock('rockM', x + (R() - 0.5) * 0.8, g - 0.5, z + (R() - 0.5) * 0.8, 0.9 + R() * 0.4);
      for (let k = 0; k < 3; k++) {
        const a = R() * 6.28, r = 0.26 + R() * 0.2, top = g + 1.6 + R() * 1.4, m = [x + (R() - 0.5) * 0.6, top, z + (R() - 0.5) * 0.6];
        rod('roots', [x + Math.cos(a) * 1.2, g - 0.3, z + Math.sin(a) * 1.2], m, r, r * 0.8);
        rod('roots', m, [x - Math.cos(a) * 1.3, g + 0.4 + R() * 0.8, z - Math.sin(a) * 1.3], r * 0.8, r * 0.35);
      }
    }
    for (const [px, py] of d.firsts || []) {
      const x = X(px), z = Z(py), g = gh(px, py), hh = 3.5 + R() * 2.5;
      rod('roots', [x, g - 0.4, z], [x + (R() - 0.5) * 0.8, g + hh, z + (R() - 0.5) * 0.8], 0.95, 0.55);
      for (let k = 0; k < 3; k++) { const a = R() * 6.28; rod('roots', [x, g + 0.6, z], [x + Math.cos(a) * 1.7, g - 0.3, z + Math.sin(a) * 1.7], 0.45, 0.2); }
    }
    for (const [px, py, kind] of d.glows || []) {
      if (kind && kind !== 'ichor') continue;   // (Places) a region's own glow: regional()
      const x = X(px), z = Z(py), g = gh(px, py), ich = kind === 'ichor';
      if (ich) { K.lights.push([px, py, 70, 0.8, 'moonwell']); continue; }   // ichor: the painting's own puddles, glowing
      for (let k = 0; k < 4; k++) { const sx = x + (R() - 0.5) * 1.4, sz = z + (R() - 0.5) * 1.4, hh = 0.15 + R() * 0.25; B.cyl('glowF', sx, g, sz, 0.03, 0.03, hh, 4, null, null, true); B.cyl('glowF', sx, g + hh, sz, 0.14, 0.02, 0.07, 7); }
      K.lights.push([px, py, 60, 0.7, 'moonwell']);
    }
    // indoors: the pillars, round and full height, and the walls' tops dressed
    for (const [px, py] of d.pillars || []) {
      const x = X(px), z = Z(py), g = gh(px, py);
      B.box('stone', x, g, z, 1.3, 0.35, 1.3, 0, [0.85, 0.84, 0.9]);
      B.cyl('stone', x, g + 0.35, z, 0.5, 0.5, 4.2, 12, [0.95, 0.94, 1]);
      B.box('stone', x, g + 4.55, z, 1.2, 0.3, 1.2, 0, [0.85, 0.84, 0.9], NS);
    }
    // the Keep's red banners: either side of a hall's great door, and along the Great Hall's walls
    if (d.biome === 'keep') {
      const banner = (x, y, z, n) => {   // a banner 1.1 m wide hanging 2.4 m from a pole, its face toward n ([nx, nz])
        const t = [n[1], -n[0]], w = 0.55, top = y, bot = y - 2.4, o = 0.06;
        const P = (a, b) => [x + t[0] * a + n[0] * o, b, z + t[1] * a + n[1] * o];
        B.quad('banner', P(-w, bot), P(w, bot), P(w, top), P(-w, top), [0, 0, 1, 1]);
        B.box('iron', x + n[0] * 0.1, top + 0.02, z + n[1] * 0.1, Math.abs(n[1]) > 0.5 ? 1.3 : 0.05, 0.05, Math.abs(n[0]) > 0.5 ? 1.3 : 0.05, 0, null, NS);
      };
      for (const b of d.buildings) {
        if (!/^hall/.test(b.id)) continue;
        const door = (b.doors || [])[0]; if (!door) continue;
        const z = Z(b.fp[3]), g = gh(door.x, b.fp[3] + 4), top = g + Math.min(b.walls[0].h - 0.3, 4.6);
        for (const s of [-1, 1]) banner(X(door.x) + s * 2.1, top, z, [0, 1]);
      }
      if (d.interior) {
        for (const wl of d.walls) {
          const [[ax, ay], [bx, by]] = wl.pts; if (ay !== by || bx - ax < 150) continue;
          // which side of this wall is the room: the side that is walkable just past its face
          const yS = ay + 30, yN = ay - 30, mid = (ax + bx) / 2;
          const n = (yS < d.size[1] && !isWallAt(d, mid, yS)) ? [0, 1] : [0, -1];
          for (let x = ax + 75; x < bx - 50; x += 200) banner(X(x), gh(x, ay) + wl.h - 0.15, Z(ay) + n[1] * (wl.t / 2 + 0.02), n);
        }
      }
    }
    for (const [px, py] of d.towers) {
      const x = X(px), z = Z(py), g = gh(px, py), H = 5.4, s = 2.5;
      B.box('stone', x, g - 0.4, z, s, H + 0.4, s, 0, [0.95, 0.94, 0.98]);
      B.box('stone', x, g + H - 0.2, z, s + 0.3, 0.24, s + 0.3, 0, [0.86, 0.85, 0.9], NS);
      for (let k = 0; k < 4; k++) for (const e of [-1, 1]) {
        const ox = k < 2 ? e * (s / 2) : (k === 2 ? -1 : 1) * (s / 2), oz = k < 2 ? (k === 0 ? -1 : 1) * (s / 2) : e * (s / 2);
        if (k < 2) B.box('stone', x + ox * 0.55, g + H, z + oz, 0.62, 0.62, 0.36, 0, null, NS); else B.box('stone', x + ox, g + H, z + oz * 0.55, 0.36, 0.62, 0.62, 0, null, NS);
      }
      // a slate cap on the corner towers, as in the painting
      const cap = new THREE.ConeGeometry(s * 0.62, 2.2, 4, 1, true); cap.rotateY(Math.PI / 4);
      B.geom('roof_slate', cap, new THREE.Matrix4().makeTranslation(x, g + H + 0.62 + 1.1, z), null, [3, 2]); cap.dispose();
    }
    for (const [px, py, side, dir] of d.torches) {
      const g = gh(px, py), front = side === 'front';
      if (side === 'sconce') {   // a torch on an indoor wall, on the room's side
        const [a, b] = (dir || '0,1').split(',').map(Number);
        const x = X(px) + a * 1.05, z = Z(py) + b * 1.05;
        K.lantern(x, g + 2.0, z, [a, 0, b], 0.95);
        K.lights.push([px + a * 1.05 / 0.04, py + b * 1.05 / 0.05, 140, 1.3, 'warm']); continue;
      }
      if (side === 'bowl') {   // a fire in an iron bowl on a low wall
        const x = X(px), z = Z(py), y = g + 0.9;
        B.cyl('iron', x, y, z, 0.18, 0.42, 0.3, 10); K.lantern(x, y + 0.42, z, null, 0.8);
        K.lights.push([px, py, 170, 1.4, 'forge']); continue;
      }
      const n = front ? [0, 0, 1] : side === 's' ? [0, 0, 1] : side === 'n' ? [0, 0, -1] : side === 'e' ? [1, 0, 0] : [-1, 0, 0];
      const off = front ? 0.12 : 0.95;
      const x = X(px) + n[0] * off, z = Z(py) + n[2] * off, y = g + (front ? 2.6 : 2.9);
      K.lantern(x, y, z, n, 1.05);
      K.lights.push([px + n[0] * off / 0.04, py + n[2] * off / 0.05 + 6, 130, 1.25, 'warm']);
    }
  }

  // ---- (Places) the regions' own things: rocks at a cliff's foot, palms, cacti, crystal spires, dead trees, a mine's
  // props, columns; jars, shrubs, carts, crystal clusters, glass shards, stumps, urns; glowing veins and embers ----
  function regional(K, d, R, rod, rock) {
    const { B, X, Z, gh } = K, NS = { solid: false };
    for (const [px, py, s] of d.faces || []) rock('rockL', X(px), gh(px, py) - 0.3, Z(py), s);
    const cone = (k, x, y, z, r, hh, tx, tz, seg) => { const g = new THREE.ConeGeometry(r, hh, seg || 5); g.translate(0, hh / 2, 0); B.geom(k, g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tx || 0, R() * 6.28, tz || 0)), new THREE.Vector3(1, 1, 1)), null, [r * 4, hh]); g.dispose(); };
    const blob = (k, x, y, z, r) => { const g = new THREE.IcosahedronGeometry(r, 0); B.geom(k, g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, 0.75, 1)), null, r * 3); g.dispose(); };
    for (const [px, py, kind, seed, sc] of d.stand || []) {
      const x = X(px), z = Z(py), g = gh(px, py), s = sc || 1;
      if (kind === 'palm') {
        const hh = (4.6 + R() * 1.6) * s, lx = (R() - 0.5) * 1.4, lz = (R() - 0.5) * 1.4;
        const pts = [0, 0.35, 0.7, 1].map((f) => [x + lx * f * f, g + hh * f, z + lz * f * f]);
        for (let i = 0; i < 3; i++) rod('palmBark', pts[i], pts[i + 1], 0.24 - i * 0.04, 0.2 - i * 0.04);
        const [tx, ty, tz] = pts[3], n = 9;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.28 + R() * 0.4, L = 2.6 + R() * 0.8, c = Math.cos(a), sn = Math.sin(a), wd = 0.42;
          const mid = [tx + c * L * 0.5, ty + 0.35, tz + sn * L * 0.5], end = [tx + c * L, ty - 0.9 - R() * 0.5, tz + sn * L];
          const p = (q, k) => [q[0] - sn * wd * k, q[1], q[2] + c * wd * k];
          B.quad('frond', p([tx, ty, tz], 0.3), p([tx, ty, tz], -0.3), p(mid, -1), p(mid, 1), [0, 0, 1, 0.5]);
          B.quad('frond', p(mid, 1), p(mid, -1), p(end, -0.15), p(end, 0.15), [0, 0.5, 1, 1]);
        }
        K.shadeMarks && K.shadeMarks.push(['dot', px, py, 40, 0.72]);
      } else if (kind === 'cactus') {
        const hh = (2.2 + R() * 1.2) * s;
        B.cyl('cactus', x, g - 0.1, z, 0.3, 0.26, hh, 8); B.cyl('cactus', x, g + hh - 0.1, z, 0.26, 0.05, 0.25, 8);
        for (const side of [-1, 1]) { if (R() < 0.25) continue; const ay = g + 0.8 + R() * 0.8, a = R() * 6.28, ox = Math.cos(a) * side * 0.55, oz = Math.sin(a) * side * 0.55; rod('cactus', [x, ay, z], [x + ox, ay + 0.1, z + oz], 0.16, 0.16); B.cyl('cactus', x + ox, ay, z + oz, 0.17, 0.15, 0.8 + R() * 0.6, 7); }
      } else if (kind === 'spire') {
        const crys = d.biome === 'crystal', k = crys ? 'crystalG' : 'glassL';
        for (let i = 0; i < 4; i++) cone(k, x + (R() - 0.5) * 1.2, g - 0.2, z + (R() - 0.5) * 1.2, 0.3 + R() * 0.3, (i ? 1.2 + R() * 1.6 : 2.6 + R() * 1.6) * s, (R() - 0.5) * 0.5, (R() - 0.5) * 0.5, 5);
        if (crys) K.lights.push([px, py, 70, 0.7, 'moonwell']);
      } else if (kind === 'dead' || kind === 'charred') {
        const hh = (3 + R() * 1.5) * s, top = [x + (R() - 0.5) * 0.6, g + hh, z + (R() - 0.5) * 0.6];
        rod('charred', [x, g - 0.2, z], top, 0.26, 0.1);
        for (let i = 0; i < 3; i++) { const a = R() * 6.28, f = 0.45 + R() * 0.35, b0 = [x + (top[0] - x) * f, g + hh * f, z + (top[2] - z) * f]; rod('charred', b0, [b0[0] + Math.cos(a) * 1.2, b0[1] + 0.9, b0[2] + Math.sin(a) * 1.2], 0.09, 0.03); }
      } else if (kind === 'prop') {
        B.box('wood', x, g, z, 0.3, 2.9, 0.3, 0, [0.85, 0.72, 0.58]); B.box('wood', x, g + 2.9, z, 1.9, 0.28, 0.32, R() < 0.5 ? 0 : Math.PI / 2, [0.8, 0.68, 0.55], NS);
      } else if (kind === 'statue') {   // a carved king: a tall block on a plinth, a crowned head
        B.box('stone', x, g, z, 1.6, 0.6, 1.6, 0, [0.85, 0.84, 0.88]); B.box('stone', x, g + 0.6, z, 1.0, 3.2, 0.8, 0, [0.95, 0.94, 0.98]); B.box('stone', x, g + 3.8, z, 0.7, 0.8, 0.7, 0, [0.95, 0.94, 0.98]); B.cyl('stone', x, g + 4.6, z, 0.4, 0.45, 0.3, 6);
      } else if (kind === 'anvil') {
        B.box('stone', x, g, z, 0.7, 0.55, 0.6, 0, [0.6, 0.55, 0.5]); B.box('iron', x, g + 0.55, z, 1.1, 0.3, 0.45, 0, [0.6, 0.6, 0.65]); B.cyl('iron', x + 0.62, g + 0.62, z, 0.16, 0.02, 0.01, 6);
      } else if (kind === 'icecol') {
        cone('iceL', x, g - 0.2, z, 0.75, 4.6, 0, 0, 6); cone('iceL', x + 0.3, g + 4.4, z, 0.5, -0.01 + 0.8, Math.PI, 0, 6);
      } else if (kind === 'frostdead') {
        const hh = (2.6 + R() * 1.4) * s, top = [x + (R() - 0.5) * 0.6, g + hh, z + (R() - 0.5) * 0.6];
        rod('frosted', [x, g - 0.2, z], top, 0.22, 0.08);
        for (let i = 0; i < 3; i++) { const a = R() * 6.28, f = 0.45 + R() * 0.35, b0 = [x + (top[0] - x) * f, g + hh * f, z + (top[2] - z) * f]; rod('frosted', b0, [b0[0] + Math.cos(a) * 1.0, b0[1] + 0.8, b0[2] + Math.sin(a) * 1.0], 0.08, 0.03); }
      } else if (kind === 'table') {   // the Council's round table, one stone
        if (!K._table) { K._table = 1; }
        B.cyl('stone', x, g, z, 0.9, 1.0, 0.85, 14, [0.8, 0.76, 0.86]);
      } else if (kind === 'ironroot') {
        const hh = 4 + R() * 2.5; rod('ironL', [x, g - 0.4, z], [x + (R() - 0.5) * 1.2, g + hh, z + (R() - 0.5) * 1.2], 0.6, 0.3);
        for (let i = 0; i < 3; i++) { const a = R() * 6.28; rod('ironL', [x, g + 0.5, z], [x + Math.cos(a) * 1.6, g - 0.3, z + Math.sin(a) * 1.6], 0.32, 0.12); }
      } else if (kind === 'chain' || kind === 'hook') {   // a great chain (links, alternately turned) up into the dark; a hook hung low
        const top = kind === 'chain' ? 9 : 7, bot = kind === 'chain' ? -0.2 : 2.2, L = kind === 'chain' ? 0.9 : 0.5, n = Math.round((top - bot) / L), tz = kind === 'chain' ? (R() - 0.5) * 3 : 0;
        for (let i = 0; i < n; i++) { const f = i / n, y = g + bot + (top - bot) * f, link = new THREE.TorusGeometry(L * 0.42, L * 0.1, 5, 10); link.scale(1, 1.5, 1);
          B.geom('ironL', link, new THREE.Matrix4().compose(new THREE.Vector3(x + tz * f, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i % 2 ? Math.PI / 2 : 0, 0)), new THREE.Vector3(1, 1, 1)), null, 1); link.dispose(); }
        if (kind === 'hook') rod('ironL', [x, g + bot, z], [x + 0.35, g + bot - 0.6, z], 0.06, 0.04);
      } else if (kind === 'column') {
        B.box('stone', x, g, z, 1.2, 0.3, 1.2, 0, [0.85, 0.84, 0.9]); B.cyl('stone', x, g + 0.3, z, 0.45, 0.45, R() < 0.3 ? 1.2 + R() : 3.6, 10, [0.95, 0.94, 1]);
      }
    }
    for (const [px, py, kind] of d.smalls || []) {
      const x = X(px), z = Z(py), g = gh(px, py);
      if (kind === 'shrub') { for (let i = 0; i < 3; i++) blob('shrub', x + (R() - 0.5) * 0.8, g + 0.25, z + (R() - 0.5) * 0.8, 0.35 + R() * 0.2); }
      else if (kind === 'jar' || kind === 'urn') { const k = kind === 'jar' ? 'clay' : 'stone'; for (let i = 0; i < 2; i++) { const ox = (R() - 0.5) * 0.9, oz = (R() - 0.5) * 0.9, hh = 0.7 + R() * 0.3; B.cyl(k, x + ox, g, z + oz, 0.2, 0.34, hh * 0.55, 10); B.cyl(k, x + ox, g + hh * 0.55, z + oz, 0.34, 0.14, hh * 0.45, 10); } }
      else if (kind === 'cart') { B.box('wood', x, g + 0.35, z, 0.9, 0.6, 1.3, 0, [0.8, 0.66, 0.52]); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl('iron', x + sx * 0.48, g, z + sz * 0.4, 0.2, 0.2, 0.08, 8); }
      else if (kind === 'cluster' || kind === 'shard') { const k = kind === 'cluster' ? 'crystalG' : 'glassL'; for (let i = 0; i < 4; i++) cone(k, x + (R() - 0.5) * 0.8, g - 0.1, z + (R() - 0.5) * 0.8, 0.12 + R() * 0.12, 0.5 + R() * 0.7, (R() - 0.5) * 0.8, (R() - 0.5) * 0.8, 4); }
      else if (kind === 'sledge') { B.box('wood', x, g + 0.25, z, 0.9, 0.3, 1.8, 0.3, [0.85, 0.72, 0.58]); for (const sx of [-1, 1]) B.box('iron', x + sx * 0.42, g, z, 0.06, 0.12, 2.0, 0.3, [0.6, 0.6, 0.65], NS); }
      else if (kind === 'reeds' || kind === 'reedbed') { const n = kind === 'reeds' ? 7 : 14, sp = kind === 'reeds' ? 0.9 : 1.6; for (let i = 0; i < n; i++) cone('reed', x + (R() - 0.5) * sp, g - 0.3, z + (R() - 0.5) * sp, 0.04, 1.0 + R() * 0.9, (R() - 0.5) * 0.3, (R() - 0.5) * 0.3, 3); }
      else if (kind === 'rack') { B.box('wood', x, g, z, 1.6, 0.1, 0.5, 0, [0.5, 0.4, 0.34]); for (const sx of [-0.7, 0.7]) B.box('wood', x + sx, g, z, 0.12, 2.2, 0.12, 0, [0.5, 0.4, 0.34]); B.box('wood', x, g + 2.1, z, 1.6, 0.12, 0.14, 0, [0.5, 0.4, 0.34]); for (let i = 0; i < 4; i++) rod('ironL', [x - 0.5 + i * 0.33, g + 2.05, z], [x - 0.5 + i * 0.33 + 0.1, g + 0.4, z + 0.1], 0.05, 0.08); }
      else if (kind === 'stump') { B.cyl('charred', x, g - 0.1, z, 0.4, 0.32, 0.6, 8); }
    }
    for (const [px, py, kind] of d.glows || []) {
      if (!kind || kind === 'ichor') continue;
      const x = X(px), z = Z(py), g = gh(px, py);
      if (kind === 'frost' || kind === 'amber') { for (let i = 0; i < 3; i++) cone(kind === 'frost' ? 'crystalG' : 'glowA', x + (R() - 0.5) * 1.2, g - 0.1, z + (R() - 0.5) * 1.2, 0.1 + R() * 0.08, 0.4 + R() * 0.4, (R() - 0.5) * 0.6, (R() - 0.5) * 0.6, 4); K.lights.push([px, py, 70, 0.8, kind === 'frost' ? 'moonwell' : 'forge']); }
      else if (kind === 'rune') { B.box('glowR', x, g, z, 0.5, 0.12, 0.5, R(), null, NS); K.lights.push([px, py, 60, 0.7, 'moonwell']); }
      else if (kind === 'ember' || kind === 'lava') { if (d.__fx) d.__fx.sparks.push([x, g + 0.1, z]); }
      if (kind === 'lava') { K.lights.push([px, py, 110, 1.1, 'forge']); continue; }
      if (kind === 'ember') { for (let i = 0; i < 4; i++) blob('glowE', x + (R() - 0.5) * 1.2, g + 0.02, z + (R() - 0.5) * 1.2, 0.12 + R() * 0.1); K.lights.push([px, py, 70, 0.8, 'forge']); }
      else if (kind === 'glint') { for (let i = 0; i < 2; i++) cone('glassL', x + (R() - 0.5) * 1.2, g - 0.1, z + (R() - 0.5) * 1.2, 0.12, 0.35, 1.2, 0, 4); }
      else if (kind === 'wisp') K.lights.push([px, py, 60, 0.6, 'moonwell']);
      else if (kind === 'lava') K.lights.push([px, py, 110, 1.1, 'forge']);
    }
  }

  // ---- (Places, step 4) a stone chimney on every house (not the halls, stalls, tents or a region with flat roofs), near
  // one end of its ridge: real 3D, where the painting's chimneys used to be painted on ----
  function chimneys(K, d, R) {
    const { B, X, Z, gh } = K, flat = d.region === 'sunscorch' || d.region === 'below';
    if (flat || d.interior) return;
    for (const b of d.buildings || []) {
      const [x0, y0, x1, y1] = b.fp, tw = (x1 - x0) / TX, td = (y1 - y0) / TY;
      if (/^hall/.test(b.id) || tw * td < 4 || !b.roof || b.roof.kind === 'thatch' && d.region === 'ironspire') continue;
      const ew = b.roof.ridge === 'ew', f = R() < 0.5 ? 0.2 : 0.8, wh = (b.walls || []).reduce((a, w) => a + w.h, 0) || 3.2;
      const px = ew ? x0 + (x1 - x0) * f : (x0 + x1) / 2 + (R() - 0.5) * 20, py = ew ? (y0 + y1) / 2 - 8 : y0 + (y1 - y0) * f;
      const g = gh((x0 + x1) / 2, y1 - 4), top = g + wh + b.roof.rise * 0.92 + 0.9;
      B.box('stone', X(px), g + wh, Z(py), 0.62, top - g - wh, 0.62, 0, [0.82, 0.8, 0.84]);
      B.box('stone', X(px), top, Z(py), 0.74, 0.14, 0.74, 0, [0.7, 0.68, 0.72], { solid: false });
      if (d.__fx) d.__fx.smoke.push([X(px), top + 0.2, Z(py)]);
    }
  }

  // ---- (Places, step 5) the set dressing: the small things the painting draws, stood up in 3D (m7/dressing.mjs ->
  // d.dress: { k, at: [px, py], face: radians, s: size, to: [px, py] for a fence, solid: false on a walkable tile, so
  // walking stays exactly M7's tiles). All of it goes into the place's builder: one draw per material, however many ----
  function dress(K, d, R, rod) {
    const { B, X, Z, gh } = K, NS = { solid: false }, HAVE = K.have || (() => false);
    const sph = (k, x, y, z, sx, sy, sz, ry) => { const g = new THREE.SphereGeometry(1, 9, 6); B.geom(k, g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)), new THREE.Vector3(sx, sy, sz)), null, [2, 1]); g.dispose(); };
    const log = (k, x, y, z, r, L, ry) => { const g = new THREE.CylinderGeometry(r, r, L, 9); g.rotateZ(Math.PI / 2); B.geom(k, g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), null, [r * 6, L]); g.dispose(); };
    const wheel = (x, y, z, r, ry) => { const g = new THREE.CylinderGeometry(r, r, 0.09, 12); g.rotateX(Math.PI / 2); B.geom('wood', g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), [0.7, 0.6, 0.5], [r * 2, r * 2]); g.dispose(); };
    for (const it of d.dress || []) {
      const [px, py] = it.at, x = X(px), z = Z(py), g = gh(px, py), sz = it.s || 1;
      // the face: a direction in the painting (0 = toward the bottom of the painting), turned into the world's
      const fa = it.face || 0, wdx = X(px + Math.sin(fa) * 10) - x, wdz = Z(py + Math.cos(fa) * 10) - z, ry = Math.atan2(wdx, wdz);
      const c = Math.cos(ry), sn = Math.sin(ry), L = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];   // local (across, forward) -> world
      const was = B.solid; if (it.solid === false) B.solid = false;
      const bk = HAVE('shared_barrel_side') ? 'barrel' : 'wood', ck = HAVE('shared_crate_side') ? 'crate' : 'wood';
      const barrel = (bx, bz, h) => { B.cyl(bk, bx, g, bz, 0.33, 0.33, h || 0.9, 14, [1, 1, 1], [1, 1], true); const ns = B.solid; B.solid = false; B.cyl('wood', bx, g + (h || 0.9) - 0.06, bz, 0.315, 0.315, 0.03, 14, [0.8, 0.62, 0.5]); B.solid = ns; };
      const crate = (bx, by, bz, w, r) => B.box(ck, bx, by, bz, w, w * 0.85, w, r, [1, 1, 1], { fit: ck === 'crate' });
      let shade = 16;
      switch (it.k) {
        case 'barrel': barrel(x, z); break;
        case 'barrels': { const P = [[-0.36, -0.2], [0.36, -0.2], [0, 0.42]]; for (const [a, b] of P.slice(0, sz >= 1 ? 3 : 2)) { const [bx, bz] = L(a, b); barrel(bx, bz, 0.84 + R() * 0.1); } shade = 24; break; }
        case 'crate': crate(x, g, z, 0.8 * sz, ry + (R() - 0.5) * 0.3); break;
        case 'crates': { const [ax, az] = L(-0.42, 0), [bx, bz] = L(0.42, 0.05); crate(ax, g, az, 0.8, ry + 0.1); crate(bx, g, bz, 0.75, ry - 0.15); const ns = B.solid; B.solid = false; crate((ax + bx) / 2, g + 0.66, (az + bz) / 2, 0.62, ry + 0.3); B.solid = ns; shade = 24; break; }
        case 'sacks': { for (let i = 0; i < 3; i++) { const [sx, sz2] = L((i - 1) * 0.42, (R() - 0.5) * 0.2); sph('dSack', sx, g + 0.3, sz2, 0.27, 0.36, 0.24, ry + (R() - 0.5)); } shade = 20; break; }
        case 'cart': {   // a two-wheeled handcart: its bed, sides, shafts forward, a load of produce or sacks
          const lift = 0.5;
          B.box('wood', x, g + lift, z, 1.1, 0.1, 1.7, ry, [0.9, 0.82, 0.74]);
          for (const s2 of [-1, 1]) { const [sx, sz2] = L(s2 * 0.53, 0); B.box('wood', sx, g + lift + 0.1, sz2, 0.06, 0.32, 1.7, ry, [0.86, 0.78, 0.7], NS); const [wx, wz] = L(s2 * 0.62, -0.15); wheel(wx, g + 0.42, wz, 0.42, ry + Math.PI / 2); }
          for (const s2 of [-0.3, 0.3]) { const [ax, az] = L(s2, 0.8), [bx, bz] = L(s2 * 0.8, 1.9); rod('wood', [ax, g + lift + 0.05, az], [bx, g + 0.25, bz], 0.04, 0.035); }
          const [lx, lz] = L(0, -0.1); if (it.load === 'sacks') for (let i = 0; i < 3; i++) sph('dSack', lx + (R() - 0.5) * 0.5, g + lift + 0.3, lz + (i - 1) * 0.45, 0.24, 0.24, 0.3, ry); else B.box('dFood', lx, g + lift + 0.1, lz, 0.9, 0.25, 1.3, ry, null, NS);
          shade = 30; break;
        }
        case 'stall': {   // a market stall: four posts, a counter of produce, a striped awning sloping to the front
          const W = 2.4 * sz, D = 1.4;
          for (const [a, b] of [[-W / 2 + 0.08, -D / 2 + 0.08], [W / 2 - 0.08, -D / 2 + 0.08], [-W / 2 + 0.08, D / 2 - 0.08], [W / 2 - 0.08, D / 2 - 0.08]]) { const [sx, sz2] = L(a, b); B.box('wood', sx, g, sz2, 0.1, b < 0 ? 2.45 : 2.1, 0.1, ry, null, NS); }
          const [cx, cz] = L(0, 0.25); B.box('wood', cx, g, cz, W - 0.2, 0.85, 0.7, ry, [0.9, 0.84, 0.76]);
          B.box('dFood', cx, g + 0.85, cz, W - 0.3, 0.12, 0.62, ry, null, NS);
          const A = L(-W / 2 - 0.1, -D / 2 - 0.05), Bq = L(W / 2 + 0.1, -D / 2 - 0.05), C = L(W / 2 + 0.1, D / 2 + 0.25), Dq = L(-W / 2 - 0.1, D / 2 + 0.25);
          B.quad('cloth', [Dq[0], g + 2.0, Dq[1]], [C[0], g + 2.0, C[1]], [Bq[0], g + 2.5, Bq[1]], [A[0], g + 2.5, A[1]], [0, 0, Math.round(W / 0.6), 1]);
          B.quad('cloth', [Dq[0], g + 1.75, Dq[1]], [C[0], g + 1.75, C[1]], [C[0], g + 2.0, C[1]], [Dq[0], g + 2.0, Dq[1]], [0, 0, Math.round(W / 0.6), 0.25]);
          shade = 34; break;
        }
        case 'well': {   // a round stone well, a little roof on two posts, a bucket on the rope
          const n = 10, r = 0.8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r; B.box('stone', bx, g, bz, 0.52, 0.85, 0.28, -a + Math.PI / 2, [0.92, 0.9, 0.94]); }
          B.cyl('stone', x, g + 0.2, z, 0.62, 0.62, 0.05, 12, [0.2, 0.25, 0.3], null, false);
          for (const s2 of [-1, 1]) { const [sx, sz2] = L(s2 * 0.88, 0); B.box('wood', sx, g, sz2, 0.13, 2.3, 0.13, ry, null, NS); }
          { const [ax, az] = L(-1.0, 0), [bx, bz] = L(1.0, 0); rod('wood', [ax, g + 2.0, az], [bx, g + 2.0, bz], 0.06, 0.06); }
          for (const s2 of [-1, 1]) { const A = L(-1.2, 0), Bq = L(1.2, 0), C = L(1.2, s2 * 0.85), Dq = L(-1.2, s2 * 0.85); const top = g + 2.55, lo = g + 2.05; if (s2 > 0) B.quad('wood', [A[0], top, A[1]], [Bq[0], top, Bq[1]], [C[0], lo, C[1]], [Dq[0], lo, Dq[1]], [0, 0, 2.4, 1], [0.8, 0.7, 0.6]); else B.quad('wood', [Bq[0], top, Bq[1]], [A[0], top, A[1]], [Dq[0], lo, Dq[1]], [C[0], lo, C[1]], [0, 0, 2.4, 1], [0.8, 0.7, 0.6]); }
          B.cyl('wood', x, g + 1.3, z, 0.14, 0.17, 0.26, 8, [0.7, 0.55, 0.45], null, false);
          shade = 40; break;
        }
        case 'fence': case 'pickets': {   // a wooden fence from at to to: posts and two rails (pickets: close boards)
          const [qx, qy] = it.to, bx = X(qx), bz = Z(qy), dx = bx - x, dz = bz - z, Ln = Math.hypot(dx, dz), fr = Math.atan2(-dz, dx), n = Math.max(1, Math.round(Ln / 1.3));
          for (let i = 0; i <= n; i++) { const f = i / n; B.box('wood', x + dx * f, gh(px + (qx - px) * f, py + (qy - py) * f) - 0.1, z + dz * f, 0.13, 1.15, 0.13, fr, [0.85, 0.75, 0.65]); }
          const gm = gh((px + qx) / 2, (py + qy) / 2);
          if (it.k === 'pickets') { const m = Math.round(Ln / 0.22); for (let i = 0; i < m; i++) { const f = (i + 0.5) / m; B.box('wood', x + dx * f, gm - 0.05, z + dz * f, 0.16, 1.0 + (i % 2) * 0.08, 0.04, fr, [0.86, 0.78, 0.68], NS); } }
          for (const hh of it.k === 'pickets' ? [0.3, 0.75] : [0.42, 0.85]) B.box('wood', x + dx / 2, gm + hh, z + dz / 2, Ln, 0.09, 0.06, fr, [0.8, 0.7, 0.6], NS);
          shade = 0; break;
        }
        case 'gate': {   // a field gate between two posts
          for (const s2 of [-1, 1]) { const [sx, sz2] = L(s2 * 1.1, 0); B.box('wood', sx, g - 0.1, sz2, 0.18, 1.45, 0.18, ry); }
          for (const hh of [0.3, 0.65, 1.0]) { const [mx, mz] = L(0, 0); B.box('wood', mx, g + hh, mz, 2.0, 0.1, 0.05, ry, [0.86, 0.78, 0.68], NS); }
          shade = 0; break;
        }
        case 'bench': if (K.bench) K.bench(x, g, z, ry); shade = 18; break;
        case 'signpost': {   // a tall post with two pointing boards
          B.box('wood', x, g - 0.2, z, 0.14, 2.5, 0.14, ry);
          for (const [hh, a] of [[1.9, 0.5], [1.5, -0.9]]) { const r2 = ry + a, ox = Math.sin(r2 + Math.PI / 2) * 0.32, oz = Math.cos(r2 + Math.PI / 2) * 0.32; B.box('wood', x + ox, g + hh, z + oz, 0.75, 0.2, 0.05, r2, [0.9, 0.8, 0.66], NS); }
          shade = 8; break;
        }
        case 'statue': {   // a robed figure on a plinth
          B.box('stone', x, g, z, 1.0 * sz, 0.7, 1.0 * sz, ry, [0.9, 0.9, 0.95]);
          const cg = new THREE.ConeGeometry(0.42 * sz, 1.7 * sz, 10); cg.translate(0, 0.85 * sz, 0); B.geom('stone', cg, new THREE.Matrix4().makeTranslation(x, g + 0.7, z), [0.95, 0.95, 1], 1); cg.dispose();
          sph('stone', x, g + 0.7 + 1.8 * sz, z, 0.2 * sz, 0.24 * sz, 0.2 * sz, 0);
          shade = 26; break;
        }
        case 'brazier': {   // an iron bowl of coals on three legs, burning
          for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; rod('iron', [x + Math.cos(a) * 0.35, g, z + Math.sin(a) * 0.35], [x + Math.cos(a) * 0.2, g + 0.85, z + Math.sin(a) * 0.2], 0.035, 0.03); }
          B.cyl('iron', x, g + 0.82, z, 0.22, 0.42, 0.26, 12, [0.6, 0.58, 0.6], null, true);
          B.cyl('dCoal', x, g + 0.98, z, 0.36, 0.36, 0.05, 10, null, null, false);
          if (d.__fx) { d.__fx.flames.push([x, g + 1.2, z, 1.6]); d.__fx.sparks.push([x, g + 1.1, z]); }
          K.lights && K.lights.push([px, py, 120, 1.2, 'forge']); K.halo && K.halo(x, g + 1.3, z, 2.2, [1.0, 0.55, 0.2]);
          shade = 12; break;
        }
        case 'lamppost': { B.box('iron', x, g, z, 0.12, 2.8, 0.12, 0, [0.5, 0.5, 0.55]); B.box('iron', x, g, z, 0.3, 0.3, 0.3, 0, [0.5, 0.5, 0.55]); if (K.lantern) K.lantern(x, g + 2.8, z, [0, 1], 1, 0); shade = 8; break; }
        case 'hay': { B.box('dHay', x, g, z, 1.2 * sz, 0.6 * sz, 0.7 * sz, ry); if (sz >= 1) { const [hx, hz] = L(0.15, 0.05); const ns = B.solid; B.solid = false; B.box('dHay', hx, g + 0.6, hz, 1.1, 0.55, 0.65, ry + 0.15); B.solid = ns; } shade = 22; break; }
        case 'haystack': { const cg = new THREE.ConeGeometry(1.2 * sz, 2.0 * sz, 10); cg.translate(0, 1.0 * sz, 0); B.geom('dHay', cg, new THREE.Matrix4().makeTranslation(x, g, z), null, [3, 2]); cg.dispose(); shade = 34; break; }
        case 'logs': { for (const [a, hh, r] of [[-0.24, 0.2, 0.2], [0.24, 0.2, 0.2], [0, 0.52, 0.19]]) { const [lx, lz] = L(0, a); log('dLog', lx, g + hh, lz, r, 2.0 * sz, ry + Math.PI / 2); } shade = 26; break; }
        case 'woodpile': { for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) { const [lx, lz] = L((i - (3 - row) / 2) * 0.24, 0); log('dLog', lx, g + 0.11 + row * 0.2, lz, 0.11, 0.8, ry); } shade = 18; break; }
        case 'rock': { const rk = K.rockG ? K.rockG[Math.floor(R() * K.rockG.length)] : null; if (rk) B.geom(lookOf(d) ? 'rockL' : 'rockM', rk, new THREE.Matrix4().compose(new THREE.Vector3(x, g - 0.2 * sz, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * 6.28, 0)), new THREE.Vector3(sz, sz * 0.8, sz)), null, 1.2); shade = 20; break; }
        case 'bush': { for (let i = 0; i < 4; i++) sph('leafBush', x + (R() - 0.5) * 0.7 * sz, g + 0.35 * sz, z + (R() - 0.5) * 0.7 * sz, 0.45 * sz, 0.4 * sz, 0.45 * sz, R() * 6); shade = 22; break; }
        case 'table': {   // a plank table on four legs (food or a cloth on it)
          const W = 1.7 * sz, D = 0.9;
          for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [lx, lz] = L(a * (W / 2 - 0.12), b * (D / 2 - 0.1)); B.box('wood', lx, g, lz, 0.09, 0.74, 0.09, ry, null, NS); }
          B.box('wood', x, g + 0.74, z, W, 0.07, D, ry, [0.92, 0.84, 0.74]);
          if (it.load === 'food') B.box('dFood', x, g + 0.81, z, W * 0.5, 0.08, D * 0.5, ry, null, NS);
          shade = 22; break;
        }
        case 'shelf': {   // a tall shelf against the wall behind it, crocks and boxes on its boards
          const W = 1.6 * sz, Dp = 0.4;
          for (const a of [-1, 1]) { const [lx, lz] = L(a * (W / 2 - 0.04), 0); B.box('wood', lx, g, lz, 0.07, 1.95, Dp, ry); }
          for (const hh of [0.1, 0.62, 1.14, 1.66]) { B.box('wood', x, g + hh, z, W, 0.05, Dp, ry, [0.86, 0.78, 0.68], NS); if (hh < 1.6) for (let i = 0; i < 3; i++) { const [ox, oz] = L((i - 1) * W * 0.3 + (R() - 0.5) * 0.15, 0); if (R() < 0.5) B.cyl('dClay', ox, g + hh + 0.05, oz, 0.1, 0.08, 0.26, 8, null, null, false); else B.box(ck, ox, g + hh + 0.05, oz, 0.26, 0.22, 0.26, ry, [1, 1, 1], Object.assign({ fit: ck === 'crate' }, NS)); } }
          shade = 20; break;
        }
        case 'boat': {   // a rowing boat moored on the water (its keel at the water's level), two benches, oars in it
          // (a boat pulled up on a bank sits on the ground)
          const wl = g > -0.15 ? g + 0.08 : -0.42, Lb = 3.2 * sz, Wb = 1.1 * sz, sg = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true, 0, Math.PI);
          sg.rotateZ(Math.PI / 2); sg.rotateY(Math.PI / 2);   // a half tube, open at the top, along the boat's length
          B.geom('wood', sg, new THREE.Matrix4().compose(new THREE.Vector3(x, wl + 0.32 * sz, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(Wb / 2, 0.42 * sz, Lb / 2)), [0.78, 0.62, 0.5], [3, 1]); sg.dispose();
          for (const e of [-1, 1]) { const [ex, ez] = L(0, e * Lb / 2); const cg = new THREE.ConeGeometry(Wb / 2, 0.5 * sz, 8, 1, true, 0, Math.PI); cg.rotateX(e * Math.PI / 2); B.geom('wood', cg, new THREE.Matrix4().compose(new THREE.Vector3(ex, wl + 0.32 * sz, ez), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry + (e > 0 ? Math.PI : 0), 0)), new THREE.Vector3(1, 0.84, 1)), [0.74, 0.58, 0.46], 1); cg.dispose(); }
          for (const b2 of [-0.5, 0.5]) { const [bx, bz] = L(0, b2 * Lb * 0.5); B.box('wood', bx, wl + 0.18, bz, Wb * 0.9, 0.06, 0.25, ry, [0.86, 0.76, 0.64], NS); }
          shade = 0; break;
        }
        case 'furnacemouth': {   // (Together, the Worldforge's heart) a furnace mouth glowing in the wall behind it: a forge-stone
          // arch standing out from the wall, its opening a sheet of fire, embers rising, a strong forge light on the floor
          const W = 2.6 * sz, H = 3.0 * sz, D = 0.5;
          for (const s2 of [-1, 1]) { const [jx, jz] = L(s2 * (W / 2 + 0.25), -D / 2); B.box('stone', jx, g, jz, 0.5, H, D + 0.2, ry, [0.55, 0.5, 0.5]); }
          { const [lx, lz] = L(0, -D / 2); B.box('stone', lx, g + H, lz, W + 1.0, 0.55, D + 0.3, ry, [0.5, 0.46, 0.46]); }
          { const [ix, iz] = L(0, -D * 0.6); B.box('dCoal', ix, g, iz, W, H * 0.92, 0.12, ry, null, NS); B.box('iron', ix, g, iz + 0.0, W + 0.1, 0.12, 0.25, ry, [0.4, 0.38, 0.4], NS); }
          for (let i = 0; i < 4; i++) { const [fx3, fz3] = L((i - 1.5) * W * 0.24, -D * 0.2); if (d.__fx) { d.__fx.flames.push([fx3, g + 0.4, fz3, 2.4]); d.__fx.sparks.push([fx3, g + 0.3, fz3]); } }
          K.lights && K.lights.push([px, py, 260, 1.8, 'forge']); K.halo && K.halo(x, g + 1.4, z, 6.0, [1.0, 0.45, 0.12]);
          shade = 0; break;
        }
        case 'furnace': {   // a great furnace: a stone body with iron bands, a glowing mouth on its front, a chimney into the dark
          const W = 2.8 * sz, D = 2.4 * sz, H = 2.6 * sz;
          B.box('stone', x, g, z, W, H, D, ry, [0.55, 0.5, 0.5]);
          B.box('stone', x, g + H, z, W * 0.8, 0.4, D * 0.8, ry, [0.5, 0.46, 0.46]);
          B.cyl('stone', x, g + H + 0.4, z, 0.55 * sz, 0.45 * sz, 4.5, 10, [0.45, 0.42, 0.42]);
          for (const hh of [0.4, H - 0.5]) B.box('iron', x, g + hh, z, W + 0.06, 0.16, D + 0.06, ry, [0.35, 0.33, 0.35], NS);
          { const [mx, mz] = L(0, D / 2 + 0.02); B.box('dCoal', mx, g + 0.3, mz, W * 0.5, H * 0.45, 0.06, ry, null, NS); }
          { const [mx, mz] = L(0, D / 2 + 0.5); if (d.__fx) { d.__fx.flames.push([mx, g + 0.6, mz, 2.0]); d.__fx.sparks.push([mx, g + 0.6, mz]); d.__fx.smoke.push([x, g + H + 4.9, z]); }
            K.lights && K.lights.push([px + Math.sin(fa) * 30, py + Math.cos(fa) * 30, 220, 1.6, 'forge']); K.halo && K.halo(mx, g + 0.9, mz, 4.0, [1.0, 0.5, 0.15]); }
          shade = 60; break;
        }
        case 'lowwall': {   // a low, mossy stone wall (a ruin's), a stone or two fallen from it
          B.box('stone', x, g - 0.1, z, 3.8 * sz, 1.05, 1.0, ry, [0.86, 0.9, 0.82]);
          B.box('stone', x, g + 0.95, z, 3.9 * sz, 0.14, 1.1, ry, [0.7, 0.8, 0.66], NS);
          const [fx2, fz2] = L(1.4 * sz, 0.9); B.box('stone', fx2, g, fz2, 0.45, 0.3, 0.4, ry + 0.6, [0.8, 0.84, 0.78], NS);
          shade = 0; break;
        }
        case 'trough': { B.box('wood', x, g, z, 1.7 * sz, 0.5, 0.6, ry, [0.8, 0.7, 0.6]); B.box('glass', x, g + 0.42, z, 1.5 * sz, 0.04, 0.45, ry, [0.4, 0.55, 0.65], NS); shade = 20; break; }
        case 'jars': { for (let i = 0; i < 3; i++) { const [jx, jz] = L((i - 1) * 0.4, (R() - 0.5) * 0.3), hh = 0.6 + R() * 0.3; B.cyl('dClay', jx, g, jz, 0.18, 0.28, hh * 0.55, 10); B.cyl('dClay', jx, g + hh * 0.55, jz, 0.28, 0.12, hh * 0.45, 10); } shade = 18; break; }
        case 'anvil': { B.box(sz > 1.4 ? 'stone' : 'wood', x, g, z, 0.5 * sz, 0.45 * sz, 0.5 * sz, ry, [0.6, 0.45, 0.38]); B.box('iron', x, g + 0.45 * sz, z, 0.3 * sz, 0.2 * sz, 0.22 * sz, ry); B.box('iron', x, g + 0.65 * sz, z, 0.75 * sz, 0.16 * sz, 0.26 * sz, ry); if (sz > 1.4) { const [hx, hz] = L(0.5 * sz, 0); B.cyl('iron', hx, g + 0.73 * sz, hz, 0.06 * sz, 0.01, 0.3 * sz, 6); } shade = 14 * sz; break; }
        case 'cauldron': { B.cyl('iron', x, g + 0.1, z, 0.3, 0.45, 0.55, 12, [0.4, 0.4, 0.42], null, true); B.cyl('glass', x, g + 0.55, z, 0.4, 0.4, 0.03, 10, [0.5, 0.7, 0.4], null, false); shade = 16; break; }
        case 'tent': {   // a ridge tent of canvas
          const W = 2.2 * sz, D = 2.6 * sz, H = 1.9 * sz; const a = L(-W / 2, -D / 2), b = L(W / 2, -D / 2), c2 = L(W / 2, D / 2), e = L(-W / 2, D / 2), t0 = L(0, -D / 2), t1 = L(0, D / 2);
          B.quad('dSack', [e[0], g, e[1]], [a[0], g, a[1]], [t0[0], g + H, t0[1]], [t1[0], g + H, t1[1]], [0, 0, D, H]);
          B.quad('dSack', [b[0], g, b[1]], [c2[0], g, c2[1]], [t1[0], g + H, t1[1]], [t0[0], g + H, t0[1]], [0, 0, D, H]);
          B.tri('dSack', [a[0], g, a[1]], [b[0], g, b[1]], [t0[0], g + H, t0[1]], [[0, 0], [W, 0], [W / 2, H]]);
          shade = 40; break;
        }
      }
      B.solid = was;
      if (shade && K.shadeMarks) K.shadeMarks.push(['dot', px, py, shade, 0.72]);
    }
  }

  // ---- (Places, step 5) a chest the game can open: kept out of the merge, a body and a lid hinged at its back edge, each one
  // draw (the iron bands in the wood's own colour). Handles for the game (Together's game3d):
  //   M7_CHESTS[chestId] = { group, lid, open(on) }   M7_SETCHEST(chestId, open)   (the place being built replaces the list)
  // The lid swings back about 110 degrees over a third of a second when it opens ----
  function chest(K, d, it, x, g, z, ry) {
    const id = it[4] || ('chest@' + it[0] + ',' + it[1]);
    if (G.M7_CHESTS_FOR !== d.id) { G.M7_CHESTS = {}; G.M7_CHESTS_FOR = d.id; }
    const body = W3D.Builder(), lidB = W3D.Builder(), IRON = [0.42, 0.4, 0.4], GOLD = [1.2, 1.0, 0.5];
    body.solid = false; lidB.solid = false;
    body.box('wood', 0, 0, 0, 0.85, 0.48, 0.55, 0, [0.72, 0.52, 0.36]);
    for (const e of [-0.28, 0.28]) body.box('wood', e, 0.01, 0, 0.07, 0.47, 0.57, 0, IRON);
    body.box('wood', 0, 0.3, 0.28, 0.12, 0.14, 0.02, 0, GOLD);
    // the lid, built with its hinge (the back top edge) at its origin
    lidB.box('wood', 0, 0, 0.295, 0.89, 0.16, 0.59, 0, [0.64, 0.46, 0.32]);
    for (const e of [-0.28, 0.28]) lidB.box('wood', e, -0.005, 0.295, 0.07, 0.17, 0.61, 0, IRON);
    const group = new THREE.Group(), hinge = new THREE.Group();
    group.position.set(x, g, z); group.rotation.y = ry; hinge.position.set(0, 0.48, -0.295);
    for (const m of Object.values(body.build(K.mats))) group.add(m);
    for (const m of Object.values(lidB.build(K.mats))) hinge.add(m);
    group.add(hinge); group.name = 'chest:' + id; K.scene.add(group);
    K.addBlock && K.addBlock(K.circlePx(it[0], it[1], 0.42, 8));
    let t0 = 0, from = 0, to = 0, raf = 0;
    const OPEN = -1.92, step = (now) => { const k = Math.min(1, (now - t0) / 330), e = 1 - Math.pow(1 - k, 3); hinge.rotation.x = from + (to - from) * e; if (k < 1) raf = requestAnimationFrame(step); };
    const h = G.M7_CHESTS[id] = { group, lid: hinge, isOpen: false, open(on, now) {
      on = on !== false; if (on === h.isOpen) return; h.isOpen = on; cancelAnimationFrame(raf);
      from = hinge.rotation.x; to = on ? OPEN : 0;
      if (now === true) { hinge.rotation.x = to; return; }   // open(true, true): at once (a chest already opened when the place loads)
      t0 = performance.now(); raf = requestAnimationFrame(step);
    } };
    G.M7_SETCHEST = (cid, on, now) => { const c = (G.M7_CHESTS || {})[cid]; if (c) c.open(on, now); return !!c; };
  }

  // ---- (Places, step 4) the map's own things, as the painting shows them ----
  function things(K, d, R) {
    const { B, X, Z, gh } = K, NS = { solid: false };
    for (const it of d.things || []) {
      const [px, py, kind, face] = it;
      const x = X(px), z = Z(py), g = gh(px, py), ry = face || 0, c = Math.cos(ry), s = Math.sin(ry);
      if (kind === 'sign') {   // a signpost with its board turned to the road
        B.box('wood', x, g - 0.2, z, 0.14, 1.75, 0.14, 0, [0.62, 0.5, 0.42]);
        B.box('wood', x + s * 0.08, g + 1.05, z + c * 0.08, 0.95, 0.42, 0.06, ry, [0.78, 0.64, 0.5], NS);
        B.box('wood', x + s * 0.08, g + 1.3, z + c * 0.08, 0.99, 0.05, 0.08, ry, [0.55, 0.44, 0.38], NS);
      } else if (kind === 'board') {   // a notice board: two posts, a roofed board with papers
        for (const e of [-0.75, 0.75]) B.box('wood', x + c * e, g - 0.2, z - s * e, 0.14, 2.3, 0.14, 0, [0.6, 0.48, 0.4]);
        B.box('wood', x, g + 1.25, z, 1.6, 0.9, 0.08, ry, [0.72, 0.58, 0.45], NS);
        for (let i = 0; i < 4; i++) B.box('paper', x + c * (-0.5 + i * 0.32) + s * 0.05, g + 1.2 + (i % 2) * 0.22, z - s * (-0.5 + i * 0.32) + c * 0.05, 0.24, 0.3, 0.01, ry, null, NS);
        B.box('wood', x, g + 1.78, z, 1.8, 0.08, 0.36, ry, [0.55, 0.42, 0.36], NS);
      } else if (kind === 'chest') {   // a chest with iron bands: its own little group with a lid hinged at the back (step 5)
        if (!(K.mats && K.scene && W3D.Builder)) {
          B.box('wood', x, g, z, 0.85, 0.48, 0.55, ry, [0.7, 0.5, 0.34]);
          B.box('wood', x, g + 0.48, z, 0.89, 0.16, 0.59, ry, [0.62, 0.44, 0.3], NS);
        } else chest(K, d, it, x, g, z, ry);
      } else if (kind === 'pedestal') {   // a relic's pedestal: stone, with a warm glow on top where the relic is shown
        B.box('stone', x, g, z, 0.8, 0.18, 0.8, 0, [0.85, 0.84, 0.9]);
        B.box('stone', x, g + 0.18, z, 0.56, 0.75, 0.56, 0, [0.95, 0.94, 1]);
        B.box('stone', x, g + 0.93, z, 0.72, 0.12, 0.72, 0, [0.85, 0.84, 0.9], NS);
        K.lights.push([px, py, 40, 0.5, 'warm']);
      } else if (kind === 'table') {   // the war table, with a map on it
        B.box('wood', x, g + 0.78, z, 2.6, 0.1, 1.6, ry, [0.66, 0.5, 0.38], NS);
        for (const [a, b] of [[-1.15, -0.65], [1.15, -0.65], [-1.15, 0.65], [1.15, 0.65]]) B.box('wood', x + c * a + s * b, g, z - s * a + c * b, 0.14, 0.78, 0.14, 0, [0.55, 0.42, 0.34]);
        B.box('paper', x, g + 0.84, z, 2.0, 0.01, 1.1, ry, [0.9, 0.82, 0.66], NS);
      } else if (kind === 'bellframe') {   // a bell under a little timber frame
        for (const e of [-0.7, 0.7]) B.box('wood', x + c * e, g - 0.2, z - s * e, 0.18, 2.6, 0.18, 0, [0.6, 0.48, 0.4]);
        B.box('wood', x, g + 2.35, z, 1.7, 0.18, 0.2, ry, [0.6, 0.48, 0.4], NS);
        B.cyl('iron', x, g + 1.45, z, 0.36, 0.14, 0.75, 12, [0.95, 0.75, 0.42]);
      }
    }
  }

  // is there a wall (or anything not walkable) at this painting pixel? (from the place's walking map)
  function isWallAt(d, x, y) { const m = (G.MAPS || {})[d.id]; if (!m) return false; return !m.walk.some((q) => x >= q[0][0] && x <= q[1][0] && y >= q[0][1] && y <= q[2][1]); }
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  for (const [id, d] of Object.entries(G.M7_PLACES || {})) P['m7-' + id] = make(d);
  G.M7_MAKE = make;
})(window);
