# Briarmaw's sculpt (One Foe, November 20), made in passes, shape first.
#
# Chris: "Start with a 100,000 triangle shape model, and then add in detail, slowly working up to that 1,000,000
# triangle goal. If you just make it fuzzy with a bunch of little tiny hairs, that'll look fuzzy, but it won't look
# like it's supposed to."
#
# So his coat is not hairs. It is about two thousand big leaf-feather tufts (7 to 45 cm, as the sheet paints them)
# sculpted INTO one continuous surface: at every point of his skin the topmost tuft decides the height, so the tufts
# overlap like shingles, each with a hard lip at its tip. The same tufts (same seed) are used at every pass:
#
#   pass 1  shape    ~100k triangles: the masses, the head, the tufts as plain forms, thorns, crown, vines, tusks
#   pass 2  form     ~350k: each tuft splits into strands at its tip, with grooves between them; finer parts
#   pass 3  detail   ~1M:   fine strands within the strands, a little grain; the parts at full roundness
#
# Measurements come from Chris's sheet (art-in/3d/sheets/sheet-briarmaw.webp: front, side, back), at 1.7 m to the
# top of his thorns. While shaping: x is his right side, y forward (to the nose), z up; bake.py turns him to face -Y.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K)
import sys, os, math, time
import numpy as np
from skimage.measure import marching_cubes
from scipy.spatial import cKDTree

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
def log(*a): print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)
VOX = {1: 0.021, 2: 0.0095, 3: 0.0058}[LV]
SIDES = {1: 6, 2: 10, 3: 16}[LV]; SEG = {1: 6, 2: 10, 3: 14}[LV]

# ---- signed distance helpers ---------------------------------------------------------------------------------------
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)
def ell(P, c, r):
    p = (P - np.asarray(c, np.float32)) / np.asarray(r, np.float32)
    k0 = np.linalg.norm(p, axis=1); k1 = np.linalg.norm(p / np.asarray(r, np.float32), axis=1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-6)
def cap(P, a, b, ra, rb, scale=None):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32)
    if scale is not None:
        sc = np.asarray(scale, np.float32); P = P / sc; a = a / sc; b = b / sc
    ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)

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
def mix(a, b, t): return np.asarray(a) * (1 - t) + np.asarray(b) * t
def sstep(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)

# ---- 1. the shape: masses measured off the sheet ------------------------------------------------------------------
LEGS = {
    'fl': [(0.44, 0.44, 0.82), (0.46, 0.40, 0.38), (0.47, 0.46, 0.10)],
    'fr': [(-0.44, 0.44, 0.82), (-0.46, 0.40, 0.38), (-0.47, 0.46, 0.10)],
    'bl': [(0.42, -0.72, 0.74), (0.44, -0.78, 0.36), (0.45, -0.72, 0.10)],
    'br': [(-0.42, -0.72, 0.74), (-0.44, -0.78, 0.36), (-0.45, -0.72, 0.10)],
}
HEAD = np.array([0, 0.84, 1.10], np.float32)
EYES = [np.array([s * 0.15, 1.05, 1.11], np.float32) for s in (1, -1)]
TAIL = ((0, -0.98, 1.06), (0, -1.36, 0.30))

