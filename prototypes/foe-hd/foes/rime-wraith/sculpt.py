# The rime-wraith's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned abbess's and the choir-wraith's (foes/drowned-abbess, foes/choir-wraith): arms and head as pieces.
#
# Chris's sheet (art-in/3d/sheets/sheet-rime-wraith.webp): a drowned monk of Frostmere, still wet under the frost: a
# hood furred with frost in feathered patterns, icicles hanging from its edge; in it a pale blue face, eyes shut, mouth
# open, water running from it; a short cape torn into points, frosted and hung with icicles; a dark robe, an embroidered
# stole hanging in two panels from a rope belt knotted at the front, its ends hanging; wide sleeves; its left hand reaching
# out, blue, dripping; and no feet: the robe frays into dark water at the hem, curling in glowing waves, drops rising.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.85 m to the top of its hood (its face 1.60 m, the belt 0.92 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.009, 2: 0.0056, 3: 0.0046}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

ROBE = np.array([0.15, 0.20, 0.21]); ROBE_D = np.array([0.05, 0.07, 0.09]); CAPE = np.array([0.24, 0.31, 0.31])
FROST = np.array([0.80, 0.86, 0.90]); ICE = np.array([0.62, 0.80, 0.90]); STOLE = np.array([0.36, 0.40, 0.38])
STOLE_D = np.array([0.18, 0.21, 0.21]); ROPE = np.array([0.62, 0.55, 0.40]); SKIN = np.array([0.48, 0.58, 0.68])
SKIN_D = np.array([0.26, 0.33, 0.43]); HAIR = np.array([0.12, 0.10, 0.10]); WATER = np.array([0.35, 0.75, 0.95])
MAT = {'cloth': (0.85, 0.0), 'frost': (0.5, 0.0), 'ice': (0.1, 0.0), 'rope': (0.9, 0.0), 'skin': (0.45, 0.0),
       'glow': (0.2, 0.0)}

HIP = np.array([0, 0.0, 0.90]); CH = np.array([0, 0.01, 1.22]); SHC = np.array([0, 0.0, 1.38])
NECK0 = np.array([0, 0.0, 1.40]); NECK1 = np.array([0, 0.03, 1.50]); HEAD = np.array([0, 0.05, 1.60])
SH = {s: np.array([s * 0.17, 0.0, 1.38]) for s in (1, -1)}
ELB = {1: np.array([0.22, 0.0, 1.07]), -1: np.array([-0.24, 0.10, 1.12])}
WRI = {1: np.array([0.23, 0.05, 0.83]), -1: np.array([-0.34, 0.30, 0.98])}        # its left arm reaching out
HAND = {1: np.array([0.23, 0.06, 0.75]), -1: np.array([-0.37, 0.36, 0.95])}

