# Slip: Models (session 3, branch `job/models`)

Last updated November 20 (painted standees for Chris's comparison).

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

## Next

- Chris chose full detail for the beasts (November 20): sessions 6 to 8 build them (`docs/project/jobs/foes.md`;
  sculpts of 500k to 1M triangles kept as viewable assets, baked to about 50k for the game). This job does no more
  beast reshaping. The sculpted twelve (`sculpt.js`) and the painted standees (`standee.js`, `standeeLook`) stay as
  stand-ins, and `buildBeast` and the Bestiary keep working, until each full-detail foe lands.
- This job keeps the heroes, the townsfolk and the 39 people foes: next, whatever the hub asks for them.

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
