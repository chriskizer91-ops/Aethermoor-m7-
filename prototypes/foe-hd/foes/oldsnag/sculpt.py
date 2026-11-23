# Old Snag, Act One's Relic-Bearer of the Verdant Wilds (Foes: beasts, session 7, November 23).
#   kit/make.sh oldsnag
#
# Chris's sheet (art-in/3d/sheets/sheet-oldsnag.webp): a boar the size of a cart with a ranger's hatchet buried in his
# shoulder. Shaggy brown coat in long overlapping locks, pale tan stripes wavering down his flanks, a crest of long dark
# bristles over the spine, tallest at the shoulders; pale tan whiskers on his cheeks; small amber eyes; a pink-brown snout
# disc; long ivory tusks curving up and out; short thick legs, darker, with cloven grey hooves; a thin tail with a dark
# tuft. The Thornsplitter Hatchet sits in his left shoulder, its blade glowing green, the haft wound in green cord and
# leather, two green leaves tied at its end; the wound round it dark red.
#
# Measured off the sheet in its own pixels (side view: px forward, py down; front view: px across from the middle) at
# 1.3 m to the top of his bristles. His legs are short, so they're set wide apart (as in the sheet) and come out of the
# belly clear of it, with short fur, so they swing without dragging the body. x his right, y forward, z up.
import math
import numpy as np

TALL_PX, GROUND, MID = 590, 685, 1130
S = 1.3 / TALL_PX
def p(xo, px, py): return np.array([xo * S, (px - MID) * S, (GROUND - py) * S], np.float32)
def r(*v): return np.array(v, np.float32) * S
def topx(P): return P[:, 0] / S, P[:, 1] / S + MID, GROUND - P[:, 2] / S