def body(P):
    d = ell(P, CH, (0.17, 0.12, 0.20))
    d = smin(d, ell(P, (0, 0.01, 1.03), (0.15, 0.11, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.16, 0.11, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.22, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.055, 0.05), 0.03)
    return d
# ---- 1. the robe (fraying into water), the stole, the rope belt, the cape -------------------------------------------
def robe_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.05 - z) / 1.0, 0, 1) ** 0.9
    sk = np.sqrt((x / (0.18 + 0.20 * k)) ** 2 + (y / (0.14 + 0.16 * k)) ** 2) - 1
    d = smin(body(P) - 0.03, np.maximum(sk * 0.15, z - 1.10), 0.08)
    return d - 0.014 * (np.sin(np.arctan2(y, x) * 10 + 1.5 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(1.0, 0.4, z)
def robe(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(robe_outer(P)) - 0.008
    ang = np.arctan2(y, x); kk = np.floor(ang / (2 * np.pi) * 26)
    tongue = np.abs(((ang / (2 * np.pi) * 26) % 1.0) - 0.5) * 2
    hem = 0.04 + (0.05 + 0.12 * ((np.sin(kk * 57.3) * 4375.85) % 1.0)) * tongue ** 1.2 + 0.05 * (fbm(P * [1, 1, 0.3], 7.0) - 0.4)
    d = np.maximum(d, hem - z)
    return np.maximum(d, z - 1.30)
def stole(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = None
    for s in (1, -1):
        e = np.maximum(np.abs(x - s * 0.085) - 0.042, np.abs(robe_outer(P) + 0.0) - 0.012)
        e = np.maximum(e, np.maximum(0.30 - z + 0.04 * np.abs(x - s * 0.085) / 0.042, z - 0.92))   # to a point at the foot
        e = e + np.where(y > 0, 0, 1)
        d = e if d is None else np.minimum(d, e)
    return d
BELT_Z = 0.92
def rope(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    a = np.arctan2(y, x)
    rx, ry = 0.215, 0.165
    r = np.sqrt((x / rx) ** 2 + (y / ry) ** 2)
    zz = z - BELT_Z - 0.008 * np.sin(a * 3)
    d = np.sqrt(((r - 1) * 0.15) ** 2 + zz ** 2) - 0.02
    d = d - 0.006 * (np.sin(a * 60 + zz * 200) * 0.5 + 0.5)                       # its twist
    knot = sph(P, np.array([-0.05, 0.18, BELT_Z - 0.005]), 0.035)
    d = smin(d, knot, 0.015)
    for s, L in ((0, 0.30), (1, 0.24)):                                           # its two ends hanging from the knot
        b = np.array([-0.05 - 0.025 * s, 0.195, BELT_Z - 0.03])
        e = cap(P, b, b + [0.01 * s, 0.02, -L], 0.014, 0.013)
        e = smin(e, sph(P, b + [0.01 * s, 0.02, -L - 0.02], 0.022), 0.01)        # a frayed tassel
        d = np.minimum(d, e)
    return d
def cape(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.48 - z) / 0.5, 0, 1)
    o = smin(np.maximum((np.sqrt((x / (0.21 + 0.17 * k)) ** 2 + ((y + 0.01) / (0.15 + 0.11 * k)) ** 2) - 1) * 0.15, z - 1.50),
             cap(P, NECK0, NECK1, 0.085, 0.075), 0.07)
    o = smin(o, ell(P, SHC + [0, -0.01, 0.0], (0.26, 0.16, 0.12)), 0.10)
    o = o - 0.01 * (np.sin(np.arctan2(y, x) * 8 + 2 * fbm(P, 2.0)) * 0.5 + 0.5) * k
    d = np.abs(o) - 0.008
    a_ = np.arctan2(y, x); kk = np.floor(a_ / (2 * np.pi) * 15)
    pts_ = np.abs(((a_ / (2 * np.pi) * 15) % 1.0) - 0.5) * 2
    hem = 0.92 + 0.12 * sstep(0.0, 0.15, y) + (0.06 + 0.14 * ((np.sin(kk * 91.7) * 4375.85) % 1.0)) * pts_ + 0.04 * (fbm(P * [1, 1, 0.3] + 3, 7.0) - 0.4)
    d = np.maximum(d, hem - z)
    d = np.maximum(d, -np.maximum(np.abs(x) - 0.075, -y))
    hn = fbm(P * [1, 1, 0.6] + 4, 10.0, 2)
    return np.maximum(np.maximum(d, z - 1.58), -(0.50 - hn) * 0.3)
# ---- 2. arms, head (hood, face, hair) ----------------------------------------------------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.07, 0.085), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.15, 0.095, 0.12), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - (WRI[s] - ax * 0.04)) @ ax
    d = np.maximum(d, t - 0.07 * sstep(0.0, -0.08, P[:, 2] - WRI[s][2]) - 0.03 * (fbm(P * 3, 9.0) - 0.4))    # torn, hanging low
    return np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.12, WRI[s] + ax * 0.05, 0.07, 0.10), -(t + 0.05)))
def hands(P):
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.035, 0.045, 0.05) if s > 0 else (0.04, 0.045, 0.035))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.032, 0.03), 0.02)
        for i in range(4):
            if s > 0:
                b = HAND[s] + [0.005, (i - 1.5) * 0.018, -0.005]
                pts = [b, b + [0, 0.004, -0.04], b + [-0.012, 0.008, -0.07], b + [-0.03, 0.01, -0.085]]
            else:                                                                 # reaching: fingers out and curling down
                b = HAND[s] + [(i - 1.5) * 0.017, 0.02, -0.01]
                pts = [b, b + [-0.005, 0.04, -0.01], b + [-0.008, 0.07, -0.03], b + [-0.01, 0.08, -0.06]]
            e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.011, 0.008), 0.005)
        d = e if d is None else np.minimum(d, e)
    return d
