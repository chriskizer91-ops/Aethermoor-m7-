# The Rime-Abbot's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned cantor's (foes/drowned-cantor/sculpt.py): arms and head as pieces of their own; a staff in the left hand.
#
# Chris's sheet (art-in/3d/sheets/sheet-rime-abbot.webp): Brother Aurel of Peak's Veil, who went down to listen to Hush
# and did not come up: a deep hood, its rim a thick cowl of braided purple-grey wool (the Hushweave Cowl); in it a mask of
# ice like a cathedral's window, its tracery pointed, icicles hanging from it; pale strands of hair either side; a dark
# navy cape, frost-embroidered, edged in purple, its yoke hung with tassels, fastened at the throat by a round brooch with
# a blue stone, braided cords hanging from it; under it a sea-green robe in long pleats, pale diamonds down it, its hem
# crusted with ice; grey gloves; and frozen to his left hand the Rime Crozier: a staff of ice in carved six-sided sections
# banded in dark iron, its head curled over with ice leaves, a blue lantern hanging in the curl.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 2.15 m to the top of the hood (the mask 1.88 m, the shoulders 1.55 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0095, 2: 0.006, 3: 0.0050}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

NAVY = np.array([0.08, 0.10, 0.20]); NAVY_L = np.array([0.18, 0.21, 0.34]); TRIM = np.array([0.30, 0.26, 0.40])
ROBE = np.array([0.18, 0.30, 0.31]); ROBE_D = np.array([0.08, 0.14, 0.16]); FROST = np.array([0.78, 0.86, 0.95])
WOOL = np.array([0.38, 0.36, 0.50]); WOOL_D = np.array([0.20, 0.19, 0.30]); ICE = np.array([0.66, 0.80, 0.92])
ICE_D = np.array([0.40, 0.55, 0.70]); IRON = np.array([0.20, 0.21, 0.24]); GLOVE = np.array([0.42, 0.45, 0.50])
HAIR = np.array([0.55, 0.68, 0.80]); TASSEL = np.array([0.68, 0.68, 0.72]); BLUE = np.array([0.35, 0.70, 1.0])
MAT = {'cloth': (0.85, 0.0), 'wool': (0.95, 0.0), 'ice': (0.12, 0.0), 'iron': (0.4, 0.9), 'glove': (0.7, 0.0),
       'silver': (0.3, 0.9), 'glow': (0.2, 0.0)}

HIP = np.array([0, 0.0, 1.04]); CH = np.array([0, 0.01, 1.38]); SHC = np.array([0, 0.0, 1.55])
NECK0 = np.array([0, 0.0, 1.57]); NECK1 = np.array([0, 0.03, 1.70]); HEAD = np.array([0, 0.05, 1.82])
SH = {s: np.array([s * 0.19, 0.0, 1.55]) for s in (1, -1)}
ELB = {1: np.array([0.24, 0.0, 1.20]), -1: np.array([-0.30, 0.06, 1.22])}
WRI = {1: np.array([0.25, 0.05, 0.95]), -1: np.array([-0.44, 0.16, 1.30])}         # its left hand on the crozier
HAND = {1: np.array([0.25, 0.06, 0.86]), -1: np.array([-0.47, 0.17, 1.32])}
STAFF_X = np.array([-0.50, 0.17]); STAFF_Z0, STAFF_Z1 = 0.02, 1.92                 # the crozier's shaft, upright

def body(P):
    d = ell(P, CH, (0.19, 0.13, 0.22))
    d = smin(d, ell(P, (0, 0.01, 1.18), (0.17, 0.12, 0.14)), 0.06)
    d = smin(d, ell(P, HIP, (0.18, 0.12, 0.11)), 0.06)
    d = smin(d, ell(P, SHC, (0.25, 0.11, 0.07)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.06, 0.055), 0.03)
    return d
