# Slip: Foes: walkers (session 8, branch `job/foes-walkers`)

M7's two-legged foes in full detail, the way session 6 made Briarmaw: a sculpt shaped to Chris's sheet, baked onto a
light model that can share the screen with the party, rigged, moving through its own M7 moves.

## Done

- **The Rotwarden** (Act One's second Champion): on the gallery page below.
  - Shape model: 159,000 triangles, checked against the sheet's outlines from the front, side and back (the outline
    picture is on the page).
  - The sculpt: 1,064,674 triangles. Real plates with cut edges, raised gold rims and rivets; a visored steel helm
    with its slits, beak and breathing holes; the gold mask on its chain; his left arm one great root of fifteen twisted
    strands with bracket fungi; roots wound through his joints and over his chest and back; moss in cushions of lumps;
    the tree growing out of his helm. No fuzz.
  - The light model: 47,500 triangles, four pictures at 2048 px (colour, surface, shading, and which parts are metal and
    how shiny, so his plate and gold catch the light).
  - 18 bones (the root arm has four of its own) and his moves: Breathe, Walk, Rootlash, Grasping Roots, Bark Hide,
    Blacken the Sap, Devour, Hit, Fall.
- **The sapwight** (Act One veteran): on the gallery page below.
  - Shape model: 177,000 triangles, checked against the sheet's outlines.
  - The sculpt: about 900,000 triangles. Bark in broad strips wound diagonally round its limbs and body, each a raised
    shingle with a torn lower edge (some lift away in flaps, as on the sheet), black glossy sap in the gaps; the head
    in strands of bark swept back; amber eyes and amber buds on its twigs that glow; long clawed fingers and root toes;
    sap dripping from its face; lobed moss leaves on its shoulders, waist and thighs.
  - The light model: 19,913 triangles, pictures at 1024 px plus the glow. Its moves: Breathe (hunched, swaying), Walk,
    Sap Leech, Grasp, Bark Hide, Hit, Fall. 17 bones.

## Links

- The walkers' gallery (the Rotwarden and the sapwight, their sheets, the checks, the moves, five of them walking round
  the heroes): https://claude.ai/artifact/YBLUHaLG3bNdfcjBdeq3aj (11.1 MB)
- The sculpts themselves, for a laptop (Chris's newer word: keep each sculpt as something he can look at):
  https://claude.ai/artifact/JCdvpAPKT781gZiU49jTh2 (14.1 MB). The sculpts are kept compressed (meshopt) in
  `prototypes/foe-hd/foes/<key>/sculpt/`: the Rotwarden 5.6 MB (1,067,554 triangles), the sapwight 4.8 MB (900,422).
  Built with `node build.mjs --sculpt` in `pages/walkers/`.

## Fixed (Chris, November 20, on his phone: "the arms are attached to the body in a weird way... they're pulling away")

- When the Rotwarden raised his arm or his root, the plates at his hips and the roots round his waist stretched after
  them. Now the arm and the root arm only carry what is really theirs: the root's own strands, fungi and moss, the
  roots wound round the arm, and nothing inside the outline of his body. The loose tendrils that dangled from his hand
  and by his knee are gone. Republished (gallery version 2, sculpt page updated).

## Next

1. The Rotwarden: one thin root at his left hip stays behind when the root arm swings; the tasset closer to the
   sheet's (a curved plate, not a box); the plates a little more faceted, like the sheet's.
2. The sapwight: its load is 1.4 MB, over the hub's 0.4 MB for rabble (the light model is 0.55 MB alone): smaller
   pictures and a lighter mesh for phones.
3. Then Act Two's walkers: Old Horn and the peak-troll, then the forge's folk.

## How it's made (for the other foe sessions)

- `prototypes/foe-hd/foes/<key>/`: each walker's `sculpt.py` (the measurements and every part), `rig.py` (its bones and
  weights), `make.sh` (sculpt, checks, bake, pictures, pack, in one go) and `assets/` (what the page loads).
- `prototypes/foe-hd/pages/walkers/kit/`: the walkers' copy of session 6's recipe, adapted, until his shared kit lands:
  `sdf.py` (shapes, noise, a narrow-band marching cubes so a million-triangle pass takes two minutes, named parts that
  remember which made each point, blob fields for moss), `bake.py` (his bake plus a roughness/metal bake and glow, rig
  from the foe's `rig.py`), `rig_biped.py` (a biped rig), `preview.py`, `checks.py` (any sheet, any three crop boxes),
  `closeup.py`, `info.py`.
- `prototypes/foe-hd/pages/walkers/`: the gallery (`node build.mjs`), `walker.js` (loads a walker, its skeleton and
  moves), `foes.js` (each walker's moves, named for its M7 moves), `tools/` (pictures, packing, the headless check).

## For the Fight

- `prototypes/foe-hd/pages/walkers/walker.js` `walkersLook({ rotwarden: [shared, FOES.rotwarden] }, buildBeast)` is a
  function for `setBeastLook`: the walkers in full detail, every other foe as before. Each returns `{ group, plan:
  'biped', height, parts: { head }, update(t, step), hit(), act: { lunge, fall } }` plus `pose(move, u, t)` for its own
  moves. It needs `await ready()` and `makeWalkerShared(assets)` first (see `pages/walkers/main.js`).

## Asked of session 6

- His kit's shape arrived (foe.json, sculpt.py build(K, LV), rig.py, kit/js loader, moves and looks). I'll move the
  walkers onto it when it reaches the hub's branch.

- Sent him what a biped kit wants (sculpt helpers split from Briarmaw's body, sheet checks taking the sheet and crop
  boxes, the bake taking per-kind targets and a per-foe rig, the page loader generic over body plans). The walkers' kit
  copy above is ready to fold into his.

## For Chris

- The Rotwarden is 2.5 m to the tips of his branches and the sapwight 2.0 m (the heroes are 1.72 m). Say if they
  should be bigger or smaller.

## Checks

- Headless Chromium (software drawing, much slower than a phone's graphics chip): the page loads with no errors at
  1280 x 800 and 390 x 844, for both foes, mid-move and in the crowd; 20 to 22 frames a second there (600,000
  triangles drawn in the crowd). Not yet checked on a real phone.
- Sizes to load: the Rotwarden 3.2 MB (2048 px pictures; Champion phone target 0.8 MB would need 1024 px pictures), the
  sapwight 1.4 MB.

## Changed outside my files

- Nothing. (Installed Blender and Python packages in this container only.)
