# The wisp-queen's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. A floating
# spirit: a hidden core (body, arms, head as pieces of their own, as on the walkers) under some hundred and fifty locks
# of cold flame, each lock riding one bone (so the wisps sway with her and never stretch).
#
# Chris's sheet (art-in/3d/sheets/sheet-wisp-queen.webp): the queen of the mirage-wisps of the Glass Flats. A tall
# shape of pale teal wisps, every lock curling at its tip, falling from her shoulders to trail away to nothing under
# her (she floats); a flame rising from her head, curling; a white mask of a face with dark almond eyes; a silver
# tiara of scrolls with a blue diamond at its brow; arms of wisps ending in curled claws; on her breast the Mirage Glass,
# a great oval jewel, pale blue and faceted, in a scrolled silver frame.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.85 m to the tip of her flame (the mask 1.35 m, the tiara 1.47 m, the glass 0.98 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.008, 2: 0.005, 3: 0.0036}[LV]
SEG = {1: 16, 2: 24, 3: 36}[LV]; SIDES = {1: 6, 2: 8, 3: 12}[LV]

TEAL = np.array([0.30, 0.70, 0.68]); PALE = np.array([0.66, 0.92, 0.87]); DEEP = np.array([0.10, 0.38, 0.42])
MASK = np.array([0.90, 0.94, 0.96]); MASK_D = np.array([0.66, 0.76, 0.82]); EYE = np.array([0.06, 0.16, 0.28])
SILVER = np.array([0.78, 0.82, 0.86]); SILVER_D = np.array([0.45, 0.50, 0.56]); GEM = np.array([0.55, 0.85, 1.0])
MAT = {'wisp': (0.45, 0.0), 'mask': (0.35, 0.0), 'silver': (0.25, 0.95), 'glow': (0.1, 0.0)}

PZ = np.array([0.22, 0.32, 0.50, 0.80, 1.00, 1.14, 1.24, 1.32])                  # the core's girth up its height
PX = np.array([0.08, 0.18, 0.22, 0.19, 0.21, 0.24, 0.11, 0.09])
PY = np.array([0.06, 0.14, 0.17, 0.14, 0.15, 0.15, 0.10, 0.08])
def rx(z): return np.interp(z, PZ, PX)
def ry(z): return np.interp(z, PZ, PY)
LZ = np.array([0.0, 0.25, 0.50, 0.80, 1.00, 1.14, 1.24])                          # where her locks lie: below the core they
LX = np.array([0.24, 0.23, 0.22, 0.19, 0.21, 0.24, 0.11])                         # hang free, round where it ends
LY = np.array([0.19, 0.18, 0.17, 0.14, 0.15, 0.15, 0.10])
def lx(z): return np.interp(z, LZ, LX)
def ly(z): return np.interp(z, LZ, LY)
HEAD = np.array([0.0, 0.0, 1.38])
SH = {s: np.array([s * 0.18, 0.0, 1.15]) for s in (1, -1)}
ELB = {s: np.array([s * 0.28, 0.02, 0.95]) for s in (1, -1)}
WRI = {s: np.array([s * 0.35, 0.05, 0.80]) for s in (1, -1)}

def flow(P, k=1.0):
    a = np.arctan2(P[:, 1], P[:, 0])
    return np.sin(a * 5 + 2.0 * np.sin(P[:, 2] * 8 * k + a) + 4.0 * fbm(P, 2.5)) * 0.5 + 0.5
def core(P):
    z = P[:, 2]
    X, Y = rx(z), ry(z)
    d = (np.sqrt((P[:, 0] / X) ** 2 + (P[:, 1] / Y) ** 2) - 1) * np.minimum(X, Y) * 0.9
    return np.maximum(np.maximum(d, 0.22 - z), z - 1.32) - 0.01 * flow(P)
def arms(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, SH[s], ELB[s], 0.06, 0.05), cap(P, ELB[s], WRI[s], 0.05, 0.045), 0.03)
        e = smin(e, ell(P, WRI[s] + [s * 0.01, 0.01, -0.03], (0.04, 0.035, 0.05)), 0.03)
        d = e if d is None else np.minimum(d, e)
    return d - 0.006 * flow(P, 1.4)
