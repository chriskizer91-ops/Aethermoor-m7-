# Slip: One Foe (session 6, branch `job/foe-hd`)

Briarmaw, Act One's first Champion, in full detail: a sculpt baked onto a light version of about 50,000 triangles,
shown side by side with the code-built model and a cut-out of Chris's sheet.

## Handoff (November 24)

For a fresh session taking the kit (`prototypes/foe-hd/`, branch `job/foe-hd`). Everything is committed and pushed; the
hub has merged it all.

**Where I stopped.** Two passes done and merged: (1) the second pass on my own foes against the sheets (all re-published);
(2) the polish pass on the ten iron and forge foes (all new, in full detail). Every foe passes the stretch check at 120
frames. Standing by for Chris's notes.

**Making a foe, start to finish** (from `prototypes/foe-hd`; read `README.md` there first):
1. `foes/<key>/` with `foe.json` (key = the bestiary id; name, plan, `moves` = a set name in `kit/js/looks.js` PLANS,
   rank, height, sheet, `crops` = the sheet's three views as x ranges, `bounds`, `voxel` per level, `view` = Blender's
   camera (`width` is the frame's height for a tall foe), `light` (triangle budgets per kind: Champions ~50k, veterans
   ~30k, rabble ~20k), `sculpt.level` 3 (aim 500k to 1M), `bake`), `sculpt.py` (`build(K)` returns a mesh), `rig.py`.
2. Shape it: `python3.12 kit/py/sculpt.py foes/<key> 1` then `python3 kit/py/sheet.py foes/<key> 1` and look at
   `foes/<key>/build/compare-1.png` beside the sheet (the preview washes glow out to white; judge glow on the page).
3. Build it all: `bash build/re.sh <key>` (make.sh: sculpt, sheet, bake in Blender, pack, the sculpt asset; then fin.sh:
   the stretch check at 120 frames, both pages, the laptop/phone/crowd screenshots in `build/chk-<key>/`). Steps can be
   named: `bash build/re.sh <key> bake,pack` re-bakes only. Run builds one after another (a plain list in a script);
   a `while pgrep -f ...` wait loop matches its own command line and waits for ever.
