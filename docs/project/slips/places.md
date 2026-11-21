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

### Step 4

- **True to the paintings.** From above, the places now wear their paintings wherever the painting shows the top of
  something: every roof's colour (see below), the **water**
  (Bogmire's lily pads, boats and stilts, the Keep's moat), the **decks and bridges** (Bogmire's planks and lanterns,
  the Old Bridge's stone) and the **rocks**. Walls keep their own textures. The maps' own things now stand as
  themselves: 90 signposts, 6 notice boards with their papers, 63 chests with iron bands, 66 relic pedestals, the war
  table and 3 bell frames. Trees the painting shows as pines are firs (Thornhollow's, the East Road's higher woods).
  **Roofs (changed after the hub's review):** they keep their own crisp textures (Chris's slate, the tile, thatch and
  moss kinds) and take only their colour from the painting. `convert.mjs` writes each place a roofs-colour picture
  (`coven/art/m7/<id>-roofs.webp`), with each building in one flat colour taken from its roof rows (116 KB for all 28): the commonest hue of the roof's
  middling pixels (so a torch or a lit gable doesn't win), and roofs that touch (a hall and its wings) share one colour. So a
  blue roof stays blue and a red one red, and no painted dormer, gable, window or stall's wares is stretched over a roof.
  Houses get a real stone chimney near one end of the ridge. (Water, decks, rocks and everything else still wear the
  full painting.)
  Gates and locks are left to the game, because they open and close with the story. Towns checked against their paintings:
  the Keep, Thornhollow, Sandspire, Dusthaven, Ironhold, Stormwatch, Bogmire.
- **Phones.** On phone detail, the trees deep inside a wood (hidden by the outer ones) and many of the woods past the
  map's edge are left out, every tree is the lighter kind, and trees are drawn in bigger batches. All pages use smaller
  textures and paintings now: Act One 7.4 MB (was 14.9), Sunscorch 7.2, Ironspire 11.0, Gloomfen 9.7, Act Three 5.7 (with the figures),
  the Atlas 7.2.
- **Draw calls and triangles** (headless, every place from the walker's own view, with the party; "place alone" is
  the same view without the four heroes; a real phone's frame rate is not checked):

  | Page | Phone detail: median (heaviest) | Laptop detail: median (heaviest) | The place alone, phone / laptop (median) |
  |---|---|---|---|
  | Act One | 36 calls, 135k tris (Hearth Road 61, 226k) | 95 calls, 263k tris (Hearth Road 271, 550k) | 28, 86k / 32, 102k |
  | Sunscorch | 24 calls, 86k tris (Miragewell 29, 83k) | 75 calls, 178k tris (Dust Trail 180, 281k) | 16, 36k / 20, 34k |
  | Ironspire | 30 calls, 105k tris (Old Bridge 47, 157k) | 112 calls, 232k tris (Iron Stair 193, 307k) | 22, 56k / 34, 57k |
  | Gloomfen | 35 calls, 138k tris (Willowmurk 63, 205k) | 88 calls, 260k tris (Long Boardwalk 188, 319k) | 27, 88k / 36, 112k |
  | Act Three | 21 calls, 80k tris (Worldforge 24, 101k) | 96 calls, 205k tris (Ash Stair 178, 272k) | 12, 31k / 14, 27k |

  On laptop detail the trees go in 40 m batches and the ground in 48-cell patches (the Thornway's place alone 179 -> 95
  calls, the Hindwood's 98 -> 63, the Hearth Road's 143 -> 112; some more triangles, which a laptop carries easily).
  On phone detail the trees are drawn in 48 m batches and the ground in 64-cell patches (`place.treePatch`,
  `place.groundPatch`, engine additive): the Hearth Road's place alone went from 99 to 54 calls, and the Thornway's from
  86 to 47. The cost is some 10-30k more triangles, since bigger batches are culled less finely. All of a place's
  pools of water are drawn as one (`place.waterMerge`, engine additive; each pool is still its own for the ground and
  walking): Mossfall's place alone went from 61 to 28 calls (was the heaviest, 69 with the party, now 36); Willowmurk
  was then the heaviest on a phone at 64: on a phone the woods past a map's edge now take the kind of tree the place
  itself mostly grows (no firs mixed into a broadleaf place's edge woods), which drops a set of tree materials from
  every batch. Willowmurk: 64 -> 32 calls (place alone 55 -> 24); the Hindwood 43 -> 35.
  With Models' light figures (the hub's d96e11e; m7places.js: the leader 'auto' and the followers 'lite' on a phone,
  'auto-high' and 'auto' on a laptop) the party costs about 9 draw calls on phone detail, where it took about 144.
  Phone medians fell from 60-82 calls to 26-43 (and then to 21-36 with the bigger batches). The heaviest places are now the long wooded roads (the Hearth Road,
  99 calls for the place alone), not the party.
  The Thornway on phone went from 105 to 82 calls and 279k to 168k triangles for the place alone; the Hindwood from
  128k to 75k.
- **(Done by Models, d96e11e.)** Before their light figures, the four heroes were most of the cost. On phone detail they take about
  144 draw calls and 110k triangles together whenever they're in view (about 36 calls each, already merged by
  moving part and material). A lighter phone version of the followers (fewer materials or parts, or one mesh each)
  would roughly halve a town's draw calls. That's in `world3d/heroes.js` / `prototypes/hero-3d/`, not mine.
- Checks: every page rebuilt; every place loads with no errors and every way out lands on walkable ground (Act One 28,
  Sunscorch 18, Ironspire 32, Gloomfen 22, Act Three 14); the Atlas still sends back its choice. Act One's file is now
  `dist/m7-places-512.artifact.html` (`sh m7/pages.sh`).
- **For Together: the continent, lighter.** `world3d/continent/map/tree-models-lite.js` (365 KB, was 1.66 MB: the
  same eight trees, the mid model standing in for the near one) and `world3d/continent/map/place-models-lite.js`
  (587 KB, was 2.08 MB: the walking places' models for the places M7 names on the map, Thornhollow, Fawnrest Shrine,
  the jetty, the Thornway, Bogmire and the Lanternfen; elsewhere the map shows its own plain buildings). They define
  the same globals, so load them where the full files went. Made by `node continent/make-lite.mjs`. The Atlas page
  uses them now: 7.2 MB (was 9.9), and it opens, travels and goes back as before. `map3d.js` takes `near: 'mid'`
  (one line, marked). The full files are unchanged, and the Verdant Wilds page still opens its continent with every
  model (it builds at 17.3 MB with today's heroes, which is the hub's to trim, e.g. `--herotex=256`).
- Measured with `m7/probe.mjs` (`m7/measure.sh` runs every page); close-up stills with `m7/near.mjs`.

### Step 4 (November 21): the places come alive

- `world3d/m7/life.js` adds to every place, each kind ONE draw animated wholly on the graphics card from the world's
  clock: flickering **flames** on every lantern, lamp and Hearthfire; **smoke** from every chimney; **sparks** from
  coals and molten metal; **weather** round the camera (leaves drifting down in the woods, dust blowing over the
  Sunscorch, snow on the Ironspire's heights, mist low over the Gloomfen, ash and embers in the Hearth Below, dust
  motes indoors); **rings** spreading on still water; **birds** wheeling high by day (vultures over the Sunscorch,
  crows over the fen); **butterflies** over the flowers by day; **moths** round the lanterns at night and indoors.
  **Trees sway** in the wind (engine: `place.wind`, core.js WIND, in the vertex shader: no extra draws). A phone
  gets about half the particles.
- The kit records where the flames, chimney tops and embers are as it builds a place (`__fx`).
- Cost, phone detail, headless (draws without -> with; frame time is SwiftShader software rendering, so only the
  comparison means anything): the Keep 30 -> 35, Thornhollow 45 -> 49, the Thornway 54 -> 60, Mossfall 50 -> 56, the
  Heartroot 21 -> 24; frame time unchanged within the noise (e.g. the Thornway 509 -> 498 ms, Mossfall 339 -> 343).
  The regions: Sandspire 29 -> 33, the Dust Trail 24 -> 28, the Frost Road 18 -> 21, Ironhold 22 -> 25, Bogmire
  34 -> 39, Willowmurk 54 -> 59, the Worldforge 25 -> 27. Frame time again within the noise, except a few per cent
  where the dust or snow fills the view (Sandspire 316 -> 338 ms, the Frost Road 278 -> 294 ms headless).
- The rest of the list (November 21, after the place map): **Silverfall's waterfall** has white streaks running down
  it and spray boiling up where it lands (place data `falls`, from `m7/convert.mjs`'s FALLS; two draws in all, however
  many falls). The Iron Stair's gully is left without: it runs inside the cliff, out of sight from the path.
  **Fish** leap now and then out of open water, an arc a metre high, turning nose-down as they drop back in (one
  draw; not indoors or on molten metal). **The Keep's banners sway** (doors and the Great Hall's walls): engine
  `core.js` CLOTH, hanging cloth pinned at its top edge, ripples and swings in the vertex shader; the kit's banner
  material asks for it (`cloth: true, wind`); `world.js` passes `wind`/`cloth` through extraMats. No extra draws.
- Checks: `m7/check-life.mjs` (what comes alive in each place, stills mid-flight), `m7/probe-life.mjs` (the cost).

### The place map (November 21)

Chris: "a mini map for a more detailed map than the Atlas continent map, a mini map that gives you orientation for
where you are in a location." On all five place pages, every M7 map.

- **Small map**, top left (124 to 150 px, rounded): the place's own painting round the party (the whole place when it
  is small; it stays over the painting at the edges), the party's mark with an arrow for the way the leader faces and a
  faint cone for where the camera looks, the ways out at its edge, N (north stays up). Tap it for the big map.
