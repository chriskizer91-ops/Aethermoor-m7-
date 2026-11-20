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
