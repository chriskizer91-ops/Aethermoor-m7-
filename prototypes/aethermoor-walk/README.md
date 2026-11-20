# The party in a borrowed 3D town

Our four heroes, built from the game's own gear code (`../hero-3d/`), walking a finished 3D town and the open land
round it, borrowed from Coven of the Moon Faire (Envoi's Wickhollow). Published: https://claude.ai/artifact/XS24EmSUw1SMkGn4r4AAcE

- WASD or the arrows walk (Shift runs), drag to look; on a phone, drag on the left to walk and on the right to look.
- The buttons: who leads, Swing, Gear (new outfits for everyone).

## What is whose

- `world/`: copied from `chriskizer91-ops/coven-of-the-moon-faire`, branch `main`, commit b9b23c4, folder `game/`, at
  the same paths: `engine/place/*`, `engine/land/land.js`, `engine/land/zone.js`, `data/maps-wickhollow.js`,
  `places/wickhollow*.js`, `places/first-test-land.js`, and the pictures they name (`art/walk/`,
  `texture-packs/made-web/`), the pictures shrunk to 1024 pixels. The scripts are unchanged.
- `world/pages/walk.html`: the page (its look from Coven's `pages/first-test.html`), with our own start-up.
- `hero-entry.js`: three.js 0.170 as the `window.THREE` the borrowed scripts expect (they were written for r128), and
  our heroes with the face the borrowed walker asks for (`root`, `walkRun`, `animate`).

## Build

```
node build.mjs     # dist/aethermoor-walk.html (open it) and dist/aethermoor-walk.artifact.html (publish it)
```

It needs `../hero-3d/node_modules` (`npm install` there).
