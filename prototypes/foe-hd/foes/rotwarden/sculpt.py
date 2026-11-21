# The Rotwarden's sculpt (Foes: walkers, session 8, November 20), made in passes, shape first.
#
# Act One's second Champion: "A First-Age warden of the root, bark grown through its plate, wearing a smith's mask that
# is not its face." Chris's sheet (art-in/3d/sheets/sheet-rotwarden.webp: front, side, back) shows a giant in teal plate
# with gold rims, a steel visored helm with a tree growing out of its crown, roots wound through every joint, moss on the
# shoulders, a gold mask on a chain over his chest, and in place of his left arm one great root that reaches the floor.
#
# Not fuzz: the plates are real pieces (cut edges, raised gold rims, rivets), the roots are twisted strands, the moss
# is cushions of lumps, the bark has ridges. The same pieces at every pass, finer each time:
#
#   pass 1  shape    ~100k triangles: the masses, every plate, the helm, the root arm, the roots and branches as tubes
#   pass 2  form     ~400k: bark ridges, hammer dents and worn edges on the plates, moss lumps within lumps
#   pass 3  detail   ~1M:   fine bark fissures, pitting, the strands at full roundness
#
# Measured off the sheet at 2.5 m to the tips of the branches (the helm's top at 2.17 m, the shoulders 1.69 m).
#   python3.12 sculpt.py OUT_DIR PASS        -> OUT_DIR/high-PASS.npz (V, F, colour C, kind K, material M)
import sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../pages/walkers/kit'))
from sdf import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'build'
LV = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
VOX = {1: 0.016, 2: 0.0072, 3: 0.0052}[LV]
SIDES = {1: 6, 2: 10, 3: 14}[LV]
STEP = {1: 0.03, 2: 0.016, 3: 0.009}[LV]
S = 2.5 / 946           # metres per sheet pixel
def fx(px): return (240 - px) * S        # front view: sheet x -> his right (+x)
def sz(py): return (970 - py) * S        # sheet y -> height
def sy(px): return (px - 745) * S        # side view: sheet x -> forward (+y)

# ---- looks: colour, roughness, metalness ---------------------------------------------------------------------------
TEAL = np.array([0.13, 0.29, 0.28]); TEAL_D = np.array([0.08, 0.19, 0.19]); TEAL_L = np.array([0.20, 0.38, 0.35])
GOLD = np.array([0.80, 0.60, 0.22]); GOLD_D = np.array([0.50, 0.33, 0.10])
STEEL = np.array([0.52, 0.54, 0.57]); STEEL_D = np.array([0.24, 0.25, 0.27])
BARK = np.array([0.36, 0.24, 0.12]); BARK_D = np.array([0.18, 0.11, 0.05]); BARK_L = np.array([0.52, 0.37, 0.18])
MOSS = np.array([0.42, 0.46, 0.12]); MOSS_D = np.array([0.24, 0.30, 0.07])
LEATHER = np.array([0.24, 0.16, 0.09]); SOLE = np.array([0.12, 0.08, 0.05]); VOID = np.array([0.03, 0.03, 0.03])
FUNGUS = np.array([0.74, 0.58, 0.38]); LEAF = np.array([0.55, 0.62, 0.20])
RUST = np.array([0.36, 0.26, 0.12])
MAT = {'plate': (0.55, 0.45), 'gold': (0.32, 1.0), 'steel': (0.35, 0.95), 'bark': (0.9, 0.0), 'moss': (0.95, 0.0),
       'leather': (0.75, 0.0), 'void': (1.0, 0.0), 'fungus': (0.85, 0.0)}

# ---- 1. the body inside, of bark ----------------------------------------------------------------------------------
P_ = Parts()
HIP = np.array([0, 0.0, 1.0]); NECK0 = np.array([0, 0.03, 1.78]); NECK1 = np.array([0, 0.13, 1.92])
HEAD = np.array([0, 0.17, 2.02])
SH = {1: np.array([0.40, 0.0, 1.67]), -1: np.array([-0.40, 0.0, 1.67])}
R_ELB = np.array([0.53, 0.0, 1.31]); R_WRI = np.array([0.56, 0.05, 1.02]); R_FIST = np.array([0.56, 0.07, 0.89])   # hanging clear of his side
KNEE = {s: np.array([s * 0.215, 0.04, 0.63]) for s in (1, -1)}
ANK = {s: np.array([s * 0.235, 0.0, 0.17]) for s in (1, -1)}
THI = {s: np.array([s * 0.18, 0.0, 0.97]) for s in (1, -1)}
# the root arm, from the front view (sheet x, y) and pushed a little forward toward the tip
ROOT = [(fx(px), yy, sz(py)) for (px, py, yy) in
    [(318, 262, 0.02), (360, 300, 0.10), (392, 390, 0.12), (405, 470, 0.10), (430, 570, 0.08), (458, 680, 0.08), (488, 800, 0.09), (512, 900, 0.1), (534, 966, 0.11)]]
ROOT_R = [0.12, 0.15, 0.16, 0.155, 0.14, 0.12, 0.085, 0.05, 0.012]

def bark_body(P):
    d = ell(P, (0, 0.03, 1.56), (0.29, 0.19, 0.25))                           # chest
    d = smin(d, ell(P, (0, 0.02, 1.28), (0.26, 0.17, 0.17)), 0.08)            # belly
    d = smin(d, ell(P, (0, 0.0, 1.03), (0.28, 0.18, 0.17)), 0.08)             # pelvis
    d = smin(d, cap(P, NECK0, NECK1, 0.10, 0.085), 0.05)                      # neck
    for s in (1, -1):
        d = smin(d, sph(P, SH[s], 0.13), 0.08)
    return d
