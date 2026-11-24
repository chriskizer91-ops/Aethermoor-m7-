# The bell-ringer's sculpt (Foes: walkers, session 8, the wraiths' polish pass, November 24), shape first.
#
# Chris's sheet (art-in/3d/sheets/sheet-bell-ringer.webp): no arms, no legs, no face: a tall shroud of dark purple-black
# cloth falling from a ring of grey stones crusted with barnacles to a hem torn into layers that drag on the ground
# among seaweed and barnacles; seaweed hangs from the ring; out of the ring grows a branching coral tree, grey-green,
# where a head should be; and from its left shoulder a dark crook curves up and over, a rope at its end, holding a
# bronze bell with glowing green eyes and a green flame for a clapper.
#
# Not fuzz: the shroud is one surface in deep folds with torn layers and holes; the stones, barnacles, coral, fronds,
# crook, rope and bell real shapes.
#
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
# Measured off the sheet at 2.1 m to the top of the coral (the stone ring 1.48 m).
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.011, 2: 0.0072, 3: 0.006}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

SHROUD = np.array([0.11, 0.09, 0.15]); SHROUD_L = np.array([0.24, 0.21, 0.30]); SHROUD_G = np.array([0.12, 0.22, 0.24])
STONE = np.array([0.42, 0.44, 0.43]); STONE_D = np.array([0.25, 0.27, 0.27]); BARN = np.array([0.62, 0.60, 0.55])
FROND = np.array([0.14, 0.34, 0.33]); FROND_L = np.array([0.28, 0.50, 0.45]); CORAL = np.array([0.30, 0.42, 0.37])
CORAL_D = np.array([0.15, 0.24, 0.22]); WOOD = np.array([0.13, 0.13, 0.15]); ROPE = np.array([0.40, 0.30, 0.18])
BRONZE = np.array([0.20, 0.33, 0.33]); BRONZE_L = np.array([0.40, 0.50, 0.42]); GLOW = np.array([0.80, 1.0, 0.35])
MAT = {'cloth': (0.85, 0.0), 'stone': (0.9, 0.0), 'barn': (0.7, 0.0), 'frond': (0.45, 0.0), 'coral': (0.8, 0.0),
       'wood': (0.7, 0.0), 'rope': (0.9, 0.0), 'bronze': (0.35, 0.85), 'glow': (0.3, 0.0)}

RING_Z = 1.48
TOP = np.array([0, 0.0, RING_Z])
SHL = np.array([-0.20, 0.0, 1.46])            # its left shoulder, where the crook grows from

# ---- 1. the shroud -----------------------------------------------------------------------------------------------------
def shroud_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    t = np.clip((RING_Z - z) / RING_Z, 0, 1)                                     # 0 at the ring, 1 at the ground
    rx = 0.23 + 0.20 * t ** 0.8; ry = 0.19 + 0.17 * t ** 0.8
    yc = -0.06 * np.sin(np.pi * np.clip(t * 1.6, 0, 1))                          # hunched: it bulges at the back up high
    ang = np.arctan2(y - yc, x)
    fold = 0.022 * np.sin(ang * 11 + 0.8 * np.sin(z * 3)) * (0.4 + t) + 0.012 * np.sin(ang * 23 + z * 5) * t
    d = (np.sqrt((x / rx) ** 2 + ((y - yc) / ry) ** 2) - 1) * np.minimum(rx, ry) - fold
    d = smin(d, ell(P, (0.02, -0.05, 1.40), (0.30, 0.24, 0.16)), 0.06)          # its shoulders under the cloth
    d = np.maximum(d, z - RING_Z - 0.02)
    return d
