# The rotgrub, Act One's rabble of the eldest trees' roots (Foes: beasts, session 7, November 23).
#   kit/make.sh rotgrub
#
# Chris's sheet (art-in/3d/sheets/sheet-rotgrub.webp): pale grubs as long as your arm, fat on the black sap of the eldest
# trees. A cream body in fat rings, each ring wrinkled and creased where it meets the next, smudged tan and flecked
# with dark brown; the tail tip a small orange ringed cone; a tan head capsule with dark spots; four hooked brown
# mandibles round a dark mouth, two small palps beside them; four pairs of short pale legs, each ending in a dark
# hooked claw, splayed out to the sides.
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across from the middle) at
# 0.35 m to the top of its back. x its right, y forward, z up.
import numpy as np

TALL_PX, GROUND, MID = 375, 545, 1075
S = 0.35 / TALL_PX
def p(xo, px, py): return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S
def topx(P): return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

# the rings, tail to head: middle px, top py, bottom py, half width, half length
RINGS = [(725, 275, 478, 150, 52), (805, 228, 484, 180, 54), (885, 210, 487, 195, 55), (975, 188, 489, 205, 58),
         (1080, 170, 489, 210, 60), (1180, 175, 487, 205, 58), (1285, 210, 484, 190, 55), (1362, 240, 472, 165, 44)]
HEAD = (1428, 272, 455, 122, 70)
LEGS = [760, 975, 1160, 1322]                     # px of each pair

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep
    M = K.Mesh()
    CREAM = np.array([0.86, 0.82, 0.62]); CREAM2 = np.array([0.78, 0.76, 0.58]); TAN = np.array([0.78, 0.62, 0.38])
    ORANGE = np.array([0.86, 0.54, 0.24]); SPOT = np.array([0.33, 0.20, 0.11]); HEADC = np.array([0.82, 0.70, 0.46])
    STUMP = np.array([0.72, 0.60, 0.40]); CLAW = np.array([0.30, 0.19, 0.11]); MOUTH = np.array([0.18, 0.10, 0.07])

    def ring(P, c):
        px, top, bot, w, l = c
        d = ell(P, p(0, px, (top + bot) / 2), r(w * 0.92, l * 1.3, (bot - top) / 2))
        return smin(d, ell(P, p(0, px, bot - 55), r(w * 1.02, l * 1.25, 58)), 0.03)        # wide and heavy low down

    def shape(P):
        d = ring(P, RINGS[0])
        for c in RINGS[1:]: d = smin(d, ring(P, c), 0.02)                       # tight blends: creases between rings
        d = smin(d, cap(P, p(0, 595, 420), p(0, 690, 405), 22 * S, 62 * S), 0.01)   # the tail tip, a small cone
        d = smin(d, ring(P, HEAD), 0.014)                                         # the head capsule
        d = smax(d, -ell(P, p(0, 1500, 420), r(34, 18, 30)), 0.01)                 # the mouth
        for px in LEGS:                                                           # short pale legs, splayed out
            for s in (1, -1):
                d = smin(d, cap(P, p(s * 135, px, 455), p(s * 178, px - 4, 492), 30 * S, 22 * S), 0.012)
        return np.maximum(d, -P[:, 2])

    def detail(P):
        d = shape(P)
        if LV >= 2:
            xo, sx, sy = topx(P)
            # each ring wrinkled across, and a fine soft lumpiness
            d = d + 0.0012 * np.sin(xo / 9 + 3 * fbm(P * 30, 2.0)) * sstep(500, 470, sy) - 0.0015 * (fbm(P * 60, 3.0) - 0.5)
        return d

    log('body, voxel', VOX)
    V, F = Sd.mc(detail, VOX, K.lo, K.hi, band=0.03)
    log('body tris', len(F))
    xo, sx, sy = topx(V)
    col = mix(CREAM, CREAM2, np.clip(fbm(V * 18, 3.0) * 1.5 - 0.3, 0, 1)[:, None])
    col = mix(col, TAN, (sstep(0.45, 0.65, fbm(V * 9 + 4, 3.0)) * 0.8)[:, None])                 # tan smudges
    spots = np.maximum(sstep(0.63, 0.68, fbm(V * 75 + 1, 2.0)),                                  # dark brown flecks,
                       sstep(0.66, 0.71, fbm(V * 32 + 9, 2.0))) * sstep(470, 380, sy)          # and bigger blotches
    col = mix(col, SPOT, (spots * 0.9)[:, None])
    # the creases between rings a little darker
    cr = np.zeros(len(V))
    for a, b in zip(RINGS[:-1], RINGS[1:]):
        cr = np.maximum(cr, np.exp(-((sx - (a[0] + a[4] + b[0] - b[4]) / 2) / 8) ** 2))
    col = mix(col, TAN * 0.8, (cr * 0.45)[:, None])
    col = mix(col, ORANGE * (0.9 + 0.2 * np.sin(sx / 6))[:, None], sstep(700, 670, sx)[:, None])  # the orange tail tip
    hd = sstep(1395, 1415, sx)[:, None]
    col = mix(col, mix(HEADC, TAN, 0.3 * np.clip(fbm(V * 20, 2.0), 0, 1)[:, None]), hd)
    col = mix(col, MOUTH, np.clip(1.6 - np.linalg.norm((V - p(0, 1500, 420)) / r(42, 26, 38), axis=1), 0, 1)[:, None])
    legz = np.clip((V[:, 2] - p(0, 0, 470)[2]) / -0.01, 0, 1) * (np.abs(xo) > 110)
    col = mix(col, STUMP, (legz * 0.8)[:, None])
    M.add(V, F, np.clip(col, 0, 1), 0)

    # ---- the claws: a dark hooked claw at the end of each leg ---------------------------------------------------------
    seg, sides = max(5, SEG), max(6, SIDES - 2)
    for px in LEGS:
        for s in (1, -1):
            base = p(s * 176, px - 4, 486)
            d = np.array([s * 0.3, -0.1, -1.0]); d /= np.linalg.norm(d)
            V, F = G.horn(base, d, 64 * S, 20 * S, [s * 0.4, -1, 0], 0.3, seg, sides, tipR=0.0005, power=0.9)
            t = np.clip(np.linalg.norm(V - base, axis=1) / (62 * S), 0, 1)[:, None]
            M.add(V, F, np.clip(mix(CLAW * 1.4, CLAW * 0.35, t), 0, 1), 6)
    # ---- the mandibles: four hooks round the mouth, two small palps beside them ---------------------------------------
    for s in (1, -1):
        for base, d, L, rr, bend in [(p(s * 32, 1488, 378), [s * -0.05, 0.8, -0.4], 120 * S, 28 * S, [-s * 0.6, 0, -1]),
                                     (p(s * 58, 1482, 436), [s * 0.1, 0.85, -0.3], 100 * S, 24 * S, [-s * 0.7, 0, -0.6]),
                                     (p(s * 92, 1468, 430), [s * 0.4, 0.6, -0.6], 60 * S, 14 * S, [-s * 0.3, 0, -1])]:
            d = np.asarray(d, float); d /= np.linalg.norm(d)
            V, F = G.horn(base, d, L, rr, bend, 0.45, seg + 2, sides, tipR=0.0005, power=0.85)
            t = np.clip(np.linalg.norm(V - base, axis=1) / L, 0, 1)[:, None]
            M.add(V, F, np.clip(mix(CLAW * 1.7, CLAW * 0.4, t), 0, 1), 6)
    return M