def body_sdf(P):
    d = ell(P, (0, -0.08, 0.90), (0.58, 0.88, 0.55))                      # the barrel
    d = smin(d, ell(P, (0, -0.12, 1.14), (0.46, 0.66, 0.36)), 0.18)        # the hump over the middle of his back
    d = smin(d, ell(P, (0, 0.30, 0.92), (0.62, 0.44, 0.50)), 0.16)         # chest and shoulders, wide
    d = smin(d, ell(P, (0, 0.52, 1.08), (0.46, 0.38, 0.32)), 0.12)         # shoulder hump the head sinks into
    d = smin(d, ell(P, (0, -0.68, 0.80), (0.54, 0.44, 0.48)), 0.16)        # haunches
    d = smin(d, ell(P, (0, 0.0, 0.58), (0.46, 0.78, 0.22)), 0.20)          # belly
    # the head (side view: eye at 0.83 forward and 1.11 up, nose tip 1.20 and 0.98, chin 0.94 and 0.83; front view:
    # eyes 0.155 out, the nose pad 0.22 wide, the grin 0.4 wide at 0.885 up, the tusks out of the lower jaw's sides)
    h = ell(P, HEAD, (0.29, 0.26, 0.20))                                                   # skull
    h = smin(h, ell(P, (0, 0.74, 1.04), (0.33, 0.28, 0.24)), 0.10)                          # back of the head into the neck
    h = smin(h, cap(P, (0, 0.92, 1.02), (0, 1.11, 0.995), 0.15, 0.115, scale=(1.15, 1, 0.9)), 0.05)  # snout, broad
    h = smin(h, ell(P, (0, 1.13, 1.0), (0.115, 0.075, 0.07)), 0.03)                         # nose pad
    h = smin(h, ell(P, (0, 1.02, 1.10), (0.10, 0.12, 0.06)), 0.05)                          # bridge of the nose
    for s in (1, -1):
        h = smin(h, ell(P, (s * 0.11, 1.02, 0.925), (0.12, 0.12, 0.06)), 0.04)              # upper lip, heavy
        h = smin(h, ell(P, (s * 0.16, 1.01, 1.185), (0.12, 0.08, 0.04)), 0.03)              # brow ridge, outer
        h = smin(h, ell(P, (s * 0.07, 1.05, 1.165), (0.07, 0.06, 0.035)), 0.03)             # brow ridge, inner, lower: angry
        h = smin(h, ell(P, (s * 0.30, 0.82, 0.98), (0.17, 0.18, 0.23)), 0.08)               # cheek ruffs
        h = smin(h, ell(P, (s * 0.20, 0.95, 0.83), (0.10, 0.11, 0.10)), 0.06)               # jowls round the tusk roots
        h = smax(h, -ell(P, EYES[0 if s > 0 else 1], (0.072, 0.045, 0.04)), 0.012)         # eye sockets
        h = smax(h, -ell(P, (s * 0.048, 1.205, 0.99), (0.026, 0.03, 0.018)), 0.008)        # nostrils
    h = smin(h, ell(P, (0, 0.95, 0.83), (0.17, 0.15, 0.075)), 0.05)                         # lower jaw
    # the grin: a slot following the jaw's curve
    xs_ = np.linspace(-0.21, 0.21, 9)
    mouth = None
    for x0, x1 in zip(xs_[:-1], xs_[1:]):
        c0 = (x0, 1.07 - 2.6 * x0 * x0, 0.885 + 0.4 * x0 * x0); c1 = (x1, 1.07 - 2.6 * x1 * x1, 0.885 + 0.4 * x1 * x1)
        m = cap(P, c0, c1, 0.016, 0.016)
        mouth = m if mouth is None else np.minimum(mouth, m)
    h = smax(h, -mouth, 0.01)
    d = smin(d, h, 0.10)
    for k, (a, b, c) in LEGS.items():
        front = k[0] == 'f'
        d = smin(d, cap(P, a, b, 0.25 if front else 0.27, 0.20), 0.10)
        d = smin(d, cap(P, b, c, 0.20, 0.19), 0.06)
        sx = 1 if a[0] > 0 else -1
        d = smin(d, ell(P, (c[0] + sx * 0.02, c[1] + 0.06, 0.09), (0.24, 0.29, 0.11)), 0.06)
        if not front:
            d = smin(d, ell(P, (a[0], a[1] + 0.04, a[2] - 0.08), (0.24, 0.34, 0.34)), 0.12)
    # the tail: a wide pointed bunch hanging down behind the rump (side and back views)
    d = smin(d, cap(P, TAIL[0], TAIL[1], 0.22, 0.02, scale=(1.3, 1.0, 1.0)), 0.22)
    return np.maximum(d, -P[:, 2])

def grad(f, P, e=1.5e-3):
    g = np.zeros_like(P)
    for i in range(3):
        o = np.zeros(3, np.float32); o[i] = e
        g[:, i] = (f(P + o) - f(P - o)) / (2 * e)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
def project(P, f, it=5):
    P = np.asarray(P, np.float32).copy()
    for _ in range(it): P -= f(P)[:, None] * grad(f, P)
    return P, grad(f, P)
def grid(h, lo=(-0.86, -1.48, -0.02), hi=(0.86, 1.34, 1.62)):
    xs = [np.arange(lo[i], hi[i] + h, h, dtype=np.float32) for i in range(3)]
    X, Y, Z = np.meshgrid(*xs, indexing='ij')
    return np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1), X.shape, np.asarray(lo, np.float32)
def mc(f, h):
    P, shp, lo = grid(h)
    vals = np.empty(len(P), np.float32)
    for i in range(0, len(P), 2_000_000): vals[i:i + 2_000_000] = f(P[i:i + 2_000_000])
    v, fc, _, _ = marching_cubes(vals.reshape(shp), 0.0, spacing=(h, h, h))
    return (v + lo).astype(np.float32), fc[:, ::-1].astype(np.int32)

# ---- 2. the tufts: where, how big, which way, what colour (the same at every pass) ------------------------------
GREEN = np.array([0.24, 0.34, 0.09]); DKGREEN = np.array([0.12, 0.21, 0.05]); OLIVE = np.array([0.36, 0.38, 0.12])
YGREEN = np.array([0.42, 0.50, 0.14]); BROWN = np.array([0.42, 0.26, 0.12]); DKBROWN = np.array([0.26, 0.15, 0.07])
GOLD = np.array([0.80, 0.52, 0.18]); PALEGOLD = np.array([0.93, 0.74, 0.38]); BONE = np.array([0.88, 0.84, 0.72])
FACE = np.array([0.30, 0.31, 0.13]); EYE = np.array([0.55, 1.0, 0.35]); CLAW = np.array([0.22, 0.14, 0.08])
VINE = np.array([0.44, 0.32, 0.16])

