# Job: Models (session 3, branch `job/models`)

Chris sent every picture asked for (November 20; `art-requests/RECEIVED.md`, the pictures in `art-in/3d/`). This job
puts them on the 3D models.

## What to make

**Step 1, the heroes in Chris's textures.** The Gear Room (`prototypes/hero-3d/`) builds every item in code from M7's
own gear data, and its surfaces are made in code too (`kit.js`: `KIND`, `mat`, `surface`). Give them Chris's 47 gear
textures (`art-in/3d/gear/`): metals, mail and scale, leathers, cloth, woods, bone, horn, stone. Each item keeps its own
colours (M7's palettes in `game/src/art/forge.js`): the texture gives the grain and detail, the palette the colour, so a
gold sword and a voidiron one differ as they do now. The four faces (`face-wren`, `face-pip`, `face-bryn`,
`face-alondra`), `skin-soft` and `hair-strands` go on the heroes themselves.
- Chris's rule (November 20): item surfaces come from the texture pack, wrapped round the code-built shapes, never a
  picture of an item printed on a model. The faces he asked for.
- Every weapon must stay epic (his word), and hair never pokes through a hat.
- Size: the heroes go on every world page too, so keep their textures small in total (web copies at 512 px or less;
  aim for about 3 MB for the whole set). Web copies live in your files; the originals stay in `art-in/3d/`.
- Publish the Gear Room to its link (`prototypes/hero-3d/README.md`).

**Step 2, the creatures from Chris's sheets.** `prototypes/bestiary/beasts.js` builds the 54 beasts from 14 body plans;
Chris's model sheets (`art-in/3d/sheets/`: front, side and back of each) show what each should look like, and his 16
skins (`art-in/3d/skins/`) are what they're made of. Reshape each to its sheet. Order: the foes met first, in Act One
(thornhound, briarling, boglurcher, glowcap, rotgrub, sapwight, gloamwing, mirelord, old snag, rotstag, Briarmaw, the
Rotwarden), then the rest of the Champions and Relic-Bearers, then the others. The 39 people foes (built by the heroes'
builder from `game/src/art/foes.js` `foeLooks`) get the gear textures with step 1. Publish the Bestiary to its link
(`prototypes/bestiary/README.md`).

## What others rely on (keep it working; add, never remove or rename)

- `buildHero(heroKey, gear, o)` returns `{ group, rig, fx, looks }`; the Fight job moves `rig` (`legs`, `arms`, `armR`,
  `armL` with `sh`, `elbow`, `hand`, `grip`; `chest`, `skirt`, `head`, `cape`, `weapon`, `offhand`, `cls`) and calls
  `setPose(rig, pose, t, u)`.
- `buildBeast(key, sprite)` returns `{ g, parts, ... }`; the Fight job animates `parts` by body plan. If you rename or
  restructure parts, list the names per plan in your slip.
- `world3d/heroes.js` `actor(id, gear, detail)` is the walker every world page uses (`root`, `walkRun`,
  `animate(phase, walking, t, dt)`).

## Your files

- Yours: `prototypes/hero-3d/**`, `prototypes/bestiary/**`, `world3d/heroes.js`, `docs/project/slips/models.md`.
- Others' (read, don't edit): `game/` (frozen), `world3d/` apart from `heroes.js`, `art-in/` (Chris's originals).

## Check, and deliver

- Both pages build and load headless with no errors (Playwright's Chromium, `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader`); look at close screenshots of every weapon class, the four faces, and each reshaped
  creature next to its sheet.
- `cd world3d && node build.mjs --page=m7-places --places=keep,thornhollow --tex=768` still builds and loads (the
  heroes there are yours).
- Links in your slip, one per step.
