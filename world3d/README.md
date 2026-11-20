# Aethermoor in 3D: the world

The world the 3D heroes walk, put together from the finished 3D worlds of Chris's other games (November 20), under
Hearth & Heirloom's names. Published (phone size): https://claude.ai/artifact/R3Ecr7e1VVbb9Qi7GXEPpx

- **Walking:** the Verdant Wilds: Thornhollow, the Thornway, Mossfall and the Heartroot, Fawnrest, the jetty and the
  Wayfarers' camp, on one open land with roads, rivers, lakes and bridges, walked between with no fade. One hero leads,
  three follow; Swing; Gear rolls new outfits.
- **The small map** in the corner follows the party. **Tap it** for the big map of the Wilds. On the big map,
  **The whole of Aethermoor** opens the continent in 3D, with the party's pin where they stand. **Back to walking**
  returns.

## What is whose

| Here | Copied from | What it is |
|---|---|---|
| `coven/` | `chriskizer91-ops/coven-of-the-moon-faire`, `main`, commit b9b23c4, `game/` (same paths) | Zone 1: the place engine (`engine/place/`), the land engine and the maps (`engine/land/`), the places (`places/`, `data/`), the camp's kit (`fair/`), the walking paintings (`art/`) and Chris's textures (`texture-packs/made-web/`, shrunk to 1024 px) |
| `continent/` | `chriskizer91-ops/envoi-on-the-longest-night`, `main`, commit d450c3f, `moon-faire-witches/world-map/` (`map/`, `art/`) and `src/game/world.js` | The continent in 3D: land, sea, rivers, trees, the Keep, every town |
| `heroes.js` | ours | three.js 0.170 as the `THREE` the borrowed scripts expect (they were written for r128), and our heroes as walkers |
| `names.js` | ours | the borrowed places under M7's names (provisional; the table is at its top) |
| `aethermoor.js`, `coven/pages/aethermoor.html` | ours (the look after Coven's `pages/zone-1.html`) | the page |

Changes to copied files (each marked "Aethermoor" in a comment): `continent/map/map3d.js` takes the pin's name from
the page, can start again after stopping, and can put the pin at any spot (`start`, `setIoAt`). Nothing else.

Left out on purpose: the witches, Coven's battle, encounters, party and fair folk (their talk is Moon Faire's story).

## Build

```
node build.mjs             # dist/aethermoor-3d.html: textures at 1024 px, 21.5 MB, a file for the laptop
node build.mjs --tex=512   # dist/aethermoor-3d-512.html: 14 MB, the page published for the phone
```

Needs `../prototypes/hero-3d/node_modules` (`npm install` there) and Python with Pillow (for `--tex`).
