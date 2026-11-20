# The Bestiary: every foe in 3D

All 93 of M7's foe looks in 3D (November 20, first pass). Published: https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY

- **The 39 people** (cutpurses, bandits, the Tallymen, Tamsin, the Hollow Council...) are built by the heroes' builder
  (`../hero-3d/model.js`) from the very looks their sprites wear (`game/src/art/foes.js` `foeLooks`): their skin, hair,
  clothes and the gear they carry. **The Waking** button re-gears them as the game does.
- **The 54 beasts** are built by `beasts.js`: each family is one of 14 body plans (a four-legged beast, a hulking
  two-legged one, a robed wraith, a scorpion, a serpent or fish, a winged thing, a frog, a mound, a mushroom, a heap of
  stones, a spark, a willow, an anvil, a sapling) with its own parts and size (`BEASTS`), coloured from its own pixel
  sprite (`paletteOf`).
- **Walk** sets them walking. The game's own sprite stands in the corner to compare.

## Build

```
node build.mjs     # dist/bestiary.html and dist/bestiary.artifact.html (needs ../hero-3d/node_modules)
```

## Rough, and next

The beasts are a first pass: recognisable, not yet "epic". The Champions (Briarmaw, Kharzul, Mother Anvil, the
Rime-Abbot, the Lantern-Mother, the Blackwater Leviathan, the Unsmith) want their own hand-shaped parts on top, the
way the relics got theirs, and their relics in their hands (the weapon builder can make them).