# his arm and his legs are pieces of their own (Chris, November 21: "when they move their arms they stretch themselves"):
# each is meshed apart from his body with its top tucked under the pauldron or the hip hoops, so no skin joins them
def bark_arm(P):
    d = cap(P, SH[1] + [0.0, 0, -0.04], R_ELB, 0.10, 0.09)
    return smin(d, cap(P, R_ELB, R_WRI, 0.09, 0.08), 0.03)
def bark_legs(P):
    d = None
    for s in (1, -1):
        e = smin(cap(P, THI[s] + [0, 0, 0.05], KNEE[s], 0.15, 0.12), cap(P, KNEE[s], ANK[s], 0.12, 0.10), 0.04)
        d = e if d is None else np.minimum(d, e)
    return d
P_.add('body', bark_body, 'bark')
P_.add('arm-bark', bark_arm, 'bark')
P_.add('leg-bark', bark_legs, 'bark')
P_.add('head-bark', lambda P: ell(P, HEAD, (0.12, 0.14, 0.13)), 'bark')     # his head inside the helm: a piece of its own

# the right fist (a bark gauntlet): knuckles, fingers curled, the thumb across
def fist(P):
    d = ell(P, R_FIST + [0, 0, 0.02], (0.06, 0.085, 0.085))
    for i in range(4):
        y = 0.07 + 0.11 * (i - 1.5) / 3 * 0.9
        d = smin(d, cap(P, R_FIST + [0.0, y, -0.03], R_FIST + [-0.035, y, -0.09], 0.024, 0.021), 0.012)
        d = smin(d, sph(P, R_FIST + [0.025, y, 0.0], 0.026), 0.012)
    d = smin(d, cap(P, R_FIST + [-0.045, 0.06, 0.02], R_FIST + [-0.05, 0.10, -0.04], 0.022, 0.018), 0.012)
    d = smin(d, cap(P, R_WRI, R_FIST + [0, 0, 0.05], 0.07, 0.065), 0.02)
    return d
P_.add('fist', fist, 'leather')

# ---- 2. the plates ---------------------------------------------------------------------------------------------------
def rimmed(name, fn_piece, fn_rim, look='plate'):
    P_.add(name, fn_piece, look); P_.add(name + '-rim', fn_rim, 'gold')

# breastplate: a shell over the chest, a soft keel down the middle, rims at the waist and the neck
BP_C, BP_R = (0, 0.05, 1.56), (0.335, 0.235, 0.27)
def breast(P):
    d = slab(ell(P, BP_C, np.array(BP_R) * [1, 0.93, 1]), P, 1.31, 1.83)
    for sx in (1, -1):                                       # two chest plates, so it is not one ball
        d = smin(d, slab(ell(P, (sx * 0.135, 0.12, 1.60), (0.17, 0.15, 0.17)), P, 1.31, 1.83), 0.05)
    d = smin(d, slab(ell(P, (0, 0.08, 1.40), (0.27, 0.19, 0.12)), P, 1.31, 1.83), 0.05)   # the belly plate below them
    d = smin(d, slab(cap(P, (0, 0.235, 1.34), (0, 0.24, 1.47), 0.022), P, 1.31, 1.83), 0.03)
    return d
def breast_rim(P):
    big = ell(P, BP_C, np.array(BP_R) + 0.012)
    return np.minimum(slab(big, P, 1.31, 1.335), slab(big, P, 1.80, 1.83))
rimmed('breast', breast, breast_rim)
# gorget round the neck
P_.add('gorget', lambda P: slab(ellcyl(P, (0, 0.05, 0), 0.16, 0.15), P, 1.76, 1.84), 'plate')

# pauldrons: a dome and two lames below it, each with a gold rim at its lower edge
def pauldron_parts(s):
    c = SH[s] + [s * 0.0, 0.0, 0.0]
    dome = lambda P, c=c: slab(ell(P, c, (0.165, 0.21, 0.18)), P, 1.55, 2.0)
    l1 = lambda P, c=c: slab(ell(P, c + [s * 0.02, 0, -0.10], (0.16, 0.20, 0.10)), P, 1.47, 1.56)
    l2 = lambda P, c=c: slab(ell(P, c + [s * 0.035, 0, -0.19], (0.145, 0.185, 0.09)), P, 1.39, 1.475)
    rim = lambda P, c=c: np.minimum.reduce([
        slab(ell(P, c, (0.175, 0.22, 0.19)), P, 1.55, 1.575),
        slab(ell(P, c + [s * 0.02, 0, -0.10], (0.17, 0.21, 0.11)), P, 1.47, 1.49),
        slab(ell(P, c + [s * 0.035, 0, -0.19], (0.155, 0.195, 0.10)), P, 1.39, 1.41)])
    return dome, l1, l2, rim
for s in (1, -1):
    dome, l1, l2, rim = pauldron_parts(s)
    P_.add(f'pauldron{s}', lambda P, a=dome, b=l1, c=l2: np.minimum.reduce([a(P), b(P), c(P)]), 'plate')
    P_.add(f'pauldron{s}-rim', rim, 'gold')

# the right arm: a rerebrace, an elbow cop, a vambrace with rims at elbow and wrist
P_.add('rerebrace', lambda P: cap(P, SH[1] + [0.03, 0, -0.22], R_ELB + [0, 0, 0.06], 0.112, 0.105), 'plate')
P_.add('elbow', lambda P: ell(P, R_ELB + [0.01, -0.02, 0], (0.11, 0.11, 0.09)), 'plate')
VB0, VB1 = R_ELB + [0.0, 0.006, -0.05], R_WRI + [0, 0, 0.03]
def vamb(P):
    t = capt(P, VB0, VB1)
    return np.maximum(cap(P, VB0, VB1, 0.112, 0.098), np.maximum(-t + 0.0, t - 1.0))
def vamb_rim(P):
    t = capt(P, VB0, VB1); d = cap(P, VB0, VB1, 0.124, 0.110)
    return np.maximum(d, np.minimum(np.abs(t - 0.04) - 0.06, np.abs(t - 0.96) - 0.06))
