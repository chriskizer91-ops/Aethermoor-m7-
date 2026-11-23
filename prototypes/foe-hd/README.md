# The foe kit: foes in full detail

Every beast is made the way Briarmaw was (Chris, November 20: "already looking fantastic. I'm excited to see other foes
rendered with the techniques it learned"): a **sculpt** shaped to Chris's model sheet from front, side and back, **kept
as an asset** he can look at, and **baked onto a light model** that many can share the screen with.

- Briarmaw three ways, with the crowd test: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh
- Briarmaw's sculpt beside its light model (laptop): https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P

Chris's rules: shape first (~100k triangles, checked against the sheet), then detail, **aimed at 500,000 to 1,000,000
triangles, more only where the detail needs it**; **no fuzz of tiny hairs**: fur, leaves, scales, plates and robes are
sculpted as real shapes; the game uses the bake (~50k for a Champion; the hub's budgets: Relic-Bearers ~40k, veterans
~30k, rabble ~20k).

## Setting up (once per container)

```
apt-get install -y blender python3-numpy python3-scipy python3-skimage     # Blender 4.0 and its Python 3.12
cd prototypes/foe-hd && npm install
```

## Making a foe

```
foes/<key>/foe.json      its settings (below)
foes/<key>/sculpt.py     build(K) -> K.Mesh: its shape, its surface, its parts
foes/<key>/rig.py        BONES (and weigh, rigid), usually from a template in kit/rigs/

kit/make.sh <key>                        # everything: sculpt (light and full levels), sheet, bake, pack, asset
kit/make.sh <key> sculpt,sheet           # or some steps
python3.12 kit/py/sculpt.py foes/<key> 1 # one level: 0 light, 1 shape, 2 form, 3 detail, 4 finer
python3 kit/py/sheet.py foes/<key> 1     # build/compare-1.png (sheet above renders), build/outline-1.png (outlines
                                         # scaled to fit) and build/outline-abs-1.png (at the sheet's own scale)
blender -b -P kit/blender/preview.py -- foes/<key> 3 front,side,back,three,head
node build.mjs --foe=<key>               # dist/<key>.html: three ways (code-built, standee, full detail) + crowd test
node build.mjs --foe=<key> --page=sculpt # dist/<key>-sculpt.html: the sculpt beside its light model (laptop)
node kit/tools/check.mjs dist/<key>.html build/shots     # headless: no errors, screenshots, frame rate
node kit/tools/stretch.mjs foes/<key>    # THE STRETCH CHECK: every move, every frame; run before handing a foe in
python3.12 kit/tools/rebind.py foes/<key> # weight it again after changing rig.py (no bake), then the stretch check
```

Made files: `foes/<key>/build/` (not in git: the levels, renders, the bake) and `foes/<key>/assets/` (in git: the
light model `light.bin/json`, its pictures, and **the sculpt `<key>-sculpt.glb`**, meshopt-compressed; keep it under
about 25 MB).

### foe.json

```json
{ "key": "briarmaw", "name": "Briarmaw", "plan": "quad", "rank": "champion", "height": 1.7,
  "sheet": "art-in/3d/sheets/sheet-briarmaw.webp", "crops": [[0, 600], [600, 1530], [1560, 2172]],
  "bounds": [[-0.86, -1.48, -0.02], [0.86, 1.34, 1.62]],
  "view": { "center": [0, 0, 0.78], "width": 3.0, "head": [0, 0.95, 1.02] },
  "light": { "level": 0, "coat": 29500 }, "sculpt": { "level": 3 },
  "bake": { "res": 2048, "phone": 1024, "ao": 48, "reach": { "coat": [0.07, 0.2], "parts": [0.02, 0.05] } },
  "rig": "rig.py", "blurb": "...", "next": "...", "pages": { "sculpt": "<link>", "three": "<link>" } }
```

- `crops`: the sheet's front, side and back figures as [x0, x1] in sheet pixels (the sheet checks use them).
- `bounds`: the box the body is meshed in (sculpt coordinates: x his right, y forward, z up, metres, feet at 0).
- `uv_scale` {kind: factor}: each kind's share of the picture (shrink small leaves); `flat` [kinds]: stacked leaves or
  petals get a flat surface and light shading in the bake (cage rays hit their neighbours).
- `glow` ("0xffa040") and `glowIntensity`: the colour and strength of the glow (default white, 1.3).
- Roughness and metalness: give `M.add(..., mat=(roughness, metalness))` in sculpt.py and the bake makes an ORM picture
  (R shading, G roughness, B metal; session 8), which the page uses so plate and gold keep their shine.
- `light.coat`: the light model's coat (kinds 0-1) in triangles; parts come built light (level 0) and keep their shape;
  `light.kinds` can cap other kinds. Total ≈ coat + parts: aim at the rank's budget.
- `voxel` (optional) {level: metres} overrides the meshing size per level (small foes want finer).

### The kit's Python (`K` in `build(K)`)

- `K.sdf`: `smin smax ell cap` (shapes), `fbm vnoise mix sstep tri`, `grad project drop mc`.
- `K.geom`: `Mesh` (vertices with a colour and a **kind**: 0 body/coat, 1 cloth/skin layer, 2 thorn/spike, 3 vine/rope,
  4 plate/band, 5 tusk/tooth, 6 claw, 7 eye/glow, 8 other rigid piece), `tube horn ellipsoid frames resample lay
  sample_surface`.
- `K.sdf.mc(f, h, lo, hi, band=metres)`: with `band`, exact values only near the surface (session 7's narrow band,
  about ten times faster on the fine passes).
- `kit/py/parts.py` (session 8): `Parts` (a body of named parts, each with a look; `label(V)` says which part made each
  vertex, so colours don't bleed) and `Blobs` (many small spheres as one soft lumpy shape).
- `K.Coat(body_sdf, lo, hi, LV, VOX, tuft_len, flow, bare, style, shape='tuft'|'lock'|'scale'|'plate')` ('lock': session
  7's fur, flame-shaped locks with grooves and split tips): a surface of
  overlapping shapes sculpted into the body (topmost wins), the same at every level; gives `full_sdf` (to mesh),
  `place_sdf` (to place parts on: **use it for every part**, so parts sit the same at every level and the bake finds
  them) and `colours(V, bare_colour)`.
- `kit/py/cloth.py`: `robe_folds`, `drape` (folds as real shapes, subtract from a robe's distance).
- Levels: `K.LV`, `K.VOX`, `K.SIDES`, `K.SEG` (roundness of parts). Random choices that place parts must not depend on
  the level (give each its own seeded dice), or the light model's parts won't match the sculpt's.

### Rigs (`kit/rigs/`)

- `quad.py` `make(legs, hips, spine, chest, neck, head, jaw, tail, jaw_region, jaw_parts)`: hips, spine, chest, neck,
  head, jaw, tail, fl/fr/bl/br _upper/_lower/_paw.
- `biped.py` `make(hips, spine, chest, neck, head, arm, leg, jaw, jaw_region, held)`: plus r_/l_ upperarm, forearm,
  hand, thigh, shin, foot (r_ is his right, +x; give the right side, the left mirrors it).
- `serpent.py` (seg0..segN rooted at the head end, head, jaw), `frog.py` (hips, chest, head, jaw, arms, long back
  legs), `winged.py` (body, neck, head, jaw?, tail?, r_/l_ wing1-3, legs); moves in `kit/js/moves/<plan>.js` (first
  passes; the lanes improve them).
- A rig file gives `BONES`, and may give `weigh(D, P, idx)` (adjust distances), `rigid(kind, P, idx)` (a bone name
  for a rigid piece, e.g. tusks to the jaw, a weapon to a hand), `part(P, kind, idx[, piece])` (a bone index per point
  where you know better, -1 elsewhere; with a fourth argument it also gets which separate piece each point is in, so a
  leaf or a strap can be judged whole; a piece that part() mostly names is all that part), `TRUNK` (the bones down the
  middle), `BANDS = {bone: w or (w, R)}` (a joint's blend: half-width and reach), `SMOOTH` (smoothing passes, default
  8) and `SPLIT = [('head', 'jaw')]` (cut two parts apart with no blend: a mouth that opens; the page then draws the
  model's inside too, so the open mouth shows the inside of the head).
- **Gates.** In `weigh`, `+ 1000` on a bone means "never" for that point, and it holds through everything (labels,
  joint bands, smoothing). A value under 500 only steers the labels (smoothing may still blend a little in). A rig may
  also give `mask(P, idx) -> (n, bones)` in 0..1, a soft gate multiplied in at every step: give it soft edges a few cm
  wide, because a hard edge tears when the two sides move apart.
- **Helper joints** (November 21, from session 7's proposal). The quad and biped templates add them by default
  (`make(..., helpers=False)` to leave them out):
  - quad: `fl_blade`, `fr_blade` (a shoulder blade over each foreleg, half the upper leg's turn), `bl_haunch`,
    `br_haunch` (half the thigh's), `neck_base` (half the neck's), `tail_root` (a quarter of the tail's);
  - biped: `r_shoulder`, `l_shoulder` (0.35 of the upper arm's), `r_hip`, `l_hip` (0.3 of the thigh's), `neck_base`.
  A helper sits between a bone and its parent. The moves never touch it: the loader (`applyHelpers`, also used by the
  stretch check) gives it its share of its one child's turn after every pose, and takes that share off the child, so
  the limb ends where the move put it. Any rig can have them: name a bone `<x>_blade`, `_haunch`, `_shoulder`,
  `_hip`, `neck_base` or `tail_root` with exactly one child, or list `HELPERS = {bone: share}`. The bake and
  `rebind.py` write the list into `light.json` (`helpers`); a page that builds foes without the kit's loader must call
  `applyHelpers(F)` after each pose.

### No stretching (Chris, November 21)

Chris saw the Rotwarden's belt and straps drag out into a web when he spread his arms. The rules are in
`docs/project/jobs/foes.md` ("No stretching"); the kit keeps them like this:

- **Weights by part** (`kit/rigs/bind.py`, used by the bake and by `rebind.py`). Each point of the light model belongs
  to one part (one bone) and takes weight only from that bone and, in a narrow band round one of its own joints, the
  bone across that joint. A point's part is the nearest bone after the template's gating that it can *see* (the line
  from the point to the bone stays inside the body, as Blender's bone heat does), cleaned on the mesh: a point behind
  its bone's joint, or far from its bone, goes to the parent. Where two limbs merely touch in the sculpt (two boots, a
  leaf-arm on a leg) the light mesh is cut between them. Then the weights are smoothed along the skin a few passes, so
  each change of part is spread over a few centimetres and no single edge takes it.
- **Bones turn; they never grow or slide.** The moves in `kit/js/moves/` rotate bones only (breathing is a small turn
  of the chest or body; a squash is a tip). The root and the whole body may move.
- **The stretch check**: `node kit/tools/stretch.mjs foes/<key>` poses every move at 48 frames, skins the light model as
  three.js does, and applies the one rule for every lane (hub, November 21): a **big** edge (longer than 1% of the
  foe's height at rest) must stay under 1.3 times its rest length; a small **crease** edge may reach 3 times; no bone
  scaled or slid. Big and crease edges are reported apart (foe.json `"stretch": {"crease": 3, "big": 0.01}` only if
  the hub agrees). It names the worst move, frame, place (sculpt coordinates) and the two parts the worst edge joins ("chest >
  r_upper" means weight bleeding between those parts), writes `foes/<key>/stretch.json`, and draws the worst frame of
  each move in `foes/<key>/build/stretch/<move>.png` (front and side; stretched triangles yellow to red, past the
  limit magenta): look at them by eye. A soft part may have its own limit in foe.json, `"stretch": {"limit": 1.3,
  "parts": {"jaw": 1.5}}`; say why in your slip. It finds the moves itself (the kit's plan, the walkers' `foes.js`,
  the beasts' `moves-<name>.js`), or take `--moves=path.js#name`. `--focus=x,y,z,r` draws the pictures close up round a
  place (sculpt coordinates, metres); `--parts` also draws `parts.png`, each point coloured by the bone that moves it
  most (look at it first: a leg that claims the flank, a face that follows the jaw); `--frames=120` for a final check.
  `BIND_AT=x,y,z python3.12 kit/tools/rebind.py foes/<key>` prints what the binding decided at one place (its part, the
  bones it sees, the nearest after gating).
- **What made the three pass** (November 21): a part for each separate piece (the briarling's coat is all ball and its
  leg tubes go with the legs; the glowcap's leaf-arms are whole leaves on the arm bones and its cap all head); legs that
  claim only what is near their own line and below the belly (Briarmaw); a mouth cut along the lips; and moves that turn
  the whole body (the root) for drama instead of bending a neck or a leg that is buried in the body. Where a limb is
  inside the body in the sculpt, it can only move a little; move it from the joint that shows.

### The page side (`kit/js/`)

- **A foe's own moves set.** `looks.js` `register(A)` picks the moves by `light.json` `moves` (from foe.json
  `"moves"`, carried by the bake, `rebind.py` and `pack.mjs`), else by its `plan`. A lane adds its own sets first:
  `addMoves('lizard', lizardMoves)` (or `PLANS.lizard = ...`), then registers its foes. The walkers' plan finds its
  moves in `pages/walkers/foes.js` by itself.

- `loader.js`: `ready, makeShared(A, res), makeFoe(shared, moves), cloneFoe(F)`: the Fight's face
  `{ group, plan, height, parts, update(t, step), hit(), act: { lunge, fall }, pose(move, u, t) }`.
- `moves/<plan>.js` (quad, biped, sapling, mushroom, serpent, frog, winged): `MOVES, DUR, LUNGE, ALIAS?, pose(F, move,
  u, t, step)` by bone name. **Every foe answers to the common moves** `idle, walk, bite, strike, swipe, cast, roar,
  hurt, ko` (the Fight picks by M7's move): `F.pose(move, ...)` plays the plan's own move of that name, or its nearest
  (`loader.js` `resolveMove`; a plan can map names in `ALIAS`); `F.duration(move)` gives its length.
- `looks.js`: **one `setBeastLook` for every finished foe**: `register(assets)` each, then
  `setBeastLook(foeLook(buildBeast))`.
- `viewer.js`: the sculpt viewer page. `pages/kit/`: the three-ways page. A lane's gallery: its own entry and shell in
  `pages/<lane>/`, `node build.mjs --foes=a,b --entry=pages/<lane>/main.js --shell=pages/<lane>/shell.html --out=<lane>`
  (the entry imports `{ FOES }` from `./assets.js`).

## How it works (from Briarmaw)

1. **The sculpt**: the body as smooth signed-distance masses measured off the sheet, its outline checked against the
   sheet's from three sides; the surface (tufts, scales, plates, folds) sculpted into it; parts (thorns, vines, tusks,
   claws, eyes) as real geometry placed on `place_sdf`.
2. **The light model** (`kit/blender/bake.py`): the light level (parts built light), the coat reduced; UVs by Smart
   UV Project; Cycles bakes surface, shading, colour and glow from the sculpt in two runs (coat with a long reach, parts
   with a short one against the sculpt's parts only). This Blender has no denoiser: denoising off, or bakes cancel.
3. **The rig**: four weights a vertex by distance to the bones (with the template's rules); rigid kinds move as one.
4. **Packed** for the page with meshoptimizer; the sculpt exported as glb and compressed with gltf-transform.

Briarmaw is `foes/briarmaw/`. `page/briarmaw.js` stays for earlier callers (`briarmawLook`).