4. Moves: a set in `kit/js/moves/` (MOVES, DUR, LUNGE, ALIAS, pose), a two-line file per set name, registered in
   `kit/js/looks.js`; `stretch.mjs` finds it by foe.json `moves`. Re-weight without a bake: `python3.12
   kit/tools/rebind.py foes/<key>` (python3's scipy is broken here), then `bash build/fin.sh <key>`.
5. Publish: the gallery page `node build.mjs --foes=<key> --entry=pages/ironforge/main.js --shell=pages/ironforge/shell.html
   --out=ironforge-<key>` (each page holds one foe: ~13.5 MB of the 16 MB) and `dist/<key>-sculpt.artifact.html`; record the
   links in foe.json `pages` and in `pages/ironforge/main.js` PAGES; republish by the same file path, or with `url` from
   a new conversation.

**Armour pieces** (`kit/py/armour.py`, the iron and forge foes): `Suit(K, M).add(name, bone, sdf, lo, hi, colour, kind,
mat, vox)`; each piece is meshed in its own box and goes whole to its bone (`save_pieces` writes `build/pieces.json`;
the rig's `part()` is `pieces_part(HERE, P, idx, piece)`), so plates and stone are rigid and never stretch; put a dark
ball at each joint to hide the gap. Helpers: `rbox` (turned, tapered), `trim` (edges), `rivets`, `cyl`, `chipped`
(stone), `crack_depth`, `humanoid_bones(J)` (the walkers' bone names). Fire in cracks: press the crack into the rock
and put a slightly smaller copy under it as kind 7, and set foe.json `bake.coat_kinds: [0, 7]` so the bake carries
the glow into the rock. Moves for all ten are in `kit/js/moves/ironclad.js` (M7's names). Watch Python closures in
loops (bind loop variables as default arguments) or a piece builds in the wrong place.

**The checks:** the stretch check (`node kit/tools/stretch.mjs foes/<key> --frames=120`: big edges under 1.3x, crease
edges under 3x, pictures in `build/stretch/`), the compare against the sheet, and the page screenshots
(`node kit/tools/check.mjs dist/<page>.html build/chk-x`).

**Galleries** (three ways and moves; sculpt for a laptop):
- Iron and forge (each page links to the other nine):
  - The Ashen Warden: https://claude.ai/artifact/EzhJdoL53KTeUPUfHc2yyN · sculpt https://claude.ai/artifact/P9A4aLPUBJmqKpDPtxnm2z
  - Iron Sentinel: https://claude.ai/artifact/SVB9XRDbgnSTV9VSMr59Lz · sculpt https://claude.ai/artifact/9EMmiFLiVVjhcdH9gb5LEY
  - The Sentinel-Captain: https://claude.ai/artifact/7KxofYSMBpwrvZvHVjtiMX · sculpt https://claude.ai/artifact/4tyXBcUemDjqCNKeE32jgi
  - Forgeborn: https://claude.ai/artifact/WvKEeL7qFkK7K5kx2TZEuc · sculpt https://claude.ai/artifact/PFnANRRo6hppJ81gM9vJ1r
  - The Bellows: https://claude.ai/artifact/CVwKJCkHZHyW9oyXWcrhtK · sculpt https://claude.ai/artifact/AYQ4g3bn3K1PjuAgMbojsj
  - Harrow's Journeyman: https://claude.ai/artifact/MUFvyzwaifsf9HUnwuafq6 · sculpt https://claude.ai/artifact/HNCyMsTjFRtEeRgXmSdELd
  - Cinder-Thrall: https://claude.ai/artifact/WiTMDVCyHgqy9q9aLqRoHa · sculpt https://claude.ai/artifact/ESaa9RWCUhGAUyyFV2jAin
  - Thrall-Overseer: https://claude.ai/artifact/A2CMDtaE2gbiSkGhsY1GFU · sculpt https://claude.ai/artifact/43LqUqciZC9qPL4gb3H2s8
  - Forge-Warden: https://claude.ai/artifact/TQtQi2jxUR391ZErWyNeMo · sculpt https://claude.ai/artifact/DWgVBNPgJFME3hAzKSeYqv
  - The Unsmith: https://claude.ai/artifact/B4yCqb6nesPQ2U4t4SDUSV · sculpt https://claude.ai/artifact/MPwJpG1i7T2sSaB7NAzVx1
- My earlier foes:
  - Briarmaw: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh · sculpt https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P
  - Marsh-Light: https://claude.ai/artifact/XvU3kSAEBLpKMQP5pBXvQx · sculpt https://claude.ai/artifact/MatuoD1NwsB6inUV1K592H
  - Willow-Wight: https://claude.ai/artifact/LoiEBTvYXJuM7nKijvueHH · sculpt https://claude.ai/artifact/2aJ9QPBwtbvnfsEY3H3phj
  - Grandfather Willow: https://claude.ai/artifact/VVD4hHroTdUSQ2pEZAtaZf · sculpt https://claude.ai/artifact/CQZDYsv6DHM5FzXh19ymzC
  - Boglurcher: https://claude.ai/artifact/CBt1k8zotiyVb5BCkquENo · sculpt https://claude.ai/artifact/UXByzwgQxJTPVX3MRVunir
  - Briarling: https://claude.ai/artifact/DorMujhAe9d1XNwLGYV4ae · sculpt https://claude.ai/artifact/LAjxUMG9Aoj2UPw7DuyHtB
  - Glowcap: https://claude.ai/artifact/AyUxs7hCGjdzZDNG1jfRnJ · sculpt https://claude.ai/artifact/H5yc3TLZDp3Aho9R1nzaCg
  - Rockling: https://claude.ai/artifact/K5G7NXT5biU4Yyp8aGAfiF · sculpt https://claude.ai/artifact/QPkgvXNDUmWtG2yupQaPYP
  - Mother Anvil: https://claude.ai/artifact/GpnVAt4gcTybB3w9weeZsp · sculpt https://claude.ai/artifact/RkoYTSqzxA4rLktCJT2cJy
  - Forge-Spark: https://claude.ai/artifact/7sjTb3ubzrCxJJZ189YZBW · sculpt https://claude.ai/artifact/M7NGzTZXnqPTVEHXtDeQUr
  - Mire Leech: https://claude.ai/artifact/XKAzPTo5MW2j7a8T9ZBGcw · sculpt https://claude.ai/artifact/8vA22BicHBuWDnrysGVyor
  - Blackwater Gar: https://claude.ai/artifact/Ry64sw4379cEjNfuju1BvU · sculpt https://claude.ai/artifact/TmEm8mbSEi8zQomTsndm51
  - Old Jaws: https://claude.ai/artifact/9TmS56rJ3X9VZPkrF3BXsn · sculpt https://claude.ai/artifact/FZXfQNJgJt3RNNaPDwF31S
  - The Blackwater Leviathan: https://claude.ai/artifact/3Px9mipuqrTBB8NFfehbj5 · sculpt https://claude.ai/artifact/AqaNEJqebbVdKEtMv7SXE4
  - Thornhound (taken over from session 7, pages/beasts): https://claude.ai/artifact/9zji17squ3DQjFians9iVE · sculpt https://claude.ai/artifact/5QSWUvvWZigZBP2DAgLJix

**What's open:** Grandfather Willow's roots are smoother than the painting's; the Bellows' body is puffy segments where
the sheet has a one-piece suit; the Sentinel-Captain's and the Unsmith's sculpts are a little over 1M (1.14M, 1.19M);
the Sentinels' iron bakes a little darker and bluer than the sheet's slate. All ten artifact watch slots were full, so this
session got no comment notices on the newer pages.

## Done

- **The polish pass: iron and forge** (November 24; Chris: "Iron and forge as well"), all ten in full detail, in act order,
  each **passing the stretch check** (120 frames), each with its own named moves (M7's names, kit/js/moves/ironclad.js;
  sets warden, sentinel, captain, forge, bellows, journeyman, thrall, overseer, kiln, unsmith in looks.js). Kit keys are
  the bestiary ids, so Models' wrapper hands over by key. Gallery pages (one foe each, linked to each other):
  - The Ashen Warden (`ashen-warden`, sculpt / light 973k / 47k): https://claude.ai/artifact/EzhJdoL53KTeUPUfHc2yyN
  - Iron Sentinel (`iron-sentinel`, sculpt / light 1.02M / 28.7k): https://claude.ai/artifact/SVB9XRDbgnSTV9VSMr59Lz
  - The Sentinel-Captain (`sentinel-captain`, sculpt / light 1.14M / 38k): https://claude.ai/artifact/7KxofYSMBpwrvZvHVjtiMX
  - Forgeborn (`forgeborn`, sculpt / light 1.0M / 30k): https://claude.ai/artifact/WvKEeL7qFkK7K5kx2TZEuc
  - The Bellows (`bellows`, sculpt / light 961k / 30k): https://claude.ai/artifact/CVwKJCkHZHyW9oyXWcrhtK
  - Harrow's Journeyman (`journeyman`, sculpt / light 944k / 38.6k): https://claude.ai/artifact/MUFvyzwaifsf9HUnwuafq6
  - Cinder-Thrall (`cinder-thrall`, sculpt / light light ~20k): https://claude.ai/artifact/WiTMDVCyHgqy9q9aLqRoHa
  - Thrall-Overseer (`thrall-overseer`, sculpt / light 847k / 30k): https://claude.ai/artifact/A2CMDtaE2gbiSkGhsY1GFU
  - Forge-Warden (`forge-warden`, sculpt / light 750k / 29.5k): https://claude.ai/artifact/TQtQi2jxUR391ZErWyNeMo
  - The Unsmith (`unsmith`, sculpt / light 1.19M / 46.5k): https://claude.ai/artifact/B4yCqb6nesPQ2U4t4SDUSV
  - How: kit/py/armour.py builds a suit of pieces, each its own mesh on one bone (build/pieces.json tells the rig), so
    plates, slabs and stone move rigidly; chipped stones and cracks with a glowing slab just under the rock (kind 7),
    baked into the rock with foe.json bake.coat_kinds [0, 7] (bake.py skips an empty parts pass). The Captain's and
    the Unsmith's sculpts are a little over 1M.

- **Second pass against the sheets** (November 24; the hub's list), every foe **still passing the stretch check** (120
  frames), every page republished at its same link:
  - Marsh-light: warmer yellow core. Willow-wight: fronds in clumps of three, lighter bark, moss in the grooves.
    Grandfather Willow: mossier, more twisted and gnarled trunk (still smoother than the painting's roots).
  - Mother Anvil: a faceted boss on the front, lighter iron. Briarling: fuller body, bigger leaves. Glowcap: flatter,
    wider cap (its build box widened: it was cutting the edge warts open), the crotch's middle on the hips.
  - Rockling: sharper stones, faces that point up lighter, chipped diamond eyes in dark hollows. Forge-spark: glowing
    windows between the cage's bands, three small spikes round one tall twisted spike, an orange glow on its page.
  - Boglurcher: lumpier mud, moss in patches down the heap, amber eyes, browner stones.
  - Leviathan: bigger leafy scales, egg-shaped coils, olive patches, and a closer camera on a phone (foe.json
    "phoneClose", new in the kit: the painted one and the full-detail one side by side). Mire-leech: foot flared into a
    wide bell. Blackwater gar: bigger plates, each lit on its front half. Old Jaws: rounder, a longer tail fan
    (fish.py "tail", new).
  - Fixes on the way: the leech's first neck bone bends least; the gar rig's second tail joint blends wider; the
    Leviathan's breach tilts the head a little less.

- **The thornhound** (November 24; taken over from session 7), **passing the stretch check** (120 frames):
  - His page (with the pack round the heroes): https://claude.ai/artifact/9zji17squ3DQjFians9iVE · the sculpt
    (laptop): https://claude.ai/artifact/5QSWUvvWZigZBP2DAgLJix
  - On session 7's own pipeline (pages/beasts/kit): his legs pieces of their own (their own coat, kind 1) set into his
    body with a crease; the hind thighs re-shaped to end above the knee (they hung past it and stretched at every
    bend); his rig keeps each leg's coat on its own bones and the body off them (`part()`/`mask()`, WELD_SAME_KIND),
    the blades and haunches still; the neck kept off the back of the skull, the head off the throat, softer limits on
    the lower leg bones, wider blends at the throat and the tail. His moves (pages/beasts/kit/moves-quad.js, his
    alone) trimmed where his throat and elbows tore; the howl now rears him whole. Worst edge 1.28x.
  - Light model 20,249; sculpt 669k.

- **Briarmaw's head drawn out** (November 23), **passing the stretch check** (120 frames), pages republished (same links):
  - His head and face are a piece of their own now (their own coat, kind 4, baked as coat: `bake.coat_kinds` in
    foe.json, new in the kit), set into his shoulders like his legs; the head piece moves whole with the head (its jaw
    cut free as before), and his body never takes the neck, head or jaw. So the big head tosses are back: the roar
    flings his head up (neck and head 0.3 each), the maul turns it 0.5, the hit and the fall throw it, the bristle
    shakes it, as in the first lively set. Every move under 1.3x (worst 1.29x, the maul's foreleg).
  - Light model 52,168; sculpt 1.29M (the head and legs carry coats of their own).

- **The Blackwater Leviathan** (November 23), Champion of the Gloomfen, in full detail, **passing the stretch check**
  (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/3Px9mipuqrTBB8NFfehbj5
  - The sculpt itself (laptop): https://claude.ai/artifact/AqaNEJqebbVdKEtMv7SXE4
  - A sea-serpent rising 2.2 m out of the black water, his neck in a slow S, two coils humped out of the water at his
    sides; dark teal scales, pale plates down his throat, a dragon's head with a jaw of its own, orange eyes, a frill and
    horns, spines down his neck, the pearl in his crown; an iron collar with its chain into the water, a harpoon in his
    chest with red rags, barnacles. Light model 48,759; sculpt 908k (3.7 MB saved).
  - A new plan, `leviathan` (`kit/js/moves/leviathan.js`), his game moves by their ids: coil, tail-slap, sound (fully
    under), breach (up from under), swallow, undertow, harpoon-rage, pearl-light, flood; and the Fight's full and spit.
    For the Fight: `EVENTS.swallow = { gulp: 0.45, reach: 1.05 }`, `SINKS`, and bones `mouth`, `pearl`, `harpoon`
    (no skin). The blackwater-gar and Old Jaws have the same (`fish`, `oldjaws`: swallow, full, spit, a `mouth` bone).

- **Briarmaw lively again** (November 23), **passing the stretch check** (120 frames), pages republished (same links):
  - Three ways: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh · the sculpt: https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P
  - His legs drawn out of his belly: the belly raised to the sheet's 0.46 m, and each leg a piece of its own with its
    own coat (kind 1), set into his body with a crease round it; the bramble vines round his legs move whole with the
    lower leg. His rig finds the legs by kind (`part()`), keeps the body off the legs' bones (`mask()`), and welds
    only points of one kind (`WELD_SAME_KIND`). Light model 49,686; sculpt 1.22M (5.7 MB saved).
  - His own lively set, `bear` (`kit/js/moves/bear.js`, his game moves by name): the big leg swings back (upper legs
    ±0.32 in the walk), the paw raised high in the maul (1.25 rad), a rearing rootquake, a thorn-shaking bristle, the
    jaw wide in the roar; rearing, lunging, turning and shaking move his whole body. The knees bend a little less than
    the first set (a thick furry knee tears past about half a radian), and his neck and head turn modestly: his head is
    sunk in his shoulders under the cheek ruffs, so big tosses tear there until the sculpt draws his head out too.
  - The Fight's `briarmawLook` (page/briarmaw.js) uses the bear set; the forwarding copies in `assets/` refreshed; the
    three-ways page plays a foe's own named set (`moves` in foe.json) before its plan's.

- **Old Jaws** (November 23), Relic-Bearer of the Gloomfen, in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/9TmS56rJ3X9VZPkrF3BXsn
  - The sculpt itself (laptop): https://claude.ai/artifact/FZXfQNJgJt3RNNaPDwF31S
  - The gar grown old and huge (1.8 m), humped, deep and broad, a short broad snout, a pale old eye, a rope round his
    neck and his snout, a cord of beads hanging to the great hooked tooth, blue bubbles beside him.
    Light model 35,366; sculpt 964k (6.8 MB saved). His moves: bite, leap, dive, death-roll, the-tooth.

- **The blackwater-gar** (November 23), rabble of the Gloomfen, in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/Ry64sw4379cEjNfuju1BvU
  - The sculpt itself (laptop): https://claude.ai/artifact/TmEm8mbSEi8zQomTsndm51
  - A long armoured fish swimming just above the mud in its ripple: green diamond plates, a pale belly, a long snout
    of needle teeth (the lower jaw its own piece), a yellow eye, a sawtooth crest, orange-spotted fins.
    Light model 18,496; sculpt 959k (3.8 MB saved).
  - Built by `foes/blackwater-gar/fish.py` (Old Jaws is the same fish with other numbers), moved by a new plan, `fish`
    (`kit/js/moves/fish.js`): hover, swim, bite, leap, dive, death-roll, the-tooth, hit, belly up.
  - The kit: `WELD_SAME_KIND` in a rig (`kit/rigs/bind.py`): only points of one kind are welded, so a fin, a crest plate
    or a leg's own coat that merely touches the body keeps its own weights.

- **The mire-leech** (November 23), rabble of the Gloomfen, in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/XKAzPTo5MW2j7a8T9ZBGcw
  - The sculpt itself (laptop): https://claude.ai/artifact/8vA22BicHBuWDnrysGVyor
  - A leech as long as your arm, rising like a cobra off a broad flat foot: ringed, glossy, mottled dark greens,
    orange chevrons down its back, a teal sole, a round sucker with a pale rim, two rings of teeth and a red throat.
    Light model 19,200; sculpt 914k (3.4 MB saved).
  - A new plan, `leech` (`kit/js/moves/leech.js`): rooted at its foot (the tail behind and the neck ahead grow out of
    it), sway, crawl, latch, drink, sink, hit, fall; wide joint blends along its rings (worst edge 1.29x).

- **Mother Anvil** (November 23), Champion, in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/GpnVAt4gcTybB3w9weeZsp
  - The sculpt itself (laptop): https://claude.ai/artifact/RkoYTSqzxA4rLktCJT2cJy
  - The biggest anvil of the forge on four iron legs: riveted dark iron, the top flared, the horn forward, her heart a
    fire behind grates between copper bands, a riveted back plate, four plated legs with clawed paws, a hinged arm with
    a brass collar holding the hammer (brass bands, a glowing golden star on each face). Light model 50,391; sculpt
    976k (3.8 MB saved).
  - A new plan, `anvil` (`kit/js/moves/anvil.js`), with her game moves by their own ids: hammerfall (she rears up on
    her hind legs), anvil-strike, worldforge-blow (charging), sparks, steam-burst, temper, heart-flare, bellows, and
    stand, stomp, hit, fall. Every plate moves whole: every edge 1.00x.
  - Next for her: the horn's faceted boss standing out more in front, plates chipped like the sheet's.

- **The rockling** (November 23), rabble, in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/K5G7NXT5biU4Yyp8aGAfiF
  - The sculpt itself (laptop): https://claude.ai/artifact/QPkgvXNDUmWtG2yupQaPYP
  - A heap of scree that stood up: 24 chipped blue-grey stones and up to 50 pebbles packed in the creases, a boulder head with
    two pale stone eyes. Light model 18,180; sculpt 924k (3.8 MB saved).
  - A new plan, `heap` (`kit/js/moves/heap.js`): stand, trudge, slam, roll in (it tucks and rolls once over about its
    middle), hunker, hit, fall. Every stone moves whole: every edge 1.00x.

- **The forge-spark** (November 23), in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/7sjTb3ubzrCxJJZ189YZBW
  - The sculpt itself (laptop): https://claude.ai/artifact/M7NGzTZXnqPTVEHXtDeQUr
  - A living cinder: a ball of ember in a cracked slag shell held by rusted, riveted iron bands, light pouring out of
    three slits in front and through a web of cracks, a crown of slag spikes with a flame and sparks, two floating
    fists of glowing slag and a molten ring under it. Light model 13,642 (rabble); sculpt 981k triangles (4 MB saved).
  - The `spark` plan moves it: every piece moves whole, so every edge stays at 1.00x.

- **The marsh-light** (November 23), in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/XvU3kSAEBLpKMQP5pBXvQx
  - The sculpt itself (laptop): https://claude.ai/artifact/MatuoD1NwsB6inUV1K592H
  - A floating flame of swirling green tongues (they glow: cold fire), round a glowing yellow core with a face,
    golden drops falling into a ripple of water. Light model 16,842; sculpt saved (1.8 MB).
  - A new plan in the kit, `spark` (`kit/js/moves/spark.js`, the forge-spark's too): what floats is a root of its own
    (the flame, the drops, the fists), so it hovers, drifts, darts, flares, lures, flickers, flinches and gutters by
    moving whole, and nothing can stretch; only the flame's top bends a little.
  - Next for it: the core warmer and brighter, glowing out through the tongues, as the sheet paints it.

- **Grandfather Willow** (November 21), in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/VVD4hHroTdUSQ2pEZAtaZf
  - The sculpt itself (laptop): https://claude.ai/artifact/CQZDYsv6DHM5FzXh19ymzC
  - Sculpt about 1.4M triangles (saved, 6.0 MB); light model 40,956 (the Relic-Bearer budget).
  - Built with the willow-wight's builder, now shared (`foes/willow-wight/tree.py`; the willow-wight builds exactly
    as before), at his own size: a vast mossy trunk on spreading roots with a dark hollow like a door, ivy winding up
    it, an old face high under a crown of fronds two metres across, teal drops hanging on cords among the fronds,
    and the Weeping Bow held across his chest in his left arm, its string glowing green and dripping, white flowers
    on the stave; his right arm hangs.
  - The willow plan gained his Weeping Volley (the bow lifted, a draw from the shoulder, held, loosed).
  - Next for him: fronds denser and clumpier, the trunk more gnarled and mossier, as the sheet paints him.

- **The willow-wight** (November 21), in full detail, **passing the stretch check** (120 frames):
  - Three ways, with the crowd test: https://claude.ai/artifact/LoiEBTvYXJuM7nKijvueHH
  - The sculpt itself (laptop): https://claude.ai/artifact/2aJ9QPBwtbvnfsEY3H3phj
  - Sculpt about 1.25M triangles (saved, 5.5 MB); light model 30,634 (the veteran budget).
  - A ridged trunk on splayed root feet, a scowling face with glowing eyes that weep, two branch arms (bluebells in
    its left hand) grown out of the trunk as pieces of their own (so the shoulders can't stretch), and about 100
    fronds draped over a dome of crown, parted over the face, every leaf sculpted; at the light level each frond is a
    zigzag ribbon whose lobes are where the leaves are, and the leaves are baked onto it.
  - A new plan in the kit, `willow` (`kit/js/moves/willow.js`, for Grandfather Willow too): sway, walk (it lurches on
    its roots), lash, bough-fall, weep, hit, fall (it topples backwards). Common moves: strike, bite, swipe → lash;
    cast → weep; roar → bough-fall.
  - Kit fix found on the way: the behind-the-joint clean-up never moves a point to a parent its mask forbids.
  - Next for it: the fronds denser and clumpier, as the sheet paints them.

- **The boglurcher** (November 21), in full detail, **passing the stretch check** (worst 1.25x, the slam):
  - Three ways, with the crowd test: https://claude.ai/artifact/CBt1k8zotiyVb5BCkquENo
  - The sculpt itself (laptop): https://claude.ai/artifact/UXByzwgQxJTPVX3MRVunir
  - Sculpt 1,296,288 triangles (saved as `foes/boglurcher/assets/boglurcher-sculpt.glb`, 4.8 MB); light model 19,774.
  - A slumped heap of clotted mud clods, moss over its top hanging in strands, two amber slit-eyed eyes in dark
    hollows, stones round its foot, two cattails and a curled sprout; shaped to the sheet (outlines overlap 0.8 at the
    sheet's own scale).
  - A new plan in the kit, `mound` (`kit/js/moves/mound.js`): it lurks, oozes, slams (rears and falls on you), grabs
    (surges along the ground), drags under (sinks, then heaves up), flinches and slumps into the marsh; base, body, top
    and whatever grows on top. Its moves map the common set (strike → slam, bite and swipe → grab, cast and roar → sink).
  - Next for it: the moss more olive and its strands broader, as the sheet paints them.
  - Pages now carry the foe's name in their title (build.mjs).

- **Briarmaw, the briarling and the glowcap pass the stretch check** (every move under 1.3x, checked at 120 frames;
  November 21). Re-weighted by part, no new bake needed (the sculpts didn't change).
  - Briarling: its leafy coat is all ball (the legs are root tubes pushed into it), the leg tubes' hidden tops go with
    the legs, the sprout bends just above the ball; it pitches as a whole; knees and sprout swing a little less.
  - Glowcap: each leaf-arm is a whole leaf on its arm bone, the cap is all head; it waddles (its body reaches nearly to
    the ground, so the legs swing only a little under it) and leans whole instead of nodding a neck it hasn't got.
  - Briarmaw: his legs claim only what is below the middle of his flank and near their own line (seen from above);
    his mouth is cut along the lips (the jaw opens without dragging his cheeks, and the page draws the inside of his
    head behind it); his upper legs are inside his barrel, so he moves from the knee and the paw, and rears, turns,
    dips and reels with his whole body. His moves are smaller than before, heavier.
  - The kit learned on the way (all in `kit/rigs/bind.py`): welding by distance, parts for separate pieces
    (`part(P, kind, idx, piece)`), `SPLIT` for a mouth, bands only from a bone the point can see and is near, bones made
    only of pieces share no band with the skin, cuts only limb against limb; and in the check, `--parts`, `--focus`,
    `BIND_AT`.

- **No stretching (Chris, November 21), in the kit:**
  - **The stretch check**, `node kit/tools/stretch.mjs foes/<key>`: every move at 48 frames, skinned as three.js does,
    fails past 1.3x on any edge or on a scaled or slid bone; names the worst move, frame, place and the two parts the
    edge joins; draws the worst frame of each move (`build/stretch/<move>.png`). Results in `foes/<key>/stretch.json`.
  - **Weights by part**, `kit/rigs/bind.py`, now the bake's only way of weighting (and `kit/tools/rebind.py` to weight
    again without baking). Each point follows one part; blending only in a band at its own joints; a bone may claim a
    point only if the line between them runs inside the body; touching limbs are cut apart; the weights are smoothed
    along the skin. Rig files may add `part`, `TRUNK`, `BANDS`, `SMOOTH` (README, "No stretching").
  - **Bones turn, never scale**: the kit's moves breathe and squash by turning bones now (quad, biped, sapling,
    mushroom, frog). The briarling pitches as a whole (hips) instead of bending its ball in the middle.
  - **Results** (worst edge growth, old weights then new, same moves; limit 1.3):

    | foe | idle | walk | attacks | hurt | fall |
    |---|---|---|---|---|---|
    | Briarmaw | 4.5 -> 2.1 | 26.9 -> 5.3 | roar 8.9 -> 3.3, swipe 42.9 -> 14.0, bite 10.5 -> 3.9 | 9.2 -> 4.2 | 20.8 -> 5.1 |
    | Briarling | 8.4 -> 1.4 | 21.1 -> 3.0 | hop 26.4 -> 4.0, lunge 26.7 -> 4.0 | 33.7 -> 3.0 | 39.6 -> 5.1 |
    | Glowcap | 4.7 -> 1.5 | 10.3 -> 2.4 | spores 26.5 -> 5.8, bump 4.7 -> 3.3 | 16.0 -> 3.5 | 25.8 -> 5.6 |

    The web-like stretches between parts (the Rotwarden kind: belly between the legs, the ball top dragged by the
    sprout, a leaf-arm pulling the hip) are gone. **All three still fail**: what is left sits where a limb meets a
    big body under a large swing: Briarmaw's leg tops in the walk and swipe and his cheeks when the jaw opens, the
    briarling's leg tops and the foot of its sprout, the glowcap's leaf-arms and boots. Next for each: smaller swings
    at those joints and wider bands, and in the sculpts, limbs that don't touch (the glowcap's boots, its arms on its
    hips).

- **The full-detail one (pass 3), published November 20:**
  - Three ways, with the crowd test: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh (version 3, 14.2 MB).
    Chris saw the crowd (six of him with the four heroes) at 144 frames a second on his machine.
  - **The sculpt itself**, beside the light version baked from it, for a laptop:
    https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P (10.2 MB): 982,634 triangles against 50,090.
  - **The full-detail model is kept as an asset**: `prototypes/foe-hd/assets/briarmaw-sculpt.glb` (with colours,
    meshopt-compressed, 4.5 MB). Chris: aim sculpts at 500,000 to 1,000,000 triangles, more only where needed; the game
    uses the ~50,000 bake. I passed this to the hub and all four jobs.
- **First look** (same link, version 1-2):
  - Three stands turning together under the same light: built in code (Models' beast, 77,452 triangles), the painted
    cut-out (Models' standee, `prototypes/bestiary/standee.js`, from the hub's branch), and the full-detail light
    version (50,167 triangles, baked from a 407,000-triangle sculpt, 2048 px pictures). Page 14.4 MB.
  - His moves: breathe, walk, roar, swipe, bite, hit, fall (19 bones).
  - **Six of him with the heroes**: six full-detail Briarmaws walking round the four heroes, with the frame rate.
- **How it's made** (Chris, November 20: "start with a 100,000 triangle shape model, and then add in detail... if you
  just make it fuzzy with a bunch of little tiny hairs, that'll look fuzzy, but it won't look like it's supposed to"):
  - Pass 1, shape (~130k): the body measured off the sheet and checked against its outline from front, side and back;
    his coat is ~1,500 big leaf-feather tufts sculpted into one surface (they overlap like shingles), not hairs.
  - Pass 2, form (~400k): each tuft gets feather barbs (strands angled out from a midrib) and broken tips.
  - Blender (installed from Ubuntu, run headless) bakes the surface, shading in the folds, colour and the eyes' glow
    onto the light version. The recipe: `prototypes/foe-hd/README.md`.
- Answer to Chris's question (are the still images baked onto the model?): Blender does the baking, from the sculpt.
  The sheet is the measuring guide and colour reference, not projected onto him: it is painted with its own light and
  shows only three views. Its front view could be projected onto the face as an option.

- **The foe kit (step 2), November 20**: `prototypes/foe-hd/kit/` and its README. Briarmaw moved to
  `prototypes/foe-hd/foes/briarmaw/` and rebuilt through it (same triangles, same pages, checks pass). The kit has:
  the sculpt runner and helpers (shapes, mesh pieces, a coat of tufts, scales or plates, cloth folds), the sheet checks
  (outline and side-by-side from each foe's crop boxes), the bake reading each foe's settings and rig, rig templates
  (four legs, two legs), packing, the sculpt asset export, the page loader, moves for four and two legs, one
  `setBeastLook` for every finished foe (`kit/js/looks.js`), the sculpt viewer and the three-ways page for any foe.
  Sessions 7 and 8 told.

- **Briarling** (my lane's first, November 20): three ways with its moves and the crowd test,
  https://claude.ai/artifact/DorMujhAe9d1XNwLGYV4ae (11.8 MB); its sculpt beside its light model,
  https://claude.ai/artifact/LAjxUMG9Aoj2UPw7DuyHtB. Sculpt 589,428 triangles (asset
  `foes/briarling/assets/briarling-sculpt.glb`, 2.7 MB); light model 16,640 (rabble budget ~20k), 1024 px pictures,
  phone 512. Moves for small walking plants: `kit/js/moves/sapling.js` (bob, waddle, hop, lunge, hit, fall).
  Kit fixes from it: pages and viewer scale with the foe's height; parts are placed on a surface that is exactly the
  same at every level (fixes missed bakes on small foes).

- **Glowcap** (November 21): three ways, https://claude.ai/artifact/AyUxs7hCGjdzZDNG1jfRnJ (11.4 MB); its sculpt,
  https://claude.ai/artifact/H5yc3TLZDp3Aho9R1nzaCg. Sculpt 841,184 triangles (asset `glowcap-sculpt.glb`, 3.4 MB):
  the warty cap with its rim rolled under, glowing gills as real radial ridges, the face, a layered leaf collar, the
  folded fibrous body with knobs, leaf arms, boots. Light model 17,284. Moves `kit/js/moves/mushroom.js` (bob, waddle,
  spores, headbutt, hit, fall).
- **Kit**: the bake now bakes coat and parts into separate pictures and joins them by an exact mask of the parts'
  islands (no more specks of glow or black bleeding across); Briarmaw and the briarling re-baked and republished
  (same links). Rig templates and first moves for serpent, frog and winged (session 7 asked).

## Next

0. Done (November 21): gates that hold through bands and smoothing (weigh +1000, or a soft mask()), and helper joints
   in the quad and biped templates (blades, haunches/hips, shoulders, neck_base, tail_root), driven by the loader's
   applyHelpers. Briarmaw re-bound with them and passes; a livelier walk still fails at his knees, under the belly fur:
   real swing back needs his legs drawn out of the belly in the sculpt (a later pass). Earlier note: session 7's proposal (docs/project/slips/foes-beasts.md: a shoulder blade per foreleg, a haunch per hind leg, two
   neck bones, a tail-root helper, driven by the loader from a HELPERS table so moves don't change). Also session 7's
   report that bind.py lets some neck weight onto the thornhound's ear root despite its weigh(): weigh gates need
   +1000 (an unseen bone costs 100), and a gate should also stop the bands and smoothing.
1. My lane, each passing the stretch check before it's handed in: (briarling, glowcap, boglurcher, willow-wight,
   Grandfather Willow done) the sparks (marsh-light, forge-spark), rockling, Mother Anvil: all done. Then Briarmaw lively again and the Gloomfen's deep beasts (mire-leech, blackwater-gar, Old Jaws, the Blackwater Leviathan): all done. (The wraiths moved
   to Models, session 3.)
2. Briarmaw's moves smoothed (weights round the shoulders and hips, a fuller walk), a hit flash.
2. The face closer still to the sheet; the coat's brown zones placed as the sheet paints them.
3. Done: pass 3, the sculpt's own page, the heavier brow and golden fangs, the rump and tail as the sheet shows.

## For the Fight

- Done: `prototypes/foe-hd/page/briarmaw.js` `briarmawLook(shared, buildBeast)` is a function for
  `setBeastLook` (the hub's description of your interface): Briarmaw in full detail, every other beast as before. It
  returns `{ group, plan: 'quad', height: 1.7, parts: { head, tail }, update(t, step), hit(), act: { lunge, fall } }`, plus `pose(move, u, t)`
  for his own moves. It needs `await ready()` and `makeShared(A, 2048)` first (see `page/main.js`, `build.mjs` for the
  assets, about 3 MB).

## Earlier ask (answered by the hub)

- **From the Fight:** the shape of your foe interface, so Briarmaw drops into your fight. What I read in
  `world3d/battle/arena.js` and `prototypes/bestiary/beasts.js`: a foe figure wraps `buildBeast(key, sprite)`, which
  returns `{ group, plan, height, parts, update(t, step) }`, and `poseFoe` moves the whole body and `parts.head`.
  `prototypes/foe-hd/page/briarmaw.js` `buildBriarmawHD(shared)` returns that same shape (plan `'quad'`, height 1.7,
  `parts.head` is the head bone), plus `pose(move, u, t, step)` for his own moves (`idle`, `walk`, `roar`, `swipe`,
  `bite`, `hurt`, `ko`). It needs its assets (`makeShared(A, 1024)`, see `page/main.js`). Say in your slip if you'd
  rather call it differently.

## For Chris

- Which way for the foes: built in code, painted cut-outs, or full detail like this? (Suggestion: full detail for the
  Champions, and decide the rest once you've seen the crowd test on your phone.)

## Checks

- Headless Chromium (SwiftShader, software drawing, so far slower than a phone's graphics chip): the page loads with
  no errors at 1280 x 800 and 390 x 844; 20 frames a second on the stands, 22 with the crowd (774,000 triangles drawn
  including shadows). Not yet checked on a real phone.

## What others rely on (keep working)

- `prototypes/foe-hd/page/briarmaw.js` (`briarmawLook`, `makeShared`, `ready`): kept as a forwarding module onto the kit.
- `prototypes/foe-hd/assets/` (Briarmaw's `light.json/bin`, pictures): forwarding copies of `foes/briarmaw/assets/`,
  for the Fight's plugin, until it moves onto `kit/js/looks.js`.
- The kit's file layout and `foe.json` fields (sessions 7 and 8 build on them): changes are announced to them first.
- `kit/blender/bake.py` now returns its weights from `kit/rigs/bind.py` (by part) and writes two more arrays into
  `build/bake/low.bin` (`kind`, `index0`); `pack.mjs` reads only what it read before.

## Changed outside my files

- Nothing. (Installed Blender and Python packages in this container only.)
