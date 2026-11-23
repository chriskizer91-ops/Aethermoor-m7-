# The ironclad: the armoured walkers and the Unsmith

The Iron Sentinel (veteran construct), the Sentinel-Captain (Relic-Bearer, with Ironwall), the Ashen Warden (Act One's
Champion) and the Unsmith (the last foe), from session 8's list, moved to Models (session 3) on November 21.

- `armoured.js`: built the way the wraiths are (`prototypes/wraiths/`): the heroes' kit and its sculpted masters
  (plate, pauldron, vambrace, lame, rim, forged, shield, blade, cape, haft...), shaped to Chris's sheets
  (`art-in/3d/sheets/sheet-<key>.webp`, web copies in `sheets/`). Every piece rigid on one moving part (hips, chest,
  head, shoulders, elbows, hands, hips and knees of the legs, shield, blade): nothing stretches. The Unsmith is a person,
  built by the heroes' own builder (face, beard, hands, apron, cloak) with his Unmaking Hammer and the Worldforge Heart.
- For the Fight: `setBeastLook(withArmoured(withWraiths(foeLook(buildBeast))))`; `armouredLook(key, sprite, opts)`
  returns the arena's shape (as `wraithLook`), at Light unless `opts.detail` is `'high'`.
- Moves: the kit's common set, and each one's own, named for M7's (`game/src/data/foes.js`):
  - the Iron Sentinel: iron-fist, gate-slam, lock-shields; the Sentinel-Captain: those and ironwall, shield-rush
  - the Ashen Warden: ash-blade, ember-sweep, ward-of-ash, call-the-watch, command-of-cinders, scorch-the-vault,
    watch-unbroken
  - the Unsmith: hammer-blow, ring-the-anvil, unmake, forge-apron, nothing-left, worldfire, hearts-pull, heart-flare
- Build: `ln -s ../hero-3d/node_modules node_modules` (once), then `node build.mjs` (dist/armoured.html).
