# The thornhound's light version and rig, read by the beasts' bake (pages/beasts/kit/bake.py).
# Sculpt coordinates (x his right, y forward, z up, metres), measured off the sheet like sculpt.py.
import numpy as np

S = 0.9 / 716; MID = 900; GROUND = 788
def p(xo, px, py): return (xo * S, (px - MID) * S, (GROUND - py) * S)

# triangles in the light version, per kind of part (he is rabble: about 20,000 in all)
TARGET = {0: 13200, 2: 1500, 3: 700, 4: 3000, 5: 40, 6: 500, 7: 200, 8: 1100}
CAGE, RAY, AO_DIST = 0.02, 0.06, 0.18
SMOOTH = 16           # weights smoothed over the surface (no stretching, Chris November 21)
RIGID = [2, 4, 5, 6, 7, 8]          # thorns, leaves, fangs, claws, eyes and flowers move as one piece each
UV_SCALE = {0: 1.0, 2: 0.6, 3: 0.4, 4: 0.3, 5: 0.5, 6: 0.4, 7: 0.8, 8: 0.25}   # picture space: the coat first

LEGS = {
    'fl': [(80, 1030, 425), (80, 998, 525), (82, 978, 690), (84, 992, 745)],
    'fr': [(-80, 1062, 425), (-80, 1042, 525), (-82, 1050, 690), (-84, 1070, 745)],
    'bl': [(78, 668, 440), (84, 740, 555), (90, 648, 625), (94, 700, 745)],
    'br': [(-78, 625, 440), (-84, 672, 560), (-90, 540, 628), (-94, 560, 745)],
}
BONES = [  # name, parent, head, tail
    ('hips', None, p(0, 620, 400), p(0, 800, 385)),
    ('spine', 'hips', p(0, 800, 385), p(0, 960, 370)),
    ('chest', 'spine', p(0, 960, 370), p(0, 1070, 345)),
    ('neck_base', 'chest', p(0, 1070, 345), p(0, 1102, 310)),     # helper: the neck in two (kit, November 21)
    ('neck', 'neck_base', p(0, 1102, 310), p(0, 1135, 275)),
    ('head', 'neck', p(0, 1135, 275), p(0, 1330, 262)),
    ('jaw', 'head', p(0, 1212, 282), p(0, 1312, 292)),
    ('ear_l', 'head', p(36, 1165, 198), p(52, 1157, 80)),
    ('ear_r', 'head', p(-36, 1165, 198), p(-52, 1157, 80)),
    ('tail_root', 'hips', p(0, 500, 366), p(0, 487, 385)),        # helper: a quarter of the tail's sway
    ('tail1', 'tail_root', p(0, 487, 385), p(0, 458, 428)),
    ('tail2', 'tail1', p(0, 458, 428), p(0, 442, 495)),
    ('tail3', 'tail2', p(0, 442, 495), p(0, 444, 555)),
    ('tail4', 'tail3', p(0, 444, 555), p(0, 456, 625)),
]
for k, J in LEGS.items():
    J = [p(*j) for j in J]
    par = 'chest' if k[0] == 'f' else 'hips'
    toe = (J[3][0], J[3][1] + 0.06, 0.008)
    # helper: a shoulder blade over each foreleg, a haunch over each hind leg (half the upper leg's turn)
    L_ = float(np.linalg.norm(np.subtract(J[0], J[1])))
    a = J[0]
    top = (a[0] * 0.75, a[1] - 0.25 * L_, a[2] + 0.5 * L_) if k[0] == 'f' else (a[0] * 0.75, a[1] + 0.15 * L_, a[2] + 0.45 * L_)
    h = f'{k}_blade' if k[0] == 'f' else f'{k}_haunch'
    BONES.append((h, par, top, a)); par = h
    BONES += [(f'{k}_upper', par, J[0], J[1]), (f'{k}_lower', f'{k}_upper', J[1], J[2]),
              (f'{k}_foot', f'{k}_lower', J[2], J[3]), (f'{k}_paw', f'{k}_foot', J[3], toe)]
