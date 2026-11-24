# Forge-Warden (the Hearth Below: veteran), in full detail for the foe kit (November 24, the polish pass): from
# Chris's sheet, a kiln of red firebrick as tall as a door on short iron legs, an anvil for a head, a chimney burning
# behind it, a pleated wooden bellows on its right side, a furnace door glowing in its breast, iron arms jointed and
# banded in brass, an iron fist on its right and a hammer for its left hand, its face glowing. Every part is a piece of
# its own on one bone (kit/py/armour.py), so nothing stretches. x its right, y forward, z up.
import os, sys, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'kit', 'py'))
from armour import Suit, rbox, rivets, cyl, along, rot, local, humanoid_bones, save_pieces

J = dict(hip=(0, 0, 0.44), waist=(0, 0, 0.56), chest=(0, 0, 0.7), neck=(0, 0, 1.29), head=(0, 0, 1.33), top=(0, 0, 1.75),
         r_sh=(0.52, 0, 1.14), r_el=(0.57, 0.02, 0.86), r_wr=(0.58, 0.06, 0.62), r_fist=(0.58, 0.07, 0.5),
         l_sh=(-0.52, 0, 1.14), l_el=(-0.57, 0.02, 0.86), l_wr=(-0.58, 0.06, 0.62), l_fist=(-0.58, 0.07, 0.48),
         r_hip=(0.2, 0, 0.42), r_knee=(0.21, 0.01, 0.27), r_ank=(0.21, 0.0, 0.12), r_toe=(0.21, 0.2, 0.03),
         l_hip=(-0.2, 0, 0.42), l_knee=(-0.21, 0.01, 0.27), l_ank=(-0.21, 0.0, 0.12), l_toe=(-0.21, 0.2, 0.03))
BONES = humanoid_bones(J)
BRICK = np.array([0.62, 0.24, 0.14]); BRICK2 = np.array([0.82, 0.4, 0.24]); MORTAR = np.array([0.3, 0.2, 0.16])
IRON = np.array([0.17, 0.16, 0.18]); IRON2 = np.array([0.34, 0.32, 0.34]); BRASS = np.array([0.55, 0.37, 0.16])
WOOD = np.array([0.48, 0.3, 0.15]); WOOD2 = np.array([0.7, 0.47, 0.25]); GLOW = np.array([1.0, 0.56, 0.14]); HOT = np.array([1.0, 0.85, 0.42])
M_BRICK, M_IRON, M_BRASS, M_WOOD, M_GLOW = (0.85, 0.0), (0.42, 0.85), (0.3, 0.95), (0.7, 0.0), (0.5, 0.0)
A = lambda k: np.array(J[k], float)
BC, BH = np.array([0, 0, 0.86]), np.array([0.45, 0.32, 0.44])                                  # the kiln
DOOR = np.array([0, 0.32, 0.8])


def bricks(P):
    """(mortar 0..1, brick id) on the kiln's faces: rows of bricks, every other row half a brick along"""
    Q = np.asarray(P) - BC; z = Q[:, 2]; row = np.floor(z / 0.075); fz = z / 0.075 - row
    u = np.where(np.abs(Q[:, 0]) / BH[0] > np.abs(Q[:, 1]) / BH[1], Q[:, 1], Q[:, 0])          # along the face
    v = u / 0.16 + 0.5 * (row % 2); col = np.floor(v); fu = v - col
    m = np.maximum(np.clip(1 - np.minimum(fz, 1 - fz) / 0.1, 0, 1), np.clip(1 - np.minimum(fu, 1 - fu) / 0.05, 0, 1))
    h = np.sin(row * 12.9898 + col * 78.233) * 43758.5453
    return m, h - np.floor(h)


