# Grandfather Willow's rig: the willow-wight's (foes/willow-wight/rig.py) at his size: root, trunk, chest, head, crown
# (its fronds and the drops hanging among them), two branch arms (pieces of their own); the Weeping Bow, its string
# and flowers go with his left hand. Sculpt coordinates. Weighted by part (kit/rigs/bind.py).
import numpy as np

# (from sculpt.py: kept in step by hand)
ARMS = {
    'r': [(0.24, 0.08, 1.82), (0.52, 0.26, 1.42), (0.62, 0.32, 1.12), (0.65, 0.34, 0.98)],
    'l': [(-0.24, 0.12, 1.80), (-0.50, 0.55, 1.55), (-0.34, 0.80, 1.70), (-0.28, 0.84, 1.73)],
}
BOW = [(0.36, 0.72, 1.56), (-0.30, 0.90, 1.74), (-1.02, 0.66, 1.93)]
BONES = [
    ('root', None, (0, 0, 0.0), (0, 0, 0.6)),
    ('trunk', 'root', (0, 0, 0.6), (0, 0, 1.4)),
    ('chest', 'trunk', (0, 0, 1.4), (0, 0, 1.8)),
    ('head', 'chest', (0, 0.03, 1.8), (0, 0.03, 2.35)),
    ('crown', 'head', (0, 0, 2.3), (0, 0, 2.85)),
]
for s, (sh, el, wr, hd) in ARMS.items():
    BONES += [(f'{s}_upper', 'chest', sh, el), (f'{s}_fore', f'{s}_upper', el, wr), (f'{s}_hand', f'{s}_fore', wr, hd)]
TRUNK = ('root', 'trunk', 'chest', 'head')
ARM = {s: [f'{s}_upper', f'{s}_fore', f'{s}_hand'] for s in ARMS}
BANDS = {f'{s}_{p}': (0.09, 0.24) for s in ('r', 'l') for p in ('fore', 'hand')}

def _bow_dist(Q):
    a, g, b = [np.array(p) for p in BOW]
    t = np.linspace(0, 1, 40)[:, None]
    stave = (1 - t) ** 2 * a + 2 * (1 - t) * t * (2 * g - (a + b) / 2) + t ** 2 * b
    return np.min(np.linalg.norm(Q[:, None] - stave[None], axis=2), 1)

_cache = {}
def _seg(Q, a, b):
    a = np.array(a); b = np.array(b); ab = b - a
    t = np.clip(((Q - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(Q - (a + t[:, None] * ab), axis=1)
def part(P, kind, idx, piece):
    out = np.full(len(P), -1); arms = {}
    for c in np.unique(piece):
        m = piece == c; Q = P[m]; k = np.bincount(kind[m]).argmax()
        near_bow = _bow_dist(Q).mean() < 0.14
        near_arm = {sd: min(_seg(Q, pts[i], pts[i + 1]).min() for i in range(3)) for sd, pts in ARMS.items()}
        side = min(near_arm, key=near_arm.get)
        if k == 1 and Q[:, 2].max() < 2.1 and near_arm[side] < 0.12:
            arms[c] = side                                                       # an arm, or a twig of its hand: its own bones
        elif k == 1 and (Q[:, 2].max() > 1.9 or len(Q) < 200): out[m] = idx['crown']   # a frond (or a scrap of one)
        elif k in (7, 8) and near_bow: out[m] = idx['l_hand']                    # the bow, its string, drops, flowers
        elif k == 7 and Q[:, 2].mean() > 2.0 and abs(Q[:, 0].mean()) < 0.15: out[m] = idx['head']   # eyes, tears
        elif k in (7, 8): out[m] = idx['crown']                                  # the teal drops and their caps
        elif k == 3 and Q[:, 2].min() > 0.6 and np.hypot(Q[:, 0], Q[:, 1]).mean() > 0.45: out[m] = idx['crown']  # cords
    _cache['arms'] = arms; _cache['piece'] = piece
    return out

def mask(P, idx):
    """an arm piece takes only its own arm's bones; nothing else ever takes an arm bone; the crown is its pieces only"""
    M = np.ones((len(P), len(idx))); M[:, idx['crown']] = 0.0
    for s in ARMS:
        for n in ARM[s]: M[:, idx[n]] = 0.0
    piece = _cache.get('piece')
    if piece is not None:
        for c, s in _cache['arms'].items():
            m = piece == c; M[m] = 0.0
            for n in ARM[s]: M[m, idx[n]] = 1.0
    return M
BANDS['l_fore'] = (0.05, 0.12)     # his bow arm bends sharply: keep its elbow's band off the upper arm