def hood(P):
    o = smin(ell(P, HEAD + [0, -0.02, 0.03], (0.15, 0.16, 0.18)), ell(P, HEAD + [0, -0.07, 0.15], (0.09, 0.09, 0.09)), 0.05)
    o = o - 0.005 * (np.sin(np.arctan2(P[:, 1] - HEAD[1], P[:, 0]) * 5 + 2 * fbm(P, 3.0)) * 0.5 + 0.5)
    d = np.abs(o) - 0.012
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.17, -0.02], (0.10, 0.13, 0.14)), -(P[:, 1] - HEAD[1] - 0.04)))
    return np.maximum(d, NECK1[2] - 0.07 - P[:, 2])
def face(P):
    d = ell(P, HEAD + [0, 0.02, 0], (0.072, 0.082, 0.10))
    d = smin(d, ell(P, HEAD + [0, 0.065, -0.06], (0.042, 0.04, 0.035)), 0.03)
    d = smin(d, ell(P, HEAD + [0, 0.095, -0.005], (0.012, 0.022, 0.028)), 0.012)
    for sx in (1, -1):
        d = smin(d, ell(P, HEAD + [sx * 0.04, 0.065, -0.03], (0.03, 0.025, 0.025)), 0.02)
        d = smax(d, -ell(P, HEAD + [sx * 0.032, 0.085, 0.02], (0.02, 0.014, 0.011)), 0.006)
    d = smax(d, -ell(P, HEAD + [0, 0.10, -0.055], (0.022, 0.025, 0.018)), 0.004)   # its open mouth
    return d
def hair(P):
    return np.maximum(ell(P, HEAD + [0, 0.0, 0.03], (0.085, 0.09, 0.11)), -(P[:, 1] - HEAD[1] - 0.075 + 0.6 * (P[:, 2] - HEAD[2] - 0.04)))
