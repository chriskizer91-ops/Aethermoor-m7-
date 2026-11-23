# Gorrow the Mire-King's rig: the kit's frog template (hips, chest, head, jaw; per side arm, forearm, hand, thigh, shin,
# foot), measured off the sheet like sculpt.py. Sculpt coordinates (x his right, y forward, z up).
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kit', 'rigs'))
from frog import make

S = 1.1 / 455; GROUND = 665; MID = 1070
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)
def mouth_py(px): return 372 + (px - 1238) * (-32 / 160)
BONES, _weigh, _rigid = make(
    hips=(p(0, 850, 450), p(0, 1040, 430)), chest=(p(0, 1040, 430), p(0, 1180, 380)),
    head=(p(0, 1180, 350), p(0, 1400, 325)), jaw=(p(0, 1220, 385), p(0, 1390, 352)),
    front=[p(150, 1170, 440), p(192, 1150, 525), p(200, 1225, 603), p(205, 1300, 650)],
    back=[p(215, 880, 480), p(285, 1040, 545), p(300, 830, 612), p(305, 1010, 650)],
    jaw_region=lambda P: below_mouth(P) & (P[:, 2] > (GROUND - 470) * S))

def below_mouth(P):
    """under the mouth line, which runs round the front of the head and back along its sides"""
    px = P[:, 1] / S + MID
    return (px > 1215) & (P[:, 2] < (GROUND - mouth_py(np.maximum(px, 1238))) * S) & (np.abs(P[:, 0]) < 270 * S)

def weigh(D, P, idx):
    D = _weigh(D, P, idx)
    x, y, z = np.abs(P[:, 0]), P[:, 1], P[:, 2]
    for s in ('r', 'l'):
        sg = 1 if s == 'r' else -1
        own = np.sign(P[:, 0]) == sg
        for n in ('arm', 'forearm'):                 # the arm keeps off the belly, the throat and the thigh behind it
            D[:, idx[f'{s}_{n}']] += np.where(~own | (x < 120 * S) | (z > (GROUND - 420) * S) | (y < (1135 - MID) * S), 400.0, 0.0)
        # the hand: everything low and near it is hand (the inner finger too), nothing else
        hand = own & (z < (GROUND - 622) * S) & (np.linalg.norm(np.c_[x - 205 * S, y - (1290 - MID) * S], axis=1) < 125 * S) & (x > 105 * S)
        D[:, idx[f'{s}_hand']] += np.where(hand, -50.0, 400.0)
        for e in ('chest', 'hips'): D[:, idx[e]] += np.where(hand, 400.0, 0.0)
        for n in ('thigh', 'shin', 'foot'):          # the hind leg keeps to its own side and low
            D[:, idx[f'{s}_{n}']] += np.where(~own | (x < 150 * S) | (z > (GROUND - 400) * S) | (y > (1120 - MID) * S), 400.0, 0.0)
    for e in ('head', 'jaw'):
        D[:, idx[e]] += np.where(y < (1150 - MID) * S, 1000.0, 0.0)
    bm = below_mouth(P)                                # the head stops at the mouth line; the jaw takes the throat
    D[:, idx['head']] += np.where(bm, 1000.0, 0.0)
    D[:, idx['jaw']] += np.where(~bm, 1000.0, 0.0)
    return D

def part(P, kind, idx):
    """each hand, fingers and all, is the hand's (the fingertips lie far from the hand bone, so the cleanup would
    otherwise give them back to the chest)"""
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    out = np.full(len(P), -1)
    for s, sg in (('r', 1), ('l', -1)):
        palm = np.array([sg * 205 * S, (1290 - MID) * S])
        near = np.linalg.norm(P[:, :2] - palm, axis=1) < 125 * S
        hand = (np.sign(x) == sg) & (z < (GROUND - 622) * S) & near & (np.abs(x) > 105 * S) & (kind == 0)
        out[hand] = idx[f'{s}_hand']
    return out

def rigid(kind, P, idx):
    """the eyes, the crown, its reeds and the pearl all ride on the head"""
    if kind in (7, 8): return 'head'
    return _rigid(kind, P, idx)

SMOOTH = 16
# The mouth is cut along the lips (SPLIT). The kit cuts a split jaw free of every part two joints from it, and a toad's
# jaw runs on into his belly, so the jaw hangs from the chest (not the head): it blends into the throat with no slit,
# and his moves turn the jaw with the head wherever the head nods.
SPLIT = [('head', 'jaw')]
BONES = [(n, 'chest' if n == 'jaw' else par, h, t) for n, par, h, t in BONES]
BANDS = {f'{s}_{n}': w for s in ('r', 'l') for n, w in (('arm', (0.07, 0.18)), ('forearm', (0.05, 0.12)), ('hand', (0.03, 0.07)),
                                                          ('thigh', (0.08, 0.22)), ('shin', (0.06, 0.15)), ('foot', (0.04, 0.1)))}
BANDS.update({'chest': (0.12, 0.35), 'head': (0.1, 0.3), 'jaw': (0.12, 0.35)})
