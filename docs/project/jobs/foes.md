# The foes in full detail (sessions 6, 7 and 8, from November 20)

Chris, November 20, on session 6's full-detail Briarmaw: "already looking fantastic. I'm excited to see other foes
rendered with the techniques it learned doing that", and two more sessions to build the foes. So every beast is made
the way Briarmaw is: a sculpt shaped to Chris's model sheet (front, side, back), baked onto a light model that many
can share the screen with. The 39 people foes stay built by the heroes' builder (Models).

## The recipe (session 6's, `prototypes/foe-hd/README.md`)

- **Shape first, then detail** (Chris): a ~100,000-triangle shape model checked against the sheet's outlines from
  front, side and back; then the detail, aimed at **about 500,000 to 1 million triangles**, more only where the detail needs it (Chris, November 20; his
  laptop can take 2 or 3 million). **No fuzz of tiny hairs** ("that'll look
  fuzzy, but it won't look like it's supposed to"): fur, leaves, scales, plates and robes are sculpted as real shapes
  (tufts that overlap like shingles, plates, folds).
- **The sculpt is kept as an asset Chris can look at** (Chris, November 20): in the foe's folder, compressed (Draco or
  meshopt; aim under about 25 MB a foe so the repo stays healthy), with a laptop page in your lane that opens it.
