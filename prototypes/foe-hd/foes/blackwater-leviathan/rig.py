# The Blackwater Leviathan's rig (the kit's leviathan plan, kit/js/moves/leviathan.js): base (a root, under the
# water), his neck in six (n0..n5), head, jaw (a piece of its own, for the swallow), his two coils (r_coil, l_coil:
# roots of their own, so they heave and slam), and the water (ground, a root). Sculpt coordinates. Weighted by part
# (kit/rigs/bind.py): the collar and its chain ride with the neck bone they're on, the harpoon with his chest, the
# pearl, frills, horns and eyes with his head; every piece but his neck moves whole.
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import PTS, HEAD, SNOUT, HINGE, COLLAR_Z, COILS
p = [tuple(float(v) for v in q) for q in PTS]
BONES = [('ground', None, (0, 0, 0.0), (0, 0, 0.05)), ('base', None, p[0], p[1])]
prev = 'base'
for i in range(6):
    BONES.append((f'n{i}', prev, p[i + 1], p[i + 2])); prev = f'n{i}'
BONES += [('head', 'n5', p[7], tuple(float(v) for v in SNOUT)),
          ('jaw', 'head', tuple(float(v) for v in HINGE), tuple(float(v) for v in SNOUT + [0, -0.03, -0.07]))]
for name, ((cx, cy), _) in COILS.items():
    BONES.append((name, None, (cx, cy, 0.0), (cx, cy, 0.6)))
TRUNK = ('base',)
SMOOTH = 16
BANDS = {f'n{i}': (0.12, 0.6) for i in range(6)}
BANDS['head'] = (0.08, 0.4)
ROLE = {}
NECK = [f'n{i}' for i in range(6)]
def neck_bone(z):
    for i in range(6):
        if z < PTS[i + 2][2]: return NECK[i]
    return 'n5'
def part(P, kind, idx, piece):
    out = np.full(len(P), -1); role = np.full(len(P), 'neck', dtype=object)
    big = int(np.argmax(np.bincount(piece)))
    for c in np.unique(piece):
        m = piece == c
        if c == big: continue
        Q = P[m]; ctr = Q.mean(0); kd = np.bincount(kind[m]).argmax()
        coil = next((n for n, ((cx, cy), _) in COILS.items() if np.hypot(ctr[0] - cx, ctr[1] - cy) < 0.55 and ctr[2] < 0.75), None)
        if Q[:, 2].max() < 0.05 and kd == 8: n = 'ground'                              # the water
        elif coil: n = coil                                                            # a coil, its barnacles
        elif kd == 0 and ctr[1] > HINGE[1] and ctr[2] < HINGE[2] + 0.02: n = 'jaw'
        elif kd == 2 and ctr[1] > HINGE[1] - 0.02 and ctr[2] > HINGE[2] - 0.12:     # teeth
            n = 'jaw' if ctr[2] < HINGE[2] + 0.015 - (ctr[1] - HINGE[1]) * 0.05 else 'head'
        elif ctr[2] > 1.72 or (ctr[2] > 1.6 and ctr[1] > 0.1): n = 'head'             # eyes, pearl, frills, horns
        elif kd == 8 and ctr[0] < -0.2 and ctr[2] < COLLAR_Z: n = neck_bone(COLLAR_Z)  # the chain hangs from the collar
        else: n = neck_bone(ctr[2])                                                    # collar, harpoon, spines, barnacles
        out[m] = idx[n]; role[m] = 'piece'
    ROLE['now'] = role
    return out
def mask(P, idx):
    M_ = np.ones((len(P), len(idx))); neck = ROLE['now'] == 'neck'
    for n in ('jaw', 'ground') + tuple(COILS): M_[neck, idx[n]] = 0
    return M_
