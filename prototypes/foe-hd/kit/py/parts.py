# Building a body from named parts, each with its own look (session 8's Parts and Blobs, November 20).
#   parts = Parts(); parts.add('torso', lambda P: ell(P, ...), 'bark'); parts.add('plate', fn, 'iron', k=0.02)
#   sdf = parts.sdf; label = parts.label(V)      # which part made the surface at each vertex: colours don't bleed
#   moss = Blobs(centres, radii)                 # many small spheres as one soft lumpy shape (moss, warts, knobs)
import numpy as np
from scipy.spatial import cKDTree
from sdf import smin

class Parts:
    def __init__(s): s.items = []
    def add(s, name, fn, look, k=0.0):
        """fn(P) -> distance; look: a key into the foe's looks; k > 0 blends it softly into what came before"""
        s.items.append((name, fn, look, k))
    def sdf(s, P):
        d = None
        for _, fn, _, k in s.items:
            e = fn(P)
            d = e if d is None else (smin(d, e, k) if k > 0 else np.minimum(d, e))
        return d
    def label(s, P):
        """which part made the surface at each point (index into items): the one nearest"""
        return np.argmin(np.stack([fn(P) for _, fn, _, _ in s.items], 1), 1)
    def looks(s, P):
        """the look key of the part at each point"""
        keys = [lk for _, _, lk, _ in s.items]
        return np.array(keys, dtype=object)[s.label(P)]

class Blobs:
    def __init__(s, C, R, k=0.012):
        s.C = np.asarray(C, np.float32); s.R = np.asarray(R, np.float32); s.k = k
        s.tree = cKDTree(s.C) if len(C) else None; s.rmax = float(s.R.max()) if len(R) else 0
    def __call__(s, P, n=6):
        if s.tree is None: return np.full(len(P), 9.0, np.float32)
        d, i = s.tree.query(P, n, distance_upper_bound=s.rmax * 3 + 0.05)
        ok = np.isfinite(d); i = np.where(ok, i, 0)
        e = np.where(ok, d - s.R[i], 9.0)
        out = e[:, 0]
        for j in range(1, e.shape[1]): out = smin(out, e[:, j], s.k)     # neighbouring lumps run together
        return out.astype(np.float32)
