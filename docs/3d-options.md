# Going 3D, or upgrading the 2D (November 20)

Chris asked whether to make *Hearth & Heirloom* 3D, or just upgrade it. Here's what the game is now, three ways to go,
and what I'd do.

## Where the game stands (M7)

- A finished story: three acts, 60 maps, 75 relics, about 450 lines of dialogue, three endings. 623 tests pass.
- The look: painted maps seen from above, with pixel people walking on them; fights on a painted stage with big pixel
  heroes and foes; the item cards.
- The file is 31 MB, and 28 MB of that is the paintings. A claude.ai page holds 16 MB, so Chris can't play M7 from a
  link on his phone yet (an iPhone won't run it from the Files app either).

## Three ways to go

### 1. Full 3D (new models for everything)

Every place, person and monster made as a 3D model, like the airship game's ships or Envoi's Witch.

- Good: it's the biggest change you could see.
- Bad: it throws away the paintings, the pixel heroes and the battle look Chris approved, and every one of the 60 maps
  and 57 kinds of foe needs making again. Months of work before it is as full as M7 is now. Phones struggle with
  many 3D models at once.

### 2. HD-2D: the paintings and pixel people, stood up in a lit 3D world (recommended)

The look of games like *Octopath Traveler*, and of Brightvein. The ground stays Chris's painting. The houses rise out
of it, their walls and roofs cut from the same painting. The pixel people stand up as cards in the light and cast
shadows. Then real light: morning, dusk and night, firelight, rippling water, a soft blur at the edges of the view.

- Good: everything Chris made stays. It works on all 60 maps from the data they already have (the try-out builds
  four places with no hand work). The rules, story, saves and fights don't change. Phones run it.
- Bad: trees and odd shapes (towers, cliffs) want more care than the try-out gives them. The fights would want their
  own pass later (a lit 3D stage behind the same pixel heroes).
- **Try it:** https://claude.ai/artifact/3Y49AxoaxyY1ug2ht6EkSq (`prototypes/hd2d-world/`).

### 3. Upgrade the 2D (no 3D)

Keep the flat look and polish it: light and shadow painted over the maps, weather, day and night, better effects in
fights, and a lighter copy of the paintings so the whole game fits on a phone link.

- Good: the least risk, and quick.
- Bad: it still looks like M7. Most of these things come with option 2 anyway.

## What I'd do

Option 2, in steps, each one something Chris can open on his phone:

1. **The walking world in HD-2D.** Swap the map view (`game/src/ui/world/view.js`) for the 3D one, keeping talking,
   gates, roaming packs and saves as they are. Better trees and towers. A lighter copy of the paintings, so the game
   fits in 16 MB and gets its own phone link. Delivered as M8, with its own save, as every milestone has been.
2. **The fights.** A lit 3D stage built from each fight's backdrop, the same pixel heroes and foes, with light from
   the spells and relics.
3. **The post-game** that M7 left for next (the Heat ladder, the rematches, the Emberless Reach), built in the new look.

Chris's own call: which way to go, and whether the post-game comes before or after.
