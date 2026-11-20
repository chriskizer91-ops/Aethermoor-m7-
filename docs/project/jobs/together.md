# Job: Together (session 5, branch `job/together`)

A fresh session that puts the pieces together into one playable 3D game. It starts when the hub says (once the Fight
has a full fight and the Models and Places have their first deliveries); until then this brief waits.

## What to make

**One game: Hearth & Heirloom in 3D**, a new milestone in a folder of its own, `game3d/`, with its own save key (the
rule: every milestone keeps its own save; read M7's saves to carry a party over if Chris wants it, never write them).

- **Walking with M7's rules underneath.** The 3D places sit on M7's tile grid (one tile = 2 m). As the party walks
  freely in 3D, each time the leader crosses into a new tile the game takes one step in M7's world engine
  (`game/src/rules/world.js`: `enterMap`, `move`, `tick` every 400 ms, `interact`, `commit`), and plays the events it
  returns (`game/ARCHITECTURE.md`, "World"): exits to the next place, gates, locks, chests, signs, triggers, talk,
  Hearthfires, hazards.
- **Roaming packs in 3D**, moved by the engine's roamers on the tiles (wander, notice, the "!", chase, give up), drawn
  with the Models' creatures and people; contact starts the Fight's 3D fight on the spot (first strike, ambush, caught
  as M7 has them), and the spoils after.
- **People standing in places** (`people` on each place; looks from `game/src/art/` by the heroes' builder), talking
  through M7's own dialogue screens; quests, the journal, the party, the forge and the codex as M7's own screens over the 3D.
- **The Atlas** opens the 3D continent with travel between kindled Hearthfires as M7 allows. The Places job is building
  it as a piece you call (`docs/project/jobs/places.md`, step 3).
- Act One first (the Verdant slice: Briarmaw, the Rotwarden, the two Brands), then Acts Two and Three as the Places
  job delivers them. A page per act if the 16 MB limit needs it.

## Your files

- Yours: `game3d/**` (new), `docs/project/slips/together.md`. You may add flags to `world3d/build.mjs` (rule 7).
- Everything else you import: `game/` (frozen: never edit), `world3d/` (Places, Fight, hub), `prototypes/` (Models).
  Ask the hub for any change in them.

## Check, and deliver

- M7's tests stay green (`cd game && npm test`), and the frozen file still builds byte for byte.
- A headless playthrough script (in `game3d/tools/`) walks from the Keep to Thornhollow, wins a fight, opens a chest,
  rests at a Hearthfire, saves and reloads.
- A link Chris can play on his phone, in your slip.
