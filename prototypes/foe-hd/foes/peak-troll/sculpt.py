# The peak-troll's sculpt (Foes: walkers, session 8, November 23), made in passes, shape first. It starts from Old
# Horn's troll body (foes/old-horn/sculpt.py): Old Horn is the oldest of them, the peak-troll a common one.
#
# "A troll of the high passes, grey-green and mossed like a boulder. Cut it and it grows back." Chris's sheet
# (art-in/3d/sheets/sheet-peak-troll.webp): the same hunched giant, his head sunk forward between his shoulders, but
# no horn, no belt, no hides: grey stone-coloured hide mottled with moss, a mantle of moss over his shoulders, the back
# of his head and his back, hung in ragged tiers to his hips, with boulders grown into it on his shoulders and the top
# of his back and shelf mushrooms on his left shoulder; a moss skirt; a red thorn vine slung across his chest from his
# right shoulder to his left hip, weeping red; broad feet with flat nails; the log club in his left hand.
#
# Not fuzz: the mantle and skirt are the foe kit's coat of tufts (prototypes/foe-hd/kit/py/coat.py, session 6) in
# moss, big shingled tufts sculpted into one surface; his hide is pebbled and muscled as real form.
#
#   pass 1 shape ~100-200k, pass 2 form, pass 3 detail (~1M)
# Built at Old Horn's measures, then the whole made 0.9 times as big (SC): 2.2 m to the top of his mantle.
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
import sys, os, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../pages/walkers/kit'))
sys.path.insert(1, os.path.join(HERE, '../../kit/py'))
from sdf import *
import coat as kitcoat

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.017, 2: 0.0085, 3: 0.0072}[LV]
SIDES = {1: 6, 2: 10, 3: 14}[LV]
S = 2.7 / 725
def fx(px): return (270 - px) * S
def sz(py): return (801 - py) * S
LO, HI = (-1.05, -0.95, -0.01), (1.0, 1.15, 2.72)

SC = 0.9                              # the peak-troll at 0.9 of Old Horn's size
SKIN = np.array([0.42, 0.46, 0.39]); SKIN_D = np.array([0.25, 0.29, 0.24]); SKIN_L = np.array([0.57, 0.60, 0.52])
FUR = np.array([0.20, 0.29, 0.09]); FUR_D = np.array([0.08, 0.13, 0.04]); FUR_M = np.array([0.46, 0.50, 0.40])   # moss; lichen-grey patches
STONE = np.array([0.45, 0.48, 0.42]); STONE_D = np.array([0.28, 0.31, 0.27]); THORN = np.array([0.30, 0.09, 0.07]); BLOOD = np.array([0.55, 0.06, 0.05])
HORN = np.array([0.86, 0.81, 0.62]); HORN_D = np.array([0.55, 0.50, 0.36]); CLAW = np.array([0.80, 0.74, 0.58])
LEATHER = np.array([0.33, 0.22, 0.12]); RED = np.array([0.55, 0.13, 0.10]); BUCKLE = np.array([0.74, 0.67, 0.50])
WOOD = np.array([0.38, 0.27, 0.16]); WOOD_D = np.array([0.20, 0.13, 0.08]); MOSS = np.array([0.40, 0.45, 0.13])
CAP = np.array([0.80, 0.68, 0.50]); STITCH = np.array([0.86, 0.82, 0.70]); EYE = np.array([0.95, 0.88, 0.70]); MOUTH = np.array([0.10, 0.06, 0.05])
MAT = {'skin': (0.75, 0.0), 'fur': (0.95, 0.0), 'horn': (0.45, 0.0), 'leather': (0.7, 0.0), 'metal': (0.4, 0.9), 'wood': (0.9, 0.0),
       'moss': (0.95, 0.0), 'cap': (0.6, 0.0), 'eye': (0.2, 0.0), 'mouth': (0.5, 0.0), 'stone': (0.85, 0.0), 'thorn': (0.6, 0.0), 'blood': (0.25, 0.0)}

