# The boglurcher's rig: a heap with a base (the root), a middle and a top that it bends with, the two cattails and the
# sprout. Sculpt coordinates (x right, y forward, z up). Weighted by part (kit/rigs/bind.py).
import numpy as np
# (from sculpt.py: kept in step by hand)
PROF_Z = [0.00, 0.06, 0.14, 0.22, 0.30, 0.37, 0.45, 0.53, 0.60, 0.645]
PROF_R = [0.50, 0.51, 0.48, 0.44, 0.40, 0.37, 0.32, 0.25, 0.14, 0.02]
CATTAILS = [((0.19, -0.16), 0.91, 0.20), ((0.02, -0.06), 1.0, 0.21)]
SPROUT = (-0.19, 0.12)

def _sz(x, y): return float(np.interp(-np.hypot(x, y / (0.86 if y > 0 else 0.94)), [-r for r in PROF_R], PROF_Z))
_a, _b = CATTAILS
BONES = [
    ('base', None, (0, 0, 0.0), (0, 0, 0.2)),
    ('body', 'base', (0, 0, 0.2), (0, 0, 0.42)),
    ('top', 'body', (0, 0, 0.42), (0, 0, 0.64)),
    ('cattail_a', 'top', (_a[0][0], _a[0][1], _sz(*_a[0])), (_a[0][0] * 1.25, _a[0][1] * 1.25, _a[1])),
    ('cattail_b', 'top', (_b[0][0], _b[0][1], _sz(*_b[0])), (_b[0][0] * 1.25, _b[0][1] * 1.25, _b[1])),
    ('sprout', 'top', (SPROUT[0], SPROUT[1], _sz(*SPROUT)), (SPROUT[0], SPROUT[1], _sz(*SPROUT) + 0.25)),
]
TRUNK = ('base', 'body', 'top')

def weigh(D, P, idx):
    for n in ('cattail_a', 'cattail_b', 'sprout'): D[:, idx[n]] += 1000.0     # they are their own pieces (part())
    return D

def part(P, kind, idx, piece):
    """each stalk, head and the sprout is a piece of its own: the nearest of the three stalks; the stones its base;
    the eyes the middle"""
    out = np.full(len(P), -1)
    tops = {n: np.array(b[2][:2]) for n, b in zip([b[0] for b in BONES], BONES) if n in ('cattail_a', 'cattail_b', 'sprout')}
    for c in np.unique(piece):
        m = piece == c; k = np.bincount(kind[m]).argmax(); Q = P[m]
        if k in (3, 8) and Q[:, 2].max() > 0.5:                                  # a stalk, a head, a spike, the sprout
            xy = Q[:, :2].mean(0)
            out[m] = idx[min(tops, key=lambda n: np.linalg.norm(tops[n] - xy))]
        elif k == 8: out[m] = idx['base']                                        # a stone
        elif k == 7: out[m] = idx['body']                                        # an eye
    return out
