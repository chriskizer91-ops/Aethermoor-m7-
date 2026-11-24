# Job: The Fight (session 2, branch `job/fight`)

M7's battle in 3D (milestone 3D-1, the M2 of the 3D game), then what comes after a fight (3D-2, "the spoils").
The plan this comes from: `docs/3d-game-plan.md`.

## What to make

**Step 1, one fight, start to end, on Thornhollow's road.** A pack (thornhounds or briarlings) meets the party on
Act One's 3D Thornhollow (`world3d/coven/places/m7-thornhollow.js`, walked as on the Act One page), the camera swings
round, and the fight plays out **on that spot**: the heroes on one side, the foes on the other. Every rule is M7's own,
untouched: `game/src/rules/battle.js` (`createBattle`, `commands`, `targets`, `act`, `foeTurn`, `outcome`,
`timeline`, `inspect`; its events are listed in `game/ARCHITECTURE.md`, "The battle engine contract").

- **The 3D stage.** M7's battle screen (`game/src/ui/screens/battle.js`) talks to its stage
  (`game/src/ui/battle/stage.js`) through about 30 calls: `addFoe`, `geom`, `point`, `attack`, `hurt`, `ko`,
  `escape`, `revive`, `sink`, `sparks`, `slash`, `projectile`, `ring`, `flash`, `relicFly`, `busy`, `draw`... Make a
  3D stage that answers the same calls in three.js, on the place's own ground, and returns screen positions (CSS px)
  from `geom`/`point` so the plates, intent dice, grip meters and numbers sit over the 3D figures.
- **M7's screen as it is, over the 3D.** The Initiative Ribbon, hero cards, command menu, dice tray, Analyze panel,
  log and the Legend Surge slam stay M7's own pieces. `game/` must not be edited, so swap the stage at build time
  (an esbuild plugin that resolves `../battle/stage.js` to your 3D stage is one way), or wrap the screen in your own
  module. Whatever you do, M7's 2D game must still build byte for byte (`cd game && npm test && npm run build`).
