# Slip: One Foe (session 6, branch `job/foe-hd`)

Briarmaw, Act One's first Champion, in full detail: a sculpt baked onto a light version of about 50,000 triangles,
shown side by side with the code-built model and a cut-out of Chris's sheet.

## Done

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

## Next

1. His moves smoothed (weights round the shoulders and hips, a fuller walk), a hit flash.
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

## Changed outside my files

- Nothing. (Installed Blender and Python packages in this container only.)
