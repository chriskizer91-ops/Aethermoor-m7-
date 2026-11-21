# Signed-distance shapes for sculpting by code (the foe kit, from Briarmaw, November 20).
# P is an (n, 3) float32 array of points; every function is vectorised. Coordinates while shaping: x right, y forward,
# z up, metres, feet on z = 0.
import numpy as np
from skimage.measure import marching_cubes

def smin(a, b, k):
    """smooth union: blends two shapes over a width k"""
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)          # smooth intersection; smax(a, -b, k) carves b out of a
def ell(P, c, r):
    """ellipsoid at c with radii r (a close approximation)"""
    p = (P - np.asarray(c, np.float32)) / np.asarray(r, np.float32)
    k0 = np.linalg.norm(p, axis=1); k1 = np.linalg.norm(p / np.asarray(r, np.float32), axis=1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-6)
def cap(P, a, b, ra, rb, scale=None):
    """capsule from a to b, radius ra to rb; scale squashes it (e.g. (1.5, 1, 1) for a flat, wide one)"""
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32)
    if scale is not None:
        sc = np.asarray(scale, np.float32); P = P / sc; a = a / sc; b = b / sc
    ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)

NG = 64
NTAB = np.random.default_rng(3).random((NG, NG, NG)).astype(np.float32)
def vnoise(P, f):
    """smooth value noise, 0..1, f cycles a metre"""
    q = P * f; i = np.floor(q).astype(np.int64); u = q - i; u = u * u * (3 - 2 * u)
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                out = out + w * NTAB[(i[:, 0] + dx) % NG, (i[:, 1] + dy) % NG, (i[:, 2] + dz) % NG]
    return out
def fbm(P, f, n=3):
    s, a, t = 0, 0.5, 0
    for _ in range(n): s = s + a * vnoise(P + 13.7 * t, f); f *= 2.03; a *= 0.5; t += 1
    return s
def mix(a, b, t): return np.asarray(a) * (1 - t) + np.asarray(b) * t
def sstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)
def tri(x): f = x - np.floor(x); return 1 - np.abs(2 * f - 1)        # a triangle wave: 0 at whole numbers, 1 halfway

def grad(f, P, e=1.5e-3):
    """unit normal of the shape f at P"""
    g = np.zeros_like(P)
    for i in range(3):
        o = np.zeros(3, np.float32); o[i] = e
        g[:, i] = (f(P + o) - f(P - o)) / (2 * e)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
def project(P, f, it=5):
    """move points onto the surface of f; returns the points and the normals there"""
    P = np.asarray(P, np.float32).copy()
    for _ in range(it): P -= f(P)[:, None] * grad(f, P)
    return P, grad(f, P)
def drop(f, xy, z0=2.0):
    """come down from above at each (x, y) until meeting the shape f"""
    P_ = np.column_stack([xy, np.full(len(xy), z0)]).astype(np.float32)
    for _ in range(60):
        d_ = f(P_); P_[:, 2] -= np.maximum(d_, 0.002) * 0.9
    return P_
def mc(f, h, lo, hi, band=None, coarse=4):
    """marching cubes over the box lo..hi at voxel size h; returns vertices and outward-wound triangles.
    band (metres): evaluate f exactly only within band of the surface, found on a grid `coarse` times coarser, about
    ten times faster on the fine passes (session 7's narrow band). Without band: every voxel, a slab of x at a time."""
    lo = np.asarray(lo, np.float32); hi = np.asarray(hi, np.float32)
    xs = [np.arange(lo[i], hi[i] + h, h, dtype=np.float32) for i in range(3)]
    shp = tuple(len(x) for x in xs)
    if band is None:
        vol = np.empty(shp, np.float32)
        Y, Zz = np.meshgrid(xs[1], xs[2], indexing='ij'); Y = Y.ravel(); Zz = Zz.ravel()
        for i, x in enumerate(xs[0]):
            vol[i] = f(np.stack([np.full_like(Y, x), Y, Zz], 1)).reshape(shp[1], shp[2])
    else:
        H = h * coarse
        cx = [np.arange(lo[i], hi[i] + H * 2, H, dtype=np.float32) for i in range(3)]
        X, Y, Z = np.meshgrid(*cx, indexing='ij'); CP = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1); del X, Y, Z
        cv = np.empty(len(CP), np.float32)
        for i in range(0, len(CP), 1_000_000): cv[i:i + 1_000_000] = f(CP[i:i + 1_000_000])
        cv = cv.reshape(tuple(len(x) for x in cx))
        ix = [np.minimum(np.round((xs[a] - lo[a]) / H).astype(np.int64), cv.shape[a] - 1) for a in range(3)]
        vol = cv[np.ix_(*ix)].astype(np.float32)
        idx = np.nonzero((np.abs(vol) < band + H * 0.9).ravel())[0]
        for i in range(0, len(idx), 1_000_000):
            j = idx[i:i + 1_000_000]; a, b_, c_ = np.unravel_index(j, shp)
            vol.ravel()[j] = f(np.stack([xs[0][a], xs[1][b_], xs[2][c_]], 1))
    v, fc, _, _ = marching_cubes(vol, 0.0, spacing=(h, h, h))
    return (v + lo).astype(np.float32), fc.astype(np.int32)