# ---- 1. the robe (pleated, to the ground, ice at its hem), the cape, the brooch and cords, the tassels ----------------
def robe_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.15 - z) / 1.15, 0, 1) ** 0.9
    sk = np.sqrt((x / (0.20 + 0.27 * k)) ** 2 + ((y + 0.02 * k) / (0.16 + 0.20 * k)) ** 2) - 1
    d = smin(body(P) - 0.025, np.maximum(sk * 0.16, z - 1.20), 0.08)
    ang = np.arctan2(y, x)
    return d - 0.010 * np.abs(np.sin(ang * 22)) * sstep(1.1, 0.7, z)               # long pleats
def robe(P):
    z = P[:, 2]
    d = np.abs(robe_outer(P)) - 0.008
    return np.maximum(np.maximum(d, 0.01 - z), z - 1.45)
def cape_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.55 - z) / 1.0, 0, 1)
    sk = np.sqrt((x / (0.26 + 0.36 * k ** 0.8)) ** 2 + ((y + 0.03 + 0.10 * k) / (0.19 + 0.27 * k ** 0.8)) ** 2) - 1
    d = smin(body(P) - 0.05, np.maximum(sk * 0.17, z - 1.40), 0.12)
    d = smin(d, ell(P, SHC + [0, -0.01, -0.08], (0.28, 0.17, 0.17)), 0.12)          # sloping shoulders, no shelf
    return d - 0.026 * (np.sin(np.arctan2(y, x) * 7 + 2.0 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(1.4, 0.8, z)   # deep folds
def cape_hem(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    # a cope's curve: long at the back and sides, sweeping up to the waist at the front
    side = np.abs(np.arctan2(x, -y)) / np.pi                                        # 0 at the back, 1 at the front
    return 0.42 + 0.62 * sstep(0.55, 0.98, side) + 0.02 * np.sin(np.arctan2(y, x) * 9)
def cape(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(cape_outer(P)) - 0.008
    d = np.maximum(d, cape_hem(P) - z)
    d = np.maximum(d, -np.maximum(np.abs(x) - mix(0.07, 0.20, sstep(1.5, 1.0, z)), -y) * 0.6)   # open in front
    return np.maximum(d, z - 1.62)
def brooch(P):
    c = np.array([0.0, 0.21, 1.52])
    d = np.maximum(sph(P, c, 0.045), np.abs(P[:, 1] - c[1]) - 0.012)
    d = smin(d, sph(P, c + [0, 0.012, 0], 0.024), 0.006)                            # its stone
    for s in (1, -1):                                                               # the braided cords hanging from it
        for k in range(6):
            p0 = c + [s * 0.03, -0.005, -0.03 - 0.045 * k]
            d = np.minimum(d, ell(P, p0, (0.014, 0.012, 0.026)))
        d = np.minimum(d, cap(P, c + [s * 0.03, -0.005, -0.30], c + [s * 0.03, -0.005, -0.40], 0.022, 0.014))   # its tassel
    return d
def tassels(P):
    d = None
    for k in range(10):                                                            # hung from the yoke, round the shoulders
        a = np.pi * (0.12 + 0.76 * k / 9)
        a2 = a if k % 2 else a + np.pi
        q, nn = project(A([[math.cos(a2) * 0.30, math.sin(a2) * 0.22 * (1 if k % 2 else -1), 1.44]]), cape_outer, it=10)
        b = q[0] + nn[0] * 0.012
        b = b + nn[0] * 0.02
        e = cap(P, b, b + [0, 0, -0.06], 0.008, 0.008)
        e = np.minimum(e, sph(P, b + [0, 0, -0.07], 0.018))
        e = np.minimum(e, cap(P, b + [0, 0, -0.08], b + [0, 0, -0.19], 0.016, 0.03))
        d = e if d is None else np.minimum(d, e)
    return d
# ---- 2. arms, the head (hood and cowl, ice mask, hair) -------------------------------------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.08, 0.09), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.12, 0.095, 0.12), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - (WRI[s] - ax * 0.04)) @ ax
    d = np.maximum(d, t - 0.04 * sstep(0.0, -0.06, P[:, 2] - WRI[s][2]))
    return np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.12, WRI[s] + ax * 0.05, 0.07, 0.10), -(t + 0.05)))
def hands(P):
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.038, 0.05, 0.055) if s > 0 else (0.05, 0.045, 0.045))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.036, 0.034), 0.02)
        if s > 0:
            for i in range(4):
                b = HAND[s] + [0.005, (i - 1.5) * 0.02, -0.005]
                pts = [b, b + [0, 0.004, -0.045], b + [-0.012, 0.008, -0.08], b + [-0.03, 0.01, -0.095]]
                e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.013, 0.010), 0.005)
        else:                                                                       # a fist round the crozier
            c0 = np.array([STAFF_X[0], STAFF_X[1], HAND[s][2]])
            for i in range(4):
                ci = c0 + [0, 0, 0.022 * (i - 1.5)]
                arc = [ci + 0.035 * np.array([math.cos(a), math.sin(a), 0]) for a in np.linspace(math.pi * 0.2, math.pi * 1.5, 5)]
                e = smin(e, chain(P, arc, 0.013, 0.011), 0.004)
        d = e if d is None else np.minimum(d, e)
    return d
