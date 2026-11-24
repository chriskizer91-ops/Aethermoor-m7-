#!/bin/bash
# Re-bind and re-bake the Rotwarden from the sculpt already in build/ (session 8): ./rebake.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-2048}
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=13000,14=3000,12=4000,13=9500,3=3000,10=17000,11=700,2=1600,8=1400,4=1500
blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $RES . $TARGETS 2>&1 | grep '\[bake\]'
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
python3 $K/standard.py . rotwarden "The Rotwarden" 2.5 2048 1024 champion
