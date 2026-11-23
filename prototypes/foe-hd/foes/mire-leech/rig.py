# The mire-leech's rig (the kit's leech plan, kit/js/moves/leech.js): rooted at its foot on the ground (base); the tail
# behind it (tail1, tail0) and the rising neck ahead (neck0..neck3) grow out of it, then the head with its sucker.
# Sculpt coordinates. Weighted by part (kit/rigs/bind.py); the mouth's rim, teeth and throat move with the head.
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import PTS
p = [tuple(float(v) for v in q) for q in PTS]
BONES = [('base', None, p[3], p[4]),
         ('tail1', 'base', p[3], p[2]), ('tail0', 'tail1', p[2], p[0]),
         ('neck0', 'base', p[4], p[5]), ('neck1', 'neck0', p[5], p[6]), ('neck2', 'neck1', p[6], p[7]),
         ('neck3', 'neck2', p[7], p[8]), ('head', 'neck3', p[8], p[10])]
TRUNK = ('base',)
SMOOTH = 16

def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[kind != 0] = idx['head']                                                     # rim, teeth, throat
    return out
# wide blends at every joint along the body, so a bend spreads over its rings
BANDS = {n: (0.05, 0.25) for n in ('tail1', 'tail0', 'neck0', 'neck1', 'neck2', 'neck3', 'head')}
