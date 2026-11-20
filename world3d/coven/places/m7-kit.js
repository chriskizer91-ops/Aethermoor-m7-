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
  };
  const mul32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  function make(d) {
    const [w, h] = d.tiles;
    // ---- the ground's height: 0 on dry land, down under the water; each corner of the tile grid is dry if any tile
    // touching it is, so dry tiles stay flat and the banks slope down inside the water's own tiles ----
    // each tile's own floor: dry 0, water -1.9, a ford -0.65 (ankle deep), the void -9; a corner takes the highest of the
    // four tiles round it, so dry tiles stay flat
    const LV = { 0: 0, 1: -1.9, 2: -0.65, 3: -9 };
    const lv = (i, j) => { i = Math.max(0, Math.min(w - 1, i)); j = Math.max(0, Math.min(h - 1, j)); return LV[d.tileH[j][i]]; };
    const CH = new Float32Array((w + 1) * (h + 1));
    for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) CH[j * (w + 1) + i] = Math.max(lv(i - 1, j - 1), lv(i, j - 1), lv(i - 1, j), lv(i, j));
    const corner = (i, j) => CH[Math.max(0, Math.min(h, j)) * (w + 1) + Math.max(0, Math.min(w, i))];
    function ground(x, y) {
      // indoors there is nothing past the walls: the ground falls away into the dark
      if (d.interior && (x < -4 || y < -4 || x > w * TX + 4 || y > h * TY + 4)) return -9;
      const u = x / TX, v = y / TY, i = Math.floor(u), j = Math.floor(v), fu = ss(0, 1, u - i), fv = ss(0, 1, v - j);
      const a = corner(i, j), b = corner(i + 1, j), c = corner(i, j + 1), e = corner(i + 1, j + 1);
      return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + e * fu) * fv;
    }
    // the roofs: the painting's kind for each house (slate, red tiles, thatch or moss), from Coven's roof pictures
    const ROOF = { slate: ['shared_roof_shingle', 0xc8d4ff], red: ['shared_roof_tiles_red', 0xffffff], thatch: ['shared_roof_thatch', 0xffffff], moss: ['cottage_roof_moss', 0xffffff] };
    const extraMats = {};
    for (const [k, [tex, tint]] of Object.entries(ROOF)) extraMats['roof_' + k] = { tex, rep: 2.6, shade: 0.15, tint, side: 'double' };
    extraMats.roots = { tex: 'shared_bark_oak', rep: 1.6, tint: 0xd8c0a8, shade: 0.5 };
    extraMats.rockM = { tex: 'thorn_rock_mossy', rep: 2.2, tint: 0xffffff, shade: 0.5 };
    extraMats.stake = { tex: 'shared_bark_oak', rep: 1.2, tint: 0xe0d0c0, shade: 0.5 };
    extraMats.glowF = { emis: 0x66ffcc, lit: 0, tint: 0x66ffcc, cut: false };
    extraMats.glowI = { emis: 0xc070ff, lit: 0, tint: 0xc070ff, cut: false };
    d.buildings.forEach((b) => { b.roof = Object.assign({}, b.roof, { mat: 'roof_' + (b.roof.kind || 'slate') }); });
    const textures = Object.entries(LIST).map(([id, src]) => ({ id, made: src, stand: src }));
    textures.push({ id: 'm7_paint', made: d.painting, stand: d.painting, clamp: true });
    const place = Object.assign({}, d, {
      mapId: d.id, pathsOnly: true, thicket: false, noRocks: [[-1e5, -1e5, 1e5, 1e5]],
      ground: { cob: 'shared_cobbles_town', grass: 'shared_grass_meadow', dirt: 'shared_dirt_track', pave: 'wick_bridge_paving', rep: [2.6, 3.6, 3.6, 2.4], paint: 'm7_paint', paintGain: 0.62 },
      surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'wick_wall_timber_plaster', planks: 'shared_boardwalk_planks', roof: 'shared_roof_shingle',
        wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'wick_bridge_paving', soil: 'shared_dirt_track', rock: 'thorn_rock_mossy', leaves: 'wick_leaf_canopy', bark: 'shared_bark_oak' },
      textures, extraMats,
      // the M7 places are by day in the 2D game: their leaves a little lighter than the borrowed night woods
      tints: { leaves: 0xf0fff4, bough: 0xc4d6c4, boughFir: 0xb0c4bc, bush: 0xf0fff0 },
      ground_h: ground, walk_h: ground,
      water: d.water.map((wt) => ({ poly: wt.poly, level: () => -0.5, tex: 'shared_water_dark', rep: 6, flow: [0.004, 0.002], bed: -2.3 })),
      night: Object.assign(d.interior ? { sky: [0.62, 0.52, 0.5], moon: [0.3, 0.26, 0.26], ground: [0.12, 0.08, 0.06], fog: [0.02, 0.018, 0.03], fogNear: 30, fogFar: 90, hills: false } : {}, { sky: [0.86, 0.8, 0.84], moon: [0.62, 0.56, 0.6], ground: [0.16, 0.13, 0.14], fog: [0.16, 0.15, 0.24], fogNear: 40, fogFar: 140 }, d.night || {}),
      paintingSrc: d.painting,
      extra: (K) => extra(K, d),
    });
    return place;
  }

  // ---- crenels, towers and torches ----
  function extra(K, d) {
    const { B, X, Z, gh } = K, NS = { solid: false };
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
    for (const [px, py, s] of d.cliffs || []) { const x = X(px), z = Z(py), g = gh(px, py); rock('rockM', x, g - 0.2, z, s); rock('rockM', x + (R() - 0.5) * 1.2, g + s * 0.5, z + (R() - 0.5) * 1.2, s * 0.7); }
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

  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  for (const [id, d] of Object.entries(G.M7_PLACES || {})) P['m7-' + id] = make(d);
  G.M7_MAKE = make;
})(window);
