# The mire-leech, rabble of the Gloomfen (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/mire-leech <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-mire-leech.webp): "a leech as long as your arm", 0.72 m from its tail to
# its mouth, rising 0.45 m like a cobra off a broad flat foot. Ringed all along, glossy, mottled dark greens; a row of
# orange marks down the middle of its back (chevrons from behind); a dark teal sole; at the top a round sucker with a
# pale rim, rings of teeth, and a dark red throat. x right, y forward, z up.
import math
import numpy as np

# the spine, tail to mouth: (y, z, radius)
SPINE = [(-0.40, 0.016, 0.014), (-0.33, 0.03, 0.05), (-0.22, 0.055, 0.088), (-0.09, 0.085, 0.122), (0.03, 0.14, 0.138),
         (0.10, 0.22, 0.124), (0.14, 0.30, 0.104), (0.165, 0.365, 0.088), (0.20, 0.415, 0.078), (0.245, 0.442, 0.072),
         (0.285, 0.45, 0.07)]
PTS = np.array([(0.0, y, z) for y, z, _ in SPINE]); RAD = np.array([r for _, _, r in SPINE])
MOUTH = PTS[-1]; MDIR = (PTS[-1] - PTS[-2]) / np.linalg.norm(PTS[-1] - PTS[-2])

def along(P):
    """for each point: the nearest place on the spine (its arclength s, the point there, the tangent, the radius)"""
    best = np.full(len(P), 1e9); s = np.zeros(len(P)); C = np.zeros_like(P); T = np.zeros_like(P); R = np.zeros(len(P))
    acc = 0.0
    for i in range(len(PTS) - 1):
        a, b = PTS[i], PTS[i + 1]; ab = b - a; L = float(np.linalg.norm(ab))
        t = np.clip(((P - a) @ ab) / (L * L), 0, 1); c = a + t[:, None] * ab
        r = RAD[i] + (RAD[i + 1] - RAD[i]) * t
        d = np.linalg.norm(P - c, axis=1) - r
        m = d < best
        best[m] = d[m]; s[m] = acc + t[m] * L; C[m] = c[m]; T[m] = ab / L; R[m] = r[m]
        acc += L
    return best, s, C, T, R

