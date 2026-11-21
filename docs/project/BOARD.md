# The board

Where the 3D game stands. Written by the hub only. Last updated November 20, near midnight.

## The sessions

| # | Job | Session | Branch | State | Latest link |
|---|---|---|---|---|---|
| 1 | the hub | `session_01DgbUKb6orvjjc1cMgBGPJK` | `claude/brave-davinci-790efm` | running | (the board) |
| 2 | The Fight | `session_01DgbUKYR9qmKyBdACUWGViw` | `job/fight` | step 3 nearly done: every Act One fight, indoor cameras, statuses, swallow, guest ally, charm, Legend Strike, Hodge's toll and Twinned splits; the fight page builds again | https://claude.ai/artifact/Q9T8quXCTVgiVUZoMuUaP4 |
| 3 | Models | `session_01DgbUKcWh5MEvjHnxzp4HHo` | `job/models` | swinging gear in; next: the heroes and people at the full-detail foes' level (sculpted detail baked onto every switchable piece) | https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL |
| 4 | Places | `session_01DgbUKZVFBfm1dVautXEw5f` | `job/places` | roofs coloured from the commonest hue in the painting, a hall and its wings sharing one colour; the Hearth Road 99 → 54 draw calls on a phone; all brought in, Act One republished (version 9) | https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA |
| 5 | Together | `session_01DgbUKbyjzZFe1BXHHxzHBn` | `job/together` | Act One playable start to end, with full-detail Briarmaw; **the Sunscorch page** (begin at the Keep's south-east gate, or bring a journey by its save code); next: the Ironspire and the Gloomfen the same way | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj |
| 6 | One Foe | `session_01DgbUKZCNBFY7zwSzwAXR8y` | `job/foe-hd` | the kit in; the briarling made with it (589k sculpt → 16,640); forwarding copies fixed the fight's build; next: glowcap, boglurcher, the willows, the sparks, rockling, Mother Anvil, the wraiths | https://claude.ai/artifact/DorMujhAe9d1XNwLGYV4ae |
| 7 | Foes: beasts | `session_01DgbUKZ4qEpafSazysExsYV` | `job/foes-beasts` | the thornhound brought in (606k sculpt kept as an asset → ~20k); next: onto the kit, then the rotstag, Old Snag, the Mirelord, the rotgrub, the Gloamwing | https://claude.ai/artifact/64Ukg3yQAAb8DWz69xqvxs |
| 8 | Foes: walkers | `session_01DgbUKcTDUjKDVHw3sPhu7R` | `job/foes-walkers` | the Rotwarden (1.07M sculpt → 47,500) and the sapwight (900k → 19,913) done and brought in, sculpts kept as assets; `walkersLook` for the Fight; next: lighter phone copies, then Old Horn and the rest | https://claude.ai/artifact/YBLUHaLG3bNdfcjBdeq3aj |

## What's built (on the hub's branch)

| What | Where | Link |
|---|---|---|
| **The game, the Sunscorch** (the Keep and all ten Sunscorch places) | `game3d/` | https://claude.ai/artifact/7dPEGKka7t1FyHF5SSLPAo |
| **The game: Act One playable start to end in 3D** (prologue, walking with M7's rules, fights and spoils, chests, rest, the party room, the Atlas, the Rotwarden, both Brands, the Council; its own save) | `game3d/` | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj |
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
| Every Act One fight, from M7's own map data (28) | `world3d/battle/` | https://claude.ai/artifact/Q9T8quXCTVgiVUZoMuUaP4 |
| The briarling, the first foe made with the kit (three ways; its sculpt) | `prototypes/foe-hd/foes/briarling/` | https://claude.ai/artifact/DorMujhAe9d1XNwLGYV4ae · https://claude.ai/artifact/LAjxUMG9Aoj2UPw7DuyHtB |
| The beasts in full detail: the thornhound (phone gallery; laptop page with the sculpt) | `prototypes/foe-hd/pages/beasts/` | https://claude.ai/artifact/64Ukg3yQAAb8DWz69xqvxs · https://claude.ai/artifact/8pCvG7xuqHuCcARiUYa9SX |
| The walkers in full detail: the Rotwarden and the sapwight | `prototypes/foe-hd/pages/walkers/` | https://claude.ai/artifact/YBLUHaLG3bNdfcjBdeq3aj |
| The walkers' sculpts, for a laptop | `prototypes/foe-hd/foes/` | https://claude.ai/artifact/JCdvpAPKT781gZiU49jTh2 |
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


- **Pages beyond 16 MB (hub, being tried):** `world3d/build.mjs --files` puts the pictures beside the page as files
  (published with the `files` map in `dist/<name>.files.json`) instead of inside it; the 3D engine accepts them
  (`core.js`, marked "Aethermoor, hub"). Act One with every texture and painting at full size is up as a test:
  https://claude.ai/artifact/HD9GL1Ao4ymzRRodVY2ozm. Once Chris sees it work on his phone, the game and the heavy pages
  can stop shrinking textures.

## Next for the hub

- Bring each job's work in as it's ready; tell the jobs on this board when to merge the hub's branch.
- Ask Chris the open calls (`questions.md`).
