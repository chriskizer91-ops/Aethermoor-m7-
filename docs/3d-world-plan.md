# Building the 3D world (November 20)

The heroes are now full 3D models whose every item is built from the game's own numbers. The world they run
around in has to match them. This is how I'd build it, and the calls that are Chris's.

## What we have to work with

- **60 maps**, each already described in data: a grid of tiles saying where the grass, roads, water, walls, roofs,
  trees, fences, cliffs and doors are, plus where the people, chests, gates and Hearthfires stand
  (`game/src/data/maps/`). The game's rules (walking, talking, gates, fights) all run on that grid.
- **57 of them have a painting** (`game/src/ui/assets/paint/`), the look Chris chose for each place.
- **The first 3D try-out** (`prototypes/hd2d-world/`) stood four of those maps up from their paintings: the
  painting as the ground, houses raised from the roof and wall rows. It worked, but painted houses next to full 3D
  heroes won't match any more.

## Three ways

1. **Raise the paintings** (the first try-out, pushed further). Cheap, keeps every painting exactly. But the
   buildings stay flat pictures folded into boxes, and the 3D heroes would look pasted on.
2. **Build every place by hand in 3D.** The best possible look, but 60 maps by hand is months, and every change
   to a map means rebuilding it.
3. **Build the world from the map data, the way the gear is built** (recommended). A kit of 3D parts (cottages,
   timber walls, roofs of slate or thatch, palisades, cobbles, trees, rocks, bridges, water, cliffs) put together
   automatically from each map's tile grid. Every map comes out at once, and a map that changes rebuilds itself.
   The painting isn't thrown away: it gives each place its colours (the code samples it for roof, wall and grass
   colours), so Thornhollow still looks like Chris's Thornhollow, and the big places (the Keep, the Worldforge)
   get hand-made pieces on top, like the relics do.

## How option 3 would go, one step at a time (each ends with a link for the phone)

1. **Thornhollow, built from its grid, with the party walking in it.** The kit's first parts: ground (grass, road,
   cobbles), cottages from the roof and wall rows (doors and windows where the grid has them), the palisade, trees,
   the hearth. The four heroes follow the leader as in the game. Morning, dusk and night.
2. **The road out**: the Hearth Road (forest, a river, a bridge, the first gates and roaming foes as 3D figures).
3. **The kit for each region**: the desert towns of the Sunscorch, the stone halls and snow of the Ironspire, the
   marsh boardwalks of the Gloomfen, the Hearth Below. Then all 60 maps, checked one by one.
4. **The game itself moves in**: the 3D world replaces the flat map view (`game/src/ui/world/view.js`), with the
   rules, saves and dialogue untouched. A new milestone, M8, with its own save, as always.
5. **Fights in 3D**: on the same spot of the same map, the party facing the foes.

## Keeping it fast with four heroes on screen

All four heroes at High detail are about 600,000 triangles (the Gear Room's Party button shows it live). That's
fine on a laptop. For the world, and for phones:

- the hero you control gets High detail; the three following get a lighter build, and anyone far away lighter still
  (the models are built by code, so each can be built at any detail);
- trees, rocks and fence posts are drawn many at a time from one shape each;
- the lighting of houses and ground is worked out once when a map loads, not every frame;
- a phone gets the Light detail setting.

## A texture pack for the world, later

Like the gear's pack (`art-requests/texture-pack-gear.md`): seamless squares of grass, road, cobbles, thatch,
slate, plaster, timber, sand, snow, mud, water. Written when step 1 shows what's needed.

## Chris's calls

- **The camera**: high and three-quarters, like the game and the first try-out, or lower and closer behind the
  party?
- **The paintings**: keep each map's painting as its colour guide (recommended), or let each region's kit set the
  colours?
- **Order**: the world first, or the post-game story first?
