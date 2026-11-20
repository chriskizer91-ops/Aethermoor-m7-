# Aethermoor in 3D: a try-out

Four of the game's places as lit 3D dioramas: Thornhollow, Sandspire, Hearthstone Keep and the Hearth Road. Open it on
a phone or a laptop: https://claude.ai/artifact/3Y49AxoaxyY1ug2ht6EkSq

- Walk with WASD or the arrows (Shift runs, the mouse wheel zooms), or drag anywhere on a phone.
- The buttons change the place, the time of day (morning, dusk, night), the camera (close, far, from above) and the
  detail (High for a laptop, Light for a phone; a phone starts on Light).

## How it's made

Nothing here is drawn new. `main.js` reads the game's own files in `game/src/`:

- the map's rows (`data/maps/*.js`) say where the houses, trees, fences, rocks and water are, and what is solid;
- the painting (`ui/assets/paint/*.js`) is the ground, and gives the houses their walls and roofs: each block of roof
  (`H`) and wall (`#`) tiles stands up as a house, its front wall cut from the painted wall row and its two roof slopes
  from the painted roof rows;
- the party and the NPCs are the game's walkers (`art/walkers.js`, `art/map-sprites.js`), as cards that stand up in
  the light and cast shadows; the hearth, boards and chests are the game's object sprites.

New: the three.js drawing, the sun and its shadows, the fire and lights, rippling water, fireflies at night, the
forest round the edge, the tilt-shift blur and glow.

## Build

```
npm install
node build.mjs      # dist/aethermoor-3d.html (open it) and dist/aethermoor-3d.artifact.html (publish it)
```

Publish `dist/aethermoor-3d.artifact.html` to the link above (pass the url) so the link keeps working.

## Not done in this try-out

Talking, fights, gates, roaming packs, saves: this is only the look and the walking. Trees are simple 3D pines (or
palms) set on the painted ones, and stand out where the painting has a broad-leaved tree (the Keep's lawn).