LEGS = {   # across px, then side-view joints: shoulder/hip (in the body), elbow/stifle (where it leaves), knee/hock,
           # fetlock, hoof
    'fl': [(128, 1222, 470), (140, 1230, 560), (140, 1236, 615), (140, 1240, 652), (140, 1244, 676)],
    'fr': [(-128, 1282, 470), (-140, 1290, 560), (-140, 1296, 615), (-140, 1300, 652), (-140, 1304, 676)],
    'bl': [(124, 770, 450), (135, 772, 560), (135, 752, 612), (135, 756, 652), (135, 760, 676)],
    'br': [(-124, 895, 450), (-135, 897, 560), (-135, 877, 612), (-135, 881, 652), (-135, 885, 676)],
}
LEGS = {k: [p(*j) for j in v] for k, v in LEGS.items()}
EYES = [p(s * 56, 1442, 397) for s in (1, -1)]
SNOUT = p(0, 1562, 500)
# the hatchet, in his left shoulder: the blade's buried edge, the head of the haft, its end
AXE_IN, AXE_HEAD, AXE_END = p(-88, 1236, 248), p(-104, 1222, 172), p(-198, 1384, 62)

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep
    tube = G.tube
    M = K.Mesh()
    BROWN = np.array([0.36, 0.24, 0.16]); BROWN2 = np.array([0.30, 0.20, 0.13]); DARK = np.array([0.19, 0.13, 0.10])
    TAN = np.array([0.60, 0.48, 0.34]); PALE = np.array([0.70, 0.62, 0.49]); LEGC = np.array([0.24, 0.16, 0.11])
    HOOF = np.array([0.20, 0.19, 0.19]); DISC = np.array([0.60, 0.40, 0.36]); IVORY = np.array([0.90, 0.85, 0.72])
    BLOOD = np.array([0.30, 0.07, 0.06]); STEEL = np.array([0.62, 0.66, 0.66]); GLOW = np.array([0.62, 0.80, 0.22])
    WOOD = np.array([0.40, 0.24, 0.14]); CORD = np.array([0.40, 0.46, 0.18]); BONE = np.array([0.86, 0.83, 0.74])
    LEAF = np.array([0.50, 0.62, 0.18])

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
        h = ell(P, p(0, 1385, 372), r(112, 100, 92))                                   # the skull, broad
        h = smin(h, cap(P, p(0, 1420, 420), p(0, 1548, 494), 80 * S, 42 * S), 0.05)     # the long snout
        h = smin(h, ell(P, SNOUT, r(46, 12, 33)), 0.015)                               # the disc
        h = smin(h, cap(P, p(0, 1400, 505), p(0, 1525, 530), 54 * S, 26 * S), 0.03)     # the lower jaw
        for s in (1, -1):
            h = smin(h, ell(P, p(s * 66, 1402, 455), r(52, 70, 54)), 0.04)            # the jowls
            h = smin(h, ell(P, p(s * 50, 1505, 500), r(22, 26, 20)), 0.02)            # where the tusk comes out
            h = smax(h, -ell(P, EYES[0 if s > 0 else 1], r(10, 9, 7)), 0.006)          # eye sockets
            h = smax(h, -ell(P, p(s * 18, 1574, 504), r(9, 8, 11)), 0.004)             # nostrils
            # ears: up, out and a little back, cupped forward
            a = p(s * 86, 1348, 336); b = p(s * 138, 1326, 262)
            e = flat_cap(P, a, b, 34 * S, 7 * S, [0, 1.0, 0.25], 0.38)
            cup = flat_cap(P, a + np.array([0, 0.012, 0.008], np.float32), b + np.array([0, 0.006, 0.004], np.float32), 24 * S, 3 * S, [0, 1.0, 0.25], 0.24)
            h = smin(h, smax(e, -cup, 0.004), 0.02)
        return h

    def body_sdf(P):
        d = ell(P, p(0, 975, 410), r(198, 300, 162))                                    # the barrel
        d = smin(d, ell(P, p(0, 1212, 395), r(204, 135, 176)), 0.10)                   # the shoulders' hump, the chest
        d = smin(d, ell(P, p(0, 800, 412), r(184, 135, 150)), 0.10)                    # the haunches
        d = smin(d, ell(P, p(0, 1300, 420), r(165, 100, 138)), 0.08)                   # the thick neck
        d = smin(d, head_sdf(P), 0.07)
        for k, J in LEGS.items():
            sg = np.sign(J[0][0])
            if k[0] == 'f':
                d = smin(d, ell(P, J[0] + r(sg * 4, 0, 6), r(58, 74, 92)), 0.05)          # shoulder, upper arm
            else:
                d = smin(d, ell(P, J[0] + r(sg * 2, -6, 10), r(62, 96, 112)), 0.05)       # the ham
            # from the elbow / stifle down the leg stands clear of the belly, joined to it by a small blend only
            d = smin(d, chain(P, J[1:5], [42 * S, 36 * S, 31 * S, 29 * S], 0.015), 0.025)
            for t in (1, -1):                                                           # the cloven hoof
                d = smin(d, ell(P, J[4] + r(t * 14, 8, -2), r(14, 24, 14)), 0.008)
            d = smin(d, ell(P, J[3] + r(0, -16, 2), r(16, 10, 9)), 0.01)              # the dewclaws behind
        tail = [p(0, 692, 330), p(0, 664, 380), p(0, 645, 440), p(0, 632, 505)]
        d = smin(d, chain(P, tail, [17 * S, 12 * S, 10 * S, 8 * S], 0.02), 0.03)
        return np.maximum(d, -P[:, 2])

    def wound(P):
        return np.linalg.norm((P - AXE_IN) / r(30, 34, 36), axis=1)

    def zones(P):
        xo, sx, sy = topx(P)
        head = sstep(1330, 1370, sx)
        face = head * sstep(1440, 1480, sx)
        cheek = np.exp(-(((sx - 1395) / 60) ** 2 + ((sy - 450) / 50) ** 2)) * sstep(40, 80, np.abs(xo))
        crest = sstep(-200, -150, -np.abs(xo)) * sstep(330, 280, sy) * sstep(740, 800, sx) * (1 - sstep(1400, 1440, sx))
        legs = sstep(545, 575, sy)
        lower = sstep(600, 630, sy)
        belly = sstep(520, 560, sy) * (1 - legs) * sstep(760, 820, sx) * (1 - sstep(1280, 1320, sx))
        tail = sstep(712, 692, sx) * sstep(300, 330, sy)
        tuft = tail * sstep(420, 450, sy)
        ears = sstep(1300, 1320, sx) * (1 - sstep(330, 345, sy)) * sstep(70, 90, np.abs(xo))
        return dict(head=head, face=face, cheek=cheek, crest=crest, legs=legs, lower=lower, belly=belly, tail=tail,
                    tuft=tuft, ears=ears)

    def stripes(P):
        """the pale tan bands wavering down his flanks, broken"""
        xo, sx, sy = topx(P)
        s = np.zeros(len(P))
        for y0, a, f, ph in [(300, 16, 85, 0.0), (352, 20, 105, 1.3), (420, 18, 80, 2.2)]:
            yy = y0 + a * np.sin(sx / f + ph) + 10 * (fbm(P * 2 + y0, 2.0) - 0.5)
            s = np.maximum(s, np.exp(-((sy - yy) / 12) ** 2))
        s *= sstep(0.38, 0.52, fbm(P * 5 + 3, 2.0))
        return s * sstep(720, 780, sx) * (1 - sstep(1300, 1340, sx)) * sstep(50, 90, np.abs(xo))

    def tuft_len(P):
        Z = zones(P)
        L = np.full(len(P), 0.13)
        L = mix(L, 0.17, Z['crest']); L = mix(L, 0.10, Z['belly'])
        L = mix(L, 0.07, Z['legs']); L = mix(L, 0.045, Z['lower'])
        L = mix(L, 0.09, Z['tail']); L = mix(L, 0.17, Z['tuft'])
        L = mix(L, 0.06, Z['head']); L = mix(L, 0.03, Z['face']); L = mix(L, 0.12, Z['cheek'] * (1 - Z['face']))
        L = mix(L, 0.035, Z['ears'])
        return L

    def flow(P, N):
        x = P[:, 0]; Z = zones(P)
        v = np.stack([0 * x, -np.ones_like(x), -0.35 + 0 * x], 1)                       # back along the body
        down = np.tile([0, -0.1, -1.0], (len(P), 1))
        w = np.maximum(Z['legs'], sstep(0.16, 0.30, np.abs(x)) * 0.5)
        v = v * (1 - w[:, None]) + down * w[:, None]
        ck = Z['cheek'][:, None]                                                       # whiskers swept back and down
        v = v * (1 - ck) + np.stack([np.sign(x) * 0.4, -np.ones_like(x), -0.5 + 0 * x], 1) * ck
        cr = Z['crest'][:, None]
        v = v * (1 - cr) + np.stack([np.sign(x) * 0.5, -np.ones_like(x), 0.3 + 0 * x], 1) * cr
        tl = Z['tail'][:, None]
        v = v * (1 - tl) + down * tl
        v = v + 0.16 * (np.stack([fbm(P * 5 + 3, 3.0), fbm(P * 5 + 7, 3.0), fbm(P * 5 + 11, 3.0)], 1) - 0.5)
        v = v - N * np.sum(v * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)

    def bare(P):
        b = P[:, 2] < 0.05                                                              # hooves
        b |= np.linalg.norm((P - SNOUT) / r(55, 30, 42), axis=1) < 1
        for e in EYES: b |= np.linalg.norm((P - e) / r(14, 13, 11), axis=1) < 1
        b |= wound(P) < 1
        return b

    def style(TP, TL, rng):
        n = len(TP); Z = zones(TP)
        W = TL * (0.30 + 0.08 * rng.random(n)); H = np.minimum(TL * (0.11 + 0.03 * rng.random(n)), 0.03)
        H = H * mix(1, 0.5, Z['face']) * mix(1, 1.4, Z['cheek']) * mix(1, 1.3, Z['crest'])
        C = mix(BROWN, BROWN2, rng.random(n)[:, None])
        C = mix(C, DARK, (Z['crest'] * 0.8)[:, None])
        C = mix(C, TAN, (stripes(TP) * 0.85)[:, None])
        C = mix(C, PALE, (Z['cheek'] * (1 - Z['face']) * 0.9)[:, None])
        C = mix(C, LEGC, Z['legs'][:, None] * 0.8)
        C = mix(C, TAN * 0.9, (Z['lower'] * 0.35)[:, None])                            # pale fetlock tufts
        C = mix(C, DARK * 0.9, Z['tuft'][:, None])
        near = np.clip(1.6 - wound(TP), 0, 1)                                           # blood matted round the wound
        C = mix(C, BLOOD * 1.3, (near * 0.8)[:, None])
        C = C * (0.88 + 0.18 * rng.random(n))[:, None]
        return dict(W=W, H=H, C=C)

    log('coat')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=41, spacing=0.24, shape='lock',
                  sway=0.3, tip_soft=1.4, groove_depth=0.22, grooves=(2, 4), round_=0.75, log=log)
    full_sdf = coat.full_sdf

    def wounded(P):      # the wound is sunk in round the blade
        return full_sdf(P) + 0.012 * np.clip(1.3 - wound(P), 0, 1)
    log('body, voxel', VOX)
    Vb, Fb = Sd.mc(wounded, VOX, K.lo, K.hi, band=coat.HMAX + 0.02)
    log('body tris', len(Fb))
    col, top, has = coat.colours(Vb, np.tile(BROWN2, (len(Vb), 1)))
    xo, sx, sy = topx(Vb)
    hoofz = np.clip((0.06 - Vb[:, 2]) / 0.02, 0, 1)[:, None]
    col = mix(col, HOOF * (0.85 + 0.3 * fbm(Vb * 40, 2.0))[:, None], hoofz)
    dz = np.clip(1.4 - np.linalg.norm((Vb - SNOUT) / r(50, 26, 38), axis=1), 0, 1)[:, None]
    col = mix(col, DISC * (0.9 + 0.2 * fbm(Vb * 50, 2.0))[:, None], np.clip(dz * 1.5, 0, 1))
    for s in (1, -1):
        nos = np.clip(1.5 - np.linalg.norm((Vb - p(s * 18, 1574, 504)) / r(10, 10, 12), axis=1), 0, 1)[:, None]
        col = mix(col, np.array([0.16, 0.08, 0.08]), nos)
    lips = np.exp(-((sy - (522 + (sx - 1480) * 0.08)) / 4) ** 2) * (np.abs(xo) < 50) * (sx > 1430) * (~has)
    col = mix(col, np.array([0.18, 0.12, 0.10]), lips[:, None])
    wd = np.clip(1.25 - wound(Vb), 0, 1)[:, None]
    col = mix(col, BLOOD * (0.8 + 0.4 * fbm(Vb * 60, 2.0))[:, None], np.clip(wd * 1.6, 0, 1))
    earin = zones(Vb)['ears'] * (Vb[:, 1] > p(0, 1325, 0)[1])
    col = mix(col, np.array([0.55, 0.42, 0.34]), (earin * 0.6)[:, None])
    for e in EYES:
        ring_ = np.clip(1.4 - np.linalg.norm((Vb - e) / r(14, 12, 10), axis=1), 0, 1)[:, None]
        col = mix(col, np.array([0.16, 0.10, 0.08]), ring_ * 0.8)
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    # ---- the crest: long dark bristles along the spine, tallest over the shoulders, the side ones leaning out ----------
    log('bristles')
    rng = np.random.default_rng(5)
    prof = np.array([(740, 215), (800, 180), (900, 150), (1000, 122), (1100, 100), (1160, 92), (1250, 118),
                     (1340, 165), (1420, 215), (1450, 250)], float)
    step = {0: 34, 1: 24, 2: 16, 3: 12}[LV]
    lat = {0: [-0.8, 0, 0.8], 1: [-1, -0.5, 0, 0.5, 1], 2: [-1, -0.66, -0.33, 0, 0.33, 0.66, 1], 3: list(np.linspace(-1, 1, 9))}[LV]
    seg = {0: 4, 1: 5, 2: 8, 3: 11}[LV]; sides = {0: 4, 1: 5, 2: 7, 3: 9}[LV]
    axis = (AXE_END - AXE_HEAD) / np.linalg.norm(AXE_END - AXE_HEAD)
    for sxp in np.arange(760, 1445, step):
        tipy = np.interp(sxp, prof[:, 0], prof[:, 1])
        for o in lat:
            o2 = o + rng.uniform(-0.12, 0.12); sx_ = sxp + rng.uniform(-0.35, 0.35) * step
            width = np.interp(sx_, [740, 900, 1160, 1300, 1420], [60, 110, 150, 100, 50])
            xy = np.array([[o2 * width * S, (sx_ - MID) * S]])
            base = Sd.drop(body_sdf, xy)[0] if hasattr(Sd, 'drop') else None
            base = np.asarray(base, np.float32).reshape(-1)[:3]
            # keep clear of the hatchet's blade and the wound
            if np.linalg.norm((base - AXE_IN) / r(46, 50, 60)) < 1: continue
            if sx_ > 1300 and abs(o2) > 0.45: continue                      # leave the ears clear
            L = max(0.05, ((GROUND - tipy) * S - base[2])) * (1 - 0.5 * abs(o2) ** 1.3) * rng.uniform(0.8, 1.1)
            d = np.array([o2 * 0.9, -0.85, 1.0]) + rng.normal(0, 0.12, 3); d /= np.linalg.norm(d)
            r0 = (11 + 13 * min(1, L / 0.3)) * S * rng.uniform(0.85, 1.15)
            V, F = G.horn(base - d * 0.02, d, L + 0.02, r0, [0, -1, 0], 0.25, seg, sides, tipR=0.0012, power=1.1)
            t = np.clip((V - base) @ d / (L + 0.02), 0, 1)[:, None]
            c = mix(DARK * 0.85, mix(DARK, BROWN, 0.6), t) * rng.uniform(0.85, 1.15)
            M.add(V, F, np.clip(c, 0, 1), 8)

    # ---- the tail's tuft: dark locks hanging from its end ---------------------------------------------------------
    trng = np.random.default_rng(9)
    for k in range({0: 7, 1: 10, 2: 16, 3: 22}[LV]):
        a = p(0, 640, 470) + np.array([trng.normal(0, 0.012), trng.normal(0, 0.012), trng.uniform(-0.05, 0.02)])
        d = np.array([trng.normal(0, 0.25), -0.25 + trng.normal(0, 0.15), -1.0]); d /= np.linalg.norm(d)
        L = trng.uniform(0.11, 0.17)
        V, F = G.horn(a, d, L, trng.uniform(9, 13) * S, [0, -1, 0], 0.2, max(4, SEG), max(5, SIDES - 2), tipR=0.001, power=1.1)
        t = np.clip((V - a) @ d / L, 0, 1)[:, None]
        M.add(V, F, np.clip(mix(DARK, DARK * 0.7, t) * trng.uniform(0.85, 1.1), 0, 1), 8)

    # ---- tusks: long and ivory, out from the mouth's corners, curving up and in --------------------------------------
    log('tusks')
    for s in (1, -1):
        base = p(s * 50, 1500, 508)
        d = np.array([s * 0.55, 0.5, 0.67]); d /= np.linalg.norm(d)
        V, F = G.horn(base, d, 0.25, 15 * S, [-s, 0.1, 0.5], 0.32, max(6, SEG + 4), max(8, SIDES + 2), tipR=0.002, power=0.75)
        t = np.clip(np.linalg.norm(V - base, axis=1) / 0.25, 0, 1)[:, None]
        M.add(V, F, np.clip(mix(IVORY * 0.78, IVORY, t), 0, 1), 5)

    # ---- the Thornsplitter Hatchet -----------------------------------------------------------------------------------
    log('hatchet')
    hs = {0: 8, 1: 10, 2: 14, 3: 20}[LV]
    # the blade: a broad wedge from the haft's head down into the shoulder, its face turned to his side, green-lit
    down = (AXE_IN - AXE_HEAD); bl = np.linalg.norm(down); down /= bl
    face = np.cross(down, axis); face /= np.linalg.norm(face)
    across = np.cross(face, down)
    R = np.stack([down, across, face], 1)
    c0 = AXE_HEAD + down * bl * 0.55 + across * 0.02
    V, F = G.ellipsoid(c0, (bl * 0.7, 46 * S, 5 * S), hs, hs * 2, rot=R)
    loc = (V - c0) @ R
    edge = np.clip(loc[:, 0] / (bl * 0.62), -1, 1)
    glow = np.clip((fbm(V * 30, 2.0) - 0.35) * 4, 0, 1) * np.clip(edge + 0.6, 0, 1)
    cc = mix(STEEL, GLOW, glow[:, None])
    cc = mix(cc, BLOOD, np.clip(edge - 0.6, 0, 1)[:, None] * 2)
    M.add(V, F, np.clip(cc, 0, 1), 8)
    # the haft, from just behind the head (the poll) to its end
    n = {0: 6, 1: 8, 2: 14, 3: 22}[LV]
    hp = np.linspace(AXE_HEAD - axis * 0.035, AXE_END, n)
    V, F = tube(hp, np.full(n, 8.5 * S), max(6, SIDES))
    u = np.clip((V - AXE_HEAD) @ axis / np.linalg.norm(AXE_END - AXE_HEAD), 0, 1)
    cc = np.tile(WOOD, (len(V), 1))
    cord = (u > 0.18) & (u < 0.58)
    cc[cord] = CORD * (0.85 + 0.3 * (np.sin(u[cord] * 160) > 0))[:, None]
    cc[(u > 0.62) & (u < 0.92)] = WOOD * 0.75
    M.add(V, F, cc, 8)
    for u0, rr, wl in [(0.0, 12, 0.03), (0.13, 11, 0.02), (0.97, 11.5, 0.025)]:            # bone wraps, the end cap
        a = AXE_HEAD + axis * (u0 * np.linalg.norm(AXE_END - AXE_HEAD))
        V, F = tube(np.array([a - axis * wl / 2, a + axis * wl / 2]), np.array([rr * S, rr * S]), max(6, SIDES))
        M.add(V, F, BONE if u0 < 0.5 else WOOD * 0.6, 8)
    # two green leaves hanging from a thong near the end
    tie = AXE_HEAD + axis * 0.9 * np.linalg.norm(AXE_END - AXE_HEAD)
    for k, (dx, dy) in enumerate([(-0.01, 0.02), (0.012, 0.035)]):
        c = tie + np.array([dx, dy, -0.075 - 0.01 * k])
        V, F = G.ellipsoid(c, (5 * S, 9 * S, 34 * S), hs, hs, rot=None)
        M.add(V, F, LEAF * (1 - 0.1 * k), 8)
        V, F = tube(np.array([tie, c + np.array([0, 0, 0.07])]), np.array([1.5 * S, 1.5 * S]), 5)
        M.add(V, F, WOOD, 8)

    # ---- eyes: small and amber, a dark pupil ------------------------------------------------------------------------
    for e in EYES:
        V, F = G.ellipsoid(e, r(8, 7, 6.5), {0: 6, 1: 8, 2: 12, 3: 16}[LV], {0: 10, 1: 14, 2: 20, 3: 28}[LV])
        cc = np.tile([0.72, 0.40, 0.12], (len(V), 1))
        pupil = np.linalg.norm((V - e - np.array([np.sign(e[0]) * 0.008, 0.008, 0])) / r(5, 5, 5), axis=1) < 1
        cc[pupil] = [0.05, 0.03, 0.02]; cc[(V[:, 2] > e[2] + 0.009)] *= 0.6
        M.add(V, F, cc, 7)
    return M