# ---- 1. the troll: measured off the front (x, z) and side (y, z) views ----------------------------------------------
HIP = np.array([0, 0.0, 1.02]); BELLY = np.array([0, 0.15, 1.25]); CHEST = np.array([0, 0.14, 1.55])
HEAD = np.array([-0.05, 0.47, 2.02])
SH = {s: np.array([s * 0.50, 0.12, 1.76]) for s in (1, -1)}
ELB = {s: np.array([s * 0.66, 0.14, 1.20]) for s in (1, -1)}
WRI = {s: np.array([s * 0.68, 0.24, 0.80]) for s in (1, -1)}
FIST = {s: np.array([s * 0.68, 0.27, 0.68]) for s in (1, -1)}
THI = {s: np.array([s * 0.29, -0.04, 0.98]) for s in (1, -1)}
KNEE = {s: np.array([s * 0.37, 0.0, 0.55]) for s in (1, -1)}
ANK = {s: np.array([s * 0.43, -0.07, 0.15]) for s in (1, -1)}

P_ = Parts()
def trunk(P):
    d = ell(P, CHEST, (0.46, 0.33, 0.33))                                     # the barrel chest
    d = smin(d, ell(P, BELLY, (0.38, 0.37, 0.27)), 0.10)                      # the gut
    d = smin(d, ell(P, HIP, (0.40, 0.30, 0.22)), 0.10)
    d = smin(d, ell(P, (0, -0.05, 1.72), (0.48, 0.34, 0.24)), 0.12)           # the hunched yoke of his shoulders
    d = smin(d, ell(P, (0, 0.25, 1.86), (0.30, 0.26, 0.20)), 0.10)            # the neck, thick and forward
    for s in (1, -1):
        d = smin(d, ell(P, (s * 0.20, 0.38, 1.56), (0.21, 0.10, 0.15)), 0.06)     # pectorals
        d = smin(d, sph(P, SH[s], 0.22), 0.08)                                  # deltoids
        for k in range(3):                                                     # the gut's ridges
            d = smin(d, ell(P, (s * 0.09, 0.42 - 0.01 * k, 1.38 - 0.09 * k), (0.085, 0.05, 0.05)), 0.04)
    return d
def arms(P):
    d = None
    for s in (1, -1):
        e = cap(P, SH[s], ELB[s], 0.19, 0.15)
        e = smin(e, ell(P, (SH[s] + ELB[s]) / 2 + [0, 0.07, 0], (0.13, 0.12, 0.2)), 0.05)     # biceps
        e = smin(e, cap(P, ELB[s], WRI[s], 0.155, 0.12), 0.05)
        e = smin(e, ell(P, ELB[s] + (WRI[s] - ELB[s]) * 0.3, (0.15, 0.15, 0.17)), 0.05)       # forearm, heavy
        d = e if d is None else np.minimum(d, e)
    return d
def legs(P):
    d = None
    for s in (1, -1):
        e = cap(P, THI[s], KNEE[s], 0.22, 0.19)
        e = smin(e, sph(P, KNEE[s] + [0, 0.05, 0], 0.18), 0.05)
        e = smin(e, cap(P, KNEE[s], ANK[s], 0.19, 0.15), 0.06)
        e = smin(e, ell(P, KNEE[s] + [0, -0.06, -0.15], (0.15, 0.13, 0.18)), 0.05)          # calf
        # the foot: broad, flat, toes splayed (the toes' claws are separate)
        e = smin(e, slab(ell(P, ANK[s] + [s * 0.02, 0.12, -0.09], (0.22, 0.26, 0.12)), P, 0.0, 1.0), 0.06)
        d = e if d is None else np.minimum(d, e)
    return d
def chain(P, pts, r0, r1):
    """a finger: capsules joined end to end, thick at the knuckle, blunt at the tip"""
    d = None
    rr = np.linspace(r0, r1, len(pts))
    for i in range(len(pts) - 1):
        e = cap(P, pts[i], pts[i + 1], rr[i], rr[i + 1])
        d = e if d is None else smin(d, e, 0.006)
    return d
