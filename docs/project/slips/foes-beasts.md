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
  foreleg reach in the lunge; then the ear roots tied to the head (not the neck), and the jaw opening less.
  **Now: worst 2.6x** (was 16.8x). No webbing in any pose (side views of every move checked by eye).
  - What's still over 1.3x, and the limit I hold it to: small edges in the creases of bending joints (knee, elbow,
    hip, the throat in the howl, the mouth corners in the bite, the ear roots in the hit), at most 2.7x on edges
    under 1 cm, and at most 40 edges in any pose that are both over 1.3x and longer by more than 1% of his height.
    Plain bone-weighted skin always stretches a little on the outside of a bent joint; getting every edge under
    1.3x would need extra helper bones at the knee, elbow and throat (next pass, and a cut mouth with overhanging
    lips in the light model).

- **The kit's stretch check and binding (November 21):** the thornhound is now weighted with session 6's
  `kit/rigs/bind.py` (`foes/thornhound/rebind.py`, my reach masks passed in as its `weigh()`, wide joint bands, the
  leaves rigid), his tail hung clear of the haunches, the garland started behind the neck, breathing a small turn, and
  every move's big bends made gentler. The kit's `stretch.mjs` (48 frames a move) still fails every move: worst 2.7x
  (lunge, the shoulder), walk 2.3x, bite 2.1x, howl 2.0x, hit 1.7x, fall 2.3x, idle 1.5x (two triangles at an ear
  root). The stretched patches are small (knee, shoulder, throat, tail root; the pictures are in
  `foes/thornhound/build/stretch/`), and no move shows a web by eye. To get under 1.3x the rig needs more joints where
  big masses turn (a shoulder blade, a thigh-to-haunch helper, two neck bones); that's the next pass, before more
  bending is taken out of his moves.

- **Against the lanes' rule** (hub, November 21: edges longer than 1% of the height under 1.3x, crease edges under
  3x, no scaled bones, no webbing): no edge past 2.4x, no scaled or slid bones, no webbing by eye; but in the worst
  pose 129 edges longer than 9 mm still pass 1.3x (my `stretch.mjs` now prints this verdict). The hub has passed
  him; helper joints from the kit should clear the rest.

- **Where the big edges still stretch** (rule: edges longer than 1% of the height under 1.3x). On a 0.9 m foe almost
  every light-model edge is longer than 9 mm, so the rule is nearly 1.3x everywhere for him. The worst big edges:
  the top of the shoulder in the walk (spine and upper foreleg, 1.9x), the rump where the thigh meets the tail root
  (1.8x), the throat in the howl (neck and chest, 2.0x), the neck and chest in the fall (1.6x). I have not stiffened
  him further, as asked.
- **For session 6: helper joints for the kit** (proposal). Plain skinning can't spread a big turn where heavy masses
  meet, whatever the weights. Suggested for every four-legged plan, each following its parent part of the way:
  1. a **shoulder blade** per foreleg (chest > blade > upper), which turns about half the upper leg's swing, so the
     top of the shoulder slides instead of stretching;
  2. a **haunch** helper per hind leg (hips > haunch > upper), likewise half the thigh's swing, weighted to the big
     muscle round the hip;
  3. **two neck bones** in place of one (chest > neck1 > neck2 > head), each taking half the neck's bend, so the throat
     stretches over twice the length;
  4. a **tail root** helper (hips > tailroot > tail1) taking a quarter of the tail's sway.
  The moves need nothing new: a helper reads its child's turn in pose() (the kit's loader could do it after every
  pose, e.g. `HELPERS = { fl_blade: ['fl_upper', 0.5], ... }`).

- **The kit's stretch check with the one rule** (hub 7cc2a1d, run from the kit on the hub's branch): breathing passes;
  walk, bite, lunge, howl, hit and fall fail on big edges (the top of the shoulder in the walk and lunge, 2.3x; the
  throat in the howl and fall; the ear roots in the bite and hit, 1.6-1.7x). The weigh() gate is now +1000 (a hard
  never), as session 6 advised; it barely moves the result, because the bands and smoothing carry the neck back onto
  the ear roots. Waiting on the kit's helper joints and a gate that holds through the bands.

- **With the kit's helper joints** (November 21, hub e6acb48): the thornhound now has shoulder blades, haunches, the
  neck in two and a tail root (the page drives them with the kit's `applyHelpers` after every pose); his reach masks
  go in as the kit's soft `mask(P, idx)`; his legs are kept off the body as Briarmaw's rig does (nothing above 81% of
  the shoulder, nothing near the middle line, nothing beyond each bone's reach); the mouth is cut along the lips
  (the kit's SPLIT); the head bone starts behind the ears. Kit check now: worst big edge 2.1x (was 2.3x), and far
  fewer big edges over 1.3x in most moves (bite 15, hit 31, fall 59, idle 2); still FAIL on every move. What's left:
  the hind knee in the walk and lunge (1.8-2.0x, the most edges), the throat in the howl (2.1x), the ear roots in the
  bite and hit (1.7-1.9x).

- **One more round on the hind knee** (as the hub asked): a wider knee band took the walk from 132 big edges over
  1.3x to about 100; the haunch helper's share (tried 0.3, 0.5, 0.65) made little difference; the lunge stays at
  about 410 (2.0x). Stopped there, as the hub said. The cause, as session 6 found on Briarmaw: his hind legs are
  sculpted tucked into the haunches, so they can't swing without dragging the body. Next time round: re-pose his hind
  legs clear of the body in the sculpt and bake again.

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
