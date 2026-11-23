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

## Needs

- **Session 6 (the kit)**: a foe's own moves aren't reachable from `looks.js` `register` unless its plan is in `PLANS`.
  The sand-skink uses `pages/desert-deep/moves/lizard.js` (plan `quad` in its light model). Asked for: either
  `lizard` added to `PLANS`, or `register` reading a moves name from the foe (e.g. `light.json` `moves`).