def hood(P):
    o = smin(ell(P, HEAD + [0, -0.03, 0.04], (0.20, 0.21, 0.22)), ell(P, HEAD + [0, -0.10, 0.20], (0.11, 0.11, 0.10)), 0.06)
    o = o - 0.006 * (np.sin(np.arctan2(P[:, 1] - HEAD[1], P[:, 0]) * 5 + 2 * fbm(P, 3.0)) * 0.5 + 0.5)
    d = np.abs(o) - 0.013
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.19, -0.03], (0.11, 0.14, 0.15)), -(P[:, 1] - HEAD[1] - 0.05)))
    return np.maximum(d, NECK1[2] - 0.08 - P[:, 2])
def cowl(P):
    # the Hushweave Cowl: a thick roll of braided wool round the hood's opening and down onto the shoulders
    q = P - (HEAD + [0, 0.02, -0.05])
    r = np.sqrt((q[:, 0] / 1.0) ** 2 + (q[:, 2] / 1.25) ** 2)
    a = np.arctan2(q[:, 2], q[:, 0])
    yy = q[:, 1] - 0.09 + 0.06 * np.clip(-np.sin(a), 0, 1)
    d = np.sqrt((r - 0.17) ** 2 + (yy * 1.3) ** 2) - 0.065
    d = smin(d, ell(P, NECK0 + [0, -0.01, 0.02], (0.29, 0.20, 0.10)) - 0.0, 0.05)        # round the neck, onto the shoulders
    braid = np.sin(a * 22 + np.sin(r * 40) * 2) * np.sin(yy * 60 + a * 6)
    return d - 0.012 * (braid * 0.5 + 0.5)                                           # cabled, plaited
def mask(P):
    q = P - HEAD
    d = ell(P, HEAD + [0, 0.05, -0.02], (0.095, 0.07, 0.13))
    d = np.maximum(d, -(q[:, 1] - 0.02))
    d = smin(d, np.maximum(ell(P, HEAD + [0, 0.07, 0.10], (0.05, 0.025, 0.09)), -(q[:, 1] - 0.05)), 0.02)   # its pointed crown
    d = np.maximum(d, (q[:, 2] - 0.19) + np.abs(q[:, 0]) * 1.6)                                # a gothic arch outline
    d = np.maximum(d, -ell(P, HEAD + [0, 0.045, -0.02], (0.087, 0.064, 0.122)))
    # tracery: tall pointed lancets cut through it, a rose of little arches above
    for i in range(5):
        cx = (i - 2) * 0.03
        lan = np.maximum(np.abs(q[:, 0] - cx) - 0.0095 + 0.06 * np.clip(q[:, 2] - 0.01, 0, 1) * 0.0, np.abs(q[:, 2] + 0.05) - 0.055)
        lan = np.maximum(lan, (q[:, 2] - 0.005) - (0.009 - np.abs(q[:, 0] - cx)) * 1.6)    # pointed tops
        d = np.maximum(d, -lan)
    for sx in (1, -1):
        d = np.maximum(d, -ell(P, HEAD + [sx * 0.035, 0.11, 0.045], (0.022, 0.05, 0.018)))
    return d