def flame(P):
    d = ell(P, HEAD + [0, -0.01, 0.0], (0.12, 0.115, 0.13))
    u = np.linspace(0, 1, 10)
    pts = HEAD + np.stack([0.02 * np.sin(u * 4), -0.02 - 0.05 * u ** 2 + 0.06 * u ** 7, 0.07 + 0.40 * u], 1)
    rr = 0.10 * (1 - u) ** 1.2 + 0.006
    for i in range(9):
        d = smin(d, cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1]), 0.04)
    for s in (1, -1):                                                                     # licks of flame at its sides
        for zc, L in ((0.15, 0.07), (0.27, 0.05)):
            b = HEAD + [s * 0.06, -0.01, zc]
            d = smin(d, chain_(P, [b, b + [s * 0.04, 0, 0.04], b + [s * 0.05, -0.01, 0.04 + L], b + [s * 0.03, -0.01, 0.06 + L]], 0.03, 0.004), 0.02)
    d = np.maximum(d, -ell(P, HEAD + [0, 0.12, -0.03], (0.09, 0.05, 0.085)))             # a hollow for the mask
    return d - 0.007 * flow(P, 0.9)
def chain_(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, np.asarray(pts[i], float), np.asarray(pts[i + 1], float), rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.006)
    return d
def mask(P):
    c = HEAD + [0, 0.085, -0.03]
    d = ell(P, c, (0.085, 0.065, 0.085))
    d = smin(d, ell(P, c + [0, 0.012, -0.075], (0.025, 0.04, 0.03)), 0.035)              # a pointed chin
    for s in (1, -1):                                                                     # almond eyes, slanting up and out
        q = P - (c + [s * 0.038, 0.07, 0.008])
        ca, sa = math.cos(s * 0.45), math.sin(s * 0.45)
        u_ = q[:, 0] * ca + q[:, 2] * sa; v_ = -q[:, 0] * sa + q[:, 2] * ca
        r_ = np.sqrt((u_ / 0.03) ** 2 + (v_ / 0.016) ** 2) - 1
        d = np.maximum(d, -np.maximum(r_ * 0.016, np.abs(q[:, 1]) - 0.012))
    return d
def headpiece(P): return np.minimum(flame(P), mask(P))

# ---- the meshes ------------------------------------------------------------------------------------------------------------
M = Mesh()
log('core, voxel', VOX)
BP = Parts(); BP.add('core', core, 'wisp')
AP = Parts(); AP.add('arms', arms, 'wisp')
HP = Parts(); HP.add('flame', flame, 'wisp'); HP.add('mask', mask, 'mask', k=0.0)
GROUPS = [(core, 0, (-0.30, -0.24, 0.0), (0.30, 0.24, 1.36), BP),
          (arms, 12, (-0.45, -0.10, 0.70), (0.45, 0.14, 1.24), AP),
          (headpiece, 14, (-0.20, -0.18, 1.20), (0.20, 0.22, 1.90), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)])
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
fl = flow(Vb, 1.1); n1 = fbm(Vb, 6.0); n2 = fbm(Vb + 3, 20.0)
cw = mix(DEEP, TEAL, np.clip(n1 * 1.3, 0, 1)[:, None]); cw = mix(cw, PALE, (sstep(0.75, 0.95, fl) * 0.7)[:, None])
w = look == 'wisp'; col[w] = cw[w]; mat[w] = MAT['wisp']
c0 = HEAD + [0, 0.085, -0.03]
cm = mix(MASK_D, MASK, (np.clip((Vb[:, 1] - c0[1]) / 0.07, 0, 1) * 0.7 + 0.3 * n2)[:, None])
for s in (1, -1):
    q = Vb - (c0 + [s * 0.038, 0.07, 0.008])
    ca, sa = math.cos(s * 0.45), math.sin(s * 0.45)
    u_ = q[:, 0] * ca + q[:, 2] * sa; v_ = -q[:, 0] * sa + q[:, 2] * ca
    cm[np.sqrt((u_ / 0.03) ** 2 + (v_ / 0.016) ** 2) < 1.1] = EYE
m_ = look == 'mask'; col[m_] = cm[m_]; mat[m_] = MAT['mask']
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 core, 12 arms, 14 head (flame, mask)
M.K[-1][(KB == 0) & (Vb[:, 2] < 0.85)] = 15

