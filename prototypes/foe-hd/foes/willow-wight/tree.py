# The walking willow, built from settings (One Foe's lane, November 21): the willow-wight (sculpt.py here) and
# Grandfather Willow (foes/grandfather-willow/sculpt.py) both build with build_tree(K, C). The defaults below are the
# willow-wight's; C overrides any of them, and C['extra'](K, M, C) adds a foe's own pieces (a bow, lanterns).
#
# The willow-wight, veteran of Willowmurk (One Foe's lane, November 21). python3.12 kit/py/sculpt.py foes/willow-wight <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-willow-wight.webp; 761 px = 1.8 m): a willow walking on splayed root feet,
# its trunk ridged and grooved, a scowling face under the crown (eyes 1.28 m up, 0.07 m either side, glowing yellow-
# green, weeping), two branch arms (its right hanging to a clawed hand at 0.57 m, its left reaching out and forward
# with bluebells hanging from the hand), and a crown of willow fronds 1.16 m across hanging to half a metre, parted
# over the face. x right, y forward (the face), z up.
#
# The arms and every frond are pieces of their own (the arms grow out of the trunk, their roots hidden in it), so each
# can move whole without stretching the bark (rig.py).
import math
import numpy as np

DEFAULTS = dict(
    H=1.8, FACE_Z=1.28, EYE_R=0.024, EYE_X=0.07, FACE_Y=0.15,
    ARMS={
        'r': [(0.12, 0.04, 1.12), (0.32, 0.18, 0.93), (0.43, 0.30, 0.71), (0.46, 0.34, 0.59)],
        'l': [(-0.12, 0.05, 1.08), (-0.38, 0.22, 0.95), (-0.55, 0.38, 0.75), (-0.58, 0.42, 0.66)],
    },
    ARM_R=(0.065, 0.05, 0.035), BELLS=True,
    CROWN_Z=1.62,
    TRUNK_Z=[0.0, 0.12, 0.3, 0.5, 0.75, 1.0, 1.15, 1.35, 1.5, 1.62],
    TRUNK_R=[0.36, 0.28, 0.22, 0.185, 0.16, 0.15, 0.155, 0.165, 0.12, 0.05],
    ROOTS=7, ROOT_REACH=(0.46, 0.1), ROOT_R=(0.10, 0.07, 0.025),
    BOUGHS=8, BOUGH_OUT=(0.28, 0.1), BOUGH_R=(0.07, 0.045, 0.022),
    FACE_S=1.0, HOLLOW=None,
    DOME_C=(0.0, 0.0, 1.42), DOME_R=(0.52, 0.47, 0.4), NFR=102, SPACE=0.03, LEAF_L=0.075, LEAF_W=0.013,
    Z_END=(0.42, 0.75), FRONT_SHORT=0.25, RIBBON_W=(0.042, 0.012),
    MOSS_Z=0.6, MOSS_AMT=0.7, MOSS_T=0.5, extra=None,
    GNARL=0.0, TWIST=4.0,           # (November 24) lumps and burls in the trunk; how far the bark's ridges wind
)

