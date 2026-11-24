# The Ashen Warden (Act One, Scorchgate: the Champion), in full detail for the foe kit (November 24, the polish pass).
# From Chris's sheet: blackened bronze plate edged in gold, a bucket helm with a burning slit under the Cinder Crown, a
# cuirass with a flame in a gold arch, banded faulds and tassets, great layered pauldrons, a sword still hot from the
# last fire raised in his right hand, the Ashen Aegis (a gold gate on a dark field, fire behind its doors) on his left
# arm, and a ragged cape of ash. Every plate is a piece of its own on one bone (kit/py/armour.py): nothing stretches.
# x his right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from layout import J
from armour import Suit, rbox, trim, cyl, along, rot, local, save_pieces

IRON = np.array([0.27, 0.15, 0.08]); IRON2 = np.array([0.46, 0.27, 0.13]); GOLD = np.array([0.80, 0.54, 0.19])
GOLD2 = np.array([0.55, 0.33, 0.10]); MAIL = np.array([0.15, 0.10, 0.07]); ASH = np.array([0.34, 0.32, 0.31])
ASH2 = np.array([0.17, 0.16, 0.16]); GLOW = np.array([1.0, 0.58, 0.14]); HOT = np.array([1.0, 0.86, 0.45])
LEATHER = np.array([0.24, 0.13, 0.065])
M_IRON, M_GOLD, M_CLOTH, M_GLOW = (0.42, 0.85), (0.32, 0.95), (0.92, 0.0), (0.5, 0.0)
A = lambda k: np.array(J[k], float)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix, sstep = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix, S.sstep
    M = K.Mesh(); suit = Suit(K, M)

    def iron(V, gold=0.0, dark=0.0):
        g = np.asarray(gold, float).reshape(-1, 1) if np.ndim(gold) else gold
        c = mix(IRON, IRON2, np.clip(fbm(V, 7.0)[:, None] * 1.4 - 0.35, 0, 1)) * (0.8 + 0.35 * fbm(V, 45.0)[:, None])
        c = mix(c, IRON * 0.55, np.clip(fbm(V * [1, 1, 3], 20.0)[:, None] - 0.62, 0, 1) * 2)          # soot streaks
        gc = mix(GOLD2, GOLD, np.clip(fbm(V, 25.0)[:, None] * 1.5 - 0.2, 0, 1))
        return mix(c, gc, g) * (1 - dark)

    def box_piece(name, bone, c, h, r, R=None, taper=None, gold_w=0.018, extra=None, carve=None, col=None, mat=M_IRON, vox=1.0):
        c = np.asarray(c, float); h = np.asarray(h, float)
        def f(P):
            d = rbox(P, c, h, r, R, taper)
            if extra is not None: d = extra(P, d)
            if carve is not None: d = smax(d, -carve(P), 0.004)
            return d
        pad = np.max(h) * (1.5 if R is not None else 1.0) + 0.04
        colour = col or (lambda V: iron(V, trim(V, c, h, gold_w, R)))
        suit.add(name, bone, f, c - pad, c + pad, colour, mat=mat, vox=vox)

    def limb_piece(name, bone, a, b, ra, rb, scale=None, bands=(0.07, 0.93), mat=M_IRON, colour=None, grow=0.04):
        a = np.asarray(a, float); b = np.asarray(b, float)
        f = lambda P: cap(P, a, b, ra, rb, scale=scale)
        def col(V):
            t, _ = along(V, a, b)
            g = ((t < bands[0]) | (t > bands[1])).astype(float)
            return iron(V, g)
        lo = np.minimum(a, b) - max(ra, rb) - grow; hi = np.maximum(a, b) + max(ra, rb) + grow
        suit.add(name, bone, f, lo, hi, colour or col, mat=mat)

    def ball(name, bone, c, r, col=MAIL):
        c = np.asarray(c, float)
        suit.add(name, bone, lambda P: ell(P, c, (r, r, r)) - 0.002 * (fbm(P, 90.0, 2) - 0.5), c - r - 0.02, c + r + 0.02,
                 lambda V: col * (0.7 + 0.6 * fbm(V, 120.0)[:, None]), mat=(0.6, 0.7))

    log('the body: mail under the plate')
    core_a, core_b = A('hip') + [0, 0, 0.02], A('neck')
    suit.add('core', 'spine', lambda P: cap(P, core_a, core_b, 0.17, 0.15, scale=(1.25, 0.85, 1)), core_a - 0.3, core_b + 0.3,
             lambda V: MAIL * (0.7 + 0.6 * fbm(V, 120.0)[:, None]), mat=(0.6, 0.7))
    for s, k in ((1, 'r'), (-1, 'l')):
        ball(f'{k}_shball', 'chest', A(f'{k}_sh'), 0.085); ball(f'{k}_elball', f'{k}_upper', A(f'{k}_el'), 0.062)
        ball(f'{k}_wrball', f'{k}_fore', A(f'{k}_wr'), 0.05); ball(f'{k}_hipball', 'hips', A(f'{k}_hip'), 0.10)
        ball(f'{k}_knball', f'{k}_thigh', A(f'{k}_knee'), 0.07); ball(f'{k}_anball', f'{k}_shin', A(f'{k}_ank'), 0.062)
        limb_piece(f'{k}_arm_u', f'{k}_upper', A(f'{k}_sh'), A(f'{k}_el'), 0.062, 0.055, colour=lambda V: MAIL * (0.7 + 0.6 * fbm(V, 120.0)[:, None]))
        limb_piece(f'{k}_arm_f', f'{k}_fore', A(f'{k}_el'), A(f'{k}_wr'), 0.052, 0.045, colour=lambda V: MAIL * (0.7 + 0.6 * fbm(V, 120.0)[:, None]))
    suit.add('skirt', 'hips', lambda P: cap(P, A('hip') + [0, 0, -0.14], A('hip') + [0, 0, 0.08], 0.2, 0.19, scale=(1.15, 0.85, 1)),
             A('hip') - 0.35, A('hip') + 0.35, lambda V: MAIL * (0.7 + 0.6 * fbm(V, 120.0)[:, None]), mat=(0.6, 0.7))

    log('the cuirass, gorget, faulds, belt, tassets')
    cc, ch = np.array([0, 0.01, 1.45]), np.array([0.235, 0.165, 0.175])
    def cuirass_extra(P, d):
        d = smin(d, ell(P, (0, 0.09, 1.46), (0.215, 0.13, 0.17)), 0.06)                         # the swell of the breast
        d = smax(d, -rbox(P, (0, 0.205, 1.45), (0.07, 0.04, 0.095), 0.03), 0.006)               # the emblem's arch, sunk
        return d
    def cuirass_col(V):
        Q = V - cc
        g = trim(V, cc, ch, 0.02) + (np.abs(Q[:, 0]) < 0.012) * (Q[:, 1] > 0.1) * (np.abs(Q[:, 2]) > 0.11)   # edges, a ridge
        arch = rbox(V, (0, 0.205, 1.45), (0.085, 0.06, 0.11), 0.035)
        g = np.maximum(g, ((arch < 0.012) & (arch > -0.03)).astype(float))                     # the arch's gold frame
        return iron(V, np.clip(g, 0, 1))
    box_piece('cuirass', 'chest', cc, ch, 0.07, taper=(2, 0.22), extra=cuirass_extra, col=cuirass_col)
    # the flame in the arch: glowing, set into the sunk arch
    def flame(P):
        Q = P - np.array([0, 0.17, 1.43])
        w = 0.045 * np.clip(1 - (Q[:, 2] + 0.06) / 0.17, 0, 1) ** 0.7 * (1 + 0.25 * np.sin(Q[:, 2] * 60))
        return np.maximum(np.maximum(np.abs(Q[:, 0]) - w, np.abs(Q[:, 1]) - 0.012), np.abs(Q[:, 2] - 0.02) - 0.085)
    suit.add('emblem', 'chest', flame, (-0.1, 0.12, 1.3), (0.1, 0.22, 1.56), lambda V: mix(GLOW, HOT, np.clip((1.47 - V[:, 2]) * 5, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)
    suit.add('gorget', 'chest', lambda P: np.maximum(cyl(P, (0, 0, 1.58), (0, 0, 1.68), 0.135), -cyl(P, (0, 0, 1.5), (0, 0, 1.75), 0.1)),
             (-0.2, -0.2, 1.5), (0.2, 0.2, 1.75), lambda V: iron(V, (V[:, 2] > 1.66).astype(float)))
    for i in range(3):                                                                             # faulds: bands, each wider
        z = 1.25 - i * 0.065; h = np.array([0.23 + 0.012 * i, 0.16 + 0.01 * i, 0.034])
        box_piece(f'fauld{i}', 'spine', (0, 0.005, z), h, 0.02, col=(lambda V, z=z, h=h: iron(V, ((V[:, 2] < z - h[2] + 0.014)).astype(float))))
    box_piece('belt', 'hips', (0, 0.0, 1.075), (0.255, 0.18, 0.026), 0.015, col=lambda V: LEATHER * (0.75 + 0.5 * fbm(V, 60.0)[:, None]), mat=(0.7, 0.0))
    box_piece('buckle', 'hips', (0, 0.19, 1.075), (0.045, 0.012, 0.035), 0.008, col=lambda V: iron(V, 1.0), mat=M_GOLD, vox=0.6)
    for s in (1, -1):
        for i in range(3):                                                                         # tassets: lames over each thigh
            z = 1.02 - i * 0.075; c = (s * 0.13, 0.11 - 0.01 * i, z); h = (0.105, 0.03, 0.045)
            box_piece(f'tasset{s}{i}', 'hips', c, h, 0.015, R=rot(rx=0.12, rz=-s * 0.12),
                      col=(lambda V, c=c, h=h: iron(V, (V[:, 2] < c[2] - h[2] + 0.016).astype(float))))
        box_piece(f'hipplate{s}', 'hips', (s * 0.23, -0.01, 0.97), (0.035, 0.12, 0.09), 0.02, R=rot(ry=s * 0.15))
    box_piece('culet', 'hips', (0, -0.15, 0.99), (0.19, 0.04, 0.09), 0.02)
    for i in range(2):                                                                             # the front skirt plates over the crotch
        z = 0.985 - i * 0.075; c = (0, 0.13 - 0.008 * i, z); h = (0.075 - 0.01 * i, 0.028, 0.045)
        box_piece(f'skirtplate{i}', 'hips', c, h, 0.015, R=rot(rx=0.1), col=(lambda V, c=c, h=h: iron(V, (V[:, 2] < c[2] - h[2] + 0.016).astype(float))))

    log('the pauldrons and arms')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh = A(f'{k}_sh'); pc = sh + [s * 0.04, 0, 0.05]
        def paul(P, pc=pc, s=s):
            d = ell(P, pc, (0.175, 0.18, 0.13))
            d = np.maximum(d, -(P[:, 2] - (pc[2] - 0.035)))                                        # the dome, its rim
            d = np.maximum(d, -ell(P, pc - [0, 0, 0.03], (0.14, 0.145, 0.1)))                     # hollow
            return d
        suit.add(f'{k}_paul', f'{k}_upper', paul, pc - 0.2, pc + 0.2,
                 lambda V, pc=pc: iron(V, ((V[:, 2] < pc[2] - 0.02) | (np.abs(V[:, 0] - pc[0]) < 0.012) & (V[:, 2] > pc[2] + 0.06)).astype(float)))
        for i in range(2):                                                                         # lames under it
            lc = pc + [s * (0.03 + 0.012 * i), 0, -0.07 - 0.055 * i]
            def lame(P, lc=lc, i=i):
                d = ell(P, lc, (0.15 - 0.01 * i, 0.16 - 0.01 * i, 0.07))
                return np.maximum(np.maximum(d, np.abs(P[:, 2] - lc[2]) - 0.026), -ell(P, lc, (0.11, 0.125, 0.12)))
            suit.add(f'{k}_paul_l{i}', f'{k}_upper', lame, lc - 0.18, lc + 0.18,
                     lambda V, lc=lc: iron(V, (V[:, 2] < lc[2] - 0.012).astype(float)))
        el, wr, fist = A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        limb_piece(f'{k}_rerebrace', f'{k}_upper', sh + (el - sh) * 0.35, el + (sh - el) * 0.12, 0.072, 0.066)
        ball(f'{k}_cop', f'{k}_upper', el + [s * 0.012, -0.012, 0], 0.07, col=IRON2)
        box_piece(f'{k}_copwing', f'{k}_upper', el + [s * 0.055, -0.01, 0.0], (0.012, 0.06, 0.07), 0.01)
        limb_piece(f'{k}_vambrace', f'{k}_fore', el + (wr - el) * 0.18, wr, 0.062, 0.052, bands=(0.1, 0.9))
        # the gauntlet: a fist round the grip (right) or the shield's strap (left)
        box_piece(f'{k}_gauntlet', f'{k}_hand', fist, (0.05, 0.055, 0.06), 0.03, R=rot(rx=0.25 if k == 'r' else -0.6),
                  extra=(lambda P, d, fist=fist: d - 0.004 * np.abs(np.sin((P[:, 2] - fist[2]) * 160))))

    log('the sword: hot from the last fire')
    gx, gy = J['r_fist'][0], J['r_fist'][1]
    suit.add('grip', 'r_hand', lambda P: cyl(P, (gx, gy, 1.47), (gx, gy, 1.70), 0.017), (gx - 0.05, gy - 0.05, 1.42), (gx + 0.05, gy + 0.05, 1.75),
             lambda V: LEATHER * (0.7 + 0.5 * np.abs(np.sin(V[:, 2] * 220)))[:, None], mat=(0.7, 0.0), vox=0.6)
    suit.add('pommel', 'r_hand', lambda P: ell(P, (gx, gy, 1.455), (0.032, 0.032, 0.03)), (gx - 0.06, gy - 0.06, 1.4), (gx + 0.06, gy + 0.06, 1.5),
             lambda V: iron(V, 1.0), mat=M_GOLD, vox=0.6)
    suit.add('guard', 'r_hand', lambda P: smin(rbox(P, (gx, gy, 1.715), (0.13, 0.022, 0.018), 0.012),
                                               ell(P, (gx, gy, 1.715), (0.035, 0.03, 0.035)), 0.01) - 0.004 * np.cos((P[:, 0] - gx) * 40),
             (gx - 0.18, gy - 0.06, 1.66), (gx + 0.18, gy + 0.06, 1.77), lambda V: iron(V, 1.0), mat=M_GOLD, vox=0.6)
    def blade_w(z): return 0.042 * np.clip(1 - (z - 1.74) / 0.58, 0, 1) ** 0.55 + 0.004
    def blade(P, th=0.011):
        z = P[:, 2]; w = blade_w(z)
        d = np.maximum(np.abs(P[:, 0] - gx) - w, np.abs(P[:, 1] - gy) - th * (1 - 0.6 * np.abs(P[:, 0] - gx) / np.maximum(w, 1e-3)))
        return np.maximum(d, np.maximum(1.73 - z, z - 2.33))
    def veins(P):
        q = (P[:, 2] - 1.73) * 17 + 2.2 * fbm(P, 9.0, 2); r = np.abs(P[:, 0] - gx) / np.maximum(blade_w(P[:, 2]), 1e-3)
        return np.minimum(np.abs(np.sin(q + 3 * r)) - 0.22, np.abs(r - 0.15 - 0.2 * fbm(P, 14.0, 2)) - 0.07)
    suit.add('blade', 'r_hand', lambda P: blade(P) + 0.0068 * np.clip(1 - veins(P) * 4, 0, 1),               # cracks through to the fire
             (gx - 0.07, gy - 0.04, 1.7), (gx + 0.07, gy + 0.04, 2.36),
             lambda V: mix(IRON * 0.7, GLOW * 0.6, np.clip(1 - veins(V) * 6, 0, 1)[:, None] * 0.6), vox=0.55)
    suit.add('blade_fire', 'r_hand', lambda P: blade(P, 0.0055) + 0.002, (gx - 0.07, gy - 0.03, 1.7), (gx + 0.07, gy + 0.03, 2.36),
             lambda V: mix(GLOW, HOT, np.clip(fbm(V, 20.0)[:, None] * 1.5 - 0.3, 0, 1)), kind=7, mat=M_GLOW, vox=0.55)

    log('the Ashen Aegis')
    SC = np.array([-0.40, 0.31, 1.14]); SR = rot(rz=-0.42)                                       # his left arm, turned out a little
    def shield_2d(Q, grow=0.0):
        u, v = Q[:, 0], Q[:, 2]
        d = np.maximum(np.abs(u) - (0.2 + grow), v - (0.31 + grow))                                  # sides, top
        d = np.maximum(d, (np.abs(u) * 0.55 - v - 0.18) / 1.14 - grow)                                 # the point at its foot
        d = np.maximum(d, (np.abs(u) - 0.17) * 0.7 + (v - 0.27) * 0.7 - grow)                          # top corners cut
        return d
    def shield(P):
        Q = local(P, SC, SR)
        bulge = 0.025 * (1 - (Q[:, 0] / 0.22) ** 2 - ((Q[:, 2] - 0.05) / 0.4) ** 2)
        d = np.maximum(shield_2d(Q), np.abs(Q[:, 1] - bulge) - 0.022)
        rim = np.maximum(-shield_2d(Q, -0.03), shield_2d(Q))                                         # the raised rim
        d = smin(d, np.maximum(rim, np.abs(Q[:, 1] - bulge - 0.008) - 0.026), 0.004)
        # the gate: two towers and an arch, raised
        tw = np.minimum(rbox(Q, (-0.09, 0.03 + 0.0, 0.0), (0.035, 0.03, 0.15), 0.008), rbox(Q, (0.09, 0.03, 0.0), (0.035, 0.03, 0.15), 0.008))
        arch = np.maximum(rbox(Q, (0, 0.03, 0.12), (0.13, 0.03, 0.05), 0.01), -rbox(Q, (0, 0.03, 0.06), (0.055, 0.06, 0.08), 0.05))
        gate = np.minimum(tw, arch)
        gate = smax(gate, -rbox(Q, (-0.09, 0.07, -0.02), (0.012, 0.05, 0.06), 0.01), 0.002)
        gate = smax(gate, -rbox(Q, (0.09, 0.07, -0.02), (0.012, 0.05, 0.06), 0.01), 0.002)
        d = smin(d, gate, 0.004)
        d = smax(d, -rbox(Q, (0, 0.04, -0.03), (0.05, 0.035, 0.1), 0.03), 0.003)                  # the doorway, sunk (fire behind)
        return d
    def shield_col(V):
        Q = local(V, SC, SR)
        rim = shield_2d(Q, -0.03) > -0.004
        bulge = 0.025 * (1 - (Q[:, 0] / 0.22) ** 2 - ((Q[:, 2] - 0.05) / 0.4) ** 2)
        gate = Q[:, 1] > bulge + 0.034
        flames = (np.abs(Q[:, 0]) > 0.15) & (Q[:, 2] > 0.2) | (Q[:, 2] < -0.18) & (np.abs(Q[:, 0]) < 0.06)
        c = iron(V, np.clip(rim.astype(float) + gate + flames * 0.8, 0, 1))
        return c
    suit.add('aegis', 'l_fore', shield, SC - 0.36, SC + 0.36, shield_col, vox=0.8)
    suit.add('aegis_fire', 'l_fore', lambda P: rbox(local(P, SC, SR), (0, 0.012, -0.03), (0.05, 0.006, 0.1), 0.02, None),
             SC - 0.15, SC + 0.15, lambda V: mix(GLOW, HOT, np.clip((-local(V, SC, SR)[:, 2] + 0.05) * 6, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)
    suit.add('strap', 'l_fore', lambda P: cyl(P, A('l_wr') + [0.0, -0.02, 0], SC + SR @ np.array([0, -0.03, 0]), 0.02),
             np.minimum(A('l_wr'), SC) - 0.1, np.maximum(A('l_wr'), SC) + 0.1, lambda V: LEATHER * np.ones((len(V), 1)), mat=(0.7, 0.0))

    log('the helm and the Cinder Crown')
    hc, hh = np.array([0, 0.015, 1.79]), np.array([0.118, 0.13, 0.12])
    def helm_extra(P, d):
        Q = P - hc
        d = smin(d, rbox(P, hc + [0, 0.125, -0.01], (0.012, 0.02, 0.1), 0.008), 0.01)            # the ridge down its face
        d = smax(d, -rbox(P, hc + [0, 0.13, 0.025], (0.085, 0.05, 0.011), 0.006), 0.003)          # the eye slit
        for x in (-0.03, 0.03):
            d = smax(d, -rbox(P, hc + [x, 0.13, -0.06], (0.006, 0.05, 0.03), 0.004), 0.002)       # breaths
        return smax(d, -rbox(P, hc, hh - 0.018, 0.04), 0.004)                                       # hollow
    box_piece('helm', 'head', hc, hh, 0.045, extra=helm_extra,
              col=lambda V: iron(V, np.clip(trim(V, hc, hh, 0.016) + (np.abs(V[:, 0]) < 0.014) * (V[:, 1] > 0.1), 0, 1)))
    suit.add('slit_fire', 'head', lambda P: rbox(P, hc + [0, 0.1, 0.01], (0.08, 0.012, 0.03), 0.01), hc - 0.15, hc + 0.15,
             lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.7)
    crz = 1.905
    suit.add('crown', 'head', lambda P: np.maximum(np.abs(cap(P, (0, 0.015, crz), (0, 0.015, crz + 0.06), 0.132, 0.14) + 0.0) - 0.012,
                                                   np.abs(P[:, 2] - crz - 0.03) - 0.034) - 0.003 * np.abs(np.sin(np.arctan2(P[:, 1] - 0.015, P[:, 0]) * 16)),
             (-0.2, -0.19, crz - 0.08), (0.2, 0.22, crz + 0.12), lambda V: iron(V, 1.0), mat=M_GOLD, vox=0.7)
    for i in range(10):
        a = i / 10 * 2 * math.pi + math.pi / 2; tall = 0.16 if i % 2 == 0 else 0.10
        if i == 0: tall = 0.21
        base = np.array([math.cos(a) * 0.13, 0.015 + math.sin(a) * 0.13, crz + 0.04])
        tip = base + [math.cos(a) * 0.02, math.sin(a) * 0.02, tall]
        suit.add(f'prong{i}', 'head', lambda P, base=base, tip=tip: cap(P, base, tip, 0.022, 0.004, scale=(1, 1, 1)) - 0.0,
                 np.minimum(base, tip) - 0.05, np.maximum(base, tip) + 0.05,
                 lambda V, base=base: mix(np.array([0.12, 0.12, 0.15]), np.array([0.3, 0.3, 0.36]), np.clip((V[:, 2] - base[2]) * 6, 0, 1)[:, None]),
                 mat=(0.4, 0.6), vox=0.6)

    log('the legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        limb_piece(f'{k}_cuisse', f'{k}_thigh', hp + (kn - hp) * 0.12, kn + (hp - kn) * 0.12, 0.12, 0.098, scale=(1, 0.95, 1))
        ball(f'{k}_kneecop', f'{k}_thigh', kn + [0, 0.06, 0], 0.08, col=IRON2)
        box_piece(f'{k}_kneefan', f'{k}_thigh', kn + [s * 0.06, 0.03, 0], (0.012, 0.055, 0.06), 0.01)
        limb_piece(f'{k}_greave', f'{k}_shin', kn + (an - kn) * 0.12, an + (kn - an) * 0.05, 0.1, 0.08, scale=(1, 1.05, 1), bands=(0.06, 0.94))
        box_piece(f'{k}_greave_ridge', f'{k}_shin', (kn + an) / 2 + [0, 0.097, 0], (0.012, 0.012, 0.19), 0.008, col=lambda V: iron(V, 1.0), mat=M_GOLD)
        fc = (an + toe) / 2 + [0, 0.0, -0.02]; fc[2] = 0.055
        box_piece(f'{k}_sabaton', f'{k}_foot', fc, (0.075, 0.14, 0.05), 0.035, taper=(1, 0.25),
                  extra=(lambda P, d, fc=fc: d - 0.004 * np.abs(np.sin((P[:, 1] - fc[1]) * 70)) * (P[:, 1] > fc[1] - 0.02)))

    log('the cape of ash')
    def cape_surface(P, z0, z1, w0, w1, y0, k):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        t = np.clip((z0 - z) / (z0 - z1), 0, 1); w = w0 + (w1 - w0) * t
        yc = y0 - 0.025 * t + 0.07 * (x / 0.3) ** 2 + 0.012 * np.sin(x * 38 + 2 * fbm(P, 3.0, 2)) * t     # folds
        d = np.abs(y - yc) - 0.009
        d = np.maximum(d, np.abs(x) - w)
        hem = z1 - 0.13 * fbm(P * [1, 1, 0.2], 9.0, 2) - 0.06 * np.abs(np.sin(x * 23))              # ragged, torn
        return np.maximum(d, np.maximum(z - z0, hem - z)), hem
    def cape_col(V, z1):
        _, hem = cape_surface(V, 9, z1, 9, 9, 0, 1)
        burnt = np.clip(1 - (V[:, 2] - hem) / 0.15, 0, 1)[:, None]
        c = mix(ASH, ASH2, np.clip(fbm(V, 6.0)[:, None] * 1.3 - 0.2, 0, 1)) * (0.8 + 0.3 * fbm(V * [1, 1, 0.15], 40.0)[:, None])
        return mix(c, ASH2 * 0.6, burnt)
    suit.add('cape_top', 'chest', lambda P: cape_surface(P, 1.62, 1.05, 0.29, 0.34, -0.185, 1)[0] if True else 0,
             (-0.42, -0.4, 0.98), (0.42, -0.1, 1.66), lambda V: cape_col(V, 0.5), mat=M_CLOTH)
    suit.add('cape_low', 'cape', lambda P: np.maximum(cape_surface(P, 1.13, 0.47, 0.345, 0.38, -0.215, 1)[0], -0.0 * P[:, 2]),
             (-0.46, -0.45, 0.22), (0.46, -0.12, 1.16), lambda V: cape_col(V, 0.47), mat=M_CLOTH)

    def tabard(P):                                                                                  # the ash cloth hanging before him from the belt
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        t = np.clip((1.06 - z) / 0.45, 0, 1); w = 0.11 + 0.04 * t
        yc = 0.165 + 0.02 * t - 0.25 * x ** 2 + 0.008 * np.sin(x * 50 + 2 * fbm(P, 3.0, 2)) * t
        hem = 0.6 - 0.1 * fbm(P * [1, 1, 0.2], 9.0, 2) - 0.05 * np.abs(np.sin(x * 30))
        return np.maximum(np.maximum(np.abs(y - yc) - 0.008, np.abs(x) - w), np.maximum(z - 1.06, hem - z))
    suit.add('tabard', 'hips', tabard, (-0.2, 0.08, 0.42), (0.2, 0.26, 1.1), lambda V: cape_col(V, 0.6), mat=M_CLOTH)

    pieces = suit.build()
    save_pieces(HERE, pieces)
    return M
