# The sapwight's sculpt (Foes: walkers, session 8, November 20), made in passes, shape first.
#
# "A ghoul of bark and black sap. It used to be someone the Heartroot drank." Chris's sheet
# (art-in/3d/sheets/sheet-sapwight.webp: front, side, back) shows a gaunt, hunched figure wrapped in strips of bark
# that wind round its limbs and body like bandages, black sap glistening in the gaps and dripping from its face, leafy
# moss on its shoulders, hips and thighs, amber eyes, long clawed fingers, root feet, and twigs with amber buds.
#
# Not fuzz: every strip of bark is a raised shingle with a ragged lower edge, overlapping the one below; the sap is a
# glossy recess between them; the moss is lobed leaves; the fingers, toes, twigs and drips are real shapes.
#
#   pass 1  shape    ~100k: the gaunt body, the strips as plain bands, fingers, toes, twigs
#   pass 2  form     ~400k: grain down each strip, torn edges, lumps of sap in the gaps
#   pass 3  detail   ~1M:   fine grain, the leaves' veins
#
# Measured off the sheet at 2.0 m to the tips of its buds (head top 1.75 m, shoulders 1.42 m).
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0085, 2: 0.0048, 3: 0.0036}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]
S = 2.0 / 936
def sz(py): return (962 - py) * S

BARK = np.array([0.42, 0.29, 0.17]); BARK_D = np.array([0.22, 0.14, 0.08]); BARK_L = np.array([0.58, 0.42, 0.26])
SAP = np.array([0.035, 0.028, 0.025]); AMBER = np.array([1.0, 0.62, 0.16]); MOSS = np.array([0.38, 0.38, 0.13])
MOSS_D = np.array([0.26, 0.28, 0.08]); CLAW = np.array([0.16, 0.11, 0.07])
MAT = {'bark': (0.85, 0.0), 'sap': (0.12, 0.0), 'moss': (0.9, 0.0), 'amber': (0.3, 0.0), 'claw': (0.6, 0.0)}

# ---- 1. the gaunt body ----------------------------------------------------------------------------------------------
HIP = np.array([0, 0.0, 0.95]); CH = np.array([0, 0.04, 1.24]); SHC = np.array([0, 0.06, 1.40])
NECK0 = np.array([0, 0.07, 1.42]); NECK1 = np.array([0, 0.14, 1.56]); HEAD = np.array([0, 0.17, 1.645])
SH = {s: np.array([s * 0.215, 0.05, 1.405]) for s in (1, -1)}
ELB = {s: np.array([s * 0.30, 0.02, 1.06]) for s in (1, -1)}
WRI = {s: np.array([s * 0.31, 0.06, 0.84]) for s in (1, -1)}
THI = {s: np.array([s * 0.10, 0.0, 0.93]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.115, 0.03, 0.49]) for s in (1, -1)}
ANK = {s: np.array([s * 0.125, -0.01, 0.085]) for s in (1, -1)}
# the limbs and trunk as segments: (a, b, radius a, radius b, strip width, helix turns per metre, sense)
LIMBS = []
for s in (1, -1):
    LIMBS += [(SH[s], ELB[s], 0.062, 0.054, 0.11, 1.4, s), (ELB[s], WRI[s], 0.054, 0.045, 0.10, -1.6, s),
              (THI[s], KNEE[s], 0.10, 0.08, 0.13, 1.1, -s), (KNEE[s], ANK[s], 0.08, 0.062, 0.12, -1.2, -s)]
TRUNK = [(HIP, CH, 0.15, 0.165, 0.15, 0.8, 1), (CH, SHC, 0.165, 0.15, 0.15, -0.8, 1), (NECK0, NECK1, 0.06, 0.055, 0.07, 1.8, 1)]

