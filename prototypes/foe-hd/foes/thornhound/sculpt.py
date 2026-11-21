# The thornhound's sculpt (Foes: beasts, session 7, November 20), made in passes, shape first, the way session 6 made
# Briarmaw (prototypes/foe-hd/blender/sculpt.py).
#
# Chris's sheet (art-in/3d/sheets/sheet-thornhound.webp): a lean, long-legged wolf, dark brown fur streaked with
# taupe, a lighter bib and muzzle, amber eyes; a leafy bramble garland down his spine, with spiky golden flowers in it
# and a row of golden thorns hooking back toward the tail; long bushy tail hanging; black claws.
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across) and turned into
# metres at 0.9 m to the ear tips (the Bestiary's height for him). x is his right side, y forward, z up.
#
#   pass 1  shape   ~100k triangles: the masses, the coat as big plain tufts, thorns, garland, claws, eyes
#   pass 2  form    ~400k: every tuft splits into strands with broken tips; leaves and flowers rounder
#   pass 3  detail  ~1M:   finer strands within the strands, a little grain
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K)
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../pages/beasts/kit'))
import numpy as np
from sdf import *
from coat import Coat, tri

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'build')
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)

TALL_PX = 716; GROUND = 788; MID = 900       # the side view: ear tips at 72, paws at 788; y = 0 at px 900
S = 0.9 / TALL_PX                            # metres a sheet pixel
VOX = {1: 0.0056, 2: 0.0031, 3: 0.0019}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]; SEG = {1: 6, 2: 9, 3: 12}[LV]
LO, HI = (-0.27, -0.66, -0.005), (0.27, 0.60, 0.93)

def p(xo, px, py):
    """a point from the sheet: xo pixels to his right (front view), px/py on the side view"""
    return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S          # radii in sheet pixels
def topx(P):
    """sheet pixels for points: across, side x, side y"""
    return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

# ---- 1. the shape ---------------------------------------------------------------------------------------------------
# legs: (across, then joints on the side view); the near (left, x < 0) legs stand a little apart from the far ones,
# as the sheet draws him
LEGS = {
    'fl': [(80, 1030, 425), (80, 998, 525), (82, 978, 690), (84, 992, 745)],
    'fr': [(-80, 1062, 425), (-80, 1042, 525), (-82, 1050, 690), (-84, 1070, 745)],
    'bl': [(78, 668, 440), (84, 740, 555), (90, 648, 625), (94, 700, 745)],
    'br': [(-78, 625, 440), (-84, 672, 560), (-90, 540, 628), (-94, 560, 745)],
}
for k in LEGS: LEGS[k] = [p(*j) for j in LEGS[k]]
EYES = [p(s * 30, 1247, 226) for s in (1, -1)]
NOSE = p(0, 1328, 266)
TAIL = [p(0, 492, 370), p(0, 458, 428), p(0, 442, 495), p(0, 444, 555), p(0, 456, 612)]   # hung clear of the haunches

def head_sdf(P):
    h = ell(P, p(0, 1208, 220), r(46, 54, 48))                                      # skull
    h = smin(h, ell(P, p(0, 1178, 238), r(42, 46, 52)), 0.02)                        # back of the head into the neck
    h = smin(h, cap(P, p(0, 1242, 236), p(0, 1316, 262), 27 * S, 14 * S, scale=(0.82, 1, 1.12)), 0.016)  # muzzle, long
    h = smin(h, ell(P, p(0, 1258, 212), r(22, 24, 14)), 0.01)                        # the stop, forehead to muzzle
    h = smin(h, ell(P, NOSE, r(11, 12, 10)), 0.006)                                  # nose
    h = smin(h, cap(P, p(0, 1215, 280), p(0, 1305, 292), 17 * S, 8 * S, scale=(1.0, 1, 0.85)), 0.01)   # lower jaw
    for s in (1, -1):
        h = smin(h, ell(P, p(s * 27, 1198, 248), r(22, 30, 29)), 0.014)            # cheeks
        h = smin(h, ell(P, p(s * 24, 1244, 208), r(18, 22, 10)), 0.01)             # brows
        h = smax(h, -ell(P, EYES[0 if s > 0 else 1], r(11, 9, 6)), 0.004)          # eye sockets
        h = smax(h, -ell(P, p(s * 6, 1346, 266), r(3.5, 4, 3)), 0.002)             # nostrils
        # ears: tall, pointed, thin from front to back, their tips leaning out a little
        a = p(s * 36, 1162, 198); b = p(s * 52, 1156, 66)
        thin = np.array([s * 0.55, 0.85, 0.0])             # the opening faces forward and a little out
        e = flat_cap(P, a, b, 38 * S, 2 * S, thin, 0.36)
        cup = flat_cap(P, a + thin.astype(np.float32) * 0.011 + np.array([0, 0, 0.014], np.float32), b + thin.astype(np.float32) * 0.006 - np.array([0, 0, 0.02], np.float32), 24 * S, 1 * S, thin, 0.18)
        h = smin(h, smax(e, -cup, 0.004), 0.012)
    return h

