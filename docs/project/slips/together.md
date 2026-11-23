# Slip: Together (session 5, branch `job/together`)

Last updated November 23.

## Done

## Latest round (November 23): the endings, the foes back, chests, the wraiths, the save-code box

All seven pages republished from builds after the hub's merge (Places' boat fix, the Fight's latest code). Each game
page was checked to start with no errors before it went up; the fight checks below ran on the exact files published.

| Page | Link | Version | Size |
|---|---|---|---|
| Act One | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj | 8 | 15.9 MB |
| Act One, full pictures | https://claude.ai/artifact/9rGvzRh4eocZrz4RYPQLz6 | 5 | 11.8 MB + 186 pictures |
| The Sunscorch | https://claude.ai/artifact/7dPEGKka7t1FyHF5SSLPAo | 4 | 14.0 MB |
| The Ironspire | https://claude.ai/artifact/6jSwPVzbwwZWmmD6VsQ1sU | 3 | 15.1 MB |
| The Gloomfen | https://claude.ai/artifact/N2iCRiMardtJNbntUoXYsA | 3 | 14.7 MB |
| Act Three | https://claude.ai/artifact/U8tPe6ZcZKrYA1o7XJeTjp | 2 | 13.2 MB |
| Act Three, full pictures | https://claude.ai/artifact/28QkrWfL1YqMUnGLki2s5w | 2 | 4.8 MB + 148 pictures |