rimmed('vambrace', vamb, vamb_rim)

# faulds: three hoops round the hips, each a little wider than the one above, gold at each lower edge
for i, zb in enumerate((1.21, 1.11, 1.01)):
    rx, ry = 0.30 + 0.014 * i, 0.215 + 0.012 * i
    P_.add(f'fauld{i}', lambda P, rx=rx, ry=ry, zb=zb: slab(ellcyl(P, (0, 0.02, 0), rx, ry), P, zb, zb + 0.105), 'plate')
    P_.add(f'fauld{i}-rim', lambda P, rx=rx, ry=ry, zb=zb: slab(ellcyl(P, (0, 0.02, 0), rx + 0.012, ry + 0.012), P, zb, zb + 0.026), 'gold')
P_.add('fauld-top-rim', lambda P: slab(ellcyl(P, (0, 0.02, 0), 0.312, 0.227), P, 1.29, 1.315), 'gold')
# the tasset over his left hip (front): a curved plate, rimmed in gold, rivets at its corner
TA = dict(rx=0.36, ry=0.27, z0=0.74, z1=1.06)
def tasset(P):
    d = slab(np.abs(ellcyl(P, (0, 0.02, 0), TA['rx'], TA['ry'])) - 0.014, P, TA['z0'], TA['z1'])
    return np.maximum(d, np.maximum(P[:, 0] - (-0.015), -0.30 - P[:, 0])) + np.where(P[:, 1] > -0.02, 0, 1)
def tasset_rim(P):
    d = slab(np.abs(ellcyl(P, (0, 0.02, 0), TA['rx'], TA['ry'])) - 0.019, P, TA['z0'] - 0.003, TA['z1'] + 0.003)
    d = np.maximum(d, np.maximum(P[:, 0] - (-0.005), -0.31 - P[:, 0])) + np.where(P[:, 1] > -0.02, 0, 1)
    inner = np.maximum(np.maximum(P[:, 0] + 0.03, -0.285 - P[:, 0]), np.maximum(TA['z0'] + 0.02 - P[:, 2], P[:, 2] - TA['z1'] + 0.02))
    return np.maximum(d, -inner)
rimmed('tasset', tasset, tasset_rim)

# legs: cuisses, knee cops (a shield shape pointing down), greaves with gold at the top and the ankle, boots
for s in (1, -1):
    K = KNEE[s]
    P_.add(f'cuisse{s}', lambda P, s=s: cap(P, THI[s] + [0, 0.01, -0.06], KNEE[s] + [0, 0, 0.08], 0.158, 0.135), 'plate')
    def kc(P, K=K):
        d = ell(P, K + [0, 0.07, 0.0], (0.135, 0.085, 0.12))
        d = smin(d, cap(P, K + [0, 0.10, -0.02], K + [0, 0.112, -0.08], 0.055, 0.014, scale=(1.6, 1, 1)), 0.03)   # its point stops short of the shin, so the knee can bend
        return d
    def kc_rim(P, K=K):
        d = ell(P, K + [0, 0.065, 0.0], (0.148, 0.09, 0.132))
        return slab(d, P, K[1] + 0.035, K[1] + 0.065, axis=1)
    rimmed(f'knee{s}', kc, kc_rim)
    G0, G1 = KNEE[s] + [0, 0.005, -0.06], ANK[s] + [0, 0.005, 0.05]
    P_.add(f'greave{s}', lambda P, a=G0, b=G1: cap(P, a, b, 0.138, 0.13), 'plate')
    P_.add(f'greave{s}-rim', lambda P, a=G0, b=G1: np.maximum(cap(P, a, b, 0.15, 0.142), np.abs(capt(P, a, b) - 0.97) - 0.045), 'gold')
    F_ = ANK[s]
    def boot(P, F_=F_):
        d = slab(ell(P, (F_[0], 0.10, 0.08), (0.155, 0.26, 0.11)), P, 0.0, 1.0)
        d = smin(d, cap(P, (F_[0], 0.0, 0.08), (F_[0], 0.0, 0.21), 0.145, 0.14), 0.04)
        d = smin(d, ell(P, (F_[0], 0.25, 0.075), (0.135, 0.12, 0.08)), 0.04)                 # toe
        return d
    P_.add(f'boot{s}', boot, 'leather')
    P_.add(f'sole{s}', lambda P, F_=F_: slab(ell(P, (F_[0], 0.11, 0.06), (0.165, 0.28, 0.11)), P, 0.0, 0.032), 'sole')
    P_.add(f'cuff{s}', lambda P, F_=F_: slab(cap(P, (F_[0], 0, 0.1), (F_[0], 0, 0.3), 0.153), P, 0.19, 0.23), 'leather')

# ---- 3. the helm --------------------------------------------------------------------------------------------------
HC = np.array([0, 0.165, 2.03])
def helm(P):
    d = slab(ell(P, HC, (0.15, 0.18, 0.155)), P, 1.90, 3.0)
    # the visor: a face plate with a prow down the middle, its lower edge a V down to the beak (the sheet's front view)
    face = slab(ell(P, HC + [0, 0.06, -0.04], (0.142, 0.16, 0.135)), P, 1.83, 2.075)
    face = np.maximum(face, -(P[:, 1] - 0.12))
    a = math.radians(38)
    prow = np.maximum(P[:, 0] * math.sin(a) + (P[:, 1] - 0.338) * math.cos(a), -P[:, 0] * math.sin(a) + (P[:, 1] - 0.338) * math.cos(a))
    face = np.maximum(face, prow)
    face = np.maximum(face, (1.848 + 0.62 * np.abs(P[:, 0])) - P[:, 2])
    d = np.minimum(d, face)
    # the beak: a bar down the prow, past the V
    d = smin(d, cap(P, (0, 0.335, 2.07), (0, 0.338, 1.835), 0.021, 0.014, scale=(0.75, 1, 1)), 0.012)
    # the eye slits either side of it, angled up toward the temples
    for sx in (1, -1):
        q = P - A([sx * 0.074, 0.30, 1.997])
        ang = sx * 0.16; c, s_ = math.cos(ang), math.sin(ang)
        q2 = np.stack([q[:, 0] * c + q[:, 2] * s_, q[:, 1], -q[:, 0] * s_ + q[:, 2] * c], 1)
        sl = rbox(q2, (0, 0, 0), (0.044, 0.12, 0.0105), 0.004)
        d = np.maximum(d, -sl)
    # breathing holes low on the cheeks, in two rows
    for sx in (1, -1):
        for k in range(4):
            for row in (0, 1):
                xx = sx * (0.04 + 0.02 * k); yy = 0.338 - abs(xx) * math.tan(a) / 1.0 - 0.004
                d = np.maximum(d, -sph(P, (xx, yy, 1.94 - 0.025 * row + 0.012 * k), 0.0075))
    return d
