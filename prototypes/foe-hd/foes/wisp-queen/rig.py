# The wisp-queen's rig (session 8, the wraiths): the rime-wraith's (foes/rime-wraith/rig.py) on her joints. She floats:
# no legs. Her core rides her trunk; the locks falling from her shoulders and breast (kind 4) and the Mirage Glass (kind 4,
# its jewel kind 9) ride her chest whole, those lower down (kind 15) her hips whole, those of her head (kind 14) her head;
# so a lock never stretches between two bones. Her arms and their locks and claws are kind 12.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 0.80), 'spine': (0, 0.0, 0.93), 'chest': (0, 0.0, 1.06), 'neck': (0, 0.0, 1.22),
     'head': (0, 0.0, 1.32), 'head_top': (0, -0.03, 1.85)}
J.update({'r_shoulder': (0.18, 0.0, 1.15), 'r_elbow': (0.28, 0.02, 0.95), 'r_wrist': (0.35, 0.05, 0.80), 'r_hand_tip': (0.40, 0.06, 0.66),
          'l_shoulder': (-0.18, 0.0, 1.15), 'l_elbow': (-0.28, 0.02, 0.95), 'l_wrist': (-0.35, 0.05, 0.80), 'l_hand_tip': (-0.40, 0.06, 0.66)})
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_hip': (s * 0.09, 0.0, 0.78), f'{n}_knee': (s * 0.10, 0.02, 0.45), f'{n}_ankle': (s * 0.10, -0.01, 0.15),
              f'{n}_toe': (s * 0.10, 0.15, 0.10)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {4: 'chest', 9: 'chest', 15: 'hips'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.15, leg_top=0.80, head_z=1.25)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.15, 0.78)
    for n, i in idx.items():                             # the head (kind 14) is a piece of its own
        if n != 'head': D[K == 14, i] += 1000.0
        else: D[K != 14, i] += 1000.0
    # the wide sleeves hang past the elbow: each arm point is the upper arm's only above the elbow, the forearm's below it
    for side in ('r', 'l'):
        sh, el = np.array(J[side + '_shoulder']), np.array(J[side + '_elbow'])
        ax = (el - sh) / np.linalg.norm(el - sh); t = (P - el) @ ax
        D[(K == 12) & (t > 0.03), idx[side + '_upper']] += 1000.0
        D[(K == 12) & (t < -0.06), idx[side + '_fore']] += 1000.0
        wr = np.array(J[side + '_wrist']); ax2 = (wr - el) / np.linalg.norm(wr - el); t2 = (P - wr) @ ax2
        D[(K == 12) & (t2 < -0.015), idx[side + '_hand']] += 1000.0              # the hand only past the wrist (never the sleeve)
    z = P[:, 2]                                          # each leg bone only at its own height (the thigh bone starts inside
    for n, i in idx.items():                             # the pelvis, so the sight test can hide it from the top of the thigh)
        if n.endswith('_shin'): D[(K == 13) & (z > 0.56), i] += 1000.0
        if n.endswith('_foot'): D[(K == 13) & (z > 0.20), i] += 1000.0
        if n.endswith('_thigh'): D[(K == 13) & (z < 0.32), i] += 1000.0
    return D
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[(kind == 4) | (kind == 9)] = idx['chest']        # the upper locks and the Mirage Glass
    out[kind == 15] = idx['hips']                         # the lower locks
    return out
def rigid(kind, P, idx):
    return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 15: ['hips'], 4: ['chest'], 9: ['chest']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.10, 0.22), 'l_shin': (0.10, 0.22), 'r_fore': (0.08, 0.15), 'l_fore': (0.08, 0.15),
         'r_foot': (0.07, 0.16), 'l_foot': (0.07, 0.16), 'r_hand': (0.04, 0.10), 'l_hand': (0.04, 0.10),
         'spine': (0.12, 0.35), 'chest': (0.12, 0.35), 'neck': (0.10, 0.25), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 3))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
