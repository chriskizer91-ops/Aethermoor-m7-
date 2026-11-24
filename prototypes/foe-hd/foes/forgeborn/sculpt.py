# Forgeborn (Act Two, Ironspire: veteran), in full detail for the foe kit (November 24, the polish pass): one of
# Harrow's molten servants, a hulking man-shape of black slag in chipped slabs with the fire showing through every
# crack, a furnace grille in its chest, an iron pauldron with burning slits on its left shoulder, a lump of a head
# sunk between its shoulders, a leather belt with a brass buckle and a ragged leather apron front and back, great
# stone fists and boots. Every slab is a piece of its own on one bone, and under each slab a slab a little smaller
# glows (kind 7), so the fire shows exactly where the cracks open. x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, trim, rivets, cyl, along, rot, local, chipped, crack_depth, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.84), waist=(0, 0, 1.0), chest=(0, 0, 1.14), neck=(0, 0.05, 1.52), head=(0, 0.07, 1.56), top=(0, 0.09, 1.84),
         r_sh=(0.38, 0, 1.46), r_el=(0.48, 0.0, 1.13), r_wr=(0.5, 0.04, 0.87), r_fist=(0.5, 0.05, 0.75),
         l_sh=(-0.38, 0, 1.46), l_el=(-0.48, 0.0, 1.13), l_wr=(-0.5, 0.04, 0.87), l_fist=(-0.5, 0.05, 0.75),
         r_hip=(0.17, 0, 0.8), r_knee=(0.19, 0.02, 0.45), r_ank=(0.19, 0.0, 0.12), r_toe=(0.19, 0.2, 0.03),
         l_hip=(-0.17, 0, 0.8), l_knee=(-0.19, 0.02, 0.45), l_ank=(-0.19, 0.0, 0.12), l_toe=(-0.19, 0.2, 0.03))
