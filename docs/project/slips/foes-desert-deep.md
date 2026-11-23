# Slip: the desert and the deep (Places, session 4, from November 21)

The Sunscorch's beasts (sand-skink, glass-scorpion, the Glass Matriarch, the Sand Wyrm, Kharzul) and the Gloomfen's
(the Gloomfen's beasts went to session 6 on November 23), made with the foe kit (`prototypes/foe-hd/README.md`).

- Gallery, page 1 (the skink, the scorpions): https://claude.ai/artifact/EwHdrinmmvPGCqF48sjdFP; page 2 (the Sand Wyrm,
  Kharzul): https://claude.ai/artifact/2r6Q5RAfU9MqqaLsQvH2KF. A "Full detail alone" button on each. (`pages/desert-deep/`: every finished foe of the lane,
  pick one at the top; beside its code-built model and Chris's sheet; its moves; six at once with the heroes).

## Done

### The sand-skink (rabble), November 21

- Sculpt to Chris's sheet: 1,036,230 triangles (`foes/sand-skink/`, kept as `assets/sand-skink-sculpt.glb`, 4.5 MB);
  the kit's `scale` coat (its first use), banded dark brown across a sandy back, cream belly; golden crest spikes, a
  crown of spikes round the head, dark eyes, four toes a foot with dark hooked claws. Laptop page:
  https://claude.ai/artifact/SLHAnYPiHyGVqdXk3y6WfD
- Light model 17,516 triangles (rabble ~20,000), 28 bones (the quad template with three more tail bones). Phone:
  mesh 0.3 MB, pictures at 512 px 0.2 MB.
- **Stretch check: PASS** on every move (worst big edge 1.22x, worst crease 1.14x); worst frames looked at by eye.
  What it took: paw bones aimed where the splayed feet go; the shoulder blades and haunches kept to their own joints
  (they had claimed the side up to the neck, and the binder cut the mesh between blade and neck: a tear); the neck and
  tail root counted as trunk (no cut against them); the throat behind the jaw given to the neck, so the mouth is cut
  from the head only along the lips.
- Its own moves: `pages/desert-deep/moves/lizard.js` (the kit's quad moves, a tail that sways and lashes down four
  bones, a short sprawled-leg claw). foe.json `stretchMoves` points the check at them.

### The glass-scorpion (veteran) and the Glass Matriarch (its lair-boss variant), November 23

- A shared scorpion builder (`pages/desert-deep/py/scorpion.py`, from sheet measurements) and rig
  (`scorpion_rig.py`): every back plate, the carapace, each tail segment and the sting, each piece of each leg and
  pincer is its own **rigid piece** riding the bone it lies along, overlapping at the joints as a real one's do, so
  nothing on a scorpion can stretch (stretch check 1.00x on every move). Styles `glass` (smooth clouded glass,
  rimmed plates) and `crystal` (faceted plates, gold crystals on the back, copper tips). Kharzul will use it too.
- Moves `pages/desert-deep/moves/scorpion.js` (foe.json `"moves": "scorpion"`): Wait, Walk (alternating tetrapod),
  Pincer, Glass Sting (the tail stabs over the head), Carapace (hunkers behind its claws), Moult, Shell Rain, Hit,
  Fall (rolls onto its back); the common names aliased (bite, swipe -> Pincer; strike -> Glass Sting; cast, roar ->
  Shell Rain).
- Glass-scorpion: sculpt 807,488 triangles (3.2 MB glb), light model 24,244 (veteran ~30,000), 39 bones. Laptop:
  https://claude.ai/artifact/D49CZMPK2Q3ukBKRytYAHr
- The Glass Matriarch: 1.0 m, sculpt 776,928 triangles (3.1 MB glb), light model 33,164 (~40,000), pictures at 2048
  (phone 1024). Laptop: https://claude.ai/artifact/94S3612ZZtUFsYE99A7oba
- The gallery is built with the phone pictures (`--phone`) to stay under 16 MB (15.2 MB with three foes); the next
  foes go on a second gallery page linked from it.

### Chris's notes on the scorpions (November 23)

- The Matriarch's crystals flew off with her tail in the Glass Sting: the crystals now ride the body (scorpion_rig.py).
- The sting stung the back of its own head: the strike now straightens the tail and leans it from its root so the tip
  lands about 5 cm past the face at face height (measured by `pages/desert-deep/tools/reach.mjs`; angles per foe).

