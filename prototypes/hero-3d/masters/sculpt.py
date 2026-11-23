#!/usr/bin/env python3
"""Sculpted masters for the heroes' and people's pieces (November 21, Chris: the heroes at the full-detail foes' level).

The outfits are built in code from each item's numbers, so any item can be switched. A foe's sculpt is baked onto one
fixed model; here each KIND of piece (a boot, a trouser leg, a tunic, a kettle hat...) gets a sculpted master instead,
made in the piece's own surface coordinates: u runs round it, v along it, the same way the code builds every piece of
that kind (kit.js loft/tube/lathe). So the master fits any boot, whatever its size, colour or material.

A master is a height field (the sculpt: folds, creases, seams, stitches, welts, dents, rolled edges), 1024 x 1024 in
the piece's own proportions (C round, L along, in hero units: a hero is about 1.2 tall). From it:
  - the bake: its slopes (a normal map: red along u, green along v) and its occlusion (blue: dark in the bottom of every
    crease), at 256 px a kind, in one shared 1024 px atlas (4 x 4 cells) the game uses: atlas.webp
  - the sculpt you can look at: heights.webp (512 px a kind) that the Gear Room's "Sculpt" view raises the real pieces
    by, subdivided to about a million triangles for the whole hero
  - src/<kind>.png: the full 1024 px height, 16 bit (the master itself)
Writes atlas.webp, heights.webp, src/*.png, pack.js (the two pictures as data URLs, each kind's cell, amplitude and
slope scale). The same every run (fixed seeds).

    python3 masters/sculpt.py            (from prototypes/hero-3d)
"""
import base64, io, json, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
N = 1024
COLS, ROWS = 4, 9             # the atlas: 4 across, 9 down
CELL = 256                   # each kind's bake
HCELL = 512                  # each kind's height, for the sculpt view
INSET = 2                    # pixels kept clear round each cell (the code maps the piece inside them)

# u is round the piece (0..1, and it wraps), v along it (0..1); front: where u puts the front of the body
#   loft rings from ellipse(): u 0 is the hero's left side (+x), 0.25 the front;  tubes going down: u 0 is the front
KINDS = {
    #  name       cell  C round  L along  front  what is where along v
    'torso':    (0,  0.78, 0.42, 0.25),  # v 0 the hips, 1 the neck
    'skirt':    (1,  0.85, 0.16, 0.25),  # v 0 the waist, 1 the hem
    'sleeve':   (2,  0.26, 0.20, 0.0),   # v 0 the shoulder, 1 the elbow
    'forearm':  (3,  0.20, 0.19, 0.0),   # v 0 the elbow, 1 the wrist
    'trousers': (4,  0.32, 0.50, 0.0),   # v 0 the hip, 1 the ankle
    'boot':     (5,  0.30, 0.24, 0.0),   # v 0 the top of the shaft, 1 the foot
    'foot':     (6,  0.30, 0.22, 0.0),   # v 0 the heel, 1 the toe; u 0 the top of the foot, 0.5 the sole
    'belt':     (7,  0.82, 0.04, 0.25),  # v 0 the top edge, 1 the bottom
    'tabard':   (8,  0.30, 0.50, 0.0),   # u 0 one face, 0.25 an edge, 0.5 the other face; v 0 the shoulder, 1 the hem
    'cape':     (9,  0.70, 0.75, None),  # u across (0 one edge, 1 the other), v 0 the shoulders, 1 the hem
    'kettle':   (10, 0.95, 0.42, 0.0),   # lathe: u 0 the front; v by height: crown 0, brim .78-.86, lip .86-.9, under 1
    'helm':     (11, 0.95, 0.50, 0.0),   # lathes: u 0 the front; v by height, crown 0 to chin 1 (the band at .4)
    'hood':     (12, 0.90, 0.55, 0.0),   # lathes: u 0 the front (the face opening from .15 to .85 round), v crown 0 to neck 1
    'mantle':   (13, 0.85, 0.12, 0.25),  # a mantle, a pelt, a hood's drape: v 0 the neck, 1 over the shoulders
    'glove':    (14, 0.11, 0.06, 0.0),   # the hand: v 0 the wrist, 1 the knuckles
    'finger':   (15, 0.04, 0.05, None),  # a finger or thumb: v 0 the knuckle, 1 the tip
    'robesleeve': (16, 0.40, 0.20, 0.0), # a robe's open sleeve: v 0 the elbow, 1 the cuff
    'plate':    (17, 0.80, 0.35, 0.25),  # a breastplate and backplate: v 0 the waist, 1 the shoulders
    'lame':     (18, 0.85, 0.05, 0.25),  # one lame of plate below the waist: v 0 the top, 1 the bottom
    'vambrace': (19, 0.20, 0.16, 0.0),   # plate round the forearm or shin: v 0 the top, 1 the bottom
    'pauldron': (20, 0.60, 0.12, None),  # a shoulder lame (part of a sphere): v 0 the edge, 1 the top
    'shield':   (21, 0.60, 0.60, None),  # a shield's face, flat: u across, v up (0..1 over the shield's width and height)
    'grip':     (22, 0.07, 0.10, None),  # a weapon's grip: v 0 the pommel end, 1 the guard
    'lock':     (23, 0.05, 0.15, None),  # a lock of hair (and the hair's cap): strands run along v
    'shoulder': (24, 0.35, 0.15, None),  # the ball of the shoulder under a sleeve (a sphere: v 0 below, 1 on top)
    'haft':     (25, 0.06, 0.60, None),  # a wooden haft, a staff, a bow's limb: v along it
    'braid':    (26, 0.05, 0.60, None),  # a cloth or leather trim, a cord: u round the cord, v along it
    'rim':      (27, 0.05, 0.60, None),  # a metal rim, trim, guard or ridge: u round it, v along it
    'strap':    (28, 0.05, 0.30, None),  # a flat strap (u 0 and .5 its faces, .25 and .75 its edges), a pouch
    'blade':    (29, 0.08, 0.50, None),  # a blade: u 0 and .5 its edges, .25 and .75 the middle of each face; v to the tip
    'forged':   (30, 0.15, 0.15, None),  # a forged head (axe, spear, mace, hammer, pommel), laid on flat over it
    'hand':     (31, 0.11, 0.06, None),  # a bare hand: v 0 the wrist, 1 the knuckles; the back at u 0 or .5 (by the side)
    'head':     (32, 0.55, 0.30, 0.25),  # the skull under the painted face (a sphere: u .25 the front, v 0 the chin, 1 the crown)
    'lace':     (33, 0.85, 0.36, None),  # a lace-edged robe (a surplice): v 0 the top, 1 the scalloped hem; eyelets toward the hem
    'embroid':  (34, 0.85, 0.80, None),  # an embroidered cope or panel: vines of raised thread climbing from the hem
    'battered': (35, 0.70, 0.40, None),  # old plate that has kept a stair for a century: deep dents, gouges, scratches, soot
}
rng = np.random.default_rng(21)
V_, U_ = np.mgrid[0:N, 0:N] / N          # V_ down the rows (v), U_ across (u)
fu = np.fft.fftfreq(N)[None, :]; fv = np.fft.fftfreq(N)[:, None]


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)