def body_sdf(P):
    d = ell(P, p(0, 1003, 400), r(64, 132, 96))                                      # chest, deep, narrowing below
    d = smin(d, ell(P, p(0, 1015, 360), r(80, 110, 58)), 0.04)                       # the broad top of the chest
    d = smin(d, ell(P, p(0, 1045, 342), r(64, 85, 52)), 0.03)                        # shoulder blades, withers
    d = smin(d, cap(P, p(0, 980, 412), p(0, 720, 400), 80 * S, 56 * S, scale=(0.95, 1, 1)), 0.05)  # ribs into the loin
    d = smin(d, cap(P, p(0, 1050, 335), p(0, 560, 362), 42 * S, 42 * S, scale=(1.4, 1, 1)), 0.03) # the back
    d = smin(d, ell(P, p(0, 610, 432), r(66, 105, 85)), 0.04)                        # haunches
    d = smin(d, cap(P, p(0, 1052, 360), p(0, 1150, 255), 58 * S, 44 * S, scale=(0.9, 1, 1)), 0.03)  # neck
    d = smin(d, head_sdf(P), 0.025)
    for k, J in LEGS.items():
        front = k[0] == 'f'
        if front:
            d = smin(d, chain(P, J, [40 * S, 28 * S, 20 * S, 21 * S], 0.012), 0.04)
            d = smin(d, ell(P, J[0] + r(-np.sign(J[0][0]) * 10, 0, -10), r(34, 58, 75)), 0.03)   # shoulder, upper arm
        else:
            d = smin(d, ell(P, (J[0] + J[1]) * 0.5 + r(-np.sign(J[0][0]) * 8, -18, 6), r(48, 82, 98)), 0.04)   # the thigh
            d = smin(d, chain(P, J, [40 * S, 29 * S, 19 * S, 20 * S], 0.01), 0.03)
        sx = 1 if J[0][0] > 0 else -1
        c = J[3] + r(sx * 4, 24, -16)
        d = smin(d, ell(P, c, r(30, 40, 19)), 0.012)                                  # the paw
        for i in range(4):                                                            # and its four toes
            ang = (i - 1.5) * 0.36
            d = smin(d, ell(P, c + np.array([math.sin(ang) * 0.026, math.cos(ang) * 0.034, -0.002], np.float32), r(10, 13, 11)), 0.005)
    d = smin(d, chain(P, TAIL, [15 * S, 24 * S, 31 * S, 22 * S, 2 * S], 0.02, scale=(0.75, 1, 1)), 0.03)
    return np.maximum(d, -P[:, 2])

# ---- 2. the coat --------------------------------------------------------------------------------------------------
def zones(P):
    xo, sx, sy = topx(P)
    ax = np.abs(xo)
    head = sstep(1150, 1190, sx) * (1 - sstep(320, 360, sy))
    face = head * sstep(1205, 1235, sx)
    ears = head * (1 - sstep(170, 195, sy)) * sstep(28, 34, ax)
    muzzle = sstep(1255, 1280, sx) * (1 - sstep(320, 360, sy))
    legs = sstep(510, 560, sy)
    lower = sstep(600, 650, sy)
    paws = sstep(718, 740, sy)
    ruff = np.exp(-(((sx - 1150) / 75) ** 2 + ((sy - 330) / 110) ** 2)) * (1 - face)
    bib = np.exp(-(((sx - 1160) / 60) ** 2 + ((sy - 420) / 100) ** 2 + (xo / 60) ** 2))
    cheek = head * np.exp(-(((sx - 1195) / 30) ** 2 + ((sy - 262) / 40) ** 2)) * sstep(20, 40, ax)
    tail = sstep(505, 485, sx) * sstep(370, 400, sy)
    belly = np.exp(-(((sy - 500) / 32) ** 2)) * sstep(740, 800, sx) * (1 - sstep(1100, 1140, sx))
    haunch = np.exp(-(((sx - 600) / 90) ** 2 + ((sy - 440) / 80) ** 2)) * sstep(40, 80, ax)
    elbow = np.exp(-(((sx - 1015) / 30) ** 2 + ((sy - 520) / 35) ** 2))
    back = sstep(410, 360, sy) * sstep(520, 560, sx) * (1 - head)
    return dict(head=head, face=face, ears=ears, muzzle=muzzle, legs=legs, lower=lower, paws=paws, ruff=ruff, bib=bib,
                cheek=cheek, tail=tail, belly=belly, haunch=haunch, elbow=elbow, back=back)

