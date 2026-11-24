# The drowned cantor's rig (session 8, the wraiths): the drowned's (foes/drowned/rig.py) on its own joints. Its left
# hand holds the Cantor's Staff at its breast (the staff rides it); the coral rides its head, the pearls its chest; below
# the waist the robe and cope ride its hips.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 0.90), 'spine': (0, 0.0, 1.07), 'chest': (0, 0.01, 1.24), 'neck': (0, 0.0, 1.42),
     'head': (0, 0.03, 1.52), 'head_top': (0, 0.0, 1.85)}
J.update({'r_shoulder': (0.17, 0.0, 1.40), 'r_elbow': (0.21, 0.0, 1.08), 'r_wrist': (0.22, 0.05, 0.84), 'r_hand_tip': (0.22, 0.07, 0.68),
          'l_shoulder': (-0.17, 0.0, 1.40), 'l_elbow': (-0.21, 0.05, 1.08), 'l_wrist': (-0.13, 0.24, 1.18), 'l_hand_tip': (-0.13, 0.33, 1.21)})
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_hip': (s * 0.09, 0.0, 0.88), f'{n}_knee': (s * 0.10, 0.02, 0.47), f'{n}_ankle': (s * 0.10, -0.01, 0.09),
              f'{n}_toe': (s * 0.10, 0.18, 0.02)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {10: 'l_hand', 2: 'head'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.15, leg_top=0.92, head_z=1.50)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.08, 0.92)
    for n, i in idx.items():                             # the head (kind 14) is a piece of its own
        if n != 'head': D[K == 14, i] += 1000.0
        else: D[K != 14, i] += 1000.0
    z = P[:, 2]                                          # each leg bone only at its own height (the thigh bone starts inside
    for n, i in idx.items():                             # the pelvis, so the sight test can hide it from the top of the thigh)
        if n.endswith('_shin'): D[(K == 13) & (z > 0.60), i] += 1000.0
        if n.endswith('_foot'): D[(K == 13) & (z > 0.24), i] += 1000.0
        if n.endswith('_thigh'): D[(K == 13) & (z < 0.36), i] += 1000.0
    return D
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[kind == 10] = idx['l_hand']                       # the relic
    return out
def rigid(kind, P, idx):
    return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 15: ['hips'], 10: ['l_hand'], 2: ['head'], 4: ['chest']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.10, 0.22), 'l_shin': (0.10, 0.22), 'r_fore': (0.08, 0.15), 'l_fore': (0.08, 0.15),
         'r_foot': (0.07, 0.16), 'l_foot': (0.07, 0.16), 'r_hand': (0.04, 0.10), 'l_hand': (0.04, 0.10),
         'spine': (0.12, 0.35), 'chest': (0.12, 0.35), 'neck': (0.10, 0.25), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 3))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
