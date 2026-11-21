# Slip: Foes: beasts (session 7, branch `job/foes-beasts`)

The beasts on four legs, the scorpions, serpents, the frog and the winged ones, each in full detail, made the way
session 6 made Briarmaw.

## Done

- **The beasts' gallery, first look:** https://claude.ai/artifact/64Ukg3yQAAb8DWz69xqvxs (5.6 MB)
  - **The thornhound**, the first foe anyone meets. Sculpted in code from measurements of Chris's sheet, shape first
    and checked against the sheet's outline from the front, side and back at the sheet's own scale (about three
    quarters of each outline overlaps; the misses are mostly the side thorns and the fluffier lower legs). Then the
    detail: about 600,000 triangles. His fur is big locks that overlap, each with a rounded crest and a tip split into
    points, with no tiny hairs. The garland is real leaves on a twisted bramble, with spiky golden flowers, and the
    golden thorns hook back toward the tail.
  - Baked in Blender onto a light model of **20,252 triangles** (rabble size), with 28 bones (four in each leg, four in
    the tail, the ears and the jaw). His moves: breathe, walk, Bite, Lunge (a long trembling crouch, then the leap),
    Pack Howl, hit, fall.
  - On the page: his turning stand, the moves, the numbers, his renders under Chris's sheet, and **a pack of five
    walking round the four heroes**.
- **The laptop page, with the sculpt itself:** https://claude.ai/artifact/8pCvG7xuqHuCcARiUYa9SX (9.8 MB). A button
  swaps the light model for the full 606,104-triangle sculpt (kept in `foes/thornhound/assets/sculpt.bin`, 3.1 MB
  compressed), as Chris asked (sculpts 500,000 to 1,000,000 triangles, kept as something he can look at).
- Checks: the page loads headless with no errors at laptop and phone sizes, no sideways scroll; 20 frames a second in
  software drawing (much slower than a phone's graphics chip), with the pack too.

- **No stretching (Chris, November 21):** a stretch check of my own, `pages/beasts/stretch.mjs <foe>`, poses every
  move at seven moments, skins the light model and compares each edge with its rest length. The thornhound was bad:
  up to **16.8x**, 670 edges over 1.3x in one pose (the two front legs pulling the chest between them like a web, the
  hips dragging the thigh, the head pulling the chest, the ears pulling the neck). Fixed by: where each bone may
  reach (a leg's lower bones stay below their joint, the tail's below its own, the head's in front of the neck, the
  neck off the shoulders), the weights smoothed over the surface 8 times, and a smaller neck bend in the howl and
  foreleg reach in the lunge. Now: **worst 3.4x**, and at most 39 edges in any pose both over 1.3x and longer by more
  than 1% of his height (9 mm). What's left is mostly the mouth (the light model's lips are joined, so opening the jaw
  stretches the corners) and the throat and ear roots in the hit and howl. Still to do: a cut mouth in the light model
  and finer neck weights, to get under 1.3x everywhere.

## Next

0. Move onto session 6's shared kit (commit f384b7d / 8f3b6e2 on job/foe-hd) once the hub brings it into its branch; my
   kit folder then goes, and the thornhound is rebuilt on it.

1. The rotstag, Old Snag, the Mirelord, the rotgrub and the Gloamwing (Act One), then the rest in the order they're met.
2. The thornhound, pass two: the fur still reads a little like bark from far off; softer locks, the face's markings
   (the pale brows, the tan cheeks), teeth for the open-mouth moves, and the phone size down to about 0.4 MB
   (512 px pictures; he is 1.07 MB now).

## How (for the other foe sessions and the kit)

- `prototypes/foe-hd/pages/beasts/kit/` is my working copy of session 6's scripts, made general, until the shared kit
  lands: `sdf.py` (shapes, a narrow-band marching cubes that's about ten times faster), `coat.py` (the coat: session 6's
  tufts and a new "lock" style for fur), `bake.py` (budgets, bones and weights from the foe's own `rig.py`; the body
  gets most of the picture), `abscheck.py` (the outline check at the sheet's own scale), `foe.js` (loads any foe for
  three.js, `fullDetailLook(makers, buildBeast)` for the Fight's `setBeastLook`), `moves-quad.js`.
- Each foe: `foes/<key>/sculpt.py`, `rig.py`, `foe.json`, `make.sh` (start to finish), `assets/`.

## For the Fight

- `kit/foe.js` `buildFoe(makeShared(A), quad, { height, plan })` returns the `buildBeast` shape with `hit()`,
  `act.lunge`, `act.fall` and `pose(move, u, t, step)`, like session 6's `briarmawLook`.

## Questions for Chris

- None yet. (The thornhound is 0.9 m to his ear tips, as in the Bestiary; say if he should be bigger next to the heroes.)

## Changed outside my files

- Nothing. (Installed Blender 4.0 and Python packages in this container only.)