def headpiece(P): return np.minimum(np.minimum(hood(P), face(P)), hair(P))

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('robe', robe, 'robe', k=0.0)
P_.add('stole', stole, 'stole', k=0.0)
P_.add('rope', rope, 'rope', k=0.004)
P_.add('cape', cape, 'cape', k=0.0)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'robe'); AP.add('hands', hands, 'skin', k=0.0)
HP = Parts(); HP.add('hood', hood, 'cape'); HP.add('face', face, 'skin', k=0.0); HP.add('hair', hair, 'hair', k=0.01)
GROUPS = [(P_.sdf, 0, (-0.45, -0.38, 0.0), (0.45, 0.40, 1.62), P_),
          (AP.sdf, 12, (-0.46, -0.16, 0.62), (0.36, 0.48, 1.48), AP),
          (headpiece, 14, (-0.18, -0.22, 1.40), (0.18, 0.24, 1.87), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)])
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0); zz = Vb[:, 2]
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', ROBE_D * 0.5, MAT['cloth'])
cr = mix(ROBE_D, ROBE, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
cr = mix(cr, ROBE_D * 0.6, sstep(0.55, 0.15, zz)[:, None])                     # darkening into the water
cr = mix(cr, WATER * 0.6, (sstep(0.25, 0.04, zz) * np.clip(n2 * 2 - 0.6, 0, 1))[:, None])
cr[robe_outer(Vb) < -0.004] = ROBE_D * 0.4
put(look == 'robe', cr, MAT['cloth'])
# frost: feathered white patterns over the hood and the cape's shoulders
fr = np.clip((ridged(Vb * [1, 1, 0.8] + 2, 30.0, 3) - 0.70) * 5, 0, 1) * sstep(1.05, 1.45, zz) * np.clip(fbm(Vb + 7, 3.0) * 2.5 - 0.6, 0, 1)   # feathered lines, in patches
ccp = mix(CAPE * 0.7, CAPE, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
ccp = mix(ccp, FROST, (fr * 0.85)[:, None])
put(look == 'cape', ccp, MAT['cloth'])
mat[(look == 'cape') & (fr > 0.4)] = MAT['frost']
cst = np.tile(STOLE, (len(Vb), 1))
dpat = (np.abs(((Vb[:, 2] * 18) % 1.0) - 0.5) + np.abs(((Vb[:, 0] * 18 + 0.5) % 1.0) - 0.5)) < 0.22   # its diamond pattern
cst[~dpat] = STOLE_D
put(look == 'stole', cst, MAT['cloth'])
put(look == 'rope', mix(ROPE * 0.75, ROPE, n2[:, None]), MAT['rope'])
cs = mix(SKIN_D, SKIN, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
cs[np.linalg.norm((Vb - (HEAD + [0, 0.10, -0.055])) / [0.025, 0.03, 0.02], axis=1) < 1] = np.array([0.08, 0.06, 0.08])
put(look == 'skin', cs, MAT['skin'])
put(look == 'hair', HAIR, MAT['cloth'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (robe, stole, rope, cape), 12 arms, 14 head (hood, face, hair)
M.K[-1][(KB == 0) & (zz < 1.0)] = 15     # kind 15: below the waist the robe rides its hips

rng = np.random.default_rng(14)
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
# ---- 4. icicles from the hood's edge and the cape's points; drops from the face and the hand ---------------------------
log('icicles, drops, water')
def icicle(p, L, r, kind):
    u = np.linspace(0, 1, 8)
    V, F = tube(p + np.outer(u, [0, 0, -L]) + np.outer(np.sin(u * 3) * 0.003, [1, 0, 0]), r * (1 - u) ** 1.3 + 0.0008, 6)
    M.add(V, F, ICE, kind, MAT['ice'])
for k in range(16):                                                              # round the hood's opening
    a = np.pi * (0.1 + 0.8 * k / 15)
    p = HEAD + np.array([math.cos(a) * 0.105, 0.155 - 0.03 * abs(math.cos(a)), -0.02 + math.sin(a) * 0.13])
    if p[2] < HEAD[2] - 0.02 or abs(math.cos(a)) < 0.55: continue              # at the hood's sides, not over the face
    icicle(p + [0, 0, -0.005], 0.03 + 0.05 * rng.random(), 0.006, 14)
for k in range(30):                                                              # from the cape's torn points
    a = 2 * np.pi * rng.random()
    if abs(math.sin(a)) > 0.9 and math.sin(a) > 0: continue
    q, nn = project(A([[math.cos(a) * 0.35, math.sin(a) * 0.27, 1.0 + 0.1 * rng.random()]]), cape, it=10)
    icicle(q[0] + [0, 0, -0.005], 0.03 + 0.07 * rng.random(), 0.007, 0)
for p, L in [(HEAD + [0.03, 0.10, -0.09], 0.05), (HEAD + [-0.025, 0.098, -0.095], 0.07), (HEAD + [0.0, 0.10, -0.10], 0.03)]:
    icicle(p, L, 0.005, 14)                                                       # water running from its chin
for k in range(4):                                                               # drops falling from the reaching hand (they ride it)
    p = HAND[-1] + np.array([0.0 + 0.012 * (k - 1.5), 0.08, -0.07 - 0.05 * k])
    V, F = ball(p, np.array([0.008, 0.008, 0.012]), 8)
    M.add(V, F, ICE, 10, MAT['ice'])
# ---- 5. the water at its hem: glowing curling waves round the bottom, drops rising (they ride its hips) --------------
for k in range(36):
    a = 2 * np.pi * k / 36 + rng.normal() * 0.05
    rr = 0.34 + 0.03 * rng.random()
    c = np.array([math.cos(a) * rr, math.sin(a) * rr * 0.8, 0.02])
    out = np.array([math.cos(a), math.sin(a) * 0.8, 0.0]); out /= np.linalg.norm(out)
    u = np.linspace(0, 1, 14)
    curl = c + np.outer(np.sin(u * np.pi * 1.2) * 0.07, out) + np.outer(0.10 * np.sin(u * np.pi) * (1 - 0.3 * u), [0, 0, 1.0])
    V, F = tube(curl, 0.016 * np.sin(np.pi * np.clip(u * 0.9 + 0.05, 0, 1)) ** 0.6 + 0.002, 6)
    M.add(V, F, WATER, 9, MAT['glow'])
for k in range(18):
    a = 2 * np.pi * rng.random()
    p = np.array([math.cos(a) * 0.36, math.sin(a) * 0.29, 0.10 + 0.25 * rng.random()])
    V, F = ball(p, 0.008 + 0.006 * rng.random(), 8)
    M.add(V, F, WATER, 9, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
