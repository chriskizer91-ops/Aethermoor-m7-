# The boglurcher, rabble of the marsh (One Foe's lane, November 21). python3.12 kit/py/sculpt.py foes/boglurcher <level>
#
# From Chris's sheet (art-in/3d/sheets/sheet-boglurcher.webp; 511 px = 1 m to the tip of the tall cattail): a slumped
# mound of bog 0.65 m high and about 1.05 m across at the foot, nearly round from above, built of clotted lumps of
# dark mud; moss draped over its top and hanging down in dripping strands; two amber eyes in dark hollows, to its left
# of the middle of its front (0.42 and 0.34 m up); stones round its foot; two cattails (to 0.91 and 1.0 m) and a curled
# green sprout out of its top. x right, y forward (the eyes), z up.
import math
import numpy as np

S_PX = 1.0 / 511                                             # metres per sheet pixel
# the mound's half-width at each height, from the front and side views (they agree: it's round from above)
PROF_Z = [0.00, 0.06, 0.14, 0.22, 0.30, 0.37, 0.45, 0.53, 0.60, 0.645]
PROF_R = [0.50, 0.51, 0.48, 0.44, 0.40, 0.37, 0.32, 0.25, 0.14, 0.02]
EYES = [(-0.13, 0.417, 0.034), (-0.265, 0.34, 0.030)]       # x, z, radius; y is found on the surface
CATTAILS = [((0.19, -0.16), 0.91, 0.20), ((0.02, -0.06), 1.0, 0.21)]   # (x, y), tip height, head length
SPROUT = (-0.19, 0.12)
SY_F, SY_B = 0.86, 0.94                                     # front to back it is a little shallower, most in front
def sy(y): return np.where(y > 0, SY_F, SY_B)