def tuft_len(P):
    Z = zones(P)
    L = np.full(len(P), 0.15)
    L = mix(L, 0.15, Z['haunch']); L = mix(L, 0.12, Z['back'])
    L = mix(L, 0.09, Z['legs']); L = mix(L, 0.065, Z['lower']); L = mix(L, 0.03, Z['paws'])
    L = mix(L, 0.11, Z['elbow'] * (1 - Z['lower'])); L = mix(L, 0.13, Z['belly'])
    L = mix(L, 0.17, Z['ruff']); L = mix(L, 0.15, Z['bib'])
    L = mix(L, 0.13, Z['tail'])
    L = mix(L, 0.055, Z['head']); L = mix(L, 0.08, Z['cheek']); L = mix(L, 0.026, Z['face'] * (1 - Z['cheek']))
    L = mix(L, 0.016, Z['muzzle']); L = mix(L, 0.03, Z['ears'])
    return L

def flow(P, N):
    x = P[:, 0]; Z = zones(P)
    v = np.stack([0 * x, -np.ones_like(x), -0.45 + 0 * x], 1)                         # back toward the tail, a little down
    down = np.tile([0, -0.15, -1.0], (len(P), 1))
    side = sstep(0.03, 0.08, np.abs(x)) * (1 - Z['back'])
    w = np.maximum(Z['legs'], side * 0.6)
    v = v * (1 - w[:, None]) + down * w[:, None]
    rf = np.maximum(Z['ruff'], Z['bib'])[:, None]
    v = v * (1 - rf) + np.stack([np.sign(x) * 0.25, 0.25 + 0 * x, -1 + 0 * x], 1) * rf        # ruff and bib hang down
    hd = Z['head'][:, None]
    v = v * (1 - hd) + np.stack([np.sign(x) * 0.35, -np.ones_like(x), -0.1 + 0 * x], 1) * hd  # the face combed back
    ch = Z['cheek'][:, None]
    v = v * (1 - ch) + np.stack([np.sign(x) * 0.7, -0.8 + 0 * x, -0.6 + 0 * x], 1) * ch       # cheek ruffs flare
    er = Z['ears'][:, None]
    v = v * (1 - er) + np.tile([0, 0, 1.0], (len(P), 1)) * er                                    # ear fur up
    tl = Z['tail'][:, None]
    v = v * (1 - tl) + np.tile([0, -0.12, -1.0], (len(P), 1)) * tl
    v = v + 0.14 * (np.stack([fbm(P * 8 + 3, 3.0), fbm(P * 8 + 7, 3.0), fbm(P * 8 + 11, 3.0)], 1) - 0.5)
    v = v - N * np.sum(v * N, 1, keepdims=True)
    return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)

def bare(P):
    xo, sx, sy = topx(P)
    b = P[:, 2] < 0.006
    b |= np.linalg.norm((P - NOSE) / r(20, 20, 18), axis=1) < 1
    for e in EYES: b |= np.linalg.norm((P - e) / r(13, 12, 10), axis=1) < 1
    b |= (np.abs(xo) < 22) & (sx > 1250) & (np.abs(sy - (278 + (sx - 1252) * 0.18)) < 5)       # the lips
    return b

log('coat')
def hscale(P):
    Z = zones(P)
    return mix(mix(mix(mix(mix(1, 2.0, Z['belly']), 2.4, Z['tail']), 1.6, Z['ruff']), 0.6, Z['lower'] * (1 - Z['paws'])), 0.45, Z['face'])