def build(K):
    S, G, LV, VOX, log = K.sdf, K.geom, K.LV, K.VOX, K.log
    smin, smax, ell, cap, fbm, mix, vnoise = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.vnoise
    M = K.Mesh()
    DK = np.array([0.07, 0.12, 0.06]); GR = np.array([0.17, 0.27, 0.09]); LG = np.array([0.30, 0.40, 0.14])
    BLK = np.array([0.04, 0.06, 0.05]); ORANGE = np.array([0.92, 0.58, 0.18]); SOLE = np.array([0.10, 0.20, 0.24])
    RIM = np.array([0.85, 0.62, 0.36]); THROAT = np.array([0.35, 0.07, 0.06]); TOOTH = np.array([0.92, 0.86, 0.72])
    nt, npp = {0: (5, 6), 1: (6, 8), 2: (8, 10)}.get(LV, (10, 12))
    total = float(sum(np.linalg.norm(PTS[i + 1] - PTS[i]) for i in range(len(PTS) - 1)))

    def body_sdf(P, lv=None):
        L = LV if lv is None else lv
        d, s, C, T, R = along(P)
        foot = np.clip(1 - (P[:, 2] - 0.0) / 0.12, 0, 1)                            # the foot spreads on the ground
        d = d - 0.07 * foot ** 1.5 * np.clip((s - 0.08) / 0.15, 0, 1) * np.clip((total - 0.22 - s) / 0.1, 0, 1)
        ring = np.abs(np.sin(s * math.pi / 0.028))                                    # ringed all along
        d = d + 0.0045 * (1 - ring) ** 3 * np.clip(s / 0.06, 0, 1)
        if L >= 2: d = d - 0.0012 * (fbm(P, 60.0, 2) - 0.5)                           # soft, wrinkled skin
        if L >= 3: d = d - 0.0004 * (vnoise(P, 260.0) - 0.5)
        # the sucker: the mouth's end hollowed out
        d = smax(d, (P - MOUTH) @ MDIR, 0.006)                                     # cut flat across the mouth
        d = smax(d, -ell(P, MOUTH, (0.045, 0.045, 0.045)), 0.008)                   # and hollowed
        return np.maximum(d, -P[:, 2])
    log('body')
    V, F = S.mc(body_sdf, VOX, np.array([-0.24, -0.45, -0.01]), np.array([0.24, 0.36, 0.53]), band=0.03 if LV >= 2 else None)
    _, s, C, T, R = along(V)
    o = V - C; o /= np.maximum(np.linalg.norm(o, axis=1, keepdims=True), 1e-9)
    ref = np.array([0, -0.6, 0.8])                                                     # its back: up, and behind where it rises
    up = ref - T * (T @ ref)[:, None]; up /= np.maximum(np.linalg.norm(up, axis=1, keepdims=True), 1e-9)
    side = np.cross(T, up)
    cu, cs = np.sum(o * up, 1), np.sum(o * side, 1)                                    # where round the body
    m = fbm(V, 14.0); m2 = fbm(V + 5, 30.0)
    col = mix(GR, DK, (m > 0.5)[:, None] * 0.9)                                        # mottled, in patches
    col = mix(col, LG, ((m2 > 0.58) & (m < 0.5))[:, None] * 0.8)
    col = mix(col, BLK, (m2 < 0.36)[:, None] * 0.7)
    ring = np.abs(np.sin(s * math.pi / 0.028))
    col = col * (0.55 + 0.45 * ring ** 0.4)[:, None]                                   # dark in the grooves between rings
    ph = (s % 0.055) / 0.055 - 0.5                                                     # orange chevrons down the back
    ang = np.arctan2(cs, cu)
    chev = (np.abs(ang) / 0.42 + np.abs(ph + 0.7 * np.abs(ang)) / 0.36) < 1
    chev &= (s > 0.08) & (s < total - 0.06)
    dash = (np.abs(np.abs(ang) - 2.05) < 0.17) & (np.abs(ph) < 0.3) & (s > 0.2) & (s < total - 0.05)   # a row down each flank
    chev |= dash
    col = mix(col, ORANGE * (0.85 + 0.25 * fbm(V, 80.0)[:, None]), chev[:, None])
    col = mix(col, DK * 0.8, np.clip((-cu - 0.2) / 0.5, 0, 1)[:, None] * 0.6)              # darker underneath
    col = mix(col, SOLE, np.clip((0.035 - V[:, 2]) / 0.03, 0, 1)[:, None])            # the teal sole
    M.add(V, F, np.clip(col, 0, 1), 0)

    # ---- the mouth: a pale rim, rings of teeth, the throat ----------------------------------------------------------
    log('mouth')
    a1 = np.cross(MDIR, [1.0, 0, 0]); a1 /= np.linalg.norm(a1); a2 = np.cross(MDIR, a1)
    def rim_sdf(P, lv=None):
        Q = P - (MOUTH + MDIR * 0.002)
        h = Q @ MDIR; q = np.stack([Q @ a1, Q @ a2], 1)
        return np.hypot(np.linalg.norm(q, axis=1) - 0.054, h / 1.2) - 0.016 - 0.002 * (fbm(P, 90.0, 2) - 0.5)
    V, F = S.mc(rim_sdf, VOX * 0.8, MOUTH - 0.09, MOUTH + 0.09)
    M.add(V, F, mix(RIM, RIM * 0.75, fbm(V, 60.0)[:, None]), 1)
    V, F = G.ellipsoid(MOUTH - MDIR * 0.03, (0.042, 0.042, 0.042), nt + 2, npp + 4)       # the throat, deep red
    M.add(V, F, np.tile(THROAT, (len(V), 1)), 8)
    for ring_r, n, depth, ln in ((0.042, 18, -0.004, 0.018), (0.03, 14, -0.014, 0.014)):
        for k in range(n):
            a = 2 * math.pi * (k + 0.5 * (ring_r < 0.04)) / n
            rd = math.cos(a) * a1 + math.sin(a) * a2
            base = MOUTH + MDIR * depth + rd * ring_r
            V, F = G.horn(base, -rd + MDIR * 0.4, ln, 0.0045, bend=MDIR, amt=0.2, seg=4, sides=5)
            M.add(V, F, np.tile(TOOTH, (len(V), 1)), 2)
    return M
