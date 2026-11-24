# The drowned's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), made in passes, shape first.
# Built on the unmade's frame (foes/unmade/sculpt.py): arms, legs and head meshed as pieces of their own.
#
# Chris's sheet (art-in/3d/sheets/sheet-drowned.webp): a man drowned a thousand years: a long black coat, sodden and
# torn into tatters at its hem and sleeves, open over a teal tabard with four green-gold studs down it; a high collar
# of pale striped cloth; baggy brown trousers bunched into heavy black boots; blue-grey hands; and where its head was,
# a mass of dark green weed in long ribbons, rising and blowing back as if still under the water, with small drowned
# lights caught in it. In its left hand, on a short chain, a little green bronze bell.
#
# Not fuzz: the weed is flat ribbons, each a real strip; the coat a shell with a torn hem and holes; the studs, bell,
# chain and lights real shapes.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 2.0 m to the tips of its weed (its collar 1.49 m, shoulders 1.39 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0075, 2: 0.0045, 3: 0.0036}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

COAT = np.array([0.075, 0.07, 0.075]); COAT_L = np.array([0.17, 0.16, 0.17]); TROU = np.array([0.20, 0.12, 0.09])
BOOT = np.array([0.12, 0.12, 0.13]); TAB = np.array([0.30, 0.48, 0.50]); STUD = np.array([0.62, 0.66, 0.30])
COLLAR = np.array([0.55, 0.62, 0.50]); SKIN = np.array([0.38, 0.45, 0.56]); SKIN_D = np.array([0.22, 0.27, 0.36])
WEED = np.array([0.10, 0.19, 0.09]); WEED_L = np.array([0.30, 0.38, 0.14]); LIGHT = np.array([0.85, 0.95, 0.55])
BRONZE = np.array([0.24, 0.42, 0.33]); BRONZE_L = np.array([0.55, 0.62, 0.38])
MAT = {'coat': (0.75, 0.0), 'cloth': (0.85, 0.0), 'boot': (0.5, 0.0), 'stud': (0.35, 0.8), 'skin': (0.6, 0.0),
       'weed': (0.35, 0.0), 'glow': (0.3, 0.0), 'bronze': (0.35, 0.85)}

# ---- 1. the body under the coat --------------------------------------------------------------------------------------
HIP = np.array([0, 0.0, 0.88]); CH = np.array([0, 0.01, 1.22]); SHC = np.array([0, 0.0, 1.38])
NECK0 = np.array([0, 0.0, 1.40]); NECK1 = np.array([0, 0.02, 1.53]); HEAD = np.array([0, 0.03, 1.60])
SH = {s: np.array([s * 0.17, 0.0, 1.38]) for s in (1, -1)}
ELB = {1: np.array([0.22, -0.01, 1.08]), -1: np.array([-0.26, 0.05, 1.13])}
WRI = {1: np.array([0.25, 0.02, 0.78]), -1: np.array([-0.40, 0.20, 1.08])}          # its left forearm forward: it holds the bell
HAND = {1: np.array([0.255, 0.03, 0.70]), -1: np.array([-0.45, 0.23, 1.05])}
THI = {s: np.array([s * 0.09, 0.0, 0.86]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.10, 0.02, 0.46]) for s in (1, -1)}
ANK = {s: np.array([s * 0.105, -0.01, 0.10]) for s in (1, -1)}

