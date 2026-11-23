# The unmade's sculpt (Foes: walkers, session 8, November 23), made in passes, shape first. Its wound strips are the
# sapwight's (foes/sapwight/sculpt.py), turned from bark to husk.
#
# "A relic-bearer the Worldforge unmade: a grey husk still carrying the shape of the thing it held, and still reaching
# for it." Chris's sheet (art-in/3d/sheets/sheet-unmade.webp: front, side, back): a thin figure of a man made of grey-
# brown strips wound round and round like a mummy's, torn through in holes everywhere so that the dark violet nothing
# inside shows; a ragged tunic to its knees and a cowl of the same husk about its neck and shoulders, both holed; its
# head wrapped too, two violet eyes burning in a dark mask; a violet light in a crack in its chest; its feet wrapped
# into blunt ends; and in its left hand, held up against its side, the ghost of its relic: a violet crystal rod,
# six-sided, with heavy ends.
#
# Not fuzz: every strip is a raised band with a torn edge; the holes are real holes in the surface down to the violet
# underneath; the tunic and cowl are a shell with real holes and a torn hem.
#
#   pass 1  shape    ~100-200k, pass 2 form (torn edges, folds), pass 3 detail (~1M)
# Measured off the sheet at 1.8 m to the top of its head.
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.0075, 2: 0.0045, 3: 0.0038}[LV]
SIDES = {1: 6, 2: 9, 3: 12}[LV]

HUSK = np.array([0.36, 0.31, 0.25]); HUSK_D = np.array([0.20, 0.17, 0.14]); HUSK_L = np.array([0.50, 0.45, 0.36])
VOID = np.array([0.09, 0.05, 0.11]); VIOLET = np.array([0.80, 0.45, 1.0]); RELIC = np.array([0.36, 0.10, 0.58]); RELIC_L = np.array([0.52, 0.22, 0.78])
MAT = {'husk': (0.9, 0.0), 'void': (0.55, 0.0), 'glow': (0.3, 0.0), 'relic': (0.25, 0.0)}

# ---- 1. the thin body -----------------------------------------------------------------------------------------------
HIP = np.array([0, 0.0, 0.93]); CH = np.array([0, 0.02, 1.27]); SHC = np.array([0, 0.0, 1.43])
NECK0 = np.array([0, 0.0, 1.45]); NECK1 = np.array([0, 0.02, 1.55]); HEAD = np.array([0, 0.03, 1.66])
SH = {s: np.array([s * 0.155, -0.01, 1.43]) for s in (1, -1)}
ELB = {1: np.array([0.195, -0.02, 1.12]), -1: np.array([-0.20, -0.04, 1.14])}
WRI = {1: np.array([0.215, 0.02, 0.85]), -1: np.array([-0.29, 0.13, 1.01])}     # its left forearm comes forward: it holds the relic
HAND = {1: np.array([0.22, 0.04, 0.72]), -1: np.array([-0.34, 0.18, 0.99])}
THI = {s: np.array([s * 0.08, 0.0, 0.90]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.085, 0.02, 0.51]) for s in (1, -1)}
ANK = {s: np.array([s * 0.085, -0.02, 0.09]) for s in (1, -1)}
# limbs and trunk as segments: (a, b, radius a, radius b, strip width, helix turns per metre, sense)
LIMBS = []
for s in (1, -1):
    LIMBS += [(SH[s], ELB[s], 0.052, 0.045, 0.075, 9.0, s), (ELB[s], WRI[s], 0.045, 0.036, 0.07, -10.0, s),
              (THI[s], KNEE[s], 0.072, 0.058, 0.085, 7.5, -s), (KNEE[s], ANK[s], 0.058, 0.045, 0.08, -8.5, -s)]
TRUNK = [(HIP, CH, 0.13, 0.15, 0.10, 6.0, 1), (CH, SHC, 0.15, 0.13, 0.10, -6.0, 1), (NECK0, NECK1, 0.05, 0.05, 0.05, 14.0, 1),
         (HEAD + [0, 0, -0.10], HEAD + [0, 0, 0.11], 0.09, 0.07, 0.055, -9.0, -1)]      # the head is wrapped too

def body(P):
    d = ell(P, CH + [0, 0, 0.02], (0.155, 0.10, 0.16))                    # a narrow chest
    d = smin(d, ell(P, (0, 0.01, 1.08), (0.125, 0.085, 0.11)), 0.05)       # the waist
    d = smin(d, ell(P, HIP, (0.145, 0.10, 0.10)), 0.05)                    # pelvis
    d = smin(d, ell(P, SHC, (0.21, 0.085, 0.05)), 0.06)                    # the shoulders' yoke
    d = smin(d, cap(P, NECK0, NECK1, 0.052, 0.048), 0.03)
    return d
