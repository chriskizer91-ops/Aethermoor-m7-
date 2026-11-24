# The bell-ringer's rig (session 8, the wraiths): the drowned's (foes/drowned/rig.py) on its own joints. Nothing shows
# but the shroud, the coral and the crook: the shroud rides its trunk, its lower part its hips; the coral rides its head;
# the crook is its left arm (kind 12), the rope and bell ride its end (left hand). Legs and right arm move nothing seen.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 0.85), 'spine': (0, -0.02, 1.05), 'chest': (0, -0.03, 1.25), 'neck': (0, -0.02, 1.44),
     'head': (0, 0.0, 1.50), 'head_top': (0, 0.0, 2.05)}
# no arms show: its right arm is under the shroud; its left is the crook (shoulder, the top of its curve, its end, the bell)
J.update({'r_shoulder': (0.17, 0.0, 1.38), 'r_elbow': (0.22, 0.0, 1.10), 'r_wrist': (0.24, 0.05, 0.85), 'r_hand_tip': (0.25, 0.07, 0.72),
          'l_shoulder': (-0.20, 0.0, 1.46), 'l_elbow': (-0.26, 0.0, 1.72), 'l_wrist': (-0.39, 0.0, 1.80), 'l_hand_tip': (-0.39, 0.0, 1.50)})
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_hip': (s * 0.10, 0.0, 0.82), f'{n}_knee': (s * 0.11, 0.02, 0.45), f'{n}_ankle': (s * 0.11, -0.01, 0.10),
              f'{n}_toe': (s * 0.11, 0.18, 0.03)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {10: 'l_hand'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.15, leg_top=0.92, head_z=1.50)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.17, 0.80)
    for n, i in idx.items():                             # the head (kind 14) is a piece of its own
        if n != 'head': D[K == 14, i] += 1000.0
        else: D[K != 14, i] += 1000.0
    z = P[:, 2]
    D[(K == 0) & (z > 1.20), idx['hips']] += 1000.0       # the top of the shroud, the ring and the fronds: never the hips
    D[(K == 0) & (z > 1.40), idx['spine']] += 1000.0      # (the sight test can't see into the solid ring)
                                           # each leg bone only at its own height (the thigh bone starts inside
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
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 15: ['hips'], 10: ['l_hand'], 9: ['l_hand']}       # its glow is the bell's
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.10, 0.22), 'l_shin': (0.10, 0.22), 'r_fore': (0.10, 0.20), 'l_fore': (0.10, 0.20),
         'r_foot': (0.07, 0.16), 'l_foot': (0.07, 0.16), 'r_hand': (0.04, 0.10), 'l_hand': (0.04, 0.10),
         'spine': (0.12, 0.35), 'chest': (0.12, 0.35), 'neck': (0.10, 0.25), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 4))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