NAMES = [b[0] for b in BONES]
def is_helper(n): return n in ('neck_base', 'tail_root') or n.endswith(('_blade', '_haunch'))
IDX = {n: i for i, n in enumerate(NAMES)}

def seg_dist(P, a, b):
    a = np.asarray(a, np.float32); b = np.asarray(b, np.float32); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weights_at(P):
    P = np.asarray(P, np.float32)
    D = np.stack([seg_dist(P, b[2], b[3]) for b in BONES], 1)
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    sx_, sy_ = y / S + MID, GROUND - z / S          # sheet pixels
    for i, b in enumerate(BONES):
        if is_helper(b[0]): continue
        n = b[0]
        if n[:2] in ('fl', 'fr', 'bl', 'br'):
            front = n[0] == 'f'
            top = 470 if front else 470           # above this (sheet px) it's body, not leg
            if not n.endswith('_upper'): D[:, i] *= np.where(sy_ < top - 60, 3.0, np.where(sy_ < top, 1.6, 1.0))
            side = np.sign(b[2][0])
            D[:, i] += np.where(np.sign(x) != side, 1.0, 0.0)
            D[:, i] += np.where((sx_ > 850) != front, 1.0, 0.0)
            # the chest and belly between the legs stay with the body: a leg only takes what's on its own side
            D[:, i] += np.where((np.abs(x) < 25 * S) & (sy_ < 600), 0.05, 0.0)
        if n == 'jaw': D[:, i] += 10
        if n.startswith('ear'):
            side = np.sign(b[2][0])
            ear = (sy_ < 200) & (np.sign(x) == side) & (sx_ > 1120) & (sx_ < 1200) & (np.abs(x) > 18 * S)
            D[:, i] = np.where(ear, D[:, i] * 0.3, D[:, i] + 1.0)
        if n.startswith('tail'):
            D[:, i] = np.where(sx_ < 515, D[:, i] * 0.7, D[:, i] * 3.0)
        if n == 'neck':      # the neck stops at the shoulders: nothing below the throat or behind the withers
            D[:, i] += np.where((sy_ > 400) | (sx_ < 1040), 0.5, 0.0)
        if n == 'chest':
            D[:, i] += np.where(sy_ > 560, 0.3, 0.0)
        if n == 'head':
            D[:, i] *= np.where(sx_ > 1185, 0.6, 1.0)
    # the jaw: below the mouth line, at the front of the face
    jaw = (sx_ > 1225) & (sy_ > 278 + (sx_ - 1252) * 0.18) & (sy_ < 330) & (np.abs(x) < 34 * S)
    D[jaw, IDX['jaw']] = 0.0
    W = 1.0 / np.maximum(D, 0.004) ** 4 * mask(P) + 1e-12
    top = np.argsort(-W, 1)[:, :4]
    Wt = np.take_along_axis(W, top, 1); Wt /= Wt.sum(1, keepdims=True)
    return top.astype(np.uint16), Wt.astype(np.float32)

def ramp(x, a, b): return np.clip((x - a) / (b - a), 0, 1)

def mask(P, idx=None):
    """where each bone may reach (0..1, with soft edges): a leg's lower bones stay below their own joint, the tail's
    later bones behind the rump, the head's bones in front of the neck, the neck off the shoulders"""
    P = np.asarray(P, np.float32)
    x, z = P[:, 0], P[:, 2]
    sx_, sy_ = P[:, 1] / S + MID, GROUND - z / S
    M = np.ones((len(P), len(BONES)), np.float32)
    for i, (n, par, hd, tl) in enumerate(BONES):
        if is_helper(n): continue
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not n.endswith('_upper'):
            M[:, i] = ramp(hd[2] + 0.03 - z, 0, 0.03)               # nothing above its joint
        if n.endswith('_upper'):
            M[:, i] = ramp(0.60 - z, 0, 0.05) * ramp(np.abs(x), 0.02, 0.05)   # below the back, and not the middle of the chest
        if n in ('tail2', 'tail3', 'tail4'):
            M[:, i] = ramp(-0.50 - P[:, 1], 0, 0.03) * ramp(hd[2] + 0.04 - z, 0, 0.03)   # the hanging tail, below its joint
        if n in ('ear_l', 'ear_r'):
            M[:, i] = ramp(z, 0.72, 0.77) * ramp(np.sign(hd[0]) * x, 0.01, 0.025)
            continue
        if n in ('head', 'jaw', 'ear_l', 'ear_r'):
            M[:, i] = np.maximum(ramp(sx_, 1110, 1150), ramp(z, 0.70, 0.73))   # the head, and all round the ear roots

        if n == 'neck':
            M[:, i] = ramp(sx_, 1020, 1060) * ramp(430 - sy_, 0, 30) * ramp(0.73 - z, 0, 0.04)   # not up into the ears
    return M