- **M7's three endings** (`game3d/tools/finale.mjs <page> <rekindle|release|anew> [deep|heart]`): the heart's choice,
  its last word, the ending's card, the credits, the last card, back in the Great Hall, the ending saved under the 3D
  key, M7's key never written. Release 9 of 9 and Kindle Anew 10 of 10 (with its price paid; Kindle Anew is shown shut
  with its three reasons otherwise), no page errors. Rekindle from the foot of the Ash Stair (the chain gate's unmade,
  Tamsin, the forge-warden, the Unsmith's fight): on auto a party at level 24 and at 32 lost the unmade; M7 tunes the
  Hearth Below for about 36.5, so the check now uses 38, as M7's own check does (running).
- **The Rotwarden and the sapwight in full detail** (session 8, after the stretch check). Act One's single page: the
  Heroes' new masters (Models, through the hub) took 1.9 MB, so it carries its two bosses, Briarmaw and the Rotwarden
  (15.9 MB); the sapwight, briarling and glowcap are full detail on the full-pictures page. Checked on the published
  file (`act-end.mjs`, 11 of 11, no page errors): the Rotwarden's fight in full detail, won, Act One complete, the
  Council, saved.
- **The wraiths** (Models' eleven robed foes, `prototypes/wraiths`): first in the full-detail look on every page.
  Checked on the published Gloomfen page (`wraith.mjs`, 3 of 3, no page errors): the drowned on the Long Boardwalk
  fought to a win.
- **Chests with lids** (Places): each chest opens as M7 says, at once when a place is shown, swinging back when opened
  in front of the party. **Hearthfire pillars** have no lantern now (Act One's places; the regions with Places' next
  conversion).
- **Bring a journey by its save code** on every title (open call 10: the hub's suggestion while Chris decides; one
  line switches it off, `CARRY_M7` in `game3d/main.js`, or `?m7=0`). A code from the 2D game's Settings or another 3D
  page: the party with its levels and gear, the 3D save backed up first, M7's key never written. Checked on the built
  Act One page (`codebox.mjs`, 7 of 7, no page errors, at 360 px).

## Latest round (November 21): the place map, live Hearthfires, chests, and Act Three

Every game page now has Places' place map (`world3d/m7/minimap.js`), small in the corner and big at a tap, with M7's
live marks: the people who are there, chests opened or not, Hearthfires lit or cold, and the next goal as a star. It
hides in fights, talk, menus, screens and the Atlas. Hearthfires burn in a bowl on their pillar (lit or cold by M7's
state) and unopened chests glint (`game3d/props.js`). All seven pages republished:

| Page | Link | Version | Size |
|---|---|---|---|
| Act One | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj | 7 | 14.9 MB |
| Act One, full pictures | https://claude.ai/artifact/9rGvzRh4eocZrz4RYPQLz6 | 4 | 7.4 MB + 28 MB of pictures |
| The Sunscorch | https://claude.ai/artifact/7dPEGKka7t1FyHF5SSLPAo | 3 | 13.8 MB |
| The Ironspire | https://claude.ai/artifact/6jSwPVzbwwZWmmD6VsQ1sU | 2 | 15.0 MB |
| The Gloomfen | https://claude.ai/artifact/N2iCRiMardtJNbntUoXYsA | 2 | 14.5 MB |
| Act Three (new) | https://claude.ai/artifact/U8tPe6ZcZKrYA1o7XJeTjp | 1 | 13.0 MB |
| Act Three, full pictures (new) | https://claude.ai/artifact/28QkrWfL1YqMUnGLki2s5w | 1 | 4.7 MB + 16 MB of pictures |

- **Act Three** (`--act=act3`, and `--act=act3 --full --files`): the Keep, its hall and galleries, the Hollow Hall, the
  Ash Stair, the Chained Deep and the Worldforge. "Begin at the Hollow Hall" starts after all of Act Two (level 20).
  Checked (`game3d/tools/region.mjs act3`, and a second run to the Ash Stair): the Council, the Hollow Hall, all four
  hollows won, down the Ash Stair, a rest at Under-coal, saved, no page errors.
- **Full-detail foes, the stretch rule**: only foes whose `stretch.json` passes on every move. Act One's single page
  carries three (Briarmaw, the briarling, the glowcap) to stay under 16 MB; the full-pictures page carries every one
  that passes (the boglurcher too). The region pages carry none yet. Session 8's walkers come in by themselves at the
  next build once they pass.


- **Step 1, Act One as one game**: https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj (version 6, 15.6 MB; page `game3d/`, built by
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
  - The foes' look (`game3d/figures.js`, `?foes=`): `hd` (the default) is full detail where a foe has one (session 6's
    kit: Briarmaw; session 8's phone Rotwarden and sapwight; built from `prototypes/foe-hd/foes/<key>/` by
    `game3d/foes-hd.mjs`) and the sculpted beasts for
    the rest; `hd-cutout` falls back to Chris's painted cut-outs; `3d` and `cutout` are the others alone. Each new
    finished foe comes in by itself at the next build.
  - The Party (menu, Hearthfire) is the Fight's party room: M7's Party screen with the hero turning in 3D.
  - Models' light figures (the leader 'auto', the others 'lite' on a phone) and living faces: everyone blinks, the one
    speaking talks (the leader in the party's own scenes), the party cheers a Brand.
  - The menu is M7's: Party, Codex, Journal, the Atlas (Places' 3D continent, travel between kindled Hearthfires),
    Settings (sound, controls, save codes: M7's own AETH6 codes, pointed at the 3D game's save at build time).
  - Own save key `aethermoor.save.3d` (and `.bak`, `aethermoor.settings.3d`); M7's `aethermoor.save.m7` is only read
    (Chris's open call 10, the suggestion, easy to switch off: one button on the title).

- **The Sunscorch** (Act Two's first region): https://claude.ai/artifact/7dPEGKka7t1FyHF5SSLPAo (13.3 MB; `node game3d/build.mjs
  --act=sunscorch`). The Keep, its Great Hall and all ten Sunscorch places. Pages can't share a save, so its title offers
  "Begin at the Sunscorch" (the journey as Act One leaves it, made by M7's rules: both Brands of the Wilds, the Council
  sat, level 8, at the Keep's south-east gate) or "Bring a journey by its save code" (copy it on the Act One page,
  Settings; paste it here). Checked (`game3d/tools/sunscorch.mjs`, 6 of 6, no page errors): the gate opens onto the Sun
  Road, the road's toll fight won, Sandspire, a rest at its Hearthfire, saved.

- **Act One, full pictures** (beside the safe one, the hub's test of pictures as files): https://claude.ai/artifact/9rGvzRh4eocZrz4RYPQLz6
  (version 2: `node game3d/build.mjs --full --files --out=game3d-act1-full`; publish with
  `world3d/dist/game3d-act1-full.files.json` as the files map). Every place texture and painting at full size (69
  pictures), the heroes whole (their textures, faces and the sculpted masters too: 169 files, 19.5 MB beside the page), the 3D Atlas in, Briarmaw, the Rotwarden and the
  sapwight in full detail; the page itself 8.0 MB.
  Loads with no errors when served over http (opened from disk, a browser refuses the pictures).
- **The Ironspire** (Act Two's second region): https://claude.ai/artifact/6jSwPVzbwwZWmmD6VsQ1sU (14.9 MB; `--act=ironspire`).
  Begins after the Wilds and the Sunscorch (four Brands, the Council sat twice, level 10) at the Keep's east postern.
  Checked (`game3d/tools/region.mjs ironspire`, 5 of 5): the postern to the Old Bridge, on to Drystone Lea, saved.

- **The Gloomfen** (Act Two's third region): https://claude.ai/artifact/N2iCRiMardtJNbntUoXYsA (15.1 MB; `--act=gloomfen`).
  Begins after the Wilds, the Sunscorch and the Ironspire (six Brands, the Council sat three times, level 15) at the
  top of Mossfall's fen stair. Checked (`game3d/tools/region.mjs gloomfen`, 6 of 6, no page errors): down the stair to
  Murkway, the leech ford and the reed-cutters' chain fought and won, on to Willowmurk, a rest at its fire, saved.

## Next

- Briarmaw, the spoils and the new creatures as the Fight and Models deliver them (the foes' figures come through
  `game3d/figures.js`, one place to switch).
- Session 8's walkers and more foes as their stretch checks pass (automatic at the next build), then republish.
- Places' living places as they land.
- Full-detail foes on the region pages, if they fit (or a full-pictures page for each region).

## Changed outside my files

- `world3d/build.mjs` (rule 7, added only): `--html=<file>` builds a page kept outside `coven/pages/` (mine is
  `game3d/page.html`). Without it the build is exactly as it was.
- Locally only (not in git): `world3d/node_modules` is a link to `prototypes/hero-3d/node_modules`.

## Needs

- The Worldforge's heart: the camera behind the party looks at the wall, not the furnace (mine to look at).
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
- Version 6 (and full pictures, version 3): only foes whose stretch check passes on every move are in full detail
  (`stretch.json` in each foe's folder, read by `game3d/foes-hd.mjs`): Briarmaw (re-weighted), the briarling and the
  glowcap. The Rotwarden and the sapwight are back on their stand-in look until session 8 says they pass. Act One's
  place textures at 360 px to keep it at 15.6 MB with the sculpted heroes. Checked: `den.mjs` (Briarmaw's den, his fight
  in full detail, no page errors) and the full-pictures page loading over http with no errors. The region pages carry
  no full-detail foes, so they're unchanged.
- Version 5: the end-of-Act-One run again, 11 of 11, no page errors, with the Rotwarden in full detail (session 8's
  phone version). To fit the three full-detail foes, Act One's page has the heroes' textures at 192 px and the
  paintings at 0.4 (15.6 MB); the hub's pictures-as-files would bring the full sizes back.
- Version 4: Briarmaw's den played in the game (`game3d/tools/den.mjs`): the den, his card, his fight in 3D with him
  in full detail, no page errors. To fit him (about 2 MB), the places' textures are at 400 px and the paintings at half
  size; M7's 2D Atlas screen is left off (the 3D Atlas replaced it).
- Version 3 is what these ran on (the end-of-Act-One run), apart from the main playthrough, which ran just before the
  Party room and the faces came in.
- Not checked: a phone's frame rate (headless draws 1 to 4 frames a second in software).
