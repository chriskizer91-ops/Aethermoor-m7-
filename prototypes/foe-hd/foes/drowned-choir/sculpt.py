# The drowned choir's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned's (foes/drowned/sculpt.py): arms, legs and head meshed as pieces of their own; ribbons of weed.
#
# Chris's sheet (art-in/3d/sheets/sheet-drowned-choir.webp): a chorister drowned with the choir: a red cassock to the
# ground, torn and holed at its hem; over it a white lace surplice to the thigh, stained green with weed, its hem and
# wide sleeves scalloped and cut through with eyelets in four-petalled flowers; a red-brown cape on its shoulders; its
# green-grey hands clasped at its breast round a brass bell, a green tassel hanging under it; and for a head a gnarl of
# dark wood crusted with little skulls, yellow-green weed rising out of it and blowing back.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.95 m to the tips of its weed (its shoulders 1.38 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0085, 2: 0.0052, 3: 0.0042}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

RED = np.array([0.42, 0.08, 0.06]); RED_D = np.array([0.22, 0.05, 0.04]); LACE = np.array([0.80, 0.80, 0.82])
LACE_S = np.array([0.45, 0.52, 0.30]); CAPE = np.array([0.36, 0.12, 0.08]); SKIN = np.array([0.33, 0.40, 0.36])
SKIN_D = np.array([0.18, 0.24, 0.22]); WOOD = np.array([0.20, 0.13, 0.09]); WOOD_L = np.array([0.33, 0.24, 0.17])
BONE = np.array([0.84, 0.82, 0.74]); WEED = np.array([0.24, 0.31, 0.08]); WEED_L = np.array([0.52, 0.56, 0.16])
BRASS = np.array([0.72, 0.54, 0.22]); BRASS_L = np.array([0.90, 0.74, 0.40]); TASSEL = np.array([0.18, 0.36, 0.34])
MAT = {'cloth': (0.85, 0.0), 'lace': (0.8, 0.0), 'skin': (0.6, 0.0), 'wood': (0.85, 0.0), 'bone': (0.6, 0.0),
       'weed': (0.35, 0.0), 'brass': (0.3, 0.95)}

HIP = np.array([0, 0.0, 0.86]); CH = np.array([0, 0.01, 1.20]); SHC = np.array([0, 0.0, 1.36])
NECK0 = np.array([0, 0.0, 1.38]); NECK1 = np.array([0, 0.03, 1.47]); HEAD = np.array([0, 0.05, 1.60])
SH = {s: np.array([s * 0.16, 0.0, 1.36]) for s in (1, -1)}
ELB = {s: np.array([s * 0.20, 0.05, 1.05]) for s in (1, -1)}
WRI = {s: np.array([s * 0.07, 0.22, 1.12]) for s in (1, -1)}          # both forearms come forward: the hands clasp
HAND = {s: np.array([s * 0.02, 0.26, 1.15]) for s in (1, -1)}
THI = {s: np.array([s * 0.09, 0.0, 0.84]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.10, 0.02, 0.45]) for s in (1, -1)}
ANK = {s: np.array([s * 0.10, -0.01, 0.09]) for s in (1, -1)}

