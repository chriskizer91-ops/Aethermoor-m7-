# The mirage-wisp's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first. A small
# two-legged spirit, so arms, legs and head are pieces of their own, as on the walkers (foes/rotwarden/sculpt.py).
#
# Chris's sheet (art-in/3d/sheets/sheet-mirage-wisp.webp): a shimmer that walks on its own. A body of moving water, swirls
# of paler water running through it and bubbles caught in it; a head like a candle-flame, its tip curling, little fins
# at its sides; a white face like a mask, two dark tear-shaped eyes and a small sad mouth; a collar of points round its
# neck; stubby arms whose hands run off into drips; two short sturdy legs; a blue crystal at its heart.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 1.30 m to the tip of its flame (its face 0.88 m, its collar 0.80 m, its crystal 0.69 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0065, 2: 0.0042, 3: 0.0030}[LV]

TEAL = np.array([0.24, 0.68, 0.70]); DEEP = np.array([0.08, 0.38, 0.45]); PALE = np.array([0.70, 0.93, 0.90])
FACE = np.array([0.88, 0.94, 0.96]); FACE_D = np.array([0.62, 0.74, 0.80]); EYE = np.array([0.06, 0.14, 0.24])
BLUE = np.array([0.40, 0.80, 1.0])
MAT = {'water': (0.12, 0.0), 'face': (0.35, 0.0), 'glow': (0.1, 0.0)}

SH = {s: np.array([s * 0.11, 0.0, 0.74]) for s in (1, -1)}
ELB = {s: np.array([s * 0.19, 0.01, 0.66]) for s in (1, -1)}
WRI = {s: np.array([s * 0.25, 0.02, 0.58]) for s in (1, -1)}
HIPJ = {s: np.array([s * 0.065, 0.0, 0.42]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.068, 0.012, 0.23]) for s in (1, -1)}
ANK = {s: np.array([s * 0.07, 0.0, 0.06]) for s in (1, -1)}
HEAD = np.array([0.0, 0.0, 0.90])

def flow(P, k=1.0):
    """swirls of water running up through it"""
    a = np.arctan2(P[:, 1], P[:, 0])
    return np.sin(a * 4 + 2.2 * np.sin(P[:, 2] * 9 * k + a) + 5.0 * fbm(P, 2.5)) * 0.5 + 0.5
def bubbles(P, f, centre, n, seed, r0=0.007, r1=0.013):
    rng = np.random.default_rng(seed)
    d = None
    for _ in range(n):
        v = rng.normal(size=3); v /= np.linalg.norm(v)
        q, nn = project(A([centre + v * 0.3]), f, it=12)
        e = sph(P, q[0] + nn[0] * 0.002, r0 + (r1 - r0) * rng.random())
        d = e if d is None else np.minimum(d, e)
    return d
# ---- 1. the body and its collar of points -------------------------------------------------------------------------------
def torso0(P):
    d = smin(ell(P, (0, 0, 0.61), (0.15, 0.115, 0.19)), ell(P, (0, 0, 0.46), (0.15, 0.11, 0.09)), 0.05)
    d = smin(d, cap(P, (0, 0, 0.72), (0, 0, 0.84), 0.085, 0.075), 0.04)
    d = smin(d, ell(P, (0, 0, 0.79), (0.14, 0.12, 0.035)), 0.03)                          # its collar
    for k in range(6):                                                                     # of points
        a = math.pi / 6 + k * math.pi / 3
        b = np.array([math.cos(a) * 0.09, math.sin(a) * 0.08, 0.80])
        t = np.array([math.cos(a) * 0.21, math.sin(a) * 0.17, 0.73])
        d = smin(d, cap(P, b, t, 0.04, 0.006), 0.025)
    return d - 0.008 * flow(P)
def torso(P): return np.minimum(torso0(P), bubbles(P, torso0, np.array([0, 0, 0.6]), 9, 1))
# ---- 2. the arms (hands running off into drips) and the legs ------------------------------------------------------------
def arm0(P, s):
    d = smin(cap(P, SH[s], ELB[s], 0.065, 0.058), cap(P, ELB[s], WRI[s], 0.058, 0.052), 0.03)
    d = smin(d, ell(P, WRI[s] + [s * 0.02, 0.0, -0.025], (0.045, 0.035, 0.05)), 0.03)
    for i, (dx, dy) in enumerate(((0.03, 0.02), (0.045, -0.005), (0.02, -0.03))):
        b = WRI[s] + [s * 0.02, 0, -0.04]
        tip = b + [s * dx, dy, -0.07 - 0.02 * (i == 1)]
        d = smin(d, cap(P, b, tip, 0.025, 0.006), 0.015)
    return d - 0.006 * flow(P, 1.5)
def arms(P):
    d = np.minimum(arm0(P, 1), arm0(P, -1))
    return np.minimum(d, bubbles(P, lambda Q: np.minimum(arm0(Q, 1), arm0(Q, -1)), np.array([0, 0, 0.66]), 5, 2))
def leg0(P, s):
    d = smin(cap(P, HIPJ[s] + [0, 0, 0.04], KNEE[s], 0.075, 0.066), cap(P, KNEE[s], ANK[s], 0.066, 0.062), 0.03)
    d = smin(d, ell(P, ANK[s] + [0, 0.02, -0.03], (0.068, 0.08, 0.04)), 0.04)
    return np.maximum(d - 0.006 * flow(P, 1.3), -P[:, 2])
def legs(P):
    d = np.minimum(leg0(P, 1), leg0(P, -1))
    return np.minimum(d, bubbles(P, lambda Q: np.minimum(leg0(Q, 1), leg0(Q, -1)), np.array([0, 0, 0.25]), 5, 3))
