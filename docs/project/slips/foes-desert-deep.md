# Slip: the desert and the deep (Places, session 4, from November 21)

The Sunscorch's beasts (sand-skink, glass-scorpion, the Glass Matriarch, the Sand Wyrm, Kharzul) and the Gloomfen's
(mire-leech, blackwater-gar, Old Jaws, the Blackwater Leviathan), made with the foe kit (`prototypes/foe-hd/README.md`).

- Gallery: https://claude.ai/artifact/EwHdrinmmvPGCqF48sjdFP (`pages/desert-deep/`: every finished foe of the lane,
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

## Needs

- **For the game** (Together, the Fight): session 6's kit now reads a foe's own moves set (`light.json` `moves`, from
  foe.json; job/foe-hd after a4f6b4f). Before registering my foes: `addMoves('lizard', lizard)` and
  `addMoves('scorpion', scorpion)` from `pages/desert-deep/moves/`. My light models carry `moves` once rebound
  after the hub brings that kit change in.
