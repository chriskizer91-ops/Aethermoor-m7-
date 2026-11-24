# Harrow's Journeyman (Act Two, Ironspire: Relic-Bearer of the Runestaff), in full detail for the foe kit (November 24,
# the polish pass). From Chris's sheet: Harrow's apprentice, a young dwarf more forge than man now: wild dark hair, a
# cloth mask over his mouth, eyes that catch the light, a shaggy fur mantle over his shoulders, a ragged plum cloak
# marked with brass runes, a leather jerkin with belt, pouches and a strap, sleeves bound with leather, baggy trousers
# and buckled boots, and the Runestaff in his left hand: a dark shaft banded in brass under a burning compass-star in a
# ring, ribbons hanging. Every part is a piece of its own on one bone (kit/py/armour.py). x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, cyl, along, rot, local, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.92), waist=(0, 0, 1.05), chest=(0, 0, 1.2), neck=(0, 0.01, 1.48), head=(0, 0.02, 1.53), top=(0, 0.02, 1.8),
         r_sh=(0.22, 0, 1.43), r_el=(0.27, 0.0, 1.16), r_wr=(0.28, 0.04, 0.93), r_fist=(0.28, 0.05, 0.85),
         l_sh=(-0.22, 0, 1.43), l_el=(-0.28, 0.02, 1.17), l_wr=(-0.31, 0.15, 1.12), l_fist=(-0.31, 0.19, 1.12),
         r_hip=(0.11, 0, 0.9), r_knee=(0.12, 0.02, 0.5), r_ank=(0.12, 0.0, 0.1), r_toe=(0.12, 0.17, 0.03),
         l_hip=(-0.11, 0, 0.9), l_knee=(-0.12, 0.02, 0.5), l_ank=(-0.12, 0.0, 0.1), l_toe=(-0.12, 0.17, 0.03),
         cape=(0, -0.17, 1.12), hem=(0, -0.22, 0.4))
BONES = humanoid_bones(J) + [('cape', 'chest', J['cape'], J['hem'])]
FUR = np.array([0.17, 0.11, 0.08]); FUR2 = np.array([0.34, 0.23, 0.16]); CLOAK = np.array([0.22, 0.14, 0.15]); CLOAK2 = np.array([0.36, 0.24, 0.22])
LEATHER = np.array([0.34, 0.19, 0.1]); LEATHER2 = np.array([0.5, 0.3, 0.16]); CLOTH = np.array([0.16, 0.11, 0.09]); BOOT = np.array([0.3, 0.17, 0.09])
SKIN = np.array([0.6, 0.43, 0.33]); HAIR = np.array([0.09, 0.065, 0.055]); MASK = np.array([0.08, 0.07, 0.07]); BRASS = np.array([0.82, 0.58, 0.22])
WOOD = np.array([0.13, 0.08, 0.06]); GLOW = np.array([1.0, 0.62, 0.18]); HOT = np.array([1.0, 0.88, 0.5]); RIB = np.array([0.6, 0.3, 0.12])
M_CLOTH, M_LEATHER, M_BRASS, M_GLOW = (0.9, 0.0), (0.65, 0.0), (0.3, 0.95), (0.5, 0.0)
A = lambda k: np.array(J[k], float)
RUNES = [(-0.17, 0.62), (0.18, 0.6), (0.0, 0.5), (-0.2, 0.95), (0.22, 1.0), (0.1, 1.25), (-0.1, 1.32)]   # (x, z) on the cloak


