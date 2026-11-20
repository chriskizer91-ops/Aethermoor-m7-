# How the sessions work together (November 20)

Chris's word (November 20): eight sessions build the 3D game. Session one is **the hub**; three **jobs** build alongside
it; a fresh fifth session **puts it all together**; sixth, seventh and eighth build **the foes in full detail**. These notes are how they stay in step. Read `CLAUDE.md` first,
then this, then `BOARD.md`, then your own brief in `jobs/`.

| Session | Job | Brief | Branch | Slip |
|---|---|---|---|---|
| 1 | the hub | this folder | `claude/brave-davinci-790efm` | (writes the board) |
| 2 | **The Fight**: M7's battle in 3D, then the spoils | `jobs/fight.md` | `job/fight` | `slips/fight.md` |
| 3 | **Models**: Chris's textures and faces on the heroes, the creatures from his sheets | `jobs/models.md` | `job/models` | `slips/models.md` |
| 4 | **Places**: Acts Two and Three as 3D places | `jobs/places.md` | `job/places` | `slips/places.md` |
| 5 | **Together**: one playable 3D game | `jobs/together.md` | `job/together` | `slips/together.md` |
| 6 | **One Foe**: Briarmaw in full detail, then the foes' shared kit and the strange ones (wraiths, willows, sparks) | `jobs/foe-hd.md`, `jobs/foes.md` | `job/foe-hd` | `slips/foe-hd.md` |
| 7 | **Foes: beasts** (four legs, scorpions, serpents, frogs, wings) in full detail | `jobs/foes.md` | `job/foes-beasts` | `slips/foes-beasts.md` |
| 8 | **Foes: walkers** (two legs) in full detail | `jobs/foes.md` | `job/foes-walkers` | `slips/foes-walkers.md` |

## The rules

1. **One repository**: `chriskizer91-ops/Aethermoor-m7-`. Every other repo of Chris's is read-only (CLAUDE.md).
2. **Each job works on its own branch** (the table) and pushes to it as it goes. Never push to another job's branch or
   to the hub's. The hub brings each job into its branch (`claude/brave-davinci-790efm`).
3. **Each job owns its files** (its brief lists them). It may read anything, and change only what it owns. If it needs
   a change in someone else's files, it says so in its slip and the hub sorts it out.
4. **To get the others' work**, a job merges the hub's branch into its own (`git fetch origin
   claude/brave-davinci-790efm && git merge FETCH_HEAD`), never another job's branch directly. The hub says on the
   board when there's something worth merging.
5. **The hub alone** writes `BOARD.md`, `decisions.md`, `questions.md`, `CLAUDE.md` and the root READMEs. A job writes
   only its own slip under `docs/project/`.
6. **`game/` is M7 as Chris got it.** Never edit it (the frozen file and its 623 tests depend on it). Import from it:
   `rules/` and `data/` are the game's brain and are used as they are; its `ui/` screens can be imported and reused.
7. **Shared files**: `world3d/build.mjs` (the page builder) can take new flags; change it only by adding, never by
   changing what an existing flag does, and say so in your slip.
8. **Chris's newer word beats older notes.** His decisions are in `decisions.md`. His open calls are in
   `questions.md`, each with a suggestion: build the suggestion, keep it easy to switch, and don't treat it as settled.
9. **Every step ends with a page Chris can open on his phone** (a claude.ai artifact, under 16 MB), and its link goes
   in your slip. Write anything Chris reads in plain words.
10. **Commit messages** say where anything copied came from (repo and path), as CLAUDE.md asks.

## Talking to the hub

- Your slip (`slips/<job>.md`) is where you report: what's done (with links), what's next, what you changed outside
  your files, what you need from another job, questions for Chris. Keep it current; the hub reads it from your branch.
- When something is ready to bring in, or you're blocked, send the hub a short message (session
  `session_01DgbUKb6orvjjc1cMgBGPJK`) saying what and where. The hub answers by message and on the board.
- Questions only Chris can answer go in your slip; the hub asks him.