# the club's axis (the club itself is made in section 7): the left hand closes round it
CL0 = FIST[-1] + np.array([0.0, -0.06, 0.12]); CL1 = FIST[-1] + np.array([-0.24, 0.62, -0.58])
CLD = (CL1 - CL0) / np.linalg.norm(CL1 - CL0)
def fists(P):
    # his hands (Chris's sheets: thick fingers, not mittens): the right hangs half curled, the left grips the club
    F = FIST[1]
    d = ell(P, F + [0.0, 0.0, -0.01], (0.085, 0.13, 0.12))                              # the right palm, broad
    for i in range(4):
        y = -0.085 + 0.056 * i; L = 1.0 - 0.13 * abs(i - 1.5)
        b = F + [0.01, y, -0.09]
        pts = [b, b + [-0.005, 0.006, -0.08 * L], b + [-0.045, 0.014, -0.15 * L], b + [-0.085, 0.018, -0.17 * L]]
        d = smin(d, chain(P, [np.array(p, float) for p in pts], 0.047, 0.036), 0.012)    # four thick fingers, curling in
    d = smin(d, chain(P, [F + [-0.06, 0.10, 0.0], F + [-0.09, 0.16, -0.05], F + [-0.10, 0.19, -0.11]], 0.05, 0.038), 0.015)   # thumb
    # the left: the palm against the club, four fingers wrapped round it, the thumb over them
    e1 = np.cross(CLD, [0, 0, 1.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(CLD, e1)
    tg = 0.17                                                                           # where on the club he grips it
    c0 = CL0 + (CL1 - CL0) * tg; R = (0.055 + 0.10 * tg ** 1.6) + 0.045
    e = ell(P, c0 - e1 * 0.09, (0.08, 0.13, 0.12))
    for i in range(4):
        ci = c0 + CLD * (0.06 * (i - 1.5))
        arc = [ci + R * (math.cos(a) * e1 + math.sin(a) * e2) for a in np.linspace(math.pi * 0.9, math.pi * 2.25, 5)]
        e = smin(e, chain(P, arc, 0.044, 0.038), 0.01)
    arc = [c0 - CLD * 0.09 + R * (math.cos(a) * e1 + math.sin(a) * e2) for a in np.linspace(math.pi * 1.0, math.pi * 1.7, 4)]
    e = smin(e, chain(P, arc, 0.05, 0.04), 0.012)                                        # the thumb round the other way
    return np.minimum(d, e)
def head(P):
    h = ell(P, HEAD, (0.19, 0.20, 0.20))
    h = smin(h, ell(P, HEAD + [0, 0.14, -0.10], (0.16, 0.14, 0.12)), 0.06)          # the jaw, wide (an underbite)
    h = smin(h, ell(P, HEAD + [0, 0.17, 0.05], (0.17, 0.08, 0.05)), 0.04)            # the brow, heavy
    h = smin(h, ell(P, HEAD + [0, 0.24, -0.03], (0.075, 0.09, 0.085)), 0.03)         # the nose, big and drooping
    h = smin(h, sph(P, HEAD + [0, 0.30, -0.08], 0.055), 0.03)                        # its bulb
    for s in (1, -1):
        h = smin(h, ell(P, HEAD + [s * 0.035, 0.27, -0.02], (0.03, 0.025, 0.025)), 0.015)   # nostrils' wings
        h = smax(h, -ell(P, HEAD + [s * 0.078, 0.19, 0.02], (0.042, 0.035, 0.028)), 0.01)  # eye sockets under the brow
        h = smin(h, ell(P, HEAD + [s * 0.035, 0.205, 0.045], (0.05, 0.04, 0.025)), 0.02)    # the brow knotted low between the eyes: a scowl
        h = smin(h, ell(P, HEAD + [s * 0.12, 0.14, -0.05], (0.07, 0.07, 0.06)), 0.04)      # cheeks
    h = smax(h, -ell(P, HEAD + [0, 0.27, -0.115], (0.10, 0.04, 0.012)), 0.01)            # the mouth's line
    return h
P_.add('trunk', trunk, 'skin')
P_.add('legs', legs, 'skin', k=0.09)
# the arms join the body only at the shoulder (a soft blend there, a hard edge lower down), so they hang free of his gut and thighs
P_.add('arms', lambda P: arms(P) + 0.06 * sstep(1.45, 1.25, P[:, 2]) * 0, 'skin', k=0.0)
P_.add('fists', fists, 'skin', k=0.04)
P_.add('head', head, 'skin', k=0.12)
# the ears: long, pointed, swept out and back
def ears(P):
    d = None
    for s in (1, -1):
        e = cap(P, HEAD + [s * 0.16, 0.03, 0.04], HEAD + [s * 0.27, -0.04, 0.10], 0.05, 0.012, scale=(1, 1, 0.5))   # small, pointed
        d = e if d is None else np.minimum(d, e)
    return d
P_.add('ears', ears, 'skin', k=0.03)
for s in (1, -1):
    P_.add(f'eye{s}', lambda P, s=s: ell(P, HEAD + [s * 0.078, 0.205, 0.018], (0.034, 0.022, 0.024)), 'eye')

# ---- 2. boulders grown into his mantle: on his shoulders and the top of his back, and one at the back of his head ---
def boulders(P):
    d = None
    for c, r in BOULDERS:
        e = ell(P, c, r)
        e = e - 0.035 * (fbm(P * 1.0 + np.array(c), 5.0, 2) - 0.5)                 # lumpy, not round
        d = e if d is None else np.minimum(d, e)
    return d

# ---- 3. the cape of trollhides and the loincloth: the foe kit's coat of tufts ---------------------------------------
def mantle_outer(P):
    d = smin(trunk(P) - 0.07, ell(P, (0, -0.12, 2.10), (0.40, 0.38, 0.22)), 0.12)    # over his back and shoulders; the hump behind his head
    return d
def cape_body(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    d = np.maximum(mantle_outer(P), -(trunk(P) - 0.01))       # a shell over his body
    # down his back to his hips in ragged tiers; down to his chest at the sides in front; open below his shoulders at the sides
    cut = mix(0.86, 1.40, sstep(-0.3, 0.25, y)) - 0.20 * (fbm(P * [1, 1, 0.3] + 2, 4.0) - 0.4)
    d = np.maximum(d, cut - z)
    d = np.maximum(d, np.abs(x) - mix(0.40, 1.0, sstep(1.15, 1.85, z)) + 0.06 * (fbm(P + 5, 5.0) - 0.5))   # draped down off his shoulders
    yopen = 0.02 + 0.30 * sstep(1.62, 2.02, z) + 0.40 * sstep(0.28, 0.55, np.abs(x)) * sstep(1.40, 1.75, z)   # over the fronts of his shoulders
    d = np.maximum(d, y - yopen)
    d = np.maximum(d, -(np.linalg.norm((P - (HEAD + [0, 0.07, -0.02])) / [0.26, 0.30, 0.30], axis=1) - 1) * 0.2)   # room for his head
    return d
def loin_body(P):
    z0 = 1.12 + 0.06 * np.clip(P[:, 0], -0.5, 0.5)
    d = np.abs(ellcyl(P, (0, 0.10, 0), 0.40, 0.33)) - 0.025
    d = np.maximum(d, np.maximum(P[:, 2] - z0, 0.64 - P[:, 2] + 0.12 * np.abs(P[:, 0] + 0.04) / 0.3 - 0.07 * (fbm(P * [1, 1, 0.2], 9.0) - 0.4)))
    return np.maximum(d, -P[:, 1] - 0.05 + 0.0 * P[:, 0]) + np.where(np.abs(P[:, 0]) < 0.34, 0, 0.05)
def hides(P): return np.minimum(cape_body(P), loin_body(P))
def tuft_len(P):
    z = P[:, 2]
    L = mix(0.30, 0.10, sstep(1.85, 2.15, z))                 # long strands off his back, a short cushion on top
    L = mix(L, 0.20, (z < 1.15) & (P[:, 1] > 0.05))         # the moss skirt
    edge = mix(0.40, 1.0, sstep(1.15, 1.85, z)) - np.abs(P[:, 0])                   # how far in from where the moss ends at his sides
    L = np.maximum(L, 0.32 * sstep(0.12, 0.0, edge) * (z > 1.3))                   # long strands hanging off his shoulders (the sheet)
    return L * (0.9 + 0.2 * fbm(P, 3.0))
def flow(P, N):
    v = np.tile([0, -0.15, -1.0], (len(P), 1)).astype(np.float64)
    v[:, 0] += 0.25 * np.sign(P[:, 0]) * sstep(0.3, 0.7, np.abs(P[:, 0]))
    v = v + 0.25 * (np.stack([fbm(P + 3, 3.0), fbm(P + 7, 3.0), fbm(P + 11, 3.0)], 1) - 0.5)
    v = v - N * np.sum(v * N, 1, keepdims=True)
    return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)
def bare(P):
    # only the outside of the cape grows tufts (not its lining), and the loincloth's front
    return (trunk(P) < 0.04) & (P[:, 2] > 0.9) & (P[:, 1] < 0.05)     # the mantle's inner side, against his body
def style(TP, TL, rng):
    n = len(TP)
    W = TL * (0.42 + 0.1 * rng.random(n)); H = np.minimum(TL * (0.16 + 0.05 * rng.random(n)), 0.06)
    # patchwork: each hide its own shade (big patches), some mossy
    base = mix(FUR_D, FUR, np.clip(fbm(TP, 3.0) * 1.4 - 0.1, 0, 1)[:, None])
    C = mix(base, FUR_M, (np.clip((fbm(TP + 4, 2.4) - 0.58) * 4, 0, 1) * 0.7)[:, None])   # lichen-grey where it's old
    C = C * (0.85 + 0.3 * rng.random(n))[:, None]
    return dict(W=W, H=H, C=C)
# the boulders: each set on the mantle's outer surface, two thirds out of the moss
_BC = [((0.0, -0.40, 2.30), (0.18, 0.15, 0.11)), ((0.40, -0.25, 2.15), (0.14, 0.12, 0.09)), ((-0.38, -0.22, 2.18), (0.13, 0.12, 0.09)),
       ((0.05, -0.80, 1.60), (0.15, 0.09, 0.13)), ((-0.10, -0.10, 2.45), (0.10, 0.09, 0.06))]
_q, _n = project(A([c for c, r in _BC]), mantle_outer, it=12)
BOULDERS = [(tuple((_q[i] + _n[i] * 0.05 * min(r)).astype(float)), r) for i, (c, r) in enumerate(_BC)]   # half sunk into the moss
log('hides: the coat of tufts')
COAT = kitcoat.Coat(hides, LO, HI, LV, VOX, tuft_len, flow, bare, style, seed=23, spacing=0.36, strands=(4, 6), log=log)
P_.add('hides', COAT.full_sdf, 'fur')
P_.add('boulders', boulders, 'stone', k=0.04)

# ---- 4. surface detail by pass ---------------------------------------------------------------------------------------
LOOKS = [it[2] for it in P_.items]
def detail(P, d):
    if LV < 2: return d
    out = d.copy(); near = np.abs(d) < 0.02
    if not near.any(): return out
    Pn = P[near]; look = np.array(LOOKS)[P_.label(Pn)]
    dd = np.zeros(len(Pn), F32)
    sk = look == 'skin'
    if sk.any():
        q = Pn[sk]
        dd[sk] -= 0.009 * np.clip(vnoise(q, 34.0) - 0.42, 0, 1)                   # pebbled hide, warts here and there
        dd[sk] -= 0.003 * (fbm(q, 9.0, 2) - 0.5)                                   # folds and lumps
        if LV >= 3: dd[sk] -= 0.0012 * (vnoise(q, 120.0) - 0.5)
    le = look == 'leather'
    if le.any(): dd[le] -= 0.0015 * (fbm(Pn[le], 40.0, 2) - 0.5)
    out[near] = d[near] + dd
    return out
def full_sdf(P): return detail(P, P_.sdf(P))

# ---- 5. the body mesh -------------------------------------------------------------------------------------------------
M = Mesh()
log('body, voxel', VOX)
# his arms and legs are pieces of their own (Chris, November 21: "when they move their arms they stretch themselves"):
# meshed apart from his body (the arms pass inside his cape; the legs' tops sit up in his hips under the loincloth)
def group(names, keep=True):
    g = Parts()
    for it in P_.items:
        if (it[0] in names) == keep: g.items.append(it)
    return g
# his head too (kind 14), so it turns on his thick neck without dragging the fur collar after it
HEADP = {'head', 'ears', 'eye1', 'eye-1'}
LIMB = {'arms', 'fists', 'legs'} | HEADP
GROUPS = [(group(LIMB, False), 0, LO, HI), (group({'arms', 'fists'}), 12, (-0.95, -0.15, 0.30), (0.95, 0.60, 2.0)),
          (group({'legs'}), 13, (-0.75, -0.40, -0.01), (0.75, 0.50, 1.30)),
          (group(HEADP), 14, (-0.50, 0.08, 1.62), (0.40, 0.84, 2.40))]
VS, FS, LK, KS, off = [], [], [], [], 0
for parts, kd, lo_, hi_ in GROUPS:
    Vg, Fg = mc(lambda P, p=parts: detail(P, p.sdf(P)), VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg)
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)]); KS.append(np.full(len(Vg), kd, np.uint8))
    log('piece', kd, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); look = np.concatenate(LK); KB = np.concatenate(KS)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 4.0); n2 = fbm(Vb + 5, 12.0)