def band(x, a, b, soft):
    return ss(a - soft, a + soft, x) * (1 - ss(b - soft, b + soft, x))


def wrapd(a, b):
    """distance round the piece in u (wraps)"""
    d = np.abs(a - b) % 1.0; return np.minimum(d, 1 - d)


class Piece:
    def __init__(self, C, L):
        self.C, self.L = C, L
        self.x = U_ * C; self.y = V_ * L    # hero units

    def noise(self, su, sv, seed=None):
        """smooth noise with features about su round and sv along (hero units); wraps round"""
        r = np.random.default_rng(seed) if seed is not None else rng
        w = r.standard_normal((N, N))
        k = np.exp(-2 * np.pi ** 2 * ((fu * N / self.C * su / 2.5) ** 2 + (fv * N / self.L * sv / 2.5) ** 2))
        k[0, 0] = 0
        a = np.real(np.fft.ifft2(np.fft.fft2(w) * k)); return a / (a.std() + 1e-9)

    def blur(self, a, s):
        k = np.exp(-2 * np.pi ** 2 * ((fu * N / self.C * s) ** 2 + (fv * N / self.L * s) ** 2))
        return np.real(np.fft.ifft2(np.fft.fft2(a) * k))

    def folds(self, width, length, seed):
        """drape: soft rounded folds running along v"""
        return self.noise(width, length, seed)

    def creases(self, width, length, seed, sharp=3.0):
        """creases: thin grooves where the noise crosses zero"""
        return -np.exp(-np.abs(self.noise(width, length, seed)) * sharp)

    def seam_u(self, u0, w=0.004, stitch=0.006):
        """a seam running along v at u0: two raised edges with a groove between, and the stitches across it"""
        d = wrapd(U_, u0) * self.C
        ridge = np.exp(-((d - w) / (w * 0.6)) ** 2) * 0.6 - np.exp(-(d / (w * 0.5)) ** 2) * 0.5
        st = (np.sin(self.y / stitch * 2 * np.pi) > 0.3) * np.exp(-(d / (w * 1.2)) ** 2) * 0.35
        return ridge + st

    def stitch_v(self, v0, step=0.006, w=0.0018):
        """a row of stitches running round the piece at v0"""
        d = np.abs(V_ - v0) * self.L
        on = (np.sin(self.x / step * 2 * np.pi) > 0.2).astype(float)
        return self.blur(on * np.exp(-(d / w) ** 2), 0.0006) * 0.5 - np.exp(-(d / (w * 0.7)) ** 2) * 0.15

    def welt(self, v0, v1, h=1.0, soft=0.004):
        """a raised band between v0 and v1 (a hem turned over, a cuff, a rolled edge), rounded"""
        t = band(self.y, v0 * self.L, v1 * self.L, soft)
        return t * h

    def wrinkles(self, vc, spread, front, amount, seed, width=0.024):
        """bunched wrinkles round a bend (elbow, knee, ankle): grooves running round, wavering, breaking off, strongest at
        the front, a ridge of cloth between each two"""
        spacing = width
        phase = self.y / spacing + self.noise(0.05, 0.4, seed) * 0.5 + self.noise(0.02, 0.4, seed + 1) * 0.25
        s = np.sin(np.pi * phase)
        groove = -np.exp(-s * s * 18) + 0.25 * np.cos(np.pi * phase) ** 2 * 0   # thin groove
        ridge = (1 - s * s) * 0.0 + np.exp(-(np.cos(np.pi * phase)) ** 2 * 3) * 0.35
        mask = np.clip(self.noise(0.04, 0.03, seed + 2) * 0.9 + 0.1, 0, 1)    # grooves break off
        fall = np.exp(-((V_ - vc) * self.L / spread) ** 2)
        fr = 1.0 if front is None else 0.35 + 0.65 * np.clip(np.cos((U_ - front) * 2 * np.pi), 0, 1) ** 1.5
        return (groove + ridge * 0.6) * mask * fall * fr * amount

    def dents(self, n, rmin, rmax, depth, vmin=0, vmax=1, seed=5):
        r = np.random.default_rng(seed); h = np.zeros((N, N))
        for _ in range(n):
            cu, cv, rr = r.uniform(0, 1), r.uniform(vmin, vmax), r.uniform(rmin, rmax)
            du = wrapd(U_, cu) * self.C; dv = (V_ - cv) * self.L
            h -= np.exp(-(du * du + dv * dv) / (rr * rr)) * depth * r.uniform(0.5, 1)
        return h

    def bumps_row(self, v0, count, r, h=1.0, phase=0.0):
        """round bumps (rivets, studs) in a ring at v0"""
        out = np.zeros((N, N))
        for i in range(count):
            cu = (i + phase) / count
            du = wrapd(U_, cu) * self.C; dv = (V_ - v0) * self.L
            out += np.sqrt(np.clip(1 - (du * du + dv * dv) / (r * r), 0, 1)) * h
        return out


