# The rockling's rig (the kit's heap plan, kit/js/moves/heap.js): hips (the root), body, head, an arm each side
# (shoulder stone, upper stone, fist), a leg each side (a foot stone). Sculpt coordinates. Weighted by part
# (kit/rigs/bind.py): every stone is a piece of its own and moves whole with its part, so nothing stretches.
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import STONES
BONES = [
    ('hips', None, (0, 0, 0.1), (0, 0, 0.22)),
    ('body', 'hips', (0, 0, 0.22), (0, 0, 0.39)),
    ('head', 'body', (0, 0.03, 0.39), (0, 0.05, 0.6)),
    ('r_arm', 'body', (0.16, 0.0, 0.33), (0.215, 0.02, 0.1)),
    ('l_arm', 'body', (-0.16, 0.0, 0.33), (-0.215, 0.02, 0.1)),
    ('r_leg', 'hips', (0.12, 0.0, 0.11), (0.12, 0.0, 0.0)),
    ('l_leg', 'hips', (-0.12, 0.0, 0.11), (-0.12, 0.0, 0.0)),
]
TRUNK = ('hips', 'body')
CTR = np.array([s[0] for s in STONES]); RAD = np.array([min(s[1]) for s in STONES]); PART = [s[2] for s in STONES]

def part(P, kind, idx, piece):
    out = np.full(len(P), -1)
    for c in np.unique(piece):
        m = piece == c; ctr = P[m].mean(0)
        d = np.linalg.norm(CTR - ctr, axis=1); i = int(np.argmin(d))
        if d[i] < 0.6 * RAD[i]: n = PART[i]                                           # one of the big stones
        else:                                                                         # a pebble or an eye
            x, z = ctr[0], ctr[2]
            if z > 0.41: n = 'head'
            elif abs(x) > 0.175: n = 'r_arm' if x > 0 else 'l_arm'
            elif z < 0.09 and abs(x) > 0.06: n = 'r_leg' if x > 0 else 'l_leg'
            elif z < 0.2: n = 'hips'
            else: n = 'body'
        out[m] = idx[n]
    return out
