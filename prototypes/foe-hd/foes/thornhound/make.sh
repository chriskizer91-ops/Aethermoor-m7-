#!/bin/sh
# The thornhound, start to finish (run from anywhere):
#   sh make.sh            sculpt passes 1 and 2, the checks, the bake, the page's assets
set -e
cd "$(dirname "$0")"
K=../../pages/beasts/kit
python3.12 sculpt.py build 1 | tail -1
sh check.sh 2
blender -b -P $K/bake.py -- build/high-2.npz build/high-1.npz build/bake 2048 rig.py 2>&1 | grep -E "^\[bake\]|Error|Traceback"
FLAT=4 python3 $K/textures.py build/bake assets build/c2-cmp.png 1

python3.12 $K/export_sculpt.py build/high-2.npz build/sculpt2
node $K/pack.mjs build/bake build/sculpt2 assets
python3 -c "
import json; m = json.load(open('assets/light.json')); f = json.load(open('foe.json'))
f['sculptTriangles'] = m['sculptTriangles']; json.dump(f, open('foe.json', 'w'), indent=1)"