P_.add('helm', helm, 'steel')
P_.add('helm-band', lambda P: slab(ell(P, HC, (0.163, 0.193, 0.168)), P, 2.055, 2.09), 'steel')
P_.add('helm-ridge', lambda P: np.maximum(ell(P, HC + [0, 0, 0.005], (0.03, 0.19, 0.16)), 2.06 - P[:, 2]), 'steel')
for sx in (1, -1):
    P_.add(f'helm-bolt{sx}', lambda P, sx=sx: ell(P, (sx * 0.147, 0.14, 2.0), (0.02, 0.03, 0.03)), 'gold')
    P_.add(f'helm-boss{sx}', lambda P, sx=sx: ell(P, (sx * 0.14, 0.14, 2.0), (0.02, 0.045, 0.045)), 'steel')
P_.add('void', lambda P: ell(P, HC + [0, 0.02, -0.04], (0.11, 0.105, 0.11)), 'void')    # dark inside, behind the slits
# rivets round the brow band
HRIV = np.array([[0.168 * math.sin(t_), HC[1] + 0.198 * math.cos(t_), 2.072] for t_ in np.linspace(-1.5, 1.5, 9)], np.float32)
P_.add('helm-rivets', lambda P: np.min(np.stack([sph(P, c, 0.011) for c in HRIV], 1), 1), 'steel')

# ---- 4. the gold mask on his chest -----------------------------------------------------------------------------------
MK = np.array([0, 0.285, 1.54])
def mask(P):
    d = ell(P, MK, (0.08, 0.036, 0.105))
    d = smin(d, cap(P, MK + [0, -0.004, -0.06], MK + [0, -0.01, -0.135], 0.04, 0.008, scale=(1.3, 1, 1)), 0.03)   # the pointed chin
    d = smin(d, cap(P, MK + [0, 0.03, 0.03], MK + [0, 0.042, -0.03], 0.011, 0.014), 0.012)                     # nose
    d = smin(d, ell(P, MK + [0, 0.012, 0.055], (0.065, 0.025, 0.02)), 0.02)                                     # brow
    for sx in (1, -1):
        d = np.maximum(d, -ell(P, MK + [sx * 0.028, 0.035, 0.02], (0.02, 0.012, 0.006)))                        # closed eyes
        d = smin(d, ell(P, MK + [sx * 0.045, 0.012, -0.02], (0.018, 0.016, 0.022)), 0.01)                       # cheeks
    d = np.maximum(d, -ell(P, MK + [0, 0.036, -0.058], (0.022, 0.012, 0.004)))                                  # mouth
    return d
P_.add('mask', mask, 'gold')

# ---- 5. rivets on the plates ----------------------------------------------------------------------------------------
RIV = []
for s in (1, -1):
    c = SH[s] + [s * 0.02, 0, 0]
    for a in np.linspace(-1.0, 1.0, 5):
        RIV.append(c + [s * 0.165 * math.cos(a) * 0.98, 0.205 * math.sin(a) * 0.98, -0.10])
    RIV.append(c + [s * 0.05, 0.0, 0.175])
for s in (1, -1):
    K = KNEE[s]; RIV += [K + [s * 0.1, 0.12, 0.05], K + [-s * 0.1, 0.12, 0.05]]
RIV += [np.array([-0.04, 0.29, 1.03]), np.array([-0.27, 0.22, 1.03]), np.array([-0.04, 0.30, 0.78])]
for a in np.linspace(-1.1, 1.1, 7):
    RIV.append(np.array([0.33 * math.sin(a), 0.02 + 0.245 * math.cos(a), 1.255]))
RIV += [R_ELB + [0.09, 0.05, -0.08], R_WRI + [0.08, 0.04, 0.08]]
RIV = np.array(RIV, np.float32)
ARM_RIV = (RIV[:, 0] > 0.45) & (RIV[:, 2] < 1.45); LEG_RIV = RIV[:, 2] < 0.85
for nm, sel in (('rivets', ~ARM_RIV & ~LEG_RIV), ('arm-rivets', ARM_RIV), ('leg-rivets', LEG_RIV)):
    P_.add(nm, lambda P, R_=RIV[sel]: np.min(np.stack([sph(P, c, 0.014) for c in R_], 1), 1), 'gold')

# ---- 6. the root arm (his left): a solid core, the strands come later as tubes ----------------------------------------
ROOT_CORE = lambda P: chain_cap(P, ROOT, [r * 0.6 for r in ROOT_R])      # meshed on its own below (kind 10): a piece of its own, not welded to his shoulder
# bracket fungi along its outer edge
FUN = [(ROOT[2] + np.array([-0.15, 0.03, -0.02]), 0.07), (ROOT[3] + np.array([-0.14, 0.02, 0.05]), 0.06),
       (ROOT[3] + np.array([-0.13, 0.04, -0.07]), 0.055), (ROOT[4] + np.array([-0.11, 0.03, 0.03]), 0.05),
       (ROOT[5] + np.array([-0.08, 0.03, 0.06]), 0.04), (ROOT[2] + np.array([-0.10, -0.12, 0.10]), 0.05)]