def glyph(x, z, cx, cz, s=0.045):
    """0..1: a rune, a square bracket with a bar (the sheet's), centred at (cx, cz)"""
    u, v = (x - cx) / s, (z - cz) / s
    frame = (np.abs(np.maximum(np.abs(u), np.abs(v)) - 1) < 0.22) & (v < 0.8)
    bar = (np.abs(u - 0.0) < 0.2) & (v > -0.6) & (v < 0.4)
    return (frame | bar).astype(float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M)
    cloth = lambda base, base2: (lambda V: mix(base, base2, np.clip(fbm(V, 7.0)[:, None] * 1.5 - 0.4, 0, 1)) * (0.8 + 0.3 * fbm(V * [1, 1, 0.3], 40.0)[:, None]))

    def tube(name, bone, a, b, ra, rb, col, mat=M_CLOTH, wrinkle=0.004, scale=None):
        a = np.asarray(a, float); b = np.asarray(b, float)
        suit.add(name, bone, lambda P: cap(P, a, b, ra, rb, scale=scale) - wrinkle * (fbm(P * [1.5, 1.5, 0.5], 12.0, 2) - 0.5),
                 np.minimum(a, b) - max(ra, rb) - 0.04, np.maximum(a, b) + max(ra, rb) + 0.04, col, mat=mat)
    def ball(name, bone, c, r, col, mat=M_CLOTH):
        c = np.asarray(c, float); suit.add(name, bone, lambda P: ell(P, c, (r, r, r)), c - r - 0.02, c + r + 0.02, col, mat=mat)

    log('the body: jerkin, belt, pouches, strap')
    suit.add('jerkin', 'chest', lambda P: cap(P, (0, 0, 1.12), (0, 0.0, 1.45), 0.19, 0.17, scale=(1.15, 0.8, 1)) - 0.004 * (fbm(P, 14.0, 2) - 0.5),
             (-0.32, -0.25, 1.0), (0.32, 0.25, 1.6), cloth(LEATHER, LEATHER2), mat=M_LEATHER)
    suit.add('waist', 'spine', lambda P: cap(P, (0, 0, 0.98), (0, 0, 1.12), 0.185, 0.18, scale=(1.15, 0.82, 1)), (-0.3, -0.24, 0.9), (0.3, 0.24, 1.2), cloth(LEATHER, LEATHER2), mat=M_LEATHER)
    suit.add('belt', 'spine', lambda P: np.maximum(cap(P, (0, 0, 1.01), (0, 0, 1.06), 0.2, 0.2, scale=(1.15, 0.84, 1)), -cap(P, (0, 0, 0.9), (0, 0, 1.2), 0.18, 0.18, scale=(1.15, 0.84, 1))),
             (-0.3, -0.24, 0.95), (0.3, 0.24, 1.12), lambda V: LEATHER * 0.6 * (0.8 + 0.3 * fbm(V, 40.0)[:, None]), mat=M_LEATHER)
    suit.add('buckle', 'spine', lambda P: np.maximum(rbox(P, (0, 0.175, 1.035), (0.04, 0.012, 0.03), 0.006), -rbox(P, (0, 0.175, 1.035), (0.024, 0.04, 0.016), 0.004)),
             (-0.06, 0.15, 1.0), (0.06, 0.2, 1.07), lambda V: np.tile(BRASS, (len(V), 1)), mat=M_BRASS, vox=0.6)
    for i, (x, y) in enumerate([(0.12, 0.15), (-0.13, 0.14), (0.2, 0.0)]):
        suit.add(f'pouch{i}', 'spine', lambda P, x=x, y=y: rbox(P, (x, y, 0.97), (0.05, 0.03, 0.055), 0.015), (x - 0.08, y - 0.06, 0.88), (x + 0.08, y + 0.06, 1.05),
                 cloth(LEATHER * 0.8, LEATHER2), mat=M_LEATHER)
    suit.add('strap', 'chest', lambda P: cap(P, (0.18, 0.1, 1.42), (-0.15, 0.17, 1.12), 0.025, 0.025, scale=(1, 0.5, 1)),
             (-0.22, 0.02, 1.05), (0.24, 0.24, 1.5), lambda V: LEATHER * 0.55 * np.ones((len(V), 1)), mat=M_LEATHER)
    suit.add('strap_buckle', 'chest', lambda P: rbox(P, (0.07, 0.165, 1.33), (0.025, 0.01, 0.02), 0.005), (0.02, 0.12, 1.28), (0.12, 0.21, 1.38),
             lambda V: np.tile(BRASS, (len(V), 1)), mat=M_BRASS, vox=0.6)
    def tabard(P):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        t = np.clip((1.0 - z) / 0.45, 0, 1); w = 0.1 + 0.02 * t; yc = 0.16 + 0.02 * t - 0.4 * x ** 2
        hem = 0.56 - 0.06 * fbm(P * [1, 1, 0.2], 9.0, 2) - 0.04 * np.abs(np.sin(x * 30))
        return np.maximum(np.maximum(np.abs(y - yc) - 0.007, np.abs(x) - w), np.maximum(z - 1.0, hem - z))
    suit.add('tabard', 'hips', tabard, (-0.16, 0.08, 0.45), (0.16, 0.25, 1.03),
             lambda V: mix(cloth(CLOAK, CLOAK2)(V), BRASS * 0.8, glyph(V[:, 0], V[:, 2], 0.0, 0.66)[:, None]), mat=M_CLOTH)
    suit.add('hips_cloth', 'hips', lambda P: cap(P, (0, 0, 0.84), (0, 0, 0.98), 0.18, 0.18, scale=(1.15, 0.85, 1)), (-0.28, -0.24, 0.72), (0.28, 0.24, 1.05), cloth(CLOTH, CLOTH * 1.6))

    log('the head: hair, mask, eyes')
    hc = np.array([0, 0.03, 1.62])
    suit.add('head', 'head', lambda P: smin(ell(P, hc, (0.095, 0.11, 0.12)), ell(P, hc + [0, 0.05, -0.06], (0.07, 0.07, 0.06)), 0.03),
             hc - 0.18, hc + 0.18, lambda V: SKIN * (0.85 + 0.25 * fbm(V, 30.0)[:, None]), mat=(0.6, 0.0))
    suit.add('mask', 'head', lambda P: np.maximum(smin(ell(P, hc + [0, 0.025, -0.045], (0.103, 0.115, 0.085)), cyl(P, hc - [0, 0, 0.16], hc - [0, 0, 0.08], 0.09), 0.03),
                                                 (P[:, 2] - (hc[2] - 0.015))),
             hc - 0.25, hc + 0.12, lambda V: MASK * (0.8 + 0.4 * fbm(V * [1, 1, 0.3], 40.0)[:, None]), mat=M_CLOTH)
    for s in (1, -1):
        suit.add(f'eye{s}', 'head', lambda P, s=s: ell(P, hc + [s * 0.04, 0.097, 0.012], (0.016, 0.008, 0.009)), hc - 0.15, hc + 0.15,
                 lambda V: np.tile(GLOW, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.5)
    g = np.random.default_rng(5); locks = []
    for i in range(54):                                                                       # wild hair: locks springing out
        th = g.uniform(0, 2 * math.pi); el = g.uniform(-0.2, 1.3)
        if el < 0.3 and math.sin(th) > 0.3: el = g.uniform(0.6, 1.3)                         # not over the face
        d = np.array([math.cos(th) * math.cos(el), math.sin(th) * math.cos(el), math.sin(el)])
        base = hc + d * np.array([0.09, 0.1, 0.11]); tip = base + d * g.uniform(0.035, 0.06) + [0, 0, -0.035 + 0.02 * math.sin(el)]
        locks.append((base, tip))
    def hair(P):
        d = ell(P, hc + [0, -0.01, 0.02], (0.105, 0.115, 0.115))
        d = np.maximum(d, -(P[:, 2] - (hc[2] + 0.015 - 0.07 * np.clip(-(P[:, 1] - hc[1]) / 0.1, 0, 1))))   # down at the back, up at the brow
        for b_, t_ in locks: d = smin(d, cap(P, b_, t_, 0.034, 0.008), 0.025)
        return d - 0.003 * np.abs(np.sin(np.arctan2(P[:, 1] - hc[1], P[:, 0]) * 30 + P[:, 2] * 40))
    suit.add('hair', 'head', hair, hc - 0.26, hc + 0.26, lambda V: HAIR * (0.8 + 0.5 * fbm(V, 40.0)[:, None]), mat=(0.8, 0.0))
    suit.add('hairclip', 'head', lambda P: rbox(P, hc + [0.07, 0.07, 0.1], (0.02, 0.012, 0.012), 0.004, rot(ry=0.6)), hc - 0.2, hc + 0.2,
             lambda V: np.tile(BRASS, (len(V), 1)), mat=M_BRASS, vox=0.5)

    log('the fur mantle and the cloak')
    mc = np.array([0, -0.015, 1.36])
    def mantle(P):                                                                             # a shawl of fur over his shoulders, hanging in tufts
        Q = P - mc; th = np.arctan2(Q[:, 1], Q[:, 0])
        d = np.abs(ell(P, mc, (0.3, 0.21, 0.17))) - 0.03
        wv = 0.06 + 0.6 * np.clip(1.42 - P[:, 2], 0, 0.2)                                       # open at the front, a V
        d = np.maximum(d, -np.maximum(np.maximum(np.abs(P[:, 0]) - wv, 0.05 - P[:, 1]), np.abs(P[:, 2] - 1.25) - 0.25))
        d = np.maximum(d, -ell(P, mc + [0, 0.02, 0.0], (0.115, 0.105, 0.6)))                 # the neck through it
        hem = mc[2] - 0.1 + 0.06 * np.abs(np.sin(th * 13 + 3 * fbm(P, 4.0, 2))) - 0.06 * np.clip(np.abs(Q[:, 0]) / 0.3, 0, 1)
        d = np.maximum(d, hem - P[:, 2])
        return d - 0.02 * (fbm(P * [1.4, 1.4, 0.6], 11.0, 3) - 0.5) - 0.006 * np.abs(np.sin(th * 21 + 6 * fbm(P, 5.0, 2)))      # clumped fur
    suit.add('mantle', 'chest', mantle, mc - [0.42, 0.34, 0.3], mc + [0.42, 0.34, 0.3], cloth(FUR, FUR2), mat=(0.95, 0.0))
    def cloak(P, z0, z1, w0, w1, y0):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        t = np.clip((z0 - z) / (z0 - z1), 0, 1); w = w0 + (w1 - w0) * t
        yc = y0 - 0.025 * t + 0.09 * (x / 0.3) ** 2 + 0.01 * np.sin(x * 40 + 2 * fbm(P, 3.0, 2)) * t
        d = np.maximum(np.abs(y - yc) - 0.008, np.abs(x) - w)
        hem = z1 - 0.12 * fbm(P * [1, 1, 0.2], 9.0, 2) - 0.07 * np.abs(np.sin(x * 21))
        return np.maximum(d, np.maximum(z - z0, hem - z))
    def cloak_col(V):
        c = cloth(CLOAK, CLOAK2)(V); r = np.zeros(len(V))
        for cx, cz in RUNES: r = np.maximum(r, glyph(V[:, 0], V[:, 2], cx, cz))
        return mix(c, BRASS * 0.85, (r * (V[:, 1] < -0.05))[:, None])
    suit.add('cloak_top', 'chest', lambda P: cloak(P, 1.42, 1.06, 0.3, 0.33, -0.155), (-0.42, -0.36, 0.98), (0.42, -0.02, 1.46), cloak_col, mat=M_CLOTH)
    suit.add('cloak_low', 'cape', lambda P: cloak(P, 1.13, 0.42, 0.33, 0.37, -0.175), (-0.46, -0.4, 0.2), (0.46, 0.02, 1.16), cloak_col, mat=M_CLOTH)

    log('arms, hands, legs, boots')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        ball(f'{k}_shball', 'chest', sh, 0.07, cloth(CLOTH, CLOTH * 1.5))
        tube(f'{k}_sleeve', f'{k}_upper', sh, el, 0.065, 0.058, cloth(CLOTH, CLOTH * 1.6))
        ball(f'{k}_elball', f'{k}_upper', el, 0.056, cloth(CLOTH, CLOTH * 1.6))
        tube(f'{k}_wrap', f'{k}_fore', el + (wr - el) * 0.1, wr, 0.056, 0.048, lambda V: mix(LEATHER * 0.7, LEATHER2, np.abs(np.sin(V[:, 2] * 140 + V[:, 0] * 30))[:, None] * 0.6), mat=M_LEATHER, wrinkle=0.0)
        suit.add(f'{k}_hand', f'{k}_hand', lambda P, fist=fist: rbox(P, fist, (0.038, 0.045, 0.05), 0.025), fist - 0.08, fist + 0.08,
                 lambda V: SKIN * (0.85 + 0.25 * fbm(V, 30.0)[:, None]), mat=(0.6, 0.0))
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        tube(f'{k}_trouser', f'{k}_thigh', hp, kn, 0.1, 0.085, cloth(CLOTH, CLOTH * 1.5), wrinkle=0.012)
        ball(f'{k}_knball', f'{k}_thigh', kn, 0.08, cloth(CLOTH, CLOTH * 1.5))
        tube(f'{k}_shin', f'{k}_shin', kn, an + [0, 0, 0.12], 0.08, 0.07, cloth(CLOTH, CLOTH * 1.5), wrinkle=0.01)
        bc = an + [0, 0.01, 0.06]
        def boot(P, bc=bc, toe=toe):
            d = cap(P, bc + [0, 0, -0.05], bc + [0, 0, 0.16], 0.075, 0.07)
            return smin(d, rbox(P, (toe + bc) / 2 * [1, 1, 0] + [0, 0.02, 0.05], (0.065, 0.13, 0.05), 0.04), 0.03)
        suit.add(f'{k}_boot', f'{k}_foot', boot, bc - [0.15, 0.2, 0.15], bc + [0.15, 0.3, 0.25],
                 lambda V, bc=bc: mix(BOOT, BOOT * 0.5, ((np.abs(V[:, 2] - bc[2] - 0.1) < 0.015) | (np.abs(V[:, 2] - bc[2]) < 0.012)).astype(float)[:, None]) * (0.8 + 0.3 * fbm(V, 40.0)[:, None]), mat=M_LEATHER)
        suit.add(f'{k}_bootbuckle', f'{k}_foot', lambda P, bc=bc, s=s: rbox(P, bc + [s * 0.075, 0, 0.1], (0.01, 0.025, 0.018), 0.004), bc - 0.15, bc + 0.2,
                 lambda V: np.tile(BRASS, (len(V), 1)), mat=M_BRASS, vox=0.5)

    log('the Runestaff')
    sx, sy = J['l_fist'][0], J['l_fist'][1]; top = np.array([sx, sy, 1.78])
    suit.add('shaft', 'l_hand', lambda P: cyl(P, (sx, sy, 0.03), (sx, sy, 1.66), 0.02) - 0.003 * (fbm(P, 25.0, 2) - 0.5), (sx - 0.05, sy - 0.05, 0.0), (sx + 0.05, sy + 0.05, 1.7),
             lambda V: mix(WOOD, BRASS, (((V[:, 2] % 0.32) < 0.025) | (V[:, 2] < 0.08)).astype(float)[:, None]) * (0.8 + 0.3 * fbm(V, 40.0)[:, None]), mat=(0.6, 0.2), vox=0.55)
    def star(P, grow=0.0):
        Q = P - top; x, z = Q[:, 0], Q[:, 2]
        ring = np.maximum(np.abs(np.hypot(x, z) - 0.075) - 0.008, np.abs(Q[:, 1]) - 0.012)
        rays = np.maximum(np.minimum(np.abs(x) * 4.8 + np.abs(z) - 0.115, np.abs(z) * 4.8 + np.abs(x) - 0.115) * 0.2, np.abs(Q[:, 1]) - 0.014 - grow)   # a four-point star
        spike = cap(P, top + [0, 0, 0.11], top + [0, 0, 0.17], 0.012, 0.002)
        return np.minimum(np.minimum(ring, rays - grow), spike)
    suit.add('star', 'l_hand', star, top - 0.2, top + 0.22, lambda V: np.tile(BRASS, (len(V), 1)), mat=M_BRASS, vox=0.5)
    suit.add('star_fire', 'l_hand', lambda P: ell(P, top, (0.035, 0.02, 0.035)), top - 0.08, top + 0.08, lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.5)
    for i, (x0, ln) in enumerate([(0.03, 0.17), (0.05, 0.12)]):
        suit.add(f'ribbon{i}', 'l_hand', lambda P, x0=x0, ln=ln: rbox(P, top + [x0, 0.0, -0.11 - ln / 2], (0.012, 0.003, ln / 2), 0.002, rot(ry=0.1 * i)),
                 top - [0.2, 0.1, 0.4], top + [0.2, 0.1, 0.0], lambda V: mix(RIB, BRASS, (np.abs(V[:, 2] - top[2] + 0.2) < 0.02).astype(float)[:, None]), mat=M_CLOTH, vox=0.5)

    save_pieces(HERE, suit.build())
    return M