skin = mix(SKIN_D, SKIN, np.clip(n1 * 1.6 - 0.2, 0, 1)[:, None])
skin = mix(skin, SKIN_L, (np.clip(n2 - 0.55, 0, 1) * 2)[:, None])
skin = mix(skin, np.array([0.17, 0.27, 0.07]), (np.clip((fbm(Vb + 9, 3.5) - 0.50) * 4, 0, 1) * 0.9)[:, None])   # moss growing on him in patches
m_ = look == 'stone'; col_st = mix(STONE_D, STONE, np.clip(n1 * 1.5 - 0.2, 0, 1)[:, None])
_fn = np.cross(Vb[Fb[:, 1]] - Vb[Fb[:, 0]], Vb[Fb[:, 2]] - Vb[Fb[:, 0]]); _vn = np.zeros_like(Vb)
for _j in range(3): np.add.at(_vn, Fb[:, _j], _fn)
_vn /= np.maximum(np.linalg.norm(_vn, axis=1, keepdims=True), 1e-9)
_mo = np.clip(sstep(-0.1, 0.5, _vn[:, 2]) * (0.6 + 0.8 * (fbm(Vb + 2, 7.0) - 0.5)), 0, 1)
col_st = mix(col_st, mix(FUR_D, FUR, fbm(Vb, 20.0)[:, None]), _mo[:, None])                     # moss over the boulders' tops
col[:] = skin; mat[:] = MAT['skin']
fc, top, has = COAT.colours(Vb, skin)
m = look == 'fur'; col[m] = fc[m] * (1 - 0.45 * np.clip(1 - top[m] / 0.01, 0, 1))[:, None]; mat[m] = MAT['fur']
m = look == 'leather'; col[m] = mix(LEATHER * 0.7, LEATHER, np.clip(n2[m] * 1.5, 0, 1)[:, None]); mat[m] = MAT['leather']
m = look == 'red'; col[m] = RED * (0.8 + 0.3 * n2[m])[:, None]; mat[m] = MAT['leather']
m = look == 'metal'; col[m] = BUCKLE * (0.8 + 0.3 * n1[m])[:, None]; mat[m] = MAT['metal']
m = look == 'eye'; col[m] = EYE; mat[m] = MAT['eye']
col[m_] = col_st[m_]; mat[m_] = MAT['stone']
for s_ in (1, -1):
    pu = (np.linalg.norm(Vb - (HEAD + [s_ * 0.078, 0.228, 0.018]), axis=1) < 0.013) & m
    col[pu] = np.array([0.08, 0.06, 0.04])