### The Sand Wyrm (relic-bearer), November 23

- Sculpt to the sheet: 981,408 triangles (4.2 MB glb): a body of capsules under big rock plates (the kit's `plate`
  coat), a heap of rounded rocks round its foot, a gold scale with holes in it either side (the wyrmscale), and a
  round mouth: a thick lip in five rigid pieces with two glass teeth each. Laptop:
  https://claude.ai/artifact/La6N8h126JumPRLHs7ZyPk
- Light model 40,580 triangles (relic-bearer ~40,000), 19 bones: `sand` (the still root under the mound; the rocks ride
  it), w0..w10 up the body, head, `mouth` (at the middle of the mouth, +z out of it: for the Fight), lip0..lip4.
- Moves `pages/desert-deep/moves/wyrm.js` ("moves": "wyrm"): Wait, Sway, Maw, Thrash, Sand-Dive, Swallow, Spit,
  Scale-Grind, Hit, Fall. The mouth opens by turning its five lips outward on their hinges (no bone grows). The body
  tips from where it leaves the sand (no stretch), then leans its lower body and uncurls its arch a little, so the
  mouth strikes out and down in front of it. `SWALLOW_AT = { u: 0.52, ahead: 1.6, up: 0.54 }`: when the mouth is down
  over its target and where (metres from its root; `tools/track.mjs`).
- **Stretch check: PASS** on every move (worst big edge 1.27x in Swallow). What it took: joints blending over 60 cm (a
  thick body), the tip from the root instead of bending, the gold scales as rigid pieces (kind 4 is skinned), and
  the mound on its own still bone.
- Bake lessons: rigid parts must be the same at every level (the rocks' count differed between the light model and
  the sculpt: black patches); a part much coarser on the light model needs a longer `bake.reach.parts`.

- Its move names now also answer to the Fight's ids: `scale-grind` and `sand-dive` (ALIAS in `wyrm.js`); the
  scorpions' to `glass-sting`, `carapace`, `shell-rain`.

### Kharzul (champion), November 23

- Sculpt to the sheet: 756,916 triangles (3.1 MB glb): the scorpion builder (`py/scorpion.py`, `crystal` style) at
  wagon size, blue glass plates on its back (the Glass Carapace), a seven-part tail, and Cinderfang: a gold ring, a
  hilt and a curved two-sided blade whose edge glows molten. Laptop: https://claude.ai/artifact/EaS9GoMX1Gb8qQ1Ysy2Yno
- Light model 41,864 triangles (a champion's budget runs to ~50,000; it needs no more), 41 bones: the scorpion's,
  with tail1..tail6 and `sting`; the ring, hilt and blade all ride `sting`, the back crystals ride `body`.
- Moves `pages/desert-deep/moves/kharzul.js` under the Fight's ids from `champions.js`: `tail-lash`, `glass-sting`,
  `glasscutter` (the tail curls over and sweeps the blade across its whole front), `burrow` (sinks right under, the
  raised blade too; `SINKS = { burrow: true }`, then `surface`), `erupt` (bursts up out of the floor and the blade
  comes down), `carapace-brace`, `glass-rain`, `molten-tail` (slow, the blade held high first), plus Wait, Walk,
  Pincer, Hit, Fall. ALIAS: bite → glass-sting, strike → tail-lash, swipe → glasscutter, cast → carapace-brace,
  roar → glass-rain. Every stab reaches past its own face (`tools/reach.mjs`: Tail Lash 0.79 m, Erupt 0.78 m,
  Glass Sting 0.59 m, Glasscutter 0.58 m), so it never stings itself.
- **Stretch check: PASS**, 1.00x on every move (all its pieces are rigid).

## Needs

- **Session 6 (the kit)**: `Coat.coat(V, want_id=True)` with `shape='plate'` at level 2+ fails (the crack term `q` is
  (n, 1), so `q[r, j]` is out of range). I work round it with `lv=1`.

- **For the game** (Together, the Fight): session 6's kit now reads a foe's own moves set (`light.json` `moves`, from
  foe.json; job/foe-hd after a4f6b4f). Before registering my foes: `addMoves('lizard', lizard)`,
  `addMoves('scorpion', scorpion)`, `addMoves('wyrm', wyrm)` and `addMoves('kharzul', kharzul)` from
  `pages/desert-deep/moves/` (`kharzul.js` imports `scorpion.js` beside it). My light models carry `moves` once rebound
  after the hub brings that kit change in.
