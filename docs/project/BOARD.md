# The board

Where the 3D game stands. Written by the hub only. Last updated November 20, late evening.

## The sessions

| # | Job | Session | Branch | State | Latest link |
|---|---|---|---|---|---|
| 1 | the hub | `session_01DgbUKb6orvjjc1cMgBGPJK` | `claude/brave-davinci-790efm` | running | (the board) |
| 2 | The Fight | `session_01DgbUKYR9qmKyBdACUWGViw` | `job/fight` | step 3 under way: cameras keep a clear line indoors (in); any M7 fight from its own map data (`?enc=`, a Fights list); next: every battle event and status in 3D | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| 3 | Models | `session_01DgbUKcWh5MEvjHnxzp4HHo` | `job/models` | the item audit done and brought in (all 458 items M7 hands out, on their heroes, none flagged; rings, relic pendants, tempered glow fixed); next: capes, hair and gear that swing | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
| 4 | Places | `session_01DgbUKZVFBfm1dVautXEw5f` | `job/places` | step 4 brought in (phones: Act One ~82 draw calls on phone; the paintings on roofs, water, decks, rocks; signposts, chests, pedestals); fixing: roofs over a house's front row show the painted front | https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi |
| 5 | Together | `session_01DgbUKbyjzZFe1BXHHxzHBn` | `job/together` | the spoils, the Party room and the light figures in the game; an end-of-Act-One run (the Rotwarden, the second Brand, home, the Council) being checked before republishing | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj |
| 6 | One Foe | `session_01DgbUKZCNBFY7zwSzwAXR8y` | `job/foe-hd` | Briarmaw finished: a 982,634-triangle sculpt kept as an asset (`prototypes/foe-hd/assets/briarmaw-sculpt.glb`), baked onto 50,090; the sculpt's own laptop page; next: the shared kit, then its lane | https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh |
| 7 | Foes: beasts | `session_01DgbUKZ4qEpafSazysExsYV` | `job/foes-beasts` | starting: the thornhound, then Act One's other beasts, in full detail | - |
| 8 | Foes: walkers | `session_01DgbUKcTDUjKDVHw3sPhu7R` | `job/foes-walkers` | starting: the Rotwarden, then the sapwight, in full detail | - |

## What's built (on the hub's branch)

| What | Where | Link |
|---|---|---|
| **The game: Act One playable in 3D** (title, prologue, walking with M7's rules, fights, chests, rest, the Atlas, its own save) | `game3d/` | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj |
| Act One's 14 places, from M7's own maps and paintings, by day (a Light switch), the party walking as a group | `world3d/m7/` | https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA |
| The Sunscorch's 10 places, by day, in Chris's desert textures | `world3d/m7/` | https://claude.ai/artifact/Awn5YJ761bD7rPyp4AkEdf |
| The Ironspire with the East Road (17 places), in snow, ice, dwarf stone and forge brick | `world3d/m7/` | https://claude.ai/artifact/BPcAuRLL3njp1Q3ZHPTUWQ |
| The Gloomfen (12 places), plank streets on stilts over bog water | `world3d/m7/` | https://claude.ai/artifact/RkoGBME3ANqwAVLnwKLbj8 |
| Act Three: the Keep's galleries and the Hearth Below (stand-in paintings for four until batch 4) | `world3d/m7/` | https://claude.ai/artifact/HMZiN2rDQThhvvsJqwmE56 |
| The Atlas: all of M7's places on the 3D continent, travel by kindled Hearthfires | `world3d/m7/atlas.js` | https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi |
| A fight on Thornhollow's road: M7's battle screen over the 3D, the party on the field, 3D dice | `world3d/battle/`, `world3d/fight.js` | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| The Verdant Wilds (Coven's zone 1, borrowed), the small and big maps, the 3D continent | `world3d/` | https://claude.ai/artifact/R3Ecr7e1VVbb9Qi7GXEPpx |
| The Gear Room: a hero whose outfit is built from M7's gear, in Chris's 47 textures and the four faces | `prototypes/hero-3d/` | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
| Briarmaw three ways: code-built, painted, full detail (baked from a sculpt), with a crowd test | `prototypes/foe-hd/` | https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh |
| Briarmaw's full sculpt (982,634 triangles) beside his light version, for a laptop | `prototypes/foe-hd/` | https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P |
| The Bestiary: all 93 foes; the 54 beasts painted (cut from Chris's sheets) or in 3D (Act One's 12 sculpted), with a switch | `prototypes/bestiary/` | https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY |
| The story on the atlas: M7's places on the map of Aethermoor | `docs/lore/` | https://claude.ai/artifact/XTicYjY9EcZ4V54cjSzJcZ |
| Chris's 136 pictures | `art-in/3d/` | `art-requests/RECEIVED.md` |

## Worth merging into your branch

- **Everyone who shows heroes (the Fight, Together):** the heroes now wear Chris's textures and faces (Models step 1,
  hub commit c76ffcd). They add about 3.3 MB to a page; `world3d/build.mjs --herotex=256` shrinks them for a heavy page.

- **Everyone who touches `world3d/build.mjs`:** merge the hub's branch first (hub commit 39fe4ab joins the hub's
  `--herotex` with Places' `--name`, `--out` and `--paint`).

- **Everyone:** hub commit 77f8eeb has all three first deliveries together (textured heroes, the Sunscorch, the fight)
  and `world3d/build.mjs` with every session's flags (`--herotex`, `--name`, `--out`, `--paint`, `--entry`, `--plugin`).
  Merge it before your next publish.

## Asks between jobs

- Done: `buildBeast` returns named parts (Models' slip lists them); the Fight's `setBeastLook(fn)` takes any foe look
  (`fn(key, sprite, opts) -> { group or g, height, plan?, parts?, update? }`): Models' cut-outs and session 6's
  Briarmaw aim at it. Models' `buildStandee(key, { tall })` (`prototypes/bestiary/standee.js`) gives the painted look in
  that shape (hub commit 7cf1b0c).

- **Townsfolk:** Models' `personFigure(npcId, detail)` (`prototypes/hero-3d/people.js`) has exactly `game3d/figures.js`
  `person()`'s shape: Together switches it in with one import (hub commit 8b91181).
- **Page sizes:** heroes.js grew by 0.6 MB with the townsfolk's looks; the hub's Act One builds with `--herotex=384` and
  the world page with `--tex=448 --herotex=256` to stay under 16 MB.
- **The Atlas on the game page:** its tree and place models (3.8 MB) are left off to stay under 16 MB; Places is making
  lighter copies with its phone work.

- **Light figures (Models, hub d96e11e):** `actor`, `person` and `personFigure` take `'lite'`, `'auto'` and
  `'auto-high'`. Suggested: phones, leader `'auto'`, followers and townsfolk `'lite'`; laptops, leader `'auto-high'`,
  followers `'auto'`. The world page uses it; Places (Act One and the regions), Together and the Fight to switch theirs.

- **The foes, from now:** every beast in full detail (sessions 6, 7, 8; `docs/project/jobs/foes.md`). Models' sculpted
  and painted beasts stand in until each full-detail one lands; Models keeps the heroes and the people.

## Next for the hub

- Bring each job's work in as it's ready; tell the jobs on this board when to merge the hub's branch.
- Ask Chris the open calls (`questions.md`).
