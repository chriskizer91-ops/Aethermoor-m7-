# One Foe: Briarmaw in full detail

Briarmaw, Act One's first Champion, three ways side by side (the code-built model, a cut-out of Chris's sheet, and
the full-detail light version baked from a sculpt), with his moves and a crowd test.
Published: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh

## The recipe

Needs Blender 4.0 (`apt-get install blender`) and Python 3.12 with numpy, scipy and scikit-image
(`apt-get install python3-numpy python3-scipy python3-skimage`), and `npm install` here.

```
python3.12 blender/sculpt.py build 1        # pass 1, shape (~130k triangles): build/high-1.npz
python3.12 blender/sculpt.py build 2        # pass 2, form  (~400k): strands and partings in each tuft
python3.12 blender/sculpt.py build 3        # pass 3, detail (~1M)
blender -b -P blender/preview.py -- build/high-2.npz build/p2       # front, side, back renders
python3 blender/compare.py build/p2 build/cmp2.png                  # beside the sheet
python3 blender/outline.py build/p2 build/out2.png                  # outlines over the sheet's
blender -b -P blender/bake.py -- build/high-2.npz build/high-1.npz build/bake2048 2048
python3 tools/textures.py build/bake2048 assets                     # the pictures, and the sheet cut-out
python3.12 tools/export_sculpt.py build/high-2.npz build/sculpt2
node tools/pack.mjs build/bake2048 build/sculpt2 assets             # the meshes, compressed
node build.mjs                                                      # dist/briarmaw.html
node tools/check.mjs dist/briarmaw.html build/shots                 # headless check and screenshots
```

1. **The sculpt** (`blender/sculpt.py`): the body is one smooth signed-distance shape measured off the sheet (barrel,
   hump, shoulders, haunches, head with brow, snout, nose, jowls and grin, legs and paws, the tail). His coat is about
   1,500 big leaf-feather tufts sculpted into that surface: at every point the topmost tuft sets the height, so they
   overlap like shingles. Pass 2 gives each tuft feather barbs (strands angled out from a midrib) with broken tips; pass
   3 finer strands. Thorns, the crown, vines, tusks, teeth, claws and eyes are real geometry on top.
2. **The light version** (`blender/bake.py`): the pass-1 shape, each kind of part reduced on its own to ~50,000
   triangles in all; UVs by Smart UV Project; Cycles bakes surface (normal map), shading (ambient occlusion), colour and
   the eyes' glow from the sculpt. Note: this Blender has no denoiser, so denoising must be off or every bake cancels.
3. **The rig**: 19 bones (hips, spine, chest, neck, head, jaw, tail, three in each leg), four weights a vertex; thorns,
   tusks, teeth, claws and eyes move rigidly.
4. **The page** (`page/`): `briarmaw.js` decodes him and poses his moves (breathe, walk, roar, swipe, bite, hit, fall);
   it returns the same shape as `buildBeast`, so the Fight can use him.

For another foe: change the shape and the tuft zones in `sculpt.py`, keep the rest.
