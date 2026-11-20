# The Gear Room: a hero in 3D

A 3D hero whose outfit is built by the game's own gear code. Open it on a phone or a laptop:
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL

- Pick a hero (Wren, Pip, Bryn, Alondra) and tap a slot. **Roll a new one** rolls an item with the game's own loot
  generator; **Named relic** steps through the Codex relics for that slot; **Temper +1** is Hilda's forge (+7 glows,
  +10 burns white); **Roll a whole outfit** dresses them at once, at any rarity you choose.
- **Swing** plays a move that suits the weapon (a cut, a smash, a thrust, a raised staff, a drawn bow).
  **Pixel look** draws the 3D model in big pixels. Drag to turn the hero round.
- The small picture is the game's own battle sprite in the same gear, so you can see they match.

## How it's made

`model.js` builds the hero from the game's files in `game/src/`, with nothing drawn by hand:

- the body's proportions are the pixel rig's (`art/heroes.js` `BUILD`: head, shoulders, waist, hem, legs, hands);
- who the hero is comes from `art/hero-looks.js` `HERO_ART` (skin, hair and its style, eyes, cloak, mantle, tabard,
  quiver, Alondra's blindfold, Bryn's ears);
- each item becomes the same "look" the pixel heroes draw (`art/item-looks.js` `itemArt` and `lookFor`): a helm's
  shape, crest and plume; armour's kind (mail, leather, plate, robe), trim, pauldrons, sash, studs and runes; a
  sword's blade length and width, guard, fuller and gems; an axe's blade, a hammer's head, a staff's orb, a bow's limbs;
  a shield's shape, rim, boss and paint;
- every colour comes from the Forge's palettes (`art/forge.js` `MAT`): metals shine, gems glint, aspect glows give
  light, and a tempered metal brightens step by step.

`main.js` is the room: the light, the plinth whose rune circle takes the outfit's best rarity colour, the motes of the
weapon's aspect, the swing and its trail, and the panel.

## Build

```
npm install
node build.mjs      # dist/gear-room.html (open it) and dist/gear-room.artifact.html (publish it)
```

Publish `dist/gear-room.artifact.html` to the link above (pass the url) so the link keeps working.
