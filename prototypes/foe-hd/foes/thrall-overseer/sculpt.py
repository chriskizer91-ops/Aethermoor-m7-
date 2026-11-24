# Thrall-Overseer (the Hearth Below: veteran), in full detail for the foe kit (November 24, the polish pass): the
# thralls' driver, from Chris's sheet. A head taller than they are, stone and slag in chipped slabs with fire in its
# cracks; a smith's iron mask set in its chest, its three eye-holes burning; two iron vents beside it; burning spikes
# on its shoulders, arms and legs; one lit eye in a ball of stone on a bent stalk rising from behind its shoulders; a
# ragged loincloth; iron bands round its ankles with glowing slits; stone feet with blunt claws. Every slab is a piece
# of its own on one bone, a glowing slab under each (kind 7). x its right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, rivets, cyl, along, rot, local, chipped, crack_depth, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.84), waist=(0, 0, 1.0), chest=(0, 0, 1.14), neck=(-0.12, -0.12, 1.46), head=(-0.17, -0.1, 1.64), top=(-0.22, 0.0, 1.92),
         r_sh=(0.36, 0, 1.44), r_el=(0.45, 0.0, 1.12), r_wr=(0.47, 0.04, 0.86), r_fist=(0.47, 0.05, 0.74),
         l_sh=(-0.36, 0, 1.44), l_el=(-0.45, 0.0, 1.12), l_wr=(-0.47, 0.04, 0.86), l_fist=(-0.47, 0.05, 0.74),
         r_hip=(0.17, 0, 0.8), r_knee=(0.19, 0.02, 0.45), r_ank=(0.19, 0.0, 0.13), r_toe=(0.19, 0.2, 0.03),
         l_hip=(-0.17, 0, 0.8), l_knee=(-0.19, 0.02, 0.45), l_ank=(-0.19, 0.0, 0.13), l_toe=(-0.19, 0.2, 0.03))