coat = Coat(body_sdf, LO, HI, tuft_len, flow, bare, LV=LV, VOX=VOX, seed=17, n_samples=300000, spacing=float(os.environ.get('SPACING', 0.24)),
            width=(0.38, 0.08), height=(0.10, 0.03), hmax=0.02, sample_vox=0.008, hscale=hscale, barb=0.45, style='lock',
            sway=0.3, tip_soft=float(os.environ.get('TIPSOFT', 1.4)), groove_depth=0.22, grooves=(2, 4), round_=0.75)

# tuft colours: dark brown-black, streaked taupe in patches that run with the fur, the bib, muzzle and lower legs tan
DARK = np.array([0.20, 0.155, 0.135]); DARK2 = np.array([0.27, 0.21, 0.175]); TAUPE = np.array([0.55, 0.45, 0.38])
TAN = np.array([0.52, 0.42, 0.33]); TAN2 = np.array([0.40, 0.31, 0.24])
rng = np.random.default_rng(5)
Zt = zones(coat.TP)
streak = np.clip((fbm(coat.TP * np.array([10, 3.5, 7]) + 2, 3.0) - 0.43) * 5, 0, 1)
TC = mix(DARK, DARK2, rng.random(coat.n)[:, None])
TC = mix(TC, mix(TAUPE, TAN2, rng.random(coat.n)[:, None]), (streak * 0.85)[:, None])
TC = mix(TC, mix(TAUPE, TAN, 0.3), (Zt['bib'] * 0.8)[:, None])
TC = mix(TC, mix(TAN, TAUPE, 0.4), (Zt['cheek'] * 0.8)[:, None].clip(0, 1))
TC = mix(TC, TAN2, (Zt['lower'] * 0.45 * (1 - Zt['paws']))[:, None])
TC = mix(TC, DARK, (Zt['paws'] * 0.6)[:, None])
TC = mix(TC, mix(TAUPE, TAN2, rng.random(coat.n)[:, None]), (Zt['tail'] * (0.35 + 0.5 * sstep(500, 600, topx(coat.TP)[2])))[:, None])
TC = TC * (0.9 + 0.2 * rng.random(coat.n))[:, None]

def full_sdf(P):
    d = body_sdf(P)
    band = np.abs(d) < coat.HMAX + 0.01
    if band.any():
        d = d.copy(); d[band] -= coat.height(P[band])
    if LV >= 3: d = d - 0.0007 * (vnoise(P, 260.0) - 0.5)
    return d

# ---- 3. the body with its coat -------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
Vb, Fb = mc(full_sdf, VOX, LO, HI, band=coat.HMAX + 0.012, coarse=4)
log('body tris', len(Fb))
top, tid, ts, tq = coat.height(Vb, True)
has = top > 0.0006
FACEC = np.array([0.24, 0.18, 0.15])
col = np.tile(FACEC, (len(Vb), 1)).astype(np.float64)
shade = 0.42 + 0.78 * ts ** 0.8
if LV >= 2: shade = shade * (1 - 0.22 * tri(tq + 0.5) ** 3)
col[has] = TC[tid[has]] * shade[has, None] + (np.clip((ts[has] - 0.65) * 2.5, 0, 1) * 0.06)[:, None]
crev = np.clip(1 - top / 0.004, 0, 1) * (zones(Vb)['face'] < 0.5)
col = col * (1 - 0.5 * crev[:, None])
Zb = zones(Vb)
xo, sx, sy = topx(Vb)
muz_top = 236 + (sx - 1250) * 0.33                       # the line along the top of the muzzle (sheet px)
tan_side = sstep(muz_top + 6, muz_top + 18, sy) * sstep(1225, 1260, sx) * (1 - sstep(300, 310, sy))
col = mix(col, TAN * (0.85 + 0.3 * fbm(Vb, 120.0))[:, None], (tan_side * 0.9)[:, None])
col = mix(col, np.array([0.17, 0.14, 0.13]), (Zb['muzzle'] * (1 - tan_side) * 0.7)[:, None])
nose = np.clip(1.5 - np.linalg.norm((Vb - NOSE) / r(17, 17, 15), axis=1), 0, 1)[:, None]
col = mix(col, np.array([0.05, 0.045, 0.05]), np.clip(nose * 1.6, 0, 1))
xo, sx, sy = topx(Vb)
lips = np.exp(-((sy - (279 + (sx - 1252) * 0.18)) / 4.0) ** 2) * (np.abs(xo) < 24) * (sx > 1240)
col = mix(col, np.array([0.07, 0.05, 0.05]), lips[:, None])
for e in EYES:
    ring_ = np.clip(1.5 - np.linalg.norm((Vb - e) / r(15, 13, 11), axis=1), 0, 1)[:, None]
    col = mix(col, np.array([0.06, 0.05, 0.045]), ring_ * 0.9)                           # the dark rim round the eye
    brow = np.exp(-np.sum(((Vb - e - r(0, -6, 14)) / r(14, 16, 6)) ** 2, 1))[:, None]
    col = mix(col, TAN, brow * 0.7)                                                       # the pale brow marks
