# A coat of tufts sculpted into a body (the foe kit, from Briarmaw, November 20).
#
# Chris: "If you just make it fuzzy with a bunch of little tiny hairs, that'll look fuzzy, but it won't look like it's
# supposed to." So fur, leaves and feathers are big tufts sculpted into ONE surface: at every point of the skin the
# topmost tuft decides the height, so they overlap like shingles, each with a lip at its tip. The same tufts (same
# seed) are used at every level of detail; the levels only add strands:
#   level 0-1  plain leaf-shaped tufts
#   level 2    feather barbs (strands angled out from a midrib), broken tips, saw-toothed sides
#   level 3+   fine strands within the strands
#
# The foe gives (all vectorised over points P, shape (n, 3)):
#   body_sdf(P)          its shape
#   tuft_len(P)          how long the tufts are there (metres); zones of the body
#   flow(P, N)           which way they lie (unit vectors along the surface)
#   bare(P)              where there are none (soles, nose, eyes, mouth...)
#   style(TP, TL, rng)   -> dict(W=widths, H=heights, C=colours (n, 3)) for the tufts at TP with lengths TL
#
# shape: 'tuft'  leaf-feather tufts (fur, leaves, feathers; Briarmaw)
#        'scale' rounded scales with a keel (lizards, fish, serpents, the Wyrm), growth lines at level 3
#        'plate' broad flat plates with bevelled edges (bark, armour plates, shell), cracked at level 2+
import numpy as np
from scipy.spatial import cKDTree
from sdf import mc, project, sstep, tri, vnoise
from geom import sample_surface

