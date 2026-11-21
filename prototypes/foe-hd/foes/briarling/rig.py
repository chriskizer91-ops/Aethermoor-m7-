# The briarling's rig: its ball, the sprout, two root legs (thigh, shin, foot each side). Sculpt coordinates.
import numpy as np
BONES = [
    ('hips', None, (0, 0, 0.22), (0, 0, 0.33)),
    ('body', 'hips', (0, 0, 0.33), (0, 0, 0.43)),
    ('sprout', 'body', (0, 0, 0.47), (0, 0, 0.6)),     # from the top of the ball (z 0.48) up
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
    out[P[:, 2] < 0.47] = np.where(P[P[:, 2] < 0.47, 2] > 0.21, idx['body'], -1)     # the whole ball
    return out
