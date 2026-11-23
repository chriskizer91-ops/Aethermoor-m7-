# The marsh-light, rabble of the fens (One Foe's lane, November 21). python3.12 kit/py/sculpt.py foes/marsh-light <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-marsh-light.webp; 0.6 m from the water to the flame's tip): a floating
# flame of curling green tongues (each like a leaf of fire, overlapping, their tips licking up and out, the topmost
# a long curl), round a glowing yellow core that shows at the front with a face in it (two slanted dark eyes, a small
# dark mark below); golden drops falling from its pointed foot; a ripple of dark water under it. x right, y forward.
import math
import numpy as np

C0 = np.array([0.0, 0.0, 0.37])          # the flame's widest, at its core
FACE = np.array([0.0, 0.085, 0.345])

def build(K):
    S, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep
    M = K.Mesh()
    GREEN = np.array([0.26, 0.42, 0.08]); LIME = np.array([0.60, 0.70, 0.18]); DK = np.array([0.10, 0.20, 0.04])   # they glow (kind 7): cold fire
    CORE = np.array([0.85, 0.72, 0.22]); GOLD = np.array([1.0, 0.80, 0.25]); WATER = np.array([0.10, 0.20, 0.18])
    rr = np.random.default_rng(23)
    nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (16, 24))

    # ---- the flame's body: a teardrop, pointed below, a curling tip above; a window at the front for the core ----
    def body_sdf(P, lv=None):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        d = ell(P, C0, (0.088, 0.08, 0.10))
        d = smin(d, cap(P, (0, 0, 0.30), (0, 0, 0.16), 0.08, 0.004), 0.05)                     # pointed foot
        d = smin(d, cap(P, (0, 0, 0.42), (0.0, -0.01, 0.55), 0.06, 0.01), 0.05)                  # rising to the tip
        d = smax(d, -ell(P, FACE + [0, 0.03, 0], (0.075, 0.06, 0.075)), 0.025)                  # the window
        if (LV if lv is None else lv) >= 2: d = d - 0.002 * (fbm(P, 30.0, 2) - 0.5)
        return d
    log('body')
    V, F = S.mc(body_sdf, VOX, K.lo, K.hi)
    up = np.clip((V[:, 2] - 0.2) / 0.38, 0, 1)[:, None]
    M.add(V, F, np.clip(mix(DK, GREEN, up * 0.8 + 0.2 * fbm(V, 12.0)[:, None]), 0, 1), 0)

    # ---- the core: glowing yellow, in the window, with the face on it -------------------------------------------
    V, F = G.ellipsoid(FACE + [0, -0.01, 0], (0.075, 0.055, 0.08), nt + 4, npp + 6)
    M.add(V, F, np.tile(CORE, (len(V), 1)), 7)
    for s in (1, -1):                                                             # slanted eyes
        c = FACE + [s * 0.026, 0.038, 0.008]
        a = s * 0.5
        rot = np.array([[math.cos(a), 0, -math.sin(a)], [0, 1, 0], [math.sin(a), 0, math.cos(a)]])
        V, F = G.ellipsoid(c, (0.018, 0.007, 0.010), nt, npp, rot); M.add(V, F, np.tile([0.05, 0.06, 0.02], (len(V), 1)), 8)
    V, F = G.ellipsoid(FACE + [0, 0.04, -0.022], (0.004, 0.003, 0.006), 6, 8); M.add(V, F, np.tile([0.05, 0.06, 0.02], (len(V), 1)), 8)

    # ---- the tongues: long narrow flames lying on the teardrop, spiralling up it, licking out at their tips ------
    log('tongues')
    def prof(z):                                                                  # the flame's radius at each height
        return np.interp(z, [0.15, 0.22, 0.30, 0.37, 0.44, 0.50, 0.56, 0.62], [0.0, 0.05, 0.095, 0.112, 0.098, 0.06, 0.024, 0.0])
    segs = {0: 6, 1: 10, 2: 16}.get(LV, 24); wseg = {0: 2, 1: 2, 2: 3}.get(LV, 5)
    def tongue(a, z0, length, width, twist, lift, col_tip, thick=0.004, r_scale=1.03):
        t = np.linspace(0, 1, segs + 1)
        z = z0 + length * t
        az = a + twist * t
        r = prof(np.clip(z, 0.15, 0.64)) * r_scale + lift * t ** 2.2                 # off the surface at the tip
        az = az + 0.35 * np.sin(t * math.pi * 1.6) * np.sign(twist)               # an S as it rises
        spine = np.stack([np.cos(az) * r, np.sin(az) * r * 0.95, z + 0.02 * np.sin(t * math.pi * 2 + a) * t], 1)
        tan = np.gradient(spine, axis=0); tan /= np.linalg.norm(tan, axis=1, keepdims=True)
        nrm = np.stack([np.cos(az), np.sin(az), np.zeros_like(az)], 1)
        side = np.cross(nrm, tan); side /= np.linalg.norm(side, axis=1, keepdims=True) + 1e-9
        w = width * np.sin(np.clip(t * 1.0 + 0.04, 0, 1) * math.pi) ** 0.8 * (1 - 0.55 * t)      # a pointed flame
        u = np.linspace(-1, 1, wseg + 1)
        Vs = spine[:, None] + side[:, None] * (w[:, None] * u[None])[..., None] - nrm[:, None] * (0.3 * w[:, None] * (1 - u[None] ** 2))[..., None] * 0.5
        Vs = Vs.reshape(-1, 3); m = wseg + 1
        Ff = np.array([f for i in range(segs) for j in range(wseg) for f in ((i * m + j, i * m + j + 1, (i + 1) * m + j + 1), (i * m + j, (i + 1) * m + j + 1, (i + 1) * m + j))])
        th = (thick * (1 - 0.7 * np.repeat(t, m)))[:, None]
        nn = np.repeat(nrm, m, 0)
        Vv = np.concatenate([Vs + nn * th * 0.5, Vs - nn * th * 0.5]); Fv = np.concatenate([Ff, Ff[:, ::-1] + len(Vs)])
        tt = np.tile(np.repeat(t, m), 2)[:, None]
        g = 0.4 + 0.6 * rr.random()
        col = mix(mix(DK, GREEN, 0.25 + 0.75 * g), col_tip, np.clip(tt * 1.3 - 0.35, 0, 1) * g)
        return Vv, Fv, np.clip(col, 0, 1)
    for layer in range(3):                                                        # three layers, inner to outer
        for i in range(16):
            a = i / 16 * 2 * math.pi + layer * 0.37 + rr.uniform(-0.08, 0.08)
            da = ((a - math.pi / 2 + math.pi) % (2 * math.pi)) - math.pi
            z0 = rr.uniform(0.15, 0.36) + 0.04 * layer
            L = rr.uniform(0.16, 0.3) * (1.0 - 0.15 * layer)
            if abs(da) < 0.75: z0, L = (0.155, 0.09) if rr.random() < 0.5 else (0.43, 0.13 + 0.04 * rr.random())   # the window
            V, F, Cc = tongue(a, z0, L, rr.uniform(0.035, 0.055), rr.uniform(1.3, 2.1) * (1 if layer % 2 else -1),
                              rr.uniform(0.01, 0.03), LIME, r_scale=1.0 + 0.025 * layer)
            win = (V[:, 1] > 0.05) & (np.abs(V[:, 0]) < 0.065) & (np.abs(V[:, 2] - FACE[2]) < 0.065)
            if win.any(): continue                                                # it would cross the face: leave it out
            M.add(V, F, Cc, 7)
    # the long curl at the top, licking over to its left
    V, F, Cc = tongue(-math.pi / 2, 0.47, 0.17, 0.038, 2.2, 0.06, LIME, r_scale=0.6); M.add(V, F, Cc, 7)
    V, F, Cc = tongue(-math.pi / 2 - 1.2, 0.5, 0.14, 0.03, -1.8, 0.04, LIME, r_scale=0.5); M.add(V, F, Cc, 7)
    # stray wisps flying off, little flames
    for i in range(10):
        a = rr.uniform(0, 2 * math.pi); z = rr.uniform(0.3, 0.58)
        V, F, Cc = tongue(a, z, 0.04, 0.012, 0.3, 0.04, LIME, thick=0.002, r_scale=1.3); M.add(V, F, Cc, 7)

    # ---- the drops falling from its foot, and the ripple of water under it --------------------------------------
    for k, (z, r) in enumerate([(0.14, 0.006), (0.115, 0.005), (0.075, 0.009)]):
        c = np.array([0, 0, z])
        V, F = G.ellipsoid(c, (r, r, r * (1.6 if k == 2 else 1.0)), nt, npp)
        if k == 2: V[:, 2] += 0.006 * np.clip((V[:, 2] - z) / (r * 1.6), 0, 1) ** 2
        M.add(V, F, np.tile(GOLD, (len(V), 1)), 7)
    def pool_sdf(P):
        rho = np.hypot(P[:, 0], P[:, 1])
        d = np.maximum(rho - 0.11, np.abs(P[:, 2] - 0.006) - 0.006)
        d = d - 0.0015 * np.sin(rho * 140) * sstep(0.11, 0.02, rho)                 # rings
        return d
    V, F = S.mc(pool_sdf, VOX * 0.8, np.array([-0.13, -0.13, -0.006]), np.array([0.13, 0.13, 0.02]))
    rho = np.hypot(V[:, 0], V[:, 1])[:, None]
    ring = (0.5 + 0.5 * np.sin(rho[:, 0] * 140))[:, None]
    M.add(V, F, np.clip(mix(WATER * 1.8, WATER, ring) * (1 + 0.6 * np.clip(1 - rho / 0.05, 0, 1)), 0, 1), 8)
    V, F = G.ellipsoid((0, 0, 0.0125), (0.035, 0.035, 0.001), nt, npp)            # the light, reflected in the water
    M.add(V, F, np.tile(GOLD * 0.9, (len(V), 1)), 7)
    return M
