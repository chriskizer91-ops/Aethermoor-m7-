# The Sand Wyrm's rig (Places' desert-and-deep lane): a chain up its body from the sand (w0, the root, buried) to the
# head; a `mouth` bone at the middle of the mouth pointing out of it (for the Fight: where the mouth is and which way it
# looks); five lip bones on the mouth's rim (lip0..lip4), each carrying its rim piece and its two teeth, turned outward to
# open the mouth wide (moves: pages/desert-deep/moves/wyrm.js). The mound and the gold scales are rigid.
import os, sys, math
import numpy as np
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from sculpt import SPINE, p, lip_frame, NLIP, LIP_R

mc_, mn, ma, mb = lip_frame()
# `sand`: the still root in the ground under the mound (the rocks ride it), so the whole worm can tip from where it
# leaves the sand (w0) without stretching anything and without tipping the mound
from sculpt import GROUND, S as _S
B = [('sand', None, tuple(p(880, GROUND + 60)), tuple(p(880, GROUND)))]
pts = [p(px, py) for px, py, _ in SPINE]
for i in range(len(pts) - 1):
    B.append((f'w{i}', 'sand' if i == 0 else f'w{i - 1}', tuple(pts[i]), tuple(pts[i + 1])))
B.append(('head', f'w{len(pts) - 2}', tuple(pts[-1]), tuple(mc_)))
B.append(('mouth', 'head', tuple(mc_), tuple(mc_ + mn * 0.12)))
for k in range(NLIP):
    t = 2 * math.pi * (k + 0.5) / NLIP
    radial = math.cos(t) * ma + math.sin(t) * mb
    h = mc_ + radial * LIP_R
    B.append((f'lip{k}', 'mouth', tuple(h), tuple(h + radial * 0.06)))
BONES = B
NAMES = [b[0] for b in B]
SPN = [n for n in NAMES if n[0] == 'w'] + ['head']

def seg_dist(P, a, b):
    a = np.asarray(a); b = np.asarray(b); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab + 1e-12), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)

def weigh(D, P, idx):
    for n in ['sand', 'mouth'] + [f'lip{k}' for k in range(NLIP)]: D[:, idx[n]] += 1000.0      # the skin never follows the lips or the sand
    return D
def rigid(kind, P, idx):
    c = P.mean(0)
    if np.linalg.norm(c - mc_) < LIP_R * 1.6 and kind in (5, 8):
        r = c - mc_; r -= mn * (r @ mn)
        a = math.atan2(r @ mb, r @ ma) % (2 * math.pi)
        return f'lip{int(a / (2 * math.pi / NLIP)) % NLIP}'
    if c[2] < 0.35 and kind == 8: return 'sand'                      # the mound stays put
    if kind == 8 and abs(c[0]) > 0.3: return 'w5'                     # the gold scales ride the arch
    d = [seg_dist(c[None], b[2], b[3])[0] for b in B if b[0] in SPN]
    return SPN[int(np.argmin(d))]
TRUNK = ('sand',) + tuple(SPN)     # (no cut between the sand and the body: it opened holes at the base)
BANDS = {n: (0.3, 0.6) for n in SPN}     # a thick body: each joint blends over 60 cm
SMOOTH = 24
