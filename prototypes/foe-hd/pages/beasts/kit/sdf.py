# The beasts' working kit (Foes: beasts, session 7), copied and generalised from session 6's Briarmaw sculpt
# (prototypes/foe-hd/blender/sculpt.py) until the shared kit lands. Pure numpy: signed-distance shapes, noise,
# marching cubes on a narrow band, and the mesh builders for parts (tubes, horns, leaves, spheres).
#
# Coordinates while sculpting (as Briarmaw): x is the beast's right side, y forward (to the nose), z up, metres.
import math, time, numpy as np
from skimage.measure import marching_cubes

T0 = time.time()
def log(*a): print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)

# ---- signed distance ----------------------------------------------------------------------------------------------
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)
def ell(P, c, r):
    r = np.asarray(r, np.float32)
    p = (P - np.asarray(c, np.float32)) / r
    k0 = np.linalg.norm(p, axis=1); k1 = np.linalg.norm(p / r, axis=1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-6)
def cap(P, a, b, ra, rb, scale=None):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32)
    if scale is not None:
        sc = np.asarray(scale, np.float32); P = P / sc; a = a / sc; b = b / sc
    ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)
def chain(P, pts, radii, k=0.02, scale=None):
    """a smooth limb through several joints, the radius tapering joint to joint"""
    d = None
    for i in range(len(pts) - 1):
        c = cap(P, pts[i], pts[i + 1], radii[i], radii[i + 1], scale)
        d = c if d is None else smin(d, c, k)
    return d

NG = 64
NTAB = np.random.default_rng(3).random((NG, NG, NG)).astype(np.float32)
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
def mix(a, b, t): return np.asarray(a) * (1 - np.asarray(t)) + np.asarray(b) * np.asarray(t)
def sstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)
def blob(P, c, r):
    """1 at c, falling to 0 at the ellipsoid r"""
    return np.exp(-np.sum(((P - np.asarray(c)) / np.asarray(r)) ** 2, 1))

def grad(f, P, e=1e-3):
    g = np.zeros_like(P)
    for i in range(3):
        o = np.zeros(3, np.float32); o[i] = e
        g[:, i] = (f(P + o) - f(P - o)) / (2 * e)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
def project(P, f, it=5):
    P = np.asarray(P, np.float32).copy()
    for _ in range(it): P -= f(P)[:, None] * grad(f, P)
    return P, grad(f, P)

def mc(f, h, lo, hi, band=None, coarse=None):
    """marching cubes of f at voxel h inside the box lo..hi. With band, f is evaluated exactly only near the surface
    (found on a grid `coarse` times coarser); elsewhere the coarse value stands in, which is fine away from the zero."""
    lo = np.asarray(lo, np.float32); hi = np.asarray(hi, np.float32)
    xs = [np.arange(lo[i], hi[i] + h, h, dtype=np.float32) for i in range(3)]
    shp = tuple(len(x) for x in xs)
    if band is None:
        X, Y, Z = np.meshgrid(*xs, indexing='ij')
        P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1); del X, Y, Z
        vals = np.empty(len(P), np.float32)
        for i in range(0, len(P), 1_000_000): vals[i:i + 1_000_000] = f(P[i:i + 1_000_000])
        vals = vals.reshape(shp)
    else:
        c = coarse or 4; H = h * c
        cx = [np.arange(lo[i], hi[i] + H * 2, H, dtype=np.float32) for i in range(3)]
        X, Y, Z = np.meshgrid(*cx, indexing='ij'); CP = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1); del X, Y, Z
        cv = np.empty(len(CP), np.float32)
        for i in range(0, len(CP), 1_000_000): cv[i:i + 1_000_000] = f(CP[i:i + 1_000_000])
        cv = cv.reshape(tuple(len(x) for x in cx))
        # nearest coarse value for every fine point, then exact values where the coarse says we're near the surface
        ix = [np.minimum(np.round((xs[a] - lo[a]) / H).astype(np.int64), cv.shape[a] - 1) for a in range(3)]
        vals = cv[np.ix_(*ix)].astype(np.float32)
        near = np.abs(vals) < band + H * 0.9
        idx = np.nonzero(near.ravel())[0]
        log(f'  mc: grid {shp}, exact at {len(idx):,} of {vals.size:,}')
        for i in range(0, len(idx), 1_000_000):
            j = idx[i:i + 1_000_000]
            a, b_, c_ = np.unravel_index(j, shp)
            P = np.stack([xs[0][a], xs[1][b_], xs[2][c_]], 1)
            vals.ravel()[j] = f(P)
    v, fc, _, _ = marching_cubes(vals, 0.0, spacing=(h, h, h))
    return (v + lo).astype(np.float32), fc.astype(np.int32)