pads = np.clip(1 - Vb[:, 2] / 0.012, 0, 1)[:, None]
col = mix(col, np.array([0.08, 0.06, 0.06]), pads)
earin = Zb['ears'] * (np.abs(xo) < 47) * (sx > 1162)
col = mix(col, np.array([0.30, 0.22, 0.19]), (earin * 0.6)[:, None])
M.add(Vb, Fb, np.clip(col, 0, 1), 0)

def surf(pt, out=0.0):
    Pp, Nn = project(np.array([pt], np.float32), full_sdf)
    return Pp[0].astype(float) + Nn[0] * out, Nn[0].astype(float)
def drop(pts, z0=0.95):
    P_ = np.column_stack([pts, np.full(len(pts), z0)]).astype(np.float32)
    for _ in range(80):
        d_ = full_sdf(P_); P_[:, 2] -= np.maximum(d_, 0.0008) * 0.9
    return P_

# ---- 4. the garland: twisted bramble down the spine, leaves, flowers ------------------------------------------------
log('garland')
VINE = np.array([0.30, 0.24, 0.12]); DKV = np.array([0.20, 0.15, 0.08])
LEAF = np.array([0.19, 0.25, 0.10]); LEAF2 = np.array([0.27, 0.32, 0.13]); LEAFD = np.array([0.12, 0.17, 0.07])
GOLD = np.array([0.80, 0.55, 0.16]); PALE = np.array([0.95, 0.76, 0.36]); THB = np.array([0.24, 0.14, 0.06])
OCHRE = np.array([0.50, 0.31, 0.09]); THTIP = np.array([0.74, 0.54, 0.24])
spine_px = np.array([[1085, 285], [1070, 290], [1060, 285], [980, 300], [880, 305], [780, 308], [680, 318], [590, 335],
                     [530, 360], [490, 385], [470, 420]], float)
L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(spine_px, axis=0), axis=1))]
ns = 160
ss_ = np.linspace(0, L_[-1], ns)
spx = np.interp(ss_, L_, spine_px[:, 0])
sp_top = drop(np.column_stack([np.zeros(ns), (spx - MID) * S]))
SN = grad(full_sdf, sp_top)
for _ in range(4): sp_top[1:-1] = (sp_top[:-2] + 2 * sp_top[1:-1] + sp_top[2:]) / 4
st, sN_, sB_ = frames(sp_top.astype(float))
vr = 0.0075
for k in range(3):
    a = ss_ / 26.0 + k * 2 * np.pi / 3
    side = np.cross(st, SN); side /= np.linalg.norm(side, axis=1, keepdims=True)
    off = (np.cos(a)[:, None] * side * 0.011 + (np.sin(a)[:, None] * 0.5 + 0.7) * SN * 0.008)
    V, F = tube(sp_top + off, np.full(ns, vr * (0.9 - 0.15 * k)), SIDES)
    M.add(V, F, mix(VINE, DKV, 0.3 * k), 3)
# side sprigs off the garland over the shoulders and the hips (front and back views: it spills down his sides)
sprigs = []
grng = np.random.default_rng(23)
for i in range(ns):
    t_ = ss_[i] / L_[-1]
    if i % 2: continue
    wide = 0.6 + 0.9 * np.exp(-((t_ - 0.12) / 0.1) ** 2) + 0.9 * np.exp(-((t_ - 0.78) / 0.12) ** 2)
    for s in (1, -1):
        if grng.random() < 0.75:
            sprigs.append((i, s, wide * (0.6 + 0.5 * grng.random())))