def body(P):
    d = ell(P, CH, (0.165, 0.115, 0.19))
    d = smin(d, ell(P, (0, 0.01, 1.0), (0.145, 0.105, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.16, 0.11, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.21, 0.10, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.055, 0.05), 0.03)
    return d
# ---- 1. the cassock (to the ground), the surplice (to the thigh), the cape ------------------------------------------
def cassock_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = body(P) - 0.02
    k = np.clip((0.95 - z) / 0.95, 0, 1)
    sk = np.sqrt((x / (0.19 + 0.11 * k)) ** 2 + (y / (0.15 + 0.08 * k)) ** 2) - 1
    sk = np.maximum(sk * 0.15, z - 1.05)
    d = smin(d, sk, 0.08)
    ang = np.arctan2(y, x)
    return d - 0.012 * (np.sin(ang * 9 + 0.6 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(0.95, 0.4, z)       # long folds
def cassock(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(cassock_outer(P)) - 0.007
    hem = 0.03 + 0.04 * np.abs(np.sin(np.arctan2(x, y + 1e-6) * 13 + 2 * fbm(P, 3.0))) ** 2 + 0.12 * (fbm(P * [1, 1, 0.2] + 2, 8.0) - 0.4)
    d = np.maximum(d, hem - z)
    d = np.maximum(d, z - 1.30)
    hn = fbm(P * [1, 1, 0.5] + 9, 9.0, 2)
    return np.maximum(d, np.where(z < 0.40, -(0.53 - hn) * 0.3, -1.0))       # torn and holed low down
def surplice_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = body(P) - 0.05
    k = np.clip((1.25 - z) / 0.65, 0, 1)                                      # it flares from the chest, loose
    sk = np.sqrt((x / (0.20 + 0.14 * k)) ** 2 + ((y - 0.01) / (0.15 + 0.10 * k)) ** 2) - 1
    sk = np.maximum(sk * 0.16, z - 1.32)
    d = smin(d, sk, 0.08)
    ang = np.arctan2(y, x)
    return d - 0.024 * (np.sin(ang * 11 + 1.6 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(1.25, 0.75, z)     # loose folds
def scallop_hem(P, z0, n):
    ang = np.arctan2(P[:, 1], P[:, 0])
    return z0 - 0.028 * np.abs(np.sin(ang * n)) ** 0.6                       # round scallops
def eyelets(P, z0, n):
    """four-petalled flowers cut through, in a band above the hem"""
    ang = np.arctan2(P[:, 1], P[:, 0])
    a = (ang * n / (2 * np.pi)) % 1.0 - 0.5
    u = a * (2 * np.pi * 0.27 / n) * 1.0 / 0.012                                # across, in units of petal size
    v = (P[:, 2] - z0) / 0.012
    rr = np.sqrt(u ** 2 + v ** 2); th = np.arctan2(v, u)
    petal = rr - (1.0 + 0.9 * np.abs(np.cos(2 * th)))                         # four petals
    return petal * 0.012
def surplice(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(surplice_outer(P)) - 0.006
    d = np.maximum(d, scallop_hem(P, 0.66, 18) - z)
    d = np.maximum(d, z - 1.42)
    d = np.maximum(d, -eyelets(P, 0.72, 18))                                  # the lace
    d = np.maximum(d, -(np.min(np.stack([cap(P, SH[s] + [s * 0.03, 0, -0.04], ELB[s], 0.085, 0.08) for s in (1, -1)], 1), 1)))
    return d
def cape(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    o = smin(ell(P, SHC + [0, -0.01, -0.03], (0.25, 0.17, 0.16)), cap(P, NECK0, NECK1 - [0, 0, 0.04], 0.085, 0.075), 0.05)
    d = np.abs(o) - 0.008
    d = np.maximum(d, 1.24 + 0.03 * np.cos(np.arctan2(y, x) * 2) - z)        # a short shoulder cape
    d = np.maximum(d, z - 1.53)                                                # its collar up round the neck
    d = np.maximum(d, -np.maximum(np.abs(x) - 0.035, -y))                      # a narrow opening at the throat
    return d

# ---- 2. arms (surplice sleeves and hands), legs (hidden; feet at the hem), the head ---------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    a = SH[s] + [s * 0.01, 0, -0.01]
    d = smin(cap(P, a, ELB[s], 0.075, 0.09), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.25, 0.10, 0.13), 0.03)
    # wide surplice sleeves: they hang open below the forearm, scalloped
    d = smin(d, ell(P, ELB[s] + (WRI[s] - ELB[s]) * 0.35 + [0, 0, -0.10], (0.10, 0.11, 0.13)), 0.05)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s]); t = (P - (WRI[s] - ax * 0.05)) @ ax
    d = np.maximum(d, t - 0.02 * np.abs(np.sin(np.arctan2(P[:, 2] - WRI[s][2], P[:, 0] - WRI[s][0]) * 7)))
    d = np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.15, WRI[s] + ax * 0.05, 0.07, 0.10), -(t + 0.05)))   # hollow at the cuff
    d = np.maximum(d, (0.90 - P[:, 2]) * 0.5 + 0.0)
    return d
def hands(P):
    # clasped at the breast: palms together, fingers laced over the backs of the other hand
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.03, 0.05, 0.045))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.032, 0.03), 0.02)
        for i in range(4):
            b = HAND[s] + [0.0, 0.01, 0.025 - 0.017 * i]
            pts = [b, b + [-s * 0.035, 0.012, -0.003], b + [-s * 0.055, -0.01, -0.005], b + [-s * 0.06, -0.035, -0.008]]
            e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.011, 0.0085), 0.005)
        th = HAND[s] + [-s * 0.005, 0.03, 0.04]
        e = smin(e, chain(P, [th, th + [-s * 0.01, 0.02, 0.025], th + [-s * 0.012, 0.025, 0.045]], 0.013, 0.01), 0.006)
        d = e if d is None else np.minimum(d, e)
    return d