- **The heroes stand on the field** (Chris's open call, the suggestion; `docs/project/questions.md`): all four, from
  `world3d/heroes.js` (`actor`) or `prototypes/hero-3d/model.js` (`buildHero`, its `rig`), in their own gear.
  Whoever acts steps forward.
- **Moves**, in a file of your own: for the heroes, a strike for each weapon class (sword, axe, maul, spear, dagger,
  bow, staff, wand, fist and the relic styles in `prototypes/hero-3d/weapons.js`), casting, defending, using an item,
  being hit, falling, getting up, the victory cheer; for the foes, by body plan (`prototypes/bestiary/beasts.js` has 14:
  four legs, two legs, wraith, serpent, winged, mound...): lunge, bite or slam, cast, hit, fall, run. The people foes are
  built by the heroes' builder from `game/src/art/foes.js` `foeLooks`, and move as heroes do.
- **Effects in 3D**: slash arcs, sparks, arrows and bolts by Aspect colour, rings, flashes, the relic flying loose and
  clattering to the ground on a disarm, a Legend Strike's burst.
- **The dice**: real 3D dice tumbling in the tray (the suggestion), showing the faces M7 rolled (the engine decides;
  the dice only show it).
- Then **Briarmaw** in his den (`m7-briarmaw-den`): a Champion with phases, grip and claim on his relic.

**Step 2, the spoils.** After the fight: drops lying on the ground, M7's card reveal (`game/src/ui/card.js`, frozen and
approved: shown as it is, over the 3D), equipping changes the hero's 3D outfit on the spot (rebuild the actor with the
new gear), XP and levelling up (M7's after-fight screen, `ui/screens/aftermath.js`), the Party screen with the hero
turning in 3D.

**Step 3 (from November 20, after steps 1 and 2):**
- **The camera indoors and among walls**: in the Great Hall (Sneck, the game's first fight), Mosswatch and the
  Heartroot, the fight's and the spoils' cameras end up behind stone. Keep a clear line to the party and the foes (pull
  in, rise over, or pick another angle), as the walking camera does.
- **Every battle event and status M7 has, played in 3D** (`game/ARCHITECTURE.md`, the event list and the M5/M6
  statuses): holds and swallows ("Held under", "Led away", "In the river"), burrowing and the Leviathan's dive, charm,
  Twinned splits and summons, a guest ally (Tamsin against the Unsmith), duels, the toll, Hexed and Rotting, Burning and
  Bleeding, intents and phases. Prove each on a real M7 fight from its region (headless Auto runs), with a page that can
  start any of them.
- **The Legend Strike** as a close-up moment, and the phone frame rate (fewer draws in a fight).

**Step 4 (from November 21, after step 3):**
- **The full-detail foes fight with their own moves.** The foe kit's look (`prototypes/foe-hd/kit/js/loader.js`) has
  `act.lunge`, `act.fall`, `hit()` and `pose(move, u, t, step)`, and each body plan names its moves (`MOVES`, `DUR`,
  `LUNGE` in `prototypes/foe-hd/kit/js/moves/<plan>.js`: roar, swipe, bite, cast and so on). Today the fight calls only
  `hit()` and leans the whole body. Drive the rest: the move picked from M7's move (a bite, a claw, a spell; a roar at
  a new phase; the fall when it's beaten), timed so the blow lands when the dice say. If a plan lacks a move you need,
  ask session 6 in your slip (the kit is theirs).
- **The two swallows Auto never landed** (the Sand Wyrm, the Thunder-Roc): a switch that makes the charge land, and
  both proven.
- **The phone frame rate in a fight**: six full-detail foes and the party at phone settings; count draws and triangles
  (`renderer.info`) and bring them down where they're high. Put the numbers in your slip.
- **Every finished foe on your pages as it lands** (`FIGHT_HD`): the glowcap now; the Rotwarden and the sapwight once
  session 8 saves them in the kit's standard form (the hub has asked).

**Step 5 (from November 21, after step 4): the Champions' own moves.**
- Every named move of a Champion and a Relic-Bearer (`game/src/data/foes.js`: Briarmaw's Maul, Thorn Volley, Call the
  Briars, Fang Rake, Bramble Wall, Rootquake, Devour, Thornstorm; the Rotwarden's; and so on) gets its own moment in
  3D, built from M7's own words for it: the model's move, an effect that shows what the text says (thorns flying like
  arrows, the den floor heaving and roots taking hold of the heroes, bramble knitting over its hide, the thorn-crown
  pulsing as a briarling tears up out of the ground), and a camera for the big ones, as the Legend Strike has.
- A table in your files keyed by foe and move id: `{ move, effect, camera }`. The move comes from the foe's plan
  through the kit (`F.pose`); where a foe has its own move of that name (session 8's walkers name theirs for M7's
  moves: Rootlash, Grasping Roots, Bark Hide, Blacken the Sap, Devour), play that. Ask the foe's lane in your slip for
  any move it lacks.
- Act One's Champions first (Briarmaw, the Rotwarden, then the others in the order they're met as their full-detail
  models land), proven by headless runs that play each move at least once.
- No squash or stretch on the full-detail foes (Chris, November 21).

**Step 6 (from November 24): arenas that look like the land you are in (Chris).** A fight no longer happens on the
spot: when it starts, the party and the foes are moved to an open arena dressed as the land they are in, so nobody stands
in a wall (Chris saw the leftmost hero inside the Hollow Hall's wall, attacking from inside it). Places builds the arena
sets, one per kind of land (`world3d/m7/arenas/`, see `places.md` step 6); you put the fight in them: which set for
which place (from the place's region and kind, with a per-place override), the party's and the foes' stands, the
cameras, the swallows and the Champions' moments (re-check every big move's camera in its arena), a short fade in and
out, and the spoils back on the place's own ground after. Keep the on-the-spot fight as a switch (`ARENA=0`). Every
fight page rebuilt with it; Together switches the game to it.

## Your files

- Yours: `world3d/battle/**` (new), `world3d/fight.js` (new, the page), `world3d/coven/pages/m7-fight.html` (new),
  `docs/project/slips/fight.md`. You may add flags to `world3d/build.mjs` (rule 7).
- Others' (read and import, don't edit): `game/` (M7, frozen), `prototypes/hero-3d/`, `prototypes/bestiary/`,
  `world3d/heroes.js` (Models), `world3d/m7/`, `world3d/coven/` (Places). If you need a hook added in one (a new rig
  part, a named beast part), ask in your slip and message the hub.

## Check, and deliver

- `cd game && npm install && npm test` stays at 623 passing; `npm run build` still rebuilds `aethermoor-m7.html`
  byte for byte.
- Your page loads headless with no errors (Playwright's Chromium with `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`), and screenshots show a fight from start to victory, and to defeat.
- Publish the page as a claude.ai artifact (under 16 MB; `--tex=768` or `512` keeps the world small) and put the link
  in your slip. One link per step.
