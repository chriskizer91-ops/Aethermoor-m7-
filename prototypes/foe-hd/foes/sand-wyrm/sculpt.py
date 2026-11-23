# The Sand Wyrm, relic-bearer of the Dust Trail (Places' desert-and-deep lane, November 23).
#   python3.12 kit/py/sculpt.py foes/sand-wyrm <level>
# From Chris's sheet (art-in/3d/sheets/sheet-sand-wyrm.webp): a great sand-worm risen 1.6 m out of a mound of broken
# rock and sand, arching over so its round mouth looks down at you; its hide is big rock-like plates overlapping like
# shingles (the kit's 'plate' coat), and a gold scale the size of a door (the wyrmscale relic) sits in it either side of
# the arch. The mouth is a thick round lip with ten glass teeth round it; its rim is five separate lip pieces (each with
# two teeth) that hinge outward to open it wide (Swallow) without anything stretching.
# Measured off the side view in sheet pixels (ground 656, the arch's top 32). x its right, y forward, z up.
import math
import numpy as np

S = 1.6 / 624.0; MID = 1000; GROUND = 656
def p(px, py, x=0.0): return np.array([x, (px - MID) * S, (GROUND - py) * S], float)
# the spine, from the sand up and over to the mouth: (sheet x, sheet y, half thickness px)
SPINE = [(880, 790, 150), (878, 600, 148), (866, 500, 144), (860, 400, 140), (870, 300, 130), (905, 215, 120),
         (965, 145, 106), (1050, 98, 88), (1150, 82, 82), (1245, 108, 88), (1325, 158, 96), (1395, 210, 100)]
MOUTH = (1438, 238)           # the middle of the mouth's face
MOUTH_DIR = np.array([0.0, 0.84, -0.54]); MOUTH_DIR /= np.linalg.norm(MOUTH_DIR)
LIP_R, LIP_W = 108 * S, 30 * S       # the lip's ring: its radius to the middle of the rim, its thickness
HOLE_R = 70 * S

def lip_frame():
    """the mouth's centre and two axes across its face"""
    c = p(*MOUTH); n = MOUTH_DIR
    a = np.cross(n, [1.0, 0, 0]); a /= np.linalg.norm(a); b = np.cross(n, a)
    return c, n, a, b
NLIP = 5

