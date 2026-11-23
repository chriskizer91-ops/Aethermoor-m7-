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

- **Old Horn** (Act Two's Relic-Bearer, the troll with the horn): on the Act Two page below.
  - The sculpt: 1,324,836 triangles. Grey-green hide with moss stains; the cape of stitched troll hides (tufts in
    layers, the dark lining) riding his chest, the hide loincloth riding his hips; belt and buckle; the horn, tusks,
    pointed ears and a scowl; toe claws; the club with its moss and mushrooms.
  - The light model: 42,531 triangles, pictures at 2048 px (2.6 MB). Phone version: 22,292 triangles, 768 px, 0.67 MB.
  - His arms, legs and head are pieces of their own; 17 bones. Moves: Breathe, Walk, Club, Pummel, Hurl Boulder,
    Horn Toss, Mantle of Trolls, Hit, Fall.
  - Stretch check (kit/tools/stretch.mjs): passes, full and phone. Worst big edge 1.28 times (Walk, his foot; Mantle of
    Trolls, his elbow), worst crease 2.99 (Fall, his neck under the head). By eye at the worst frames: no webs.
  - What it took: the binding had put most of his legs on his hips and then snapped each knee point whole to the thigh
    or the shin, so the knee folded at one line. Now each separate piece chooses only among its own bones before the
    joints are blended (`pages/walkers/kit/bind.py`). His head became its own piece (his fur collar and his face were
    one surface), turning low at his jaw; his elbow's pivot sits behind the joint; his neck barely bends and his head
    does the turning. The phone version smooths its weights over 4 passes instead of 8 (its edges are longer).

- **The peak-troll** (Act Two veteran): on the Act Two page below, with Old Horn.
  - Built from Old Horn's troll body at 0.9 of his size (2.2 m to the top of his mantle). The sculpt: 912,536 triangles.
    Grey stone-coloured hide pebbled and patched with moss; a moss mantle hugging his back and shoulders (the kit's coat
    of tufts in moss, lichen-grey where it's old), long strands at its ragged hem at his hips, a short cushion on top;
    boulders bedded into it, mossed over their tops; shelf mushrooms in a cluster on his left shoulder and down his
    back; a moss skirt; the red thorn vine slung from his right shoulder to his left hip, thorned and weeping red; a big
    drooping nose, small ears, short tusks, flat toenails; the log club with moss and mushrooms.
  - Light model 43,606 triangles at 2048 px; phone version 23,800 triangles at 512 px, 0.56 MB (veteran).
  - Moves: Breathe, Walk, Club, Pummel, Hurl Boulder, Regrow (he hunches over the wound, shudders as it knits, rolls his
    shoulders), Hit, Fall. Passes the stretch check, full and phone: worst big edge 1.29 times (Hurl Boulder, his back).
  - What it took beyond Old Horn's: the mantle meets his skin at his seat, so it bends with his whole trunk, not his
    chest alone; his ankle's blend kept short (a broad foot's band reached his knee); his spine and chest bend less.
  - Not yet like the sheet: the moss on his shoulders is bulkier and rounder than the sheet's, and his hands are fists
    where the sheet has big open fingers (Old Horn's too).

- **The unmade** (Act Three veteran): on its own page (Act Three) below.
  - The sculpt: 817,238 triangles. A thin man of grey-brown husk strips wound round and round (the sapwight's wound
    strips, as husk), torn through in holes everywhere to the dark violet nothing inside; a ragged tunic to its knees,
    holed, with a torn hem; a thick cowl about its neck; its head wrapped too, a dark mask with two violet eyes; violet
    shards of light in a crack in its chest; its feet wrapped into blunt ends; and in its left hand the ghost of its
    relic, a six-sided violet crystal rod with heavy ends.
  - Light model 22,754 triangles at 1024 px; phone version at 512 px, 0.56 MB.
  - Moves: Breathe, Walk, Empty Grip (its empty hand comes out and closes on you), Phantom Art (it raises the relic it
    no longer holds and swings it down), Grey Touch (a slow reach, its head tilting as if listening), Husk (it goes
    slack and folds in on itself, then draws itself up), Hit, Fall. Passes the stretch check, full and phone.
  - New for it: the page now tints each walker's glow with its own colour (light.json `glow`, written by
    `kit/standard.py` for the page and the phone version), so its eyes are violet, not amber; the walkers' binder takes
    session 6's `WELD_SAME_KIND` switch.

## Links

- Act Two (Old Horn and the peak-troll): https://claude.ai/artifact/PosCApXURcQF2S8qyicNaY (13.8 MB)
- Act Three (the unmade): https://claude.ai/artifact/1fd2Ko7CSdQQD6hL2fKZcW (7.9 MB)

- The walkers' gallery (the Rotwarden and the sapwight, their sheets, the checks, the moves, five of them walking round
  the heroes): https://claude.ai/artifact/YBLUHaLG3bNdfcjBdeq3aj (12.8 MB, with the phone versions)