def body(P):
    d = ell(P, CH, (0.17, 0.12, 0.19))
    d = smin(d, ell(P, (0, 0.01, 1.02), (0.15, 0.11, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.16, 0.11, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.22, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.06, 0.055), 0.03)
    return d
def coat_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = body(P) - 0.035
    k = np.clip((0.95 - z) / 0.55, 0, 1)                                       # below the hips it hangs wide, to the knees
    sk = np.sqrt((x / (0.20 + 0.10 * k)) ** 2 + (y / (0.15 + 0.06 * k)) ** 2) - 1
    sk = np.maximum(sk * 0.15, z - 1.05)
    d = smin(d, sk, 0.08)
    d = d - 0.010 * (np.sin(x * 30 + 2.5 * fbm(P, 3.0) + y * 9) * 0.5 + 0.5) * sstep(1.2, 0.9, z)   # heavy folds, sodden
    return d
def coat(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(coat_outer(P)) - 0.007
    hem = 0.40 + 0.09 * np.abs(np.sin(np.arctan2(x, y + 1e-6) * 9 + 0.7)) ** 2 + 0.16 * (fbm(P * [1, 1, 0.15] + 3, 7.0) - 0.4)
    d = np.maximum(d, hem - z)                                                 # torn into tatters at the knee
    d = np.maximum(d, z - 1.43)
    # open down the front over the tabard, wider toward the hem
    w = mix(0.012, 0.085, sstep(0.86, 0.98, z)) + 0.03 * sstep(0.7, 0.4, z)     # open over the tabard, its edges meeting below
    d = np.maximum(d, -np.maximum(np.abs(x) - w, -y) * 0.6)
    # the arms come out through it (the sleeves are the arms')
    d = np.maximum(d, -(np.min(np.stack([cap(P, SH[s] + [s * 0.03, 0, -0.04], ELB[s], 0.08, 0.075) for s in (1, -1)], 1), 1)))
    hn = fbm(P * [1, 1, 0.6] + 11, 9.0, 2)                                     # holes, low down
    d = np.maximum(d, np.where(z < 1.0, -(0.47 - hn) * 0.3, -1.0))
    return d
def collar(P):
    c = NECK0 + [0, 0.005, 0.04]
    q = P - c
    r = np.sqrt((q[:, 0] / 1.1) ** 2 + (q[:, 1] / 1.0) ** 2)
    d = np.maximum(np.abs(r - 0.075) - 0.012, np.abs(q[:, 2]) - 0.065)          # a high stand-up collar
    return d
def tabard(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    w = mix(0.10, 0.075, sstep(1.35, 1.0, z)) * np.clip((z - 0.86) / 0.12, 0, 1)    # tapering to a point
    d = np.maximum(np.abs(x) - w, body(P) - 0.03)
    d = np.maximum(d, -(body(P) - 0.012))
    d = np.maximum(d, np.maximum(z - 1.40, 0.86 - z + np.abs(x) * 0.8))
    return np.maximum(d, -y)
def studs(P):
    d = None
    for i in range(4):
        z0 = 1.30 - 0.11 * i
        c, n = project(A([[0, 0.25, z0]]), lambda Q: body(Q) - 0.03, it=8)
        c = c[0] + n[0] * 0.008
        q = np.abs(P - c)
        e = (q[:, 0] + q[:, 2] * 0.62) / 1.35 + q[:, 1] * 0.9 - 0.026            # a diamond, faceted
        d = e if d is None else np.minimum(d, e)
    return d

# ---- 2. arms (with their sleeves), legs (trousers and boots), the head (core of the weed) ---------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    a, b = SH[s] + [s * 0.01, 0, -0.01], WRI[s] + (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]) * 0.03
    d1 = cap(P, a, ELB[s], 0.078, 0.085); d2 = cap(P, ELB[s], b, 0.088, 0.125)
    d = smin(d1, d2, 0.03)
    ax = (b - ELB[s]) / np.linalg.norm(b - ELB[s]); t = (P - b) @ ax
    under = sstep(0.0, -0.08, (P[:, 2] - b[2]))                                  # the cuff hangs lower underneath, in tatters
    d = np.maximum(d, t - 0.09 * under - 0.04 * (fbm(P * [1, 1, 0.3] * 3 + s, 9.0) - 0.4) - 0.015 * np.abs(np.sin(np.arctan2(P[:, 1] - b[1], P[:, 0] - b[0]) * 8)))
    d = np.maximum(d, -np.maximum(cap(P, ELB[s], b + ax * 0.05, 0.06, 0.09), -(t + 0.07)))           # hollow at the cuff
    return d
def hands(P):
    d = None
    for s in (1, -1):
        F = HAND[s]
        e = ell(P, (WRI[s] + F) / 2, (0.035, 0.045, 0.05) if s > 0 else (0.05, 0.045, 0.035))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.15, (WRI[s] + F) / 2, 0.032, 0.03), 0.02)    # the wrist, inside the cuff
        dn = np.array([0, 0, -1.0]) if s > 0 else np.array([-0.4, 0.15, -1.0]) / 1.09
        for i in range(4):
            off = (i - 1.5) * 0.019
            b = F + ([0.005, off, -0.005] if s > 0 else [-0.01 + off * 0.3, off, -0.01])
            L = 0.075 - abs(i - 1.3) * 0.008
            curl = 0.35 if s > 0 else 0.9
            pts = [b, b + dn * L * 0.45, b + dn * L * 0.8 + [-s * L * curl * 0.35, 0.01, 0], b + dn * L + [-s * L * curl * 0.7, 0.012, L * curl * 0.15]]
            e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.0115, 0.0085), 0.006)
        th0 = F + ([-0.025, 0.03, 0.02] if s > 0 else [-0.01, 0.035, 0.0])
        e = smin(e, chain(P, [th0, th0 + [-s * 0.02, 0.03, -0.03], th0 + [-s * 0.025, 0.04, -0.06]], 0.013, 0.01), 0.008)
        d = e if d is None else np.minimum(d, e)
    return d
