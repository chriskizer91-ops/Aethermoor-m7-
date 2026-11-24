# Armour for the kit (November 24, the polish pass: iron and forge): a suit of pieces, each its own mesh on ONE bone.
#   suit = Suit(K, M)
#   suit.add('cuirass', 'chest', fn, lo, hi, colour, kind=0, mat=(0.45, 0.85))   # fn(P) -> distance; colour(V) -> (n, 3)
#   suit.build()                          # meshes every piece in its own box, adds it to M, writes build/pieces.json
# The rig reads build/pieces.json (pieces_part below): each piece of the light mesh goes whole to the bone of the piece
# whose middle it is nearest (among those whose box holds it), so plates and stone move rigidly and nothing stretches.
# Shapes: rbox (a rounded box, turned and tapered), plate shells, bands; trim() finds a box's edges (gold edging).
import json, os
import numpy as np


def rot(rx=0.0, ry=0.0, rz=0.0):
    """a turn: about x, then y, then z (radians)"""
    cx, sx, cy, sy, cz, sz = np.cos(rx), np.sin(rx), np.cos(ry), np.sin(ry), np.cos(rz), np.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


def local(P, c, R=None):
    """points into a piece's own frame (its middle c, its turn R)"""
    Q = np.asarray(P, np.float64) - np.asarray(c, np.float64)
    return Q if R is None else Q @ R          # (R's columns are the piece's axes)


def rbox(P, c, h, r=0.01, R=None, taper=None):
    """a rounded box: middle c, half sizes h, edge radius r; taper=(axis, k): the box narrows by k across its
    length along that axis (for a cuirass narrowing at the waist)"""
    Q = local(P, c, R); h = np.asarray(h, np.float64)
    if taper is not None:
        ax, k = taper; f = 1 - k * 0.5 * (1 - np.clip(Q[:, ax] / h[ax], -1, 1))
        Q = Q.copy()
        for a in range(3):
            if a != ax: Q[:, a] = Q[:, a] / f
    q = np.abs(Q) - (h - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - r


def trim(P, c, h, w, R=None, axes=(0, 1, 2)):
    """0..1: near a box's edges (two of its faces within w), for gold edging"""
    Q = np.abs(local(P, c, R)); h = np.asarray(h, np.float64)
    near = np.stack([(Q[:, a] > h[a] - w).astype(float) for a in axes], 1)
    return (near.sum(1) >= 2).astype(float)


def rivets(P, c, h, w, s, r, R=None):
    """0..1: round rivet heads in a row along every edge of a box's faces, w in from the edge, s apart, radius r"""
    Q = local(P, c, R); A = np.abs(Q); h = np.asarray(h, np.float64)
    face = np.argmax(A / h, 1); out = np.zeros(len(P))
    for f in range(3):
        m = face == f
        if not m.any(): continue
        t = [a for a in range(3) if a != f]; best = np.full(m.sum(), 9.0)
        for perp, alongax in ((t[0], t[1]), (t[1], t[0])):
            dp = np.abs(A[m, perp] - (h[perp] - w)); q = Q[m, alongax]
            da = np.abs(q - s * np.round(q / s)); da = np.where(np.abs(q) > h[alongax] - w * 0.8, 9.0, da)
            best = np.minimum(best, np.hypot(dp, da))
        out[m] = np.clip(1 - best / r, 0, 1)
    return out


def cyl(P, a, b, r):
    """a flat-ended cylinder from a to b"""
    a = np.asarray(a, np.float64); b = np.asarray(b, np.float64); ab = b - a; L = np.linalg.norm(ab); u = ab / L
    Q = np.asarray(P, np.float64) - a; t = Q @ u
    d_r = np.linalg.norm(Q - t[:, None] * u, axis=1) - r; d_t = np.abs(t - L / 2) - L / 2
    return np.minimum(np.maximum(d_r, d_t), 0) + np.hypot(np.maximum(d_r, 0), np.maximum(d_t, 0))


def along(P, a, b):
    """0..1 along a segment from a to b (clipped), and the distance from its line"""
    a = np.asarray(a, np.float64); b = np.asarray(b, np.float64); ab = b - a; L2 = ab @ ab
    t = np.clip((np.asarray(P, np.float64) - a) @ ab / L2, 0, 1)
    return t, np.linalg.norm(P - (a + t[:, None] * ab), axis=1)


class Suit:
    def __init__(s, K, M):
        s.K, s.M, s.items = K, M, []

    def add(s, name, bone, fn, lo, hi, colour, kind=0, mat=(0.45, 0.85), vox=1.0):
        """vox: this piece's voxel as a share of the level's (smaller for fine pieces: a crown's prongs, a hilt)"""
        s.items.append(dict(name=name, bone=bone, fn=fn, lo=np.asarray(lo, float), hi=np.asarray(hi, float),
                            colour=colour, kind=kind, mat=mat, vox=vox))

    def build(s):
        K, out = s.K, []
        for it in s.items:
            V, F = K.sdf.mc(it['fn'], K.VOX * it['vox'], it['lo'], it['hi'])
            if len(F) == 0: K.log('  (empty piece)', it['name']); continue
            col = it['colour'](V) if callable(it['colour']) else np.tile(np.asarray(it['colour'], float), (len(V), 1))
            s.M.add(V, F, np.clip(col, 0, 1), it['kind'], mat=it['mat'])
            out.append(dict(name=it['name'], bone=it['bone'], lo=it['lo'].tolist(), hi=it['hi'].tolist(),
                            mid=V.mean(0).tolist()))
        K.log(f'{len(out)} pieces')
        return out


def save_pieces(foe_dir, pieces):
    os.makedirs(os.path.join(foe_dir, 'build'), exist_ok=True)
    json.dump(pieces, open(os.path.join(foe_dir, 'build', 'pieces.json'), 'w'), indent=0)


def pieces_part(foe_dir, P, idx, piece, pad=0.01):
    """for a rig's part(): each mesh piece to the bone of the suit piece it came from"""
    items = json.load(open(os.path.join(foe_dir, 'build', 'pieces.json')))
    mids = np.array([i['mid'] for i in items]); lo = np.array([i['lo'] for i in items]) - pad
    hi = np.array([i['hi'] for i in items]) + pad; bones = [i['bone'] for i in items]
    out = np.full(len(P), -1)
    for c in np.unique(piece):
        m = piece == c; ctr = P[m].mean(0)
        inside = np.all((ctr >= lo) & (ctr <= hi), 1)
        d = np.linalg.norm(mids - ctr, axis=1) + np.where(inside, 0, 10.0)
        out[m] = idx[bones[int(np.argmin(d))]]
    return out
