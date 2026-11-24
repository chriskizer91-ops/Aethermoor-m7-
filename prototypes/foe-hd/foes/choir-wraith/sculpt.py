# The choir-wraith's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned cantor's (foes/drowned-cantor/sculpt.py): arms and head meshed as pieces of their own.
#
# Chris's sheet (art-in/3d/sheets/sheet-choir-wraith.webp): a chorister of Frostmere, drowned and still singing: it
# floats, no feet under it; a hood, and in it a grey mask with sad brows, shut eyes and a round singing mouth, its song
# coming out as a curl of blue breath; a short hooded cape, ragged at its edge, two brass tags hanging at its sides; a
# long robe pieced in pointed arches like a chapel's windows, brass studs where they meet, flaring to a hem torn into
# tongues that end in the air; blue hands holding an open hymnal, brass at its corners, three hooded singers on its cover.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.95 m to the top of the hood, its hem floating 0.10 m off the ground.
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0095, 2: 0.006, 3: 0.0050}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

ROBE = np.array([0.17, 0.24, 0.27]); ROBE_L = np.array([0.30, 0.40, 0.42]); ROBE_D = np.array([0.08, 0.12, 0.14])
MASK = np.array([0.50, 0.57, 0.56]); MASK_D = np.array([0.12, 0.15, 0.16]); SKIN = np.array([0.42, 0.52, 0.62])
SKIN_D = np.array([0.24, 0.31, 0.40]); BRASS = np.array([0.66, 0.52, 0.28]); BRASS_L = np.array([0.82, 0.70, 0.45])
BOOK = np.array([0.14, 0.20, 0.24]); PAGE = np.array([0.74, 0.70, 0.60]); SILVER = np.array([0.72, 0.72, 0.70])
BREATH = np.array([0.35, 0.65, 1.0])
MAT = {'cloth': (0.85, 0.0), 'mask': (0.55, 0.3), 'skin': (0.55, 0.0), 'brass': (0.3, 0.95), 'book': (0.7, 0.0),
       'page': (0.9, 0.0), 'glow': (0.3, 0.0)}

HIP = np.array([0, 0.0, 0.95]); CH = np.array([0, 0.01, 1.28]); SHC = np.array([0, 0.0, 1.45])
NECK0 = np.array([0, 0.0, 1.47]); NECK1 = np.array([0, 0.03, 1.58]); HEAD = np.array([0, 0.04, 1.68])
SH = {s: np.array([s * 0.17, 0.0, 1.45]) for s in (1, -1)}
ELB = {s: np.array([s * 0.22, 0.04, 1.15]) for s in (1, -1)}
WRI = {s: np.array([s * 0.12, 0.22, 1.18]) for s in (1, -1)}          # both forearms forward: they hold the hymnal
HAND = {s: np.array([s * 0.10, 0.27, 1.20]) for s in (1, -1)}
HEM = 0.10

def body(P):
    d = ell(P, CH, (0.17, 0.12, 0.20))
    d = smin(d, ell(P, (0, 0.01, 1.08), (0.15, 0.11, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.16, 0.11, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.22, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.055, 0.05), 0.03)
    return d
# ---- 1. the robe (pieced in arches, studded, flaring to tongues in the air); the cape; the brass tags ------------------
def robe_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.10 - z) / (1.10 - HEM), 0, 1) ** 0.9
    sk = np.sqrt((x / (0.19 + 0.35 * k)) ** 2 + (y / (0.15 + 0.27 * k)) ** 2) - 1
    d = smin(body(P) - 0.03, np.maximum(sk * 0.15, z - 1.15), 0.08)
    ang = np.arctan2(y, x)
    panel = np.abs(((ang / (2 * np.pi) * 14) % 1.0) - 0.5)                    # 14 panels round it
    return d + 0.004 * sstep(0.45, 0.5, panel)                                 # shallow seams between them