def sample_surface(V, F, n, rng):
    a = V[F[:, 1]] - V[F[:, 0]]; b = V[F[:, 2]] - V[F[:, 0]]
    area = 0.5 * np.linalg.norm(np.cross(a, b), axis=1)
    idx = rng.choice(len(F), n, p=area / area.sum())
    r1, r2 = rng.random(n), rng.random(n); s = np.sqrt(r1)
    return V[F[idx, 0]] * (1 - s)[:, None] + V[F[idx, 1]] * (s * (1 - r2))[:, None] + V[F[idx, 2]] * (s * r2)[:, None]

# ---- meshes for parts ---------------------------------------------------------------------------------------------
class Mesh:
    """everything sculpted, as one list of parts; kind says what each is (the bake reduces each kind on its own, the
    rig moves rigid kinds as one): 0 body, 2 thorns/horns, 3 vines, 4 leaves, 5 teeth/tusks, 6 claws, 7 eyes (glow),
    8 flowers, 9 other"""
    def __init__(s): s.V, s.F, s.C, s.K = [], [], [], []; s.n = 0
    def add(s, V, F, col, kind):
        V = np.asarray(V, np.float32); F = np.asarray(F, np.int64)
        col = np.broadcast_to(np.asarray(col, np.float32), (len(V), 3))
        s.V.append(V); s.F.append(F + s.n); s.C.append(col); s.K.append(np.full(len(V), kind, np.uint8)); s.n += len(V)
    def arrays(s):
        return (np.concatenate(s.V), np.concatenate(s.F).astype(np.int32), np.concatenate(s.C), np.concatenate(s.K))
    def save(s, path, extra=None):
        V, F, C, K = s.arrays()
        counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
        log(f'total tris {len(F):,}  verts {len(V):,}  by kind {counts}')
        np.savez_compressed(path, V=V, F=F, C=np.clip(C, 0, 1).astype(np.float32), K=K, **(extra or {}))

def frames(pts):
    t = np.gradient(pts, axis=0); t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
    n = np.cross(t[0], [0, 0, 1.0])
    if np.linalg.norm(n) < 1e-3: n = np.cross(t[0], [1.0, 0, 0])
    n /= np.linalg.norm(n); N = [n]
    for i in range(1, len(pts)):
        n = N[-1] - t[i] * (N[-1] @ t[i]); n /= max(np.linalg.norm(n), 1e-9); N.append(n)
    N = np.array(N); return t, N, np.cross(t, N)

def tube(pts, radii, sides=10, ridges=0, ridge_amp=0.0, squash=None):
    pts = np.asarray(pts, np.float64); m = len(pts); radii = np.broadcast_to(np.asarray(radii, float), (m,))
    t, N, B = frames(pts)
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    rr = 1 + (ridge_amp * np.cos(ridges * ang) if ridges else 0 * ang)
    sq = (1.0, 1.0) if squash is None else squash
    V = np.concatenate([pts[i] + (np.cos(ang)[:, None] * N[i] * sq[0] + np.sin(ang)[:, None] * B[i] * sq[1]) * (radii[i] * rr)[:, None] for i in range(m)])
    i = np.arange(m - 1)[:, None]; j = np.arange(sides)[None]
    a = i * sides + j; b = i * sides + (j + 1) % sides; c = a + sides; d = b + sides
    F = np.concatenate([np.stack([a, b, d], -1).reshape(-1, 3), np.stack([a, d, c], -1).reshape(-1, 3)])
    V = np.vstack([V, pts[0], pts[-1]]); s0, s1 = len(V) - 2, len(V) - 1
    jj = np.arange(sides)
    caps = np.concatenate([np.stack([np.full(sides, s0), (jj + 1) % sides, jj], 1),
                           np.stack([np.full(sides, s1), (m - 1) * sides + jj, (m - 1) * sides + (jj + 1) % sides], 1)])
    return V, np.vstack([F, caps])

