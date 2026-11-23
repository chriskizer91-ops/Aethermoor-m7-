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
         tail_from=None, jaw_parts=None, helpers=True):
    """helpers=True (November 21) adds the helper joints (common.py): a shoulder blade over each foreleg (fl_blade),
    a haunch over each hind leg (bl_haunch), the neck in two (neck_base, neck) and a tail root (tail_root)"""
    lerp = lambda p, q, t: tuple(float(p[i] + (q[i] - p[i]) * t) for i in range(3))
    B = [('hips', None, *hips), ('spine', 'hips', *spine), ('chest', 'spine', *chest)]
    if helpers:
        mid = lerp(neck[0], neck[1], 0.5)
        B += [('neck_base', 'chest', neck[0], mid), ('neck', 'neck_base', mid, neck[1])]
    else: B.append(('neck', 'chest', *neck))
    B.append(('head', 'neck', *head))
    if jaw: B.append(('jaw', 'head', *jaw))
    if tail:
        if helpers:
            tr = lerp(tail[0], tail[1], 0.3)
            B += [('tail_root', 'hips', tail[0], tr), ('tail', 'tail_root', tr, tail[1])]
        else: B.append(('tail', 'hips', *tail))
    for k, (a, b, c) in legs.items():
        par = 'chest' if k[0] == 'f' else 'hips'
        if helpers:          # the blade lies over the shoulder from above and behind it; the haunch over the hip joint
            L = float(np.linalg.norm(np.subtract(a, b)))
            top = (a[0] * 0.75, a[1] - 0.25 * L, a[2] + 0.5 * L) if k[0] == 'f' else (a[0] * 0.75, a[1] + 0.15 * L, a[2] + 0.45 * L)
            h = f'{k}_blade' if k[0] == 'f' else f'{k}_haunch'
            B.append((h, par, top, a)); par = h
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
            if '_' in n and n not in ('neck_base', 'tail_root') and not n.endswith(('_blade', '_haunch')):   # legs: only what is low and near the leg
                D[:, i] *= np.where(z > lt[1], 2.2, np.where(z > lt[0], 1.4, 1.0))
                D[:, i] += np.where(np.sign(P[:, 0]) != np.sign(b[2][0]), 1.0, 0.0)
                D[:, i] += np.where((P[:, 1] > split) != (n[0] == 'f'), 1.0, 0.0)
            if n == 'jaw': D[:, i] += 10
            if n in ('tail', 'tail_root'): D[:, i] *= np.where(P[:, 1] < tfrom, 0.7, 2.0)
        # the helpers keep to their own joint: a blade or haunch only within one upper-leg length of its joint (on a
        # long, low body they'd otherwise claim the side up to the neck); +400 steers the labels, it isn't a gate
        for i, b in enumerate(B):
            if b[0].endswith(('_blade', '_haunch')):
                L = float(np.linalg.norm(np.subtract(legs[b[0][:2]][0], legs[b[0][:2]][1])))
                D[:, i] += np.where(np.linalg.norm(P - np.asarray(b[3]), axis=1) > 1.0 * L, 400.0, 0.0)
        if jaw and jaw_region is not None:
            D[jaw_region(P), idx['jaw']] = 0.0
        return D

    def rigid(kind, P, idx):
        """a rigid piece's bone, when it isn't simply the one its root is nearest (jaw_parts(kind, P) -> True)"""
        if jaw and jaw_parts is not None and jaw_parts(kind, P): return 'jaw'
        return None
    return B, weigh, rigid
