#!/bin/sh
# sculpt pass N (unless SKIP=1), render front/side/back at the sheet's scale, compare:  sh check.sh N
set -e
cd "$(dirname "$0")"
K=../../pages/beasts/kit
[ -n "$SKIP" ] || python3.12 sculpt.py build $1 | tail -2
# one render pixel = one sheet pixel (S = 0.9 / 716 m); centred on sheet column 884 (side), row 430
GLOW=1.5 RES=1000 CY=0.0201 blender -b -P $K/preview.py -- build/high-$1.npz build/p$1 1.2570 0.4500 2>&1 | grep -E "Error|Traceback" || true
python3 $K/sheetcheck.py thornhound build/p$1 build/c$1 > /dev/null
python3 $K/abscheck.py thornhound build/p$1 build/a$1.png 224.5 884 1558.5 430
# a three-quarter view, and the head close
GLOW=1.5 RES=900 CY=0.0 blender -b -P $K/preview.py -- build/high-$1.npz build/q$1 1.35 0.45 three 2>&1 | grep -E "Error|Traceback" || true
GLOW=1.5 RES=700 CY=-0.42 blender -b -P $K/preview.py -- build/high-$1.npz build/h$1 0.42 0.66 three,front 2>&1 | grep -E "Error|Traceback" || true
# the flank close
GLOW=1.5 RES=700 CY=0.1 blender -b -P $K/preview.py -- build/high-$1.npz build/f$1 0.45 0.42 side 2>&1 | grep -E "Error|Traceback" || true
