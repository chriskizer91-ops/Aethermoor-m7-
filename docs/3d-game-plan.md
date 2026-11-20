# Hearth & Heirloom in 3D: the plan (November 20)

Chris asked: build the 3D game the way Aethermoor was built, a milestone at a time, with M7's battle, loot and
levelling made 3D. M2 was the battle. What would it take?

## The good news first

**The game's brain and its face are separate.** Everything that decides what happens lives in `game/src/rules/` and
`game/src/data/`: the battle engine, the dice, Aspects, grip and claim, Legend Surge, intent dice, loot, levels,
quests, the walking rules, saves. None of it draws anything. The 3D game uses all of it exactly as it is, with its 623
tests. Only the face is new.

**The battle screen already talks to its stage in about 30 plain calls**: "a foe joins", "this foe lunges", "this one
is hit", "it falls", "sparks here", "an arrow from there to there", "the relic flies loose", "where is this foe on the
screen?". A 3D stage that answers the same calls drops into M7's battle screen. The Initiative Ribbon, the hero cards,
the command menu, the dice tray, the Analyze panel and the card reveal stay as they are (they're tested, and the card
reveal is frozen), drawn over the 3D.

**The places already sit on the game's own tile grid** (one tile is 2 m), so the walking rules can run underneath:
when the party crosses into a new tile, the game takes one step in M7's world engine. Roaming packs, their "!" and
chase, first strikes and ambushes, exits, locks, chests, people and Hearthfires all work as they do in 2D.

**All 136 pictures are in** (`art-requests/RECEIVED.md`): the 47 gear textures, 16 creature skins, 54 model sheets and
19 world textures.

## The milestones (each ends with a link for the phone)

### 3D-1 "The Fight" (M2, in 3D)

One fight, start to end, on Thornhollow's road: a pack of thornhounds or briarlings comes out of the trees, and the
camera swings round into the fight **on the spot where it started** (the land is the arena; no backdrop picture).
The four heroes take their places, the foes face them. Everything of M7's battle is there: the Initiative Ribbon,
the dice tray, the graze rule, Aspects, the intent die over each foe, grip and claim (the relic in the foe's hand, its
meter; at 0 it drops and clatters on the ground), Legend Surge (the item card slams across, as now).

What has to be made:
- **The 3D stage**: the same calls as `ui/battle/stage.js`, in three.js, on the place's own ground.
- **The heroes' moves**: a strike for each kind of weapon (sword, axe, maul, spear, dagger, bow, staff, wand,
  fist), casting, defending, being hit, falling, getting up, cheering. The Gear Room has idle, walk and strike.
- **The foes' moves**: by body (four legs, two legs, wraith, serpent, winged, mound...): lunge, bite or slam, cast,
  hit, fall, run.
- **The effects in 3D**: slash arcs, sparks, arrows and bolts, rings, flashes, the relic flying loose.
- **The foes in that fight finished from Chris's sheets** (front, side, back) and his skins.

### 3D-2 "The Spoils" (M1 and the end of M2)

After the fight: drops lie on the ground (a dropped relic, a chest), the card reveal plays over the 3D as now, and
equipping changes the hero's 3D outfit on the spot, with the 47 gear textures on every item. XP and levelling up
(M7's after-fight screen), and the Party screen with the hero turning in 3D in place of the paper doll. The faces
Chris sent (`face-*.png`) go on the heroes.

### 3D-3 "The Verdant slice" (M3)

Act One played in 3D: the 14 places already built, the roaming packs in 3D walking M7's rules, talking to people
(M7's dialogue screens), chests, locks and gates, Hearthfires, the Atlas as the 3D continent, Briarmaw and the
Rotwarden. Saves: a new milestone with its own save key, reading M7's saves (the rule: never write an older key).
About 15 to 20 foe families appear in Act One.

### 3D-4 and on: Acts Two and Three (M4 to M7)

The other 43 maps converted the same way (their world textures are in: sand, glass flats, snow, ice, forge brick, bog
water, stilt wood), their foes and bosses, the Hollow Council and the endings.

## What takes the longest

- **The battle stage and the moves** (3D-1): the biggest new piece. The 2D stage is 600 lines; the 3D one will be
  more, because the heroes stand on it too.
- **The 93 foes**: all have a rough 3D model (the Bestiary). Shaping each one to its sheet is the long tail, done in
  the order they're met.
- **Size**: one phone link per act, as now.

## Chris's calls (each has a suggestion)

1. **Where fights happen**: on the spot (suggested) or in a separate arena.
2. **The heroes in a fight**: all four standing on the field, stepping forward on their turn (suggested), or only
   the foes shown, as in 2D.
3. **The dice**: real 3D dice tumbling in the tray (suggested, it's fun), or the 2D tray as now.
4. **The card reveal**: kept exactly as approved, over the 3D (suggested).
