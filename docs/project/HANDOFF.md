# Handoff: the hub, November 24 (evening)

For a fresh conversation taking over as the hub (the orchestrator) of *Aethermoor: Hearth & Heirloom* in 3D. Chris asked
on November 24 for every session to stop at a good point and be refreshed, to cut down on usage. Read this first, then
`CLAUDE.md`, `docs/project/README.md` (the rules), `BOARD.md`, `decisions.md` and `questions.md`.

The hub's branch is `claude/brave-davinci-790efm`. Everything the eight sessions made is merged into it.

## Where the game stands

- **The game plays M7 in 3D from the prologue to all three endings**, on five region pages: Act One, the Sunscorch, the
  Ironspire, the Gloomfen and Act Three. Each comes as a single file (under 16 MB) and as a full-pictures page (every
  picture at full size, as files beside the page). Chris opened every one on his phone on November 24 and marked each
  "works", the full-pictures ones too.
- **All three endings pass on built pages** with M7's own late-game party: Rekindle 12/12, Release 9/9, Kindle Anew
  10/10 (`game3d/tools/finale.mjs`). A lost fight sends the party where M7 does; saves land on the place's own ground.
- **Fights happen in arenas that look like the land** (Chris, November 24): eighteen open sets by Places, with a fade in
  and out; the spoils land back where the party stood; water foes fight on the spot; `?arena=0` keeps every fight on
  the spot. Every stand in all 94 fights is on clear floor; every big foe stays in shot on every move.
- **All 93 foes are in full detail** (sculpted at 0.5 to 1.9 million triangles, kept to look at, baked to 20k to 50k for
  the game), each passing the stretch check on every move. After Chris's playtest, the eleven wraiths (session 8) and
  the ten iron and forge foes (session 6) were rebuilt in full detail; the winged flap at one beat a second or slower.