- The sculpts themselves, for a laptop (Chris's newer word: keep each sculpt as something he can look at):
  https://claude.ai/artifact/JCdvpAPKT781gZiU49jTh2 (14.1 MB). The sculpts are kept compressed (meshopt) in
  `prototypes/foe-hd/foes/<key>/sculpt/`: the Rotwarden 5.6 MB (1,067,554 triangles), the sapwight 4.8 MB (900,422).
  Built with `node build.mjs --sculpt` in `pages/walkers/`.

## Fixed (Chris, November 20, on his phone: "the arms are attached to the body in a weird way... they're pulling away")

- When the Rotwarden raised his arm or his root, the plates at his hips and the roots round his waist stretched after
  them. Now the arm and the root arm only carry what is really theirs: the root's own strands, fungi and moss, the
  roots wound round the arm, and nothing inside the outline of his body. The loose tendrils that dangled from his hand
  and by his knee are gone. Republished (gallery version 2, sculpt page updated).

## Fixed again (Chris, November 21: "when they move their arms they stretch themselves")

My first fix (above) wasn't enough: session 6's stretch check measured the Rotwarden still stretching up to 70 times in
Grasping Roots and 42 times in Blacken the Sap, and the sapwight 176 times in Walk. What changed (gallery version 4,
same link):

- **The arm, the legs, the head and the root arm are pieces of their own.** In the sculpt they were one surface with
  the body wherever they touched (the arm against the ribs, the root against the shoulder, the thighs against each
  other), so moving one dragged the body's skin after it. Now each is meshed apart, its top tucked under the pauldron,
  the hip hoops or the helm's rim, and turns at its joint as a whole. The sapwight's arms and legs the same.
- **Weights by part** (session 6's `bind.py`, used by the walkers' bake): each point belongs to one part, blends only
  in a band at its own joint; triangles joining pieces that merely touch are cut; each piece keeps only its own bones.
- **Bones only turn**: breathing was a scale of the chest; now a small rise.
- **The moves bend armour less**: the Rotwarden bends at the hips and knees more than at his breastplate.

Where it stands now (gallery version 5): **both pass the stretch check** (`kit/tools/stretch.mjs`, the one rule: edges
longer than 1% of the height under 1.3 times, crease edges under 3 times, no bone scaled or slid), every move, the full
and the phone versions alike. The Rotwarden's worst big edge is 1.29 times (Blacken the Sap), the sapwight's 1.28
(Bark Hide). By eye at the worst frames: no webs.

What got them there beyond the pieces and the binding: each walker has joint limits (`limits` in `pages/walkers/foes.js`:
how far each joint really bends, applied after any move), so the Rotwarden's plate trunk barely twists and his knees
fold only so far; his knee plates' points were shortened so they don't straddle the knee; his root arm has more
triangles; the sapwight's neck and elbows bend less.

- **Old Horn** passes too (November 23), every move, full and phone; see Done.
- The laptop sculpt page still shows the earlier sculpts; to be refreshed.

## The Rotwarden's named moves for the Fight (done)

All the moves the Fight's table asks of him by name, each from M7's own words for it, each passing the stretch check
(full and phone): rootlash, bark-hide, graft, blacken, grasping-roots, ichor-tide, heartroot-bloom, ichor-rain,
devour, unmaking, grief, plus breathe, walk, hit and fall. They're in `pages/walkers/foes.js` under those keys; the kit
gets them through `walker.js movesFor()` (asked of session 6: register() to use it for plan 'walker').

## In the kit's standard asset form (done)

Both walkers' assets are also in the kit's form (color-N, normal-N, ao-1024, orm-1024, emit-256, light.json with key,
plan 'walker' and height; foe.json), written by `pages/walkers/kit/standard.py` at the end of each make.sh.

## Phone versions (done)

- Each walker now also has a phone version, baked from the same sculpt with fewer triangles and smaller pictures
  (`foes/<key>/assets/phone/`, made by `pages/walkers/kit/phone.sh`): the Rotwarden 21,548 triangles and 768 px
  pictures, **0.81 MB** (full 47,698 and 3.0 MB; Champion target 0.8 MB); the sapwight 10,011 triangles and 512 px,
  **0.48 MB** (full 19,913 and 1.4 MB; the hub's rabble target is 0.4 MB, the sapwight is a veteran). At play size they
  look almost the same as the full ones. The gallery shows phones the phone version first, with a button to switch.
- For the Fight: `registerWalkers(ASSETS, register, { phone: true })` registers the phone versions.

## Next

1. The Rotwarden: one thin root at his left hip stays behind when the root arm swings; the tasset closer to the
   sheet's (a curved plate, not a box); the plates a little more faceted, like the sheet's.
2. My lane is built: the Rotwarden, the sapwight, Old Horn, the peak-troll and the unmade. Next: the laptop sculpt page
   refreshed with all five, and whatever Chris says on his phone. (Iron-sentinel, the Sentinel-Captain,
   the Ashen Warden and the Unsmith moved to Models on November 21; cinder-thrall, the Journeyman, forgeborn,
   forge-warden, thrall-overseer and bellows on November 23.)

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

- The walkers come through the foe kit's one `setBeastLook` function, like every finished foe (hub's ask, November 20):
  `registerWalkers(ASSETS, register)` from `prototypes/foe-hd/pages/walkers/register.js` registers each with
  `kit/js/looks.js` together with its own moves, then `setBeastLook(foeLook(buildBeast))` serves Briarmaw, the walkers
  and the rest. `walkersLook` is gone. Each walker gives `{ group, plan: 'biped', height, parts: { head }, update(t,
  step), hit(), act: { lunge, fall }, pose(move, u, t) }`; its lunge plays Rootlash (the Rotwarden) or Sap Leech (the
  sapwight). Checked headless (`tools/kitcheck.mjs`, the gallery with `?kit`): no errors.
- Until the kit's material reads the walkers' roughness/metal picture (asked of session 6), the Fight draws their plate
  and gold less shiny, and the sapwight's buds white instead of amber.

## Asked of session 6

- His kit is merged (hub 04433ed). The walkers are registered with its `looks.js`. Asked of him: the material to read
  an `orm` picture (roughness G, metal B) and a glow colour; he is folding in the walkers' narrow-band meshing, Parts
  and the roughness/metal bake. Once those land, the walkers' sculpts move to his `build(K)` and `foe.json` form.

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
