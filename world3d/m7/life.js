// life.js (Places, step 4, November 21): the places come alive. Each kind of moving thing is ONE draw, animated
// wholly in its shader from the world's clock (P.U.uTime), so it costs the CPU nothing per frame:
//   flames      a flickering flame on every lantern, lamp and Hearthfire the kit records (place data __fx.flames)
//   smoke       puffs rising and drifting from every chimney (__fx.smoke)
//   sparks      embers rising from the forges' coals and the molten metal (__fx.sparks)
//   weather     a box of drifting things round the camera: leaves in the woods, dust on the Sunscorch, snow on the
//               Ironspire, mist low over the Gloomfen, ash and embers in the Hearth Below, dust motes indoors
//   rings       rings spreading on still water (fish, a drop), flat on the surface
//   fish        now and then a fish leaps out of open water and drops back in (a ring where it lands)
//   spray       mist and drops where a waterfall lands (place data falls), streaks of white running down it
//   banners     the Keep's banners sway (the kit's cloth material, core.js CLOTH)
//   small life  birds wheeling high by day, butterflies low near the flowers by day, moths round the lanterns at night
// The trees' sway is the engine's (place.wind, core.js WIND). A phone gets about half the particles.
//   M7_LIFE.add(W, place)   after the walker has built a place (and after every switchTo); returns { remove, count }
(function (G) {
  'use strict';
  const TAU = Math.PI * 2;
  const sprites = {};
  function sprite(kind) {
    if (sprites[kind]) return sprites[kind];
    const S = 64, c = document.createElement('canvas'); c.width = kind === 'bird' ? S * 2 : S; c.height = S; const g = c.getContext('2d');
    const soft = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, S); };
    if (kind === 'flame') {   // a tongue of flame: white-gold heart, orange edge, pointed top
      const gr = g.createRadialGradient(32, 44, 2, 32, 40, 26); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.35, 'rgba(255,190,70,0.95)'); gr.addColorStop(0.7, 'rgba(240,90,20,0.55)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(50, 26, 54, 44, 32, 62); g.bezierCurveTo(10, 44, 14, 26, 32, 2); g.fill();
    } else if (kind === 'ring') {
      g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 26, 0, TAU); g.stroke();
      g.lineWidth = 1.5; g.globalAlpha = 0.5; g.beginPath(); g.arc(32, 32, 18, 0, TAU); g.stroke();
    } else if (kind === 'leaf') {   // a leaf (tinted in the shader)
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 22, 11, 0.6, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 44); g.lineTo(50, 20); g.stroke();
    } else if (kind === 'bird') {   // two frames side by side: wings up, wings down
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(8, 22); g.quadraticCurveTo(20, 10, 32, 32); g.quadraticCurveTo(44, 10, 56, 22); g.stroke();
      g.beginPath(); g.moveTo(72, 30); g.quadraticCurveTo(84, 40, 96, 32); g.quadraticCurveTo(108, 40, 120, 30); g.stroke();
    } else if (kind === 'fly') {   // a butterfly or a moth: two pairs of wings (the shader flaps them by squashing)
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(20, 26, 14, 18, -0.4, 0, TAU); g.ellipse(44, 26, 14, 18, 0.4, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(22, 46, 9, 11, 0.3, 0, TAU); g.ellipse(42, 46, 9, 11, -0.3, 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(30, 18, 4, 34);
    } else if (kind === 'fish') {   // a little fish side on, nose up (the shader turns it along its leap)
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 30, 9, 20, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(32, 46); g.lineTo(20, 60); g.lineTo(44, 60); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(30, 18, 2.2, 0, TAU); g.fill();
    } else soft(32, 32, 30, 'rgba(255,255,255,1)');   // a soft dot: smoke, mist, dust, snow, sparks, motes
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return (sprites[kind] = t);
  }

  // one Points draw: positions plus a per-point seed (x, y, z random, w per-point extra); the vertex shader moves them
  function points(n, at, seeds, o) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(at, 3));
    g.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 4));
    for (const k in o.attrs || {}) g.setAttribute(k, new THREE.Float32BufferAttribute(o.attrs[k], 3));
    const uni = Object.assign({ map: { value: sprite(o.sprite) }, uTime: o.U.uTime, uScale: { value: 400 }, uCam: { value: new THREE.Vector3() },
      uFogNear: o.U.uFogNear, uFogFar: o.U.uFogFar, uDay: o.U.uDay || { value: 1 }, uCol: { value: new THREE.Color(o.color || 0xffffff) } }, o.uniforms || {});
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `attribute vec4 seed; uniform float uTime, uScale, uFogNear, uFogFar, uDay; uniform vec3 uCam; varying float vA; varying vec4 vS; varying float vF;
        ${o.head || ''}
        void main() { vec3 p = position; float size = 1.0, alpha = 1.0, frame = 0.0; vS = seed;
          ${o.move}
          vec4 mv = viewMatrix * vec4(p, 1.0); float d = max(0.5, -mv.z);
          vA = alpha * (1.0 - smoothstep(uFogNear, uFogFar, d)); vF = frame;
          gl_PointSize = clamp(size * uScale / d, 0.0, 160.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uCol; uniform float uTime, uDay; varying float vA; varying vec4 vS; varying float vF;
        void main() { vec2 uv = gl_PointCoord; uv.y = 1.0 - uv.y; ${o.frag || ''}
          vec4 t = texture2D(map, uv); vec3 col = uCol; ${o.color2 || ''}
          float a = t.a * vA; if (a < 0.01) discard; gl_FragColor = vec4(col * t.rgb, a); }`,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = o.order || 6; pts.name = 'life:' + o.name;
    // each frame, as it is drawn: the camera (for the weather box) and the screen's scale (point sizes in metres)
    pts.onBeforeRender = (r, s, cam) => { uni.uCam.value.copy(cam.position); const h = r.getDrawingBufferSize(new THREE.Vector2()).y; uni.uScale.value = h / (2 * Math.tan((cam.fov || 60) * Math.PI / 360)); };
    return pts;
  }

  function add(W, place) {
    const P = W.P, U = P.U, M = P.M, scene = P.scene, d = (G.M7_PLACES || {})[place.m7] || place, fx = d.__fx || { flames: [], smoke: [], sparks: [] };
    const PHONE = G.W3D && W3D.quality === 'phone', K = PHONE ? 0.5 : 1;
    const day = (place.night && place.night.day) || 0, indoors = !!d.interior && day < 0.5, dark = indoors || day < 0.3;   // (a map ringed by cliffs reads as 'interior' to the converter, but a sunlit one is outdoors)
    const R = ((a) => () => { a = (a * 16807) % 2147483647; return a / 2147483647; })(9137 + (d.tiles ? d.tiles[0] * 31 + d.tiles[1] : 1));
    const made = [], put = (o) => { if (o) { scene.add(o); made.push(o); } };
    const wx = (px) => M.x(px), wz = (py) => M.z(py), gh = (px, py) => P.walkH(px, py);
    const [w, h] = d.size || [1000, 1000], cx = w / 2, cy = h / 2;

    // ---- flames: flicker in height and brightness, each at its own pace ----
    if (fx.flames.length) {
      const at = [], sd = [];
      for (const [x, y, z, s] of fx.flames) { at.push(x, y + 0.06, z); sd.push(R(), R(), R(), s); }
      put(points(fx.flames.length, at, sd, { U, name: 'flames', sprite: 'flame', add: true, order: 7,
        move: `float f = 0.75 + 0.25 * sin(uTime * (9.0 + seed.x * 5.0) + seed.y * 20.0) * sin(uTime * (3.1 + seed.z * 2.0) + seed.x * 7.0);
               size = 0.55 * seed.w * f; p.y += 0.04 * f; alpha = 0.85 + 0.15 * f;` }));
    }
    // ---- chimney smoke: each puff rises about four metres, leans with the wind, swells and fades ----
    if (fx.smoke.length) {
      const N = PHONE ? 6 : 10, at = [], sd = [];
      for (const [x, y, z] of fx.smoke) for (let i = 0; i < N; i++) { at.push(x, y, z); sd.push(R(), R(), i / N, R()); }
      put(points(at.length / 3, at, sd, { U, name: 'smoke', sprite: 'soft', color: 0xb8b4b0, order: 6,
        move: `float age = fract(uTime * 0.09 + seed.z + seed.x * 0.1);
               p += vec3(0.9 * age * age + (seed.x - 0.5) * 0.5 * age, 4.0 * age, 0.4 * age + (seed.y - 0.5) * 0.5 * age);
               size = 0.8 + 2.8 * age; alpha = 0.45 * smoothstep(0.0, 0.12, age) * (1.0 - age);` }));
    }
    // ---- sparks: embers spiralling up from the coals and the molten metal, cooling as they go ----
    if (fx.sparks.length) {
      const N = PHONE ? 3 : 6, at = [], sd = [];
      for (const [x, y, z] of fx.sparks) for (let i = 0; i < N; i++) { at.push(x + (R() - 0.5) * 1.4, y, z + (R() - 0.5) * 1.4); sd.push(R(), R(), R(), R()); }
      put(points(at.length / 3, at, sd, { U, name: 'sparks', sprite: 'soft', color: 0xffa040, add: true, order: 7,
        move: `float age = fract(uTime * (0.25 + seed.w * 0.25) + seed.z);
               p += vec3(sin(uTime * 3.0 + seed.x * 30.0) * 0.25 * age, 3.2 * age, cos(uTime * 2.6 + seed.y * 30.0) * 0.25 * age);
               size = 0.16 * (1.0 - age * 0.6); alpha = (1.0 - age) * (0.6 + 0.4 * sin(uTime * 20.0 + seed.x * 50.0));` }));
    }

    // ---- the weather: a box round the camera that the particles wrap through (they never run out) ----
    const region = d.region || 'verdant', biome = d.biome || '';
    const inside = (d.extraTrees || []).filter((t) => t[0] >= 0 && t[1] >= 0 && t[0] < w && t[1] < h).length;
    let wk = null;
    if (region === 'below' || biome === 'forge') wk = 'ash';
    else if (indoors) wk = 'motes';
    else if (region === 'sunscorch' && !/mine|crystal|vault/.test(biome)) wk = 'dust';
    else if (region === 'ironspire' && /mountain|scree|tundra|frozen-lake|outpost|monastery/.test(biome)) wk = 'snow';
    else if (region === 'gloomfen') wk = 'mist';
    else if (inside > 40) wk = 'leaves';
    const WEATHER = {
      leaves: { n: 200, box: [26, 12, 26], sprite: 'leaf', color: 0xc8a050, size: 0.34, fall: 0.55, drift: 0.5, order: 6 },
      dust: { n: 260, box: [32, 3, 32], sprite: 'soft', color: 0xe8c890, size: 0.3, fall: -0.02, drift: 3.2, order: 6 },
      snow: { n: 520, box: [28, 14, 28], sprite: 'soft', color: 0xffffff, size: 0.2, fall: 1.1, drift: 0.7, order: 6 },
      mist: { n: 70, box: [40, 2.2, 40], sprite: 'soft', color: 0xc8d4c8, size: 6.5, fall: 0.0, drift: 0.35, order: 5, alpha: 0.24 },
      ash: { n: 200, box: [24, 9, 24], sprite: 'soft', color: 0xff9a50, size: 0.14, fall: -0.45, drift: 0.4, order: 7, add: true },
      motes: { n: 120, box: [16, 5, 16], sprite: 'soft', color: 0xffe0b0, size: 0.1, fall: -0.04, drift: 0.12, order: 7, add: true, alpha: 0.6 },
    };
    if (wk) {
      const c = WEATHER[wk], n = Math.round(c.n * K), at = [], sd = [];
      for (let i = 0; i < n; i++) { at.push(0, 0, 0); sd.push(R(), R(), R(), R()); }
      const [bx, by, bz] = c.box, low = wk === 'mist' || wk === 'dust';
      put(points(n, at, sd, { U, name: 'weather-' + wk, sprite: c.sprite, color: c.color, add: c.add, order: c.order,
        uniforms: { uBox: { value: new THREE.Vector3(bx, by, bz) } }, head: 'uniform vec3 uBox;',
        move: `vec3 q = seed.xyz * uBox + vec3(uTime * ${c.drift.toFixed(2)} * (0.6 + seed.w * 0.8), -uTime * ${c.fall.toFixed(2)} * (0.7 + seed.w * 0.6), uTime * ${(c.drift * 0.35).toFixed(2)});
               q.x += sin(uTime * (0.7 + seed.w) + seed.y * 20.0) * ${wk === 'leaves' ? '0.8' : '0.25'};
               vec3 base = uCam - uBox * 0.5; ${low ? 'base.y = uCam.y - 30.0;' : ''}
               p = base + mod(q - base, uBox); ${low ? `p.y = ${wk === 'mist' ? '-0.2' : '0.1'} + seed.y * uBox.y;` : ''}
               size = ${c.size.toFixed(3)} * (0.7 + seed.w * 0.6); alpha = ${(c.alpha || 0.85).toFixed(2)} * smoothstep(0.5, 2.5, distance(p, uCam));
               frame = seed.w;`,
        frag: wk === 'leaves' ? 'float an = uTime * (1.5 + vS.w * 2.0) + vS.x * 10.0; uv = (mat2(cos(an), -sin(an), sin(an), cos(an)) * (uv - 0.5)) * 1.2 + 0.5;' : '',
        color2: wk === 'leaves' ? 'col = mix(vec3(0.78, 0.6, 0.28), vec3(0.55, 0.62, 0.25), vS.w);' : '' }));
    }

    // ---- rings on still water (not on molten metal) ----
    if (!(place.water || []).some((wt) => wt.emis) && (place.water || []).length && biome !== 'frozen-lake') {   // (not on Frostmere's ice)
      const polys = place.water.map((wt) => wt.poly), inPoly = (p, x, y) => { let c = false; for (let i = 0, k = p.length - 1; i < p.length; k = i++) { const [xi, yi] = p[i], [xk, yk] = p[k]; if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) c = !c; } return c; };
      const spots = [], want = Math.round(28 * K);
      for (let tries = 0; tries < 4000 && spots.length < want; tries++) { const x = R() * w, y = R() * h; if (polys.some((p) => inPoly(p, x, y))) spots.push([x, y]); }
      if (spots.length) {
        const g = new THREE.BufferGeometry(), pos = [], cor = [], seed = [], idx = [];
        spots.forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { pos.push(wx(x), -0.46, wz(y)); seed.push(R(), R(), R(), R()); } cor.push(-1, -1, 1, -1, 1, 1, -1, 1); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
        // (each corner of a ring shares its spot's seed: take the first corner's)
        for (let i = 0; i < spots.length; i++) for (let k = 1; k < 4; k++) for (let c = 0; c < 4; c++) seed[(i * 4 + k) * 4 + c] = seed[i * 16 + c];
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('corner', new THREE.Float32BufferAttribute(cor, 2)); g.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 4)); g.setIndex(idx);
        const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: sprite('ring') }, uTime: U.uTime, uFogNear: U.uFogNear, uFogFar: U.uFogFar }, transparent: true, depthWrite: false,
          vertexShader: 'attribute vec2 corner; attribute vec4 seed; uniform float uTime, uFogNear, uFogFar; varying vec2 vUv; varying float vA; void main(){ float age = fract(uTime * (0.18 + seed.y * 0.12) + seed.x); vec3 p = position + vec3(corner.x, 0.0, corner.y) * (0.2 + 1.5 * age); vUv = corner * 0.5 + 0.5; vec4 mv = viewMatrix * vec4(p, 1.0); vA = (1.0 - age) * smoothstep(0.0, 0.1, age) * 0.6 * step(0.3, seed.z) * (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)); gl_Position = projectionMatrix * mv; }',
          fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying float vA; void main(){ float a = texture2D(map, vUv).a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), a); }' });
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4; m.name = 'life:rings'; put(m);
      }
      // ---- fish: each spot's fish leaps once in its cycle, an arc a metre high, turning nose-down as it falls ----
      if (spots.length >= 6 && !indoors && wk !== 'snow') {
        const at = [], sd = [], n = Math.min(spots.length, Math.round(10 * K));
        for (let i = 0; i < n; i++) { const [x, y] = spots[i]; at.push(wx(x), -0.46, wz(y)); sd.push(R(), R(), R(), R()); }
        put(points(n, at, sd, { U, name: 'fish', sprite: 'fish', color: 0xd8e4ec, order: 5,
          move: `float cyc = 5.0 + seed.y * 7.0, t = mod(uTime + seed.x * cyc, cyc), j = t / 0.9;   // a leap lasts 0.9 s
                 float up = step(j, 1.0); vec2 dir = normalize(vec2(seed.z - 0.5, seed.w - 0.5) + 0.001);
                 p += vec3(dir.x * (j - 0.5) * 0.9, 4.0 * 0.85 * j * (1.0 - j), dir.y * (j - 0.5) * 0.9);
                 size = 0.42 * up; alpha = up * smoothstep(0.0, 0.08, j) * (1.0 - smoothstep(0.92, 1.0, j)); frame = j;`,
          frag: 'float an = (vF - 0.5) * 2.6 * (vS.z > 0.5 ? 1.0 : -1.0); uv = mat2(cos(an), -sin(an), sin(an), cos(an)) * (uv - 0.5) + 0.5; if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;' }));
      }
    }

    // ---- waterfalls: white streaks running down each fall, and spray boiling up where it lands (two draws in all) ----
    if ((d.falls || []).length) {
      const at = [], sd = [], foot = [], at2 = [], sd2 = [];
      for (const [x, y0, y1, fw, drop] of d.falls) {
        const wid = fw / 50 * 2, lo = -0.4, top = drop ? lo + drop : Math.max(gh(x, y0 - 10), 0) + 2.2, n1 = Math.round((drop ? 24 : 60) * K), n2 = Math.round((drop ? 22 : 70) * K);
        for (let i = 0; i < n1; i++) { const ox = (R() - 0.5) * wid; at.push(wx(x) + ox, top, wz(y0)); foot.push(wx(x) + ox, lo, wz(y1)); sd.push(R(), R(), R(), R()); }
        for (let i = 0; i < n2; i++) { at2.push(wx(x) + (R() - 0.5) * wid, lo, wz(y1) - R() * 1.2); sd2.push(R(), R(), R(), drop ? 0.5 : 1); }
      }
      put(points(at.length / 3, at, sd, { U, name: 'fall-streaks', sprite: 'soft', color: 0xf0f6ff, order: 6, attrs: { foot }, head: 'attribute vec3 foot;',
        move: `float k = fract(uTime * (0.55 + seed.w * 0.3) + seed.z);
               p = mix(position, foot, k * k); p.y += (seed.y - 0.5) * 0.3;
               size = 0.35 + 0.25 * seed.w; alpha = 0.55 * smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.9, 1.0, k));` }));
      put(points(at2.length / 3, at2, sd2, { U, name: 'fall-spray', sprite: 'soft', color: 0xf4f8ff, order: 6,
        move: `float age = fract(uTime * (0.3 + seed.x * 0.25) + seed.z);
               p += vec3((seed.x - 0.5) * 3.0 * age, 2.2 * age * (1.2 - age), (seed.y - 0.2) * 2.4 * age) * seed.w;
               size = (0.5 + 1.8 * age) * seed.w; alpha = 0.42 * smoothstep(0.0, 0.1, age) * (1.0 - age);` }));
    }

    // ---- birds: by day, outdoors, wheeling in wide circles high over the place ----
    if (!dark && day >= 0.5) {
      const n = Math.round((region === 'sunscorch' ? 4 : 8) * (PHONE ? 0.75 : 1)), at = [], sd = [];
      for (let i = 0; i < n; i++) { at.push(wx(cx), 16 + R() * 8, wz(cy)); sd.push(R(), R(), R(), R()); }
      const big = region === 'sunscorch';
      put(points(n, at, sd, { U, name: 'birds', sprite: 'bird', color: region === 'gloomfen' || big ? 0x262428 : 0x3a3634, order: 8,
        move: `float r = ${big ? '26.0' : '16.0'} + seed.x * 22.0, a = uTime * (${big ? '0.07' : '0.16'} + seed.y * 0.08) * (seed.z > 0.5 ? 1.0 : -1.0) + seed.w * 6.283;
               p += vec3(cos(a) * r, sin(uTime * 0.4 + seed.x * 9.0) * 1.5, sin(a) * r * 0.8);
               size = ${big ? '2.4' : '1.0'}; alpha = 0.9; frame = step(0.5, fract(uTime * ${big ? '0.8' : '3.2'} + seed.x));`,
        frag: 'uv.x = uv.x * 0.5 + vF * 0.5;' }));
    }
    // ---- butterflies by day near the flowers; moths round the lanterns at night ----
    const flowers = (d.flowers || []).filter((f) => f[0] >= 0 && f[1] >= 0 && f[0] < w && f[1] < h);
    if (!dark && day >= 0.5 && (flowers.length || region === 'verdant')) {
      const n = Math.round(14 * K), at = [], sd = [];
      for (let i = 0; i < n; i++) { const f = flowers.length ? flowers[Math.floor(R() * flowers.length)] : [R() * w, R() * h]; at.push(wx(f[0]), gh(f[0], f[1]) + 0.7, wz(f[1])); sd.push(R(), R(), R(), R()); }
      put(points(n, at, sd, { U, name: 'butterflies', sprite: 'fly', order: 8,
        move: `float a = uTime * (0.5 + seed.x * 0.5) + seed.y * 6.283;
               p += vec3(sin(a) * 1.6 + sin(a * 2.3) * 0.5, 0.3 * sin(uTime * 1.7 + seed.z * 9.0) + 0.3, cos(a * 0.8) * 1.6);
               size = 0.32; alpha = 0.95; frame = abs(sin(uTime * 14.0 + seed.w * 20.0));`,
        frag: 'uv.x = (uv.x - 0.5) / max(0.25, vF) + 0.5; if (uv.x < 0.0 || uv.x > 1.0) discard;',
        color2: 'col = mix(vec3(1.0, 0.85, 0.3), mix(vec3(0.95, 0.95, 1.0), vec3(0.55, 0.75, 1.0), step(0.5, vS.z)), step(0.33, vS.z));' }));
    }
    if ((indoors || day < 0.6) && fx.flames.length) {
      const per = PHONE ? 1 : 2, at = [], sd = [], fl = fx.flames.slice(0, 40);
      for (const [x, y, z] of fl) for (let i = 0; i < per; i++) { at.push(x, y, z); sd.push(R(), R(), R(), R()); }
      put(points(at.length / 3, at, sd, { U, name: 'moths', sprite: 'fly', color: 0xe8e0d0, order: 8,
        move: `float a = uTime * (2.0 + seed.x * 2.0) + seed.y * 6.283, r = 0.35 + seed.z * 0.4;
               p += vec3(cos(a) * r, sin(uTime * 3.0 + seed.w * 9.0) * 0.25, sin(a) * r);
               size = 0.16; alpha = 0.9; frame = abs(sin(uTime * 22.0 + seed.w * 20.0));`,
        frag: 'uv.x = (uv.x - 0.5) / max(0.25, vF) + 0.5; if (uv.x < 0.0 || uv.x > 1.0) discard;' }));
    }

    return { count: made.length, kinds: made.map((m) => m.name.slice(5)), remove() { for (const m of made) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); } made.length = 0; } };
  }
  G.M7_LIFE = { add };
})(window);
