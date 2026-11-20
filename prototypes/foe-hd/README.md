# One Foe: Briarmaw in full detail

Briarmaw, Act One's first Champion, three ways side by side (the code-built model, a cut-out of Chris's sheet, and
the full-detail light version baked from a sculpt), with his moves and a crowd test.
Published: https://claude.ai/artifact/5iUqJsPw3NGrvun4Ng73eh (three ways, with the crowd test)
and https://claude.ai/artifact/AVSmLbEu3jz1NVnohgqT9P (the sculpt itself beside its light version, for a laptop).

**The full-detail model is kept as an asset:** `assets/briarmaw-sculpt.glb` (982,634 triangles with their colours,
meshopt-compressed, 4.5 MB; three.js `GLTFLoader` with `MeshoptDecoder`). Chris, November 20: aim sculpts at 500,000 to
1,000,000 triangles, more only where the detail needs it; the game uses the ~50,000-triangle bake.

## The recipe

Needs Blender 4.0 (`apt-get install blender`) and Python 3.12 with numpy, scipy and scikit-image
(`apt-get install python3-numpy python3-scipy python3-skimage`), and `npm install` here.

```
python3.12 blender/sculpt.py build 1        # pass 1, shape (~130k triangles): build/high-1.npz
python3.12 blender/sculpt.py build 2        # pass 2, form  (~400k): feather barbs and broken tips in each tuft
python3.12 blender/sculpt.py build 3        # pass 3, detail (~980k): the full-detail sculpt
python3.12 blender/sculpt.py build 0        # level 0: the same shape with its parts built light, for the bake
blender -b -P blender/preview.py -- build/high-3.npz build/p3       # front, side, back renders
python3 blender/compare.py build/p3 build/cmp3.png                  # beside the sheet
python3 blender/outline.py build/p3 build/out3.png                  # outlines over the sheet's
blender -b -P blender/bake.py -- build/high-3.npz build/high-0.npz build/bake 2048
python3 tools/textures.py build/bake assets                         # the pictures
node tools/pack.mjs build/bake "" assets                            # the light mesh, compressed
blender -b -P blender/export_glb.py -- build/high-3.npz build/sculpt-raw.glb
npx gltf-transform meshopt build/sculpt-raw.glb assets/briarmaw-sculpt.glb --level high   # the asset
node build.mjs && node build.mjs --page=sculpt                      # dist/briarmaw.html, dist/briarmaw-sculpt.html
node tools/check.mjs dist/briarmaw.html build/shots                 # headless check and screenshots
```

1. **The sculpt** (`blender/sculpt.py`): the body is one smooth signed-distance shape measured off the sheet (barrel,
   hump, shoulders, haunches, head with brow, snout, nose, jowls and grin, legs and paws, the tail). His coat is about
   1,500 big leaf-feather tufts sculpted into that surface: at every point the topmost tuft sets the height, so they
   overlap like shingles. Pass 2 gives each tuft feather barbs (strands angled out from a midrib) with broken tips; pass
   3 finer strands. Thorns, the crown, vines, tusks, teeth, claws and eyes are real geometry on top.
2. **The light version** (`blender/bake.py`): level 0 of the same script (the parts built light, so they keep their
   true shape), the coat reduced to ~29,500 triangles, ~50,000 in all; UVs by Smart UV Project; Cycles bakes surface
   (normal map), shading (ambient occlusion), colour and the eyes' glow from the sculpt, in two runs: the coat with a
   long reach, the parts with a short one against the sculpt's parts only, so thin vines don't pick up their
   neighbours. Lessons: this Blender has no denoiser, so denoising must be off or every bake cancels; parts must be
   placed the same at every level (`place_sdf`, and each vine's thorns from its own dice), or the bake misses them.
3. **The rig**: 19 bones (hips, spine, chest, neck, head, jaw, tail, three in each leg), four weights a vertex; thorns,
   tusks, teeth, claws and eyes move rigidly.
4. **The page** (`page/`): `briarmaw.js` decodes him and poses his moves (breathe, walk, roar, swipe, bite, hit, fall);
   it returns the same shape as `buildBeast`, so the Fight can use him.

For another foe: change the shape and the tuft zones in `sculpt.py`, keep the rest.
