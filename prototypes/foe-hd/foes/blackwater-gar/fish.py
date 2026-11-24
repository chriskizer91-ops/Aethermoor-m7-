# A gar, built from a few numbers (One Foe's lane, November 23): the blackwater-gar and Old Jaws share it.
#   from fish import build_fish, DEFAULTS
#   build_fish(K, C)   C: DEFAULTS with changes (length, swim height, colours, crest...); returns (mesh, layout)
# A long armoured fish swimming just above the ground: diamond plates (ganoid scales) in rows, a long narrow snout
# full of needle teeth, a yellow eye, a sawtooth crest down its back, fins with orange spots. The lower jaw is a piece of
# its own (it opens). x right, y forward (the snout), z up. All sizes are for a 1.3 m gar and scale with C['length'].
import math
import numpy as np

DEFAULTS = dict(length=1.3, swim=0.28, arch=0.17, seed=7,
                green=(0.24, 0.34, 0.12), dark=(0.08, 0.12, 0.05), light=(0.46, 0.50, 0.22), belly=(0.55, 0.54, 0.30),
                spot=(0.88, 0.55, 0.16), eye=(0.92, 0.66, 0.12), crest=11, ripple=True, snout=1.0, snout_w=1.0, deep=1.0, crest_h=1.0, wide=1.0, arch_front=0.35, tail=1.0)
# the body's outline along its length, for a 1.3 m gar: (y, half height, half width)
PROFILE = [(-0.53, 0.026, 0.018), (-0.45, 0.036, 0.026), (-0.3, 0.06, 0.045), (-0.15, 0.074, 0.057), (0.0, 0.08, 0.062),
           (0.12, 0.077, 0.06), (0.2, 0.068, 0.055), (0.27, 0.055, 0.047), (0.33, 0.04, 0.037), (0.38, 0.03, 0.03),
           (0.5, 0.022, 0.022), (0.6, 0.016, 0.016), (0.64, 0.01, 0.01)]

def layout(C):
    k = C['length'] / 1.3
    py = np.array([p[0] for p in PROFILE]); py = np.where(py > 0.33, 0.33 + (py - 0.33) * C['snout'], py) * k   # a shorter snout
    ph = np.array([p[1] for p in PROFILE]) * k * 1.25 * C['deep']; pw = np.array([p[2] for p in PROFILE]) * k * 1.15 * C['wide']
    wide = np.clip((py / k - 0.3) / 0.1, 0, 1); pw = pw * (1 + (C['snout_w'] - 1) * wide); ph = ph * (1 + 0.5 * (C['snout_w'] - 1) * wide)
    mid = lambda y: C['swim'] + C['arch'] * k * (1 - (y / (0.6 * k)) ** 2 * np.where(y > 0, C['arch_front'], 1.0))   # the tail droops; the snout level
    return dict(k=k, py=py, ph=ph, pw=pw, mid=mid, tip=py[-1], tail=py[0], mouth_y=0.28 * k, eye_y=0.33 * k)