def shroud(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    ang = np.arctan2(y, x)
    # three torn layers: each hem ragged, the outer ones shorter; holes low down
    d = None
    for i, (z0, grow, top) in enumerate(((0.55, 0.03, RING_Z), (0.28, 0.015, 0.78), (0.02, 0.0, 0.48))):   # the outer whole, the inner ones showing below it
        q = P.copy()
        e = np.abs(shroud_outer(q) - grow) - 0.007
        hem = z0 + 0.07 * np.abs(np.sin(ang * (7 + 2 * i) + i)) ** 1.5 + 0.10 * (fbm(P * [1, 1, 0.2] + i * 7, 6.0) - 0.4)
        e = np.maximum(e, hem - z) if i < 2 else np.maximum(e, -z)
        e = np.maximum(e, z - top)
        d = e if d is None else np.minimum(d, e)
    hn = fbm(P * [1, 1, 0.6] + 11, 9.0, 2)
    d = np.maximum(d, np.where(z < 0.62, -(0.515 - hn) * 0.3, -1.0))     # small holes, low down
    solid = np.maximum(shroud_outer(P) + 0.05, 0.75 - z)                         # inside the top: a core, so the ring sits on cloth
    return np.minimum(d, solid)

# ---- 2. the stone ring and its barnacles ----------------------------------------------------------------------------
rng = np.random.default_rng(11)
STONES = []
for i in range(9):
    a = 2 * np.pi * i / 9 + rng.normal() * 0.08
    c = TOP + np.array([math.cos(a) * 0.25, math.sin(a) * 0.21, 0.015 + 0.015 * rng.random()])
    STONES.append((c, a, np.array([0.085 + 0.02 * rng.random(), 0.058, 0.05 + 0.012 * rng.random()])))
def stones(P):
    d = None
    for c, a, r in STONES:
        q = P - c; ca, sa = math.cos(-a - np.pi / 2), math.sin(-a - np.pi / 2)
        q = np.stack([q[:, 0] * ca - q[:, 1] * sa, q[:, 0] * sa + q[:, 1] * ca, q[:, 2]], 1)
        e = rbox(q, np.zeros(3), r, 0.022) - 0.008 * (fbm(P * 2 + c, 9.0, 2) - 0.5)
        d = e if d is None else np.minimum(d, e)
    return d
BARNS = []
for k in range(26):
    i = rng.integers(0, len(STONES)); c, a, r = STONES[i]
    out = np.array([math.cos(a), math.sin(a), 0.4]); out /= np.linalg.norm(out)
    BARNS.append(c + out * (r[1] * 0.9) + rng.normal(size=3) * [0.03, 0.03, 0.015])
for k in range(22):                                                               # and round the hem on the ground
    a = rng.random() * 2 * np.pi
    BARNS.append(np.array([math.cos(a) * 0.44, math.sin(a) * 0.37, 0.03 + 0.03 * rng.random()]))
BARNS = np.array(BARNS)
def barnacles(P):
    d = None
    for i, c in enumerate(BARNS):
        r = 0.016 + 0.008 * ((i * 0.618) % 1.0)
        e = cap(P, c - [0, 0, r * 0.6], c + [0, 0, r * 0.2], r, r * 0.7)
        e = np.maximum(e, -cap(P, c, c + [0, 0, r], r * 0.45, r * 0.45))          # the hole in its top
        d = e if d is None else np.minimum(d, e)
    return d

# ---- 3. the crook: a dark curved post from the left shoulder, up and over ------------------------------------------
CROOK = catmull([SHL, SHL + [-0.03, 0.0, 0.14], SHL + [-0.06, 0.0, 0.26], SHL + [-0.12, 0.0, 0.33], SHL + [-0.19, 0.0, 0.34]], 40)
def crook(P):
    d = None
    rr = np.linspace(0.042, 0.03, len(CROOK))
    for i in range(len(CROOK) - 1):
        e = cap(P, CROOK[i], CROOK[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.01)
    return d - 0.004 * (fbm(P * [1, 1, 1], 30.0, 2) - 0.5)
CROOK_END = CROOK[-1]

# ---- 4. the meshes -----------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('shroud', shroud, 'cloth')
P_.add('stones', stones, 'stone', k=0.01)
P_.add('barnacles', barnacles, 'barn', k=0.004)
GROUPS = [(P_.sdf, 0, (-0.55, -0.50, -0.01), (0.55, 0.45, 1.58), P_),
          (crook, 12, (-0.48, -0.10, 1.38), (-0.10, 0.10, 1.86), None)]
VS, FS, KS, LK, off = [], [], [], [], 0
for f_, kd, lo_, hi_, parts in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)] if parts else np.full(len(Vg), 'wood'))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS); look = np.concatenate(LK)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 16.0)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
cs = mix(SHROUD * 0.7, SHROUD_L, (np.clip(n2 * 1.5 - 0.4, 0, 1) * 0.6)[:, None])
cs = mix(cs, SHROUD_G, (sstep(0.6, 0.1, Vb[:, 2]) * np.clip(n1 * 1.6 - 0.3, 0, 1) * 0.7)[:, None])   # sea-green damp toward the hem
cs[shroud_outer(Vb) < -0.004] *= 0.5
put(look == 'cloth', cs, MAT['cloth'])
put(look == 'stone', mix(STONE_D, STONE, np.clip(n2 * 1.5 - 0.2, 0, 1)[:, None]), MAT['stone'])
put(look == 'barn', mix(BARN * 0.7, BARN, n2[:, None]), MAT['barn'])
put(look == 'wood', mix(WOOD * 0.7, WOOD * 1.4, n2[:, None]), MAT['wood'])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (shroud, stones, barnacles), 12 the crook
M.K[-1][(KB == 0) & (Vb[:, 2] < 0.62)] = 15     # kind 15: the shroud's lowest part (it rides its hips; above, it bends with its trunk)