def zones(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    ax = np.abs(x)
    face = sstep(0.66, 0.80, y) * sstep(0.80, 0.9, z) * (1 - sstep(1.22, 1.3, z))
    legs = 1 - sstep(0.30, 0.62, z)
    paws = 1 - sstep(0.12, 0.28, z)
    spine = np.exp(-(x / 0.12) ** 2) * sstep(0.98, 1.1, z) * (1 - sstep(0.45, 0.6, y))
    shoulder = np.exp(-(((ax - 0.56) / 0.16) ** 2 + ((y - 0.40) / 0.24) ** 2 + ((z - 0.86) / 0.24) ** 2))
    haunch = np.exp(-(((ax - 0.50) / 0.18) ** 2 + ((y + 0.86) / 0.26) ** 2 + ((z - 0.74) / 0.24) ** 2))
    cheek = np.exp(-(((ax - 0.30) / 0.13) ** 2 + ((y - 0.82) / 0.16) ** 2 + ((z - 0.95) / 0.22) ** 2))
    beard = np.exp(-((x / 0.14) ** 2 + ((y - 0.96) / 0.12) ** 2 + ((z - 0.78) / 0.09) ** 2))
    tail = sstep(0.98, 1.08, -y) * (1 - sstep(0.9, 1.0, z))
    return dict(face=face, legs=legs, paws=paws, spine=spine, shoulder=shoulder, haunch=haunch, cheek=cheek, tail=tail, beard=beard)

def tuft_len(P):
    Z = zones(P)
    L = np.full(len(P), 0.30)
    L = mix(L, 0.19, Z['legs']); L = mix(L, 0.11, Z['paws'])
    L = mix(L, 0.30, Z['spine']); L = mix(L, 0.46, Z['shoulder']); L = mix(L, 0.44, Z['haunch'])
    L = mix(L, 0.19, Z['cheek']); L = mix(L, 0.42, Z['tail'])
    L = mix(L, 0.06, Z['face'] * (1 - Z['cheek']))
    L = mix(L, 0.13, Z['beard'])
    return L

def flow(P, N):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    Z = zones(P)
    v = np.stack([0 * x, -np.ones_like(x), -0.35 + 0 * x], 1)                       # back, a little down
    down = np.tile([0, -0.12, -1.0], (len(P), 1))
    side = sstep(0.25, 0.55, np.abs(x)) * (1 - sstep(0.95, 1.15, z))
    w = np.maximum(Z['legs'], side * 0.75)
    v = v * (1 - w[:, None]) + down * w[:, None]
    head = sstep(0.62, 0.8, y)
    v = v * (1 - head[:, None]) + np.stack([np.sign(x) * 0.5, -np.ones_like(x), -0.25 + 0 * x], 1) * head[:, None]
    ch = Z['cheek'][:, None]
    v = v * (1 - ch) + np.stack([np.sign(x) * 0.8, -0.5 + 0 * x, -1 + 0 * x], 1) * ch                # ruffs flare out
    bd = Z['beard'][:, None]
    v = v * (1 - bd) + np.tile([0, 0.1, -1.0], (len(P), 1)) * bd
    tl = Z['tail'][:, None]
    v = v * (1 - tl) + np.tile([0, -0.45, -1.0], (len(P), 1)) * tl
    v = v + 0.22 * (np.stack([fbm(P + 3, 3.0), fbm(P + 7, 3.0), fbm(P + 11, 3.0)], 1) - 0.5)
    v = v - N * np.sum(v * N, 1, keepdims=True)
    return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)

def sample_surface(V, F, n, rng):
    a = V[F[:, 1]] - V[F[:, 0]]; b = V[F[:, 2]] - V[F[:, 0]]
    area = 0.5 * np.linalg.norm(np.cross(a, b), axis=1)
    idx = rng.choice(len(F), n, p=area / area.sum())
    r1, r2 = rng.random(n), rng.random(n); s = np.sqrt(r1)
    return V[F[idx, 0]] * (1 - s)[:, None] + V[F[idx, 1]] * (s * (1 - r2))[:, None] + V[F[idx, 2]] * (s * r2)[:, None]

def bare(P):
    """no tufts: soles, the muzzle and nose, round the eyes, the mouth"""
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    b = z < 0.05
    b |= np.linalg.norm((P - [0, 1.08, 1.0]) / [0.17, 0.15, 0.12], axis=1) < 1             # snout and nose
    for e in EYES: b |= np.linalg.norm((P - e) / [1, 1, 0.8], axis=1) < 0.075
    b |= (np.abs(x) < 0.23) & (y > 0.9) & (z < 0.95) & (z > 0.85)                            # the grin
    return b

log('tufts')
rng = np.random.default_rng(11)
Vc, Fc = mc(body_sdf, 0.02)
P = sample_surface(Vc, Fc, 220000, rng)
P = P[~bare(P)]
Lp = tuft_len(P)
order = np.argsort(-Lp + 0.03 * rng.random(len(P)))       # the big ones first, then fill between
tree = cKDTree(P); blocked = np.zeros(len(P), bool); take = []
for i in order:
    if blocked[i]: continue
    take.append(i); blocked[tree.query_ball_point(P[i], 0.36 * Lp[i])] = True