def build_fish(K, C):
    S, G, LV, VOX, SIDES, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.log
    smin, smax, ell, cap, fbm, mix, vnoise, sstep = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.vnoise, S.sstep
    M = K.Mesh(); Lo = layout(C); k = Lo['k']; mid = Lo['mid']
    GREEN, DARK, LIGHT, BELLY, SPOT, EYEC = [np.array(C[n]) for n in ('green', 'dark', 'light', 'belly', 'spot', 'eye')]
    rr = np.random.default_rng(C['seed'])
    band = 0.03 * k if LV >= 2 else None
    nt, npp = {0: (6, 8), 1: (8, 10), 2: (10, 14)}.get(LV, (12, 18))
    hy = lambda y: np.interp(y, Lo['py'], Lo['ph']); wy = lambda y: np.interp(y, Lo['py'], Lo['pw'])
    MY = Lo['mouth_y']
    def mouth_z(y): return mid(y) - 0.18 * hy(y)                                     # the line of the mouth, low on the snout

    def shape(P):
        y = P[:, 1]; yc = np.clip(y, Lo['tail'], Lo['tip'])
        h, w = hy(yc), wy(yc); zc = mid(yc)
        q = np.sqrt((P[:, 0] / w) ** 2 + ((P[:, 2] - zc) / h) ** 2)
        d = (q - 1) * np.minimum(h, w) * 0.95
        return np.maximum(d, np.maximum(y - Lo['tip'], Lo['tail'] - y))
    def plates(P, L):
        """ganoid scales: diamond plates in slanting rows, raised, their back edges lifted"""
        y = P[:, 1]; zc = mid(y); ang = np.arctan2(P[:, 2] - zc, P[:, 0])
        u = y / (0.072 * k); v = ang * (0.07 * k) / (0.072 * k) * 1.6                  # bigger plates (second pass)
        a, b = (u + v) % 1.0, (u - v) % 1.0
        e = np.minimum(np.minimum(a, 1 - a), np.minimum(b, 1 - b))                    # 0 on the groove, 0.5 mid-plate
        on = sstep(0.2 * k, 0.15 * k, y) * sstep(Lo['tail'] + 0.02, Lo['tail'] + 0.08 * k, y)
        return on * (0.0036 * k * sstep(0.0, 0.12, e) + 0.0016 * k * a), e, on            # each plate's back edge lifted more
    def upper_sdf(P, lv=None):
        L = LV if lv is None else lv
        d = shape(P)
        pl, _, _ = plates(P, L); d = d - pl
        # the lower jaw is its own piece: cut it away below the mouth line, forward of the hinge
        jaw = np.maximum(P[:, 2] - mouth_z(P[:, 1]) + 0.0015 * k, MY - P[:, 1])
        d = smax(d, -jaw, 0.002 * k)
        if L >= 2: d = d - 0.0012 * k * (fbm(P, 50.0 / k, 2) - 0.5)
        if L >= 3: d = d - 0.0004 * k * (vnoise(P, 250.0 / k) - 0.5)
        # the eye sockets
        for sx in (1, -1):
            e = np.array([sx * wy(Lo['eye_y']) * 0.8, Lo['eye_y'], mid(Lo['eye_y']) + 0.35 * hy(Lo['eye_y'])])
            d = smax(d, -ell(P, e, np.array([0.016, 0.018, 0.014]) * k), 0.004 * k)
        return d
    def jaw_sdf(P, lv=None):
        L = LV if lv is None else lv
        d = shape(P)
        d = smax(d, np.maximum(P[:, 2] - mouth_z(P[:, 1]) - 0.0005 * k, MY - 0.015 * k - P[:, 1]), 0.002 * k)
        d = smin(d, ell(P, np.array([0, MY + 0.01 * k, mouth_z(MY) - 0.01 * k]), np.array([0.035, 0.04, 0.02]) * k), 0.01 * k)  # its hinge, inside the head
        if L >= 2: d = d - 0.0012 * k * (fbm(P, 50.0 / k, 2) - 0.5)
        return d
    lo = np.array([-0.12 * k * C['wide'], Lo['tail'] - 0.01, C['swim'] - 0.13 * k * C['deep']]); hi = np.array([0.12 * k * C['wide'], Lo['tip'] + 0.01, C['swim'] + C['arch'] * k + 0.13 * k * C['deep']])
    def skin(V, jaw=False):
        y = V[:, 1]; zc = mid(y); h = hy(np.clip(y, Lo['tail'], Lo['tip']))
        up = (V[:, 2] - zc) / h
        _, e, on = plates(V, LV)
        aa = ((y / (0.072 * k)) + np.arctan2(V[:, 2] - zc, V[:, 0]) * (0.07 / 0.072) * 1.6) % 1.0   # where on its plate, front to back
        col = mix(GREEN, DARK, np.clip(up * 0.6 + 0.2, 0, 1)[:, None] * 0.7)            # darker along the back
        col = mix(col, DARK * 0.8, (fbm(V, 9.0 / k) > 0.6)[:, None] * 0.5)              # mottled
        col = mix(col, BELLY, np.clip(-up - 0.25, 0, 1)[:, None])                         # a pale belly
        col = mix(col, LIGHT, (on * sstep(0.08, 0.25, e) * (1 - aa) ** 0.7 * (up > -0.4))[:, None] * 0.6)   # each plate catches the light on its front half (sheet)
        col = col * (1 - 0.25 * (on * aa ** 2 * (up > -0.4))[:, None])                  # and shades toward its back edge
        col = col * (1 - 0.45 * (on * (1 - sstep(0.02, 0.08, e)))[:, None])              # dark grooves between them
        return np.clip(col, 0, 1)
    log('body')
    V, F = S.mc(upper_sdf, VOX, lo, hi, band=band); M.add(V, F, skin(V), 0)
    log('jaw')
    V, F = S.mc(jaw_sdf, VOX, np.array([-0.06 * k, MY - 0.06 * k, mouth_z(MY) - 0.08 * k]), np.array([0.06 * k, Lo['tip'] + 0.01, mouth_z(MY) + 0.04 * k]))
    M.add(V, F, skin(V, True), 0)
    # needle teeth along both jaws
    for jaw in (False, True):
        for sx in (1, -1):
            for y in np.linspace(MY + 0.02 * k, Lo['tip'] - 0.03 * k, 22):
                z = mouth_z(y); x = sx * wy(y) * 0.78
                L_ = (0.012 + 0.006 * rr.random()) * k
                base = np.array([x, y, z - 0.008 * k if jaw else z + 0.008 * k])
                V, F = G.horn(base, [sx * 0.15, 0.25, 1.0 if jaw else -1.0], L_, 0.003 * k, [0, 1, 0], 0.15, seg=4, sides=5)
                M.add(V, F, np.tile(np.array([0.92, 0.88, 0.76]), (len(V), 1)), 2)
    # the eyes
    for sx in (1, -1):
        e = np.array([sx * wy(Lo['eye_y']) * 0.8, Lo['eye_y'], mid(Lo['eye_y']) + 0.35 * hy(Lo['eye_y'])])
        V, F = G.ellipsoid(e, np.array([0.013, 0.015, 0.012]) * k, nt, npp); M.add(V, F, np.tile(EYEC, (len(V), 1)), 8)
        V, F = G.ellipsoid(e + [sx * 0.01 * k, 0.002 * k, 0], np.array([0.006, 0.004, 0.009]) * k, nt, npp); M.add(V, F, np.tile([0.02, 0.02, 0.02], (len(V), 1)), 8)

    # ---- fins: thin membranes on rays, orange spots; the sawtooth crest down the back ------------------------------
    def fin(root, du, dv, length, width, th=0.0025, spots=True, shape_=lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 0.7, kind=1):
        root = np.asarray(root, float); du = np.asarray(du, float); du /= np.linalg.norm(du)
        dv = np.asarray(dv, float); dv = dv - du * (dv @ du); dv /= np.linalg.norm(dv); dn = np.cross(du, dv)
        def f(P, lv=None):
            Q = P - root; u = (Q @ du) / length; v = (Q @ dv) / width; n = Q @ dn
            hw = shape_(u); rays = 0.35 * np.abs(np.sin(v * 9.0)) * (u > 0)
            d2 = np.maximum(np.maximum(-u, u - 1) * length, (np.abs(v) - hw) * width)
            return np.maximum(d2, np.abs(n) - th * k * (1 + rays) * (1 - 0.6 * np.clip(u, 0, 1)))
        ext = max(length, width) + 0.02 * k
        V, F = S.mc(f, VOX, root - ext, root + ext)
        Q = V - root; u = np.clip((Q @ du) / length, 0, 1); v = (Q @ dv) / width
        col = mix(GREEN, DARK, 0.4 + 0.3 * u[:, None]) * (0.85 + 0.3 * np.abs(np.sin(v * 9.0))[:, None])
        if spots:
            sp = (vnoise(V, 28.0 / k) > 0.72) & (u > 0.25)
            col = mix(col, SPOT, sp[:, None] * 0.9)
        M.add(V, F, np.clip(col, 0, 1), kind)
    log('fins')
    for sx in (1, -1):
        y = 0.17 * k; z = mid(y) - 0.6 * hy(y)
        fin([sx * wy(y) * 0.8, y, z], [sx * 0.8, -0.6, -0.35], [0, 1, 0.3], 0.21 * k, 0.065 * k)            # the pectorals
        y = -0.16 * k; z = mid(y) - 0.8 * hy(y)
        fin([sx * wy(y) * 0.5, y, z], [sx * 0.5, -0.7, -0.5], [0, 1, 0], 0.12 * k, 0.04 * k)             # the pelvics
    y = -0.37 * k
    fin([0, y, mid(y) - 0.85 * hy(y)], [0, -0.6, -0.8], [0, 1, 0], 0.08 * k, 0.04 * k, spots=False)      # the anal fin
    fin([0, y - 0.02 * k, mid(y) + 0.85 * hy(y)], [0, -0.6, 0.8], [0, 1, 0], 0.09 * k, 0.045 * k)       # the soft dorsal
    # the tail: a fan, its upper lobe longer
    ty = Lo['tail'] + 0.02 * k
    fin([0, ty, mid(ty) + 0.004 * k], [0, -1.0, -0.12], [0, 0, 1], 0.19 * k * C['tail'], 0.085 * k * C['tail'] ** 0.5,
        shape_=lambda u: (0.35 + 0.65 * np.clip(u, 0, 1) ** 0.6) * (1 - 0.25 * np.clip(u - 0.85, 0, 1) / 0.15))
    # the crest: a sawtooth of plates down its back, pointing back
    for i, y in enumerate(np.linspace(-0.42 * k, 0.24 * k, C['crest'])):
        z = mid(y) + hy(y) * 0.92; hh = (0.045 + 0.025 * math.sin(math.pi * (i + 0.5) / C['crest'])) * k * C['crest_h']
        base0, base1, tip = np.array([y + 0.035 * k, z - 0.01 * k]), np.array([y - 0.03 * k, z - 0.01 * k]), np.array([y - 0.045 * k, z + hh])
        def crest(P, lv=None, b0=base0, b1=base1, tp=tip):
            Q = P[:, 1:3]
            def edge(a, b):
                e = b - a; w = Q - a; t = np.clip((w @ e) / (e @ e), 0, 1)
                return np.linalg.norm(w - t[:, None] * e, axis=1), e[0] * w[:, 1] - e[1] * w[:, 0]
            (d0, s0), (d1, s1), (d2, s2) = edge(b0, b1), edge(b1, tp), edge(tp, b0)
            inside = (np.sign(s0) == np.sign(s1)) & (np.sign(s1) == np.sign(s2))
            d2d = np.minimum(np.minimum(d0, d1), d2) * np.where(inside, -1, 1)
            return np.maximum(d2d, np.abs(P[:, 0]) - 0.004 * k * (1 - 0.7 * np.clip((P[:, 2] - z) / hh, 0, 1)))
        V, F = S.mc(crest, VOX * 0.8, np.array([-0.02 * k, y - 0.07 * k, z - 0.03 * k]), np.array([0.02 * k, y + 0.06 * k, z + hh + 0.02 * k]))
        t = np.clip((V[:, 2] - z) / hh, 0, 1)[:, None]
        M.add(V, F, np.clip(mix(GREEN * 1.1, mix(LIGHT, SPOT, 0.6 * (i > C['crest'] * 0.6)), t ** 1.5), 0, 1), 1)
    if C['ripple']:                                                                   # the water it swims in: a ripple
        def rip(P, lv=None):
            rho = np.hypot(P[:, 0] / 1.0, (P[:, 1] + 0.05 * k) / 1.6)
            r = np.abs(np.sin(rho * 2 * math.pi / (0.09 * k))) * (rho < 0.42 * k) * (rho > 0.06 * k)
            return np.maximum(np.abs(P[:, 2] - 0.004) - 0.002 - 0.003 * r, rho - 0.42 * k)
        V, F = S.mc(rip, 0.007 * k, np.array([-0.45 * k, -0.75 * k, -0.01]), np.array([0.45 * k, 0.65 * k, 0.02]))
        M.add(V, F, np.tile(np.array([0.16, 0.22, 0.24]), (len(V), 1)), 8)
    return M, Lo
