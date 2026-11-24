#!/bin/bash
# Re-bind and re-bake the bell-ringer from the sculpt already in build/ (session 8): ./rebake.sh [PASS] [RES]
set -e
cd "$(dirname "$0")"
PASS=${1:-3}; RES=${2:-1024}
K=../../pages/walkers/kit; W=../../pages/walkers/tools
TARGETS=0=10000,15=9000,12=1500,14=6000,9=500,10=1500
GLOW=1 blender -b -P $K/bake.py -- build/high-$PASS.npz build/high-1.npz build/bake $((RES * 2)) . $TARGETS 2>&1 | grep '\[bake\]'
python3 $W/textures.py build/bake assets $RES
node $W/pack.mjs build/bake "" assets
python3 $K/info.py build/high-1.npz build/high-$PASS.npz $PASS assets $RES
python3 $K/standard.py . bell-ringer "The Bell-Ringer" 2.1 1024 512 veteran 0xd8ff90