TP = P[take]; nT = len(TP)
TP, TN = project(TP, body_sdf)
TT = flow(TP, TN); TB = np.cross(TN, TT)
Z = zones(TP)
TL = tuft_len(TP) * (0.85 + 0.3 * rng.random(nT))
TW = TL * (0.46 + 0.1 * rng.random(nT)) * mix(1, 0.85, Z['shoulder'] + Z['haunch'])
TH = np.minimum(TL * (0.17 + 0.05 * rng.random(nT)), 0.07) * mix(1, 0.5, Z['face'])
TS = np.round(mix(3, 5, np.clip(TL / 0.4, 0, 1)) + rng.integers(0, 2, nT)).astype(int)   # strands per tuft
brown = np.clip(np.maximum.reduce([Z['spine'], Z['shoulder'], Z['haunch'], Z['cheek'] * 1.3, Z['tail'], Z['beard'] * 1.3,
                                    np.clip((fbm(TP, 2.6) - 0.6) * 5, 0, 1) * 0.8]), 0, 1)
pick = rng.random(nT)
TC = mix(mix(GREEN, DKGREEN, rng.random(nT)[:, None] * 0.8), mix(OLIVE, YGREEN, rng.random(nT)[:, None]), (pick < 0.22)[:, None] * 0.8)
TC = mix(TC, mix(BROWN, DKBROWN, rng.random(nT)[:, None] * 0.6), (brown > 0.45)[:, None] * 1.0)
TC = mix(TC, FACE, (Z['face'] * (1 - np.maximum(Z['cheek'], Z['beard'])))[:, None] * 0.85)
ttree = cKDTree(TP)
HMAX = float(TH.max())
log('tufts', nT, 'longest', round(float(TL.max()), 3))

def tri(x): f = x - np.floor(x); return 1 - np.abs(2 * f - 1)        # 0 at strand centres... 1 at the partings

def coat(P, want_id=False):
    """height of the topmost tuft at each point (and which tuft, and how far along it)"""
    K = 12
    dist, idx = ttree.query(P, K, distance_upper_bound=0.5)
    idx = np.where(np.isfinite(dist), idx, 0)
    D = P[:, None, :] - TP[idx]
    s = np.einsum('nkj,nkj->nk', D, TT[idx]) / TL[idx]
    w = np.einsum('nkj,nkj->nk', D, TB[idx]) / (TW[idx] * 0.5)
    nrm = np.einsum('nkj,nkj->nk', D, TN[idx])
    ss = np.clip((s + 0.2) / 1.2, 0, 1)
    width = np.sin(np.pi * ss ** 0.62) ** 0.7
    nS = TS[idx]
    q = (w + 1) * 0.5 * nS
    if LV >= 2:
        tipend = 1 - 0.16 * tri(q + 0.5)          # each strand comes to its own point
    else:
        tipend = np.ones_like(s)
    e = np.abs(w) / np.maximum(width, 1e-3)
    ew = max(VOX * 1.4, 0.006)
    inside_s = np.clip((tipend - s) * TL[idx] / ew, 0, 1) * np.clip((s + 0.2) * TL[idx] / (ew * 4), 0, 1)
    inside_w = np.clip((1 - e) * TW[idx] * 0.5 / ew, 0, 1)
    dome = np.sqrt(np.clip(1 - e ** 2, 0, 1)) ** 0.6
    ramp = 0.2 + 0.8 * ss ** 1.3
    h = TH[idx] * ramp * dome * inside_s * inside_w
    if LV >= 2:
        h = h * (1 - 0.22 * tri(q + 0.5) ** 2 * sstep(0.1, 0.6, ss))            # grooves between strands
    if LV >= 3:
        h = h * (1 - 0.08 * tri(q * 3 + 0.5) ** 2 * sstep(0.2, 0.7, ss))         # fine strands
    h = np.where(np.abs(nrm) < 0.25, h, 0)
    h = np.where(np.isfinite(dist), h, 0)
    j = np.argmax(h, 1)
    top = h[np.arange(len(P)), j]
    if want_id:
        return top, idx[np.arange(len(P)), j], ss[np.arange(len(P)), j], q[np.arange(len(P)), j]
    return top

def full_sdf(P):
    d = body_sdf(P)
    band = np.abs(d) < HMAX + 0.04
    if band.any():
        d = d.copy(); d[band] -= coat(P[band])
    if LV >= 3:
        d = d - 0.0025 * (vnoise(P, 90.0) - 0.5)
    return d

# ---- 3. the body with its coat ------------------------------------------------------------------------------------
class Mesh:
    def __init__(s): s.V, s.F, s.C, s.K = [], [], [], []; s.n = 0
    def add(s, V, F, col, kind):
        V = np.asarray(V, np.float32); F = np.asarray(F, np.int64)
        col = np.broadcast_to(np.asarray(col, np.float32), (len(V), 3))
        s.V.append(V); s.F.append(F + s.n); s.C.append(col); s.K.append(np.full(len(V), kind, np.uint8)); s.n += len(V)
    def arrays(s):
        return (np.concatenate(s.V), np.concatenate(s.F).astype(np.int32), np.concatenate(s.C), np.concatenate(s.K))
