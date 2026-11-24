# The Iron Sentinels (Act Two, Ironspire): dwarven automata of riveted blue-grey iron banded in brass, stocky, short in
# the leg, broad in the shoulder (the foe kit, November 24, the polish pass). Shared by the Iron Sentinel and the
# Sentinel-Captain (foes/sentinel-captain loads this file by path):
#   the Sentinel: a crenellated tower of a helm with a burning slit, a gear on its breast, a round shield with a boss;
#   the Captain: a domed visored helm with bolted cheeks and a plume, two burning eyes, a fleur on his breast, his right
#   fist raised, and Ironwall, his tall shield with a diamond boss, before him.
# Every plate is a piece of its own on one bone (kit/py/armour.py), so nothing stretches. x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, trim, rivets, cyl, along, rot, local, save_pieces

IRON = np.array([0.22, 0.25, 0.34]); IRON2 = np.array([0.36, 0.40, 0.50]); DARK = np.array([0.13, 0.12, 0.16])
BRASS = np.array([0.82, 0.55, 0.17]); BRASS2 = np.array([0.55, 0.33, 0.10]); RUST = np.array([0.55, 0.30, 0.12])
GLOW = np.array([1.0, 0.62, 0.16]); HOT = np.array([1.0, 0.85, 0.45]); PLUME = np.array([0.95, 0.68, 0.12])
BRONZE = np.array([0.52, 0.34, 0.20])
M_IRON, M_BRASS, M_GLOW = (0.45, 0.85), (0.3, 0.95), (0.5, 0.0)


def layout(captain=False):
    J = dict(hip=(0, 0, 0.78), waist=(0, 0, 0.95), chest=(0, 0, 1.08), neck=(0, 0, 1.44), head=(0, 0, 1.49), top=(0, 0, 1.88),
             r_sh=(0.42, 0, 1.34), r_el=(0.47, 0.02, 0.98), r_wr=(0.47, 0.05, 0.70), r_fist=(0.47, 0.06, 0.58),
             l_sh=(-0.42, 0, 1.34), l_el=(-0.47, 0.02, 0.98), l_wr=(-0.47, 0.05, 0.70), l_fist=(-0.47, 0.06, 0.58),
             r_hip=(0.19, 0, 0.72), r_knee=(0.19, 0.01, 0.38), r_ank=(0.19, 0.0, 0.11), r_toe=(0.19, 0.19, 0.03),
             l_hip=(-0.19, 0, 0.72), l_knee=(-0.19, 0.01, 0.38), l_ank=(-0.19, 0.0, 0.11), l_toe=(-0.19, 0.19, 0.03))
    if captain:   # his right fist raised before his chest, his left arm behind Ironwall
        J.update(r_el=(0.45, 0.08, 1.0), r_wr=(0.40, 0.24, 1.22), r_fist=(0.38, 0.27, 1.32),
                 l_el=(-0.47, 0.06, 1.0), l_wr=(-0.42, 0.22, 0.86), l_fist=(-0.40, 0.26, 0.80), top=(0, 0, 2.05))
    BONES = [('hips', None, J['hip'], J['waist']), ('spine', 'hips', J['waist'], J['chest']), ('chest', 'spine', J['chest'], J['neck']),
             ('neck', 'chest', J['neck'], J['head']), ('head', 'neck', J['head'], J['top'])]
    for k in 'rl':
        BONES += [(f'{k}_upper', 'chest', J[f'{k}_sh'], J[f'{k}_el']), (f'{k}_fore', f'{k}_upper', J[f'{k}_el'], J[f'{k}_wr']),
                  (f'{k}_hand', f'{k}_fore', J[f'{k}_wr'], J[f'{k}_fist'])]
    for k in 'rl':
        BONES += [(f'{k}_thigh', 'hips', J[f'{k}_hip'], J[f'{k}_knee']), (f'{k}_shin', f'{k}_thigh', J[f'{k}_knee'], J[f'{k}_ank']),
                  (f'{k}_foot', f'{k}_shin', J[f'{k}_ank'], J[f'{k}_toe'])]
    return J, BONES