def head(P):
    d = ell(P, HEAD, (0.088, 0.10, 0.105))
    d = smin(d, ell(P, HEAD + [0, 0.045, -0.06], (0.062, 0.06, 0.06)), 0.03)        # the jaw, narrow
    d = smin(d, ell(P, HEAD + [0, 0.085, 0.0], (0.018, 0.03, 0.05)), 0.02)          # a ridge down the mask, like a beak
    for sx in (1, -1):
        d = smin(d, ell(P, HEAD + [sx * 0.04, 0.075, 0.03], (0.04, 0.03, 0.02)), 0.02)   # brows
        d = smax(d, -ell(P, HEAD + [sx * 0.038, 0.095, 0.005], (0.028, 0.03, 0.024)), 0.012)   # deep sockets
    return d
def arms(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, SH[s] + [-s * 0.005, 0, -0.02], ELB[s], 0.052, 0.045), cap(P, ELB[s], WRI[s], 0.045, 0.036), 0.025)
        e = smin(e, sph(P, ELB[s], 0.042), 0.02)
        e = smin(e, ell(P, (WRI[s] + HAND[s]) / 2, (0.03, 0.045, 0.055) if s > 0 else (0.045, 0.045, 0.03)), 0.02)   # the palm
        d = e if d is None else np.minimum(d, e)
    return d
def legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.03], KNEE[s], 0.072, 0.058), cap(P, KNEE[s], ANK[s], 0.058, 0.045), 0.025)
        e = smin(e, sph(P, KNEE[s] + [0, 0.015, 0], 0.055), 0.02)
        # the foot: wrapped into a blunt end
        e = smin(e, np.maximum(ell(P, ANK[s] + [0, 0.07, -0.045], (0.055, 0.12, 0.05)), -P[:, 2]), 0.04)
        d = e if d is None else np.minimum(d, e)
    return d
core_body = lambda P: smin(body(P), head(P), 0.03)
core = lambda P: np.minimum(np.minimum(core_body(P), arms(P)), legs(P))

