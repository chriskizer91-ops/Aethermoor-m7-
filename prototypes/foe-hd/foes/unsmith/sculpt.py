# The Unsmith (the last foe: Harrow Ironvein, Hilda's twin), in full detail for the foe kit (November 24, the polish
# pass). From Chris's sheet: a broad dwarf smith, red hair and a great red beard in two braids with gold beads, a
# craggy face, a ragged black cloak from his shoulders to his boots, a dark leather apron studded with brass, a gold
# anvil on its bib and a pocket below, a gold chain across his chest with two square gold clasps, a dark shirt rolled
# to the elbow, bare forearms, brown trousers, cuffed boots, and the Unmaking Hammer in his left hand: a long dark
# haft and a head of stone cracked with violet fire. Every part is a piece of its own on one bone (kit/py/armour.py).
# x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, cyl, along, rot, local, chipped, crack_depth, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.95), waist=(0, 0, 1.08), chest=(0, 0, 1.24), neck=(0, 0.02, 1.55), head=(0, 0.03, 1.6), top=(0, 0.03, 1.9),
         r_sh=(0.26, 0, 1.49), r_el=(0.32, 0.0, 1.2), r_wr=(0.34, 0.04, 0.96), r_fist=(0.34, 0.05, 0.86),
         l_sh=(-0.26, 0, 1.49), l_el=(-0.32, 0.03, 1.21), l_wr=(-0.3, 0.17, 1.27), l_fist=(-0.3, 0.21, 1.28),
         r_hip=(0.13, 0, 0.92), r_knee=(0.14, 0.02, 0.52), r_ank=(0.14, 0.0, 0.11), r_toe=(0.14, 0.19, 0.03),
         l_hip=(-0.13, 0, 0.92), l_knee=(-0.14, 0.02, 0.52), l_ank=(-0.14, 0.0, 0.11), l_toe=(-0.14, 0.19, 0.03),
         cape=(0, -0.2, 1.15), hem=(0, -0.26, 0.25))
