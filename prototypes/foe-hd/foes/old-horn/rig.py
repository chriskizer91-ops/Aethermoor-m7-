# Old Horn's rig (session 8): a biped (pages/walkers/kit/rig_biped.py) on the joints of sculpt.py; the club rides his
# left hand, the horn and tusks his head.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped

HEAD = (-0.05, 0.47, 2.02)
J = {'hips': (0, -0.02, 1.0), 'spine': (0, 0.06, 1.25), 'chest': (0, 0.10, 1.52), 'neck': (0, 0.20, 1.80),
     'head': (-0.03, 0.36, 1.92), 'head_top': (-0.05, 0.50, 2.25)}
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_shoulder': (s * 0.50, 0.12, 1.76), f'{n}_elbow': (s * 0.66, 0.14, 1.20), f'{n}_wrist': (s * 0.68, 0.24, 0.80),
              f'{n}_hand_tip': (s * 0.68, 0.28, 0.58), f'{n}_hip': (s * 0.29, -0.04, 0.98), f'{n}_knee': (s * 0.37, 0.0, 0.55),
              f'{n}_ankle': (s * 0.43, -0.07, 0.15), f'{n}_toe': (s * 0.45, 0.28, 0.03)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {2: 'head', 5: 'head', 10: 'l_hand'}      # the horn, the tusks; the club (with its moss and mushrooms) in his left hand

def weights_at(P, kind):
    J_, W = weights_biped(P, kind, BONES, J, arm_inner=0.44, leg_top=1.05, head_z=None, arm_reach=0.24)
    # the head: everything in the head's ball (face, ears, jaw) rides it; the cape stays with the chest, not the arms
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    inhead = np.linalg.norm((P - np.array(HEAD)) / [0.42, 0.34, 0.30], axis=1) < 1
    J_[inhead] = np.array([IDX['head'], 0, 0, 0], np.uint16); W[inhead] = np.array([1, 0, 0, 0], np.float32)
    # the cape and loincloth (kind 1): chest high up, spine in the middle, hips low; never an arm or a leg
    cape = kind == 1
    if cape.any():
        cz = z[cape]
        a_ = np.where(cz > 1.55, IDX['chest'], IDX['spine']); b_ = np.where(cz > 1.55, IDX['spine'], IDX['hips'])
        w = np.where(cz > 1.55, np.clip((cz - 1.55) / 0.4 + 0.5, 0.5, 1.0), np.clip((cz - 0.9) / 0.65, 0.0, 1.0))
        J_[cape] = np.stack([a_, b_, 0 * a_, 0 * a_], 1).astype(np.uint16)
        W[cape] = np.stack([w, 1 - w, 0 * w, 0 * w], 1).astype(np.float32)
    return J_, W

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
from rig_biped import gate
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx): return gate(D, P, idx, 0.44, 1.05)
def part(P, kind, idx):
    z = P[:, 2]
    out = np.full(len(P), -1)
    out[kind == 10] = idx['l_hand']                       # the club, its moss and mushrooms
    # the cape and loincloth (kind 1) blend freely over hips, spine and chest (PIECES keeps them to those)
    inhead = np.linalg.norm((P - np.array(HEAD)) / [0.42, 0.34, 0.30], axis=1) < 1
    out[inhead & (kind == 0)] = idx['head']
    return out
def rigid(kind, P, idx): return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 0: [n for n in _ALL if n not in _ARMS + _LEGS], 1: ['chest'], 15: ['hips'],
          10: ['l_hand'], 2: ['head'], 5: ['head']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.12, 0.32), 'l_shin': (0.12, 0.32),
         'spine': (0.14, 0.45), 'chest': (0.14, 0.45), 'neck': (0.12, 0.35), 'head': (0.10, 0.30)}