def arms(P): return np.minimum(np.minimum(sleeve(P, 1), sleeve(P, -1)), hands(P))
def legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.03], KNEE[s], 0.085, 0.07), cap(P, KNEE[s], ANK[s], 0.07, 0.05), 0.03)
        foot = np.maximum(smin(ell(P, ANK[s] + [0, 0.07, -0.05], (0.055, 0.11, 0.045)), sph(P, ANK[s], 0.055), 0.03), -P[:, 2])
        d = smin(e, foot, 0.03) if d is None else np.minimum(d, smin(e, foot, 0.03))
    return d
def headcore(P):
    # a gnarl of dark wood: knotted lumps, a jutting brow
    d = ell(P, HEAD, (0.10, 0.11, 0.15))                                      # tall, narrowing up into the weed
    d = smin(d, cap(P, NECK1 - [0, 0, 0.06], HEAD, 0.06, 0.08), 0.03)
    d = smin(d, cap(P, HEAD + [0, 0, 0.05], HEAD + [0, -0.03, 0.16], 0.07, 0.04), 0.04)
    for i in range(7):
        a = i * 0.9; c = HEAD + [math.cos(a) * 0.07, math.sin(a) * 0.07 + 0.02, 0.02 * math.sin(i * 2.1)]
        d = smin(d, sph(P, c, 0.035), 0.025)
    return d - 0.006 * (ridged(P * [1, 1, 0.4], 25.0, 2) - 0.5)

