# The drowned abbess's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. Built on
# the drowned cantor's (foes/drowned-cantor/sculpt.py): arms, legs and head meshed as pieces of their own.
#
# Chris's sheet (art-in/3d/sheets/sheet-drowned-abbess.webp): the abbess of Frostmere, drowned thirty years with her
# choir: a woman's face, blue with the cold, her eyes burning pale blue and weeping blue down her cheeks; a white wimple
# round it, with a round silver medallion at each ear, its edge falling in waves over her breast; a long dark veil over
# her head and down her back to the waist; a sea-green habit falling tier on tier, each flounce edged in paler water,
# wide as a bell at the ground; a belt of big pale beads, a strand of them hanging; and in her left hand, on a chain, the
# Drowned Censer: a silver lantern, pierced, burning blue.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.9 m to the top of her veil (her eyes 1.65 m, the belt 0.86 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0095, 2: 0.006, 3: 0.0050}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

HABIT = np.array([0.10, 0.26, 0.26]); HABIT_L = np.array([0.30, 0.48, 0.50]); WATER = np.array([0.55, 0.72, 0.78])
VEIL = np.array([0.07, 0.07, 0.12]); VEIL_L = np.array([0.16, 0.16, 0.24]); WIMPLE = np.array([0.62, 0.68, 0.76])
SKIN = np.array([0.36, 0.45, 0.60]); SKIN_D = np.array([0.20, 0.27, 0.40]); TEAR = np.array([0.10, 0.40, 0.70])
EYE = np.array([0.65, 0.95, 1.0]); BEAD = np.array([0.74, 0.70, 0.56]); SILVER = np.array([0.66, 0.66, 0.60])
SILVER_D = np.array([0.36, 0.36, 0.34]); BLUE = np.array([0.30, 0.75, 1.0]); UNDER = np.array([0.06, 0.08, 0.10])
MAT = {'cloth': (0.85, 0.0), 'veil': (0.9, 0.0), 'wimple': (0.8, 0.0), 'skin': (0.55, 0.0), 'eye': (0.2, 0.0),
       'bead': (0.45, 0.0), 'silver': (0.3, 0.95), 'glow': (0.3, 0.0)}

HIP = np.array([0, 0.0, 0.82]); CH = np.array([0, 0.01, 1.14]); SHC = np.array([0, 0.0, 1.30])
NECK0 = np.array([0, 0.01, 1.33]); NECK1 = np.array([0, 0.03, 1.48]); HEAD = np.array([0, 0.05, 1.62])
SH = {s: np.array([s * 0.19, 0.0, 1.30]) for s in (1, -1)}
ELB = {1: np.array([0.24, 0.0, 1.02]), -1: np.array([-0.27, 0.04, 1.06])}
WRI = {1: np.array([0.25, 0.05, 0.80]), -1: np.array([-0.40, 0.17, 1.04])}        # her left forearm forward: the censer
HAND = {1: np.array([0.25, 0.06, 0.72]), -1: np.array([-0.44, 0.19, 1.00])}
THI = {s: np.array([s * 0.09, 0.0, 0.80]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.10, 0.02, 0.43]) for s in (1, -1)}
ANK = {s: np.array([s * 0.10, -0.01, 0.09]) for s in (1, -1)}

def body(P):
    d = ell(P, CH, (0.18, 0.13, 0.19))
    d = smin(d, ell(P, (0, 0.01, 0.95), (0.16, 0.12, 0.13)), 0.06)
    d = smin(d, ell(P, HIP, (0.17, 0.12, 0.10)), 0.06)
    d = smin(d, ell(P, SHC, (0.24, 0.11, 0.06)), 0.06)
    d = smin(d, cap(P, NECK0, NECK1, 0.06, 0.055), 0.03)
    return d
# ---- 1. the habit, tier on tier, wide as a bell; the underskirt; the beads -------------------------------------------
def bell(P, top, rx0, ry0, rx1, ry1):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((top - z) / top, 0, 1) ** 0.85
    sk = np.sqrt((x / (rx0 + (rx1 - rx0) * k)) ** 2 + (y / (ry0 + (ry1 - ry0) * k)) ** 2) - 1
    return sk * min(rx0, ry0)
def habit_outer(P, grow=0.0):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = smin(body(P) - 0.04, np.maximum(bell(P, 1.15, 0.20, 0.16, 0.62, 0.48), z - 1.20), 0.08) - grow
    ang = np.arctan2(y, x)
    return d - 0.02 * (np.sin(ang * 14 + 1.5 * fbm(P, 2.0)) * 0.5 + 0.5) * sstep(1.0, 0.4, z)     # flounced folds
