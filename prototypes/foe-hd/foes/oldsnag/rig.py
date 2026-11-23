# Old Snag's rig: the kit's four-legged template with its helper joints (shoulder blades, haunches, the neck in two, a
# tail root), measured off the sheet like sculpt.py. Sculpt coordinates (x his right, y forward, z up).
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

S = 1.3 / 590; GROUND = 685; MID = 1130
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)
P_ = lambda *a: np.array(p(*a))
LEGS = {   # where the leg leaves the belly (elbow/stifle), knee/hock, fetlock (the paw runs to the hoof); the blade and
           # haunch helpers carry the shoulder and ham above
    'fl': [p(140, 1230, 560), p(140, 1236, 615), p(140, 1240, 652)],
    'fr': [p(-140, 1290, 560), p(-140, 1296, 615), p(-140, 1300, 652)],
    'bl': [p(135, 772, 560), p(135, 752, 612), p(135, 756, 652)],
    'br': [p(-135, 897, 560), p(-135, 877, 612), p(-135, 881, 652)],
}
BONES, _weigh, _rigid = make(
    legs=LEGS, paw_len=0.06,
    hips=(p(0, 760, 400), p(0, 980, 395)), spine=(p(0, 980, 395), p(0, 1180, 385)), chest=(p(0, 1180, 385), p(0, 1290, 385)),
    neck=(p(0, 1290, 385), p(0, 1370, 390)), head=(p(0, 1370, 390), p(0, 1562, 500)), jaw=(p(0, 1405, 508), p(0, 1525, 532)),
    tail=(p(0, 692, 330), p(0, 636, 500)), tail_from=(700 - MID) * S, leg_top=(0.30, 0.40),
    jaw_region=lambda P: (P[:, 1] > (1430 - MID) * S) & (P[:, 2] < (GROUND - 518) * S) & (P[:, 2] > (GROUND - 560) * S) & (np.abs(P[:, 0]) < 55 * S))

def is_helper(n): return n in ('neck_base', 'tail_root') or n.endswith(('_blade', '_haunch'))

REACH = {'upper': 0.13, 'lower': 0.11, 'paw': 0.12}
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, z = P[:, 0], P[:, 2]
    for n, i in idx.items():
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not is_helper(n):      # a leg keeps to itself (as Briarmaw's rig)
            bn = BONES[i]; a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.05
            D[:, i] += np.where((z > 0.33) | (np.abs(x) < 0.12) | far, 400.0, 0.0)
    D[:, idx['tail']] += np.where(np.abs(x) > 0.08, 400.0, 0.0)
    for e in ('head', 'jaw'):                                       # the head's bones stay in the head
        D[:, idx[e]] += np.where(P[:, 1] < (1330 - MID) * S, 1000.0, 0.0)
    return D

AXE = (P_(-88, 1236, 248), P_(-104, 1222, 172), P_(-198, 1384, 62))
def _near_axe(Pc):
    a, b = AXE[1], AXE[2]; ab = b - a
    t = np.clip(((Pc - a) @ ab) / (ab @ ab), -0.3, 1.1)
    d1 = np.linalg.norm(Pc - (a + t[:, None] * ab), axis=1)
    d2 = np.linalg.norm(Pc - (AXE[0] + AXE[1]) / 2, axis=1)
    return np.minimum(d1, d2).mean() < 0.09

def rigid(kind, P, idx):
    """the tusks and eyes ride on the head, the hatchet on the chest, the tail's locks on the tail; the bristles on
    whatever their root is nearest"""
    if kind in (5, 7): return 'head'
    if kind == 8 and _near_axe(P): return 'chest'
    if kind == 8 and P[:, 1].mean() < (700 - MID) * S and P[:, 2].mean() < 0.5: return 'tail'
    return _rigid(kind, P, idx)

SMOOTH = 16
SPLIT = [('head', 'jaw')]
BANDS = {k + q: ((0.04, 0.10) if q == '_lower' else (0.02, 0.05) if q == '_paw' else (0.06, 0.15))
         for k in ('fl', 'fr', 'bl', 'br') for q in ('_upper', '_lower', '_paw')}
BANDS.update({'neck_base': (0.09, 0.24), 'neck': (0.07, 0.18)})
