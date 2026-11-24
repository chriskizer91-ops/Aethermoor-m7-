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
        D[:, idx[n]] += 10.0          # the arms are their leaves only (part() below); the body's skin never follows them
    for n in ('r_thigh', 'r_foot', 'l_thigh', 'l_foot'):
        D[:, idx[n]] *= np.where(z > 0.12, 4.0, 1.0)
        D[:, idx[n]] *= np.where((np.abs(x) < 0.03) & (z > 0.08), 3.0, 1.0)            # the middle of the crotch goes with the hips, not one boot (November 24)
        D[:, idx[n]] += np.where(np.sign(x) != (1 if n[0] == 'r' else -1), 400.0, 0.0)     # not the other side (400 steers the labels; 1000 would be a hard gate)
    return D

# weights by part (kit/rigs/bind.py, November 21)
TRUNK = ('hips', 'body')
def part(P, kind, idx, piece):
    """the arms are the leaf tufts at its sides, whole (each leaf judged by where it grows from); the collar leaves sit
    on the body; the cap is the head"""
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    out = np.full(len(P), -1)
    for c in np.unique(piece[kind == 1]):
        m = piece == c
        Q = P[m]; base = Q[np.argmin(np.hypot(Q[:, 0], Q[:, 1]))]
        arm = abs(base[0]) > 0.13 and base[2] < 0.33
        out[m] = (idx['r_arm'] if base[0] > 0 else idx['l_arm']) if arm else idx['body']
    for c in np.unique(piece[kind == 0]):                       # the cap is its own mesh: all head
        m = piece == c
        if z[m].mean() > 0.45: out[m] = idx['head']
    return out
