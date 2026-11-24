# The drowned cantor's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned choir's (foes/drowned-choir/sculpt.py): arms, legs and head meshed as pieces of their own.
#
# Chris's sheet (art-in/3d/sheets/sheet-drowned-cantor.webp): the choir's master, drowned with it: a black hood and a
# cowl of black cloth about the throat; in the hood a white mask, cracked, a yellow sun-flower over its left eye; a coral
# tree growing out of the hood and spreading wide; a collar of pearls in two rows over the shoulders; a sea-green cope to
# the ground, open down the front, its edges braided in gold, coral embroidered on it in pale green; under it a black
# robe, ragged at the hem; grey gloved hands; and in its left hand the Cantor's Staff: a black shaft with gold bands,
# branching coral at its head round a teal orb, pearls hanging from it, a glass drop at its foot.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 2.1 m to the top of the coral (the mask 1.62 m, the shoulders 1.42 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0085, 2: 0.0052, 3: 0.0043}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

BLACK = np.array([0.06, 0.065, 0.075]); BLACK_L = np.array([0.15, 0.16, 0.18]); COPE = np.array([0.08, 0.30, 0.27])
COPE_L = np.array([0.20, 0.42, 0.34]); EMB = np.array([0.55, 0.62, 0.36]); GOLD = np.array([0.85, 0.62, 0.15])
MASK = np.array([0.86, 0.82, 0.70]); SUN = np.array([0.95, 0.70, 0.12]); PEARL = np.array([0.85, 0.86, 0.88])
GLOVE = np.array([0.30, 0.30, 0.33]); CORAL = np.array([0.34, 0.42, 0.28]); CORAL_D = np.array([0.18, 0.24, 0.16])
ORB = np.array([0.15, 0.55, 0.55]); GLASS = np.array([0.55, 0.75, 0.70])
MAT = {'cloth': (0.85, 0.0), 'cope': (0.8, 0.0), 'gold': (0.35, 0.9), 'mask': (0.55, 0.0), 'pearl': (0.2, 0.1),
       'glove': (0.7, 0.0), 'coral': (0.8, 0.0), 'orb': (0.15, 0.0), 'glass': (0.1, 0.0)}

HIP = np.array([0, 0.0, 0.90]); CH = np.array([0, 0.01, 1.24]); SHC = np.array([0, 0.0, 1.40])
NECK0 = np.array([0, 0.0, 1.42]); NECK1 = np.array([0, 0.03, 1.53]); HEAD = np.array([0, 0.05, 1.62])
SH = {s: np.array([s * 0.17, 0.0, 1.40]) for s in (1, -1)}
ELB = {1: np.array([0.21, 0.0, 1.08]), -1: np.array([-0.21, 0.05, 1.08])}
WRI = {1: np.array([0.22, 0.05, 0.84]), -1: np.array([-0.13, 0.24, 1.18])}        # its left hand up at its breast, on the staff
HAND = {1: np.array([0.22, 0.06, 0.76]), -1: np.array([-0.13, 0.30, 1.20])}
THI = {s: np.array([s * 0.09, 0.0, 0.88]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.10, 0.02, 0.47]) for s in (1, -1)}
ANK = {s: np.array([s * 0.10, -0.01, 0.09]) for s in (1, -1)}
SA = np.array([-0.05, 0.31, 0.86]); SB = np.array([-0.30, 0.30, 1.50])          # the staff's foot and head
SAX = (SB - SA) / np.linalg.norm(SB - SA)

