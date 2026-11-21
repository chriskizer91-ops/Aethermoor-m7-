# Weights by part (Chris, November 21: "when they move their arms they stretch themselves"; the rules are in
# docs/project/jobs/foes.md, "No stretching"). Used by kit/blender/bake.py and kit/tools/rebind.py; pure numpy.
#
# Every point of the light model belongs to ONE part (one bone), and takes weight only from that bone, and from the
# bone on the other side of one of its own joints, inside a narrow band round that joint:
#
#   1. Each point's part: the rig's part(P, kind, idx) where it says (a bone index, or -1 for "you choose"), else the
#      nearest bone after the template's weigh() gating (side, height, front and back) that the point can SEE: the
#      straight line from the point to the bone runs inside the body (as Blender's bone heat does). From a belly point
#      the line to a paw crosses the air between the legs, so the belly can't be paw.
#   2. Each rigid piece (kinds 2 thorn, 5 tusk, 6 claw, 7 eye, 8 rigid) is one part: rigid(kind, P, idx), or the part
#      where its root meets the body. It takes no blending at all.
#   3. The parts are cleaned on the mesh: lone points take their neighbours' part; a point behind its bone's joint
#      (on the parent's side of it) or far from its bone (much farther than the bone's other points) goes to the
#      parent. So hips, belt and straps under a hanging arm stay with the trunk.
#      A limb's first bone takes no point farther from it than 1.8 times the thickness of the limb's next bone (a
#      wide body's belly is nearer a leg bone than the spine, but it isn't leg).
#   4. Where two limbs merely touch in the sculpt (two boots, a hand on a thigh, a beard on a leg), the light mesh is
#      joined across them; those few triangles are cut (parts more than one joint apart, neither in the trunk).
#      TRUNK: the bones down the middle (default: the root and the bones the limbs branch from); a rig may set it.
#   5. Each joint blends its two parts in a band of half-width w across the joint, and only within a ball of radius R
#      round it (w and R from the thickness of the limb; a rig may set BANDS = {bone: w or (w, R)}).
#   6. The weights are smoothed over the surface a few passes (never across a cut), so each change of part is spread
#      over a few centimetres. Smoothing runs along the skin, not through the air, so it can't bleed across a gap.
#
# So an arm bone moves arm points only, and the shoulder band; nothing on the far side of the trunk, nothing on the
# belt. kit/tools/stretch.mjs checks the result in every move.
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from common import seg_dist

RIGID_KINDS = (2, 5, 6, 7, 8)

def sstep(a, b, x):
    t = np.clip((x - a) / np.maximum(b - a, 1e-9), 0, 1)
    return t * t * (3 - 2 * t)

def solid(Pw, tris_w, h, lo):
    """the inside of the mesh as voxels of size h: the surface drawn in, the closed hollows filled"""
    from scipy.ndimage import binary_fill_holes, binary_dilation
    hi = Pw.max(0) + 3 * h
    shape = np.ceil((hi - lo) / h).astype(int) + 1
    S = np.zeros(shape, bool)
    A, B, C = Pw[tris_w[:, 0]], Pw[tris_w[:, 1]], Pw[tris_w[:, 2]]
    e = np.maximum(np.linalg.norm(B - A, axis=1), np.maximum(np.linalg.norm(C - B, axis=1), np.linalg.norm(A - C, axis=1)))
    k = np.clip(np.ceil(e / (0.5 * h)).astype(int), 1, 64)
    for n in np.unique(k):
        m = k == n
        g = np.array([(i / n, j / n) for i in range(n + 1) for j in range(n + 1 - i)])
        X = A[m, None] + g[None, :, :1] * (B[m, None] - A[m, None]) + g[None, :, 1:] * (C[m, None] - A[m, None])
        ii = np.floor((X.reshape(-1, 3) - lo) / h).astype(int)
        S[ii[:, 0], ii[:, 1], ii[:, 2]] = True
    S = binary_dilation(S)                            # close pinholes a voxel wide
    return binary_fill_holes(S)

def sight(Pw, wid, tris, H, T, height, steps=40):
    """(n, bones) bool: whether the line from each point to the nearest point of each bone stays inside the body"""
    h = height / 140
    tw = wid[tris]; tw = tw[(tw[:, 0] != tw[:, 1]) & (tw[:, 1] != tw[:, 2]) & (tw[:, 0] != tw[:, 2])]
    lo = Pw.min(0) - 3 * h
    S = solid(Pw, tw, h, lo)
    shape = np.array(S.shape)
    nb = len(H); out = np.zeros((len(Pw), nb), bool)
    t = np.linspace(0, 1, steps)
    for b in range(nb):
        ab = T[b] - H[b]
        u = np.clip(((Pw - H[b]) @ ab) / max(float(ab @ ab), 1e-12), 0, 1)
        Q = H[b] + u[:, None] * ab
        d = np.linalg.norm(Q - Pw, axis=1)
        for c0 in range(0, len(Pw), 20000):
            P_, Q_, d_ = Pw[c0:c0 + 20000], Q[c0:c0 + 20000], d[c0:c0 + 20000]
            X = P_[:, None] + t[None, :, None] * (Q_ - P_)[:, None]
            ii = np.clip(np.floor((X - lo) / h).astype(int), 0, shape - 1)
            inside = S[ii[..., 0], ii[..., 1], ii[..., 2]]
            near = (t[None, :] * d_[:, None]) < 2.0 * h          # the first steps leave the surface
            ok = inside | near
            out[c0:c0 + 20000, b] = ok.mean(1) >= 0.95
    return out