# the mouth line and the eye sockets darker, the inside of the cape dark
mouth = np.linalg.norm((Vb - (HEAD + [0, 0.27, -0.115])) / [0.11, 0.05, 0.02], axis=1) < 1
col[mouth & (look == 'skin')] = MOUTH
sock = np.zeros(len(Vb), bool)
for s in (1, -1): sock |= np.linalg.norm((Vb - (HEAD + [s * 0.075, 0.185, 0.02])) / [0.05, 0.045, 0.035], axis=1) < 1
col[sock & (look == 'skin')] *= 0.45
crown = (KB == 14) & (look == 'skin') & (Vb[:, 2] > HEAD[2] + 0.06 + 0.04 * (fbm(Vb * 2, 6.0) - 0.5)) & (Vb[:, 1] < HEAD[1] + 0.15)
col[crown] = mix(FUR_D, FUR, fbm(Vb[crown], 14.0)[:, None]); mat[crown] = MAT['moss']
lining = (look == 'fur') & (trunk(Vb) < 0.04) & (Vb[:, 2] > 0.9) & (Vb[:, 1] < 0.05)
col[lining] = FUR_D * 0.6
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                     # kinds: 0 body, 12 arms, 13 legs, 14 head
M.K[-1][(look == 'fur') | (look == 'stone')] = 1    # kind 1: the mantle and its boulders, which ride his chest
M.K[-1][(look == 'fur') & (Vb[:, 1] > 0.0) & (Vb[:, 2] < 1.16)] = 15     # kind 15: the loincloth, which hangs from his belt (his hips)