BONES = humanoid_bones(J) + [('cape', 'chest', J['cape'], J['hem'])]
CLOAK = np.array([0.11, 0.11, 0.13]); CLOAK2 = np.array([0.24, 0.24, 0.27]); APRON = np.array([0.28, 0.15, 0.08]); APRON2 = np.array([0.45, 0.26, 0.14])
SHIRT = np.array([0.18, 0.15, 0.15]); TROUSER = np.array([0.33, 0.2, 0.12]); BOOT = np.array([0.32, 0.18, 0.1]); SKIN = np.array([0.72, 0.48, 0.36])
HAIR = np.array([0.75, 0.3, 0.08]); HAIR2 = np.array([0.95, 0.5, 0.15]); GOLD = np.array([0.88, 0.64, 0.22]); STONE = np.array([0.24, 0.2, 0.3])
STONE2 = np.array([0.4, 0.34, 0.48]); HAFT = np.array([0.22, 0.14, 0.28]); VIOLET = np.array([0.72, 0.3, 1.0]); VHOT = np.array([0.9, 0.7, 1.0])
M_CLOTH, M_LEATHER, M_GOLD, M_GLOW = (0.9, 0.0), (0.65, 0.0), (0.3, 0.95), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M)
    cloth = lambda base, base2: (lambda V: mix(base, base2, np.clip(fbm(V, 7.0)[:, None] * 1.5 - 0.4, 0, 1)) * (0.8 + 0.3 * fbm(V * [1, 1, 0.3], 40.0)[:, None]))
    gold = lambda V: GOLD * (0.8 + 0.3 * fbm(V, 40.0)[:, None])

    def tube(name, bone, a, b, ra, rb, col, mat=M_CLOTH, wrinkle=0.006, scale=None):
        a = np.asarray(a, float); b = np.asarray(b, float)
        suit.add(name, bone, lambda P: cap(P, a, b, ra, rb, scale=scale) - wrinkle * (fbm(P * [1.5, 1.5, 0.5], 12.0, 2) - 0.5),
                 np.minimum(a, b) - max(ra, rb) - 0.05, np.maximum(a, b) + max(ra, rb) + 0.05, col, mat=mat)
    def ball(name, bone, c, r, col, mat=M_CLOTH):
        c = np.asarray(c, float); suit.add(name, bone, lambda P: ell(P, c, (r, r, r)), c - r - 0.02, c + r + 0.02, col, mat=mat)

    log('the body: shirt, apron, chain')
    suit.add('torso', 'chest', lambda P: cap(P, (0, 0, 1.14), (0, 0.0, 1.47), 0.22, 0.2, scale=(1.15, 0.82, 1)) - 0.005 * (fbm(P, 12.0, 2) - 0.5),
             (-0.36, -0.28, 1.0), (0.36, 0.28, 1.62), cloth(SHIRT, SHIRT * 1.6))
    suit.add('waist', 'spine', lambda P: cap(P, (0, 0, 1.0), (0, 0, 1.14), 0.215, 0.215, scale=(1.15, 0.85, 1)), (-0.32, -0.26, 0.92), (0.32, 0.26, 1.2), cloth(SHIRT, SHIRT * 1.6))
    def apron(P, z0, z1):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        w = np.where(z > 1.12, 0.14 + 0.03 * (1.5 - z), 0.22)
        yc = 0.19 + 0.03 * np.clip((1.05 - z) / 0.5, 0, 1) - 0.35 * x ** 2 + np.where(z > 1.12, -0.04 * (z - 1.12), 0)
        d = np.maximum(np.abs(y - yc) - 0.012, np.abs(x) - w)
        return np.maximum(d, np.maximum(z - z0, z1 - z)) - 0.003 * (fbm(P, 20.0, 2) - 0.5)
    def apron_col(V):
        c = cloth(APRON, APRON2)(V); x, z = V[:, 0], V[:, 2]
        stud = (np.abs(np.abs(x) - (np.where(z > 1.12, 0.12, 0.2))) < 0.012) & ((z * 30) % 1 < 0.35)
        anvil = ((np.abs(x) < 0.07) & (np.abs(z - 1.39) < 0.018)) | ((np.abs(x) < 0.025) & (np.abs(z - 1.35) < 0.03)) | ((np.abs(x) < 0.05) & (np.abs(z - 1.315) < 0.012))
        pocket = (np.abs(x) < 0.09) & (np.abs(z - 0.92) < 0.08) & ((np.abs(np.abs(x) - 0.09) < 0.008) | (np.abs(z - 0.995) < 0.008))
        c = mix(c, GOLD, (stud | anvil).astype(float)[:, None]); return mix(c, APRON * 0.5, pocket.astype(float)[:, None])
    suit.add('apron_bib', 'chest', lambda P: apron(P, 1.46, 1.1), (-0.25, 0.05, 1.05), (0.25, 0.3, 1.5), apron_col, mat=M_LEATHER)
    suit.add('apron_skirt', 'hips', lambda P: apron(P, 1.12, 0.6), (-0.3, 0.05, 0.55), (0.3, 0.32, 1.16), apron_col, mat=M_LEATHER)
    suit.add('pocket', 'hips', lambda P: rbox(P, (0, 0.225, 0.92), (0.09, 0.012, 0.08), 0.01), (-0.12, 0.18, 0.82), (0.12, 0.27, 1.02), cloth(APRON * 0.8, APRON2), mat=M_LEATHER)
    suit.add('belt', 'spine', lambda P: np.maximum(cap(P, (0, 0, 1.09), (0, 0, 1.13), 0.225, 0.225, scale=(1.15, 0.87, 1)), -cap(P, (0, 0, 1.0), (0, 0, 1.2), 0.205, 0.205, scale=(1.15, 0.87, 1))),
             (-0.32, -0.26, 1.04), (0.32, 0.26, 1.18), lambda V: APRON * 0.55 * np.ones((len(V), 1)), mat=M_LEATHER)
    for i, x in enumerate((0.1, -0.1)):                                                        # the chain's clasps, square, gold
        suit.add(f'clasp{i}', 'chest', lambda P, x=x: rbox(P, (x, 0.205, 1.47), (0.028, 0.012, 0.028), 0.006), (x - 0.05, 0.17, 1.43), (x + 0.05, 0.24, 1.51), gold, mat=M_GOLD, vox=0.5)
    suit.add('chain', 'chest', lambda P: np.maximum(np.abs(np.hypot(P[:, 0] / 1.6, P[:, 2] - 1.52) - 0.05) - 0.006, np.abs(P[:, 1] - 0.2) - 0.008) + 0.0 * P[:, 0],
             (-0.12, 0.17, 1.42), (0.12, 0.24, 1.5), gold, mat=M_GOLD, vox=0.5)

    log('the head: face, hair, beard')
    hc = np.array([0, 0.04, 1.69])
    def face(P):
        d = smin(ell(P, hc, (0.1, 0.11, 0.125)), ell(P, hc + [0, 0.085, -0.02], (0.03, 0.04, 0.035)), 0.02)      # the nose
        d = smin(d, ell(P, hc + [0, 0.07, 0.04], (0.08, 0.04, 0.02)), 0.02)                                       # the brow
        for s in (1, -1): d = smax(d, -ell(P, hc + [s * 0.04, 0.1, 0.015], (0.02, 0.02, 0.012)), 0.006)           # eyes deep under it
        return d
    suit.add('face', 'head', face, hc - 0.18, hc + 0.18, lambda V: SKIN * (0.85 + 0.25 * fbm(V, 30.0)[:, None]), mat=(0.6, 0.0))
    for s in (1, -1):
        suit.add(f'eye{s}', 'head', lambda P, s=s: ell(P, hc + [s * 0.04, 0.094, 0.015], (0.013, 0.008, 0.008)), hc - 0.15, hc + 0.15,
                 lambda V: np.tile(np.array([0.1, 0.08, 0.07]), (len(V), 1)), mat=(0.3, 0.0), vox=0.5)
    hairc = lambda V: mix(HAIR, HAIR2, np.clip(fbm(V * [1, 1, 3], 25.0)[:, None] * 1.6 - 0.4, 0, 1))
    def hair(P):
        Q = P - hc; th = np.arctan2(Q[:, 1], Q[:, 0])
        d = ell(P, hc + [0, -0.015, 0.03], (0.112, 0.12, 0.125))
        d = np.maximum(d, -(Q[:, 2] - 0.05 + 0.1 * np.clip(-(Q[:, 1]) / 0.12, 0, 1)))       # off the brow, down the back
        return d - 0.012 * np.abs(np.sin(th * 10 + Q[:, 2] * 25 + 3 * fbm(P, 8.0, 2))) - 0.008 * (fbm(P, 14.0, 2) - 0.5)
    suit.add('hair', 'head', hair, hc - 0.2, hc + 0.2, hairc, mat=(0.8, 0.0))
    def beard(P):
        Q = P - hc
        d = ell(P, hc + [0, 0.06, -0.09], (0.1, 0.07, 0.1))
        d = np.maximum(d, Q[:, 2] - 0.01 + 0.05 * (np.abs(Q[:, 0]) < 0.035) * (Q[:, 1] > 0.05))            # the mouth line
        for s in (1, -1):
            d = smin(d, cap(P, hc + [s * 0.035, 0.08, -0.14], hc + [s * 0.04, 0.1, -0.27], 0.03, 0.018), 0.02)  # two braids
        return d - 0.01 * np.abs(np.sin(Q[:, 0] * 60 + 3 * fbm(P, 8.0, 2))) - 0.006 * (fbm(P, 16.0, 2) - 0.5)
    suit.add('beard', 'head', beard, hc - [0.18, 0.1, 0.36], hc + [0.18, 0.22, 0.05], hairc, mat=(0.8, 0.0))
    for s in (1, -1):
        for j, z in enumerate((-0.17, -0.21)):                                                   # gold beads on the braids
            c = hc + [s * 0.037, 0.088 + 0.006 * j, z]
            suit.add(f'bead{s}{j}', 'head', lambda P, c=c: cyl(P, c - [0, 0, 0.016], c + [0, 0, 0.016], 0.03), c - 0.06, c + 0.06, gold, mat=M_GOLD, vox=0.5)

    log('the cloak')
    def cloak(P, z0, z1, w0, w1, y0):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        t = np.clip((z0 - z) / (z0 - z1), 0, 1); w = w0 + (w1 - w0) * t
        yc = y0 - 0.03 * t + 0.13 * (x / 0.32) ** 2 + 0.014 * np.sin(x * 34 + 2 * fbm(P, 3.0, 2)) * (0.3 + t)
        d = np.maximum(np.abs(y - yc) - 0.009, np.abs(x) - w)
        hem = z1 - 0.14 * fbm(P * [1, 1, 0.2], 8.0, 2) - 0.08 * np.abs(np.sin(x * 19))
        return np.maximum(d, np.maximum(z - z0, hem - z)) - 0.005 * np.abs(np.sin(x * 70 + z * 8)) * t
    ccol = lambda V: cloth(CLOAK, CLOAK2)(V)
    suit.add('cloak_top', 'chest', lambda P: cloak(P, 1.56, 1.08, 0.34, 0.39, -0.18), (-0.5, -0.4, 1.0), (0.5, 0.1, 1.6), ccol, mat=M_CLOTH)
    suit.add('cloak_low', 'cape', lambda P: cloak(P, 1.15, 0.2, 0.39, 0.44, -0.21), (-0.55, -0.45, 0.0), (0.55, 0.12, 1.18), ccol, mat=M_CLOTH)
    def collar(P):
        Q = P - np.array([0, -0.02, 1.52]); th = np.arctan2(Q[:, 1], Q[:, 0])
        d = np.abs(ell(P, (0, -0.02, 1.46), (0.33, 0.25, 0.14))) - 0.025
        d = np.maximum(d, -ell(P, (0, 0.03, 1.5), (0.14, 0.13, 0.4)))
        d = np.maximum(d, (1.38 - 0.06 * np.abs(np.sin(th * 9 + 2 * fbm(P, 4.0, 2)))) - P[:, 2])
        return np.maximum(d, -np.maximum(np.abs(P[:, 0]) - 0.15, 0.08 - P[:, 1])) - 0.006 * (fbm(P, 14.0, 2) - 0.5)
    suit.add('collar', 'chest', collar, (-0.42, -0.34, 1.25), (0.42, 0.3, 1.66), ccol, mat=M_CLOTH)

    log('arms, legs, boots')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        ball(f'{k}_shball', 'chest', sh, 0.09, cloth(SHIRT, SHIRT * 1.6))
        tube(f'{k}_sleeve', f'{k}_upper', sh, el, 0.085, 0.075, cloth(SHIRT, SHIRT * 1.6), wrinkle=0.012)
        tube(f'{k}_roll', f'{k}_upper', el + (sh - el) * 0.12, el, 0.08, 0.078, cloth(SHIRT * 0.8, SHIRT * 1.4), wrinkle=0.0)
        tube(f'{k}_forearm', f'{k}_fore', el, wr, 0.06, 0.05, lambda V: SKIN * (0.85 + 0.25 * fbm(V, 30.0)[:, None]), mat=(0.6, 0.0), wrinkle=0.002)
        suit.add(f'{k}_hand', f'{k}_hand', lambda P, fist=fist: rbox(P, fist, (0.045, 0.05, 0.055), 0.03), fist - 0.09, fist + 0.09,
                 lambda V: SKIN * (0.85 + 0.25 * fbm(V, 30.0)[:, None]), mat=(0.6, 0.0))
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        tube(f'{k}_trouser', f'{k}_thigh', hp, kn, 0.115, 0.095, cloth(TROUSER, TROUSER * 1.5), wrinkle=0.014)
        ball(f'{k}_knball', f'{k}_thigh', kn, 0.09, cloth(TROUSER, TROUSER * 1.5))
        tube(f'{k}_shin', f'{k}_shin', kn, an + [0, 0, 0.18], 0.09, 0.08, cloth(TROUSER, TROUSER * 1.5), wrinkle=0.012)
        bc = an + [0, 0.01, 0.07]
        def boot(P, bc=bc, toe=toe):
            d = cap(P, bc + [0, 0, -0.06], bc + [0, 0, 0.18], 0.085, 0.08)
            d = smin(d, cyl(P, bc + [0, 0, 0.14], bc + [0, 0, 0.21], 0.098), 0.01)               # the cuff
            return smin(d, rbox(P, (toe + bc) / 2 * [1, 1, 0] + [0, 0.02, 0.055], (0.075, 0.14, 0.055), 0.045), 0.03)
        suit.add(f'{k}_boot', f'{k}_foot', boot, bc - [0.16, 0.2, 0.15], bc + [0.16, 0.32, 0.26],
                 lambda V: BOOT * (0.8 + 0.3 * fbm(V, 40.0)[:, None]), mat=M_LEATHER)

    log('the Unmaking Hammer')
    hx, hy = J['l_fist'][0], J['l_fist'][1] + 0.01; hz = 1.74
    suit.add('haft', 'l_hand', lambda P: cyl(P, (hx, hy, 0.98), (hx, hy, hz), 0.024) - 0.003 * np.abs(np.sin(P[:, 2] * 120)) * (P[:, 2] < 1.4),
             (hx - 0.06, hy - 0.06, 0.95), (hx + 0.06, hy + 0.06, hz + 0.05), lambda V: HAFT * (0.8 + 0.4 * np.abs(np.sin(V[:, 2] * 120)))[:, None], mat=(0.5, 0.2), vox=0.55)
    suit.add('haftcap', 'l_hand', lambda P: ell(P, (hx, hy, 0.975), (0.035, 0.035, 0.03)), (hx - 0.06, hy - 0.06, 0.93), (hx + 0.06, hy + 0.06, 1.02), lambda V: HAFT * 1.2 * np.ones((len(V), 1)), mat=(0.4, 0.4), vox=0.5)
    hcn = np.array([hx - 0.02, hy, hz + 0.05]); f0 = chipped(hcn, (0.21, 0.125, 0.125), 77, n=14, off=(0.72, 0.88))
    suit.add('hammerhead', 'l_hand', lambda P: f0(P) + 0.014 * crack_depth(P, fbm, 6.0, 0.02, 4.2), hcn - 0.22, hcn + 0.22,
             lambda V: mix(mix(STONE, STONE2, np.clip(fbm(V, 10.0)[:, None] * 1.5 - 0.3, 0, 1)), VIOLET * 0.5, crack_depth(V, fbm, 6.0, 0.045, 4.2)[:, None]), mat=(0.7, 0.1))
    suit.add('hammer_fire', 'l_hand', lambda P: f0(P) + 0.009, hcn - 0.22, hcn + 0.22, lambda V: mix(VIOLET, VHOT, np.clip(fbm(V, 14.0)[:, None] * 1.6 - 0.5, 0, 1)), kind=7, mat=M_GLOW, vox=1.2)

    save_pieces(HERE, suit.build())
    return M