def build(K):
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, vnoise = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep, S.vnoise
    M = K.Mesh()
    MUD = np.array([0.14, 0.09, 0.055]); MUD2 = np.array([0.32, 0.21, 0.11]); WET = np.array([0.07, 0.045, 0.03])
    MOSS = np.array([0.36, 0.38, 0.13]); MOSS2 = np.array([0.58, 0.56, 0.22]); MOSSD = np.array([0.17, 0.19, 0.07])   # olive, as the sheet
    STONE = np.array([0.33, 0.25, 0.18]); STALK = np.array([0.30, 0.36, 0.14]); HEAD = np.array([0.40, 0.23, 0.11])
    SPR = np.array([0.32, 0.50, 0.12]); AMBER = np.array([0.92, 0.48, 0.04])
    rr = np.random.default_rng(73)

    def prof(z): return np.interp(z, PROF_Z, PROF_R)
    # the clods: lumps of mud heaped over the mound, bigger low down (the sheet's layered, slumped heap)
    clods = []
    for i in range(190):
        z = rr.uniform(0.02, 0.62) ** 1.05; th = rr.uniform(0, 2 * math.pi)
        r0 = prof(z); rad = 0.045 + 0.07 * rr.random() * (1.15 - z)
        c = np.array([math.cos(th) * (r0 - rad * 0.8), math.sin(th) * (r0 - rad * 0.8) * float(sy(math.sin(th))), z])
        # slabs, wider than tall, lying along the slope: the heap's layers
        if any(abs(c[0] - ex) < 0.09 and abs(c[2] - ez) < 0.08 and c[1] > 0 for ex, ez, _ in EYES): continue   # keep the eyes clear
        clods.append((c, (rad * 1.3, rad * 1.3, rad * 0.75)))

    def mound_sdf(P, lv=None):
        L = LV if lv is None else lv
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        rho = np.hypot(x, y / sy(y))
        zc = np.clip(z, 0, 0.645)
        d = (rho - prof(zc) * 0.97) * 0.85                                        # the heap's profile (a little under-
        d = np.where(z > 0.645, np.hypot(rho, z - 0.645) - 0.02, d)              # estimated, safe for marching)
        for c, r in clods:
            d = smin(d, ell(P, c, r), 0.025)
        # mud flows: slumped folds running down the sides, wobbling
        th = np.arctan2(y, x)
        flow = np.abs(np.sin(th * 9 + 2.5 * fbm(P, 2.5, 2) + 3 * z))
        d = d + 0.004 * (1 - flow) ** 2 * sstep(0.62, 0.3, z)
        if L >= 2: d = d - 0.017 * (fbm(P, 7.0, 3) - 0.5) - 0.004 * (fbm(P, 20.0, 2) - 0.5)   # clotted, lumpy
        if L >= 3: d = d - 0.002 * (vnoise(P, 60.0) - 0.5)                        # grit
        # the eyes' hollows
        for ex, ez, er in EYES:
            ey = math.sqrt(max(0.0, prof(ez) ** 2 - ex * ex)) * SY_F + 0.03
            d = smax(d, -ell(P, (ex, ey, ez), (er * 1.9, er * 1.4, er * 1.3)), 0.02)
        return np.maximum(d, -z)

    log('mound')
    BAND = 0.04 if LV >= 2 else None                                              # the narrow band on fine levels
    Vb, Fb = S.mc(mound_sdf, VOX, K.lo, K.hi, band=BAND)
    z = Vb[:, 2]
    n1 = fbm(Vb, 6.0)[:, None]
    proud = np.clip((np.hypot(Vb[:, 0], Vb[:, 1] / sy(Vb[:, 1])) - prof(z) * 0.93) / 0.05, 0, 1)[:, None]   # what stands out of the heap
    col = mix(MUD, MUD2, np.clip(n1 * 1.1 - 0.55 + proud * 0.6, 0, 1))
    clodlit = np.clip((fbm(Vb * [1, 1, 3], 14.0)[:, None] - 0.45) * 2, 0, 1)        # wet streaks
    col = mix(col, WET, clodlit * 0.5)
    for ex, ez, er in EYES:                                                       # the hollows are dark
        ey = math.sqrt(max(0.0, prof(ez) ** 2 - ex * ex)) * SY_F
        dd = np.linalg.norm((Vb - [ex, ey, ez]) / [er * 2.2, er * 1.8, er * 1.6], axis=1)[:, None]
        col = mix(col, np.array([0.04, 0.03, 0.02]), np.clip(1.4 - dd, 0, 1))
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)
    log('mound tris', len(Fb))

    # ---- the moss: a skin over the top, hanging down the sides in dripping strands -----------------------------
    def moss_edge(P):
        """the height the moss hangs down to, round the mound: strands of different lengths"""
        th = np.arctan2(P[:, 1], P[:, 0])
        n = fbm(np.stack([np.cos(th) * 2, np.sin(th) * 2, P[:, 2] * 0], 1), 3.0, 2)
        # broad drapes (the sheet's), each ending in a few ragged points
        strands = (np.maximum(0, np.sin(th * 9 + 4 * n)) ** 1.5 * 0.15 + np.maximum(0, np.sin(th * 17 + 6 * n)) ** 2 * 0.07
                   + np.maximum(0, np.sin(th * 41 + 9 * n)) ** 4 * 0.035)
        front = np.exp(-((th - math.pi / 2) / 0.9) ** 2)                          # less over the eyes, more each side
        return 0.47 - strands - 0.06 * n + 0.06 * front * np.exp(-((th - 1.95) / 0.35) ** 2) * 3
    thick = max(0.007, VOX * 1.25)
    def moss_sdf(P):
        d0 = mound_sdf(P, 1)
        shell = np.abs(d0 - thick * 0.6) - thick
        if LV >= 2: shell = shell - 0.006 * (fbm(P, 30.0, 2) - 0.45) - 0.003 * (fbm(P * [1, 1, 0.3], 60.0, 2) - 0.5)   # tufty, stringy
        # on top it grows in clumps with mud between; the hanging strands below the top stay whole
        edge = moss_edge(P)
        patch = np.where(P[:, 2] > edge + 0.07, 0.33 - fbm(P, 7.0, 2), -1.0)
        shell = shell - thick * 0.8 * (fbm(P, 12.0, 2) - 0.5)                        # thicker and thinner clumps
        low = 0.56 - fbm(P * [1, 1, 1.6], 5.0, 2)                                   # rarer patches lower down the heap (the sheet's back and sides)
        for ex, ez, er in EYES:                                                     # never over the eyes
            low = np.maximum(low, 0.3 - np.hypot(P[:, 0] - ex, (P[:, 2] - ez) * 1.3) * 3 - 0.3 * (P[:, 1] < 0))
        below = np.minimum(edge - P[:, 2], np.maximum(low * 0.05, 0.16 + 0.04 * fbm(P, 9.0, 2) - P[:, 2]))
        return np.maximum(np.maximum(shell, below), patch * 0.05)
    log('moss')
    lo_m = np.array([K.lo[0], K.lo[1], 0.12]); Vm, Fm = S.mc(moss_sdf, VOX, lo_m, K.hi, band=BAND)
    m = fbm(Vm, 10.0)[:, None]
    hang = np.clip((0.5 - Vm[:, 2]) / 0.2, 0, 1)[:, None]                          # the strands' ends yellow-green
    colm = mix(mix(MOSSD, MOSS, np.clip(m * 1.6 - 0.2, 0, 1)), MOSS2, np.clip(hang * 0.8 + (m - 0.6), 0, 1))
    M.add(Vm, Fm, np.clip(colm, 0, 1), 1)
    log('moss tris', len(Fm))

    # ---- the stones round its foot ----------------------------------------------------------------------------
    nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (16, 24))
    for i in range(15):
        th = i / 15 * 2 * math.pi + rr.uniform(-0.15, 0.15); rad = 0.045 + 0.04 * rr.random()
        R0 = prof(0.03) + rad * 0.15
        c = np.array([math.cos(th) * R0, math.sin(th) * R0, rad * 0.45])
        a = rr.uniform(0, math.pi); rot = np.array([[math.cos(a), -math.sin(a), 0], [math.sin(a), math.cos(a), 0], [0, 0, 1]])
        V, F = G.ellipsoid(c, (rad * 1.3, rad, rad * 0.7), nt, npp, rot)
        V = V + (fbm(V, 25.0)[:, None] - 0.5) * rad * 0.35 * (V - c) / (np.linalg.norm(V - c, axis=1)[:, None] + 1e-9)
        M.add(V, F, np.clip(STONE * (0.75 + 0.5 * fbm(V, 30.0)[:, None]), 0, 1), 8)

    # ---- the eyes: amber, a dark round pupil, looking out of the hollows --------------------------------------
    for ex, ez, er in EYES:
        ey = math.sqrt(max(0.0, prof(ez) ** 2 - ex * ex)) * SY_F + 0.012
        c = np.array([ex, ey, ez])
        V, F = G.ellipsoid(c, (er * 1.2, er * 0.8, er * 0.75), nt + 4, npp + 6)
        fwd = np.array([ex * 0.25, 1.0, 0.0]); fwd /= np.linalg.norm(fwd)
        u = ((V - c) / np.array([er * 1.2, er * 0.8, er * 0.75])) @ fwd
        ce = mix(AMBER * 0.35, AMBER, np.clip(u * 1.3 - 0.1, 0, 1)[:, None])        # a darker rim round the amber (second pass)
        lat = np.abs((V - c)[:, 0] * fwd[1] - (V - c)[:, 1] * fwd[0]) / er           # across the eye
        ce = np.where(((u > 0.6) & (lat < 0.2))[:, None], np.array([0.06, 0.03, 0.01]), ce)     # the slit pupil
        M.add(V, F, ce, 7)

    # ---- the cattails and the sprout --------------------------------------------------------------------------
    def surface_z(x, y):
        rho = math.hypot(x, y / float(sy(y))); return float(np.interp(-rho, [-r for r in PROF_R], PROF_Z))
    for (cx, cy), tip, hl in CATTAILS:
        z0 = surface_z(cx, cy) - 0.04
        lean = np.array([cx * 0.25, cy * 0.25, 0])
        top = np.array([cx, cy, tip]) + lean
        path = np.array([np.array([cx, cy, z0]) + (top - [cx, cy, z0]) * t + np.array([0.012 * math.sin(t * 3), 0, 0]) for t in np.linspace(0, 1, 2 + SEG)])
        hb = tip - hl - 0.03                                                        # head from here to the spike
        stalk_end = int(np.searchsorted(path[:, 2], hb)) + 1
        V, F = G.tube(path[:stalk_end], np.full(stalk_end, 0.011), SIDES)
        M.add(V, F, STALK * (0.9 + 0.2 * fbm(V, 40.0)[:, None]), 3)
        hc = np.array([cx, cy, hb + hl / 2]) + lean * ((hb + hl / 2 - z0) / (tip - z0))
        V, F = G.ellipsoid(hc, (0.033, 0.033, hl / 2 + 0.015), nt + 4, npp + 4)
        V = V + (fbm(V, 60.0)[:, None] - 0.5) * 0.004 * (V - hc) / (np.linalg.norm(V - hc, axis=1)[:, None] + 1e-9)
        M.add(V, F, np.clip(HEAD * (0.8 + 0.4 * fbm(V, 50.0)[:, None]), 0, 1), 8)
        sp = np.array([hc, hc + [0, 0, hl / 2 + 0.05]])
        V, F = G.tube(G.resample(sp, 6), np.linspace(0.006, 0.0015, 6), max(6, SIDES // 2))
        M.add(V, F, STALK * 0.8, 3)
    sx, sy_ = SPROUT; z0 = surface_z(sx, sy_) - 0.03
    ts = np.linspace(0, 1, 30)
    # a thick shoot rising and hooking over at the top (front view: it bends toward its left)
    ang = np.clip((ts - 0.45) / 0.55, 0, 1) * 2.6
    curl = np.array([sx, sy_, z0]) + np.stack([-0.06 * (1 - np.cos(ang)) - 0.01 * ts, 0.01 * ts, 0.2 * np.minimum(ts, 0.45) / 0.45 + 0.06 * np.sin(ang)], 1)
    V, F = G.tube(curl, 0.026 * (1 - 0.8 * ts) + 0.003, SIDES)
    M.add(V, F, np.tile(SPR, (len(V), 1)) * (0.85 + 0.3 * fbm(V, 30.0)[:, None]), 3)
    return M
