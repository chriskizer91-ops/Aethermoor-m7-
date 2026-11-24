#!/bin/bash
# Rebake the Rime-Abbot from its sculpt (after a rig change) (session 8, the wraiths' polish pass). Needs Blender 4.0, Python 3.12 with numpy, scipy
# and scikit-image, and `npm install` in prototypes/foe-hd.   ./make.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}; KEY=rime-abbot
SHEET=../../../../art-in/3d/sheets/sheet-$KEY.webp; BOXES=0:590,590:1180,1180:1774
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=12000,15=10000,12=4500,14=9000,9=300,10=5000
GLOW=1 blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $((RES * 2)) . $TARGETS 2>&1 | grep '\[bake\]'
mkdir -p assets
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
python3 $K/standard.py . rime-abbot "The Rime-Abbot" 2.15 2048 768 champion 0x8cc8ff
../../pages/walkers/kit/phone.sh . $PASS 768 0=8500,15=8500,12=3000,14=4000,9=200,10=2200 1
python3 $K/standard.py . rime-abbot "The Rime-Abbot" 2.15 2048 768 champion 0x8cc8ff
