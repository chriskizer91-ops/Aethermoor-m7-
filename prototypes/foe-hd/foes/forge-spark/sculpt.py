# The forge-spark, rabble of the Deeps (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/forge-spark <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-forge-spark.webp; 0.5 m from the ring to the topmost spark): a ball of
# ember 0.2 m across, its centre 0.24 m up, in a shell of dark slag held by rusted iron bands (three round it, four
# over it, riveted, a boss at the back), glowing orange through three teardrop slits in front and through its cracks;
# a crown of jagged slag spikes with a flame and four-pointed sparks above; two lumps of cracked, glowing slag floating
# at its sides (its fists); a molten ring under it, with bits of slag. x right, y forward, z up.
import math
import numpy as np

C = np.array([0.0, 0.0, 0.24]); R = 0.1
FISTS = {'r': np.array([0.155, 0.02, 0.2]), 'l': np.array([-0.155, 0.02, 0.2])}
RING = np.array([0.0, 0.0, 0.045])

def build(K):
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, vnoise = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep, S.vnoise
    M = K.Mesh()
    SLAG = np.array([0.16, 0.10, 0.07]); SLAG2 = np.array([0.30, 0.17, 0.10]); RUST = np.array([0.36, 0.20, 0.11])
    IRON = np.array([0.22, 0.15, 0.11]); EMBER = np.array([1.0, 0.55, 0.12]); HOT = np.array([1.0, 0.85, 0.40])
    rr = np.random.default_rng(29)
    nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (16, 24))

    def cracks(P, f, w):
        """a web of thin cracks: three sets of warped lines crossing; below zero inside a crack. f lines a metre, w
        the crack's width as a share of the spacing"""
        warp = 2.5 * (fbm(P, f / 6, 2) - 0.5)
        dirs = ((0.8, 0.5, 0.3), (-0.4, 0.85, 0.35), (0.3, -0.2, 0.93))
        c = np.min(np.stack([np.abs(np.sin((P @ np.array(d)) * f + warp * (1 + k))) for k, d in enumerate(dirs)], 1), 1)
        return c - w
    # ---- the shell: slag round the ember, slits in front, cracks, a crown of spikes on top --------------------------
    spikes = [(rr.uniform(0, 2 * math.pi), rr.uniform(0.3, 0.7)) for _ in range(6)][:3]                # three small, round the one big (second pass)
    def shell_sdf(P, lv=None):
        L = LV if lv is None else lv
        d = np.abs(np.linalg.norm(P - C, axis=1) - (R - 0.006)) - 0.008               # a shell 16 mm thick
        d = d - 0.006 * (fbm(P, 18.0, 2) - 0.5)
        for a, el in spikes:                                                         # the crown
            dirn = np.array([math.cos(a) * math.sin(el), math.sin(a) * math.sin(el), math.cos(el)])
            base = C + dirn * (R - 0.01); tip = C + dirn * (R + 0.04 + 0.03 * (1 - el)) + [0, 0, 0.02]
            d = smin(d, cap(P, base, tip, 0.022, 0.006), 0.012)
        for j in range(6):                                                            # the tall middle spike, twisted like a flame (sheet)
            t0, t1 = j / 6, (j + 1) / 6
            p0 = C + [0.012 * math.sin(t0 * 5), -0.006 * math.sin(t0 * 3), R - 0.01 + 0.10 * t0]
            p1 = C + [0.012 * math.sin(t1 * 5), -0.006 * math.sin(t1 * 3), R - 0.01 + 0.10 * t1]
            d = smin(d, cap(P, p0, p1, 0.03 * (1 - t0) ** 0.9 + 0.003, 0.03 * (1 - t1) ** 0.9 + 0.003), 0.01)
        for s in (-1, 0, 1):                                                          # three teardrop slits in front
            c = C + [s * 0.04, R * 0.9, -0.005 + 0.008 * (s == 0)]
            d = smax(d, -cap(P, c + [0, 0, -0.03], c + [0, 0, 0.025], 0.017, 0.005, scale=(1, 3, 1)), 0.004)
        d = smax(d, -np.maximum(np.maximum(cracks(P, 50.0, 0.2), -d - 0.02), P[:, 2] - C[2] - R * 0.75), 0.002)   # (not through the crown)           # cracks through it, the light pouring out
        Q = P - C                                                                     # windows between the cage's bands, the ember showing (sheet)
        band = np.minimum(np.minimum(np.abs(Q[:, 2] + 0.035), np.abs(Q[:, 2] - 0.03)), np.minimum(np.abs(Q[:, 0]), np.abs(Q[:, 1])))
        win = band - 0.024 - 0.012 * (fbm(P, 30.0, 2) - 0.5)
        win = np.minimum(win, R * 0.72 - Q[:, 2])                                     # not under the crown
        d = smax(d, win, 0.004)                                                       # keep the shell only near the bands
        if L >= 3: d = d - 0.0008 * (vnoise(P, 140.0) - 0.5)
        return d
    log('shell')
    V, F = S.mc(shell_sdf, VOX, C - 0.2, C + 0.22)
    hot = np.clip(1 - (cracks(V, 55.0, 0.0)[:, None]) / 0.3, 0, 1)                  # glowing near the cracks
    col = mix(mix(SLAG, SLAG2, fbm(V, 25.0)[:, None]), EMBER * 0.6, hot * 0.6)
    M.add(V, F, np.clip(col, 0, 1), 0)
    # the ember inside, glowing through the slits and cracks
    V, F = G.ellipsoid(C, (R - 0.012,) * 3, nt + 6, npp + 8)
    M.add(V, F, mix(EMBER, HOT, np.clip(fbm(V, 14.0)[:, None] * 1.6 - 0.4, 0, 1)), 7)          # molten, orange with hot yellow (sheet)

    # ---- the cage: rusted iron bands round it and over it, riveted, a boss at the back --------------------------
    def cage_sdf(P, lv=None):
        L = LV if lv is None else lv
        Q = P - C; r = np.linalg.norm(Q, axis=1)
        shell = np.abs(r - (R + 0.007)) - 0.008 - 0.004 * (fbm(P, 15.0, 2) - 0.5)   # a band, thick and rough
        d = 1e9 * np.ones(len(P))
        for zc in (-0.035, 0.03):                                                    # round it
            d = np.minimum(d, np.maximum(shell, np.abs(Q[:, 2] - zc + 0.006 * np.sin(np.arctan2(Q[:, 1], Q[:, 0]) * 3)) - 0.011))
        for k in range(2):                                                           # over it
            a = k * math.pi / 2
            nrm = np.array([math.cos(a), math.sin(a), 0])
            d = np.minimum(d, np.maximum(shell, np.abs(Q @ nrm) - 0.008))
        d = np.maximum(d, Q[:, 2] - R * 0.8)                                         # not over the crown
        d = smin(d, ell(P, C + [0, -R - 0.006, 0], (0.022, 0.012, 0.022)), 0.004)    # the boss at the back
        if L >= 2: d = d - 0.0015 * (fbm(P, 40.0, 2) - 0.5)                          # pitted
        return d
    log('cage')
    V, F = S.mc(cage_sdf, VOX, C - 0.14, C + 0.14)
    M.add(V, F, np.clip(mix(IRON, RUST, fbm(V, 20.0)[:, None] * 1.3), 0, 1), 4)
    for zc in (-0.045, 0.045):                                                       # rivets where the bands cross
        for k in range(8):
            a = k * math.pi / 4 + math.pi / 8
            el = math.asin(zc / (R + 0.012))
            p = C + np.array([math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el)]) * (R + 0.013)
            V, F = G.ellipsoid(p, (0.005,) * 3, 6, 8); M.add(V, F, np.tile(IRON * 1.2, (len(V), 1)), 8)

    # ---- the flame on its crown, and the sparks above ----------------------------------------------------------
    t = np.linspace(0, 1, 14)
    sp = np.stack([0.008 * np.sin(t * 5), 0.004 * np.sin(t * 3), C[2] + R + 0.075 + 0.05 * t], 1)    # above the taller spike
    V, F = G.tube(sp, 0.016 * (1 - t) ** 0.8 + 0.001, SIDES); M.add(V, F, np.tile(HOT, (len(V), 1)), 7)
    for (x, z, s) in [(0.0, 0.47, 0.016), (-0.025, 0.43, 0.007), (0.02, 0.44, 0.006), (0.0, 0.415, 0.01)]:
        for ax in ((1, 0, 0), (0, 0, 1)):                                             # a four-pointed star
            a = np.array(ax, float)
            V, F = G.ellipsoid((x, 0.01, z), tuple(s if v else s * 0.2 for v in a), 6, 8)
            M.add(V, F, np.tile(HOT, (len(V), 1)), 7)

    # ---- its fists: lumps of slag, cracked, glowing inside -----------------------------------------------------
    for side, c in FISTS.items():
        sx = 1 if side == 'r' else -1
        lumps = [(c + rr.uniform(-0.022, 0.022, 3) * [1, 1, 0.8], rr.uniform(0.026, 0.034)) for _ in range(7)]
        def fist_sdf(P, lv=None, lumps=lumps):
            d = 1e9 * np.ones(len(P))
            for lc, lr in lumps: d = smin(d, ell(P, lc, (lr, lr * 0.9, lr * 0.85)), 0.012)
            d = d - 0.004 * (fbm(P, 30.0, 2) - 0.5)
            return smax(d, -np.maximum(cracks(P, 80.0, 0.14), -d - 0.012), 0.002)
        V, F = S.mc(fist_sdf, VOX, c - 0.08, c + 0.08)
        hot = np.clip(1 - (cracks(V, 80.0, 0.0)[:, None]) / 0.3, 0, 1)
        M.add(V, F, np.clip(mix(mix(SLAG, SLAG2, fbm(V, 25.0)[:, None]), EMBER * 0.7, hot * 0.7), 0, 1), 0)
        V, F = G.ellipsoid(c, (0.028, 0.026, 0.024), nt, npp); M.add(V, F, np.tile(EMBER, (len(V), 1)), 7)

    # ---- the molten ring under it, and bits of slag ------------------------------------------------------------
    def ring_sdf(P):
        Q = P - RING
        rho = np.hypot(Q[:, 0], Q[:, 1])
        d = np.hypot(rho - 0.075, Q[:, 2] / 1.3) - 0.017
        d = d - 0.003 * (fbm(P, 30.0, 2) - 0.5)
        return smax(d, -np.maximum(cracks(P, 70.0, 0.14), -d - 0.008), 0.002)
    V, F = S.mc(ring_sdf, VOX, RING - [0.11, 0.11, 0.04], RING + [0.11, 0.11, 0.04])
    hot = np.clip(1 - (cracks(V, 70.0, 0.0)[:, None]) / 0.3, 0, 1)
    M.add(V, F, np.clip(mix(mix(SLAG, SLAG2, fbm(V, 25.0)[:, None]), EMBER * 0.7, hot * 0.7), 0, 1), 8)
    tt = np.linspace(0, 2 * math.pi, 40)
    core = np.stack([RING[0] + np.cos(tt) * 0.075, RING[1] + np.sin(tt) * 0.075, np.full(40, RING[2])], 1)
    V, F = G.tube(core, np.full(40, 0.012), SIDES); M.add(V, F, np.tile(EMBER, (len(V), 1)), 7)
    for (x, z) in [(0.1, 0.075), (-0.11, 0.07), (0.06, 0.1)]:
        V, F = G.ellipsoid((x, 0.03, z), (0.012, 0.01, 0.009), nt, npp)
        V += (fbm(V, 60.0)[:, None] - 0.5) * 0.004
        M.add(V, F, np.tile(SLAG2, (len(V), 1)), 8)
    return M
