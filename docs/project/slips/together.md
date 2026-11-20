# Slip: Together (session 5, branch `job/together`)

Last updated November 20.

## Done

- (in progress) **Step 1, the frame**: Act One walked in 3D with M7's world engine running underneath.

## Doing now

- `game3d/`: one page, its own save, M7's rules and screens over the 3D places.
  - Each time the leader crosses into a new 2 m tile, one step in M7's world engine (`rules/world.js` `move`); every
    400 ms without a step, `tick` (the packs roam). Whatever the engine says no to (a person, a shut gate, a lock, a
    chest) holds the leader at the edge of their tile, like a wall.
  - The engine's events are played as M7's world screen plays them, with M7's own dialogue box, sheets and cards over
    the 3D: ways out to the next place, sealed roads, gates, locks, chests, signs, talk, Hearthfires (rest, travel).
  - People stand where M7's maps put them, dressed by the heroes' builder from M7's own looks; packs roam on the tiles
    as the engine moves them, with a "!" when they see you; touching one starts the Fight's 3D fight on that spot, then
    M7's own after-fight screen (XP, gold, chests, the card reveal).
  - Own save key `aethermoor.save.3d` (and `.bak`); M7's save (`aethermoor.save.m7`) is only read, to offer "Bring the
    party from the 2D game" on the title (Chris's open call 10, the suggestion).

## Next

- The headless playthrough (`game3d/tools/play.mjs`): the Keep to Thornhollow, a fight won, a chest, a rest, save and
  reload.
- The Atlas on the 3D continent; Settings with the 3D game's own save codes.
- Briarmaw, the spoils, the creatures as the Fight and Models deliver them.

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--html=<file>` builds a page kept outside `coven/pages/` (mine is
  `game3d/page.html`). Without it the build is exactly as it was.
- Locally only (not in git): `world3d/node_modules` is a link to `prototypes/hero-3d/node_modules`.

## Needs

- Nothing yet.

## For Chris

- Nothing yet.

## Checks

- (to come)
