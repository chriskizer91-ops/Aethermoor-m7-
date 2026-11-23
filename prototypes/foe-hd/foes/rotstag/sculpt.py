# The Rot-Stag, Act One's Relic-Bearer of Fawnrest (Foes: beasts, session 7, November 21).
#   python3.12 kit/py/sculpt.py foes/rotstag <level>
#
# Chris's sheet (art-in/3d/sheets/sheet-rotstag.webp): once the white stag of Fawnrest. A big shaggy white stag, long
# locks of fur with a lavender shade, the Rot eaten into him in dark purple patches; his lower legs gone dark purple to
# the hooves; great branching antlers, olive-brown, wound with purple vines and sprouting tan mushrooms, vines hanging
# down his neck; a golden circlet floating round the antlers with a cross-spike at its front (the rotwood circlet).
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across) at 2.0 m to the
# antler tips. His legs are sculpted clear of his body from the knee down, so they swing without dragging it (the hub,
# November 21). x his right, y forward, z up.
import math
import numpy as np

TALL_PX, GROUND, MID = 860, 873, 880
S = 2.0 / TALL_PX
def p(xo, px, py): return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S
def topx(P): return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

LEGS = {   # across px, then side-view joints: shoulder/hip, elbow/stifle, knee/hock, fetlock, hoof
    'fl': [(52, 965, 500), (56, 958, 600), (54, 955, 715), (52, 952, 820), (52, 955, 858)],
    'fr': [(-52, 925, 500), (-56, 915, 600), (-54, 912, 715), (-52, 908, 820), (-52, 911, 858)],
    'bl': [(50, 690, 475), (56, 712, 590), (54, 665, 700), (52, 670, 822), (52, 673, 858)],
    'br': [(-50, 630, 475), (-56, 650, 590), (-54, 602, 700), (-52, 606, 822), (-52, 609, 858)],
}
LEGS = {k: [p(*j) for j in v] for k, v in LEGS.items()}
EYES = [p(s * 30, 1120, 289) for s in (1, -1)]
NOSE = p(0, 1184, 336)
ANTLER_BASE = [p(s * 30, 1074, 238) for s in (1, -1)]

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, project, grad = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep, Sd.project, Sd.grad
    tube = G.tube
    M = K.Mesh()
    WHITE = np.array([0.82, 0.80, 0.84]); LAV = np.array([0.66, 0.62, 0.71]); GREYW = np.array([0.74, 0.72, 0.76])
    ROT = np.array([0.24, 0.19, 0.27]); ROT2 = np.array([0.33, 0.27, 0.36]); HOOF = np.array([0.16, 0.14, 0.16])
    ANT = np.array([0.40, 0.36, 0.22]); ANT2 = np.array([0.30, 0.27, 0.17]); VINE = np.array([0.30, 0.22, 0.34])
    SHROOM = np.array([0.72, 0.55, 0.36]); GILL = np.array([0.45, 0.32, 0.22]); GOLD = np.array([0.80, 0.60, 0.26])
    PALEG = np.array([0.95, 0.80, 0.45])

    def flat_cap(P, a, b, ra, rb, thin, k):
        a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ax = (b - a) / np.linalg.norm(b - a)
        t = np.asarray(thin, np.float32); t = t - ax * (t @ ax); t /= np.linalg.norm(t)
        Q = P + ((P - a) @ t)[:, None] * t[None] * (1 / k - 1)
        return cap(Q, a, b, ra, rb) * k

    def chain(P, pts, radii, k):
        d = None
        for i in range(len(pts) - 1):
            c = cap(P, pts[i], pts[i + 1], radii[i], radii[i + 1])
            d = c if d is None else smin(d, c, k)
        return d

    def head_sdf(P):
        h = ell(P, p(0, 1090, 282), r(40, 46, 40))                                    # skull
        h = smin(h, cap(P, p(0, 1112, 298), p(0, 1180, 334), 30 * S, 15 * S), 0.03)    # long muzzle
        h = smin(h, ell(P, NOSE, r(13, 12, 11)), 0.01)                                 # nose
        h = smin(h, cap(P, p(0, 1095, 330), p(0, 1168, 350), 20 * S, 9 * S), 0.02)     # lower jaw
        for s in (1, -1):
            h = smin(h, ell(P, p(s * 26, 1092, 300), r(18, 30, 26)), 0.025)            # cheeks
            h = smax(h, -ell(P, EYES[0 if s > 0 else 1], r(9, 8, 6)), 0.006)           # eye sockets
            # ears: big leaves held out sideways and back (front view: out to 80 px either side)
            a = p(s * 30, 1062, 258); b = p(s * 85, 1030, 236)
            e = flat_cap(P, a, b, 20 * S, 4 * S, [0, 0.4, 1.0], 0.35)
            cup = flat_cap(P, a + np.array([0, 0.004, 0.012], np.float32), b + np.array([0, 0.002, 0.008], np.float32), 13 * S, 2 * S, [0, 0.4, 1.0], 0.22)
            h = smin(h, smax(e, -cup, 0.004), 0.02)
        return h

    def body_sdf(P):
        d = ell(P, p(0, 790, 478), r(104, 205, 88))                                     # the barrel
        d = smin(d, ell(P, p(0, 950, 470), r(110, 112, 100)), 0.08)                     # chest, deep
        d = smin(d, ell(P, p(0, 960, 412), r(74, 82, 40)), 0.06)                       # withers
        d = smin(d, ell(P, p(0, 650, 462), r(86, 98, 82)), 0.08)                       # haunches
        d = smin(d, ell(P, p(0, 615, 420), r(60, 50, 40)), 0.05)                       # the rump
        d = smin(d, cap(P, p(0, 985, 425), p(0, 1068, 312), 78 * S, 46 * S), 0.06)     # the neck, thick
        d = smin(d, head_sdf(P), 0.04)
        for k, J in LEGS.items():
            front = k[0] == 'f'
            if front:
                d = smin(d, ell(P, J[0] + r(-np.sign(J[0][0]) * 6, 0, 10), r(28, 52, 62)), 0.05)           # shoulder, upper arm
                d = smin(d, chain(P, J[:2], [28 * S, 23 * S], 0.02), 0.04)
            else:
                d = smin(d, ell(P, (J[0] + J[1]) * 0.5 + r(-np.sign(J[0][0]) * 4, -8, 0), r(33, 60, 78)), 0.05)   # the thigh
            # below the elbow / stifle the leg stands clear of the body: thin, joined by a small blend only
            d = smin(d, chain(P, J[1:5], [23 * S, 18 * S, 16 * S, 17 * S] if front else [24 * S, 18 * S, 16 * S, 17 * S], 0.012), 0.02)
            d = smin(d, ell(P, J[4] + r(0, 4, 2), r(20, 24, 15)), 0.01)                # the hoof
        tail = [p(0, 612, 410), p(0, 596, 385), p(0, 582, 362)]                         # the tail held up, a white flag
        d = smin(d, chain(P, tail, [24 * S, 20 * S, 9 * S], 0.02), 0.03)
        return np.maximum(d, -P[:, 2])

    def zones(P):
        xo, sx, sy = topx(P)
        head = sstep(1050, 1080, sx) * (1 - sstep(360, 380, sy))
        face = head * sstep(1100, 1120, sx)
        mane = np.exp(-(((sx - 1030) / 70) ** 2 + ((sy - 380) / 90) ** 2)) * (1 - face)
        bib = np.exp(-(((sx - 1040) / 50) ** 2 + ((sy - 470) / 80) ** 2 + (xo / 60) ** 2))
        legs = sstep(590, 640, sy)
        lower = sstep(640, 700, sy)
        belly = np.exp(-(((sy - 560) / 30) ** 2)) * sstep(700, 760, sx) * (1 - sstep(990, 1030, sx))
        tail = sstep(628, 608, sx) * (1 - sstep(425, 445, sy))
        ears = head * (1 - sstep(250, 268, sy)) * sstep(30, 40, np.abs(xo))
        return dict(head=head, face=face, mane=mane, bib=bib, legs=legs, lower=lower, belly=belly, tail=tail, ears=ears)

    def rot(P):
        """where the Rot has eaten in: dark patches, more on the flanks, belly and legs"""
        xo, sx, sy = topx(P)
        n = fbm(P * 3.2 + 5, 3.0)
        more = 0.10 * sstep(430, 600, sy) + 0.06 * (np.abs(xo) > 40)
        return sstep(0.63 - more, 0.67 - more, n) * (1 - zones(P)['head'])

    def tuft_len(P):
        Z = zones(P)
        L = np.full(len(P), 0.22)
        L = mix(L, 0.30, Z['mane']); L = mix(L, 0.28, Z['bib']); L = mix(L, 0.28, Z['belly'])
        L = mix(L, 0.07, Z['legs']); L = mix(L, 0.04, Z['lower'])
        L = mix(L, 0.16, Z['tail'])
        L = mix(L, 0.06, Z['head']); L = mix(L, 0.03, Z['face']); L = mix(L, 0.035, Z['ears'])
        return L

    def flow(P, N):
        x = P[:, 0]; Z = zones(P)
        v = np.stack([0 * x, -np.ones_like(x), -0.5 + 0 * x], 1)
        down = np.tile([0, -0.1, -1.0], (len(P), 1))
        w = np.maximum(Z['legs'], sstep(0.05, 0.14, np.abs(x)) * 0.6)
        v = v * (1 - w[:, None]) + down * w[:, None]
        mb = np.maximum(Z['mane'], Z['bib'])[:, None]
        v = v * (1 - mb) + np.stack([np.sign(x) * 0.3, 0.1 + 0 * x, -1 + 0 * x], 1) * mb
        hd = Z['head'][:, None]
        v = v * (1 - hd) + np.stack([np.sign(x) * 0.3, -np.ones_like(x), 0.1 + 0 * x], 1) * hd
        tl = Z['tail'][:, None]
        v = v * (1 - tl) + np.tile([0, -0.3, 1.0], (len(P), 1)) * tl                  # the tail is a raised white flag
        v = v + 0.14 * (np.stack([fbm(P * 5 + 3, 3.0), fbm(P * 5 + 7, 3.0), fbm(P * 5 + 11, 3.0)], 1) - 0.5)
        v = v - N * np.sum(v * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)

    def bare(P):
        b = P[:, 2] < 0.01
        b |= np.linalg.norm((P - NOSE) / r(20, 20, 18), axis=1) < 1
        for e in EYES: b |= np.linalg.norm((P - e) / r(12, 11, 9), axis=1) < 1
        b |= rot(P) > 0.5
        b |= np.linalg.norm((P - p(0, 955, 858)) / r(200, 40, 25), axis=1) < 0      # (none)
        return b

    def style(TP, TL, rng):
        n = len(TP); Z = zones(TP)
        W = TL * (0.30 + 0.08 * rng.random(n)); H = np.minimum(TL * (0.10 + 0.03 * rng.random(n)), 0.032)
        H = H * mix(1, 0.5, Z['face']) * mix(1, 1.7, np.maximum(Z['mane'], Z['bib'])) * mix(1, 1.8, Z['belly']) * mix(1, 2.2, Z['tail'])
        C = mix(mix(WHITE, GREYW, rng.random(n)[:, None]), LAV, (rng.random(n)[:, None] * 0.5) * (0.4 + 0.6 * Z['legs'][:, None]))
        C = mix(C, mix(ROT, ROT2, rng.random(n)[:, None]), Z['lower'][:, None])
        near_rot = np.clip(rot(TP) * 2.5, 0, 1)
        C = mix(C, LAV * 0.8, near_rot[:, None] * 0.6)
        C = C * (0.92 + 0.14 * rng.random(n))[:, None]
        return dict(W=W, H=H, C=C)

    log('coat')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=31, spacing=0.24, shape='lock',
                  sway=0.3, tip_soft=1.4, groove_depth=0.22, grooves=(2, 4), round_=0.75, log=log)
    full_sdf, place_sdf = coat.full_sdf, coat.place_sdf

    def rot_full(P):      # the Rot sinks in a little where it has eaten the fur away
        d = full_sdf(P)
        return d + 0.006 * rot(P)
    log('body, voxel', VOX)
    Vb, Fb = Sd.mc(rot_full, VOX, K.lo, K.hi, band=coat.HMAX + 0.02)
    log('body tris', len(Fb))
    col, top, has = coat.colours(Vb, np.tile(GREYW, (len(Vb), 1)))
    Z = zones(Vb)
    rv = rot(Vb)[:, None]
    col = mix(col, ROT * (0.8 + 0.4 * fbm(Vb * 40, 2.0))[:, None], np.clip(rv * 1.3, 0, 1))
    col = mix(col, mix(ROT, ROT2, 0.5) * (0.85 + 0.3 * fbm(Vb * 30, 2.0))[:, None], (Z['lower'] * (~has))[:, None])
    hoofz = np.clip((0.045 - Vb[:, 2]) / 0.02, 0, 1)[:, None]
    col = mix(col, HOOF, hoofz)
    nose = np.clip(1.5 - np.linalg.norm((Vb - NOSE) / r(17, 15, 13), axis=1), 0, 1)[:, None]
    col = mix(col, np.array([0.08, 0.07, 0.08]), np.clip(nose * 1.6, 0, 1))
    xo, sx, sy = topx(Vb)
    lips = np.exp(-((sy - (345 + (sx - 1150) * 0.1)) / 3.5) ** 2) * (np.abs(xo) < 22) * (sx > 1130)
    col = mix(col, np.array([0.25, 0.22, 0.25]), lips[:, None])
    earin = Z['ears'] * (np.abs(xo) > 38)
    col = mix(col, np.array([0.70, 0.60, 0.66]), (earin * 0.5)[:, None])
    for e in EYES:
        ring_ = np.clip(1.4 - np.linalg.norm((Vb - e) / r(13, 11, 9), axis=1), 0, 1)[:, None]
        col = mix(col, np.array([0.30, 0.27, 0.30]), ring_ * 0.7)
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    # ---- the antlers: a main beam up and back, then sweeping forward; tines forward and out ----------------------
    log('antlers')
    def curve(pts, n):
        pts = np.asarray(pts, float)
        L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
        s = np.linspace(0, L_[-1], n)
        return np.stack([np.interp(s, L_, pts[:, i]) for i in range(3)], 1)
    def antler_piece(pts, r0, r1, n=None):
        c = curve(pts, n or {0: 8, 1: 10, 2: 18, 3: 28}[LV])
        u = np.linspace(0, 1, len(c))
        rad = r0 * (1 - u) + r1 * u
        if LV >= 2: rad = rad * (1 + 0.05 * np.sin(u * 37 + r0 * 100))           # a knobbly beam
        V, F = tube(c, rad, max(6, SIDES + 2))
        t = np.clip(np.linalg.norm(V - c[0], axis=1) / max(np.linalg.norm(c[-1] - c[0]), 1e-6), 0, 1)[:, None]
        M.add(V, F, np.clip(mix(ANT2, ANT, t) * (0.9 + 0.15 * t), 0, 1), 2)
        return c
    BEAMS = []
    for s in (1, -1):
        B0 = ANTLER_BASE[0 if s > 0 else 1]
        # front view: up and out to 85 px at py 150, then up to 60 px at the tips; side view: back to px 1020 by
        # py 120, then the crescent forward to its tip at px 1100, py 20
        beam = [B0, p(s * 52, 1055, 190), p(s * 82, 1030, 140), p(s * 90, 1018, 95), p(s * 80, 1030, 50), p(s * 64, 1068, 24), p(s * 52, 1102, 18)]
        c = antler_piece(beam, 20 * S, 4 * S)
        BEAMS.append(c)
        for (i, tip, rr) in [(0.16, p(s * 64, 1135, 182), 12), (0.30, p(s * 78, 1150, 120), 10), (0.45, p(s * 130, 1062, 92), 10),
                             (0.36, p(s * 115, 968, 118), 9), (0.62, p(s * 124, 1008, 52), 8), (0.24, p(s * 100, 1005, 170), 8)]:
            j = int(i * (len(c) - 1)); mid = (c[j] + tip) / 2 + np.array([0, 0, 0.06])
            antler_piece([c[j], mid, tip], rr * S, 3 * S, {0: 5, 1: 7, 2: 12, 3: 18}[LV])
        # a burr round its base
        a_ = np.linspace(0, 2 * np.pi, {0: 10, 1: 12, 2: 18, 3: 26}[LV])
        ring = B0 + np.stack([np.cos(a_), np.sin(a_), 0 * a_], 1) * 17 * S + np.array([0, 0, 0.012])
        V, F = tube(ring, np.full(len(ring), 6 * S), max(5, SIDES))
        M.add(V, F, ANT2 * 0.9, 2)

    # ---- vines wound round the beams, some hanging down the neck; mushrooms on the tines -----------------------------
    log('vines, mushrooms')
    vr = np.random.default_rng(7)
    for bi, c in enumerate(BEAMS):
        n = len(c); u = np.linspace(0, 1, n)
        t_, N_, B_ = G.frames(c)
        ang = u * 7 * np.pi + bi
        pts = c + (np.cos(ang)[:, None] * N_ + np.sin(ang)[:, None] * B_) * (11 * S)
        sel = u < 0.75
        V, F = tube(pts[sel], np.full(sel.sum(), 3.4 * S), max(5, SIDES - 1))
        M.add(V, F, VINE, 8)
        # hanging strands: from the beam's base down beside the neck (side view: to py 330 at px 990)
        s = 1 if bi == 0 else -1
        for k, (end, wob) in enumerate([(p(s * 70, 985, 330), 0.03), (p(s * 60, 1010, 290), 0.02)]):
            st = c[int(0.18 * n)]
            hang = curve([st, (st + end) / 2 + np.array([s * 0.03, -0.02, -0.02]), end], {0: 10, 1: 14, 2: 24, 3: 36}[LV])
            hang = hang + wob * np.sin(np.linspace(0, 6, len(hang)))[:, None] * np.array([1, 0.3, 0])
            V, F = tube(hang, np.full(len(hang), 2.8 * S), max(5, SIDES - 1))
            M.add(V, F, VINE * 0.85, 8)
    for bi, c in enumerate(BEAMS):
        for i in (0.35, 0.55, 0.8):
            j = int(i * (len(c) - 1)); s = 1 if bi == 0 else -1
            base = c[j] + np.array([s * 0.02, -0.01, 0.0])
            cs = vr.uniform(9, 13) * S
            V, F = tube(np.array([base, base + np.array([s * 0.012, 0, 0.018])]), np.array([2.4 * S, 2 * S]), max(5, SIDES - 2))
            M.add(V, F, SHROOM * 0.85, 8)
            V, F = G.ellipsoid(base + np.array([s * 0.014, 0, 0.022]), (cs, cs, cs * 0.35), {0: 5, 1: 6, 2: 9, 3: 12}[LV], {0: 8, 1: 10, 2: 14, 3: 20}[LV])
            cc = np.tile(SHROOM, (len(V), 1)); cc[V[:, 2] < base[2] + 0.02] = GILL
            M.add(V, F, cc, 8)

    # ---- the rotwood circlet: a golden ring floating round the antlers, a cross-spike at its front ----------------------
    log('circlet')
    C0 = p(0, 1075, 172); RX, RY = 103 * S, 78 * S; tilt = 0.25
    a_ = np.linspace(0, 2 * np.pi, {0: 40, 1: 56, 2: 96, 3: 140}[LV])
    ring = np.stack([RX * np.sin(a_), RY * np.cos(a_), 0 * a_], 1)
    ring = ring @ np.array([[1, 0, 0], [0, math.cos(tilt), -math.sin(tilt)], [0, math.sin(tilt), math.cos(tilt)]]).T + C0
    for dz, rr in [(0.012, 3.6), (-0.012, 3.6)]:
        V, F = tube(ring + np.array([0, 0, dz]), np.full(len(ring), rr * S), max(6, SIDES))
        M.add(V, F, GOLD, 8)
    for q in range(0, len(ring) - 1, 2):            # the filigree between the two bands
        V, F = tube(np.array([ring[q] + [0, 0, 0.012], ring[q + 1] + [0, 0, -0.012]]), np.array([1.6 * S, 1.6 * S]), 5)
        M.add(V, F, GOLD * 0.9, 8)
    front = ring[0]
    for d_, L_ in [((0, 0, 1), 0.13), ((0, 0, -1), 0.09), ((1, 0, 0), 0.06), ((-1, 0, 0), 0.06)]:
        d_ = np.asarray(d_, float)
        V, F = G.horn(front, d_, L_, 6 * S, None, 0.0, max(4, SEG), max(6, SIDES))
        M.add(V, F, mix(GOLD, PALEG, 0.4), 8)
    V, F = G.ellipsoid(front, (9 * S, 6 * S, 9 * S), {0: 6, 1: 8, 2: 10, 3: 14}[LV], {0: 8, 1: 12, 2: 16, 3: 20}[LV])
    M.add(V, F, PALEG, 8)

    # ---- eyes: dark, a small light in them -------------------------------------------------------------------------
    for e in EYES:
        V, F = G.ellipsoid(e, r(8, 7, 5.5), {0: 6, 1: 8, 2: 12, 3: 16}[LV], {0: 10, 1: 14, 2: 20, 3: 28}[LV])
        cc = np.tile([0.06, 0.05, 0.07], (len(V), 1)); cc[(V[:, 2] > e[2] + 0.004) & (V[:, 1] > e[1])] = [0.75, 0.72, 0.8]
        M.add(V, F, cc, 7)
    return M