def body(P):
    d = ell(P, CH, (0.17, 0.12, 0.20))
    d = smin(d, ell(P, (0, 0.01, 1.03), (0.15, 0.11, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.16, 0.11, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.22, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.055, 0.05), 0.03)
    return d
# ---- 1. the black robe (to the ground), the cope (open in front, to the ankles), the cowl, the pearls -----------------
def robe_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((0.95 - z) / 0.95, 0, 1)
    sk = np.sqrt((x / (0.18 + 0.10 * k)) ** 2 + (y / (0.15 + 0.07 * k)) ** 2) - 1
    d = smin(body(P) - 0.02, np.maximum(sk * 0.15, z - 1.05), 0.08)
    return d - 0.012 * (np.sin(np.arctan2(y, x) * 12 + fbm(P, 2.0)) * 0.5 + 0.5) * sstep(0.95, 0.4, z)
def robe(P):
    z = P[:, 2]
    d = np.abs(robe_outer(P)) - 0.007
    hem = 0.02 + 0.05 * np.abs(np.sin(np.arctan2(P[:, 0], P[:, 1] + 1e-6) * 11)) ** 1.5 + 0.06 * (fbm(P * [1, 1, 0.2], 8.0) - 0.4)
    return np.maximum(np.maximum(d, hem - z), z - 1.30)
def cope_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.40 - z) / 1.3, 0, 1)                                         # from the shoulders, wide, nearly to the ground
    sk = np.sqrt((x / (0.20 + 0.22 * k ** 0.8)) ** 2 + ((y + 0.02) / (0.15 + 0.14 * k ** 0.8)) ** 2) - 1
    d = smin(body(P) - 0.045, np.maximum(sk * 0.17, z - 1.40), 0.10)          # it falls from rounded shoulders
    return d - 0.028 * (np.sin(np.arctan2(y, x) * 8 + 2.0 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(1.25, 0.6, z)   # deep folds
def cope(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(cope_outer(P)) - 0.007
    hem = 0.14 + 0.05 * np.abs(np.sin(np.arctan2(x, y + 1e-6) * 7)) + 0.06 * (fbm(P * [1, 1, 0.3] + 4, 6.0) - 0.4)
    d = np.maximum(d, hem - z)
    w = mix(0.07, 0.16, sstep(1.35, 0.4, z))                                   # open down the front, wider toward the hem
    d = np.maximum(d, -np.maximum(np.abs(x) - w, -y) * 0.6)
    return np.maximum(d, z - 1.46)
def braid(P):
    # the gold braid down each front edge of the cope
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    w = mix(0.07, 0.16, sstep(1.35, 0.4, z))
    e = np.abs(np.abs(x) - (w + 0.022)) - 0.022
    d = np.maximum(e, np.abs(cope_outer(P) + 0.0) - 0.011)
    d = np.maximum(d, np.maximum(0.18 - z, z - 1.36)) + np.where(y > 0, 0, 1)
    return d - 0.004 * (np.sin(z * 160) * 0.5 + 0.5)                            # its plaits
def cowl(P):
    q = P - (NECK0 + [0, 0.02, 0.05])
    r = np.sqrt((q[:, 0] / 1.15) ** 2 + (q[:, 1] / 0.95) ** 2)
    zz = q[:, 2] + 0.07 * sstep(0.0, 0.1, q[:, 1]) * np.clip(1 - np.abs(q[:, 0]) / 0.12, 0, 1)
    d = np.sqrt((r - 0.13) ** 2 + (zz / 0.7) ** 2) - 0.065
    return d - 0.012 * (np.sin(np.arctan2(q[:, 0], q[:, 1]) * 8 + q[:, 2] * 20) * 0.5 + 0.5)

# ---- 2. arms, legs (hidden), head (hood and mask) ---------------------------------------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.07, 0.08), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.15, 0.085, 0.11), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - (WRI[s] - ax * 0.04)) @ ax
    d = np.maximum(d, t - 0.05 * sstep(0.0, -0.06, P[:, 2] - WRI[s][2]) - 0.02 * (fbm(P * 3, 9.0) - 0.4))   # ragged, hanging under
    d = np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.12, WRI[s] + ax * 0.05, 0.06, 0.09), -(t + 0.05)))
    return d