TIERS = [(0.68, 0.035, 1.31), (0.42, 0.018, 0.80), (0.20, 0.006, 0.52)]           # (hem, how far out, top)
def wavy_hem(P, z0, i):
    ang = np.arctan2(P[:, 1], P[:, 0])
    return z0 + 0.035 * np.sin(ang * (9 + i) + i) + 0.025 * np.sin(ang * 23 + 2 * i) + 0.03 * (fbm(P * [1, 1, 0.3] + i, 5.0) - 0.4)
def habit(P):
    z = P[:, 2]; d = None
    for i, (z0, grow, top) in enumerate(TIERS):
        e = np.abs(habit_outer(P, grow)) - 0.007
        e = np.maximum(np.maximum(e, wavy_hem(P, z0, i) - z), z - top)
        d = e if d is None else np.minimum(d, e)
    under = np.maximum(np.abs(habit_outer(P, -0.01)) - 0.007, z - 0.32)            # the black underskirt to the ground
    under = np.maximum(under, -z)
    return np.minimum(d, under)
BELT_Z = 0.86
def beads(P):
    d = None
    for k in range(26):
        a = 2 * np.pi * k / 26
        c = np.array([math.cos(a) * 0.205, math.sin(a) * 0.165 + 0.01, BELT_Z + 0.008 * math.sin(a * 3)])
        e = ell(P, c, (0.026, 0.026, 0.022))
        d = e if d is None else np.minimum(d, e)
    for k in range(5):                                                                # the strand hanging at her left
        c = np.array([-0.19 - 0.005 * k, 0.11, BELT_Z - 0.05 - 0.055 * k])
        d = np.minimum(d, ell(P, c, (0.022, 0.022, 0.026)))
    return d
# ---- 2. the veil, the wimple, the face --------------------------------------------------------------------------------
def veil(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    k = np.clip((1.76 - z) / 0.95, 0, 1)
    cone = np.maximum((np.sqrt((x / (0.15 + 0.17 * k)) ** 2 + ((y + 0.06) / (0.15 + 0.11 * k)) ** 2) - 1) * 0.15, z - HEAD[2])
    o = smin(ell(P, HEAD + [0, -0.03, 0.03], (0.15, 0.155, 0.17)), cone, 0.07)            # over her head, falling down her back
    o = o - 0.015 * (np.sin(np.arctan2(y + 0.05, x) * 8 + z * 6) * 0.5 + 0.5) * k             # it falls in heavy folds
    d = np.abs(o) - 0.009
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.16, -0.06], (0.12, 0.13, 0.24)), -(y - HEAD[1] - 0.0)))   # open at the face
    hem = 0.85 + 0.25 * sstep(-0.05, 0.12, y) + 0.04 * (fbm(P * [1, 1, 0.3], 6.0) - 0.4)       # to the waist at the back, shorter in front
    return np.maximum(np.maximum(d, hem - z), z - 1.82)
def wimple(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    o = smin(ell(P, HEAD + [0, 0.0, -0.01], (0.115, 0.12, 0.14)), ell(P, NECK0 + [0, 0.03, -0.02], (0.17, 0.125, 0.11)), 0.06)
    d = np.abs(o) - 0.006
    d = np.maximum(d, -np.maximum(ell(P, HEAD + [0, 0.13, -0.015], (0.07, 0.10, 0.10)), -(y - HEAD[1] - 0.02)))   # the face's window
    edge = 1.17 + 0.05 * np.sin(x * 40) + 0.03 * np.sin(x * 90 + 1)                   # its wavy edge over the breast
    return np.maximum(np.maximum(d, edge - z), z - 1.78)
def face(P):
    d = ell(P, HEAD + [0, 0.02, 0], (0.075, 0.085, 0.10))
    d = smin(d, ell(P, HEAD + [0, 0.07, -0.06], (0.045, 0.04, 0.035)), 0.03)         # the chin and mouth
    d = smin(d, ell(P, HEAD + [0, 0.10, -0.005], (0.012, 0.022, 0.03)), 0.012)        # the nose
    for sx in (1, -1):
        d = smin(d, ell(P, HEAD + [sx * 0.04, 0.07, -0.03], (0.03, 0.025, 0.025)), 0.02)   # cheeks
        d = smax(d, -ell(P, HEAD + [sx * 0.032, 0.088, 0.022], (0.02, 0.015, 0.012)), 0.006)   # sockets
    d = smax(d, -ell(P, HEAD + [0, 0.105, -0.05], (0.022, 0.012, 0.004)), 0.003)     # the mouth's line
    return d
def headpiece(P): return np.minimum(np.minimum(veil(P), wimple(P)), face(P))
# ---- 3. arms (wide habit sleeves, blue hands), legs (hidden) ---------------------------------------------------------
def chain(P, pts, r0, r1):
    d = None; rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.004)
    return d
