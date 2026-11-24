# The Lantern Mother's rig (session 8, the wraiths): the Rime-Abbot's (foes/rime-abbot/rig.py) on her joints. No legs
# show (her skirt reaches the ground); her right hand holds the lamp-pole (kind 10), her raised left hand the lantern (its
# brass kind 8, its flame kind 9); her hood, face, hair, glowing eyes and flowers ride her head; below the hips her skirt
# and apron ride them.
import os, sys, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import biped_bones, weights_biped, gate

J = {'hips': (0, 0.0, 1.02), 'spine': (0, 0.0, 1.17), 'chest': (0, 0.01, 1.33), 'neck': (0, 0.0, 1.55),
     'head': (0, 0.02, 1.68), 'head_top': (0, 0.0, 1.92)}
J.update({'r_shoulder': (0.18, 0.0, 1.53), 'r_elbow': (0.24, 0.0, 1.27), 'r_wrist': (0.33, 0.06, 1.17), 'r_hand_tip': (0.38, 0.07, 1.12),
          'l_shoulder': (-0.18, 0.0, 1.53), 'l_elbow': (-0.28, 0.16, 1.36), 'l_wrist': (-0.30, 0.31, 1.63), 'l_hand_tip': (-0.30, 0.34, 1.75)})
for s, n in ((1, 'r'), (-1, 'l')):
    J.update({f'{n}_hip': (s * 0.10, 0.0, 0.98), f'{n}_knee': (s * 0.11, 0.02, 0.55), f'{n}_ankle': (s * 0.11, -0.01, 0.15),
              f'{n}_toe': (s * 0.11, 0.15, 0.10)})
BONES = biped_bones(J)
NAMES = [b[0] for b in BONES]; IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {10: 'r_hand', 8: 'l_hand', 9: 'l_hand'}
def weights_at(P, kind):
    return weights_biped(P, kind, BONES, J, arm_inner=0.15, leg_top=1.0, head_z=1.62)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
TRUNK = ('hips', 'spine', 'chest', 'neck')
def weigh(D, P, idx, K):
    D = gate(D, P, idx, 0.12, 0.86)
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
    D[(K == 0) & (P[:, 2] < 1.24), idx['chest']] += 1000.0  # the cape's waist blends spine to hips, never chest to hips
    z = P[:, 2]                                          # each leg bone only at its own height (the thigh bone starts inside
    for n, i in idx.items():                             # the pelvis, so the sight test can hide it from the top of the thigh)
        if n.endswith('_shin'): D[(K == 13) & (z > 0.56), i] += 1000.0
        if n.endswith('_foot'): D[(K == 13) & (z > 0.20), i] += 1000.0
        if n.endswith('_thigh'): D[(K == 13) & (z < 0.32), i] += 1000.0
    return D
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[kind == 10] = idx['r_hand']                      # the lamp-pole
    out[(kind == 8) | (kind == 9)] = idx['l_hand']        # the lantern and its flame
    return out
def rigid(kind, P, idx):
    return RIGID.get(int(kind))

# the pieces (sculpt.py): each keeps only its own bones
_ALL = [b[0] for b in BONES]
_ARMS = [n for n in _ALL if n[2:] in ('upper', 'fore', 'hand')]; _LEGS = [n for n in _ALL if n[2:] in ('thigh', 'shin', 'foot')]
PIECES = {12: _ARMS, 13: _LEGS, 14: ['head'], 0: ['hips', 'spine', 'chest', 'neck'], 15: ['hips'], 10: ['r_hand'], 8: ['l_hand'], 9: ['l_hand'], 7: ['head']}
BANDS = {'r_upper': (0.001, 0.001), 'l_upper': (0.001, 0.001), 'r_thigh': (0.001, 0.001), 'l_thigh': (0.001, 0.001),
         'r_shin': (0.10, 0.22), 'l_shin': (0.10, 0.22), 'r_fore': (0.08, 0.15), 'l_fore': (0.08, 0.15),
         'r_foot': (0.07, 0.16), 'l_foot': (0.07, 0.16), 'r_hand': (0.04, 0.10), 'l_hand': (0.04, 0.10),
         'spine': (0.12, 0.35), 'chest': (0.12, 0.35), 'neck': (0.10, 0.25), 'head': (0.001, 0.001)}
SMOOTH = int(os.environ.get('BIND_SMOOTH', 3))                                   # a light model this coarse: smooth over fewer passes, or shin weight creeps up to the hip
WELD_SAME_KIND = True                        # its legs' tops touch its pelvis: they keep their own weights
