# The forge-spark's rig (the kit's spark plan): the caged ember floats free (body, a root), its flame flickers (top);
# its two fists float on their own (l_fist, r_fist, roots); the ring and its bits stay below (ground, a root).
# Sculpt coordinates. Weighted by part (kit/rigs/bind.py): every piece moves whole.
import numpy as np
BONES = [
    ('ground', None, (0, 0, 0.0), (0, 0, 0.08)),
    ('body', None, (0, 0, 0.14), (0, 0, 0.34)),
    ('top', 'body', (0, 0, 0.34), (0, 0, 0.48)),
    ('r_fist', None, (0.155, 0.02, 0.16), (0.155, 0.02, 0.24)),
    ('l_fist', None, (-0.155, 0.02, 0.16), (-0.155, 0.02, 0.24)),
]
TRUNK = ('body', 'top')

def part(P, kind, idx, piece):
    out = np.full(len(P), -1)
    for c in np.unique(piece):
        m = piece == c; Q = P[m]; ctr = Q.mean(0)
        if Q[:, 2].max() < 0.13: out[m] = idx['ground']                            # the ring, its glow, the bits
        elif abs(ctr[0]) > 0.12 and ctr[2] < 0.3: out[m] = idx['r_fist'] if ctr[0] > 0 else idx['l_fist']
        elif ctr[2] > 0.36 and np.bincount(kind[m]).argmax() == 7: out[m] = idx['top']   # the flame and the sparks
        else: out[m] = idx['body']                                                # shell, ember, cage, rivets
    return out