- **Baked onto a light model** in Blender (run headless): normal map, ambient occlusion, colour (Chris's skins,
  `art-in/3d/skins/`, and the sheet's own colours) and any glow.
- **Rigged** with the bones its body needs, and moved: breathe or idle, walk (or float, slither, fly), the attacks its
  M7 moves need, being hit, falling.
- **Light-model budgets** (the hub's suggestion until Chris says otherwise; packs of rabble share the screen with the
  party): Champions about 50,000 triangles, Relic-Bearers about 40,000, veterans about 30,000, rabble about 20,000.
  Phone assets (meshes compressed, pictures at 1024 or 512 px) about 0.8 MB for a Champion and 0.4 MB for rabble, so an
  act's foes fit a game page.
- **For the fight**: each foe works through the Fight's `setBeastLook` shape (`world3d/battle/arena.js`): `{ group,
  plan, height, parts, update(t, step) }` plus `hit()`, `act.lunge`, `act.fall` and `pose(move, u, t)`, as session 6's
  `briarmawLook` does (`prototypes/foe-hd/page/briarmaw.js`).

## Who does which

| Session | Lane | Its foes (Act One first, then in the order they're met) |
|---|---|---|
| 6, One Foe | **the kit**, then the strange ones | finish Briarmaw (pass 3); turn the recipe into a shared kit (below); then briarling, glowcap, boglurcher, the willows (willow-wight, Grandfather Willow), the sparks (marsh-light, forge-spark), rockling, Mother Anvil (the wraiths moved to Models, November 21). Then (from November 23): Briarmaw lively again (his legs drawn out of his belly in the sculpt, re-baked, his swing back within the stretch rule), and the Gloomfen's deep beasts from Places: mire-leech, blackwater-gar, Old Jaws, the Blackwater Leviathan |
| 7, Beasts | four legs, frogs | thornhound, rotstag, Old Snag, the Mirelord, rotgrub; then rime-wolf (the desert's and the deep's beasts moved to Places, the winged ones to Models, November 21 and 23) |
| 4, Places | the desert (from November 21) | the Sunscorch's: sand-skink, glass-scorpion, the Glass Matriarch, the Sand Wyrm, Kharzul (the Gloomfen's deep beasts moved to session 6, November 23). The kit as every lane uses it |
| 8, Walkers | two legs | the Rotwarden, sapwight; then Old Horn, peak-troll, unmade (the armoured ones, the Unsmith and the stone and forge constructs moved to Models, November 21 and 23) |
| 3, Models | the wraiths (from November 21) | the robed ones, in Act order: drowned, bell-ringer, drowned-choir, drowned-cantor, drowned-abbess, choir-wraith, rime-wraith, the Rime-Abbot, the Lantern Mother, mirage-wisp, wisp-queen. Built with the people builder and the sculpted masters (robe, hood, mantle, hands), shaped to Chris's sheets, each with its whole sculpt kept to look at; ghostly cloth, mist, weeds, lanterns, bells, books and staves as their sheets show. Same rules as every lane: no stretching, a look the Fight can take (`setBeastLook`, chained with the kit's `foeLook`), its own named moves for the Fight's Champions' table. Then (from November 21, from session 8) the armoured walkers and the Unsmith: iron-sentinel, the Sentinel-Captain, the Ashen Warden (metal armour, helm, shield, blade: rigid plates over a body) and the Unsmith (a person: apron, tools, his forge-light). Same rules, the walkers' named moves for the Fight's table. Then (from November 23, from session 8) the stone and forge constructs: cinder-thrall, the Journeyman, forgeborn, forge-warden, thrall-overseer, bellows (cracked stone and forge-iron bodies with glowing cores, aprons and tools: rigid pieces). Then (from November 23, from session 7) the winged: lamp-moth, the Gloamwing, the Thunder-Roc (wings of rigid feathers or membranes on jointed spars, insect segments) |

The body plans are the Bestiary's (`prototypes/bestiary/beasts.js` `BEASTS`); Chris's sheets are
`art-in/3d/sheets/sheet-<key>.webp`.

## The kit, and whose files are whose

- `prototypes/foe-hd/` is session 6's. Its step 2: turn the Briarmaw scripts into a **shared kit**, the parts every
  foe uses (the shape-against-the-sheet checks, the surface makers for tufts, plates, scales and cloth, the bake, rig
  templates per body plan, the packing, the page's loader and a `setBeastLook` function that serves every finished foe),
  documented in its README. Briarmaw moves into `prototypes/foe-hd/foes/briarmaw/`.
- Each foe lives in `prototypes/foe-hd/foes/<key>/` (its sculpt script, its made assets, its notes), owned by the
  session whose lane it's in.
- Each lane keeps its own gallery page in `prototypes/foe-hd/pages/<lane>/` (`kit`/`strange` for 6, `beasts` for 7,
  `walkers` for 8): its finished foes on turning stands beside their sheets, their moves, triangle counts, and a crowd
  test; republished as each foe lands.
- Until the kit lands, sessions 7 and 8 start from session 6's scripts (copy what you need into your foe's folder) and
  move onto the kit when it comes. Ask session 6 directly for what the kit needs (send it a message; tell the hub in
  your slip if it changes anything for other jobs).
- Read only: `game/` (frozen), `art-in/` (Chris's originals), `prototypes/bestiary/` and `prototypes/hero-3d/`
  (Models), `world3d/` (the Fight, Places, the hub).

## Check, and deliver

- For each foe, renders beside its sheet from front, side and back (the sheet's outline over them), the light model
  next to the sculpt, and its triangle count and phone asset size.
- Each gallery page loads headless with no errors (Playwright's Chromium, `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`), and stays under 16 MB (the page can hold the latest foes and link to an earlier page).
- Slips: `docs/project/slips/foe-hd.md` (6), `slips/foes-beasts.md` (7), `slips/foes-walkers.md` (8). Message the hub
  with the link and the commit as each foe lands.

## No stretching (Chris, November 21)

Chris saw the Rotwarden stretch as he moved his arms (`docs/project/from-chris/2026-11-21-rotwarden-stretch.webp`:
waist, belt and straps dragged out into a web after the spread arms). Rules for every rigged model, foe or hero:

- **Weights by part.** A point takes weight only from the bones of the part it belongs to. Arm bones move arm
  points only; hips, belt, straps, sashes and anything worn on the trunk follow the hips, spine and chest, never an arm,
  even where the arm hangs against them at rest. Blend only in a narrow band at each joint (shoulder, elbow, hip).
- **Bind away from the body.** Weight with the arms and legs held clear of the trunk (an A pose), or mask the
  automatic weights by part, so nearness at rest can't bleed weight across.
- **Bones turn; they don't grow.** Moves rotate bones. No bone is scaled or moved along its length (the root and the
  whole body may move).
- **The stretch check** (in the kit: `kit/tools/stretch.mjs`; every lane runs it): pose each move at many frames and
  compare every edge with the rest pose. One rule for every lane (hub, November 21): **an edge longer than 1% of the
  foe's height must stay under 1.3 times** its rest length (that is the webbing Chris saw); **small edges in the creases
  of bending joints** (knee, elbow, hip, throat, mouth corners, ear roots) may reach 3 times, since plain skinning always
  stretches the outside of a bent joint a little; and no bone may be scaled or slid. Run it on every foe already made
  and on each new one before it is handed in, and look at the worst frame by eye: nothing may visibly web or pull.
  Helper bones at knees, elbows and throats (to keep a joint's volume) are a later pass, in the kit, for every lane.
- **Only a foe that passes goes into the game** (hub, November 21). The Fight's and Together's pages show a foe in full
  detail only once its stretch check passes on every move (`stretch.json` in its folder says so); until then it keeps
  its stand-in look there. Passing now: Briarmaw, the briarling, the glowcap, the boglurcher, the willow-wight, Grandfather Willow, the marsh-light, the forge-spark, the Rotwarden, the sapwight, Old Horn, the peak-troll, the Rot-Stag, Old Snag, the rockling, Mother Anvil, the sand-skink, the glass-scorpion, the Glass Matriarch (the wraiths are rigid and can't stretch).
