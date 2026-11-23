# The Blackwater Leviathan, Champion of the Gloomfen (One Foe's lane, November 23).
#   python3.12 kit/py/sculpt.py foes/blackwater-leviathan <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-blackwater-leviathan.webp; 2.2 m from the water to the pearl on his
# head): a sea-serpent rising out of the black water, his neck in a slow S, two coils of his body humped out of the
# water at his sides. Dark teal scales with pale edges, pale green plates down his throat and chest; a dragon's head
# with a jaw that opens, orange eyes, a frill of fins behind the head, a ridge of spines down his neck, and a great
# pearl set in his crown. An iron collar round his neck, riveted, a chain hanging from it into the water; a harpoon
# in his chest with red rags; barnacles in clusters. Every piece but his neck moves whole. x right, y forward, z up.
import math
import numpy as np

# the spine, from under the water to the back of his head: (x, y, z, radius)
SPINE = [(0.0, -0.3, -0.12, 0.43), (0.0, -0.12, 0.28, 0.4), (0.0, 0.02, 0.62, 0.35), (0.0, 0.0, 0.95, 0.3),
         (0.0, -0.1, 1.25, 0.26), (0.0, -0.1, 1.5, 0.23), (0.0, 0.0, 1.71, 0.2), (0.0, 0.14, 1.83, 0.19)]
PTS = np.array([p[:3] for p in SPINE]); RAD = np.array([p[3] for p in SPINE])
HEAD = np.array([0.0, 0.34, 1.86]); SNOUT = np.array([0.0, 0.78, 1.8]); PEARL = np.array([0.0, 0.3, 2.04])
HINGE = np.array([0.0, 0.26, 1.74])                     # where the jaw turns
COLLAR_Z = 1.38
WOUND = np.array([0.18, 0.2, 0.92]); HARPOON_OUT = np.array([0.62, 0.58, 1.22])   # the harpoon: in his chest, out
COILS = {'r_coil': ((0.6, -0.22), 0.5), 'l_coil': ((-0.6, -0.55), -0.7)}   # (centre x, y), the arch's turn

def along(P):
    """nearest place on the spine: distance to the surface, arclength, the point, the tangent"""
    best = np.full(len(P), 1e9); s = np.zeros(len(P)); C = np.zeros_like(P); T = np.zeros_like(P); acc = 0.0
    for i in range(len(PTS) - 1):
        a, b = PTS[i], PTS[i + 1]; ab = b - a; L = float(np.linalg.norm(ab))
        t = np.clip(((P - a) @ ab) / (L * L), 0, 1); c = a + t[:, None] * ab
        d = np.linalg.norm(P - c, axis=1) - (RAD[i] + (RAD[i + 1] - RAD[i]) * t)
        m = d < best; best[m] = d[m]; s[m] = acc + t[m] * L; C[m] = c[m]; T[m] = ab / L; acc += L
    return best, s, C, T