def body(P):
    d = ell(P, CH + [0, 0, 0.04], (0.185, 0.12, 0.17))                       # chest, narrow and deep
    d = smin(d, ell(P, (0, 0.03, 1.10), (0.15, 0.10, 0.12)), 0.06)          # the pinched waist
    d = smin(d, ell(P, HIP + [0, 0, 0.0], (0.165, 0.115, 0.11)), 0.06)      # pelvis
    d = smin(d, ell(P, SHC + [0, -0.01, 0.0], (0.25, 0.10, 0.06)), 0.07)    # the shoulder yoke
    d = smin(d, cap(P, NECK0, NECK1, 0.065, 0.055), 0.04)
    for s in (1, -1):
        for a, b, ra, rb in ((SH[s], ELB[s], 0.062, 0.054), (ELB[s], WRI[s], 0.054, 0.045),
                             (THI[s], KNEE[s], 0.10, 0.08), (KNEE[s], ANK[s], 0.08, 0.062)):
            d = smin(d, cap(P, a, b, ra, rb), 0.03)
        d = smin(d, sph(P, KNEE[s] + [0, 0.02, 0], 0.07), 0.03)
        d = smin(d, sph(P, ELB[s], 0.05), 0.02)
    return d

def head(P):
    # a long skull of twisted bark, jutting forward, deep sockets, a slack jaw dripping sap
    d = ell(P, HEAD, (0.085, 0.11, 0.10))
    d = smin(d, ell(P, HEAD + [0, 0.07, -0.05], (0.07, 0.08, 0.075)), 0.04)       # the muzzle, long
    d = smin(d, ell(P, HEAD + [0, -0.03, 0.08], (0.07, 0.10, 0.06)), 0.04)        # a ridge swept back over the crown
    for sx in (1, -1):
        d = smin(d, ell(P, HEAD + [sx * 0.05, 0.08, 0.025], (0.045, 0.04, 0.025)), 0.02)   # brows
        d = smax(d, -ell(P, HEAD + [sx * 0.042, 0.115, 0.0], (0.026, 0.03, 0.022)), 0.01)  # sockets
    d = smax(d, -ell(P, HEAD + [0, 0.15, -0.075], (0.045, 0.06, 0.02)), 0.01)            # the mouth hole
    return d

# hands: a narrow palm, four long fingers curling down and a thumb, claws at the tips (fingers are tubes, below)
def palm(P):
    d = None
    for s in (1, -1):
        e = ell(P, WRI[s] + [s * 0.008, 0.01, -0.06], (0.028, 0.05, 0.06))
        d = e if d is None else np.minimum(d, e)
    return d
# feet: a heel and a ball of root, the toes are tubes
def feet(P):
    d = None
    for s in (1, -1):
        e = smin(ell(P, ANK[s] + [0, 0.0, -0.035], (0.065, 0.075, 0.055)), ell(P, ANK[s] + [0, 0.10, -0.06], (0.075, 0.08, 0.03)), 0.04)
        e = np.maximum(e, -P[:, 2])
        d = e if d is None else np.minimum(d, e)
    return d

core = lambda P: np.minimum(np.minimum(smin(body(P), head(P), 0.03), palm(P)), feet(P))