- **Big map**: the place's name and region (and "indoors"), the whole painting with the ways out named for where they
  lead ("To Mossfall"), doors, stairs, people named (a shopkeeper as "Nell · Nell's Store", in green), chests (closed
  gold, opened grey), Hearthfires (lit orange, cold grey, named), the goal star when the game passes one, the party's
  arrow, a key. Back (44 px) closes it; the walker pauses while it is open. Fits 360 px wide.
- A 2D canvas over the 3D, redrawn about 7 times a second on a timer, nothing added to the 3D (no extra draws).
- `m7/convert.mjs` now gives each place's people their name, role and shop, and each place its `doors`, `stairs` and
  `hearthfires` (`[{ id, name, at, cold }]`); chests keep their ids in `things`. All 60 maps re-converted, 124 ways
  out still check with 0 problems; anchors, exits, people and walk boxes unchanged.
- Check: `m7/check-map.mjs <page> <out> <ids>` (phone size, opens and closes the big map, stills of both).

**For Together**, `world3d/m7/minimap.js` (load it before the page script):

```js
const map = M7_MINIMAP.create({ root, W, place }) // root: element to sit in; W: the walker (W3D.walk); place: W3D_PLACES['m7-<id>']
map.setPlace(place)                // after W.switchTo(...)
map.set({                          // each optional; live marks from the game
  people: ['npc-id', ...],         // who is in the place now (default: everyone in its data)
  chests: { chestId: true },       // opened chests (drawn open)
  goal: { at: [px, py], label } | null, // the story's next goal in this place, in painting px (tile = 50 x 40)
  kindled: ['hearthfire-id', ...], // lit Hearthfires (others drawn cold)
})
map.open(true | false)             // the big map (pauses W while open)
map.hide(true | false)             // hide both: fights, talk, the Atlas
map.isOpen, map.hidden, map.redraw(), map.destroy()
```