def build(K):
    S, G, LV, VOX, SIDES, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.log
    smin, smax, ell, cap, fbm, mix, vnoise, sstep = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.vnoise, S.sstep
    M = K.Mesh()
    TEAL = np.array([0.08, 0.2, 0.2]); TEAL2 = np.array([0.14, 0.32, 0.3]); EDGE = np.array([0.3, 0.46, 0.4])
    PALE = np.array([0.42, 0.52, 0.36]); PALE2 = np.array([0.3, 0.4, 0.27]); IRON = np.array([0.2, 0.2, 0.22])
    RUST = np.array([0.38, 0.24, 0.14]); GOLD = np.array([0.85, 0.6, 0.2]); RED = np.array([0.55, 0.06, 0.05])
    BARN = np.array([0.72, 0.7, 0.6]); EYE = np.array([1.0, 0.55, 0.08]); FOAM = np.array([0.55, 0.7, 0.7])
    band = 0.04 if LV >= 2 else None
    nt, npp = {0: (5, 8), 1: (6, 10), 2: (8, 12)}.get(LV, (10, 16))
    rr = np.random.default_rng(31)

    def scales(P, ang, s, L):
        """overlapping scales in rows round him: each a rounded plate, its lower edge lifted"""
        u = s / 0.1; v = ang * 0.3 / 0.1
        a, b = (u + v) % 1.0, (u - v) % 1.0
        e = np.minimum(np.minimum(a, 1 - a), np.minimum(b, 1 - b))
        return 0.006 * sstep(0.0, 0.15, e) + 0.003 * (1 - a), e
    def frame(P, C, T):
        ref = np.array([0, -1.0, 0.25])                                              # his back (behind him)
        up = ref - T * (T @ ref)[:, None]; up /= np.maximum(np.linalg.norm(up, axis=1, keepdims=True), 1e-9)
        o = P - C; o /= np.maximum(np.linalg.norm(o, axis=1, keepdims=True), 1e-9)
        return np.arctan2(np.sum(o * np.cross(T, up), 1), np.sum(o * up, 1))       # 0 on his back, pi down his front
    def neck_sdf(P, lv=None):
        L = LV if lv is None else lv
        d, s, C, T = along(P)
        # the head: skull, a long snout, brow ridges, cheeks; the jaw cut away (it's its own piece)
        h = ell(P, HEAD, (0.22, 0.26, 0.17))
        h = smin(h, cap(P, HEAD + [0, 0.1, -0.02], SNOUT, 0.15, 0.07, scale=(1.15, 1, 0.8)), 0.06)
        for sx in (1, -1):
            h = smin(h, ell(P, HEAD + [sx * 0.11, 0.14, 0.11], (0.09, 0.14, 0.05)), 0.03)       # brow ridges
            h = smin(h, ell(P, HEAD + [sx * 0.15, -0.02, -0.04], (0.1, 0.14, 0.1)), 0.05)        # cheeks
            h = smax(h, -ell(P, HEAD + [sx * 0.17, 0.16, 0.06], (0.05, 0.045, 0.035)), 0.01)    # eye sockets
            h = smax(h, -ell(P, SNOUT + [sx * 0.035, -0.02, 0.03], (0.018, 0.02, 0.012)), 0.006)  # nostrils
        jaw = np.maximum(P[:, 2] - (HINGE[2] + 0.02 + (P[:, 1] - HINGE[1]) * -0.05), HINGE[1] - P[:, 1])
        h = smax(h, -jaw, 0.008)
        d = smin(d, h, 0.12)
        sc, _ = scales(P, frame(P, C, T), s, L); d = d - sc * (s > 0.15) * ((P[:, 2] < 1.68) | (P[:, 1] < 0.12))
        if L >= 2: d = d - 0.003 * (fbm(P, 12.0, 2) - 0.5)
        if L >= 3: d = d - 0.0008 * (vnoise(P, 110.0) - 0.5)
        return np.maximum(d, -P[:, 2] + 0.0)                                          # cut at the water
    def jaw_sdf(P, lv=None):
        L = LV if lv is None else lv
        j = cap(P, HINGE + [0, -0.04, 0.0], SNOUT + [0, -0.03, -0.07], 0.13, 0.05, scale=(1.2, 1, 0.6))
        j = smax(j, P[:, 2] - (HINGE[2] + 0.015 + (P[:, 1] - HINGE[1]) * -0.05), 0.008)
        if L >= 2: j = j - 0.002 * (fbm(P, 20.0, 2) - 0.5)
        return j
    def skin(V, jaw=False):
        _, s, C, T = along(V); ang = frame(V, C, T)
        sc, e = scales(V, ang, s, LV)
        col = mix(TEAL, TEAL2, fbm(V, 4.0)[:, None])
        col = mix(col, EDGE, sstep(0.08, 0.02, e)[:, None] * 0.0 + (sstep(0.25, 0.4, e) * 0.35)[:, None])
        col = col * (0.7 + 0.3 * sstep(0.0, 0.1, e))[:, None]
        front = np.clip((np.abs(ang) - 1.9) / 0.4, 0, 1) * (V[:, 2] < 1.68)            # pale plates down his throat
        ring = np.abs(np.sin(s * math.pi / 0.09))
        col = mix(col, mix(PALE2, PALE, ring[:, None] ** 0.3), front[:, None])
        hd = sstep(0.12, 0.22, V[:, 1]) * sstep(1.65, 1.75, V[:, 2])                    # his head darker, smoother
        col = mix(col, TEAL * 1.1, hd[:, None] * 0.6)
        if jaw: col = mix(TEAL, PALE2, 0.5)
        col = mix(col, FOAM, np.clip((0.06 - V[:, 2]) / 0.06, 0, 1)[:, None] * 0.6)     # wet at the waterline
        # blood from the harpoon wound
        wnd = np.clip(1 - np.linalg.norm((V - WOUND) / [0.08, 0.1, 0.25], axis=1) - 0.0 * (V[:, 2] > WOUND[2]), 0, 1)
        col = mix(col, RED, np.clip(wnd * 2, 0, 1)[:, None] * (V[:, 2] < WOUND[2] + 0.04)[:, None])
        return np.clip(col, 0, 1)
    log('neck and head')
    V, F = S.mc(neck_sdf, VOX, np.array([-0.5, -0.7, -0.01]), np.array([0.5, 0.9, 2.1]), band=band)
    M.add(V, F, skin(V), 0)
    log('jaw')
    V, F = S.mc(jaw_sdf, VOX, HINGE - [0.2, 0.15, 0.15], SNOUT + [0.2, 0.08, 0.05])
    M.add(V, F, skin(V, True), 0)
    # teeth along both jaws
    for jw in (False, True):
        for sx in (1, -1):
            for t in np.linspace(0.08, 0.95, 11):
                p = HINGE + (SNOUT - HINGE) * t; x = sx * (0.12 - 0.07 * t)
                L_ = 0.03 + 0.02 * (t > 0.85)
                base = np.array([x, p[1], HINGE[2] + 0.015 - (p[1] - HINGE[1]) * 0.05 + (-0.012 if jw else 0.012)])
                V, F = G.horn(base, [0, 0.15, 1.0 if jw else -1.0], L_, 0.009, [0, 1, 0], 0.2, seg=5, sides=6)
                M.add(V, F, np.tile(np.array([0.9, 0.86, 0.74]), (len(V), 1)), 2)
    for sx in (1, -1):                                                                # the eyes
        e = HEAD + [sx * 0.16, 0.16, 0.06]
        V, F = G.ellipsoid(e, (0.032, 0.035, 0.024), nt + 2, npp + 2); M.add(V, F, EYE, 7)
        V, F = G.ellipsoid(e + [sx * 0.022, 0.006, 0], (0.012, 0.008, 0.018), nt, npp); M.add(V, F, np.array([0.03, 0.02, 0.02]), 8)
    # the pearl, set in his crown
    V, F = G.ellipsoid(PEARL, (0.068, 0.068, 0.064), nt + 6, npp + 8)
    irid = 0.5 + 0.5 * np.sin((V - PEARL) @ np.array([20.0, 31.0, 9.0]))
    M.add(V, F, mix(np.array([0.95, 0.88, 0.95]), np.array([0.75, 0.9, 0.98]), irid[:, None]), 7)
    def thin(root, du, dv, length, width, th=0.006, shape_=lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 0.7, col=None, kind=1):
        root = np.asarray(root, float); du = np.asarray(du, float); du /= np.linalg.norm(du)
        dv = np.asarray(dv, float); dv = dv - du * (dv @ du); dv /= np.linalg.norm(dv); dn = np.cross(du, dv)
        def f(P, lv=None):
            Q = P - root; u = (Q @ du) / length; v = (Q @ dv) / width; n = Q @ dn
            rays = 0.4 * np.abs(np.sin(v * 7.0))
            return np.maximum(np.maximum(np.maximum(-u, u - 1) * length, (np.abs(v) - shape_(u)) * width), np.abs(n) - th * (1 + rays))
        ext = max(length, width) + 0.03
        V, F = S.mc(f, max(VOX, 0.004), root - ext, root + ext)
        Q = V - root; u = np.clip((Q @ du) / length, 0, 1)
        M.add(V, F, np.clip(mix(TEAL2, EDGE, u[:, None] * 0.6) if col is None else col(V), 0, 1), kind)
    log('frills, spines, crown')
    for sx in (1, -1):                                                                # the frill behind his head
        for j, (du, L_) in enumerate([([sx * 0.8, -0.6, 0.35], 0.26), ([sx * 0.9, -0.4, -0.1], 0.2), ([sx * 0.6, -0.7, 0.7], 0.22)]):
            thin(HEAD + [sx * 0.15, -0.12, 0.05 - 0.05 * j], du, [0, 0, 1], L_ * 1.4, 0.1)
        V, F = G.horn(HEAD + [sx * 0.09, 0.0, 0.14], [sx * 0.3, -0.8, 0.55], 0.16, 0.035, [0, -1, 0], 0.3, seg=8, sides=8)  # horns
        M.add(V, F, mix(TEAL2, EDGE, 0.6), 2)
    _, sP, CP, TP = along(PTS + 0.0)
    for zz in np.linspace(0.3, 1.72, 16):                                             # spines down the back of his neck
        i = np.argmin(np.abs(PTS[:, 2] - zz)); c = np.array([0, np.interp(zz, PTS[:, 2], PTS[:, 1]), zz])
        r_ = np.interp(zz, PTS[:, 2], RAD)
        base = c + [0, -r_ + 0.02, 0]
        V, F = G.horn(base, [0, -1, 0.5], 0.07 + 0.04 * (zz > 1.2), 0.03, [0, 0, 1], 0.4, seg=6, sides=7)
        M.add(V, F, mix(TEAL2, EDGE, 0.7), 2)
    # ---- the coils: arches of his body humped out of the water at his sides ----------------------------------------
    log('coils')
    for name, ((cx, cy), turn) in COILS.items():
        ax = np.array([math.cos(turn), math.sin(turn), 0.0])
        def coil(P, lv=None, cx=cx, cy=cy, ax=ax):
            L = LV if lv is None else lv
            Q = P - [cx, cy, 0.06]; along_ = Q @ ax; perp = Q - along_[:, None] * ax
            side = np.linalg.norm(perp[:, :2], axis=1) * np.sign(perp[:, :2] @ np.array([-ax[1], ax[0]]))
            rho = np.hypot(along_, Q[:, 2]); ang = np.arctan2(Q[:, 2], along_)
            d = np.hypot(rho - 0.26, side) - (0.36 - 0.04 * np.abs(np.cos(ang)))
            sc = 0.006 * sstep(0.0, 0.15, np.minimum(np.minimum((ang * 3 + side * 9) % 1, 1 - (ang * 3 + side * 9) % 1),
                                                         np.minimum((ang * 3 - side * 9) % 1, 1 - (ang * 3 - side * 9) % 1)))
            d = d - sc
            if L >= 2: d = d - 0.003 * (fbm(P, 12.0, 2) - 0.5)
            return np.maximum(d, -P[:, 2])
        c3 = np.array([cx, cy, 0.3])
        V, F = S.mc(coil, VOX, c3 - [0.8, 0.8, 0.32], c3 + [0.8, 0.8, 0.55], band=band)
        col = mix(TEAL, TEAL2, fbm(V, 4.0)[:, None]) * (0.8 + 0.25 * fbm(V, 30.0)[:, None])
        col = mix(col, FOAM, np.clip((0.06 - V[:, 2]) / 0.06, 0, 1)[:, None] * 0.6)
        M.add(V, F, np.clip(col, 0, 1), 0)
        for j in range(3):                                                             # barnacles on each coil
            a = rr.uniform(0.6, 2.5); p = np.array([cx, cy, 0.06]) + ax * math.cos(a) * 0.26 + [0, 0, math.sin(a) * 0.26]
            nrm = ax * math.cos(a) + [0, 0, math.sin(a)]
            for q in range(5):
                bp = p + nrm * 0.35 + rr.normal(0, 0.035, 3)
                V, F = G.horn(bp - nrm * 0.02, nrm + rr.normal(0, 0.2, 3), 0.035, 0.022, nrm, 0.0, seg=4, sides=7, tipR=0.01)
                M.add(V, F, mix(BARN, BARN * 0.7, fbm(V, 80.0)[:, None]), 8)
    # ---- the collar, its chain, the harpoon, barnacles on his neck ------------------------------------------------
    log('collar, chain, harpoon')
    cz = COLLAR_Z; cy = float(np.interp(cz, PTS[:, 2], PTS[:, 1])); cr = float(np.interp(cz, PTS[:, 2], RAD)) + 0.02
    def collar(P, lv=None):
        Q = P - [0, cy, cz]; rho = np.hypot(Q[:, 0], Q[:, 1])
        d = np.maximum(np.abs(rho - cr - 0.015) - 0.022, np.abs(Q[:, 2]) - 0.05)
        return d - 0.002 * (fbm(P, 40.0, 2) - 0.5)
    V, F = S.mc(collar, max(VOX, 0.004), np.array([-cr - 0.08, cy - cr - 0.08, cz - 0.08]), np.array([cr + 0.08, cy + cr + 0.08, cz + 0.08]))
    M.add(V, F, mix(IRON, RUST, fbm(V, 25.0)[:, None] * 0.8), 4)
    for k in range(18):                                                               # its rivets, two rows
        a = 2 * math.pi * k / 18
        for dz in (-0.025, 0.025):
            V, F = G.ellipsoid([math.cos(a) * (cr + 0.04), cy + math.sin(a) * (cr + 0.04), cz + dz], (0.012, 0.012, 0.012), nt, npp)
            M.add(V, F, np.array([0.45, 0.42, 0.38]), 8)
    # the chain: from a ring at his left side, down into the water
    top = np.array([-cr - 0.04, cy + 0.05, cz - 0.03]); bot = np.array([-0.5, 0.12, 0.02])
    n_ = 18
    for i in range(n_):
        t0 = i / n_; c = top + (bot - top) * t0 + [-0.08 * math.sin(math.pi * t0), 0.05 * math.sin(math.pi * t0), 0]
        dvec = (bot - top) / np.linalg.norm(bot - top)
        e1 = np.cross(dvec, [0, 1, 0] if i % 2 else [1, 0, 0]); e1 /= np.linalg.norm(e1)
        a = np.linspace(0, 2 * np.pi, 20)
        ring = c + np.outer(np.cos(a), dvec * 0.045) + np.outer(np.sin(a), e1 * 0.028)
        V, F = G.tube(ring, np.full(20, 0.011), max(6, SIDES)); M.add(V, F, mix(IRON, RUST, 0.4 + 0.4 * rr.random()), 8)
    # the harpoon in his chest: a shaft, a gold barbed head on its end, red rags tied round it
    out = HARPOON_OUT
    V, F = G.tube(np.array([WOUND - (out - WOUND) * 0.15, out]), np.array([0.018, 0.018]), max(8, SIDES))
    M.add(V, F, np.array([0.35, 0.22, 0.12]), 8)
    dvec = (out - WOUND) / np.linalg.norm(out - WOUND)
    V, F = G.horn(out - dvec * 0.02, dvec, 0.16, 0.04, [0, 0, 1], 0.0, seg=6, sides=6, tipR=0.002)
    M.add(V, F, GOLD, 8)
    for sx in (1, -1):
        bp = out + dvec * 0.03
        V, F = G.horn(bp, -dvec + np.cross(dvec, [0, 0, 1]) * sx * 0.8, 0.08, 0.015, -dvec, 0.2, seg=5, sides=5)
        M.add(V, F, GOLD * 0.9, 8)
    for j in range(3):                                                                # the rags, hanging
        p = WOUND + dvec * (0.12 + 0.05 * j)
        pts = np.array([p + [0.01 * math.sin(u * 4 + j), 0.0, -0.14 * u] for u in np.linspace(0, 1, 8)])
        V, F = G.tube(pts, 0.012 * (1 - 0.5 * np.linspace(0, 1, 8)), 6); M.add(V, F, RED * (0.9 + 0.2 * j), 8)
    for (zz, a0) in [(0.45, 2.4), (0.7, -2.6), (1.05, 2.8), (0.3, -1.7)]:             # barnacles on his neck
        cY = float(np.interp(zz, PTS[:, 2], PTS[:, 1])); r_ = float(np.interp(zz, PTS[:, 2], RAD))
        nrm = np.array([math.sin(a0), math.cos(a0), 0.0]); p = np.array([0, cY, zz]) + nrm * r_
        for q in range(5):
            bp = p + rr.normal(0, 0.03, 3)
            V, F = G.horn(bp - nrm * 0.02, nrm + rr.normal(0, 0.2, 3), 0.03, 0.018, nrm, 0.0, seg=4, sides=7, tipR=0.008)
            M.add(V, F, mix(BARN, BARN * 0.7, fbm(V, 80.0)[:, None]), 8)
    # the water: foam rings where he and his coils go in, and a ripple round him
    log('water')
    def water(P, lv=None):
        rho = np.hypot(P[:, 0], P[:, 1] + 0.15)
        rip = 0.006 * np.abs(np.sin(rho * 2 * math.pi / 0.25)) * (rho < 1.4)
        return np.maximum(np.abs(P[:, 2] - 0.01) - 0.004 - rip, rho - 1.45)
    V, F = S.mc(water, 0.018, np.array([-1.5, -1.65, -0.03]), np.array([1.5, 1.35, 0.04]))
    M.add(V, F, mix(np.array([0.06, 0.12, 0.13]), FOAM, np.clip((V[:, 2] - 0.012) / 0.008, 0, 1)[:, None]), 8)
    return M