M = Mesh()

log('body, voxel', VOX)
Vb, Fb = mc(full_sdf, VOX)
log('body tris', len(Fb))
top, tid, ts, tq = coat(Vb, True)
has = top > 0.002
col = np.tile(FACE, (len(Vb), 1)).astype(np.float64)
# a tuft: dark at its root, its own colour along it, lighter at the tip; the partings between strands darker
shade = (0.50 + 0.65 * ts ** 0.9)
if LV >= 2: shade = shade * (1 - 0.25 * tri(tq + 0.5) ** 3)
col[has] = TC[tid[has]] * shade[has, None] + (np.clip((ts[has] - 0.6) * 2.5, 0, 1) * 0.12)[:, None] * np.array([1, 1, 0.2])
crev = np.clip(1 - top / 0.012, 0, 1) * (zones(Vb)['face'] < 0.5)
col = col * (1 - 0.55 * crev[:, None])
fz = zones(Vb)['face'] * (~has)
col = mix(col, FACE * (0.85 + 0.3 * fbm(Vb, 40.0))[:, None], fz[:, None])
# the face's own colours: a dark wet nose, the dark of the grin, shadowed round the eyes
nose = np.clip(1.6 - np.linalg.norm((Vb - [0, 1.15, 1.0]) / [0.12, 0.085, 0.08], axis=1), 0, 1)[:, None]
col = mix(col, np.array([0.07, 0.06, 0.05]), np.clip(nose * 1.5, 0, 1))
xg = Vb[:, 0]; grin = np.exp(-((Vb[:, 2] - (0.885 + 0.4 * xg * xg)) / 0.02) ** 2) * (np.abs(xg) < 0.23) * (Vb[:, 1] > 0.85)
col = mix(col, np.array([0.12, 0.06, 0.04]), grin[:, None])
for e in EYES:
    ring_ = np.clip(1.4 - np.linalg.norm((Vb - e) / [0.09, 0.06, 0.06], axis=1), 0, 1)[:, None]
    col = col * (1 - 0.5 * ring_)
M.add(Vb, Fb, np.clip(col, 0, 1), 0)

def surf(p, out=0.0):
    Pp, Nn = project(np.array([p], np.float32), full_sdf)
    return Pp[0].astype(float) + Nn[0] * out, Nn[0].astype(float)

# ---- 4. building blocks for the parts ----------------------------------------------------------------------------
def frames(pts):
    t = np.gradient(pts, axis=0); t /= np.linalg.norm(t, axis=1, keepdims=True)
    n = np.cross(t[0], [0, 0, 1.0])
    if np.linalg.norm(n) < 1e-3: n = np.cross(t[0], [1.0, 0, 0])
    n /= np.linalg.norm(n); N = [n]
    for i in range(1, len(pts)):
        n = N[-1] - t[i] * (N[-1] @ t[i]); n /= np.linalg.norm(n); N.append(n)
    N = np.array(N); return t, N, np.cross(t, N)

def tube(pts, radii, sides=10, ridges=0, ridge_amp=0.0):
    pts = np.asarray(pts, np.float64); m = len(pts)
    t, N, B = frames(pts)
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    rr = 1 + (ridge_amp * np.cos(ridges * ang) if ridges else 0 * ang)
    V = np.concatenate([pts[i] + (np.cos(ang)[:, None] * N[i] + np.sin(ang)[:, None] * B[i]) * (radii[i] * rr)[:, None] for i in range(m)])
    i = np.arange(m - 1)[:, None]; j = np.arange(sides)[None]
    a = i * sides + j; b = i * sides + (j + 1) % sides; c = a + sides; d = b + sides
    F = np.concatenate([np.stack([a, b, d], -1).reshape(-1, 3), np.stack([a, d, c], -1).reshape(-1, 3)])
    V = np.vstack([V, pts[0], pts[-1]]); s0, s1 = len(V) - 2, len(V) - 1
    jj = np.arange(sides)
    caps = np.concatenate([np.stack([np.full(sides, s0), (jj + 1) % sides, jj], 1),
                           np.stack([np.full(sides, s1), (m - 1) * sides + jj, (m - 1) * sides + (jj + 1) % sides], 1)])
    return V, np.vstack([F, caps])

def horn(base, d, length, r0, bend=None, amt=0.3, seg=12, sides=12, ridges=0, tipR=0.0015, power=0.9):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = np.asarray(bend if bend is not None else [0, 0, -1], float)
    bend = bend - d * (bend @ d); bn = np.linalg.norm(bend); bend = bend / bn if bn > 1e-6 else bend
    u = np.linspace(0, 1, seg)
    pts = np.array([base + d * length * x + bend * length * amt * x * x for x in u])
    return tube(pts, r0 * (1 - u) ** power + tipR, sides, ridges=ridges, ridge_amp=0.07 if ridges and LV >= 2 else 0)

