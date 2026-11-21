# Shared by the rig templates: distances from points to bones, and turning distances into four weights a vertex.
import numpy as np

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def distances(BONES, P):
    return np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)

def four(D):
    """the four nearest bones, weighted by inverse distance to the fourth power"""
    W = 1.0 / np.maximum(D, 0.02) ** 4
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

# Helper joints (session 7's proposal, November 21): a helper bone sits between a bone and its parent and turns a share
# of that bone's turn, so the joint's volume is kept (the top of a shoulder doesn't fold, a throat doesn't web). The
# moves never touch helpers: the loader (kit/js/loader.js applyHelpers) gives each helper its share of its one child's
# turn after every pose, and takes it off the child, so the limb ends where the move put it.
HELPER_SHARE = {'_blade': 0.5, '_haunch': 0.5, '_shoulder': 0.35, '_hip': 0.3, 'neck_base': 0.5, 'tail_root': 0.25}

def helpers_for(BONES, given=None):
    """[[helper, its child (the driver), share], ...]: the rig's HELPERS ({helper: share}) or, by name, any bone ending
    _blade, _haunch, _shoulder, _hip, or named neck_base, tail_root, that has exactly one child"""
    kids = {}
    for n, par, *_ in BONES: kids.setdefault(par, []).append(n)
    out = []
    for n, *_ in BONES:
        share = (given or {}).get(n)
        if share is None:
            share = next((v for k, v in HELPER_SHARE.items() if n == k or (k.startswith('_') and n.endswith(k))), None)
        if share is not None and len(kids.get(n, [])) == 1: out.append([n, kids[n][0], share])
    return out
