# Briarmaw's rig: the kit's four-legged template with his joints (19 bones). Sculpt coordinates.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from quad import make

LEGS = {
    'fl': [(0.44, 0.40, 0.86), (0.46, 0.36, 0.38), (0.47, 0.42, 0.10)],
    'fr': [(-0.44, 0.40, 0.86), (-0.46, 0.36, 0.38), (-0.47, 0.42, 0.10)],
    'bl': [(0.42, -0.72, 0.80), (0.44, -0.78, 0.36), (0.45, -0.72, 0.10)],
    'br': [(-0.42, -0.72, 0.80), (-0.44, -0.78, 0.36), (-0.45, -0.72, 0.10)],
}
BONES, weigh, rigid = make(
    legs=LEGS,
    hips=((0, -0.55, 0.92), (0, -0.05, 0.98)), spine=((0, -0.05, 0.98), (0, 0.32, 1.0)),
    chest=((0, 0.32, 1.0), (0, 0.60, 1.05)), neck=((0, 0.60, 1.05), (0, 0.78, 1.08)),
    head=((0, 0.78, 1.08), (0, 1.18, 1.0)), jaw=((0, 0.84, 0.90), (0, 1.08, 0.86)),
    tail=((0, -0.98, 0.98), (0, -1.32, 0.34)), tail_from=-0.95, leg_top=(0.6, 0.78),
    # the jaw: below the grin, at the front of the face; the tusks grow from it
    jaw_region=lambda P: (P[:, 1] > 0.86) & (P[:, 2] < 0.885 + 0.4 * P[:, 0] ** 2) & (P[:, 2] > 0.66) & (abs(P[:, 0]) < 0.32),
    jaw_parts=lambda kind, P: kind == 5 and P[:, 2].min() < 0.75)

# weights by part (kit/rigs/bind.py, November 21): his legs start below the middle of his flank and near their own
# line; his back and belly are trunk; his mouth is cut along the lips so the jaw opens without dragging his cheeks
import numpy as np
_weigh = weigh
REACH = {'upper': 0.25, 'lower': 0.27, 'paw': 0.4}     # how far across (seen from above) each leg bone reaches
def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, z = P[:, 0], P[:, 2]
    for n in idx:
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not n.endswith(('_blade', '_haunch')):     # (the helpers sit on the body)
            bn = BONES[idx[n]]                          # and no farther across than its REACH from its own line
            a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.08     # nor above its own top (a paw is not the fur over it)
            D[:, idx[n]] += np.where((z > 0.7) | (np.abs(x) < 0.24) | far, 400.0, 0.0)     # (400: steers the labels only; 1000 would be a hard gate)
    D[:, idx['tail']] += np.where(np.abs(x) > 0.2, 400.0, 0.0)     # the tail is the tail, not his rump
    return D
SMOOTH = 16
SPLIT = [('head', 'jaw')]
BANDS = {k + p: ((0.08, 0.3) if p == '_lower' else (0.08, 0.2) if p == '_paw' else (0.06, 0.22)) for k in ('fl', 'fr', 'bl', 'br') for p in ('_upper', '_lower', '_paw')}
BANDS.update({'spine': (0.15, 0.6), 'chest': (0.15, 0.6), 'neck_base': (0.12, 0.5), 'neck': (0.12, 0.45), 'head': (0.12, 0.45), 'tail': (0.1, 0.3)})

# November 23: his legs are pieces of their own (the sculpt's second coat), set into his body. Each leg piece, and the
# vines, thorns and claws on it, belongs to that leg's bones only; his body never takes a leg's weight (the shoulder
# blades and haunches, on his body, carry the leg's swing into it).
LEGBONES = {k: [f'{k}_upper', f'{k}_lower', f'{k}_paw'] for k in LEGS}
ROLE = {}
def _seg(P, a, b):
    a = np.asarray(a, float); b = np.asarray(b, float); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
def part(P, kind, idx, piece):
    """by kind (pieces touching where the legs go into the body are welded, so pieces can't tell): the legs' coat is
    kind 1, each point to the nearest leg and that leg's nearest bone; a vine or thorn low on a leg goes whole with the
    lower leg, a claw with the paw; everything else is his body"""
    out = np.full(len(P), -1); role = np.full(len(P), 'body', dtype=object)
    ks = list(LEGS); DL = np.stack([np.minimum(_seg(P[:, :2], np.array(LEGS[k][0][:2]), np.array(LEGS[k][1][:2])),
                                               _seg(P[:, :2], np.array(LEGS[k][1][:2]), np.array(LEGS[k][2][:2]))) for k in ks], 1)
    near = np.argmin(DL, 1); dmin = DL[np.arange(len(P)), near]
    # a vine, thorn or claw counts as the leg's by its whole piece (a shoulder vine's end reaches low on his flank)
    lowp = np.zeros(len(P), bool)
    for c in np.unique(piece[np.isin(kind, (2, 3, 6))]):
        mm = piece == c
        if P[mm, 2].mean() < 0.52: lowp[mm] = True
    for j, k in enumerate(ks):
        m = (near == j) & ((kind == 1) | (np.isin(kind, (2, 3, 6)) & lowp & (dmin < 0.36)))
        if not m.any(): continue
        role[m] = k
        D = np.stack([_seg(P[m], np.array(BONES[idx[n]][2]), np.array(BONES[idx[n]][3])) for n in LEGBONES[k]], 1)
        lab = np.array([idx[n] for n in LEGBONES[k]])[np.argmin(D, 1)]
        lab = np.where(np.isin(kind[m], (2, 3)), idx[f'{k}_lower'], lab)
        lab = np.where(kind[m] == 6, idx[f'{k}_paw'], lab)
        lab = np.where(kind[m] == 1, -1, lab)              # the leg's coat stays free (mask() keeps it to this leg):
        out[m] = lab                                       # fixed points get no blend, and its knees would tear
    role[kind == 4] = 'headp'                                                      # his head's own coat
    crown = np.isin(kind, (2, 3)) & (P[:, 2] > 1.1) & (P[:, 1] > 0.4)              # the crown of brambles: his head's
    out[crown] = idx['head']
    ROLE['now'] = role
    return out
def mask(P, idx):
    role = ROLE['now']; M_ = np.ones((len(P), len(idx)))
    legb = [idx[n] for k in LEGBONES for n in LEGBONES[k]]
    isbody = role == 'body'
    M_[np.ix_(isbody, legb)] = 0
    headb = [idx[n] for n in ('head', 'jaw', 'neck')]                                 # his head is its own piece: his body
    M_[np.ix_(isbody, headb)] = 0                                                     # never takes its bones, it takes only
    hp = role == 'headp'                                                              # them
    if hp.any(): M_[hp] = 0; M_[np.ix_(hp, [idx['head'], idx['jaw']])] = 1   # the head piece moves whole (and its jaw)
    for k in LEGBONES:
        m = role == k
        if m.any():
            keep = [idx[n] for n in LEGBONES[k]]
            M_[m] = 0; M_[np.ix_(m, keep)] = 1
    return M_
# his legs are their own pieces now, set into his body: the shoulder blades and haunches carry none of a leg's swing
# into his body (any share tears his flank when a paw is raised high)
HELPERS = {'fl_blade': 0.0, 'fr_blade': 0.0, 'bl_haunch': 0.0, 'br_haunch': 0.0, 'neck_base': 0.0}     # (they stay with his body)
WELD_SAME_KIND = True