def sleeve(P, s):
    d = smin(cap(P, SH[s] + [s * 0.01, 0, -0.01], ELB[s], 0.08, 0.09), cap(P, ELB[s], WRI[s] - (WRI[s] - ELB[s]) * 0.1, 0.10, 0.13), 0.03)
    ax = (WRI[s] - ELB[s]) / np.linalg.norm(WRI[s] - ELB[s])
    d = smin(d, ell(P, ELB[s] + (WRI[s] - ELB[s]) * 0.4 + [0, 0, -0.14], (0.11, 0.12, 0.16)), 0.06)      # hanging wide below
    t = (P - (WRI[s] - ax * 0.03)) @ ax
    d = np.maximum(d, t - 0.025 * np.sin(np.arctan2(P[:, 2] - WRI[s][2], P[:, 1] - WRI[s][1]) * 6))
    d = np.maximum(d, -np.maximum(cap(P, ELB[s] + ax * 0.12, WRI[s] + ax * 0.05, 0.075, 0.11), -(t + 0.05)))
    return d
def hands(P):
    d = None
    for s in (1, -1):
        e = ell(P, (WRI[s] + HAND[s]) / 2, (0.032, 0.045, 0.05) if s > 0 else (0.05, 0.04, 0.035))
        e = smin(e, cap(P, WRI[s] - (WRI[s] - ELB[s]) * 0.18, WRI[s], 0.032, 0.03), 0.02)
        for i in range(4):
            if s > 0:
                b = HAND[s] + [0.005, (i - 1.5) * 0.018, -0.005]
                pts = [b, b + [0, 0.004, -0.04], b + [-0.012, 0.008, -0.07], b + [-0.03, 0.01, -0.085]]
            else:                                                                        # curled over the censer's chain
                b = HAND[s] + [-0.01, (i - 1.5) * 0.017, -0.01]
                pts = [b, b + [-0.03, 0.003, -0.01], b + [-0.04, 0.005, -0.04], b + [-0.025, 0.006, -0.055]]
            e = smin(e, chain(P, [np.array(p, float) for p in pts], 0.011, 0.0085), 0.005)
        d = e if d is None else np.minimum(d, e)
    return d
def legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.03], KNEE[s], 0.085, 0.07), cap(P, KNEE[s], ANK[s], 0.07, 0.05), 0.03)
        foot = np.maximum(smin(ell(P, ANK[s] + [0, 0.07, -0.05], (0.055, 0.11, 0.045)), sph(P, ANK[s], 0.055), 0.03), -P[:, 2])
        d = smin(e, foot, 0.03) if d is None else np.minimum(d, smin(e, foot, 0.03))
    return d

# ---- 4. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', body, 'under')
P_.add('habit', habit, 'habit', k=0.0)
P_.add('beads', beads, 'bead', k=0.004)
AP = Parts(); AP.add('sleeves', lambda P: np.minimum(sleeve(P, 1), sleeve(P, -1)), 'habit'); AP.add('hands', hands, 'skin', k=0.0)
HP = Parts(); HP.add('veil', veil, 'veil'); HP.add('wimple', wimple, 'wimple', k=0.0); HP.add('face', face, 'skin', k=0.0)
GROUPS = [(P_.sdf, 0, (-0.70, -0.56, -0.01), (0.70, 0.56, 1.36), P_),
          (AP.sdf, 12, (-0.58, -0.18, 0.62), (0.40, 0.36, 1.42), AP),
          (legs, 13, (-0.22, -0.12, -0.01), (0.22, 0.24, 0.84), None),
          (headpiece, 14, (-0.42, -0.42, 0.78), (0.42, 0.30, 1.86), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)] if parts else np.full(len(Vg), 'under'))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
put(look == 'under', UNDER, MAT['cloth'])
ch = mix(HABIT * 0.75, HABIT_L, np.clip(n1 * 1.4 - 0.3, 0, 1)[:, None] * 0.7)
# each flounce edged in paler water: near each tier's hem, blotched
zz = Vb[:, 2]
near = np.zeros(len(Vb))
for i, (z0, grow, top) in enumerate(TIERS):
    near = np.maximum(near, sstep(0.12, 0.0, zz - wavy_hem(Vb, z0, i)) * (zz > wavy_hem(Vb, z0, i) - 0.01))
