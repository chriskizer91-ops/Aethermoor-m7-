# The marsh-light's rig (the kit's spark plan): the flame floats free (body, a root of its own, so it bobs and darts
# by moving whole), its upper half flickers (top); the drops fall on their own (drops, a root); the ripple stays on
# the water (ground, a root). Sculpt coordinates. Weighted by part (kit/rigs/bind.py).
import numpy as np
BONES = [
    ('ground', None, (0, 0, 0.0), (0, 0, 0.04)),
    ('drops', None, (0, 0, 0.06), (0, 0, 0.15)),
    ('body', None, (0, 0, 0.16), (0, 0, 0.40)),
    ('top', 'body', (0, 0, 0.40), (0, 0, 0.62)),
]
TRUNK = ('body', 'top')
BANDS = {'top': (0.06, 0.2)}            # the flame's upper half bends over a wide band

def part(P, kind, idx, piece):
    out = np.full(len(P), -1)
    for c in np.unique(piece):
        m = piece == c; Q = P[m]; zt = Q[:, 2].max()
        if zt < 0.03: out[m] = idx['ground']                                     # the ripple and its light
        elif zt < 0.155: out[m] = idx['drops']                                   # the falling drops
        elif np.bincount(kind[m]).argmax() in (7, 8) and Q[:, 2].mean() < 0.42: out[m] = idx['body']   # core, face
    return out

def mask(P, idx):
    """nothing of the flame ever follows the ground or the drops"""
    M = np.ones((len(P), len(idx))); M[:, idx['ground']] = 0; M[:, idx['drops']] = 0
    return M