def fungi(P):
    d = None
    for c, r in FUN:
        e = slab(ell(P, c, (r, r * 0.95, r * 0.28)), P, c[2] - r, c[2] + r * 0.2)
        d = e if d is None else np.minimum(d, e)
    return d
# the fungi go with the root arm (meshed with it, below)

# ---- 7. moss: cushions on the shoulders, the root and the back, built from lumps -----------------------------------
rng = np.random.default_rng(17)
core_sdf = P_.sdf
log('moss: a first surface to grow on')
Vc, Fc = mc(core_sdf, 0.02, (-0.95, -0.42, -0.02), (0.75, 0.48, 2.3))
Ps = sample_surface(Vc, Fc, 200000, rng)
N0 = grad(core_sdf, A(Ps))
def moss_w(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    w = np.exp(-(((x + 0.40) / 0.17) ** 2 + ((y + 0.0) / 0.25) ** 2 + ((z - 1.82) / 0.12) ** 2))          # left shoulder, big
    w += 0.8 * np.exp(-(((x - 0.40) / 0.14) ** 2 + ((y + 0.03) / 0.2) ** 2 + ((z - 1.80) / 0.09) ** 2))   # right shoulder
    w += 0.7 * np.exp(-(((x + 0.15) / 0.2) ** 2 + ((y + 0.20) / 0.1) ** 2 + ((z - 1.70) / 0.15) ** 2))   # upper back
    w += 0.4 * np.exp(-(((x - 0.1) / 0.1) ** 2 + ((y - 0.25) / 0.1) ** 2 + ((z - 1.72) / 0.05) ** 2))    # a tuft on the chest
    return w * (0.55 + 0.9 * fbm(P, 6.0))
mw = moss_w(Ps) * sstep(-0.1, 0.4, N0[:, 2])
keep = rng.random(len(Ps)) < np.clip(mw, 0, 1) ** 1.5
MP = Ps[keep]; MN = N0[keep]
take = poisson(MP, 0.026, rng); MP, MN = MP[take], MN[take]
# no lone peas: keep only lumps with neighbours, so the moss grows in cushions
from scipy.spatial import cKDTree as _T
nb = np.array([len(x) for x in _T(MP).query_ball_point(MP, 0.07)])
MP, MN = MP[nb >= 5], MN[nb >= 5]
MR = 0.026 + 0.026 * rng.random(len(MP)) * np.clip(moss_w(MP), 0, 1)
moss_blobs = Blobs(MP - MN * MR[:, None] * 0.45, MR)
if LV >= 2:
    # lumps within the lumps: smaller cushions on top of the big ones
    j = rng.integers(0, len(MP), len(MP) * 3)
    off = rng.normal(size=(len(j), 3)); off -= MN[j] * np.sum(off * MN[j], 1, keepdims=True)
    off /= np.maximum(np.linalg.norm(off, axis=1, keepdims=True), 1e-6)
    C2 = MP[j] + MN[j] * MR[j, None] * 0.25 + off * MR[j, None] * 0.6
    moss2 = Blobs(C2, MR[j] * 0.42)
    P_.add('moss', lambda P: np.minimum(moss_blobs(P), moss2(P)), 'moss')
else:
    P_.add('moss', moss_blobs, 'moss')
log('moss lumps', len(MP))

# ---- 8. surface detail by pass --------------------------------------------------------------------------------------
LOOKS = [it[2] for it in P_.items]
def detail(P, d, parts=None):
    parts = parts or P_
    if LV < 2: return d
    out = d.copy()
    near = np.abs(d) < 0.02
    if not near.any(): return out
    Pn = P[near]
    look = np.array([it[2] for it in parts.items])[parts.label(Pn)]
    dd = np.zeros(len(Pn), F32)
    bark = look == 'bark'
    if bark.any():
        q = Pn[bark] * [1.0, 1.0, 0.28]                         # ridges run along the limbs (mostly up and down)
        r = ridged(q, 24.0, 2 if LV == 2 else 3)
        dd[bark] -= 0.006 * (r - 0.55)
        if LV >= 3: dd[bark] -= 0.0018 * (vnoise(Pn[bark], 140.0) - 0.5)
    plate = (look == 'plate') | (look == 'steel')
    if plate.any():
        dent = fbm(Pn[plate], 9.0, 2)
        dd[plate] += 0.0022 * np.clip(dent - 0.62, 0, 1) * 6                          # hammer dents
        if LV >= 3: dd[plate] += 0.0007 * (vnoise(Pn[plate], 260.0) > 0.86)            # pitting
    gold = look == 'gold'
    if gold.any() and LV >= 3: dd[gold] += 0.0005 * (vnoise(Pn[gold], 300.0) - 0.5)
    leather = look == 'leather'
    if leather.any(): dd[leather] -= 0.0015 * (fbm(Pn[leather], 45.0, 2) - 0.5)
    out[near] = d[near] + dd
    return out

def full_sdf(P):
    return detail(P, P_.sdf(P))

# ---- 9. the body mesh, the arm and the legs: three pieces, meshed apart -------------------------------------------------
HEAD_PARTS = {'head-bark', 'helm', 'helm-band', 'helm-ridge', 'helm-bolt1', 'helm-bolt-1', 'helm-boss1', 'helm-boss-1', 'void', 'helm-rivets'}
ARM_PARTS = {'arm-bark', 'fist', 'rerebrace', 'elbow', 'vambrace', 'vambrace-rim', 'arm-rivets'}
LEG_PARTS = {'leg-bark', 'leg-rivets'} | {f'{p}{s}{r}' for p in ('cuisse', 'knee', 'greave', 'boot', 'sole', 'cuff') for s in (1, -1) for r in ('', '-rim')}
def group(names):
    g = Parts()
    for it in P_.items:
        if it[0] in names: g.items.append(it)
    return g
PIECES = [('body', group({it[0] for it in P_.items} - ARM_PARTS - LEG_PARTS - HEAD_PARTS), 0, (-0.95, -0.42, 0.55), (0.75, 0.50, 2.3)),
          ('head', group(HEAD_PARTS), 14, (-0.26, -0.12, 1.78), (0.26, 0.45, 2.26)),
          ('arm', group(ARM_PARTS), 12, (0.20, -0.25, 0.70), (0.78, 0.35, 1.80)),
          ('legs', group(LEG_PARTS), 13, (-0.50, -0.30, -0.02), (0.50, 0.50, 1.15))]
M = Mesh()
VS, FS, LK, KS, off = [], [], [], [], 0
for nm, parts, kd, lo_, hi_ in PIECES:
    log(nm, 'voxel', VOX)
    Vg, Fg = mc(lambda P, p=parts: detail(P, p.sdf(P), p), VOX, lo_, hi_)
    VS.append(Vg); FS.append(Fg + off); off += len(Vg)
    LK.append(np.array([it[2] for it in parts.items])[parts.label(Vg)]); KS.append(np.full(len(Vg), kd, np.uint8))
    log(nm, 'tris', len(Fg))
Vb = np.concatenate(VS); Fb = np.concatenate(FS); look = np.concatenate(LK); KB = np.concatenate(KS)
col = np.zeros((len(Vb), 3)); mat = np.zeros((len(Vb), 2))
n1 = fbm(Vb, 5.0); n2 = fbm(Vb + 5, 14.0); n3 = fbm(Vb + 9, 2.2)
def put(m, c, mt): col[m] = c[m] if np.ndim(c) == 2 else c; mat[m] = mt
# teal plate, weathered: lighter where it bulges, stains of rust and moss in blotches, darker toward the edges
m = look == 'plate'
c = mix(TEAL_D, TEAL_L, np.clip(n1 * 1.4 - 0.2, 0, 1)[:, None])
c = mix(c, RUST, (np.clip((n2 - 0.6) * 5, 0, 1) * 0.75)[:, None])
c = mix(c, MOSS_D, (np.clip((fbm(Vb + 21, 7.0) - 0.62) * 5, 0, 1) * 0.8)[:, None])
put(m, c, MAT['plate'])
m = look == 'gold'; put(m, mix(GOLD_D, GOLD, np.clip(n2 * 1.6 - 0.2, 0, 1)[:, None]), MAT['gold'])
m = look == 'steel'; put(m, mix(STEEL_D, STEEL, np.clip(n1 * 1.5 - 0.1, 0, 1)[:, None]), MAT['steel'])
m = look == 'bark'
c = mix(BARK_D, BARK, np.clip(ridged(Vb * [1, 1, 0.28], 24.0, 2) * 1.5 - 0.3, 0, 1)[:, None])
c = mix(c, BARK_L, (np.clip((n2 - 0.55) * 3, 0, 1) * 0.5)[:, None])
put(m, c, MAT['bark'])
m = look == 'moss'; put(m, mix(MOSS_D, MOSS, np.clip(n2 * 1.8 - 0.3, 0, 1)[:, None]), MAT['moss'])
m = look == 'leather'; put(m, mix(SOLE, LEATHER, np.clip(n1 * 1.6, 0, 1)[:, None]), MAT['leather'])
m = look == 'sole'; put(m, SOLE, MAT['leather'])
m = look == 'void'; put(m, VOID, MAT['void'])
# shade the crevices: points just inside another part's reach get darker (cheap cavity)
cav = np.clip(1 - (P_.sdf(Vb + grad(P_.sdf, Vb) * 0.012) / 0.012), 0, 1)
col = col * (1 - 0.35 * cav[:, None])
M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat)
M.K[-1][:] = KB                                           # kinds: 0 body, 12 his right arm, 13 his legs, 14 his helmed head
M.M[-1] = A(mat)