def robe(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(robe_outer(P)) - 0.008
    ang = np.arctan2(y, x)
    tongue = np.abs(((ang / (2 * np.pi) * 22) % 1.0) - 0.5) * 2                # torn into tongues, hanging to points
    kk = np.floor(ang / (2 * np.pi) * 22)                                       # each tongue its own length
    hem = HEM + (0.06 + 0.16 * ((np.sin(kk * 57.3) * 4375.85) % 1.0)) * tongue ** 1.2 + 0.08 * (fbm(P * [1, 1, 0.3], 7.0) - 0.4)
    d = np.maximum(d, hem - z)
    hn = fbm(P * [1, 1, 0.6] + 11, 9.0, 2)
    d = np.maximum(d, np.where(z < 0.32, -(0.50 - hn) * 0.3, -1.0))
    return np.maximum(d, z - 1.40)
def studs(P):
    d = None
    for zr, n, ph in ((0.70, 14, 0.0), (0.45, 14, 0.5)):
        for k in range(n):
            a = 2 * np.pi * (k + ph) / n
            q, nn = project(A([[math.cos(a) * 0.5, math.sin(a) * 0.4, zr]]), robe_outer, it=10)
            e = sph(P, q[0] + nn[0] * 0.006, 0.022)
            d = e if d is None else np.minimum(d, e)
    return d
def cape(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.50 - z) / 0.45, 0, 1)
    o = smin(np.maximum((np.sqrt((x / (0.21 + 0.13 * k)) ** 2 + ((y + 0.01) / (0.15 + 0.08 * k)) ** 2) - 1) * 0.15, z - 1.52),
             cap(P, NECK0, NECK1, 0.085, 0.075), 0.07)                                      # draping from the shoulders
    o = smin(o, ell(P, SHC + [0, -0.01, 0.0], (0.26, 0.17, 0.13)), 0.10)          # round over them
    o = o - 0.008 * (np.sin(np.arctan2(y, x) * 7 + 2 * fbm(P, 2.0)) * 0.5 + 0.5) * k
    d = np.abs(o) - 0.008
    a_ = np.arctan2(y, x); kk = np.floor(a_ / (2 * np.pi) * 13)
    hem = 1.05 + 0.10 * sstep(0.0, 0.15, y) + (0.04 + 0.06 * ((np.sin(kk * 91.7) * 4375.85) % 1.0)) * np.abs(np.sin(a_ * 13 / 2)) + 0.05 * (fbm(P * [1, 1, 0.3] + 3, 7.0) - 0.4)
    d = np.maximum(d, hem - z)
    d = np.maximum(d, -np.maximum(np.abs(x) - 0.10, -y))                         # open over the hymnal
    return np.maximum(d, z - 1.62)
def tags(P):
    d = None
    for s in (1, -1):
        c = np.array([s * 0.33, 0.05, 1.04])
        e = rbox(P, c, np.array([0.018, 0.045, 0.07]), 0.006)
        e = np.maximum(e, -rbox(P, c + [s * 0.012, 0, 0], np.array([0.01, 0.03, 0.05]), 0.004))   # a sunk panel in it
        d = e if d is None else np.minimum(d, e)
    return d
# ---- 2. arms (sleeves, hands on the hymnal), the head (hood and singing mask) ---------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.07, 0.08), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.12, 0.085, 0.11), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - (WRI[s] - ax * 0.04)) @ ax
    d = np.maximum(d, t - 0.05 * sstep(0.0, -0.06, P[:, 2] - WRI[s][2]) - 0.02 * (fbm(P * 3, 9.0) - 0.4))
    return np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.12, WRI[s] + ax * 0.05, 0.06, 0.09), -(t + 0.05)))
def hands(P):
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.035, 0.045, 0.045))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.032, 0.03), 0.02)
        for i in range(4):                                                       # fingers spread up the book's side
            b = HAND[s] + [-s * 0.01, 0.02, -0.02 + 0.018 * i]
            pts = [b, b + [-s * 0.035, 0.012, 0.01], b + [-s * 0.06, 0.015, 0.02], b + [-s * 0.075, 0.01, 0.028]]
            e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.0115, 0.0085), 0.005)
        th = HAND[s] + [-s * 0.01, -0.01, 0.03]
        e = smin(e, chain(P, [th, th + [-s * 0.02, 0.005, 0.03], th + [-s * 0.025, 0.0, 0.06]], 0.013, 0.01), 0.006)
        d = e if d is None else np.minimum(d, e)
    return d
