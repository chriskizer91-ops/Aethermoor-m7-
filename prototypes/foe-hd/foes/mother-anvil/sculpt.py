# Mother Anvil, Champion of the Deeps (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/mother-anvil <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-mother-anvil.webp; 1.6 m to the top of her hammer): the biggest anvil of
# the forge, stood up on four iron legs. A dark iron anvil, its top flared and its horn pointing forward, riveted all
# over; her heart a fire behind iron grates in front and at both sides, between copper bands; a riveted plate on her
# back; four short legs armoured in plates, with clawed feet; on her top a hinged iron arm, its brass collar holding a
# great hammer with brass bands and a golden star on each face. Every plate and limb is a piece of its own, so each
# moves whole with its part and nothing stretches. x right, y forward (the horn), z up.
import math
import numpy as np

LEGS = {'fr': (0.27, 0.36), 'fl': (-0.27, 0.36), 'br': (0.27, -0.36), 'bl': (-0.27, -0.36)}
HIP_Z, KNEE_Z = 0.45, 0.24
HINGE = np.array([0.03, 0.02, 0.99]); COLLAR = np.array([0.2, 0.16, 1.22]); HEAD = np.array([-0.06, -0.03, 1.43])

def box(P, c, h, r=0.0):
    q = np.abs(P - np.asarray(c, np.float32)) - (np.asarray(h, np.float32) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - r

def build(K):
    S, G, LV, VOX, SIDES, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.log
    smin, smax, cap, fbm, mix, vnoise = S.smin, S.smax, S.cap, S.fbm, S.mix, S.vnoise
    M = K.Mesh()
    IRON = np.array([0.17, 0.17, 0.21]); IRON2 = np.array([0.30, 0.29, 0.33]); RUST = np.array([0.33, 0.2, 0.13])
    BRASS = np.array([0.78, 0.52, 0.2]); COPPER = np.array([0.62, 0.3, 0.12]); FIRE = np.array([1.0, 0.55, 0.12])
    HOTC = np.array([1.0, 0.82, 0.38])
    band = 0.03 if LV >= 2 else None
    nt, npp = {0: (5, 8), 1: (6, 10), 2: (8, 12)}.get(LV, (10, 14))
    def worn(P, d, L):
        d = d - 0.004 * (fbm(P, 9.0, 2) - 0.5)                                        # hammered, uneven
        if L >= 2: d = d - 0.0015 * (fbm(P, 45.0, 2) - 0.5)                           # pitted
        if L >= 3: d = d + 0.0007 * (vnoise(P, 160.0) > 0.7)                          # scale and chips
        return d
    def iron_col(V, glow_from=None):
        col = mix(IRON, IRON2, np.clip(fbm(V, 12.0)[:, None] * 1.4 - 0.3, 0, 1))
        col = mix(col, RUST, 0.35 * np.clip(fbm(V + 3, 20.0)[:, None] - 0.5, 0, 1) * 2)
        if glow_from is not None:                                                     # warmed by the heart
            g = np.clip(1 - np.linalg.norm((V - glow_from) / [0.4, 0.55, 0.25], axis=1), 0, 1)[:, None]
            col = mix(col, FIRE * 0.55, 0.45 * g ** 2)
        return np.clip(col, 0, 1)
    def mesh(f, lo, hi, col, kind):
        V, F = S.mc(f, VOX, np.asarray(lo, np.float32), np.asarray(hi, np.float32), band=band)
        M.add(V, F, col(V) if callable(col) else np.tile(col, (len(V), 1)), kind); return V
    HEART = np.array([0, 0, 0.67])
    def rivet(p, r=0.016):
        V, F = G.ellipsoid(p, (r, r, r * 0.8) if True else r, nt, npp)
        M.add(V, F, np.tile(mix(IRON2, BRASS, 0.45), (len(V), 1)), 8)

    # ---- the body: the flared top and its horn, the waist round the heart, the base -------------------------------
    def body_sdf(P, lv=None):
        L = LV if lv is None else lv
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        flare = 0.04 * np.clip((z - 0.84) / 0.13, 0, 1)                                 # the top flares out
        top = box(P * [1, 1, 1], (0, 0, 0.905), (0.48, 0.56, 0.07), 0.012) - flare
        horn_t = np.clip((y - 0.5) / 0.36, 0, 1)
        horn = cap(P, (0, 0.42, 0.87), (0, 0.86, 0.93), 0.15, 0.008, scale=(1.0, 1, 0.75))
        horn = smax(horn, (P[:, 1] - 0.4) * 0 + np.abs(P[:, 0]) * 0.5 + (0.9 - P[:, 2]) * 0.3 - 0.06, 0.01)   # faceted underneath
        d = smin(top, horn, 0.03)
        boss = np.maximum(S.ell(P, (0, 0.41, 0.83), (0.14, 0.12, 0.14)),
                          (np.abs(x) + np.abs(z - 0.83)) * 0.7 + (y - 0.41) * 0.75 - 0.1)  # the horn's root: a faceted boss
        d = smin(d, boss, 0.015)
        d = smax(d, -(0.95 - z + 0.0 * horn_t), 0.004)                                   # the face flat on top
        waist = box(P, (0, 0, 0.67), (0.34, 0.42, 0.17), 0.015)
        base = box(P, (0, 0, 0.475), (0.44, 0.54, 0.045), 0.012)
        d = smin(smin(d, waist, 0.01), base, 0.01)
        # the windows onto the heart: in front (under the horn) and at both sides
        win = np.minimum(box(P, (0, 0.42, 0.665), (0.17, 0.08, 0.115)), box(P, (0, 0, 0.665), (0.45, 0.17, 0.115)))
        d = smax(d, -win, 0.004)
        return worn(P, d, L)
    log('body')
    mesh(body_sdf, (-0.56, -0.62, 0.4), (0.56, 0.92, 1.0), lambda V: iron_col(V, HEART), 0)
    # the fire inside, glowing through the grates
    V, F = G.ellipsoid(HEART, (0.27, 0.39, 0.15), nt + 4, npp + 6)
    M.add(V, F, mix(FIRE, HOTC, 0.6 * fbm(V, 14.0)[:, None]), 7)
    # the grates: iron bars crossing in a lattice, in each window
    def grate_sdf(P, lv=None):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        inside = np.minimum(box(P, (0, 0.4, 0.665), (0.17, 0.02, 0.115)),
                            np.minimum(box(P, (0.325, 0, 0.665), (0.02, 0.17, 0.115)), box(P, (-0.325, 0, 0.665), (0.02, 0.17, 0.115))))
        u = np.where(np.abs(x) > 0.25, y, x)                                         # along the face
        bars = np.minimum(np.abs(((u + z) / 0.085 + 0.5) % 1 - 0.5), np.abs(((u - z) / 0.085 + 0.5) % 1 - 0.5)) * 0.085 - 0.009
        return np.maximum(inside, bars)
    log('grates')
    mesh(grate_sdf, (-0.36, -0.2, 0.53), (0.36, 0.44, 0.8), lambda V: mix(IRON, RUST, 0.4) * (1 + 0.3 * fbm(V, 30.0)[:, None]), 4)
    # copper bands beside each window
    for (c, h) in [((sx * 0.21, 0.425, 0.665), (0.03, 0.012, 0.135)) for sx in (1, -1)] + \
                  [((sx * 0.345, sy * 0.21, 0.665), (0.012, 0.03, 0.135)) for sx in (1, -1) for sy in (1, -1)]:
        mesh(lambda P, c=c, h=h, lv=None: box(P, c, h, 0.006) - 0.001 * (fbm(P, 60.0, 2) - 0.5),
             np.subtract(c, h) - 0.02, np.add(c, h) + 0.02, lambda V: mix(COPPER, BRASS, 0.3 * fbm(V, 25.0)[:, None]), 8)
    # her back plate, riveted
    mesh(lambda P, lv=None: worn(P, box(P, (0, -0.445, 0.72), (0.22, 0.03, 0.2), 0.01), LV if lv is None else lv),
         (-0.26, -0.5, 0.48), (0.26, -0.39, 0.96), lambda V: iron_col(V) * 1.1, 4)
    log('rivets')
    for k in np.linspace(-0.44, 0.44, 9):                                            # along the top's lower edge
        for sy in (1, -1): rivet((k, sy * 0.535, 0.865))
    for k in np.linspace(-0.48, 0.48, 9):
        for sx in (1, -1): rivet((sx * 0.455, k, 0.865))
    for k in np.linspace(-0.4, 0.4, 7):                                              # round the base
        for sy in (1, -1): rivet((k, sy * 0.545, 0.475), 0.013)
    for k in np.linspace(-0.48, 0.48, 9):
        for sx in (1, -1): rivet((sx * 0.445, k, 0.475), 0.013)
    for sx in (1, -1):                                                                # the waist's corners, the back plate
        for z in (0.56, 0.67, 0.78):
            rivet((sx * 0.29, 0.425, z), 0.012); rivet((sx * 0.35, -0.405, z), 0.012)
            rivet((sx * 0.2, -0.48, z), 0.014)

    # ---- four short legs armoured in plates, with clawed feet ------------------------------------------------------
    log('legs')
    for key, (lx, ly) in LEGS.items():
        sx = 1 if lx > 0 else -1
        c = np.array([lx, ly, 0.0])
        def thigh_sdf(P, lv=None, c=c):
            Q = P - c
            hip = box(P, c + [0, 0, 0.42], (0.15, 0.15, 0.05), 0.04)                  # the hip plate under the body
            th = box(P, c + [0, 0, 0.33], (0.135, 0.13, 0.085), 0.04)                 # the thigh, in two plates
            th = smax(th, -box(P, c + [0, 0, 0.33], (0.2, 0.2, 0.004)), 0.002)
            return worn(P, smin(hip, th, 0.01), LV if lv is None else lv)
        mesh(thigh_sdf, c + [-0.2, -0.2, 0.2], c + [0.2, 0.2, 0.49], lambda V: iron_col(V), 0)
        def shin_sdf(P, lv=None, c=c):
            knee = box(P, c + [0, 0.03, 0.225], (0.14, 0.12, 0.045), 0.04)              # the knee plate
            sh = box(P, c + [0, 0.005, 0.135], (0.125, 0.115, 0.07), 0.035)
            sh = smax(sh, -box(P, c + [0, 0, 0.135], (0.2, 0.2, 0.003)), 0.002)
            foot = box(P, c + [0, 0.05, 0.035], (0.135, 0.14, 0.035), 0.025)            # the paw
            d = smin(smin(knee, sh, 0.008), foot, 0.015)
            for k in (-1, 0, 1):                                                       # three toes and their claws
                t0 = c + [k * 0.085, 0.13, 0.035]
                d = smin(d, cap(P, t0, t0 + [k * 0.012, 0.07, -0.01], 0.042, 0.032, scale=(1, 1, 0.85)), 0.012)
                d = smin(d, cap(P, t0 + [k * 0.014, 0.085, -0.005], t0 + [k * 0.016, 0.125, -0.028], 0.017, 0.004), 0.004)
            d = np.maximum(d, -P[:, 2])
            return worn(P, d, LV if lv is None else lv)
        mesh(shin_sdf, c + [-0.2, -0.17, -0.01], c + [0.2, 0.28, 0.29], lambda V: iron_col(V), 0)
        for z in (0.33, 0.135):                                                       # rivets on the plates' sides
            for s2 in (1, -1): rivet(c + [s2 * (0.135 if z > 0.2 else 0.125), 0.0, z], 0.012)
        rivet(c + [0, 0.155, 0.225], 0.014)

    # ---- the hammer-arm: a hinge on her top, an iron arm, a brass collar, the hammer ------------------------------
    log('arm')
    mesh(lambda P, lv=None: worn(P, smin(box(P, HINGE + [0, 0, -0.0], (0.075, 0.06, 0.035), 0.015),
                                         cap(P, HINGE + [-0.06, 0, 0.05], HINGE + [0.06, 0, 0.05], 0.045, 0.045), 0.01), LV if lv is None else lv),
         HINGE - 0.12, HINGE + 0.12, lambda V: iron_col(V), 4)                         # the bracket (on the body)
    for sx in (1, -1): rivet(HINGE + [sx * 0.11, 0, 0.05], 0.022)                      # the hinge's pin ends
    d_arm = COLLAR - HINGE
    def arm_sdf(P, lv=None):
        d = cap(P, HINGE + [0, 0, 0.05], COLLAR, 0.075, 0.08)
        t = np.clip(((P - HINGE) @ d_arm) / (d_arm @ d_arm), 0, 1)
        d = d - 0.006 * (np.abs(np.sin(t * 7 * math.pi)) < 0.25)                       # segment rings
        return worn(P, d, LV if lv is None else lv)
    mesh(arm_sdf, np.minimum(HINGE, COLLAR) - 0.1, np.maximum(HINGE, COLLAR) + 0.1, lambda V: iron_col(V), 0)
    a = d_arm / np.linalg.norm(d_arm)
    mesh(lambda P, lv=None: smax(np.maximum(np.abs((P - COLLAR) @ a) - 0.04, np.linalg.norm((P - COLLAR) - ((P - COLLAR) @ a)[:, None] * a, axis=1) - 0.098) - 0.0, -cap(P, COLLAR + a * 0.06, COLLAR + a, 0.03, 0.03), 0.006),
         COLLAR - 0.12, COLLAR + 0.12, lambda V: BRASS * (0.85 + 0.3 * fbm(V, 40.0)[:, None]), 8)   # the brass collar
    # the hammer: handle from the collar up, head across it
    hd = HEAD - COLLAR; hd = hd / np.linalg.norm(hd)
    ax = np.array([1.0, 0.1, 0.3]); ax -= hd * (ax @ hd); ax /= np.linalg.norm(ax)
    up = np.cross(ax, hd)
    R = np.stack([ax, up, hd], 1)                                                     # hammer frame: x along the head
    def local(P): return (P - HEAD) @ R
    def hammer_sdf(P, lv=None):
        Q = local(P)
        head = box(Q, (0, 0, 0), (0.2, 0.085, 0.085), 0.014)
        head = smax(head, -np.minimum(box(Q, (0.15, 0, 0), (0.008, 0.12, 0.12)), box(Q, (-0.15, 0, 0), (0.008, 0.12, 0.12))), 0.002)
        face = np.minimum(box(Q, (0.205, 0, 0), (0.012, 0.075, 0.075), 0.01), box(Q, (-0.205, 0, 0), (0.012, 0.075, 0.075), 0.01))
        handle = cap(P, COLLAR + (HEAD - COLLAR) * 0.05, HEAD, 0.03, 0.03)
        d = smin(smin(head, face, 0.004), handle, 0.008)
        return worn(P, d, LV if lv is None else lv)
    lo = np.minimum(COLLAR, HEAD) - 0.25; hi = np.maximum(COLLAR, HEAD) + 0.25
    mesh(hammer_sdf, lo, hi, lambda V: iron_col(V) * 1.05, 0)
    for s in (1, -1):                                                                 # brass bands on the head's ends
        mesh(lambda P, s=s, lv=None: box(local(P), (s * 0.175, 0, 0), (0.016, 0.093, 0.093), 0.01),
             HEAD - 0.25, HEAD + 0.25, lambda V: BRASS * (0.9 + 0.2 * fbm(V, 50.0)[:, None]), 8)
    for k in range(4):                                                                # bands on the handle
        p = COLLAR + (HEAD - COLLAR) * (0.22 + 0.15 * k)
        mesh(lambda P, p=p, lv=None: cap(P, p - hd * 0.012, p + hd * 0.012, 0.038, 0.038), p - 0.06, p + 0.06,
             BRASS * 0.9, 8)
    # the golden star on each broad face of the head (it glows)
    for s in (1, -1):
        def star(P, s=s, lv=None):
            Q = local(P); u, v = Q[:, 0] / 0.085, Q[:, 2] / 0.065
            st = (np.abs(u) ** 0.6 + np.abs(v) ** 0.6) ** (1 / 0.6) - 1                 # a four-pointed star
            return np.maximum(st * 0.05, np.abs(Q[:, 1] - s * 0.085) - 0.006)
        mesh(star, HEAD - 0.2, HEAD + 0.2, HOTC * 0.95, 7)
    return M
