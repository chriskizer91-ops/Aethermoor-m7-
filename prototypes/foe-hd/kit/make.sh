#!/usr/bin/env bash
# Make a foe from start to finish with the kit (November 20). From prototypes/foe-hd:
#   kit/make.sh <key> [steps]      steps (default all): sculpt sheet bake pack asset
#     sculpt  the light level and the sculpt level (foe.json), python3.12 kit/py/sculpt.py
#     sheet   renders beside the sheet, and outlines over it (build/compare-N.png, build/outline-N.png)
#     bake    Blender bakes the sculpt onto the light model and rigs it (build/bake/)
#     pack    the page's pictures and compressed mesh (assets/)
#     asset   the sculpt kept as a model of its own: assets/<key>-sculpt.glb
set -euo pipefail
cd "$(dirname "$0")/.."
key=$1; steps=${2:-sculpt,sheet,bake,pack,asset}; foe=foes/$key
lv() { python3 -c "import json;print(json.load(open('$foe/foe.json'))['$1']['level'])"; }
has() { [[ ",$steps," == *",$1,"* ]]; }
if has sculpt; then python3.12 kit/py/sculpt.py $foe $(lv light); python3.12 kit/py/sculpt.py $foe $(lv sculpt); fi
if has sheet; then python3 kit/py/sheet.py $foe $(lv sculpt); fi
if has bake; then blender -b -P kit/blender/bake.py -- $foe 2>&1 | grep -E '^\[bake\]|Error|Traceback'; fi
if has pack; then python3 kit/tools/textures.py $foe; node kit/tools/pack.mjs $foe; fi
if has asset; then
  blender -b -P kit/blender/export_glb.py -- $foe 2>&1 | grep -E '^glb|Error'
  npx gltf-transform meshopt $foe/build/sculpt-raw.glb $foe/assets/$key-sculpt.glb --level high
fi
