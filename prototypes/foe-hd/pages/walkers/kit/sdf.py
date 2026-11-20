# Sculpting helpers for the walkers (session 8, pages/walkers/kit), until session 6's shared kit lands.
# Copied and adapted from prototypes/foe-hd/blender/sculpt.py (Briarmaw, session 6): the signed-distance shapes,
# value noise, tubes and horns, the mesh with kinds. Added: a narrow-band marching cubes (only the voxels near the
# surface are evaluated finely, so a million-triangle pass fits in memory and minutes), named parts that remember
# which one made each point (for colour and material), and blob fields (moss, lumps) looked up through a k-d tree.
#
# Coordinates while sculpting: x is the foe's right side, y forward, z up, metres, feet on z = 0.
import math, time
import numpy as np
from skimage.measure import marching_cubes
from scipy.spatial import cKDTree

T0 = time.time()
def log(*a): print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)

F32 = np.float32
def A(x): return np.asarray(x, F32)

# ---- shapes -----------------------------------------------------------------------------------------------------
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)
def ell(P, c, r):
    p = (P - A(c)) / A(r)
    k0 = np.linalg.norm(p, axis=1); k1 = np.linalg.norm(p / A(r), axis=1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-6)
def sph(P, c, r): return np.linalg.norm(P - A(c), axis=1) - r
def cap(P, a, b, ra, rb=None, scale=None):
    rb = ra if rb is None else rb
    a = A(a); b = A(b)
    if scale is not None:
        sc = A(scale); P = P / sc; a = a / sc; b = b / sc
    ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)
def capt(P, a, b):
    """how far along a..b (0..1) each point lies"""
    a = A(a); b = A(b); ab = b - a
    return np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
def ellcyl(P, c, rx, ry):
    """an upright elliptic cylinder (infinite in z)"""
    q = (P[:, :2] - A(c)[:2]) / A([rx, ry])
    return (np.linalg.norm(q, axis=1) - 1) * min(rx, ry)
def slab(d, P, lo, hi, axis=2):
    return np.maximum(d, np.maximum(lo - P[:, axis], P[:, axis] - hi))
def plane(P, p0, n):
    n = A(n) / np.linalg.norm(n); return (P - A(p0)) @ n
def rbox(P, c, h, r=0.0):
    q = np.abs(P - A(c)) - A(h) + r
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - r
def chain_cap(P, pts, radii):
    d = None
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], radii[i], radii[i + 1])
        d = e if d is None else np.minimum(d, e)
    return d

# ---- noise ------------------------------------------------------------------------------------------------------
NG = 64
NTAB = np.random.default_rng(3).random((NG, NG, NG)).astype(F32)
def vnoise(P, f):
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
def ridged(P, f, n=3):
    s, a, t = 0, 0.5, 0
    for _ in range(n): s = s + a * (1 - np.abs(2 * vnoise(P + 7.1 * t, f) - 1)); f *= 2.1; a *= 0.5; t += 1
    return s
def mix(a, b, t): return np.asarray(a) * (1 - t) + np.asarray(b) * t
def sstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)

# ---- named parts: the shape is the nearest of them; each remembers its look -------------------------------------
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
        """which part made the surface at each point (index into items)"""
        D = np.stack([fn(P) for _, fn, _, _ in s.items], 1)        # the part whose surface makes the union's: the least
        return np.argmin(D, 1)

# ---- blob fields: many small spheres (moss, lumps), one lookup ------------------------------------------------
class Blobs:
    def __init__(s, C, R):
        s.C = A(C); s.R = A(R); s.tree = cKDTree(s.C) if len(C) else None; s.rmax = float(s.R.max()) if len(R) else 0
    def __call__(s, P, k=6):
        if s.tree is None: return np.full(len(P), 9.0, F32)
        d, i = s.tree.query(P, k, distance_upper_bound=s.rmax * 3 + 0.05)
        ok = np.isfinite(d); i = np.where(ok, i, 0)
        e = np.where(ok, d - s.R[i], 9.0)
        # a soft union so neighbouring lumps run together like a cushion
        kk = 0.012
        out = e[:, 0]
        for j in range(1, e.shape[1]): out = smin(out, e[:, j], kk)
        return out.astype(F32)