# ---- 2. the bark strips: wound round each limb and the trunk, shingled, sap in the gaps -----------------------------
SEGS = LIMBS + TRUNK
SA = np.array([s[0] for s in SEGS], np.float32); SB = np.array([s[1] for s in SEGS], np.float32)
def hashf(i, j=0):
    return (np.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1.0
def strips(P, want=False):
    """height of the bark over the core at each point, and (if asked) the strip id and how far across it"""
    n = len(P)
    # the nearest segment's axis frame
    best = np.full(n, 9.0, np.float32); seg_i = np.zeros(n, int); tt = np.zeros(n, np.float32)
    for i, (a, b, ra, rb, w, turns, sense) in enumerate(SEGS):
        ab = b - a; L2 = float(ab @ ab)
        t = np.clip(((P - a) @ ab) / L2, 0, 1)
        dd = np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)
        m = dd < best; best[m] = dd[m]; seg_i[m] = i; tt[m] = t[m]
    h = np.zeros(n, np.float32); sid = np.zeros(n, np.float32); fr = np.zeros(n, np.float32)
    for i, (a, b, ra, rb, w, turns, sense) in enumerate(SEGS):
        m = seg_i == i
        if not m.any(): continue
        ab = (b - a); L = float(np.linalg.norm(ab)); ax = ab / L
        e1 = np.cross(ax, [0.0, 1.0, 0.0]) if abs(ax[1]) < 0.9 else np.cross(ax, [1.0, 0, 0]); e1 /= np.linalg.norm(e1)
        e2 = np.cross(ax, e1)
        q = P[m] - a; s_along = q @ ax; th = np.arctan2(q @ e2, q @ e1)
        # strips run diagonally: the coordinate across them goes along the limb and round it
        u = (s_along + sense * th / (2 * np.pi) / max(abs(turns), 1e-3) * np.sign(turns)) / w
        k = np.floor(u); f = u - k
        # each strip's own lip: ragged, a little higher or lower than its neighbours, some torn away to the sap
        rag = 0.08 * (vnoise(np.stack([th * 3.0, k * 1.7, np.full_like(th, i * 3.3)], 1).astype(F32), 2.0) - 0.5)
        if LV >= 2: rag += 0.035 * (vnoise(np.stack([th * 5.0, k * 2.3, np.full_like(th, i * 1.1)], 1).astype(F32), 2.0) - 0.5)
        edge = 0.86 + rag
        hk = 0.55 + 0.45 * hashf(k, i)
        torn = (hashf(k + 0.5, i * 2 + 1) < 0.10) & (np.cos(th * 2 + k) > 0.3)
        H = 0.016 * (1 + 0.6 * (ra / 0.1))
        # here and there a strip's lip lifts away from the body in a flap (the sheet's ragged outline)
        flare = np.clip(vnoise(np.stack([th * 2.2, k * 3.1, np.full_like(th, i * 5.7)], 1).astype(F32), 1.0) - 0.62, 0, 1) * 3.2
        lip = np.clip((f / edge - 0.55) / 0.45, 0, 1) ** 2
        prof = np.where(f < edge, H * hk * (0.25 + 0.75 * np.clip(f / edge, 0, 1) ** 1.5) + 0.03 * flare * lip, -0.004)
        prof = np.where(torn, -0.003, prof)
        h[m] = prof; sid[m] = k + i * 1000; fr[m] = np.where(f < edge, f / edge, 1.2)
    # the strips only cover the trunk and limbs, not the head, hands and feet
    if want: return h, sid, fr, seg_i
    return h

def strip_w(P):
    hz = np.linalg.norm((P - HEAD) / [0.13, 0.17, 0.16], axis=1) < 1
    hand = np.min(np.stack([np.linalg.norm((P - (WRI[s] + [0, 0.01, -0.05])) / [0.05, 0.07, 0.08], axis=1) for s in (1, -1)], 1), 1) < 1
    foot = P[:, 2] < 0.10
    return np.where(hz | hand | foot, 0.0, 1.0).astype(F32)

def full_sdf(P):
    d = core(P)
    band = np.abs(d) < 0.03
    if band.any():
        d = d.copy(); Pb = P[band]
        h = strips(Pb) * strip_w(Pb)
        if LV >= 2:
            h = h - 0.0015 * (ridged(Pb * [1, 1, 0.35], 40.0, 2) - 0.5)        # grain
        if LV >= 3:
            h = h - 0.0006 * (vnoise(Pb, 220.0) - 0.5)
        d[band] -= h
    return d

# ---- 3. the body mesh ---------------------------------------------------------------------------------------------
M = Mesh()
LO, HI = (-0.45, -0.25, -0.01), (0.45, 0.36, 1.85)
log('body, voxel', VOX)
Vb, Fb = mc(full_sdf, VOX, LO, HI)
log('body tris', len(Fb))
h, sid, fr, segi = strips(Vb, True); w = strip_w(Vb)
sapm = ((fr > 1.0) | (h < -0.001)) & (w > 0.5)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
hk = hashf(sid, 0.37)[:, None]
c = mix(BARK_D * 0.8, BARK, (0.15 + 0.85 * hk))
c = mix(c, BARK_L, (np.clip((fr - 0.6) / 0.4, 0, 1) ** 2)[:, None] * 0.8)    # the lip of each strip catches the light
c = c * (0.55 + 0.45 * np.clip(fr * 1.6, 0, 1))[:, None]                      # and its root, tucked under the one above, is dark
c = c * (0.85 + 0.3 * fbm(Vb * [1, 1, 0.4], 30.0))[:, None]
col[:] = c; mat[:] = MAT['bark']
bare = w < 0.5
cb = mix(BARK_D, BARK, np.clip(ridged(Vb * [1, 1, 0.5], 35.0, 2) * 1.4 - 0.2, 0, 1)[:, None])
col[bare] = cb[bare]
col[sapm] = SAP * (0.8 + 0.4 * fbm(Vb[sapm], 50.0))[:, None]; mat[sapm] = MAT['sap']
# the sockets: deep sap; the mouth: sap
for sx in (1, -1):
    m = np.linalg.norm((Vb - (HEAD + [sx * 0.042, 0.115, 0.0])) / [0.035, 0.04, 0.03], axis=1) < 1
    col[m] = SAP; mat[m] = MAT['sap']
