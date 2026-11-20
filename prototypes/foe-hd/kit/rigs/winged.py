# Rig template: a winged beast (the Gloamwing, lamp-moth, the Thunder-Roc). Body, neck, head, jaw?, tail?, two wings
# of three bones each, two legs. Sculpt coordinates.
#   from winged import make
#   BONES, weigh, rigid = make(body=(a, b), neck=(a, b), head=(a, b), jaw=None, tail=None,
#                              wing=[shoulder, elbow, wrist, tip], leg=[hip, knee, ankle, toe])   # his right side
# Bones: body, neck, head, jaw?, tail?, r_/l_ wing1, wing2, wing3, thigh, shin, foot. kit/js/moves/winged.js flaps them.
import numpy as np

def make(body, neck, head, wing, leg, jaw=None, tail=None, jaw_region=None):
    B = [('body', None, *body), ('neck', 'body', *neck), ('head', 'neck', *head)]
    if jaw: B.append(('jaw', 'head', *jaw))
    if tail: B.append(('tail', 'body', *tail))
    for side, sx in (('r', 1), ('l', -1)):
        m = lambda p: (p[0] * sx, p[1], p[2])
        s, e, w, t = [m(p) for p in wing]; h, k, a, t2 = [m(p) for p in leg]
        B += [(f'{side}_wing1', 'body', s, e), (f'{side}_wing2', f'{side}_wing1', e, w), (f'{side}_wing3', f'{side}_wing2', w, t),
              (f'{side}_thigh', 'body', h, k), (f'{side}_shin', f'{side}_thigh', k, a), (f'{side}_foot', f'{side}_shin', a, t2)]
    shx = abs(wing[0][0])
    def weigh(D, P, idx):
        x = P[:, 0]
        for i, b in enumerate(B):
            n = b[0]
            if n[:2] in ('r_', 'l_'):
                D[:, i] += np.where(np.sign(x) != (1 if n[0] == 'r' else -1), 1.0, 0.0)
                if 'wing' in n: D[:, i] *= np.where(np.abs(x) < shx * 0.8, 3.0, 1.0)   # the body stays with the body
        if jaw: D[:, idx['jaw']] += 10
        if jaw and jaw_region is not None: D[jaw_region(P), idx['jaw']] = 0.0
        return D
    def rigid(kind, P, idx): return None
    return B, weigh, rigid
