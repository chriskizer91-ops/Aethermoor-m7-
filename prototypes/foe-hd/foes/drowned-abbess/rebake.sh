#!/bin/bash
# Re-bind and re-bake the drowned abbess from the sculpt already in build/ (session 8): ./rebake.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-1024}
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=9000,15=12000,12=4500,13=1200,14=7000,7=300,9=400,10=2500
GLOW=1 blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $((RES * 2)) . $TARGETS 2>&1 | grep '\[bake\]'
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
python3 $K/standard.py . drowned-abbess "The Drowned Abbess" 1.9 1024 512 relic-bearer 0xa0e8ff
