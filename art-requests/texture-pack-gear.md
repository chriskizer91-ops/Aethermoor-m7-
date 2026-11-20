# Texture pack: the heroes' weapons, armour and looks

The 3D heroes are built in code: every sword, helmet, shield and robe takes its shape from the same numbers the
game uses for its pixel art, so every item in the game can be swapped and still look right. What code can't do
well is the **surface**: the grain of oak, the weave of wool, the rings of chain mail, the scratches on a blade.
Right now those surfaces are generated too, and they look plain up close.

This pack asks for those surfaces as pictures. They are **not** pictures of items. Each one is a small square of
material that repeats seamlessly, like a tile, and the code wraps it round any shape. One "oak" picture covers
every wooden haft, bow and shield in the game. The item cards can still get their own big paintings later; this
pack is only what the 3D models are made of.

## How to make them

1. Open ChatGPT (or any image generator) and paste one prompt at a time. Each prompt already has the style in it.
2. Make two or three tries and keep the one that repeats best: put four copies side by side in your head. If a
   seam shows down the middle or a blotch repeats, try again.
3. Save each as the **file name** in the table, square, 1024 × 1024 if you can (2048 is welcome, 512 is fine).
4. Send them back in any batch. I'll make them seamless where they aren't, work out the bumps from the light and
   dark in each picture, and tint them with the game's own colours (so a "leather" picture serves brown, red and
   black leather alike).

**The rules that make a texture work** (already in every prompt): seen straight on from above, flat even light,
no shadows thrown across it, no single object in the middle, the same busy-ness everywhere, edges that join up.

## The style, in every prompt

> Seamless tileable texture, square, seen straight on with flat even lighting and no cast shadows, no perspective,
> evenly busy across the whole frame with no focal point, edges that wrap. Hand-painted stylized fantasy, rich and
> crafted like a high-end storybook JRPG, fine detail that still reads from a distance.

Each prompt below starts with what the material is; paste the style line after it (or just paste the whole row).

## 1. Metals (12)

| File | Used for | Prompt |
|---|---|---|
| `metal-steel.png` | blades, helms, plate | Polished steel plate with fine brushed lines running one way, faint hammer marks, light scratches and nicks, cool grey. + style |
| `metal-iron.png` | rough weapons, rims, bands | Dark forged iron, hammered and pitted, with a slightly oily sheen and soft rust in the pits. + style |
| `metal-blackiron.png` | Cinderfang, the Unsmith's pieces, the Ironwall | Blackened iron, almost black, with a faint blue-purple heat tint and fine forge scale. + style |
| `metal-silver.png` | Isolde's Oath, crozier, trims | Bright worked silver, softly polished, with very fine engraved hairlines and a little tarnish in the lines. + style |
| `metal-gold.png` | guards, crowns, settings | Rich old gold, warm and buttery, softly worn bright on the high spots, darker in the hollows. + style |
| `metal-bronze.png` | bands, bosses, bells | Warm bronze with a deep brown-orange tone, light green verdigris freckles in the hollows. + style |
| `metal-brass.png` | Wyrmscale, lanterns | Yellow brass, slightly dull, with fine circular polishing marks. + style |
| `metal-voidiron.png` | the Hearth Below's relics | Dark iron that seems to swallow light, near-black with faint violet veins like cooling cracks. + style |
| `metal-filigree.png` | trims on rare items, crowns | Ornate gold filigree scrollwork, curling vines and loops raised from a dark metal ground, an all-over repeating pattern. + style |
| `metal-engraved-steel.png` | heirloom blades and plate | Steel engraved all over with flowing fantasy scrollwork and small runes, fine and shallow. + style |
| `metal-etched-runes.png` | the band of runes near a fine sword's guard | A long panel of etched runes in the style of an ancient smith's mark, dark etching on bright steel, runes in a neat row, repeating up and down. + style |
| `metal-hearth-sun.png` | Hearthwarden pieces, the Keep's relics | A repeating pattern of small stylised suns and flames, engraved in gold, the emblem of an eternal hearth. + style |

## 2. Mail and scale (3)

| File | Used for | Prompt |
|---|---|---|
| `mail-riveted.png` | chain shirts, hauberks, coifs | Riveted chain mail, small interlocking iron rings in neat rows, each ring catching a little light. + style |
| `mail-scale.png` | scale armour, Wyrmscale | Overlapping metal scales like a fish or a dragon, rows offset, each scale with a raised ridge. + style |
| `mail-brigandine.png` | brigandines | Cloth-covered armour: dark fabric with rows of round brass rivet heads holding plates underneath. + style |

## 3. Leather and hide (7)

