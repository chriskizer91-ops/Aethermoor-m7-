#!/bin/bash
# Make the wisp-queen from scratch (session 8, the wraiths' polish pass). Needs Blender 4.0, Python 3.12 with numpy, scipy
# and scikit-image, and `npm install` in prototypes/foe-hd.   ./make.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}; KEY=wisp-queen
SHEET=../../../../art-in/3d/sheets/sheet-$KEY.webp; BOXES=0:512,512:1024,1024:1536
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=5000,15=16000,12=9000,14=9000,4=9000,9=300
python3.12 sculpt.py build 1
[ "$PASS" != 1 ] && python3.12 sculpt.py build $PASS
blender -b -P $K/preview.py -- build/high-1.npz build/shape >/dev/null 2>&1
blender -b -P $K/preview.py -- build/high-$PASS.npz build/final >/dev/null 2>&1
python3 $K/checks.py $SHEET $BOXES build/shape build/shape
python3 $K/checks.py $SHEET $BOXES build/final build/final
GLOW=1 blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $((RES * 2)) . $TARGETS 2>&1 | grep '\[bake\]'
mkdir -p assets
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
../../pages/walkers/kit/phone.sh . $PASS 768 0=2500,15=8000,12=4500,14=4500,4=4500,9=150 1


python3 $K/standard.py . wisp-queen "The Wisp-Queen" 1.85 2048 768 champion 0x9ae8ff