def thorn_col(V, base, length):
    t = np.clip(np.linalg.norm(V - base, axis=1) / length, 0, 1)[:, None]
    return np.clip(mix(mix(DKBROWN, GOLD, np.clip(t * 3.0, 0, 1)), PALEGOLD, np.clip((t - 0.55) * 1.4, 0, 1) * 0.8), 0, 1)

def add_thorn(base, d, length, r0, bend, amt=0.35, seg=None, sides=None, sink=0.04, ridges=0, power=0.9):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    b = np.asarray(base, float) - d * sink
    V, F = horn(b, d, length + sink, r0, bend, amt, seg or SEG, sides or SIDES + 2, ridges=ridges, power=power)
    M.add(V, F, thorn_col(V, b, length + sink), 2)

# ---- 5. thorns: the ridge down his back, the row between, the flank rows ------------------------------------------
log('thorns')
ridge_y = np.linspace(0.62, -1.00, 12)
ridge_h = np.interp(ridge_y, [-1.0, -0.8, -0.4, 0.0, 0.3, 0.62], [0.16, 0.24, 0.32, 0.35, 0.30, 0.2])
for yv, hh in zip(ridge_y, ridge_h):
    p, nrm = surf([0, yv, 1.8])
    add_thorn(p, nrm * 0.3 + np.array([0, 0.05, 1.0]), hh, hh * 0.32, [0, -1, 0], 0.65, sink=0.06, ridges=5, power=1.15)
for yv in np.linspace(0.42, -0.92, 8):
    p, nrm = surf([0.0, yv + 0.06, 1.8])
    add_thorn(p, nrm + [0, -0.5, 0], 0.08, 0.028, [0, -1, 0], 0.45, seg=max(5, SEG - 4), sides=SIDES)
def drop(xy, z0=1.75):
    # come down from above until we meet him
    P_ = np.column_stack([xy, np.full(len(xy), z0)]).astype(np.float32)
    for _ in range(60):
        d_ = full_sdf(P_); P_[:, 2] -= np.maximum(d_, 0.002) * 0.9
    return P_
# the upper flank rows: up and out from either side of the ridge (the crown of horns round him, front and back views)
for s in (1, -1):
    for yv, hh in [(0.42, 0.2), (0.15, 0.26), (-0.15, 0.28), (-0.45, 0.27), (-0.75, 0.22)]:
        p = drop(np.array([[s * 0.30, yv]]))[0].astype(float); nrm = grad(full_sdf, p[None].astype(np.float32))[0]
        add_thorn(p, np.array([s * 0.55, -0.1, 1.0]), hh, hh * 0.3, [s * -0.3, -0.5, 0.2], 0.45, sink=0.05, power=1.1)
for s in (1, -1):
    for yv, zv, hh, up in [(0.30, 1.30, 0.2, 1.0), (-0.42, 1.32, 0.21, 1.0),
                           (0.45, 1.10, 0.18, 0.55), (0.08, 1.16, 0.19, 0.55), (-0.25, 1.16, 0.2, 0.55), (-0.62, 1.08, 0.19, 0.55),
                           (0.55, 0.90, 0.15, 0.3), (0.18, 0.95, 0.15, 0.3), (-0.45, 0.92, 0.16, 0.3), (-0.92, 0.88, 0.15, 0.35),
                           (0.62, 0.70, 0.12, 0.15), (-0.75, 0.66, 0.12, 0.15)]:
        p, nrm = surf([s * 0.95, yv, zv])
        side = np.array([s * 1.0, -0.15, up])
        add_thorn(p, nrm * 0.5 + side, hh, hh * 0.3, [0, -0.3, 1.0], 0.45, sink=0.05, power=1.1)

# ---- 6. the crown of thorns: a wreath of twisted bramble round his brow and crown ---------------------------------
log('crown')
CROWN_C = np.array([0, 0.70, 1.22]); CRX, CRY = 0.31, 0.27
na = 240; aa = np.linspace(0, 2 * np.pi, na, endpoint=False)
# a level wreath round the brow (front 1.21 up, back 1.30 where it sinks into his shoulder hump, as the sheet shows)
ringP = np.stack([CRX * np.sin(aa), CROWN_C[1] + CRY * np.cos(aa), 1.255 - 0.045 * np.cos(aa)], 1).astype(np.float32)
# sit it on his skin where it would float: come down until it touches
fl = full_sdf(ringP) > 0.0
if fl.any(): ringP[fl] = drop(ringP[fl, :2], 1.6)
ringN = grad(full_sdf, ringP)
log("crown ring z", ringP[:, 2].min(), ringP[:, 2].max(), "y", ringP[:, 1].min(), ringP[:, 1].max())
ringP = ringP + ringN * 0.02
for _ in range(8): ringP = (np.roll(ringP, 1, 0) + 2 * ringP + np.roll(ringP, -1, 0)) / 4
ring = np.vstack([ringP, ringP[:1]])
t_, N_, B_ = frames(ring)
for k in range(3):
    ang = np.linspace(0, 2 * np.pi * 9, len(ring)) + k * 2 * np.pi / 3
    off = (np.cos(ang)[:, None] * N_ + np.sin(ang)[:, None] * B_) * 0.026
    V, F = tube(ring + off, np.full(len(ring), 0.027), SIDES)
    M.add(V, F, np.clip(mix(VINE, DKBROWN, 0.25 * k), 0, 1), 3)
