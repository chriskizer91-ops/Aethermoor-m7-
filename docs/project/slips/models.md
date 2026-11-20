# Slip: Models (session 3, branch `job/models`)

Last updated November 20 (step 2, Act One).

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

## Next

- Step 2, the rest: the Champions and Relic-Bearers beyond Act One (Kharzul, Mother Anvil, the Rime-Abbot, the
  Lantern-Mother, the Blackwater Leviathan, the Unsmith, the Wisp-Queen, the Glass Matriarch, the Thunder-Roc, Grandfather
  Willow, Old Horn...), then the others.

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
- Not checked: frame rate on a real phone.
