# The winged: the Lamp-Moth, the Gloamwing and the Thunder-Roc

From session 7's list, moved to Models (session 3) on November 23: the Lamp-Moth (rabble, Act Two's Lanternfen), the
Gloamwing (Act One, Fawnrest; Relic-Bearer with the Dawnbell) and the Thunder-Roc (Act Two, Highfold; Relic-Bearer
with the roc-feather cloak).

- `winged.js`: built the way the wraiths and the armoured ones are: the heroes' kit and its sculpted masters, with
  three new ones for these (`feather`, `mothwing`, `plumage`, in `../hero-3d/masters/sculpt.py`), shaped to Chris's
  sheets (`art-in/3d/sheets/sheet-<key>.webp`, web copies in `sheets/`). Every piece rigid on one moving part:
  - a moth's wings are stiff membranes (painted by their vertex colours: eyespots, scalloped dark borders, mottles),
    with their veins, each hinged at its root; its abdomen is insect segments, each its own piece; six legs of two
    rigid parts; plumed antennae; fur as tufts (no fuzz of tiny hairs). The Gloamwing's Dawnbell hangs on braided cords
    on its own pendulum, with a silk shell for Cocoon. The Lamp-Moth's last segments are its lamp.
  - the Roc's wings are three spars (arm, forearm, hand), every feather a rigid blade on the spar it grows from
    (primaries, secondaries, tertials, coverts, the pale leading edge), so the wing spreads and folds by its joints;
    a fan tail, feathered thighs, gold scaled legs and four-toed feet; the cloak caught on its left foot; sparks.
- For the Fight: `setBeastLook(withWinged(withArmoured(withWraiths(foeLook(buildBeast)))))`; `wingedLook(key, sprite,
  opts)` returns the arena's shape (as `armouredLook`; `plan: 'winged'`), at Light unless `opts.detail` is `'high'`.
  The moths hover on their own (their lowest point 0.6 and 0.35 of their height above the ground); `height` includes it.
- Moves: the common set (idle, walk, bite, strike, swipe, cast, roar, hurt, ko), flight (hover, swoop, dive, land) and
  each one's own, named for M7's (`game/src/data/foes.js`):
  - the Lamp-Moth: batter, dust, circle; the Gloamwing: wing-buffet, dreamdust, cocoon, bell-hum;
  - the Thunder-Roc: talons, wing-gale, carry-off, storm-mantle.
- Build: `ln -s ../hero-3d/node_modules node_modules` (once), then `node build.mjs` (dist/winged.html).
