# Rig template: a two-legged walker (the Rotwarden, trolls, thralls...). Bones in sculpt coordinates (x right,
# y forward, z up):
#   hips, spine, chest, neck, head, [jaw], and l_/r_ upperarm, forearm, hand, thigh, shin, foot.
# Bone names are what kit/js/moves/biped.js poses, so keep them.
#
#   from biped import make
#   BONES, weigh, rigid = make(hips=(a, b), spine=(a, b), chest=(a, b), neck=(a, b), head=(a, b),
#                              arm=[shoulder, elbow, wrist, hand_tip], leg=[hip, knee, ankle, toe],   # his right side (+x)
#                              jaw=None, jaw_region=None, held=None)
# His left side (l_, -x) mirrors his right (r_, +x).
import numpy as np

def make(hips, spine, chest, neck, head, arm, leg, jaw=None, jaw_region=None, held=None):
    B = [('hips', None, *hips), ('spine', 'hips', *spine), ('chest', 'spine', *chest), ('neck', 'chest', *neck),
         ('head', 'neck', *head)]
    if jaw: B.append(('jaw', 'head', *jaw))
    for side, sx in (('r', 1), ('l', -1)):
        m = lambda p: (p[0] * sx, p[1], p[2])
        s, e, w, h = [m(p) for p in arm]; hp, k, a, t = [m(p) for p in leg]
        B += [(f'{side}_upperarm', 'chest', s, e), (f'{side}_forearm', f'{side}_upperarm', e, w), (f'{side}_hand', f'{side}_forearm', w, h),
              (f'{side}_thigh', 'hips', hp, k), (f'{side}_shin', f'{side}_thigh', k, a), (f'{side}_foot', f'{side}_shin', a, t)]
    sh_x = abs(arm[0][0]); hip_z = leg[0][2]

    def weigh(D, P, idx):
        x, z = P[:, 0], P[:, 2]
        for i, b in enumerate(B):
            n = b[0]
            if n[:2] in ('l_', 'r_'):
                sx = 1 if n[0] == 'r' else -1
                D[:, i] += np.where(np.sign(x) != sx, 1.0, 0.0)                  # never the other side
                if 'arm' in n:   # the arm only beyond the shoulder line; the chest stays with the chest
                    D[:, i] *= np.where(np.abs(x) < sh_x * 0.75, 2.0, 1.0)
                if n.endswith(('thigh', 'shin', 'foot')):   # the legs only below the hips
                    D[:, i] *= np.where(z > hip_z + 0.05, 2.5, 1.0)
            if n == 'jaw': D[:, i] += 10
        if jaw and jaw_region is not None:
            D[jaw_region(P), idx['jaw']] = 0.0
        return D

    def rigid(kind, P, idx):
        """a held weapon or shield (held(kind, P) -> 'l' or 'r') moves with that hand"""
        if held is not None:
            s = held(kind, P)
            if s: return f'{s}_hand'
        return None
    return B, weigh, rigid
