# Building the 3D world (November 20, revised the same day)

Chris, November 20: *Hearth & Heirloom* is set on the same continent as Moon Faire and Envoi, in another age or another
telling of it. Aethermoor has already been built in 3D for those games. Reuse their finished world (the continent and
the walking places), leave their witches and their story behind, and put our heroes in it, with **M7's lore, combat,
loot and gear**: the heroes change when they pick up an item, and the item is a real thing they hold.

This page replaces the earlier plan (a kit built from M7's tile maps), which is kept at the end as a fallback.

## What is finished over there, and where

| Piece | Where it lives | State | Size |
|---|---|---|---|
| **The continent in 3D**: Aethermoor's land, sea, mountains, rivers, 47,000 to 96,000 trees, the Keep on its island, every town's buildings, the 21 walking places in miniature, night lighting | `envoi-on-the-longest-night`, `moon-faire-witches/world-map/` (page `envoi-map-where.html`) | Finished (Envoi's step 1). Its own data pictures: height and kind of ground for every 40 m (`art/aethermoor-terrain-*.png`) | 8.6 MB |
| **Walking places in 3D**: Wickhollow, the Thornwood, Bogmire and the fen's heart, the jetty, Io's cottage, on one open land at a third of the map's size, walked between with no fade | `coven-of-the-moon-faire`, `game/engine/`, `game/places/`, `game/data/` (page `zone-1.html`) | Zone 1 built (six places and the land between); zones 2 to 4 not yet | 71 MB as built (textures at full size) |
| **The place engine**: builds a town from its data, lights it, walks someone round it, keeps the camera clear of walls | `coven-of-the-moon-faire/game/engine/place/` | Finished, small (about 4,000 lines) | |
| **Chris's textures** for walls, roofs, cobbles, doors, windows, bark, boughs, water | `coven-of-the-moon-faire/game/texture-packs/made-web/` | Finished | 27 MB at full size |
| The Moon Faire's fair (tents, stalls, wagons) and its fair folk | `coven-of-the-moon-faire/game/fair/`, `game/people/` | Finished | |
| Moon Faire's own open world (the fair and the moor) | `moon-faire`, `game/openworld/` | Finished, but it is the Moon Faire's own place, not the continent | 15 MB |

**Left behind on purpose:** the witches (Io, Kore, Europa, Callisto and their spells), Envoi's and Moon Faire's battle,
story, herbs and talk.

## Does the map line up with M7's?

The paintings differ (M7's Atlas is Chris's older parchment map; the 3D continent was built from his nine-region
atlas), but the land is the same: the Keep on its island in the middle, forest to the west, mountains to the north,
desert to the east and south-east, fen to the south. M7's regions sit on it as they are:

| M7 | On the 3D continent |
|---|---|
| Hearthstone Keep | the castle on the island in the middle |
| The Verdant Wilds (Thornhollow, Eldergrove, Mossfall...) | the western forests (where Envoi's zone 1 is) |
| The Gloomfen (Bogmire, Lanternfen, Misthollow...) | the fen in the south (Envoi's Bogmire and Misthollow are there too) |
| The Ironspire (Ironhold, Frostmere, Peak's Veil...) | the northern mountains (Envoi's Frostmere is there) |
| The Sunscorch (Sandspire, Dusthaven, Scorchgate...) | the eastern desert and red mesas |
| The Hearth Below | under the Keep |

Several places carry the same name in both games already (Bogmire, Frostmere, Eldergrove, Misthollow), because both
come from Chris's D&D Aethermoor. Each of M7's places gets a pin on the continent; where a finished 3D place stands
there, M7 uses it under M7's name and story.

## The proof, built today

`prototypes/aethermoor-walk/` (published: https://claude.ai/artifact/XS24EmSUw1SMkGn4r4AAcE): Coven's Wickhollow and the
land round it, copied in, with **our four heroes** walking it instead of a witch: one leads, three follow in the
leader's footsteps, each in their own gear. *Gear* rolls new outfits for everyone, and they are rebuilt where they stand.

- The borrowed engine is used unchanged. It was written for an older three.js (r128); it runs on ours (0.170) with a
  dozen lines that give it the few old names it uses (`hero-entry.js`). One copy of three.js, one renderer.
- Who walks is ours: the walker asks for `root`, `walkRun` and `animate()`, and the heroes now have a walk and a run.
- Chris's textures are copied in at 1024 pixels (they are 1254), so the page is 8.6 MB and opens from a link on a phone.
- Measured (no graphics card, so speed means nothing here): about 240,000 triangles in the town with the party at phone
  detail.

## The plan, one step at a time (each ends with a link for the phone)

1. **The continent as M7's Atlas.** The 3D continent from Envoi, with M7's places pinned on it and its regions named
   as M7 names them; the Atlas screen and travel use it. No witches, no Envoi names on screen.
2. **Zone 1 as the Verdant Wilds.** Coven's six places and the land between, under M7's names where M7 has a place
   there (Wickhollow's town as Thornhollow, or a new name: Chris's call), with M7's roaming foes and Hearthfires.
3. **The game moves in.** The 3D world replaces M7's flat map view; M7's rules, saves, dialogue, quests, gates and
   fights stay as they are. Fights: M7's battle rules, staged in 3D on the spot where the fight starts. A new milestone,
   M8, with its own save.
4. **The other regions.** Where Coven or Envoi has a finished place (Bogmire, Frostmere, Misthollow...), it comes in;
   where none exists yet (Sandspire, Ironhold, the Keep's halls), it is built with the same engine and Chris's textures.
5. **Size.** A phone link holds 16 MB. The whole world won't fit one link, so each region is its own page (as Coven
   builds a page per zone), or the game goes out as a file for the laptop.

## The game's own places (November 20, evening)

Chris asked whether more 3D places were needed for M7's story: yes. Of the 32 places on the story map, 14 have a
borrowed 3D body; the rest had none. Every M7 map already has a painting and a tile map, and those are enough to build
it: `world3d/m7/convert.mjs` turns one into a place for Coven's engine (the painting is the ground's colour, the tiles
stand up as walls, houses, water, trees, roots and bridges, and the walkable tiles are where the party walks). Act One's
fourteen maps are built and joined door to door: https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA (`world3d/m7/README.md`).

So step 4 changes: every M7 place can have its own 3D version straight from the game. The borrowed places (Coven's
Wickhollow, Envoi's Frostmere...) stay for the open land between them and the continent, where they fit.

## Chris's calls

- **Names**: where a finished 3D place stands where M7 has a different place (Wickhollow in the Verdant Wilds, where M7
  has Thornhollow), which name does it take?
- **The Moon Faire's fair** (tents and stalls): reuse it as a market or a travelling fair in M7's world, or leave it out?
- **Envoi's other places** with no M7 place on their spot (the jetty, the Warm Roads, Dawnroost): new places for M7, or
  left out?

## The earlier plan (fallback)

Build every place from M7's own tile maps with a kit of 3D parts, coloured from each map's painting. It is still the
way to make any place neither game has built yet.