# ---- marching cubes over a narrow band ----------------------------------------------------------------------------
def mc(f, h, lo, hi, coarse=4, band=None, chunk=1_500_000):
    lo = A(lo); hi = A(hi)
    n = np.ceil((hi - lo) / h).astype(int) + 1
    hc = h * coarse
    nc = np.ceil((n - 1) / coarse).astype(int) + 1
    xs = [lo[i] + np.arange(nc[i], dtype=F32) * hc for i in range(3)]
    X, Y, Z = np.meshgrid(*xs, indexing='ij')
    Pc = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    vc = np.empty(len(Pc), F32)
    for i in range(0, len(Pc), chunk): vc[i:i + chunk] = f(Pc[i:i + chunk])
    vc = vc.reshape(nc)
    band = band if band is not None else hc * 1.8
    # fine grid: fill from the coarse values, then evaluate exactly wherever the coarse field says the surface is near
    from scipy.ndimage import zoom, minimum_filter
    near = minimum_filter(np.abs(vc), size=3) < band
    vals = np.empty(tuple(n), F32)
    idx = np.argwhere(near)
    # coarse value everywhere first (nearest-neighbour upsample)
    ii = [np.minimum(np.arange(n[a]) // coarse, nc[a] - 1) for a in range(3)]
    vals[:] = vc[np.ix_(ii[0], ii[1], ii[2])]
    # then each near coarse cell's block of fine points, exactly
    pts = []
    for a in range(3): pts.append(None)
    blocks = idx
    log(f'mc: grid {tuple(n)}, {len(blocks)} of {vc.size} coarse cells near the surface')
    off = np.stack(np.meshgrid(*[np.arange(coarse)] * 3, indexing='ij'), -1).reshape(-1, 3)
    B = 20000
    for s0 in range(0, len(blocks), B):
        bl = blocks[s0:s0 + B]
        g = (bl[:, None, :] * coarse + off[None]).reshape(-1, 3)
        g = g[(g < n).all(1)]
        P = lo + g.astype(F32) * h
        v = np.empty(len(P), F32)
        for i in range(0, len(P), chunk): v[i:i + chunk] = f(P[i:i + chunk])
        vals[g[:, 0], g[:, 1], g[:, 2]] = v
    v, fc, _, _ = marching_cubes(vals, 0.0, spacing=(h, h, h))
    return (v + lo).astype(F32), fc.astype(np.int32)

def grad(f, P, e=1.5e-3):
    g = np.zeros_like(P)
    for i in range(3):
        o = np.zeros(3, F32); o[i] = e
        g[:, i] = (f(P + o) - f(P - o)) / (2 * e)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
def project(P, f, it=5):
    P = A(P).copy()
    for _ in range(it): P -= f(P)[:, None] * grad(f, P)
    return P, grad(f, P)
def sample_surface(V, F, n, rng):
    a = V[F[:, 1]] - V[F[:, 0]]; b = V[F[:, 2]] - V[F[:, 0]]
    area = 0.5 * np.linalg.norm(np.cross(a, b), axis=1)
    idx = rng.choice(len(F), n, p=area / area.sum())
    r1, r2 = rng.random(n), rng.random(n); s = np.sqrt(r1)
    return V[F[idx, 0]] * (1 - s)[:, None] + V[F[idx, 1]] * (s * (1 - r2))[:, None] + V[F[idx, 2]] * (s * r2)[:, None]
def poisson(P, rad, rng):
    """thin points so none are closer than rad (rad may be per point)"""
    rad = np.broadcast_to(np.asarray(rad, float), (len(P),))
    order = rng.permutation(len(P)); tree = cKDTree(P); blocked = np.zeros(len(P), bool); take = []
    for i in order:
        if blocked[i]: continue
        take.append(i); blocked[tree.query_ball_point(P[i], rad[i])] = True
    return np.array(take, int)

# ---- tubes ------------------------------------------------------------------------------------------------------
def frames(pts):
    t = np.gradient(pts, axis=0); t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
    n = np.cross(t[0], [0, 0, 1.0])
    if np.linalg.norm(n) < 1e-3: n = np.cross(t[0], [1.0, 0, 0])
    n /= np.linalg.norm(n); N = [n]
    for i in range(1, len(pts)):
        n = N[-1] - t[i] * (N[-1] @ t[i]); nn = np.linalg.norm(n)
        n = n / nn if nn > 1e-6 else N[-1]; N.append(n)
    N = np.array(N); return t, N, np.cross(t, N)

def tube(pts, radii, sides=10, ridges=0, ridge_amp=0.0, caps=True):
    pts = np.asarray(pts, np.float64); m = len(pts)
    radii = np.broadcast_to(np.asarray(radii, float), (m,))
    t, N, B = frames(pts)
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    rr = 1 + (ridge_amp * np.cos(ridges * ang) if ridges else 0 * ang)
    V = np.concatenate([pts[i] + (np.cos(ang)[:, None] * N[i] + np.sin(ang)[:, None] * B[i]) * (radii[i] * rr)[:, None] for i in range(m)])
    i = np.arange(m - 1)[:, None]; j = np.arange(sides)[None]
    a = i * sides + j; b = i * sides + (j + 1) % sides; c = a + sides; d = b + sides
    F = np.concatenate([np.stack([a, b, d], -1).reshape(-1, 3), np.stack([a, d, c], -1).reshape(-1, 3)])
    if caps:
        V = np.vstack([V, pts[0], pts[-1]]); s0, s1 = len(V) - 2, len(V) - 1
        jj = np.arange(sides)
        cp = np.concatenate([np.stack([np.full(sides, s0), (jj + 1) % sides, jj], 1),
                             np.stack([np.full(sides, s1), (m - 1) * sides + jj, (m - 1) * sides + (jj + 1) % sides], 1)])
        F = np.vstack([F, cp])
    return V, F

def resample(pts, step=None, n=None):
    pts = np.asarray(pts, float)
    L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    if n is None: n = max(4, int(L[-1] / step) + 1)
    ss = np.linspace(0, L[-1], n)
    return np.stack([np.interp(ss, L, pts[:, i]) for i in range(3)], 1)

def catmull(pts, n=60):
    """a smooth curve through the given points"""
    P = np.asarray(pts, float); P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, max(2, n // (len(P) - 3)), endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2])
    return np.array(out)

class Mesh:
    """the sculpt: vertices, faces, colour, kind (for the bake's per-part reduction and the rig), material (rough, metal)"""
    def __init__(s): s.V, s.F, s.C, s.K, s.M = [], [], [], [], []; s.n = 0
    def add(s, V, F, col, kind, mat=(0.85, 0.0)):
        V = A(V); F = np.asarray(F, np.int64)
        col = np.broadcast_to(A(col), (len(V), 3))
        mat = np.broadcast_to(A(mat), (len(V), 2))
        s.V.append(V); s.F.append(F + s.n); s.C.append(col); s.M.append(mat)
        s.K.append(np.full(len(V), kind, np.uint8)); s.n += len(V)
    def arrays(s):
        return (np.concatenate(s.V), np.concatenate(s.F).astype(np.int32), np.concatenate(s.C), np.concatenate(s.K),
                np.concatenate(s.M))