# ---- 9b. the root arm's core and its fungi: their own mesh (kind 10), hanging from a joint at his shoulder -------------
rp = Parts(); rp.add('core', ROOT_CORE, 'bark'); rp.add('fungi', fungi, 'fungus')
rlo = np.min(np.array(ROOT), 0) - 0.25; rhi = np.max(np.array(ROOT), 0) + 0.25
Vr, Fr = mc(rp.sdf, VOX, rlo, rhi)
rl = np.array(['bark', 'fungus'])[rp.label(Vr)]
rc = np.where((rl == 'fungus')[:, None], mix(FUNGUS * 0.55, FUNGUS, np.clip(fbm(Vr + 5, 14.0), 0, 1)[:, None] * 0.6 + 0.4),
              mix(BARK_D, BARK, np.clip(ridged(Vr * [1, 1, 0.28], 24.0, 2) * 1.5 - 0.3, 0, 1)[:, None]))
rm = np.where((rl == 'fungus')[:, None], np.array(MAT['fungus']), np.array(MAT['bark']))
M.add(Vr, Fr, np.clip(rc, 0, 1), 10, rm)
log('root core', len(Fr))

# ---- 10. roots: twisted strands round the root arm, wound through the joints, over chest and back ---------------------
surf_sdf = P_.sdf
def lay(pts, r, lift=0.85):
    Pp, Nn = project(A(pts), surf_sdf, it=6)
    Pp = Pp + Nn * (r * lift)
    for _ in range(3): Pp[1:-1] = (Pp[:-2] + 2 * Pp[1:-1] + Pp[2:]) / 4
    return Pp
vrng = np.random.default_rng(9)
def strand_col(n):
    return np.clip(mix(BARK_D, BARK_L, vrng.random() * 0.7) * (0.85 + 0.3 * vrng.random()), 0, 1)
