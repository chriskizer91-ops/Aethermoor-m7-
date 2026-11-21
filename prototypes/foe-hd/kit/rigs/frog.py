# Rig template: a frog or toad (the Mirelord, boglurchers that hop). Squat body, wide head with a jaw, short front
# legs, long folded back legs. Sculpt coordinates.
#   from frog import make
#   BONES, weigh, rigid = make(hips=(a, b), chest=(a, b), head=(a, b), jaw=(a, b),
#                              front=[shoulder, elbow, wrist, toe], back=[hip, knee, ankle, toe], jaw_region=None)
# front/back are his right side (+x); the left mirrors. Bones: hips, chest, head, jaw, r_/l_ arm, forearm, hand,
# thigh, shin, foot. kit/js/moves/frog.js poses them.
import numpy as np

def make(hips, chest, head, jaw, front, back, jaw_region=None):
    B = [('hips', None, *hips), ('chest', 'hips', *chest), ('head', 'chest', *head), ('jaw', 'head', *jaw)]
    for side, sx in (('r', 1), ('l', -1)):
        m = lambda p: (p[0] * sx, p[1], p[2])
        s, e, w, t = [m(p) for p in front]; h, k, a, t2 = [m(p) for p in back]
        B += [(f'{side}_arm', 'chest', s, e), (f'{side}_forearm', f'{side}_arm', e, w), (f'{side}_hand', f'{side}_forearm', w, t),
              (f'{side}_thigh', 'hips', h, k), (f'{side}_shin', f'{side}_thigh', k, a), (f'{side}_foot', f'{side}_shin', a, t2)]
    def weigh(D, P, idx):
        for i, b in enumerate(B):
            n = b[0]
            if n[:2] in ('r_', 'l_'):
                D[:, i] += np.where(np.sign(P[:, 0]) != (1 if n[0] == 'r' else -1), 1.0, 0.0)
                D[:, i] *= 1.4
        D[:, idx['jaw']] += 10
        if jaw_region is not None: D[jaw_region(P), idx['jaw']] = 0.0
        return D
    def rigid(kind, P, idx): return None
    return B, weigh, rigid