class Coat:
    def __init__(self, body_sdf, lo, hi, LV, VOX, tuft_len, flow, bare, style, seed=11, samples=220000,
                 spacing=0.36, strands=(3, 5), shape='tuft', place_ew=0.01, log=print):
        self.body_sdf, self.LV, self.VOX, self.shape = body_sdf, LV, VOX, shape
        self.place_ew = place_ew        # the edge softness of the placing surface: the same at every level
        rng = np.random.default_rng(seed)
        Vc, Fc = mc(body_sdf, 0.02, lo, hi)
        P = sample_surface(Vc, Fc, samples, rng)
        P = P[~bare(P)]
        Lp = tuft_len(P)
        order = np.argsort(-Lp + 0.03 * rng.random(len(P)))       # the big ones first, then fill between
        tree = cKDTree(P); blocked = np.zeros(len(P), bool); take = []
        for i in order:
            if blocked[i]: continue
            take.append(i); blocked[tree.query_ball_point(P[i], spacing * Lp[i])] = True
        TP = P[take]; nT = len(TP)
        TP, TN = project(TP, body_sdf)
        TT = flow(TP, TN); TB = np.cross(TN, TT)
        TL = tuft_len(TP) * (0.85 + 0.3 * rng.random(nT))
        st = style(TP, TL, rng)
        TS = np.round(strands[0] + (strands[1] - strands[0]) * np.clip(TL / 0.4, 0, 1) + rng.integers(0, 2, nT)).astype(int)
        self.TP, self.TN, self.TT, self.TB, self.TL, self.TS = TP, TN, TT, TB, TL, TS
        self.TW, self.TH, self.TC = st['W'], st['H'], st['C']
        self.tree = cKDTree(TP); self.HMAX = float(self.TH.max())
        log('tufts', nT, 'longest', round(float(TL.max()), 3))

    def coat(self, P, want_id=False, lv=None, ew=None):
        """height of the topmost tuft at each point (and which tuft, how far along it, which strand)"""
        LV = self.LV if lv is None else lv
        TP, TT, TB, TN, TL, TW, TH = self.TP, self.TT, self.TB, self.TN, self.TL, self.TW, self.TH
        dist, idx = self.tree.query(P, 12, distance_upper_bound=0.5)
        idx = np.where(np.isfinite(dist), idx, 0)
        D = P[:, None, :] - TP[idx]
        s = np.einsum('nkj,nkj->nk', D, TT[idx]) / TL[idx]
        w = np.einsum('nkj,nkj->nk', D, TB[idx]) / (TW[idx] * 0.5)
        nrm = np.einsum('nkj,nkj->nk', D, TN[idx])
        ss = np.clip((s + 0.2) / 1.2, 0, 1)
        if self.shape != 'tuft': return self._shaped(P, D, s, w, nrm, ss, dist, idx, LV, want_id, ew)
        width = np.sin(np.pi * ss ** 0.62) ** 0.7
        wl = np.abs(w) * TW[idx] * 0.5; sl = s * TL[idx]
        q = (sl - 0.95 * wl) / (0.012 + 0.07 * TL[idx])      # feather barbs: out from the midrib toward the tip
        if LV >= 2:
            tipend = 1 - 0.10 * tri(q + 0.5); jag = 1 - 0.16 * tri(q + 0.5)
        else:
            tipend = np.ones_like(s); jag = 1
        e = np.abs(w) / np.maximum(width * jag, 1e-3)
        ew = ew or max(self.VOX * 1.4, 0.006)
        inside_s = np.clip((tipend - s) * TL[idx] / ew, 0, 1) * np.clip((s + 0.2) * TL[idx] / (ew * 4), 0, 1)
        inside_w = np.clip((1 - e) * TW[idx] * 0.5 / ew, 0, 1)
        dome = np.sqrt(np.clip(1 - e ** 2, 0, 1)) ** 0.6
        ramp = 0.2 + 0.8 * ss ** 1.3
        h = TH[idx] * ramp * dome * inside_s * inside_w
        if LV >= 2:
            h = h * (1 - 0.20 * tri(q + 0.5) ** 2 * sstep(0.05, 0.4, ss))
            h = h * (1 - 0.10 * np.exp(-(wl / 0.006) ** 2) * sstep(0.1, 0.5, ss))
        if LV >= 3:
            h = h * (1 - 0.07 * tri(q * 3 + 0.5) ** 2 * sstep(0.2, 0.7, ss))
        h = np.where(np.abs(nrm) < 0.25, h, 0)
        h = np.where(np.isfinite(dist), h, 0)
        j = np.argmax(h, 1); r = np.arange(len(P))
        if want_id: return h[r, j], idx[r, j], ss[r, j], q[r, j]
        return h[r, j]

    def _shaped(self, P, D, s, w, nrm, ss, dist, idx, LV, want_id, ew=None):
        TL, TW, TH = self.TL, self.TW, self.TH
        ew = ew or max(self.VOX * 1.4, 0.006)
        wl = np.abs(w) * TW[idx] * 0.5; sl = s * TL[idx]
        if self.shape == 'scale':
            # an oval scale, rising to its free edge, a keel down the middle
            u = (ss * 2 - 1); e = np.sqrt(u * u + w * w)
            inside = np.clip((1 - e) * np.minimum(TL[idx], TW[idx]) * 0.5 / ew, 0, 1)
            h = TH[idx] * (0.25 + 0.75 * ss ** 1.2) * np.sqrt(np.clip(1 - e * e, 0, 1)) ** 0.4 * inside
            if LV >= 2: h = h * (1 + 0.18 * np.exp(-(wl / 0.008) ** 2) * ss)
            if LV >= 3: h = h * (1 - 0.06 * tri(sl / 0.009) ** 2)
            q = sl / 0.009
        else:
            # a plate: nearly flat on top, bevelled at the edges, rounded corners
            u = np.abs(ss * 2 - 1); e = (u ** 4 + np.abs(w) ** 4) ** 0.25
            inside = np.clip((1 - e) * np.minimum(TL[idx], TW[idx]) * 0.5 / ew, 0, 1)
            bevel = np.clip((1 - e) * 5, 0, 1) ** 0.5
            h = TH[idx] * (0.6 + 0.4 * ss) * bevel * inside
            q = np.zeros_like(h)
            if LV >= 2:
                crack = np.abs(np.sin(P[:, None, 0] * 61 + P[:, None, 1] * 37 + 3 * np.sin(P[:, None, 2] * 23)))
                h = h * (1 - 0.18 * np.exp(-(crack / 0.06) ** 2))
                q = crack
        h = np.where(np.abs(nrm) < 0.25, h, 0); h = np.where(np.isfinite(dist), h, 0)
        j = np.argmax(h, 1); r = np.arange(len(P))
        if want_id: return h[r, j], idx[r, j], ss[r, j], q[r, j]
        return h[r, j]

    def _with(self, P, lv, grain, ew=None):
        d = self.body_sdf(P)
        band = np.abs(d) < self.HMAX + 0.04
        if band.any():
            d = d.copy(); d[band] -= self.coat(P[band], lv=lv, ew=ew)
        if grain and self.LV >= 3: d = d - 0.0025 * (vnoise(P, 90.0) - 0.5)
        if grain and self.LV >= 4: d = d - 0.0014 * (vnoise(P + 5.1, 210.0) - 0.5)
        return d
    def full_sdf(self, P):
        """the body with its coat at this level (what is meshed)"""
        return self._with(P, None, True)
    def place_sdf(self, P):
        """the coat without its fine strands: place parts on this, so they sit the same at every level (or the bake
        misses them)"""
        return self._with(P, 1, False, ew=self.place_ew)

    def colours(self, V, bare_colour):
        """per-vertex colour of the coat: each tuft dark at its root, lighter to the tip, the partings darker, the
        crevices between tufts dark; elsewhere bare_colour (n, 3). Returns colours and the tuft height there."""
        top, tid, ts, tq = self.coat(V, True)
        has = top > 0.002
        col = np.asarray(bare_colour, np.float64).copy()
        shade = 0.50 + 0.65 * ts ** 0.9
        if self.LV >= 2 and self.shape == 'tuft': shade = shade * (1 - 0.25 * tri(tq + 0.5) ** 3)
        col[has] = self.TC[tid[has]] * shade[has, None] + (np.clip((ts[has] - 0.6) * 2.5, 0, 1) * 0.12)[:, None] * np.array([1, 1, 0.2])
        return col, top, has
