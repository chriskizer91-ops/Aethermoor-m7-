# The rockling, rabble of the hills (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/rockling <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-rockling.webp; 0.6 m tall): a heap of scree that stood up. Dark
# blue-grey stones, chipped into flat faces: a round boulder for a head with two pale stones for eyes, a body of
# boulders with pebbles packed between, a big stone at each side for a fist, two flat-bottomed stones for feet.
# Every stone is its own piece, so each moves whole with its part (head, body, hips, an arm or a leg) and nothing
# ever stretches. x right, y forward, z up.
import math
import numpy as np

# the big stones: (centre, radii, part)
STONES = [
    ((0.0, 0.05, 0.47), (0.135, 0.12, 0.118), 'head'),
    ((0.0, 0.05, 0.31), (0.08, 0.07, 0.065), 'body'),
    ((0.095, 0.02, 0.335), (0.06, 0.06, 0.055), 'body'), ((-0.095, 0.02, 0.335), (0.06, 0.06, 0.055), 'body'),
    ((0.0, -0.075, 0.25), (0.11, 0.08, 0.11), 'body'),
    ((0.0, -0.06, 0.365), (0.09, 0.07, 0.06), 'body'),
    ((0.075, 0.07, 0.24), (0.06, 0.05, 0.05), 'body'), ((-0.075, 0.065, 0.235), (0.055, 0.05, 0.05), 'body'),
    ((0.0, 0.07, 0.165), (0.1, 0.08, 0.09), 'hips'),
    ((0.0, -0.05, 0.13), (0.09, 0.07, 0.07), 'hips'),
    ((0.12, 0.0, 0.13), (0.06, 0.06, 0.055), 'hips'), ((-0.12, 0.0, 0.13), (0.06, 0.06, 0.055), 'hips'),
    ((0.16, 0.0, 0.325), (0.072, 0.066, 0.064), 'r_arm'), ((-0.16, 0.0, 0.325), (0.072, 0.066, 0.064), 'l_arm'),
    ((0.2, 0.01, 0.255), (0.05, 0.05, 0.05), 'r_arm'), ((-0.2, 0.01, 0.255), (0.05, 0.05, 0.05), 'l_arm'),
    ((0.215, 0.02, 0.165), (0.085, 0.08, 0.078), 'r_arm'), ((-0.215, 0.02, 0.165), (0.085, 0.08, 0.078), 'l_arm'),
    ((0.125, 0.04, 0.225), (0.05, 0.05, 0.05), 'body'), ((-0.125, 0.04, 0.225), (0.05, 0.05, 0.05), 'body'),
    ((0.1, -0.06, 0.32), (0.06, 0.055, 0.055), 'body'), ((-0.1, -0.06, 0.32), (0.06, 0.055, 0.055), 'body'),
    ((0.12, 0.0, 0.055), (0.075, 0.07, 0.06), 'r_leg'), ((-0.12, 0.0, 0.055), (0.075, 0.07, 0.06), 'l_leg'),
]