# ---- 5. the coral tree, where a head should be (it rides the head) -----------------------------------------------------
log('coral')
cr = np.random.default_rng(23)
def branch(p0, d, L, r0, depth):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = cr.normal(size=3) * 0.35
    n = {1: 7, 2: 10, 3: 13}[LV]
    pts = np.array([p0 + d * L * u + bend * L * u * u * 0.5 for u in np.linspace(0, 1, n)])
    V, F = tube(pts, r0 * (1 - 0.45 * np.linspace(0, 1, n)), max(5, SIDES))
    M.add(V, F, np.clip(mix(CORAL_D, CORAL, 0.3 + 0.5 * cr.random()), 0, 1), 14, MAT['coral'])
    tip = pts[-1]; td = pts[-1] - pts[-2]; td /= np.linalg.norm(td)
    if depth > 0:
        for k in range(2 + (depth > 1)):
            nd = td + cr.normal(size=3) * 0.75; nd[2] = abs(nd[2]) * 0.8 + 0.25
            branch(pts[int(n * (0.6 + 0.4 * cr.random())) - 1], nd, L * (0.55 + 0.15 * cr.random()), r0 * 0.6, depth - 1)
for dx, dy in [(0.0, 0.0), (-0.35, 0.1), (0.35, -0.05), (0.15, 0.3), (-0.15, -0.3)]:
    branch(TOP + [dx * 0.12, dy * 0.12, -0.02], [dx, dy, 1.0], 0.34 + 0.08 * cr.random(), 0.026, 3)
# seaweed fronds hanging from the ring, and lying round the hem (lobed, curling)
log('fronds')
def frond(p, down, side, L, w, kind):
    nu, nv = {1: 8, 2: 12, 3: 16}[LV], 5
    u = np.linspace(0, 1, nu); v = np.linspace(-1, 1, nv)
    half = w * np.sin(np.pi * np.clip(u, 0.03, 1) ** 0.7) * (0.7 + 0.3 * np.abs(np.cos(u * np.pi * 4.5)))   # lobes
    nrm = np.cross(down, side)
    U, Vv = np.meshgrid(u, v, indexing='ij')
    pos = (p[None, None] + down[None, None] * (U * L)[..., None] + side[None, None] * (Vv * half[:, None])[..., None]
           + nrm[None, None] * (0.25 * L * U ** 2 * np.sin(U * 3))[..., None])
    top = pos.reshape(-1, 3); bot = top - nrm * 0.003
    V = np.vstack([top, bot]); nn = nu * nv; F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a = i * nv + j; b = a + 1; c = a + nv; d = c + 1
            F += [(a, c, d), (a, d, b), (a + nn, b + nn, d + nn), (a + nn, d + nn, c + nn)]
    for i in range(nu - 1):
        for j in (0, nv - 1):
            a = i * nv + j; c = a + nv
            F += [(a, a + nn, c + nn), (a, c + nn, c)] if j == 0 else [(a, c, c + nn), (a, c + nn, a + nn)]
    cc = mix(FROND * 0.7, FROND_L, 0.2 + 0.6 * cr.random())
    M.add(V, np.array(F), np.clip(cc, 0, 1), kind, MAT['frond'])