place = lambda P: P_.sdf(P)
rng = np.random.default_rng(7)
def on_surf(p, out=0.0):
    q, n = project(A([p]), place, it=8); return q[0].astype(float) + n[0] * out, n[0].astype(float)

# ---- 6. tusks, nails, the thorn vine, shelf mushrooms ----------------------------------------------------------------
log('tusks, nails, thorn vine, mushrooms, club')
# the tusks: up from the lower jaw, past the upper lip
for s in (1, -1):
    b = HEAD + [s * 0.085, 0.25, -0.13]
    V, F = tube(catmull([b, b + [s * 0.01, 0.015, 0.045], b + [s * 0.015, 0.005, 0.08]], 14), 0.022 * (1 - np.linspace(0, 1, 15)) ** 0.8 + 0.003, SIDES + 4)
    M.add(V, F, HORN, 5, MAT['horn'])
# claws: toes (five broad ones on each foot) and the fists' nails
for s in (1, -1):
    for i in range(5):
        a = (i - 2) * 0.32
        base = ANK[s] + [s * 0.02 + math.sin(a) * 0.17, 0.12 + math.cos(a) * 0.22, -0.11]
        V, F = tube(catmull([base + [0, 0, 0.02], base + [math.sin(a) * 0.03, math.cos(a) * 0.035, 0.0], base + [math.sin(a) * 0.045, math.cos(a) * 0.05, -0.03]], 10),
                    np.linspace(0.042 - 0.006 * abs(i - 2), 0.018, 11), SIDES + 2)
        M.add(V, F, CLAW, 6, MAT['horn'])
