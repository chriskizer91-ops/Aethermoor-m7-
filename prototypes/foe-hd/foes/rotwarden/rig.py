# The Rotwarden's rig (session 8): bones in sculpt coordinates (x his right, y forward, z up) and how each point of the
# light model is weighted to them. bake.py imports this.
import numpy as np

SH_R = (0.40, 0.0, 1.67); R_ELB = (0.53, 0.0, 1.31); R_WRI = (0.56, 0.05, 1.02)
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
    ('r_upper', 'chest', SH_R, R_ELB), ('r_fore', 'r_upper', R_ELB, R_WRI), ('r_hand', 'r_fore', R_WRI, (0.56, 0.08, 0.80)),
    ('root1', 'chest', ROOT[0], ROOT[3]),       # it hangs from the top of his shoulder
    ('root2', 'root1', ROOT[3], ROOT[5]),
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

def root_radius(z):
    return np.interp(z, [0.0, 0.2, 0.45, 0.77, 1.08, 1.37, 1.69, 1.9], [0.012, 0.05, 0.085, 0.12, 0.14, 0.155, 0.16, 0.15])

def in_trunk(P):
    """inside the outline of his trunk and hips (the plates there must never follow an arm or the root)"""
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    q = np.sqrt((x / 0.355) ** 2 + ((y - 0.02) / 0.275) ** 2)
    return (q < 1.0) & (z > 0.70) & (z < 1.80)

def weights_at(P, kind):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    BIG = 5.0
    trunk = in_trunk(P)
    # the root arm: its own strands (kind 10) always; the body surface only where it is the root's core, outside the trunk
    near_root = np.min(np.stack([seg_dist(P, ROOT[i], ROOT[i + 1]) for i in range(len(ROOT) - 1)], 1), 1)
    on_root = (kind == 10) | ((kind == 0) & (near_root < root_radius(z) * 1.1 + 0.06) & ~trunk & (x < -0.25) & (z < 1.86))
    # the right arm: what lies along it, outside the trunk
    near_arm = np.min(np.stack([seg_dist(P, SH_R, R_ELB), seg_dist(P, R_ELB, R_WRI), seg_dist(P, R_WRI, (0.56, 0.08, 0.80))], 1), 1)
    on_arm = (kind == 11) | ((kind == 0) & (near_arm < 0.17) & ~trunk & (x > 0.27))     # kind 3 (body roots) never follow it
    for i, (n, par, hd, tl) in enumerate(BONES):
        if n.startswith('root'): D[:, i] = np.where(on_root, D[:, i], BIG)
        else: D[on_root, i] = BIG
        if not n.startswith('r_') or n[2:] not in ('upper', 'fore', 'hand'): D[kind == 11, i] = BIG
        if n in ('r_upper', 'r_fore', 'r_hand'):
            D[:, i] = np.where(on_arm, D[:, i], BIG)
            if n == 'r_upper': D[:, i] *= np.where(z > 1.55, 1.6, 1.0)     # the pauldron stays mostly with the chest
        for s, side in ((1, 'r_'), (-1, 'l_')):
            if n.startswith(side) and n[2:] in ('thigh', 'shin', 'foot'):
                D[:, i] += np.where(np.sign(x + 1e-6) != s, BIG, 0) + np.where(z > 1.08, BIG, 0)
                if n.endswith('thigh'): D[:, i] *= np.where(z > 0.9, 1.5, 1.0)
        if n == 'head': D[:, i] = np.where(z > 1.88, 0.0, D[:, i] + np.where(z < 1.8, BIG, 0))
        if n == 'neck': D[:, i] += np.where(z > 1.95, BIG, 0)
    # the hoops round his hips and the plate over his left thigh hang from his belt: they follow his hips, not his thighs
    hoops = trunk & (z > 0.72) & (z < 1.32) & (kind == 0)
    for n in ('l_thigh', 'r_thigh', 'l_shin', 'r_shin'):
        D[hoops, IDX[n]] = BIG
    D[hoops, IDX['hips']] = np.minimum(D[hoops, IDX['hips']], 0.05)
    W = 1.0 / np.maximum(D, 0.02) ** 4
    # the top of the root arm hands over to his chest gradually, from 1.55 m up to 1.86 m
    top_root = on_root & (z > 1.55)
    if top_root.any():
        t = np.clip((z[top_root] - 1.55) / 0.31, 0, 1)
        W[top_root, IDX['chest']] = (W[top_root].sum(1)) * t / np.maximum(1 - t, 0.05)
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