- **The heroes** wear Chris's textures and faces; the Gear Room's panels fold away on a phone.
- **The places**: every M7 map in 3D, alive (wind, water, cloth), with set dressing, a place map in the corner, and the
  Atlas on the 3D continent. M7's Mother's Hollow reads "the fen's dark heart" (Chris's call).
- **M7 is untouched**: `game/` unchanged, its 623 tests pass, its save key never written. The 3D game keeps its own
  save, and reads an M7 save code to start from (Chris: yes, read only).
- **Not yet done**: see "What's left to a finished game" below.

## First thing to do: check the publishes that were waiting

The account's daily limit of **200 published pages** ran out at about 19:20 UTC on November 24 and resets at midnight
UTC. These were built, pushed, and scheduled to publish at about 00:10 UTC by the old sessions:

| What | Who scheduled it | Links (same as before) |
|---|---|---|
| The ten fight pages, with the arena checks' fixes (camera height coming back, foe kept in frame) | the Fight | the fight pages below |
| The four wraiths pages (the act labels fixed, the mirage-wisp, the wisp-queen) | session 8 | the wraiths pages below |
| The game pages that change with the last four wraiths (the Rime-Abbot, the Lantern Mother, the mirage-wisp, the wisp-queen) and the Fight's `arena.js` fix | Together | the game pages below |

Check each went up (read it with the Artifact tool, or look at the session's last result with `list_events`). If one
didn't, rebuild it from the hub's branch with the commands in that job's slip ("Handoff (November 24)" section) and
publish to the same link (pass `url`). Then archive the old sessions.

## The links

Game pages (single file · full pictures):

| Region | Single file | Full pictures |
|---|---|---|
| Act One | https://claude.ai/artifact/RaeSK5hezqb3qH7jmuM5aj | https://claude.ai/artifact/9rGvzRh4eocZrz4RYPQLz6 |
| The Sunscorch | https://claude.ai/artifact/7dPEGKka7t1FyHF5SSLPAo | https://claude.ai/artifact/38JaigTBGjp1FiT4MHdVFh |
| The Ironspire | https://claude.ai/artifact/6jSwPVzbwwZWmmD6VsQ1sU | https://claude.ai/artifact/AC9dw4TH9VqT4P3UcarVLp |
| The Gloomfen | https://claude.ai/artifact/N2iCRiMardtJNbntUoXYsA | https://claude.ai/artifact/7f9UFQ93Dk1esA6ju6u8hL |
| Act Three | https://claude.ai/artifact/U8tPe6ZcZKrYA1o7XJeTjp | https://claude.ai/artifact/28QkrWfL1YqMUnGLki2s5w |

Fight pages: main https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK · Act One A
https://claude.ai/artifact/Q9T8quXCTVgiVUZoMuUaP4 · Act One B https://claude.ai/artifact/7Prqphh2mubkp2L2hTn2ZA · events
https://claude.ai/artifact/RLrMg73EPUxGCHRaQXfAZS · Act Two https://claude.ai/artifact/AqSBbi7gYeRogHPsq24nAk · the
Sunscorch https://claude.ai/artifact/TWtn8x7hcGjTMHAUpAWC5M · the Ironspire A https://claude.ai/artifact/WhydqjmyNvuGQdrSadEXKD
and B https://claude.ai/artifact/EGV6SV4zR9EwXS2bB8m4g6 · the Gloomfen https://claude.ai/artifact/GGPe1k5K6g54kaUb49Y3bt ·
Act Three https://claude.ai/artifact/5vCvi2woYF3WZVGNAKSLQf

Chris's playtest page (his marks and notes are in its store: `checks` and `calls`; read them with `ArtifactData`
`list`): https://claude.ai/artifact/7BNj1rvFhus7KaBVYbGnxQ. Its source is `docs/project/pages/playtest.html`; update its
items for his next pass (the arenas, the polished foes) and republish it to the same link.

The foes: wraiths 1 https://claude.ai/artifact/CFyNjDe1jeuSKytxKdfiVM, 2 https://claude.ai/artifact/6qxqnJRLVEcJXtaqT21Hkw,
3 https://claude.ai/artifact/BfKMgJSha56yyZxXXfLaSF, 4 https://claude.ai/artifact/CHSRA2BHE8GmwQiBYmtPPF · iron and forge
(the ten pages link to each other) https://claude.ai/artifact/EzhJdoL53KTeUPUfHc2yyN · the winged
https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg · the beasts https://claude.ai/artifact/64Ukg3yQAAb8DWz69xqvxs · the
walkers https://claude.ai/artifact/YBLUHaLG3bNdfcjBdeq3aj · the Leviathan https://claude.ai/artifact/3Px9mipuqrTBB8NFfehbj5 ·
every other foe's page is on the board.

The heroes (Gear Room): https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL · the arenas:
https://claude.ai/artifact/VCCwofQnbEaDBN5SwsowAW · Act One's places (the hub publishes this one):
https://claude.ai/artifact/GBxRVSqwMwYUTy1xLNjATA · the Atlas https://claude.ai/artifact/MXyu3A9zTjoCavHFKXCbpi · the story
map https://claude.ai/artifact/XTicYjY9EcZ4V54cjSzJcZ.

## What's left to a finished game

In the order the hub would take them. Each ends with something Chris can open on his phone.

1. **One game, one link.** Today the game is five region pages, and a journey moves between them by save code. Chris's
   phone opens the full-pictures pages, so the whole game can be one full-pictures page (a claude.ai page can carry up
   to 256 MB of files beside it, 16 MB a file): prologue to ending without leaving the page, one save. The work: load
   each region's places, pictures and foes when the party travels there rather than all at the start (phone memory),
   a loading card between regions, and every full-detail foe in. Together builds it (`game3d/build.mjs`), Places helps
   with loading places on demand. Keep the five region pages until the one page is proven.
2. **A whole playthrough on that page**, start to finish: the act-end and finale checks Together already has
   (`game3d/tools/act-end.mjs`, `finale.mjs`, `fight.mjs`, `den.mjs`), chained across the acts, then all three endings.
3. **The Hearth Below's four paintings (batch 4)**, Chris's to make: the prompts are in `art-requests/batch-4.md`.
   Today Act Three's four deep places use stand-in paintings. When he sends them: `take_in.py`, then Places converts the
   four places, then Together rebuilds and runs `finale.mjs`.
4. **Chris's phone pass**: how smooth each region is (headless tests draw only 1 to 4 frames a second, so only his phone
   can tell), how long a page takes to open, the arenas, and the polished foes. Route his notes to the job that owns
   each thing, as on November 24.
5. **Known polish, each small**: the Bellows' body is more segmented than its sheet's one-piece suit; Grandfather
   Willow's roots are smoother than his painting; the Rotwarden's tasset (a curved plate) and a thin root at his left
   hip that lags; the thornhound's fur, face markings and teeth; moments (cameras) for the veteran foes' big moves
   (the forge-warden, the overseer, the unmade); bigger hit effects on the heroes at phone size. Ask Chris which matter.
6. **The release**: when Chris is happy, freeze the finished build as its own file with its own name, as M7 did
   (`game/dist/aethermoor-m7.html` is pinned by a test), keep its save key, and write a short handoff and a README for
   Chris. One open call is left for him then: the place map's corner (top-left, north up, suggested).

Not needed for a finished game, only if Chris asks: more Champions' moments, Mooncart (his phone console) carrying the
3D game, a post-game.

## How the hub works

- **Bring a job's work in**: `git fetch origin job/<name>`; check it only touches its own files (its brief lists them);
  `git merge --no-ff origin/job/<name>`; never edit `game/`.