m = np.linalg.norm((Vb - (HEAD + [0, 0.15, -0.075])) / [0.055, 0.07, 0.03], axis=1) < 1
col[m] = SAP; mat[m] = MAT['sap']
# the face under the strands: dark and wet with sap (the sheet's black face, amber eyes in it)
m = (np.linalg.norm((Vb - (HEAD + [0, 0.12, -0.03])) / [0.075, 0.08, 0.075], axis=1) < 1) & (Vb[:, 1] > HEAD[1] + 0.06)
col[m] = mix(SAP, BARK_D, 0.25); mat[m] = MAT['sap']
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)

surf = core
def lay(pts, r, lift=0.8):
    Pp, Nn = project(A(pts), surf, it=6)
    Pp = Pp + Nn * (r * lift)
    for _ in range(2): Pp[1:-1] = (Pp[:-2] + 2 * Pp[1:-1] + Pp[2:]) / 4
    return Pp
rng = np.random.default_rng(5)

# ---- 4. fingers and claws, toes and claws ------------------------------------------------------------------------
log('fingers, toes')
def finger(base, d, L, r0, curl, kind=0):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    u = np.linspace(0, 1, {1: 8, 2: 12, 3: 16}[LV])
    down = np.array([0, 0, -1.0]); down = down - d * (down @ d)
    if np.linalg.norm(down) < 1e-3: down = np.array([0, -1.0, 0])
    down /= np.linalg.norm(down)
    pts = np.array([base + d * L * x + down * L * curl * x * x for x in u])
    rr = r0 * (1 - 0.35 * u) * (1 + 0.12 * np.sin(u * np.pi * 3) ** 2)       # knuckles
    V, F = tube(pts, rr, SIDES + 2)
    M.add(V, F, mix(BARK_D, BARK, 0.5 + 0.3 * rng.random()), 0, MAT['bark'])
    tip = pts[-1]; td = pts[-1] - pts[-2]; td /= np.linalg.norm(td)
    cl = np.array([tip + td * 0.045 * x + down * 0.02 * x * x for x in u])
    V, F = tube(cl, r0 * 0.75 * (1 - u) + 0.0012, SIDES + 2)
    M.add(V, F, CLAW, 6, MAT['claw'])
for s in (1, -1):
    hb = WRI[s] + [s * 0.008, 0.01, -0.10]
    for i in range(4):
        off = (i - 1.5) * 0.022
        finger(hb + [0, off + 0.01, 0], [s * 0.05, 0.08 + off * 1.5, -1.0], 0.13 - abs(i - 1.2) * 0.012, 0.012, 0.35)
    finger(WRI[s] + [-s * 0.012, 0.05, -0.06], [-s * 0.4, 0.8, -0.6], 0.08, 0.012, 0.2)
    for i in range(4):
        a = (i - 1.5) * 0.38
        base = ANK[s] + [math.sin(a) * 0.04, 0.12, -0.065]
        finger(base, [math.sin(a) * 0.9, math.cos(a), -0.12], 0.10 + 0.02 * (i in (1, 2)), 0.017, 0.5)
    finger(ANK[s] + [0, -0.05, -0.06], [s * 0.2, -1.0, -0.2], 0.06, 0.016, 0.5)        # a heel spur

# ---- 4b. the head's twisted bark: strands from the brow and cheeks swept back over the crown and down the neck --------
log('head strands')
hr = np.random.default_rng(13)
for i in range(16):
    a0 = (i / 16) * 2 * np.pi
    sx = math.cos(a0); up = math.sin(a0)
    start = HEAD + [0.075 * sx, 0.13 - 0.03 * abs(sx), 0.03 + 0.06 * up]
    pts = [start, HEAD + [0.085 * sx, 0.05, 0.07 + 0.04 * up], HEAD + [0.07 * sx, -0.06, 0.06 + 0.03 * up],
           HEAD + [0.05 * sx, -0.12, -0.02], NECK0 + [0.045 * sx, -0.05, 0.02 * up]]
    pts = lay(catmull(pts, 40), 0.014, lift=0.5)
    r = 0.012 + 0.006 * hr.random()
    tw = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    V, F = tube(pts, r * (1 - 0.5 * (tw / tw[-1]) ** 2) * (1 + 0.15 * np.sin(tw * 40 + i)), SIDES + 2)
    M.add(V, F, mix(BARK_D, BARK, 0.3 + 0.5 * hr.random()), 0, MAT['bark'])