def arms(P):
    return np.minimum(np.minimum(sleeve(P, 1), sleeve(P, -1)), hands(P))
def legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.03], KNEE[s], 0.10, 0.095), cap(P, KNEE[s], ANK[s] + [0, 0, 0.13], 0.095, 0.085), 0.04)
        e = smin(e, ell(P, ANK[s] + [0, 0.01, 0.20], (0.11, 0.11, 0.10)), 0.05)      # bunched above the boot
        e = e - 0.008 * (np.sin(P[:, 2] * 60 + np.arctan2(P[:, 1], P[:, 0] - s * 0.1) * 2) * 0.5 + 0.5)   # creases
        boot = smin(cap(P, ANK[s] + [0, 0, 0.12], ANK[s] + [0, 0, -0.03], 0.068, 0.07),
                    ell(P, ANK[s] + [0, 0.08, -0.055], (0.07, 0.13, 0.05)), 0.04)
        boot = np.maximum(boot, -P[:, 2])
        e = np.minimum(e, boot)
        d = e if d is None else np.minimum(d, e)
    return d
def headcore(P):
    return smin(ell(P, HEAD + [0, 0, -0.02], (0.06, 0.065, 0.06)), cap(P, NECK1 - [0, 0, 0.03], HEAD, 0.045, 0.05), 0.03)   # hidden in the weed

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('coat', coat, 'coat', k=0.0)
P_.add('tabard', tabard, 'tabard', k=0.0)
P_.add('studs', studs, 'stud', k=0.004)
P_.add('collar', collar, 'collar', k=0.008)
LP = Parts(); LP.add('trousers', lambda P: np.maximum(legs(P), 0.20 - P[:, 2] + 0.0 * P[:, 0]) , 'trousers'); LP.add('boots', legs, 'boot')
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'coat'); AP.add('hands', hands, 'skin', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.38, -0.30, 0.30), (0.38, 0.30, 1.52), P_),
          (AP.sdf, 12, (-0.56, -0.16, 0.55), (0.40, 0.36, 1.48), AP),
          (legs, 13, (-0.26, -0.18, -0.01), (0.26, 0.30, 0.92), LP),
          (headcore, 14, (-0.12, -0.10, 1.38), (0.12, 0.16, 1.72), None)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)] if parts else np.full(len(Vg), 'weed'))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
