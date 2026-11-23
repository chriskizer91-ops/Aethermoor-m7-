# Gorrow the Mire-King, Act One's Relic-Bearer of the Mire (Foes: beasts, session 7, November 23).
#   kit/make.sh mirelord
#
# Chris's sheet (art-in/3d/sheets/sheet-mirelord.webp): a frog-king as wide as a hut. A great squat toad, warty green
# skin mottled darker, blotched with orange rings round dark olive middles; a pale sagging belly and throat in soft
# folds; huge gold eyes with black slit pupils under heavy lids; a wide mouth; short arms with long spread fingers,
# the hind legs folded against his sides with long webbed feet forward. On his head a crown of woven reeds, cattails
# and green blades standing up from it, and the Mire Pearl set at its front.
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across from the middle) at
# 1.1 m to the top of his head. His arms stand clear of the belly; his hind legs are folded to his sides, as a toad's
# are, so his moves keep them nearly still and move the whole of him instead. x his right, y forward, z up.
import math
import numpy as np

TALL_PX, GROUND, MID = 455, 665, 1070
S = 1.1 / TALL_PX
def p(xo, px, py): return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S
def topx(P): return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

ARM = [(150, 1170, 440), (192, 1150, 525), (200, 1225, 603), (205, 1262, 640)]      # shoulder, elbow, wrist, palm
LEG = [(215, 880, 480), (285, 1040, 545), (300, 830, 612), (305, 860, 645)]          # hip, knee, ankle, heel
EYES = [p(s * 100, 1300, 270) for s in (1, -1)]

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep
    tube = G.tube
    M = K.Mesh()
    GREEN = np.array([0.25, 0.40, 0.16]); DGREEN = np.array([0.13, 0.24, 0.09]); OLIVE = np.array([0.30, 0.36, 0.14])
    ORANGE = np.array([0.82, 0.58, 0.16]); BELLY = np.array([0.66, 0.62, 0.43]); BELLY2 = np.array([0.55, 0.52, 0.34])
    CLAW = np.array([0.30, 0.24, 0.12]); REED = np.array([0.70, 0.60, 0.28]); REED2 = np.array([0.52, 0.44, 0.18])
    CAT = np.array([0.50, 0.26, 0.10]); BLADE = np.array([0.34, 0.48, 0.16]); PEARL = np.array([0.93, 0.91, 0.82])

    def side(xo, px, py, s): return p(s * xo, px, py)
    def chain(P, pts, radii, k):
        d = None
        for i in range(len(pts) - 1):
            c = cap(P, pts[i], pts[i + 1], radii[i], radii[i + 1])
            d = c if d is None else smin(d, c, k)
        return d

    def limbs(P, s):
        A = [side(*j, s) for j in ARM]; L = [side(*j, s) for j in LEG]
        d = chain(P, A[:3], [52 * S, 40 * S, 30 * S], 0.03)                       # the arm, clear of the belly
        d = smin(d, ell(P, A[3], r(52, 54, 18)), 0.03)                            # the palm
        for i, (dx, dy) in enumerate([(-80, 80), (-28, 110), (30, 108), (82, 76)]):   # long spread fingers
            tip = A[3] + r(s * dx, dy, -14)
            d = smin(d, cap(P, A[3] + r(s * dx * 0.3, 18, -4), tip, 15 * S, 10 * S), 0.012)
            d = smin(d, ell(P, tip + r(0, 4, 1), r(13, 13, 10)), 0.006)
        h = smin(ell(P, (L[0] + L[1]) / 2 + r(s * 25, -10, 10), r(85, 135, 95)), cap(P, L[0], L[1], 95 * S, 74 * S), 0.04)                                      # the thigh, folded forward
        h = smin(h, cap(P, L[1], L[2], 66 * S, 40 * S), 0.04)                       # the shin back down
        h = smin(h, cap(P, L[2], L[3] + r(0, 40, 0), 38 * S, 30 * S), 0.03)         # the heel and foot
        for i, (dx, dy) in enumerate([(-50, 150), (-15, 190), (25, 200), (60, 170), (88, 120)]):   # long webbed toes
            tip = L[3] + r(s * dx, dy, 12)
            h = smin(h, cap(P, L[3] + r(s * dx * 0.2, 60, 0), tip, 15 * S, 9 * S), 0.02)
            h = smin(h, ell(P, tip + r(0, 4, 0), r(13, 13, 10)), 0.006)
        return smin(d, h, 0.05)

    def shape(P):
        d = ell(P, p(0, 1010, 430), r(245, 272, 212))                                 # the body, squat and wide
        d = smin(d, ell(P, p(0, 860, 470), r(235, 140, 175)), 0.10)                  # the rump
        d = smin(d, ell(P, p(0, 1205, 470), r(205, 120, 165)), 0.10)                 # the sagging throat and belly
        d = smin(d, ell(P, p(0, 1255, 300), r(150, 130, 88)), 0.10)                  # the head
        d = smin(d, ell(P, p(0, 1335, 322), r(148, 72, 52)), 0.05)                   # the snout
        for e in EYES: d = smin(d, ell(P, e + r(-np.sign(e[0]) * 10, -14, 12), r(40, 38, 34)), 0.03)  # the eye bulges
        d = smax(d, -cap(P, p(0, 1238, 372), p(0, 1398, 340), 5 * S, 3 * S), 0.004)  # the mouth line (middle)
        for s in (1, -1):
            d = smax(d, -cap(P, p(s * 150, 1240, 372), p(s * 60, 1350, 352), 5 * S, 4 * S), 0.004)
            d = smax(d, -ell(P, p(s * 22, 1372, 300), r(6, 6, 5)), 0.003)             # nostrils
            d = smin(d, limbs(P, s), 0.05)
        return np.maximum(d, -P[:, 2])

    xo_ = lambda P: P[:, 0] / S
    def belly(P):
        xo, sx, sy = topx(P)
        return sstep(1110, 1170, sx) * sstep(-215, -175, -np.abs(xo)) * sstep(355, 385, sy) * sstep(-640, -615, -sy)

    def warts(P):
        xo, sx, sy = topx(P)
        n = fbm(P * 55 + 2, 3.0)
        w = sstep(0.56, 0.72, n)
        return w * (1 - belly(P)) * (1 - sstep(1300, 1340, sx) * sstep(330, 300, sy) * 0.6)

    def full(P):
        d = shape(P)
        if LV >= 2:
            d = d - 0.006 * warts(P) - 0.0025 * (fbm(P * 20, 2.0) - 0.5)
            xo, sx, sy = topx(P)
            folds = np.sin(sy / 14.0 + 0.3 * np.sin(xo / 60)) * belly(P)              # soft folds across the belly
            d = d + 0.0025 * folds
        return d

    log('body, voxel', VOX)
    V, F = Sd.mc(full, VOX, K.lo, K.hi, band=0.2)
    log('body tris', len(V))
    xo, sx, sy = topx(V)
    # the blotches: orange rings round dark olive middles, on his back, sides and legs
    rng = np.random.default_rng(3)
    up = np.flatnonzero((V[:, 2] > 0.12) & (belly(V) < 0.2))
    ctr = V[rng.choice(up, 60, replace=False)]
    ctr = ctr[np.argsort(-ctr[:, 2])]
    keep = []
    for c in ctr:
        if all(np.linalg.norm(c - k) > 0.26 for k in keep): keep.append(c)
    from scipy.spatial import cKDTree
    kd = cKDTree(np.array(keep))
    Vw = V + 0.13 * (np.stack([fbm(V * 4 + 1, 3.0), fbm(V * 4 + 5, 3.0), fbm(V * 4 + 9, 3.0)], 1) - 0.5) * np.array([1, 1.8, 0.8])
    dist, which = kd.query(Vw)
    R = (0.09 + 0.05 * ((which * 37) % 11) / 10) * (0.6 + 0.8 * fbm(V * 6, 3.0))
    ring = sstep(0.38, 0.52, dist / R) * (1 - sstep(0.9, 1.08, dist / R))
    mid = 1 - sstep(0.4, 0.52, dist / R)
    col = mix(GREEN, DGREEN, np.clip(fbm(V * 7, 3.0) * 1.6 - 0.5, 0, 1)[:, None])
    col = mix(col, OLIVE, (mid * 0.85)[:, None])
    col = mix(col, ORANGE * (0.9 + 0.2 * fbm(V * 40, 2.0))[:, None], (ring * 0.95)[:, None])
    col = mix(col, DGREEN * 0.9, (warts(V) * 0.35)[:, None])
    bl = belly(V)[:, None]
    col = mix(col, mix(BELLY, BELLY2, np.clip(0.5 + 0.5 * np.sin(sy / 14.0), 0, 1)[:, None] * 0.5), bl)
    # the fingertips and toes darker
    tips = np.zeros(len(V))
    for s in (1, -1):
        A = side(*ARM[3], s); L = side(*LEG[3], s)
        tips = np.maximum(tips, sstep(0.10, 0.17, np.linalg.norm((V - A)[:, :2], axis=1)) * (V[:, 2] < 0.08))
        tips = np.maximum(tips, sstep(0.36, 0.44, np.linalg.norm((V - L)[:, :2], axis=1)) * (V[:, 2] < 0.08))
    col = mix(col, CLAW, (tips * 0.8)[:, None])
    for s in (1, -1):                                       # the mouth line and nostrils dark
        m = np.exp(-((sy - (372 + (sx - 1238) * (-32 / 160))) / 5) ** 2) * (sx > 1230) * (np.abs(xo) < 160)
        col = mix(col, DGREEN * 0.5, m[:, None] * 0.8)
    for e in EYES:                                          # heavy dark lids round the eyes
        lid = np.clip(1.35 - np.linalg.norm((V - e) / r(48, 44, 44), axis=1), 0, 1)
        col = mix(col, DGREEN * 0.8, (lid * 0.8)[:, None])
    M.add(V, F, np.clip(col, 0, 1), 0)

    # ---- eyes: big gold, a black slit pupil -------------------------------------------------------------------------
    for e in EYES:
        V, F = G.ellipsoid(e + r(np.sign(e[0]) * 12, 12, 0), r(42, 40, 41), {0: 8, 1: 10, 2: 16, 3: 24}[LV], {0: 12, 1: 16, 2: 26, 3: 40}[LV])
        d = (V - e); out = np.array([np.sign(e[0]) * 0.75, 0.6, 0.15]); out /= np.linalg.norm(out)
        cc = mix(np.array([0.98, 0.58, 0.04]), np.array([0.55, 0.22, 0.02]), np.clip(1 - (d @ out) / (40 * S), 0, 1)[:, None])
        t = d - out[None] * (d @ out)[:, None]
        slit = (np.abs(t[:, 2]) < 5 * S) & (np.linalg.norm(t, axis=1) < 26 * S) & ((d @ out) > 0)
        cc[slit] = [0.04, 0.03, 0.02]
        cc[(d[:, 2] > 24 * S)] *= 0.7                                                 # the heavy lid's shadow
        M.add(V, F, cc, 7)

    # ---- the crown of reeds -----------------------------------------------------------------------------------------
    log('crown')
    C0 = p(0, 1232, 208); RX, RY = 112 * S, 82 * S
    n = {0: 36, 1: 48, 2: 90, 3: 140}[LV]
    a = np.linspace(0, 2 * np.pi, n)
    for k in range(3):                                     # three reeds twisted round each other
        ph = a * 6 + k * 2 * np.pi / 3
        ring = np.stack([RX * np.sin(a) + 7 * S * np.cos(ph) * np.sin(a), RY * np.cos(a) + 7 * S * np.cos(ph) * np.cos(a),
                         7 * S * np.sin(ph) - 0.012 * np.cos(a)], 1) + C0
        V, F = tube(ring, np.full(n, 5.5 * S), max(5, SIDES - 2))
        M.add(V, F, mix(REED, REED2, 0.3 * k), 8)
    rr = np.random.default_rng(12)
    for k in range({0: 9, 1: 12, 2: 18, 3: 24}[LV]):           # green blades standing up and out
        t = rr.uniform(0, 2 * np.pi)
        base = C0 + np.array([RX * np.sin(t) * 0.9, RY * np.cos(t) * 0.9, 0.0])
        d = np.array([np.sin(t) * rr.uniform(0.3, 0.8), np.cos(t) * rr.uniform(0.1, 0.5), 1.0]); d /= np.linalg.norm(d)
        V, F = G.horn(base, d, rr.uniform(0.14, 0.3), 6 * S, [np.sin(t), np.cos(t), 0], 0.25, max(4, SEG), max(4, SIDES - 4), tipR=0.001)
        M.add(V, F, BLADE * rr.uniform(0.8, 1.15), 8)
    for xo, px, top, colr in [(-66, 1185, 70, CAT), (-18, 1205, 32, CAT), (72, 1258, 42, CAT), (100, 1160, 118, REED), (-98, 1150, 132, np.array([0.80, 0.74, 0.50]))]:
        b = p(xo * 0.8, px, 205); tp = p(xo, px, top)
        st = np.linspace(b, tp - np.array([0, 0, 0.0]), 6)
        V, F = tube(st, np.full(6, 3.5 * S), 5); M.add(V, F, BLADE * 0.85, 8)            # the stem
        hd = tp + np.array([0, 0, -0.03])
        V, F = tube(np.array([hd - np.array([0, 0, 0.1]), hd]), np.array([10 * S, 10 * S]), max(6, SIDES))
        M.add(V, F, colr, 8)                                                            # the cattail's head
        V, F = G.horn(hd, [0, 0, 1], 0.05, 3 * S, None, 0, 3, 5); M.add(V, F, BLADE * 0.7, 8)
    # the Mire Pearl at the crown's front
    V, F = G.ellipsoid(p(0, 1262, 168), r(31, 31, 31), {0: 10, 1: 12, 2: 18, 3: 26}[LV], {0: 14, 1: 18, 2: 28, 3: 40}[LV])
    sh = np.clip((V[:, 2] - p(0, 0, 168)[2]) / (31 * S), -1, 1)
    M.add(V, F, mix(PEARL * 0.85, PEARL, ((sh + 1) / 2)[:, None]), 8)
    return M
