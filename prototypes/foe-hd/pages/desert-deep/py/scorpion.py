# A scorpion, built from measurements off its sheet (Places' desert-and-deep lane, November 21): the glass-scorpion, the
# Glass Matriarch and Kharzul share it. A scorpion is all hard shell, so every segment is its own RIGID piece (kind 8)
# riding one bone: the shell plates of the back, the carapace, each tail segment and the sting, each piece of each leg
# and pincer. Pieces overlap a little at their joints, as a real one's do, so nothing ever stretches; only the back
# (kind 0, the bake's main surface) bends a little between its plates.
#
#   from scorpion import build_scorpion, SPEC
#   build_scorpion(K, spec)   spec: a dict of measurements in sheet pixels (see glass-scorpion's foe sculpt.py) and a style:
#     'glass'   smooth clouded glass, rimmed plates, dark amber joints (the glass-scorpion)
#     'crystal' faceted crystal plates, crystal spikes along the back, copper claw tips and sting (the Matriarch)
import math
import numpy as np

def build_scorpion(K, sp):
    Sd, G, LV, VOX, SIDES, SEG, log = K.sdf, K.geom, K.LV, K.VOX, K.SIDES, K.SEG, K.log
    smin, smax, ell, cap, fbm, mix, sstep = Sd.smin, Sd.smax, Sd.ell, Sd.cap, Sd.fbm, Sd.mix, Sd.sstep
    S, MID, GROUND = sp['S'], sp['MID'], sp['GROUND']
    def p(px, py, x=0.0): return np.array([x, (px - MID) * S, (GROUND - py) * S], float)
    M = K.Mesh()
    crystal = sp.get('style') == 'crystal'
    GLASS, AMBER, JOINT = np.array(sp['glass']), np.array(sp['amber']), np.array(sp['joint'])
    TIP = np.array(sp.get('tip', sp['amber']))
    MAT_G = (0.18, 0.0) if not crystal else (0.12, 0.05)
    MAT_T = (0.3, 0.6) if crystal else MAT_G
    rng = np.random.default_rng(sp.get('seed', 5))
    VS = VOX * sp.get('vox_scale', 1.0)

    def facets(n, seed):
        r = np.random.default_rng(seed); d = r.normal(size=(n, 3)); return d / np.linalg.norm(d, axis=1, keepdims=True)
    def shade(V, c, a, b, base, edge):
        """glass: lighter in the middle, amber toward the ends and edges (clouded glass), a little cloud in it"""
        u = np.clip(((V - a) @ (b - a)) / ((b - a) @ (b - a)), 0, 1)
        e = np.abs(u - 0.5) * 2
        col = mix(base, edge, (e ** 2.2)[:, None] * 0.8)
        col = col * (0.9 + 0.2 * fbm(V * (40 / max(S * 570, 0.3)), 2.0))[:, None]
        return np.clip(col, 0, 1)

    def segment(a, b, r, h=None, kind=8, nfacet=0, seed=0, flat=1.0, rim=True, col=None):
        """one shell segment from a to b: an ellipsoid (glass) or a faceted crystal (crystal), its own rigid piece,
        a raised rim round its back edge"""
        a = np.asarray(a, float); b = np.asarray(b, float); c = (a + b) / 2; L = np.linalg.norm(b - a); ax = (b - a) / L
        h = h or r
        up = np.array([0, 0, 1.0]) - ax * ax[2]; up /= np.linalg.norm(up) + 1e-9; side = np.cross(ax, up)
        R = np.stack([side, ax, up], 1)
        rad = np.array([r * flat, L * 0.55, h])
        def f(P):
            Q = (P - c) @ R
            d = ell(Q, (0, 0, 0), rad)
            if nfacet:
                pl = (Q / rad) @ FN.T - FO
                d = smax(d, (pl.max(1) * min(rad)).astype(np.float32), min(rad) * 0.08)
            if rim and LV >= 1:       # a raised rim round the back edge, a groove inside it
                q = Q[:, 1] / rad[1]
                d = d - 0.035 * min(rad) * np.exp(-((q + 0.78) / 0.07) ** 2) + 0.02 * min(rad) * np.exp(-((q + 0.62) / 0.05) ** 2)
            return d
        if nfacet:
            FN = facets(nfacet, seed); FO = 0.82 + 0.1 * np.random.default_rng(seed + 1).random(nfacet)
        ext = np.max(rad) * 1.25
        lo = c - ext; hi = c + ext
        vs = min(VS, max(min(rad) / 5, VS * 0.5)) if LV > 0 else max(VS * 0.8, min(rad) / 2.6)     # light: coarse pieces
        V, F = Sd.mc(f, vs, lo, hi)
        if len(F) == 0: return
        M.add(V, F, shade(V, c, a, b, GLASS, AMBER) if col is None else col, kind, mat=MAT_G)

    def joint(c, r, kind=8):
        V, F = G.ellipsoid(c, [r, r, r], {0: 6, 1: 8, 2: 12, 3: 18}.get(LV, 18), {0: 8, 1: 12, 2: 18, 3: 26}.get(LV, 26))
        M.add(V, F, JOINT, kind, mat=(0.4, 0.1))

    def limb(pts, radii, tipcol=None):
        """a leg or arm: a shell tube per segment (each its own piece), a dark knob at each joint"""
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]; r0, r1 = radii[i], radii[i + 1]
            n = {0: 4, 1: 6, 2: 10, 3: 16}.get(LV, 16)
            path = G.resample(np.array([a + (b - a) * 0.04, b - (b - a) * 0.04]), n)
            t = np.linspace(0, 1, n)
            rr = r0 + (r1 - r0) * t; rr = rr * (1 + 0.18 * np.sin(np.pi * t) ** 0.8)       # each segment swells a little
            last = i == len(pts) - 2 and tipcol is not None
            if last:   # the last segment tapers to a point (the foot's claw)
                rr = rr * (1 - 0.85 * t ** 1.6)
            V, F = G.tube(path, rr, SIDES + (6 if crystal else 0) if not crystal else max(5, SIDES // 2 + 2))
            col = shade(V, (a + b) / 2, a, b, GLASS, AMBER)
            if last: col = mix(col, tipcol, np.clip((V - a) @ (b - a) / ((b - a) @ (b - a)) * 1.8 - 0.6, 0, 1)[:, None])
            M.add(V, F, col, 8, mat=MAT_T if last else MAT_G)
            if i > 0: joint(a, max(r0, 0.004) * 1.05)

    # ---- the back: the plates of the body, kind 0 (one surface, bending a little between plates) --------------------
    log('back, carapace, tail, pincers, legs')
    PL = sp['plates']          # [(sheet x of the plate's middle, middle height, half height px, half width m, half length px)]
    def back_sdf(P):
        """each plate a rounded slab cut flat front and back, its rear edge lifted a little (shingles); a long belly
        hull under them"""
        d = np.full(len(P), 9.0, np.float32)
        for i, (px, py, hh, hw, hl) in enumerate(PL):
            c = p(px, py); dy = P[:, 1] - c[1]
            Q = P.copy(); Q[:, 2] = Q[:, 2] + np.clip(-dy, 0, None) * 0.35        # the rear edge stands up
            e = ell(Q, c, (hw, hl * S * 2.4, hh * S))
            if crystal:   # faceted: flat-topped, ridged down the middle
                e = smax(e, (np.abs(P[:, 0]) * 0.45 + (P[:, 2] - c[2]) - hh * S * 0.78).astype(np.float32), hh * S * 0.08)
            e = smax(e, (np.abs(dy) - hl * S * 1.08).astype(np.float32), 0.004)
            d = np.minimum(d, e)
        c0, c1 = p(PL[0][0], PL[0][1] + PL[0][2] * 0.3), p(PL[-1][0], PL[-1][1] + PL[-1][2] * 0.3)
        mid = PL[len(PL) // 2]
        d = smin(d, cap(P, c0, c1, PL[0][2] * S * 0.6, PL[-1][2] * S * 0.6, scale=(mid[3] / (mid[2] * S) * 0.85, 1, 1)), 0.006)
        return d
    lo = np.array([-0.2, (PL[0][0] - PL[0][4] * 1.4 - MID) * S, 0.0]) * [sp['width'] / 0.2, 1, 1]
    hi = np.array([0.2 * sp['width'] / 0.2, (PL[-1][0] + PL[-1][4] * 1.4 - MID) * S, (GROUND - min(q[1] - q[2] for q in PL) + 20) * S])
    Vb, Fb = Sd.mc(back_sdf, VS, lo, hi, band=0.01 if LV >= 2 else None)
    yy = Vb[:, 1] / S + MID
    seg_i = np.array([np.argmin([abs(v - q[0]) for q in PL]) for v in yy[::max(1, len(yy) // 20000)]])
    col = np.tile(GLASS, (len(Vb), 1))
    # each plate lighter in its middle and amber at its edges; the underside darker amber
    for px, py, hh, hw, hl in PL:
        m = np.abs(yy - px) < hl * 1.05
        u = np.abs(yy[m] - px) / (hl * 1.05)
        col[m] = mix(GLASS, AMBER, (u ** 2.5)[:, None] * 0.75)
    col = mix(col, JOINT * 1.2, sstep(0.55, 0.2, (Vb[:, 2] - (GROUND - PL[len(PL) // 2][1]) * S) / (PL[len(PL) // 2][2] * S) + 0.6)[:, None] * 0.6)
    col = col * (0.9 + 0.2 * fbm(Vb * 30, 2.0))[:, None]
    M.add(Vb, Fb, np.clip(col, 0, 1), 0, mat=MAT_G)
    log('back tris', len(Fb))

    # ---- the carapace (head): a domed shield with the eyes on top, mouthparts below --------------------------------
    ca, cb = p(*sp['carapace'][0]), p(*sp['carapace'][1])
    segment(ca, cb, sp['carapace'][2], h=sp['carapace'][3], nfacet=14 if crystal else 0, seed=3, flat=1.0)
    for s in (1, -1):
        e = p(*sp['eyes'], s * sp['eye_x'])
        V, F = G.ellipsoid(e, [0.012 * sp['k'], 0.012 * sp['k'], 0.01 * sp['k']], 10, 14)
        M.add(V, F, np.array([0.05, 0.03, 0.02]), 7, mat=(0.1, 0.0))
        for j in range(2):     # the mouth's little pincers (chelicerae)
            m0 = p(sp['carapace'][1][0] - 5, sp['carapace'][1][1] + 12, s * 0.018 * sp['k'])
            V, F = G.horn(m0, [s * 0.2, 1, -0.4 - 0.3 * j], 0.035 * sp['k'], 0.008 * sp['k'], [0, 0, -1], 0.4, SEG, SIDES)
            M.add(V, F, mix(AMBER, JOINT, 0.5), 8, mat=MAT_G)

    # ---- the tail: segments along the curve over the back, a bulb and the hooked sting ----------------------------
    TJ = [p(*j) for j in sp['tail']]; TR = [r * S for r in sp['tail_r']]
    for i in range(len(TJ) - 1):
        a, b = TJ[i], TJ[i + 1]
        if i == len(TJ) - 2:          # the bulb, then the sting
            segment(a, b, TR[i], nfacet=10 if crystal else 0, seed=40 + i, rim=False)
            tip = p(*sp['sting']); d = b - a; d /= np.linalg.norm(d)
            V, F = G.horn(b - d * TR[i] * 0.4, d * 0.7 + (tip - b) / np.linalg.norm(tip - b) * 0.3, np.linalg.norm(tip - b) * 1.15, TR[i] * 0.55,
                          tip - b, 0.55, SEG + 4, SIDES)
            M.add(V, F, mix(AMBER, TIP, np.clip((V - b) @ (tip - b) / ((tip - b) @ (tip - b)), 0, 1)[:, None]), 6, mat=MAT_T)
        else:
            segment(a - (b - a) * 0.06, b + (b - a) * 0.06, TR[i], nfacet=12 if crystal else 0, seed=20 + i)
            joint(b, TR[i] * 0.55)
    # crystal spikes along the back (the Matriarch, Kharzul)
    for px, py, L in sp.get('spikes', []):
        for xx in ([0] if abs(L) > 1 else [0]):
            pass
    for (px, py, x, L) in sp.get('spikes', []):
        base = p(px, py, x * S)
        V, F = G.horn(base, [x * 0.004, 0, 1], L * S, L * S * 0.32, [0, 0, 1], 0.0, 4, 6)
        M.add(V, F, np.array(sp['spike']), 7, mat=(0.1, 0.1))

    # ---- the pincers: arm, forearm, the claw's palm with its fixed finger, and the moving finger --------------------
    for s in (1, -1):
        A = [p(px, py, s * x) for px, py, x in sp['arm']]
        limb(A, [r * S for r in sp['arm_r']])
        joint(A[0], sp['arm_r'][0] * S * 1.1)
        palm_a, palm_b = p(*sp['palm'][0][:2], s * sp['palm'][0][2]), p(*sp['palm'][1][:2], s * sp['palm'][1][2])
        segment(palm_a, palm_b, sp['palm'][2] * S, h=sp['palm'][3] * S, nfacet=12 if crystal else 0, seed=60 + (s > 0), rim=False)
        for nm, (b0, t0, r0) in (('fixed', sp['finger_fixed']), ('moving', sp['finger_moving'])):
            base = p(*b0[:2], s * b0[2]); tip = p(*t0[:2], s * t0[2])
            d = (tip - base) / np.linalg.norm(tip - base)
            bend = np.array([0, 0, 1.0 if nm == 'fixed' else -1.0])
            V, F = G.horn(base, d, np.linalg.norm(tip - base) * 1.05, r0 * S, bend, 0.22, SEG + 4, SIDES, power=0.5)
            uu = np.clip((V - base) @ d / np.linalg.norm(tip - base), 0, 1)
            M.add(V, F, mix(shade(V, base, base, tip, GLASS, AMBER), TIP, (uu ** 3)[:, None]), 6, mat=MAT_T)
            if LV >= 1:     # teeth along the inner edge
                for k in range(5):
                    u_ = 0.2 + 0.13 * k; q = base + (tip - base) * u_ + bend * r0 * S * 0.75 * (1 - u_) ** 0.5     # on the inner edge
                    V, F = G.horn(q, bend + d * 0.5, r0 * S * 0.5, r0 * S * 0.2, d, 0.1, max(4, SEG - 4), max(5, SIDES - 4))
                    M.add(V, F, AMBER, 6, mat=MAT_G)

    # ---- the legs: four a side ------------------------------------------------------------------------------------------
    for s in (1, -1):
        for (h, k, a_, t) in sp['legs']:
            pts = [p(h[0], h[1], s * h[2]), p(k[0], k[1], s * k[2]), p(a_[0], a_[1], s * a_[2]), p(t[0], t[1], s * t[2])]
            limb(pts, [r * S for r in sp['leg_r']], tipcol=TIP)
            joint(pts[0], sp['leg_r'][0] * S)
    return M
