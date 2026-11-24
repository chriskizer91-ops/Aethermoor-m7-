# The mirage-wisp's rig (session 8, the wraiths): the Lantern Mother's (foes/lantern-mother/rig.py), on a small
# two-legged spirit, with its legs back (meshed apart, kind 13, each leg bone only at its own height); its flame of a
# head rides its head bone; the crystal at its heart (kind 9) its chest.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 0.44), 'spine': (0, 0.0, 0.54), 'chest': (0, 0.0, 0.64), 'neck': (0, 0.0, 0.76),
     'head': (0, 0.0, 0.84), 'head_top': (0, -0.03, 1.30)}
J.update({'r_shoulder': (0.11, 0.0, 0.74), 'r_elbow': (0.19, 0.01, 0.66), 'r_wrist': (0.25, 0.02, 0.58), 'r_hand_tip': (0.29, 0.02, 0.48),
          'l_shoulder': (-0.11, 0.0, 0.74), 'l_elbow': (-0.19, 0.01, 0.66), 'l_wrist': (-0.25, 0.02, 0.58), 'l_hand_tip': (-0.29, 0.02, 0.48)})
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_hip': (s * 0.065, 0.0, 0.42), f'{n}_knee': (s * 0.068, 0.012, 0.23), f'{n}_ankle': (s * 0.07, 0.0, 0.06),
              f'{n}_toe': (s * 0.07, 0.10, 0.02)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {9: 'chest'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.09, leg_top=0.46, head_z=0.80)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.08, 0.46)
    for n, i in idx.items():                             # the head (kind 14) is a piece of its own
        if n != 'head': D[K == 14, i] += 1000.0
        else: D[K != 14, i] += 1000.0
    # the wide sleeves hang past the elbow: each arm point is the upper arm's only above the elbow, the forearm's below it
    for side in ('r', 'l'):
        sh, el = np.array(J[side + '_shoulder']), np.array(J[side + '_elbow'])
        ax = (el - sh) / np.linalg.norm(el - sh); t = (P - el) @ ax
        D[(K == 12) & (t > 0.02), idx[side + '_upper']] += 1000.0
        D[(K == 12) & (t < -0.035), idx[side + '_fore']] += 1000.0
        wr = np.array(J[side + '_wrist']); ax2 = (wr - el) / np.linalg.norm(wr - el); t2 = (P - wr) @ ax2
        D[(K == 12) & (t2 < -0.01), idx[side + '_hand']] += 1000.0              # the hand only past the wrist (never the sleeve)
    z = P[:, 2]                                          # each leg bone only at its own height (the thigh bone starts inside
    for n, i in idx.items():                             # the pelvis, so the sight test can hide it from the top of the thigh)
        if n.endswith('_shin'): D[(K == 13) & (z > 0.27), i] += 1000.0
        if n.endswith('_foot'): D[(K == 13) & (z > 0.10), i] += 1000.0
        if n.endswith('_thigh'): D[(K == 13) & (z < 0.17), i] += 1000.0
    return D
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[kind == 9] = idx['chest']                         # the crystal at its heart
    return out
def rigid(kind, P, idx):
    return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 9: ['chest']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.05, 0.11), 'l_shin': (0.05, 0.11), 'r_fore': (0.04, 0.08), 'l_fore': (0.04, 0.08),
         'r_foot': (0.03, 0.07), 'l_foot': (0.03, 0.07), 'r_hand': (0.02, 0.05), 'l_hand': (0.02, 0.05),
         'spine': (0.06, 0.18), 'chest': (0.06, 0.18), 'neck': (0.05, 0.12), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 3))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
