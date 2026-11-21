# The willow-wight's rig: a root (the feet), the trunk, the chest, the head (the face), the crown (its boughs and all
# its fronds, so they sway together), and two branch arms (upper, fore, hand). Sculpt coordinates. Weighted by part
# (kit/rigs/bind.py): the arms and the fronds are pieces of their own.
import numpy as np

# (from sculpt.py: kept in step by hand)
FACE_Z, CROWN_Z = 1.28, 1.62
ARMS = {
    'r': [(0.12, 0.04, 1.12), (0.32, 0.18, 0.93), (0.43, 0.30, 0.71), (0.46, 0.34, 0.59)],
    'l': [(-0.12, 0.05, 1.08), (-0.38, 0.22, 0.95), (-0.55, 0.38, 0.75), (-0.58, 0.42, 0.66)],
}
BONES = [
    ('root', None, (0, 0, 0.0), (0, 0, 0.4)),
    ('trunk', 'root', (0, 0, 0.4), (0, 0, 0.9)),
    ('chest', 'trunk', (0, 0, 0.9), (0, 0, 1.15)),
    ('head', 'chest', (0, 0.02, 1.15), (0, 0.02, 1.5)),
    ('crown', 'head', (0, 0, 1.5), (0, 0, 1.85)),
]
for s, (sh, el, wr, hd) in ARMS.items():
    BONES += [(f'{s}_upper', 'chest', sh, el), (f'{s}_fore', f'{s}_upper', el, wr), (f'{s}_hand', f'{s}_fore', wr, hd)]
TRUNK = ('root', 'trunk', 'chest', 'head')
ARM = {s: [f'{s}_upper', f'{s}_fore', f'{s}_hand'] for s in ARMS}

def _pieces(P, kind, piece):
    """which side's arm each arm piece is (the pieces of kind 1 that reach out at arm height), else None"""
    out = {}
    for c in np.unique(piece[kind == 1]):
        m = piece == c; Q = P[m]
        if len(Q) > 200 and Q[:, 2].mean() < 1.2 and np.abs(Q[:, 0]).mean() > 0.2:      # big, low, out to a side
            out[c] = 'r' if Q[:, 0].mean() > 0 else 'l'
    return out

def part(P, kind, idx, piece):
    out = np.full(len(P), -1)
    arms = _pieces(P, kind, piece)
    for c in np.unique(piece):
        m = piece == c
        if c in arms: continue                                                  # an arm: its own bones (mask below)
        k = np.bincount(kind[m]).argmax()
        Q = P[m]
        if k == 1 and (Q[:, 2].max() > 1.2 or len(Q) < 200): out[m] = idx['crown']   # a frond, its drops, or a scrap of one
        elif k == 7 and Q[:, 2].mean() > 1.0 and abs(Q[:, 0].mean()) < 0.12: out[m] = idx['head']   # eyes, tears
        elif k in (3, 7) and Q[:, 2].mean() < 1.0: out[m] = idx['l_hand']       # the bluebells
    _parts_cache['arms'] = arms; _parts_cache['piece'] = piece
    return out

_parts_cache = {}
def mask(P, idx):
    """an arm piece takes only its own arm's bones; nothing else ever takes an arm bone"""
    M = np.ones((len(P), len(idx)))
    M[:, idx['crown']] = 0.0                                                    # the crown is its fronds only (part())
    for s in ARMS:
        for n in ARM[s]: M[:, idx[n]] = 0.0
    piece = _parts_cache.get('piece'); arms = _parts_cache.get('arms', {})
    if piece is not None:
        for c, s in arms.items():
            m = piece == c
            M[m] = 0.0
            for n in ARM[s]: M[m, idx[n]] = 1.0
    return M
BANDS = {f'{s}_{p}': (0.06, 0.16) for s in ('r', 'l') for p in ('fore', 'hand')}     # the elbows and wrists bend over a few cm
