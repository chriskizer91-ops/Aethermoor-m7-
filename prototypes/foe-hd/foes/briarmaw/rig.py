# Briarmaw's rig: the kit's four-legged template with his joints (19 bones). Sculpt coordinates.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

LEGS = {
    'fl': [(0.44, 0.40, 0.86), (0.46, 0.36, 0.38), (0.47, 0.42, 0.10)],
    'fr': [(-0.44, 0.40, 0.86), (-0.46, 0.36, 0.38), (-0.47, 0.42, 0.10)],
    'bl': [(0.42, -0.72, 0.80), (0.44, -0.78, 0.36), (0.45, -0.72, 0.10)],
    'br': [(-0.42, -0.72, 0.80), (-0.44, -0.78, 0.36), (-0.45, -0.72, 0.10)],
}
BONES, weigh, rigid = make(
    legs=LEGS,
    hips=((0, -0.55, 0.92), (0, -0.05, 0.98)), spine=((0, -0.05, 0.98), (0, 0.32, 1.0)),
    chest=((0, 0.32, 1.0), (0, 0.60, 1.05)), neck=((0, 0.60, 1.05), (0, 0.78, 1.08)),
    head=((0, 0.78, 1.08), (0, 1.18, 1.0)), jaw=((0, 0.84, 0.90), (0, 1.08, 0.86)),
    tail=((0, -0.98, 0.98), (0, -1.32, 0.34)), tail_from=-0.95, leg_top=(0.6, 0.78),
    # the jaw: below the grin, at the front of the face; the tusks grow from it
    jaw_region=lambda P: (P[:, 1] > 0.86) & (P[:, 2] < 0.885 + 0.4 * P[:, 0] ** 2) & (P[:, 2] > 0.66) & (abs(P[:, 0]) < 0.32),
    jaw_parts=lambda kind, P: kind == 5 and P[:, 2].min() < 0.75)

# weights by part (kit/rigs/bind.py, November 21): his legs start below the middle of his flank and near their own
# line; his back and belly are trunk; his mouth is cut along the lips so the jaw opens without dragging his cheeks
import numpy as np
_weigh = weigh
REACH = {'upper': 0.25, 'lower': 0.27, 'paw': 0.4}     # how far across (seen from above) each leg bone reaches
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, z = P[:, 0], P[:, 2]
    for n in idx:
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not n.endswith(('_blade', '_haunch')):     # (the helpers sit on the body)
            bn = BONES[idx[n]]                          # and no farther across than its REACH from its own line
            a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.08     # nor above its own top (a paw is not the fur over it)
            D[:, idx[n]] += np.where((z > 0.7) | (np.abs(x) < 0.24) | far, 400.0, 0.0)     # (400: steers the labels only; 1000 would be a hard gate)
    D[:, idx['tail']] += np.where(np.abs(x) > 0.2, 400.0, 0.0)     # the tail is the tail, not his rump
    return D
SMOOTH = 16
SPLIT = [('head', 'jaw')]
BANDS = {k + p: ((0.16, 0.4) if p == '_lower' else (0.06, 0.15) if p == '_paw' else (0.06, 0.22)) for k in ('fl', 'fr', 'bl', 'br') for p in ('_upper', '_lower', '_paw')}