def frontness(front, width=0.25):
    if front is None: return np.ones((N, N))
    return np.exp(-(wrapd(U_, front) / width) ** 2)


def sculpt(kind):
    cell, C, L, front = KINDS[kind]
    P = Piece(C, L)
    if kind == 'torso':
        h = P.folds(0.05, 0.25, 1) * 0.0035                      # soft drape running down
        h += P.creases(0.04, 0.12, 2) * 0.0016                   # where the cloth pulls
        h += P.wrinkles(0.12, 0.05, front, 0.0025, 3)            # bunched above the belt
        for s in (0.0, 0.5): h += P.seam_u(s) * 0.0018           # the side seams
        h += P.welt(0.94, 1.01, 0.0025) + P.stitch_v(0.93) * 0.002  # the neckline hem
        h += P.welt(-0.01, 0.05, 0.002) + P.stitch_v(0.06) * 0.0018
        h += P.noise(0.004, 0.004, 4) * 0.00025                  # the cloth's own weave lumps
    elif kind == 'skirt':
        h = P.folds(0.035, 0.4, 11) * 0.004 * (0.4 + V_)          # folds opening toward the hem
        h += P.creases(0.03, 0.2, 12) * 0.0012
        h += P.welt(0.88, 1.01, 0.003) + P.stitch_v(0.86) * 0.002 + P.stitch_v(0.97) * 0.0015
        h += P.welt(-0.01, 0.07, 0.0015)                         # gathered at the waist
        h += np.sin(U_ * 2 * np.pi * 26) * 0.0012 * (1 - ss(0.0, 0.25, V_))   # little gathers under the belt
        h += P.noise(0.004, 0.004, 13) * 0.00025
    elif kind == 'sleeve':
        h = P.folds(0.03, 0.12, 21) * 0.0018
        h += P.wrinkles(0.88, 0.05, 0.5, 0.004, 22)              # the inside of the elbow bunches
        h += P.seam_u(0.5) * 0.0014                              # the seam under the arm
        h += P.welt(-0.01, 0.07, 0.0016) + P.stitch_v(0.08) * 0.0016  # the shoulder seam
        h += P.noise(0.004, 0.004, 23) * 0.0002
    elif kind == 'forearm':
        h = P.folds(0.025, 0.1, 31) * 0.0015
        h += P.wrinkles(0.1, 0.05, 0.5, 0.0035, 32)              # bunched at the elbow
        h += P.seam_u(0.5) * 0.0012
        h += P.welt(0.86, 1.01, 0.0022) + P.stitch_v(0.85) * 0.0016 + P.stitch_v(0.96) * 0.0012  # the cuff
        h += P.noise(0.004, 0.004, 33) * 0.0002
    elif kind == 'trousers':
        h = P.folds(0.03, 0.2, 41) * 0.0022
        h += P.wrinkles(0.52, 0.035, 0.0, 0.003, 42)             # the knee
        h += P.wrinkles(0.04, 0.04, 0.5, 0.003, 43)              # the seat and crotch
        h += P.wrinkles(0.9, 0.04, None, 0.002, 44)              # gathered into the boot
        for s in (0.25, 0.75): h += P.seam_u(s) * 0.0015         # inside and outside seams
        h += P.noise(0.004, 0.004, 45) * 0.0002
    elif kind == 'boot':
        h = P.creases(0.05, 0.02, 51, 2.5) * 0.0009 * (0.3 + band(V_, 0.45, 0.85, 0.1))  # leather creasing round the ankle
        h += P.wrinkles(0.68, 0.04, 0.0, 0.003, 52)              # the ankle's bend, at the front
        h += P.welt(-0.01, 0.1, 0.0035) + P.stitch_v(0.11) * 0.002 + P.stitch_v(0.03) * 0.0012   # the turned top
        h += P.seam_u(0.5, 0.004, 0.006) * 0.0022                # the seam up the back
        h += P.folds(0.04, 0.08, 53) * 0.0008
        h += P.noise(0.003, 0.003, 54) * 0.00025                 # pebbled leather
    elif kind == 'foot':
        toe = 0.62 + 0.06 * np.cos((U_) * 2 * np.pi)              # the toe cap's curved edge
        h = ss(-0.004, 0.004, (V_ - toe) * L) * 0.0014           # the cap sits proud
        d = np.abs(V_ - toe) * L
        h += (np.sin(P.x / 0.006 * 2 * np.pi) > 0.2) * np.exp(-(d / 0.002) ** 2) * 0.001 - np.exp(-(d / 0.0012) ** 2) * 0.0008
        h += P.wrinkles(0.5, 0.03, 0.0, 0.004, 61)               # the flex across the top of the foot
        sole = np.exp(-(wrapd(U_, 0.5) / 0.08) ** 2)
        h += -sole * 0.003 + P.noise(0.003, 0.003, 62) * 0.00025
        h += np.exp(-((wrapd(U_, 0.5) - 0.13) / 0.012) ** 2) * 0.0018      # the welt round the sole
    elif kind == 'belt':
        h = P.stitch_v(0.18, 0.005, 0.0012) * 0.0018 + P.stitch_v(0.82, 0.005, 0.0012) * 0.0018
        h += (ss(0.0, 0.12, V_) * (1 - ss(0.88, 1.0, V_))) * 0.0012                       # rounded edges
        for i in range(5):                                                                # the holes by the buckle
            cu = 0.25 + 0.035 + i * 0.022; du = wrapd(U_, cu) * C; dv = (V_ - 0.5) * L
            h -= np.exp(-(du * du + dv * dv) / 0.0022 ** 2) * 0.0025
        h += P.creases(0.03, 0.03, 71, 2.5) * 0.0006 + P.noise(0.003, 0.003, 72) * 0.0002
    elif kind == 'tabard':
        face = np.cos(U_ * 4 * np.pi) ** 2                                               # 1 on the faces, 0 at the edges
        h = P.folds(0.03, 0.22, 81) * 0.0025 * face
        edge = np.minimum(wrapd(U_, 0.25), wrapd(U_, 0.75)) * C
        border = band(edge, 0.012, 0.028, 0.002)                                        # an embroidered border round it
        h += border * (0.0012 + (np.sin(P.y / 0.008 * 2 * np.pi) * np.sin(P.x / 0.008 * 2 * np.pi) > 0) * 0.0008)
        h += P.welt(0.93, 1.01, 0.0025) + P.stitch_v(0.92) * 0.0016
        h += P.noise(0.004, 0.004, 82) * 0.0002
    elif kind == 'cape':
        h = P.folds(0.05, 0.4, 91) * 0.004 * (0.3 + V_)                                 # long folds, deeper toward the hem
        h += P.creases(0.04, 0.25, 92) * 0.0015
        h += np.sin(U_ * 2 * np.pi * 14) * 0.0018 * (1 - ss(0.0, 0.12, V_))             # gathered at the shoulders
        h += P.welt(0.95, 1.01, 0.003) + P.stitch_v(0.94) * 0.0018                      # the hem
        side = ss(0.0, 0.025, U_) * (1 - ss(0.94, 0.97, U_))
        h += (1 - side) * 0.0025                                                        # side hems turned over
        h += P.noise(0.004, 0.004, 93) * 0.00025
    elif kind == 'kettle':
        crown, brim = V_ < 0.715, band(V_, 0.78, 0.86, 0.005)
        h = P.dents(110, 0.008, 0.022, 0.0016, 0.03, 0.7, 101) * crown                  # hammered dents
        h += P.dents(60, 0.006, 0.016, 0.0012, 0.78, 0.86, 102) * brim
        h += band(V_, 0.715, 0.775, 0.006) * 0.0022                                     # a raised band where crown meets brim
        h += band(V_, 0.858, 0.9, 0.004) * 0.003                                        # the rolled lip
        h += P.noise(0.06, 0.06, 103) * 0.0006                                          # the plate isn't perfectly even
        sc = np.zeros((N, N)); r = np.random.default_rng(104)                           # scratches
        for _ in range(40):
            u0, v0, a, ln = r.uniform(0, 1), r.uniform(0.05, 0.86), r.uniform(0, np.pi), r.uniform(0.01, 0.04)
            for t in np.linspace(0, ln, 120):
                i, j = int((v0 + np.sin(a) * t / L) * N), int(((u0 + np.cos(a) * t / C) % 1) * N)
                if 0 <= i < N: sc[i, j] -= 1
        h += P.blur(sc, 0.0006) * 0.0004
    elif kind == 'helm':
        crown = V_ < 0.432
        h = P.dents(90, 0.01, 0.025, 0.0012, 0.02, 0.98, 111)
        for c in (0.0, 0.5): h += np.exp(-(wrapd(U_, c) * C / 0.008) ** 2) * 0.0035 * crown * ss(0.0, 0.06, V_)  # the comb over the crown
        h += P.bumps_row(0.405, 18, 0.006, 0.0025) + band(V_, 0.385, 0.425, 0.004) * 0.0012          # the riveted band
        holes = np.zeros((N, N))
        for cu in (0.075, 0.1, 0.125, 0.875, 0.9, 0.925):                                          # breaths beside the mouth
            for cv in np.linspace(0.62, 0.78, 6):
                du = wrapd(U_, cu) * C; dv = (V_ - cv) * L; holes -= np.exp(-(du * du + dv * dv) / 0.0028 ** 2)
        h += holes * 0.004 + band(V_, 0.96, 1.01, 0.006) * 0.003                                     # and the rolled bottom
        h += P.noise(0.06, 0.06, 112) * 0.0005
    elif kind == 'hood':
        h = P.folds(0.04, 0.2, 121) * 0.003 * (0.3 + V_)
        h += P.wrinkles(0.88, 0.05, None, 0.003, 122, 0.03)                                          # bunched at the neck
        h += P.seam_u(0.0) * 0.0016 * ss(0.0, 0.02, 0.27 - V_) + P.seam_u(0.5) * 0.0016            # over the crown, down the back
        for e in (0.151, 0.849):                                                                     # the turned hem round the face
            d = wrapd(U_, e) * C; h += np.exp(-(d / 0.009) ** 2) * 0.003 * (V_ > 0.25)
            h += (np.sin(P.y / 0.006 * 2 * np.pi) > 0.3) * np.exp(-((d - 0.014) / 0.0016) ** 2) * 0.001 * (V_ > 0.25)
        h += P.noise(0.004, 0.004, 123) * 0.00025
    elif kind == 'mantle':
        h = P.folds(0.03, 0.12, 131) * 0.003 * (0.2 + V_)
        h += np.sin(U_ * 2 * np.pi * 30) * 0.0015 * (1 - ss(0.0, 0.3, V_))                          # gathered at the neck
        h += P.welt(0.86, 1.01, 0.0025) + P.stitch_v(0.84) * 0.0018
        h += P.welt(-0.01, 0.08, 0.0018)
        h += P.noise(0.004, 0.004, 132) * 0.0003
    elif kind == 'glove':
        h = P.wrinkles(0.9, 0.012, None, 0.0018, 141, 0.006)                                         # over the knuckles
        for c in (0.0, 0.33, 0.66): h += P.seam_u(c, 0.002, 0.004) * 0.0008 * (V_ < 0.8)               # seams down the back
        h += P.welt(-0.01, 0.12, 0.0012) + P.stitch_v(0.13, 0.004, 0.001) * 0.001                    # the wrist
        h += P.creases(0.02, 0.02, 142, 2.5) * 0.0005 + P.noise(0.003, 0.003, 143) * 0.0002
    elif kind == 'finger':
        h = P.wrinkles(0.3, 0.006, None, 0.0012, 151, 0.004) + P.wrinkles(0.68, 0.005, None, 0.001, 152, 0.0035)
        h += P.noise(0.003, 0.003, 153) * 0.00015
    elif kind == 'robesleeve':
        h = P.folds(0.04, 0.15, 161) * 0.0035 * (0.3 + V_)
        h += P.creases(0.03, 0.1, 162) * 0.0012
        cuff = band(V_, 0.8, 0.96, 0.006)                                                            # an embroidered cuff
        h += cuff * (0.0015 + (np.sin(P.x / 0.012 * 2 * np.pi + np.sin(P.y / 0.01 * 2 * np.pi) * 2) > 0.4) * 0.0008)
        h += P.welt(0.96, 1.01, 0.0025) + P.noise(0.004, 0.004, 163) * 0.00025
    elif kind == 'plate':
        h = P.dents(70, 0.015, 0.04, 0.0012, 0.05, 0.95, 171) + P.dents(60, 0.004, 0.01, 0.0006, 0.05, 0.95, 172)
        for v0 in (0.06, 0.94): h += P.bumps_row(v0, 28, 0.0045, 0.0022)                             # rivets along both edges
        h += band(V_, -0.01, 0.025, 0.004) * 0.002 + band(V_, 0.975, 1.01, 0.004) * 0.002
        sc = np.zeros((N, N)); r = np.random.default_rng(173)
        for _ in range(60):
            u0, v0, a, ln = r.uniform(0, 1), r.uniform(0.05, 0.95), r.uniform(0, np.pi), r.uniform(0.01, 0.05)
            for t in np.linspace(0, ln, 160):
                i, j = int((v0 + np.sin(a) * t / L) * N), int(((u0 + np.cos(a) * t / C) % 1) * N)
                if 0 <= i < N: sc[i, j] -= 1
        h += P.blur(sc, 0.0006) * 0.0004 + P.noise(0.08, 0.08, 174) * 0.0005
    elif kind == 'lame':
        h = P.dents(40, 0.008, 0.02, 0.0008, 0.1, 0.9, 181)
        for cu in (0.0, 0.13, 0.25, 0.37, 0.5):
            du = wrapd(U_, cu) * C; dv = (V_ - 0.45) * L; h += np.sqrt(np.clip(1 - (du * du + dv * dv) / 0.0045 ** 2, 0, 1)) * 0.0022
        h += band(V_, 0.85, 1.01, 0.05) * 0.0018 + P.noise(0.06, 0.03, 182) * 0.0003
    elif kind == 'vambrace':
        h = P.dents(40, 0.008, 0.02, 0.001, 0.08, 0.92, 191)
        h += band(V_, -0.01, 0.06, 0.006) * 0.0022 + band(V_, 0.94, 1.01, 0.006) * 0.0022            # rolled ends
        for v0 in (0.12, 0.88): h += P.bumps_row(v0, 8, 0.004, 0.002, 0.5)
        h += np.exp(-(wrapd(U_, 0.5) * C / 0.004) ** 2) * -0.0012                                     # the hinge line inside
        h += P.noise(0.05, 0.05, 192) * 0.0004
    elif kind == 'pauldron':
        h = P.dents(50, 0.01, 0.025, 0.001, 0.12, 1.0, 201)
        h += band(V_, -0.01, 0.07, 0.008) * 0.003 + P.bumps_row(0.14, 12, 0.005, 0.0022)
        h += P.noise(0.06, 0.06, 202) * 0.0004
    elif kind == 'shield':
        k = 6
        gaps = -np.exp(-((((U_ * k) + 0.5) % 1 - 0.5) / 0.035) ** 2) * 0.0025                     # six boards
        board = np.floor(U_ * k)
        grain = sum(P.noise(0.006, 0.12, 211 + int(b)) * (board == b) for b in range(k)) * 0.0006 # each board its own grain
        h = gaps + grain + P.creases(0.01, 0.1, 217, 2.5) * 0.0005
        for v0 in (0.3, 0.7):                                                                       # two battens of nails
            for i in range(14):
                du = (U_ - (i + 0.5) / 14) * C; dv = (V_ - v0) * L; h += np.sqrt(np.clip(1 - (du * du + dv * dv) / 0.006 ** 2, 0, 1)) * 0.0022
        rad = np.hypot(U_ - 0.5, V_ - 0.5)
        h += P.dents(70, 0.006, 0.02, 0.0016, 0, 1, 218) * ss(0.25, 0.48, rad)                     # knocks, more toward the rim
        h += P.noise(0.004, 0.004, 219) * 0.0002
    elif kind == 'grip':
        turns = 6
        ph = V_ * turns + U_ * 1.0                                                                  # leather wound round it
        h = -np.exp(-(((ph % 1) - 0.5) * 2 / 0.12) ** 2) * 0.0012 + np.cos(((ph % 1) - 0.5) * np.pi) * 0.0004
        h += P.noise(0.004, 0.004, 221) * 0.0002
    elif kind == 'lock':
        h = P.noise(0.0015, 0.06, 231) * 0.0006 + P.noise(0.005, 0.1, 232) * 0.0009                 # strands, and clumps of them
        h += -np.abs(P.noise(0.008, 0.2, 233)) * 0.0007                                             # partings between the clumps
    elif kind == 'shoulder':
        h = P.folds(0.03, 0.06, 241) * 0.0015 + P.welt(0.25, 0.32, 0.0012) + P.stitch_v(0.33) * 0.0012
        h += P.noise(0.004, 0.004, 242) * 0.0002
    elif kind == 'haft':
        h = P.noise(0.004, 0.15, 251) * 0.0005 + P.creases(0.006, 0.1, 252, 3.0) * 0.0004           # grain, and its splits
        kn = np.zeros((N, N)); r = np.random.default_rng(253)
        for _ in range(5):                                                                          # knots
            cu, cv = r.uniform(0, 1), r.uniform(0.05, 0.95); du = wrapd(U_, cu) * C; dv = (V_ - cv) * L; d = np.sqrt(du * du + dv * dv * 0.3)
            kn += np.exp(-(d / 0.004) ** 2) * 0.8 - np.exp(-(d / 0.007) ** 2) * 0.3 + np.cos(d / 0.0018 * 2 * np.pi) * np.exp(-(d / 0.01) ** 2) * 0.2
        h += kn * 0.0006 + P.dents(30, 0.001, 0.003, 0.0004, 0, 1, 254)                             # and knocks
    elif kind == 'braid':
        p_ = 0.008
        a1 = np.cos(2 * np.pi * (U_ * 2 + P.y / p_)); a2 = np.cos(2 * np.pi * (U_ * 2 - P.y / p_ + 0.5))
        h = np.maximum(a1, a2) * 0.0005 + P.noise(0.002, 0.002, 261) * 0.0001                        # strands plaited over and under
    elif kind == 'rim':
        h = P.dents(60, 0.002, 0.006, 0.0005, 0, 1, 271) + P.noise(0.003, 0.1, 272) * 0.00015
        sc = np.zeros((N, N)); r = np.random.default_rng(273)
        for _ in range(30):
            u0, v0, ln = r.uniform(0, 1), r.uniform(0, 1), r.uniform(0.01, 0.05)
            for t in np.linspace(0, ln, 100):
                i = int(((v0 + t / L) % 1) * N); j = int(((u0 + r.normal(0, 0.002)) % 1) * N); sc[i % N, j] -= 1
        h += P.blur(sc, 0.0004) * 0.0002
    elif kind == 'strap':
        face = np.cos(U_ * 4 * np.pi) ** 2
        edge = np.minimum(wrapd(U_, 0.25), wrapd(U_, 0.75))
        st = (np.sin(P.y / 0.004 * 2 * np.pi) > 0.2) * np.exp(-((edge - 0.08) / 0.012) ** 2)
        h = st * 0.0004 - np.exp(-((edge - 0.08) / 0.006) ** 2) * 0.00015 + P.creases(0.01, 0.01, 281, 2.5) * 0.0003 * face
        h += P.noise(0.002, 0.002, 282) * 0.0001
    elif kind == 'blade':
        e = np.minimum(wrapd(U_, 0.0), wrapd(U_, 0.5))
        h = -np.exp(-((e - 0.07) / 0.008) ** 2) * 0.00035                                           # the edge's bevel line
        h += P.noise(0.0012, 0.15, 291) * 0.00012 * (e > 0.07)                                       # grinding along the blade
        nk = np.zeros((N, N)); r = np.random.default_rng(292)
        for _ in range(14):                                                                          # nicks in the edges
            cu, cv = r.choice([0.0, 0.5]), r.uniform(0.15, 0.9); du = wrapd(U_, cu) * C; dv = (V_ - cv) * L
            nk -= np.exp(-(du * du + dv * dv) / 0.0025 ** 2)
        h += nk * 0.0006 + P.dents(25, 0.003, 0.008, 0.00015, 0, 0.35, 293)                          # and hammering near the hilt
    elif kind == 'forged':
        h = P.dents(70, 0.004, 0.012, 0.0009, 0, 1, 301) + P.noise(0.03, 0.03, 302) * 0.0003
        yy, xx = V_ - 0.5, U_ - 0.5; rr = np.hypot(xx, yy)
        h += np.sin(rr / 0.004 * 2 * np.pi + P.noise(0.02, 0.02, 303) * 2) * 0.00006                 # grinding arcs
        h += P.dents(30, 0.0015, 0.004, 0.0005, 0, 1, 304)
    elif kind == 'hand':
        h = np.zeros((N, N))
        for back in (0.0, 0.5):                                                                     # either side may be the back
            for i in range(4):
                cu = back + (i - 1.5) * 0.06; du = wrapd(U_, cu) * C
                h += np.exp(-(du / 0.0035) ** 2) * ss(0.2, 0.75, V_) * (1 - ss(0.85, 0.95, V_)) * 0.0005        # tendons
                dv = (V_ - 0.9) * L; h += np.exp(-(du * du + dv * dv) / 0.004 ** 2) * 0.0012                    # knuckles
        h += P.wrinkles(0.06, 0.006, None, 0.0006, 311, 0.003)                                       # the wrist's creases
        h += P.dents(500, 0.0003, 0.0006, 0.00008, 0, 1, 312) + P.noise(0.003, 0.003, 313) * 0.00008
    elif kind == 'head':
        face = np.exp(-(wrapd(U_, 0.25) / 0.2) ** 2) * band(V_, 0.2, 0.8, 0.1)
        h = P.dents(3500, 0.0004, 0.0008, 0.00009, 0, 1, 321) * (0.4 + face)                         # pores, finer off the face
        h += P.noise(0.004, 0.004, 322) * 0.00008 + P.noise(0.02, 0.02, 323) * 0.0002
    elif kind == 'lace':
        h = P.folds(0.04, 0.2, 331) * 0.0025 * (0.3 + V_)
        holes = np.zeros((N, N))
        for row, (v0, n, r, k) in enumerate([(0.9, 64, 0.004, 1.0), (0.82, 40, 0.007, 1.0), (0.74, 64, 0.003, 0.7)]):
            for i in range(n):
                cu = (i + (row % 2) * 0.5) / n; du = wrapd(U_, cu) * C; dv = (V_ - v0) * L
                holes -= np.exp(-(du * du + dv * dv) / r ** 2) ** 0.6 * k
                if row == 1:                                                                          # little flowers of four eyelets
                    for a in range(4):
                        ox, oy = np.cos(a * np.pi / 2) * 0.012, np.sin(a * np.pi / 2) * 0.012
                        holes -= np.exp(-((du - ox) ** 2 + (dv - oy) ** 2) / 0.0035 ** 2) * 0.7
        h += holes * 0.0022 + P.noise(0.004, 0.004, 332) * 0.0002
    elif kind == 'embroid':
        h = P.folds(0.05, 0.3, 341) * 0.003 * (0.3 + V_)
        thread = np.zeros((N, N)); r = np.random.default_rng(342)
        for cu in np.linspace(0, 1, 9)[:-1] + 0.06:                                                  # vines climbing from the hem
            u0, v = cu, 1.0
            for step in range(140):
                v -= 0.005; u0 += np.sin(v * 22 + cu * 9) * 0.0016
                if v < 0.35: break
                i, j = int(v * N), int((u0 % 1) * N); thread[max(0, i - 1):i + 2, max(0, j - 2):j + 3] += 1
                if step % 16 == 8:                                                                   # a leaf to either side
                    for sgn in (-1, 1):
                        for t in range(12):
                            ii = int((v - t * 0.0022) * N); jj = int(((u0 + sgn * t * 0.0028) % 1) * N)
                            if 0 <= ii < N: thread[max(0, ii - 1):ii + 2, max(0, jj - 1):jj + 2] += 0.8
        h += P.blur(np.clip(thread, 0, 1), 0.0012) * 0.0018 + P.noise(0.004, 0.004, 343) * 0.0002
    elif kind == 'battered':
        h = P.dents(55, 0.012, 0.035, 0.0022, 0.02, 0.98, 351) + P.dents(140, 0.003, 0.009, 0.0009, 0, 1, 352)    # blows, big and small
        gz = np.zeros((N, N)); r = np.random.default_rng(353)
        for _ in range(16):                                                                          # gouges where a blade skidded
            u0, v0, a, ln = r.uniform(0, 1), r.uniform(0.05, 0.95), r.uniform(-0.6, 0.6), r.uniform(0.03, 0.09)
            for t in np.linspace(0, ln, 200):
                i, j = int((v0 + np.sin(a) * t / L) * N), int(((u0 + np.cos(a) * t / C) % 1) * N)
                if 0 <= i < N: gz[i, j] -= 1
        h += P.blur(gz, 0.0012) * 0.0035
        sc = np.zeros((N, N))
        for _ in range(90):                                                                          # fine scratches
            u0, v0, a, ln = r.uniform(0, 1), r.uniform(0, 1), r.uniform(0, np.pi), r.uniform(0.01, 0.04)
            for t in np.linspace(0, ln, 120):
                i, j = int((v0 + np.sin(a) * t / L) * N), int(((u0 + np.cos(a) * t / C) % 1) * N)
                if 0 <= i < N: sc[i, j] -= 1
        h += P.blur(sc, 0.0004) * 0.0005 + P.noise(0.08, 0.08, 354) * 0.0007
        soot = np.clip(P.noise(0.06, 0.06, 355) - 0.3, 0, None)                                      # soot: low patches the cavity darkens
        h -= soot * 0.0006
    return P, h


