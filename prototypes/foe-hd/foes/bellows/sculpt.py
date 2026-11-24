# The Bellows (Act Two, Ironspire: a forgeborn made into a bellows), in full detail for the foe kit (November 24, the
# polish pass). From Chris's sheet: a swollen body of dark, puffed leather, strapped crosswise with brass-buckled belts,
# a round brass furnace grate burning in its chest, a brass-framed vent on its left shoulder, glowing slits torn in the
# leather all over, puffed arms and legs in leather cuffs, a chimney of a hood for a head with a brass lantern cap, and
# a brass pipe curling up from its right shoulder into the cap. Every part is a piece of its own on one bone; the fire
# under the slits is a slab a little smaller (kind 7). x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, rivets, cyl, along, rot, local, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.8), waist=(0, 0, 0.95), chest=(0, 0, 1.1), neck=(0, 0.05, 1.42), head=(0, 0.06, 1.46), top=(0, 0.04, 1.95),
         r_sh=(0.36, 0, 1.36), r_el=(0.46, 0.0, 1.07), r_wr=(0.48, 0.04, 0.83), r_fist=(0.48, 0.05, 0.72),
         l_sh=(-0.36, 0, 1.36), l_el=(-0.46, 0.0, 1.07), l_wr=(-0.48, 0.04, 0.83), l_fist=(-0.48, 0.05, 0.72),
         r_hip=(0.17, 0, 0.76), r_knee=(0.18, 0.02, 0.42), r_ank=(0.18, 0.0, 0.11), r_toe=(0.18, 0.2, 0.03),
         l_hip=(-0.17, 0, 0.76), l_knee=(-0.18, 0.02, 0.42), l_ank=(-0.18, 0.0, 0.11), l_toe=(-0.18, 0.2, 0.03))
