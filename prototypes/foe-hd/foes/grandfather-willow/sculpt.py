# Grandfather Willow, Relic-Bearer of Willowmurk (One Foe's lane, November 21). python3.12 kit/py/sculpt.py
# foes/grandfather-willow <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-grandfather-willow.webp; 759 px = 2.8 m): the eldest willow, built like
# the willow-wight (foes/willow-wight/tree.py) at his own size: a vast trunk on spreading roots (1.55 m across), mossy,
# ivy winding round it, a tall hollow in it like a door (1.13 m up), an old bearded face (eyes 2.15 m up), a crown of
# fronds 2 m across hanging to a third of a metre; his left arm holds the Weeping Bow across his chest, its string
# glowing green and dripping, white flowers on it; his right hangs; glowing teal drops hang on cords among the fronds.
import os, sys, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'willow-wight'))
from tree import build_tree

K_ = 2.8 / 1.8
ARMS = {
    'r': [(0.24, 0.08, 1.82), (0.52, 0.26, 1.42), (0.62, 0.32, 1.12), (0.65, 0.34, 0.98)],     # hangs
    'l': [(-0.24, 0.12, 1.80), (-0.50, 0.55, 1.55), (-0.34, 0.80, 1.70), (-0.28, 0.84, 1.73)],  # holds the bow
}
BOW = [(0.36, 0.72, 1.56), (-0.30, 0.90, 1.74), (-1.02, 0.66, 1.93)]       # one tip, the grip, the other tip
LANTERNS = [((0.80, 0.22, 1.30), 0.22), ((-0.60, 0.50, 1.05), 0.3), ((-0.86, -0.12, 1.42), 0.18),
            ((0.30, -0.86, 1.18), 0.25), ((0.62, 0.55, 0.92), 0.28)]       # (where it hangs from, cord length)

