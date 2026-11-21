# Slip: One Foe (session 6, branch `job/foe-hd`)

Briarmaw, Act One's first Champion, in full detail: a sculpt baked onto a light version of about 50,000 triangles,
shown side by side with the code-built model and a cut-out of Chris's sheet.

## Done

- **The boglurcher** (November 21), in full detail, **passing the stretch check** (worst 1.25x, the slam):
  - Three ways, with the crowd test: https://claude.ai/artifact/CBt1k8zotiyVb5BCkquENo
  - The sculpt itself (laptop): https://claude.ai/artifact/UXByzwgQxJTPVX3MRVunir
  - Sculpt 1,296,288 triangles (saved as `foes/boglurcher/assets/boglurcher-sculpt.glb`, 4.8 MB); light model 19,774.
  - A slumped heap of clotted mud clods, moss over its top hanging in strands, two amber slit-eyed eyes in dark
    hollows, stones round its foot, two cattails and a curled sprout; shaped to the sheet (outlines overlap 0.8 at the
    sheet's own scale).
  - A new plan in the kit, `mound` (`kit/js/moves/mound.js`): it lurks, oozes, slams (rears and falls on you), grabs
    (surges along the ground), drags under (sinks, then heaves up), flinches and slumps into the marsh; base, body, top
    and whatever grows on top. Its moves map the common set (strike → slam, bite and swipe → grab, cast and roar → sink).
  - Next for it: the moss more olive and its strands broader, as the sheet paints them.
  - Pages now carry the foe's name in their title (build.mjs).

- **Briarmaw, the briarling and the glowcap pass the stretch check** (every move under 1.3x, checked at 120 frames;
  November 21). Re-weighted by part, no new bake needed (the sculpts didn't change).
  - Briarling: its leafy coat is all ball (the legs are root tubes pushed into it), the leg tubes' hidden tops go with
    the legs, the sprout bends just above the ball; it pitches as a whole; knees and sprout swing a little less.
  - Glowcap: each leaf-arm is a whole leaf on its arm bone, the cap is all head; it waddles (its body reaches nearly to
    the ground, so the legs swing only a little under it) and leans whole instead of nodding a neck it hasn't got.
  - Briarmaw: his legs claim only what is below the middle of his flank and near their own line (seen from above);
    his mouth is cut along the lips (the jaw opens without dragging his cheeks, and the page draws the inside of his
    head behind it); his upper legs are inside his barrel, so he moves from the knee and the paw, and rears, turns,
    dips and reels with his whole body. His moves are smaller than before, heavier.
  - The kit learned on the way (all in `kit/rigs/bind.py`): welding by distance, parts for separate pieces
    (`part(P, kind, idx, piece)`), `SPLIT` for a mouth, bands only from a bone the point can see and is near, bones made
    only of pieces share no band with the skin, cuts only limb against limb; and in the check, `--parts`, `--focus`,
    `BIND_AT`.

- **No stretching (Chris, November 21), in the kit:**
  - **The stretch check**, `node kit/tools/stretch.mjs foes/<key>`: every move at 48 frames, skinned as three.js does,
    fails past 1.3x on any edge or on a scaled or slid bone; names the worst move, frame, place and the two parts the
    edge joins; draws the worst frame of each move (`build/stretch/<move>.png`). Results in `foes/<key>/stretch.json`.
  - **Weights by part**, `kit/rigs/bind.py`, now the bake's only way of weighting (and `kit/tools/rebind.py` to weight
    again without baking). Each point follows one part; blending only in a band at its own joints; a bone may claim a
    point only if the line between them runs inside the body; touching limbs are cut apart; the weights are smoothed
    along the skin. Rig files may add `part`, `TRUNK`, `BANDS`, `SMOOTH` (README, "No stretching").
  - **Bones turn, never scale**: the kit's moves breathe and squash by turning bones now (quad, biped, sapling,
    mushroom, frog). The briarling pitches as a whole (hips) instead of bending its ball in the middle.
  - **Results** (worst edge growth, old weights then new, same moves; limit 1.3):

    | foe | idle | walk | attacks | hurt | fall |
    |---|---|---|---|---|---|
    | Briarmaw | 4.5 -> 2.1 | 26.9 -> 5.3 | roar 8.9 -> 3.3, swipe 42.9 -> 14.0, bite 10.5 -> 3.9 | 9.2 -> 4.2 | 20.8 -> 5.1 |
    | Briarling | 8.4 -> 1.4 | 21.1 -> 3.0 | hop 26.4 -> 4.0, lunge 26.7 -> 4.0 | 33.7 -> 3.0 | 39.6 -> 5.1 |
    | Glowcap | 4.7 -> 1.5 | 10.3 -> 2.4 | spores 26.5 -> 5.8, bump 4.7 -> 3.3 | 16.0 -> 3.5 | 25.8 -> 5.6 |

    The web-like stretches between parts (the Rotwarden kind: belly between the legs, the ball top dragged by the
    sprout, a leaf-arm pulling the hip) are gone. **All three still fail**: what is left sits where a limb meets a
    big body under a large swing: Briarmaw's leg tops in the walk and swipe and his cheeks when the jaw opens, the
    briarling's leg tops and the foot of its sprout, the glowcap's leaf-arms and boots. Next for each: smaller swings
    at those joints and wider bands, and in the sculpts, limbs that don't touch (the glowcap's boots, its arms on its
    hips).