BONES = humanoid_bones(J)
SLAG = np.array([0.27, 0.22, 0.19]); SLAG2 = np.array([0.5, 0.42, 0.35]); EMBER = np.array([0.5, 0.15, 0.04])
GLOW = np.array([1.0, 0.52, 0.12]); HOT = np.array([1.0, 0.82, 0.38]); IRON = np.array([0.2, 0.18, 0.18]); IRON2 = np.array([0.4, 0.36, 0.34])
SPIKE = np.array([1.0, 0.45, 0.08]); CLOTH = np.array([0.36, 0.3, 0.24]); CLOTH2 = np.array([0.55, 0.47, 0.37])
M_ROCK, M_IRON, M_GLOW = (0.85, 0.05), (0.45, 0.8), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M); seed = [0]

    def slag(name, bone, c, r, crack=1.0, glow=True, n=14, hole=None):
        seed[0] += 1; c = np.asarray(c, float); r = np.asarray(r, float); sd = seed[0]
        f0 = chipped(c, r, 900 + sd, n=n, off=(0.7, 0.86)); cs = sd * 1.37
        f1 = lambda P: f0(P) + 0.02 * crack * crack_depth(P, fbm, 4.0, 0.016, cs) - 0.004 * (fbm(P, 30.0, 2) - 0.5)
        f = f1 if hole is None else (lambda P: np.maximum(f1(P), -hole(P)))
        def col(V):
            e = crack_depth(V, fbm, 4.0, 0.04, cs)[:, None] * crack
            c_ = mix(SLAG, SLAG2, np.clip(fbm(V, 9.0)[:, None] * 1.5 - 0.4, 0, 1)) * (0.8 + 0.35 * fbm(V, 50.0)[:, None])
            return mix(c_, EMBER, e * 0.8)
        pad = r.max() + 0.04
        suit.add(name, bone, f, c - pad, c + pad, col, mat=M_ROCK)
        if glow and crack > 0:
            suit.add(name + '_fire', bone, lambda P: f0(P) + 0.013, c - pad, c + pad,
                     lambda V: mix(GLOW, HOT, np.clip(fbm(V, 12.0)[:, None] * 1.6 - 0.4, 0, 1)), kind=7, mat=M_GLOW, vox=1.4)
    def spike(name, bone, base, d, ln=0.07, r=0.025):
        base = np.asarray(base, float); d = np.asarray(d, float); d = d / np.linalg.norm(d); tip = base + d * ln
        suit.add(name, bone, lambda P: cap(P, base, tip, r, 0.003), np.minimum(base, tip) - 0.05, np.maximum(base, tip) + 0.05,
                 lambda V: mix(SPIKE * 0.7, HOT, np.clip(along(V, base, tip)[0] * 1.2, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)

    log('the trunk, its mask and vents')
    mc = np.array([-0.02, 0.25, 1.42]); vents = [np.array([0.13, 0.24, 1.3]), np.array([0.13, 0.24, 1.16])]
    hole = lambda P: np.minimum(ell(P, mc - [0, 0.04, 0], (0.12, 0.08, 0.15)), np.minimum(ell(P, vents[0], (0.07, 0.08, 0.07)), ell(P, vents[1], (0.07, 0.08, 0.07))))
    slag('chest', 'chest', (0, 0.0, 1.28), (0.36, 0.25, 0.28), n=18, hole=hole)
    for i, (x, y, z, rr) in enumerate([(0.22, 0.1, 1.42, 0.14), (-0.24, 0.1, 1.4, 0.15), (0.25, -0.13, 1.3, 0.16), (-0.25, -0.12, 1.3, 0.16),
                                       (0.0, -0.17, 1.38, 0.17), (0.0, -0.15, 1.15, 0.15), (-0.14, 0.12, 1.15, 0.13)]):
        slag(f'chest_s{i}', 'chest', (x, y, z), (rr, rr * 0.85, rr * 0.9), hole=hole)
    slag('belly', 'spine', (0, 0.0, 1.04), (0.29, 0.21, 0.14))
    slag('pelvis', 'hips', (0, 0, 0.85), (0.26, 0.19, 0.13))
    def mask(P):                                                                               # a smith's mask, pointed, three eye-holes
        Q = P - mc; x, z = Q[:, 0], Q[:, 2]
        outline = np.maximum(np.maximum(np.abs(x) - 0.1, z - 0.13), (np.abs(x) * 1.3 - z - 0.17) * 0.6)
        face = 0.03 * (1 - (x / 0.11) ** 2)
        d = np.maximum(outline, np.abs(Q[:, 1] - face * 0.5) - 0.018 - face * 0.5)
        for hx, hz, hr in ((0, 0.06, 0.022), (-0.045, 0.0, 0.02), (0.045, 0.0, 0.02), (0, -0.07, 0.025)):
            d = smax(d, -ell(Q, (hx, 0.0, hz), (hr * 0.8, 0.1, hr * 1.3)), 0.004)
        return d - 0.003 * (fbm(P, 30.0, 2) - 0.5)
    suit.add('mask', 'chest', mask, mc - 0.2, mc + 0.2, lambda V: mix(IRON, IRON2, np.clip(fbm(V, 14.0)[:, None] * 1.4 - 0.3, 0, 1)), mat=M_IRON, vox=0.7)
    suit.add('mask_fire', 'chest', lambda P: ell(P, mc - [0, 0.035, 0], (0.08, 0.025, 0.11)), mc - 0.15, mc + 0.15, lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.7)
    for i, v in enumerate(vents):
        suit.add(f'vent{i}', 'chest', lambda P, v=v: np.maximum(cyl(P, v - [0, 0.04, 0], v + [0, 0.03, 0], 0.068), -cyl(P, v - [0, 0.1, 0], v + [0, 0.1, 0], 0.045)),
                 v - 0.12, v + 0.12, lambda V: mix(IRON, IRON2, fbm(V, 14.0)[:, None]), mat=M_IRON, vox=0.7)
        suit.add(f'vent{i}_dark', 'chest', lambda P, v=v: cyl(P, v - [0, 0.06, 0], v - [0, 0.02, 0], 0.05), v - 0.1, v + 0.1, lambda V: np.tile(IRON * 0.3, (len(V), 1)), mat=M_IRON, vox=0.7)
    for i, (b_, d_) in enumerate([((-0.18, 0.2, 1.4), (-0.3, 0.9, 0.2)), ((-0.2, 0.2, 1.33), (-0.4, 0.9, 0.0)), ((-0.2, 0.18, 1.26), (-0.4, 0.9, -0.2))]):
        spike(f'chest_spike{i}', 'chest', b_, d_, 0.1, 0.03)                                    # the big burning spikes on its breast

    log('the stalk and its eye')
    stalk = [np.array(p) for p in [(-0.1, -0.14, 1.4), (-0.13, -0.12, 1.53), (-0.17, -0.09, 1.65), (-0.21, -0.04, 1.75)]]
    for i, (a, b) in enumerate(zip(stalk[:-1], stalk[1:])):
        suit.add(f'stalk{i}', 'neck' if i < 2 else 'head', lambda P, a=a, b=b: cap(P, a, b, 0.095 - 0.01 * i, 0.088 - 0.01 * i) - 0.004 * (fbm(P, 20.0, 2) - 0.5),
                 np.minimum(a, b) - 0.12, np.maximum(a, b) + 0.12, lambda V: mix(SLAG, SLAG2, np.clip(fbm(V, 9.0)[:, None] * 1.4 - 0.3, 0, 1)), mat=M_ROCK)
    ec = np.array([-0.22, 0.0, 1.84])
    slag('eyeball', 'head', ec, (0.13, 0.13, 0.12), crack=0.4, n=16, hole=lambda P: ell(P, ec + [-0.05, 0.1, 0.0], (0.045, 0.06, 0.045)))
    suit.add('eye', 'head', lambda P: ell(P, ec + [-0.05, 0.07, 0.0], (0.04, 0.03, 0.04)), ec - 0.15, ec + 0.15, lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)

    log('arms, legs, loincloth')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        slag(f'{k}_shoulder', f'{k}_upper', sh + [s * 0.03, 0, 0.03], (0.17, 0.18, 0.15))
        slag(f'{k}_arm', f'{k}_upper', (sh + el) / 2, (0.12, 0.12, 0.16))
        slag(f'{k}_fore', f'{k}_fore', (el + wr) / 2, (0.13, 0.13, 0.16))
        slag(f'{k}_fist', f'{k}_hand', fist, (0.11, 0.115, 0.11), crack=0.4, n=16)
        for i in range(3):
            slag(f'{k}_knuckle{i}', f'{k}_hand', fist + [s * (-0.045 + 0.045 * i), 0.09, -0.03], (0.038, 0.038, 0.045), crack=0, n=8)
        for i, (o, d_) in enumerate([((s * 0.13, 0.0, 0.08), (s, 0.1, 0.4)), ((s * 0.12, 0.03, 0.0), (s, 0.2, 0)), ((s * 0.11, 0.0, 0.1), (s, 0, 0.2))]):
            spike(f'{k}_armspike{i}', f'{k}_upper' if i == 0 else f'{k}_fore', (sh if i == 0 else (el + wr) / 2) + np.array(o), d_, 0.06, 0.022)
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        slag(f'{k}_thigh', f'{k}_thigh', (hp + kn) / 2, (0.14, 0.15, 0.2))
        spike(f'{k}_kneespike', f'{k}_thigh', kn + [s * 0.1, 0.06, 0.04], (s, 0.6, 0.2), 0.06, 0.022)
        slag(f'{k}_shin', f'{k}_shin', (kn + an) / 2 + [0, 0.01, 0.04], (0.15, 0.16, 0.17))
        def band(P, an=an):
            return np.maximum(cap(P, an + [0, 0, 0.0], an + [0, 0, 0.07], 0.155, 0.155), -cap(P, an - [0, 0, 0.1], an + [0, 0, 0.2], 0.125, 0.125))
        suit.add(f'{k}_band', f'{k}_shin', lambda P, an=an: smax(band(P, an), -np.maximum(np.abs((np.arctan2(P[:, 1] - an[1], P[:, 0] - an[0]) % 0.5) - 0.25) - 0.06, np.abs(P[:, 2] - an[2] - 0.035) - 0.018), 0.003),
                 an - [0.2, 0.2, 0.05], an + [0.2, 0.2, 0.12], lambda V: mix(IRON, IRON2, fbm(V, 14.0)[:, None]), mat=M_IRON, vox=0.8)
        suit.add(f'{k}_band_fire', f'{k}_shin', lambda P, an=an: cap(P, an, an + [0, 0, 0.07], 0.135, 0.135), an - [0.2, 0.2, 0.05], an + [0.2, 0.2, 0.12],
                 lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=1.0)
        fc = (an + toe) / 2; fc[2] = 0.06
        slag(f'{k}_foot', f'{k}_foot', fc, (0.15, 0.2, 0.07), crack=0.3, n=16)
        for i in range(3):
            slag(f'{k}_claw{i}', f'{k}_foot', toe + [s * (-0.06 + 0.06 * i), 0.03, 0.0], (0.035, 0.05, 0.03), crack=0, n=8)
    for side, y0 in (('front', 0.19), ('back', -0.19)):
        s_ = 1 if y0 > 0 else -1
        def flap(P, y0=y0, s_=s_):
            x, y, z = P[:, 0], P[:, 1], P[:, 2]
            t = np.clip((0.95 - z) / 0.4, 0, 1); w = 0.13 + 0.02 * t
            yc = y0 + s_ * 0.03 * t - s_ * 0.6 * x ** 2
            hem = 0.52 - 0.08 * fbm(P * [1, 1, 0.3], 8.0, 2) + 0.07 * np.abs(np.sin(x * 25))
            return np.maximum(np.maximum(np.abs(y - yc) - 0.009, np.abs(x) - w), np.maximum(z - 0.96, hem - z))
        suit.add(f'loin_{side}', 'hips', flap, (-0.2, y0 - 0.15, 0.4), (0.2, y0 + 0.15, 1.0),
                 lambda V: mix(CLOTH, CLOTH2, np.clip(fbm(V, 7.0)[:, None] * 1.4 - 0.3, 0, 1)) * (0.75 + 0.4 * fbm(V * [1, 1, 0.3], 40.0)[:, None]), mat=(0.85, 0.0))
    suit.add('loin_band', 'hips', lambda P: np.maximum(cap(P, (0, 0, 0.94), (0, 0, 0.965), 0.255, 0.255, scale=(1.08, 0.8, 1)), -cap(P, (0, 0, 0.85), (0, 0, 1.05), 0.24, 0.24, scale=(1.08, 0.8, 1))),
             (-0.36, -0.3, 0.86), (0.36, 0.3, 1.04), lambda V: CLOTH * 0.7 * np.ones((len(V), 1)), mat=(0.85, 0.0))

    save_pieces(HERE, suit.build())
    return M
