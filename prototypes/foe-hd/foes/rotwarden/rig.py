# The Rotwarden's rig (session 8): bones in sculpt coordinates (x his right, y forward, z up) and how each point of the
# light model is weighted to them. bake.py imports this.
import numpy as np

SH_R = (0.40, 0.0, 1.67); R_ELB = (0.47, 0.0, 1.31); R_WRI = (0.48, 0.05, 1.02)
THI = {1: (0.18, 0.0, 0.97), -1: (-0.18, 0.0, 0.97)}
KNEE = {1: (0.215, 0.04, 0.63), -1: (-0.215, 0.04, 0.63)}
ANK = {1: (0.235, 0.0, 0.17), -1: (-0.235, 0.0, 0.17)}
S = 2.5 / 946
def fx(px): return (240 - px) * S
def sz(py): return (970 - py) * S
ROOT = [(fx(px), yy, sz(py)) for (px, py, yy) in
        [(318, 262, 0.02), (360, 300, 0.10), (392, 390, 0.12), (405, 470, 0.10), (430, 570, 0.08), (458, 680, 0.08),
         (488, 800, 0.09), (512, 900, 0.1), (534, 966, 0.11)]]

BONES = [  # name, parent, head, tail
    ('hips', None, (0, 0.0, 1.0), (0, 0.01, 1.25)),
    ('spine', 'hips', (0, 0.01, 1.25), (0, 0.03, 1.5)),
    ('chest', 'spine', (0, 0.03, 1.5), (0, 0.03, 1.78)),
    ('neck', 'chest', (0, 0.03, 1.78), (0, 0.13, 1.92)),
    ('head', 'neck', (0, 0.13, 1.92), (0, 0.17, 2.2)),
    ('r_upper', 'chest', SH_R, R_ELB), ('r_fore', 'r_upper', R_ELB, R_WRI), ('r_hand', 'r_fore', R_WRI, (0.48, 0.08, 0.80)),
    ('root1', 'chest', ROOT[1], ROOT[3]), ('root2', 'root1', ROOT[3], ROOT[5]),
    ('root3', 'root2', ROOT[5], ROOT[7]), ('root4', 'root3', ROOT[7], ROOT[8]),
]
for s, n in ((1, 'r'), (-1, 'l')):
    BONES += [(f'{n}_thigh', 'hips', THI[s], KNEE[s]), (f'{n}_shin', f'{n}_thigh', KNEE[s], ANK[s]),
              (f'{n}_foot', f'{n}_shin', ANK[s], (s * 0.235, 0.30, 0.04))]
NAMES = [b[0] for b in BONES]
IDX = {n: i for i, n in enumerate(NAMES)}
RIGID = {2: 'head', 8: 'head', 4: 'chest'}          # branches and leaves ride the head, the chain the chest

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weights_at(P, kind):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    BIG = 5.0
    near_root = seg_dist(P, ROOT[0], ROOT[1]) * 0 + np.min(np.stack([seg_dist(P, ROOT[i], ROOT[i + 1]) for i in range(len(ROOT) - 1)], 1), 1)
    on_root = (near_root < np.interp(z, [0, 0.5, 1.0, 1.5, 1.9], [0.06, 0.13, 0.19, 0.2, 0.2])) & (x < -0.28) & (z < 1.62)
    for i, (n, par, hd, tl) in enumerate(BONES):
        if n.startswith('root'): D[:, i] = np.where(on_root, D[:, i], BIG)
        elif on_root.any(): D[on_root, i] = BIG
        if n.startswith('r_') and n[2:] in ('upper', 'fore', 'hand'):
            D[:, i] += np.where(x < 0.27, BIG, 0) + np.where((x < 0.355) & (z > 1.15) & (z < 1.75), BIG, 0) + np.where(z > 1.72, 0.3, 0)
            if n == 'r_upper': D[:, i] *= np.where(z > 1.55, 1.6, 1.0)     # the pauldron stays mostly with the chest
        for s, side in ((1, 'r_'), (-1, 'l_')):
            if n.startswith(side) and n[2:] in ('thigh', 'shin', 'foot'):
                D[:, i] += np.where(np.sign(x + 1e-6) != s, BIG, 0) + np.where(z > 1.08, BIG, 0)
                if n.endswith('thigh'): D[:, i] *= np.where(z > 0.9, 1.5, 1.0)
        if n == 'head': D[:, i] = np.where(z > 1.88, 0.0, D[:, i] + np.where(z < 1.8, BIG, 0))
        if n == 'neck': D[:, i] += np.where(z > 1.95, BIG, 0)
    W = 1.0 / np.maximum(D, 0.02) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)