def hands(P):
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.032, 0.045, 0.05) if s > 0 else (0.045, 0.04, 0.035))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.032, 0.03), 0.02)
        if s > 0:
            for i in range(4):
                b = HAND[s] + [0.005, (i - 1.5) * 0.018, -0.005]
                pts = [b, b + [0, 0.004, -0.04], b + [-0.012, 0.008, -0.07], b + [-0.03, 0.01, -0.085]]
                e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.011, 0.0085), 0.005)
        else:                                                                    # closed round the staff
            c0 = SA + (SB - SA) * 0.50
            e1 = np.cross(SAX, [0, 0, 1.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(SAX, e1)
            for i in range(4):
                ci = c0 + SAX * (0.018 * (i - 1.5))
                arc = [ci + 0.03 * (math.cos(a) * e1 + math.sin(a) * e2) for a in np.linspace(math.pi * 0.6, math.pi * 2.0, 5)]
                e = smin(e, chain(P, arc, 0.011, 0.009), 0.004)
        d = e if d is None else np.minimum(d, e)
    return d
def legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.03], KNEE[s], 0.085, 0.07), cap(P, KNEE[s], ANK[s], 0.07, 0.05), 0.03)
        foot = np.maximum(smin(ell(P, ANK[s] + [0, 0.07, -0.05], (0.055, 0.11, 0.045)), sph(P, ANK[s], 0.055), 0.03), -P[:, 2])
        d = smin(e, foot, 0.03) if d is None else np.minimum(d, smin(e, foot, 0.03))
    return d
def hood(P):
    o = smin(ell(P, HEAD + [0, -0.02, 0.02], (0.13, 0.14, 0.16)), ell(P, HEAD + [0, -0.06, 0.13], (0.08, 0.09, 0.08)), 0.05)
    d = np.abs(o) - 0.012
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.14, -0.01], (0.085, 0.10, 0.12)), -(P[:, 1] - HEAD[1] - 0.04)))   # open at the face
    return np.maximum(d, NECK1[2] - 0.06 - P[:, 2])
def mask(P):
    q = P - (HEAD + [0, 0.07, -0.01])
    d = ell(P, HEAD + [0, 0.04, -0.01], (0.088, 0.07, 0.115))
    d = np.maximum(d, -(q[:, 1] - 0.0))                                          # only its front: a shell of a face
    d = np.maximum(d, -ell(P, HEAD + [0, 0.035, -0.01], (0.080, 0.064, 0.107)))
    for sx in (1, -1):
        d = np.maximum(d, -ell(P, HEAD + [sx * 0.03, 0.09, 0.015], (0.016, 0.03, 0.011)))   # eye slits
    d = smin(d, ell(P, HEAD + [0, 0.10, -0.01], (0.012, 0.02, 0.03)), 0.01)                 # a ridge of a nose
    return d
def headpiece(P): return np.minimum(hood(P), mask(P))

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('robe', robe, 'black', k=0.0)
P_.add('cope', cope, 'cope', k=0.0)
P_.add('braid', braid, 'gold', k=0.0)
P_.add('cowl', cowl, 'black', k=0.01)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'black'); AP.add('hands', hands, 'glove', k=0.0)
HP = Parts(); HP.add('hood', hood, 'black'); HP.add('mask', mask, 'mask', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.50, -0.42, -0.01), (0.50, 0.42, 1.55), P_),
          (AP.sdf, 12, (-0.36, -0.16, 0.62), (0.36, 0.38, 1.50), AP),
          (legs, 13, (-0.22, -0.12, -0.01), (0.22, 0.24, 0.92), None),
          (headpiece, 14, (-0.16, -0.20, 1.42), (0.16, 0.22, 1.84), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)] if parts else np.full(len(Vg), 'black'))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', BLACK * 0.5, MAT['cloth'])