def build(K):
    S, LV, log = K.sdf, K.LV, K.log
    smin, smax, ell, cap, fbm, mix = S.smin, S.smax, S.ell, S.cap, S.fbm, S.mix
    M = K.Mesh(); suit = Suit(K, M)
    iron = lambda V: mix(IRON, IRON2, np.clip(fbm(V, 12.0)[:, None] * 1.4 - 0.3, 0, 1)) * (0.85 + 0.3 * fbm(V, 50.0)[:, None])
    brass = lambda V: BRASS * (0.8 + 0.3 * fbm(V, 40.0)[:, None])

    log('the kiln')
    def kiln(P):
        d = rbox(P, BC, BH, 0.03)
        m, _ = bricks(P); d = d + 0.008 * m - 0.003 * (fbm(P, 25.0, 2) - 0.5)
        return smax(d, -rbox(P, DOOR, (0.12, 0.08, 0.1), 0.01), 0.004)                            # the furnace mouth
    def kiln_col(V):
        m, h = bricks(V)
        c = mix(BRICK, BRICK2, h[:, None] * 0.8) * (0.85 + 0.3 * fbm(V, 30.0)[:, None])
        c = mix(c, c * 0.45, np.clip(fbm(V, 6.0)[:, None] - 0.62, 0, 1) * 2)                  # soot
        return mix(c, MORTAR, m[:, None])
    suit.add('kiln', 'chest', kiln, BC - BH - 0.05, BC + BH + 0.05, kiln_col, mat=M_BRICK)
    for z, hgt in ((BC[2] + BH[2] + 0.01, 0.03), (BC[2] + BH[2] - 0.12, 0.022)):                 # iron bands round its top
        suit.add(f'band{z:.2f}', 'chest', lambda P, z=z, hgt=hgt: np.maximum(rbox(P, (0, 0, z), (BH[0] + 0.02, BH[1] + 0.02, hgt), 0.01), -rbox(P, (0, 0, z), (BH[0] - 0.02, BH[1] - 0.02, 0.2), 0.01)) - 0.004 * np.sqrt(rivets(P, (0, 0, z), (BH[0] + 0.02, BH[1] + 0.02, hgt), 0.015, 0.08, 0.01)),
                 (-0.45, -0.37, z - 0.05), (0.45, 0.37, z + 0.05), iron, mat=M_IRON, vox=0.8)
    def door(P):
        frame = np.maximum(rbox(P, DOOR + [0, 0.01, 0], (0.14, 0.02, 0.12), 0.01), -rbox(P, DOOR, (0.11, 0.05, 0.09), 0.006))
        bars = np.maximum(rbox(P, DOOR + [0, 0.0, 0], (0.11, 0.012, 0.09), 0.004), np.abs(((P[:, 0] + 0.11) % 0.044) - 0.022) - 0.006)
        return np.minimum(frame, bars) - 0.004 * np.sqrt(rivets(P, DOOR + [0, 0.01, 0], (0.14, 0.02, 0.12), 0.012, 0.05, 0.008))
    suit.add('door', 'chest', door, DOOR - 0.2, DOOR + 0.2, iron, mat=M_IRON, vox=0.6)
    suit.add('door_fire', 'chest', lambda P: rbox(P, DOOR - [0, 0.05, 0], (0.11, 0.02, 0.09), 0.01), DOOR - 0.15, DOOR + 0.15,
             lambda V: mix(HOT, GLOW, np.clip(np.abs(V[:, 2] - DOOR[2]) * 10, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)

    log('the anvil, the chimney, the bellows')
    az = BC[2] + BH[2] + 0.04
    def anvil(P):
        return anvil1((np.asarray(P) - [0, 0, az]) / 1.45 + [0, 0, az]) * 1.45                       # bigger, as the sheet
    def anvil1(P):
        P = np.asarray(P) * [-1, 1, 1]                                                           # its horn to its left (the sheet)
        base = rbox(P, (0, 0, az + 0.05), (0.15, 0.13, 0.05), 0.015, taper=(2, -0.25))
        waist = rbox(P, (0, 0, az + 0.13), (0.09, 0.08, 0.05), 0.012)
        face = rbox(P, (0.04, 0, az + 0.22), (0.2, 0.12, 0.05), 0.012)
        hx = 0.24; Q = P - np.array([hx, 0, az + 0.22]); t = np.clip(Q[:, 0] / 0.22, 0, 1)
        horn = np.maximum(np.hypot(Q[:, 1], Q[:, 2] + 0.01 * t) - 0.065 * (1 - t) ** 0.9 - 0.004, np.maximum(-Q[:, 0], Q[:, 0] - 0.22))
        heel = rbox(P, (-0.18, 0, az + 0.23), (0.04, 0.1, 0.035), 0.01)
        return np.minimum(np.minimum(smin(smin(base, waist, 0.03), face, 0.03), horn), heel)
    def anvil_col(V):
        c = iron(V); slot = (np.abs(V[:, 0] + 0.02) < 0.06) & (V[:, 1] > 0.1) & (np.abs(V[:, 2] - az - 0.22) < 0.015)
        return mix(c, BRASS, (V[:, 2] > az + 0.265).astype(float)[:, None] * 0.25)
    suit.add('anvil', 'head', anvil, (-0.75, -0.3, az - 0.02), (0.45, 0.3, az + 0.47), anvil_col, mat=M_IRON)
    suit.add('anvil_glow', 'head', lambda P: rbox(P, (-0.17, 0.168, az + 0.32), (0.075, 0.014, 0.016), 0.005), (-0.35, 0.08, az + 0.2), (0.0, 0.25, az + 0.45),
             lambda V: np.tile(GLOW, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.5)
    cx, cy = 0.3, -0.13
    suit.add('chimney', 'chest', lambda P: np.maximum(np.minimum(cyl(P, (cx, cy, 1.25), (cx, cy, 1.92), 0.065), cyl(P, (cx, cy, 1.87), (cx, cy, 1.94), 0.08)), -cyl(P, (cx, cy, 1.75), (cx, cy, 2.0), 0.048)),
             (cx - 0.12, cy - 0.12, 1.2), (cx + 0.12, cy + 0.12, 2.0), iron, mat=M_IRON, vox=0.7)
    for i in range(3):                                                                         # the flame from it
        a = np.array([cx + 0.012 * (i - 1), cy, 1.9]); b = a + [0.05 * math.sin(i * 2.1), 0.03 * math.cos(i * 1.7), 0.22 + 0.06 * i]
        suit.add(f'flame{i}', 'chest', lambda P, a=a, b=b: smin(cap(P, a, (a + b) / 2 + [0.025, 0, 0], 0.045, 0.028), cap(P, (a + b) / 2 + [0.025, 0, 0], b, 0.028, 0.002), 0.02),
                 a - 0.08, b + 0.06, lambda V, a=a: mix(HOT, GLOW, np.clip((V[:, 2] - a[2]) * 6, 0, 1)[:, None]), kind=7, mat=M_GLOW, vox=0.6)
    bc_ = np.array([BH[0] + 0.08, -0.04, 1.2]); bR = rot(ry=-0.35)
    def bellows(P):
        Q = local(P, bc_, bR); y, z = Q[:, 1], Q[:, 2]
        w = 0.28 * np.clip((z + 0.2) / 0.4, 0, 1) + 0.03                                   # a wedge, wide at its top
        pleat = 0.012 * np.abs(np.sin(np.arctan2(z + 0.2, y) * 22))
        d = np.maximum(np.maximum(np.abs(Q[:, 0]) - (0.05 + pleat), np.abs(y) - w), np.abs(z) - 0.2)
        boards = np.maximum(np.maximum(np.abs(np.abs(Q[:, 0]) - 0.06) - 0.012, np.abs(y) - w - 0.01), np.abs(z) - 0.21)
        return np.minimum(d, boards)
    suit.add('bellows', 'chest', bellows, bc_ - 0.3, bc_ + 0.3, lambda V: mix(WOOD, WOOD2, np.clip(fbm(V * [1, 3, 1], 20.0)[:, None] * 1.4 - 0.3, 0, 1)), mat=M_WOOD, vox=0.8)

    log('arms and legs')
    for s, k in ((1, 'r'), (-1, 'l')):
        sh, el, wr, fist = A(f'{k}_sh'), A(f'{k}_el'), A(f'{k}_wr'), A(f'{k}_fist')
        suit.add(f'{k}_shoulder', 'chest', lambda P, sh=sh: ell(P, sh, (0.085, 0.085, 0.085)), sh - 0.12, sh + 0.12, iron, mat=M_IRON)
        for seg_, (a, b) in enumerate([(sh, el), (el, wr)]):
            bone = f'{k}_upper' if seg_ == 0 else f'{k}_fore'
            suit.add(f'{k}_arm{seg_}', bone, lambda P, a=a, b=b: cap(P, a + (b - a) * 0.1, b - (b - a) * 0.08, 0.06, 0.055), np.minimum(a, b) - 0.1, np.maximum(a, b) + 0.1, iron, mat=M_IRON)
            for t in (0.25, 0.75):
                c = a + (b - a) * t
                suit.add(f'{k}_ring{seg_}{t}', bone, lambda P, a=a, b=b, c=c: np.maximum(cap(P, c - (b - a) * 0.04, c + (b - a) * 0.04, 0.066, 0.066), -cap(P, c - (b - a) * 0.2, c + (b - a) * 0.2, 0.05, 0.05)),
                         c - 0.1, c + 0.1, brass, mat=M_BRASS, vox=0.7)
        suit.add(f'{k}_elbow', f'{k}_upper', lambda P, el=el: ell(P, el, (0.07, 0.07, 0.07)), el - 0.1, el + 0.1, iron, mat=M_IRON)
        if k == 'r':
            suit.add('r_fist', 'r_hand', lambda P, fist=fist: rbox(P, fist, (0.07, 0.075, 0.075), 0.035) - 0.005 * np.clip(np.cos((P[:, 0] - fist[0]) * 70), 0, 1) * (P[:, 1] > fist[1] + 0.04),
                     fist - 0.12, fist + 0.12, iron, mat=M_IRON)
        else:   # the hammer: a block of iron for a hand, its face glowing
            hc = fist + [0, 0.0, -0.04]
            suit.add('hammer', 'l_hand', lambda P: np.minimum(rbox(P, hc, (0.13, 0.08, 0.075), 0.02) - 0.004 * np.sqrt(rivets(P, hc, (0.13, 0.08, 0.075), 0.015, 0.05, 0.009)),
                                                            cyl(P, hc + [0, 0, 0.05], wr, 0.04)), hc - 0.2, hc + 0.2, iron, mat=M_IRON)
            suit.add('hammer_face', 'l_hand', lambda P: rbox(P, hc + [-0.13, 0, 0], (0.012, 0.065, 0.06), 0.01), hc - 0.18, hc + 0.18,
                     lambda V: np.tile(HOT, (len(V), 1)), kind=7, mat=M_GLOW, vox=0.6)
        hp, kn, an, toe = A(f'{k}_hip'), A(f'{k}_knee'), A(f'{k}_ank'), A(f'{k}_toe')
        suit.add(f'{k}_thigh', f'{k}_thigh', lambda P, hp=hp, kn=kn: rbox(P, (hp + kn) / 2, (0.11, 0.11, 0.09), 0.04), np.minimum(hp, kn) - 0.15, np.maximum(hp, kn) + 0.15, iron, mat=M_IRON)
        suit.add(f'{k}_shin', f'{k}_shin', lambda P, kn=kn, an=an: rbox(P, (kn + an) / 2 + [0, 0, 0.0], (0.12, 0.125, 0.09), 0.04) - 0.004 * np.sqrt(rivets(P, (kn + an) / 2, (0.12, 0.125, 0.09), 0.02, 0.06, 0.01)),
                 np.minimum(kn, an) - 0.15, np.maximum(kn, an) + 0.15, iron, mat=M_IRON)
        suit.add(f'{k}_kneeband', f'{k}_shin', lambda P, kn=kn: rbox(P, kn + [0, 0, 0.0], (0.13, 0.135, 0.018), 0.01), kn - 0.15, kn + 0.1, brass, mat=M_BRASS, vox=0.8)
        fc = (an + toe) / 2; fc[2] = 0.065
        suit.add(f'{k}_boot', f'{k}_foot', lambda P, fc=fc: rbox(P, fc, (0.12, 0.19, 0.065), 0.04, taper=(1, 0.15)), fc - 0.25, fc + 0.25, iron, mat=M_IRON)
        suit.add(f'{k}_bootband', f'{k}_foot', lambda P, fc=fc: np.maximum(rbox(P, fc + [0, 0, 0.03], (0.125, 0.195, 0.018), 0.01), -rbox(P, fc + [0, 0, 0.03], (0.11, 0.18, 0.05), 0.01)),
                 fc - 0.25, fc + 0.25, brass, mat=M_BRASS, vox=0.8)

    save_pieces(HERE, suit.build())
    return M
