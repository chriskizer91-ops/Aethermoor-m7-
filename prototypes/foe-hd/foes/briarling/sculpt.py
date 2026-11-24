# The briarling, rabble of the Thornway (One Foe's lane, November 20). python3.12 kit/py/sculpt.py foes/briarling <level>
#
# From Chris's sheet (art-in/3d/sheets/sheet-briarling.webp), 0.6 m to the sprout's tip: a ball of leaves on two
# twisted root legs, vines crossing it in an X, one big dark eye with an amber slit of light, berries on little twigs
# round its top, a two-leaf sprout. Its coat is leaves sculpted into the ball (kit/py/coat.py), with more leaves
# standing out round its outline as the sheet shows. x right, y forward (the eye), z up.
import math
import numpy as np

def build(K):
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, project = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep, S.project
    tube, horn = G.tube, G.horn
    M = K.Mesh()
    LEAF = np.array([0.30, 0.42, 0.12]); DKLEAF = np.array([0.15, 0.27, 0.07]); YLEAF = np.array([0.50, 0.55, 0.16])
    BARK = np.array([0.30, 0.21, 0.12]); DKBARK = np.array([0.18, 0.12, 0.07]); BERRY = np.array([0.95, 0.62, 0.12])
    EYE_C = np.array([0, 0.125, 0.32])                   # the eye's hole, on the front of the ball
    BODY_C = np.array([0, 0.0, 0.33])
    # the legs: from under the ball down to splayed root feet (front view: 0.06 either side; side view: straight)
    LEGS = {'l': [(-0.045, 0.0, 0.22), (-0.068, 0.0, 0.11), (-0.092, 0.005, 0.025)],
            'r': [(0.045, 0.0, 0.22), (0.068, 0.0, 0.11), (0.092, 0.005, 0.025)]}

    def body_sdf(P):
        d = ell(P, BODY_C, (0.185, 0.125, 0.12))
        d = smin(d, ell(P, BODY_C + [0, 0, 0.075], (0.10, 0.088, 0.11)), 0.05)     # rising to a point under the sprout (the sheet's diamond)
        d = smax(d, -ell(P, EYE_C + [0, 0.01, 0], (0.078, 0.045, 0.06)), 0.01)    # the eye's hole, big (0.15 wide, front view)
        return d

    def zones(P):
        eye = np.exp(-np.sum(((P - EYE_C) / [0.07, 0.06, 0.07]) ** 2, 1))
        return dict(eye=eye)
    def tuft_len(P): return np.full(len(P), 0.095) * (1 - 0.35 * zones(P)['eye'])
    def flow(P, N):
        # the leaves lie out and down from the top of the ball, as on a bush
        v = P - (BODY_C + [0, 0, 0.12]); v[:, 2] -= 0.05
        v = v + 0.5 * (np.stack([fbm(P * 8 + 3, 2.0), fbm(P * 8 + 7, 2.0), fbm(P * 8 + 11, 2.0)], 1) - 0.5) * 0.2
        v = v - N * np.sum(v * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)
    def bare(P):
        return (np.linalg.norm((P - EYE_C) / [1.3, 1, 1.1], axis=1) < 0.065) | (P[:, 2] < BODY_C[2] - 0.115)
    def style(TP, TL, rng):
        n = len(TP)
        W = TL * (0.62 + 0.12 * rng.random(n)); H = TL * (0.26 + 0.08 * rng.random(n))
        C = mix(mix(LEAF, DKLEAF, rng.random(n)[:, None] * 0.9), YLEAF, (rng.random(n) < 0.25)[:, None] * 0.7)
        return dict(W=W, H=H, C=C)
    log('leaves')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=21, spacing=0.4, strands=(4, 6), log=log)
    full_sdf, place_sdf = coat.full_sdf, coat.place_sdf

    Vb, Fb = S.mc(full_sdf, VOX, K.lo, K.hi)
    log('ball tris', len(Fb))
    col, top, has = coat.colours(Vb, np.tile(DKLEAF * 0.6, (len(Vb), 1)))
    crev = np.clip(1 - top / 0.004, 0, 1)
    col = col * (1 - 0.5 * crev[:, None])
    inside = np.clip(1.5 - np.linalg.norm((Vb - EYE_C) / [0.08, 0.05, 0.062], axis=1), 0, 1)[:, None]
    col = mix(col, np.array([0.03, 0.025, 0.02]), np.clip(inside * 1.5, 0, 1))          # the eye's hole is dark
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    def bark_col(V):
        return np.clip(mix(BARK, DKBARK, (fbm(V * 30, 2.0)[:, None] * 1.2).clip(0, 1)), 0, 1)
    def vine(path, r, strands=3, twist=0.03, seed=0):
        P = G.resample(path, max(16, int(np.sum(np.linalg.norm(np.diff(path, axis=0), axis=1)) / {0: 0.02, 1: 0.012, 2: 0.006, 3: 0.003}.get(LV, 0.003))))
        t, N, B = G.frames(P)
        s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
        if LV == 0:
            V, F = tube(P, np.full(len(P), r), SIDES); M.add(V, F, bark_col(V), 3); return P
        for k in range(strands):
            a = s / twist + k * 2 * np.pi / strands
            off = (np.cos(a)[:, None] * N + np.sin(a)[:, None] * B) * r * 0.45
            V, F = tube(P + off, np.full(len(P), r * 0.6), SIDES)
            M.add(V, F, bark_col(V) * (0.9 + 0.1 * k), 3)
        return P
    def lay(pts, r): return G.lay(project, place_sdf, pts, r)

    # ---- the legs: twisted root trunks with splayed root toes ----------------------------------------------------
    log('legs, vines, sprout, leaves, berries, eye')
    for side, (a, b, c) in LEGS.items():
        sx = 1 if side == 'r' else -1
        path = np.array([a, b, c], float)
        path = G.resample(np.array([path[0] + [0, 0, 0.04], path[0], path[1], path[2]]), 40)
        vine(path, 0.03, strands=3, twist=0.02)
        for i, ang in enumerate(np.linspace(-1.2, 1.2, 4) + (0 if sx > 0 else math.pi)):
            d = np.array([math.sin(ang) * 0.9, math.cos(ang) * 0.9 if i % 2 else math.cos(ang) * 0.5 + 0.4, -0.35])
            d[0] = abs(d[0]) * sx if i in (0, 3) else d[0]
            V, F = horn(np.array(c) + [0, 0, 0.012], d, 0.065, 0.014, [0, 0, -1], 0.5, SEG, SIDES)
            M.add(V, F, bark_col(V), 6)
        # a few leaves and tendrils wound round the shin (sheet)
    # ---- the vines: an X across the front and back, wound round the ball ----------------------------------------
    rr = np.random.default_rng(31)
    # front: two vines from the upper sides down across, crossing below the eye (the sheet's diamond round it);
    # back: an X across the middle
    for sgn in (1, -1):
        u = np.linspace(0, 1, 40)
        x = sgn * (-0.2 + 0.34 * u); z = EYE_C[2] + 0.085 - 0.22 * u - 0.05 * np.sin(np.pi * u)
        vine(lay(np.stack([x, np.full_like(u, 0.2), z], 1), 0.017), 0.017, strands=2, twist=0.025)
        u = np.linspace(-1, 1, 30)
        pts = np.stack([sgn * u * 0.19, -np.full_like(u, 0.16), BODY_C[2] - u * 0.12], 1)
        vine(lay(pts, 0.017), 0.017, strands=2, twist=0.025)
    # ---- the sprout: a twisted stem up from the top, two leaves ---------------------------------------------------
    stem = G.resample(np.array([[0, -0.01, 0.42], [0.016, 0.0, 0.46], [-0.014, 0.01, 0.5], [0.008, 0.0, 0.535]]), 30)
    vine(stem, 0.014, strands=2, twist=0.02)
    def leaf(base, d, up, length, width, col, kind=1, curl=0.25):
        """a leaf blade with a midrib and a serrated edge, both sides"""
        d = np.asarray(d, float); d /= np.linalg.norm(d); up = np.asarray(up, float); up -= d * (up @ d); up /= np.linalg.norm(up)
        side = np.cross(up, d)
        nu, nv = {0: 6, 1: 8, 2: 14, 3: 22}.get(LV, 22), {0: 3, 1: 5, 2: 7, 3: 11}.get(LV, 11)
        U, Vv = np.meshgrid(np.linspace(0, 1, nu), np.linspace(-1, 1, nv), indexing='ij')
        w = np.sin(np.pi * U ** 0.8) ** 0.9 * (1 + (0.08 * np.sin(U * 40) if LV >= 2 else 0) * (np.abs(Vv) > 0.8))
        hgt = -curl * length * Vv ** 2 * 0.3 + 0.08 * length * U ** 2 - (0.004 * np.exp(-(Vv / 0.15) ** 2) if LV >= 2 else 0)
        def surf(off):
            return (base + np.einsum('ij,k->ijk', U * length, d) + np.einsum('ij,k->ijk', Vv * w * width * 0.5, side)
                    + np.einsum('ij,k->ijk', hgt + off, up)).reshape(-1, 3)
        top, bot = surf(0.0015), surf(-0.0015)
        F = []
        for i in range(nu - 1):
            for j in range(nv - 1):
                a = i * nv + j; F += [(a, a + nv, a + nv + 1), (a, a + nv + 1, a + 1)]
        F = np.array(F); n0 = len(top)
        V = np.vstack([top, bot]); FF = np.vstack([F, F[:, ::-1] + n0])
        rib = np.concatenate([np.abs(Vv).ravel()] * 2)
        C = np.clip(col * (0.85 + 0.3 * (rib < 0.12)[:, None] * 0.5) * (0.8 + 0.2 * np.concatenate([U.ravel()] * 2))[:, None], 0, 1)
        M.add(V, FF, C, kind)
    tip = stem[-1]
    leaf(tip, [0.72, 0.0, 0.7], [0, 0.3, 1], 0.1, 0.064, LEAF * 1.1)
    leaf(tip, [-0.72, 0.1, 0.72], [0, 0.3, 1], 0.095, 0.06, LEAF)
    # ---- leaves standing out round the outline (front and back views show them), and little twigs with berries --------
    for i in range(56):
        a = rr.random() * 2 * math.pi; el = rr.uniform(-0.9, 1.0)
        g = BODY_C + np.array([math.cos(a) * math.cos(el) * 0.3, math.sin(a) * math.cos(el) * 0.2, math.sin(el) * 0.18])
        if np.linalg.norm((g - EYE_C) / [1.3, 1, 1.1]) < 0.11: continue
        p, nrm = project(g[None].astype(np.float32), place_sdf); p, nrm = p[0].astype(float), nrm[0].astype(float)
        out = nrm + [0, 0, 0.25]
        fl = flow(p[None].astype(np.float32), nrm[None].astype(np.float32))[0]
        out = fl * 0.5 + nrm * 0.55 + np.array([0, 0, -0.4])        # out from the ball and drooping, as a bush's
        up = nrm - out * (nrm @ out / (out @ out))
        leaf(p - nrm * 0.008, out, up, 0.075 + 0.025 * rr.random(), 0.058, mix(mix(LEAF, DKLEAF, rr.random() * 0.8), YLEAF, (rr.random() < 0.25) * 0.6), curl=0.18)
    for i in range(14):
        a = rr.random() * 2 * math.pi; zz = BODY_C[2] + 0.04 + 0.08 * rr.random()
        g = np.array([math.cos(a) * 0.25, math.sin(a) * 0.18, zz])
        p, nrm = project(g[None].astype(np.float32), place_sdf); p, nrm = p[0].astype(float), nrm[0].astype(float)
        twig_end = p + nrm * 0.03 + [0, 0, 0.012]
        V, F = tube(np.array([p - nrm * 0.005, (p + twig_end) / 2 + [0, 0, 0.006], twig_end]), np.array([0.004, 0.003, 0.0025]), max(5, SIDES - 2))
        M.add(V, F, BARK, 3)
        V, F = G.ellipsoid(twig_end + nrm * 0.008, [0.015, 0.015, 0.015], {0: 6, 1: 8, 2: 12, 3: 16}.get(LV, 16), {0: 8, 1: 10, 2: 16, 3: 22}.get(LV, 22))
        M.add(V, F, BERRY * (0.9 + 0.2 * rr.random()), 8)
    # ---- the eye: a dark globe in its hole, an amber slit of light -----------------------------------------------
    V, F = G.ellipsoid(EYE_C + [0, -0.01, 0], [0.074, 0.035, 0.057], {0: 8, 1: 10, 2: 14, 3: 20}.get(LV, 20), {0: 12, 1: 16, 2: 24, 3: 32}.get(LV, 32))
    M.add(V, F, np.array([0.04, 0.035, 0.03]), 8)
    V, F = G.ellipsoid(EYE_C + [0, 0.023, 0], [0.012, 0.008, 0.028], 10, 14)
    M.add(V, F, np.array([1.0, 0.68, 0.15]), 7)
    return M