# ---- 2. the husk's strips: wound round each limb, the trunk and the head, torn through in holes ----------------------
SEGS = LIMBS + TRUNK
def hashf(i, j=0):
    return (np.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1.0
CRACK = np.array([-0.05, 0.10, 1.26])          # the violet crack in its chest (its left)
def holes(P):
    """1 where the husk is torn through to the void: blotches everywhere, and the crack in its chest"""
    n = fbm(P * [1, 1, 0.6] + 3, 7.0, 2)
    h = n > 0.455
    cr = np.linalg.norm((P - CRACK) / [0.035, 0.05, 0.10], axis=1) < 1
    return h | cr
def strips(P, want=False):
    n = len(P)
    best = np.full(n, 9.0, np.float32); seg_i = np.zeros(n, int)
    for i, (a, b, ra, rb, w, turns, sense) in enumerate(SEGS):
        ab = b - a; L2 = float(ab @ ab)
        t = np.clip(((P - a) @ ab) / L2, 0, 1)
        dd = np.linalg.norm(P - (a + t[:, None] * ab), axis=1) - (ra + (rb - ra) * t)
        m = dd < best; best[m] = dd[m]; seg_i[m] = i
    h = np.zeros(n, np.float32); sid = np.zeros(n, np.float32); fr = np.zeros(n, np.float32)
    for i, (a, b, ra, rb, w, turns, sense) in enumerate(SEGS):
        m = seg_i == i
        if not m.any(): continue
        ab = (b - a); L = float(np.linalg.norm(ab)); ax = ab / L
        e1 = np.cross(ax, [0.0, 1.0, 0.0]) if abs(ax[1]) < 0.9 else np.cross(ax, [1.0, 0, 0]); e1 /= np.linalg.norm(e1)
        e2 = np.cross(ax, e1)
        q = P[m] - a; s_along = q @ ax; th = np.arctan2(q @ e2, q @ e1)
        u = (s_along + sense * th / (2 * np.pi) / max(abs(turns), 1e-3) * np.sign(turns)) / w
        k = np.floor(u); f = u - k
        rag = 0.10 * (vnoise(np.stack([th * 3.0, k * 1.7, np.full_like(th, i * 3.3)], 1).astype(F32), 2.0) - 0.5)
        if LV >= 2: rag += 0.05 * (vnoise(np.stack([th * 7.0, k * 2.3, np.full_like(th, i * 1.1)], 1).astype(F32), 2.0) - 0.5)
        edge = 0.88 + rag
        hk = 0.55 + 0.45 * hashf(k, i)
        H = 0.011 * (1 + 0.5 * (ra / 0.1))
        flare = np.clip(vnoise(np.stack([th * 2.2, k * 3.1, np.full_like(th, i * 5.7)], 1).astype(F32), 1.0) - 0.66, 0, 1) * 2.6
        lip = np.clip((f / edge - 0.55) / 0.45, 0, 1) ** 2
        prof = np.where(f < edge, H * hk * (0.3 + 0.7 * np.clip(f / edge, 0, 1) ** 1.5) + 0.02 * flare * lip, -0.004)
        h[m] = prof; sid[m] = k + i * 1000; fr[m] = np.where(f < edge, f / edge, 1.2)
    ho = holes(P)
    h = np.where(ho, -0.012, h)                                   # torn through: down into the void
    if want: return h, sid, fr, seg_i, ho
    return h
def strip_w(P):
    hand = np.min(np.stack([np.linalg.norm((P - ((WRI[s] + HAND[s]) / 2)) / [0.06, 0.07, 0.08], axis=1) for s in (1, -1)], 1), 1) < 1
    face = (np.linalg.norm((P - (HEAD + [0, 0.08, -0.01])) / [0.075, 0.06, 0.07], axis=1) < 1)
    return np.where(hand | face, 0.0, 1.0).astype(F32)
def full_sdf(P, core=core):
    d = core(P)
    band = np.abs(d) < 0.03
    if band.any():
        d = d.copy(); Pb = P[band]
        h = strips(Pb) * strip_w(Pb)
        if LV >= 2: h = h - 0.0012 * (ridged(Pb * [1, 1, 0.4], 45.0, 2) - 0.5)        # the weave, fine and worn
        if LV >= 3: h = h - 0.0005 * (vnoise(Pb, 240.0) - 0.5)
        d[band] -= h
    return d

# ---- 3. the tunic and the cowl: a shell of the same husk, holed, with a torn hem -----------------------------------
def tunic_outer(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = body(P) - 0.022
    d = d - 0.012 * (np.sin(x * 38 + 3 * fbm(P, 3.0) + z * 9) * 0.5 + 0.5) * sstep(1.38, 1.1, z)      # folds hanging down
    # below the hips it hangs as a skirt round both legs, widening a little to the knees
    k = np.clip((0.98 - z) / 0.5, 0, 1)
    sk = np.sqrt((x / (0.17 + 0.06 * k)) ** 2 + ((y - 0.0) / (0.13 + 0.03 * k)) ** 2) - 1
    sk = np.maximum(sk * 0.14, z - 1.08)
    return smin(d, sk, 0.08)
def tunic(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.abs(tunic_outer(P)) - 0.006
    # the hem: torn into long tongues, longer at the front and back than at the sides; above, the neck open
    hem = 0.50 + 0.07 * np.abs(np.sin(np.arctan2(x, y + 1e-6) * 7 + 0.5)) + 0.10 * (fbm(P * [1, 1, 0.2] + 7, 6.0) - 0.5) \
        + 0.05 * sstep(0.1, 0.17, np.abs(x))
    d = np.maximum(d, hem - z)
    d = np.maximum(d, z - 1.46)
    d = np.maximum(d, (np.abs(x) - mix(0.30, 0.17, sstep(1.28, 1.42, z))) * 0.5)   # narrow at the shoulders, under the cowl
    # sleeves: none; the arms' strips show (the shell is cut round the shoulders)
    d = np.maximum(d, -(np.min(np.stack([cap(P, SH[s] + [s * 0.03, 0, -0.13], ELB[s], 0.07, 0.07) for s in (1, -1)], 1), 1)))
    # holes
    hn = fbm(P * [1, 1, 0.6] + 11, 10.0, 2)
    d = np.maximum(d, -(0.45 - hn) * 0.3)
    d = np.maximum(d, -(np.linalg.norm((P - CRACK) / [0.05, 0.08, 0.13], axis=1) - 1) * 0.05)   # torn open over the crack
    return d
def cowl(P):
    # a thick scarf of husk round its neck, slumped over its shoulders and hanging in a loop on its chest
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    c = NECK0 + [0, 0.0, 0.035]
    q = P - c
    r = np.sqrt((q[:, 0] / 1.15) ** 2 + (q[:, 1] / 0.95) ** 2)
    zz = q[:, 2] + 0.09 * sstep(0.0, 0.12, q[:, 1]) * np.clip(1 - np.abs(q[:, 0]) / 0.12, 0, 1) + 0.02 * np.abs(q[:, 0]) / 0.15
    d = np.sqrt((r - 0.15) ** 2 + (zz / 0.75) ** 2) - 0.058
    d = d - 0.012 * (np.sin(np.arctan2(q[:, 0], q[:, 1]) * 9) * 0.5 + 0.5)                 # folds
    d = np.maximum(d, -(0.49 - fbm(P + 21, 8.0, 2)) * 0.2)
    return d

# ---- 4. the meshes: the body (with tunic and cowl), the arms, the legs, the head, each a piece of its own -----------
M = Mesh()
log('body, voxel', VOX)
P_ = Parts()
P_.add('body', lambda P: full_sdf(P, body), 'husk')
P_.add('tunic', tunic, 'tunic', k=0.0)
P_.add('cowl', cowl, 'tunic', k=0.012)
GROUPS = [(P_.sdf, 0, (-0.32, -0.25, 0.40), (0.32, 0.25, 1.62)),
          (lambda P: full_sdf(P, arms), 12, (-0.42, -0.15, 0.62), (0.42, 0.30, 1.50)),
          (lambda P: full_sdf(P, legs), 13, (-0.25, -0.15, -0.01), (0.25, 0.25, 1.00)),
          (lambda P: full_sdf(P, head), 14, (-0.14, -0.13, 1.50), (0.14, 0.20, 1.81))]
VS, FS, KS, off = [], [], [], 0
for f_, kd, lo_, hi_ in GROUPS:
    Vg, Fg = mc(f_, VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg); KS.append(np.full(len(Vg), kd, np.uint8))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); KB = np.concatenate(KS)
lab = np.array(['husk', 'tunic', 'tunic'])[P_.label(Vb)]
lab[KB != 0] = 'husk'
h, sid, fr, segi, ho = strips(Vb, True); w = strip_w(Vb)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
hk = hashf(sid, 0.37)[:, None]
c = mix(HUSK_D * 0.85, HUSK, (0.2 + 0.8 * hk))
c = mix(c, HUSK_L, (np.clip((fr - 0.6) / 0.4, 0, 1) ** 2)[:, None] * 0.7)   # each strip's lip catches the light
c = c * (0.6 + 0.4 * np.clip(fr * 1.6, 0, 1))[:, None]
c = c * (0.85 + 0.3 * fbm(Vb * [1, 1, 0.4], 30.0))[:, None]
col[:] = c; mat[:] = MAT['husk']
gap = ((fr > 1.0) | ho) & (w > 0.5) & (lab == 'husk')
col[gap] = VOID * (0.7 + 0.5 * fbm(Vb[gap], 40.0))[:, None]; mat[gap] = MAT['void']
# the tunic and cowl: the same husk in broad folds, its inner side and its holes' edges dark
tu = lab == 'tunic'
ct = mix(HUSK_D, HUSK_L, np.clip(fbm(Vb * [1, 1, 0.25], 14.0) * 1.4 - 0.2, 0, 1)[:, None])
inner = tunic_outer(Vb) < -0.002
ct[inner] = mix(VOID, HUSK_D, 0.35)
col[tu] = ct[tu]
under = (KB == 0) & ~tu & (Vb[:, 2] > 0.55) & (Vb[:, 2] < 1.42) & (np.abs(Vb[:, 0]) < 0.2)
col[under] = mix(VOID, HUSK_D, 0.25 * np.clip(fr[under], 0, 1)[:, None]); mat[under] = MAT['void']
# the face: a dark mask round the eyes, the husk wrapped about it
face = (w < 0.5) & (KB == 14)
col[face] = mix(VOID, HUSK_D, np.clip(np.linalg.norm(Vb[face] - (HEAD + [0, 0.09, 0.0]), axis=1) / 0.07, 0, 1)[:, None] * 0.8)
mat[face] = MAT['void']
# hands: bare husk, grey
hb = (w < 0.5) & (KB == 12)
col[hb] = mix(HUSK_D, HUSK, np.clip(fbm(Vb[hb], 30.0), 0, 1)[:, None])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                       # kinds: 0 body (with tunic and cowl), 12 arms, 13 legs, 14 head
M.K[-1][tu & (Vb[:, 2] < 0.98)] = 15  # kind 15: the tunic's skirt, which hangs from its hips

rng = np.random.default_rng(5)

# ---- 5. fingers -------------------------------------------------------------------------------------------------------
log('fingers')
def finger(base, d, L, r0, curl):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    u = np.linspace(0, 1, {1: 8, 2: 12, 3: 16}[LV])
    down = np.array([0, 0, -1.0]); down = down - d * (down @ d)
    if np.linalg.norm(down) < 1e-3: down = np.array([0, -1.0, 0])
    down /= np.linalg.norm(down)
    pts = np.array([base + d * L * x + down * L * curl * x * x for x in u])
    rr = r0 * (1 - 0.3 * u) * (1 + 0.15 * np.sin(u * np.pi * 3) ** 2)        # knuckles
    V, F = tube(pts, rr, SIDES + 2)
    M.add(V, F, mix(HUSK_D, HUSK, 0.4 + 0.3 * rng.random()), 12, MAT['husk'])
# its right hand hangs open, long fingers half curled
for i in range(4):
    off = (i - 1.5) * 0.018
    finger(HAND[1] + [0.005, off + 0.01, 0.02], [0.08, 0.10 + off * 1.5, -1.0], 0.095 - abs(i - 1.2) * 0.01, 0.0095, 0.45)
finger(WRI[1] + [-0.012, 0.045, -0.05], [-0.4, 0.8, -0.6], 0.06, 0.0095, 0.25)
# its left hand closes round the relic
RA = np.array([-0.21, 0.17, 0.93]); RB = np.array([-0.48, 0.14, 1.23])           # the relic's two ends
rax = (RB - RA) / np.linalg.norm(RB - RA)
GRIP = RA + (RB - RA) * 0.42
for i in range(4):
    c0 = GRIP + rax * ((i - 1.5) * 0.022)
    e1 = np.cross(rax, [0, 1.0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(rax, e1)
    a0 = 2.3
    pts = np.array([c0 + 0.058 * (math.cos(a0 + t) * e1 + math.sin(a0 + t) * e2) for t in np.linspace(0, 3.6, 12 + 2 * LV)])
    V, F = tube(pts, np.linspace(0.011, 0.008, len(pts)), SIDES + 2)
    M.add(V, F, mix(HUSK_D, HUSK, 0.5), 12, MAT['husk'])

# ---- 6. the relic: a six-sided violet crystal rod with heavy ends ---------------------------------------------------
log('relic, eyes, crack')
def hexrod(a, b, r, n=12):
    pts = np.linspace(a, b, n)
    return tube(pts, np.full(n, r), 6)
for (a, b, r, cc) in [(RA, RB, 0.032, RELIC),
                      (RA - rax * 0.03, RA + rax * 0.05, 0.048, RELIC_L), (RB - rax * 0.05, RB + rax * 0.03, 0.048, RELIC_L),
                      (RA + rax * 0.07, RA + rax * 0.10, 0.040, RELIC), (RB - rax * 0.10, RB - rax * 0.07, 0.040, RELIC)]:
    V, F = hexrod(a, b, r)
    M.add(V, F, cc, 10, MAT['relic'])
for end, sgn in ((RA, -1), (RB, 1)):                  # the faceted points at each end
    pts = np.array([end + rax * sgn * 0.03, end + rax * sgn * 0.07])
    V, F = tube(pts, np.array([0.04, 0.004]), 6)
    M.add(V, F, RELIC_L, 10, MAT['relic'])

# ---- 7. the eyes and the crack in its chest: violet light ------------------------------------------------------------
def ball(c, r, n=10):
    th, ph = np.meshgrid(np.linspace(0, np.pi, 6 + n // 2), np.linspace(0, 2 * np.pi, n, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; F = []
    for i in range(nt - 1):
        for j in range(npp):
            a = i * npp + j; b = i * npp + (j + 1) % npp; F += [(a, a + npp, b + npp), (a, b + npp, b)]
    return c + sp * r, np.array(F)
for sx in (1, -1):
    V, F = ball(HEAD + [sx * 0.038, 0.09, 0.005], np.array([0.018, 0.011, 0.012]), 12 + 4 * LV)
    M.add(V, F, VIOLET, 7, MAT['glow'])
# the crack: shards of violet light standing in the torn place on its chest
for i in range(5):
    p = CRACK + [0.01 * (i - 2), -0.01, 0.03 * (i - 2)] + rng.normal(size=3) * [0.006, 0.0, 0.01]
    d_ = np.array([0.15 * (rng.random() - 0.5), 0.25, 1.0]); d_ /= np.linalg.norm(d_)
    L = 0.07 + 0.05 * rng.random()
    pts = np.array([p - d_ * L / 2, p, p + d_ * L / 2])
    V, F = tube(pts, np.array([0.003, 0.012, 0.003]), 5)
    M.add(V, F, VIOLET * (0.8 + 0.2 * rng.random()), 7, MAT['glow'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
