# The rotgrub's rig: the kit's serpent chain (segments from the tail tip to the head's back, then the head), one
# segment per ring or so, measured off the sheet like sculpt.py. No jaw: its mandibles ride the head. The claws ride
# whichever ring they hang from. Sculpt coordinates (x its right, y forward, z up).
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from serpent import make

S = 0.35 / 375; GROUND = 545; MID = 1075
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)
SPINE = [p(0, 600, 415), p(0, 700, 395), p(0, 800, 375), p(0, 900, 365), p(0, 1000, 360), p(0, 1100, 358),
         p(0, 1200, 360), p(0, 1300, 368), p(0, 1385, 372)]
BONES, _weigh, _rigid = make(spine=SPINE, head=(p(0, 1385, 372), p(0, 1500, 400)))

def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    D[:, idx['head']] += np.where(P[:, 1] < (1375 - MID) * S, 1000.0, 0.0)      # the head stays in its capsule
    legs = (np.abs(P[:, 0]) > 110 * S) & (P[:, 2] < (GROUND - 445) * S)          # and off the front legs
    D[:, idx['head']] += np.where(legs, 1000.0, 0.0)
    return D

def rigid(kind, P, idx):
    """the mandibles ride the head; each claw its ring"""
    if kind == 6 and P[:, 1].mean() > (1440 - MID) * S: return 'head'
    return _rigid(kind, P, idx)

SMOOTH = 12
BANDS = {f'seg{i}': (0.03, 0.12) for i in range(len(SPINE) - 1)}
BANDS['head'] = (0.025, 0.1)