def hood(P):
    o = smin(ell(P, HEAD + [0, -0.02, 0.03], (0.15, 0.16, 0.18)), ell(P, HEAD + [0, -0.08, 0.16], (0.09, 0.09, 0.08)), 0.05)
    o = o - 0.005 * (np.sin(np.arctan2(P[:, 1] - HEAD[1], P[:, 0]) * 5 + 2 * fbm(P, 3.0)) * 0.5 + 0.5)
    d = np.abs(o) - 0.012
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.16, -0.01], (0.10, 0.12, 0.14)), -(P[:, 1] - HEAD[1] - 0.04)))
    return np.maximum(d, NECK1[2] - 0.07 - P[:, 2])
def mask(P):
    q = P - HEAD
    d = ell(P, HEAD + [0, 0.04, -0.01], (0.088, 0.07, 0.12))
    d = np.maximum(d, -(q[:, 1] - 0.0))
    d = np.maximum(d, -ell(P, HEAD + [0, 0.035, -0.01], (0.08, 0.064, 0.112)))
    d = smin(d, cap(P, HEAD + [0, 0.105, 0.11], HEAD + [0, 0.11, -0.07], 0.006, 0.006), 0.006)   # its ridge
    for sx in (1, -1):
        d = smin(d, cap(P, HEAD + [sx * 0.012, 0.108, 0.07], HEAD + [sx * 0.065, 0.09, 0.045], 0.008, 0.006), 0.008)   # sad brows, slanting down
    d = np.maximum(d, -ell(P, HEAD + [0, 0.11, -0.055], (0.026, 0.06, 0.032)))  # the round singing mouth
    return d