def build(K):
    S, G, LV, VOX, log = K.sdf, K.geom, K.LV, K.VOX, K.log
    smax, fbm, mix, vnoise = S.smax, S.fbm, S.mix, S.vnoise
    M = K.Mesh()
    DARK = np.array([0.17, 0.19, 0.23]); MID = np.array([0.29, 0.31, 0.36]); PALE = np.array([0.45, 0.47, 0.52])
    rr = np.random.default_rng(41)
    nt, npp = {0: (6, 9), 1: (8, 12), 2: (12, 18)}.get(LV, (16, 24))

    def stone(c, r, seed):
        """a stone chipped into flat faces: an ellipsoid cut by a dozen planes, the edges a little worn, the faces
        pitted. Returns its shape and the plane each face is (to shade the faces apart)"""
        g = np.random.default_rng(seed); c = np.asarray(c, np.float32); r = np.asarray(r, np.float32)
        n = g.normal(size=(18, 3)); n /= np.linalg.norm(n, axis=1, keepdims=True)
        off = g.uniform(0.8, 0.93, 18)
        def f(P, lv=None):
            Q = (P - c) / r
            d = np.linalg.norm(Q, axis=1) - 1.0
            pl = Q @ n.T - off                                                       # the chipped faces
            k = 0.018
            m = pl.max(1); soft = m + k * np.log(np.exp((pl - m[:, None]) / k).sum(1))   # worn edges
            d = smax(d, soft, 0.02) * r.min()
            d = d - 0.002 * (fbm(P, 22.0, 2) - 0.5)                                 # lumpy
            L = LV if lv is None else lv
            if L >= 2: d = d - 0.0012 * (fbm(P, 90.0, 2) - 0.5)                      # pitted
            if L >= 3: d = d + 0.0006 * np.abs(np.sin(vnoise(P, 30.0) * 40))         # fine cracks and grain
            return np.maximum(d, -P[:, 2])                                           # flat on the ground
        face = lambda P: np.argmax(((P - c) / r) @ n.T - off, 1)
        return f, face, g.uniform(0, 1, 18)
    def add(c, r, seed, kind=0, tone=None):
        f, face, shade = stone(c, r, seed)
        c = np.asarray(c, np.float32); pad = np.asarray(r, np.float32) * 1.15 + 0.01
        V, F = S.mc(f, VOX, c - pad, c + pad)
        sh = shade[face(V)][:, None]                                                 # each face its own grey
        col = mix(DARK, MID, 0.35 + 0.5 * sh) if tone is None else tone
        col = mix(col, PALE, 0.35 * np.clip(fbm(V, 40.0)[:, None] - 0.45, 0, 1) * 2)   # pale weathering
        col = col * (0.85 + 0.25 * np.clip((V[:, 2:3] - c[2]) / max(r[2], 1e-3), -1, 1) * 0.5 + 0.1)   # lighter on top
        M.add(V, F, np.clip(col, 0, 1), kind)
        return f

    log('stones')
    shapes = []
    for i, (c, r, _) in enumerate(STONES):
        shapes.append(add(c, r, 100 + i))
    # the eyes: two pale stones set in the head's face
    for sx in (1, -1):
        V, F = G.ellipsoid((sx * 0.052, 0.138, 0.478), (0.017, 0.012, 0.019), nt, npp)
        V += (fbm(V, 120.0)[:, None] - 0.5) * 0.003
        M.add(V, F, np.tile(np.array([0.78, 0.8, 0.82]), (len(V), 1)) * (0.9 + 0.1 * fbm(V, 200.0)[:, None]), 8)
    # pebbles packed between the stones (not inside them, not floating off them)
    def two(P):
        D = np.sort(np.stack([s(P, 0) for s in shapes], 1), 1)
        return D[:, 0], D[:, 1]
    log('pebbles')
    cand = np.column_stack([rr.uniform(-0.29, 0.29, 6000), rr.uniform(-0.16, 0.16, 6000), rr.uniform(0.02, 0.42, 6000)]).astype(np.float32)
    d1, d2 = two(cand)
    keep = cand[(d1 > -0.012) & (d1 < 0.004) & (d2 < 0.02)]                          # in a crease between two stones
    peb = []
    for p in keep:
        rad = rr.uniform(0.022, 0.042)
        if all(np.linalg.norm(p - q) > (rad + rq) * 1.0 for q, rq in peb): peb.append((p, rad))
        if len(peb) >= 50: break
    for j, (p, rad) in enumerate(peb):
        add(p, (rad * rr.uniform(0.9, 1.2), rad * rr.uniform(0.85, 1.1), rad * rr.uniform(0.75, 1.0)), 500 + j,
            kind=0, tone=mix(DARK, MID, rr.uniform(0.1, 0.6)))
    log(f'{len(peb)} pebbles')
    return M