def bake(P, h):
    """the slopes (per unit of u and v) and the occlusion, from the height"""
    gu = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * N / 2          # dh/du, wrapping round
    hv = np.pad(h, ((1, 1), (0, 0)), mode='edge')
    gv = (hv[2:] - hv[:-2]) * N / 2                               # dh/dv
    # occlusion: how far below the surroundings each spot sits, at two sizes (a crease, a fold)
    cav = np.maximum(P.blur(h, 0.003) - h, 0) * 1.0 + np.maximum(P.blur(h, 0.012) - h, 0) * 0.5
    ao = np.clip(1 - cav / 0.0022, 0.25, 1) ** 1.2
    return gu, gv, ao


def down(a, n):
    k = a.shape[0] // n; return a.reshape(n, k, n, k).mean((1, 3))


def main():
    os.makedirs(os.path.join(HERE, 'src'), exist_ok=True)
    atlas = np.zeros((ROWS * CELL, COLS * CELL, 3)); atlas[..., :2] = 0.5; atlas[..., 2] = 1
    heights = np.full((ROWS * HCELL, COLS * HCELL), 0.5)
    meta = {}
    for kind, (cell, C, L, front) in KINDS.items():
        P, h = sculpt(kind)
        h = h - h.mean()
        gu, gv, ao = bake(P, h)
        gm = float(np.percentile(np.abs(np.concatenate([gu.ravel(), gv.ravel()])), 99.7))
        lo, hi = float(h.min()), float(h.max())
        Image.fromarray(((h - lo) / (hi - lo) * 65535).astype(np.uint16)).save(os.path.join(HERE, 'src', kind + '.png'))
        cx, cy = cell % COLS, cell // COLS
        inner = CELL - 2 * INSET
        def fit(a, n):  # into the cell's inside, edges repeated into the inset
            img = Image.fromarray(a.astype(np.float32), 'F').resize((n, n), Image.BOX)
            return np.pad(np.asarray(img), INSET, mode='edge')
        atlas[cy * CELL:(cy + 1) * CELL, cx * CELL:(cx + 1) * CELL, 0] = fit(0.5 + 0.5 * np.clip(gu / gm, -1, 1), inner)
        atlas[cy * CELL:(cy + 1) * CELL, cx * CELL:(cx + 1) * CELL, 1] = fit(0.5 + 0.5 * np.clip(gv / gm, -1, 1), inner)
        atlas[cy * CELL:(cy + 1) * CELL, cx * CELL:(cx + 1) * CELL, 2] = fit(ao, inner)
        hin = HCELL - 2 * INSET * 2
        hh = np.asarray(Image.fromarray(((h - lo) / (hi - lo)).astype(np.float32), 'F').resize((hin, hin), Image.BOX))
        heights[cy * HCELL:(cy + 1) * HCELL, cx * HCELL:(cx + 1) * HCELL] = np.pad(hh, INSET * 2, mode='edge')
        meta[kind] = {'cell': cell, 'C': C, 'L': L, 'slope': round(gm, 6), 'lo': round(lo, 6), 'hi': round(hi, 6)}
        print(f'{kind:9s} cell {cell:2d}  relief {(hi - lo) * 1000 * 1.41:.1f} mm  slope {gm:.4f}')
    a8 = Image.fromarray((np.clip(atlas, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
    h8 = Image.fromarray((np.clip(heights, 0, 1) * 255 + 0.5).astype(np.uint8), 'L')
    out = {}
    for name, img, q in (('atlas', a8, 90), ('heights', h8, 88)):
        b = io.BytesIO(); img.save(b, 'WEBP', quality=q, method=6); d = b.getvalue()
        open(os.path.join(HERE, name + '.webp'), 'wb').write(d); out[name] = d
        print(f'{name}.webp {len(d) / 1024:.0f} KB')
    js = ('// Made by sculpt.py: the sculpted masters of each kind of piece. Do not edit by hand.\n'
          f'// ATLAS: {COLS} x {ROWS} cells of {CELL} px (red, green: slope along u and v, scaled by each kind\'s slope; blue: occlusion).\n'
          f'// HEIGHTS: the same cells at {HCELL} px, each kind\'s height from lo to hi (hero units), for the Sculpt view.\n'
          f'export const COLS = {COLS}, ROWS = {ROWS}, INSET = {INSET / CELL};\n'
          'export const KINDS = ' + json.dumps(meta, separators=(',', ':')) + ';\n'
          'export const ATLAS = "data:image/webp;base64,' + base64.b64encode(out['atlas']).decode() + '";\n')
    open(os.path.join(HERE, 'pack.js'), 'w').write(js)
    js2 = ('// Made by sculpt.py: the masters\' heights, for the Gear Room\'s Sculpt view only (not the game). Do not edit by hand.\n'
           'export const HEIGHTS = "data:image/webp;base64,' + base64.b64encode(out['heights']).decode() + '";\n')
    open(os.path.join(HERE, 'heights.js'), 'w').write(js2)


if __name__ == '__main__':
    main()
