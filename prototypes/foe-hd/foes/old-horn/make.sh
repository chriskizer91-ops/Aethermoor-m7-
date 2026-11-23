#!/bin/bash
# Make Old Horn from scratch (session 8). Needs Blender 4.0, Python 3.12 with numpy, scipy and scikit-image,
# and `npm install` in prototypes/foe-hd.   ./make.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}; KEY=old-horn
SHEET=../../../../art-in/3d/sheets/sheet-$KEY.webp; BOXES=0:575,575:1180,1180:1774
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=6000,14=3000,12=4000,13=5000,1=17000,15=3000,2=900,4=300,5=300,6=700,10=2400
python3.12 sculpt.py build 1
[ "$PASS" != 1 ] && python3.12 sculpt.py build $PASS
blender -b -P $K/preview.py -- build/high-1.npz build/shape >/dev/null 2>&1
blender -b -P $K/preview.py -- build/high-$PASS.npz build/final >/dev/null 2>&1
python3 $K/checks.py $SHEET $BOXES build/shape build/shape
python3 $K/checks.py $SHEET $BOXES build/final build/final
blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $RES . $TARGETS 2>&1 | grep '\[bake\]'
mkdir -p assets
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
ls -la assets