# ---- 3. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('cassock', cassock, 'red', k=0.0)
P_.add('surplice', surplice, 'lace', k=0.0)
P_.add('cape', cape, 'cape', k=0.0)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'lace'); AP.add('hands', hands, 'skin', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.42, -0.36, -0.01), (0.42, 0.36, 1.52), P_),
          (AP.sdf, 12, (-0.36, -0.16, 0.85), (0.36, 0.36, 1.45), AP),
          (legs, 13, (-0.22, -0.12, -0.01), (0.22, 0.24, 0.88), None),
          (headcore, 14, (-0.14, -0.10, 1.38), (0.14, 0.20, 1.72), None)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)] if parts else np.full(len(Vg), 'skin' if kd == 13 else 'wood'))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0); n3 = fbm(Vb * [1, 1, 0.3] + 2, 8.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', RED_D * 0.5, MAT['cloth'])
cr = mix(RED_D, RED, np.clip(n2 * 1.4 - 0.2, 0, 1)[:, None])
cr = mix(cr, np.array([0.20, 0.25, 0.14]), (sstep(0.4, 0.0, Vb[:, 2]) * np.clip(n1 * 1.8 - 0.5, 0, 1))[:, None])   # weed-stained low down
cr[cassock_outer(Vb) < -0.003] *= 0.45
put(look == 'red', cr, MAT['cloth'])
cl = mix(LACE * 0.82, LACE, n2[:, None])
cl = mix(cl, LACE_S, (np.clip((n3 - 0.45) * 3.5, 0, 1) * 0.75)[:, None])       # streaked green where the weed lay on it
cl[surplice_outer(Vb) < -0.003] *= 0.6
put(look == 'lace', cl, MAT['lace'])
put(look == 'cape', mix(CAPE * 0.7, CAPE, n2[:, None]), MAT['cloth'])
put(look == 'skin', mix(SKIN_D, SKIN, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None]), MAT['skin'])
put(look == 'wood', mix(WOOD, WOOD_L, np.clip(ridged(Vb * [1, 1, 0.4], 25.0, 2) * 1.3 - 0.2, 0, 1)[:, None]), MAT['wood'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (cassock, surplice, cape), 12 arms, 13 legs, 14 head
M.K[-1][(KB == 0) & (Vb[:, 2] < 1.0)] = 15     # kind 15: below the waist, the cassock and the surplice's flare ride its hips

rng = np.random.default_rng(4)
# ---- 4. the head: little skulls in the wood, weed rising ---------------------------------------------------------------
log('skulls, weed')
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F), sp
for k in range(14):
    a = (rng.random() - 0.5) * 2.4 + (0 if k % 2 else np.pi)                  # in two clusters, at the sides of the head
    c = HEAD + np.array([math.cos(a) * 0.09, math.sin(a) * 0.06 + 0.04, -0.03 + 0.08 * rng.random()])
    r = 0.016 + 0.006 * rng.random()
    out = c - HEAD; out /= np.linalg.norm(out)
    V, F, sp = ball(c, np.array([r, r, r * 1.05]), 12 + 2 * LV)
    cc = np.tile(BONE, (len(V), 1))
    for sx in (-1, 1):                                                          # two dark eye holes and a nose, facing out
        side = np.cross(out, [0, 0, 1.0]); side /= max(np.linalg.norm(side), 1e-6)
        e = out * 0.9 + side * sx * 0.38 + np.array([0, 0, 0.18])
        cc[(sp @ (e / np.linalg.norm(e))) > 0.92] = np.array([0.08, 0.06, 0.05])
    M.add(V, F, cc, 14, MAT['bone'])
def ribbon(pts, widths, hint, kind, colour):
    pts = np.asarray(pts, float); n = len(pts)
    t = np.gradient(pts, axis=0); t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
    side = np.cross(t, np.broadcast_to(hint, t.shape)); side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-9)
    nrm = np.cross(side, t); th = 0.0035
    a = pts + side * widths[:, None] / 2; b = pts - side * widths[:, None] / 2
    V = np.vstack([a + nrm * th, b + nrm * th, a - nrm * th, b - nrm * th]); F = []
    for i in range(n - 1):
        F += [(i, n + i, n + i + 1), (i, n + i + 1, i + 1)]
        F += [(2 * n + i, 3 * n + i + 1, 3 * n + i), (2 * n + i, 2 * n + i + 1, 3 * n + i + 1)]
        F += [(i, i + 1, 2 * n + i + 1), (i, 2 * n + i + 1, 2 * n + i)]
        F += [(n + i, 3 * n + i + 1, n + i + 1), (n + i, 3 * n + i, 3 * n + i + 1)]
    M.add(V, np.array(F), colour, kind, MAT['weed'])
