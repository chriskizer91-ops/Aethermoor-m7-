# Hearth & Heirloom in 3D

The game itself, in 3D (November 20, the Together job): M7's rules and M7's own screens, played in the 3D places
built from M7's maps (`world3d/m7/`), with the heroes in Chris's textures and the Fight's 3D battles.

Published: (link in `docs/project/slips/together.md`)

## How it plays

- **Walking**: the party walks freely in 3D (drag on the left of the screen, or W A S D; Shift runs). Underneath, M7's
  own world engine (`game/src/rules/world.js`) runs on M7's tile grid (one tile is 2 m): each time the leader steps into
  a new tile, the engine takes one step, and every 400 ms the packs move. Where the engine says no (a person, a shut
  gate, a lock), the leader stops at the edge of their tile, as at a wall.
- **The A button** (Enter, E or Space) talks, opens, reads, rests: whatever stands next to the leader, the way they face.
- **What the engine says happens** plays as it does in the 2D game, with M7's own dialogue box, sheets and cards over
  the 3D: ways out to the next place, sealed roads, gates, locks, chests, signs, talk, Hearthfires (rest, travel).
- **People** stand where M7's maps put them, dressed by the heroes' builder from M7's own looks for them.
- **Packs** roam on the tiles as the engine moves them, with a "!" when they see you. Touching one (or a foe that
  stands guard) starts a fight on that very spot: the Fight's 3D battle (`world3d/battle/`), then M7's own after-fight
  screen (XP, gold, the chests and the card reveal).
- **The menu** (top right, or Esc) is M7's: the Party, the Codex, the Journal, Settings (sound, controls, save codes).

## The save

The 3D game keeps its own save (`aethermoor.save.3d`, with `.bak`), as every milestone does. M7's save
(`aethermoor.save.m7`) is only read: the title offers to bring that party over (its gear, levels and story), and the
2D game's save is never changed. Save codes (Settings) are M7's own `AETH6.` codes, so a journey moves between the 2D
and 3D games either way.

## Files

| File | What |
|---|---|
| `main.js` | the page: the 3D game's own `ctx` (what every M7 screen is handed), the title, the fight hand-off, M7's screens over the 3D |
| `walk.js` | walking with M7's world engine underneath, and M7's world flows (after `game/src/ui/screens/world.js`) |
| `figures.js` | the people and foes standing in a place (the one place to switch the foes' look) |
| `save.js`, `save-codes.js` | the 3D game's own save keys; M7's Settings screen pointed at them |
| `swap.mjs` | build-time swaps (game/ is never edited): the Fight's 3D stage for M7's battle screen, our save for M7's Settings |
| `page.html`, `game3d.css` | the page and its few pieces of its own |
| `build.mjs` | builds the page with `world3d/build.mjs` |
| `tools/play.mjs` | the headless playthrough |

## Build and check

```
cd prototypes/hero-3d && npm install          # three and esbuild, for world3d's builder
ln -s ../prototypes/hero-3d/node_modules world3d/node_modules
node game3d/build.mjs                          # world3d/dist/game3d-act1-512.html (open) and .artifact.html (publish)
NODE_PATH=$(npm root -g) node game3d/tools/play.mjs world3d/dist/game3d-act1-512.html /tmp/g3-play
```

The playthrough: a new journey in the Great Hall, the prologue talk, Sneck the Tallyman fought in 3D and won, out
through the Keep, up the Hearth Road (its road fights won on the way) to Thornhollow, a chest opened, a rest at the
Hearthfire, saved, the page reloaded, and the journey goes on from the same spot.
