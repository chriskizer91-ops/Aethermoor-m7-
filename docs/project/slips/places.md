# Slip: Places (session 4, branch `job/places`)

## Done

- **The Sunscorch** (all ten: the Sun Road, Sandspire, the Dust Trail, Dusthaven, the Deep Shaft, the Glass Heart, the
  Glass Flats, Miragewell, the Scorchgate Ruins and Vaults), by day, from M7's maps and paintings:
  https://claude.ai/artifact/Awn5YJ761bD7rPyp4AkEdf (7.6 MB). What's new in them:
  - Cliffs, scarps, mesas and a mine's rock walls rise out of the ground (thick runs of `^`, and `R` in a mine), with
    rock wrapped round their faces; dune crests are soft sand humps; a lone `^` is a boulder as before.
  - Chris's sand, sandstone, adobe, awning canvas and glass flats; flat adobe roofs, terracotta roofs and striped
    awnings and tents by the painting's roof colour.
  - Palms (Sandspire, Miragewell), cacti (the Sun Road), crystal spires (the Glass Heart), glass spires (the Flats),
    dead trees, a mine's props, columns; jars, shrubs, carts, crystal clusters, glass shards, stumps, urns; glowing
    sunstone veins, crystals and embers.
  - Day light and a blue sky (the mines and the vaults stay dark).

- **The Ironspire** (all seventeen, with the East Road): https://claude.ai/artifact/BPcAuRLL3njp1Q3ZHPTUWQ (9.4 MB). Snow
  and frosted crags rising from the ground, Chris's dwarf stone, forge brick, ice and snow; the monastery in pale stone,
  the Tallymen's canvas tents, frost-dead trees, carved kings on the Iron Stair, anvils in the forges, ice columns
  Beneath Frostmere; the halls and forges lit by their fires, the rest by a cold day.
- **The Gloomfen** (all twelve): https://claude.ai/artifact/RkoGBME3ANqwAVLnwKLbj8 (8.0 MB). Bogmire's plank streets and
  the piers stand on stilts over Chris's bog water; waist-high rails, lanterns on poles, reeds, a green mist by day;
  the Mother's Hollow and the drowned belfry by night.
- Act Two is done: one page per region, every place built.

## Next

- Step 2: Act Three (the Hearth Below's four maps, with stand-in paintings until Chris's batch 4) and the Keep's
  three galleries.

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--name=` puts a region's name where the page says "Act One", `--out=` names
  the file, `--paint=0.75` shrinks the game's paintings for a page with many of them. Nothing existing changed.
- Coven's engine (mine to change, additive, marked "Aethermoor, Places"): `core.js` a day sky (`night.day`) and a day sky on
  the water; steep ground wears a rock texture instead of the painting stretched down it (`ground.rock`, only when a
  place asks); `world.js` passes `ground.rock` through. Act One asks for neither, so it looks as it did.

## Needs

- Nothing.

## For Chris

- Nothing yet.

## Checks

- Each page loads headless (Chromium, SwiftShader) with no errors; a still from above, one from the walk and one from
  high behind for every place (`world3d/m7/check.mjs`, kept in `world3d/.cache/shots/`).
- Every way out taken in the page, each landing at its anchor on walkable ground: the Sunscorch 19, the Ironspire 32,
  the Gloomfen 22 (the few left lead to Act One's places, on their own page; checked from the data)
  (`EXITS=1 node m7/check.mjs ...`); `node m7/exits.mjs` checks the same from the data.
- Act One rebuilt (11.6 MB at `--tex=768`) and all 14 places load with no errors; its place files unchanged apart from
  a `dark` flag on the two dark maps. Anchors, exits, people and walk boxes untouched.
- Not checked: a phone's frame rate.