# two strands hanging down past the jaw, like the sheet's
for sx in (1, -1):
    pts = lay(catmull([HEAD + [sx * 0.07, 0.10, -0.02], HEAD + [sx * 0.085, 0.12, -0.08], HEAD + [sx * 0.08, 0.14, -0.15]], 30), 0.012, 0.6)
    pts[-8:] = HEAD + [sx * 0.08, 0.14, -0.10] + np.linspace(0, 1, 8)[:, None] * [0, 0.01, -0.08]
    V, F = tube(pts, np.linspace(0.013, 0.005, len(pts)), SIDES + 2)
    M.add(V, F, mix(BARK_D, BARK, 0.4), 0, MAT['bark'])

# ---- 5. the twigs on its head, with amber buds -------------------------------------------------------------------
log('twigs')
br = np.random.default_rng(31)
def bud(p, d):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    u = np.linspace(0, 1, 9)
    pts = p + d[None] * (u * 0.045)[:, None]
    V, F = tube(pts, 0.004 + 0.013 * np.sin(np.pi * u ** 0.7), SIDES + 2)
    M.add(V, F, AMBER, 9, MAT['amber'])
def twig(p0, d, L, r0, depth):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = br.normal(size=3) * 0.3
    pts = np.array([p0 + d * L * u + bend * L * u * u * 0.5 for u in np.linspace(0, 1, 10)])
    V, F = tube(pts, r0 * (1 - 0.6 * np.linspace(0, 1, 10)), SIDES)
    M.add(V, F, mix(BARK_D, BARK, 0.4), 2, MAT['bark'])
    tip = pts[-1]; td = pts[-1] - pts[-2]; td /= np.linalg.norm(td)
    if depth > 0:
        for k in range(2):
            nd = td + br.normal(size=3) * 0.7; nd[2] = abs(nd[2]) + 0.2
            twig(tip, nd, L * 0.55, r0 * 0.55, depth - 1)
    else:
        bud(tip, td)
for dx, dy, L in [(-0.6, 0.1, 0.15), (0.65, 0.05, 0.14), (0.05, -0.2, 0.2), (-0.3, 0.3, 0.1), (0.35, 0.3, 0.09)]:
    twig(HEAD + [dx * 0.06, -0.02 + dy * 0.05, 0.08], [dx, dy - 0.3, 1.0], L, 0.016, 1)

