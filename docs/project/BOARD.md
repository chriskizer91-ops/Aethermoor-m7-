# The board

Where the 3D game stands. Written by the hub only. Last updated November 20.

## The sessions

| # | Job | Session | Branch | State | Latest link |
|---|---|---|---|---|---|
| 1 | the hub | `session_01DgbUKb6orvjjc1cMgBGPJK` | `claude/brave-davinci-790efm` | running | (the board) |
| 2 | The Fight | `session_01DgbUKYR9qmKyBdACUWGViw` | `job/fight` | step 1 done and brought in (a full fight on Thornhollow's road, to victory or defeat); on Briarmaw, then the spoils | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| 3 | Models | `session_01DgbUKcWh5MEvjHnxzp4HHo` | `job/models` | step 1 done and brought in (the heroes in Chris's textures and faces); step 2 changed: a side-by-side of painted cut-outs from Chris's sheets and the code-built beasts, for Chris to choose | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
| 4 | Places | `session_01DgbUKZVFBfm1dVautXEw5f` | `job/places` | Acts Two and Three done and brought in: all 61 of M7's maps are 3D places; on step 3 (the Atlas, Act One by day) | (see below) |
| 5 | Together | `session_01DgbUKbyjzZFe1BXHHxzHBn` | `job/together` | starting: Act One playable, M7's world engine under the 3D walk | - |
| 6 | One Foe | (starting) | `job/foe-hd` | starting: Briarmaw in full detail, side by side | - |

## What's built (on the hub's branch)

| What | Where | Link |
|---|---|---|
| Act One's 14 places, from M7's own maps and paintings, the party walking as a group | `world3d/m7/` | https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA |
| The Sunscorch's 10 places, by day, in Chris's desert textures | `world3d/m7/` | https://claude.ai/artifact/Awn5YJ761bD7rPyp4AkEdf |
| The Ironspire with the East Road (17 places), in snow, ice, dwarf stone and forge brick | `world3d/m7/` | https://claude.ai/artifact/BPcAuRLL3njp1Q3ZHPTUWQ |
| The Gloomfen (12 places), plank streets on stilts over bog water | `world3d/m7/` | https://claude.ai/artifact/RkoGBME3ANqwAVLnwKLbj8 |
| Act Three: the Keep's galleries and the Hearth Below (stand-in paintings for four until batch 4) | `world3d/m7/` | https://claude.ai/artifact/HMZiN2rDQThhvvsJqwmE56 |
| A fight on Thornhollow's road: M7's battle screen over the 3D, the party on the field, 3D dice | `world3d/battle/`, `world3d/fight.js` | https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK |
| The Verdant Wilds (Coven's zone 1, borrowed), the small and big maps, the 3D continent | `world3d/` | https://claude.ai/artifact/R3Ecr7e1VVbb9Qi7GXEPpx |
| The Gear Room: a hero whose outfit is built from M7's gear, in Chris's 47 textures and the four faces | `prototypes/hero-3d/` | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
| The Bestiary: all 93 foes, first pass | `prototypes/bestiary/` | https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY |
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

- **For Models, from the Fight:** `buildBeast` returning named parts (head, tail, legs) so a beast can turn its head to
  bite; today the whole body leans. Not blocking.

## Next for the hub

- Bring each job's work in as it's ready; tell the jobs on this board when to merge the hub's branch.
- Ask Chris the open calls (`questions.md`).
