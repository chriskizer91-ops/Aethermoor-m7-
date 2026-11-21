# The sand-skink, rabble of the Sunscorch (Places' desert-and-deep lane, November 21).
#   python3.12 kit/py/sculpt.py foes/sand-skink <level>
#
# From Chris's sheet (art-in/3d/sheets/sheet-sand-skink.webp): a low, sprawling lizard, 0.35 m to the tips of its
# spikes, 1.35 m long. Sandy orange scales (the kit's 'scale' coat) banded dark brown across the back, a pale cream
# belly; a crest of golden spikes from the crown down the back to the tail, a crown of spikes round the back of the
# head and up the cheeks; dark round eyes with a light in them; splayed legs, four toes each with black-tipped claws;
# a tail that curls up at its tip. Measured off the side view (sheet px: snout tip 1576, tail tip 565, ground 512).
# x his right, y forward (the snout), z up.
import math
import numpy as np

S = 0.35 / 264.0; MID = 1070; GROUND = 512
def p(px, py, x=0.0): return np.array([x, (px - MID) * S, (GROUND - py) * S])

# the spine, tail tip to snout: (sheet x, middle height, vertical half-thickness, width factor), from the side view
SPINE = [(566, 345, 4, 1.0), (574, 372, 7, 1.0), (590, 410, 11, 1.0), (625, 440, 15, 1.05), (700, 439, 22, 1.1),
         (790, 428, 34, 1.15), (870, 413, 50, 1.25), (940, 400, 64, 1.35), (1000, 391, 68, 1.5), (1080, 384, 72, 1.55),
         (1160, 378, 74, 1.5), (1240, 366, 68, 1.35), (1310, 348, 58, 1.2), (1380, 316, 56, 1.4), (1440, 309, 52, 1.4),
         (1500, 312, 42, 1.25), (1545, 318, 28, 1.05), (1574, 321, 12, 0.9)]

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, project = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep, Sd.project
    M = K.Mesh()
    SAND = np.array([0.86, 0.47, 0.11]); GOLD = np.array([0.96, 0.63, 0.19]); BAND = np.array([0.33, 0.15, 0.05])
    CREAM = np.array([0.90, 0.72, 0.44]); SPIKE = np.array([0.99, 0.74, 0.26]); SPIKE_D = np.array([0.74, 0.40, 0.09])
    CLAW = np.array([0.10, 0.07, 0.05]); EYE = np.array([0.06, 0.04, 0.03])
    C = np.array([p(px, py) for px, py, _, _ in SPINE]); RV = np.array([r for _, _, r, _ in SPINE]) * S; WF = np.array([w for *_, w in SPINE])
    EYE_C = {s: p(1508, 300, s * 0.072) for s in (1, -1)}

    # the legs: shoulder/hip, elbow/knee (out to the side), wrist/ankle, the foot's middle on the ground
    LEGS = {
        'fr': [p(1235, 400, 0.08), p(1262, 438, 0.165), p(1290, 492, 0.19), p(1305, 508, 0.215)],
        'fl': [p(1235, 400, -0.08), p(1262, 438, -0.165), p(1290, 492, -0.19), p(1305, 508, -0.215)],
        'br': [p(945, 410, 0.085), p(905, 445, 0.19), p(925, 492, 0.21), p(905, 508, 0.235)],
        'bl': [p(945, 410, -0.085), p(905, 445, -0.19), p(925, 492, -0.21), p(905, 508, -0.235)],
    }
    LEG_R = {'f': (0.066, 0.048, 0.031), 'b': (0.078, 0.052, 0.033)}

    def body_sdf(P):
        d = np.full(len(P), 9.0, np.float32)
        for i in range(len(C) - 1):
            sc = ((WF[i] + WF[i + 1]) / 2, 1.0, 1.0)
            d = smin(d, cap(P, C[i], C[i + 1], RV[i] / 1.0, RV[i + 1] / 1.0, scale=sc), 0.02)
        # the belly hangs a little lower and flatter between the legs; the jaw is a little fuller below the eye
        d = smin(d, ell(P, p(1090, 418), (0.15, 0.24, 0.055)), 0.04)
        d = smin(d, ell(P, p(1455, 338), (0.065, 0.075, 0.03)), 0.02)
        for k, J in LEGS.items():
            r0, r1, r2 = LEG_R[k[0]]
            d = smin(d, cap(P, J[0], J[1], r0, r1), 0.03)
            d = smin(d, cap(P, J[1], J[2], r1, r2), 0.015)
            d = smin(d, cap(P, J[2], J[3], r2, r2 * 0.85, scale=(1.3, 1.6, 0.6)), 0.012)
        for s in (1, -1):        # eye sockets
            d = smax(d, -ell(P, EYE_C[s], (0.019, 0.021, 0.019)), 0.004)
        return d

    def zones(P):
        head = sstep(1360 * 1.0, 1420, P[:, 1] / S + MID)
        leg = np.zeros(len(P))
        for J in LEGS.values():
            leg = np.maximum(leg, np.exp(-np.sum(((P - (J[1] + J[2]) / 2) / [0.06, 0.06, 0.06]) ** 2, 1)))
        tail = sstep(900, 760, P[:, 1] / S + MID)
        belly = np.clip((0.115 - P[:, 2]) / 0.05, 0, 1) * (1 - tail)
        return dict(head=head, leg=leg, tail=tail, belly=belly)
    def tuft_len(P):
        z = zones(P)
        return 0.024 * (1 - 0.35 * z['head']) * (1 - 0.3 * z['leg']) * (1 - 0.35 * z['tail']) * (1 + 0.15 * z['belly'])
    def flow(P, N):
        v = np.tile(np.array([0, -1.0, 0]), (len(P), 1))           # the scales lie back toward the tail
        for J in LEGS.values():                                     # and down the legs
            w = np.exp(-np.sum(((P - J[1]) / 0.08) ** 2, 1))[:, None]; v = v * (1 - w) + (J[3] - J[0]) / np.linalg.norm(J[3] - J[0]) * w
        v = v - N * np.sum(v * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)
    def bare(P):
        b = P[:, 2] < 0.012                                         # soles
        for s in (1, -1): b |= np.linalg.norm(P - EYE_C[s], axis=1) < 0.025
        b |= (P[:, 1] / S + MID > 1560)                             # the snout tip
        return b
    def pattern(P):
        """the dark bands across the back (the sheet's broken stripes), 0..1"""
        yy = P[:, 1] / S + MID
        band = 0.5 + 0.5 * np.sin((yy - 940) / 120 * 2 * math.pi + 1.6 * np.sin(P[:, 0] * 14) + 2.5 * (fbm(P * 9, 2.0) - 0.5))
        band = sstep(0.42, 0.6, band + 0.5 * (fbm(P * 22 + 4, 2.0) - 0.5))
        top = sstep(0.12, 0.25, P[:, 2]) * sstep(1550, 1380, yy)
        return band * top
    def style(TP, TL, rng):
        n = len(TP)
        W = TL * (0.85 + 0.15 * rng.random(n)); H = TL * (0.09 + 0.03 * rng.random(n))
        z = zones(TP)
        Cc = mix(SAND, GOLD, rng.random(n)[:, None] * 0.6)
        Cc = mix(Cc, BAND * (0.9 + 0.2 * rng.random(n))[:, None], pattern(TP)[:, None] * 0.9)
        Cc = mix(Cc, CREAM, z['belly'][:, None])
        return dict(W=W, H=H, C=Cc)
    log('scales')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=41, spacing=0.75, shape='scale', place_ew=0.004, log=log)
    full_sdf, place_sdf = coat.full_sdf, coat.place_sdf
    Vb, Fb = Sd.mc(full_sdf, VOX, K.lo, K.hi, band=0.02 if LV >= 2 else None)
    log('body tris', len(Fb))
    # colour straight from the pattern (the scales are low, so the kit's per-scale colours would barely show), each
    # scale lighter toward its free edge and the cracks between them darker
    top, tid, ts, _ = coat.coat(Vb, True)
    z = zones(Vb)
    col = mix(SAND, GOLD, sstep(0.3, 0.8, fbm(Vb * 30, 2.0))[:, None] * 0.7)
    col = mix(col, BAND, pattern(Vb)[:, None] * 0.92)
    col = mix(col, CREAM, z['belly'][:, None])
    sc = top > 0.0003
    col = col * np.where(sc, 0.78 + 0.32 * ts, 0.62)[:, None]
    yy = Vb[:, 1] / S + MID
    mouth = (yy > 1440) & (np.abs(Vb[:, 2] - (GROUND - 332 + (yy - 1440) * 0.08) * S) < 0.0025)     # the mouth line
    col[mouth] = col[mouth] * 0.35
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    def ldir(a, b): v = np.asarray(b, float) - np.asarray(a, float); return v / np.linalg.norm(v)
    rng = np.random.default_rng(7)
    # ---- the crest: spikes from the crown down the back and tail, tallest over the shoulders, raked back ----------
    log('spikes, claws, eyes')
    yy_c = np.linspace(600, 1395, 19)
    for i, yv in enumerate(yy_c):
        j = np.searchsorted(C[:, 1] / S + MID, yv); j = min(max(j, 1), len(C) - 1)
        f = (yv - (C[j - 1, 1] / S + MID)) / ((C[j, 1] - C[j - 1, 1]) / S + 1e-9)
        c = C[j - 1] * (1 - f) + C[j] * f; r = RV[j - 1] * (1 - f) + RV[j] * f
        g = c + [0, 0, r + 0.01]
        base, nrm = project(g[None].astype(np.float32), place_sdf); base, nrm = base[0].astype(float), nrm[0].astype(float)
        size = 0.5 + 0.5 * math.sin(min(1, max(0, (yv - 600) / 700)) * math.pi * 0.95)
        L = 0.018 + 0.085 * size
        d = nrm * 0.75 + np.array([0, -0.55, 0]); d /= np.linalg.norm(d)
        V, F = G.horn(base - nrm * 0.004, d, L, 0.016 + 0.02 * size, [0, -1, 0.2], 0.25, SEG, SIDES, ridges=0)
        t = np.clip((V - base) @ d / L, 0, 1)[:, None]
        M.add(V, F, mix(SPIKE_D, SPIKE, t), 2)
        if 0.3 < size and i % 3 == 0:                               # a smaller spike either side of the big ones
            for s in (1, -1):
                g2 = c + [s * r * 0.75, 0, r * 0.55]
                b2, n2 = project(g2[None].astype(np.float32), place_sdf); b2, n2 = b2[0].astype(float), n2[0].astype(float)
                d2 = n2 * 0.8 + np.array([0, -0.5, 0]); d2 /= np.linalg.norm(d2)
                V, F = G.horn(b2 - n2 * 0.003, d2, L * 0.45, 0.007 + 0.006 * size, [0, -1, 0], 0.2, SEG, SIDES)
                M.add(V, F, mix(SPIKE_D, SPIKE, np.clip((V - b2) @ d2 / (L * 0.45), 0, 1)[:, None]), 2)
    # ---- the crown: a ring of spikes round the back of the head, and up the cheeks ---------------------------------
    crown = [(0, 1.0, 0.075), (0.45, 0.9, 0.06), (-0.45, 0.9, 0.06), (0.9, 0.55, 0.055), (-0.9, 0.55, 0.055),
             (1.25, 0.2, 0.045), (-1.25, 0.2, 0.045), (1.4, -0.25, 0.034), (-1.4, -0.25, 0.034)]
    hc = p(1415, 318)
    for a, el, L in crown:
        g = hc + np.array([math.sin(a) * 0.075, -0.01, math.cos(a) * 0.055 * el + 0.01])
        base, nrm = project(g[None].astype(np.float32), place_sdf); base, nrm = base[0].astype(float), nrm[0].astype(float)
        d = nrm * 0.7 + np.array([0, -0.6, 0.1]); d /= np.linalg.norm(d)
        V, F = G.horn(base - nrm * 0.004, d, L, 0.009 + L * 0.12, [0, -1, 0.3], 0.3, SEG, SIDES)
        M.add(V, F, mix(SPIKE_D, SPIKE, np.clip((V - base) @ d / L, 0, 1)[:, None]), 2)
    for s in (1, -1):                                              # brow knobs over the eyes
        for k in range(3):
            g = EYE_C[s] + np.array([s * 0.008, -0.012 + k * 0.014, 0.018])
            base, nrm = project(g[None].astype(np.float32), place_sdf); base, nrm = base[0].astype(float), nrm[0].astype(float)
            V, F = G.horn(base - nrm * 0.002, nrm + [0, -0.3, 0.2], 0.008, 0.005, [0, -1, 0], 0.2, max(4, SEG - 4), max(5, SIDES - 4))
            M.add(V, F, SPIKE, 2)
    # ---- the eyes: dark globes with a ring and a catchlight ---------------------------------------------------------
    for s in (1, -1):
        c = EYE_C[s] + [-s * 0.002, 0, 0]
        V, F = G.ellipsoid(c, [0.017, 0.019, 0.017], {0: 8, 1: 10, 2: 14, 3: 20}.get(LV, 20), {0: 12, 1: 16, 2: 24, 3: 32}.get(LV, 32))
        dd = np.linalg.norm(V - (c + [s * 0.012, 0.004, 0.004]), axis=1)
        M.add(V, F, mix(EYE, np.array([0.55, 0.32, 0.1]), (np.abs(dd - 0.011) < 0.003)[:, None] * 0.7), 8)
        V, F = G.ellipsoid(c + [s * 0.0155, 0.004, 0.006], [0.003, 0.003, 0.003], 6, 8)
        M.add(V, F, np.array([1.0, 0.97, 0.9]), 7)
    # ---- the feet: four splayed toes each, a dark hooked claw on each ------------------------------------------------
    for k, J in LEGS.items():
        sx = 1 if k[1] == 'r' else -1
        foot = J[3]; fwd = ldir(J[2], J[3]); fwd[2] = 0; fwd /= np.linalg.norm(fwd) + 1e-9
        for t_, ang in enumerate(np.linspace(-0.9, 0.9, 4)):
            a = ang + (0.25 * sx if k[0] == 'f' else -0.25 * sx)
            dvec = np.array([math.sin(a) * sx * 0.8 + fwd[0] * 0.4, math.cos(a) * (1 if k[0] == 'f' else -1) * 0.8 + fwd[1] * 0.4, 0.0])
            dvec /= np.linalg.norm(dvec)
            tl = 0.045 + 0.012 * (t_ in (1, 2))
            path = np.array([foot + [0, 0, 0.006], foot + dvec * tl * 0.5 + [0, 0, 0.006], foot + dvec * tl + [0, 0, 0.004]])
            V, F = G.tube(G.resample(path, 6), np.array([0.0105, 0.0095, 0.0085, 0.0075, 0.007, 0.006]), max(5, SIDES - 2))
            M.add(V, F, SAND * 0.9, 6)
            V, F = G.horn(path[-1], dvec + [0, 0, -0.35], 0.022, 0.0058, [0, 0, -1], 0.6, SEG, max(5, SIDES - 4))
            M.add(V, F, CLAW, 6)
    return M
