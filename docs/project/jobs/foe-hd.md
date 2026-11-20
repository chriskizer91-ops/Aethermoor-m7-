# Job: One Foe in full detail (session 6, branch `job/foe-hd`)

Chris, November 20: "a sixth session building one foe full detail, 600,000 to 1,000,000 triangles, baked onto a
50,000-triangle light version so multiple foes and characters can be rendered. I know that's slow, but building games
takes months or years, and we will do it in a week." He wants to see it **side by side** with the other two ways of
doing the foes, and choose.

## The foe: Briarmaw

Act One's first Champion, the bramble-bear of the Thornway, in his den (`m7-briarmaw-den`). His model sheet (front,
side, back) is `art-in/3d/sheets/sheet-briarmaw.webp`; his skin is `art-in/3d/skins/skin-thorn-hide.webp` (with
`skin-boar-hide` and `skin-bark-sap` for his tusks, claws and bark plates as they fit); his pixel sprite and data are in
`game/src/art/foes.js` and `game/src/data/foes.js`; his first-pass code model is `prototypes/bestiary/beasts.js`.
The Fight is building his battle at the same time, so he'll have a stage to stand on.

## What to make

1. **The full-detail sculpt: 600,000 to 1,000,000 triangles.** Shaped to the sheet from all three sides: the heavy
   bear body, the tusks, the thorn crown and the ridge of thorns down his back, the bramble-wound legs and claws, leaf
   and bark plates, the fur-like bramble surface as real geometry, not just paint.
2. **The light version: about 50,000 triangles**, with everything the sculpt has baked onto it: a normal map, ambient
   occlusion and his colour (from Chris's skins and the sheet), at 2048 px for the laptop and 1024 for phones. It must
   look as close to the sculpt as baking allows.
3. **Rigged and moving**: idle breathing, a walk, a roar, a bite or swipe, being hit, falling. The Fight's foe moves
   go through a small interface (ask the Fight in your slip for its shape); give him the same, so he can drop into the
   fight.
4. **The side-by-side page**: Briarmaw three ways in one view, turning on a stand, under the same light:
   the code-built model (`buildBeast('briarmaw', ...)` from `prototypes/bestiary/`), the painted cut-out from his sheet
   (the Models job is building these right now: use theirs once it's on the hub's branch, a plain cut of the sheet
   until then), and your full-detail one. Show the triangle counts. Add a button for **six of him at once with the four
   heroes**, with the frame rate, so Chris can see the light version holds up with a crowd. A switch to look at the
   sculpt itself is welcome on a laptop (too heavy for a phone).
5. **The recipe, written down**: how the sculpt is made, baked and brought into the page, so the same can be done for
   the other foes and the heroes once Chris chooses.

## How (your choice; suggestions)

- **Blender, run headless** (`blender -b -P script.py`; install it if it isn't here, e.g. through apt or Blender's own
  download) for sculpting by script (modifiers, displacement from the skin textures, geometry nodes), the decimation to
  50k, the UV unwrap, the bake (Cycles: normal, AO, diffuse) and the rig, then export to glTF (`.glb`, with Draco or
  meshopt compression and WebP textures).
- **Or all in code**, as the rest of the game is: three.js with signed-distance shapes and marching cubes for the sculpt,
  `meshoptimizer` to simplify, `xatlas` to unwrap, `three-mesh-bvh` to ray-cast the bake.
- The page is one self-contained HTML file (the `.glb` and textures inside it as data), under 16 MB, opening on a phone.

## Your files

- Yours: `prototypes/foe-hd/**` (new: the scripts, the made model and textures, the page and its build),
  `docs/project/slips/foe-hd.md`.
- Others' (read and import, don't edit): `game/` (frozen), `art-in/` (Chris's originals), `prototypes/bestiary/` and
  `prototypes/hero-3d/` (Models), `world3d/` (Fight, Places, hub).

## Check, and deliver

- The page loads headless with no errors (Playwright's Chromium, `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`); close screenshots of the light version next to the sculpt (front, side, back, beside
  the sheet), and the crowd test's frame rate (note that a headless browser's frame rate is not a phone's).
- Publish it as a claude.ai artifact and put the link in your slip; message the hub.
