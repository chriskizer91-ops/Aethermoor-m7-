# The choir-wraith's rig (session 8, the wraiths): the drowned choir's (foes/drowned-choir/rig.py) on its own joints. It
# floats (no legs show). Both hands hold the hymnal (it rides the right hand; the arms always move together); its breath
# rides its head; below the waist its robe rides its hips.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 0.95), 'spine': (0, 0.0, 1.12), 'chest': (0, 0.01, 1.28), 'neck': (0, 0.0, 1.47),
     'head': (0, 0.03, 1.56), 'head_top': (0, 0.0, 1.95)}
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_shoulder': (s * 0.17, 0.0, 1.45), f'{n}_elbow': (s * 0.22, 0.04, 1.15), f'{n}_wrist': (s * 0.12, 0.22, 1.18),
              f'{n}_hand_tip': (s * 0.04, 0.29, 1.24),
              f'{n}_hip': (s * 0.09, 0.0, 0.93), f'{n}_knee': (s * 0.10, 0.02, 0.55), f'{n}_ankle': (s * 0.10, -0.01, 0.20),
              f'{n}_toe': (s * 0.10, 0.15, 0.15)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {10: 'r_hand'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.15, leg_top=0.92, head_z=1.50)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.0, 0.85)
    for n, i in idx.items():                             # the head (kind 14) is a piece of its own
        if n != 'head': D[K == 14, i] += 1000.0
        else: D[K != 14, i] += 1000.0
    z = P[:, 2]                                          # each leg bone only at its own height (the thigh bone starts inside
    for n, i in idx.items():                             # the pelvis, so the sight test can hide it from the top of the thigh)
        if n.endswith('_shin'): D[(K == 13) & (z > 0.58), i] += 1000.0
        if n.endswith('_foot'): D[(K == 13) & (z > 0.20), i] += 1000.0
        if n.endswith('_thigh'): D[(K == 13) & (z < 0.34), i] += 1000.0
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
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 15: ['hips'], 10: ['r_hand'], 9: ['head']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.10, 0.22), 'l_shin': (0.10, 0.22), 'r_fore': (0.08, 0.15), 'l_fore': (0.08, 0.15),
         'r_foot': (0.07, 0.16), 'l_foot': (0.07, 0.16), 'r_hand': (0.04, 0.10), 'l_hand': (0.04, 0.10),
         'spine': (0.12, 0.35), 'chest': (0.12, 0.35), 'neck': (0.10, 0.25), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 3))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
