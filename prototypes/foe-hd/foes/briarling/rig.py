# The briarling's rig: its ball, the sprout, two root legs (thigh, shin, foot each side). Sculpt coordinates.
import numpy as np
BONES = [
    ('hips', None, (0, 0, 0.22), (0, 0, 0.33)),
    ('body', 'hips', (0, 0, 0.33), (0, 0, 0.43)),
    ('sprout', 'body', (0, 0, 0.52), (0, 0, 0.62)),     # bends a little above the top of the ball (z 0.48)
    ('r_thigh', 'hips', (0.045, 0, 0.23), (0.068, 0, 0.11)), ('r_shin', 'r_thigh', (0.068, 0, 0.11), (0.092, 0.005, 0.025)),
    ('r_foot', 'r_shin', (0.092, 0.005, 0.025), (0.1, 0.05, 0.0)),
    ('l_thigh', 'hips', (-0.045, 0, 0.23), (-0.068, 0, 0.11)), ('l_shin', 'l_thigh', (-0.068, 0, 0.11), (-0.092, 0.005, 0.025)),
    ('l_foot', 'l_shin', (-0.092, 0.005, 0.025), (-0.1, 0.05, 0.0)),
]
def weigh(D, P, idx):
    z = P[:, 2]
    for n in ('r_thigh', 'r_shin', 'r_foot', 'l_thigh', 'l_shin', 'l_foot'):
        i = idx[n]
        D[:, i] *= np.where(z > 0.21, 4.0, 1.0)                                   # the ball stays with the ball
        D[:, i] += np.where(np.sign(P[:, 0]) != (1 if n[0] == 'r' else -1), 1.0, 0.0)
    D[:, idx['sprout']] *= np.where(z > 0.43, 0.5, 3.0)
    return D

# weights by part (kit/rigs/bind.py): the ball is trunk with the hips; the sprout bends only at its foot
TRUNK = ('hips', 'body')
def part(P, kind, idx):
    """the sprout is what stands above the ball; nothing of the ball is sprout"""
    out = np.full(len(P), -1)
    out[P[:, 2] < 0.47] = np.where(P[P[:, 2] < 0.47, 2] > 0.21, idx['hips'], -1)     # the whole ball, one part with the legs' root
    from common import seg_dist
    for side in ('r', 'l'):         # each leg's root tube, its top hidden in the ball, goes with the leg
        b = BONES[idx[side + '_thigh']]
        out[(kind == 3) & (P[:, 2] > 0.19) & (seg_dist(P, (b[2][0], b[2][1], b[2][2] + 0.07), b[3]) < 0.05)] = idx[side + '_thigh']
    out[(kind == 3) & (P[:, 2] > 0.45) & (P[:, 2] < 0.495) & (np.hypot(P[:, 0], P[:, 1]) < 0.02)] = idx['body']    # the stalk's foot sits still
    out[kind == 0] = idx['hips']    # the leafy coat is all ball (the legs are root tubes pushed into it)
    return out
BANDS = {'sprout': (0.04, 0.09), 'r_shin': 0.035, 'l_shin': 0.035}    # the stalk's foot and the knees bend over a few cm
SMOOTH = 16