def hair(P):
    d = None
    for s in (1, -1):
        for k in range(3):
            b = HEAD + [s * (0.08 + 0.008 * k), 0.06 - 0.02 * k, -0.02]
            e = cap(P, b, b + [s * 0.01, 0.01, -0.22 - 0.04 * k], 0.012, 0.004)
            d = e if d is None else np.minimum(d, e)
    return d
def headpiece(P): return np.minimum(np.minimum(np.minimum(hood(P), cowl(P)), mask(P)), hair(P))

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('robe', robe, 'robe', k=0.0)
P_.add('cape', cape, 'cape', k=0.0)
P_.add('brooch', brooch, 'silver', k=0.004)
P_.add('tassels', tassels, 'tassel', k=0.0)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'cape'); AP.add('hands', hands, 'glove', k=0.0)
HP = Parts(); HP.add('hood', hood, 'cape'); HP.add('cowl', cowl, 'wool', k=0.02); HP.add('mask', mask, 'ice', k=0.0); HP.add('hair', hair, 'hair', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.72, -0.82, 0.0), (0.72, 0.52, 1.80), P_),
          (AP.sdf, 12, (-0.58, -0.16, 0.70), (0.40, 0.36, 1.70), AP),
          (headpiece, 14, (-0.34, -0.30, 1.46), (0.34, 0.32, 2.20), HP)]
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
cr = mix(ROBE_D, ROBE, np.clip(n1 * 1.4 - 0.2, 0, 1)[:, None])
ang = np.arctan2(Vb[:, 1], Vb[:, 0])
dia = (np.abs(((ang / (2 * np.pi) * 11) % 1.0) - 0.5) * 1.0 + np.abs(((zz * 4.5) % 1.0) - 0.5) * 0.35) < 0.035   # pale diamonds
cr[dia] = mix(cr[dia], FROST, 0.6)
crust = sstep(0.16, 0.02, zz) * np.clip(ridged(Vb * [1, 1, 0.5], 30.0, 2) * 1.6 - 0.4, 0, 1)
cr = mix(cr, FROST, crust[:, None])
cr[robe_outer(Vb) < -0.004] = ROBE_D * 0.4
put(look == 'robe', cr, MAT['cloth'])
cc = mix(NAVY * 0.8, NAVY_L, (np.clip(n2 * 1.5 - 0.4, 0, 1) * 0.6)[:, None])
edge = (zz - cape_hem(Vb) < 0.04) & (look == 'cape') & (KB == 0)
cc[edge] = TRIM
vine = (np.abs(np.sin(ang * 30 + zz * 18)) < 0.08) & (zz - cape_hem(Vb) < 0.14) & (zz - cape_hem(Vb) > 0.05)  # frost embroidery
cc[vine] = FROST * 0.85
cc[(KB == 0) & (cape_outer(Vb) < -0.004)] = NAVY * 0.4
put(look == 'cape', cc, MAT['cloth'])
put(look == 'silver', np.where((np.linalg.norm(Vb - [0.0, 0.233, 1.52], axis=1) < 0.026)[:, None], BLUE, TASSEL), MAT['silver'])
put(look == 'tassel', mix(TASSEL * 0.8, TASSEL, n2[:, None]), MAT['wool'])
put(look == 'wool', mix(WOOL_D, WOOL, np.clip(n2 * 1.6 - 0.3, 0, 1)[:, None]), MAT['wool'])
put(look == 'ice', mix(ICE_D, ICE, n2[:, None]), MAT['ice'])
put(look == 'hair', HAIR, MAT['cloth'])
put(look == 'glove', mix(GLOVE * 0.75, GLOVE, n2[:, None]), MAT['glove'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (robe, cape, brooch, tassels), 12 arms, 14 head (hood, cowl, mask, hair)
M.K[-1][(KB == 0) & (zz < 1.15)] = 15     # kind 15: below the waist the robe and cape ride its hips

rng = np.random.default_rng(15)
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
log('icicles, crozier')
# ---- 4. icicles hanging from the mask (they ride the head) ------------------------------------------------------------
for k in range(9):
    x0 = (k - 4) * 0.02
    p = HEAD + np.array([x0, 0.105 - 0.01 * abs(k - 4) / 4, -0.125])
    L = 0.05 + 0.07 * (1 - abs(k - 4) / 4) + 0.03 * rng.random()
    u = np.linspace(0, 1, 8)
    V, F = tube(p + np.outer(u, [0, 0.005, -L]), 0.007 * (1 - u) ** 1.2 + 0.001, 6)
    M.add(V, F, ICE, 14, MAT['ice'])
# ---- 5. the Rime Crozier, frozen to its left hand -------------------------------------------------------------------
segs = np.linspace(STAFF_Z0 + 0.08, STAFF_Z1 - 0.1, 9)
for i in range(len(segs) - 1):                                                  # six-sided carved sections of ice
    a, b = segs[i] + 0.02, segs[i + 1] - 0.02
    zz_ = np.linspace(a, b, 6)
    rr_ = 0.032 + 0.008 * np.sin(np.linspace(0, np.pi, 6))
    V, F = tube(np.column_stack([np.full(6, STAFF_X[0]), np.full(6, STAFF_X[1]), zz_]), rr_, 6)
    cc_ = np.tile(np.array([0.50, 0.72, 0.95]), (len(V), 1)) * (0.85 + 0.25 * fbm(V * 40, 2.0))[:, None]
    M.add(V, F, np.clip(cc_, 0, 1), 10, MAT['ice'])
    V, F = tube(np.column_stack([np.full(3, STAFF_X[0]), np.full(3, STAFF_X[1]), np.linspace(b, segs[i + 1] + 0.02, 3)]), np.array([0.036, 0.040, 0.036]), SIDES + 4)
    M.add(V, F, IRON, 10, MAT['iron'])                                              # dark iron bands
V, F = tube(np.column_stack([np.full(4, STAFF_X[0]), np.full(4, STAFF_X[1]), np.linspace(STAFF_Z0 + 0.1, STAFF_Z0, 4)]), np.array([0.028, 0.02, 0.01, 0.002]), 6)
M.add(V, F, ICE_D, 10, MAT['ice'])                                                  # its point
top = np.array([STAFF_X[0], STAFF_X[1], STAFF_Z1 - 0.1])
V, F = ball(top + [0, 0, 0.05], 0.045, 14)                                           # the knob
M.add(V, F, ICE_D, 10, MAT['ice'])
u = np.linspace(0, 1, 40)                                                            # the crook, curling over toward the abbot
ang_ = u * np.pi * 1.35
crook = top + [0, 0, 0.09] + np.stack([0.13 * (1 - np.cos(ang_)) * 1.0, np.zeros_like(u), 0.16 * np.sin(ang_)], 1)
V, F = tube(crook, 0.026 * (1 - 0.45 * u) + 0.004, SIDES + 4)
M.add(V, F, np.clip(mix(IRON, ICE_D, 0.5), 0, 1), 10, MAT['ice'])
for k in range(10):                                                                  # ice leaves along the crook
    p = crook[int(4 + 34 * k / 9)]
    d0 = rng.normal(size=3); d0 /= np.linalg.norm(d0)
    pts = np.array([p, p + d0 * 0.03, p + d0 * 0.055])
    V, F = tube(pts, np.array([0.004, 0.014, 0.001]), 4)
    M.add(V, F, ICE, 10, MAT['ice'])
hang = crook[-1] + np.array([0.0, 0.0, -0.02])
V, F = tube(np.array([crook[26], crook[26] + [0, 0, -0.06]]), np.array([0.003, 0.003]), 5)
M.add(V, F, IRON, 10, MAT['iron'])
LC = crook[26] + np.array([0, 0, -0.10])
V, F = ball(LC, np.array([0.045, 0.045, 0.05]), 14)
M.add(V, F, BLUE, 9, MAT['glow'])                                                    # the lantern's light
for z_, r_ in ((0.05, 0.03), (-0.05, 0.028)):                                        # its iron caps
    V, F = tube(np.array([LC + [0, 0, z_ - 0.008 * np.sign(z_)], LC + [0, 0, z_ + 0.01 * np.sign(z_)]]), np.array([r_, r_ * 0.5]), 8)
    M.add(V, F, IRON, 10, MAT['iron'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