BONES = humanoid_bones(J)
SLAG = np.array([0.15, 0.095, 0.075]); SLAG2 = np.array([0.33, 0.2, 0.13]); EMBER = np.array([0.55, 0.16, 0.04])
GLOW = np.array([1.0, 0.52, 0.12]); HOT = np.array([1.0, 0.82, 0.38]); IRON = np.array([0.2, 0.15, 0.13]); IRON2 = np.array([0.36, 0.26, 0.2])
BRASS = np.array([0.78, 0.55, 0.22]); LEATHER = np.array([0.27, 0.15, 0.09]); LEATHER2 = np.array([0.42, 0.25, 0.15])
M_ROCK, M_IRON, M_GLOW = (0.85, 0.05), (0.45, 0.8), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M); seed = [0]

    def slag(name, bone, c, r, crack=1.0, glow=True, n=14, hole=None):
        """a chipped slab of slag with cracks pressed in, and a glowing slab under it"""
        seed[0] += 1; c = np.asarray(c, float); r = np.asarray(r, float); sd = seed[0]
        f0 = chipped(c, r, 700 + sd, n=n, off=(0.7, 0.86))                               # flat faces (the sheet's slabs)
        cs = sd * 1.37
        f1 = lambda P: f0(P) + 0.02 * crack * crack_depth(P, fbm, 4.5, 0.022, cs) - 0.004 * (fbm(P, 30.0, 2) - 0.5)
        f = f1 if hole is None else (lambda P: np.maximum(f1(P), -hole(P)))
        def col(V):
            e = crack_depth(V, fbm, 4.5, 0.05, cs)[:, None] * crack
            c_ = mix(SLAG, SLAG2, np.clip(fbm(V, 9.0)[:, None] * 1.5 - 0.4, 0, 1)) * (0.8 + 0.35 * fbm(V, 50.0)[:, None])
            return mix(c_, EMBER, e * 0.8)
        pad = r.max() + 0.04
        suit.add(name, bone, f, c - pad, c + pad, col, mat=M_ROCK)
        if glow and crack > 0:
            suit.add(name + '_fire', bone, lambda P: f0(P) + 0.013, c - pad, c + pad,
                     lambda V: mix(GLOW, HOT, np.clip(fbm(V, 12.0)[:, None] * 1.6 - 0.4, 0, 1)), kind=7, mat=M_GLOW, vox=1.3)

    log('the trunk')
    gc = np.array([0, 0.25, 1.28])
    hole = lambda P: ell(P, gc - [0, 0.02, 0], (0.165, 0.12, 0.115))
    slag('chest', 'chest', (0, 0.0, 1.27), (0.34, 0.25, 0.27), n=18, hole=hole)
    for i, (x, y, z, rr) in enumerate([(0.2, 0.08, 1.38, 0.14), (-0.2, 0.08, 1.38, 0.14), (0.24, -0.12, 1.3, 0.15), (-0.24, -0.12, 1.3, 0.15),
                                       (0.0, -0.17, 1.36, 0.16), (0.13, -0.15, 1.15, 0.13), (-0.13, -0.15, 1.15, 0.13), (0.0, 0.0, 1.48, 0.15)]):
        slag(f'chest_s{i}', 'chest', (x, y, z), (rr, rr * 0.85, rr * 0.9), hole=hole)
    slag('belly', 'spine', (0, 0.0, 1.04), (0.27, 0.2, 0.14))
    slag('pelvis', 'hips', (0, 0, 0.85), (0.25, 0.18, 0.13))
    # the furnace grille in its chest: an iron frame and bars, the fire behind them
    def grille(P):
        Q = P - gc; e = np.hypot(Q[:, 0] / 0.19, Q[:, 2] / 0.13)
        frame = np.maximum(np.abs(e - 1) * 0.13 - 0.02, np.abs(Q[:, 1]) - 0.03)
        bars = np.maximum(np.maximum(np.abs((Q[:, 0] + 0.15) % 0.06 - 0.03) - 0.008, e - 1), np.abs(Q[:, 1] + 0.005) - 0.016)
        band = np.maximum(np.maximum(np.abs(Q[:, 2] - 0.11) - 0.02, np.abs(Q[:, 0]) - 0.21), np.abs(Q[:, 1] + 0.01) - 0.035)
        return np.minimum(np.minimum(frame, bars), band) - 0.004 * np.sqrt(rivets(P, gc + [0, 0, 0.11], (0.21, 0.035, 0.02), 0.01, 0.06, 0.01))
    suit.add('grille', 'chest', grille, gc - 0.26, gc + 0.26, lambda V: mix(IRON, IRON2, fbm(V, 20.0)[:, None]), mat=M_IRON, vox=0.7)
    suit.add('grille_fire', 'chest', lambda P: ell(P, gc - [0, 0.09, 0], (0.18, 0.06, 0.13)), gc - 0.22, gc + 0.22,
             lambda V: mix(HOT, GLOW, np.clip(np.abs(V[:, 0]) * 6, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.7)

    log('belt and apron')
    suit.add('belt', 'hips', lambda P: np.maximum(cap(P, (0, 0, 0.92), (0, 0, 0.96), 0.27, 0.27, scale=(1.08, 0.82, 1)) - 0.0,
                                                 -cap(P, (0, 0, 0.85), (0, 0, 1.05), 0.24, 0.24, scale=(1.08, 0.82, 1))),
             (-0.36, -0.3, 0.84), (0.36, 0.3, 1.04), lambda V: LEATHER * (0.75 + 0.5 * fbm(V, 50.0)[:, None]), mat=(0.7, 0.0))
    suit.add('buckle', 'hips', lambda P: np.maximum(rbox(P, (0, 0.23, 0.94), (0.06, 0.02, 0.045), 0.01), -rbox(P, (0, 0.23, 0.94), (0.035, 0.05, 0.022), 0.006)),
             (-0.1, 0.17, 0.87), (0.1, 0.29, 1.01), lambda V: BRASS * (0.8 + 0.3 * fbm(V, 40.0)[:, None]), mat=(0.3, 0.95), vox=0.6)
    for side, y0 in (('front', 0.18), ('back', -0.18)):
        s_ = 1 if y0 > 0 else -1
        def flap(P, y0=y0, s_=s_):
            x, y, z = P[:, 0], P[:, 1], P[:, 2]
            t = np.clip((0.92 - z) / 0.36, 0, 1); w = 0.15 + 0.02 * t
            yc = y0 + s_ * (0.0 + 0.03 * t) - s_ * 0.6 * x ** 2
            hem = 0.55 - 0.08 * fbm(P * [1, 1, 0.3], 8.0, 2) + 0.06 * np.abs(np.sin(x * 25))
            return np.maximum(np.maximum(np.abs(y - yc) - 0.009, np.abs(x) - w), np.maximum(z - 0.93, hem - z))
        suit.add(f'apron_{side}', 'hips', flap, (-0.22, y0 - 0.16, 0.42), (0.22, y0 + 0.16, 0.96),
                 lambda V: mix(LEATHER, LEATHER2, np.clip(fbm(V, 7.0)[:, None] * 1.4 - 0.3, 0, 1)) * (0.75 + 0.4 * fbm(V * [1, 1, 0.3], 40.0)[:, None]), mat=(0.75, 0.0))

    log('head, shoulders, arms')
    slag('head', 'head', (0, 0.09, 1.66), (0.14, 0.15, 0.15), crack=0.6)
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        slag(f'{k}_shoulder', f'{k}_upper', sh + [s * 0.04, 0, 0.04], (0.19, 0.2, 0.17))
        slag(f'{k}_arm', f'{k}_upper', (sh + el) / 2 + [s * 0.01, 0, -0.02], (0.12, 0.12, 0.16))
        slag(f'{k}_elbow', f'{k}_upper', el, (0.1, 0.1, 0.09), crack=0.6)
        slag(f'{k}_fore', f'{k}_fore', (el + wr) / 2, (0.135, 0.13, 0.16))
        slag(f'{k}_fore2', f'{k}_fore', (el + wr) / 2 + [s * 0.05, -0.04, 0.06], (0.09, 0.09, 0.1))
        slag(f'{k}_fist', f'{k}_hand', fist, (0.115, 0.12, 0.11), crack=0.5, n=16)
        for i in range(3):                                                                   # knuckles
            slag(f'{k}_knuckle{i}', f'{k}_hand', fist + [s * (-0.05 + 0.05 * i), 0.09, -0.02], (0.04, 0.04, 0.045), crack=0, n=8)
    # the iron pauldron on its left shoulder, its slits burning
    pc = A('l_sh') + [-0.06, 0, 0.1]
    def paul(P):
        d = ell(P, pc, (0.22, 0.23, 0.19)); d = np.maximum(d, -(P[:, 2] - (pc[2] - 0.12)))
        d = np.maximum(d, -ell(P, pc - [0, 0, 0.04], (0.17, 0.18, 0.16)))
        for i in range(3):                                                                    # the slits
            z = pc[2] + 0.02 + 0.055 * i
            d = smax(d, -rbox(P, (pc[0] - 0.05, pc[1] + 0.08, z), (0.09, 0.2, 0.012), 0.008, rot(rz=0.6)), 0.004)
        return d - 0.004 * np.sqrt(rivets(P, pc, (0.22, 0.23, 0.19), 0.03, 0.06, 0.012))
    suit.add('l_pauldron', 'l_upper', paul, pc - 0.28, pc + 0.28, lambda V: mix(IRON, IRON2, fbm(V, 10.0)[:, None]) * (0.8 + 0.3 * fbm(V, 50.0)[:, None]), mat=M_IRON)
    suit.add('l_pauldron_fire', 'l_upper', lambda P: ell(P, pc, (0.19, 0.2, 0.16)), pc - 0.25, pc + 0.25, lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=1.3)
    for i, p in enumerate([A('r_sh') + [0.02, 0.0, 0.22], A('r_sh') + [-0.04, -0.06, 0.19], A('head') + [0.06, -0.06, 0.24]]):   # flames on its shoulder
        a, b = p - [0, 0, 0.08], p + [0.02 * i - 0.01, 0, 0.1]
        suit.add(f'flame{i}', 'chest' if i < 2 else 'head', lambda P, a=a, b=b: smin(cap(P, a, b, 0.05, 0.004), cap(P, a + [0.03, 0, 0.02], b + [0.05, 0, -0.05], 0.03, 0.003), 0.02), a - 0.06, b + 0.06,
                 lambda V, a=a: mix(GLOW, HOT, np.clip((V[:, 2] - a[2]) * 9, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)

    log('legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        slag(f'{k}_thigh', f'{k}_thigh', (hp + kn) / 2, (0.145, 0.15, 0.2))
        slag(f'{k}_knee', f'{k}_thigh', kn + [0, 0.05, 0], (0.11, 0.1, 0.1), crack=0.5)
        slag(f'{k}_shin', f'{k}_shin', (kn + an) / 2 + [0, 0.01, 0.03], (0.16, 0.17, 0.17))
        slag(f'{k}_shin2', f'{k}_shin', (kn + an) / 2 + [0, 0.03, -0.1], (0.17, 0.18, 0.1), crack=0.6)
        fc = (an + toe) / 2; fc[2] = 0.07
        slag(f'{k}_foot', f'{k}_foot', fc, (0.15, 0.21, 0.08), crack=0.4, n=16)

    save_pieces(HERE, suit.build())
    return M
