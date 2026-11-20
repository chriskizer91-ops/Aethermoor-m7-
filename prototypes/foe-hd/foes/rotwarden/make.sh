#!/bin/bash
# Make the Rotwarden from scratch (session 8). Needs Blender 4.0, Python 3.12 with numpy, scipy and scikit-image,
# and `npm install` in prototypes/foe-hd.   ./make.sh [PASS] [RES]   (PASS 1, 2 or 3; RES of the pictures)
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}; KEY=rotwarden
SHEET=../../../../art-in/3d/sheets/sheet-$KEY.webp; BOXES=0:610,610:915,915:1536
K=../../pages/walkers/kit; W=../../pages/walkers/tools
python3.12 sculpt.py build 1
[ "$PASS" != 1 ] && python3.12 sculpt.py build $PASS
blender -b -P $K/preview.py -- build/high-1.npz build/shape >/dev/null 2>&1
blender -b -P $K/preview.py -- build/high-$PASS.npz build/final >/dev/null 2>&1
python3 $K/checks.py $SHEET $BOXES build/shape build/shape
python3 $K/checks.py $SHEET $BOXES build/final build/final
blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $RES . 0=34000,3=4000,10=4500,11=700,2=1600,8=1400,4=1500 2>&1 | grep '\[bake\]'
mkdir -p assets
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets
ls -la assets
