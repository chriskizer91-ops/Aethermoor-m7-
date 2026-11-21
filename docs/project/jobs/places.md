# Job: Places (session 4, branch `job/places`)

Act One's fourteen places are built from M7's own maps and paintings (`world3d/m7/README.md`; published at
https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA). This job does the other 43 the same way, with Chris's regional
textures.

## What to make

**Step 1, Act Two: the Sunscorch, the Ironspire and the Gloomfen.** Convert their maps (`node m7/convert.mjs <ids>` in
`world3d/`; the map list is `game/src/data/maps/index.js`) and teach the converter and `coven/places/m7-kit.js` what
they need:
- Chris's world textures (`art-in/3d/world/`; web copies already in `world3d/coven/texture-packs/aeth-web/`): sandstone,
  adobe, sand, glass flats, awning cloth; dwarf stone, snow, ice, forge brick; old boardwalk, bog water, stilt wood;
  birch boughs, snowy fir boughs, frosted stone. They're painted by day and the borrowed ones by night, so they're
  tinted down to sit together (see how the Keep's are, in `m7-kit.js`).
- Each region's own tiles and biomes (`game/src/data/tiles.js`, the maps' headers, `game/notes/*-P2-maps.md`):
  dunes, canyons, oases, glass flats, mines and deep shafts, snowdrifts and ice, dwarf halls and forges, boardwalks,
  stilt towns, bog and fog, the sunken city and the drowned belfry.
- One page per region (each a claude.ai artifact under 16 MB), and the Act One page kept working.

**Step 2, Act Three: the Hearth Below, and the Keep's galleries.** Molten metal, chains, slag and iron plates are `~`,
`Y`, `k` and `=` in their biomes (`game/src/data/tiles.js` header, `game/notes/M7-P2-maps.md`). Four of these maps have
no painting yet (`hollow-hall`, `ash-stair`, `chained-deep`, `worldforge`: Chris's batch 4 is still to come): until
it comes, lay a stand-in painting drawn from M7's own tile art (`game/src/art/tiles.js`) or plain textures.

**Also wanted, if it fits:** the 2D game is by day, and the borrowed engine lights everything as night. A day (or
dusk) look for M7's places, chosen per place, would suit them; the engine's light is in
`world3d/coven/engine/place/core.js` (`W3D.night`) and `walker.js`.

**Step 3 (from November 20, after Acts Two and Three):**
- **The Atlas**: the 3D continent (`world3d/continent/`, Envoi's map, copied) as M7's atlas: every one of M7's places
  pinned where the story map puts it (`docs/lore/places.json`), the regions under M7's names (`world3d/names.js`), and
  a way for the game to open it and get a choice back (for example `openAtlas({ at, kindled }) -> Promise<placeId |
  null>`, the kindled Hearthfires tappable to travel to). Together will call it. For this step `world3d/continent/` and
  `world3d/names.js` are yours too (changes marked "Aethermoor, Places"; keep `world3d/aethermoor.js` working).
- **Day, dusk or night, per place**: Act One is still lit as night while Act Two is by day. M7 is by day: give Act One
  its day (as the Sunscorch has), with the light chosen per place in its data, and a switch on the pages to compare.
- **Chris's batch 4 paintings**, when they come, go into `art-in/` (never into `game/`); the converter reads them from
  there in place of the stand-ins.

**Step 4 (from November 21): the places come alive.** Every place moves a little, as an HD-2D diorama does, without
costing a phone more than a few draws:
- **Fire and light:** hearths, torches, braziers and lanterns flicker (flame cards, a glow that breathes, a little
  light on the walls near them, faked in the shaders as the places already do); chimneys smoke; forges spark.
- **Water:** rivers flow the way the map runs, falls throw spray, pools ripple, the bog water of the Gloomfen steams.
- **Wind:** trees, grass, banners and hanging cloth sway; leaves drift down in the woods; dust blows on the Sunscorch's
  roads; snow falls in the Ironspire; mist lies low over the fen.
- **Small life:** birds and butterflies by day in the wild places; moths round lanterns; fish rings in still water.
- **One draw per kind** where you can (instanced particles, sway in the vertex shader), and each place's phone draws
  and frame time measured before and after, in your slip. Anything that costs too much on a phone is laptop-only.
- Start with Act One (the Keep, Thornhollow, the Thornway, Mossfall, the Heartroot), then the regions. Republish your
  four region pages; tell the hub when Act One is ready to rebuild.

## What others rely on (keep it working)

- `W3D_PLACES['m7-<id>']` with its `anchors`, `exits` (`to`, `anchor`), `people`, `start`; the walk boxes in
  `MAPS['m7-<id>']` (exactly M7's walkable tiles); one tile = 2 m (50 x 40 painting px). The Fight builds on Act One's
  places, and Together will run M7's world engine on this grid.
- Engine changes stay small, additive and marked "Aethermoor" in a comment, and say so in your slip.

## Your files

- Yours: `world3d/m7/**`, (step 3) `world3d/continent/**` and `world3d/names.js`, `world3d/coven/places/m7-*.js`, `world3d/coven/art/m7/`, `world3d/coven/texture-packs/aeth-web/`,
  `world3d/coven/engine/**` (additive, marked), `world3d/m7places.js`, `world3d/coven/pages/m7-*.html` apart from
  `m7-fight.html`, `docs/project/slips/places.md`. You may add flags to `world3d/build.mjs` (rule 7).
- Others' (read, don't edit): `game/` (frozen), `world3d/heroes.js` and `prototypes/` (Models), `world3d/battle/`
  (Fight), `art-in/`.

## Check, and deliver

- Each page builds and loads headless with no errors (Playwright's Chromium, `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`); a screenshot from above of every place, and a walk through each region's ways out.
- Links in your slip, one per region.
