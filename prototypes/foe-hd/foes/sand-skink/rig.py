# The sand-skink's rig: the kit's quad template, with its long tail in three bones (sculpt coordinates, sculpt.py's p()).
import sys, os, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make
S = 0.35 / 264.0; MID = 1070; GROUND = 512
def p(px, py, x=0.0): return (x, (px - MID) * S, (GROUND - py) * S)

LEGS = {'fr': [p(1235, 400, 0.08), p(1262, 438, 0.165), p(1290, 492, 0.19)],
        'fl': [p(1235, 400, -0.08), p(1262, 438, -0.165), p(1290, 492, -0.19)],
        'br': [p(945, 410, 0.085), p(905, 445, 0.19), p(925, 492, 0.21)],
        'bl': [p(945, 410, -0.085), p(905, 445, -0.19), p(925, 492, -0.21)]}
BONES, _weigh, rigid = make(LEGS, hips=(p(880, 410), p(1010, 392)), spine=(p(1010, 392), p(1140, 378)),
                            chest=(p(1140, 378), p(1270, 362)), neck=(p(1270, 362), p(1380, 330)),
                            head=(p(1380, 330), p(1576, 320)), jaw=(p(1420, 338), p(1570, 330)),
                            tail=(p(880, 410), p(790, 428)), paw_len=0.04,
                            jaw_region=lambda P: (P[:, 1] > (1425 - MID) * S) & (P[:, 2] < (GROUND - 332) * S + (P[:, 1] - (1440 - MID) * S) * 0.08))
# each paw bone points where its foot really goes (splayed out to the side), not straight ahead
FOOT = {'fr': p(1305, 508, 0.215), 'fl': p(1305, 508, -0.215), 'br': p(905, 508, 0.235), 'bl': p(905, 508, -0.235)}
BONES = [(n, par, h, (FOOT[n[:2]][0] * 1.12, FOOT[n[:2]][1] + (FOOT[n[:2]][1] - h[1]) * 0.6, 0.012)) if n.endswith('_paw') else (n, par, h, t)
         for n, par, h, t in BONES]
# the long tail: three more bones down to the curled tip
BONES += [('tail2', 'tail', p(790, 428), p(690, 440)), ('tail3', 'tail2', p(690, 440), p(605, 432)),
          ('tail4', 'tail3', p(605, 432), p(568, 350))]
TAIL = ('tail_root', 'tail', 'tail2', 'tail3', 'tail4')
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    y = P[:, 1]
    for n in ('tail2', 'tail3', 'tail4'): D[:, idx[n]] += np.where(y > (880 - MID) * S, 1000.0, 0.0)    # never the body
    # the shoulder blades and haunches only round their own joint: never the middle of the back or the neck
    ax, z = np.abs(P[:, 0]), P[:, 2]
    for n in ('fr_blade', 'fl_blade', 'br_haunch', 'bl_haunch'):
        D[:, idx[n]] += np.where((ax < 0.065) | (z > 0.2) | (np.sign(P[:, 0]) != (1 if n[1] == 'r' else -1)), 1000.0, 0.0)
        jy = BONES[idx[n]][3][1]
        D[:, idx[n]] += np.where(np.abs(y - jy) > 0.09, 1000.0, 0.0)
    return D
TRUNK = ('hips', 'spine', 'chest', 'neck_base', 'neck', 'tail_root', 'tail')
BANDS = {'fr_paw': 0.035, 'fl_paw': 0.035, 'br_paw': 0.035, 'bl_paw': 0.035, 'tail': 0.07, 'tail2': 0.05, 'tail3': 0.04, 'tail4': 0.03, 'neck': 0.04, 'head': 0.03}
SPLIT = [('head', 'jaw')]
SMOOTH = 10

LIP = lambda P: (GROUND - 332) * S + (P[:, 1] - (1440 - MID) * S) * 0.08
def part(P, kind, idx):
    """the throat under the head, behind the jaw, goes with the neck: the jaw is cut from the head only along the lips,
    and its back edge blends into the throat (a throat stretches as a mouth opens) instead of opening a crack"""
    out = np.full(len(P), -1)
    y = P[:, 1] / S + MID
    out[(y > 1350) & (y < 1430) & (P[:, 2] < LIP(P)) & (kind == 0)] = idx['neck']
    return out
