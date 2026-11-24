# Cinder-Thrall (the Hearth Below: rabble), in full detail for the foe kit (November 24, the polish pass): one of the
# Unsmith's ash-men, from Chris's sheet. Lanky, long in the arm, packed ash laid on it in overlapping flakes like
# shingles, a rag tied over its eyes that burn through it, its knot and tails hanging behind, a coal for a heart, and
# fire in its cracks. Every limb is a piece of its own on one bone; under each a slightly smaller one glows (kind 7),
# so the fire shows where the cracks open. x its right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, cyl, along, rot, local, crack_depth, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.82), waist=(0, 0, 0.97), chest=(0, 0, 1.1), neck=(0, 0.03, 1.36), head=(0, 0.05, 1.41), top=(0, 0.05, 1.69),
         r_sh=(0.21, 0, 1.32), r_el=(0.27, 0.0, 1.05), r_wr=(0.29, 0.04, 0.8), r_fist=(0.29, 0.05, 0.69),
         l_sh=(-0.21, 0, 1.32), l_el=(-0.27, 0.0, 1.05), l_wr=(-0.29, 0.04, 0.8), l_fist=(-0.29, 0.05, 0.69),
         r_hip=(0.1, 0, 0.8), r_knee=(0.12, 0.02, 0.44), r_ank=(0.13, 0.0, 0.1), r_toe=(0.14, 0.15, 0.03),
         l_hip=(-0.1, 0, 0.8), l_knee=(-0.12, 0.02, 0.44), l_ank=(-0.13, 0.0, 0.1), l_toe=(-0.14, 0.15, 0.03))
