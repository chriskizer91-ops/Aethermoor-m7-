# The rime wolf, rabble of the high passes (Foes: beasts, session 7, November 23).
#   kit/make.sh rime-wolf
#
# Chris's sheet (art-in/3d/sheets/sheet-rime-wolf.webp): grey wolves of the high passes with frost in their ruffs. A
# big long-legged wolf in shaggy dark grey-blue locks, paler on the ruff, chest, cheeks and the underside of a great
# plumed tail; a dark mask over the muzzle and round the eyes with pale brows; pale blue eyes; tall dark ears; ice
# crystals grown into the ruff on both sides of the neck; big paws with dark claws.
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across from the middle) at
# 0.95 m to the ear tips. His legs stand clear of his body from the elbow and stifle down, as the rotstag's.
# x his right, y forward, z up.
import numpy as np

TALL_PX, GROUND, MID = 663, 688, 1065
S = 0.95 / TALL_PX
def p(xo, px, py): return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S
def topx(P): return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

LEGS = {   # across px, then side-view joints: shoulder/hip (in the body), elbow/stifle (where it leaves), wrist/hock,
           # fetlock, paw
    'fl': [(62, 1195, 330), (82, 1205, 462), (82, 1210, 610), (82, 1213, 652), (82, 1222, 676)],
    'fr': [(-62, 1280, 330), (-82, 1290, 462), (-82, 1295, 610), (-82, 1298, 652), (-82, 1307, 676)],
    'bl': [(60, 870, 330), (82, 855, 468), (82, 812, 582), (82, 820, 652), (82, 832, 676)],
    'br': [(-60, 950, 330), (-82, 935, 468), (-82, 892, 582), (-82, 900, 652), (-82, 912, 676)],
}
LEGS = {k: [p(*j) for j in v] for k, v in LEGS.items()}
EYES = [p(s * 32, 1452, 172) for s in (1, -1)]
NOSE = p(0, 1538, 210)
TAIL = [p(0, 795, 225), p(0, 712, 255), p(0, 652, 330), p(0, 618, 430), p(0, 604, 520)]

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep
    tube = G.tube
    M = K.Mesh()
    DARK = np.array([0.28, 0.31, 0.37]); MIDC = np.array([0.56, 0.61, 0.68]); PALE = np.array([0.88, 0.91, 0.95])   # (the coat shades each lock darker)
    WHITE = np.array([0.97, 0.98, 1.0]); CLAW = np.array([0.12, 0.12, 0.14]); ICE = np.array([0.72, 0.87, 0.98])
    ICE2 = np.array([0.90, 0.96, 1.0])

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
        h = ell(P, p(0, 1400, 168), r(60, 68, 56))                                    # the skull
        h = smin(h, cap(P, p(0, 1440, 192), p(0, 1530, 210), 36 * S, 17 * S), 0.03)  # the long muzzle
        h = smin(h, ell(P, NOSE, r(14, 12, 11)), 0.008)
        h = smin(h, cap(P, p(0, 1425, 232), p(0, 1515, 236), 26 * S, 11 * S), 0.02)  # the lower jaw
        for s in (1, -1):
            h = smin(h, ell(P, p(s * 40, 1420, 200), r(26, 40, 30)), 0.025)          # cheeks
            h = smax(h, -ell(P, EYES[0 if s > 0 else 1], r(8, 7, 5)), 0.005)
            a = p(s * 40, 1362, 112); b = p(s * 60, 1335, 28)                        # tall pointed ears
            e = flat_cap(P, a, b, 27 * S, 4 * S, [0, 1.0, 0.15], 0.36)
            cup = flat_cap(P, a + np.array([0, 0.008, 0.004], np.float32), b + np.array([0, 0.004, 0.002], np.float32), 18 * S, 2 * S, [0, 1.0, 0.15], 0.22)
            h = smin(h, smax(e, -cup, 0.003), 0.015)
        return h

    def body_sdf(P):
        d = ell(P, p(0, 1030, 330), r(122, 215, 118))                                   # the barrel
        d = smin(d, ell(P, p(0, 1245, 330), r(128, 122, 140)), 0.07)                  # the deep chest
        d = smin(d, ell(P, p(0, 865, 330), r(115, 112, 122)), 0.07)
        d = smin(d, ell(P, p(0, 1315, 235), r(135, 100, 118)), 0.06)                 # the great ruff round his neck                    # the haunches
        d = smin(d, cap(P, p(0, 1260, 290), p(0, 1385, 200), 78 * S, 56 * S), 0.05)  # the neck
        d = smin(d, head_sdf(P), 0.035)
        for k, J in LEGS.items():
            sg = np.sign(J[0][0])
            if k[0] == 'f': d = smin(d, ell(P, J[0] + r(sg * 4, 0, 50), r(40, 52, 95)), 0.04)      # shoulder
            else: d = smin(d, ell(P, (J[0] + J[1]) * 0.5 + r(sg * 2, 0, 0), r(44, 70, 92)), 0.04)  # the thigh
            d = smin(d, chain(P, J[1:5], [34 * S, 27 * S, 24 * S, 25 * S], 0.012), 0.02)
            d = smin(d, ell(P, J[4] + r(0, 10, 0), r(36, 44, 14)), 0.01)                  # the big paw
        d = smin(d, chain(P, TAIL, [34 * S, 50 * S, 58 * S, 50 * S, 22 * S], 0.03), 0.04)   # the plume
        return np.maximum(d, -P[:, 2])

    def zones(P):
        xo, sx, sy = topx(P)
        head = sstep(1360, 1390, sx) * (1 - sstep(260, 280, sy))
        face = head * sstep(1420, 1450, sx)
        ruff = np.exp(-(((sx - 1315) / 110) ** 2 + ((sy - 240) / 105) ** 2)) * (1 - face)
        chest = np.exp(-(((sx - 1330) / 60) ** 2 + ((sy - 380) / 80) ** 2 + (xo / 70) ** 2))
        legs = sstep(455, 485, sy) * (1 - sstep(800, 780, sx) * sstep(400, 380, sy))
        lower = sstep(560, 600, sy)
        tail = sstep(810, 780, sx) * (1 - sstep(330, 300, sy) * sstep(780, 820, sx))
        belly = sstep(410, 450, sy) * (1 - legs) * sstep(900, 960, sx) * (1 - sstep(1200, 1240, sx))
        ears = head * (1 - sstep(105, 125, sy)) * sstep(25, 35, np.abs(xo))
        return dict(head=head, face=face, ruff=ruff, chest=chest, legs=legs, lower=lower, tail=tail, belly=belly, ears=ears)

    def tuft_len(P):
        Z = zones(P)
        L = np.full(len(P), 0.10)
        L = mix(L, 0.16, Z['ruff']); L = mix(L, 0.13, Z['chest']); L = mix(L, 0.12, Z['belly'])
        L = mix(L, 0.035, Z['legs']); L = mix(L, 0.025, Z['lower'])
        L = mix(L, 0.17, Z['tail'])
        L = mix(L, 0.045, Z['head']); L = mix(L, 0.022, Z['face']); L = mix(L, 0.025, Z['ears'])
        return L

    def flow(P, N):
        x = P[:, 0]; Z = zones(P)
        v = np.stack([0 * x, -np.ones_like(x), -0.3 + 0 * x], 1)
        down = np.tile([0, -0.1, -1.0], (len(P), 1))
        w = np.maximum(Z['legs'], sstep(0.05, 0.12, np.abs(x)) * 0.5)
        v = v * (1 - w[:, None]) + down * w[:, None]
        rf = np.maximum(Z['ruff'], Z['chest'])[:, None]
        v = v * (1 - rf) + np.stack([np.sign(x) * 0.5, -0.6 + 0 * x, -1 + 0 * x], 1) * rf
        hd = Z['head'][:, None]
        v = v * (1 - hd) + np.stack([np.sign(x) * 0.3, -np.ones_like(x), 0.1 + 0 * x], 1) * hd
        # the tail's locks run out along it to the tip
        tl = Z['tail'][:, None]
        tdir = np.tile(TAIL[-1] - TAIL[0], (len(P), 1)); tdir /= np.linalg.norm(tdir, axis=1, keepdims=True)
        v = v * (1 - tl) + tdir * tl
        v = v + 0.15 * (np.stack([fbm(P * 6 + 3, 3.0), fbm(P * 6 + 7, 3.0), fbm(P * 6 + 11, 3.0)], 1) - 0.5)
        v = v - N * np.sum(v * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)

    def bare(P):
        b = P[:, 2] < 0.02
        b |= np.linalg.norm((P - NOSE) / r(18, 16, 15), axis=1) < 1
        for e in EYES: b |= np.linalg.norm((P - e) / r(11, 10, 8), axis=1) < 1
        b |= (np.abs(P[:, 0]) > 0.0) & False
        return b

    def tone(P):
        """the wolf's markings: dark back and mask, pale ruff, chest, cheeks, brows, legs' backs, tail's underside"""
        Z = zones(P); xo, sx, sy = topx(P)
        pale = np.maximum.reduce([Z['ruff'] * 0.85, Z['chest'], Z['belly'] * 0.6,
                                  Z['tail'] * sstep(-0.02, 0.03, -(P[:, 2] - np.interp(sx, [600, 800], [TAIL[-1][2], TAIL[0][2]]))),
                                  Z['head'] * np.exp(-(((sx - 1420) / 30) ** 2 + ((sy - 215) / 22) ** 2)) * sstep(20, 40, np.abs(xo)),   # cheeks
                                  Z['head'] * np.exp(-(((sx - 1448) / 14) ** 2 + ((sy - 158) / 7) ** 2)) * sstep(18, 26, np.abs(xo))])   # brows
        dark = np.maximum(sstep(260, 200, sy) * (1 - Z['head']) * (1 - Z['ruff']), Z['face'] * (np.abs(xo) < 22) * sstep(240, 200, sy))
        return pale, dark

    def style(TP, TL, rng):
        n = len(TP); Z = zones(TP)
        W = TL * (0.30 + 0.08 * rng.random(n)); H = np.minimum(TL * (0.10 + 0.03 * rng.random(n)), 0.028)
        H = H * mix(1, 0.5, Z['face']) * mix(1, 1.6, Z['ruff']) * mix(1, 1.6, Z['tail'])
        pale, dark = tone(TP)
        C = mix(MIDC, DARK, (rng.random(n) ** 2 * 0.8)[:, None])
        C = mix(C, mix(PALE, WHITE, rng.random(n)[:, None] * 0.6), pale[:, None])
        C = mix(C, DARK * 0.9, (dark * 0.7)[:, None])
        C = mix(C, DARK * 1.05, (Z['legs'] * (1 - Z['lower']) * 0.4)[:, None])
        C = C * (0.9 + 0.16 * rng.random(n))[:, None]
        return dict(W=W, H=H, C=C)

    log('coat')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=23, spacing=0.24, shape='lock',
                  sway=0.3, tip_soft=1.4, groove_depth=0.22, grooves=(2, 4), round_=0.75, log=log)
    log('body, voxel', VOX)
    Vb, Fb = Sd.mc(coat.full_sdf, VOX, K.lo, K.hi, band=coat.HMAX + 0.02)
    log('body tris', len(Fb))
    col, top, has = coat.colours(Vb, np.tile(DARK, (len(Vb), 1)))
    xo, sx, sy = topx(Vb)
    nose = np.clip(1.5 - np.linalg.norm((Vb - NOSE) / r(16, 14, 13), axis=1), 0, 1)[:, None]
    col = mix(col, np.array([0.06, 0.06, 0.07]), np.clip(nose * 1.6, 0, 1))
    lips = np.exp(-((sy - (236 - (sx - 1430) * 0.05)) / 3) ** 2) * (np.abs(xo) < 26) * (sx > 1420) * (~has)
    col = mix(col, np.array([0.10, 0.10, 0.12]), lips[:, None])
    for e in EYES:
        ring_ = np.clip(1.4 - np.linalg.norm((Vb - e) / r(12, 11, 9), axis=1), 0, 1)[:, None]
        col = mix(col, np.array([0.10, 0.11, 0.13]), ring_ * 0.8)
    earin = zones(Vb)['ears'] * (Vb[:, 1] > p(0, 1352, 0)[1])
    col = mix(col, PALE * 0.9, (earin * 0.55)[:, None])
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    # ---- claws: four dark claws at the front of each paw ---------------------------------------------------------------
    for k, J in LEGS.items():
        for t in (-1.5, -0.5, 0.5, 1.5):
            base = J[4] + r(t * 14, 30, 2)
            V, F = G.horn(base, [t * 0.15, 1.0, -0.5], 22 * S, 5 * S, [0, 0, -1], 0.4, max(4, SEG), max(5, SIDES - 4), tipR=0.0005)
            M.add(V, F, CLAW, 6)

    # ---- the rime: ice crystals grown into the ruff on both sides of his neck ------------------------------------------
    log('ice')
    rng = np.random.default_rng(17)
    n_ice = 60          # the same crystals at every level, so the light model's bake finds each one in the sculpt
    for s in (1, -1):
        for i in range(n_ice):
            sx_ = rng.uniform(1250, 1400); sy_ = rng.uniform(130, 330)
            if np.hypot((sx_ - 1330) / 80, (sy_ - 230) / 105) > 1: continue
            xy = None
            # find the coat's surface coming in from the side
            P0 = p(s * 200, sx_, sy_)[None]
            for _ in range(40):
                dd = coat.full_sdf(P0); P0[:, 0] -= s * np.maximum(dd, 0.002) * 0.8
            base = P0[0] - np.array([s * 0.012, 0, 0])
            d = np.array([s * 1.0, rng.uniform(-0.6, 0.1), rng.uniform(-0.6, 0.5)]); d /= np.linalg.norm(d)
            L = rng.uniform(0.05, 0.11); rr = rng.uniform(0.008, 0.016)
            V, F = G.horn(base, d, L, rr, None, 0.0, max(3, SEG - 2), 6, tipR=0.0008, power=0.6)
            t = np.clip(np.linalg.norm(V - base, axis=1) / L, 0, 1)[:, None]
            M.add(V, F, np.clip(mix(ICE, ICE2, t), 0, 1), 8)

    # ---- eyes: pale icy blue, a dark pupil ---------------------------------------------------------------------------
    for e in EYES:
        V, F = G.ellipsoid(e, r(7.5, 7, 5.5), {0: 6, 1: 8, 2: 12, 3: 16}[LV], {0: 10, 1: 14, 2: 20, 3: 28}[LV])
        cc = np.tile([0.50, 0.78, 0.96], (len(V), 1))
        pupil = np.linalg.norm((V - e - np.array([np.sign(e[0]) * 0.004, 0.006, 0])) / r(3.5, 3.5, 3.5), axis=1) < 1
        cc[pupil] = [0.03, 0.04, 0.05]; cc[(V[:, 2] > e[2] + 0.005)] *= 0.6
        M.add(V, F, cc, 7)
    return M