# the thorn vine: slung from his right shoulder across his chest and gut to his left hip, thorns along it, weeping red
def vine(pts, n, out):
    pts = resample(catmull(pts, 120), n=n)
    Q = np.array([on_surf(p, out)[0] for p in pts]); NN = np.array([on_surf(p, 0)[1] for p in pts])
    Q = resample(catmull(Q, 200), n=n)
    rr = 0.026 + 0.006 * np.sin(np.linspace(0, 40, len(Q)))
    V, F = tube(Q, rr, SIDES + 4)
    M.add(V, F, np.clip(mix(THORN * 0.6, THORN, fbm(V * 30, 2.0)[:, None]), 0, 1), 4, MAT['thorn'])
    for i in range(3, len(Q) - 3, 5):
        t_ = Q[i + 1] - Q[i - 1]; t_ /= np.linalg.norm(t_); nn = NN[min(i * len(NN) // len(Q), len(NN) - 1)]
        side = np.cross(nn, t_); side /= np.linalg.norm(side)
        a = rng.random() * 2 * np.pi; d = math.cos(a) * side + abs(math.sin(a)) * nn
        V, F = tube(np.array([Q[i] + d * 0.015, Q[i] + d * 0.035 - t_ * 0.012, Q[i] + d * 0.06 - t_ * 0.03]), np.array([0.010, 0.006, 0.001]), max(5, SIDES - 2))
        M.add(V, F, np.array([0.45, 0.32, 0.22]), 4, MAT['horn'])
        if rng.random() < 0.35:                       # red weeping down from the vine
            L = 0.04 + 0.10 * rng.random()
            drip = np.array([on_surf(Q[i] + [0, 0, -L * k / 4], 0.004)[0] for k in range(5)])
            V, F = tube(drip, np.linspace(0.010, 0.004, 5) * (1 + 0.6 * (np.arange(5) == 4)), max(5, SIDES - 2))
            M.add(V, F, BLOOD, 4, MAT['blood'])
vine([(0.50, 0.30, 1.78), (0.30, 0.42, 1.60), (0.02, 0.50, 1.38), (-0.25, 0.46, 1.20), (-0.42, 0.30, 1.10)], 60, 0.012)
# shelf mushrooms on his left shoulder and down the left of his back, stacked in tiers
SH_MUSH = [(-0.62, 0.02, 2.06), (-0.70, -0.08, 2.02), (-0.55, 0.10, 2.10), (-0.66, -0.18, 1.98), (-0.48, -0.25, 2.12), (-0.58, -0.32, 2.02),
           (-0.45, -0.45, 1.98), (-0.74, 0.04, 1.94), (-0.72, -0.25, 1.88), (-0.52, -0.05, 2.15), (-0.40, -0.55, 1.90), (-0.30, -0.62, 1.95),
           (-0.20, -0.66, 2.0), (-0.78, -0.12, 1.84)]
for k, c in enumerate(SH_MUSH):
    p, nn = on_surf(np.array(c), 0.04)
    r = 0.06 + 0.03 * rng.random()
    th, ph = np.meshgrid(np.linspace(0, np.pi / 2, 5 + 2 * LV), np.linspace(0, 2 * np.pi, 10 + 4 * LV, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; Fc = []
    for i in range(nt - 1):
        for j in range(npp):
            a_ = i * npp + j; b_ = i * npp + (j + 1) % npp; Fc += [(a_, a_ + npp, b_ + npp), (a_, b_ + npp, b_)]
    out_ = nn * np.array([1, 1, 0.3]); out_ /= np.linalg.norm(out_)
    Vc = p + out_ * r * 0.3 + np.array([0, 0, r * 0.25]) + sp * [r, r, r * 0.55]          # a domed cap standing on the moss
    Cc = mix(CAP * 0.9, np.array([0.52, 0.40, 0.28]), np.clip(sp[:, 2:3] * 1.3 - 0.2, 0, 1))   # browner on top
    M.add(Vc, np.array(Fc), Cc, 8, MAT['cap'])

# ---- 7. the club in his left hand: a gnarled log, moss and mushrooms on its head --------------------------------------
G0 = FIST[-1] + [0.0, -0.06, 0.12]; G1 = FIST[-1] + [-0.24, 0.62, -0.58]
cp = resample(np.array([G0, G1]), n=40)
cu = np.linspace(0, 1, len(cp))
cr = 0.055 + 0.10 * cu ** 1.6
cr = cr * (1 + 0.12 * np.sin(cu * 23) * cu)
V, F = tube(cp, cr, SIDES + 6)
n_ = fbm(V * 6, 2.0)
M.add(V, F, np.clip(mix(WOOD_D, WOOD, (0.3 + 0.7 * n_)[:, None]), 0, 1), 10, MAT['wood'])
cdir = (G1 - G0) / np.linalg.norm(G1 - G0)
mb = []; mr = []
for i in range(40):
    t_ = 0.62 + 0.38 * rng.random(); a = rng.random() * 2 * np.pi
    e1 = np.cross(cdir, [0, 0, 1.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(cdir, e1)
    side = math.cos(a) * e1 + math.sin(a) * e2
    if side[2] < -0.2: continue
    c = G0 + (G1 - G0) * t_ + side * (0.055 + 0.10 * t_ ** 1.6) * 0.85
    mb.append(c); mr.append(0.025 + 0.02 * rng.random())
if mb:
    mossf = Blobs(np.array(mb), np.array(mr))
    mlo = np.min(mb, 0) - 0.08; mhi = np.max(mb, 0) + 0.08
    Vm, Fm = mc(mossf, max(VOX * 0.8, 0.005), mlo, mhi)
    M.add(Vm, Fm, np.clip(mix(MOSS * 0.6, MOSS, fbm(Vm * 20, 2.0)[:, None]), 0, 1), 10, MAT['moss'])
for k, (t_, a, h) in enumerate([(0.80, 1.2, 0.09), (0.92, 1.9, 0.07), (0.70, 0.6, 0.05)]):
    e1 = np.cross(cdir, [0, 0, 1.0]); e1 /= np.linalg.norm(e1); e2 = np.cross(cdir, e1)
    side = math.cos(a) * e1 + math.sin(a) * e2
    base = G0 + (G1 - G0) * t_ + side * (0.055 + 0.10 * t_ ** 1.6) * 0.9
    stem = np.array([base, base + [0, 0, h * 0.5], base + [0.005, 0.005, h]])
    V, F = tube(stem, np.linspace(0.009, 0.007, 3), SIDES)
    M.add(V, F, CAP * 0.95, 10, MAT['cap'])
    th, ph = np.meshgrid(np.linspace(0, np.pi / 2, 6 + 2 * LV), np.linspace(0, 2 * np.pi, 10 + 4 * LV, endpoint=False), indexing='ij')
    sp = np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)], -1).reshape(-1, 3)
    nt, npp = th.shape; Fc = []
    for i in range(nt - 1):
        for j in range(npp):
            a_ = i * npp + j; b_ = i * npp + (j + 1) % npp; Fc += [(a_, a_ + npp, b_ + npp), (a_, b_ + npp, b_)]
    r = 0.028 + 0.012 * (k == 0)
    M.add(base + [0.005, 0.005, h] + sp * [r, r, r * 0.55], np.array(Fc), CAP, 10, MAT['cap'])

V, F, C, K, MT = M.arrays()
V = V * SC                                         # the peak-troll at 0.9 of Old Horn's size
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
