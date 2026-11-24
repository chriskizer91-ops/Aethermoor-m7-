# The rime wolf's rig: the kit's four-legged template with its helper joints (shoulder blades, haunches, the neck in
# two, a tail root), measured off the sheet like sculpt.py; built like the Rot-Stag's and Old Snag's (legs start where
# they leave the body). Sculpt coordinates (x his right, y forward, z up).
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

S = 0.95 / 663; GROUND = 688; MID = 1065
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)
LEGS = {
    'fl': [p(82, 1205, 462), p(82, 1210, 610), p(82, 1213, 652)],
    'fr': [p(-82, 1290, 462), p(-82, 1295, 610), p(-82, 1298, 652)],
    'bl': [p(82, 855, 468), p(82, 812, 582), p(82, 820, 652)],
    'br': [p(-82, 935, 468), p(-82, 892, 582), p(-82, 900, 652)],
}
BONES, _weigh, _rigid = make(
    legs=LEGS, paw_len=0.05,
    hips=(p(0, 830, 320), p(0, 1030, 315)), spine=(p(0, 1030, 315), p(0, 1200, 310)), chest=(p(0, 1200, 310), p(0, 1290, 290)),
    neck=(p(0, 1290, 290), p(0, 1380, 205)), head=(p(0, 1380, 205), p(0, 1538, 210)), jaw=(p(0, 1425, 236), p(0, 1515, 238)),
    tail=(p(0, 795, 225), p(0, 604, 520)), tail_from=(805 - MID) * S, leg_top=(0.34, 0.42),
    jaw_region=lambda P: (P[:, 1] > (1440 - MID) * S) & (P[:, 2] < (GROUND - 232) * S) & (P[:, 2] > (GROUND - 260) * S) & (np.abs(P[:, 0]) < 30 * S))

def is_helper(n): return n in ('neck_base', 'tail_root') or n.endswith(('_blade', '_haunch'))

REACH = {'upper': 0.13, 'lower': 0.10, 'paw': 0.10}
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    for n, i in idx.items():
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not is_helper(n):      # a leg keeps to itself
            bn = BONES[i]; a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.04
            D[:, i] += np.where((z > 0.37) | (np.abs(x) < 0.03) | far, 400.0, 0.0)
        if n.endswith(('_blade', '_haunch')): D[:, i] += np.where((z > 0.52) | (np.abs(x) < 0.04), 400.0, 0.0)
    D[:, idx['tail']] += np.where((np.abs(x) > 0.1) | (y > (800 - MID) * S), 400.0, 0.0)
    for e, front in (('chest', 1330), ('spine', 1260), ('hips', 1150)):     # the ruff and throat belong to the neck
        D[:, idx[e]] += np.where(y > (front - MID) * S, 1000.0, 0.0)
    for e in ('head', 'jaw'):
        D[:, idx[e]] += np.where(y < (1365 - MID) * S, 1000.0, 0.0)
    return D

def rigid(kind, P, idx):
    """the eyes ride the head; the ice crystals the neck; each paw's claws its paw (the root's nearest)"""
    if kind == 7: return 'head'
    if kind == 8: return 'neck'
    return _rigid(kind, P, idx)

SMOOTH = 16
SPLIT = [('head', 'jaw')]
BANDS = {k + q: ((0.05, 0.12) if q == '_lower' else (0.02, 0.05) if q == '_paw' else (0.06, 0.15))
         for k in ('fl', 'fr', 'bl', 'br') for q in ('_upper', '_lower', '_paw')}
BANDS.update({'neck_base': (0.08, 0.22), 'neck': (0.07, 0.2), 'tail': (0.08, 0.2)})

WELD_SAME_KIND = True     # the kit (session 6): pieces that merely touch keep their own weights