Chest ids are the `id` in a place's `things` (`[x, y, 'chest', face, id]`), Hearthfire ids are `hearthfires[].id`,
people are `people[].id` (the game's NPC ids).

## Next

- Waiting for the hub.

- Merged the hub's branch (39fe4ab and on) and rebuilt all four pages with the heroes in Chris's textures; each
  still loads with no errors and is under 16 MB.

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--name=` puts a region's name where the page says "Act One", `--out=` names
  the file, `--paint=0.75` shrinks the game's paintings for a page with many of them. Nothing existing changed.
- Coven's engine (step 4, additive and opt-in, marked "Aethermoor, Places"): `core.js` surfaces can wear the painting
  where they look up (`paint` on a material, `PAINTMAP`) and water can show the painting under its ripples;
  `world.js` passes those through (`extraMats[k].paint`, `place.paintOn` for the engine's own decks and rocks,
  `water[i].paint`), and takes `place.treePatch` and `place.lightTrees` (bigger tree batches, lighter trees).
- Coven's engine (mine to change, additive, marked "Aethermoor, Places"): `core.js` a day sky (`night.day`) and a day sky on
  the water, and molten metal that glows (`waterMat` `emis`); steep ground wears a rock texture instead of the painting stretched down it (`ground.rock`, only when a
  place asks); `world.js` passes `ground.rock` through. Act One asks for neither, so it looks as it did.
- Engine, step 4 life (additive, marked): `core.js` WIND (trees and boughs sway, `place.wind`) and CLOTH (hanging cloth
  sways from its top edge; a material with `cloth: true` and `wind`); `world.js` passes `wind`/`cloth` on extraMats.

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