for k in range(30):
    a = (k / 30) * 2 * np.pi + cr.normal() * 0.1
    if abs(a % (2 * np.pi) - np.pi) < 0.35: continue                              # not where the crook grows
    p = TOP + np.array([math.cos(a) * 0.25, math.sin(a) * 0.21, -0.04])
    out = np.array([math.cos(a), math.sin(a), 0.0])
    down = np.array([0, 0, -1.0]) + out * 0.25; down /= np.linalg.norm(down)
    frond(p, down, np.cross(down, out), 0.26 + 0.16 * cr.random(), 0.05, 0)
for k in range(30):
    a = cr.random() * 2 * np.pi
    p = np.array([math.cos(a) * 0.40, math.sin(a) * 0.34, 0.02])
    out = np.array([math.cos(a), math.sin(a), 0.0])
    up = out * 0.8 + np.array([0, 0, 0.6]) + cr.normal(size=3) * 0.2; up /= np.linalg.norm(up)
    frond(p, up, np.cross(up, [0, 0, 1.0]) / max(np.linalg.norm(np.cross(up, [0, 0, 1.0])), 1e-6), 0.20 + 0.10 * cr.random(), 0.06, 15)

# ---- 6. the rope and the bell at the crook's end (they ride the crook's end) ---------------------------------------------
log('bell')
for i in range(3):                                                                # the rope's turns round the crook
    c = CROOK_END + np.array([-0.005 + 0.012 * i, 0, 0])
    a = np.linspace(0, 2 * np.pi, 15)
    pts = c + np.cos(a)[:, None] * np.array([0, 0.036, 0]) + np.sin(a)[:, None] * np.array([0, 0, 0.036])
    V, F = tube(pts, np.full(len(pts), 0.008), 6)
    M.add(V, F, ROPE, 10, MAT['rope'])
V, F = tube(np.array([CROOK_END + [0, 0, -0.03], CROOK_END + [0, 0, -0.075]]), np.array([0.008, 0.008]), 6)
M.add(V, F, ROPE * 0.8, 10, MAT['rope'])
BC = CROOK_END + np.array([0.0, 0.0, -0.16])
zz = np.linspace(0.07, -0.07, 16)
rr = 0.03 + 0.052 * ((0.07 - zz) / 0.14) ** 1.5
rr[-2:] = [0.085, 0.078]
V, F = tube(BC[None] + np.outer(zz, [0, 0, 1.0]), rr, SIDES + 12)
M.add(V, F, np.clip(mix(BRONZE * 0.7, BRONZE_L, fbm(V * 30, 2.0)[:, None] * 0.6), 0, 1), 10, MAT['bronze'])
V, F = tube(np.array([BC + [0, 0, 0.07], BC + [0, 0, 0.095]]), np.array([0.018, 0.012]), SIDES + 4)
M.add(V, F, BRONZE, 10, MAT['bronze'])
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
for k in range(5):                                                                # its glowing eyes, round the bell
    a = 2 * np.pi * k / 5
    r0 = 0.03 + 0.052 * (0.07 / 0.14) ** 1.5
    V, F = ball(BC + [math.cos(a) * (r0 + 0.002), math.sin(a) * (r0 + 0.002), 0.0], np.array([0.012, 0.012, 0.012]), 12)
    M.add(V, F, GLOW, 9, MAT['glow'])
# the clapper: a green flame, a leaf of light hanging under the bell
u = np.linspace(0, 1, 14)
pts = BC + np.array([0, 0, -0.07]) + np.outer(u, [0, 0, -0.075])
V, F = tube(pts, 0.022 * np.sin(np.pi * np.clip(u * 0.9 + 0.08, 0, 1)) ** 0.8 + 0.002, SIDES + 4)
M.add(V, F, GLOW, 9, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