BONES = humanoid_bones(J)
ASH = np.array([0.3, 0.26, 0.23]); ASH2 = np.array([0.62, 0.56, 0.48]); ASHD = np.array([0.1, 0.085, 0.08]); EMBER = np.array([0.5, 0.14, 0.04])
GLOW = np.array([1.0, 0.5, 0.12]); HOT = np.array([1.0, 0.8, 0.35]); RAG = np.array([0.62, 0.55, 0.43]); RAG2 = np.array([0.4, 0.34, 0.26])
M_ASH, M_RAG, M_GLOW = (0.95, 0.0), (0.9, 0.0), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M); nseed = [0]

    def flakes(P, a, b, seed):
        """0..1: shingles of ash laid over a limb from a to b, their lower edges standing out (laid out by the angle round
        the limb and the distance along it, so they always lie on its skin)"""
        a = np.asarray(a, float); b = np.asarray(b, float); ax = (b - a) / np.linalg.norm(b - a)
        ref = np.array([1.0, 0, 0]) if abs(ax[0]) < 0.9 else np.array([0, 1.0, 0])
        e1 = np.cross(ax, ref); e1 /= np.linalg.norm(e1); e2 = np.cross(ax, e1)
        Q = np.asarray(P) - a; t = Q @ ax; th = np.arctan2(Q @ e2, Q @ e1)
        cu, cv = 0.85, 0.075; v = -t / cv + seed; row = np.floor(v); u = th / cu + 0.5 * (row % 2) + seed * 0.3
        fu = u - np.floor(u) - 0.5; fv = v - row
        jag = 0.12 * np.sin(fu * 18 + row * 3.1)
        shape = np.clip(1 - np.abs(fu) / (0.55 - 0.25 * fv + jag), 0, 1)
        return np.clip(fv, 0, 1) ** 0.6 * shape

    def limb(name, bone, a, b, ra, rb, crack=1.0, scale=None):
        nseed[0] += 1; sd = nseed[0]; a = np.asarray(a, float); b = np.asarray(b, float)
        base = lambda P: cap(P, a, b, ra, rb, scale=scale)
        f = lambda P: base(P) - 0.02 * flakes(P, a, b, sd) + 0.016 * crack * crack_depth(P, fbm, 4.0, 0.014, sd * 1.7)
        def col(V):
            fl = flakes(V, a, b, sd)[:, None]; e = crack_depth(V, fbm, 4.0, 0.03, sd * 1.7)[:, None] * crack
            c = mix(ASHD, mix(ASH, ASH2, np.clip(fbm(V, 8.0)[:, None] * 1.4 - 0.1, 0, 1)), 0.25 + 0.75 * fl ** 0.7) * (0.85 + 0.3 * fbm(V, 60.0)[:, None])
            return mix(c, EMBER, e * 0.8)
        lo = np.minimum(a, b) - max(ra, rb) - 0.05; hi = np.maximum(a, b) + max(ra, rb) + 0.05
        suit.add(name, bone, f, lo, hi, col, mat=M_ASH)
        if crack > 0:
            suit.add(name + '_fire', bone, lambda P: base(P) + 0.009, lo, hi,
                     lambda V: mix(GLOW, HOT, np.clip(fbm(V, 12.0)[:, None] * 1.6 - 0.4, 0, 1)), kind=7, mat=M_GLOW, vox=1.4)

    log('the body')
    limb('chest', 'chest', (0, 0.0, 1.14), (0, 0.01, 1.3), 0.18, 0.2, scale=(1.2, 0.75, 1))
    limb('belly', 'spine', (0, 0.0, 0.96), (0, 0.0, 1.1), 0.16, 0.17, scale=(1.15, 0.75, 1))
    limb('pelvis', 'hips', (0, 0, 0.8), (0, 0, 0.92), 0.165, 0.16, scale=(1.2, 0.8, 1))
    limb('neck', 'neck', A('neck') - [0, 0, 0.03], A('head') + [0, 0, 0.02], 0.06, 0.06, crack=0)
    # the coal heart, set in its chest
    hc = np.array([0.05, 0.16, 1.2])
    def heart(P, g=0.0):
        Q = (P - hc) / 1.0; x, z = Q[:, 0], Q[:, 2]
        lobes = np.minimum(np.hypot(x - 0.022, z - 0.012), np.hypot(x + 0.022, z - 0.012)) - 0.03
        tip = (np.abs(x) * 0.8 + (0.0 - z) * 0.6) - 0.03
        d2 = np.minimum(lobes, np.maximum(tip, z - 0.02))
        return np.maximum(d2 - g, np.abs(Q[:, 1]) - 0.025 - g)
    suit.add('heart', 'chest', heart, hc - 0.1, hc + 0.1, lambda V: mix(GLOW, HOT, np.clip(0.5 - (V[:, 2] - hc[2]) * 8, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.5)

    log('the head, its rag, its eyes')
    hc2 = np.array([0, 0.06, 1.52])
    def head(P):
        d = smin(ell(P, hc2, (0.11, 0.115, 0.125)), ell(P, hc2 + [0, 0.03, -0.07], (0.08, 0.08, 0.06)), 0.03)
        for s in (1, -1): d = smax(d, -ell(P, hc2 + [s * 0.042, 0.108, -0.01], (0.024, 0.02, 0.018)), 0.006)   # sockets
        return d - 0.01 * (fbm(P, 14.0, 2) - 0.5) - 0.006 * np.abs(np.sin(P[:, 2] * 90 + 3 * fbm(P, 8.0, 2)))
    suit.add('head', 'head', head, hc2 - 0.18, hc2 + 0.18, lambda V: mix(ASHD, ASH, np.clip(fbm(V, 9.0)[:, None] * 1.5 - 0.2, 0, 1)), mat=M_ASH)
    for s in (1, -1):
        suit.add(f'eye{s}', 'head', lambda P, s=s: ell(P, hc2 + [s * 0.042, 0.1, -0.01], (0.02, 0.012, 0.015)), hc2 - 0.15, hc2 + 0.15,
                 lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.5)
    def rag(P):
        Q = P - hc2; th = np.arctan2(Q[:, 1], Q[:, 0])
        band = np.maximum(np.abs(np.hypot(Q[:, 0] / 1.0, Q[:, 1] / 1.05) - 0.106 - 0.004 * np.sin(th * 5)) - 0.012,
                          np.abs(Q[:, 2] - 0.035 + 0.015 * np.cos(th - 1.57)) - 0.026 - 0.006 * np.sin(th * 7))
        knot = ell(P, hc2 + [-0.06, -0.09, 0.05], (0.03, 0.025, 0.028))
        tails = np.minimum(rbox(P, hc2 + [-0.08, -0.12, -0.02], (0.018, 0.006, 0.07), 0.004, rot(rx=0.3, ry=0.4)),
                           rbox(P, hc2 + [-0.1, -0.1, -0.06], (0.016, 0.006, 0.085), 0.004, rot(rx=0.2, ry=0.7)))
        return smin(smin(band, knot, 0.015), tails, 0.01) - 0.003 * (fbm(P, 30.0, 2) - 0.5)
    suit.add('rag', 'head', rag, hc2 - 0.24, hc2 + 0.2, lambda V: mix(RAG2, RAG, np.clip(fbm(V * [1, 1, 3], 20.0)[:, None] * 1.5 - 0.2, 0, 1)), mat=M_RAG)

    log('arms and legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        limb(f'{k}_shoulder', 'chest', sh - [s * 0.06, 0, -0.01], sh + [s * 0.02, 0, -0.02], 0.1, 0.092)
        limb(f'{k}_upper', f'{k}_upper', sh, el, 0.092, 0.076)
        limb(f'{k}_fore', f'{k}_fore', el, wr, 0.078, 0.064)
        def hand(P, fist=fist, wr=wr, s=s):
            d = ell(P, fist, (0.055, 0.06, 0.07))
            for i in range(4):                                                                    # long fingers, curled
                b0 = fist + [s * (-0.03 + 0.02 * i), 0.03, -0.02]
                d = smin(d, cap(P, b0, b0 + [0, 0.025, -0.06], 0.012, 0.009), 0.012)
            return d - 0.005 * (fbm(P, 30.0, 2) - 0.5)
        suit.add(f'{k}_hand', f'{k}_hand', hand, fist - 0.12, fist + 0.12, lambda V: mix(ASHD, ASH, np.clip(fbm(V, 12.0)[:, None] * 1.4 - 0.2, 0, 1)), mat=M_ASH)
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        limb(f'{k}_thigh', f'{k}_thigh', hp, kn, 0.11, 0.088)
        limb(f'{k}_shin', f'{k}_shin', kn, an, 0.088, 0.072)
        def foot(P, an=an, toe=toe):
            d = smin(ell(P, an, (0.06, 0.06, 0.05)), cap(P, an * [1, 1, 0] + [0, 0, 0.04], toe + [0, 0, 0.015], 0.055, 0.04, scale=(1.2, 1, 0.7)), 0.03)
            return np.maximum(d, -P[:, 2]) - 0.006 * (fbm(P, 20.0, 2) - 0.5)
        suit.add(f'{k}_foot', f'{k}_foot', foot, an - [0.12, 0.12, 0.12], toe + [0.12, 0.08, 0.1], lambda V: mix(ASHD, ASH, np.clip(fbm(V, 12.0)[:, None] * 1.4 - 0.2, 0, 1)), mat=M_ASH)

    save_pieces(HERE, suit.build())
    return M
