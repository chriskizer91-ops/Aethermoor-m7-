# Slip: Models (session 3, branch `job/models`)

Last updated November 24 (handoff for a fresh session).

## Handoff (November 24)

For a fresh session taking Models (session 3, branch `job/models`). Read `docs/project/README.md`, `BOARD.md` and
`docs/project/jobs/models.md` first; merge the hub's branch (`git fetch origin claude/brave-davinci-790efm && git merge
FETCH_HEAD`) before working.

**Where I stopped.** Chris's November 24 notes are all done and merged: the winged beat once a second or slower; the
Gear Room's panels fold away; `withWraiths` / `withArmoured` / `withWinged` step aside for the kit's finished foes; the
moths polished against their sheets. Last commit before this handoff: 6048106. Nothing is in progress.

**What's mine now.**
- The heroes and the Gear Room (`prototypes/hero-3d/`: `model.js` builds every hero, item, townsfolk and people foe;
  `kit.js` the parts, materials and sculpted masters; `weapons.js`; `masters/sculpt.py` makes the 42 master kinds).
  `model.js` goes into every page: keep its growth small and report its byte change (minified) to the hub.
- The townsfolk and the people foes (`people.js`, `buildFoeLooks` in `model.js`), and `world3d/heroes.js`.
- The winged (`prototypes/winged/winged.js`: the Lamp-Moth, the Gloamwing, the Thunder-Roc).
- The Bestiary (`prototypes/bestiary/`) as the stand-in beasts.
- Stand-ins only: the wraiths (`prototypes/wraiths/`) and the iron and forge foes (`prototypes/armoured/`). Sessions 8
  and 6 have made the full-detail versions through the kit. Mine show only where a page has not registered the kit's
  version (`registered(key)` from `prototypes/foe-hd/kit/js/looks.js`; pages register exactly the foes whose
  `prototypes/foe-hd/foes/<key>/stretch.json` passes). Don't polish these further unless asked.

**Pages** (publish each with the Artifact tool to the same link; the `*.artifact.html` file in each `dist/`):
- The Gear Room: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL (`prototypes/hero-3d`, `node build.mjs`;
  `--debug` for `dist/gear-room-debug.html`, which the item audit needs)
- The winged: https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg (`prototypes/winged`)
- The wraiths: https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD (`prototypes/wraiths`)
- The ironclad (iron and forge): https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD (`prototypes/armoured`)
- The Bestiary: https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY (`prototypes/bestiary`)

Each prototype folder needs `ln -s ../hero-3d/node_modules node_modules` once (and `npm install` in `hero-3d`).

**Checks** (in `prototypes/hero-3d/checks/`, Playwright headless with SwiftShader; run with `node <script> <args>`):
- `audit.cjs dist/gear-room-debug.html`: the item audit (458 items, expect 0 flagged).
- `stats.cjs dist/gear-room.html`: triangles, meshes and draw calls at High, Light and Lite (226 / 104 / 24 calls now).
- `lite.cjs`: the four heroes and all 92 townsfolk and people foes build at High, Light and Lite with no errors. Run it
  after any change to `model.js`: Lite has fewer ring points, so never pick points by fixed index (this broke the game's
  townsfolk once, November 24).
- `wgstats.cjs`, `wrstats.cjs`, `arstats.cjs <dist/....html>`: High and Light triangles and draws per foe, sculpts,
  scroll width at 390 px. Budgets at Light: rabble ~20k, veterans ~30k, Relic-Bearers ~40k, Champions ~50k; same draws
  at High and Light.
- `rate.cjs`: wing beats a second on every winged move (Chris: at most one).
- `wr.cjs <page> <outdir> <keys>` then `wrsheet.py <outdir> <keys> [winged|armoured|wraiths]`: front, side and back
  beside Chris's sheet.
- `fold.cjs [outdir]`: the Gear Room's fold buttons at 390 px.
- The hand-over: `withX` must return the fallback's look for a registered key; I checked it with a small test page
  that registers fake keys (`register({ lightMeta: { key, plan: 'quad' }, tex: { 1024: 1 } })`).

**What's next.** Whatever Chris notes on the heroes, the townsfolk, the people foes or the winged; the Thunder-Roc
had no change in the last polish pass, so it is the first candidate if he asks for more on the winged. Known gaps:
the robes' bodies are still plainer than the foes beside them; the Unsmith's draws differ by 4 between High (51) and
Light (47).

## Done

**Step 1, the heroes in Chris's textures and faces.** The Gear Room: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
(commit 08cbf2e; page version 5).

- Every item's surface now comes from Chris's 43 material pictures (metals, mail and scale, leathers, hides, cloth,
  woods, bone, horn, stone, skin, hair). Each is a grey grain picture tinted by the item's own game colour, so a gold
  sword and a voidiron one still differ; the picture's light and dark also raise the surface a little.
- The grain is laid on from three sides by position, so it is the same size on a ring as on a robe, with no seams.
- Some items choose a special picture: a relic's steel blade is engraved, leather grips are wrapped, a studded jerkin
  is brigandine, a plain one stitched, a gold crown filigree.
- The four heroes wear the faces Chris painted, laid on the front of the head like a mask and faded into his skin colour;
  their neck and bare hands take the same skin colour. Alondra's cloth band sits over her painted blindfold.
- A **Textures** button switches the pack off and on, to compare with the old surfaces.
- Size: the web copies are 2.5 MB (512 px WebP, `prototypes/hero-3d/textures/web/`, made by `textures/make.py`), 3.3 MB
  inside a page (`textures/pack.js`).

**Step 2, first part: Act One's twelve foes shaped to Chris's sheets.** The Bestiary:
https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY (commit c32ec2f; page version 2).

- Thornhound, briarling, boglurcher, glowcap, rotgrub, sapwight, the Gloamwing, Gorrow the Mire-King, Old Snag, the
  Rot-Stag, Briarmaw and the Rotwarden are each shaped by hand to their model sheet (`prototypes/bestiary/sculpt.js`):
  the wolf's vine of leaves and thorns, the briarling's leaf ball and one eye, the moth's patterned wings and bell, the
  toad's crown of reeds, the boar's axe in its back, the stag's golden crown in its antlers, the Rotwarden's armour,
  roots and branching helm.
- They are made of Chris's creature skins (16 pictures, 384 px grey grains, 0.5 MB: `skins/make.py`, `skins/pack.js`),
  tinted with colours read off the sheets; patches, stripes and spots are painted onto the shapes.
- A fix that helps everything: the modelling kit built tubes inside out, so the far inside wall was what showed (the
  flat, papery look). Every closed shape now faces outward; the heroes are rounder too (Gear Room version 6).

**Chris's comparison: painted standees or 3D.** The Bestiary: https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY
(commit 70f0341; page version 3). Opens on **Painted**; the switch at the top changes to **3D**.

- All 54 beasts as painted standees cut from Chris's sheets (`prototypes/bestiary/standees/cut.py`: background flood
  filled away, enclosed holes too, views split on empty columns, all three sharing one scale and ground line; 400 px
  WebP, 3.8 MB). `standee.js` stands them facing the camera, showing the front, side (mirrored for the other side) or
  back as the camera goes round, lit through a normal map made from each painting, with a soft shadow; they breathe,
  bob, and the **Lunge**, **Hit** and **Fall** buttons show leaning in, a shake and flash, tipping over and fading.
- For the Fight: `buildStandee(key, { tall })` returns `group`, `g`, `height`, `parts` (`body`: the whole, `face`:
  turned to the camera, `pose`: leans in the picture's plane, `shadow`), `update(t, step)`, plus `act.lunge` and
  `act.fall` (0 to 1, posed by update) and `hit()`. `hasStandee(key)` says whether a sheet exists (all 54 do).
- Size: the Bestiary page is now 10.4 MB (standees 5 MB inside it).

**The 39 people foes made as good as the heroes.** The Bestiary (People): https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY
- They already wore Chris's gear textures (same builder); now their faces read from across a fight (features half again
  as big, a scowl and stubble on the rough ones, face paint), and the looks their sprites carry that the 3D builder
  ignored are built: scarves and neckerchiefs, masks, shadowed faces with glowing eyes (the Tallymen, the Hollowed
  Rangers), head-wraps and turbans, antlers, feathers, buns, emblems, bandoliers of vials, satchels, sacks, ledgers and
  coin purses, lanterns at the belt, bone charms, the Hollow Council's held light, their own trousers, boots and buckles,
  a dwarf build. A coif of cloth or leather is now a hood of that stuff, not shiny mail. The heroes have none of these
  looks, so they are unchanged.

**The townsfolk, for Together.** The Bestiary, **Townsfolk**: https://claude.ai/artifact/CA6CcAKVHSxGPB5TAZF5sY
- Every one of M7's people (data/npcs.js, plus the looks with no name entry such as the gate guards and the miner: 53)
  made by the heroes' builder from the look their map sprite wears (art/map-sprites.js NPC_LOOKS, chosen as npcSheet
  chooses: Tamsin and Vesper in their battle looks, anyone without a look the map's villager for their name). New for
  them: wraps and turbans, fezzes, a miner's cap with its lamp, wide straw and witch's hats, a mourning veil (hair stays
  under all of them), aprons, trinkets at the hip (a pouch, gourd, bottle, ledger, basket of herbs, key), goggles,
  spectacles, a row of bottles, a coil of rope, a clasp, a braided beard, icicles.
- Two new poses in `setPose`: `'stand'` (arms easy, a weapon hanging by the leg, the weight shifting from foot to foot, a
  look round now and then) and `'talk'` (the same, with a hand that talks and a nod). Nothing existing changed.
- The function, for Together: `world3d/heroes.js` `person(npcId, detail = 'high')` returns the same walker shape as
  `actor()`: `{ id, name, role, root, hero, walkRun, talking, animate(phase, walking, t, dt) }`; standing it stands,
  `talking = true` makes it talk, walking it walks. Also on `window.M7_HEROES.person` and `M7_HEROES.PEOPLE` (every id).
  The builder underneath: `prototypes/hero-3d/people.js` `buildPerson(npcId, { build })` (buildHero's result plus
  `name`, `role`) and `personLook(npcId)`. `npcId` is a place's `people[].npc` (an `NPCS` id); an art key works too.
- For Together's `game3d/figures.js`: `prototypes/hero-3d/people.js` `personFigure(npcId, detail = 'light')` has
  exactly the shape of its `person()` (`{ root, height, rig, update(t, dt, walking) }`, plus `talking`, `name`,
  `role`), so it switches in by name: `import { personFigure as person } from '../prototypes/hero-3d/people.js'`.
  (heroes.js `person()` carries `rig`, `height` and `update(t, dt, walking)` too.)
- Size: heroes.js now reads the map sprites' looks, so a world page grows about 0.6 MB (Act One's Keep and Thornhollow:
  10.2 MB at --tex=768).

**Lighter heroes and people for phones.** Gear Room (the detail button now goes High, Light, **Lite**):
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- **Lite**: each figure in two draws. Every piece is merged into one skinned mesh whose "bones" are the rig's own nodes
  (so `setPose` moves it exactly as before) with one material for everything (each piece's colour, metal, roughness
  and glow kept per vertex), plus the face in a second mesh; built at 60% of Light's curve segments; grain pictures and
  see-through decals left off. From a few metres it looks the same (screenshots compared).
- **Auto**: Light within `LOD.near` (6 m) of the camera, Lite beyond; only the figure showing is posed. `'auto-high'`
  is the same with High close up (laptops).
- Measured, the party of four alone (Gear Room): High 480k triangles, 163 meshes; Light 110k, 143; **Lite 46k, 8**.
- Measured on Act One's page (Keep and Thornhollow at --tex=768, the party in view, the page's own counter), by
  passing the detail through `actor()` from a test script (the page itself is the hub's):

  | | draw calls | triangles |
  |---|---|---|
  | phone, as the page is now ('light') | 113 | 99k |
  | phone, walkers 'lite' | **33** | 82k |
  | phone, 'auto' | 39 | 65k |
  | laptop, as now ('high' leader, 'light' followers) | 176 | 251k |
  | laptop, 'auto' | 126 | 129k |

- How to use it (the pages are the hub's, so nothing switches until a page asks): `actor(id, gear, detail)`,
  `person(npcId, detail)` and `personFigure(npcId, detail)` take `'high'`, `'light'` (as before), `'lite'`, `'auto'` or
  `'auto-high'`. Suggested: phone `m7places.js` / `aethermoor.js` followers and townsfolk `'lite'` and the leader
  `'auto'`; laptop leader `'auto-high'`, followers `'auto'`. `window.M7_HEROES.LOD.near` tunes the distance.
- For the Fight (`world3d/battle`, which calls `buildHero` itself): `buildHero(id, gear, { lite: true })` makes the lite
  figure (set `Q.d = 0.6` first for its fewer triangles, as `people.js` `buildLod` does), or use
  `buildLod(lite => buildHero(id, gear, { lite }), 'auto')` from `prototypes/hero-3d/people.js` and pose
  `L.pick().rig` each frame. The rig is the same; only its meshes differ.

**Faces that live.** Gear Room (the **Face** button steps through them): https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- Every hero, person foe and townsperson blinks on its own every few seconds, talks with its mouth while talking, and
  makes six expressions: `'cheer'`, `'effort'` (gritted, narrowed eyes), `'hurt'` (a wince, teeth), `'worried'` (brows
  up at the middle, a frown), `'asleep'` (eyes shut, a fallen hero) and `'neutral'`; `'talk'` talks without the pose.
- How: eyelids and a mouth are drawn in the face's own shader over its picture (Chris's four faces, measured where
  their eyes and mouths are; faceTexture's for everyone else), so an expression costs a few numbers a frame, never a new
  picture. Works the same in High, Light and Lite. Blindfolded and shadowed faces keep their eyes as they are (the mouth
  still moves).
- API for the Fight and Together: `figure.face(expr, seconds)` on buildHero's result, on `actor()` and `person()`
  walkers, and on `personFigure()` (seconds omitted: until the next call). It runs inside `setPose`, which every page
  already calls each frame; the mouth talks while the pose is `'talk'` (`talking = true` on walkers) or
  `rig.faceCtl.talking` is true. Suggested: `'effort'` for the strike, `'hurt'` for a second when hit, `'asleep'` while
  fallen, `'cheer'` on victory, `'worried'` when low.

**Every item, checked on the heroes.** Gear Room, **Item audit** (top of the panel): https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- The audit lists all 458 things M7 can roll or hand out: the 41 bases at all 8 rarities, every weapon tempered +7 and
  +10, the 75 Codex relics and every starter piece, each on the hero it suits (`audit.js`). Each card builds the item,
  checks it, and shows a picture as it scrolls into view; tap one to put it on the hero above for a close look. Filters:
  all, flagged, weapons, off hand, head, body, hands, feet, amulets and rings, relics.
- The checks: the build fails, no look, an empty or tiny weapon, a weapon not in the fist (to the surface, within 5 cm),
  an off-hand piece not held, hair through a helm, kettle hat, coif or hood, a rare piece that is plain, a ring not shown.
- What was wrong, and fixed:
  - Rings were never shown on the 3D heroes. Now a band on the left hand's ring finger, its gem facing out.
  - Every relic amulet looked the same small disc (the 3D builder only knew the sun). Each now has its own shape from its
    art: the Warden's Seal's sun and rays, the First Seed's glowing seed with leaf and bud, Zara's orrery rings and
    planet, the Mirage Glass lens with runes, the Sunstone Heart, the Veilbell, the Anvil Heart's cage of ribs, Hodge's
    toll coin, the Deep-Pearl in coral and barnacles, the Hollow Chain's badge of office with its tally (heavier links),
    plus seals. Pendants are a little bigger.
  - An amulet's chain went under a mantle or pelt (Alondra's). It now lies over it.
  - Tempered +7 and +10 metal glowed flat cream; the glow is now softer and in the metal's own deep colour, so it still
    shines.
  - The Hollow Chalice stood taller than its bearer's head; it is a fifth smaller.
  - Not wrong, for the record: Fenwick's Poker looked to float (the check measured to corners only); its rod runs through
    the fist.
- Checked: all 458 build and pass the checks (no flags), and I looked at every picture.

**Things that swing.** Gear Room, **Walk about** (walking a figure of eight, running, a dead stop):
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- Capes (in two hinged halves, so the hem swings further than the shoulders), long hair down the back, ponytails and
  braids, skirts and robes (they now turn about the waist), quivers, belt pouches, scarf ends and tails, satchels,
  sacks, ledgers, lanterns, trinkets and charms each hang from a pivot of their own with a spring: they lag when the
  figure starts, fly back when it runs, swing on when it stops or turns, and react to the fight's strikes and hits, within
  limits that keep them out of the body and legs (a cape never swings forward into the back, front pieces never back
  into the belly).
- It is all inside `setPose` (`swing()` at its end), so every page has it with no change; it works in High, Light and
  Lite (the pivots are Lite's bones). `SWING_ON.on = false` (model.js) turns it off. Locks framing the face stay put.
- Cost, measured (`__swingCost()` in the Gear Room, setPose 2000 times with and without): 2 to 5 swinging pieces per
  hero, about 0.005 to 0.015 ms more per figure per frame (High 0.010 to 0.018 ms with it, against 0.002 to 0.005
  without); for a party of four and ten townsfolk, about 0.15 ms a frame. No extra draws.
- For the Fight and Together: nothing to do; a figure that moves through the world (its group or root moving) swings
  by itself, and a figure standing on the spot sways only with its own pose.

**Sculpted heroes, side by side with the full-detail Briarmaw** (November 21). Gear Room, **Beside Briarmaw** and
**Sculpted** on or off: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- The foes are sculpted once and baked onto one fixed model. The heroes can't be: every piece is built in code from the
  item's own numbers and can be switched. So the sculpting goes into each *kind* of piece, and every item of that kind
  gets it:
  - **Relief tiles per surface** (`textures/relief.py`, 10 tiles of 256 px, 232 KB): metal hammer dents and
    scratches, leather creases and pebbling, hide wrinkles and pores, cloth weave and wrinkles, wood carved grain along
    the haft, stone chips, bone growth rings and pits, horn ridges, hair strands, skin pores. Each holds a height (lit
    like a normal map) and a cavity (darkens the bottom of each crease or dent, the occlusion a sculpt bake gives).
    They are laid on in 3D (triplanar) at their own scale, over the grain picture from Chris's pack, so any piece of any
    shape gets them with no unwrapping.
  - **Sculpted shapes**: the head has a nose, brow, eye sockets, cheekbones, lips and chin pushed out of the skull
    (lined up with each face's painted features); hems and capes fold more deeply (the cape has 24 columns, 40 at High,
    up from 14); loose hair grows in grooved locks (not under headgear, where the grooves would come through).
- Kept: High, Light and Lite with the same pieces and draws (Wren: 48 pieces High, 40 Light, 2 Lite; no new draws), the
  faces and their expressions, the swing, and every item switchable. Triangles: Wren High 143k to 156k, Light 34.5k
  to 36.7k, Lite 15.1k to 15.9k. Each surface does three more texture reads per pixel.
- Briarmaw stands beside her at his true size (session 6's light model and pictures from `prototypes/foe-hd/`, loaded
  through their kit; idling with their moves). He is 50k triangles from a 983k sculpt; Wren at High is 156k.
- Honest comparison: Briarmaw's surface comes from a real sculpt, so up close he is richer. The heroes are now
  crisper (creases, folds, dents, a shaped face) but read as clean storybook figures more than sculpts. The next step,
  if wanted: sculpt a high-detail master of each body part and item kind (a head, a tunic, a boot, a kettle hat...)
  and bake a normal and occlusion map per kind, fitted to the code-built piece.
- `SCULPT.on` (model.js) and `MACRO_ON.on` (kit.js) turn it off; the **Sculpted** button does both.

**Sculpted masters per piece kind, baked: Wren's starter kit** (November 21). Gear Room, **Beside Briarmaw**, **The
sculpt** (the full-detail sculpt itself) and **Sculpted** on or off: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- How it keeps every item switchable: each *kind* of piece has one sculpted master, made in the piece's own surface
  coordinates (round it and along it, the way the code builds every piece of that kind). The master fits any boot, any
  trouser leg, any kettle hat, whatever its size, colour or material. `masters/sculpt.py` makes them; `fitMaster(geo,
  kind)` (kit.js) fits a piece to its master.
- The eleven masters so far (Wren's starter kit): torso (drape, side seams, hemmed neck and waist), skirt (folds
  opening to the hem, a stitched hem, gathers under the belt), sleeve and forearm (elbow wrinkles, the seam under the
  arm, a stitched cuff), trousers (knee, seat and ankle wrinkles, seams), boot (a turned top, ankle creases, a seam up
  the back), foot (a stitched toe cap, the flex, the welt), belt (stitched edges, the holes by the buckle), tabard
  (drape, an embroidered border, a hem), cape (long folds, gathered at the shoulders, hems) and kettle hat (hammered
  dents, scratches, the band and the rolled lip).
- **The sculpt (the asset you can look at):** "The sculpt" in the Gear Room cuts Wren's real pieces into fine
  triangles and raises them by their masters: **908,000 triangles** for the whole hero (Chris: 500k to 1M), made in
  about 0.35 s. The masters themselves are kept as 16-bit height pictures (`masters/src/*.png`, 1024 px each).
- **The bake (what the game uses):** each master's slopes (a normal map) and occlusion (dark in the creases), 256 px a
  kind, in one shared 1024 px picture (`masters/atlas.webp`, **218 KB**, about 290 KB inside a page). It sits on the
  pieces' existing materials, so there are **no new materials and no new draws**: Wren 48 pieces and 218 draws at High,
  40 and 100 at Light, 2 and 24 at Lite, as before. Triangles in the game: unchanged by the masters (Wren High 144k).
  Five cells are free for the next kinds (helm, hood, gloves, robe, mantle).
- What it adds to a page: the atlas 290 KB plus the relief tiles 316 KB (the earlier step), about 0.6 MB. The sculpt
  view's heights (`masters/heights.js`, 210 KB) are only in the Gear Room. **For the hub:** `--herotex=256` shrinks
  every hero picture, the atlas too (its cells would drop to 64 px, so the detail softens). If the Act One page needs
  `--herotex`, a flag that leaves `masters/atlas` at full size would keep it (or the `--files` way).
- Stays: every item switchable, the faces and expressions, the swing, the storybook shape. Lite (2 draws) doesn't carry
  the masters; Light and High do. The stretching check: nothing stretches (every piece rigid on one node; Lite weights
  one node per vertex).
- Briarmaw beside her, honestly: closer now. The cloth folds, seams, creases and dents read at a glance, but his
  sculpt is still deeper and busier, and he has his own painted colour map. Next: masters for the remaining kinds
  (helm, hood, coif, gloves, robe, mantle, plate, the shield's face and the weapons' grips), then the people foes and
  townsfolk, who share them all.

**More masters: helm, hood and coif, mantle, gloves, robe, plate, the shield's face, grips** (November 21). Gear Room,
same buttons: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- Twelve more kinds, 23 in all: helm (a comb over the crown, a riveted band, breaths beside the mouth, a rolled edge),
  hood and coif (seams over the crown and down the back, a turned hem round the face, bunched at the neck), mantle (also
  a hood's drape and a pelt: gathered at the neck, a stitched hem), glove (knuckle wrinkles, seams, the wrist) and finger
  (knuckle creases; bare hands too), robe sleeve (deep folds, an embroidered cuff), plate (broad dents, scratches,
  rivets along both edges), lame (rivets, a rolled edge), vambrace (also greaves: rolled ends, rivets, the hinge line),
  pauldron (a rolled edge, a ring of rivets), the shield's face (six boards, two battens of nails, knocks toward the rim)
  and the grip (leather wound round it).
- The atlas is now 4 x 6 cells of 256 px, 1024 x 1536, **366 KB** (about 490 KB in a page), still one picture in
  `masters/pack.js`. One cell is free.
- A piece now carries its master's place in its own attribute (`mUv`), so pieces with a painted picture of their own
  keep it: the shields' painted faces wear the boards and nails over their paint (`withMaster(material)` in kit.js).
- Still no new materials or draws (Wren 48 pieces, 218 / 100 / 24 draws at High / Light / Lite). Item audit 458 items,
  0 flags. The sculpt view: 915,000 triangles. Bestiary builds (11.7 MB).
- Next: the townsfolk's and people foes' own pieces (scarves, masks, aprons, sashes, wraps, hats, satchels, the foes'
  looks), which already share every master above.

**Every item sculpted: the masters' audit** (November 21). The Gear Room's debug build
(`node build.mjs --debug`) logs every piece each of the 458 items adds and whether it wears a master; the coverage
script adds up the bare area by the line of code that made it.
- Before: 77% of the items' surface wore a master. Now: **92%**. Nine more kinds made (32 in all): hair lock (and the
  hair's cap), the shoulder under a sleeve, haft (wood grain, splits, knots, knocks; also staves and bows' limbs),
  braid (cloth and leather trims, cords, the cape's tie), rim (metal rims, trims, guards, ridges, the shields' rims,
  metal hafts), strap (boot straps, pouches and their flaps, sashes), blade (the edge's bevel line, grinding along the
  blade, nicks in the edges, hammering by the hilt), forged (axe, spear, mace and hammer heads, flanges, sockets,
  pommels, butts: hammer dents and grinding arcs, laid on flat) and the glove's cuff and the hood's tip.
- What is still bare, and why: the boot soles (a box under the foot, never seen), the fine wire wound round grips, the
  rivets, gem settings and the amulet chains' links (too small for a master to show). The rest is a few percent of
  small staff-head and helm details.
- The atlas: 4 x 8 cells of 256 px, 1024 x 2048, 464 KB, in `masters/pack.js`. One cell free. Still no new
  materials or draws (Wren 48 pieces, 218 / 100 / 24). Item audit: 458 items, 0 flags.

**The townsfolk and people foes wear the masters** (November 21). They are built by the heroes' builder, so they
share every kind. The same coverage check over the 39 people foes and the townsfolk: **92%** of their surface wears a
master. More than half of the rest is boot soles (never seen); the scarves, aprons and head wraps (and the wraps' and
turbans' bands) are now fitted too (braid, tabard). Side by side with Wren (cutpurse, ash-wight, Hollow Brundar,
Fenwick, Durra): the same folds, seams, dents and grain at the same scale. The Gear Room can now build any of them
(`window.__people`); a picker for Chris comes with step 4.

**Faces and hands, and anyone in full detail** (November 21). Gear Room: https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- Faces: the head's sculpted shape (nose, brow, sockets, cheekbones, lips, chin) was already placed by each painted
  face's own features. Now the skull also wears a head master: fine skin and pores, finer away from the face. It is
  laid under Chris's painted face, after the face's living shader (blinks, mouth, expressions), so the approved faces
  look the same and keep moving. `withMaster` now keeps a material's own shader and runs after it.
- Hands: bare hands now have their own master (knuckles, tendons on the back, the wrist's creases; before they wore the
  glove's seams); gloved hands keep the glove's. Fingers and thumbs keep the finger master (knuckle creases).
- **Anyone in full detail:** a picker in the Gear Room ("Anyone in full detail") lists the four heroes, all
  the townsfolk and all the people foes (96). Choosing one builds them in their own outfit, with their own game
  sprite in the corner, at High, Light or Lite; **The sculpt** then shows their whole sculpt (a people foe: about
  930,000 triangles). The heroes' tabs or the picker bring the heroes back with their gear.
- Atlas: 4 x 9 cells, 1024 x 2304, 512 KB (34 kinds, two cells free), in `masters/pack.js`. Same pieces and draws
  (Wren 48; 218 / 100 / 24). Item audit 458 items, 0 flags. Bestiary builds (11.9 MB). Gear Room 9.2 MB (the people
  foes' and townsfolk's looks and sprites are in it now).

**The wraiths, first pass: all eleven** (November 21; the lane moved here from session 6). Gallery:
https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD (each beside Chris's sheet, turning; its moves; "The sculpt"; a crowd
of twelve at the fight's detail). Code: `prototypes/wraiths/` (`wraiths.js`, README).
- Built from the heroes' kit, wearing the sculpted masters (robe, skirt, hood, mantle, cape, sleeves, hands, hafts,
  forged metal), shaped to the sheets: the Drowned (weed head lit with drowned lights, torn coat, trousers and boots, a
  green bell), the Bell-Ringer (stone collar, coral crown, weed and skulls at the hem, its bell on an iron crook), the
  Drowned Choir (red cassock, lace surplice, skull-and-weed head, a brass bell held at the breast), the Drowned Cantor
  (hood, sun-eyed mask, coral, pearl collar, green cope with gold bands, coral staff), the Drowned Abbess (veil, blue
  face with glowing eyes, three scalloped tiers, bead belt, blue lantern), the Choir-Wraith (pointed hood, singing mask
  breathing blue mist, studded tiers, hymn book), the Rime-Wraith (frozen tattered cloak, weeping face, icicles, rope
  belt, a hem of blue water), the Rime-Abbot (braided cowl, ice grille, frost-edged tasselled cope, the Rime Crozier
  with its blue lantern), the Lantern Mother (dress, coat and buttons, belt and pouch, apron, fringed shawl, hood and
  flower crown, glowing eyes, her lantern and her hooked lamp-pole with its bell), the Mirage-Wisp (living water, a
  flame crown, hollow eyes, a crystal heart) and the Wisp-Queen (rows of flame locks, mask, silver crown, blue jewel).
- Mist round the hems of the rime ones, the Abbess and the Choir-Wraith, and round the wisps; lanterns, eyes, crystals
  and water glow, and flare or dim with the moves.
- Nothing stretches: every piece is rigid on one moving part (no skinning). The kit's `stretch.mjs` works on skinned
  models, so it has nothing to check here.
- Moves: the kit's common set (idle, walk, bite, strike, swipe, cast, roar, hurt, ko) for all, and the Champions' own
  named for M7's: the Rime-Abbot's crozier-strike, toll, rime-ward, drown, call-the-choir, hushing, heartbeat,
  rime-nova; the Lantern Mother's lamp-pole, lure, lantern-flare, hush-now, lead-them-down, moths, mourning, snuff,
  lantern-nova, drown-the-light. **For the Fight:** `setBeastLook(withWraiths(foeLook(buildBeast)))`;
  `wraithLook(key, sprite, opts)` returns the arena's shape (with `pose`, `moves.MOVES`, `duration`, `hit`, `act`).
- Triangles (High / Light, the fight's detail): Drowned 40k / 10k, Bell-Ringer 96k / 23k, Drowned Choir 33k / 10k,
  Drowned Cantor 97k / 28k, Drowned Abbess 39k / 12k, Choir-Wraith 52k / 15k, Rime-Wraith 23k / 9k, Rime-Abbot 25k /
  10k, Lantern Mother 33k / 11k, Mirage-Wisp 9k / 3k, Wisp-Queen 59k / 10k. Pieces 9 to 24 each. All under the
  Champion budget; the Bell-Ringer and the Cantor are over the rabble ~20k at Light (their coral branches: a later pass
  thins them). The sculpt: about 900,000 triangles each. Gallery 6.7 MB, no horizontal scroll at 390 px.
- Honestly, a first pass: the silhouettes, colours and props follow the sheets; the robes are still smoother and more
  regular than the painted rags, and the faces simpler. Next: deeper tatters and layered rags, the sheets' embroidery
  and lace patterns, then hand the Fight its build plugin entry.

**The wraiths, second pass** (November 21). Gallery republished: https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD
- Rags: hems now tear unevenly (mostly short, now and then a long strip, torn in points rather than a saw) and the
  tattered ones hang one or two shorter, deeper-torn layers over their robes (the Drowned's coat, the Bell-Ringer, the
  Choir's cassock, the Cantor, the Choir-Wraith's lower tier, the Rime-Wraith's robe and capelet).
- Lace and embroidery: two new sculpted masters (35 kinds in all): **lace** (rows of eyelets and little four-eyelet
  flowers toward a scalloped hem: the Choir's surplice) and **embroid** (vines of raised thread climbing from the hem:
  the Cantor's cope, the Abbot's cope). The atlas is now 566 KB.
- Faces closer to the sheets: a face with a brow, nose, cheekbones, sunk sockets, eyes, a mouth and, for the weepers,
  tear-tracks of light: the Abbess (glowing eyes, blue tears), the Rime-Wraith (dark eyes, open mouth, tears), the
  Lantern Mother (amber eyes); the Abbess's veil now ends at her belt, as on the sheet.
- Thinned: the coral crowns lose a branching level at the fight's detail. At Light now: Drowned 12k, Bell-Ringer 13k
  (was 23k), Drowned Choir 11k, Drowned Cantor 15k (was 28k), Drowned Abbess 14k, Choir-Wraith 16k, Rime-Wraith 13k,
  Rime-Abbot 10k, Lantern Mother 13k, Mirage-Wisp 3k, Wisp-Queen 10k: **all under the rabble ~20k**. High 9k to 98k.
- Still to come: the Abbot's braided cowl and layered frosty cope, the Bell-Ringer's heavier draped folds, and more of
  the sheets' painted pattern (the Abbess's wave-edged tiers, the Choir-Wraith's arched panels).

**The wraiths, third pass** (November 21). Gallery republished: https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD
- The Rime-Abbot: a braided cowl (plaits of two twisted strands round the face and back over the crown), and a frosty
  capelet over the cope to the elbows, scalloped, embroidered, edged in rime and hung with tassels; icicles at the
  cope's hem.
- The Bell-Ringer: heavier drapes (broad deep folds over the small ones, the robe wider at the hem).
- The Abbess: wave-edged tiers, each hem rolled in pale sea-foam cloth, in soft waves as on the sheet.
- The Choir-Wraith: arched panels (each tier's hem cut in twelve arches, a seam down to where two arches meet, studs
  along each tier).
- At Light (the fight's detail): Drowned 12k, Bell-Ringer 13k, Choir 11k, Cantor 15k, Abbess 16k, Choir-Wraith 18k,
  Rime-Wraith 13k, Rime-Abbot 19k (a Champion), Lantern Mother 13k, Mirage-Wisp 3k, Wisp-Queen 10k: all under 20k.
  Same look shape and moves for the Fight.

**The ironclad, first pass: the Iron Sentinel, the Sentinel-Captain, the Ashen Warden, the Unsmith** (November 23;
from session 8's list). Gallery: https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD. Code: `prototypes/armoured/`
(`armoured.js`, README).
- The constructs: rounded riveted plate on a stocky walking rig (hips, chest, head, shoulders, elbows, fists, legs with
  knees), gold bands and rivets, great pauldrons, fists and boots, a glowing core: the Iron Sentinel (castle helm with
  a burning slit, a gear on its breast, a round bossed shield), the Sentinel-Captain (visored helm with bolted cheeks
  and a gold plume, a fleur, Ironwall the tall shield), the Ashen Warden (bronze-dark plate, a great helm under the
  Cinder Crown, the Ashen Aegis with its burning emblem, a sword whose cracks burn, a torn cape of ash, ash rising at
  its feet). Their shields and swords stay upright in the hand as the arms move.
- The Unsmith: a person, by the heroes' own builder (face, beard, hands, leather apron, black cloak), with the Unmaking
  Hammer (cracked with violet fire) and the Worldforge Heart burning in his chest; his face takes effort when the heart
  flares and winces when hit. Honestly, he reads younger and leaner than Chris's sheet (the builder's face and build):
  a later pass gives him the wild hair, big beard and broad shoulders.
- Nothing stretches: every piece rigid on one moving part. For the Fight: `setBeastLook(withArmoured(withWraiths(
  foeLook(buildBeast))))`; moves: the common set and each one's own, named for M7's (the Sentinel: iron-fist,
  gate-slam, lock-shields; the Captain: those and ironwall, shield-rush; the Ashen Warden: ash-blade, ember-sweep,
  ward-of-ash, call-the-watch, command-of-cinders, scorch-the-vault, watch-unbroken; the Unsmith: hammer-blow,
  ring-the-anvil, unmake, forge-apron, nothing-left, worldfire, hearts-pull, heart-flare).
- Triangles (High / Light): Iron Sentinel 80k / 25k (veteran ~30k), Sentinel-Captain 82k / 25k, Ashen Warden 94k / 30k
  (Champion ~50k), the Unsmith 110k / 23k. The sculpts: Ashen Warden 893k, the Unsmith 845k. Gallery 6.9 MB, no
  horizontal scroll at 390 px, no page errors.

**The ironclad, second pass** (November 23). Gallery republished: https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD
- The Unsmith closer to his sheet: his own sculpted head in place of the builder's painted face (older and heavier:
  brow, a broad nose, cheekbones, deep-set eyes), bushy copper brows and a moustache, a great beard with gold beads
  plaited in, wild copper hair swept back over the crown, broad shoulders (a wider chest, the arms set further out,
  set once as built: nothing scales as he moves) and a heavy ragged mantle torn in layers over his shoulders; the
  Unmaking Hammer's head made bigger, dark violet stone with its cracks burning.
- The constructs against their sheets: a new sculpted master, **battered** (36 kinds in all, the atlas full: 578 KB):
  big and small dents from blows, gouges where blades skidded, fine scratches, patches of soot, on all their plate
  (chest, hips, arms, legs, helms, pauldrons). The Ashen Warden keeps embers in the seams of its plate; the
  Sentinel-Captain's plume is now the sheet's great swept crest.
- Triangles (High / Light): Iron Sentinel 80k / 25k, Sentinel-Captain 85k / 26k, Ashen Warden 99k / 31k, the Unsmith
  113k / 26k; sculpts about 900k (Warden 898k, Unsmith 915k). Every move poses with no errors; no horizontal scroll.

**The stone and forge constructs, first pass** (November 23; from session 8's list). In the ironclad gallery (now ten):
https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD
- Three new sculpted masters (39 kinds; the atlas grown to 4 x 12 cells, still one picture in `masters/pack.js`, 632
  KB): **brick** (courses of firebrick, mortar, chipped corners, soot), **slag** (lumpy, pitted, deep cracks) and
  **ashflake** (packed ash in overlapping flakes).
- The Cinder-Thrall (ash in flakes, a rag over its burning eyes, a coal heart, fire in its cracks), the Thrall-Overseer
  (slag, a smith's iron mask set in its chest, burning spikes, one lit eye on a bent stalk, glowing ankle cuffs, a
  loincloth, the hot chain), the Forgeborn (black slag split with fire, a furnace grille in its chest, rock shoulders
  with lit slits, belt and buckle, a burning crown of flame), the Bellows (a strapped swollen body, a round furnace grate,
  a brass pipe curling over into the chimney that is its head), Harrow's Journeyman (a person, by the heroes' builder:
  masked, mantled and cloaked, with the Runestaff and its compass-star and tags) and the Forge-Warden (a kiln of
  firebrick with a fire-door, an anvil head, a burning chimney with smoke, a bellows at its side, a hammer arm and a
  fist on jointed iron arms, stubby iron legs). Glowing cracks are rigid lines of fire on each piece, so they move with it.
- Moves, named for M7's: the Thrall: cinder-fist, ash-in-the-eyes, reform; the Overseer: those and hot-chain,
  drive-them; the Forgeborn: molten-fist, slag-spit, stoke; the Bellows: those and bellows-blast, blow-sparks; the
  Journeyman: those and smiths-hammer, temper-kin, rune-fire, white-heat; the Forge-Warden: hammer-arm, bellows-breath,
  hold-the-bridge, stoke. Same `armouredLook` / `withArmoured` for the Fight.
- Triangles (High / Light): Cinder-Thrall 18k / 9k (rabble ~20k), Thrall-Overseer 33k / 13k, Forgeborn 21k / 10k,
  Bellows 18k / 10k, Forge-Warden 31k / 12k (veterans ~30k), the Journeyman 122k / 26k (Relic-Bearer ~40k). Sculpts
  ~850-910k. Honestly, a first pass: the golems' limbs are still blocky beside the sheets' lumpy rock and shingled ash,
  the Journeyman reads plainer than his sheet (no fur collar or wild hair yet), the Bellows' harness is simpler.

**The stone and forge constructs, second pass** (November 23). Gallery republished:
https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD
- Lumpier rock: every golem's trunk and limbs are pushed in and out with smooth bumps (rock, not boxes), and the slag
  ones carry boulders on their shoulders and forearms.
- Shingled ash: the Cinder-Thrall is laid over in rows of overlapping ash flakes, each tilted out at its lower edge, on
  its chest, hips, arms and legs (a few triangles each; there are hundreds).
- The Journeyman: a fur collar of tufts laid out and down over his shoulders, and wild dark hair swept back over his head.
- The Bellows: a fuller harness: straps over each shoulder crossing in a Y down the back, brass rings and buckles where
  they meet, a brass plate with lit slits on the back, leg straps with buckles, leather shoulder pads.
- At Light: Cinder-Thrall 15k (rabble ~20k), Thrall-Overseer 13k, Forgeborn 11k, Bellows 14k, Forge-Warden 12k, the
  Journeyman 30k (Relic-Bearer ~40k). Sculpts about 900k.

**The winged, first pass** (November 23; from session 7's list). A new gallery: https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg
(`prototypes/winged/`)
- Three new sculpted masters (42 kinds; still one picture in `masters/pack.js`, 697 KB): **feather** (a quill ridge and
  angled barbs, a few splits), **mothwing** (rows of tiny overlapping scales and fine veins) and **plumage** (a coat of
  small overlapping feathers, or a moth's furry scales).
- The Lamp-Moth: dun and pale-gold wings mottled like the sheet with amber eyespots, a furry thorax and head, big amber
  eyes, comb antennae, six long legs, and a lamp burning in the last segments of its tail.
- The Gloamwing: lavender-grey wings with gold eyespots, a pale wavy band, scalloped dark borders; snowy fur; gold
  plumed antennae; the Dawnbell on braided cords crossed over its chest, knotted in a gold quatrefoil on its back, the
  bell on its own pendulum with tassels (it always hangs straight down).
- The Thunder-Roc: storm-blue wings raised like the sheet, three jointed spars with every feather a rigid blade (pale
  sky-blue leading edge), a pale scalloped breast, a spiky crest, a gold hooked beak and a fierce pale eye, a fan tail,
  feathered thighs, gold scaled legs, black claws, the shepherd's feather cloak with its woven strips and beads on its
  left foot, and sparks that flicker in its pinions.
- Nothing stretches: moth wings are stiff membranes hinged at the root, the abdomen is insect segments, legs are rigid
  parts; the Roc's wing folds and spreads by its joints.
- Moves: M7's own (the Lamp-Moth: batter, dust, circle; the Gloamwing: wing-buffet, dreamdust, cocoon, bell-hum; the
  Roc: talons, wing-gale, carry-off, storm-mantle), flight (hover, swoop, dive, land) and the common ones.
  `wingedLook` / `withWinged` for the Fight, chained like `withArmoured`. The moths hover on their own.
- Triangles (High / Light): Lamp-Moth 70k / 21k (rabble ~20k), the Gloamwing 90k / 27k, the Thunder-Roc 124k / 39k
  (Relic-Bearers ~40k); same draws at both. Sculpts 830k to 980k. Every move poses with no errors; 390 px phone, no
  horizontal scroll.

**The winged, second pass: the Roc** (November 23). Gallery republished: https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg
- One fluffy coat: the Roc's body is now laid over in staggered rows of small feathers that lie along its shape (down
  the body's own slope, lifted a little at the tip), so they overlap into one coat instead of tiers; the pale breast
  is the same, smaller and scalloped. A feathered knee covers the joint of the raised leg.
- The cloak: its feathers fan out from the talon like the sheet's, five of them carrying pale woven strips with a dark
  border and a stepped key pattern (painted on, one rigid strip each), each strip ending in two little tassels and a
  gold bead; one binding near the top.
- At Light 38k (Relic-Bearer ~40k); the sculpt about 1.0M. Same draws at High and Light.

**Back over the foes against their sheets: the Ashen Warden and the Unsmith** (November 24). Ironclad gallery
republished: https://claude.ai/artifact/4WQXpMifD5GWsgCXTP4PVD
- The Ashen Warden is no longer a box robot but a stocky knight in shaped plate, like its sheet:
  - a curved cuirass with a keel, gold edging and scrollwork, and the gate-and-flame on its breast;
  - three faulds, two belts with gold buckles, and tassets on the thighs;
  - pauldrons of three lames, couters, vambraces, and gauntlets with curled fingers;
  - cuisses, poleyns, greaves, and pointed sabatons of four lames;
  - a rounded great helm with a burning slit and a gold ridge, under a crown of towers;
  - a long, ragged cloak of ash, the Ashen Aegis (gate, towers and flame), and the burning sword.

  At Light 39k (Champion ~50k).
- The Unsmith:
  - brown trousers and boots;
  - his leather apron made full (a bib to below the knee) and dark, with the gold anvil, rivets and a pocket;
  - the ragged black mantle now open at the front so the apron shows;
  - the Unmaking Hammer's head now lies across the haft like the sheet's: a lumpy stone-iron block with iron faces and
    violet cracks.

  At Light 29k.
- `model.js` takes optional `pantsTint`, `bootsTint`, `cloakTint`, `apronTint`, `apronW` and `apronDrop` in a look's
  `H`. The heroes don't use them, so the heroes are unchanged; the Gear Room loads with no errors.
- Still open: the Unsmith has 51 draws at High and 47 at Light. The 4-draw gap was already there before this pass, and
  I haven't tracked it down yet.

**Back over the foes against their sheets: the Rime-Abbot and the Lantern Mother** (November 24). Wraiths gallery
republished: https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD
- The Rime-Abbot:
  - a bigger cowl with thick braids round the face;
  - a pale mask of rime behind a grille of icicles under three pointed arches;
  - a silver-ringed blue brooch at the throat, with strands of beads and tassels;
  - zigzags of frost along the cope's hem and the capelet's, and a snowflake on its back;
  - the crozier darker, banded with blocks of ice (it bloomed white before).

  At Light 23k.
- The Lantern Mother:
  - the knitted shawl draped to a point in front and behind, with a long fringe of tassels;
  - a double row of gold buttons;
  - a long apron embroidered with a stem of leaves, with lace at its hem;
  - a fuller, deeper-folded skirt;
  - her lantern raised to head height like the sheet.

  At Light 16k.
- Still open: the Abbot's cowl is squarer than the sheet's drooping hood; the Mother's lantern is a plain square one,
  not the sheet's pointed Gothic lantern.

**Back over the foes against their sheets: the Gloamwing and the Thunder-Roc again; the Mother's lantern** (November
24). Winged gallery https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg and wraiths gallery
https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD republished.
- The Gloamwing:
  - Its thorax, head and every abdomen segment are now one coat of soft feathery scales lying along the body, so it is
    the sheet's chunky ball of fur (from behind no longer a bare striped cone).
  - Its plumed antennae sweep out to the sides like the sheet's.
  - The gold quatrefoil on its back is bigger, with a ring.
  - At Light 38k.
- The Thunder-Roc:
  - A shaggy crest of short spikes over the back of its head, under the long spikes.
  - A broader tail fan (fourteen feathers).
  - A deeper, sharper eagle's beak.
  - At Light 39.6k.
- The Lantern Mother's lantern is now Gothic: a pointed four-sided roof with a finial, and pointed arches over its
  windows. It hangs on a short chain below her hand, like the sheet's.
- Still open: the Rime-Abbot's cowl (squarer than the sheet's drooping hood).

**The heroes in the Gear Room, beside the foes** (November 24). Gear Room republished:
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL
- The plainest pieces beside the foes were the robes and the boots, so every robe and boot item gets these (all items
  stay switchable; nothing is fixed on one hero):
  - every robe: deeper folds at the hem; a deep hem band in the item's trim colour with a line of zigzag embroidery
    above it; trimmed cuffs on its wide sleeves; a robe with a cloth trim also wears a fringed stole from the shoulders
    down the front (Bryn's green);
  - every boot: a heel, and a turned cuff at the top (unless the item already has a fold or a greave).
- Checks: the item audit 458 items, 0 flags. Draw calls at High, Light and Lite are 226, 104 and 24 (were 218, 100,
  24): the new pieces show at every level.
- Still plainer than the foes: the robes' bodies between the hem and the belt, and the heads' storybook shape, which is
  kept on purpose (Chris's choice).

**The robes' bodies, and the Rime-Abbot's drooping hood** (November 24). Gear Room
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL and wraiths gallery
https://claude.ai/artifact/KiYfGSBcUQ6gU4WqVKGojD republished.
- Every robe's skirt:
  - is sewn from panels: four seams in the trim's colour run down from the belt to the hem band;
  - is pleated from the belt down (the folds start at the waist instead of only at the hem).
- The Rime-Abbot's cowl:
  - its sides flare out onto the shoulders;
  - its tip rises from the crown and droops back and down behind, like the sheet's.

  At Light 24k.
- Checks: item audit 458 items, 0 flags; no horizontal scroll at 390 px.
- `model.js` goes into every page, so its size is counted.

  | `model.js`                 | Source        | Minified      |
  |----------------------------|---------------|---------------|
  | Before the robes and boots | 107,516 bytes | 62,249 bytes  |
  | After the robes and boots  | 110,533 bytes | 63,931 bytes  |
  | Now                        | 110,858 bytes | 64,071 bytes  |
  | Change across both steps   | +3,342 bytes  | +1,822 bytes  |

**Chris's notes, November 24: the winged flap slower; the hand-over** (winged gallery republished:
https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg)
- The winged flap slower: one wing beat a second or slower on every move of the Lamp-Moth, the Gloamwing and the
  Thunder-Roc, capped in the pose itself. Each beat is a stroke (about 60% of the cycle) and then a glide with the wings
  held open. Measured headless over every move: the fastest is 1.0 beats a second. Wing Gale is one great beat over
  1.6 s (it was two).
- The hand-over: `withWraiths`, `withArmoured` and `withWinged` now step aside (fall through to the kit's look) for any
  foe the page has registered with the kit (`registered(key)` from `prototypes/foe-hd/kit/js/looks.js`). Pages register
  exactly the finished foes whose `stretch.json` passes (`game3d/foes-hd.mjs`, `world3d/fight.js`), so a foe finished
  by session 8 or 6 shows in full detail automatically, with no change to any caller. Mine stay as the stand-ins until
  then. Checked with a test page: three registered keys go to the kit, an unregistered one keeps Models' look. My
  galleries grow 4 KB from the import.
- Fixed in passing: the winged gallery's crowd view shared a field name with the wing-beat counter (its time ran away).

**Chris's notes, November 24: the Gear Room's panels fold away** (Gear Room republished:
https://claude.ai/artifact/BrZzsH3GJabJhGtXahfWJL)
- Every panel has a fold button: the action buttons, the hero picker, the "In the game" picture, and the gear and
  outfit panel. One tap opens or closes each. On a phone all four start folded, so the model is clear; on a laptop they
  start open. The fold buttons are 44 px tall. Checked at 390 px: no horizontal scroll, no errors.
- `model.js` unchanged (the fold is in the page's `main.js` and `shell.html`).

**Chris's notes, November 24: the winged polished against their sheets** (winged gallery republished:
https://claude.ai/artifact/CmY9BHJzyVYCYgQtpboqBg)
- Both moths hold their forewings lower and further out at the root, so their wings spread like the sheets' (they
  stood in a steep V).
- The Lamp-Moth:
  - broad, rounded forewings and hindwings like its sheet (they were tall and narrow), with bolder dun mottling and
    its amber eyespots moved to the new tips;
  - fur as one coat;
  - broad plumed antennae (they were thin combs);
  - six legs that splay out from the body with bent knees, lighter so they show (they were tucked along the abdomen);
  - its wing membranes a little coarser (it is rabble).

  At Light 18.9k (rabble ~20k).
- The Gloamwing's fur is grey like the sheet's (it bloomed white). At Light 38k.
- The Thunder-Roc is unchanged this pass (39.6k).
- Wing beats re-measured: still one a second or slower on every move.

## Next

- Stopped for a fresh session (November 24): see the Handoff at the top. Next is whatever Chris notes on the heroes,
  the townsfolk, the people foes or the winged.
- The wraiths and the iron and forge foes are the kit's now (sessions 8 and 6); mine stay as stand-ins and step aside
  on their own.

## Changed outside my files

- Nothing. (`world3d/node_modules` is a local link to `prototypes/hero-3d/node_modules` for building; not in git.)

## What others rely on

- Unchanged: `buildHero`, `setPose`, the rig's parts, `world3d/heroes.js` `actor`.
- `buildBeast(key, sprite)` now also returns `parts` and `g` (it returned `group, update, height` before; the brief said
  parts, so they are added). Part names for the sculpted twelve, as in the body plans: four-legged ones (thornhound, Old
  Snag, the Rot-Stag, Briarmaw) `legs` (4), `head`, `tail`; walkers (sapwight, the Rotwarden) `torso`, `head`, `arms`
  (2), `legs` (2); the briarling `body`, `legs` (2); boglurcher `body`; glowcap `body`, `head` (the cap), `arms`, `legs`;
  rotgrub `body`, `segments` (9), `head`, `tail`; the Gloamwing `float`, `body`, `head`, `wings` ([wing, side] pairs);
  Gorrow `body`, `head` (the crown), `legs` (4).
- New in `kit.js`: `TEXTURES.on` (the pack on or off), `grainFor`, and `mat(key, { tex, tint })`: `tex` picks a
  picture by name (or `null` for none), `tint` replaces the colour. New in `model.js`: `HERO_FACE`, `FACE_FIT`.
- Materials with a picture use their own shader (`onBeforeCompile`); a page that clones one of them loses the picture
  (three.js does not copy that hook).

## Needs

- Nothing yet.

## For Chris

- Nothing yet.

## Checks

- Bestiary builds and loads headless; each of the twelve looked at from the front and the side next to its sheet.
- Gear Room builds and loads headless with no errors (Chromium, SwiftShader); close looks at the four faces, the party,
  and every weapon class (sword, axe, hammer, mace, spear, staff, bow, dagger) and a shield.
- `world3d`: `node build.mjs --page=m7-places --places=keep,thornhollow --tex=768` builds (9.6 MB).
- Sculpted heroes: the item audit again (458 items, 0 flags, after keeping grooved hair out from under hats); Bestiary
  builds (11.2 MB); the Gear Room on a 390 px phone has no horizontal scroll.
- Sculpted masters: item audit again 458 items, 0 flags; the sculpt view builds 908k triangles headless with no
  errors; draws and pieces counted at High, Light and Lite (unchanged); Bestiary builds (11.5 MB); 390 px phone, no
  horizontal scroll.
- Not checked: frame rate on a real phone (the sculpt view's million triangles is for a laptop).
