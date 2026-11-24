# Slip: The Fight (session 2, branch `job/fight`)

## Handoff (November 24)

For a fresh session taking the Fight (session 2, branch `job/fight`). Read docs/project/README.md, BOARD.md and
docs/project/jobs/fight.md first. My files: `world3d/battle/**`, `world3d/fight.js`, `world3d/coven/pages/m7-fight.html`,
this slip and `fight-stills/`; I may add flags to `world3d/build.mjs`. Merge only the hub's branch
(`git fetch origin claude/brave-davinci-790efm && git merge --no-edit FETCH_HEAD`).

**Where I stopped.** Every step of the brief is done, step 6 (the arenas) included and checked:
- Fights move to Places' arena sets (table: `world3d/m7/arenas/table.js`), with a fade there and back. The spoils happen
  on the place's own ground. The water foes' fights stay on the spot. `?arena=0` (or `ARENA=0` at build) keeps every
  fight on the spot.
- No stand is ever inside a wall (`clearStand` in `battle/arena.js`).
- Every big move's camera keeps the foe in the frame.
- The ten pages were rebuilt at commit 70a0f30 + slip. The account's daily publish limit ran out, so their republish is
  scheduled for 00:10 UTC on November 25 (a reminder to this session). If that didn't happen, publish the ten
  `world3d/dist/*.artifact.html` files listed below to their links.

**Rebuild the ten pages** (from `world3d/`; needs `world3d/node_modules`, a link to `prototypes/hero-3d/node_modules`,
which build.mjs needs for esbuild and three):
```
cd world3d && bash battle/build-pages.sh        # prints each page's size; each must stay under 16,000,000 bytes
```
The page list (places, full-detail foes, texture size) is in `battle/build-pages.sh`. Each page carries its places'
arena sets automatically. Output: `world3d/dist/<page>-<tex>.artifact.html`.

