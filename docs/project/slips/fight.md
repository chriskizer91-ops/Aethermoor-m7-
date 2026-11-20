# Slip: The Fight (session 2, branch `job/fight`)

## Done

- **Step 1, one fight on Thornhollow's road**: https://claude.ai/artifact/NpeXL5Pf4RxNfkQsguTnEK (10.8 MB, with Chris's hero textures since the hub's merge)
  - The party walks Act One's Thornhollow in 3D. A pack (a thornhound and two briarlings, M7's own Thornhollow patrol)
    waits on the road. Walk up to it (or tap **Meet the pack**) and the camera swings round; the fight plays out on
    that spot. After it, the camera swings back and the party walks on; another pack comes down the road.
  - Every rule is M7's own. M7's battle screen is shown as it is, over the 3D: the turn ribbon, hero cards, commands,
    dice tray, Analyze, log, Legend Surge. `game/` is not edited: at build time our pieces stand in for three of the
    screen's own (`world3d/battle/swap.mjs`): the stage (3D), the hero strip (M7's own cards, with the heroes also on
    the field) and the dice tray (M7's own, with 3D dice). The rules are only watched (`rules-tap.js`).
  - Each hero stands on the field over their own card, in their M7 gear; whoever's turn it is steps forward. Each foe
    stands over its plate, so M7's plates, intent dice and numbers sit on the 3D figures.
  - Moves (`battle/moves.js`): a strike for each weapon kind (sword, axe, hammer/maul, mace, dagger, spear, bow, staff,
    plus wand and fist), casting, guarding, drinking, being hit, falling, getting up, the victory cheer. Foes move by
    body plan (beast, brute, floater, flier, serpent, hopper, person): gather, lunge, bite, hit, fall, run.
  - Effects (`battle/effects.js`): sparks, slash arcs, arrows and bolts, rings, a Legend burst, the relic flying loose.
  - The dice: real 3D d20s tumble in the tray and land on the face M7 rolled.
  - Victory: the party cheers. Defeat: the party falls, then wakes at the town gate. Test with `?lose=1`.
  - Commit: see `git log job/fight` ("The Fight, step 1").

- **Briarmaw in his den** (same page, the **To Briarmaw's den** button, or `?fight=briarmaw`): walk into the den and
  Briarmaw (M7's own `briarmaw-den` fight, the party at level 7) comes at you. His grip meters sit on his plate, he
  swells a little at each new phase, the briarlings he calls up rise into the line, and the foes share the line by size.
  Headless, an Auto fight runs start to end (Auto lost to him, as it can in M7; the party wakes at the den's mouth).
  Same link, 11 MB.
- The phone page builds lighter heroes when `?quality=phone` (163 thousand triangles in a fight, down from 287).

## For Together: starting a fight from outside

`world3d/battle/run.js` exports one function. It pauses the walk, swings the camera round, plays M7's battle screen
over the 3D, then the cheer (or the fall), swings back and returns:

```js
import { runFight } from './battle/run.js';
const { result, battle, outcome } = await runFight({ W, battle, center, yaw, heroes, foes, ctx, host, auto, resume });
```

- `W` the walk (`W3D.walk`), `battle` M7's state (`startBattle(game, ...).battle`), `center` the leader's spot
  (THREE.Vector3), `yaw` the way to the foes, `heroes` `{ heroId: actor }` (the walking actors), `foes` optional
  figures already standing there (`arena.js foeFigure(artKey)`), `ctx` M7's screen toolkit (game, settings, audio,
  input, services, reduced, toast; call `installCardServices(ctx)` first), `host` a fixed full-screen element.
- `result` is 'victory', 'defeat' or 'fled'; `battle` the finished state, ready for M7's aftermath screen or
  `resolveBattle`; `outcome` is M7's `outcome(battle)`. XP, loot and waking at the hearth are the caller's.
- The page must be built with `--entry=<your module> --plugin=battle/swap.mjs` and import `battle/fight.css`.
  `world3d/fight.js` is a working example.

## For Models: another look for the foes

`world3d/battle/arena.js` exports `setBeastLook(fn)`. `fn(key, sprite, opts)` returns the bestiary's shape:
`{ group or g, height, plan?, parts?, update?(t, step) }`. The fight only turns, lifts, leans and squashes the whole
figure (its group) and calls `update()` for its own idle and walk; it never reaches into the meshes. So a painted
cut-out drops in with one call, and `setBeastLook(null)` brings the code-built beasts back. Once your builder lands,
I'll add a switch on the page (`?foes=cutout`).

## Next

- Step 2, the spoils: drops on the ground, M7's card reveal, gear changing the 3D outfit, XP and levels, the Party screen.
- When Models' and session 6's looks land: `?foes=cutout`, and Briarmaw's full model through `setBeastLook`.

## Changed outside my files

- `world3d/build.mjs`: two new flags, `--entry=<module>` (bundle that module in place of heroes.js, with the CSS and
  pictures it imports) and `--plugin=<module>` (esbuild plugins for it). Without them the build is as it was.
- Locally only (not committed): `world3d/node_modules` is a link to `prototypes/hero-3d/node_modules` (build.mjs needs
  esbuild and three; `.gitignore` already lists it).

## Needs

- Models (or whoever owns `prototypes/bestiary/beasts.js`): `buildBeast` could return its `parts` (head, tail, legs)
  so a beast can turn its head to bite. Today the whole body leans instead. Not blocking.

## For Chris

- Small beasts (briarlings, hounds) stand 1.3 times life size on the field so they read beside the heroes. Fine?
  (Suggestion: keep it.)

## Checks

- `cd game && npm test`: 623 pass. `npm run build`: `aethermoor-m7.html` unchanged (git shows no change).
- Headless (Chromium, SwiftShader), phone 390 x 844 and laptop 1280 x 720: the page loads with no errors; a fight
  with Auto runs to victory, and with `?lose=1` to defeat, then back to walking. Script: `world3d/battle/check.mjs`.
- Not checked: frame rate on a real phone.

## Build

```
cd world3d && node build.mjs --page=m7-fight --places=thornhollow,briarmaw-den --tex=768 --entry=fight.js --plugin=battle/swap.mjs
```
