#!/bin/bash
# A walker's phone version (session 8): fewer triangles and smaller pictures, baked from the same sculpt.
#   kit/phone.sh FOE_DIR PASS RES TARGETS [GLOW]    -> FOE_DIR/assets/phone/
set -e
FOE=$1; PASS=$2; RES=$3; TARGETS=$4; GLOW=${5:-0}
K=$(cd "$(dirname "$0")" && pwd); W=$K/../tools
cd "$FOE"
GLOW=$GLOW AO_SAMPLES=32 blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake-phone $((RES * 2)) . $TARGETS 2>&1 | grep 'wrote light'
mkdir -p assets/phone
python3 $W/textures.py build/bake-phone assets/phone $RES 10
node $W/pack.mjs build/bake-phone "" assets/phone
python3 -c "import json;p='assets/phone/light.json';d=json.load(open(p));d['res']=$RES;json.dump(d,open(p,'w'))"
du -cb assets/phone/light.bin assets/phone/*.webp | tail -1
