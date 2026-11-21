# The glowcap, rabble of the woods (One Foe's lane, November 20). python3.12 kit/py/sculpt.py foes/glowcap <level>
#
# From Chris's sheet (art-in/3d/sheets/sheet-glowcap.webp), 0.8 m to the top of its cap: a domed maroon cap crusted
# with tan warts, tipped a little forward; glowing green gills underneath (radial ridges, real shapes); a small cream
# face with two dark slit eyes; a leafy collar; a plump pear-shaped body, fibrous, studded with olive knobs; leaf-tuft
# arms; stubby brown boots. x right, y forward (the face), z up.
import math
import numpy as np

def build(K):
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, project, vnoise = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep, S.project, S.vnoise
    M = K.Mesh()
    CAPC = np.array([0.30, 0.13, 0.17]); CAPD = np.array([0.19, 0.07, 0.10]); WART = np.array([0.72, 0.62, 0.45])
    GILL = np.array([0.55, 0.95, 0.20]); SKIN = np.array([0.72, 0.60, 0.42]); FIBRE = np.array([0.45, 0.35, 0.22])
    KNOB = np.array([0.50, 0.46, 0.22]); BOOT = np.array([0.30, 0.20, 0.13]); LEAF = np.array([0.58, 0.52, 0.28])
    TILT = 0.12                                                 # the cap tips forward (side view)
    def to_cap(P):
        """into the cap's frame: centred under its crown, tipped forward"""
        Q = P - np.array([0, 0.03, 0.53], np.float32)
        c, s = math.cos(TILT), math.sin(TILT)
        return np.stack([Q[:, 0], c * Q[:, 1] - s * Q[:, 2], s * Q[:, 1] + c * Q[:, 2]], 1).astype(np.float32)
    rr = np.random.default_rng(41)
    # the warts: clusters of lumps on the cap's upper half (front, side and back views: about 16)
    warts = []
    for i in range(17):
        th = rr.random() * 2 * math.pi; el = rr.uniform(0.25, 1.35)
        warts.append((th, el, 0.032 + 0.016 * rr.random()))

    def cap_sdf(P, lv=None):
        Q = to_cap(P)
        dome = ell(Q, (0, 0, 0.045), (0.285, 0.29, 0.225))                                # widest a little above the rim
        dome = smax(dome, -(Q[:, 2] + 0.035), 0.035)                                     # the rim rolls under
        dome = smax(dome, -ell(Q, (0, 0, -0.045), (0.235, 0.24, 0.07)), 0.025)           # hollow under it, for the gills
        rim = cap(Q, (0, 0, 0.02), (0, 0, 0.03), 0.0, 0.0)
        d = dome
        for th, el, r in warts:                                                         # the warts, lumpy clusters
            dirn = np.array([math.cos(th) * math.cos(el - 0.2) * 0.98, math.sin(th) * math.cos(el - 0.2), math.sin(el - 0.2) * 1.0])
            c = np.array([0, 0, 0.045]) + dirn * np.array([0.285, 0.29, 0.225])
            lump = ell(Q, c, (r, r, r * 0.55))
            for k in range(5):                                                           # popcorn: lumps round a lump
                off = np.array([math.cos(k * 1.3 + th), math.sin(k * 1.3 + th), 0.2 * math.sin(k * 2.7)]) * r * (0.7 + 0.15 * (k % 2))
                lump = smin(lump, ell(Q, c + off, (r * 0.55, r * 0.55, r * 0.42)), r * 0.35)
            d = smin(d, lump, 0.012)
        if (LV if lv is None else lv) >= 2: d = d - 0.0025 * (fbm(P * 1.0, 40.0, 2) - 0.5)   # the cap's skin, a little rough
        return d

    def gill_sdf(P):
        Q = to_cap(P)
        th = np.arctan2(Q[:, 1], Q[:, 0]); r = np.hypot(Q[:, 0], Q[:, 1])
        d = ell(Q, (0, 0, -0.03), (0.25, 0.255, 0.035))                                  # bulging below the rim (front view)
        d = np.maximum(d, Q[:, 2] - 0.0)
        d = np.maximum(d, -(r - 0.075))                                                  # round the stem
        n = 56
        d = d + 0.012 * (1 - np.abs(np.sin(th * n / 2))) ** 0.5 * sstep(0.08, 0.2, r)    # radial ridges
        return d

    def body_sdf(P, lv=None):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        d = ell(P, (0, 0, 0.19), (0.19, 0.14, 0.16))                                     # the pear-shaped body
        d = smin(d, ell(P, (0, 0, 0.29), (0.14, 0.11, 0.1)), 0.06)
        d = smin(d, ell(P, (0, 0.035, 0.415), (0.135, 0.115, 0.075)), 0.04)              # the head, under the cap, wide
        d = smin(d, ell(P, (0, 0.02, 0.355), (0.14, 0.115, 0.06)), 0.04)                 # no neck: the face runs into the body
        for s in (1, -1):
            d = smin(d, cap(P, (s * 0.065, 0, 0.1), (s * 0.068, 0.0, 0.04), 0.045, 0.04), 0.03)   # legs into the boots
            boot = ell(P, (s * 0.068, 0.02, 0.035), (0.048, 0.07, 0.04))
            d = smin(d, boot, 0.02)
        # knobs on the body (front, side, back views)
        for i in range(14):
            th = (i * 2.39996) % (2 * math.pi); zz = 0.1 + 0.2 * ((i * 0.618) % 1)
            c = np.array([math.cos(th) * 0.18, math.sin(th) * 0.135, zz])
            rad = 0.016 + 0.01 * ((i * 0.37) % 1)
            d = smin(d, ell(P, c, (rad, rad, rad)), 0.008)
        th = np.arctan2(y, x); body_band = sstep(0.33, 0.27, z) * sstep(0.05, 0.08, z)
        # big folds in a V down the front (the sheet's chevrons), then fine fibres at level 2+
        chev = np.abs(np.sin((z + 0.5 * np.abs(x)) * 42 + 3 * fbm(P, 3.0, 2)))
        d = d + 0.0025 * (1 - chev) ** 2 * body_band
        if (LV if lv is None else lv) >= 2:
            fib = np.abs(np.sin(th * 46 + 4 * fbm(P, 3.0, 2))) ** 0.5
            d = d + 0.0018 * (1 - fib) * body_band
        if (LV if lv is None else lv) >= 3: d = d - 0.0012 * (vnoise(P, 120.0) - 0.5)
        return np.maximum(d, -z)

    log('cap, gills, body')
    Vc, Fc = S.mc(cap_sdf, VOX, K.lo, K.hi)
    Qc = to_cap(Vc)
    mott = fbm(Vc, 9.0)[:, None]
    col = mix(CAPC, CAPD, np.clip(mott * 1.6 - 0.4, 0, 1))
    wart = np.clip((cap_sdf(Vc, 1) - (ell(Qc, (0, 0, 0.045), (0.285, 0.29, 0.225)))) * -60, 0, 1)[:, None]
    col = mix(col, WART * (0.85 + 0.3 * fbm(Vc, 30.0)[:, None]), wart)
    under = (Qc[:, 2] < -0.045)[:, None] & (np.hypot(Qc[:, 0], Qc[:, 1]) < 0.24)[:, None]
    col = np.where(under, mix(GILL * 0.5, CAPD, 0.5), col)
    M.add(Vc, Fc, np.clip(col, 0, 1), 0)
    Vg, Fg = S.mc(gill_sdf, VOX * 1.4, K.lo, K.hi)
    Qg = to_cap(Vg); rg = np.hypot(Qg[:, 0], Qg[:, 1])
    M.add(Vg, Fg, np.clip(GILL[None] * (0.6 + 0.4 * sstep(0.08, 0.22, rg))[:, None], 0, 1), 7)
    Vb, Fb = S.mc(body_sdf, VOX, K.lo, K.hi)
    z = Vb[:, 2]
    chev = np.abs(np.sin((z + 0.5 * np.abs(Vb[:, 0])) * 42 + 3 * fbm(Vb, 3.0, 2)))[:, None]
    col = mix(SKIN, FIBRE, np.clip(fbm(Vb * [3, 3, 0.6], 8.0)[:, None] * 1.3 - 0.35 + 0.8 * (1 - chev) ** 2, 0, 1))
    head = (z > 0.35)[:, None]
    col = np.where(head, SKIN * (0.95 + 0.1 * fbm(Vb, 20.0)[:, None]), col)
    boot = (z < 0.075)[:, None]
    col = np.where(boot, BOOT * (0.9 + 0.2 * fbm(Vb, 25.0)[:, None]), col)
    knob = (body_sdf(Vb, 1) < -0.0) & False
    # the knobs: olive (where the body stands proud of its plain shape)
    plain = smin(ell(Vb, (0, 0, 0.19), (0.19, 0.14, 0.16)), ell(Vb, (0, 0, 0.29), (0.14, 0.11, 0.1)), 0.06)
    kn = np.clip(-plain * 80 - 0.2, 0, 1)[:, None] * (z > 0.08)[:, None] * (z < 0.34)[:, None]
    col = mix(col, KNOB, kn)
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)
    log('cap', len(Fc), 'gills', len(Fg), 'body', len(Fb))

    # ---- leaves: the collar round its neck and the leaf-tuft arms (single blades, both sides) --------------------
    def leaf(base, d, up, length, width, col, curl=0.25, kind=1):
        d = np.asarray(d, float); d /= np.linalg.norm(d); up = np.asarray(up, float); up -= d * (up @ d); up /= np.linalg.norm(up)
        side = np.cross(up, d)
        nu, nv = {0: 5, 1: 7, 2: 12, 3: 18}.get(LV, 18), {0: 3, 1: 5, 2: 7, 3: 9}.get(LV, 9)
        U, Vv = np.meshgrid(np.linspace(0, 1, nu), np.linspace(-1, 1, nv), indexing='ij')
        w = np.sin(np.pi * U ** 0.75) ** 0.8 * (1 + (0.12 * np.sin(U * 26) if LV >= 2 else 0) * (np.abs(Vv) > 0.75))
        hgt = -curl * length * Vv ** 2 * 0.3 + 0.1 * length * U ** 2 - (0.002 * np.exp(-(Vv / 0.15) ** 2) if LV >= 2 else 0)
        def surf(off):
            return (base + np.einsum('ij,k->ijk', U * length, d) + np.einsum('ij,k->ijk', Vv * w * width * 0.5, side)
                    + np.einsum('ij,k->ijk', hgt + off, up)).reshape(-1, 3)
        top, bot = surf(0.0015), surf(-0.0015)
        F = []
        for i in range(nu - 1):
            for j in range(nv - 1):
                a = i * nv + j; F += [(a, a + nv, a + nv + 1), (a, a + nv + 1, a + 1)]
        F = np.array(F); n0 = len(top)
        Ucol = np.concatenate([U.ravel()] * 2)[:, None]
        C = np.clip(np.asarray(col) * (0.75 + 0.35 * Ucol), 0, 1)
        if col is LEAF: C = mix(C, np.array([0.30, 0.20, 0.12]), np.clip((Ucol - 0.7) * 3, 0, 1))   # browned tips (sheet)
        M.add(np.vstack([top, bot]), np.vstack([F, F[:, ::-1] + n0]), C, kind)
    for s in (1, -1):                                               # the eyes: dark ovals, a little glossy
        Ve, Fe = G.ellipsoid([s * 0.048, 0.146, 0.425], [0.011, 0.006, 0.02], 10, 14)
        M.add(Ve, Fe, np.array([0.05, 0.04, 0.035]), 8)
    lr = np.random.default_rng(43)
    for i in range(30):                                             # the collar: a layered ruff of leaves, out and down
        a = i / 30 * 2 * math.pi + lr.random() * 0.1
        layer = i % 3
        ring = 0.095 + 0.015 * layer
        base = np.array([math.cos(a) * ring * 1.1, math.sin(a) * ring * 0.95 + 0.012, 0.37 - 0.012 * layer])
        out = np.array([math.cos(a), math.sin(a) * 0.9, -0.7 - 0.3 * layer])
        leaf(base, out, [0, 0, 1], 0.11 + 0.025 * lr.random(), 0.085, mix(LEAF, LEAF * 0.72, lr.random()), curl=0.35)
    for s in (1, -1):                                               # the arms: a tuft of leaves each side
        for k in range(5):
            base = np.array([s * 0.16, 0.012 * (k - 2), 0.31 - 0.008 * k])
            d = np.array([s * (0.35 + 0.07 * k), 0.08 * (k - 2), -1.0])
            leaf(base, d, [s * 0.3, 1, 0.2], 0.16 + 0.02 * (k % 2), 0.06, LEAF, curl=0.35)
    return M