- **Check after every merge** (from the repo root):
  - `cd game && npm test`: 623 pass. `git diff --quiet HEAD~1 HEAD -- game/`: unchanged.
  - A fight page: `cd world3d && FIGHT_HD=briarmaw,briarling,glowcap,boglurcher node build.mjs --page=m7-fight
    --places=thornhollow,briarmaw-den,arena-road-wood,arena-thorns --tex=768 --herotex=256 --entry=fight.js
    --plugin=battle/swap.mjs --out=m7-fight-hub`, then load it with `?go=1`.
  - The game: `node game3d/build.mjs --out=game3d-act1-hub` (Act One, `?new=1`) and
    `node game3d/build.mjs --act=ironspire --out=game3d-ironspire-hub` (`?act2=1`).
  - Load each with `docs/project/tools/loadcheck.mjs` (from `world3d/dist`, `NODE_PATH=$(npm root -g)`): it waits for
    the place and its people, at phone size, and lists console errors. A page that merely starts is not enough: a fault
    in the robes at Lite detail only showed once the Ironspire's townsfolk stood up.
  - A new foe: its `prototypes/foe-hd/foes/<key>/stretch.json` has `ok: true` on every move (the game and the fights
    take only foes that pass).
- **The board**: update `BOARD.md` after each merge; Chris's decisions go in `decisions.md` with the date and his words;
  his open calls in `questions.md` with a suggestion each.
- **Sessions**: message with `send_message`; read what they did with `list_events` (`kinds: ["result"]`); find them with
  `list_sessions` (`children: true`). Schedule a check-in with `send_later` about every 90 minutes only while sessions
  are working, and cancel it when they stop.
- **Limits learned the hard way**:
  - The account's **5-hour usage limit** stopped every session on November 21 and 23 when eight ran at once. Run few
    at once; restart any stopped by it once it resets (`list_events` shows `usage_limit_reached`).
  - **200 published pages a day.** Publish only the pages that change; tell sessions the same.
  - **16 MB per page file** (16 MiB). `--lean` packs a page's scripts; `--files` puts pictures beside the page.
- **Chris**: plain words, short sentences, a link at the end of every step; he tries everything on his phone.

## Starting fresh job sessions

The eight old sessions stopped at a clean point on November 24; each wrote a "Handoff (November 24)" section at the top
of its slip (`docs/project/slips/<job>.md`). Archive them once the waiting publishes are confirmed.

Don't start all eight again. Start a session only for a task above, on the branch that owns the files:

| Job | Owns | Brief | Branch |
|---|---|---|---|
| Together | the game (`game3d/`) | `jobs/together.md` | `job/together` |
| The Fight | the battle (`world3d/battle/`, `world3d/fight.js`) | `jobs/fight.md` | `job/fight` |
| Places | the places, arenas, Atlas, names (`world3d/m7/`, `world3d/continent/`, `world3d/names.js`) | `jobs/places.md` | `job/places` |
| Models | the heroes and Gear Room, townsfolk, people foes, the winged; the wraith and iron stand-ins | `jobs/models.md` | `job/models` |
| Foes (the kit) | full-detail foes (`prototypes/foe-hd/`) | `jobs/foes.md`, `jobs/foe-hd.md` | `job/foe-hd` (also `job/foes-walkers`, `job/foes-beasts`) |

A starter message for a fresh job session: "You are the <job> session of Aethermoor: Hearth & Heirloom in 3D, in the
repo chriskizer91-ops/Aethermoor-m7-, on branch job/<name> (merge claude/brave-davinci-790efm into it first). Read
CLAUDE.md, docs/project/README.md, docs/project/BOARD.md, your brief docs/project/jobs/<brief>.md, and the Handoff
section of your slip docs/project/slips/<job>.md. Your task: <task>. Report to the hub session <hub id> by
send_message when a step is pushed, with its link."

When the new hub starts, put its own session id in `docs/project/README.md` ("Talking to the hub") and `CLAUDE.md`.

The old sessions, for reading their history or archiving:

| Session | ID |
|---|---|
| 1, the hub | `session_01DgbUKb6orvjjc1cMgBGPJK` |
| 2, the Fight | `session_01DgbUKYR9qmKyBdACUWGViw` |
| 3, Models | `session_01DgbUKcWh5MEvjHnxzp4HHo` |
| 4, Places | `session_01DgbUKZVFBfm1dVautXEw5f` |
| 5, Together | `session_01DgbUKbyjzZFe1BXHHxzHBn` |
| 6, One Foe (the kit) | `session_01DgbUKZCNBFY7zwSzwAXR8y` |
| 7, Foes: beasts | `session_01DgbUKZ4qEpafSazysExsYV` |
| 8, Foes: walkers | `session_01DgbUKcTDUjKDVHw3sPhu7R` |
