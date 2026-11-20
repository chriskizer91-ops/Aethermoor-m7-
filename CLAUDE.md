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
- When copying assets or code from another repo, note the source repo and path in the commit message.

## Where things are

- `game/`: the game, as it was at Milestone 7. `game/ARCHITECTURE.md` is the technical contract, and
  `HANDOFF-M7.md` is the last milestone's handoff (written in New-game: its paths are relative to that repo's root,
  which matches this one's for `game/`, `docs/` and `art-requests/`).
- `game/dist/aethermoor-m7.html`: the M7 file Chris got, frozen (a test pins its bytes). A new build is a new file.
- `docs/DESIGN-BRIEF.md`: the game's design. `docs/3d-options.md`: going 3D or upgrading the 2D (November 20).
- `prototypes/`: try-outs that import the real game code. `prototypes/hd2d-world/`: four places as lit 3D
  dioramas (`npm install && node build.mjs` there; published at the link in its README).
- `art-requests/`: picture prompts for Chris. Batch 4 (the four Act III maps) is still waiting.

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
