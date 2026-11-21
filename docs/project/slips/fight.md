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

- **Chris's painted foes in a fight** (same page): the **Foes** button (top right) switches the beasts between the
  sculpted 3D ones and Models' painted standees from Chris's sheets; `?foes=cutout` starts painted. People foes stay
  built by the heroes' builder. Only the paintings this page meets go in (thornhound, briarling, Briarmaw;
  `FIGHT_STANDEES=...` at build time names others), so the page is 12 MB. A painted fight plays to victory headless.

- **Step 2, the spoils (first cut)**, same link: after a win the camera comes round to face the party; what the
  foes dropped lies before them as chests lit in their rarity's colour; M7's own after-fight screen (XP, level-ups,
  gold, the chests opening into M7's card reveal) comes up over the field. **Equipping from a card re-dresses that
  hero in 3D on the spot** (headless: `?seed=2` drops a Maul; "Equip on Wren" and Wren holds it up). After a defeat,
  M7's screen wakes the party; they walk on from the way in. `runFight({ keep: true })` stays on the field for this.

- **The Party screen** (same link, the **Party** button on the walk): M7's own party screen over the paused walk;
  in its hero box the hero stands in 3D in their gear, turning slowly (drag to turn them). Equip a piece there and
  the hero is rebuilt in it; back on the walk they wear it. `battle/party-room.js` `openParty({ host, ctx, input,
  figure })`.

- **Briarmaw in full detail** (same link): the Foes button now goes 3D, Painted, **Full detail**; Full detail puts One
  Foe's baked Briarmaw (`prototypes/foe-hd`, session 6) in his den, making his own moves (roar, swipe, bite, hurt,
  fall); every other beast stays as it is. His assets go in through my build plugin with his two big pictures at
  1024 px; the page is 14.6 MB. `?foes=hd` starts there.
- On phones the three who follow the leader are Models' lite heroes (two draws each).

## Step 3

- **Every Act One fight**: https://claude.ai/artifact/Q9T8quXCTVgiVUZoMuUaP4 (14.2 MB). The **Fights** button lists all
  28 of Act One's fights, each from M7's own map data (where the foes stand, which way they face, the party's level);
  `?enc=<id>` starts one. Any M7 fight can be put on a page this way: build with its place in `--places`.
- **Cameras indoors and among walls**: the fight picks which way it faces at its start, by the place's own sight test
  (`W.P.sight`) and open ground, so its camera sees every hero and foe; the spoils camera searches round the party for a
  clear spot; so does the Legend close-up. Sneck in the Great Hall: fight and spoils both see everyone.
- **In 3D now**: statuses you can see on each figure (burning, bleeding, rot, poison, hex, chill, charm, regeneration);
  the swallow (gone in a burst, back in a ring); a guest ally standing over her card (Tamsin against the Unsmith); a
  charmed hero lunging at a friend; Twinned splits (`?omen=twinned`); the toll (`?toll=1`: Wren wears Hodge's Unfair
  Toll; "the toll is due", the foe loses a turn). Already in: summons, burrowing and diving, phases, disarms, escapes.
- **The Legend Strike close-up** (`?surge=100`): the camera cuts in on the hero; the foes' plates step aside.
- **Phone frame rate**: each figure's pieces on one joint with one material are drawn as one; a phone fight is 152
  draws (was 278).
- **Fights across Aethermoor**: https://claude.ai/artifact/RLrMg73EPUxGCHRaQXfAZS (14.9 MB): the Acts Two and Three
  fights that show the rest of M7's tricks (Fights list, `?enc=`).
- **Headless proof** (`battle/check-all.mjs`, Auto, test-only `?fast=1`): **all 28 Act One fights and 13 more** played
  to their end with no page errors (wins and losses are M7's own Auto at the region's level). Each event seen on a
  real fight:

  | M7 event or status | Seen in |
  |---|---|
  | swallow (held: "Held under", "In the river") | the Rime-Abbot, the Blackwater Leviathan |
  | burrowing / the Leviathan's dive | Kharzul / the Blackwater Leviathan |
  | charm | the Wisp-Queen, the Lantern-Mother |
  | summons / Twinned split | Briarmaw, the druids' circle, the Rotwarden, the Rime-Abbot / the road's pack with `?omen=twinned` |
  | a guest ally | Tamsin against the Unsmith (also his Stolen Arts, Unmade) |
  | a duel | Tamsin's duel in the Eldergrove (lost: M7's yield) |
  | the toll | the road with `?toll=1` ("the toll is due", the foe loses a turn) |
  | Hexed, Rotting / Burning, Bleeding | the bog-hags of Grue Hollow / almost every fight |
  | phases, disarms, escapes, revives, Legend Strikes | Briarmaw, Kharzul, the Rotwarden, Old Snag and others |
  | the cameras indoors | the Great Hall, Mosswatch's stair and lantern room, the Heartroot (fight and spoils) |

- **Full detail is the foe kit's** (`prototypes/foe-hd/kit/js/looks.js` `foeLook`): every finished foe shows in full
  detail (Briarmaw, the thornhound, the briarling on the fight page; the rest stay sculpted). The build plugin carries
  the foes named in `FIGHT_HD` (default briarmaw) at their phone size; every `three` import is one copy.
- **Living faces** (Models' `rig.faceCtl`): effort on a strike or spell, a wince when hit, eyes shut while fallen, a
  cheer on victory, worried at a quarter health or less.
- Build the fight page: `FIGHT_HD=briarmaw,thornhound,briarling node build.mjs --page=m7-fight
  --places=thornhollow,briarmaw-den --tex=768 --herotex=256 --entry=fight.js --plugin=battle/swap.mjs` (12.0 MB).
- Not proven by Auto: the Sand Wyrm's and the Thunder-Roc's swallows (their charge never landed in those runs).

## Step 4

- **Full-detail foes fight with their own moves** (the kit's `pose(move, u, t, step)` by plan): M7's move picks it (a
  spell, call or cry: roar or cast; claws and blades: swipe or swing; crushing blows: slam; else the plan's lunge), a
  new phase plays the roar or cast, a beaten foe plays its fall and lies there before sinking away. **Timed to the
  dice**: the foe winds up and closes in, holds at the top of the move until the blow lands (the hero's hurt) or a miss
  is plain, then finishes it and goes back.
- **Charges that land** (`?land=1`, a test switch): the party's Auto uses plain attacks only (they never stagger), so a
  charge plays out. Both swallows proven: "Pip is swallowed by The Sand Wyrm and loses the turn"; the Thunder-Roc's
  Carry Off swallows too (headless, the events page).
- **The phone's frame rate**, six full-detail foes and the party at phone settings (`?pack=6&foes=hd&quality=phone`,
  `battle/check-perf.mjs`, renderer.info): **61 draws, 248 thousand triangles** (was 99 draws, 268 thousand). Each
  full-detail foe is one draw (thornhound 20k triangles, briarling 17k); the party 8 draws (the leader now fights as a
  lite figure on phones, 2 draws instead of 40); the other 47 draws are Thornhollow itself (the place's engine, Places').
- **FIGHT_HD**: briarmaw, thornhound, briarling on the fight and Act One pages. The glowcap (One Foe's 5dccc4a) was not
  yet on the hub's branch when I merged; it joins as soon as it is (`FIGHT_HD=...,glowcap`). The Rotwarden and the
  sapwight join once they're in the kit's standard form.
- Published to the same links: the fight page, Act One (now 15.7 MB at 480 px textures, with the full-detail foes; its
  painted look carries the three most-met beasts), and the events page.

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

- When session 6's Briarmaw lands: his full model through `setBeastLook`.

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