def headpiece(P): return np.minimum(hood(P), mask(P))

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('robe', robe, 'robe', k=0.0)
P_.add('studs', studs, 'brass', k=0.003)
P_.add('cape', cape, 'robe', k=0.0)
P_.add('tags', tags, 'brass', k=0.0)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'robe'); AP.add('hands', hands, 'skin', k=0.0)
HP = Parts(); HP.add('hood', hood, 'robe'); HP.add('mask', mask, 'mask', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.62, -0.50, 0.08), (0.62, 0.50, 1.66), P_),
          (AP.sdf, 12, (-0.36, -0.16, 0.95), (0.36, 0.36, 1.55), AP),
          (headpiece, 14, (-0.18, -0.22, 1.48), (0.18, 0.24, 1.97), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)])
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', ROBE_D * 0.5, MAT['cloth'])
cr = mix(ROBE_D, ROBE, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
# the arches: each panel lighter inside a pointed arch, its seams dark
ang = np.arctan2(Vb[:, 1], Vb[:, 0]); zz = Vb[:, 2]
pu = ((ang / (2 * np.pi) * 14) % 1.0) - 0.5
arch_top = 0.72 + 0.10 * np.sqrt(np.clip(1 - (2 * pu) ** 2, 0, 1)) - 0.10 * np.abs(2 * pu)
inside = (zz < arch_top) & (zz > 0.28) & (np.abs(pu) < 0.42) & (look == 'robe') & (KB == 0)
cr[inside] = mix(cr[inside], ROBE_L * 1.1, 0.75)
upper = (zz > 0.80) & (zz < 1.0) & (np.abs(pu) < 0.42) & (look == 'robe') & (KB == 0)          # smaller arches above
cr[upper] = mix(cr[upper], ROBE_L, (0.35 * (np.abs(((ang[upper] / (2 * np.pi) * 28) % 1.0) - 0.5) < 0.35))[:, None])
cr[np.abs(pu) > 0.45] *= 0.75
cr[robe_outer(Vb) < -0.004] = ROBE_D * 0.5
put(look == 'robe', cr, MAT['cloth'])
put(look == 'brass', mix(BRASS * 0.7, BRASS_L, n2[:, None]), MAT['brass'])
cm = mix(MASK * 0.8, MASK, n2[:, None])
cm[np.linalg.norm((Vb - (HEAD + [0, 0.11, -0.055])) / [0.03, 0.06, 0.036], axis=1) < 1] = MASK_D
for sx in (1, -1):                                                              # shut eyes: dark curved lids
    lid = (np.abs(Vb[:, 0] - sx * 0.035) < 0.022) & (np.abs(zz - (HEAD[2] + 0.025 - 0.15 * (Vb[:, 0] - sx * 0.035) ** 2 * 40)) < 0.004)
    cm[lid & (look == 'mask')] = MASK_D
put(look == 'mask', cm, MAT['mask'])
put(look == 'skin', mix(SKIN_D, SKIN, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None]), MAT['skin'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (robe, studs, cape, tags), 12 arms, 14 head (hood, mask)
M.K[-1][(KB == 0) & (zz < 1.05)] = 15     # kind 15: below the waist the robe rides its hips

rng = np.random.default_rng(12)
# ---- 4. the hymnal, open in its hands (it rides the right hand; the arms always move together) ------------------------
log('hymnal, breath')
BKC = np.array([0.0, 0.31, 1.32])
for s in (1, -1):                                                               # the two boards, open in a shallow V
    c = BKC + np.array([s * 0.085, -0.012, 0.0])
    q = np.array([[-0.085, -0.008, -0.115], [0.085, -0.008, -0.115], [0.085, 0.008, -0.115], [-0.085, 0.008, -0.115],
                  [-0.085, -0.008, 0.115], [0.085, -0.008, 0.115], [0.085, 0.008, 0.115], [-0.085, 0.008, 0.115]])
    rot = s * 0.25; ca, sa = math.cos(rot), math.sin(rot)
    q = np.stack([q[:, 0] * ca - q[:, 1] * sa, q[:, 0] * sa + q[:, 1] * ca, q[:, 2]], 1) + c
    F = np.array([(0, 2, 1), (0, 3, 2), (4, 5, 6), (4, 6, 7), (0, 1, 5), (0, 5, 4), (1, 2, 6), (1, 6, 5), (2, 3, 7), (2, 7, 6), (3, 0, 4), (3, 4, 7)])
    M.add(q, F, BOOK, 10, MAT['book'])
    pg = q.copy(); pg[:, 1] -= 0.0; pg = c + (pg - c) * np.array([0.94, 1.0, 0.94]) - np.array([0, 0.012, 0])   # the pages, behind
    pg[[2, 3, 6, 7], 1] -= 0.02
    M.add(pg, F, PAGE, 10, MAT['page'])
    for cz in (-0.105, 0.105):                                                  # brass corners
        for cx in (-0.075, 0.075):
            p0 = c + np.array([cx * ca, cx * sa + 0.012, cz])
            V, F2 = tube(np.array([p0 - [0, 0.004, 0], p0 + [0, 0.004, 0]]), np.array([0.018, 0.018]), 4)
            M.add(V, F2, BRASS, 10, MAT['brass'])
    for i, dx in enumerate((-0.04, 0.0, 0.04)):                                  # three hooded singers on the cover, in silver
        p0 = c + np.array([dx * ca, dx * sa + 0.011, -0.03])
        V, F2 = tube(np.array([p0 + [0, 0, -0.035], p0 + [0, 0, 0.02], p0 + [0, 0, 0.04]]), np.array([0.014, 0.013, 0.008]), 8)
        M.add(V, F2, SILVER, 10, MAT['brass'])
V, F = tube(np.array([BKC + [0, -0.02, -0.115], BKC + [0, -0.02, 0.115]]), np.array([0.02, 0.02]), 8)     # the spine
M.add(V, F, BOOK * 0.8, 10, MAT['book'])
# ---- 5. the song: a curl of blue breath out of the mouth (it rides the head) ----------------------------------------
u = np.linspace(0, 1, 40)
start = HEAD + np.array([0, 0.13, -0.055])
path = start + np.stack([-0.30 * u - 0.05 * np.sin(u * 9), 0.06 * u + 0.03 * np.sin(u * 6), 0.10 * u ** 1.5 + 0.035 * np.sin(u * 11)], 1)
V, F = tube(path, 0.022 * np.sin(np.pi * np.clip(u * 0.9 + 0.08, 0, 1)) ** 0.6 * (1 - 0.4 * u) + 0.003, SIDES + 4)
M.add(V, F, BREATH, 9, MAT['glow'])
for k in range(2):                                                               # and its curling wisps
    p0 = path[int(len(path) * (0.55 + 0.25 * k))]
    w = p0 + np.stack([-0.08 * u - 0.02 * np.sin(u * 8), 0.01 * u, (0.06 if k else -0.05) * u + 0.025 * np.sin(u * 10)], 1)
    V, F = tube(w, 0.012 * (1 - u) + 0.002, SIDES + 2)
    M.add(V, F, BREATH, 9, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
