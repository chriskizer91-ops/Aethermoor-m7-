# The Rot-Stag's rig: the kit's four-legged template with its helper joints (shoulder blades, haunches, the neck in
# two, a tail root), measured off the sheet like sculpt.py. Sculpt coordinates (x his right, y forward, z up).
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

S = 2.0 / 860; GROUND = 873; MID = 880
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)
LEGS = {   # where the leg leaves the body (elbow/stifle), knee/hock, fetlock (the paw runs to the hoof); the
          # blade and haunch helpers carry the shoulder and thigh above
    'fl': [p(56, 958, 600), p(54, 955, 715), p(52, 952, 820)],
    'fr': [p(-56, 915, 600), p(-54, 912, 715), p(-52, 908, 820)],
    'bl': [p(56, 712, 590), p(54, 665, 700), p(52, 670, 822)],
    'br': [p(-56, 650, 590), p(-54, 602, 700), p(-52, 606, 822)],
}
BONES, _weigh, _rigid = make(
    legs=LEGS, paw_len=0.06,
    hips=(p(0, 640, 450), p(0, 800, 445)), spine=(p(0, 800, 445), p(0, 930, 440)), chest=(p(0, 930, 440), p(0, 985, 425)),
    neck=(p(0, 985, 425), p(0, 1068, 312)), head=(p(0, 1068, 312), p(0, 1184, 336)), jaw=(p(0, 1095, 330), p(0, 1168, 350)),
    tail=(p(0, 612, 410), p(0, 582, 362)), tail_from=(612 - MID) * S + 0.02, leg_top=(0.62, 0.80),
    jaw_region=lambda P: (P[:, 1] > (1110 - MID) * S) & (P[:, 2] < (GROUND - 343) * S) & (P[:, 2] > (GROUND - 370) * S) & (np.abs(P[:, 0]) < 30 * S))

def is_helper(n): return n in ('neck_base', 'tail_root') or n.endswith(('_blade', '_haunch'))

REACH = {'upper': 0.20, 'lower': 0.14, 'paw': 0.16}
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, z = P[:, 0], P[:, 2]
    for n, i in idx.items():
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not is_helper(n):      # a leg keeps to itself (as Briarmaw's rig)
            bn = BONES[i]; a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.06
            D[:, i] += np.where((z > 0.70) | (np.abs(x) < 0.06) | far, 400.0, 0.0)
    D[:, idx['tail']] += np.where(np.abs(x) > 0.08, 400.0, 0.0)
    for e in ('head', 'jaw'):                                       # the head's bones stay in the head
        D[:, idx[e]] += np.where(P[:, 1] < (1040 - MID) * S, 1000.0, 0.0)
    return D

def rigid(kind, P, idx):
    """antlers, vines, mushrooms, the circlet and the eyes all ride on the head"""
    if kind in (2, 7, 8) and P[:, 2].mean() > 1.2: return 'head'
    return _rigid(kind, P, idx)

SMOOTH = 16
SPLIT = [('head', 'jaw')]
BANDS = {k + q: ((0.06, 0.15) if q == '_lower' else (0.02, 0.05) if q == '_paw' else (0.07, 0.2))
         for k in ('fl', 'fr', 'bl', 'br') for q in ('_upper', '_lower', '_paw')}
BANDS.update({'neck_base': (0.09, 0.24), 'neck': (0.07, 0.18)})   # the neck's bend spread wide