def extra(K, M, C):
    S, G, LV, SIDES, log = K.sdf, K.geom, K.LV, K.SIDES, K.log
    mix = S.mix
    WOOD = np.array([0.34, 0.24, 0.15]); WOODL = np.array([0.52, 0.40, 0.26]); STRING = np.array([0.45, 1.0, 0.25])
    TEAL = np.array([0.40, 0.95, 0.85]); CORD = np.array([0.45, 0.38, 0.22]); WHITE = np.array([0.95, 0.93, 0.85])
    IVY = np.array([0.22, 0.34, 0.10]); nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (14, 22))
    log('bow, lanterns, ivy')
    # the Weeping Bow: a curved stave, thickest at the grip, wound with cord there; the string glows and drips
    a, g, b = [np.array(p) for p in BOW]
    t = np.linspace(0, 1, 40)
    stave = (1 - t)[:, None] ** 2 * a + 2 * ((1 - t) * t)[:, None] * (2 * g - (a + b) / 2) + (t ** 2)[:, None] * b
    r = 0.016 + 0.022 * np.sin(t * math.pi) ** 0.6
    V, F = G.tube(stave, r, SIDES); cc = mix(WOOD, WOODL, (S.fbm(V, 20.0)[:, None] * 1.3 - 0.4).clip(0, 1))
    M.add(V, F, np.clip(cc, 0, 1), 8)
    for tip in (a, b):                                                            # carved tips
        V, F = G.ellipsoid(tip, (0.02, 0.02, 0.02), nt, npp); M.add(V, F, np.tile(WOODL, (len(V), 1)), 8)
    gi = int(np.argmin(np.linalg.norm(stave - g, axis=1)))
    V, F = G.tube(stave[gi - 3:gi + 4], r[gi - 3:gi + 4] + 0.004, SIDES); M.add(V, F, np.tile(CORD, (len(V), 1)), 8)
    sp = G.resample(np.array([a, b]) + [0, -0.06, 0], 30)
    V, F = G.tube(sp, np.full(len(sp), 0.004), max(5, SIDES // 2)); M.add(V, F, np.tile(STRING, (len(V), 1)), 7)
    for k in range(9):                                                            # drops hanging off the string
        p = sp[3 + k * 3] + [0, 0, -0.02 - 0.03 * (k % 3)]
        V, F = G.ellipsoid(p, (0.005, 0.005, 0.012 + 0.008 * (k % 2)), 6, 8); M.add(V, F, np.tile(STRING * 0.9, (len(V), 1)), 7)
    for k in range(5):                                                            # white flowers on the stave
        c = stave[6 + k * 7] + [0, 0.02, 0.02]
        for p in range(5):
            ang = p / 5 * 2 * math.pi
            V, F = G.ellipsoid(c + [0.012 * math.cos(ang), 0.004, 0.012 * math.sin(ang)], (0.009, 0.004, 0.009), 6, 8)
            M.add(V, F, np.tile(WHITE, (len(V), 1)), 8)
        V, F = G.ellipsoid(c + [0, 0.008, 0], (0.005, 0.004, 0.005), 6, 8); M.add(V, F, np.tile([0.95, 0.8, 0.3], (len(V), 1)), 8)
    # glowing teal drops on cords, hanging among the fronds
    for top, L in LANTERNS:
        top = np.array(top); bot = top + [0, 0, -L]
        cp = G.resample(np.array([top, bot]), 10)
        V, F = G.tube(cp, np.full(len(cp), 0.004), 5); M.add(V, F, np.tile(CORD, (len(V), 1)), 3)
        V, F = G.ellipsoid(bot + [0, 0, -0.012], (0.016, 0.016, 0.014), 6, 8); M.add(V, F, np.tile(CORD * 1.2, (len(V), 1)), 8)   # the cap
        c = bot + [0, 0, -0.06]
        V, F = G.ellipsoid(c, (0.04, 0.04, 0.05), nt, npp)
        V[:, 2] += 0.02 * np.clip((V[:, 2] - c[2]) / 0.05, 0, 1) ** 2             # a drop: pointed above
        M.add(V, F, np.tile(TEAL, (len(V), 1)), 7)
    # ivy: a vine winding up the trunk, with leaves
    ts = np.linspace(0, 1, 120)
    ang = ts * 2.6 * 2 * math.pi + 0.6
    zz = 0.25 + ts * 1.5
    rad = np.interp(zz, C['TRUNK_Z'], C['TRUNK_R']) + 0.01
    path = np.stack([np.cos(ang) * rad, np.sin(ang) * rad * 0.92, zz], 1)
    V, F = G.tube(path, np.full(len(path), 0.012), max(6, SIDES // 2)); M.add(V, F, np.tile(CORD * 0.8, (len(V), 1)), 3)
    rr = np.random.default_rng(5)
    for i in range(0, 120, 3):
        p = path[i]; out = np.array([math.cos(ang[i]), math.sin(ang[i]), 0.3]); out /= np.linalg.norm(out)
        V, F = G.ellipsoid(p + out * 0.02, (0.022, 0.022, 0.006), 4 if LV == 0 else 6, 6 if LV == 0 else 8,
                           rot=_frame(out, rr.uniform(0, math.pi)))
        M.add(V, F, np.tile(IVY * (0.8 + 0.4 * rr.random()), (len(V), 1)), 3)

def _frame(n, roll):
    """a rotation taking z to n, turned by roll"""
    n = n / np.linalg.norm(n); a = np.array([1.0, 0, 0]) if abs(n[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(n, a); u /= np.linalg.norm(u); v = np.cross(n, u)
    c, s = math.cos(roll), math.sin(roll); u, v = c * u + s * v, -s * u + c * v
    return np.stack([u, v, n], 1)

C = dict(
    H=2.8, FACE_Z=2.15, EYE_R=0.034, EYE_X=0.085, FACE_Y=0.31, FACE_S=1.45,
    ARMS=ARMS, ARM_R=(0.09, 0.07, 0.05), BELLS=False,
    CROWN_Z=2.42,
    TRUNK_Z=[0.0, 0.15, 0.35, 0.6, 0.9, 1.2, 1.6, 1.9, 2.15, 2.3, 2.45],
    TRUNK_R=[0.70, 0.52, 0.42, 0.36, 0.33, 0.32, 0.31, 0.30, 0.29, 0.22, 0.08],
    ROOTS=9, ROOT_REACH=(0.72, 0.14), ROOT_R=(0.17, 0.12, 0.04),
    BOUGHS=10, BOUGH_OUT=(0.45, 0.15), BOUGH_R=(0.11, 0.07, 0.035),
    HOLLOW=((0.0, 0.33, 1.13), (0.11, 0.18, 0.26)),
    DOME_C=(0.0, 0.0, 2.2), DOME_R=(0.95, 0.85, 0.58), NFR=112, SPACE=0.05, LEAF_L=0.11, LEAF_W=0.019,
    Z_END=(0.35, 0.95), FRONT_SHORT=0.35, RIBBON_W=(0.06, 0.016),
    MOSS_Z=2.4, MOSS_AMT=0.9, MOSS_T=0.4, extra=extra,
)

def build(K):
    return build_tree(K, C)