def rigid_root(P, kind):
    """where a rigid part hangs from: its point nearest the body (or a bone by name)"""
    if kind == 5: return 'head'                          # fangs: upper jaw
    if kind == 7: return 'head'                          # eyes
    if kind == 6:                                         # claws: the paw they're on
        c = P.mean(0); best = min((k for k in LEGS), key=lambda k: np.linalg.norm(np.array(p(*LEGS[k][3]))[:2] - c[:2]))
        return f'{best}_paw'
    ctr = np.array([0, np.clip(P[:, 1].mean(), -0.4, 0.4), 0.45])
    return P[np.argmin(np.linalg.norm(P - ctr, axis=1))]

# ---- for the kit's bind (kit/rigs/bind.py): the reach masks and side/front rules as gating on the distances
def weigh(D, P, idx):
    P = np.asarray(P, np.float32); x = P[:, 0]; sx_ = P[:, 1] / S + MID
    M = mask(P)
    for i, b in enumerate(BONES):
        if is_helper(b[0]): continue
        n = b[0]
        if n[:2] in ('fl', 'fr', 'bl', 'br'):
            D[:, i] += np.where(np.sign(x) != np.sign(b[2][0]), 1.0, 0.0)
            D[:, i] += np.where((sx_ > 850) != (n[0] == 'f'), 1.0, 0.0)
    # as Briarmaw's rig does (scaled to him): a leg takes nothing above 81% of its shoulder, nothing near the middle
    # line, nothing farther across than its reach from its own line, nothing above its own top (400 steers the labels)
    z = P[:, 2]; REACH = {'upper': 0.13, 'lower': 0.14, 'foot': 0.16, 'paw': 0.21}
    for n, i in idx.items():
        if n[:2] in ('fl', 'fr', 'bl', 'br') and not is_helper(n):
            bn = BONES[i]; a2, b2 = np.array(bn[2][:2]), np.array(bn[3][:2]); ab = b2 - a2
            t = np.clip(((P[:, :2] - a2) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            far = np.linalg.norm(P[:, :2] - (a2 + t[:, None] * ab), axis=1) > REACH[n[3:]]
            far |= z > max(bn[2][2], bn[3][2]) + 0.04
            D[:, i] += np.where((z > 0.37) | (np.abs(x) < 0.055) | far, 400.0, 0.0)
    return D                 # the reach masks go in softly through mask(P, idx), which bind multiplies in at every step

def rigid(kind, P, idx):
    r = rigid_root(P, kind)
    if isinstance(r, str): return r
    return None

# joint bands for the kit's bind: wide, soft blends where big masses turn (thigh into haunch, shoulder into chest,
# neck into chest), so the turn is spread over many centimetres of skin
BANDS = {k + p: ((0.085, 0.21) if p == '_lower' else (0.03, 0.08) if p in ('_paw', '_foot') else (0.03, 0.12))
         for k in ('fl', 'fr', 'bl', 'br') for p in ('_upper', '_lower', '_foot', '_paw')}
BANDS.update({'ear_l': (0.03, 0.06), 'ear_r': (0.03, 0.06)})
BANDS.update({'bl_lower': (0.12, 0.28), 'br_lower': (0.12, 0.28), 'bl_upper': (0.05, 0.16), 'br_upper': (0.05, 0.16)})   # the hind knee, wider
SPLIT = [('head', 'jaw')]          # the mouth cut along the lips (the kit's bind), so the jaw opens without dragging the cheeks