crng = np.random.default_rng(5)
for i in range(16):
    j = int(i * na / 16 + crng.integers(-3, 4)) % na
    front = math.cos(aa[j])
    big = 0.12 + 0.07 * (abs(front) < 0.6) + 0.03 * crng.random()
    add_thorn(ringP[j], ringN[j] * 0.6 + [0, 0, 1.0], big, big * 0.26, ringN[j] * -0.3 + [0, -0.4, 0], 0.3, sink=0.02)
for i in range(28):
    j = crng.integers(na); a2 = crng.random() * 2 * np.pi
    d = np.cos(a2) * N_[j] + np.sin(a2) * B_[j]
    add_thorn(ringP[j] + d * 0.035, d + [0, 0, 0.4], 0.05 + 0.03 * crng.random(), 0.013, t_[j], 0.2,
              seg=max(4, SEG - 6), sides=max(5, SIDES - 2), sink=0.01)

# ---- 7. bramble vines: twisted pairs wound round legs and body, thorned ------------------------------------------
log('vines')
vrng = np.random.default_rng(9)
def vine(path, r=0.04, strands=2, thorns=14, thorn_len=0.07):
    path = np.asarray(path, float)
    L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]
    s = np.linspace(0, L_[-1], max(24, int(L_[-1] / {1: 0.03, 2: 0.015, 3: 0.009}[LV])))
    P = np.stack([np.interp(s, L_, path[:, i]) for i in range(3)], 1)
    t, N, B = frames(P)
    for k in range(strands):
        a = s / 0.055 + k * 2 * np.pi / strands
        off = (np.cos(a)[:, None] * N + np.sin(a)[:, None] * B) * r * 0.62
        V, F = tube(P + off, np.full(len(P), r * 0.66), SIDES)
        M.add(V, F, np.clip(mix(VINE, DKBROWN, 0.3 * k) * (0.9 + 0.2 * vrng.random()), 0, 1), 3)
    for j in vrng.choice(len(P), thorns, replace=False):
        a = vrng.random() * 2 * np.pi
        dirn = np.cos(a) * N[j] + np.sin(a) * B[j]
        if dirn @ (P[j] - [0, 0, 0.8]) < -0.1: dirn = -dirn
        add_thorn(P[j] + dirn * r * 1.1, dirn + t[j] * 0.3, thorn_len * (0.7 + 0.6 * vrng.random()), 0.017, t[j], 0.25,
                  seg=max(4, SEG - 5), sides=max(5, SIDES - 1), sink=0.015)

def resample(pts, n=90):
    pts = np.asarray(pts, float)
    L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    ss = np.linspace(0, L_[-1], n)
    return np.stack([np.interp(ss, L_, pts[:, i]) for i in range(3)], 1)
def lay(pts, r):
    Pp, Nn = project(np.asarray(pts, np.float32), full_sdf)
    Pp = Pp + Nn * (r * 0.9)
    for _ in range(3): Pp[1:-1] = (Pp[:-2] + 2 * Pp[1:-1] + Pp[2:]) / 4
    return Pp
def leg_point(k, t):
    a, b, c = [np.array(p, float) for p in LEGS[k]]
    return a + (b - a) * (t * 2) if t < 0.5 else b + (c - b) * ((t - 0.5) * 2)

for k in LEGS:
    sx = 1 if LEGS[k][0][0] > 0 else -1
    a, b, c = [np.array(p, float) for p in LEGS[k]]
    z0, z1, turns = (0.44, 0.26, 1.15) if k[0] == 'f' else (0.50, 0.30, 1.1)
    pts = []
    for u in np.linspace(0, 1, 120):
        zz = z0 + (z1 - z0) * u
        tt = 0.5 + 0.5 * (b[2] - zz) / (b[2] - c[2]) if zz < b[2] else 0.5 * (a[2] - zz) / (a[2] - b[2])
        ang = u * turns * 2 * np.pi + (0 if sx > 0 else np.pi)
        pts.append(leg_point(k, float(np.clip(tt, 0, 1))) + [math.cos(ang) * 0.3, math.sin(ang) * 0.3, 0])
    vine(lay(pts, 0.04), r=0.042, thorns=14)
for s in (1, -1):
    for path in [
        [(s * 0.2, 0.62, 1.24), (s * 0.5, 0.45, 1.06), (s * 0.66, 0.35, 0.78), (s * 0.55, 0.30, 0.55), (s * 0.3, 0.32, 0.42)],
        [(s * 0.25, -0.45, 1.27), (s * 0.55, -0.55, 1.03), (s * 0.62, -0.72, 0.80), (s * 0.55, -0.92, 0.62), (s * 0.3, -1.05, 0.62)],
    ]:
        vine(lay(resample(path), 0.04), r=0.042, thorns=16)
