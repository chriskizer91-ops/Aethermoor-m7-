# The blackwater-gar's rig (the kit's fish plan, kit/js/moves/fish.js), from fish.py's layout: body (the root), the
# head with its jaw (a piece of its own), the tail in three (t0, t1, t2: the fan on the last), the pectoral fins
# (r_fin, l_fin), and the ripple under it (ground, a root). Sculpt coordinates. Weighted by part (kit/rigs/bind.py):
# the jaw, the fins, the crest plates and the teeth move whole with their part.
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fish import layout, DEFAULTS

def make(C):
    Lo = layout(C); k = Lo['k']; mid = Lo['mid']
    at = lambda y, dz=0.0: (0.0, float(y), float(mid(y) + dz))
    MY = Lo['mouth_y']; mz = lambda y: float(mid(y) - 0.18 * np.interp(y, Lo['py'], Lo['ph']) * 1.25)
    BONES = [('ground', None, (0, 0, 0.0), (0, 0, 0.05)),
             ('body', None, at(-0.1 * k), at(0.15 * k)),
             ('head', 'body', at(0.15 * k), at(Lo['tip'])),
             ('jaw', 'head', (0.0, float(MY), mz(MY) - 0.01 * k), (0.0, float(Lo['tip']), mz(Lo['tip']))),
             ('t0', 'body', at(-0.1 * k), at(-0.28 * k)), ('t1', 't0', at(-0.28 * k), at(-0.43 * k)),
             ('t2', 't1', at(-0.43 * k), at(Lo['tail'] - 0.17 * k))]
    for s, sx in (('r', 1), ('l', -1)):
        y = 0.17 * k; z = float(mid(y) - 0.6 * np.interp(y, Lo['py'], Lo['ph']) * 1.25)
        BONES.append((f'{s}_fin', 'body', (sx * 0.05 * k, y, z), (sx * 0.17 * k, y - 0.12 * k, z - 0.07 * k)))
    # the back of its throat, for the Fight's swallow (a bone with no skin; +z, its forward, out of the mouth)
    BONES.append(('mouth', 'head', (0.0, float(MY + 0.01 * k), mz(MY) + 0.005 * k), (0.0, float(MY + 0.1 * k), mz(MY) + 0.005 * k)))
    SPINE = ['t2', 't1', 't0', 'body', 'head']
    ROLE = {}
    def part(P, kind, idx, piece):
        out = np.full(len(P), -1); role = np.full(len(P), 'body', dtype=object)
        sizes = np.bincount(piece); big = int(np.argmax(sizes))
        for c in np.unique(piece):
            m = piece == c
            if c == big: continue
            Q = P[m]; ctr = Q.mean(0); kd = np.bincount(kind[m]).argmax()
            if Q[:, 2].max() < 0.03: n = 'ground'                                     # the ripple
            elif kd == 0 and ctr[1] > MY - 0.02 * k: n = 'jaw'                         # the lower jaw
            elif kd == 2: n = 'jaw' if ctr[2] < mz(ctr[1]) else 'head'                  # teeth
            elif kd == 8: n = 'head'                                                   # the eyes
            elif kd == 1 and abs(ctr[0]) > 0.05 * k and ctr[1] > 0.1 * k: n = 'r_fin' if ctr[0] > 0 else 'l_fin'
            else:                                                                      # crest plates, other fins
                y = ctr[1]
                n = 't2' if y < -0.43 * k else 't1' if y < -0.28 * k else 't0' if y < -0.1 * k else 'body' if y < 0.15 * k else 'head'
            out[m] = idx[n]; role[m] = 'piece'
        ROLE['now'] = role
        return out
    def mask(P, idx):
        M_ = np.ones((len(P), len(idx))); body = ROLE['now'] == 'body'
        for n in ('jaw', 'r_fin', 'l_fin', 'ground'): M_[body, idx[n]] = 0
        M_[:, idx['mouth']] = 0
        return M_
    bw = 0.05 * k * C.get('deep', 1.0)                                                # the blend widens with a thicker fish
    return BONES, part, mask, {n: (bw, 0.2 * k * C.get('deep', 1.0)) for n in ('t0', 't1', 't2', 'head')}

BONES, part, mask, BANDS = make(dict(DEFAULTS))
TRUNK = ('body',)
SMOOTH = 12
WELD_SAME_KIND = True       # fins and crest plates touch the body: keep them apart
