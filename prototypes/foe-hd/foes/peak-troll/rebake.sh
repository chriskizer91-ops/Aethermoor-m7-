#!/bin/bash
# Re-bind and re-bake the peak-troll from the sculpt already in build/ (session 8): ./rebake.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=6000,14=3000,12=4000,13=5000,1=17000,15=3000,4=1600,5=300,6=700,8=600,10=2400
blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $RES . $TARGETS 2>&1 | grep '\[bake\]'
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
