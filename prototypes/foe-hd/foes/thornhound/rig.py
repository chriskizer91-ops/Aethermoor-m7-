# The thornhound's light version and rig, read by the beasts' bake (pages/beasts/kit/bake.py).
# Sculpt coordinates (x his right, y forward, z up, metres), measured off the sheet like sculpt.py.
import numpy as np

S = 0.9 / 716; MID = 900; GROUND = 788
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)

# triangles in the light version, per kind of part (he is rabble: about 20,000 in all)
TARGET = {0: 13200, 2: 1500, 3: 700, 4: 3000, 5: 40, 6: 500, 7: 200, 8: 1100}
CAGE, RAY, AO_DIST = 0.02, 0.06, 0.18
RIGID = [2, 4, 5, 6, 7, 8]          # thorns, leaves, fangs, claws, eyes and flowers move as one piece each
UV_SCALE = {0: 1.0, 2: 0.6, 3: 0.4, 4: 0.3, 5: 0.5, 6: 0.4, 7: 0.8, 8: 0.25}   # picture space: the coat first

LEGS = {
    'fl': [(80, 1030, 425), (80, 998, 525), (82, 978, 690), (84, 992, 745)],
    'fr': [(-80, 1062, 425), (-80, 1042, 525), (-82, 1050, 690), (-84, 1070, 745)],
    'bl': [(78, 668, 440), (84, 740, 555), (90, 648, 625), (94, 700, 745)],
    'br': [(-78, 625, 440), (-84, 672, 560), (-90, 540, 628), (-94, 560, 745)],
}
BONES = [  # name, parent, head, tail
    ('hips', None, p(0, 620, 400), p(0, 800, 385)),
    ('spine', 'hips', p(0, 800, 385), p(0, 960, 370)),
    ('chest', 'spine', p(0, 960, 370), p(0, 1070, 345)),
    ('neck', 'chest', p(0, 1070, 345), p(0, 1160, 255)),
    ('head', 'neck', p(0, 1160, 255), p(0, 1330, 262)),
    ('jaw', 'head', p(0, 1212, 282), p(0, 1312, 292)),
    ('ear_l', 'head', p(36, 1165, 198), p(52, 1157, 80)),
    ('ear_r', 'head', p(-36, 1165, 198), p(-52, 1157, 80)),
    ('tail1', 'hips', p(0, 505, 368), p(0, 470, 430)),
    ('tail2', 'tail1', p(0, 470, 430), p(0, 455, 495)),
    ('tail3', 'tail2', p(0, 455, 495), p(0, 456, 555)),
    ('tail4', 'tail3', p(0, 456, 555), p(0, 466, 625)),
]
for k, J in LEGS.items():
    J = [p(*j) for j in J]
    par = 'chest' if k[0] == 'f' else 'hips'
    toe = (J[3][0], J[3][1] + 0.06, 0.008)
    BONES += [(f'{k}_upper', par, J[0], J[1]), (f'{k}_lower', f'{k}_upper', J[1], J[2]),
              (f'{k}_foot', f'{k}_lower', J[2], J[3]), (f'{k}_paw', f'{k}_foot', J[3], toe)]
NAMES = [b[0] for b in BONES]
IDX = {n: i for i, n in enumerate(NAMES)}

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weights_at(P):
    P = np.asarray(P, np.float32)
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    sx_, sy_ = y / S + MID, GROUND - z / S          # sheet pixels
    for i, b in enumerate(BONES):
        n = b[0]
        if n[:2] in ('fl', 'fr', 'bl', 'br'):
            front = n[0] == 'f'
            top = 470 if front else 470           # above this (sheet px) it's body, not leg
            D[:, i] *= np.where(sy_ < top - 60, 3.0, np.where(sy_ < top, 1.6, 1.0))
            side = np.sign(b[2][0])
            D[:, i] += np.where(np.sign(x) != side, 1.0, 0.0)
            D[:, i] += np.where((sx_ > 850) != front, 1.0, 0.0)
        if n == 'jaw': D[:, i] += 10
        if n.startswith('ear'):
            side = np.sign(b[2][0])
            ear = (sy_ < 200) & (np.sign(x) == side) & (sx_ > 1120) & (sx_ < 1200) & (np.abs(x) > 18 * S)
            D[:, i] = np.where(ear, D[:, i] * 0.3, D[:, i] + 1.0)
        if n.startswith('tail'):
            D[:, i] = np.where(sx_ < 515, D[:, i] * 0.7, D[:, i] * 3.0)
        if n == 'head':
            D[:, i] *= np.where(sx_ > 1185, 0.6, 1.0)
    # the jaw: below the mouth line, at the front of the face
    jaw = (sx_ > 1225) & (sy_ > 278 + (sx_ - 1252) * 0.18) & (sy_ < 330) & (np.abs(x) < 34 * S)
    D[jaw, IDX['jaw']] = 0.0
    W = 1.0 / np.maximum(D, 0.004) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

def rigid_root(P, kind):
    """where a rigid part hangs from: its point nearest the body (or a bone by name)"""
    if kind == 5: return 'head'                          # fangs: upper jaw
    if kind == 7: return 'head'                          # eyes
    if kind == 6:                                         # claws: the paw they're on
        c = P.mean(0); best = min((k for k in LEGS), key=lambda k: np.linalg.norm(np.array(p(*LEGS[k][3]))[:2] - c[:2]))
        return f'{best}_paw'
    ctr = np.array([0, np.clip(P[:, 1].mean(), -0.4, 0.4), 0.45])
    return P[np.argmin(np.linalg.norm(P - ctr, axis=1))]