def bind(RIG, P, kind, tris, height, mid, log=print):
    """P: points in sculpt coordinates (n, 3), kind: their kinds (n,), tris: triangles (m, 3) indexing P (UV seams may
    split points; they are welded here), mid: the middle of the foe's bounds. Returns skinIndex (n, 4) uint16,
    skinWeight (n, 4) float32, each point's part (n,) and which triangles to keep (m,) bool."""
    BONES = RIG.BONES
    names = [b[0] for b in BONES]; idx = {n: i for i, n in enumerate(names)}; nb = len(BONES)
    par = np.array([idx[b[1]] if b[1] else -1 for b in BONES])
    kids = [[c for c in range(nb) if par[c] == b] for b in range(nb)]
    # the trunk: the root, the bones limbs branch from, and the bones between them
    def subtree_branches(b): return len(kids[b]) >= 2 or any(subtree_branches(c) for c in kids[b])
    trunk = set(idx[n] for n in getattr(RIG, 'TRUNK', ())) or \
        set(b for b in range(nb) if par[b] < 0 or subtree_branches(b))
    def chain(b):                                   # the bones from b up to the root
        out = [b]
        while par[out[-1]] >= 0: out.append(par[out[-1]])
        return out
    up = [chain(b) for b in range(nb)]
    def apart(a, b):                                # joints between two bones
        ca, cb = up[a], up[b]; common = next(x for x in ca if x in cb)
        return ca.index(common) + cb.index(common)
    H = np.array([b[2] for b in BONES], np.float64); T = np.array([b[3] for b in BONES], np.float64)
    L = np.maximum(np.linalg.norm(T - H, axis=1), 1e-6); Dn = (T - H) / L[:, None]

    # weld the points split at UV seams, and join them by the triangles' edges
    q = np.round(np.asarray(P, np.float64) / (height * 2e-4)).astype(np.int64)
    _, first, wid = np.unique(q, axis=0, return_index=True, return_inverse=True)
    wid = wid.ravel(); nw = len(first)
    Pw = np.asarray(P, np.float64)[first]; Kw = np.asarray(kind)[first]
    E = wid[np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]])]
    E = E[E[:, 0] != E[:, 1]]
    A = coo_matrix((np.ones(len(E), np.float32), (E[:, 0], E[:, 1])), shape=(nw, nw)).tocsr()
    A = ((A + A.T) > 0).astype(np.float32)

    # 1. parts
    D = np.stack([seg_dist(Pw, H[i], T[i]) for i in range(nb)], 1)
    Dg = RIG.weigh(D.copy(), Pw, idx) if hasattr(RIG, 'weigh') else D.copy()
    seen = sight(Pw, wid, tris, H, T, height)
    Dg[~seen] += 100.0                               # a bone it can't see only if it sees none
    lab = np.argmin(Dg, 1)
    if hasattr(RIG, 'part'):
        own = np.asarray(RIG.part(Pw, Kw, idx)); lab = np.where(own >= 0, own, lab)
    fixed = np.zeros(nw, bool) if not hasattr(RIG, 'part') else own >= 0

    # 2. rigid pieces: one part each
    ncomp, comp = connected_components(A, directed=False)
    rigid = np.isin(Kw, RIGID_KINDS)
    for c in np.unique(comp[rigid]):
        m = comp == c
        if not rigid[m].mean() > 0.5: continue
        Pc = Pw[m]
        ctr = np.array([0, np.clip(Pc[:, 1].mean(), mid[1] - 0.7 * abs(mid[1] - Pw[:, 1].min()), mid[1] + 0.7 * abs(Pw[:, 1].max() - mid[1])), mid[2]])
        root = np.argmin(np.linalg.norm(Pc - ctr, axis=1))
        bone = RIG.rigid(int(Kw[m][0]), Pc, idx) if hasattr(RIG, 'rigid') else None
        lab[m] = idx[bone] if bone else lab[np.flatnonzero(m)[root]]
    fixed |= rigid
    free = ~fixed

    log(f'each point sees {seen.sum(1).mean():.1f} bones on average; {int((~seen.any(1)).sum())} see none')

    def smooth(lab, it=3):
        for _ in range(it):
            oh = coo_matrix((np.ones(nw, np.float32), (np.arange(nw), lab)), shape=(nw, nb)).tocsr()
            cnt = np.asarray((A @ oh + oh).todense())
            new = np.argmax(cnt, 1)
            better = cnt[np.arange(nw), new] > cnt[np.arange(nw), lab]
            lab = np.where(free & better, new, lab)
        return lab

    def radii(lab):
        r = np.zeros(nb)
        for b in range(nb):
            m = (lab == b) & ~rigid
            r[b] = np.median(D[m, b]) if m.sum() > 8 else 0.04 * height
        return np.maximum(r, 0.01 * height)

    lab = smooth(lab)
    # 3. behind its joint, or far from its bone: to the parent
    BAND = getattr(RIG, 'BANDS', {})
    loose = set(getattr(RIG, 'LOOSE', ()))          # bones whose points may lie far from them (a cap, a mane)
    for _ in range(3):
        r = radii(lab)
        w = np.array([max(0.6 * r[b], 0.08 * L[b]) for b in range(nb)])
        for b in range(nb):
            if par[b] < 0: continue
            m = free & (lab == b)
            if not m.any(): continue
            s = (Pw[m] - H[b]) @ Dn[b]
            far = (D[m, b] > 2.5 * r[b]) & (names[b] not in loose)
            if b not in trunk and par[b] in trunk and len(kids[b]) == 1:     # a limb's first bone: the limb's thickness
                c = kids[b][0]; mc = (lab == c) & ~rigid
                if mc.sum() > 8: far |= D[m, b] > 1.8 * np.percentile(D[mc, c], 75)
            back = s < -w[b]
            ii = np.flatnonzero(m)[back | far]
            lab[ii] = par[b]
        lab = smooth(lab, 2)

    # 4. the bands
    r = radii(lab)
    w = np.array([max(0.6 * r[b], 0.08 * L[b]) for b in range(nb)])
    R = 1.6 * r + w
    for n, v in BAND.items():
        if isinstance(v, (tuple, list)): w[idx[n]], R[idx[n]] = v
        else: w[idx[n]] = v; R[idx[n]] = 1.6 * r[idx[n]] + v
    Wd = np.zeros((nw, nb))

    def share(b, X):                                 # how much of a point lies past joint b (into bone b)
        s = (X - H[b]) @ Dn[b]; d = np.linalg.norm(X - H[b], axis=1)
        return sstep(-w[b], w[b], s), 1 - sstep(R[b], 1.5 * R[b], d)

    for b in range(nb):
        m = lab == b
        if not m.any(): continue
        ii = np.flatnonzero(m); X = Pw[ii]
        own = np.ones(len(ii)); blend = free[ii]
        if par[b] >= 0:
            f, near = share(b, X)
            mp = np.where(blend, (1 - f) * near, 0.0)
            Wd[ii, par[b]] += mp; own -= mp
        for c in kids[b]:
            f, near = share(c, X)
            g = np.where(blend, f * near, 0.0)
            Wd[ii, c] += own * g; own *= 1 - g
        Wd[ii, b] += own

    # cut where parts merely touch (by the bone that moves each point most): parts three or more joints apart, or two
    # apart when neither is in the trunk (two boots, a hand on a thigh, a skirt of fur on a lower leg)
    main = np.argmax(Wd, 1)
    lt = main[wid][tris]
    cut = np.zeros(len(tris), bool)
    for e in range(3):
        a, b = lt[:, e], lt[:, (e + 1) % 3]
        dif = np.flatnonzero(a != b)
        far = np.array([(lambda j: j >= 3 or (j >= 2 and x not in trunk and y not in trunk))(apart(x, y))
                        for x, y in zip(a[dif], b[dif])], bool)
        cut[dif[far]] = True
    if cut.any(): log(f'cut {int(cut.sum())} triangles where parts touch')

    # smooth the weights over the surface (not across a cut): the change from one part to the next is spread over a
    # few centimetres, so no single edge takes it. SMOOTH = passes (default 8); each spreads about an edge further.
    tk = wid[tris[~cut]]
    E2 = np.concatenate([tk[:, [0, 1]], tk[:, [1, 2]], tk[:, [2, 0]]]); E2 = E2[E2[:, 0] != E2[:, 1]]
    A2 = coo_matrix((np.ones(len(E2)), (E2[:, 0], E2[:, 1])), shape=(nw, nw)).tocsr()
    A2 = ((A2 + A2.T) > 0).astype(np.float64)
    deg = np.asarray(A2.sum(1)).ravel()
    for _ in range(int(getattr(RIG, 'SMOOTH', __import__('os').environ.get('BIND_SMOOTH', 8)))):
        avg = (A2 @ Wd) / np.maximum(deg, 1)[:, None]
        Wd[free & (deg > 0)] = 0.5 * Wd[free & (deg > 0)] + 0.5 * avg[free & (deg > 0)]

    top = np.argsort(-Wd, 1)[:, :4]
    Wt = np.take_along_axis(Wd, top, 1); Wt /= Wt.sum(1, keepdims=True)
    counts = np.bincount(lab, minlength=nb)
    log('weights by part: ' + ', '.join(f'{names[b]} {counts[b]}' for b in range(nb)))
    return top[wid].astype(np.uint16), Wt[wid].astype(np.float32), lab[wid], ~cut