def build(K, foe_dir, captain=False):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    J, _ = layout(captain); A = lambda k: np.array(J[k], float)
    M = K.Mesh(); suit = Suit(K, M)

    def iron(V, brass=0.0):
        g = np.asarray(brass, float).reshape(-1, 1) if np.ndim(brass) else brass
        c = mix(IRON, IRON2, np.clip(fbm(V, 6.0)[:, None] * 1.5 - 0.4, 0, 1)) * (0.82 + 0.3 * fbm(V, 40.0)[:, None])
        c = mix(c, RUST, np.clip(fbm(V, 14.0)[:, None] - 0.66, 0, 1) * 2.2)                         # rust where it's worn
        bc = mix(BRASS2, BRASS, np.clip(fbm(V, 22.0)[:, None] * 1.5 - 0.2, 0, 1))
        return mix(c, bc, g)
    darkc = lambda V: DARK * (0.75 + 0.5 * fbm(V, 60.0)[:, None])

    def plate(name, bone, c, h, r, R=None, taper=None, riv=(0.035, 0.07, 0.014), band=None, extra=None, carve=None, col=None, mat=M_IRON, vox=1.0):
        """a riveted plate: band = (axis, lo, hi) in local units 0..1 painted brass (a brass band round it)"""
        c = np.asarray(c, float); h = np.asarray(h, float)
        def f(P):
            d = rbox(P, c, h, r, R, taper)
            if riv: d = d - 0.006 * np.sqrt(rivets(P, c, h, riv[0], riv[1], riv[2], R))
            if extra is not None: d = extra(P, d)
            if carve is not None: d = smax(d, -carve(P), 0.004)
            return d
        def colour(V):
            g = rivets(V, c, h, riv[0], riv[1], riv[2] * 1.2, R) if riv else np.zeros(len(V))
            if band is not None:
                ax, a, b = band; q = (local(V, c, R)[:, ax] / h[ax] + 1) / 2; g = np.maximum(g, ((q > a) & (q < b)).astype(float))
            return iron(V, np.clip(g, 0, 1))
        pad = np.max(h) * (1.5 if R is not None else 1.0) + 0.05
        suit.add(name, bone, f, c - pad, c + pad, col or colour, mat=mat, vox=vox)

    def ball(name, bone, c, r, col=None):
        c = np.asarray(c, float)
        suit.add(name, bone, lambda P: ell(P, c, (r, r, r)), c - r - 0.02, c + r + 0.02, col or darkc, mat=(0.55, 0.7))

    def tube(name, bone, a, b, ra, rb, col=None, scale=None):
        a = np.asarray(a, float); b = np.asarray(b, float)
        suit.add(name, bone, lambda P: cap(P, a, b, ra, rb, scale=scale), np.minimum(a, b) - max(ra, rb) - 0.04,
                 np.maximum(a, b) + max(ra, rb) + 0.04, col or darkc, mat=(0.55, 0.7))

    log('the frame: dark iron under the plates')
    tube('core', 'spine', A('hip') + [0, 0, 0.05], A('neck'), 0.27, 0.24, scale=(1.15, 0.8, 1))
    for k in 'rl':
        ball(f'{k}_shball', 'chest', A(f'{k}_sh'), 0.11); ball(f'{k}_elball', f'{k}_upper', A(f'{k}_el'), 0.09)
        ball(f'{k}_hipball', 'hips', A(f'{k}_hip'), 0.13); ball(f'{k}_knball', f'{k}_thigh', A(f'{k}_knee'), 0.10)
        ball(f'{k}_anball', f'{k}_shin', A(f'{k}_ank'), 0.085)
        tube(f'{k}_arm_u', f'{k}_upper', A(f'{k}_sh'), A(f'{k}_el'), 0.085, 0.08)
        tube(f'{k}_thigh_core', f'{k}_thigh', A(f'{k}_hip'), A(f'{k}_knee'), 0.11, 0.1)
    tube('pelvis', 'hips', A('hip') + [0, 0, -0.08], A('hip') + [0, 0, 0.12], 0.25, 0.25, scale=(1.15, 0.85, 1))

    log('the breastplate, belt, faulds')
    cc, ch = np.array([0, 0.01, 1.22]), np.array([0.33, 0.22, 0.235])
    emb_c = np.array([0, 0.25, 1.25])
    def gear(P):
        Q = P - emb_c; r = np.hypot(Q[:, 0], Q[:, 2]); th = np.arctan2(Q[:, 2], Q[:, 0])
        teeth = 0.072 + 0.018 * (np.cos(th * 8) > 0.3)
        d = np.maximum(np.maximum(r - teeth, 0.03 - r), np.abs(Q[:, 1]) - 0.018)
        return d
    def fleur(P):
        Q = P - emb_c; x, z = np.abs(Q[:, 0]), Q[:, 2]
        petal = cap(np.stack([x, Q[:, 1] * 0, z], 1), (0, 0, -0.02), (0, 0, 0.1), 0.028, 0.006)
        side = cap(np.stack([x, Q[:, 1] * 0, z], 1), (0.015, 0, -0.01), (0.075, 0, 0.05), 0.02, 0.005)
        foot = cap(np.stack([x, Q[:, 1] * 0, z], 1), (0, 0, -0.03), (0, 0, -0.1), 0.02, 0.012)
        bar = rbox(Q, (0, 0, -0.03), (0.06, 0.02, 0.012), 0.006)
        return np.maximum(np.minimum(np.minimum(np.minimum(petal, side), foot), bar), np.abs(Q[:, 1]) - 0.016)
    emblem = fleur if captain else gear
    def breast(P, d):
        d = smin(d, ell(P, (0, 0.1, 1.24), (0.3, 0.15, 0.2)), 0.05)
        return smin(d, emblem(P) - 0.002, 0.004)
    def breast_col(V):
        Q = V - cc
        g = np.maximum(rivets(V, cc, ch, 0.035, 0.07, 0.017), (emblem(V) < 0.006).astype(float))
        g = np.maximum(g, ((np.abs(Q[:, 0]) < 0.055) & (Q[:, 1] < -0.12)).astype(float) * 0.9)       # the brass strap down its back
        return iron(V, g)
    plate('breastplate', 'chest', cc, ch, 0.09, taper=(2, 0.04), extra=breast, col=breast_col)
    plate('belt', 'spine', (0, 0.0, 0.975), (0.345, 0.245, 0.048), 0.02, riv=(0.024, 0.06, 0.012),
          col=lambda V: mix(BRONZE, BRASS2, rivets(V, (0, 0, 0.975), (0.345, 0.245, 0.048), 0.024, 0.06, 0.015)[:, None]) * (0.8 + 0.3 * fbm(V, 40.0)[:, None]))
    ball('buckle', 'spine', (0, 0.25, 0.975), 0.055, col=lambda V: iron(V, 1.0))
    for i in range(3):
        z = 0.885 - i * 0.08
        plate(f'fauld{i}', 'hips', (0, 0.0, z), (0.33 + 0.012 * i, 0.235 + 0.01 * i, 0.038), 0.02, riv=(0.02, 0.07, 0.011),
              band=(2, 0.0, 0.18) if captain else None)

    log('the pauldrons and arms')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh = A(f'{k}_sh'); pc = sh + [s * 0.04, 0, 0.0]
        plate(f'{k}_rerebrace', f'{k}_upper', A(f'{k}_sh') + (A(f'{k}_el') - A(f'{k}_sh')) * 0.55, (0.1, 0.105, 0.11), 0.04, riv=(0.025, 0.06, 0.011))
        if captain:   # the Captain's: squarer, layered
            plate(f'{k}_paul', f'{k}_upper', pc + [s * -0.02, 0, 0.06], (0.15, 0.2, 0.09), 0.06, R=rot(ry=-s * 0.22), band=(2, 0.0, 0.2))
            plate(f'{k}_paul_l', f'{k}_upper', pc + [s * 0.02, 0, -0.05], (0.13, 0.18, 0.05), 0.03, R=rot(ry=-s * 0.32), band=(2, 0.0, 0.25))
        else:
            def paul(P, pc=pc):
                d = ell(P, pc, (0.21, 0.23, 0.2))
                d = np.maximum(d, -(P[:, 2] - (pc[2] - 0.15)))
                d = np.maximum(d, -ell(P, pc - [0, 0, 0.05], (0.17, 0.19, 0.17)))
                return d - 0.006 * np.sqrt(np.clip(1 - np.abs(np.sin(np.arctan2(P[:, 1] - pc[1], P[:, 0] - pc[0]) * 7)) * 30 + 0, 0, 1)) * (np.abs(P[:, 2] - pc[2] + 0.07) < 0.015)
            suit.add(f'{k}_paul', f'{k}_upper', paul, pc - 0.25, pc + 0.25,
                     lambda V, pc=pc: iron(V, ((np.abs(V[:, 2] - pc[2] + 0.07) < 0.015) & (np.abs(np.sin(np.arctan2(V[:, 1] - pc[1], V[:, 0] - pc[0]) * 7)) < 0.15)).astype(float)), mat=M_IRON)
        el, wr, fist = A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        # the bracer: a thick iron cuff, brass-banded top and foot
        def bracer(P, el=el, wr=wr):
            a = el + (wr - el) * 0.12; b = wr + (el - wr) * 0.02
            d = cap(P, a, b, 0.12, 0.115)
            t, _ = along(P, a, b)
            return d - 0.012 * ((t < 0.16) | (t > 0.84))
        suit.add(f'{k}_bracer', f'{k}_fore', bracer, np.minimum(el, wr) - 0.18, np.maximum(el, wr) + 0.18,
                 lambda V, el=el, wr=wr: iron(V, ((along(V, el + (wr - el) * 0.12, wr)[0] < 0.17) | (along(V, el + (wr - el) * 0.12, wr)[0] > 0.83)).astype(float)), mat=M_IRON)
        fR = rot(rx=(0.5 if (captain and k == 'r') else 0.0))
        plate(f'{k}_fist', f'{k}_hand', fist, (0.1, 0.105, 0.1), 0.045, R=fR, riv=None,
              extra=(lambda P, d, fist=fist: d - 0.006 * np.clip(np.cos((P[:, 0] - fist[0]) * 75), 0, 1) * (P[:, 1] > fist[1] + 0.06)),
              col=lambda V: mix(DARK * 1.3, IRON, 0.35) * (0.8 + 0.3 * fbm(V, 40.0)[:, None]))

    log('the shield')
    if captain:   # Ironwall: tall, square-shouldered, a diamond boss
        SC, SR = np.array([-0.42, 0.36, 0.86]), rot(rz=-0.18)
        sh_h = np.array([0.27, 0.035, 0.43])
        def ironwall(P):
            d = rbox(P, SC, sh_h - [0, 0.008, 0], 0.03, SR)
            Q = local(P, SC, SR)
            rim = np.maximum(rbox(P, SC, sh_h + [0, 0.008, 0], 0.03, SR), -rbox(P, SC, (sh_h[0] - 0.045, 0.3, sh_h[2] - 0.045), 0.02, SR))
            d = np.minimum(d, rim)                                                                         # the raised rim
            for z in (0.21, -0.21):
                d = smin(d, rbox(Q, (0, 0.03, z), (0.25, 0.012, 0.022), 0.006), 0.003)                    # brass bars
            dia = (np.abs(Q[:, 0]) + np.abs(Q[:, 2] - 0.0)) * 0.7 - 0.08 + 0.0
            d = smin(d, np.maximum(dia + (Q[:, 1] - 0.035) * 0.9, -Q[:, 1]), 0.004)                        # the diamond boss
            return d - 0.005 * np.sqrt(rivets(P, SC, sh_h, 0.022, 0.065, 0.012, SR))
        def wall_col(V):
            Q = local(V, SC, SR)
            g = ((np.abs(Q[:, 0]) > sh_h[0] - 0.047) | (np.abs(Q[:, 2]) > sh_h[2] - 0.047)).astype(float)
            g = np.maximum(g, ((np.abs(np.abs(Q[:, 2]) - 0.21) < 0.024) & (np.abs(Q[:, 0]) < 0.25)).astype(float))
            g = np.maximum(g, ((np.abs(Q[:, 0]) + np.abs(Q[:, 2])) < 0.12).astype(float))
            g = np.maximum(g, rivets(V, SC, sh_h, 0.022, 0.065, 0.014, SR))
            return iron(V, g)
        suit.add('ironwall', 'l_fore', ironwall, SC - 0.5, SC + 0.5, wall_col, vox=0.85)
    else:         # the round shield: a brass rim, a ring, a boss
        SC, SR = np.array([-0.62, 0.12, 0.98]), rot(rz=0.75)
        def roundshield(P):
            Q = local(P, SC, SR); r = np.hypot(Q[:, 0], Q[:, 2])
            face = 0.03 * (1 - (r / 0.3) ** 2)
            d = np.maximum(r - 0.29, np.abs(Q[:, 1] - face * 0.5) - 0.022 - face * 0.5)
            d = smin(d, np.maximum(np.abs(r - 0.275) - 0.018, np.abs(Q[:, 1] - 0.01) - 0.03), 0.004)       # rim
            d = smin(d, np.maximum(np.abs(r - 0.17) - 0.012, np.abs(Q[:, 1] - 0.02) - 0.03), 0.004)        # ring
            d = smin(d, ell(Q, (0, 0.04, 0), (0.075, 0.06, 0.075)), 0.01)                                  # boss
            th = np.arctan2(Q[:, 2], Q[:, 0])
            rv = np.clip(1 - np.hypot(r - 0.22, (th - np.round(th / 0.4) * 0.4) * 0.22) / 0.013, 0, 1)
            return d - 0.006 * np.sqrt(rv)
        def round_col(V):
            Q = local(V, SC, SR); r = np.hypot(Q[:, 0], Q[:, 2]); th = np.arctan2(Q[:, 2], Q[:, 0])
            g = (r > 0.255) | (np.abs(r - 0.17) < 0.014) | (r < 0.08)
            rv = np.hypot(r - 0.22, (th - np.round(th / 0.4) * 0.4) * 0.22) < 0.015
            return iron(V, (g | rv).astype(float))
        suit.add('roundshield', 'l_fore', roundshield, SC - 0.36, SC + 0.36, round_col, vox=0.85)

    log('the helm')
    if captain:
        hc = np.array([0, 0.0, 1.66])
        def helm(P):
            d = ell(P, hc, (0.22, 0.22, 0.24))
            d = np.maximum(d, (hc[2] - 0.17) - P[:, 2])
            d = smin(d, cyl(P, hc - [0, 0, 0.17], hc - [0, 0, 0.08], 0.205), 0.02)                          # the bevor round its jaw
            for z in (hc[2] - 0.02, hc[2] + 0.13):
                d = smin(d, np.maximum(cyl(P, (0, 0, z - 0.016), (0, 0, z + 0.016), 0.215 if z < hc[2] else 0.19), -cyl(P, (0, 0, z - 0.1), (0, 0, z + 0.1), 0.15)), 0.004)
            for s in (1, -1):
                d = smin(d, cyl(P, hc + [s * 0.2, 0, -0.03], hc + [s * 0.245, 0, -0.03], 0.045), 0.006)     # the bolted cheeks
            for s in (1, -1):
                d = smax(d, -ell(P, hc + [s * 0.075, 0.2, -0.05], (0.045, 0.06, 0.022)), 0.006)           # the eyes
            return smax(d, -ell(P, hc, (0.18, 0.18, 0.2)), 0.004)
        def helm_col(V):
            Q = V - hc
            g = (np.abs(Q[:, 2] + 0.02) < 0.018) | (np.abs(Q[:, 2] - 0.13) < 0.018) | (np.abs(np.abs(Q[:, 0]) - 0.22) < 0.03) & (np.abs(Q[:, 2] + 0.03) < 0.05)
            return iron(V, g.astype(float))
        suit.add('helm', 'head', helm, hc - 0.32, hc + 0.32, helm_col)
        suit.add('eyes', 'head', lambda P: np.minimum(ell(P, hc + [0.075, 0.16, -0.05], (0.045, 0.03, 0.02)), ell(P, hc + [-0.075, 0.16, -0.05], (0.045, 0.03, 0.02))),
                 hc - 0.3, hc + 0.3, lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)
        for i in range(7):                                                                               # the plume, swept back
            a = (i - 3) * 0.16; base = hc + [0.012 * (i - 3), 0.0, 0.21]
            p1 = base + [math.sin(a) * 0.07, 0.02, 0.17]; p2 = p1 + [math.sin(a) * 0.12, -0.2 - 0.03 * abs(i - 3), 0.04 - 0.03 * abs(i - 3)]
            def flame(P, base=base, p1=p1, p2=p2):
                return smin(cap(P, base, p1, 0.05, 0.045), cap(P, p1, p2, 0.045, 0.008), 0.03)
            suit.add(f'plume{i}', 'head', flame, np.minimum(np.minimum(base, p1), p2) - 0.06, np.maximum(np.maximum(base, p1), p2) + 0.06,
                     lambda V, base=base: mix(PLUME * 0.7, PLUME * 1.05, np.clip((V[:, 2] - base[2]) * 5, 0, 1)[:, None]) * (0.85 + 0.25 * np.abs(np.sin(V[:, 0] * 140 + V[:, 2] * 40)))[:, None],
                     mat=(0.8, 0.0), vox=0.6)
    else:
        hc, hh = np.array([0, 0.0, 1.66]), np.array([0.215, 0.215, 0.17])
        def helm_x(P, d):
            d = smax(d, -rbox(P, hc + [0, 0.215, 0.02], (0.13, 0.06, 0.032), 0.012), 0.004)               # the slit
            ring = np.maximum(cyl(P, hc + [0, 0, 0.15], hc + [0, 0, 0.25], 0.235), -cyl(P, hc + [0, 0, 0.1], hc + [0, 0, 0.3], 0.19))
            th = np.arctan2(P[:, 1] - hc[1], P[:, 0] - hc[0])
            ring = np.maximum(ring, -np.maximum(np.cos(th * 6) - 0.25, (hc[2] + 0.205) - P[:, 2]))       # the crenels
            d = smin(d, ring, 0.004)
            return smax(d, -rbox(P, hc, hh - 0.025, 0.07), 0.004)
        plate('helm', 'head', hc, hh, 0.09, riv=(0.035, 0.075, 0.014), extra=helm_x,
              col=lambda V: iron(V, np.maximum((V[:, 2] > hc[2] + 0.15).astype(float), np.maximum(rivets(V, hc, hh, 0.035, 0.075, 0.017),
                                  (rbox(V, hc + [0, 0.215, 0.02], (0.15, 0.06, 0.05), 0.012) < 0.0).astype(float) * 0.9))))
        suit.add('slit', 'head', lambda P: rbox(P, hc + [0, 0.17, 0.02], (0.12, 0.012, 0.028), 0.01), hc - 0.3, hc + 0.3,
                 lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)

    log('the legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        plate(f'{k}_cuisse', f'{k}_thigh', (hp + kn) / 2 + [0, 0.02, 0], (0.13, 0.13, 0.12), 0.05)
        plate(f'{k}_greave', f'{k}_shin', (kn + an) / 2 + [0, 0.01, 0.0], (0.135, 0.14, 0.12), 0.05, band=(2, 0.72, 0.88))
        fc = (an + toe) / 2; fc[2] = 0.07
        plate(f'{k}_boot', f'{k}_foot', fc + [0, 0.0, 0], (0.135, 0.2, 0.07), 0.045, taper=(1, 0.15), band=(2, 0.75, 1.0))

    save_pieces(foe_dir, suit.build())
    return M