# ---- 6. eyes, sap drips -------------------------------------------------------------------------------------------
for sx in (1, -1):
    c = HEAD + [sx * 0.042, 0.11, 0.0]
    th, ph = np.meshgrid(np.linspace(0, np.pi, 8 + 4 * LV), np.linspace(0, 2 * np.pi, 12 + 6 * LV, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    M.add(c + sp * [0.016, 0.012, 0.012], np.array(F), AMBER, 7, MAT['amber'])
log('drips')
def drip(p, L, r):
    u = np.linspace(0, 1, 10)
    pts = p + np.array([0, 0.004, -1.0])[None] * (u * L)[:, None]
    rr = r * (0.45 + 0.25 * u + 0.9 * np.exp(-((u - 0.88) / 0.1) ** 2))     # a thread, then a bead
    V, F = tube(pts, rr, SIDES + 2)
    cc = np.tile(SAP, (len(V), 1)); cc[V[:, 2] < p[2] - L * 0.82] = AMBER * 0.8
    M.add(V, F, cc, 9 if False else 5, MAT['sap'])
for p, L, r in [(HEAD + [0.03, 0.17, -0.09], 0.09, 0.008), (HEAD + [-0.035, 0.165, -0.095], 0.12, 0.009),
                (HEAD + [0.0, 0.18, -0.085], 0.05, 0.007), (HEAD + [0.07, 0.12, -0.05], 0.07, 0.006),
                (HEAD + [-0.075, 0.11, -0.045], 0.05, 0.006), (HEAD + [-0.04, 0.12, -0.02], 0.03, 0.005),
                (CH + [0.06, 0.12, 0.06], 0.05, 0.006), (CH + [-0.09, 0.11, -0.05], 0.04, 0.006),
                (HIP + [0.05, 0.11, 0.05], 0.04, 0.006)]:
    p0, n0 = project(A([p]), core, it=6)
    drip(p0[0] + n0[0] * 0.003, L, r)

# ---- 7. moss: lobed leaves hanging in clusters on the shoulders, chest, hips and thighs -----------------------------
log('moss leaves')
Vc, Fc = mc(core, 0.012, LO, HI)
Ps = sample_surface(Vc, Fc, 80000, rng); N0 = grad(core, A(Ps))
def moss_w(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    w = 0
    for s in (1, -1):
        w = w + 1.3 * np.exp(-(((x - s * 0.19) / 0.11) ** 2 + ((z - 1.42) / 0.06) ** 2))         # shoulders
        w = w + 0.8 * np.exp(-(((x - s * 0.12) / 0.06) ** 2 + ((z - (0.78 if s > 0 else 0.62)) / 0.07) ** 2))   # a patch on each thigh
    w = w + 0.5 * np.exp(-(((x - 0.12) / 0.05) ** 2 + ((z - 0.30) / 0.05) ** 2))                # a shin
    w = w + 0.9 * np.exp(-(((x + 0.02) / 0.13) ** 2 + ((z - 1.02) / 0.04) ** 2) - ((P[:, 1] - 0.1) / 0.3) ** 2)   # round the waist, front
    w = w + 0.6 * np.exp(-(((x + 0.09) / 0.06) ** 2 + ((z - 1.30) / 0.05) ** 2))
    return w * (0.4 + fbm(P, 7.0))
mw = moss_w(Ps) * (N0[:, 2] > -0.5)
keep = rng.random(len(Ps)) < (np.clip(mw - 0.25, 0, 1) * 1.4) ** 1.6
MP, MN = Ps[keep], N0[keep]
take = poisson(MP, 0.03, rng); MP, MN = MP[take], MN[take]
def oak_leaf(p, n, L):
    """a flat lobed leaf hanging down the surface from p"""
    down = np.array([0, 0, -1.0]) - n * (-n[2]); down += rng.normal(size=3) * 0.35; down -= n * (down @ n)
    down /= max(np.linalg.norm(down), 1e-6)
    side = np.cross(n, down)
    nu, nv = {1: 7, 2: 11, 3: 15}[LV], 5
    u = np.linspace(0, 1, nu); v = np.linspace(-1, 1, nv)
    half = L * 0.38 * np.sin(np.pi * np.clip(u, 0.02, 1) ** 0.75) * (0.75 + 0.25 * np.abs(np.cos(u * np.pi * 3.5)))   # lobes
    U, Vv = np.meshgrid(u, v, indexing='ij')
    pos = (p[None, None] + down[None, None] * (U * L)[..., None] + side[None, None] * (Vv * half[:, None])[..., None]
           + n[None, None] * ((0.004 + 0.012 * U ** 1.5 - 0.006 * Vv ** 2) * L / 0.06)[..., None])
    top = pos.reshape(-1, 3); bot = top - n * 0.0025
    V = np.vstack([top, bot]); nn = nu * nv
    F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a = i * nv + j; b = a + 1; c = a + nv; d = c + 1
            F += [(a, c, d), (a, d, b), (a + nn, b + nn, d + nn), (a + nn, d + nn, c + nn)]
    for i in range(nu - 1):          # close the rim
        for j in (0, nv - 1):
            a = i * nv + j; c = a + nv
            F += [(a, a + nn, c + nn), (a, c + nn, c)] if j == 0 else [(a, c, c + nn), (a, c + nn, a + nn)]
    cc = mix(MOSS_D, MOSS, 0.4 + 0.6 * rng.random()) * (0.75 + 0.25 * np.r_[U.ravel(), U.ravel()])[:, None]
    M.add(V, np.array(F), np.clip(cc, 0, 1), 8, MAT['moss'])
for p, n in zip(MP, MN):
    oak_leaf(p + n * 0.012, n, 0.075 + 0.05 * rng.random())
log('moss leaves', len(MP))

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
