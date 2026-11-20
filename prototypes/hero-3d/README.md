# The Gear Room: a hero in 3D

A 3D hero whose outfit is built by the game's own gear code. Open it on a phone or a laptop:
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL

- Pick a hero (Wren, Pip, Bryn, Alondra) and tap a slot. **Roll a new one** rolls an item with the game's own loot
  generator; **Named relic** steps through the Codex relics for that slot; **Temper +1** is Hilda's forge (+7 glows,
  +10 burns white); **Roll a whole outfit** dresses them at once, at any rarity you choose.
- **Swing** plays a move that suits the weapon (a cut, a smash, a thrust, a raised staff, a drawn bow).
  **Shape** switches between a taller storybook hero and a chibi one. **Detail** switches between High and Light. **Pixel look** draws the 3D model in big pixels. Drag to turn the hero round.
- The small picture is the game's own battle sprite in the same gear, so you can see they match.

## How it's made

`model.js` builds the hero from the game's files in `game/src/`, with nothing drawn by hand, and `kit.js` is the
modelling kit it builds with.

- **Who the hero is** comes from `art/hero-looks.js` `HERO_ART`: skin, hair and its style (in locks), eyes (painted
  onto the face), cloak, mantle, tabard, quiver, Alondra's blindfold, Bryn's ears.
- **Each item** becomes the same "look" the pixel heroes draw (`art/item-looks.js` `itemArt` and `lookFor`), made
  with the kit:
  - blades are faceted, with a diamond cross-section, bevels to the edges, a fuller and a point;
  - grips are wound with wire, and guards are curved bars with knobs at the ends;
  - hafts have leather wound round them; axe heads and spearheads thin to their edges;
  - helms, hoods and crowns are turned shapes with face openings, crests, plumes, rivets, points and gems;
  - shields are domed plates with painted heraldry (chevron, quarters, thorns), a rim, rivets and a boss;
  - armour follows the body: mail, stitched leather with studs, plate with a ridge, rolled edges, lames and layered
    shoulder plates, robes that flare to the floor;
  - hands close round what they hold.
- **Every colour** comes from the Forge's palettes (`art/forge.js` `MAT`). The kit gives each kind of material its
  own generated surface: leather grain, cloth weave, chain mail, wood grain, scratched metal. Metals shine, gems
  sparkle, glows give light, and a tempered metal brightens step by step.
- **Two shapes:** "storybook" (a taller hero) and "chibi" (a big head, short sturdy legs and bigger eyes, halfway
  between the storybook hero and the sprite; Chris, November 20: the sprite-shaped one was dropped).
- **Two detail levels:** High (laptops) doubles the segments of every curve (about four times the triangles: 100k to
  200k) and the pixels of every surface picture and the face, and adds stitches on leather and boots, rivets on plate
  and pauldrons, strapped and buckled boots, a belt pouch, etched runes near a fine blade's guard, prongs on gem
  settings and more locks of hair; the picture gets 4x edge smoothing and ambient occlusion (GTAO) and a 4096 shadow
  map. Light (phones, the default on a touch screen) is 25k to 40k triangles. Either way, after each build the pieces
  are joined by material into the parts that move (`bake` in `kit.js`): 35 to 60 draws instead of 90 to 225, and an
  item swap rebuilds in well under a tenth of a second.

`main.js` is the room: the light, the plinth whose rune circle takes the outfit's best rarity colour, the motes of the
weapon's aspect, the swing and its trail, and the panel.

## Build

```
npm install
node build.mjs      # dist/gear-room.html (open it) and dist/gear-room.artifact.html (publish it)
```

Publish `dist/gear-room.artifact.html` to the link above (pass the url) so the link keeps working.