def horn(base, d, length, r0, bend=None, amt=0.3, seg=12, sides=12, ridges=0, ridge_amp=0.07, tipR=0.0008, power=0.9, hook=2.0):
    """a tapering horn / thorn / claw from base along d, curving toward bend"""
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = np.asarray(bend if bend is not None else [0, 0, -1], float)
    bend = bend - d * (bend @ d); bn = np.linalg.norm(bend); bend = bend / bn if bn > 1e-6 else bend
    u = np.linspace(0, 1, seg)
    pts = np.array([base + d * length * x + bend * length * amt * x ** hook for x in u])
    return tube(pts, r0 * (1 - u) ** power + tipR, sides, ridges=ridges, ridge_amp=ridge_amp if ridges else 0)

def ellipsoid(c, r, rot=None, nt=10, npp=16):
    th, ph = np.meshgrid(np.linspace(0, np.pi, nt), np.linspace(0, 2 * np.pi, npp, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp
            F += [(a, a + npp, b + npp), (a, b + npp, b)]
    off = sp * np.asarray(r)
    if rot is not None: off = off @ np.asarray(rot).T
    return np.asarray(c) + off, np.array(F)

def rot_to(a, b):
    """rotation matrix taking unit vector a to b"""
    a = np.asarray(a, float) / np.linalg.norm(a); b = np.asarray(b, float) / np.linalg.norm(b)
    v = np.cross(a, b); c = a @ b
    if np.linalg.norm(v) < 1e-8: return np.eye(3) if c > 0 else -np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx / (1 + c)

def leaf(base, d, up, length, width, curl=0.25, fold=0.35, nl=7, nw=5, thick=0.0012, serr=0.0, single=False):
    """a leaf as a real thin shape: pointed oval, folded along its midrib, curling back at the tip, with a little
    thickness (two faces and a rim) so it bakes from both sides. d: along the leaf; up: its top side."""
    d = np.asarray(d, float); d /= np.linalg.norm(d); up = np.asarray(up, float); up = up - d * (up @ d); up /= np.linalg.norm(up)
    sd = np.cross(d, up)
    u = np.linspace(0, 1, nl); w = np.linspace(-1, 1, nw)
    U, Wg = np.meshgrid(u, w, indexing='ij')
    half = width * 0.5 * np.sin(np.pi * U ** 0.66)
    if serr: half = half * (1 + serr * np.sin(U * np.pi * 9) * (U > 0.1))
    X = Wg * half
    Hh = fold * np.abs(Wg) * half - curl * length * U ** 2       # folded up from the midrib, the tip curling down
    pts = base + U[..., None] * length * d + X[..., None] * sd + Hh[..., None] * up
    if single:      # one sheet (for a light version, drawn from both sides)
        F = []
        for i in range(nl - 1):
            for j in range(nw - 1):
                a = i * nw + j; F += [(a, a + nw, a + nw + 1), (a, a + nw + 1, a + 1)]
        return pts.reshape(-1, 3), np.array(F), U.ravel().tolist()
    top = pts + up * thick * 0.5; bot = pts - up * thick * 0.5
    V = np.concatenate([top.reshape(-1, 3), bot.reshape(-1, 3)])
    n = nl * nw
    F = []
    for i in range(nl - 1):
        for j in range(nw - 1):
            a = i * nw + j; b = a + 1; c = a + nw; e = c + 1
            F += [(a, c, e), (a, e, b), (n + a, n + e, n + c), (n + a, n + b, n + e)]
    for i in range(nl - 1):            # the rim
        for j in (0, nw - 1):
            a = i * nw + j; c = a + nw
            F += [(a, n + a, n + c), (a, n + c, c)] if j == 0 else [(a, n + c, n + a), (a, c, n + c)]
    return V, np.array(F), U.ravel().tolist() * 2

def flat_cap(P, a, b, ra, rb, thin, k=0.4):
    """a capsule (or cone) squashed to k of its thickness along the direction `thin` (made square to its axis):
    ears, fins, flat horns, wing bones"""
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ax = (b - a) / np.linalg.norm(b - a)
    t = np.asarray(thin, np.float32); t = t - ax * (t @ ax); t /= np.linalg.norm(t)
    Q = P + ((P - a) @ t)[:, None] * t[None] * (1 / k - 1)
    return cap(Q, a, b, ra, rb) * k