def vine(path, r=0.02, strands=2, twist=0.09, kind=3):
    P = resample(path, STEP * 0.6)
    if len(P) < 4: return
    t, N, B = frames(P)
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    for k in range(strands):
        a = s / twist + k * 2 * np.pi / strands
        off = (np.cos(a)[:, None] * N + np.sin(a)[:, None] * B) * r * 0.45
        rr = r * 0.62 * (1 + 0.15 * np.sin(s * 23 + k))
        V, F = tube(P + off, rr, SIDES)
        M.add(V, F, strand_col(len(V)), kind, MAT['bark'])
def spiral(a, b, r_around, turns, n=80, phase=0.0, rv=0.02):
    a = np.asarray(a, float); b = np.asarray(b, float); ax = b - a; L = np.linalg.norm(ax); ax /= L
    e1 = np.cross(ax, [0, 1.0, 0]);
    if np.linalg.norm(e1) < 1e-3: e1 = np.cross(ax, [1.0, 0, 0])
    e1 /= np.linalg.norm(e1); e2 = np.cross(ax, e1)
    u = np.linspace(0, 1, n); ang = phase + u * turns * 2 * np.pi
    pts = a + ax * L * u[:, None] + (np.cos(ang)[:, None] * e1 + np.sin(ang)[:, None] * e2) * r_around
    return lay(pts, rv)

log('the root arm strands')
# the root arm: strands twisting round the core, thick to thin, splitting off near the shoulder
RP = catmull(ROOT, 140)
RR = np.interp(np.linspace(0, 1, len(RP)), np.linspace(0, 1, len(ROOT_R)), ROOT_R)
t_, N_, B_ = frames(RP)
sarc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(RP, axis=0), axis=1))]
NS = 15
for k in range(NS):
    ph = k * 2 * np.pi / NS + vrng.random() * 0.4
    a = ph + sarc * 2 * np.pi / (0.75 + 0.15 * (k % 3))
    rad = RR * (0.50 + 0.12 * math.sin(k * 1.7))
    end = int(len(RP) * (0.75 + 0.25 * vrng.random()))
    pts = RP[:end] + (np.cos(a[:end])[:, None] * N_[:end] + np.sin(a[:end])[:, None] * B_[:end]) * rad[:end, None]
    rr = RR[:end] * (0.40 + 0.08 * vrng.random()) * (1 - 0.6 * np.linspace(0, 1, end) ** 3)
    V, F = tube(resample(pts, n=end), rr, SIDES + 4)
    M.add(V, F, strand_col(len(V)), 10, MAT['bark'])            # kind 10: the root arm's own strands (they follow its bones)
# roots from the root arm's head: over the left shoulder, across the chest to the right hip, down the back
paths = [
    [(-0.22, 0.20, 1.80), (-0.05, 0.26, 1.62), (0.14, 0.26, 1.42), (0.28, 0.22, 1.26), (0.33, 0.16, 1.05)],
    [(-0.28, 0.16, 1.82), (-0.18, 0.25, 1.55), (-0.02, 0.27, 1.30), (0.10, 0.26, 1.08), (0.15, 0.22, 0.85)],
    [(-0.30, -0.18, 1.84), (-0.08, -0.23, 1.62), (0.14, -0.24, 1.40), (0.30, -0.18, 1.18), (0.30, -0.12, 0.95)],
    [(-0.35, -0.14, 1.80), (-0.22, -0.23, 1.45), (-0.05, -0.24, 1.20), (0.10, -0.22, 0.95)],
    [(-0.20, -0.10, 1.90), (0.05, -0.05, 1.92), (0.25, -0.05, 1.86), (0.42, 0.02, 1.84)],
    [(-0.20, 0.12, 1.86), (-0.08, 0.15, 1.93), (0.0, 0.12, 2.12)],
    [(0.12, -0.08, 1.88), (0.05, 0.02, 2.0), (0.02, 0.10, 2.15)],
]
for p in paths:
    vine(lay(catmull(p, 50), 0.03), r=0.034, strands=2)
# roots wound round the limbs and the waist
for s in (1, -1):
    vine(spiral(THI[s] + [0, 0, -0.04], KNEE[s] + [0, 0, 0.1], 0.17, 0.9, phase=1.0 + s, rv=0.02), r=0.024)
    vine(spiral(KNEE[s] + [0, 0, -0.08], ANK[s] + [0, 0, 0.06], 0.145, 1.1, phase=2.0 - s, rv=0.02), r=0.022)
    vine(spiral(ANK[s] + [0, 0.05, 0.14], ANK[s] + [0, 0.12, -0.08], 0.16, 0.8, phase=0.5, rv=0.018), r=0.02)
vine(spiral(SH[1] + [0.03, 0, -0.1], R_ELB, 0.13, 0.8, phase=0.3, rv=0.02), r=0.022, kind=11)     # kind 11: wound round the arm
vine(spiral(R_ELB + [0, 0, -0.04], R_WRI, 0.12, 1.0, phase=2.3, rv=0.02), r=0.02, kind=11)
for z0, ph in ((1.27, 0.0), (1.16, 2.0)):
    ang = np.linspace(0, 2 * np.pi * 1.02, 120) + ph
    pts = np.stack([0.34 * np.sin(ang), 0.02 + 0.25 * np.cos(ang), z0 + 0.04 * np.sin(ang * 2 + ph)], 1)
    vine(lay(pts, 0.022), r=0.024)