| File | Used for | Prompt |
|---|---|---|
| `leather-smooth.png` | boots, belts, grips | Smooth vegetable-tanned leather, fine natural grain, slight creases, warm mid brown. + style |
| `leather-worn.png` | old boots, quivers | Heavily worn leather, scuffed pale at the edges, deep creases and cracks, darker in the folds. + style |
| `leather-tooled.png` | heirloom belts, saddle-style pieces | Hand-tooled leather with an embossed knotwork border pattern all over, rich brown. + style |
| `leather-stitched.png` | jerkins, gloves | Leather panels joined by neat rows of thick thread stitching, a grid of seams. + style |
| `leather-wrap.png` | sword grips, haft wraps | Leather strips wound tightly round and round, overlapping diagonally, seen flat. + style |
| `hide-fur.png` | Trollhide Mantle, collars, Pip's trim | Short dense animal fur, grey-brown, combed one way, soft tips. + style |
| `hide-scaled.png` | the Wyrm's hide, Glass Carapace's lining | Rough reptile hide with small pebbled scales, muted green-grey. + style |

## 4. Cloth (9)

| File | Used for | Prompt |
|---|---|---|
| `cloth-wool.png` | tunics, cloaks | Coarse woven wool with a visible weave and soft fuzz, undyed oatmeal. + style |
| `cloth-linen.png` | robes, Alondra's white | Fine linen with a tight plain weave and slight slubs, off-white. + style |
| `cloth-velvet.png` | regalia, royal robes | Deep velvet with a soft sheen that shifts, crushed slightly, rich crimson. + style |
| `cloth-felt.png` | hoods, hats | Dense pressed felt, matte, fibres just visible, forest green. + style |
| `cloth-gambeson.png` | padded jackets under armour | Quilted padded cloth, diamond stitching in a grid, puffed between the seams. + style |
| `cloth-canvas.png` | tabards, sashes | Heavy canvas cloth, a strong over-under weave, a little frayed. + style |
| `cloth-embroidery-band.png` | hems, cuffs, robe trims | A long border band of gold-thread embroidery, interlaced knots and leaves, on dark cloth; the band runs edge to edge across the picture. + style |
| `cloth-brocade.png` | storied and heirloom robes | Woven brocade with a repeating pattern of flowers and vines in gold thread on deep blue. + style |
| `cloth-rough-sack.png` | rags, worn items | Rough sackcloth, loose weave, patched and frayed, brownish grey. + style |

## 5. Wood, bone, horn, stone (10)

| File | Used for | Prompt |
|---|---|---|
| `wood-oak.png` | hafts, bows, shields | Planed oak with long straight grain and small knots, warm golden brown. + style |
| `wood-bogwood.png` | dark hafts, Cairnmaul | Ancient black bog oak, dark and dense, grain like water ripples. + style |
| `wood-bark.png` | Rootsong, Thornsplitter, Bryn's staff | Rough living tree bark with deep furrows and a little moss in the cracks. + style |
| `wood-planks.png` | shields, the Ironwall | Vertical wooden planks butted together, each with its own grain, small nail holes. + style |
| `wood-wicker.png` | Willow Ward | Woven willow wicker, withies going over and under, pale green-gold. + style |
| `bone-ivory.png` | Briarfang, the Gar's Tooth, nocks | Polished old ivory and bone, creamy with fine growth lines and tiny cracks. + style |
| `horn-antler.png` | Hartshorn | Stag antler, rough ridged surface at the base turning smooth and pale at the tips. + style |
| `stone-granite.png` | Cairnmaul's head, the Oathshield | Speckled grey granite, rough-hewn, with mica glints. + style |
| `stone-sandstone.png` | Dunebreaker | Warm sandstone, layered bands, gritty and slightly crumbled. + style |
| `stone-obsidian.png` | dark relic stones, Runestaff | Glassy black volcanic stone with conchoidal ripples and faint red glints. + style |

## 6. Their looks (6, optional)

These are for the heroes themselves. The faces are painted in code now; these would make them richer.

| File | Used for | Prompt |
|---|---|---|
| `hair-strands.png` | every hero's hair | Long hair strands flowing straight down, fine individual strands with soft highlights, neutral mid brown, on a transparent background if possible. + style |
| `skin-soft.png` | faces and hands | Soft painted skin, very subtle warmth and pores, neutral mid tone, no features. + style |
| `face-wren.png` | Wren's face | A front-on face texture laid flat for a 3D head, like a mask unwrapped: a young Hearthwarden with auburn hair at the edges, fair skin, dark blue eyes, determined friendly look, painted storybook JRPG style, flat light, no hair over the face, plain skin colour filling the rest of the square. |
| `face-pip.png` | Pip's face | The same kind of flat face texture: a young scout, pale freckled skin, copper hair at the edges, green eyes, cheeky grin. |
| `face-bryn.png` | Bryn's face | The same kind of flat face texture: an elf druid, tan skin with faint bark-like markings on the cheeks, moss-green hair at the edges, amber eyes, calm. |
| `face-alondra.png` | Alondra's face | The same kind of flat face texture: a blind priestess, deep brown skin, a white cloth blindfold across the eyes, black hair at the edges, serene smile. |

**47 pictures in all** (41 without the optional ones). Send them in any order; the metals, mail and leather make
the biggest difference first.
