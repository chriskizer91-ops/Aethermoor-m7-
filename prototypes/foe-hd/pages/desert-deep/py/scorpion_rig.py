# A scorpion's rig from its sculpt SPEC (Places' desert-and-deep lane, November 21): pages/desert-deep/py/scorpion.py
# builds every plate, segment and leg piece as its own rigid piece; here each piece rides the bone it lies along.
#   body (the back's plates, the root) -> head (the carapace) -> r_/l_ arm, fore, claw, finger (the pincers)
#   body -> tail1..tail4 -> sting;  body -> r1..r4 / l1..l4 _upper, _lower, _foot (the legs, 1 the hindmost)
# The moves are pages/desert-deep/moves/scorpion.js.
import numpy as np

def make(sp):
    S, MID, GROUND = sp['S'], sp['MID'], sp['GROUND']
    def p(px, py, x=0.0): return (float(x), float((px - MID) * S), float((GROUND - py) * S))
    PL = sp['plates']
    B = [('body', None, p(PL[0][0], PL[0][1]), p(PL[-1][0], PL[-1][1])),
         ('head', 'body', p(*sp['carapace'][0]), p(*sp['carapace'][1]))]
    T = [p(*j) for j in sp['tail']]
    par = 'body'
    for i in range(len(T) - 1):
        n = f'tail{i + 1}' if i < len(T) - 2 else 'sting'
        B.append((n, par, T[i], T[i + 1] if n != 'sting' else p(*sp['sting']))); par = n
    for s, sd in ((1, 'r'), (-1, 'l')):
        A = [p(px, py, s * x) for px, py, x in sp['arm']]
        pa, pb = p(*sp['palm'][0][:2], s * sp['palm'][0][2]), p(*sp['palm'][1][:2], s * sp['palm'][1][2])
        fm = sp['finger_moving']
        B += [(f'{sd}_arm', 'head', A[0], A[1]), (f'{sd}_fore', f'{sd}_arm', A[1], A[2]),
              (f'{sd}_claw', f'{sd}_fore', pa, pb),
              (f'{sd}_finger', f'{sd}_claw', p(*fm[0][:2], s * fm[0][2]), p(*fm[1][:2], s * fm[1][2]))]
        for i, (h, k, a, t) in enumerate(sp['legs']):
            n = f'{sd}{i + 1}'
            B += [(f'{n}_upper', 'body', p(h[0], h[1], s * h[2]), p(k[0], k[1], s * k[2])),
                  (f'{n}_lower', f'{n}_upper', p(k[0], k[1], s * k[2]), p(a[0], a[1], s * a[2])),
                  (f'{n}_foot', f'{n}_lower', p(a[0], a[1], s * a[2]), p(t[0], t[1], s * t[2]))]
    names = [b[0] for b in B]

    def seg_dist(P, a, b):
        a = np.asarray(a); b = np.asarray(b); ab = b - a
        t = np.clip(((P - a) @ ab) / (ab @ ab + 1e-12), 0, 1)
        return np.linalg.norm(P - (a + t[:, None] * ab), axis=1), t
    def bone_of_piece(P):
        """the bone a rigid piece lies along: nearest to its middle, its long axis along the bone"""
        c = P.mean(0)[None]
        best, bd = None, 9
        for b in B:
            if b[0] == 'body': continue
            d, t = seg_dist(c, b[2], b[3])
            if d[0] < bd: best, bd = b[0], d[0]
        return best

    def weigh(D, P, idx):
        # the back (kind 0) is body and head only: nothing else may take it
        return D
    BL = (p(*sp['blade']['hilt']), p(*sp['blade']['tip'])) if 'blade' in sp else None
    RING = p(*sp['blade']['ring'][:2]) if 'blade' in sp else None
    def on_blade(c):
        return BL is not None and (seg_dist(c[None], BL[0], BL[1])[0][0] < 0.08 or np.linalg.norm(c - RING) < 0.08)
    def rigid(kind, P, idx):
        if kind == 2: return 'body'               # the crystals on the back are the back's, never the tail's
        if on_blade(P.mean(0)): return 'sting'    # Kharzul: the ring, the hilt and Cinderfang hang from the tail's end
        return bone_of_piece(P)
    def part(P, kind, idx, piece):
        out = np.full(len(P), -1)
        k0 = kind == 0
        out[k0] = idx['body']                    # the back's plates and belly: the body (it bends at the root only)
        out[kind == 2] = idx['body']             # so are the crystals standing out of the plates (the Matriarch, Kharzul)
        for c in np.unique(piece[~k0 & (kind != 2)]):          # each separate shell piece rides the bone it lies along
            m = (piece == c) & ~k0 & (kind != 2)
            if m.sum() < 3: continue
            bn = 'sting' if on_blade(P[m].mean(0)) else bone_of_piece(P[m])
            if bn: out[m] = idx[bn]
        return out
    return B, weigh, rigid, part
