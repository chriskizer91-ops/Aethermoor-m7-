#!/bin/bash
# Make the drowned choir from scratch (session 8, the wraiths' polish pass). Needs Blender 4.0, Python 3.12 with numpy, scipy
# and scikit-image, and `npm install` in prototypes/foe-hd.   ./make.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-1024}; KEY=drowned-choir
SHEET=../../../../art-in/3d/sheets/sheet-$KEY.webp; BOXES=0:512,512:1024,1024:1536
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=12000,15=6000,12=4500,13=2000,14=6000,10=1500
python3.12 sculpt.py build 1
[ "$PASS" != 1 ] && python3.12 sculpt.py build $PASS
blender -b -P $K/preview.py -- build/high-1.npz build/shape >/dev/null 2>&1
blender -b -P $K/preview.py -- build/high-$PASS.npz build/final >/dev/null 2>&1
python3 $K/checks.py $SHEET $BOXES build/shape build/shape
python3 $K/checks.py $SHEET $BOXES build/final build/final
blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $((RES * 2)) . $TARGETS 2>&1 | grep '\[bake\]'
mkdir -p assets
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
python3 $K/standard.py . drowned-choir "The Drowned Choir" 1.95 1024 512 veteran