BONES = humanoid_bones(J)
HIDE = np.array([0.16, 0.085, 0.075]); HIDE2 = np.array([0.30, 0.17, 0.13]); STRAP = np.array([0.3, 0.13, 0.07])
STRAP2 = np.array([0.55, 0.28, 0.14]); BRASS = np.array([0.8, 0.56, 0.2]); BRASS2 = np.array([0.5, 0.32, 0.11])
GLOW = np.array([1.0, 0.56, 0.12]); HOT = np.array([1.0, 0.84, 0.42]); GLOVE = np.array([0.13, 0.08, 0.07])
M_HIDE, M_STRAP, M_BRASS, M_GLOW = (0.75, 0.0), (0.6, 0.0), (0.3, 0.95), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M); nseed = [0]

    def slits(P, seed, c, R0):
        """0..1: short upright glowing slashes torn in the leather, scattered over a segment (laid out by the angle round
        its middle and the height, so they always lie on its skin)"""
        P = np.asarray(P); u = np.arctan2(P[:, 1] - c[1], P[:, 0] - c[0]) * R0; z = P[:, 2]
        cu, cz = 0.11, 0.16; iu, iz = np.floor(u / cu + seed * 0.37), np.floor(z / cz + seed * 0.61)
        h = np.sin(iu * 12.9898 + iz * 78.233 + seed * 3.7) * 43758.5453; h = h - np.floor(h)
        fu = (u / cu + seed * 0.37) - iu - 0.5 - 0.25 * (h - 0.5); fz = (z / cz + seed * 0.61) - iz - 0.5
        return np.clip(1 - np.hypot(fu * cu / 0.011, fz * cz / 0.055), 0, 1) * (h > 0.74)

    def puff(name, bone, c, r, slit=1.0, quilt=1.0, col=None):
        nseed[0] += 1; c = np.asarray(c, float); r = np.asarray(r, float); sd = nseed[0]
        def f(P):
            d = ell(P, c, r)
            d = d - 0.009 * quilt * (fbm(P * [1.6, 1.6, 0.6], 9.0, 2) - 0.5)                                # wrinkled leather
            d = d - 0.004 * (fbm(P, 18.0, 2) - 0.5)
            return d + 0.02 * slit * np.minimum(slits(P, sd, c, r[:2].mean()) * 3, 1)
        colour = col or (lambda V: mix(HIDE, HIDE2, np.clip(fbm(V, 6.0)[:, None] * 1.5 - 0.35, 0, 1)) * (0.8 + 0.35 * fbm(V, 45.0)[:, None]))
        pad = r.max() + 0.04
        suit.add(name, bone, f, c - pad, c + pad, colour, mat=M_HIDE)
        if slit > 0:
            suit.add(name + '_fire', bone, lambda P: ell(P, c, r) + 0.012, c - pad, c + pad,
                     lambda V: mix(GLOW, HOT, np.clip(fbm(V, 12.0)[:, None] * 1.6 - 0.4, 0, 1)), kind=7, mat=M_GLOW, vox=1.4)

    def strap(name, bone, pts, w=0.035, t=0.012, buckles=()):
        pts = [np.asarray(p, float) for p in pts]
        def f(P):
            d = 9.0
            for a, b in zip(pts[:-1], pts[1:]):
                d = np.minimum(d, cap(P, a, b, w, w, scale=None))
            return d
        lo = np.min(pts, 0) - 0.06; hi = np.max(pts, 0) + 0.06
        suit.add(name, bone, lambda P: f(P), lo, hi, lambda V: mix(STRAP, STRAP2, np.clip(fbm(V, 15.0)[:, None] * 1.5 - 0.4, 0, 1)), mat=M_STRAP, vox=0.8)
        for i, p in enumerate(buckles):
            p = np.asarray(p, float)
            suit.add(f'{name}_buckle{i}', bone, lambda P, p=p: np.maximum(rbox(P, p, (0.04, 0.03, 0.035), 0.008), -rbox(P, p, (0.024, 0.05, 0.02), 0.006)),
                     p - 0.07, p + 0.07, lambda V: mix(BRASS2, BRASS, fbm(V, 30.0)[:, None]), mat=M_BRASS, vox=0.6)

    log('the body')
    puff('chest', 'chest', (0, 0.0, 1.2), (0.33, 0.27, 0.3))
    puff('belly', 'spine', (0, 0.03, 0.98), (0.3, 0.26, 0.16), slit=0.6)
    puff('pelvis', 'hips', (0, 0, 0.8), (0.27, 0.22, 0.14), slit=0.5)
    # the grate in its chest: a brass ring, bars, the fire behind
    gc = np.array([0, 0.31, 1.2])
    def grate(P):
        Q = P - gc; r = np.hypot(Q[:, 0], Q[:, 2])
        ring = np.maximum(np.abs(r - 0.115) - 0.02, np.abs(Q[:, 1]) - 0.03)
        bars = np.maximum(np.maximum(np.abs(np.abs(Q[:, 0]) - 0.04) - 0.011, r - 0.1), np.abs(Q[:, 1] + 0.005) - 0.018)
        bars = np.minimum(bars, np.maximum(np.maximum(np.abs(Q[:, 0]) - 0.011, r - 0.1), np.abs(Q[:, 1] + 0.005) - 0.018))
        return np.minimum(ring, bars)
    suit.add('grate', 'chest', grate, gc - 0.18, gc + 0.18, lambda V: mix(BRASS2, BRASS, fbm(V, 30.0)[:, None]), mat=M_BRASS, vox=0.6)
    suit.add('grate_fire', 'chest', lambda P: ell(P, gc - [0, 0.04, 0], (0.11, 0.04, 0.11)), gc - 0.16, gc + 0.16,
             lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)
    log('the straps')
    strap('strap_a', 'chest', [(0.3, -0.05, 1.42), (0.12, 0.25, 1.3), (-0.12, 0.27, 1.1), (-0.28, 0.12, 0.95)], buckles=[(0.21, 0.24, 1.36)])
    strap('strap_b', 'chest', [(-0.3, -0.05, 1.42), (-0.12, 0.25, 1.3), (0.12, 0.27, 1.1), (0.28, 0.12, 0.95)], buckles=[(0.2, 0.22, 1.02)])
    strap('strap_back_a', 'chest', [(0.3, -0.05, 1.42), (0.0, -0.27, 1.12)]); strap('strap_back_b', 'chest', [(-0.3, -0.05, 1.42), (0.0, -0.27, 1.12)])
    strap('belt', 'spine', [(0.31 * math.cos(a), 0.27 * math.sin(a) + 0.02, 0.98) for a in np.linspace(0, 2 * math.pi, 25)], w=0.04, buckles=[(0.0, 0.3, 0.98)])
    suit.add('backplate', 'chest', lambda P: rbox(P, (0, -0.27, 1.06), (0.14, 0.02, 0.07), 0.02, rot(rx=-0.3)),
             (-0.2, -0.36, 0.96), (0.2, -0.18, 1.16), lambda V: mix(BRASS2, BRASS, fbm(V, 30.0)[:, None]), mat=M_BRASS, vox=0.7)

    log('the head: a chimney hood, its lantern cap, the pipe')
    hb = np.array([0, 0.05, 1.4])
    def hood(P):
        Q = P - hb; t = np.clip(Q[:, 2] / 0.42, 0, 1); rr = 0.17 * (1 - t) + 0.065 * t
        d = (np.hypot(Q[:, 0], Q[:, 1] + 0.02 * t) - rr) * 0.9
        d = np.maximum(d, np.maximum(-Q[:, 2], Q[:, 2] - 0.43))
        return d - 0.006 * np.abs(np.sin(np.arctan2(Q[:, 1], Q[:, 0]) * 9 + Q[:, 2] * 12)) - 0.004 * (fbm(P, 16.0, 2) - 0.5)
    suit.add('hood', 'head', hood, hb - [0.25, 0.25, 0.05], hb + [0.25, 0.25, 0.5],
             lambda V: mix(HIDE, HIDE2, np.clip(fbm(V, 6.0)[:, None] * 1.4 - 0.3, 0, 1)) * (0.8 + 0.3 * fbm(V, 45.0)[:, None]), mat=M_HIDE)
    lc = hb + [0, 0.0, 0.47]
    suit.add('cap', 'head', lambda P: np.minimum(np.minimum(cyl(P, lc - [0, 0, 0.05], lc - [0, 0, 0.03], 0.08), cyl(P, lc + [0, 0, 0.045], lc + [0, 0, 0.065], 0.07)),
                                                 np.minimum(ell(P, lc + [0, 0, 0.09], (0.05, 0.05, 0.035)), np.maximum(cyl(P, lc - [0, 0, 0.03], lc + [0, 0, 0.045], 0.07), -cyl(P, lc - [0, 0, 0.1], lc + [0, 0, 0.1], 0.058)))),
             lc - 0.14, lc + 0.16, lambda V: mix(BRASS2, BRASS, fbm(V, 30.0)[:, None]), mat=M_BRASS, vox=0.6)
    suit.add('cap_fire', 'head', lambda P: cyl(P, lc - [0, 0, 0.03], lc + [0, 0, 0.045], 0.062), lc - 0.1, lc + 0.1,
             lambda V: np.tile(GLOW, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)
    pipe = [A('r_sh') + [-0.02, -0.04, 0.1]] + [np.array([0.3 * math.cos(a) * 0.95, -0.04 + 0.03 * math.sin(a), 1.5 + 0.38 * math.sin(a)]) for a in np.linspace(0.15, 1.45, 8)]
    pipe.append(lc + [0.06, 0, -0.01])
    def pipef(P):
        d = 9.0
        for a, b in zip(pipe[:-1], pipe[1:]): d = np.minimum(d, cap(P, a, b, 0.05, 0.05))
        return d
    suit.add('pipe', 'head', pipef, np.min(pipe, 0) - 0.07, np.max(pipe, 0) + 0.07, lambda V: mix(BRASS2, BRASS, np.clip(fbm(V, 20.0)[:, None] * 1.6 - 0.3, 0, 1)), mat=M_BRASS, vox=0.7)

    log('arms and legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        puff(f'{k}_shoulder', f'{k}_upper', sh + [s * 0.03, 0, 0.02], (0.16, 0.17, 0.15), slit=0.7)
        puff(f'{k}_arm', f'{k}_upper', (sh + el) / 2 + [s * 0.02, 0, -0.03], (0.135, 0.135, 0.21))
        puff(f'{k}_fore', f'{k}_fore', (el + wr) / 2, (0.125, 0.125, 0.19))
        strap(f'{k}_cuff', f'{k}_fore', [wr + [0.118 * math.cos(a), 0.118 * math.sin(a), 0.06] for a in np.linspace(0, 2 * math.pi, 17)], w=0.017)
        strap(f'{k}_armband', f'{k}_upper', [el + [0.13 * math.cos(a), 0.13 * math.sin(a), 0.07] for a in np.linspace(0, 2 * math.pi, 17)], w=0.016)
        puff(f'{k}_glove', f'{k}_hand', fist, (0.09, 0.1, 0.11), slit=0, quilt=0,
             col=lambda V: GLOVE * (0.8 + 0.4 * fbm(V, 40.0)[:, None]))
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        puff(f'{k}_thigh', f'{k}_thigh', (hp + kn) / 2, (0.16, 0.16, 0.24))
        puff(f'{k}_shin', f'{k}_shin', (kn + an) / 2 + [0, 0.01, 0.02], (0.15, 0.15, 0.21))
        strap(f'{k}_legstrap', f'{k}_thigh', [kn + [0.15 * math.cos(a), 0.15 * math.sin(a), 0.1] for a in np.linspace(0, 2 * math.pi, 17)], w=0.016)
        fc = (an + toe) / 2; fc[2] = 0.07
        suit.add(f'{k}_boot', f'{k}_foot', lambda P, fc=fc: rbox(P, fc, (0.11, 0.17, 0.065), 0.05, taper=(1, 0.2)), fc - 0.25, fc + 0.25,
                 lambda V: GLOVE * (0.8 + 0.4 * fbm(V, 40.0)[:, None]), mat=(0.55, 0.0))
    # the vent on its left shoulder: a brass frame, burning slats
    vc = A('l_sh') + [-0.1, 0.02, 0.06]
    def vent(P):
        d = np.maximum(rbox(P, vc, (0.08, 0.12, 0.1), 0.02, rot(ry=0.5)), -rbox(P, vc, (0.12, 0.09, 0.075), 0.01, rot(ry=0.5)))
        for i in range(3):
            d = np.minimum(d, rbox(P, vc + [-0.035 * 0.5, 0, -0.05 + 0.05 * i], (0.05, 0.09, 0.008), 0.004, rot(ry=0.5)))
        return d
    suit.add('l_vent', 'l_upper', vent, vc - 0.2, vc + 0.2, lambda V: mix(BRASS2, BRASS, fbm(V, 30.0)[:, None]), mat=M_BRASS, vox=0.7)
    suit.add('l_vent_fire', 'l_upper', lambda P: rbox(P, vc + [0.02, 0, 0], (0.05, 0.085, 0.07), 0.01, rot(ry=0.5)), vc - 0.15, vc + 0.15,
             lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.7)

    save_pieces(HERE, suit.build())
    return M
