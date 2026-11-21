# The glowcap's rig: hips, body, head (face and cap), the leaf arms, two legs (boots). Sculpt coordinates.
import numpy as np
BONES = [
    ('hips', None, (0, 0, 0.1), (0, 0, 0.25)),
    ('body', 'hips', (0, 0, 0.25), (0, 0, 0.38)),
    ('head', 'body', (0, 0.02, 0.35), (0, 0.02, 0.62)),
    ('r_arm', 'body', (0.16, 0, 0.31), (0.22, 0, 0.16)), ('l_arm', 'body', (-0.16, 0, 0.31), (-0.22, 0, 0.16)),
    ('r_thigh', 'hips', (0.065, 0, 0.12), (0.068, 0, 0.05)), ('r_foot', 'r_thigh', (0.068, 0, 0.05), (0.068, 0.08, 0.02)),
    ('l_thigh', 'hips', (-0.065, 0, 0.12), (-0.068, 0, 0.05)), ('l_foot', 'l_thigh', (-0.068, 0, 0.05), (-0.068, 0.08, 0.02)),
]
def weigh(D, P, idx):
    z, x = P[:, 2], P[:, 0]
    D[:, idx['head']] *= np.where(z > 0.35, 0.3, 3.0)                       # the cap and face move as the head
    for n in ('r_arm', 'l_arm'):
        D[:, idx[n]] *= np.where(np.abs(x) > 0.15, 0.7, 4.0)
        D[:, idx[n]] += np.where(np.sign(x) != (1 if n[0] == 'r' else -1), 1.0, 0.0)
    for n in ('r_thigh', 'r_foot', 'l_thigh', 'l_foot'):
        D[:, idx[n]] *= np.where(z > 0.12, 4.0, 1.0)
        D[:, idx[n]] += np.where(np.sign(x) != (1 if n[0] == 'r' else -1), 1.0, 0.0)
    return D