rng = np.random.default_rng(17)
def lock(p0, a0, L, w, kind, out=1.0, side=1.0, prof=True, down=np.array([0, 0, -1.0]), oc=None):
    """a lock of cold flame: it hangs from p0 along the core (prof) or straight (down), flaring out, its tip curling"""
    u = np.linspace(0, 1, SEG)
    if prof:
        z = p0[2] - L * u
        z = np.maximum(z, 0.0)
        a = a0 + side * 0.18 * u + 0.05 * np.sin(u * 5 + a0 * 3)
        k = 1.0 + 0.04 + out * (0.32 * u ** 2.2) + w * 0.5 / np.maximum(np.minimum(lx(z), ly(z)), 0.05) * 0.7
        k += sstep(0.30, 0.0, z) * 0.25 * u                                              # spreading where she trails away
        pts = np.stack([np.cos(a) * lx(z) * k, np.sin(a) * ly(z) * k, z], 1)
    else:
        pts = p0 + np.outer(u * L, down) + np.outer(np.sin(u * math.pi) * 0.02, [math.cos(a0), math.sin(a0), 0])
    # the tip curls: sideways and up a little, around the lock's own tangent
    t_ = np.array([math.cos(a0 + math.pi / 2), math.sin(a0 + math.pi / 2), 0]) * side
    cu = sstep(0.65, 1.0, u)
    pts = pts + np.outer(cu ** 1.5 * 0.05 * L / 0.4, t_) + np.outer(cu ** 2 * 0.035 * L / 0.4, [0, 0, 1])
    r = w * (1 - u) ** 0.8 * (0.6 + 0.4 * np.sin(np.minimum(u * 6, math.pi / 2))) + 0.0015
    V, F = tube(pts, r, SIDES)
    # a ribbon, not a rope: thin across (away from her) and wide along her
    cen = np.vstack([np.repeat(pts, SIDES, axis=0), pts[:1], pts[-1:]])
    o = cen - (oc if oc is not None else np.zeros(3)); o[:, 2] = 0
    o /= np.linalg.norm(o, axis=1, keepdims=True) + 1e-9
    off = V - cen
    along = (off * o).sum(1, keepdims=True)
    V = cen + (off - along * o) * 1.7 + along * o * 0.4
    t = np.r_[np.repeat(u, SIDES), 0.0, 1.0]
    nn = fbm(V * 3 + rng.random() * 10, 4.0)
    c = mix(DEEP, TEAL, np.clip(t * 3.0 + nn - 0.4, 0, 1)[:, None])
    c = mix(c, PALE, (np.clip(np.sin(t * math.pi) * 1.2 - 0.6, 0, 1) * (0.4 + 0.6 * nn))[:, None])
    c = mix(c, DEEP, (sstep(0.85, 1.0, t) * 0.5)[:, None])
    M.add(V, F, np.clip(c, 0, 1), kind, MAT['wisp'])
log('locks')
# ---- the locks of her body: rings of them falling from her shoulders, the lowest trailing away under her -----------------
for z0, n, L, w in ((1.18, 14, 0.40, 0.040), (1.02, 15, 0.45, 0.042), (0.86, 16, 0.48, 0.044), (0.70, 16, 0.50, 0.042),
                    (0.54, 18, 0.52, 0.040), (0.38, 18, 0.40, 0.036), (0.26, 18, 0.27, 0.032)):
    for i in range(n):
        a = 2 * math.pi * (i + 0.5 * (n % 2) + rng.random() * 0.5) / n
        if z0 > 0.95 and abs(math.sin(a)) > 0.7 and math.sin(a) > 0 and abs(math.cos(a)) < 0.45:
            continue                                                                       # leave her breast bare for the glass
        lock(np.array([0, 0, z0]), a, L * (0.85 + 0.3 * rng.random()), w * (0.85 + 0.3 * rng.random()),
             4 if z0 >= 0.86 else 15, side=1 if rng.random() < 0.5 else -1, out=0.35 if z0 > 1.1 else 1.0)
# ---- the locks of her head: about her mask, at the sides and back, falling onto her shoulders --------------------------
for i in range(18):
    a = math.pi * 0.80 + math.pi * 1.40 * i / 17                                          # all round but the front
    p0 = HEAD + [math.cos(a) * 0.11, math.sin(a) * 0.10, 0.06]
    d = np.array([math.cos(a) * 0.35, math.sin(a) * 0.35, -1.0]); d /= np.linalg.norm(d)
    lock(p0, a, 0.30 + 0.10 * rng.random(), 0.034, 14, prof=False, down=d, side=1 if i % 2 else -1, oc=HEAD)