put(look == 'black', mix(BLACK, BLACK_L, (np.clip(n2 * 1.5 - 0.4, 0, 1) * 0.6)[:, None]), MAT['cloth'])
cc = mix(COPE * 0.7, COPE_L, np.clip(n1 * 1.5 - 0.3, 0, 1)[:, None])
# the coral embroidery: branching stems in pale green, one up each side of the front, front and back
xx, yy, zz = Vb[:, 0], Vb[:, 1], Vb[:, 2]
stem = np.zeros(len(Vb), bool)
def segd(px, pz, ax, az, bx, bz):
    vx, vz = bx - ax, bz - az; t = np.clip(((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz), 0, 1)
    return np.hypot(px - ax - t * vx, pz - az - t * vz)
X = np.abs(xx)
for cx in (0.24,):
    stem |= segd(X, zz, cx, 0.22, cx, 0.80) < 0.007
    for zi in np.arange(0.28, 0.76, 0.075):
        L = 0.07 * (1 - (zi - 0.22) / 0.7) + 0.02
        stem |= segd(X, zz, cx, zi, cx + L, zi + L * 0.9) < 0.005
        stem |= segd(X, zz, cx, zi + 0.035, cx - L, zi + 0.035 + L * 0.9) < 0.005
stem &= (look == 'cope')
cc[stem] = EMB
cc[cope_outer(Vb) < -0.003] = COPE * 0.4
put(look == 'cope', cc, MAT['cope'])
put(look == 'gold', mix(GOLD * 0.7, GOLD, n2[:, None]), MAT['gold'])
cm = mix(MASK * 0.85, MASK, n2[:, None])
crack = (np.abs(fbm(Vb * 3, 14.0, 2) - 0.5) < 0.012)
cm[crack] *= 0.4
put(look == 'mask', cm, MAT['mask'])
put(look == 'glove', mix(GLOVE * 0.75, GLOVE, n2[:, None]), MAT['glove'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (robe, cope, braid, cowl), 12 arms, 13 legs, 14 head (hood, mask)
M.K[-1][(KB == 0) & (Vb[:, 2] < 1.0)] = 15     # kind 15: below the waist, robe and cope ride its hips

rng = np.random.default_rng(6)
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
# ---- 4. the sun-flower over its left eye; the pearl collar ----------------------------------------------------------
log('sun, pearls, coral, staff')
SC_ = HEAD + np.array([-0.033, 0.115, 0.015])
for k in range(12):                                                             # petals
    a = 2 * np.pi * k / 12
    p0 = SC_ + np.array([math.cos(a) * 0.012, 0.004, math.sin(a) * 0.012]); p1 = SC_ + np.array([math.cos(a) * 0.046, 0.0, math.sin(a) * 0.046])
    V, F = tube(np.array([p0, (p0 + p1) / 2 + [0, 0.003, 0], p1]), np.array([0.006, 0.008, 0.002]), 6)
    M.add(V, F, SUN, 14, MAT['mask'])
V, F = ball(SC_ + [0, 0.006, 0], np.array([0.013, 0.006, 0.013]), 12)
M.add(V, F, SUN * 0.5, 14, MAT['mask'])
for row, (rz, n, pr) in enumerate(((1.42, 19, 0.025), (1.37, 23, 0.022))):
    for k in range(n):
        a = np.pi * 2 * (0.02 + 0.96 * k / (n - 1)) - np.pi / 2           # all round, from the back, round to the front
        guess = np.array([math.cos(a) * 0.3, math.sin(a) * 0.25, rz - (0.03 * row + 0.05 * max(0.0, math.sin(a)))])
        q, nn = project(A([guess]), cope_outer, it=10)
        c = q[0] + nn[0] * pr * 0.7
        V, F = ball(c, pr * (0.9 + 0.2 * rng.random()), 10 + 2 * LV)
        M.add(V, F, PEARL * (0.9 + 0.1 * rng.random()), 4, MAT['pearl'])

# ---- 5. the coral growing out of the hood (it rides the head) ------------------------------------------------------------
cr = np.random.default_rng(29)
def branch(p0, d, L, r0, depth, kind, col0):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = cr.normal(size=3) * 0.35; n = {1: 7, 2: 10, 3: 13}[LV]
    pts = np.array([p0 + d * L * u + bend * L * u * u * 0.5 for u in np.linspace(0, 1, n)])
    V, F = tube(pts, r0 * (1 - 0.45 * np.linspace(0, 1, n)), max(5, SIDES))
    M.add(V, F, np.clip(mix(CORAL_D, col0, 0.4 + 0.5 * cr.random()), 0, 1), kind, MAT['coral'])
    td = pts[-1] - pts[-2]; td /= np.linalg.norm(td)
    if depth > 0:
        for k in range(2 + (depth > 1)):
            nd = td + cr.normal(size=3) * 0.7; nd[2] = abs(nd[2]) * 0.7 + 0.2
            branch(pts[int(n * (0.55 + 0.45 * cr.random())) - 1], nd, L * (0.55 + 0.15 * cr.random()), r0 * 0.62, depth - 1, kind, col0)
root = HEAD + np.array([0.07, -0.04, 0.10])
for dx, dy, dz in [(0.6, -0.2, 1.0), (0.2, -0.4, 1.0), (1.0, 0.1, 0.5), (-0.3, -0.5, 1.0), (0.8, -0.5, 0.6)]:
    branch(root, [dx, dy, dz], 0.24 + 0.06 * cr.random(), 0.03, 3, 2, CORAL)

# ---- 6. the Cantor's Staff, in its left hand ----------------------------------------------------------------------------
n_ = 30
V, F = tube(np.linspace(SA, SB, n_), np.full(n_, 0.017), SIDES + 4)
M.add(V, F, np.clip(mix(BLACK, BLACK_L * 1.5, fbm(V * 20, 2.0)[:, None]), 0, 1), 10, MAT['cloth'])
for t_ in (0.2, 0.38, 0.62, 0.85, 0.93):                                         # gold bands
    c = SA + (SB - SA) * t_
    V, F = tube(np.array([c - SAX * 0.012, c + SAX * 0.012]), np.array([0.021, 0.021]), SIDES + 4)
    M.add(V, F, GOLD, 10, MAT['gold'])
for dx, dz in [(-0.5, 1.0), (0.4, 1.0), (0.0, 1.0), (-0.9, 0.6), (0.8, 0.6)]:   # coral at its head
    d0 = SAX + np.array([dx * 0.5, 0.0, dz * 0.2])
    branch(SB, d0, 0.10 + 0.03 * cr.random(), 0.013, 2, 10, CORAL)
V, F = ball(SB + SAX * 0.07, 0.035, 16)                                          # the teal orb in the coral
M.add(V, F, ORB, 10, MAT['orb'])
for k, sgn in ((0, 1), (1, -1)):                                                 # pearls hanging from its head
    p0 = SB - SAX * 0.03 + np.array([sgn * 0.035, 0.0, 0.0])
    V, F = tube(np.array([p0, p0 + [0, 0, -0.05]]), np.array([0.002, 0.002]), 5)
    M.add(V, F, GOLD, 10, MAT['gold'])
    V, F = ball(p0 + [0, 0, -0.065], np.array([0.012, 0.012, 0.016]), 10)
    M.add(V, F, PEARL, 10, MAT['pearl'])
V, F = tube(np.array([SA, SA - SAX * 0.03]), np.array([0.014, 0.006]), 8)
M.add(V, F, GOLD, 10, MAT['gold'])
u = np.linspace(0, 1, 12)                                                        # the glass drop at its foot
V, F = tube(SA - SAX * 0.03 + np.outer(u, [0, 0, -0.07]), 0.026 * np.sin(np.pi * np.clip(u * 0.85 + 0.12, 0, 1)) ** 1.2 + 0.002, SIDES + 4)
M.add(V, F, GLASS, 10, MAT['glass'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
