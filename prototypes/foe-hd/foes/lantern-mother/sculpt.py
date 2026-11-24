# The Lantern Mother's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on the
# Rime-Abbot's (foes/rime-abbot/sculpt.py): arms and head as pieces of their own; a pole in one hand, a lantern in the other.
#
# Chris's sheet (art-in/3d/sheets/sheet-lantern-mother.webp): the last lamplighter of Misthollow. A deep black hood with a
# crown of small white flowers round it; a pale grey face, eyes glowing lamp-yellow, wavy silver hair; a thick knitted
# shawl over her shoulders, cabled, its hem hung with tassels (to a point at the back); a black double-breasted coat with
# brass buttons; a leather belt with a brass buckle, a pouch at her left hip; a grey apron embroidered with leaves, its hem
# scalloped; a long full black skirt to the ground. In her right hand the long brass lamp-pole she lit the Hollow's lamps
# with, hooked at the top, a little bell hanging from it; in her raised left hand a six-sided brass lantern, burning.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.91 m to the top of the hood (the eyes 1.78 m, the belt 1.13 m, the pole 2.13 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0095, 2: 0.006, 3: 0.0048}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

BLACK = np.array([0.07, 0.06, 0.08]); BLACK_L = np.array([0.17, 0.15, 0.18]); KNIT = np.array([0.20, 0.17, 0.20])
KNIT_D = np.array([0.09, 0.08, 0.10]); SKIN = np.array([0.55, 0.58, 0.62]); SKIN_D = np.array([0.36, 0.39, 0.44])
HAIR = np.array([0.80, 0.80, 0.78]); BRASS = np.array([0.72, 0.52, 0.22]); BRASS_D = np.array([0.40, 0.27, 0.10])
LEATHER = np.array([0.36, 0.24, 0.12]); APRON = np.array([0.36, 0.34, 0.30]); APRON_D = np.array([0.22, 0.21, 0.18])
WHITE = np.array([0.90, 0.88, 0.80]); LEAF = np.array([0.28, 0.33, 0.18]); FLAME = np.array([1.0, 0.70, 0.25])
EYE = np.array([1.0, 0.85, 0.35]); WOOD = np.array([0.45, 0.32, 0.15])
MAT = {'cloth': (0.9, 0.0), 'wool': (0.95, 0.0), 'skin': (0.6, 0.0), 'brass': (0.35, 0.9), 'leather': (0.6, 0.0),
       'glow': (0.2, 0.0), 'petal': (0.7, 0.0)}

HIP = np.array([0, 0.0, 1.02]); WAIST = 1.13; CH = np.array([0, 0.01, 1.36]); SHC = np.array([0, 0.0, 1.53])
NECK0 = np.array([0, 0.0, 1.55]); NECK1 = np.array([0, 0.02, 1.68]); HEAD = np.array([0, 0.03, 1.76])
SH = {s: np.array([s * 0.18, 0.0, 1.53]) for s in (1, -1)}
ELB = {1: np.array([0.24, 0.0, 1.27]), -1: np.array([-0.28, 0.16, 1.36])}
WRI = {1: np.array([0.33, 0.06, 1.17]), -1: np.array([-0.30, 0.31, 1.63])}          # her left hand raised, the lantern in it
POLE = np.array([0.375, 0.07]); POLE_Z0, POLE_Z1 = 0.03, 1.98
GRIP = {1: np.array([POLE[0], POLE[1], 1.15]), -1: np.array([-0.30, 0.33, 1.70])}
LANT = np.array([-0.30, 0.34, 1.50])                                                   # the lantern's middle