# ---- for weights by part (pages/walkers/kit/bind.py, session 6's) ----------------------------------------------------
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '../../pages/walkers/kit'))
from rig_biped import gate, nearest
ROOTS = ['root1', 'root2', 'root3', 'root4']; ARM = ['r_upper', 'r_fore', 'r_hand']
TRUNK = ('hips', 'spine', 'chest', 'neck')
# each piece hangs from his body at one joint and turns there as a whole: no blending at those joints
BANDS = {'root1': (0.001, 0.001), 'r_upper': (0.001, 0.001), 'l_thigh': (0.001, 0.001), 'r_thigh': (0.001, 0.001)}
# the head turns on a short neck of bark between helm and gorget: spread the turn over the whole neck; the elbow over the
# plates round it; the neck's blend kept off the top of his breastplate
BANDS.update({'head': (0.001, 0.001), 'neck': (0.001, 0.001), 'r_fore': (0.10, 0.24), 'l_shin': (0.10, 0.26), 'r_shin': (0.10, 0.26),
              'spine': (0.14, 0.45), 'chest': (0.14, 0.45)})        # his trunk bends a little all along, not at one line     # the head is a piece of its own
LEGS = ['l_thigh', 'l_shin', 'l_foot', 'r_thigh', 'r_shin', 'r_foot']
LOOSE = ROOTS                                # the root arm's fungi stand far out from its bones
_ALL = [b[0] for b in BONES]
PIECES = {10: ROOTS, 12: ARM, 11: ARM, 13: LEGS, 14: ['head'],
          0: [n for n in _ALL if n not in ROOTS + ARM + LEGS + ['head', 'neck']], 4: ['chest'], 2: ['head'], 8: ['head'],
          3: [n for n in _ALL if n not in ROOTS + ARM + ['head', 'neck']]}
def weigh(D, P, idx, K):
    """which bones each kind of piece may use; bind blends freely within them.
    kinds: 0 body, 12 right arm, 13 legs, 10 root arm, 11 roots round the arm, 3 roots over body and legs, 2/8 tree, 4 chain"""
    D = gate(D, P, idx, 0.0, 9.0)                          # each side's limbs only on that side
    names = [b[0] for b in BONES]
    allowed = {12: set(ARM), 11: set(ARM), 13: set(LEGS), 10: set(ROOTS), 14: {'head'}}
    for k, ok in allowed.items():
        for i, n in enumerate(names):
            if n not in ok: D[K == k, i] += 1000.0
    for i, n in enumerate(names):                          # the body and the roots over it: never the arm, the legs or the root arm
        if n in ARM or n in ROOTS: D[np.isin(K, (0, 3)), i] += 1000.0
        if n in LEGS: D[K == 0, i] += 1000.0
        if n not in LEGS: D[(K == 3) & (P[:, 2] < 0.9), i] += 1000.0     # the roots wound round his legs: only the legs
        if n in ('head', 'neck'): D[K == 3, i] += 1000.0                 # roots over him stay on his body when his head turns
    return D
def part(P, kind, idx):
    out = np.full(len(P), -1)
    out[kind == 4] = idx['chest']                          # the gold chain
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    helm = (kind == 0) & (np.abs(x) < 0.19) & ((z > 1.865) | ((y > 0.25) & (z > 1.82)))   # the whole helm, beak and all: the head
    out[helm] = idx['head']
    mask = (kind == 0) & (np.abs(x) < 0.11) & (y > 0.24) & (z > 1.38) & (z < 1.66)      # the gold mask: one solid piece, on his chest
    out[mask] = idx['chest']
    return out
def rigid(kind, P, idx):
    return RIGID.get(int(kind))