look[(KB == 13) & (Vb[:, 2] < 0.215)] = 'boot'; look[(KB == 13) & (Vb[:, 2] >= 0.215)] = 'trousers'
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 6.0); n2 = fbm(Vb + 5, 18.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', mix(COAT * 0.6, COAT, n1[:, None]), MAT['cloth'])
cc = mix(COAT * 0.7, COAT_L, (np.clip(n2 * 1.6 - 0.5, 0, 1) * 0.7)[:, None])                # wet black cloth, worn grey in patches
inner = coat_outer(Vb) < -0.003
cc[inner] = COAT * 0.45
put(look == 'coat', cc, MAT['coat'])
put(look == 'tabard', mix(TAB * 0.75, TAB, n2[:, None]), MAT['cloth'])
put(look == 'stud', mix(STUD * 0.7, STUD, n2[:, None]), MAT['stud'])
cl = mix(COLLAR * 0.7, COLLAR, (0.5 + 0.5 * np.sin(Vb[:, 2] * 260))[:, None])                # pale stripes round it
put(look == 'collar', cl, MAT['cloth'])
put(look == 'trousers', mix(TROU * 0.65, TROU, n2[:, None]), MAT['cloth'])
put(look == 'boot', mix(BOOT * 0.7, BOOT * 1.3, n2[:, None]), MAT['boot'])
put(look == 'skin', mix(SKIN_D, SKIN, np.clip(n1 * 1.4 - 0.2, 0, 1)[:, None]), MAT['skin'])
put(look == 'weed', mix(WEED * 0.6, WEED, n2[:, None]), MAT['weed'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (coat, tabard, collar), 12 arms, 13 legs, 14 head
M.K[-1][(KB == 0) & (look == 'coat') & (Vb[:, 2] < 0.95)] = 15     # kind 15: the coat's skirt, which hangs from its hips

rng = np.random.default_rng(3)

# ---- 4. the weed: flat ribbons rising from the head, waving and blowing back, drowned lights caught in them ----------
log('weed')
def ribbon(pts, widths, up_hint, kind, colour):
    pts = np.asarray(pts, float); n = len(pts)
    t = np.gradient(pts, axis=0); t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
    side = np.cross(t, np.broadcast_to(up_hint, t.shape)); side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-9)
    nrm = np.cross(side, t)
    th = 0.0035
    a = pts + side * widths[:, None] / 2; b = pts - side * widths[:, None] / 2
    V = np.vstack([a + nrm * th, b + nrm * th, a - nrm * th, b - nrm * th])
    F = []
    for i in range(n - 1):
        A0, B0, A1, B1 = i, n + i, i + 1, n + i + 1
        F += [(A0, B0, B1), (A0, B1, A1)]
        A0, B0, A1, B1 = 2 * n + i, 3 * n + i, 2 * n + i + 1, 3 * n + i + 1
        F += [(A0, B1, B0), (A0, A1, B1)]
        F += [(i, i + 1, 2 * n + i + 1), (i, 2 * n + i + 1, 2 * n + i)]                       # one edge
        F += [(n + i, 3 * n + i + 1, n + i + 1), (n + i, 3 * n + i, 3 * n + i + 1)]           # the other
    M.add(V, np.array(F), colour, kind, MAT['weed'])
NR = 26
for k in range(NR):
    az = 2 * np.pi * k / NR + rng.normal() * 0.2
    el = 0.45 + 0.95 * rng.random()                                             # rising, spreading out at the tips
    base = HEAD + np.array([math.cos(az) * 0.045, math.sin(az) * 0.045, -0.10 + 0.10 * rng.random()])   # from right above the collar
    out = np.array([math.cos(az) * math.cos(el), math.sin(az) * math.cos(el) * 0.8, math.sin(el)]); out /= np.linalg.norm(out)
    L = 0.42 + 0.30 * rng.random()
    nn = {1: 18, 2: 28, 3: 38}[LV]
    u = np.linspace(0, 1, nn)
    side0 = np.cross(out, [0, 0, 1.0]);  side0 = side0 / np.linalg.norm(side0) if np.linalg.norm(side0) > 1e-3 else np.array([1.0, 0, 0])
    ph = rng.random() * 6.3; fq = 5 + 4 * rng.random()
    sweep = np.array([0.0, -0.32, -0.10]) * (0.6 + 0.6 * rng.random())          # blown back, as if still under the water
    pts = base + out[None] * (u * L)[:, None] + side0[None] * (0.075 * np.sin(u * fq + ph) * (0.3 + u))[:, None] \
        + sweep[None] * (u ** 1.7 * L)[:, None]
    w = (0.06 + 0.035 * rng.random()) * np.sin(np.pi * np.clip(u * 0.85 + 0.1, 0, 1)) ** 0.5 + 0.004   # broad, like kelp
    # the ribbon turns about itself as it waves, so its flat face catches the light in places
    tw = np.cos(u * 4 + ph)
    hint = side0[None] * tw[:, None] + out[None] * 0.0 + np.cross(out, side0)[None] * np.sqrt(1 - tw[:, None] ** 2)
    ribbon(pts, w, hint, 14, np.clip(mix(WEED, WEED_L, 0.15 + 0.5 * rng.random()), 0, 1))
    for j in range(rng.integers(0, 3)):                                         # the drowned lights in it
        p = pts[int(nn * (0.3 + 0.6 * rng.random()))] + rng.normal(size=3) * 0.008
        r = 0.007 + 0.008 * rng.random()
        th_, ph_ = np.meshgrid(np.linspace(0, np.pi, 5 + 2 * LV), np.linspace(0, 2 * np.pi, 8 + 2 * LV, endpoint=False), indexing='ij')
        sp = np.stack([np.sin(th_) * np.cos(ph_), np.sin(th_) * np.sin(ph_), np.cos(th_)], -1).reshape(-1, 3)
        nt, npp = th_.shape; Fs = []
        for i in range(nt - 1):
            for jj in range(npp):
                a_ = i * npp + jj; b_ = i * npp + (jj + 1) % npp; Fs += [(a_, a_ + npp, b_ + npp), (a_, b_ + npp, b_)]
        M.add(p + sp * r, np.array(Fs), LIGHT, 9, MAT['glow'])

# ---- 5. the bell on its chain, in the left hand -------------------------------------------------------------------
log('bell')
RING = HAND[-1] + np.array([-0.035, 0.03, -0.075])
for i in range(4):                                                              # the chain: links, alternating
    c = HAND[-1] + np.array([-0.02, 0.015, -0.02]) + (RING - HAND[-1] - [-0.02, 0.015, -0.02]) * (i / 3)
    a = np.linspace(0, 2 * np.pi, 13)
    e1, e2 = (np.array([1.0, 0, 0]), np.array([0, 0, 1.0])) if i % 2 == 0 else (np.array([0, 1.0, 0]), np.array([0, 0, 1.0]))
    pts = c + np.cos(a)[:, None] * e1 * 0.009 + np.sin(a)[:, None] * e2 * 0.014
    V, F = tube(pts, np.full(len(pts), 0.0028), 6)
    M.add(V, F, BRONZE * 0.8, 10, MAT['bronze'])
BC = RING + np.array([0, 0, -0.07])
zz = np.linspace(0.06, -0.06, 14)
rr = 0.022 + 0.04 * ((0.06 - zz) / 0.12) ** 1.6
rr[-2:] = [0.066, 0.06]
V, F = tube(BC[None] + np.outer(zz, [0, 0, 1.0]), rr, SIDES + 10)
cb = np.clip(mix(BRONZE * 0.7, BRONZE_L, (0.5 + 0.5 * np.sin(np.arctan2(V[:, 1] - BC[1], V[:, 0] - BC[0]) * 5 + V[:, 2] * 90))[:, None] * 0.6), 0, 1)
M.add(V, F, cb, 10, MAT['bronze'])                                              # the bell, its scrolls in green and gold
V, F = tube(np.array([BC + [0, 0, 0.06], BC + [0, 0, 0.085]]), np.array([0.012, 0.008]), SIDES + 4)
M.add(V, F, BRONZE, 10, MAT['bronze'])
V, F = tube(np.array([BC + [0, 0, -0.03], BC + [0, 0, -0.085]]), np.array([0.004, 0.004]), 6)
M.add(V, F, BRONZE_L, 10, MAT['bronze'])                                        # the clapper
th_, ph_ = np.meshgrid(np.linspace(0, np.pi, 8), np.linspace(0, 2 * np.pi, 12, endpoint=False), indexing='ij')
sp = np.stack([np.sin(th_) * np.cos(ph_), np.sin(th_) * np.sin(ph_), np.cos(th_)], -1).reshape(-1, 3)
Fs = []
for i in range(7):
    for jj in range(12):
        a_ = i * 12 + jj; b_ = i * 12 + (jj + 1) % 12; Fs += [(a_, a_ + 12, b_ + 12), (a_, b_ + 12, b_)]
M.add(BC + [0, 0, -0.095] + sp * 0.012, np.array(Fs), BRONZE_L, 10, MAT['bronze'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
