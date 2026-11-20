# Rig template: a four-legged beast (Briarmaw, thornhound, rotstag...). Bones in sculpt coordinates (x right,
# y forward, z up), each from its head to its tail:
#   hips, spine, chest, neck, head, [jaw], [tail], and for each leg fl, fr, bl, br: _upper, _lower, _paw.
# Bone names are what kit/js/moves/quad.js poses, so keep them.
#
#   from quad import make
#   BONES, weigh, rigid = make(legs={'fl': [shoulder, elbow, wrist], ...}, hips=(a, b), spine=(a, b), chest=(a, b),
#                              neck=(a, b), head=(a, b), jaw=(a, b) or None, tail=(a, b) or None,
#                              jaw_region=fn(P) -> bool mask or None, leg_top=(0.6, 0.78))
import numpy as np

def make(legs, hips, spine, chest, neck, head, jaw=None, tail=None, jaw_region=None, leg_top=None, paw_len=0.22,
         tail_from=None, jaw_parts=None):
    B = [('hips', None, *hips), ('spine', 'hips', *spine), ('chest', 'spine', *chest), ('neck', 'chest', *neck),
         ('head', 'neck', *head)]
    if jaw: B.append(('jaw', 'head', *jaw))
    if tail: B.append(('tail', 'hips', *tail))
    for k, (a, b, c) in legs.items():
        par = 'chest' if k[0] == 'f' else 'hips'
        B += [(f'{k}_upper', par, a, b), (f'{k}_lower', f'{k}_upper', b, c),
              (f'{k}_paw', f'{k}_lower', c, (c[0], c[1] + paw_len, 0.04))]
    # where the legs leave the body (by default: 60% and 90% of the shoulder height)
    sh = np.mean([v[0][2] for v in legs.values()])
    lt = leg_top or (sh * 0.7, sh * 0.9)
    split = np.mean([legs['fl'][0][1], legs['bl'][0][1]]) if 'fl' in legs and 'bl' in legs else 0
    tfrom = tail_from if tail_from is not None else (tail[0][1] + 0.03 if tail else None)

    def weigh(D, P, idx):
        z = P[:, 2]
        for i, b in enumerate(B):
            n = b[0]
            if '_' in n:   # legs: only what is low and near the leg; the flanks stay with the body
                D[:, i] *= np.where(z > lt[1], 2.2, np.where(z > lt[0], 1.4, 1.0))
                D[:, i] += np.where(np.sign(P[:, 0]) != np.sign(b[2][0]), 1.0, 0.0)
                D[:, i] += np.where((P[:, 1] > split) != (n[0] == 'f'), 1.0, 0.0)
            if n == 'jaw': D[:, i] += 10
            if n == 'tail': D[:, i] *= np.where(P[:, 1] < tfrom, 0.7, 2.0)
        if jaw and jaw_region is not None:
            D[jaw_region(P), idx['jaw']] = 0.0
        return D

    def rigid(kind, P, idx):
        """a rigid piece's bone, when it isn't simply the one its root is nearest (jaw_parts(kind, P) -> True)"""
        if jaw and jaw_parts is not None and jaw_parts(kind, P): return 'jaw'
        return None
    return B, weigh, rigid