# ---- 3. the head: a flame of water, its face a white mask ---------------------------------------------------------------
def flame(P):
    d = ell(P, HEAD + [0, -0.015, 0], (0.17, 0.17, 0.15))
    u = np.linspace(0, 1, 10)
    pts = HEAD + np.stack([0.015 * np.sin(u * 3), -0.02 - 0.06 * u ** 2 + 0.05 * u ** 6, 0.06 + 0.36 * u], 1)
    rr = 0.14 * (1 - u) ** 1.3 + 0.006
    for i in range(9):
        d = smin(d, cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1]), 0.05)
    for s in (1, -1):                                                                     # its little side fins
        d = smin(d, cap(P, HEAD + [s * 0.13, 0.0, -0.04], HEAD + [s * 0.21, -0.01, -0.10], 0.035, 0.006), 0.03)
        d = smin(d, cap(P, HEAD + [s * 0.12, -0.03, 0.06], HEAD + [s * 0.19, -0.04, 0.03], 0.03, 0.006), 0.03)
    d = np.maximum(d, -ell(P, HEAD + [0, 0.17, -0.02], (0.11, 0.06, 0.095)))          # a hollow for the face
    return d - 0.008 * flow(P, 0.9)
def face(P):
    d = ell(P, HEAD + [0, 0.075, -0.02], (0.112, 0.09, 0.092))
    for s in (1, -1):                                                                     # tear-shaped eyes, sad
        q = P - (HEAD + [s * 0.045, 0.165, -0.005])
        r_ = np.sqrt((q[:, 0] / 0.024) ** 2 + (q[:, 2] / (0.032 + 0.01 * np.clip(-q[:, 2] / 0.03, 0, 1))) ** 2) - 1
        d = np.maximum(d, -np.maximum(r_ * 0.025, np.abs(q[:, 1]) - 0.014))
    m = P - (HEAD + [0, 0.155, -0.065])
    d = np.maximum(d, -np.maximum(np.abs(m[:, 0]) - 0.012, np.abs(m[:, 2] + 30 * m[:, 0] ** 2 * -1) - 0.002))   # a small frown
    return d
def headpiece(P): return np.minimum(np.minimum(flame(P), face(P)), bubbles(P, flame, HEAD + [0, -0.05, 0.1], 7, 4))

# ---- 4. the meshes ------------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
BP = Parts(); BP.add('torso', torso, 'water')
AP = Parts(); AP.add('arms', arms, 'water')
LP = Parts(); LP.add('legs', legs, 'water')
HP = Parts(); HP.add('flame', lambda P: np.minimum(flame(P), bubbles(P, flame, HEAD + [0, -0.05, 0.1], 7, 4)), 'water'); HP.add('face', face, 'face', k=0.0)
GROUPS = [(torso, 0, (-0.25, -0.21, 0.34), (0.25, 0.21, 0.86), BP),
          (arms, 12, (-0.35, -0.11, 0.42), (0.35, 0.11, 0.84), AP),
          (legs, 13, (-0.16, -0.10, 0.0), (0.16, 0.14, 0.50), LP),
          (headpiece, 14, (-0.25, -0.20, 0.70), (0.25, 0.25, 1.34), HP)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)])
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
fl = flow(Vb, 1.2); n1 = fbm(Vb, 6.0); n2 = fbm(Vb + 3, 20.0)
cw = mix(DEEP, TEAL, np.clip(n1 * 1.3 + 0.1, 0, 1)[:, None])
fl2 = flow(Vb * 1.7 + 7.0, 1.4)
cw = mix(cw, DEEP * 0.9, (sstep(0.25, 0.05, fl) * 0.5)[:, None])
cw = mix(cw, PALE, (sstep(0.80, 0.97, fl) * 0.85 + sstep(0.86, 0.98, fl2) * 0.5).clip(0, 1)[:, None])   # paler streams
cw = mix(cw, PALE, (sstep(0.75, 0.95, n2) * 0.4)[:, None])
water = look == 'water'; col[water] = cw[water]; mat[water] = MAT['water']
fm = look == 'face'
q = Vb - (HEAD + [0, 0.07, -0.02])
cf = mix(FACE_D, FACE, np.clip(q[:, 1] / 0.085, 0, 1)[:, None] * 0.6 + 0.4 * n2[:, None])
for s in (1, -1):
    e = Vb - (HEAD + [s * 0.045, 0.165, -0.005])
    r_ = np.sqrt((e[:, 0] / 0.026) ** 2 + (e[:, 2] / (0.034 + 0.01 * np.clip(-e[:, 2] / 0.03, 0, 1))) ** 2)
    cf[r_ < 1.08] = EYE
cf[(np.abs(Vb[:, 0]) < 0.016) & (np.abs(Vb[:, 2] - (HEAD[2] - 0.065)) < 0.006) & (Vb[:, 1] < HEAD[1] + 0.152)] = EYE * 2
col[fm] = cf[fm]; mat[fm] = MAT['face']
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body and collar, 12 arms, 13 legs, 14 head (flame, face)
# ---- 5. the crystal at its heart (kind 9, glowing, riding the chest) ---------------------------------------------------
c = np.array([0.0, 0.125, 0.68])
V, F = tube(np.array([c + [0, -0.01, 0.075], c + [0, 0.012, 0.012], c + [0, 0.008, -0.075]]), np.array([0.0015, 0.042, 0.0015]), 4)
V = c + (V - c) * [1, 0.55, 1]
M.add(V, F, BLUE, 9, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