# ---- the locks of her arms, and her claws ----------------------------------------------------------------------------------
for s in (1, -1):
    for i in range(15):
        t = i / 14
        p0 = (SH[s] + (ELB[s] - SH[s]) * min(t * 2, 1)) if t < 0.5 else (ELB[s] + (WRI[s] - ELB[s]) * (t - 0.5) * 2)
        a = math.atan2(0.0, s) + (rng.random() - 0.5) * 0.8
        d = np.array([s * (0.25 + 0.2 * t), (rng.random() - 0.5) * 0.4, -1.0]); d /= np.linalg.norm(d)
        lock(p0 + [0, (rng.random() - 0.5) * 0.08, 0], a, 0.18 + 0.16 * t, 0.032, 12, prof=False, down=d, side=s, oc=p0 - [s * 0.1, 0, 0])
    for i in range(4):                                                                     # curled claws
        b = WRI[s] + [s * 0.02, 0.03 - 0.02 * i, -0.06]
        uu = np.linspace(0, 1, SEG // 2)
        ang = uu * math.pi * 0.9
        pts = b + np.stack([s * (0.02 + 0.05 * np.sin(ang)), np.zeros_like(uu) - 0.005 * i, -0.10 * np.sin(ang * 0.8) - 0.02 * uu], 1)
        V, F = tube(pts, 0.014 * (1 - uu) + 0.0015, SIDES)
        M.add(V, F, np.clip(mix(TEAL, PALE, 0.4), 0, 1), 12, MAT['wisp'])
log('tiara, glass')
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 4 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
# ---- the tiara: a silver band, scrolls rising from it, a blue diamond at her brow (it rides her head) --------------------
th = np.linspace(0, 2 * math.pi, 48)
ring = np.column_stack([np.cos(th) * 0.13, np.sin(th) * 0.125, 1.47 + 0.03 * np.maximum(np.sin(th), 0) ** 2])
V, F = tube(np.vstack([ring, ring[:1]]), np.full(49, 0.014), SIDES)
M.add(V, F, SILVER, 14, MAT['silver'])
for s in (1, -1):
    for a0, h in ((0.28, 0.10), (0.80, 0.075), (1.30, 0.05)):                             # scrolls curling outward, both sides
        a = math.pi / 2 - s * a0
        b = np.array([math.cos(a) * 0.13, math.sin(a) * 0.125, 1.47 + 0.03 * max(math.sin(a), 0) ** 2])
        o = np.array([math.cos(a), math.sin(a), 0])
        uu = np.linspace(0, 1, 14); ang = uu * math.pi * 1.6
        tt = np.array([-math.sin(a), math.cos(a), 0]) * s
        pts = b + np.outer(0.03 * np.sin(ang) * h / 0.07, tt) + np.outer(h * (1 - np.cos(ang * 0.6)) * 0.8, [0, 0, 1]) + np.outer(0.01 * uu, o)
        V, F = tube(pts, 0.011 * (1 - uu * 0.6), SIDES)
        M.add(V, F, SILVER, 14, MAT['silver'])
gc = np.array([0, 0.128, 1.53])
V, F = tube(np.array([gc + [0, 0, 0.045], gc + [0, 0.008, 0.0], gc + [0, 0, -0.04]]), np.array([0.001, 0.024, 0.001]), 4)
M.add(V, F, GEM, 14, MAT['silver'])
V, F = tube(np.array([gc + [0, -0.006, -0.06], gc + [0, -0.004, 0.0], gc + [0, -0.006, 0.07]]), np.array([0.004, 0.03, 0.002]), 6)
M.add(V, F, SILVER, 14, MAT['silver'])                                                     # its silver setting, pointed
# ---- the Mirage Glass on her breast: a faceted oval jewel (it glows) in a scrolled silver frame (they ride her chest) -----
C0 = np.array([0.0, 0.175, 0.98])
th = np.linspace(0, 2 * math.pi, 40)
for rr, w in ((1.0, 0.013), (0.82, 0.007)):
    ring = C0 + np.column_stack([np.sin(th) * 0.095 * rr, np.zeros_like(th) + 0.004 * (1 - rr), np.cos(th) * 0.135 * rr])
    V, F = tube(ring, np.full(40, w), SIDES)
    M.add(V, F, SILVER, 4, MAT['silver'])
V, F = ball(C0 + [0, 0.002, 0], np.array([0.075, 0.03, 0.11]), 10)
M.add(V, F, GEM, 9, MAT['glow'])
for sz in (1, -1):                                                                         # a spike above and below
    V, F = tube(np.array([C0 + [0, 0, sz * 0.13], C0 + [0, 0.005, sz * 0.19]]), np.array([0.016, 0.001]), 4)
    M.add(V, F, SILVER, 4, MAT['silver'])
for s in (1, -1):                                                                          # scrolls at its four corners
    for sz in (1, -1):
        b = C0 + [s * 0.07, 0, sz * 0.10]
        uu = np.linspace(0, 1, 14); ang = uu * math.pi * 1.5
        pts = b + np.stack([s * (0.02 + 0.02 * np.sin(ang)), 0.004 * uu, sz * (0.02 * (1 - np.cos(ang)))], 1)
        V, F = tube(pts, 0.007 * (1 - uu * 0.5), SIDES)
        M.add(V, F, SILVER, 4, MAT['silver'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
