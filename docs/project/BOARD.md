# The board

Where the 3D game stands. Written by the hub only. Last updated November 20.

## The sessions

| # | Job | Session | Branch | State | Latest link |
|---|---|---|---|---|---|
| 1 | the hub | `session_01DgbUKb6orvjjc1cMgBGPJK` | `claude/brave-davinci-790efm` | running | (the board) |
| 2 | The Fight | `session_01DgbUKYR9qmKyBdACUWGViw` | `job/fight` | step 1 done and brought in; `runFight()` (one call plays a fight, for Together) and `setBeastLook()` (the foes' look switched in one call) in; on Briarmaw, then the spoils | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| 3 | Models | `session_01DgbUKcWh5MEvjHnxzp4HHo` | `job/models` | the comparison is ready and brought in: all 54 beasts as painted cut-outs from Chris's sheets, with a Painted / 3D switch; more 3D reshaping paused until Chris chooses | https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY |
| 4 | Places | `session_01DgbUKZVFBfm1dVautXEw5f` | `job/places` | step 3 done and brought in: the Atlas (M7's places on the 3D continent, travel by kindled Hearthfires: `M7_ATLAS.open`), the light per place (Act One by day), batch 4 read from `art-in/`; next: phones and fidelity to the paintings | https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi |
| 5 | Together | `session_01DgbUKbyjzZFe1BXHHxzHBn` | `job/together` | starting: Act One playable, M7's world engine under the 3D walk | - |
| 6 | One Foe | `session_01DgbUKZCNBFY7zwSzwAXR8y` | `job/foe-hd` | starting: Briarmaw in full detail, side by side | - |

## What's built (on the hub's branch)

| What | Where | Link |
|---|---|---|
| Act One's 14 places, from M7's own maps and paintings, by day (a Light switch), the party walking as a group | `world3d/m7/` | https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA |
| The Sunscorch's 10 places, by day, in Chris's desert textures | `world3d/m7/` | https://claude.ai/artifact/Awn5YJ761bD7rPyp4AkEdf |
| The Ironspire with the East Road (17 places), in snow, ice, dwarf stone and forge brick | `world3d/m7/` | https://claude.ai/artifact/BPcAuRLL3njp1Q3ZHPTUWQ |
| The Gloomfen (12 places), plank streets on stilts over bog water | `world3d/m7/` | https://claude.ai/artifact/RkoGBME3ANqwAVLnwKLbj8 |
| Act Three: the Keep's galleries and the Hearth Below (stand-in paintings for four until batch 4) | `world3d/m7/` | https://claude.ai/artifact/HMZiN2rDQThhvvsJqwmE56 |
| The Atlas: all of M7's places on the 3D continent, travel by kindled Hearthfires | `world3d/m7/atlas.js` | https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi |
| A fight on Thornhollow's road: M7's battle screen over the 3D, the party on the field, 3D dice | `world3d/battle/`, `world3d/fight.js` | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| The Verdant Wilds (Coven's zone 1, borrowed), the small and big maps, the 3D continent | `world3d/` | https://claude.ai/artifact/R3Ecr7e1VVbb9Qi7GXEPpx |
| The Gear Room: a hero whose outfit is built from M7's gear, in Chris's 47 textures and the four faces | `prototypes/hero-3d/` | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
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

## Next for the hub

- Bring each job's work in as it's ready; tell the jobs on this board when to merge the hub's branch.
- Ask Chris the open calls (`questions.md`).