def build(K):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep, project = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep, Sd.project
    M = K.Mesh()
    ROCK = np.array([0.44, 0.30, 0.16]); ROCK_L = np.array([0.66, 0.47, 0.27]); ROCK_D = np.array([0.24, 0.15, 0.08])
    SAND = np.array([0.70, 0.52, 0.31]); GOLD = np.array([0.95, 0.66, 0.16]); GOLD_D = np.array([0.55, 0.32, 0.06])
    TOOTH = np.array([0.93, 0.86, 0.72]); THROAT = np.array([0.12, 0.06, 0.04])
    C = np.array([p(px, py) for px, py, _ in SPINE]); R = np.array([r for *_, r in SPINE]) * S
    mc_, mn, ma, mb = lip_frame()

    def body_sdf(P):
        d = np.full(len(P), 9.0, np.float32)
        for i in range(len(C) - 1):
            d = smin(d, cap(P, C[i], C[i + 1], R[i], R[i + 1]), 0.05)
        # the head: a short drum to the mouth's face, a hole down its middle into the dark throat
        hc = mc_ - mn * 0.16
        d = smin(d, cap(P, hc - mn * 0.14, mc_ - mn * 0.02, 128 * S, LIP_R + LIP_W * 0.5), 0.04)
        d = smax(d, -cap(P, mc_ - mn * 0.24, mc_ + mn * 0.2, HOLE_R * 0.7, HOLE_R * 1.05), 0.02)     # (not so deep it comes out the top)
        d = np.maximum(d, -(P[:, 2] + 0.32))                    # it goes on down under the sand (so tipping never shows its end)
        return d

    def tuft_len(P):
        z = P[:, 2]; y = P[:, 1]
        near_mouth = np.exp(-np.sum(((P - mc_) / 0.22) ** 2, 1))
        return (0.34 - 0.08 * sstep(0.4, 1.4, z)) * (1 - 0.5 * near_mouth)
    def flow(P, N):
        # the plates lie back from the head down toward the sand (shingles, so they overlap going down the body)
        j = np.argmin(np.linalg.norm(P[:, None, :] - C[None], axis=2), 1)
        t = C[np.maximum(j - 1, 0)] - C[np.minimum(j + 1, len(C) - 1)]
        t = t / np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-6)
        v = t - N * np.sum(t * N, 1, keepdims=True)
        return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-6)
    def bare(P):
        b = P[:, 2] < 0.03
        b |= np.linalg.norm(P - mc_, axis=1) < LIP_R + LIP_W * 1.6
        return b
    def style(TP, TL, rng):
        n = len(TP)
        W = TL * (0.85 + 0.35 * rng.random(n)); H = TL * (0.13 + 0.05 * rng.random(n))
        Cc = mix(ROCK, ROCK_L, rng.random(n)[:, None] * 0.7) * (0.85 + 0.25 * rng.random(n))[:, None]
        return dict(W=W, H=H, C=Cc)
    log('plates')
    coat = K.Coat(body_sdf, K.lo, K.hi, LV, VOX, tuft_len, flow, bare, style, seed=61, spacing=0.55, shape='plate', place_ew=0.01, log=log)
    full_sdf, place_sdf = coat.full_sdf, coat.place_sdf
    Vb, Fb = Sd.mc(full_sdf, VOX, K.lo, K.hi, band=0.03 if LV >= 2 else None)
    log('body tris', len(Fb))
    top, tid, ts, _ = coat.coat(Vb, True, lv=1)     # (the kit's plate coat can't say which plate at level 2+: q's shape)
    col = mix(ROCK, ROCK_L, (fbm(Vb * 6, 2.0) * 0.8)[:, None])
    has = top > 0.004
    col[has] = coat.TC[tid[has]] * (0.72 + 0.45 * ts[has])[:, None]
    col[~has] = col[~has] * 0.62                                  # the cracks between plates are dark
    # the throat: dark down the hole
    din = np.linalg.norm(Vb - mc_, axis=1) < LIP_R * 1.05
    inside = din & ((Vb - mc_) @ mn < 0.0)
    col[inside] = mix(col[inside], THROAT, 0.9)
    M.add(Vb, Fb, np.clip(col, 0, 1), 0)

    # ---- the mouth's lip: five rigid rim pieces (kind 8), two teeth on each (kind 5), hinged at their back edge ----------
    log('lips, teeth, scales, mound')
    n_ring = {0: 10, 1: 16, 2: 24, 3: 36}.get(LV, 36)
    for k in range(NLIP):
        a0 = 2 * math.pi * k / NLIP + 0.02; a1 = 2 * math.pi * (k + 1) / NLIP - 0.02
        th = np.linspace(a0, a1, n_ring)
        ring = np.array([mc_ + (math.cos(t) * ma + math.sin(t) * mb) * LIP_R for t in th])
        rr = np.full(len(ring), LIP_W) * (1 - 0.25 * (np.linspace(-1, 1, len(ring)) ** 6))
        V, F = G.tube(ring, rr, SIDES + 2)
        cc = mix(ROCK_D, ROCK, sstep(-0.01, 0.03, (V - mc_) @ mn)[:, None]) * (0.85 + 0.25 * fbm(V * 30, 2.0))[:, None]
        M.add(V, F, np.clip(cc, 0, 1), 8)
        for j in range(2):
            t = a0 + (a1 - a0) * (0.28 + 0.44 * j)
            radial = math.cos(t) * ma + math.sin(t) * mb
            base = mc_ + radial * (LIP_R - LIP_W * 0.6) + mn * 0.01
            d = -radial * 0.85 + mn * 0.45
            V, F = G.horn(base, d, 62 * S, 13 * S, -mn, 0.25, SEG + 2, SIDES)
            M.add(V, F, mix(TOOTH, np.array([1, 1, 0.95]), np.clip((V - base) @ (d / np.linalg.norm(d)) / (62 * S), 0, 1)[:, None] * 0.6), 5)

    # ---- the gold scale either side of the arch: a shield of gold with dark holes in it ------------------------------
    sc0 = p(950, 205)
    for s in (1, -1):
        g = sc0 + np.array([s * 0.5, 0, 0])
        base, nrm = project(g[None].astype(np.float32), place_sdf); base, nrm = base[0].astype(float), nrm[0].astype(float)
        up = np.array([0, -0.45, 1.0]); up -= nrm * (up @ nrm); up /= np.linalg.norm(up); side = np.cross(nrm, up)
        Wd, Ht, T = 185 * S * 0.5, 250 * S * 0.5, 0.05
        def scale_sdf(Q):
            q = Q - (base + nrm * 0.03)
            u = q @ side; v = q @ up; w = q @ nrm
            shield = np.maximum(np.abs(u) / Wd + np.maximum(-v, 0) / Ht * 0.6, (np.abs(v) / Ht)) - 1   # a rounded shield
            dd = np.maximum(shield * min(Wd, Ht), np.abs(w + 0.01 * (u / Wd) ** 2 * 0) - T * (0.6 + 0.4 * (1 - (u / Wd) ** 2).clip(0)))
            for hx, hy, hr in [(-0.35, 0.45, 0.16), (0.05, 0.5, 0.13), (0.4, 0.3, 0.12), (-0.45, -0.05, 0.13), (-0.05, 0.05, 0.2), (0.4, -0.2, 0.12), (-0.2, -0.45, 0.13), (0.15, -0.55, 0.1)]:
                hole = np.sqrt((u / Wd - hx) ** 2 + ((v / Ht - hy) * 1.3) ** 2) - hr
                dd = np.maximum(dd, -(hole * min(Wd, Ht)) - (w - T * 0.3).clip(None, 0) * 0 - 0.0 + (w < -T * 0.2) * 9)
            return dd.astype(np.float32)
        lo = base - 0.4; hi = base + 0.4
        V, F = Sd.mc(scale_sdf, 0.03 if LV == 0 else max(VOX * 1.2, 0.004), lo, hi)
        if len(F):
            q = V - base; u = q @ side; v = q @ up
            hol = np.zeros(len(V))
            cc = mix(GOLD, GOLD_D, sstep(0.6, 1.0, np.maximum(np.abs(u) / Wd, np.abs(v) / Ht))[:, None] * 0.7)
            cc = cc * (0.85 + 0.3 * fbm(V * 25, 2.0))[:, None]
            M.add(V, F, np.clip(cc, 0, 1), 8, mat=(0.25, 0.85))     # rigid (kind 4 would be skinned)

    # ---- the mound: shards of rock and sand round its foot (rigid, still) ------------------------------------------
    rng = np.random.default_rng(13)
    for i in range(30):     # the same rocks at every level (the light model's must match the sculpt's, or the bake misses them)
        # a heap of rounded rocks and sand round its foot, bigger near the body, lower further out
        a = rng.random() * 2 * math.pi; rr_ = (205 + 120 * rng.random() ** 0.8) * S     # round the body, not in it (the bake)
        sz = (1.0 - 0.5 * (rr_ / S - 205) / 120) * (0.7 + 0.4 * rng.random())
        c = p(880, GROUND) + np.array([math.cos(a) * rr_ * 1.15, math.sin(a) * rr_, 30 * S * sz])
        rad = np.array([100 * S * sz * (0.8 + 0.5 * rng.random()), 100 * S * sz * (0.8 + 0.5 * rng.random()), 70 * S * sz])
        rot = rng.random() * 6.28
        def rock(Q, c=c, rad=rad, rot=rot):
            q = Q - c; cr, sr = math.cos(rot), math.sin(rot)
            q = np.stack([q[:, 0] * cr - q[:, 1] * sr, q[:, 0] * sr + q[:, 1] * cr, q[:, 2]], 1)
            return (ell(q, (0, 0, 0), rad) - 0.25 * min(rad) * (fbm(Q * 9 + rot, 2.0) - 0.5)).astype(np.float32)
        V, F = Sd.mc(rock, 0.055 if LV == 0 else VOX * 2.6, c - rad.max() * 1.4, c + rad.max() * 1.4)     # rocks: coarse (sand, not the wyrm)
        if len(F):
            V = V[:, :] ; keep = V[:, 2] > -0.04
            M.add(V, F, np.clip(mix(SAND, ROCK_L, rng.random() * 0.7) * (0.75 + 0.35 * fbm(V * 12, 2.0))[:, None], 0, 1), 8)
    return M