leaves = []
for i, s, wide in sprigs:
    base = sp_top[i]; side = np.cross(st[i], SN[i]); side /= np.linalg.norm(side)
    # a short stem curving down the flank, laid on the fur
    pts = [base + side * s * 0.012 * j * wide + SN[i] * 0.003 for j in range(6)]
    pts = np.array(pts, np.float32)
    pts, pn = project(pts, full_sdf); pts = pts + pn * 0.006
    V, F = tube(pts, np.linspace(0.0045, 0.0022, 6), max(5, SIDES - 1))
    M.add(V, F, VINE, 3)
    for j in (2, 3, 4, 5):
        leaves.append((pts[j], pn[j], side * s, st[i]))
for i in range(0, ns, 2):
    side = np.cross(st[i], SN[i]); side /= np.linalg.norm(side)
    for s in (1, -1):
        leaves.append((sp_top[i] + side * s * 0.008, SN[i], side * s + st[i] * grng.uniform(-0.6, 0.3), st[i]))
nl, nw = {1: (4, 3), 2: (7, 5), 3: (9, 7)}[LV]
for (b0, n0, outw, along) in leaves:
    dirn = outw * 0.75 - along * 0.7 + n0 * grng.uniform(-0.05, 0.2) + grng.normal(0, 0.12, 3)
    ln = grng.uniform(0.042, 0.06)
    up = n0 + grng.normal(0, 0.12, 3)
    V, F, U = leaf(b0 + n0 * 0.004, dirn, up, ln, ln * grng.uniform(0.36, 0.44), curl=grng.uniform(0.05, 0.22),
                   fold=0.3, nl=nl, nw=nw, thick=0.0016, serr=0.10 if LV >= 2 else 0, single=LV == 1)
    c = mix(mix(LEAF, LEAF2, grng.random()), LEAFD, grng.random() * 0.5)
    U = np.asarray(U)
    cc = np.tile(c, (len(V), 1)) * (0.8 + 0.35 * U)[:, None]
    M.add(V, F, cc, 4)
log('leaves', len(leaves))
# flowers: spiky golden puffs (the sheet's dandelion-thistle heads)
fl_t = [0.06, 0.12, 0.19, 0.25, 0.33, 0.41, 0.49, 0.57, 0.64, 0.71, 0.78, 0.85, 0.92]
for j, t_ in enumerate(fl_t):
    i = int(t_ * (ns - 1)); side = np.cross(st[i], SN[i]); side /= np.linalg.norm(side)
    s = 1 if j % 2 else -1
    c0 = sp_top[i] + SN[i] * 0.036 + side * s * grng.uniform(0.005, 0.03)
    R = grng.uniform(0.03, 0.036)
    V, F = ellipsoid(c0, (R * 0.55, R * 0.55, R * 0.55), nt={1: 6, 2: 9, 3: 12}[LV], npp={1: 10, 2: 14, 3: 18}[LV])
    M.add(V, F, np.array([0.55, 0.36, 0.09]), 8)
    npet = {1: 30, 2: 70, 3: 110}[LV]
    gold = np.pi * (3 - math.sqrt(5))
    for q in range(npet):
        zq = 1 - (q + 0.5) / npet * 1.6
        if zq < -0.6: continue
        rq = math.sqrt(max(0, 1 - zq * zq)); th = gold * q
        dloc = np.array([rq * math.cos(th), rq * math.sin(th), zq])
        Rm = rot_to([0, 0, 1], SN[i])
        dq = Rm @ dloc
        V, F = horn(c0 + dq * R * 0.45, dq, R * 0.62, R * 0.15, None, 0.0, max(3, SEG - 4), max(4, SIDES - 2))
        M.add(V, F, mix(GOLD, PALE, grng.random() * 0.6), 8)

# ---- 5. the thorns: a ridge hooking back toward the tail, and pairs splaying from the shoulders and hips --------------
log('thorns')
def thorn_col(V, base, length):
    t = np.clip(np.linalg.norm(V - base, axis=1) / length, 0, 1)[:, None]
    return np.clip(mix(mix(THB, OCHRE, np.clip(t * 2.2, 0, 1)), THTIP, np.clip((t - 0.55) * 1.8, 0, 1) * 0.8), 0, 1)
def add_thorn(base, d, length, r0, bend, amt=0.5, sink=0.012, power=1.05, ridges=0, hook=2.0):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    b = np.asarray(base, float) - d * sink
    V, F = horn(b, d, length + sink, r0, bend, amt, SEG + 2, SIDES + 2, ridges=ridges, power=power, hook=hook)
    M.add(V, F, thorn_col(V, b, length + sink), 2)
