# Slip: Places (session 4, branch `job/places`)

## Done

- **The Sunscorch** (all ten: the Sun Road, Sandspire, the Dust Trail, Dusthaven, the Deep Shaft, the Glass Heart, the
  Glass Flats, Miragewell, the Scorchgate Ruins and Vaults), by day, from M7's maps and paintings:
  https://claude.ai/artifact/Awn5YJ761bD7rPyp4AkEdf (10.9 MB with the heroes in Chris's textures). What's new in them:
  - Cliffs, scarps, mesas and a mine's rock walls rise out of the ground (thick runs of `^`, and `R` in a mine), with
    rock wrapped round their faces; dune crests are soft sand humps; a lone `^` is a boulder as before.
  - Chris's sand, sandstone, adobe, awning canvas and glass flats; flat adobe roofs, terracotta roofs and striped
    awnings and tents by the painting's roof colour.
  - Palms (Sandspire, Miragewell), cacti (the Sun Road), crystal spires (the Glass Heart), glass spires (the Flats),
    dead trees, a mine's props, columns; jars, shrubs, carts, crystal clusters, glass shards, stumps, urns; glowing
    sunstone veins, crystals and embers.
  - Day light and a blue sky (the mines and the vaults stay dark).

- **The Ironspire** (all seventeen, with the East Road): https://claude.ai/artifact/BPcAuRLL3njp1Q3ZHPTUWQ (12.6 MB). Snow
  and frosted crags rising from the ground, Chris's dwarf stone, forge brick, ice and snow; the monastery in pale stone,
  the Tallymen's canvas tents, frost-dead trees, carved kings on the Iron Stair, anvils in the forges, ice columns
  Beneath Frostmere; the halls and forges lit by their fires, the rest by a cold day.
- **The Gloomfen** (all twelve): https://claude.ai/artifact/RkoGBME3ANqwAVLnwKLbj8 (11.2 MB). Bogmire's plank streets and
  the piers stand on stilts over Chris's bog water; waist-high rails, lanterns on poles, reeds, a green mist by day;
  the Mother's Hollow and the drowned belfry by night.
- Act Two is done: one page per region, every place built.
- **Act Three**: https://claude.ai/artifact/HMZiN2rDQThhvvsJqwmE56 (8.0 MB). The Keep's three galleries, the Great Hall,
  and the Hearth Below: the Hollow Hall (violet stone, pillars, the round council table), the Ash Stair (rock rising
  round the drop, ember seams, a red glow far down), the Chained Deep (great chains up into the dark, iron rails) and
  the Worldforge (molten channels that glow and light the room, hooks and racks). The four Hearth Below maps have no
  painting yet: they stand on **stand-ins drawn from the 2D game's own tiles** (`world3d/m7/standin.mjs`, kept in
  `world3d/m7/standins/`). When Chris's batch 4 lands in `game/src/ui/assets/paint/`, `node m7/convert.mjs <id>` picks
  his painting up instead.
- Every one of M7's maps is now a 3D place (60: the map list in `game/src/data/maps/index.js`; 61 counted that file).

### Step 3

- **The Atlas**: https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi (9.9 MB). The 3D continent as M7's atlas: all 32 stops of the story map pinned where
  `docs/lore/places.json` puts them (each holding its M7 maps, all 60), the six regions' names in their colours, the
  party's pin, and the 35 Hearthfires as flames: tap one for its card, **Travel to ...** on a kindled one. A grey flame
  isn't kindled yet. The page lets you pick where the party is and which fires are lit, and shows what came back.