blot = np.clip((fbm(Vb * [1, 1, 0.6] + 3, 12.0) - 0.35) * 3, 0, 1)
ch = mix(ch, WATER, (near * blot * 0.85)[:, None])
ch[habit_outer(Vb) < -0.004] *= 0.5
low = zz < 0.33
ch[low & (habit_outer(Vb, -0.01) > -0.02) & (zz < 0.2)] = UNDER
put(look == 'habit', ch, MAT['cloth'])
put(look == 'bead', mix(BEAD * 0.75, BEAD, n2[:, None]), MAT['bead'])
cv = mix(VEIL, VEIL_L, (np.clip(n2 * 1.5 - 0.4, 0, 1) * 0.7)[:, None])
put(look == 'veil', cv, MAT['veil'])
cw = mix(WIMPLE * 0.8, WIMPLE, n2[:, None])
cw = mix(cw, WATER * 0.8, (sstep(1.3, 1.17, zz) * blot * 0.6)[:, None])
put(look == 'wimple', cw, MAT['wimple'])
cs = mix(SKIN_D, SKIN, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
for sx in (1, -1):                                                               # the blue tears down her cheeks
    tear = (np.abs(Vb[:, 0] - sx * 0.032) < 0.005) & (zz < HEAD[2] + 0.01) & (zz > HEAD[2] - 0.08) & (Vb[:, 1] > HEAD[1] + 0.06) & (KB == 14)
    cs[tear] = TEAR
put(look == 'skin', cs, MAT['skin'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (habit, beads), 12 arms, 13 legs, 14 head (veil, wimple, face)
M.K[-1][(KB == 0) & (zz < 0.95)] = 15     # kind 15: below the waist the habit rides her hips

rng = np.random.default_rng(8)
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
# ---- 5. her eyes, burning; the medallions at her ears ----------------------------------------------------------------
log('eyes, medallions, censer')
for sx in (1, -1):
    V, F = ball(HEAD + [sx * 0.032, 0.088, 0.022], np.array([0.016, 0.009, 0.010]), 12 + 2 * LV)
    M.add(V, F, EYE, 7, MAT['eye'])
    c = HEAD + [sx * 0.12, 0.02, -0.04]
    u = np.linspace(0, 1, 8)
    V, F = tube(c[None] + np.outer(u - 0.5, [sx * 0.014, 0, 0]), np.full(8, 0.034), SIDES + 8)
    M.add(V, F, np.clip(mix(SILVER_D, SILVER, fbm(V * 40, 2.0)[:, None]), 0, 1), 14, MAT['silver'])
# ---- 6. the Drowned Censer, on its chain from her left hand (it rides the hand) ---------------------------------------
CTOP = HAND[-1] + np.array([-0.035, 0.0, -0.02])
CC = CTOP + np.array([0.0, 0.0, -0.44])
for i in range(9):                                                               # the chain
    c = CTOP + (CC + [0, 0, 0.19] - CTOP) * (i / 8)
    a = np.linspace(0, 2 * np.pi, 13)
    e1 = np.array([1.0, 0, 0]) if i % 2 == 0 else np.array([0, 1.0, 0])
    pts = c + np.cos(a)[:, None] * e1 * 0.01 + np.sin(a)[:, None] * np.array([0, 0, 1.0]) * 0.018
    V, F = tube(pts, np.full(len(pts), 0.003), 6)
    M.add(V, F, SILVER_D, 10, MAT['silver'])
# its body: a pierced dome over a cage of arched windows, a band, a pointed foot
prof = [(0.13, 0.012), (0.11, 0.03), (0.085, 0.07), (0.06, 0.082), (0.035, 0.07), (0.02, 0.07), (-0.0, 0.075), (-0.04, 0.07), (-0.06, 0.055),
        (-0.075, 0.03), (-0.11, 0.008), (-0.13, 0.002)]
zz_ = np.array([p[0] for p in prof]) * 1.5; rr_ = np.array([p[1] for p in prof]) * 1.5   # big, like the sheet's
V, F = tube(CC[None] + np.outer(zz_, [0, 0, 1.0]), rr_, 32)
ang = np.arctan2(V[:, 1] - CC[1], V[:, 0] - CC[0]); vz = V[:, 2] - CC[2]
win = (np.abs(((ang / (2 * np.pi) * 8) % 1.0) - 0.5) < 0.30) & (vz > -0.068) & (vz < 0.045)   # eight arched windows, lit blue
cc = np.tile(SILVER, (len(V), 1)) * (0.8 + 0.2 * fbm(V * 30, 2.0))[:, None]
cc[win] = BLUE * 0.85
M.add(V, F, np.clip(cc, 0, 1), 10, MAT['silver'])
V, F = ball(CC + [0, 0, -0.012], np.array([0.09, 0.09, 0.06]), 14)            # the blue fire inside
M.add(V, F, BLUE, 9, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
