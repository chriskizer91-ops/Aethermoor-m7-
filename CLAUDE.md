# CLAUDE.md

*Aethermoor: Hearth & Heirloom*, the pixel JRPG of stolen legends, from Milestone 7 on.

## Repository rules

- This is the only repository to write to for this game.
- Every other repository of Chris's is a read-only reference. Reuse their textures, models, mechanics and code
  when useful, but never commit to them. The useful ones:
  - `chriskizer91-ops/New-game`: where M2 to M7 were built (branch `claude/cool-ptolemy-uc93gg`), with the raw
    paintings in `art-in/` and the frozen M2 to M6 files in `game/dist/`.
  - `chriskizer91-ops/brightvein`: an HD-2D game (a lit 3D diorama with pixel people standing in it), with painted
    ground and building textures in `assets/claim/`.
  - `chriskizer91-ops/airship-game-in-aethermoor-`: three.js ships and the map of Aethermoor from above.
  - `chriskizer91-ops/envoi-on-the-longest-night`: 3D models, texture packs (`moon-faire-witches/texture-packs/`).
  - `chriskizer91-ops/20-min`: keeps `reference/aethermoor-m7.zip` and a copy of this game's rules.
  - `chriskizer91-ops/coven-of-the-moon-faire`: the finished 3D walking places of Aethermoor (zone 1) and their engine
    (`game/engine/`, `game/places/`), and Chris's building textures. `envoi-on-the-longest-night`
    `moon-faire-witches/world-map/`: the whole continent in 3D.
- Chris, November 20: this game is set on the same continent as Moon Faire and Envoi. Reuse their finished 3D world
  (never their witches, battle or story); keep M7's lore, combat, loot and gear. Plan: `docs/3d-world-plan.md`.
- When copying assets or code from another repo, note the source repo and path in the commit message.

## Where things are

- `game/`: the game, as it was at Milestone 7. `game/ARCHITECTURE.md` is the technical contract, and
  `HANDOFF-M7.md` is the last milestone's handoff (written in New-game: its paths are relative to that repo's root,
  which matches this one's for `game/`, `docs/` and `art-requests/`).
- `game/dist/aethermoor-m7.html`: the M7 file Chris got, frozen (a test pins its bytes). A new build is a new file.
- `docs/DESIGN-BRIEF.md`: the game's design. `docs/3d-options.md`: going 3D or upgrading the 2D (November 20).
  `docs/3d-world-plan.md`: how to build the 3D world for the heroes (November 20).
- `docs/lore/`: M7's story set on the atlas of Aethermoor (places, what happens, which 3D place serves, what changed;
  the story map page, link in its README). `world3d/names.js` follows it.
- `prototypes/`: try-outs that import the real game code. `prototypes/hd2d-world/`: four places as lit 3D
  dioramas (`npm install && node build.mjs` there; published at the link in its README).
  `prototypes/hero-3d/`: the Gear Room, a 3D hero whose outfit is built from the game's own gear code (same build;
  link in its README).
  `prototypes/aethermoor-walk/`: the party walking Coven's Wickhollow (`node build.mjs`; `world/` holds the copied
  engine, places and downsized textures, unchanged; `hero-entry.js` joins our heroes and three.js to it).
- `world3d/`: **the 3D world**: Coven's zone 1 and Envoi's 3D continent, copied in, with our party, the small and big
  maps and the continent (`node build.mjs --tex=512` there; link and sources in its README).
- `world3d/m7/`: **the game's own places in 3D**, each built from its M7 map and painting (`node m7/convert.mjs <ids>`,
  then `node build.mjs --page=m7-places --places=<ids>`; Act One is published, link in its README).
- `prototypes/bestiary/`: all 93 foes in 3D (people by the hero builder, beasts by `beasts.js`; link in its README).
- `art-requests/`: picture prompts for Chris, gathered in one page, `aethermoor-art-requests.html` (built by
  `build_requests.py`). Chris sent all 136 back on November 20 (`RECEIVED.md`); `take_in.py <zips>` files a zip into
  `art-in/3d/` (gear, skins, model sheets, world; README there). Batch 4 (the four Act III maps) is still waiting.
- `docs/3d-game-plan.md`: M7's battle, loot and levelling in 3D, a milestone at a time (3D-1 "The Fight" first).
- Chris's choices for the 3D heroes (November 20): the storybook shape at High detail only; item surfaces come
  from a texture pack, not pictures printed on the models.

## The game's rules (from New-game, still in force)

- Layers: `ui → art/rules → data/core`. `rules/` and `data/` stay pure: no DOM, `Math.random` or `Date`.
- Saves are sacred. Every milestone keeps its own save key and file. Never write an earlier milestone's key.
- The approved battle look (`art/heroes.js`, `art/hero-looks.js`) and the card reveal are frozen.
- Tap targets at least 44 px, designed at 360 px wide first, no horizontal scroll.
- Never weaken, skip or delete a test to get green.

## Checking a change

```
cd game
npm install
npm test            # 623 tests
npm run build       # dist/aethermoor.html (rebuilds aethermoor-m7.html byte for byte)
```

E2E tests: `NODE_PATH=$(npm root -g) node tools/e2e-world.mjs` (and `e2e-flow`, `e2e-battle`, `e2e-codes`).

## Chris

- Chris tries things on his phone. Every step should end with something he can open there. A claude.ai page
  holds 16 MB; the full game with its paintings is 31 MB, so a phone page needs lighter paintings.
- Write anything Chris reads in plain words.
- When new art is needed, write the picture prompts as markdown in `art-requests/` and send him the file.