- **For Together, the Atlas's shape** (`world3d/m7/atlas.js`, data in `world3d/m7/atlas-data.js`):
  `M7_ATLAS.open({ at, kindled, title }) -> Promise<{ place, hearthfire } | null>`. `at`: the M7 map id the party is
  in. `kindled`: the Hearthfire ids lit (M7's flags), or `'all'`. It resolves with the chosen fire (`place`: the M7 map
  it's in, `hearthfire`: its id) or `null` on Back. `M7_ATLAS.close()`, `M7_ATLAS.isOpen`, `M7_ATLAS.stopOf(mapId)`.
  It makes its own layer (z-index 60) over the page. The page needs THREE, `continent/world.js`, the
  `continent/map/*.js` scripts, `names.js`, `m7/atlas-data.js` and `m7/atlas.js` (see `coven/pages/m7-atlas.html`).
  About 6 MB of the continent's art and models come with it. Every place now has an anchor `hearthfire:<id>` at
  that fire's stand, so `go(place, 'hearthfire:' + id)` lands the party there.
- **Light per place**: Act One is now by day, like Act Two. Each place names its light in its data (`light`: day,
  dusk, night or indoor; Act One: day, but dusk for Briarmaw's den and the Eldergrove, night in the Heartroot, indoors
  for the halls and towers). Acts Two and Three keep their regions' light. Every region page has a **Light** button
  under **The painting**: its own, then day, dusk and night for every place, to compare. Act One's page is the
  hub's link (https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA): I left it for the hub to republish from this branch
  (`sh m7/pages.sh` builds every page; Act One is `dist/m7-places-768.artifact.html`, 14.9 MB).
- **Batch 4**: when Chris's paintings come, file each as `map-<id>.png` (or .webp/.jpg) anywhere under `art-in/`.
  `node m7/convert.mjs <id>` then uses it in place of the stand-in (fitted to the map's tiles). The order is: the game's
  own painting, then Chris's from `art-in/`, then the stand-in. Tested with a dummy file, then removed.
- Checks: all 60 places converted again; their anchors, exits, people, starts and walk boxes are unchanged (compared
  with the last commit), with the new `hearthfire:` anchors all on walkable ground. Every page rebuilt (heroes in
  Chris's textures) and checked: every place loads with no errors and every way out lands on walkable ground (Act One 28,
  Sunscorch 18, Ironspire 32, Gloomfen 22, Act Three 14); the Atlas opens, a flame's Travel sends back
  `{ place: 'sandspire', hearthfire: 'spire-hearth' }`, Back sends back `null`, and it opens again cleanly
  (`m7/check-atlas.mjs`). `world3d/continent/` and `names.js` are unchanged, so `aethermoor.js` is as it was.

## Next

- Waiting for the hub.

- Merged the hub's branch (39fe4ab and on) and rebuilt all four pages with the heroes in Chris's textures; each
  still loads with no errors and is under 16 MB.

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--name=` puts a region's name where the page says "Act One", `--out=` names
  the file, `--paint=0.75` shrinks the game's paintings for a page with many of them. Nothing existing changed.
- Coven's engine (mine to change, additive, marked "Aethermoor, Places"): `core.js` a day sky (`night.day`) and a day sky on
  the water, and molten metal that glows (`waterMat` `emis`); steep ground wears a rock texture instead of the painting stretched down it (`ground.rock`, only when a
  place asks); `world.js` passes `ground.rock` through. Act One asks for neither, so it looks as it did.

## Needs

- Nothing.

## For Chris

- Nothing yet.

## Checks

- Each page loads headless (Chromium, SwiftShader) with no errors; a still from above, one from the walk and one from
  high behind for every place (`world3d/m7/check.mjs`, kept in `world3d/.cache/shots/`).
- Every way out taken in the page, each landing at its anchor on walkable ground: the Sunscorch 19, the Ironspire 32,
  the Gloomfen 22, Act Three 14 (the few left lead to Act One's places, on their own page; checked from the data)
  (`EXITS=1 node m7/check.mjs ...`); `node m7/exits.mjs` checks the same from the data.
- Act One rebuilt (11.6 MB at `--tex=768`) and all 14 places load with no errors; its place files unchanged apart from
  a `dark` flag on the two dark maps. Anchors, exits, people and walk boxes untouched.
- Not checked: a phone's frame rate.
