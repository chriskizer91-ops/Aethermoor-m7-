# Slip: Together (session 5, branch `job/together`)

Last updated November 20.

## Done

- **Step 1, Act One as one game**: https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj (version 3, 14.8 MB; page `game3d/`, built by
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
  - Fights: contact with a pack, or a foe's card, starts the Fight's `runFight` on that spot. Then the spoils on the
    field (`keep: true`): the drops lie as chests where the foes fell, M7's own after-fight screen plays over it, and
    equipping from a card re-dresses that hero there and then. A defeat wakes the party at the Hearthfire.
  - The Party (menu, Hearthfire) is the Fight's party room: M7's Party screen with the hero turning in 3D.
  - Models' light figures (the leader 'auto', the others 'lite' on a phone) and living faces: everyone blinks, the one
    speaking talks (the leader in the party's own scenes), the party cheers a Brand.
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

- The Fight: indoors (Sneck's fight in the Great Hall), `arena.spoilsView()` puts the camera behind the hall's wall, so
  the spoils' field is hidden by stone (the after-fight screen itself is fine). Outdoors it's as on the Fight's page.

## For Chris

- Nothing yet.

## Checks

- `cd game && npm test`: 623 pass; `npm run build` leaves `aethermoor-m7.html` unchanged.
- **The playthrough** (`game3d/tools/play.mjs`, the brief's): 16 of 16, no page errors. A new journey in the Great
  Hall, the prologue talk over the 3D, Sneck fought in 3D and won, the spoils (M7's after-fight over the field), the
  hall's door to the Keep, the north gate to the Hearth Road, six fights won on the way up (the road's gate guards and
  roaming packs), the ditch chest opened, Thornhollow, a rest at its Hearthfire (day 2), saved under
  `aethermoor.save.3d` with M7's key never written, the page reloaded, "Go on", the party on the same spot. (55 minutes
  headless.)
- **The end of Act One** (`game3d/tools/act-end.mjs`): 11 of 11, no page errors. From a journey made with M7's rules
  (Briarmaw's Brand won, the party at level 10 in the Heartroot's depths): "Go on", the Rotwarden fought in 3D and won,
  the second Brand, Act One complete, back up the roots, the Last Green Coal's Hearthfire home to the Great Hall, the
  Council sits, saved with both Brands, the menu's Party with the hero in 3D, and back. (17 minutes headless.)
- Version 3 is what these ran on (the end-of-Act-One run), apart from the main playthrough, which ran just before the
  Party room and the faces came in.
- Not checked: a phone's frame rate (headless draws 1 to 4 frames a second in software).