def body(P):
    d = ell(P, CH, (0.17, 0.12, 0.20))
    d = smin(d, ell(P, (0, 0.01, 1.18), (0.14, 0.10, 0.10)), 0.06)
    d = smin(d, ell(P, HIP, (0.17, 0.12, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.22, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.055, 0.05), 0.03)
    return d
# ---- 1. the skirt, the coat, the buttons, belt and pouch, the apron, the shawl and its tassels --------------------------
def skirt_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((WAIST - z) / WAIST, 0, 1) ** 0.8
    ang = np.arctan2(y, x)
    sk = np.sqrt((x / (0.17 + 0.27 * k)) ** 2 + ((y + 0.02 * k) / (0.13 + 0.23 * k)) ** 2) - 1
    d = smin(body(P) - 0.02, np.maximum(sk * 0.15, z - WAIST - 0.02), 0.06)
    fold = np.sin(ang * 13 + 1.5 * fbm(P * [1, 1, 0.3], 2.0)) * 0.5 + 0.5
    return d - 0.045 * fold * k ** 1.3                                                    # deep folds, deepest at the hem
def skirt(P):
    z = P[:, 2]
    d = np.abs(skirt_outer(P)) - 0.009
    hem = 0.02 + 0.015 * np.sin(np.arctan2(P[:, 1], P[:, 0]) * 17)
    return np.maximum(np.maximum(d, hem - z), z - 1.62)
def coat(P):
    return np.maximum(body(P) - 0.022, WAIST - 0.03 - P[:, 2])                          # the bodice, to the belt
def buttons(P):
    d = None
    for sx in (1, -1):
        for zz in (1.34, 1.27, 1.20):
            q, nn = project(A([[sx * 0.065, 0.2, zz]]), coat, it=10)
            e = sph(P, q[0] + nn[0] * 0.004, 0.014)
            d = e if d is None else np.minimum(d, e)
    return d
def belt(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    r = np.sqrt((x / 0.19) ** 2 + (y / 0.15) ** 2)
    d = np.maximum(np.abs(r - 1) * 0.16 - 0.010, np.abs(z - WAIST) - 0.024)
    bk = np.array([0, 0.158, WAIST])
    d = np.minimum(d, np.maximum(rbox(P, bk, (0.035, 0.008, 0.03), 0.004), -rbox(P, bk + [0, 0.004, 0], (0.022, 0.02, 0.017), 0.002)))
    return d
def pouch(P):
    c = np.array([-0.17, 0.15, WAIST - 0.09])
    d = rbox(P, c, (0.05, 0.03, 0.055), 0.015)
    d = smin(d, rbox(P, c + [0, 0.012, 0.04], (0.052, 0.025, 0.02), 0.01), 0.006)       # its flap
    return d
def apron(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    so = skirt_outer(P)
    d = np.abs(so - 0.012) - 0.004
    d = np.maximum(d, -y)
    bottom = 0.58 + 0.02 * np.abs(np.sin(x * 70))                                         # a scalloped hem
    d = np.maximum(d, np.maximum(np.abs(x) - (0.13 + 0.03 * np.clip((WAIST - z) / 0.5, 0, 1)), np.maximum(bottom - z, z - WAIST + 0.01)))
    return d
def shawl_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = smin(body(P) - 0.045, ell(P, SHC + [0, -0.01, -0.05], (0.245, 0.16, 0.13)), 0.08)
    d = smin(d, ell(P, NECK0 + [0, 0.0, 0.03], (0.13, 0.12, 0.07)), 0.05)
    ang = np.arctan2(y, x)
    cable = np.sin(ang * 26 + np.sin(z * 50) * 1.6) * np.sin(z * 55 + ang * 3)           # knitted cables
    return d - 0.009 * (cable * 0.5 + 0.5)
def shawl_hem(P):
    side = np.abs(np.arctan2(P[:, 0], -P[:, 1])) / np.pi                                  # 0 at the back, 1 at the front
    return 1.38 - 0.19 * np.clip(1 - side * 2.2, 0, 1)                                    # to a point at the back
def shawl(P):
    d = np.abs(shawl_outer(P)) - 0.014
    return np.maximum(np.maximum(d, shawl_hem(P) - P[:, 2]), P[:, 2] - 1.66)
def tassels(P):
    d = None
    for k in range(26):
        a = 2 * np.pi * k / 26
        x0, y0 = math.cos(a) * 0.30, math.sin(a) * 0.22
        h = shawl_hem(A([[x0, y0, 1.3]]))[0]
        q, nn = project(A([[x0, y0, h + 0.01]]), shawl_outer, it=10)
        b = q[0] + nn[0] * 0.01
        e = sph(P, b, 0.011)
        e = np.minimum(e, cap(P, b + [0, 0, -0.01], b + [0, 0, -0.075], 0.010, 0.017))
        d = e if d is None else np.minimum(d, e)
    return d
# ---- 2. arms, the head (hood, face, eyes, hair) ------------------------------------------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.07, 0.068), cap(P, ELB[s], WRI[s], 0.068, 0.08), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - WRI[s]) @ ax
    d = d - 0.006 * fbm(P, 9.0) * sstep(-0.12, 0.0, t)                                    # a worn, ragged cuff
    d = np.maximum(d, t + 0.005)
    return np.maximum(d, -np.maximum(cap(P, WRI[s] - ax * 0.10, WRI[s] + ax * 0.05, 0.05, 0.068), -(t + 0.06)))
def hands(P):
    d = None
    for s in (1, -1):
        ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s])
        e = cap(P, WRI[s] - ax * 0.08, WRI[s] + ax * 0.01, 0.032, 0.03)                 # the wrist
        g = GRIP[s]
        if s > 0:                                                                          # a fist round the pole
            e = smin(e, ell(P, g + [-0.03, 0.0, 0.0], (0.035, 0.045, 0.05)), 0.02)
            for i in range(4):
                ci = np.array([POLE[0], POLE[1], g[2] + 0.021 * (i - 1.5)])
                arc = [ci + 0.03 * np.array([math.cos(a), math.sin(a), 0]) for a in np.linspace(math.pi * 0.7, math.pi * 2.1, 5)]
                e = smin(e, chain(P, arc, 0.012, 0.010), 0.004)
            e = smin(e, cap(P, g + [-0.025, 0.035, 0.03], g + [0.0, 0.03, 0.025], 0.012, 0.011), 0.005)   # the thumb
        else:                                                                              # a fist up round the lantern's ring
            e = smin(e, ell(P, g, (0.04, 0.042, 0.048)), 0.02)
            for i in range(4):
                b = g + [0.02 * (i - 1.5), 0.03, 0.015]
                e = smin(e, chain(P, [b, b + [0, 0.012, -0.025], b + [0, -0.01, -0.04]], 0.011, 0.010), 0.004)
        d = e if d is None else np.minimum(d, e)
    return d
def hood(P):
    o = smin(ell(P, HEAD + [0, -0.03, 0.0], (0.145, 0.155, 0.15)), ell(P, NECK0 + [0, -0.02, 0.04], (0.15, 0.13, 0.07)), 0.07)
    o = o - 0.007 * (np.sin(np.arctan2(P[:, 1] - HEAD[1], P[:, 0]) * 6 + 2 * fbm(P, 3.0)) * 0.5 + 0.5) - 0.005 * fbm(P, 12.0)
    d = np.abs(o) - 0.012
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.17, -0.03], (0.10, 0.14, 0.13)), -(P[:, 1] - HEAD[1] - 0.03)))
    return np.maximum(d, NECK0[2] - 0.05 - P[:, 2])