**Check them** (Playwright's Chromium, software GL; `export NODE_PATH=$(npm root -g)`):
```
node battle/check-stands.mjs dist/fight-act3-768.artifact.html hollow-miravel unsmith      # stands on clear floor, which set
node battle/check-moments.mjs dist/m7-fight-768.artifact.html out/ briarmaw-den           # every big move: moment, body, in shot
ONLY=swallow node battle/check-moments.mjs dist/fight-sunscorch-640.artifact.html out/ wyrm-lair
PAGE=m7-fight-768.artifact.html node battle/check.mjs out/ "go=1&auto=1&speed=2&quality=phone"         # a whole fight, won
PAGE=m7-fight-768.artifact.html node battle/check.mjs out/ "go=1&auto=1&speed=2&quality=phone&lose=1"  # and lost
cd ../game && npm test                                                                      # M7: 623 pass
```

**The pages** (all https://claude.ai/artifact/...; the files are in world3d/dist):
- the fight page (Thornhollow's road, the Den, the Heartroot): NpeXL5Pf4RxNfkQsguTnEK (m7-fight-768)
- Act One A, Thornhollow to the Den: Q9T8quXCTVgiVUZoMuUaP4 (fight-act1a-640)
- Act One B, Mossfall to the Heartroot: 7Prqphh2mubkp2L2hTn2ZA (fight-act1b-576)
- events (Sunscorch, Ironspire and Gloomfen set pieces): RLrMg73EPUxGCHRaQXfAZS (fight-events-512)
- Act Two: AqSBbi7gYeRogHPsq24nAk (fight-act2-448)
- Sunscorch: TWtn8x7hcGjTMHAUpAWC5M (fight-sunscorch-640)
- Ironspire A: WhydqjmyNvuGQdrSadEXKD (fight-ironspire-a-704)
- Ironspire B: EGV6SV4zR9EwXS2bB8m4g6 (fight-ironspire-b-768)
- Act Three: 5vCvi2woYF3WZVGNAKSLQf (fight-act3-768)
- Gloomfen: GGPe1k5K6g54kaUb49Y3bt (fight-gloomfen-576)

**What I'd do next if asked:**
- Moments for the veterans (forge-warden, overseer, unmade), so their bigger moves get a camera too.
- Put the new full-detail foes from sessions 6 and 8 (merged November 24: choir-wraith, forge-warden, cinder-thrall,
  bellows, ashen-warden and more) on the pages through FIGHT_HD in build-pages.sh, as each passes its stretch check
  and the page stays under 16 MB.
- Bigger effects on heroes at phone size.
- A frame-rate check on a real phone.

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
- Build the fight page: `FIGHT_HD=briarmaw,briarling,glowcap,rotwarden,sapwight,thornhound node build.mjs --page=m7-fight
  --places=thornhollow,briarmaw-den,heartroot-1,heartroot-2 --tex=768 --herotex=256 --entry=fight.js --plugin=battle/swap.mjs`
  (15.3 MB). Act One A: `FIGHT_HD=briarmaw,briarling,glowcap,rotstag,oldsnag FIGHT_STANDEES=none ... --out=fight-act1a
  --places=thornhollow,keep-hall,hearth-road,thornway,briarmaw-den --tex=448`. Act One B: `FIGHT_HD=boglurcher,mirelord,rotwarden,sapwight,
  briarling,glowcap ... --out=fight-act1b --places=mossfall,mosswatch-1,mosswatch-2,hindwood,fawnrest,eldergrove,heartroot-1,heartroot-2 --tex=448`. Act Two: `FIGHT_HD=willow-wight,grandfather-willow,glass-scorpion,glass-matriarch,sand-skink FIGHT_STANDEES=none ...
  --out=fight-act2 --places=scorchgate-vaults,harrows-forge,frostmere-below,tidal-flats,mothers-hollow,willowmurk,dust-trail,deep-shaft-2
  --tex=448`. Ironspire, two pages (hub, November 24): the Lower Peaks (old Ironspire link, https://claude.ai/artifact/WhydqjmyNvuGQdrSadEXKD)
  `FIGHT_HD=rime-wolf,rockling,peak-troll ... --out=fight-ironspire-a --places=rockslide-pass,frost-road,frostmere,frostmere-below,highfold --tex=512`;
  Ironhold and the Heights (https://claude.ai/artifact/EGV6SV4zR9EwXS2bB8m4g6) `FIGHT_HD=mother-anvil,peak-troll,old-horn,rockling ... --out=fight-ironspire-b
  --places=ironhold,ironhold-deeps,iron-stair,harrows-forge --tex=512`. Gloomfen: `FIGHT_HD=marsh-light,blackwater-gar,old-jaws,
  blackwater-leviathan,mire-leech ... --tex=384`. Events: `FIGHT_HD=marsh-light FIGHT_STANDEES=sand-wyrm,kharzul,blackwater-gar,blackwater-leviathan`.
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
- **FIGHT_HD** (hub's rule, November 21: only a foe that passes the kit's stretch check on every move fights in full
  detail): briarmaw, briarling, glowcap on the fight and Act One pages, re-weighted (hub 7cc2a1d). The thornhound is
  back on its stand-in until session 7 says it passes; the Rotwarden and the sapwight join the same way.
- **The kit's common moves** (d70f6fe): the pick is by name only (cast, roar on a new phase, swipe, strike, bite; hurt,
  ko), each move's length from the foe's own `duration()`. **No squash or lean on full-detail foes** (Chris, November
  21: no model may stretch): their own moves carry the hit and the lunge; the code-built and painted ones keep theirs.
- Published to the same links: the fight page, Act One (15.6 million bytes at 400 px world textures, with the full-detail foes; its
  painted look carries the three most-met beasts), and the events page.

## Step 5 (in progress): the Champions' own moves

- `world3d/battle/champions.js`: a table keyed by foe and move id, `{ move, start, land, camera }`, each built from
  M7's own words for the move. The move is the foe's own of that name where its lane made one (a list of choices,
  the first it has), else the kit's common one; `start` and `land` are its effects (thorns flying, roots bursting from
  the ground under each hero, bramble knitting round the body, the crown's pulse, slashes and blood); `camera` is
  `close` (in on the foe) or `wide` (back and up over the whole field) for the big ones.
- **Briarmaw: all eight moves proven** in headless fights (`battle/check-moves.mjs`, a still as each starts and as it
  lands): Maul, Thorn Volley, Call the Briars (close), Fang Rake, Bramble Wall, Rootquake (wide, the stage shakes),
  Devour (close; needs `?land=1` and a strong party, `?level=12`, to reach his third phase), Thornstorm (wide).
  **Proof stills, slow mode** (`check-moves.mjs ... --slow`): the battle clock is held from a big move's first frame
  and stepped by hand, three stills per move (as it bursts out, its thorns in the air, as it lands), so the effects
  show at their height however slow the test browser is. Stills for Chris in `docs/project/slips/fight-stills/`.
- **Fixed while making them**: at 2x speed every effect played four times as fast instead of twice (its length was
  shortened and its clock sped up too); the crown's pulse was hidden inside Briarmaw's body (it now glows over him);
  the close camera on a summoning left the foe behind the turn strip across the screen's middle (it now stands in the
  stage's open upper part).
- **The Rotwarden: all eleven moves are in the table** (Rootlash, Bark Hide, Graft, Blacken the Sap, Grasping
  Roots, Ichor Tide, Heartroot Bloom, Ichor Rain, Devour, Unmaking, Grief). They play on his sculpted model now; his
  full-detail model joins when session 8 saves him in the kit's standard form.
- **For session 8** (Foes: walkers): the table asks the Rotwarden for his own moves by these names: `rootlash`,
  `bark-hide`, `graft`, `blacken`, `grasping-roots`, `ichor-tide`, `heartroot-bloom`, `ichor-rain`, `devour`,
  `unmaking`, `grief` (each falls back to a common move until it exists).

- **Every Champion, Relic-Bearer, Hollow Council member and the Unsmith: 298 moves in the table** (all three acts).
  `battle/make-moments.mjs` reads each move's words and effects in M7 and writes `battle/champion-moves.js`: its body
  move (the foe's own move by M7's id where its lane made one, else the common move the words suggest), its effects
  from a set of recipes (thorns, rain, roots, quake, vines, ward, summon, heal, fire, frost, storm, blight, tide,
  light, hex, song, slash, maw, dig, dive) and its camera (close for a charge or a summoning, wide for a blow at
  everyone). They play on whatever model stands in today; each full-detail model picks up its moves the day it lands.
  Hand-made moments (Briarmaw's, the Rotwarden's) win over the made ones.
- **Hand-made moments, 119 so far** (champions.js MOMENTS; the made ones fill the rest):
  - Act One, all twelve big foes: Briarmaw, the Rotwarden (on his own named moves, full detail), Haskett, Mags,
    the Mirelord, Hollis, Dun, the Hollowed Sergeant, the Thornmother, Gloamwing, the Rotstag, Old Snag.
  - Act Two's six Champions: the Ashen Warden, Kharzul, Mother Anvil, the Rime-Abbot and the Lantern Mother (Models'
    wraiths, their own moves), the Blackwater Leviathan. Kharzul's place (the Glass Heart) isn't built in 3D yet.
  - Effects added for them: smoke, splash, caltrops, a chalk mark over a hero's head, a lash (tapering to a glistening
    bulb, curving and whipping, coiling round the one it catches), a flare overhead, flames.
- **`battle/check-moments.mjs`** plays every move of a fight's big foe on the real arena with the clock held, four
  stills each (bursting out, half a second in, landing, a moment after); `ONLY=<move ids>` for a few. Every Act One
  move: a moment, no errors.
- **Seen and fixed from the stills**: plates and intents step aside for every named move (in place too); charge
  close-ups from the side, high, over open floor; a blow on a hero drawn a little in front of them (the camera stands
  behind the party); trees between the fight's camera and the field thin away as on the walk.
- **Spoils camera indoors** (Together): over the room's own floor; checked in the Great Hall, Mosswatch (stair and
  lantern room) and the Heartroot (two fights) by `battle/check-spoils-view.mjs`: every one sees all four heroes.
- **Pages**: the fight page now carries Act One's two Champions (Briarmaw's den, the Heartroot: Rotwarden and sapwight
  in full detail) and Thornhollow's road; Act One at 352 px world textures (with the boglurcher); a new Act Two page
  (the Champions' places, Willowmurk, the Dust Trail and the Glass Heart; full detail: willow-wight, Grandfather
  Willow, glass-scorpion, glass matriarch, sand-skink; Models' armoured Ashen Warden and wraiths):
  https://claude.ai/artifact/AqSBbi7gYeRogHPsq24nAk (15.5 MB, 448 px world textures). Every move of Act Two's six
  Champions, Grandfather Willow and the Unsmith (events page) proven by check-moments: a moment each, no errors; the
  armoured, the wraiths, the Unsmith and Grandfather Willow play their own body moves.
- **The Sunscorch page**: https://claude.ai/artifact/TWtn8x7hcGjTMHAUpAWC5M (12.9 MB; Scorchgate and its Vaults, the Glass
  Flats, the Sun Road, the Dust Trail, the Miragewell, the deep shaft and the Glass Heart; full detail: glass-scorpion,
  glass matriarch, sand-skink). Hand-made moments for its nine Relic-Bearers (the Ash-Wight Captain, Gnash, Rasa, the
  Glass Matriarch, the Wisp-Queen, the Sand Wyrm, Vell, Brask, Tamsin): every move a moment, no errors (check-moments).
  170 hand-made moments in all. Next: the Ironspire's and the Gloomfen's Relic-Bearers, each region its own page.
- **The Ironspire page**: https://claude.ai/artifact/WhydqjmyNvuGQdrSadEXKD (13.1 MB; Rockslide Pass, Ironhold and its Deeps, the Iron
  Stair, the Frost Road, Frostmere and Beneath, Highfold, Harrow's Forge). Hand-made moments for its seven Relic-Bearers
  (the Brigand Warden, the Journeyman and the Sentinel Captain on Models' armoured, Old Horn, the Drowned Abbess, the
  Ice-Cutter, the Thunder-Roc): every move a moment, no errors. 211 hand-made moments in all.
  **The Thunder-Roc's eyrie, fixed with Places** (November 23): M7's spot for the party (4.5 tiles east of the nest) is
  inside the crevasse; the party now stands on the plateau's east lip where the crossing comes in, facing the nest
  (fight.js START). The Roc stands in clear view (fight-stills/thunder-roc-eyrie.png).
- **Models' winged** (November 23): setBeastLook(withWinged(withArmoured(withWraiths(foeLook(buildBeast))))); Gloamwing
  proven on its own moves (its own silk shell in Cocoon, the bell glowing on Bell-Hum). A winged foe's own carry-off, dive
  and swoop carry it forward without the arena's dash.
- **The Gloomfen page**: https://claude.ai/artifact/GGPe1k5K6g54kaUb49Y3bt (14.6 MB; the Lanternfen, the Rotbridge, the Drowned
  Belfry, Blackwater Reach, the Tidal Flats, Misthollow, the Mother's Hollow; full detail: marsh-light, blackwater-gar,
  Old Jaws; the Leviathan joins when he passes the stretch check). Hand-made moments for its Relic-Bearers (Old Jaws,
  Mother Grue, the Drowned Cantor, Hodge, the Bargemaster, the Salvage-Master, Grandfather Willow): every move a moment,
  no errors. **Act Two is hand-made throughout: 255 moments.**
- **Briarmaw and Kharzul on their own moves** (November 23): Briarmaw's new 'bear' set (session 6) answers his game moves
  by name through its ALIAS (ownMove reads ALIAS now); Kharzul in full detail (Places) on the Sunscorch page, registered
  with Places' kharzul set (his files name 'scorpion'). Both proven: every move on their own bodies, no errors.
- **The Leviathan, the blackwater-gar and Old Jaws in full detail** (One Foe, November 23) on the Gloomfen page, with the
  agreed EVENTS / SINKS and mouth, head, pearl, harpoon bones: every move on their own bodies, no errors. The Leviathan
  strikes from where he lies (his root stays in the water); the swallowed hero is drawn into his mouth
  (fight-stills/leviathan-swallow.png); Pearl-Light glows on his pearl, Harpoon Rage sparks from the wound.
- **More full-detail foes on the pages** (November 23): Mother Anvil, the peak-troll, Old Horn and the rockling on the
  Ironspire page (384 px world textures; Mother Anvil's eight and Old Horn's six moves on their own bodies, no errors); the
  mire-leech on the Gloomfen page (384 px). Act One is now two pages (hub, November 24): **Thornhollow to the Den** (the old Act One link,
  https://claude.ai/artifact/Q9T8quXCTVgiVUZoMuUaP4, 14.8 MB at 448 px; the Rot-Stag and Old Snag in full detail, their fights on the
  Hearth Road and the Thornway) and **Mossfall to the Heartroot** (https://claude.ai/artifact/7Prqphh2mubkp2L2hTn2ZA, 14.5 MB at 448 px;
  the Mirelord, boglurcher, Rotwarden and sapwight in full detail). The three newly full-detail big foes proven, no errors. The forge-spark isn't fought anywhere in M7. The kit's loader builds bones in
  any order (two passes), so session 7's serpent-chain note doesn't touch the Fight.
- **Every foe with a full-detail model** (hub, November 24): the thornhound back in full detail (passes now) on the fight
  page (Thornhollow's road; 640 px world textures) and both Act One pages; the rime-wolf (session 7, its 'wolf' set added
  by addMoves from pages/beasts/kit/moves-wolf.js, the module's `wolf` export) on the Ironspire page (320 px). Fights
  start with no errors; fight-stills/thornhounds-poachers-holm.png.
- **Every page built lean** (November 24): Places' `--lean` (scripts packed losslessly, nothing changed on screen) saves
  about 2.4 MB a page; spent on sharper world textures. All ten fight pages are built by one script,
  `world3d/battle/build-pages.sh` (the page list: places, full-detail foes, texture size); sizes now: the fight page 896 px,
  Act One both 640, events 640, Act Two 512 (Kharzul in full detail again), Sunscorch 640, Ironspire both 768, Gloomfen 640;
  every one 14.4-15.7 MB, every one started headless with no errors.
- **Act Three** (hub, November 24): **the Act Three page**, https://claude.ai/artifact/5vCvi2woYF3WZVGNAKSLQf (10.4 MB at
  768 px; the Hollow Hall, the Ash Stair, the Chained Deep, the Worldforge). Hand-made moments for the Hollow Council
  (Miravel 7, Qasim 7, Brundar 6, Gretch 7) and the Unsmith (8, on his own body from Models' armoured set): all 35 play,
  no errors. The Unsmith's companions move with their own moves now: the forge-warden's Hammer Arm, Bellows Breath, Hold
  the Bridge and Stoke; the cinder-thrall's and the overseer's Cinder Fist, Ash in the Eyes, Reform, Hot Chain, Drive
  Them (the arena now uses any foe's own move by M7's id, not only a big foe's). The unmade in full detail in the Chained
  Deep with its violet glow, on its own four moves. Stills: fight-stills/act3-*.png.
- **The rotgrub** in full detail on the Act One B page (Heartroot), its fights hr1-grubs and hr1-sapwight, no errors. Its
  party spot was down the south tunnel, nine metres under the hall floor in 3D (the grubs were up in the roots out of
  sight): the party now stands in the hall north of them (`START` in fight.js, as for the Eyrie). Places: please check.
- **The Rot-Stag's Rotwood Crown**: the gold flare now sits on his antlers (fight-stills/rotstag-crown-flare.png).
- **Cameras in halls** (November 24): a moment's camera also counts the place's own meshes standing between it and the
  foe (pillars, statues the sight test doesn't hold), up to most of the way to the foe.
- **Swallows** (agreed with Places, session 4, for the Sand Wyrm and the Leviathan): their `parts.mouth` and
  `SWALLOW_AT { u, reach }`; the hero shrinks into the mouth at that u and comes back out of it on release; the foe
  stops at `reach`; a `full` idle while a hero is inside, `spit` on release. One Foe (session 6) builds the
  Leviathan and Old Jaws the same way; we agreed one form for both lanes: `moves.EVENTS = { swallow: { gulp, reach } }`
  (SWALLOW_AT read too), `moves.SINKS = { sound: true }` for a dive that takes the foe fully under by itself (the arena
  then doesn't lower it, and hides it once under), and parts `mouth`, `head`, `pearl`, `harpoon`.
  **Built in the arena now** (November 23), ready for when their models land: the reach, the hero into and out of
  parts.mouth, `full` and `spit`, SINKS. Today's models have no mouth, so they keep the burst; proven headless: the Sand
  Wyrm's lair with `?land=1`, Pip swallowed, held and let go, the Sand-Dive, no errors.
  **The Sand Wyrm in full detail** (Places, November 23) on the Sunscorch page: its own moves (maw, thrash, dive,
  swallow, grind); the swallow seen headless: it plunges with its mouth over the hero, the hero goes into its mouth,
  `full` while they're inside, out of the mouth on `spit` (fight-stills/sand-wyrm-swallow.png, sand-wyrm-spit.png);
  a real fight with `?land=1`: swallowed, held, let go, no errors. Reads SWALLOW_AT {u, ahead} as well as EVENTS.
- **Fixed November 23**: an effect started by a delayed one (fx.later) used to stand frozen on the field (dropped from
  the effects list); the turn strip steps aside during a close-up or wide camera; close-up spots scored by a fan of
  rays (built things, rock, trees, ground too near).
- Known weak: Longshot's close-up can sit in a bush (the sight test doesn't see foliage); effects on heroes are small
  at phone size.
- **For the foe lanes (sessions 6, 7, 8): the own-move names the table asks for**, M7's move ids (each falls back to
  a common move until the foe has it):
  - Haskett (`bandit/poacher`): `hack`, `shield-bash`, `dirty-trick`, `heavy-swing`, `second-wind`, `longshot`
  - Hollis Fairweight (`tallyman/signalmaster`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `signal-flare`
  - Dun the Counter (`tallyman/counter`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `oath-cut`
  - Foreman Brask (`tallyman/foreman`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `pick`, `dig-faster`, `noon-flare`
  - The Cutter-Chief (`tallyman/ice-cutter`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `ice-pick`, `split-the-ice`
  - The Salvage-Master (`tallyman/salvage-master`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `salvage-hook`, `diving-bell`
  - The Bargemaster (`tallyman/bargemaster`): `cut`, `tally-mark`, `smoke-pot`, `cheats-cut`, `seal-flash`, `boat-hook`, `make-fast`, `haul-away`
  - The Rot-Stag (`rotstag`): `gore`, `trample`, `rot-bellow`, `antler-charge`, `rotwood-crown`
  - Old Snag (`oldsnag`): `tusk`, `trample`, `bristle`, `wallow`, `splitting-charge`
  - Briarmaw (`briarmaw`): `maul`, `thorn-volley`, `call-the-briars`, `fang-rake`, `bramble-wall`, `rootquake`, `devour`, `thornstorm`
  - Mags Kestrel (`smuggler/queen`): `cut`, `caltrops`, `bolt`, `sleight`
  - Vell Saltglass (`smuggler/sharpshooter`): `cut`, `caltrops`, `bolt`, `pin-down`, `singing-shot`
  - Oda the Thornmother (`feral-druid/thornmother`): `thorn-lash`, `barkskin`, `call-the-briars`, `rising-sap`
  - Sgt Corra Thistle (`hollowed-ranger/sergeant`): `rot-arrow`, `knife`, `remember`, `hold-the-line`
  - The Gloamwing (`gloamwing`): `wing-buffet`, `dreamdust`, `cocoon`, `bell-hum`
  - Gorrow the Mire-King (`mirelord`): `belly-flop`, `drag-under`, `wallow`, `undertow`
  - The Rotwarden (`rotwarden`): `rootlash`, `bark-hide`, `graft`, `blacken`, `grasping-roots`, `ichor-tide`, `heartroot-bloom`, `ichor-rain`, `devour`, `unmaking`, `grief`
  - Tamsin (`tamsin`): `riposte`, `cheap-shot`, `showboat`, `parry`, `not-like-this`
  - Tamsin hearthbrand (`tamsin/hearthbrand`): `riposte`, `cheap-shot`, `showboat`, `parry`, `not-like-this`, `kindled-cut`
  - Tamsin stillwater-lance (`tamsin/stillwater-lance`): `riposte`, `cheap-shot`, `showboat`, `parry`, `not-like-this`, `still-point`
  - Tamsin cairnmaul (`tamsin/cairnmaul`): `riposte`, `cheap-shot`, `showboat`, `parry`, `not-like-this`, `cairn-swing`
  - Rasa the Dune-Rider (`dune-raider/rider`): `scimitar-cut`, `sand-in-the-eyes`, `dune-charge`, `war-cry`, `dune-step`
  - Gnash the Raider-King (`dune-raider/raider-king`): `scimitar-cut`, `sand-in-the-eyes`, `dune-charge`, `war-cry`, `kings-blow`, `dunefall`
  - The Glass Matriarch (`glass-scorpion/matriarch`): `pincer`, `glass-sting`, `carapace`, `moult`, `shell-rain`
  - The Wisp-Queen (`mirage-wisp/queen`): `cold-touch`, `blink`, `beguile`, `drink-the-well`, `hall-of-mirrors`
  - The Ash-Captain (`ash-wight/captain`): `ash-blade`, `cinder-grasp`, `ember-breath`, `fall-in`, `keyless-turn`
  - The Sand Wyrm (`sand-wyrm`): `maw`, `thrash`, `sand-dive`, `swallow`, `scale-grind`
  - Kharzul the Glass Scorpion (`kharzul`): `tail-lash`, `glass-sting`, `glasscutter`, `burrow`, `erupt`, `carapace-brace`, `glass-rain`, `molten-tail`
  - The Ashen Warden (`ashen-warden`): `ash-blade`, `ember-sweep`, `ward-of-ash`, `call-the-watch`, `command-of-cinders`, `scorch-the-vault`, `watch-unbroken`
  - Rhune the Pass-Warden (`brigand/warden`): `hack`, `crossbow`, `desert`, `toll-chain`, `gale-step`
  - The Sentinel-Captain (`iron-sentinel/captain`): `iron-fist`, `gate-slam`, `lock-shields`, `ironwall`, `shield-rush`
  - Harrow's Journeyman (`forgeborn/journeyman`): `molten-fist`, `slag-spit`, `stoke`, `smiths-hammer`, `temper-kin`, `rune-fire`, `white-heat`
  - Old Horn (`peak-troll/old-horn`): `club`, `pummel`, `hurl-boulder`, `regrow`, `horn-toss`, `mantle-of-trolls`
  - The Drowned Abbess (`rime-wraith/abbess`): `drowned-grasp`, `dirge`, `pull-under`, `last-rites`, `censer-swing`
  - The Thunder-Roc (`thunder-roc`): `talons`, `wing-gale`, `carry-off`, `storm-mantle`
  - Mother Anvil (`mother-anvil`): `hammerfall`, `sparks`, `temper`, `steam-burst`, `anvil-strike`, `bellows`, `heart-flare`, `worldforge-blow`
  - The Rime-Abbot (`rime-abbot`): `crozier-strike`, `toll`, `rime-ward`, `drown`, `call-the-choir`, `hushing`, `heartbeat`, `rime-nova`
  - Old Jaws (`blackwater-gar/old-jaws`): `bite`, `leap`, `dive`, `death-roll`, `the-tooth`
  - Mother Grue (`bog-hag/grue`): `ladle`, `hex`, `rot`, `stir-the-pot`, `evil-eye`
  - Grandfather Willow (`willow-wight/grandfather`): `lash`, `bough-fall`, `weep`, `weeping-volley`
  - The Drowned Cantor (`drowned/cantor`): `cold-hands`, `drag-down`, `toll`, `black-water`, `the-hymn`, `beat-time`, `downbeat`
  - Hodge (`hodge`): `toll-is-due`, `old-mans-cane`, `bridge-troll`, `clipped-coin`
  - The Lantern Mother (`lantern-mother`): `lamp-pole`, `lure`, `lantern-flare`, `hush-now`, `lead-them-down`, `moths`, `mourning`, `snuff`, `lantern-nova`, `drown-the-light`
  - The Blackwater Leviathan (`blackwater-leviathan`): `coil`, `tail-slap`, `sound`, `breach`, `swallow`, `undertow`, `harpoon-rage`, `pearl-light`, `flood`
  - Hollow Miravel (`hollow-miravel`): `rowan-staff`, `unheeded-advice`, `grey-bark`, `hollow-bloom`, `thornwall`, `every-fallen-tree`, `hollow-harvest`
  - Hollow Qasim (`hollow-qasim`): `scimitar`, `sand-in-the-eyes`, `what-you-owe`, `hollow-draught`, `drought`, `mirage`, `drink-them-dry`
  - Hollow Brundar (`hollow-brundar`): `thanes-axe`, `debts-paid`, `sentinels-stance`, `iron-grip`, `seal-the-deeps`, `ironfall`
  - Hollow Gretch (`hollow-gretch`): `gavel`, `mayors-word`, `counted-twice`, `too-tight`, `call-in-a-favour`, `fear`, `every-favour-owed`
  - The Unsmith (`unsmith`): `hammer-blow`, `ring-the-anvil`, `unmake`, `forge-apron`, `nothing-left`, `worldfire`, `hearts-pull`, `heart-flare`

## Step 6: arenas that look like the land you are in (Chris, November 24)

- **Every fight page now fights in Places' arena sets.** All ten pages have been rebuilt and republished at their usual
  links. When a fight starts there's a short fade, and the fight moves to the open round dressed as the land it's in
  (Places' table, world3d/m7/arenas/table.js: the Road and the Wood for Thornhollow, the Thorns for the Den, the Hollow Hall
  set for the Hollow Hall, and so on). The party stands 4 m before the set's centre, facing across it, and the foes
  4 m beyond. After the fight there's a fade back, and the party is on the place's own ground where it stood, for M7's
  spoils screen and the chests.
- The water foes (the gars, Old Jaws, the Leviathan) fight from their own water, and every set's middle is dry floor,
  so their fights stay on the spot.
- `?arena=0` on a page (or building with `ARENA=0`) keeps every fight on the spot. `?arenaset=<place>` tries a set.
  Build overrides: `ARENA_SETS='{"m7-x":"arena-y"}'`. `build-pages.sh` adds each page's sets to its places
  (world textures one step lower on six pages to stay under 16 MB).
- **No one stands in a wall**, even on the spot (Chris saw the leftmost hero inside the Hollow Hall's wall: all four
  Hollow Council fights had it). A stand whose spot, or a ring its width round it, isn't walkable floor moves to the
  nearest clear spot not already taken. `battle/check-stands.mjs` tests every fighter against the floor: 72 fights on the
  spot all clear, except the water foes, who stand in their water as they should.
- Proven headless, no errors: a whole fight there and back (Thornhollow's patrol: the Road and Wood set, victory, spoils
  on Thornhollow's ground); stands in the sets for the Den, the Heartroot, the Keep, the Rot-Stag's glade, the Deep Wood
  (twice), the Canyon (the Sand Wyrm), the Snow Road (the Roc), the Fen (the Cantor); every move of Briarmaw, the
  Unsmith and Hollow Miravel in their sets; the Wyrm's swallow over the shoulder in the Canyon set.
  Stills: fight-stills/arena-*.png.

### Step 6 checks (hub, November 24 evening)

- **A lost fight in an arena**: Thornhollow's patrol with `?lose=1`, lost in the Road and Wood set. The party comes back
  out to Thornhollow's own ground, nobody is left in the set, and the fade clears. M7's "You wake at the Hearthfire"
  screen plays as it does on the spot. Fixed: for a moment on the way back the camera stood on the ground (the
  move back put the camera at ground height like the fighters); it keeps its height now. A won fight there and back
  re-checked too.
- **Every fight on every page** (94) loaded with `battle/check-stands.mjs`: fights ran in all eighteen sets (90 fights
  in sets, the 4 water fights on the spot). Every stand in every set is on clear floor; the only flags are the gars and
  the Leviathan standing in their own water.
- **Every big foe's moves where it fights** (49 fights with a Champion, Relic-Bearer, Hollow or the Unsmith):
  `check-moments.mjs` now says whether the foe is in the shot as each move lands. In 48 of the 49 fights it is, on
  every move, with no errors. The one miss: the Leviathan on the events page, lying far out in his water, fell off the
  phone's narrow screen on three wide moves. The camera's choice now requires the foe in the frame, and he's in shot
  on all nine moves on both pages he's on.
- **The swallows**: the Sand Wyrm's in the Canyon set (Sunscorch page, his full model) and the Leviathan's in his water
  (Gloomfen page): over the shoulder, the foe in shot.
- All ten pages rebuilt (15.1 to 15.7 MB; Act Three 10.7). **Not yet republished**: the account reached its daily
  limit of page publishes; they go up after midnight UTC.

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

- Done: every step of the brief (the hub, November 24). Briarmaw is on his full model and own moves; Acts One to Three
  and the events have their pages; every big foe's moves have hand-made moments.
- If asked, next: moments for the veterans (the forge-warden, the overseer, the unmade), so their bigger moves get a
  camera too; louder effects on heroes at phone size; a check of the frame rate on a real phone.

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
