# Slip: Together (session 5, branch `job/together`)

Last updated November 20.

## Done

- **Step 1, Act One as one game**: https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj (version 2, 14.7 MB; page `game3d/`, built by
  `node game3d/build.mjs`). On the title: Go on, A new journey (M7's own prologue and name screen), or Bring the party
  from the 2D game (M7's save, read only).
  - Walking with M7's world engine underneath: each time the leader crosses into a new 2 m tile, one step in
    `rules/world.js` (`move`); a `tick` every 400 ms without a step (the packs roam). Whatever the engine says no to (a
    person, a shut gate, a lock, a chest) holds the leader at the edge of their tile, like a wall.
  - The engine's events play as M7's world screen plays them, with M7's own dialogue box, sheets and cards over the
    3D: ways out to the next place (all 14 of Act One), sealed roads, road gates and their guards, locks, chests,
    signs, talk, Hearthfires (rest, travel), hazards, the prologue and the story's triggers.
  - The A button (Enter, E, Space) acts on what stands next to the leader, the way they face.
  - People stand where M7's maps put them (only those the story says are there), Models' townsfolk
    (`personFigure`); the one spoken to turns to the party and talks while the land keeps moving behind the box. Standing foes (road guards, Sneck) stand on their tiles. Packs roam as the engine moves them, with a
    "!" when they see you.
  - Fights: contact with a pack, or a foe's card, starts the Fight's `runFight` on that spot; then M7's own
    after-fight screen (XP, gold, the chests and the card reveal). A defeat wakes the party at the Hearthfire.
  - The menu is M7's: Party, Codex, Journal, the Atlas (Places' 3D continent, travel between kindled Hearthfires),
    Settings (sound, controls, save codes: M7's own AETH6 codes, pointed at the 3D game's save at build time).
  - Own save key `aethermoor.save.3d` (and `.bak`, `aethermoor.settings.3d`); M7's `aethermoor.save.m7` is only read
    (Chris's open call 10, the suggestion, easy to switch off: one button on the title).

## Next

- Briarmaw, the spoils and the new creatures as the Fight and Models deliver them (the foes' figures come through
  `game3d/figures.js`, one place to switch).
- Acts Two and Three: a page per region or act from the 47 other places (the 16 MB limit).
- Chests, signs and Hearthfire stands shown as 3D things (today the painting shows them).

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--html=<file>` builds a page kept outside `coven/pages/` (mine is
  `game3d/page.html`). Without it the build is exactly as it was.
- Locally only (not in git): `world3d/node_modules` is a link to `prototypes/hero-3d/node_modules`.

## Needs

- Nothing. (The Atlas carries Places' light tree and place models.)

## For Chris

- Nothing yet.

## Checks

- `cd game && npm test`: 623 pass; `npm run build` leaves `aethermoor-m7.html` unchanged.
- Headless playthrough (`game3d/tools/play.mjs`, Chromium with SwiftShader, phone size), a full run: 15 of 16, no page
  errors. A new journey in the Great Hall, the prologue talk over the 3D, Sneck fought in 3D and won, M7's after-fight
  screen, back walking, the hall's door to the Keep, the north gate to the Hearth Road, seven fights won on the way up
  (the road's five gate guards and two roaming packs), Thornhollow, a rest at its Hearthfire (day 2), saved under
  `aethermoor.save.3d` with M7's key untouched, the page reloaded, "Go on", and the party on the same spot. The one
  miss was the script's chest (Thornhollow's cache is inside the barred stockade, out of reach this early); it now opens
  the first chest it can reach on the road, and a rerun is going.
- Version 2 loads headless with no errors.
- Not checked: a phone's frame rate (headless draws 1 to 4 frames a second in software).
