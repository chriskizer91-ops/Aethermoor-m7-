# Old Jaws, the great gar of the Blackwater (One Foe's lane, November 23). python3.12 kit/py/sculpt.py foes/old-jaws <L>
#
# From Chris's sheet (art-in/3d/sheets/sheet-old-jaws.webp): the blackwater-gar grown old and huge, 1.8 m, "all jaw
# and armour": the same fish (blackwater-gar/fish.py) with a shorter, broader snout, a pale old eye, a darker hide;
# a twisted rope round his neck and another round his snout, a cord of beads hanging from it to the great hooked
# tooth (the gar-tooth relic), and blue bubbles rising beside him. x right, y forward, z up.
import math, os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blackwater-gar'))
from fish import build_fish, layout, DEFAULTS
C = dict(DEFAULTS, length=1.8, swim=0.3, arch=0.36, arch_front=0.6, seed=19, snout=0.62, snout_w=1.45, crest=22, deep=1.45, crest_h=0.45, wide=1.45,
         green=(0.2, 0.3, 0.1), dark=(0.06, 0.1, 0.04), eye=(0.85, 0.85, 0.78), spot=(0.3, 0.42, 0.16))

def build(K):
    S, G, LV, VOX, SIDES, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.log
    fbm, mix = S.fbm, S.mix
    M, Lo = build_fish(K, C)
    k, mid = Lo['k'], Lo['mid']
    hy = lambda y: float(np.interp(y, Lo['py'], Lo['ph'])); wy = lambda y: float(np.interp(y, Lo['py'], Lo['pw']))
    ROPE = np.array([0.55, 0.42, 0.24]); ROPE2 = np.array([0.40, 0.29, 0.15])
    nt, npp = {0: (6, 8), 1: (8, 10), 2: (10, 14)}.get(LV, (12, 18))
    def rope(y, grow=1.12, r=0.011):
        """a twisted rope round him at y: two strands round and round each other"""
        a = np.linspace(0, 2 * np.pi, 90)
        ring = np.stack([np.cos(a) * wy(y) * grow, np.full(90, y), mid(y) + np.sin(a) * hy(y) * grow], 1)
        t, N, B = G.frames(ring)
        for j in range(2):
            tw = a * 9 + j * np.pi
            V, F = G.tube(ring + (np.cos(tw)[:, None] * N + np.sin(tw)[:, None] * B) * r * k * 0.6, np.full(90, r * k * 0.75), SIDES)
            M.add(V, F, mix(ROPE, ROPE2, 0.5 * j + 0.3 * fbm(V, 60.0)[:, None]), 1)
    log('ropes, the tooth, bubbles')
    rope(0.2 * k)
    ys = Lo['eye_y'] + 0.06 * k; rope(ys, 1.15, 0.009)
    # from the snout rope a cord hangs, with beads, to the great hooked tooth
    top = np.array([0, ys, mid(ys) - hy(ys) * 1.1])
    cord = np.array([top + [0.004 * k * math.sin(u * 3), 0.01 * k * u, -0.13 * k * u] for u in np.linspace(0, 1, 16)])
    V, F = G.tube(cord, np.full(16, 0.004 * k), SIDES); M.add(V, F, ROPE2, 1)
    for i, (u, col) in enumerate([(0.3, (0.15, 0.45, 0.5)), (0.5, (0.45, 0.25, 0.12)), (0.7, (0.15, 0.45, 0.5)), (0.88, (0.6, 0.55, 0.45))]):
        p = top + [0, 0.01 * k * u, -0.13 * k * u]
        V, F = G.ellipsoid(p, np.array([0.011, 0.011, 0.013]) * k, nt, npp); M.add(V, F, np.array(col), 8)
    base = top + [0, 0.012 * k, -0.135 * k]
    V, F = G.horn(base, [0, 0.12, -1.0], 0.19 * k, 0.03 * k, [0, -1, 0.2], 0.35, seg=18, sides=SIDES + 4)
    t_ = np.clip((base[2] - V[:, 2]) / (0.19 * k), 0, 1)[:, None]
    M.add(V, F, mix(np.array([0.72, 0.62, 0.44]), np.array([0.95, 0.9, 0.78]), t_), 5)
    # bubbles rising round his head, both sides
    rr = np.random.default_rng(23)
    for sx in (1, -1):                                                                # a cluster beside his tail, each side
        for j, (dx, dy, dz, r) in enumerate([(0.0, 0.0, 0.0, 0.032), (0.0, 0.03, -0.055, 0.016), (0.02, -0.04, -0.05, 0.013)]):
            r = r * k
            p = np.array([sx * (0.17 + dx) * k, (-0.42 + dy) * k, mid(-0.42 * k) + (0.05 + dz) * k])
            V, F = G.ellipsoid(p, (r, r, r), nt, npp)
            hl = np.clip((V - p) @ np.array([0.3, 0.4, 0.85]) / r, 0, 1)[:, None] ** 4
            M.add(V, F, mix(np.array([0.12, 0.55, 0.78]), np.array([0.85, 0.97, 1.0]), hl), 8)
    return M