for k in range(18):
    az = 2 * np.pi * k / 18 + rng.normal() * 0.2
    el = 0.7 + 0.8 * rng.random()
    base = HEAD + np.array([math.cos(az) * 0.05, math.sin(az) * 0.05 - 0.02, 0.10 + 0.06 * rng.random()])
    out = np.array([math.cos(az) * math.cos(el), math.sin(az) * math.cos(el) * 0.8, math.sin(el)]); out /= np.linalg.norm(out)
    L = 0.32 + 0.22 * rng.random(); nn = {1: 16, 2: 24, 3: 32}[LV]; u = np.linspace(0, 1, nn)
    side0 = np.cross(out, [0, 0, 1.0]); side0 = side0 / np.linalg.norm(side0) if np.linalg.norm(side0) > 1e-3 else np.array([1.0, 0, 0])
    ph = rng.random() * 6.3; fq = 6 + 4 * rng.random()
    sweep = np.array([0.0, -0.28, -0.05]) * (0.6 + 0.6 * rng.random())
    pts = base + out[None] * (u * L)[:, None] + side0[None] * (0.05 * np.sin(u * fq + ph) * (0.3 + u))[:, None] + sweep[None] * (u ** 1.7 * L)[:, None]
    w = (0.05 + 0.03 * rng.random()) * np.sin(np.pi * np.clip(u * 0.85 + 0.1, 0, 1)) ** 0.5 * (1 + 0.25 * np.sin(u * 30 + ph)) + 0.004   # frilled
    tw = np.cos(u * 4 + ph)
    hint = side0[None] * tw[:, None] + np.cross(out, side0)[None] * np.sqrt(1 - tw[:, None] ** 2)
    ribbon(pts, w, hint, 14, np.clip(mix(WEED, WEED_L, 0.2 + 0.6 * rng.random()), 0, 1))

# ---- 5. the brass bell held under the clasped hands, its tassel hanging ---------------------------------------------
log('bell')
BC = np.array([0.0, 0.29, 1.03])
zz = np.linspace(0.07, -0.07, 16)
rr = 0.032 + 0.05 * ((0.07 - zz) / 0.14) ** 1.5
rr[-2:] = [0.084, 0.078]
V, F = tube(BC[None] + np.outer(zz, [0, 0, 1.0]), rr, SIDES + 12)
ang = np.arctan2(V[:, 1] - BC[1], V[:, 0] - BC[0])
cb = mix(BRASS * 0.75, BRASS_L, (0.5 + 0.5 * np.sin(ang * 6) * np.sin((V[:, 2] - BC[2]) * 80))[:, None] * 0.5)   # its fleurs
M.add(V, F, np.clip(cb, 0, 1), 10, MAT['brass'])
V, F = tube(np.array([BC + [0, 0, 0.07], BC + [0, 0, 0.11]]), np.array([0.02, 0.014]), SIDES + 4)
M.add(V, F, BRASS, 10, MAT['brass'])
V, F = tube(np.array([BC + [0, 0, -0.05], BC + [0, 0, -0.15]]), np.array([0.005, 0.004]), 6)
M.add(V, F, TASSEL * 0.8, 10, MAT['cloth'])                                    # the cord
for k in range(14):                                                             # the tassel: strands of thread
    a = 2 * np.pi * k / 14
    p0 = BC + [math.cos(a) * 0.006, math.sin(a) * 0.006, -0.15]
    pts = np.array([p0, p0 + [math.cos(a) * 0.012, math.sin(a) * 0.012, -0.06], p0 + [math.cos(a) * 0.016, math.sin(a) * 0.016, -0.14]])
    V, F = tube(pts, np.array([0.004, 0.0035, 0.002]), 5)
    M.add(V, F, TASSEL * (0.85 + 0.3 * ((k * 0.37) % 1)), 10, MAT['cloth'])
V, F = tube(np.array([BC + [0, 0, -0.14], BC + [0, 0, -0.17]]), np.array([0.012, 0.011]), 8)
M.add(V, F, TASSEL, 10, MAT['cloth'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
