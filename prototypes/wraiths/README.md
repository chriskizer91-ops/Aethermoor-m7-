# The wraiths in full detail

The eleven robed foes, in Act order: the Drowned, the Bell-Ringer, the Drowned Choir, the Drowned Cantor, the Drowned
Abbess, the Choir-Wraith, the Rime-Wraith, the Rime-Abbot, the Lantern Mother, the Mirage-Wisp and the Wisp-Queen. This
lane moved to Models (session 3) from session 6 on November 21 (`docs/project/jobs/foes.md`).

- Gallery (each on a turning stand beside Chris's sheet, its moves, the whole sculpt, a crowd test): the link is in
  `docs/project/slips/models.md`.

## How they are made

- `wraiths.js` builds each from the heroes' kit (`prototypes/hero-3d/kit.js`) and wears the same sculpted masters
  (robe, skirt, hood, mantle, cape, sleeves, hands, hafts, forged metal), shaped to Chris's sheets
  (`art-in/3d/sheets/sheet-<key>.webp`; web copies in `sheets/`). Ghostly bodies are see-through and lit from inside;
  mist rises round the hems; lanterns, eyes, crystals and water glow, flaring and dimming with the moves.
- Every piece is rigid on one moving part (body, chest, head, shoulder, elbow, hand, the hem, a prop): nothing is
  skinned, so nothing can stretch (the "no stretching" rule holds by build).
- The sculpt: "The sculpt" in the gallery cuts the pieces fine and raises them by their masters (about 900,000
  triangles), the shape the game's detail is baked from (`prototypes/hero-3d/masters/`).

## For the Fight

```js
import { withWraiths, wraithLook, buildWraith } from 'prototypes/wraiths/wraiths.js';
setBeastLook(withWraiths(foeLook(buildBeast)));   // the eleven by wraithLook, every other key by the kit, then buildBeast
```

`wraithLook(key, sprite, opts)` returns the arena's shape (`{ group, plan: 'wraith', height, parts, update(t, step),
pose(move, u, t, step), moves: { MOVES }, duration(move), hit(), act: { lunge, fall } }`) at the fight's detail (Light;
`opts.detail: 'high'` for High), or null for any other key. Moves: the kit's common set (idle, walk, bite, strike, swipe,
cast, roar, hurt, ko), and the Champions' own, named for M7's (`game/src/data/foes.js`):

- the Rime-Abbot: crozier-strike, toll, rime-ward, drown, call-the-choir, hushing, heartbeat, rime-nova
- the Lantern Mother: lamp-pole, lure, lantern-flare, hush-now, lead-them-down, moths, mourning, snuff, lantern-nova,
  drown-the-light

## Build

```
cd prototypes/wraiths && ln -s ../hero-3d/node_modules node_modules   # once
node build.mjs                                                          # dist/wraiths.html, dist/wraiths.artifact.html
```
