# The sapwight's rig (session 8): a biped (pages/walkers/kit/rig_biped.py) on the joints of sculpt.py.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped

J = {'hips': (0, 0.0, 0.95), 'spine': (0, 0.03, 1.12), 'chest': (0, 0.05, 1.27), 'neck': (0, 0.07, 1.42),
     'head': (0, 0.14, 1.56), 'head_top': (0, 0.2, 1.75)}
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_shoulder': (s * 0.215, 0.05, 1.405), f'{n}_elbow': (s * 0.30, 0.02, 1.06), f'{n}_wrist': (s * 0.31, 0.06, 0.84),
              f'{n}_hand_tip': (s * 0.32, 0.09, 0.62), f'{n}_hip': (s * 0.118, 0.0, 0.93), f'{n}_knee': (s * 0.115, 0.03, 0.49),
              f'{n}_ankle': (s * 0.125, -0.01, 0.085), f'{n}_toe': (s * 0.125, 0.22, 0.02)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {2: 'head', 9: 'head', 7: 'head'}        # twigs, buds and eyes ride the head
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.17, leg_top=1.0, head_z=1.50)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
from rig_biped import gate
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx): return gate(D, P, idx, 0.205, 1.0)       # arms only beyond the ribs
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[np.isin(kind, (2, 9))] = idx['head']              # twigs and buds
    out[(kind == 0) & (P[:, 2] > 1.50) & (P[:, 1] > 0.0)] = idx['head']
    return out
def rigid(kind, P, idx):
    if int(kind) == 6:                                     # a claw: its own hand or foot
        side = 'r' if P[:, 0].mean() > 0 else 'l'
        return f'{side}_foot' if P[:, 2].mean() < 0.3 else f'{side}_hand'
    return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 0: [n for n in _ALL if n not in _ARMS + _LEGS], 2: ['head'], 9: ['head'], 7: ['head']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.12, 0.26), 'l_shin': (0.12, 0.26), 'r_fore': (0.10, 0.22), 'l_fore': (0.10, 0.22),
         'neck': (0.10, 0.25), 'head': (0.10, 0.25)}
