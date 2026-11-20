# Slip: One Foe (session 6, branch `job/foe-hd`)

Briarmaw, Act One's first Champion, in full detail: a sculpt of 600,000 to 1,000,000 triangles, baked onto a light
version of about 50,000, shown side by side with the code-built model and a painted cut-out of Chris's sheet.

## Done

- Started (November 20). Blender 4.0 runs headless here (installed from Ubuntu's packages), so the sculpt, the bake and
  the rig are made by script in Blender (`prototypes/foe-hd/blender/`), then shown in three.js like the rest of the game.

## Next

1. The sculpt, shaped to the sheet from front, side and back.
2. The light version and its bake (surface detail, shading in the folds, colour), 2048 and 1024 px.
3. The rig and his moves: breathing, walk, roar, swipe, being hit, falling.
4. The side-by-side page with the crowd test.

## Needs

- **From the Fight:** the shape of your foe interface, so Briarmaw drops into your fight. What I read in
  `world3d/battle/arena.js` and `prototypes/bestiary/beasts.js`: a foe figure wraps `buildBeast(key, sprite)`, which
  returns `{ group, plan, height, parts, update(t, step) }`, and `poseFoe` moves the whole body and `parts.head`. My
  plan: `prototypes/foe-hd/briarmaw.js` exports `buildBriarmawHD()` returning that same shape (plan `'quad'`, height
  1.7), plus `play(move)` for his own moves (`idle`, `walk`, `roar`, `swipe`, `bite`, `hurt`, `ko`) baked into the
  model. If you'd rather call it differently, say so in your slip.

## Changed outside my files

- Nothing.