# thin tendrils: short roots branching off the thick ones onto the plates
tr = np.random.default_rng(23)
for i in range(22):
    p0 = Vb[tr.integers(len(Vb))]
    if p0[2] < 0.25 or p0[2] > 1.9: continue
    if look[np.argmin(np.linalg.norm(Vb[::50] - p0, axis=1)) * 50] in ('void', 'steel'): continue
    d = tr.normal(size=3); d[2] = -abs(d[2]) * 0.5 - 0.3
    pts = [p0 + d * u * 0.22 + np.array([math.sin(u * 7 + i), math.cos(u * 5 + i), 0]) * 0.02 for u in np.linspace(0, 1, 8)]
    pts = lay(resample(pts, n=20), 0.008)
    V, F = tube(pts, 0.013 * (1 - 0.6 * np.linspace(0, 1, len(pts))), max(5, SIDES - 2))
    # a tendril follows what it grows on: the root arm (10), the right arm (11) or the body (3)
    on_root = np.min(np.linalg.norm(RP - pts[0], axis=1)) < np.interp(pts[0][2], [0, 1.9], [0.06, 0.2]) + 0.04
    on_arm = (pts[0][0] > 0.36) and (pts[0][2] > 0.8)
    if on_root or on_arm or pts[:, 2].min() < 0.75: continue      # none on the moving arm and root, none hanging low
    M.add(V, F, strand_col(len(V)), 3, MAT['bark'])

# ---- 11. the tree growing out of his helm ---------------------------------------------------------------------------
log('branches')
br = np.random.default_rng(31)
BASE = np.array([0.0, 0.10, 2.12])
def branch(p0, d, L, r0, depth):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    bend = br.normal(size=3) * 0.35
    pts = [p0 + d * L * u + bend * L * u * u * 0.4 + np.array([0, 0, 0.05 * L * u * u]) for u in np.linspace(0, 1, 9)]
    pts = np.array(pts)
    rr = r0 * (1 - 0.55 * np.linspace(0, 1, len(pts)))
    V, F = tube(resample(pts, n=max(6, int(L / (STEP * 0.6)))), np.interp(np.linspace(0, 1, max(6, int(L / (STEP * 0.6)))), np.linspace(0, 1, len(rr)), rr), SIDES, caps=True)
    M.add(V, F, np.clip(mix(BARK, BARK_L, br.random() * 0.5), 0, 1), 2, MAT['bark'])
    tip = pts[-1]; td = pts[-1] - pts[-2]; td /= np.linalg.norm(td)
    if depth > 0:
        for k in range(2 if depth > 1 else 3):
            nd = td + br.normal(size=3) * 0.55; nd[2] = abs(nd[2]) + 0.25
            branch(tip, nd, L * (0.62 + 0.1 * br.random()), r0 * 0.5, depth - 1)
    # a bud of young leaves at every tip, and a few along the twig
    for k in range(3 if depth == 0 else 1):
        ld = td + br.normal(size=3) * 0.9; ld /= np.linalg.norm(ld)
        leaf(tip + td * 0.005, ld, 0.035 + 0.012 * br.random())
def leaf(p, d, L):
    u = np.linspace(0, 1, 7)
    w = np.sin(np.pi * u ** 0.8) * L * 0.42
    side = np.cross(d, [0, 0, 1.0]);
    if np.linalg.norm(side) < 1e-3: side = np.array([1.0, 0, 0])
    side /= np.linalg.norm(side); up = np.cross(side, d)
    ctr = p + d[None] * (u * L)[:, None] + up[None] * (np.sin(u * np.pi) * L * 0.12)[:, None]
    V, F = tube(ctr, np.maximum(w, 0.002), max(6, SIDES), caps=True)
    V = np.asarray(V); c = np.repeat(ctr, max(6, SIDES), 0)
    rel = V[:len(c)] - c; th = rel @ up                                     # flatten to a leaf, keep a little thickness
    V[:len(c)] -= np.outer(th * 0.8, up)
    M.add(V, F, np.clip(LEAF * (0.85 + 0.3 * br.random()), 0, 1), 8, MAT['moss'])
for k, (dx, dy, L) in enumerate([(-0.75, 0.15, 0.2), (0.7, 0.1, 0.2), (-0.3, -0.35, 0.19), (0.32, -0.3, 0.18), (0.05, 0.45, 0.15), (0.0, 0.0, 0.17)]):
    branch(BASE + [dx * 0.06, dy * 0.06, 0], [dx, dy, 1.0], L, 0.034, 2)

# ---- 12. the gold chain: links from the mask round his neck ----------------------------------------------------------
log('chain')
def link(c, t, r=0.016, w=0.0045, roll=0.0):
    t = np.asarray(t, float); t /= np.linalg.norm(t)
    a = np.cross(t, [0, 0, 1.0]);
    if np.linalg.norm(a) < 1e-3: a = np.array([1.0, 0, 0])
    a /= np.linalg.norm(a); b = np.cross(t, a)
    a, b = a * math.cos(roll) + b * math.sin(roll), -a * math.sin(roll) + b * math.cos(roll)
    ang = np.linspace(0, 2 * np.pi, 14)
    ring = c + (np.cos(ang)[:, None] * t * 1.5 + np.sin(ang)[:, None] * a) * r
    return tube(ring, w, max(5, SIDES - 2), caps=False)
for sx in (1, -1):
    pts = catmull([MK + [0, 0.0, 0.10], (sx * 0.08, 0.25, 1.70), (sx * 0.14, 0.18, 1.77), (sx * 0.17, 0.05, 1.83), (sx * 0.10, -0.12, 1.86), (0, -0.16, 1.86)], 120)
    pts = lay(pts, 0.012, lift=1.2)
    pts = resample(pts, 0.026)
    for i in range(len(pts) - 1):
        V, F = link((pts[i] + pts[i + 1]) / 2, pts[i + 1] - pts[i], roll=(i % 2) * math.pi / 2)
        M.add(V, F, GOLD, 4, MAT['gold'])

V, F, C, K, MT = M.arrays()
counts = {int(k): int(np.sum(K[F[:, 0]] == k)) for k in np.unique(K)}
log(f'pass {LV}: total tris {len(F)}  verts {len(V)}  by kind {counts}')
np.savez_compressed(os.path.join(OUT, f'high-{LV}.npz'), V=V, F=F, C=C.astype(np.float32), K=K, M=MT.astype(np.float32))
log('saved')