def face(P):
    d = ell(P, HEAD + [0, 0.035, -0.015], (0.072, 0.08, 0.095))
    d = smin(d, ell(P, HEAD + [0, 0.10, -0.01], (0.010, 0.012, 0.025)), 0.012)          # the nose
    d = smin(d, ell(P, HEAD + [0, 0.07, -0.08], (0.035, 0.03, 0.025)), 0.02)            # the chin
    for sx in (1, -1):
        d = np.maximum(d, -ell(P, HEAD + [sx * 0.03, 0.11, 0.015], (0.02, 0.025, 0.012)))   # the eye sockets
    return smin(d, cap(P, NECK1 + [0, 0.0, -0.02], HEAD + [0, 0.01, -0.06], 0.045, 0.045), 0.02)
def hair(P):
    d = None
    for s in (1, -1):
        for k in range(4):
            b = HEAD + [s * (0.06 + 0.008 * k), 0.06 - 0.022 * k, 0.04]
            pts = [b + [s * 0.012 * math.sin(i * 1.4 + k), 0.004 * i, -0.045 * i] for i in range(5)]
            e = chain(P, [np.array(p) for p in pts], 0.016, 0.007)
            d = e if d is None else np.minimum(d, e)
    return d
def headpiece(P): return np.minimum(np.minimum(hood(P), face(P)), hair(P))

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('skirt', skirt, 'skirt', k=0.0)
P_.add('coat', coat, 'coat', k=0.0)
P_.add('buttons', buttons, 'brass', k=0.003)
P_.add('belt', belt, 'leather', k=0.0)
P_.add('pouch', pouch, 'leather', k=0.004)
P_.add('apron', apron, 'apron', k=0.0)
P_.add('shawl', shawl, 'knit', k=0.0)
P_.add('tassels', tassels, 'knit', k=0.0)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'coat'); AP.add('hands', hands, 'skin', k=0.0)
HP = Parts(); HP.add('hood', hood, 'hood'); HP.add('face', face, 'skin', k=0.0); HP.add('hair', hair, 'hair', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.62, -0.56, 0.0), (0.62, 0.52, 1.72), P_),
          (AP.sdf, 12, (-0.42, -0.12, 1.02), (0.44, 0.42, 1.74), AP),
          (headpiece, 14, (-0.22, -0.24, 1.46), (0.22, 0.26, 1.96), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)])
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0); zz = Vb[:, 2]; xx = Vb[:, 0]
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', BLACK * 0.5, MAT['cloth'])
cs = mix(BLACK * 0.8, BLACK_L, np.clip(n1 * 1.5 - 0.3, 0, 1)[:, None] * 0.7)
cs = mix(cs, BLACK * 0.5, np.clip(-skirt_outer(Vb) * 0, 0, 1)[:, None])
put(look == 'skirt', cs, MAT['cloth'])
put(look == 'coat', mix(BLACK * 0.8, BLACK_L, (np.clip(n2 * 1.6 - 0.4, 0, 1) * 0.6)[:, None]), MAT['cloth'])
put(look == 'brass', mix(BRASS_D, BRASS, n2[:, None]), MAT['brass'])
lth = mix(LEATHER * 0.7, LEATHER, n2[:, None])
lth[(look == 'leather') & (np.abs(xx) < 0.04) & (np.abs(zz - WAIST) < 0.035) & (Vb[:, 1] > 0.14)] = BRASS
put(look == 'leather', lth, MAT['leather'])
ca = mix(APRON_D, APRON, n2[:, None])
lf = (np.abs(xx) < 0.004) | ((np.abs(np.abs(xx) - ((zz * 18) % 1.0) * 0.06) < 0.006) & (np.abs(xx) < 0.055))   # an embroidered sprig
ca[lf & (zz < 1.0) & (zz > 0.65)] = APRON_D * 0.7
put(look == 'apron', ca, MAT['cloth'])
put(look == 'knit', mix(KNIT_D, KNIT, np.clip(n2 * 1.6 - 0.3, 0, 1)[:, None]), MAT['wool'])
put(look == 'hood', mix(BLACK * 0.7, BLACK_L, (np.clip(n2 * 1.6 - 0.4, 0, 1) * 0.6)[:, None]), MAT['cloth'])
put(look == 'skin', mix(SKIN_D, SKIN, n2[:, None]), MAT['skin'])
put(look == 'hair', mix(HAIR * 0.8, HAIR, n2[:, None]), MAT['cloth'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (skirt, coat, belt, apron, shawl), 12 arms, 14 head (hood, face, hair)
M.K[-1][(KB == 0) & (zz < 1.05)] = 15     # kind 15: below the hips the skirt and apron ride them

rng = np.random.default_rng(16)
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
log('eyes, flowers, pole, lantern')
# ---- 4. her eyes (they glow) and the crown of flowers round her hood (they ride her head) --------------------------
for sx in (1, -1):
    V, F = ball(HEAD + [sx * 0.03, 0.105, 0.015], np.array([0.014, 0.008, 0.008]), 10)
    M.add(V, F, EYE, 7, MAT['glow'])
hoodo = lambda P: smin(ell(P, HEAD + [0, -0.03, 0.0], (0.145, 0.155, 0.15)), ell(P, NECK0 + [0, -0.02, 0.04], (0.15, 0.13, 0.07)), 0.07)
for k in range(15):
    a = 2 * np.pi * k / 15
    pt = HEAD + [math.cos(a) * 0.2, math.sin(a) * 0.2 - 0.03, 0.06 + 0.04 * math.sin(a)]
    q, nn = project(A([pt]), hoodo, it=12)
    c, n = q[0] + nn[0] * 0.02, nn[0]
    u = np.cross(n, [0, 0, 1.0]); u /= np.linalg.norm(u) + 1e-9; v = np.cross(n, u)
    for j in range(5):
        b = 2 * np.pi * j / 5 + k
        V, F = ball(c + (u * math.cos(b) + v * math.sin(b)) * 0.012, np.array([0.009, 0.009, 0.009]), 8)
        M.add(V, F, WHITE, 14, MAT['petal'])
    V, F = ball(c + n * 0.004, 0.005, 6)
    M.add(V, F, BRASS, 14, MAT['petal'])
    for j in range(2):
        b = a + (j - 0.5) * 0.35
        p2 = HEAD + [math.cos(b) * 0.2, math.sin(b) * 0.2 - 0.03, 0.06 + 0.04 * math.sin(b)]
        q2, _ = project(A([p2]), hoodo, it=12)
        V, F = tube(np.array([c - n * 0.004, q2[0] + nn[0] * 0.012]), np.array([0.006, 0.002]), 4)
        M.add(V, F, LEAF, 14, MAT['petal'])
# ---- 5. the lamp-pole in her right hand ----------------------------------------------------------------------------------
zs = np.linspace(POLE_Z0, POLE_Z1, 30)
V, F = tube(np.column_stack([np.full(30, POLE[0]), np.full(30, POLE[1]), zs]), np.full(30, 0.017), SIDES + 2)
M.add(V, F, np.clip(np.tile(WOOD, (len(V), 1)) * (0.8 + 0.4 * fbm(V * 30, 2.0))[:, None], 0, 1), 10, MAT['leather'])
for z_ in (0.06, 0.55, 1.42, 1.80, 1.95):                                               # brass rings
    V, F = tube(np.array([[POLE[0], POLE[1], z_ - 0.015], [POLE[0], POLE[1], z_], [POLE[0], POLE[1], z_ + 0.015]]), np.array([0.019, 0.024, 0.019]), SIDES + 2)
    M.add(V, F, BRASS, 10, MAT['brass'])
u = np.linspace(0, 1, 36); ang_ = u * np.pi * 1.3                                        # the hook, curling over toward her
top = np.array([POLE[0], POLE[1], POLE_Z1])
hook = top + np.stack([-0.07 * (1 - np.cos(ang_)), np.zeros_like(u), 0.08 * np.sin(ang_) + 0.05 * u * 0], 1)
V, F = tube(hook, 0.016 * (1 - 0.4 * u) + 0.002, SIDES + 2)
M.add(V, F, BRASS, 10, MAT['brass'])
arm = np.array([[POLE[0], POLE[1], 1.90], [POLE[0] + 0.05, POLE[1], 1.92], [POLE[0] + 0.07, POLE[1], 1.88]])
V, F = tube(arm, np.array([0.006, 0.006, 0.005]), 6)                                     # a little arm, and the bell on it
M.add(V, F, BRASS, 10, MAT['brass'])
bz = np.linspace(1.875, 1.82, 8); br = 0.008 + 0.022 * ((1.875 - bz) / 0.055) ** 1.6
V, F = tube(np.column_stack([np.full(8, POLE[0] + 0.07), np.full(8, POLE[1]), bz]), br, SIDES + 4)
M.add(V, F, BRASS, 10, MAT['brass'])
# ---- 6. the lantern in her left hand (its brass rides that hand as kind 8, its flame as kind 9) ----------------------------
L0, L1 = LANT[2] - 0.09, LANT[2] + 0.09
V, F = tube(np.array([[LANT[0], LANT[1], L0 + 0.01], [LANT[0], LANT[1], L1 - 0.01]]), np.array([0.085, 0.085]), 6)
M.add(V, F, FLAME, 9, MAT['glow'])                                                         # the glass, lit from inside
for j in range(6):                                                                          # its six brass corners
    a = 2 * np.pi * j / 6
    c = LANT + [math.cos(a) * 0.092, math.sin(a) * 0.092, 0]
    V, F = tube(np.array([c + [0, 0, -0.095], c + [0, 0, 0.095]]), np.array([0.008, 0.008]), 6)
    M.add(V, F, BRASS, 8, MAT['brass'])
    for zc in (0.0, 0.06, -0.06):                                                           # pointed tracery over the panes
        pa = c + [0, 0, zc]; pb = LANT + [math.cos(a + np.pi / 6) * 0.082, math.sin(a + np.pi / 6) * 0.082, zc + 0.02]
        V, F = tube(np.array([pa, pb]), np.array([0.003, 0.003]), 4)
        M.add(V, F, BRASS_D, 8, MAT['brass'])
for zc, r0, r1 in ((L1, 0.108, 0.108), (L0, 0.108, 0.108)):
    V, F = tube(np.array([[LANT[0], LANT[1], zc - 0.012], [LANT[0], LANT[1], zc + 0.012]]), np.array([r0, r1]), 6)
    M.add(V, F, BRASS, 8, MAT['brass'])
rz = np.linspace(L1 + 0.012, L1 + 0.10, 6)                                                 # the roof, its cap and ring
V, F = tube(np.column_stack([np.full(6, LANT[0]), np.full(6, LANT[1]), rz]), np.linspace(0.115, 0.018, 6), 6)
M.add(V, F, BRASS_D, 8, MAT['brass'])
th = np.linspace(0, 2 * np.pi, 20); ring = np.column_stack([LANT[0] + 0.03 * np.cos(th), np.full(20, LANT[1]), L1 + 0.13 + 0.03 * np.sin(th)])
V, F = tube(ring, np.full(20, 0.005), 6)
M.add(V, F, BRASS, 8, MAT['brass'])
fz = np.linspace(L0 - 0.012, L0 - 0.12, 7)                                                 # the finial under it
V, F = tube(np.column_stack([np.full(7, LANT[0]), np.full(7, LANT[1]), fz]), np.array([0.08, 0.045, 0.02, 0.024, 0.014, 0.006, 0.001]), 6)
M.add(V, F, BRASS, 8, MAT['brass'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