- **The full-detail one (pass 3), published November 20:**
  - Three ways, with the crowd test: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh (version 3, 14.2 MB).
    Chris saw the crowd (six of him with the four heroes) at 144 frames a second on his machine.
  - **The sculpt itself**, beside the light version baked from it, for a laptop:
    https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P (10.2 MB): 982,634 triangles against 50,090.
  - **The full-detail model is kept as an asset**: `prototypes/foe-hd/assets/briarmaw-sculpt.glb` (with colours,
    meshopt-compressed, 4.5 MB). Chris: aim sculpts at 500,000 to 1,000,000 triangles, more only where needed; the game
    uses the ~50,000 bake. I passed this to the hub and all four jobs.
- **First look** (same link, version 1-2):
  - Three stands turning together under the same light: built in code (Models' beast, 77,452 triangles), the painted
    cut-out (Models' standee, `prototypes/bestiary/standee.js`, from the hub's branch), and the full-detail light
    version (50,167 triangles, baked from a 407,000-triangle sculpt, 2048 px pictures). Page 14.4 MB.
  - His moves: breathe, walk, roar, swipe, bite, hit, fall (19 bones).
  - **Six of him with the heroes**: six full-detail Briarmaws walking round the four heroes, with the frame rate.
- **How it's made** (Chris, November 20: "start with a 100,000 triangle shape model, and then add in detail... if you
  just make it fuzzy with a bunch of little tiny hairs, that'll look fuzzy, but it won't look like it's supposed to"):
  - Pass 1, shape (~130k): the body measured off the sheet and checked against its outline from front, side and back;
    his coat is ~1,500 big leaf-feather tufts sculpted into one surface (they overlap like shingles), not hairs.
  - Pass 2, form (~400k): each tuft gets feather barbs (strands angled out from a midrib) and broken tips.
  - Blender (installed from Ubuntu, run headless) bakes the surface, shading in the folds, colour and the eyes' glow
    onto the light version. The recipe: `prototypes/foe-hd/README.md`.
- Answer to Chris's question (are the still images baked onto the model?): Blender does the baking, from the sculpt.
  The sheet is the measuring guide and colour reference, not projected onto him: it is painted with its own light and
  shows only three views. Its front view could be projected onto the face as an option.

- **The foe kit (step 2), November 20**: `prototypes/foe-hd/kit/` and its README. Briarmaw moved to
  `prototypes/foe-hd/foes/briarmaw/` and rebuilt through it (same triangles, same pages, checks pass). The kit has:
  the sculpt runner and helpers (shapes, mesh pieces, a coat of tufts, scales or plates, cloth folds), the sheet checks
  (outline and side-by-side from each foe's crop boxes), the bake reading each foe's settings and rig, rig templates
  (four legs, two legs), packing, the sculpt asset export, the page loader, moves for four and two legs, one
  `setBeastLook` for every finished foe (`kit/js/looks.js`), the sculpt viewer and the three-ways page for any foe.
  Sessions 7 and 8 told.

- **Briarling** (my lane's first, November 20): three ways with its moves and the crowd test,
  https://claude.ai/artifact/DorMujhAe9d1XNwLGYV4ae (11.8 MB); its sculpt beside its light model,
  https://claude.ai/artifact/LAjxUMG9Aoj2UPw7DuyHtB. Sculpt 589,428 triangles (asset
  `foes/briarling/assets/briarling-sculpt.glb`, 2.7 MB); light model 16,640 (rabble budget ~20k), 1024 px pictures,
  phone 512. Moves for small walking plants: `kit/js/moves/sapling.js` (bob, waddle, hop, lunge, hit, fall).
  Kit fixes from it: pages and viewer scale with the foe's height; parts are placed on a surface that is exactly the
  same at every level (fixes missed bakes on small foes).

- **Glowcap** (November 21): three ways, https://claude.ai/artifact/AyUxs7hCGjdzZDNG1jfRnJ (11.4 MB); its sculpt,
  https://claude.ai/artifact/H5yc3TLZDp3Aho9R1nzaCg. Sculpt 841,184 triangles (asset `glowcap-sculpt.glb`, 3.4 MB):
  the warty cap with its rim rolled under, glowing gills as real radial ridges, the face, a layered leaf collar, the
  folded fibrous body with knobs, leaf arms, boots. Light model 17,284. Moves `kit/js/moves/mushroom.js` (bob, waddle,
  spores, headbutt, hit, fall).
- **Kit**: the bake now bakes coat and parts into separate pictures and joins them by an exact mask of the parts'
  islands (no more specks of glow or black bleeding across); Briarmaw and the briarling re-baked and republished
  (same links). Rig templates and first moves for serpent, frog and winged (session 7 asked).

## Next

0. Done (November 21): gates that hold through bands and smoothing (weigh +1000, or a soft mask()), and helper joints
   in the quad and biped templates (blades, haunches/hips, shoulders, neck_base, tail_root), driven by the loader's
   applyHelpers. Briarmaw re-bound with them and passes; a livelier walk still fails at his knees, under the belly fur:
   real swing back needs his legs drawn out of the belly in the sculpt (a later pass). Earlier note: session 7's proposal (docs/project/slips/foes-beasts.md: a shoulder blade per foreleg, a haunch per hind leg, two
   neck bones, a tail-root helper, driven by the loader from a HELPERS table so moves don't change). Also session 7's
   report that bind.py lets some neck weight onto the thornhound's ear root despite its weigh(): weigh gates need
   +1000 (an unseen bone costs 100), and a gate should also stop the bands and smoothing.
1. My lane, each passing the stretch check before it's handed in: (briarling, glowcap, boglurcher done) the willows
   (willow-wight, Grandfather Willow), the sparks (marsh-light, forge-spark), rockling, Mother Anvil. (The wraiths moved
   to Models, session 3.)
2. Briarmaw's moves smoothed (weights round the shoulders and hips, a fuller walk), a hit flash.
2. The face closer still to the sheet; the coat's brown zones placed as the sheet paints them.
3. Done: pass 3, the sculpt's own page, the heavier brow and golden fangs, the rump and tail as the sheet shows.

## For the Fight

- Done: `prototypes/foe-hd/page/briarmaw.js` `briarmawLook(shared, buildBeast)` is a function for
  `setBeastLook` (the hub's description of your interface): Briarmaw in full detail, every other beast as before. It
  returns `{ group, plan: 'quad', height: 1.7, parts: { head, tail }, update(t, step), hit(), act: { lunge, fall } }`, plus `pose(move, u, t)`
  for his own moves. It needs `await ready()` and `makeShared(A, 2048)` first (see `page/main.js`, `build.mjs` for the
  assets, about 3 MB).

## Earlier ask (answered by the hub)

- **From the Fight:** the shape of your foe interface, so Briarmaw drops into your fight. What I read in
  `world3d/battle/arena.js` and `prototypes/bestiary/beasts.js`: a foe figure wraps `buildBeast(key, sprite)`, which
  returns `{ group, plan, height, parts, update(t, step) }`, and `poseFoe` moves the whole body and `parts.head`.
  `prototypes/foe-hd/page/briarmaw.js` `buildBriarmawHD(shared)` returns that same shape (plan `'quad'`, height 1.7,
  `parts.head` is the head bone), plus `pose(move, u, t, step)` for his own moves (`idle`, `walk`, `roar`, `swipe`,
  `bite`, `hurt`, `ko`). It needs its assets (`makeShared(A, 1024)`, see `page/main.js`). Say in your slip if you'd
  rather call it differently.

## For Chris

- Which way for the foes: built in code, painted cut-outs, or full detail like this? (Suggestion: full detail for the
  Champions, and decide the rest once you've seen the crowd test on your phone.)

## Checks

- Headless Chromium (SwiftShader, software drawing, so far slower than a phone's graphics chip): the page loads with
  no errors at 1280 x 800 and 390 x 844; 20 frames a second on the stands, 22 with the crowd (774,000 triangles drawn
  including shadows). Not yet checked on a real phone.

## What others rely on (keep working)

- `prototypes/foe-hd/page/briarmaw.js` (`briarmawLook`, `makeShared`, `ready`): kept as a forwarding module onto the kit.
- `prototypes/foe-hd/assets/` (Briarmaw's `light.json/bin`, pictures): forwarding copies of `foes/briarmaw/assets/`,
  for the Fight's plugin, until it moves onto `kit/js/looks.js`.
- The kit's file layout and `foe.json` fields (sessions 7 and 8 build on them): changes are announced to them first.
- `kit/blender/bake.py` now returns its weights from `kit/rigs/bind.py` (by part) and writes two more arrays into
  `build/bake/low.bin` (`kind`, `index0`); `pack.mjs` reads only what it read before.

## Changed outside my files

- Nothing. (Installed Blender and Python packages in this container only.)
