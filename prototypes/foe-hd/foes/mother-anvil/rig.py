# Mother Anvil's rig (the kit's anvil plan, kit/js/moves/anvil.js): body (the root: the anvil, her heart, grates,
# bands, plates, the hinge bracket), arm (hinge to brass collar), hammer (collar to head), and four legs, each a thigh
# (hip plate and thigh) and a shin (knee plate, shin, clawed paw). Sculpt coordinates. Weighted by part
# (kit/rigs/bind.py): every plate is a piece of its own and moves whole with its part, so nothing stretches.
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import LEGS, HIP_Z, KNEE_Z, HINGE, COLLAR, HEAD
PIN = HINGE + [0, 0, 0.05]
BONES = [('body', None, (0, 0, HIP_Z), (0, 0, 0.95)),
         ('arm', 'body', tuple(PIN), tuple(COLLAR)),
         ('hammer', 'arm', tuple(COLLAR), tuple(HEAD))]
for k, (lx, ly) in LEGS.items():
    BONES += [(f'{k}_thigh', 'body', (lx, ly, HIP_Z), (lx, ly, KNEE_Z)), (f'{k}_shin', f'{k}_thigh', (lx, ly, KNEE_Z), (lx, ly, 0.0))]
TRUNK = ('body',)

def part(P, kind, idx, piece):
    out = np.full(len(P), -1)
    h = HEAD - COLLAR
    for c in np.unique(piece):
        m = piece == c; ctr = P[m].mean(0)
        n = 'body'
        if ctr[2] > 1.0 and np.linalg.norm(ctr - PIN) > 0.12:                       # the arm and the hammer
            t = (ctr - COLLAR) @ h / (h @ h)
            n = 'hammer' if t > 0.12 else 'arm'
        elif ctr[2] < 0.5:
            for k, (lx, ly) in LEGS.items():
                if abs(ctr[0] - lx) < 0.2 and abs(ctr[1] - ly) < 0.26:
                    n = f'{k}_thigh' if ctr[2] > 0.26 else f'{k}_shin'
        out[m] = idx[n]
    return out
