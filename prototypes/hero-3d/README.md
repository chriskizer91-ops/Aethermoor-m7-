# The Gear Room: a hero in 3D

A 3D hero whose outfit is built by the game's own gear code. Open it on a phone or a laptop:
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL

- Pick a hero (Wren, Pip, Bryn, Alondra) and tap a slot. **Roll a new one** rolls an item with the game's own loot
  generator; **Named relic** steps through the Codex relics for that slot; **Temper +1** is Hilda's forge (+7 glows,
  +10 burns white); **Roll a whole outfit** dresses them at once, at any rarity you choose.
- **Swing** plays a move that suits the weapon (a cut, a smash, a thrust, a raised staff, a drawn bow).
- **Look** steps the camera to the face, the weapon and the off hand, and back to the whole hero.
- **Party** puts all four heroes on the stage in their own outfits (each keeps what they wear); the panel dresses
  the one picked at the top.
- **Pixels** draws the picture in big pixels; its slider sets the pixel size (1 to 16).
  **High detail** / **Light detail** switches the detail (High is the look; Light is for a phone that struggles). **Pixel look** draws the 3D model in big pixels. Drag to turn the hero round.
- The small picture is the game's own battle sprite in the same gear, so you can see they match.

## How it's made

`model.js` builds the hero from the game's files in `game/src/`, with nothing drawn by hand; `weapons.js` builds the
weapons, shields and focuses; `kit.js` is the modelling kit both build with.

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

## Since November 20 (second pass)

- Chris chose the storybook shape at High detail; the chibi build is still in `model.js` (`build: 'chibi'`) but the
  page no longer offers it.
- Hair knows what is on the head: none under a hood or coif (long hair shows as two locks in the opening), long
  hair falling from under a helm's back rim or a kettle hat's brim, crowns and circlets sitting over the hair.
- The helm is a barbute with a T-shaped opening and a brow ridge; hood and coif trims follow the face opening.
- `weapons.js` gives every named relic its own recipe style: a fang or a tooth (curved bone with a glowing vein), a
  scimitar widening to its tip, oath, hook, thorn, scale and coin guards, coin, knot, hook and claw pommels, ribbons;
  an octagonal hammer head with face plates, straps, a peen, a glowing seam, a maker's mark, glass shards; a bearded
  axe head with a bright edge, a pick crusted with rime; a bell with a sun and a clapper; Fenwick's Poker; a
  runestone in iron claws; Rootsong's roots, finger holes and berries; the cantor's bell and pearl; an antler bow, a
  glass bow, a weeping bow with fronds and tears; a harpoon's barbs and line; shields with a chief, an inscription,
  a wreath, a fire emblem, a door's planks, bands and hinges, woven wicker and hanging charms; lanterns, a censer on
  chains and a chalice that stay upright in the hand.
- Leather wraps are bands laid edge over edge; every fist closes round the grip it holds, thick or thin.
- Stone and glass are materials of their own.
- Measured: one hero 95k to 200k triangles at High; the party of four about 600k in about 230 draws.

## Chris's textures and faces (November 20, Models step 1)

- Every surface comes from Chris's gear texture pack (`art-in/3d/gear/`): `textures/make.py` turns each picture into a
  512 px grey "grain" (seamless, blotches softened), kept in `textures/web/` and `textures/pack.js`. The kit (`kit.js`
  `grainFor`, `triplanar`) tints the grain with the item's own palette colour and lays it on by position from three
  sides, with a small bump from its light and dark. **Textures** on the page switches it off to compare.
- The four heroes wear Chris's painted faces (`model.js` `paintedFace`, `FACE_FIT`), their skin matched to them.
- Closed shapes now always face outward (`loft`): before, tubes were inside out and the far inside wall showed.

## The item audit (November 20)

**Item audit** at the top of the panel: every item M7 can roll or hand out (458: every base at every rarity, every
weapon tempered +7 and +10, the Codex relics, the starters), each on the hero it suits, checked by `audit.js` and shown
as a picture; tap one for a close look. In a console, `__audit.run()` lists anything flagged.