# the ridge: (side px, tip height in px above the back)
RIDGE = [(1105, 66), (1050, 88), (1000, 66), (935, 112), (865, 106), (795, 102), (720, 114), (655, 100), (590, 86), (530, 72), (482, 60)]
for px_, hpx in RIDGE:
    b0 = drop(np.array([[0.0, (px_ - MID) * S]]))[0].astype(float)
    n0 = grad(full_sdf, b0[None].astype(np.float32))[0]
    add_thorn(b0, n0 * 0.2 + np.array([0, 0.18, 1.0]), hpx * 1.12 * S, hpx * S * 0.30, [0, -1, 0], 0.75, sink=0.008, ridges=4 if LV >= 2 else 0, power=1.5, hook=3.0)
for s in (1, -1):
    for px_, py_, hpx in [(1070, 300, 66), (1015, 318, 80), (960, 315, 60), (650, 340, 70), (590, 352, 80), (530, 360, 56)]:
        b0, n0 = surf(p(s * 120, px_, py_))
        add_thorn(b0, n0 * 0.7 + np.array([s * 0.7, -0.15, 0.45]), hpx * S, hpx * S * 0.30, [0, -0.6, 0.8], 0.8, sink=0.008, power=1.5, hook=3.0)
# a small one on his crown between the ears (front view)
b0 = drop(np.array([[0.0, (1185 - MID) * S]]))[0].astype(float)
add_thorn(b0, [0, -0.25, 1.0], 22 * S, 7 * S, [0, -1, 0], 0.4, sink=0.008)

# ---- 6. claws, fangs, eyes ------------------------------------------------------------------------------------------
log('claws, fangs, eyes')
CLAW = np.array([0.09, 0.07, 0.09]); BONE = np.array([0.88, 0.84, 0.74]); EYEC = np.array([0.98, 0.66, 0.10])
for k, J in LEGS.items():
    sx = 1 if J[0][0] > 0 else -1
    c = J[3] + r(sx * 4, 24, -16)
    for i in range(4):
        ang = (i - 1.5) * 0.36
        pb = c + np.array([math.sin(ang) * 0.032, math.cos(ang) * 0.046, -0.004], np.float32)
        V, F = horn(pb, [math.sin(ang) * 0.5, 1.0, -0.15], 0.024, 0.0055, [0, 0, -1], 0.9, SEG, SIDES + 1)
        M.add(V, F, mix(CLAW, CLAW * 2.2, np.clip((V[:, 2] - 0.004) * 60, 0, 1)[:, None]), 6)
for s in ():          # (fangs: none show on the sheet with the mouth shut; to come with an open-mouth pass)
    base = p(s * 10, 1296, 270)
    V, F = horn(base, [0, 0.1, -1], 0.009, 0.0024, [0, -1, 0], 0.2, max(4, SEG - 2), max(5, SIDES - 1))
    M.add(V, F, BONE, 5)
for e in EYES:
    nt, npp = {1: 8, 2: 12, 3: 16}[LV], {1: 14, 2: 20, 3: 28}[LV]
    s = 1 if e[0] > 0 else -1
    ang = 0.30 * s
    rot = np.array([[math.cos(ang), -math.sin(ang), 0], [math.sin(ang), math.cos(ang), 0], [0, 0, 1]])
    tilt = np.array([[1, 0, 0], [0, math.cos(-0.25 * 1), -math.sin(-0.25)], [0, math.sin(-0.25), math.cos(-0.25)]])
    V, F = ellipsoid(e + r(s * -2, -1, 0), r(9.5, 8, 5.5), rot @ tilt, nt, npp)
    # amber, a dark slit pupil facing out
    out = np.array([s * 0.8, 0.6, 0.0]); out /= np.linalg.norm(out)
    rel = (V - e) / np.linalg.norm(V - e, axis=1, keepdims=True)
    facing = rel @ out
    lateral = np.abs(rel @ np.cross(out, [0, 0, 1.0]))
    pupil = (facing > 0.55) & (lateral < 0.16)
    cc = np.tile(EYEC, (len(V), 1)) * (0.75 + 0.35 * np.clip(facing, 0, 1))[:, None]
    cc[pupil] = [0.03, 0.02, 0.01]
    M.add(V, F, cc, 7)

M.save(os.path.join(OUT, f'high-{LV}.npz'))
log('saved', os.path.join(OUT, f'high-{LV}.npz'))