def build_tree(K, C0):
    C = dict(DEFAULTS); C.update(C0)
    H, FACE_Z, CROWN_Z, ARMS = C['H'], C['FACE_Z'], C['CROWN_Z'], C['ARMS']
    EYES = [(C['EYE_X'], FACE_Z, C['EYE_R']), (-C['EYE_X'], FACE_Z, C['EYE_R'])]
    FY = C['FACE_Y']; FS = C['FACE_S']
    def trunk_r(z): return np.interp(z, C['TRUNK_Z'], C['TRUNK_R'])
    ZTOP = C['TRUNK_Z'][-1]
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, vnoise = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep, S.vnoise
    M = K.Mesh()
    BARK = np.array([0.40, 0.30, 0.19]); BARK2 = np.array([0.55, 0.44, 0.28]); BARKD = np.array([0.18, 0.13, 0.08])   # (November 24: lighter, as the sheet)
    MOSSC = np.array([0.30, 0.34, 0.12]); LEAF = np.array([0.34, 0.50, 0.11]); LEAF2 = np.array([0.62, 0.70, 0.18])
    LEAFD = np.array([0.12, 0.24, 0.05]); STRAND = np.array([0.30, 0.30, 0.12]); GLOW = np.array([0.80, 1.0, 0.30])
    BELL = np.array([0.35, 0.55, 1.0])
    rr = np.random.default_rng(91)
    BAND = 0.04 if LV >= 2 else None

    # the roots: splayed feet, the front pair forward (the sheet's)
    roots = []
    for i in range(C['ROOTS']):
        a = i / C['ROOTS'] * 2 * math.pi + 0.25 + rr.uniform(-0.15, 0.15)
        reach = C['ROOT_REACH'][0] + C['ROOT_REACH'][1] * rr.random()
        roots.append((a, reach))
    # the crown's boughs: thick branches out of the top of the head, arching over
    boughs = []
    for i in range(C['BOUGHS']):
        a = i / C['BOUGHS'] * 2 * math.pi + rr.uniform(-0.2, 0.2)
        boughs.append((a, C['BOUGH_OUT'][0] + C['BOUGH_OUT'][1] * rr.random(), CROWN_Z + (0.12 + 0.06 * rr.random()) * H / 1.8))

    def trunk_sdf(P, lv=None):
        L = LV if lv is None else lv
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        zc = np.clip(z, 0, ZTOP)
        lean = 0.02 * np.sin(zc * 2.0)
        rho = np.hypot(x - lean, (y - 0.01) / 0.92)
        d = (rho - trunk_r(zc)) * 0.85
        d = np.where(z > ZTOP, np.hypot(rho, z - ZTOP) - C['TRUNK_R'][-1], d)
        for a, reach in roots:                                                     # root feet
            c0 = (math.cos(a) * 0.08 * H / 1.8, math.sin(a) * 0.08 * H / 1.8, 0.32 * H / 1.8)
            c1 = (math.cos(a) * reach * 0.55, math.sin(a) * reach * 0.55, 0.08 * H / 1.8)
            c2 = (math.cos(a) * reach, math.sin(a) * reach, 0.02)
            RR = C['ROOT_R']
            d = smin(d, cap(P, c0, c1, RR[0], RR[1]), 0.08 * H / 1.8)
            d = smin(d, cap(P, c1, c2, RR[1], RR[2]), 0.04 * H / 1.8)
        for a, out, top in boughs:                                                 # the crown's boughs
            c0 = (0, 0, CROWN_Z - 0.05)
            c1 = (math.cos(a) * out * 0.6, math.sin(a) * out * 0.55, top)
            c2 = (math.cos(a) * out, math.sin(a) * out * 0.9, top - 0.06)
            BR = C['BOUGH_R']
            d = smin(d, cap(P, c0, c1, BR[0], BR[1]), 0.05 * H / 1.8)
            d = smin(d, cap(P, c1, c2, BR[1], BR[2]), 0.03 * H / 1.8)
        # the face: a heavy scowling brow, a long nose ridge, cheeks; the eye sockets under the brow
        for s in (1, -1):
            d = smin(d, ell(P, (s * 0.075 * FS, FY - 0.02 * FS, FACE_Z + 0.045 * FS), np.array([0.07, 0.04, 0.03]) * FS), 0.03 * FS)        # brow
            d = smin(d, ell(P, (s * 0.085 * FS, FY - 0.025 * FS, FACE_Z - 0.07 * FS), np.array([0.05, 0.035, 0.05]) * FS), 0.03 * FS)       # cheek
        d = smin(d, cap(P, (0, FY - 0.01 * FS, FACE_Z + 0.02 * FS), (0, FY + 0.02 * FS, FACE_Z - 0.11 * FS), 0.025 * FS, 0.035 * FS), 0.03 * FS) # nose
        for ex, ez, er in EYES:
            d = smax(d, -ell(P, (ex, FY, ez), (er * 1.7, er * 1.2, er * 1.1)), 0.012 * FS)
        d = smax(d, -ell(P, (0, FY + 0.01 * FS, FACE_Z - 0.19 * FS), np.array([0.05, 0.03, 0.012]) * FS), 0.01 * FS)                # a mouth crease
        if C['HOLLOW']:                                                           # a hollow in the trunk
            hc, hr = C['HOLLOW']
            d = smax(d, -ell(P, hc, hr), 0.03)
        # bark: long ridges and grooves running up, winding a little; knots
        th = np.arctan2(y, x)
        groove = np.abs(np.sin(th * 14 + 6 * fbm(P * [1, 1, 0.3], 2.5, 2) + z * C['TWIST']))
        face = np.exp(-((th - math.pi / 2) / 0.6) ** 2) * np.exp(-((z - FACE_Z) / (0.2 * FS)) ** 2)
        d = d + 0.016 * H / 1.8 * (1 - groove) ** 2 * (1 - face) * sstep(ZTOP + 0.13, ZTOP - 0.22, z)
        if C['GNARL']:                                                            # gnarled: lumps, burls
            d = d - C['GNARL'] * (fbm(P * [1, 1, 0.6], 3.0, 3) - 0.5) * sstep(ZTOP + 0.1, ZTOP - 0.3, z) * (1 - face)
            d = d - C['GNARL'] * 0.6 * np.clip(vnoise(P, 6.0) - 0.72, 0, 1) * 4 * (1 - face)
        if L >= 2: d = d - 0.006 * (fbm(P * [1, 1, 0.35], 9.0, 3) - 0.5)
        if L >= 3: d = d - 0.0015 * (vnoise(P * [1, 1, 0.4], 70.0) - 0.5)
        return np.maximum(d, -z)

    log('trunk')
    Vt, Ft = S.mc(trunk_sdf, VOX, K.lo, K.hi, band=BAND)
    th = np.arctan2(Vt[:, 1], Vt[:, 0]); z = Vt[:, 2]
    groove = np.abs(np.sin(th * 14 + 6 * fbm(Vt * [1, 1, 0.3], 2.5, 2) + z * C['TWIST']))[:, None]
    n1 = fbm(Vt, 5.0)[:, None]
    col = mix(BARKD, BARK, np.clip(groove * 1.3 - 0.1, 0, 1))
    col = mix(col, BARK2, np.clip(n1 * 1.5 - 0.6, 0, 1) * groove)
    mossy = np.clip((fbm(Vt, 4.0)[:, None] - C['MOSS_T']) * 3, 0, 1) * (z < C['MOSS_Z'])[:, None]       # moss on the trunk
    col = mix(col, MOSSC, mossy * C['MOSS_AMT'])
    col = mix(col, MOSSC * 0.85, np.clip(1 - groove * 1.6, 0, 1) * np.clip(fbm(Vt + 7, 6.0)[:, None] * 1.8 - 0.45, 0, 1) * 0.75)   # moss in the grooves, all the way up
    for ex, ez, er in EYES:                                                       # dark sockets, wet tear streaks
        dd = np.linalg.norm((Vt - [ex, FY, ez]) / [er * 2.0, er * 1.6, er * 1.6], axis=1)[:, None]
        col = mix(col, np.array([0.03, 0.03, 0.02]), np.clip(1.5 - dd, 0, 1))
        streak = np.exp(-((Vt[:, 0] - ex) / 0.008) ** 2) * (Vt[:, 2] < ez) * (Vt[:, 2] > ez - 0.22 * FS) * (Vt[:, 1] > FY - 0.07)
        col = mix(col, np.array([0.30, 0.38, 0.12]), streak[:, None] * 0.8)
    if C['HOLLOW']:                                                               # the hollow is dark inside
        hc, hr = C['HOLLOW']
        q = np.linalg.norm((Vt - hc) / np.array(hr), axis=1)[:, None]
        col = mix(col, np.array([0.03, 0.025, 0.02]), np.clip((1.12 - q) * 6, 0, 1))
    M.add(Vt, Ft, np.clip(col, 0, 1), 0)
    log('trunk tris', len(Ft))

    # ---- the eyes and their tears ---------------------------------------------------------------------------------
    nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (14, 22))
    for ex, ez, er in EYES:
        V, F = G.ellipsoid((ex, FY - 0.015, ez - 0.004), (er * 1.15, er * 0.7, er * 0.7), nt, npp)
        M.add(V, F, np.tile(GLOW, (len(V), 1)), 7)
        for k in range(2):                                                        # drops hanging on the streaks
            V, F = G.ellipsoid((ex + 0.004 * k, FY, ez - (0.08 + 0.09 * k) * FS), (0.006, 0.006, 0.009), 6, 8)
            M.add(V, F, np.tile(GLOW * 0.9, (len(V), 1)), 7)

    # ---- the arms: branches out of the trunk, each its own piece, with twig fingers -------------------------------
    for side, pts in ARMS.items():
        sx = 1 if side == 'r' else -1
        sh, el, wr, hd = [np.array(p) for p in pts]
        def arm_sdf(P, lv=None, sh=sh, el=el, wr=wr, hd=hd, sx=sx):
            L = LV if lv is None else lv
            AR = C['ARM_R']; ks = AR[0] / 0.065
            d = cap(P, sh - (el - sh) * 0.25, el, AR[0], AR[1])                    # the root end sinks into the trunk
            d = smin(d, cap(P, el, wr, AR[1], AR[2]), 0.03 * ks)
            d = smin(d, ell(P, (el + wr) / 2 + [0, 0.0, 0.02 * ks], np.array([0.04, 0.035, 0.04]) * ks), 0.02 * ks)     # a burl at the elbow
            for k in range(4):                                                   # twig fingers, curled
                a = (k - 1.5) * 0.5
                f0 = wr; dirn = np.array([math.sin(a) * 0.5 * sx + (hd - wr)[0] * 4, 0.6 * math.cos(a) * 0.3 + 0.2, -1.0])
                dirn /= np.linalg.norm(dirn)
                f1 = f0 + dirn * 0.09 * ks; f2 = f1 + (dirn + [0, 0.5, 0.3]) / np.linalg.norm(dirn + [0, 0.5, 0.3]) * 0.06 * ks
                d = smin(d, cap(P, f0, f1, 0.018 * ks, 0.011 * ks), 0.012 * ks)
                d = smin(d, cap(P, f1, f2, 0.011 * ks, 0.003 * ks), 0.006 * ks)
            if L >= 2: d = d - 0.004 * (fbm(P * [1, 1, 0.4], 14.0, 2) - 0.5)
            return d
        lo = np.minimum.reduce([sh, el, wr, hd]) - 0.2; hi = np.maximum.reduce([sh, el, wr, hd]) + 0.2
        Va, Fa = S.mc(arm_sdf, VOX, lo, hi)
        ga = np.abs(np.sin(np.arctan2(Va[:, 1] - el[1], Va[:, 0] - el[0]) * 7 + fbm(Va, 3.0) * 4))[:, None]
        M.add(Va, Fa, np.clip(mix(BARKD, BARK2, ga * 0.9), 0, 1), 1)
        if side == 'l' and C['BELLS']:                                           # bluebells hanging from his left hand
            stem = np.array([hd + [0, 0.01, -0.02], hd + [0.02, 0.03, -0.12], hd + [0.01, 0.05, -0.22]])
            sp = G.resample(stem, 12)
            V, F = G.tube(sp, np.full(len(sp), 0.004), max(5, SIDES // 2)); M.add(V, F, np.tile(STRAND, (len(V), 1)), 3)
            for k in range(5):
                c = sp[3 + 2 * k] + [0.02 * ((-1) ** k), 0.01, -0.025]
                V, F = G.ellipsoid(c, (0.016, 0.016, 0.022), nt, npp)
                V[:, 2] -= 0.006 * np.clip((V[:, 2] - c[2]) / 0.022 + 1, 0, 1)    # bell-shaped, flaring
                M.add(V, F, np.tile(BELL, (len(V), 1)), 7)

    # ---- the fronds: strands draped over a dome of crown, then hanging; leaves along them, parted over the face ----
    # At the light level (0) each frond is a zigzag ribbon whose lobes are where the leaves are (the bake paints the
    # leaves onto it); at the other levels every leaf is sculpted, in the ribbon's own plane.
    log('fronds')
    VS, FS, CS = [], [], []; n0 = 0
    def add(V, F, C):
        nonlocal n0
        VS.append(V); FS.append(F + n0); CS.append(C); n0 += len(V)
    fr = np.random.default_rng(17)
    DOME_C, DOME_R = np.array(C['DOME_C']), np.array(C['DOME_R'])
    NFR, SPACE = C['NFR'], C['SPACE']
    leaf_seg = {1: 2, 2: 3}.get(LV, 5)
    # (November 24) the fronds hang in clumps of three, close together, as the sheet paints them: thick cascades with
    # gaps between
    strands = []
    for i in range(NFR // 3):
        ac = fr.uniform(0, 2 * math.pi); p0 = fr.uniform(0.0, 1.1); ze = fr.uniform(*C['Z_END'])
        for j in range(3):
            strands.append((ac + (j - 1) * 0.055 + fr.normal(0, 0.012), np.clip(p0 + fr.uniform(-0.12, 0.12), 0, 1.2), ze + fr.uniform(-0.06, 0.06)))
    for a, phi0, z_end in strands:
        da = ((a - math.pi / 2 + math.pi) % (2 * math.pi)) - math.pi             # the face is at a = pi/2
        if abs(da) < 0.38: a += (0.38 - abs(da) + 0.1) * (1 if da >= 0 else -1)   # parted over the face
        z_end = z_end + (C['FRONT_SHORT'] if abs(da) < 0.9 else 0.0)              # shorter in front, by the face
        for sd, pts in ARMS.items():                                              # parted round the arms: stop above them
            aa = math.atan2(pts[1][1], pts[1][0])
            if abs(((a - aa + math.pi) % (2 * math.pi)) - math.pi) < 0.45: z_end = max(z_end, pts[0][2] + 0.02)
        out = np.array([math.cos(a), math.sin(a), 0.0])
        # over the dome to its rim, then straight down with a little flare
        phis = np.linspace(phi0, math.pi / 2, 6)
        dome = DOME_C + np.stack([np.sin(phis) * math.cos(a) * DOME_R[0], np.sin(phis) * math.sin(a) * DOME_R[1], np.cos(phis) * DOME_R[2]], 1) * 1.04
        rim = dome[-1]; drop = rim[2] - z_end
        nd = max(4, int(drop / 0.06))
        tt_ = np.linspace(0, 1, nd + 1)[1:]
        hang = rim + out[None] * (0.06 * tt_ ** 1.5)[:, None] - np.array([0, 0, 1.0])[None] * (drop * tt_)[:, None]
        path = G.resample(np.concatenate([dome, hang]), 40)
        tt, Nn, Bb = G.frames(path)
        # in the ribbon's plane: along the strand and across it, facing outward
        L_ = np.r_[0, np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))]
        nl = int(L_[-1] / SPACE)
        def at(sv):
            k = int(np.clip(np.searchsorted(L_, sv) - 1, 0, len(path) - 2)); f = (sv - L_[k]) / max(L_[k + 1] - L_[k], 1e-9)
            p = path[k] * (1 - f) + path[k + 1] * f
            tan = tt[k]; nrm = np.cross(tan, out + [0, 0, 1e-3]); nrm /= np.linalg.norm(nrm) + 1e-9   # across, in plane
            face = np.cross(nrm, tan)
            return p, tan, nrm, face
        if LV == 0:
            rows = []
            for j in range(nl + 1):
                sv = min(L_[-1], (j + 0.5) * SPACE)
                p, tan, side, face = at(sv)
                sgn = 1 if j % 2 else -1
                RW = C['RIBBON_W']; wl = RW[0] if sgn > 0 else RW[1]; wr = RW[1] if sgn > 0 else RW[0]
                rows.append((p + side * wl + tan * 0.02 * (sgn > 0), p - side * wr + tan * 0.02 * (sgn < 0), face))
            Vr = np.array([v for r in rows for v in (r[0], r[1])]); nr = len(rows)
            Fr = []
            for q in range(nr - 1):
                a0, b0, a1, b1 = 2 * q, 2 * q + 1, 2 * q + 2, 2 * q + 3
                Fr += [(a0, b0, b1), (a0, b1, a1)]
            Fr = np.array(Fr)
            fc = np.array([r[2] for r in rows]).repeat(2, 0)
            Vr2 = np.concatenate([Vr + fc * 0.0008, Vr - fc * 0.0008])
            add(Vr2, np.concatenate([Fr, Fr[:, ::-1] + len(Vr)]), np.tile(LEAF, (len(Vr2), 1)))
        else:
            V, F = G.tube(path, np.full(len(path), 0.003), 4); add(V, F, np.tile(STRAND, (len(V), 1)))
            for j in range(nl + 1):
                sv = min(L_[-1], (j + 0.5) * SPACE)
                p, tan, side, face = at(sv)
                sgn = 1 if j % 2 else -1
                ll = C['LEAF_L'] * (0.85 + 0.3 * fr.random()); lw = C['LEAF_W']
                d = tan * 0.72 + side * sgn * 0.7; d /= np.linalg.norm(d)
                s_ = np.linspace(0, 1, leaf_seg + 1)
                w = lw * np.sin(s_ * math.pi) ** 0.7
                spine = p + d[None] * (ll * s_)[:, None] + (0.1 * ll * s_ ** 2)[:, None] * face
                acr = np.cross(d, face)
                top_ = np.concatenate([spine + acr * w[:, None], spine - acr * w[:, None]])
                m = leaf_seg + 1
                Fl = np.array([f for q in range(leaf_seg) for f in ((q, q + 1, m + q + 1), (q, m + q + 1, m + q))])
                Vl = np.concatenate([top_ + face * 0.0007, top_ - face * 0.0007])
                g = fr.random(); outer = 0.5 + 0.5 * np.clip((p[2] - z_end) / 0.6, 0, 1)    # lighter, yellower outside and up
                cl = mix(mix(LEAFD, LEAF, 0.25 + 0.75 * g), LEAF2, (0.25 + 0.45 * g ** 2) * outer)
                add(Vl, np.concatenate([Fl, Fl[:, ::-1] + 2 * m]), np.tile(np.clip(cl, 0, 1), (len(Vl), 1)))
        if fr.random() < 0.25:                                                   # a drop of the weeping at the tip
            V, F = G.ellipsoid(path[-1] + [0, 0, -0.012], (0.005, 0.005, 0.008), 5, 7); add(V, F, np.tile(GLOW * 0.85, (len(V), 1)))
    Vf = np.concatenate(VS); Ff = np.concatenate(FS); Cf = np.concatenate(CS)
    M.add(Vf, Ff, Cf, 1)
    log('fronds tris', len(Ff))
    if C['extra']: C['extra'](K, M, C)
    return M