vine(lay(resample([(0.45, 0.75, 0.62), (0.2, 0.94, 0.68), (-0.05, 0.97, 0.66), (-0.3, 0.9, 0.62), (-0.48, 0.72, 0.6)]), 0.036), r=0.036, thorns=12)

# ---- 8. tusks, teeth, claws, nose, eyes ----------------------------------------------------------------------
log('tusks, teeth, claws, eyes')
for s in (1, -1):
    # the tusks: out of the sides of the lower jaw, down, bowing forward, the tip back again (side view), a little out
    base = np.array([s * 0.17, 1.02, 0.86])
    u = np.linspace(0, 1, {1: 14, 2: 24, 3: 36}[LV])
    pts = np.array([base + [s * (0.04 * x + 0.03 * x * x), 0.30 * x - 0.34 * x * x, -0.56 * x] for x in u])
    pts = np.vstack([base + [0, -0.03, 0.06], pts])
    radii = np.r_[0.06, 0.07 * (1 - u) ** 0.75 + 0.004]
    if LV >= 2: radii[1:] = radii[1:] * (1 - 0.025 * (np.sin(u * 46) > 0.6))
    V, F = tube(pts, radii, SIDES + 6)
    tt_ = np.clip((base[2] - V[:, 2]) / 0.56, 0, 1)[:, None]
    M.add(V, F, np.clip(mix(np.array([0.70, 0.62, 0.48]), BONE, np.clip(tt_ * 3, 0, 1)) * (0.94 + 0.06 * tt_), 0, 1), 5)
    # the collar of gum round its root (front view: a brown ring)
    ring = np.array([base + [0, 0, -0.01] + 0.0 * x for x in range(1)])
    a_ = np.linspace(0, 2 * np.pi, 25)
    tdir = pts[3] - pts[1]; tdir /= np.linalg.norm(tdir)
    e1 = np.cross(tdir, [1, 0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(tdir, e1)
    cpts = base + 0.005 * tdir + 0.074 * (np.cos(a_)[:, None] * e1 + np.sin(a_)[:, None] * e2)
    V, F = tube(cpts, np.full(len(cpts), 0.022), SIDES)
    M.add(V, F, np.array([0.36, 0.22, 0.12]), 4)
# teeth: fangs along the grin, upper ones hanging down, a few lower ones up (sheet: gold-tinted)
for i, x0 in enumerate(np.linspace(-0.15, 0.15, 9)):
    y0 = 1.07 - 2.6 * x0 * x0 + 0.012; z0 = 0.885 + 0.4 * x0 * x0
    L_ = 0.07 if i in (1, 7) else (0.045 + 0.015 * (i % 2))
    V, F = horn(np.array([x0, y0, z0 + 0.03]), [0, 0.12, -1], L_ + 0.03, 0.014 + 0.004 * (L_ > 0.04), [0, 1, 0], 0.1, max(4, SEG - 4), max(5, SIDES - 1))
    M.add(V, F, mix(BONE, PALEGOLD, 0.35), 5)
    if i % 2 == 0:
        V, F = horn(np.array([x0, y0 - 0.012, z0 - 0.03]), [0, 0.1, 1], 0.06, 0.014, [0, 1, 0], 0.1, max(4, SEG - 4), max(5, SIDES - 1))
        M.add(V, F, mix(BONE, PALEGOLD, 0.35) * 0.95, 5)
for k, (a, b, c) in LEGS.items():
    sx = 1 if a[0] > 0 else -1
    n_ = 5 if k[0] == 'f' else 4
    for i in range(n_):
        ang = (i - (n_ - 1) / 2) * 0.42
        p = np.array([c[0] + sx * 0.02 + math.sin(ang) * 0.21, c[1] + 0.06 + math.cos(ang) * 0.24, 0.075])
        V, F = horn(p, [math.sin(ang) * 0.7, math.cos(ang), 0.2], 0.13, 0.04, [0, 0, -1], 0.7, SEG, SIDES + 2)
        M.add(V, F, mix(CLAW, CLAW * 1.8, np.clip((V[:, 2] - 0.02) * -8 + 0.5, 0, 1)[:, None]), 6)
for e in EYES:
    nt, npp = {1: 8, 2: 12, 3: 16}[LV], {1: 14, 2: 20, 3: 28}[LV]
    th, ph = np.meshgrid(np.linspace(0, np.pi, nt), np.linspace(0, 2 * np.pi, npp, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp
            F += [(a, a + npp, b + npp), (a, b + npp, b)]
    off = sp * [0.064, 0.032, 0.028]
    ang = 0.32 * (1 if e[0] > 0 else -1)           # angry: the inner corner lower
    c_, s_ = math.cos(ang), math.sin(ang)
    off = off @ np.array([[c_, 0, -s_], [0, 1, 0], [s_, 0, c_]]).T
    M.add(e + off, np.array(F), EYE, 7)

V, F, C, K = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K)
np.savez_compressed(os.path.join(OUT, 'tufts.npz'), P=TP, N=TN, T=TT, L=TL, W=TW, H=TH)
log('saved')
