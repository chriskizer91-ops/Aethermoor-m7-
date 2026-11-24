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
- Build the fight page: `FIGHT_HD=briarmaw,briarling,glowcap,rotwarden,sapwight node build.mjs --page=m7-fight
  --places=thornhollow,briarmaw-den,heartroot-1,heartroot-2 --tex=768 --herotex=256 --entry=fight.js --plugin=battle/swap.mjs`
  (15.3 MB). Act One A: `FIGHT_HD=briarmaw,briarling,glowcap,rotstag,oldsnag FIGHT_STANDEES=none ... --out=fight-act1a
  --places=thornhollow,keep-hall,hearth-road,thornway,briarmaw-den --tex=448`. Act One B: `FIGHT_HD=boglurcher,mirelord,rotwarden,sapwight,
  briarling,glowcap ... --out=fight-act1b --places=mossfall,mosswatch-1,mosswatch-2,hindwood,fawnrest,eldergrove,heartroot-1,heartroot-2 --tex=448`. Act Two: `FIGHT_HD=willow-wight,grandfather-willow,glass-scorpion,glass-matriarch,sand-skink FIGHT_STANDEES=none ...
  --out=fight-act2 --places=scorchgate-vaults,harrows-forge,frostmere-below,tidal-flats,mothers-hollow,willowmurk,dust-trail,deep-shaft-2
  --tex=448`. Ironspire: `FIGHT_HD=mother-anvil,peak-troll,old-horn,rockling ... --tex=384`. Gloomfen: `FIGHT_HD=marsh-light,blackwater-gar,old-jaws,
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
